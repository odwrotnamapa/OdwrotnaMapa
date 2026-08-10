(function () {
  "use strict";

  const database = window.OMAP_TERYT_INDEX || {
    voivodeships: [],
    places: []
  };

  function normalize(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/wojewodztwo|woj\.?/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  const voivodeshipByAlias = new Map();

  for (const item of database.voivodeships || []) {
    for (const alias of [
      item.name,
      ...(item.aliases || [])
    ]) {
      voivodeshipByAlias.set(normalize(alias), item);
    }
  }

  const placeByName = new Map();

  for (const item of database.places || []) {
    const aliases = new Set([
      item.name,
      ...(item.aliases || [])
    ].map(normalize).filter(Boolean));

    for (const key of aliases) {
      if (!placeByName.has(key)) {
        placeByName.set(key, []);
      }

      const items = placeByName.get(key);

      if (!items.some(candidate => candidate.id === item.id)) {
        items.push(item);
      }
    }
  }

  function resolveVoivodeship(result) {
    const address = result.address || {};

    for (const candidate of [
      result.voivodeship,
      result.teryt?.voivodeship,
      address.state,
      address.region,
      address.province
    ]) {
      const match = voivodeshipByAlias.get(
        normalize(candidate)
      );
      if (match) return match;
    }

    const placeName = normalize(
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      result.name
    );

    const candidates = placeByName.get(placeName) || [];

    if (candidates.length === 1) {
      return voivodeshipByAlias.get(
        normalize(candidates[0].voivodeship)
      ) || null;
    }

    return null;
  }

  function enrich(result) {
    const voivodeship = resolveVoivodeship(result);

    if (!voivodeship) return result;

    return {
      ...result,
      voivodeship: voivodeship.name,
      teryt: {
        ...(result.teryt || {}),
        source: "TERYT",
        voivodeship: voivodeship.name,
        voivodeshipCode: voivodeship.code
      },
      address: {
        ...(result.address || {}),
        state:
          result.address?.state ||
          voivodeship.name
      },
      providers: [
        ...new Set([
          ...(result.providers || [
            result.provider
          ]).filter(Boolean),
          "teryt"
        ])
      ]
    };
  }

  function enrichAll(results) {
    return (results || []).map(enrich);
  }

  window.OMAP_TERYT = Object.freeze({
    normalize,
    resolveVoivodeship,
    enrich,
    enrichAll,
    source: "TERYT / GUS"
  });
})();
