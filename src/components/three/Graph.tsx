import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { fxAmount, store } from '../../lib/store';
import { fieldColor, live } from './keyframes';

const RADIUS = 1.45;
// HDR colours (values above 1) so bloom picks them up. Cyan = security, violet = AI.
// field colours; refreshed every frame so the attack / defend toggle can recolour them
const CYAN = [0.0, 0.9, 1.0];
const VIOLET = [0.62, 0.32, 1.0];
const RING_A = new THREE.Color('#00E5FF');
const RING_B = new THREE.Color('#7C3AED');
const RING_A_ATTACK = new THREE.Color('#ff2a4a');
const RING_B_ATTACK = new THREE.Color('#ff6a10');

// Small seeded RNG so the graph is identical on every visit.
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softDot() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.3, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

type Adj = { edge: number; other: number }[][];

/**
 * Builds the graph once:
 *  - a sphere layout with nearest-neighbour edges (set A)
 *  - a split layout: cyan nodes on a mesh-like grid, violet nodes in
 *    neural-net layers, each with its own edges plus a few bridges (set B)
 */
function buildGraph(n: number, featureFields: number[]) {
  const r = rng(23);
  const field = new Uint8Array(n); // 0 = security (cyan), 1 = AI (violet)
  const sphere = new Float32Array(n * 3);
  const split = new Float32Array(n * 3); // position inside its own cluster
  const loose = new Float32Array(n * 3);
  const phase = new Float32Array(n);
  const size = new Float32Array(n);
  const scatter = new Float32Array(n * 3); // where each node starts in the opening shot
  const delay = new Float32Array(n);

  const surface = Math.floor(n * 0.76);
  for (let i = 0; i < n; i++) {
    field[i] = i % 2;
    phase[i] = r() * Math.PI * 2;
    size[i] = 0.7 + r() * 0.8;
    let x: number, y: number, z: number;
    if (i < surface) {
      // Fibonacci sphere with a little jitter
      const u = 1 - (2 * (i + 0.5)) / surface;
      const th = i * 2.399963 + (r() - 0.5) * 0.25;
      const s = Math.sqrt(1 - u * u);
      const rad = RADIUS * (0.97 + r() * 0.06);
      x = s * Math.cos(th) * rad;
      y = u * rad;
      z = s * Math.sin(th) * rad;
    } else {
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      const rad = RADIUS * (0.25 + r() * 0.55);
      x = s * Math.cos(th) * rad;
      y = u * rad;
      z = s * Math.sin(th) * rad;
    }
    sphere.set([x, y, z], i * 3);
    const lu = r() * 2 - 1;
    const lth = r() * Math.PI * 2;
    const ls = Math.sqrt(1 - lu * lu);
    const amt = 0.5 + r() * 1.4;
    loose.set([ls * Math.cos(lth) * amt, lu * amt, ls * Math.sin(lth) * amt], i * 3);
    const far = 5 + r() * 8;
    scatter.set([ls * Math.sin(lth) * far * 1.6, (r() - 0.5) * far, lu * far - 4], i * 3);
    delay[i] = r();
  }

  // ---- set A: each node links to its 3 nearest neighbours on the sphere
  const pairs: number[] = [];
  const seen = new Set<number>();
  const add = (a: number, b: number) => {
    const key = Math.min(a, b) * n + Math.max(a, b);
    if (a === b || seen.has(key)) return;
    seen.add(key);
    pairs.push(a, b);
  };
  for (let i = 0; i < n; i++) {
    const d: [number, number][] = [];
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const dx = sphere[i * 3] - sphere[j * 3];
      const dy = sphere[i * 3 + 1] - sphere[j * 3 + 1];
      const dz = sphere[i * 3 + 2] - sphere[j * 3 + 2];
      d.push([dx * dx + dy * dy + dz * dz, j]);
    }
    d.sort((p, q) => p[0] - q[0]);
    for (let k = 0; k < 3; k++) add(i, d[k][1]);
  }
  const countA = pairs.length / 2;

  // ---- set B: split layout
  seen.clear();
  const cyan: number[] = [];
  const violet: number[] = [];
  for (let i = 0; i < n; i++) (field[i] === 0 ? cyan : violet).push(i);

  // cyan: a slightly irregular grid, like a mesh network
  const cols = Math.ceil(Math.sqrt(cyan.length));
  const rows = Math.ceil(cyan.length / cols);
  const step = 1.7 / Math.max(1, cols - 1);
  cyan.forEach((id, k) => {
    const c = k % cols;
    const rw = Math.floor(k / cols);
    split.set(
      [(c - (cols - 1) / 2) * step + (r() - 0.5) * 0.07, ((rows - 1) / 2 - rw) * step + (r() - 0.5) * 0.07, (r() - 0.5) * 0.35],
      id * 3,
    );
    if (c < cols - 1 && k + 1 < cyan.length) add(id, cyan[k + 1]);
    if (k + cols < cyan.length) add(id, cyan[k + cols]);
  });

  // violet: columns of neurons, each wired to the next layer
  const shape = [0.13, 0.22, 0.3, 0.22, 0.13];
  const layers: number[][] = [];
  let used = 0;
  shape.forEach((f, l) => {
    const count = l === shape.length - 1 ? violet.length - used : Math.max(2, Math.round(violet.length * f));
    layers.push(violet.slice(used, used + count));
    used += count;
  });
  const tallest = Math.max(...layers.map((l) => l.length));
  const vstep = 1.75 / Math.max(1, tallest - 1);
  layers.forEach((layer, l) => {
    layer.forEach((id, j) => {
      split.set([(l - (layers.length - 1) / 2) * 0.43, (j - (layer.length - 1) / 2) * vstep, (r() - 0.5) * 0.25], id * 3);
      const next = layers[l + 1];
      if (!next?.length) return;
      const near = Math.round((j / Math.max(1, layer.length - 1)) * (next.length - 1));
      add(id, next[near]);
      add(id, next[Math.floor(r() * next.length)]);
      if (r() > 0.5) add(id, next[Math.floor(r() * next.length)]);
    });
  });

  // a few bridges between the two clusters
  const edgeCol = cyan.filter((_, k) => k % cols === cols - 1);
  for (let b = 0; b < 4; b++) {
    const from = edgeCol[Math.floor(((b + 0.5) / 4) * edgeCol.length)];
    const to = layers[0][Math.floor(((b + 0.5) / 4) * layers[0].length)];
    if (from !== undefined && to !== undefined) add(from, to);
  }

  const edges = Uint16Array.from(pairs);
  const count = edges.length / 2;

  const adjA: Adj = Array.from({ length: n }, () => []);
  const adjB: Adj = Array.from({ length: n }, () => []);
  for (let e = 0; e < count; e++) {
    const a = edges[e * 2];
    const b = edges[e * 2 + 1];
    const adj = e < countA ? adjA : adjB;
    adj[a].push({ edge: e, other: b });
    adj[b].push({ edge: e, other: a });
  }

  // Article nodes: one bigger, clickable node per article, spread around the
  // sphere and matching the article's field colour.
  const featureSlot = new Int16Array(n).fill(-1);
  const features: number[] = [];
  featureFields.forEach((f, k) => {
    let idx = Math.floor(surface * (0.12 + (0.72 * (k + 0.5)) / featureFields.length));
    while (idx < surface - 1 && (field[idx] !== f || featureSlot[idx] !== -1)) idx += 1;
    featureSlot[idx] = k;
    features.push(idx);
    size[idx] = 2.2;
  });

  return { n, field, sphere, split, loose, phase, size, scatter, delay, edges, count, countA, adjA, adjB, cyan, features, featureSlot };
}

