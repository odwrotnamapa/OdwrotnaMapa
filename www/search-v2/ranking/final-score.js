(function () {
  "use strict";

  window.OMAP_SEARCH_V2_FINAL_SCORE = function (parts) {
    const points = parts.reduce(
      (sum, part) => sum + Number(part.points || 0),
      0
    );

    const reasons = parts.flatMap(
      part => part.reasons || []
    );

    let confidence = "low";
    if (points >= 360) confidence = "very_high";
    else if (points >= 260) confidence = "high";
    else if (points >= 160) confidence = "medium";

    return {
      points,
      reasons,
      confidence
    };
  };
})();
