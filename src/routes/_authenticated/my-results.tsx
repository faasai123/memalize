import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PersonalResults, type Ratings } from "@/components/survey/personal-results";
import type { MemeCategory } from "@/lib/dashboard-data";
import type { MemeItem } from "@/lib/meme-media";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";

export const Route = createFileRoute("/_authenticated/my-results")({
  head: () => ({
    title: "Your saved meme reports — Memalize",
    meta: [
      {
        name: "description",
        content:
          "Revisit every Memalize survey report saved to your account: emotion scores, category breakdowns and the memes you collected.",
      },
      { property: "og:title", content: "Your saved meme reports — Memalize" },
      {
        property: "og:description",
        content: "Every survey you completed, saved to your account and viewable any time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyResultsPage,
});

type Group = { category: MemeCategory; items: MemeItem[] };

type SavedResult = {
  id: string;
  created_at: string;
  gender: string | null;
  age_group: string | null;
  ratings: Ratings;
  groups: Group[];
  collected: string[];
};

function MyResultsPage() {
  const [rows, setRows] = useState<SavedResult[] | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("survey_results")
      .select("id, created_at, gender, age_group, ratings, groups, collected")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!active) return;
        setRows((data ?? []) as unknown as SavedResult[]);
      });
    return () => {
      active = false;
    };
  }, []);

  const open = rows?.find((r) => r.id === openId) ?? null;

  if (open) {
    return (
      <div className="relative min-h-screen text-foreground">
        <div className="dashboard-bg" aria-hidden />
        <PersonalResults
          ratings={open.ratings}
          groups={open.groups}
          gender={open.gender}
          ageGroup={open.age_group}
          collected={open.collected ?? []}
          savedNote={
            <div className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" />
              Saved report from{" "}
              {new Date(open.created_at).toLocaleString()} · answers are locked
              <button
                type="button"
                onClick={() => setOpenId(null)}
                className="ml-2 font-medium text-foreground underline"
              >
                Back to list
              </button>
            </div>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="dashboard-bg" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 py-10">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back to dashboard
          </Link>
          <ThemeToggle />
        </div>

        <header className="mt-6">
          <p className="font-mono text-xs text-muted-foreground">Your account</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            Saved survey reports
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Every survey you finish while signed in is stored here. Reports are read-only —
            take the survey again to record a new one.
          </p>
        </header>

        <div className="mt-8 space-y-3">
          {rows === null ? (
            <p className="text-sm text-muted-foreground">Loading your reports…</p>
          ) : rows.length === 0 ? (
            <div className="glass rounded-2xl border border-border p-6 text-center">
              <p className="text-sm text-muted-foreground">
                No saved reports yet. Finish the survey and it lands here automatically.
              </p>
              <Link
                to="/survey"
                className="mt-4 inline-flex rounded-xl px-4 py-2 text-sm font-semibold"
                style={{
                  background: "linear-gradient(120deg, var(--blue-glow), var(--red-glow))",
                  color: "var(--primary-foreground)",
                }}
              >
                Take the survey
              </Link>
            </div>
          ) : (
            rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setOpenId(r.id)}
                className="glass flex w-full items-center gap-4 rounded-2xl border border-border p-4 text-left transition-all hover:scale-[1.01] hover:border-[var(--blue-glow)]"
              >
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    {new Date(r.created_at).toLocaleString()}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.gender ?? "—"} · {r.age_group ?? "—"} ·{" "}
                    {(r.collected?.length ?? 0)} memes collected
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">View</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
