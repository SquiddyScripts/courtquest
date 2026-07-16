"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Coins } from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────────
   Coin flip: a real toss the ref can hold up for both teams to watch.
   The coin starts spinning on tap (no waiting on the network) and the
   result is written to the match once it lands.
──────────────────────────────────────────────────────────────────────────── */

export type Flip = "heads" | "tails";

// Module scope: keeps the randomness out of the component's render path.
function tossCoin(): Flip {
  return Math.random() < 0.5 ? "heads" : "tails";
}

const SPIN_MS = 1700;

function Face({
  label, sub, back = false,
}: {
  label: string;
  sub: string;
  back?: boolean;
}) {
  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center rounded-full border-4 ${
        back
          ? "border-cq-deep bg-gradient-to-br from-cq to-cq-deep"
          : "border-chalk/30 bg-gradient-to-br from-chalk to-[#c9c9c4]"
      }`}
      style={{
        backfaceVisibility: "hidden",
        transform: back ? "rotateX(180deg)" : undefined,
        boxShadow: "inset 0 -6px 16px rgba(0,0,0,0.35), inset 0 6px 12px rgba(255,255,255,0.25)",
      }}
    >
      <span
        className={`display text-5xl leading-none sm:text-6xl ${back ? "text-chalk" : "text-court"}`}
      >
        {label}
      </span>
      <span
        className={`eyebrow mt-1.5 text-[10px] ${back ? "text-chalk/70" : "text-court/50"}`}
      >
        {sub}
      </span>
    </div>
  );
}

export function CoinFlip({
  result, onFlip,
}: {
  /** Persisted result, shown on the chip once a flip has happened. */
  result: Flip | null;
  onFlip: (result: Flip) => void;
}) {
  const [open, setOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<Flip | null>(null);
  const [rotation, setRotation] = useState(0);

  function start() {
    const outcome = tossCoin();
    // 5 full turns plus a half turn when it lands on tails.
    const target = rotation + 360 * 5 + (outcome === "tails" ? 180 : 0) - (rotation % 360);
    setOpen(true);
    setLanded(null);
    setSpinning(true);
    setRotation(target);
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(18);

    setTimeout(() => {
      setSpinning(false);
      setLanded(outcome);
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([28, 40, 60]);
      onFlip(outcome);
    }, SPIN_MS);
  }

  return (
    <>
      <button
        onClick={start}
        className={`eyebrow flex items-center gap-2 border px-3.5 py-2.5 transition-colors ${
          result
            ? "border-chalk/40 text-chalk"
            : "border-line text-chalk-dim hover:border-chalk/40 hover:text-chalk"
        }`}
      >
        <Coins className="h-3.5 w-3.5" />
        {result ? result.toUpperCase() : "Coin flip"}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-court/92 px-6 backdrop-blur-sm"
            onClick={() => !spinning && setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Coin flip"
          >
            {/* the coin */}
            <div style={{ perspective: 1000 }} className="mb-10">
              <motion.div
                className="relative h-44 w-44 sm:h-52 sm:w-52"
                style={{ transformStyle: "preserve-3d" }}
                animate={{
                  rotateX: rotation,
                  y: spinning ? [0, -70, 0] : 0,
                  scale: spinning ? [1, 1.08, 1] : 1,
                }}
                transition={{
                  rotateX: { duration: SPIN_MS / 1000, ease: [0.12, 0.72, 0.2, 1] },
                  y: { duration: SPIN_MS / 1000, ease: "easeOut", times: [0, 0.45, 1] },
                  scale: { duration: SPIN_MS / 1000, times: [0, 0.45, 1] },
                }}
              >
                <Face label="H" sub="Heads" />
                <Face label="T" sub="Tails" back />
              </motion.div>
              {/* shadow on the floor, tightens as the coin comes down */}
              <motion.div
                aria-hidden
                className="mx-auto mt-5 h-2 rounded-full bg-court"
                animate={{
                  width: spinning ? ["70%", "38%", "70%"] : "70%",
                  opacity: spinning ? [0.5, 0.2, 0.5] : 0.5,
                }}
                transition={{ duration: SPIN_MS / 1000, times: [0, 0.45, 1] }}
                style={{ boxShadow: "0 0 24px 10px rgba(0,0,0,0.6)" }}
              />
            </div>

            <div className="h-20 text-center">
              <AnimatePresence mode="wait">
                {landed ? (
                  <motion.div
                    key="landed"
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  >
                    <p className="display text-5xl text-chalk">{landed}</p>
                    <p className="eyebrow mt-2 text-chalk-dim">Winner picks serve or side</p>
                  </motion.div>
                ) : (
                  <motion.p
                    key="spinning"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="eyebrow text-chalk-dim"
                  >
                    Flipping…
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {landed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex gap-3"
              >
                <button
                  onClick={(e) => { e.stopPropagation(); start(); }}
                  className="eyebrow border border-line px-5 py-3 text-chalk-dim transition-colors hover:text-chalk"
                >
                  Flip again
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setOpen(false); }}
                  className="bg-cq px-6 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright"
                >
                  Done
                </button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
