(function () {
  "use strict";

  function resultFromEntity(entity, parentCity = null) {
    const lat = entity?.center?.lat ?? entity?.lat;
    const lon = entity?.center?.lon ?? entity?.lon;

    if (!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
      return null;
    }

    return {
      place_id: `local:${entity.id}`,
      lat: String(lat),
      lon: String(lon),
      name: entity.name,
      display_name: [
        entity.name,
        parentCity?.name,
        "Polska"
      ].filter(Boolean).join(", "),
      address: {
        city: parentCity?.name || (
          entity.type === "city" ? entity.name : ""
        ),
        suburb:
          entity.type === "district" ||
          entity.type === "neighbourhood"
            ? entity.name
            : ""
      },
      class: "place",
      type: entity.type || "city",
      importance: entity.type === "city" ? 0.8 : 0.45,
      provider: "local",
      osm_type: entity.osm?.type,
      osm_id: entity.osm?.id
    };
  }

  async function search(parsed, options = {}) {
    const database =
      window.OMAP_SEARCH_V2_LOCATIONS_PL;

    if (!database) return [];

    const resolved = parsed.locationResolution;
    const results = [];

    if (resolved?.district) {
      const city = database.cities.find(
        item => item.id === resolved.city?.id
      );
      const district = city?.districts?.find(
        item => item.id === resolved.district.id
      );
      const result = resultFromEntity(district, city);
      if (result) results.push(result);
    }

    if (
      resolved?.city &&
      !parsed.category &&
      !parsed.brand
    ) {
      const city = database.cities.find(
        item => item.id === resolved.city.id
      );
      const result = resultFromEntity(
        { ...city, type: "city" }
      );
      if (result) results.push(result);
    }

    return results.slice(0, options.limit || 8);
  }

  window.OMAP_SEARCH_V2_PROVIDER_LOCAL =
    Object.freeze({
      id: "local",
      priority: 100,
      supports() {
        return true;
      },
      search
    });
})();
