import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { live } from './keyframes';

const LENGTH = 44; // one tunnel segment; two are drawn end to end so it loops forever
const NODES = 300;

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

/** Builds one loopable segment: nodes on the tunnel wall, linked to their neighbours. */
function build() {
  let seed = 91;
  const r = () => {
    seed = (seed * 1664525 + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
  const p = new Float32Array(NODES * 3);
  const col = new Float32Array(NODES * 3);
  for (let i = 0; i < NODES; i++) {
    const th = r() * Math.PI * 2;
    const rad = 2.3 + r() * 1.5;
    p.set([Math.cos(th) * rad * 1.25, Math.sin(th) * rad * 0.8, -r() * LENGTH], i * 3);
    // cyan wall on the left, violet wall on the right, blended across the middle
    const m = Math.min(1, Math.max(0, p[i * 3] / 2.4 + 0.5));
    const b = 0.7 + r() * 0.9;
    col.set([(0 + 0.62 * m) * b, (0.9 - 0.58 * m) * b, 1 * b], i * 3);
  }
  const linePos: number[] = [];
  const lineCol: number[] = [];
  const seen = new Set<number>();
  const wrap = (dz: number) => (dz > LENGTH / 2 ? dz - LENGTH : dz < -LENGTH / 2 ? dz + LENGTH : dz);
  for (let i = 0; i < NODES; i++) {
    const near: [number, number][] = [];
    for (let j = 0; j < NODES; j++) {
      if (i === j) continue;
      const dx = p[i * 3] - p[j * 3];
      const dy = p[i * 3 + 1] - p[j * 3 + 1];
      const dz = wrap(p[i * 3 + 2] - p[j * 3 + 2]);
      near.push([dx * dx + dy * dy + dz * dz, j]);
    }
    near.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 3; k++) {
      const j = near[k][1];
      const key = Math.min(i, j) * NODES + Math.max(i, j);
      if (seen.has(key)) continue;
      seen.add(key);
      // draw to the neighbour's nearest copy so the two segments join seamlessly
      const dz = wrap(p[j * 3 + 2] - p[i * 3 + 2]);
      linePos.push(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], p[j * 3], p[j * 3 + 1], p[i * 3 + 2] + dz);
      for (const n of [i, j]) lineCol.push(col[n * 3] * 0.45, col[n * 3 + 1] * 0.45, col[n * 3 + 2] * 0.45);
    }
  }
  const points = new THREE.BufferGeometry();
  points.setAttribute('position', new THREE.BufferAttribute(p, 3));
  points.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const lines = new THREE.BufferGeometry();
  lines.setAttribute('position', new THREE.BufferAttribute(new Float32Array(linePos), 3));
  lines.setAttribute('color', new THREE.BufferAttribute(new Float32Array(lineCol), 3));
  return { points, lines };
}

/**
 * The fly-through. Between certain sections the main graph fades out and the
 * camera travels down this tunnel of nodes (cyan wall left, violet wall right)
 * toward a bright vanishing point, then the graph fades back in.
 * It moves with the scroll, so scrolling back flies it in reverse.
 */
export function Tunnel() {
  const group = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.Mesh>(null!);
  const geo = useMemo(build, []);
  const dot = useMemo(softDot, []);
  const lineMat = useRef<THREE.LineBasicMaterial>(null!);
  const pointMat = useRef<THREE.PointsMaterial>(null!);
  useEffect(
    () => () => {
      geo.points.dispose();
      geo.lines.dispose();
    },
    [geo],
  );

  useFrame(() => {
    const fly = live.fly;
    const g = group.current;
    g.visible = fly > 0.01;
    glow.current.visible = g.visible;
    if (!g.visible) return;
    // travel is tied to the scroll position
    const travel = (((window.scrollY * 0.02) % LENGTH) + LENGTH) % LENGTH;
    g.position.z = 9 + travel;
    lineMat.current.opacity = fly;
    pointMat.current.opacity = fly;
    (glow.current.material as THREE.MeshBasicMaterial).opacity = fly * 0.3;
  });

  return (
    <>
      <group ref={group} visible={false}>
        {[0, -LENGTH].map((z) => (
          <group key={z} position={[0, 0, z]}>
            <lineSegments geometry={geo.lines} frustumCulled={false}>
              <lineBasicMaterial ref={z === 0 ? lineMat : undefined} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
            </lineSegments>
            <points geometry={geo.points} frustumCulled={false}>
              <pointsMaterial
                ref={z === 0 ? pointMat : undefined}
                map={dot}
                size={0.16}
                sizeAttenuation
                vertexColors
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
                toneMapped={false}
              />
            </points>
          </group>
        ))}
      </group>
      {/* the bright vanishing point at the end of the tunnel */}
      <mesh ref={glow} position={[0, 0, -26]} visible={false}>
        <planeGeometry args={[5.5, 5.5]} />
        <meshBasicMaterial map={dot} color="#8fa4ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
      </mesh>
    </>
  );
}
