"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useTheme } from "next-themes";
import * as THREE from "three";
import { skillNodes } from "@/data/skill-nodes";
import { LightningCanvas, type LightningHandle } from "./LightningCanvas";

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════
const TILE_PX = 52; // painted diameter of a ball at scale 1 — the DESKTOP size
const TILE_PX_MIN = 30; // below this the logos stop being readable

/**
 * Ball diameter for a given frame, in CSS px.
 *
 * 28 balls at the desktop 52px simply do not fit a phone-sized frame: the
 * circles would cover ~42% of it, past the point where the no-overlap solver can
 * settle, so the cloud jams into a solid blob. Sizing from the frame's area
 * keeps the packing fraction constant instead.
 *
 * TILE_PX stays the ceiling, so desktop is untouched (it computes larger than 52
 * and gets clamped back down) — only small frames actually shrink.
 */
function tileSizeFor(width: number, height: number, count: number): number {
  if (width <= 0 || height <= 0 || count <= 0) return TILE_PX;
  const TARGET_PACKING = 0.22; // total circle area / frame area
  const radius = Math.sqrt((TARGET_PACKING * width * height) / (Math.PI * count));
  return Math.round(Math.min(TILE_PX, Math.max(TILE_PX_MIN, radius * 2)));
}
const EDGE_PAD_PX = 1; // hairline safety so antialiasing never bleeds out
const Z_RANGE = 1.6; // depth band the nodes drift through
const MAX_EDGE_DIST = 2.6; // world distance for drawing a connection line
const DEPTH_SCALE = 0.18; // how much nearer balls grow
const BREATH_AMP = 0.03; // breathing pulse amplitude
const HOVER_SCALE = 1.12; // bump applied on hover / drag

// Soft forces — all distances in SCREEN PIXELS so they behave the same at
// every depth. Velocities stay in world units per frame.
//
// These are tuned against the 52px desktop ball. On a smaller frame they are
// multiplied by tilePx / TILE_PX, otherwise a 120px spread radius around a 38px
// ball would shove everything to the edges of a phone-sized frame.
const SPREAD_RANGE_PX = 120;
const SPREAD_FORCE = 0.0003;
const CENTRE_CLEAR_PX = 55;
const CENTRE_FORCE = 0.0004;
const MAGNET_RADIUS_PX = 130;
const MAGNET_FORCE = 0.0003;
const MIN_SPEED = 0.0012;
const MAX_SPEED = 0.005;

// Storm flash envelope. FLASH_TAU is an exponential time constant in seconds
// (0.158s reproduces a `*= 0.9` per frame at 60fps, but frame-rate independent).
// FLASH_MIN_GAP_MS caps the large-area flash at 1000/340 = 2.9 per second, under
// the WCAG 2.3.1 general flash threshold of three per second.
const FLASH_TAU = 0.158;
const FLASH_MIN_GAP_MS = 340;

// Connection line colours. A WebGL material cannot read a CSS variable, so the
// palette values are mirrored here — keep in sync with globals.css.
//
// The line has to be the OPPOSITE polarity to the page, otherwise the graph
// stops reading as structure. Light mode already did this (dark teal on a near
// white page). Dark mode did not: accent cyan #0FA4AF sits at almost the same
// luminance as the #003135 background, so the edges just muddied. Soft light
// cyan #AFDDE5 reads as white against that background while staying on palette
// and staying a step softer than the white tiles, so it never competes.
// Same opacity in both themes — only the polarity flips. Measured single-line
// contrast against the frame background: 77 in light, 69 in dark. At 0.34 the
// dark line only reached 46 and read washed out next to the white tiles.
const LINE_LIGHT = "#024950";
const LINE_DARK = "#afdde5";
const LINE_OPACITY = 0.45;

// Cloud-logo fade in/out time constant, seconds.
const CLOUD_TAU = 0.13;
// Cloud stays clearly readable while dragging; the flash only brightens it.
const CLOUD_BASE = 0.55;
const CLOUD_FLASH = 0.45;

type NodeState = { pos: THREE.Vector3; vel: THREE.Vector3 };
type DragState = {
  index: number;
  lastX: number;
  lastY: number;
  vx: number;
  vy: number;
} | null;

/**
 * Camera projection parameters, refreshed every frame so the pointer handlers
 * (which live outside the render loop) can convert pixels to world units at the
 * correct depth.
 */
type Projection = { camZ: number; halfTan: number; halfH: number };

