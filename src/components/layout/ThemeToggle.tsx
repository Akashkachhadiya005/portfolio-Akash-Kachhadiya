"use client";

import { useState, useRef } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

const IRIS_FLIP_AT_MS = 320;
const IRIS_LIFETIME_MS = 840;

function resolveTarget(value: string): "dark" | "light" {
  if (value === "dark" || value === "light") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

/**
 * Theme-switch: circular clip-path reveal from the pressed icon.
 *
 * The origin is captured on pointerdown -- the first event that fires on any
 * pointing device (mouse, touch, stylus). currentTarget is always the <button>
 * (not the SVG child) because React normalises this. The coordinates are stored
 * as plain numbers so no element reference crosses the async transition boundary.
 *
 * The new snapshot clips in via a single JS Web Animations call. The old
 * snapshot sits still below it (animation:none in CSS). No fading, no flash.
 */
function switchTheme(apply: () => void, ox: number, oy: number) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }

  if (!("startViewTransition" in document)) {
    apply();
    return;
  }

  const endRadius = Math.hypot(
    Math.max(ox, window.innerWidth - ox),
    Math.max(oy, window.innerHeight - oy),
  );

  const doc = document as unknown as {
    startViewTransition: (cb: () => void) => { ready: Promise<void> };
  };

  const transition = doc.startViewTransition(apply);

  transition.ready.then(() => {
    document.documentElement.animate(
      {
        clipPath: [
          `circle(0px at ${ox}px ${oy}px)`,
          `circle(${endRadius}px at ${ox}px ${oy}px)`,
        ],
      },
      {
        duration: 500,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "both",
        pseudoElement: "::view-transition-new(root)",
      },
    );
  });
}

const OPTIONS = [
  { value: "light", icon: Sun, label: "Light mode" },
  { value: "dark", icon: Moon, label: "Dark mode" },
  { value: "system", icon: Monitor, label: "System mode" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useMounted();
  const [pending, setPending] = useState<string | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);

  if (!mounted) {
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
      <span className="theme-pill-thumb" aria-hidden="true">
        <span key={selected ?? "system"} className="theme-pill-pulse" />
      </span>

      {OPTIONS.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          type="button"
          onPointerDown={(e) => {
            // e.currentTarget is always the <button> (React normalises this).
            // Capture the centre before any async work so the coord is exact.
            const r = e.currentTarget.getBoundingClientRect();
            originRef.current = {
              x: r.left + r.width / 2,
              y: r.top + r.height / 2,
            };
          }}
          onClick={() => {
            const o = originRef.current;
            originRef.current = null;

            let ox: number;
            let oy: number;

            if (o) {
              ox = o.x;
              oy = o.y;
            } else {
              // Keyboard activation: use the pill centre
              const pill = document.querySelector<HTMLElement>(".theme-pill");
              if (pill) {
                const r = pill.getBoundingClientRect();
                ox = r.left + r.width / 2;
                oy = r.top + r.height / 2;
              } else {
                ox = window.innerWidth - 60;
                oy = 32;
              }
            }

            setPending(value);
            switchTheme(() => setTheme(value), ox, oy);
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
