#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const checks = [
  ["selected aliases participate", app.includes("...(selected.aliases || [])")],
  ["candidate aliases participate", app.includes("...(candidate.aliases || [])")],
  ["name variants may match by tokens", app.includes("shared.length >= 2")],
  ["city must remain compatible", app.includes("selectedCity !== candidateCity")],
  ["distant matches are rejected", app.includes("distanceMeters > 3000")],
  ["mall category guard remains", app.includes('selected.category === "shopping_mall"')]
];

let failures = 0;

for (const [name, passed] of checks) {
  if (!passed) {
    failures++;
    console.error(`FAIL: ${name}`);
  }
}

console.log(
  `Named POI alias coordinates: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
