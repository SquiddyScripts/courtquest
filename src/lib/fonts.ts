import { Archivo, Chivo_Mono } from "next/font/google";

// Archivo variable — width axis gives us the expanded athletic display cut
// and the normal body cut from one family (one network request, one voice).
export const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Chivo Mono — scorebug numerals: match codes, timers, scores, stats.
export const chivoMono = Chivo_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-chivo-mono",
  display: "swap",
});
