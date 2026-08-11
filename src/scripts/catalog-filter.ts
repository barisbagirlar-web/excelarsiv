const normalize = (text: string): string =>
  text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ıİ]/g, 'i')
    .replace(/[ğĞ]/g, 'g')
    .replace(/[şŞ]/g, 's')
    .replace(/[çÇ]/g, 'c')
    .replace(/[öÖ]/g, 'o')
    .replace(/[üÜ]/g, 'u')
    .replace(/[^a-z0-9\s-]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function mountCatalogFilter(): void {
  const grid = document.querySelector<HTMLElement>('[data-template-grid]');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll<HTMLElement>('[data-template-card]'));
  const search = document.querySelector<HTMLInputElement>('[data-catalog-search]');
  const searchClear = document.querySelector<HTMLButtonElement>('[data-catalog-search-clear]');
  const chips = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-category-filter]'));
  const resultCount = document.querySelector<HTMLElement>('[data-result-count]');
  const clearAll = document.querySelector<HTMLButtonElement>('[data-catalog-clear]');

  const ensureEmptyState = (): HTMLElement => {
    const wrap = grid.closest<HTMLElement>('[data-template-grid-wrap]');
    let empty = grid.parentElement?.querySelector<HTMLElement>('[data-empty-state]') ?? null;
    if (!empty) {
      empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.dataset.emptyState = '';
      empty.hidden = true;
      const icon = document.createElement('span');
      icon.className = 'empty-state__icon';
      icon.setAttribute('aria-hidden', 'true');
      icon.textContent = 'Ø';
      const title = document.createElement('h2');
      title.className = 'empty-state__title';
      title.textContent = 'Sonuç bulunamadı';
      const text = document.createElement('p');
      text.className = 'empty-state__text';
      text.dataset.emptyStateText = '';
      empty.append(icon, title, text);
      wrap?.append(empty);
    }
    return empty;
  };

  const params = new URLSearchParams(window.location.search);
  let activeCategory = params.get('kategori') ?? '';

  if (!chips.some((chip) => chip.dataset.category === activeCategory)) activeCategory = '';

  const setChipState = (): void => {
    chips.forEach((chip) => {
      const isActive = chip.dataset.category === activeCategory;
      chip.classList.toggle('is-active', isActive);
      chip.setAttribute('aria-pressed', String(isActive));
    });
  };

  const apply = (): void => {
    const rawQuery = (search?.value ?? '').trim();
    const q = normalize(rawQuery);
    let visible = 0;

    for (const card of cards) {
      const name = card.dataset.name ?? '';
      const category = card.dataset.category ?? '';
      const categoryLabel = card.dataset.categoryLabel ?? '';
      const summary = card.dataset.summary ?? '';
      const haystack = normalize(`${name} ${summary} ${category} ${categoryLabel}`);
      const matchCategory = activeCategory === '' || category === activeCategory;
      const matchQuery = q.length === 0 || haystack.includes(q);
      const show = matchCategory && matchQuery;
      const item = card.closest<HTMLElement>('[data-template-item]') ?? card;
      item.hidden = !show;
      if (show) visible += 1;
    }

    const empty = ensureEmptyState();
    if (empty) {
      empty.hidden = visible > 0;
      const text = empty.querySelector<HTMLElement>('[data-empty-state-text]');
      if (text) {
        text.textContent = rawQuery.length > 0
          ? `“${rawQuery}” için eşleşen şablon yok. Farklı bir anahtar kelime deneyin veya kategori filtrelerini temizleyin.`
          : 'Bu kategoriye uygun şablon bulunamadı.';
      }
    }
    if (resultCount) resultCount.textContent = String(visible);
    if (searchClear) searchClear.hidden = rawQuery.length === 0;
    if (clearAll) clearAll.hidden = rawQuery.length === 0 && activeCategory === '';

    const url = new URL(window.location.href);
    if (rawQuery.length > 0) url.searchParams.set('q', rawQuery);
    else url.searchParams.delete('q');
    if (activeCategory) url.searchParams.set('kategori', activeCategory);
    else url.searchParams.delete('kategori');
    history.replaceState(null, '', url);
  };

  setChipState();

  if (search) search.value = params.get('q') ?? '';

  search?.addEventListener('input', apply);
  searchClear?.addEventListener('click', () => {
    if (!search) return;
    search.value = '';
    search.focus();
    apply();
  });

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeCategory = chip.dataset.category ?? '';
      setChipState();
      apply();
    });
  });

  clearAll?.addEventListener('click', () => {
    activeCategory = '';
    if (search) search.value = '';
    setChipState();
    apply();
    search?.focus();
  });

  apply();
}
