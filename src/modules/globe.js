import { geometryToSvgPath, routeGeometry, quadraticPoint, equirectProject } from './geo.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function eachGeometryPoint(geometry, callback) {
  if (!geometry) return;
  const walkRing = (ring) => ring.forEach(([lon, lat]) => callback(lon, lat));
  if (geometry.type === 'Polygon') geometry.coordinates.forEach(walkRing);
  if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach((polygon) => polygon.forEach(walkRing));
}

export class GlobeView {
  constructor(svg, { onHover, onLeave, onCountryClick, onPlaceClick } = {}) {
    this.svg = svg;
    this.geometries = [];
    this.geometryByCode = new Map();
    this.countries = new Map();
    this.places = [];
    this.animFrame = null;
    this.currentRoute = null;
    this.originCountry = null;
    this.destinationCountry = null;
    this.onHover = onHover;
    this.onLeave = onLeave;
    this.onCountryClick = onCountryClick;
    this.onPlaceClick = onPlaceClick;
    this.defaultViewBox = { x: 0, y: 0, width: 1000, height: 500 };
    this.currentViewBox = { ...this.defaultViewBox };
    this.renderShell();
  }

  renderShell() {
    this.svg.innerHTML = '';
    this.svg.setAttribute('viewBox', '0 0 1000 500');
    const defs = svgEl('defs');
    const oceanShade = svgEl('linearGradient', { id: 'oceanShade2d', x1: '0', x2: '1' });
    oceanShade.innerHTML = '<stop offset="0%" stop-color="var(--ocean-deep)"/><stop offset="48%" stop-color="var(--ocean)"/><stop offset="100%" stop-color="var(--ocean-deep)"/>';
    defs.appendChild(oceanShade);
    this.svg.appendChild(defs);
    this.svg.appendChild(svgEl('rect', { x: '0', y: '0', width: '1000', height: '500', class: 'map-ocean' }));
    this.gridLayer = svgEl('g', { class: 'globe-grid' });
    for (let lon = -150; lon <= 150; lon += 30) {
      const x = ((lon + 180) / 360) * 1000;
      this.gridLayer.appendChild(svgEl('path', { d: `M${x},0 V500` }));
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * 500;
      this.gridLayer.appendChild(svgEl('path', { d: `M0,${y} H1000` }));
    }
    this.svg.appendChild(this.gridLayer);
    this.landLayer = svgEl('g', { class: 'land-layer' });
    this.placeLayer = svgEl('g', { class: 'place-layer' });
    this.routeLayer = svgEl('g', { class: 'route-layer' });
    this.markerLayer = svgEl('g', { class: 'marker-layer' });
    this.svg.appendChild(this.landLayer);
    this.svg.appendChild(this.placeLayer);
    this.svg.appendChild(this.routeLayer);
    this.svg.appendChild(this.markerLayer);
  }

  setData({ geometries = [], countries = [], places = [] }) {
    this.countries = new Map(countries.map((c) => [c.code2, c]));
    this.setGeometries(geometries);
    this.setPlaces(places);
  }

