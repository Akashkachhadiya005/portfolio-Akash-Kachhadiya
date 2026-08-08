/**
 * Objective metrics for the hero background field.
 *
 * WHY NOT A PIXEL DIFF. Playwright's toHaveScreenshot compares pixel by pixel
 * against a stored baseline. That is the right tool for catching regressions and
 * the wrong tool for "does this procedural field resemble the reference mockup" —
 * a pixel diff between two renders of a noise field reads as 100% different while
 * looking identical to a human. So these metrics measure the QUALITIES the
 * reference has, as distributions.
 *
 * The two decisive ones:
 *
 *   ridgeP95      95th percentile Sobel gradient magnitude. A thin bright core
 *                 has a steep gradient perpendicular to itself. Blurred radial
 *                 blobs are gentle absolutely everywhere. This single number is
 *                 the difference between "veils" and "fog".
 *
 *   bandCrossings Sign changes of dL/dy along vertical scanlines. Stacked veils
 *                 make a scanline alternate light/dark repeatedly; a field of
 *                 five overlapping blobs alternates once or twice.
 *
 * TWO CORRECTIONS THE CONTROL RUN FORCED, both of which would have made every
 * later measurement meaningless:
 *
 *  1. PATTERN METRICS MUST BE MEASURED ON THE FIELD ALONE. The first control run
 *     scored the current blob implementation at ridgeP95 0.048 and bandCrossings
 *     7.0 — comfortably "passing" — because the crop contained the white hero
 *     headline. Text edges are the steepest gradients on the page by a wide
 *     margin, so the metrics were measuring typography, not the background. The
 *     capture script now hides the hero content and shoots the field on its own.
 *
 *  2. NEGATIVE SPACE AND BLOWOUT MUST BE DEFINED RELATIVE TO THE BASE, NOT TO
 *     BLACK. "darkRatio = luminance < 0.06" is meaningless in light mode, where
 *     the negative space is white: it read 0.027 and "failed" while the field was
 *     in fact almost entirely negative space. Likewise "any channel >= 250"
 *     counted the near-white light-mode base itself as blown out, giving 0.14.
 *     Both are now measured against the theme's base colour, so the same number
 *     means the same thing in both themes.
 */

/** sRGB 0-255 palette anchors. The field must be expressible in these. */
export const ANCHORS = {
  baseDark: [0, 49, 53], // #003135 — active dark UI background token
  baseLight: [250, 255, 254], // #FAFFFE
  deep: [0, 49, 53], // #003135
  cyan: [15, 164, 175], // #0FA4AF
  warm: [150, 71, 52], // #964734
};

export function anchorSetFor(isDark) {
  return {
    base: isDark ? ANCHORS.baseDark : ANCHORS.baseLight,
    deep: ANCHORS.deep,
    cyan: ANCHORS.cyan,
    warm: ANCHORS.warm,
  };
}

/**
 * Runs INSIDE the page. Must be fully self-contained — Playwright serialises the
 * function source, so it cannot reference anything from module scope.
 *
 * @param regions optional [{name,x,y,w,h}] in capture pixels; returns the mean
 *                relative luminance of each, used for text-contrast checks.
 */
