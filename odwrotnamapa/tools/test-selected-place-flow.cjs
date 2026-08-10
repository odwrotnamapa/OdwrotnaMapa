#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const checks = [
  [
    "search uses exact result through PlaceService",
    /async function search\([\s\S]*?openSearchPlaceThroughService\([\s\S]*?result/.test(app)
  ],
  [
    "autocomplete uses exact result through PlaceService",
    /input: el\.searchInput[\s\S]*?openSearchPlaceThroughService\([\s\S]*?result/.test(app)
  ],
  [
    "panel uses localized category",
    /function getPlaceTypeLabel\(place\)[\s\S]*?getLocalizedCategory\(place\)/.test(app)
  ],
  [
    "exact renderer exists",
    /function renderPlaceInformation\(place, lngLat\)/.test(app)
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
  `Selected place flow: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
