(function () {
  "use strict";

  const Parser = window.OMAP_SEARCH_V2_PARSER;
  const Ranker = window.OMAP_SEARCH_V2_RANKER;
  const Providers =
    window.OMAP_SEARCH_V2_PROVIDER_MANAGER;

  function createDeadline(totalTimeoutMs) {
    const started = performance.now();

    return {
      expired() {
        return (
          performance.now() - started >= totalTimeoutMs
        );
      },
      remaining() {
        return Math.max(
          0,
          totalTimeoutMs -
            (performance.now() - started)
        );
      }
    };
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
      const name = Parser.normalize(
        result.name || result.display_name || ""
      );

      const existingIndex = unique.findIndex(existing => {
        const sameOsm =
          osmKey &&
          existing.osm_type &&
          existing.osm_id &&
          `${existing.osm_type}:${existing.osm_id}` ===
            osmKey;

        if (sameOsm) return true;

        const distance = Math.hypot(
          Number(existing.lat) - lat,
          Number(existing.lon) - lon
        );

        return (
          distance <= 0.00035 &&
          Ranker.similarity(
            name,
            existing.name ||
              existing.display_name ||
              ""
          ) >= 0.88
        );
      });

      if (existingIndex === -1) {
        unique.push(result);
        continue;
      }

      const existing = unique[existingIndex];

      const existingIsNamedPoi =
        existing.provider === "named-poi" ||
        existing._exactLocalIdentity;

      const newIsNamedPoi =
        result.provider === "named-poi" ||
        result._exactLocalIdentity;

      const preferNew =
        newIsNamedPoi ||
        (
          !existingIsNamedPoi &&
          result.provider === "nominatim" &&
          existing.provider !== "nominatim"
        );

      unique[existingIndex] = preferNew
        ? {
            ...existing,
            ...result,
            address: {
              ...existing.address,
              ...result.address
            },
            extratags: {
              ...existing.extratags,
              ...result.extratags
            },
            providers: [
              ...new Set([
                ...(existing.providers || [
                  existing.provider
                ]),
                result.provider
              ])
            ]
          }
        : {
            ...existing,
            address: {
              ...(result.address || {}),
              ...(existing.address || {})
            },
            extratags: {
              ...(result.extratags || {}),
              ...(existing.extratags || {})
            },
            providers: [
              ...new Set([
                ...(existing.providers || [
                  existing.provider
                ]),
                result.provider
              ])
            ]
          };
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
        `${parsed.coordinates.lat}, ` +
        `${parsed.coordinates.lon}`,
      class: "place",
      type: "coordinates",
      address: {},
      provider: "local"
    }];
  }

  async function search(query, options = {}) {
    const started = performance.now();
    const language = options.language || "pl";
    const limit = Math.max(
      1,
      Number(options.limit || 8)
    );
    const signal = options.signal;
    const totalTimeoutMs = Number(
      options.totalTimeoutMs ||
      (
        window.location.protocol === "file:"
          ? 7000
          : 9000
      )
    );
    const providerTimeoutMs = Number(
      options.providerTimeoutMs || 4000
    );
    const deadline = createDeadline(totalTimeoutMs);

    const parseStarted = performance.now();
    const parsed = await Parser.parse(query);
    const variants = await Parser.expand(
      parsed,
      language
    );
    const parseDuration =
      performance.now() - parseStarted;

    if (parsed.kind === "coordinates") {
      return {
        parsed,
        variants,
        diagnostics: {
          attemptedQueries: [parsed.raw],
          providerErrors: [],
          providerTimings: [],
          timings: {
            parseMs: Math.round(parseDuration),
            totalMs: Math.round(
              performance.now() - started
            )
          }
        },
        results: Ranker.rank(
          parsed,
          coordinatesResult(parsed)
        )
      };
    }

    const collected = [];
    const providerErrors = [];
    const providerTimings = [];
    const attemptedQueries = [];

    const localResults =
      await Providers.searchLocal(parsed, {
        language,
        limit,
        signal
      });
    collected.push(...localResults);

    async function runVariant(
      variant,
      providerLimit
    ) {
      attemptedQueries.push(variant);

      const response = await Providers.searchQuery(
        parsed,
        variant,
        {
          language,
          limit: providerLimit,
          signal,
          providerTimeoutMs: Math.min(
            providerTimeoutMs,
            Math.max(1200, deadline.remaining())
          )
        }
      );

      collected.push(...response.results);
      providerErrors.push(...response.errors);
      providerTimings.push(...response.timings);
    }

    if (!deadline.expired()) {
      await runVariant(
        parsed.raw,
        Math.min(10, Math.max(5, limit))
      );
    }

    let rankingStarted = performance.now();
    let ranked = Ranker.rank(
      parsed,
      window.OMAP_TERYT
        ? window.OMAP_TERYT.enrichAll(
            merge(collected)
          )
        : merge(collected)
    );
    let rankingDuration =
      performance.now() - rankingStarted;

    const exactBest =
      ranked[0]?._searchV2?.points ?? -Infinity;

    if (
      ranked.length === 0 ||
      exactBest < 190
    ) {
      const isFileMode =
        window.location.protocol === "file:";

      const extraLimit = isFileMode
        ? 0
        : (
            parsed.locationText
              ?.trim()
              .split(/\s+/)
              .filter(Boolean)
              .length >= 2
              ? 3
              : 2
          );

      const extraVariants = variants
        .filter(
          variant =>
            Parser.normalize(variant) !==
            Parser.normalize(parsed.raw)
        )
        .slice(0, extraLimit);

      for (const variant of extraVariants) {
        if (deadline.expired()) break;

        await runVariant(
          variant,
          Math.min(
            6,
            Math.max(3, Math.ceil(limit / 2))
          )
        );

        rankingStarted = performance.now();
        ranked = Ranker.rank(
          parsed,
          window.OMAP_TERYT
            ? window.OMAP_TERYT.enrichAll(
                merge(collected)
              )
            : merge(collected)
        );
        rankingDuration +=
          performance.now() - rankingStarted;

        if (
          (ranked[0]?._searchV2?.points ??
            -Infinity) >= 260
        ) {
          break;
        }
      }
    }

    return {
      parsed,
      variants,
      diagnostics: {
        providers: Providers.providers,
        attemptedQueries,
        providerErrors,
        providerTimings,
        timedOut: deadline.expired(),
        timings: {
          parseMs: Math.round(parseDuration),
          rankingMs: Math.round(rankingDuration),
          totalMs: Math.round(
            performance.now() - started
          )
        }
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
