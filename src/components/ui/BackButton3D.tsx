"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button3D } from "@/components/ui/Button3D";

interface BackButton3DProps {
  label?: string;
  fallbackHref?: string;
  className?: string;
}

/**
 * Universal 3D Soap "Back" Button.
 *
 * Dynamically navigates back to the user's previous page in history
 * (e.g. from Project Detail back to Home or back to Projects catalog),
 * with a fallback destination if opened directly.
 */
export function BackButton3D({
  label = "Back",
  fallbackHref = "/",
  className = "h-9 px-4 text-xs font-semibold",
}: BackButton3DProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      const hasInternalReferrer =
        document.referrer && document.referrer.startsWith(window.location.origin);
      if (hasInternalReferrer || window.history.length > 1) {
        router.back();
        return;
      }
    }
    router.push(fallbackHref);
  };

  return (
    <Button3D
      type="button"
      onClick={handleBack}
      className={className}
      aria-label={label}
      title={label}
    >
      <ArrowLeft className="h-4 w-4 shrink-0 transition-transform group-hover:-translate-x-0.5" />
      <span>{label}</span>
    </Button3D>
  );
}
