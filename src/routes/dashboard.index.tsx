import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  Grid3x3,
  Trash2,
  ArrowRight,
  User,
  Users,
  CalendarDays,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { useAssessments } from "@/lib/ase-store";
import { dashStore, useDashboards } from "@/lib/dashboard-store";
import { buildDashboardFromMatrix, healthLevel } from "@/lib/dashboard-scoring";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardHome,
});

function DashboardHome() {
  const dashboards = useDashboards();
  const groups = useAssessments().filter((a) =>
    a.members.some(
      (m) => a.scores[m.id] && Object.keys(a.scores[m.id]).length > 0,
    ),
  );
  const navigate = useNavigate();
  const [matrixOpen, setMatrixOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <header className="pt-safe sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Button asChild variant="ghost" size="icon" className="text-muted-foreground">
              <Link to="/">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>
            <div
              className="grid size-9 place-items-center rounded-xl text-primary-foreground shadow-soft"
              style={{ backgroundColor: "var(--color-p-discipulado)" }}
            >
              <LayoutDashboard className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold">Dashboard</div>
              <div className="text-xs text-muted-foreground">
                Resultados por membro
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
        <section className="mb-8">
          <button
            onClick={() => setMatrixOpen(true)}
            className="group flex w-full flex-col items-start gap-2 rounded-2xl border bg-card p-6 text-left shadow-soft transition hover:shadow-pop"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-accent text-primary">
              <Grid3x3 className="size-5" />
            </span>
            <div className="font-display font-semibold">Criar a partir da Matriz</div>
            <p className="text-sm text-muted-foreground">
              Gere um dashboard usando as respostas já registradas de um membro no
              módulo Matriz.
            </p>
          </button>
        </section>

        {groups.length > 0 && (
          <section className="mb-8">
            <h2 className="mb-4 font-display text-lg font-semibold">
              Dashboards do Grupo
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((a) => {
                const evaluated = a.members.filter(
                  (m) =>
                    a.scores[m.id] &&
                    Object.keys(a.scores[m.id]).length > 0,
                ).length;
                return (
                  <Link
                    key={a.id}
                    to="/dashboard/grupo/$id"
                    params={{ id: a.id }}
                    className="group flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-pop"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
                        <Users className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-display font-semibold">
                          {a.name}
                        </h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {a.conductor || "Sem condutor"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <User className="size-3.5" /> {evaluated} avaliados
                      </span>
                      <span className="inline-flex items-center gap-1 font-medium text-primary">
                        Ver grupo <ArrowRight className="size-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        <section>

          <h2 className="mb-4 font-display text-lg font-semibold">
            Dashboards salvos
          </h2>
          {dashboards.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center">
              <div className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-primary">
                <Sparkles className="size-6" />
              </div>
              <div className="mt-3 font-display font-semibold">
                Nenhum dashboard ainda
              </div>
              <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                Gere um dashboard a partir de uma avaliação da Matriz para ver
                os resultados aqui.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboards.map((d) => {
                const lvl = healthLevel(d.overallScore);
                return (
                  <div
                    key={d.id}
                    className="group relative flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-pop"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/dashboard/$id"
                        params={{ id: d.id }}
                        className="min-w-0 flex-1"
                      >
                        <h3 className="truncate font-display font-semibold">
                          {d.memberName}
                        </h3>
                        <p className="mt-0.5 inline-flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <User className="size-3" /> {d.conductorName}
                        </p>
                      </Link>
                      <button
                        onClick={() => {
                          if (confirm(`Excluir dashboard de "${d.memberName}"?`))
                            dashStore.remove(d.id);
                        }}
                        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                        aria-label="Excluir"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div
                        className="grid size-14 shrink-0 place-items-center rounded-full text-sm font-bold tabular-nums"
                        style={{
                          color: lvl.color,
                          backgroundColor: `color-mix(in oklab, ${lvl.color} 14%, transparent)`,
                        }}
                      >
                        {d.overallScore}%
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-sm font-semibold"
                          style={{ color: lvl.color }}
                        >
                          {lvl.label}
                        </div>
                        <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <CalendarDays className="size-3" />
                          {new Date(d.date).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="rounded-full border bg-background px-2 py-0.5 text-[0.68rem] text-muted-foreground">
                        {d.source === "pdf" ? "Importado" : d.source === "matrix" ? "Da Matriz" : "Manual"}
                      </span>
                      <Link
                        to="/dashboard/$id"
                        params={{ id: d.id }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Abrir <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <MatrixPicker open={matrixOpen} onOpenChange={setMatrixOpen} />
    </div>
  );
}

function MatrixPicker({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const assessments = useAssessments();
  const navigate = useNavigate();

  const withMembers = assessments.filter((a) => a.members.length > 0);

  function pick(assessmentId: string, memberId: string) {
    const a = assessments.find((x) => x.id === assessmentId);
    if (!a) return;
    const draft = buildDashboardFromMatrix(a, memberId);
    const created = dashStore.create(draft);
    onOpenChange(false);
    navigate({ to: "/dashboard/$id", params: { id: created.id } });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Criar a partir da Matriz</DialogTitle>
          <DialogDescription>
            Escolha o membro para gerar o dashboard com as respostas registradas.
          </DialogDescription>
        </DialogHeader>

        {withMembers.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhuma avaliação com membros encontrada.{" "}
            <Link to="/matrix" className="text-primary hover:underline">
              Abrir a Matriz
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {withMembers.map((a) => (
              <div key={a.id}>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {a.name}
                </div>
                <div className="grid gap-1.5">
                  {a.members.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => pick(a.id, m.id)}
                      className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:bg-accent/50"
                    >
                      <span className="inline-flex items-center gap-2">
                        <User className="size-4 text-muted-foreground" />
                        {m.name}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
