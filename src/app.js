import { APP } from './modules/config.js';
import { translator, localeLabel } from './modules/i18n.js';
import { getStored, setStored, pushRecent, toggleFavorite } from './modules/storage.js';
import { haversineKm, estimateLandRoute, estimateFlightTimeHours, timeDifferenceHours } from './modules/geo.js';
import {
  displayCountryName, fetchRoadRoute, fetchWorldBankStats, getCountry, getFlagEmoji,
  loadCountryIndex, loadKnowledge, loadOrigins, loadPlaces, loadWorldGeometries,
  searchLocal, searchOnlinePlaces
} from './modules/dataService.js';
import { GlobeView } from './modules/globe.js';
import { Globe3DView } from './modules/globe3d.js';

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const escapeHtml = (value = '') => String(value).replace(/[&<>"]/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));

const state = {
  locale: getStored('locale', navigator.language?.startsWith('ko') ? 'ko' : 'en'),
  theme: getStored('theme', 'system'),
  viewMode: getStored('viewMode', 'globe'),
  tripType: getStored('tripType', 'oneway'),
  originPreset: getStored('originPreset', APP.defaultOriginId),
  origin: null,
  originCountry: null,
  destination: null,
  country: null,
  knowledge: null,
  stats: null,
  countryIndex: [],
  places: [],
  mapPoints: [],
  origins: [],
  roadRoute: null,
  searchTimer: null,
  searchAbort: null,
  searchResults: [],
  selectedResultIndex: -1
};

let t = translator(state.locale);
let globe2D;
let globe3D;

function icon(name, size = 20) {
  const paths = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    location: '<path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon: '<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8Z"/>',
    monitor: '<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    replay: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>'
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ''}</svg>`;
}

function renderAppShell() {
  $('#app').innerHTML = `
    <header class="site-header">
      <a class="brand" href="./" aria-label="GlobeHop home">
        <span class="brand-mark" aria-hidden="true"><span class="brand-globe">🌎</span><span class="brand-plane">✈</span></span>
        <span><strong>GlobeHop</strong><small data-i18n="tagline"></small></span>
      </a>
      <nav class="header-actions" aria-label="Utilities">
        <label class="language-control"><span class="sr-only">Language</span><select id="languageSelect"></select></label>
        <button class="icon-button" id="themeButton" type="button" title="Theme" aria-label="Theme"></button>
        <button class="icon-button" id="infoButton" type="button" title="Data sources" aria-label="Data sources">${icon('info')}</button>
      </nav>
    </header>

    <main class="page-shell">
      <section class="search-hero" aria-labelledby="heroTitle">
        <div class="hero-copy">
          <h1 id="heroTitle" data-i18n="exploreTitle"></h1>
          <p data-i18n="exploreBody"></p>
        </div>
        <div class="search-wrap">
          <div class="search-box" role="search">
            ${icon('search', 23)}
            <input id="searchInput" type="search" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="searchResults" />
            <button id="clearSearch" class="clear-search" type="button" aria-label="Clear" hidden>${icon('close', 18)}</button>
          </div>
          <div class="search-hint" id="searchHint"></div>
          <div class="search-results" id="searchResults" role="listbox" hidden></div>
        </div>
      </section>

      <section class="explorer-grid" aria-live="polite">
        <div class="map-column">
          <div class="origin-bar">
            <div class="origin-main">
              <div class="origin-status">
                <span class="origin-dot" aria-hidden="true"></span>
                <div><strong id="originLabel"></strong><small id="originPrivacy"></small></div>
              </div>
              <label class="origin-select-wrap">
                <span data-i18n="startFrom"></span>
                <select id="originSelect"></select>
              </label>
            </div>
            <div class="origin-actions">
              <button id="locationButton" class="secondary-button" type="button">${icon('location', 18)}<span data-i18n="useMyLocation"></span></button>
            </div>
          </div>

          <div class="globe-card" id="globeCard">
            <div class="map-surface map-surface-2d" id="map2DSurface">
              <svg id="globeSvg" class="globe-svg" viewBox="0 0 1000 500" role="img" aria-label="Interactive 2D world map with animated travel route"></svg>
            </div>
            <div class="map-surface map-surface-3d" id="globe3DHost" aria-label="Interactive 3D globe"></div>
            <div class="map-label map-label-origin" id="mapOriginLabel"></div>
            <div class="map-label map-label-destination" id="mapDestinationLabel"></div>
            <div class="map-tooltip" id="mapTooltip" role="status" hidden></div>
            <button class="map-reset-button" id="resetMapButton" type="button">🌍 <span data-i18n="worldView"></span></button>
            <div class="map-interaction-hint" id="mapInteractionHint"></div>
          </div>

          <div class="journey-panel" id="journeyPanel">
            <div class="journey-heading">
              <div>
                <span class="eyebrow" data-i18n="route"></span>
                <strong id="journeyTitle">—</strong>
              </div>
              <button class="ghost-button" id="replayButton" type="button">${icon('replay', 17)}<span data-i18n="replay"></span></button>
            </div>

            <div class="journey-controls-grid">
              <div class="journey-control-card">
                <span class="transport-label" data-i18n="travelView"></span>
                <div class="segmented" id="viewSelector">
                  <button type="button" data-view="map"><span data-i18n="mapView"></span></button>
                  <button type="button" data-view="globe"><span data-i18n="globeView"></span></button>
                </div>
              </div>
              <div class="journey-control-card">
                <span class="transport-label" data-i18n="tripType"></span>
                <div class="segmented" id="tripSelector">
                  <button type="button" data-trip="oneway"><span data-i18n="oneWay"></span></button>
                  <button type="button" data-trip="roundtrip"><span data-i18n="roundTrip"></span></button>
                </div>
              </div>
            </div>

            <div class="transport-note">✈️ <strong data-i18n="plane"></strong> · <span data-i18n="planeOnlyNote"></span></div>

            <div class="journey-stats journey-stats-extended">
              <div><span data-i18n="airDistance"></span><strong id="airDistanceValue">—</strong></div>
              <div><span data-i18n="landDistance"></span><strong id="landDistanceValue">—</strong></div>
              <div><span data-i18n="flightTime"></span><strong id="flightTimeValue">—</strong></div>
              <div><span data-i18n="landTime"></span><strong id="landTimeValue">—</strong></div>
              <div><span data-i18n="timeDiff"></span><strong id="timeDiffValue">—</strong></div>
              <div><span data-i18n="localTime"></span><strong id="localTimeValue">—</strong></div>
            </div>
            <p class="inline-note" id="routeNote" data-i18n="routeNote"></p>
          </div>
        </div>

        <aside class="detail-column" id="detailColumn">
          <div class="country-heading">
            <div class="country-title-wrap"><span id="flagEmoji" class="flag-emoji">🌍</span><div><span class="eyebrow" id="destinationType"></span><h2 id="destinationTitle">—</h2><p id="destinationSubtitle"></p></div></div>
            <button class="icon-button favorite-button" id="favoriteButton" type="button" aria-label="Favorite">${icon('heart')}</button>
          </div>

          <section class="media-section" aria-labelledby="mediaTitle">
            <div class="section-heading"><h3 id="mediaTitle" data-i18n="photos"></h3><span class="data-badge" data-i18n="studyNote"></span></div>
            <div id="mediaGallery" class="media-gallery"></div>
          </section>

          <section class="facts-section" aria-labelledby="factsTitle">
            <div class="section-heading"><h3 id="factsTitle" data-i18n="countryFacts"></h3><span class="data-badge" id="statsBadge" data-i18n="staticStat"></span></div>
            <div class="facts-grid" id="factsGrid"></div>
            <p class="inline-note" id="statsNote"></p>
          </section>

          <section class="knowledge-section" aria-labelledby="knowledgeTitle">
            <h3 id="knowledgeTitle" data-i18n="kidKnowledge"></h3>
            <div id="knowledgeContent"></div>
          </section>
        </aside>
      </section>

      <section class="history-section" aria-labelledby="recentTitle">
        <div class="section-heading"><h2 id="recentTitle" data-i18n="recent"></h2><span id="favoriteCount"></span></div>
        <div class="history-strip" id="recentStrip"></div>
      </section>
    </main>

    <footer class="site-footer"><span data-i18n="footer"></span><button type="button" id="footerInfo" class="text-button" data-i18n="dataSources"></button></footer>

    <dialog id="sourceDialog" class="source-dialog">
      <button class="dialog-close icon-button" type="button" data-dialog-close aria-label="Close">${icon('close')}</button>
      <div class="dialog-globe" aria-hidden="true">🌍</div>
      <h2 data-i18n="dataSources"></h2>
      <p data-i18n="dataSourceBody"></p>
      <div class="source-links">
        <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noreferrer">Open-Meteo Geocoding</a>
        <a href="https://datahelpdesk.worldbank.org/knowledgebase/articles/889392" target="_blank" rel="noreferrer">World Bank Indicators API</a>
      </div>
      <button class="primary-button" type="button" data-dialog-close data-i18n="close"></button>
    </dialog>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
  `;
}

function originPresetById(id) {
  return state.origins.find((x) => x.id === id) || state.origins.find((x) => x.id === APP.defaultOriginId) || state.origins[0];
}

function originLabel(origin) {
  if (!origin) return '';
  if (origin.isCustom) return t('originCustom');
  return origin.names?.[state.locale] || origin.names?.en || origin.id;
}

function setOriginObject(origin) {
  state.origin = {
    ...origin,
    name: origin.names?.en || origin.name || origin.id,
    nameKo: origin.names?.ko || origin.name || origin.id,
    source: origin.isCustom ? 'geolocation' : 'preset'
  };
}

function renderOriginSelect() {
  const select = $('#originSelect');
  if (!select) return;
  const options = state.origins.map((origin) => `<option value="${origin.id}">${escapeHtml(origin.emoji || '')} ${escapeHtml(originLabel(origin))}</option>`);
  const customOption = state.origin?.isCustom ? `<option value="custom">📍 ${escapeHtml(t('originCustom'))}</option>` : '';
  select.innerHTML = `${options.join('')}${customOption}`;
  select.value = state.origin?.isCustom ? 'custom' : state.originPreset;
}

function applyTranslations() {
  t = translator(state.locale);
  document.documentElement.lang = state.locale === 'zh' ? 'zh-CN' : state.locale;
  document.documentElement.dir = ['ar', 'ur', 'fa'].includes(state.locale) ? 'rtl' : 'ltr';
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#searchInput').placeholder = t('searchPlaceholder');
  $('#searchHint').textContent = t('searchHint');
  $('#originPrivacy').textContent = t('locationPrivacy');
  renderLanguageSelect();
  renderOriginSelect();
  renderThemeButton();
  updateViewControls();
  renderCurrentSelection();
  renderRecent();
}

function renderLanguageSelect() {
  const select = $('#languageSelect');
  select.innerHTML = APP.supportedLocales.map((l) => `<option value="${l}" ${l === state.locale ? 'selected' : ''}>${localeLabel(l)}</option>`).join('');
}

function setTheme(theme) {
  state.theme = theme;
  setStored('theme', theme);
  document.documentElement.dataset.theme = theme;
  renderThemeButton();
}

function renderThemeButton() {
  const btn = $('#themeButton');
  if (!btn) return;
  const cycle = { system: 'light', light: 'dark', dark: 'system' };
  btn.dataset.nextTheme = cycle[state.theme] || 'system';
  btn.innerHTML = icon(state.theme === 'light' ? 'sun' : state.theme === 'dark' ? 'moon' : 'monitor');
  btn.title = `${t('theme')}: ${t(state.theme)}`;
  btn.setAttribute('aria-label', btn.title);
}

function updateViewControls() {
  $$('#viewSelector button').forEach((b) => b.classList.toggle('is-active', b.dataset.view === state.viewMode));
  $$('#tripSelector button').forEach((b) => b.classList.toggle('is-active', b.dataset.trip === state.tripType));
  const card = $('#globeCard');
  if (!card) return;
  card.classList.toggle('view-globe', state.viewMode === 'globe');
  card.classList.toggle('view-map', state.viewMode === 'map');
  const surface2D = $('#map2DSurface');
  const surface3D = $('#globe3DHost');
  if (surface2D) surface2D.hidden = state.viewMode !== 'map';
  if (surface3D) surface3D.hidden = state.viewMode !== 'globe';
  const hint = $('#mapInteractionHint');
  if (hint) hint.textContent = state.viewMode === 'globe' ? t('globeInteractionHint') : t('mapInteractionHint');
  hideMapTooltip();
}

function localizedLanguage(value) {
  if (!value) return t('unavailable');
  if (/^[a-z]{2,3}$/i.test(value)) {
    try { return new Intl.DisplayNames([state.locale], { type: 'language' }).of(value); } catch { return value; }
  }
  return value;
}

function formatNumber(value) {
  return new Intl.NumberFormat(state.locale).format(value);
}

function formatCompact(value) {
  if (value == null) return t('unavailable');
  return new Intl.NumberFormat(state.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

function formatUsd(value) {
  return new Intl.NumberFormat(state.locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
}

function formatLocalTime(timeZone) {
  if (!timeZone) return '—';
  try {
    return new Intl.DateTimeFormat(state.locale, { timeZone, hour: 'numeric', minute: '2-digit', weekday: 'short' }).format(new Date());
  } catch {
    return '—';
  }
}

function formatDuration(hours) {
  if (!Number.isFinite(hours)) return t('unavailable');
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (!h) return `${m}m`;
  if (!m) return `${h}h`;
  return `${h}h ${m}m`;
}

function getDestinationTimezone() {
  return state.destination?.timezone || state.country?.timezones?.[0] || state.country?.timezone || null;
}

function mapItemName(item) {
  if (!item?.data) return '';
  if (item.kind === 'country') return displayCountryName(item.data.code2, state.locale, item.data.name || item.data.code2);
  return state.locale === 'ko' && item.data.nameKo ? item.data.nameKo : (item.data.name || item.data.nameKo || item.data.id);
}

function mapItemSecondary(item) {
  if (!item?.data) return '';
  if (item.kind === 'country') {
    const capital = item.data.capital ? `${t('capital')}: ${item.data.capital}` : '';
    return [capital, displayRegion(item.data.region)].filter(Boolean).join(' · ');
  }
  const type = item.data.type === 'landmark' ? t('landmark') : item.data.type === 'region' ? t('regionPlace') : item.data.type === 'capital' ? t('capital') : t('city');
  const country = displayCountryName(item.data.countryCode, state.locale, item.data.country || '');
  return [type, country].filter(Boolean).join(' · ');
}

function showMapTooltip(item, position) {
  const tooltip = $('#mapTooltip');
  const card = $('#globeCard');
  if (!tooltip || !card || !item?.data) return;
  const rect = card.getBoundingClientRect();
  const clientX = position?.clientX ?? (rect.left + (position?.x || 0));
  const clientY = position?.clientY ?? (rect.top + (position?.y || 0));
  const lat = Number(item.data.capitalLat ?? item.data.lat);
  const lon = Number(item.data.capitalLon ?? item.data.lon);
  let distanceText = '';
  if (state.origin && Number.isFinite(lat) && Number.isFinite(lon)) {
    const km = haversineKm(state.origin, { lat, lon });
    distanceText = `<span>✈ ${escapeHtml(formatNumber(Math.round(km)))} km</span>`;
  }
  const population = item.data.population ? `<span>👥 ${escapeHtml(formatCompact(item.data.population))}</span>` : '';
  const area = item.data.areaKm2 ? `<span>📐 ${escapeHtml(formatNumber(Math.round(item.data.areaKm2)))} km²</span>` : '';
  tooltip.innerHTML = `
    <strong>${escapeHtml(mapItemName(item))}</strong>
    <small>${escapeHtml(mapItemSecondary(item))}</small>
    <div class="map-tooltip-meta">${distanceText}${population}${area}</div>
    <em>${escapeHtml(t('clickToTravel'))}</em>
  `;
  tooltip.hidden = false;
  const localX = clientX - rect.left;
  const localY = clientY - rect.top;
  const left = Math.max(10, Math.min(rect.width - 230, localX + 14));
  const top = Math.max(10, Math.min(rect.height - 122, localY + 14));
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
}

function hideMapTooltip() {
  const tooltip = $('#mapTooltip');
  if (tooltip) tooltip.hidden = true;
}

function travelToInteractiveItem(item) {
  if (!item?.data) return;
  if (item.kind === 'country') {
    const country = item.data;
    selectResult({ kind: 'country', ...country, code2: country.code2, displayName: displayCountryName(country.code2, state.locale, country.name || country.code2) });
    return;
  }
  const place = item.data;
  selectResult({ kind: 'place', ...place, countryCode: place.countryCode || place.code2 });
}

function buildInteractiveMapPoints(countries, places) {
  const points = [...places];
  for (const country of countries) {
    const lat = Number(country.capitalLat);
    const lon = Number(country.capitalLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || !country.capital) continue;
    const duplicate = places.some((place) => place.countryCode === country.code2 && Math.abs(Number(place.lat) - lat) < 0.2 && Math.abs(Number(place.lon) - lon) < 0.2);
    if (duplicate) continue;
    points.push({
      id: `capital-${country.code2.toLowerCase()}`,
      name: country.capital,
      nameKo: country.capital,
      type: 'capital',
      countryCode: country.code2,
      lat, lon,
      timezone: null,
      isCapitalPoint: true
    });
  }
  return points;
}

function resultName(result) {
  return result.displayName || result.nameKo || result.name || displayCountryName(result.code2 || result.countryCode, state.locale, result.name || result.country || '');
}

function resultSecondary(result) {
  if (result.kind === 'country') return result.capital || result.region || '';
  return [result.admin1, result.country || displayCountryName(result.countryCode, state.locale, '')].filter(Boolean).join(' · ');
}

function factCard(iconEmoji, label, value, source = '') {
  return `<div class="fact-card"><span class="fact-icon" aria-hidden="true">${iconEmoji}</span><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${source ? `<small>${escapeHtml(source)}</small>` : ''}</div></div>`;
}

function displayRegion(region) {
  const map = {
    ko: { Asia: '아시아', Europe: '유럽', Africa: '아프리카', Americas: '아메리카', Oceania: '오세아니아' },
    ja: { Asia: 'アジア', Europe: 'ヨーロッパ', Africa: 'アフリカ', Americas: 'アメリカ大陸', Oceania: 'オセアニア' },
    zh: { Asia: '亚洲', Europe: '欧洲', Africa: '非洲', Americas: '美洲', Oceania: '大洋洲' }
  };
  return map[state.locale]?.[region] || region || t('unavailable');
}

function renderFacts() {
  if (!state.country) return;
  const c = state.country;
  const s = state.stats;
  const pop = s?.population?.value ?? c.population;
  const popSrc = s?.population ? `${t('sourceYear')} ${s.population.year}` : t('staticStat');
  const gdp = s?.gdp?.value;
  const gni = s?.gni?.value;
  const statsOnline = Boolean(s?.population || s?.gdp || s?.gni);
  $('#statsBadge').textContent = statsOnline ? t('liveStat') : t('staticStat');
  const currencies = (c.currencies || []).join(', ') || t('unavailable');
  const langs = (c.languages || []).map(localizedLanguage).join(', ') || t('unavailable');
  const calling = (c.callingCodes || []).filter(Boolean).map((x) => `+${x}`).join(', ') || t('unavailable');

  $('#factsGrid').innerHTML = [
    factCard('🏛️', t('capital'), c.capital || t('unavailable')),
    factCard('👥', t('population'), formatCompact(pop), popSrc),
    factCard('📐', t('area'), c.areaKm2 ? `${formatNumber(Math.round(c.areaKm2))} km²` : t('unavailable')),
    factCard('💵', t('gdp'), gdp ? formatUsd(gdp) : t('unavailable'), s?.gdp ? `${t('sourceYear')} ${s.gdp.year}` : ''),
    factCard('🌱', t('gni'), gni ? formatUsd(gni) : t('unavailable'), s?.gni ? `${t('sourceYear')} ${s.gni.year}` : ''),
    factCard('💰', t('currency'), currencies),
    factCard('🗣️', t('languages'), langs),
    factCard('🧭', t('region'), displayRegion(c.region)),
    factCard('☎️', t('callingCode'), calling)
  ].join('');
  $('#statsNote').textContent = s?.failed ? t('onlineDataError') : '';
}

function mediaCard(item, large = false) {
  const cls = large ? 'media-card media-card-large' : 'media-card';
  return `<figure class="${cls}"><img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt || item.title || '')}" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest('figure').classList.add('is-broken')"><figcaption><strong>${escapeHtml(item.title || '')}</strong>${item.caption ? `<small>${escapeHtml(item.caption)}</small>` : ''}</figcaption></figure>`;
}

function renderMedia() {
  const gallery = $('#mediaGallery');
  if (!gallery || !state.country) return;
  const code2 = state.country.code2.toLowerCase();
  const items = [{
    src: `https://flagcdn.com/w320/${code2}.png`,
    title: t('flag'),
    alt: `${displayCountryName(state.country.code2, state.locale, state.country.name)} flag`,
    caption: displayCountryName(state.country.code2, state.locale, state.country.name)
  }];
  const data = state.locale === 'ko' && state.knowledge?.ko ? state.knowledge.ko : state.knowledge;
  if (Array.isArray(data?.gallery)) items.push(...data.gallery.slice(0, 3));
  gallery.innerHTML = items.map((item, index) => mediaCard(item, index === 0)).join('');
}

