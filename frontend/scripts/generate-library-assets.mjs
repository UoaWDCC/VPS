// Draws the library's preset images and sounds into public/library.
//
//   node scripts/generate-library-assets.mjs
//
// Everything is made here from simple shapes and sine waves, so the files carry
// no licence, and re-running after a palette change keeps them in step with the
// theme. It needs nothing beyond Node. Which files exist, and what they're
// called, comes from src/features/authoring/library/presets.js.

import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { PALETTE } from "../src/features/authoring/library/palette.js";
import {
  AUDIO_PRESETS,
  IMAGE_PRESETS,
} from "../src/features/authoring/library/presets.js";

const OUT = new URL("../public/library/", import.meta.url);

/* ------------------------------ shapes ------------------------------ */
// Each shape is a function (x, y) => boolean on a 0..100 square.

const circle = (cx, cy, r) => (x, y) => (x - cx) ** 2 + (y - cy) ** 2 <= r * r;

const rect = (x0, y0, w, h) => (x, y) =>
  x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;

const roundRect = (x0, y0, w, h, r) => (x, y) => {
  const dx = Math.max(x0 + r - x, 0, x - (x0 + w - r));
  const dy = Math.max(y0 + r - y, 0, y - (y0 + h - r));
  return dx * dx + dy * dy <= r * r;
};

function distanceToSegment(x, y, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared
    ? Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / lengthSquared))
    : 0;
  return Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy));
}

const capsule = (x1, y1, x2, y2, r) => (x, y) =>
  distanceToSegment(x, y, x1, y1, x2, y2) <= r;

const polygon = (points) => (x, y) => {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
};

// a polygon with its corners rounded off by r
const roundPolygon = (points, r) => {
  const inner = polygon(points);
  return (x, y) =>
    inner(x, y) ||
    points.some((p, i) => {
      const q = points[(i + 1) % points.length];
      return distanceToSegment(x, y, p[0], p[1], q[0], q[1]) <= r;
    });
};

const heart = (cx, cy, s) => (x, y) => {
  const a = (x - cx) / s;
  const b = (cy - y) / s;
  return (a * a + b * b - 1) ** 3 - a * a * b ** 3 <= 0;
};

const union =
  (...shapes) =>
  (x, y) =>
    shapes.some((shape) => shape(x, y));

const intersect = (a, b) => (x, y) => a(x, y) && b(x, y);

const rotate = (shape, cx, cy, degrees) => {
  const angle = (-degrees * Math.PI) / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return (x, y) => {
    const dx = x - cx;
    const dy = y - cy;
    return shape(cx + dx * cos - dy * sin, cy + dx * sin + dy * cos);
  };
};

/* ----------------------------- the icons ----------------------------- */
// A drawing is a list of layers, painted in order.

const { accent, success, warning, error, info, neutral, light, white } =
  PALETTE;
const layer = (color, shape) => ({ color, shape });

const ICONS = {
  "first-aid": () => [
    layer(error, roundRect(6, 6, 88, 88, 20)),
    layer(white, union(rect(40, 20, 20, 60), rect(20, 40, 60, 20))),
  ],

  heart: () => [layer(error, heart(50, 54, 33))],

  pill: () => {
    const body = (r) => rotate(capsule(30, 50, 70, 50, r), 50, 50, 45);
    const leftHalf = rotate(rect(0, 0, 50, 100), 50, 50, 45);
    return [
      layer(neutral, body(22)),
      layer(light, body(19)),
      layer(accent, intersect(body(19), leftHalf)),
    ];
  },

  thermometer: () => [
    layer(neutral, union(capsule(46, 18, 46, 62, 12), circle(46, 74, 20))),
    layer(light, union(capsule(46, 18, 46, 62, 9), circle(46, 74, 17))),
    layer(error, union(capsule(46, 40, 46, 66, 4.5), circle(46, 74, 12))),
    layer(
      neutral,
      union(rect(64, 24, 14, 3.5), rect(64, 38, 10, 3.5), rect(64, 52, 14, 3.5))
    ),
  ],

  clipboard: () => [
    layer(neutral, roundRect(16, 10, 68, 84, 7)),
    layer(light, roundRect(22, 20, 56, 68, 3)),
    layer(accent, roundRect(34, 4, 32, 18, 6)),
    layer(
      neutral,
      union(rect(30, 38, 40, 4.5), rect(30, 52, 40, 4.5), rect(30, 66, 26, 4.5))
    ),
  ],

  check: () => [
    layer(success, circle(50, 50, 44)),
    layer(
      white,
      union(capsule(30, 52, 44, 66, 5.5), capsule(44, 66, 71, 35, 5.5))
    ),
  ],

  warning: () => [
    layer(
      warning,
      roundPolygon(
        [
          [50, 22],
          [83, 78],
          [17, 78],
        ],
        9
      )
    ),
    layer(white, capsule(50, 40, 50, 60, 4.5)),
    layer(white, circle(50, 71, 4.8)),
  ],

  info: () => [
    layer(info, circle(50, 50, 44)),
    layer(white, circle(50, 30, 6)),
    layer(white, capsule(50, 46, 50, 72, 6)),
  ],

  arrow: () => [
    layer(
      accent,
      union(
        capsule(14, 50, 66, 50, 8.5),
        roundPolygon(
          [
            [62, 28],
            [88, 50],
            [62, 72],
          ],
          6
        )
      )
    ),
  ],

  speech: () => [
    layer(
      neutral,
      union(
        roundRect(6, 14, 88, 58, 14),
        roundPolygon(
          [
            [22, 66],
            [22, 90],
            [46, 68],
          ],
          3
        )
      )
    ),
    layer(white, circle(29, 43, 6)),
    layer(white, circle(50, 43, 6)),
    layer(white, circle(71, 43, 6)),
  ],
};

