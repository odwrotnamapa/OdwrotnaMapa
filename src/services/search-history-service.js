(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - historia wyszukiwan
  // (osobna od Historii ogladanych miejsc/tras) - zapis/odczyt/
  // usuwanie z localStorage, ostatnie 8 wpisow.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function getSearchHistory() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.searchHistory) || "[]"
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

    const normalized = ctx.normalizeSearchText(entry.label);
    const history = getSearchHistory().filter(
      item => ctx.normalizeSearchText(item.label) !== normalized
    );

    history.unshift({
      label: entry.label,
      displayName: entry.displayName || entry.label,
      lon: Number(entry.lon),
      lat: Number(entry.lat),
      osm_type: entry.osm_type || "",
      osm_id: entry.osm_id || "",
      namedPoiId: entry.namedPoiId || "",
      provider: entry.provider || "",
      providers: entry.providers || [],
      source: entry.source || "",
      exactLocalIdentity: Boolean(
        entry._exactLocalIdentity ||
        entry.exactLocalIdentity
      ),
      name: entry.name || entry.label,
      aliases: entry.aliases || [],
      keywords: entry.keywords || [],
      type: entry.type || "",
      category: entry.category || "",
      class: entry.class || "",
      address: entry.address || {},
      extratags: entry.extratags || {},
      savedAt: Date.now()
    });

    localStorage.setItem(
      ctx.CONFIG.storageKeys.searchHistory,
      JSON.stringify(history.slice(0, 8))
    );
  }

  function clearSearchHistory() {
    localStorage.removeItem(ctx.CONFIG.storageKeys.searchHistory);
  }

  window.OMAP_SEARCH_HISTORY = {
    configure,
    getSearchHistory,
    saveSearchHistoryEntry,
    clearSearchHistory
  };
})();
