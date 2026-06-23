import { APP_VERSION } from '@shared/app-version.js';
import type { Organization, OrgRole } from '@shared/types.js';
import { logout } from '../lib/firebase.js';
import {
  buildNavTree,
  isNavGroupActive,
  isNavItemActive,
  resolveNavHref,
  type NavContext,
} from '../lib/nav-config.js';
import { orgDisplayName, orgInitials } from '../lib/org-branding.js';
import { parseRoute } from '../lib/router.js';
import { icon } from '../ui/icons.js';
import { getActiveSubnavLabel, openMobileSubnav, renderMobileSubnavSheet, renderNavTree } from '../ui/nav-tree.js';
import { loadUserOrgOptions } from './org-options.js';
import { renderSidebarProfileSwitcher } from './workspace-ui.js';

export type ShellOptions = {
  ctx: NavContext;
  org?: Organization | null;
};

function renderBrand(container: HTMLElement, org: Organization | null | undefined, compact = false): void {
  container.replaceChildren();
  container.className = compact ? 'app-brand app-brand--compact' : 'app-brand';

  if (org) {
    container.classList.add('app-brand--org');
    const mark = document.createElement('div');
    mark.className = 'app-brand-mark app-brand-mark--org';
    if (org.branding?.logoUrl) {
      const img = document.createElement('img');
      img.src = org.branding.logoUrl;
      img.alt = orgDisplayName(org);
      img.className = 'app-brand-logo';
      mark.appendChild(img);
    } else {
      mark.textContent = orgInitials(orgDisplayName(org));
    }
    const text = document.createElement('span');
    text.className = 'app-brand-text';
    text.textContent = orgDisplayName(org);
    container.append(mark, text);
    return;
  }

  container.innerHTML = `
    <div class="app-brand-mark">${icon('brain')}</div>
    <span class="app-brand-text">Cerebro</span>
  `;
}

function wireLogout(btn: HTMLButtonElement): void {
  btn.addEventListener('click', async () => {
    await logout();
    location.hash = '#/login';
    location.reload();
  });
}

function renderBottomNav(bottomNav: HTMLElement, ctx: NavContext, mobileSheet: HTMLElement | null): void {
  bottomNav.replaceChildren();
  buildNavTree(ctx).forEach((item) => {
    const a = document.createElement('a');
    const active = item.children?.length ? isNavGroupActive(item, ctx) : isNavItemActive(item, ctx);
    a.className = `app-bottom-nav-link${active ? ' active' : ''}`;
    a.href = resolveNavHref(item, ctx);
    a.innerHTML = `${icon(item.iconName)}<span class="nav-label">${item.label}</span>`;
    if (item.children?.length && active && mobileSheet) {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openMobileSubnav(mobileSheet);
      });
    }
    bottomNav.appendChild(a);
  });
}

function syncMobileTopbar(topbar: HTMLElement, ctx: NavContext, mobileSheet: HTMLElement | null): void {
  topbar.querySelector('.mobile-subnav-trigger')?.remove();
  const mobileSubLabel = getActiveSubnavLabel(ctx);
  if (!mobileSubLabel || !mobileSheet) return;

  const subBtn = document.createElement('button');
  subBtn.type = 'button';
  subBtn.className = 'mobile-subnav-trigger';
  subBtn.dataset.shellPart = 'mobile-trigger';
  subBtn.innerHTML = `${mobileSubLabel}${icon('chevron')}`;
  subBtn.addEventListener('click', () => openMobileSubnav(mobileSheet));
  const logoutBtn = topbar.querySelector('.app-topbar-logout');
  if (logoutBtn) topbar.insertBefore(subBtn, logoutBtn);
  else topbar.appendChild(subBtn);
}

function workspaceScopeFromCtx(ctx: NavContext): 'personal' | 'org' {
  return ctx.route === 'org' || ctx.route === 'org-admin' ? 'org' : 'personal';
}

function mountProfileSwitcher(host: HTMLElement, ctx: NavContext, compact = false): void {
  host.replaceChildren();
  const placeholder = document.createElement('div');
  placeholder.className = 'sidebar-profiles-placeholder';
  host.appendChild(placeholder);

  void loadUserOrgOptions()
    .then((orgs) => {
      host.replaceChildren(
        renderSidebarProfileSwitcher({
          scope: workspaceScopeFromCtx(ctx),
          orgId: ctx.orgId,
          orgName: ctx.org?.branding?.displayName ?? ctx.org?.name,
          orgs,
          profTab: ctx.profTab ?? 'dashboard',
          compact,
        }),
      );
    })
    .catch(() => {
      host.replaceChildren(
        renderSidebarProfileSwitcher({
          scope: workspaceScopeFromCtx(ctx),
          orgId: ctx.orgId,
          orgName: ctx.org?.name,
          orgs: [],
          profTab: ctx.profTab ?? 'dashboard',
          compact,
        }),
      );
    });
}

function syncMobileSheet(layout: HTMLElement, ctx: NavContext): HTMLElement | null {
  layout.querySelector('[data-shell-part="mobile-sheet"]')?.remove();
  const mobileSheet = renderMobileSubnavSheet(ctx);
  if (mobileSheet) {
    mobileSheet.dataset.shellPart = 'mobile-sheet';
    layout.appendChild(mobileSheet);
  }
  return mobileSheet;
}

