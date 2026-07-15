"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Tournament } from "@/lib/types";

/**
 * Referee entry: pick the tournament, enter its code (handed out by CQ
 * leadership), and the console unlocks for that event.
 */
export default function RefEntryPage() {
  const router = useRouter();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .in("status", ["live", "registration", "draft"])
      .order("starts_at", { ascending: true })
      .then(({ data }) => {
        const list = (data as Tournament[]) ?? [];
        setTournaments(list);
        const live = list.find((t) => t.status === "live");
        setSelected(live?.id ?? list[0]?.id ?? "");
      });
  }, []);

  async function unlock(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !code.trim()) return;
    setState("busy");
    const { data: ok } = await supabase.rpc("verify_ref", { t_id: selected, code: code.trim() });
    if (!ok) {
      setState("error");
      return;
    }
    const t = tournaments.find((x) => x.id === selected)!;
    localStorage.setItem(`cq-ref-${t.slug}`, code.trim());
    router.push(`/ref/${t.slug}`);
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 pb-16 pt-28">
      <div className="w-full max-w-md">
        <div className="border border-line bg-carbon p-8 sm:p-10">
          <KeyRound className="h-7 w-7 text-cq-bright" aria-hidden />
          <h1 className="display mt-5 text-4xl text-chalk">Referee console</h1>
          <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
            Enter the tournament code from CQ leadership, pick your court, and
            score matches as they come to you.
          </p>

          <form onSubmit={unlock} className="mt-8 space-y-5">
            <div>
              <label htmlFor="tournament" className="eyebrow mb-2 block text-chalk-dim">Tournament</label>
              <select
                id="tournament"
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
                className="w-full border border-line bg-court px-4 py-3.5 text-sm text-chalk focus:border-chalk/40 focus:outline-none"
              >
                {tournaments.length === 0 && <option value="">No upcoming tournaments</option>}
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}{t.status === "live" ? " · LIVE" : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="code" className="eyebrow mb-2 block text-chalk-dim">Tournament code</label>
              <input
                id="code"
                value={code}
                onChange={(e) => { setCode(e.target.value); setState("idle"); }}
                placeholder="e.g. CQ-XXXX"
                autoCapitalize="characters"
                autoComplete="off"
                className="w-full border border-line bg-court px-4 py-3.5 font-mono text-lg uppercase tracking-[0.25em] text-chalk placeholder:text-sm placeholder:normal-case placeholder:tracking-normal placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none"
              />
            </div>
            {state === "error" && (
              <p className="text-sm font-medium text-cq-bright">
                That code didn&apos;t match this tournament. Double-check with leadership.
              </p>
            )}
            <button
              type="submit"
              disabled={state === "busy" || !selected}
              className="w-full bg-cq px-6 py-4 text-sm font-bold uppercase tracking-wide text-chalk transition-all hover:bg-cq-bright disabled:opacity-60"
            >
              {state === "busy" ? "Checking…" : "Open console"}
            </button>
          </form>
        </div>
        <p className="eyebrow mt-6 text-center text-chalk-dim/60">
          Volunteering to ref? Ask any CQ leader for the code.
        </p>
      </div>
    </main>
  );
}
