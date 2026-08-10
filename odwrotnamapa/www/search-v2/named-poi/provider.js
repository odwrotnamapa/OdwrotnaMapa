(function () {
  "use strict";

  const database =
    window.OMAP_NAMED_POI_INDEX || { records: [] };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l")
      .replace(/Ł/g, "L")
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
    const identityNames = [
      record.name,
      ...(record.aliases || [])
    ].map(normalize);
    const keywordNames = (record.keywords || []).map(normalize);
    const queryTokens = tokens(query);

    let identityBest = 0;
    let exactIdentity = false;

    for (const name of identityNames) {
      if (name === normalizedQuery) {
        identityBest = Math.max(identityBest, 10000);
        exactIdentity = true;
      } else if (name.startsWith(normalizedQuery)) {
        identityBest = Math.max(identityBest, 8000);
      } else if (name.includes(normalizedQuery)) {
        identityBest = Math.max(identityBest, 6500);
      }
    }

    if (identityBest > 0) {
      return {
        value: identityBest + Number(record.priority || 0),
        isIdentity: exactIdentity
      };
    }

    // Dopasowania wieloczłonowe (np. "muzeum Gdańsk") mogą korzystać
    // też ze słów kluczowych (miasto, kategoria), ale tylko gdy
    // zapytanie samo ma co najmniej 2 słowa. Pojedyncze słowo (np.
    // sama nazwa miasta) nie może w ten sposób "trafiać" we wszystkie
    // miejsca otagowane tym miastem jako słowem kluczowym.
    if (queryTokens.length >= 2) {
      const allNames = [...identityNames, ...keywordNames];
      const combinedTokens = new Set();

      for (const name of allNames) {
        for (const token of tokens(name)) {
          combinedTokens.add(token);
        }
      }

      const allPresent = queryTokens.every(token =>
        combinedTokens.has(token)
      );

      if (allPresent) {
        return {
          value: 3000 + Number(record.priority || 0),
          isIdentity: false
        };
      }
    }

    return { value: 0, isIdentity: false };
  }

  function toResult(record, providerQuery, localScore, isIdentity) {
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
      _exactLocalIdentity: isIdentity
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
      .filter(item => item.score.value > 0)
      .sort((left, right) =>
        right.score.value - left.score.value ||
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
          item.score.value,
          item.score.isIdentity
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
