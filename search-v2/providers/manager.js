(function () {
  "use strict";

  const providers = [
    window.OMAP_SEARCH_V2_PROVIDER_LOCAL,
    window.OMAP_SEARCH_V2_PROVIDER_NAMED_POI,
    window.OMAP_SEARCH_V2_PROVIDER_NOMINATIM,
    window.OMAP_SEARCH_V2_PROVIDER_PHOTON
  ]
    .filter(Boolean)
    .sort(
      (left, right) =>
        (right.priority || 0) -
        (left.priority || 0)
    );

  function activeProviders(parsed, options) {
    return providers.filter(provider =>
      provider.supports?.(parsed, options) !== false
    );
  }

  function withTimeout(promise, timeoutMs, label) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error(`${label} timeout`));
      }, timeoutMs);
    });

    return Promise.race([
      promise.finally(() => {
        window.clearTimeout(timeoutId);
      }),
      timeoutPromise
    ]);
  }

  async function searchLocal(parsed, options) {
    const local = providers.find(
      provider => provider.id === "local"
    );

    if (!local?.search) return [];

    return local.search(parsed, options);
  }

  async function searchQuery(
    parsed,
    query,
    options
  ) {
    const errors = [];
    const results = [];

    const remoteProviders = activeProviders(
      parsed,
      options
    ).filter(provider => provider.searchQuery);

    const settled = await Promise.all(
      remoteProviders.map(async provider => {
        const started = performance.now();

        try {
          const providerResults =
            await withTimeout(
              provider.searchQuery(
                query,
                options
              ),
              Number(options.providerTimeoutMs || 4500),
              provider.id
            );

          return {
            provider: provider.id,
            durationMs:
              performance.now() - started,
            results: providerResults
          };
        } catch (error) {
          if (error.name === "AbortError") {
            throw error;
          }

          return {
            provider: provider.id,
            durationMs:
              performance.now() - started,
            results: [],
            error
          };
        }
      })
    );

    for (const item of settled) {
      results.push(...item.results);

      if (item.error) {
        errors.push({
          provider: item.provider,
          query,
          message: item.error.message,
          durationMs: Math.round(item.durationMs)
        });
      }
    }

    return {
      results,
      errors,
      timings: settled.map(item => ({
        provider: item.provider,
        query,
        durationMs: Math.round(item.durationMs),
        count: item.results.length
      }))
    };
  }

  window.OMAP_SEARCH_V2_PROVIDER_MANAGER =
    Object.freeze({
      providers: providers.map(provider => provider.id),
      searchLocal,
      searchQuery
    });
})();
