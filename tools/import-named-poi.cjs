#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argument(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

const inputPath = argument("--input");
const outputPath =
  argument("--output") ||
  path.join(
    root,
    "search-v2",
    "named-poi",
    "pl-named-poi.json"
  );

if (!inputPath) {
  console.error(
    "Użycie: node tools/import-named-poi.cjs " +
    "--input miejsca.csv [--output indeks.json]"
  );
  process.exit(1);
}

function parseCsv(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(Boolean);

  if (!lines.length) return [];

  const delimiter =
    lines[0].split(";").length >=
    lines[0].split(",").length
      ? ";"
      : ",";

  const headers = lines[0]
    .split(delimiter)
    .map(value => value.trim());

  return lines.slice(1).map(line => {
    const values = line
      .split(delimiter)
      .map(value => value.trim());

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] || ""
      ])
    );
  });
}

function normalizeRecord(row, index) {
  const aliases = Array.isArray(row.aliases)
    ? row.aliases
    : String(row.aliases || "")
        .split("|")
        .map(value => value.trim())
        .filter(Boolean);

  const lat = Number(row.lat);
  const lon = Number(row.lon);

  if (!row.name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error(
      `Niepoprawny rekord ${index + 1}: wymagane name, lat, lon`
    );
  }

  return {
    id:
      row.id ||
      `omap:poi:${String(row.name)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")}`,
    name: row.name,
    aliases,
    type: row.type || "attraction",
    category: row.category || row.type || "place",
    class: row.class || "place",
    lat,
    lon,
    address: {
      road: row.road || "",
      house_number: row.house_number || "",
      city: row.city || "",
      state: row.voivodeship || row.state || "",
      country: row.country || "Polska"
    },
    extratags: {
      website: row.website || "",
      opening_hours: row.opening_hours || "",
      image: row.image || "",
      wikimedia_commons: row.wikimedia_commons || ""
    },
    city: row.city || "",
    voivodeship: row.voivodeship || row.state || "",
    priority: Number(row.priority || 1000),
    source: row.source || "OMapa Named POI"
  };
}

const raw = fs.readFileSync(inputPath, "utf8");
const extension = path.extname(inputPath).toLowerCase();

const input =
  extension === ".json"
    ? JSON.parse(raw)
    : parseCsv(raw);

const rows = Array.isArray(input)
  ? input
  : input.records || [];

const records = rows.map(normalizeRecord);

const output = {
  version: 1,
  name: "Indeks nazwanych miejsc OMapy",
  generatedAt: new Date().toISOString(),
  records
};

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});

fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2) + "\n"
);

const jsPath = outputPath.replace(/\.json$/i, ".js");
fs.writeFileSync(
  jsPath,
  "window.OMAP_NAMED_POI_INDEX = " +
    JSON.stringify(output) +
    ";\n"
);

console.log(
  `Zaimportowano ${records.length} nazwanych miejsc.`
);
console.log(outputPath);
console.log(jsPath);
