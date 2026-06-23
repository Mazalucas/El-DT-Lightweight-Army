export function icon(name: string): string {
  const icons: Record<string, string> = {
    home: '<path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V9.5Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
    briefcase:
      '<rect x="3" y="7" width="18" height="13" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" fill="none" stroke="currentColor" stroke-width="1.75"/>',
    receipt:
      '<path d="M6 2h12v20l-2-1.5L14 22l-2-1.5L10 22l-2-1.5L6 22V2Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M9 7h6M9 11h6M9 15h4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    settings:
      '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    sun: '<circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    moon: '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
    monitor:
      '<rect x="2" y="3" width="20" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M8 21h8M12 17v4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    chevron:
      '<path d="m9 6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
    search:
      '<circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    logout:
      '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    folder:
      '<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
    help: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M9.5 9.25A2.75 2.75 0 1 1 12.25 12c-1.25 0-2 1-2 2.25M12 17h.01" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    building:
      '<path d="M4 21V5a1 1 0 0 1 1-1h5v16M14 21V9a1 1 0 0 1 1-1h5v13M4 21h16M9 9h1M9 13h1M9 17h1M15 13h1M15 17h1" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
    brain:
      '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
    inbox:
      '<path d="M22 12h-6l-2 3H10l-2-3H4V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v6Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
    calendar:
      '<rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    user:
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
    users:
      '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
    check:
      '<path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
    share:
      '<circle cx="18" cy="5" r="3" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="6" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.75"/><circle cx="18" cy="19" r="3" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" stroke="currentColor" stroke-width="1.75"/>',
    mail:
      '<rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.75"/><path d="m22 7-10 7L2 7" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/>',
    close:
      '<path d="M18 6 6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    plus:
      '<path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    send:
      '<path d="m22 2-7 20-4-9-9-4 20-7Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><path d="M22 2 11 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/>',
    external:
      '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>',
  };
  const path = icons[name] ?? icons.home;
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${path}</svg>`;
}

export function svgEl(name: string): HTMLElement {
  const wrap = document.createElement('span');
  wrap.innerHTML = icon(name);
  return wrap.firstElementChild as HTMLElement;
}
