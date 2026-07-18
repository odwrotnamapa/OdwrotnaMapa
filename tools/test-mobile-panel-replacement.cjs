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

const mapClickBlock =
  app.match(
    /async function handleMapClick\(event\) \{[\s\S]*?\n  function getLocalizedCategory/
  )?.[0] || "";

const checks = [
  [
    "open mobile panel hides toolbar",
    style.includes(
      "body:has(.route-panel:not([hidden])) .toolbar"
    ) &&
    style.includes(
      "body:has(.place-panel:not([hidden])) .toolbar"
    )
  ],
  [
    "open mobile panel hides bottom navigation",
    style.includes(
      "body:has(.discover-panel:not([hidden])) .mobile-bottom-nav"
    ) &&
    style.includes(
      "body:has(.menu-panel:not([hidden])) .mobile-bottom-nav"
    )
  ],
  [
    "open panels move to screen edge",
    style.includes("bottom: 8px !important") &&
    style.includes(
      "max-height: calc(100vh - 16px) !important"
    )
  ],
  [
    "route has a mobile collapse helper",
    app.includes(
      "function collapseMobileRoutePanel()"
    )
  ],
  [
    "route tracks stages before and after click",
    mapClickBlock.includes(
      "const routeStageBeforeClick"
    ) &&
    mapClickBlock.includes(
      "const routeStageAfterClick"
    )
  ],
  [
    "route expands for B and move-B stages",
    mapClickBlock.includes(
      'routeStageBeforeClick === "b"'
    ) &&
    mapClickBlock.includes(
      'routeStageBeforeClick === "move-b"'
    ) &&
    mapClickBlock.includes(
      "expandMobileRoutePanel();"
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
  `Mobile panel replacement: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
