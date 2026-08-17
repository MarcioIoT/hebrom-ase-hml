import { useMemo } from "react";
import { Link } from "@tanstack/react-router";
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
  ArrowRight,
  Layers,
  Trash2,
  FileSpreadsheet,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildNetworkSummary } from "@/lib/network-scoring";
import { supervisorStore, type SupervisorReport } from "@/lib/supervisor-store";
import { Gauge } from "@/components/dashboard/gauge";
import {
  PurposeRadar,
  RankingBar,
  DistributionBar,
  MiniRadar,
} from "@/components/dashboard/charts";

export function NetworkOverview({
  reports,
  network,
}: {
  reports: SupervisorReport[];
  network: string;
}) {
  const s = useMemo(() => buildNetworkSummary(reports), [reports]);


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
            <Layers className="size-3.5" /> Visão geral da rede
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold">{network}</h1>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span>{s.groupCount} grupo(s)</span>
            <span>{s.memberCount} membro(s) avaliado(s)</span>
            <span>de {s.totalMembers} cadastrado(s)</span>
          </div>

        </div>

        <div className="justify-self-center lg:justify-self-end">
          <Gauge
            value={s.overallAvg}
            color={s.level.color}
            label={s.level.label}
            sublabel="Saúde da Rede"
          />
        </div>
      </motion.section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          icon={<Layers className="size-5" />}
          title="Grupos"
          value={String(s.groupCount)}
          hint="arquivos importados"
          accent="var(--color-primary)"
        />
        <StatCard
          icon={<Users className="size-5" />}
          title="Avaliados"
          value={String(s.memberCount)}
          hint={`de ${s.totalMembers} membros`}
          accent="var(--color-score-4)"
        />
        <StatCard
          icon={<TrendingUp className="size-5" />}
          title="Média da rede"
          value={`${s.overallAvg}%`}
          hint={s.level.label}
          accent={s.level.color}
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
          icon={<ShieldAlert className="size-5" />}
          title="Prioritários"
          value={String(s.priorityCount)}
          hint={`${s.attentionCount} em atenção`}
          accent="var(--color-score-1)"
        />
      </section>

      {/* Radar + insights */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-display font-semibold">Radar da rede</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Média dos cinco propósitos considerando todos os grupos.
          </p>
          <PurposeRadar
            data={s.purposes.map((p) => ({ purpose: p.name, value: p.pct }))}
          />
        </div>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="inline-flex items-center gap-1.5 font-display font-semibold">
            <Sparkles className="size-4 text-primary" /> Leitura da rede
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
            Onde a rede está mais desenvolvida e onde investir.
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
          <h3 className="font-display font-semibold">Distribuição da rede</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Quantos membros em cada faixa, somando todos os grupos.
          </p>
          <DistributionBar data={s.distribution} />
        </div>
      </section>

      {/* Groups */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">
            Grupos da rede
          </h3>
          <span className="text-xs text-muted-foreground">
            Do mais prioritário ao mais saudável
          </span>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {s.groups.map((g) => (
            <div
              key={g.id}
              className="group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="truncate font-display font-semibold">
                    {g.summary.name}
                  </h4>
                  <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <User className="size-3" /> {g.conductor}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Layers className="size-3" /> {g.network}
                    </span>
                  </div>
                </div>
                <div
                  className="grid size-12 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums"
                  style={{
                    color: g.level.color,
                    backgroundColor: `color-mix(in oklab, ${g.level.color} 14%, transparent)`,
                  }}
                >
                  {g.summary.overallAvg}%
                </div>
              </div>

              <MiniRadar
                data={g.summary.purposes.map((p) => ({
                  purpose: p.name,
                  value: p.pct,
                }))}
                color={g.level.color}
                height={128}
              />

              <div className="mt-1 flex flex-wrap gap-1.5 text-[0.7rem] text-muted-foreground">
                <span className="rounded-full border px-2 py-0.5">
                  {g.summary.memberCount} avaliados
                </span>
                <span className="rounded-full border px-2 py-0.5">
                  🟢 {g.summary.healthyCount}
                </span>
                <span className="rounded-full border px-2 py-0.5">
                  🔴 {g.summary.priorityCount}
                </span>
                {g.anonymized && (
                  <span className="rounded-full border px-2 py-0.5">
                    anonimizado
                  </span>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/supervisor/grupo/$id" params={{ id: g.id }}>
                    Ver grupo <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <button
                  onClick={() => supervisorStore.remove(g.id)}
                  className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                  aria-label={`Remover ${g.summary.name}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              {g.fileName && (
                <div className="mt-2 inline-flex items-center gap-1 truncate text-[0.7rem] text-muted-foreground">
                  <FileSpreadsheet className="size-3 shrink-0" />
                  <span className="truncate">{g.fileName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Priority members across the network */}
      {s.priorityMembers.length > 0 && (
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="inline-flex items-center gap-1.5 font-display text-lg font-semibold">
            <HeartPulse className="size-5 text-primary" /> Membros que precisam
            de cuidado
          </h3>
          <p className="mb-4 text-xs text-muted-foreground">
            Priorizados por menor índice de saúde espiritual em toda a rede.
          </p>
          <ul className="divide-y">
            {s.priorityMembers.map((m) => (
              <li
                key={`${m.groupId}-${m.memberId}`}
                className="flex items-center gap-3 py-2.5"
              >
                <span aria-hidden>{m.status.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{m.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {m.groupName} · {m.conductor}
                  </div>
                </div>
                <span
                  className="shrink-0 text-sm font-bold tabular-nums"
                  style={{ color: m.level.color }}
                >
                  {m.overallScore}%
                </span>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/supervisor/grupo/$id" params={{ id: m.groupId }}>
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}
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
      <div className="mt-3 truncate font-display text-xl font-bold" title={value}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}
