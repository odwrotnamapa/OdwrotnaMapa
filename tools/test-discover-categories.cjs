#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const app = fs.readFileSync(
  path.join(__dirname, "..", "app.js"),
  "utf8"
);

const checks = [
  [
    "selected discover category id reaches renderer",
    app.includes("id: categoryId")
  ],
  [
    "Nominatim metadata is preserved",
    app.includes("placeClass: item.class") &&
    app.includes("placeType: item.type") &&
    app.includes("category: item.category")
  ],
  [
    "Nominatim class/type is converted into tags",
    app.includes('item.class === "amenity"') &&
    app.includes('item.class === "shop"') &&
    app.includes('item.class === "tourism"')
  ],
  [
    "Overpass identity is preserved",
    app.includes("id: element.id") &&
    app.includes("type: element.type")
  ],
  [
    "discover classification helper exists",
    app.includes(
      "function getDiscoverPlaceClassification"
    )
  ],
  [
    "category id is used as fallback",
    app.includes("category.id ||") &&
    app.includes("category: classification.category")
  ],
  [
    "panel receives class type and category",
    app.includes("class: classification.class") &&
    app.includes("type: classification.type") &&
    app.includes("category: classification.category")
  ],
  [
    "full tags are kept as extratags",
    app.includes("extratags: {") &&
    app.includes("...place.tags")
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
  `Discover categories: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
