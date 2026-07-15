"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { KeyRound, ShieldCheck, Users } from "lucide-react";
import { adminWrite, supabase } from "@/lib/supabase";
import { useAdmin, type AdminIdentity } from "@/lib/useAdmin";
import type { Member, Tournament } from "@/lib/types";

const field =
  "w-full border border-line bg-court px-4 py-3 text-sm text-chalk placeholder:text-chalk-dim/50 focus:border-chalk/40 focus:outline-none";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/* ────────────────────────────────────────────────────────────────────────────
   Sign in / request access
──────────────────────────────────────────────────────────────────────────── */
function AuthGate({
  login, loginPin, signup,
}: {
  login: (email: string, pw: string) => Promise<string | null>;
  loginPin: (pin: string) => Promise<boolean>;
  signup: (email: string, name: string, pw: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [requested, setRequested] = useState(false);
  const [showPin, setShowPin] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    try {
      if (mode === "login") {
        const err = await login(String(fd.get("email")), String(fd.get("password")));
        if (err) setError(err);
      } else {
        const err = await signup(String(fd.get("email")), String(fd.get("name")), String(fd.get("password")));
        if (err) setError(err);
        else setRequested(true);
      }
    } finally {
      setBusy(false);
    }
  }

  async function onPin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    setError("");
    const ok = await loginPin(String(fd.get("pin")));
    if (!ok) setError("That PIN didn't match.");
    setBusy(false);
  }

  if (requested) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-sm border border-line bg-carbon p-8 text-center sm:p-10">
          <ShieldCheck className="mx-auto h-8 w-8 text-win" aria-hidden />
          <h1 className="display mt-5 text-3xl text-chalk">Request sent</h1>
          <p className="mt-3 text-sm leading-relaxed text-chalk-dim">
            Your account exists but needs approval. Ask the CourtQuest owner to
            activate it on the admin Team page, then sign in.
          </p>
          <button onClick={() => { setRequested(false); setMode("login"); }} className="eyebrow mt-6 text-cq-bright hover:text-chalk">
            Back to sign in →
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-sm">
        <div className="border border-line bg-carbon p-8 sm:p-10">
          <ShieldCheck className="h-7 w-7 text-cq-bright" aria-hidden />
          <h1 className="display mt-5 text-3xl text-chalk">Leadership</h1>
          <p className="mt-3 text-sm text-chalk-dim">
            Run tournaments, manage sign-ups, and update the site.
          </p>

          <div className="mt-6 flex gap-1 border-b border-line">
            {(["login", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); }}
                className={`eyebrow relative px-4 py-3 transition-colors ${mode === m ? "text-chalk" : "text-chalk-dim hover:text-chalk"}`}
              >
                {m === "login" ? "Sign in" : "Request access"}
                {mode === m && <span className="absolute inset-x-2 bottom-0 h-[2px] bg-cq" aria-hidden />}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="eyebrow mb-2 block text-chalk-dim">Your name</label>
                <input id="name" name="name" required minLength={2} placeholder="First + last" className={field} />
              </div>
            )}
            <div>
              <label htmlFor="email" className="eyebrow mb-2 block text-chalk-dim">Email</label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" className={field} />
            </div>
            <div>
              <label htmlFor="password" className="eyebrow mb-2 block text-chalk-dim">
                Password {mode === "signup" && <span className="normal-case tracking-normal">(8+ characters)</span>}
              </label>
              <input id="password" name="password" type="password" required minLength={mode === "signup" ? 8 : 1} className={field} />
            </div>
            {error && <p className="text-sm font-medium text-cq-bright">{error}</p>}
            <button
              disabled={busy}
              className="w-full bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
            >
              {busy ? "One sec…" : mode === "login" ? "Sign in" : "Request access"}
            </button>
            {mode === "signup" && (
              <p className="eyebrow text-chalk-dim/60">The owner approves new accounts before they work.</p>
            )}
          </form>
        </div>

        {/* master PIN fallback */}
        <div className="mt-4 border border-line bg-carbon px-6 py-4">
          {showPin ? (
            <form onSubmit={onPin} className="flex gap-2">
              <input
                name="pin" autoFocus placeholder="Leadership PIN" autoComplete="off"
                autoCapitalize="off" autoCorrect="off" spellCheck={false}
                className={`${field} font-mono`}
              />
              <button disabled={busy} className="shrink-0 border border-line px-4 text-sm font-bold uppercase text-chalk-dim hover:text-chalk">
                Go
              </button>
            </form>
          ) : (
            <button onClick={() => setShowPin(true)} className="eyebrow flex items-center gap-2 text-chalk-dim/70 hover:text-chalk">
              <KeyRound className="h-3.5 w-3.5" /> Use the leadership PIN instead
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Team management (owner only)
──────────────────────────────────────────────────────────────────────────── */
interface TeamRow {
  id: string; email: string; name: string; role: "owner" | "admin";
  active: boolean; created_at: string;
}

function TeamSection({ me }: { me: AdminIdentity }) {
  const [team, setTeam] = useState<TeamRow[]>([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const { data } = await supabase.rpc("admin_list_team", { token_in: me.cred });
    setTeam((data as TeamRow[]) ?? []);
  };
  useEffect(() => { queueMicrotask(load); // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me.cred]);

  const manage = async (action: string, target: string, value?: string) => {
    setBusy(true);
    try {
      const { error } = await supabase.rpc("admin_manage_team", {
        token_in: me.cred, action, target, value: value ?? null,
      });
      if (error) alert(error.message);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const pending = team.filter((t) => !t.active);
  const active = team.filter((t) => t.active);

  return (
    <section className="mt-16">
      <p className="eyebrow baseline mb-6 flex items-center gap-2 pb-3 text-chalk-dim">
        <Users className="h-3.5 w-3.5" /> Admin team
        {pending.length > 0 && <span className="tnum bg-cq px-1.5 font-mono text-[10px] text-chalk">{pending.length} waiting</span>}
      </p>

      {pending.length > 0 && (
        <div className="mb-6 grid gap-2">
          {pending.map((t) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 border border-cq/40 bg-cq/[0.06] px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-chalk">{t.name}</p>
                <p className="font-mono text-xs text-chalk-dim">{t.email}</p>
              </div>
              <button
                onClick={() => manage("set_active", t.id, "true")}
                disabled={busy}
                className="bg-cq px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => manage("remove", t.id)}
                disabled={busy}
                className="eyebrow border border-line px-3 py-2.5 text-chalk-dim hover:text-cq-bright disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-2">
        {active.map((t) => (
          <div key={t.id} className="flex flex-wrap items-center gap-3 border border-line bg-carbon px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-chalk">
                {t.name}
                {t.role === "owner" && <span className="eyebrow ml-2 text-cq-bright">Owner</span>}
                {t.email === me.email && <span className="eyebrow ml-2 text-chalk-dim">(you)</span>}
              </p>
              <p className="font-mono text-xs text-chalk-dim">{t.email}</p>
            </div>
            {t.email !== me.email && (
              <>
                <button
                  onClick={() => manage("set_role", t.id, t.role === "owner" ? "admin" : "owner")}
                  disabled={busy}
                  className="eyebrow border border-line px-3 py-2.5 text-chalk-dim hover:text-chalk disabled:opacity-50"
                >
                  {t.role === "owner" ? "Make admin" : "Make owner"}
                </button>
                <button
                  onClick={() => manage("set_active", t.id, "false")}
                  disabled={busy}
                  className="eyebrow border border-line px-3 py-2.5 text-chalk-dim hover:text-cq-bright disabled:opacity-50"
                >
                  Deactivate
                </button>
              </>
            )}
          </div>
        ))}
        {active.length === 0 && (
          <p className="text-sm text-chalk-dim/70">
            No accounts yet. Teammates can request access on the sign-in screen.
          </p>
        )}
      </div>
    </section>
  );
}

/* ── Change password ─────────────────────────────────────────────────────── */
function ChangePassword({ me }: { me: AdminIdentity }) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.rpc("admin_change_password", {
      token_in: me.cred,
      old_pw: String(fd.get("old")),
      new_pw: String(fd.get("new")),
    });
    setMsg(error
      ? { ok: false, text: error.message.includes("wrong") ? "Current password is wrong." : "New password must be 8+ characters." }
      : { ok: true, text: "Password updated." });
    setBusy(false);
    if (!error) (e.target as HTMLFormElement).reset();
  }

  if (me.viaPin) return null;
  return (
    <div className="mt-10">
      <button onClick={() => setOpen(!open)} className="eyebrow text-chalk-dim/70 hover:text-chalk">
        {open ? "Hide" : "Change my password"}
      </button>
      {open && (
        <form onSubmit={submit} className="mt-4 flex max-w-xl flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="eyebrow mb-2 block text-chalk-dim">Current password</label>
            <input name="old" type="password" required className={field} />
          </div>
          <div className="min-w-40 flex-1">
            <label className="eyebrow mb-2 block text-chalk-dim">New password (8+)</label>
            <input name="new" type="password" required minLength={8} className={field} />
          </div>
          <button disabled={busy} className="border border-line px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk-dim hover:text-chalk disabled:opacity-50">
            Update
          </button>
          {msg && <p className={`w-full text-sm font-medium ${msg.ok ? "text-win" : "text-cq-bright"}`}>{msg.text}</p>}
        </form>
      )}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
   Admin home
──────────────────────────────────────────────────────────────────────────── */
export default function AdminHome() {
  const { me, checked, login, loginPin, signup, logout } = useAdmin();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!me) return;
    queueMicrotask(async () => {
      const [{ data: ts }, { data: ms }] = await Promise.all([
        supabase.from("tournaments").select("*").order("starts_at", { ascending: false }),
        supabase.rpc("admin_list_members", { pin: me.cred }),
      ]);
      setTournaments((ts as Tournament[]) ?? []);
      setMembers((ms as Member[]) ?? []);
    });
  }, [me]);

  if (!checked) return <main className="min-h-screen" />;
  if (!me) return <AuthGate login={login} loginPin={loginPin} signup={signup} />;

  async function createTournament(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) return;
    setBusy(true);
    try {
      await adminWrite(me!.cred, "tournament_insert", {
        name,
        slug: slugify(name),
        tagline: String(fd.get("tagline") ?? "").trim() || null,
        location: String(fd.get("location") ?? "").trim() || null,
        starts_at: fd.get("starts_at") ? new Date(String(fd.get("starts_at"))).toISOString() : null,
        courts: Number(fd.get("courts") ?? 4),
        format: String(fd.get("format") ?? "doubles"),
        ref_code: String(fd.get("ref_code") ?? "").trim() || `CQ-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        charity: String(fd.get("charity") ?? "").trim() || null,
        status: fd.get("open_now") === "on" ? "registration" : "draft",
      });
      setCreating(false);
      const { data: ts } = await supabase.from("tournaments").select("*").order("starts_at", { ascending: false });
      setTournaments((ts as Tournament[]) ?? []);
    } finally {
      setBusy(false);
    }
  }

  const STATUS_TONE: Record<string, string> = {
    live: "bg-cq text-chalk",
    registration: "bg-chalk text-court",
    draft: "border border-line text-chalk-dim",
    completed: "border border-line text-chalk-dim",
  };

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
      <div className="baseline mb-10 flex flex-wrap items-end justify-between gap-4 pb-4 text-chalk">
        <div>
          <p className="eyebrow mb-2 text-cq-bright">Tournament desk · signed in as {me.name}</p>
          <h1 className="display text-4xl sm:text-5xl">Admin</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCreating(!creating)}
            className="bg-cq px-5 py-3 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright"
          >
            {creating ? "Close" : "New tournament"}
          </button>
          <button onClick={logout} className="eyebrow border border-line px-4 text-chalk-dim hover:text-chalk">
            Sign out
          </button>
        </div>
      </div>

      {creating && (
        <form onSubmit={createTournament} className="mb-12 grid gap-4 border border-line bg-carbon p-6 sm:grid-cols-2 sm:p-8">
          <div className="sm:col-span-2">
            <label className="eyebrow mb-2 block text-chalk-dim">Tournament name *</label>
            <input name="name" required placeholder="e.g. Summer Smash 2026" className={field} />
          </div>
          <div>
            <label className="eyebrow mb-2 block text-chalk-dim">Date & start time</label>
            <input name="starts_at" type="datetime-local" className={field} />
          </div>
          <div>
            <label className="eyebrow mb-2 block text-chalk-dim">Location</label>
            <input name="location" placeholder="Venue, city" className={field} />
          </div>
          <div>
            <label className="eyebrow mb-2 block text-chalk-dim">Format</label>
            <select name="format" defaultValue="doubles" className={field}>
              <option value="doubles">Doubles (teams of 2)</option>
              <option value="singles">Singles</option>
            </select>
          </div>
          <div>
            <label className="eyebrow mb-2 block text-chalk-dim">Courts</label>
            <input name="courts" type="number" min={1} max={12} defaultValue={4} className={field} />
          </div>
          <div>
            <label className="eyebrow mb-2 block text-chalk-dim">Referee code</label>
            <input name="ref_code" placeholder="Auto-generated if blank" className={field} />
          </div>
          <div>
            <label className="eyebrow mb-2 block text-chalk-dim">Raising money for</label>
            <input name="charity" placeholder="Optional" className={field} />
          </div>
          <div className="sm:col-span-2">
            <label className="eyebrow mb-2 block text-chalk-dim">Tagline</label>
            <input name="tagline" placeholder="One line for the public page" className={field} />
          </div>
          <div className="space-y-4 sm:col-span-2">
            <label className="flex items-center gap-3 text-sm text-chalk-dim">
              <input type="checkbox" name="open_now" className="h-4 w-4 accent-[#e22028]" />
              Open sign-ups immediately (otherwise it stays a hidden draft)
            </label>
            <button disabled={busy} className="bg-cq px-6 py-3.5 text-sm font-bold uppercase tracking-wide text-chalk hover:bg-cq-bright disabled:opacity-50">
              {busy ? "Creating…" : "Create tournament"}
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {tournaments.map((t) => (
          <Link
            key={t.id}
            href={`/admin/${t.slug}`}
            className="group flex flex-wrap items-center justify-between gap-4 border border-line bg-carbon p-5 transition-all hover:border-chalk/40"
          >
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-bold uppercase tracking-wide text-chalk">{t.name}</h2>
                <span className={`eyebrow px-2 py-0.5 ${STATUS_TONE[t.status]}`}>{t.status}</span>
              </div>
              <p className="eyebrow mt-1.5 text-chalk-dim/70">
                {t.starts_at ? new Date(t.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Date TBA"}
                {" · "}{t.format}{" · "}Ref code: <span className="font-bold text-chalk-dim">{t.ref_code}</span>
              </p>
            </div>
            <span className="eyebrow text-chalk-dim transition-colors group-hover:text-cq-bright">Manage →</span>
          </Link>
        ))}
      </div>

      {me.role === "owner" && <TeamSection me={me} />}
      <ChangePassword me={me} />

      {/* Members */}
      <section className="mt-16">
        <p className="eyebrow baseline mb-6 flex items-center gap-2 pb-3 text-chalk-dim">
          <Users className="h-3.5 w-3.5" /> Members & volunteer interest ({members.length})
        </p>
        {members.length === 0 ? (
          <p className="text-sm text-chalk-dim/70">Sign-ups from the Join page appear here.</p>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="eyebrow py-2.5 pr-4 font-medium text-chalk-dim">Name</th>
                  <th className="eyebrow py-2.5 pr-4 font-medium text-chalk-dim">Email</th>
                  <th className="eyebrow py-2.5 pr-4 font-medium text-chalk-dim">Volunteer</th>
                  <th className="eyebrow py-2.5 font-medium text-chalk-dim">Joined</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-line/60">
                    <td className="py-3 pr-4 font-semibold text-chalk">{m.name}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-chalk-dim">{m.email}</td>
                    <td className="py-3 pr-4">{m.volunteer ? <span className="text-win">Yes</span> : <span className="text-chalk-dim/50">—</span>}</td>
                    <td className="py-3 font-mono text-xs text-chalk-dim">{new Date(m.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
