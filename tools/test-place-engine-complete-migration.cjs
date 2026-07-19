#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);
const architecture = fs.readFileSync(
  path.join(root, "ARCHITECTURE.md"),
  "utf8"
);

const checks = [
  [
    "autocomplete uses PlaceService",
    /origin: "autocomplete"[\s\S]*?map\.flyTo/.test(app) &&
    app.includes("openSearchPlaceThroughService(")
  ],
  [
    "Enter search uses PlaceService",
    app.includes('origin: "search-submit"')
  ],
  [
    "search history uses PlaceService",
    app.includes('origin: "search-history"') &&
    app.includes("reverse: !isExactPlace")
  ],
  [
    "right-click information uses PlaceService",
    app.includes(
      'origin: "map-context-menu"'
    ) &&
    app.includes(
      "openMapInformationThroughService("
    )
  ],
  [
    "central adapter supports all sources",
    [
      '"favorite"',
      '"discover"',
      '"search"',
      '"search-history"',
      '"map-info"'
    ].every(source =>
      app.includes(source)
    )
  ],
  [
    "Named POI selected renderer remains intact",
    app.includes(
      "async function showSelectedPlaceInformation(result)"
    ) &&
    app.includes(
      "activateNamedPoiGuard(result)"
    )
  ],
  [
    "reverse renderer remains intact",
    app.includes(
      "async function showPlaceInformation(event)"
    ) &&
    app.includes(
      "canReverseGeocodeForGuard(guardId)"
    )
  ],
  [
    "search session protections remain",
    app.includes(
      "session.assertActive();"
    ) &&
    app.includes(
      "const result = session.select("
    )
  ],
  [
    "no legacy wrapper regression",
    !app.includes(
      "showSelectedPlaceInformationLegacy"
    ) &&
    !app.includes(
      "showPlaceInformationLegacy"
    )
  ],
  [
    "complete migration is documented",
    architecture.includes(
      "Zakończenie migracji Place Engine"
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
  `Place Engine complete migration: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
