import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SCORE_META } from "@/lib/dashboard-scoring";

const BAR_CLASS: Record<number, string> = {
  1: "bg-score-1",
  2: "bg-score-2",
  3: "bg-score-3",
  4: "bg-score-4",
  5: "bg-score-5",
};

/** Horizontal 1..5 bar with a colored badge — never a bare number. */
export function ScoreBar({
  answer,
  className,
}: {
  answer: number;
  className?: string;
}) {
  const pct = (answer / 5) * 100;

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn("h-full rounded-full", BAR_CLASS[answer] ?? "bg-muted")}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <ScoreBadge answer={answer} />
    </div>
  );
}

const BADGE_CLASS: Record<number, string> = {
  1: "bg-score-1/15 text-score-1 border-score-1/30",
  2: "bg-score-2/15 text-score-2 border-score-2/30",
  3: "bg-score-3/20 text-score-3 border-score-3/40",
  4: "bg-score-4/15 text-score-4 border-score-4/30",
  5: "bg-score-5/15 text-score-5 border-score-5/30",
};

export function ScoreBadge({ answer }: { answer: number }) {
  const meta = SCORE_META[answer];
  if (!meta) {
    return (
      <span className="inline-flex shrink-0 items-center rounded-full border bg-muted px-2 py-0.5 text-[0.68rem] font-medium text-muted-foreground">
        Sem nota
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[0.68rem] font-semibold tabular-nums",
        BADGE_CLASS[answer],
      )}
    >
      {answer}/5 · {meta.label}
    </span>
  );
}
