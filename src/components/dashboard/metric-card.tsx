import { Activity, Users, Smile, Palette } from "lucide-react";
import { ResponsiveContainer, Area, AreaChart } from "recharts";
import type { Metric } from "@/lib/dashboard-data";

const iconFor = (key: string) => {
  switch (key) {
    case "responses":
      return Users;
    case "rate":
      return Activity;
    case "happiness":
      return Smile;
    case "diversity":
      return Palette;
    default:
      return Smile;
  }
};

export function MetricCard({ metric, index }: { metric: Metric; index: number }) {
  const Icon = iconFor(metric.key);
  const accent = metric.tone === "blue" ? "var(--chart-sad)" : "var(--chart-happy)";
  const up = metric.trend === "up";
  const deltaColor = up ? "var(--chart-happy)" : "var(--chart-angry)";
  const sparkData = metric.spark.map((v, i) => ({ i, v }));

  return (
    <div
      className="card-rise glass rounded-2xl border border-border p-4 transition-transform duration-300 hover:-translate-y-0.5"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {metric.label}
        </p>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-lg"
          style={{
            color: accent,
            background: `color-mix(in oklab, ${accent} 14%, transparent)`,
          }}
        >
          <Icon className="size-4" />
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <p className="tabular font-display text-3xl font-semibold text-foreground">
          {metric.value}
        </p>
        <span className="tabular text-xs font-semibold" style={{ color: deltaColor }}>
          {metric.delta}
        </span>
      </div>

      <div className="mt-3 h-9 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={sparkData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id={`spark-${metric.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                <stop offset="100%" stopColor={accent} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={accent}
              strokeWidth={2}
              fill={`url(#spark-${metric.key})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
