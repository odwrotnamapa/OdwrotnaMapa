#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.resolve(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const html=fs.readFileSync(path.join(root,"index.html"),"utf8");
const doc=fs.readFileSync(path.join(root,"ARCHITECTURE.md"),"utf8");
const files=["src/models/place.js","src/components/bottom-sheet.js","src/components/place-card.js","src/components/photo-gallery.js","src/components/back-navigation.js","src/services/category-service.js","src/services/opening-hours-service.js","src/services/address-service.js","src/services/photo-cache.js","src/services/photo-source-resolver.js","src/services/photo-service.js","src/services/place-resolver-service.js","src/services/place-service.js"];
const c=[
["modules exist",files.every(f=>fs.existsSync(path.join(root,f)))],
["modules load first",files.every(f=>html.indexOf(f)<html.indexOf("app.js"))],
["all paths use PlaceService",['source: "favorite"','source: "discover"',': "search"','"search-history"','source: "map-info"'].every(x=>app.includes(x))],
["search guards remain",app.includes("session.assertActive();")&&app.includes("activateNamedPoiGuard(result)")&&app.includes("canReverseGeocodeForGuard(guardId)")],
["dead open fallbacks removed",!/async function openFavoritePlace[\s\S]*?showPlaceInformation\(/.test(app)&&!/async function openSearchPlaceThroughService[\s\S]*?showSelectedPlaceInformation\(/.test(app)&&!/async function openMapInformationThroughService[\s\S]*?showPlaceInformation\(/.test(app)],
["one back navigation",app.includes("OMAP_BACK_NAVIGATION.set(")&&app.includes("OMAP_BACK_NAVIGATION.clear(")&&app.includes("OMAP_BACK_NAVIGATION.goBack(")],
["no prototype wrappers",!app.includes("showSelectedPlaceInformationLegacy")&&!app.includes("showPlaceInformationLegacy")],
["final docs",doc.includes("Architektura 2.0 — stan końcowy")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`Architecture 2.0 final: ${c.length-f}/${c.length} PASS`);process.exit(f?1:0);
