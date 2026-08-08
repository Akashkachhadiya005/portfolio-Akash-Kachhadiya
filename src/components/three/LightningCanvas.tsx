"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * Photo-realistic lightning renderer (Canvas 2D, additive blending).
 *
 * ── WHY THIS CANVAS IS PORTALLED TO document.body ──────────────────────────
 * The 3D network's own wrapper needs `overflow-hidden` so the balls stay inside
 * the frame. That same clip also cut the bolts off at the frame edge. On top of
 * that, the skill cards beside the frame are `motion.div`s with a transform, so
 * they create their own stacking contexts and paint over anything z-indexed
 * *inside* the 3D wrapper.
 *
 * Rendering into `document.body` as a `position: fixed` full-viewport overlay
 * escapes all three problems at once — the clip, every ancestor stacking
 * context, and sibling paint order. The bolts can now arc out over the cards.
 * z-index 45 keeps them above page content but below the fixed navbar (z-50).
 *
 * ── TECHNIQUES (standard real-world VFX practice) ──────────────────────────
 *  1. Recursive MIDPOINT DISPLACEMENT — the classic fractal-lightning algorithm.
 *     Produces the natural jagged filaments a real bolt has.
 *  2. RECURSIVE BRANCHING — child bolts fork off the main channel, getting
 *     shorter and thinner (real leader / streamer behaviour).
 *  3. ADDITIVE BLENDING (`globalCompositeOperation = "lighter"`) — light sums
 *     where strokes overlap, which is how real HDR light behaves. This is what
 *     makes it read as *light* rather than a painted line.
 *  4. MULTI-PASS GLOW — the same path stroked 5x from wide+dim to thin+white-hot,
 *     reproducing the blown-out core and coloured halo of a real photograph.
 *  5. ATTACHMENT-POINT HOT SPOTS — a real arc burns brightest where it touches
 *     the conductor. A small radial flare sits at every bolt root so the
 *     discharge visibly *comes out of the surface*.
 *  6. ERRATIC STROBE TIMING — real strikes are bursts of 2-4 return strokes over
 *     ~60-120 ms, then a gap. Regenerating geometry per stroke gives the crackle.
 *  7. THEME-AWARE COLOUR RAMP — white-hot core falling through pale blue to
 *     blue-violet corona. On light backgrounds the ramp shifts to a saturated
 *     electric blue, because a screen cannot go brighter than white.
 *
 * No full-canvas vignette is drawn — dimming the whole area read as an ugly
 * grey box flashing behind the balls.
 *
 * ── DRIVING MODEL ─────────────────────────────────────────────────────────
 * This component owns no animation loop. The caller drives it once per frame
 * via the imperative handle, from *after* drei's <Html> has written the tile
 * transform. That is the only way the bolts can sit exactly on the painted
 * circumference with zero lag.
 */

type Point = { x: number; y: number };

export type LightningHandle = {
  /**
   * Draw one frame of lightning around the circle of `radius` px centred at
   * (cx, cy) in VIEWPORT coordinates — i.e. straight from getBoundingClientRect.
   *
   * Returns this frame's stroke intensity (0..1) so the caller can drive a
   * matching storm flash. Callers must NOT map this straight onto a large-area
   * brightness change: the strobe runs at ~20-45 Hz. See the envelope in
   * SkillNetwork's LightningSync.
   */
  draw: (cx: number, cy: number, radius: number, isDark: boolean) => number;
  /** Wipe the canvas and reset the strobe. Call once when the drag ends. */
  clear: () => void;
};

type LightningCanvasProps = {
  handleRef: React.RefObject<LightningHandle | null>;
};

/** Outer haze -> white-hot core. Night-sky lightning. */
const PASSES_DARK = [
  { width: 16, alpha: 0.06, color: "40, 70, 180" },
  { width: 10, alpha: 0.1, color: "60, 115, 235" },
  { width: 5.5, alpha: 0.2, color: "130, 190, 255" },
  { width: 2.6, alpha: 0.5, color: "215, 238, 255" },
  { width: 1.1, alpha: 1, color: "255, 255, 255" },
];

