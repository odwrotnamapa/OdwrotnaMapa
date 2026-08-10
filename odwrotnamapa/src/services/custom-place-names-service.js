(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - wlasne nazwy miejsc wpisane
  // recznie w panelu informacji, przechowywane lokalnie niezaleznie
  // od ulubionych (favorite.customName dotyczy TYLKO ulubionych
  // miejsc, to pole dziala dla dowolnego miejsca na mapie).
  //
  // Ten sam dwuetapowy configure() co przy Ulubionych/Historii Tras:
  // readCustomPlaceNames jest wolane wewnatrz konstrukcji obiektu
  // state, wiec potrzebuje minimalnego, wczesnego configure z samym
  // CONFIG, PRZED rozpoczeciem budowy state.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }


  // Własne nazwy miejsc wpisane w panelu informacji - przechowywane lokalnie,
  // niezależnie od ulubionych (favorite.customName), bo dotyczą DOWOLNEGO
  // miejsca pokazanego na mapie, nie tylko zapisanych do ulubionych.
  function readCustomPlaceNames() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.customPlaceNames) || "{}"
      );
      return stored && typeof stored === "object" ? stored : {};
    } catch (_) {
      return {};
    }
  }

  function saveCustomPlaceNames() {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.customPlaceNames,
      JSON.stringify(ctx.state.customPlaceNames)
    );
  }

  function setCustomPlaceName(key, rawName, fallbackTitle, headingEl, place, lngLat) {
    window.OMAP_ACCOUNT?.markLocalSyncChange();

    const trimmed = (rawName || "").trim();

    if (!trimmed || trimmed === fallbackTitle) {
      delete ctx.state.customPlaceNames[key];
    } else {
      ctx.state.customPlaceNames[key] = trimmed;
    }

    saveCustomPlaceNames();

    // Synchronizuj z Ulubionymi: jeśli miejsce jest w Ulubionych, zaktualizuj jego customName
    if (place && lngLat) {
      const favoriteKey = window.OMAP_FAVORITES?.getFavoriteKey(place, lngLat);
      const favorite = ctx.state.favorites.find(item => item.key === favoriteKey);
      if (favorite) {
        favorite.customName = ctx.state.customPlaceNames[key] || "";
        window.OMAP_FAVORITES?.saveFavorites();
        window.OMAP_FAVORITES?.renderFavoritesList();
      }
    }

    const displayTitle = ctx.state.customPlaceNames[key] || fallbackTitle;
    if (headingEl) headingEl.textContent = displayTitle;
    document.title = `${displayTitle} - Odwrotna Mapa`;
  }


  window.OMAP_CUSTOM_PLACE_NAMES = {
    configure,
    readCustomPlaceNames,
    saveCustomPlaceNames,
    setCustomPlaceName
  };
})();
