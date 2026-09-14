import {
  BANDS,
  FIELD,
  WARM_REGION,
  CONTENT_REGION,
  CONTENT_ATTEN,
  bandColor,
  type LinearRGB,
} from "./field-config";
import { VERTEX_SHADER, buildFragmentShader } from "./shader";

/**
 * WebGL lifecycle and the render loop. Framework-free on purpose.
 *
 * No React import, so this cannot trip the React Compiler rules and can be
 * reasoned about on its own. Everything mutable lives in plain locals captured by
 * the loop closure — never in a value returned from a hook, which is what
 * `react-hooks/immutability` forbids.
 *
 * One draw call per frame, one full-screen triangle, zero allocations on the
 * frame path: every typed array the uniforms need is built once during init. A
 * per-frame allocation is what turns a smooth field into a GC sawtooth.
 */

export interface AuroraRendererOptions {
  canvas: HTMLCanvasElement;
  isDark: boolean;
  baseLinear: LinearRGB;
  intensity: number;
  resolutionScale: number;
  frameCap: number;
  octaves: number;
}

export interface AuroraRenderer {
  /** Eased pointer, each component in [-1, 1]. Cheap; safe to call per frame. */
  setPointer(x: number, y: number): void;
  setTheme(isDark: boolean, baseLinear: LinearRGB): void;
  /** CSS pixel size of the host; recomputes the backing store. */
  resize(cssWidth: number, cssHeight: number): void;
  /** Pin the clock for reproducible screenshots. null = live. */
  setFrozenTime(seconds: number | null): void;
  start(): void;
  stop(): void;
  dispose(): void;
}

