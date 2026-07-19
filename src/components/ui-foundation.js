(function () {
  "use strict";

  const components = new Map();

  function register(name, component) {
    if (!name || !component) {
      return component;
    }

    components.set(name, component);
    return component;
  }

  function get(name) {
    return components.get(name) || null;
  }

  window.OMAP_UI_FOUNDATION = {
    register,
    get,
    has(name) {
      return components.has(name);
    }
  };

  register(
    "BottomSheet",
    window.OMAP_BOTTOM_SHEET
  );
  register(
    "PlaceCard",
    window.OMAP_PLACE_CARD
  );
  register(
    "PhotoGallery",
    window.OMAP_PHOTO_GALLERY
  );
  register(
    "BackNavigation",
    window.OMAP_BACK_NAVIGATION
  );
})();
