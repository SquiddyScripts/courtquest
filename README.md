# CourtQuest

CourtQuest is the website and live tournament system for our student-run pickleball
nonprofit. It does two jobs at once: it's the public site people see, and it's the
tool leadership uses on tournament day to check teams in, build brackets, score
matches, and show live results on any phone.

This README is written for teammates who are testing the software. It walks through
getting in, creating a test tournament, and running one end to end. You don't need
to know how the code works to follow it.

Live site: https://courtquest.vercel.app

## What it's built with

- Next.js (the site and admin screens)
- Supabase / Postgres (the database and the real-time score updates)

There is no separate server to run. The app talks to Supabase directly, and every
write that matters goes through a locked-down database function, so the public keys
that ship with the app are safe.

## Running it on your own machine

You only need this if you want to run a local copy. To just test the app, use the
live site above.

1. Install Node.js 20 or newer.
2. In this folder, install the packages:

```bash
npm install
```

3. Start it:

```bash
npm run dev
```

4. Open http://localhost:3000

The `.env.local` file already has the Supabase URL and public key, so there's
nothing to configure. If it's missing, copy `.env.example` to `.env.local`.

## A safe place to test

There's a hidden demo tournament called `summer-test-open` with sample teams and a
bracket already in it. It doesn't show up on the public tournaments list, but you
can open it directly to see what a running event looks like:

- Public view: https://courtquest.vercel.app/tournaments/summer-test-open

When you're testing, make your own tournaments and give them obvious names like
"TEST - ignore" so nobody mistakes them for a real event. Everything you create
lives in the same database, so don't run tests during an actual tournament.

## Getting an admin account

