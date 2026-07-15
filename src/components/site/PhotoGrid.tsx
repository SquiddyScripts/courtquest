"use client";

import Image, { type StaticImageData } from "next/image";
import { Reveal } from "@/components/ui";

export interface GalleryPhoto {
  img: StaticImageData;
  alt: string;
  label?: string;
  /** grid span hint: "tall" | "wide" | undefined */
  span?: "tall" | "wide";
}

/** Editorial photo grid: mixed spans, hover reveal captions. */
export function PhotoGrid({ photos }: { photos: GalleryPhoto[] }) {
  return (
    <div className="grid grid-flow-dense auto-rows-[180px] grid-cols-2 gap-2 sm:auto-rows-[220px] sm:gap-3 lg:grid-cols-4">
      {photos.map((p, i) => (
        <Reveal
          key={i}
          delay={Math.min(i * 0.05, 0.3)}
          className={
            p.span === "tall"
              ? "row-span-2"
              : p.span === "wide"
                ? "col-span-2"
                : ""
          }
        >
          <div className="group relative h-full w-full overflow-hidden bg-carbon">
            <Image
              src={p.img}
              alt={p.alt}
              placeholder="blur"
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
            />
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
