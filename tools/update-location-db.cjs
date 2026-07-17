#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function run(script, scriptArgs = []) {
  const result = spawnSync(
    process.execPath,
    [path.join(__dirname, script), ...scriptArgs],
    {
      cwd: root,
      stdio: "inherit"
    }
  );

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

run("import-osm-poland.cjs", args);
run("build-location-db.cjs");
