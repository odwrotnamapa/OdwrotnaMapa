#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const css=fs.readFileSync(path.join(root,"style.css"),"utf8");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");

const checks=[
["legend handle exists",html.includes('id="legend-sheet-handle"')],
["about handle exists",html.includes('id="about-sheet-handle"')],
["legend handle wired",app.includes("legendSheetHandle")],
["about handle wired",app.includes("aboutSheetHandle")],
["mobile corners forced zero",css.includes("*::after")&&css.includes("border-radius: 0 !important")],
["mobile panel ids covered",css.includes("#legend-panel")&&css.includes("#about-panel")&&css.includes("#menu-panel")],
["shared slider style exists",css.includes(".sheet-handle")&&!css.includes("#legend-sheet-handle::before")&&!css.includes("#about-sheet-handle::before")]
];

let fail=0;
for(const [name,ok] of checks){if(!ok){fail++;console.error(`FAIL: ${name}`)}}
console.log(`Mobile square/slider fix: ${checks.length-fail}/${checks.length} PASS`);
process.exit(fail?1:0);
