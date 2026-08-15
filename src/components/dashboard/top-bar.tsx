import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { ThemeToggle } from "./theme-toggle";
import { useTimeRange, timeRangeKeys, rangeMeta } from "@/lib/time-range";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";
import { TRACKS } from "@/lib/tracks";

function AccountArea() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  const [track, setTrack] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setTrack(null);
      setDisplayName(null);
      return;
    }
    let active = true;
    supabase
      .from("profiles")
      .select("display_name, track")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setTrack((data?.track as string | null) ?? null);
        setDisplayName(
          data?.display_name ?? user.email?.split("@")[0] ?? null,
        );
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (loading) {
    return <span className="size-9 animate-pulse rounded-full bg-surface" aria-hidden />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <p className="hidden max-w-[16rem] text-right text-[11px] leading-tight text-muted-foreground sm:block">
          <span className="font-semibold text-foreground">Sign in to keep your results.</span>{" "}
          Saved reports, your mood mascot and collected memes stay in your account.
        </p>
        <Link
          to="/auth"
          className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const name = displayName ?? "Member";
  const trackLabel = TRACKS.find((t) => t.id === track)?.label ?? "Choose your track";
  const initials = name.slice(0, 2).toUpperCase();

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex items-center gap-2">
      <Link to="/onboarding" className="hidden text-right sm:block">
        <p className="text-xs font-semibold text-foreground">{name}</p>
        <p className="text-[11px] text-muted-foreground">{trackLabel}</p>
      </Link>
      <Link
        to="/my-results"
        className="hidden rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
      >
        My reports
      </Link>
      <span className="grid size-9 place-items-center rounded-full bg-surface text-xs font-semibold text-muted-foreground">
        {initials}
      </span>
      <button
        type="button"
        onClick={signOut}
        className="rounded-full border border-border px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </div>
  );
}

export function TopBar() {
  const { range, setRange } = useTimeRange();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now
    ? now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : "--:--:--";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto w-full max-w-[1600px] px-6 py-3">
        {/* Centered brand row */}
        <div className="flex items-center justify-center gap-3">
          <span
            className="logo-tile grid size-14 place-items-center rounded-2xl bg-surface text-3xl font-black shadow-lg ring-1 ring-border"
            style={{
              fontFamily: "'Baloo 2', 'Comic Sans MS', system-ui, sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            <span
              style={{
                background:
                  "linear-gradient(120deg, #ff5e7e, #ff9a3d, #ffe14d, #4dd965, #3aa0ff, #9b6bff, #ff5e7e)",
                backgroundSize: "200% 200%",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              M
            </span>
          </span>
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Memalize
          </h1>
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          See how memes make people feel — live.
        </p>

        {/* Controls row below */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium sm:inline-flex"
              style={{
                color: "var(--danger)",
                background: "color-mix(in oklab, var(--danger) 12%, transparent)",
              }}
            >
              <span className="live-dot size-1.5 rounded-full bg-danger" />
              Live
            </span>

            <div className="flex items-center gap-1 rounded-full bg-surface p-1 text-xs">
              {timeRangeKeys.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  aria-pressed={r === range}
                  className={
                    r === range
                      ? "rounded-full bg-card px-3 py-1 font-semibold text-primary shadow-sm"
                      : "rounded-full px-3 py-1 text-muted-foreground transition-colors hover:text-foreground"
                  }
                >
                  {rangeMeta[r].short}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="tabular font-mono text-xs text-muted-foreground">
              {time}
            </span>

            <ThemeToggle />

            <span aria-hidden className="hidden h-8 w-px bg-border sm:block" />

            <AccountArea />
          </div>
        </div>
      </div>
    </header>
  );
}
