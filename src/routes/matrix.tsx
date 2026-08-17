import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Users,
  Calendar,
  MoreVertical,
  Copy,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Grid3x3,
  UsersRound,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { store, useAssessments } from "@/lib/ase-store";
import { computeProgress, groupStatus } from "@/lib/ase-scoring";
import { PURPOSES, TOTAL_QUESTIONS } from "@/lib/ase-content";
import { StatusBadge } from "@/components/ase/status-badge";
import { CreateAssessmentDialog } from "@/components/ase/create-assessment-dialog";
import { ThemeToggle } from "@/components/ase/theme-toggle";
import { GroupDialog } from "@/components/ase/group-dialog";
import { ImportExcelButton } from "@/components/ase/import-excel-button";
import { groupStore, useGroups, type Group } from "@/lib/group-store";

export const Route = createFileRoute("/matrix")({
  head: () => ({
    meta: [
      { title: "Matriz · Avaliação de Saúde Espiritual" },
      {
        name: "description",
        content:
          "Avalie vários membros do Pequeno Grupo em minutos com a matriz por pergunta, navegação de teclado e salvamento automático.",
      },
    ],
  }),
  component: MatrixHome,
});

function MatrixHome() {
  const assessments = useAssessments();
  const [open, setOpen] = useState(false);
  const groups = useGroups();
  const [groupOpen, setGroupOpen] = useState(false);
  const [editing, setEditing] = useState<Group | null>(null);

  const openGroup = (g: Group | null) => {
    setEditing(g);
    setGroupOpen(true);
  };

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
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <Grid3x3 className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-base font-bold">Matriz</div>
              <div className="text-xs text-muted-foreground">
                Avaliação por pergunta
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5" /> Para condutores de Pequenos Grupos
          </span>
          <h1 className="mt-4 max-w-2xl font-display text-3xl font-bold leading-tight sm:text-4xl">
            Avalie a saúde espiritual de todo o grupo em minutos.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Uma pergunta por vez, todos os membros na mesma tela. Navegação por
            teclado como no Excel e salvamento automático — {TOTAL_QUESTIONS}{" "}
            perguntas nos cinco propósitos bíblicos.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button size="lg" onClick={() => setOpen(true)}>
              <Plus className="size-4" /> Nova avaliação
            </Button>
            <Button size="lg" variant="outline" onClick={() => openGroup(null)}>
              <UsersRound className="size-4" /> Cadastrar Grupo
            </Button>
            <ImportExcelButton />
            <div className="flex flex-wrap gap-1.5">
            {PURPOSES.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center rounded-full border bg-card px-2.5 py-1 text-xs"
              >
                {p.name}
              </span>
            ))}
            </div>
          </div>
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              Grupos cadastrados
            </h2>
            {groups.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => openGroup(null)}>
                <Plus className="size-4" /> Novo grupo
              </Button>
            )}
          </div>

          {groups.length === 0 ? (
            <button
              onClick={() => openGroup(null)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/50 px-6 py-10 text-center transition hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="grid size-11 place-items-center rounded-full bg-accent text-primary">
                <UsersRound className="size-5" />
              </div>
              <div className="font-display font-semibold">
                Cadastrar seu primeiro grupo
              </div>
              <p className="max-w-md text-sm text-muted-foreground">
                Salve rede, supervisor, condutor e membros uma única vez. Cada
                membro ganha um código único e você reutiliza tudo ao criar uma
                nova avaliação.
              </p>
            </button>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <div
                  key={g.id}
                  className="flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-pop"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate font-display font-semibold">
                        {g.name}
                      </h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {[g.network, g.supervisor && `Sup. ${g.supervisor}`, g.conductor && `Cond. ${g.conductor}`]
                          .filter(Boolean)
                          .join(" · ") || "Sem detalhes"}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 shrink-0 text-muted-foreground"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openGroup(g)}>
                          <Pencil className="size-4" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            if (confirm(`Excluir o grupo "${g.name}"?`))
                              groupStore.remove(g.id);
                          }}
                        >
                          <Trash2 className="size-4" /> Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {g.members.slice(0, 6).map((m) => (
                      <span
                        key={m.id}
                        title={m.code}
                        className="inline-flex items-center gap-1 rounded-full border bg-muted/60 px-2 py-0.5 text-xs"
                      >
                        {m.name}
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {m.code}
                        </span>
                      </span>
                    ))}
                    {g.members.length > 6 && (
                      <span className="text-xs text-muted-foreground">
                        +{g.members.length - 6}
                      </span>
                    )}
                    {g.members.length === 0 && (
                      <span className="text-xs text-muted-foreground">
                        Sem membros
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {g.members.length} membros
                    </span>
                    <button
                      onClick={() => setOpen(true)}
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      Nova avaliação <ArrowRight className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 font-display text-lg font-semibold">
            Suas avaliações
          </h2>

          {assessments.length === 0 ? (
            <button
              onClick={() => setOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed bg-card/50 px-6 py-16 text-center transition hover:border-primary/50 hover:bg-accent/40"
            >
              <div className="grid size-12 place-items-center rounded-full bg-accent text-primary">
                <Plus className="size-6" />
              </div>
              <div className="font-display font-semibold">
                Criar sua primeira avaliação
              </div>
              <p className="max-w-sm text-sm text-muted-foreground">
                Nomeie a avaliação, informe o condutor e adicione os membros do
                grupo para começar.
              </p>
            </button>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assessments.map((a) => {
                const progress = computeProgress(a);
                const pct = Math.round(progress.ratio * 100);
                return (
                  <div
                    key={a.id}
                    className="group relative flex flex-col rounded-2xl border bg-card p-5 shadow-soft transition hover:shadow-pop"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to="/avaliacao/$id"
                        params={{ id: a.id }}
                        className="min-w-0 flex-1"
                      >
                        <div className="flex items-center gap-2">
                          {a.finishedAt && (
                            <CheckCircle2 className="size-4 shrink-0 text-healthy" />
                          )}
                          <h3 className="truncate font-display font-semibold">
                            {a.name}
                          </h3>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {a.conductor ? `Condutor: ${a.conductor}` : "Sem condutor"}
                        </p>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 text-muted-foreground"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => store.duplicate(a.id)}>
                            <Copy className="size-4" /> Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => {
                              if (confirm(`Excluir "${a.name}"?`))
                                store.remove(a.id);
                            }}
                          >
                            <Trash2 className="size-4" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" /> {a.members.length} membros
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <div className="mt-3">
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {progress.answered}/{progress.total}
                        </span>
                        <span className="tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      {a.members.length > 0 ? (
                        <StatusBadge status={groupStatus(a)} />
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Sem membros
                        </span>
                      )}
                      <Link
                        to="/avaliacao/$id"
                        params={{ id: a.id }}
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

      <CreateAssessmentDialog open={open} onOpenChange={setOpen} />
      <GroupDialog
        open={groupOpen}
        onOpenChange={setGroupOpen}
        group={editing}
      />
    </div>
  );
}
