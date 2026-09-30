import { NOTES, type Note } from './notes';
import { staffZone } from './staff';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface Preset {
  id: string;
  difficulty: Difficulty;
  category: string;
  name: string;
  available: boolean;
  filter: (note: Note) => boolean;
}

export const DIFFICULTIES: readonly { id: Difficulty; name: string }[] = [
  { id: 'beginner', name: '初级' },
  { id: 'intermediate', name: '中级' },
  { id: 'advanced', name: '高级' },
];

const octave = (o: number) => (n: Note) => n.octave === o;
const between = (lo: number, hi: number) => (n: Note) => n.midi >= lo && n.midi <= hi;

export const PRESETS: readonly Preset[] = [
  { id: 'great', difficulty: 'beginner', category: '常用音符', name: '大字组', available: true, filter: octave(2) },
  { id: 'small', difficulty: 'beginner', category: '常用音符', name: '小字组', available: true, filter: octave(3) },
  { id: 'small1', difficulty: 'beginner', category: '常用音符', name: '小字一组', available: true, filter: octave(4) },
  { id: 'small2', difficulty: 'beginner', category: '常用音符', name: '小字二组', available: true, filter: octave(5) },
  { id: 'small3', difficulty: 'beginner', category: '常用音符', name: '小字三组', available: true, filter: octave(6) },
  { id: 'contra2', difficulty: 'beginner', category: '其他音符', name: '大字二组', available: false, filter: octave(0) },
  { id: 'contra1', difficulty: 'beginner', category: '其他音符', name: '大字一组', available: false, filter: octave(1) },
  { id: 'small4', difficulty: 'beginner', category: '其他音符', name: '小字四组', available: false, filter: octave(7) },
  { id: 'small5', difficulty: 'beginner', category: '其他音符', name: '小字五组', available: false, filter: octave(8) },
  { id: 'common', difficulty: 'intermediate', category: '常用音区', name: '常用音区', available: false, filter: (n) => n.common },
  { id: 'low', difficulty: 'intermediate', category: '音区练习', name: '低音区', available: false, filter: (n) => n.register === 'low' },
  { id: 'middle', difficulty: 'intermediate', category: '音区练习', name: '中音区', available: false, filter: (n) => n.register === 'middle' },
  { id: 'high', difficulty: 'intermediate', category: '音区练习', name: '高音区', available: false, filter: (n) => n.register === 'high' },
  { id: 'below', difficulty: 'intermediate', category: '分组练习', name: '下加线', available: false, filter: (n) => staffZone(n) === 'below' },
  { id: 'inside', difficulty: 'intermediate', category: '分组练习', name: '中间线', available: false, filter: (n) => staffZone(n) === 'inside' },
  { id: 'above', difficulty: 'intermediate', category: '分组练习', name: '上加线', available: false, filter: (n) => staffZone(n) === 'above' },
  { id: 'all', difficulty: 'advanced', category: '全音区', name: '全音区', available: false, filter: between(21, 108) },
];

export function presetNotes(preset: Preset): Note[] {
  return NOTES.filter(preset.filter);
}

export function presetById(id: string): Preset {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`unknown preset ${id}`);
  return preset;
}

export function presetRange(preset: Preset): string {
  const notes = presetNotes(preset);
  return `${notes[0].cn}-${notes[notes.length - 1].cn}`;
}
