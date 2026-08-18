const memory = new Map();
const ENDPOINT = 'https://en.wikipedia.org/w/api.php';

function cacheKey(title) {
  return `globehop:wiki-thumb:${String(title || '').trim().toLowerCase()}`;
}

function readCache(title) {
  const key = cacheKey(title);
  if (memory.has(key)) return memory.get(key);
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw);
    memory.set(key, data);
    return data;
  } catch {
    return null;
  }
}

function writeCache(title, data) {
  const key = cacheKey(title);
  memory.set(key, data);
  try { sessionStorage.setItem(key, JSON.stringify(data)); } catch { /* optional */ }
}

export async function fetchWikipediaImage(title, { size = 900, signal } = {}) {
  if (!title) return null;
  const cached = readCache(title);
  if (cached) return cached;
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    redirects: '1',
    prop: 'pageimages',
    piprop: 'thumbnail|original',
    pithumbsize: String(size),
    titles: title
  });
  const response = await fetch(`${ENDPOINT}?${params}`, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Wikipedia image request failed (${response.status})`);
  const json = await response.json();
  const pages = Object.values(json?.query?.pages || {});
  const page = pages.find((item) => item && !item.missing);
  const data = page ? {
    title: page.title,
    src: page.thumbnail?.source || page.original?.source || null,
    width: page.thumbnail?.width || page.original?.width || null,
    height: page.thumbnail?.height || page.original?.height || null
  } : null;
  if (data?.src) writeCache(title, data);
  return data?.src ? data : null;
}

export async function resolveWikipediaImages(items = [], { size = 900, limit = 8, signal } = {}) {
  const selected = items.slice(0, limit);
  const results = await Promise.allSettled(selected.map(async (item) => {
    const title = item.wikiTitle || item.imageTitle || item.name;
    const image = await fetchWikipediaImage(title, { size, signal });
    return image ? { ...item, image } : { ...item, image: null };
  }));
  return results.map((result, index) => result.status === 'fulfilled' ? result.value : { ...selected[index], image: null });
}
