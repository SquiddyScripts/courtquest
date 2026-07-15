import Image from "next/image";
import Link from "next/link";
import logo from "@/photos/logo.png";

const COLUMNS = [
  {
    title: "Play",
    links: [
      { href: "/tournaments", label: "Tournaments" },
      { href: "/join", label: "Sign up to play" },
      { href: "/ref", label: "Referee console" },
    ],
  },
  {
    title: "Organization",
    links: [
      { href: "/about", label: "About us" },
      { href: "/donate", label: "Donate" },
      { href: "/join", label: "Volunteer" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t-2 border-cq bg-court">
      {/* faint second court line under the red baseline */}
      <div className="absolute inset-x-0 top-[6px] border-t border-cq/40" aria-hidden />

      <div className="mx-auto max-w-7xl px-4 pb-10 pt-16 sm:px-6">
        <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-3">
              <Image src={logo} alt="" width={48} height={48} className="h-12 w-12" />
              <span className="display-wide text-lg text-chalk">
                Court<span className="text-cq-bright">Quest</span>
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-chalk-dim">
              A student-led 501(c)(3) nonprofit organizing competitive pickleball
              tournaments in Northern Virginia, where every rally raises money
              for local causes.
            </p>
            <p className="eyebrow mt-6 text-chalk-dim/70">Est. 2025 · Northern Virginia</p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="eyebrow mb-5 text-cq-bright">{col.title}</p>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm font-medium text-chalk-dim transition-colors hover:text-chalk"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Giant outlined wordmark — the walk-off moment */}
        <div className="mt-16 select-none overflow-hidden" aria-hidden>
          <p
            className="display whitespace-nowrap text-center text-[11vw] leading-[0.8] text-transparent lg:text-[8.5rem]"
            style={{ WebkitTextStroke: "1.5px rgba(250,250,248,0.16)" }}
          >
            CourtQuest
          </p>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-line pt-6 sm:flex-row">
          <p className="text-xs text-chalk-dim/70">
            © {new Date().getFullYear()} CourtQuest. A 501(c)(3) nonprofit organization.
          </p>
          <p className="eyebrow text-chalk-dim/50">
            Serve · Rally · Give back
            <Link href="/admin" className="ml-4 text-chalk-dim/30 transition-colors hover:text-chalk" aria-label="Leadership sign-in">
              ⚿
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
