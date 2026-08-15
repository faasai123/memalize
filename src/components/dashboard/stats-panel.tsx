import { memo, useMemo } from "react";
import { Sigma } from "lucide-react";
import { emotions, type Emotion } from "@/lib/dashboard-data";
import { segmentCategoryEmotion, findSegment } from "@/lib/dashboard-segments";
import { useTimeRange, rangeMeta } from "@/lib/time-range";

type Row = {
  key: Emotion;
  label: string;
  color: string;
  mean: number;
  median: number;
  sd: number;
  min: { label: string; value: number };
  max: { label: string; value: number };
  n: number;
};

function stats(values: number[]) {
  const n = values.length || 1;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 ? sorted[mid]! : ((sorted[mid - 1]! + sorted[mid]!) / 2);
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  return { mean, median, sd: Math.sqrt(variance) };
}

export const StatsPanel = memo(function StatsPanel({ segment }: { segment: string }) {
  const { range } = useTimeRange();
  const segmentLabel = findSegment(segment).label;

  const rows: Row[] = useMemo(
    () =>
      emotions.map((e) => {
        const points = segmentCategoryEmotion(segment, e.key, range);
        const values = points.map((p) => p.value);
        const { mean, median, sd } = stats(values);
        const min = points.reduce((a, b) => (b.value < a.value ? b : a), points[0]!);
        const max = points.reduce((a, b) => (b.value > a.value ? b : a), points[0]!);
        return {
          key: e.key,
          label: e.label,
          color: e.color,
          mean,
          median,
          sd,
          min: { label: min.label, value: min.value },
          max: { label: max.label, value: max.value },
          n: values.length,
        };
      }),
    [segment, range],
  );

  const overall = useMemo(() => stats(rows.map((r) => r.mean)), [rows]);
  const strongest = rows.reduce((a, b) => (b.mean > a.mean ? b : a), rows[0]!);
  const mostVaried = rows.reduce((a, b) => (b.sd > a.sd ? b : a), rows[0]!);

  return (
    <section
      className="card-rise glass rounded-2xl border border-border p-5"
      style={{ animationDelay: "660ms" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-base font-semibold text-foreground">
            Statistical summary
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Descriptive statistics of emotion scores (1–10) across the {rows[0]?.n ?? 9} meme
            categories &middot; {segmentLabel} &middot; {rangeMeta[range].label}
          </p>
        </div>
        <span
          className="grid size-8 shrink-0 place-items-center rounded-xl"
          style={{
            color: "var(--primary)",
            background: "color-mix(in oklab, var(--primary) 12%, transparent)",
          }}
        >
          <Sigma className="size-4" />
        </span>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted-foreground">
              <th className="py-2 pr-3 text-left font-medium">Emotion</th>
              <th className="px-3 py-2 text-right font-medium">Mean</th>
              <th className="px-3 py-2 text-right font-medium">Median</th>
              <th className="px-3 py-2 text-right font-medium">SD</th>
              <th className="px-3 py-2 text-left font-medium">Highest category</th>
              <th className="px-3 py-2 text-left font-medium">Lowest category</th>
              <th className="py-2 pl-3 text-right font-medium">n</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-border">
                <td className="py-2.5 pr-3">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <span
                      className="size-2.5 rounded-full"
                      style={{ background: r.color }}
                      aria-hidden
                    />
                    {r.label}
                  </span>
                </td>
                <td className="tabular px-3 py-2.5 text-right font-semibold" style={{ color: r.color }}>
                  {r.mean.toFixed(2)}
                </td>
                <td className="tabular px-3 py-2.5 text-right text-foreground">
                  {r.median.toFixed(2)}
                </td>
                <td className="tabular px-3 py-2.5 text-right text-muted-foreground">
                  ±{r.sd.toFixed(2)}
                </td>
                <td className="px-3 py-2.5 text-foreground">
                  {r.max.label}{" "}
                  <span className="tabular text-muted-foreground">({r.max.value.toFixed(1)})</span>
                </td>
                <td className="px-3 py-2.5 text-foreground">
                  {r.min.label}{" "}
                  <span className="tabular text-muted-foreground">({r.min.value.toFixed(1)})</span>
                </td>
                <td className="tabular py-2.5 pl-3 text-right text-muted-foreground">{r.n}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          {
            label: "Grand mean",
            value: overall.mean.toFixed(2),
            detail: "average across all five emotions",
          },
          {
            label: "Dominant emotion",
            value: `${strongest.label} ${strongest.mean.toFixed(2)}`,
            detail: "highest mean score overall",
          },
          {
            label: "Most variable",
            value: `${mostVaried.label} ±${mostVaried.sd.toFixed(2)}`,
            detail: "largest spread between categories",
          },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface px-3 py-2.5">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {s.label}
            </p>
            <p className="tabular mt-0.5 text-base font-semibold text-foreground">{s.value}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{s.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
});
