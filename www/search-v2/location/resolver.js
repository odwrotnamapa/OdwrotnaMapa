(function () {
  "use strict";

  const Lexicon = window.OMAP_SEARCH_V2_LEXICON;
  const DATA = window.OMAP_SEARCH_V2_LOCATIONS_PL;

  function normalize(value) {
    return Lexicon.normalize(value);
  }

  function aliasesFor(entity) {
    return [
      entity.name,
      ...(entity.aliases || [])
    ]
      .map(value => ({
        original: value,
        normalized: normalize(value)
      }))
      .sort((a, b) => b.normalized.length - a.normalized.length);
  }

  function containsPhrase(text, phrase) {
    if (!phrase) return false;
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}($|\\s)`).test(text);
  }

  function findCity(text) {
    const normalizedText = normalize(text);
    const candidates = [];

    for (const city of DATA.cities) {
      for (const alias of aliasesFor(city)) {
        if (containsPhrase(normalizedText, alias.normalized)) {
          candidates.push({
            city,
            matchedAlias: alias.original,
            length: alias.normalized.length
          });
        }
      }
    }

    return candidates.sort((a, b) => b.length - a.length)[0] || null;
  }

  function findDistrict(text, cityHint = null) {
    const normalizedText = normalize(text);
    const candidates = [];

    for (const city of DATA.cities) {
      if (cityHint && city.id !== cityHint.id) continue;

      for (const district of city.districts || []) {
        for (const alias of aliasesFor(district)) {
          if (containsPhrase(normalizedText, alias.normalized)) {
            candidates.push({
              city,
              district,
              matchedAlias: alias.original,
              length: alias.normalized.length
            });
          }
        }
      }
    }

    return candidates.sort((a, b) => b.length - a.length)[0] || null;
  }

  function removePhrase(text, phrase) {
    const normalizedText = normalize(text);
    const normalizedPhrase = normalize(phrase);
    const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return normalizedText
      .replace(new RegExp(`(^|\\s)${escaped}($|\\s)`, "g"), " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function resolve(locationText) {
    const raw = String(locationText || "").trim();
    const cityMatch = findCity(raw);
    const districtMatch = findDistrict(
      raw,
      cityMatch?.city || null
    );

    // If only a district alias was given, infer its parent city.
    const city = cityMatch?.city || districtMatch?.city || null;
    const district = districtMatch?.district || null;

    let unresolved = normalize(raw);

    if (districtMatch) {
      unresolved = removePhrase(
        unresolved,
        districtMatch.matchedAlias
      );
    }

    if (cityMatch) {
      unresolved = removePhrase(
        unresolved,
        cityMatch.matchedAlias
      );
    }

    return {
      raw,
      city: city ? {
        id: city.id,
        name: city.name,
        aliases: city.aliases || [],
        voivodeship: city.voivodeship
      } : null,
      district: district ? {
        id: district.id,
        name: district.name,
        aliases: district.aliases || [],
        type: district.type,
        parentCityId: city?.id || districtMatch?.city?.id || null
      } : null,
      matchedCityAlias: cityMatch?.matchedAlias || null,
      matchedDistrictAlias: districtMatch?.matchedAlias || null,
      unresolved
    };
  }

  function expand(resolved, subjectVariants = []) {
    const results = [];
    const add = value => {
      const trimmed = String(value || "").trim();
      if (
        trimmed &&
        !results.some(item => normalize(item) === normalize(trimmed))
      ) {
        results.push(trimmed);
      }
    };

    const city = resolved?.city?.name;
    const district = resolved?.district?.name;
    const districtAliases = resolved?.district?.aliases || [];

    for (const subject of subjectVariants) {
      if (city && district) {
        add(`${subject} ${city} ${district}`);
        add(`${subject} ${district} ${city}`);
        add(`${subject}, ${district}, ${city}`);
        add(`${subject}, ${city}, ${district}`);
      } else if (district) {
        add(`${subject} ${district}`);
      } else if (city) {
        add(`${subject} ${city}`);
      }

      for (const alias of districtAliases.slice(0, 3)) {
        if (city) {
          add(`${subject} ${alias} ${city}`);
          add(`${subject}, ${alias}, ${city}`);
        } else {
          add(`${subject} ${alias}`);
        }
      }
    }

    return results;
  }

  function resultMatches(resolved, result) {
    if (!resolved) return {
      city: false,
      district: false
    };

    const text = normalize([
      result.display_name,
      result.address?.city,
      result.address?.town,
      result.address?.village,
      result.address?.suburb,
      result.address?.city_district,
      result.address?.neighbourhood,
      result.address?.quarter,
      result.address?.county,
      result.address?.state
    ].filter(Boolean).join(" "));

    const cityAliases = resolved.city
      ? [resolved.city.name, ...(resolved.city.aliases || [])]
      : [];

    const districtAliases = resolved.district
      ? [resolved.district.name, ...(resolved.district.aliases || [])]
      : [];

    return {
      city: cityAliases.some(alias =>
        text.includes(normalize(alias))
      ),
      district: districtAliases.some(alias =>
        text.includes(normalize(alias))
      )
    };
  }

  window.OMAP_SEARCH_V2_LOCATION = Object.freeze({
    resolve,
    expand,
    resultMatches
  });
})();
