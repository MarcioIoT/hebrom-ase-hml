import { motion } from "framer-motion";

/**
 * Circular gauge (donut arc) used for overall + per-purpose health.
 * Color is passed as a CSS color string (design token var).
 */
export function Gauge({
  value,
  size = 180,
  stroke = 14,
  color,
  label,
  sublabel,
}: {
  value: number; // 0..100
  size?: number;
  stroke?: number;
  color: string;
  label?: string;
  sublabel?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  const offset = c - (pct / 100) * c;

  return (
    <div
      className="relative grid place-items-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span
          className="font-display font-bold tabular-nums"
          style={{ fontSize: size * 0.24, color }}
        >
          {pct}%
        </span>
        {label && (
          <span className="text-xs font-semibold" style={{ color }}>
            {label}
          </span>
        )}
        {sublabel && (
          <span className="mt-0.5 text-[0.65rem] text-muted-foreground">
            {sublabel}
          </span>
        )}
      </div>
    </div>
  );
}