// ═══════════════════════════════════════════════════════════════════════════════
// LIGHTNING SYNC
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Drives the lightning canvas from the ball's REAL painted geometry.
 *
 * WHY MEASURE INSTEAD OF CALCULATE:
 *  - drei's <Html> mounts as a child, so its useFrame is registered BEFORE the
 *    parent scene's. Feeding the bolts from the physics loop therefore left them
 *    one frame ahead of the tile — a 10-30px gap during a fast drag.
 *  - The tile's on-screen size is the product of perspective projection, the
 *    depth scale, the breathing pulse and the hover bump. Rebuilding that number
 *    by hand drifts from what is actually painted.
 *
 * This component is rendered AFTER the node list, so React registers its
 * useFrame last and it runs once every <Html> has already written its transform
 * for the current frame. getBoundingClientRect() then returns the exact circle
 * the user is looking at — origin and radius, transforms included.
 *
 * Coordinates are passed through as raw VIEWPORT values because the lightning
 * canvas is a `position: fixed` overlay portalled onto document.body. No
 * container offset, and scrolling mid-drag stays correct for free.
 */
function LightningSync({
  dragRef,
  tileRefs,
  lightningRef,
  backdropRef,
  cloudRef,
  isDark,
}: {
  dragRef: React.RefObject<DragState>;
  tileRefs: React.RefObject<(HTMLDivElement | null)[]>;
  lightningRef: React.RefObject<LightningHandle | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  cloudRef: React.RefObject<HTMLDivElement | null>;
  isDark: boolean;
}) {
  const wasActive = useRef(false);
  const flashRef = useRef({ env: 0, lastTrigger: 0 });
  const presenceRef = useRef(0);
  const reduceMotion = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotion.current = mq.matches;
    const onChange = () => {
      reduceMotion.current = mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useFrame((_state, delta) => {
    const handle = lightningRef.current;
    if (!handle) return;

    const index = dragRef.current?.index ?? -1;
    const tile = index >= 0 ? tileRefs.current?.[index] : null;
    const active = tile !== null && tile !== undefined;

    let intensity = 0;
    if (active) {
      const t = tile.getBoundingClientRect();
      intensity = handle.draw(
        t.left + t.width / 2,
        t.top + t.height / 2,
        t.width / 2,
        isDark,
      );
      wasActive.current = true;
    } else if (wasActive.current) {
      handle.clear();
      wasActive.current = false;
    }

    // ── Storm flash envelope ──────────────────────────────────────────────
    // The bolts strobe at ~20-45 Hz. Mapping that onto a flash covering the
    // whole frame would be a photosensitivity hazard (WCAG 2.3.1 caps general
    // flashing at three per second). So the backdrop gets its own envelope:
    // instant attack, then a TIME-BASED decay, and it cannot re-trigger more
    // often than FLASH_MIN_GAP_MS — a hard 2.9 flashes/sec ceiling that holds
    // at any frame rate because the gate reads the clock, not the frame count.
    //
    // The decay must be time-based too. A plain `env *= 0.9` per frame ties the
    // fade to the refresh rate: ~370 ms at 60 fps, but seconds on a device
    // struggling at 15 fps.
    const f = flashRef.current;
    if (active && !reduceMotion.current && intensity > 0.6) {
      const now = performance.now();
      if (now - f.lastTrigger > FLASH_MIN_GAP_MS) {
        f.env = 1;
        f.lastTrigger = now;
      }
    }
    if (f.env > 0) {
      f.env *= Math.exp(-delta / FLASH_TAU);
      if (f.env < 0.005) f.env = 0;
      const el = backdropRef.current;
      if (el) el.style.opacity = f.env.toFixed(3);
    }

    // ── Cloud logo presence ───────────────────────────────────────────────
    // Ramps in on grab and out on release. It holds a steady base opacity
    // while dragging so the mark stays readable, and the storm flash only
    // brightens it — following the flash outright would make it strobe.
    const target = active ? 1 : 0;
    let p = presenceRef.current;
    if (p !== target) {
      p += (target - p) * (1 - Math.exp(-delta / CLOUD_TAU));
      if (Math.abs(p - target) < 0.003) p = target;
      presenceRef.current = p;
    }
    const cloud = cloudRef.current;
    if (cloud) {
      const mod = reduceMotion.current ? 0.8 : CLOUD_BASE + CLOUD_FLASH * f.env;
      cloud.style.opacity = (p * mod).toFixed(3);
    }
  });

  return null;
}

function makeNodes(count: number): NodeState[] {
  return Array.from({ length: count }, () => {
    const speed = 0.0014 + Math.random() * 0.002;
    const angle = Math.random() * Math.PI * 2;
    return {
      pos: new THREE.Vector3(0, 0, (Math.random() - 0.5) * Z_RANGE),
      vel: new THREE.Vector3(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * speed * 0.4,
      ),
    };
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// NETWORK SCENE
// ═══════════════════════════════════════════════════════════════════════════════
function NetworkScene({
  containerRef,
  sparkRef,
  lightningRef,
  backdropRef,
  cloudRef,
  onGrab,
  tilePx,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  sparkRef: React.RefObject<HTMLDivElement | null>;
  lightningRef: React.RefObject<LightningHandle | null>;
  backdropRef: React.RefObject<HTMLDivElement | null>;
  cloudRef: React.RefObject<HTMLDivElement | null>;
  /** Reveals the grabbed skill's cloud logo. Imperative on purpose — see below. */
  onGrab: (index: number) => void;
  /** Ball diameter in CSS px for the current frame size. */
  tilePx: number;
}) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const { viewport } = useThree();

  const count = skillNodes.length;
  const nodesRef = useRef<NodeState[]>(makeNodes(count));
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const tileRefs = useRef<(HTMLDivElement | null)[]>([]);
  const lineRef = useRef<THREE.LineSegments>(null);
  const dragRef = useRef<DragState>(null);
  const mousePxRef = useRef({ x: 1e6, y: 1e6 });
  const projRef = useRef<Projection>({ camZ: 7, halfTan: 0.4663, halfH: 200 });
  const seededRef = useRef(false);
  const [hovered, setHovered] = useState<number | null>(null);
  /** True while the current grab came from a finger or pen rather than a mouse.
   *  Touch has no "leave" event, so the name label has to be dismissed on lift. */
  const touchGrabRef = useRef(false);

  // Per-frame scratch buffers — screen-space metrics for every node.
  // Allocated once; the render loop must never allocate.
  const mRef = useRef({
    k: new Float64Array(count), // px per world unit at that node's depth
    sx: new Float64Array(count), // screen x offset from centre, px
    sy: new Float64Array(count), // screen y offset from centre, px (y up)
    rVis: new Float64Array(count), // painted radius, px
    scale: new Float64Array(count), // CSS transform scale
    // Last box-shadow bucket written per tile, so the style is only touched when
    // it actually changes. -1 = never written.
    shadow: new Int8Array(count).fill(-1),
    // Contact flags per pair, so a spark fires once per collision EVENT rather
    // than once per frame of contact.
    touch: new Uint8Array(count * count),
  });

  // ── Collision spark emitter (takes container-local pixels) ──────────────
  const emitSpark = useCallback(
    (leftPx: number, topPx: number) => {
      const container = sparkRef.current;
      if (!container) return;
      for (let k = 0; k < 5; k++) {
        const angle = (k / 5) * Math.PI * 2 + Math.random() * 0.5;
        const dist = 12 + Math.random() * 18;
        const spark = document.createElement("span");
        spark.className = "spark";
        spark.style.left = `${leftPx}px`;
        spark.style.top = `${topPx}px`;
        spark.style.setProperty("--sx", `${Math.cos(angle) * dist}px`);
        spark.style.setProperty("--sy", `${Math.sin(angle) * dist}px`);
        container.appendChild(spark);
        setTimeout(() => spark.remove(), 500);
      }
    },
    [sparkRef],
  );

  // ── Seed nodes across the FULL visible area ─────────────────────────────
  //
  // Cells are assigned in SHUFFLED order. Walking the grid in array order meant
  // every visit produced the same tidy arrangement with the same neighbours,
  // which read as a deliberate structure rather than a living network.
  //
  // Still a grid underneath, though — placing 28 balls at pure random positions
  // would start them heavily overlapped, and the solver untangling that on the
  // first few frames is visible as a pop.
  //
  // Runs ONCE. It used to re-run on every viewport change, so a window resize
  // teleported every ball to a new home. The frame loop already re-clamps to the
  // new bounds, so re-seeding is not needed.
  useEffect(() => {
    if (seededRef.current || viewport.width === 0 || viewport.factor === 0) return;
    seededRef.current = true;

    // Reserve the largest a ball can ever paint (near + breathing + hover)
    const marginPx =
      (tilePx / 2) * (1 + DEPTH_SCALE + BREATH_AMP) * HOVER_SCALE + EDGE_PAD_PX;
    const margin = marginPx / viewport.factor;
    const bx = Math.max(0.01, viewport.width / 2 - margin);
    const by = Math.max(0.01, viewport.height / 2 - margin);
    const aspect = viewport.width / viewport.height;
    const cols = Math.max(2, Math.round(Math.sqrt(count * aspect)));
    const rows = Math.ceil(count / cols);
    const cellW = (bx * 2) / cols;
    const cellH = (by * 2) / rows;

    // Fisher-Yates over the available cells
    const cells = Array.from({ length: cols * rows }, (_, i) => i);
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    nodesRef.current.forEach((n, i) => {
      const cell = cells[i];
      const col = cell % cols;
      const row = Math.floor(cell / cols);
      n.pos.set(
        -bx + cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.55,
        -by + cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.55,
        (Math.random() - 0.5) * Z_RANGE,
      );
      // Fresh heading too, so the motion does not start in lockstep either
      const speed = MIN_SPEED + Math.random() * (MAX_SPEED - MIN_SPEED) * 0.5;
      const angle = Math.random() * Math.PI * 2;
      n.vel.set(
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        (Math.random() - 0.5) * speed * 0.4,
      );
    });
    // `tilePx` is a dependency because the reserved margin above depends on it.
    // Re-running is harmless — seededRef makes the body a no-op after the first
    // successful seed. It matters on mount: the first pass bails out while the
    // R3F viewport is still 0, and by the time it is ready the frame has been
    // measured, so the seed uses the correct ball size.
  }, [viewport.width, viewport.height, viewport.factor, count, tilePx]);

  // ── Track the cursor in canvas pixels (magnetic effect) ─────────────────
  useEffect(() => {
    const el = containerRef.current;
    function onMove(e: PointerEvent) {
      const rect = el?.getBoundingClientRect();
      if (!rect) return;
      mousePxRef.current.x = e.clientX - rect.left - rect.width / 2;
      mousePxRef.current.y = -(e.clientY - rect.top - rect.height / 2);
    }
    function onLeave() {
      mousePxRef.current.x = 1e6;
      mousePxRef.current.y = 1e6;
    }
    el?.addEventListener("pointermove", onMove);
    el?.addEventListener("pointerleave", onLeave);
    return () => {
      el?.removeEventListener("pointermove", onMove);
      el?.removeEventListener("pointerleave", onLeave);
    };
  }, [containerRef]);

  // ── Drag ────────────────────────────────────────────────────────────────
  const startDrag = useCallback(
    (index: number, e: React.PointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      dragRef.current = { index, lastX: e.clientX, lastY: e.clientY, vx: 0, vy: 0 };
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      nodesRef.current[index].vel.set(0, 0, 0);
      onGrab(index);

      // The name label used to be driven purely by onMouseEnter. Touch browsers
      // synthesise mouseenter only AFTER the tap finishes, which is why the name
      // appeared on release instead of on contact. Pointerdown fires for finger,
      // pen and mouse alike, so naming it here makes the label instant on touch.
      setHovered(index);
      touchGrabRef.current = e.pointerType !== "mouse";
    },
    [onGrab],
  );

  useEffect(() => {
    function onMove(e: PointerEvent) {
      const drag = dragRef.current;
      if (!drag) return;
      const node = nodesRef.current[drag.index];
      const { camZ, halfTan, halfH } = projRef.current;
      // px per world unit AT THIS NODE'S DEPTH, so the ball tracks the cursor
      // 1:1 instead of drifting by the perspective foreshortening factor.
      const k = halfH / ((camZ - node.pos.z) * halfTan);
      if (!Number.isFinite(k) || k <= 0) return;
      const dx = (e.clientX - drag.lastX) / k;
      const dy = -(e.clientY - drag.lastY) / k;
      node.pos.x += dx;
      node.pos.y += dy;
      drag.vx = dx;
      drag.vy = dy;
      drag.lastX = e.clientX;
      drag.lastY = e.clientY;
    }
    function onUp() {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      const drag = dragRef.current;
      if (drag) {
        const node = nodesRef.current[drag.index];
        const cap = 0.03;
        node.vel.set(
          THREE.MathUtils.clamp(drag.vx * 0.3, -cap, cap),
          THREE.MathUtils.clamp(drag.vy * 0.3, -cap, cap),
          node.vel.z,
        );
        if (node.vel.length() < MIN_SPEED) {
          const a = Math.random() * Math.PI * 2;
          node.vel.set(Math.cos(a) * MIN_SPEED, Math.sin(a) * MIN_SPEED, node.vel.z);
        }
      }
      dragRef.current = null;

      // A finger has no pointerleave, so the label would otherwise stay on
      // screen after the tap. A mouse keeps it until the cursor actually leaves.
      if (touchGrabRef.current) {
        touchGrabRef.current = false;
        setHovered(null);
      }
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // ── Physics + render loop ───────────────────────────────────────────────
  //
  // ALL hard constraints (frame bounds, ball-to-ball contact) are solved in
  // SCREEN PIXELS, not world units.
  //
  // WHY: the camera is perspective, but drei's <Html> tiles do NOT scale with
  // distance — a ball is always TILE_PX wide on screen. Meanwhile a node at
  // z = +0.8 is nearer the camera, so the visible world area there is ~11%
  // narrower than at z = 0. Bounds derived from the z = 0 plane therefore let
  // near balls escape the frame while far balls could never reach the edge.
  // That single mismatch produced both symptoms. Measuring in pixels removes it.
  //
  // RENDER PRIORITY -1 IS LOAD-BEARING. drei's <Html> subscribes at priority 0,
  // and R3F sorts subscribers ascending, so without this the tiles would be
  // positioned from LAST frame's coordinates while wearing THIS frame's scale.
  // A hover bump (x1.12 = +3.1px radius) applied to a stale, tighter clamp let
  // balls poke ~3px past the frame edge for a frame. Negative priority runs us
  // first; it does not disable R3F's automatic render (only priority > 0 does).
  useFrame((state) => {
    const nodes = nodesRef.current;
    const canvasW = state.size.width;
    const canvasH = state.size.height;
    if (canvasW === 0 || canvasH === 0) return;

    const cam = state.camera;
    const fov = cam instanceof THREE.PerspectiveCamera ? cam.fov : 50;
    const halfTan = Math.tan((fov * Math.PI) / 360);
    const camZ = cam.position.z;
    const halfW = canvasW / 2;
    const halfH = canvasH / 2;
    projRef.current = { camZ, halfTan, halfH };

    const breath = Math.sin(state.clock.getElapsedTime() * 1.8) * BREATH_AMP;
    const draggingIndex = dragRef.current?.index ?? -1;
    const m = mRef.current;
    const boundZ = Z_RANGE / 2;

    // Soft-force radii scale with the ball, so a phone-sized frame behaves the
    // same as desktop instead of every ball being flung to the edges.
    const forceScale = tilePx / TILE_PX;
    const spreadRange = SPREAD_RANGE_PX * forceScale;
    const centreClear = CENTRE_CLEAR_PX * forceScale;
    const magnetRadius = MAGNET_RADIUS_PX * forceScale;

    /** Recompute a node's screen metrics from its world position. */
    const measure = (i: number) => {
      const n = nodes[i];
      const k = halfH / ((camZ - n.pos.z) * halfTan);
      m.k[i] = k;
      m.sx[i] = n.pos.x * k;
      m.sy[i] = n.pos.y * k;
      const depth = n.pos.z / boundZ;
      const scale =
        (1 + depth * DEPTH_SCALE + breath) * (hovered === i ? HOVER_SCALE : 1);
      m.scale[i] = scale;
      m.rVis[i] = (tilePx / 2) * scale;
    };

    /** Push a node back inside the frame. `bounce` reflects its velocity too. */
    const applyBounds = (i: number, bounce: boolean) => {
      const n = nodes[i];
      const limit = m.rVis[i] + EDGE_PAD_PX;
      const maxX = Math.max(0, halfW - limit);
      const maxY = Math.max(0, halfH - limit);
      let changed = false;
      if (m.sx[i] > maxX) {
        m.sx[i] = maxX;
        if (bounce) n.vel.x = -Math.abs(n.vel.x);
        changed = true;
      } else if (m.sx[i] < -maxX) {
        m.sx[i] = -maxX;
        if (bounce) n.vel.x = Math.abs(n.vel.x);
        changed = true;
      }
      if (m.sy[i] > maxY) {
        m.sy[i] = maxY;
        if (bounce) n.vel.y = -Math.abs(n.vel.y);
        changed = true;
      } else if (m.sy[i] < -maxY) {
        m.sy[i] = -maxY;
        if (bounce) n.vel.y = Math.abs(n.vel.y);
        changed = true;
      }
      if (changed) {
        n.pos.x = m.sx[i] / m.k[i];
        n.pos.y = m.sy[i] / m.k[i];
      }
    };

    // 1) Integrate + depth bounce, then measure and clamp to the frame
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (i !== draggingIndex) n.pos.add(n.vel);
      if (n.pos.z > boundZ) {
        n.pos.z = boundZ;
        n.vel.z = -Math.abs(n.vel.z);
      } else if (n.pos.z < -boundZ) {
        n.pos.z = -boundZ;
        n.vel.z = Math.abs(n.vel.z);
      }
      measure(i);
      applyBounds(i, i !== draggingIndex);
    }

    // 2) Ball-to-ball contact in screen pixels — two passes so chains settle
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dsx = m.sx[j] - m.sx[i];
          const dsy = m.sy[j] - m.sy[i];
          const dist = Math.hypot(dsx, dsy);
          const minGap = m.rVis[i] + m.rVis[j];
          const pair = i * nodes.length + j;
          if (dist === 0 || dist >= minGap) {
            if (pass === 0) m.touch[pair] = 0; // separated — re-arm the spark
            continue;
          }

          const nx = dsx / dist;
          const ny = dsy / dist;
          const overlap = minGap - dist;

          // Separate in pixels, then write back through each node's own scale
          if (i === draggingIndex) {
            m.sx[j] += nx * overlap;
            m.sy[j] += ny * overlap;
            nodes[j].pos.x = m.sx[j] / m.k[j];
            nodes[j].pos.y = m.sy[j] / m.k[j];
          } else if (j === draggingIndex) {
            m.sx[i] -= nx * overlap;
            m.sy[i] -= ny * overlap;
            nodes[i].pos.x = m.sx[i] / m.k[i];
            nodes[i].pos.y = m.sy[i] / m.k[i];
          } else {
            m.sx[i] -= (nx * overlap) / 2;
            m.sy[i] -= (ny * overlap) / 2;
            m.sx[j] += (nx * overlap) / 2;
            m.sy[j] += (ny * overlap) / 2;
            nodes[i].pos.x = m.sx[i] / m.k[i];
            nodes[i].pos.y = m.sy[i] / m.k[i];
            nodes[j].pos.x = m.sx[j] / m.k[j];
            nodes[j].pos.y = m.sy[j] / m.k[j];
          }

          // Elastic response along the contact normal
          const approach =
            (nodes[i].vel.x - nodes[j].vel.x) * nx +
            (nodes[i].vel.y - nodes[j].vel.y) * ny;
          if (approach > 0) {
            if (i !== draggingIndex) {
              nodes[i].vel.x -= nx * approach;
              nodes[i].vel.y -= ny * approach;
            }
            if (j !== draggingIndex) {
              nodes[j].vel.x += nx * approach;
              nodes[j].vel.y += ny * approach;
            }
          }

          // Sparks fire once per contact EVENT, at the exact touch point.
          // Firing every frame of contact meant a pair resting against each
          // other spawned 5 DOM nodes plus 5 timers per frame, forever.
          if (pass === 0 && m.touch[pair] === 0) {
            m.touch[pair] = 1;
            emitSpark(halfW + (m.sx[i] + m.sx[j]) / 2, halfH - (m.sy[i] + m.sy[j]) / 2);
          }
        }
      }
    }

    // 3) Soft forces — keep the frame evenly filled, follow the cursor
    const mouse = mousePxRef.current;
    for (let i = 0; i < nodes.length; i++) {
      if (i === draggingIndex) continue;
      const n = nodes[i];

      for (let j = 0; j < nodes.length; j++) {
        if (i === j) continue;
        const dsx = m.sx[i] - m.sx[j];
        const dsy = m.sy[i] - m.sy[j];
        const dist = Math.hypot(dsx, dsy);
        if (dist === 0 || dist > spreadRange) continue;
        const f = (SPREAD_FORCE * (1 - dist / spreadRange)) / dist;
        n.vel.x += dsx * f;
        n.vel.y += dsy * f;
      }

      const cDist = Math.hypot(m.sx[i], m.sy[i]);
      if (cDist > 0 && cDist < centreClear) {
        n.vel.x += (m.sx[i] / cDist) * CENTRE_FORCE;
        n.vel.y += (m.sy[i] / cDist) * CENTRE_FORCE;
      }

      const dmx = mouse.x - m.sx[i];
      const dmy = mouse.y - m.sy[i];
      const dm = Math.hypot(dmx, dmy);
      if (dm > 0 && dm < magnetRadius) {
        const f = (MAGNET_FORCE * (1 - dm / magnetRadius)) / dm;
        n.vel.x += dmx * f;
        n.vel.y += dmy * f;
      }

      const speed = Math.hypot(n.vel.x, n.vel.y);
      if (speed > MAX_SPEED) {
        n.vel.x = (n.vel.x / speed) * MAX_SPEED;
        n.vel.y = (n.vel.y / speed) * MAX_SPEED;
      } else if (speed < MIN_SPEED) {
        const a = speed > 0 ? Math.atan2(n.vel.y, n.vel.x) : Math.random() * Math.PI * 2;
        n.vel.x = Math.cos(a) * MIN_SPEED;
        n.vel.y = Math.sin(a) * MIN_SPEED;
      }
    }

    // 4) FINAL bounds pass — steps 2 and 3 can shove a ball past the edge.
    //    Nothing may move a node after this point.
    for (let i = 0; i < nodes.length; i++) {
      measure(i);
      applyBounds(i, false);
    }

    // 5) Sync anchors + depth effects (uses the exact scale the bounds used)
    //
    // `transform` is composited, so writing it every frame is free.
    // `box-shadow` is NOT — every change repaints the tile. Writing it on all 21
    // tiles each frame (with a 0.3s transition on top, so each write restarted
    // an interpolation) was the single most expensive thing in this loop.
    // Depth drifts slowly, so bucketing it to 13 steps drops that from ~1260
    // repaints/second to a handful, with no visible difference.
    for (let i = 0; i < nodes.length; i++) {
      groupRefs.current[i]?.position.copy(nodes[i].pos);
      const tile = tileRefs.current[i];
      if (!tile) continue;
      tile.style.transform = `scale(${m.scale[i].toFixed(3)})`;

      const depth = nodes[i].pos.z / boundZ;
      const bucket = Math.round((depth + 1) * 6); // 0..12
      if (m.shadow[i] !== bucket) {
        m.shadow[i] = bucket;
        const d = bucket / 6 - 1;
        const spread = (1 + d) * 8;
        tile.style.boxShadow = `0 ${spread.toFixed(0)}px ${(spread * 1.5).toFixed(0)}px rgba(0,0,0,${(0.12 + d * 0.06).toFixed(2)})`;
      }
    }

    // 6) Rebuild connection lines
    const line = lineRef.current;
    if (line) {
      const attr = line.geometry.getAttribute("position") as THREE.BufferAttribute;
      const arr = attr.array as Float32Array;
      let ptr = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].pos.distanceTo(nodes[j].pos) < MAX_EDGE_DIST) {
            arr[ptr++] = nodes[i].pos.x;
            arr[ptr++] = nodes[i].pos.y;
            arr[ptr++] = nodes[i].pos.z;
            arr[ptr++] = nodes[j].pos.x;
            arr[ptr++] = nodes[j].pos.y;
            arr[ptr++] = nodes[j].pos.z;
          }
        }
      }
      attr.needsUpdate = true;
      line.geometry.setDrawRange(0, ptr / 3);
    }
  }, -1);

  const maxSegments = (count * (count - 1)) / 2;

  return (
    <>
      <lineSegments ref={lineRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[new Float32Array(maxSegments * 6), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={isDark ? LINE_DARK : LINE_LIGHT}
          transparent
          opacity={LINE_OPACITY}
        />
      </lineSegments>

      {skillNodes.map((skill, i) => (
        <group
          key={skill.name}
          ref={(el) => {
            groupRefs.current[i] = el;
          }}
        >
          <Html center zIndexRange={[20, 5]}>
            <div
              ref={(el) => {
                tileRefs.current[i] = el;
              }}
              className="skill-tile group relative flex cursor-grab select-none items-center justify-center rounded-full active:cursor-grabbing"
              style={{
                width: tilePx,
                height: tilePx,
                touchAction: "none",
                userSelect: "none",
              }}
              onPointerDown={(e) => startDrag(i, e)}
              onDragStart={(e) => e.preventDefault()}
              onContextMenu={(e) => e.preventDefault()}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Tile surface and ink are theme-independent by design — see the
                  --node-surface comment in globals.css. */}
              {/* transition-colors, not transition-all: `all` was interpolating
                  the box-shadow on 28 tiles that are re-scaled every frame, which
                  is a repaint per tile per frame. The border still lights up. */}
              <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-accent/50 bg-node-surface p-2 shadow-xl transition-colors duration-200 group-hover:border-accent">
                {!skill.logo ? (
                  /* Defensive fallback only — every node ships a mark today. */
                  <span className="pointer-events-none flex h-full w-full select-none items-center justify-center rounded-full text-center text-[8px] font-bold leading-tight text-node-ink">
                    {skill.name}
                  </span>
                ) : skill.mono ? (
                  <span
                    aria-label={skill.name}
                    role="img"
                    className="pointer-events-none h-full w-full select-none bg-node-ink"
                    style={{
                      transform: `scale(${skill.scale ?? 1})`,
                      WebkitMaskImage: `url("${skill.logo}")`,
                      maskImage: `url("${skill.logo}")`,
                      WebkitMaskRepeat: "no-repeat",
                      maskRepeat: "no-repeat",
                      WebkitMaskPosition: "center",
                      maskPosition: "center",
                      WebkitMaskSize: "contain",
                      maskSize: "contain",
                    }}
                  />
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={skill.logo}
                    alt={skill.name}
                    width={tilePx}
                    height={tilePx}
                    style={{ transform: `scale(${skill.scale ?? 1})` }}
                    className="pointer-events-none h-full w-full select-none object-contain"
                    draggable={false}
                  />
                )}
              </div>

              {/* Halo drawn as a gradient, NOT a CSS blur filter. The tile's
                  scale changes every frame, and a blurred child of a scaling
                  element has to be re-rasterised on each one — 28 times a
                  frame. A radial gradient scales on the compositor for free. */}
              <div className="node-glow" />

              {hovered === i && (
                <span className="pointer-events-none absolute -bottom-8 left-1/2 z-50 -translate-x-1/2 select-none whitespace-nowrap rounded-md bg-foreground px-2.5 py-1 text-[11px] font-semibold text-background shadow-lg">
                  {skill.name}
                </span>
              )}
            </div>
          </Html>
        </group>
      ))}

      {/* Rendered LAST so its useFrame runs after every <Html> transform is
          written this frame. That is what makes the bolts sit exactly on the
          painted circumference with zero lag. */}
      <LightningSync
        dragRef={dragRef}
        tileRefs={tileRefs}
        lightningRef={lightningRef}
        backdropRef={backdropRef}
        cloudRef={cloudRef}
        isDark={isDark}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT
// ═══════════════════════════════════════════════════════════════════════════════
export default function SkillNetwork() {
  // Ball diameter, derived from the real frame size. State (not a ref) because
  // the tile elements' width/height come from it and must re-render on change —
  // which only happens on resize / rotation, not per frame.
  const [tilePx, setTilePx] = useState(TILE_PX);
  const [isNearViewport, setIsNearViewport] = useState(false);
  /* Also paused while the page is being scrolled. The physics loop drives 28
   * <Html> tiles, so it is the second most expensive thing on the page, and
   * nobody drags a ball mid-flick. Frames go to the scroll instead. */
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sparkRef = useRef<HTMLDivElement>(null);
  const lightningRef = useRef<LightningHandle | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const cloudRef = useRef<HTMLDivElement>(null);
  const cloudSlots = useRef<(HTMLDivElement | null)[]>([]);
  const activeSlot = useRef(-1);

  /**
   * Reveals one skill's cloud logo.
   *
   * IMPERATIVE ON PURPOSE — do not turn this into React state. A re-render of
   * <Canvas> re-runs the node list, and inline callback refs detach (null) then
   * reattach. LightningSync would see a null tile for that one frame, call
   * clear(), and the bolts would blink out mid-drag. So all 21 cloud layers are
   * rendered once and kept `display: none`; only the display flag flips.
   * `display: none` also means the blurred layers are never rasterised until
   * their skill is actually grabbed.
   */
  // Track the frame and resize the balls to suit it. ResizeObserver reports the
  // layout box, which is exactly what we want here.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const apply = () => {
      const next = tileSizeFor(el.clientWidth, el.clientHeight, skillNodes.length);
      setTilePx((prev) => (prev === next ? prev : next));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);

    // Keep the exact physics/drag/lightning behavior while visible, but stop the
    // R3F render loop when this section is far offscreen. This is the largest
    // scroll-performance win because both useFrame callbacks otherwise run for
    // the entire page lifetime.
    const io = new IntersectionObserver(
      ([entry]) => setIsNearViewport(entry?.isIntersecting ?? false),
      { rootMargin: "180px 0px" },
    );
    io.observe(el);

    let idle = 0;
    let scrolling = false;
    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        setIsScrolling(true);
      }
      window.clearTimeout(idle);
      idle = window.setTimeout(() => {
        scrolling = false;
        setIsScrolling(false);
      }, 180);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      ro.disconnect();
      io.disconnect();
      window.clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const showCloud = useCallback((index: number) => {
    if (activeSlot.current === index) return;
    const prev = cloudSlots.current[activeSlot.current];
    if (prev) prev.style.display = "none";
    const next = cloudSlots.current[index];
    if (next) next.style.display = "block";
    activeSlot.current = index;
  }, []);

  return (
    // NO `overflow-hidden` HERE — ON PURPOSE.
    // Each ball carries a soft `blur-xl` halo that reaches ~50px past its own
    // circle. Clipping the container sliced that halo off along a dead-straight
    // line, which is exactly what made the invisible frame edge visible whenever
    // a ball drifted up against it (measured: a 5.6/255 luminance step sitting
    // precisely on the boundary, with flat background either side of it).
    // The balls themselves are provably bounded in the physics loop, so nothing
    // needs clipping — letting the halo fade out naturally keeps the frame edge
    // undetectable on all four sides.
    <div
      ref={containerRef}
      data-skill-visible={isNearViewport ? "true" : "false"}
      data-skill-active={isNearViewport && !isScrolling ? "true" : "false"}
      className="relative h-full w-full select-none"
    >
      {/* Storm flash backdrop. First in DOM so it paints BEHIND the balls;
          opacity is driven per frame by LightningSync. */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        className="storm-flash pointer-events-none absolute inset-0 z-0"
        style={{ opacity: 0 }}
      />

      {/* Grabbed skill's mark, huge and cloud-like, behind the balls.
          The logo is only a MASK — the fill is the site's own gradient, so no
          vendor brand colour can appear. */}
      <div
        ref={cloudRef}
        aria-hidden="true"
        className="cloud-logo z-0"
        style={{ opacity: 0, containerType: "inline-size" }}
      >
        {skillNodes.map((skill, i) => (
          <div
            key={skill.name}
            ref={(el) => {
              cloudSlots.current[i] = el;
            }}
            className="cloud-logo-drift"
            style={{ display: "none" }}
          >
            {skill.logo ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={skill.logo}
                  alt=""
                  aria-hidden="true"
                  className="cloud-logo-img cloud-logo-haze"
                  draggable={false}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={skill.logo}
                  alt=""
                  aria-hidden="true"
                  className="cloud-logo-img cloud-logo-core"
                  draggable={false}
                />
              </>
            ) : (
              <span className="cloud-logo-text">{skill.name}</span>
            )}
          </div>
        ))}
      </div>

      {/* Collision sparks layer */}
      <div ref={sparkRef} className="pointer-events-none absolute inset-0 z-30" />

      {/* Photo-realistic lightning layer (portalled to body, fixed overlay) */}
      <LightningCanvas handleRef={lightningRef} />

      <Canvas
        frameloop={isNearViewport && !isScrolling ? "always" : "never"}
        camera={{ position: [0, 0, 7], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        // R3F hard-codes `overflow: hidden` on its root div and spreads `style`
        // afterwards, so this override is the only way to unclip the <Html> tiles.
        style={{ background: "transparent", overflow: "visible" }}
      >
        <NetworkScene
          containerRef={containerRef}
          sparkRef={sparkRef}
          lightningRef={lightningRef}
          backdropRef={backdropRef}
          cloudRef={cloudRef}
          onGrab={showCloud}
          tilePx={tilePx}
        />
      </Canvas>
    </div>
  );
}
