#!/usr/bin/env node
"use strict";
const fs=require("fs");
const path=require("path");
const app=fs.readFileSync(path.join(__dirname,"..","app.js"),"utf8");
const shared=app.match(/function loadSharedPlaceFromUrl\(\) \{[\s\S]*?\n  function initializeAutocomplete/)?.[0]||"";
const checks=[
 ["shared place has no moveend callback",!shared.includes('map.once("moveend"')],
 ["shared place opens immediately",shared.indexOf("showPlaceInformation")>=0 && shared.indexOf("showPlaceInformation")<shared.indexOf("map.flyTo")],
 ["shared place query parameter is consumed",shared.includes('url.searchParams.delete("place")')],
 ["favorite no longer defers reverse lookup",!/favorite-place-open[\s\S]*?map\.once\("moveend"[\s\S]*?showPlaceInformation/.test(app)],
 ["discover opens result before animation",/showSelectedPlaceInformation\(\{[\s\S]*?map\.easeTo\(\{/.test(app)]
];
let failures=0;
for(const [name,passed] of checks){if(!passed){failures++;console.error(`FAIL: ${name}`)}}
console.log(`Stale moveend callbacks: ${checks.length-failures}/${checks.length} PASS`);
process.exit(failures?1:0);
