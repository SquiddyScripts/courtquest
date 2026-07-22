import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Donate",
  description:
    "Support CourtQuest, a student-led 501(c)(3). Every dollar funds community pickleball tournaments and the local causes they support.",
};

export default function DonateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
