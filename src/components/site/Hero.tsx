"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { BadgeCheck } from "lucide-react";
import { BtnPrimary, BtnGhost } from "@/components/ui";
import hero from "@/photos/rr-ceremony.jpg";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Hero() {
  const reduce = useReducedMotion();
  // Targets are always set; reduced motion zeroes duration instead of removing
  // the animation (removing it mid-hydration strands elements at opacity 0).
  const anim = (delay: number) => ({
    initial: { opacity: 0, y: 36 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: reduce ? 0 : 0.9, delay: reduce ? 0 : delay, ease: EASE },
  });

  return (
    <section className="relative flex min-h-[100svh] items-end overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: reduce ? 1 : 1.06 }}
        animate={{ scale: 1 }}
        transition={{ duration: reduce ? 0 : 2.2, ease: EASE }}
      >
        <Image
          src={hero}
          alt="The CourtQuest community gathered on court at the Rally Royale closing ceremony"
          fill
          priority
          placeholder="blur"
          className="object-cover object-center"
          sizes="100vw"
          quality={82}
        />
      </motion.div>
      {/* Scrim: strong at the baseline where the type sits */}
      <div className="absolute inset-0 bg-gradient-to-t from-court via-court/55 to-court/25" aria-hidden />
      <div className="absolute inset-0 bg-court/20" aria-hidden />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-16 pt-40 sm:px-6 sm:pb-20">
        <motion.div {...anim(0.15)} className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-chalk/20 bg-court/40 px-3.5 py-1.5 backdrop-blur-sm">
            <BadgeCheck className="h-4 w-4 text-cq-bright" aria-hidden />
            <span className="eyebrow text-chalk">501(c)(3) Certified Nonprofit</span>
          </span>
        </motion.div>

        <h1 className="display text-[11.5vw] text-chalk sm:text-8xl lg:text-[8.5rem]">
          <motion.span {...anim(0.25)} className="block">
            Serve your
          </motion.span>
          <motion.span {...anim(0.38)} className="block text-cq-bright">
            community.
          </motion.span>
        </h1>

        <motion.div
          {...anim(0.55)}
          className="mt-8 flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between"
        >
          <p className="max-w-md text-base leading-relaxed text-chalk-dim sm:text-lg">
            Student-led pickleball tournaments with live brackets, real referees,
            and every dollar raised going back to local causes.
          </p>
          <div className="flex flex-wrap gap-3">
            <BtnPrimary href="/tournaments">Find a tournament</BtnPrimary>
            <BtnGhost href="/about">Our mission</BtnGhost>
          </div>
        </motion.div>

        {/* Court baseline under the hero content */}
        <motion.div
          initial={{ scaleX: reduce ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : 0.7, ease: EASE }}
          className="baseline mt-10 origin-left text-chalk/70"
          aria-hidden
        />
      </div>
    </section>
  );
}
