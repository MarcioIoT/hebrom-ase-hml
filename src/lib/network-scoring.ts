import type { Assessment, PurposeId } from "./ase-types";
import { PURPOSES } from "./ase-content";
import { healthLevel, type HealthLevel } from "./dashboard-scoring";
import {
  buildGroupSummary,
  groupMemberStatus,
  type GroupMemberSummary,
  type GroupPurposeStat,
  type GroupSummary,
  type GroupDistributionBucket,
} from "./group-scoring";

// ---------------------------------------------------------------------------
// Network-level (Rede) analytics for the supervisor module. Aggregates the
// group summaries produced by group-scoring so the supervisor can drill down:
// Rede -> Grupo -> Membro -> Pergunta.
// ---------------------------------------------------------------------------

export interface NetworkGroupStat {
  id: string; // report id
  summary: GroupSummary;
  level: HealthLevel;
  conductor: string;
  network: string;
  importedAt?: string;
  fileName?: string;
  anonymized?: boolean;
}

export interface NetworkSummary {
  networks: string[];
  groupCount: number;
  memberCount: number; // avaliados
  totalMembers: number;
  overallAvg: number;
  level: HealthLevel;
  purposes: GroupPurposeStat[];
  ranked: GroupPurposeStat[];
  strongest?: GroupPurposeStat;
  weakest?: GroupPurposeStat;
  healthyCount: number;
  attentionCount: number;
  priorityCount: number;
  distribution: GroupDistributionBucket[];
  groups: NetworkGroupStat[]; // ordenado do menor para o maior score
  priorityMembers: (GroupMemberSummary & {
    groupId: string;
    groupName: string;
    conductor: string;
  })[];
  insights: { summary: string; strengths: string[]; attention: string[] };
}

type Input = (Assessment & {
  fileName?: string;
  importedAt?: string;
  anonymized?: boolean;
})[];

export function buildNetworkSummary(reports: Input): NetworkSummary {
  const groups: NetworkGroupStat[] = reports.map((r) => {
    const summary = buildGroupSummary(r);
    return {
      id: r.id,
      summary,
      level: healthLevel(summary.overallAvg),
      conductor: summary.conductor,
      network: r.network?.trim() || "Sem rede",
      importedAt: r.importedAt,
      fileName: r.fileName,
      anonymized: r.anonymized,
    };
  });

  const allMembers = groups.flatMap((g) =>
    g.summary.members.map((m) => ({
      ...m,
      groupId: g.id,
      groupName: g.summary.name,
      conductor: g.conductor,
    })),
  );

  const memberCount = allMembers.length;
  const totalMembers = groups.reduce((s, g) => s + g.summary.totalMembers, 0);

  const purposes: GroupPurposeStat[] = PURPOSES.map((p) => ({
    id: p.id as PurposeId,
    name: p.name,
    pct: avg(
      allMembers.map((m) => m.purposes.find((x) => x.id === p.id)?.pct ?? 0),
    ),
  }));
  const ranked = [...purposes].sort((a, b) => b.pct - a.pct);
  const overallAvg = avg(allMembers.map((m) => m.overallScore));

  const healthyCount = allMembers.filter(
    (m) => m.status.key === "saudavel",
  ).length;
  const priorityCount = allMembers.filter(
    (m) => m.status.key === "prioritario",
  ).length;
  const attentionCount = allMembers.filter(
    (m) => m.status.key === "atencao",
  ).length;

  const distribution: GroupDistributionBucket[] = [
    {
      label: "Excelente",
      color: "var(--color-score-5)",
      count: allMembers.filter((m) => m.overallScore >= 85).length,
    },
    {
      label: "Bom",
      color: "var(--color-score-4)",
      count: allMembers.filter((m) => m.overallScore >= 70 && m.overallScore < 85)
        .length,
    },
    {
      label: "Em desenvolvimento",
      color: "var(--color-score-3)",
      count: allMembers.filter((m) => m.overallScore >= 50 && m.overallScore < 70)
        .length,
    },
    {
      label: "Necessita acompanhamento",
      color: "var(--color-score-1)",
      count: allMembers.filter((m) => m.overallScore < 50).length,
    },
  ];

  const networks = Array.from(new Set(groups.map((g) => g.network))).sort();

  return {
    networks,
    groupCount: groups.length,
    memberCount,
    totalMembers,
    overallAvg,
    level: healthLevel(overallAvg),
    purposes,
    ranked,
    strongest: ranked[0],
    weakest: ranked[ranked.length - 1],
    healthyCount,
    attentionCount,
    priorityCount,
    distribution,
    groups: [...groups].sort(
      (a, b) => a.summary.overallAvg - b.summary.overallAvg,
    ),
    priorityMembers: allMembers
      .filter((m) => m.status.key !== "saudavel")
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 12),
    insights: buildNetworkInsights({
      overallAvg,
      ranked,
      groups,
      priorityCount,
      memberCount,
    }),
  };
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return Math.round(values.reduce((s, v) => s + v, 0) / values.length);
}

export { groupMemberStatus };

function buildNetworkInsights(input: {
  overallAvg: number;
  ranked: GroupPurposeStat[];
  groups: NetworkGroupStat[];
  priorityCount: number;
  memberCount: number;
}) {
  const { overallAvg, ranked, groups, priorityCount, memberCount } = input;
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  const sorted = [...groups].sort(
    (a, b) => b.summary.overallAvg - a.summary.overallAvg,
  );
  const best = sorted[0];
  const worst = sorted[sorted.length - 1];

  let summary = `A rede reúne ${groups.length} grupo(s) e ${memberCount} membro(s) avaliado(s), com média geral de ${overallAvg}% (${healthLevel(overallAvg).label.toLowerCase()})`;
  if (strongest) summary += `. O propósito mais forte é ${strongest.name} (${strongest.pct}%)`;
  if (weakest && weakest.id !== strongest?.id)
    summary += ` e o de maior oportunidade é ${weakest.name} (${weakest.pct}%)`;
  summary += ".";

  const strengths: string[] = [];
  if (best)
    strengths.push(
      `Grupo destaque: ${best.summary.name} (${best.summary.overallAvg}%) — condutor ${best.conductor}`,
    );
  ranked
    .filter((p) => p.pct >= 65)
    .slice(0, 2)
    .forEach((p) => strengths.push(`Rede forte em ${p.name} (${p.pct}%)`));
  if (strengths.length === 0 && strongest)
    strengths.push(`Melhor área da rede: ${strongest.name} (${strongest.pct}%)`);

  const attention: string[] = [];
  if (worst && groups.length > 1)
    attention.push(
      `Grupo prioritário: ${worst.summary.name} (${worst.summary.overallAvg}%) — condutor ${worst.conductor}`,
    );
  [...ranked]
    .reverse()
    .filter((p) => p.pct < 55)
    .slice(0, 2)
    .forEach((p) => attention.push(`${p.name} abaixo da média (${p.pct}%)`));
  if (priorityCount > 0)
    attention.push(
      `${priorityCount} membro(s) da rede em situação prioritária`,
    );
  if (attention.length === 0)
    attention.push("Nenhuma área crítica identificada na rede.");

  return { summary, strengths, attention };
}
