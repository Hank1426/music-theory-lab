export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, string> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') node.className = v;
    else node.setAttribute(k, v);
  }
  node.append(...children);
  return node;
}

export function header(title: string, back?: () => void): HTMLElement {
  const bar = el('header', { class: 'topbar' });
  if (back) {
    const btn = el('button', { class: 'back', type: 'button', 'aria-label': '返回' }, '‹');
    btn.addEventListener('click', back);
    bar.append(btn);
  }
  bar.append(el('h1', {}, title));
  return bar;
}

export function button(label: string, onClick: () => void, cls = 'primary'): HTMLButtonElement {
  const btn = el('button', { class: `btn ${cls}`, type: 'button' }, label);
  btn.addEventListener('click', onClick);
  return btn;
}
