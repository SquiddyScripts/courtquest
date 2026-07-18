import Image from "next/image";
import Link from "next/link";
import { Hero } from "@/components/site/Hero";
import { LiveTicker } from "@/components/site/LiveTicker";
import { NextTournament } from "@/components/site/NextTournament";
import { PhotoGrid } from "@/components/site/PhotoGrid";
import { BtnGhost, BtnPrimary, Reveal, SectionHead } from "@/components/ui";

import rally1 from "@/photos/rally-1.jpg";
import doubles from "@/photos/doubles.jpg";
import trophies from "@/photos/trophies.jpg";
import winners1 from "@/photos/winners-1.jpg";
import walkOff from "@/photos/walk-off.jpg";
import rrCourt from "@/photos/rr-court.jpg";
import netDuo from "@/photos/net-duo.jpg";
import podium from "@/photos/podium.jpg";
import matchFar from "@/photos/match-far.jpg";
import opsDesk from "@/photos/ops-desk.jpg";
import heroAction from "@/photos/hero-action.jpg";
import community from "@/photos/community.jpg";

const STATS = [
  { value: "$3,000+", label: "Raised for local causes" },
  { value: "40+", label: "Tournament players" },
  { value: "2", label: "Championships hosted" },
];

const PILLARS = [
  {
    n: "Compete",
    title: "Play in real tournaments",
    body: "Seeded brackets, refereed matches, and live scores on every phone. The full championship experience, open to everyone.",
  },
  {
    n: "Volunteer",
    title: "Help run the show",
    body: "Referee matches, run check-in, keep courts moving. Our tournaments are powered by student volunteers start to finish.",
  },
  {
    n: "Give",
    title: "Every dollar goes back",
    body: "Entry fees and donations fund the causes each event supports. We're a registered 501(c)(3), so giving back is the whole point.",
  },
];

export default function HomePage() {
  return (
    <main>
      <Hero />
      <LiveTicker />

      {/* ── Impact stats — clean centered band ────────────────────────────── */}
      <section className="border-b border-line">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal className="mb-10 text-center">
            <p className="eyebrow text-cq-bright">Student-led · 100% volunteer-run</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-6">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.1} className="text-center">
                <p className="tnum font-mono text-5xl font-bold text-chalk sm:text-6xl">{s.value}</p>
                <p className="eyebrow mx-auto mt-3 max-w-[10rem] text-chalk-dim">{s.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <NextTournament />

      {/* ── From the courts ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHead
          eyebrow="From the courts"
          title="Two championships in"
          right={
            <Link href="/tournaments" className="eyebrow text-chalk-dim transition-colors hover:text-cq-bright">
              All tournaments →
            </Link>
          }
        />
        <PhotoGrid
          photos={[
            { img: rally1, alt: "Doubles rally at the net", label: "Chill N' Dill · Jan 2026" },
            { img: winners1, alt: "Winning teams holding trophies", label: "Podium finishers" },
            { img: rrCourt, alt: "Rally Royale court during play", label: "Rally Royale · Aug 2025" },
            { img: trophies, alt: "Championship trophies lined up courtside", label: "Championship hardware" },
            { img: doubles, alt: "Doubles teams mid-point", label: "Qualification rounds" },
            { img: podium, alt: "Podium finishers with their awards", label: "Chill N' Dill podium" },
            { img: netDuo, alt: "Two players at the net between points", label: "Between points" },
            { img: matchFar, alt: "Matches running across the venue", label: "Four courts running" },
          ]}
        />
      </section>

      {/* ── Why we play — light "away kit" section ────────────────────────── */}
      <section className="paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead dark={false} eyebrow="Why we play" title="Sports that give back" />
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <Reveal>
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={community}
                  alt="Players and families gathered between matches at a CourtQuest tournament"
                  placeholder="blur"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute bottom-0 left-0 border-l-[3px] border-t-[3px] border-cq p-4" aria-hidden>
                  <div className="h-8 w-8" />
                </div>
              </div>
            </Reveal>
            <div>
              <Reveal>
                <p className="text-lg leading-relaxed text-ink sm:text-xl">
                  CourtQuest is a nonprofit run entirely by students. We organize
                  competitive pickleball championships in Northern Virginia, and the
                  money each event raises goes to a local cause,{" "}
                  <strong>like the $1,200 Rally Royale raised for the Herndon Community Center.</strong>
                </p>
              </Reveal>
              <div className="mt-10 space-y-8">
                {PILLARS.map((p, i) => (
                  <Reveal key={p.n} delay={i * 0.1}>
                    <div className="flex gap-5 border-t border-ink/15 pt-6">
                      <p className="eyebrow w-24 shrink-0 pt-1 text-cq">{p.n}</p>
                      <div>
                        <h3 className="font-bold uppercase tracking-wide text-ink">{p.title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-ink-dim">{p.body}</p>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
              <Reveal delay={0.2}>
                <div className="mt-10">
                  <BtnGhost href="/about" dark={false}>Read our story</BtnGhost>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── The live platform ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="order-2 lg:order-1">
            <SectionHead eyebrow="Tournament day" title="Every match. Live." />
            <Reveal>
              <p className="max-w-lg leading-relaxed text-chalk-dim">
                We built our own tournament software so nobody stands around wondering
                what court they&apos;re on. The moment a referee submits a score, the
                bracket, standings, and point differentials update live on every
                phone in the building.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <ul className="mt-8 space-y-4">
                {[
                  "Live brackets and standings, no refresh needed",
                  "One-tap scoring console for referees",
                  "Search any match by number, team, or player",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3.5 text-sm font-medium text-chalk">
                    <span className="kitchen-tick shrink-0" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={0.15}>
              <div className="mt-10 flex flex-wrap gap-3">
                <BtnPrimary href="/tournaments">See it live</BtnPrimary>
                <BtnGhost href="/ref">Referee console</BtnGhost>
              </div>
            </Reveal>
          </div>
          <Reveal className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={opsDesk}
                alt="CourtQuest organizers running the tournament desk with live brackets on screen"
                placeholder="blur"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
              <div className="absolute right-0 top-0 border-r-[3px] border-t-[3px] border-cq p-4" aria-hidden>
                <div className="h-8 w-8" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Closing CTA — action photo full bleed ─────────────────────────── */}
      <section className="relative overflow-hidden">
        <Image
          src={heroAction}
          alt="A CourtQuest player lunging for a shot mid-rally at the Chill N' Dill championship"
          placeholder="blur"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-court/78" aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-28 text-center sm:px-6 sm:py-40">
          <Reveal>
            <p className="eyebrow mb-5 text-cq-bright">Join the next tournament</p>
            <h2 className="display text-5xl text-chalk sm:text-7xl">
              Ready to take
              <br />
              the court?
            </h2>
            <p className="mx-auto mt-6 max-w-md text-chalk-dim">
              Play, volunteer, or give. Every way in makes the next tournament possible.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <BtnPrimary href="/join">Get involved</BtnPrimary>
              <BtnGhost href="/donate">Donate</BtnGhost>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Editorial walk-off strip */}
      <section className="border-t border-line">
        <div className="relative h-56 sm:h-72">
          <Image
            src={walkOff}
            alt="Two players walking off the court after a match"
            placeholder="blur"
            fill
            sizes="100vw"
            className="object-cover object-[center_30%] opacity-60"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="display-wide text-center text-sm text-chalk sm:text-base">
              Serve · Rally · Give back
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
