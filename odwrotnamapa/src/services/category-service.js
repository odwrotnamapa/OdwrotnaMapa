(function () {
  "use strict";

  let resolver = null;

  function configure(options = {}) {
    if (typeof options.resolve === "function") {
      resolver = options.resolve;
    }
  }

  function fallback(result, language = "pl") {
    const value = String(
      result?.type ||
      result?.category ||
      result?.class ||
      (
        language === "pl"
          ? "miejsce"
          : "place"
      )
    ).replaceAll("_", " ");

    return {
      label: value,
      icon: "📍"
    };
  }

  function resolve(result, language = "pl") {
    if (typeof resolver === "function") {
      const resolved = resolver(
        result,
        language
      );

      if (
        resolved &&
        typeof resolved === "object"
      ) {
        return {
          label:
            resolved.label ||
            fallback(result, language).label,
          icon:
            resolved.icon ||
            "📍",
          color:
            resolved.color ||
            "",
          key:
            resolved.key ||
            result?.type ||
            result?.category ||
            result?.class ||
            ""
        };
      }
    }

    return fallback(result, language);
  }

  function label(result, language = "pl") {
    return resolve(result, language).label;
  }

  function icon(result, language = "pl") {
    return resolve(result, language).icon;
  }

  window.OMAP_CATEGORY_SERVICE = {
    configure,
    resolve,
    label,
    icon
  };
})();
