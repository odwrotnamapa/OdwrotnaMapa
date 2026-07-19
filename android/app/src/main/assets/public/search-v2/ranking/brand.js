(function () {
  "use strict";

  const P = window.OMAP_SEARCH_V2_PARSER;
  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;

  window.OMAP_SEARCH_V2_RANK_BRAND = function (
    parsed,
    result
  ) {
    if (!parsed.brand) {
      return { points: 0, reasons: [] };
    }

    const aliases = [
      parsed.brand.matchedAlias,
      parsed.brand.id
    ]
      .map(P.normalize)
      .filter(Boolean);

    const name = H.name(result);
    const text = H.text(result);

    if (aliases.some(alias => name === alias)) {
      return {
        points: 150,
        reasons: ["dokładna marka"]
      };
    }

    if (aliases.some(alias => name.includes(alias))) {
      return {
        points: 125,
        reasons: ["marka w nazwie"]
      };
    }

    if (aliases.some(alias => text.includes(alias))) {
      return {
        points: 85,
        reasons: ["marka w danych obiektu"]
      };
    }

    return {
      points: -110,
      reasons: ["inna marka"]
    };
  };
})();
