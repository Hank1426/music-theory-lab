import { Formatter, Renderer, Stave, StaveNote, Stem, Voice } from 'vexflow/bravura';
import type { Clef, Note } from '../core/notes';
import { stemUp } from '../core/staff';
import type { ScoreLayout } from '../core/rhythm';

const SVG_NS = 'http://www.w3.org/2000/svg';
const ROW_HEIGHT = 150;
const STAVE_TOP = 40;
const SIDE_PADDING = 6;

export class ScoreView {
  private highlights: SVGRectElement[] = [];
  private active = -1;

  constructor(private readonly host: HTMLElement) {}

  render(questions: readonly Note[], layout: ScoreLayout, clef: Clef): void {
    this.host.innerHTML = '';
    this.highlights = [];
    this.active = -1;

    const width = Math.max(300, this.host.clientWidth);
    const height = layout.rows.length * ROW_HEIGHT + 10;
    const renderer = new Renderer(this.host as HTMLDivElement, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const ctx = renderer.getContext();
    const svg = this.host.querySelector('svg')!;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('width', '100%');
    svg.removeAttribute('height');
    const highlightLayer = document.createElementNS(SVG_NS, 'g');
    svg.appendChild(highlightLayer);

    const usable = width - SIDE_PADDING * 2;
    layout.rows.forEach((row, rowIndex) => {
      const y = rowIndex * ROW_HEIGHT + STAVE_TOP;
      const first = new Stave(SIDE_PADDING, y, 0).addClef(clef);
      const clefWidth = first.getNoteStartX() - SIDE_PADDING;
      const measureWidth = (usable - clefWidth) / 2;

      row.forEach((measure, mIndex) => {
        const x = mIndex === 0 ? SIDE_PADDING : SIDE_PADDING + clefWidth + measureWidth;
        const stave = new Stave(x, y, mIndex === 0 ? clefWidth + measureWidth : measureWidth);
        if (mIndex === 0) stave.addClef(clef);
        stave.setContext(ctx).draw();

        const notes = measure.items.map(({ index, duration }) => {
          const note = questions[index];
          return new StaveNote({
            keys: [`${note.letter.toLowerCase()}/${note.octave}`],
            duration,
            clef,
            stemDirection: stemUp(note, clef) ? Stem.UP : Stem.DOWN,
          });
        });
        const voice = new Voice({ numBeats: 4, beatValue: 4 }).setMode(Voice.Mode.SOFT).addTickables(notes);
        new Formatter().joinVoices([voice]).formatToStave([voice], stave);
        voice.draw(ctx, stave);

        notes.forEach((staveNote, i) => {
          const left = staveNote.getNoteHeadBeginX();
          const right = staveNote.getNoteHeadEndX();
          const bounds = staveNote.getBoundingBox();
          const top = Math.min(stave.getYForLine(0) - 8, bounds.getY() - 4);
          const bottom = Math.max(stave.getYForLine(4) + 8, bounds.getY() + bounds.getH() + 4);
          const rect = document.createElementNS(SVG_NS, 'rect');
          rect.setAttribute('x', String(left - 8));
          rect.setAttribute('y', String(top));
          rect.setAttribute('width', String(right - left + 16));
          rect.setAttribute('height', String(bottom - top));
          rect.setAttribute('rx', '4');
          rect.setAttribute('fill', 'transparent');
          rect.setAttribute('stroke', 'none');
          rect.setAttribute('class', 'note-highlight');
          highlightLayer.appendChild(rect);
          this.highlights[measure.items[i].index] = rect;
        });
      });
    });
    svg.insertBefore(highlightLayer, svg.firstChild);
  }

  setActive(index: number): void {
    this.highlights[this.active]?.classList.remove('active');
    this.active = index;
    const rect = this.highlights[index];
    if (!rect) return;
    rect.classList.add('active');
    rect.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }
}
