"use client";

import { useMemo, useState } from "react";
import { Banknote, CreditCard, UserRound, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { storePlayerSession } from "@/lib/usePlayer";
import { ENTRY_FEE_CENTS, feeLabel, zeffyUrlFor, type RegistrationKind } from "@/lib/zeffy";
import { ZeffyModal } from "@/components/zeffy/ZeffyEmbed";
import type { PaymentMethod, Tournament } from "@/lib/types";

const field =
  "w-full border border-line bg-court px-4 py-3.5 text-base text-chalk placeholder:text-chalk-dim/40 transition-colors focus:border-cq/70 focus:outline-none";
const labelCls = "eyebrow mb-2 block text-chalk-dim";

export type RegistrationResult = {
  profile: "created" | "exists" | null;
  paymentMethod: PaymentMethod;
  kind: RegistrationKind;
  registrationId: string | null;
};

/**
 * Focused tournament sign-up: pick team vs solo, pay online (Zeffy) or cash
 * day-of, then optional player profile. Roster stays on CourtQuest.
 */
export function RegisterForm({
  tournament,
  onDone,
}: {
  tournament: Tournament;
  onDone: (result: RegistrationResult) => void;
}) {
  const doubles = tournament.format === "doubles";
  const [kind, setKind] = useState<RegistrationKind>(doubles ? "duo" : "individual");
  const [pay, setPay] = useState<PaymentMethod>("online");
  const [wantProfile, setWantProfile] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "error">("idle");
  const [error, setError] = useState("");
  const [zeffyOpen, setZeffyOpen] = useState(false);
  const [pending, setPending] = useState<RegistrationResult | null>(null);

  const fee = feeLabel(kind);
  const zeffyUrl = useMemo(() => zeffyUrlFor(kind), [kind]);

  async function submit(fd: FormData) {
    setState("busy");
    setError("");

    const p1 = String(fd.get("player1") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const p2 = kind === "duo" ? String(fd.get("player2") ?? "").trim() : "";
    const email2 = kind === "duo" ? String(fd.get("email2") ?? "").trim() : "";
    const preferred = kind === "individual" ? String(fd.get("preferred_partner") ?? "").trim() : "";
    const phone = String(fd.get("phone") ?? "").trim();
    const feeCents = ENTRY_FEE_CENTS[kind];

    if (kind === "duo" && doubles && (!p2 || !email2)) {
      setError("Team sign-up needs both players' names and emails.");
      setState("error");
      return;
    }

    const { data, error: err } = await supabase.rpc("submit_registration", {
      t_id: tournament.id,
      p1,
      p2: p2 || null,
      email_in: email,
      email2_in: email2 || null,
      phone_in: phone || null,
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
      storePlayerSession({
        id: data.id,
        name: data.name,
        email: email.toLowerCase(),
        token: data.token,
      });
    }

    let registrationId: string | null = data?.registration_id ?? null;
    const { data: attached, error: attachErr } = await supabase.rpc("attach_registration_payment", {
      t_id: tournament.id,
      email_in: email,
      registration_type_in: kind,
      preferred_partner_in: preferred || null,
      payment_method_in: pay,
      fee_cents_in: feeCents,
      paid_in: false,
    });
    if (!attachErr && attached) registrationId = String(attached);

    const result: RegistrationResult = {
      profile: data?.profile ?? null,
      paymentMethod: pay,
      kind,
      registrationId,
    };

    if (pay === "online") {
      setPending(result);
      setZeffyOpen(true);
      setState("idle");
      return;
    }

    onDone(result);
  }

  // Never trust a client "I paid" click — online stays unpaid until an admin
  // confirms it (or cash at check-in). Closing the checkout just finishes sign-up.
  function finishAfterCheckout() {
    setZeffyOpen(false);
    if (pending) onDone(pending);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await submit(new FormData(e.currentTarget));
  }

  const section = (no: string, title: string, children: React.ReactNode) => (
    <fieldset className="border border-line bg-carbon/60 p-5 sm:p-6">
      <legend className="eyebrow -mx-1 flex items-center gap-2.5 px-1 text-chalk">
        <span className="tnum font-mono text-cq-bright">{no}</span> {title}
      </legend>
      <div className="mt-2 grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );

  const choiceBtn = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    title: string,
    sub: string,
  ) => (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 border p-4 text-left transition-colors ${
        active ? "border-cq bg-cq/[0.08]" : "border-line bg-carbon/60 hover:border-chalk/30"
      }`}
    >
      <span className={`mt-0.5 ${active ? "text-cq-bright" : "text-chalk-dim"}`}>{icon}</span>
      <span>
        <span className="block font-bold uppercase tracking-wide text-chalk">{title}</span>
        <span className="mt-1 block text-sm text-chalk-dim">{sub}</span>
      </span>
    </button>
  );

  const youNo = "01";
  const partnerNo = "02";
  const contactNo = kind === "duo" || (kind === "individual" && doubles) ? "03" : "02";
  const payNo = kind === "duo" || (kind === "individual" && doubles) ? "04" : "03";

  return (
    <>
      <form onSubmit={onSubmit} className="space-y-4">
        {doubles && (
          <div className="grid gap-3 sm:grid-cols-2">
            {choiceBtn(
              kind === "duo",
              () => setKind("duo"),
              <Users className="h-5 w-5" />,
              `Team · ${feeLabel("duo")}`,
              "You + partner. Both names and emails required.",
            )}
            {choiceBtn(
              kind === "individual",
              () => setKind("individual"),
              <UserRound className="h-5 w-5" />,
              `Solo · ${feeLabel("individual")}`,
              "We'll pair you. Optional preferred partner name.",
            )}
          </div>
        )}

        {section(youNo, kind === "duo" ? "You" : "Your details", (
          <>
            <div>
              <label htmlFor="player1" className={labelCls}>Full name *</label>
              <input id="player1" name="player1" required minLength={2} placeholder="First and last name" className={field} />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>Email *</label>
              <input id="email" name="email" type="email" required placeholder="you@example.com" className={field} />
            </div>
          </>
        ))}

        {kind === "duo" &&
          section(partnerNo, "Your partner", (
            <>
              <div>
                <label htmlFor="player2" className={labelCls}>Partner full name *</label>
                <input id="player2" name="player2" required minLength={2} placeholder="First and last name" className={field} />
              </div>
              <div>
                <label htmlFor="email2" className={labelCls}>Partner email *</label>
                <input id="email2" name="email2" type="email" required placeholder="partner@example.com" className={field} />
              </div>
            </>
          ))}

        {kind === "individual" && doubles &&
          section(partnerNo, "Preferred partner (optional)", (
            <div className="sm:col-span-2">
              <label htmlFor="preferred_partner" className={labelCls}>Name if you have someone in mind</label>
              <input
                id="preferred_partner"
                name="preferred_partner"
                placeholder="We'll try to pair you together"
                className={field}
              />
            </div>
          ))}

        {section(contactNo, "Contact", (
          <>
            <div className="sm:col-span-2">
              <label htmlFor="phone" className={labelCls}>Phone (optional, day-of updates)</label>
              <input id="phone" name="phone" type="tel" placeholder="(555) 555-5555" className={field} />
            </div>
            <label className="flex cursor-pointer items-center gap-3 text-sm text-chalk-dim sm:col-span-2">
              <input type="checkbox" name="volunteer" className="h-4 w-4 shrink-0 accent-[#e22028]" />
              Interested in refereeing or volunteering at future events
            </label>
          </>
        ))}

        <fieldset className="border border-line bg-carbon/60 p-5 sm:p-6">
          <legend className="eyebrow -mx-1 flex items-center gap-2.5 px-1 text-chalk">
            <span className="tnum font-mono text-cq-bright">{payNo}</span> How you&apos;ll pay · {fee}
          </legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {choiceBtn(
              pay === "online",
              () => setPay("online"),
              <CreditCard className="h-5 w-5" />,
              "Pay online now",
              "Zeffy checkout after you submit — $0 fees to CourtQuest.",
            )}
            {choiceBtn(
              pay === "cash",
              () => setPay("cash"),
              <Banknote className="h-5 w-5" />,
              "Cash day-of",
              `Bring ${fee} to check-in on tournament day.`,
            )}
          </div>
        </fieldset>

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
                Optional. Live court alerts, W-L, and history across events.
              </span>
            </span>
          </label>
          {wantProfile && (
            <div className="mt-4 border-t border-line pt-4">
              <label htmlFor="password" className={labelCls}>Password (8+ characters) *</label>
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
            {state === "busy"
              ? "Saving…"
              : pay === "online"
                ? `Continue to pay ${fee}`
                : `Register · pay ${fee} day-of`}
          </button>
          <p className="eyebrow mt-3 text-center text-chalk-dim/60">
            Spot reserved on submit · payment via Zeffy or cash at check-in
          </p>
        </div>
      </form>

      {zeffyOpen && (
        <ZeffyModal
          url={zeffyUrl}
          title={`Pay ${fee} entry fee`}
          onClose={finishAfterCheckout}
          doneLabel="Done with checkout"
          footnote="Complete payment above if you can. Closing does not mark you paid — we confirm payments from our side."
        />
      )}
    </>
  );
}
