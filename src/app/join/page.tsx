"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Reveal, SectionHead } from "@/components/ui";
import paddlePair from "@/photos/paddle-pair.jpg";

const field =
  "w-full border border-line bg-carbon px-4 py-3 text-sm text-chalk placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none";

const WAYS = [
  {
    n: "Play",
    body: "Sign up for the next tournament. Singles or doubles, all skill levels welcome. Registration opens on each tournament page.",
  },
  {
    n: "Referee",
    body: "Proctor matches with our scoring console: coin flip, live points, match timer. We'll train you in fifteen minutes.",
  },
  {
    n: "Organize",
    body: "Check-in desk, court flow, ceremonies: tournament day runs on volunteers who like keeping things moving.",
  },
];

export default function JoinPage() {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    const { error } = await supabase.rpc("submit_member", {
      name_in: String(fd.get("name") ?? ""),
      email_in: String(fd.get("email") ?? ""),
      volunteer_in: fd.get("volunteer") === "on",
      message_in: String(fd.get("message") ?? ""),
    });
    setState(error ? "error" : "done");
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <SectionHead eyebrow="Get involved" title="Join the club" />

      <div className="grid gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Reveal>
            <div className="relative mb-10 aspect-[4/3] overflow-hidden">
              <Image
                src={paddlePair}
                alt="Two CourtQuest players posing with their paddles"
                placeholder="blur"
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <div className="space-y-7">
            {WAYS.map((w, i) => (
              <Reveal key={w.n} delay={i * 0.08}>
                <div className="flex gap-5 border-t border-line pt-6">
                  <p className="eyebrow w-24 shrink-0 pt-1 text-cq-bright">{w.n}</p>
                  <p className="text-sm leading-relaxed text-chalk-dim">{w.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="border border-line bg-carbon p-6 sm:p-10">
            {state === "done" ? (
              <div className="py-16 text-center">
                <CheckCircle2 className="mx-auto h-9 w-9 text-win" aria-hidden />
                <h2 className="display mt-5 text-3xl text-chalk">Welcome aboard</h2>
                <p className="mx-auto mt-3 max-w-sm text-sm text-chalk-dim">
                  You&apos;re on the CourtQuest list. We&apos;ll reach out when the next
                  tournament or volunteer opportunity goes live.
                </p>
                <Link href="/tournaments" className="eyebrow mt-8 inline-block text-cq-bright hover:text-chalk">
                  Browse tournaments →
                </Link>
              </div>
            ) : (
              <>
                <h2 className="display text-3xl text-chalk">Become a member</h2>
                <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
                  Membership is free. You&apos;ll hear about tournaments first, and you
                  can raise your hand to referee or help organize.
                </p>
                <form onSubmit={onSubmit} className="mt-8 space-y-5">
                  <div>
                    <label htmlFor="name" className="eyebrow mb-2 block text-chalk-dim">Name *</label>
                    <input id="name" name="name" required minLength={2} placeholder="Your name" className={field} />
                  </div>
                  <div>
                    <label htmlFor="email" className="eyebrow mb-2 block text-chalk-dim">Email *</label>
                    <input id="email" name="email" type="email" required placeholder="you@example.com" className={field} />
                  </div>
                  <div>
                    <label htmlFor="message" className="eyebrow mb-2 block text-chalk-dim">Anything we should know?</label>
                    <textarea id="message" name="message" rows={3} placeholder="Optional" className={field} />
                  </div>
                  <label className="flex cursor-pointer items-start gap-3 text-sm text-chalk-dim">
                    <input type="checkbox" name="volunteer" className="mt-0.5 h-4 w-4 accent-[#e22028]" />
                    I want to volunteer as a referee or tournament-day organizer
                  </label>
                  {state === "error" && (
                    <p className="text-sm font-medium text-cq-bright">
                      That didn&apos;t go through. Check your name and email, then try again.
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={state === "busy"}
                    className="w-full bg-cq px-6 py-4 text-sm font-bold uppercase tracking-wide text-chalk transition-all hover:bg-cq-bright disabled:opacity-60"
                  >
                    {state === "busy" ? "Joining…" : "Join CourtQuest"}
                  </button>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </main>
  );
}
