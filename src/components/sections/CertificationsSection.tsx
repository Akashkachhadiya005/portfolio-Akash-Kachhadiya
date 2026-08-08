"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { certifications } from "@/data/certifications";

export function CertificationsSection() {
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
        </motion.div>

        {/* AWS certs — prominent cards */}
        {/* Fixed card size at every zoom; the count adapts, not the width */}
        <div className="card-grid mt-10">
          {awsCerts.map((cert, i) => (
            <motion.div
              key={cert.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-accent/5"
            >
              {/* Badge image */}
              {cert.badgeImage ? (
                <Image
                  src={cert.badgeImage}
                  alt={`${cert.name} badge`}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <ShieldCheck className="h-6 w-6 text-accent" />
                </div>
              )}

              <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                {cert.name}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">{cert.issuer}</p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="rounded-full border border-border px-2 py-0.5">
                  {cert.level}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5">
                  {cert.issueDate}
                </span>
                {cert.expiryDate && (
                  <span className="rounded-full border border-border px-2 py-0.5">
                    → {cert.expiryDate}
                  </span>
                )}
              </div>

              {/* Skills */}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {cert.skills.slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {cert.verifyUrl && (
                <a
                  href={cert.verifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  Verify on Credly ↗
                </a>
              )}
              {cert.certificateImage && (
                <a
                  href={cert.certificateImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-foreground hover:text-accent transition-colors"
                >
                  View Certificate ↗
                </a>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-10 text-center"
        >
          <Link
            href="/certifications"
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors"
          >
            View all certifications
            <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
