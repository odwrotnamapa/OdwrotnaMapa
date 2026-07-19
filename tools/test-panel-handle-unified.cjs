#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function cls(id) {
  const match = html.match(
    new RegExp(`<button id="${id}"[^>]*class="([^"]+)"`)
  );
  return match ? match[1] : "";
}

const route = cls("route-sheet-handle");
const legend = cls("legend-sheet-handle");
const about = cls("about-sheet-handle");

const checks = [
  [
    "all three handles have identical classes",
    route && route === legend && route === about
  ],
  [
    "no legend-specific pseudo slider",
    !css.includes("#legend-sheet-handle::before")
  ],
  [
    "no about-specific pseudo slider",
    !css.includes("#about-sheet-handle::before")
  ],
  [
    "generic sheet handle style remains",
    css.includes(".sheet-handle")
  ],
  [
    "legend uses existing drag engine",
    app.includes("legendSheetHandle") &&
    app.includes("initializeLegendBottomSheet")
  ],
  [
    "about uses existing drag engine",
    app.includes("aboutSheetHandle") &&
    app.includes("initializeAboutBottomSheet")
  ],
  [
    "zero corners remain",
    css.includes("border-radius: 0 !important")
  ]
];

let failures = 0;

for (const [name, passed] of checks) {
  if (!passed) {
    failures++;
    console.error(`FAIL: ${name}`);
  }
}

console.log(
  `Panel handle unified: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
