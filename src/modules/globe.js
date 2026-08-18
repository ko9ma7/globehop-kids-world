import { geometryToSvgPath, routeGeometry, quadraticPoint, equirectProject } from './geo.js';

const NS = 'http://www.w3.org/2000/svg';

function svgEl(name, attrs = {}) {
  const el = document.createElementNS(NS, name);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

export class GlobeView {
  constructor(svg) {
    this.svg = svg;
    this.geometries = [];
    this.animFrame = null;
    this.currentRoute = null;
    this.renderShell();
  }

  renderShell() {
    this.svg.innerHTML = '';
    const defs = svgEl('defs');
    const oceanShade = svgEl('linearGradient', { id: 'oceanShade', x1: '0', x2: '1' });
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
    this.routeLayer = svgEl('g', { class: 'route-layer' });
    this.markerLayer = svgEl('g', { class: 'marker-layer' });
    this.svg.appendChild(this.landLayer);
    this.svg.appendChild(this.routeLayer);
    this.svg.appendChild(this.markerLayer);
  }

  setGeometries(geometries) {
    this.geometries = geometries;
    this.landLayer.innerHTML = '';
    const frag = document.createDocumentFragment();
    geometries.forEach((g) => {
      const path = svgEl('path', {
        d: geometryToSvgPath(g.geometry),
        class: 'country-shape',
        'data-code': g.code2,
        'aria-label': g.name
      });
      frag.appendChild(path);
    });
    this.landLayer.appendChild(frag);
  }

  highlightCountry(code2) {
    this.landLayer.querySelectorAll('.country-shape.is-selected').forEach((p) => p.classList.remove('is-selected'));
    if (!code2) return;
    this.landLayer.querySelectorAll(`[data-code="${CSS.escape(code2)}"]`).forEach((p) => p.classList.add('is-selected'));
  }

  setRoute(origin, destination, transport = 'plane', tripType = 'oneway') {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.routeLayer.innerHTML = '';
    this.markerLayer.innerHTML = '';
    const route = routeGeometry(origin, destination);
    this.currentRoute = { origin, destination, transport, route, tripType };
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
    this.animate();
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
      const routeT = this.currentRoute.tripType === 'roundtrip'
        ? (eased < 0.5 ? eased * 2 : 2 - eased * 2)
        : eased;
      const p = quadraticPoint(this.currentRoute.route, routeT);
      this.traveler.setAttribute('transform', `translate(${p.x} ${p.y})`);
      if (progress < 1) this.animFrame = requestAnimationFrame(tick);
    };
    this.animFrame = requestAnimationFrame(tick);
  }

  replay() {
    this.animate();
  }
}
