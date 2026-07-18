#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);
const style = fs.readFileSync(
  path.join(root, "style.css"),
  "utf8"
);

const finalSection =
  style.split(
    "Ostateczna, wspólna wysokość mobilnego panelu Informacje"
  )[1] || "";

const checks = [
  [
    "final override exists after global rules",
    finalSection.includes(
      "body:has(.place-panel:not([hidden])) .place-panel"
    )
  ],
  [
    "default height is 42 dynamic viewport units",
    finalSection.includes(
      "--place-sheet-height: 42dvh"
    ) &&
    finalSection.includes(
      "height: var(--place-sheet-height) !important"
    )
  ],
  [
    "360 pixel cap is overridden without blocking drag",
    finalSection.includes(
      "max-height: calc(100dvh - 16px) !important"
    )
  ],
  [
    "minimum height allows collapsed state",
    finalSection.includes(
      "min-height: 48px !important"
    )
  ],
  [
    "collapsed class cannot shorten open panel",
    finalSection.includes(
      ".place-panel.is-collapsed"
    ) &&
    finalSection.includes(
      "> :not(.place-sheet-handle)"
    )
  ],
  [
    "JavaScript uses the same height",
    app.includes(
      'const height = "42dvh"'
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
  `Place panel final height: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
