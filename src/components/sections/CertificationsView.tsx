"use client";

import { useState, useMemo } from "react";
import { ShieldCheck, Award, Layers, Sparkles } from "lucide-react";
import { certifications } from "@/data/certifications";
import { CertificateCard3D } from "@/components/ui/CertificateCard3D";
import { CertificateLightbox } from "@/components/ui/CertificateLightbox";
import { FloatingBadgeModal } from "@/components/ui/FloatingBadgeModal";
import type { Certification } from "@/types";

type CategoryFilter = "ALL" | "AWS" | "DATA_SCIENCE";

export function CertificationsView() {
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [badgeCert, setBadgeCert] = useState<Certification | null>(null);
  const [filter, setFilter] = useState<CategoryFilter>("ALL");

  const awsCerts = useMemo(
    () => certifications.filter((c) => c.category === "AWS"),
    []
  );

  const dsCerts = useMemo(
    () =>
      certifications.filter(
        (c) => c.category === "Data Science" || c.category === "Analytics"
      ),
    []
  );

  return (
    <div>
      {/* Category Filter Pills */}
      <div className="mt-8 flex flex-wrap items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={() => setFilter("ALL")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "ALL"
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
              : "border border-border/80 bg-card/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          All Credentials ({certifications.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("AWS")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "AWS"
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
              : "border border-border/80 bg-card/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          AWS Cloud & AI ({awsCerts.length})
        </button>

        <button
          type="button"
          onClick={() => setFilter("DATA_SCIENCE")}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
            filter === "DATA_SCIENCE"
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20"
              : "border border-border/80 bg-card/60 text-muted-foreground hover:border-accent/40 hover:text-foreground"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          Data Science & Analytics ({dsCerts.length})
        </button>
      </div>

      {/* AWS Section */}
      {(filter === "ALL" || filter === "AWS") && (
        <div className="mt-12">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <ShieldCheck className="h-5 w-5" />
              </span>
              Amazon Web Services (AWS)
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {awsCerts.length} Certifications
            </span>
          </div>

          <div className="cert-grid cert-grid-wide mt-6">
            {awsCerts.map((cert, i) => (
              <CertificateCard3D
                key={cert.id}
                cert={cert}
                index={i}
                onShowCertificate={(c) => setSelectedCert(c)}
                onShowBadge={(c) => setBadgeCert(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Data Science & Analytics Section */}
      {(filter === "ALL" || filter === "DATA_SCIENCE") && (
        <div className="mt-14">
          <div className="flex items-center justify-between border-b border-border/70 pb-3">
            <h2 className="flex items-center gap-2.5 text-xl font-bold text-foreground">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Award className="h-5 w-5" />
              </span>
              Data Science & Analytics
            </h2>
            <span className="text-xs font-medium text-muted-foreground">
              {dsCerts.length} Credentials
            </span>
          </div>

          <div className="cert-grid cert-grid-wide mt-6">
            {dsCerts.map((cert, i) => (
              <CertificateCard3D
                key={cert.id}
                cert={cert}
                index={i}
                onShowCertificate={(c) => setSelectedCert(c)}
                onShowBadge={(c) => setBadgeCert(c)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Floating 3D Large Badge Modal */}
      <FloatingBadgeModal
        cert={badgeCert}
        isOpen={Boolean(badgeCert)}
        onClose={() => setBadgeCert(null)}
        onOpenCertificate={(c) => setSelectedCert(c)}
      />

      {/* Lightbox Modal */}
      <CertificateLightbox
        cert={selectedCert}
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        onShowBadge={(c) => setBadgeCert(c)}
      />
    </div>
  );
}
