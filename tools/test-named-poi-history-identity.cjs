#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);
const index = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "search-v2",
      "named-poi",
      "pl-named-poi.json"
    ),
    "utf8"
  )
);

const focus = index.records.find(
  record =>
    record.id === "omap:poi:focus-bydgoszcz"
);

const checks = [
  ["Focus latitude corrected", focus?.lat === 53.124181],
  ["Focus longitude corrected", focus?.lon === 18.017858],
  [
    "history stores local identity",
    app.includes("namedPoiId: entry.namedPoiId") &&
    app.includes("exactLocalIdentity: Boolean(")
  ],
  [
    "history local result avoids reverse",
    app.includes('entry.provider === "named-poi"') &&
    /if \(isExactPlace\) \{[\s\S]*?showSelectedPlaceInformation/.test(app)
  ],
  [
    "autocomplete renders immediately",
    /showSelectedPlaceInformation\(result\);[\s\S]*?map\.flyTo/.test(app)
  ],
  [
    "stale session override removed",
    !app.includes("result !== session.selectedPlace")
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
  `Named POI history identity: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
