/**
 * What this device can actually do, probed once on the client.
 *
 * Nothing here goes into React state. The result is handed to the renderer and
 * written to `host.dataset.mode`, so the DOM holds the mode and the static
 * fallback stays a pure CSS concern. That also sidesteps
 * `react-hooks/set-state-in-effect`, which forbids a synchronous setState in an
 * effect body — and probing capabilities is exactly the thing that wants to do
 * that.
 */

export interface Capabilities {
  webgl: "webgl2" | "webgl" | "none";
  /** True only for a real pointing device, so touch never gets tracked. */
  canHover: boolean;
  reducedMotion: boolean;
  /** Capped at 2 — beyond that the fill cost quadruples for no visible gain. */
  dpr: number;
  lowPower: boolean;
}

export interface RenderSettings {
  mode: "live" | "static";
  /** Backing-store scale relative to CSS pixels. */
  resolutionScale: number;
  /** 0 = follow vsync. */
  frameCap: number;
  /** fBm octaves. Three is visually close and a quarter cheaper than four. */
  octaves: number;
  trackPointer: boolean;
}

function probeWebgl(): Capabilities["webgl"] {
  try {
    const canvas = document.createElement("canvas");
    const opts: WebGLContextAttributes = {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      failIfMajorPerformanceCaveat: false,
    };
    if (canvas.getContext("webgl2", opts)) return "webgl2";
    if (canvas.getContext("webgl", opts)) return "webgl";
    return "none";
  } catch {
    return "none";
  }
}

export function detectCapabilities(): Capabilities {
  const nav = navigator as Navigator & {
    hardwareConcurrency?: number;
    deviceMemory?: number;
  };
  const cores = nav.hardwareConcurrency ?? 8;
  const memory = nav.deviceMemory ?? 8;

  return {
    webgl: probeWebgl(),
    canHover: window.matchMedia("(hover: hover) and (pointer: fine)").matches,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    lowPower: cores <= 4 || memory <= 4,
  };
}

/**
 * `resolutionScale` is the main performance lever. A full-screen procedural
 * shader is fill-rate bound, so cost tracks the number of fragments — and the
 * field has no high-frequency detail, so rendering below native and letting the
 * browser scale it up is visually free.
 */
export function deriveSettings(caps: Capabilities): RenderSettings {
  if (caps.reducedMotion || caps.webgl === "none") {
    return {
      mode: "static",
      resolutionScale: 0,
      frameCap: 0,
      octaves: 0,
      trackPointer: false,
    };
  }

  if (caps.lowPower) {
    return {
      mode: "live",
      resolutionScale: 0.55,
      frameCap: 30,
      octaves: 3,
      trackPointer: caps.canHover,
    };
  }

  return {
    mode: "live",
    resolutionScale: caps.dpr > 1.5 ? 0.65 : 0.8,
    frameCap: 0,
    octaves: 4,
    trackPointer: caps.canHover,
  };
}
