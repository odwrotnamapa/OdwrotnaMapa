(function () {
  "use strict";

  const Parser = window.OMAP_SEARCH_V2_PARSER;
  const Ranker = window.OMAP_SEARCH_V2_RANKER;

  function normalizeNominatim(item, providerQuery) {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      ...item,
      lat: String(lat),
      lon: String(lon),
      name:
        item.namedetails?.name ||
        item.name ||
        String(item.display_name || "").split(",")[0],
      provider: "nominatim",
      providerQuery
    };
  }

  function normalizePhoton(feature, providerQuery) {
    const properties = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates || [];
    const lon = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    const name =
      properties.name ||
      properties.city ||
      properties.town ||
      properties.village ||
      "";

    const address = {
      house_number:
        properties.housenumber ||
        properties.house_number,
      road:
        properties.street ||
        properties.road,
      city:
        properties.city ||
        properties.town ||
        properties.village,
      county: properties.county,
      state: properties.state,
      postcode: properties.postcode,
      country: properties.country
    };

    const displayName = [
      name,
      address.road,
      address.house_number,
      address.city,
      address.state,
      address.country
    ].filter(Boolean).join(", ");

    return {
      place_id: `photon:${properties.osm_type || ""}:${properties.osm_id || ""}`,
      osm_type: properties.osm_type,
      osm_id: properties.osm_id,
      lat: String(lat),
      lon: String(lon),
      name,
      display_name: displayName,
      address,
      class: properties.osm_key || properties.type || "",
      type: properties.osm_value || properties.type || "",
      category: properties.type || "",
      importance: Number(properties.importance || 0),
      provider: "photon",
      providerQuery
    };
  }

  function fetchNominatimJsonp(
    query,
    limit,
    language,
    signal
  ) {
    return new Promise((resolve, reject) => {
      const callbackName =
        `__omapNominatim_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2)}`;

      const script = document.createElement("script");
      const url = new URL(
        window.SOUTHMAPS_CONFIG.search.endpoint
      );

      url.searchParams.set("q", query);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("dedupe", "1");
      url.searchParams.set("accept-language", language);
      url.searchParams.set("json_callback", callbackName);

      let finished = false;

      const cleanup = () => {
        script.remove();
        delete window[callbackName];
        signal?.removeEventListener("abort", onAbort);
      };

      const finish = (callback, value) => {
        if (finished) return;
        finished = true;
        cleanup();
        callback(value);
      };

      const onAbort = () => {
        const error = new DOMException(
          "Search aborted",
          "AbortError"
        );
        finish(reject, error);
      };

      const timeout = window.setTimeout(() => {
        finish(
          reject,
          new Error("Nominatim JSONP timeout")
        );
      }, 12000);

      window[callbackName] = data => {
        window.clearTimeout(timeout);
        finish(
          resolve,
          (Array.isArray(data) ? data : [])
            .map(item => normalizeNominatim(item, query))
            .filter(Boolean)
        );
      };

      script.onerror = () => {
        window.clearTimeout(timeout);
        finish(
          reject,
          new Error("Nominatim JSONP network error")
        );
      };

      if (signal?.aborted) {
        onAbort();
        return;
      }

      signal?.addEventListener("abort", onAbort, {
        once: true
      });

      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  async function fetchNominatim(
    query,
    limit,
    language,
    signal
  ) {
    const url = new URL(
      window.SOUTHMAPS_CONFIG.search.endpoint
    );

    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("dedupe", "1");
    url.searchParams.set("accept-language", language);

    try {
      const response = await fetch(url, {
        signal,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim HTTP ${response.status}`
        );
      }

      return (await response.json())
        .map(item => normalizeNominatim(item, query))
        .filter(Boolean);
    } catch (error) {
      if (error.name === "AbortError") throw error;

      // file:// ma origin "null" i część przeglądarek
      // blokuje zwykły fetch. JSONP działa jako skrypt.
      if (window.location.protocol === "file:") {
        return fetchNominatimJsonp(
          query,
          limit,
          language,
          signal
        );
      }

      throw error;
    }
  }

  async function fetchPhoton(query, limit, language, signal) {
    const url = new URL(
      window.SOUTHMAPS_CONFIG.search.fuzzyEndpoint
    );
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", language);

    const response = await fetch(url, {
      signal,
      headers: { Accept: "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Photon HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.features || [])
      .map(item => normalizePhoton(item, query))
      .filter(Boolean);
  }

  function resultKey(result) {
    if (result.osm_type && result.osm_id) {
      return `${result.osm_type}:${result.osm_id}`;
    }

    return [
      Number(result.lat).toFixed(5),
      Number(result.lon).toFixed(5),
      Parser.normalize(result.name)
    ].join(":");
  }

  function merge(results) {
    const unique = [];

    for (const result of results) {
      const osmKey =
        result.osm_type && result.osm_id
          ? `${result.osm_type}:${result.osm_id}`
          : "";

      const lat = Number(result.lat);
      const lon = Number(result.lon);
      const normalizedName =
        window.OMAP_SEARCH_V2_PARSER.normalize(
          result.name || result.display_name || ""
        );

      const existingIndex = unique.findIndex(existing => {
        const sameOsm =
          osmKey &&
          existing.osm_type &&
          existing.osm_id &&
          `${existing.osm_type}:${existing.osm_id}` === osmKey;

        if (sameOsm) return true;

        const distance =
          Math.hypot(
            Number(existing.lat) - lat,
            Number(existing.lon) - lon
          );

        const similarName =
          window.OMAP_SEARCH_V2_RANKER.similarity(
            normalizedName,
            existing.name || existing.display_name || ""
          ) >= 0.88;

        return distance <= 0.00035 && similarName;
      });

      if (existingIndex === -1) {
        unique.push(result);
        continue;
      }

      const existing = unique[existingIndex];

      if (
        result.provider === "nominatim" &&
        existing.provider !== "nominatim"
      ) {
        unique[existingIndex] = {
          ...existing,
          ...result,
          address: {
            ...existing.address,
            ...result.address
          },
          extratags: {
            ...existing.extratags,
            ...result.extratags
          }
        };
      }
    }

    return unique;
  }

  function coordinatesResult(parsed) {
    return [{
      place_id: "coordinates",
      lat: String(parsed.coordinates.lat),
      lon: String(parsed.coordinates.lon),
      name:
        `${parsed.coordinates.lat.toFixed(5)}, ` +
        parsed.coordinates.lon.toFixed(5),
      display_name:
        `${parsed.coordinates.lat}, ${parsed.coordinates.lon}`,
      class: "place",
      type: "coordinates",
      address: {},
      provider: "local"
    }];
  }

  async function search(query, options = {}) {
    const language = options.language || "pl";
    const limit = Math.max(1, Number(options.limit || 8));
    const signal = options.signal;
    const parsed = await Parser.parse(query);
    const variants = await Parser.expand(parsed, language);

    if (parsed.kind === "coordinates") {
      return {
        parsed,
        variants,
        diagnostics: {
          attemptedQueries: [parsed.raw],
          providerErrors: []
        },
        results: Ranker.rank(
          parsed,
          coordinatesResult(parsed)
        )
      };
    }

    const providerErrors = [];
    const attemptedQueries = [];
    const collected = [];

    async function searchVariant(variant, providerLimit) {
      attemptedQueries.push(variant);

      const requests = [
        fetchNominatim(
          variant,
          providerLimit,
          language,
          signal
        ).catch(error => {
          if (error.name === "AbortError") throw error;
          providerErrors.push({
            provider: "nominatim",
            query: variant,
            message: error.message
          });
          return [];
        }),
        (
          window.location.protocol === "file:"
            ? Promise.resolve([])
            : fetchPhoton(
                variant,
                providerLimit,
                language,
                signal
              )
        ).catch(error => {
          if (error.name === "AbortError") throw error;
          providerErrors.push({
            provider: "photon",
            query: variant,
            message: error.message
          });
          return [];
        })
      ];

      return (await Promise.all(requests)).flat();
    }

    // Najpierw zawsze dokładnie to, co wpisał użytkownik.
    const exactResults = await searchVariant(
      parsed.raw,
      Math.min(10, Math.max(5, limit))
    );
    collected.push(...exactResults);

    let ranked = Ranker.rank(
      parsed,
      merge(collected)
    );

    const exactBestScore =
      ranked[0]?._searchV2?.points ?? -Infinity;

    // Dodatkowe warianty są potrzebne tylko wtedy, gdy wynik
    // dokładnego zapytania jest słaby albo nie istnieje.
    if (
      ranked.length === 0 ||
      exactBestScore < 190
    ) {
      const extraVariants = variants
        .filter(
          variant =>
            Parser.normalize(variant) !==
            Parser.normalize(parsed.raw)
        )
        .slice(
          0,
          parsed.locationText?.trim().split(/\s+/).length >= 2
            ? 6
            : 3
        );

      for (const variant of extraVariants) {
        const variantResults = await searchVariant(
          variant,
          Math.min(6, Math.max(3, Math.ceil(limit / 2)))
        );

        collected.push(...variantResults);
        ranked = Ranker.rank(
          parsed,
          merge(collected)
        );

        const bestScore =
          ranked[0]?._searchV2?.points ?? -Infinity;

        // Nie odpytuj kolejnych wariantów, jeśli mamy już
        // wyraźnie dobry wynik.
        if (bestScore >= 260) break;
      }
    }

    return {
      parsed,
      variants,
      diagnostics: {
        attemptedQueries,
        providerErrors
      },
      results: ranked.slice(0, limit)
    };
  }

  window.OMAP_SEARCH_V2 = Object.freeze({
    parse: Parser.parse,
    expand: Parser.expand,
    rank: Ranker.rank,
    search
  });
})();
