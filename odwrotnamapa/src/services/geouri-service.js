(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - obsługa linków geo: (RFC
  // 5870) - otwieranie appki z zewnętrznego odnośnika ze
  // współrzędnymi (Capacitor appUrlOpen na mobile, plus ręczne
  // wystawienie window.omapHandleGeoUri dla mostu natywnego).

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function openGeoUri(rawUrl) {
    const match = /^geo:([^;?]+)/i.exec(String(rawUrl || ""));
    if (!match) return;

    const point = ctx.parseSharedPoint(decodeURIComponent(match[1]));
    if (!point) return;

    ctx.showPlaceInformation({
      lngLat: new maplibregl.LngLat(point.lon, point.lat)
    });

    ctx.map.flyTo({
      center: [point.lon, point.lat],
      zoom: 17,
      bearing: 180
    });
  }

  function initializeGeoUriHandling() {
    window.omapHandleGeoUri = openGeoUri;

    const capacitorApp = window.CapacitorApp;
    if (!capacitorApp) return;

    capacitorApp.addListener("appUrlOpen", event => {
      openGeoUri(event?.url);
    });

    capacitorApp.getLaunchUrl?.()
      .then(result => openGeoUri(result?.url))
      .catch(() => {});
  }


  window.OMAP_GEOURI = {
    configure,
    initialize: initializeGeoUriHandling
  };
})();
