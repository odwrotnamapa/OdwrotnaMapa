(function () {
  "use strict";

  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;
  const P = window.OMAP_SEARCH_V2_PARSER;

  function withoutGenericWords(value) {
    const generic = new Set([
      "galeria",
      "centrum",
      "handlowe",
      "dworzec",
      "stacja",
      "kolejowa",
      "kolejowy",
      "lotnisko",
      "port",
      "lotniczy",
      "hotel",
      "restauracja",
      "apteka",
      "parking"
    ]);

    return P.normalize(value)
      .split(" ")
      .filter(token => token && !generic.has(token))
      .join(" ");
  }

  window.OMAP_SEARCH_V2_RANK_NAME = function (
    parsed,
    result,
    similarity
  ) {
    const query = parsed.normalized;
    const name = H.name(result);
    const full = P.normalize(result.display_name || "");
    const queryCore = withoutGenericWords(query);
    const nameCore = withoutGenericWords(name);

    let points = 0;
    const reasons = [];

    if (!name) {
      return {
        points: -30,
        reasons: ["brak nazwy"]
      };
    }

    if (name === query) {
      points += 180;
      reasons.push("dokładna pełna nazwa");
    } else if (full.startsWith(query)) {
      points += 145;
      reasons.push("pełny wynik zaczyna się od zapytania");
    } else if (name.startsWith(query)) {
      points += 120;
      reasons.push("nazwa zaczyna się od zapytania");
    } else if (name.includes(query)) {
      points += 95;
      reasons.push("nazwa zawiera zapytanie");
    } else {
      const value = similarity(query, name);
      points += Math.round(value * 55);

      if (value >= 0.82) {
        reasons.push("bardzo podobna nazwa");
      } else if (value >= 0.65) {
        reasons.push("podobna nazwa");
      }
    }

    if (
      queryCore &&
      nameCore &&
      queryCore === nameCore
    ) {
      points += 70;
      reasons.push("zgodny rdzeń nazwy własnej");
    } else if (
      queryCore.length >= 4 &&
      nameCore.includes(queryCore)
    ) {
      points += 40;
      reasons.push("nazwa własna zawiera rdzeń zapytania");
    }

    if (
      parsed.category &&
      !H.categoryMatches(parsed, result) &&
      name !== query
    ) {
      points -= 25;
      reasons.push("nazwa bez zgodnej kategorii");
    }

    return { points, reasons };
  };
})();
