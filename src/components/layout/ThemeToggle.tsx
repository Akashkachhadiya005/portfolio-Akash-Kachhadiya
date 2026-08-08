"use client";

import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

/**
 * Swaps the theme inside a View Transition, so the browser crossfades a snapshot
 * on the compositor instead of repainting every element that the palette
 * variables touch. The reveal is a circle growing from the button that was
 * pressed, which is why the coordinates are pushed into CSS vars first.
 *
 * Falls back to a plain switch where View Transitions are unsupported.
 */
function switchTheme(apply: () => void, origin: HTMLElement) {
  const root = document.documentElement;

  const startViewTransition = (
    document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    }
  ).startViewTransition;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (typeof startViewTransition !== "function" || reduceMotion) {
    apply();
    return;
  }

  // Chromium can retain/corrupt a WebGL canvas in root View Transition
  // snapshots, producing the black contour frame seen during dark -> light.
  // Switch the real canvas directly and use one cheap opacity pulse instead.
  if (document.querySelector('.aurora[data-mode="live"]')) {
    apply();
    root.animate([{ opacity: 0.94 }, { opacity: 1 }], {
      duration: 180,
      easing: "ease-out",
    });
    return;
  }

  const r = origin.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  // Radius that still covers the furthest corner from this origin
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.style.setProperty("--tx", `${x}px`);
  root.style.setProperty("--ty", `${y}px`);
  root.style.setProperty("--tr", `${Math.ceil(radius)}px`);
  root.dataset.themeReveal = "1";

  const transition = startViewTransition.call(document, apply);
  transition.finished.finally(() => {
    delete root.dataset.themeReveal;
  });
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

  if (!mounted) {
    // Reserve the exact footprint so the bar does not shift on hydration
    // Matches the rendered pill exactly (3 x 1.75rem + 6px padding + 2px
    // border), so the bar does not shift when hydration swaps this out.
    return <div className="h-9 w-[5.75rem]" aria-hidden />;
  }

  const activeIndex = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === theme),
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
        <span key={theme ?? "system"} className="theme-pill-pulse" />
      </span>

      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onClick={(e) => switchTheme(() => setTheme(value), e.currentTarget)}
          aria-label={label}
          aria-pressed={theme === value}
          className={cn("theme-pill-seg", theme === value && "theme-pill-seg-on")}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