type Pulse = { edge: number; from: number; to: number; t: number; speed: number; field: number };

/**
 * The hero object: a glowing graph that reads as both a computer network and
 * a neural network. Signals travel along its edges, it follows the scroll
 * (see keyframes.ts), splits into two clusters, and lights up near the cursor.
 */
export function Graph({
  nodes,
  pulses: pulseCount,
  reduced,
  featureFields,
}: {
  nodes: number;
  pulses: number;
  reduced: boolean;
  /** One entry per article: 0 = security, 1 = AI. Each becomes a clickable node. */
  featureFields: number[];
}) {
  const g = useMemo(() => buildGraph(nodes, featureFields), [nodes, featureFields]);
  const dot = useMemo(softDot, []);

  const group = useRef<THREE.Group>(null!);
  const nodeMesh = useRef<THREE.InstancedMesh>(null!);
  const lines = useRef<THREE.LineSegments>(null!);
  const pulsePoints = useRef<THREE.Points>(null!);
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);

  const ripples = useRef<THREE.Group>(null!);
  const tilt = useRef({ x: 0, y: 0 });
  const introStart = useRef(-1);
  const idleSpin = useRef(0);

  // Working buffers, allocated once.
  const buf = useMemo(() => {
    const pos = new Float32Array(g.n * 3);
    const heat = new Float32Array(g.n);
    const edgePos = new Float32Array(g.count * 6);
    const edgeCol = new Float32Array(g.count * 6);
    const pulsePos = new Float32Array(pulseCount * 3);
    const pulseCol = new Float32Array(pulseCount * 3);
    const r = rng(5);
    const list: Pulse[] = Array.from({ length: pulseCount }, () => {
      const e = Math.floor(r() * g.countA);
      return { edge: e, from: g.edges[e * 2], to: g.edges[e * 2 + 1], t: r(), speed: 0.7 + r() * 0.9, field: r() > 0.5 ? 1 : 0 };
    });
    return { pos, heat, edgePos, edgeCol, pulsePos, pulseCol, list };
  }, [g, pulseCount]);

  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), v: new THREE.Vector3(), c: new THREE.Color(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), []);

  const lineGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buf.edgePos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(buf.edgeCol, 3).setUsage(THREE.DynamicDrawUsage));
    return geo;
  }, [buf]);
  const pulseGeo = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buf.pulsePos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute('color', new THREE.BufferAttribute(buf.pulseCol, 3).setUsage(THREE.DynamicDrawUsage));
    return geo;
  }, [buf]);
  useEffect(() => () => {
    lineGeo.dispose();
    pulseGeo.dispose();
  }, [lineGeo, pulseGeo]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const c = live.kf;
    const fly = live.fly;

    const t = reduced ? 0 : state.clock.elapsedTime;
    const vp = state.viewport;
    const narrow = vp.aspect < 1;
    const scale = c.scale * (narrow ? 0.62 : 1);

    // ---- opening shot: nodes fly in from the dark, then edges and pulses switch on
    let intro = 1;
    if (!reduced) {
      if (introStart.current < 0 && store.introGo) introStart.current = state.clock.elapsedTime;
      intro = introStart.current < 0 ? 0 : Math.min(1, (state.clock.elapsedTime - introStart.current) / 2.8);
    }
    const introEdges = Math.min(1, Math.max(0, (intro - 0.55) / 0.35));
    const introPulses = Math.min(1, Math.max(0, (intro - 0.8) / 0.2));
    // the graph fades out while the camera is inside the tunnel
    const dim = c.dim * (1 - fly) * (1 - fly);
    fieldColor(0, CYAN);
    fieldColor(1, VIOLET);
    // easter egg: a pulse burst when the email is copied
    const now = performance.now();
    const burst = reduced ? 0 : fxAmount(store.fx.burst, 1.2, now);

    // ---- place the whole graph and lean it toward the mouse
    const grp = group.current;
    grp.position.set(c.x * vp.width * (narrow ? 0.4 : 1), (c.y + (narrow ? 0.1 : 0)) * vp.height, c.z - (narrow ? 1.5 : 0));
    grp.scale.setScalar(scale);
    const kt = 1 - Math.exp(-dt * 4);
    tilt.current.x += (-store.mouse.y * 0.22 - tilt.current.x) * kt;
    tilt.current.y += (store.mouse.x * 0.32 - tilt.current.y) * kt;
    grp.rotation.set(0.18 + tilt.current.x, tilt.current.y, 0);
    grp.updateMatrixWorld();

    // ---- node positions: spinning sphere <-> two flat clusters, plus looseness
    const s = c.split * c.split * (3 - 2 * c.split);
    // dragging in the hero adds rotation; it spins down and rights itself when released
    const drag = store.drag;
    if (!drag.active) {
      drag.yaw += drag.velocity * dt;
      drag.velocity *= Math.exp(-dt * 2.2);
      drag.pitch *= Math.exp(-dt * 0.7);
    }
    // the slow idle spin pauses while a card is open, so the card is easy to click
    if (!reduced && !store.hold && !drag.active) idleSpin.current += dt * 0.12;
    const angle = idleSpin.current + c.spin + drag.yaw;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const cosP = Math.cos(drag.pitch);
    const sinP = Math.sin(drag.pitch);
    // cluster separation in local units; on narrow screens the clusters stack
    const sepX = narrow ? 0 : (c.sep * vp.width) / Math.max(scale, 0.01);
    const sepY = narrow ? (0.17 * s * vp.height) / Math.max(scale, 0.01) : 0;
    const { pos, heat } = buf;
    const aspect = vp.aspect;
    const useHeat = store.mouse.active && !reduced;
    // article nodes and hover details are only live when the whole sphere is up front
    const interactive = intro >= 1 && store.page === 'home' && c.split < 0.05 && c.spread < 0.05 && c.dim > 0.92 && c.z > -0.5 && fly < 0.05;
    const sw = state.size.width;
    const sh = state.size.height;
    let hoverIndex = -1;
    let hoverHeat = 0.5;

    // one cyan node raises an alert every few seconds while the clusters are apart
    const cycle = t / 5;
    const alertIdx = g.cyan[(Math.floor(cycle) * 7) % g.cyan.length];
    const alertPhase = cycle - Math.floor(cycle);
    const flare = alertPhase < 0.7 ? Math.sin((Math.PI * alertPhase) / 0.7) * s : 0;

    for (let i = 0; i < g.n; i++) {
      const i3 = i * 3;
      const sx = g.sphere[i3];
      const sz = g.sphere[i3 + 2];
      const rx = sx * cos + sz * sin;
      const rz0 = -sx * sin + sz * cos;
      const ry = g.sphere[i3 + 1] * cosP - rz0 * sinP;
      const rz = g.sphere[i3 + 1] * sinP + rz0 * cosP;
      const side = g.field[i] === 0 ? -1 : 1;
      const bob = Math.sin(t * 0.7 + g.phase[i]) * 0.03;
      const breathe = 1 + 0.025 * Math.sin(t * 0.9 + g.phase[i]);
      let px = (rx + (g.split[i3] + side * sepX - rx) * s) * breathe + g.loose[i3] * c.spread;
      let py = (ry + (g.split[i3 + 1] - side * sepY - ry) * s) * breathe + bob + g.loose[i3 + 1] * c.spread;
      let pz = (rz + (g.split[i3 + 2] - rz) * s) * breathe + g.loose[i3 + 2] * c.spread;
      let arrive = 1;
      if (intro < 1) {
        const e = Math.min(1, Math.max(0, intro * 1.7 - g.delay[i] * 0.7));
        arrive = 1 - (1 - e) ** 3;
        px = g.scatter[i3] + (px - g.scatter[i3]) * arrive;
        py = g.scatter[i3 + 1] + (py - g.scatter[i3 + 1]) * arrive;
        pz = g.scatter[i3 + 2] + (pz - g.scatter[i3 + 2]) * arrive;
      }
      pos[i3] = px;
      pos[i3 + 1] = py;
      pos[i3 + 2] = pz;

      // where this node is on screen, and how close to the cursor
      const slot = g.featureSlot[i];
      let h = 0;
      if (useHeat || slot >= 0) {
        tmp.v.set(px, py, pz).applyMatrix4(grp.matrixWorld).project(state.camera);
        if (useHeat) {
          const d = Math.hypot((tmp.v.x - store.mouse.x) * aspect, tmp.v.y - store.mouse.y);
          h = Math.max(0, 1 - d / 0.34);
          h *= h;
          if (interactive && slot < 0 && h > hoverHeat) {
            hoverHeat = h;
            hoverIndex = i;
            store.hover.x = (tmp.v.x * 0.5 + 0.5) * sw;
            store.hover.y = (-tmp.v.y * 0.5 + 0.5) * sh;
          }
        }
        if (slot >= 0) {
          const f = (store.features[slot] ??= { x: 0, y: 0, show: false });
          f.x = (tmp.v.x * 0.5 + 0.5) * sw;
          f.y = (-tmp.v.y * 0.5 + 0.5) * sh;
          f.show = interactive && rz > -0.35; // hide the ones on the far side
        }
      }
      heat[i] += (h - heat[i]) * (1 - Math.exp(-dt * 9));

      const col = g.field[i] === 0 ? CYAN : VIOLET;
      const feature = slot >= 0 ? 1.5 + 0.35 * Math.sin(t * 2.2 + g.phase[i]) : 1;
      const bright = dim * (0.35 + 0.65 * arrive) * (g.field[i] === 0 ? 1.25 : 1.05) * (1 + heat[i] * 2.2) * feature * (1 + burst * 0.7);
      const alert = i === alertIdx ? flare : 0;
      tmp.s.setScalar(g.size[i] * (1 + heat[i] * 1.3) * (1 + alert * 1.6));
      tmp.m.compose(tmp.v.set(px, py, pz), tmp.q, tmp.s);
      nodeMesh.current.setMatrixAt(i, tmp.m);
      // an alerting node burns warm instead of cyan
      nodeMesh.current.setColorAt(
        i,
        tmp.c.setRGB(
          (col[0] + (1.7 - col[0]) * alert) * bright,
          (col[1] + (0.75 - col[1]) * alert) * bright,
          (col[2] + (0.45 - col[2]) * alert) * bright,
        ),
      );
    }
    nodeMesh.current.instanceMatrix.needsUpdate = true;
    if (nodeMesh.current.instanceColor) nodeMesh.current.instanceColor.needsUpdate = true;
    store.hover.index = hoverIndex;
    if (hoverIndex >= 0) store.hover.field = g.field[hoverIndex];

    // ripples spreading from the alerting node
    const a3 = alertIdx * 3;
    ripples.current.position.set(pos[a3], pos[a3 + 1], pos[a3 + 2] + 0.01);
    for (let k = 0; k < ripples.current.children.length; k++) {
      const ring = ripples.current.children[k] as THREE.Mesh;
      const grow = (alertPhase * 1.8 + k / 3) % 1;
      ring.scale.setScalar(0.06 + grow * 0.55);
      (ring.material as THREE.MeshBasicMaterial).opacity = (1 - grow) * flare * dim * 0.75;
    }

    // ---- edges: set A fades out as set B fades in
    const { edgePos, edgeCol } = buf;
    for (let e = 0; e < g.count; e++) {
      const a = g.edges[e * 2];
      const b = g.edges[e * 2 + 1];
      const a3 = a * 3;
      const b3 = b * 3;
      const e6 = e * 6;
      edgePos[e6] = pos[a3];
      edgePos[e6 + 1] = pos[a3 + 1];
      edgePos[e6 + 2] = pos[a3 + 2];
      edgePos[e6 + 3] = pos[b3];
      edgePos[e6 + 4] = pos[b3 + 1];
      edgePos[e6 + 5] = pos[b3 + 2];
      const len = Math.hypot(pos[a3] - pos[b3], pos[a3 + 1] - pos[b3 + 1], pos[a3 + 2] - pos[b3 + 2]);
      const setAlpha = e < g.countA ? 1 - s : s;
      const fade = Math.min(1, Math.max(0.12, 1.5 - len / 1.1)); // long edges fade
      const alpha = setAlpha * fade * dim * introEdges * (0.3 + 1.4 * Math.max(heat[a], heat[b]));
      const ca = g.field[a] === 0 ? CYAN : VIOLET;
      const cb = g.field[b] === 0 ? CYAN : VIOLET;
      edgeCol[e6] = ca[0] * alpha;
      edgeCol[e6 + 1] = ca[1] * alpha;
      edgeCol[e6 + 2] = ca[2] * alpha;
      edgeCol[e6 + 3] = cb[0] * alpha;
      edgeCol[e6 + 4] = cb[1] * alpha;
      edgeCol[e6 + 5] = cb[2] * alpha;
    }
    lineGeo.attributes.position.needsUpdate = true;
    lineGeo.attributes.color.needsUpdate = true;

    // ---- signal pulses hopping from node to node
    const { pulsePos, pulseCol, list } = buf;
    const useB = s > 0.5;
    const adj = useB ? g.adjB : g.adjA;
    for (let p = 0; p < list.length; p++) {
      const pu = list[p];
      const inB = pu.edge >= g.countA;
      if (inB !== useB && (inB ? s : 1 - s) < 0.08) {
        // its edge set has faded out: jump onto the visible one
        const e = useB ? g.countA + Math.floor(Math.random() * (g.count - g.countA)) : Math.floor(Math.random() * g.countA);
        pu.edge = e;
        pu.from = g.edges[e * 2];
        pu.to = g.edges[e * 2 + 1];
        pu.t = Math.random();
      }
      if (!reduced) pu.t += dt * pu.speed * c.pulse * 1.3 * (1 + burst * 3);
      if (pu.t >= 1) {
        // passing through a node flips the signal to the other field's colour
        pu.field = g.field[pu.to] === 0 ? 1 : 0;
        let options = adj[pu.to];
        if (useB && g.field[pu.to] === 1) {
          // in the neural cluster, signals only travel forward through the layers
          const x = g.split[pu.to * 3];
          options = options.filter((o) => g.field[o.other] === 1 && g.split[o.other * 3] > x + 0.05);
        }
        if (options.length) {
          let pick = options[Math.floor(Math.random() * options.length)];
          if (pick.other === pu.from && options.length > 1) pick = options[Math.floor(Math.random() * options.length)];
          pu.from = pu.to;
          pu.to = pick.other;
          pu.edge = pick.edge;
        } else {
          // dead end (the output layer): start again on a random edge
          const e = useB ? g.countA + Math.floor(Math.random() * (g.count - g.countA)) : Math.floor(Math.random() * g.countA);
          pu.edge = e;
          pu.from = g.edges[e * 2];
          pu.to = g.edges[e * 2 + 1];
        }
        pu.t = 0;
      }
      const f3 = pu.from * 3;
      const t3 = pu.to * 3;
      const p3 = p * 3;
      pulsePos[p3] = pos[f3] + (pos[t3] - pos[f3]) * pu.t;
      pulsePos[p3 + 1] = pos[f3 + 1] + (pos[t3 + 1] - pos[f3 + 1]) * pu.t;
      pulsePos[p3 + 2] = pos[f3 + 2] + (pos[t3 + 2] - pos[f3 + 2]) * pu.t;
      const col = pu.field === 0 ? CYAN : VIOLET;
      const bright = (pu.edge >= g.countA ? s : 1 - s) * dim * introPulses * (2.6 + 0.5 * c.pulse) * (1 + burst * 0.8);
      pulseCol[p3] = (col[0] * 0.75 + 0.25) * bright;
      pulseCol[p3 + 1] = (col[1] * 0.75 + 0.25) * bright;
      pulseCol[p3 + 2] = (col[2] * 0.75 + 0.25) * bright;
    }
    pulseGeo.attributes.position.needsUpdate = true;
    pulseGeo.attributes.color.needsUpdate = true;

    // ---- perimeter rings, only around the whole sphere
    const ringOpacity = (1 - s) * (1 - Math.min(1, c.spread * 1.5)) * dim * introEdges;
    ringA.current.rotation.set(Math.PI / 2 + 0.35, t * 0.15, 0);
    ringB.current.rotation.set(Math.PI / 2 - 0.5, -t * 0.1, 0.6);
    (ringA.current.material as THREE.MeshBasicMaterial).opacity = 0.5 * ringOpacity;
    (ringB.current.material as THREE.MeshBasicMaterial).opacity = 0.35 * ringOpacity;
    // rings follow the attack / defend palette too
    (ringA.current.material as THREE.MeshBasicMaterial).color.lerpColors(RING_A, RING_A_ATTACK, live.team);
    (ringB.current.material as THREE.MeshBasicMaterial).color.lerpColors(RING_B, RING_B_ATTACK, live.team);
  });

  return (
    <group ref={group}>
      <instancedMesh ref={nodeMesh} args={[undefined, undefined, g.n]} frustumCulled={false}>
        <sphereGeometry args={[0.019, 10, 10]} />
        {/* additive, so a node dimmed to black simply disappears */}
        <meshBasicMaterial toneMapped={false} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>

      <lineSegments ref={lines} geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>

      <points ref={pulsePoints} geometry={pulseGeo} frustumCulled={false}>
        <pointsMaterial
          map={dot}
          size={0.11}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>

      <group ref={ripples}>
        {[0, 1, 2].map((k) => (
          <mesh key={k}>
            <ringGeometry args={[0.965, 1, 64]} />
            <meshBasicMaterial color="#ff9a6b" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        ))}
      </group>

      <mesh ref={ringA}>
        <torusGeometry args={[RADIUS * 1.32, 0.0035, 6, 160]} />
        <meshBasicMaterial color="#00E5FF" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={ringB}>
        <torusGeometry args={[RADIUS * 1.46, 0.003, 6, 160]} />
        <meshBasicMaterial color="#7C3AED" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
