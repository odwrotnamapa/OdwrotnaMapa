(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - narzędzie pomiaru odległości
  // i powierzchni (planimeter) na mapie: dwa niezależne tryby (linia
  // punktów / wielokąt), własne warstwy MapLibre, formatowanie
  // wyniku. Ten sam wzorzec configure() co pozostałe wyniesione
  // moduły.
  //
  // Dwie funkcje (toggleMeasureMode, switchMeasureMode) są w app.js
  // podpięte jako REFERENCJE do addEventListener, nie wołane wprost
  // - eksportowane tu obiekty (toggle, switchMode) muszą więc być
  // bezpośrednio przypisanymi referencjami do funkcji, gotowymi do
  // użycia jako listener bez owijania w dodatkową funkcję.

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

    if (ctx.el.measureDistanceValue) {
      ctx.el.measureDistanceValue.textContent =
        formatMeasureDistance(total);
    }
    if (ctx.el.measureDistanceBadge) {
      ctx.el.measureDistanceBadge.hidden = points.length === 0;
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

  // Jeden przycisk w pasku narzędzi włącza/wyłącza tryb pomiaru.
  // Wewnątrz plakietki jest mały przełącznik odległość/powierzchnia
  // (measureModeSwitchButton) - to on decyduje, co aktualnie mierzą
  // kliknięcia na mapie, żeby nie mnożyć ikon w pasku narzędzi.
  function toggleMeasureMode() {
    ctx.state.measureModeActive = !ctx.state.measureModeActive;

    if (ctx.state.measureModeActive) {
      ctx.state.measureIsArea = false;
      ensureMeasureLayers();
      ctx.closeOtherMobilePanels([]);
      updateMeasureModeSwitchUi();
    } else {
      clearMeasurement();
      clearMeasureAreaMeasurement();
    }

    ctx.el.measureToggleButton?.classList.toggle(
      "is-active",
      ctx.state.measureModeActive
    );
    ctx.el.measureToggleButton?.setAttribute(
      "aria-pressed",
      String(ctx.state.measureModeActive)
    );
  }

  function updateMeasureAreaDisplay() {
    const points = ctx.state.measureAreaPoints || [];
    const area = polygonAreaSquareMeters(points);

    if (ctx.el.measureDistanceValue) {
      ctx.el.measureDistanceValue.textContent = formatMeasureArea(area);
    }
    if (ctx.el.measureDistanceBadge) {
      ctx.el.measureDistanceBadge.hidden = points.length === 0;
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

  function updateMeasureModeSwitchUi() {
    if (!ctx.el.measureModeSwitchButton) return;
    const t = ctx.text[ctx.state.language];
    if (ctx.state.measureIsArea) {
      ctx.el.measureModeSwitchButton.textContent = "📏";
      ctx.el.measureModeSwitchButton.setAttribute("aria-label", t.measureSwitchToDistance);
      ctx.el.measureModeSwitchButton.title = t.measureSwitchToDistance;
    } else {
      ctx.el.measureModeSwitchButton.textContent = "📐";
      ctx.el.measureModeSwitchButton.setAttribute("aria-label", t.measureSwitchToArea);
      ctx.el.measureModeSwitchButton.title = t.measureSwitchToArea;
    }
  }

  function switchMeasureMode() {
    if (!ctx.state.measureModeActive) return;

    // Nie da się sensownie mieszać otwartej linii (odległość) z
    // zamkniętym wielokątem (powierzchnia) - przy przełączaniu
    // czyścimy oba, żeby uniknąć niespójnego stanu.
    clearMeasurement();
    clearMeasureAreaMeasurement();

    ctx.state.measureIsArea = !ctx.state.measureIsArea;
    if (ctx.state.measureIsArea) {
      ensureMeasureAreaLayers();
      updateMeasureAreaDisplay();
    } else {
      ensureMeasureLayers();
      updateMeasureDisplay();
    }

    if (ctx.el.measureDistanceBadge) ctx.el.measureDistanceBadge.hidden = true;
    updateMeasureModeSwitchUi();
  }

  window.OMAP_MEASURE = {
    configure,
    toggle: toggleMeasureMode,
    switchMode: switchMeasureMode,
    clearDistance: clearMeasurement,
    clearArea: clearMeasureAreaMeasurement,
    addPoint: addMeasurePoint,
    addAreaPoint: addMeasureAreaPoint,
    updateAreaDisplay: updateMeasureAreaDisplay,
    updateModeSwitchUi: updateMeasureModeSwitchUi
  };
})();
