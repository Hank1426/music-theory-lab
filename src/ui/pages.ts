import { formatPercent, formatSeconds, mistakeLines, stars, totals, type SessionRecord } from '../core/history';
import { DIFFICULTIES, PRESETS, presetById, presetNotes, presetRange, type Difficulty } from '../core/presets';
import { generateQuestions, Session } from '../core/session';
import { layoutScore } from '../core/rhythm';
import { piano } from './audio';
import { button, el, header } from './dom';
import { Keyboard } from './keyboard';
import { ScoreView } from './score';
import { history, loadConfig, requestPersistence, saveConfig, type SavedConfig } from './storage';

export interface Router {
  go(path: string): void;
  back(): void;
}

type Page = (router: Router, params: URLSearchParams) => HTMLElement | Promise<HTMLElement>;
export type Cleanup = () => void;
let cleanup: Cleanup | null = null;

export function disposeCurrent(): void {
  cleanup?.();
  cleanup = null;
}

function stat(value: string, label: string): HTMLElement {
  return el('div', { class: 'stat' }, el('strong', {}, value), el('span', {}, label));
}

const homePage: Page = (router) => {
  const t = totals(history.list());
  const page = el('main', { class: 'page home' });
  page.append(
    el('h1', { class: 'hero' }, '练习中心'),
    el('p', { class: 'subtitle' }, '通过练习巩固你的五线谱知识'),
    el(
      'section',
      { class: 'card' },
      el('h2', {}, '练习统计'),
      el(
        'div',
        { class: 'stats' },
        stat(String(t.questions), '练习数量'),
        stat(String(t.sessions), '练习场次'),
        stat(formatPercent(t.accuracy).replace('.0%', '%'), '准确率'),
      ),
    ),
    el('h2', { class: 'section-title' }, '练习分类'),
  );
  const single = el(
    'section',
    { class: 'card category' },
    el('div', { class: 'cat-head' }, el('span', { class: 'icon' }, '♫'), el('div', {}, el('h3', {}, '单音练习'), el('p', {}, '学习识别五线谱上的音符位置'))),
  );
  const row = el('div', { class: 'cat-actions' });
  row.append(button('开始练习', () => router.go('/groups')), button('设置', () => router.go('/config'), 'icon-btn'));
  single.append(row);

  const historyCard = el(
    'section',
    { class: 'card category' },
    el('div', { class: 'cat-head' }, el('span', { class: 'icon alt' }, '☰'), el('div', {}, el('h3', {}, '练习记录'), el('p', {}, '查看历史练习的成绩'))),
  );
  historyCard.append(el('div', { class: 'cat-actions' }, button('查看记录', () => router.go('/history'))));
  page.append(single, historyCard);
  page.append(el('p', { class: 'footnote' }, '钢琴采样：Salamander Grand Piano（Alexander Holm，CC-BY 3.0）'));
  return page;
};

const groupsPage: Page = (router, params) => {
  const difficulty = (params.get('d') as Difficulty) || 'beginner';
  const page = el('main', { class: 'page' });
  page.append(header('单音练习', () => router.go('/')));
  const tabs = el('div', { class: 'tabs' });
  DIFFICULTIES.forEach((d) => {
    const tab = button(d.name, () => router.go(`/groups?d=${d.id}`), d.id === difficulty ? 'tab active' : 'tab');
    tabs.append(tab);
  });
  page.append(tabs);

  const presets = PRESETS.filter((p) => p.difficulty === difficulty);
  const categories = [...new Set(presets.map((p) => p.category))];
  categories.forEach((category) => {
    page.append(el('h2', { class: 'section-title' }, category));
    presets
      .filter((p) => p.category === category)
      .forEach((preset) => {
        const count = presetNotes(preset).length;
        const item = el(
          'button',
          { class: `group-item${preset.available ? '' : ' disabled'}`, type: 'button' },
          el('span', { class: 'icon round' }, '♫'),
          el('span', { class: 'group-text' }, el('strong', {}, preset.name), el('small', {}, `${presetRange(preset)} | 音符数量 ${count}`)),
          el('span', { class: 'chevron' }, preset.available ? '›' : '即将推出'),
        );
        if (preset.available) item.addEventListener('click', () => router.go(`/practice?p=${preset.id}`));
        page.append(item);
      });
  });
  return page;
};

function toggle(label: string, desc: string, checked: boolean, onChange: (v: boolean) => void): HTMLElement {
  const input = el('input', { type: 'checkbox', class: 'switch' });
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));
  return el('label', { class: 'setting' }, el('span', {}, el('strong', {}, label), el('small', {}, desc)), input);
}

