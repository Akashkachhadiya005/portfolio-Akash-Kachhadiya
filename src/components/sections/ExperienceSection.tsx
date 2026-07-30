"use client";

import { motion } from "motion/react";
import { experience } from "@/data/experience";

export function ExperienceSection() {
  return (
    <section
      id="experience"
      className="bg-muted/30 px-4 py-20 sm:px-6 sm:py-28 lg:px-8"
    >
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            Experience
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">
            My Journey
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative mt-12">
          {/* Vertical line */}
          <div className="absolute left-4 top-0 h-full w-px bg-border sm:left-6" />

          <div className="space-y-10">
            {experience.map((exp, i) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative pl-12 sm:pl-16"
              >
                {/* Dot */}
                <div className="absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-accent bg-background sm:left-4.5" />

                {/* Content */}
                <div className="rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {exp.role}
                    </h3>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {exp.type}
                    </span>
                  </div>

                  <p className="mt-1 text-sm font-medium text-muted-foreground">
                    {exp.company} · {exp.location}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {exp.startDate} – {exp.endDate ?? "Present"}
                  </p>

                  {/* Highlights */}
                  <ul className="mt-3 space-y-1.5">
                    {exp.highlights.map((h, idx) => (
                      <li
                        key={idx}
                        className="text-sm text-muted-foreground before:mr-2 before:text-accent before:content-['▸']"
                      >
                        {h}
                      </li>
                    ))}
                  </ul>

                  {/* Skills */}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {exp.skills.map((s) => (
                      <span
                        key={s}
                        className="rounded-md bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
