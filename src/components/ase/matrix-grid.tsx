import { useMemo, useRef, useState, useCallback } from "react";
import { BookOpen, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerseDialog } from "./verse-dialog";
import { useDeleteMemberDialog } from "./delete-member-dialog";
import type { Question } from "@/lib/ase-types";

import type { Assessment, ScoreValue } from "@/lib/ase-types";
import { PURPOSES, QUESTIONS_BY_PURPOSE } from "@/lib/ase-content";
import {
  purposeTotal,
  purposeMax,
  memberStatus,
  getScore,
  memberPurposeProgress,
  memberOverallProgress,
} from "@/lib/ase-scoring";
import { store } from "@/lib/ase-store";
import { ScaleCell } from "./scale-cell";
import { StatusBadge } from "./status-badge";
import { ScaleLegend } from "./scale-legend";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { MatrixMobile } from "./matrix-mobile";


const MEMBER_W = "9.5rem";
const cellId = (qId: string, mId: string) => `c_${qId}_${mId}`;
const parseCellId = (id: string) => {
  const rest = id.slice(2);
  const i = rest.lastIndexOf("_");
  return { qId: rest.slice(0, i), mId: rest.slice(i + 1) };
};



export function MatrixGrid({ assessment }: { assessment: Assessment }) {
  const isMobile = useIsMobile();
  if (isMobile) return <MatrixMobile assessment={assessment} />;
  return <MatrixDesktop assessment={assessment} />;
}

