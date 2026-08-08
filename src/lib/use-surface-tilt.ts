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

function writePointer(el: HTMLElement, clientX: number, clientY: number) {
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  const fx = (clientX - r.left) / r.width;
  const fy = (clientY - r.top) / r.height;
  el.style.setProperty("--px", `${(fx * 100).toFixed(1)}%`);
  el.style.setProperty("--py", `${(fy * 100).toFixed(1)}%`);
  return { fx, fy };
}

export function useSurfaceTilt<T extends HTMLElement>({
  maxTiltDeg = 9,
  settleMs = 420,
  ripple = false,
}: Options = {}) {
  const ref = useRef<T | null>(null);
  const rippleKey = useRef(0);
  const settleTimer = useRef(0);

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const p = writePointer(el, e.clientX, e.clientY);
      if (!p) return;
      // -1..1 measured from the centre of the face
      el.style.setProperty("--ry", `${((p.fx - 0.5) * 2 * maxTiltDeg).toFixed(2)}deg`);
      el.style.setProperty("--rx", `${(-(p.fy - 0.5) * 2 * maxTiltDeg).toFixed(2)}deg`);
    },
    [maxTiltDeg],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
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
      writePointer(el, e.clientX, e.clientY);
      if (!ripple) return;
      // Flipping the value restarts the keyframe without touching the DOM tree.
      rippleKey.current = rippleKey.current === 1 ? 2 : 1;
      el.dataset.ripple = String(rippleKey.current);
    },
    [ripple],
  );

  // Deliberately a separate callback rather than a field on the returned props
  // object: reading `props.ref` back out in JSX counts as touching a ref during
  // render, which the React Compiler rules reject.
  const setRef = useCallback((node: T | null) => {
    ref.current = node;
  }, []);

  return {
    setRef,
    tiltProps: { onPointerMove, onPointerLeave, onPointerDown },
  };
}
