(function () {
  "use strict";

  let formatter = null;

  function configure(options = {}) {
    if (typeof options.format === "function") {
      formatter = options.format;
    }
  }

  function compact(parts) {
    return parts
      .map(value => String(value || "").trim())
      .filter(Boolean);
  }

  function fallback(place = {}) {
    if (
      typeof place.address === "string" &&
      place.address.trim()
    ) {
      return place.address.trim();
    }

    const address =
      place.addressDetails ||
      place.address ||
      {};

    const street = compact([
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.cycleway,
      address.house_number
    ]).join(" ");

    const locality =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.county ||
      "";

    const line = compact([
      street,
      address.postcode,
      locality,
      address.state
    ]);

    if (line.length) {
      return line.join(", ");
    }

    return String(
      place.display_name ||
      place.addressLabel ||
      ""
    ).trim();
  }

  function format(
    place,
    options = {}
  ) {
    if (typeof formatter === "function") {
      const output = formatter(
        place,
        options
      );

      if (
        typeof output === "string" &&
        output.trim()
      ) {
        return output.trim();
      }
    }

    return fallback(place);
  }

  function lines(
    place,
    options = {}
  ) {
    return format(place, options)
      .split(/\s*,\s*/)
      .map(value => value.trim())
      .filter(Boolean);
  }

  window.OMAP_ADDRESS_SERVICE = {
    configure,
    format,
    lines
  };
})();
