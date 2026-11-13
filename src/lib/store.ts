import type { Points } from 'three';

// Tiny mutable store read inside animation loops. Kept outside React on
// purpose: mouse and scroll change every frame and must not re-render.

export type SectionBox = { id: string; top: number; bottom: number };

export const store = {
  /** Pointer position, normalised to -1..1 (y up). `active` is true once a real mouse has moved. */
  mouse: { x: 0, y: 0, active: false },
  /** Measured section positions in document space (home page only). */
  sections: [] as SectionBox[],
  /** Which kind of page is showing; article pages park and dim the 3D graph. */
  page: 'home' as 'home' | 'article',
  /** Background star field, shared so the cursor node can link to nearby stars. */
  stars: null as { points: Points; positions: Float32Array } | null,
  /** Set true once the graphical site is showing; starts the graph's assembly shot. */
  introGo: false,
  /** Dragging the graph in the hero: extra rotation plus spin-down velocity. */
  drag: { yaw: 0, pitch: 0, velocity: 0, active: false },
  /** Screen positions of the article nodes, written by the graph every frame. */
  features: [] as { x: number; y: number; show: boolean }[],
  /** The ordinary node currently under the cursor, for the small detail tooltip. */
  hover: { x: 0, y: 0, index: -1, field: 0 },
  /** True while an article node's card is open, so the graph holds still under it. */
  hold: false,
};
