import { NOTES } from '../core/notes';

const SAMPLE_MIDIS = [36, 39, 42, 45, 48, 51, 54, 57, 60, 63, 66, 69, 72, 75, 78, 81, 84, 87, 90, 93, 96];
const PITCH_NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];

function sampleName(midi: number): string {
  return `${PITCH_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function nearestSample(midi: number): number {
  return SAMPLE_MIDIS.reduce((best, s) => (Math.abs(s - midi) < Math.abs(best - midi) ? s : best));
}

export class PianoAudio {
  private ctx: AudioContext | null = null;
  private buffers = new Map<number, Promise<AudioBuffer | null>>();

  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext({ latencyHint: 'interactive' });
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  preload(midis: readonly number[]): Promise<unknown> {
    return Promise.all([...new Set(midis.map(nearestSample))].map((s) => this.load(s)));
  }

  preloadCommon(): Promise<unknown> {
    return this.preload(NOTES.filter((n) => n.common).map((n) => n.midi));
  }

  play(midi: number): void {
    this.unlock();
    const ctx = this.ctx!;
    const sample = nearestSample(midi);
    void this.load(sample).then((buffer) => {
      if (!buffer) return;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.playbackRate.value = 2 ** ((midi - sample) / 12);
      const gain = ctx.createGain();
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(0.9, now);
      gain.gain.setTargetAtTime(0, now + 1.2, 0.3);
      source.connect(gain).connect(ctx.destination);
      source.start(now);
      source.stop(now + 3);
    });
  }

  private load(sample: number): Promise<AudioBuffer | null> {
    let pending = this.buffers.get(sample);
    if (!pending) {
      this.unlock();
      const ctx = this.ctx!;
      pending = fetch(`${import.meta.env.BASE_URL}audio/${sampleName(sample)}.mp3`)
        .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then((data) => ctx.decodeAudioData(data))
        .catch((err: unknown) => {
          console.warn(`sample ${sampleName(sample)} failed`, err);
          this.buffers.delete(sample);
          return null;
        });
      this.buffers.set(sample, pending);
    }
    return pending;
  }
}

export const piano = new PianoAudio();
