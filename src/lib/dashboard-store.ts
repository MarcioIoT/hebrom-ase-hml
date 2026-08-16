import { useSyncExternalStore } from "react";
import type { DashAssessment, DashInsights } from "./dashboard-types";

// Local-first store for member dashboards, mirroring ase-store so it can be
// swapped for a Lovable Cloud backend later without touching components.

const KEY = "ase.dashboards.v1";
const listeners = new Set<() => void>();

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function read(): DashAssessment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DashAssessment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache: DashAssessment[] | null = null;

function snapshot(): DashAssessment[] {
  if (cache === null) cache = read();
  return cache;
}

function persist(next: DashAssessment[]) {
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

function mutate(fn: (list: DashAssessment[]) => DashAssessment[]) {
  persist(fn(snapshot()));
}

export const dashStore = {
  list(): DashAssessment[] {
    return snapshot();
  },

  get(id: string): DashAssessment | undefined {
    return snapshot().find((d) => d.id === id);
  },

  create(
    input: Omit<DashAssessment, "id" | "createdAt" | "updatedAt">,
  ): DashAssessment {
    const now = new Date().toISOString();
    const d: DashAssessment = { ...input, id: uid(), createdAt: now, updatedAt: now };
    mutate((list) => [d, ...list]);
    return d;
  },

  remove(id: string) {
    mutate((list) => list.filter((d) => d.id !== id));
  },

  setInsights(id: string, insights: DashInsights) {
    mutate((list) =>
      list.map((d) =>
        d.id === id
          ? { ...d, insights, updatedAt: new Date().toISOString() }
          : d,
      ),
    );
  },

  update(id: string, patch: Partial<DashAssessment>) {
    mutate((list) =>
      list.map((d) =>
        d.id === id
          ? { ...d, ...patch, updatedAt: new Date().toISOString() }
          : d,
      ),
    );
  },

  /**
   * Reuse the existing dashboard for a given Matrix assessment+member if one
   * exists; otherwise create it. Keeps the Group Dashboard from duplicating
   * individual dashboards each time a member card is opened.
   */
  ensureFromMatrix(
    input: Omit<DashAssessment, "id" | "createdAt" | "updatedAt">,
  ): DashAssessment {
    const existing = snapshot().find(
      (d) =>
        d.matrixAssessmentId &&
        d.matrixAssessmentId === input.matrixAssessmentId &&
        d.matrixMemberId === input.matrixMemberId,
    );
    if (existing) {
      // Refresh scores/purposes but preserve any AI insights already generated.
      const merged: DashAssessment = {
        ...existing,
        ...input,
        id: existing.id,
        createdAt: existing.createdAt,
        insights: existing.insights,
        updatedAt: new Date().toISOString(),
      };
      mutate((list) => list.map((d) => (d.id === existing.id ? merged : d)));
      return merged;
    }
    return this.create(input);
  },
};

const EMPTY: DashAssessment[] = [];
const serverSnapshot = () => EMPTY;

export function useDashboards(): DashAssessment[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function useDashboard(id: string): DashAssessment | undefined {
  const list = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return list.find((d) => d.id === id);
}
