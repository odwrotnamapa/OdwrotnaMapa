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
  vm.runInThisContext(fs.readFileSync(path.join(root, file), "utf8"));
}

const cases = [
  [{ class: "shop", type: "mall" }, "centrum handlowe"],
  [{ type: "pharmacy" }, "apteka"],
  [{ type: "fuel" }, "stacja paliw"],
  [{ type: "museum" }, "muzeum"]
];

let failures = 0;
for (const [value, expected] of cases) {
  const actual = OMAP_CATEGORY_LABELS.resolve(value, "pl").label;
  if (actual !== expected) {
    failures++;
    console.error(`FAIL: ${actual} zamiast ${expected}`);
  }
}
console.log(`Kategorie PL: ${cases.length - failures}/${cases.length} PASS`);
process.exit(failures ? 1 : 0);
