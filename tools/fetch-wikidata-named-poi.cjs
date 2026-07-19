#!/usr/bin/env node
"use strict";

/*
  Pobiera nazwane miejsca w Polsce z Wikidata Query Service.
  Wymaga Node.js 18+ i dostępu do internetu.

  Użycie:
    node tools/fetch-wikidata-named-poi.cjs
    node tools/fetch-wikidata-named-poi.cjs --output search-v2/named-poi/wikidata-poi.json
*/

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
const arg = name => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
};

const root = path.resolve(__dirname, "..");
const outputPath =
  arg("--output") ||
  path.join(root, "search-v2", "named-poi", "wikidata-poi.json");

const categories = [
  ["Q11315", "mall", "shopping_mall", "shop", ["galeria", "centrum handlowe", "zakupy"]],
  ["Q55488", "station", "railway_station", "railway", ["dworzec", "stacja kolejowa", "kolej"]],
  ["Q1248784", "airport", "airport", "aeroway", ["lotnisko", "port lotniczy"]],
  ["Q483110", "stadium", "stadium", "leisure", ["stadion", "arena", "sport"]],
  ["Q33506", "museum", "museum", "tourism", ["muzeum", "wystawa"]],
  ["Q23413", "castle", "castle", "historic", ["zamek", "pałac", "zabytek"]],
  ["Q16917", "hospital", "hospital", "amenity", ["szpital", "medycyna"]],
  ["Q3918", "university", "university", "amenity", ["uczelnia", "uniwersytet"]],
  ["Q46169", "national_park", "national_park", "boundary", ["park narodowy", "przyroda"]],
  ["Q23397", "lake", "lake", "natural", ["jezioro", "woda"]],
  ["Q8502", "peak", "peak", "natural", ["góra", "szczyt"]],
  ["Q43501", "zoo", "zoo", "tourism", ["zoo", "ogród zoologiczny"]],
  ["Q24354", "theatre", "theatre", "amenity", ["teatr", "kultura"]],
  ["Q22698", "park", "park", "leisure", ["park", "zieleń"]]
];

function parsePoint(value) {
  const match = String(value || "").match(
    /Point\(([-\d.]+)\s+([-\d.]+)\)/
  );
  return match
    ? { lon: Number(match[1]), lat: Number(match[2]) }
    : null;
}

function slug(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function fetchCategory(config) {
  const [qid, type, category, klass, keywords] = config;

  const query = `
SELECT DISTINCT ?item ?itemLabel ?coord ?website ?image WHERE {
  ?item wdt:P17 wd:Q36;
        wdt:P31/wdt:P279* wd:${qid};
        wdt:P625 ?coord.
  OPTIONAL { ?item wdt:P856 ?website. }
  OPTIONAL { ?item wdt:P18 ?image. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "pl,en".
  }
}`;

  const url =
    "https://query.wikidata.org/sparql?format=json&query=" +
    encodeURIComponent(query);

  const response = await fetch(url, {
    headers: {
      Accept: "application/sparql-results+json",
      "User-Agent": "OMapa-Named-POI-Builder/1.0"
    }
  });

  if (!response.ok) {
    throw new Error(`Wikidata ${qid}: HTTP ${response.status}`);
  }

  const json = await response.json();

  return json.results.bindings
    .map(binding => {
      const point = parsePoint(binding.coord?.value);
      const name = binding.itemLabel?.value;

      if (!point || !name || /^Q\d+$/.test(name)) return null;

      return {
        id: `wikidata:${binding.item.value.split("/").pop()}`,
        name,
        aliases: [],
        keywords,
        type,
        category,
        class: klass,
        lat: point.lat,
        lon: point.lon,
        address: {
          country: "Polska"
        },
        extratags: {
          website: binding.website?.value || "",
          image: binding.image?.value || "",
          wikidata: binding.item.value.split("/").pop()
        },
        priority: 850,
        source: "Wikidata"
      };
    })
    .filter(Boolean);
}

(async () => {
  const records = [];

  for (const category of categories) {
    console.log(`Pobieranie ${category[0]}...`);

    try {
      records.push(...await fetchCategory(category));
    } catch (error) {
      console.warn(error.message);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const unique = new Map();

  for (const record of records) {
    const key = record.id || `${slug(record.name)}:${record.lat}:${record.lon}`;
    if (!unique.has(key)) unique.set(key, record);
  }

  const output = {
    version: 2,
    name: "Indeks nazwanych miejsc OMapy — Wikidata",
    generatedAt: new Date().toISOString(),
    recordCount: unique.size,
    records: [...unique.values()]
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(
    outputPath,
    JSON.stringify(output, null, 2) + "\n"
  );

  console.log(`Zapisano ${unique.size} rekordów: ${outputPath}`);
})();
