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
  const releaseTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pressStartTimeRef = useRef<number>(0);

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
      if (next) {
        el.dataset.visible = "1";
      } else {
        delete el.dataset.visible;
        delete el.dataset.pressed;
        delete el.dataset.hovered;
      }
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
      if (releaseTimerRef.current) {
        clearTimeout(releaseTimerRef.current);
      }
    };
  }, []);

  const setPressed = (pressed: boolean) => {
    const el = ref.current;
    if (!el) return;

    if (releaseTimerRef.current) {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = null;
    }

    if (pressed) {
      pressStartTimeRef.current = Date.now();
      el.dataset.pressed = "1";
      el.dataset.hovered = "1";
    } else {
      // Ensure that even quick taps get at least 320ms of visible, buttery rotation
      const elapsed = Date.now() - pressStartTimeRef.current;
      const remaining = Math.max(0, 320 - elapsed);
      if (remaining > 0) {
        releaseTimerRef.current = setTimeout(() => {
          if (ref.current) {
            delete ref.current.dataset.pressed;
            delete ref.current.dataset.hovered;
          }
        }, remaining);
      } else {
        delete el.dataset.pressed;
        delete el.dataset.hovered;
      }
    }
  };

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
      onPointerDown={(e) => {
        setPressed(true);
        if (e.pointerType !== "mouse") {
          // Prevent mobile long-press menus from interrupting the touch
          e.currentTarget.style.userSelect = "none";
        }
      }}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse" && ref.current) {
          ref.current.dataset.hovered = "1";
        }
      }}
      onPointerLeave={(e) => {
        if (ref.current) {
          delete ref.current.dataset.hovered;
          delete ref.current.dataset.pressed;
        }
      }}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      onTouchCancel={() => setPressed(false)}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Back to top"
      className="home-fab"
    >
      <Home className="h-6 w-6" aria-hidden="true" />
    </button>
  );
}
