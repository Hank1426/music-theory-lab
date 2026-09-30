export type Clef = 'treble' | 'bass';
export type Register = 'low' | 'middle' | 'high';
export type Letter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

export interface OctaveGroup {
  id: string;
  name: string;
  octave: number;
}

export interface Note {
  id: string;
  midi: number;
  letter: Letter;
  octave: number;
  diatonic: number;
  cn: string;
  group: OctaveGroup;
  register: Register;
  clef: Clef;
  common: boolean;
}

export const LETTERS: readonly Letter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const LETTER_SEMITONES = [0, 2, 4, 5, 7, 9, 11];

export const OCTAVE_GROUPS: readonly OctaveGroup[] = [
  { id: 'contra2', name: '大字二组', octave: 0 },
  { id: 'contra1', name: '大字一组', octave: 1 },
  { id: 'great', name: '大字组', octave: 2 },
  { id: 'small', name: '小字组', octave: 3 },
  { id: 'small1', name: '小字一组', octave: 4 },
  { id: 'small2', name: '小字二组', octave: 5 },
  { id: 'small3', name: '小字三组', octave: 6 },
  { id: 'small4', name: '小字四组', octave: 7 },
  { id: 'small5', name: '小字五组', octave: 8 },
];

export function groupOfOctave(octave: number): OctaveGroup {
  const group = OCTAVE_GROUPS.find((g) => g.octave === octave);
  if (!group) throw new Error(`no octave group for octave ${octave}`);
  return group;
}

export function chineseName(letter: Letter, octave: number): string {
  if (octave <= 2) {
    const suffix = octave === 2 ? '' : String(2 - octave);
    return `${letter}${suffix}`;
  }
  const lower = letter.toLowerCase();
  return octave === 3 ? lower : `${lower}${octave - 3}`;
}

export function groupLabel(octave: number): string {
  return chineseName('C', octave);
}

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

export function toSuperscript(cn: string): string {
  return cn.replace(/\d/g, (d) => SUPERSCRIPT[d]);
}

export function clefOf(midi: number): Clef {
  return midi <= 59 ? 'bass' : 'treble';
}

function registerOf(midi: number): Register {
  if (midi < 48) return 'low';
  if (midi < 84) return 'middle';
  return 'high';
}

function buildCatalog(): Note[] {
  const notes: Note[] = [];
  for (let octave = 0; octave <= 8; octave++) {
    LETTERS.forEach((letter, index) => {
      const midi = 12 * (octave + 1) + LETTER_SEMITONES[index];
      if (midi < 21 || midi > 108) return;
      notes.push({
        id: `${letter}${octave}`,
        midi,
        letter,
        octave,
        diatonic: octave * 7 + index,
        cn: chineseName(letter, octave),
        group: groupOfOctave(octave),
        register: registerOf(midi),
        clef: clefOf(midi),
        common: octave >= 2 && octave <= 6,
      });
    });
  }
  return notes;
}

export const NOTES: readonly Note[] = buildCatalog();

const BY_ID = new Map(NOTES.map((n) => [n.id, n]));

export function noteById(id: string): Note {
  const note = BY_ID.get(id);
  if (!note) throw new Error(`unknown note ${id}`);
  return note;
}

export function notesInOctave(octave: number): Note[] {
  return NOTES.filter((n) => n.octave === octave);
}
