(function () {
"use strict";
let adapters=Object.freeze({});const listeners=new Map();
function configure(next={}){adapters=Object.freeze({...adapters,...next})}
function on(type,handler){if(!type||typeof handler!=="function")return()=>{};const set=listeners.get(type)||new Set();set.add(handler);listeners.set(type,set);return()=>set.delete(handler)}
function emit(type,payload){for(const fn of listeners.get(type)||[]){try{fn(payload)}catch(e){console.error("PlaceService listener failed:",e)}}}
async function resolve(input,options={}){return window.OMAP_PLACE_RESOLVER?.resolve(input,options)||null}
async function open(input,{source=null,resolverContext={},metadata={}}={}) {
 const place=await resolve(input,{source,context:resolverContext});
 if(!place||!window.OMAP_PLACE_MODEL?.isValid(place)){emit("invalid",{input,source,metadata});return null}
 const event={place,source:source||place.source||"unknown",metadata};emit("before-open",event);
 if(typeof adapters.beforeOpen==="function")await adapters.beforeOpen(event);
 if(typeof adapters.open==="function")await adapters.open(event);
 emit("open",event);return place;
}
async function preview(input,options={}){const place=await resolve(input,options);if(place)emit("preview",{place,options});return place}
window.OMAP_PLACE_SERVICE=Object.freeze({configure,resolve,open,preview,on});
})();