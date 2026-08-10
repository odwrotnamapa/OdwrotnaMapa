#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const c=[
["shared config",app.includes("const MOBILE_PANEL_STANDARD")],
["shared open",app.includes("function openMobilePanelStandard")],
["shared collapse",app.includes("function collapseMobilePanelStandard")],
["shared stabilize",app.includes("function stabilizeMobilePanelStandard")],
["same default",app.includes("defaultHeightRatio: 0.42")],
["same collapsed",app.includes("collapsedHeight: 48")],
["free drag",app.includes("startHeight + delta")],
["visual viewport",app.includes("window.visualViewport?.height")],
["universal CSS",style.includes("--mobile-panel-default-height: 42dvh")],
["all current panels",[".route-panel:not([hidden])",".discover-panel:not([hidden])",".menu-panel:not([hidden])",".favorites-panel:not([hidden])",".place-panel:not([hidden])",".menu-subpanel:not([hidden])"].every(x=>style.includes(x))],
["collapsed CSS",style.includes(".route-panel.is-collapsed")&&style.includes(".place-panel.is-collapsed")],
["back navigation preserved",app.includes('OMAP_BACK_NAVIGATION?.register(\n    "favorites"')&&app.includes('OMAP_BACK_NAVIGATION?.register(\n    "discover"')&&app.includes('OMAP_BACK_NAVIGATION?.register(\n    "search"')],
["legend standardized",app.includes("initializeLegendBottomSheet")&&style.includes("--legend-sheet-height")],
["about standardized",app.includes("initializeAboutBottomSheet")&&style.includes("--about-sheet-height")]];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`Unified mobile panel standard: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
