export interface SearchItem {
  name: string;
  summary: string;
  category: string;
  url: string;
}

const escapeHtml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

const normalize = (text: string): string => text.toLocaleLowerCase('tr-TR');

export function mountHeroSearch(root: HTMLElement, items: SearchItem[]): void {
  const form = root.querySelector<HTMLFormElement>('form');
  const input = root.querySelector<HTMLInputElement>('input[type="search"]');
  const list = root.querySelector<HTMLUListElement>('ul');
  if (!form || !input || !list) return;

  const close = (): void => {
    list.hidden = true;
    list.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  };

  const open = (): void => {
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
  };

  const render = (query: string): void => {
    const q = normalize(query.trim());
    if (q.length < 2) {
      close();
      return;
    }
    const results = items
      .filter(
        (item) =>
          normalize(item.name).includes(q) ||
          normalize(item.summary).includes(q) ||
          normalize(item.category).includes(q)
      )
      .slice(0, 5);

    if (results.length === 0) {
      list.innerHTML = `<li class="hero-search__empty">“${escapeHtml(query.trim())}” için sonuç bulunamadı</li>`;
      open();
      return;
    }

    list.innerHTML = results
      .map(
        (result, index) => `
          <li>
            <a href="${result.url}" data-result-index="${index}">
              <span class="hero-search__name">${escapeHtml(result.name)}</span>
              <span class="hero-search__meta">${escapeHtml(result.category)}</span>
            </a>
          </li>`
      )
      .join('');
    open();
  };

  input.addEventListener('input', () => render(input.value));
  input.addEventListener('focus', () => {
    if (normalize(input.value).length >= 2) render(input.value);
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      input.blur();
      return;
    }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const links = Array.from(list.querySelectorAll<HTMLAnchorElement>('a[data-result-index]'));
    if (links.length === 0) return;
    event.preventDefault();
    const active = list.querySelector<HTMLAnchorElement>('a[data-result-index].is-highlighted');
    const activeIndex = active ? links.indexOf(active) : -1;
    const nextIndex =
      event.key === 'ArrowDown'
        ? (activeIndex + 1) % links.length
        : (activeIndex - 1 + links.length) % links.length;
    links.forEach((link, index) => {
      const isActive = index === nextIndex;
      link.classList.toggle('is-highlighted', isActive);
      if (isActive) link.scrollIntoView({ block: 'nearest' });
    });
  });
  document.addEventListener('click', (event) => {
    if (!root.contains(event.target as Node)) close();
  });
  form.addEventListener('submit', () => {
    if (normalize(input.value).length < 2) {
      event?.preventDefault();
      return;
    }
    const highlighted = list.querySelector<HTMLAnchorElement>('a[data-result-index].is-highlighted');
    if (highlighted) {
      event?.preventDefault();
      window.location.href = highlighted.href;
    }
  });
}
