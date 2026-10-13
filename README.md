# teem board

San + Ash's shared workspace, in the **H · Journal sticker** design language.

- **Board**: Tasks → Ash is on it / San is on it → Done. Drag and drop (mouse, touch, keyboard), priorities, labels, due dates, checklists, comments, per-card history.
- **Diary**: one shared journal, grouped by day, with moods. Only the author can edit their own entries.
- **Info dump**: sticky-note wall for links and ideas. `#hashtags` become filters, links become chips, and any note turns into a task in one click.
- **Decisions**: what we decided, the context, and why (proposed / decided / revisit).
- **Weekly**: side-by-side wins / blockers / next week, plus what each of us actually shipped from the board.
- **Activity**: everything either of us did. Live toasts show when the other person changes something.

Stack: Next.js 16 (App Router) · Postgres (Neon on Vercel, PGlite locally) · dnd-kit. There are no other services.

## Run locally

```bash
npm install
npm run dev            # http://localhost:3000, passcode "teem" when TEEM_PASSCODE is unset
```

Without `DATABASE_URL`, data goes into an in-process Postgres at `./.pglite` (git-ignored). Delete that folder to start fresh.
To point at the real database instead, put `DATABASE_URL=...` in `.env.local`.

## Deploy (Vercel)

1. Push this repo to GitHub, then go to vercel.com → **Add New → Project** → import it. Framework: Next.js, all defaults.
2. In the project, go to **Storage → Create Database → Neon (Postgres)** → connect it to the project (all environments). This adds `DATABASE_URL`.
3. Under **Settings → Environment Variables** add:
   - `TEEM_PASSCODE`: the shared passcode you both type at login
   - `TEEM_SECRET`: a long random string (`openssl rand -base64 32`). It signs the login cookie, so changing it logs everyone out.
4. **Deployments → Redeploy**. Tables are created automatically on the first request.

## How it works

- **Auth**: pick San or Ash, then enter the shared passcode. You get an HMAC-signed, httpOnly cookie for 60 days. `proxy.ts` redirects signed-out visitors, and every API route re-checks the cookie (`lib/api.ts`).
- **Live sync**: every write bumps a `rev` counter (`lib/db.ts → log()/bump()`). Each open tab polls `/api/pulse` every 5s (paused while the tab is hidden). The poll also records presence and returns the latest activity for toasts. Pages refetch only when `rev` changes.
- **Ordering**: cards use fractional `position`s. A drop sets the card's position to the midpoint of its neighbours, so only one row changes.
- **Schema**: `lib/schema.ts`, applied idempotently on the first request after a cold start. Bump `SCHEMA_VERSION` when you change it.

## Layout

```
app/(app)/…        pages behind login (board, diary, dump, decisions, weekly, activity)
app/api/…          JSON routes
components/        UI (board/ holds the kanban + task drawer)
lib/               db, auth, schema, shared types, helpers
proxy.ts           login gate
```
