"use client";

import { useEffect, useState } from "react";
import { ExternalLink, X } from "lucide-react";

/**
 * Low-friction Zeffy checkout: try an in-page embed, always offer a
 * fallback tab link (ad blockers / iframe blocks still convert).
 */
export function ZeffyEmbed({
  url,
  title,
  height = 720,
  onPaid,
  paidLabel = "I've finished paying",
}: {
  url: string;
  title: string;
  height?: number;
  /** Shown when the user confirms they completed Zeffy checkout. */
  onPaid?: () => void;
  paidLabel?: string;
}) {
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    // If the iframe never fires load (rare), surface the fallback sooner.
    const t = window.setTimeout(() => setBlocked(false), 0);
    return () => window.clearTimeout(t);
  }, [url]);

  return (
    <div className="border border-line bg-carbon">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="eyebrow text-chalk-dim">{title}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="eyebrow inline-flex items-center gap-1.5 text-cq-bright hover:text-chalk"
        >
          Open in new tab <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>

      <div className="relative bg-court" style={{ minHeight: height }}>
        {!blocked ? (
          <iframe
            title={title}
            src={url}
            className="absolute inset-0 h-full w-full border-0"
            style={{ height }}
            loading="lazy"
            allow="payment *; clipboard-write"
            referrerPolicy="no-referrer-when-downgrade"
            onError={() => setBlocked(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center" style={{ minHeight: height }}>
            <p className="text-sm text-chalk-dim">
              The payment form couldn&apos;t load in this page (common with some browsers or blockers).
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright"
            >
              Continue on Zeffy
            </a>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
        <p className="text-xs text-chalk-dim/70">
          Secure checkout on Zeffy · 100% of the fee goes to CourtQuest
        </p>
        {onPaid && (
          <button
            type="button"
            onClick={onPaid}
            className="eyebrow border border-win/40 px-3.5 py-2 text-win hover:bg-win/10"
          >
            {paidLabel}
          </button>
        )}
      </div>
    </div>
  );
}

/** Full-screen-ish overlay for pay-after-register without leaving the flow. */
export function ZeffyModal({
  url,
  title,
  onClose,
  onPaid,
}: {
  url: string;
  title: string;
  onClose: () => void;
  onPaid?: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-court/80 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden border border-line bg-carbon shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="eyebrow text-chalk">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1.5 text-chalk-dim hover:bg-line/40 hover:text-chalk"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ZeffyEmbed url={url} title={title} height={640} onPaid={onPaid} paidLabel="Done — I'm paid" />
        </div>
      </div>
    </div>
  );
}
