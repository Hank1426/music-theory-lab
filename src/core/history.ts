import type { EndMode, ItemRecord } from './session';
import { noteById } from './notes';

export interface SessionRecord {
  id: string;
  startedAt: number;
  durationMs: number;
  presetId: string;
  presetName: string;
  mode: EndMode;
  totalCount: number;
  correctCount: number;
  hintCount: number;
  items: ItemRecord[];
}

export function accuracy(correct: number, total: number): number {
  return total === 0 ? 0 : correct / total;
}

export function formatPercent(ratio: number): string {
  return `${(Math.round(ratio * 1000) / 10).toFixed(1)}%`;
}

export function formatSeconds(ms: number): string {
  return (ms / 1000).toFixed(3);
}

export function stars(ratio: number): number {
  const pct = Math.round(ratio * 1000) / 10;
  if (pct >= 95) return 5;
  if (pct >= 85) return 4;
  if (pct >= 70) return 3;
  if (pct >= 50) return 2;
  return 1;
}

export function mistakeLines(items: readonly ItemRecord[]): string[] {
  const lines: string[] = [];
  items.forEach((item, i) => {
    if (item.firstPressCorrect) return;
    const target = noteById(item.target).cn;
    const wrong = [...new Set(item.pressed.filter((p) => p !== item.target))].map((p) => noteById(p).cn);
    let line = `第${i + 1}题：正确答案是 ${target}`;
    if (wrong.length > 0) line += `，但是选择了 ${wrong.join('、')}`;
    if (item.hinted) line += '（使用了提示）';
    lines.push(line);
  });
  return lines;
}

export interface Totals {
  questions: number;
  sessions: number;
  accuracy: number;
}

export function totals(records: readonly SessionRecord[]): Totals {
  const questions = records.reduce((s, r) => s + r.items.length, 0);
  const correct = records.reduce((s, r) => s + r.correctCount, 0);
  const total = records.reduce((s, r) => s + r.totalCount, 0);
  return { questions, sessions: records.length, accuracy: accuracy(correct, total) };
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEY = 'mtl.sessions.v1';

export class HistoryStore {
  constructor(private readonly store: KeyValueStore) {}

  list(): SessionRecord[] {
    const raw = this.store.getItem(KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  listNewestFirst(): SessionRecord[] {
    return this.list().sort((a, b) => b.startedAt - a.startedAt);
  }

  add(record: SessionRecord): void {
    this.store.setItem(KEY, JSON.stringify([...this.list(), record]));
  }

  clear(): void {
    this.store.removeItem(KEY);
  }
}
