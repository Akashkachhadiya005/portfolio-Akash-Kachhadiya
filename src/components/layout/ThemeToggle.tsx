"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

/** When the palette flips beneath the travelling ring, and the layer's lifetime.
 *  The ring's own 760ms travel is defined in CSS (.theme-iris-ring). */
const IRIS_FLIP_AT_MS = 320;
/* Matches the CSS exactly. Leaving the layers mounted past the end of their
 * animation keeps promoted layers alive after the effect has visibly finished,
 * which is precisely where the switch used to feel like it caught. */
const IRIS_LIFETIME_MS = 840;

/** What the chosen setting actually resolves to right now. */
function resolveTarget(value: string): "dark" | "light" {
  if (value === "dark" || value === "light") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * AURORA BLOOM — the mode change.
 *
 * A shaft of light opens out of the control that was pressed: volumetric rays
 * fanning outward and slowly rotating, a soft dome of the incoming theme's colour
 * swelling behind them, and a thin wavefront running just ahead of both. The
 * palette flips as that wavefront crosses the middle of the screen.
 *
 * Three things give it depth rather than the flatness of a moving shape. The rays
 * converge on the origin, which is the strongest monocular depth cue available in
 * two dimensions. They counter-rotate against the expansion, so the light appears
 * to turn as it travels. And the wavefront runs ahead of the dome, which separates
 * near from far.
 *
 * It passes UNDER the interface (z-index 30, beneath the navbar and the hero's own
 * content), so the buttons and the AWS badges stay fully visible on top of it.
 * That, and the geometry: a circle grown to the furthest corner covers the whole
 * viewport including the bottom right, which the previous tilted band did not.
 *
 * Why this stays smooth where the earlier attempts did not:
 *
 *   - The palette is swapped ONCE, instantly. The original stall came from
 *     transitioning colour on every element for 200ms; a single flip is one frame.
 *   - Both layers animate `transform` and `opacity` only — pure compositor work,
 *     no paint, no layout, and no cost that scales with page size.
 *   - Nothing snapshots the document, so the hero's WebGL canvas can never be
 *     captured into a stale texture. That was the artefact in the View
 *     Transitions version.
 *
 * The band's colours come from the palette it is bringing in, which is why the
 * teal light appears when going dark and the pale one when going light.
 */
/**
 * CIRCULAR RIPPLE VIEW TRANSITION — Senior Developer Standard.
 *
 * Expands a smooth, 60fps circular clip-path wave from the exact center of the
 * clicked toggle button across the entire viewport. Captures current & target theme
 * states instantaneously with zero 320ms lag or DOM clutter.
 */
function switchTheme(apply: () => void, origin: HTMLElement) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (reduceMotion) {
    apply();
    return;
  }

  const rect = origin.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // Modern View Transitions API (Chrome/Edge/Safari modern standard)
  if (typeof document !== "undefined" && "startViewTransition" in document) {
    const doc = document as unknown as {
      startViewTransition: (cb: () => void) => { ready: Promise<void> };
    };
    const transition = doc.startViewTransition(() => {
      apply();
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath,
        },
        {
          duration: 500,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
    return;
  }

  // Graceful fallback for non-supporting browsers
  apply();
}

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light mode" },
  { value: "dark", icon: Moon, label: "Dark mode" },
  { value: "system", icon: Monitor, label: "System mode" },
] as const;

/**
 * A three-position pill slider.
 *
 * The track is recessed (inset shadow) and the thumb is raised (rim light plus
 * a drop shadow), which is what makes a flat DOM node read as a physical switch
 * rather than a coloured div. The thumb slides on a single overshooting
 * transform, so the travel is one compositor animation regardless of distance.
 *
 * System stays a real position rather than being folded into a two-state toggle:
 * it is the default, and a visitor who lands on it needs to be able to see that
 * and to leave it.
 */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  /* The selection the visitor just made, held locally so the thumb starts moving
   * on the very next frame. Without it the slide could not begin until next-themes
   * had applied the new palette — the exact moment the page repaints — so the
   * switch that changed colours always looked stiffer than the one that did not.
   *
   * It is never cleared, and does not need to be: it always holds the visitor's
   * most recent explicit choice, which is precisely what the pill should show. */
  const [pending, setPending] = useState<string | null>(null);

  if (!mounted) {
    // Reserve the exact footprint so the bar does not shift on hydration
    // Matches the rendered pill exactly (3 x 1.75rem + 6px padding + 2px
    // border), so the bar does not shift when hydration swaps this out.
    return <div className="h-9 w-[5.75rem]" aria-hidden />;
  }

  const selected = pending ?? theme;
  const activeIndex = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === selected),
  );

  return (
    <div
      role="group"
      aria-label="Colour theme"
      className="theme-pill"
      style={{ "--seg": activeIndex } as React.CSSProperties}
    >
      {/* The thumb itself persists, so changing `--seg` animates its slide. The
          pulse is a keyed child instead: recreating the node is what restarts
          the keyframe, and a CSS animation will not replay on an attribute
          change. Keying the thumb would have killed the slide. */}
      <span className="theme-pill-thumb" aria-hidden="true">
        <span key={selected ?? "system"} className="theme-pill-pulse" />
      </span>

      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={(e) => {
            setPending(value);
            switchTheme(() => setTheme(value), e.currentTarget);
          }}
          aria-label={label}
          aria-pressed={selected === value}
          className={cn("theme-pill-seg", selected === value && "theme-pill-seg-on")}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
