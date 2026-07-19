#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");

const panels = [
  "route-panel",
  "legend-panel",
  "about-panel",
  "favorites-panel",
  "place-panel",
  "discover-panel",
  "menu-panel"
];

const handles = [
  "route-sheet-handle",
  "legend-sheet-handle",
  "about-sheet-handle",
  "favorites-sheet-handle",
  "place-sheet-handle",
  "discover-sheet-handle",
  "menu-sheet-handle"
];

const checks = [
  [
    "all panels use one shell",
    panels.every(id =>
      new RegExp(
        `<aside id="${id}"[^>]*class="[^"]*panel-shell`
      ).test(html)
    )
  ],
  [
    "all handles use one shell class",
    handles.every(id =>
      new RegExp(
        `<button id="${id}"[^>]*class="[^"]*panel-shell__handle`
      ).test(html)
    )
  ],
  [
    "all headers use one shell class",
    (html.match(/panel-shell__header/g) || []).length >= 7
  ],
  [
    "one handle layout rule",
    css.includes(
      ".panel-shell > .panel-shell__handle"
    )
  ],
  [
    "one header layout rule",
    css.includes(
      ".panel-shell > .panel-shell__header"
    )
  ],
  [
    "menu subpanel behavior remains",
    css.includes(
      "body:has(.legend-panel.menu-subpanel:not([hidden]))"
    )
  ],
  [
    "existing JS panel engine remains",
    app.includes("initializeRouteBottomSheet") &&
    app.includes("initializeLegendBottomSheet") &&
    app.includes("initializeAboutBottomSheet")
  ],
  [
    "zero corners",
    css.includes("*::after") &&
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
  `Universal panel shell: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
