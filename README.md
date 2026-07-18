<div align="center">

# CourtQuest

**The website and live tournament platform for our student-run pickleball nonprofit.**

One app that runs the public site and powers tournament day: check-in, brackets,
referee scoring, and live results on every phone.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres_%2B_Realtime-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)

[Live site](https://courtquest.vercel.app) · [Admin & Tournament Guide](docs/ADMIN_GUIDE.md)

</div>

---

## Overview

CourtQuest does two jobs at once:

- **Public site** - home, about, donate, and join pages, plus a live page for every
  tournament with brackets, standings, and match search.
- **Tournament engine** - leadership checks teams in, generates a qualification
  schedule and a knockout bracket, and referees score matches from their phones.
  Everything updates in real time.

There's no separate backend to run. The app talks to Supabase directly, and every
write that matters goes through a locked-down Postgres function, so the public keys
that ship with the app are safe.

## Documentation

New here or testing the software? Start with the guide. It walks through getting an
account, the admin desk, and running a tournament end to end, with screenshots.

- **[Admin & Tournament Guide](docs/ADMIN_GUIDE.md)**

## Tech stack

| Layer | What we use |
| --- | --- |
| Framework | Next.js (App Router) |
| UI | React, Tailwind CSS, Motion |
| Data & realtime | Supabase (Postgres + Realtime) |
| Hosting | Vercel |

## Quick start

You only need this to run a local copy. To just try the app, use the
[live site](https://courtquest.vercel.app).

```bash
# 1. install dependencies (Node.js 20+)
npm install

# 2. start the dev server
npm run dev

# 3. open the app
# http://localhost:3000
```

The `.env.local` file already has the Supabase URL and public key, so there's
nothing to configure. If it's missing, copy `.env.example` to `.env.local`.

## Admin access

Admin lives at `/admin`. You can either request your own account (an owner approves
it) or use the shared leadership PIN. The PIN and any test logins are handed out by
an owner, not stored in this repo. Full walkthrough in the
[Admin & Tournament Guide](docs/ADMIN_GUIDE.md#getting-an-admin-account).

## Project structure

```
src/
  app/          Pages: public site, /admin, /ref
  components/   Bracket, standings, score console, site chrome
  lib/
    logic.ts    Bracket generation, scheduling, standings math
    supabase.ts Database client + the two gated write helpers
docs/
  ADMIN_GUIDE.md   Tester-facing walkthrough
  screenshots/     Images used in the guide
```

## Deploying

The live site is on Vercel and redeploys automatically when changes are pushed to
GitHub. To ship a build by hand from this folder:

```bash
npx vercel deploy --prod
```
