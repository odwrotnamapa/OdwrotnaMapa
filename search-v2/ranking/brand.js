(function () {
  "use strict";

  const P = window.OMAP_SEARCH_V2_PARSER;
  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;

  window.OMAP_SEARCH_V2_RANK_BRAND = function (parsed, result) {
    if (!parsed.brand) return { points: 0, reasons: [] };

    const brand = P.normalize(parsed.brand.matchedAlias);
    const text = H.text(result);

    if (text.includes(brand)) {
      return { points: 100, reasons: ["zgodna marka"] };
    }

    return { points: -70, reasons: ["inna marka"] };
  };
})();
