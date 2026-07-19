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
const component = fs.readFileSync(
  path.join(
    root,
    "src/components/bottom-sheet.js"
  ),
  "utf8"
);

const panels = [
  "legend-panel",
  "route-panel",
  "favorites-panel",
  "place-panel",
  "about-panel",
  "discover-panel",
  "menu-panel"
];

const handles = [
  "legend-sheet-handle",
  "route-sheet-handle",
  "favorites-sheet-handle",
  "place-sheet-handle",
  "about-sheet-handle",
  "discover-sheet-handle",
  "menu-sheet-handle"
];

const checks = [
  [
    "all panels use one component class",
    panels.every(id =>
      new RegExp(
        `id="${id}"[\\s\\S]{0,160}class="[^"]*app-sheet`
      ).test(html)
    )
  ],
  [
    "all handles use one component class",
    handles.every(id =>
      new RegExp(
        `id="${id}"[\\s\\S]{0,180}class="[^"]*app-sheet__handle`
      ).test(html)
    )
  ],
  [
    "all headers use one component class",
    (
      html.match(
        /app-sheet__header/g
      ) || []
    ).length >= 7
  ],
  [
    "one component owns drag behavior",
    component.includes(
      "function startDrag(event)"
    ) &&
    component.includes(
      "function moveDrag(event)"
    ) &&
    component.includes(
      "function finishDrag(event)"
    )
  ],
  [
    "one component owns opening and collapse",
    component.includes(
      "function open()"
    ) &&
    component.includes(
      "function collapse()"
    ) &&
    component.includes(
      "function toggle()"
    )
  ],
  [
    "application registers panels declaratively",
    app.includes(
      "function initializeApplicationPanels()"
    ) &&
    app.includes(
      "const definitions = ["
    )
  ],
  [
    "old duplicated panel engine is removed",
    !app.includes(
      "const MOBILE_PANEL_STANDARD"
    ) &&
    !app.includes(
      "function initializeRouteBottomSheet"
    ) &&
    !app.includes(
      "function initializeLegendBottomSheet"
    )
  ],
  [
    "all panels share one height variable",
    style.includes(
      "--app-sheet-height"
    ) &&
    !component.includes(
      "--route-sheet-height"
    )
  ],
  [
    "one CSS shell controls appearance",
    style.includes(".app-sheet {") &&
    style.includes(".app-sheet__header") &&
    style.includes(".app-sheet__handle")
  ],
  [
    "one collapsed rule controls all panels",
    style.includes(
      ".app-sheet.is-collapsed"
    ) &&
    style.includes(
      "> :not(.app-sheet__handle)"
    )
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
  `Universal panel component: ${
    checks.length - failures
  }/${checks.length} PASS`
);

process.exit(failures ? 1 : 0);
