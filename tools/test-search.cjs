#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const { performance } = require("perf_hooks");

const root = path.resolve(__dirname, "..");

global.window = global;
global.performance = performance;
global.location = { protocol: "https:" };
global.window.location = global.location;

function load(relativePath) {
  const file = path.join(root, relativePath);
  vm.runInThisContext(
    fs.readFileSync(file, "utf8"),
    { filename: file }
  );
}

[
  "search-v2/lexicon/data-pl.js",
  "search-v2/lexicon/loader.js",
  "search-v2/location/compiled/pl-locations.compiled.js",
  "search-v2/location/resolver.js",
  "search-v2/parser.js",
  "search-v2/ranking/helpers.js",
  "search-v2/ranking/name.js",
  "search-v2/ranking/location.js",
  "search-v2/ranking/category.js",
  "search-v2/ranking/brand.js",
  "search-v2/ranking/modifiers.js",
  "search-v2/ranking/importance.js",
  "search-v2/ranking/final-score.js",
  "search-v2/ranker.js"
].forEach(load);

const corpus = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "search-v2/tests/search-corpus.json"
    ),
    "utf8"
  )
).cases;

const rankingFixtures = JSON.parse(
  fs.readFileSync(
    path.join(
      root,
      "search-v2/tests/ranking-fixtures.json"
    ),
    "utf8"
  )
);

function normalize(value) {
  return OMAP_SEARCH_V2_PARSER.normalize(value);
}

async function testCorpus() {
  const failures = [];
  const durations = [];

  for (const test of corpus) {
    const started = performance.now();
    const parsed =
      await OMAP_SEARCH_V2_PARSER.parse(test.query);
    const variants =
      await OMAP_SEARCH_V2_PARSER.expand(parsed);
    durations.push(performance.now() - started);

    const expected = test.expected;
    const checks = [];

    if (expected.kind) {
      checks.push([
        parsed.kind === expected.kind,
        `kind=${parsed.kind}`
      ]);
    }

    if (expected.category) {
      checks.push([
        parsed.category?.id === expected.category,
        `category=${parsed.category?.id || "null"}`
      ]);
    }

    if (expected.modifier) {
      checks.push([
        parsed.modifiers.some(
          item => item.id === expected.modifier
        ),
        `modifiers=${parsed.modifiers
          .map(item => item.id)
          .join(",")}`
      ]);
    }

    if (expected.brand) {
      checks.push([
        Boolean(parsed.brand),
        `brand=${parsed.brand?.id || "null"}`
      ]);
    }

    if (expected.city) {
      checks.push([
        parsed.locationResolution?.city?.id ===
          expected.city,
        `city=${
          parsed.locationResolution?.city?.id ||
          "null"
        }`
      ]);
    }

    if (expected.district) {
      checks.push([
        parsed.locationResolution?.district?.id ===
          expected.district,
        `district=${
          parsed.locationResolution?.district?.id ||
          "null"
        }`
      ]);
    }

    if (expected.locationContains) {
      checks.push([
        normalize(parsed.locationText).includes(
          normalize(expected.locationContains)
        ),
        `location=${parsed.locationText}`
      ]);
    }

    if (expected.preservesOriginal) {
      checks.push([
        variants.some(
          variant =>
            normalize(variant) ===
            normalize(test.query)
        ),
        "oryginalne zapytanie zniknęło"
      ]);
    }

    const failed = checks.filter(([ok]) => !ok);

    if (failed.length) {
      failures.push({
        query: test.query,
        reasons: failed.map(([, reason]) => reason)
      });
    }
  }

  return {
    total: corpus.length,
    passed: corpus.length - failures.length,
    failures,
    averageMs:
      durations.reduce((sum, value) => sum + value, 0) /
      Math.max(1, durations.length),
    maximumMs: Math.max(...durations)
  };
}

async function testRanking() {
  const failures = [];

  for (const fixture of rankingFixtures) {
    const parsed =
      await OMAP_SEARCH_V2_PARSER.parse(
        fixture.query
      );

    const ranked =
      OMAP_SEARCH_V2_RANKER.rank(
        parsed,
        fixture.results
      );

    if (
      ranked[0]?.name !== fixture.expectedTop
    ) {
      failures.push({
        query: fixture.query,
        expected: fixture.expectedTop,
        actual: ranked[0]?.name || null,
        ranking: ranked.map(item => ({
          name: item.name,
          score: item._searchV2.points,
          reasons: item._searchV2.reasons
        }))
      });
    }
  }

  return {
    total: rankingFixtures.length,
    passed:
      rankingFixtures.length - failures.length,
    failures
  };
}

(async () => {
  const parser = await testCorpus();
  const ranking = await testRanking();

  const report = {
    generatedAt: new Date().toISOString(),
    parser,
    ranking,
    coverage:
      parser.total
        ? parser.passed / parser.total
        : 0,
    thresholds: {
      parserCoverageRequired: 1,
      rankingCoverageRequired: 1,
      parserAverageMsMaximum: 10
    },
    passed:
      parser.failures.length === 0 &&
      ranking.failures.length === 0 &&
      parser.averageMs <= 10
  };

  const reportFile = path.join(
    root,
    "search-v2/tests/latest-report.json"
  );

  fs.writeFileSync(
    reportFile,
    JSON.stringify(report, null, 2) + "\n"
  );

  console.log(
    `Parser: ${parser.passed}/${parser.total} PASS`
  );
  console.log(
    `Ranking: ${ranking.passed}/${ranking.total} PASS`
  );
  console.log(
    `Parser średnio: ${parser.averageMs.toFixed(2)} ms`
  );
  console.log(
    `Pokrycie korpusu: ${(
      report.coverage * 100
    ).toFixed(1)}%`
  );

  for (const failure of parser.failures) {
    console.error(
      `FAIL ${failure.query}: ` +
      failure.reasons.join("; ")
    );
  }

  for (const failure of ranking.failures) {
    console.error(
      `RANK FAIL ${failure.query}: ` +
      `${failure.actual} zamiast ` +
      `${failure.expected}`
    );
  }

  process.exit(report.passed ? 0 : 1);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
