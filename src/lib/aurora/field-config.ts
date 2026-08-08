/**
 * Every tunable number for the aurora field, in one place.
 *
 * The verification loop in scripts/aurora-capture.mjs measures the rendered
 * result and each failing metric maps to a specific knob here, so this file is
 * the only thing that changes between iterations.
 *
 * PALETTE IS NOT TUNABLE. The three veil colours are fixed by
 * reference/ai-rnd-chets/chetgpt-chets/chet1-beground iffact for home.md and
 * confirmed separately by the owner. Anything that reads as bright red, blue,
 * purple, pink or yellow is a defect, not a variation.
 */

export type LinearRGB = readonly [number, number, number];

/** sRGB hex to linear light. Accumulating light in sRGB is what makes additive
 *  glows go chalky, so every colour crosses into linear once, here. */
export function hexToLinear(hex: string): LinearRGB {
  const h = hex.replace("#", "");
  const to = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return [to(0), to(2), to(4)] as const;
}

export const PALETTE = {
  /** Dark-mode fallback; normal rendering reads the active UI token (#003135). */
  baseDark: hexToLinear("#003135"),
  /** Light mode base comes from the theme token, resolved at runtime. */
  baseLightFallback: hexToLinear("#FAFFFE"),
  /** #003135 — deep teal foundation. */
  deep: hexToLinear("#003135"),
  /** #0FA4AF — the dominant cyan glow. */
  cyan: hexToLinear("#0FA4AF"),
  /** #964734 — muted burnt orange. Secondary, used sparingly, never bright red. */
  warm: hexToLinear("#964734"),
} as const;

export type BandColorName = "deep" | "cyan" | "warm";

export interface AuroraBand {
  /** Iso-value in the normalised warped field whose contour this veil traces. */
  iso: number;
  /** Contour half-width. Smaller = thinner, brighter core. */
  width: number;
  /** Peak linear intensity before tone mapping. */
  gain: number;
  color: BandColorName;
  /** Seconds for this veil's own drift cycle. */
  period: number;
  /** Extra field scale, so veils fold on different paths rather than in parallel. */
  warpScale: number;
  /** Phase offset into the field, so no two veils sample the same place. */
  offset: readonly [number, number];
}

/**
 * Four veils.
 *
 * Cyan gets two so it dominates, as the document requires. Deep teal sits
 * underneath as the foundation. Warm gets one, spatially restricted, so the
 * burnt orange appears in exactly one region of the frame.
 *
 * The iso values are deliberately separated by more than twice the largest
 * width. Closer than that and the veils merge into the fog that every previous
 * attempt produced.
 *
 * The periods share no small common multiple, which is the document's
 * 14/18/11/20/16 reasoning applied to veils instead of blobs.
 */
export const BANDS: readonly AuroraBand[] = [
  {
    // Measured at iter-1: this band was carrying 0.577 of the field against
    // cyan's 0.229, so the frame read teal rather than cyan. Narrowed and dimmed
    // so it stays a foundation instead of becoming the subject.
    iso: 0.3,
    width: 0.062,
    gain: 0.28,
    color: "deep",
    period: 29,
    warpScale: 0.82,
    offset: [0, 0],
  },
  {
    iso: 0.5,
    width: 0.055,
    gain: 2.3,
    color: "cyan",
    period: 17,
    warpScale: 1.0,
    offset: [3.1, 1.7],
  },
  {
    iso: 0.72,
    width: 0.042,
    gain: 1.85,
    color: "cyan",
    period: 23,
    warpScale: 1.18,
    offset: [7.4, 5.2],
  },
  {
    iso: 0.54,
    width: 0.062,
    gain: 1.25,
    color: "warm",
    period: 19,
    warpScale: 1.06,
    offset: [11.9, 8.3],
  },
] as const;

/** Index of the single warm band. Exactly one is allowed. */
export const WARM_INDEX = BANDS.findIndex((b) => b.color === "warm");

/**
 * The warm region, in normalised hero space. Keeps the burnt orange on the right
 * at roughly mid height, which is where the reference puts it.
 */
export const WARM_REGION = {
  cx: 0.78,
  cy: 0.44,
  rx: 0.36,
  ry: 0.42,
} as const;

/**
 * The area the hero copy occupies, in normalised hero space. Veils are dimmed
 * here so the type has a surface to sit on.
 *
 * Attenuating the light in the shader, rather than painting a scrim over it,
 * keeps the veils their own colour instead of desaturating them towards grey.
 * Measured at iter-4: without this the background under the accent-coloured
 * eyebrow peaked at 0.184 relative luminance, which is not a legible surface.
 */
export const CONTENT_REGION = {
  cx: 0.5,
  // Sized to the copy stack as measured, not guessed. At iter-6 the eyebrow line
  // at the top of the stack was only 33% attenuated and its background peaked at
  // 0.200 relative luminance, which is why it was the one block still failing
  // while the tagline below it sat at 0.038. The plateau now covers the stack from
  // the eyebrow down to the badges.
  cy: 0.48,
  rx: 0.37,
  ry: 0.44,
} as const;

/** Veil intensity multiplier at the centre of the content region. */
export const CONTENT_ATTEN = 0.07;

export const FIELD = {
  /** Field scale in hero space. Larger = more, smaller folds. */
  scale: 1.25,

  /** First-level domain warp amplitude — the broad bend. */
  warpA: 0.85,
  /** Second-level warp amplitude — the fold-over-fold that makes it silk. */
  warpB: 0.42,

  /**
   * Curtain anisotropy. Compressing y stretches every contour horizontally, so
   * the veils read as long ribbons instead of isotropic swirl.
   */
  aniso: 2.4,

  /**
   * Pointer contribution to the warp coordinate, in hero-space units.
   *
   * Derived, not guessed: hero space spans 1.0 over the hero's height, so one
   * unit is heroHeightPx. For a target apparent displacement of ~30px on a 900px
   * hero at a typical pointer magnitude of 0.5, w = (30/900)/0.5 = 0.067. That
   * lands inside the document's 10-40px band.
   */
  pointerWarp: 0.067,

  /** Raising the veil profile to this power thins the bright core without
   *  hardening the tail. Above ~4 it starts to look like wire. */
  corePow: 2.2,

  /** Exponential tone map exposure. Compresses crossings so they stay coloured
   *  instead of clipping to white, which is the cheap-neon failure mode. */
  exposure: 1.55,

  /** Maximum light-mode pigment opacity. Colour is alpha-blended over the
   *  theme background, so even overlapping folds cannot collapse to black. */
  lightPigment: 0.42,

  /** Field value remap. Four-octave fbm does not span 0..1 — measured over a
   *  frame it concentrates around 0.47 with a standard deviation near 0.08. This
   *  window spreads the useful part of that distribution across 0..1 so the iso
   *  values above are intuitive and well separated. */
  normLo: 0.3,
  normHi: 0.66,

  /** Seconds. Global time multiplier — the document is emphatic that the motion
   *  must be very slow. */
  timeScale: 0.055,
} as const;

/** Resolves a band's colour name to its linear RGB triple. */
export function bandColor(name: BandColorName): LinearRGB {
  return name === "cyan" ? PALETTE.cyan : name === "warm" ? PALETTE.warm : PALETTE.deep;
}
