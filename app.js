(() => {
  "use strict";

  const CONFIG = window.SOUTHMAPS_CONFIG;
  const $ = id => document.getElementById(id);

  const text = {
    pl: {
      title: "Odwrotna Mapa - mapa z południem u góry",
      search: "Szukaj miejsca…", button: "Szukaj",
      styles: { light: "Jasna", dark: "Ciemna", satellite: "Satelitarna" },
      locate: "Moja lokalizacja", legend: "Legenda", closeLegend: "Zamknij legendę",
      legendSections: {
        boundaries: "Granice",
        roads: "Drogi",
        transport: "Transport",
        land: "Teren"
      },
      legendItems: {
        countryBorder: "Granica państwa",
        adminBorder: "Granica administracyjna",
        disputedBorder: "Granica sporna",
        motorway: "Autostrada",
        primaryRoad: "Droga główna",
        secondaryRoad: "Droga drugorzędna",
        minorRoad: "Droga lokalna",
        path: "Ścieżka / droga piesza",
        railway: "Linia kolejowa",
        runway: "Pas startowy",
        taxiway: "Droga kołowania",
        water: "Woda",
        park: "Park",
        forest: "Las",
        grass: "Teren trawiasty",
        wetland: "Teren podmokły",
        sand: "Piasek",
        residential: "Obszar mieszkalny",
        cemetery: "Cmentarz",
        hospital: "Szpital",
        school: "Szkoła",
        buildings: "Budynek"
      },
      legendNote: "Legenda oparta na stylu Liberty OpenFreeMap. Wygląd symboli i kolorów może różnić się w zależności od wybranego motywu mapy.",
      about: "O projekcie",
      closeAbout: "Zamknij sekcję O projekcie",
      aboutIntro: "Większość współczesnych map przedstawia północ na górze, więc łatwo zapomnieć, że nie jest to prawo natury, lecz historyczna konwencja. Odwrotna Mapa zachęca do spojrzenia na świat z innej perspektywy — i to dosłownie — oraz przypomina, że sposób przedstawiania rzeczywistości znacząco wpływa na to, jak ją postrzegamy.",
      aboutVersion: "Wersja",
      aboutData: "Dane mapowe",
      aboutStyle: "Styl mapy",
      aboutEngine: "Silnik",
      searching: "Wyszukiwanie…", noResults: "Nie znaleziono miejsca.",
      searchError: "Nie udało się wyszukać miejsca.",
      locating: "Ustalanie lokalizacji…",
      locationError: "Nie udało się odczytać lokalizacji.",
      route: "Wyznacz trasę",
      closeRoute: "Zamknij planer trasy",
      resizeRoutePanel: "Zmień wysokość panelu trasy",
      routeTitle: "Trasa",
      routeFrom: "Punkt A",
      routeTo: "Punkt B",
      routeFromPlaceholder: "Miejsce początkowe",
      routeToPlaceholder: "Cel podróży",
      routeSwap: "Zamień punkty",
      routeSubmit: "Wyznacz trasę",
      routeClear: "Wyczyść",
      routeDistance: "Dystans",
      routeDuration: "Czas",
      routeNote: "Trasa jest obliczana na podstawie danych OpenStreetMap.",
      routeMode: "Sposób podróży",
      routeModes: {
        auto: "Samochód",
        bicycle: "Rower",
        pedestrian: "Pieszo"
      },
      routeSearching: "Wyszukiwanie punktów i obliczanie trasy…",
      routePointNotFound: "Nie znaleziono jednego z podanych punktów.",
      routeError: "Nie udało się wyznaczyć trasy.",
      routePickA: "Kliknij na mapie, aby wybrać punkt początkowy.",
      routePickB: "Kliknij na mapie, aby wybrać punkt docelowy.",
      routePickMoveB: "Kliknij na mapie, aby zmienić punkt docelowy.",
      routeReverseError: "Nie udało się odczytać nazwy wybranego miejsca.",
      routeDirections: "Wskazówki",
      routeSteps: "kroków",
      routeArrival: "Przyjazd",
      routeShare: "Udostępnij trasę",
      routeShared: "Link do trasy został skopiowany.",
      routeShareError: "Nie udało się udostępnić trasy.",
      routeWaypointNote: "Kliknij linię trasy, aby dodać punkt pośredni. Punkt można przeciągać.",
      routeRoundaboutExit: exit => `Na rondzie wybierz ${exit}. zjazd.`,
      routeWaypoint: number => `Punkt ${number}`
    },
    en: {
      title: "Odwrotna Mapa - mapa z południem u góry",
      search: "Search for a place…", button: "Search",
      styles: { light: "Light", dark: "Dark", satellite: "Satellite" },
      locate: "My location", legend: "Legend", closeLegend: "Close legend",
      legendSections: {
        boundaries: "Boundaries",
        roads: "Roads",
        transport: "Transport",
        land: "Land"
      },
      legendItems: {
        countryBorder: "Country border",
        adminBorder: "Administrative border",
        disputedBorder: "Disputed border",
        motorway: "Motorway",
        primaryRoad: "Primary road",
        secondaryRoad: "Secondary road",
        minorRoad: "Local road",
        path: "Path / pedestrian way",
        railway: "Railway",
        runway: "Runway",
        taxiway: "Taxiway",
        water: "Water",
        park: "Park",
        forest: "Woodland",
        grass: "Grassland",
        wetland: "Wetland",
        sand: "Sand",
        residential: "Residential area",
        cemetery: "Cemetery",
        hospital: "Hospital",
        school: "School",
        buildings: "Building"
      },
      legendNote: "Legend based on the OpenFreeMap Liberty style. The appearance of symbols and colours may vary depending on the selected map theme.",
      about: "About",
      closeAbout: "Close the About panel",
      aboutIntro: "Most modern maps place north at the top. This is not, however, the only possible way to represent the world. Odwrotna Mapa was created as an attempt to look at a familiar map from another perspective and to encourage reflection on how conventions influence our perception of reality.",
      aboutVersion: "Version",
      aboutData: "Map data",
      aboutStyle: "Map style",
      aboutEngine: "Engine",
      searching: "Searching…", noResults: "No place found.",
      searchError: "The place search failed.",
      locating: "Finding your location…",
      locationError: "Could not read your location.",
      route: "Plan a route",
      closeRoute: "Close route planner",
      resizeRoutePanel: "Resize route panel",
      routeTitle: "Route",
      routeFrom: "Point A",
      routeTo: "Point B",
      routeFromPlaceholder: "Starting point",
      routeToPlaceholder: "Destination",
      routeSwap: "Swap points",
      routeSubmit: "Plan route",
      routeClear: "Clear",
      routeDistance: "Distance",
      routeDuration: "Time",
      routeNote: "The route is calculated using OpenStreetMap data.",
      routeMode: "Travel mode",
      routeModes: {
        auto: "Car",
        bicycle: "Bicycle",
        pedestrian: "Walking"
      },
      routeSearching: "Finding points and calculating the route…",
      routePointNotFound: "One of the entered points could not be found.",
      routeError: "The route could not be calculated.",
      routePickA: "Click the map to choose the starting point.",
      routePickB: "Click the map to choose the destination.",
      routePickMoveB: "Click the map to move the destination.",
      routeReverseError: "The selected place name could not be read.",
      routeDirections: "Directions",
      routeSteps: "steps",
      routeArrival: "Arrival",
      routeShare: "Share route",
      routeShared: "The route link was copied.",
      routeShareError: "The route could not be shared.",
      routeWaypointNote: "Click the route line to add a waypoint. You can drag the point.",
      routeRoundaboutExit: exit => `At the roundabout, take exit ${exit}.`,
      routeWaypoint: number => `Waypoint ${number}`
    }
  };

  const state = {
    language: ["pl", "en"].includes(safeGet(CONFIG.storageKeys.language, "pl"))
      ? safeGet(CONFIG.storageKeys.language, "pl")
      : "pl",
    theme: ["light", "dark", "satellite"].includes(safeGet(CONFIG.storageKeys.theme, "light"))
      ? safeGet(CONFIG.storageKeys.theme, "light")
      : "light",
    timer: null,
    originalPaint: new Map(),
    originalTextFields: new Map(),
    originalFillPatterns: new Map(),
    routeMarkers: { a: null, b: null },
    routeCoordinates: null,
    routePointA: null,
    routePointB: null,
    routeClickStage: "a",
    routeClickBusy: false,
    routeManeuvers: [],
    routeWaypoints: [],
    routeWaypointMarkers: [],
    selectedManeuverIndex: null
  };

  const el = {
    searchForm: $("search-form"),
    searchInput: $("search-input"),
    searchButton: $("search-button"),
    themeSelect: $("theme-select"),
    languageSelect: $("language-select"),    locateButton: $("locate-button"),
    legendButton: $("legend-button"),
    legendPanel: $("legend-panel"),
    legendClose: $("legend-close"),
    aboutButton: $("about-button"),
    aboutPanel: $("about-panel"),
    aboutClose: $("about-close"),
    aboutTitle: $("about-title"),
    aboutIntro: $("about-intro"),
    aboutVersionLabel: $("about-version-label"),
    aboutDataLabel: $("about-data-label"),
    aboutStyleLabel: $("about-style-label"),
    aboutEngineLabel: $("about-engine-label"),
    routeButton: $("route-button"),
    routePanel: $("route-panel"),
    routeSheetHandle: $("route-sheet-handle"),
    routeClose: $("route-close"),
    routeForm: $("route-form"),
    routeFrom: $("route-from"),
    routeTo: $("route-to"),
    routeFromLabel: $("route-from-label"),
    routeToLabel: $("route-to-label"),
    routeSwap: $("route-swap"),
    routeSubmit: $("route-submit"),
    routeClear: $("route-clear"),
    routeTitle: $("route-title"),
    routeSummary: $("route-summary"),
    routeDistance: $("route-distance"),
    routeDuration: $("route-duration"),
    routeDistanceLabel: $("route-distance-label"),
    routeDurationLabel: $("route-duration-label"),
    routeArrival: $("route-arrival"),
    routeArrivalLabel: $("route-arrival-label"),
    routeShare: $("route-share"),
    routeWaypointNote: $("route-waypoint-note"),
    routeNote: $("route-note"),
    routeModeLabel: $("route-mode-label"),
    routeClickHint: $("route-click-hint"),
    routeDirections: $("route-directions"),
    routeDirectionsTitle: $("route-directions-title"),
    routeDirectionsCount: $("route-directions-count"),
    routeDirectionsList: $("route-directions-list"),
    legendTitle: $("legend-title"),
    legendNote: $("legend-note"),
    status: $("status"),
    fatal: $("fatal-error"),
    fatalText: $("fatal-error-text")
  };

  if (!window.maplibregl) {
    fatal("Biblioteka MapLibre GL JS nie została pobrana.");
    return;
  }

  let map;
  try {
    const saved = readView();
    map = new maplibregl.Map({
      container: "map",
      style: CONFIG.map.styleUrl,
      center: saved?.center || CONFIG.map.center,
      zoom: saved?.zoom ?? CONFIG.map.zoom,
      bearing: saved?.bearing ?? CONFIG.map.bearing,
      pitch: saved?.pitch ?? CONFIG.map.pitch,
      minZoom: CONFIG.map.minZoom
    });
  } catch (error) {
    fatal(error.message);
    return;
  }

  map.addControl(new maplibregl.NavigationControl({
    showCompass: false,
    showZoom: true
  }), "bottom-right");

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

  map.on("error", event => {
    console.error("MapLibre:", event.error || event);
  });

  map.on("load", () => {
    ensureSatellite();
    ensureRouteLayers();
    cacheOriginalPaint();
    applyTheme(state.theme);
    applyLanguageAfterStartup();
    loadSharedRouteFromUrl();
  });

  map.on("moveend", saveView);
  map.on("click", handleRouteMapClick);

  el.themeSelect.value = state.theme;
  el.languageSelect.value = state.language;
  updateUI();

  el.themeSelect.addEventListener("change", e => {
    state.theme = e.target.value;
    safeSet(CONFIG.storageKeys.theme, state.theme);
    applyTheme(state.theme);
    updateUI();
  });

  el.languageSelect.addEventListener("change", e => {
    state.language = e.target.value;
    safeSet(CONFIG.storageKeys.language, state.language);
    updateUI();
    applyLanguage(state.language);
  });

  el.locateButton.addEventListener("click", locate);
  el.legendButton.addEventListener("click", toggleLegend);
  el.legendClose.addEventListener("click", closeLegend);
  el.aboutButton.addEventListener("click", toggleAbout);
  el.aboutClose.addEventListener("click", closeAbout);
  el.routeButton.addEventListener("click", toggleRoute);
  el.routeClose.addEventListener("click", closeRoute);
  el.routeSwap.addEventListener("click", swapRoutePoints);
  el.routeClear.addEventListener("click", clearRoute);
  el.routeForm.addEventListener("submit", planRoute);
  el.routeShare.addEventListener("click", shareRoute);
  for (const modeInput of document.querySelectorAll('input[name="route-mode"]')) {
    modeInput.addEventListener("change", handleRouteModeChange);
  }
  initializeRouteBottomSheet();
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLegend();
      closeAbout();
      closeRoute();
    }
  });
  el.searchForm.addEventListener("submit", search);

  function updateUI() {
    const t = text[state.language];
    document.documentElement.lang = state.language;
    document.title = t.title;
    el.searchInput.placeholder = t.search;
    el.searchInput.setAttribute("aria-label", t.search);
    el.searchButton.textContent = t.button;    el.locateButton.title = t.locate;
    el.locateButton.setAttribute("aria-label", t.locate);
    el.legendButton.title = t.legend;
    el.legendButton.setAttribute("aria-label", t.legend);
    el.legendTitle.textContent = t.legend;
    el.legendClose.setAttribute("aria-label", t.closeLegend);
    el.legendNote.textContent = t.legendNote;
    el.aboutButton.title = t.about;
    el.aboutButton.setAttribute("aria-label", t.about);
    el.aboutTitle.textContent = t.about;
    el.aboutClose.setAttribute("aria-label", t.closeAbout);
    el.aboutIntro.textContent = t.aboutIntro;
    el.aboutVersionLabel.textContent = t.aboutVersion;
    el.aboutDataLabel.textContent = t.aboutData;
    el.aboutStyleLabel.textContent = t.aboutStyle;
    el.aboutEngineLabel.textContent = t.aboutEngine;
    el.routeButton.title = t.route;
    el.routeButton.setAttribute("aria-label", t.route);
    el.routeTitle.textContent = t.routeTitle;
    el.routeClose.setAttribute("aria-label", t.closeRoute);
    el.routeSheetHandle.setAttribute("aria-label", t.resizeRoutePanel);
    el.routeFromLabel.textContent = t.routeFrom;
    el.routeToLabel.textContent = t.routeTo;
    el.routeFrom.placeholder = t.routeFromPlaceholder;
    el.routeTo.placeholder = t.routeToPlaceholder;
    el.routeSwap.title = t.routeSwap;
    el.routeSwap.setAttribute("aria-label", t.routeSwap);
    el.routeSubmit.textContent = t.routeSubmit;
    el.routeClear.textContent = t.routeClear;
    el.routeDistanceLabel.textContent = t.routeDistance;
    el.routeDurationLabel.textContent = t.routeDuration;
    el.routeArrivalLabel.textContent = t.routeArrival;
    el.routeShare.textContent = t.routeShare;
    el.routeWaypointNote.textContent = t.routeWaypointNote;
    el.routeNote.textContent = t.routeNote;
    updateRouteClickHint();
    el.routeDirectionsTitle.textContent = t.routeDirections;
    el.routeModeLabel.textContent = t.routeMode;
    for (const modeLabel of document.querySelectorAll("[data-route-mode-label]")) {
      modeLabel.textContent = t.routeModes[modeLabel.dataset.routeModeLabel];
    }
    for (const item of document.querySelectorAll("[data-legend]")) {
      item.textContent = t.legendItems[item.dataset.legend];
    }
    for (const section of document.querySelectorAll("[data-legend-section]")) {
      section.textContent = t.legendSections[section.dataset.legendSection];
    }
    for (const option of el.themeSelect.options) {
      option.textContent = t.styles[option.value];
    }
    document.body.classList.toggle("ui-dark", state.theme === "dark");
  }

  function ensureSatellite() {
    if (!map.getSource(CONFIG.satellite.sourceId)) {
      map.addSource(CONFIG.satellite.sourceId, {
        type: "raster",
        tiles: CONFIG.satellite.tiles,
        tileSize: CONFIG.satellite.tileSize,
        attribution: CONFIG.satellite.attribution
      });
    }
    if (!map.getLayer(CONFIG.satellite.layerId)) {
      const firstSymbol = map.getStyle().layers.find(l => l.type === "symbol");
      map.addLayer({
        id: CONFIG.satellite.layerId,
        type: "raster",
        source: CONFIG.satellite.sourceId,
        layout: { visibility: "none" }
      }, firstSymbol ? firstSymbol.id : undefined);
    }
  }

  function cacheOriginalPaint() {
    for (const layer of map.getStyle().layers || []) {
      if (layer.id === CONFIG.satellite.layerId) continue;

      state.originalPaint.set(layer.id, structuredClone(layer.paint || {}));

      if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
        state.originalTextFields.set(
          layer.id,
          structuredClone(layer.layout["text-field"])
        );
      }

      if (layer.type === "fill" && layer.paint?.["fill-pattern"] !== undefined) {
        state.originalFillPatterns.set(
          layer.id,
          structuredClone(layer.paint["fill-pattern"])
        );
      }
    }
  }

  function applyTheme(theme) {
    if (!map.isStyleLoaded()) {
      map.once("idle", () => applyTheme(theme));
      return;
    }

    const layers = map.getStyle().layers || [];

    for (const layer of layers) {
      if (isRouteLayer(layer.id)) {
        const isHighlight = layer.id === CONFIG.routing.highlightLayerId;
        setVisibility(
          layer,
          isHighlight
            ? state.selectedManeuverIndex !== null
            : Boolean(state.routeCoordinates)
        );
        continue;
      }

      if (layer.id === CONFIG.satellite.layerId) {
        map.setLayoutProperty(
          layer.id,
          "visibility",
          theme === "satellite" ? "visible" : "none"
        );
        continue;
      }

      if (theme === "satellite") {
        const visible =
          layer.type === "symbol" ||
          /boundary|border|admin|road|highway|railway|transportation/i.test(layer.id);

        setVisibility(layer, visible);
        restoreOriginalPaint(layer);
        restoreFillPattern(layer);
        continue;
      }

      setVisibility(layer, true);

      if (theme === "dark") {
        disableFillPattern(layer);
        applyDarkPalette(layer);
      } else {
        restoreOriginalPaint(layer);
        restoreFillPattern(layer);
      }
    }

    document.body.classList.toggle("ui-dark", theme === "dark");
    applyLanguage(state.language);
  }

  function restoreOriginalPaint(layer) {
    const original = state.originalPaint.get(layer.id);
    if (!original) return;

    for (const [property, value] of Object.entries(original)) {
      try {
        map.setPaintProperty(layer.id, property, structuredClone(value));
      } catch (_) {}
    }
  }

  function disableFillPattern(layer) {
    try {
      if (layer.paint?.["fill-pattern"] !== undefined ||
          state.originalFillPatterns.has(layer.id)) {
        map.setPaintProperty(layer.id, "fill-pattern", null);
      }
    } catch (_) {}
  }

  function restoreFillPattern(layer) {
    try {
      if (state.originalFillPatterns.has(layer.id)) {
        map.setPaintProperty(
          layer.id,
          "fill-pattern",
          structuredClone(state.originalFillPatterns.get(layer.id))
        );
      }
    } catch (_) {}
  }

  function setVisibility(layer, visible) {
    try {
      map.setLayoutProperty(layer.id, "visibility", visible ? "visible" : "none");
    } catch (_) {}
  }

  function applyDarkPalette(layer) {
    const id = layer.id.toLowerCase();

    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", "#171d23");
        return;
      }

      if (layer.type === "fill") {
        let color = "#252d33";
        if (/water/.test(id)) color = "#132735";
        else if (/park|forest|wood|grass|landcover|nature/.test(id)) color = "#26352f";
        else if (/building/.test(id)) color = "#30383e";
        else if (/industrial|commercial|retail|residential|landuse/.test(id)) color = "#293137";

        map.setPaintProperty(layer.id, "fill-color", color);
        if (hasPaint(layer, "fill-outline-color")) {
          map.setPaintProperty(layer.id, "fill-outline-color", color);
        }
        if (hasPaint(layer, "fill-opacity")) {
          map.setPaintProperty(layer.id, "fill-opacity", /building/.test(id) ? 0.72 : 0.9);
        }
        return;
      }

      if (layer.type === "fill-extrusion") {
        map.setPaintProperty(layer.id, "fill-extrusion-color", "#30383e");
        if (hasPaint(layer, "fill-extrusion-opacity")) {
          map.setPaintProperty(layer.id, "fill-extrusion-opacity", 0.72);
        }
        return;
      }

      if (layer.type === "line") {
        let color = "#46515a";
        let opacity = 0.65;

        if (/boundary|border|admin/.test(id)) {
          color = "#6f7d89";
          opacity = 0.72;
        } else if (/road|highway|motorway|street/.test(id)) {
          color = "#4b555e";
          opacity = 0.68;
        } else if (/water/.test(id)) {
          color = "#294454";
          opacity = 0.55;
        } else if (/park|forest|wood|grass|landcover/.test(id)) {
          color = "#33423b";
          opacity = 0.28;
        }

        map.setPaintProperty(layer.id, "line-color", color);
        if (hasPaint(layer, "line-opacity")) {
          map.setPaintProperty(layer.id, "line-opacity", opacity);
        }
        return;
      }

      if (layer.type === "circle") {
        map.setPaintProperty(layer.id, "circle-color", "#aeb8c0");
        if (hasPaint(layer, "circle-stroke-color")) {
          map.setPaintProperty(layer.id, "circle-stroke-color", "#171d23");
        }
        if (hasPaint(layer, "circle-opacity")) {
          map.setPaintProperty(layer.id, "circle-opacity", 0.72);
        }
        return;
      }

      if (layer.type === "symbol") {
        if (hasPaint(layer, "text-color")) {
          map.setPaintProperty(layer.id, "text-color", "#d8dfe5");
        }
        if (hasPaint(layer, "text-halo-color")) {
          map.setPaintProperty(layer.id, "text-halo-color", "#171d23");
        }
        if (hasPaint(layer, "text-halo-width")) {
          map.setPaintProperty(layer.id, "text-halo-width", 1);
        }
        if (hasPaint(layer, "icon-opacity")) {
          map.setPaintProperty(layer.id, "icon-opacity", 0.78);
        }
      }
    } catch (_) {}
  }

  function hasPaint(layer, key) {
    return Boolean(layer.paint && Object.prototype.hasOwnProperty.call(layer.paint, key));
  }

  function applyLanguageAfterStartup() {
    // OpenFreeMap/MapLibre może jeszcze dokończyć inicjalizację stylu po
    // zdarzeniu „load”. Ponawiamy ustawienie etykiet po pierwszej klatce,
    // po krótkim opóźnieniu oraz po pierwszym pełnym „idle”.
    applyLanguage(state.language);
    requestAnimationFrame(() => applyLanguage(state.language));
    window.setTimeout(() => applyLanguage(state.language), 250);
    map.once("idle", () => applyLanguage(state.language));
  }

  function applyLanguage(language) {
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => applyLanguage(language));
      return;
    }

    const preferred = language === "pl" ? "name:pl" : "name:en";

    for (const layer of map.getStyle().layers || []) {
      if (layer.type !== "symbol" || layer.layout?.["text-field"] === undefined) {
        continue;
      }

      try {
        // Tarcze dróg krajowych, wojewódzkich i autostrad muszą zachować
        // oryginalne krótkie oznaczenia (np. A2, S7, 92), a nie nazwy ulic.
        if (isRoadReferenceLayer(layer)) {
          restoreOriginalTextField(layer.id);
          continue;
        }

        map.setLayoutProperty(layer.id, "text-field", [
          "coalesce",
          ["get", preferred],
          ["get", "name:latin"],
          ["get", "name"]
        ]);
      } catch (_) {}
    }
  }

  function isRoadReferenceLayer(layer) {
    const id = layer.id.toLowerCase();
    const iconImage = layer.layout?.["icon-image"];
    const sourceLayer = String(layer["source-layer"] || "").toLowerCase();
    const originalText = state.originalTextFields.get(layer.id);
    const originalTextJson = JSON.stringify(originalText || "").toLowerCase();

    const idLooksLikeShield =
      /shield|road[_ -]?ref|route[_ -]?ref|highway[_ -]?ref|motorway[_ -]?ref|transportation[_ -]?name[_ -]?ref/.test(id);

    const sourceLooksLikeRoad =
      /transportation|road|highway|route/.test(sourceLayer);

    const textUsesReference =
      /"ref"|"network"|"route_ref"|"reflen"/.test(originalTextJson);

    // Warstwy z ikoną i krótkim polem ref są zwykle tarczami numerów dróg.
    return idLooksLikeShield || (Boolean(iconImage) && sourceLooksLikeRoad && textUsesReference);
  }

  function restoreOriginalTextField(layerId) {
    const original = state.originalTextFields.get(layerId);
    if (original !== undefined) {
      map.setLayoutProperty(layerId, "text-field", structuredClone(original));
    }
  }

  function isRouteLayer(layerId) {
    return [
      CONFIG.routing.casingLayerId,
      CONFIG.routing.lineLayerId,
      CONFIG.routing.highlightLayerId
    ].includes(layerId);
  }

  function initializeRouteBottomSheet() {
    if (!el.routeSheetHandle || !el.routePanel) return;

    const mobileQuery = window.matchMedia("(max-width: 600px)");

    let dragging = false;
    let startY = 0;
    let startHeight = 0;
    let activePointerId = null;
    let movedDuringGesture = false;

    const collapsedHeight = 48;

    const clampHeight = height => {
      const viewport = window.innerHeight;
      const maximum = Math.max(collapsedHeight, viewport - 8);
      return Math.min(maximum, Math.max(collapsedHeight, height));
    };

    const updateCollapsedState = height => {
      el.routePanel.classList.toggle(
        "is-collapsed",
        height <= collapsedHeight + 8
      );
    };

    const setHeight = (height, animate = true) => {
      if (!mobileQuery.matches) return;

      const safeHeight = clampHeight(height);

      if (!animate) {
        el.routePanel.classList.add("is-dragging");
      }

      el.routePanel.style.setProperty(
        "--route-sheet-height",
        `${safeHeight}px`
      );
      document.documentElement.style.setProperty(
        "--route-sheet-height",
        `${safeHeight}px`
      );

      updateCollapsedState(safeHeight);

      if (animate) {
        requestAnimationFrame(() => {
          el.routePanel.classList.remove("is-dragging");
        });
      }
    };

    const setDefaultHeight = () => {
      if (!mobileQuery.matches) {
        el.routePanel.style.removeProperty("--route-sheet-height");
        document.documentElement.style.removeProperty(
          "--route-sheet-height"
        );
        el.routePanel.classList.remove("is-collapsed");
        return;
      }

      const currentHeight = el.routePanel.getBoundingClientRect().height;
      if (currentHeight <= collapsedHeight + 2) {
        setHeight(window.innerHeight * 0.42);
      } else {
        setHeight(currentHeight, false);
        el.routePanel.classList.remove("is-dragging");
      }
    };

    el.routeSheetHandle.addEventListener("pointerdown", event => {
      if (!mobileQuery.matches) return;

      dragging = true;
      movedDuringGesture = false;
      activePointerId = event.pointerId;
      startY = event.clientY;
      startHeight = el.routePanel.getBoundingClientRect().height;

      el.routePanel.classList.add("is-dragging");
      el.routeSheetHandle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    el.routeSheetHandle.addEventListener("pointermove", event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      const delta = startY - event.clientY;
      if (Math.abs(delta) > 4) movedDuringGesture = true;

      setHeight(startHeight + delta, false);
      event.preventDefault();
    });

    const finishDrag = event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      dragging = false;
      activePointerId = null;

      const viewport = window.innerHeight;
      let currentHeight = el.routePanel.getBoundingClientRect().height;

      // Tylko przy skrajnych położeniach panel domyka się automatycznie.
      if (currentHeight < 90) {
        currentHeight = collapsedHeight;
      } else if (currentHeight > viewport - 90) {
        currentHeight = viewport - 8;
      }

      el.routePanel.classList.remove("is-dragging");
      setHeight(currentHeight, true);

      try {
        el.routeSheetHandle.releasePointerCapture(event.pointerId);
      } catch (_) {}
    };

    el.routeSheetHandle.addEventListener("pointerup", finishDrag);
    el.routeSheetHandle.addEventListener("pointercancel", finishDrag);

    // Krótkie dotknięcie uchwytu przełącza: ukryty ↔ średni.
    el.routeSheetHandle.addEventListener("click", () => {
      if (!mobileQuery.matches || movedDuringGesture) return;

      const currentHeight = el.routePanel.getBoundingClientRect().height;
      if (currentHeight <= collapsedHeight + 8) {
        setHeight(window.innerHeight * 0.42);
      } else {
        setHeight(collapsedHeight);
      }
    });

    mobileQuery.addEventListener("change", setDefaultHeight);

    window.addEventListener("resize", () => {
      if (!mobileQuery.matches) return;

      const currentHeight = el.routePanel.getBoundingClientRect().height;
      setHeight(currentHeight, false);
      el.routePanel.classList.remove("is-dragging");
    });

    setDefaultHeight();
  }

  function toggleRoute() {
    const shouldOpen = el.routePanel.hidden;
    closeLegend();
    closeAbout();
    el.routePanel.hidden = !shouldOpen;
    el.routeButton.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
      if (window.matchMedia("(max-width: 600px)").matches) {
        const currentHeight = el.routePanel.getBoundingClientRect().height;
        if (currentHeight < 90) {
          const height = window.innerHeight * 0.42;
          el.routePanel.style.setProperty(
            "--route-sheet-height",
            `${height}px`
          );
          document.documentElement.style.setProperty(
            "--route-sheet-height",
            `${height}px`
          );
          el.routePanel.classList.remove("is-collapsed");
        }
      }

      state.routeClickStage = state.routePointA
        ? (state.routePointB ? "move-b" : "b")
        : "a";
      document.body.classList.add("map-picking-route");
      updateRouteClickHint();
    } else {
      document.body.classList.remove("map-picking-route");
    }
  }

  function closeRoute() {
    if (el.routePanel.hidden) return;
    el.routePanel.hidden = true;
    el.routeButton.setAttribute("aria-expanded", "false");
    document.body.classList.remove("map-picking-route");
  }

  function swapRoutePoints() {
    const value = el.routeFrom.value;
    el.routeFrom.value = el.routeTo.value;
    el.routeTo.value = value;

    const point = state.routePointA;
    state.routePointA = state.routePointB;
    state.routePointB = point;

    refreshRouteMarkers();

    if (state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
    }

    state.routeClickStage = state.routePointA
      ? (state.routePointB ? "move-b" : "b")
      : "a";
    updateRouteClickHint();
  }

  async function handleRouteMapClick(event) {
    if (el.routePanel.hidden || state.routeClickBusy) return;

    if (state.routeCoordinates && isClickOnRoute(event.point)) {
      addRouteWaypoint(event.lngLat);
      return;
    }

    state.routeClickBusy = true;
    const point = {
      lon: event.lngLat.lng,
      lat: event.lngLat.lat,
      label: formatCoordinates(event.lngLat.lng, event.lngLat.lat)
    };

    try {
      point.label = await reverseGeocodeRoutePoint(point);
    } catch (error) {
      console.error(error);
      show(text[state.language].routeReverseError);
    }

    if (state.routeClickStage === "a") {
      state.routePointA = point;
      el.routeFrom.value = point.label;
      setRouteMarker("a", point);
      state.routeClickStage = "b";
      updateRouteClickHint();
      state.routeClickBusy = false;
      return;
    }

    state.routePointB = point;
    el.routeTo.value = point.label;
    setRouteMarker("b", point);
    state.routeClickStage = "move-b";
    updateRouteClickHint();

    if (state.routePointA) {
      await calculateRouteFromStoredPoints();
    }

    state.routeClickBusy = false;
  }

  async function calculateRouteFromStoredPoints() {
    if (!state.routePointA || !state.routePointB) return;

    show(text[state.language].routeSearching, 0);
    el.routeSubmit.disabled = true;

    try {
      const route = await fetchRoute(state.routePointA, state.routePointB);
      drawRoute(
        route.geometry,
        state.routePointA,
        state.routePointB,
        getSelectedRouteMode()
      );
      updateRouteSummary(route.distance, route.duration);
      renderRouteDirections(route.maneuvers);
      hide();
    } catch (error) {
      console.error(error);
      show(text[state.language].routeError);
    } finally {
      el.routeSubmit.disabled = false;
    }
  }

  async function reverseGeocodeRoutePoint(point) {
    const url = new URL(CONFIG.search.reverseEndpoint);
    url.searchParams.set("lat", String(point.lat));
    url.searchParams.set("lon", String(point.lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("accept-language", state.language);
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Nominatim reverse HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.display_name || formatCoordinates(point.lon, point.lat);
  }

  function formatCoordinates(lon, lat) {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }

  function updateRouteClickHint() {
    if (!el.routeClickHint) return;
    const t = text[state.language];

    if (state.routeClickStage === "a") {
      el.routeClickHint.textContent = t.routePickA;
      el.routeClickHint.classList.remove("is-complete");
    } else if (state.routeClickStage === "b") {
      el.routeClickHint.textContent = t.routePickB;
      el.routeClickHint.classList.remove("is-complete");
    } else {
      el.routeClickHint.textContent = t.routePickMoveB;
      el.routeClickHint.classList.add("is-complete");
    }
  }

  function createRouteMarkerElement(letter, markerClass) {
    const element = document.createElement("div");
    element.className = `route-letter-marker ${markerClass}`;

    const label = document.createElement("span");
    label.textContent = letter;
    element.appendChild(label);

    return element;
  }

  function setRouteMarker(key, point) {
    removeRouteMarker(key);

    const isA = key === "a";
    const marker = new maplibregl.Marker({
      element: createRouteMarkerElement(
        isA ? "A" : "B",
        isA ? "route-a" : "route-b"
      ),
      anchor: "bottom"
    })
      .setLngLat([point.lon, point.lat])
      .setPopup(new maplibregl.Popup().setText(point.label))
      .addTo(map);

    state.routeMarkers[key] = marker;
  }

  function removeRouteMarker(key) {
    if (state.routeMarkers[key]) {
      state.routeMarkers[key].remove();
      state.routeMarkers[key] = null;
    }
  }

  function refreshRouteMarkers() {
    if (state.routePointA) setRouteMarker("a", state.routePointA);
    else removeRouteMarker("a");

    if (state.routePointB) setRouteMarker("b", state.routePointB);
    else removeRouteMarker("b");
  }

  async function planRoute(event) {
    event.preventDefault();
    const fromQuery = el.routeFrom.value.trim();
    const toQuery = el.routeTo.value.trim();
    if (!fromQuery || !toQuery) return;

    show(text[state.language].routeSearching, 0);
    el.routeSubmit.disabled = true;

    try {
      const [from, to] = await Promise.all([
        geocodeRoutePoint(fromQuery),
        geocodeRoutePoint(toQuery)
      ]);

      if (!from || !to) {
        show(text[state.language].routePointNotFound);
        return;
      }

      state.routePointA = from;
      state.routePointB = to;
      state.routeClickStage = "move-b";

      const route = await fetchRoute(from, to);
      drawRoute(route.geometry, from, to, getSelectedRouteMode());
      updateRouteClickHint();
      updateRouteSummary(route.distance, route.duration);
      renderRouteDirections(route.maneuvers);
      hide();
    } catch (error) {
      console.error(error);
      show(text[state.language].routeError);
    } finally {
      el.routeSubmit.disabled = false;
    }
  }

  async function geocodeRoutePoint(query) {
    const url = new URL(CONFIG.search.endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("accept-language", state.language);

    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

    const results = await response.json();
    if (!results.length) return null;

    return {
      lon: Number(results[0].lon),
      lat: Number(results[0].lat),
      label: results[0].display_name
    };
  }

  async function fetchRoute(from, to) {
    const mode = getSelectedRouteMode();
    const language = state.language === "pl" ? "pl-PL" : "en-US";

    const payload = {
      locations: [
        { lat: from.lat, lon: from.lon, type: "break" },
        ...state.routeWaypoints.map(point => ({
          lat: point.lat,
          lon: point.lon,
          type: "break"
        })),
        { lat: to.lat, lon: to.lon, type: "break" }
      ],
      costing: mode,
      units: "kilometers",
      language
    };

    const response = await fetch(CONFIG.routing.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Client-Id": CONFIG.routing.clientId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Valhalla HTTP ${response.status}`);
    }

    const result = await response.json();
    const trip = result.trip;
    if (!trip?.legs?.length) {
      throw new Error(result.error || "No route");
    }

    const coordinates = [];
    const maneuvers = [];

    for (const leg of trip.legs) {
      const decoded = decodePolyline6(leg.shape);

      for (const maneuver of leg.maneuvers || []) {
        const coordinate =
          decoded[maneuver.begin_shape_index] ||
          decoded[0] ||
          null;

        const beginIndex = Number(maneuver.begin_shape_index || 0);
        const endIndex = Number(
          maneuver.end_shape_index ?? maneuver.begin_shape_index ?? 0
        );
        const roundaboutExit = Number(
          maneuver.roundabout_exit_count ||
          maneuver.roundabout_exit_number ||
          0
        );

        maneuvers.push({
          instruction:
            maneuver.instruction ||
            maneuver.verbal_pre_transition_instruction ||
            "",
          streetNames: maneuver.street_names || [],
          length: Number(maneuver.length || 0) * 1000,
          time: Number(maneuver.time || 0),
          type: Number(maneuver.type),
          roundaboutExit,
          coordinate,
          segment: decoded.slice(
            Math.max(0, beginIndex),
            Math.max(beginIndex + 2, endIndex + 1)
          )
        });
      }

      if (coordinates.length && decoded.length) decoded.shift();
      coordinates.push(...decoded);
    }

    return {
      geometry: {
        type: "LineString",
        coordinates
      },
      distance: Number(trip.summary?.length || 0) * 1000,
      duration: Number(trip.summary?.time || 0),
      maneuvers
    };
  }

  function getSelectedRouteMode() {
    return document.querySelector(
      'input[name="route-mode"]:checked'
    )?.value || "auto";
  }

  function decodePolyline6(encoded) {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const coordinates = [];

    while (index < encoded.length) {
      const latitudeResult = decodePolylineValue(encoded, index);
      index = latitudeResult.index;
      latitude += latitudeResult.value;

      const longitudeResult = decodePolylineValue(encoded, index);
      index = longitudeResult.index;
      longitude += longitudeResult.value;

      coordinates.push([
        longitude / 1e6,
        latitude / 1e6
      ]);
    }

    return coordinates;
  }

  function decodePolylineValue(encoded, startIndex) {
    let result = 0;
    let shift = 0;
    let index = startIndex;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    return {
      index,
      value: (result & 1) ? ~(result >> 1) : (result >> 1)
    };
  }

  function ensureRouteLayers() {
    if (!map.getSource(CONFIG.routing.sourceId)) {
      map.addSource(CONFIG.routing.sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        }
      });
    }

    if (!map.getSource(CONFIG.routing.highlightSourceId)) {
      map.addSource(CONFIG.routing.highlightSourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        }
      });
    }

    if (!map.getLayer(CONFIG.routing.casingLayerId)) {
      map.addLayer({
        id: CONFIG.routing.casingLayerId,
        type: "line",
        source: CONFIG.routing.sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": 9,
          "line-opacity": 0.92
        }
      });
    }

    if (!map.getLayer(CONFIG.routing.lineLayerId)) {
      map.addLayer({
        id: CONFIG.routing.lineLayerId,
        type: "line",
        source: CONFIG.routing.sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#2563eb",
          "line-width": 5.5,
          "line-opacity": 0.96
        }
      });
    }

    if (!map.getLayer(CONFIG.routing.highlightLayerId)) {
      map.addLayer({
        id: CONFIG.routing.highlightLayerId,
        type: "line",
        source: CONFIG.routing.highlightSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#facc15",
          "line-width": 8,
          "line-opacity": 0.95
        }
      });
    }
  }

  function drawRoute(geometry, from, to, mode) {
    ensureRouteLayers();
    state.routeCoordinates = geometry.coordinates;
    clearManeuverHighlight();

    map.getSource(CONFIG.routing.sourceId).setData({
      type: "Feature",
      properties: {},
      geometry
    });

    map.setLayoutProperty(CONFIG.routing.casingLayerId, "visibility", "visible");
    map.setLayoutProperty(CONFIG.routing.lineLayerId, "visibility", "visible");

    const routeColors = {
      auto: "#2563eb",
      bicycle: "#16a34a",
      pedestrian: "#ea580c"
    };
    map.setPaintProperty(
      CONFIG.routing.lineLayerId,
      "line-color",
      routeColors[mode] || routeColors.auto
    );

    state.routePointA = from;
    state.routePointB = to;
    refreshRouteMarkers();
    refreshWaypointMarkers();

    const bounds = geometry.coordinates.reduce(
      (current, coordinate) => current.extend(coordinate),
      new maplibregl.LngLatBounds(
        geometry.coordinates[0],
        geometry.coordinates[0]
      )
    );

    map.fitBounds(bounds, {
      padding: { top: 105, right: 45, bottom: 55, left: 45 },
      bearing: 180,
      duration: 900
    });
  }

  function renderRouteDirections(maneuvers) {
    clearRouteDirections();

    if (!Array.isArray(maneuvers) || !maneuvers.length) return;

    const fragment = document.createDocumentFragment();

    maneuvers.forEach((maneuver, index) => {
      const item = document.createElement("li");
      item.className = "route-direction";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "route-direction-button";

      const icon = document.createElement("span");
      icon.className = "route-direction-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = getManeuverIcon(maneuver.type, index, maneuvers.length);

      const copy = document.createElement("span");
      copy.className = "route-direction-copy";

      const instruction = document.createElement("span");
      instruction.className = "route-direction-instruction";
      instruction.textContent =
        maneuver.roundaboutExit > 0
          ? text[state.language].routeRoundaboutExit(maneuver.roundaboutExit)
          : maneuver.instruction;

      copy.appendChild(instruction);

      if (maneuver.streetNames?.length) {
        const street = document.createElement("span");
        street.className = "route-direction-street";
        street.textContent = maneuver.streetNames.join(", ");
        copy.appendChild(street);
      }

      const distance = document.createElement("span");
      distance.className = "route-direction-distance";
      distance.textContent = formatDistance(maneuver.length);

      button.append(icon, copy, distance);

      if (maneuver.coordinate) {
        button.addEventListener("click", () => {
          selectManeuver(index, button);
          map.easeTo({
            center: maneuver.coordinate,
            zoom: Math.max(map.getZoom(), 15),
            bearing: 180,
            duration: 650
          });
        });
      } else {
        button.disabled = true;
      }

      item.appendChild(button);
      fragment.appendChild(item);
    });

    state.routeManeuvers = maneuvers;
    state.selectedManeuverIndex = null;
    el.routeDirectionsList.appendChild(fragment);
    el.routeDirectionsCount.textContent =
      `${maneuvers.length} ${text[state.language].routeSteps}`;
    el.routeDirections.hidden = false;
  }

  function clearRouteDirections() {
    if (!el.routeDirectionsList) return;
    el.routeDirectionsList.replaceChildren();
    state.routeManeuvers = [];
    state.selectedManeuverIndex = null;
    el.routeDirectionsCount.textContent = "";
    el.routeDirections.hidden = true;
  }

  function getManeuverIcon(type, index, total) {
    if (index === 0) return "A";
    if (index === total - 1) return "B";

    const icons = {
      1: "↑",   // start
      2: "→",   // start right
      3: "←",   // start left
      4: "✓",   // destination
      5: "✓",   // destination right
      6: "✓",   // destination left
      7: "↑",   // continue
      8: "↗",   // slight right
      9: "→",   // right
      10: "↘",  // sharp right
      11: "↩",  // u-turn right
      12: "↪",  // u-turn left
      13: "↙",  // sharp left
      14: "←",  // left
      15: "↖",  // slight left
      16: "↑",  // ramp straight
      17: "↗",  // ramp right
      18: "↖",  // ramp left
      19: "→",  // exit right
      20: "←",  // exit left
      21: "↑",  // stay straight
      22: "↗",  // stay right
      23: "↖",  // stay left
      24: "⇄",  // merge
      25: "⟳",  // roundabout enter
      26: "⟳",  // roundabout exit
      27: "⛴",  // ferry enter
      28: "⛴",  // ferry exit
      29: "↑",  // transit
      30: "↗",
      31: "↖",
      32: "↗",
      33: "↖",
      34: "↗",
      35: "↖",
      36: "⟳",
      37: "⟳"
    };

    return icons[type] || "•";
  }

  function handleRouteModeChange() {
    if (state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
      return;
    }

    if (el.routeFrom.value.trim() && el.routeTo.value.trim()) {
      el.routeForm.requestSubmit();
    }
  }

  function selectManeuver(index, button) {
    for (const current of el.routeDirectionsList.querySelectorAll(
      ".route-direction-button"
    )) {
      current.classList.remove("is-selected");
    }

    button.classList.add("is-selected");
    state.selectedManeuverIndex = index;

    const maneuver = state.routeManeuvers[index];
    const segment = maneuver?.segment || [];

    if (segment.length < 2) {
      clearManeuverHighlight();
      return;
    }

    map.getSource(CONFIG.routing.highlightSourceId).setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: segment }
    });
    map.setLayoutProperty(
      CONFIG.routing.highlightLayerId,
      "visibility",
      "visible"
    );
  }

  function clearManeuverHighlight() {
    state.selectedManeuverIndex = null;

    if (map.getSource(CONFIG.routing.highlightSourceId)) {
      map.getSource(CONFIG.routing.highlightSourceId).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }
    if (map.getLayer(CONFIG.routing.highlightLayerId)) {
      map.setLayoutProperty(
        CONFIG.routing.highlightLayerId,
        "visibility",
        "none"
      );
    }
  }

  function isClickOnRoute(point) {
    if (!map.getLayer(CONFIG.routing.lineLayerId)) return false;

    const tolerance = 8;
    const box = [
      [point.x - tolerance, point.y - tolerance],
      [point.x + tolerance, point.y + tolerance]
    ];

    return map.queryRenderedFeatures(box, {
      layers: [
        CONFIG.routing.casingLayerId,
        CONFIG.routing.lineLayerId
      ]
    }).length > 0;
  }

  function addRouteWaypoint(lngLat) {
    const waypoint = {
      lon: lngLat.lng,
      lat: lngLat.lat,
      label: formatCoordinates(lngLat.lng, lngLat.lat)
    };

    state.routeWaypoints.push(waypoint);
    refreshWaypointMarkers();
    calculateRouteFromStoredPoints();
  }

  function refreshWaypointMarkers() {
    clearWaypointMarkers();

    state.routeWaypoints.forEach((point, index) => {
      const element = document.createElement("div");
      element.className = "route-waypoint-marker";
      element.textContent = String(index + 1);
      element.title = text[state.language].routeWaypoint(index + 1);

      const marker = new maplibregl.Marker({
        element,
        draggable: true,
        anchor: "center"
      })
        .setLngLat([point.lon, point.lat])
        .addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLngLat();
        state.routeWaypoints[index] = {
          ...state.routeWaypoints[index],
          lon: position.lng,
          lat: position.lat,
          label: formatCoordinates(position.lng, position.lat)
        };
        calculateRouteFromStoredPoints();
      });

      state.routeWaypointMarkers.push(marker);
    });
  }

  function clearWaypointMarkers() {
    for (const marker of state.routeWaypointMarkers) {
      marker.remove();
    }
    state.routeWaypointMarkers = [];
  }

  async function shareRoute() {
    if (!state.routePointA || !state.routePointB) return;

    const url = new URL(window.location.href);
    url.searchParams.set(
      "a",
      `${state.routePointA.lat},${state.routePointA.lon}`
    );
    url.searchParams.set(
      "b",
      `${state.routePointB.lat},${state.routePointB.lon}`
    );
    url.searchParams.set("mode", getSelectedRouteMode());

    if (state.routeWaypoints.length) {
      url.searchParams.set(
        "via",
        state.routeWaypoints
          .map(point => `${point.lat},${point.lon}`)
          .join(";")
      );
    } else {
      url.searchParams.delete("via");
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: url.toString()
        });
      } else {
        await navigator.clipboard.writeText(url.toString());
        show(text[state.language].routeShared);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        show(text[state.language].routeShareError);
      }
    }
  }

  async function loadSharedRouteFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const a = parseSharedPoint(params.get("a"));
    const b = parseSharedPoint(params.get("b"));
    if (!a || !b) return;

    const mode = params.get("mode");
    const modeInput = document.querySelector(
      `input[name="route-mode"][value="${mode}"]`
    );
    if (modeInput) modeInput.checked = true;

    state.routePointA = a;
    state.routePointB = b;
    state.routeClickStage = "move-b";
    el.routeFrom.value = a.label;
    el.routeTo.value = b.label;

    const via = params.get("via");
    state.routeWaypoints = via
      ? via.split(";").map(parseSharedPoint).filter(Boolean)
      : [];

    refreshRouteMarkers();
    refreshWaypointMarkers();
    await calculateRouteFromStoredPoints();
  }

  function parseSharedPoint(value) {
    if (!value) return null;
    const [latText, lonText] = value.split(",");
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      lat,
      lon,
      label: formatCoordinates(lon, lat)
    };
  }

  function updateRouteSummary(distanceMeters, durationSeconds) {
    el.routeDistance.textContent = formatDistance(distanceMeters);
    el.routeDuration.textContent = formatDuration(durationSeconds);

    const arrival = new Date(Date.now() + durationSeconds * 1000);
    el.routeArrival.textContent = arrival.toLocaleTimeString(
      state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    el.routeSummary.hidden = false;
    el.routeShare.hidden = false;
    el.routeWaypointNote.hidden = false;
  }

  function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toLocaleString(state.language, {
      maximumFractionDigits: 1
    })} km`;
  }

  function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function clearRoute() {
    state.routeCoordinates = null;
    state.routePointA = null;
    state.routePointB = null;
    state.routeClickStage = "a";
    el.routeSummary.hidden = true;
    el.routeDistance.textContent = "—";
    el.routeDuration.textContent = "—";
    el.routeArrival.textContent = "—";
    el.routeShare.hidden = true;
    el.routeWaypointNote.hidden = true;
    state.routeWaypoints = [];
    clearWaypointMarkers();
    clearManeuverHighlight();
    clearRouteDirections();

    if (map.getSource(CONFIG.routing.sourceId)) {
      map.getSource(CONFIG.routing.sourceId).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }

    if (map.getLayer(CONFIG.routing.casingLayerId)) {
      map.setLayoutProperty(CONFIG.routing.casingLayerId, "visibility", "none");
    }
    if (map.getLayer(CONFIG.routing.lineLayerId)) {
      map.setLayoutProperty(CONFIG.routing.lineLayerId, "visibility", "none");
    }

    removeRouteMarker("a");
    removeRouteMarker("b");
    updateRouteClickHint();
  }

  function toggleAbout() {
    const shouldOpen = el.aboutPanel.hidden;
    closeLegend();
    closeRoute();
    el.aboutPanel.hidden = !shouldOpen;
    el.aboutButton.setAttribute("aria-expanded", String(shouldOpen));
  }

  function closeAbout() {
    if (el.aboutPanel.hidden) return;
    el.aboutPanel.hidden = true;
    el.aboutButton.setAttribute("aria-expanded", "false");
  }

  function toggleLegend() {
    const shouldOpen = el.legendPanel.hidden;
    closeAbout();
    closeRoute();
    el.legendPanel.hidden = !shouldOpen;
    el.legendButton.setAttribute("aria-expanded", String(shouldOpen));
  }

  function closeLegend() {
    if (el.legendPanel.hidden) return;
    el.legendPanel.hidden = true;
    el.legendButton.setAttribute("aria-expanded", "false");
  }

  async function search(event) {
    event.preventDefault();
    const q = el.searchInput.value.trim();
    if (!q) return;
    show(text[state.language].searching, 0);

    try {
      const url = new URL(CONFIG.search.endpoint);
      url.searchParams.set("q", q);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", String(CONFIG.search.limit));
      url.searchParams.set("accept-language", state.language);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const results = await response.json();
      if (!results.length) return show(text[state.language].noResults);

      const result = results[0];
      const point = [Number(result.lon), Number(result.lat)];
      map.flyTo({ center: point, zoom: 12, bearing: 180 });
      new maplibregl.Popup().setLngLat(point).setText(result.display_name).addTo(map);
      hide();
    } catch (error) {
      console.error(error);
      show(text[state.language].searchError);
    }
  }

  function locate() {
    show(text[state.language].locating, 0);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const point = [pos.coords.longitude, pos.coords.latitude];
        map.flyTo({ center: point, zoom: 14, bearing: 180 });
        new maplibregl.Marker().setLngLat(point).addTo(map);
        hide();
      },
      () => show(text[state.language].locationError),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function show(message, duration = 3500) {
    clearTimeout(state.timer);
    el.status.textContent = message;
    el.status.hidden = false;
    if (duration) state.timer = setTimeout(hide, duration);
  }

  function hide() {
    clearTimeout(state.timer);
    el.status.hidden = true;
  }

  function fatal(message) {
    el.fatalText.textContent = message;
    el.fatal.hidden = false;
  }

  function saveView() {
    const c = map.getCenter();
    safeSet(CONFIG.storageKeys.view, JSON.stringify({
      center: [c.lng, c.lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch()
    }));
  }

  function readView() {
    try { return JSON.parse(localStorage.getItem(CONFIG.storageKeys.view)); }
    catch (_) { return null; }
  }

  function safeGet(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch (_) { return fallback; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); }
    catch (_) {}
  }
})();
