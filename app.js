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
      routeWaypoint: number => `Punkt ${number}`,
      autocompleteNoResults: "Brak wyników",
      autocompleteLoading: "Szukam…",
      autocompleteError: "Nie udało się pobrać podpowiedzi.",
      autocompleteCorrected: name => `Poprawiono nazwę na: ${name}`,
      clearSearch: "Wyczyść wyszukiwanie",
      searchHistory: "Ostatnie wyszukiwania",
      clearSearchHistory: "Wyczyść historię",
      placeLoading: "Pobieranie informacji o miejscu…",
      placeUnknown: "Wybrane miejsce",
      placeType: "Typ",
      placeCoordinates: "Współrzędne",
      placeSetA: "Ustaw jako Punkt A",
      placeSetB: "Ustaw jako Punkt B",
      placeCopy: "Kopiuj",
      placeCopied: "Skopiowano informacje o miejscu.",
      placeAddressCopied: "Skopiowano adres.",
      placeCoordinatesCopied: "Skopiowano współrzędne.",
      placePhoneCopied: "Skopiowano numer telefonu.",
      placeShare: "Udostępnij",
      placeOpenOsm: "Otwórz w OpenStreetMap",
      placeError: "Nie udało się pobrać informacji o miejscu.",
      departuresTitle: "Najbliższe odjazdy",
      departuresLoading: "Pobieranie rozkładu…",
      departuresEmpty: "Brak dostępnego rozkładu dla tego przystanku.",
      departuresError: "Nie udało się pobrać rozkładu.",
      departuresScheduled: "rozkładowo",
      departuresCancelled: "odwołany",
      departuresNow: "teraz",
      departuresMinutes: minutes => `za ${minutes} min`,
      departuresSources: "Źródła danych",
      departuresShowMore: "Pokaż więcej",
      departuresShowLess: "Pokaż mniej"
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
      routeWaypoint: number => `Waypoint ${number}`,
      autocompleteNoResults: "No results",
      autocompleteLoading: "Searching…",
      autocompleteError: "Suggestions could not be loaded.",
      autocompleteCorrected: name => `Corrected to: ${name}`,
      clearSearch: "Clear search",
      searchHistory: "Recent searches",
      clearSearchHistory: "Clear history",
      placeLoading: "Loading place information…",
      placeUnknown: "Selected place",
      placeType: "Type",
      placeCoordinates: "Coordinates",
      placeSetA: "Set as Point A",
      placeSetB: "Set as Point B",
      placeCopy: "Copy",
      placeCopied: "Place information copied.",
      placeAddressCopied: "Address copied.",
      placeCoordinatesCopied: "Coordinates copied.",
      placePhoneCopied: "Phone number copied.",
      placeShare: "Share",
      placeOpenOsm: "Open in OpenStreetMap",
      placeError: "Place information could not be loaded.",
      departuresTitle: "Next departures",
      departuresLoading: "Loading timetable…",
      departuresEmpty: "No timetable is available for this stop.",
      departuresError: "The timetable could not be loaded.",
      departuresScheduled: "scheduled",
      departuresCancelled: "cancelled",
      departuresNow: "now",
      departuresMinutes: minutes => `in ${minutes} min`,
      departuresSources: "Data sources",
      departuresShowMore: "Show more",
      departuresShowLess: "Show less"
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
    selectedManeuverIndex: null,
    placePopup: null,
    placeRequestController: null
  };

  const el = {
    searchForm: $("search-form"),
    searchInput: $("search-input"),
    searchClear: $("search-clear"),
    autocompleteFloating: $("autocomplete-floating"),
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
    loadSharedPlaceFromUrl();
  });

  map.on("moveend", saveView);
  map.on("click", handleMapClick);
  map.on("contextmenu", event => {
    event.preventDefault();
    closePlacePopup();
  });

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
  initializeAutocomplete();
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLegend();
      closeAbout();
      closeRoute();
    }
  });
  el.searchForm.addEventListener("submit", search);
  el.searchInput.addEventListener("input", updateSearchClearButton);
  el.searchClear.addEventListener("click", clearMainSearch);

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

  function getSearchHistory() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.searchHistory) || "[]"
      );

      if (!Array.isArray(stored)) return [];

      return stored.filter(entry =>
        entry &&
        typeof entry.label === "string" &&
        Number.isFinite(Number(entry.lon)) &&
        Number.isFinite(Number(entry.lat))
      );
    } catch (_) {
      return [];
    }
  }

  function saveSearchHistoryEntry(entry) {
    if (!entry?.label) return;

    const normalized = normalizeSearchText(entry.label);
    const history = getSearchHistory().filter(
      item => normalizeSearchText(item.label) !== normalized
    );

    history.unshift({
      label: entry.label,
      displayName: entry.displayName || entry.label,
      lon: Number(entry.lon),
      lat: Number(entry.lat),
      savedAt: Date.now()
    });

    localStorage.setItem(
      CONFIG.storageKeys.searchHistory,
      JSON.stringify(history.slice(0, 8))
    );
  }

  function clearSearchHistory() {
    localStorage.removeItem(CONFIG.storageKeys.searchHistory);
  }

  function loadSharedPlaceFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const point = parseSharedPoint(params.get("place"));
    if (!point) return;

    map.flyTo({
      center: [point.lon, point.lat],
      zoom: 17,
      bearing: 180
    });

    map.once("moveend", () => {
      showPlaceInformation({
        lngLat: new maplibregl.LngLat(point.lon, point.lat)
      });
    });
  }

  function initializeAutocomplete() {
    const floatingList = el.autocompleteFloating;
    let activeInput = null;
    let activeSelect = null;
    let debounceTimer = null;
    let abortController = null;
    let results = [];
    let activeIndex = -1;

    const controllers = [
      {
        input: el.searchInput,
        onSelect: result => {
          const label =
            getSearchResultTitle(result) ||
            getPreferredPlaceLabel(result);

          el.searchInput.value = label;
          updateSearchClearButton();
          hideAllAutocomplete();

          const lon = Number(result.lon);
          const lat = Number(result.lat);

          saveSearchHistoryEntry({
            label,
            displayName:
              result.display_name ||
              getPreferredPlaceLabel(result),
            lon,
            lat
          });

          map.flyTo({
            center: [lon, lat],
            zoom: getSearchResultZoom(result),
            bearing: 180
          });

          map.once("moveend", () => {
            showPlaceInformation({
              lngLat: new maplibregl.LngLat(lon, lat)
            });
          });
        }
      },
      {
        input: el.routeFrom,
        onSelect: result => {
          const point = resultToRoutePoint(result);
          state.routePointA = point;
          el.routeFrom.value = point.label;
          setRouteMarker("a", point);
          state.routeClickStage = state.routePointB ? "move-b" : "b";
          updateRouteClickHint();

          if (state.routePointB) {
            calculateRouteFromStoredPoints();
          }
        }
      },
      {
        input: el.routeTo,
        onSelect: result => {
          const point = resultToRoutePoint(result);
          state.routePointB = point;
          el.routeTo.value = point.label;
          setRouteMarker("b", point);
          state.routeClickStage = "move-b";
          updateRouteClickHint();

          if (state.routePointA) {
            calculateRouteFromStoredPoints();
          }
        }
      }
    ];

    const hide = () => {
      floatingList.hidden = true;
      floatingList.replaceChildren();
      activeInput = null;
      activeSelect = null;
      results = [];
      activeIndex = -1;
    };

    const positionList = () => {
      if (!activeInput || floatingList.hidden) return;

      const rect = activeInput.getBoundingClientRect();
      const viewportPadding = 8;
      const width = Math.max(rect.width, 240);
      const maxWidth = window.innerWidth - viewportPadding * 2;

      floatingList.style.width = `${Math.min(width, maxWidth)}px`;
      floatingList.style.left = `${Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - Math.min(width, maxWidth) - viewportPadding)
      )}px`;
      floatingList.style.top = `${Math.min(
        rect.bottom + 5,
        window.innerHeight - 200
      )}px`;
    };

    const showMessage = message => {
      floatingList.replaceChildren();

      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "autocomplete-option";
      button.disabled = true;
      button.textContent = message;

      item.appendChild(button);
      floatingList.appendChild(item);
      floatingList.hidden = false;
      positionList();
    };

    const render = items => {
      floatingList.replaceChildren();
      results = items;
      activeIndex = -1;

      if (!items.length) {
        showMessage(text[state.language].autocompleteNoResults);
        return;
      }

      const fragment = document.createDocumentFragment();

      items.forEach(result => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "autocomplete-option";

        const icon = document.createElement("span");
        icon.className = "autocomplete-place-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = getSearchResultEmoji(result);

        const copy = document.createElement("span");
        copy.className = "autocomplete-place-copy";

        const title = document.createElement("strong");
        title.textContent =
          getSearchResultTitle(result) ||
          getPreferredPlaceLabel(result);

        const details = document.createElement("span");
        details.textContent =
          getSearchResultSubtitle(result) ||
          result.display_name ||
          "";

        copy.append(title, details);
        button.append(icon, copy);
        button.addEventListener("pointerdown", event => {
          event.preventDefault();
        });
        button.addEventListener("click", () => {
          activeSelect?.(result);
          hide();
        });

        item.appendChild(button);
        fragment.appendChild(item);
      });

      floatingList.appendChild(fragment);
      floatingList.hidden = false;
      positionList();
    };

    const renderHistory = () => {
      const history = getSearchHistory();

      floatingList.replaceChildren();
      activeIndex = -1;

      if (!history.length) {
        hide();
        return;
      }

      const header = document.createElement("li");
      header.className = "autocomplete-history-header";

      const title = document.createElement("span");
      title.textContent = text[state.language].searchHistory;

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "autocomplete-history-clear";
      clearButton.textContent = text[state.language].clearSearchHistory;
      clearButton.addEventListener("click", event => {
        event.stopPropagation();
        clearSearchHistory();
        hide();
      });

      header.append(title, clearButton);
      floatingList.appendChild(header);

      const fragment = document.createDocumentFragment();

      history.forEach(entry => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "autocomplete-option autocomplete-history-option";

        const icon = document.createElement("span");
        icon.className = "autocomplete-history-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "↺";

        const copy = document.createElement("span");
        copy.className = "autocomplete-history-copy";

        const label = document.createElement("strong");
        label.textContent = entry.label;

        const details = document.createElement("span");
        details.textContent = entry.displayName || entry.label;

        copy.append(label, details);
        button.append(icon, copy);

        button.addEventListener("pointerdown", event => {
          event.preventDefault();
        });

        button.addEventListener("click", () => {
          el.searchInput.value = entry.label;
          updateSearchClearButton();
          hide();

          map.flyTo({
            center: [entry.lon, entry.lat],
            zoom: 16,
            bearing: 180
          });

          map.once("moveend", () => {
            showPlaceInformation({
              lngLat: new maplibregl.LngLat(entry.lon, entry.lat)
            });
          });
        });

        item.appendChild(button);
        fragment.appendChild(item);
      });

      floatingList.appendChild(fragment);
      floatingList.hidden = false;
      positionList();
    };

    const fetchSuggestions = async query => {
      abortController?.abort();
      abortController = new AbortController();

      showMessage(text[state.language].autocompleteLoading);

      try {
        const correctedLocalQuery = state.language === "pl"
          ? correctPolishCityQuery(query)
          : query;

        const items = await findPlacesWithFallback(
          correctedLocalQuery,
          6,
          abortController.signal
        );

        if (
          activeInput &&
          activeInput.value.trim() === query &&
          correctedLocalQuery !== query
        ) {
          activeInput.value = correctedLocalQuery;
          show(
            text[state.language].autocompleteCorrected(
              correctedLocalQuery
            ),
            2200
          );
        } else if (
          activeInput &&
          activeInput.value.trim() === query &&
          !isAddressLikeQuery(query) &&
          maybeAutocorrectPlaceInput(activeInput, query, items)
        ) {
          show(
            text[state.language].autocompleteCorrected(
              getPrimaryPlaceName(items[0])
            ),
            2200
          );
        }

        render(items);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error(error);
        showMessage(text[state.language].autocompleteError);
      }
    };

    const setActive = index => {
      const buttons = [...floatingList.querySelectorAll(
        ".autocomplete-option:not(:disabled)"
      )];
      if (!buttons.length) return;

      activeIndex = (index + buttons.length) % buttons.length;
      buttons.forEach((button, currentIndex) => {
        button.classList.toggle("is-active", currentIndex === activeIndex);
      });
      buttons[activeIndex].scrollIntoView({ block: "nearest" });
    };

    for (const controller of controllers) {
      const { input, onSelect } = controller;

      input.addEventListener("input", () => {
        const query = input.value.trim();
        clearTimeout(debounceTimer);

        activeInput = input;
        activeSelect = onSelect;

        if (query.length < 2) {
          if (input === el.searchInput && !query) {
            renderHistory();
          } else {
            hide();
          }
          return;
        }

        debounceTimer = setTimeout(() => {
          fetchSuggestions(query);
        }, 350);
      });

      input.addEventListener("focus", () => {
        activeInput = input;
        activeSelect = onSelect;

        if (input === el.searchInput && !input.value.trim()) {
          renderHistory();
          return;
        }

        if (results.length && !floatingList.hidden) {
          positionList();
        }
      });

      input.addEventListener("keydown", event => {
        if (floatingList.hidden) return;

        const buttons = [...floatingList.querySelectorAll(
          ".autocomplete-option:not(:disabled)"
        )];

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive(activeIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive(activeIndex - 1);
        } else if (event.key === "Enter" && activeIndex >= 0) {
          event.preventDefault();
          buttons[activeIndex]?.click();
        } else if (event.key === "Escape") {
          hide();
        }
      });
    }

    document.addEventListener("pointerdown", event => {
      if (
        event.target !== activeInput &&
        !floatingList.contains(event.target)
      ) {
        hide();
      }
    });

    window.addEventListener("resize", positionList);
    window.addEventListener("scroll", positionList, true);

    window.addEventListener("beforeunload", () => {
      clearTimeout(debounceTimer);
      abortController?.abort();
    });
  }

  function hideAllAutocomplete() {
    if (!el.autocompleteFloating) return;
    el.autocompleteFloating.hidden = true;
    el.autocompleteFloating.replaceChildren();
  }

  const POLISH_CITY_NAMES = [
    "Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk",
    "Szczecin", "Bydgoszcz", "Lublin", "Białystok", "Katowice", "Gdynia",
    "Częstochowa", "Radom", "Toruń", "Sosnowiec", "Rzeszów", "Kielce",
    "Gliwice", "Olsztyn", "Bielsko-Biała", "Zabrze", "Bytom", "Zielona Góra",
    "Rybnik", "Ruda Śląska", "Opole", "Tychy", "Gorzów Wielkopolski",
    "Dąbrowa Górnicza", "Elbląg", "Płock", "Wałbrzych", "Włocławek",
    "Tarnów", "Chorzów", "Koszalin", "Kalisz", "Legnica", "Grudziądz",
    "Słupsk", "Jaworzno", "Jastrzębie-Zdrój", "Nowy Sącz", "Jelenia Góra",
    "Siedlce", "Konin", "Piotrków Trybunalski", "Inowrocław", "Lubin",
    "Ostrów Wielkopolski", "Suwałki", "Gniezno", "Przemyśl", "Stargard",
    "Zamość", "Chełm", "Leszno", "Łomża", "Ełk", "Tomaszów Mazowiecki",
    "Bełchatów", "Mielec", "Tczew", "Świdnica", "Biała Podlaska",
    "Będzin", "Zgierz", "Pabianice", "Racibórz", "Pruszków", "Kołobrzeg",
    "Wejherowo", "Sopot", "Zakopane"
  ];

  function correctPolishCityQuery(query) {
    const normalizedQuery = normalizeSearchText(query);

    if (
      normalizedQuery.length < 4 ||
      normalizedQuery.includes(" ") ||
      /\d/.test(normalizedQuery) ||
      isAddressLikeQuery(query)
    ) {
      return query;
    }

    let bestCity = null;
    let bestDistance = Infinity;

    for (const city of POLISH_CITY_NAMES) {
      const normalizedCity = normalizeSearchText(city);
      const distance = damerauLevenshtein(
        normalizedQuery,
        normalizedCity
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestCity = city;
      }
    }

    if (!bestCity) return query;

    const cityLength = normalizeSearchText(bestCity).length;
    const maximumDistance =
      cityLength <= 5 ? 1 :
      cityLength <= 8 ? 2 :
      3;

    const firstLetterMatches =
      normalizedQuery[0] === normalizeSearchText(bestCity)[0];

    return (
      firstLetterMatches &&
      bestDistance > 0 &&
      bestDistance <= maximumDistance
    )
      ? bestCity
      : query;
  }

  async function findPlacesWithFallback(query, limit = 6, signal) {
    const correctedQuery = state.language === "pl"
      ? correctPolishCityQuery(query)
      : query;

    if (isAddressLikeQuery(correctedQuery)) {
      try {
        const nominatimResults = await fetchNominatimPlaces(
          correctedQuery,
          limit,
          signal
        );
        if (nominatimResults.length) return nominatimResults;
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn(
          "Nominatim address search failed, using Photon fallback.",
          error
        );
      }

      return fetchPhotonPlaces(correctedQuery, limit, signal);
    }

    let photonResults = [];

    try {
      photonResults = await fetchPhotonPlaces(
        correctedQuery,
        limit,
        signal
      );
    } catch (error) {
      if (error.name === "AbortError") throw error;
      console.warn("Photon search failed, using Nominatim fallback.", error);
    }

    if (photonResults.length) return photonResults;
    return fetchNominatimPlaces(correctedQuery, limit, signal);
  }

  async function fetchPhotonPlaces(query, limit, signal) {
    const url = new URL(CONFIG.search.fuzzyEndpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", state.language);

    const response = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Photon HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.features || [])
      .map(normalizePhotonFeature)
      .filter(Boolean);
  }

  async function fetchNominatimPlaces(query, limit, signal) {
    const url = new URL(CONFIG.search.endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("dedupe", "1");
    url.searchParams.set("accept-language", state.language);

    const response = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    return response.json();
  }

  function normalizePhotonFeature(feature) {
    const properties = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates || [];
    const lon = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

    const type = String(properties.type || "").toLowerCase();
    const name =
      properties.name ||
      properties.city ||
      properties.town ||
      properties.village ||
      properties.locality ||
      "";

    const address = {
      state: properties.state,
      county: properties.county,
      country: properties.country,
      postcode: properties.postcode,
      road:
        properties.street ||
        properties.road ||
        properties.name,
      house_number:
        properties.housenumber ||
        properties.house_number
    };

    if (type === "city") address.city = name;
    else if (type === "town") address.town = name;
    else if (type === "village") address.village = name;
    else if (type === "hamlet") address.hamlet = name;
    else if (type === "municipality") address.municipality = name;
    else if (type === "district" || type === "locality") address.suburb = name;
    else if (properties.city) address.city = properties.city;
    else if (properties.town) address.town = properties.town;
    else if (properties.village) address.village = properties.village;

    const displayParts = [
      name,
      properties.city && properties.city !== name
        ? properties.city
        : null,
      properties.state,
      properties.country
    ].filter(Boolean);

    return {
      lon,
      lat,
      name,
      display_name: [...new Set(displayParts)].join(", "),
      address,
      _provider: "photon",
      _placeType: type
    };
  }

  function maybeAutocorrectPlaceInput(input, query, items) {
    if (!items.length || query.length < 4) return false;

    const best = items[0];
    if (!isSettlementResult(best)) return false;

    const candidate = getPrimaryPlaceName(best);
    if (!candidate) return false;

    const queryNormalized = normalizeSearchText(query);
    const candidateNormalized = normalizeSearchText(candidate);

    if (
      !queryNormalized ||
      !candidateNormalized ||
      queryNormalized === candidateNormalized
    ) {
      return false;
    }

    // Autokorekta nazw miejsc, a nie całych rozbudowanych adresów.
    if (queryNormalized.split(" ").length > 2) return false;

    const distance = damerauLevenshtein(
      queryNormalized,
      candidateNormalized
    );
    const longest = Math.max(
      queryNormalized.length,
      candidateNormalized.length
    );
    const maximumDistance =
      longest <= 4 ? 1 :
      longest <= 8 ? 2 :
      3;

    const sameBeginning =
      queryNormalized[0] === candidateNormalized[0];

    if (
      sameBeginning &&
      distance > 0 &&
      distance <= maximumDistance &&
      distance / longest <= 0.34
    ) {
      input.value = candidate;
      return true;
    }

    return false;
  }

  function isSettlementResult(result) {
    const type = String(result._placeType || "").toLowerCase();
    const address = result.address || {};

    return [
      "city",
      "town",
      "village",
      "hamlet",
      "municipality",
      "locality",
      "district"
    ].includes(type) || Boolean(
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.municipality
    );
  }

  function getPrimaryPlaceName(result) {
    const address = result.address || {};

    return (
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      result.name ||
      ""
    );
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function damerauLevenshtein(left, right) {
    const rows = left.length + 1;
    const columns = right.length + 1;
    const matrix = Array.from(
      { length: rows },
      () => Array(columns).fill(0)
    );

    for (let row = 0; row < rows; row++) matrix[row][0] = row;
    for (let column = 0; column < columns; column++) {
      matrix[0][column] = column;
    }

    for (let row = 1; row < rows; row++) {
      for (let column = 1; column < columns; column++) {
        const cost =
          left[row - 1] === right[column - 1] ? 0 : 1;

        matrix[row][column] = Math.min(
          matrix[row - 1][column] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column - 1] + cost
        );

        if (
          row > 1 &&
          column > 1 &&
          left[row - 1] === right[column - 2] &&
          left[row - 2] === right[column - 1]
        ) {
          matrix[row][column] = Math.min(
            matrix[row][column],
            matrix[row - 2][column - 2] + cost
          );
        }
      }
    }

    return matrix[left.length][right.length];
  }

  function getSearchResultTitle(result) {
    const address = result.address || {};

    return (
      result.name ||
      address.amenity ||
      address.tourism ||
      address.shop ||
      address.leisure ||
      address.office ||
      address.building ||
      address.road ||
      address.city ||
      address.town ||
      address.village ||
      ""
    );
  }

  function getSearchResultSubtitle(result) {
    const address = result.address || {};

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      "";

    const number =
      address.house_number ||
      address.housenumber ||
      "";

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";

    const type = getSearchResultTypeLabel(result);
    const street = [road, number].filter(Boolean).join(" ");
    const location = [street, city].filter(Boolean).join(", ");

    return [type, location]
      .filter(Boolean)
      .filter((value, index, values) => values.indexOf(value) === index)
      .join(" · ");
  }

  function getSearchResultTypeLabel(result) {
    const raw =
      result.type ||
      result._placeType ||
      result.category ||
      "";

    return String(raw)
      .replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function getSearchResultEmoji(result) {
    const address = result.address || {};

    const raw = [
      result.type,
      result._placeType,
      result.category,
      result.name,
      address.amenity,
      address.tourism,
      address.shop,
      address.leisure,
      address.office,
      address.railway,
      address.highway
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const mapping = [
      [/restaurant|food|cuisine/, "🍽"],
      [/cafe|coffee/, "☕"],
      [/bar|pub|biergarten/, "🍺"],
      [/hotel|hostel|guest_house|motel/, "🏨"],
      [/fuel|petrol|gas_station/, "⛽"],
      [/museum|gallery/, "🏛"],
      [/theatre|theater/, "🎭"],
      [/cinema/, "🎬"],
      [/supermarket|mall|shop|convenience/, "🛒"],
      [/pharmacy/, "💊"],
      [/hospital|clinic|doctors/, "🏥"],
      [/school|college|university|kindergarten/, "🏫"],
      [/bank|atm/, "🏦"],
      [/park|garden|nature_reserve/, "🌳"],
      [/church|cathedral|chapel|place_of_worship/, "⛪"],
      [/bus_stop|bus_station|platform|stop_position/, "🚏"],
      [/station|railway|train/, "🚉"],
      [/airport|aerodrome/, "✈"],
      [/harbour|harbor|port|marina/, "⚓"],
      [/parking/, "🅿️"],
      [/library/, "📚"],
      [/stadium|sports_centre|sports_center/, "🏟"],
      [/monument|memorial|historic|castle/, "🏰"],
      [/beach/, "🏖"],
      [/house|building|address/, "🏠"],
      [/city|town|village|municipality/, "🏙"]
    ];

    for (const [pattern, emoji] of mapping) {
      if (pattern.test(raw)) return emoji;
    }

    return "📍";
  }

  function getSearchResultZoom(result) {
    const raw = [
      result.type,
      result._placeType,
      result.category
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (/country|state|region/.test(raw)) return 6;
    if (/county|district/.test(raw)) return 9;
    if (/city|town|village|municipality/.test(raw)) return 13;
    if (/street|road/.test(raw)) return 16;

    return 17;
  }

  function getPreferredPlaceLabel(result) {
    const address = result.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      "";

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.cycleway ||
      address.path ||
      "";

    const houseNumber =
      address.house_number ||
      address.housenumber ||
      "";

    if (road) {
      const streetWithNumber = houseNumber
        ? `${road} ${houseNumber}`
        : road;

      return city
        ? `${city}, ${streetWithNumber}`
        : streetWithNumber;
    }

    const place =
      city ||
      result.name ||
      address.state ||
      address.county ||
      "";

    if (place) {
      const secondary =
        address.state ||
        address.county ||
        address.country;

      return secondary && secondary !== place
        ? `${place}, ${secondary}`
        : place;
    }

    return result.display_name || "";
  }

  function getPrimaryPlaceName(result) {
    const address = result.address || {};

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.cycleway ||
      address.path ||
      "";

    const houseNumber =
      address.house_number ||
      address.housenumber ||
      "";

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      "";

    if (road) {
      const streetWithNumber = houseNumber
        ? `${road} ${houseNumber}`
        : road;

      return city
        ? `${city}, ${streetWithNumber}`
        : streetWithNumber;
    }

    return (
      city ||
      result.name ||
      result.display_name ||
      ""
    );
  }

  function isAddressLikeQuery(query) {
    const normalized = normalizeSearchText(query);

    return (
      /\d/.test(normalized) ||
      normalized.split(" ").length >= 3 ||
      /\b(ul|ulica|aleja|al|plac|pl|rondo|osiedle|os)\b/.test(normalized)
    );
  }

  function resultToRoutePoint(result) {
    return {
      lon: Number(result.lon),
      lat: Number(result.lat),
      label: getPreferredPlaceLabel(result)
    };
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
    closePlacePopup();
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
    clearRoute();
    hideAllAutocomplete();
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

  async function handleMapClick(event) {
    if (!el.routePanel.hidden) {
      await handleRouteMapClick(event);
      return;
    }

    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice && state.placePopup) {
      closePlacePopup();
      return;
    }

    await showPlaceInformation(event);
  }

  function closePlacePopup() {
    state.placeRequestController?.abort();
    state.placeRequestController = null;

    if (state.placePopup) {
      const popup = state.placePopup;
      state.placePopup = null;
      popup.remove();
    }
  }

  async function showPlaceInformation(event) {
    closePlacePopup();
    state.placeRequestController = new AbortController();

    const t = text[state.language];
    const loading = document.createElement("div");
    loading.className = "place-card place-card-loading";
    loading.textContent = t.placeLoading;

    state.placePopup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: "360px",
      offset: 12
    })
      .setLngLat(event.lngLat)
      .setDOMContent(loading)
      .addTo(map);

    state.placePopup.on("close", () => {
      state.placeRequestController?.abort();
      state.placeRequestController = null;
      state.placePopup = null;
    });

    try {
      const place = await fetchPlaceInformation(
        event.lngLat.lng,
        event.lngLat.lat,
        state.placeRequestController.signal
      );

      if (!state.placePopup) return;
      state.placePopup.setDOMContent(
        createPlaceCard(place, event.lngLat)
      );
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);

      const failed = document.createElement("div");
      failed.className = "place-card place-card-loading";
      failed.textContent = t.placeError;
      state.placePopup?.setDOMContent(failed);
    }
  }

  async function fetchPlaceInformation(lon, lat, signal) {
    const url = new URL(CONFIG.search.reverseEndpoint);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("accept-language", state.language);
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse HTTP ${response.status}`);
    }

    return response.json();
  }

  function createPlaceCard(place, lngLat) {
    const t = text[state.language];
    const card = document.createElement("article");
    card.className = "place-card";

    const imageUrl = getPlaceImageUrl(place);
    if (imageUrl) {
      const image = document.createElement("img");
      image.className = "place-card-image";
      image.src = imageUrl;
      image.alt = "";
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => image.remove());
      card.appendChild(image);
    }

    const headingRow = document.createElement("div");
    headingRow.className = "place-card-heading";

    const typeIcon = document.createElement("span");
    typeIcon.className = "place-card-type-icon";
    typeIcon.setAttribute("aria-hidden", "true");
    typeIcon.textContent = getPlaceEmoji(place);

    const headingCopy = document.createElement("div");
    headingCopy.className = "place-card-heading-copy";

    const heading = document.createElement("h3");
    heading.className = "place-card-title";
    heading.textContent = getPlaceTitle(place) || t.placeUnknown;

    const type = document.createElement("p");
    type.className = "place-card-type";
    type.textContent = getPlaceTypeLabel(place);

    headingCopy.appendChild(heading);
    if (type.textContent) headingCopy.appendChild(type);
    headingRow.append(typeIcon, headingCopy);
    card.appendChild(headingRow);

    const details = document.createElement("div");
    details.className = "place-card-details";

    const addressText = getPlaceAddress(place);
    if (addressText) {
      details.appendChild(
        createInteractivePlaceRow(
          "📍",
          addressText,
          () => copyValue(addressText, t.placeAddressCopied)
        )
      );
    }

    const coordinatesText = formatCoordinates(lngLat.lng, lngLat.lat);
    details.appendChild(
      createInteractivePlaceRow(
        "🌍",
        coordinatesText,
        () => copyValue(coordinatesText, t.placeCoordinatesCopied)
      )
    );

    const extra = place.extratags || {};
    const phone = extra.phone || extra["contact:phone"] || "";
    const website =
      extra.website ||
      extra["contact:website"] ||
      extra.url ||
      "";
    const openingHours = extra.opening_hours || "";

    if (openingHours) {
      details.appendChild(
        createStaticPlaceRow("🕒", openingHours)
      );
    }

    if (phone) {
      details.appendChild(
        createPhonePlaceRow(phone)
      );
    }

    if (website) {
      details.appendChild(
        createWebsitePlaceRow(website)
      );
    }

    card.appendChild(details);

    if (isTransitStopPlace(place)) {
      const departures = createDeparturesSection();
      card.appendChild(departures.section);
      loadDeparturesForPlace(place, lngLat, departures);
    }

    const actions = document.createElement("div");
    actions.className = "place-card-actions";

    actions.append(
      createPlaceAction("📍 " + t.placeSetA, () => {
        setPlaceAsRoutePoint("a", place, lngLat);
      }),
      createPlaceAction("🏁 " + t.placeSetB, () => {
        setPlaceAsRoutePoint("b", place, lngLat);
      }),
      createPlaceAction("🔗 " + t.placeShare, () => {
        sharePlace(place, lngLat);
      })
    );

    const osmLink = document.createElement("a");
    osmLink.className = "place-card-action place-card-link";
    osmLink.target = "_blank";
    osmLink.rel = "noopener noreferrer";
    osmLink.href = `https://www.openstreetmap.org/?mlat=${lngLat.lat}&mlon=${lngLat.lng}#map=18/${lngLat.lat}/${lngLat.lng}`;
    osmLink.textContent = "🌍 OpenStreetMap";
    actions.appendChild(osmLink);

    card.appendChild(actions);
    return card;
  }

  function createInteractivePlaceRow(iconText, valueText, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-card-row place-card-row-interactive";

    const icon = document.createElement("span");
    icon.className = "place-card-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconText;

    const value = document.createElement("span");
    value.className = "place-card-row-value";
    value.textContent = valueText;

    button.append(icon, value);
    button.addEventListener("click", async () => {
      await onClick();
      flashPlaceRow(button, icon);
    });

    return button;
  }

  function createStaticPlaceRow(iconText, valueText) {
    const row = document.createElement("div");
    row.className = "place-card-row";

    const icon = document.createElement("span");
    icon.className = "place-card-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconText;

    const value = document.createElement("span");
    value.className = "place-card-row-value";
    value.textContent = valueText;

    row.append(icon, value);
    return row;
  }

  function createPhonePlaceRow(phone) {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice) {
      const link = document.createElement("a");
      link.className = "place-card-row place-card-row-interactive";
      link.href = `tel:${phone.replace(/[^\d+]/g, "")}`;

      const icon = document.createElement("span");
      icon.className = "place-card-row-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "☎";

      const value = document.createElement("span");
      value.className = "place-card-row-value";
      value.textContent = phone;

      link.append(icon, value);
      return link;
    }

    return createInteractivePlaceRow(
      "☎",
      phone,
      () => copyValue(phone, text[state.language].placePhoneCopied)
    );
  }

  function createWebsitePlaceRow(website) {
    const link = document.createElement("a");
    link.className = "place-card-row place-card-row-interactive";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = normalizeWebsiteUrl(website);

    const icon = document.createElement("span");
    icon.className = "place-card-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🌐";

    const value = document.createElement("span");
    value.className = "place-card-row-value";
    value.textContent = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

    link.append(icon, value);
    return link;
  }

  function normalizeWebsiteUrl(value) {
    return /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;
  }

  async function copyValue(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      show(successMessage);
    } catch (error) {
      console.error(error);
    }
  }

  function flashPlaceRow(row, icon) {
    const originalIcon = icon.textContent;
    row.classList.add("is-copied");
    icon.textContent = "✅";

    window.setTimeout(() => {
      row.classList.remove("is-copied");
      icon.textContent = originalIcon;
    }, 900);
  }

  function getPlaceTitle(place) {
    const names = place.namedetails || {};
    const address = place.address || {};

    return (
      names[`name:${state.language}`] ||
      names.name ||
      place.name ||
      address.amenity ||
      address.tourism ||
      address.shop ||
      address.leisure ||
      address.building ||
      address.road ||
      address.city ||
      address.town ||
      address.village ||
      ""
    );
  }

  function getPlaceAddress(place) {
    const address = place.address || {};
    const road = address.road || address.pedestrian || "";
    const number = address.house_number || "";
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";

    const street = [road, number].filter(Boolean).join(" ");
    const parts = [street, city, address.postcode, address.country]
      .filter(Boolean);

    return parts.length
      ? [...new Set(parts)].join(", ")
      : place.display_name || "";
  }

  function getPlaceTypeLabel(place) {
    const extra = place.extratags || {};
    const raw =
      extra.cuisine ||
      place.type ||
      place.category ||
      "";

    return String(raw)
      .replaceAll("_", " ")
      .replace(/\b\w/g, letter => letter.toUpperCase());
  }

  function getPlaceEmoji(place) {
    const raw = [
      place.type,
      place.category,
      place.address?.amenity,
      place.address?.tourism,
      place.address?.shop,
      place.extratags?.cuisine
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const mapping = [
      [/restaurant|food|cuisine/, "🍽"],
      [/cafe|coffee/, "☕"],
      [/bar|pub|biergarten/, "🍺"],
      [/hotel|hostel|guest_house|motel/, "🏨"],
      [/fuel|petrol|gas_station/, "⛽"],
      [/museum|gallery/, "🏛"],
      [/theatre|theater/, "🎭"],
      [/cinema/, "🎬"],
      [/supermarket|mall|shop|convenience/, "🛒"],
      [/pharmacy/, "💊"],
      [/hospital|clinic|doctors/, "🏥"],
      [/school|college|university|kindergarten/, "🏫"],
      [/bank|atm/, "🏦"],
      [/park|garden|nature_reserve/, "🌳"],
      [/church|cathedral|chapel|place_of_worship/, "⛪"],
      [/station|railway|train/, "🚉"],
      [/airport|aerodrome/, "✈"],
      [/harbour|harbor|port|marina/, "⚓"],
      [/bus_stop|bus_station/, "🚌"],
      [/parking/, "🅿️"],
      [/library/, "📚"],
      [/police/, "👮"],
      [/fire_station/, "🚒"],
      [/post_office/, "📮"],
      [/stadium|sports_centre|sports_center/, "🏟"],
      [/monument|memorial|historic|castle/, "🏰"],
      [/beach/, "🏖"]
    ];

    for (const [pattern, emoji] of mapping) {
      if (pattern.test(raw)) return emoji;
    }

    return "📍";
  }

  function getPlaceImageUrl(place) {
    const extra = place.extratags || {};
    const image = extra.image || "";
    const commons = extra.wikimedia_commons || "";

    if (/^https?:\/\//i.test(image)) {
      return image;
    }

    const commonsValue = commons.replace(/^File:/i, "").trim();
    if (commonsValue) {
      return `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(commonsValue)}`;
    }

    return "";
  }

  function createPlaceAction(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-card-action";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  function isTransitStopPlace(place) {
    const address = place.address || {};
    const extra = place.extratags || {};

    const values = [
      place.type,
      place.category,
      address.highway,
      address.public_transport,
      address.railway,
      address.amenity,
      extra.public_transport,
      extra.highway,
      extra.railway,
      extra.bus,
      extra.tram,
      extra.train,
      extra.subway
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    const joined = values.join(" ");

    return [
      "bus_stop",
      "platform",
      "stop_position",
      "station",
      "tram_stop",
      "halt",
      "subway_entrance",
      "railway"
    ].some(token => joined.includes(token));
  }

  function createDeparturesSection() {
    const t = text[state.language];

    const section = document.createElement("section");
    section.className = "place-departures";

    const header = document.createElement("div");
    header.className = "place-departures-header";

    const title = document.createElement("h4");
    title.textContent = `🚌 ${t.departuresTitle}`;

    header.appendChild(title);
    section.appendChild(header);

    const status = document.createElement("p");
    status.className = "place-departures-status";
    status.textContent = t.departuresLoading;
    section.appendChild(status);

    const list = document.createElement("ol");
    list.className = "place-departures-list";
    list.hidden = true;
    section.appendChild(list);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "place-departures-toggle";
    toggle.textContent = t.departuresShowMore;
    toggle.hidden = true;
    section.appendChild(toggle);

    const attribution = document.createElement("a");
    attribution.className = "place-departures-source";
    attribution.href = CONFIG.transit.sourcesUrl;
    attribution.target = "_blank";
    attribution.rel = "noopener noreferrer";
    attribution.textContent = t.departuresSources;
    attribution.hidden = true;
    section.appendChild(attribution);

    return { section, status, list, toggle, attribution };
  }

  async function loadDeparturesForPlace(place, lngLat, ui) {
    const t = text[state.language];

    try {
      const url = new URL(CONFIG.transit.departuresEndpoint);
      url.searchParams.set(
        "center",
        `${lngLat.lat},${lngLat.lng}`
      );
      url.searchParams.set("radius", String(CONFIG.transit.radius));
      url.searchParams.set("exactRadius", "true");
      url.searchParams.set("n", String(CONFIG.transit.limit));
      url.searchParams.set("direction", "LATER");
      url.searchParams.set("arriveBy", "false");
      url.searchParams.set("language", state.language);
      url.searchParams.set("withAlerts", "false");

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Transitous HTTP ${response.status}`);
      }

      const data = await response.json();
      const departures = Array.isArray(data.stopTimes)
        ? data.stopTimes
        : [];

      if (!departures.length) {
        ui.status.textContent = t.departuresEmpty;
        return;
      }

      renderDepartures(departures, ui);
    } catch (error) {
      console.error(error);
      ui.status.textContent = t.departuresError;
    }
  }

  function renderDepartures(departures, ui) {
    const t = text[state.language];
    const compactLimit = 2;
    const visibleDepartures = departures.slice(
      0,
      CONFIG.transit.limit
    );

    let expanded = false;

    const draw = () => {
      ui.list.replaceChildren();

      const fragment = document.createDocumentFragment();
      const items = expanded
        ? visibleDepartures
        : visibleDepartures.slice(0, compactLimit);

      items.forEach(departure => {
        const item = document.createElement("li");
        item.className = "place-departure";

        if (departure.cancelled || departure.tripCancelled) {
          item.classList.add("is-cancelled");
        }

        const badge = document.createElement("span");
        badge.className = "place-departure-line";

        const routeName =
          departure.routeShortName ||
          departure.displayName ||
          departure.tripShortName ||
          getTransitModeEmoji(departure.mode);

        badge.textContent = routeName;
        applyTransitRouteColors(
          badge,
          departure.routeColor,
          departure.routeTextColor
        );

        const copy = document.createElement("span");
        copy.className = "place-departure-copy";

        const direction = document.createElement("strong");
        direction.className = "place-departure-direction";
        direction.textContent =
          departure.headsign ||
          departure.tripTo?.name ||
          departure.routeLongName ||
          "—";

        const timing = document.createElement("span");
        timing.className = "place-departure-time";
        timing.textContent = formatDepartureTiming(departure);

        copy.append(direction, timing);
        item.append(badge, copy);
        fragment.appendChild(item);
      });

      ui.list.appendChild(fragment);
      ui.list.classList.toggle("is-expanded", expanded);

      if (visibleDepartures.length > compactLimit) {
        ui.toggle.hidden = false;
        ui.toggle.textContent = expanded
          ? t.departuresShowLess
          : t.departuresShowMore;
        ui.toggle.setAttribute("aria-expanded", String(expanded));
      } else {
        ui.toggle.hidden = true;
      }
    };

    ui.toggle.addEventListener("click", () => {
      expanded = !expanded;
      draw();

      if (!expanded) {
        ui.list.scrollTop = 0;
      }
    });

    draw();

    ui.status.hidden = true;
    ui.list.hidden = false;
    ui.attribution.hidden = false;
  }

  function formatDepartureTiming(departure) {
    const t = text[state.language];
    const place = departure.place || {};

    const actualValue =
      place.departure ||
      place.arrival ||
      place.scheduledDeparture ||
      place.scheduledArrival;

    const scheduledValue =
      place.scheduledDeparture ||
      place.scheduledArrival ||
      actualValue;

    const actual = new Date(actualValue);
    const scheduled = new Date(scheduledValue);

    if (Number.isNaN(actual.getTime())) {
      return departure.cancelled || departure.tripCancelled
        ? t.departuresCancelled
        : t.departuresScheduled;
    }

    const clock = actual.toLocaleTimeString(
      state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    const minutes = Math.max(
      0,
      Math.round((actual.getTime() - Date.now()) / 60000)
    );

    const relative =
      minutes <= 0
        ? t.departuresNow
        : t.departuresMinutes(minutes);

    if (departure.cancelled || departure.tripCancelled) {
      return `${clock} · ${t.departuresCancelled}`;
    }

    let suffix = departure.realTime
      ? ""
      : ` · ${t.departuresScheduled}`;

    if (
      departure.realTime &&
      !Number.isNaN(scheduled.getTime())
    ) {
      const delayMinutes = Math.round(
        (actual.getTime() - scheduled.getTime()) / 60000
      );

      if (delayMinutes > 0) {
        suffix = ` · +${delayMinutes} min`;
      } else if (delayMinutes < 0) {
        suffix = ` · ${delayMinutes} min`;
      }
    }

    return `${clock} · ${relative}${suffix}`;
  }

  function getTransitModeEmoji(mode) {
    const normalized = String(mode || "").toUpperCase();

    if (normalized.includes("TRAM")) return "🚋";
    if (
      normalized.includes("RAIL") ||
      normalized.includes("TRAIN") ||
      normalized.includes("SUBURBAN")
    ) return "🚆";
    if (
      normalized.includes("SUBWAY") ||
      normalized.includes("METRO")
    ) return "🚇";
    if (normalized.includes("FERRY")) return "⛴";
    if (normalized.includes("BUS")) return "🚌";
    return "🚌";
  }

  function applyTransitRouteColors(element, background, foreground) {
    const safeBackground = normalizeTransitColor(background);
    const safeForeground = normalizeTransitColor(foreground);

    if (safeBackground) {
      element.style.backgroundColor = safeBackground;
      element.style.borderColor = safeBackground;
    }

    if (safeForeground) {
      element.style.color = safeForeground;
    } else if (safeBackground) {
      element.style.color = getReadableTextColor(safeBackground);
    }
  }

  function normalizeTransitColor(value) {
    if (!value) return "";

    const color = String(value).trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`;

    return "";
  }

  function getReadableTextColor(hexColor) {
    const value = hexColor.replace("#", "");
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    const luminance =
      (red * 299 + green * 587 + blue * 114) / 1000;

    return luminance > 150 ? "#111827" : "#ffffff";
  }

  function pointFromPlace(place, lngLat) {
    return {
      lon: lngLat.lng,
      lat: lngLat.lat,
      label:
        getPlaceAddress(place) ||
        getPlaceTitle(place) ||
        formatCoordinates(lngLat.lng, lngLat.lat)
    };
  }

  function setPlaceAsRoutePoint(key, place, lngLat) {
    const point = pointFromPlace(place, lngLat);

    if (el.routePanel.hidden) {
      toggleRoute();
    }

    if (key === "a") {
      state.routePointA = point;
      el.routeFrom.value = point.label;
      setRouteMarker("a", point);
    } else {
      state.routePointB = point;
      el.routeTo.value = point.label;
      setRouteMarker("b", point);
    }

    state.routeClickStage = state.routePointA
      ? (state.routePointB ? "move-b" : "b")
      : "a";

    updateRouteClickHint();
    closePlacePopup();

    if (state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
    }
  }


  async function sharePlace(place, lngLat) {
    const url = new URL(window.location.href);
    url.searchParams.set("place", `${lngLat.lat},${lngLat.lng}`);

    const shareData = {
      title: getPlaceTitle(place) || document.title,
      text: getPlaceAddress(place),
      url: url.toString()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url.toString());
        show(text[state.language].routeShared);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
      }
    }
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
      anchor: "bottom",
      draggable: true
    })
      .setLngLat([point.lon, point.lat])
      .setPopup(new maplibregl.Popup().setText(point.label))
      .addTo(map);

    marker.on("dragend", async () => {
      const position = marker.getLngLat();
      const updatedPoint = {
        lon: position.lng,
        lat: position.lat,
        label: formatCoordinates(position.lng, position.lat)
      };

      try {
        updatedPoint.label = await reverseGeocodeRoutePoint(updatedPoint);
      } catch (error) {
        console.error(error);
      }

      if (isA) {
        state.routePointA = updatedPoint;
        el.routeFrom.value = updatedPoint.label;
      } else {
        state.routePointB = updatedPoint;
        el.routeTo.value = updatedPoint.label;
      }

      marker.setPopup(
        new maplibregl.Popup().setText(updatedPoint.label)
      );

      if (state.routePointA && state.routePointB) {
        await calculateRouteFromStoredPoints();
      }
    });

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
      el.routeFrom.value = from.label;
      el.routeTo.value = to.label;
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
    const results = await findPlacesWithFallback(query, 1);
    if (!results.length) return null;

    return {
      lon: Number(results[0].lon),
      lat: Number(results[0].lat),
      label: getPreferredPlaceLabel(results[0])
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
    el.routeFrom.value = "";
    el.routeTo.value = "";
    hideAllAutocomplete();
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

  function updateSearchClearButton() {
    if (!el.searchClear) return;
    el.searchClear.hidden = !el.searchInput.value.trim();
  }

  function clearMainSearch() {
    el.searchInput.value = "";
    hideAllAutocomplete();
    updateSearchClearButton();
    el.searchInput.focus();
    el.searchInput.dispatchEvent(new Event("focus"));
  }

  async function search(event) {
    event.preventDefault();
    const q = el.searchInput.value.trim();
    if (!q) return;
    show(text[state.language].searching, 0);

    try {
      const results = await findPlacesWithFallback(
        q,
        CONFIG.search.limit
      );
      if (!results.length) return show(text[state.language].noResults);

      const result = results[0];
      const correctedName = getPrimaryPlaceName(result);
      if (correctedName) {
        el.searchInput.value = correctedName;
        updateSearchClearButton();
      }
      saveSearchHistoryEntry({
        label: correctedName || getPreferredPlaceLabel(result),
        displayName: result.display_name || getPreferredPlaceLabel(result),
        lon: Number(result.lon),
        lat: Number(result.lat)
      });

      const point = [Number(result.lon), Number(result.lat)];
      hideAllAutocomplete();
      hide();

      map.flyTo({
        center: point,
        zoom: getSearchResultZoom(result),
        bearing: 180
      });

      map.once("moveend", () => {
        showPlaceInformation({
          lngLat: new maplibregl.LngLat(point[0], point[1])
        });
      });
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