  setGeometries(geometries) {
    this.geometries = geometries;
    this.geometryByCode = new Map(geometries.map((g) => [g.code2, g]));
    this.landLayer.innerHTML = '';
    const frag = document.createDocumentFragment();
    geometries.forEach((g) => {
      const path = svgEl('path', { d: geometryToSvgPath(g.geometry), class: 'country-shape interactive-country', 'data-code': g.code2, 'aria-label': g.name, tabindex: '0' });
      const meta = this.countries.get(g.code2) || g;
      const showHover = (event) => this.onHover?.({ kind: 'country', data: meta }, { clientX: event.clientX, clientY: event.clientY });
      path.addEventListener('pointerenter', showHover);
      path.addEventListener('pointermove', showHover);
      path.addEventListener('pointerleave', () => this.onLeave?.());
      path.addEventListener('click', () => this.onCountryClick?.(meta));
      path.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.onCountryClick?.(meta); } });
      frag.appendChild(path);
    });
    this.landLayer.appendChild(frag);
  }

  markerVisualScale() {
    return Math.max(0.18, Math.min(1, this.currentViewBox.width / 1000));
  }

  pointTransform(x, y) {
    return `translate(${x} ${y}) scale(${this.markerVisualScale()})`;
  }

  setPlaces(places) {
    this.places = places;
    this.placeLayer.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const place of places) {
      const p = equirectProject(place.lat, place.lon);
      const g = svgEl('g', {
        class: `map-place-point map-place-${place.type || 'city'}`,
        transform: this.pointTransform(p.x, p.y),
        tabindex: place.isCapitalPoint ? '-1' : '0', role: 'button',
        'aria-label': place.name || place.nameKo || place.id,
        'data-country': place.countryCode || '', 'data-searched': place.isSearchedPoint ? '1' : '0',
        'data-x': p.x, 'data-y': p.y
      });
      g.appendChild(svgEl('circle', { cx: '0', cy: '0', r: place.type === 'landmark' ? '5.2' : place.type === 'capital' ? '2.4' : '3.7', class: 'map-place-dot' }));
      const showHover = (event) => this.onHover?.({ kind: 'place', data: place }, { clientX: event.clientX, clientY: event.clientY });
      g.addEventListener('pointerenter', showHover);
      g.addEventListener('pointermove', showHover);
      g.addEventListener('pointerleave', () => this.onLeave?.());
      g.addEventListener('click', (event) => { event.stopPropagation(); this.onPlaceClick?.(place); });
      g.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); this.onPlaceClick?.(place); } });
      frag.appendChild(g);
    }
    this.placeLayer.appendChild(frag);
  }

  refreshFixedSizeGraphics() {
    const scale = this.markerVisualScale();
    this.placeLayer?.querySelectorAll('.map-place-point').forEach((node) => {
      const x = Number(node.dataset.x); const y = Number(node.dataset.y);
      if (Number.isFinite(x) && Number.isFinite(y)) node.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    });
    this.markerLayer?.querySelectorAll('.map-pin').forEach((node) => {
      const x = Number(node.dataset.x); const y = Number(node.dataset.y);
      if (Number.isFinite(x) && Number.isFinite(y)) node.setAttribute('transform', `translate(${x} ${y}) scale(${scale})`);
    });
    if (this.traveler && this.traveler.dataset.x && this.traveler.dataset.y) {
      this.updateTravelerTransform(Number(this.traveler.dataset.x), Number(this.traveler.dataset.y));
    }
  }

  highlightCountry(code2) {
    this.landLayer.querySelectorAll('.country-shape.is-selected').forEach((p) => p.classList.remove('is-selected'));
    if (code2) this.landLayer.querySelectorAll(`[data-code="${CSS.escape(code2)}"]`).forEach((p) => p.classList.add('is-selected'));
    this.updateRouteCountryClasses();
    this.placeLayer.querySelectorAll('.map-place-point').forEach((point) => {
      const relevant = !code2 || point.dataset.country === code2 || point.dataset.country === this.originCountry || point.dataset.searched === '1';
      point.classList.toggle('is-muted-point', !relevant);
    });
  }

  updateRouteCountryClasses() {
    this.landLayer.querySelectorAll('.country-shape').forEach((path) => {
      const code = path.dataset.code;
      path.classList.toggle('is-route-origin', Boolean(this.originCountry && code === this.originCountry));
      path.classList.toggle('is-route-destination', Boolean(this.destinationCountry && code === this.destinationCountry));
    });
  }

  setRoute(origin, destination, transport = 'plane', tripType = 'oneway', { focus = true } = {}) {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.routeLayer.innerHTML = '';
    this.markerLayer.innerHTML = '';
    const route = routeGeometry(origin, destination);
    this.currentRoute = { origin, destination, transport, route, tripType };
    this.originCountry = origin.countryCode || null;
    this.destinationCountry = destination.countryCode || null;
    this.updateRouteCountryClasses();
    const d = `M${route.p1.x},${route.p1.y} Q${route.control.x},${route.control.y} ${route.p2.x},${route.p2.y}`;
    const path = svgEl('path', { d, class: 'travel-path', 'vector-effect': 'non-scaling-stroke' });
    this.routeLayer.appendChild(path);
    if (tripType === 'roundtrip') this.routeLayer.appendChild(svgEl('path', { d, class: 'travel-path travel-path-return', 'vector-effect': 'non-scaling-stroke' }));
    if (route.wrap) {
      const shift = route.p2.x < 0 ? 1000 : -1000;
      this.routeLayer.appendChild(svgEl('path', {
        d: `M${route.p1.x + shift},${route.p1.y} Q${route.control.x + shift},${route.control.y} ${route.p2.x + shift},${route.p2.y}`,
        class: 'travel-path travel-path-secondary', 'vector-effect': 'non-scaling-stroke'
      }));
    }
    const start = equirectProject(origin.lat, origin.lon);
    const end = equirectProject(destination.lat, destination.lon);
    this.markerLayer.appendChild(this.pin(start.x, start.y, 'origin'));
    this.markerLayer.appendChild(this.pin(end.x, end.y, 'destination'));
    this.traveler = svgEl('g', { class: 'traveler', 'aria-hidden': 'true', 'data-x': start.x, 'data-y': start.y });
    this.traveler.appendChild(svgEl('circle', { cx: '0', cy: '0', r: '17', class: 'traveler-bubble' }));
    const text = svgEl('text', { x: '0', y: '6', 'text-anchor': 'middle', class: 'traveler-icon' });
    text.textContent = '✈️';
    this.traveler.appendChild(text);
    this.markerLayer.appendChild(this.traveler);
    this.updateTravelerTransform(start.x, start.y);
    if (focus) this.focusRoute(origin, destination);
    this.animate();
  }

  countryProjectedBounds(code2) {
    const entry = this.geometryByCode.get(code2);
    if (!entry?.geometry) return null;
    const xs = []; const ys = [];
    eachGeometryPoint(entry.geometry, (lon, lat) => {
      const p = equirectProject(lat, lon);
      xs.push(p.x); ys.push(p.y);
    });
    if (!xs.length) return null;
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const width = maxX - minX; const height = maxY - minY;
    if (width > 300 || height > 220) return null;
    return { minX, maxX, minY, maxY };
  }

  focusRoute(origin, destination) {
    this.svg.classList.add('is-zoomed');
    const p1 = equirectProject(origin.lat, origin.lon);
    const p2 = equirectProject(destination.lat, destination.lon);
    const boxes = [{ minX: p1.x, maxX: p1.x, minY: p1.y, maxY: p1.y }, { minX: p2.x, maxX: p2.x, minY: p2.y, maxY: p2.y }];
    const originBox = this.countryProjectedBounds(origin.countryCode);
    const destinationBox = this.countryProjectedBounds(destination.countryCode);
    if (originBox) boxes.push(originBox);
    if (destinationBox && destination.countryCode !== origin.countryCode) boxes.push(destinationBox);

    let minX = Math.min(...boxes.map((b) => b.minX));
    let maxX = Math.max(...boxes.map((b) => b.maxX));
    const minY = Math.min(...boxes.map((b) => b.minY));
    const maxY = Math.max(...boxes.map((b) => b.maxY));
    // Dateline routes are fitted from the endpoint pair rather than stretching across the world.
    if (maxX - minX > 620) {
      minX = Math.min(p1.x, p2.x);
      maxX = Math.max(p1.x, p2.x);
    }
    const contentW = Math.max(48, maxX - minX);
    const contentH = Math.max(34, maxY - minY);
    // Keep geographic context. The previous 96-unit minimum made Seoul→Japan zoom more than 7×,
    // which inflated markers and made the map unreadable.
    const width = Math.min(1000, Math.max(190, contentW * 1.55, contentH * 2.55));
    const height = Math.min(500, width / 2);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const x = Math.max(0, Math.min(1000 - width, centerX - width / 2));
    const y = Math.max(0, Math.min(500 - height, centerY - height / 2));
    this.animateViewBox({ x, y, width, height }, 760);
  }

  animateViewBox(target, duration = 800) {
    const from = { ...this.currentViewBox };
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration);
      const e = 1 - Math.pow(1 - p, 3);
      this.currentViewBox = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        width: from.width + (target.width - from.width) * e,
        height: from.height + (target.height - from.height) * e
      };
      this.svg.setAttribute('viewBox', `${this.currentViewBox.x} ${this.currentViewBox.y} ${this.currentViewBox.width} ${this.currentViewBox.height}`);
      this.refreshFixedSizeGraphics();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  resetView() {
    this.svg.classList.remove('is-zoomed');
    this.animateViewBox(this.defaultViewBox, 650);
  }

  pin(x, y, kind) {
    const g = svgEl('g', { class: `map-pin ${kind}`, 'data-x': x, 'data-y': y, transform: this.pointTransform(x, y) });
    g.appendChild(svgEl('circle', { cx: '0', cy: '0', r: '9' }));
    g.appendChild(svgEl('circle', { cx: '0', cy: '0', r: '3.5', class: 'pin-core' }));
    return g;
  }

  updateTravelerTransform(x, y) {
    if (!this.traveler) return;
    this.traveler.dataset.x = x;
    this.traveler.dataset.y = y;
    this.traveler.setAttribute('transform', `translate(${x} ${y}) scale(${this.markerVisualScale()})`);
  }

  animate() {
    if (!this.currentRoute || !this.traveler) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const finalT = this.currentRoute.tripType === 'roundtrip' ? 0 : 1;
      const p = quadraticPoint(this.currentRoute.route, finalT);
      this.updateTravelerTransform(p.x, p.y);
      return;
    }
    const start = performance.now();
    const duration = this.currentRoute.tripType === 'roundtrip' ? 4200 : 2600;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const routeT = this.currentRoute.tripType === 'roundtrip' ? (eased < 0.5 ? eased * 2 : 2 - eased * 2) : eased;
      const p = quadraticPoint(this.currentRoute.route, routeT);
      this.updateTravelerTransform(p.x, p.y);
      if (progress < 1) this.animFrame = requestAnimationFrame(tick);
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  replay() {
    this.animate();
    if (this.currentRoute) this.focusRoute(this.currentRoute.origin, this.currentRoute.destination);
  }
}
