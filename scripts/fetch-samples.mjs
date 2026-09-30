import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = 'https://tonejs.github.io/audio/salamander/';
const OUT = join(import.meta.dirname, '..', 'public', 'audio');
const NAMES = ['C', 'Ds', 'Fs', 'A'];
const OCTAVES = [2, 3, 4, 5, 6];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(OUT, { recursive: true });
const files = [...OCTAVES.flatMap((o) => NAMES.map((n) => `${n}${o}`)), 'C7'];
for (const name of files) {
  const target = join(OUT, `${name}.mp3`);
  if (await exists(target)) continue;
  const res = await fetch(`${BASE}${name}.mp3`);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  await writeFile(target, Buffer.from(await res.arrayBuffer()));
  console.log(`saved ${name}.mp3`);
}
