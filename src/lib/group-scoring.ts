import type { Assessment, PurposeId } from "./ase-types";
import { PURPOSES, QUESTIONS_BY_PURPOSE } from "./ase-content";
import { healthLevel, type HealthLevel } from "./dashboard-scoring";

// ---------------------------------------------------------------------------
// Group-level (Pequeno Grupo) analytics computed directly from a Matrix
// assessment. Kept separate from dashboard-scoring so the individual dashboard
// stays untouched. Structured so a future AI summary can replace the
// deterministic `buildGroupInsights` without changing the UI.
// ---------------------------------------------------------------------------

export interface GroupPurposeStat {
  id: PurposeId;
  name: string;
  pct: number; // group-average health for this purpose, 0..100
}

export interface GroupMemberSummary {
  memberId: string;
  name: string;
  overallScore: number; // 0..100
  purposes: { id: PurposeId; name: string; pct: number }[];
  status: GroupMemberStatus;
  level: HealthLevel;
}

export interface GroupMemberStatus {
  key: "saudavel" | "atencao" | "prioritario";
  label: string;
  color: string;
  emoji: string;
}

export interface GroupDistributionBucket {
  label: string;
  count: number;
  color: string;
}

export interface GroupInsights {
  summary: string;
  strengths: string[];
  attention: string[];
  generatedBy: "auto" | "ai";
}

export interface GroupSummary {
  name: string;
  conductor: string;
  network?: string;
  supervisor?: string;
  date: string;
  lastDate: string | null;
  memberCount: number; // evaluated members
  totalMembers: number;
  overallAvg: number;
  purposes: GroupPurposeStat[]; // canonical order
  ranked: GroupPurposeStat[]; // desc by pct
  strongest?: GroupPurposeStat;
  weakest?: GroupPurposeStat;
  healthyCount: number;
  attentionCount: number;
  priorityCount: number;
  members: GroupMemberSummary[];
  distribution: GroupDistributionBucket[];
  insights: GroupInsights;
}

function memberHasAnswers(a: Assessment, memberId: string): boolean {
  const row = a.scores[memberId];
  return !!row && Object.keys(row).length > 0;
}

function purposePctForMember(
  a: Assessment,
  memberId: string,
  purposeId: PurposeId,
): number {
  const qs = QUESTIONS_BY_PURPOSE[purposeId];
  const max = qs.length * 5;
  if (max === 0) return 0;
  let sum = 0;
  for (const q of qs) sum += a.scores[memberId]?.[q.id] ?? 0;
  return Math.round((sum / max) * 100);
}

function overallPctForMember(a: Assessment, memberId: string): number {
  let sum = 0;
  let max = 0;
  for (const p of PURPOSES) {
    const qs = QUESTIONS_BY_PURPOSE[p.id];
    max += qs.length * 5;
    for (const q of qs) sum += a.scores[memberId]?.[q.id] ?? 0;
  }
  return max > 0 ? Math.round((sum / max) * 100) : 0;
}

export function groupMemberStatus(pct: number): GroupMemberStatus {
  if (pct >= 70)
    return {
      key: "saudavel",
      label: "Saudável",
      color: "var(--color-score-5)",
      emoji: "🟢",
    };
  if (pct >= 50)
    return {
      key: "atencao",
      label: "Atenção",
      color: "var(--color-score-3)",
      emoji: "🟡",
    };
  return {
    key: "prioritario",
    label: "Prioritário",
    color: "var(--color-score-1)",
    emoji: "🔴",
  };
}

