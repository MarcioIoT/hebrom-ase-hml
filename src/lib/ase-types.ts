// Core domain types for the ASE (Avaliação de Saúde Espiritual) system.
// Designed for future evolution: every score carries full context so it can
// later be synced to a backend, aggregated across assessments, or fed to AI.

export type ScoreValue = 1 | 2 | 3 | 4 | 5;

export type HealthStatus = "saudavel" | "crescendo" | "doente";

export type PurposeId =
  | "adoracao"
  | "comunhao"
  | "discipulado"
  | "ministerio"
  | "evangelismo";

export interface Purpose {
  id: PurposeId;
  name: string;
  order: number;
}

export interface Question {
  id: string;
  purposeId: PurposeId;
  order: number;
  text: string;
  verseRef?: string;
  verseText?: string;
}


export interface Member {
  id: string;
  name: string;
}

/** scores[memberId][questionId] = 1..5 */
export type ScoreMap = Record<string, Record<string, ScoreValue>>;

/** notes[memberId][purposeId] = free-text observation for that purpose */
export type NotesMap = Record<string, Record<string, string>>;

export const REDES = [
  "Aliança",
  "Cesto",
  "Forjados",
  "Grão de Mostarda",
  "Pães e Peixe",
  "Peregrinos",
  "Resgate",
  "Transformados",
] as const;

export type Rede = (typeof REDES)[number];

export interface Assessment {
  id: string;
  name: string;
  network?: string;
  supervisor?: string;
  conductor: string;
  createdAt: string;
  updatedAt: string;
  finishedAt: string | null;
  members: Member[];
  scores: ScoreMap;
  notes?: NotesMap;
}
