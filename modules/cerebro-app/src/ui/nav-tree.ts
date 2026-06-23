import { api } from '../lib/api.js';
import {
  buildNavTree,
  isNavGroupActive,
  isNavItemActive,
  resolveNavHref,
  type NavContext,
  type NavItemDef,
} from '../lib/nav-config.js';
import { icon } from './icons.js';

export type NavTreeOptions = {
  ctx: NavContext;
  linkClass?: string;
  subLinkClass?: string;
  onSubNavOpen?: () => void;
};

function visibleChildren(item: NavItemDef, ctx: NavContext): NavItemDef[] {
  return (item.children ?? []).filter((c) => c.visible?.(ctx) !== false);
}

const NAV_EXPAND_STORAGE_KEY = 'cerebro-nav-expanded';

function readExpandedPreference(itemId: string): boolean | null {
  try {
    const raw = sessionStorage.getItem(NAV_EXPAND_STORAGE_KEY);
    if (!raw) return null;
    const map = JSON.parse(raw) as Record<string, boolean>;
    return itemId in map ? map[itemId]! : null;
  } catch {
    return null;
  }
}

function writeExpandedPreference(itemId: string, expanded: boolean): void {
  try {
    const raw = sessionStorage.getItem(NAV_EXPAND_STORAGE_KEY);
    const map: Record<string, boolean> = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    map[itemId] = expanded;
    sessionStorage.setItem(NAV_EXPAND_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function initialExpanded(item: NavItemDef, ctx: NavContext): boolean {
  const stored = readExpandedPreference(item.id);
  if (stored !== null) return stored;
  return isNavGroupActive(item, ctx);
}

async function attachBadge(el: HTMLElement, item: NavItemDef, ctx: NavContext): Promise<void> {
  if (!item.badgeKey) return;
  try {
    let count = 0;
    if (item.badgeKey === 'profBoard') {
      const { board } = await api.getBoard();
      count = board.counts.suggestions;
    } else if (item.badgeKey === 'orgBoard' && ctx.orgId) {
      const { board } = await api.getOrgBoard(ctx.orgId);
      count = board.counts.suggestions;
    } else if (item.badgeKey === 'profSuggestions') {
      const { suggestions } = await api.getSuggestions();
      count = suggestions.length;
    } else if (item.badgeKey === 'orgSuggestions' && ctx.orgId) {
      const { suggestions } = await api.getOrgSuggestions(ctx.orgId);
      count = suggestions.length;
    }
    if (count > 0 && !el.querySelector('.nav-badge')) {
      const span = document.createElement('span');
      span.className = 'nav-badge';
      span.textContent = String(Math.min(count, 99));
      el.appendChild(span);
    }
  } catch {
    /* ignore */
  }
}

function navIconMarkup(iconName: string): string {
  return `<span class="nav-icon" aria-hidden="true">${icon(iconName)}</span>`;
}

function renderSubLink(item: NavItemDef, ctx: NavContext, subLinkClass: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = `${subLinkClass}${isNavItemActive(item, ctx) ? ' active' : ''}`;
  a.href = resolveNavHref(item, ctx);
  if (isNavItemActive(item, ctx)) a.setAttribute('aria-current', 'page');
  a.innerHTML = `${navIconMarkup(item.iconName)}<span class="nav-label">${item.label}</span>`;
  void attachBadge(a, item, ctx);
  return a;
}

function renderGroupLink(item: NavItemDef, ctx: NavContext, linkClass: string): HTMLAnchorElement {
  const a = document.createElement('a');
  const active = isNavGroupActive(item, ctx);
  a.className = `${linkClass} app-nav-group-link${active ? ' active' : ''}`;
  a.href = resolveNavHref(item, ctx);
  a.innerHTML = `${navIconMarkup(item.iconName)}<span class="nav-label">${item.label}</span>`;
  if (item.badgeKey === 'profSuggestions' || item.badgeKey === 'orgSuggestions') {
    void attachBadge(a, item, ctx);
  }
  return a;
}

function renderGroupChevron(item: NavItemDef, expanded: boolean): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `app-nav-group-chevron${expanded ? ' nav-chevron--open' : ''}`;
  btn.setAttribute('aria-expanded', String(expanded));
  btn.setAttribute('aria-label', expanded ? `Contraer ${item.label}` : `Expandir ${item.label}`);
  btn.innerHTML = icon('chevron');
  return btn;
}

function renderLeaf(item: NavItemDef, ctx: NavContext, linkClass: string): HTMLAnchorElement {
  const a = document.createElement('a');
  a.className = `${linkClass}${isNavItemActive(item, ctx) ? ' active' : ''}`;
  a.href = resolveNavHref(item, ctx);
  if (isNavItemActive(item, ctx)) a.setAttribute('aria-current', 'page');
  a.innerHTML = `${navIconMarkup(item.iconName)}<span class="nav-label">${item.label}</span>`;
  return a;
}

function renderNavItem(item: NavItemDef, ctx: NavContext, linkClass: string, subLinkClass: string): HTMLElement {
  const children = visibleChildren(item, ctx);
  if (!children.length) {
    return renderLeaf(item, ctx, linkClass);
  }

  const group = document.createElement('div');
  group.className = 'app-nav-group';
  const expanded = initialExpanded(item, ctx);
  group.dataset.expanded = String(expanded);

  const link = renderGroupLink(item, ctx, linkClass);
  const chevron = renderGroupChevron(item, expanded);

  const head = document.createElement('div');
  head.className = 'app-nav-group-head';
  head.append(link, chevron);

  const sub = document.createElement('div');
  sub.className = 'app-nav-sub';
  sub.hidden = !expanded;
  sub.setAttribute('role', 'group');
  sub.setAttribute('aria-label', `Subsecciones de ${item.label}`);

  children.forEach((child) => sub.appendChild(renderSubLink(child, ctx, subLinkClass)));

  chevron.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isExpanded = group.dataset.expanded === 'true';
    const next = !isExpanded;
    group.dataset.expanded = String(next);
    sub.hidden = !next;
    chevron.setAttribute('aria-expanded', String(next));
    chevron.classList.toggle('nav-chevron--open', next);
    chevron.setAttribute('aria-label', next ? `Contraer ${item.label}` : `Expandir ${item.label}`);
    writeExpandedPreference(item.id, next);
  });

  group.append(head, sub);
  return group;
}

