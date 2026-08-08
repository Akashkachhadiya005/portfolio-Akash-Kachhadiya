"use client";

import { useCallback, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { detectCapabilities, deriveSettings } from "@/lib/aurora/capabilities";
import { createAuroraRenderer, type AuroraRenderer } from "@/lib/aurora/renderer";
import { usePointerField } from "@/lib/aurora/use-pointer-field";
import { PALETTE, hexToLinear, type LinearRGB } from "@/lib/aurora/field-config";

/**
 * AURORA — the hero background.
 *
 * Long, smoothly curved ribbons of light that fold over one another on a
 * near-black base, with bright thin cores, soft perpendicular falloff, and wide
 * dark negative space between them. Cyan dominates, deep teal sits underneath,
 * and a single muted burnt-orange region provides the one warm accent.
 *
 * The field itself is a WebGL fragment shader; see `shader.ts` for why level-set
 * extraction is the mechanism and why blurred CSS blobs provably cannot produce
 * this pattern.
 *
 * WHERE MUTABLE STATE LIVES, and why it lives there. The React Compiler rules in
 * this project are strict, so this is deliberate rather than incidental:
 *
 *   - Nothing is created in `useMemo`. `react-hooks/immutability` forbids
 *     mutating a value returned from a hook, which would rule out the GL objects
 *     and typed arrays the renderer needs. They are plain locals inside the
 *     renderer module instead.
 *   - Refs are only ever read inside effects. `react-hooks/refs` forbids ref
 *     access during render, which is why the host uses a callback ref and why
 *     `usePointerField` hands back `setHost` rather than a ref object.
 *   - Capabilities never enter React state, so there is no setState in an effect
 *     body for `react-hooks/set-state-in-effect` to reject. The resolved mode is
 *     written to `data-mode` on the host, which also keeps the static fallback a
 *     pure CSS concern.
 */

interface AuroraWindow extends Window {
  __aurora?: {
    freeze: (seconds: number) => void;
    resume: () => void;
  };
}

export interface AuroraBackgroundProps {
  className?: string;
  /** Multiplier on veil intensity, for reuse outside the hero. */
  intensity?: number;
}

/** Reads the active theme background token in both modes. */
function resolveBase(isDark: boolean): LinearRGB {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--background")
    .trim();
  const fallback = isDark ? PALETTE.baseDark : PALETTE.baseLightFallback;
  return /^#[0-9a-f]{6}$/i.test(raw) ? hexToLinear(raw) : fallback;
}

export function AuroraBackground({ className, intensity = 1 }: AuroraBackgroundProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rendererRef = useRef<AuroraRenderer | null>(null);

  const onPointer = useCallback((x: number, y: number) => {
    rendererRef.current?.setPointer(x, y);
  }, []);

  const { setHost: setPointerHost } = usePointerField({
    enabled: true,
    onChange: onPointer,
  });

  // One callback ref feeding both the local ref and the pointer hook, so the
  // element is never read back out of a ref during render.
  const setHost = useCallback(
    (node: HTMLDivElement | null) => {
      hostRef.current = node;
      setPointerHost(node);
    },
    [setPointerHost],
  );

  // ---- mount: probe, build, observe
  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    const caps = detectCapabilities();
    const settings = deriveSettings(caps);

    // Reduced motion and no-WebGL land on the same static path. Neither is an
    // error; both are legitimate renderings of the same design.
    if (settings.mode === "static") {
      host.dataset.mode = "static";
      return;
    }

    const isDarkNow = document.documentElement.classList.contains("dark");
    const renderer = createAuroraRenderer({
      canvas,
      isDark: isDarkNow,
      baseLinear: resolveBase(isDarkNow),
      intensity,
      resolutionScale: settings.resolutionScale,
      frameCap: settings.frameCap,
      octaves: settings.octaves,
    });

    // Context creation or shader compilation can still fail late on odd drivers.
    if (!renderer) {
      host.dataset.mode = "static";
      return;
    }

    rendererRef.current = renderer;
    host.dataset.mode = "live";

    // ResizeObserver rather than a resize listener: the hero's height depends on
    // dvh and on the mobile URL bar, which changes without a window resize event.
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const r = entry.contentRect;
        renderer.resize(r.width, r.height);
      }
    });
    ro.observe(host);
    renderer.resize(host.clientWidth, host.clientHeight);
    renderer.start();

    // next-themes changes the root class inside the View Transition callback.
    // Observe that class directly so the canvas updates in the same transition
    // instead of showing one frame from the previous theme.
    const root = document.documentElement;
    const syncTheme = () => {
      const nextDark = root.classList.contains("dark");
      renderer.setTheme(nextDark, resolveBase(nextDark));
    };
    const themeObserver = new MutationObserver(syncTheme);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });

    const onVisibility = () => {
      if (document.hidden) renderer.stop();
      else renderer.start();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Losing the context is normal on mobile after a background/foreground cycle.
    // Fall back rather than showing a blank hero.
    const onLost = (e: Event) => {
      e.preventDefault();
      renderer.stop();
      host.dataset.mode = "static";
    };
    const onRestored = () => {
      host.dataset.mode = "live";
      renderer.start();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    // Test hook for the Playwright harness. A procedural animated field cannot be
    // compared across runs unless the clock can be pinned. Gated so it is not
    // attached on a normal production visit.
    const wantHook =
      process.env.NODE_ENV !== "production" ||
      window.location.search.includes("aurora-freeze");
    const w = window as AuroraWindow;
    if (wantHook) {
      w.__aurora = {
        freeze: (seconds: number) => {
          renderer.setFrozenTime(seconds);
        },
        resume: () => {
          renderer.setFrozenTime(null);
          renderer.start();
        },
      };
    }

    return () => {
      ro.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (w.__aurora) delete w.__aurora;
      rendererRef.current = null;
      renderer.dispose();
    };
  }, [intensity]);

  return (
    <div ref={setHost} className={cn("aurora", className)} aria-hidden="true">
      <canvas ref={canvasRef} className="aurora-canvas" />

      {/* Static stand-in for no-WebGL and reduced-motion. Same palette, same
          layer order, no GL and no animation — the CSS bends its banded
          gradients with the filter defined just below. */}
      <div className="aurora-fallback" />

      {/* The fallback's warp. Runs ONCE at paint, never animated: an animated
          full-viewport displacement filter is not viable, but a single static
          pass is exactly the case where it is affordable. */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <filter id="aurora-warp" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.006 0.011"
            numOctaves="3"
            seed="7"
            result="noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="180"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </svg>

      <span className="aurora-scrim" />
    </div>
  );
}
