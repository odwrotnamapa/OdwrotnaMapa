window.SOUTHMAPS_CONFIG = Object.freeze({
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
  transit: {
    departuresEndpoint: "https://api.transitous.org/api/v6/stoptimes",
    plannerEndpoint: "https://api.transitous.org/api/v6/plan",
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
    clientId: "odwrotnamapa.github.io"
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
    favorites: "odwrotnamapa.favorites"
  }
});