export async function browserMetrics({ dataUrl, anchors, baseTol, offTol, regions }) {
  const bitmap = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const w = bitmap.width;
  const h = bitmap.height;
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0);
  const { data } = ctx.getImageData(0, 0, w, h);
  const n = w * h;

  const srgbToLinear = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const relLum = (r, g, b) =>
    0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);

  const rgbToLab = (r, g, b) => {
    const R = srgbToLinear(r);
    const G = srgbToLinear(g);
    const B = srgbToLinear(b);
    let X = R * 0.4124564 + G * 0.3575761 + B * 0.1804375;
    let Y = R * 0.2126729 + G * 0.7151522 + B * 0.072175;
    let Z = R * 0.0193339 + G * 0.119192 + B * 0.9503041;
    X /= 0.95047;
    Z /= 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const fx = f(X);
    const fy = f(Y);
    const fz = f(Z);
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  };

  /** CIEDE2000. Worth the length: this is the metric that guards the palette. */
  const deltaE00 = (lab1, lab2) => {
    const [L1, a1, b1] = lab1;
    const [L2, a2, b2] = lab2;
    const C1 = Math.hypot(a1, b1);
    const C2 = Math.hypot(a2, b2);
    const Cb = (C1 + C2) / 2;
    const Cb7 = Math.pow(Cb, 7);
    const G = 0.5 * (1 - Math.sqrt(Cb7 / (Cb7 + Math.pow(25, 7))));
    const a1p = (1 + G) * a1;
    const a2p = (1 + G) * a2;
    const C1p = Math.hypot(a1p, b1);
    const C2p = Math.hypot(a2p, b2);
    const h1 = ((Math.atan2(b1, a1p) * 180) / Math.PI + 360) % 360;
    const h2 = ((Math.atan2(b2, a2p) * 180) / Math.PI + 360) % 360;
    const dLp = L2 - L1;
    const dCp = C2p - C1p;
    let dhp = 0;
    if (C1p * C2p !== 0) {
      dhp = h2 - h1;
      if (dhp > 180) dhp -= 360;
      else if (dhp < -180) dhp += 360;
    }
    const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * Math.PI) / 360);
    const Lbp = (L1 + L2) / 2;
    const Cbp = (C1p + C2p) / 2;
    let Hbp;
    if (C1p * C2p === 0) Hbp = h1 + h2;
    else if (Math.abs(h1 - h2) <= 180) Hbp = (h1 + h2) / 2;
    else Hbp = h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
    const T =
      1 -
      0.17 * Math.cos(((Hbp - 30) * Math.PI) / 180) +
      0.24 * Math.cos((2 * Hbp * Math.PI) / 180) +
      0.32 * Math.cos(((3 * Hbp + 6) * Math.PI) / 180) -
      0.2 * Math.cos(((4 * Hbp - 63) * Math.PI) / 180);
    const dTheta = 30 * Math.exp(-Math.pow((Hbp - 275) / 25, 2));
    const Cbp7 = Math.pow(Cbp, 7);
    const Rc = 2 * Math.sqrt(Cbp7 / (Cbp7 + Math.pow(25, 7)));
    const Sl =
      1 + (0.015 * Math.pow(Lbp - 50, 2)) / Math.sqrt(20 + Math.pow(Lbp - 50, 2));
    const Sc = 1 + 0.045 * Cbp;
    const Sh = 1 + 0.015 * Cbp * T;
    const Rt = -Math.sin((2 * dTheta * Math.PI) / 180) * Rc;
    return Math.sqrt(
      Math.pow(dLp / Sl, 2) +
        Math.pow(dCp / Sc, 2) +
        Math.pow(dHp / Sh, 2) +
        Rt * (dCp / Sc) * (dHp / Sh),
    );
  };

  // ---------- luminance field ----------
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    lum[i] = relLum(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
  }
  let mean = 0;
  for (let i = 0; i < n; i++) mean += lum[i];
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (lum[i] - mean) ** 2;
  const luminanceStdDev = Math.sqrt(variance / n);

  // ---------- palette classification, base-relative ----------
  // Negative space = "close to the base colour", which is black in dark mode and
  // white in light mode. Colour shares are computed among the NON-base pixels
  // only, otherwise the huge negative-space area drowns every veil out.
  const anchorNames = Object.keys(anchors);
  const anchorLabs = {};
  for (const k of anchorNames) anchorLabs[k] = rgbToLab(...anchors[k]);

  const veilNames = anchorNames.filter((k) => k !== "base");
  const shares = {};
  for (const k of veilNames) shares[k] = 0;

  let sampled = 0;
  let baseCount = 0;
  let veilCount = 0;
  let fidelitySum = 0;
  let offPalette = 0;
  let blowout = 0;

  // Per-lit-pixel luminance and class, so the BRIGHT CORES can be scored
  // separately from the field as a whole. See the note on coreCyanShare below.
  const litLum = [];
  const litClass = [];

  // Every 4th pixel in each direction. CIEDE2000 is the expensive part of this
  // pass — at step 2 a full matrix run took over 15 minutes and timed out. The
  // distribution is stable long before 1/16 sampling, so this costs nothing in
  // accuracy and cuts the classification work by four.
  const step = 4;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = y * w + x;
      const r = data[i * 4];
      const g = data[i * 4 + 1];
      const b = data[i * 4 + 2];
      sampled++;
      const lab = rgbToLab(r, g, b);

      const dBase = deltaE00(lab, anchorLabs.base);
      if (dBase <= baseTol) {
        baseCount++;
        continue;
      }

      // A veil pixel. Which palette colour is it, how far off palette is it, and
      // did it lose its hue to a white blowout?
      let best = Infinity;
      let bestName = veilNames[0];
      for (const k of veilNames) {
        const d = deltaE00(lab, anchorLabs[k]);
        if (d < best) {
          best = d;
          bestName = k;
        }
      }
      // The base itself can still be the nearest anchor for a faint veil; keep
      // that comparison so fidelity is not overstated.
      const bestAny = Math.min(best, dBase);

      shares[bestName]++;
      fidelitySum += bestAny;
      if (bestAny > offTol) offPalette++;
      if (r >= 250 && g >= 250 && b >= 250) blowout++;
      litLum.push(lum[i]);
      litClass.push(bestName);
      veilCount++;
    }
  }

  const veilSafe = Math.max(1, veilCount);
  for (const k of veilNames) shares[k] = shares[k] / veilSafe;

  /**
   * TWO REPLACEMENTS FOR A BROKEN METRIC.
   *
   * `shares.cyan` was originally gated at >= 0.4 to encode the document's "cyan
   * should be the dominant accent". It cannot do that job. `#003135` and
   * `#0FA4AF` are the SAME HUE at different lightness — the palette contains both
   * deliberately — so nearest-anchor classification separates them by brightness,
   * not by colour. Every dim cyan pixel therefore classifies as deep teal, and
   * across three iterations of raising the cyan gains by 60% the number moved
   * from 0.229 to 0.234. The measure was ill-posed, not the render.
   *
   * These two are well-posed:
   *
   *   tealVsWarm     teal family (deep + cyan) against the warm family. Those ARE
   *                  different hues, so the comparison is meaningful, and it is
   *                  the actual constraint: cyan/teal dominant, orange sparing.
   *   coreCyanShare  among the brightest 5% of lit pixels, how many are the
   *                  bright cyan rather than deep teal or warm. This is what
   *                  "dominant accent" means to a viewer: the veil CORES read
   *                  cyan. A dim cyan is still cyan; a dim core is not a core.
   */
  const tealCount = shares.deep * veilSafe + shares.cyan * veilSafe;
  const warmCount = shares.warm * veilSafe;
  const tealVsWarm = tealCount + warmCount > 0 ? tealCount / (tealCount + warmCount) : 0;

  let coreCyanShare = 0;
  if (litLum.length > 20) {
    const order = litLum
      .map((v, i) => [v, i])
      .sort((a, b) => b[0] - a[0])
      .slice(0, Math.max(1, Math.floor(litLum.length * 0.05)));
    let cyanCores = 0;
    for (const [, i] of order) if (litClass[i] === "cyan") cyanCores++;
    coreCyanShare = cyanCores / order.length;
  }

  // ---------- Sobel gradient and ridge detection ----------
  const gradMag = new Float32Array(n);
  const gradX = new Float32Array(n);
  const gradY = new Float32Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const tl = lum[i - w - 1];
      const t = lum[i - w];
      const tr = lum[i - w + 1];
      const l = lum[i - 1];
      const r = lum[i + 1];
      const bl = lum[i + w - 1];
      const bo = lum[i + w];
      const br = lum[i + w + 1];
      const gx = tl + 2 * l + bl - (tr + 2 * r + br);
      const gy = tl + 2 * t + tr - (bl + 2 * bo + br);
      gradX[i] = gx;
      gradY[i] = gy;
      gradMag[i] = Math.hypot(gx, gy);
    }
  }
  // Histogram percentile rather than a full sort. Sorting a 1.3M-element array
  // per capture was the other half of the timeout; 2048 bins over the observed
  // range resolves these percentiles far finer than the thresholds need.
  const BINS = 2048;
  let gradMax = 0;
  for (let i = 0; i < n; i++) if (gradMag[i] > gradMax) gradMax = gradMag[i];
  const scaleBin = gradMax > 0 ? (BINS - 1) / gradMax : 0;
  const hist = new Int32Array(BINS);
  for (let i = 0; i < n; i++) hist[Math.round(gradMag[i] * scaleBin)]++;

  const percentileFromHist = (q) => {
    const want = q * n;
    let acc = 0;
    for (let b = 0; b < BINS; b++) {
      acc += hist[b];
      if (acc >= want) return gradMax > 0 ? (b / (BINS - 1)) * gradMax : 0;
    }
    return gradMax;
  };
  const ridgeP95 = percentileFromHist(0.95);
  const ridgeP99 = percentileFromHist(0.99);

  const sampleLum = (fx, fy) => {
    const xi = Math.round(fx);
    const yi = Math.round(fy);
    if (xi < 0 || yi < 0 || xi >= w || yi >= h) return -1;
    return lum[yi * w + xi];
  };
  let ridgeCount = 0;
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const i = y * w + x;
      const g = gradMag[i];
      if (g < 0.02) continue;
      const nx = gradX[i] / g;
      const ny = gradY[i] / g;
      const a = sampleLum(x + nx * 2, y + ny * 2);
      const b = sampleLum(x - nx * 2, y - ny * 2);
      if (lum[i] > a && lum[i] > b) ridgeCount++;
    }
  }

  // ---------- band crossings along vertical scanlines ----------
  const SCANLINES = 9;
  const SMOOTH = Math.max(3, Math.round(h * 0.012));
  let crossingTotal = 0;
  for (let s = 0; s < SCANLINES; s++) {
    const x = Math.floor(((s + 0.5) / SCANLINES) * w);
    const col = new Float32Array(h);
    for (let y = 0; y < h; y++) col[y] = lum[y * w + x];
    const sm = new Float32Array(h);
    for (let y = 0; y < h; y++) {
      let acc = 0;
      let cnt = 0;
      for (let k = -SMOOTH; k <= SMOOTH; k++) {
        const yy = y + k;
        if (yy < 0 || yy >= h) continue;
        acc += col[yy];
        cnt++;
      }
      sm[y] = acc / cnt;
    }
    let lastSign = 0;
    let extremum = sm[0];
    for (let y = 1; y < h; y++) {
      const d = sm[y] - sm[y - 1];
      const sign = d > 0 ? 1 : d < 0 ? -1 : 0;
      if (sign === 0) continue;
      if (lastSign === 0) {
        lastSign = sign;
        extremum = sm[y];
        continue;
      }
      if (sign !== lastSign && Math.abs(sm[y] - extremum) > 0.025) {
        crossingTotal++;
        extremum = sm[y];
        lastSign = sign;
      }
    }
  }

  // ---------- optional regions, for text contrast ----------
  const regionLum = {};
  if (Array.isArray(regions)) {
    for (const rg of regions) {
      const x0 = Math.max(0, Math.round(rg.x));
      const y0 = Math.max(0, Math.round(rg.y));
      const x1 = Math.min(w, Math.round(rg.x + rg.w));
      const y1 = Math.min(h, Math.round(rg.y + rg.h));
      let acc = 0;
      let mx = 0;
      const vals = [];
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const v = lum[y * w + x];
          acc += v;
          if (v > mx) mx = v;
          vals.push(v);
        }
      }
      if (!vals.length) {
        regionLum[rg.name] = null;
        continue;
      }
      vals.sort((a, b) => a - b);
      // p95, not max. A single brightest pixel does not determine whether a glyph
      // is legible — the local background does. Gating on the absolute max made
      // one outlier pixel fail an entire text block, which is stricter than WCAG
      // intends and not actionable. p95 still catches a bright veil crossing
      // under the type, which is the real risk.
      regionLum[rg.name] = {
        mean: acc / vals.length,
        max: mx,
        p95: vals[Math.floor(vals.length * 0.95)],
      };
    }
  }

  return {
    width: w,
    height: h,
    baseRatio: baseCount / Math.max(1, sampled),
    blowoutRatio: blowout / veilSafe,
    luminanceMean: mean,
    luminanceStdDev,
    ridgeP95,
    ridgeP99,
    ridgeRatio: ridgeCount / n,
    bandCrossings: crossingTotal / SCANLINES,
    paletteFidelity: veilCount ? fidelitySum / veilCount : 0,
    offPaletteRatio: veilCount ? offPalette / veilCount : 0,
    shares,
    tealVsWarm,
    coreCyanShare,
    regionLum,
  };
}

