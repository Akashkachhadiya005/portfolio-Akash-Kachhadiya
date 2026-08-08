import { BANDS, FIELD } from "./field-config";

/**
 * The aurora field, as GLSL.
 *
 * THE ONE IDEA THAT MATTERS, and the reason four previous attempts failed:
 *
 * A smooth noise field used AS brightness gives fog. Veils come from the field's
 * LEVEL SETS, not from its value. So instead of drawing `f`, this draws a narrow
 * Gaussian band around a chosen iso-value:
 *
 *     veil = exp(-((f - iso) / width)^2)
 *
 * That is brightest exactly where `f == iso`, which is a CONTOUR of the field,
 * and it falls off in the direction `f` changes fastest — which is normal to that
 * contour. Three consequences, and they are precisely the three properties the
 * reference image has and blurred blobs cannot produce:
 *
 *   folded ribbons   the contour of a twice-domain-warped fBm field is a long,
 *                    smooth curve that bends back across itself
 *   thin bright core with soft perpendicular falloff
 *   dark interiors   the space between successive contours receives nothing, so
 *                    the inside of a bend stays dark
 *
 * For contrast, a CSS radial gradient is a function of distance from a point, so
 * its level sets are nested convex ellipses. Compositing five of them makes the
 * inside of any bend BRIGHTER than the bend, because it is nearer the centres.
 * Not merely hard — inverted. That is why the previous implementation measured
 * ridgeRatio 0.0000: it contained no ridges at all.
 *
 * Gaussian rather than smoothstep for the band profile, deliberately: exp has no
 * support boundary, so no veil ever terminates at a definite radius and there is
 * no hard edge anywhere in the frame.
 */

const BAND_COUNT = BANDS.length;

export const VERTEX_SHADER = /* glsl */ `
attribute vec2 aPos;
void main() {
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

export function buildFragmentShader(): string {
  return /* glsl */ `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

#define BAND_COUNT ${BAND_COUNT}
#define FIELD_SCALE ${FIELD.scale.toFixed(4)}
#define WARP_A ${FIELD.warpA.toFixed(4)}
#define WARP_B ${FIELD.warpB.toFixed(4)}
#define ANISO ${FIELD.aniso.toFixed(4)}
#define POINTER_W ${FIELD.pointerWarp.toFixed(5)}
#define CORE_POW ${FIELD.corePow.toFixed(4)}
#define EXPOSURE ${FIELD.exposure.toFixed(4)}
#define LIGHT_PIGMENT ${FIELD.lightPigment.toFixed(4)}
#define NORM_LO ${FIELD.normLo.toFixed(4)}
#define NORM_HI ${FIELD.normHi.toFixed(4)}
#define TIME_SCALE ${FIELD.timeScale.toFixed(5)}

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointer;    // eased, -1..1
uniform float uIsDark;     // 0 | 1
uniform float uIntensity;
uniform vec3  uBase;       // linear light
uniform int   uOctaves;

// iso, width, gain, warpScale
uniform vec4 uBandA[BAND_COUNT];
// offsetX, offsetY, period, isWarm
uniform vec4 uBandB[BAND_COUNT];
uniform vec3 uBandCol[BAND_COUNT];

// cx, cy, rx, ry  in normalised hero space
uniform vec4 uWarmRegion;

// cx, cy, rx, ry of the area the hero copy occupies
uniform vec4 uContentRegion;
// Veil intensity multiplier at the centre of that area
uniform float uContentAtten;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Value noise with smootherstep interpolation. Gradient noise would be a touch
// smoother per octave and costs more ALU; once the band extraction has had its
// way with the field the difference is not visible.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Four octaves, each rotated so the lattice never lines up into visible squares.
// The running sum can never exceed 1 regardless of where the loop is cut, which
// is what lets low-power devices drop to three octaves without rescaling.
float fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    if (i >= octaves) break;
    sum += amp * noise(p);
    p = rot * p * 2.03;
    amp *= 0.5;
  }
  return sum;
}

// Spreads the useful part of the fBm distribution across 0..1 so the iso values
// in field-config.ts are intuitive and comfortably separated.
float fieldNorm(float f) {
  return clamp((f - NORM_LO) / (NORM_HI - NORM_LO), 0.0, 1.0);
}

// C1-continuous falloff. A hard-edged mask would put a visible boundary on the
// warm region, which is the most conspicuous colour in the frame.
float regionMask(vec2 uv, vec4 rg) {
  vec2 d = (uv - rg.xy) / rg.zw;
  return 1.0 - smoothstep(0.55, 1.60, length(d));
}

/**
 * Dims the veils where the hero copy sits, so the type has a surface to sit on.
 *
 * Done HERE rather than only with a CSS scrim, and the difference matters: a
 * scrim paints base colour on top of the veils, which desaturates them towards
 * grey. Attenuating the light before it is tone-mapped keeps every veil its own
 * colour and simply makes it dimmer in that region — better looking and better
 * for contrast at the same time.
 *
 * This is also what the reference does compositionally: its copy sits on a dark
 * area and the bright field is elsewhere in the frame.
 */