function compile(
  gl: WebGLRenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[aurora] shader compile failed:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function createAuroraRenderer(
  options: AuroraRendererOptions,
): AuroraRenderer | null {
  const { canvas } = options;

  const gl =
    (canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
      preserveDrawingBuffer: false,
    }) as WebGLRenderingContext | null) ?? null;

  if (!gl) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fs = compile(gl, gl.FRAGMENT_SHADER, buildFragmentShader());
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[aurora] link failed:", gl.getProgramInfoLog(program));
    }
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);

  // A single full-screen TRIANGLE, not a quad: covers the viewport with three
  // vertices instead of six and rasterises without a diagonal seam.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  const aPos = gl.getAttribLocation(program, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const loc = {
    res: gl.getUniformLocation(program, "uRes"),
    time: gl.getUniformLocation(program, "uTime"),
    pointer: gl.getUniformLocation(program, "uPointer"),
    isDark: gl.getUniformLocation(program, "uIsDark"),
    intensity: gl.getUniformLocation(program, "uIntensity"),
    base: gl.getUniformLocation(program, "uBase"),
    octaves: gl.getUniformLocation(program, "uOctaves"),
    bandA: gl.getUniformLocation(program, "uBandA"),
    bandB: gl.getUniformLocation(program, "uBandB"),
    bandCol: gl.getUniformLocation(program, "uBandCol"),
    warmRegion: gl.getUniformLocation(program, "uWarmRegion"),
    contentRegion: gl.getUniformLocation(program, "uContentRegion"),
    contentAtten: gl.getUniformLocation(program, "uContentAtten"),
  };

  // Band data never changes at runtime, so it is uploaded once.
  const bandA = new Float32Array(BANDS.length * 4);
  const bandB = new Float32Array(BANDS.length * 4);
  const bandCol = new Float32Array(BANDS.length * 3);
  BANDS.forEach((b, i) => {
    bandA[i * 4 + 0] = b.iso;
    bandA[i * 4 + 1] = b.width;
    bandA[i * 4 + 2] = b.gain;
    bandA[i * 4 + 3] = b.warpScale;
    bandB[i * 4 + 0] = b.offset[0];
    bandB[i * 4 + 1] = b.offset[1];
    bandB[i * 4 + 2] = b.period;
    bandB[i * 4 + 3] = b.color === "warm" ? 1 : 0;
    const c = bandColor(b.color);
    bandCol[i * 3 + 0] = c[0];
    bandCol[i * 3 + 1] = c[1];
    bandCol[i * 3 + 2] = c[2];
  });
  gl.uniform4fv(loc.bandA, bandA);
  gl.uniform4fv(loc.bandB, bandB);
  gl.uniform3fv(loc.bandCol, bandCol);
  gl.uniform4f(
    loc.warmRegion,
    WARM_REGION.cx,
    WARM_REGION.cy,
    WARM_REGION.rx,
    WARM_REGION.ry,
  );
  gl.uniform4f(
    loc.contentRegion,
    CONTENT_REGION.cx,
    CONTENT_REGION.cy,
    CONTENT_REGION.rx,
    CONTENT_REGION.ry,
  );
  gl.uniform1f(loc.contentAtten, CONTENT_ATTEN);
  gl.uniform1f(loc.intensity, options.intensity);
  gl.uniform1i(loc.octaves, options.octaves);

  let isDark = options.isDark;
  let base = options.baseLinear;
  gl.uniform1f(loc.isDark, isDark ? 1 : 0);
  gl.uniform3f(loc.base, base[0], base[1], base[2]);

  let bufferW = 0;
  let bufferH = 0;
  let pointerX = 0;
  let pointerY = 0;
  let frozen: number | null = null;
  let raf = 0;
  let running = false;
  let epoch = 0;
  let elapsed = 0;
  let lastFrame = 0;
  let disposed = false;

  const frameCap = options.frameCap;
  const scale = options.resolutionScale;

  const draw = (t: number) => {
    gl.uniform1f(loc.time, t);
    gl.uniform2f(loc.pointer, pointerX, pointerY);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const frame = (now: number) => {
    if (!running || disposed) return;

    if (frameCap > 0) {
      const minDelta = 1000 / frameCap;
      if (now - lastFrame < minDelta) {
        raf = requestAnimationFrame(frame);
        return;
      }
    }
    lastFrame = now;

    if (frozen !== null) {
      draw(frozen);
    } else {
      elapsed = (now - epoch) / 1000;
      draw(elapsed);
    }

    raf = requestAnimationFrame(frame);
  };

  const api: AuroraRenderer = {
    setPointer(x, y) {
      pointerX = x;
      pointerY = y;
      // If stopped (e.g. hero is offscreen), do not draw or invoke GPU shader on pointer move.
      if (frozen !== null && !disposed && bufferW > 0) {
        draw(frozen);
      }
    },

    setTheme(nextDark, nextBase) {
      isDark = nextDark;
      base = nextBase;
      gl.uniform1f(loc.isDark, isDark ? 1 : 0);
      gl.uniform3f(loc.base, base[0], base[1], base[2]);
      // Theme changes may run inside a View Transition snapshot. Draw
      // immediately so that snapshot never captures uniforms from the old mode.
      if (bufferW > 0) draw(frozen ?? elapsed);
    },

    resize(cssWidth, cssHeight) {
      if (disposed) return;
      // A zero-size host happens during layout transients; creating a 0x0 backing
      // store throws in some drivers.
      if (cssWidth < 1 || cssHeight < 1) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let w = Math.round(cssWidth * dpr * scale);
      let h = Math.round(cssHeight * dpr * scale);

      // Hard ceiling, so an ultra-wide or 4K display cannot balloon the fill cost.
      const MAX_PIXELS = 1_150_000;
      if (w * h > MAX_PIXELS) {
        const k = Math.sqrt(MAX_PIXELS / (w * h));
        w = Math.max(1, Math.round(w * k));
        h = Math.max(1, Math.round(h * k));
      }

      if (w === bufferW && h === bufferH) return;
      bufferW = w;
      bufferH = h;
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      gl.uniform2f(loc.res, w, h);
      if (!running) draw(frozen ?? elapsed);
    },

    setFrozenTime(seconds) {
      frozen = seconds;
      if (bufferW > 0) draw(frozen ?? elapsed);
    },

    start() {
      if (running || disposed || frozen !== null) {
        // While frozen, keep drawing the frozen frame rather than advancing.
        if (frozen !== null && bufferW > 0) draw(frozen);
        return;
      }
      running = true;
      // Rebase the clock so a hidden-tab gap does not jump the field forward.
      epoch = performance.now() - elapsed * 1000;
      lastFrame = 0;
      raf = requestAnimationFrame(frame);
    },

    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },

    dispose() {
      disposed = true;
      running = false;
      cancelAnimationFrame(raf);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      // Free the context eagerly rather than waiting for GC. Navigating away and
      // back must not accumulate contexts — browsers cap them at around 16.
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    },
  };

  return api;
}

export { FIELD };
