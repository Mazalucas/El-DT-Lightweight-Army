export function pageHeader(title: string, desc?: string, actions?: HTMLElement): HTMLElement {
  const el = document.createElement('header');
  el.className = 'page-header';
  const row = document.createElement('div');
  row.className = 'page-header-row';
  const text = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.textContent = title;
  text.appendChild(h1);
  if (desc) {
    const p = document.createElement('p');
    p.className = 'page-header-desc';
    p.textContent = desc;
    text.appendChild(p);
  }
  row.appendChild(text);
  if (actions) row.appendChild(actions);
  el.appendChild(row);
  return el;
}

export function section(title: string, desc?: string): { el: HTMLElement; body: HTMLElement } {
  const el = document.createElement('section');
  el.className = 'page-section';
  const head = document.createElement('div');
  head.className = 'page-section-head';
  const h2 = document.createElement('h2');
  h2.textContent = title;
  head.appendChild(h2);
  if (desc) {
    const p = document.createElement('p');
    p.className = 'page-section-desc';
    p.textContent = desc;
    head.appendChild(p);
  }
  el.appendChild(head);
  const body = document.createElement('div');
  body.className = 'page-section-body';
  el.appendChild(body);
  return { el, body };
}

export function skeletonBlock(lines = 3): HTMLElement {
  const el = document.createElement('div');
  el.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < lines; i++) {
    const line = document.createElement('div');
    line.className = 'skeleton skeleton-line';
    el.appendChild(line);
  }
  return el;
}

export function emptyState(title: string, desc: string, action?: HTMLButtonElement): HTMLElement {
  const el = document.createElement('div');
  el.className = 'empty-state';
  const h = document.createElement('div');
  h.className = 'empty-state-title';
  h.textContent = title;
  const p = document.createElement('p');
  p.className = 'empty-state-desc';
  p.textContent = desc;
  el.append(h, p);
  if (action) el.appendChild(action);
  return el;
}

export function btnRow(...buttons: HTMLElement[]): HTMLElement {
  const el = document.createElement('div');
  el.className = 'btn-row';
  buttons.forEach((b) => el.appendChild(b));
  return el;
}

export function button(
  label: string,
  opts: {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
    size?: 'sm' | 'md';
    block?: boolean;
    id?: string;
    type?: 'button' | 'submit';
    disabled?: boolean;
    loading?: boolean;
    onClick?: () => void;
  } = {},
): HTMLButtonElement {
  const el = document.createElement('button');
  el.type = opts.type ?? 'button';
  el.textContent = label;
  el.className = `btn btn-${opts.variant ?? 'primary'}${opts.size === 'sm' ? ' btn-sm' : ''}${opts.block ? ' btn-block' : ''}${opts.loading ? ' btn-loading' : ''}`;
  if (opts.id) el.id = opts.id;
  if (opts.disabled || opts.loading) el.disabled = true;
  if (opts.onClick) el.addEventListener('click', opts.onClick);
  return el;
}

export function badge(text: string, tone: 'default' | 'success' | 'warn' | 'danger' | 'accent' = 'default'): HTMLElement {
  const el = document.createElement('span');
  el.className = tone === 'default' ? 'badge' : `badge badge-${tone}`;
  el.textContent = text;
  return el;
}

export function segmentedControl<T extends string>(
  options: { id: T; label: string }[],
  value: T,
  onChange: (next: T) => void,
  ariaLabel?: string,
): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'segmented';
  wrap.setAttribute('role', 'radiogroup');
  if (ariaLabel) wrap.setAttribute('aria-label', ariaLabel);

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `segmented-option${value === opt.id ? ' active' : ''}`;
    btn.setAttribute('role', 'radio');
    btn.setAttribute('aria-checked', value === opt.id ? 'true' : 'false');
    btn.textContent = opt.label;
    btn.addEventListener('click', () => {
      if (value === opt.id) return;
      wrap.querySelectorAll('.segmented-option').forEach((el) => {
        el.classList.remove('active');
        el.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      onChange(opt.id);
    });
    wrap.appendChild(btn);
  });

  return wrap;
}
