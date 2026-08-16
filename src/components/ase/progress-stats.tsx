import { useEffect, useState } from "react";
import { Check, Clock, ListChecks } from "lucide-react";
import type { Assessment } from "@/lib/ase-types";
import { computeProgress } from "@/lib/ase-scoring";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function ProgressStats({ assessment }: { assessment: Assessment }) {
  const p = computeProgress(assessment);
  const pct = Math.round(p.ratio * 100);

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <div className="min-w-0">
        <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
          <span className="font-medium">
            {p.answered}{" "}
            <span className="text-muted-foreground">
              de {p.total} respostas
            </span>
          </span>
          <span className="tabular-nums text-muted-foreground">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <Stat icon={<ListChecks className="size-3.5" />} label="Restam">
          {p.remaining}
        </Stat>
        <Stat icon={<Clock className="size-3.5" />} label="">
          {`~${p.etaMinutes} min`}
        </Stat>
        <SaveIndicator stamp={assessment.updatedAt} />
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1">
      <span className="text-muted-foreground">{icon}</span>
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className="font-semibold tabular-nums">{children}</span>
    </span>
  );
}

function SaveIndicator({ stamp }: { stamp: string }) {
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setSaving(true);
    const t = setTimeout(() => setSaving(false), 600);
    return () => clearTimeout(t);
  }, [stamp]);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors",
        saving
          ? "border-primary/30 bg-accent text-primary"
          : "border-healthy/30 bg-healthy-soft text-healthy",
      )}
    >
      <Check className={cn("size-3.5", saving && "animate-pulse")} />
      <span className="font-semibold">{saving ? "Salvando…" : "Salvo"}</span>
    </span>
  );
}
