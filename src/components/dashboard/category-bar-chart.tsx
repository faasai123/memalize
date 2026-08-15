import { memo, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
} from "recharts";
import { findSegment, segmentCategoryEmotion } from "@/lib/dashboard-segments";
import { emotions, type Emotion } from "@/lib/dashboard-data";
import { useTimeRange } from "@/lib/time-range";

function ChartTooltip({ active, payload, emotionLabel }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-popover-foreground">{d.label}</p>
      <p className="tabular mt-1 text-muted-foreground">
        Avg {emotionLabel?.toLowerCase()} {d.value} <span className="opacity-60">/ 10</span>
      </p>
    </div>
  );
}

export const CategoryBarChart = memo(function CategoryBarChart({
  segment,
}: {
  segment: string;
}) {
  const label = findSegment(segment).label;
  const { range } = useTimeRange();
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const active = emotions.find((e) => e.key === emotion)!;
  const { data, min, span, avg } = useMemo(() => {
    const rows = segmentCategoryEmotion(segment, emotion, range);
    const hi = Math.max(...rows.map((d) => d.value));
    const lo = Math.min(...rows.map((d) => d.value));
    return {
      data: rows,
      min: lo,
      span: Math.max(0.001, hi - lo),
      avg: +(rows.reduce((s, d) => s + d.value, 0) / (rows.length || 1)).toFixed(1),
    };
  }, [segment, emotion, range]);

  return (
    <section
      className="card-rise glass rounded-2xl border border-border p-5"
      style={{ animationDelay: "480ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            {active.label} by category
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Average {active.label.toLowerCase()} score per meme category, 1&ndash;10 &middot; {label}
            {" "}&middot; overall avg <span className="tabular text-foreground">{avg}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Emotion">
          {emotions.map((e) => {
            const on = e.key === emotion;
            return (
              <button
                key={e.key}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setEmotion(e.key)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                  on
                    ? "border-transparent bg-secondary text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="size-2 rounded-full" style={{ background: e.color }} />
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={`${segment}-${emotion}-${range}`}
            data={data}
            margin={{ top: 4, right: 12, bottom: 0, left: -6 }}
            barCategoryGap="26%"
          >
            <CartesianGrid stroke="var(--grid-line)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--axis-text)", fontSize: 10 }}
              axisLine={{ stroke: "var(--grid-line)" }}
              tickLine={false}
              interval={0}
              height={40}
            />
            <YAxis
              domain={[0, 10]}
              tick={{ fill: "var(--axis-text)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={30}
            />
            <Tooltip
              content={<ChartTooltip emotionLabel={active.label} />}
              cursor={{ fill: "color-mix(in oklab, var(--foreground) 5%, transparent)" }}
            />
            <Bar
              dataKey="value"
              radius={[6, 6, 0, 0]}
              isAnimationActive
              animationBegin={40}
              animationDuration={550}
              animationEasing="ease-out"
            >
              {data.map((d) => {
                const ratio = (d.value - min) / span;
                const pct = Math.round(30 + ratio * 70);
                return (
                  <Cell
                    key={d.key}
                    fill={`color-mix(in oklab, ${active.color} ${pct}%, transparent)`}
                  />
                );
              })}
            </Bar>
            <ReferenceLine
              y={avg}
              stroke={active.color}
              strokeDasharray="5 4"
              strokeWidth={1.5}
              ifOverflow="extendDomain"
              label={{
                value: `All categories avg ${avg}`,
                position: "insideTopRight",
                fill: "var(--axis-text)",
                fontSize: 10,
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
});
