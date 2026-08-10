(function () {
  "use strict";

  let renderer = null;

  function configure(options = {}) {
    if (typeof options.render === "function") {
      renderer = options.render;
    }
  }

  function create(place, lngLat) {
    if (typeof renderer !== "function") {
      throw new Error(
        "PlaceCard renderer has not been configured."
      );
    }

    return renderer(place, lngLat);
  }

  window.OMAP_PLACE_CARD = {
    configure,
    create,
    isConfigured() {
      return typeof renderer === "function";
    }
  };
})();
