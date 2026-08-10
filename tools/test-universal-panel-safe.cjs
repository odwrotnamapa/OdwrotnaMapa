#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(path.join(root, "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const style = fs.readFileSync(path.join(root, "style.css"), "utf8");

const panels = [
  "legend-panel",
  "route-panel",
  "favorites-panel",
  "place-panel",
  "about-panel",
  "discover-panel",
  "menu-panel"
];

const checks = [
  [
    "all panels share visual class",
    panels.every(id =>
      new RegExp(
        `id="${id}"[\\s\\S]{0,180}class="[^"]*app-sheet`
      ).test(html)
    )
  ],
  [
    "existing panel engine remains",
    app.includes("const MOBILE_PANEL_STANDARD") &&
    app.includes("initializeRouteBottomSheet") &&
    app.includes("initializeDiscoverBottomSheet") &&
    app.includes("initializeFavoritesBottomSheet") &&
    app.includes("initializePlaceBottomSheet")
  ],
  [
    "search remains present",
    app.includes("async function search(") &&
    app.includes("openSearchPlaceThroughService(")
  ],
  [
    "discover remains present",
    app.includes("function renderDiscoverResults(")
  ],
  [
    "favorites remain present",
    app.includes("function renderFavoritesList(") &&
    app.includes("openFavoritePlace(favorite)")
  ],
  [
    "place information remains present",
    app.includes("async function showSelectedPlaceInformation(") &&
    app.includes("async function showPlaceInformation(")
  ],
  [
    "sharp panel corners",
    style.includes("--app-sheet-corner-radius: 4px") &&
    style.includes("border-radius: var(--app-sheet-corner-radius)")
  ],
  [
    "shared visual header and handle",
    style.includes(".app-sheet__header") &&
    style.includes(".app-sheet__handle")
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
  `Universal panel safe: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
