import { describe, expect, it } from 'vitest';
import { BEATS, layoutScore, measureBeats } from './rhythm';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

describe('layoutScore', () => {
  it('fills every non-final measure to exactly 4 beats', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const { rows } = layoutScore(7 + (seed % 20), 2, seeded(seed));
      const measures = rows.flat();
      measures.slice(0, -1).forEach((m) => expect(measureBeats(m)).toBe(4));
      expect(measureBeats(measures[measures.length - 1])).toBeLessThanOrEqual(4);
    }
  });

  it('allows the final measure to be incomplete', () => {
    const always = () => 0;
    const { rows } = layoutScore(5, 2, always);
    const measures = rows.flat();
    expect(measures.map((m) => m.items.length)).toEqual([4, 1]);
    expect(measureBeats(measures[1])).toBe(BEATS.q);
  });

  it('assigns every question index exactly once in order', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const count = 1 + (seed % 30);
      const indices = layoutScore(count, 2, seeded(seed))
        .rows.flat()
        .flatMap((m) => m.items.map((i) => i.index));
      expect(indices).toEqual(Array.from({ length: count }, (_, i) => i));
    }
  });

  it('puts measuresPerRow measures in each row', () => {
    const { rows } = layoutScore(20, 2, () => 0);
    expect(rows.map((r) => r.length)).toEqual([2, 2, 1]);
  });
});
