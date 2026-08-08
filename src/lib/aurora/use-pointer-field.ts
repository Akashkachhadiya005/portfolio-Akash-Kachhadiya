"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * An eased, normalised pointer vector, delivered by callback.
 *
 * Extends the pattern already established by `src/lib/use-surface-tilt.ts` rather
 * than inventing a third pointer hook. Two ideas carry over directly:
 *
 *   - a `setHost` CALLBACK for the node, so JSX never reads a ref back out.
 *     Reading a ref during render is what `react-hooks/refs` rejects, and
 *     `useSurfaceTilt` returns `setRef` for exactly this reason.
 *   - no React state anywhere on the pointer path, so a pointer move costs no
 *     re-render.
 *
 * The one difference is the sink: the eased value goes to a GL uniform instead of
 * a CSS custom property, so this takes an `onChange` callback.
 *
 * The easing is the point, not an optimisation. The reference document is
 * explicit that the background must never chase the cursor — it should feel
 * delayed, and settle smoothly when the cursor stops. At 0.045 per frame the
 * value reaches its target in roughly half a second.
 */

export interface PointerFieldOptions {
  /** Per-frame approach fraction. Lower is heavier. */
  ease?: number;
  /** Whether the caller wants pointer tracking at all. The hover capability
   *  check happens inside the effect, so no capability ever has to travel
   *  through React state. */
  enabled: boolean;
  /** Called on frames where the eased value actually moved. */
  onChange: (x: number, y: number) => void;
}

export function usePointerField({
  ease = 0.045,
  enabled,
  onChange,
}: PointerFieldOptions) {
  const hostRef = useRef<HTMLElement | null>(null);
  // Kept in a ref so the effect does not tear down and rebuild its listeners
  // every time the parent re-creates the callback.
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !enabled) return;

    // Touch devices have no cursor, so the reference document says to skip the
    // interaction rather than wire listeners that can only fire mid-scroll.
    // Probed here, inside the effect, so it never needs to be React state.
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Cached, so the pointer path never forces a layout read.
    const box = { left: 0, top: 0, width: 1, height: 1 };
    const measure = () => {
      const r = host.getBoundingClientRect();
      box.left = r.left;
      box.top = r.top;
      box.width = r.width || 1;
      box.height = r.height || 1;
    };
    measure();

    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;
    let raf = 0;
    let running = false;

    const tick = () => {
      currentX += (targetX - currentX) * ease;
      currentY += (targetY - currentY) * ease;
      onChangeRef.current(currentX, currentY);

      // Stop once it has effectively settled, so an idle page runs no frames on
      // this path at all.
      if (Math.abs(targetX - currentX) > 0.002 || Math.abs(targetY - currentY) > 0.002) {
        raf = requestAnimationFrame(tick);
      } else {
        running = false;
      }
    };

    const start = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    // Listening on the window, not the host: the host is `pointer-events: none`
    // and sits behind the hero copy, so it would never see a move over the
    // headline itself.
    const onMove = (e: PointerEvent) => {
      const nx = (e.clientX - box.left) / box.width - 0.5;
      const ny = (e.clientY - box.top) / box.height - 0.5;
      targetX = Math.max(-1, Math.min(1, nx * 2));
      targetY = Math.max(-1, Math.min(1, ny * 2));
      start();
    };

    // Cursor gone: drift back to rest rather than freezing mid-lean.
    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      start();
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onMove, { passive: true });
    window.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointercancel", onLeave);
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointercancel", onLeave);
      window.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
      cancelAnimationFrame(raf);
    };
  }, [enabled, ease]);

  const setHost = useCallback((node: HTMLElement | null) => {
    hostRef.current = node;
  }, []);

  return { setHost };
}
