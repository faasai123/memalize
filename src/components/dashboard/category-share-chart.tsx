import { memo, useMemo, useState } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { findSegment, segmentCategoryEmotionShare } from "@/lib/dashboard-segments";
import { emotions, type Emotion } from "@/lib/dashboard-data";
import { useTimeRange } from "@/lib/time-range";

const palette = Array.from({ length: 9 }, (_, i) => `var(--chart-${i + 1})`);

function ChartTooltip({ active, payload, emotionLabel }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-lg">
      <div className="flex items-center gap-2">
        <span className="size-2 rounded-full" style={{ background: d.color }} />
        <span className="font-medium text-popover-foreground">{d.label}</span>
      </div>
      <p className="tabular mt-1 text-muted-foreground">
        {d.share}% of {String(emotionLabel).toLowerCase()} responses
      </p>
    </div>
  );
}

export const CategoryShareChart = memo(function CategoryShareChart({
  segment,
}: {
  segment: string;
}) {
  const label = findSegment(segment).label;
  const { range } = useTimeRange();
  const [emotion, setEmotion] = useState<Emotion>("happy");
  const activeEmotion = emotions.find((e) => e.key === emotion)!;
  const data = useMemo(
    () =>
      segmentCategoryEmotionShare(segment, emotion, range).map((c, i) => ({
        ...c,
        color: palette[i % palette.length],
      })),
    [segment, emotion, range],
  );
  const top = useMemo(() => [...data].sort((a, b) => b.share - a.share)[0]!, [data]);

  return (
    <section
      className="card-rise glass rounded-2xl border border-border p-5"
      style={{ animationDelay: "400ms" }}
    >
      <h2 className="font-display text-base font-semibold text-foreground">
        {activeEmotion.label} share by category
      </h2>
      <p className="mt-0.5 text-xs text-muted-foreground">
        How {activeEmotion.label.toLowerCase()} responses split across the 9 meme categories
        &middot; {label}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Emotion">
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

      <div className="mt-4 flex flex-col items-center gap-5">
        <div className="relative h-[168px] w-[168px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`${segment}-${emotion}-${range}`}>
              <Pie
                data={data}
                dataKey="share"
                nameKey="label"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                stroke="none"
                isAnimationActive
                animationBegin={40}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color as string} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip emotionLabel={activeEmotion.label} />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 grid place-items-center">
            <div className="text-center">
              <p className="tabular font-display text-2xl font-semibold text-foreground">
                {top.share}%
              </p>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {top.label}
              </p>
            </div>
          </div>
        </div>

        <ul className="grid w-full grid-cols-2 gap-x-4 gap-y-1.5 sm:grid-cols-1">
          {data.map((d) => (
            <li key={d.key} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: d.color }}
                />
                <span className="truncate">{d.label}</span>
              </span>
              <span className="tabular font-medium text-foreground">{d.share}%</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
});
