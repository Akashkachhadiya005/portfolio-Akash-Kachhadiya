"use client";

import { motion } from "motion/react";
import dynamic from "next/dynamic";
import { skills } from "@/data/skills";
import type { SkillGroup } from "@/types";

const SkillNetwork = dynamic(() => import("@/components/three/SkillNetwork"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Loading 3D...
    </div>
  ),
});

// Split skill groups: 3 left, 3 right (equal count)
const leftGroups = skills.slice(0, 3);
const rightGroups = skills.slice(3, 6);

function SkillCard({ group, delay }: { group: SkillGroup; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay }}
      className="flex h-full flex-col rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
      <div className="mt-3 flex flex-1 flex-wrap content-start gap-1.5">
        {group.items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-accent/20 bg-accent/5 px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export function SkillsSection() {
  return (
    <section id="skills" className="bg-muted/30 py-20 sm:py-28">
      {/* Capped shell, same as Projects and Certifications. On `page-shell` (96vw
          with no ceiling) the skill cards kept widening on zoom-out and the chips
          inside spread into loose, unreadable rows. */}
      <div className="page-shell-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            Skills & Technologies
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">What I Work With</p>
        </motion.div>

        {/* Desktop: cards | 3D orbit | cards */}
        <div className="mt-14 hidden xl:grid xl:grid-cols-10 xl:gap-5">
          {/* Left column — wider cards */}
          <div className="col-span-3 grid grid-rows-3 gap-5">
            {leftGroups.map((group, i) => (
              <SkillCard key={group.category} group={group} delay={i * 0.08} />
            ))}
          </div>

          {/* Center 3D Neural Network.
              NOTE: do NOT animate `scale` on a wrapper that contains the R3F
              <Canvas>. R3F measures its size with a ResizeObserver, and a
              ResizeObserver never reports transform changes — so it latches
              whatever the rect was mid-animation and the canvas ends up smaller
              than its box, top-left aligned. That silently offsets every ball
              and every hit-test. Fade + translate only. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            // `relative z-10`: the network is no longer clipped, so its soft
            // halos reach a little past the frame. Without a z-index the right
            // card column (later in DOM order) would paint over that bleed while
            // the left column would not — an asymmetry you can see. Lifting the
            // whole column above both makes the bleed even on either side.
            className="relative z-10 col-span-4 flex items-stretch justify-center"
          >
            <div className="relative w-full min-h-[400px]">
              <SkillNetwork />
            </div>
          </motion.div>

          {/* Right column — wider cards */}
          <div className="col-span-3 grid grid-rows-3 gap-5">
            {rightGroups.map((group, i) => (
              <SkillCard key={group.category} group={group} delay={i * 0.08} />
            ))}
          </div>
        </div>

        {/* Tablet + Mobile: cards grid + orbit below */}
        <div className="mt-12 xl:hidden">
          <div className="grid gap-5 sm:grid-cols-2">
            {skills.map((group, i) => (
              <SkillCard key={group.category} group={group} delay={i * 0.06} />
            ))}
          </div>

          {/* 3D network for tablet — same no-scale rule as above */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex justify-center"
          >
            {/* Was `hidden md:flex`, so phones never saw the network at all. It
                renders at every width now; SkillNetwork measures the frame and
                shrinks the balls to fit, so 28 of them still settle on a narrow
                screen instead of jamming into a blob. */}
            <div className="relative h-[420px] w-full max-w-[420px] sm:h-[460px] sm:max-w-[560px]">
              <SkillNetwork />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
