/**
 * Captures the hero across viewports, themes and cursor positions, then scores
 * every capture with the metrics in aurora-metrics.mjs.
 *
 * Usage (the server must ALREADY be running as a background process):
 *   node scripts/aurora-capture.mjs --url http://localhost:3131 --label control
 *   node scripts/aurora-capture.mjs --url http://localhost:3131 --label iter-3 --quick
 *
 * TWO SHOTS PER STATE, and the reason matters:
 *
 *   field  the hero with its content hidden. All pattern metrics are measured
 *          here. The first control run scored the old blob background as
 *          "passing" ridgeP95 and bandCrossings purely because the white
 *          headline was in the crop — text edges are the steepest gradients on
 *          the page, so the metrics were grading typography.
 *   full   the hero as shipped. Used for coverage and as the visual artefact for
 *          side-by-side review.
 *
 * Text contrast is computed from the FIELD shot, sampled at the text rectangles,
 * because what matters is the luminance the type actually sits on.
 *
 * DETERMINISM. A procedural animated field cannot be compared across runs unless
 * the clock is pinned, so the page is expected to expose window.__aurora.freeze(t).
 * Where that hook is absent — the old blob implementation used as the control —
 * CSS animations are paused after a fixed settle instead.
 */

import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  browserMetrics,
  anchorSetFor,
  thresholdsFor,
  violations,
  formatMetrics,
  contrastRatio,
  cssColorLuminance,
} from "./aurora-metrics.mjs";

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const has = (name) => args.includes(`--${name}`);

const URL = getArg("url", "http://localhost:3131");
const LABEL = getArg("label", "run");
const QUICK = has("quick");
const OUT = path.join("test-results", "aurora", LABEL);

const BASE_TOL = 10; // dE00 within which a pixel counts as negative space
const OFF_TOL = 25; // dE00 beyond which a pixel is off-palette
const MIN_CONTRAST = 4.5;

const VIEWPORTS = QUICK
  ? [{ name: "laptop", width: 1440, height: 900, touch: false }]
  : [
      { name: "phone", width: 390, height: 844, touch: true },
      { name: "tablet", width: 820, height: 1180, touch: true },
      { name: "laptop", width: 1440, height: 900, touch: false },
      { name: "wide", width: 1920, height: 1080, touch: false },
    ];

const THEMES = ["dark", "light"];

/** Mirrors the four cursor positions shown in the owner's reference mock. */
const POINTERS = QUICK
  ? [{ name: "centre", x: 0.5, y: 0.5 }]
  : [
      { name: "centre", x: 0.5, y: 0.5 },
      { name: "upper-left", x: 0.2, y: 0.25 },
      { name: "lower-right", x: 0.8, y: 0.75 },
      { name: "upper-right", x: 0.85, y: 0.2 },
    ];

const FROZEN_TIMES = QUICK ? [7] : [7, 29];

const HIDE_CONTENT_CSS = `
  #hero > *:not(.aurora):not(.mesh):not([data-hero-bg]) { visibility: hidden !important; }
`;

async function freezeField(page, seconds) {
  const hasHook = await page.evaluate(
    () => typeof window.__aurora?.freeze === "function",
  );
  if (hasHook) {
    await page.evaluate((t) => window.__aurora.freeze(t), seconds);
    await page.evaluate(
      () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    );
    return "freeze-hook";
  }
  await page.addStyleTag({
    content: `*, *::before, *::after { animation-play-state: paused !important; }`,
  });
  return "css-paused";
}

