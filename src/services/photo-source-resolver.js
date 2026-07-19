(function () {
  "use strict";
  function normalizeUrl(value) { const url=String(value||"").trim(); if(!url) return ""; return url.startsWith("//") ? `https:${url}` : url; }
  function unique(values) { const seen=new Set(); return values.map(normalizeUrl).filter(v=>v&&!seen.has(v)&&seen.add(v)); }
  function directSources(place={}) { return unique([place.image,place.imageUrl,place.photo,place.photoUrl,place.extratags?.image,place.extratags?.["image:0"],place.extratags?.["image:1"],place.extratags?.wikimedia_commons,place.wikimedia_commons]); }
  function identifiers(place={}) { return {wikidata:place.wikidata||place.extratags?.wikidata||"", wikipedia:place.wikipedia||place.extratags?.wikipedia||"", commons:place.wikimedia_commons||place.extratags?.wikimedia_commons||""}; }
  window.OMAP_PHOTO_SOURCE_RESOLVER={resolve(place={}){return {direct:directSources(place),identifiers:identifiers(place)};},directSources,identifiers,normalizeUrl};
})();
