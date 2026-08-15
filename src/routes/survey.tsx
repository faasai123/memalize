import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ImageIcon, Check, Wand2, RotateCcw } from "lucide-react";
import { emotions, memeCategories, type Emotion } from "@/lib/dashboard-data";
import { sampleAllCategories, randomSeed, type MemeItem } from "@/lib/meme-media";
import { PersonalResults } from "@/components/survey/personal-results";
import { CollectibleField, CollectibleHUD, buildCollectibles } from "@/components/survey/collectibles";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { useSession } from "@/hooks/use-session";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/survey")({
  head: () => ({
    meta: [
      { title: "Memalize survey — Rate how memes make you feel" },
      {
        name: "description",
        content:
          "Take the Memalize survey: view three random memes and GIFs from each category and rate happy, sad, angry, stressed and bored on a 1-10 scale.",
      },
      { property: "og:title", content: "Memalize survey — Rate how memes make you feel" },
      {
        property: "og:description",
        content:
          "Three random memes per category, five emotions, a 1-10 scale. Your ratings feed the live Memalize dashboard.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://memalize.lovable.app/survey" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://memalize.lovable.app/survey" }],
  }),
  component: SurveyPage,
});

type Ratings = Record<string, Partial<Record<Emotion, number>>>;

const genderOptions = ["Male", "Female", "Other"];
const ageOptions = [
  "Under 12",
  "13 – 15",
  "16 – 18",
  "19 – 21",
  "22 – 24",
  "25 and above",
];