export function buildGroupSummary(a: Assessment): GroupSummary {
  const evaluated = a.members.filter((m) => memberHasAnswers(a, m.id));

  const members: GroupMemberSummary[] = evaluated
    .map((m) => {
      const overallScore = overallPctForMember(a, m.id);
      return {
        memberId: m.id,
        name: m.name,
        overallScore,
        purposes: PURPOSES.map((p) => ({
          id: p.id,
          name: p.name,
          pct: purposePctForMember(a, m.id, p.id),
        })),
        status: groupMemberStatus(overallScore),
        level: healthLevel(overallScore),
      };
    })
    .sort((x, y) => x.overallScore - y.overallScore); // priority first

  const purposes: GroupPurposeStat[] = PURPOSES.map((p) => {
    const avg =
      members.length > 0
        ? Math.round(
            members.reduce(
              (s, m) => s + (m.purposes.find((x) => x.id === p.id)?.pct ?? 0),
              0,
            ) / members.length,
          )
        : 0;
    return { id: p.id, name: p.name, pct: avg };
  });

  const ranked = [...purposes].sort((x, y) => y.pct - x.pct);
  const overallAvg =
    members.length > 0
      ? Math.round(
          members.reduce((s, m) => s + m.overallScore, 0) / members.length,
        )
      : 0;

  const healthyCount = members.filter((m) => m.status.key === "saudavel").length;
  const priorityCount = members.filter(
    (m) => m.status.key === "prioritario",
  ).length;
  const attentionCount = members.filter(
    (m) => m.status.key !== "saudavel",
  ).length;

  const distribution: GroupDistributionBucket[] = [
    {
      label: "Excelente",
      color: "var(--color-score-5)",
      count: members.filter((m) => m.overallScore >= 85).length,
    },
    {
      label: "Bom",
      color: "var(--color-score-4)",
      count: members.filter((m) => m.overallScore >= 70 && m.overallScore < 85)
        .length,
    },
    {
      label: "Em desenvolvimento",
      color: "var(--color-score-3)",
      count: members.filter((m) => m.overallScore >= 50 && m.overallScore < 70)
        .length,
    },
    {
      label: "Necessita acompanhamento",
      color: "var(--color-score-1)",
      count: members.filter((m) => m.overallScore < 50).length,
    },
  ];

  return {
    name: a.name,
    conductor: a.conductor || "—",
    network: a.network || undefined,
    supervisor: a.supervisor || undefined,
    date: a.finishedAt ?? a.updatedAt,
    lastDate: a.finishedAt ? a.createdAt : null,
    memberCount: members.length,
    totalMembers: a.members.length,
    overallAvg,
    purposes,
    ranked,
    strongest: ranked[0],
    weakest: ranked[ranked.length - 1],
    healthyCount,
    attentionCount,
    priorityCount,
    members,
    distribution,
    insights: buildGroupInsights({
      overallAvg,
      ranked,
      priorityCount,
      memberCount: members.length,
    }),
  };
}

// ---------------------------------------------------------------------------
// Deterministic group summary text (instant fallback for future AI analysis).
// ---------------------------------------------------------------------------

function buildGroupInsights(input: {
  overallAvg: number;
  ranked: GroupPurposeStat[];
  priorityCount: number;
  memberCount: number;
}): GroupInsights {
  const { overallAvg, ranked, priorityCount, memberCount } = input;
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const maturity = healthLevel(overallAvg).label.toLowerCase();

  let summary = `O grupo apresenta ${maturity === "excelente" || maturity === "saudável" ? "boa" : "crescente"} maturidade espiritual (${overallAvg}% de média geral)`;
  if (strongest) {
    summary += `, destacando-se em ${strongest.name} (${strongest.pct}%)`;
  }
  if (weakest && weakest.id !== strongest?.id) {
    summary += `. ${weakest.name} apresenta oportunidade de fortalecimento (${weakest.pct}%), indicando necessidade de investir nessa área nas próximas reuniões`;
  }
  summary += ".";

  const strengths: string[] = [];
  ranked
    .filter((p) => p.pct >= 65)
    .slice(0, 3)
    .forEach((p) => strengths.push(`Forte em ${p.name} (${p.pct}%)`));
  if (strengths.length === 0 && strongest) {
    strengths.push(`Melhor área: ${strongest.name} (${strongest.pct}%)`);
  }
  if (overallAvg >= 70) strengths.push("Grupo participativo e engajado");

  const attention: string[] = [];
  [...ranked]
    .reverse()
    .filter((p) => p.pct < 55)
    .slice(0, 3)
    .forEach((p) => attention.push(`${p.name} abaixo da média (${p.pct}%)`));
  if (priorityCount > 0) {
    attention.push(
      `${priorityCount} membro${priorityCount > 1 ? "s" : ""} ${priorityCount > 1 ? "precisam" : "precisa"} de acompanhamento prioritário`,
    );
  }
  if (attention.length === 0) {
    attention.push("Nenhuma área crítica — manter o acompanhamento regular");
  }
  if (memberCount === 0) {
    attention.push("Ainda não há membros avaliados neste grupo");
  }

  return { summary, strengths, attention, generatedBy: "auto" };
}
