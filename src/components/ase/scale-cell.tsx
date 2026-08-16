import { memo } from "react";
import { cn } from "@/lib/utils";
import type { ScoreValue } from "@/lib/ase-types";

interface Props {
  cellId: string;
  value: ScoreValue | undefined;
  disabled?: boolean;
  onSet: (v: ScoreValue | null) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}

const VALUES: ScoreValue[] = [1, 2, 3, 4, 5];

const ACTIVE_CLASS: Record<ScoreValue, string> = {
  1: "bg-score-1 text-white",
  2: "bg-score-2 text-white",
  3: "bg-score-3 text-white",
  4: "bg-score-4 text-white",
  5: "bg-score-5 text-white",
};

function ScaleCellInner({ cellId, value, disabled, onSet, onKeyDown }: Props) {
  return (
    <div
      id={cellId}
      role="gridcell"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={onKeyDown}
      aria-label={value ? `Nota ${value}` : "Sem nota"}
      className={cn(
        "group/cell mx-auto flex w-fit items-center gap-0.5 rounded-full p-0.5 outline-none transition",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "focus-visible:bg-accent",
        disabled && "opacity-60",
      )}
    >
      {VALUES.map((v) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={() => onSet(active ? null : v)}
            aria-pressed={active}
            className={cn(
              "size-7 shrink-0 rounded-full text-xs font-semibold tabular-nums transition-all",
              active
                ? cn(ACTIVE_CLASS[v], "shadow-soft scale-105")
                : "bg-muted/60 text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

export const ScaleCell = memo(ScaleCellInner);
