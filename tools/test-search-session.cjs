#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);

const session = fs.readFileSync(
  path.join(root, "search-v2", "session.js"),
  "utf8"
);

const searchBlock = app.match(
  /async function search\(event\) \{[\s\S]*?\n  function locate\(\)/
)?.[0] || "";

const selectedBlock = app.match(
  /async function showSelectedPlaceInformation\(result\) \{[\s\S]*?\n  function renderPlaceInformation/
)?.[0] || "";

const checks = [
  [
    "SearchSession module exists",
    session.includes("class SearchSession")
  ],
  [
    "new search aborts previous session",
    session.includes("activeSession?.abort()")
  ],
  [
    "selected place is frozen",
    session.includes("Object.freeze")
  ],
  [
    "main search uses session signal",
    searchBlock.includes("session.signal")
  ],
  [
    "main search asserts active session",
    searchBlock.includes("session.assertActive()")
  ],
  [
    "panel uses explicitly passed selected place",
    !selectedBlock.includes("session.selectedPlace") &&
    selectedBlock.includes("const lngLat = getResultLngLat(result)")
  ],
  [
    "panel does not perform lookup",
    !selectedBlock.includes("fetch(") &&
    !selectedBlock.includes("lookupEndpoint")
  ],
  [
    "reverse geocoding cancels session",
    /async function showPlaceInformation\(event\) \{\s*window\.OMAP_SEARCH_SESSION\?\.cancel/.test(app)
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
  `Search session: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
