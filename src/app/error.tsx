"use client";

import { Button3D } from "@/components/ui/Button3D";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-5xl font-bold text-accent">Oops</p>
      <h1 className="mt-4 text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        An unexpected error occurred. Please try again.
      </p>
      <Button3D onClick={reset} className="mt-8">
        Try Again
      </Button3D>
    </section>
  );
}
