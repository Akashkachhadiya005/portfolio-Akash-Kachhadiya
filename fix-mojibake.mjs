// Repairs text written as UTF-8 and then re-read as Windows-1252 ("mojibake").
//
// Node is used rather than PowerShell deliberately: the shell on this machine
// mangles non-ASCII on the way in and out, which is how the corruption got in
// to begin with. Node reads and writes UTF-8 byte-exactly.
//
// The test is self-verifying, not a guess-list:
//   take a run of non-ASCII characters
//   -> encode back to cp1252 BYTES (rejected if that is lossy)
//   -> decode those bytes as STRICT UTF-8
// Success means the run really was mis-decoded UTF-8, and the decode IS the
// original text. Failure means the run is already correct — a real em dash is a
// single 0x97 byte in cp1252, which is not valid UTF-8 alone, so it is skipped.
//
// node fix-mojibake.mjs          report only
// node fix-mojibake.mjs --apply  write

import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const apply = process.argv.includes("--apply");

// Windows-1252 -> Unicode for the 0x80-0x9F range (the rest is Latin-1)
const CP1252_HIGH = [
  0x20ac, 0x81, 0x201a, 0x192, 0x201e, 0x2026, 0x2020, 0x2021, 0x2c6, 0x2030,
  0x160, 0x2039, 0x152, 0x8d, 0x17d, 0x8f, 0x90, 0x2018, 0x2019, 0x201c,
  0x201d, 0x2022, 0x2013, 0x2014, 0x2dc, 0x2122, 0x161, 0x203a, 0x153, 0x9d,
  0x17e, 0x178,
];
const UNI_TO_CP1252 = new Map();
CP1252_HIGH.forEach((cp, i) => UNI_TO_CP1252.set(cp, 0x80 + i));

/** Encode a string to cp1252 bytes, or null if any char is not representable. */
function toCp1252(str) {
  const out = Buffer.alloc(str.length);
  for (let i = 0; i < str.length; i++) {
    const cp = str.codePointAt(i);
    if (cp > 0xffff) return null; // surrogate pair — real emoji, not mojibake
    if (cp <= 0xff && !(cp >= 0x80 && cp <= 0x9f)) out[i] = cp;
    else if (UNI_TO_CP1252.has(cp)) out[i] = UNI_TO_CP1252.get(cp);
    else return null;
  }
  return out;
}

const strictDecoder = new TextDecoder("utf-8", { fatal: true });

function repairRun(run) {
  const bytes = toCp1252(run);
  if (!bytes) return null;
  try {
    const decoded = strictDecoder.decode(bytes);
    return decoded === run ? null : decoded;
  } catch {
    return null;
  }
}

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (/\.(tsx?|ts)$/.test(name)) acc.push(p);
  }
  return acc;
}

let changed = 0;
for (const file of walk("src")) {
  const original = readFileSync(file, "utf8");
  let text = original;
  const log = [];

  // Two passes handles doubly-encoded text
  for (let pass = 0; pass < 2; pass++) {
    const next = text.replace(/[^\x00-\x7F]+/gu, (run) => {
      const fixed = repairRun(run);
      if (fixed === null) return run;
      log.push([run, fixed]);
      return fixed;
    });
    if (next === text) break;
    text = next;
  }

  if (text !== original) {
    changed++;
    console.log(`\n${file}`);
    for (const [from, to] of log) {
      const hex = (s) =>
        [...s].map((c) => c.codePointAt(0).toString(16).padStart(4, "0")).join(" ");
      console.log(`   ${hex(from)}  ->  ${hex(to)}   ${JSON.stringify(to)}`);
    }
    if (apply) writeFileSync(file, text, "utf8");
  }
}
console.log(`\n---- files: ${changed}   applied: ${apply}`);
