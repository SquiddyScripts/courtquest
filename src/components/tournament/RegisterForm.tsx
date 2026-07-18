"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Tournament } from "@/lib/types";

const field =
  "w-full border border-line bg-carbon px-4 py-3.5 text-base text-chalk placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none";
const labelCls = "eyebrow mb-2 block text-chalk-dim";

/**
 * Tournament sign-up. Collects both players and both emails for doubles so we
 * can reach either partner. Cash entry fee is collected at check-in.
 */
export function RegisterForm({
  tournament,
  onDone,
}: {
  tournament: Tournament;
  onDone: () => void;
}) {
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState("");
  const doubles = tournament.format === "doubles";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("busy");
    setError("");
    const { error: err } = await supabase.rpc("submit_registration", {
      t_id: tournament.id,
      p1: String(fd.get("player1") ?? ""),
      p2: String(fd.get("player2") ?? ""),
      email_in: String(fd.get("email") ?? ""),
      email2_in: String(fd.get("email2") ?? ""),
      phone_in: String(fd.get("phone") ?? ""),
      volunteer_in: fd.get("volunteer") === "on",
    });
    if (err) {
      setError(
        err.message.includes("closed")
          ? "Registration is closed for this event."
          : "Check the names and emails, then try again."
      );
      setState("error");
      return;
    }
    onDone();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* Player 1 */}
      <div>
        <p className="eyebrow mb-4 flex items-center gap-2.5 text-cq-bright">
          <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
          {doubles ? "Player 1" : "Your details"}
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="player1" className={labelCls}>Name *</label>
            <input id="player1" name="player1" required minLength={2} placeholder="First name + last initial" className={field} />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>Email *</label>
            <input id="email" name="email" type="email" required placeholder="you@example.com" className={field} />
          </div>
        </div>
      </div>

      {/* Player 2 (doubles) */}
      {doubles && (
        <div>
          <p className="eyebrow mb-4 flex items-center gap-2.5 text-cq-bright">
            <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
            Player 2 · your partner
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="player2" className={labelCls}>Partner&apos;s name</label>
              <input id="player2" name="player2" placeholder="Add later if you don't have one yet" className={field} />
            </div>
            <div>
              <label htmlFor="email2" className={labelCls}>Partner&apos;s email</label>
              <input id="email2" name="email2" type="email" placeholder="partner@example.com" className={field} />
            </div>
          </div>
        </div>
      )}

      {/* Contact + volunteer */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className={labelCls}>Phone (optional)</label>
          <input id="phone" name="phone" type="tel" placeholder="For day-of updates" className={field} />
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-3 text-sm text-chalk-dim">
        <input type="checkbox" name="volunteer" className="h-4 w-4 accent-[#e22028]" />
        I&apos;m also interested in refereeing or volunteering at future events
      </label>

      {error && <p className="text-sm font-medium text-cq-bright">{error}</p>}

      <div className="border-t border-line pt-6">
        <button
          type="submit"
          disabled={state === "busy"}
          className="w-full bg-cq px-6 py-4 text-sm font-bold uppercase tracking-wide text-chalk transition-all hover:bg-cq-bright disabled:opacity-60"
        >
          {state === "busy" ? "Signing up…" : "Sign up to play"}
        </button>
        <p className="eyebrow mt-3 text-center text-chalk-dim/60">
          Free to register · cash entry fee collected at check-in
        </p>
      </div>
    </form>
  );
}
