"use client";

import { useEffect, useRef } from "react";
import { Home } from "lucide-react";

/**
 * Floating "back to top" control, centred at the bottom of the viewport.
 *
 * Appears once the page has been scrolled past roughly one screen, and hides
 * again near the top so it never covers the hero it would return you to.
 *
 * Visibility is written straight to a data attribute rather than React state.
 * A scroll handler that calls setState re-renders on every scroll event; this
 * one only touches the DOM when the answer actually flips, and the transition
 * itself is CSS. The listener is passive so it cannot delay scrolling.
 */
export function HomeFab() {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let visible = false;
    let queued = false;

    const evaluate = () => {
      queued = false;
      const next = window.scrollY > window.innerHeight * 0.75;
      if (next === visible) return;
      visible = next;
      if (next) el.dataset.visible = "1";
      else delete el.dataset.visible;
    };

    // Coalesce bursts of scroll events into one check per frame
    const onScroll = () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(evaluate);
    };

    evaluate();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const goHome = () => {
    // `smooth` unless the visitor asked for less motion
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      ref={ref}
      type="button"
      onClick={goHome}
      aria-label="Back to top"
      className="home-fab"
    >
      <Home className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
