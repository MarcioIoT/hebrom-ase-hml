import { useSyncExternalStore } from "react";
import type { Assessment, Member, ScoreMap, NotesMap } from "./ase-types";
import type { ParsedAse } from "./ase-excel";

// ---------------------------------------------------------------------------
// Supervisor module store. Holds the ASE Excel files imported by the
// supervisor (one per Pequeno Grupo / condutor). Kept fully separate from the
// conductor's own assessments (ase-store) so importing a report never mixes
// with the data the supervisor's own device is collecting.
// ---------------------------------------------------------------------------

const KEY = "ase.supervisor.reports.v1";
const listeners = new Set<() => void>();

export interface SupervisorReport extends Assessment {
  /** Nome do arquivo Excel importado. */
  fileName: string;
  importedAt: string;
  anonymized: boolean;
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function read(): SupervisorReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SupervisorReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

let cache: SupervisorReport[] | null = null;

function snapshot(): SupervisorReport[] {
  if (cache === null) cache = read();
  return cache;
}

function persist(next: SupervisorReport[]) {
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

/** Chave estável de um grupo: rede + nome do grupo + condutor. */
function groupKey(r: {
  name: string;
  network?: string;
  conductor: string;
}): string {
  return [r.network ?? "", r.name, r.conductor]
    .map((s) => s.trim().toLowerCase())
    .join("|");
}

export const supervisorStore = {
  list(): SupervisorReport[] {
    return snapshot();
  },

  get(id: string): SupervisorReport | undefined {
    return snapshot().find((r) => r.id === id);
  },

  /**
   * Importa um arquivo ASE. Se já existir um relatório do mesmo grupo
   * (rede + grupo + condutor), ele é substituído pela versão mais recente.
   */
  import(parsed: ParsedAse, fileName: string): SupervisorReport {
    const now = new Date().toISOString();
    const map = new Map<string, string>();
    const members: Member[] = parsed.members.map((m) => {
      const id = uid();
      map.set(m.id, id);
      return { id, name: m.name.trim() || m.code || "Membro", code: m.code };
    });

    const scores: ScoreMap = {};
    for (const [oldId, row] of Object.entries(parsed.scores)) {
      const id = map.get(oldId);
      if (id) scores[id] = { ...row };
    }
    const notes: NotesMap = {};
    for (const [oldId, row] of Object.entries(parsed.notes ?? {})) {
      const id = map.get(oldId);
      if (id) notes[id] = { ...row };
    }

    const report: SupervisorReport = {
      id: uid(),
      name: parsed.name.trim() || "Grupo importado",
      groupName: parsed.groupName?.trim() || parsed.name.trim() || undefined,
      network: parsed.network?.trim() || undefined,
      supervisor: parsed.supervisor?.trim() || undefined,
      conductor: parsed.conductor?.trim() || "—",
      createdAt: now,
      updatedAt: now,
      finishedAt: now,
      members,
      scores,
      notes,
      fileName,
      importedAt: now,
      anonymized: parsed.anonymized,
    };

    const key = groupKey(report);
    persist([
      report,
      ...snapshot().filter((r) => groupKey(r) !== key),
    ]);
    return report;
  },

  remove(id: string) {
    persist(snapshot().filter((r) => r.id !== id));
  },

  clear() {
    persist([]);
  },
};

const EMPTY: SupervisorReport[] = [];
const serverSnapshot = () => EMPTY;

export function useSupervisorReports(): SupervisorReport[] {
  return useSyncExternalStore(subscribe, snapshot, serverSnapshot);
}

export function useSupervisorReport(id: string): SupervisorReport | undefined {
  const list = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  return list.find((r) => r.id === id);
}

// ---------------------------------------------------------------------------
// Rede do supervisor. O supervisor escolhe a rede que ele acompanha antes de
// importar qualquer arquivo; a importação só aceita arquivos dessa rede.
// ---------------------------------------------------------------------------

const NET_KEY = "ase.supervisor.network.v1";
const netListeners = new Set<() => void>();
let netCache: string | null = null;

function readNetwork(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(NET_KEY) ?? "";
  } catch {
    return "";
  }
}

function netSnapshot(): string {
  if (netCache === null) netCache = readNetwork();
  return netCache;
}

function netSubscribe(cb: () => void) {
  netListeners.add(cb);
  return () => netListeners.delete(cb);
}

export const supervisorNetwork = {
  get(): string {
    return netSnapshot();
  },
  set(value: string) {
    netCache = value.trim();
    if (typeof window !== "undefined") {
      window.localStorage.setItem(NET_KEY, netCache);
    }
    netListeners.forEach((l) => l());
  },
};

/** Normaliza para comparação de redes (case/acento/espaço-insensível). */
export function normalizeNetwork(value?: string): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function useSupervisorNetwork(): string {
  return useSyncExternalStore(netSubscribe, netSnapshot, () => "");
}
