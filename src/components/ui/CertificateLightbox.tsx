"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import {
  X,
  ExternalLink,
  Download,
  Copy,
  Check,
  ZoomIn,
  ZoomOut,
  ShieldCheck,
  Calendar,
  Award,
} from "lucide-react";
import type { Certification } from "@/types";
import { Button3D } from "@/components/ui/Button3D";

interface CertificateLightboxProps {
  cert: Certification | null;
  isOpen: boolean;
  onClose: () => void;
  onShowBadge?: (cert: Certification) => void;
}

export function CertificateLightbox({
  cert,
  isOpen,
  onClose,
  onShowBadge,
}: CertificateLightboxProps) {
  const [copied, setCopied] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

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
      setIsZoomed(false);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  const copyCredentialId = () => {
    if (cert?.credentialId) {
      navigator.clipboard.writeText(cert.credentialId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!cert) return null;

  const displayImage = cert.certificateImage || cert.badgeImage;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="lightbox-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-6 backdrop-blur-md"
          role="dialog"
          aria-modal="true"
          aria-label={cert.name}
        >
          <motion.div
            key="lightbox-content"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-card/95 shadow-2xl shadow-black/80 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-4 sm:px-6 py-3.5 bg-muted/20 gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                {cert.badgeImage ? (
                  <motion.div
                    whileHover={{ scale: 1.15, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (onShowBadge) {
                        onShowBadge(cert);
                        onClose();
                      }
                    }}
                    transition={{ type: "spring", stiffness: 350, damping: 18 }}
                    className="group/badge relative h-11 w-11 sm:h-13 sm:w-13 flex-shrink-0 flex items-center justify-center transform-gpu cursor-pointer"
                    title={`Click to inspect floating 3D ${cert.issuer} badge`}
                  >
                    {/* Pure transparent emblem with hexagon contour neon border light (Theme-aware: Light & Dark) */}
                    <div className="relative h-full w-full flex items-center justify-center badge-satcon-glow group-hover/badge:badge-satcon-glow-hover transform-gpu">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cert.badgeImage}
                        alt={cert.name}
                        className="h-full w-full object-contain pointer-events-none select-none"
                      />
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Award className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {cert.level}
                    </span>
                  </div>
                  <h3 className="truncate text-sm sm:text-base font-bold text-foreground">
                    {cert.name}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {displayImage && (
                  <Button3D
                    variant="neutral"
                    size="icon"
                    type="button"
                    onClick={() => setIsZoomed(!isZoomed)}
                    title={isZoomed ? "Zoom out" : "Zoom in"}
                    aria-label={isZoomed ? "Zoom out" : "Zoom in"}
                  >
                    {isZoomed ? (
                      <ZoomOut className="h-[20px] w-[20px]" strokeWidth={2.4} />
                    ) : (
                      <ZoomIn className="h-[20px] w-[20px]" strokeWidth={2.4} />
                    )}
                  </Button3D>
                )}
                  <Button3D
                    variant="danger"
                    size="icon"
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    title="Close dialog"
                  >
                    <X className="h-[22px] w-[22px]" strokeWidth={2.6} />
                  </Button3D>
              </div>
            </div>

            {/* Certificate Preview Body: Direct, high-speed unoptimized render */}
            <div className="relative flex-1 overflow-auto bg-black/50 p-4 text-center">
              {displayImage ? (
                <div
                  className={`inline-block transition-transform duration-200 ${
                    isZoomed ? "scale-125 cursor-zoom-out" : "cursor-zoom-in"
                  }`}
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage}
                    alt={`${cert.name} certificate`}
                    className="max-h-[62vh] w-auto rounded-lg object-contain shadow-2xl ring-1 ring-white/10"
                    loading="eager"
                    decoding="sync"
                  />
                </div>
              ) : (
                <div className="flex h-72 flex-col items-center justify-center text-muted-foreground">
                  <Award className="h-16 w-16 stroke-1 text-accent/40" />
                  <p className="mt-3 text-sm">Certificate image unavailable</p>
                </div>
              )}
            </div>

            {/* Footer Toolbar: Verification details + instant copy + download actions */}
            <div className="flex flex-col gap-4 border-t border-border/80 bg-card/95 px-4 sm:px-6 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              {/* Left: Metadata info */}
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Calendar className="h-3.5 w-3.5 text-accent" />
                  Issued: <strong className="text-foreground">{cert.issueDate}</strong>
                </span>
                {cert.expiryDate && (
                  <span className="whitespace-nowrap">
                    Expires: <strong className="text-foreground">{cert.expiryDate}</strong>
                  </span>
                )}
                {cert.credentialId && (
                  <span className="inline-flex items-center gap-1.5 font-mono max-w-full">
                    <span className="text-foreground font-semibold shrink-0">ID:</span>
                    <span
                      className="rounded bg-muted/80 px-2 py-0.5 text-foreground truncate max-w-[160px] sm:max-w-[210px] md:max-w-none"
                      title={cert.credentialId}
                    >
                      {cert.credentialId}
                    </span>
                    <button
                      type="button"
                      onClick={copyCredentialId}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-accent/10 px-2 py-0.5 text-accent hover:bg-accent/20 transition-colors cursor-pointer active:scale-95"
                      title="Copy credential ID"
                    >
                      {copied ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span className="text-[11px] font-medium">Copy</span>
                        </>
                      )}
                    </button>
                  </span>
                )}
              </div>

              {/* Right: Actions Buttons (Stable, Non-wrapping, High-tactility) */}
              <div className="flex items-center justify-end gap-2.5 shrink-0 w-full sm:w-auto">
                {cert.pdfUrl && (
                  <motion.a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.94, y: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="inline-flex flex-1 sm:flex-initial h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background/80 px-4 py-2 text-xs sm:text-sm font-semibold text-foreground whitespace-nowrap shrink-0 shadow-sm cursor-pointer select-none transition-colors hover:border-accent/60 hover:bg-accent/10 hover:text-accent hover:shadow-md hover:shadow-accent/15 active:shadow-inner"
                  >
                    <Download className="h-4 w-4 shrink-0" />
                    <span>Open PDF</span>
                  </motion.a>
                )}
                {cert.verifyUrl && (
                  <motion.a
                    href={cert.verifyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.03, y: -2 }}
                    whileTap={{ scale: 0.94, y: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    className="group relative inline-flex flex-1 sm:flex-initial h-10 items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2 text-xs sm:text-sm font-semibold text-accent-foreground whitespace-nowrap shrink-0 shadow-md shadow-accent/25 cursor-pointer select-none transition-all duration-150 hover:bg-accent/90 hover:shadow-lg hover:shadow-accent/40 hover:ring-2 hover:ring-accent/40 active:shadow-inner active:brightness-95"
                  >
                    <span>Verify Credential</span>
                    <ExternalLink className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
