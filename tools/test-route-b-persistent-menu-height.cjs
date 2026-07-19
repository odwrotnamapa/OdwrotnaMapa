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

const checks = [
  [
    "initial B interaction keeps route open",
    app.includes('routeStageBeforeClick === "b"')
  ],
  [
    "moving B keeps route open",
    app.includes('routeStageBeforeClick === "move-b"') &&
    app.includes('routeStageAfterClick === "move-b"')
  ],
  [
    "B interaction expands route panel",
    app.includes("if (isPointBInteraction)") &&
    app.includes("expandMobileRoutePanel();")
  ],
  [
    "menu subpanels match regular mobile height",
    style.includes(
      "height: min(42vh, calc(100vh - 16px));"
    ) &&
    style.includes(
      "max-height: min(42vh, calc(100vh - 16px)) !important;"
    )
  ],
  [
    "old oversized menu height removed",
    !style.includes(
      "height: min(72vh, calc(100vh - 16px));"
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
  `Route B persistent / menu height: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
