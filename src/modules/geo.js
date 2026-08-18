const R = 6371;
const rad = (d) => (d * Math.PI) / 180;
const ISLAND_OR_REMOTE = new Set(['AU','NZ','JP','ID','PH','IS','GB','IE','MG','TW','LK','SG']);

export function haversineKm(a, b) {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const lat1 = rad(a.lat);
  const lat2 = rad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function equirectProject(lat, lon, width = 1000, height = 500) {
  return {
    x: ((lon + 180) / 360) * width,
    y: ((90 - lat) / 180) * height
  };
}

function polygonPath(coords, width, height) {
  return coords.map((ring) => {
    if (!ring.length) return '';
    let d = '';
    ring.forEach(([lon, lat], i) => {
      const p = equirectProject(lat, lon, width, height);
      d += `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
    });
    return d + 'Z';
  }).join(' ');
}

export function geometryToSvgPath(geometry, width = 1000, height = 500) {
  if (!geometry) return '';
  if (geometry.type === 'Polygon') return polygonPath(geometry.coordinates, width, height);
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.map((poly) => polygonPath(poly, width, height)).join(' ');
  }
  return '';
}

export function routeGeometry(origin, destination, width = 1000, height = 500) {
  const p1 = equirectProject(origin.lat, origin.lon, width, height);
  let p2 = equirectProject(destination.lat, destination.lon, width, height);
  let x2 = p2.x;
  let dx = x2 - p1.x;
  if (Math.abs(dx) > width / 2) {
    x2 += dx > 0 ? -width : width;
    dx = x2 - p1.x;
  }
  const midpointX = (p1.x + x2) / 2;
  const midpointY = (p1.y + p2.y) / 2;
  const lift = Math.min(150, 42 + Math.abs(dx) * 0.12);
  const control = { x: midpointX, y: Math.max(24, midpointY - lift) };
  return { p1, p2: { x: x2, y: p2.y }, control, wrap: x2 !== p2.x };
}

export function quadraticPoint(route, t) {
  const { p1, p2, control } = route;
  const mt = 1 - t;
  return {
    x: mt * mt * p1.x + 2 * mt * t * control.x + t * t * p2.x,
    y: mt * mt * p1.y + 2 * mt * t * control.y + t * t * p2.y
  };
}

export function estimateFlightTimeHours(distanceKm) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0) return null;
  const cruiseHours = distanceKm / 820;
  return cruiseHours + (distanceKm > 2500 ? 1.5 : 1.1);
}

function bordersEachOther(originCountry, destinationCountry) {
  if (!originCountry || !destinationCountry) return false;
  const destCode3 = destinationCountry.code3;
  const originCode3 = originCountry.code3;
  return originCountry.borders?.includes(destCode3) || destinationCountry.borders?.includes(originCode3);
}

export function estimateLandRoute(originCountry, destinationCountry, airDistanceKm) {
  if (!originCountry || !destinationCountry || !Number.isFinite(airDistanceKm)) {
    return { available: false, reason: 'unknown' };
  }

  if (originCountry.code2 === destinationCountry.code2) {
    const distance = Math.round(airDistanceKm * 1.18);
    return { available: true, distanceKm: distance, hours: distance / 72, kind: 'same-country' };
  }

  const eitherRemote = ISLAND_OR_REMOTE.has(originCountry.code2) || ISLAND_OR_REMOTE.has(destinationCountry.code2);
  if (eitherRemote && originCountry.code2 !== destinationCountry.code2) {
    return { available: false, reason: 'sea-crossing' };
  }

  if (bordersEachOther(originCountry, destinationCountry)) {
    const distance = Math.round(airDistanceKm * 1.28);
    return { available: true, distanceKm: distance, hours: distance / 68, kind: 'neighbor' };
  }

  if (originCountry.region === destinationCountry.region && originCountry.region !== 'Oceania') {
    const distance = Math.round(airDistanceKm * 1.48);
    return { available: true, distanceKm: distance, hours: distance / 70, kind: 'same-region' };
  }

  const connectedRegions = new Set(['Asia', 'Europe', 'Africa']);
  if (connectedRegions.has(originCountry.region) && connectedRegions.has(destinationCountry.region)) {
    const distance = Math.round(airDistanceKm * 1.88);
    return { available: true, distanceKm: distance, hours: distance / 68, kind: 'eurasia-africa' };
  }

  return { available: false, reason: 'not-practical' };
}

export function timezoneOffsetMinutes(timeZone, date = new Date()) {
  if (!timeZone) return null;
  const offsetMatch = /^UTC([+-])(\d{2}):(\d{2})$/.exec(timeZone);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1;
    return sign * (Number(offsetMatch[2]) * 60 + Number(offsetMatch[3]));
  }
  if (timeZone === 'UTC') return 0;
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
    });
    const parts = Object.fromEntries(dtf.formatToParts(date).filter((p) => p.type !== 'literal').map((p) => [p.type, p.value]));
    const asUTC = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
    return Math.round((asUTC - date.getTime()) / 60000);
  } catch {
    return null;
  }
}

export function timeDifferenceHours(originTz, destinationTz) {
  const a = timezoneOffsetMinutes(originTz);
  const b = timezoneOffsetMinutes(destinationTz);
  if (a == null || b == null) return null;
  return (b - a) / 60;
}