/** Daylight arc: saturated electric blue with a bright, not pure-white, core. */
const PASSES_LIGHT = [
  { width: 15, alpha: 0.1, color: "20, 40, 130" },
  { width: 9, alpha: 0.18, color: "25, 70, 190" },
  { width: 5, alpha: 0.32, color: "35, 105, 230" },
  { width: 2.4, alpha: 0.6, color: "90, 165, 255" },
  { width: 1, alpha: 0.95, color: "225, 245, 255" },
];

/** Recursive midpoint displacement — the core of a believable bolt shape. */
function displace(points: Point[], amount: number, detail: number): Point[] {
  if (detail <= 0) return points;
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    out.push(a);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len; // perpendicular unit vector
    const ny = dx / len;
    const offset = (Math.random() - 0.5) * amount;
    out.push({
      x: (a.x + b.x) / 2 + nx * offset,
      y: (a.y + b.y) / 2 + ny * offset,
    });
  }
  out.push(points[points.length - 1]);
  return displace(out, amount * 0.55, detail - 1); // fractal self-similarity
}

type Bolt = { points: Point[]; scale: number; depth: number };

/**
 * First glow pass a bolt is allowed to use, indexed by branch depth.
 *
 * Measured 224 strokes and 6.6 ms per frame when every bolt ran all five
 * passes — 40% of a 60fps budget spent on lightning alone, which is what made
 * the rest of the network stutter while a ball was held.
 *
 * The wide, dim passes exist to sell the corona of a THICK main channel. A
 * depth-2 twig is already thin and faint, so those passes cost fill-rate and
 * add nothing visible. Roots keep the full stack; forks start further in.
 */
const FIRST_PASS_BY_DEPTH = [0, 2, 3];

/**
 * Build one channel plus its recursive forks.
 *
 * `depth` counts DOWN (2 at the root). `tier` counts UP, so it can index the
 * pass table and the geometry detail directly.
 */
function buildBolt(
  startX: number,
  startY: number,
  angle: number,
  length: number,
  depth: number,
  scale: number,
  out: Bolt[],
  tier = 0,
): void {
  const points = displace(
    [
      { x: startX, y: startY },
      { x: startX + Math.cos(angle) * length, y: startY + Math.sin(angle) * length },
    ],
    length * 0.55,
    // 5 levels -> 33 points for a main channel. A twig a fifth of the length
    // does not read any differently at 17 or 9 points, so it does not pay for
    // them: this is per-point work in every glow pass that draws it.
    tier === 0 ? 5 : tier === 1 ? 4 : 3,
  );

  out.push({ points, scale, depth: tier });
  if (depth <= 0) return;

  // Forking twice at every tier is what exploded the bolt count (roots x 5.8).
  // The outermost tier mostly forks once, which trims the population without
  // thinning the silhouette where it is actually visible.
  const branchCount = Math.random() < (tier === 0 ? 0.75 : 0.35) ? 2 : 1;
  for (let b = 0; b < branchCount; b++) {
    const idx = Math.floor(points.length * (0.25 + Math.random() * 0.55));
    const origin = points[idx];
    const branchAngle =
      angle + (Math.random() < 0.5 ? -1 : 1) * (0.4 + Math.random() * 0.7);
    buildBolt(
      origin.x,
      origin.y,
      branchAngle,
      length * (0.35 + Math.random() * 0.3),
      depth - 1,
      scale * 0.6,
      out,
      tier + 1,
    );
  }
}

