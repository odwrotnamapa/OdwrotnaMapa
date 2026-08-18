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

  // Usuwa polskie znaki diakrytyczne i normalizuje wielkość liter,
  // zeby wyszukiwanie kategorii dzialalo niezaleznie od "ą" vs "a" itp.
  function normalizeSearchText(text) {
    return String(text || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  function filterDiscoverCategories(query) {
    if (!ctx.el.discoverCategories) return;

    const normalizedQuery = normalizeSearchText(query);
    ctx.el.discoverSearchClear && (ctx.el.discoverSearchClear.hidden = !normalizedQuery);

    let anyVisible = false;
    const groups = ctx.el.discoverCategories.querySelectorAll(
      ".discover-category-group"
    );
    for (const groupEl of groups) {
      let groupHasVisible = false;
      for (const button of groupEl.querySelectorAll(
        "[data-discover-category]"
      )) {
        const label = button.dataset.discoverSearchLabel || "";
        const matches = !normalizedQuery || label.includes(normalizedQuery);
        button.hidden = !matches;
        if (matches) {
          groupHasVisible = true;
          anyVisible = true;
        }
      }
      groupEl.hidden = !groupHasVisible;
    }

    if (ctx.el.discoverSearchEmpty) {
      ctx.el.discoverSearchEmpty.hidden = anyVisible || !normalizedQuery;
    }
  }

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

        button.dataset.discoverSearchLabel = normalizeSearchText(
          label.textContent
        );

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

    // Filtr wyszukiwania spiety raz (renderCategoryButtons wywolywane
    // jest tylko przy starcie appki), zachowuje wpisana fraze przy
    // ewentualnym ponownym renderze (np. zmiana jezyka).
    if (ctx.el.discoverSearch && !ctx.el.discoverSearch.dataset.searchBound) {
      ctx.el.discoverSearch.dataset.searchBound = "1";
      ctx.el.discoverSearch.addEventListener("input", () => {
        filterDiscoverCategories(ctx.el.discoverSearch.value);
      });
      ctx.el.discoverSearchClear?.addEventListener("click", () => {
        ctx.el.discoverSearch.value = "";
        ctx.el.discoverSearch.focus();
        filterDiscoverCategories("");
      });
    }
    filterDiscoverCategories(ctx.el.discoverSearch?.value || "");
  }

  // Mapowanie kategorii Odkrywaj na wartości "subclass" ze schematu
  // OpenMapTiles (ten sam schemat co kafelki wektorowe, które już
  // pobieracie przez Mapę offline) - pozwala znaleźć wyniki lokalnie,
  // z samej już wyrenderowanej warstwy mapy, bez sieci. To NIE jest
  // 1:1 z Overpass/Nominatim: ogólny bazowy schemat mapy zawiera tylko
  // podzbiór popularnych kategorii OSM, więc część (np. "pizza" po
  // cuisine, czy bardzo niszowe jak "prysznice publiczne") nie ma
  // tu żadnego odpowiednika i po prostu nie zwróci nic offline -
  // to świadome, uczciwe ograniczenie, nie błąd.
  const DISCOVER_LOCAL_SUBCLASS_MAP = {
    restaurant: ["restaurant"],
    cafe: ["cafe"],
    bar: ["bar", "pub", "biergarten"],
    fast_food: ["fast_food", "food_court"],
    bakery: ["bakery"],
    confectionery: ["confectionery", "chocolate"],
    ice_cream: ["ice_cream"],
    hotel: ["hotel", "motel", "guest_house", "hostel"],
    campsite: ["camp_site", "caravan_site"],
    shop: ["supermarket", "convenience", "grocery", "department_store"],
    mall: ["mall", "department_store"],
    clothes: ["clothes"],
    shoe_shop: ["shoes"],
    electronics: ["electronics", "computer", "mobile_phone", "hifi"],
    furniture: ["furniture"],
    pet_shop: ["pet"],
    florist: ["florist"],
    jewelry: ["jewelry"],
    sporting_goods: ["sports"],
    hardware_store: ["doityourself", "hardware"],
    bicycle_shop: ["bicycle"],
    bookstore: ["books"],
    kiosk: ["kiosk", "newsagent"],
    pharmacy: ["pharmacy"],
    drugstore: ["chemist", "cosmetics"],
    hospital: ["hospital"],
    dentist: ["dentist"],
    optician: ["optician"],
    vet: ["veterinary"],
    bank: ["bank"],
    post_office: ["post_office"],
    parcel_locker: ["parcel_locker"],
    hairdresser: ["hairdresser"],
    pawnbroker: ["pawnbroker"],
    locksmith: ["locksmith"],
    car_wash: ["car_wash"],
    laundry: ["laundry", "dry_cleaning"],
    toilets: ["toilets"],
    bus_stop: ["bus_stop"],
    railway_station: ["railway_station", "station"],
    fuel: ["fuel"],
    ev_charging: ["charging_station"],
    taxi: ["taxi"],
    airport: ["airport", "aerodrome"],
    car_rental: ["car_rental"],
    bicycle_rental: ["bicycle_rental"],
    parking: ["parking"],
    car_repair: ["car_repair"],
    museum: ["museum"],
    art_gallery: ["gallery", "art"],
    viewpoint: ["viewpoint"],
    monument: ["monument", "memorial"],
    bowling: ["bowling_alley"],
    aquarium: ["aquarium"],
    cinema: ["cinema"],
    theatre: ["theatre"],
    library: ["library"],
    nightclub: ["nightclub"],
    zoo: ["zoo"],
    park: ["park", "garden"],
    amusement_park: ["theme_park"],
    beach: ["beach"],
    playground: ["playground"],
    gym: ["fitness_centre"],
    swimming_pool: ["swimming_pool", "water_park"],
    school: ["school"],
    kindergarten: ["kindergarten"],
    university: ["university", "college"],
    church: ["place_of_worship"],
    police: ["police"],
    fire_station: ["fire_station"],
    town_hall: ["town_hall"],
    courthouse: ["courthouse"],
    homeless_shelter: ["shelter"],
    drinking_water: ["drinking_water"]
  };

  // Szuka POI bezpośrednio w już wyrenderowanej/pobranej warstwie
  // wektorowej mapy (queryRenderedFeatures na całym widocznym
  // obszarze) - zero zapytań do sieci. Działa tylko tam, gdzie kafelki
  // są już na ekranie (czyli w praktyce: w obszarach pobranych przez
  // Mapę offline). Zwraca dane w tym samym kształcie co
  // fetchDiscoverFromNominatim/Overpass, żeby wpasować się w ten sam
  // render/cache bez zmian w renderDiscoverResults.
  function waitForMapIdle() {
    return new Promise(resolve => {
      ctx.map.once("idle", resolve);
    });
  }

  async function queryLocalPoiFeatures(categoryId) {
    const subclasses = DISCOVER_LOCAL_SUBCLASS_MAP[categoryId];
    if (!subclasses?.length) return [];

    // Warstwa POI w schemacie OpenMapTiles jest przycinana wg pola
    // "rank" na niższych zoomach - mniej ważne miejsca po prostu nie
    // są jeszcze wyrenderowane, mimo że dane aż do z14 są już
    // pobrane w tle. Zanim przeszukamy ekran, dociągamy widok do
    // sufitu pobranych danych (z14), żeby zobaczyć WSZYSTKO co jest
    // zapisane dla tego miejsca, nie tylko okrojony podgląd - tak
    // samo jak istniejący auto-zoom przy zoomie < 10 wyżej, tylko
    // dalej.
    if (ctx.map.getZoom() < 14) {
      ctx.map.easeTo({
        center: ctx.map.getCenter(),
        zoom: 14,
        bearing: ctx.map.getBearing(),
        pitch: ctx.map.getPitch(),
        duration: 300
      });
      await new Promise(resolve => {
        ctx.map.once("moveend", resolve);
      });
      await waitForMapIdle();
    }

    let features;
    try {
      features = ctx.map.queryRenderedFeatures();
    } catch (error) {
      console.error(error);
      return [];
    }

    const collected = [];
    const seen = new Set();

    for (const feature of features) {
      if (feature.geometry?.type !== "Point") continue;
      const props = feature.properties || {};
      if (!props.name) continue;
      // Sprawdzamy zarówno "class" jak i "subclass" - reszta kodu w
      // tej appce (findNearestPoiFeature w app.js) potwierdzone
      // czyta tylko "class", więc "subclass" mogło się okazać
      // nieobecne/inne niż zakładałem w ogólnej dokumentacji
      // OpenMapTiles. Sprawdzenie obu pól jest bezpieczniejsze niż
      // poleganie tylko na niezweryfikowanym "subclass".
      const candidates = [props.subclass, props.class].filter(Boolean);
      if (!candidates.some(value => subclasses.includes(value))) continue;

      const [lon, lat] = feature.geometry.coordinates;
      const key = `${lon.toFixed(6)},${lat.toFixed(6)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      collected.push({
        id: `local-tile:${key}`,
        type: "node",
        lat,
        lon,
        category: props.class || categoryId,
        placeClass: props.class || "",
        placeType: props.subclass || "",
        tags: { name: props.name },
        address: {},
        namedetails: {}
      });
    }

    return collected;
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

      // Sieć zawiodła - zanim pokażemy błąd, spróbujmy lokalnego
      // fallbacku z już wyrenderowanej warstwy wektorowej (patrz
      // queryLocalPoiFeatures wyżej). Działa offline w obszarach
      // pobranych przez Mapę offline, dla kategorii które mają
      // odpowiednik w DISCOVER_LOCAL_SUBCLASS_MAP.
      ctx.el.discoverStatus.textContent = t.discoverSearching;
      const localPlaces = await queryLocalPoiFeatures(categoryId);
      if (localPlaces.length) {
        setCachedResults(cacheKey, localPlaces);
        renderDiscoverResults(localPlaces, { ...category, id: categoryId });
        ctx.el.discoverStatus.textContent = t.discoverFoundOffline
          ? t.discoverFoundOffline(localPlaces.length)
          : t.discoverFound(localPlaces.length);
        if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = false;
        return;
      }

      ctx.el.discoverStatus.textContent = t.exploreError;
      if (ctx.el.discoverClear) ctx.el.discoverClear.hidden = true;
    } finally {
      if (requestController === ctx.state.exploreRequestController) {
        ctx.state.exploreRequestController = null;
      }
    }
  }

  // Odległość w km między dwoma punktami (Haversine) - używana do
  // wyliczenia promienia zapytania do Ticketmastera na podstawie
  // aktualnie widocznego obszaru mapy (od środka do rogu widoku).
  function haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const toRad = deg => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(a));
  }

  // Sekcja "Wydarzenia" nie ma odpowiednika w OSM, więc zamiast
  // Nominatim/Overpass pyta zewnętrzne API wydarzeń (przez proxy
  // Workera - CONFIG.proxy.baseUrl, patrz config.js i
  // cloudflare-sync-worker/sync-worker.js - to Worker dokleja klucz,
  // appka go nie zna) o wydarzenia w promieniu wokół środka aktualnie
  // widocznego obszaru mapy. Dwa źródła (patrz fetchDiscoverEvents()
  // niżej, która odpytuje oba naraz i łączy wyniki):
  // - Ticketmaster Discovery API (ta funkcja) - duże, komercyjne
  //   koncerty/sport/teatr ze sprzedażą biletów.
  // - PredictHQ (fetchDiscoverEventsPredictHQ()) - agregator setek
  //   źródeł, więc dokłada mniejsze/lokalne wydarzenia, festiwale,
  //   konferencje itp., których Ticketmaster nie widzi.
  // Obie zwracają obiekty w kształcie zgodnym z resztą discover-service
  // (lat/lon/tags.name), plus dodatkowe pola
  // isEvent/eventUrl/eventDateLabel/venueName/eventSource używane przez
  // renderDiscoverResults() do innego renderowania i otwierania.
  async function fetchDiscoverEventsTicketmaster(signal) {
    const eventsConfig = ctx.CONFIG.events || {};
    const proxyBaseUrl = ctx.CONFIG.proxy?.baseUrl;
    if (!proxyBaseUrl) {
      throw new Error("Events proxy not configured");
    }
    const bounds = ctx.map.getBounds();
    const center = ctx.map.getCenter();

    const radiusKm = Math.min(
      500,
      Math.max(
        5,
        Math.ceil(
          haversineKm(
            center.lat,
            center.lng,
            bounds.getNorth(),
            bounds.getEast()
          )
        )
      )
    );

    const url = new URL(`${proxyBaseUrl}/events`);
    url.searchParams.set("latlong", `${center.lat},${center.lng}`);
    url.searchParams.set("radius", String(radiusKm));
    url.searchParams.set("unit", "km");
    url.searchParams.set(
      "countryCode",
      eventsConfig.countryCode || "PL"
    );
    url.searchParams.set("size", String(eventsConfig.limit || 30));
    url.searchParams.set("sort", "date,asc");
    url.searchParams.set(
      "locale",
      ctx.state.language === "pl" ? "pl-pl" : "en-us"
    );
    // Tylko nadchodzące wydarzenia - Discovery API domyślnie
    // potrafi zwracać też te, które już się odbyły.
    url.searchParams.set(
      "startDateTime",
      new Date().toISOString().replace(/\.\d{3}Z$/, "Z")
    );

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`Ticketmaster HTTP ${response.status}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    const results = [];

    for (const event of events) {
      const venue = event._embedded?.venues?.[0];
      const lat = Number(venue?.location?.latitude);
      const lon = Number(venue?.location?.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const startDate = event.dates?.start?.localDate || "";
      const startTime = event.dates?.start?.localTime || "";
      const dateLabel = startTime
        ? `${startDate} ${startTime.slice(0, 5)}`
        : startDate;

      // Ticketmaster zwraca ten sam kadr w kilku rozdzielczościach -
      // wybieramy najbliższą docelowej szerokości karty (16:9,
      // ~izbliżone do 200-400px), żeby nie ściągać niepotrzebnie
      // dużych plików do małej miniaturki.
      const image = (event.images || [])
        .filter(img => img?.url && img.width)
        .sort(
          (a, b) => Math.abs(a.width - 300) - Math.abs(b.width - 300)
        )[0];

      results.push({
        id: `tm-${event.id}`,
        type: "event",
        lat,
        lon,
        category: "event",
        placeClass: "event",
        placeType: "event",
        isEvent: true,
        eventSource: "ticketmaster",
        eventUrl: event.url || "",
        eventDateLabel: dateLabel,
        eventImageUrl: image?.url || "",
        venueName: venue?.name || "",
        tags: {
          name: event.name || ""
        },
        address: {},
        namedetails: {}
      });
    }

    return results;
  }

  // PredictHQ Events API - drugie źródło sekcji "Wydarzenia" (patrz
  // komentarz nad fetchDiscoverEventsTicketmaster() wyżej). Też idzie
  // przez proxy Workera (endpoint /predicthq, sekret PREDICTHQ_TOKEN -
  // patrz cloudflare-sync-worker/sync-worker.js), z tych samych
  // powodów co Ticketmaster: appka nie powinna znać tokenu.
  // Dokumentacja promienia/kategorii/dat:
  // https://docs.predicthq.com/api/events/search-events
  async function fetchDiscoverEventsPredictHQ(signal) {
    const eventsConfig = ctx.CONFIG.events || {};
    const proxyBaseUrl = ctx.CONFIG.proxy?.baseUrl;
    if (!proxyBaseUrl) {
      throw new Error("Events proxy not configured");
    }
    const bounds = ctx.map.getBounds();
    const center = ctx.map.getCenter();

    const radiusKm = Math.min(
      500,
      Math.max(
        5,
        Math.ceil(
          haversineKm(
            center.lat,
            center.lng,
            bounds.getNorth(),
            bounds.getEast()
          )
        )
      )
    );

    const url = new URL(`${proxyBaseUrl}/predicthq`);
    url.searchParams.set("within", `${radiusKm}km@${center.lat},${center.lng}`);
    url.searchParams.set(
      "category",
      eventsConfig.predicthqCategories ||
        "concerts,festivals,performing-arts,community,expos,conferences,sports"
    );
    url.searchParams.set(
      "country",
      eventsConfig.countryCode || "PL"
    );
    url.searchParams.set("limit", String(eventsConfig.limit || 30));
    url.searchParams.set("sort", "rank");
    // Tylko nadchodzące wydarzenia (aktywne dziś lub później).
    url.searchParams.set(
      "active.gte",
      new Date().toISOString().slice(0, 10)
    );

    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`PredictHQ HTTP ${response.status}`);
    }

    const data = await response.json();
    const events = data.results || [];
    const results = [];

    for (const event of events) {
      const [lon, lat] = Array.isArray(event.location) ? event.location : [];
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

      const startDate = (event.start_local || event.start || "").slice(0, 10);
      const startTime = (event.start_local || event.start || "").slice(11, 16);
      const dateLabel = startTime ? `${startDate} ${startTime}` : startDate;

      const venue = (event.entities || []).find(
        entity => entity.type === "venue"
      );

      results.push({
        id: `phq-${event.id}`,
        type: "event",
        lat,
        lon,
        category: "event",
        placeClass: "event",
        placeType: "event",
        isEvent: true,
        eventSource: "predicthq",
        // PredictHQ to agregator/wywiad o wydarzeniach, nie sprzedawca
        // biletów - nie ma własnego adresu URL wydarzenia ani zdjęcia.
        eventUrl: "",
        eventDateLabel: dateLabel,
        eventImageUrl: "",
        venueName: venue?.name || "",
        tags: {
          name: event.title || ""
        },
        address: {},
        namedetails: {}
      });
    }

    return results;
  }

  // Odległość w km między dwoma punktami - używana do prostego
  // odrzucania duplikatów, gdy to samo wydarzenie pojawia się w obu
  // źródłach (np. duży festiwal jest i na Ticketmasterze, i w
  // PredictHQ).
  function isLikelyDuplicateEvent(a, b) {
    if (a.eventDateLabel.slice(0, 10) !== b.eventDateLabel.slice(0, 10)) {
      return false;
    }
    const distanceKm = haversineKm(a.lat, a.lon, b.lat, b.lon);
    if (distanceKm > 0.3) return false;

    const normalize = value =>
      value.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    const nameA = normalize(a.tags.name || "");
    const nameB = normalize(b.tags.name || "");
    if (!nameA || !nameB) return false;
    return nameA === nameB || nameA.includes(nameB) || nameB.includes(nameA);
  }

  // Odpytuje oba źródła wydarzeń naraz i łączy wyniki. Awaria
  // jednego źródła (np. brak skonfigurowanego PREDICTHQ_TOKEN na
  // Workerze) nie blokuje drugiego - sekcja po prostu pokaże mniej
  // wyników zamiast błędu, dopóki działa choć jedno źródło.
  async function fetchDiscoverEvents(signal) {
    const [ticketmaster, predicthq] = await Promise.allSettled([
      fetchDiscoverEventsTicketmaster(signal),
      fetchDiscoverEventsPredictHQ(signal)
    ]);

    if (
      ticketmaster.status === "rejected" &&
      predicthq.status === "rejected"
    ) {
      throw ticketmaster.reason;
    }

    const combined = [
      ...(ticketmaster.status === "fulfilled" ? ticketmaster.value : []),
      ...(predicthq.status === "fulfilled" ? predicthq.value : [])
    ];

    const deduped = [];
    for (const event of combined) {
      const isDuplicate = deduped.some(existing =>
        isLikelyDuplicateEvent(existing, event)
      );
      if (!isDuplicate) deduped.push(event);
    }

    deduped.sort((a, b) =>
      a.eventDateLabel.localeCompare(b.eventDateLabel)
    );

    return deduped;
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

  // ---------------------------------------------------------------
  // Sekcja "Wydarzenia w pobliżu" - w odróżnieniu od reszty kategorii
  // NIE wymaga kliknięcia. Jest częścią panelu Odkrywaj widoczną od
  // razu po jego otwarciu i odświeża się automatycznie przy ruchu
  // mapy (o ile panel jest otwarty). Dane z Ticketmaster Discovery
  // API - patrz fetchDiscoverEvents() i CONFIG.events w config.js.
  // ---------------------------------------------------------------

  const EVENTS_SECTION_CACHE_TTL_MS = 90000;
  const eventsSectionCache = new Map();
  let eventsSectionRequestController = null;
  let eventsMoveendBound = false;
  let eventsMoveendTimer = null;

  function buildEventsSectionCacheKey() {
    const bounds = ctx.map.getBounds();
    const round = value => Math.round(value * 1000) / 1000;
    return [
      round(bounds.getSouth()),
      round(bounds.getWest()),
      round(bounds.getNorth()),
      round(bounds.getEast())
    ].join("|");
  }

  function bindEventsSectionMoveendListener() {
    if (eventsMoveendBound || !ctx.map) return;
    eventsMoveendBound = true;

    // Debounce - użytkownik przesuwający/zoomujący mapę generuje
    // dużo "moveend" w krótkim czasie, a każde odświeżenie to
    // zapytanie sieciowe.
    ctx.map.on("moveend", () => {
      if (!ctx.el.discoverPanel || ctx.el.discoverPanel.hidden) return;
      clearTimeout(eventsMoveendTimer);
      eventsMoveendTimer = setTimeout(refreshDiscoverEventsSection, 400);
    });
  }

  async function refreshDiscoverEventsSection() {
    if (!ctx.el.discoverEventsSection) return;
    if (!ctx.el.discoverPanel || ctx.el.discoverPanel.hidden) return;

    bindEventsSectionMoveendListener();

    const t = ctx.text[ctx.state.language];

    function hideEventsListAndArrows() {
      ctx.el.discoverEventsList.hidden = true;
      ctx.el.discoverEventsList.replaceChildren();
      if (ctx.el.discoverEventsPrev) ctx.el.discoverEventsPrev.hidden = true;
      if (ctx.el.discoverEventsNext) ctx.el.discoverEventsNext.hidden = true;
    }

    if (!ctx.CONFIG.proxy?.baseUrl) {
      eventsSectionRequestController?.abort();
      hideEventsListAndArrows();
      ctx.el.discoverEventsStatus.hidden = false;
      ctx.el.discoverEventsStatus.textContent = t.discoverEventsMissingKey;
      return;
    }

    if (ctx.map.getZoom() < 10) {
      eventsSectionRequestController?.abort();
      hideEventsListAndArrows();
      ctx.el.discoverEventsStatus.hidden = false;
      ctx.el.discoverEventsStatus.textContent = t.discoverEventsZoomIn;
      return;
    }

    const cacheKey = buildEventsSectionCacheKey();
    const cached = eventsSectionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < EVENTS_SECTION_CACHE_TTL_MS) {
      renderDiscoverEventsSection(cached.events);
      return;
    }

    eventsSectionRequestController?.abort();
    const requestController = new AbortController();
    eventsSectionRequestController = requestController;

    ctx.el.discoverEventsStatus.hidden = false;
    ctx.el.discoverEventsStatus.textContent = t.discoverEventsLoading;
    hideEventsListAndArrows();

    try {
      const events = await fetchDiscoverEvents(requestController.signal);
      if (requestController !== eventsSectionRequestController) return;
      eventsSectionCache.set(cacheKey, { events, timestamp: Date.now() });
      renderDiscoverEventsSection(events);
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);
      ctx.el.discoverEventsStatus.hidden = false;
      ctx.el.discoverEventsStatus.textContent = t.discoverEventsError;
      hideEventsListAndArrows();
    } finally {
      if (requestController === eventsSectionRequestController) {
        eventsSectionRequestController = null;
      }
    }
  }

  function renderDiscoverEventsSection(events) {
    const t = ctx.text[ctx.state.language];

    if (!events.length) {
      ctx.el.discoverEventsStatus.hidden = false;
      ctx.el.discoverEventsStatus.textContent = t.discoverEventsEmpty;
      ctx.el.discoverEventsList.hidden = true;
      ctx.el.discoverEventsList.replaceChildren();
      if (ctx.el.discoverEventsPrev) ctx.el.discoverEventsPrev.hidden = true;
      if (ctx.el.discoverEventsNext) ctx.el.discoverEventsNext.hidden = true;
      return;
    }

    ctx.el.discoverEventsStatus.hidden = true;

    const fragment = document.createDocumentFragment();

    for (const event of events) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "discover-event-card";

      const thumb = document.createElement("span");
      thumb.className = "discover-event-thumb";
      if (event.eventImageUrl) {
        thumb.style.backgroundImage = `url("${event.eventImageUrl}")`;
      } else {
        // PredictHQ (w przeciwieństwie do Ticketmastera) to
        // agregator/wywiad o wydarzeniach, nie sprzedawca biletów -
        // nie dostarcza zdjęć promocyjnych. Zamiast zostawiać puste
        // miejsce, pokazujemy prostą ikonę-placeholder, żeby karty
        // z obu źródeł miały tę samą wysokość i wyglądały spójnie.
        thumb.classList.add("discover-event-thumb--placeholder");
        thumb.setAttribute("aria-hidden", "true");
        thumb.textContent = "📅";
      }
      button.appendChild(thumb);

      const body = document.createElement("span");
      body.className = "discover-event-body";

      const date = document.createElement("span");
      date.className = "discover-event-date";
      date.textContent = event.eventDateLabel || "";

      const name = document.createElement("strong");
      name.className = "discover-event-name";
      name.textContent = event.tags.name || "";

      const venue = document.createElement("small");
      venue.className = "discover-event-venue";
      venue.textContent = event.venueName || "";

      body.append(date, name, venue);
      button.appendChild(body);
      button.setAttribute(
        "aria-label",
        [event.tags.name, event.eventDateLabel, event.venueName]
          .filter(Boolean)
          .join(", ")
      );

      button.addEventListener("click", () => {
        // Wcześniej samo przewijało mapę (easeTo) i - tylko dla
        // Ticketmastera, bo tylko on ma eventUrl - otwierało bilety w
        // nowej karcie. Dla PredictHQ (brak eventUrl) nie działo się
        // nic poza przewinięciem: żaden znacznik, żaden panel miejsca -
        // wyglądało jak nic się nie stało. Teraz oba źródła przechodzą
        // przez ten sam OMAP_PLACE_SERVICE.open() co reszta wyników
        // Discover, więc dostają panel miejsca + wyśrodkowanie/zoom tak
        // jak każdy inny wynik (patrz adapter "discover" w app.js).
        const rawPlace = {
          place_id: event.id,
          lon: Number(event.lon),
          lat: Number(event.lat),
          name: event.tags.name || event.venueName || "",
          class: "event",
          type: "event",
          category: "event",
          address: {},
          extratags: {},
          namedetails: {},
          isEvent: true,
          eventSource: event.eventSource,
          eventUrl: event.eventUrl,
          eventDateLabel: event.eventDateLabel,
          eventImageUrl: event.eventImageUrl,
          venueName: event.venueName,
          website: event.eventUrl || "",
          source: "discover",
          provider: "discover"
        };

        window.OMAP_PLACE_SERVICE.open(rawPlace, {
          source: "discover",
          metadata: { origin: "discover-events" }
        });

        // Ticketmaster - dodatkowo otwórz bilety w nowej karcie, tak
        // jak dotychczas (PredictHQ nie ma eventUrl, więc tu nic się
        // nie dzieje dla tego źródła).
        if (event.eventUrl) {
          window.open(event.eventUrl, "_blank", "noopener");
        }
      });

      item.appendChild(button);
      fragment.appendChild(item);
    }

    ctx.el.discoverEventsList.replaceChildren();
    ctx.el.discoverEventsList.appendChild(fragment);
    ctx.el.discoverEventsList.hidden = false;

    bindEventsArrowControls();
    updateEventsArrowState();
  }

  // ---------------------------------------------------------------
  // Strzałki przewijania listy wydarzeń - natywne strzałki paska
  // przewijania przesuwają o mały, stały krok (i przy scroll-snap
  // czuć wyraźny opór), więc dajemy własne przyciski. Każde
  // kliknięcie przewija dokładnie o jedną kartę: znajduje kartę
  // najbliższą lewej/prawej krawędzi widocznego obszaru i przewija
  // tak, by to ona znalazła się na początku.
  // ---------------------------------------------------------------

  let eventsArrowsBound = false;

  function getEventsCardStep() {
    const list = ctx.el.discoverEventsList;
    const firstCard = list?.querySelector("li");
    if (!firstCard) return 176;

    const gap = parseFloat(getComputedStyle(list).columnGap || "8") || 8;
    return firstCard.getBoundingClientRect().width + gap;
  }

  function scrollEventsByCards(direction) {
    const list = ctx.el.discoverEventsList;
    if (!list) return;

    const step = getEventsCardStep();
    // Karta "najbliższa" krawędzi w kierunku przewijania mogła być
    // częściowo widoczna - zaokrąglenie do wielokrotności szerokości
    // karty gwarantuje, że po kliknięciu zawsze staje równo na
    // początku, zamiast zostawiać ją w połowie kadru.
    const target =
      direction > 0
        ? (Math.floor(list.scrollLeft / step) + 1) * step
        : (Math.ceil(list.scrollLeft / step) - 1) * step;

    list.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }

  function updateEventsArrowState() {
    const list = ctx.el.discoverEventsList;
    if (!list || !ctx.el.discoverEventsPrev || !ctx.el.discoverEventsNext) {
      return;
    }

    const canScroll = list.scrollWidth > list.clientWidth + 1;
    ctx.el.discoverEventsPrev.hidden = !canScroll;
    ctx.el.discoverEventsNext.hidden = !canScroll;
    if (!canScroll) return;

    const atStart = list.scrollLeft <= 1;
    const atEnd =
      list.scrollLeft + list.clientWidth >= list.scrollWidth - 1;

    ctx.el.discoverEventsPrev.disabled = atStart;
    ctx.el.discoverEventsNext.disabled = atEnd;
  }

  function bindEventsArrowControls() {
    if (eventsArrowsBound) return;
    eventsArrowsBound = true;

    ctx.el.discoverEventsPrev?.addEventListener("click", () => {
      scrollEventsByCards(-1);
    });
    ctx.el.discoverEventsNext?.addEventListener("click", () => {
      scrollEventsByCards(1);
    });

    let scrollUpdateFrame = null;
    ctx.el.discoverEventsList?.addEventListener("scroll", () => {
      if (scrollUpdateFrame) return;
      scrollUpdateFrame = requestAnimationFrame(() => {
        scrollUpdateFrame = null;
        updateEventsArrowState();
      });
    });

    window.addEventListener("resize", updateEventsArrowState);
  }

  window.OMAP_DISCOVER = {
    configure,
    CATEGORIES: DISCOVER_CATEGORIES,
    CATEGORY_GROUPS: DISCOVER_CATEGORY_GROUPS,
    renderCategoryButtons: renderDiscoverCategoryButtons,
    normalizeSearchText,
    filterCategories: filterDiscoverCategories,
    run: runDiscoverCategory,
    clear: clearDiscoverResults,
    refreshEvents: refreshDiscoverEventsSection
  };
})();
