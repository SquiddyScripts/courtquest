# 🏆 CourtQuest

The official website + live tournament platform for **CourtQuest**, a student-led
501(c)(3) nonprofit running community pickleball tournaments in Northern Virginia.

Beautiful public site and a complete tournament engine: live brackets, referee
scoring consoles, check-in desk, and rankings — all real-time on every phone.

## Stack

- **Next.js 16** (App Router) + **Tailwind CSS v4** + **Motion** — the site
- **Supabase** (Postgres + Realtime) — data and live score sync
- No accounts needed: spectators browse freely, referees unlock with a
  **tournament code**, leadership unlocks with the **admin PIN**

## Run it

```bash
npm install
npm run dev
```

`.env.local` already contains the Supabase URL + public anon key. All *writes*
go through PIN/code-gated Postgres functions, so the anon key is safe to ship.

## Tournament day — how it works

| Who | Where | What |
|---|---|---|
| Leadership | `/admin` | Enter the **admin PIN** → create tournaments, run check-in (cash + paid tracking), approve online registrations, generate brackets, run the match board, count balls out |
| Referees | `/ref` | Enter the **tournament code** (shown on the admin header) → open any match: coin flip, serve/side choice, big-tap scoring, timer, double-confirm submit |
| Everyone | `/tournaments/[event]` | Live bracket, standings with point differential, match search — updates in real time as refs score |

The flow: **Check-in → Generate qualification** (everyone plays N games, no
rematches, time estimate shown) **→ Seed top 8 → single elimination** (1v8,
4v5, 3v6, 2v7). Winners advance automatically when a ref submits. Qualification
games race to 11 (no win-by-2); elimination is win-by-2 — both configurable
per tournament in Settings.

## Admin access

Two ways into `/admin` (also reachable via the small ⚿ icon in the footer):

1. **Accounts (preferred)** — each leader has their own email + password.
   New teammates use "Request access" on the sign-in screen; an **owner**
   approves them under "Admin team". Owners can also promote, deactivate,
   or remove accounts. The seeded owner account is
   `amaaninva@gmail.com` / `REDACTED` — **change the password
   after first sign-in** ("Change my password" on the admin home page).
2. **Master leadership PIN** — seeded as `REDACTED` (case/spacing-insensitive).
   Counts as an owner. Change it in Supabase → SQL editor:
   `update settings set admin_pin = 'NEW-PIN';`

## Important knobs

- **Ref code**: per tournament, set in Admin → Details (any admin credential
  also works anywhere a ref code is asked for).
- **Donate link**: `src/app/donate/page.tsx` → `DONATE_URL` (currently a
  mailto placeholder — swap in Zeffy/GoFundMe when ready).
- **Photos**: drop optimized JPGs in `src/photos/` and map them per event in
  `src/lib/eventMedia.ts`.

## Deploy

Live at **https://courtquest.vercel.app** (Vercel project `courtquest`,
account amaaninva-8822). Ship an update from this folder with:

```bash
npx vercel deploy --prod
```

Or connect the GitHub repo (SquiddyScripts/courtquest) in the Vercel
dashboard so every push deploys automatically. The two `NEXT_PUBLIC_*` env
vars are already set in Vercel production.
Supabase project: `courtquest` (`mvkknpjpbdltqkjlcfzf`, us-east-1).

## Verified

A full simulated tournament (10 teams → 20 qualification matches → standings →
top-8 bracket → champion) runs green end-to-end through the exact same RPCs the
UI uses, including automatic bracket advancement. The hidden draft
`summer-test-open` tournament holds that demo data — open
`/tournaments/summer-test-open` to click around it.
