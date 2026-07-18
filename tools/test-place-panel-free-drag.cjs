#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
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
    "panel height follows mutable CSS variable",
    style.includes(
      "height: var(--place-sheet-height) !important"
    )
  ],
  [
    "default height remains 42dvh",
    style.includes(
      "--place-sheet-height: 42dvh"
    )
  ],
  [
    "panel may expand almost to full viewport",
    style.includes(
      "max-height: calc(100dvh - 16px) !important"
    )
  ],
  [
    "panel may shrink to collapsed height",
    style.includes(
      "min-height: 48px !important"
    )
  ],
  [
    "drag handler continuously updates height",
    app.includes(
      "setHeight(startHeight + delta, false)"
    )
  ],
  [
    "drag handler writes the panel CSS variable",
    /panel\.style\.setProperty\(\s*cssVariable,[\s\S]*?safeHeight/.test(app)
  ],
  [
    "no fixed expanded height overrides dragging",
    !style.includes(
      "height: 42dvh !important"
    ) &&
    !style.includes(
      "max-height: 42dvh !important"
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
  `Place panel free drag: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
