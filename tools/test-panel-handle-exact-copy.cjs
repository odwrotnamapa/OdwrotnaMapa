#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

function handle(id) {
  const match = html.match(
    new RegExp(`(<button\\s+id="${id}"[\\s\\S]*?</button>)`)
  );
  return match
    ? match[1].replace(`id="${id}"`, 'id="HANDLE"')
    : "";
}

const route = handle("route-sheet-handle");
const legend = handle("legend-sheet-handle");
const about = handle("about-sheet-handle");

const checks = [
  [
    "legend is an exact route handle copy",
    route && route === legend
  ],
  [
    "about is an exact route handle copy",
    route && route === about
  ],
  [
    "no legend-specific handle CSS",
    !/#legend-sheet-handle/.test(css)
  ],
  [
    "no about-specific handle CSS",
    !/#about-sheet-handle/.test(css)
  ],
  [
    "legend keeps existing drag initialization",
    app.includes("legendSheetHandle") &&
    app.includes("initializeLegendBottomSheet")
  ],
  [
    "about keeps existing drag initialization",
    app.includes("aboutSheetHandle") &&
    app.includes("initializeAboutBottomSheet")
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
  `Panel handle exact copy: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
