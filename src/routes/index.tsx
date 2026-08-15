import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { findSegment, segmentMetrics } from "@/lib/dashboard-segments";
import { TimeRangeProvider, useTimeRange, rangeMeta } from "@/lib/time-range";
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
    title: "Memalize — Real-time meme emotion analytics",
    meta: [
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
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <TimeRangeProvider>
      <OnboardingGate />
      <DashboardPage />
    </TimeRangeProvider>
  ),
});

function DashboardPage() {
  const [segment, setSegment] = useState("all");
  const { range } = useTimeRange();
  const metrics = segmentMetrics(segment, range);
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
