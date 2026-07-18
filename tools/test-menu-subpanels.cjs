#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(
  path.join(root, "index.html"),
  "utf8"
);
const app = fs.readFileSync(
  path.join(root, "app.js"),
  "utf8"
);
const style = fs.readFileSync(
  path.join(root, "style.css"),
  "utf8"
);

const checks = [
  [
    "legend has menu back button",
    html.includes('id="legend-back"') &&
    html.includes(
      'id="legend-panel" class="legend-panel menu-subpanel"'
    )
  ],
  [
    "about has menu back button",
    html.includes('id="about-back"') &&
    html.includes(
      "about-panel menu-subpanel"
    )
  ],
  [
    "favorites has menu back button",
    html.includes('id="favorites-back"')
  ],
  [
    "back navigation opens menu home",
    app.includes("function openMenuHome()") &&
    app.includes("returnFromLegendToMenu") &&
    app.includes("returnFromAboutToMenu") &&
    app.includes("returnFromFavoritesToMenu")
  ],
  [
    "menu actions open nested panels directly",
    app.includes("openLegendFromMenu") &&
    app.includes("openAboutFromMenu")
  ],
  [
    "mobile menu subpanels use panel layout",
    style.includes(".menu-subpanel {") &&
    style.includes("bottom: 8px !important") &&
    style.includes(
      "height: min(42vh, calc(100vh - 16px))"
    )
  ],
  [
    "mobile nested panels replace controls",
    style.includes(
      "body:has(.legend-panel.menu-subpanel:not([hidden])) .toolbar"
    ) &&
    style.includes(
      "body:has(.about-panel.menu-subpanel:not([hidden])) .mobile-bottom-nav"
    )
  ],
  [
    "back labels are localized",
    app.includes('backToMenu: "Wróć do menu"') &&
    app.includes('backToMenu: "Back to menu"')
  ]
];

let failures = 0;

for (const [name, passed] of checks) {
  if (!passed) {
    failures += 1;
    console.error(`FAIL: ${name}`);
  }
}

console.log(
  `Menu subpanels: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