function chipBlock(emoji, label, items) {
  if (!items?.length) return '';
  return `<div class="knowledge-row"><div class="knowledge-label"><span>${emoji}</span><strong>${escapeHtml(label)}</strong></div><div class="chip-list">${items.map((x) => `<span>${escapeHtml(x)}</span>`).join('')}</div></div>`;
}

function infoMini(label, value) {
  if (!value) return '';
  return `<div class="mini-info-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function renderKnowledge() {
  const root = $('#knowledgeContent');
  if (!root || !state.country) return;
  const fallbackOverview = `${displayCountryName(state.country.code2, state.locale, state.country.name)} · ${t('capital')}: ${state.country.capital || t('unavailable')} · ${displayRegion(state.country.region)}`;
  const k = state.knowledge;
  if (!k) {
    root.innerHTML = `<div class="knowledge-empty"><span aria-hidden="true">🧩</span><p>${escapeHtml(t('knowledgeFallback'))}</p></div><div class="overview-card"><strong>${escapeHtml(t('overview'))}</strong><p>${escapeHtml(fallbackOverview)}</p></div>`;
    return;
  }
  const data = state.locale === 'ko' && k.ko ? k.ko : k;
  root.innerHTML = `
    <div class="overview-card"><strong>${escapeHtml(t('overview'))}</strong><p>${escapeHtml(data.overview || fallbackOverview)}</p></div>
    <div class="mini-info-grid">
      ${infoMini(t('greeting'), data.greeting)}
      ${infoMini(t('climate'), data.climate)}
      ${infoMini(t('bestSeason'), data.bestSeason)}
      ${infoMini(t('travelTips'), data.travelTips)}
    </div>
    ${chipBlock('🍚', t('specialties'), data.specialties)}
    ${chipBlock('🐾', t('animals'), data.animals)}
    ${chipBlock('🌿', t('plants'), data.plants)}
    ${chipBlock('🗺️', t('landmarks'), data.landmarks)}
    <div class="fun-facts"><h4>💡 ${escapeHtml(t('funFacts'))}</h4><ul>${(data.facts || []).map((x) => `<li>${escapeHtml(x)}</li>`).join('')}</ul></div>
  `;
}

function renderFavoriteState() {
  const favs = getStored('favorites', []);
  const active = state.destination && favs.some((x) => x.key === state.destination.key);
  const btn = $('#favoriteButton');
  if (!btn) return;
  btn.classList.toggle('is-active', active);
  btn.title = active ? t('unfavorite') : t('favorite');
  btn.setAttribute('aria-label', btn.title);
}

function renderRecent() {
  const root = $('#recentStrip');
  if (!root) return;
  const recent = getStored('recent', []);
  const favs = getStored('favorites', []);
  $('#favoriteCount').textContent = favs.length ? `♥ ${favs.length}` : '';
  if (!recent.length) {
    root.innerHTML = `<p class="history-empty">${escapeHtml(t('noRecent'))}</p>`;
    return;
  }
  root.innerHTML = recent.map((x, i) => `<button class="history-item" type="button" data-recent="${i}"><span>${getFlagEmoji(x.countryCode)}</span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(displayCountryName(x.countryCode, state.locale, ''))}</small></button>`).join('');
  $$('.history-item', root).forEach((btn) => btn.addEventListener('click', () => {
    const x = recent[Number(btn.dataset.recent)];
    selectResult({ kind: x.kind === 'country' ? 'country' : 'place', id: x.key, name: x.rawName || x.name, nameKo: x.name, type: x.kind, countryCode: x.countryCode, code2: x.countryCode, lat: x.lat, lon: x.lon, timezone: x.timezone });
  }));
}

function renderJourneyStats() {
  if (!state.destination || !state.country || !state.origin) return;
  const airDistance = haversineKm(state.origin, state.destination);
  const estimatedLand = estimateLandRoute(state.originCountry, state.country, airDistance);
  const land = state.roadRoute || estimatedLand;
  const destTz = getDestinationTimezone();
  const diff = timeDifferenceHours(state.origin.timezone, destTz);
  const flightHours = estimateFlightTimeHours(airDistance);
  $('#journeyTitle').textContent = `${originLabel(state.origin)} → ${state.destination.name}`;
  $('#airDistanceValue').textContent = `${formatNumber(Math.round(airDistance * (state.tripType === 'roundtrip' ? 2 : 1)))} km`;
  $('#landDistanceValue').textContent = land.available ? `${formatNumber(Math.round(land.distanceKm * (state.tripType === 'roundtrip' ? 2 : 1)))} km` : t('landUnavailable');
  $('#flightTimeValue').textContent = formatDuration(flightHours * (state.tripType === 'roundtrip' ? 2 : 1));
  $('#landTimeValue').textContent = land.available ? formatDuration(land.hours * (state.tripType === 'roundtrip' ? 2 : 1)) : t('unavailable');
  $('#timeDiffValue').textContent = diff == null ? '—' : `${diff > 0 ? '+' : ''}${diff} h`;
  $('#localTimeValue').textContent = formatLocalTime(destTz);
  const routeNote = $('#routeNote');
  if (routeNote) routeNote.textContent = state.roadRoute?.source === 'osrm' ? t('roadLiveNote') : t('routeNote');
}

function renderCurrentSelection() {
  if (!state.origin || !$('#originLabel')) return;
  $('#originLabel').textContent = state.origin.isCustom ? t('locationReady') : `${t('currentOrigin')}: ${originLabel(state.origin)}`;
  if (!state.destination || !state.country || !$('#destinationTitle')) {
    $('#mapOriginLabel').textContent = originLabel(state.origin);
    return;
  }
  const d = state.destination;
  const c = state.country;
  $('#flagEmoji').textContent = getFlagEmoji(c.code2);
  $('#destinationType').textContent = d.kind === 'country' ? t('country') : d.kind === 'landmark' ? t('landmark') : d.kind === 'region' ? t('regionPlace') : d.kind === 'capital' ? t('capital') : t('city');
  $('#destinationTitle').textContent = d.name;
  const countryName = displayCountryName(c.code2, state.locale, c.name);
  $('#destinationSubtitle').textContent = d.kind === 'country' ? [c.subregion, c.region].filter(Boolean).join(' · ') : [d.subtitle, countryName].filter(Boolean).join(' · ');
  $('#mapOriginLabel').textContent = originLabel(state.origin);
  $('#mapDestinationLabel').textContent = d.name;
  renderJourneyStats();
  renderFacts();
  renderMedia();
  renderKnowledge();
  renderFavoriteState();
}

function toast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 3200);
}

async function setOriginFromPreset(id) {
  const preset = originPresetById(id);
  state.originPreset = preset.id;
  setStored('originPreset', preset.id);
  setOriginObject(preset);
  state.originCountry = await getCountry(preset.countryCode);
  state.roadRoute = null;
  renderOriginSelect();
  renderCurrentSelection();
  if (state.destination) {
    globe2D?.setRoute(state.origin, state.destination, 'plane', state.tripType);
    globe3D?.setRoute(state.origin, state.destination, state.tripType);
    resolveRoadRoute();
  }
}

async function useLocation() {
  if (!navigator.geolocation) {
    toast(t('locationDenied'));
    return;
  }
  const btn = $('#locationButton');
  btn.disabled = true;
  btn.classList.add('is-loading');
  navigator.geolocation.getCurrentPosition(async (pos) => {
    state.origin = {
      id: 'custom',
      isCustom: true,
      names: { [state.locale]: t('originCustom'), en: 'My location', ko: '내 위치' },
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      countryCode: null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      source: 'geolocation'
    };
    let nearest = null;
    let min = Infinity;
    for (const c of state.countryIndex) {
      if (c.lat == null || c.lon == null) continue;
      const d = haversineKm(state.origin, { lat: c.lat, lon: c.lon });
      if (d < min) { min = d; nearest = c; }
    }
    state.originCountry = nearest ? await getCountry(nearest.code2) : null;
    state.roadRoute = null;
    renderOriginSelect();
    renderCurrentSelection();
    if (state.destination) {
      globe2D?.setRoute(state.origin, state.destination, 'plane', state.tripType);
      globe3D?.setRoute(state.origin, state.destination, state.tripType);
      resolveRoadRoute();
    }
    btn.disabled = false;
    btn.classList.remove('is-loading');
    toast(t('locationReady'));
  }, () => {
    btn.disabled = false;
    btn.classList.remove('is-loading');
    toast(t('locationDenied'));
  }, { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 });
}

function resultRow(result) {
  const index = state.searchResults.length ? state.searchResults.indexOf(result) : -1;
  const realIndex = index >= 0 ? index : 0;
  const type = result.kind === 'country' ? t('country') : result.type === 'landmark' ? t('landmark') : result.type === 'region' ? t('regionPlace') : t('city');
  return `<button class="search-result" role="option" type="button" data-index="${realIndex}">
    <span class="result-icon">${getFlagEmoji(result.code2 || result.countryCode)}</span>
    <span class="result-copy"><strong>${escapeHtml(resultName(result))}</strong><small>${escapeHtml(type)} · ${escapeHtml(resultSecondary(result))}</small></span>
    ${icon('chevron', 17)}
  </button>`;
}

function renderSearchResults(results, onlineState = '') {
  const box = $('#searchResults');
  state.searchResults = results;
  state.selectedResultIndex = -1;
  if (!$('#searchInput').value.trim()) { box.hidden = true; return; }
  if (!results.length) {
    box.innerHTML = `<div class="search-empty">${onlineState === 'error' ? escapeHtml(t('networkFallback')) : escapeHtml(t('noResults'))}</div>`;
    box.hidden = false;
    return;
  }
  const groups = [];
  const countries = results.filter((x) => x.kind === 'country');
  const places = results.filter((x) => x.kind !== 'country');
  if (countries.length) groups.push(`<div class="result-group-label">${escapeHtml(t('countries'))}</div>${countries.map(resultRow).join('')}`);
  if (places.length) groups.push(`<div class="result-group-label">${escapeHtml(t('places'))}</div>${places.map(resultRow).join('')}`);
  box.innerHTML = groups.join('');
  box.hidden = false;
  $$('.search-result', box).forEach((el) => el.addEventListener('click', () => selectResult(results[Number(el.dataset.index)])));
}

async function doSearch() {
  const input = $('#searchInput');
  const query = input.value.trim();
  $('#clearSearch').hidden = !query;
  if (!query) { $('#searchResults').hidden = true; return; }
  const local = await searchLocal(query, state.locale);
  state.searchResults = local;
  renderSearchResults(local);
  if (query.length < 2) return;
  state.searchAbort?.abort();
  const controller = new AbortController();
  state.searchAbort = controller;
  try {
    const online = await searchOnlinePlaces(query, state.locale);
    if (controller.signal.aborted || $('#searchInput').value.trim() !== query) return;
    const keys = new Set(local.map((x) => `${x.countryCode || x.code2}:${(x.name || x.displayName || '').toLowerCase()}`));
    const extra = online.filter((x) => !keys.has(`${x.countryCode}:${x.name.toLowerCase()}`));
    const merged = [...local, ...extra].slice(0, 12);
    state.searchResults = merged;
    renderSearchResults(merged);
  } catch {
    if (!controller.signal.aborted && !local.length) renderSearchResults([], 'error');
  }
}

async function selectResult(result, { skipUrl = false } = {}) {
  if (!result) return;
  $('#searchResults').hidden = true;
  $('#searchInput').value = '';
  $('#clearSearch').hidden = true;
  const code2 = (result.code2 || result.countryCode || '').toUpperCase();
  const country = await getCountry(code2);
  if (!country) return;
  state.country = country;
  if (result.kind === 'country') {
    state.destination = {
      key: `country:${code2}`,
      kind: 'country',
      name: displayCountryName(code2, state.locale, country.name),
      lat: country.capitalLat ?? country.lat,
      lon: country.capitalLon ?? country.lon,
      countryCode: code2,
      timezone: null,
      subtitle: country.capital ? `${t('capital')}: ${country.capital}` : '',
      rawName: country.name
    };
  } else {
    state.destination = {
      key: `place:${result.id || result.name}:${code2}`,
      kind: result.type || 'city',
      name: resultName(result),
      lat: Number(result.lat),
      lon: Number(result.lon),
      countryCode: code2,
      timezone: result.timezone || null,
      subtitle: resultSecondary(result),
      rawName: result.name,
      population: result.population
    };
  }
  if (result.kind !== 'country' && Number.isFinite(state.destination.lat) && Number.isFinite(state.destination.lon)) {
    const existsOnMap = state.mapPoints.some((point) => point.countryCode === code2 && Math.abs(Number(point.lat) - state.destination.lat) < 0.02 && Math.abs(Number(point.lon) - state.destination.lon) < 0.02);
    if (!existsOnMap) {
      state.mapPoints.push({
        id: result.id || `searched-${Date.now()}`,
        name: result.name || state.destination.rawName || state.destination.name,
        nameKo: result.nameKo || state.destination.name,
        type: result.type || 'city',
        countryCode: code2,
        lat: state.destination.lat,
        lon: state.destination.lon,
        timezone: state.destination.timezone,
        population: result.population || null,
        isSearchedPoint: true
      });
      globe2D?.setPlaces(state.mapPoints);
      globe3D?.setPlaces(state.mapPoints);
    }
  }
  state.knowledge = await loadKnowledge(code2);
  state.stats = null;
  state.roadRoute = null;
  globe2D?.highlightCountry(code2);
  globe3D?.setSelectedCountry(code2);
  globe2D?.setRoute(state.origin, state.destination, 'plane', state.tripType);
  globe3D?.setRoute(state.origin, state.destination, state.tripType);
  renderCurrentSelection();
  resolveRoadRoute();
  const recentItem = { key: state.destination.key, name: state.destination.name, countryCode: code2, kind: state.destination.kind, lat: state.destination.lat, lon: state.destination.lon, timezone: state.destination.timezone, rawName: state.destination.rawName };
  pushRecent(recentItem, APP.maxRecent);
  renderRecent();
  if (!skipUrl) updateUrl();
  fetchWorldBankStats(country.code3).then((stats) => { if (state.country?.code2 === code2) { state.stats = stats; renderFacts(); } }).catch(() => {});
}

async function resolveRoadRoute() {
  if (!state.origin || !state.destination || !state.country) return;
  const airDistance = haversineKm(state.origin, state.destination);
  const fallback = estimateLandRoute(state.originCountry, state.country, airDistance);
  if (!fallback.available) {
    state.roadRoute = null;
    renderJourneyStats();
    return;
  }
  const originKey = `${state.origin.lat},${state.origin.lon}`;
  const destinationKey = `${state.destination.lat},${state.destination.lon}`;
  const requestKey = `${originKey}|${destinationKey}`;
  state.roadRouteRequest = requestKey;
  const route = await fetchRoadRoute(state.origin, state.destination);
  if (state.roadRouteRequest !== requestKey) return;
  if (route) {
    state.roadRoute = { available: true, distanceKm: route.distanceKm, hours: route.hours, source: 'osrm' };
  } else {
    state.roadRoute = null;
  }
  renderJourneyStats();
}

function updateUrl() {
  if (!state.destination) return;
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('c', state.destination.countryCode);
  if (state.destination.kind !== 'country') {
    u.searchParams.set('name', state.destination.rawName || state.destination.name);
    u.searchParams.set('lat', state.destination.lat.toFixed(4));
    u.searchParams.set('lon', state.destination.lon.toFixed(4));
    if (state.destination.timezone) u.searchParams.set('tz', state.destination.timezone);
  }
  history.replaceState(null, '', u);
}

function wireEvents() {
  $('#languageSelect').addEventListener('change', (e) => {
    state.locale = e.target.value;
    setStored('locale', state.locale);
    applyTranslations();
    if (state.country && state.destination?.kind === 'country') {
      state.destination.name = displayCountryName(state.country.code2, state.locale, state.country.name);
    }
    renderCurrentSelection();
  });
  $('#originSelect').addEventListener('change', async (e) => {
    if (e.target.value === 'custom') return;
    await setOriginFromPreset(e.target.value);
  });
  $('#themeButton').addEventListener('click', () => setTheme($('#themeButton').dataset.nextTheme));
  $('#locationButton').addEventListener('click', useLocation);
  $('#replayButton').addEventListener('click', () => {
    globe2D?.replay();
    globe3D?.replay();
  });
  $('#resetMapButton').addEventListener('click', () => {
    hideMapTooltip();
    if (state.viewMode === 'globe') globe3D?.resetView();
    else globe2D?.resetView();
  });
  $('#tripSelector').addEventListener('click', (e) => {
    const button = e.target.closest('button[data-trip]');
    if (!button) return;
    state.tripType = button.dataset.trip;
    setStored('tripType', state.tripType);
    updateViewControls();
    if (state.destination) {
      globe2D?.setRoute(state.origin, state.destination, 'plane', state.tripType);
      globe3D?.setRoute(state.origin, state.destination, state.tripType);
      renderCurrentSelection();
    }
  });
  $('#viewSelector').addEventListener('click', (e) => {
    const button = e.target.closest('button[data-view]');
    if (!button) return;
    state.viewMode = button.dataset.view;
    setStored('viewMode', state.viewMode);
    updateViewControls();
    if (state.destination) {
      if (state.viewMode === 'globe') { globe3D?.resize(); globe3D?.setRoute(state.origin, state.destination, state.tripType); }
      else globe2D?.setRoute(state.origin, state.destination, 'plane', state.tripType);
    }
  });
  $('#favoriteButton').addEventListener('click', () => {
    if (!state.destination) return;
    const item = { key: state.destination.key, name: state.destination.name, countryCode: state.destination.countryCode, kind: state.destination.kind, lat: state.destination.lat, lon: state.destination.lon, timezone: state.destination.timezone, rawName: state.destination.rawName };
    const r = toggleFavorite(item);
    renderFavoriteState();
    renderRecent();
    toast(r.active ? t('favorite') : t('unfavorite'));
  });
  $('#searchInput').addEventListener('input', () => { clearTimeout(state.searchTimer); state.searchTimer = setTimeout(doSearch, 180); });
  $('#searchInput').addEventListener('keydown', (e) => {
    if ($('#searchResults').hidden) return;
    const rows = $$('.search-result', $('#searchResults'));
    if (!rows.length) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      state.selectedResultIndex = (state.selectedResultIndex + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      rows.forEach((r, i) => r.classList.toggle('is-keyboard-selected', i === state.selectedResultIndex));
      rows[state.selectedResultIndex].scrollIntoView({ block: 'nearest' });
    }
    if (e.key === 'Enter' && state.selectedResultIndex >= 0) { e.preventDefault(); rows[state.selectedResultIndex].click(); }
    if (e.key === 'Escape') $('#searchResults').hidden = true;
  });
  $('#clearSearch').addEventListener('click', () => { $('#searchInput').value = ''; $('#clearSearch').hidden = true; $('#searchResults').hidden = true; $('#searchInput').focus(); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.search-wrap')) $('#searchResults').hidden = true; });
  const dialog = $('#sourceDialog');
  const open = () => dialog.showModal();
  $('#infoButton').addEventListener('click', open);
  $('#footerInfo').addEventListener('click', open);
  $$('[data-dialog-close]').forEach((b) => b.addEventListener('click', () => dialog.close()));
}

async function loadInitialSelection() {
  const params = new URLSearchParams(location.search);
  const c = (params.get('c') || 'JP').toUpperCase();
  if (params.get('lat') && params.get('lon')) {
    await selectResult({ kind: 'place', id: 'url', name: params.get('name') || displayCountryName(c, state.locale, c), type: 'city', countryCode: c, lat: Number(params.get('lat')), lon: Number(params.get('lon')), timezone: params.get('tz') || null }, { skipUrl: true });
  } else {
    const countryRow = state.countryIndex.find((x) => x.code2 === c) || state.countryIndex.find((x) => x.code2 === 'JP');
    await selectResult({ kind: 'country', ...countryRow, displayName: displayCountryName(countryRow.code2, state.locale, countryRow.name) }, { skipUrl: true });
  }
}

async function init() {
  renderAppShell();
  renderLanguageSelect();
  setTheme(state.theme);
  const [geoms, index, places, origins] = await Promise.all([loadWorldGeometries(), loadCountryIndex(), loadPlaces(), loadOrigins()]);
  state.countryIndex = index;
  state.places = places;
  state.mapPoints = buildInteractiveMapPoints(index, places);
  state.origins = origins;
  const initialOrigin = originPresetById(state.originPreset);
  setOriginObject(initialOrigin);
  applyTranslations();
  wireEvents();
  updateViewControls();
  globe2D = new GlobeView($('#globeSvg'), {
    onHover: showMapTooltip,
    onLeave: hideMapTooltip,
    onCountryClick: (country) => travelToInteractiveItem({ kind: 'country', data: country }),
    onPlaceClick: (place) => travelToInteractiveItem({ kind: 'place', data: place })
  });
  try {
    globe3D = new Globe3DView($('#globe3DHost'), {
      onHover: showMapTooltip,
      onLeave: hideMapTooltip,
      onClick: travelToInteractiveItem
    });
  } catch (error) {
    console.warn('3D globe is unavailable; falling back to the 2D map.', error);
    globe3D = null;
    state.viewMode = 'map';
    const globeButton = $('#viewSelector button[data-view="globe"]');
    if (globeButton) { globeButton.disabled = true; globeButton.title = t('webglUnavailable'); }
    updateViewControls();
  }
  state.originCountry = await getCountry(initialOrigin.countryCode);
  globe2D.setData({ geometries: geoms, countries: index, places: state.mapPoints });
  globe3D?.setData({ geometries: geoms, countries: index, places: state.mapPoints });
  await loadInitialSelection();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(() => {});
  const focus = new URLSearchParams(location.search).get('focus');
  if (focus === 'search') $('#searchInput').focus();
}

init().catch((error) => {
  console.error(error);
  $('#app').innerHTML = '<main class="fatal-error"><span>🌍</span><h1>GlobeHop</h1><p>지도를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p><button onclick="location.reload()">새로고침</button></main>';
});
