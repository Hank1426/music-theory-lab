import type { Note } from './notes';

export type EndMode = 'default' | 'count';

export interface PracticeConfig {
  presetId: string;
  mode: EndMode;
  count: number;
  shuffle: boolean;
  showNames: boolean;
}

export const DEFAULT_CONFIG: Omit<PracticeConfig, 'presetId'> = {
  mode: 'default',
  count: 20,
  shuffle: true,
  showNames: true,
};

export type Random = () => number;

function shuffled<T>(items: readonly T[], random: Random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function generateQuestions(
  pool: readonly Note[],
  config: Pick<PracticeConfig, 'mode' | 'count' | 'shuffle'>,
  random: Random = Math.random,
): Note[] {
  const ordered = [...pool].sort((a, b) => a.midi - b.midi);
  if (config.mode === 'default') {
    return config.shuffle ? shuffled(ordered, random) : ordered;
  }
  const result: Note[] = [];
  for (let i = 0; i < config.count; i++) {
    if (!config.shuffle) {
      result.push(ordered[i % ordered.length]);
      continue;
    }
    let pick = ordered[Math.floor(random() * ordered.length)];
    if (ordered.length > 1) {
      while (pick.id === result[i - 1]?.id) pick = ordered[Math.floor(random() * ordered.length)];
    }
    result.push(pick);
  }
  return result;
}

export interface ItemRecord {
  target: string;
  pressed: string[];
  hinted: boolean;
  firstPressCorrect: boolean;
  rtMs: number | null;
}

export type PressResult = 'correct' | 'wrong' | 'ignored';

export class Session {
  readonly questions: readonly Note[];
  readonly items: ItemRecord[];
  private cursor = 0;
  private questionStartedAt: number;
  readonly startedAt: number;
  endedAt: number | null = null;

  constructor(questions: readonly Note[], now: number) {
    if (questions.length === 0) throw new Error('session needs at least one question');
    this.questions = questions;
    this.items = questions.map((q) => ({
      target: q.id,
      pressed: [],
      hinted: false,
      firstPressCorrect: false,
      rtMs: null,
    }));
    this.startedAt = now;
    this.questionStartedAt = now;
  }

  get index(): number {
    return this.cursor;
  }

  get finished(): boolean {
    return this.endedAt !== null;
  }

  get current(): Note {
    return this.questions[Math.min(this.cursor, this.questions.length - 1)];
  }

  get currentItem(): ItemRecord {
    return this.items[Math.min(this.cursor, this.items.length - 1)];
  }

  press(noteId: string, now: number): PressResult {
    if (this.finished) return 'ignored';
    const item = this.currentItem;
    if (item.pressed.length === 0) item.rtMs = now - this.questionStartedAt;
    item.pressed.push(noteId);
    if (noteId !== item.target) return 'wrong';
    item.firstPressCorrect = item.pressed.length === 1 && !item.hinted;
    this.cursor++;
    this.questionStartedAt = now;
    if (this.cursor >= this.questions.length) this.endedAt = now;
    return 'correct';
  }

  hint(): string | null {
    if (this.finished) return null;
    this.currentItem.hinted = true;
    return this.currentItem.target;
  }

  get correctCount(): number {
    return this.items.filter((i) => i.firstPressCorrect).length;
  }

  get hintCount(): number {
    return this.items.filter((i) => i.hinted).length;
  }

  durationMs(now: number): number {
    return (this.endedAt ?? now) - this.startedAt;
  }
}
