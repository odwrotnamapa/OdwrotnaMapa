#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const seedPath = path.join(
  root, "search-v2", "named-poi", "pl-named-poi.json"
);
const fetchedPath = process.argv[2] || path.join(
  root, "search-v2", "named-poi", "wikidata-poi.json"
);

const seed = JSON.parse(fs.readFileSync(seedPath, "utf8"));
const fetched = JSON.parse(fs.readFileSync(fetchedPath, "utf8"));

const normalize = value => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const records = new Map();

for (const record of [...fetched.records, ...seed.records]) {
  const key =
    record.id ||
    `${normalize(record.name)}:${Number(record.lat).toFixed(4)}:${Number(record.lon).toFixed(4)}`;

  const existing = records.get(key);

  records.set(key, existing
    ? {
        ...existing,
        ...record,
        aliases: [...new Set([
          ...(existing.aliases || []),
          ...(record.aliases || [])
        ])],
        keywords: [...new Set([
          ...(existing.keywords || []),
          ...(record.keywords || [])
        ])],
        extratags: {
          ...(existing.extratags || {}),
          ...(record.extratags || {})
        }
      }
    : record
  );
}

const output = {
  version: 2,
  name: "Indeks nazwanych miejsc OMapy",
  generatedAt: new Date().toISOString(),
  recordCount: records.size,
  records: [...records.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "pl")
  )
};

fs.writeFileSync(seedPath, JSON.stringify(output, null, 2) + "\n");
fs.writeFileSync(
  seedPath.replace(/\.json$/, ".js"),
  "window.OMAP_NAMED_POI_INDEX = " + JSON.stringify(output) + ";\n"
);

console.log(`Połączono ${records.size} rekordów.`);
