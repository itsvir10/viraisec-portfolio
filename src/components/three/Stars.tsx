import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';

function softDot() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

/** Background particle field: slow drift, depth parallax, speeds up with scroll. */
export function Stars({ count, reduced }: { count: number; reduced: boolean }) {
  const points = useRef<THREE.Points>(null!);
  const lastScroll = useRef(window.scrollY);
  const speed = useRef(0);
  const map = useMemo(softDot, []);

  const [positions, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [new THREE.Color('#ffffff'), new THREE.Color('#7fefff'), new THREE.Color('#a98bff')];
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 34;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 44;
      pos[i * 3 + 2] = -22 + Math.random() * 24;
      const c = palette[Math.random() < 0.6 ? 0 : Math.random() < 0.5 ? 1 : 2];
      const b = 0.35 + Math.random() * 0.65;
      col[i * 3] = c.r * b;
      col[i * 3 + 1] = c.g * b;
      col[i * 3 + 2] = c.b * b;
    }
    return [pos, col];
  }, [count]);

  // share the field so the cursor node can draw links to nearby stars
  useEffect(() => {
    store.stars = { points: points.current, positions };
    return () => {
      store.stars = null;
    };
  }, [positions]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const y = window.scrollY;
    const v = Math.abs(y - lastScroll.current) / Math.max(dt, 0.001);
    lastScroll.current = y;
    speed.current += (Math.min(v / 2500, 2.5) - speed.current) * (1 - Math.exp(-dt * 4));

    const p = points.current;
    // parallax: the field slides up as you scroll down
    p.position.y += (y * 0.0022 - p.position.y) * (1 - Math.exp(-dt * 5));
    if (!reduced) p.rotation.y += dt * 0.012 * (1 + speed.current * 4);
    p.rotation.x += (store.mouse.y * 0.03 - p.rotation.x) * 0.03;
    (p.material as THREE.PointsMaterial).size = 0.07 + speed.current * 0.03;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        map={map}
        size={0.07}
        sizeAttenuation
        vertexColors
        transparent
        opacity={0.9}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
