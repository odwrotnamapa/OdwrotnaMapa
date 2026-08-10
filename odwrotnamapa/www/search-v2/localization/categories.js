(function () {
  "use strict";
  const dictionary = window.OMAP_PL_CATEGORIES || {};

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .trim()
      .replace(/[\s-]+/g, "_");
  }

  function resolve(result, language = "pl") {
    const candidates = [
      result?.type,
      result?.category,
      result?.class,
      result?.extratags?.shop,
      result?.extratags?.amenity,
      result?.extratags?.tourism,
      result?.extratags?.leisure,
      result?.extratags?.railway,
      result?.extratags?.natural
    ].map(normalize).filter(Boolean);

    if (result?.class === "shop" && result?.type === "mall") {
      candidates.unshift("shopping_mall");
    }

    for (const key of candidates) {
      const item = dictionary[key];
      if (item) {
        return {
          key,
          label: language === "pl"
            ? item.pl
            : key.replaceAll("_", " "),
          icon: item.icon || "📍"
        };
      }
    }

    const fallback = candidates[0] || "place";
    return {
      key: fallback,
      label: language === "pl" ? "miejsce" : fallback.replaceAll("_", " "),
      icon: "📍"
    };
  }

  window.OMAP_CATEGORY_LABELS = Object.freeze({ resolve });
})();