export type Duration = 'q' | 'h' | 'w';

export const BEATS: Record<Duration, number> = { q: 1, h: 2, w: 4 };

export const MEASURE_PATTERNS: readonly Duration[][] = [
  ['q', 'q', 'q', 'q'],
  ['h', 'h'],
  ['q', 'q', 'h'],
  ['h', 'q', 'q'],
  ['q', 'h', 'q'],
  ['w'],
];

export interface Measure {
  items: { index: number; duration: Duration }[];
}

export interface ScoreLayout {
  rows: Measure[][];
}

export type Random = () => number;

function sequencesWithin(length: number, maxBeats: number): Duration[][] {
  if (length === 0) return [[]];
  const result: Duration[][] = [];
  for (const d of ['q', 'h', 'w'] as Duration[]) {
    if (BEATS[d] > maxBeats) continue;
    for (const rest of sequencesWithin(length - 1, maxBeats - BEATS[d])) result.push([d, ...rest]);
  }
  return result;
}

export function layoutScore(count: number, measuresPerRow = 2, random: Random = Math.random): ScoreLayout {
  const measures: Measure[] = [];
  let index = 0;
  while (index < count) {
    const remaining = count - index;
    const candidates =
      remaining < 4 ? sequencesWithin(remaining, 4) : MEASURE_PATTERNS.filter((p) => p.length <= remaining);
    const pattern = candidates[Math.floor(random() * candidates.length)];
    measures.push({ items: pattern.map((duration) => ({ index: index++, duration })) });
  }
  const rows: Measure[][] = [];
  for (let i = 0; i < measures.length; i += measuresPerRow) {
    rows.push(measures.slice(i, i + measuresPerRow));
  }
  return { rows };
}

export function measureBeats(measure: Measure): number {
  return measure.items.reduce((sum, item) => sum + BEATS[item.duration], 0);
}
