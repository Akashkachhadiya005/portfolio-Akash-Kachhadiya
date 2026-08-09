"use client";

import { useCallback, useRef } from "react";

/**
 * Turns any element into a pointer-lit 3D surface.
 *
 * Writes four CSS custom properties on the host element and nothing else:
 *
 *   --rx / --ry   perspective tilt, in degrees, toward the cursor
 *   --px / --py   cursor position as a percentage, for specular gradients
 *
 * Everything visual reads those vars from CSS, so a pointer move costs a
 * compositor transform and a gradient position — no layout, no React state, no
 * re-render. Custom properties inherit, so a child (a badge plate, a label) can
 * read the same values without its own listener.
 *
 * `data-settling="1"` is set on pointer-leave for the length of the ease-back,
 * letting CSS swap the fast tracking transition for a longer spring so the
 * surface relaxes to flat instead of snapping.
 */

type Options = {
  /** Peak rotation at the edge of the surface. */
  maxTiltDeg?: number;
  /** Must match the ease-back duration in CSS for `[data-settling]`. */
  settleMs?: number;
  /** Restart a press ripple keyframe from the exact point that was hit. */
  ripple?: boolean;
};

type Rect = { left: number; top: number; width: number; height: number };

export function useSurfaceTilt<T extends HTMLElement>({
  maxTiltDeg = 9,
  settleMs = 420,
  ripple = false,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const rippleKey = useRef(0);
  const settleTimer = useRef(0);
  // Measured once when the pointer arrives, not on every move.
  const rectRef = useRef<Rect | null>(null);
  const posRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  /** The only place these four custom properties are written. Runs at most once
   *  per animation frame, inside the frame, so a burst of pointer events cannot
   *  turn into a burst of style writes. */
  const flush = useCallback(() => {
    rafRef.current = null;
    const el = ref.current;
    const r = rectRef.current;
    if (!el || !r || r.width === 0 || r.height === 0) return;
    const fx = (posRef.current.x - r.left) / r.width;
    const fy = (posRef.current.y - r.top) / r.height;
    el.style.setProperty("--px", `${(fx * 100).toFixed(1)}%`);
    el.style.setProperty("--py", `${(fy * 100).toFixed(1)}%`);
    el.style.setProperty("--ry", `${((fx - 0.5) * 2 * maxTiltDeg).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-(fy - 0.5) * 2 * maxTiltDeg).toFixed(2)}deg`);
  }, [maxTiltDeg]);

  const measure = useCallback((el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height };
  }, []);

  const schedule = useCallback(
    (clientX: number, clientY: number) => {
      posRef.current.x = clientX;
      posRef.current.y = clientY;
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(flush);
    },
    [flush],
  );

  /* THE MEASUREMENT MOVED OUT OF THE MOVE HANDLER.
   *
   * This used to call getBoundingClientRect() on every pointermove. That forces a
   * synchronous layout, and pointermove fires far more often than once a frame —
   * so a cursor crossing a button was asking the browser to lay out the document
   * dozens of times per second, on every button and badge on the page at once.
   * That is what made the interface feel like it was catching rather than
   * tracking, and it is explicitly called out in the project's effects
   * conventions.
   *
   * The rect is now read once when the pointer arrives, and the style writes are
   * coalesced into one per frame. */
  const onPointerEnter = useCallback(
    (e: React.PointerEvent) => {
      measure(e.currentTarget as HTMLElement);
      schedule(e.clientX, e.clientY);
    },
    [measure, schedule],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!rectRef.current) measure(e.currentTarget as HTMLElement);
      schedule(e.clientX, e.clientY);
    },
    [measure, schedule],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    rectRef.current = null;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.dataset.settling = "1";
    window.clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      if (el.dataset.settling === "1") delete el.dataset.settling;
    }, settleMs);
  }, [settleMs]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      // Touch fires no enter and, on a stationary tap, no move either — so this
      // is where a finger gets the same response a cursor gets.
      measure(e.currentTarget as HTMLElement);
      schedule(e.clientX, e.clientY);
      if (!ripple) return;
      // Flipping the value restarts the keyframe without touching the DOM tree.
      rippleKey.current = rippleKey.current === 1 ? 2 : 1;
      el.dataset.ripple = String(rippleKey.current);
    },
    [ripple, measure, schedule],
  );

  // Deliberately a separate callback rather than a field on the returned props
  // object: reading `props.ref` back out in JSX counts as touching a ref during
  // render, which the React Compiler rules reject.
  const setRef = useCallback((node: T | null) => {
    ref.current = node;
  }, []);

  return {
    setRef,
    tiltProps: {
      onPointerEnter,
      onPointerMove,
      onPointerLeave,
      onPointerDown,
      onPointerUp: onPointerLeave,
      onPointerCancel: onPointerLeave,
    },
  };
}
