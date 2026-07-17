(function () {
  "use strict";

  const Parser = window.OMAP_SEARCH_V2_PARSER;

  function text(result) {
    return Parser.normalize([
      result.name,
      result.display_name,
      result.address?.city,
      result.address?.town,
      result.address?.village,
      result.address?.municipality,
      result.address?.county,
      result.address?.state,
      result.address?.country,
      result.class,
      result.type,
      result.category,
      result.brand,
      result.extratags?.opening_hours,
      result.extratags?.wheelchair,
      result.extratags?.drive_through,
      result.extratags?.takeaway,
      result.extratags?.delivery
    ].filter(Boolean).join(" "));
  }

  function cityText(result) {
    return Parser.normalize([
      result.address?.city,
      result.address?.town,
      result.address?.village,
      result.address?.municipality,
      result.address?.county,
      result.address?.state,
      result.address?.country
    ].filter(Boolean).join(" "));
  }

  function name(result) {
    return Parser.normalize(
      result.name ||
      result.display_name?.split(",")[0] ||
      ""
    );
  }

  function categoryMatches(parsed, result) {
    if (!parsed.category) return false;

    const resultClass = Parser.normalize(result.class);
    const resultType = Parser.normalize(result.type);
    const resultText = text(result);

    return (
      (parsed.category.osm?.classes || [])
        .map(Parser.normalize)
        .includes(resultClass) ||
      (parsed.category.osm?.types || [])
        .map(Parser.normalize)
        .includes(resultType) ||
      (parsed.category.variants || []).some(
        variant => resultText.includes(Parser.normalize(variant))
      )
    );
  }

  function isMainObject(parsed, result) {
    if (parsed.category?.id !== "railway_station") return false;
    return /\b(glowny|główny|centralny|centralna|hauptbahnhof|central|main)\b/i
      .test(result.name || "");
  }

  window.OMAP_SEARCH_V2_RANKING_HELPERS = Object.freeze({
    text,
    cityText,
    name,
    categoryMatches,
    isMainObject
  });
})();
