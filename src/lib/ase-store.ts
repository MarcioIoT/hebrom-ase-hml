import { useSyncExternalStore } from "react";
import type {
  Assessment,
  Member,
  NotesMap,
  ScoreMap,
  ScoreValue,
} from "./ase-types";

// ---------------------------------------------------------------------------
// Local-first store. All assessments live in localStorage under a single key.
// A tiny pub/sub layer makes it reactive via useSyncExternalStore. The data
// shape matches ase-types so it can later be swapped for a Lovable Cloud
// backend without touching component code.
// ---------------------------------------------------------------------------

const KEY = "ase.assessments.v1";
const listeners = new Set<() => void>();

function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  );
}

function read(): Assessment[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Assessment[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache: Assessment[] | null = null;

function snapshot(): Assessment[] {
  if (cache === null) cache = read();
  return cache;
}

function persist(next: Assessment[]) {
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

// Keep multiple tabs in sync.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) {
      cache = read();
      listeners.forEach((l) => l());
    }
  });
}

// ---- mutations --------------------------------------------------------------

function mutate(fn: (list: Assessment[]) => Assessment[]) {
  persist(fn(snapshot()));
}

function touch(a: Assessment): Assessment {
  return { ...a, updatedAt: new Date().toISOString() };
}

export const store = {
  list(): Assessment[] {
    return snapshot();
  },

  get(id: string): Assessment | undefined {
    return snapshot().find((a) => a.id === id);
  },

  create(input: {
    name: string;
    conductor: string;
    network?: string;
    supervisor?: string;
    groupName?: string;
    members?: (string | { name: string; code?: string })[];
  }): Assessment {
    const now = new Date().toISOString();
    const members: Member[] = (input.members ?? [])
      .map((m) => (typeof m === "string" ? { name: m } : m))
      .map((m) => ({ ...m, name: m.name.trim() }))
      .filter((m) => m.name)
      .map((m) => ({ id: uid(), name: m.name, code: m.code }));
    const a: Assessment = {
      id: uid(),
      name: input.name.trim() || "Nova avaliação",
      groupName: input.groupName?.trim() || undefined,
      network: input.network?.trim() || undefined,
      supervisor: input.supervisor?.trim() || undefined,
      conductor: input.conductor.trim(),
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      members,
      scores: {},
    };
    mutate((list) => [a, ...list]);
    return a;
  },

  duplicate(id: string): Assessment | undefined {
    const src = snapshot().find((a) => a.id === id);
    if (!src) return undefined;
    const now = new Date().toISOString();
    const copy: Assessment = {
      ...src,
      id: uid(),
      name: `${src.name} (cópia)`,
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      members: src.members.map((m) => ({ ...m })),
      scores: {},
    };
    mutate((list) => [copy, ...list]);
    return copy;
  },

  rename(id: string, name: string) {
    mutate((list) =>
      list.map((a) => (a.id === id ? touch({ ...a, name }) : a)),
    );
  },

  setConductor(id: string, conductor: string) {
    mutate((list) =>
      list.map((a) => (a.id === id ? touch({ ...a, conductor }) : a)),
    );
  },

  setNetwork(id: string, network: string) {
    mutate((list) =>
      list.map((a) =>
        a.id === id ? touch({ ...a, network: network || undefined }) : a,
      ),
    );
  },

  setSupervisor(id: string, supervisor: string) {
    mutate((list) =>
      list.map((a) =>
        a.id === id ? touch({ ...a, supervisor: supervisor || undefined }) : a,
      ),
    );
  },

  remove(id: string) {
    mutate((list) => list.filter((a) => a.id !== id));
  },

  addMember(id: string, name?: string): Member {
    const a = snapshot().find((x) => x.id === id)!;
    const member: Member = {
      id: uid(),
      name: name?.trim() || `Membro ${a.members.length + 1}`,
    };
    mutate((list) =>
      list.map((x) =>
        x.id === id ? touch({ ...x, members: [...x.members, member] }) : x,
      ),
    );
    return member;
  },

  renameMember(id: string, memberId: string, name: string) {
    mutate((list) =>
      list.map((x) =>
        x.id === id
          ? touch({
              ...x,
              members: x.members.map((m) =>
                m.id === memberId ? { ...m, name } : m,
              ),
            })
          : x,
      ),
    );
  },

  removeMember(id: string, memberId: string) {
    mutate((list) =>
      list.map((x) => {
        if (x.id !== id) return x;
        const scores = { ...x.scores };
        delete scores[memberId];
        return touch({
          ...x,
          members: x.members.filter((m) => m.id !== memberId),
          scores,
        });
      }),
    );
  },

  setScore(
    id: string,
    memberId: string,
    questionId: string,
    value: ScoreValue | null,
  ) {
    mutate((list) =>
      list.map((x) => {
        if (x.id !== id) return x;
        const row = { ...(x.scores[memberId] ?? {}) };
        if (value === null) delete row[questionId];
        else row[questionId] = value;
        return touch({ ...x, scores: { ...x.scores, [memberId]: row } });
      }),
    );
  },

  setNote(id: string, memberId: string, purposeId: string, text: string) {
    mutate((list) =>
      list.map((x) => {
        if (x.id !== id) return x;
        const notes = { ...(x.notes ?? {}) };
        const row = { ...(notes[memberId] ?? {}) };
        if (text.trim()) row[purposeId] = text;
        else delete row[purposeId];
        notes[memberId] = row;
        return touch({ ...x, notes });
      }),
    );
  },


  /** Cria uma avaliação a partir de um arquivo padrão ASE (Excel). */
  importAssessment(input: {
    name: string;
    network?: string;
    supervisor?: string;
    conductor?: string;
    members: { id: string; name: string; code?: string }[];
    scores: Record<string, Record<string, ScoreValue>>;
    notes?: Record<string, Record<string, string>>;
  }): Assessment {
    const now = new Date().toISOString();
    const map = new Map<string, string>();
    const members: Member[] = input.members.map((m) => {
      const id = uid();
      map.set(m.id, id);
      return { id, name: m.name.trim() || m.code || "Membro", code: m.code };
    });
    const scores: ScoreMap = {};
    for (const [oldId, row] of Object.entries(input.scores)) {
      const id = map.get(oldId);
      if (id) scores[id] = { ...row };
    }
    const notes: NotesMap = {};
    for (const [oldId, row] of Object.entries(input.notes ?? {})) {
      const id = map.get(oldId);
      if (id) notes[id] = { ...row };
    }
    const a: Assessment = {
      id: uid(),
      name: input.name.trim() || "Avaliação importada",
      network: input.network?.trim() || undefined,
      supervisor: input.supervisor?.trim() || undefined,
      conductor: input.conductor?.trim() || "",
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      members,
      scores,
      notes,
    };
    mutate((list) => [a, ...list]);
    return a;
  },

  finish(id: string) {
    mutate((list) =>
      list.map((a) =>
        a.id === id ? { ...a, finishedAt: new Date().toISOString() } : a,
      ),
    );
  },

  reopen(id: string) {
    mutate((list) =>
      list.map((a) => (a.id === id ? { ...a, finishedAt: null } : a)),
    );
  },
};

// ---- hooks ------------------------------------------------------------------

const EMPTY: Assessment[] = [];
const serverSnapshot = () => EMPTY;

export function useAssessments(): Assessment[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function useAssessment(id: string): Assessment | undefined {
  const list = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return list.find((a) => a.id === id);
}
