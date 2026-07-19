#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(root, "search-v2", "location", "source");
const compiledDir = path.join(root, "search-v2", "location", "compiled");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function uniqueStrings(values) {
  return [...new Set(values.map(String).filter(Boolean))];
}

const citySource = readJson(path.join(sourceDir, "pl-cities.json"));
const districtSource = readJson(path.join(sourceDir, "pl-districts.json"));

const cityIds = new Set();
const aliasOwners = new Map();
const cities = [];

for (const city of citySource.cities || []) {
  assert(city.id, "Miasto bez id");
  assert(city.name, `Miasto ${city.id} bez nazwy`);
  assert(!cityIds.has(city.id), `Duplikat miasta: ${city.id}`);
  cityIds.add(city.id);

  const aliases = uniqueStrings([city.name, ...(city.aliases || [])]);
  const districts = districtSource.districts?.[city.id] || [];
  const districtIds = new Set();

  for (const district of districts) {
    assert(district.id, `Dzielnica bez id w ${city.name}`);
    assert(district.name, `Dzielnica ${district.id} bez nazwy`);
    assert(
      !districtIds.has(district.id),
      `Duplikat dzielnicy ${district.id} w ${city.name}`
    );
    districtIds.add(district.id);
  }

  cities.push({
    ...city,
    aliases: uniqueStrings(city.aliases || []),
    districts: districts.map(district => ({
      ...district,
      aliases: uniqueStrings(district.aliases || [])
    }))
  });

  for (const alias of aliases) {
    const key = normalize(alias);
    const owners = aliasOwners.get(key) || [];
    owners.push({ type: "city", id: city.id, name: city.name });
    aliasOwners.set(key, owners);
  }

  for (const district of districts) {
    for (const alias of uniqueStrings([
      district.name,
      ...(district.aliases || [])
    ])) {
      const key = normalize(alias);
      const owners = aliasOwners.get(key) || [];
      owners.push({
        type: district.type || "district",
        id: district.id,
        name: district.name,
        parentCityId: city.id
      });
      aliasOwners.set(key, owners);
    }
  }
}

const tokenIndex = {};
for (const [alias, owners] of aliasOwners.entries()) {
  tokenIndex[alias] = owners;
}

const compiled = {
  version: 1,
  generatedAt: new Date().toISOString(),
  country: {
    id: "pl",
    name: "Polska",
    aliases: ["polska", "poland"]
  },
  stats: {
    cities: cities.length,
    districts: cities.reduce(
      (sum, city) => sum + city.districts.length,
      0
    ),
    aliases: Object.keys(tokenIndex).length
  },
  cities,
  tokenIndex
};

fs.mkdirSync(compiledDir, { recursive: true });

fs.writeFileSync(
  path.join(compiledDir, "pl-locations.compiled.json"),
  JSON.stringify(compiled, null, 2) + "\n"
);

fs.writeFileSync(
  path.join(compiledDir, "pl-locations.compiled.js"),
  "window.OMAP_SEARCH_V2_LOCATIONS_PL = " +
    JSON.stringify(compiled, null, 2) +
    ";\n"
);

const ambiguous = Object.entries(tokenIndex)
  .filter(([, owners]) => owners.length > 1)
  .map(([alias, owners]) => ({ alias, owners }));

fs.writeFileSync(
  path.join(compiledDir, "pl-locations-report.json"),
  JSON.stringify({
    stats: compiled.stats,
    ambiguousAliases: ambiguous
  }, null, 2) + "\n"
);

console.log(
  `Zbudowano bazę: ${compiled.stats.cities} miast, ` +
  `${compiled.stats.districts} dzielnic/osiedli, ` +
  `${compiled.stats.aliases} aliasów.`
);
