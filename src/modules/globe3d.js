const TAU = Math.PI * 2;
const RAD = Math.PI / 180;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => 1 - Math.pow(1 - t, 3);

function latLonToVec(lat, lon, radius = 1) {
  const phi = lat * RAD;
  const lambda = lon * RAD;
  const cp = Math.cos(phi);
  return {
    x: radius * cp * Math.sin(lambda),
    y: radius * Math.sin(phi),
    z: radius * cp * Math.cos(lambda)
  };
}

function normalize(v) {
  const l = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / l, y: v.y / l, z: v.z / l };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function slerp(a, b, t) {
  const na = normalize(a);
  const nb = normalize(b);
  const omega = Math.acos(clamp(dot(na, nb), -1, 1));
  if (omega < 1e-5) return na;
  const so = Math.sin(omega);
  const s1 = Math.sin((1 - t) * omega) / so;
  const s2 = Math.sin(t * omega) / so;
  return normalize({ x: na.x * s1 + nb.x * s2, y: na.y * s1 + nb.y * s2, z: na.z * s1 + nb.z * s2 });
}

function vecToLatLon(v) {
  const n = normalize(v);
  return {
    lat: Math.asin(clamp(n.y, -1, 1)) / RAD,
    lon: Math.atan2(n.x, n.z) / RAD
  };
}

function rotateVec(v, yaw, pitch) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const x1 = cy * v.x + sy * v.z;
  const z1 = -sy * v.x + cy * v.z;
  const y1 = v.y;
  const cx = Math.cos(pitch), sx = Math.sin(pitch);
  return {
    x: x1,
    y: cx * y1 - sx * z1,
    z: sx * y1 + cx * z1
  };
}

function inverseRotateVec(v, yaw, pitch) {
  const cx = Math.cos(-pitch), sx = Math.sin(-pitch);
  const y1 = cx * v.y - sx * v.z;
  const z1 = sx * v.y + cx * v.z;
  const x1 = v.x;
  const cy = Math.cos(-yaw), sy = Math.sin(-yaw);
  return {
    x: cy * x1 + sy * z1,
    y: y1,
    z: -sy * x1 + cy * z1
  };
}

function perspectiveMatrix(fov, aspect, near, far) {
  const f = 1 / Math.tan(fov / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0
  ]);
}

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`3D shader compile failed: ${info}`);
  }
  return shader;
}

function createProgram(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  gl.attachShader(program, compileShader(gl, gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`3D shader link failed: ${info}`);
  }
  return program;
}

