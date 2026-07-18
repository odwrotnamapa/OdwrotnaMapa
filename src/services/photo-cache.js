(function () {
  "use strict";
  const cache = new Map();
  const failures = new Map();
  function keyOf(place = {}) {
    return String(place.id || place.place_id || place.namedPoiId ||
      (place.osm_type && place.osm_id ? `${place.osm_type}:${place.osm_id}` : "") ||
      (Number.isFinite(Number(place.lat)) && Number.isFinite(Number(place.lon))
        ? `coords:${Number(place.lat).toFixed(6)}:${Number(place.lon).toFixed(6)}` : "") ||
      place.name || place.display_name || "");
  }
  function get(place) { return cache.get(keyOf(place)) || null; }
  function set(place, photos) { const key=keyOf(place); if(key) cache.set(key, Array.isArray(photos)?photos:[]); return photos; }
  function invalidate(place) { const key=keyOf(place); cache.delete(key); failures.delete(key); }
  function clear() { cache.clear(); failures.clear(); }
  function markFailure(place,url) { const key=keyOf(place); if(!key||!url) return; const set=failures.get(key)||new Set(); set.add(String(url)); failures.set(key,set); }
  function isFailed(place,url) { return failures.get(keyOf(place))?.has(String(url)) || false; }
  window.OMAP_PHOTO_CACHE={keyOf,get,set,invalidate,clear,markFailure,isFailed};
})();
