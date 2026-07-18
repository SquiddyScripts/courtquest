"use client";

import Image, { type StaticImageData } from "next/image";
import { Reveal } from "@/components/ui";

export interface GalleryPhoto {
  img: StaticImageData;
  alt: string;
  label?: string;
  /** Deprecated: grid is uniform now, spans are ignored. */
  span?: "tall" | "wide";
}

/** Uniform photo grid: even cells, slightly faded, captions on hover. */
export function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
      {photos.map((p, i) => (
        <Reveal key={i} delay={Math.min(i * 0.05, 0.3)}>
          <div className="group relative aspect-[4/3] w-full overflow-hidden bg-carbon">
            <Image
              src={p.img}
              alt={p.alt}
              placeholder="blur"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover opacity-85 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04] group-hover:opacity-100"
            />
            {/* Slight even wash so the grid reads calm, lifts on hover. */}
            <div className="pointer-events-none absolute inset-0 bg-court/15 transition-opacity duration-500 group-hover:opacity-0" aria-hidden />
            {p.label && (
              <div className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-court/90 to-transparent p-3 pt-8 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                <p className="eyebrow text-chalk">{p.label}</p>
              </div>
            )}
          </div>
        </Reveal>
      ))}
    </div>
  );
}
