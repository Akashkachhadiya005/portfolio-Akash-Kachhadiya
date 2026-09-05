"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

/**
 * LogoShell - AK logo container with theme-switch burst animation.
 *
 * On every dark/light transition, eight signal traces shoot outward from the
 * logo center (like circuit-board traces radiating from the mark), followed by
 * an expanding ring and a brief container glow.
 *
 * Incoming palette governs colors:
 *   dark mode  -> cyan #0FA4AF + deep teal
 *   light mode -> soft sky #AFDDE5 + pale teal
 *
 * All animation is CSS keyframes triggered by a data-attribute set in JS.
 * The JS only watches for a class change on <html> via MutationObserver.
 * Transform + opacity only: pure compositor properties, zero layout.
 */

const BURST_MS = 700;

export function LogoShell() {
  const shellRef = useRef<HTMLSpanElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    const fire = () => {
      const shell = shellRef.current;
      if (!shell) return;

      const incoming = root.classList.contains("dark") ? "dark" : "light";

      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        shell.removeAttribute("data-burst");
      }

      void shell.offsetWidth;

      shell.dataset.burst = incoming;

      timerRef.current = setTimeout(() => {
        shell.removeAttribute("data-burst");
        timerRef.current = null;
      }, BURST_MS);
    };

    const observer = new MutationObserver(fire);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });

    return () => {
      observer.disconnect();
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <span ref={shellRef} className="logo-shell" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <span
          key={i}
          className="logo-ray"
          style={{ "--ray-i": i } as React.CSSProperties}
          aria-hidden="true"
        />
      ))}
      <span className="logo-ring" aria-hidden="true" />
      <Image
        src="/images/ak-logo.png"
        alt="AK logo"
        width={64}
        height={64}
        className="logo-shell-img"
        priority
        loading="eager"
      />
    </span>
  );
}
