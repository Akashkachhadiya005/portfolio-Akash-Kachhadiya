"use client";

import { useEffect, useCallback, useRef } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { X, Eye, ArrowRight, ShieldCheck } from "lucide-react";
import type { Certification } from "@/types";
import { Button3D } from "@/components/ui/Button3D";

interface FloatingBadgeModalProps {
  cert: Certification | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCertificate: (cert: Certification) => void;
}

export function FloatingBadgeModal({
  cert,
  isOpen,
  onClose,
  onOpenCertificate,
}: FloatingBadgeModalProps) {
  const badgeContainerRef = useRef<HTMLDivElement>(null);

  // 3D Tilt coordinates
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 22, stiffness: 220 };
  const rotateX = useSpring(
    useTransform(mouseY, [-0.5, 0.5], [18, -18]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-0.5, 0.5], [-18, 18]),
    springConfig
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!badgeContainerRef.current) return;
    const rect = badgeContainerRef.current.getBoundingClientRect();
    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      mouseX.set(0);
      mouseY.set(0);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown, mouseX, mouseY]);

  if (!cert || !cert.badgeImage) return null;

  const handleViewCertificate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenCertificate(cert);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="floating-badge-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl p-4 sm:p-6 select-none"
          role="dialog"
          aria-modal="true"
          aria-label={`${cert.name} 3D Badge`}
        >
          {/* Top Close Button matching 3D soap style */}
          <div className="absolute top-5 right-5 sm:top-8 sm:right-8 z-20">
            <Button3D
              variant="danger"
              size="icon"
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              title="Close"
            >
              <X className="h-[22px] w-[22px]" strokeWidth={2.6} />
            </Button3D>
          </div>

          {/* Floating Container: Stop propagation so clicking inside doesn't immediately close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center justify-center max-w-2xl w-full"
          >
            {/* Header Tag & Title (Floating above) */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              className="text-center mb-4 sm:mb-6"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/15 px-3.5 py-1 text-xs font-bold text-accent uppercase tracking-widest backdrop-blur-md shadow-sm">
                <ShieldCheck className="h-3.5 w-3.5" />
                Verified Credential Badge
              </span>
              <h2 className="mt-2.5 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white drop-shadow-md px-4 leading-tight">
                {cert.name}
              </h2>
              <p className="mt-1 text-xs sm:text-sm font-medium text-white/75">
                {cert.issuer} • {cert.level}
              </p>
            </motion.div>

            {/* 
              THE LARGE 3D FLOATING LOGO (NO BACKGROUND BOX):
              - Scaled generously to screen size (up to 480px on desktop)
              - Pure transparent emblem floating freely in 3D space
              - Continuous gentle levitation / breathing animation
              - Interactive 3D tilt tracking cursor
              - Satcon contour neon aura
            */}
            <div
              ref={badgeContainerRef}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="relative flex items-center justify-center cursor-grab active:cursor-grabbing p-2 sm:p-4"
              style={{ perspective: 1200 }}
            >
              {/* Floating Animation Wrapper */}
              <motion.div
                animate={{
                  y: [0, -14, 0],
                  rotateZ: [0, 1.2, -1.2, 0],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 4.2,
                  ease: "easeInOut",
                }}
                className="relative flex items-center justify-center"
              >
                {/* 3D Perspective Tilt Wrapper: Generous, responsive sizing */}
                <motion.div
                  style={{
                    rotateX,
                    rotateY,
                    transformStyle: "preserve-3d",
                  }}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                  className="relative h-[260px] w-[260px] sm:h-[340px] sm:w-[340px] md:h-[400px] md:w-[400px] lg:h-[480px] lg:w-[480px] max-h-[50vh] max-w-[85vw] aspect-square flex items-center justify-center transform-gpu"
                >
                  {/* Satcon Perimeter Neon Contour Light (Multi-layer Luminous Halo) */}
                  <div
                    className="relative h-full w-full flex items-center justify-center transition-[filter] duration-300 transform-gpu"
                    style={{
                      filter:
                        "drop-shadow(0 0 3px #0fa4af) drop-shadow(0 0 14px rgba(15,164,175,0.85)) drop-shadow(0 0 32px rgba(15,164,175,0.5)) drop-shadow(0 25px 50px rgba(0,0,0,0.7))",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={cert.badgeImage}
                      alt={cert.name}
                      className="h-full w-full object-contain pointer-events-none select-none drop-shadow-2xl"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>

            {/* 
              FLOATING ACTION BUTTON UNDERNEATH:
              - Levitates in space directly below the badge
              - Clicking opens the full certificate lightbox on our site
            */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.15 }}
              className="mt-6 sm:mt-8"
            >
              <motion.button
                type="button"
                onClick={handleViewCertificate}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95, y: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className="group relative inline-flex items-center justify-center gap-3 rounded-2xl bg-accent px-7 py-3.5 text-sm sm:text-base font-bold text-accent-foreground shadow-xl shadow-accent/30 hover:bg-accent/95 hover:shadow-2xl hover:shadow-accent/50 hover:ring-2 hover:ring-accent/40 active:shadow-inner cursor-pointer select-none transition-all duration-150"
              >
                <Eye className="h-5 w-5 shrink-0" />
                <span className="whitespace-nowrap">View Full Certificate</span>
                <ArrowRight className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-1" />
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
