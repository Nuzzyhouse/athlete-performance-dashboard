# Athlete Performance Dashboard

A private, internal force-plate + velocity monitoring dashboard for a strength staff. See the
original build prompt for the full design rationale — this file covers what you need to actually
run it.

**This is a starting framework, not a finished product.** You supply your own accounts, adapt the
prediction model to your athletes, and shape the rest to your program.

## What's implemented

- Sidebar app: Dashboard · Roster · Analysis · Reports · Sync (owner/manager only) · Users (owner-only)
- Credentials auth (NextAuth v5) with three roles — `owner` (full edit + user management),
  `manager` (full edit, same as owner minus user management), and `coach` (view-only) — enforced
  both in the UI and inside every server action. An in-app **Users** page (owner-only) creates,
  edits, resets, and deletes accounts — no more editing the database by hand.
- The prediction engine (`src/lib/prediction.ts`) — regression + outlier hold-out + per-level
  re-centering, with a pinned snapshot test (`src/lib/prediction.test.ts`)
- Manual athlete/test CRUD, movement/ROM profiling, printable progress reports with server-side
  PDF export
- A VALD ForceDecks sync (OAuth, preview-before-import, dedupe, nightly cron route) — swap
  `src/lib/vald/` for a different provider

## 1. Prerequisites — your own accounts

None of these are included. You provide and pay for all of them:

- **A Postgres database.** Any hosted Postgres works (e.g. [Neon](https://neon.tech)). Use the
  **unpooled / direct** connection string, not a pgbouncer one.
- **Hosting with a server runtime + scheduled jobs**, e.g. [Vercel](https://vercel.com).
- **Force-plate API access.** The sync here is built against VALD ForceDecks — you need an org ID
  and a signed license agreement to get a `clientId`/`clientSecret`. On a different provider,
  rewrite `src/lib/vald/client.ts` and `mapping.ts` (see §5 below).

## 2. Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

| Variable | What it's for |
|---|---|
| `DATABASE_URL` | Your Postgres connection string (direct, not pooled) |
| `AUTH_SECRET` | Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `VALD_CLIENT_ID` / `VALD_CLIENT_SECRET` | From VALD (leave blank until you have them — the app runs fine without them, the Sync page just stays disconnected) |
| `VALD_TENANT_REGION` | Your VALD region code, e.g. `use` |
| `CRON_SECRET` | Any random string — the nightly sync route requires it |
| `CLUB_TIMEZONE` | IANA timezone (e.g. `America/New_York`) — every "today"/date calculation uses this, not the server's clock |

No Postgres yet? For **local development only** you can spin one up with Prisma's own dev server:

```bash
npx prisma dev
```

Leave that running in its own terminal (it must stay alive as a real background process — if it
gets killed mid-session you'll see `ConnectionClosed` errors and need to restart it), and point
`DATABASE_URL` in `.env` at the connection string it prints. This is a dev convenience only —
production should use a real hosted Postgres.

Push the schema and seed your first owner account:

```bash
npx prisma db push
npx prisma generate
SEED_OWNER_EMAIL="you@example.com" SEED_OWNER_NAME="Your Name" SEED_OWNER_PASSWORD="changeme123" npx prisma db seed
```

You'll be forced to change that password on first login. Optionally load demo data to see the app
populated (delete these athletes from Roster whenever you're ready to start on real data):

```bash
npm run seed:demo
```

Run the app:

```bash
npm run dev
```

Run the test suite (includes the prediction model's pinned snapshot):

```bash
npm test
```

## 3. Deploying

1. Push this repo to GitHub, import it into Vercel.
2. Set the same environment variables from `.env` in the Vercel project settings, pointing
   `DATABASE_URL` at your real hosted Postgres.
3. Run `npx prisma db push` (or set up `prisma migrate` if you want tracked migrations) against
   that database once, and seed your owner account the same way as above.
4. `vercel.json` already declares a nightly cron hitting `/api/cron/vald-sync` at 09:00 UTC — adjust
   the schedule to your timezone/needs. Vercel Cron authenticates automatically via
   `Authorization: Bearer $CRON_SECRET` as long as `CRON_SECRET` is set in your project's env vars.
5. **PDF generation**: the progress-report PDF export (`src/app/api/reports/[id]/pdf/route.ts`) uses
   `puppeteer`, which bundles a full Chromium — this works out of the box locally and on a
   traditional Node server, but **may not fit Vercel's serverless function size limit as-is**. If
   the PDF route fails to deploy, switch to `puppeteer-core` + `@sparticuz/chromium` (a slim
   Vercel-compatible Chromium build) in that one file — nothing else needs to change.

## 4. Adapting the prediction model to your sport

Everything lives in `src/lib/prediction.ts`. It takes raw per-athlete metrics in and returns
`pred`/`gap`/`category`/ranks out — the rest of the app only depends on that shape, so you can
rewrite the internals freely:

- Swap the inputs (different force-plate metrics, different KPI) as long as you update
  `AthleteInput` and the Prisma schema together.
- Re-fit `FP_SENSITIVITY`, the outlier threshold, or the category gap thresholds in
  `src/lib/constants.ts` and `prediction.ts` to your own population.
- **Update the pinned snapshot** (`src/lib/prediction.test.ts`) deliberately whenever you change the
  math — `npm test` will fail until you do, which is the point: it stops a stray edit from
  silently shifting every athlete's number.

## 5. Swapping force-plate providers

`src/lib/vald/client.ts` (auth + endpoints) and `src/lib/vald/mapping.ts` (metric name mapping) are
the only VALD-specific files. `src/lib/vald/sync.ts` (matching, dedupe, preview) and everything in
`src/app/(app)/sync/` stay the same — they just need whatever your new client module exports
(profiles list, recent tests, per-test metrics) in the same shape.

## 6. Accounts and roles

Once you've signed in as the seeded owner, manage every other account from the in-app **Users**
page (owner-only) — add coaches/managers, reset a forgotten password, change a role, or remove an
account. New accounts get a one-time generated password to hand off; the recipient sets their own
on first login.

Three roles:
- `owner` — full data edit rights, plus the only role that can manage user accounts. There's always
  at least one; the app won't let you delete or demote the last remaining owner.
- `manager` — identical data-edit permissions to owner (roster, tests, sync, everything) but can't
  touch the Users page.
- `coach` — view-only everywhere.

The very first owner account still comes from the seed script (`SEED_OWNER_*` env vars) since
there's no one to create it from inside the app yet.

## 7. Known local-dev quirk

`npx prisma dev`'s embedded Postgres occasionally drops idle connections more aggressively than a
real Postgres server. If you see `ConnectionClosed` / `ECONNRESET` errors in local dev, restart it
(`npx prisma dev`, keep the terminal open) — this does not happen against a real hosted Postgres.
