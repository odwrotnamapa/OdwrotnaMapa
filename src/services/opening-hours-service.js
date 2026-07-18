(function () {
  "use strict";

  let formatter = null;

  function configure(options = {}) {
    if (typeof options.format === "function") {
      formatter = options.format;
    }
  }

  function normalizeValue(value) {
    if (value == null) return "";

    if (Array.isArray(value)) {
      return value
        .map(item => String(item).trim())
        .filter(Boolean)
        .join("\n");
    }

    return String(value).trim();
  }

  function format(
    value,
    {
      language = "pl",
      place = null
    } = {}
  ) {
    const normalized =
      normalizeValue(value);

    if (!normalized) {
      return "";
    }

    if (typeof formatter === "function") {
      const output = formatter(
        normalized,
        {
          language,
          place
        }
      );

      if (output != null) {
        return output;
      }
    }

    return normalized;
  }

  function getRaw(place = {}) {
    return (
      place.opening_hours ||
      place.extratags?.opening_hours ||
      place.extratags?.["opening_hours:covid19"] ||
      ""
    );
  }

  function fromPlace(
    place,
    options = {}
  ) {
    return format(
      getRaw(place),
      {
        ...options,
        place
      }
    );
  }

  window.OMAP_OPENING_HOURS_SERVICE = {
    configure,
    format,
    fromPlace,
    getRaw
  };
})();
