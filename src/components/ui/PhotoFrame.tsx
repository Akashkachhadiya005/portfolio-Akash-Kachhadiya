"use client";

import Image from "next/image";
import { useCallback, useRef } from "react";

/**
 * Portrait in a frame that responds to the cursor.
 *
 * Same principle as Button3D, tuned for a large surface:
 *  - the frame tilts in perspective toward the pointer
 *  - a sheet-of-glass highlight sweeps across, tracking the pointer
 *  - the photo sits deeper in Z than the frame edge, so the mount has real
 *    thickness and the portrait parallaxes inside it
 *  - a soft accent bloom sits behind the frame and drifts with the tilt
 *
 * The pointer handler writes CSS custom properties only, so all of this stays
 * on the compositor: no layout, no paint, no React state, no re-render.
 *
 * `object-contain` is deliberate. The source is 1200x1600; cropping it square
 * cut the head off, so the frame carries the 3:4 ratio and the whole photo shows.
 */

const MAX_TILT_DEG = 7;

export function PhotoFrame() {
  const ref = useRef<HTMLDivElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const frameRef = useRef<number | null>(null);

  const applyPointer = useCallback(() => {
    frameRef.current = null;
    const el = ref.current;
    const r = rectRef.current;
    if (!el || !r) return;
    const { x, y } = pointerRef.current;
    const nx = (x - r.left) / r.width - 0.5;
    const ny = (y - r.top) / r.height - 0.5;
    el.style.setProperty("--ry", `${(nx * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
    el.style.setProperty("--rx", `${(-ny * 2 * MAX_TILT_DEG).toFixed(2)}deg`);
    el.style.setProperty("--px", `${(((x - r.left) / r.width) * 100).toFixed(1)}%`);
    el.style.setProperty("--py", `${(((y - r.top) / r.height) * 100).toFixed(1)}%`);
  }, []);

  const onPointerEnter = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    rectRef.current = e.currentTarget.getBoundingClientRect();
  }, []);

  /* Touch never fires pointerenter before the first move, and a tap that does not
   * move fires no pointermove at all — which is why the frame did nothing on a
   * phone. Measuring and writing the pointer on pointerdown makes a plain tap
   * tilt the frame exactly like a hover does on a laptop. */
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      rectRef.current = e.currentTarget.getBoundingClientRect();
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      applyPointer();
    },
    [applyPointer],
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      pointerRef.current.x = e.clientX;
      pointerRef.current.y = e.clientY;
      rectRef.current ??= e.currentTarget.getBoundingClientRect();
      if (frameRef.current === null) {
        frameRef.current = requestAnimationFrame(applyPointer);
      }
    },
    [applyPointer],
  );

  const onPointerLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    rectRef.current = null;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
    el.dataset.settling = "1";
    window.setTimeout(() => {
      if (el.dataset.settling === "1") delete el.dataset.settling;
    }, 500);
  }, []);

  const setRef = useCallback((node: HTMLDivElement | null) => {
    ref.current = node;
  }, []);

  return (
    <div className="photo-frame-wrap self-center lg:self-stretch">
      <div
        ref={setRef}
        onPointerEnter={onPointerEnter}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerLeave}
        onPointerCancel={onPointerLeave}
        onPointerLeave={onPointerLeave}
        className="photo-frame"
      >
        <div className="photo-frame-inner">
          <Image
            src="/images/akash.jpg"
            alt="Akash Kachhadiya"
            width={1200}
            height={1600}
            sizes="(max-width: 1024px) 280px, 380px"
            priority={false}
            className="photo-frame-img"
          />
        </div>
        <span className="photo-frame-sheen" aria-hidden="true" />
        <span className="photo-frame-rim" aria-hidden="true" />
      </div>
    </div>
  );
}
