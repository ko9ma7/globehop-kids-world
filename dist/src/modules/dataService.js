import { APP, REGION_FILES } from './config.js';

const cache = new Map();

async function fetchJson(url) {
  const key = url.toString();
  if (cache.has(key)) return cache.get(key);
  const promise = fetch(url).then((res) => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  });
  cache.set(key, promise);
  try { return await promise; } catch (error) { cache.delete(key); throw error; }
}

const dataUrl = (path) => new URL(`../data/${path}`, import.meta.url);

export function getFlagEmoji(code2) {
  if (!code2 || code2.length !== 2) return '🌍';
  return [...code2.toUpperCase()].map((c) => String.fromCodePoint(127397 + c.charCodeAt())).join('');
}

export function displayCountryName(code2, locale = 'en', fallback = '') {
  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(code2) || fallback || code2;
  } catch {
    return fallback || code2;
  }
}

export async function loadCountryIndex() {
  return fetchJson(dataUrl('countries/index.json'));
}

export async function loadWorldGeometries() {
  return fetchJson(dataUrl('world-geometries.json'));
}

export async function loadPlaces() {
  return fetchJson(dataUrl('places/index.json'));
}

export async function loadOrigins() {
  return fetchJson(dataUrl('origins/index.json'));
}

export async function getCountry(code2) {
  const index = await loadCountryIndex();
  const base = index.find((x) => x.code2 === code2?.toUpperCase());
  if (!base) return null;
  const regionFile = REGION_FILES[base.region] || 'other';
  const rows = await fetchJson(dataUrl(`countries/regions/${regionFile}.json`));
  return rows.find((x) => x.code2 === base.code2) || base;
}

export async function searchLocal(query, locale) {
  const q = query.trim().toLocaleLowerCase(locale);
  if (!q) return [];
  const [countries, places] = await Promise.all([loadCountryIndex(), loadPlaces()]);
  const countryMatches = countries.map((c) => {
    const localized = displayCountryName(c.code2, locale, c.name);
    const fields = [localized, c.name, c.nativeName, c.capital, c.code2, c.code3].filter(Boolean).map((s) => s.toLocaleLowerCase(locale));
    let score = 99;
    fields.forEach((s) => {
      if (s === q) score = Math.min(score, 0);
      else if (s.startsWith(q)) score = Math.min(score, 1);
      else if (s.includes(q)) score = Math.min(score, 3);
    });
    return score < 99 ? { kind:'country', score, ...c, displayName:localized } : null;
  }).filter(Boolean);
  const placeMatches = places.map((p) => {
    const fields = [p.name, p.nameKo].filter(Boolean).map((s) => s.toLocaleLowerCase(locale));
    let score = 99;
    fields.forEach((s) => {
      if (s === q) score = Math.min(score, 0);
      else if (s.startsWith(q)) score = Math.min(score, 1);
      else if (s.includes(q)) score = Math.min(score, 3);
    });
    return score < 99 ? { kind:'place', score, ...p } : null;
  }).filter(Boolean);
  return [...countryMatches, ...placeMatches].sort((a,b) => a.score-b.score || String(a.displayName||a.name).localeCompare(String(b.displayName||b.name))).slice(0,10);
}

export async function searchOnlinePlaces(query, locale) {
  const params = new URLSearchParams({ name: query, count:'6', language: locale, format:'json' });
  const url = `${APP.geocodingEndpoint}?${params}`;
  const res = await fetch(url, { headers: { Accept:'application/json' } });
  if (!res.ok) throw new Error('geocoding failed');
  const json = await res.json();
  return (json.results || []).map((p) => ({
    kind:'online-place', id:`om-${p.id}`, name:p.name, type:'city', countryCode:p.country_code,
    country:p.country, admin1:p.admin1, lat:p.latitude, lon:p.longitude,
    timezone:p.timezone, population:p.population, featureCode:p.feature_code
  }));
}

export async function loadKnowledge(code2) {
  try {
    return await fetchJson(dataUrl(`knowledge/${code2.toLowerCase()}.json`));
  } catch {
    return null;
  }
}


export async function fetchRoadRoute(origin, destination, { timeoutMs = 6000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const coordinates = `${origin.lon},${origin.lat};${destination.lon},${destination.lat}`;
    const params = new URLSearchParams({ overview: 'false', steps: 'false' });
    const url = `${APP.osrmEndpoint}/route/v1/driving/${coordinates}?${params}`;
    const res = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
    const json = await res.json();
    const route = json?.routes?.[0];
    if (json?.code !== 'Ok' || !route) return null;
    return { distanceKm: route.distance / 1000, hours: route.duration / 3600, source: 'osrm' };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWorldBankIndicator(code3, indicator) {
  const url = `${APP.worldBankEndpoint}/country/${encodeURIComponent(code3)}/indicator/${indicator}?format=json&mrnev=1&per_page=1`;
  const res = await fetch(url, { headers:{ Accept:'application/json' } });
  if (!res.ok) throw new Error('World Bank unavailable');
  const json = await res.json();
  const row = Array.isArray(json) ? json[1]?.[0] : null;
  if (!row || row.value == null) return null;
  return { value:Number(row.value), year:row.date, indicator:row.indicator?.value || indicator };
}

export async function fetchWorldBankStats(code3) {
  const entries = await Promise.allSettled([
    fetchWorldBankIndicator(code3, APP.worldBankIndicators.population),
    fetchWorldBankIndicator(code3, APP.worldBankIndicators.gdp),
    fetchWorldBankIndicator(code3, APP.worldBankIndicators.gni)
  ]);
  return {
    population: entries[0].status === 'fulfilled' ? entries[0].value : null,
    gdp: entries[1].status === 'fulfilled' ? entries[1].value : null,
    gni: entries[2].status === 'fulfilled' ? entries[2].value : null,
    failed: entries.every((x) => x.status === 'rejected')
  };
}
