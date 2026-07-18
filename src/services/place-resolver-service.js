(function () {
"use strict";
const resolvers=new Map();
const model=()=>window.OMAP_PLACE_MODEL;
function register(source,fn){if(source&&typeof fn==="function")resolvers.set(String(source),fn)}
function detectSource(x={}) {
 if(x.__omapPlace)return "place";
 if(x.namedPoiId||x.named_poi_id||x.provider==="named-poi")return "named-poi";
 if(x.tags&&["node","way","relation"].includes(x.type))return "overpass";
 if(x.key&&x.title&&x.lat!=null&&x.lon!=null)return "favorite";
 if(x.lngLat)return "coordinates";
 if(x.osm_type||x.osm_id||x.place_id)return "nominatim";
 return String(x.source||x.provider||"generic");
}
async function resolve(input,{source=null,context={}}={}) {
 if(!input)return null;if(model().isPlace(input))return input;
 const kind=source||detectSource(input),fn=resolvers.get(kind)||resolvers.get("generic");
 const raw=typeof fn==="function"?await fn(input,context):input;
 return raw?model().normalize(raw,{keepRaw:context.keepRaw!==false}):null;
}
async function resolveMany(values,opts={}){return (await Promise.all((Array.isArray(values)?values:[]).map(v=>resolve(v,opts)))).filter(Boolean)}
register("place",v=>v);register("generic",v=>v);
register("named-poi",v=>({...v,provider:v.provider||"named-poi",source:v.source||"named-poi",exactLocalIdentity:true}));
register("nominatim",v=>({...v,source:v.source||"nominatim"}));
register("overpass",v=>({...v,lat:v.lat??v.center?.lat,lon:v.lon??v.center?.lon,name:v.tags?.name||v.name,
 category:v.tags?.amenity||v.tags?.shop||v.tags?.tourism||v.tags?.leisure||v.category,
 address:{road:v.tags?.["addr:street"]||"",house_number:v.tags?.["addr:housenumber"]||"",city:v.tags?.["addr:city"]||""},
 extratags:{...(v.tags||{}),...(v.extratags||{})},source:v.source||"overpass"}));
register("favorite",v=>({...v,name:v.name||v.title,display_name:v.display_name||v.address||v.title,
 address:v.addressDetails||v.addressObject||(typeof v.address==="object"?v.address:{}),source:v.source||"favorite"}));
register("coordinates",async(v,c)=>{const p=v.lngLat;if(!p)return null;
 if(c.selectedPlace&&model().isValid(c.selectedPlace))return c.selectedPlace;
 if(typeof c.resolveCoordinates==="function"){const found=await c.resolveCoordinates(p);if(found)return found}
 return {name:"Wybrane miejsce",lat:p.lat,lon:p.lng,category:"place",source:"coordinates"}});
window.OMAP_PLACE_RESOLVER=Object.freeze({register,detectSource,resolve,resolveMany,has:s=>resolvers.has(s),sources:()=>[...resolvers.keys()]});
})();