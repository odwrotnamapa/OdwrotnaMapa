(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - widocznosc grup etykiet na
  // mapie (POI, drogi, miejsca, woda, regiony, kraje, lotniska,
  // granice): zapis/odczyt localStorage, stosowanie widocznosci
  // warstw MapLibre, checkboxy w panelu Etykiety.
  //
  // Stale (klucz localStorage, domyslna widocznosc, mapa grup na
  // warstwy MapLibre) sa proste, w pelni statyczne i uzywane tylko
  // wewnatrz tego modulu - zduplikowane tutaj (jak w Pomiarze),
  // nie przekazywane przez configure(). Skopiowane DOKLADNIE z
  // oryginalnego miejsca w app.js, nie odtworzone z pamieci.
  //
  // readLabelVisibility jest wolane wewnatrz konstrukcji obiektu
  // state, ale NIE potrzebuje ctx wcale (tylko duplikowane stale) -
  // bezpieczne do wywolania w dowolnym momencie, nawet przed
  // jakimkolwiek configure().

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  const LABEL_LAYER_GROUPS = {
    poi: ["poi_r20", "poi_r7", "poi_r1", "poi_transit"],
    roads: [
      "highway-name-path",
      "highway-name-minor",
      "highway-name-major",
      "highway-shield-non-us",
      "highway-shield-us-interstate",
      "road_shield_us"
    ],
    places: [
      "label_other",
      "label_village",
      "label_town",
      "label_city",
      "label_city_capital"
    ],
    water: [
      "waterway_line_label",
      "water_name_point_label",
      "water_name_line_label"
    ],
    regions: ["label_state"],
    countries: ["label_country_3", "label_country_2", "label_country_1"],
    airports: ["airport"],
    boundaries: ["boundary_3", "boundary_2", "boundary_disputed"]
  };

  const DEFAULT_LABEL_VISIBILITY = {
    poi: true,
    roads: true,
    places: true,
    water: true,
    regions: true,
    countries: true,
    airports: true,
    boundaries: true
  };
  const LABEL_VISIBILITY_STORAGE_KEY = "omapa-label-visibility";

  function readLabelVisibility() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(LABEL_VISIBILITY_STORAGE_KEY) || "{}"
      );
      return { ...DEFAULT_LABEL_VISIBILITY, ...stored };
    } catch (_) {
      return { ...DEFAULT_LABEL_VISIBILITY };
    }
  }

  function saveLabelVisibility(visibility) {
    ctx.safeSet(LABEL_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  }

  function applyLabelVisibility() {
    for (const [group, layerIds] of Object.entries(LABEL_LAYER_GROUPS)) {
      const visible = ctx.state.labelVisibility[group];
      for (const layerId of layerIds) {
        if (!ctx.map.getLayer(layerId)) continue;
        ctx.map.setLayoutProperty(
          layerId,
          "visibility",
          visible ? "visible" : "none"
        );
      }
    }
  }
  const LABEL_VISIBILITY_CHECKBOXES = () => ({
    poi: ctx.el.labelsPoiToggle,
    roads: ctx.el.labelsRoadsToggle,
    places: ctx.el.labelsPlacesToggle,
    water: ctx.el.labelsWaterToggle,
    regions: ctx.el.labelsRegionsToggle,
    countries: ctx.el.labelsCountriesToggle,
    airports: ctx.el.labelsAirportsToggle,
    boundaries: ctx.el.labelsBoundariesToggle
  });

  function syncLabelVisibilityCheckboxes() {
    const checkboxByGroup = LABEL_VISIBILITY_CHECKBOXES();
    for (const [group, checkbox] of Object.entries(checkboxByGroup)) {
      if (checkbox) checkbox.checked = ctx.state.labelVisibility[group];
    }
    updateLabelsToggleAllButton();
  }

  function updateLabelsToggleAllButton() {
    if (!ctx.el.labelsToggleAllLabel) return;
    const t = ctx.text[ctx.state.language];
    const allVisible = Object.values(ctx.state.labelVisibility).every(Boolean);
    ctx.el.labelsToggleAllLabel.textContent = allVisible
      ? t.deselectAllLabels
      : t.selectAllLabels;
  }

  function initializeLabelVisibilityToggles() {
    const checkboxByGroup = {
      poi: ctx.el.labelsPoiToggle,
      roads: ctx.el.labelsRoadsToggle,
      places: ctx.el.labelsPlacesToggle,
      water: ctx.el.labelsWaterToggle,
      regions: ctx.el.labelsRegionsToggle,
      countries: ctx.el.labelsCountriesToggle,
      airports: ctx.el.labelsAirportsToggle,
      boundaries: ctx.el.labelsBoundariesToggle
    };

    for (const [group, checkbox] of Object.entries(checkboxByGroup)) {
      if (!checkbox) continue;

      checkbox.checked = ctx.state.labelVisibility[group];

      checkbox.addEventListener("change", () => {
        ctx.state.labelVisibility[group] = checkbox.checked;
        saveLabelVisibility(ctx.state.labelVisibility);
        applyLabelVisibility();
        updateLabelsToggleAllButton();
      });
    }

    updateLabelsToggleAllButton();

    ctx.el.labelsToggleAll?.addEventListener("click", () => {
      const allVisible = Object.values(ctx.state.labelVisibility).every(Boolean);
      const nextValue = !allVisible;

      for (const group of Object.keys(ctx.state.labelVisibility)) {
        ctx.state.labelVisibility[group] = nextValue;
      }

      saveLabelVisibility(ctx.state.labelVisibility);
      applyLabelVisibility();
      syncLabelVisibilityCheckboxes();
    });
  }

  window.OMAP_LABEL_VISIBILITY = {
    configure,
    readLabelVisibility,
    saveLabelVisibility,
    applyLabelVisibility,
    syncLabelVisibilityCheckboxes,
    updateLabelsToggleAllButton,
    initializeToggles: initializeLabelVisibilityToggles
  };
})();
