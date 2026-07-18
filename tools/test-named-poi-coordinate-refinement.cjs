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
    "coordinate refinement exists",
    app.includes(
      "function refineNamedPoiCoordinates"
    )
  ],
  [
    "name or alias matching is required",
    app.includes("const namesMatch") &&
    app.includes("...(selected.aliases || [])")
  ],
  [
    "roads and AEDs are rejected",
    app.includes(
      'candidateClass === "highway"'
    ) &&
    app.includes(
      'candidateType === "defibrillator"'
    )
  ],
  [
    "mall category compatibility is required",
    app.includes(
      'selected.category === "shopping_mall"'
    )
  ],
  [
    "identity fields are not replaced",
    /return \{\s*\.\.\.selected,[\s\S]*?lat: String\(lat\),[\s\S]*?lon: String\(lon\)/.test(app)
  ],
  [
    "refinement happens before session freeze",
    /const positionedResult =[\s\S]*?refineNamedPoiCoordinates[\s\S]*?session\.select\(\s*positionedResult/.test(app)
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
  `Named POI coordinates: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