function ChoiceRow({
  options,
  value,
  onChange,
  name,
}: {
  options: string[];
  value: string | null;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <button
            key={opt}
            type="button"
            aria-label={`${name} ${opt}`}
            aria-pressed={active}
            onClick={() => onChange(opt)}
            className="rounded-xl border px-3.5 py-2 text-xs font-medium transition-all hover:scale-[1.03]"
            style={
              active
                ? {
                    borderColor: "var(--blue-glow)",
                    background: "color-mix(in oklab, var(--blue-glow) 22%, transparent)",
                    color: "var(--foreground)",
                    boxShadow: "0 0 18px -6px var(--blue-glow)",
                  }
                : { borderColor: "var(--border)", color: "var(--muted-foreground)" }
            }
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function MediaTile({ item, index }: { item: MemeItem; index: number }) {
  return (
    <div
      className="relative flex w-full items-center justify-center overflow-hidden rounded-xl border bg-card p-2 transition-shadow sm:w-72 sm:shrink-0"
      style={{
        borderColor: "color-mix(in oklab, var(--chart-stressed) 45%, var(--border))",
        boxShadow: "0 0 0 3px color-mix(in oklab, var(--chart-stressed) 12%, transparent)",
      }}
    >
      {item.src ? (
        <img
          src={item.src}
          alt={`${item.folder} meme ${index + 1}`}
          loading="lazy"
          className="max-h-[420px] w-full object-contain"
        />
      ) : (
        <div className="flex h-48 w-full flex-col items-center justify-center gap-1 text-muted-foreground">
          <ImageIcon className="size-5" />
          <span className="font-mono text-[10px]">slot {index + 1}</span>
        </div>
      )}
      {item.isGif && (
        <span className="absolute left-1.5 top-1.5 rounded-md bg-black/60 px-1.5 py-0.5 font-mono text-[10px] text-foreground">
          GIF
        </span>
      )}
    </div>
  );
}

function EmotionScale({
  value,
  onChange,
  label,
  color,
}: {
  value?: number | undefined;
  onChange: (n: number) => void;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-20 shrink-0 text-sm font-semibold tracking-tight"
        style={{ color }}
      >
        {label}
      </span>
      <div className="relative min-w-0 flex-1 py-1.5">
        <div
          className="pointer-events-none absolute inset-x-3 top-1/2 h-[3px] -translate-y-1/2 rounded-full"
          style={{ background: `color-mix(in oklab, ${color} 35%, transparent)` }}
        />
        <div
          className="pointer-events-none absolute left-3 top-1/2 h-[3px] -translate-y-1/2 rounded-full transition-all"
          style={{
            background: color,
            width: value ? `calc((100% - 1.5rem) * ${(value - 1) / 9})` : 0,
          }}
        />
        <div className="relative flex items-center justify-between">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
            const active = value === n;
            const reached = value !== undefined && n <= value;
            return (
              <button
                key={n}
                type="button"
                aria-label={`${label} ${n}`}
                aria-pressed={active}
                onClick={() => onChange(n)}
                className="tabular grid size-6 place-items-center rounded-full border text-[11px] font-semibold transition-all hover:scale-125"
                style={
                  active
                    ? {
                        borderColor: color,
                        background: color,
                        color: "oklch(0.16 0.03 258)",
                        boxShadow: `0 0 0 4px color-mix(in oklab, ${color} 25%, transparent), 0 0 16px -2px ${color}`,
                        transform: "scale(1.2)",
                      }
                    : reached
                      ? {
                          borderColor: color,
                          background: `color-mix(in oklab, ${color} 55%, var(--card))`,
                          color: "var(--foreground)",
                        }
                      : {
                          borderColor: `color-mix(in oklab, ${color} 45%, var(--border))`,
                          background: "var(--card)",
                          color: "var(--muted-foreground)",
                        }
                }
              >
                {n}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SurveyPage() {
  // Deterministic on first render (SSR-safe); re-randomized per visit on the client
  // so each survey attempt draws different memes and collectible circles.
  const [seed, setSeed] = useState<string | null>(null);
  useEffect(() => {
    setSeed(randomSeed());
  }, []);
  const groups = useMemo(() => sampleAllCategories(3, seed ?? undefined), [seed]);
  const collectibles = useMemo(() => buildCollectibles(seed ?? "memalize"), [seed]);
  const [ratings, setRatings] = useState<Ratings>({});
  const [gender, setGender] = useState<string | null>(null);
  const [ageGroup, setAgeGroup] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [collected, setCollected] = useState<string[]>([]);
  const { user } = useSession();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  // Ids of the rows this session already published. Re-submitting after
  // "Edit answers" updates these rows instead of counting a new response.
  const [liveRowId, setLiveRowId] = useState<string | null>(null);
  const [resultRowId, setResultRowId] = useState<string | null>(null);

  // Signed-in people keep their gender / age group across sessions.
  useEffect(() => {
    if (!user) return;
    let active = true;
    supabase
      .from("profiles")
      .select("gender, age_group")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        if (data.gender) setGender((prev) => prev ?? data.gender);
        if (data.age_group) setAgeGroup((prev) => prev ?? data.age_group);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const persistProfile = (patch: { gender?: string; age_group?: string }) => {
    if (!user) return;
    void supabase
      .from("profiles")
      .upsert({ id: user.id, ...patch }, { onConflict: "id" });
  };

  const chooseGender = (value: string) => {
    setGender(value);
    persistProfile({ gender: value });
  };
  const chooseAgeGroup = (value: string) => {
    setAgeGroup(value);
    persistProfile({ age_group: value });
  };

  if (submitted) {
    return (
      <PersonalResults
        ratings={ratings}
        groups={groups}
        gender={gender}
        ageGroup={ageGroup}
        collected={collected}
        collectibles={collectibles}
        onEdit={() => setSubmitted(false)}
        savedNote={
          user ? (
            <p className="text-xs text-muted-foreground">
              {saveState === "saving"
                ? "Saving this report to your account…"
                : saveState === "error"
                  ? "Couldn't save this report to your account."
                  : "Saved to your account — "}
              {saveState === "saved" ? (
                <Link to="/my-results" className="font-medium text-foreground underline">
                  revisit it any time
                </Link>
              ) : null}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not signed in — this report disappears when you close the tab.{" "}
              <Link to="/auth" className="font-medium text-foreground underline">
                Create a free account
              </Link>{" "}
              to save every result and revisit it later.
            </p>
          )
        }
      />
    );
  }

  const submitSurvey = async () => {
    setSubmitted(true);

    // Publish an anonymous, per-category average so every open dashboard
    // updates in realtime — this happens for signed-in and guest users alike.
    const scores: Record<string, Record<string, number>> = {};
    for (const { category, items } of groups) {
      const acc: Record<string, { sum: number; n: number }> = {};
      for (const item of items) {
        const r = ratings[item.id];
        if (!r) continue;
        for (const e of emotions) {
          const v = r[e.key];
          if (typeof v !== "number") continue;
          const cell = (acc[e.key] ??= { sum: 0, n: 0 });
          cell.sum += v;
          cell.n += 1;
        }
      }
      const avg: Record<string, number> = {};
      for (const [k, cell] of Object.entries(acc)) {
        if (cell.n) avg[k] = +(cell.sum / cell.n).toFixed(2);
      }
      if (Object.keys(avg).length) scores[category.key] = avg;
    }
    if (Object.keys(scores).length) {
      const payload = {
        gender,
        age_group: ageGroup,
        scores: scores as never,
      };
      if (liveRowId) {
        await supabase.from("live_responses").update(payload).eq("id", liveRowId);
      } else {
        const { data } = await supabase
          .from("live_responses")
          .insert(payload)
          .select("id")
          .maybeSingle();
        if (data?.id) setLiveRowId(data.id);
      }
    }

    if (!user) return;
    setSaveState("saving");
    const resultPayload = {
      user_id: user.id,
      gender,
      age_group: ageGroup,
      ratings: ratings as never,
      groups: groups as never,
      collected,
    };
    if (resultRowId) {
      const { error } = await supabase
        .from("survey_results")
        .update(resultPayload)
        .eq("id", resultRowId);
      setSaveState(error ? "error" : "saved");
    } else {
      const { data, error } = await supabase
        .from("survey_results")
        .insert(resultPayload)
        .select("id")
        .maybeSingle();
      if (data?.id) setResultRowId(data.id);
      setSaveState(error ? "error" : "saved");
    }
  };

  const totalItems = groups.reduce((n, g) => n + g.items.length, 0) + 2;
  const answered = Object.values(ratings).filter(
    (r) => Object.keys(r).length === emotions.length,
  ).length;
  const profileComplete = Boolean(gender) && Boolean(ageGroup);
  const ratingsComplete = answered >= totalItems;
  const allAnswered = profileComplete && ratingsComplete;
  const submitLabel = submitted
    ? "Responses recorded"
    : allAnswered
      ? "Submit responses"
      : !ratingsComplete
        ? `Answer all (${totalItems - answered} left)`
        : "Select gender & age group";

  const setScore = (key: string, emotion: Emotion, score: number) =>
    setRatings((prev) => ({ ...prev, [key]: { ...prev[key], [emotion]: score } }));

  const autoFillFive = (keys: string[]) =>
    setRatings((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        const filled: Record<Emotion, number> = { ...prev[key] } as Record<Emotion, number>;
        for (const e of emotions) filled[e.key] = 5;
        next[key] = filled;
      }
      return next;
    });

  const resetKeys = (keys: string[]) =>
    setRatings((prev) => {
      const next = { ...prev };
      for (const key of keys) delete next[key];
      return next;
    });

  const QuestionActions = ({ keys }: { keys: string[] }) => (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => autoFillFive(keys)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:scale-[1.03] hover:border-[var(--blue-glow)] hover:text-foreground"
        title="Fill all emotions with 5"
      >
        <Wand2 className="size-3" />
        Auto-fill 5
      </button>
      <button
        type="button"
        onClick={() => resetKeys(keys)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:scale-[1.03] hover:border-[var(--red-glow)] hover:text-foreground"
        title="Clear all emotion ratings in this question"
      >
        <RotateCcw className="size-3" />
        Reset
      </button>
    </div>
  );

  const isRated = (key: string) =>
    Object.keys(ratings[key] ?? {}).length === emotions.length;

  const progressSections = [
    {
      id: "about-you",
      label: "About you",
      done: profileComplete,
      sub: false,
    },
    { id: "q1-before", label: "Q1: Before", done: isRated("q1-before"), sub: false },
    { id: "q2", label: "Q2: Reaction", done: groups.every((g) => g.items.every((it) => isRated(it.id))), sub: false },
    ...groups.map((g, gi) => ({
      id: `group-${g.category.key}`,
      label: `2.${gi + 1} ${g.category.label}`,
      done: g.items.every((it) => isRated(it.id)),
      sub: true,
    })),
    { id: "q3-after", label: "Q3: After", done: isRated("q3-after"), sub: false },
  ];

  const activeId = progressSections.find((s) => !s.done)?.id ?? "q3-after";

  const ProgressNav = () => (
    <nav aria-label="Survey progress" className="glass rounded-2xl border border-border p-4">
      <p className="font-display text-sm font-semibold">Progress</p>
      <ul className="mt-3 space-y-1">
        {progressSections.map((s) => {
          const active = s.id === activeId;
          const color = s.done
            ? "var(--chart-happy)"
            : active
              ? "var(--blue-glow)"
              : "var(--border)";
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className={`flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-[color-mix(in_oklab,var(--blue-glow)_10%,transparent)] ${
                  s.sub ? "pl-5 text-muted-foreground" : "font-medium"
                } ${active ? "text-foreground" : ""}`}
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    background: color,
                    boxShadow: active ? `0 0 10px ${color}` : "none",
                  }}
                />
                <span className="truncate">{s.label}</span>
                {s.done ? <Check className="ml-auto size-3 text-[var(--chart-happy)]" /> : null}
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.round((answered / totalItems) * 100)}%`,
              background: "linear-gradient(90deg, var(--blue-glow), var(--red-glow))",
            }}
          />
        </div>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground">
          {answered} / {totalItems} blocks rated
        </p>
      </div>
    </nav>
  );

  return (
    <div className="relative min-h-screen text-foreground">
      <div className="dashboard-bg" aria-hidden />
      <div className="relative z-10 mx-auto w-full max-w-6xl px-6 py-10">
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
          <p className="font-mono text-xs text-muted-foreground">Memalize questionnaire</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
            How do memes make you feel?
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Three questions: your mood before, your reaction to memes from{" "}
            {memeCategories.length} groups (3 random items each), and your mood afterwards. Every
            block uses the same five emotions on a 1&ndash;10 scale, where 1 is the lowest and 10
            is the highest.
          </p>
        </header>

        <div className="mt-8 flex gap-6">
          <aside className="hidden w-56 shrink-0 lg:block">
            <div className="sticky top-6">
              <ProgressNav />
            </div>
          </aside>

          <div className="relative min-w-0 flex-1 scroll-smooth">
            <CollectibleField
              collected={collected}
              collectibles={collectibles}
              onCollect={(id) =>
                setCollected((prev) => (prev.includes(id) ? prev : [...prev, id]))
              }
            />
        <section id="about-you" className="glass card-rise scroll-mt-6 rounded-2xl border border-border p-5">
          <p className="font-mono text-[11px] text-muted-foreground">About you</p>
          <h2 className="mt-1 font-display text-lg font-semibold">
            Before you begin, tell us a little about yourself
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Gender</p>
              <ChoiceRow
                name="Gender"
                options={genderOptions}
                value={gender}
                onChange={chooseGender}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">Age group (years)</p>
              <ChoiceRow
                name="Age group"
                options={ageOptions}
                value={ageGroup}
                onChange={chooseAgeGroup}
              />
            </div>
          </div>
        </section>

        <section id="q1-before" className="glass card-rise mt-6 scroll-mt-6 rounded-2xl border border-border p-5">
          <p className="font-mono text-[11px] text-muted-foreground">Question 1</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              Before starting, how are you feeling right now?
            </h2>
            <QuestionActions keys={["q1-before"]} />
          </div>
          <div className="mt-4 space-y-2.5">
            {emotions.map((e) => (
              <EmotionScale
                key={e.key}
                label={e.label}
                color={e.color}
                value={ratings["q1-before"]?.[e.key]}
                onChange={(n) => setScore("q1-before", e.key, n)}
              />
            ))}
          </div>
        </section>

        <div id="q2" className="mt-8 scroll-mt-6">
          <p className="font-mono text-[11px] text-muted-foreground">Question 2</p>
          <h2 className="mt-1 font-display text-xl font-semibold">
            When you see these meme types, how do you feel?
          </h2>
        </div>

        <div className="mt-4 space-y-6">
          {groups.map(({ category, items }, gi) => (
            <section
              key={category.key}
              id={`group-${category.key}`}
              className="glass card-rise scroll-mt-6 rounded-2xl border border-border p-5"
              style={{ animationDelay: `${gi * 60}ms` }}
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-lg font-semibold">
                  2.{gi + 1} {category.label}
                </h3>
                <div className="flex items-center gap-3">
                  <QuestionActions keys={items.map((it) => it.id)} />
                  <span className="font-mono text-[11px] text-muted-foreground">
                    {category.folder} · 3 random
                  </span>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                {items.map((item, i) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-xl border border-border bg-card/40 p-4 sm:flex-row"
                  >
                    <MediaTile item={item} index={i} />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] text-muted-foreground">
                        2.{gi + 1}.{i + 1} · {category.label} meme {i + 1}
                      </p>
                      <div className="mt-3 space-y-2.5">
                        {emotions.map((e) => (
                          <EmotionScale
                            key={e.key}
                            label={e.label}
                            color={e.color}
                            value={ratings[item.id]?.[e.key]}
                            onChange={(n) => setScore(item.id, e.key, n)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        <section id="q3-after" className="glass card-rise mt-8 scroll-mt-6 rounded-2xl border border-border p-5">
          <p className="font-mono text-[11px] text-muted-foreground">Question 3</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">
              Now that you have finished, how are you feeling?
            </h2>
            <QuestionActions keys={["q3-after"]} />
          </div>
          <div className="mt-4 space-y-2.5">
            {emotions.map((e) => (
              <EmotionScale
                key={e.key}
                label={e.label}
                color={e.color}
                value={ratings["q3-after"]?.[e.key]}
                onChange={(n) => setScore("q3-after", e.key, n)}
              />
            ))}
          </div>
        </section>

        <div className="sticky bottom-4 mt-8">
          <div className="glass flex items-center justify-between gap-4 rounded-2xl border border-border p-4">
            <p className="text-xs text-muted-foreground">
              <span className="tabular text-foreground">{answered}</span> / {totalItems} blocks
              fully rated
              {ratingsComplete && !profileComplete ? (
                <span className="ml-2 text-[var(--red-glow)]">
                  · pick your gender & age group above
                </span>
              ) : null}
            </p>
            <button
              type="button"
              disabled={!allAnswered}
              onClick={() => void submitSurvey()}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-transform enabled:hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                background: "linear-gradient(120deg, var(--blue-glow), var(--red-glow))",
                boxShadow: allAnswered
                  ? "0 8px 30px -8px var(--blue-glow)"
                  : "none",
                color: "var(--primary-foreground)",
              }}
            >
              {submitted ? <Check className="size-4" /> : null}
              {submitLabel}
            </button>
          </div>
        </div>
          </div>
        </div>
      </div>
      <CollectibleHUD collected={collected} collectibles={collectibles} />
    </div>
  );
}