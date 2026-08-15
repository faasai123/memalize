# Deployment Guide — Memalize

This guide walks through hosting the **frontend site** and **backend
( database / auth / server functions )** for Memalize, plus the optional
Stripe / callback setup if you later add payments.

Memalize has **no Stripe integration today** — the "Stripe / callbacks"
section below is reference material for when you add it.

---

## 0. Architecture at a glance

| Layer              | What runs it                                            | Where it lives                       |
| ------------------ | ------------------------------------------------------ | ------------------------------------ |
| Frontend + SSR     | TanStack Start (Vite build → Cloudflare Worker bundle) | `src/` (built by `npm run build`)    |
| Server functions   | `createServerFn` — same Worker as the site             | `src/lib/*.functions.ts`, `src/routes/api/*` |
| Webhooks/callbacks | TanStack server routes (`/api/public/*`)               | `src/routes/api/public/*`             |
| Database + Auth    | Supabase (managed via Lovable Cloud)                  | managed; see `supabase/config.toml` |
| Meme media         | Static assets bundled at build time                   | `src/assets/memes/`                   |

Key facts that shape deployment:

- The production build emits a **Cloudflare Worker** bundle (Nitro target
  `cloudflare`, set by the Lovable Vite config). `src/server.ts` is the
  Worker entry. SSR and server functions run in that Worker.
- Social sign-in (Google / Apple / Microsoft) uses the **Lovable broker**
  (`@lovable.dev/cloud-auth-js`). It works out-of-the-box on Lovable-published
  sites and previews. For fully external hosting, see §4.4.
- There is **no** Stripe, no webhook secret, no callback route today. §5 is
  only for when you add payments.

---

## 1. Prerequisites

