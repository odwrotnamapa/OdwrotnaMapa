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
    "information panel has back button",
    html.includes('id="place-panel-back"')
  ],
  [
    "return target state exists",
    app.includes("placePanelReturnTarget: null")
  ],
  [
    "favorites set return target",
    app.includes('setPlacePanelReturnTarget("favorites")')
  ],
  [
    "discover sets return target",
    app.includes('setPlacePanelReturnTarget("discover")')
  ],
  [
    "search results set return target",
    app.includes('setPlacePanelReturnTarget("search"')
  ],
  [
    "back returns to all three origins",
    app.includes('OMAP_BACK_NAVIGATION?.register(\n    "favorites"') &&
    app.includes('OMAP_BACK_NAVIGATION?.register(\n    "discover"') &&
    app.includes('OMAP_BACK_NAVIGATION?.register(\n    "search"')
  ],
  [
    "discover results survive information panel",
    app.includes(
      'state.placePanelReturnTarget?.type !== "discover"'
    ) &&
    app.includes(
      "function closeDiscover(clearResults = true)"
    )
  ],
  [
    "search results are reopened",
    app.includes("function reopenSearchResults") &&
    app.includes(
      'new Event("input", { bubbles: true })'
    )
  ],
  [
    "generic reverse info clears back target",
    /async function showPlaceInformation\(event\)[\s\S]*?clearPlacePanelReturnTarget\(\)/.test(app)
  ],
  [
    "header has back-title-close layout",
    style.includes(
      "grid-template-columns: 34px minmax(0, 1fr) 34px"
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
  `Place panel back navigation: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
