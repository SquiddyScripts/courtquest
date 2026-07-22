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
    a: "Yes. CourtQuest is a registered 501(c)(3) nonprofit, so donations are tax-deductible to the extent allowed by law. You'll get a tax receipt by email after you give.",
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
  const [showPay, setShowPay] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  async function saveNote(e: React.FormEvent) {
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
    }
  }

  function startDonate() {
    setShowPay(true);
    // Scroll checkout into view after paint
    queueMicrotask(() => {
      document.getElementById("donate-checkout")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
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
                { v: "0", l: "Platform fees" },
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
              <div className="mt-12">
                <button
                  type="button"
                  onClick={startDonate}
                  className="inline-flex w-full items-center justify-center bg-cq px-8 py-4 text-sm font-bold uppercase tracking-wide text-chalk shadow-[0_8px_24px_-8px_rgba(226,32,40,0.55)] transition-all hover:bg-cq-bright hover:-translate-y-0.5 sm:w-auto sm:min-w-[220px]"
                >
                  Donate
                </button>
                <p className="eyebrow mt-4 text-chalk-dim/70">
                  Secure checkout · tax receipt emailed to you
                </p>

                {/* Optional note — clearly secondary, never blocks Donate */}
                <div className="mt-10 border-t border-line pt-6">
                  {!noteOpen ? (
                    <button
                      type="button"
                      onClick={() => setNoteOpen(true)}
                      className="eyebrow text-chalk-dim hover:text-chalk"
                    >
                      Optional: leave a note for the team →
                    </button>
                  ) : (
                    <form onSubmit={saveNote} className="max-w-md space-y-3">
                      <p className="eyebrow text-chalk-dim">Optional note</p>
                      <p className="text-sm text-chalk-dim">
                        Totally optional — skip this and hit Donate above anytime.
                      </p>

                      <label className="flex cursor-pointer items-center gap-3 text-sm text-chalk-dim">
                        <input
                          type="checkbox"
                          checked={anonymous}
                          onChange={(e) => setAnonymous(e.target.checked)}
                          className="h-4 w-4 accent-[#e22028]"
                        />
                        Stay anonymous
                      </label>

                      {!anonymous && (
                        <input
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name (optional)"
                          className={field}
                          aria-label="Your name"
                        />
                      )}

                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={2}
                        placeholder="Message (optional)"
                        className={`${field} resize-y`}
                        aria-label="Message"
                      />

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={busy || noteSaved}
                          className="eyebrow border border-line px-4 py-2.5 text-chalk-dim hover:text-chalk disabled:opacity-50"
                        >
                          {noteSaved ? "Note saved" : busy ? "Saving…" : "Save note"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setNoteOpen(false)}
                          className="eyebrow text-chalk-dim/60 hover:text-chalk"
                        >
                          Hide
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </Reveal>
          ) : (
            <Reveal>
              <div id="donate-checkout" className="mt-12 space-y-4 scroll-mt-28">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="eyebrow text-cq-bright">Donate</p>
                    <h2 className="display mt-1 text-3xl text-chalk">Choose an amount</h2>
                  </div>
                  <a
                    href={ZEFFY.donate}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyebrow text-chalk-dim hover:text-chalk"
                  >
                    Open in new tab →
                  </a>
                </div>
                {noteSaved && (message || (!anonymous && name)) && (
                  <p className="text-sm text-chalk-dim">
                    Note saved{anonymous ? " (anonymous)" : name ? ` from ${name}` : ""}.
                  </p>
                )}
                <ZeffyEmbed url={ZEFFY.donate} title="Donate to CourtQuest" height={680} />
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
