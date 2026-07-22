"use client";

import Image from "next/image";
import { useState } from "react";
import { Reveal, SectionHead } from "@/components/ui";
import { ZeffyEmbed } from "@/components/zeffy/ZeffyEmbed";
import { ZEFFY } from "@/lib/zeffy";
import { supabase } from "@/lib/supabase";
import trophies2 from "@/photos/trophies-2.jpg";
import community from "@/photos/community.jpg";

const field =
  "w-full border border-line bg-court px-4 py-3 text-sm text-chalk placeholder:text-chalk-dim/40 focus:border-cq/70 focus:outline-none";

const FAQ = [
  {
    q: "Is my donation tax-deductible?",
    a: "Yes. CourtQuest is a registered 501(c)(3) nonprofit, so donations are tax-deductible to the extent allowed by law. Zeffy can email your receipt.",
  },
  {
    q: "Where does the money go?",
    a: "Directly into running tournaments (venue, equipment, trophies) and the local causes each event raises funds for. We're fully student-run, so there are no salaries.",
  },
  {
    q: "Can I sponsor a tournament instead?",
    a: "Absolutely. Local businesses have covered courts, food, and prizes. Reach out and we'll build something together.",
  },
];

export default function DonatePage() {
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveNoteAndPay(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.rpc("submit_donation_note", {
        donor_name_in: anonymous ? null : name.trim() || null,
        message_in: message.trim() || null,
        anonymous_in: anonymous,
      });
      if (!error) setNoteSaved(true);
    } finally {
      setBusy(false);
      setShowPay(true);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <SectionHead eyebrow="Donate" title="Fuel the next rally" />

      <div className="grid gap-14 lg:grid-cols-[1.05fr_1fr]">
        <div>
          <Reveal>
            <p className="max-w-xl text-lg leading-relaxed text-chalk sm:text-xl">
              Every CourtQuest tournament turns entry fees and donations into
              direct support for local causes.{" "}
              <strong className="text-cq-bright">$3,000+ raised so far</strong>.
              Your gift puts more players on court and more dollars back into the
              community.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                { v: "$3,000+", l: "Raised to date" },
                { v: "100%", l: "Goes to the mission" },
                { v: "0", l: "Fees to Zeffy" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="tnum font-mono text-2xl font-bold text-chalk sm:text-3xl">{s.v}</p>
                  <p className="eyebrow mt-2 text-chalk-dim">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>

          {!showPay ? (
            <Reveal delay={0.1}>
              <form onSubmit={saveNoteAndPay} className="mt-12 space-y-4 border border-line bg-carbon p-6 sm:p-8">
                <p className="eyebrow text-cq-bright">Leave a note (optional)</p>
                <h2 className="display text-3xl text-chalk">Then give on Zeffy</h2>
                <p className="text-sm text-chalk-dim">
                  Add a message for the team, or stay anonymous. Checkout opens
                  on this page with a backup link if the form doesn&apos;t load.
                </p>

                <label className="flex cursor-pointer items-center gap-3 text-sm text-chalk">
                  <input
                    type="checkbox"
                    checked={anonymous}
                    onChange={(e) => setAnonymous(e.target.checked)}
                    className="h-4 w-4 accent-[#e22028]"
                  />
                  Stay anonymous
                </label>

                {!anonymous && (
                  <div>
                    <label htmlFor="donor-name" className="eyebrow mb-2 block text-chalk-dim">Your name</label>
                    <input
                      id="donor-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Optional"
                      className={field}
                    />
                  </div>
                )}

                <div>
                  <label htmlFor="donor-msg" className="eyebrow mb-2 block text-chalk-dim">Message</label>
                  <textarea
                    id="donor-msg"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={3}
                    placeholder="Encouragement, dedication, or why you give…"
                    className={`${field} resize-y`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full bg-cq px-6 py-4 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-60"
                >
                  {busy ? "One sec…" : "Continue to donate"}
                </button>
                <p className="text-center text-xs text-chalk-dim/70">
                  Or{" "}
                  <a href={ZEFFY.donate} target="_blank" rel="noopener noreferrer" className="text-cq-bright hover:text-chalk">
                    open the donation form in a new tab
                  </a>
                </p>
              </form>
            </Reveal>
          ) : (
            <Reveal>
              <div className="mt-12 space-y-4">
                {noteSaved && (message || (!anonymous && name)) && (
                  <p className="border border-win/30 bg-win/10 px-4 py-3 text-sm text-chalk">
                    Note saved{anonymous ? " (anonymous)" : name ? ` from ${name}` : ""}. Complete your gift below.
                  </p>
                )}
                <ZeffyEmbed url={ZEFFY.donate} title="CourtQuest donation" height={680} />
                <button
                  type="button"
                  onClick={() => setShowPay(false)}
                  className="eyebrow text-chalk-dim hover:text-chalk"
                >
                  ← Edit note
                </button>
              </div>
            </Reveal>
          )}

          <div className="mt-14 space-y-6">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="border-t border-line pt-5">
                  <h3 className="font-bold uppercase tracking-wide text-chalk">{f.q}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-chalk-dim">{f.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={trophies2}
                alt="Championship trophies funded by community donations"
                placeholder="blur"
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={community}
                alt="Families and players brought together at a CourtQuest event"
                placeholder="blur"
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
