#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const helper = app.match(
  /async function warmUpSearchOnce\(query\) \{[\s\S]*?\n  async function search\(event\)/
)?.[0] || "";

const searchBlock = app.match(
  /async function search\(event\) \{[\s\S]*?\n  function locate\(\)/
)?.[0] || "";

const checks = [
  [
    "warm-up state exists",
    app.includes("searchWarmupCompleted: false")
  ],
  [
    "first query is discarded",
    helper.includes("await findPlacesWithFallback") &&
    !helper.includes("showSelectedPlaceInformation") &&
    !helper.includes("showPlaceInformation") &&
    !helper.includes("map.flyTo")
  ],
  [
    "real search waits for warm-up",
    searchBlock.includes("await warmUpSearchOnce(q)")
  ],
  [
    "real search still runs after warm-up",
    /await warmUpSearchOnce\(q\);[\s\S]*?const results = await findPlacesWithFallback/.test(searchBlock)
  ],
  [
    "warm-up runs only once",
    helper.includes("if (state.searchWarmupCompleted) return")
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
  `First search warm-up discard: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
