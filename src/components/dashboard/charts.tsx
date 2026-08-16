import { useEffect, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  LabelList,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";


function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}

export function PurposeRadar({
  data,
}: {
  data: { purpose: string; value: number }[];
}) {
  const mounted = useMounted();
  if (!mounted)
    return <div className="h-[280px] animate-pulse rounded-xl bg-muted/50" />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis
          dataKey="purpose"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
        />
        <PolarRadiusAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
          stroke="var(--color-border)"
        />
        <Radar
          dataKey="value"
          stroke="var(--color-primary)"
          fill="var(--color-primary)"
          fillOpacity={0.35}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v}%`, "Saúde"]}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

export function TimelineChart({
  data,
}: {
  data: { label: string; score: number }[];
}) {
  const mounted = useMounted();
  if (!mounted)
    return <div className="h-[240px] animate-pulse rounded-xl bg-muted/50" />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          stroke="var(--color-border)"
        />
        <YAxis
          domain={[0, 100]}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          stroke="var(--color-border)"
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v}%`, "Saúde geral"]}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="var(--color-primary)"
          strokeWidth={3}
          dot={{ r: 5, fill: "var(--color-primary)" }}
          activeDot={{ r: 7 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Compact radar with no labels — used inside member cards. */
export function MiniRadar({
  data,
  color = "var(--color-primary)",
  height = 120,
}: {
  data: { purpose: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const mounted = useMounted();
  if (!mounted)
    return (
      <div
        className="animate-pulse rounded-lg bg-muted/50"
        style={{ height }}
      />
    );

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RadarChart data={data} outerRadius="88%">
        <PolarGrid stroke="var(--color-border)" />
        <PolarAngleAxis
          dataKey="purpose"
          tick={false}
          axisLine={false}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          dataKey="value"
          stroke={color}
          fill={color}
          fillOpacity={0.3}
          strokeWidth={2}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}

/** Horizontal ranking bars for the five purposes (highest → lowest). */
export function RankingBar({
  data,
}: {
  data: { name: string; pct: number; color: string }[];
}) {
  const mounted = useMounted();
  if (!mounted)
    return <div className="h-[240px] animate-pulse rounded-xl bg-muted/50" />;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, data.length * 46)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 40, left: 8, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} stroke="var(--color-border)" />
        <XAxis type="number" domain={[0, 100]} hide />
        <YAxis
          type="category"
          dataKey="name"
          width={96}
          tick={{ fill: "var(--color-foreground)", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v}%`, "Média"]}
        />
        <Bar dataKey="pct" radius={[6, 6, 6, 6]} barSize={18}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
          <LabelList
            dataKey="pct"
            position="right"
            formatter={(v: number) => `${v}%`}
            style={{
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
              fontWeight: 600,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Vertical distribution of members across development bands. */
export function DistributionBar({
  data,
}: {
  data: { label: string; count: number; color: string }[];
}) {
  const mounted = useMounted();
  if (!mounted)
    return <div className="h-[240px] animate-pulse rounded-xl bg-muted/50" />;

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 16, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval={0}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "var(--color-muted)", opacity: 0.4 }}
          contentStyle={{
            background: "var(--color-popover)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            color: "var(--color-popover-foreground)",
            fontSize: 12,
          }}
          formatter={(v: number) => [`${v} membro(s)`, "Quantidade"]}
        />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={44}>
          {data.map((d, i) => (
            <Cell key={i} fill={d.color} />
          ))}
          <LabelList
            dataKey="count"
            position="top"
            style={{
              fill: "var(--color-foreground)",
              fontSize: 12,
              fontWeight: 700,
            }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

