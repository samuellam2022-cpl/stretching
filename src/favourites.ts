const KEY = 'stretching:favourites';

function load(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

let favs = load();

function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify([...favs]));
  } catch {
    // Storage full or blocked (e.g. private mode) – keep working in memory.
  }
}

export const isFavourite = (id: string): boolean => favs.has(id);

export function toggleFavourite(id: string): boolean {
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  save();
  return favs.has(id);
}

export const favouriteIds = (): string[] => [...favs];

// Keep in sync if the app is open in two tabs.
window.addEventListener('storage', (e) => {
  if (e.key === KEY) favs = load();
});
