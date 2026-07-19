(function () {
  "use strict";

  function normalize(feature, providerQuery) {
    const properties = feature?.properties || {};
    const coordinates =
      feature?.geometry?.coordinates || [];
    const lon = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return null;
    }

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
      suburb:
        properties.district ||
        properties.suburb,
      county: properties.county,
      state: properties.state,
      postcode: properties.postcode,
      country: properties.country
    };

    return {
      place_id:
        `photon:${properties.osm_type || ""}:` +
        `${properties.osm_id || ""}`,
      osm_type: properties.osm_type,
      osm_id: properties.osm_id,
      lat: String(lat),
      lon: String(lon),
      name,
      display_name: [
        name,
        address.road,
        address.house_number,
        address.suburb,
        address.city,
        address.state,
        address.country
      ].filter(Boolean).join(", "),
      address,
      class:
        properties.osm_key ||
        properties.type ||
        "",
      type:
        properties.osm_value ||
        properties.type ||
        "",
      category: properties.type || "",
      importance: Number(
        properties.importance || 0
      ),
      provider: "photon",
      providerQuery
    };
  }

  async function searchQuery(query, options) {
    if (window.location.protocol === "file:") {
      return [];
    }

    const url = new URL(
      window.SOUTHMAPS_CONFIG.search.fuzzyEndpoint
    );

    url.searchParams.set("q", query);
    url.searchParams.set(
      "limit",
      String(options.limit || 8)
    );
    url.searchParams.set(
      "lang",
      options.language || "pl"
    );

    const response = await fetch(url, {
      signal: options.signal,
      headers: { Accept: "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Photon HTTP ${response.status}`);
    }

    const data = await response.json();

    return (data.features || [])
      .map(item => normalize(item, query))
      .filter(Boolean);
  }

  window.OMAP_SEARCH_V2_PROVIDER_PHOTON =
    Object.freeze({
      id: "photon",
      priority: 50,
      supports() {
        return window.location.protocol !== "file:";
      },
      searchQuery
    });
})();
