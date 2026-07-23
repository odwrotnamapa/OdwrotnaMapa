window.SOUTHMAPS_CONFIG = Object.freeze({
  publicBaseUrl: "https://odwrotnamapa.pl/",
  map: {
    styleUrl: "https://tiles.openfreemap.org/styles/liberty",
    center: [19.1451, 51.9194],
    zoom: 4.8,
    bearing: 180,
    pitch: 0,
    minZoom: 0
  },
  satellite: {
    sourceId: "southmaps-satellite",
    layerId: "southmaps-satellite-layer",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    ],
    tileSize: 256,
    attribution: "Tiles © Esri"
  },
  mapillary: {
    // Zarejestruj darmowe konto dewelopera na
    // https://www.mapillary.com/developer i wklej tu swój token.
    accessToken: "MLY|27879892151642669|4c37c1e745d47de033a7790defae6f2f",
    coverageTiles:
      "https://tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}",
    sourceId: "odwrotnamapa-mapillary",
    coverageLayerId: "odwrotnamapa-mapillary-coverage",
    minZoom: 14
  },
  transit: {
    departuresEndpoint: "https://api.transitous.org/api/v6/stoptimes",
    plannerEndpoint: "https://api.transitous.org/api/v6/plan",
    tripEndpoint: "https://api.transitous.org/api/v6/trip",
    sourcesUrl: "https://transitous.org/sources/",
    radius: 180,
    limit: 24
  },

  routing: {
    endpoint: "https://valhalla1.openstreetmap.de/route",
    sourceId: "odwrotnamapa-route",
    casingLayerId: "odwrotnamapa-route-casing",
    lineLayerId: "odwrotnamapa-route-line",
    highlightSourceId: "odwrotnamapa-route-highlight",
    highlightLayerId: "odwrotnamapa-route-highlight-line",
    clientId: "odwrotnamapa.pl"
  },

  search: {
    endpoint: "https://nominatim.openstreetmap.org/search",
    fuzzyEndpoint: "https://photon.komoot.io/api/",
    reverseEndpoint: "https://nominatim.openstreetmap.org/reverse",
    exploreLimit: 25,
    limit: 5
  },
  storageKeys: {
    language: "odwrotnamapa.language",
    theme: "odwrotnamapa.theme",
    view: "odwrotnamapa.view",
    searchHistory: "odwrotnamapa.searchHistory",
    favorites: "odwrotnamapa.favorites",
    customPalette: "odwrotnamapa.customPalette",
    history: "odwrotnamapa.history"
  }
});