float contentAtten(vec2 uv) {
  vec2 d = (uv - uContentRegion.xy) / uContentRegion.zw;
  // Broad plateau then a long ramp: the whole copy column stays quiet, and the
  // field comes back gradually enough that the transition is never visible. The
  // net composition is the reference's — bright veils beside the copy rather than
  // behind it.
  float outside = smoothstep(0.58, 1.45, length(d));
  return mix(uContentAtten, 1.0, outside);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / max(uRes.y, 1.0);

  // Hero space, aspect-corrected so the pattern never stretches with the window.
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * FIELD_SCALE * 2.0;

  float t = uTime * TIME_SCALE;
  int oct = uOctaves;

  // ---- two-level domain warp: this is what bends straight contours into silk
  vec2 w1 = vec2(
    fbm(p * 1.10 + vec2(0.00, t * 1.05), oct),
    fbm(p * 1.10 + vec2(5.20, 1.30) + vec2(-t * 0.85, t * 0.35), oct)
  ) - 0.5;

  vec2 q = p + WARP_A * w1;

  // Warping the already-warped coordinate is what produces a curve that folds
  // back across itself rather than merely bending once.
  vec2 w2 = vec2(
    fbm(q * 2.30 + vec2(1.70, t * 1.35), oct),
    fbm(q * 2.30 + vec2(9.20, 2.80) + vec2(t * 0.60, -t * 0.45), oct)
  ) - 0.5;

  // The pointer displaces the SAMPLING COORDINATE, so the veils reorganise
  // around the cursor instead of sliding past it as objects would.
  vec2 r = q + WARP_B * w2 + POINTER_W * uPointer;

  // Curtain stretch: long horizontal ribbons rather than isotropic swirl.
  r.y *= ANISO;

  vec3 light = vec3(0.0);         // emitted, for dark mode
  vec3 pigmentSum = vec3(0.0);    // palette-weighted colour, for light mode
  float pigmentWeight = 0.0;      // bounded later into translucent coverage

  for (int k = 0; k < BAND_COUNT; k++) {
    vec4 a = uBandA[k];  // iso, width, gain, warpScale
    vec4 b = uBandB[k];  // offX, offY, period, isWarm

    // Each veil samples the warped field at its own scale and phase, so no two
    // are parallel copies of one another.
    float fk = fieldNorm(
      fbm(r * a.w + b.xy + vec2(0.0, uTime * TIME_SCALE / b.z), oct)
    );

    float d = (fk - a.x) / a.y;
    float v = pow(exp(-d * d), CORE_POW) * a.z;

    // Exactly one band is warm, and it is confined to a single region.
    if (b.w > 0.5) {
      v *= regionMask(uv, uWarmRegion);
    }

    vec3 c = uBandCol[k];
    light += v * c;
    pigmentSum += v * c;
    pigmentWeight += v;
  }

  float atten = uIntensity * contentAtten(uv);
  light *= atten;
  pigmentSum *= atten;
  pigmentWeight *= atten;

  // Additive accumulation exceeds 1.0 where veils cross. Clamping there sends the
  // crossing to flat white, which is the cheap-neon look the reference document
  // warns about and which also destroys the sense of depth, because clipped white
  // has no shape left in it. Exponential tone mapping compresses the highlight
  // instead, so a crossing stays cyan and merely reads brighter.
  vec3 mapped = vec3(1.0) - exp(-light * EXPOSURE);

  // Light mode is translucent palette pigment over the UI background—not
  // subtractive absorption. The old complement subtraction could drive several
  // overlapping folds to zero and produced the black marble patches seen after
  // switching themes. Normalising the accumulated colour preserves its hue;
  // bounded coverage guarantees the theme background always remains visible.
  vec3 pigmentColor = pigmentSum / max(pigmentWeight, 0.0001);
  float pigmentCoverage =
    (1.0 - exp(-pigmentWeight * EXPOSURE)) * LIGHT_PIGMENT;

  vec3 col = uIsDark > 0.5
    // Dark: emitted light is added to the active UI background token.
    ? uBase + mapped
    // Light: the exact same geometry becomes soft translucent colour on white.
    : mix(uBase, pigmentColor, clamp(pigmentCoverage, 0.0, LIGHT_PIGMENT));

  col = clamp(col, 0.0, 1.0);

  // linear -> sRGB
  vec3 lo = col * 12.92;
  vec3 hi = 1.055 * pow(col, vec3(1.0 / 2.4)) - 0.055;
  vec3 srgb = mix(hi, lo, step(col, vec3(0.0031308)));

  // One LSB of dither. Eight-bit output across a very dark, very smooth gradient
  // stair-steps visibly; a single hash removes it. This is also why the field
  // needs no separate CSS grain layer.
  srgb += (hash(gl_FragCoord.xy) - 0.5) / 255.0;

  gl_FragColor = vec4(clamp(srgb, 0.0, 1.0), 1.0);
}
`;
}