/* ---------------------------- rasterising ---------------------------- */

const SIZE = 512;
const SAMPLES = 4; // per axis, per pixel, so edges are smooth

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function render(layers) {
  const painted = layers.map(({ color, shape }) => ({
    rgb: channels(color),
    shape,
  }));
  const out = Buffer.alloc(SIZE * SIZE * 4);
  const unit = 100 / SIZE;

  for (let py = 0; py < SIZE; py++) {
    for (let px = 0; px < SIZE; px++) {
      // premultiplied colour accumulated over the layers
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;

      for (const { rgb, shape } of painted) {
        let hits = 0;
        for (let sy = 0; sy < SAMPLES; sy++) {
          for (let sx = 0; sx < SAMPLES; sx++) {
            const x = (px + (sx + 0.5) / SAMPLES) * unit;
            const y = (py + (sy + 0.5) / SAMPLES) * unit;
            if (shape(x, y)) hits++;
          }
        }
        if (!hits) continue;
        const coverage = hits / (SAMPLES * SAMPLES);
        r = rgb[0] * coverage + r * (1 - coverage);
        g = rgb[1] * coverage + g * (1 - coverage);
        b = rgb[2] * coverage + b * (1 - coverage);
        a = coverage + a * (1 - coverage);
      }

      const at = (py * SIZE + px) * 4;
      if (a > 0) {
        out[at] = Math.round(r / a);
        out[at + 1] = Math.round(g / a);
        out[at + 2] = Math.round(b / a);
        out[at + 3] = Math.round(a * 255);
      }
    }
  }
  return out;
}

/* ------------------------------- PNG -------------------------------- */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, checksum]);
}

function encodePng(rgba, width, height) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA

  const stride = width * 4;
  const scanlines = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    // filter byte 0 (none), then the row
    rgba.copy(scanlines, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", header),
    pngChunk("IDAT", deflateSync(scanlines, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------- sounds ------------------------------ */

const RATE = 22050;
const PEAK = 0.6;

function synth(seconds, sample) {
  const samples = new Float32Array(Math.round(seconds * RATE));
  for (let i = 0; i < samples.length; i++) samples[i] = sample(i / RATE);
  return samples;
}

const sine = (frequency, t) => Math.sin(2 * Math.PI * frequency * t);

// fades a tone in and out over `edge` seconds so it never clicks
const windowed = (t, start, length, edge = 0.01) =>
  t < start || t > start + length
    ? 0
    : Math.min(1, (t - start) / edge, (start + length - t) / edge);

const SOUNDS = {
  // a single beep, then quiet, for one beat per second when looped
  "heart-monitor": () =>
    synth(1, (t) => PEAK * windowed(t, 0, 0.14) * sine(1000, t)),

  // two rising-and-falling pairs of beeps
  alert: () =>
    synth(0.8, (t) => {
      const beeps = [
        [0, 880],
        [0.2, 660],
        [0.4, 880],
        [0.6, 660],
      ];
      const sum = beeps.reduce((total, [start, frequency]) => {
        const tone = sine(frequency, t) + 0.25 * sine(frequency * 2, t);
        return total + windowed(t, start, 0.15) * tone;
      }, 0);
      return PEAK * 0.8 * sum;
    }),

  // a bell: a few partials that each fade away at their own rate
  chime: () =>
    synth(1.5, (t) => {
      const partials = [
        [880, 1, 3.2],
        [1318.5, 0.5, 4.5],
        [1760, 0.3, 6.5],
        [2637, 0.12, 9],
      ];
      const sum = partials.reduce(
        (total, [frequency, level, decay]) =>
          total + level * Math.exp(-decay * t) * sine(frequency, t),
        0
      );
      return PEAK * windowed(t, 0, 1.5, 0.004) * (sum / 1.6);
    }),
};

function encodeWav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((value, i) => {
    const clamped = Math.max(-1, Math.min(1, value));
    data.writeInt16LE(Math.round(clamped * 32767), i * 2);
  });

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28); // byte rate
  header.writeUInt16LE(2, 32); // block align
  header.writeUInt16LE(16, 34); // bits per sample
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}

/* ------------------------------- output ------------------------------ */

function check(kind, wanted, drawn) {
  const missing = wanted.filter((id) => !drawn.includes(id));
  const unlisted = drawn.filter((id) => !wanted.includes(id));
  if (missing.length || unlisted.length)
    throw new Error(
      `${kind}: presets.js and this script disagree. ` +
        `Not drawn: [${missing}]. Not in presets.js: [${unlisted}]`
    );
}

check("images", IMAGE_PRESETS.map((p) => p.id), Object.keys(ICONS));
check("sounds", AUDIO_PRESETS.map((p) => p.id), Object.keys(SOUNDS));

mkdirSync(new URL("images/", OUT), { recursive: true });
mkdirSync(new URL("audio/", OUT), { recursive: true });

for (const [id, draw] of Object.entries(ICONS)) {
  const png = encodePng(render(draw()), SIZE, SIZE);
  writeFileSync(new URL(`images/${id}.png`, OUT), png);
  console.log(`images/${id}.png  ${(png.length / 1024).toFixed(1)} KB`);
}

for (const [id, make] of Object.entries(SOUNDS)) {
  const wav = encodeWav(make());
  writeFileSync(new URL(`audio/${id}.wav`, OUT), wav);
  console.log(`audio/${id}.wav  ${(wav.length / 1024).toFixed(1)} KB`);
}