function buildSphere(latSegments = 64, lonSegments = 128) {
  const positions = [];
  const uvs = [];
  const indices = [];
  for (let iy = 0; iy <= latSegments; iy++) {
    const lat = -Math.PI / 2 + (iy / latSegments) * Math.PI;
    const cp = Math.cos(lat);
    const sp = Math.sin(lat);
    for (let ix = 0; ix <= lonSegments; ix++) {
      const lon = -Math.PI + (ix / lonSegments) * TAU;
      positions.push(cp * Math.sin(lon), sp, cp * Math.cos(lon));
      uvs.push(ix / lonSegments, 1 - iy / latSegments);
    }
  }
  const row = lonSegments + 1;
  for (let iy = 0; iy < latSegments; iy++) {
    for (let ix = 0; ix < lonSegments; ix++) {
      const a = iy * row + ix;
      const b = a + row;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  return {
    positions: new Float32Array(positions),
    uvs: new Float32Array(uvs),
    indices: new Uint16Array(indices)
  };
}

function ringContainsPoint(pointLon, pointLat, ring) {
  let inside = false;
  let prev = ring[ring.length - 1];
  for (const current of ring) {
    let x1 = prev[0];
    let x2 = current[0];
    while (x1 - pointLon > 180) x1 -= 360;
    while (x1 - pointLon < -180) x1 += 360;
    while (x2 - pointLon > 180) x2 -= 360;
    while (x2 - pointLon < -180) x2 += 360;
    const y1 = prev[1];
    const y2 = current[1];
    const intersects = ((y1 > pointLat) !== (y2 > pointLat)) && (pointLon < ((x2 - x1) * (pointLat - y1)) / ((y2 - y1) || 1e-9) + x1);
    if (intersects) inside = !inside;
    prev = current;
  }
  return inside;
}

function polygonContains(pointLon, pointLat, polygon) {
  if (!polygon?.length || !ringContainsPoint(pointLon, pointLat, polygon[0])) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (ringContainsPoint(pointLon, pointLat, polygon[i])) return false;
  }
  return true;
}

function geometryContains(lon, lat, geometry) {
  if (!geometry) return false;
  if (geometry.type === 'Polygon') return polygonContains(lon, lat, geometry.coordinates);
  if (geometry.type === 'MultiPolygon') return geometry.coordinates.some((polygon) => polygonContains(lon, lat, polygon));
  return false;
}


function geometryBounds(geometry) {
  const points = [];
  const collectPolygon = (polygon) => polygon.forEach((ring) => ring.forEach((point) => points.push(point)));
  if (geometry?.type === 'Polygon') collectPolygon(geometry.coordinates);
  else if (geometry?.type === 'MultiPolygon') geometry.coordinates.forEach(collectPolygon);
  if (!points.length) return null;
  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  for (const [lon, lat] of points) {
    minLat = Math.min(minLat, lat); maxLat = Math.max(maxLat, lat);
    minLon = Math.min(minLon, lon); maxLon = Math.max(maxLon, lon);
  }
  return { minLat, maxLat, minLon, maxLon, crossesDateline: maxLon - minLon > 300 };
}

function drawGeometryPath(ctx, geometry, width, height) {
  const drawPolygon = (polygon) => {
    for (const ring of polygon) {
      let started = false;
      let previousX = null;
      for (const [lon, lat] of ring) {
        const x = ((lon + 180) / 360) * width;
        const y = ((90 - lat) / 180) * height;
        if (!started || (previousX != null && Math.abs(x - previousX) > width / 2)) {
          if (started) ctx.closePath();
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
        previousX = x;
      }
      if (started) ctx.closePath();
    }
  };
  if (geometry.type === 'Polygon') drawPolygon(geometry.coordinates);
  else if (geometry.type === 'MultiPolygon') geometry.coordinates.forEach(drawPolygon);
}

export class Globe3DView {
  constructor(host, { onHover, onLeave, onClick } = {}) {
    this.host = host;
    this.onHover = onHover;
    this.onLeave = onLeave;
    this.onClick = onClick;
    this.geometries = [];
    this.countries = [];
    this.countryByCode = new Map();
    this.places = [];
    this.selectedCountry = null;
    this.route = null;
    this.flightStart = 0;
    this.flightDuration = 4600;
    this.tripType = 'oneway';
    this.yaw = -20 * RAD;
    this.pitch = 18 * RAD;
    this.distance = 3.1;
    this.targetYaw = this.yaw;
    this.targetPitch = this.pitch;
    this.targetDistance = this.distance;
    this.focusAnimation = null;
    this.dragging = false;
    this.pointerDown = null;
    this.lastPointer = null;
    this.hovered = null;
    this.visibleProjectedPoints = [];
    this.activePointers = new Map();
    this.lastPinchDistance = null;
    this.fov = 42 * RAD;
    this.devicePixelRatio = Math.min(2, window.devicePixelRatio || 1);
    this.renderShell();
    this.initWebGL();
    this.bindEvents();
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.resize();
    this.frame = requestAnimationFrame((time) => this.render(time));
  }

  renderShell() {
    this.host.innerHTML = `
      <canvas class="globe3d-webgl" aria-hidden="true"></canvas>
      <canvas class="globe3d-overlay" aria-label="Interactive 3D globe"></canvas>
      <div class="globe3d-help" aria-hidden="true">↔ drag · wheel/pinch zoom</div>
    `;
    this.canvas = this.host.querySelector('.globe3d-webgl');
    this.overlay = this.host.querySelector('.globe3d-overlay');
    this.ctx = this.overlay.getContext('2d');
  }

  initWebGL() {
    const gl = this.canvas.getContext('webgl', { antialias: true, alpha: true, premultipliedAlpha: false });
    if (!gl) throw new Error('WebGL is not available in this browser.');
    this.gl = gl;
    const vertexSource = `
      attribute vec3 aPosition;
      attribute vec2 aUv;
      uniform mat4 uProjection;
      uniform float uYaw;
      uniform float uPitch;
      uniform float uDistance;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        float cy = cos(uYaw); float sy = sin(uYaw);
        vec3 p = vec3(cy * aPosition.x + sy * aPosition.z, aPosition.y, -sy * aPosition.x + cy * aPosition.z);
        float cx = cos(uPitch); float sx = sin(uPitch);
        p = vec3(p.x, cx * p.y - sx * p.z, sx * p.y + cx * p.z);
        vNormal = normalize(p);
        p.z -= uDistance;
        gl_Position = uProjection * vec4(p, 1.0);
        vUv = aUv;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform sampler2D uTexture;
      varying vec2 vUv;
      varying vec3 vNormal;
      void main() {
        vec3 base = texture2D(uTexture, vUv).rgb;
        vec3 lightDir = normalize(vec3(-0.35, 0.45, 0.85));
        float diff = 0.58 + max(dot(normalize(vNormal), lightDir), 0.0) * 0.48;
        float rim = pow(1.0 - max(vNormal.z, 0.0), 2.3);
        vec3 color = base * diff + vec3(0.10, 0.36, 0.60) * rim * 0.35;
        gl_FragColor = vec4(color, 1.0);
      }
    `;
    this.program = createProgram(gl, vertexSource, fragmentSource);
    const mesh = buildSphere();
    this.indexCount = mesh.indices.length;
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.positions, gl.STATIC_DRAW);
    this.uvBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.uvs, gl.STATIC_DRAW);
    this.indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textureCanvas = document.createElement('canvas');
    this.textureCanvas.width = 2048;
    this.textureCanvas.height = 1024;
    this.textureCtx = this.textureCanvas.getContext('2d');
    this.redrawTexture();
  }

  setData({ geometries = [], countries = [], places = [] }) {
    this.geometries = geometries;
    this.geoEntries = geometries.map((g) => ({ ...g, bounds: geometryBounds(g.geometry) }));
    this.countries = countries;
    this.countryByCode = new Map(countries.map((c) => [c.code2, c]));
    this.places = places;
    this.redrawTexture();
  }

  setPlaces(places = []) {
    this.places = places;
  }

  setHelpText(text) {
    const help = this.host.querySelector('.globe3d-help');
    if (help && text) help.textContent = text;
  }

  setSelectedCountry(code2) {
    this.selectedCountry = code2 || null;
    this.redrawTexture();
  }

  setRoute(origin, destination, tripType = 'oneway', { focus = true } = {}) {
    if (!origin || !destination) return;
    this.route = {
      origin: latLonToVec(origin.lat, origin.lon),
      destination: latLonToVec(destination.lat, destination.lon),
      originData: origin,
      destinationData: destination
    };
    this.tripType = tripType;
    this.flightStart = performance.now();
    if (focus) this.focusRoute(origin, destination);
  }

  projectAtCamera(v, yaw, pitch, distance, radius = 1.04) {
    const rotated = rotateVec({ x: v.x * radius, y: v.y * radius, z: v.z * radius }, yaw, pitch);
    const zView = rotated.z - distance;
    if (zView >= -0.05) return null;
    const aspect = Math.max(0.2, (this.width || 1000) / (this.height || 500));
    const f = 1 / Math.tan(this.fov / 2);
    const ndcX = (rotated.x * f / aspect) / -zView;
    const ndcY = (rotated.y * f) / -zView;
    return { x: ndcX, y: ndcY, front: rotated.z > 0 };
  }

  routeCamera(origin, destination) {
    const a = latLonToVec(origin.lat, origin.lon);
    const b = latLonToVec(destination.lat, destination.lon);
    const angular = Math.acos(clamp(dot(normalize(a), normalize(b)), -1, 1));
    // Keep the great-circle corridor centred, with the destination slightly favoured.
    // This prevents short trips (e.g. Seoul → Tokyo) from sitting on the rim of the globe.
    const center = slerp(a, b, angular < 0.35 ? 0.55 : 0.52);
    const ll = vecToLatLon(center);
    const yaw = -ll.lon * RAD;
    const pitch = ll.lat * RAD;

    // Fit both endpoints inside a safe frame. The numerical fit is more reliable than
    // a single angle→zoom formula on wide/short browser canvases.
    let distance = angular < 0.18 ? 2.42 : angular < 0.55 ? 2.58 : 2.72 + angular * 0.42;
    distance = clamp(distance, 2.35, 4.25);
    for (let i = 0; i < 30; i++) {
      const pa = this.projectAtCamera(a, yaw, pitch, distance);
      const pb = this.projectAtCamera(b, yaw, pitch, distance);
      const fits = pa && pb && pa.front && pb.front &&
        Math.abs(pa.x) < 0.72 && Math.abs(pb.x) < 0.72 &&
        Math.abs(pa.y) < 0.66 && Math.abs(pb.y) < 0.66;
      if (fits) break;
      distance += 0.08;
    }
    return { yaw, pitch, distance: clamp(distance, 2.35, 4.6), angular };
  }

  focusRoute(origin, destination) {
    if (!origin || !destination) return;
    const camera = this.routeCamera(origin, destination);
    this.animateCameraTo(camera.yaw, camera.pitch, camera.distance, 1050);
  }

  focusPoint(lat, lon, { zoom = 2.52 } = {}) {
    this.animateCameraTo(-lon * RAD, lat * RAD, zoom, 820);
  }

  focusOrigin() {
    if (!this.route?.originData) return;
    this.focusPoint(this.route.originData.lat, this.route.originData.lon, { zoom: 2.35 });
  }

  focusDestination() {
    if (!this.route?.destinationData) return;
    this.focusPoint(this.route.destinationData.lat, this.route.destinationData.lon, { zoom: 2.28 });
  }

  animateCameraTo(yaw, pitch, distance, duration = 900) {
    let targetYaw = yaw;
    while (targetYaw - this.yaw > Math.PI) targetYaw -= TAU;
    while (targetYaw - this.yaw < -Math.PI) targetYaw += TAU;
    this.focusAnimation = {
      start: performance.now(),
      duration,
      fromYaw: this.yaw,
      fromPitch: this.pitch,
      fromDistance: this.distance,
      toYaw: targetYaw,
      toPitch: clamp(pitch, -1.25, 1.25),
      toDistance: clamp(distance, 2.05, 5)
    };
  }

  replay() {
    if (!this.route) return;
    this.flightStart = performance.now();
    this.focusRoute(this.route.originData, this.route.destinationData);
  }

  resetView() {
    if (this.route?.originData && this.route?.destinationData) {
      this.focusRoute(this.route.originData, this.route.destinationData);
      return;
    }
    this.animateCameraTo(-20 * RAD, 18 * RAD, 3.15, 850);
  }

  worldView() {
    this.animateCameraTo(-20 * RAD, 18 * RAD, 3.85, 900);
  }

  redrawTexture() {
    if (!this.textureCtx || !this.gl) return;
    const ctx = this.textureCtx;
    const width = this.textureCanvas.width;
    const height = this.textureCanvas.height;
    const ocean = ctx.createLinearGradient(0, 0, width, height);
    ocean.addColorStop(0, '#0a3d66');
    ocean.addColorStop(.45, '#0d5f8a');
    ocean.addColorStop(1, '#082c50');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(143,213,240,.15)';
    ctx.lineWidth = 1;
    for (let lon = -150; lon <= 150; lon += 30) {
      const x = ((lon + 180) / 360) * width;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let lat = -60; lat <= 60; lat += 30) {
      const y = ((90 - lat) / 180) * height;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    for (const g of this.geometries) {
      ctx.beginPath();
      drawGeometryPath(ctx, g.geometry, width, height);
      ctx.fillStyle = g.code2 === this.selectedCountry ? '#f8ca58' : '#54a86f';
      ctx.strokeStyle = g.code2 === this.selectedCountry ? '#fff2a6' : 'rgba(224,246,222,.45)';
      ctx.lineWidth = g.code2 === this.selectedCountry ? 3 : 1;
      ctx.fill('evenodd');
      ctx.stroke();
    }

    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textureCanvas);
    gl.generateMipmap(gl.TEXTURE_2D);
  }

  bindEvents() {
    const target = this.overlay;
    target.addEventListener('pointerdown', (event) => {
      target.setPointerCapture?.(event.pointerId);
      this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.dragging = true;
      this.pointerDown = { x: event.clientX, y: event.clientY, time: performance.now() };
      this.lastPointer = { x: event.clientX, y: event.clientY };
      this.focusAnimation = null;
    });
    target.addEventListener('pointermove', (event) => {
      if (this.activePointers.has(event.pointerId)) this.activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.dragging && this.activePointers.size >= 2) {
        const pts = [...this.activePointers.values()].slice(0, 2);
        const pinch = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        if (this.lastPinchDistance != null) {
          const delta = pinch - this.lastPinchDistance;
          this.distance = clamp(this.distance - delta * 0.008, 2.05, 5);
        }
        this.lastPinchDistance = pinch;
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.hideHover();
        return;
      }
      this.lastPinchDistance = null;
      if (this.dragging && this.lastPointer) {
        const dx = event.clientX - this.lastPointer.x;
        const dy = event.clientY - this.lastPointer.y;
        this.yaw += dx * 0.006;
        this.pitch = clamp(this.pitch + dy * 0.005, -1.32, 1.32);
        this.lastPointer = { x: event.clientX, y: event.clientY };
        this.hideHover();
        return;
      }
      this.updateHover(event);
    });
    const end = (event) => {
      const wasDragging = this.dragging;
      this.activePointers.delete(event.pointerId);
      this.dragging = this.activePointers.size > 0;
      if (!this.dragging) this.lastPointer = null;
      this.lastPinchDistance = null;
      const down = this.pointerDown;
      this.pointerDown = null;
      if (this.activePointers.size > 0) return;
      if (!wasDragging || !down) return;
      const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
      if (moved < 7 && performance.now() - down.time < 700) this.handleClick(event);
    };
    target.addEventListener('pointerup', end);
    target.addEventListener('pointercancel', (event) => { this.activePointers.delete(event.pointerId); this.dragging = this.activePointers.size > 0; this.lastPointer = null; this.lastPinchDistance = null; });
    target.addEventListener('pointerleave', () => { if (!this.dragging) this.hideHover(); });
    target.addEventListener('wheel', (event) => {
      event.preventDefault();
      this.focusAnimation = null;
      this.distance = clamp(this.distance + event.deltaY * 0.0025, 2.05, 5);
    }, { passive: false });
  }

  resize() {
    const rect = this.host.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width * this.devicePixelRatio));
    const height = Math.max(1, Math.round(rect.height * this.devicePixelRatio));
    for (const canvas of [this.canvas, this.overlay]) {
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }
    this.width = width;
    this.height = height;
    this.cssWidth = rect.width;
    this.cssHeight = rect.height;
  }

  projectObjectVector(v, radius = 1.03) {
    const rotated = rotateVec({ x: v.x * radius, y: v.y * radius, z: v.z * radius }, this.yaw, this.pitch);
    const zView = rotated.z - this.distance;
    if (zView >= -0.05) return null;
    const aspect = this.width / this.height;
    const f = 1 / Math.tan(this.fov / 2);
    const ndcX = (rotated.x * f / aspect) / -zView;
    const ndcY = (rotated.y * f) / -zView;
    return {
      x: (ndcX * .5 + .5) * this.width,
      y: (-ndcY * .5 + .5) * this.height,
      front: rotated.z > -0.08,
      depth: rotated.z
    };
  }

  spherePointFromPointer(clientX, clientY) {
    const rect = this.overlay.getBoundingClientRect();
    const xCss = clientX - rect.left;
    const yCss = clientY - rect.top;
    const ndcX = (xCss / rect.width) * 2 - 1;
    const ndcY = 1 - (yCss / rect.height) * 2;
    const aspect = rect.width / rect.height;
    const tan = Math.tan(this.fov / 2);
    let ray = normalize({ x: ndcX * aspect * tan, y: ndcY * tan, z: -1 });
    const center = { x: 0, y: 0, z: -this.distance };
    const oc = { x: -center.x, y: -center.y, z: -center.z };
    const b = 2 * dot(ray, oc);
    const c = dot(oc, oc) - 1;
    const disc = b * b - 4 * c;
    if (disc < 0) return null;
    const root = Math.sqrt(disc);
    let t = (-b - root) / 2;
    if (t < 0) t = (-b + root) / 2;
    if (t < 0) return null;
    const viewPoint = { x: ray.x * t, y: ray.y * t, z: ray.z * t };
    const rotated = { x: viewPoint.x, y: viewPoint.y, z: viewPoint.z + this.distance };
    const object = inverseRotateVec(rotated, this.yaw, this.pitch);
    return vecToLatLon(object);
  }

  countryAtLatLon(lat, lon) {
    const entries = this.geoEntries || this.geometries;
    for (const g of entries) {
      const b = g.bounds;
      if (b && (lat < b.minLat || lat > b.maxLat)) continue;
      if (b && !b.crossesDateline && (lon < b.minLon || lon > b.maxLon)) continue;
      if (geometryContains(lon, lat, g.geometry)) {
        return this.countryByCode.get(g.code2) || { code2: g.code2, name: g.name };
      }
    }
    return null;
  }

  updateHover(event) {
    const rect = this.overlay.getBoundingClientRect();
    const px = (event.clientX - rect.left) * this.devicePixelRatio;
    const py = (event.clientY - rect.top) * this.devicePixelRatio;
    let best = null;
    let bestDistance = 18 * this.devicePixelRatio;
    for (const item of this.visibleProjectedPoints) {
      const d = Math.hypot(item.x - px, item.y - py);
      if (d < bestDistance) { best = item; bestDistance = d; }
    }
    if (best) {
      this.setHovered({ kind: 'place', data: best.data }, event.clientX - rect.left, event.clientY - rect.top, event.clientX, event.clientY);
      return;
    }
    const ll = this.spherePointFromPointer(event.clientX, event.clientY);
    if (!ll) { this.hideHover(); return; }
    const country = this.countryAtLatLon(ll.lat, ll.lon);
    if (country) this.setHovered({ kind: 'country', data: country }, event.clientX - rect.left, event.clientY - rect.top, event.clientX, event.clientY);
    else this.hideHover();
  }

  setHovered(item, x, y, clientX = x, clientY = y) {
    const same = this.hovered?.kind === item.kind && (this.hovered?.data?.id || this.hovered?.data?.code2) === (item.data?.id || item.data?.code2);
    this.hovered = item;
    this.overlay.style.cursor = 'pointer';
    this.onHover?.(item, { x, y, clientX, clientY }, same);
  }

  hideHover() {
    if (!this.hovered) return;
    this.hovered = null;
    this.overlay.style.cursor = this.dragging ? 'grabbing' : 'grab';
    this.onLeave?.();
  }

  handleClick(event) {
    this.updateHover(event);
    if (this.hovered) this.onClick?.(this.hovered);
  }

  drawOverlay(time) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    ctx.clearRect(0, 0, w, h);
    this.visibleProjectedPoints = [];
    const markerPositions = [];

    const scale = this.devicePixelRatio;
    const drawMarker = (data, color, size = 5, interactive = true) => {
      const projected = this.projectObjectVector(latLonToVec(data.lat, data.lon), 1.025);
      if (!projected || !projected.front) return;
      if (interactive) {
        const spacing = (data.type === 'landmark' ? 9 : data.type === 'capital' ? 7 : 8) * scale;
        if (markerPositions.some((p) => Math.hypot(p.x - projected.x, p.y - projected.y) < spacing)) return;
        markerPositions.push(projected);
      }
      ctx.save();
      ctx.beginPath();
      ctx.arc(projected.x, projected.y, size * scale, 0, TAU);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 9 * scale;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeStyle = 'rgba(255,255,255,.92)';
      ctx.stroke();
      ctx.restore();
      if (interactive) this.visibleProjectedPoints.push({ ...projected, data });
    };

    const drawRouteLabel = (projected, text, accent) => {
      if (!projected?.front || !text) return;
      ctx.save();
      ctx.font = `${11 * scale}px system-ui, sans-serif`;
      const padX = 8 * scale;
      const boxH = 24 * scale;
      const textW = ctx.measureText(text).width;
      const boxW = textW + padX * 2;
      let x = projected.x + 10 * scale;
      let y = projected.y - 34 * scale;
      x = clamp(x, 6 * scale, w - boxW - 6 * scale);
      y = clamp(y, 6 * scale, h - boxH - 6 * scale);
      ctx.fillStyle = 'rgba(8,25,40,.86)';
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x, y, boxW, boxH, 8 * scale);
      else ctx.rect(x, y, boxW, boxH);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f4fbff';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x + padX, y + boxH / 2);
      ctx.restore();
    };

    for (const place of this.places) {
      const selected = place.countryCode === this.selectedCountry;
      const originCountry = this.route?.originData?.countryCode;
      const routeOrigin = place.countryCode && place.countryCode === originCountry;
      // Keep the globe readable: selected-country landmarks are the primary exploration layer.
      // Other capitals/cities appear only when they are directly relevant to the current route/search.
      if (place.type === 'capital' && !selected && !routeOrigin && !place.isSearchedPoint) continue;
      if (place.type === 'city' && !selected && !routeOrigin && !place.isSearchedPoint) continue;
      if (place.type === 'landmark' && !selected && !place.isSearchedPoint) continue;
      const color = place.type === 'landmark' ? '#ffc24b' : place.type === 'capital' ? '#b3ee72' : '#6fd8ff';
      const size = place.type === 'landmark' ? 4.8 : place.type === 'capital' ? 3.0 : 3.5;
      drawMarker(place, color, size);
    }

    if (this.route) {
      const originProjection = this.projectObjectVector(this.route.origin, 1.04);
      const destinationProjection = this.projectObjectVector(this.route.destination, 1.04);
      const routePoints = [];
      const steps = 80;
      for (let i = 0; i <= steps; i++) {
        const tt = i / steps;
        const lift = 1.035 + Math.sin(Math.PI * tt) * 0.34;
        const point = slerp(this.route.origin, this.route.destination, tt);
        const projected = this.projectObjectVector(point, lift);
        if (projected) routePoints.push(projected);
      }
      if (routePoints.length > 1) {
        ctx.save();
        ctx.beginPath();
        routePoints.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.strokeStyle = 'rgba(99,211,255,.95)';
        ctx.lineWidth = 3.2 * scale;
        ctx.shadowColor = '#5dd4ff';
        ctx.shadowBlur = 13 * scale;
        ctx.stroke();
        ctx.restore();
      }
      if (originProjection?.front) {
        drawMarker(this.route.originData, '#45a5ff', 6.5, false);
        drawRouteLabel(originProjection, this.route.originData.displayLabel || this.route.originData.nameKo || this.route.originData.name || 'Start', '#45a5ff');
      }
      if (destinationProjection?.front) {
        drawMarker(this.route.destinationData, '#ff6f61', 7, false);
        drawRouteLabel(destinationProjection, this.route.destinationData.displayLabel || this.route.destinationData.name || 'Destination', '#ff6f61');
      }

      const elapsed = clamp((time - this.flightStart) / this.flightDuration, 0, 1);
      let flightT = ease(elapsed);
      if (this.tripType === 'roundtrip') flightT = flightT < .5 ? flightT * 2 : 2 - flightT * 2;
      const lift = 1.035 + Math.sin(Math.PI * flightT) * 0.34;
      const plane3 = slerp(this.route.origin, this.route.destination, flightT);
      const plane2 = this.projectObjectVector(plane3, lift);
      if (plane2) {
        ctx.save();
        ctx.translate(plane2.x, plane2.y);
        ctx.font = `${24 * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,.4)';
        ctx.shadowBlur = 7 * scale;
        ctx.fillText('✈️', 0, 0);
        ctx.restore();
      }
    }
  }

  render(time) {
    if (this.focusAnimation) {
      const a = this.focusAnimation;
      const p = clamp((time - a.start) / a.duration, 0, 1);
      const e = ease(p);
      this.yaw = lerp(a.fromYaw, a.toYaw, e);
      this.pitch = lerp(a.fromPitch, a.toPitch, e);
      this.distance = lerp(a.fromDistance, a.toDistance, e);
      if (p >= 1) this.focusAnimation = null;
    }

    const gl = this.gl;
    if (gl && this.width && this.height) {
      gl.viewport(0, 0, this.width, this.height);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.CULL_FACE);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.useProgram(this.program);
      const posLoc = gl.getAttribLocation(this.program, 'aPosition');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 3, gl.FLOAT, false, 0, 0);
      const uvLoc = gl.getAttribLocation(this.program, 'aUv');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer);
      gl.enableVertexAttribArray(uvLoc);
      gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.uniformMatrix4fv(gl.getUniformLocation(this.program, 'uProjection'), false, perspectiveMatrix(this.fov, this.width / this.height, .1, 20));
      gl.uniform1f(gl.getUniformLocation(this.program, 'uYaw'), this.yaw);
      gl.uniform1f(gl.getUniformLocation(this.program, 'uPitch'), this.pitch);
      gl.uniform1f(gl.getUniformLocation(this.program, 'uDistance'), this.distance);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.uniform1i(gl.getUniformLocation(this.program, 'uTexture'), 0);
      gl.drawElements(gl.TRIANGLES, this.indexCount, gl.UNSIGNED_SHORT, 0);
      this.drawOverlay(time);
    }
    this.frame = requestAnimationFrame((nextTime) => this.render(nextTime));
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
  }
}