export function renderNavTree(host: HTMLElement, options: NavTreeOptions): void {
  const linkClass = options.linkClass ?? 'app-nav-link';
  const subLinkClass = options.subLinkClass ?? 'app-nav-sub-link';
  host.replaceChildren();
  buildNavTree(options.ctx).forEach((item) => {
    host.appendChild(renderNavItem(item, options.ctx, linkClass, subLinkClass));
  });
}

export function renderMobileSubnavSheet(ctx: NavContext): HTMLElement | null {
  const tree = buildNavTree(ctx);
  const activeGroup = tree.find((item) => item.children?.length && isNavGroupActive(item, ctx));
  if (!activeGroup) return null;

  const children = visibleChildren(activeGroup, ctx);
  if (!children.length) return null;

  const sheet = document.createElement('div');
  sheet.className = 'mobile-subnav-sheet';
  sheet.hidden = true;
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-label', `Subsecciones de ${activeGroup.label}`);

  const backdrop = document.createElement('button');
  backdrop.type = 'button';
  backdrop.className = 'mobile-subnav-backdrop';
  backdrop.setAttribute('aria-label', 'Cerrar menú');

  const panel = document.createElement('nav');
  panel.className = 'mobile-subnav-panel';
  panel.setAttribute('aria-label', activeGroup.label);

  const title = document.createElement('p');
  title.className = 'mobile-subnav-title';
  title.textContent = activeGroup.label;
  panel.appendChild(title);

  children.forEach((child) => {
    const link = renderSubLink(child, ctx, 'mobile-subnav-link');
    link.addEventListener('click', () => {
      sheet.hidden = true;
      document.body.classList.remove('mobile-subnav-open');
    });
    panel.appendChild(link);
  });

  function close(): void {
    sheet.hidden = true;
    document.body.classList.remove('mobile-subnav-open');
  }

  backdrop.addEventListener('click', close);

  sheet.append(backdrop, panel);
  return sheet;
}

export function openMobileSubnav(sheet: HTMLElement | null): void {
  if (!sheet) return;
  sheet.hidden = false;
  document.body.classList.add('mobile-subnav-open');
}

export function getActiveSubnavLabel(ctx: NavContext): string | null {
  const tree = buildNavTree(ctx);
  for (const group of tree) {
    for (const child of group.children ?? []) {
      if (child.visible?.(ctx) === false) continue;
      if (isNavItemActive(child, ctx)) return child.label;
    }
  }
  if (ctx.route === 'profesional-meeting') return 'Reuniones';
  return null;
}
