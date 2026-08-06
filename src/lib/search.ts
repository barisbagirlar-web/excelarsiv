export interface SearchItem {
  name: string;
  summary: string;
  category: string;
  url: string;
}

const normalize = (text: string): string => text.toLocaleLowerCase('tr-TR');

export function searchTemplates(items: SearchItem[], query: string, limit = 6): SearchItem[] {
  const q = normalize(query.trim());
  if (q.length < 2) return [];
  return items
    .filter(
      (item) =>
        normalize(item.name).includes(q) ||
        normalize(item.summary).includes(q) ||
        normalize(item.category).includes(q)
    )
    .slice(0, limit);
}
