"use client";

import { useRef } from "react";
import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { experience } from "@/data/experience";

export function ExperienceSection() {
  const timelineRef = useRef<HTMLDivElement>(null);

  // Progress of the timeline through the viewport. The offsets start the fill
  // when the timeline's top reaches ~65% down the screen and finish it as its
  // end passes ~55%, so the line tracks reading position rather than the raw
  // scrollbar.
  const { scrollYProgress } = useScroll({
    target: timelineRef,
    offset: ["start 65%", "end 55%"],
  });

  // Spring so the line eases instead of snapping frame-to-frame with the wheel.
  // scaleY is a compositor-friendly transform — no layout, no repaint.
  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.4,
  });

  // Travelling read head, positioned as a percentage of the rail
  const headTop = useTransform(progress, (v) => `${(v * 100).toFixed(2)}%`);
  const headOpacity = useTransform(progress, [0, 0.02, 0.97, 1], [0, 1, 1, 0]);

  // The energised length is CLIPPED rather than scaled. scaleY would have
  // stretched the packets travelling inside it along with the rail, so they
  // would grow from slivers to blocks as the section filled.
  const litClip = useTransform(
    progress,
    (v) => `inset(0 0 ${((1 - v) * 100).toFixed(2)}% 0)`,
  );

  return (
    <section id="experience" className="bg-muted/30 py-20 sm:py-28">
      <div className="page-shell-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            Experience
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">My Journey</p>
        </motion.div>

        {/* Timeline */}
        <div ref={timelineRef} className="relative mt-12">
          {/* Unlit bus */}
          <div
            aria-hidden="true"
            className="timeline-track absolute left-4 top-0 h-full sm:left-6"
          />

          {/* Energised length, with packets running inside it */}
          <motion.div
            aria-hidden="true"
            style={{ clipPath: litClip }}
            className="timeline-live absolute left-4 top-0 h-full sm:left-6"
          >
            <span className="timeline-flow" />
            <span className="timeline-flow timeline-flow-slow" />
          </motion.div>

          {/* Read head riding the leading edge */}
          <motion.span
            aria-hidden="true"
            style={{ top: headTop, opacity: headOpacity }}
            className="timeline-head absolute left-4 sm:left-6"
          />

          <div className="space-y-10">
            {experience.map((exp, i) => (
              <motion.div
                key={exp.id}
                /* Enters on Y, not X. A horizontal offset put these 20px to the
                   left of the gutter until whileInView fired, which pushed the
                   document past the viewport edge on phones (measured: left
                   edge at -4px on a 375-412px screen). Vertical entrances cannot
                   cause horizontal overflow, and it matches every other section. */
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="relative pl-12 sm:pl-16"
              >
                {/* Node — lights up as its entry comes into view */}
                <motion.span
                  aria-hidden="true"
                  initial={{ scale: 0.6, opacity: 0.45 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-45% 0px -45% 0px" }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="timeline-node absolute left-2.5 top-1.5 sm:left-[1.15rem]"
                />

                {/* Trace from the rail to this card, drawn as the signal lands */}
                <motion.span
                  aria-hidden="true"
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true, margin: "-45% 0px -45% 0px" }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.3, 1], delay: 0.08 }}
                  className="timeline-branch absolute left-4 top-3 w-8 sm:left-6 sm:w-10"
                />

                {/* Content */}
                <div className="relative isolate overflow-hidden rounded-xl border border-border bg-card p-5">
                  {/* Light crossing the card once, as the trace reaches it */}
                  <motion.span
                    aria-hidden="true"
                    initial={{ x: "-120%", opacity: 0 }}
                    whileInView={{ x: "120%", opacity: [0, 1, 1, 0] }}
                    viewport={{ once: true, margin: "-40% 0px -40% 0px" }}
                    transition={{ duration: 1.1, ease: "easeInOut", delay: 0.18 }}
                    className="timeline-sweep"
                  />
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{exp.role}</h3>
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
