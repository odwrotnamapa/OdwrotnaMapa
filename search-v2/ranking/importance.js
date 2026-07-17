(function () {
  "use strict";

  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;

  window.OMAP_SEARCH_V2_RANK_IMPORTANCE = function (parsed, result) {
    let points = 0;
    const reasons = [];

    const importance = Number(result.importance || 0);
    if (importance > 0) {
      points += Math.round(Math.min(1, importance) * 25);
      reasons.push("ważność obiektu");
    }

    if (H.isMainObject(parsed, result)) {
      points += 30;
      reasons.push("główny obiekt");
    }

    if (result.type === "city" || result.type === "administrative") {
      points += parsed.category ? -25 : 20;
    }

    return { points, reasons };
  };
})();
