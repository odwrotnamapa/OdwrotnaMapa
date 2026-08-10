#!/usr/bin/env node
"use strict";
const fs=require("fs"),path=require("path");
const root=path.join(__dirname,"..");
const app=fs.readFileSync(path.join(root,"app.js"),"utf8");
const style=fs.readFileSync(path.join(root,"style.css"),"utf8");
const source=app+"\n"+style;
const c=[
  ["shared setter", source.includes("function setMobilePanelHeight")],
  ["continuous drag", source.includes("startHeight + delta")],
  ["pointer move", source.includes("\"pointermove\"")],
  ["viewport max", source.includes("getMobilePanelMaximumHeight")],
  ["collapsed min", source.includes("collapsedHeight: 48")],
  ["drag class", source.includes("panel.classList.add(\"is-dragging\")")],
  ["release", source.includes("releasePointerCapture")]
];
let f=0;for(const[n,o]of c)if(!o){f++;console.error(`FAIL: ${n}`)}
console.log(`place panel free drag: ${c.length-f}/${c.length} PASS`);
process.exit(f?1:0);
