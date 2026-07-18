"use client";

import { useState } from "react";
import { UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storePlayerSession } from "@/lib/usePlayer";
import type { Tournament } from "@/lib/types";

const field =
  "w-full border border-line bg-court px-4 py-3.5 text-base text-chalk placeholder:text-chalk-dim/40 transition-colors focus:border-cq/70 focus:outline-none";
const labelCls = "eyebrow mb-2 block text-chalk-dim";

export type RegistrationResult = { profile: "created" | "exists" | null };

/**
 * Tournament sign-up. Both players' emails for doubles, plus an optional
 * one-checkbox CourtQuest player profile (the info is already typed in;
 * a password is all that's missing).
 */
export function RegisterForm({
  tournament,
  onDone,
}: {
  tournament: Tournament;
  onDone: (result: RegistrationResult) => void;
}) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState("");
  const [wantProfile, setWantProfile] = useState(false);
  const doubles = tournament.format === "doubles";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    setError("");
    const { data, error: err } = await supabase.rpc("submit_registration", {
      t_id: tournament.id,
      p1: String(fd.get("player1") ?? ""),
      p2: String(fd.get("player2") ?? ""),
      email_in: String(fd.get("email") ?? ""),
      email2_in: String(fd.get("email2") ?? ""),
      phone_in: String(fd.get("phone") ?? ""),
      volunteer_in: fd.get("volunteer") === "on",
      create_profile_in: wantProfile,
      password_in: wantProfile ? String(fd.get("password") ?? "") : null,
    });
    if (err) {
      setError(
        err.message.includes("closed")
          ? "Registration is closed for this event."
          : err.message.includes("password")
            ? "Profile password must be at least 8 characters."
            : "Check the names and emails, then try again."
      );
      setState("error");
      return;
    }
    if (data?.profile === "created" && data.token) {
      storePlayerSession({ id: data.id, name: data.name, email: String(fd.get("email") ?? "").trim().toLowerCase(), token: data.token });
    }
    onDone({ profile: data?.profile ?? null });
  }

  const section = (no: string, title: string, children: React.ReactNode) => (
    <fieldset className="border border-line bg-carbon/60 p-5 sm:p-6">
      <legend className="eyebrow -mx-1 flex items-center gap-2.5 px-1 text-chalk">
        <span className="tnum font-mono text-cq-bright">{no}</span> {title}
      </legend>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {section("01", doubles ? "Player 1 · you" : "Your details", (
        <>
          <div>
            <label htmlFor="player1" className={labelCls}>Name *</label>
            <input id="player1" name="player1" required minLength={2} placeholder="First name + last initial" className={field} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email *</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" className={field} />
          </div>
        </>
      ))}

      {doubles &&
        section("02", "Player 2 · your partner", (
          <>
            <div>
              <label htmlFor="player2" className={labelCls}>Name</label>
              <input id="player2" name="player2" placeholder="Add later if needed" className={field} />
            </div>
            <div>
              <label htmlFor="email2" className={labelCls}>Email</label>
              <input id="email2" name="email2" type="email" placeholder="partner@example.com" className={field} />
            </div>
          </>
        ))}

      {section(doubles ? "03" : "02", "Finish up", (
        <>
          <div className="sm:col-span-2">
            <label htmlFor="phone" className={labelCls}>Phone (optional, for day-of updates)</label>
            <input id="phone" name="phone" type="tel" placeholder="(555) 555-5555" className={field} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-chalk-dim sm:col-span-2">
            <input type="checkbox" name="volunteer" className="h-4 w-4 shrink-0 accent-[#e22028]" />
            I&apos;m interested in refereeing or volunteering at future events
          </label>
        </>
      ))}

      {/* Optional player profile — one checkbox, one password */}
      <div className={`border p-5 transition-colors sm:p-6 ${wantProfile ? "border-cq/60 bg-cq/[0.06]" : "border-line bg-carbon/60"}`}>
        <label className="flex cursor-pointer items-start gap-3.5">
          <input
            type="checkbox"
            checked={wantProfile}
            onChange={(e) => setWantProfile(e.target.checked)}
            className="mt-1 h-4 w-4 shrink-0 accent-[#e22028]"
          />
          <span>
            <span className="flex items-center gap-2 font-bold uppercase tracking-wide text-chalk">
              <UserRound className="h-4 w-4 text-cq-bright" aria-hidden />
              Create my CourtQuest player profile
            </span>
            <span className="mt-1.5 block text-sm leading-relaxed text-chalk-dim">
              Optional. Tracks your matches, scores, W-L record, and tournament
              history across every CourtQuest event, and gives you a live
              dashboard on tournament day. We already have your name and email;
              just pick a password.
            </span>
          </span>
        </label>
        {wantProfile && (
          <div className="mt-4 border-t border-line pt-4">
            <label htmlFor="password" className={labelCls}>Choose a password (8+ characters) *</label>
            <input id="password" name="password" type="password" required minLength={8} className={field} />
          </div>
        )}
      </div>

      {error && <p className="text-sm font-medium text-cq-bright">{error}</p>}

      <div className="pt-2">
        <button
          type="submit"
          disabled={state === "busy"}
          className="w-full bg-cq px-6 py-4 text-sm font-bold uppercase tracking-wide text-chalk shadow-[0_8px_24px_-8px_rgba(226,32,40,0.55)] transition-all hover:bg-cq-bright disabled:opacity-60"
        >
          {state === "busy" ? "Signing up…" : "Sign up to play"}
        </button>
        <p className="eyebrow mt-3 text-center text-chalk-dim/60">
          Free to register · cash entry fee at check-in
        </p>
      </div>
    </form>
  );
}
