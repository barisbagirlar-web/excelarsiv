const normalize = (text: string): string => text.toLocaleLowerCase('tr-TR');

export function mountCatalogFilter(): void {
  const grid = document.querySelector<HTMLElement>('[data-template-grid]');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-template-card]'));
  const search = document.querySelector<HTMLInputElement>('[data-catalog-search]');
  const chips = Array.from(document.querySelectorAll<HTMLElement>('[data-category-filter]'));
  const empty = document.querySelector<HTMLElement>('[data-empty-state]');

  const params = new URLSearchParams(window.location.search);
  let activeCategory = params.get('kategori') ?? '';

  if (chips.length > 0) {
    chips.forEach((chip) => chip.classList.toggle('is-active', chip.dataset.category === activeCategory));
  }

  const apply = (): void => {
    const q = normalize((search?.value ?? '').trim());
    let visible = 0;

    for (const card of cards) {
      const name = card.dataset.name ?? '';
      const category = card.dataset.category ?? '';
      const summary = card.dataset.summary ?? '';
      const matchCategory = activeCategory === '' || category === activeCategory;
      const matchQuery = q.length < 2 || normalize(name).includes(q) || normalize(summary).includes(q) || normalize(category).includes(q);
      const show = matchCategory && matchQuery;
      card.hidden = !show;
      if (show) visible += 1;
    }

    if (empty) empty.hidden = visible > 0;

    const url = new URL(window.location.href);
    if (q.length >= 2) url.searchParams.set('q', search?.value.trim() ?? '');
    else url.searchParams.delete('q');
    if (activeCategory) url.searchParams.set('kategori', activeCategory);
    else url.searchParams.delete('kategori');
    history.replaceState(null, '', url);
  };

  search?.addEventListener('input', apply);
  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category ?? '';
      chips.forEach((c) => c.classList.toggle('is-active', c === chip));
      apply();
    });
  });

  if (search) {
    const q = params.get('q') ?? '';
    if (q.length >= 2) {
      search.value = q;
      apply();
    }
  } else {
    apply();
  }
}
