(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - eksport/import wszystkich
  // ustawień appki jako jeden plik JSON (ulubione, trasy, foldery,
  // niestandardowe nazwy miejsc, paleta kolorów, czcionka, tekstury
  // motywu "custom"). Ten sam wzorzec configure() co pozostałe
  // wyniesione moduły - w tym przypadku szczególnie dużo zależności
  // (15 funkcji + 3 stałe), bo ten kod z natury dotyka niemal
  // każdego podsystemu appki naraz.
  //
  // DEFAULT_CUSTOM_PALETTE/MAP_TEXTURE_KEYS/TEXTURE_FIELDS są
  // przekazywane przez configure() (nie duplikowane) - to stałe
  // dane używane też w innych miejscach app.js (system motywów),
  // duplikacja tworzyłaby ryzyko rozjazdu przy przyszłych zmianach.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  async function exportAllSettingsJson() {
    const scopes = ctx.getCheckedBackupScopes();

    if (scopes.length === 0) {
      ctx.show(ctx.text[ctx.state.language].backupNothingSelected);
      return;
    }

    const payload = {
      version: 2,
      exportedAt: new Date().toISOString()
    };

    if (scopes.includes("favorites")) {
      payload.favorites = ctx.state.favorites.map(favorite => ({
        ...favorite,
        key: favorite.key,
        title: favorite.title || "",
        address: favorite.address || "",
        lat: Number(favorite.lat),
        lon: Number(favorite.lon)
      }));
      payload.favoriteFolders = [...ctx.state.favoriteFolders];
      payload.routeFavorites = [...ctx.state.routeFavorites];
    }

    if (scopes.includes("colors")) {
      payload.customPalette = { ...ctx.state.customPalette };

      const textureEntries = Object.entries(ctx.state.customTextures || {}).filter(
        ([, dataUrl]) => Boolean(dataUrl)
      );
      if (textureEntries.length > 0) {
        payload.customTextures = Object.fromEntries(textureEntries);
      }

      if (ctx.state.customFont && ctx.state.customFont.type !== "default") {
        payload.customFont = { ...ctx.state.customFont };
        if (ctx.state.customFont.type === "custom" && ctx.state.customFontDataUrl) {
          payload.customFontData = ctx.state.customFontDataUrl;
        }
      }

      // Zapisane presety motywu (paleta+czcionka+tekstury pod nazwą) -
      // eksportowane w całości, bez kompresji obrazów (w
      // przeciwieństwie do synchronizacji przez Nostr, plik JSON nie
      // ma narzuconego limitu rozmiaru pojedynczego zdarzenia).
      const presets = await window.OMAP_TEXTURE_STORAGE?.idbGetAllPresets();
      if (Array.isArray(presets) && presets.length) {
        payload.customThemePresets = presets;
      }
    }

    if (scopes.includes("placeNames")) {
      const nameEntries = Object.entries(ctx.state.customPlaceNames || {}).filter(
        ([, name]) => Boolean(name)
      );
      if (nameEntries.length > 0) {
        payload.customPlaceNames = Object.fromEntries(nameEntries);
      }
    }

    const json = JSON.stringify(payload, null, 2);
    const filename =
      `odwrotna-mapa-ustawienia-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

    // Android WebView nie obsługuje niezawodnie pobierania plików przez
    // <a download> + blob: URL, więc tam zapisujemy plik natywnie i
    // otwieramy systemowe okno udostępniania/zapisu.
    if (window.CapacitorPlatform === "android" && window.CapacitorFilesystem) {
      try {
        const writeResult = await window.CapacitorFilesystem.writeFile({
          path: filename,
          data: json,
          directory: window.CapacitorDirectory.Cache,
          encoding: window.CapacitorEncoding.UTF8
        });

        await window.CapacitorShare.share({
          title: filename,
          files: [writeResult.uri]
        });
      } catch (error) {
        console.error(error);
        ctx.show(ctx.text[ctx.state.language].backupExportError);
      }
      return;
    }

    const blob = new Blob(
      [json],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importAllSettingsJson(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const scopes = ctx.getCheckedBackupScopes();

      if (scopes.length === 0) {
        ctx.show(ctx.text[ctx.state.language].backupNothingSelected);
        return;
      }

      const raw = JSON.parse(await file.text());
      const entries = Array.isArray(raw)
        ? raw
        : raw?.favorites;

      let importedCount = 0;
      let favoritesImportedFlag = false;
      let colorsImportedFlag = false;

      if (scopes.includes("favorites") && Array.isArray(entries)) {
        const imported = [];
        const known = new Set(
          ctx.state.favorites.map(item => item.key)
        );

        for (const entry of entries) {
          const lat = Number(entry.lat);
          const lon = Number(entry.lon);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
          ) {
            continue;
          }

          const key =
            String(entry.key || "").trim() ||
            `${lat.toFixed(6)},${lon.toFixed(6)}`;

          if (known.has(key)) continue;
          known.add(key);

          imported.push({
            ...entry,
            key,
            title: String(entry.title || "").trim(),
            address: String(entry.address || "").trim(),
            lat,
            lon,
            exactLocalIdentity: Boolean(
              entry.exactLocalIdentity ||
              entry._exactLocalIdentity
            ),
            addressDetails: {
              ...(entry.addressDetails || entry.addressObject || {})
            },
            extratags: {
              ...(entry.extratags || {})
            },
            namedetails: {
              ...(entry.namedetails || {})
            }
          });
        }

        ctx.state.favorites = [
          ...ctx.state.favorites,
          ...imported
        ].slice(0, 1000);

        ctx.saveFavorites();

        if (Array.isArray(raw?.favoriteFolders)) {
          const existingLower = new Set(ctx.state.favoriteFolders.map(f => f.toLowerCase()));
          for (const folder of raw.favoriteFolders) {
            if (typeof folder === "string" && folder.trim() && !existingLower.has(folder.trim().toLowerCase())) {
              ctx.state.favoriteFolders.push(folder.trim());
              existingLower.add(folder.trim().toLowerCase());
            }
          }
          ctx.saveFavoriteFolders();
        }

        if (Array.isArray(raw?.routeFavorites)) {
          const existingKeys = new Set(ctx.state.routeFavorites.map(r => r.key));
          const importedRoutes = raw.routeFavorites.filter(
            r => r && r.key && !existingKeys.has(r.key)
          );
          if (importedRoutes.length) {
            ctx.state.routeFavorites = [...ctx.state.routeFavorites, ...importedRoutes];
            ctx.saveRouteFavorites();
          }
        }

        ctx.renderFolderChips();
        ctx.renderFavoritesList();
        importedCount = imported.length;
        favoritesImportedFlag = true;
      }

      if (
        scopes.includes("colors") &&
        raw?.customPalette &&
        typeof raw.customPalette === "object"
      ) {
        ctx.state.customPalette = {
          ...ctx.DEFAULT_CUSTOM_PALETTE,
          ...raw.customPalette
        };
        ctx.saveCustomPalette(ctx.state.customPalette);
        ctx.syncCustomPaletteInputs();
        colorsImportedFlag = true;
      }

      if (
        scopes.includes("colors") &&
        raw?.customTextures &&
        typeof raw.customTextures === "object"
      ) {
        for (const key of ctx.TEXTURE_FIELDS) {
          const dataUrl = raw.customTextures[key];
          if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
            continue;
          }

          ctx.state.customTextures[key] = dataUrl;
          await ctx.idbSetTexture(key, dataUrl);

          if (ctx.MAP_TEXTURE_KEYS.includes(key)) {
            await ctx.registerTextureImage(key, dataUrl);
          }
        }
        colorsImportedFlag = true;
      }

      if (
        scopes.includes("colors") &&
        raw?.customFont &&
        typeof raw.customFont === "object" &&
        typeof raw.customFont.type === "string"
      ) {
        if (raw.customFont.type === "google" && raw.customFont.googleFont) {
          ctx.state.customFont = { type: "google", googleFont: raw.customFont.googleFont };
          ctx.state.customFontDataUrl = null;
          ctx.saveCustomFont();
          colorsImportedFlag = true;
        } else if (
          raw.customFont.type === "custom" &&
          typeof raw.customFontData === "string" &&
          raw.customFontData.startsWith("data:")
        ) {
          ctx.state.customFont = { type: "custom" };
          ctx.state.customFontDataUrl = raw.customFontData;
          await ctx.idbSetCustomFont(raw.customFontData);
          ctx.saveCustomFont();
          colorsImportedFlag = true;
        }
        ctx.syncCustomFontSelect();
      }

      if (
        scopes.includes("colors") &&
        Array.isArray(raw?.customThemePresets)
      ) {
        const existingPresets = await window.OMAP_TEXTURE_STORAGE?.idbGetAllPresets() || [];
        const existingIds = new Set(existingPresets.map(p => p.id));

        for (const preset of raw.customThemePresets) {
          if (
            preset &&
            typeof preset.id === "string" &&
            typeof preset.name === "string" &&
            !existingIds.has(preset.id)
          ) {
            await window.OMAP_TEXTURE_STORAGE?.idbSavePreset(preset);
            existingIds.add(preset.id);
          }
        }
        window.OMAP_CUSTOM_THEME_EDITOR?.renderPresetList();
        colorsImportedFlag = true;
      }

      if (colorsImportedFlag && ctx.state.theme === "custom") {
        ctx.applyTheme(ctx.state.theme);
      }

      let placeNamesImportedFlag = false;

      if (
        scopes.includes("placeNames") &&
        raw?.customPlaceNames &&
        typeof raw.customPlaceNames === "object"
      ) {
        for (const [key, name] of Object.entries(raw.customPlaceNames)) {
          const trimmed = String(name || "").trim();
          if (typeof key === "string" && key && trimmed) {
            ctx.state.customPlaceNames[key] = trimmed;
          }
        }
        ctx.saveCustomPlaceNames();
        placeNamesImportedFlag = true;
      }

      const messages = [];
      if (favoritesImportedFlag) {
        messages.push(ctx.text[ctx.state.language].favoritesImported(importedCount));
      }
      if (colorsImportedFlag) {
        messages.push(ctx.text[ctx.state.language].colorsImported);
      }
      if (placeNamesImportedFlag) {
        messages.push(ctx.text[ctx.state.language].placeNamesImported);
      }

      ctx.show(messages.join(" ") || ctx.text[ctx.state.language].favoritesImportError);
    } catch (error) {
      console.error(error);
      ctx.show(ctx.text[ctx.state.language].favoritesImportError);
    }
  }

  window.OMAP_BACKUP = {
    configure,
    exportAll: exportAllSettingsJson,
    importAll: importAllSettingsJson
  };
})();
