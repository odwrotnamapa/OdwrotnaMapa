(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - Ulubione: lista (miejsca +
  // trasy scalone w jedną, wspólną listę), foldery, przeciąganie
  // między folderami, panel UI. Zależności: 17 funkcji z app.js +
  // 2 stałe (UNFILED_FOLDER, ROUTE_MODE_ICONS - obie już
  // zadeklarowane wcześnie, bez ryzyka TDZ).
  //
  // WAŻNE: centralny mechanizm otwierania miejsc
  // (window.OMAP_PLACE_SERVICE.configure) fizycznie leżał
  // WEWNĄTRZ tego samego obszaru pliku co Ulubione, ale to NIE jest
  // funkcja Ulubionych - obsługuje otwieranie miejsc z Odkrywaj,
  // Historii, Wyszukiwarki, informacji o mapie, nie tylko z
  // ulubionych. Świadomie WYCIĘTY z zakresu tej ekstrakcji i
  // zostawiony w app.js, żeby nie złamać otwierania miejsc z innych
  // źródeł.
  //
  // getFavoriteKey ZOSTAJE tu wyeksportowane, mimo że jest używane
  // też w app.js (karta miejsca) i w ratings-service.js -
  // app.js/ratings-service teraz odwołują się do
  // window.OMAP_FAVORITES.getFavoriteKey zamiast bezpośrednio.
  // getPlaceNameKey (osobna funkcja niestandardowego nazewnictwa
  // miejsc) ZOSTAJE w app.js, tylko jej wewnętrzny fallback na
  // getFavoriteKey idzie teraz przez window.OMAP_FAVORITES.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function createFavoriteFolder() {
    const name = (ctx.el.favoritesNewFolderInput?.value || "").trim();
    if (!name) return;
    const exists = ctx.state.favoriteFolders.some(
      f => f.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      ctx.state.favoriteFolders.push(name);
      saveFavoriteFolders();
    }
    ctx.state.activeFavoriteFolder = name;
    if (ctx.el.favoritesNewFolderForm) ctx.el.favoritesNewFolderForm.hidden = true;
    renderFolderChips();
    renderFavoritesList();
  }
  function getMatchingFavoritePlaces(query, limit = 5) {
    const q = ctx.normalizeSearchText(query);
    if (!q) return [];

    return ctx.state.favorites
      .filter(favorite => {
        const haystack = ctx.normalizeSearchText(
          [favorite.customName, favorite.title, favorite.address]
            .filter(Boolean)
            .join(" ")
        );
        return haystack.includes(q);
      })
      .slice(0, limit)
      .map(favorite => ({
        ...favorite,
        name: favorite.customName || favorite.name || favorite.title,
        __isFavorite: true
      }));
  }

  // Współdzielona logika sortowania dla ulubionych miejsc i tras.
  // "newest"/"oldest" opiera się na kolejności w tablicy - nowe
  // wpisy są zawsze dokładane na początek (unshift), więc naturalna
  // kolejność tablicy JUŻ jest "od najnowszych" bez potrzeby
  // osobnego pola z datą.
  async function addContextPointToFavorites(lngLat) {
    if (!lngLat) return;

    ctx.show(ctx.text[ctx.state.language].placeLoading, 0);

    try {
      const place = await ctx.fetchPlaceInformation(
        lngLat.lng,
        lngLat.lat
      );

      const key = getFavoriteKey(place, lngLat);
      const nowFavorite = toggleFavorite(
        key,
        place,
        lngLat
      );

      ctx.show(
        nowFavorite
          ? ctx.text[ctx.state.language].contextFavoriteAdded
          : ctx.text[ctx.state.language].contextFavoriteRemoved
      );
    } catch (error) {
      console.error(error);
      ctx.show(ctx.text[ctx.state.language].placeError);
    }
  }

  function readFavorites() {
    try {
      const value = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.favorites) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function readFavoriteFolders() {
    try {
      const value = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.favoriteFolders) || "[]"
      );
      return Array.isArray(value) ? value.filter(v => typeof v === "string" && v.trim()) : [];
    } catch (_) {
      return [];
    }
  }

  function saveFavoriteFolders() {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.favoriteFolders,
      JSON.stringify(ctx.state.favoriteFolders)
    );
  }

  function getFavoriteKey(place, lngLat) {
    const osmKey =
      place.osm_type && place.osm_id
        ? `${place.osm_type}:${place.osm_id}`
        : "";

    return osmKey ||
      `${Number(lngLat.lat).toFixed(6)},${Number(lngLat.lng).toFixed(6)}`;
  }

  function isFavorite(key) {
    return ctx.state.favorites.some(item => item.key === key);
  }

  function toggleFavorite(key, place, lngLat) {
    const index = ctx.state.favorites.findIndex(
      item => item.key === key
    );

    if (index >= 0) {
      ctx.state.favorites.splice(index, 1);
      saveFavorites();
      renderFavoritesList();
      return false;
    }

    const placeNameKey = ctx.getPlaceNameKey(place, lngLat);
    const customName = ctx.state.customPlaceNames[placeNameKey] || "";

    ctx.state.favorites.unshift({
      key,
      savedAt: new Date().toISOString(),
      title: ctx.getPlaceTitle(place),
      address: ctx.getPlaceAddress(place),
      lat: Number(lngLat.lat),
      lon: Number(lngLat.lng),
      name: place.name || ctx.getPlaceTitle(place),
      display_name:
        place.display_name ||
        ctx.getPlaceAddress(place),
      osm_type: place.osm_type || "",
      osm_id: place.osm_id || "",
      namedPoiId: place.namedPoiId || "",
      provider: place.provider || "",
      providers: place.providers || [],
      source: place.source || "",
      exactLocalIdentity: Boolean(
        place._exactLocalIdentity ||
        place.exactLocalIdentity
      ),
      aliases: place.aliases || [],
      keywords: place.keywords || [],
      type: place.type || "",
      category: place.category || "",
      class: place.class || "",
      addressDetails: {
        ...(place.address || {})
      },
      extratags: {
        ...(place.extratags || {})
      },
      namedetails: {
        ...(place.namedetails || {})
      },
      customName: customName
    });

    ctx.state.favorites = ctx.state.favorites.slice(0, 100);
    saveFavorites();
    renderFavoritesList();

    ctx.cacheWikipediaForFavorite(key, place);

    return true;
  }

  function openFavoritesPanel() {
    ctx.closeMapContextMenu();
    ctx.closeOtherMobilePanels("favorites");

    ctx.openMobilePanelStandard(
      ctx.el.favoritesPanel,
      "--sheet-height"
    );
    ctx.el.favoritesSearch.value = "";
    renderFavoritesList();
  }

  function closeFavoritesPanel() {
    if (!ctx.el.favoritesPanel || ctx.el.favoritesPanel.hidden) return;
    ctx.el.favoritesPanel.hidden = true;
  }


  async function openFavoritePlace(favorite) {
    const payload = favorite.customName
      ? { ...favorite, name: favorite.customName, title: favorite.customName }
      : favorite;

    return window.OMAP_PLACE_SERVICE.open(
      payload,
      {
        source: "favorite",
        metadata: {
          origin: "favorites-panel"
        }
      }
    );
  }


  function moveFavoriteToFolder(key, folderValue) {
    const favorite = ctx.state.favorites.find(item => item.key === key);
    if (favorite) {
      updateFavoriteDetails(key, {
        customName: favorite.customName || "",
        note: favorite.note || "",
        folder: folderValue
      });
      return;
    }

    const route = ctx.state.routeFavorites.find(item => item.key === key);
    if (route) {
      route.folder = folderValue;
      ctx.saveRouteFavorites();
      renderFolderChips();
      renderFavoritesList();
    }
  }

  function attachFolderDropTarget(node, folderValue) {
    node.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      node.classList.add("is-drag-over");
    });
    node.addEventListener("dragleave", () => {
      node.classList.remove("is-drag-over");
    });
    node.addEventListener("drop", event => {
      event.preventDefault();
      node.classList.remove("is-drag-over");
      const key = event.dataTransfer.getData("text/plain");
      if (key) moveFavoriteToFolder(key, folderValue);
    });
  }

  function renderFolderChips() {
    if (!ctx.el.favoritesFolderChips) return;
    const t = ctx.text[ctx.state.language];
    ctx.el.favoritesFolderChips.innerHTML = "";

    const makeChip = (value, label, isDropTarget) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "favorites-folder-chip";
      chip.classList.toggle("is-active", ctx.state.activeFavoriteFolder === value);
      chip.textContent = label;
      chip.addEventListener("click", () => {
        ctx.state.activeFavoriteFolder = value;
        renderFolderChips();
        renderFavoritesList();
      });
      if (isDropTarget) {
        attachFolderDropTarget(chip, value === ctx.UNFILED_FOLDER ? "" : value);
      }
      ctx.el.favoritesFolderChips.appendChild(chip);
    };

    makeChip("", t.favoriteFolderAll);
    makeChip(ctx.UNFILED_FOLDER, t.favoriteFolderUnfiled, true);
    ctx.state.favoriteFolders.forEach(folder => makeChip(folder, folder, true));
  }

  function deleteFavoriteFolder(folder) {
    ctx.state.favoriteFolders = ctx.state.favoriteFolders.filter(f => f !== folder);
    saveFavoriteFolders();

    let changed = false;
    ctx.state.favorites.forEach(favorite => {
      if (favorite.folder === folder) {
        favorite.folder = "";
        changed = true;
      }
    });
    if (changed) saveFavorites();

    let routesChanged = false;
    ctx.state.routeFavorites.forEach(route => {
      if (route.folder === folder) {
        route.folder = "";
        routesChanged = true;
      }
    });
    if (routesChanged) ctx.saveRouteFavorites();

    if (ctx.state.activeFavoriteFolder === folder) ctx.state.activeFavoriteFolder = "";
    if (ctx.state.activeRouteFolder === folder) ctx.state.activeRouteFolder = "";
    renderFolderChips();
    renderFavoritesList();
  }

  function renameFavoriteFolder(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    const collision = ctx.state.favoriteFolders.some(
      f => f !== oldName && f.toLowerCase() === trimmed.toLowerCase()
    );
    if (collision) return;

    ctx.state.favoriteFolders = ctx.state.favoriteFolders.map(f => (f === oldName ? trimmed : f));
    saveFavoriteFolders();

    let changed = false;
    ctx.state.favorites.forEach(favorite => {
      if (favorite.folder === oldName) {
        favorite.folder = trimmed;
        changed = true;
      }
    });
    if (changed) saveFavorites();

    let routesChanged = false;
    ctx.state.routeFavorites.forEach(route => {
      if (route.folder === oldName) {
        route.folder = trimmed;
        routesChanged = true;
      }
    });
    if (routesChanged) ctx.saveRouteFavorites();

    if (ctx.state.activeFavoriteFolder === oldName) ctx.state.activeFavoriteFolder = trimmed;
    if (ctx.state.activeRouteFolder === oldName) ctx.state.activeRouteFolder = trimmed;
    renderFolderChips();
    renderFavoritesList();
  }

  function renderFavoritesList() {
    if (
      !ctx.el.favoritesList ||
      !ctx.el.favoritesEmpty ||
      !ctx.el.favoritesCount
    ) {
      return;
    }

    ctx.el.favoritesList
      .querySelectorAll(".favorite-place-item, .route-item, .favorite-folder-row, .favorite-folder-back-row")
      .forEach(item => item.remove());

    const query = ctx.normalizeSearchText(
      ctx.el.favoritesSearch?.value || ""
    );

    const activeFolder = ctx.state.activeFavoriteFolder || "";
    const t = ctx.text[ctx.state.language];

    const filteredFavorites = (
      Array.isArray(ctx.state.favorites)
        ? ctx.state.favorites
        : []
    ).filter(favorite => {
      if (activeFolder === ctx.UNFILED_FOLDER && favorite.folder) return false;
      if (activeFolder && activeFolder !== ctx.UNFILED_FOLDER && favorite.folder !== activeFolder) return false;

      if (!query) return true;

      const haystack = ctx.normalizeSearchText(
        [
          favorite.title,
          favorite.address,
          favorite.customName,
          favorite.note,
          favorite.folder,
          favorite.lat,
          favorite.lon
        ]
          .filter(value => value !== undefined && value !== null)
          .join(" ")
      );

      return haystack.includes(query);
    });

    const favorites = ctx.sortByOrder(
      filteredFavorites,
      ctx.state.favoritesSortOrder,
      f => (f.customName || f.title || "").toLowerCase()
    );

    let filteredRoutes = ctx.filterRouteEntries(ctx.state.routeFavorites, ctx.el.favoritesSearch?.value || "");
    if (activeFolder === ctx.UNFILED_FOLDER) {
      filteredRoutes = filteredRoutes.filter(r => !r.folder);
    } else if (activeFolder) {
      filteredRoutes = filteredRoutes.filter(r => r.folder === activeFolder);
    }
    const routes = ctx.sortByOrder(
      filteredRoutes,
      ctx.state.favoritesSortOrder,
      r => (r.customName || `${r.fromLabel || ""} ${r.toLabel || ""}`).toLowerCase()
    );

    ctx.el.favoritesCount.textContent =
      String(ctx.state.favorites.length + ctx.state.routeFavorites.length);

    // Widoczne foldery (jako klikalne wiersze) liczymy niezależnie od
    // wyszukiwania tekstowego - pusty, dopiero co utworzony folder ma
    // się dać zobaczyć i "wejść w niego", zanim cokolwiek do niego
    // trafi, zamiast znikać z listy aż coś w nim wyląduje.
    const showFolderRows = !query && !activeFolder;
    const hasAny = ctx.state.favorites.length > 0 || ctx.state.routeFavorites.length > 0 ||
      (showFolderRows && ctx.state.favoriteFolders.length > 0);
    const hasMatches = favorites.length > 0 || routes.length > 0 || showFolderRows;

    ctx.el.favoritesEmpty.hidden = hasMatches;
    ctx.el.favoritesEmpty.textContent = hasAny
      ? ctx.text[ctx.state.language].favoritesNoMatch
      : ctx.text[ctx.state.language].favoritesEmpty;

    if (!hasMatches) return;

    const fragment = document.createDocumentFragment();

    if (showFolderRows) {
      ctx.state.favoriteFolders.forEach(folder => {
        const count = ctx.state.favorites.filter(f => f.folder === folder).length +
          ctx.state.routeFavorites.filter(r => r.folder === folder).length;
        const row = document.createElement("div");
        row.className = "favorite-folder-row";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "favorite-folder-row-open";

        const icon = document.createElement("span");
        icon.className = "favorite-folder-row-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "📁";

        const name = document.createElement("span");
        name.className = "favorite-folder-row-name";
        name.textContent = folder;

        const countEl = document.createElement("span");
        countEl.className = "favorite-folder-row-count";
        countEl.textContent = String(count);

        openButton.append(icon, name, countEl);
        openButton.addEventListener("click", () => {
          ctx.state.activeFavoriteFolder = folder;
          renderFolderChips();
          renderFavoritesList();
        });

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "favorite-place-edit-toggle";
        editButton.textContent = "✎";
        editButton.title = ctx.text[ctx.state.language].favoriteEdit;
        editButton.setAttribute("aria-label", ctx.text[ctx.state.language].favoriteEdit);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-place-remove";
        removeButton.textContent = "×";
        removeButton.title = t.favoriteFolderDelete;
        removeButton.setAttribute("aria-label", t.favoriteFolderDelete);
        removeButton.addEventListener("click", () => deleteFavoriteFolder(folder));

        const actions = document.createElement("div");
        actions.className = "favorite-place-actions";
        actions.append(editButton, removeButton);

        const topRow = document.createElement("div");
        topRow.className = "favorite-place-row";
        topRow.append(openButton, actions);

        const renameForm = document.createElement("div");
        renameForm.className = "account-name-edit-form";
        renameForm.hidden = true;

        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.className = "account-name-edit-input";
        renameInput.maxLength = 30;
        renameInput.value = folder;

        const renameActions = document.createElement("div");
        renameActions.className = "account-name-edit-actions";

        const renameSave = document.createElement("button");
        renameSave.type = "button";
        renameSave.className = "account-name-edit-save";
        renameSave.textContent = ctx.text[ctx.state.language].favoriteSave;
        renameSave.addEventListener("click", () => {
          renameFavoriteFolder(folder, renameInput.value);
        });

        const renameCancel = document.createElement("button");
        renameCancel.type = "button";
        renameCancel.className = "account-name-edit-cancel";
        renameCancel.textContent = ctx.text[ctx.state.language].favoriteCancelEdit;
        renameCancel.addEventListener("click", () => {
          renameForm.hidden = true;
        });

        renameActions.append(renameSave, renameCancel);
        renameForm.append(renameInput, renameActions);

        editButton.addEventListener("click", () => {
          renameForm.hidden = !renameForm.hidden;
          if (!renameForm.hidden) {
            renameInput.value = folder;
            renameInput.focus();
            renameInput.select();
          }
        });

        row.append(topRow, renameForm);
        attachFolderDropTarget(row, folder);

        fragment.appendChild(row);
      });
    } else if (activeFolder) {
      const backRow = document.createElement("button");
      backRow.type = "button";
      backRow.className = "favorite-folder-back-row";
      backRow.textContent = `← ${t.favoriteFolderAll}`;
      backRow.addEventListener("click", () => {
        ctx.state.activeFavoriteFolder = "";
        renderFolderChips();
        renderFavoritesList();
      });
      attachFolderDropTarget(backRow, "");
      fragment.appendChild(backRow);
    }

    // Miejsca bez folderu pokazujemy bezpośrednio na liście głównej
    // (nie jako osobny folder do "wejścia") - żeby nie trzeba było
    // klikać nigdzie, aby zobaczyć zwykłe, nieposegregowane ulubione.
    const visibleFavorites = showFolderRows
      ? favorites.filter(favorite => !favorite.folder)
      : favorites;

    visibleFavorites.forEach(favorite => {
        const item = document.createElement("div");
        item.className = "favorite-place-item";
        item.draggable = true;

        item.addEventListener("dragstart", event => {
          event.dataTransfer.setData("text/plain", favorite.key);
          event.dataTransfer.effectAllowed = "move";
          item.classList.add("is-dragging");
        });
        item.addEventListener("dragend", () => {
          item.classList.remove("is-dragging");
        });

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "favorite-place-open";

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "⭐";

        const copy = document.createElement("span");

        const title = document.createElement("strong");
        title.textContent =
          favorite.customName ||
          favorite.title ||
          (ctx.state.language === "pl"
            ? "Ulubione miejsce"
            : "Favorite place");

        const address = document.createElement("small");
        address.textContent =
          favorite.address ||
          `${Number(favorite.lat).toFixed(5)}, ${Number(favorite.lon).toFixed(5)}`;

        copy.append(title, address);

        if (favorite.note) {
          const note = document.createElement("small");
          note.className = "favorite-place-note";
          note.textContent = favorite.note;
          copy.append(note);
        }

        openButton.append(icon, copy);

        openButton.addEventListener(
          "click",
          () => {
            openFavoritePlace(favorite);

            // Panel Ulubione celowo pozostaje otwarty.
          }
        );

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "favorite-place-edit-toggle";
        editButton.textContent = "✎";
        editButton.title = ctx.text[ctx.state.language].favoriteEdit;
        editButton.setAttribute("aria-label", ctx.text[ctx.state.language].favoriteEdit);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-place-remove";
        removeButton.textContent = "×";
        removeButton.title =
          ctx.state.language === "pl"
            ? "Usuń z ulubionych"
            : "Remove from favorites";
        removeButton.setAttribute(
          "aria-label",
          removeButton.title
        );

        removeButton.addEventListener("click", () => {
          ctx.state.favorites = ctx.state.favorites.filter(
            entry => entry.key !== favorite.key
          );

          saveFavorites();
          renderFolderChips();
          renderFavoritesList();
        });

        const editForm = document.createElement("div");
        editForm.className = "favorite-place-edit-form";
        editForm.hidden = true;

        const nameLabel = document.createElement("label");
        nameLabel.textContent = ctx.text[ctx.state.language].favoriteCustomNameLabel;
        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.placeholder = ctx.text[ctx.state.language].favoriteCustomNamePlaceholder;
        nameInput.value = favorite.customName || "";
        nameLabel.append(nameInput);

        const noteLabel = document.createElement("label");
        noteLabel.textContent = ctx.text[ctx.state.language].favoriteNoteLabel;
        const noteInput = document.createElement("textarea");
        noteInput.rows = 2;
        noteInput.placeholder = ctx.text[ctx.state.language].favoriteNotePlaceholder;
        noteInput.value = favorite.note || "";
        noteLabel.append(noteInput);

        const folderLabel = document.createElement("label");
        folderLabel.textContent = t.favoriteFolderLabel;
        const folderSelect = document.createElement("select");
        folderSelect.className = "favorite-folder-select";
        const unfiledOption = document.createElement("option");
        unfiledOption.value = "";
        unfiledOption.textContent = t.favoriteFolderUnfiled;
        folderSelect.appendChild(unfiledOption);
        ctx.state.favoriteFolders.forEach(folderName => {
          const option = document.createElement("option");
          option.value = folderName;
          option.textContent = folderName;
          folderSelect.appendChild(option);
        });
        folderSelect.value = favorite.folder || "";
        folderLabel.append(folderSelect);

        const editActions = document.createElement("div");
        editActions.className = "favorite-place-edit-actions";

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = "favorite-place-edit-save";
        saveButton.textContent = ctx.text[ctx.state.language].favoriteSave;
        saveButton.addEventListener("click", () => {
          updateFavoriteDetails(favorite.key, {
            customName: nameInput.value,
            note: noteInput.value,
            folder: folderSelect.value
          });
          renderFolderChips();
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "favorite-place-edit-cancel";
        cancelButton.textContent = ctx.text[ctx.state.language].favoriteCancelEdit;
        cancelButton.addEventListener("click", () => {
          editForm.hidden = true;
        });

        editActions.append(saveButton, cancelButton);
        editForm.append(nameLabel, noteLabel, folderLabel, editActions);

        editButton.addEventListener("click", () => {
          editForm.hidden = !editForm.hidden;
        });

        const actions = document.createElement("div");
        actions.className = "favorite-place-actions";
        actions.append(editButton, removeButton);

        const row = document.createElement("div");
        row.className = "favorite-place-row";
        row.append(openButton, actions);

        item.append(row, editForm);
        fragment.appendChild(item);
    });

    const visibleRoutes = showFolderRows
      ? routes.filter(r => !r.folder)
      : routes;

    visibleRoutes.forEach(entry => {
      const item = document.createElement("div");
      item.className = "route-item";
      item.draggable = true;
      item.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", entry.key);
        event.dataTransfer.effectAllowed = "move";
        item.classList.add("is-dragging");
      });
      item.addEventListener("dragend", () => item.classList.remove("is-dragging"));

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

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "favorite-place-edit-toggle";
      editButton.textContent = "✎";
      editButton.title = t.favoriteEdit;
      editButton.setAttribute("aria-label", t.favoriteEdit);

      const routeEditForm = document.createElement("div");
      routeEditForm.className = "favorite-place-edit-form";
      routeEditForm.hidden = true;

      const routeNameLabel = document.createElement("label");
      routeNameLabel.textContent = t.favoriteCustomNameLabel;
      const routeNameInput = document.createElement("input");
      routeNameInput.type = "text";
      routeNameInput.placeholder = t.favoriteCustomNamePlaceholder;
      routeNameInput.value = entry.customName || "";
      routeNameLabel.append(routeNameInput);

      const routeFolderLabel = document.createElement("label");
      routeFolderLabel.textContent = t.favoriteFolderLabel;
      const routeFolderSelect = document.createElement("select");
      routeFolderSelect.className = "favorite-folder-select";
      const routeUnfiledOption = document.createElement("option");
      routeUnfiledOption.value = "";
      routeUnfiledOption.textContent = t.favoriteFolderUnfiled;
      routeFolderSelect.appendChild(routeUnfiledOption);
      ctx.state.favoriteFolders.forEach(folderName => {
        const option = document.createElement("option");
        option.value = folderName;
        option.textContent = folderName;
        routeFolderSelect.appendChild(option);
      });
      routeFolderSelect.value = entry.folder || "";
      routeFolderLabel.append(routeFolderSelect);

      const routeEditActions = document.createElement("div");
      routeEditActions.className = "favorite-place-edit-actions";
      const routeSaveButton = document.createElement("button");
      routeSaveButton.type = "button";
      routeSaveButton.className = "favorite-place-edit-save";
      routeSaveButton.textContent = t.favoriteSave;
      routeSaveButton.addEventListener("click", () => {
        entry.customName = (routeNameInput.value || "").trim();
        entry.folder = routeFolderSelect.value || "";
        ctx.saveRouteFavorites();
        renderFolderChips();
        renderFavoritesList();
      });
      const routeCancelButton = document.createElement("button");
      routeCancelButton.type = "button";
      routeCancelButton.className = "favorite-place-edit-cancel";
      routeCancelButton.textContent = t.favoriteCancelEdit;
      routeCancelButton.addEventListener("click", () => { routeEditForm.hidden = true; });
      routeEditActions.append(routeSaveButton, routeCancelButton);
      routeEditForm.append(routeNameLabel, routeFolderLabel, routeEditActions);
      editButton.addEventListener("click", () => { routeEditForm.hidden = !routeEditForm.hidden; });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "favorite-place-remove";
      removeButton.textContent = "×";
      removeButton.title = t.favoriteRemove || "×";
      removeButton.setAttribute("aria-label", removeButton.title);
      removeButton.addEventListener("click", () => {
        ctx.state.routeFavorites = ctx.state.routeFavorites.filter(r => r.key !== entry.key);
        ctx.saveRouteFavorites();
        renderFolderChips();
        renderFavoritesList();
        ctx.updateRouteSaveFavoriteButton();
      });

      const actions = document.createElement("div");
      actions.className = "favorite-place-actions";
      actions.append(editButton, removeButton);

      const routeRow = document.createElement("div");
      routeRow.className = "route-item-row";
      routeRow.append(openButton, actions);

      item.append(routeRow, routeEditForm);
      fragment.appendChild(item);
    });

    ctx.el.favoritesList.appendChild(fragment);
  }

  function updateFavoriteDetails(key, { customName, note, folder }) {
    const favorite = ctx.state.favorites.find(item => item.key === key);
    if (!favorite) return;

    favorite.customName = (customName || "").trim();
    favorite.note = (note || "").trim();
    if (folder !== undefined) favorite.folder = folder || "";

    saveFavorites();
    renderFolderChips();
    renderFavoritesList();
  }

  function saveFavorites() {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.favorites,
      JSON.stringify(ctx.state.favorites)
    );
  }




  window.OMAP_FAVORITES = {
    configure,
    getFavoriteKey,
    isFavorite,
    toggleFavorite,
    readFavorites,
    saveFavorites,
    readFavoriteFolders,
    saveFavoriteFolders,
    createFavoriteFolder,
    deleteFavoriteFolder,
    renameFavoriteFolder,
    moveFavoriteToFolder,
    attachFolderDropTarget,
    renderFolderChips,
    renderFavoritesList,
    updateFavoriteDetails,
    openFavoritesPanel,
    closeFavoritesPanel,
    openFavoritePlace,
    getMatchingFavoritePlaces,
    addContextPointToFavorites
  };
})();
