"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";
import { siteConfig } from "@/data/site-config";

const HeroScene = dynamic(() => import("@/components/three/HeroScene"), {
  ssr: false,
  loading: () => <div className="h-full w-full" />,
});

const titles = [
  "AI/ML Engineer",
  "Cloud Engineer",
  "Data Scientist",
  "Generative AI Engineer",
];

export function HeroSection() {
  const [titleIndex, setTitleIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTitleIndex((prev) => (prev + 1) % titles.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="hero"
      className="relative flex min-h-[calc(100dvh-4rem)] items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8"
    >
      {/* 3D Background — lazy-loaded, hidden on reduced-motion */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 motion-reduce:hidden"
        aria-hidden="true"
      >
        <HeroScene />
      </div>

      <div className="mx-auto max-w-4xl text-center">
        {/* Name */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-sm font-medium uppercase tracking-widest text-accent sm:text-base"
        >
          Hello, I&apos;m
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {siteConfig.name}
        </motion.h1>

        {/* Title — rotating */}
        <div className="mt-4 h-10 sm:h-12 md:h-14 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.p
              key={titles[titleIndex]}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="text-xl font-medium text-accent sm:text-2xl md:text-3xl"
            >
              {titles[titleIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg"
        >
          {siteConfig.tagline}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <a
            href="#projects"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            View Projects
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all"
          >
            <Mail className="h-4 w-4" />
            Contact
          </a>
        </motion.div>

        {/* Trust strip — AWS badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {[
            { src: "/images/certs/aws-ml-engineer.png", alt: "AWS ML Engineer" },
            { src: "/images/certs/aws-solutions-architect.png", alt: "AWS Solutions Architect" },
            { src: "/images/certs/aws-ai-practitioner.png", alt: "AWS AI Practitioner" },
          ].map((badge) => (
            <div
              key={badge.alt}
              className="flex flex-col items-center gap-1"
            >
              <Image
                src={badge.src}
                alt={badge.alt}
                width={56}
                height={56}
                className="h-12 w-12 object-contain sm:h-14 sm:w-14"
              />
              <span className="text-xs text-muted-foreground">{badge.alt}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
