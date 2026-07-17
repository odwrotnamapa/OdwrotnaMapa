#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
global.window = global;

function load(relativePath) {
  vm.runInThisContext(
    fs.readFileSync(
      path.join(root, relativePath),
      "utf8"
    )
  );
}

load("search-v2/teryt/pl-teryt-index.js");
load("search-v2/teryt/provider.js");

const cases = [
  {
    result: {
      name: "Gdańsk",
      address: { city: "Gdańsk" }
    },
    expected: "pomorskie"
  },
  {
    result: {
      name: "Warszawa",
      address: { state: "Województwo mazowieckie" }
    },
    expected: "mazowieckie"
  },
  {
    result: {
      name: "Kraków",
      address: { state: "Lesser Poland Voivodeship" }
    },
    expected: "małopolskie"
  }
];

let failures = 0;

for (const test of cases) {
  const enriched = OMAP_TERYT.enrich(test.result);
  const actual = enriched.voivodeship || null;

  if (actual !== test.expected) {
    failures += 1;
    console.error(
      `FAIL ${test.result.name}: ` +
      `${actual} zamiast ${test.expected}`
    );
  }
}

console.log(
  `TERYT: ${cases.length - failures}/${cases.length} PASS`
);
process.exit(failures ? 1 : 0);
