import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { TRACKS, type TrackId } from "@/lib/tracks";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    title: "Choose your track — Memalize",
    meta: [
      {
        name: "description",
        content:
          "Pick how you'll use Memalize: researcher, educator, student or general explorer of meme emotion data.",
      },
      { property: "og:title", content: "Choose your track — Memalize" },
      {
        property: "og:description",
        content: "Tell us whether you're a researcher, educator, student or just curious.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<TrackId | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const user = data.user;
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, track")
        .eq("id", user.id)
        .maybeSingle();
      if (profile?.track) {
        // Already onboarded — never ask again, reuse the saved data.
        navigate({ to: "/", replace: true });
        return;
      }
      setName(
        profile?.display_name ??
          (user.user_metadata?.["display_name"] as string) ??
          user.email?.split("@")[0] ??
          "",
      );
    });
  }, [navigate]);

  async function save() {
    if (!selected) return;
    setBusy(true);
    setError(null);
    const { data } = await supabase.auth.getUser();
    const user = data.user;
    if (!user) {
      navigate({ to: "/auth", replace: true });
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, track: selected, display_name: name || null }, { onConflict: "id" });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    navigate({ to: "/", replace: true });
  }

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="dashboard-bg" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-3xl px-5 py-14">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Step 1 of 1
        </p>
        <h1 className="mt-2 text-center font-display text-3xl font-bold tracking-tight">
          Which track are you on?
        </h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          We'll tailor the dashboard and survey wording to you. You can change this later.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {TRACKS.map((t) => {
            const active = selected === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t.id)}
                aria-pressed={active}
                className={
                  "rounded-2xl border p-5 text-left transition-all " +
                  (active
                    ? "border-primary bg-card shadow-lg ring-2 ring-primary/40"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-md")
                }
              >
                <span className="text-2xl" aria-hidden>
                  {t.emoji}
                </span>
                <p className="mt-2 font-display text-lg font-semibold">{t.label}</p>
                <p className="text-xs font-medium text-primary">{t.tagline}</p>
                <p className="mt-2 text-sm text-muted-foreground">{t.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6">
          <label htmlFor="display-name" className="mb-1 block text-xs font-medium text-muted-foreground">
            Display name
          </label>
          <input
            id="display-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
        )}

        <button
          type="button"
          onClick={save}
          disabled={!selected || busy}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Saving…" : selected ? "Continue to dashboard" : "Pick a track to continue"}
        </button>
      </div>
    </div>
  );
}