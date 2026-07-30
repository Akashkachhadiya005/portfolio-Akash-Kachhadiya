"use client";

import { motion } from "motion/react";
import { skills } from "@/data/skills";
import { TechOrbit } from "@/components/ui/TechOrbit";
import type { SkillGroup } from "@/types";

// Split skill groups: left column and right column
const mid = Math.ceil(skills.length / 2);
const leftGroups = skills.slice(0, mid);
const rightGroups = skills.slice(mid);

function SkillCard({ group, delay }: { group: SkillGroup; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <h3 className="text-sm font-semibold text-foreground">{group.category}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {group.items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-accent/20 bg-accent/5 px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-accent/10 hover:text-accent"
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
    <section id="skills" className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-7xl">
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

        {/* Layout: cards left | 3D orbit center | cards right */}
        <div className="mt-14 grid gap-8 xl:grid-cols-12 xl:items-center xl:gap-6">
          {/* Left column */}
          <div className="grid gap-5 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-1">
            {leftGroups.map((group, i) => (
              <SkillCard key={group.category} group={group} delay={i * 0.08} />
            ))}
          </div>

          {/* Center 3D orbit (desktop only) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="hidden xl:col-span-6 xl:flex xl:items-center xl:justify-center"
          >
            <TechOrbit />
          </motion.div>

          {/* Right column */}
          <div className="grid gap-5 sm:grid-cols-2 xl:col-span-3 xl:grid-cols-1">
            {rightGroups.map((group, i) => (
              <SkillCard key={group.category} group={group} delay={i * 0.08} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