const configPage: Page = (router) => {
  const config: SavedConfig = loadConfig();
  const page = el('main', { class: 'page' });
  page.append(header('单音练习配置', () => router.back()), el('h2', { class: 'section-title' }, '选择练习模式'));

  const modes = el('div', { class: 'modes' });
  const countInput = el('input', { type: 'number', min: '1', max: '200', value: String(config.count), class: 'count-input' });
  const renderModes = () => {
    modes.querySelectorAll('.mode').forEach((m) => m.classList.toggle('active', (m as HTMLElement).dataset.mode === config.mode));
    countInput.disabled = config.mode !== 'count';
  };
  const mode = (id: SavedConfig['mode'], title: string, desc: string, extra?: HTMLElement) => {
    const card = el('button', { class: 'mode', type: 'button', 'data-mode': id }, el('strong', {}, title), el('small', {}, desc));
    if (extra) card.append(extra);
    card.addEventListener('click', () => {
      config.mode = id;
      renderModes();
    });
    return card;
  };
  countInput.addEventListener('click', (e) => e.stopPropagation());
  countInput.addEventListener('change', () => {
    const n = Math.round(Number(countInput.value));
    config.count = Math.min(200, Math.max(1, Number.isFinite(n) ? n : 20));
    countInput.value = String(config.count);
  });
  modes.append(
    mode('default', '默认模式', '练习对应音组的全部音符，每个音一次，完成后结束练习'),
    mode('count', '数量练习', '练习指定数量的音符，完成后结束练习', el('span', { class: 'count-row' }, '题数 ', countInput)),
  );
  renderModes();

  const settings = el('section', { class: 'card settings' }, el('h3', {}, '通用设置'));
  settings.append(
    toggle('随机顺序', '音符将以随机顺序出现', config.shuffle, (v) => (config.shuffle = v)),
    toggle('显示音符名称', '练习时在琴键上显示音符名称', config.showNames, (v) => (config.showNames = v)),
  );
  page.append(
    modes,
    settings,
    button('保存设置', () => {
      saveConfig(config);
      router.back();
    }),
  );
  return page;
};

const practicePage: Page = (router, params) => {
  const preset = presetById(params.get('p') ?? '');
  if (!preset.available) {
    router.go('/groups');
    return el('main');
  }
  const config = loadConfig();
  const pool = presetNotes(preset);
  const questions = generateQuestions(pool, config);
  const session = new Session(questions, performance.now());
  const startedAt = Date.now();
  const octave = pool[0].octave;
  const clef = pool[0].clef;

  piano.unlock();
  void piano.preload(pool.map((n) => n.midi));
  requestPersistence();

  const page = el('main', { class: 'page practice' });
  const counter = el('span', { class: 'counter' });
  const timer = el('span', { class: 'timer' }, '00:00');
  const toast = el('div', { class: 'toast', 'aria-live': 'polite' });
  const scoreHost = el('div', { class: 'score' });
  page.append(header(preset.name, () => router.go('/groups')), el('div', { class: 'status' }, counter, timer), toast, scoreHost);

  const score = new ScoreView(scoreHost);
  const updateCounter = () => {
    counter.textContent = `${Math.min(session.index + 1, questions.length)}/${questions.length} 题`;
  };

  let toastTimer = 0;
  const showToast = (ok: boolean) => {
    toast.textContent = ok ? '✓ 正确' : '✕ 错误';
    toast.className = `toast show ${ok ? 'ok' : 'bad'}`;
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => (toast.className = 'toast'), 600);
  };

  const finish = () => {
    const record: SessionRecord = {
      id: `${startedAt}-${Math.random().toString(36).slice(2, 8)}`,
      startedAt,
      durationMs: Math.round(session.durationMs(performance.now())),
      presetId: preset.id,
      presetName: preset.name,
      mode: config.mode,
      totalCount: questions.length,
      correctCount: session.correctCount,
      hintCount: session.hintCount,
      items: session.items.map((i) => ({ ...i, rtMs: i.rtMs === null ? null : Math.round(i.rtMs) })),
    };
    history.add(record);
    setTimeout(() => router.go(`/result?id=${encodeURIComponent(record.id)}`), 350);
  };

  const keyboard = new Keyboard({
    octave,
    showNames: config.showNames,
    onPress: (note) => {
      piano.play(note.midi);
      const result = session.press(note.id, performance.now());
      if (result === 'ignored') return;
      showToast(result === 'correct');
      if (result !== 'correct') return;
      keyboard.clearHint();
      if (session.finished) {
        clearInterval(tick);
        finish();
        return;
      }
      score.setActive(session.index);
      updateCounter();
    },
  });

  const toolbar = el('div', { class: 'toolbar' });
  toolbar.append(
    el('span', { class: 'tool label' }, Keyboard.label(octave)),
    button('💡', () => {
      const target = session.hint();
      if (target) keyboard.showHint(target);
    }, 'tool'),
  );
  page.append(el('footer', { class: 'piano' }, toolbar, keyboard.element));

  const tick = window.setInterval(() => {
    const s = Math.floor(session.durationMs(performance.now()) / 1000);
    timer.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }, 250);

  let lastWidth = 0;
  const layout = layoutScore(questions.length, 2);
  const draw = () => {
    const w = scoreHost.clientWidth;
    if (w === 0 || w === lastWidth) return;
    lastWidth = w;
    score.render(questions, layout, clef);
    score.setActive(session.index);
  };
  const observer = new ResizeObserver(draw);
  observer.observe(scoreHost);
  updateCounter();

  cleanup = () => {
    clearInterval(tick);
    clearTimeout(toastTimer);
    observer.disconnect();
  };
  return page;
};

