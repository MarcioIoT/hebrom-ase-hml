import type { PurposeId } from "./ase-types";

// Per-member dashboard model. Matches the interface requested in the brief but
// keeps ids/purposeId so it integrates with the Matrix module and future
// backend sync.

export interface DashQuestion {
  question: string;
  answer: number; // 1..5
  observation?: string;
}

export interface DashPurpose {
  id: PurposeId;
  name: string;
  score: number; // sum of answers within the purpose (max = questions * 5)
  questions: DashQuestion[];
  note?: string; // conductor's free-text observation for this purpose
}

export interface DashHistoryPoint {
  date: string; // ISO
  score: number; // percentage 0..100
}

export type DashSource = "pdf" | "matrix" | "manual";

export interface DashAssessment {
  id: string;
  memberName: string;
  conductorName: string;
  network: string;
  supervisor?: string;
  date: string; // ISO
  duration: string; // e.g. "2 min 22 s"
  overallScore: number; // percentage 0..100
  purposes: DashPurpose[];
  history: DashHistoryPoint[];
  source: DashSource;
  createdAt: string;
  updatedAt: string;
  insights?: DashInsights;
  // Stable link back to the Matrix assessment/member this dashboard came from,
  // so the Group Dashboard can reuse (not duplicate) individual dashboards.
  matrixAssessmentId?: string;
  matrixMemberId?: string;
}

export interface DashInsight {
  kind: "positive" | "warning" | "tip";
  text: string;
}

export interface DashInsights {
  summary: DashInsight[];
  actions: string[];
  generatedBy: "ai" | "auto";
}
