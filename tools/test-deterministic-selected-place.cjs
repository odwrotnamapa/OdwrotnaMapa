#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const selectedBlock = app.match(
  /async function showSelectedPlaceInformation\(result\) \{[\s\S]*?\n  function renderPlaceInformation/
)?.[0] || "";

const searchBlock = app.match(
  /async function search\(event\) \{[\s\S]*?\n  function locate\(\)/
)?.[0] || "";

const autocompleteBlock = app.match(
  /function initializeAutocomplete\(\) \{[\s\S]*?input: el\.routeFrom/
)?.[0] || "";

const checks = [
  [
    "selected place has no network lookup",
    !selectedBlock.includes("fetch(") &&
    !selectedBlock.includes("lookupEndpoint")
  ],
  [
    "selected result renders directly",
    selectedBlock.includes("renderPlaceInformation(details, lngLat)")
  ],
  [
    "search opens before animation",
    searchBlock.indexOf("showSelectedPlaceInformation(result)") >= 0 &&
    searchBlock.indexOf("showSelectedPlaceInformation(result)") <
      searchBlock.indexOf("map.flyTo")
  ],
  [
    "autocomplete opens before animation",
    autocompleteBlock.indexOf("showSelectedPlaceInformation(result)") >= 0 &&
    autocompleteBlock.indexOf("showSelectedPlaceInformation(result)") <
      autocompleteBlock.indexOf("map.flyTo")
  ],
  [
    "reverse geocoding remains separate",
    app.includes("async function showPlaceInformation(event)")
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
  `Deterministic selected place: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
