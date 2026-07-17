#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sourceDir = path.join(
  root,
  "search-v2",
  "location",
  "source"
);

const DEFAULT_OVERPASS_URL =
  "https://overpass-api.de/api/interpreter";

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value)
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function unique(values) {
  return [...new Set(
    values
      .map(value => String(value || "").trim())
      .filter(Boolean)
  )];
}

function firstTag(tags, names) {
  for (const name of names) {
    if (tags?.[name]) return tags[name];
  }
  return "";
}

function splitAltNames(value) {
  return String(value || "")
    .split(/[;|]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function getAliases(tags, primaryName) {
  const aliases = [
    ...splitAltNames(tags?.alt_name),
    ...splitAltNames(tags?.short_name),
    ...splitAltNames(tags?.loc_name),
    ...splitAltNames(tags?.old_name),
    ...splitAltNames(tags?.["name:pl"]),
    ...splitAltNames(tags?.["name:de"]),
    ...splitAltNames(tags?.["name:en"])
  ];

  return unique(aliases).filter(
    alias => normalize(alias) !== normalize(primaryName)
  );
}

function inferType(tags) {
  const place = tags?.place;
  const boundary = tags?.boundary;
  const adminLevel = Number(tags?.admin_level);

  if (
    place === "city" ||
    place === "town"
  ) {
    return "city";
  }

  if (
    ["suburb", "quarter", "neighbourhood"].includes(place)
  ) {
    return place === "neighbourhood"
      ? "neighbourhood"
      : "district";
  }

  if (
    boundary === "administrative" &&
    Number.isFinite(adminLevel)
  ) {
    if (adminLevel <= 8) return "city";
    if (adminLevel >= 9) return "district";
  }

  return null;
}

function getElementName(element) {
  return firstTag(element.tags, [
    "name",
    "name:pl",
    "official_name"
  ]);
}

function getCenter(element) {
  if (
    Number.isFinite(element.lat) &&
    Number.isFinite(element.lon)
  ) {
    return {
      lat: element.lat,
      lon: element.lon
    };
  }

  if (
    Number.isFinite(element.center?.lat) &&
    Number.isFinite(element.center?.lon)
  ) {
    return {
      lat: element.center.lat,
      lon: element.center.lon
    };
  }

  return null;
}

function buildIndexes(elements) {
  const byOsm = new Map();
  const citiesByName = new Map();

  for (const element of elements) {
    byOsm.set(
      `${element.type}/${element.id}`,
      element
    );

    const name = getElementName(element);
    const type = inferType(element.tags);

    if (name && type === "city") {
      citiesByName.set(normalize(name), element);
    }
  }

  return { byOsm, citiesByName };
}

function inferParentCity(
  element,
  indexes,
  knownCities
) {
  const tags = element.tags || {};

  const parentName = firstTag(tags, [
    "addr:city",
    "is_in:city",
    "is_in",
    "parent",
    "city"
  ]);

  if (parentName) {
    const normalizedParent = normalize(parentName);

    const known = knownCities.find(city =>
      normalize(city.name) === normalizedParent ||
      (city.aliases || []).some(
        alias => normalize(alias) === normalizedParent
      )
    );

    if (known) return known.id;

    const osmCity = indexes.citiesByName.get(
      normalizedParent
    );

    if (osmCity) {
      return slugify(getElementName(osmCity));
    }
  }

  // Relations often contain a parent administrative relation.
  for (const member of element.members || []) {
    if (
      member.role === "subarea" ||
      member.role === "admin_centre"
    ) {
      const parent = indexes.byOsm.get(
        `${member.type}/${member.ref}`
      );

      if (
        parent &&
        inferType(parent.tags) === "city"
      ) {
        return slugify(getElementName(parent));
      }
    }
  }

  return null;
}

function parseOverpass(data, existingCities) {
  const elements = Array.isArray(data?.elements)
    ? data.elements
    : [];

  const indexes = buildIndexes(elements);
  const cities = new Map(
    existingCities.map(city => [city.id, {
      ...city,
      aliases: unique(city.aliases || [])
    }])
  );

  const districts = {};

  for (const element of elements) {
    const name = getElementName(element);
    const entityType = inferType(element.tags);

    if (!name || !entityType) continue;

    const id = slugify(name);
    if (!id) continue;

    const center = getCenter(element);
    const aliases = getAliases(
      element.tags,
      name
    );

    if (entityType === "city") {
      const existing = cities.get(id);

      cities.set(id, {
        id,
        name,
        aliases: unique([
          ...(existing?.aliases || []),
          ...aliases
        ]),
        voivodeship:
          existing?.voivodeship ||
          element.tags?.["is_in:state"] ||
          element.tags?.["addr:state"] ||
          "",
        osm: {
          type: element.type,
          id: element.id
        },
        center: center || existing?.center || null
      });

      continue;
    }

    const cityList = [...cities.values()];
    const parentCityId = inferParentCity(
      element,
      indexes,
      cityList
    );

    if (!parentCityId) continue;

    if (!districts[parentCityId]) {
      districts[parentCityId] = [];
    }

    const existing = districts[parentCityId]
      .find(item => item.id === id);

    const district = {
      id,
      name,
      aliases,
      type:
        entityType === "neighbourhood"
          ? "neighbourhood"
          : "district",
      osm: {
        type: element.type,
        id: element.id
      },
      center
    };

    if (!existing) {
      districts[parentCityId].push(district);
    } else {
      existing.aliases = unique([
        ...existing.aliases,
        ...aliases
      ]);
      existing.center ||= center;
    }
  }

  return {
    cities: [...cities.values()]
      .sort((a, b) =>
        a.name.localeCompare(b.name, "pl")
      ),
    districts
  };
}

function readJson(file) {
  return JSON.parse(
    fs.readFileSync(file, "utf8")
  );
}

function writeJson(file, value) {
  fs.writeFileSync(
    file,
    JSON.stringify(value, null, 2) + "\n"
  );
}

async function downloadOverpass(
  outputFile,
  apiUrl = DEFAULT_OVERPASS_URL
) {
  const query = `
[out:json][timeout:180];
area["ISO3166-1"="PL"][admin_level=2]->.poland;
(
  nwr(area.poland)
    ["place"~"^(city|town|suburb|quarter|neighbourhood)$"];
  relation(area.poland)
    ["boundary"="administrative"]
    ["admin_level"~"^(8|9|10|11)$"];
);
out center tags;
`;

  console.log(
    `Pobieranie danych z ${apiUrl}...`
  );

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type":
        "application/x-www-form-urlencoded;charset=UTF-8",
      "User-Agent":
        "OMapa Location Database Importer"
    },
    body: new URLSearchParams({
      data: query
    })
  });

  if (!response.ok) {
    throw new Error(
      `Overpass HTTP ${response.status}`
    );
  }

  const text = await response.text();
  fs.writeFileSync(outputFile, text);
  console.log(`Zapisano ${outputFile}`);
}

