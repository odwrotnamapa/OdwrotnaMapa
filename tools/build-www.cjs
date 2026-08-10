// Kopiuje pliki potrzebne w przeglądarce (bez tools/, samples/, testów itd.)
// do folderu www/, który Capacitor pakuje do apki Android/iOS.
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, "www");

const items = [
  "index.html",
  "style.css",
  "config.js",
  "app.js",
  "assets",
  "search-v2",
  "src"
];

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

for (const item of items) {
  const from = path.join(root, item);
  const to = path.join(dest, item);
  fs.cpSync(from, to, { recursive: true });
}

console.log(`Skopiowano ${items.length} pozycji do ${dest}`);
