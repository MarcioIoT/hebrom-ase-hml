import { cn } from "@/lib/utils";
import { SCORE_SCALE } from "@/lib/ase-content";

const DOT_CLASS: Record<number, string> = {
  1: "bg-score-1",
  2: "bg-score-2",
  3: "bg-score-3",
  4: "bg-score-4",
  5: "bg-score-5",
};

export function ScaleLegend({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "scroll-elegant flex items-center gap-2 overflow-x-auto rounded-xl border bg-card px-3 py-2 shadow-soft",
        className,
      )}
    >
      <span className="shrink-0 pr-1 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
        Escala de avaliação
      </span>
      {SCORE_SCALE.map((s) => (
        <span
          key={s.value}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-2 py-1 text-xs"
        >
          <span
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded-full text-[0.6rem] font-bold text-white",
              DOT_CLASS[s.value],
            )}
          >
            {s.value}
          </span>
          <span className="font-medium text-muted-foreground">{s.label}</span>
        </span>
      ))}
    </div>
  );
}
