(function () {
  "use strict";

  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;
  const P = window.OMAP_SEARCH_V2_PARSER;

  const landmarkTypes = new Set([
    "mall",
    "station",
    "airport",
    "aerodrome",
    "museum",
    "castle",
    "peak",
    "zoo",
    "attraction",
    "monument",
    "memorial"
  ]);

  window.OMAP_SEARCH_V2_RANK_IMPORTANCE = function (
    parsed,
    result
  ) {
    let points = 0;
    const reasons = [];

    if (result._exactLocalIdentity) {
      points += 5000;
      reasons.push("dokładny wynik z Indeksu Nazw OMapy");
    }

    const importance = Number(result.importance || 0);

    if (importance > 0) {
      points += Math.round(
        Math.min(1, importance) * 40
      );
      reasons.push("ważność obiektu");
    }

    if (H.isMainObject(parsed, result)) {
      points += 55;
      reasons.push("główny obiekt");
    }

    const type = P.normalize(result.type);

    if (landmarkTypes.has(type)) {
      points += 30;
      reasons.push("znany typ obiektu");
    }

    if (
      result.type === "city" ||
      result.type === "administrative"
    ) {
      points += parsed.category ? -35 : 30;
    }

    if (
      result.class === "office" &&
      parsed.category?.id === "railway_station"
    ) {
      points -= 70;
      reasons.push("biuro zamiast dworca");
    }

    return { points, reasons };
  };
})();
