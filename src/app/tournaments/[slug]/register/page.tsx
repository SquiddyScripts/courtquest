"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { eventMedia } from "@/lib/eventMedia";
import { RegisterForm, type RegistrationResult } from "@/components/tournament/RegisterForm";
import { LiveDot } from "@/components/ui";
import type { Tournament } from "@/lib/types";

/* Full-screen, directly linkable sign-up: /tournaments/<slug>/register */
export default function RegisterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [tournament, setTournament] = useState<Tournament | null | undefined>(undefined);
  const [done, setDone] = useState<RegistrationResult | null>(null);
  const media = eventMedia(slug);

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setTournament((data as Tournament) ?? null));
  }, [slug]);

  if (tournament === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="eyebrow animate-pulse-live text-chalk-dim">Loading…</p>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="display text-4xl text-chalk">Tournament not found</h1>
        <Link href="/tournaments" className="eyebrow text-cq-bright hover:text-chalk">All tournaments →</Link>
      </main>
    );
  }

  const open = tournament.status === "registration" && tournament.registration_open;
  const fmtDate = tournament.starts_at
    ? new Date(tournament.starts_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : "Date to be announced";

  return (
    <main className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Left: the pitch, over event photography (hidden on small screens) */}
      <aside className="relative hidden overflow-hidden lg:block">
        <Image src={media.cover} alt={media.coverAlt} fill priority placeholder="blur" className="object-cover" sizes="50vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-court via-court/70 to-court/40" aria-hidden />
        <div className="relative z-10 flex h-full flex-col justify-between p-10 xl:p-14">
          <Link href={`/tournaments/${slug}`} className="eyebrow inline-flex items-center gap-2 text-chalk-dim transition-colors hover:text-chalk">
            <ArrowLeft className="h-4 w-4" /> Back to tournament
          </Link>
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-chalk/20 bg-court/40 px-3.5 py-1.5 backdrop-blur-sm">
              <BadgeCheck className="h-4 w-4 text-cq-bright" aria-hidden />
              <span className="eyebrow text-chalk">501(c)(3) Certified Nonprofit</span>
            </span>
            <h1 className="display mt-6 text-6xl text-chalk xl:text-7xl">{tournament.name}</h1>
            <p className="eyebrow mt-4 text-cq-bright">
              {fmtDate}{tournament.location ? ` · ${tournament.location}` : ""}
            </p>
            {tournament.charity && (
              <p className="mt-4 max-w-md text-chalk-dim">
                Every entry fee goes toward {tournament.charity}.
              </p>
            )}
            <div className="mt-8 flex gap-8 border-t border-line pt-6">
              <div>
                <p className="eyebrow text-chalk-dim">Format</p>
                <p className="mt-1 font-bold uppercase tracking-wide text-chalk">{tournament.format}</p>
              </div>
              <div>
                <p className="eyebrow text-chalk-dim">Entry</p>
                <p className="mt-1 font-bold uppercase tracking-wide text-chalk">Cash at check-in</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right: the form */}
      <div className="flex flex-col justify-center px-4 py-24 sm:px-8 lg:px-14 xl:px-20">
        <div className="mx-auto w-full max-w-lg">
          {/* mobile-only header */}
          <div className="mb-8 lg:hidden">
            <Link href={`/tournaments/${slug}`} className="eyebrow inline-flex items-center gap-2 text-chalk-dim transition-colors hover:text-chalk">
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="display mt-5 text-4xl text-chalk">{tournament.name}</h1>
            <p className="eyebrow mt-3 text-cq-bright">{fmtDate}</p>
          </div>

          {done ? (
            <div className="border border-win/40 bg-win/10 p-8 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-win" aria-hidden />
              <h2 className="display mt-5 text-3xl text-chalk">You&apos;re on the list</h2>
              <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-chalk-dim">
                We&apos;ll email you the details before {tournament.name}. Bring your
                cash entry fee to check-in on tournament day.
              </p>
              {done.profile === "created" && (
                <p className="mx-auto mt-3 max-w-sm border border-line bg-carbon px-4 py-3 text-sm text-chalk">
                  Your player profile is ready and you&apos;re signed in. Your matches
                  and stats will track automatically.
                </p>
              )}
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                {done.profile === "created" ? (
                  <Link href="/me" className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright">
                    Open my dashboard
                  </Link>
                ) : (
                  <Link href={`/tournaments/${slug}`} className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright">
                    View tournament
                  </Link>
                )}
                <button onClick={() => setDone(null)} className="eyebrow border border-line px-4 py-3 text-chalk-dim hover:text-chalk">
                  Register another team
                </button>
              </div>
            </div>
          ) : open ? (
            <>
              <p className="eyebrow mb-2 text-cq-bright">Registration</p>
              <h2 className="display mb-2 text-4xl text-chalk">Claim your spot</h2>
              <p className="mb-8 text-sm text-chalk-dim">
                {tournament.format === "doubles"
                  ? "Sign up your doubles team. We'll collect both players' emails so nobody misses an update."
                  : "Sign up to play. Takes about a minute."}
              </p>
              <RegisterForm tournament={tournament} onDone={setDone} />
            </>
          ) : (
            <div className="border border-line bg-carbon p-8 text-center">
              <p className="eyebrow flex items-center justify-center gap-2 text-chalk-dim">
                {tournament.status === "live" && <LiveDot />}
                {tournament.status === "live" ? "Tournament in progress" : tournament.status === "completed" ? "This tournament has ended" : "Registration is not open yet"}
              </p>
              <h2 className="display mt-4 text-3xl text-chalk">
                {tournament.status === "completed" ? "Thanks for playing" : "Check back soon"}
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-sm text-chalk-dim">
                {tournament.status === "live"
                  ? "Sign-ups are closed, but you can follow the live bracket."
                  : "Sign-ups aren't open for this event yet. Join the mailing list and we'll let you know."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href={`/tournaments/${slug}`} className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright">
                  {tournament.status === "live" ? "Watch live" : "View tournament"}
                </Link>
                <Link href="/join" className="eyebrow border border-line px-4 py-3 text-chalk-dim hover:text-chalk">
                  Join mailing list
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
