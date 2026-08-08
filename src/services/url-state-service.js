(function () {
  "use strict";

  // Jeden, spójny format URL-a dla wybranego miejsca na mapie.
  // Wcześniej trzy różne miejsca w app.js zapisywały stan na trzy
  // różne sposoby (?q+?place+?lat+?lng w jednym, ?q+?p= w drugim,
  // samo ?q w trzecim), co psuło odtwarzanie stanu przy cofaniu się
  // w historii przeglądarki. Ten moduł to jedyne miejsce, które
  // czyta i zapisuje URL stanu miejsca.
  //
  // Format: ?q=<nazwa>&p=<lat>,<lon>&osm=<typ+id opcjonalnie>

  function setPlaceUrl({ label, lat, lon, osmType, osmId, replace = false }) {
    if (!label || !Number.isFinite(lat) || !Number.isFinite(lon)) return;

    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("q", label);
    url.searchParams.set("p", `${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`);
    if (osmType && osmId) {
      url.searchParams.set("osm", `${String(osmType)[0]}${osmId}`);
    }

    if (replace) {
      window.history.replaceState({ label, lat, lon }, "", url);
    } else {
      window.history.pushState({ label, lat, lon }, "", url);
    }

    // Tytul strony jest teraz ustawiany centralnie przez
    // buildPageTitle() w app.js (createPlaceCardLegacy), ktora ma
    // dostep do pelnych danych adresowych (ulica, miasto) - nie tylko
    // do samej etykiety - zeby zbudowac bogatszy format pod SEO.
    // Wczesniej ten modul nadpisywal ten bogatszy tytul prostszym
    // zaraz po tym, jak zostal poprawnie ustawiony.
  }

  function buildPlaceUrl({ label, lat, lon, osmType, osmId, baseUrl }) {
    const url = new URL(baseUrl || window.location.href);
    url.search = "";
    if (label) url.searchParams.set("q", label);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      url.searchParams.set("p", `${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`);
    }
    if (osmType && osmId) {
      url.searchParams.set("osm", `${String(osmType)[0]}${osmId}`);
    }
    return url;
  }

  function clearPlaceUrl() {
    const url = new URL(window.location.href);
    if (!url.search) return;
    url.search = "";
    window.history.pushState({}, "", url);
    // Tytul resetuje juz osobny kod w app.js przy zamknieciu panelu
    // miejsca (ten sam moment co czyszczenie URL) - nie duplikujemy.
  }

  function readPlaceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    const p = params.get("p");

    // Zgodność wsteczna: stare zakładki/udostępnione linki mogły
    // używać ?place=lat,lng albo osobnych ?lat=&?lng=.
    const legacyPlace = params.get("place");
    const legacyLat = parseFloat(params.get("lat"));
    const legacyLng = parseFloat(params.get("lng"));

    let lat = null;
    let lon = null;

    if (p) {
      const [pLat, pLon] = p.split(",").map(Number);
      if (Number.isFinite(pLat) && Number.isFinite(pLon)) {
        lat = pLat;
        lon = pLon;
      }
    } else if (legacyPlace) {
      const [lLat, lLon] = legacyPlace.split(",").map(Number);
      if (Number.isFinite(lLat) && Number.isFinite(lLon)) {
        lat = lLat;
        lon = lLon;
      }
    } else if (Number.isFinite(legacyLat) && Number.isFinite(legacyLng)) {
      lat = legacyLat;
      lon = legacyLng;
    }

    if (!q && lat === null) return null;

    return { label: q || "", lat, lon };
  }

  window.OMAP_URL_STATE = {
    setPlaceUrl,
    buildPlaceUrl,
    clearPlaceUrl,
    readPlaceFromUrl
  };
})();