- Node.js 20+ and npm (or bun).
- Access to the Supabase project (Lovable Cloud manages it; to host fully
  outside Lovable you'd connect your own Supabase project — see §4.5).
- A clone of this repo with `.env` populated (see §2).

---

## 2. Environment variables

The app reads two sets of the same values — `VITE_*` for the browser,
plain names for the server/Worker. Both must be present at **build time**
and **runtime**.

```ini
# Browser (Vite injects at build time)
VITE_SUPABASE_URL=https://edyohiketdhmpydjddwt.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_SUPABASE_PROJECT_ID=edyohiketdhmpydjddwt

# Server / Worker runtime
SUPABASE_URL=https://edyohiketdhmpydjddwt.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_PROJECT_ID=edyohiketdhmpydjddwt
```

Secret-only (never in the browser, never committed):

```ini
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...   # server-only, for privileged work
```

> On Lovable Cloud these are managed for you. For external hosting, set
> them in your provider's environment/secret store. `SUPABASE_SERVICE_ROLE_KEY`
> is only needed if you use `supabaseAdmin`; the app uses it only inside
> server functions that load it lazily.

---

## 3. Easiest path — publish on Lovable

This is the default and needs zero infra work.

1. Click **Publish** (top-right in the editor, or bottom-right on mobile).
2. Confirm the app name / slug. Lovable builds and deploys to
   `https://<slug>.lovable.app`.
3. Backend changes (migrations, RLS) deploy **immediately and automatically**;
   frontend changes go live when you click **Update** in the publish dialog.
4. The publish creates a stable URL: `https://project--<project-id>.lovable.app`.

Social OAuth (Google / Apple / Microsoft) works on first sign-in because the
Lovable broker is wired into published sites — no extra redirect URL config.

To share a preview without a Lovable login, use **Share → Share preview**
(public, view-only, expires in 7 days). For a permanent public URL, publish.

---

## 4. Self-hosting the frontend

Because the build is a Cloudflare Worker, Cloudflare Pages/Workers is the
natural target. Other Node-capable hosts also work with adjustment.

### 4.1 Build the project

```sh
npm install
npm run build      # outputs the Nitro/Worker bundle
```

The build produces a Worker entry (Nitro) plus static client assets. SSR
and `createServerFn` calls run inside that Worker — there is no separate
backend process to run.

### 4.2 Deploy to Cloudflare Pages / Workers

Recommended — matches the build target.

1. `npm i -g wrangler` (or use the Cloudflare dashboard Git integration).
2. Build with `npm run build`.
3. Deploy:
   ```sh
   npx wrangler deploy
   ```
   (Use the Cloudflare dashboard "Connect to Git" flow if you prefer CI
   deploys on push.)
4. Set the environment variables from §2 in the Cloudflare project
   **Settings → Variables**. Mark `SUPABASE_SERVICE_ROLE_KEY` as a secret.

### 4.3 Deploy to Vercel / Netlify / Node host

The Worker-style SSR entry needs an adapter for these platforms. Practical
options:

- **Vercel / Netlify:** use the platform's Node serverless runtime by
  configuring the Nitro preset for that host (`nitro` preset in
  `vite.config.ts`). Add the `VITE_*` and `SUPABASE_*` env vars in the
  dashboard.
- **Docker / VM (Nginx):** run `npm run build`, then serve the SSR Node
  server behind Nginx. Keep env vars in the container/host environment.

> Build target note: the default Lovable Vite config sets the Nitro
> `cloudflare` preset. Switching to another platform means changing that
> preset in `vite.config.ts` — test the production build before relying on it.

### 4.4 Social OAuth on external hosts

The Google/Apple/Microsoft buttons call `lovable.auth.signInWithOAuth` (from
`@/integrations/lovable`, backed by `@lovable.dev/cloud-auth-js`), the Lovable
broker. The broker is tied
to the Lovable platform, so on a fully external host you have two options:

1. **Keep the broker** — the published Lovable URL still handles OAuth, and
   you redirect users back to your custom domain after sign-in. Simplest,
   but couples social sign-in to Lovable.
2. **Switch to direct Supabase OAuth** — replace the `lovable.auth.signInWithOAuth`
   call with `supabase.auth.signInWithOAuth({ provider, options: { redirectTo } })`,
   then configure each provider's redirect URL in the Supabase Auth dashboard
   to point at your domain (`https://yourdomain.com/auth/callback`). This
   fully decouples you from Lovable.

Email/password sign-in (Supabase Auth) works on any host as long as the
`SUPABASE_*` env vars are set — no broker involved.

### 4.5 Bring your own Supabase project (optional)

If you want full ownership of the backend instead of Lovable Cloud:

1. Create a Supabase project.
2. In Lovable: **More → Cloud → Already have a Supabase project? Connect it
   here**. Lovable then manages schema/migrations on your project.
3. Apply the existing migrations (`profiles`, `survey_results`, RLS, grants)
   to the new project — they live as approved SQL in the Lovable migration
   history; re-run them there or via `supabase db push`.
4. Update the `SUPABASE_*` / `VITE_SUPABASE_*` env vars to the new project's
   URL and keys.
5. Reconfigure OAuth redirect URLs in the new project's Auth settings.

---

## 5. Stripe / callbacks (reference — not yet wired)

Memalize has **no payments today**. If you add Stripe, here is the shape.

### 5.1 Backend secrets

Add via Lovable **Secrets** (or your host's secret store):

```ini
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

Never put `STRIPE_SECRET_KEY` in `VITE_*` or commit it.

### 5.2 Webhook route

Create the callback as a TanStack server route under the public prefix so
external callers can reach it:

```
src/routes/api/public/stripe-webhook.ts
```

- Verify the `Stripe-Signature` header (HMAC over the raw body, timing-safe
  compare) **before** any DB write.
- Parse the event, then do privileged writes with `supabaseAdmin` loaded
  **inside** the handler (`await import('@/integrations/supabase/client.server')`).
- Return `200` quickly; do heavy work after acknowledging.

See the "Server routes" doc for the exact handler shape — the `/api/public/*`
prefix bypasses site auth, so the signature check is mandatory.

### 5.3 Stripe dashboard

- Add the endpoint URL to Stripe → Developers → Webhooks.
- For production: `https://yourdomain.com/api/public/stripe-webhook`.
- Use the stable Lovable URL (`project--<id>.lovable.app`) if hosted on
  Lovable, so the URL survives renames.
- Subscribe to the events you act on (e.g. `checkout.session.completed`).

### 5.4 Checkout redirect

The checkout success/cancel URLs should point at **public** routes on your
domain (e.g. `/`, `/billing`) — never at protected `_authenticated/` paths,
since the session may not be hydrated on return.

---

## 6. Database migrations & RLS

- All schema changes go through Supabase migrations (approved in Lovable
  chat, then applied). Tables: `profiles`, `survey_results`.
- Every public-schema `CREATE TABLE` is followed by `GRANT` statements and
  `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` + policies. Don't drop these
  when migrating to your own project.
- `auth`, `storage`, `realtime`, `vault`, `supabase_functions` schemas are
  managed — never edit them.

---

## 7. Server functions & server routes

- **App-internal logic** uses `createServerFn` (`@tanstack/react-start`).
  These run in the same Worker as the site; no separate deploy.
- **External HTTP callers** (webhooks, cron, public APIs) use TanStack server
  routes under `src/routes/api/public/*`. This prefix bypasses published-site
  auth — secure each handler yourself (signature check + Zod validation).
- `requireSupabaseAuth`-protected functions are called from components or
  `_authenticated/` loaders, never from public-route loaders (SSR has no
  bearer token → 401).

---

## 8. Post-deploy checklist

- [ ] Site loads at the deployed URL with no console errors.
- [ ] `/auth` email/password sign-up + sign-in works.
- [ ] Social OAuth returns to the correct domain (redirect URL configured).
- [ ] `/survey` completes, results persist, `/my-results` lists them.
- [ ] Dashboard filters (segment × time-range) update charts.
- [ ] PDF export renders and downloads.
- [ ] Protected routes bounce unauthenticated users to `/auth`.
- [ ] Env vars set on the host; `SUPABASE_SERVICE_ROLE_KEY` is a secret.
- [ ] (If Stripe added) webhook signature verifies; checkout redirects to a
      public route.

---

## 9. Rollback

- Lovable: republish a previous build from the publish dialog history.
- Cloudflare/Vercel: deploy a previous commit / use the platform's rollback.
- Database: migrations are forward-only by design; back up data before any
  destructive migration (`TRUNCATE`, `DROP`). Keep nightly Supabase backups on.

---

## 12. GitHub Actions CI/CD

Workflow: `.github/workflows/ci-cd.yml`

**What it does**

1. `build` job (every push + PR to `main`): `bun install --frozen-lockfile` → `bun run lint` → `bunx tsc --noEmit` → `bun run build`, then uploads the `.output` Worker bundle as an artifact.
2. `deploy` job (pushes to `main` only, `production` environment): downloads the same artifact and runs `wrangler deploy --config .output/wrangler.json` via `cloudflare/wrangler-action@v3`, pushing runtime secrets to the Worker.

**Repository variables** (Settings → Secrets and variables → Actions → *Variables*) — public, baked into the client bundle at build time:

| Name | Example |
| --- | --- |
| `VITE_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |
| `VITE_SUPABASE_PROJECT_ID` | `<ref>` |

**Repository secrets** (same page → *Secrets*) — never exposed to the browser:

| Name | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Token with the “Edit Cloudflare Workers” template |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account ID |
| `SUPABASE_URL` | Server-side Supabase URL |
| `SUPABASE_PUBLISHABLE_KEY` | Server-side publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Only if a server function needs admin access — omit the entry from the workflow's `secrets:` list if unused |

**Notes**

- The build runs before deploy, so a failing lint/typecheck/build blocks the release.
- Database migrations are not run by CI; apply them separately (see section on migrations) before a deploy that depends on new schema.
- To deploy to a staging Worker, duplicate the `deploy` job with a different branch filter, environment, and `--env staging` on the wrangler command.