export function LightningCanvas({ handleRef }: LightningCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Mutable render state (never touches React) ─────────────────────────
    let dpr = 1;
    let cssW = 0;
    let cssH = 0;
    let sized = false;
    let bolts: Bolt[] = [];
    let roots: Point[] = [];
    let nextStroke = 0;
    let flash = 0;
    let running = false;
    // Axis-aligned bounds of the current bolt geometry, in CSS px.
    let boltX0 = 0;
    let boltY0 = 0;
    let boltX1 = 0;
    let boltY1 = 0;
    // Region painted last frame, so it can be erased without touching the rest
    // of the canvas.
    let prevX0 = 0;
    let prevY0 = 0;
    let prevX1 = 0;
    let prevY1 = 0;
    let prevValid = false;

    // NOTE: arrow consts, not `function` declarations — a hoisted function
    // declaration loses the `canvas`/`ctx` null-narrowing done above.

    /**
     * Allocate the pixel buffer lazily. Two SkillNetwork instances are mounted
     * (desktop + tablet, one hidden by CSS), so a full-viewport buffer is only
     * created for the one that actually gets dragged.
     */
    const ensureSize = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (sized && w === cssW && h === cssH) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cssW = w;
      cssH = h;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      sized = true;
    };

    // Re-measure on the next draw instead of reallocating while idle
    const invalidate = () => {
      sized = false;
      prevValid = false; // resizing reallocates (and so clears) the buffer
    };
    window.addEventListener("resize", invalidate);
    window.addEventListener("orientationchange", invalidate);

    /** Fresh set of channels radiating from the circle's circumference. */
    const regenerate = (x: number, y: number, r: number) => {
      bolts = [];
      roots = [];
      const count = 5 + Math.floor(Math.random() * 3); // 5-7 channels
      const base = Math.random() * Math.PI * 2;
      for (let i = 0; i < count; i++) {
        // Even spread with jitter so it never looks mechanical
        const angle = base + (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        // Origin sits EXACTLY on the circumference, aimed outward
        const sx = x + Math.cos(angle) * r;
        const sy = y + Math.sin(angle) * r;
        roots.push({ x: sx, y: sy });
        // Long enough to arc out past the frame and over the skill cards
        buildBolt(sx, sy, angle, r * (1.5 + Math.random() * 2.3), 2, 1, bolts);
      }

      // Exact bounds of the geometry, so the next clear can be a small rect
      // instead of the whole viewport. Measured rather than estimated: the
      // recursive branching makes the reach hard to bound analytically.
      boltX0 = Infinity;
      boltY0 = Infinity;
      boltX1 = -Infinity;
      boltY1 = -Infinity;
      for (const b of bolts) {
        for (const p of b.points) {
          if (p.x < boltX0) boltX0 = p.x;
          if (p.x > boltX1) boltX1 = p.x;
          if (p.y < boltY0) boltY0 = p.y;
          if (p.y > boltY1) boltY1 = p.y;
        }
      }
    };

    const wipe = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
    };

    const clear = () => {
      if (sized) wipe();
      running = false;
      flash = 0;
      nextStroke = 0;
      bolts = [];
      roots = [];
      prevValid = false;
    };

    const draw = (x: number, y: number, r: number, isDark: boolean): number => {
      ensureSize();
      const now = performance.now();

      // First frame of a new drag -> strike immediately
      if (!running) {
        running = true;
        nextStroke = 0;
        flash = 0;
      }

      if (now >= nextStroke) {
        regenerate(x, y, r);
        flash = 0.75 + Math.random() * 0.25;
        // ~22-56 ms between return strokes inside a burst, longer between bursts
        const inBurst = Math.random() < 0.72;
        nextStroke = now + (inBurst ? 22 + Math.random() * 34 : 90 + Math.random() * 130);
      }

      flash *= 0.86; // each stroke fades instead of blinking off
      const intensity = flash;

      // ── DIRTY-RECT CLEAR ──────────────────────────────────────────────────
      // The overlay spans the whole viewport, so clearing all of it every frame
      // meant erasing ~5.2M device pixels per frame at dpr 2 while the bolts
      // only ever cover a few hundred px around one ball. Clear the union of
      // what was painted last frame and what is about to be painted.
      const hasGeom = bolts.length > 0 && Number.isFinite(boltX0);
      const coronaR = r * 1.8;
      const pad = 14; // widest glow pass is 16px, so 8px each side, plus slack
      const curX0 = hasGeom ? Math.min(boltX0, x - coronaR) - pad : x - coronaR - pad;
      const curY0 = hasGeom ? Math.min(boltY0, y - coronaR) - pad : y - coronaR - pad;
      const curX1 = hasGeom ? Math.max(boltX1, x + coronaR) + pad : x + coronaR + pad;
      const curY1 = hasGeom ? Math.max(boltY1, y + coronaR) + pad : y + coronaR + pad;

      const clearX0 = Math.max(
        0,
        Math.floor(prevValid ? Math.min(curX0, prevX0) : curX0),
      );
      const clearY0 = Math.max(
        0,
        Math.floor(prevValid ? Math.min(curY0, prevY0) : curY0),
      );
      const clearX1 = Math.min(
        cssW,
        Math.ceil(prevValid ? Math.max(curX1, prevX1) : curX1),
      );
      const clearY1 = Math.min(
        cssH,
        Math.ceil(prevValid ? Math.max(curY1, prevY1) : curY1),
      );

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (clearX1 > clearX0 && clearY1 > clearY0) {
        ctx.clearRect(clearX0, clearY0, clearX1 - clearX0, clearY1 - clearY0);
      }

      if (intensity < 0.02 || !hasGeom) {
        prevValid = false;
        return 0;
      }

      prevX0 = curX0;
      prevY0 = curY0;
      prevX1 = curX1;
      prevY1 = curY1;
      prevValid = true;

      const passes = isDark ? PASSES_DARK : PASSES_LIGHT;

      ctx.globalCompositeOperation = "lighter";
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      // RIM corona — a ring, not a disc. A radial gradient floods everything
      // inside its inner radius with the first stop, so starting it at r*0.8
      // washed a bright disc straight over the logo. Fading up from the centre
      // keeps the glow on the circumference where the discharge actually is.
      const corona = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
      if (isDark) {
        corona.addColorStop(0, "rgba(230, 245, 255, 0)");
        corona.addColorStop(0.62, "rgba(200, 230, 255, 0)");
        corona.addColorStop(0.86, `rgba(235, 248, 255, ${0.34 * intensity})`);
        corona.addColorStop(1, "rgba(40, 80, 190, 0)");
      } else {
        corona.addColorStop(0, "rgba(120, 185, 255, 0)");
        corona.addColorStop(0.62, "rgba(90, 165, 255, 0)");
        corona.addColorStop(0.86, `rgba(150, 205, 255, ${0.34 * intensity})`);
        corona.addColorStop(1, "rgba(20, 50, 150, 0)");
      }
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Attachment-point flares: the arc burns hottest where it leaves the
      // surface. Capped at four — they sit on a circle of radius r, so beyond
      // four they overlap into an even ring and each extra gradient buys nothing.
      const flareR = r * 0.4;
      const flareCount = Math.min(roots.length, 4);
      for (let fi = 0; fi < flareCount; fi++) {
        const root = roots[fi];
        const flare = ctx.createRadialGradient(root.x, root.y, 0, root.x, root.y, flareR);
        flare.addColorStop(0, `rgba(255, 255, 255, ${0.55 * intensity})`);
        flare.addColorStop(
          0.4,
          isDark
            ? `rgba(170, 210, 255, ${0.22 * intensity})`
            : `rgba(90, 160, 255, ${0.24 * intensity})`,
        );
        flare.addColorStop(1, "rgba(40, 90, 200, 0)");
        ctx.fillStyle = flare;
        ctx.beginPath();
        ctx.arc(root.x, root.y, flareR, 0, Math.PI * 2);
        ctx.fill();
      }

      // Multi-pass glow: wide + dim first, white-hot core last.
      // Deeper forks skip the wide passes (see FIRST_PASS_BY_DEPTH) — those
      // exist for a thick channel's corona and are invisible on a thin twig,
      // but they were the bulk of the per-frame fill-rate.
      for (let p = 0; p < passes.length; p++) {
        const pass = passes[p];
        for (const bolt of bolts) {
          if (p < FIRST_PASS_BY_DEPTH[bolt.depth]) continue;
          const pts = bolt.points;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.lineWidth = Math.max(0.4, pass.width * bolt.scale);
          ctx.strokeStyle = `rgba(${pass.color}, ${pass.alpha * intensity * bolt.scale})`;
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      return intensity;
    };

    handleRef.current = { draw, clear };

    return () => {
      window.removeEventListener("resize", invalidate);
      window.removeEventListener("orientationchange", invalidate);
      handleRef.current = null;
    };
  }, [handleRef]);

  // Client-only component (parent loads it with `ssr: false`)
  if (typeof document === "undefined") return null;

  return createPortal(
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        // EXPLICIT 100% is required. <canvas> is a replaced element with an
        // intrinsic 300x150 size, so `inset: 0` alone does NOT stretch it —
        // the spec resolves `width: auto` to the intrinsic width and drops
        // `right`. Without this the buffer stayed 300x150 and nothing drew.
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        // Above all page content (skill cards included), below the navbar (z-50)
        zIndex: 45,
      }}
    />,
    document.body,
  );
}
