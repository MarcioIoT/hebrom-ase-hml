import { useSyncExternalStore } from "react";

// ---------------------------------------------------------------------------
// Pré-cadastro de grupos (local-first). Cada grupo guarda rede, supervisor,
// condutor e membros — cada membro com um código único e estável, usado para
// anonimizar o nome posteriormente.
// ---------------------------------------------------------------------------

export interface GroupMember {
  id: string;
  name: string;
  /** Código único e imutável do membro (ex.: HB-7K3Q2M) */
  code: string;
}

export interface Group {
  id: string;
  name: string;
  network?: string;
  supervisor?: string;
  conductor?: string;
  members: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupInput {
  name: string;
  network?: string;
  supervisor?: string;
  conductor?: string;
  members: { id?: string; name: string; code?: string }[];
}

const KEY = "ase.groups.v1";
const listeners = new Set<() => void>();

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomCode(): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return `HB-${out}`;
}

function read(): Group[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Group[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache: Group[] | null = null;

function snapshot(): Group[] {
  if (cache === null) cache = read();
  return cache;
}

function persist(next: Group[]) {
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

/** Gera um código que não colide com nenhum outro já existente. */
export function uniqueCode(taken: Set<string>): string {
  let code = randomCode();
  while (taken.has(code)) code = randomCode();
  taken.add(code);
  return code;
}

function allCodes(list: Group[]): Set<string> {
  const s = new Set<string>();
  list.forEach((g) => g.members.forEach((m) => s.add(m.code)));
  return s;
}

function buildMembers(
  input: GroupInput["members"],
  taken: Set<string>,
): GroupMember[] {
  return input
    .map((m) => ({ ...m, name: m.name.trim() }))
    .filter((m) => m.name)
    .map((m) => ({
      id: m.id ?? uid(),
      name: m.name,
      code: m.code ?? uniqueCode(taken),
    }));
}

export const groupStore = {
  list(): Group[] {
    return snapshot();
  },

  get(id: string): Group | undefined {
    return snapshot().find((g) => g.id === id);
  },

  create(input: GroupInput): Group {
    const list = snapshot();
    const now = new Date().toISOString();
    const g: Group = {
      id: uid(),
      name: input.name.trim() || "Novo grupo",
      network: input.network?.trim() || undefined,
      supervisor: input.supervisor?.trim() || undefined,
      conductor: input.conductor?.trim() || undefined,
      members: buildMembers(input.members, allCodes(list)),
      createdAt: now,
      updatedAt: now,
    };
    persist([g, ...list]);
    return g;
  },

  update(id: string, input: GroupInput) {
    const list = snapshot();
    const taken = allCodes(list);
    persist(
      list.map((g) =>
        g.id === id
          ? {
              ...g,
              name: input.name.trim() || g.name,
              network: input.network?.trim() || undefined,
              supervisor: input.supervisor?.trim() || undefined,
              conductor: input.conductor?.trim() || undefined,
              members: buildMembers(input.members, taken),
              updatedAt: new Date().toISOString(),
            }
          : g,
      ),
    );
  },

  remove(id: string) {
    persist(snapshot().filter((g) => g.id !== id));
  },
};

const EMPTY: Group[] = [];
const serverSnapshot = () => EMPTY;

export function useGroups(): Group[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}
