"use client";

import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import Image from "next/image";
import {
  Eye,
  ExternalLink,
  FileText,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { Certification } from "@/types";

interface CertificateCard3DProps {
  cert: Certification;
  index?: number;
  onShowCertificate: (cert: Certification) => void;
  onShowBadge?: (cert: Certification) => void;
}

/**
 * 3D Floating Emblem Badge with Pure Hexagon ("Satcon") Border Light Glow
 * No background box — pure transparent badge with physics-based 3D tilt
 * and radiant neon edge-tracing drop-shadow.
 */
function Badge3DEmblem({
  src,
  alt,
  issuer,
  onClick,
}: {
  src: string;
  alt: string;
  issuer: string;
  onClick?: () => void;
}) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Normalized mouse coords (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery 3D tilt
  const springConfig = { damping: 18, stiffness: 280 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [22, -22]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-22, 22]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeRef.current) return;
    const rect = badgeRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div
      ref={badgeRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none py-1 group/emblem"
      style={{ perspective: 700 }}
      title={`Click to inspect floating 3D ${issuer} badge`}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        animate={{
          scale: isHovered ? 1.15 : 1,
          y: isHovered ? -3 : 0,
        }}
        transition={{ type: "spring", damping: 22, stiffness: 240 }}
        className="relative h-14 w-14 sm:h-16 sm:w-16 flex items-center justify-center transform-gpu"
        title={`${issuer} Official Badge`}
      >
        {/* 
          PURE TRANSPARENT BADGE WITH HEXAGON (SATCON) CONTOUR BORDER LIGHT
          - No background, no square box
          - Theme-aware: Clearly visible in Light Mode, balanced electric aqua in Dark Mode
        */}
        <div
          className={`relative h-full w-full transform-gpu ${
            isHovered ? "badge-satcon-glow-hover" : "badge-satcon-glow"
          }`}
        >
          <Image
            src={src}
            alt={alt}
            width={64}
            height={64}
            className="h-full w-full object-contain pointer-events-none select-none"
          />
        </div>
      </motion.div>
    </div>
  );
}

export function CertificateCard3D({
  cert,
  index = 0,
  onShowCertificate,
  onShowBadge,
}: CertificateCard3DProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.35,
        delay: index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="h-full"
    >
      {/* 
        Native GPU-accelerated card container:
        Silky-smooth, progressive lift on hover (zero jerk / no jhatka)
      */}
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/80 bg-card p-5 shadow-sm transform-gpu will-change-transform transition-[transform,box-shadow,border-color] duration-350 ease-out hover:-translate-y-1.5 hover:border-accent/60 hover:shadow-xl hover:shadow-accent/10">
        
        {/* 1. TOP: Unobstructed Certificate Preview Banner */}
        {cert.certificateImage && (
          <div
            onClick={() => onShowCertificate(cert)}
            className="group/banner relative mb-5 h-44 w-full cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-black/40 shadow-inner transform-gpu"
          >
            <Image
              src={cert.certificateImage}
              alt={`${cert.name} certificate`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 420px"
              className="object-cover object-top filter brightness-[0.95] transform-gpu transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/banner:scale-[1.03] group-hover/banner:brightness-105"
              priority={index < 3}
            />
            {/* Subtle gradient vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 transition-opacity duration-200 group-hover/banner:opacity-50" />

            {/* Quick View Pill */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-all duration-200 ease-out group-hover/banner:opacity-100 group-hover/banner:scale-100 scale-95">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3.5 py-1.5 text-xs font-semibold text-accent-foreground shadow-lg backdrop-blur-md">
                <Eye className="h-3.5 w-3.5" />
                Quick View
              </span>
            </div>
          </div>
        )}

        {/* 2. HEADER: Title & Info on Left + 3D Hexagon Emblem (No Background) on Right */}
        <div className="flex items-start justify-between gap-3 sm:gap-4">
          {/* Left: Metadata & Title */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                <Sparkles className="h-3 w-3" />
                {cert.level}
              </span>
              <span className="text-xs text-muted-foreground">{cert.issueDate}</span>
              {cert.expiryDate && (
                <span className="text-xs text-muted-foreground">
                  → {cert.expiryDate}
                </span>
              )}
            </div>

            <h3
              onClick={() => onShowCertificate(cert)}
              className="mt-2.5 cursor-pointer text-base sm:text-lg font-bold text-foreground leading-snug transition-colors duration-150 hover:text-accent"
            >
              {cert.name}
            </h3>

            <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground">
              {cert.issuer}
            </p>

            {/* Credential ID */}
            {cert.credentialId && (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                <span className="text-foreground/80 font-medium">ID:</span>{" "}
                <span className="rounded bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-foreground/90">
                  {cert.credentialId.length > 20
                    ? `${cert.credentialId.slice(0, 16)}...`
                    : cert.credentialId}
                </span>
              </p>
            )}
          </div>

          {/* Right: Tagda 3D Hexagon (Satcon) Badge — Pure Floating with Neon Border Light */}
          {cert.badgeImage && (
            <div className="flex-shrink-0 pt-0.5">
              <Badge3DEmblem
                src={cert.badgeImage}
                alt={`${cert.name} badge`}
                issuer={cert.issuer}
                onClick={() => onShowBadge?.(cert)}
              />
            </div>
          )}
        </div>

        {/* 3. SKILLS CHIPS */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {cert.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-foreground/80"
            >
              {skill}
            </span>
          ))}
          {cert.skills.length > 4 && (
            <span className="rounded-md bg-muted/30 px-2 py-0.5 text-xs text-muted-foreground">
              +{cert.skills.length - 4}
            </span>
          )}
        </div>

        {/* 4. BOTTOM ACTION BUTTONS: Clean, tactile, well-proportioned toolbar */}
        <div className="mt-auto pt-5 border-t border-border/60 flex items-center justify-between gap-2">
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={() => onShowCertificate(cert)}
            className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground shadow-sm transform-gpu transition-all duration-150 ease-out hover:bg-accent/90 hover:-translate-y-0.5 hover:shadow-md hover:shadow-accent/25 active:translate-y-0 active:shadow-sm"
          >
            <Eye className="h-4 w-4" />
            View Certificate
          </button>

          {/* Secondary Action Buttons */}
          <div className="flex items-center gap-2">
            {cert.pdfUrl && (
              <a
                href={cert.pdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs font-medium text-muted-foreground transform-gpu transition-all duration-150 ease-out hover:border-accent/50 hover:bg-accent/10 hover:text-foreground hover:-translate-y-0.5 active:translate-y-0"
                title="Open original official PDF"
              >
                <FileText className="h-3.5 w-3.5" />
                PDF
              </a>
            )}

            {cert.verifyUrl && (
              <a
                href={cert.verifyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/80 px-3 py-2 text-xs font-semibold text-foreground transform-gpu transition-all duration-150 ease-out hover:border-accent/50 hover:bg-accent/10 hover:text-accent hover:-translate-y-0.5 active:translate-y-0"
                title="Verify credential on official portal"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-accent" />
                Verify
                <ExternalLink className="h-3 w-3 opacity-70" />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
