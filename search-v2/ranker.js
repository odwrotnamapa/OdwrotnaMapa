(function () {
  "use strict";

  const Parser = window.OMAP_SEARCH_V2_PARSER;

  function levenshtein(left, right) {
    const a = Parser.normalize(left);
    const b = Parser.normalize(right);
    if (!a) return b.length;
    if (!b) return a.length;

    let previous = Array.from(
      { length: b.length + 1 },
      (_, index) => index
    );

    for (let i = 1; i <= a.length; i += 1) {
      const current = [i];

      for (let j = 1; j <= b.length; j += 1) {
        current[j] = Math.min(
          current[j - 1] + 1,
          previous[j] + 1,
          previous[j - 1] + (
            a[i - 1] === b[j - 1] ? 0 : 1
          )
        );
      }

      previous = current;
    }

    return previous[b.length];
  }

  function similarity(left, right) {
    const a = Parser.normalize(left);
    const b = Parser.normalize(right);
    if (!a || !b) return 0;
    if (a === b) return 1;

    return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  }

  function score(parsed, result) {
    const parts = [
      window.OMAP_SEARCH_V2_RANK_NAME(parsed, result, similarity),
      window.OMAP_SEARCH_V2_RANK_LOCATION(parsed, result),
      window.OMAP_SEARCH_V2_RANK_CATEGORY(parsed, result),
      window.OMAP_SEARCH_V2_RANK_BRAND(parsed, result),
      window.OMAP_SEARCH_V2_RANK_MODIFIERS(parsed, result),
      window.OMAP_SEARCH_V2_RANK_IMPORTANCE(parsed, result)
    ];

    return window.OMAP_SEARCH_V2_FINAL_SCORE(parts);
  }

  function rank(parsed, results) {
    return results
      .map(result => ({
        ...result,
        _searchV2: score(parsed, result)
      }))
      .sort((left, right) => {
        const scoreDifference =
          right._searchV2.points - left._searchV2.points;

        if (scoreDifference) return scoreDifference;

        return String(left.name || "").localeCompare(
          String(right.name || ""),
          "pl"
        );
      });
  }

  window.OMAP_SEARCH_V2_RANKER = Object.freeze({
    similarity,
    score,
    rank
  });
})();
