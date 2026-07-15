"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Minus } from "lucide-react";
import { refWrite } from "@/lib/supabase";
import { isGameOver, STAGE_LABEL, teamPlayers } from "@/lib/logic";
import type { Match, Team, Tournament } from "@/lib/types";

/* ────────────────────────────────────────────────────────────────────────────
   Scoring console: tap the big number to add a point, submit when it's done.
   That's the whole job. Court change and withdrawal live under "More".
──────────────────────────────────────────────────────────────────────────── */

interface Props {
  tournament: Tournament;
  match: Match;
  teams: Map<string, Team>;
  code: string;
  onExit: () => void;
  /** Court-bound ref flow: no back link, no court switcher. */
  embedded?: boolean;
}

export function ScoreConsole({ tournament, match, teams, code, onExit, embedded }: Props) {
  const a = match.team_a ? teams.get(match.team_a) : null;
  const b = match.team_b ? teams.get(match.team_b) : null;

  // Optimistic scores so taps feel instant; realtime reconciles.
  const [scoreA, setScoreA] = useState(match.score_a);
  const [scoreB, setScoreB] = useState(match.score_b);
  const [confirming, setConfirming] = useState(false);
  const [more, setMore] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const syncing = useRef(0);

  useEffect(() => {
    if (syncing.current === 0) {
      setScoreA(match.score_a);
      setScoreB(match.score_b);
    }
  }, [match.score_a, match.score_b]);

  const write = async (action: string, payload: Record<string, unknown>) => {
    syncing.current++;
    setError("");
    try {
      await refWrite(tournament.id, code, action, { id: match.id, ...payload });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Write failed. Check connection.");
    } finally {
      syncing.current--;
    }
  };

  const target = match.stage === "qualification" ? tournament.qual_points : tournament.elim_points;
  const over = isGameOver(match.stage, scoreA, scoreB, tournament.qual_points, tournament.elim_points);

  async function bump(side: "a" | "b", delta: 1 | -1) {
    const next = side === "a" ? Math.max(0, scoreA + delta) : Math.max(0, scoreB + delta);
    if (side === "a") setScoreA(next); else setScoreB(next);

    const patch: Record<string, unknown> = { [`score_${side}`]: next };
    if (match.status === "upcoming" && delta > 0) {
      patch.status = "ongoing";
      patch.started_at = new Date().toISOString();
    }
    await write("match_update", { patch });
  }

  async function submit() {
    setBusy(true);
    try {
      await refWrite(tournament.id, code, "match_submit", {
        id: match.id,
        score_a: scoreA,
        score_b: scoreB,
        duration_secs: match.started_at
          ? Math.floor((Date.now() - new Date(match.started_at).getTime()) / 1000)
          : null,
      });
      onExit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submit failed");
      setConfirming(false);
    } finally {
      setBusy(false);
    }
  }

  async function withdraw(side: "a" | "b") {
    setBusy(true);
    try {
      const teamId = side === "a" ? match.team_a : match.team_b;
      const winScore = Math.max(side === "a" ? scoreB : scoreA, target);
      await refWrite(tournament.id, code, "team_withdraw", { id: match.id, team_id: teamId });
      await refWrite(tournament.id, code, "match_submit", {
        id: match.id,
        score_a: side === "a" ? scoreA : winScore,
        score_b: side === "b" ? scoreB : winScore,
      });
      onExit();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Withdrawal failed");
      setWithdrawing(false);
    } finally {
      setBusy(false);
    }
  }

  const scoreBox = (side: "a" | "b") => {
    const team = side === "a" ? a : b;
    const score = side === "a" ? scoreA : scoreB;
    const leading =
      (side === "a" && scoreA > scoreB) || (side === "b" && scoreB > scoreA);
    return (
      <div className={`flex-1 border bg-carbon ${leading ? "border-chalk/40" : "border-line"}`}>
        <p className="truncate border-b border-line px-3 py-3 text-center text-sm font-bold uppercase tracking-wide text-chalk">
          <span className="tnum mr-2 font-mono text-xs text-chalk-dim">{team?.number ?? ""}</span>
          {team ? teamPlayers(team) : "TBD"}
        </p>

        <button
          onClick={() => bump(side, 1)}
          disabled={match.status === "completed"}
          className="tnum block w-full py-10 text-center font-mono text-8xl font-bold text-chalk transition-colors active:bg-cq/20 sm:py-14 sm:text-9xl"
          aria-label={`Add point for ${team ? teamPlayers(team) : "team " + side.toUpperCase()}`}
        >
          {score}
        </button>
        <p className="eyebrow pb-3 text-center text-chalk-dim/50">Tap to score</p>

        <button
          onClick={() => bump(side, -1)}
          className="flex w-full items-center justify-center gap-2 border-t border-line py-3.5 text-chalk-dim transition-colors hover:text-chalk active:bg-chalk/10"
          aria-label={`Remove point from ${team ? teamPlayers(team) : "team " + side.toUpperCase()}`}
        >
          <Minus className="h-4 w-4" /> <span className="eyebrow">Undo point</span>
        </button>
      </div>
    );
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* header */}
      <div className={`mb-6 flex flex-wrap items-center gap-3 ${embedded ? "justify-center" : "justify-between"}`}>
        {!embedded && (
          <button onClick={onExit} className="eyebrow flex items-center gap-2 text-chalk-dim hover:text-chalk">
            <ArrowLeft className="h-4 w-4" /> All matches
          </button>
        )}
        <p className="font-mono text-sm text-chalk">
          #{match.code} <span className="text-chalk-dim">· {STAGE_LABEL[match.stage]} · first to {target}{match.stage !== "qualification" ? ", win by 2" : ""}</span>
          {match.court != null && <span className="text-chalk-dim"> · Court {match.court}</span>}
        </p>
      </div>

      {/* the scoreboard */}
      <div className="flex gap-3">
        {scoreBox("a")}
        {scoreBox("b")}
      </div>

      <AnimatePresence>
        {over && match.status !== "completed" && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="mt-4 border border-cq bg-cq/10 px-4 py-3 text-center font-mono text-sm font-bold uppercase tracking-wider text-cq-bright"
          >
            That&apos;s game. Submit the score below.
          </motion.p>
        )}
      </AnimatePresence>

      {error && <p className="mt-4 text-sm font-medium text-cq-bright">{error}</p>}

      {/* submit */}
      <button
        onClick={() => setConfirming(true)}
        disabled={match.status === "completed" || busy || (scoreA === 0 && scoreB === 0)}
        className={`mt-4 w-full px-6 py-5 text-base font-bold uppercase tracking-wide text-chalk transition-all disabled:opacity-40 ${
          over ? "bg-cq hover:bg-cq-bright shadow-[0_8px_24px_-8px_rgba(226,32,40,0.55)]" : "border border-line hover:border-chalk/40"
        }`}
      >
        Submit final score
      </button>

      {/* more: court + withdrawal, out of the way */}
      <div className="mt-3 text-center">
        <button onClick={() => setMore(!more)} className="eyebrow text-chalk-dim/70 hover:text-chalk">
          {more ? "Hide options" : "More options"}
        </button>
      </div>
      {more && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-3 border border-line bg-carbon p-4">
          {!embedded && (
            <label className="eyebrow flex items-center gap-2 text-chalk-dim">
              Court
              <select
                value={match.court ?? ""}
                onChange={(e) => write("match_update", { patch: { court: Number(e.target.value) } })}
                className="border border-line bg-court px-3 py-2 font-mono text-sm font-bold text-chalk focus:outline-none"
              >
                {match.court == null && <option value="">—</option>}
                {Array.from({ length: tournament.courts }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
          )}
          <button
            onClick={() => setWithdrawing(true)}
            className="eyebrow border border-line px-4 py-2.5 text-chalk-dim transition-colors hover:border-cq/60 hover:text-cq-bright"
          >
            Team withdrawal / injury
          </button>
        </div>
      )}

      {/* confirm dialog */}
      <AnimatePresence>
        {confirming && (
          <Dialog onClose={() => setConfirming(false)}>
            <p className="eyebrow text-cq-bright">Final score</p>
            <h3 className="display mt-3 text-4xl text-chalk">{scoreA} – {scoreB}</h3>
            <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
              Both teams good with this? Submitting updates the{" "}
              {match.stage === "qualification" ? "standings" : "bracket"} for everyone instantly.
            </p>
            <div className="mt-6 flex gap-3">
              <button
                onClick={submit}
                disabled={busy}
                className="flex-1 bg-cq px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
              >
                {busy ? "Submitting…" : "Submit"}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="border border-line px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk-dim hover:text-chalk"
              >
                Back
              </button>
            </div>
          </Dialog>
        )}

        {withdrawing && (
          <Dialog onClose={() => setWithdrawing(false)}>
            <p className="eyebrow text-cq-bright">Team withdrawal</p>
            <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
              The withdrawing team forfeits this match and sits out the rest of the
              tournament. Who&apos;s out?
            </p>
            <div className="mt-6 space-y-3">
              {(["a", "b"] as const).map((side) => {
                const team = side === "a" ? a : b;
                if (!team) return null;
                return (
                  <button
                    key={side}
                    onClick={() => withdraw(side)}
                    disabled={busy}
                    className="w-full border border-line px-4 py-3.5 text-left text-sm font-bold uppercase tracking-wide text-chalk transition-colors hover:border-cq hover:text-cq-bright disabled:opacity-50"
                  >
                    {team.number} · {teamPlayers(team)}
                  </button>
                );
              })}
              <button
                onClick={() => setWithdrawing(false)}
                className="w-full border border-line px-4 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk-dim hover:text-chalk"
              >
                Cancel
              </button>
            </div>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}

function Dialog({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-court/80 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md border border-line bg-carbon p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
