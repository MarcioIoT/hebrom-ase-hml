import { useMemo, useState } from "react";
import { BookOpen, ChevronDown, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Assessment, Question, ScoreValue } from "@/lib/ase-types";
import { VerseDialog } from "./verse-dialog";
import { useDeleteMemberDialog } from "./delete-member-dialog";

import { PURPOSES, QUESTIONS_BY_PURPOSE, SCORE_LABELS } from "@/lib/ase-content";
import {
  getScore,
  memberOverallProgress,
  memberPurposeProgress,
  memberStatus,
  purposeMax,
  purposeTotal,
} from "@/lib/ase-scoring";
import { store } from "@/lib/ase-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "./status-badge";

const VALUES: ScoreValue[] = [1, 2, 3, 4, 5];
const ACTIVE_CLASS: Record<ScoreValue, string> = {
  1: "bg-score-1 text-white border-transparent",
  2: "bg-score-2 text-white border-transparent",
  3: "bg-score-3 text-white border-transparent",
  4: "bg-score-4 text-white border-transparent",
  5: "bg-score-5 text-white border-transparent",
};

export function MatrixMobile({ assessment }: { assessment: Assessment }) {
  const locked = !!assessment.finishedAt;
  const members = assessment.members;
  const [selectedId, setSelectedId] = useState<string>(members[0]?.id ?? "");
  const [openPurpose, setOpenPurpose] = useState<string>(PURPOSES[0].id);
  const [verseQuestion, setVerseQuestion] = useState<Question | null>(null);
  const { dialog, confirm } = useDeleteMemberDialog();


  // Keep selected valid if members change
  const selected = useMemo(
    () => members.find((m) => m.id === selectedId) ?? members[0],
    [members, selectedId],
  );

  if (!selected) return null;

  const overall = memberOverallProgress(assessment, selected.id);

  const groups = PURPOSES.map((p) => ({
    purpose: p,
    questions: QUESTIONS_BY_PURPOSE[p.id],
  }));

  return (
    <div className="scroll-elegant -mx-4 h-full overflow-y-auto px-4 pb-8 sm:-mx-6 sm:px-6">
      <div className="flex flex-col gap-3">
      {/* Member selector */}
      <div className="scroll-elegant sticky top-0 z-10 -mx-1 flex items-center gap-2 overflow-x-auto rounded-xl border bg-card/95 p-2 shadow-soft backdrop-blur">

        {members.map((m) => {
          const p = memberOverallProgress(assessment, m.id);
          const active = m.id === selected.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setSelectedId(m.id)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-left transition",
                active
                  ? "border-primary bg-primary/10"
                  : "border-transparent bg-muted/50 hover:bg-muted",
              )}
            >
              <div className="text-sm font-semibold leading-tight">
                {m.name}
              </div>
              <div className="text-[11px] tabular-nums text-muted-foreground">
                {Math.round(p.ratio * 100)}% · {p.answered}/{p.total}
              </div>
            </button>
          );
        })}
        {!locked && (
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => {
              const m = store.addMember(assessment.id);
              setSelectedId(m.id);
            }}
          >
            <UserPlus className="size-4" />
          </Button>
        )}
      </div>

      {/* Selected member header */}
      <div className="shrink-0 rounded-xl border bg-card p-3 shadow-soft">
        <div className="flex items-center gap-2">
          <Input
            value={selected.name}
            disabled={locked}
            onChange={(e) =>
              store.renameMember(assessment.id, selected.id, e.target.value)
            }
            className="h-9 flex-1 font-semibold"
          />
          {!locked && members.length > 1 && (
            <button
              type="button"
              aria-label={`Remover ${selected.name}`}
              onClick={() =>
                confirm(selected.name, () => {
                  store.removeMember(assessment.id, selected.id);
                  setSelectedId(
                    members.find((m) => m.id !== selected.id)?.id ?? "",
                  );
                })
              }
              className="rounded p-1.5 text-muted-foreground hover:text-destructive"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2">
          <StatusBadge status={memberStatus(assessment, selected.id)} />
          <span className="text-xs tabular-nums text-muted-foreground">
            {Math.round(overall.ratio * 100)}% · {overall.answered}/
            {overall.total}
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.round(overall.ratio * 100)}%` }}
          />
        </div>
      </div>

      {/* Purposes as accordions */}
      <div className="flex flex-col gap-2">
        {groups.map((g) => {
          const isOpen = openPurpose === g.purpose.id;
          const p = memberPurposeProgress(assessment, selected.id, g.purpose.id);
          const total = purposeTotal(assessment, selected.id, g.purpose.id);
          const max = purposeMax(g.purpose.id);
          return (
            <div
              key={g.purpose.id}
              className="overflow-hidden rounded-xl border bg-card shadow-soft"
            >
              <button
                type="button"
                onClick={() =>
                  setOpenPurpose(isOpen ? "" : g.purpose.id)
                }
                className="flex w-full items-center gap-2 px-3 py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-semibold">
                    {g.purpose.name}
                  </div>
                  <div className="text-[11px] tabular-nums text-muted-foreground">
                    {Math.round(p.ratio * 100)}% · {p.answered}/{p.total} ·{" "}
                    <span className="font-medium">
                      {total}
                      <span className="opacity-60">/{max}</span>
                    </span>
                  </div>
                </div>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    !isOpen && "-rotate-90",
                  )}
                />
              </button>

              {isOpen && (
                <div className="border-t">
                  {g.questions.map((q, idx) => {
                    const value = getScore(assessment, selected.id, q.id);
                    return (
                      <div
                        key={q.id}
                        className="border-b px-3 py-3 last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => setVerseQuestion(q)}
                          className="flex w-full gap-2 text-left active:opacity-70"
                        >
                          <span className="mt-0.5 w-5 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                            {idx + 1}.
                          </span>
                          <p className="flex-1 text-sm leading-snug">
                            {q.text}
                          </p>
                          <BookOpen className="mt-0.5 size-4 shrink-0 text-primary/70" />
                        </button>

                        <div className="mt-3 grid grid-cols-5 gap-1.5">
                          {VALUES.map((v) => {
                            const active = value === v;
                            return (
                              <button
                                key={v}
                                type="button"
                                disabled={locked}
                                aria-pressed={active}
                                aria-label={`Nota ${v} — ${SCORE_LABELS[v]}`}
                                onClick={() =>
                                  store.setScore(
                                    assessment.id,
                                    selected.id,
                                    q.id,
                                    active ? null : v,
                                  )
                                }
                                className={cn(
                                  "flex h-11 items-center justify-center rounded-lg border text-base font-semibold tabular-nums transition-all",
                                  active
                                    ? cn(ACTIVE_CLASS[v], "shadow-soft scale-[1.03]")
                                    : "border-border bg-muted/50 text-muted-foreground active:scale-95",
                                  locked && "opacity-60",
                                )}
                              >
                                {v}
                              </button>
                            );
                          })}
                        </div>
                        {value != null && (
                          <div className="mt-1.5 text-center text-[11px] text-muted-foreground">
                            {SCORE_LABELS[value]}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Observation */}
                  <div className="border-t bg-muted/20 px-3 py-3">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observação · {g.purpose.name}
                    </label>
                    <Textarea
                      value={
                        assessment.notes?.[selected.id]?.[g.purpose.id] ?? ""
                      }
                      disabled={locked}
                      onChange={(e) =>
                        store.setNote(
                          assessment.id,
                          selected.id,
                          g.purpose.id,
                          e.target.value,
                        )
                      }
                      placeholder="Observação…"
                      rows={3}
                      className="min-h-20 resize-y text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>
      <VerseDialog
        question={verseQuestion}
        onOpenChange={(open) => !open && setVerseQuestion(null)}
      />
      {dialog}
    </div>

  );
}