async function domChecks(page) {
  return page.evaluate(() => {
    const hero = document.querySelector("#hero");
    const heroRect = hero?.getBoundingClientRect();
    const host =
      document.querySelector(".aurora") ??
      document.querySelector(".mesh") ??
      document.querySelector("[data-hero-bg]");
    const hostRect = host?.getBoundingClientRect();

    const coverage =
      heroRect && hostRect
        ? {
            left: Math.abs(hostRect.left - heroRect.left),
            top: Math.abs(hostRect.top - heroRect.top),
            right: Math.abs(hostRect.right - heroRect.right),
            bottom: Math.abs(hostRect.bottom - heroRect.bottom),
          }
        : null;

    const se = document.scrollingElement;
    const overflowX = se ? se.scrollWidth <= se.clientWidth + 1 : true;

    // Only text that actually sits on the FIELD. Button labels and cert-badge
    // pills have their own opaque surfaces, so measuring them against the
    // background is a false failure — the first control run reported 1.15:1 for
    // a white button label sampled against the white page behind the button.
    const blocks = [];
    for (const sel of ["#hero h1", "#hero p"]) {
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        if (r.width < 8 || r.height < 8) continue;
        blocks.push({
          name: `${sel}|${(el.textContent ?? "").slice(0, 18).replace(/\s+/g, " ")}`,
          x: r.left,
          y: r.top,
          w: r.width,
          h: r.height,
          color: getComputedStyle(el).color,
        });
      }
    }

    return {
      hero: heroRect
        ? { x: heroRect.left, y: heroRect.top, w: heroRect.width, h: heroRect.height }
        : null,
      hostMode: host?.getAttribute("data-mode") ?? null,
      hostClass: typeof host?.className === "string" ? host.className : null,
      coverage,
      overflowX,
      blocks,
    };
  });
}

async function measureFps(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const samples = [];
        let last = performance.now();
        const stop = last + 2500;
        const tick = (now) => {
          samples.push(now - last);
          last = now;
          if (now < stop) requestAnimationFrame(tick);
          else {
            samples.sort((a, b) => a - b);
            const med = samples[Math.floor(samples.length / 2)] || 16.7;
            resolve({ medianMs: med, fps: 1000 / med, frames: samples.length });
          }
        };
        requestAnimationFrame(tick);
      }),
  );
}

