import { useSyncExternalStore } from "react";

// Local-first store for the "Plano de Desenvolvimento do Grupo". Keyed by the
// Matrix assessment id so it survives reloads and is ready to sync later.

export interface GroupAction {
  id: string;
  text: string;
  done: boolean;
}

type PlanMap = Record<string, GroupAction[]>;

const KEY = "ase.group-plans.v1";
const listeners = new Set<() => void>();

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function read(): PlanMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PlanMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

let cache: PlanMap | null = null;

function snapshot(): PlanMap {
  if (cache === null) cache = read();
  return cache;
}

function persist(next: PlanMap) {
  cache = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = read();
      listeners.forEach((l) => l());
    }
  });
}

function mutate(groupId: string, fn: (list: GroupAction[]) => GroupAction[]) {
  const current = snapshot();
  persist({ ...current, [groupId]: fn(current[groupId] ?? []) });
}

export const groupPlanStore = {
  add(groupId: string, text: string): void {
    const clean = text.trim();
    if (!clean) return;
    mutate(groupId, (list) => [...list, { id: uid(), text: clean, done: false }]);
  },
  toggle(groupId: string, actionId: string): void {
    mutate(groupId, (list) =>
      list.map((a) => (a.id === actionId ? { ...a, done: !a.done } : a)),
    );
  },
  remove(groupId: string, actionId: string): void {
    mutate(groupId, (list) => list.filter((a) => a.id !== actionId));
  },
};

const EMPTY: GroupAction[] = [];

export function useGroupPlan(groupId: string): GroupAction[] {
  const map = useSyncExternalStore(
    subscribe,
    snapshot,
    () => ({}) as PlanMap,
  );
  return map[groupId] ?? EMPTY;
}
