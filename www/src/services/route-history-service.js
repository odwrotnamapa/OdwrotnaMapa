(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - trwałość historii i
  // ulubionych tras (zapis/odczyt localStorage, klucz trasy,
  // zapisywanie w historii). NIE zawiera obliczania/rysowania tras
  // (to zostaje w app.js - dużo większy, ściślej spleciony system).
  //
  // Ten sam dwuetapowy configure() co przy Ulubionych:
  // readRouteHistory/readRouteFavorites są wołane WEWNĄTRZ
  // konstrukcji obiektu state (jako wartości pól), więc potrzebują
  // minimalnego, wczesnego configure z samym CONFIG, PRZED
  // rozpoczęciem budowy state, zanim state w ogóle istnieje.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function readRouteHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.routeHistory) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveRouteHistory() {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.routeHistory,
      JSON.stringify(ctx.state.routeHistory)
    );
  }

  function readRouteFavorites() {
    try {
      const value = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.routeFavorites) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveRouteFavorites() {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.routeFavorites,
      JSON.stringify(ctx.state.routeFavorites)
    );
  }

  function buildRouteKey(pointA, pointB, mode) {
    return `${Number(pointA.lat).toFixed(5)},${Number(pointA.lon).toFixed(5)}` +
      `->${Number(pointB.lat).toFixed(5)},${Number(pointB.lon).toFixed(5)}:${mode}`;
  }

  function recordRouteHistory(pointA, pointB, mode, distance, duration) {
    if (!pointA || !pointB) return;

    const key = buildRouteKey(pointA, pointB, mode);
    const entry = {
      key,
      fromLabel: pointA.label || "",
      toLabel: pointB.label || "",
      fromLat: Number(pointA.lat),
      fromLon: Number(pointA.lon),
      toLat: Number(pointB.lat),
      toLon: Number(pointB.lon),
      mode,
      distance: Number(distance) || 0,
      duration: Number(duration) || 0,
      viewedAt: new Date().toISOString()
    };

    ctx.state.routeHistory = [
      entry,
      ...ctx.state.routeHistory.filter(item => item.key !== key)
    ].slice(0, ctx.ROUTE_HISTORY_LIMIT);

    saveRouteHistory();

    if (!ctx.el.historyPanel?.hidden) {
      ctx.renderHistoryList();
    }
  }


  window.OMAP_ROUTE_HISTORY = {
    configure,
    readRouteHistory,
    saveRouteHistory,
    readRouteFavorites,
    saveRouteFavorites,
    buildRouteKey,
    recordRouteHistory
  };
})();
