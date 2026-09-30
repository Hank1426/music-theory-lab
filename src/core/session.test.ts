import { describe, expect, it } from 'vitest';
import { noteById, notesInOctave } from './notes';
import { generateQuestions, Session } from './session';

const pool = notesInOctave(4);
const ids = (notes: { id: string }[]) => notes.map((n) => n.id);

describe('generateQuestions', () => {
  it('default mode asks each note once in random order', () => {
    const qs = generateQuestions(pool, { mode: 'default', count: 0, shuffle: true });
    expect(qs).toHaveLength(7);
    expect(new Set(ids(qs))).toEqual(new Set(ids(pool)));
  });

  it('count mode produces N questions with repeats allowed and no immediate repeats', () => {
    const qs = generateQuestions(pool, { mode: 'count', count: 20, shuffle: true });
    expect(qs).toHaveLength(20);
    qs.slice(1).forEach((q, i) => expect(q.id).not.toBe(qs[i].id));
  });

  it('without shuffle orders from low to high', () => {
    const qs = generateQuestions([...pool].reverse(), { mode: 'default', count: 0, shuffle: false });
    expect(ids(qs)).toEqual(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']);
    const cycled = generateQuestions(pool, { mode: 'count', count: 9, shuffle: false });
    expect(ids(cycled).slice(6)).toEqual(['B4', 'C4', 'D4']);
  });
});

describe('Session', () => {
  const make = () => new Session(['A4', 'B4', 'C4'].map(noteById), 1000);

  it('first correct press counts as correct', () => {
    const s = make();
    expect(s.press('A4', 1800)).toBe('correct');
    expect(s.items[0]).toMatchObject({ firstPressCorrect: true, pressed: ['A4'], rtMs: 800 });
    expect(s.index).toBe(1);
  });

  it('wrong press stays on the question and marks it wrong', () => {
    const s = make();
    expect(s.press('B4', 1500)).toBe('wrong');
    expect(s.index).toBe(0);
    expect(s.press('G4', 1700)).toBe('wrong');
    expect(s.press('A4', 2000)).toBe('correct');
    expect(s.items[0]).toMatchObject({ firstPressCorrect: false, pressed: ['B4', 'G4', 'A4'], rtMs: 500 });
    expect(s.index).toBe(1);
  });

  it('hint marks the question wrong and waits for the correct key', () => {
    const s = make();
    expect(s.hint()).toBe('A4');
    expect(s.index).toBe(0);
    expect(s.press('A4', 1200)).toBe('correct');
    expect(s.items[0]).toMatchObject({ hinted: true, firstPressCorrect: false });
    expect(s.hintCount).toBe(1);
  });

  it('finishes after the last question is answered correctly', () => {
    const s = make();
    s.press('A4', 1100);
    s.press('B4', 1200);
    expect(s.finished).toBe(false);
    s.press('D4', 1300);
    expect(s.finished).toBe(false);
    s.press('C4', 1400);
    expect(s.finished).toBe(true);
    expect(s.durationMs(9999)).toBe(400);
    expect(s.correctCount).toBe(2);
    expect(s.press('C4', 1500)).toBe('ignored');
  });
});
