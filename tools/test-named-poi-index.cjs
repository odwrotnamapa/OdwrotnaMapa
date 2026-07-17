#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;

for (const file of [
  "search-v2/named-poi/pl-named-poi.js",
  "search-v2/named-poi/provider.js"
]) {
  vm.runInThisContext(
    fs.readFileSync(path.join(root, file), "utf8")
  );
}

async function run() {
  const cases = [
    ["Galeria Bałtycka", "Galeria Bałtycka"],
    ["Bałtycka", "Galeria Bałtycka"],
    ["CH Przymorze", "Galeria Przymorze"],
    ["Forum", "Forum Gdańsk"],
    ["PKiN", "Pałac Kultury i Nauki"],
    ["Morskie Oko", "Morskie Oko"]
  ];

  let failures = 0;

  for (const [query, expected] of cases) {
    const results =
      await OMAP_SEARCH_V2_PROVIDER_NAMED_POI.searchQuery(
        query,
        { limit: 8 }
      );

    const actual = results[0]?.name;

    if (actual !== expected) {
      failures++;
      console.error(
        `FAIL ${query}: ${actual} zamiast ${expected}`
      );
    }

    if (!results[0]?._exactLocalIdentity) {
      failures++;
      console.error(
        `FAIL ${query}: brak blokady lokalnej tożsamości`
      );
    }
  }


  const galleryResults =
    await OMAP_SEARCH_V2_PROVIDER_NAMED_POI.searchQuery(
      "galeria",
      { limit: 8 }
    );

  if (
    !galleryResults.length ||
    galleryResults[0]?.type !== "mall"
  ) {
    failures++;
    console.error(
      "FAIL galeria: brak wyniku centrum handlowego"
    );
  }

  const manager = fs.readFileSync(
    path.join(
      root,
      "search-v2",
      "providers",
      "manager.js"
    ),
    "utf8"
  );

  const importance = fs.readFileSync(
    path.join(
      root,
      "search-v2",
      "ranking",
      "importance.js"
    ),
    "utf8"
  );

  const structural = [
    [
      "provider registered",
      manager.includes(
        "OMAP_SEARCH_V2_PROVIDER_NAMED_POI"
      )
    ],
    [
      "local identity ranking bonus",
      importance.includes(
        "dokładny wynik z Indeksu Nazw OMapy"
      )
    ]
  ];

  for (const [name, passed] of structural) {
    if (!passed) {
      failures++;
      console.error(`FAIL ${name}`);
    }
  }

  console.log(
    `Named POI index: ${
      cases.length * 2 + structural.length + 1 - failures
    }/${cases.length * 2 + structural.length + 1} PASS`
  );

  process.exit(failures ? 1 : 0);
}

run();
