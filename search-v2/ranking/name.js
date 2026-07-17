(function () {
  "use strict";

  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;

  window.OMAP_SEARCH_V2_RANK_NAME = function (parsed, result, similarity) {
    const query = parsed.normalized;
    const name = H.name(result);
    let points = 0;
    const reasons = [];

    if (!name) return { points: -10, reasons: ["brak nazwy"] };

    if (name === query) {
      points += 120;
      reasons.push("dokładna nazwa");
    } else if (name.startsWith(query)) {
      points += 85;
      reasons.push("nazwa zaczyna się od zapytania");
    } else if (name.includes(query)) {
      points += 65;
      reasons.push("nazwa zawiera zapytanie");
    } else {
      const value = similarity(query, name);
      points += Math.round(value * 40);
      if (value >= 0.65) reasons.push("podobna nazwa");
    }

    return { points, reasons };
  };
})();
