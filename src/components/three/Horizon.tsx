import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { fieldColor, live } from './keyframes';

const COLS = 60;
const ROWS = 26;

function softDot() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.5)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/**
 * A wide glowing floor stretching to the horizon: a flat cyan network on the
 * left that rises into violet hills on the right. It gives the scene depth,
 * and fog fades it into the dark with distance.
 */
function build() {
  let seed = 7;
  const r = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const idx = (i: number, j: number) => j * COLS + i;
  const p = new Float32Array(COLS * ROWS * 3);
  const col = new Float32Array(COLS * ROWS * 3);
  const mix = new Float32Array(COLS * ROWS * 2); // per point: field blend m and brightness b
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      const x = (i / (COLS - 1) - 0.5) * 40 + (r() - 0.5) * 0.5;
      const z = 4 - (j / (ROWS - 1)) * 38 + (r() - 0.5) * 0.9;
      const right = Math.max(0, x / 20);
      const hill = right ** 1.4 * 3.4 * (0.55 + 0.45 * Math.sin(x * 0.55 + z * 0.3)) * (0.6 + 0.4 * Math.sin(z * 0.45 - x * 0.2));
      const y = -2.7 + hill + 0.12 * Math.sin(x * 0.9 + z * 0.7) + (r() - 0.5) * 0.08;
      p.set([x, y, z], idx(i, j) * 3);
      const m = Math.min(1, Math.max(0, x / 9 + 0.5)); // cyan -> violet across the middle
      const b = r() > 0.86 ? 0.9 + r() * 0.8 : 0.12 + r() * 0.22;
      col.set([0.62 * m * b, (0.9 - 0.58 * m) * b, b], idx(i, j) * 3);
      mix.set([m, b], idx(i, j) * 2);
    }
  }
  const linePos: number[] = [];
  const lineCol: number[] = [];
  const lineMix: number[] = [];
  const link = (a: number, b: number) => {
    linePos.push(p[a * 3], p[a * 3 + 1], p[a * 3 + 2], p[b * 3], p[b * 3 + 1], p[b * 3 + 2]);
    for (const n of [a, b]) {
      const m = Math.min(1, Math.max(0, p[n * 3] / 9 + 0.5));
      lineCol.push(0.62 * m * 0.16, (0.9 - 0.58 * m) * 0.16, 0.16);
      lineMix.push(m, 0.16);
    }
  };
  for (let j = 0; j < ROWS; j++) {
    for (let i = 0; i < COLS; i++) {
      if (i < COLS - 1 && r() > 0.42) link(idx(i, j), idx(i + 1, j));
      if (j < ROWS - 1 && r() > 0.42) link(idx(i, j), idx(i, j + 1));
      if (i < COLS - 1 && j < ROWS - 1 && r() > 0.8) link(idx(i, j), idx(i + 1, j + 1));
    }
  }
  const points = new THREE.BufferGeometry();
  points.setAttribute('position', new THREE.BufferAttribute(p, 3));
  points.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lines = new THREE.BufferGeometry();
  lines.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
  lines.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineCol), 3));
  return { points, lines, mix, lineMix: new Float32Array(lineMix) };
}

const ca = [0, 0, 0];
const cb = [0, 0, 0];
/** Rebuilds vertex colours from each point's field blend and brightness. */
export function recolor(attr: THREE.BufferAttribute, mix: Float32Array) {
  fieldColor(0, ca);
  fieldColor(1, cb);
  const arr = attr.array as Float32Array;
  for (let i = 0, n = mix.length / 2; i < n; i++) {
    const m = mix[i * 2];
    const b = mix[i * 2 + 1];
    arr[i * 3] = (ca[0] + (cb[0] - ca[0]) * m) * b;
    arr[i * 3 + 1] = (ca[1] + (cb[1] - ca[1]) * m) * b;
    arr[i * 3 + 2] = (ca[2] + (cb[2] - ca[2]) * m) * b;
  }
  attr.needsUpdate = true;
}

export function Horizon() {
  const group = useRef<THREE.Group>(null!);
  const lineMat = useRef<THREE.LineBasicMaterial>(null!);
  const pointMat = useRef<THREE.PointsMaterial>(null!);
  const geo = useMemo(build, []);
  const painted = useRef(0);
  const dot = useMemo(softDot, []);
  useEffect(
    () => () => {
      geo.points.dispose();
      geo.lines.dispose();
    },
    [geo],
  );

  useFrame((state) => {
    const opacity = live.kf.floor * (1 - live.fly);
    const narrow = state.viewport.aspect < 1;
    const g = group.current;
    g.visible = opacity > 0.01;
    // slight parallax against the mouse and the scroll
    g.position.x += (-store.mouse.x * 0.5 - g.position.x) * 0.04;
    g.position.y = (narrow ? -1.2 : 0) + Math.sin(window.scrollY * 0.0012) * 0.15;
    lineMat.current.opacity = opacity;
    // recolour for the attack / defend toggle, only while it is changing
    if (Math.abs(live.team - painted.current) > 0.002) {
      painted.current = live.team;
      recolor(geo.points.attributes.color as THREE.BufferAttribute, geo.mix);
      recolor(geo.lines.attributes.color as THREE.BufferAttribute, geo.lineMix);
    }
    pointMat.current.opacity = opacity;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={geo.lines} frustumCulled={false}>
        <lineBasicMaterial ref={lineMat} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </lineSegments>
      <points geometry={geo.points} frustumCulled={false}>
        <pointsMaterial
          ref={pointMat}
          map={dot}
          size={0.13}
          sizeAttenuation
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}
