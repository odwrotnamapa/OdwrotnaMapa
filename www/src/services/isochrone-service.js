(function () {
  "use strict";

  // Isochrona ("czas dojazdu") - poligon pokazujacy obszar, ktory da
  // sie osiagnac z danego punktu w zadanym czasie (np. 15 minut
  // pieszo), biorac pod uwage rzeczywista siec ulic/drog. Uzywamy tego
  // samego publicznego serwera Valhalla co reszta appki (routing),
  // tylko endpointu /isochrone zamiast /route - zero nowych
  // zaleznosci zewnetrznych.
  //
  // Ten sam wzorzec UX co narzedzie pomiaru (measure-service.js):
  // jeden przycisk w pasku narzedzi wlacza/wylacza "tryb isochrony",
  // a kolejne klikniecie na mapie ustawia punkt startowy i liczy
  // obszar. Ponowne klikniecie przycisku w pasku wylacza tryb i
  // czysci warstwe.

  let ctx = null;
  let currentOrigin = null; // { lat, lon } ostatnio klikniety punkt
  let currentMode = "pedestrian"; // pedestrian | bicycle | auto
  let currentMinutes = 15;
  let requestToken = 0; // odrzucanie przestarzalych odpowiedzi (race)

  // Osobne, lokalne warstwy (nie w config.js, analogicznie do
  // measure-service.js) na znacznik punktu, od ktorego liczona jest
  // izochrona - zeby bylo widac, skad zaczyna sie obszar.
  const ORIGIN_SOURCE_ID = "odwrotnamapa-isochrone-origin";
  const ORIGIN_POINT_LAYER_ID = "odwrotnamapa-isochrone-origin-point";

  function configure(newCtx) {
    ctx = newCtx;
  }

  function ensureLayers() {
    const cfg = ctx.CONFIG.isochrone;

    if (!ctx.map.getSource(cfg.sourceId)) {
      ctx.map.addSource(cfg.sourceId, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
    }

    if (!ctx.map.getLayer(cfg.fillLayerId)) {
      ctx.map.addLayer({
        id: cfg.fillLayerId,
        type: "fill",
        source: cfg.sourceId,
        layout: { visibility: "none" },
        paint: {
          "fill-color": ctx.getAccentColor(),
          "fill-opacity": 0.18
        }
      });
    }

    if (!ctx.map.getLayer(cfg.lineLayerId)) {
      ctx.map.addLayer({
        id: cfg.lineLayerId,
        type: "line",
        source: cfg.sourceId,
        layout: { visibility: "none", "line-join": "round" },
        paint: {
          "line-color": ctx.getAccentColor(),
          "line-width": 2.5,
          "line-opacity": 0.85
        }
      });
    }

    if (!ctx.map.getSource(ORIGIN_SOURCE_ID)) {
      ctx.map.addSource(ORIGIN_SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] }
      });
    }

    if (!ctx.map.getLayer(ORIGIN_POINT_LAYER_ID)) {
      ctx.map.addLayer({
        id: ORIGIN_POINT_LAYER_ID,
        type: "circle",
        source: ORIGIN_SOURCE_ID,
        paint: {
          "circle-radius": 5,
          "circle-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-stroke-color": ctx.getAccentColor()
        }
      });
    }
  }

  function setOriginMarker(origin) {
    const source = ctx.map.getSource(ORIGIN_SOURCE_ID);
    if (!source) return;
    const features = origin
      ? [
          {
            type: "Feature",
            geometry: { type: "Point", coordinates: [origin.lon, origin.lat] },
            properties: {}
          }
        ]
      : [];
    source.setData({ type: "FeatureCollection", features });
  }

  function setLayersVisible(visible) {
    const cfg = ctx.CONFIG.isochrone;
    const visibility = visible ? "visible" : "none";
    if (ctx.map.getLayer(cfg.fillLayerId)) {
      ctx.map.setLayoutProperty(cfg.fillLayerId, "visibility", visibility);
    }
    if (ctx.map.getLayer(cfg.lineLayerId)) {
      ctx.map.setLayoutProperty(cfg.lineLayerId, "visibility", visibility);
    }
  }

  function setData(featureCollection) {
    const cfg = ctx.CONFIG.isochrone;
    ensureLayers();
    ctx.map.getSource(cfg.sourceId)?.setData(
      featureCollection || { type: "FeatureCollection", features: [] }
    );
  }

  function updateBadgeUi() {
    if (ctx.el.isochroneMinutesSelect) {
      ctx.el.isochroneMinutesSelect.value = String(currentMinutes);
    }
    for (const button of ctx.el.isochroneBadge?.querySelectorAll(
      "[data-isochrone-mode]"
    ) || []) {
      button.classList.toggle(
        "is-active",
        button.dataset.isochroneMode === currentMode
      );
      button.setAttribute(
        "aria-pressed",
        button.dataset.isochroneMode === currentMode ? "true" : "false"
      );
    }
  }

  // Liczy i rysuje obszar dla currentOrigin/currentMode/currentMinutes
  // (juz ustawionych przez wywolujacego).
  async function recalculate() {
    if (!ctx?.map || !currentOrigin) return;

    ctx.el.isochroneStatus && (ctx.el.isochroneStatus.hidden = false);
    const token = ++requestToken;

    try {
      const response = await fetch(ctx.CONFIG.isochrone.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-Client-Id": ctx.CONFIG.isochrone.clientId
        },
        body: JSON.stringify({
          locations: [{ lat: currentOrigin.lat, lon: currentOrigin.lon }],
          costing: currentMode,
          contours: [{ time: currentMinutes }],
          polygons: true,
          denoise: 0.6,
          generalize: 50
        })
      });

      if (token !== requestToken) return; // nowsze zadanie juz w toku

      if (!response.ok) {
        throw new Error(`Valhalla HTTP ${response.status}`);
      }

      const geojson = await response.json();
      if (token !== requestToken) return;

      setData(geojson);
      setLayersVisible(true);
    } catch (err) {
      if (token !== requestToken) return;
      console.warn("Isochrone: nie udalo sie policzyc obszaru", err);
      setLayersVisible(false);
      const t = ctx.text[ctx.state.language];
      ctx.el.isochroneStatus &&
        (ctx.el.isochroneStatus.textContent = t.isochroneError);
      return;
    } finally {
      if (token === requestToken) {
        ctx.el.isochroneStatus && (ctx.el.isochroneStatus.hidden = true);
      }
    }
  }

  // Wywolywane z app.js na klikniecie mapy, TYLKO gdy
  // state.isochroneModeActive jest wlaczony (analogicznie do
  // OMAP_MEASURE.addPoint).
  function addPoint(lngLat) {
    if (!lngLat) return;
    currentOrigin = { lat: lngLat.lat, lon: lngLat.lng ?? lngLat.lon };
    ensureLayers();
    setOriginMarker(currentOrigin);
    if (ctx.el.isochroneBadge) ctx.el.isochroneBadge.hidden = false;
    updateBadgeUi();
    recalculate();
  }

  function setMode(mode) {
    if (mode === currentMode) return;
    currentMode = mode;
    updateBadgeUi();
    if (currentOrigin) recalculate();
  }

  function setMinutes(minutes) {
    const value = Number(minutes);
    if (!Number.isFinite(value) || value === currentMinutes) return;
    currentMinutes = value;
    updateBadgeUi();
    if (currentOrigin) recalculate();
  }

  // Jeden przycisk w pasku narzedzi wlacza/wylacza tryb - ten sam
  // wzorzec co OMAP_MEASURE.toggle (patrz measure-service.js).
  function toggle() {
    ctx.state.isochroneModeActive = !ctx.state.isochroneModeActive;

    if (ctx.state.isochroneModeActive) {
      ensureLayers();
      ctx.closeOtherMobilePanels([]);
    } else {
      currentOrigin = null;
      requestToken++;
      setLayersVisible(false);
      setOriginMarker(null);
      if (ctx.el.isochroneBadge) ctx.el.isochroneBadge.hidden = true;
    }

    ctx.el.isochroneToggleButton?.classList.toggle(
      "is-active",
      ctx.state.isochroneModeActive
    );
    ctx.el.isochroneToggleButton?.setAttribute(
      "aria-pressed",
      String(ctx.state.isochroneModeActive)
    );
  }

  window.OMAP_ISOCHRONE = {
    configure,
    toggle,
    addPoint,
    setMode,
    setMinutes
  };
})();
