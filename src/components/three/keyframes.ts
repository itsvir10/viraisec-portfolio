import { store } from '../../lib/store';

/**
 * How the network graph looks for each section.
 * Tweak these numbers to re-choreograph the scroll journey.
 *
 *  x, y    position as a fraction of the visible width / height (0 = centre)
 *  z       depth (negative = further away)
 *  scale   overall size
 *  spin    extra rotation of the sphere, so it turns as you scroll
 *  split   0 = one sphere, 1 = two clusters (cyan network + violet neural net)
 *  sep     how far apart the two clusters sit, as a fraction of the visible width
 *  spread  0 = tight, 1 = nodes drift loose
 *  pulse   how fast signals travel along the edges
 *  dim     overall brightness (1 = full)
 *  floor   how visible the glowing data horizon under the scene is
 */
export type KF = {
  x: number;
  y: number;
  z: number;
  scale: number;
  spin: number;
  split: number;
  sep: number;
  spread: number;
  pulse: number;
  dim: number;
  floor: number;
};

export const KF_KEYS: (keyof KF)[] = ['x', 'y', 'z', 'scale', 'spin', 'split', 'sep', 'spread', 'pulse', 'dim', 'floor'];

export const KEYFRAMES: Record<string, KF> = {
  hero: { x: 0.23, y: 0.09, z: 0, scale: 1.25, spin: 0, split: 0, sep: 0, spread: 0, pulse: 1, dim: 1, floor: 1 },
  about: { x: 0.25, y: 0, z: -0.5, scale: 0.95, spin: 1.2, split: 1, sep: 0.125, spread: 0, pulse: 1, dim: 1, floor: 0.45 },
  skills: { x: 0, y: 0.02, z: -2.5, scale: 1.1, spin: 2.4, split: 1, sep: 0.29, spread: 0, pulse: 1.2, dim: 0.6, floor: 0.25 },
  articles: { x: 0, y: 0, z: -4.5, scale: 1.05, spin: 3.6, split: 0, sep: 0, spread: 0, pulse: 2.6, dim: 0.75, floor: 0.3 },
  certs: { x: 0.36, y: -0.2, z: -1, scale: 0.65, spin: 5, split: 0, sep: 0, spread: 0, pulse: 1, dim: 0.9, floor: 0.5 },
  terminal: { x: -0.34, y: 0.03, z: -1, scale: 0.8, spin: 6.2, split: 0, sep: 0, spread: 0.6, pulse: 1.2, dim: 0.9, floor: 0.35 },
  contact: { x: 0, y: 0.04, z: -2, scale: 1.3, spin: 7.6, split: 0, sep: 0, spread: 0, pulse: 3.2, dim: 0.55, floor: 0.9 },
  // used on the /articles pages: parked to the side and dimmed behind the text
  article: { x: 0.36, y: -0.08, z: -3.5, scale: 1.05, spin: 1, split: 0, sep: 0, spread: 0.15, pulse: 0.8, dim: 0.3, floor: 0.2 },
};

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

function copy(out: KF, a: KF) {
  for (const k of KF_KEYS) out[k] = a[k];
  return out;
}
function mix(out: KF, a: KF, b: KF, t: number) {
  for (const k of KF_KEYS) out[k] = a[k] + (b[k] - a[k]) * t;
  return out;
}

/** Sections the camera flies into through the tunnel. */
const FLY_INTO = new Set(['articles', 'terminal', 'contact']);

/**
 * Shared, per-frame state of the scene. The Director (Scene.tsx) updates it
 * once a frame; the graph, tunnel, horizon and camera all read from it.
 *  kf   the eased pose
 *  fly  0..1, peaks in the middle of a fly-through transition
 */
export const live = { kf: { ...KEYFRAMES.hero, scale: 0.01 } as KF, fly: 0 };

let sampledFly = 0;
export const getSampledFly = () => sampledFly;

const a: KF = { ...KEYFRAMES.hero };
const b: KF = { ...KEYFRAMES.hero };

/**
 * The pose for one section at progress p (0 = just arrived, 1 = about to leave).
 * About is a pinned scene: the sphere arrives whole and tears into its two
 * clusters while the section holds still.
 */
function pose(out: KF, id: string, p: number, tall: boolean) {
  copy(out, KEYFRAMES[id] ?? KEYFRAMES.hero);
  if (id === 'about' && tall) out.split = smooth(clamp01((p - 0.06) / 0.5));
  return out;
}

/**
 * Works out the graph's target pose from the current scroll position.
 * Each section "holds" its pose while it fills the screen and blends into
 * the next one across the gap between them, so it never jumps.
 */
export function sampleKeyframes(out: KF): KF {
  sampledFly = 0;
  if (store.page === 'article') return copy(out, KEYFRAMES.article);
  const secs = store.sections;
  if (!secs.length) return copy(out, KEYFRAMES.hero);
  const vh = window.innerHeight;
  const mid = window.scrollY + vh / 2;
  const pad = (i: number) => Math.min(vh * 0.32, (secs[i].bottom - secs[i].top) / 2);
  const tall = (i: number) => secs[i].bottom - secs[i].top > vh * 1.6;

  for (let i = 0; i < secs.length; i++) {
    const holdStart = secs[i].top + pad(i);
    const holdEnd = secs[i].bottom - pad(i);
    if (mid <= holdEnd || i === secs.length - 1) {
      if (i === 0 || mid >= holdStart) {
        const p = clamp01((mid - holdStart) / Math.max(1, holdEnd - holdStart));
        return pose(out, secs[i].id, p, tall(i));
      }
      const from = secs[i - 1].bottom - pad(i - 1);
      const raw = clamp01((mid - from) / Math.max(1, holdStart - from));
      if (FLY_INTO.has(secs[i].id)) sampledFly = Math.sin(Math.PI * raw);
      return mix(out, pose(a, secs[i - 1].id, 1, tall(i - 1)), pose(b, secs[i].id, 0, tall(i)), smooth(raw));
    }
  }
  return pose(out, secs[secs.length - 1].id, 1, false);
}
