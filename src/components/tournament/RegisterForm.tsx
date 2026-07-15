"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tournament } from "@/lib/types";

const field =
  "w-full border border-line bg-carbon px-4 py-3 text-sm text-chalk placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none";

/** Public tournament sign-up. Cash is collected at check-in per the rulebook. */
export function RegisterForm({ tournament }: { tournament: Tournament }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [error, setError] = useState("");

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
      phone_in: String(fd.get("phone") ?? ""),
      volunteer_in: fd.get("volunteer") === "on",
    });
    if (err) {
      setError(err.message.includes("closed") ? "Registration is closed for this event." : "Check your name and email, then try again.");
      setState("error");
      return;
    }
    setState("done");
  }

  if (state === "done") {
    return (
      <div className="border border-win/40 bg-win/10 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-win" aria-hidden />
        <h3 className="display mt-4 text-2xl text-chalk">You&apos;re on the list</h3>
        <p className="mx-auto mt-2 max-w-sm text-sm text-chalk-dim">
          We&apos;ll email you the details. Entry fees are collected in cash at
          check-in on tournament day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div className={tournament.format === "singles" ? "sm:col-span-2" : ""}>
        <label htmlFor="player1" className="eyebrow mb-2 block text-chalk-dim">
          {tournament.format === "singles" ? "Your name *" : "Player 1 *"}
        </label>
        <input id="player1" name="player1" required minLength={2} placeholder="First name + last initial" className={field} />
      </div>
      {tournament.format === "doubles" && (
        <div>
          <label htmlFor="player2" className="eyebrow mb-2 block text-chalk-dim">Player 2 (your partner)</label>
          <input id="player2" name="player2" placeholder="Add later if you don't have one yet" className={field} />
        </div>
      )}
      <div>
        <label htmlFor="email" className="eyebrow mb-2 block text-chalk-dim">Email *</label>
        <input id="email" name="email" type="email" required placeholder="you@example.com" className={field} />
      </div>
      <div>
        <label htmlFor="phone" className="eyebrow mb-2 block text-chalk-dim">Phone</label>
        <input id="phone" name="phone" type="tel" placeholder="Optional" className={field} />
      </div>
      <label className="flex cursor-pointer items-center gap-3 text-sm text-chalk-dim sm:col-span-2">
        <input type="checkbox" name="volunteer" className="h-4 w-4 accent-[#e22028]" />
        I&apos;m also interested in refereeing / volunteering at future events
      </label>
      {error && <p className="text-sm font-medium text-cq-bright sm:col-span-2">{error}</p>}
      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={state === "busy"}
          className="w-full bg-cq px-6 py-4 text-sm font-bold uppercase tracking-wide text-chalk transition-all hover:bg-cq-bright disabled:opacity-60 sm:w-auto"
        >
          {state === "busy" ? "Signing up…" : "Sign up to play"}
        </button>
        <p className="eyebrow mt-3 text-chalk-dim/60">Cash entry fee collected at check-in</p>
      </div>
    </form>
  );
}
