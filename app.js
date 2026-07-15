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
      routeError: "Nie udało się wyznaczyć trasy."
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
      aboutIntro: "Most modern maps place north at the top, so it is easy to forget that this is not a law of nature, but a historical convention. Odwrotna Mapa encourages us to look at the world from a different perspective — quite literally — and reminds us that the way reality is represented significantly affects how we perceive it.",
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
      routeError: "The route could not be calculated."
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
    routeMarkers: [],
    routeCoordinates: null
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
    routeNote: $("route-note"),
    routeModeLabel: $("route-mode-label"),
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
  });

  map.on("moveend", saveView);

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
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLegend();
      closeAbout();
      closeRoute();
    }
  });
  el.searchForm.addEventListener("submit", search);

  function setAboutParagraph(element, content) {
    const parts = content.split("Odwrotna Mapa");
    element.replaceChildren();

    parts.forEach((part, index) => {
      if (index > 0) {
        const strong = document.createElement("strong");
        strong.textContent = "Odwrotna Mapa";
        element.appendChild(strong);
      }
      element.appendChild(document.createTextNode(part));
    });
  }

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
    setAboutParagraph(el.aboutIntro, t.aboutIntro);
    el.aboutVersionLabel.textContent = t.aboutVersion;
    el.aboutDataLabel.textContent = t.aboutData;
    el.aboutStyleLabel.textContent = t.aboutStyle;
    el.aboutEngineLabel.textContent = t.aboutEngine;
    el.routeButton.title = t.route;
    el.routeButton.setAttribute("aria-label", t.route);
    el.routeTitle.textContent = t.routeTitle;
    el.routeClose.setAttribute("aria-label", t.closeRoute);
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
    el.routeNote.textContent = t.routeNote;
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
        setVisibility(layer, Boolean(state.routeCoordinates));
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
      CONFIG.routing.lineLayerId
    ].includes(layerId);
  }

  function toggleRoute() {
    const shouldOpen = el.routePanel.hidden;
    closeLegend();
    closeAbout();
    el.routePanel.hidden = !shouldOpen;
    el.routeButton.setAttribute("aria-expanded", String(shouldOpen));
  }

  function closeRoute() {
    if (el.routePanel.hidden) return;
    el.routePanel.hidden = true;
    el.routeButton.setAttribute("aria-expanded", "false");
  }

  function swapRoutePoints() {
    const value = el.routeFrom.value;
    el.routeFrom.value = el.routeTo.value;
    el.routeTo.value = value;
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

      const route = await fetchRoute(from, to);
      drawRoute(route.geometry, from, to, getSelectedRouteMode());
      updateRouteSummary(route.distance, route.duration);
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
    for (const leg of trip.legs) {
      const decoded = decodePolyline6(leg.shape);
      if (coordinates.length && decoded.length) decoded.shift();
      coordinates.push(...decoded);
    }

    return {
      geometry: {
        type: "LineString",
        coordinates
      },
      distance: Number(trip.summary?.length || 0) * 1000,
      duration: Number(trip.summary?.time || 0)
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
  }

  function drawRoute(geometry, from, to, mode) {
    ensureRouteLayers();
    state.routeCoordinates = geometry.coordinates;

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

    for (const marker of state.routeMarkers) marker.remove();
    state.routeMarkers = [
      new maplibregl.Marker({ color: "#16a34a" })
        .setLngLat([from.lon, from.lat])
        .setPopup(new maplibregl.Popup().setText(from.label))
        .addTo(map),
      new maplibregl.Marker({ color: "#dc2626" })
        .setLngLat([to.lon, to.lat])
        .setPopup(new maplibregl.Popup().setText(to.label))
        .addTo(map)
    ];

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

  function updateRouteSummary(distanceMeters, durationSeconds) {
    el.routeDistance.textContent = formatDistance(distanceMeters);
    el.routeDuration.textContent = formatDuration(durationSeconds);
    el.routeSummary.hidden = false;
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
    el.routeSummary.hidden = true;
    el.routeDistance.textContent = "—";
    el.routeDuration.textContent = "—";

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

    for (const marker of state.routeMarkers) marker.remove();
    state.routeMarkers = [];
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
