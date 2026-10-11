import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { CertificationsView } from "@/components/sections/CertificationsView";
import { BackButton3D } from "@/components/ui/BackButton3D";

export const metadata: Metadata = {
  title: "Certifications",
  description:
    "Akash Kachhadiya's professional certifications — 3 AWS certifications (ML Engineer, Solutions Architect, AI Practitioner) plus Data Science credentials from IABAC, NASSCOM, and Microsoft.",
};

export default function CertificationsPage() {
  return (
    <section className="py-20 sm:py-28">
      <div className="page-shell-narrow">
        <div className="mb-8">
          <BackButton3D fallbackHref="/" />
        </div>

        <div className="flex flex-col items-start gap-2">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Professional Credentials
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl">Certifications</h1>
          <p className="max-w-2xl text-muted-foreground">
            Official certifications and industry-recognized credentials in Cloud Architecture,
            Machine Learning Engineering, and Data Science across AWS, IABAC, NASSCOM, and Microsoft.
          </p>
        </div>

        {/* Interactive 3D certifications view with filters and lightbox */}
        <CertificationsView />
      </div>
    </section>
  );
}
