(function () {
  "use strict";

  const P = window.OMAP_SEARCH_V2_PARSER;
  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;
  const Location = window.OMAP_SEARCH_V2_LOCATION;

  window.OMAP_SEARCH_V2_RANK_LOCATION = function (parsed, result) {
    if (!parsed.locationText || parsed.locationMode === "user") {
      return { points: 0, reasons: [] };
    }

    const reasons = [];
    let points = 0;

    if (parsed.locationResolution && Location) {
      const matches = Location.resultMatches(
        parsed.locationResolution,
        result
      );

      if (parsed.locationResolution.city) {
        if (matches.city) {
          points += 115;
          reasons.push("zgodne miasto");
        } else {
          points -= 60;
          reasons.push("inne miasto");
        }
      }

      if (parsed.locationResolution.district) {
        if (matches.district) {
          points += 110;
          reasons.push("zgodna dzielnica");
        } else {
          points -= 45;
          reasons.push("inna dzielnica");
        }
      }

      if (
        parsed.locationResolution.city ||
        parsed.locationResolution.district
      ) {
        return { points, reasons };
      }
    }

    const location = P.normalize(parsed.locationText);
    const city = H.cityText(result);
    const full = H.text(result);

    if (city === location) {
      points += 125;
      reasons.push("dokładnie zgodna lokalizacja");
    } else if (city.includes(location)) {
      points += 105;
      reasons.push("zgodna lokalizacja");
    } else if (full.includes(location)) {
      points += 80;
      reasons.push("lokalizacja w adresie");
    } else {
      const tokens = location.split(" ").filter(token => token.length >= 2);
      const matched = tokens.filter(token => full.includes(token));
      points += matched.length * 18;

      if (matched.length) {
        reasons.push("częściowo zgodna lokalizacja");
      } else {
        points -= 55;
        reasons.push("inna lokalizacja");
      }
    }

    return { points, reasons };
  };
})();
