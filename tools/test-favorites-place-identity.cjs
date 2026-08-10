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
    "favorites store Named POI identity",
    app.includes("namedPoiId: place.namedPoiId") &&
    app.includes("provider: place.provider") &&
    app.includes("exactLocalIdentity: Boolean(")
  ],
  [
    "favorites store complete place details",
    app.includes("addressDetails: {") &&
    app.includes("extratags: {") &&
    app.includes("namedetails: {")
  ],
  [
    "exact favorites open selected place directly",
    /if \(hasExactIdentity\) \{[\s\S]*?showSelectedPlaceInformation/.test(app)
  ],
  [
    "only legacy favorites use reverse",
    /if \(hasExactIdentity\) \{[\s\S]*?\} else \{[\s\S]*?showPlaceInformation/.test(app) &&
    app.includes("forceReverse: true")
  ],
  [
    "export preserves identity",
    app.includes("payload.favorites = state.favorites.map(favorite => ({") &&
    app.includes("...favorite")
  ],
  [
    "import preserves identity",
    /imported\.push\(\{[\s\S]*?\.\.\.entry/.test(app)
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
  `Favorites place identity: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
