import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { findSegment, segmentMetrics } from "@/lib/dashboard-segments";
import { TimeRangeProvider, useTimeRange, rangeMeta } from "@/lib/time-range";
import { LiveDataProvider, useLiveAgg } from "@/lib/dashboard-live";
import { SegmentPicker } from "@/components/dashboard/segment-picker";
import { TopBar } from "@/components/dashboard/top-bar";
import { MetricCard } from "@/components/dashboard/metric-card";
import { EmotionTrendChart } from "@/components/dashboard/emotion-trend-chart";
import { CategoryShareChart } from "@/components/dashboard/category-share-chart";
import { CategoryBarChart } from "@/components/dashboard/category-bar-chart";
import { KeyInsightsPanel } from "@/components/dashboard/key-insights-panel";
import { StatsPanel } from "@/components/dashboard/stats-panel";
import { SurveyCta } from "@/components/dashboard/survey-cta";
import { InviteCard } from "@/components/dashboard/invite-card";
import { OnboardingGate } from "@/components/onboarding-gate";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Memalize — Real-time meme emotion analytics" },
      {
        name: "description",
        content:
          "Memalize dashboard: real-time analytics of emotions evoked by meme categories, with live response trends, category share, and happiness scores.",
      },
      { property: "og:title", content: "Memalize — Real-time meme emotion analytics" },
      {
        property: "og:description",
        content:
          "Real-time dashboard tracking how meme categories make people feel — happy, sad, angry, stressed, or bored.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://memalize.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://memalize.lovable.app/" }],
  }),
  component: () => (
    <TimeRangeProvider>
      <LiveDataProvider>
        <OnboardingGate />
        <DashboardPage />
      </LiveDataProvider>
    </TimeRangeProvider>
  ),
});

function DashboardPage() {
  const [segment, setSegment] = useState("all");
  const { range } = useTimeRange();
  const { agg, liveSince, connected } = useLiveAgg(segment, range);
  const baseMetrics = segmentMetrics(segment, range);
  // Fold real submissions into the headline metrics so the numbers move the
  // moment another user finishes a survey.
  const metrics = baseMetrics.map((m) => {
    if (!agg.count) return m;
    if (m.key === "responses") {
      const n =
        Number(String(m.value).replace(/[^0-9.]/g, "")) + agg.count;
      return { ...m, value: n.toLocaleString("en-US") };
    }
    if (m.key === "happiness") {
      const cells = Object.values(agg.byCat)
        .map((c) => c["happy"])
        .filter(Boolean) as { sum: number; n: number }[];
      const sum = cells.reduce((s, c) => s + c.sum, 0);
      const n = cells.reduce((s, c) => s + c.n, 0);
      if (!n) return m;
      const blended = (Number(m.value) * 40 + sum) / (40 + n);
      return { ...m, value: blended.toFixed(1) };
    }
    return m;
  });
  const segmentLabel = findSegment(segment).label;
  const rangeLabel = rangeMeta[range].label;
  return (
    <div className="relative min-h-screen text-foreground">
      <div className="dashboard-bg" aria-hidden />
      <div className="relative z-10">
        <TopBar />

        <main className="mx-auto w-full max-w-[1600px] px-6 py-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <SegmentPicker value={segment} onChange={setSegment} />
            <p className="text-xs text-muted-foreground">
              {metrics[0]?.value} responses · {segmentLabel} · {rangeLabel} · updated just now
              {connected ? (
                <span className="ml-2 text-foreground">
                  · live sync on{liveSince ? ` · +${liveSince} new` : ""}
                </span>
              ) : null}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {metrics.map((m, i) => (
                  <MetricCard key={`${segment}-${range}-${m.key}`} metric={m} index={i} />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
                <EmotionTrendChart segment={segment} />
                <CategoryShareChart segment={segment} />
              </div>

              <CategoryBarChart segment={segment} />

              <StatsPanel segment={segment} />
            </div>

            <aside className="flex flex-col gap-4">
              <KeyInsightsPanel segment={segment} />
              <SurveyCta />
              <InviteCard />
            </aside>
          </div>

          <footer className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-border pt-5 text-xs text-muted-foreground sm:flex-row">
            <p>© 2026 Memalize · Meme emotion research</p>
            <p className="font-mono">v1.0 · build 2026.01</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
