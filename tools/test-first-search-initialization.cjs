#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const searchBlock = app.match(
  /async function search\(event\) \{[\s\S]*?\n  function locate\(\)/
)?.[0] || "";

const checks = [
  [
    "readiness helper exists",
    app.includes("async function ensureSearchReady()")
  ],
  [
    "first search awaits readiness",
    searchBlock.includes("await ensureSearchReady()")
  ],
  [
    "first request is logged",
    searchBlock.includes("OMapa Search request")
  ],
  [
    "autocomplete awaits readiness",
    /const fetchSuggestions = async query => \{[\s\S]*?await ensureSearchReady\(\)/.test(app)
  ],
  [
    "engine timeout is explicit",
    app.includes("SEARCH_ENGINE_NOT_READY")
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
  `First search initialization: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
