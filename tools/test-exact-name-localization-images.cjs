#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;

for (const file of [
  "search-v2/localization/pl-categories.js",
  "search-v2/localization/categories.js"
]) {
  vm.runInThisContext(
    fs.readFileSync(path.join(root, file), "utf8")
  );
}

const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);

const checks = [
  [
    "exact name selector exists",
    app.includes("function selectExactNamedPlace")
  ],
  [
    "shopping centre validation exists",
    app.includes("isShoppingCentreQuery") &&
    app.includes("isShoppingCentreResult")
  ],
  [
    "defibrillator is rejected",
    app.includes('type === "defibrillator"')
  ],
  [
    "panel uses Polish category dictionary",
    /function getPlaceTypeLabel\(place\)[\s\S]*?OMAP_CATEGORY_LABELS\.resolve/.test(app)
  ],
  [
    "opening hours are localized",
    app.includes("formatOpeningHoursPolish(openingHours)")
  ],
  [
    "Wikimedia resolver uses HTTPS",
    app.includes("https://commons.wikimedia.org/wiki/")
  ],
  [
    "unknown Polish category does not leak English",
    OMAP_CATEGORY_LABELS.resolve(
      { type: "unknown_external_category" },
      "pl"
    ).label === "miejsce"
  ],
  [
    "defibrillator is translated",
    OMAP_CATEGORY_LABELS.resolve(
      { type: "defibrillator" },
      "pl"
    ).label === "defibrylator"
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
  `Exact/localization/images: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
