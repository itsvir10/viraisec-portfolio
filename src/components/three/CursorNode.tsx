import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { store } from '../../lib/store';

const DEPTH = 2;
const LINKS = 7; // how many stars it connects to at once
const REACH = 0.26; // screen-space radius (1 = half the screen height)

/**
 * A bright node that chases the cursor and draws constellation lines to the
 * background stars around it, so moving the mouse "connects" the network.
 */
export function CursorNode() {
  const node = useRef<THREE.Mesh>(null!);
  const goal = useMemo(() => new THREE.Vector3(0, 0, DEPTH), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const ndc = useMemo(() => new THREE.Vector3(), []);
  const color = useMemo(() => new THREE.Color(0.6, 2.4, 2.8), []);

  const best = useMemo(() => Array.from({ length: LINKS }, () => ({ d: Infinity, x: 0, y: 0, z: 0 })), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(LINKS * 6), 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(LINKS * 6), 3).setUsage(THREE.DynamicDrawUsage));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);

  useFrame((state, delta) => {
    const vp = state.viewport.getCurrentViewport(state.camera, [0, 0, DEPTH]);
    goal.set((store.mouse.x * vp.width) / 2, (store.mouse.y * vp.height) / 2, DEPTH);
    const n = node.current;
    n.position.lerp(goal, 1 - Math.exp(-Math.min(delta, 0.05) * 6));
    n.scale.setScalar(1 + 0.2 * Math.sin(state.clock.elapsedTime * 3));
    n.visible = store.mouse.active;

    const pos = geo.attributes.position.array as Float32Array;
    const col = geo.attributes.color.array as Float32Array;
    col.fill(0);

    const stars = store.stars;
    if (stars && store.mouse.active) {
      ndc.copy(n.position).project(state.camera);
      const aspect = state.viewport.aspect;
      for (const b of best) b.d = Infinity;
      const world = stars.points.matrixWorld;
      const sp = stars.positions;

      // keep the closest few stars to the node, measured on screen
      for (let i = 0; i < sp.length; i += 3) {
        v.set(sp[i], sp[i + 1], sp[i + 2]).applyMatrix4(world);
        if (v.z < -15) continue; // ignore the faint far ones
        const wx = v.x;
        const wy = v.y;
        const wz = v.z;
        v.project(state.camera);
        const d = Math.hypot((v.x - ndc.x) * aspect, v.y - ndc.y);
        if (d > REACH) continue;
        let worst = 0;
        for (let k = 1; k < LINKS; k++) if (best[k].d > best[worst].d) worst = k;
        if (d < best[worst].d) {
          best[worst].d = d;
          best[worst].x = wx;
          best[worst].y = wy;
          best[worst].z = wz;
        }
      }

      for (let k = 0; k < LINKS; k++) {
        const b = best[k];
        if (b.d === Infinity) continue;
        const a = (1 - b.d / REACH) ** 1.5 * 1.3; // fades out toward the edge of reach
        const k6 = k * 6;
        pos[k6] = n.position.x;
        pos[k6 + 1] = n.position.y;
        pos[k6 + 2] = n.position.z;
        pos[k6 + 3] = b.x;
        pos[k6 + 4] = b.y;
        pos[k6 + 5] = b.z;
        // cyan at the cursor, violet at the star
        col[k6] = 0;
        col[k6 + 1] = 0.9 * a;
        col[k6 + 2] = 1.0 * a;
        col[k6 + 3] = 0.62 * a;
        col[k6 + 4] = 0.32 * a;
        col[k6 + 5] = 1.0 * a;
      }
    }
    geo.attributes.position.needsUpdate = true;
    geo.attributes.color.needsUpdate = true;
  });

  return (
    <>
      <mesh ref={node} position={[0, 0, DEPTH]} visible={false}>
        <sphereGeometry args={[0.04, 20, 20]} />
        <meshBasicMaterial color={color} toneMapped={false} fog={false} />
      </mesh>
      <lineSegments geometry={geo} frustumCulled={false}>
        <lineBasicMaterial vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} fog={false} />
      </lineSegments>
    </>
  );
}
