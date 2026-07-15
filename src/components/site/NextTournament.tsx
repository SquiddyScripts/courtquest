"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { supabase } from "@/lib/supabase";
import type { Tournament } from "@/lib/types";
import { BtnPrimary, LiveDot } from "@/components/ui";

/** Featured banner for the next open-registration or live tournament. */
export function NextTournament() {
  const [t, setT] = useState<Tournament | null>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    supabase
      .from("tournaments")
      .select("*")
      .in("status", ["live", "registration"])
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setT((data as Tournament) ?? null));
  }, []);

  if (!t) return null;
  const isLive = t.status === "live";
  const date = t.starts_at
    ? new Date(t.starts_at).toLocaleDateString("en-US", {
        weekday: "long", month: "long", day: "numeric",
      })
    : "Date TBA";

  return (
    // Grows in smoothly after the data arrives instead of shoving the page down.
    <motion.section
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden border-y border-line bg-carbon"
    >
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
        <div>
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="eyebrow mb-3 flex items-center gap-2.5 text-cq-bright">
                {isLive ? (
                  <>
                    <LiveDot /> Happening now
                  </>
                ) : (
                  <>
                    <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
                    Next tournament · {date}
                  </>
                )}
              </p>
              <h2 className="display text-4xl text-chalk sm:text-5xl">{t.name}</h2>
              <p className="mt-3 max-w-lg text-chalk-dim">
                {t.tagline ?? "Registration is open — grab a partner and take the court."}
                {t.location ? ` · ${t.location}` : ""}
              </p>
            </div>
            <div className="shrink-0">
              <BtnPrimary href={`/tournaments/${t.slug}`}>
                {isLive ? "Watch live" : "Register now"}
              </BtnPrimary>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
