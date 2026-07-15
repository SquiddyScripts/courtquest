import type { Metadata, Viewport } from "next";
import { archivo, chivoMono } from "@/lib/fonts";
import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://courtquest.org"),
  title: {
    default: "CourtQuest · Community Pickleball Tournaments",
    template: "%s · CourtQuest",
  },
  description:
    "CourtQuest is a student-led 501(c)(3) nonprofit running competitive pickleball tournaments in Northern Virginia, with live brackets, real-time scores, and every dollar going back to the community.",
  openGraph: {
    title: "CourtQuest · Community Pickleball Tournaments",
    description:
      "Student-led nonprofit pickleball tournaments with live brackets and real-time scores. $3,000+ raised for local causes.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${chivoMono.variable}`}>
      <body>
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
