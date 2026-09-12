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

/**
 * Extract the best available (x, y) origin from any pointer/click event.
 * Priority: pointerdown coords > click native event > button getBCR centre.
 * This covers every scenario: mouse, touch, stylus, first load, any device.
 */
function getOrigin(
  stored: { x: number; y: number } | null,
  clickEvent: React.MouseEvent<HTMLButtonElement>,
): { x: number; y: number } {
  // 1. Best: stored from onPointerDown (fires before onClick on all devices)
  if (stored && (stored.x !== 0 || stored.y !== 0)) {
    return stored;
  }

  // 2. Fallback: nativeEvent from the click itself
  //    MouseEvent always has clientX/Y. TouchEvent (via click synthesis) does too.
  const ev = clickEvent.nativeEvent;
  if (ev.clientX !== 0 || ev.clientY !== 0) {
    return { x: ev.clientX, y: ev.clientY };
  }

  // 3. Last resort for keyboard activation: button bounding rect centre
  const btn = clickEvent.currentTarget;
  const r = btn.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
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
            originRef.current = { x: e.clientX, y: e.clientY };
          }}
          onClick={(e) => {
            const { x: ox, y: oy } = getOrigin(originRef.current, e);
            originRef.current = null;
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