/** Zoom check: no horizontal overflow at 100 / 150 / 200 percent. */
async function zoomChecks(page) {
  const results = {};
  for (const z of [1, 1.5, 2]) {
    await page.evaluate((zz) => {
      document.documentElement.style.zoom = String(zz);
    }, z);
    await page.waitForTimeout(220);
    results[`zoom${Math.round(z * 100)}`] = await page.evaluate(() => {
      const se = document.scrollingElement;
      return se ? se.scrollWidth <= se.clientWidth + 1 : true;
    });
  }
  await page.evaluate(() => {
    document.documentElement.style.zoom = "";
  });
  await page.waitForTimeout(220);
  return results;
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = { label: LABEL, url: URL, at: new Date().toISOString(), captures: [] };

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
        hasTouch: vp.touch,
        colorScheme: theme === "dark" ? "dark" : "light",
      });
      // next-themes reads this on boot; setting it before any script runs avoids
      // a flash and avoids having to drive the toggle.
      await context.addInitScript((t) => window.localStorage.setItem("theme", t), theme);

      const page = await context.newPage();
      await page.goto(URL, { waitUntil: "networkidle" });
      await page.waitForSelector("#hero");
      await page.waitForTimeout(1800); // let entrance animations finish

      const dom = await domChecks(page);
      const fps = await measureFps(page);
      const zoom = await zoomChecks(page);

      const pointers = vp.touch ? [{ name: "none", x: null, y: null }] : POINTERS;

      for (const ptr of pointers) {
        if (ptr.x !== null && dom.hero) {
          await page.mouse.move(
            dom.hero.x + dom.hero.w * ptr.x,
            dom.hero.y + dom.hero.h * ptr.y,
          );
          await page.waitForTimeout(900); // past the ~500ms ease
        }

        for (const t of FROZEN_TIMES) {
          const mode = await freezeField(page, t);

          const clip = dom.hero
            ? {
                x: Math.max(0, dom.hero.x),
                y: Math.max(0, dom.hero.y),
                width: Math.min(vp.width, dom.hero.w),
                height: Math.min(vp.height, dom.hero.h),
              }
            : undefined;

          const name = `${vp.name}-${theme}-${ptr.name}-t${t}`;

          // ---- full shot: the artefact a human reviews
          const fullPng = await page.screenshot({ clip });
          await writeFile(path.join(OUT, `${name}-full.png`), fullPng);

          // ---- field shot: content hidden, this is what gets measured
          const hideHandle = await page.addStyleTag({ content: HIDE_CONTENT_CSS });
          const fieldPng = await page.screenshot({ clip });
          await writeFile(path.join(OUT, `${name}-field.png`), fieldPng);

          // Text rects, translated into capture-space coordinates.
          const regions = dom.blocks.map((b) => ({
            name: b.name,
            x: b.x - (clip?.x ?? 0),
            y: b.y - (clip?.y ?? 0),
            w: b.w,
            h: b.h,
          }));

          const metrics = await page.evaluate(browserMetrics, {
            dataUrl: `data:image/png;base64,${fieldPng.toString("base64")}`,
            anchors: anchorSetFor(theme === "dark"),
            baseTol: BASE_TOL,
            offTol: OFF_TOL,
            regions,
          });

          await hideHandle.evaluate((el) => el.remove());

          // ---- text contrast, from the field luminance under each block
          const contrasts = [];
          for (const b of dom.blocks) {
            const rl = metrics.regionLum?.[b.name];
            const textLum = cssColorLuminance(b.color);
            if (!rl || textLum === null) continue;
            contrasts.push({
              block: b.name,
              // p95 of the background under the block: robust to a single
              // outlier pixel, still sensitive to a veil crossing under the type.
              ratio: contrastRatio(textLum, rl.p95),
              meanRatio: contrastRatio(textLum, rl.mean),
              maxRatio: contrastRatio(textLum, rl.max),
            });
          }
          const minContrast = contrasts.length
            ? Math.min(...contrasts.map((c) => c.ratio))
            : null;

          const viol = violations(metrics, thresholdsFor(theme));
          if (minContrast !== null && minContrast < MIN_CONTRAST) {
            viol.push({
              key: "textContrast",
              rule: { min: MIN_CONTRAST },
              actual: minContrast,
              why: `below min ${MIN_CONTRAST}`,
            });
          }
          for (const [k, ok] of Object.entries(zoom)) {
            if (!ok) {
              viol.push({
                key: `overflowX.${k}`,
                rule: {},
                actual: false,
                why: "horizontal overflow",
              });
            }
          }
          if (dom.coverage) {
            const worst = Math.max(...Object.values(dom.coverage));
            if (worst > 1.5) {
              viol.push({
                key: "coverage",
                rule: { max: 1.5 },
                actual: worst,
                why: `host inset from hero by ${worst.toFixed(1)}px`,
              });
            }
          }

          report.captures.push({
            name,
            viewport: vp.name,
            theme,
            pointer: ptr.name,
            frozenTime: t,
            determinism: mode,
            metrics,
            minContrast,
            contrasts,
            violations: viol,
            dom: {
              hostMode: dom.hostMode,
              hostClass: dom.hostClass,
              coverage: dom.coverage,
              overflowX: dom.overflowX,
            },
            zoom,
            fps,
          });

          console.log(formatMetrics(`\n[${name}]  (${mode})`, metrics));
          console.log(
            `  textContrast     ${minContrast === null ? "n/a" : minContrast.toFixed(2)}:1`,
          );
          // Informational only, never gated. Headless Chromium falls back to
          // SwiftShader software rasterisation, so a shader's fps here says
          // nothing about the same shader on real hardware.
          console.log(`  fps (software)   ${fps.fps.toFixed(1)}`);
          if (viol.length) {
            for (const v of viol) {
              const a = typeof v.actual === "number" ? v.actual.toFixed(4) : v.actual;
              console.log(`    FAIL ${v.key} = ${a} (${v.why})`);
            }
          } else {
            console.log("    all Tier-1 thresholds pass");
          }
        }
      }

      await context.close();
    }
  }

  await browser.close();

  const failCounts = new Map();
  for (const c of report.captures) {
    for (const v of c.violations) {
      failCounts.set(v.key, (failCounts.get(v.key) ?? 0) + 1);
    }
  }
  report.summary = {
    captures: report.captures.length,
    failing: report.captures.filter((c) => c.violations.length > 0).length,
    byThreshold: Object.fromEntries(failCounts),
  };

  await writeFile(path.join(OUT, "report.json"), JSON.stringify(report, null, 2), "utf8");

  console.log("\n================ SUMMARY ================");
  console.log(`captures            ${report.summary.captures}`);
  console.log(`captures failing    ${report.summary.failing}`);
  if (failCounts.size === 0) {
    console.log("every Tier-1 threshold passes on every capture");
  } else {
    console.log("thresholds failing, with capture counts:");
    for (const [k, v] of [...failCounts].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(k).padEnd(22)} ${v}`);
    }
  }
  console.log(`\nreport  ${path.join(OUT, "report.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
