import type { Metadata } from "next";
import { ShieldCheck, Award } from "lucide-react";
import { certifications } from "@/data/certifications";

export const metadata: Metadata = {
  title: "Certifications",
  description:
    "Akash Kachhadiya's professional certifications — 3 AWS certs (ML Engineer, Solutions Architect, AI Practitioner) plus Data Science credentials.",
};

export default function CertificationsPage() {
  const awsCerts = certifications.filter((c) => c.category === "AWS");
  const dsCerts = certifications.filter((c) => c.category === "Data Science");
  const otherCerts = certifications.filter((c) => c.category === "Analytics");

  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold sm:text-4xl">Certifications</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Verified professional credentials from AWS, IABAC, NASSCOM, and Microsoft.
        </p>

        {/* AWS Section */}
        <div className="mt-12">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <ShieldCheck className="h-5 w-5 text-accent" />
            Amazon Web Services (AWS)
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {awsCerts.map((cert) => (
              <CertCard key={cert.id} cert={cert} />
            ))}
          </div>
        </div>

        {/* Data Science Section */}
        <div className="mt-14">
          <h2 className="flex items-center gap-2 text-xl font-semibold">
            <Award className="h-5 w-5 text-accent" />
            Data Science & Analytics
          </h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...dsCerts, ...otherCerts].map((cert) => (
              <CertCard key={cert.id} cert={cert} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CertCard({ cert }: { cert: (typeof certifications)[number] }) {
  return (
    <div className="group flex flex-col rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-accent/5">
      {/* Badge */}
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
        <ShieldCheck className="h-6 w-6 text-accent" />
      </div>

      <h3 className="mt-4 text-base font-semibold text-foreground group-hover:text-accent transition-colors">
        {cert.name}
      </h3>

      <p className="mt-1 text-sm text-muted-foreground">{cert.issuer}</p>

      {/* Details */}
      <div className="mt-3 space-y-1 text-xs text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Level:</span> {cert.level}
        </p>
        <p>
          <span className="font-medium text-foreground">Issued:</span> {cert.issueDate}
        </p>
        {cert.expiryDate && (
          <p>
            <span className="font-medium text-foreground">Expires:</span>{" "}
            {cert.expiryDate}
          </p>
        )}
        {cert.credentialId && (
          <p>
            <span className="font-medium text-foreground">ID:</span>{" "}
            {cert.credentialId}
          </p>
        )}
      </div>

      {/* Skills */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {cert.skills.map((s) => (
          <span
            key={s}
            className="rounded-md bg-accent/5 px-2 py-0.5 text-xs font-medium text-accent"
          >
            {s}
          </span>
        ))}
      </div>

      {/* Verify link */}
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
    </div>
  );
}
