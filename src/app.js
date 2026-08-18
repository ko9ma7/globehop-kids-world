import { APP } from './modules/config.js';
import { translator, localeLabel } from './modules/i18n.js';
import { getStored, setStored, pushRecent, toggleFavorite } from './modules/storage.js';
import { haversineKm, chooseTransport, timeDifferenceHours } from './modules/geo.js';
import {
  displayCountryName, fetchWorldBankStats, getCountry, getFlagEmoji,
  loadCountryIndex, loadKnowledge, loadPlaces, loadWorldGeometries,
  searchLocal, searchOnlinePlaces
} from './modules/dataService.js';
import { GlobeView } from './modules/globe.js';

const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const escapeHtml = (value='') => String(value).replace(/[&<>"]/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

const state = {
  locale: getStored('locale', navigator.language?.startsWith('ko') ? 'ko' : 'en'),
  theme: getStored('theme', 'system'),
  origin: { ...APP.defaultOrigin },
  originCountry: null,
  destination: null,
  country: null,
  knowledge: null,
  stats: null,
  transport: 'plane',
  countryIndex: [],
  places: [],
  searchTimer: null,
  searchAbort: null,
  searchResults: [],
  selectedResultIndex: -1
};

let t = translator(state.locale);
let globe;

function icon(name, size=20) {
  const paths = {
    search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    location:'<path d="M12 21s6-5.1 6-11a6 6 0 1 0-12 0c0 5.9 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/>',
    heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:'<path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.7 6.7 0 0 0 9.8 9.8Z"/>',
    monitor:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8M12 17v4"/>',
    replay:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    close:'<path d="M6 6l12 12M18 6 6 18"/>'
  };
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||''}</svg>`;
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
            ${icon('search',23)}
            <input id="searchInput" type="search" autocomplete="off" spellcheck="false" aria-autocomplete="list" aria-controls="searchResults" />
            <button id="clearSearch" class="clear-search" type="button" aria-label="Clear" hidden>${icon('close',18)}</button>
          </div>
          <div class="search-hint" id="searchHint"></div>
          <div class="search-results" id="searchResults" role="listbox" hidden></div>
        </div>
      </section>

      <section class="explorer-grid" aria-live="polite">
        <div class="map-column">
          <div class="origin-bar">
            <div class="origin-status">
              <span class="origin-dot" aria-hidden="true"></span>
              <div><strong id="originLabel"></strong><small id="originPrivacy"></small></div>
            </div>
            <button id="locationButton" class="secondary-button" type="button">${icon('location',18)}<span data-i18n="useMyLocation"></span></button>
          </div>

          <div class="globe-card">
            <svg id="globeSvg" class="globe-svg" viewBox="0 0 1000 500" role="img" aria-label="World map with animated travel route"></svg>
            <div class="map-label map-label-origin" id="mapOriginLabel"></div>
            <div class="map-label map-label-destination" id="mapDestinationLabel"></div>
          </div>

          <div class="journey-panel" id="journeyPanel">
            <div class="journey-heading">
              <div><span class="eyebrow" data-i18n="route"></span><strong id="journeyTitle">—</strong></div>
              <button class="ghost-button" id="replayButton" type="button">${icon('replay',17)}<span data-i18n="replay"></span></button>
            </div>
            <div class="journey-stats">
              <div><span data-i18n="distance"></span><strong id="distanceValue">—</strong></div>
              <div><span data-i18n="timeDiff"></span><strong id="timeDiffValue">—</strong></div>
              <div><span data-i18n="localTime"></span><strong id="localTimeValue">—</strong></div>
            </div>
            <div class="transport-row" aria-label="Transport selection">
              <span class="transport-label" data-i18n="transport"></span>
              <div class="segmented" id="transportSelector">
                <button type="button" data-transport="plane">✈️ <span data-i18n="plane"></span></button>
                <button type="button" data-transport="ship">⛴️ <span data-i18n="ship"></span></button>
                <button type="button" data-transport="train">🚆 <span data-i18n="train"></span></button>
              </div>
            </div>
          </div>
        </div>

        <aside class="detail-column" id="detailColumn">
          <div class="country-heading">
            <div class="country-title-wrap"><span id="flagEmoji" class="flag-emoji">🌍</span><div><span class="eyebrow" id="destinationType"></span><h2 id="destinationTitle">—</h2><p id="destinationSubtitle"></p></div></div>
            <button class="icon-button favorite-button" id="favoriteButton" type="button" aria-label="Favorite">${icon('heart')}</button>
          </div>

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

function applyTranslations() {
  t = translator(state.locale);
  document.documentElement.lang = state.locale === 'zh' ? 'zh-CN' : state.locale;
  $$('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  $('#searchInput').placeholder = t('searchPlaceholder');
  $('#searchHint').textContent = t('searchHint');
  $('#originPrivacy').textContent = t('locationPrivacy');
  $('#originLabel').textContent = state.origin.source === 'geolocation' ? t('locationReady') : t('usingExampleOrigin');
  renderThemeButton();
  renderCurrentSelection();
  renderRecent();
}

function renderLanguageSelect() {
  const select = $('#languageSelect');
  select.innerHTML = APP.supportedLocales.map((l) => `<option value="${l}" ${l===state.locale?'selected':''}>${localeLabel(l)}</option>`).join('');
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
  const cycle = {system:'light',light:'dark',dark:'system'};
  btn.dataset.nextTheme = cycle[state.theme] || 'system';
  btn.innerHTML = icon(state.theme === 'light' ? 'sun' : state.theme === 'dark' ? 'moon' : 'monitor');
  btn.title = `${t('theme')}: ${t(state.theme)}`;
  btn.setAttribute('aria-label', btn.title);
}

function formatNumber(value, options={}) {
  if (value == null || Number.isNaN(Number(value))) return t('unavailable');
  return new Intl.NumberFormat(state.locale, options).format(Number(value));
}

function formatCompact(value) {
  return formatNumber(value, { notation:'compact', maximumFractionDigits:1 });
}

function formatUsd(value) {
  if (value == null) return t('unavailable');
  return new Intl.NumberFormat(state.locale, { style:'currency', currency:'USD', notation:'compact', maximumFractionDigits:1 }).format(value);
}

function localizedLanguage(code) {
  try { return new Intl.DisplayNames([state.locale], {type:'language'}).of(code) || code; } catch { return code; }
}

function getDestinationTimezone() {
  if (state.destination?.timezone) return state.destination.timezone;
  const capital = state.country?.capital?.toLowerCase();
  const seededCapital = state.places.find((p) => p.countryCode === state.country?.code2 && p.name.toLowerCase() === capital);
  return seededCapital?.timezone || state.country?.timezones?.[0] || null;
}

function formatLocalTime(timezone) {
  if (!timezone) return '—';
  const match = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timezone);
  if (match) {
    const sign = match[1] === '+' ? 1 : -1;
    const minutes = sign * (Number(match[2]) * 60 + Number(match[3]));
    const shifted = new Date(Date.now() + minutes * 60000);
    return new Intl.DateTimeFormat(state.locale,{timeZone:'UTC',hour:'2-digit',minute:'2-digit'}).format(shifted);
  }
  try { return new Intl.DateTimeFormat(state.locale,{timeZone:timezone,hour:'2-digit',minute:'2-digit'}).format(new Date()); } catch { return '—'; }
}

function resultName(result) {
  if (result.kind === 'country') return result.displayName || displayCountryName(result.code2, state.locale, result.name);
  if (state.locale === 'ko' && result.nameKo) return result.nameKo;
  return result.name;
}

function resultSecondary(result) {
  if (result.kind === 'country') return [result.capital, result.region].filter(Boolean).join(' · ');
  const country = result.countryCode ? displayCountryName(result.countryCode, state.locale, result.country || '') : result.country;
  return [result.admin1, country].filter(Boolean).join(' · ');
}

function renderSearchResults(results, onlineState='') {
  const box = $('#searchResults');
  state.searchResults = results;
  state.selectedResultIndex = -1;
  if (!$('#searchInput').value.trim()) { box.hidden=true; return; }
  if (!results.length) {
    box.innerHTML = `<div class="search-empty">${onlineState === 'error' ? escapeHtml(t('networkFallback')) : escapeHtml(t('noResults'))}</div>`;
    box.hidden=false; return;
  }
  const groups = [];
  const countries=results.filter((x)=>x.kind==='country');
  const places=results.filter((x)=>x.kind!=='country');
  if (countries.length) groups.push(`<div class="result-group-label">${escapeHtml(t('countries'))}</div>${countries.map(resultRow).join('')}`);
  if (places.length) groups.push(`<div class="result-group-label">${escapeHtml(t('places'))}</div>${places.map(resultRow).join('')}`);
  box.innerHTML = groups.join('');
  box.hidden=false;
  $$('.search-result',box).forEach((el)=>el.addEventListener('click',()=>selectResult(results[Number(el.dataset.index)])));
}

function resultRow(result) {
  const index = state.searchResults.length ? state.searchResults.indexOf(result) : -1;
  const realIndex = index >= 0 ? index : 0;
  const type = result.kind === 'country' ? t('country') : result.type === 'landmark' ? t('landmark') : result.type === 'region' ? t('regionPlace') : t('city');
  return `<button class="search-result" role="option" type="button" data-index="${realIndex}">
    <span class="result-icon">${getFlagEmoji(result.code2 || result.countryCode)}</span>
    <span class="result-copy"><strong>${escapeHtml(resultName(result))}</strong><small>${escapeHtml(type)} · ${escapeHtml(resultSecondary(result))}</small></span>
    ${icon('chevron',17)}
  </button>`;
}

async function doSearch() {
  const input = $('#searchInput');
  const query = input.value.trim();
  $('#clearSearch').hidden = !query;
  if (!query) { $('#searchResults').hidden=true; return; }
  const local = await searchLocal(query,state.locale);
  state.searchResults = local;
  renderSearchResults(local);
  if (query.length < 2) return;
  state.searchAbort?.abort();
  const controller = new AbortController(); state.searchAbort=controller;
  try {
    const online = await searchOnlinePlaces(query,state.locale);
    if (controller.signal.aborted || $('#searchInput').value.trim() !== query) return;
    const keys = new Set(local.map((x)=>`${x.countryCode||x.code2}:${(x.name||x.displayName||'').toLowerCase()}`));
    const extra = online.filter((x)=>!keys.has(`${x.countryCode}:${x.name.toLowerCase()}`));
    const merged=[...local,...extra].slice(0,12);
    state.searchResults=merged;
    renderSearchResults(merged);
  } catch {
    if (!controller.signal.aborted && !local.length) renderSearchResults([], 'error');
  }
}

async function selectResult(result, {skipUrl=false}={}) {
  if (!result) return;
  $('#searchResults').hidden=true;
  $('#searchInput').value=''; $('#clearSearch').hidden=true;
  const code2=(result.code2 || result.countryCode || '').toUpperCase();
  const country=await getCountry(code2);
  if (!country) return;
  state.country=country;
  if (result.kind === 'country') {
    state.destination={
      key:`country:${code2}`, kind:'country', name:displayCountryName(code2,state.locale,country.name),
      lat:country.capitalLat ?? country.lat, lon:country.capitalLon ?? country.lon,
      countryCode:code2, timezone:null, subtitle:country.capital ? `${t('capital')}: ${country.capital}` : '',
      rawName:country.name
    };
  } else {
    state.destination={
      key:`place:${result.id || result.name}:${code2}`, kind:result.type || 'city', name:resultName(result),
      lat:Number(result.lat), lon:Number(result.lon), countryCode:code2, timezone:result.timezone || null,
      subtitle:resultSecondary(result), rawName:result.name, population:result.population
    };
  }
  state.knowledge=await loadKnowledge(code2);
  state.stats=null;
  const distance=haversineKm(state.origin,state.destination);
  state.transport=chooseTransport(state.originCountry,country,distance);
  globe.highlightCountry(code2); globe.setRoute(state.origin,state.destination,state.transport);
  renderCurrentSelection();
  const recentItem={key:state.destination.key,name:state.destination.name,countryCode:code2,kind:state.destination.kind,lat:state.destination.lat,lon:state.destination.lon,timezone:state.destination.timezone,rawName:state.destination.rawName};
  pushRecent(recentItem, APP.maxRecent); renderRecent();
  if (!skipUrl) updateUrl();
  fetchWorldBankStats(country.code3).then((stats)=>{ if (state.country?.code2===code2){ state.stats=stats; renderFacts(); } }).catch(()=>{});
}

function updateUrl() {
  if (!state.destination) return;
  const u=new URL(location.href); u.search='';
  u.searchParams.set('c',state.destination.countryCode);
  if (state.destination.kind !== 'country') {
    u.searchParams.set('name',state.destination.rawName || state.destination.name);
    u.searchParams.set('lat',state.destination.lat.toFixed(4)); u.searchParams.set('lon',state.destination.lon.toFixed(4));
    if (state.destination.timezone) u.searchParams.set('tz',state.destination.timezone);
  }
  history.replaceState(null,'',u);
}

function renderCurrentSelection() {
  if (!state.destination || !state.country || !$('#destinationTitle')) return;
  const d=state.destination,c=state.country;
  $('#flagEmoji').textContent=getFlagEmoji(c.code2);
  $('#destinationType').textContent=d.kind==='country' ? t('country') : d.kind==='landmark' ? t('landmark') : d.kind==='region' ? t('regionPlace') : t('city');
  $('#destinationTitle').textContent=d.name;
  const countryName=displayCountryName(c.code2,state.locale,c.name);
  $('#destinationSubtitle').textContent=d.kind==='country' ? [c.subregion,c.region].filter(Boolean).join(' · ') : [d.subtitle,countryName].filter(Boolean).join(' · ');
  $('#mapOriginLabel').textContent=state.origin.source==='geolocation' ? t('useMyLocation') : (state.locale==='ko' ? state.origin.nameKo : state.origin.name);
  $('#mapDestinationLabel').textContent=d.name;
  $('#journeyTitle').textContent=`${$('#mapOriginLabel').textContent} → ${d.name}`;
  const distance=haversineKm(state.origin,d);
  $('#distanceValue').textContent=`${formatNumber(Math.round(distance))} km`;
  const destTz=getDestinationTimezone();
  const diff=timeDifferenceHours(state.origin.timezone,destTz);
  $('#timeDiffValue').textContent=diff==null?'—':`${diff>0?'+':''}${diff} h`;
  $('#localTimeValue').textContent=formatLocalTime(destTz);
  $$('#transportSelector button').forEach((b)=>b.classList.toggle('is-active',b.dataset.transport===state.transport));
  renderFacts(); renderKnowledge(); renderFavoriteState();
}

function factCard(iconEmoji,label,value,source='') {
  return `<div class="fact-card"><span class="fact-icon" aria-hidden="true">${iconEmoji}</span><div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong>${source?`<small>${escapeHtml(source)}</small>`:''}</div></div>`;
}

function renderFacts() {
  if (!state.country) return;
  const c=state.country; const s=state.stats;
  const pop=s?.population?.value ?? c.population;
  const popSrc=s?.population ? `${t('sourceYear')} ${s.population.year}` : t('staticStat');
  const gdp=s?.gdp?.value; const gni=s?.gni?.value;
  const statsOnline=Boolean(s?.population || s?.gdp || s?.gni);
  $('#statsBadge').textContent=statsOnline?t('liveStat'):t('staticStat');
  const currencies=(c.currencies||[]).join(', ') || t('unavailable');
  const langs=(c.languages||[]).map(localizedLanguage).join(', ') || t('unavailable');
  const calling=(c.callingCodes||[]).filter(Boolean).map(x=>`+${x}`).join(', ') || t('unavailable');
  $('#factsGrid').innerHTML=[
    factCard('🏛️',t('capital'),c.capital||t('unavailable')),
    factCard('👥',t('population'),formatCompact(pop),popSrc),
    factCard('📐',t('area'),c.areaKm2?`${formatNumber(Math.round(c.areaKm2))} km²`:t('unavailable')),
    factCard('💵',t('gdp'),gdp?formatUsd(gdp):t('unavailable'),s?.gdp?`${t('sourceYear')} ${s.gdp.year}`:''),
    factCard('🌱',t('gni'),gni?formatUsd(gni):t('unavailable'),s?.gni?`${t('sourceYear')} ${s.gni.year}`:''),
    factCard('💰',t('currency'),currencies),
    factCard('🗣️',t('languages'),langs),
    factCard('🧭',t('region'),displayRegion(c.region)),
    factCard('☎️',t('callingCode'),calling)
  ].join('');
  $('#statsNote').textContent=s?.failed?t('onlineDataError'):'';
}

function displayRegion(region) {
  const map={ko:{Asia:'아시아',Europe:'유럽',Africa:'아프리카',Americas:'아메리카',Oceania:'오세아니아'},ja:{Asia:'アジア',Europe:'ヨーロッパ',Africa:'アフリカ',Americas:'アメリカ大陸',Oceania:'オセアニア'},zh:{Asia:'亚洲',Europe:'欧洲',Africa:'非洲',Americas:'美洲',Oceania:'大洋洲'}};
  return map[state.locale]?.[region] || region || t('unavailable');
}

function renderKnowledge() {
  const root=$('#knowledgeContent'); if(!root) return;
  const k=state.knowledge;
  if (!k) {
    root.innerHTML=`<div class="knowledge-empty"><span aria-hidden="true">🧩</span><p>${escapeHtml(t('knowledgeFallback'))}</p></div>`; return;
  }
  const data=state.locale==='ko' && k.ko ? k.ko : k;
  const block=(emoji,label,items)=>`<div class="knowledge-row"><div class="knowledge-label"><span>${emoji}</span><strong>${escapeHtml(label)}</strong></div><div class="chip-list">${(items||[]).map(x=>`<span>${escapeHtml(x)}</span>`).join('')}</div></div>`;
  root.innerHTML=`${block('🍚',t('specialties'),data.specialties)}${block('🐾',t('animals'),data.animals)}${block('🌿',t('plants'),data.plants)}<div class="fun-facts"><h4>💡 ${escapeHtml(t('funFacts'))}</h4><ul>${(data.facts||[]).map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul></div>`;
}

function renderFavoriteState() {
  const favs=getStored('favorites',[]); const active=state.destination && favs.some(x=>x.key===state.destination.key);
  const btn=$('#favoriteButton'); if(!btn)return;
  btn.classList.toggle('is-active',active); btn.title=active?t('unfavorite'):t('favorite'); btn.setAttribute('aria-label',btn.title);
}

function renderRecent() {
  const root=$('#recentStrip'); if(!root)return;
  const recent=getStored('recent',[]); const favs=getStored('favorites',[]);
  $('#favoriteCount').textContent=favs.length?`♥ ${favs.length}`:'';
  if(!recent.length){root.innerHTML=`<p class="history-empty">${escapeHtml(t('noRecent'))}</p>`;return;}
  root.innerHTML=recent.map((x,i)=>`<button class="history-item" type="button" data-recent="${i}"><span>${getFlagEmoji(x.countryCode)}</span><strong>${escapeHtml(x.name)}</strong><small>${escapeHtml(displayCountryName(x.countryCode,state.locale,''))}</small></button>`).join('');
  $$('.history-item',root).forEach(btn=>btn.addEventListener('click',()=>{
    const x=recent[Number(btn.dataset.recent)];
    selectResult({kind:x.kind==='country'?'country':'place',id:x.key,name:x.rawName||x.name,nameKo:x.name,type:x.kind,countryCode:x.countryCode,code2:x.countryCode,lat:x.lat,lon:x.lon,timezone:x.timezone});
  }));
}

function toast(message) {
  const el=$('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),3200);
}

async function useLocation() {
  if(!navigator.geolocation){toast(t('locationDenied'));return;}
  const btn=$('#locationButton'); btn.disabled=true; btn.classList.add('is-loading');
  navigator.geolocation.getCurrentPosition(async(pos)=>{
    state.origin={name:'My location',nameKo:'내 위치',lat:pos.coords.latitude,lon:pos.coords.longitude,countryCode:null,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,source:'geolocation'};
    let nearest=null, min=Infinity;
    for(const c of state.countryIndex){ if(c.lat==null||c.lon==null)continue; const d=haversineKm(state.origin,{lat:c.lat,lon:c.lon}); if(d<min){min=d;nearest=c;} }
    state.originCountry=nearest?await getCountry(nearest.code2):null;
    $('#originLabel').textContent=t('locationReady');
    if(state.destination){ const distance=haversineKm(state.origin,state.destination); state.transport=chooseTransport(state.originCountry,state.country,distance); globe.setRoute(state.origin,state.destination,state.transport); renderCurrentSelection(); }
    btn.disabled=false;btn.classList.remove('is-loading');toast(t('locationReady'));
  },()=>{btn.disabled=false;btn.classList.remove('is-loading');toast(t('locationDenied'));},{enableHighAccuracy:false,timeout:8000,maximumAge:600000});
}

function wireEvents() {
  $('#languageSelect').addEventListener('change',(e)=>{state.locale=e.target.value;setStored('locale',state.locale);applyTranslations(); if(state.country){ state.destination.name=state.destination.kind==='country'?displayCountryName(state.country.code2,state.locale,state.country.name):state.destination.name; renderCurrentSelection(); }});
  $('#themeButton').addEventListener('click',()=>setTheme($('#themeButton').dataset.nextTheme));
  $('#locationButton').addEventListener('click',useLocation);
  $('#replayButton').addEventListener('click',()=>globe.replay());
  $('#transportSelector').addEventListener('click',(e)=>{const b=e.target.closest('button[data-transport]');if(!b||!state.destination)return;state.transport=b.dataset.transport;globe.setRoute(state.origin,state.destination,state.transport);renderCurrentSelection();});
  $('#favoriteButton').addEventListener('click',()=>{if(!state.destination)return;const item={key:state.destination.key,name:state.destination.name,countryCode:state.destination.countryCode,kind:state.destination.kind,lat:state.destination.lat,lon:state.destination.lon,timezone:state.destination.timezone,rawName:state.destination.rawName};const r=toggleFavorite(item);renderFavoriteState();renderRecent();toast(r.active?t('favorite'):t('unfavorite'));});
  $('#searchInput').addEventListener('input',()=>{clearTimeout(state.searchTimer);state.searchTimer=setTimeout(doSearch,180);});
  $('#searchInput').addEventListener('keydown',(e)=>{
    if($('#searchResults').hidden)return;
    const rows=$$('.search-result','#searchResults'); if(!rows.length)return;
    if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();state.selectedResultIndex=(state.selectedResultIndex+(e.key==='ArrowDown'?1:-1)+rows.length)%rows.length;rows.forEach((r,i)=>r.classList.toggle('is-keyboard-selected',i===state.selectedResultIndex));rows[state.selectedResultIndex].scrollIntoView({block:'nearest'});}
    if(e.key==='Enter'&&state.selectedResultIndex>=0){e.preventDefault();rows[state.selectedResultIndex].click();}
    if(e.key==='Escape'){$('#searchResults').hidden=true;}
  });
  $('#clearSearch').addEventListener('click',()=>{$('#searchInput').value='';$('#clearSearch').hidden=true;$('#searchResults').hidden=true;$('#searchInput').focus();});
  document.addEventListener('click',(e)=>{if(!e.target.closest('.search-wrap'))$('#searchResults').hidden=true;});
  const dialog=$('#sourceDialog'); const open=()=>dialog.showModal(); $('#infoButton').addEventListener('click',open); $('#footerInfo').addEventListener('click',open); $$('[data-dialog-close]').forEach(b=>b.addEventListener('click',()=>dialog.close()));
}

async function loadInitialSelection() {
  const params=new URLSearchParams(location.search); const c=(params.get('c')||'JP').toUpperCase();
  if(params.get('lat')&&params.get('lon')){
    await selectResult({kind:'place',id:'url',name:params.get('name')||displayCountryName(c,state.locale,c),type:'city',countryCode:c,lat:Number(params.get('lat')),lon:Number(params.get('lon')),timezone:params.get('tz')||null},{skipUrl:true});
  }else{
    const countryRow=state.countryIndex.find(x=>x.code2===c)||state.countryIndex.find(x=>x.code2==='JP');
    await selectResult({kind:'country',...countryRow,displayName:displayCountryName(countryRow.code2,state.locale,countryRow.name)},{skipUrl:true});
  }
}

async function init() {
  renderAppShell(); renderLanguageSelect(); setTheme(state.theme); applyTranslations(); wireEvents();
  globe=new GlobeView($('#globeSvg'));
  const [geoms,index,places]=await Promise.all([loadWorldGeometries(),loadCountryIndex(),loadPlaces()]);
  state.countryIndex=index; state.places=places; state.originCountry=await getCountry(APP.defaultOrigin.countryCode);
  globe.setGeometries(geoms);
  await loadInitialSelection();
  if('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('./sw.js').catch(()=>{});
  const focus=new URLSearchParams(location.search).get('focus'); if(focus==='search') $('#searchInput').focus();
}

init().catch((error)=>{
  console.error(error);
  $('#app').innerHTML='<main class="fatal-error"><span>🌍</span><h1>GlobeHop</h1><p>지도를 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p><button onclick="location.reload()">새로고침</button></main>';
});
