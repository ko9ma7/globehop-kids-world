import { geometryToSvgPath, routeGeometry, quadraticPoint, equirectProject } from './geo.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

export class GlobeView {
  constructor(svg, { onHover, onLeave, onCountryClick, onPlaceClick } = {}) {
    this.svg = svg;
    this.geometries = [];
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
    this.viewAnimation = null;
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

  setPlaces(places) {
    this.places = places;
    this.placeLayer.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (const place of places) {
      const p = equirectProject(place.lat, place.lon);
      const g = svgEl('g', { class: `map-place-point map-place-${place.type || 'city'}`, transform: `translate(${p.x} ${p.y})`, tabindex: place.isCapitalPoint ? '-1' : '0', role: 'button', 'aria-label': place.name || place.nameKo || place.id, 'data-country': place.countryCode || '', 'data-searched': place.isSearchedPoint ? '1' : '0' });
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
    const path = svgEl('path', { d, class: 'travel-path' });
    this.routeLayer.appendChild(path);
    if (tripType === 'roundtrip') {
      const echo = svgEl('path', { d, class: 'travel-path travel-path-return' });
      this.routeLayer.appendChild(echo);
    }
    if (route.wrap) {
      const shift = route.p2.x < 0 ? 1000 : -1000;
      const clone = svgEl('path', {
        d: `M${route.p1.x + shift},${route.p1.y} Q${route.control.x + shift},${route.control.y} ${route.p2.x + shift},${route.p2.y}`,
        class: 'travel-path travel-path-secondary'
      });
      this.routeLayer.appendChild(clone);
    }
    const start = equirectProject(origin.lat, origin.lon);
    const end = equirectProject(destination.lat, destination.lon);
    this.markerLayer.appendChild(this.pin(start.x, start.y, 'origin'));
    this.markerLayer.appendChild(this.pin(end.x, end.y, 'destination'));
    this.traveler = svgEl('g', { class: 'traveler', 'aria-hidden': 'true' });
    const bubble = svgEl('circle', { cx: '0', cy: '0', r: '23', class: 'traveler-bubble' });
    this.traveler.appendChild(bubble);
    const text = svgEl('text', { x: '0', y: '7', 'text-anchor': 'middle', class: 'traveler-icon' });
    text.textContent = '✈️';
    this.traveler.appendChild(text);
    this.markerLayer.appendChild(this.traveler);
    if (focus) this.focusRoute(origin, destination);
    this.animate();
  }

  focusRoute(origin, destination) {
    this.svg.classList.add('is-zoomed');
    const p1 = equirectProject(origin.lat, origin.lon);
    const p2 = equirectProject(destination.lat, destination.lon);
    let x1 = p1.x;
    let x2 = p2.x;
    if (Math.abs(x2 - x1) > 500) {
      if (x2 > x1) x1 += 1000;
      else x2 += 1000;
    }
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    const routeWidth = Math.max(82, maxX - minX);
    const routeHeight = Math.max(52, maxY - minY);
    const width = Math.min(1000, Math.max(96, routeWidth * 1.65, routeHeight * 2.4));
    const height = Math.min(500, width / 2);
    let centerX = (minX + maxX) / 2;
    while (centerX > 1000) centerX -= 1000;
    while (centerX < 0) centerX += 1000;
    const centerY = (minY + maxY) / 2;
    let x = centerX - width / 2;
    const y = Math.max(0, Math.min(500 - height, centerY - height / 2));
    if (x < 0) x = 0;
    if (x + width > 1000) x = 1000 - width;
    this.animateViewBox({ x, y, width, height }, 800);
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
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  resetView() {
    this.svg.classList.remove('is-zoomed');
    this.animateViewBox(this.defaultViewBox, 650);
  }

  pin(x, y, kind) {
    const g = svgEl('g', { class: `map-pin ${kind}` });
    g.setAttribute('transform', `translate(${x} ${y})`);
    g.appendChild(svgEl('circle', { cx: '0', cy: '0', r: '11' }));
    g.appendChild(svgEl('circle', { cx: '0', cy: '0', r: '4', class: 'pin-core' }));
    return g;
  }

  animate() {
    if (!this.currentRoute || !this.traveler) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const finalT = this.currentRoute.tripType === 'roundtrip' ? 0 : 1;
      const p = quadraticPoint(this.currentRoute.route, finalT);
      this.traveler.setAttribute('transform', `translate(${p.x} ${p.y})`);
      return;
    }
    const start = performance.now();
    const duration = this.currentRoute.tripType === 'roundtrip' ? 4200 : 2600;
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const routeT = this.currentRoute.tripType === 'roundtrip' ? (eased < 0.5 ? eased * 2 : 2 - eased * 2) : eased;
      const p = quadraticPoint(this.currentRoute.route, routeT);
      this.traveler.setAttribute('transform', `translate(${p.x} ${p.y})`);
      if (progress < 1) this.animFrame = requestAnimationFrame(tick);
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  replay() {
    this.animate();
    if (this.currentRoute) this.focusRoute(this.currentRoute.origin, this.currentRoute.destination);
  }
}
