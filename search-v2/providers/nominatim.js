(function () {
  "use strict";

  function normalize(item, providerQuery) {
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

  function jsonp(query, options) {
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
      url.searchParams.set(
        "limit",
        String(options.limit || 8)
      );
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("dedupe", "1");
      url.searchParams.set(
        "accept-language",
        options.language || "pl"
      );
      url.searchParams.set("json_callback", callbackName);

      let finished = false;
      const timeout = window.setTimeout(() => {
        finish(
          reject,
          new Error("Nominatim JSONP timeout")
        );
      }, Number(options.providerTimeoutMs || 8500));

      const cleanup = () => {
        script.remove();
        delete window[callbackName];
        options.signal?.removeEventListener(
          "abort",
          onAbort
        );
      };

      const finish = (callback, value) => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        cleanup();
        callback(value);
      };

      const onAbort = () => {
        finish(
          reject,
          new DOMException(
            "Search aborted",
            "AbortError"
          )
        );
      };

      window[callbackName] = data => {
        finish(
          resolve,
          (Array.isArray(data) ? data : [])
            .map(item => normalize(item, query))
            .filter(Boolean)
        );
      };

      script.onerror = () => {
        finish(
          reject,
          new Error("Nominatim JSONP network error")
        );
      };

      if (options.signal?.aborted) {
        onAbort();
        return;
      }

      options.signal?.addEventListener(
        "abort",
        onAbort,
        { once: true }
      );

      script.src = url.toString();
      document.head.appendChild(script);
    });
  }

  async function searchQuery(query, options) {
    const url = new URL(
      window.SOUTHMAPS_CONFIG.search.endpoint
    );

    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set(
      "limit",
      String(options.limit || 8)
    );
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("dedupe", "1");
    url.searchParams.set(
      "accept-language",
      options.language || "pl"
    );

    try {
      const response = await fetch(url, {
        signal: options.signal,
        headers: { Accept: "application/json" }
      });

      if (!response.ok) {
        throw new Error(
          `Nominatim HTTP ${response.status}`
        );
      }

      return (await response.json())
        .map(item => normalize(item, query))
        .filter(Boolean);
    } catch (error) {
      if (error.name === "AbortError") throw error;

      if (window.location.protocol === "file:") {
        throw new Error(
          "LOCAL_FILE_MODE_UNSUPPORTED"
        );
      }

      throw error;
    }
  }

  window.OMAP_SEARCH_V2_PROVIDER_NOMINATIM =
    Object.freeze({
      id: "nominatim",
      priority: 60,
      supports() {
        return true;
      },
      searchQuery
    });
})();
