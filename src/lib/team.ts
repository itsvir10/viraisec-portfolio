import { useSyncExternalStore } from 'react';
import { store } from './store';
import { toast } from './toast';

/**
 * Attack / defend toggle. Attack (red team: red and orange) is the default;
 * defend swaps the whole palette to the blue-team cyan and violet (CSS variables on <html>,
 * plus the 3D scene, which eases toward store.team).
 */
export type Team = 'defend' | 'attack';
const KEY = 'vir-team';
const listeners = new Set<() => void>();

function read(): Team {
  try {
    return localStorage.getItem(KEY) === 'defend' ? 'defend' : 'attack';
  } catch {
    return 'attack';
  }
}

let current: Team = read();

function apply(t: Team) {
  store.team = t === 'attack' ? 1 : 0;
  if (typeof document !== 'undefined') document.documentElement.dataset.team = t;
}
apply(current);

export function getTeam() {
  return current;
}

export function setTeam(t: Team, announce = true) {
  if (t === current) return;
  current = t;
  apply(t);
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* not saved: it resets to defend next visit */
  }
  listeners.forEach((l) => l());
  if (announce) toast(t === 'attack' ? 'Red team engaged. Looking for a way in.' : 'Blue team on watch. All systems monitored.');
}

export function useTeam(): Team {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => 'attack',
  );
}
