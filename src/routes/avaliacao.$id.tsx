import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  UserPlus,
  Flag,
  Keyboard,
  Lock,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { store, useAssessment } from "@/lib/ase-store";
import { REDES } from "@/lib/ase-types";
import { MatrixGrid } from "@/components/ase/matrix-grid";
import { ProgressStats } from "@/components/ase/progress-stats";
import { SummaryDialog } from "@/components/ase/summary-dialog";
import { ThemeToggle } from "@/components/ase/theme-toggle";

export const Route = createFileRoute("/avaliacao/$id")({
  component: AssessmentPage,
});

function AssessmentPage() {
  const { id } = useParams({ from: "/avaliacao/$id" });
  const assessment = useAssessment(id);
  const [summaryOpen, setSummaryOpen] = useState(false);

  if (!assessment) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-muted-foreground">Avaliação não encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/matrix">

            <ArrowLeft className="size-4" /> Voltar
          </Link>
        </Button>
      </div>
    );
  }

  const locked = !!assessment.finishedAt;

  return (
    <div className="flex h-[100dvh] flex-col bg-background">
      {/* Top bar */}
      <header className="pt-safe z-40 shrink-0 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="shrink-0 text-muted-foreground"
            >
              <Link to="/matrix">
                <ArrowLeft className="size-5" />
              </Link>
            </Button>

            <div className="min-w-0">
              <Input
                value={assessment.name}
                disabled={locked}
                onChange={(e) => store.rename(assessment.id, e.target.value)}
                className="h-8 truncate border-transparent bg-transparent px-1 font-display text-base font-bold shadow-none focus-visible:border-input hover:bg-muted/50"
              />
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <span>Rede:</span>
                  <select
                    value={assessment.network ?? ""}
                    disabled={locked}
                    onChange={(e) =>
                      store.setNetwork(assessment.id, e.target.value)
                    }
                    className="max-w-[9rem] bg-transparent outline-none focus:text-foreground disabled:opacity-100"
                  >
                    <option value="">adicionar</option>
                    {REDES.map((r) => (
                      <option key={r} value={r} className="text-foreground">
                        {r}
                      </option>
                    ))}
                  </select>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span>Supervisor:</span>
                  <input
                    value={assessment.supervisor ?? ""}
                    disabled={locked}
                    onChange={(e) =>
                      store.setSupervisor(assessment.id, e.target.value)
                    }
                    placeholder="adicionar"
                    className="w-24 bg-transparent outline-none placeholder:italic focus:text-foreground"
                  />
                </span>
                <span className="inline-flex items-center gap-1">
                  <span>Condutor:</span>
                  <input
                    value={assessment.conductor}
                    disabled={locked}
                    onChange={(e) =>
                      store.setConductor(assessment.id, e.target.value)
                    }
                    placeholder="adicionar"
                    className="w-24 bg-transparent outline-none placeholder:italic focus:text-foreground"
                  />
                </span>
                {locked && (
                  <span className="inline-flex items-center gap-1 text-healthy">
                    <Lock className="size-3" /> Finalizada
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <KeyboardHelp />
              <ThemeToggle />
              {!locked && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => store.addMember(assessment.id)}
                  className="hidden sm:inline-flex"
                >
                  <UserPlus className="size-4" /> Membro
                </Button>
              )}
              <Button size="sm" onClick={() => setSummaryOpen(true)}>
                <Flag className="size-4" />
                <span className="hidden sm:inline">
                  {locked ? "Resumo" : "Finalizar"}
                </span>
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <ProgressStats assessment={assessment} />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full min-h-0 max-w-7xl flex-1 flex-col px-4 py-4 sm:px-6">
        {assessment.members.length === 0 ? (
          <EmptyMembers onAdd={() => store.addMember(assessment.id)} />
        ) : (
          <MatrixGrid assessment={assessment} />
        )}
      </main>

      <SummaryDialog
        assessment={assessment}
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
      />
    </div>
  );
}

function EmptyMembers({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed bg-card/50 px-6 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-accent text-primary">
        <Users className="size-6" />
      </div>
      <div className="font-display font-semibold">Adicione os membros</div>
      <p className="max-w-sm text-sm text-muted-foreground">
        Cada membro vira uma coluna da matriz. Adicione todos os membros do grupo
        para gerar a avaliação.
      </p>
      <Button onClick={onAdd} className="mt-1">
        <UserPlus className="size-4" /> Adicionar membro
      </Button>
    </div>
  );
}

function KeyboardHelp() {
  const rows: [string, string][] = [
    ["1 – 5", "Definir a nota e avançar"],
    ["Tab / →", "Próximo membro"],
    ["Shift+Tab / ←", "Membro anterior"],
    ["Enter / ↓", "Próxima pergunta"],
    ["0 / Backspace", "Limpar a nota"],
  ];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground"
          aria-label="Atalhos de teclado"
        >
          <Keyboard className="size-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <div className="mb-2 font-display text-sm font-semibold">
          Atalhos de teclado
        </div>
        <div className="grid gap-1.5">
          {rows.map(([k, d]) => (
            <div key={k} className="flex items-center justify-between gap-3 text-sm">
              <kbd className="rounded border bg-muted px-1.5 py-0.5 text-xs font-medium">
                {k}
              </kbd>
              <span className="text-muted-foreground">{d}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