Admin lives at `/admin` (there's also a small key icon in the site footer). There
are two ways in.

![Admin sign-in and request access screen](docs/screenshots/01-admin-signin.png)

### Request your own login (what most people should do)

1. Go to https://courtquest.vercel.app/admin
2. Click the **Request access** tab.
3. Enter your name, email, and a password (at least 8 characters).
4. Submit. Your account now exists but is switched off until an owner approves it.
5. Ask an owner to approve you (see below). Once they do, sign in on the same page.

### The leadership PIN (shared fallback)

On the sign-in card there's a "Use the leadership PIN instead" link. The PIN gets
you in as an owner without a personal account. It's handy for a quick check, but a
real account is better because it's tied to you.

For testing, the seeded owner account and PIN are:

- Owner login: `amaaninva@gmail.com` / `REDACTED`
- Leadership PIN: `REDACTED`

If you're setting this up for real, sign in with that owner account and change the
password right away using "Change my password" on the admin home page.

## Approving people (owners only)

When someone requests access, an owner has to turn their account on. Sign in as an
owner and scroll to the **Admin team** section on the admin home page. Pending
requests show up at the top with Approve and Reject buttons. After approving, that
person can sign in.

![Admin team panel](docs/screenshots/02-admin-team.png)

Owners can also promote someone to owner, drop an owner back to admin, or
deactivate an account. Deactivating someone kicks them out of any live session.

## The admin home page

After you sign in, `/admin` shows every tournament grouped by where it is in its
life: what's happening now, what's open for sign-ups, drafts (hidden from the
public), and past events by year.

![Admin home page listing tournaments](docs/screenshots/03-admin-home.png)

From here you can:

- **New tournament** - create an event (covered next).
- Click any tournament to open its management page.
- **Admin team** and **Members** - manage logins and see who signed up to play or
  volunteer through the Join page.

### Creating a tournament

Click **New tournament** and fill in the form.

![New tournament form](docs/screenshots/04-new-tournament.png)

- **Name** (required). The web address is made from this.
- **Date and start time**.
- **Location**.
- **Format**: doubles (teams of two) or singles.
- **Courts**: how many courts you're running at once. This controls how matches get
  spread out.
- **Referee code**: the code refs type in to score. Leave it blank and one is made
  for you.
- **Raising money for** and **Tagline**: optional, shown on the public page.
- **Open sign-ups immediately**: leave this off while testing so it stays a hidden
  draft.

Create it, then click into it to manage it.

## Running a tournament

Open a tournament from the admin home page. The top of the page has the lifecycle
bar (Draft, Sign-ups, Live, Done) and one button that moves it to the next stage.
It also shows the ref code and a counter for loaner balls handed out. Under that
are four tabs.

![Tournament management page with the lifecycle bar, tabs, bracket, and standings](docs/screenshots/05-tournament-run.png)

### Details

Edit anything about the event: name, date, location, format, number of courts, the
ref code, and the scoring targets. Two scoring numbers matter:

- **Qualification points**: what qual games play to (usually 11, win by one).
- **Elimination points**: what bracket games play to (win by two).

### Registrations

If sign-ups were open, people who registered online show up here. Approve them and
they become teams you can check in.

### Check-in

On tournament day you mark each team as paid, checked in, or withdrawn, and you can
add walk-up teams that didn't register online. Only teams that are checked in get
put into the bracket.

### Run / Bracket

This is where the tournament actually happens.

1. **Generate qualification.** Pick how many games each team should play. The app
   builds a schedule where everyone plays the same number of games, nobody plays
   the same team twice, and nobody sits out more than one round. Generating this
   sets the tournament to Live.
2. **Play the qualification games.** As refs submit scores, standings update live.
3. **Seed top 8.** When you're ready, hit the button to lock in the top eight teams
   and build a single-elimination bracket (1 vs 8, 4 vs 5, 3 vs 6, 2 vs 7, so the
   top two seeds can only meet in the final).
4. **Play the bracket.** Winners move to the next round automatically when a ref
   submits the score.

This tab also shows the live bracket, which team is on which court, a "next up"
queue that puts rested teams first, and the full standings.

#### How teams are ranked in qualification

Standings are sorted by, in order:

1. Wins
2. Average point differential (points scored minus points allowed, per game, across
   all games)
3. Total points scored
4. Team number (lowest wins as a final tiebreaker)

## Refereeing

Refs don't need an account. They use a tournament code.

![Referee console entry screen](docs/screenshots/06-ref-console.png)

1. Go to `/ref`.
2. Pick the tournament and type the ref code (leadership hands this out; it's shown
   in the admin header and on the tournament list).
3. The console opens. Refs pick their court and score the match in front of them:
   coin flip, who serves, big tap-to-score buttons, a timer, and a confirm step
   before the score is submitted so it can't be sent by accident.

## What the public sees

- Home, About, Donate, and Join pages.
- A tournament page for each event with the live bracket, standings (with point
  differential), and a search box to find any match.

Everything on these pages updates in real time as refs submit scores, so spectators
on their phones see the same thing the scorer's table sees.

## A full test run

If you want to shake the whole thing out, do this:

1. Sign in to `/admin` (use the owner login or PIN above).
2. Create a tournament named "TEST - ignore". Leave sign-ups off. Set courts to 2.
3. Open it, go to **Check-in**, and add 8 to 10 fake teams. Mark them checked in.
4. Go to **Run**, generate qualification (try 3 rounds), which takes it Live.
5. Open `/ref` in another tab, pick your test tournament, enter its ref code, and
   score a few games. Watch the standings move on the admin page.
6. Back in **Run**, hit **Seed top 8** and score the bracket down to a champion.
7. Open the public page at `/tournaments/test-ignore` to see it the way a spectator
   would.
8. When you're done, open the tournament's **Details** tab and delete it so it
   doesn't clutter the database.

## Where things live in the code

- `src/app` - the pages (public site, `/admin`, `/ref`).
- `src/components` - the building blocks (bracket, standings, score console, etc.).
- `src/lib` - the tournament logic and the Supabase connection.
  - `logic.ts` - bracket generation, scheduling, and standings math.
  - `supabase.ts` - the database client and the two gated write helpers.

## Deploying

The live site is on Vercel and redeploys automatically when changes are pushed to
the GitHub repo. To push a build by hand from this folder:

```bash
npx vercel deploy --prod
```