/**
 * Tier 1 thresholds — absolute, always active, measured on the FIELD ONLY.
 *
 * Each is defensible from the geometry of the target rather than picked to suit a
 * particular render:
 *
 *   ridgeP95 / ridgeRatio  a thin bright core must produce a steep gradient and a
 *                          crest somewhere. Blurred blobs cannot.
 *   bandCrossings          a stack of veils must alternate light and dark
 *                          repeatedly down a scanline.
 *   baseRatio              the reference is mostly negative space; the veils are
 *                          the minority of the frame, not a wash over it.
 *   luminanceStdDev        flat fog has a narrow spread, banded veils a wide one.
 *   shares / palette       the palette constraint, which is the one thing every
 *                          attempt so far has been judged on.
 *
 * Tier 2 supersedes these if reference crops appear at
 * reference/portfolio-images/hero-aurora/crops/. See loadTier2Thresholds.
 */
export const TIER1 = {
  baseRatio: { min: 0.3, max: 0.82 },
  blowoutRatio: { max: 0.01 },
  luminanceStdDev: { min: 0.07 },
  ridgeP95: { min: 0.02 },
  ridgeRatio: { min: 0.015 },
  bandCrossings: { min: 2.5 },
  paletteFidelity: { max: 22 },
  offPaletteRatio: { max: 0.1 },
  /** Teal family must outweigh the warm accent. Different hues, so well-posed. */
  tealVsWarm: { min: 0.65 },
  /** The bright veil cores must read as cyan, which is what "cyan is the dominant
   *  accent" means visually. Replaces the ill-posed shares.cyan gate. */
  coreCyanShare: { min: 0.5 },
  /** Warm stays present but sparing. */
  "shares.warm": { min: 0.03, max: 0.3 },
};

