import { groupLabel, notesInOctave, toSuperscript, type Note } from '../core/notes';

const BLACK_AFTER = new Set(['C', 'D', 'F', 'G', 'A']);

export interface KeyboardOptions {
  octave: number;
  showNames: boolean;
  onPress: (note: Note) => void;
}

export class Keyboard {
  readonly element: HTMLElement;
  private keys = new Map<string, HTMLElement>();
  private hinted: string | null = null;

  constructor(options: KeyboardOptions) {
    const root = document.createElement('div');
    root.className = 'keyboard';
    const notes = notesInOctave(options.octave);

    notes.forEach((note, i) => {
      const key = document.createElement('button');
      key.type = 'button';
      key.className = 'key white';
      key.dataset.note = note.id;
      key.textContent = options.showNames ? toSuperscript(note.cn) : '';
      key.setAttribute('aria-label', note.cn);
      key.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        key.setPointerCapture?.(event.pointerId);
        key.classList.add('pressed');
        options.onPress(note);
      });
      const release = () => key.classList.remove('pressed');
      key.addEventListener('pointerup', release);
      key.addEventListener('pointercancel', release);
      key.addEventListener('lostpointercapture', release);
      root.appendChild(key);
      this.keys.set(note.id, key);

      if (BLACK_AFTER.has(note.letter) && i < notes.length - 1) {
        const black = document.createElement('div');
        black.className = 'key black';
        black.style.left = `calc(${((i + 1) / notes.length) * 100}% - var(--black-width) / 2)`;
        root.appendChild(black);
      }
    });

    root.addEventListener('contextmenu', (e) => e.preventDefault());
    this.element = root;
  }

  static label(octave: number): string {
    return toSuperscript(groupLabel(octave));
  }

  showHint(noteId: string): void {
    this.clearHint();
    this.hinted = noteId;
    this.keys.get(noteId)?.classList.add('hint');
  }

  clearHint(): void {
    if (this.hinted) this.keys.get(this.hinted)?.classList.remove('hint');
    this.hinted = null;
  }
}
