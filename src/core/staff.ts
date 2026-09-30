import { NOTES, type Clef, type Note } from './notes';

export type StaffZone = 'below' | 'inside' | 'above';

const BOTTOM_LINE_DIATONIC: Record<Clef, number> = {
  treble: 4 * 7 + 2,
  bass: 2 * 7 + 4,
};

export function staffPosition(note: Note, clef: Clef = note.clef): number {
  return note.diatonic - BOTTOM_LINE_DIATONIC[clef];
}

export function ledgerLines(note: Note, clef: Clef = note.clef): number {
  const pos = staffPosition(note, clef);
  if (pos <= -2) return Math.floor(-pos / 2);
  if (pos >= 10) return Math.floor((pos - 8) / 2);
  return 0;
}

export function staffZone(note: Note, clef: Clef = note.clef): StaffZone {
  const pos = staffPosition(note, clef);
  if (pos < 0) return 'below';
  if (pos > 8) return 'above';
  return 'inside';
}

export function stemUp(note: Note, clef: Clef = note.clef): boolean {
  return staffPosition(note, clef) < 4;
}

export function notesInZone(zone: StaffZone): Note[] {
  return NOTES.filter((n) => staffZone(n) === zone);
}
