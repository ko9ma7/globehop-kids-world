const PREFIX = 'globehop:';

export function getStored(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function setStored(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage can be blocked; the app still works without persistence.
  }
}

export function pushRecent(item, max = 8) {
  const recent = getStored('recent', []);
  const next = [item, ...recent.filter((x) => x.key !== item.key)].slice(0, max);
  setStored('recent', next);
  return next;
}

export function toggleFavorite(item) {
  const favorites = getStored('favorites', []);
  const exists = favorites.some((x) => x.key === item.key);
  const next = exists ? favorites.filter((x) => x.key !== item.key) : [item, ...favorites].slice(0, 24);
  setStored('favorites', next);
  return { favorites: next, active: !exists };
}
