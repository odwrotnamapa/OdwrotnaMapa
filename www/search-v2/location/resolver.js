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

  // Dopasowanie rozmyte (literówki) - dokładny algorytm Levenshteina
  // co w ranker.js (nie dzielimy kodu między plikami, żeby resolver.js
  // pozostał samodzielny - to tylko ~20 linii). Wołane WYŁĄCZNIE jako
  // fallback, gdy dokładne dopasowanie (containsPhrase) nic nie
  // znajdzie - dokładne dopasowanie ma zawsze pierwszeństwo, więc to
  // nie zmienia zachowania dla poprawnie wpisanych zapytań.
  function levenshtein(a, b) {
    if (!a) return b.length;
    if (!b) return a.length;
    // Wariant "optimal string alignment" - jak zwykly Levenshtein, ale
    // traktuje przestawienie dwoch sasiednich liter (np. "gdnask"
    // zamiast "gdansk") jako JEDNA edycje zamiast dwoch. Bardzo
    // powszechny typ literowki, ktorego zwykly Levenshtein nie lapie
    // przy tym samym progu podobienstwa.
    const matrix = Array.from({ length: a.length + 1 }, () =>
      new Array(b.length + 1).fill(0)
    );
    for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i += 1) {
      for (let j = 1; j <= b.length; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
        if (
          i > 1 &&
          j > 1 &&
          a[i - 1] === b[j - 2] &&
          a[i - 2] === b[j - 1]
        ) {
          matrix[i][j] = Math.min(
            matrix[i][j],
            matrix[i - 2][j - 2] + cost
          );
        }
      }
    }

    return matrix[a.length][b.length];
  }

  function similarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;
    return 1 - levenshtein(a, b) / Math.max(a.length, b.length);
  }

  // Krótsze niż 4 znaki celowo pomijamy - fuzzy-dopasowanie bardzo
  // krótkich słów (np. "Al", "Św") daje mnóstwo fałszywych trafień.
  const FUZZY_MIN_TOKEN_LENGTH = 4;
  const FUZZY_THRESHOLD = 0.8;

  function tokenize(text) {
    return normalize(text)
      .split(/\s+/)
      .filter(token => token.length >= FUZZY_MIN_TOKEN_LENGTH);
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
            matchedToken: alias.normalized,
            length: alias.normalized.length
          });
        }
      }
    }

    if (candidates.length) {
      return candidates.sort((a, b) => b.length - a.length)[0];
    }

    return findCityFuzzy(normalizedText);
  }

  function findCityFuzzy(normalizedText) {
    const tokens = tokenize(normalizedText);
    if (!tokens.length) return null;

    let best = null;

    for (const city of DATA.cities) {
      for (const alias of aliasesFor(city)) {
        for (const token of tokens) {
          // Szybki wstępny filtr długości, żeby uniknąć kosztownego
          // porównania Levenshteina dla oczywistych nie-kandydatów.
          if (Math.abs(alias.normalized.length - token.length) > 3) continue;

          const score = similarity(token, alias.normalized);
          if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
            best = {
              city,
              matchedAlias: alias.original,
              matchedToken: token,
              length: token.length,
              score
            };
          }
        }
      }
    }

    return best;
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
              matchedToken: alias.normalized,
              length: alias.normalized.length
            });
          }
        }
      }
    }

    if (candidates.length) {
      return candidates.sort((a, b) => b.length - a.length)[0];
    }

    return findDistrictFuzzy(normalizedText, cityHint);
  }

  function findDistrictFuzzy(normalizedText, cityHint) {
    // Bez znanego miasta fuzzy-przeszukanie WSZYSTKICH dzielnic w
    // Polsce (6217+) jest zarówno kosztowne (setki ms), jak i
    // semantycznie słabe - sama nazwa dzielnicy bez miasta jest
    // niejednoznaczna (np. "Centrum" istnieje w wielu miastach).
    // Fuzzy dla dzielnic ma sens tylko jako doprecyzowanie już
    // znalezionego miasta.
    if (!cityHint) return null;

    const tokens = tokenize(normalizedText);
    if (!tokens.length) return null;

    let best = null;

    for (const city of DATA.cities) {
      if (city.id !== cityHint.id) continue;

      for (const district of city.districts || []) {
        for (const alias of aliasesFor(district)) {
          for (const token of tokens) {
            if (Math.abs(alias.normalized.length - token.length) > 3) continue;

            const score = similarity(token, alias.normalized);
            if (score >= FUZZY_THRESHOLD && (!best || score > best.score)) {
              best = {
                city,
                district,
                matchedAlias: alias.original,
                matchedToken: token,
                length: token.length,
                score
              };
            }
          }
        }
      }
    }

    return best;
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
        districtMatch.matchedToken
      );
    }

    if (cityMatch) {
      unresolved = removePhrase(
        unresolved,
        cityMatch.matchedToken
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
