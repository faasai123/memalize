# Memalize

> Real-time meme emotion analytics — see how memes make people feel.

🔗 **Live site:** <https://memalize.lovable.app>

Memalize is a full-stack web app that turns internet memes into emotion data.
Visitors view three randomly sampled memes per category and rate each one across
five emotions (Happy, Sad, Angry, Stressed, Bored) on a 1–10 scale. Their answers
feed a live analytics dashboard that breaks down emotional response by meme type,
audience segment, and time range. Signed-in users keep a history of their personal
reports and can export them as PDF.

---

## Table of contents

- [What it does](#what-it-does)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [How the code works](#how-the-code-works)
  - [Routing & layout](#routing--layout)
  - [Authentication & onboarding](#authentication--onboarding)
  - [The dashboard](#the-dashboard)
  - [The survey](#the-survey)
  - [Personal results & PDF export](#personal-results--pdf-export)
  - [Meme media pipeline](#meme-media-pipeline)
  - [Styling & theming](#styling--theming)
- [Backend / database](#backend--database)
- [Getting started](#getting-started)
- [Available scripts](#available-scripts)
- [Adding more memes](#adding-more-memes)
- [Notes](#notes)

---

## What it does

1. **Dashboard** (`/`) — A live analytics view with metric cards, an emotion
   trend chart, a category share donut, a category bar chart with average
   reference lines, a key-insights panel, and a statistical summary
   (mean / median / SD / max-min). Slice the data by **gender × age group** and
   by **time range** (1H, 1D, 1W, 1M, 1Y, or "Since launch").
2. **Survey** (`/survey`) — Shows three random memes per category, lets the user
   rate all five emotions on a 1–10 scale, and enforces that every question is
   answered before submitting. Includes an auto-fill, a collection mini-game
   (catch 10 floating meme circles), and an animated mood mascot that reacts to
   the dominant emotion.
3. **Personal results** — After submitting, the user sees a personal radar
   chart and insights comparing their before/after emotion deltas, with a
   one-click **Export PDF** (print-preview + `jsPDF`).
4. **Auth & saved reports** — Email/password and social login (Google, Apple,
   Microsoft) via Supabase Auth. New users pick a **track** (Researcher,
   Educator, Student, General). Signed-in users get their survey history saved
   and can revisit read-only reports at `/my-results`.

---

## Tech stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Framework    | TanStack Start v1 (full-stack React 19, SSR/SSG, Vite 7)  |
| Routing       | TanStack Router (file-based)                              |
| Data fetching| TanStack Query                                            |
| Styling       | Tailwind CSS v4 (native `@theme` tokens in `styles.css`) |
| Charts        | Recharts                                                  |
| PDF export    | `jsPDF` (+ `html2canvas-pro` for screenshots)            |
| Auth / DB     | Supabase (via Lovable Cloud)                              |
| UI primitives | Radix UI + shadcn-style components                        |
| Language      | TypeScript                                                |

---

## Project structure

```
src/
├─ routes/                      # File-based routes (one file per URL)
│  ├─ __root.tsx                 # Root layout: header, footer, <Outlet/>, error/404
│  ├─ index.tsx                  # "/" — the dashboard
│  ├─ survey.tsx                 # "/survey" — the survey + post-submit results
│  ├─ auth.tsx                  # "/auth" — login / signup / social login
│  └─ _authenticated/            # Auth-gated subtree
│     ├─ route.tsx               # Gate: redirects to /auth if no session
│     ├─ onboarding.tsx          # "/onboarding" — pick a track once
│     └─ my-results.tsx          # "/my-results" — saved report history
├─ components/
│  ├─ dashboard/                 # Charts, pickers, panels, top bar, theme toggle
│  ├─ survey/                    # personal-results, collectibles, mood-mascot
│  ├─ ui/                        # shadcn-style primitives
│  ├─ site-header.tsx, site-footer.tsx
│  ├─ hero-section.tsx, feature-row.tsx
│  └─ onboarding-gate.tsx
├─ lib/
│  ├─ dashboard-data.ts          # Mock dataset (categories, timeline, metrics, feed)
│  ├─ dashboard-segments.ts      # Segment + memoized metric derivation
│  ├─ dashboard-insights.ts      # "Key insights" derivation
│  ├─ meme-media.ts              # Discovers & samples meme images by category
│  ├─ time-range.tsx            # Time-range context + scaling metadata
│  ├─ tracks.ts                  # The four user tracks
│  ├─ post-auth.ts               # Decides / vs /onboarding after login
│  └─ utils.ts, error-*.ts, lovable-error-reporting.ts
├─ hooks/use-session.ts          # Supabase session hook
├─ integrations/supabase/        # Auto-generated Supabase clients (do not edit)
├─ assets/memes/                 # Meme images grouped by category folder
├─ styles.css                   # Tailwind v4 theme tokens + animations
├─ router.tsx, start.ts, server.ts
└─ routeTree.gen.ts              # Generated — never edit
```

---

## How the code works

### Routing & layout

TanStack Router maps filenames to URLs. `src/routes/__root.tsx` is the root
layout: it renders the site header, the route `<Outlet />`, the footer, the
`<HeadContent />`/`<Scripts />` for SSR, and the global error/404 components.
`src/routeTree.gen.ts` is regenerated by the Vite plugin on every build — never
hand-edit it.

Each route defines its own `head()` metadata (title, description, OG/Twitter
tags) so every page is SEO-indexable and shareable.

### Authentication & onboarding

- **`src/routes/auth.tsx`** — email/password signup & login plus Google, Apple,
  and Microsoft OAuth. Uses `supabase.auth.getUser()` (not `getSession()`) to
  revalidate against the server and clear any stale local session.
- **`src/routes/_authenticated/route.tsx`** — the auth gate. `beforeLoad`
  calls `supabase.auth.getUser()`; if there is no user it signs out locally and
  redirects to `/auth`. This subtree has `ssr: false` so the gate runs on the
  client only.
- **`src/routes/_authenticated/onboarding.tsx`** — first-time users pick one of
  four tracks (Researcher, Educator, Student, General) and optional display
  name. The choice is saved to `profiles.track`. Returning users are skipped
  straight to `/`.
- **`src/lib/post-auth.ts`** — `destinationAfterAuth()` returns `/` if the user
  already has a track, otherwise `/onboarding`.
- **`src/start.ts`** — registers `attachSupabaseAuth` function middleware so
  protected server functions carry the user's bearer token, plus CSRF and
  error middleware.

### The dashboard

`src/routes/index.tsx` composes the dashboard from the `components/dashboard/*`
pieces. The data layer is mock data in `src/lib/dashboard-data.ts`, shaped to
match the real questionnaire so a backend can later replace that module without
touching the components.

- **`dashboard-segments.ts`** — defines audience segments (All / Gender / Age
  group, combinable as e.g. `gender:male+age:u12`) and derives deterministic,
  memoized variations of the base metrics for any segment.
- **`time-range.tsx`** — a context provider for the selected time range
  (`1H | 1D | 1W | 1M | 1Y | ALL`), each with a label, axis unit, sample count,
  and a `scale` multiplier applied to response counts. "ALL" means
  since-launch-to-now.
- Charts (`category-bar-chart`, `emotion-trend-chart`, `category-share-chart`)
  are `React.memo`'d with `useMemo` internals and animated via Recharts
  `isAnimationActive`, so switching filters/emotions is smooth and cheap.
- **`stats-panel.tsx`** — descriptive statistics (mean, median, standard
  deviation, max/min category) per emotion, plus a grand mean, dominant
  emotion, and most-variable-emotion summary.
- **`key-insights-panel.tsx`** — surfaces headline findings like "Strongest
  Anger Trigger".

### The survey

`src/routes/survey.tsx` is the survey experience:

- Samples **3 memes per category** using a session-based random seed
  (`meme-media.ts → sampleAllCategories`) so picks reshuffle every visit but
  stay consistent between SSR and the client (avoiding hydration mismatches).
- Each meme is rated on **5 emotions × 1–10**. Submission is blocked until
  every rating is filled. An **auto-fill** button sets all ratings to 5.
- A sticky **ProgressNav** shows completion; colored rating tracks and a dashed
  average reference line keep things readable.
- **`collectibles.tsx`** — a mini-game: 10 floating meme circles (randomized per
  visit from a 24-item pool) drift around for the user to collect; a HUD tracks
  progress and stores which memes were collected.
- **`mood-mascot.tsx`** — an animated SVG character that shifts to match the
  user's dominant emotion.

### Personal results & PDF export

`src/components/survey/personal-results.tsx` renders the post-submit report:
a radar chart of the user's emotion profile, before/after deltas, and insights.
The **Export PDF** button opens a full-screen print-preview overlay (zoom +
pan + keyboard nav) and renders the report to a multi-page PDF via `jsPDF`.
Navigation links and the theme toggle are hidden during export so the PDF is
clean.

Signed-in users have each completed survey persisted to the `survey_results`
table; `src/routes/_authenticated/my-results.tsx` lists them and reopens any as a
read-only report.

### Meme media pipeline

`src/lib/meme-media.ts` auto-discovers every image under
`src/assets/memes/<Category>/` at build time via `import.meta.glob`. It supports
both raw image imports and `.asset.json` CDN pointers (used for large/GIF
assets). `sampleCategory(category, count, seed)` returns a deterministic,
seeded-shuffled subset so SSR and client agree. Add a file to a folder and it
appears automatically — no code change needed.

### Styling & theming

`src/styles.css` defines the Tailwind v4 `@theme` tokens: background/foreground,
primary, danger, and the five emotion chart colors (`--chart-happy`, `--chart-sad`,
`--chart-angry`, `--chart-stressed`, `--chart-bored`). Page-entry animations
(`page-enter`, `page-enter-lift`) are defined here and triggered by keying the
root `<Outlet />` wrapper on the current pathname in `__root.tsx`. A theme
toggle (`components/dashboard/theme-toggle.tsx`) switches light/dark.

---

## Backend / database

The app uses Supabase (via Lovable Cloud) for auth and persistence:

- **`profiles`** — `id` (→ `auth.users`), `display_name`, `gender`,
  `age_group`, `track`. Created on first login, upserted during onboarding.
- **`survey_results`** — `id`, `created_at`, `user_id`, `gender`, `age_group`,
  `ratings` (JSON), `groups` (JSON of category → memes shown), `collected`
  (JSON array of collected meme ids). Protected by RLS so users only read their
  own rows.

Tables are created with explicit `GRANT` statements and RLS enabled. The
auto-generated Supabase clients live in `src/integrations/supabase/` — do not
edit them.

---

## Getting started

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

The dev server runs Vite. Open the printed local URL in your browser.

### Environment

The Supabase connection is configured through Lovable Cloud (the
`VITE_SUPABASE_*` / project-id env vars are managed for you). No manual
service-role keys or database passwords are needed for local development.

---

## Available scripts

| Script           | What it does                                   |
| ---------------- | --------------------------------------------- |
| `npm run dev`    | Start the Vite dev server (HMR).              |
| `npm run build`  | Production build.                             |
| `npm run preview`| Preview the production build locally.          |
| `npm run lint`   | Run ESLint.                                   |
| `npm run format` | Format the codebase with Prettier.            |

---

## Adding more memes

1. Drop images (`.jpg`, `.png`, `.gif`, `.webp`, `.avif`) into the matching
   category folder under `src/assets/memes/`.
2. That's it — `meme-media.ts` picks them up automatically on the next build.

To add an entire new category, add a folder and a matching entry in
`memeCategories` (`src/lib/dashboard-data.ts`).

---

## Notes

- The dashboard data in `src/lib/dashboard-data.ts` is mock data, shaped to
  match the real questionnaire. Wiring it to a live backend means replacing
  that module — the components don't need to change.
- `src/routeTree.gen.ts` is generated by the TanStack Router Vite plugin; never
  edit it by hand.
- `src/integrations/supabase/*` files are auto-generated; do not edit them.
