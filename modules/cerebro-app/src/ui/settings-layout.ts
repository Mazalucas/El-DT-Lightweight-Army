import { icon, svgEl } from './icons.js';

export interface SettingsNavItem {
  id: string;
  label: string;
  iconName: string;
}

export interface SettingsSummaryItem {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'warn' | 'accent';
}

export function settingsSummary(items: SettingsSummaryItem[]): HTMLElement {
  const el = document.createElement('div');
  el.className = 'settings-summary';
  el.setAttribute('role', 'list');
  items.forEach((item) => {
    const card = document.createElement('div');
    card.className = `settings-summary-item${item.tone ? ` settings-summary-item--${item.tone}` : ''}`;
    card.setAttribute('role', 'listitem');
    card.innerHTML = `
      <span class="settings-summary-label">${item.label}</span>
      <span class="settings-summary-value">${item.value}</span>
    `;
    el.appendChild(card);
  });
  return el;
}

export function settingsNav(items: SettingsNavItem[], onSelect?: (id: string) => void): HTMLElement {
  const nav = document.createElement('nav');
  nav.className = 'settings-nav';
  nav.setAttribute('aria-label', 'Secciones de ajustes');

  items.forEach((item) => {
    const a = document.createElement('a');
    a.className = 'settings-nav-link';
    a.href = `#/settings?section=${item.id}`;
    a.dataset.section = item.id;
    a.innerHTML = `${icon(item.iconName)}<span>${item.label}</span>`;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.getElementById(`settings-${item.id}`);
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      nav.querySelectorAll('.settings-nav-link').forEach((link) => link.classList.remove('active'));
      a.classList.add('active');
      history.replaceState(null, '', `#/settings?section=${item.id}`);
      onSelect?.(item.id);
    });
    nav.appendChild(a);
  });

  return nav;
}

export function settingsCard(opts: {
  id: string;
  title: string;
  desc?: string;
  iconName?: string;
}): { el: HTMLElement; body: HTMLElement } {
  const el = document.createElement('section');
  el.className = 'settings-card';
  el.id = `settings-${opts.id}`;

  const head = document.createElement('header');
  head.className = 'settings-card-head';

  if (opts.iconName) {
    const mark = document.createElement('span');
    mark.className = 'settings-card-icon';
    mark.appendChild(svgEl(opts.iconName));
    head.appendChild(mark);
  }

  const text = document.createElement('div');
  text.className = 'settings-card-text';
  const h2 = document.createElement('h2');
  h2.textContent = opts.title;
  text.appendChild(h2);
  if (opts.desc) {
    const p = document.createElement('p');
    p.className = 'settings-card-desc';
    p.textContent = opts.desc;
    text.appendChild(p);
  }
  head.appendChild(text);

  el.appendChild(head);

  const body = document.createElement('div');
  body.className = 'settings-card-body';
  el.appendChild(body);

  return { el, body };
}

export function activateSettingsNav(sectionId: string | null): void {
  document.querySelectorAll('.settings-nav-link').forEach((link) => {
    link.classList.toggle('active', (link as HTMLAnchorElement).dataset.section === sectionId);
  });
}

export function scrollToSettingsSection(sectionId: string | null): void {
  if (!sectionId) return;
  const target = document.getElementById(`settings-${sectionId}`);
  if (!target) return;
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    activateSettingsNav(sectionId);
  });
}
