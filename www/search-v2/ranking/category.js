(function () {
  "use strict";

  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;

  window.OMAP_SEARCH_V2_RANK_CATEGORY = function (parsed, result) {
    if (!parsed.category) return { points: 0, reasons: [] };

    if (H.categoryMatches(parsed, result)) {
      const points = parsed.category.inferredFromBrand ? 65 : 110;
      return {
        points,
        reasons: [
          parsed.category.inferredFromBrand
            ? "kategoria zgodna z marką"
            : "zgodna kategoria"
        ]
      };
    }

    return {
      points: -60,
      reasons: ["niezgodna kategoria"]
    };
  };
})();
