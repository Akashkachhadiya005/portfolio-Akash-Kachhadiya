"use client";

import { motion } from "motion/react";
import { Award, Briefcase, FolderOpen } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { projects } from "@/data/projects";
import { CountUp } from "@/components/ui/CountUp";
import { PhotoFrame } from "@/components/ui/PhotoFrame";

const stats = [
  { icon: Award, value: "3", label: "AWS Certifications" },
  { icon: FolderOpen, value: `${projects.length}+`, label: "ML Projects" },
  { icon: Briefcase, value: "2", label: "Companies" },
];

export function AboutSection() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="page-shell-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            About Me
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">
            From Commerce to AI Engineering
          </p>
        </motion.div>

        <div className="mt-10 grid gap-10 lg:grid-cols-5 lg:gap-16">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-3"
          >
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              I started with a <strong className="text-foreground">B.Com</strong>{" "}
              foundation, which gave me a strong grip on business logic, finance, and data
              analysis. I then moved deep into{" "}
              <strong className="text-foreground">
                Data Science and Machine Learning
              </strong>
              , and today I work as an{" "}
              <strong className="text-foreground">AI Engineer at Calyza Tech</strong>,
              building ML and Generative AI solutions on AWS.
            </p>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
              My edge is combining business understanding with technical depth — I
              don&apos;t just build models, I build solutions that solve real business
              problems. With 3 AWS certifications and hands-on production experience, I
              bridge the gap between data and impact.
            </p>
            <p className="mt-6 text-sm text-muted-foreground">
              📍 {siteConfig.currentLocation}
            </p>
          </motion.div>

          {/* Photo placeholder + Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col gap-6 lg:col-span-2"
          >
            {/* Photo placeholder — replace with next/image when photo is optimized */}
            {/* Photo in a tilting glass frame. The source is 1200x1600 portrait,
                so the frame carries a 3:4 ratio — forcing a square cropped the
                head off. */}
            <PhotoFrame />

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3">
              {stats.map(({ icon: Icon, value, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center rounded-xl border border-border bg-card p-3 text-center"
                >
                  <Icon className="h-5 w-5 text-accent" aria-hidden="true" />
                  <CountUp
                    value={value}
                    className="mt-1 text-xl font-bold tabular-nums"
                  />
                  <span className="text-xs text-muted-foreground">{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
