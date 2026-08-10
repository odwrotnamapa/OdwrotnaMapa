(function () {
  "use strict";

  const CATEGORIES = [
    {
      id: "railway_station",
      label: { pl: "dworzec kolejowy", en: "railway station" },
      aliases: [
        "pkp", "dworzec pkp", "dworzec kolejowy",
        "stacja kolejowa", "kolej", "pociag", "pociąg",
        "railway station", "train station", "bahnhof"
      ],
      variants: [
        "railway station", "train station",
        "dworzec kolejowy", "stacja kolejowa"
      ],
      osm: {
        classes: ["railway"],
        types: ["station", "halt"]
      }
    },
    {
      id: "bus_station",
      label: { pl: "dworzec autobusowy", en: "bus station" },
      aliases: [
        "pks", "dworzec autobusowy", "autobusowy",
        "bus station", "coach station"
      ],
      variants: [
        "bus station", "coach station", "dworzec autobusowy"
      ],
      osm: {
        classes: ["amenity", "highway"],
        types: ["bus_station", "bus_stop"]
      }
    },
    {
      id: "airport",
      label: { pl: "lotnisko", en: "airport" },
      aliases: [
        "lotnisko", "port lotniczy", "airport",
        "aeroport", "flughafen"
      ],
      variants: ["airport", "lotnisko", "port lotniczy"],
      osm: {
        classes: ["aeroway"],
        types: ["aerodrome", "terminal"]
      }
    },
    {
      id: "zoo",
      label: { pl: "zoo", en: "zoo" },
      aliases: [
        "zoo", "ogrod zoologiczny", "ogród zoologiczny",
        "zoological garden", "tiergarten"
      ],
      variants: ["zoo", "zoological garden", "ogród zoologiczny"],
      osm: {
        classes: ["tourism"],
        types: ["zoo"]
      }
    },
    {
      id: "hospital",
      label: { pl: "szpital", en: "hospital" },
      aliases: [
        "szpital", "sor", "pogotowie", "hospital",
        "emergency room"
      ],
      variants: ["hospital", "szpital"],
      osm: {
        classes: ["amenity"],
        types: ["hospital", "clinic"]
      }
    },
    {
      id: "pharmacy",
      label: { pl: "apteka", en: "pharmacy" },
      aliases: ["apteka", "pharmacy", "drugstore"],
      variants: ["pharmacy", "apteka"],
      osm: {
        classes: ["amenity"],
        types: ["pharmacy"]
      }
    },
    {
      id: "main_square",
      label: { pl: "rynek", en: "main square" },
      aliases: [
        "rynek", "rynek glowny", "rynek główny",
        "main square", "market square", "old town square"
      ],
      variants: ["main square", "market square", "rynek główny", "rynek"],
      osm: {
        classes: ["place", "highway"],
        types: ["square", "pedestrian"]
      }
    },
    {
      id: "shopping_centre",
      label: { pl: "centrum handlowe", en: "shopping centre" },
      aliases: [
        "galeria", "centrum handlowe", "shopping centre",
        "shopping center", "mall"
      ],
      variants: ["shopping centre", "mall", "centrum handlowe"],
      osm: {
        classes: ["shop"],
        types: ["mall", "department_store"]
      }
    },
    {
      id: "museum",
      label: { pl: "muzeum", en: "museum" },
      aliases: ["muzeum", "museum"],
      variants: ["museum", "muzeum"],
      osm: {
        classes: ["tourism"],
        types: ["museum"]
      }
    },
    {
      id: "restaurant",
      label: { pl: "restauracja", en: "restaurant" },
      aliases: ["restauracja", "restaurant", "jedzenie"],
      variants: ["restaurant", "restauracja"],
      osm: {
        classes: ["amenity"],
        types: ["restaurant", "fast_food"]
      }
    }
  ];

  const BRANDS = [
    "lidl", "biedronka", "aldi", "kaufland", "carrefour",
    "auchan", "tesco", "zabka", "żabka", "ikea",
    "castorama", "obi", "leroy merlin", "mcdonald's",
    "mcdonalds", "kfc", "burger king", "starbucks"
  ];

  window.OMAP_SEARCH_V2_ALIASES = Object.freeze({
    categories: CATEGORIES,
    brands: BRANDS
  });
})();
