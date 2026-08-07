(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - edytor niestandardowego
  // motywu "custom": paleta kolorow, czcionka, tekstury. Trzy
  // sekcje formularza scalone w jeden modul, bo fizycznie sasiadowaly
  // w app.js i przycisk reset Palety dotyka wszystkich trzech naraz
  // (osobne moduly bylyby sztucznym podzialem bez realnej korzysci -
  // pierwsza wersja tej ekstrakcji byla dwoma osobnymi plikami,
  // scalona na prosbe uzytkownika, ktory slusznie zauwazyl ze podzial
  // "Paleta osobno, Czcionka+Tekstury razem" byl niespojny).
  //
  // NIE zawiera stosowania palety/czcionki/tekstur NA MAPIE
  // (applyCustomPalette, applyDarkPalette, applyCustomUiColors,
  // applyCustomFont, applyTheme, registerTextureImage) - to zostaje
  // w app.js, znacznie wiecej splecione z systemem motywu i
  // renderowaniem warstw MapLibre. Te funkcje sa tylko wstrzykiwane
  // przez configure() jako zaleznosci.
  //
  // readCustomPalette jest wolane wewnatrz konstrukcji obiektu
  // state, wiec potrzebuje minimalnego, wczesnego configure z samym
  // CONFIG i DEFAULT_CUSTOM_PALETTE, PRZED rozpoczeciem budowy
  // state.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  // --- Paleta ---

  function readCustomPalette() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(ctx.CONFIG.storageKeys.customPalette) || "{}"
      );
      return { ...ctx.DEFAULT_CUSTOM_PALETTE, ...stored };
    } catch (_) {
      return { ...ctx.DEFAULT_CUSTOM_PALETTE };
    }
  }

  function saveCustomPalette(palette) {
    ctx.safeSet(
      ctx.CONFIG.storageKeys.customPalette,
      JSON.stringify(palette)
    );
  }
  function updateCustomPaletteVisibility() {
    if (ctx.el.menuCustomPalette) {
      ctx.el.menuCustomPalette.hidden = ctx.state.theme !== "custom";
    }
  }

  const CUSTOM_PALETTE_FIELDS = [
    "mapBackground", "mapWater", "mapParks", "mapBuildings",
    "mapRoads", "mapBoundaries", "mapLabels",
    "uiAccent", "uiPanel", "uiText"
  ];

  function syncCustomPaletteInputs() {
    for (const key of CUSTOM_PALETTE_FIELDS) {
      const input = ctx.$(`custom-color-${key}`);
      if (input) input.value = ctx.state.customPalette[key];
    }
  }

  function initializeCustomPaletteEditor() {
    syncCustomPaletteInputs();

    for (const key of CUSTOM_PALETTE_FIELDS) {
      const input = ctx.$(`custom-color-${key}`);
      if (!input) continue;

      input.addEventListener("input", () => {
        ctx.state.customPalette[key] = input.value;
        saveCustomPalette(ctx.state.customPalette);
        if (ctx.state.theme === "custom") ctx.applyTheme(ctx.state.theme);
      });
    }

    ctx.el.customPaletteReset?.addEventListener("click", async () => {
      ctx.state.customPalette = { ...ctx.DEFAULT_CUSTOM_PALETTE };
      saveCustomPalette(ctx.state.customPalette);
      syncCustomPaletteInputs();

      for (const key of ctx.TEXTURE_FIELDS) {
        ctx.state.customTextures[key] = null;
        await window.OMAP_TEXTURE_STORAGE?.idbDeleteTexture(key);
        if (ctx.MAP_TEXTURE_KEYS.includes(key)) ctx.unregisterTextureImage(key);
      }

      ctx.state.customFont = { type: "default" };
      ctx.state.customFontDataUrl = null;
      ctx.saveCustomFont();
      await window.OMAP_TEXTURE_STORAGE?.idbDeleteCustomFont();
      syncCustomFontSelect();

      if (ctx.state.theme === "custom") ctx.applyTheme(ctx.state.theme);
    });
  }

  // --- Czcionka ---

  function syncCustomFontSelect() {
    if (!ctx.el.customFontSelect) return;
    const font = ctx.state.customFont;
    ctx.el.customFontSelect.value =
      font.type === "google" ? `google:${font.googleFont}` : font.type;
    if (ctx.el.customFontUploadRow) {
      ctx.el.customFontUploadRow.hidden = font.type !== "custom";
    }
  }

  function initializeFontEditor() {
    syncCustomFontSelect();

    ctx.el.customFontSelect?.addEventListener("change", async () => {
      const value = ctx.el.customFontSelect.value;

      if (value === "custom") {
        ctx.state.customFont = { type: "custom" };
        ctx.saveCustomFont();
        if (ctx.el.customFontUploadRow) ctx.el.customFontUploadRow.hidden = false;

        if (!ctx.state.customFontDataUrl) {
          ctx.state.customFontDataUrl = await window.OMAP_TEXTURE_STORAGE?.idbGetCustomFont();
        }

        if (ctx.state.theme === "custom") ctx.applyCustomFont();
        return;
      }

      if (ctx.el.customFontUploadRow) ctx.el.customFontUploadRow.hidden = true;

      ctx.state.customFont = value.startsWith("google:")
        ? { type: "google", googleFont: value.slice("google:".length) }
        : { type: "default" };

      ctx.saveCustomFont();
      if (ctx.state.theme === "custom") ctx.applyCustomFont();
    });

    ctx.el.customFontFile?.addEventListener("change", async () => {
      const file = ctx.el.customFontFile.files?.[0];
      if (!file) return;

      if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) {
        alert("Wybierz plik czcionki w formacie WOFF, WOFF2, TTF lub OTF.");
        ctx.el.customFontFile.value = "";
        return;
      }

      if (file.size > ctx.CUSTOM_FONT_MAX_BYTES) {
        alert("Plik czcionki jest za duży (limit 5 MB).");
        ctx.el.customFontFile.value = "";
        return;
      }

      try {
        const dataUrl = await ctx.readFileAsDataUrl(file);
        ctx.state.customFontDataUrl = dataUrl;
        await window.OMAP_TEXTURE_STORAGE?.idbSetCustomFont(dataUrl);
        ctx.state.customFont = { type: "custom" };
        ctx.saveCustomFont();
        if (ctx.state.theme === "custom") ctx.applyCustomFont();
      } catch (error) {
        console.error("Nie udało się wczytać czcionki:", error);
        alert("Nie udało się wczytać tego pliku.");
      } finally {
        ctx.el.customFontFile.value = "";
      }
    });

    ctx.el.customFontFileClear?.addEventListener("click", async () => {
      ctx.state.customFontDataUrl = null;
      await window.OMAP_TEXTURE_STORAGE?.idbDeleteCustomFont();
      ctx.state.customFont = { type: "default" };
      ctx.saveCustomFont();
      syncCustomFontSelect();
      if (ctx.state.theme === "custom") ctx.applyCustomFont();
    });
  }

  // --- Tekstury ---

  function initializeTextureEditor() {
    for (const key of ctx.TEXTURE_FIELDS) {
      const input = ctx.$(`custom-texture-${key}`);
      const clearBtn = ctx.$(`custom-texture-${key}-clear`);

      input?.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;

        if (!/^image\/(png|jpeg)$/.test(file.type)) {
          alert("Wybierz plik w formacie JPG lub PNG.");
          input.value = "";
          return;
        }

        try {
          const dataUrl = await ctx.resizeImageToDataUrl(file);
          ctx.state.customTextures[key] = dataUrl;
          await window.OMAP_TEXTURE_STORAGE?.idbSetTexture(key, dataUrl);

          if (ctx.MAP_TEXTURE_KEYS.includes(key)) {
            await ctx.registerTextureImage(key, dataUrl);
          }

          if (ctx.state.theme === "custom") ctx.applyTheme(ctx.state.theme);
        } catch (error) {
          console.error("Nie udało się wczytać tekstury:", error);
          alert("Nie udało się wczytać tego obrazu.");
        } finally {
          input.value = "";
        }
      });

      clearBtn?.addEventListener("click", async () => {
        ctx.state.customTextures[key] = null;
        await window.OMAP_TEXTURE_STORAGE?.idbDeleteTexture(key);

        if (ctx.MAP_TEXTURE_KEYS.includes(key)) {
          ctx.unregisterTextureImage(key);
        }

        if (ctx.state.theme === "custom") ctx.applyTheme(ctx.state.theme);
      });
    }
  }

  window.OMAP_CUSTOM_THEME_EDITOR = {
    configure,
    readCustomPalette,
    saveCustomPalette,
    updateCustomPaletteVisibility,
    syncCustomPaletteInputs,
    initializePaletteEditor: initializeCustomPaletteEditor,
    syncCustomFontSelect,
    initializeFontEditor,
    initializeTextureEditor
  };
})();
