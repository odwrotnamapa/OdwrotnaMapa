#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const block =
  app.match(
    /if \(!el\.routePanel\.hidden\) \{[\s\S]*?\n\s*return;\n\s*\}/
  )?.[0] || "";

const checks = [
  [
    "mobile route expansion helper exists",
    app.includes(
      "function expandMobileRoutePanel()"
    )
  ],
  [
    "route stage is captured before click",
    block.indexOf("const routeStageBeforeClick") >= 0 &&
    block.indexOf("const routeStageBeforeClick") <
      block.indexOf("await handleRouteMapClick(event)")
  ],
  [
    "route stage is checked after click",
    block.indexOf("const routeStageAfterClick") >
      block.indexOf("await handleRouteMapClick(event)")
  ],
  [
    "initial B selection remains open",
    block.includes('routeStageBeforeClick === "b"') &&
    block.includes("expandMobileRoutePanel();")
  ],
  [
    "moving B remains open",
    block.includes('routeStageBeforeClick === "move-b"') &&
    block.includes('routeStageAfterClick === "move-b"')
  ],
  [
    "other route clicks may still collapse",
    block.includes("collapseMobileRoutePanel();")
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
  `Route B complete panel behavior: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
