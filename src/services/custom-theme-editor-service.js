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
  //
  // Presety (2026-08-10): nazwane, zapisane w calosci kombinacje
  // palety+czcionki+tekstur, przechowywane w IndexedDB (nowy magazyn
  // "presets" w texture-storage-service.js, bo moga zawierac obrazy).
  // "Wczytaj" nadpisuje CALY biezacy stan niestandardowego motywu i
  // wlacza go, jesli nie jest jeszcze aktywny. `text` dodane do
  // configure() specjalnie dla tej funkcji - reszta modulu nie
  // potrzebowala tlumaczen (caly pozostaly UI byl tlumaczony przez
  // app.js/updateUI(), nie generowany dynamicznie w tym module).

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

  // --- Zapisane motywy (presety) ---

  async function renderPresetList() {
    if (!ctx.el.customThemePresetList) return;
    const t = ctx.text[ctx.state.language];
    const presets = await window.OMAP_TEXTURE_STORAGE?.idbGetAllPresets() || [];
    ctx.el.customThemePresetList.replaceChildren();

    if (!presets.length) {
      const empty = document.createElement("p");
      empty.className = "custom-theme-preset-empty";
      empty.textContent = t.customThemePresetsEmpty;
      ctx.el.customThemePresetList.appendChild(empty);
      return;
    }

    for (const preset of presets.sort((a, b) => (b.savedAt || "").localeCompare(a.savedAt || ""))) {
      const item = document.createElement("li");
      item.className = "custom-theme-preset-item";

      const name = document.createElement("span");
      name.className = "custom-theme-preset-item-name";
      name.textContent = preset.name;

      const actions = document.createElement("div");
      actions.className = "custom-theme-preset-item-actions";

      const applyButton = document.createElement("button");
      applyButton.type = "button";
      applyButton.textContent = t.customThemePresetApply;
      applyButton.addEventListener("click", () => applyPreset(preset.id));

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.textContent = t.customThemePresetDelete;
      deleteButton.addEventListener("click", () => deletePreset(preset.id));

      actions.append(applyButton, deleteButton);
      item.append(name, actions);
      ctx.el.customThemePresetList.appendChild(item);
    }
  }

  async function saveCurrentAsPreset() {
    const input = ctx.el.customThemePresetNameInput;
    const name = (input?.value || "").trim();
    if (!name) return;

    const preset = {
      id: String(Date.now()),
      name,
      savedAt: new Date().toISOString(),
      palette: { ...ctx.state.customPalette },
      font: { ...ctx.state.customFont },
      fontDataUrl: ctx.state.customFontDataUrl || null,
      textures: { ...ctx.state.customTextures }
    };

    await window.OMAP_TEXTURE_STORAGE?.idbSavePreset(preset);
    if (input) input.value = "";
    await renderPresetList();
  }

  async function applyPreset(id) {
    const presets = await window.OMAP_TEXTURE_STORAGE?.idbGetAllPresets() || [];
    const preset = presets.find(p => p.id === id);
    if (!preset) return;

    // Paleta
    ctx.state.customPalette = { ...ctx.DEFAULT_CUSTOM_PALETTE, ...preset.palette };
    saveCustomPalette(ctx.state.customPalette);
    syncCustomPaletteInputs();

    // Czcionka
    ctx.state.customFont = preset.font ? { ...preset.font } : { type: "default" };
    ctx.state.customFontDataUrl = preset.fontDataUrl || null;
    ctx.saveCustomFont();
    if (preset.fontDataUrl) {
      await window.OMAP_TEXTURE_STORAGE?.idbSetCustomFont(preset.fontDataUrl);
    } else {
      await window.OMAP_TEXTURE_STORAGE?.idbDeleteCustomFont();
    }
    syncCustomFontSelect();

    // Tekstury
    for (const key of ctx.TEXTURE_FIELDS) {
      const dataUrl = preset.textures?.[key] || null;
      ctx.state.customTextures[key] = dataUrl;
      if (dataUrl) {
        await window.OMAP_TEXTURE_STORAGE?.idbSetTexture(key, dataUrl);
        if (ctx.MAP_TEXTURE_KEYS.includes(key)) {
          await ctx.registerTextureImage(key, dataUrl);
        }
      } else {
        await window.OMAP_TEXTURE_STORAGE?.idbDeleteTexture(key);
        if (ctx.MAP_TEXTURE_KEYS.includes(key)) {
          ctx.unregisterTextureImage(key);
        }
      }
    }

    // Wczytanie presetu bez włączenia motywu "custom" byłoby mylące -
    // nic by się wizualnie nie zmieniło, mimo że dane zostały
    // podmienione. Włączamy go, jeśli nie jest jeszcze aktywny.
    if (ctx.state.theme !== "custom") {
      ctx.state.theme = "custom";
      ctx.safeSet(ctx.CONFIG.storageKeys.theme, "custom");
      if (ctx.el.themeSelect) ctx.el.themeSelect.value = "custom";
      if (ctx.el.menuThemeSelect) ctx.el.menuThemeSelect.value = "custom";
      updateCustomPaletteVisibility();
    }
    ctx.applyTheme("custom");
  }

  async function deletePreset(id) {
    await window.OMAP_TEXTURE_STORAGE?.idbDeletePreset(id);
    await renderPresetList();
  }

  function initializePresetsEditor() {
    renderPresetList();

    ctx.el.customThemePresetSaveButton?.addEventListener("click", saveCurrentAsPreset);
    ctx.el.customThemePresetNameInput?.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        saveCurrentAsPreset();
      }
    });
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
    initializeTextureEditor,
    initializePresetsEditor,
    renderPresetList
  };
})();
