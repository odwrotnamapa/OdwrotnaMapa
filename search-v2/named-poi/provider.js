(function () {
  "use strict";

  const database =
    window.OMAP_NAMED_POI_INDEX || { records: [] };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function tokens(value) {
    return normalize(value)
      .split(" ")
      .filter(Boolean);
  }

  function score(query, record) {
    const normalizedQuery = normalize(query);
    const names = [
      record.name,
      ...(record.aliases || []),
      ...(record.keywords || [])
    ].map(normalize);

    if (names.includes(normalizedQuery)) {
      return 10000 + Number(record.priority || 0);
    }

    const queryTokens = tokens(query);

    let best = 0;

    for (const name of names) {
      if (name.startsWith(normalizedQuery)) {
        best = Math.max(best, 8000);
      } else if (name.includes(normalizedQuery)) {
        best = Math.max(best, 6500);
      }

      const nameTokens = tokens(name);
      const matches = queryTokens.filter(token =>
        nameTokens.includes(token)
      ).length;

      if (
        queryTokens.length >= 2 &&
        matches === queryTokens.length
      ) {
        best = Math.max(best, 7000);
      }
    }

    return best
      ? best + Number(record.priority || 0)
      : 0;
  }

  function toResult(record, providerQuery, localScore) {
    return {
      place_id: record.id,
      namedPoiId: record.id,
      name: record.name,
      display_name: [
        record.name,
        record.address?.road,
        record.address?.house_number,
        record.city || record.address?.city,
        record.voivodeship
      ].filter(Boolean).join(", "),
      aliases: record.aliases || [],
      keywords: record.keywords || [],
      lat: String(record.lat),
      lon: String(record.lon),
      class: record.class || "place",
      type: record.type || "attraction",
      category: record.category || record.type || "place",
      address: {
        ...(record.address || {}),
        city:
          record.address?.city ||
          record.city ||
          "",
        state:
          record.address?.state ||
          record.voivodeship ||
          ""
      },
      extratags: {
        ...(record.extratags || {})
      },
      importance: 1,
      priority: Number(record.priority || 0),
      provider: "named-poi",
      providers: ["named-poi"],
      providerQuery,
      source: record.source || "OMapa Named POI",
      _namedPoiScore: localScore,
      _exactLocalIdentity: true
    };
  }

  async function searchQuery(query, options = {}) {
    if (options.signal?.aborted) {
      throw new DOMException(
        "Search aborted",
        "AbortError"
      );
    }

    return (database.records || [])
      .map(record => ({
        record,
        score: score(query, record)
      }))
      .filter(item => item.score > 0)
      .sort((left, right) =>
        right.score - left.score ||
        left.record.name.localeCompare(
          right.record.name,
          "pl"
        )
      )
      .slice(0, Number(options.limit || 8))
      .map(item =>
        toResult(
          item.record,
          query,
          item.score
        )
      );
  }

  window.OMAP_SEARCH_V2_PROVIDER_NAMED_POI =
    Object.freeze({
      id: "named-poi",
      priority: 1000,
      supports(query) {
        return normalize(query).length >= 2;
      },
      searchQuery
    });

  window.OMAP_NAMED_POI = Object.freeze({
    normalize,
    score,
    searchQuery
  });
})();
