(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-05) - kategorie i logika panelu
  // "Odkrywaj": dane kategorii, pobieranie wyników (Nominatim - po
  // nazwie, i Overpass - po tagach OSM dla kategorii bez sensownej
  // nazwy w OSM, jak butelkomaty czy prysznice publiczne), klasyfikacja
  // i renderowanie. Nie ma tu własnego stanu poza `ctx` - wszystkie
  // współdzielone dane (state, el, map, CONFIG, text) i dwie funkcje
  // pomocnicze z app.js (getSearchResultTitle, scrollPanelToElement)
  // są wstrzykiwane przez configure(), tak samo jak robi to
  // OMAP_PLACE_SERVICE. Otwieranie wybranego miejsca idzie przez
  // window.OMAP_PLACE_SERVICE.open(...), które jest już globalne -
  // nie wymaga żadnego dodatkowego przekazywania.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  // Krótkotrwały cache wyników - klikając tę samą kategorię bez
  // ruszania mapy (celowo albo przez pomyłkę) appka nie odpytuje
  // serwera od nowa. Ma to szczególne znaczenie dla Overpass, którego
  // publiczne serwery potrafią mocno zwolnić przy powtarzających się
  // zapytaniach z tego samego miejsca w krótkim czasie - drugie
  // kliknięcie bez cache'a mogło czekać znacznie dłużej niż pierwsze.
  const RESULTS_CACHE_TTL_MS = 90000;
  const resultsCache = new Map();

  function buildCacheKey(categoryId) {
    const bounds = ctx.map.getBounds();
    const round = value => Math.round(value * 1000) / 1000;
    return [
      categoryId,
      round(bounds.getSouth()),
      round(bounds.getWest()),
      round(bounds.getNorth()),
      round(bounds.getEast())
    ].join("|");
  }

  function getCachedResults(cacheKey) {
    const entry = resultsCache.get(cacheKey);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > RESULTS_CACHE_TTL_MS) {
      resultsCache.delete(cacheKey);
      return null;
    }
    return entry.places;
  }

  function setCachedResults(cacheKey, places) {
    resultsCache.set(cacheKey, { places, timestamp: Date.now() });
  }

  const DISCOVER_CATEGORY_GROUPS = [
    {
      id: "food",
      categories: [
        "restaurant",
        "cafe",
        "pizza",
        "bar",
        "fast_food",
        "bakery",
        "confectionery",
        "ice_cream"
      ]
    },
    {
      id: "stay",
      categories: ["hotel", "campsite"]
    },
    {
      id: "shopping",
      categories: [
        "shop",
        "mall",
        "clothes",
        "shoe_shop",
        "electronics",
        "furniture",
        "pet_shop",
        "florist",
        "jewelry",
        "sporting_goods",
        "hardware_store",
        "bicycle_shop",
        "bookstore",
        "kiosk"
      ]
    },
    {
      id: "health",
      categories: [
        "pharmacy",
        "drugstore",
        "hospital",
        "dentist",
        "optician",
        "massage",
        "vet"
      ]
    },
    {
      id: "services",
      categories: [
        "bank",
        "post_office",
        "parcel_locker",
        "hairdresser",
        "currency_exchange",
        "pawnbroker",
        "notary",
        "real_estate",
        "tailor",
        "locksmith",
        "car_wash",
        "bottle_return",
        "laundry",
        "toilets"
      ]
    },
    {
      id: "transport",
      categories: [
        "bus_stop",
        "railway_station",
        "fuel",
        "ev_charging",
        "taxi",
        "airport",
        "car_rental",
        "bicycle_rental",
        "parking",
        "car_repair"
      ]
    },
    {
      id: "culture",
      categories: [
        "museum",
        "art_gallery",
        "viewpoint",
        "monument",
        "bowling",
        "aquarium",
        "cinema",
        "theatre",
        "library",
        "nightclub",
        "zoo"
      ]
    },
    {
      id: "recreation",
      categories: [
        "park",
        "spa",
        "tennis",
        "amusement_park",
        "beach",
        "playground",
        "gym",
        "swimming_pool"
      ]
    },
    {
      id: "public",
      categories: [
        "school",
        "kindergarten",
        "university",
        "church",
        "police",
        "fire_station",
        "town_hall",
        "courthouse"
      ]
    },
    {
      id: "support",
      categories: [
        "homeless_shelter",
        "soup_kitchen",
        "public_shower",
        "drinking_water",
        "social_services"
      ]
    }
  ];

  const DISCOVER_CATEGORIES = {
    pizza: { emoji: "🍕", queries: ["pizza", "pizzeria"] },
    cafe: { emoji: "☕", queries: ["kawiarnia", "cafe"] },
    restaurant: {
      emoji: "🍽",
      queries: ["restauracja", "restaurant"]
    },
    bar: { emoji: "🍺", queries: ["bar", "pub"] },
    fast_food: {
      emoji: "🍔",
      queries: ["fast food", "kebab", "burger"]
    },
    bakery: { emoji: "🥐", queries: ["piekarnia", "bakery"] },
    confectionery: {
      emoji: "🧁",
      queries: ["cukiernia", "confectionery"]
    },
    ice_cream: {
      emoji: "🍦",
      queries: ["lodziarnia", "ice cream"]
    },
    hotel: { emoji: "🏨", queries: ["hotel", "hostel"] },
    campsite: {
      emoji: "⛺",
      queries: ["kemping", "pole namiotowe", "campsite"]
    },
    fuel: { emoji: "⛽", queries: ["stacja paliw", "fuel"] },
    museum: { emoji: "🏛", queries: ["muzeum", "museum"] },
    art_gallery: {
      emoji: "🖼️",
      queries: ["galeria sztuki", "art gallery"]
    },
    viewpoint: {
      emoji: "🔭",
      queries: ["punkt widokowy", "viewpoint"]
    },
    monument: { emoji: "🗿", queries: ["pomnik", "monument"] },
    bowling: { emoji: "🎳", queries: ["kręgielnia", "bowling"] },
    aquarium: { emoji: "🐠", queries: ["akwarium", "aquarium"] },
    park: { emoji: "🌳", queries: ["park", "ogród"] },
    spa: { emoji: "🧖", queries: ["spa", "salon spa"] },
    tennis: {
      emoji: "🎾",
      queries: ["kort tenisowy", "tennis court"]
    },
    amusement_park: {
      emoji: "🎢",
      queries: ["park rozrywki", "amusement park"]
    },
    pharmacy: { emoji: "💊", queries: ["apteka", "pharmacy"] },
    drugstore: {
      emoji: "🧴",
      queries: ["drogeria", "drugstore"]
    },
    hospital: { emoji: "🏥", queries: ["szpital", "hospital"] },
    dentist: { emoji: "🦷", queries: ["dentysta", "dentist"] },
    optician: { emoji: "👓", queries: ["optyk", "optician"] },
    massage: {
      emoji: "💆",
      queries: ["masaż", "salon masażu", "massage"]
    },
    vet: {
      emoji: "🐾",
      queries: ["weterynarz", "lecznica dla zwierząt"]
    },
    bank: { emoji: "🏦", queries: ["bank", "bankomat"] },
    post_office: {
      emoji: "✉️",
      queries: ["poczta", "post office"]
    },
    parcel_locker: {
      emoji: "📦",
      queries: ["paczkomat", "automat paczkowy", "parcel locker"],
      overpassTags: [[["amenity", "parcel_locker"]]]
    },
    hairdresser: {
      emoji: "💇",
      queries: ["fryzjer", "salon fryzjerski"]
    },
    currency_exchange: {
      emoji: "💱",
      queries: ["kantor", "currency exchange"]
    },
    pawnbroker: {
      emoji: "💰",
      queries: ["lombard", "pawnbroker", "pawn shop"]
    },
    notary: { emoji: "📜", queries: ["notariusz", "notary"] },
    real_estate: {
      emoji: "🏘️",
      queries: ["biuro nieruchomości", "real estate"]
    },
    tailor: { emoji: "🧵", queries: ["krawiec", "tailor"] },
    locksmith: { emoji: "🔑", queries: ["ślusarz", "locksmith"] },
    car_wash: {
      emoji: "🧽",
      queries: ["myjnia samochodowa", "car wash"]
    },
    bottle_return: {
      emoji: "🍾",
      queries: [
        "butelkomat",
        "skup butelek",
        "punkt zbiórki butelek",
        "bottle return"
      ],
      overpassTags: [
        [["amenity", "vending_machine"], ["vending", "bottle_return"]],
        [["amenity", "recycling"], ["recycling_type", "deposit"]]
      ]
    },
    laundry: { emoji: "🧺", queries: ["pralnia", "laundry"] },
    toilets: { emoji: "🚻", queries: ["toaleta publiczna", "toilets"] },
    bus_stop: {
      emoji: "🚏",
      queries: ["przystanek autobusowy", "przystanek"]
    },
    railway_station: {
      emoji: "🚆",
      queries: ["dworzec kolejowy", "stacja kolejowa"]
    },
    ev_charging: {
      emoji: "🔌",
      queries: ["ładowarka samochodów elektrycznych", "ev charging"]
    },
    taxi: { emoji: "🚕", queries: ["postój taksówek", "taxi"] },
    airport: { emoji: "✈️", queries: ["lotnisko", "airport"] },
    car_rental: {
      emoji: "🚗",
      queries: ["wypożyczalnia samochodów", "car rental"]
    },
    bicycle_rental: {
      emoji: "🚴",
      queries: ["wypożyczalnia rowerów", "bicycle rental"]
    },
    parking: { emoji: "🅿️", queries: ["parking", "parking strzeżony"] },
    car_repair: {
      emoji: "🔧",
      queries: ["warsztat samochodowy", "mechanik", "car repair"]
    },
    shop: {
      emoji: "🛒",
      queries: ["supermarket", "sklep spożywczy"],
      overpassTags: [
        [["shop", "supermarket"]],
        [["shop", "convenience"]],
        [["shop", "grocery"]]
      ]
    },
    mall: {
      emoji: "🏬",
      queries: ["centrum handlowe", "galeria handlowa"]
    },
    clothes: { emoji: "👕", queries: ["sklep odzieżowy", "odzież"] },
    shoe_shop: {
      emoji: "👟",
      queries: ["sklep obuwniczy", "shoe shop"]
    },
    electronics: {
      emoji: "📺",
      queries: ["sklep elektroniczny", "rtv agd", "electronics"]
    },
    furniture: {
      emoji: "🛋️",
      queries: ["sklep meblowy", "furniture store"]
    },
    pet_shop: {
      emoji: "🐕",
      queries: ["sklep zoologiczny", "pet shop"]
    },
    florist: { emoji: "💐", queries: ["kwiaciarnia", "florist"] },
    jewelry: { emoji: "💍", queries: ["jubiler", "jewelry"] },
    sporting_goods: {
      emoji: "⚽",
      queries: ["sklep sportowy", "sporting goods"]
    },
    hardware_store: {
      emoji: "🔨",
      queries: ["sklep budowlany", "hardware store"]
    },
    bicycle_shop: {
      emoji: "🚲",
      queries: ["sklep rowerowy", "serwis rowerowy", "bicycle shop"]
    },
    bookstore: { emoji: "📚", queries: ["księgarnia", "bookstore"] },
    kiosk: { emoji: "🗞", queries: ["kiosk", "salonik prasowy"] },
    cinema: { emoji: "🎬", queries: ["kino", "cinema"] },
    theatre: { emoji: "🎭", queries: ["teatr", "theatre"] },
    library: { emoji: "📖", queries: ["biblioteka", "library"] },
    zoo: { emoji: "🦁", queries: ["zoo", "ogród zoologiczny"] },
    nightclub: {
      emoji: "🪩",
      queries: ["klub nocny", "dyskoteka", "nightclub"]
    },
    beach: { emoji: "🏖", queries: ["plaża", "beach"] },
    playground: {
      emoji: "🛝",
      queries: ["plac zabaw", "playground"]
    },
    gym: { emoji: "🏋", queries: ["siłownia", "gym", "klub fitness"] },
    swimming_pool: {
      emoji: "🏊",
      queries: ["basen", "pływalnia", "swimming pool"]
    },
    school: { emoji: "🏫", queries: ["szkoła", "school"] },
    kindergarten: {
      emoji: "🧸",
      queries: ["przedszkole", "kindergarten"]
    },
    university: {
      emoji: "🎓",
      queries: ["uniwersytet", "uczelnia", "university"]
    },
    church: { emoji: "⛪", queries: ["kościół", "church"] },
    police: {
      emoji: "👮",
      queries: ["komisariat policji", "police station"]
    },
    fire_station: {
      emoji: "🚒",
      queries: ["straż pożarna", "fire station"]
    },
    town_hall: {
      emoji: "🏢",
      queries: ["urząd miasta", "urząd gminy", "town hall"]
    },
    courthouse: { emoji: "⚖️", queries: ["sąd", "courthouse"] },
    homeless_shelter: {
      emoji: "🏠",
      queries: [
        "noclegownia",
        "ogrzewalnia",
        "dom dla bezdomnych",
        "homeless shelter"
      ],
      overpassTags: [
        [["amenity", "social_facility"], ["social_facility", "shelter"]]
      ]
    },
    soup_kitchen: {
      emoji: "🍲",
      queries: [
        "jadłodajnia",
        "kuchnia dla potrzebujących",
        "soup kitchen"
      ]
    },
    public_shower: {
      emoji: "🚿",
      queries: ["prysznice publiczne", "public showers"],
      overpassTags: [[["amenity", "shower"]]]
    },
    drinking_water: {
      emoji: "🚰",
      queries: ["źródełko wody pitnej", "drinking water"],
      overpassTags: [[["amenity", "drinking_water"]]]
    },
    social_services: {
      emoji: "🤝",
      queries: [
        "ośrodek pomocy społecznej",
        "punkt pomocy",
        "social services"
      ]
    }
  };

  function renderDiscoverCategoryButtons() {
    if (!ctx.el.discoverCategories) return;

    const t = ctx.text[ctx.state.language];
    const fragment = document.createDocumentFragment();

    for (const group of DISCOVER_CATEGORY_GROUPS) {
      const groupEl = document.createElement("div");
      groupEl.className = "discover-category-group";

      const title = document.createElement("h4");
      title.className = "discover-category-group-title";
      title.textContent =
        t.discoverCategoryGroups?.[group.id] || group.id;
      groupEl.appendChild(title);

      const grid = document.createElement("div");
      grid.className = "discover-category-grid";

      for (const categoryId of group.categories) {
        const category = DISCOVER_CATEGORIES[categoryId];
        if (!category) continue;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.discoverCategory = categoryId;

        const emoji = document.createElement("span");
        emoji.className = "discover-category-emoji";
        emoji.textContent = category.emoji;

        const label = document.createElement("span");
        label.textContent =
          t.discoverCategories?.[categoryId] || categoryId;

        button.append(emoji, label);
        button.setAttribute("aria-label", label.textContent);
        button.addEventListener("click", () => {
          runDiscoverCategory(categoryId, button);
        });

        grid.appendChild(button);
      }

      groupEl.appendChild(grid);
      fragment.appendChild(groupEl);
    }

    ctx.el.discoverCategories.innerHTML = "";
    ctx.el.discoverCategories.appendChild(fragment);
  }

  async function runDiscoverCategory(categoryId, sourceButton) {
    const category = DISCOVER_CATEGORIES[categoryId];
    if (!category) return;

    const t = ctx.text[ctx.state.language];

    for (const button of ctx.el.discoverCategories.querySelectorAll(
      "[data-discover-category]"
    )) {
      button.classList.toggle(
        "is-active",
        button === sourceButton
      );
    }

    // Zbyt duże oddalenie daje zbyt ogólne wyniki.
    if (ctx.map.getZoom() < 10) {
      ctx.el.discoverStatus.hidden = false;
      ctx.el.discoverStatus.textContent = t.discoverZooming;

      ctx.map.easeTo({
        center: ctx.map.getCenter(),
        zoom: 12,
        bearing: 180,
        duration: 650
      });

      ctx.map.once("moveend", () => {
        runDiscoverCategory(categoryId, sourceButton);
      });
      return;
    }

    clearDiscoverResults(false);

    ctx.el.discoverStatus.hidden = false;
    ctx.el.discoverStatus.textContent = t.discoverSearching;

    const cacheKey = buildCacheKey(categoryId);
    const cached = getCachedResults(cacheKey);
    if (cached) {
      if (!cached.length) {
        ctx.el.discoverStatus.textContent = t.discoverEmpty;
        return;
      }
      renderDiscoverResults(cached, { ...category, id: categoryId });
      ctx.el.discoverStatus.textContent = t.discoverFound(cached.length);
      if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = false;
      return;
    }

    ctx.state.exploreRequestController?.abort();
    const requestController = new AbortController();
    ctx.state.exploreRequestController = requestController;

    // Wyklucza duplikaty między dwoma źródłami po tym samym obiekcie
    // OSM (ten sam osm_type+osm_id może wyjść i z Nominatim, i z
    // Overpass dla tej samej kategorii).
    function mergeUnique(base, extra) {
      const seen = new Set(
        base.map(place => `${place.type}:${place.id}`)
      );
      const merged = base.slice();
      for (const place of extra) {
        const key = `${place.type}:${place.id}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(place);
      }
      return merged;
    }

    try {
      const hasBothSources =
        Boolean(category.overpassTags) &&
        Boolean(category.queries?.length);

      if (!hasBothSources) {
        const places = category.overpassTags
          ? await fetchDiscoverFromOverpass(category, requestController.signal)
          : await fetchDiscoverFromNominatim(category, requestController.signal);

        setCachedResults(cacheKey, places);

        if (!places.length) {
          ctx.el.discoverStatus.textContent = t.discoverEmpty;
          return;
        }

        renderDiscoverResults(places, { ...category, id: categoryId });
        ctx.el.discoverStatus.textContent = t.discoverFound(places.length);
        if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = false;
        return;
      }

      // Dwie fazy: najpierw szybki podgląd z Nominatim (jeśli coś
      // znajdzie), potem w tle dopełnienie z Overpass - przydatne dla
      // kategorii jak "sklepy", gdzie Nominatim zwykle coś sensownego
      // zwraca (markety), a Overpass dokłada to, czego tekstowe
      // wyszukiwanie nie znajduje (np. Żabka).
      let shown = [];

      try {
        shown = await fetchDiscoverFromNominatim(
          category,
          requestController.signal
        );
        if (
          requestController === ctx.state.exploreRequestController &&
          shown.length
        ) {
          renderDiscoverResults(shown, { ...category, id: categoryId });
          ctx.el.discoverStatus.textContent = t.discoverFound(shown.length);
          if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = false;
        }
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn("Podgląd Nominatim nie powiódł się.", error);
      }

      const overpassPlaces = await fetchDiscoverFromOverpass(
        category,
        requestController.signal
      );

      // Kolejne, nowsze wyszukanie mogło już wystartować - nie
      // nadpisuj jego wyników spóźnioną odpowiedzią tego tutaj.
      if (requestController !== ctx.state.exploreRequestController) {
        return;
      }

      const places = mergeUnique(shown, overpassPlaces);
      setCachedResults(cacheKey, places);

      if (!places.length) {
        ctx.el.discoverStatus.textContent = t.discoverEmpty;
        return;
      }

      renderDiscoverResults(places, { ...category, id: categoryId });
      ctx.el.discoverStatus.textContent = t.discoverFound(places.length);
      if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = false;
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);
      ctx.el.discoverStatus.textContent = t.exploreError;
      if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = true;
    } finally {
      if (requestController === ctx.state.exploreRequestController) {
        ctx.state.exploreRequestController = null;
      }
    }
  }

  async function fetchDiscoverFromNominatim(category, signal) {
    const bounds = ctx.map.getBounds();

    // Nominatim expects: left, top, right, bottom.
    const viewbox = [
      bounds.getWest(),
      bounds.getNorth(),
      bounds.getEast(),
      bounds.getSouth()
    ].join(",");

    const collected = [];
    const seen = new Set();

    for (const query of category.queries) {
      const url = new URL(ctx.CONFIG.search.endpoint);
      url.searchParams.set("q", query);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("bounded", "1");
      url.searchParams.set("viewbox", viewbox);
      url.searchParams.set(
        "limit",
        String(Math.min(15, ctx.CONFIG.search.exploreLimit))
      );
      url.searchParams.set("accept-language", ctx.state.language);

      const response = await fetch(url, {
        signal,
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Nominatim HTTP ${response.status}`);
      }

      const items = await response.json();

      for (const item of items) {
        const lat = Number(item.lat);
        const lon = Number(item.lon);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          continue;
        }

        const key =
          `${item.osm_type || ""}:${item.osm_id || ""}` ||
          `${lat.toFixed(5)},${lon.toFixed(5)}`;

        if (seen.has(key)) continue;
        seen.add(key);

        collected.push({
          id: item.osm_id || "",
          type: item.osm_type || "",
          lat,
          lon,
          category: item.category || "",
          placeClass: item.class || "",
          placeType: item.type || "",
          tags: {
            ...(item.extratags || {}),
            name:
              item.namedetails?.["name:pl"] ||
              item.namedetails?.name ||
              item.name ||
              ctx.getSearchResultTitle(item) ||
              item.display_name,
            brand:
              item.extratags?.brand ||
              "",
            amenity:
              item.extratags?.amenity ||
              (
                item.class === "amenity"
                  ? item.type
                  : ""
              ),
            shop:
              item.extratags?.shop ||
              (
                item.class === "shop"
                  ? item.type
                  : ""
              ),
            tourism:
              item.extratags?.tourism ||
              (
                item.class === "tourism"
                  ? item.type
                  : ""
              ),
            leisure:
              item.extratags?.leisure ||
              (
                item.class === "leisure"
                  ? item.type
                  : ""
              )
          },
          address: {
            ...(item.address || {})
          },
          namedetails: {
            ...(item.namedetails || {})
          }
        });

        if (collected.length >= ctx.CONFIG.search.exploreLimit) {
          return collected;
        }
      }
    }

    return collected;
  }

  // Niektóre kategorie (butelkomaty, prysznice publiczne, źródełka
  // wody itp.) prawie nigdy nie mają własnej nazwy w OSM - to są
  // ustrukturyzowane atrybuty (np. amenity=drinking_water) przypięte
  // do punktu, nie tekst w polu "nazwa". Wyszukiwanie tekstowe przez
  // Nominatim (fetchDiscoverFromNominatim) nie ma więc czego znaleźć.
  // Dla takich kategorii pytamy zamiast tego Overpass wprost o
  // konkretne tagi w bieżącym widoku mapy.
  async function fetchDiscoverFromOverpass(category, signal) {
    const bounds = ctx.map.getBounds();
    // Overpass QL bbox: south,west,north,east.
    const bbox = [
      bounds.getSouth(),
      bounds.getWest(),
      bounds.getNorth(),
      bounds.getEast()
    ].join(",");

    const clauses = category.overpassTags
      .map(tagPairs => {
        const filters = tagPairs
          .map(([key, value]) => `["${key}"="${value}"]`)
          .join("");
        return `nwr${filters}(${bbox});`;
      })
      .join("");

    const query =
      `[out:json][timeout:15];(${clauses});out center tags;`;

    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.private.coffee/api/interpreter"
    ];

    // Zabezpieczenie na wypadek, gdyby pojedynczy fetch() nie
    // zareagował poprawnie na AbortController (rzadkie, ale zdarza
    // się w niektórych przeglądarkach/warunkach sieciowych) - bez
    // tego appka mogłaby utknąć na "wyszukiwanie..." bez końca,
    // wymagając odświeżenia strony. Cała próba (wszystkie serwery
    // razem) ma sztywny, ostateczny limit czasu.
    let hardTimeoutId;
    const hardTimeout = new Promise((_, reject) => {
      hardTimeoutId = setTimeout(
        () => reject(new Error("Przekroczono ostateczny limit czasu Overpass.")),
        20000
      );
    });

    const attemptAllEndpoints = (async () => {
      let lastError = null;
      let data = null;

      for (const endpoint of endpoints) {
        const attemptController = new AbortController();
        const timeoutId = setTimeout(
          () => attemptController.abort(),
          6000
        );
        const onOuterAbort = () => attemptController.abort();
        signal?.addEventListener("abort", onOuterAbort);

        try {
          const response = await fetch(endpoint, {
            method: "POST",
            signal: attemptController.signal,
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: "data=" + encodeURIComponent(query)
          });

          if (!response.ok) {
            throw new Error(`Overpass HTTP ${response.status} (${endpoint})`);
          }

          data = await response.json();
          break;
        } catch (error) {
          if (error.name === "AbortError" && signal?.aborted) throw error;
          lastError = error;
          console.warn("Serwer Overpass zawiódł, próbuję kolejnego.", error);
        } finally {
          clearTimeout(timeoutId);
          signal?.removeEventListener("abort", onOuterAbort);
        }
      }

      if (!data) {
        throw lastError || new Error("Wszystkie serwery Overpass zawiodły.");
      }

      return data;
    })();

    let data;
    try {
      data = await Promise.race([attemptAllEndpoints, hardTimeout]);
    } finally {
      clearTimeout(hardTimeoutId);
    }

    const results = normalizeDiscoverElements(data.elements || []);
    return results.slice(0, ctx.CONFIG.search.exploreLimit);
  }

  function normalizeDiscoverElements(elements) {
    const seen = new Set();
    const results = [];

    for (const element of elements) {
      const lat = Number(
        element.lat ?? element.center?.lat
      );
      const lon = Number(
        element.lon ?? element.center?.lon
      );

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        continue;
      }

      const key = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      results.push({
        id: element.id || "",
        type: element.type || "",
        lat,
        lon,
        category: "",
        placeClass: "",
        placeType: "",
        tags: {
          ...(element.tags || {})
        },
        address: {},
        namedetails: {}
      });
    }

    return results;
  }


  function getDiscoverPlaceClassification(
    place,
    category
  ) {
    const tags = place.tags || {};

    const type =
      place.placeType ||
      tags.amenity ||
      tags.shop ||
      tags.tourism ||
      tags.leisure ||
      tags.railway ||
      tags.natural ||
      category.id ||
      "";

    const placeClass =
      place.placeClass ||
      (
        tags.amenity
          ? "amenity"
          : tags.shop
            ? "shop"
            : tags.tourism
              ? "tourism"
              : tags.leisure
                ? "leisure"
                : tags.railway
                  ? "railway"
                  : tags.natural
                    ? "natural"
                    : ""
      );

    return {
      type,
      class: placeClass,
      category:
        place.category ||
        category.id ||
        type
    };
  }

  // Wyniki z Overpass mają adres tylko w surowych tagach addr:* (nie
  // w gotowym obiekcie address jak Nominatim) - ta funkcja ujednolica
  // oba przypadki w jeden tekst adresu, używany zarówno w liście
  // wyników jak i w otwartym panelu miejsca.
  function buildDiscoverPlaceAddress(place) {
    const tags = place.tags || {};
    const address = {
      ...(place.address || {}),
      road: tags["addr:street"] || place.address?.road || "",
      house_number:
        tags["addr:housenumber"] || place.address?.house_number || "",
      postcode: tags["addr:postcode"] || place.address?.postcode || "",
      city:
        tags["addr:city"] ||
        tags["addr:suburb"] ||
        tags["addr:place"] ||
        place.address?.city ||
        ""
    };

    // Celowo BEZ display_name - jeśli nie ma prawdziwego adresu
    // (street/city), OMAP_ADDRESS_SERVICE spada na display_name jako
    // "coś opisowego zamiast nic", co dla samego pola adresu
    // oznaczałoby pokazanie nazwy miejsca jako jego "adresu". Tu
    // wolimy pustkę - nazwa miejsca ma swoje własne, osobne pole.
    return window.OMAP_ADDRESS_SERVICE?.format(
      { address },
      { language: ctx.state.language }
    ) || "";
  }

  function renderDiscoverResults(places, category) {
    const t = ctx.text[ctx.state.language];
    window.OMAP_PHOTO_SERVICE?.preload(places);

    for (const marker of ctx.state.exploreMarkers) {
      marker.remove();
    }
    ctx.state.exploreMarkers = [];

    ctx.el.discoverResultsList?.replaceChildren();

    const listFragment = document.createDocumentFragment();

    places.forEach((place, index) => {
      const element = document.createElement("button");
      element.type = "button";
      element.className = "explore-marker";
      element.textContent = category.emoji;
      element.title =
        place.tags.name ||
        place.tags.brand ||
        category.emoji;

      const marker = new maplibregl.Marker({
        element,
        anchor: "center"
      })
        .setLngLat([place.lon, place.lat])
        .addTo(ctx.map);

      const openPlace = () => {
        const classification =
          getDiscoverPlaceClassification(
            place,
            category
          );

        const rawPlace = {
          place_id: `discover:${place.type || "node"}:${place.id || index}`,
          osm_type: place.type || "",
          osm_id: place.id || "",
          lon: Number(place.lon),
          lat: Number(place.lat),
          name:
            place.tags.name ||
            place.tags.brand ||
            `${category.emoji} ${index + 1}`,
          class: classification.class,
          type: classification.type,
          category: classification.category,
          address: {
            ...(place.address || {}),
            road:
              place.tags["addr:street"] ||
              place.address?.road ||
              "",
            house_number:
              place.tags["addr:housenumber"] ||
              place.address?.house_number ||
              "",
            postcode:
              place.tags["addr:postcode"] ||
              place.address?.postcode ||
              "",
            city:
              place.tags["addr:city"] ||
              place.tags["addr:suburb"] ||
              place.tags["addr:place"] ||
              place.address?.city ||
              ""
          },
          extratags: {
            ...place.tags
          },
          namedetails: {
            ...(place.namedetails || {})
          },
          source: "discover",
          provider: "discover"
        };

        // Dołącz custom name jeśli istnieje
        const placeNameKey = ctx.getPlaceNameKey(place, { lat: Number(place.lat), lng: Number(place.lon) });
        const customName = ctx.state.customPlaceNames[placeNameKey];
        if (customName) {
          rawPlace.customName = customName;
          rawPlace.name = customName;
        }

        window.OMAP_PLACE_SERVICE.open(
          rawPlace,
          {
            source: "discover",
            metadata: {
              origin: "discover-panel"
            }
          }
        );
      };

      element.addEventListener("click", event => {
        event.stopPropagation();
        openPlace();
      });

      ctx.state.exploreMarkers.push(marker);

      if (ctx.el.discoverResultsList) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "discover-result-button";

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = category.emoji;

        const copy = document.createElement("span");
        const name = document.createElement("strong");
        const addressText = buildDiscoverPlaceAddress(place);
        const categoryLabel =
          t.discoverCategories?.[category.id] || category.id;
        name.textContent =
          place.tags.name ||
          place.tags.brand ||
          addressText ||
          `${categoryLabel} ${index + 1}`;

        const addressLine = document.createElement("small");
        addressLine.className = "discover-result-address";
        // Adres już pokazany w nazwie (brak lepszej etykiety) - nie
        // powielaj go w osobnej linii pod spodem.
        const showAddressLine =
          addressText && name.textContent !== addressText;
        addressLine.textContent = addressText;
        if (!showAddressLine) addressLine.hidden = true;

        const coordinates = document.createElement("small");
        coordinates.textContent =
          `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`;

        copy.append(name, addressLine, coordinates);
        button.append(icon, copy);
        button.addEventListener("click", openPlace);
        item.appendChild(button);
        listFragment.appendChild(item);
      }
    });

    if (ctx.el.discoverResultsList) {
      ctx.el.discoverResultsList.appendChild(listFragment);
      ctx.el.discoverResultsList.hidden = false;
      ctx.scrollPanelToElement(
        ctx.el.discoverPanel,
        ctx.el.discoverResultsList
      );
    }
  }

  function clearDiscoverResults(resetInterface = true) {
    ctx.state.exploreRequestController?.abort();
    ctx.state.exploreRequestController = null;

    for (const marker of ctx.state.exploreMarkers) {
      marker.remove();
    }
    ctx.state.exploreMarkers = [];

    if (ctx.el.discoverResultsList) {
      ctx.el.discoverResultsList.replaceChildren();
      ctx.el.discoverResultsList.hidden = true;
    }

    if (!resetInterface) return;

    if (ctx.el.discoverStatus) {
      ctx.el.discoverStatus.hidden = true;
      ctx.el.discoverStatus.textContent = "";
    }

    if (ctx.el.discoverClear) {
      if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = true;
    }

    if (ctx.el.discoverCategories) {
      for (const button of ctx.el.discoverCategories.querySelectorAll(
        "[data-discover-category]"
      )) {
        button.classList.remove("is-active");
      }
    }
  }

  window.OMAP_DISCOVER = {
    configure,
    CATEGORIES: DISCOVER_CATEGORIES,
    CATEGORY_GROUPS: DISCOVER_CATEGORY_GROUPS,
    renderCategoryButtons: renderDiscoverCategoryButtons,
    run: runDiscoverCategory,
    clear: clearDiscoverResults
  };
})();