/** WCAG contrast ratio between two relative luminances. */
export function contrastRatio(l1, l2) {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

/** Relative luminance of a `rgb(r, g, b)` string. */
export function cssColorLuminance(css) {
  const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)/.exec(css);
  if (!m) return null;
  const lin = (c) => {
    const v = Number(c) / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(m[1]) + 0.7152 * lin(m[2]) + 0.0722 * lin(m[3]);
}

/**
 * Light mode is an ADAPTATION of a dark reference, not a copy of it. On a white
 * base the negative space is white, and a white base plus a readability scrim
 * will always leave a larger share of the frame near the base colour than a
 * near-black one does. Holding both themes to the dark reference's negative-space
 * ratio would be measuring the wrong thing.
 */
export function thresholdsFor(theme) {
  if (theme !== "light") return TIER1;
  return { ...TIER1, baseRatio: { min: 0.35, max: 0.9 } };
}

export function pick(metrics, key) {
  return key.split(".").reduce((o, k) => (o == null ? undefined : o[k]), metrics);
}

export function violations(metrics, thresholds) {
  const out = [];
  for (const [key, rule] of Object.entries(thresholds)) {
    const v = pick(metrics, key);
    if (typeof v !== "number" || Number.isNaN(v)) {
      out.push({ key, rule, actual: v, why: "missing" });
      continue;
    }
    if (rule.min !== undefined && v < rule.min) {
      out.push({ key, rule, actual: v, why: `below min ${rule.min}` });
    }
    if (rule.max !== undefined && v > rule.max) {
      out.push({ key, rule, actual: v, why: `above max ${rule.max}` });
    }
  }
  return out;
}

export function formatMetrics(label, m) {
  const f = (x, d = 4) => (typeof x === "number" ? x.toFixed(d) : String(x));
  return [
    `${label}`,
    `  baseRatio        ${f(m.baseRatio)}   <- negative space`,
    `  luminanceStdDev  ${f(m.luminanceStdDev)}`,
    `  ridgeP95         ${f(m.ridgeP95)}   <- veils vs fog`,
    `  ridgeRatio       ${f(m.ridgeRatio)}`,
    `  bandCrossings    ${f(m.bandCrossings, 2)}   <- veils vs blobs`,
    `  blowoutRatio     ${f(m.blowoutRatio)}`,
    `  paletteFidelity  ${f(m.paletteFidelity, 2)} dE00`,
    `  offPaletteRatio  ${f(m.offPaletteRatio)}`,
    `  tealVsWarm       ${f(m.tealVsWarm, 3)}`,
    `  coreCyanShare    ${f(m.coreCyanShare, 3)}   <- are the bright cores cyan`,
    `  shares           deep ${f(m.shares?.deep, 3)}  cyan ${f(m.shares?.cyan, 3)}  warm ${f(m.shares?.warm, 3)}`,
  ].join("\n");
}