function MatrixDesktop({ assessment }: { assessment: Assessment }) {
  const locked = !!assessment.finishedAt;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [verseQuestion, setVerseQuestion] = useState<Question | null>(null);
  const { dialog, confirm } = useDeleteMemberDialog();
  const members = assessment.members;


  const groups = useMemo(() => {
    return PURPOSES.map((p) => ({
      purpose: p,
      questions: QUESTIONS_BY_PURPOSE[p.id],
    })).filter((g) => g.questions.length > 0);
  }, []);


  // Flat ordered list of currently-navigable question ids (respecting collapse
  // + filters), kept in refs so the keyboard handler stays referentially stable.
  const visibleQIds = useMemo(() => {
    const ids: string[] = [];
    for (const g of groups) {
      if (collapsed[g.purpose.id]) continue;
      for (const question of g.questions) ids.push(question.id);
    }
    return ids;
  }, [groups, collapsed]);

  const qIdsRef = useRef<string[]>([]);
  const mIdsRef = useRef<string[]>([]);
  qIdsRef.current = visibleQIds;
  mIdsRef.current = members.map((m) => m.id);

  const focusCell = useCallback((qi: number, mi: number) => {
    const qIds = qIdsRef.current;
    const mIds = mIdsRef.current;
    if (qi < 0 || qi >= qIds.length || mi < 0 || mi >= mIds.length) return;
    document.getElementById(cellId(qIds[qi], mIds[mi]))?.focus();
  }, []);

  const onSet = useCallback(
    (id: string, v: ScoreValue | null) => {
      if (locked) return;
      const { qId, mId } = parseCellId(id);
      store.setScore(assessment.id, mId, qId, v);
    },
    [assessment.id, locked],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const id = e.currentTarget.id;
      const { qId, mId } = parseCellId(id);
      const qi = qIdsRef.current.indexOf(qId);
      const mi = mIdsRef.current.indexOf(mId);
      const qLen = qIdsRef.current.length;
      const mLen = mIdsRef.current.length;
      const k = e.key;

      const moveRight = () => {
        if (mi + 1 < mLen) focusCell(qi, mi + 1);
        else if (qi + 1 < qLen) focusCell(qi + 1, 0);
      };
      const movePrev = () => {
        if (mi - 1 >= 0) focusCell(qi, mi - 1);
        else if (qi - 1 >= 0) focusCell(qi - 1, mLen - 1);
      };

      if (["1", "2", "3", "4", "5"].includes(k)) {
        e.preventDefault();
        if (!locked) store.setScore(assessment.id, mId, qId, Number(k) as ScoreValue);
        moveRight();
      } else if (k === "0" || k === "Backspace" || k === "Delete") {
        e.preventDefault();
        if (!locked) store.setScore(assessment.id, mId, qId, null);
      } else if (k === "ArrowRight") {
        e.preventDefault();
        focusCell(qi, mi + 1);
      } else if (k === "ArrowLeft") {
        e.preventDefault();
        focusCell(qi, mi - 1);
      } else if (k === "ArrowDown") {
        e.preventDefault();
        focusCell(qi + 1, mi);
      } else if (k === "ArrowUp") {
        e.preventDefault();
        focusCell(qi - 1, mi);
      } else if (k === "Enter") {
        e.preventDefault();
        focusCell(qi + 1, mi);
      } else if (k === "Tab") {
        e.preventDefault();
        if (e.shiftKey) movePrev();
        else moveRight();
      }
    },
    [assessment.id, focusCell, locked],
  );

  const toggle = (id: string) =>
    setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const gridCols = `minmax(18rem, 26rem) repeat(${members.length}, ${MEMBER_W})`;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {/* Scale legend — meaning of each score 1–5 */}
      <ScaleLegend className="shrink-0" />


      <div className="scroll-elegant min-h-0 flex-1 overflow-auto rounded-xl border bg-card shadow-soft">
        <div role="grid" className="min-w-fit">
          {/* Header row: members */}
          <div
            className="sticky top-0 z-30 grid border-b bg-card/95 backdrop-blur"
            style={{ gridTemplateColumns: gridCols }}
          >
            <div className="sticky left-0 z-10 flex items-end bg-card/95 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pergunta
            </div>
            {members.map((m) => {
              const overall = memberOverallProgress(assessment, m.id);
              return (
                <div
                  key={m.id}
                  className="group/mh flex flex-col items-center gap-1 border-l px-1.5 py-2"
                >
                  <div className="flex w-full items-center justify-center">
                    <Input
                      value={m.name}
                      disabled={locked}
                      onChange={(e) =>
                        store.renameMember(assessment.id, m.id, e.target.value)
                      }
                      className="h-7 border-transparent bg-transparent px-1 text-center text-sm font-semibold shadow-none focus-visible:border-input hover:bg-muted/50"
                    />
                    {!locked && (
                      <button
                        type="button"
                        aria-label={`Remover ${m.name}`}
                        onClick={() =>
                          confirm(m.name, () =>
                            store.removeMember(assessment.id, m.id),
                          )
                        }
                        className="ml-0.5 hidden shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive group-hover/mh:block"
                      >
                        <X className="size-3.5" />
                      </button>
                    )}
                  </div>
                  <StatusBadge status={memberStatus(assessment, m.id)} />
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(overall.ratio * 100)}% · {overall.answered}/{overall.total}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Groups */}
          {groups.map((g) => {
            const isCollapsed = !!collapsed[g.purpose.id];
            return (
              <div key={g.purpose.id}>
                {/* Group header */}
                <div
                  className="grid border-b bg-secondary/50"
                  style={{ gridTemplateColumns: gridCols }}
                >
                  <div className="sticky left-0 z-10 bg-secondary/50">
                    <button
                      type="button"
                      onClick={() => toggle(g.purpose.id)}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
                    >
                      <ChevronDown
                        className={cn(
                          "size-4 shrink-0 text-muted-foreground transition-transform",
                          isCollapsed && "-rotate-90",
                        )}
                      />
                      <span className="font-display text-sm font-semibold">
                        {g.purpose.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {g.questions.length} perguntas
                      </span>
                    </button>
                  </div>
                  {members.map((m) => (
                    <div key={m.id} className="border-l" />
                  ))}
                </div>

                {/* Question rows */}
                {!isCollapsed &&
                  g.questions.map((question, idx) => (
                    <div
                      key={question.id}
                      className="group/row grid border-b last:border-b-0 hover:bg-accent/30"
                      style={{ gridTemplateColumns: gridCols }}
                    >
                      <div className="sticky left-0 z-10 flex items-start gap-2 bg-card px-4 py-2.5 group-hover/row:bg-accent/30">
                        <span className="mt-0.5 w-4 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                          {idx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVerseQuestion(question)}
                          title="Ver versículo base"
                          className="group/q inline-flex items-start gap-1.5 text-left text-sm leading-snug hover:text-primary"
                        >
                          <span>{question.text}</span>
                          <BookOpen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/q:opacity-100" />
                        </button>

                      </div>
                      {members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-center border-l px-1 py-1.5"
                        >
                          <ScaleCell
                            cellId={cellId(question.id, m.id)}
                            value={getScore(assessment, m.id, question.id)}
                            disabled={locked}
                            onSet={(v) => onSet(cellId(question.id, m.id), v)}
                            onKeyDown={onKeyDown}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                {/* Group subtotal */}
                {!isCollapsed && (
                  <div
                    className="grid border-b bg-muted/40"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="sticky left-0 z-10 flex items-center gap-2 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Subtotal · {g.purpose.name}
                    </div>
                    {members.map((m) => {
                      const p = memberPurposeProgress(assessment, m.id, g.purpose.id);
                      return (
                        <div
                          key={m.id}
                          className="flex flex-col items-center gap-1 border-l px-1 py-2"
                        >
                          <span className="text-sm font-semibold tabular-nums">
                            {purposeTotal(assessment, m.id, g.purpose.id)}
                            <span className="text-xs font-normal text-muted-foreground">
                              /{purposeMax(g.purpose.id)}
                            </span>
                          </span>
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {Math.round(p.ratio * 100)}% · {p.answered}/{p.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Purpose observation per member */}
                {!isCollapsed && (
                  <div
                    className="grid border-b bg-card"
                    style={{ gridTemplateColumns: gridCols }}
                  >
                    <div className="sticky left-0 z-10 flex items-start bg-card px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Observação · {g.purpose.name}
                    </div>
                    {members.map((m) => (
                      <div key={m.id} className="border-l px-1 py-1.5">
                        <Textarea
                          value={
                            assessment.notes?.[m.id]?.[g.purpose.id] ?? ""
                          }
                          disabled={locked}
                          onChange={(e) =>
                            store.setNote(
                              assessment.id,
                              m.id,
                              g.purpose.id,
                              e.target.value,
                            )
                          }
                          placeholder="Observação…"
                          rows={2}
                          className="min-h-14 resize-y text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {groups.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Nenhuma pergunta cadastrada.
            </div>
          )}

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
