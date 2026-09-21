"use client";

import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { certifications } from "@/data/certifications";
import { CertificateCard3D } from "@/components/ui/CertificateCard3D";
import { CertificateLightbox } from "@/components/ui/CertificateLightbox";
import { FloatingBadgeModal } from "@/components/ui/FloatingBadgeModal";
import type { Certification } from "@/types";

export function CertificationsSection() {
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [badgeCert, setBadgeCert] = useState<Certification | null>(null);
  const awsCerts = certifications.filter((c) => c.category === "AWS");

  return (
    <section id="certifications" className="py-20 sm:py-28">
      <div className="page-shell-narrow">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-accent">
            Certifications
          </h2>
          <p className="mt-2 text-3xl font-bold sm:text-4xl">Verified Credentials</p>
          <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
            Official cloud and AI/ML certifications backed by Amazon Web Services.
            Hover over cards for 3D view or click to inspect credentials.
          </p>
        </motion.div>

        {/* AWS certs with generous width, floating 3D logo, and certificate preview */}
        <div className="cert-grid mt-10">
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

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <Link
            href="/certifications"
            className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-accent/50 hover:bg-accent/10 hover:text-accent hover:shadow-md"
          >
            View all certifications ({certifications.length})
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>

      {/* Floating 3D Large Badge Modal */}
      <FloatingBadgeModal
        cert={badgeCert}
        isOpen={Boolean(badgeCert)}
        onClose={() => setBadgeCert(null)}
        onOpenCertificate={(c) => setSelectedCert(c)}
      />

      {/* Lightbox for full certificate viewing */}
      <CertificateLightbox
        cert={selectedCert}
        isOpen={Boolean(selectedCert)}
        onClose={() => setSelectedCert(null)}
        onShowBadge={(c) => setBadgeCert(c)}
      />
    </section>
  );
}
