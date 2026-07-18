import type { Metadata } from "next";
import Image from "next/image";
import { BtnGhost, BtnPrimary, Reveal, SectionHead } from "@/components/ui";

import crowdVenue from "@/photos/crowd-venue.jpg";
import story from "@/photos/story.jpg";
import rrCeremony from "@/photos/rr-ceremony.jpg";
import opsTeam from "@/photos/ops-team.jpg";

export const metadata: Metadata = {
  title: "About",
  description:
    "CourtQuest's mission, story, and impact: a student-led 501(c)(3) nonprofit running community pickleball tournaments in Northern Virginia.",
};

const TIMELINE = [
  { date: "July 2025", title: "CourtQuest is founded", body: "A group of students decides to run a better tournament than the one they just played in." },
  { date: "August 2025", title: "Rally Royale Championship", body: "32 players at Worldgate Center. $1,200 raised for the Herndon Community Center." },
  { date: "November 2025", title: "Registered 501(c)(3)", body: "CourtQuest becomes an officially recognized nonprofit." },
  { date: "January 2026", title: "Chill N' Dill", body: "Our winter championship: 40 players, refereed brackets, and $1,600+ raised." },
  { date: "Next", title: "Live tournament platform", body: "Real-time brackets and scoring built in-house, live on every phone in the venue." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen pb-24">
      {/* Header */}
      <section className="relative overflow-hidden">
        <Image
          src={crowdVenue}
          alt="Players and community members gathered at a CourtQuest tournament"
          placeholder="blur"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-court via-court/65 to-court/35" aria-hidden />
        <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-36 sm:px-6 sm:pt-48">
          <p className="eyebrow mb-4 flex items-center gap-2.5 text-chalk">
            <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
            Est. July 2025 · 501(c)(3) nonprofit
          </p>
          <h1 className="display max-w-3xl text-5xl text-chalk sm:text-7xl">
            Students. Paddles. <span className="text-cq-bright">Purpose.</span>
          </h1>
        </div>
      </section>

      {/* Mission / Vision */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2">
          <Reveal>
            <div className="baseline h-full pb-8 text-chalk">
              <p className="eyebrow mb-4 text-cq-bright">Mission</p>
              <p className="text-xl font-medium leading-relaxed text-chalk sm:text-2xl">
                Make organizing and joining community sports tournaments simple,
                so more time goes to play and impact, and less to logistics.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="baseline h-full pb-8 text-chalk">
              <p className="eyebrow mb-4 text-cq-bright">Vision</p>
              <p className="text-xl font-medium leading-relaxed text-chalk sm:text-2xl">
                Every neighborhood has organized, inclusive tournaments that bring
                people together and give back to causes they care about.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Story */}
      <section className="paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead dark={false} eyebrow="Our story" title="How CourtQuest started" />
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <div className="space-y-5 text-base leading-relaxed text-ink-dim sm:text-lg">
                <p>
                  CourtQuest started in July 2025 as a small group of students who
                  wanted to run a better pickleball tournament than the one they&apos;d
                  just played in. What began as a single event grew into a registered
                  nonprofit dedicated to organizing competitive, community-focused
                  tournaments.
                </p>
                <p>
                  Two championships in, the mission hasn&apos;t changed: the money raised
                  goes straight back into the neighborhoods that host us. Student
                  volunteers organize, referee, and keep score, and the software
                  that powers it all is built by students too.
                </p>
              </div>
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-ink/15 pt-8 text-center">
                {[
                  { v: "$3,000+", l: "Raised" },
                  { v: "40+", l: "Players" },
                  { v: "2", l: "Championships" },
                ].map((s) => (
                  <div key={s.l}>
                    <p className="tnum font-mono text-3xl font-bold text-cq">{s.v}</p>
                    <p className="eyebrow mx-auto mt-2 max-w-[8rem] text-ink-dim">{s.l}</p>
                  </div>
                ))}
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src={story} alt="Winning teams at the Chill N' Dill championship" placeholder="blur" fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
                </div>
                <div className="relative mt-8 aspect-[3/4] overflow-hidden">
                  <Image src={opsTeam} alt="Student organizers running the tournament desk" placeholder="blur" fill sizes="(max-width:1024px) 50vw, 25vw" className="object-cover" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
        <SectionHead eyebrow="Timeline" title="The road so far" />
        <div className="grid gap-0 md:grid-cols-5">
          {TIMELINE.map((t, i) => (
            <Reveal key={t.title} delay={i * 0.08}>
              <div className="group relative border-l border-line p-6 md:border-l-0 md:border-t-2 md:border-t-line md:pt-8 md:transition-colors md:hover:border-t-cq">
                <span className="absolute -left-[5px] top-6 h-2.5 w-2.5 bg-cq md:-top-[5px] md:left-6" aria-hidden />
                <p className="eyebrow text-cq-bright">{t.date}</p>
                <h3 className="mt-3 font-bold uppercase tracking-wide text-chalk">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-chalk-dim">{t.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* People — the volunteers, referees, and advisors behind it */}
      <section className="paper">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <SectionHead dark={false} eyebrow="The people" title="Powered by volunteers" />
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-start">
            <Reveal>
              <p className="text-lg leading-relaxed text-ink sm:text-xl">
                Every CourtQuest tournament runs on the students who show up early
                and leave late: the <strong>organizers</strong> who plan the day, the{" "}
                <strong>referees</strong> who call every rally, and the{" "}
                <strong>scorekeepers</strong> at the desk. None of it is paid, and all
                of it is theirs.
              </p>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="space-y-6">
                <div className="border-t border-ink/15 pt-5">
                  <p className="eyebrow text-cq">Our volunteers</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                    Thank you to the student organizers, referees, and desk crew who
                    make tournament day possible. You are CourtQuest.
                  </p>
                </div>
                <div className="border-t border-ink/15 pt-5">
                  <p className="eyebrow text-cq">Our advisors</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-dim">
                    And to the mentors and advisors who guide the nonprofit and keep
                    us pointed at the mission. Thank you for believing in a student idea.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Ceremony + CTA */}
      <section className="relative overflow-hidden">
        <Image
          src={rrCeremony}
          alt="The CourtQuest community at the Rally Royale closing ceremony"
          placeholder="blur"
          fill
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-court/80" aria-hidden />
        <div className="relative z-10 mx-auto max-w-4xl px-4 py-24 text-center sm:px-6 sm:py-32">
          <Reveal>
            <h2 className="display text-4xl text-chalk sm:text-6xl">Be part of the next chapter</h2>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <BtnPrimary href="/join">Get involved</BtnPrimary>
              <BtnGhost href="/tournaments">See tournaments</BtnGhost>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}
