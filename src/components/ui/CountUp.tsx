"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Rolls a number up to its value the first time it scrolls into view, like a
 * fuel pump counting.
 *
 * Takes the display string ("3", "4+", "12k") rather than a number, so any
 * prefix or suffix in the data survives untouched — only the digits animate.
 *
 * Driven by requestAnimationFrame against the clock rather than a per-frame
 * decrement, so the duration is identical on a 60Hz and a 144Hz display.
 */
export function CountUp({
  value,
  durationMs = 1100,
  className,
}: {
  value: string;
  durationMs?: number;
  className?: string;
}) {
  // Parsed into PRIMITIVES.
  //
  // This used to keep the RegExp match array itself and list it as an effect
  // dependency. A match array is a fresh object on every render, so the effect
  // tore down and re-ran constantly — each teardown cancelled the in-flight
  // requestAnimationFrame while the `started` guard blocked a restart, and the
  // counter sat frozen on 0. Primitives are stable across renders.
  const { prefix, target, suffix, decimals, isNumeric } = useMemo(() => {
    const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
    if (!m) {
      return { prefix: "", target: 0, suffix: "", decimals: 0, isNumeric: false };
    }
    const digits = m[2];
    return {
      prefix: m[1],
      target: Number(digits),
      suffix: m[3],
      decimals: digits.includes(".") ? digits.split(".")[1].length : 0,
      isNumeric: true,
    };
  }, [value]);

  const [shown, setShown] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!isNumeric) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const run = () => {
      const t0 = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / durationMs);
        // Ease-out cubic: quick start, settles onto the final digit
        setShown(target * (1 - Math.pow(1 - p, 3)));
        if (p < 1) raf = requestAnimationFrame(tick);
        else setShown(target);
      };
      raf = requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting || started.current) continue;
          started.current = true;
          // Resolved here rather than in the effect body: a synchronous
          // setState during an effect triggers cascading renders.
          if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            setShown(target);
          } else {
            run();
          }
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);

    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [isNumeric, target, durationMs]);

  return (
    <span ref={ref} className={className}>
      {isNumeric ? `${prefix}${shown.toFixed(decimals)}${suffix}` : value}
    </span>
  );
}
