#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function argument(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : null;
}

const tercPath = argument("--terc");
const simcPath = argument("--simc");
const outputPath =
  argument("--output") ||
  path.join(
    root,
    "search-v2",
    "teryt",
    "pl-teryt-imported.json"
  );

if (!tercPath || !simcPath) {
  console.error(
    "Użycie: node tools/import-teryt.cjs " +
    "--terc TERC.csv --simc SIMC.csv " +
    "[--output index.json]"
  );
  process.exit(1);
}

function decode(buffer) {
  for (const encoding of ["utf8", "latin1"]) {
    try {
      return new TextDecoder(encoding, {
        fatal: encoding === "utf8"
      }).decode(buffer);
    } catch (_) {}
  }
  return buffer.toString("utf8");
}

function detectDelimiter(header) {
  const candidates = [";", ",", "\t"];
  return candidates
    .map(delimiter => ({
      delimiter,
      count: header.split(delimiter).length
    }))
    .sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseCsv(filePath) {
  const text = decode(fs.readFileSync(filePath))
    .replace(/^\uFEFF/, "");
  const lines = text
    .split(/\r?\n/)
    .filter(Boolean);

  if (!lines.length) return [];

  const delimiter = detectDelimiter(lines[0]);
  const headers = lines[0]
    .split(delimiter)
    .map(value => value.trim().replace(/^"|"$/g, ""));

  return lines.slice(1).map(line => {
    const values = line
      .split(delimiter)
      .map(value =>
        value.trim().replace(/^"|"$/g, "")
      );

    return Object.fromEntries(
      headers.map((header, index) => [
        header,
        values[index] || ""
      ])
    );
  });
}

const terc = parseCsv(tercPath);
const simc = parseCsv(simcPath);

const voivodeships = new Map();
const counties = new Map();
const municipalities = new Map();

for (const row of terc) {
  const woj = row.WOJ || row.woj;
  const pow = row.POW || row.pow;
  const gmi = row.GMI || row.gmi;
  const rodz = row.RODZ || row.RODZ_GMI || row.rodz;
  const name = row.NAZWA || row.nazwa;
  const descriptor =
    row.NAZWA_DOD || row.nazwa_dod || "";

  if (!woj || !name) continue;

  if (!pow) {
    voivodeships.set(woj, {
      code: woj,
      name,
      type: "voivodeship"
    });
  } else if (!gmi) {
    counties.set(`${woj}${pow}`, {
      code: `${woj}${pow}`,
      name,
      voivodeshipCode: woj,
      type: "county"
    });
  } else {
    municipalities.set(`${woj}${pow}${gmi}${rodz}`, {
      code: `${woj}${pow}${gmi}${rodz}`,
      name,
      descriptor,
      voivodeshipCode: woj,
      countyCode: `${woj}${pow}`,
      type: "municipality"
    });
  }
}

const places = simc.map(row => {
  const woj = row.WOJ || row.woj;
  const pow = row.POW || row.pow;
  const gmi = row.GMI || row.gmi;
  const rodzGmi =
    row.RODZ_GMI || row.RODZ || row.rodz_gmi;
  const sym = row.SYM || row.sym;
  const name = row.NAZWA || row.nazwa;
  const typeCode = row.RM || row.rm;

  const municipalityCode =
    `${woj}${pow}${gmi}${rodzGmi}`;
  const municipality =
    municipalities.get(municipalityCode);
  const county = counties.get(`${woj}${pow}`);
  const voivodeship = voivodeships.get(woj);

  return {
    id: `simc:${sym}`,
    teryt: sym,
    name,
    type: "locality",
    localityTypeCode: typeCode,
    voivodeship:
      voivodeship?.name || "",
    voivodeshipCode: woj,
    county: county?.name || "",
    countyCode: `${woj}${pow}`,
    municipality:
      municipality?.name || "",
    municipalityCode
  };
}).filter(item => item.name && item.teryt);

const output = {
  version: 1,
  source: "TERYT / GUS",
  importedAt: new Date().toISOString(),
  voivodeships: [...voivodeships.values()],
  counties: [...counties.values()],
  municipalities: [...municipalities.values()],
  places
};

fs.mkdirSync(path.dirname(outputPath), {
  recursive: true
});
fs.writeFileSync(
  outputPath,
  JSON.stringify(output, null, 2) + "\n"
);

console.log(
  `Zaimportowano: ` +
  `${output.voivodeships.length} województw, ` +
  `${output.counties.length} powiatów, ` +
  `${output.municipalities.length} gmin, ` +
  `${output.places.length} miejscowości.`
);
console.log(outputPath);
