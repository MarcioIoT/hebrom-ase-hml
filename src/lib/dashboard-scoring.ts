import type { Assessment, PurposeId } from "./ase-types";
import type {
  DashAssessment,
  DashInsight,
  DashInsights,
  DashPurpose,
} from "./dashboard-types";
import { PURPOSES, QUESTIONS_BY_PURPOSE, SCORE_LABELS } from "./ase-content";

// ---------------------------------------------------------------------------
// Score scale (1..5) — never shown as a bare number.
// ---------------------------------------------------------------------------

export const SCORE_META: Record<
  number,
  { label: string; color: string; barClass: string; textClass: string }
> = {
  1: { label: SCORE_LABELS[1], color: "var(--color-score-1)", barClass: "bg-score-1", textClass: "text-score-1" },
  2: { label: SCORE_LABELS[2], color: "var(--color-score-2)", barClass: "bg-score-2", textClass: "text-score-2" },
  3: { label: SCORE_LABELS[3], color: "var(--color-score-3)", barClass: "bg-score-3", textClass: "text-score-3" },
  4: { label: SCORE_LABELS[4], color: "var(--color-score-4)", barClass: "bg-score-4", textClass: "text-score-4" },
  5: { label: SCORE_LABELS[5], color: "var(--color-score-5)", barClass: "bg-score-5", textClass: "text-score-5" },
};

export function scoreComment(answer: number): string {
  switch (answer) {
    case 1:
      return "Área crítica: precisa de discipulado intencional e cuidado próximo nas próximas semanas.";
    case 2:
      return "Ponto de atenção: há necessidade clara de crescimento e acompanhamento nesta área.";
    case 3:
      return "Em desenvolvimento: descreve parcialmente e pode avançar bem com apoio e prática.";
    case 4:
      return "Boa evidência, porém ainda existe espaço para amadurecer e consolidar o hábito.";
    case 5:
      return "Excelente: demonstra maturidade consistente e pode servir de referência para outros.";
    default:
      return "";
  }
}

// ---------------------------------------------------------------------------
// Overall health level + attention level.
// ---------------------------------------------------------------------------

export interface HealthLevel {
  label: string;
  tone: "green" | "lime" | "yellow" | "orange" | "red";
  color: string;
}

export function healthLevel(pct: number): HealthLevel {
  if (pct >= 85) return { label: "Excelente", tone: "green", color: "var(--color-score-5)" };
  if (pct >= 70) return { label: "Saudável", tone: "lime", color: "var(--color-score-4)" };
  if (pct >= 50) return { label: "Em crescimento", tone: "yellow", color: "var(--color-score-3)" };
  if (pct >= 30) return { label: "Requer atenção", tone: "orange", color: "var(--color-score-2)" };
  return { label: "Crítico", tone: "red", color: "var(--color-score-1)" };
}

export interface AttentionLevel {
  label: "Baixo" | "Médio" | "Alto" | "Muito Alto";
  color: string;
  barClass: string;
}

export function attentionLevel(pct: number): AttentionLevel {
  if (pct >= 85) return { label: "Baixo", color: "var(--color-score-5)", barClass: "bg-score-5" };
  if (pct >= 70) return { label: "Médio", color: "var(--color-score-3)", barClass: "bg-score-3" };
  if (pct >= 50) return { label: "Alto", color: "var(--color-score-2)", barClass: "bg-score-2" };
  return { label: "Muito Alto", color: "var(--color-score-1)", barClass: "bg-score-1" };
}

export function purposePct(p: DashPurpose): number {
  const max = p.questions.length * 5;
  return max > 0 ? Math.round((p.score / max) * 100) : 0;
}

export function overallFromPurposes(purposes: DashPurpose[]): number {
  const total = purposes.reduce((s, p) => s + p.score, 0);
  const max = purposes.reduce((s, p) => s + p.questions.length * 5, 0);
  return max > 0 ? Math.round((total / max) * 100) : 0;
}

// ---------------------------------------------------------------------------
// Build a dashboard from a Matrix assessment + member (integration point).
// ---------------------------------------------------------------------------

export function purposeName(id: PurposeId): string {
  return PURPOSES.find((p) => p.id === id)?.name ?? id;
}

