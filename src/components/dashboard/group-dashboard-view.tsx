import { useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Users,
  TrendingUp,
  Trophy,
  AlertTriangle,
  HeartPulse,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  CalendarDays,
  User,
  Network as NetworkIcon,
  ShieldCheck,
  ArrowRight,
  Plus,
  Trash2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { Assessment } from "@/lib/ase-types";
import { buildGroupSummary } from "@/lib/group-scoring";
import { buildDashboardFromMatrix, healthLevel } from "@/lib/dashboard-scoring";
import { dashStore } from "@/lib/dashboard-store";
import { groupPlanStore, useGroupPlan, type GroupAction } from "@/lib/group-plan-store";
import { useShare } from "@/lib/share-context";
import { MiniRadar, PurposeRadar, RankingBar, DistributionBar } from "./charts";
import { Gauge } from "./gauge";

export function GroupDashboardView({ a }: { a: Assessment }) {
  const s = useMemo(() => buildGroupSummary(a), [a]);
  const navigate = useNavigate();
  const share = useShare();
  const overall = healthLevel(s.overallAvg);

  function openMember(memberId: string) {
    if (share?.readOnly) {
      navigate({
        to: "/relatorio",
        search: { d: share.token, membro: memberId },
      });
      return;
    }
    const draft = buildDashboardFromMatrix(a, memberId);
    const d = dashStore.ensureFromMatrix(draft);
    navigate({
      to: "/dashboard/$id",
      params: { id: d.id },
      search: { grupo: a.id },
    });
  }

  const radarData = s.purposes.map((p) => ({ purpose: p.name, value: p.pct }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-6 rounded-2xl border bg-card p-5 shadow-soft sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      >
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" /> Dashboard do Pequeno Grupo
          </span>
          <h1 className="mt-3 truncate font-display text-2xl font-bold">
            {s.name}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5" /> {s.conductor}
            </span>
            {s.network && (
              <span className="inline-flex items-center gap-1.5">
                <NetworkIcon className="size-3.5" /> {s.network}
              </span>
            )}
            {s.supervisor && (
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5" /> {s.supervisor}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" />
              {new Date(s.date).toLocaleDateString("pt-BR")}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users className="size-3.5" /> {s.memberCount} membros avaliados
            </span>
            {s.lastDate && (
              <span className="inline-flex items-center gap-1.5">
                Última: {new Date(s.lastDate).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 justify-self-center lg:justify-self-end">
          <Gauge
            value={s.overallAvg}
            color={overall.color}
            label={overall.label}
            sublabel="Saúde do Grupo"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="print:hidden"
          >
            Exportar Relatório
          </Button>
        </div>
      </motion.section>

      {/* Executive cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Users className="size-5" />}
          title="Avaliados"
          value={String(s.memberCount)}
          hint={`de ${s.totalMembers} membros`}
          accent="var(--color-primary)"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          title="Média geral"
          value={`${s.overallAvg}%`}
          hint={overall.label}
          accent={overall.color}
        />
        <StatCard
          icon={<Trophy className="size-5" />}
          title="Maior propósito"
          value={s.strongest?.name ?? "—"}
          hint={s.strongest ? `${s.strongest.pct}%` : ""}
          accent="var(--color-score-5)"
        />
        <StatCard
          icon={<AlertTriangle className="size-5" />}
          title="Menor propósito"
          value={s.weakest?.name ?? "—"}
          hint={s.weakest ? `${s.weakest.pct}%` : ""}
          accent="var(--color-score-2)"
        />
        <StatCard
          icon={<HeartPulse className="size-5" />}
          title="Saudáveis"
          value={String(s.healthyCount)}
          hint="membros"
          accent="var(--color-score-4)"
        />
        <StatCard
          icon={<ShieldAlert className="size-5" />}
          title="Em atenção"
          value={String(s.attentionCount)}
          hint={`${s.priorityCount} prioritário(s)`}
          accent="var(--color-score-1)"
        />
      </section>

      {/* Radar + intelligent summary */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-display font-semibold">Radar geral do grupo</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            O perfil espiritual do grupo nos cinco propósitos.
          </p>
          <PurposeRadar data={radarData} />
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="inline-flex items-center gap-1.5 font-display font-semibold">
            <Sparkles className="size-4 text-primary" /> Resumo do grupo
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {s.insights.summary}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Pontos fortes
              </div>
              <ul className="space-y-1.5">
                {s.insights.strengths.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-score-5" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Áreas de atenção
              </div>
              <ul className="space-y-1.5">
                {s.insights.attention.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-score-2" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Ranking + distribution */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-display font-semibold">Ranking dos propósitos</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Do mais desenvolvido ao que mais precisa de investimento.
          </p>
          <RankingBar
            data={s.ranked.map((p) => ({
              name: p.name,
              pct: p.pct,
              color: `var(--color-p-${p.id})`,
            }))}
          />
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-display font-semibold">Distribuição das notas</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Quantos membros estão em cada faixa de desenvolvimento.
          </p>
          <DistributionBar data={s.distribution} />
        </div>
      </section>

      {/* Members grid */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">
            Membros do grupo
          </h3>
          <span className="text-xs text-muted-foreground">
            Clique em um membro para ver o dashboard individual
          </span>
        </div>
        {s.members.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center text-sm text-muted-foreground">
            Nenhum membro avaliado ainda. Preencha as respostas na Matriz.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {s.members.map((m) => (
              <button
                key={m.memberId}
                onClick={() => openMember(m.memberId)}
                className="group flex flex-col rounded-2xl border bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="truncate font-display font-semibold">
                      {m.name}
                    </h4>
                    <span
                      className="mt-1 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[0.7rem] font-semibold"
                      style={{
                        color: m.status.color,
                        borderColor: m.status.color,
                        backgroundColor: `color-mix(in oklab, ${m.status.color} 12%, transparent)`,
                      }}
                    >
                      <span aria-hidden>{m.status.emoji}</span>
                      {m.status.label}
                    </span>
                  </div>
                  <div
                    className="grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums"
                    style={{
                      color: m.level.color,
                      backgroundColor: `color-mix(in oklab, ${m.level.color} 14%, transparent)`,
                    }}
                  >
                    {m.overallScore}%
                  </div>
                </div>

                <div className="mt-2">
                  <MiniRadar
                    data={m.purposes.map((p) => ({
                      purpose: p.name,
                      value: p.pct,
                    }))}
                    color={m.status.color}
                    height={128}
                  />
                </div>

                <div className="mt-2 flex items-center justify-between text-sm font-medium text-primary">
                  <span className="text-xs text-muted-foreground">
                    {m.level.label}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    Abrir <ArrowRight className="size-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Group action plan */}
      <GroupPlanCard
        groupId={a.id}
        readOnly={share?.readOnly}
        sharedActions={share?.planActions}
      />
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  hint,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  hint?: string;
  accent: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="rounded-2xl border bg-card p-4 shadow-soft"
    >
      <div className="flex items-center gap-2">
        <span
          className="grid size-9 place-items-center rounded-xl"
          style={{
            color: accent,
            backgroundColor: `color-mix(in oklab, ${accent} 14%, transparent)`,
          }}
        >
          {icon}
        </span>
        <span className="text-xs font-medium text-muted-foreground">
          {title}
        </span>
      </div>
      <div
        className="mt-3 truncate font-display text-xl font-bold"
        title={value}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}

const SUGGESTED = [
  "Fortalecer a comunhão do grupo",
  "Criar duplas de discipulado",
  "Promover evangelismo coletivo",
  "Incentivar participação ministerial",
  "Realizar encontros individuais",
];

function GroupPlanCard({
  groupId,
  readOnly = false,
  sharedActions,
}: {
  groupId: string;
  readOnly?: boolean;
  sharedActions?: GroupAction[];
}) {
  const storeActions = useGroupPlan(groupId);
  const [text, setText] = useState("");
  const actions = readOnly ? (sharedActions ?? []) : storeActions;

  function add(value: string) {
    groupPlanStore.add(groupId, value);
    setText("");
  }

  // In a shared (read-only) report with no registered actions there is nothing
  // to show — keep the layout clean for the supervisor.
  if (readOnly && actions.length === 0) return null;

  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft print:hidden">
      <h3 className="inline-flex items-center gap-1.5 font-display text-lg font-semibold">
        <ListChecks className="size-5 text-primary" /> Plano de Desenvolvimento
        do Grupo
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        {readOnly
          ? "Ações pastorais registradas pelo condutor para todo o Pequeno Grupo."
          : "Registre ações pastorais para todo o Pequeno Grupo. Ficam salvas para acompanhamento futuro."}
      </p>

      {!readOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            add(text);
          }}
          className="flex gap-2"
        >
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Adicionar ação pastoral…"
            className="h-9"
          />
          <Button type="submit" size="sm" disabled={!text.trim()}>
            <Plus className="size-4" /> Adicionar
          </Button>
        </form>
      )}

      {actions.length > 0 && (
        <ul className="mt-4 space-y-2">
          {actions.map((act) => (
            <li key={act.id}>
              <div
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 text-sm transition",
                  act.done && "opacity-60",
                )}
              >
                <Checkbox
                  checked={act.done}
                  disabled={readOnly}
                  onCheckedChange={
                    readOnly
                      ? undefined
                      : () => groupPlanStore.toggle(groupId, act.id)
                  }
                  className="mt-0.5"
                />
                <span className={cn("flex-1", act.done && "line-through")}>
                  {act.text}
                </span>
                {!readOnly && (
                  <button
                    onClick={() => groupPlanStore.remove(groupId, act.id)}
                    className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                    aria-label="Remover"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!readOnly && (
        <div className="mt-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Sugestões rápidas
          </div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.filter(
              (sug) => !actions.some((a) => a.text === sug),
            ).map((sug) => (
              <button
                key={sug}
                onClick={() => add(sug)}
                className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:text-foreground"
              >
                <Plus className="size-3" /> {sug}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
