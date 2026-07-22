"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Banknote, CreditCard, Heart, Users } from "lucide-react";
import { adminWrite, supabase } from "@/lib/supabase";
import { useAdmin } from "@/lib/useAdmin";
import type { DonationNote, Registration, Tournament } from "@/lib/types";

function dollars(cents: number) {
  return `$${(cents / 100).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

type Row = Registration & { tournament_name: string; tournament_slug: string };

export default function AdminMoneyPage() {
  const { me, checked } = useAdmin();
  const pin = me?.cred ?? null;
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<DonationNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!pin) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data: ts } = await supabase
        .from("tournaments")
        .select("id,slug,name,status,starts_at")
        .order("starts_at", { ascending: false });
      const tournaments = (ts as Tournament[]) ?? [];
      const all: Row[] = [];
      for (const t of tournaments) {
        const { data } = await supabase.rpc("admin_list_registrations", { pin, t_id: t.id });
        for (const r of (data as Registration[]) ?? []) {
          all.push({ ...r, tournament_name: t.name, tournament_slug: t.slug });
        }
      }
      const { data: noteData } = await supabase.rpc("admin_list_donation_notes", { pin });
      if (!cancelled) {
        setRows(all);
        setNotes((noteData as DonationNote[]) ?? []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [pin]);

  const stats = useMemo(() => {
    const duo = rows.filter((r) => (r.registration_type ?? (r.player2 ? "duo" : "individual")) === "duo");
    const individual = rows.filter((r) => (r.registration_type ?? (r.player2 ? "duo" : "individual")) === "individual");
    const cash = rows.filter((r) => r.payment_method === "cash");
    const online = rows.filter((r) => r.payment_method === "online");
    const paid = rows.filter((r) => r.paid);
    const owed = rows.filter((r) => !r.paid);
    const expected = rows.reduce((s, r) => s + (r.fee_cents ?? 0), 0);
    const collected = rows.filter((r) => r.paid).reduce((s, r) => s + (r.fee_cents ?? 0), 0);
    const cashExpected = cash.reduce((s, r) => s + (r.fee_cents ?? 0), 0);
    const onlineExpected = online.reduce((s, r) => s + (r.fee_cents ?? 0), 0);
    return {
      total: rows.length,
      duo: duo.length,
      individual: individual.length,
      cash: cash.length,
      online: online.length,
      paid: paid.length,
      owed: owed.length,
      expected,
      collected,
      cashExpected,
      onlineExpected,
      outstanding: expected - collected,
    };
  }, [rows]);

  async function markPaid(r: Row, paid: boolean) {
    if (!pin) return;
    setBusy(true);
    try {
      await adminWrite(pin, "registration_update", {
        id: r.id,
        patch: {
          paid,
          paid_at: paid ? new Date().toISOString() : null,
          payment_method: r.payment_method === "unpaid" && paid ? "online" : r.payment_method,
        },
      });
      setRows((prev) =>
        prev.map((x) =>
          x.id === r.id
            ? {
                ...x,
                paid,
                paid_at: paid ? new Date().toISOString() : null,
                payment_method:
                  x.payment_method === "unpaid" && paid ? "online" : x.payment_method,
              }
            : x
        )
      );
    } finally {
      setBusy(false);
    }
  }

  if (!checked) return <main className="min-h-screen" />;
  if (!pin) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
        <h1 className="display text-4xl text-chalk">Locked</h1>
        <Link href="/admin" className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright">
          Sign in
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28">
      <Link href="/admin" className="eyebrow inline-flex items-center gap-2 text-chalk-dim hover:text-chalk">
        <ArrowLeft className="h-4 w-4" /> Admin home
      </Link>
      <h1 className="display mt-5 text-4xl text-chalk sm:text-5xl">Money &amp; registrations</h1>
      <p className="mt-3 max-w-2xl text-sm text-chalk-dim">
        Cash vs online, team vs solo, expected fees, and donation notes.
        Online amounts are what players selected at sign-up — confirm in Zeffy if needed.
      </p>

      {loading ? (
        <p className="eyebrow mt-16 animate-pulse-live text-chalk-dim">Loading…</p>
      ) : (
        <>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: <Users className="h-4 w-4" />, l: "Registrations", v: String(stats.total), s: `${stats.duo} team · ${stats.individual} solo` },
              { icon: <CreditCard className="h-4 w-4" />, l: "Online", v: String(stats.online), s: `${dollars(stats.onlineExpected)} expected` },
              { icon: <Banknote className="h-4 w-4" />, l: "Cash day-of", v: String(stats.cash), s: `${dollars(stats.cashExpected)} expected` },
              { icon: <Heart className="h-4 w-4" />, l: "Collected", v: dollars(stats.collected), s: `${dollars(stats.outstanding)} still owed · ${stats.paid} paid` },
            ].map((c) => (
              <div key={c.l} className="border border-line bg-carbon p-5">
                <p className="eyebrow flex items-center gap-2 text-chalk-dim">{c.icon} {c.l}</p>
                <p className="tnum mt-3 font-mono text-3xl font-bold text-chalk">{c.v}</p>
                <p className="mt-1 text-xs text-chalk-dim">{c.s}</p>
              </div>
            ))}
          </div>

          <section className="mt-12">
            <p className="eyebrow baseline mb-5 pb-3 text-chalk-dim">All registrations</p>
            {rows.length === 0 ? (
              <p className="border border-dashed border-line px-6 py-12 text-center text-sm text-chalk-dim">
                No registrations yet. Share a tournament&apos;s /register link.
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((r) => {
                  const kind = r.registration_type ?? (r.player2 ? "duo" : "individual");
                  const method = r.payment_method ?? "unpaid";
                  return (
                    <div key={r.id} className="flex flex-wrap items-center gap-3 border border-line bg-carbon px-4 py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-chalk">
                          {r.player1}{r.player2 ? ` & ${r.player2}` : ""}
                          {r.preferred_partner && !r.player2 && (
                            <span className="eyebrow ml-2 text-chalk-dim">prefers {r.preferred_partner}</span>
                          )}
                        </p>
                        <p className="font-mono text-xs text-chalk-dim">
                          <Link href={`/admin/${r.tournament_slug}`} className="text-cq-bright hover:text-chalk">
                            {r.tournament_name}
                          </Link>
                          {" · "}{kind} · {method}
                          {r.fee_cents ? ` · ${dollars(r.fee_cents)}` : ""}
                          {" · "}{r.email}
                        </p>
                      </div>
                      <span className={`eyebrow border px-2.5 py-1 ${r.paid ? "border-win/40 text-win" : "border-line text-chalk-dim"}`}>
                        {r.paid ? "Paid" : "Owes"}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => markPaid(r, !r.paid)}
                        className="eyebrow border border-line px-3 py-2 text-chalk-dim hover:text-chalk disabled:opacity-50"
                      >
                        {r.paid ? "Mark unpaid" : "Mark paid"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="mt-14">
            <p className="eyebrow baseline mb-5 pb-3 text-chalk-dim">
              Donation notes <span className="tnum ml-1 text-chalk">{notes.length}</span>
            </p>
            {notes.length === 0 ? (
              <p className="border border-dashed border-line px-6 py-10 text-center text-sm text-chalk-dim">
                Notes left on /donate before Zeffy checkout appear here (after the SQL migration).
                Actual donation dollars live in your Zeffy dashboard.
              </p>
            ) : (
              <div className="space-y-2">
                {notes.map((n) => (
                  <div key={n.id} className="border border-line bg-carbon px-4 py-3.5">
                    <p className="font-semibold text-chalk">
                      {n.anonymous ? "Anonymous" : n.donor_name || "Someone"}
                      <span className="eyebrow ml-2 text-chalk-dim">
                        {new Date(n.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    </p>
                    {n.message && <p className="mt-1 text-sm text-chalk-dim">{n.message}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
