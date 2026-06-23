import type { Category } from '../core/models/category';

export function mountQuickAdd(
  container: HTMLElement,
  categories: Category[],
  defaultCategoryId: string,
  onSubmit: (raw: string, categoryId: string) => void,
): { getCategoryId: () => string; setCategoryId: (id: string) => void } {
  let activeCategoryId = defaultCategoryId;

  container.innerHTML = `
    <form class="quick-add" id="quick-add-form">
      <div class="category-chips" role="group" aria-label="Categoría">
        ${categories
          .map(
            (c) =>
              `<button type="button" class="chip ${c.id === activeCategoryId ? 'is-active' : ''}" data-category="${c.id}" style="--chip-color: ${c.color}" title="${c.label}">
                <span class="chip-icon">${c.icon}</span>
                <span class="chip-label">${c.label}</span>
              </button>`,
          )
          .join('')}
      </div>
      <div class="quick-add-row">
        <input type="text" id="quick-add-input" placeholder="Nuevo recordatorio… @cat #tag mañana" autocomplete="off" />
        <button type="submit" class="btn-primary">Añadir</button>
      </div>
    </form>
  `;

  const form = container.querySelector('#quick-add-form') as HTMLFormElement;
  const input = container.querySelector('#quick-add-input') as HTMLInputElement;
  const chips = container.querySelectorAll('.chip');

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategoryId = (chip as HTMLElement).dataset.category!;
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) return;
    onSubmit(raw, activeCategoryId);
    input.value = '';
    input.focus();
  });

  return {
    getCategoryId: () => activeCategoryId,
    setCategoryId: (id: string) => {
      activeCategoryId = id;
      chips.forEach((c) => {
        c.classList.toggle('is-active', (c as HTMLElement).dataset.category === id);
      });
    },
  };
}

export function mountSidebar(
  container: HTMLElement,
  onFilter: (view: string, categoryId?: string, tag?: string) => void,
): void {
  container.innerHTML = `
    <nav class="sidebar" aria-label="Filtros">
      <h2 class="sidebar-title">Vistas</h2>
      <button type="button" class="filter-btn is-active" data-view="all">Inbox</button>
      <button type="button" class="filter-btn" data-view="today">Hoy</button>
      <button type="button" class="filter-btn" data-view="overdue">Vencidos</button>
      <button type="button" class="filter-btn" data-view="no-date">Sin fecha</button>
      <button type="button" class="filter-btn" data-view="done">Hechos</button>
      <div id="sidebar-tags" class="sidebar-tags"></div>
    </nav>
  `;

  container.querySelectorAll('.filter-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      onFilter((btn as HTMLElement).dataset.view!);
    });
  });
}

export function updateSidebarTags(
  container: HTMLElement,
  tags: { tag: string; count: number }[],
  onTagClick: (tag: string) => void,
): void {
  const el = container.querySelector('#sidebar-tags');
  if (!el) return;
  if (tags.length === 0) {
    el.innerHTML = '';
    return;
  }
  el.innerHTML = `
    <h2 class="sidebar-title">Tags</h2>
    ${tags
      .slice(0, 12)
      .map(
        (t) =>
          `<button type="button" class="tag-filter" data-tag="${t.tag}">#${t.tag} <span class="tag-count">${t.count}</span></button>`,
      )
      .join('')}
  `;
  el.querySelectorAll('.tag-filter').forEach((btn) => {
    btn.addEventListener('click', () => onTagClick((btn as HTMLElement).dataset.tag!));
  });
}
