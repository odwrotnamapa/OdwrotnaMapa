window.SOUTHMAPS_CONFIG = Object.freeze({
  map: {
    styleUrl: "https://tiles.openfreemap.org/styles/liberty",
    center: [19.1451, 51.9194],
    zoom: 4.8,
    bearing: 180,
    pitch: 0,
    minZoom: 2
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
    reverseEndpoint: "https://nominatim.openstreetmap.org/reverse",
    limit: 5
  },
  storageKeys: {
    language: "odwrotnamapa.language",
    theme: "odwrotnamapa.theme",
    view: "odwrotnamapa.view"
  }
});
