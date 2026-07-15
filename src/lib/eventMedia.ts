import type { StaticImageData } from "next/image";

import heroAction from "@/photos/hero-action.jpg";
import serveToss from "@/photos/serve-toss.jpg";
import rally1 from "@/photos/rally-1.jpg";
import rally2 from "@/photos/rally-2.jpg";
import rally3 from "@/photos/rally-3.jpg";
import doubles from "@/photos/doubles.jpg";
import walkOff from "@/photos/walk-off.jpg";
import matchFar from "@/photos/match-far.jpg";
import courtChat from "@/photos/court-chat.jpg";
import trophies from "@/photos/trophies.jpg";
import trophies2 from "@/photos/trophies-2.jpg";
import winners1 from "@/photos/winners-1.jpg";
import winners2 from "@/photos/winners-2.jpg";
import podium from "@/photos/podium.jpg";
import netDuo from "@/photos/net-duo.jpg";
import paddlePair from "@/photos/paddle-pair.jpg";
import community from "@/photos/community.jpg";
import crowdVenue from "@/photos/crowd-venue.jpg";
import venue from "@/photos/venue.jpg";
import rrCeremony from "@/photos/rr-ceremony.jpg";
import rrCourt from "@/photos/rr-court.jpg";
import rrRally from "@/photos/rr-rally.jpg";
import rrWide from "@/photos/rr-wide.jpg";

export interface EventMedia {
  cover: StaticImageData;
  coverAlt: string;
  gallery: { img: StaticImageData; alt: string; span?: "tall" | "wide" }[];
  video?: string;
}

/** Photography per tournament slug, with a default set for new events. */
export const EVENT_MEDIA: Record<string, EventMedia> = {
  "rally-royale": {
    cover: rrCeremony,
    coverAlt: "Rally Royale closing ceremony group photo",
    video: "/ceremony.mp4",
    gallery: [
      { img: rrCourt, alt: "Rally Royale doubles match in play", span: "wide" },
      { img: rrRally, alt: "Rally at the Rally Royale championship" },
      { img: rrWide, alt: "Courts at the Rally Royale venue" },
      { img: rrCeremony, alt: "Closing ceremony group photo", span: "wide" },
    ],
  },
  "chill-n-dill": {
    cover: heroAction,
    coverAlt: "Player lunging for a shot at the Chill N' Dill Winter Championship",
    gallery: [
      { img: serveToss, alt: "Serve toss at match point", span: "tall" },
      { img: rally1, alt: "Doubles rally at the net", span: "wide" },
      { img: trophies, alt: "Championship trophies" },
      { img: doubles, alt: "Doubles teams mid-point" },
      { img: winners1, alt: "Winning teams with trophies", span: "wide" },
      { img: rally2, alt: "Cross-court rally" },
      { img: netDuo, alt: "Players at the net between points" },
      { img: podium, alt: "Podium finishers with awards" },
      { img: matchFar, alt: "Match play across the venue" },
      { img: winners2, alt: "Division winners with medals" },
      { img: rally3, alt: "Return of serve" },
      { img: paddlePair, alt: "Players posing with paddles" },
    ],
  },
};

export const DEFAULT_MEDIA: EventMedia = {
  cover: crowdVenue,
  coverAlt: "Players gathering at a CourtQuest tournament",
  gallery: [
    { img: community, alt: "CourtQuest community between matches", span: "wide" },
    { img: courtChat, alt: "Players talking on court" },
    { img: venue, alt: "Tournament venue" },
    { img: walkOff, alt: "Players walking off court" },
    { img: trophies2, alt: "Championship trophies" },
  ],
};

export function eventMedia(slug: string): EventMedia {
  return EVENT_MEDIA[slug] ?? DEFAULT_MEDIA;
}
