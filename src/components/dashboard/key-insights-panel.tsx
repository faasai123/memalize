import { Lightbulb } from "lucide-react";
import { buildInsights } from "@/lib/dashboard-insights";
import { useTimeRange, rangeMeta } from "@/lib/time-range";
import type { Emotion } from "@/lib/dashboard-data";

const emotionColor: Record<Emotion, string> = {
  happy: "var(--chart-happy)",
  sad: "var(--chart-sad)",
  angry: "var(--chart-angry)",
  stressed: "var(--chart-stressed)",
  bored: "var(--chart-bored)",
};

export function KeyInsightsPanel({ segment }: { segment: string }) {
  const { range } = useTimeRange();
  const { insights, headline } = buildInsights(segment, range);

  return (
    <section
      className="card-rise glass flex h-full flex-col rounded-2xl border border-border p-5"
      style={{ animationDelay: "560ms" }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Key insights
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {headline} &middot; {rangeMeta[range].label}
          </p>
        </div>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-xl"
          style={{
            color: "var(--primary)",
            background: "color-mix(in oklab, var(--primary) 12%, transparent)",
          }}
        >
          <Lightbulb className="size-4" />
        </span>
      </div>

      <ul className="mt-4 flex-1 space-y-2.5">
        {insights.map((it) => {
          const color = emotionColor[it.emotion];
          return (
            <li
              key={it.key}
              className="feed-row rounded-xl border border-border bg-surface px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {it.title}
                </p>
                <span className="tabular text-sm font-semibold" style={{ color }}>
                  {it.value}
                </span>
              </div>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {it.subject}
              </p>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "color-mix(in oklab, var(--foreground) 8%, transparent)" }}
                role="presentation"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${Math.max(6, Math.min(100, it.strength))}%`,
                    background: color,
                  }}
                />
              </div>
              <p className="mt-2 text-xs leading-snug text-muted-foreground">
                {it.detail}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
