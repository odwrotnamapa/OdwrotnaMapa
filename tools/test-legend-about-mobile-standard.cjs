#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "index.html"),
  "utf8"
);
const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);
const style = fs.readFileSync(
  path.join(root, "style.css"),
  "utf8"
);

const checks = [
  [
    "legend has a mobile sheet handle",
    html.includes('id="legend-sheet-handle"')
  ],
  [
    "about has a mobile sheet handle",
    html.includes('id="about-sheet-handle"')
  ],
  [
    "legend uses shared bottom-sheet engine",
    app.includes("function initializeLegendBottomSheet") &&
    app.includes('cssVariable: "--legend-sheet-height"')
  ],
  [
    "about uses shared bottom-sheet engine",
    app.includes("function initializeAboutBottomSheet") &&
    app.includes('cssVariable: "--about-sheet-height"')
  ],
  [
    "both are initialized on startup",
    app.includes("initializeLegendBottomSheet();") &&
    app.includes("initializeAboutBottomSheet();")
  ],
  [
    "legend opens with shared standard",
    /function openLegendFromMenu[\s\S]*?openMobilePanelStandard\([\s\S]*?--legend-sheet-height/.test(app)
  ],
  [
    "about opens with shared standard",
    /function openAboutFromMenu[\s\S]*?openMobilePanelStandard\([\s\S]*?--about-sheet-height/.test(app)
  ],
  [
    "legend has independent mutable height",
    style.includes("--legend-sheet-height")
  ],
  [
    "about has independent mutable height",
    style.includes("--about-sheet-height")
  ],
  [
    "both share collapsed height",
    style.includes(
      ".legend-panel.menu-subpanel.is-collapsed"
    ) &&
    style.includes(
      ".about-panel.menu-subpanel.is-collapsed"
    )
  ]
];

let failures = 0;

for (const [name, passed] of checks) {
  if (!passed) {
    failures += 1;
    console.error(`FAIL: ${name}`);
  }
}

console.log(
  `Legend/About mobile standard: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
