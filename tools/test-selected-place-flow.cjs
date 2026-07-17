#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const app = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");

const checks = [
  ["search uses exact result", /async function search\([\s\S]*?showSelectedPlaceInformation\(result\)/],
  ["autocomplete uses exact result", /input: el\.searchInput[\s\S]*?showSelectedPlaceInformation\(result\)/],
  ["panel uses localized category", /function getPlaceTypeLabel\(place\)[\s\S]*?getLocalizedCategory\(place\)/],
  ["exact renderer exists", /function renderPlaceInformation\(place, lngLat\)/]
];

let failures = 0;
for (const [name, pattern] of checks) {
  if (!pattern.test(app)) {
    failures++;
    console.error(`FAIL: ${name}`);
  }
}
console.log(`Selected place flow: ${checks.length - failures}/${checks.length} PASS`);
process.exit(failures ? 1 : 0);
