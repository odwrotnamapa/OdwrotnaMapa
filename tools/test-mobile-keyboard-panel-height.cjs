#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const source=app+"\n"+style;
const c=[
  ["search helper", source.includes("prepareMobilePlacePanelAfterSearch")],
  ["blur", source.includes("active.blur()")],
  ["autocomplete", source.includes("hideAllAutocomplete()")],
  ["stabilizer", source.includes("stabilizeMobilePanelStandard")],
  ["delays", source.includes("[0, 80, 180, 320, 520, 700]")],
  ["visual viewport", source.includes("window.visualViewport?.height")],
  ["resize listener", source.includes("window.visualViewport?.addEventListener(\"resize\"")],
  ["drag protected", source.includes("panel.classList.contains(\"is-dragging\")")],
  ["collapse protected", source.includes("panel.classList.contains(\"is-collapsed\")")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`mobile keyboard panel height: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
