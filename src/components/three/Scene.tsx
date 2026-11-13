import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { store } from '../../lib/store';
import { KF_KEYS, KEYFRAMES, getSampledFly, live, sampleKeyframes, type KF } from './keyframes';
import { Graph } from './Graph';
import { CursorNode } from './CursorNode';
import { Stars } from './Stars';
import { Horizon, recolor } from './Horizon';

type Props = { mobile: boolean; reduced: boolean; finePointer: boolean; featureFields: number[] };

// shared with the post-processing pass so the lens can smear during fly-throughs
const lens = new THREE.Vector2(0.0006, 0.0006);

/**
 * Runs first every frame: reads the scroll position, eases the shared pose
 * toward it, and moves the camera. Everything else in the scene follows.
 */
function Director({ reduced }: { reduced: boolean }) {
  const target = useRef<KF>({ ...KEYFRAMES.hero });
  const first = useRef(true);
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const tg = sampleKeyframes(target.current);
    const k = 1 - Math.exp(-dt * 3.2);
    for (const key of KF_KEYS) live.kf[key] += (tg[key] - live.kf[key]) * k;
    const flyTarget = reduced ? 0 : getSampledFly();
    // attack / defend palette eases over about a second (but starts on the saved team)
    if (first.current) {
      first.current = false;
      live.team = store.team;
    }
    live.team += (store.team - live.team) * (reduced ? 1 : 1 - Math.exp(-dt * 3.5));
    live.fly += (flyTarget - live.fly) * (1 - Math.exp(-dt * 7));

    // camera: widen the lens, push in and roll slightly while flying
    const cam = state.camera as THREE.PerspectiveCamera;
    const fly = live.fly;
    const fov = 35 + fly * 24;
    if (Math.abs(cam.fov - fov) > 0.01) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
    cam.position.set(store.mouse.x * 0.12, store.mouse.y * 0.08, 8 - fly * 1.2);
    cam.rotation.set(0, 0, fly * 0.12);
    lens.setScalar(0.0006 + fly * 0.0045);
  });
  return null;
}

/** Large, soft, out-of-focus specks close to the lens, like bokeh in a film still. */
function Bokeh({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!);
  const map = useMemo(() => {
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(0.7, 'rgba(255,255,255,0.4)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    return new THREE.CanvasTexture(canvas);
  }, []);
  const painted = useRef(0);
  const [positions, colors, mix] = useMemo(() => {
    const p = new Float32Array(count * 3);
    const c = new Float32Array(count * 3);
    const mx = new Float32Array(count * 2);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 9;
      p.set([x, (Math.random() - 0.5) * 6 - 0.8, 3 + Math.random() * 3], i * 3);
      const m = Math.min(1, Math.max(0, x / 5 + 0.5));
      const b = 0.05 + Math.random() * 0.07;
      c.set([0.62 * m * b, (0.9 - 0.58 * m) * b, b], i * 3);
      mx.set([m, b], i * 2);
    }
    return [p, c, mx];
  }, [count]);
  useFrame(() => {
    const p = ref.current;
    p.position.y = Math.sin(window.scrollY * 0.0016) * 1.4; // sways with the scroll, faster than the stars
    p.position.x += (-store.mouse.x * 0.4 - p.position.x) * 0.05;
    (p.material as THREE.PointsMaterial).opacity = 1 - live.fly;
    if (Math.abs(live.team - painted.current) > 0.002) {
      painted.current = live.team;
      recolor(p.geometry.attributes.color as THREE.BufferAttribute, mix);
    }
  });
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial map={map} size={0.85} sizeAttenuation vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
    </points>
  );
}

/**
 * Fixed full-screen WebGL layer behind the page content.
 * Mobile and slow devices get a lighter version: fewer nodes and particles,
 * and no post-processing.
 */
export default function Scene({ mobile, reduced, finePointer, featureFields }: Props) {
  const [degraded, setDegraded] = useState(false);
  // add ?hq to the URL to force full quality (handy when testing)
  const forceHq = useMemo(() => new URLSearchParams(window.location.search).has('hq'), []);
  const low = mobile || (degraded && !forceHq);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, low ? 1.5 : 2]}
        camera={{ position: [0, 0, 8], fov: 35, near: 0.1, far: 80 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ pointerEvents: 'none' }}
      >
        <color attach="background" args={['#05060A']} />
        <fog attach="fog" args={['#05060A', 13, 36]} />

        <Director reduced={reduced} />
        <Stars count={mobile ? 700 : 2600} reduced={reduced} />
        <Horizon />
        <Graph nodes={mobile ? 60 : 170} pulses={mobile ? 16 : 48} reduced={reduced} featureFields={featureFields} />
        {/* tunnel removed */}
        {!mobile && <Bokeh count={22} />}
        {finePointer && !reduced && <CursorNode />}

        {!low && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.6} luminanceSmoothing={0.25} />
            <ChromaticAberration offset={lens} radialModulation={false} modulationOffset={0} />
            <Vignette offset={0.22} darkness={0.78} />
          </EffectComposer>
        )}

        <PerformanceMonitor onDecline={() => setDegraded(true)} />
        <AdaptiveDpr pixelated />
      </Canvas>
    </div>
  );
}
