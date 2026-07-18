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
    "global guard state exists",
    app.includes("namedPoiGuardId: 0") &&
    app.includes("activeNamedPoiId: null")
  ],
  [
    "exact Named POI activates guard",
    /function activateNamedPoiGuard[\s\S]*?activeNamedPoiId/.test(app) &&
    /showSelectedPlaceInformation\(result\)[\s\S]*?activateNamedPoiGuard\(result\)/.test(app)
  ],
  [
    "reverse geocoding is blocked for active Named POI",
    /showPlaceInformation\(event\)[\s\S]*?state\.activeNamedPoiId[\s\S]*?return;/.test(app)
  ],
  [
    "stale reverse result is rejected",
    app.includes("canReverseGeocodeForGuard(guardId)")
  ],
  [
    "context info can force reverse",
    app.includes("forceReverse: true")
  ],
  [
    "no delayed exact-place moveend callback",
    !/map\.once\("moveend"[\s\S]{0,250}showSelectedPlaceInformation/.test(app)
  ],
  [
    "closing panel invalidates guard",
    /function closePlacePanel\(\) \{\s*invalidateNamedPoiGuard\(\)/.test(app)
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
  `Global Named POI guard: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
