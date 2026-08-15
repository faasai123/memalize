import { memo, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { emotions } from "@/lib/dashboard-data";
import { findSegment, segmentTimeline } from "@/lib/dashboard-segments";
import { useTimeRange, rangeMeta } from "@/lib/time-range";

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-popover-foreground">{label} ago</p>
      <div className="space-y-1">
        {payload.map((p: any) => (
          <div key={p.name} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="tabular font-medium text-popover-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const EmotionTrendChart = memo(function EmotionTrendChart({
  segment,
}: {
  segment: string;
}) {
  const { range } = useTimeRange();
  const data = useMemo(() => segmentTimeline(segment, range), [segment, range]);
  const label = findSegment(segment).label;
  const rangeLabel = rangeMeta[range].label;

  return (
    <section
      className="card-rise glass rounded-2xl border border-border p-5"
      style={{ animationDelay: "320ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">Emotion trend</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Average of each emotion (1&ndash;10) over the {rangeLabel} &middot; {label}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {emotions.map((e) => (
            <span key={e.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="size-2 rounded-full" style={{ background: e.color }} />
              {e.label}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-4 h-[240px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            key={`${segment}-${range}`}
            data={data}
            margin={{ top: 4, right: 12, bottom: 0, left: -6 }}
          >
            <defs>
              {emotions.map((e) => (
                <linearGradient key={e.key} id={`trend-${e.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={e.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={e.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid stroke="var(--grid-line)" vertical={false} />
            <XAxis
              dataKey="t"
              tick={{ fill: "var(--axis-text)", fontSize: 11 }}
              axisLine={{ stroke: "var(--grid-line)" }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={28}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: "var(--axis-text)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip content={<ChartTooltip />} />
            {emotions.map((e, i) => (
              <Area
                key={e.key}
                type="monotone"
                dataKey={e.key}
                name={e.label}
                stroke={e.color}
                strokeWidth={2}
                fill={`url(#trend-${e.key})`}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive
                animationBegin={i * 70}
                animationDuration={650}
                animationEasing="ease-out"
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});
