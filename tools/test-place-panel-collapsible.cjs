#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const source=app+"\n"+style;
const c=[
  ["shared collapse", source.includes("collapseMobilePanelStandard")],
  ["48 px", source.includes("collapsedHeight: 48")],
  ["collapsed CSS", source.includes(".place-panel.is-collapsed")],
  ["overflow hidden", source.includes("overflow: hidden !important")],
  ["click toggles", source.includes("collapseMobilePanelStandard(panel, cssVariable)")],
  ["expanded state", source.includes("panel.classList.remove(\"is-collapsed\")")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`place panel collapsible: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
