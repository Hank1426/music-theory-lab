import { describe, expect, it } from 'vitest';
import {
  formatPercent,
  formatSeconds,
  HistoryStore,
  mistakeLines,
  stars,
  totals,
  type KeyValueStore,
  type SessionRecord,
} from './history';
import type { ItemRecord } from './session';

function memoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  };
}

const item = (target: string, pressed: string[], hinted = false): ItemRecord => ({
  target,
  pressed,
  hinted,
  firstPressCorrect: !hinted && pressed.length === 1 && pressed[0] === target,
  rtMs: 500,
});

function record(startedAt: number, total: number, correct: number): SessionRecord {
  return {
    id: String(startedAt),
    startedAt,
    durationMs: 10000,
    presetId: 'small1',
    presetName: '小字一组',
    mode: 'default',
    totalCount: total,
    correctCount: correct,
    hintCount: 0,
    items: Array.from({ length: total }, (_, i) => item('C4', i < correct ? ['C4'] : ['D4', 'C4'])),
  };
}

describe('result formatting', () => {
  it('formats accuracy and duration like the reference app', () => {
    expect(formatPercent(6 / 7)).toBe('85.7%');
    expect(formatPercent(1)).toBe('100.0%');
    expect(formatSeconds(17219)).toBe('17.219');
  });

  it('maps accuracy to stars', () => {
    expect(stars(1)).toBe(5);
    expect(stars(0.95)).toBe(5);
    expect(stars(6 / 7)).toBe(4);
    expect(stars(0.7)).toBe(3);
    expect(stars(0.5)).toBe(2);
    expect(stars(0.49)).toBe(1);
  });
});

describe('mistakeLines', () => {
  it('describes a single wrong choice', () => {
    const items = [item('B4', ['B4']), item('A4', ['B4', 'A4'])];
    expect(mistakeLines(items)).toEqual(['第2题：正确答案是 a1，但是选择了 b1']);
  });

  it('joins multiple wrong choices and marks hints', () => {
    const items = [item('A4', ['B4', 'G4', 'A4'], true)];
    expect(mistakeLines(items)).toEqual(['第1题：正确答案是 a1，但是选择了 b1、g1（使用了提示）']);
  });

  it('describes a hint without wrong presses', () => {
    expect(mistakeLines([item('C3', ['C3'], true)])).toEqual(['第1题：正确答案是 c（使用了提示）']);
  });

  it('omits first-press-correct questions', () => {
    expect(mistakeLines([item('C4', ['C4'])])).toEqual([]);
  });
});

describe('totals', () => {
  it('aggregates questions, sessions and accuracy', () => {
    const t = totals([record(1, 7, 6), record(2, 7, 7)]);
    expect(t.questions).toBe(14);
    expect(t.sessions).toBe(2);
    expect(formatPercent(t.accuracy)).toBe('92.9%');
  });

  it('is zero when empty', () => {
    expect(totals([])).toEqual({ questions: 0, sessions: 0, accuracy: 0 });
  });
});

describe('HistoryStore', () => {
  it('persists records and lists newest first', () => {
    const kv = memoryStore();
    new HistoryStore(kv).add(record(1, 7, 6));
    new HistoryStore(kv).add(record(3, 7, 7));
    new HistoryStore(kv).add(record(2, 7, 5));
    const list = new HistoryStore(kv).listNewestFirst();
    expect(list.map((r) => r.startedAt)).toEqual([3, 2, 1]);
    expect(list[0].items).toHaveLength(7);
  });

  it('clears everything', () => {
    const kv = memoryStore();
    const store = new HistoryStore(kv);
    store.add(record(1, 7, 6));
    store.clear();
    expect(store.list()).toEqual([]);
    expect(totals(store.list()).sessions).toBe(0);
  });

  it('survives corrupted data', () => {
    const kv = memoryStore();
    kv.setItem('mtl.sessions.v1', '{not json');
    expect(new HistoryStore(kv).list()).toEqual([]);
  });
});
