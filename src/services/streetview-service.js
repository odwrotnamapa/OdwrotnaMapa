(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - warstwa pokrycia Mapillary
  // (zdjęcia poziomu ulicy) i panel przeglądarki streetview: włączanie
  // warstwy na mapie, otwieranie/zamykanie widoku, tryb pełnoekranowy.
  // Ten sam wzorzec configure() co pozostałe wyniesione moduły.
  //
  // Trzy funkcje są w app.js podpięte jako REFERENCJE do
  // addEventListener/obiektów konfiguracyjnych, nie wołane wprost -
  // eksportowane tu (close, toggleFullscreen, toggleCoverage) muszą
  // więc być bezpośrednio przypisanymi referencjami do funkcji.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function mapillaryTilesUrl() {
    // Kafelki pokrycia idą przez proxy Workera (token dokleja Worker
    // po swojej stronie) - patrz config.js `proxy.baseUrl` i
    // cloudflare-sync-worker/sync-worker.js.
    const base = ctx.CONFIG.proxy?.baseUrl;
    return base ? `${base}/mapillary/tiles/{z}/{x}/{y}` : null;
  }

  function ensureMapillaryCoverage() {
    const tilesUrl = mapillaryTilesUrl();
    if (!tilesUrl) return false;
    if (ctx.map.getSource(ctx.CONFIG.mapillary.sourceId)) return true;

    ctx.map.addSource(ctx.CONFIG.mapillary.sourceId, {
      type: "vector",
      tiles: [tilesUrl],
      minzoom: 6,
      maxzoom: 14
    });

    ctx.map.addLayer({
      id: ctx.CONFIG.mapillary.coverageLayerId,
      type: "circle",
      source: ctx.CONFIG.mapillary.sourceId,
      "source-layer": "image",
      minzoom: ctx.CONFIG.mapillary.minZoom,
      layout: { visibility: "none" },
      paint: {
        "circle-radius": 4,
        "circle-color": "#00c37a",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#ffffff"
      }
    });

    ctx.map.on("click", ctx.CONFIG.mapillary.coverageLayerId, event => {
      const feature = event.features?.[0];
      const imageId = feature?.properties?.id;
      if (imageId) openStreetView(imageId);
    });

    ctx.map.on("mouseenter", ctx.CONFIG.mapillary.coverageLayerId, () => {
      ctx.map.getCanvas().style.cursor = "pointer";
    });
    ctx.map.on("mouseleave", ctx.CONFIG.mapillary.coverageLayerId, () => {
      ctx.map.getCanvas().style.cursor = "";
    });

    return true;
  }

  function toggleMapillaryCoverage() {
    const t = ctx.text[ctx.state.language];

    if (!mapillaryTilesUrl()) {
      show(t.streetviewUnavailable);
      return;
    }

    if (!ensureMapillaryCoverage()) return;

    ctx.state.mapillaryCoverageVisible = !ctx.state.mapillaryCoverageVisible;

    ctx.map.setLayoutProperty(
      ctx.CONFIG.mapillary.coverageLayerId,
      "visibility",
      ctx.state.mapillaryCoverageVisible ? "visible" : "none"
    );

    ctx.el.menuStreetviewButton?.classList.toggle(
      "is-active",
      ctx.state.mapillaryCoverageVisible
    );
    ctx.el.menuStreetviewButton?.setAttribute(
      "aria-pressed",
      String(ctx.state.mapillaryCoverageVisible)
    );
  }

  let mapillaryViewer = null;

  function createMapillaryViewer(imageId) {
    return new Promise(resolve => {
      // Tworzenie odtwarzacza WebGL w kontenerze, który jeszcze nie
      // ma prawdziwych wymiarów (bo panel dopiero co się odkrył),
      // kończy się niedziałającym odtwarzaczem. Czekamy na dwie
      // klatki, żeby przeglądarka zdążyła nadać kontenerowi
      // rzeczywisty rozmiar, zanim go zainicjujemy.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          mapillaryViewer = new mapillary.Viewer({
            accessToken: ctx.CONFIG.mapillary.accessToken,
            container: ctx.el.streetviewContainer,
            imageId
          });
          mapillaryViewer.resize();
          resolve();
        });
      });
    });
  }

  async function openStreetView(imageId) {
    if (!ctx.CONFIG.mapillary?.accessToken || !ctx.el.streetviewPanel) return;

    ctx.closeOtherMobilePanels(["streetview"]);

    if (ctx.isMobilePanelViewport()) {
      ctx.setMobilePanelHeight(
        ctx.el.streetviewPanel,
        "--sheet-height",
        ctx.getMobilePanelMaximumHeight(),
        { collapsed: false, mode: "expanded", animate: false }
      );
      ctx.el.streetviewPanel.classList.remove("is-collapsed");
    }
    ctx.el.streetviewPanel.hidden = false;
    ctx.el.streetviewPanel.scrollTop = 0;

    if (!mapillaryViewer) {
      await createMapillaryViewer(imageId);
      return;
    }

    try {
      await mapillaryViewer.moveTo(imageId);
    } catch (error) {
      console.error(error);
      // Odtwarzacz utknął w niedziałającym stanie - usuwamy go
      // i tworzymy od nowa, zamiast dalej próbować na zepsutej
      // instancji.
      try {
        mapillaryViewer.remove();
      } catch (removeError) {
        console.error(removeError);
      }
      mapillaryViewer = null;
      await createMapillaryViewer(imageId);
    }
  }

  function isStreetviewFullscreen() {
    return document.fullscreenElement === ctx.el.streetviewPanel;
  }

  async function toggleStreetviewFullscreen() {
    if (!ctx.el.streetviewPanel) return;

    try {
      if (isStreetviewFullscreen()) {
        await document.exitFullscreen();
      } else {
        await ctx.el.streetviewPanel.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener("fullscreenchange", () => {
    if (!ctx) return;
    const active = isStreetviewFullscreen();
    ctx.el.streetviewFullscreenButton?.classList.toggle(
      "is-active",
      active
    );
    ctx.el.streetviewFullscreenButton?.setAttribute(
      "aria-pressed",
      String(active)
    );
    ctx.el.streetviewPanel?.classList.toggle(
      "is-fullscreen",
      active
    );
    // WebGL potrzebuje jawnej informacji o zmianie rozmiaru
    // kontenera po wejściu/wyjściu z pełnego ekranu.
    requestAnimationFrame(() => {
      try {
        mapillaryViewer?.resize();
      } catch (error) {
        console.error(error);
      }
    });
  });

  function closeStreetView() {
    if (!ctx.el.streetviewPanel || ctx.el.streetviewPanel.hidden) return;
    if (isStreetviewFullscreen()) {
      document.exitFullscreen().catch(error => console.error(error));
    }
    ctx.el.streetviewPanel.hidden = true;
  }

  window.OMAP_STREETVIEW = {
    configure,
    close: closeStreetView,
    toggleFullscreen: toggleStreetviewFullscreen,
    toggleCoverage: toggleMapillaryCoverage
  };
})();
