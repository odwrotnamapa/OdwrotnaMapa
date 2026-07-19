#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const source=app+"\n"+style;
const c=[
  ["shared opener", source.includes("openMobilePanelStandard")],
  ["default ratio", source.includes("defaultHeightRatio: 0.42")],
  ["panel variable", source.includes("panel.style.setProperty(")],
  ["root variable", source.includes("document.documentElement.style.setProperty(")],
  ["expanded state", source.includes("panel.classList.remove(\"is-collapsed\")")],
  ["scroll reset", source.includes("panel.scrollTop = 0")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`place panel uniform height: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
