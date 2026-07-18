#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const openBlock =
  app.match(
    /function openPlacePanel\(\) \{[\s\S]*?\n  \}/
  )?.[0] || "";

const checks = [
  [
    "mobile height is always reset",
    openBlock.includes(
      "const height = window.innerHeight * 0.42"
    )
  ],
  [
    "old height condition removed",
    !openBlock.includes(
      "getBoundingClientRect().height < 90"
    )
  ],
  [
    "panel variable is set directly",
    openBlock.includes(
      'el.placePanel.style.setProperty('
    ) &&
    openBlock.includes(
      '"--place-sheet-height"'
    )
  ],
  [
    "global sheet variable is synchronized",
    openBlock.includes(
      "document.documentElement.style.setProperty"
    )
  ],
  [
    "collapsed state is always removed",
    openBlock.includes(
      'classList.remove("is-collapsed")'
    )
  ],
  [
    "panel scroll position is reset",
    openBlock.includes(
      "el.placePanel.scrollTop = 0"
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
  `Place panel uniform height: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
