import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { destinationAfterAuth } from "@/lib/post-auth";
import { lovable } from "@/integrations/lovable/index";

export const Route = createFileRoute("/auth")({
  head: () => ({
    title: "Sign in or sign up — Memalize",
    meta: [
      {
        name: "description",
        content:
          "Create a Memalize account or sign in with email or Google to take the meme emotion survey and track your own results.",
      },
      { property: "og:title", content: "Sign in or sign up — Memalize" },
      {
        property: "og:description",
        content: "Join the Memalize meme emotion study — sign in with email or Google.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // getUser() revalidates with the server, so deleted/revoked accounts do not
    // bounce back into the protected area and cause a redirect loop.
    supabase.auth.getUser().then(async ({ data, error }) => {
      if (cancelled) return;
      if (error || !data.user) {
        await supabase.auth.signOut({ scope: "local" }).catch(() => {});
        return;
      }
      const to = await destinationAfterAuth();
      if (!cancelled) navigate({ to, replace: true });
    });
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  async function goAfterAuth() {
    navigate({ to: await destinationAfterAuth(), replace: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/onboarding`,
            data: { display_name: name || email.split("@")[0] },
          },
        });
        if (error) throw error;
        if (data.session) {
          await goAfterAuth();
        } else {
          setNotice("Account created. Check your email to confirm, then come back to pick your track.");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await goAfterAuth();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleOAuth(provider: "google" | "apple" | "microsoft", label: string) {
    setError(null);
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(`${label} sign-in failed. Please try again.`);
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    await goAfterAuth();
  }

  const handleGoogle = () => handleOAuth("google", "Google");
  const handleApple = () => handleOAuth("apple", "Apple");
  const handleMicrosoft = () => handleOAuth("microsoft", "Microsoft");

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="dashboard-bg" aria-hidden />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-6 flex items-center justify-center gap-3">
            <span
              className="grid size-11 place-items-center rounded-2xl bg-surface text-2xl font-black ring-1 ring-border"
              style={{ fontFamily: "'Baloo 2', system-ui, sans-serif" }}
            >
              <span
                style={{
                  background:
                    "linear-gradient(120deg, #ff5e7e, #ff9a3d, #ffe14d, #4dd965, #3aa0ff, #9b6bff)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                M
              </span>
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">Memalize</span>
          </Link>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-xl sm:p-8">
            <h1 className="text-center font-display text-2xl font-bold">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </h1>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              {mode === "signin"
                ? "Sign in to continue your meme emotion research."
                : "Join the study, take the survey and get your mood mascot."}
            </p>

            <div className="mt-6 grid w-full gap-2.5">
              <button
                type="button"
                onClick={handleGoogle}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12S6.8 21.5 12 21.5c5.6 0 9.3-3.9 9.3-9.4 0-.6-.06-1.1-.15-1.6H12z" />
                </svg>
                Continue with Google
              </button>
              <button
                type="button"
                onClick={handleApple}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
                  <path d="M16.365 1.43c.02.23-.06.46-.2.66-.16.22-.39.4-.66.5-.27.1-.55.1-.8.04-.26-.06-.5-.2-.66-.42-.02-.22.06-.44.2-.66.16-.22.4-.4.66-.5.27-.1.55-.1.8-.04.27.06.5.2.66.42zM18.7 18.6c-.4 1.02-.86 2.02-1.4 3-.5.86-1.06 1.7-1.7 2.46-.5.6-1.04 1.04-1.66 1.3-.56.24-1.18.3-1.84.18-.5-.1-.94-.28-1.34-.56-.4-.28-.86-.46-1.34-.56-.66-.12-1.28-.06-1.84.18-.62.26-1.16.7-1.66 1.3-.64-.76-1.2-1.6-1.7-2.46-.54-.98-1-1.98-1.4-3-.3-.8-.5-1.6-.56-2.4-.06-.76.04-1.5.3-2.16.26-.64.66-1.16 1.2-1.54.5-.36 1.1-.56 1.74-.56.36 0 .72.08 1.06.24.34.16.68.34 1 .54.34.2.7.38 1.06.54.34.16.7.24 1.06.24s.72-.08 1.06-.24c.34-.16.68-.34 1-.54.34-.2.68-.38 1.06-.54.34-.16.7-.24 1.06-.24.64 0 1.24.2 1.74.56.54.38.94.9 1.2 1.54.26.66.36 1.4.3 2.16-.06.8-.26 1.6-.56 2.4z" />
                </svg>
                Continue with Apple
              </button>
              <button
                type="button"
                onClick={handleMicrosoft}
                disabled={busy}
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                  <path fill="#F25022" d="M3 3h8.5v8.5H3z" />
                  <path fill="#7FBA00" d="M12.5 3H21v8.5h-8.5z" />
                  <path fill="#00A4EF" d="M3 12.5h8.5V21H3z" />
                  <path fill="#FFB900" d="M12.5 12.5H21V21h-8.5z" />
                </svg>
                Continue with Microsoft
              </button>
            </div>

            <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="mb-1 block text-xs font-medium text-muted-foreground">
                    Display name
                  </label>
                  <input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="How should we call you?"
                    className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-1 block text-xs font-medium text-muted-foreground">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
              )}
              {notice && (
                <p className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">{notice}</p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-muted-foreground">
              {mode === "signin" ? "New to Memalize?" : "Already have an account?"}{" "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signin" ? "signup" : "signin");
                  setError(null);
                  setNotice(null);
                }}
                className="font-semibold text-primary hover:underline"
              >
                {mode === "signin" ? "Create an account" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              ← Back to dashboard
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}