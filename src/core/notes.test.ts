import { describe, expect, it } from 'vitest';
import { NOTES, noteById, notesInOctave, OCTAVE_GROUPS, toSuperscript, groupLabel } from './notes';
import { ledgerLines, notesInZone, staffPosition, staffZone, stemUp } from './staff';
import { PRESETS, presetNotes, presetRange } from './presets';

describe('note catalog', () => {
  it('covers all 52 white keys A0–C8', () => {
    expect(NOTES).toHaveLength(52);
    expect(NOTES[0].id).toBe('A0');
    expect(NOTES[NOTES.length - 1].id).toBe('C8');
  });

  it('has 7 notes per full octave group, 2 in 大字二组 and 1 in 小字五组', () => {
    const counts = OCTAVE_GROUPS.map((g) => notesInOctave(g.octave).length);
    expect(counts).toEqual([2, 7, 7, 7, 7, 7, 7, 7, 1]);
  });

  it('maps middle C consistently', () => {
    const c4 = noteById('C4');
    expect(c4.midi).toBe(60);
    expect(c4.cn).toBe('c1');
    expect(c4.group.name).toBe('小字一组');
    expect(c4.clef).toBe('treble');
  });

  it('uses Chinese group notation', () => {
    expect(['A0', 'C1', 'C2', 'C3', 'B4', 'C5', 'C8'].map((id) => noteById(id).cn)).toEqual([
      'A2',
      'C1',
      'C',
      'c',
      'b1',
      'c2',
      'c5',
    ]);
    expect(toSuperscript('c1')).toBe('c¹');
    expect(groupLabel(3)).toBe('c');
    expect(groupLabel(4)).toBe('c1');
  });

  it('splits clefs at B3 / C4', () => {
    expect(noteById('B3').clef).toBe('bass');
    expect(noteById('C4').clef).toBe('treble');
  });
});

describe('staff position', () => {
  it('puts C4 on the first ledger line below treble staff', () => {
    const c4 = noteById('C4');
    expect(staffPosition(c4)).toBe(-2);
    expect(ledgerLines(c4)).toBe(1);
    expect(staffZone(c4)).toBe('below');
  });

  it('puts B4 on the treble middle line with stem down', () => {
    const b4 = noteById('B4');
    expect(staffPosition(b4)).toBe(4);
    expect(ledgerLines(b4)).toBe(0);
    expect(stemUp(b4)).toBe(false);
    expect(stemUp(noteById('A4'))).toBe(true);
  });

  it('puts G2 on the bass bottom line and B3 above the bass staff', () => {
    expect(staffPosition(noteById('G2'))).toBe(0);
    expect(staffZone(noteById('B3'))).toBe('above');
    expect(ledgerLines(noteById('B3'))).toBe(0);
    expect(ledgerLines(noteById('C4'), 'bass')).toBe(1);
  });

  it('needs at most 5 ledger lines within the common range C2–B6', () => {
    const common = NOTES.filter((n) => n.common);
    expect(common).toHaveLength(35);
    expect(Math.max(...common.map((n) => ledgerLines(n)))).toBeLessThanOrEqual(5);
  });

  it('matches the reference app counts for 下加线 / 中间线 / 上加线', () => {
    expect(notesInZone('below')).toHaveLength(15);
    expect(notesInZone('inside')).toHaveLength(18);
    expect(notesInZone('above')).toHaveLength(19);
  });
});

describe('presets', () => {
  const counts = Object.fromEntries(PRESETS.map((p) => [p.id, presetNotes(p).length]));

  it('matches reference app note counts', () => {
    expect(counts).toMatchObject({
      contra2: 2,
      contra1: 7,
      great: 7,
      small: 7,
      small1: 7,
      small2: 7,
      small3: 7,
      small4: 7,
      small5: 1,
      common: 35,
      low: 16,
      middle: 21,
      high: 15,
      below: 15,
      inside: 18,
      above: 19,
      all: 52,
    });
  });

  it('matches reference app ranges', () => {
    const range = (id: string) => presetRange(PRESETS.find((p) => p.id === id)!);
    expect(range('low')).toBe('A2-B');
    expect(range('middle')).toBe('c-b2');
    expect(range('high')).toBe('c3-c5');
    expect(range('below')).toBe('A2-d1');
    expect(range('inside')).toBe('G-f2');
    expect(range('above')).toBe('b-c5');
  });

  it('only opens the 5 common beginner groups', () => {
    expect(PRESETS.filter((p) => p.available).map((p) => p.id)).toEqual([
      'great',
      'small',
      'small1',
      'small2',
      'small3',
    ]);
  });
});
