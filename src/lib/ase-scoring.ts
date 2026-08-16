import type { Assessment, HealthStatus, PurposeId, ScoreValue } from "./ase-types";
import { PURPOSES, QUESTIONS_BY_PURPOSE, QUESTIONS } from "./ase-content";

// Health thresholds mirror the original spreadsheet: >= 80% of the max is
// healthy, >= 40% is growing, otherwise sick. On 7 questions (max 35) this is
// the exact 28 / 14 cutoff from the sheet; expressing it as a percentage keeps
// the logic correct if the number of questions ever changes.
const HEALTHY_RATIO = 0.8;
const GROWING_RATIO = 0.4;

export function statusFromScore(total: number, max: number): HealthStatus {
  if (max <= 0) return "doente";
  const ratio = total / max;
  if (ratio >= HEALTHY_RATIO) return "saudavel";
  if (ratio >= GROWING_RATIO) return "crescendo";
  return "doente";
}

export const STATUS_LABEL: Record<HealthStatus, string> = {
  saudavel: "Saudável",
  crescendo: "Crescendo",
  doente: "Doente",
};

export function getScore(
  a: Assessment,
  memberId: string,
  questionId: string,
): ScoreValue | undefined {
  return a.scores[memberId]?.[questionId];
}

export function purposeTotal(
  a: Assessment,
  memberId: string,
  purposeId: PurposeId,
): number {
  const qs = QUESTIONS_BY_PURPOSE[purposeId];
  let sum = 0;
  for (const q of qs) sum += a.scores[memberId]?.[q.id] ?? 0;
  return sum;
}

export function purposeMax(purposeId: PurposeId): number {
  return QUESTIONS_BY_PURPOSE[purposeId].length * 5;
}

export function purposeStatus(
  a: Assessment,
  memberId: string,
  purposeId: PurposeId,
): HealthStatus {
  return statusFromScore(purposeTotal(a, memberId, purposeId), purposeMax(purposeId));
}

export function memberTotal(a: Assessment, memberId: string): number {
  return PURPOSES.reduce((s, p) => s + purposeTotal(a, memberId, p.id), 0);
}

export function memberMax(): number {
  return QUESTIONS.length * 5;
}

export function memberStatus(a: Assessment, memberId: string): HealthStatus {
  return statusFromScore(memberTotal(a, memberId), memberMax());
}

export interface MemberProgress {
  answered: number;
  total: number;
  ratio: number;
}

export function memberPurposeProgress(
  a: Assessment,
  memberId: string,
  purposeId: PurposeId,
): MemberProgress {
  const qs = QUESTIONS_BY_PURPOSE[purposeId];
  const row = a.scores[memberId] ?? {};
  const answered = qs.filter((q) => row[q.id] != null).length;
  const total = qs.length;
  return { answered, total, ratio: total > 0 ? answered / total : 0 };
}

export function memberOverallProgress(
  a: Assessment,
  memberId: string,
): MemberProgress {
  const total = QUESTIONS.length;
  const row = a.scores[memberId] ?? {};
  const answered = Object.keys(row).length;
  return { answered, total, ratio: total > 0 ? answered / total : 0 };
}

/** Average of member totals for a purpose (spreadsheet "MÉDIA"). */
export function purposeGroupAverage(a: Assessment, purposeId: PurposeId): number {
  if (a.members.length === 0) return 0;
  const sum = a.members.reduce((s, m) => s + purposeTotal(a, m.id, purposeId), 0);
  return sum / a.members.length;
}

export function groupStatus(a: Assessment): HealthStatus {
  if (a.members.length === 0) return "doente";
  const avg =
    a.members.reduce((s, m) => s + memberTotal(a, m.id), 0) / a.members.length;
  return statusFromScore(avg, memberMax());
}

export interface Progress {
  answered: number;
  total: number;
  remaining: number;
  ratio: number;
  etaMinutes: number;
}

// Estimated time to answer the questionnaire: 30 seconds per response to fill
// (one response = one question × one member). The estimate updates automatically
// as members or questions change.
export const SECONDS_PER_QUESTION = 30;

export function estimatedMinutes(
  responseCount: number = QUESTIONS.length,
): number {
  return Math.max(1, Math.round((responseCount * SECONDS_PER_QUESTION) / 60));
}

export function computeProgress(a: Assessment): Progress {
  const total = a.members.length * QUESTIONS.length;
  let answered = 0;
  for (const m of a.members) {
    const row = a.scores[m.id];
    if (row) answered += Object.keys(row).length;
  }
  const remaining = Math.max(0, total - answered);
  return {
    answered,
    total,
    remaining,
    ratio: total > 0 ? answered / total : 0,
    etaMinutes: estimatedMinutes(total),
  };
}
