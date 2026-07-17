(function(){"use strict";
const L=window.OMAP_SEARCH_V2_LEXICON;const normalize=L.normalize;const esc=v=>v.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
function remove(text,phrase){const p=normalize(phrase);return normalize(text).replace(new RegExp(`(^|\\s)${esc(p)}($|\\s)`,"g")," ").replace(/\s+/g," ").trim()}
function coords(q){const m=String(q).trim().match(/^(-?\d{1,2}(?:\.\d+)?)\s*[,; ]\s*(-?\d{1,3}(?:\.\d+)?)$/);if(!m)return null;const lat=+m[1],lon=+m[2];return Number.isFinite(lat)&&Number.isFinite(lon)&&Math.abs(lat)<=90&&Math.abs(lon)<=180?{lat,lon}:null}
async function parse(query){await L.ready;const raw=String(query||"").trim(),normalized=normalize(raw),coordinates=coords(raw);if(coordinates)return{raw,normalized,kind:"coordinates",coordinates,category:null,brand:null,modifiers:[],placeConcept:null,locationText:"",addressLike:false};
const cm=L.matchCategory(normalized),bm=L.matchBrand(normalized),mm=L.matchModifiers(normalized),pm=L.matchPlaceConcept(normalized);let locationText=normalized;for(const m of [cm,bm,pm,...mm].filter(Boolean))locationText=remove(locationText,m.alias);
let category=cm;if(!category&&bm?.entry?.category){const entry=L.data.categories[bm.entry.category];if(entry)category={id:bm.entry.category,alias:"",entry,inferredFromBrand:true}}
const locationResolution=
window.OMAP_SEARCH_V2_LOCATION?.resolve(locationText)||null;
return{raw,normalized,kind:/\b\d+[a-z]?\b/i.test(raw)?"address":"place",coordinates:null,category:category?{id:category.id,label:category.entry.label,variants:category.entry.variants,osm:category.entry.osm,matchedAlias:category.alias,inferredFromBrand:!!category.inferredFromBrand}:null,brand:bm?{id:bm.id,matchedAlias:bm.alias,category:bm.entry.category||null}:null,modifiers:mm.map(m=>({id:m.id,matchedAlias:m.alias})),placeConcept:pm?{id:pm.id,matchedAlias:pm.alias}:null,locationText,locationResolution,locationMode:mm.some(m=>m.id==="near_me")?"user":"text",addressLike:/\b\d+[a-z]?\b/i.test(raw)}}
function add(a,v){v=String(v||"").trim();if(v&&!a.some(x=>normalize(x)===normalize(v)))a.push(v)}
async function expand(parsed){
  await L.ready;

  if(!parsed?.raw)return[];
  if(parsed.kind==="coordinates")return[parsed.raw];

  const variants=[];
  add(variants,parsed.raw);

  const location=String(parsed.locationText||"").trim();
  const brand=parsed.brand?.matchedAlias;
  const categoryVariants=parsed.category?.variants||[];

  const subjects=[];
  if(brand)add(subjects,brand);
  for(const category of categoryVariants.slice(0,4)){
    add(subjects,category);
  }

  if(brand&&location){
    add(variants,`${brand} ${location}`);
    add(variants,`${location} ${brand}`);
    add(variants,`${brand}, ${location}`);
  }

  if(parsed.category){
    for(const category of categoryVariants){
      if(location){
        add(variants,`${category} ${location}`);
        add(variants,`${location} ${category}`);
        add(variants,`${category}, ${location}`);
      }else{
        add(variants,category);
      }
    }
  }

  const locationVariants =
    window.OMAP_SEARCH_V2_LOCATION?.expand(
      parsed.locationResolution,
      subjects
    ) || [];

  for(const value of locationVariants){
    add(variants,value);
  }

  // Generic fallback for locations not yet present in the Poland database.
  const locationTokens=location.split(/\s+/).filter(Boolean);
  if(locationTokens.length>=2){
    const first=locationTokens[0];
    const rest=locationTokens.slice(1).join(" ");
    const reversed=[...locationTokens].reverse().join(" ");

    for(const category of categoryVariants.slice(0,2)){
      add(variants,`${category} ${rest} ${first}`);
      add(variants,`${category}, ${rest}, ${first}`);
      add(variants,`${category} ${reversed}`);
    }

    if(brand){
      add(variants,`${brand} ${rest} ${first}`);
      add(variants,`${brand}, ${rest}, ${first}`);
    }
  }

  return variants.slice(0,18);
}

window.OMAP_SEARCH_V2_PARSER=Object.freeze({normalize,parse,expand});
})();