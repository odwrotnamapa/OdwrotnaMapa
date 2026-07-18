(function () {
"use strict";
const VERSION=1;
const num=v=>{const n=Number(v);return Number.isFinite(n)?n:null};
const str=v=>String(v??"").trim();
const first=(...v)=>v.map(str).find(Boolean)||"";
const arr=v=>Array.isArray(v)?v.filter(Boolean):(v?[v]:[]);
const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?{...v}:{};
function coordinates(x={}) {
 return {
  lat:num(x.lat??x.latitude??x.center?.lat??x.geometry?.coordinates?.[1]),
  lon:num(x.lon??x.lng??x.longitude??x.center?.lon??x.center?.lng??x.geometry?.coordinates?.[0])
 };
}
function normalizePhotos(x={}) {
 const seen=new Set(),out=[];
 for(const value of [...arr(x.photos),...arr(x.images),...arr(x.photo),...arr(x.image)]) {
  const p=typeof value==="string"?{url:value}:{...obj(value),url:first(value?.url,value?.src,value?.image)};
  if(p.url&&!seen.has(p.url)){seen.add(p.url);out.push(p)}
 }
 return out;
}
function normalize(input={},options={}) {
 if(input?.__omapPlace&&!options.clone)return input;
 const {lat,lon}=coordinates(input);
 const id=first(input.id,input.place_id,input.namedPoiId,input.named_poi_id,
  input.osm_type&&input.osm_id?`${input.osm_type}:${input.osm_id}`:"",
  lat!==null&&lon!==null?`coords:${lat.toFixed(6)}:${lon.toFixed(6)}`:"");
 const name=first(input.namedetails?.["name:pl"],input.namedetails?.name,input.name,input.title,input.label,str(input.display_name).split(",")[0],"Miejsce");
 const type=first(input.type,input.placeType,input.category,input.extratags?.amenity,input.extratags?.shop,input.extratags?.tourism,input.extratags?.leisure);
 const provider=first(input.provider,input.source);
 return Object.freeze({...input,__omapPlace:true,schemaVersion:VERSION,id,place_id:first(input.place_id,id),
  source:first(input.source,provider),provider,providers:arr(input.providers?.length?input.providers:provider),
  name,display_name:first(input.display_name,input.addressLabel,input.subtitle,name),
  lat,lon,lng:lon,center:lat!==null&&lon!==null?{lat,lon,lng:lon}:null,
  class:first(input.class,input.placeClass),type,category:first(input.category,input.placeCategory,type,input.class),
  address:obj(typeof input.address==="object"?input.address:(input.addressDetails||input.addressObject)),
  openingHours:first(input.openingHours,input.opening_hours,input.extratags?.opening_hours),
  photos:normalizePhotos(input),
  website:first(input.website,input.extratags?.website,input.extratags?.["contact:website"]),
  phone:first(input.phone,input.extratags?.phone,input.extratags?.["contact:phone"]),
  email:first(input.email,input.extratags?.email,input.extratags?.["contact:email"]),
  wikipedia:first(input.wikipedia,input.extratags?.wikipedia),wikidata:first(input.wikidata,input.extratags?.wikidata),
  wikimediaCommons:first(input.wikimediaCommons,input.wikimedia_commons,input.extratags?.wikimedia_commons),
  osm_type:first(input.osm_type),osm_id:input.osm_id==null?"":String(input.osm_id),
  namedPoiId:first(input.namedPoiId,input.named_poi_id),aliases:arr(input.aliases),keywords:arr(input.keywords),
  extratags:obj(input.extratags),namedetails:obj(input.namedetails),
  raw:options.keepRaw===false?undefined:input,
  exactLocalIdentity:Boolean(input.exactLocalIdentity||input._exactLocalIdentity||input.provider==="named-poi"||input.namedPoiId||input.named_poi_id)});
}
const api={VERSION,normalize,from:normalize,coordinates,isPlace:v=>Boolean(v?.__omapPlace),
 isValid:v=>{const p=v?.__omapPlace?v:normalize(v);return Boolean(p.id&&Number.isFinite(p.lat)&&Number.isFinite(p.lon))},
 key:v=>(v?.__omapPlace?v:normalize(v)).id,
 toJSON:v=>{const {raw,...rest}=v?.__omapPlace?v:normalize(v);return rest}};
window.OMAP_PLACE_MODEL=Object.freeze(api);
})();