function parseArgs(argv) {
  const args = {
    input: "",
    download: false,
    api: DEFAULT_OVERPASS_URL,
    replaceDistricts: false
  };

  for (let i = 0; i < argv.length; i += 1) {
    switch (argv[i]) {
      case "--input":
        args.input = argv[++i] || "";
        break;
      case "--download":
        args.download = true;
        break;
      case "--api":
        args.api = argv[++i] || DEFAULT_OVERPASS_URL;
        break;
      case "--replace-districts":
        args.replaceDistricts = true;
        break;
      case "--help":
        console.log(`
Użycie:
  node tools/import-osm-poland.cjs --input pl-overpass.json
  node tools/import-osm-poland.cjs --download
  node tools/import-osm-poland.cjs --download --api URL

Opcje:
  --input FILE          Importuj istniejący Overpass JSON.
  --download            Pobierz dane z Overpass API.
  --api URL             Własny endpoint Overpass.
  --replace-districts   Zastąp istniejące dzielnice zamiast scalać.
`);
        process.exit(0);
    }
  }

  return args;
}

function mergeDistricts(
  oldDistricts,
  newDistricts,
  replace
) {
  if (replace) return newDistricts;

  const result = structuredClone(
    oldDistricts || {}
  );

  for (
    const [cityId, imported] of
    Object.entries(newDistricts)
  ) {
    result[cityId] ||= [];

    for (const item of imported) {
      const existing = result[cityId]
        .find(entry => entry.id === item.id);

      if (!existing) {
        result[cityId].push(item);
        continue;
      }

      existing.aliases = unique([
        ...(existing.aliases || []),
        ...(item.aliases || [])
      ]);

      existing.osm ||= item.osm;
      existing.center ||= item.center;
    }
  }

  return result;
}

async function main() {
  const args = parseArgs(
    process.argv.slice(2)
  );

  const inputFile = path.resolve(
    root,
    args.input ||
      "samples/pl-overpass-sample.json"
  );

  if (args.download) {
    await downloadOverpass(
      inputFile,
      args.api
    );
  }

  if (!fs.existsSync(inputFile)) {
    throw new Error(
      `Nie znaleziono pliku: ${inputFile}`
    );
  }

  const cityFile = path.join(
    sourceDir,
    "pl-cities.json"
  );
  const districtFile = path.join(
    sourceDir,
    "pl-districts.json"
  );

  const existingCityData = readJson(cityFile);
  const existingDistrictData =
    readJson(districtFile);

  const imported = parseOverpass(
    readJson(inputFile),
    existingCityData.cities || []
  );

  writeJson(cityFile, {
    version: 2,
    importedAt: new Date().toISOString(),
    cities: imported.cities
  });

  writeJson(districtFile, {
    version: 2,
    importedAt: new Date().toISOString(),
    districts: mergeDistricts(
      existingDistrictData.districts,
      imported.districts,
      args.replaceDistricts
    )
  });

  console.log(
    `Import zakończony: ` +
    `${imported.cities.length} miast, ` +
    `${Object.values(imported.districts)
      .reduce(
        (sum, list) => sum + list.length,
        0
      )} nowych dzielnic/osiedli.`
  );

  console.log(
    "Teraz uruchom: " +
    "node tools/build-location-db.cjs"
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
