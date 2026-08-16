import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Trophy,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Lightbulb,
  Clock,
  CalendarDays,
  Network as NetworkIcon,
  User,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import type { DashAssessment, DashInsights } from "@/lib/dashboard-types";
import type { PurposeId } from "@/lib/ase-types";
import {
  attentionLevel,
  healthLevel,
  purposePct,
  worstQuestions,
  buildAutoInsights,
} from "@/lib/dashboard-scoring";
import { dashStore } from "@/lib/dashboard-store";
import { generateInsights } from "@/lib/ase-insights.functions";
import { useShare } from "@/lib/share-context";
import { Gauge } from "./gauge";
import { ScoreBar } from "./score-bar";
import { PurposeRadar, TimelineChart } from "./charts";

const PURPOSE_DESC: Record<PurposeId, string> = {
  comunhao: "Você foi criado para a família de Deus.",
  discipulado: "Você foi criado para se tornar semelhante a Cristo.",
  ministerio: "Você foi formado para servir a Deus.",
  evangelismo: "Você foi feito para uma missão.",
  adoracao: "Você foi feito para agradar a Deus.",
};


function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export function DashboardView({ d }: { d: DashAssessment }) {
  const share = useShare();
  const readOnly = share?.readOnly ?? false;
  const overall = healthLevel(d.overallScore);
  const attention = attentionLevel(d.overallScore);

  const ranked = useMemo(
    () => [...d.purposes].sort((a, b) => purposePct(b) - purposePct(a)),
    [d.purposes],
  );
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];

  const radarData = d.purposes.map((p) => ({
    purpose: p.name,
    value: purposePct(p),
  }));

  const insights =
    d.insights ??
    buildAutoInsights({
      purposes: d.purposes,
      overallScore: d.overallScore,
      memberName: d.memberName,
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid gap-6 rounded-2xl border bg-card p-5 shadow-soft sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
      >
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar className="size-16 shrink-0 border">
            <AvatarFallback className="bg-accent text-lg font-semibold text-accent-foreground">
              {initials(d.memberName) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate font-display text-2xl font-bold">
              {d.memberName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <User className="size-3.5" /> {d.conductorName}
              </span>
              {d.network && (
                <span className="inline-flex items-center gap-1.5">
                  <NetworkIcon className="size-3.5" /> {d.network}
                </span>
              )}
              {d.supervisor && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="size-3.5" /> {d.supervisor}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {new Date(d.date).toLocaleDateString("pt-BR")}
              </span>
              {d.duration && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="size-3.5" /> {d.duration}
                </span>
              )}
            </div>
            <div className="mt-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold"
                style={{
                  color: overall.color,
                  borderColor: overall.color,
                  backgroundColor: `color-mix(in oklab, ${overall.color} 12%, transparent)`,
                }}
              >
                <span
                  className="size-1.5 rounded-full"
                  style={{ backgroundColor: overall.color }}
                />
                {overall.label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-self-center lg:justify-self-end">
          <Gauge
            value={d.overallScore}
            color={overall.color}
            label={overall.label}
            sublabel="Saúde Espiritual Geral"
          />
        </div>
      </motion.section>

      {/* Top cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<TrendingUp className="size-5" />}
          title="Pontuação Geral"
          value={`${d.overallScore}%`}
          hint={overall.label}
          accent={overall.color}
        />
        <StatCard
          icon={<Trophy className="size-5" />}
          title="Maior Fortaleza"
          value={strongest?.name ?? "—"}
          hint={strongest ? `${purposePct(strongest)}% de saúde` : ""}
          accent="var(--color-score-5)"
        />
        <StatCard
          icon={<AlertTriangle className="size-5" />}
          title="Maior Necessidade"
          value={weakest?.name ?? "—"}
          hint={weakest ? `${purposePct(weakest)}% de saúde` : ""}
          accent="var(--color-score-2)"
        />
        <StatCard
          icon={<ShieldAlert className="size-5" />}
          title="Nível de Atenção"
          value={attention.label}
          hint="Prioridade de discipulado"
          accent={attention.color}
        />
      </section>

      {/* Purpose tabs */}
      <section className="rounded-2xl border bg-card p-4 shadow-soft sm:p-5">
        <Tabs defaultValue={d.purposes[0]?.id}>
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1 bg-muted/60 p-1">
            {d.purposes.map((p) => (
              <TabsTrigger
                key={p.id}
                value={p.id}
                className="data-[state=active]:shadow-soft"
              >
                {p.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {d.purposes.map((p) => {
            const pct = purposePct(p);
            const lvl = healthLevel(pct);
            return (
              <TabsContent key={p.id} value={p.id} className="mt-5">
                <div className="grid gap-5 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-start">
                  <div className="flex flex-col items-center gap-2 rounded-xl border bg-muted/30 p-4">
                    <Gauge
                      value={pct}
                      size={120}
                      stroke={10}
                      color={lvl.color}
                    />
                    <span className="text-xs font-medium" style={{ color: lvl.color }}>
                      {lvl.label}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{p.name}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {PURPOSE_DESC[p.id]}
                    </p>
                    {p.note && (
                      <div className="mt-3 rounded-xl border bg-accent/30 p-3">
                        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Observação do condutor
                        </div>
                        <p className="whitespace-pre-wrap text-sm">{p.note}</p>
                      </div>
                    )}
                    <div className="mt-4 space-y-3">
                      {p.questions.map((q, i) => (
                        <div
                          key={i}
                          className="rounded-xl border bg-background/50 p-3"
                        >
                          <p className="text-sm font-medium">{q.question}</p>
                          <div className="mt-2">
                            <ScoreBar answer={q.answer} />
                          </div>
                          {q.observation && (
                            <p className="mt-2 text-xs text-muted-foreground">
                              {q.observation}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </section>

      {/* Radar */}
      <section>
        <div className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-display font-semibold">Radar dos propósitos</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            Identifique rapidamente os desequilíbrios entre os cinco propósitos.
          </p>
          <PurposeRadar data={radarData} />
        </div>
      </section>

      {/* Timeline */}
      {d.history.length > 1 && (
        <section className="rounded-2xl border bg-card p-5 shadow-soft">
          <h3 className="font-display font-semibold">Linha do tempo</h3>
          <p className="mb-3 text-xs text-muted-foreground">
            Evolução da saúde espiritual ao longo das avaliações.
          </p>
          <TimelineChart
            data={d.history.map((h) => ({
              label: new Date(h.date).toLocaleDateString("pt-BR", {
                month: "short",
                year: "2-digit",
              }),
              score: h.score,
            }))}
          />
        </section>
      )}

      {/* Insights + action plan */}
      <section className="grid gap-4 lg:grid-cols-2">
        <InsightsCard d={d} insights={insights} readOnly={readOnly} />
        <ActionPlanCard actions={insights.actions} />
      </section>
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
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
      </div>
      <div className="mt-3 truncate font-display text-xl font-bold" title={value}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </motion.div>
  );
}


const INSIGHT_META = {
  positive: { icon: CheckCircle2, cls: "text-score-5", emoji: "✅" },
  warning: { icon: AlertTriangle, cls: "text-score-2", emoji: "⚠️" },
  tip: { icon: Lightbulb, cls: "text-primary", emoji: "💡" },
} as const;

function InsightsCard({
  d,
  insights,
  readOnly = false,
}: {
  d: DashAssessment;
  insights: DashInsights;
  readOnly?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const run = useServerFn(generateInsights);

  async function regenerate() {
    setLoading(true);
    try {
      const lowest = worstQuestions(d, 5).map((q) => ({
        purpose: q.purpose,
        question: q.question,
        answer: q.answer,
      }));
      const result = await run({
        data: {
          memberName: d.memberName,
          overallScore: d.overallScore,
          purposes: d.purposes.map((p) => ({
            name: p.name,
            pct: purposePct(p),
          })),
          lowestQuestions: lowest,
        },
      });
      dashStore.setInsights(d.id, result);
      toast.success("Insights gerados com IA");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível gerar insights");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h3 className="inline-flex items-center gap-1.5 font-display font-semibold">
          <Sparkles className="size-4 text-primary" /> Insights
        </h3>
        {!readOnly && (
          <Button size="sm" variant="outline" onClick={regenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {insights.generatedBy === "ai" ? "Regerar" : "Gerar com IA"}
          </Button>
        )}
      </div>
      <ul className="mt-4 space-y-3">
        {insights.summary.map((s, i) => {
          const meta = INSIGHT_META[s.kind];
          const Icon = meta.icon;
          return (
            <li key={i} className="flex gap-2.5 text-sm">
              <Icon className={cn("mt-0.5 size-4 shrink-0", meta.cls)} />
              <span>{s.text}</span>
            </li>
          );
        })}
      </ul>
      {insights.generatedBy === "auto" && (
        <p className="mt-4 text-[0.7rem] text-muted-foreground">
          Resumo automático. Clique em "Gerar com IA" para uma análise mais rica.
        </p>
      )}
    </div>
  );
}

function ActionPlanCard({ actions }: { actions: string[] }) {
  const [done, setDone] = useState<Record<number, boolean>>({});
  return (
    <div className="rounded-2xl border bg-card p-5 shadow-soft">
      <h3 className="font-display font-semibold">Plano de ação</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Próximos passos sugeridos para a próxima reunião.
      </p>
      <ul className="space-y-2">
        {actions.map((a, i) => (
          <li key={i}>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm transition hover:bg-accent/40",
                done[i] && "opacity-60",
              )}
            >
              <Checkbox
                checked={!!done[i]}
                onCheckedChange={(v) =>
                  setDone((prev) => ({ ...prev, [i]: !!v }))
                }
                className="mt-0.5"
              />
              <span className={cn(done[i] && "line-through")}>{a}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
