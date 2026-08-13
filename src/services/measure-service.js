(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - narzędzie pomiaru odległości
  // i powierzchni (planimeter) na mapie. Rozszerzone (2026-08-13) o
  // orkiestrację zunifikowanego narzędzia "pomiar / czas dojazdu":
  // JEDEN przycisk w pasku (travel-tool-toggle-button) i JEDNA
  // pływająca plakietka (#travel-tool-badge) z wewnętrznym
  // przełącznikiem trzech trybów - odległość / powierzchnia / czas
  // dojazdu (izochrona) - zamiast dawnych dwóch osobnych przycisków
  // (measure-toggle-button + isochrone-toggle-button), które na
  // wąskich ekranach (iPhone) zaczynały brakować miejsca. Logika
  // samej izochrony została w isochrone-service.js (activate/clear/
  // addPoint/setMode/setMinutes) - ten moduł tylko nią steruje przy
  // przełączaniu trybu, tak samo jak własnymi trybami
  // odległość/powierzchnia.
  //
  // Funkcje eksportowane niżej (toggle, setMode, clear) są w app.js
  // podpięte jako REFERENCJE do addEventListener, nie wołane wprost
  // - muszą więc być bezpośrednio przypisanymi referencjami do
  // funkcji, gotowymi do użycia jako listener bez owijania w
  // dodatkową funkcję.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  // Te same stałe co w app.js (linie ~49-55) - identyfikatory
  // źródeł/warstw MapLibre dla narzędzia pomiaru. app.js wciąż ma
  // własną kopię, bo używa jej osobno przy aktualizacji koloru
  // akcentu motywu (getLayer/setPaintProperty) - to proste, statyczne
  // stringi bez ryzyka rozjazdu, więc zduplikowanie jest bezpieczne
  // i prostsze niż przekazywanie ich przez configure().
  const MEASURE_SOURCE_ID = "odwrotnamapa-measure";
  const MEASURE_LINE_LAYER_ID = "odwrotnamapa-measure-line";
  const MEASURE_POINTS_LAYER_ID = "odwrotnamapa-measure-points";
  const MEASURE_AREA_SOURCE_ID = "odwrotnamapa-measure-area";
  const MEASURE_AREA_FILL_LAYER_ID = "odwrotnamapa-measure-area-fill";
  const MEASURE_AREA_LINE_LAYER_ID = "odwrotnamapa-measure-area-line";
  const MEASURE_AREA_POINTS_LAYER_ID = "odwrotnamapa-measure-area-points";

  function haversineDistanceMeters(a, b) {
    const R = 6371000;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat);
    const dLon = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function formatMeasureDistance(meters) {
    if (meters >= 1000) {
      return `${(meters / 1000).toLocaleString(
        ctx.state.language === "pl" ? "pl-PL" : "en-US",
        { maximumFractionDigits: 2 }
      )} km`;
    }
    return `${Math.round(meters)} m`;
  }

  // Rzutujemy punkty na lokalną płaszczyznę styczną (przybliżenie
  // równoodległościowe wyśrodkowane na średniej szerokości
  // geograficznej wielokąta) i liczymy powierzchnię wzorem Gaussa
  // (shoelace). To standardowe podejście w konsumenckich narzędziach
  // do pomiaru powierzchni w przeglądarce - dokładność rzędu ułamka
  // procenta dla obszarów wielkości miasta/regionu, więc w zupełności
  // wystarczające (to nie narzędzie geodezyjne).
  function polygonAreaSquareMeters(points) {
    if (points.length < 3) return 0;

    const R = 6371000;
    const toRad = deg => (deg * Math.PI) / 180;
    const meanLat = points.reduce((sum, p) => sum + p.lat, 0) / points.length;
    const cosMeanLat = Math.cos(toRad(meanLat));

    const projected = points.map(p => ({
      x: R * toRad(p.lng) * cosMeanLat,
      y: R * toRad(p.lat)
    }));

    let sum = 0;
    for (let i = 0; i < projected.length; i++) {
      const a = projected[i];
      const b = projected[(i + 1) % projected.length];
      sum += a.x * b.y - b.x * a.y;
    }

    return Math.abs(sum) / 2;
  }

  function formatMeasureArea(squareMeters) {
    const locale = ctx.state.language === "pl" ? "pl-PL" : "en-US";
    if (squareMeters >= 1000000) {
      return `${(squareMeters / 1000000).toLocaleString(
        locale,
        { maximumFractionDigits: 2 }
      )} km²`;
    }
    if (squareMeters >= 10000) {
      return `${(squareMeters / 10000).toLocaleString(
        locale,
        { maximumFractionDigits: 2 }
      )} ha`;
    }
    return `${Math.round(squareMeters).toLocaleString(locale)} m²`;
  }

  function ensureMeasureLayers() {
    if (ctx.map.getSource(MEASURE_SOURCE_ID)) return;

    ctx.map.addSource(MEASURE_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    ctx.map.addLayer({
      id: MEASURE_LINE_LAYER_ID,
      type: "line",
      source: MEASURE_SOURCE_ID,
      filter: ["==", ["geometry-type"], "LineString"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ctx.getAccentColor(),
        "line-width": 3,
        "line-dasharray": [2, 1]
      }
    });

    ctx.map.addLayer({
      id: MEASURE_POINTS_LAYER_ID,
      type: "circle",
      source: MEASURE_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-stroke-color": ctx.getAccentColor()
      }
    });
  }

  function ensureMeasureAreaLayers() {
    if (ctx.map.getSource(MEASURE_AREA_SOURCE_ID)) return;

    ctx.map.addSource(MEASURE_AREA_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] }
    });

    ctx.map.addLayer({
      id: MEASURE_AREA_FILL_LAYER_ID,
      type: "fill",
      source: MEASURE_AREA_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Polygon"],
      paint: {
        "fill-color": ctx.getAccentColor(),
        "fill-opacity": 0.2
      }
    });

    ctx.map.addLayer({
      id: MEASURE_AREA_LINE_LAYER_ID,
      type: "line",
      source: MEASURE_AREA_SOURCE_ID,
      filter: ["!=", ["geometry-type"], "Point"],
      layout: { "line-cap": "round", "line-join": "round" },
      paint: {
        "line-color": ctx.getAccentColor(),
        "line-width": 3,
        "line-dasharray": [2, 1]
      }
    });

    ctx.map.addLayer({
      id: MEASURE_AREA_POINTS_LAYER_ID,
      type: "circle",
      source: MEASURE_AREA_SOURCE_ID,
      filter: ["==", ["geometry-type"], "Point"],
      paint: {
        "circle-radius": 5,
        "circle-color": "#ffffff",
        "circle-stroke-width": 2,
        "circle-stroke-color": ctx.getAccentColor()
      }
    });
  }

  function updateMeasureDisplay() {
    const points = ctx.state.measurePoints || [];
    let total = 0;
    for (let i = 1; i < points.length; i++) {
      total += haversineDistanceMeters(points[i - 1], points[i]);
    }

    if (ctx.el.travelToolDistanceValue) {
      ctx.el.travelToolDistanceValue.textContent =
        formatMeasureDistance(total);
    }

    const source = ctx.map.getSource(MEASURE_SOURCE_ID);
    if (!source) return;

    const pointFeatures = points.map(p => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {}
    }));

    const features = [...pointFeatures];
    if (points.length > 1) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: points.map(p => [p.lng, p.lat])
        },
        properties: {}
      });
    }

    source.setData({ type: "FeatureCollection", features });
  }

  function addMeasurePoint(lngLat) {
    if (!ctx.state.measurePoints) ctx.state.measurePoints = [];
    ctx.state.measurePoints.push({ lat: lngLat.lat, lng: lngLat.lng });
    updateMeasureDisplay();
  }

  function clearMeasurement() {
    ctx.state.measurePoints = [];
    updateMeasureDisplay();
  }

  const TRAVEL_TOOL_MODE_ICONS = {
    distance: "📏",
    area: "📐",
    isochrone: "⏱️"
  };

  // Czyści dane WSZYSTKICH trzech trybów naraz - używane zarówno przy
  // całkowitym wyłączeniu narzędzia, jak i przy przełączaniu między
  // trybami (nie da się sensownie mieszać np. otwartej linii pomiaru
  // z izochroną - przy zmianie trybu zawsze zaczynamy od zera).
  function clearAllTravelToolModes() {
    clearMeasurement();
    clearMeasureAreaMeasurement();
    window.OMAP_ISOCHRONE?.clear();
  }

  function ensureModeLayers(mode) {
    if (mode === "area") {
      ensureMeasureAreaLayers();
    } else if (mode === "isochrone") {
      window.OMAP_ISOCHRONE?.activate();
    } else {
      ensureMeasureLayers();
    }
  }

  // Jeden przycisk w pasku narzędzi włącza/wyłącza całe narzędzie.
  // Wewnątrz plakietki jest przełącznik trybu (odległość / powierzchnia
  // / czas dojazdu, patrz setTravelToolMode) - to on decyduje, co
  // aktualnie robią kliknięcia na mapie, żeby nie mnożyć ikon w pasku
  // narzędzi (dawniej osobne przyciski dla pomiaru i izochrony nie
  // mieściły się razem na wąskich ekranach).
  function toggleTravelTool() {
    if (ctx.state.travelToolMode) {
      clearAllTravelToolModes();
      ctx.state.travelToolMode = null;
      if (ctx.el.travelToolBadge) ctx.el.travelToolBadge.hidden = true;
    } else {
      ctx.state.travelToolMode = "distance";
      ensureModeLayers("distance");
      ctx.closeOtherMobilePanels([]);
      if (ctx.el.travelToolBadge) ctx.el.travelToolBadge.hidden = false;
    }

    updateTravelToolUi();

    ctx.el.travelToolToggleButton?.classList.toggle(
      "is-active",
      Boolean(ctx.state.travelToolMode)
    );
    ctx.el.travelToolToggleButton?.setAttribute(
      "aria-pressed",
      String(Boolean(ctx.state.travelToolMode))
    );
  }

  // Przełącznik trybu WEWNĄTRZ plakietki (data-travel-tool-mode na
  // trzech przyciskach: odległość/powierzchnia/czas dojazdu) - to on
  // realizuje "przełączanie w środku", żeby jeden przycisk w pasku
  // wystarczał na wszystkie trzy narzędzia.
  function setTravelToolMode(mode) {
    if (!ctx.state.travelToolMode) return; // narzędzie musi być aktywne
    if (mode === ctx.state.travelToolMode) return;

    clearAllTravelToolModes();
    ctx.state.travelToolMode = mode;
    ensureModeLayers(mode);
    updateTravelToolUi();
  }

  function clearActiveTravelToolMode() {
    if (ctx.state.travelToolMode === "area") {
      clearMeasureAreaMeasurement();
    } else if (ctx.state.travelToolMode === "isochrone") {
      window.OMAP_ISOCHRONE?.clear();
    } else if (ctx.state.travelToolMode === "distance") {
      clearMeasurement();
    }
  }

  function updateTravelToolUi() {
    const mode = ctx.state.travelToolMode;

    if (ctx.el.travelToolToggleIcon) {
      ctx.el.travelToolToggleIcon.textContent =
        TRAVEL_TOOL_MODE_ICONS[mode] || TRAVEL_TOOL_MODE_ICONS.distance;
    }

    for (const button of ctx.el.travelToolBadge?.querySelectorAll(
      "[data-travel-tool-mode]"
    ) || []) {
      const isActive = button.dataset.travelToolMode === mode;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    }

    if (ctx.el.travelToolDistanceValue) {
      ctx.el.travelToolDistanceValue.hidden = mode === "isochrone";
    }
    if (ctx.el.travelToolIsochroneControls) {
      ctx.el.travelToolIsochroneControls.hidden = mode !== "isochrone";
    }

    if (mode === "area") {
      updateMeasureAreaDisplay();
    } else if (mode === "distance") {
      updateMeasureDisplay();
    }
  }

  function updateMeasureAreaDisplay() {
    const points = ctx.state.measureAreaPoints || [];
    const area = polygonAreaSquareMeters(points);

    if (ctx.el.travelToolDistanceValue) {
      ctx.el.travelToolDistanceValue.textContent = formatMeasureArea(area);
    }

    const source = ctx.map.getSource(MEASURE_AREA_SOURCE_ID);
    if (!source) return;

    const pointFeatures = points.map(p => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: {}
    }));

    const features = [...pointFeatures];
    if (points.length === 2) {
      features.push({
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: points.map(p => [p.lng, p.lat])
        },
        properties: {}
      });
    } else if (points.length > 2) {
      const ring = points.map(p => [p.lng, p.lat]);
      ring.push(ring[0]);
      features.push({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [ring]
        },
        properties: {}
      });
    }

    source.setData({ type: "FeatureCollection", features });
  }

  function addMeasureAreaPoint(lngLat) {
    if (!ctx.state.measureAreaPoints) ctx.state.measureAreaPoints = [];
    ctx.state.measureAreaPoints.push({ lat: lngLat.lat, lng: lngLat.lng });
    updateMeasureAreaDisplay();
  }

  function clearMeasureAreaMeasurement() {
    ctx.state.measureAreaPoints = [];
    const source = ctx.map.getSource(MEASURE_AREA_SOURCE_ID);
    if (source) source.setData({ type: "FeatureCollection", features: [] });
  }

  window.OMAP_MEASURE = {
    configure,
    toggle: toggleTravelTool,
    setMode: setTravelToolMode,
    clear: clearActiveTravelToolMode,
    addPoint: addMeasurePoint,
    addAreaPoint: addMeasureAreaPoint,
    updateUi: updateTravelToolUi
  };
})();
