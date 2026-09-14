"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";

/**
 * Aurora Iris Mode Change — Precision Physical Light Bloom
 *
 * When the visitor clicks Sun or Moon:
 * 1. An organic luminous ring & volumetric ray bloom opens out from the EXACT center of the clicked icon.
 * 2. It begins at transform: scale(0) (a tiny microscopic dot right at the icon button).
 * 3. It sweeps smoothly across the entire viewport using GPU-accelerated transforms (no layout, no paint).
 * 4. At 320ms (when the wavefront crosses mid-screen), the palette flips seamlessly.
 * 5. At 840ms, the transition layer is cleanly removed from the DOM.
 */
const IRIS_FLIP_AT_MS = 320;
const IRIS_LIFETIME_MS = 840;

function resolveTarget(value: string): "dark" | "light" {
  if (value === "dark" || value === "light") return value;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function switchTheme(apply: () => void, originEl: HTMLElement, value: string) {
  if (typeof window === "undefined" || typeof document === "undefined") {
    apply();
    return;
  }

  // If user prefers reduced motion, switch immediately without animation
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply();
    return;
  }

  // Remove any previous active iris transition if user clicks rapidly
  const existing = document.querySelector(".theme-iris");
  if (existing) existing.remove();

  // Measure the clicked icon button with exact sub-pixel precision
  const r = originEl.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;

  // Calculate radius needed to reach the furthest corner of the screen
  const radius =
    Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y)) + 24;

  const iris = document.createElement("div");
  iris.className = "theme-iris";
  iris.dataset.to = resolveTarget(value);
  iris.setAttribute("aria-hidden", "true");

  // Lock the origin to the exact center of the clicked button
  iris.style.setProperty("--ix", `${x}px`);
  iris.style.setProperty("--iy", `${y}px`);
  iris.style.setProperty("--is", `${(radius * 2) / 320}`);

  // Capture outgoing background for smooth palette settling
  const from = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  if (from) iris.style.setProperty("--iris-from", from);

  iris.innerHTML =
    '<span class="theme-iris-tint"></span>' +
    '<span class="theme-iris-rays"></span>' +
    '<span class="theme-iris-veil"></span>' +
    '<span class="theme-iris-ring"></span>';

  document.body.appendChild(iris);

  // Trigger animation on next frame so it animates from scale(0) tiny dot to full screen
  requestAnimationFrame(() => {
    iris.classList.add("theme-iris-run");
  });

  // Flip palette at the exact moment the wavefront is mid-screen
  window.setTimeout(apply, IRIS_FLIP_AT_MS);

  // Clean up layer when animation completes
  window.setTimeout(() => {
    iris.remove();
  }, IRIS_LIFETIME_MS);
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
          onClick={(e) => {
            if (value === selected) return;
            setPending(value);
            // Pass the exact clicked button element to anchor the tiny dot origin
            switchTheme(() => setTheme(value), e.currentTarget, value);
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