function starRow(n: number): HTMLElement {
  return el('div', { class: 'stars', 'aria-label': `${n} 星` }, '★'.repeat(n) + '☆'.repeat(5 - n));
}

const resultPage: Page = (router, params) => {
  const record = history.list().find((r) => r.id === params.get('id'));
  const page = el('main', { class: 'page result' });
  page.append(header('练习结果', () => router.go('/')));
  if (!record) {
    page.append(el('p', { class: 'empty' }, '找不到这次练习的记录'), button('返回练习中心', () => router.go('/')));
    return page;
  }
  const ratio = record.totalCount === 0 ? 0 : record.correctCount / record.totalCount;
  const mistakes = mistakeLines(record.items);
  const list = el('ul', { class: 'mistakes' });
  if (mistakes.length === 0) list.append(el('li', { class: 'none' }, '全部答对，没有错题 🎉'));
  mistakes.forEach((m) => list.append(el('li', {}, m)));
  page.append(
    el('p', { class: 'result-title' }, `${record.presetName} · 音符识别训练`),
    el('div', { class: 'ring' }, el('strong', {}, formatPercent(ratio)), el('span', {}, '正确率')),
    starRow(stars(ratio)),
    el(
      'section',
      { class: 'card' },
      el('h3', {}, '练习详情'),
      el(
        'div',
        { class: 'stats' },
        stat(String(record.correctCount), '正确题数'),
        stat(String(record.totalCount - record.correctCount), '错误题数'),
        stat(formatSeconds(record.durationMs), '用时(秒)'),
      ),
      el('h3', {}, '错题集'),
      list,
    ),
    el(
      'div',
      { class: 'actions' },
      button('再来一次', () => router.go(`/practice?p=${record.presetId}`)),
      button('返回练习中心', () => router.go('/'), 'secondary'),
    ),
  );
  return page;
};

const historyPage: Page = (router) => {
  const records = history.listNewestFirst();
  const page = el('main', { class: 'page' });
  page.append(header('练习记录', () => router.go('/')));
  if (records.length === 0) {
    page.append(el('p', { class: 'empty' }, '还没有练习记录'));
    return page;
  }
  const list = el('div', { class: 'history' });
  records.forEach((r) => {
    const date = new Date(r.startedAt);
    const when = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const item = el(
      'button',
      { class: 'history-item', type: 'button' },
      el('span', {}, el('strong', {}, r.presetName), el('small', {}, when)),
      el(
        'span',
        { class: 'history-score' },
        el('strong', {}, formatPercent(r.totalCount ? r.correctCount / r.totalCount : 0)),
        el('small', {}, `${r.correctCount}/${r.totalCount} · ${formatSeconds(r.durationMs)}s`),
      ),
    );
    item.addEventListener('click', () => router.go(`/result?id=${encodeURIComponent(r.id)}`));
    list.append(item);
  });
  page.append(
    list,
    button(
      '清空全部记录',
      () => {
        if (!window.confirm('确定清空全部练习记录吗？此操作无法撤销。')) return;
        history.clear();
        router.go('/');
      },
      'danger',
    ),
  );
  return page;
};

export const routes: Record<string, Page> = {
  '/': homePage,
  '/groups': groupsPage,
  '/config': configPage,
  '/practice': practicePage,
  '/result': resultPage,
  '/history': historyPage,
};
