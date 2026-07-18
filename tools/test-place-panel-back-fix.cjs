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
    "target is captured before close",
    /function returnFromPlacePanel\(\)[\s\S]*?OMAP_BACK_NAVIGATION\.get\(\)[\s\S]*?closePlacePanel\(\)/.test(app)
  ],
  [
    "target is restored after close",
    /closePlacePanel\(\)[\s\S]*?OMAP_BACK_NAVIGATION\.set\([\s\S]*?target\.type/.test(app)
  ],
  [
    "goBack runs after target restoration",
    /OMAP_BACK_NAVIGATION\.set\([\s\S]*?OMAP_BACK_NAVIGATION\.goBack\(\)/.test(app)
  ],
  [
    "normal close still invalidates guard",
    /function closePlacePanel\(\) \{\s*invalidateNamedPoiGuard\(\)/.test(app)
  ],
  [
    "all three back handlers remain",
    app.includes('OMAP_BACK_NAVIGATION?.register(\n    "favorites"') &&
    app.includes('OMAP_BACK_NAVIGATION?.register(\n    "discover"') &&
    app.includes('OMAP_BACK_NAVIGATION?.register(\n    "search"')
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
  `Place panel back fix: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
