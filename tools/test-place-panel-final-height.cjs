#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const source=app+"\n"+style;
const c=[
  ["shared default", source.includes("defaultHeightRatio: 0.42")],
  ["CSS default", source.includes("--mobile-panel-default-height: 42dvh")],
  ["viewport max", source.includes("getMobilePanelMaximumHeight")],
  ["collapsed minimum", source.includes("collapsedHeight: 48")],
  ["shared opener", source.includes("openMobilePanelStandard")],
  ["same calculation", source.includes("getMobilePanelDefaultHeight()")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`place panel final height: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
