import type { Metadata } from "next";
import Image from "next/image";
import { Reveal, SectionHead } from "@/components/ui";
import trophies2 from "@/photos/trophies-2.jpg";
import community from "@/photos/community.jpg";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support CourtQuest, a student-led 501(c)(3). Every dollar funds community pickleball tournaments and the local causes they support.",
};

/* Swap these for live campaign links (Zeffy supports one-time AND recurring
   for free). Until then they open an email to the team. */
const DONATE_URL = "mailto:hello@courtquest.org?subject=Donation%20to%20CourtQuest";
const MONTHLY_URLS = {
  rally: "mailto:hello@courtquest.org?subject=Monthly%20giving%20($5%20Rally%20Supporter)",
  court: "mailto:hello@courtquest.org?subject=Monthly%20giving%20($15%20Court%20Sponsor)",
  championship: "mailto:hello@courtquest.org?subject=Monthly%20giving%20($40%20Championship%20Backer)",
};

/* Monthly tiers: each one maps to a real tournament cost. */
const TIERS = [
  {
    price: "$5",
    name: "Rally Supporter",
    funds: "Keeps the ball bin stocked",
    body: "Tournament pickleballs crack and wear out fast. This keeps fresh balls on every court, every event.",
    href: MONTHLY_URLS.rally,
  },
  {
    price: "$15",
    name: "Court Sponsor",
    funds: "Covers an hour of court time",
    body: "Indoor courts are our biggest expense. An hour a month adds up to whole qualification rounds.",
    href: MONTHLY_URLS.court,
    featured: true,
  },
  {
    price: "$40",
    name: "Championship Backer",
    funds: "Trophies + a sponsored team",
    body: "Funds the podium hardware each event and covers entry for a player who couldn't otherwise join.",
    href: MONTHLY_URLS.championship,
  },
];

const FAQ = [
  {
    q: "Is my donation tax-deductible?",
    a: "Yes. CourtQuest is a registered 501(c)(3) nonprofit, so donations are tax-deductible to the extent allowed by law.",
  },
  {
    q: "Where does the money go?",
    a: "Directly into running tournaments (venue, equipment, trophies) and the local causes each event raises funds for. We're fully student-run, so there are no salaries.",
  },
  {
    q: "Can I sponsor a tournament instead?",
    a: "Absolutely. Local businesses have covered courts, food, and prizes. Reach out and we'll build something together.",
  },
];

export default function DonatePage() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 pb-24 pt-28 sm:px-6 sm:pt-36">
      <SectionHead eyebrow="Donate" title="Fuel the next rally" />

      <div className="grid gap-14 lg:grid-cols-[1.1fr_1fr]">
        <div>
          <Reveal>
            <p className="max-w-xl text-lg leading-relaxed text-chalk sm:text-xl">
              Every CourtQuest tournament turns entry fees and donations into
              direct support for local causes.{" "}
              <strong className="text-cq-bright">$3,000+ raised so far</strong>.
              Your gift puts more players on court and more dollars back into the
              community.
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-line pt-8">
              {[
                { v: "$3,000+", l: "Raised to date" },
                { v: "100%", l: "Goes to the mission" },
                { v: "0", l: "Salaries paid" },
              ].map((s) => (
                <div key={s.l}>
                  <p className="tnum font-mono text-2xl font-bold text-chalk sm:text-3xl">{s.v}</p>
                  <p className="eyebrow mt-2 text-chalk-dim">{s.l}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <a
              href={DONATE_URL}
              className="mt-10 inline-flex items-center justify-center bg-cq px-8 py-4 text-sm font-bold uppercase tracking-wide text-chalk transition-all hover:bg-cq-bright hover:-translate-y-0.5 shadow-[0_8px_24px_-8px_rgba(226,32,40,0.55)]"
            >
              Give once
            </a>
            <p className="eyebrow mt-4 text-chalk-dim/70">
              Prefer sponsoring? Email us. We love local partners.
            </p>
          </Reveal>

          {/* Monthly giving tiers */}
          <Reveal delay={0.1}>
            <div className="baseline mt-16 pb-3 text-chalk">
              <p className="eyebrow flex items-center gap-2.5 text-cq-bright">
                <span className="kitchen-tick -translate-y-[2px]" aria-hidden />
                Give monthly
              </p>
              <h2 className="display mt-3 text-3xl">Join the rotation</h2>
            </div>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-chalk-dim">
              Monthly supporters are how we book courts before a single entry fee
              comes in. Every tier funds something specific.
            </p>
          </Reveal>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {TIERS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.07}>
                <div
                  className={`flex h-full flex-col border p-5 ${
                    t.featured ? "border-cq bg-cq/[0.06]" : "border-line bg-carbon"
                  }`}
                >
                  <p className="tnum font-mono text-3xl font-bold text-chalk">
                    {t.price}<span className="text-sm font-medium text-chalk-dim">/mo</span>
                  </p>
                  <p className="eyebrow mt-2 text-cq-bright">{t.name}</p>
                  <p className="mt-3 text-sm font-bold uppercase tracking-wide text-chalk">{t.funds}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-chalk-dim">{t.body}</p>
                  <a
                    href={t.href}
                    className={`mt-5 block py-3 text-center text-xs font-bold uppercase tracking-wide transition-all ${
                      t.featured
                        ? "bg-cq text-chalk hover:bg-cq-bright"
                        : "border border-line text-chalk hover:border-chalk/50"
                    }`}
                  >
                    Give monthly
                  </a>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="mt-14 space-y-6">
            {FAQ.map((f, i) => (
              <Reveal key={f.q} delay={i * 0.06}>
                <div className="border-t border-line pt-5">
                  <h3 className="font-bold uppercase tracking-wide text-chalk">{f.q}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-chalk-dim">{f.a}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1}>
          <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={trophies2}
                alt="Championship trophies funded by community donations"
                placeholder="blur"
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
            <div className="relative aspect-[4/3] overflow-hidden">
              <Image
                src={community}
                alt="Families and players brought together at a CourtQuest event"
                placeholder="blur"
                fill
                sizes="(max-width:1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
