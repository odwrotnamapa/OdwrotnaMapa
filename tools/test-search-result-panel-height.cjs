#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const source=app+"\n"+style;
const c=[
  ["shared stabilizer", source.includes("stabilizeMobilePanelStandard")],
  ["search preparation", source.includes("prepareMobilePlacePanelAfterSearch")],
  ["autocomplete hidden", source.includes("hideAllAutocomplete()")],
  ["keyboard blur", source.includes("active.blur()")],
  ["same default ratio", source.includes("defaultHeightRatio: 0.42")],
  ["expanded state", source.includes("panel.classList.remove(\"is-collapsed\")")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`search result panel height: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
