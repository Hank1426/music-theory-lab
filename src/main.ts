import './style.css';
import { disposeCurrent, routes, type Router } from './ui/pages';

const app = document.getElementById('app')!;

function parse(): { path: string; params: URLSearchParams } {
  const hash = location.hash.replace(/^#/, '') || '/';
  const [path, query = ''] = hash.split('?');
  return { path, params: new URLSearchParams(query) };
}

const router: Router = {
  go(path) {
    location.hash = path;
  },
  back() {
    if (history.length > 1) history.back();
    else location.hash = '/';
  },
};

async function render(): Promise<void> {
  disposeCurrent();
  const { path, params } = parse();
  const page = routes[path] ?? routes['/'];
  const node = await page(router, params);
  app.replaceChildren(node);
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', () => void render());
void render();

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then(() => warmAudioCache())
      .catch(() => undefined);
  });
}

function warmAudioCache(): void {
  const names = [2, 3, 4, 5, 6].flatMap((o) => ['C', 'Ds', 'Fs', 'A'].map((n) => `${n}${o}`)).concat('C7');
  names.forEach((n) => void fetch(`${import.meta.env.BASE_URL}audio/${n}.mp3`).catch(() => undefined));
}
