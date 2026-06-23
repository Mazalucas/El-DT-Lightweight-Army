import { icon } from './icons.js';
import { badge } from './primitives.js';

export type HubCardTone = 'default' | 'success' | 'warn' | 'danger' | 'accent';

export interface HubCardData {
  id: string;
  iconName: string;
  title: string;
  value: string;
  detail?: string;
  tone?: HubCardTone;
  href?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function renderHubCard(data: HubCardData): HTMLElement {
  const card = document.createElement('article');
  card.className = `hub-card hub-card--${data.tone ?? 'default'}`;
  card.dataset.hubId = data.id;

  const head = document.createElement('div');
  head.className = 'hub-card-head';
  head.innerHTML = `<span class="hub-card-icon" aria-hidden="true">${icon(data.iconName)}</span>`;
  const titles = document.createElement('div');
  titles.className = 'hub-card-titles';
  const h3 = document.createElement('h3');
  h3.textContent = data.title;
  titles.append(h3);
  if (data.tone && data.tone !== 'default') {
    titles.appendChild(badge(data.value, data.tone === 'accent' ? 'accent' : data.tone));
  }
  head.appendChild(titles);
  card.appendChild(head);

  if (data.tone === 'default' || !data.tone) {
    const valueEl = document.createElement('p');
    valueEl.className = 'hub-card-value';
    valueEl.textContent = data.value;
    card.appendChild(valueEl);
  }

  if (data.detail) {
    const detail = document.createElement('p');
    detail.className = 'hub-card-detail muted';
    detail.textContent = data.detail;
    card.appendChild(detail);
  }

  if (data.href || data.onAction) {
    const foot = document.createElement('div');
    foot.className = 'hub-card-foot';
    const btn = document.createElement(data.href ? 'a' : 'button');
    btn.className = 'hub-card-link';
    btn.textContent = data.actionLabel ?? 'Ver más';
    if (data.href) {
      (btn as HTMLAnchorElement).href = data.href;
    } else {
      (btn as HTMLButtonElement).type = 'button';
      btn.addEventListener('click', () => data.onAction?.());
    }
    foot.appendChild(btn);
    card.appendChild(foot);
  }

  return card;
}

export function renderHubGrid(cards: HubCardData[]): HTMLElement {
  const grid = document.createElement('div');
  grid.className = 'hub-grid';
  grid.setAttribute('role', 'list');
  cards.forEach((c) => {
    const item = renderHubCard(c);
    item.setAttribute('role', 'listitem');
    grid.appendChild(item);
  });
  return grid;
}
