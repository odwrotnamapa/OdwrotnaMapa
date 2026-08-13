(function () {
  "use strict";

  // Isochrona ("czas dojazdu") - poligon pokazujacy obszar, ktory da
  // sie osiagnac z danego punktu w zadanym czasie (np. 15 minut
  // pieszo), biorac pod uwage rzeczywista siec ulic/drog. Uzywamy tego
  // samego publicznego serwera Valhalla co reszta appki (routing),
  // tylko endpointu /isochrone zamiast /route - zero nowych
  // zaleznosci zewnetrznych.
  //
  // Od 2026-08-13 to jeden z trzech trybow zunifikowanego narzedzia
  // "pomiar / czas dojazdu" (patrz measure-service.js,
  // toggleTravelTool/setTravelToolMode) - dawniej mial wlasny
  // przycisk w pasku i wlasna plakietke, teraz measure-service.js
  // orkiestruje WSPOLNA plakietke (#travel-tool-badge) i WSPOLNY
  // przycisk w pasku, a ten modul odpowiada tylko za logike samej
  // izochrony (activate/deactivate/clear zamiast dawnego toggle()).

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
    for (const button of ctx.el.travelToolIsochroneControls?.querySelectorAll(
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
  // state.travelToolMode === "isochrone" (analogicznie do
  // OMAP_MEASURE.addPoint dla trybu odleglosci/powierzchni).
  function addPoint(lngLat) {
    if (!lngLat) return;
    currentOrigin = { lat: lngLat.lat, lon: lngLat.lng ?? lngLat.lon };
    ensureLayers();
    setOriginMarker(currentOrigin);
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

  // Warstwy izochrony sa dodawane do stylu mapy dynamicznie (poza
  // config.js), wiec applyTheme() w app.js przy kazdej zmianie motywu
  // (dark/custom/domyslny) przechodzi po nich tak samo jak po
  // wszystkich pozostalych warstwach stylu i nadpisuje im kolor wg
  // palety motywu (traktujac je jak zwykly teren) - w efekcie
  // przezroczysty fill zamienia sie w pelne, nieprzezroczyste tlo.
  // Trzeba wiec po kazdej zmianie motywu recznie przywrocic wlasciwy
  // kolor/przezroczystosc, dokladnie tak jak robi to juz
  // updateAccentDependentMapLayers() w app.js dla warstw pomiaru.
  function applyAccentColor() {
    if (!ctx?.map) return;
    const cfg = ctx.CONFIG.isochrone;
    const accent = ctx.getAccentColor();

    if (ctx.map.getLayer(cfg.fillLayerId)) {
      ctx.map.setPaintProperty(cfg.fillLayerId, "fill-color", accent);
      ctx.map.setPaintProperty(cfg.fillLayerId, "fill-opacity", 0.18);
    }
    if (ctx.map.getLayer(cfg.lineLayerId)) {
      ctx.map.setPaintProperty(cfg.lineLayerId, "line-color", accent);
      ctx.map.setPaintProperty(cfg.lineLayerId, "line-opacity", 0.85);
      ctx.map.setPaintProperty(cfg.lineLayerId, "line-width", 2.5);
    }
    if (ctx.map.getLayer(ORIGIN_POINT_LAYER_ID)) {
      ctx.map.setPaintProperty(ORIGIN_POINT_LAYER_ID, "circle-color", "#ffffff");
      ctx.map.setPaintProperty(ORIGIN_POINT_LAYER_ID, "circle-stroke-color", accent);
      ctx.map.setPaintProperty(ORIGIN_POINT_LAYER_ID, "circle-stroke-width", 2);
      ctx.map.setPaintProperty(ORIGIN_POINT_LAYER_ID, "circle-radius", 5);
    }
  }

  // Wolane przez measure-service.js gdy uzytkownik przelacza
  // zunifikowane narzedzie na tryb "isochrone" - odtwarza warstwy i
  // odswieza podrzedny UI (przyciski pieszo/rower/samochod, select
  // minut), zeby pokazac ostatnio wybrane wartosci.
  function activate() {
    ensureLayers();
    updateBadgeUi();
  }

  // Wolane przez measure-service.js przy wyjsciu z trybu "isochrone"
  // (przelaczenie na inny tryb LUB calkowite wylaczenie narzedzia) -
  // czysci punkt startowy i chowa warstwe obszaru, ale NIE rusza
  // wspolnej plakietki (#travel-tool-badge) - tym zarzadza juz
  // measure-service.js.
  function clear() {
    currentOrigin = null;
    requestToken++;
    setLayersVisible(false);
    setOriginMarker(null);
    if (ctx.el.isochroneStatus) ctx.el.isochroneStatus.hidden = true;
  }

  window.OMAP_ISOCHRONE = {
    configure,
    activate,
    clear,
    addPoint,
    setMode,
    setMinutes,
    applyAccentColor
  };
})();
