"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { ArrowRight, Mail } from "lucide-react";
import { siteConfig } from "@/data/site-config";
import { Button3D } from "@/components/ui/Button3D";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { FloatingBadgeModal } from "@/components/ui/FloatingBadgeModal";
import { CertificateLightbox } from "@/components/ui/CertificateLightbox";
import { certifications } from "@/data/certifications";
import type { Certification } from "@/types";
import { useSurfaceTilt } from "@/lib/use-surface-tilt";

const titles = [
  "AI/ML Engineer",
  "Cloud Engineer",
  "Data Scientist",
  "Generative AI Engineer",
];

/** AI Practitioner sits in the middle: it is the badge that names the discipline
 *  this portfolio is about, so it holds the centre of the trust strip. */
const CERT_BADGES = [
  {
    id: "aws-ml-engineer",
    src: "/images/certs/aws-ml-engineer.png",
    alt: "AWS ML Engineer",
  },
  {
    id: "aws-ai-practitioner",
    src: "/images/certs/aws-ai-practitioner.png",
    alt: "AWS AI Practitioner",
  },
  {
    id: "aws-solutions-architect",
    src: "/images/certs/aws-solutions-architect.png",
    alt: "AWS Solutions Architect",
  },
] as const;

/**
 * A badge cut from glass.
 * Clicking opens the large 3D floating badge modal.
 */
function CertBadge({
  src,
  alt,
  onClick,
}: {
  id: string;
  src: string;
  alt: string;
  onClick?: () => void;
}) {
  const { setRef, tiltProps } = useSurfaceTilt<HTMLButtonElement>({ maxTiltDeg: 14 });

  return (
    <button
      ref={setRef}
      {...tiltProps}
      type="button"
      onClick={onClick}
      className="cert-badge cursor-pointer"
      aria-label={`${alt} — inspect 3D credential badge`}
      style={{ "--badge-src": `url("${src}")` } as React.CSSProperties}
    >
      <span className="cert-badge-plate">
        <Image
          src={src}
          alt=""
          width={200}
          height={200}
          aria-hidden="true"
          className="cert-badge-img pointer-events-none"
        />
        <span className="cert-badge-glass" aria-hidden="true" />
        <span className="cert-badge-edge" aria-hidden="true" />
      </span>
      <span className="cert-badge-name">{alt}</span>
    </button>
  );
}

export function HeroSection() {
  const [titleIndex, setTitleIndex] = useState(0);
  const [badgeCert, setBadgeCert] = useState<Certification | null>(null);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);

  const handleBadgeClick = (id: string) => {
    const cert = certifications.find((c) => c.id === id);
    if (cert) {
      setBadgeCert(cert);
    }
  };

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
      {/* Background at z-0, content at z-10, per the reference document's
          structure. The base follows the theme, so the hero's text uses the
          normal tokens and stays readable in both modes. */}
      <AuroraBackground />

      {/* Explicitly above the mesh. A positioned element paints over static
          in-flow content regardless of DOM order, so the copy needs its own
          layer or the mesh would sit on top of the headline. */}
      <div className="hero-copy relative z-10 mx-auto max-w-4xl text-center">
        {/* Name */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          /* text-accent-text, not text-accent: #0FA4AF measures 3.02:1 on the
             light background, which no amount of scrim can fix because the
             background is the page. See the token note in globals.css. */
          className="text-sm font-medium uppercase tracking-widest text-accent-text sm:text-base"
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
              className="text-xl font-medium text-accent-text sm:text-2xl md:text-3xl"
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
          <Button3D href="#projects">
            View Projects
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button3D>
          <Button3D href="#contact" variant="neutral">
            <Mail className="h-4 w-4" aria-hidden="true" />
            Contact
          </Button3D>
        </motion.div>

        {/* Trust strip — AWS badges */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          {CERT_BADGES.map((badge) => (
            <CertBadge
              key={badge.alt}
              {...badge}
              onClick={() => handleBadgeClick(badge.id)}
            />
          ))}
        </motion.div>
      </div>

      {/* Floating 3D Large Badge Modal */}
      <FloatingBadgeModal
        cert={badgeCert}
        isOpen={Boolean(badgeCert)}
        onClose={() => setBadgeCert(null)}
        onOpenCertificate={(c) => setSelectedCert(c)}
      />

      {/* Full Certificate Lightbox */}
      <CertificateLightbox
        cert={selectedCert}
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        onShowBadge={(c) => setBadgeCert(c)}
      />
    </section>
  );
}
