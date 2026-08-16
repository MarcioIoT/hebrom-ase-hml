import { cn } from "@/lib/utils";
import type { HealthStatus } from "@/lib/ase-types";
import { STATUS_LABEL } from "@/lib/ase-scoring";

const STYLES: Record<HealthStatus, string> = {
  saudavel: "bg-healthy-soft text-healthy border-healthy/30",
  crescendo: "bg-growing-soft text-growing-foreground border-growing/40",
  doente: "bg-sick-soft text-sick border-sick/30",
};

export function StatusBadge({
  status,
  className,
  size = "sm",
}: {
  status: HealthStatus;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-[0.68rem]" : "px-3 py-1 text-sm",
        STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current opacity-70" />
      {STATUS_LABEL[status]}
    </span>
  );
}
