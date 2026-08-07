(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - Historia: lista ostatnio
  // ogladanych miejsc i tras (scalone w jedna liste, jak przy
  // Ulubionych), zapis/odczyt localStorage, otwieranie wpisu z
  // historii.
  //
  // Ten sam dwuetapowy configure() co przy Ulubionych/Historii Tras:
  // readHistory jest wolane wewnatrz konstrukcji obiektu state, wiec
  // potrzebuje minimalnego, wczesnego configure z samym CONFIG,
  // PRZED rozpoczeciem budowy state.
  //
  // openHistoryPlace wola window.OMAP_PLACE_SERVICE.open(...)
  // bezposrednio - ten sam bezpieczny wzorzec co w innych modulach
  // (globalny serwis, dostepny niezaleznie od tego w ktorym pliku
  // kod fizycznie lezy).

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function readHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.history) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.history,
      JSON.stringify(ctx.state.history)
    );
  }
  function openHistoryPlace(entry) {
    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    let payload = entry;
    
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      const customName = ctx.state.customPlaceNames[placeNameKey];
      if (customName) {
        payload = { ...entry, customName, name: customName };
      }
    }
    
    return window.OMAP_PLACE_SERVICE.open(payload, {
      source: "history"
    });
  }

  function clearHistoryList() {
    ctx.state.history = [];
    saveHistory();
    ctx.state.routeHistory = [];
    window.OMAP_ROUTE_HISTORY?.saveRouteHistory();
    renderHistoryList();
  }

  function renderHistoryList() {
    if (!ctx.el.historyList) return;

    const query = ctx.normalizeSearchText(
      ctx.el.historySearch?.value || ""
    );

    const fragment = document.createDocumentFragment();
    const matching = ctx.state.history.filter(entry => {
      if (!query) return true;
      const haystack = ctx.normalizeSearchText(
        [entry.title, entry.address, entry.lat, entry.lon]
          .filter(value => value !== undefined && value !== null)
          .join(" ")
      );
      return haystack.includes(query);
    });

    const matchingRoutes = ctx.filterRouteEntries(ctx.state.routeHistory, ctx.el.historySearch?.value || "");

    ctx.el.historyList
      .querySelectorAll(".favorite-place-item, .route-item")
      .forEach(node => node.remove());

    const hasContent = matching.length > 0 || matchingRoutes.length > 0;
    if (ctx.el.historyEmpty) {
      ctx.el.historyEmpty.hidden = hasContent;
      ctx.el.historyEmpty.textContent = (ctx.state.history.length === 0 && ctx.state.routeHistory.length === 0)
        ? ctx.text[ctx.state.language].historyEmpty
        : ctx.text[ctx.state.language].historyNoMatch;
    }
    if (!hasContent) return;

    const combined = [
      ...matching.map(entry => ({ type: "place", entry })),
      ...matchingRoutes.map(entry => ({ type: "route", entry }))
    ].sort((a, b) => new Date(b.entry.viewedAt || 0) - new Date(a.entry.viewedAt || 0));

    combined.forEach(({ type, entry }) => {
      if (type === "place") {
        const item = document.createElement("div");
        item.className = "favorite-place-item";

        const row = document.createElement("div");
        row.className = "favorite-place-row";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "favorite-place-open";

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "🕘";

        const copy = document.createElement("span");

        const title = document.createElement("strong");
        // Pobierz custom name jeśli istnieje
        const lat = Number(entry.lat);
        const lon = Number(entry.lon);
        let displayTitle = entry.title || (ctx.state.language === "pl" ? "Miejsce" : "Place");
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
          displayTitle = ctx.state.customPlaceNames[placeNameKey] || displayTitle;
        }
        title.textContent = displayTitle;

        const address = document.createElement("small");
        address.textContent =
          entry.address ||
          `${Number(entry.lat).toFixed(5)}, ${Number(entry.lon).toFixed(5)}`;

        copy.append(title, address);
        openButton.append(icon, copy);

        openButton.addEventListener("click", () => {
          openHistoryPlace(entry);
        });

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-place-remove";
        removeButton.textContent = "×";
        removeButton.title = ctx.text[ctx.state.language].historyRemove;
        removeButton.setAttribute(
          "aria-label",
          ctx.text[ctx.state.language].historyRemove
        );

        removeButton.addEventListener("click", () => {
          ctx.state.history = ctx.state.history.filter(
            item => item.key !== entry.key
          );
          saveHistory();
          renderHistoryList();
        });

        const actions = document.createElement("div");
        actions.className = "favorite-place-actions";
        actions.append(removeButton);

        row.append(openButton, actions);
        item.append(row);
        fragment.appendChild(item);
      } else {
        const item = document.createElement("div");
        item.className = "route-item";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "route-item-open";

        const icon = document.createElement("span");
        icon.className = "route-item-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = ctx.ROUTE_MODE_ICONS[entry.mode] || "🧭";

        const copy = document.createElement("span");
        copy.className = "route-item-copy";

        const title = document.createElement("strong");
        title.textContent = entry.customName ||
          `${entry.fromLabel || "?"} → ${entry.toLabel || "?"}`;

        const summary = document.createElement("small");
        summary.textContent = ctx.formatRouteSummaryShort(entry.distance, entry.duration);

        copy.append(title, summary);
        openButton.append(icon, copy);
        openButton.addEventListener("click", () => ctx.loadRouteFromEntry(entry));

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-place-remove";
        removeButton.textContent = "×";
        removeButton.title = ctx.text[ctx.state.language].historyRemove;
        removeButton.setAttribute("aria-label", ctx.text[ctx.state.language].historyRemove);
        removeButton.addEventListener("click", () => {
          ctx.state.routeHistory = ctx.state.routeHistory.filter(r => r.key !== entry.key);
          window.OMAP_ROUTE_HISTORY?.saveRouteHistory();
          renderHistoryList();
        });

        const routeRow = document.createElement("div");
        routeRow.className = "route-item-row";
        routeRow.append(openButton, removeButton);

        item.append(routeRow);
        fragment.appendChild(item);
      }
    });

    ctx.el.historyList.appendChild(fragment);
  }

  window.OMAP_HISTORY = {
    configure,
    readHistory,
    saveHistory,
    clearHistoryList,
    renderHistoryList,
    openHistoryPlace
  };
})();
