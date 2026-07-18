#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const style = fs.readFileSync(
  path.join(__dirname, "..", "style.css"),
  "utf8"
);

const checks = [
  [
    "open panel still uses uniform default height",
    style.includes(
      "--place-sheet-height: 42dvh"
    ) &&
    style.includes(
      "height: var(--place-sheet-height) !important"
    )
  ],
  [
    "collapsed panel uses 48 pixels",
    style.includes(
      "--place-sheet-height: 48px !important"
    ) &&
    style.includes(
      "height: 48px !important"
    )
  ],
  [
    "collapsed content is hidden",
    style.includes(
      "> :not(.place-sheet-handle)"
    ) &&
    style.includes(
      "display: none !important"
    )
  ],
  [
    "collapsed panel prevents overflow",
    style.includes(
      "overflow: hidden !important"
    )
  ],
  [
    "handle remains usable when collapsed",
    style.includes(
      ".place-panel.is-collapsed"
    ) &&
    style.includes(
      "height: 48px;"
    )
  ],
  [
    "old forced expanded collapsed state removed",
    !style.includes(
      ".place-panel.is-collapsed {\n    height: 42dvh"
    )
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
  `Place panel collapsible: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