export function updateAppShell(layout: HTMLElement, options: ShellOptions): void {
  const { ctx, org } = options;
  const mobileSheet = syncMobileSheet(layout, ctx);

  const brand = layout.querySelector<HTMLElement>('[data-shell-part="brand"]');
  const brandCompact = layout.querySelector<HTMLElement>('[data-shell-part="brand-compact"]');
  if (brand) renderBrand(brand, org);
  if (brandCompact) renderBrand(brandCompact, org, true);

  const profileSwitcher = layout.querySelector<HTMLElement>('[data-shell-part="profile-switcher"]');
  if (profileSwitcher) mountProfileSwitcher(profileSwitcher, ctx);

  const profileSwitcherMobile = layout.querySelector<HTMLElement>('[data-shell-part="profile-switcher-mobile"]');
  if (profileSwitcherMobile) mountProfileSwitcher(profileSwitcherMobile, ctx, true);

  const nav = layout.querySelector<HTMLElement>('[data-shell-part="nav"]');
  if (nav) renderNavTree(nav, { ctx });

  const bottomNav = layout.querySelector<HTMLElement>('[data-shell-part="bottom-nav"]');
  if (bottomNav) renderBottomNav(bottomNav, ctx, mobileSheet);

  const topbar = layout.querySelector<HTMLElement>('[data-shell-part="topbar"]');
  if (topbar) syncMobileTopbar(topbar, ctx, mobileSheet);
}

export function createAppShell(contentView: HTMLElement, options: ShellOptions): HTMLElement {
  const { ctx, org } = options;
  const wrap = document.createElement('div');
  wrap.className = 'app-layout';

  const mobileSheet = renderMobileSubnavSheet(ctx);
  if (mobileSheet) mobileSheet.dataset.shellPart = 'mobile-sheet';

  const topbar = document.createElement('header');
  topbar.className = 'app-topbar';
  topbar.dataset.shellPart = 'topbar';

  const topBrand = document.createElement('div');
  topBrand.dataset.shellPart = 'brand-compact';
  renderBrand(topBrand, org, true);
  topbar.appendChild(topBrand);

  const profileSwitcherMobile = document.createElement('div');
  profileSwitcherMobile.dataset.shellPart = 'profile-switcher-mobile';
  profileSwitcherMobile.className = 'app-topbar-profile';
  mountProfileSwitcher(profileSwitcherMobile, ctx, true);
  topbar.appendChild(profileSwitcherMobile);

  syncMobileTopbar(topbar, ctx, mobileSheet);

  const logoutMobile = document.createElement('button');
  logoutMobile.type = 'button';
  logoutMobile.className = 'btn btn-ghost app-logout-btn app-topbar-logout';
  logoutMobile.setAttribute('aria-label', 'Salir');
  logoutMobile.innerHTML = icon('logout');
  wireLogout(logoutMobile);
  topbar.appendChild(logoutMobile);

  const aside = document.createElement('aside');
  aside.className = 'app-sidebar';
  aside.setAttribute('aria-label', 'Navegación lateral');

  const brand = document.createElement('div');
  brand.dataset.shellPart = 'brand';
  renderBrand(brand, org);

  const profileSwitcher = document.createElement('div');
  profileSwitcher.dataset.shellPart = 'profile-switcher';
  profileSwitcher.className = 'app-sidebar-profiles';
  mountProfileSwitcher(profileSwitcher, ctx);

  const navScroll = document.createElement('div');
  navScroll.className = 'app-nav-scroll';

  const nav = document.createElement('nav');
  nav.className = 'app-nav';
  nav.dataset.shellPart = 'nav';
  nav.setAttribute('aria-label', 'Principal');
  renderNavTree(nav, { ctx });
  navScroll.appendChild(nav);

  const footer = document.createElement('div');
  footer.className = 'app-sidebar-footer';
  const versionEl = document.createElement('span');
  versionEl.className = 'app-version';
  versionEl.textContent = `v${APP_VERSION}`;
  versionEl.title = 'Versión desplegada';
  const logoutBtn = document.createElement('button');
  logoutBtn.type = 'button';
  logoutBtn.className = 'btn btn-ghost app-logout-btn app-sidebar-logout';
  logoutBtn.innerHTML = `${icon('logout')}<span class="app-logout-label">Salir</span>`;
  wireLogout(logoutBtn);
  footer.append(versionEl, logoutBtn);

  aside.append(brand, profileSwitcher, navScroll, footer);

  const bottomNav = document.createElement('nav');
  bottomNav.className = 'app-bottom-nav';
  bottomNav.dataset.shellPart = 'bottom-nav';
  bottomNav.setAttribute('aria-label', 'Navegación principal');
  renderBottomNav(bottomNav, ctx, mobileSheet);

  const main = document.createElement('main');
  main.className = 'app-main';
  main.appendChild(contentView);

  wrap.append(topbar, aside, main, bottomNav);
  if (mobileSheet) wrap.appendChild(mobileSheet);
  return wrap;
}

/** @deprecated Use createAppShell — kept for compatibility during migration */
export function renderShell(content: HTMLElement, options: ShellOptions): HTMLElement {
  return createAppShell(content, options);
}

export function buildNavContextFromRoute(
  parsed: ReturnType<typeof parseRoute>,
  org: Organization | null | undefined,
  membershipRole?: OrgRole,
): NavContext {
  return {
    route: parsed.route,
    profTab: parsed.profTab,
    orgId: parsed.orgId,
    orgAdminTab: parsed.orgAdminTab,
    settingsSection: parsed.settingsSection,
    org: org ?? null,
    membershipRole,
  };
}
