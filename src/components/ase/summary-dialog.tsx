import { Link } from "@tanstack/react-router";
import { LayoutDashboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Assessment } from "@/lib/ase-types";
import { PURPOSES, TOTAL_QUESTIONS } from "@/lib/ase-content";
import {
  purposeGroupAverage,
  purposeMax,
  statusFromScore,
  groupStatus,
  computeProgress,
  STATUS_LABEL,
} from "@/lib/ase-scoring";
import { StatusBadge } from "./status-badge";
import { store } from "@/lib/ase-store";

export function SummaryDialog({
  assessment,
  open,
  onOpenChange,
}: {
  assessment: Assessment;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const progress = computeProgress(assessment);
  const date = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Resumo da avaliação</DialogTitle>
          <DialogDescription>{assessment.name}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <Info label="Membros avaliados" value={String(assessment.members.length)} />
          <Info label="Perguntas" value={String(TOTAL_QUESTIONS)} />
          <Info label="Respostas" value={`${progress.answered}/${progress.total}`} />
          <Info label="Condutor" value={assessment.conductor || "—"} />
          <Info label="Data" value={date} />
          <Info
            label="Saúde do grupo"
            value={STATUS_LABEL[groupStatus(assessment)]}
          />
        </div>

        <div className="rounded-lg border">
          <div className="border-b bg-muted/40 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Média por propósito
          </div>
          <div className="divide-y">
            {PURPOSES.map((p) => {
              const avg = purposeGroupAverage(assessment, p.id);
              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold tabular-nums">
                      {avg.toFixed(1)}
                      <span className="font-normal text-muted-foreground">
                        /{purposeMax(p.id)}
                      </span>
                    </span>
                    <StatusBadge status={statusFromScore(avg, purposeMax(p.id))} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            asChild
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            <Link to="/dashboard/grupo/$id" params={{ id: assessment.id }}>
              <LayoutDashboard className="size-4" /> Dashboard do Grupo
            </Link>
          </Button>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Voltar
            </Button>
            {assessment.finishedAt ? (
              <Button
                variant="outline"
                onClick={() => {
                  store.reopen(assessment.id);
                  onOpenChange(false);
                }}
              >
                Reabrir avaliação
              </Button>
            ) : (
              <Button
                onClick={() => {
                  store.finish(assessment.id);
                  onOpenChange(false);
                }}
              >
                Finalizar avaliação
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card px-3 py-2">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 truncate font-display text-sm font-semibold">
        {value}
      </div>
    </div>
  );
}
