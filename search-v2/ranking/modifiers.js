(function () {
  "use strict";

  const H = window.OMAP_SEARCH_V2_RANKING_HELPERS;

  function containsAny(text, values) {
    return values.some(value => text.includes(value));
  }

  window.OMAP_SEARCH_V2_RANK_MODIFIERS = function (parsed, result) {
    if (!parsed.modifiers?.length) return { points: 0, reasons: [] };

    const text = H.text(result);
    let points = 0;
    const reasons = [];

    for (const modifier of parsed.modifiers) {
      switch (modifier.id) {
        case "main":
          if (H.isMainObject(parsed, result)) {
            points += 45;
            reasons.push("obiekt główny");
          } else {
            points -= 15;
          }
          break;

        case "open_24h":
          if (containsAny(text, ["24/7", "24h", "00:00-24:00"])) {
            points += 55;
            reasons.push("całodobowe");
          }
          break;

        case "open_now":
          if (result.extratags?.opening_hours) {
            points += 15;
            reasons.push("ma godziny otwarcia");
          }
          break;

        case "children":
          if (containsAny(text, ["dziec", "pediatr", "child"])) {
            points += 45;
            reasons.push("dla dzieci");
          } else {
            points -= 10;
          }
          break;

        case "drive_through":
          if (containsAny(text, ["drive_through", "drive thru", "drive-through"])) {
            points += 45;
            reasons.push("drive-through");
          }
          break;

        case "wheelchair":
        case "accessible":
          if (containsAny(text, ["wheelchair yes", "wheelchair designated"])) {
            points += 35;
            reasons.push("dostępne bez barier");
          }
          break;

        case "with_parking":
          if (containsAny(text, ["parking", "car park"])) {
            points += 20;
            reasons.push("parking");
          }
          break;

        case "delivery":
          if (containsAny(text, ["delivery yes", "delivery only"])) {
            points += 30;
            reasons.push("dostawa");
          }
          break;

        case "takeaway":
          if (containsAny(text, ["takeaway yes", "take away"])) {
            points += 30;
            reasons.push("na wynos");
          }
          break;

        case "near_me":
          // Real distance scoring comes later when user location is provided.
          reasons.push("wyszukiwanie w pobliżu");
          break;
      }
    }

    return { points, reasons };
  };
})();