export function buildDashboardFromMatrix(
  a: Assessment,
  memberId: string,
): Omit<DashAssessment, "id" | "createdAt" | "updatedAt"> {
  const member = a.members.find((m) => m.id === memberId);
  const purposes: DashPurpose[] = PURPOSES.map((p) => {
    const qs = QUESTIONS_BY_PURPOSE[p.id];
    const questions = qs.map((q) => {
      const answer = a.scores[memberId]?.[q.id] ?? 0;
      return {
        question: q.text,
        answer,
        observation: answer ? scoreComment(answer) : undefined,
      };
    });
    const score = questions.reduce((s, q) => s + q.answer, 0);
    const note = a.notes?.[memberId]?.[p.id];
    return { id: p.id, name: p.name, score, questions, note };
  });

  return {
    memberName: member?.name ?? "Membro",
    conductorName: a.conductor || "—",
    network: a.network || "",
    supervisor: a.supervisor || undefined,
    date: a.finishedAt ?? a.updatedAt,
    duration: "",
    overallScore: overallFromPurposes(purposes),
    purposes,
    history: [],
    source: "matrix",
    matrixAssessmentId: a.id,
    matrixMemberId: memberId,
  };
}

// ---------------------------------------------------------------------------
// Deterministic insights + action plan (instant, offline fallback).
// ---------------------------------------------------------------------------

const PURPOSE_ACTIONS: Record<PurposeId, string[]> = {
  adoracao: [
    "Incentivar um tempo devocional diário curto e consistente",
    "Sugerir um plano de leitura bíblica para as próximas semanas",
  ],
  comunhao: [
    "Agendar uma conversa individual de acolhimento",
    "Estimular a participação ativa e a prestação de contas no grupo",
  ],
  discipulado: [
    "Definir juntos um próximo passo espiritual concreto",
    "Acompanhar de perto uma disciplina espiritual específica",
  ],
  ministerio: [
    "Delegar uma pequena responsabilidade dentro do grupo",
    "Ajudar a identificar e usar os dons pessoais no serviço",
  ],
  evangelismo: [
    "Orar juntos por uma pessoa que ainda não conhece Jesus",
    "Convidar para um treinamento prático de evangelismo",
  ],
};

export function buildAutoInsights(d: {
  purposes: DashPurpose[];
  overallScore: number;
  memberName: string;
}): DashInsights {
  const ranked = [...d.purposes].sort(
    (a, b) => purposePct(b) - purposePct(a),
  );
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const first = d.memberName.split(" ")[0] || "O membro";

  const summary: DashInsight[] = [];
  if (strongest) {
    summary.push({
      kind: "positive",
      text: `${first} demonstra força em ${strongest.name.toLowerCase()} (${purposePct(strongest)}%), um ponto sólido para valorizar e multiplicar.`,
    });
  }
  if (weakest && weakest.id !== strongest?.id) {
    summary.push({
      kind: "warning",
      text: `Há sinais de dificuldade em ${weakest.name.toLowerCase()} (${purposePct(weakest)}%), a área que mais precisa de discipulado no momento.`,
    });
  }
  summary.push({
    kind: "tip",
    text:
      d.overallScore >= 70
        ? "Boa saúde espiritual geral — mantenha o acompanhamento e proponha novos desafios de crescimento."
        : "Recomenda-se trabalhar de forma intencional as disciplinas espirituais nas próximas semanas.",
  });

  const actions = weakest
    ? [...PURPOSE_ACTIONS[weakest.id]]
    : ["Agendar uma conversa individual"];
  if (strongest && strongest.id !== weakest?.id) {
    actions.push(PURPOSE_ACTIONS[strongest.id][1]);
  }
  actions.push("Registrar a próxima avaliação para acompanhar a evolução");

  return { summary, actions, generatedBy: "auto" };
}

/** Flatten every question with its purpose, sorted worst-first. */
export function worstQuestions(d: DashAssessment, limit = 5) {
  const flat = d.purposes.flatMap((p) =>
    p.questions.map((q) => ({ ...q, purpose: p.name, purposeId: p.id })),
  );
  return flat
    .filter((q) => q.answer > 0)
    .sort((a, b) => a.answer - b.answer)
    .slice(0, limit);
}
