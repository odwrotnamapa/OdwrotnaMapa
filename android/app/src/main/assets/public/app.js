(() => {
  "use strict";

  // Architektura 2.0: komponenty i serwisy są ładowane przed app.js.

  const CONFIG = window.SOUTHMAPS_CONFIG;
  const $ = id => document.getElementById(id);

  const text = {
    pl: {
      title: "Odwrotna Mapa - mapa z południem u góry",
      search: "Szukaj miejsca…", button: "Szukaj",
      styles: { default: "Domyślna", satellite: "Satelitarna", custom: "Własna" },
      customMapColorsHeading: "Kolory mapy",
      customUiColorsHeading: "Kolory interfejsu",
      customColorReset: "Resetuj kolory",
      customColorLabels: {
        mapBackground: "Tło",
        mapWater: "Woda",
        mapParks: "Zieleń",
        mapBuildings: "Budynki",
        mapRoads: "Drogi",
        mapBoundaries: "Granice",
        mapLabels: "Etykiety",
        uiAccent: "Akcent",
        uiPanel: "Tło paneli",
        uiText: "Tekst"
      },
      locate: "Moja lokalizacja", legend: "Legenda", closeLegend: "Zamknij legendę",
      backToMenu: "Wróć do menu",
      backToPlace: "Wróć do miejsca",
      legendSections: {
        boundaries: "Granice",
        roads: "Drogi",
        transport: "Transport",
        land: "Teren"
      },
      legendItems: {
        countryBorder: "Granica państwa",
        adminBorder: "Granica administracyjna",
        disputedBorder: "Granica sporna",
        motorway: "Autostrada",
        primaryRoad: "Droga główna",
        secondaryRoad: "Droga drugorzędna",
        minorRoad: "Droga lokalna",
        path: "Ścieżka / droga piesza",
        railway: "Linia kolejowa",
        runway: "Pas startowy",
        taxiway: "Droga kołowania",
        water: "Woda",
        park: "Park",
        forest: "Las",
        grass: "Teren trawiasty",
        wetland: "Teren podmokły",
        sand: "Piasek",
        residential: "Obszar mieszkalny",
        cemetery: "Cmentarz",
        hospital: "Szpital",
        school: "Szkoła",
        buildings: "Budynek"
      },
      legendNote: "Legenda oparta na stylu Liberty OpenFreeMap. Wygląd symboli i kolorów może różnić się w zależności od wybranego motywu mapy.",
      about: "O projekcie",
      closeAbout: "Zamknij sekcję O projekcie",
      backupTitle: "Kopia zapasowa",
      closeBackup: "Zamknij kopię zapasową",
      aboutIntro: "Większość współczesnych map przedstawia północ na górze, więc łatwo zapomnieć, że nie jest to prawo natury, lecz historyczna konwencja. Odwrotna Mapa zachęca do spojrzenia na świat z innej perspektywy — i to dosłownie — oraz przypomina, że sposób przedstawiania rzeczywistości znacząco wpływa na to, jak ją postrzegamy.",
      aboutData: "Dane mapowe",
      aboutStyle: "Styl mapy",
      aboutEngine: "Silnik",
      aboutContact: "Kontakt:",
      aboutDonateHeading: "Wesprzyj projekt",
      aboutDonateCoffee: "Buy Me a Coffee",
      aboutDonateBtc: "Bitcoin",
      aboutDonateBtcCopied: "Skopiowano adres Bitcoin.",
      searching: "Wyszukiwanie…", noResults: "Nie znaleziono miejsca.",
      searchError: "Nie udało się wyszukać miejsca.",
      locating: "Ustalanie lokalizacji…",
      locationError: "Nie udało się odczytać lokalizacji.",
      route: "Wyznacz trasę",
      closeRoute: "Zamknij planer trasy",
      resizeRoutePanel: "Zmień wysokość panelu trasy",
      routeTitle: "Trasa",
      routeFrom: "Punkt A",
      routeTo: "Punkt B",
      routeFromPlaceholder: "Miejsce początkowe",
      routeToPlaceholder: "Cel podróży",
      routeSwap: "Zamień punkty",
      routeSubmit: "Wyznacz trasę",
      routeClear: "Wyczyść",
      routeDistance: "Dystans",
      routeDuration: "Czas",
      routeNote: "Trasa jest obliczana na podstawie danych OpenStreetMap.",
      routeMode: "Sposób podróży",
      routeModes: {
        auto: "Samochód",
        bicycle: "Rower",
        pedestrian: "Pieszo",
        transit: "Transport publiczny"
      },
      routeSearching: "Wyszukiwanie punktów i obliczanie trasy…",
      routePointNotFound: "Nie znaleziono jednego z podanych punktów.",
      routeError: "Nie udało się wyznaczyć trasy.",
      transitRouteError: "Nie znaleziono połączenia transportem publicznym.",
      routePickA: "Kliknij na mapie, aby wybrać punkt początkowy.",
      routePickB: "Kliknij na mapie, aby wybrać punkt docelowy.",
      routePickMoveB: "Kliknij na mapie, aby zmienić punkt docelowy.",
      routeReverseError: "Nie udało się odczytać nazwy wybranego miejsca.",
      locatingForRoute: "Pobieranie lokalizacji…",
      locateError: "Nie udało się pobrać lokalizacji.",
      routeDirections: "Wskazówki",
      routeSteps: "kroków",
      routeArrival: "Przyjazd",
      routeShare: "Udostępnij trasę",
      routeShared: "Link do trasy został skopiowany.",
      placeShared: "Link do miejsca został skopiowany.",
      routeShareError: "Nie udało się udostępnić trasy.",
      routeWaypointNote: "Kliknij linię trasy, aby dodać punkt pośredni. Punkt można przeciągać.",
      routeRoundaboutExit: exit => `Na rondzie wybierz ${exit}. zjazd.`,
      routeWaypoint: number => `Punkt ${number}`,
      autocompleteNoResults: "Brak wyników",
      autocompleteLoading: "Szukam…",
      autocompleteError: "Nie udało się pobrać podpowiedzi.",
      autocompleteCorrected: name => `Poprawiono nazwę na: ${name}`,
      clearSearch: "Wyczyść wyszukiwanie",
      searchHistory: "Ostatnie wyszukiwania",
      exploreSearching: "Wyszukiwanie miejsc w pobliżu…",
      exploreEmpty: "Nie znaleziono takich miejsc w widocznym obszarze.",
      exploreFound: count => `Znaleziono ${count} miejsc. Kliknij znacznik, aby zobaczyć szczegóły.`,
      exploreError: "Nie udało się wyszukać miejsc w pobliżu.",
      discoverTitle: "Odkrywaj",
      discoverClose: "Zamknij Odkrywaj",
      discoverNote: "Wybierz kategorię, aby zobaczyć miejsca w aktualnym widoku mapy.",
      discoverClear: "Wyczyść wyniki",
      discoverSearching: "Wyszukiwanie w aktualnym widoku…",
      discoverFound: count => `Znaleziono ${count} miejsc.`,
      discoverEmpty: "Brak wyników w aktualnym widoku.",
      discoverZooming: "Przybliżam mapę do obszaru wyszukiwania…",
      discoverCategoryGroups: {
        food: "Jedzenie i picie",
        stay: "Noclegi",
        shopping: "Zakupy",
        health: "Zdrowie",
        services: "Usługi",
        transport: "Transport",
        culture: "Kultura i rozrywka",
        recreation: "Rekreacja",
        public: "Instytucje"
      },
      discoverCategories: {
        pizza: "Pizza",
        cafe: "Kawiarnie",
        restaurant: "Restauracje",
        bar: "Bary",
        fast_food: "Fast food",
        bakery: "Piekarnie",
        ice_cream: "Lodziarnie",
        hotel: "Hotele",
        campsite: "Kempingi",
        fuel: "Paliwo",
        museum: "Muzea",
        park: "Parki",
        pharmacy: "Apteki",
        hospital: "Szpitale",
        dentist: "Dentyści",
        vet: "Weterynarze",
        bank: "Banki",
        post_office: "Poczty",
        hairdresser: "Fryzjerzy",
        laundry: "Pralnie",
        toilets: "Toalety",
        bus_stop: "Przystanki",
        railway_station: "Dworce",
        ev_charging: "Ładowarki EV",
        parking: "Parkingi",
        car_repair: "Warsztaty",
        shop: "Sklepy",
        mall: "Centra handlowe",
        clothes: "Odzież",
        bookstore: "Księgarnie",
        kiosk: "Kioski",
        cinema: "Kina",
        theatre: "Teatry",
        library: "Biblioteki",
        zoo: "Zoo",
        nightclub: "Kluby nocne",
        beach: "Plaże",
        playground: "Place zabaw",
        gym: "Siłownie",
        swimming_pool: "Baseny",
        school: "Szkoły",
        church: "Kościoły",
        police: "Policja"
      },
      clearSearchHistory: "Wyczyść historię",
      menuTitle: "Menu",
      favoritesTitle: "Ulubione",
      favoritesEmpty: "Brak ulubionych miejsc.",
      favoriteEdit: "Edytuj",
      favoriteEditTitle: "Edytuj miejsce",
      favoriteCustomNameLabel: "Własna nazwa",
      favoriteCustomNamePlaceholder: "np. Ulubiona kawiarnia",
      favoriteNoteLabel: "Notatka",
      favoriteNotePlaceholder: "np. otwarte do 22, wejście od podwórka",
      favoriteSave: "Zapisz",
      favoriteCancelEdit: "Anuluj",
      favoritesSearch: "Szukaj ulubionych…",
      favoritesCountLabel: "zapisanych miejsc",
      menuExportAll: "Eksportuj JSON",
      menuImportAll: "Importuj JSON",
      backupSelectAll: "Zaznacz wszystko",
      backupDeselectAll: "Odznacz wszystko",
      backupScopeFavorites: "Ulubione miejsca",
      backupScopeColors: "Kolory",
      colorsImported: "Zaimportowano kolory.",
      backupNothingSelected: "Zaznacz przynajmniej jedną opcję.",
      backupExportError: "Nie udało się wyeksportować pliku.",
      menuHistory: "Historia",
      historyTitle: "Historia",
      historyClose: "Zamknij Historia",
      historyEmpty: "Historia jest pusta.",
      historySearch: "Szukaj w historii…",
      historyNoMatch: "Brak pasujących wyników.",
      historyClear: "Wyczyść historię",
      historyRemove: "Usuń z historii",
      favoritesClose: "Zamknij Ulubione",
      favoritesNoMatch: "Brak pasujących ulubionych.",
      favoritesImported: count => `Zaimportowano ${count} miejsc.`,
      favoritesImportError: "Nie udało się zaimportować pliku JSON.",
      menuTheme: "Wygląd mapy",
      menuLocation: "Moja lokalizacja",
      menuLanguage: "Język",
      menuLegend: "Legenda",
      menuBackup: "Kopia zapasowa",
      menuAbout: "O projekcie",
      contextRouteA: "Ustaw jako punkt A",
      contextRouteB: "Ustaw jako punkt B",
      contextCopyCoordinates: "Skopiuj współrzędne",
      contextShowInformation: "Pokaż informacje",
      contextAddFavorite: "Dodaj do ulubionych",
      contextFavoriteAdded: "Dodano miejsce do ulubionych.",
      contextFavoriteRemoved: "Usunięto miejsce z ulubionych.",
      menuClose: "Zamknij menu",
      clearMap: "Wyczyść mapę",
      mapCleared: "Wyczyszczono elementy mapy.",
      placePanelTitle: "Informacje",
      placePanelClose: "Zamknij informacje o miejscu",
      placePanelBack: "Wróć do poprzedniego panelu",
      placePanelResize: "Zmień wysokość panelu informacji",
      placeLoading: "Pobieranie informacji o miejscu…",
      placeUnknown: "Wybrane miejsce",
      placeType: "Typ",
      placeCoordinates: "Współrzędne",
      placeSetRoute: "Wyznacz trasę",
      placeCopy: "Kopiuj",
      placeCopied: "Skopiowano informacje o miejscu.",
      placeAddressCopied: "Skopiowano adres.",
      placeCoordinatesCopied: "Skopiowano współrzędne.",
      placePhoneCopied: "Skopiowano numer telefonu.",
      placeShare: "Udostępnij",
      placeNearby: "W pobliżu",
      placeOpenOsm: "Otwórz w OpenStreetMap",
      placeError: "Nie udało się pobrać informacji o miejscu.",
      departuresTitle: "Najbliższe odjazdy",
      wikipediaTitle: "O tym miejscu",
      wikipediaReadMore: "Czytaj więcej na Wikipedii →",
      departuresLoading: "Pobieranie rozkładu…",
      departuresEmpty: "Brak dostępnego rozkładu dla tego przystanku.",
      departuresError: "Nie udało się pobrać rozkładu.",
      departuresScheduled: "rozkładowo",
      departuresCancelled: "odwołany",
      departuresNow: "teraz",
      departuresMinutes: minutes => `za ${minutes} min`,
      departuresSources: "Źródła danych",
      departuresShowMore: "Pokaż więcej",
      departuresShowLess: "Pokaż mniej"
    },
    en: {
      title: "Odwrotna Mapa - mapa z południem u góry",
      search: "Search for a place…", button: "Search",
      styles: { default: "Default", satellite: "Satellite", custom: "Custom" },
      customMapColorsHeading: "Map colors",
      customUiColorsHeading: "Interface colors",
      customColorReset: "Reset colors",
      customColorLabels: {
        mapBackground: "Background",
        mapWater: "Water",
        mapParks: "Greenery",
        mapBuildings: "Buildings",
        mapRoads: "Roads",
        mapBoundaries: "Boundaries",
        mapLabels: "Labels",
        uiAccent: "Accent",
        uiPanel: "Panel background",
        uiText: "Text"
      },
      locate: "My location", legend: "Legend", closeLegend: "Close legend",
      backToMenu: "Back to menu",
      backToPlace: "Back to place",
      legendSections: {
        boundaries: "Boundaries",
        roads: "Roads",
        transport: "Transport",
        land: "Land"
      },
      legendItems: {
        countryBorder: "Country border",
        adminBorder: "Administrative border",
        disputedBorder: "Disputed border",
        motorway: "Motorway",
        primaryRoad: "Primary road",
        secondaryRoad: "Secondary road",
        minorRoad: "Local road",
        path: "Path / pedestrian way",
        railway: "Railway",
        runway: "Runway",
        taxiway: "Taxiway",
        water: "Water",
        park: "Park",
        forest: "Woodland",
        grass: "Grassland",
        wetland: "Wetland",
        sand: "Sand",
        residential: "Residential area",
        cemetery: "Cemetery",
        hospital: "Hospital",
        school: "School",
        buildings: "Building"
      },
      legendNote: "Legend based on the OpenFreeMap Liberty style. The appearance of symbols and colours may vary depending on the selected map theme.",
      about: "About",
      closeAbout: "Close the About panel",
      backupTitle: "Backup",
      closeBackup: "Close backup",
      aboutIntro: "Most modern maps place north at the top. This is not, however, the only possible way to represent the world. Odwrotna Mapa was created as an attempt to look at a familiar map from another perspective and to encourage reflection on how conventions influence our perception of reality.",
      aboutData: "Map data",
      aboutStyle: "Map style",
      aboutEngine: "Engine",
      aboutContact: "Contact:",
      aboutDonateHeading: "Support the project",
      aboutDonateCoffee: "Buy Me a Coffee",
      aboutDonateBtc: "Bitcoin",
      aboutDonateBtcCopied: "Bitcoin address copied.",
      searching: "Searching…", noResults: "No place found.",
      searchError: "The place search failed.",
      locating: "Finding your location…",
      locationError: "Could not read your location.",
      route: "Plan a route",
      closeRoute: "Close route planner",
      resizeRoutePanel: "Resize route panel",
      routeTitle: "Route",
      routeFrom: "Point A",
      routeTo: "Point B",
      routeFromPlaceholder: "Starting point",
      routeToPlaceholder: "Destination",
      routeSwap: "Swap points",
      routeSubmit: "Plan route",
      routeClear: "Clear",
      routeDistance: "Distance",
      routeDuration: "Time",
      routeNote: "The route is calculated using OpenStreetMap data.",
      routeMode: "Travel mode",
      routeModes: {
        auto: "Car",
        bicycle: "Bicycle",
        pedestrian: "Walking",
        transit: "Public transport"
      },
      routeSearching: "Finding points and calculating the route…",
      routePointNotFound: "One of the entered points could not be found.",
      routeError: "The route could not be calculated.",
      transitRouteError: "No public transport connection was found.",
      routePickA: "Click the map to choose the starting point.",
      routePickB: "Click the map to choose the destination.",
      routePickMoveB: "Click the map to move the destination.",
      routeReverseError: "The selected place name could not be read.",
      locatingForRoute: "Getting your location…",
      locateError: "Your location could not be retrieved.",
      routeDirections: "Directions",
      routeSteps: "steps",
      routeArrival: "Arrival",
      routeShare: "Share route",
      routeShared: "The route link was copied.",
      placeShared: "The place link was copied.",
      routeShareError: "The route could not be shared.",
      routeWaypointNote: "Click the route line to add a waypoint. You can drag the point.",
      routeRoundaboutExit: exit => `At the roundabout, take exit ${exit}.`,
      routeWaypoint: number => `Waypoint ${number}`,
      autocompleteNoResults: "No results",
      autocompleteLoading: "Searching…",
      autocompleteError: "Suggestions could not be loaded.",
      autocompleteCorrected: name => `Corrected to: ${name}`,
      clearSearch: "Clear search",
      searchHistory: "Recent searches",
      exploreSearching: "Searching for nearby places…",
      exploreEmpty: "No matching places were found in this area.",
      exploreFound: count => `Found ${count} places. Select a marker for details.`,
      exploreError: "Nearby places could not be searched.",
      discoverTitle: "Discover",
      discoverClose: "Close Discover",
      discoverNote: "Choose a category to see places in the current map view.",
      discoverClear: "Clear results",
      discoverSearching: "Searching the current map view…",
      discoverFound: count => `Found ${count} places.`,
      discoverEmpty: "No results in the current map view.",
      discoverZooming: "Zooming in to the search area…",
      discoverCategoryGroups: {
        food: "Food & drink",
        stay: "Lodging",
        shopping: "Shopping",
        health: "Health",
        services: "Services",
        transport: "Transport",
        culture: "Culture & entertainment",
        recreation: "Recreation",
        public: "Public"
      },
      discoverCategories: {
        pizza: "Pizza",
        cafe: "Cafés",
        restaurant: "Restaurants",
        bar: "Bars",
        fast_food: "Fast food",
        bakery: "Bakeries",
        ice_cream: "Ice cream",
        hotel: "Hotels",
        campsite: "Campsites",
        fuel: "Fuel",
        museum: "Museums",
        park: "Parks",
        pharmacy: "Pharmacies",
        hospital: "Hospitals",
        dentist: "Dentists",
        vet: "Vets",
        bank: "Banks",
        post_office: "Post offices",
        hairdresser: "Hairdressers",
        laundry: "Laundries",
        toilets: "Toilets",
        bus_stop: "Bus stops",
        railway_station: "Train stations",
        ev_charging: "EV charging",
        parking: "Parking",
        car_repair: "Car repair",
        shop: "Shops",
        mall: "Shopping malls",
        clothes: "Clothing",
        bookstore: "Bookstores",
        kiosk: "Kiosks",
        cinema: "Cinemas",
        theatre: "Theatres",
        library: "Libraries",
        zoo: "Zoos",
        nightclub: "Nightclubs",
        beach: "Beaches",
        playground: "Playgrounds",
        gym: "Gyms",
        swimming_pool: "Swimming pools",
        school: "Schools",
        church: "Churches",
        police: "Police"
      },
      clearSearchHistory: "Clear history",
      menuTitle: "Menu",
      favoritesTitle: "Favorites",
      favoritesEmpty: "No favorite places yet.",
      favoriteEdit: "Edit",
      favoriteEditTitle: "Edit place",
      favoriteCustomNameLabel: "Custom name",
      favoriteCustomNamePlaceholder: "e.g. Favorite cafe",
      favoriteNoteLabel: "Note",
      favoriteNotePlaceholder: "e.g. open until 10pm, entrance from the yard",
      favoriteSave: "Save",
      favoriteCancelEdit: "Cancel",
      favoritesSearch: "Search favorites…",
      favoritesCountLabel: "saved places",
      menuExportAll: "Export JSON",
      menuImportAll: "Import JSON",
      backupSelectAll: "Select all",
      backupDeselectAll: "Deselect all",
      backupScopeFavorites: "Favorite places",
      backupScopeColors: "Colors",
      colorsImported: "Colors imported.",
      backupNothingSelected: "Select at least one option.",
      backupExportError: "Could not export the file.",
      menuHistory: "History",
      historyTitle: "History",
      historyClose: "Close History",
      historyEmpty: "No history yet.",
      historySearch: "Search history…",
      historyNoMatch: "No matching results.",
      historyClear: "Clear history",
      historyRemove: "Remove from history",
      favoritesClose: "Close Favorites",
      favoritesNoMatch: "No matching favorites.",
      favoritesImported: count => `Imported ${count} places.`,
      favoritesImportError: "The JSON file could not be imported.",
      menuTheme: "Map style",
      menuLocation: "My location",
      menuLanguage: "Language",
      menuLegend: "Legend",
      menuBackup: "Backup",
      menuAbout: "About",
      contextRouteA: "Set as Point A",
      contextRouteB: "Set as Point B",
      contextCopyCoordinates: "Copy coordinates",
      contextShowInformation: "Show information",
      contextAddFavorite: "Add to favorites",
      contextFavoriteAdded: "Place added to favorites.",
      contextFavoriteRemoved: "Place removed from favorites.",
      menuClose: "Close menu",
      clearMap: "Clear map",
      mapCleared: "Map elements cleared.",
      placePanelTitle: "Information",
      placePanelClose: "Close place information",
      placePanelBack: "Return to the previous panel",
      placePanelResize: "Resize place information panel",
      placeLoading: "Loading place information…",
      placeUnknown: "Selected place",
      placeType: "Type",
      placeCoordinates: "Coordinates",
      placeSetRoute: "Get directions",
      placeCopy: "Copy",
      placeCopied: "Place information copied.",
      placeAddressCopied: "Address copied.",
      placeCoordinatesCopied: "Coordinates copied.",
      placePhoneCopied: "Phone number copied.",
      placeShare: "Share",
      placeNearby: "Nearby",
      placeOpenOsm: "Open in OpenStreetMap",
      placeError: "Place information could not be loaded.",
      departuresTitle: "Next departures",
      wikipediaTitle: "About this place",
      wikipediaReadMore: "Read more on Wikipedia →",
      departuresLoading: "Loading timetable…",
      departuresEmpty: "No timetable is available for this stop.",
      departuresError: "The timetable could not be loaded.",
      departuresScheduled: "scheduled",
      departuresCancelled: "cancelled",
      departuresNow: "now",
      departuresMinutes: minutes => `in ${minutes} min`,
      departuresSources: "Data sources",
      departuresShowMore: "Show more",
      departuresShowLess: "Show less"
    }
  };

  const DEFAULT_CUSTOM_PALETTE = {
    mapBackground: "#f7f4ef",
    mapWater: "#a9cbe0",
    mapParks: "#c9e4c5",
    mapBuildings: "#e3ddd2",
    mapRoads: "#ffffff",
    mapBoundaries: "#9a9a9a",
    mapLabels: "#3a3a3a",
    uiAccent: "#dc2626",
    uiPanel: "#ffffff",
    uiText: "#18212b"
  };

  function readCustomPalette() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.customPalette) || "{}"
      );
      return { ...DEFAULT_CUSTOM_PALETTE, ...stored };
    } catch (_) {
      return { ...DEFAULT_CUSTOM_PALETTE };
    }
  }

  function saveCustomPalette(palette) {
    safeSet(
      CONFIG.storageKeys.customPalette,
      JSON.stringify(palette)
    );
  }

  const state = {
    language: ["pl", "en"].includes(safeGet(CONFIG.storageKeys.language, "pl"))
      ? safeGet(CONFIG.storageKeys.language, "pl")
      : "pl",
    theme: (() => {
      const stored = safeGet(CONFIG.storageKeys.theme, "default");
      if (stored === "light" || stored === "dark") return "default";
      return ["default", "satellite", "custom"].includes(stored)
        ? stored
        : "default";
    })(),
    customPalette: readCustomPalette(),
    timer: null,
    originalPaint: new Map(),
    originalTextFields: new Map(),
    originalFillPatterns: new Map(),
    routeMarkers: { a: null, b: null },
    routeCoordinates: null,
    routePointA: null,
    routePointB: null,
    routeClickStage: "a",
    routeClickBusy: false,
    routeManeuvers: [],
    routeWaypoints: [],
    routeWaypointMarkers: [],
    selectedManeuverIndex: null,
    placePopup: null,
    placePanelLngLat: null,
    selectedPlace: null,
    namedPoiGuardId: 0,
    activeNamedPoiId: null,
    selectedPlaceMarker: null,
    contextPointMarker: null,
    userLocationMarker: null,
    contextMenuLngLat: null,
    contextMenuPoint: null,
    mapLongPressTimer: null,
    mapLongPressStartPoint: null,
    mapLongPressTriggered: false,
    placeRequestController: null,
    placePanelReturnTarget: null,
    discoverBackContext: null,
    routeBackContext: null,
    exploreMarkers: [],
    exploreRequestController: null,
    favorites: readFavorites(),
    history: readHistory()
  };

  const el = {
    searchForm: $("search-form"),
    searchInput: $("search-input"),
    searchClear: $("search-clear"),
    autocompleteFloating: $("autocomplete-floating"),
    searchButton: $("search-button"),
    themeSelect: $("theme-select"),
    languageSelect: $("language-select"),    locateButton: $("locate-button"),
    legendButton: $("legend-button"),
    legendPanel: $("legend-panel"),
    legendSheetHandle: $("legend-sheet-handle"),
    legendClose: $("legend-close"),
    legendBack: $("legend-back"),
    menuButton: $("menu-button"),
    mobileRouteButton: $("mobile-route-button"),
    mobileDiscoverButton: $("mobile-discover-button"),
    mobileMenuButton: $("mobile-menu-button"),
    menuPanel: $("menu-panel"),
    menuSheetHandle: $("menu-sheet-handle"),
    menuClose: $("menu-close"),
    menuTitle: $("menu-title"),
    favoritesList: $("favorites-list"),
    favoritesEmpty: $("favorites-empty"),
    placePanel: $("place-panel"),
    placeSheetHandle: $("place-sheet-handle"),
    placePanelTitle: $("place-panel-title"),
    placePanelBack: $("place-panel-back"),
    placePanelClose: $("place-panel-close"),
    placePanelContent: $("place-panel-content"),
    favoritesCount: $("favorites-count"),
    favoritesOpenButton: $("favorites-open-button"),
    favoritesMenuLabel: $("favorites-menu-label"),
    favoritesPanel: $("favorites-panel"),
    favoritesSheetHandle: $("favorites-sheet-handle"),
    favoritesClose: $("favorites-close"),
    favoritesBack: $("favorites-back"),
    favoritesTitle: $("favorites-title"),
    favoritesSearch: $("favorites-search"),
    favoritesCountLabel: $("favorites-count-label"),
    historyOpenButton: $("history-open-button"),
    historyMenuLabel: $("history-menu-label"),
    historyPanel: $("history-panel"),
    historySheetHandle: $("history-sheet-handle"),
    historyBack: $("history-back"),
    historyClose: $("history-close"),
    historyTitle: $("history-title"),
    historySearch: $("history-search"),
    historyClear: $("history-clear"),
    historyList: $("history-list"),
    historyEmpty: $("history-empty"),
    menuLocationButton: $("menu-location-button"),
    menuThemeSelect: $("menu-theme-select"),
    menuCustomPalette: $("menu-custom-palette"),
    customMapHeading: $("menu-custom-map-heading"),
    customUiHeading: $("menu-custom-ui-heading"),
    customPaletteReset: $("custom-palette-reset"),
    menuExportAll: $("menu-export-all"),
    menuExportAllLabel: $("menu-export-all-label"),
    menuImportAllButton: $("menu-import-all-button"),
    menuImportAllLabel: $("menu-import-all-label"),
    menuImportAllInput: $("menu-import-all-input"),
    backupSelectAll: $("menu-backup-select-all"),
    backupScopeFavorites: $("menu-backup-scope-favorites"),
    backupScopeFavoritesLabel: $("menu-backup-scope-favorites-label"),
    backupScopeColors: $("menu-backup-scope-colors"),
    backupScopeColorsLabel: $("menu-backup-scope-colors-label"),
    menuThemeLabel: $("menu-theme-label"),
    menuLanguageSelect: $("menu-language-select"),
    menuLegendButton: $("menu-legend-button"),
    menuLegendLabel: $("menu-legend-label"),
    brandButton: $("brand-button"),
    mapContextMenu: $("map-context-menu"),
    clearMapButton: $("clear-map-button"),
    menuAboutButton: $("menu-about-button"),
    menuLocationLabel: $("menu-location-label"),
    menuLanguageLabel: $("menu-language-label"),
    clearMapLabel: $("clear-map-label"),
    menuAboutLabel: $("menu-about-label"),
    aboutButton: $("about-button"),
    aboutPanel: $("about-panel"),
    aboutSheetHandle: $("about-sheet-handle"),
    aboutClose: $("about-close"),
    aboutBack: $("about-back"),
    menuBackupButton: $("menu-backup-button"),
    menuBackupLabel: $("menu-backup-label"),
    backupPanel: $("backup-panel"),
    backupSheetHandle: $("backup-sheet-handle"),
    backupClose: $("backup-close"),
    backupBack: $("backup-back"),
    aboutTitle: $("about-title"),
    backupTitle: $("backup-title"),
    aboutIntro: $("about-intro"),
    aboutDataLabel: $("about-data-label"),
    aboutStyleLabel: $("about-style-label"),
    aboutEngineLabel: $("about-engine-label"),
    aboutContactLabel: $("about-contact-label"),
    aboutDonateHeading: $("about-donate-heading"),
    aboutDonateCoffee: $("about-donate-coffee-label"),
    aboutDonateCoffeeLink: document.querySelector(".about-donate-coffee"),
    aboutDonateBtcHeading: $("about-donate-btc-heading"),
    aboutDonateBtcButton: $("about-donate-btc"),
    aboutDonateBtcAddress: $("about-donate-btc-address"),
    routeButton: $("route-button"),
    discoverButton: $("discover-button"),
    discoverSheetHandle: $("discover-sheet-handle"),
    discoverPanel: $("discover-panel"),
    discoverClose: $("discover-close"),
    discoverBack: $("discover-back"),
    routeBack: $("route-back"),
    discoverTitle: $("discover-title"),
    discoverNote: $("discover-note"),
    discoverCategories: $("discover-categories"),
    discoverStatus: $("discover-status"),
    discoverResultsList: $("discover-results-list"),
    discoverClear: $("discover-clear"),
    routePanel: $("route-panel"),
    routeSheetHandle: $("route-sheet-handle"),
    routeClose: $("route-close"),
    routeForm: $("route-form"),
    routeFrom: $("route-from"),
    routeTo: $("route-to"),
    routeFromLabel: $("route-from-label"),
    routeToLabel: $("route-to-label"),
    routeSwap: $("route-swap"),
    routeSubmit: $("route-submit"),
    routeClear: $("route-clear"),
    routeTitle: $("route-title"),
    routeSummary: $("route-summary"),
    routeDistance: $("route-distance"),
    routeDuration: $("route-duration"),
    routeDistanceLabel: $("route-distance-label"),
    routeDurationLabel: $("route-duration-label"),
    routeArrival: $("route-arrival"),
    routeArrivalLabel: $("route-arrival-label"),
    routeShare: $("route-share"),
    routeWaypointNote: $("route-waypoint-note"),
    routeNote: $("route-note"),
    routeModeLabel: $("route-mode-label"),
    routeClickHint: $("route-click-hint"),
    routeDirections: $("route-directions"),
    routeDirectionsTitle: $("route-directions-title"),
    routeDirectionsCount: $("route-directions-count"),
    routeDirectionsList: $("route-directions-list"),
    legendTitle: $("legend-title"),
    legendNote: $("legend-note"),
    status: $("status"),
    fatal: $("fatal-error"),
    fatalText: $("fatal-error-text")
  };

  if (!window.maplibregl) {
    fatal("Biblioteka MapLibre GL JS nie została pobrana.");
    return;
  }

  let map;
  try {
    const saved = readView();
    map = new maplibregl.Map({
      container: "map",
      style: CONFIG.map.styleUrl,
      center: saved?.center || CONFIG.map.center,
      zoom: saved?.zoom ?? CONFIG.map.zoom,
      bearing: saved?.bearing ?? CONFIG.map.bearing,
      pitch: saved?.pitch ?? CONFIG.map.pitch,
      minZoom: CONFIG.map.minZoom
    });
    window.__omapMap = map;
  } catch (error) {
    fatal(error.message);
    return;
  }

  map.addControl(new maplibregl.NavigationControl({
    showCompass: false,
    showZoom: true
  }), "bottom-right");

  map.dragRotate.disable();
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

  map.on("error", event => {
    console.error("MapLibre:", event.error || event);
  });

  map.on("load", () => {
    ensureSatellite();
    ensureRouteLayers();
    cacheOriginalPaint();
    applyTheme(state.theme);
    applyLanguageAfterStartup();
    loadSharedRouteFromUrl();
    loadSharedPlaceFromUrl();
    initializeGeoUriHandling();
  });

  map.on("moveend", saveView);
  map.on("click", handleMapClick);
  map.on("contextmenu", openMapContextMenu);
  map.on("touchstart", handleMapLongPressStart);
  map.on("touchmove", handleMapLongPressMove);
  map.on("touchend", handleMapLongPressEnd);
  map.on("movestart", () => {
    cancelMapLongPress();
    closeMapContextMenu();
  });

  el.themeSelect.value = state.theme;
  el.languageSelect.value = state.language;
  if (el.menuThemeSelect) el.menuThemeSelect.value = state.theme;
  if (el.menuLanguageSelect) el.menuLanguageSelect.value = state.language;
  updateUI();

  el.themeSelect?.addEventListener("change", e => {
    state.theme = e.target.value;
    safeSet(CONFIG.storageKeys.theme, state.theme);
    applyTheme(state.theme);
    updateCustomPaletteVisibility();
    updateUI();
  });

  function updateCustomPaletteVisibility() {
    if (el.menuCustomPalette) {
      el.menuCustomPalette.hidden = state.theme !== "custom";
    }
  }

  updateCustomPaletteVisibility();
  const CUSTOM_PALETTE_FIELDS = [
    "mapBackground", "mapWater", "mapParks", "mapBuildings",
    "mapRoads", "mapBoundaries", "mapLabels",
    "uiAccent", "uiPanel", "uiText"
  ];

  function syncCustomPaletteInputs() {
    for (const key of CUSTOM_PALETTE_FIELDS) {
      const input = $(`custom-color-${key}`);
      if (input) input.value = state.customPalette[key];
    }
  }

  initializeCustomPaletteEditor();

  function initializeCustomPaletteEditor() {
    syncCustomPaletteInputs();

    for (const key of CUSTOM_PALETTE_FIELDS) {
      const input = $(`custom-color-${key}`);
      if (!input) continue;

      input.addEventListener("input", () => {
        state.customPalette[key] = input.value;
        saveCustomPalette(state.customPalette);
        if (state.theme === "custom") applyTheme(state.theme);
      });
    }

    el.customPaletteReset?.addEventListener("click", () => {
      state.customPalette = { ...DEFAULT_CUSTOM_PALETTE };
      saveCustomPalette(state.customPalette);
      syncCustomPaletteInputs();
      if (state.theme === "custom") applyTheme(state.theme);
    });
  }

  window.matchMedia?.("(prefers-color-scheme: dark)")
    ?.addEventListener("change", () => {
      if (state.theme === "default" || state.theme === "satellite") {
        applyTheme(state.theme);
      }
    });

  function refreshDefaultThemeIfNeeded() {
    if (state.theme === "default") {
      // Only re-apply when the resolved light/dark result actually changed,
      // so this can never turn into a repeating loop no matter what triggers it.
      if (resolveTheme(state.theme) === lastResolvedTheme) return;
      applyTheme(state.theme);
      return;
    }

    if (state.theme === "satellite") {
      const shouldBeDark = prefersDarkColorScheme();
      if (document.body.classList.contains("ui-dark") === shouldBeDark) return;
      applyTheme(state.theme);
    }
  }

  // Dark-mode browser extensions (e.g. Dark Reader) apply asynchronously
  // after load and can be toggled by the user at any time without a page
  // reload, so poll for that on a slow, fixed interval. Deliberately not
  // using a MutationObserver here: some of these extensions make frequent
  // DOM changes of their own, and reacting to every one of them could
  // hammer getComputedStyle()/applyTheme() and make the page feel stuck.
  window.setInterval(refreshDefaultThemeIfNeeded, 4000);

  el.languageSelect?.addEventListener("change", e => {
    state.language = e.target.value;
    safeSet(CONFIG.storageKeys.language, state.language);
    updateUI();
    applyLanguage(state.language);
  });

  el.locateButton?.addEventListener("click", locate);
  el.brandButton?.addEventListener("click", event => {
    event.preventDefault();
    locate();
  });
  el.legendButton?.addEventListener("click", toggleLegend);
  el.legendClose?.addEventListener("click", closeLegend);
  el.placePanelBack?.addEventListener(
    "click",
    returnFromPlacePanel
  );
  el.placePanelClose?.addEventListener("click", closePlacePanel);

  el.menuButton?.addEventListener("click", toggleMenu);
  el.menuClose?.addEventListener("click", closeMenu);
  el.menuLegendButton?.addEventListener(
    "click",
    openLegendFromMenu
  );
  el.mapContextMenu?.addEventListener(
    "click",
    handleMapContextAction
  );
  document.addEventListener("pointerdown", event => {
    if (
      el.mapContextMenu &&
      !el.mapContextMenu.hidden &&
      !el.mapContextMenu.contains(event.target)
    ) {
      closeMapContextMenu();
    }
  });
  el.favoritesOpenButton?.addEventListener(
    "click",
    openFavoritesPanel
  );
  el.favoritesClose?.addEventListener(
    "click",
    closeFavoritesPanel
  );
  el.favoritesBack?.addEventListener(
    "click",
    returnFromFavoritesToMenu
  );
  el.favoritesSearch?.addEventListener("input", renderFavoritesList);
  el.historyOpenButton?.addEventListener(
    "click",
    openHistoryPanel
  );
  el.historyClose?.addEventListener(
    "click",
    closeHistory
  );
  el.historyBack?.addEventListener(
    "click",
    returnFromHistoryToMenu
  );
  el.historySearch?.addEventListener("input", renderHistoryList);
  el.historyClear?.addEventListener("click", clearHistoryList);
  el.menuExportAll?.addEventListener("click", exportAllSettingsJson);
  el.menuImportAllButton?.addEventListener("click", () => {
    el.menuImportAllInput?.click();
  });
  el.menuImportAllInput?.addEventListener("change", importAllSettingsJson);
  el.backupSelectAll?.addEventListener("click", () => {
    const checkboxes = [el.backupScopeFavorites, el.backupScopeColors].filter(Boolean);
    const allChecked = checkboxes.every(box => box.checked);
    for (const box of checkboxes) box.checked = !allChecked;
    updateBackupSelectAllLabel();
  });
  el.backupScopeFavorites?.addEventListener("change", updateBackupSelectAllLabel);
  el.backupScopeColors?.addEventListener("change", updateBackupSelectAllLabel);

  function updateBackupSelectAllLabel() {
    if (!el.backupSelectAll) return;
    const checkboxes = [el.backupScopeFavorites, el.backupScopeColors].filter(Boolean);
    const allChecked = checkboxes.every(box => box.checked);
    el.backupSelectAll.textContent = allChecked
      ? text[state.language].backupDeselectAll
      : text[state.language].backupSelectAll;
  }

  updateBackupSelectAllLabel();

  function getCheckedBackupScopes() {
    const scopes = [];
    if (el.backupScopeFavorites?.checked) scopes.push("favorites");
    if (el.backupScopeColors?.checked) scopes.push("colors");
    return scopes;
  }

  el.menuLocationButton?.addEventListener("click", locateFromMenu);
  el.menuThemeSelect?.addEventListener("change", () => {
    if (!el.themeSelect) return;
    el.themeSelect.value = el.menuThemeSelect.value;
    el.themeSelect.dispatchEvent(new Event("change"));
  });
  el.menuLanguageSelect?.addEventListener("change", () => {
    if (!el.languageSelect) return;
    el.languageSelect.value = el.menuLanguageSelect.value;
    el.languageSelect.dispatchEvent(new Event("change"));
  });
  el.clearMapButton?.addEventListener("click", clearMapView);
  el.menuAboutButton?.addEventListener(
    "click",
    openAboutFromMenu
  );

  el.menuBackupButton?.addEventListener(
    "click",
    openBackupFromMenu
  );
  el.backupClose?.addEventListener("click", closeBackup);
  el.backupBack?.addEventListener(
    "click",
    returnFromBackupToMenu
  );

  el.aboutButton?.addEventListener("click", toggleAbout);
  el.aboutClose?.addEventListener("click", closeAbout);

  el.aboutDonateBtcButton?.addEventListener("click", () => {
    const address = el.aboutDonateBtcAddress?.textContent?.trim();
    if (address) {
      copyValue(address, text[state.language].aboutDonateBtcCopied);
    }
  });

  el.aboutBack?.addEventListener(
    "click",
    returnFromAboutToMenu
  );
  el.legendBack?.addEventListener(
    "click",
    returnFromLegendToMenu
  );
  el.routeButton?.addEventListener("click", toggleRoute);
  el.mobileRouteButton?.addEventListener("click", toggleRoute);
  el.mobileDiscoverButton?.addEventListener("click", toggleDiscover);
  el.discoverBack?.addEventListener(
    "click",
    returnFromDiscoverToPlace
  );
  el.routeBack?.addEventListener(
    "click",
    returnFromRouteToPlace
  );
  el.mobileMenuButton?.addEventListener("click", toggleMenu);
  el.discoverButton?.addEventListener("click", toggleDiscover);
  el.discoverClose?.addEventListener("click", closeDiscover);
  el.discoverClear?.addEventListener("click", () => {
    clearDiscoverResults();
  });

  el.routeClose?.addEventListener("click", closeRoute);
  el.routeSwap?.addEventListener("click", swapRoutePoints);
  el.routeClear?.addEventListener("click", () => {
    clearRoute();
  });
  el.routeForm?.addEventListener("submit", planRoute);
  el.routeShare?.addEventListener("click", shareRoute);
  for (const modeInput of document.querySelectorAll('input[name="route-mode"]')) {
    modeInput.addEventListener("change", handleRouteModeChange);
  }
  initializeRouteBottomSheet();
  initializeDiscoverBottomSheet();
  initializeMenuBottomSheet();
  initializeFavoritesBottomSheet();
  initializeHistoryBottomSheet();
  initializePlaceBottomSheet();
  initializeLegendBottomSheet();
  initializeAboutBottomSheet();
  initializeBackupBottomSheet();
  initializeAutocomplete();
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeLegend();
      closeAbout();
      closeBackup();
      closeDiscover();
      closeMapContextMenu();
      closeMenu();
      closeFavoritesPanel();
      closeHistory();
      closePlacePanel();
      closeRoutePanel();
    }
  });
  el.searchForm?.addEventListener("submit", search);
  el.searchInput?.addEventListener("input", updateSearchClearButton);
  el.searchClear?.addEventListener("click", clearMainSearch);

  function updateUI() {
    const t = text[state.language];
    el.mobileRouteButton?.setAttribute("aria-label", t.route);
    if (el.mobileRouteButton?.lastElementChild) {
      el.mobileRouteButton.lastElementChild.textContent = t.routeTitle;
    }
    el.mobileDiscoverButton?.setAttribute("aria-label", t.discoverTitle);
    if (el.mobileDiscoverButton?.lastElementChild) {
      el.mobileDiscoverButton.lastElementChild.textContent = t.discoverTitle;
    }
    el.mobileMenuButton?.setAttribute("aria-label", t.menuTitle);
    if (el.mobileMenuButton?.lastElementChild) {
      el.mobileMenuButton.lastElementChild.textContent = t.menuTitle;
    }
    if (el.menuTitle) el.menuTitle.textContent = t.menuTitle;
    if (el.menuThemeLabel) el.menuThemeLabel.textContent = t.menuTheme;
    if (el.menuLocationLabel) el.menuLocationLabel.textContent = t.menuLocation;
    if (el.menuLanguageLabel) el.menuLanguageLabel.textContent = t.menuLanguage;
    if (el.clearMapLabel) el.clearMapLabel.textContent = t.clearMap;
    if (el.menuAboutLabel) el.menuAboutLabel.textContent = t.menuAbout;
    if (el.menuBackupLabel) el.menuBackupLabel.textContent = t.menuBackup;
    if (el.favoritesMenuLabel) el.favoritesMenuLabel.textContent = t.favoritesTitle;
    if (el.favoritesTitle) el.favoritesTitle.textContent = t.favoritesTitle;
    if (el.historyMenuLabel) el.historyMenuLabel.textContent = t.menuHistory;
    if (el.historyTitle) el.historyTitle.textContent = t.historyTitle;
    el.historyClose?.setAttribute("aria-label", t.historyClose);
    el.historyBack?.setAttribute("aria-label", t.backToMenu);
    if (el.historySearch) el.historySearch.placeholder = t.historySearch;
    el.historySearch?.setAttribute("aria-label", t.historySearch);
    if (el.historyClear) el.historyClear.textContent = t.historyClear;
    if (el.menuExportAllLabel) el.menuExportAllLabel.textContent = t.menuExportAll;
    if (el.menuImportAllLabel) el.menuImportAllLabel.textContent = t.menuImportAll;
    if (el.backupScopeFavoritesLabel) el.backupScopeFavoritesLabel.textContent = t.backupScopeFavorites;
    if (el.backupScopeColorsLabel) el.backupScopeColorsLabel.textContent = t.backupScopeColors;
    updateBackupSelectAllLabel();
    if (el.favoritesCountLabel) el.favoritesCountLabel.textContent = t.favoritesCountLabel;
    document.documentElement.lang = state.language;
    document.title = t.title;
    if (el.searchInput) el.searchInput.placeholder = t.search;
    el.searchInput?.setAttribute("aria-label", t.search);
    if (el.searchButton) el.searchButton.textContent = t.button;    if (el.locateButton) el.locateButton.title = t.locate;
    el.locateButton?.setAttribute("aria-label", t.locate);
    if (el.legendButton) el.legendButton.title = t.legend;
    el.legendButton?.setAttribute("aria-label", t.legend);
    if (el.menuLegendLabel) {
      el.menuLegendLabel.textContent = t.menuLegend;
    }
    updateMapContextMenuLabels();
    if (el.legendTitle) el.legendTitle.textContent = t.legend;
    el.legendClose?.setAttribute("aria-label", t.closeLegend);
    el.legendBack?.setAttribute("aria-label", t.backToMenu);
    el.aboutBack?.setAttribute("aria-label", t.backToMenu);
    el.discoverBack?.setAttribute("aria-label", t.backToPlace);
    el.routeBack?.setAttribute("aria-label", t.backToPlace);
    el.backupBack?.setAttribute("aria-label", t.backToMenu);
    el.favoritesBack?.setAttribute("aria-label", t.backToMenu);
    if (el.legendNote) el.legendNote.textContent = t.legendNote;
    if (el.aboutButton) el.aboutButton.title = t.about;
    el.aboutButton?.setAttribute("aria-label", t.about);
    if (el.aboutTitle) el.aboutTitle.textContent = t.about;
    el.aboutClose?.setAttribute("aria-label", t.closeAbout);
    if (el.backupTitle) el.backupTitle.textContent = t.backupTitle;
    el.backupClose?.setAttribute("aria-label", t.closeBackup);
    if (el.aboutIntro) el.aboutIntro.textContent = t.aboutIntro;
    if (el.aboutDataLabel) el.aboutDataLabel.textContent = t.aboutData;
    if (el.aboutStyleLabel) el.aboutStyleLabel.textContent = t.aboutStyle;
    if (el.aboutEngineLabel) el.aboutEngineLabel.textContent = t.aboutEngine;
    if (el.aboutContactLabel) el.aboutContactLabel.textContent = t.aboutContact;
    if (el.aboutDonateHeading) el.aboutDonateHeading.textContent = t.aboutDonateHeading;
    if (el.aboutDonateCoffee) el.aboutDonateCoffee.textContent = t.aboutDonateCoffee;
    if (el.aboutDonateBtcHeading) el.aboutDonateBtcHeading.textContent = t.aboutDonateBtc;
    if (el.placePanelTitle) el.placePanelTitle.textContent = t.placePanelTitle;
    el.placePanelClose?.setAttribute("aria-label", t.placePanelClose);
    el.placeSheetHandle?.setAttribute("aria-label", t.placePanelResize);
    el.brandButton?.setAttribute(
      "aria-label",
      state.language === "pl"
        ? "Pokaż moją lokalizację"
        : "Show my location"
    );
    if (el.routeButton) el.routeButton.title = t.route;
    el.routeButton?.setAttribute("aria-label", t.route);
    if (el.routeTitle) el.routeTitle.textContent = t.routeTitle;
    if (el.discoverTitle) el.discoverTitle.textContent = t.discoverTitle;
    if (el.discoverButton) el.discoverButton.title = t.discoverTitle;
    el.discoverButton?.setAttribute("aria-label", t.discoverTitle);
    el.discoverClose?.setAttribute("aria-label", t.discoverClose);
    if (el.discoverNote) el.discoverNote.textContent = t.discoverNote;
    if (el.discoverClear) el.discoverClear.textContent = t.discoverClear;
    for (const button of el.discoverCategories?.querySelectorAll(
      "[data-discover-category]"
    ) || []) {
      const label = t.discoverCategories?.[button.dataset.discoverCategory];
      if (!label) continue;
      const span = button.querySelector("span:last-child");
      if (span) span.textContent = label;
      button.setAttribute("aria-label", label);
    }
    if (
      el.discoverCategories?.querySelector(
        ".discover-category-group"
      )
    ) {
      const groups = el.discoverCategories.querySelectorAll(
        ".discover-category-group"
      );
      DISCOVER_CATEGORY_GROUPS.forEach((group, index) => {
        const titleEl = groups[index]?.querySelector(
          ".discover-category-group-title"
        );
        if (titleEl) {
          titleEl.textContent =
            t.discoverCategoryGroups?.[group.id] || group.id;
        }
      });
    }
    el.routeClose?.setAttribute("aria-label", t.closeRoute);
    el.routeSheetHandle?.setAttribute("aria-label", t.resizeRoutePanel);
    if (el.routeFromLabel) el.routeFromLabel.textContent = t.routeFrom;
    if (el.routeToLabel) el.routeToLabel.textContent = t.routeTo;
    if (el.routeFrom) el.routeFrom.placeholder = t.routeFromPlaceholder;
    if (el.routeTo) el.routeTo.placeholder = t.routeToPlaceholder;
    if (el.routeSwap) el.routeSwap.title = t.routeSwap;
    el.routeSwap?.setAttribute("aria-label", t.routeSwap);
    if (el.routeSubmit) el.routeSubmit.textContent = t.routeSubmit;
    if (el.routeClear) el.routeClear.textContent = t.routeClear;
    if (el.routeDistanceLabel) el.routeDistanceLabel.textContent = t.routeDistance;
    if (el.routeDurationLabel) el.routeDurationLabel.textContent = t.routeDuration;
    if (el.routeArrivalLabel) el.routeArrivalLabel.textContent = t.routeArrival;
    if (el.routeShare) el.routeShare.textContent = t.routeShare;
    if (el.routeWaypointNote) el.routeWaypointNote.textContent = t.routeWaypointNote;
    if (el.routeNote) el.routeNote.textContent = t.routeNote;
    updateRouteClickHint();
    if (el.routeDirectionsTitle) el.routeDirectionsTitle.textContent = t.routeDirections;
    if (el.routeModeLabel) el.routeModeLabel.textContent = t.routeMode;
    for (const modeLabel of document.querySelectorAll("[data-route-mode-label]")) {
      const label = t.routeModes[modeLabel.dataset.routeModeLabel];
      modeLabel.title = label;
      modeLabel.setAttribute("aria-label", label);
    }
    for (const item of document.querySelectorAll("[data-legend]")) {
      item.textContent = t.legendItems[item.dataset.legend];
    }
    for (const section of document.querySelectorAll("[data-legend-section]")) {
      section.textContent = t.legendSections[section.dataset.legendSection];
    }
    for (const option of el.themeSelect.options) {
      option.textContent = t.styles[option.value];
    }
    for (const option of el.menuThemeSelect.options) {
      option.textContent = t.styles[option.value];
    }
    if (el.menuThemeSelect) el.menuThemeSelect.value = state.theme;
    if (el.menuLanguageSelect) el.menuLanguageSelect.value = state.language;
    if (el.customMapHeading) el.customMapHeading.textContent = t.customMapColorsHeading;
    if (el.customUiHeading) el.customUiHeading.textContent = t.customUiColorsHeading;
    if (el.customPaletteReset) el.customPaletteReset.textContent = t.customColorReset;
    for (const [key, label] of Object.entries(t.customColorLabels)) {
      const labelEl = $(`custom-color-${key}-label`);
      if (labelEl) labelEl.textContent = label;
    }
    document.body.classList.toggle(
      "ui-dark",
      resolveTheme(state.theme) === "dark" ||
      (state.theme === "satellite" && prefersDarkColorScheme())
    );
    renderFavoritesList();
    renderHistoryList();
  }

  function ensureSatellite() {
    if (!map.getSource(CONFIG.satellite.sourceId)) {
      map.addSource(CONFIG.satellite.sourceId, {
        type: "raster",
        tiles: CONFIG.satellite.tiles,
        tileSize: CONFIG.satellite.tileSize,
        attribution: CONFIG.satellite.attribution
      });
    }
    if (!map.getLayer(CONFIG.satellite.layerId)) {
      const firstSymbol = map.getStyle().layers.find(l => l.type === "symbol");
      map.addLayer({
        id: CONFIG.satellite.layerId,
        type: "raster",
        source: CONFIG.satellite.sourceId,
        layout: { visibility: "none" }
      }, firstSymbol ? firstSymbol.id : undefined);
    }
  }

  function cacheOriginalPaint() {
    for (const layer of map.getStyle().layers || []) {
      if (layer.id === CONFIG.satellite.layerId) continue;

      state.originalPaint.set(layer.id, structuredClone(layer.paint || {}));

      if (layer.type === "symbol" && layer.layout?.["text-field"] !== undefined) {
        state.originalTextFields.set(
          layer.id,
          structuredClone(layer.layout["text-field"])
        );
      }

      if (layer.type === "fill" && layer.paint?.["fill-pattern"] !== undefined) {
        state.originalFillPatterns.set(
          layer.id,
          structuredClone(layer.paint["fill-pattern"])
        );
      }
    }
  }

  let darkModeProbe = null;

  function getDarkModeProbe() {
    if (darkModeProbe && document.body.contains(darkModeProbe)) {
      return darkModeProbe;
    }

    try {
      const probe = document.createElement("div");
      probe.id = "omap-dark-mode-probe";
      probe.setAttribute("aria-hidden", "true");
      probe.style.cssText =
        "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;" +
        "background-color:#ffffff;pointer-events:none;";
      document.body.appendChild(probe);
      darkModeProbe = probe;
      return probe;
    } catch (_) {
      return null;
    }
  }

  function detectBrowserForcedDarkMode() {
    try {
      if (!document.body) return false;

      // Dark Reader marks the page with this attribute when active.
      const scheme = document.documentElement.getAttribute(
        "data-darkreader-scheme"
      );
      if (scheme) return scheme !== "light";

      // Generic fallback: dark-mode extensions (Dark Reader and similar)
      // recolor the whole page, including inline styles. A probe element
      // with an explicit white background will come back dark if such an
      // extension is active.
      const background = getComputedStyle(getDarkModeProbe()).backgroundColor;
      const channels = background?.match(/[\d.]+/g);
      if (!channels || channels.length < 3) return false;

      const [r, g, b] = channels.map(Number);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance < 0.5;
    } catch (_) {
      return false;
    }
  }

  function prefersDarkColorScheme() {
    return Boolean(
      (window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches) ||
      detectBrowserForcedDarkMode()
    );
  }

  function resolveTheme(theme) {
    if (theme === "default") {
      return prefersDarkColorScheme() ? "dark" : "light";
    }
    return theme;
  }

  let lastResolvedTheme = null;

  function applyTheme(theme) {
    if (!map.isStyleLoaded()) {
      map.once("idle", () => applyTheme(theme));
      return;
    }

    ensureSatellite();

    const effectiveTheme = resolveTheme(theme);
    lastResolvedTheme = effectiveTheme;
    const layers = map.getStyle().layers || [];

    for (const layer of layers) {
      if (isRouteLayer(layer.id)) {
        const isHighlight = layer.id === CONFIG.routing.highlightLayerId;
        setVisibility(
          layer,
          isHighlight
            ? state.selectedManeuverIndex !== null
            : Boolean(state.routeCoordinates)
        );
        continue;
      }

      if (layer.id === CONFIG.satellite.layerId) {
        map.setLayoutProperty(
          layer.id,
          "visibility",
          theme === "satellite" ? "visible" : "none"
        );
        continue;
      }

      if (theme === "satellite") {
        const visible =
          layer.type === "symbol" ||
          /boundary|border|admin|road|highway|railway|transportation/i.test(layer.id);

        setVisibility(layer, visible);
        restoreOriginalPaint(layer);
        restoreFillPattern(layer);
        continue;
      }

      setVisibility(layer, true);

      if (effectiveTheme === "dark") {
        disableFillPattern(layer);
        applyDarkPalette(layer);
      } else if (effectiveTheme === "custom") {
        disableFillPattern(layer);
        applyCustomPalette(layer);
      } else {
        restoreOriginalPaint(layer);
        restoreFillPattern(layer);
      }
    }

    document.body.classList.toggle(
      "ui-dark",
      effectiveTheme === "dark" ||
      (theme === "satellite" && prefersDarkColorScheme())
    );

    if (effectiveTheme === "custom") {
      applyCustomUiColors(state.customPalette);
    } else {
      clearCustomUiColors();
    }

    applyLanguage(state.language);

    for (const layer of map.getStyle().layers || []) {
      applyRoadReferenceColors(layer);
    }
  }

  function restoreOriginalPaint(layer) {
    const original = state.originalPaint.get(layer.id);
    if (!original) return;

    for (const [property, value] of Object.entries(original)) {
      try {
        map.setPaintProperty(layer.id, property, structuredClone(value));
      } catch (_) {}
    }
  }

  function disableFillPattern(layer) {
    try {
      if (layer.paint?.["fill-pattern"] !== undefined ||
          state.originalFillPatterns.has(layer.id)) {
        map.setPaintProperty(layer.id, "fill-pattern", null);
      }
    } catch (_) {}
  }

  function restoreFillPattern(layer) {
    try {
      if (state.originalFillPatterns.has(layer.id)) {
        map.setPaintProperty(
          layer.id,
          "fill-pattern",
          structuredClone(state.originalFillPatterns.get(layer.id))
        );
      }
    } catch (_) {}
  }

  function setVisibility(layer, visible) {
    try {
      map.setLayoutProperty(layer.id, "visibility", visible ? "visible" : "none");
    } catch (_) {}
  }

  function applyDarkPalette(layer) {
    const id = layer.id.toLowerCase();

    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", "#171d23");
        return;
      }

      if (layer.type === "fill") {
        let color = "#252d33";
        if (/water/.test(id)) color = "#132735";
        else if (/park|forest|wood|grass|landcover|nature/.test(id)) color = "#26352f";
        else if (/building/.test(id)) color = "#30383e";
        else if (/industrial|commercial|retail|residential|landuse/.test(id)) color = "#293137";

        map.setPaintProperty(layer.id, "fill-color", color);
        if (hasPaint(layer, "fill-outline-color")) {
          map.setPaintProperty(layer.id, "fill-outline-color", color);
        }
        if (hasPaint(layer, "fill-opacity")) {
          map.setPaintProperty(layer.id, "fill-opacity", /building/.test(id) ? 0.72 : 0.9);
        }
        return;
      }

      if (layer.type === "fill-extrusion") {
        map.setPaintProperty(layer.id, "fill-extrusion-color", "#30383e");
        if (hasPaint(layer, "fill-extrusion-opacity")) {
          map.setPaintProperty(layer.id, "fill-extrusion-opacity", 0.72);
        }
        return;
      }

      if (layer.type === "line") {
        let color = "#46515a";
        let opacity = 0.65;

        if (/boundary|border|admin/.test(id)) {
          color = "#6f7d89";
          opacity = 0.72;
        } else if (/road|highway|motorway|street/.test(id)) {
          color = "#4b555e";
          opacity = 0.68;
        } else if (/water/.test(id)) {
          color = "#294454";
          opacity = 0.55;
        } else if (/park|forest|wood|grass|landcover/.test(id)) {
          color = "#33423b";
          opacity = 0.28;
        }

        map.setPaintProperty(layer.id, "line-color", color);
        if (hasPaint(layer, "line-opacity")) {
          map.setPaintProperty(layer.id, "line-opacity", opacity);
        }
        return;
      }

      if (layer.type === "circle") {
        map.setPaintProperty(layer.id, "circle-color", "#aeb8c0");
        if (hasPaint(layer, "circle-stroke-color")) {
          map.setPaintProperty(layer.id, "circle-stroke-color", "#171d23");
        }
        if (hasPaint(layer, "circle-opacity")) {
          map.setPaintProperty(layer.id, "circle-opacity", 0.72);
        }
        return;
      }

      if (layer.type === "symbol") {
        if (hasPaint(layer, "text-color")) {
          map.setPaintProperty(layer.id, "text-color", "#d8dfe5");
        }
        if (hasPaint(layer, "text-halo-color")) {
          map.setPaintProperty(layer.id, "text-halo-color", "#171d23");
        }
        if (hasPaint(layer, "text-halo-width")) {
          map.setPaintProperty(layer.id, "text-halo-width", 1);
        }
        if (hasPaint(layer, "icon-opacity")) {
          map.setPaintProperty(layer.id, "icon-opacity", 0.78);
        }
      }
    } catch (_) {}
  }

  // Mapowanie 1:1 na podstawie prawdziwych identyfikatorów warstw stylu
  // OpenFreeMap Liberty (a nie zgadywania po fragmentach nazw), żeby każda
  // warstwa terenu trafiała do właściwego koloru dokładnie raz.
  const CUSTOM_FILL_LAYER_MAP = {
    park: "mapParks",
    landcover_wood: "mapParks",
    landcover_grass: "mapParks",
    landcover_wetland: "mapParks",
    landcover_ice: "mapBackground",
    landcover_sand: "mapBackground",
    landuse_residential: "mapBuildings",
    landuse_pitch: "mapBuildings",
    landuse_track: "mapBuildings",
    landuse_cemetery: "mapBuildings",
    landuse_hospital: "mapBuildings",
    landuse_school: "mapBuildings",
    water: "mapWater",
    aeroway_fill: "mapBackground",
    building: "mapBuildings"
  };

  const CUSTOM_LINE_LAYER_PREFIX_MAP = [
    [/^park_outline/, "mapParks"],
    [/^boundary/, "mapBoundaries"],
    [/^waterway/, "mapWater"],
    [/^(road|tunnel|bridge)_/, "mapRoads"]
  ];

  function applyCustomPalette(layer) {
    const id = layer.id;
    const palette = state.customPalette;

    try {
      if (layer.type === "background") {
        map.setPaintProperty(layer.id, "background-color", palette.mapBackground);
        return;
      }

      if (layer.type === "fill") {
        const key = CUSTOM_FILL_LAYER_MAP[id] || "mapBackground";
        const color = palette[key];

        map.setPaintProperty(layer.id, "fill-color", color);
        if (hasPaint(layer, "fill-outline-color") || id === "park") {
          map.setPaintProperty(layer.id, "fill-outline-color", color);
        }
        // Oryginalny styl renderuje część terenu (lasy, trawniki) z bardzo
        // niską przezroczystością, więc bez tego wybrany kolor ledwo by
        // było widać spod tła.
        map.setPaintProperty(layer.id, "fill-opacity", key === "mapBackground" ? 1 : 0.92);
        return;
      }

      if (layer.type === "fill-extrusion") {
        map.setPaintProperty(layer.id, "fill-extrusion-color", palette.mapBuildings);
        return;
      }

      if (layer.type === "line") {
        let color = palette.mapRoads;
        for (const [pattern, key] of CUSTOM_LINE_LAYER_PREFIX_MAP) {
          if (pattern.test(id)) {
            color = palette[key];
            break;
          }
        }

        map.setPaintProperty(layer.id, "line-color", color);
        return;
      }

      if (layer.type === "circle") {
        map.setPaintProperty(layer.id, "circle-color", palette.mapLabels);
        return;
      }

      if (layer.type === "symbol") {
        if (hasPaint(layer, "text-color")) {
          map.setPaintProperty(layer.id, "text-color", palette.mapLabels);
        }
        if (hasPaint(layer, "text-halo-color")) {
          map.setPaintProperty(layer.id, "text-halo-color", palette.mapBackground);
        }
      }
    } catch (_) {}
  }

  function applyCustomUiColors(palette) {
    const root = document.documentElement.style;
    root.setProperty("--accent", palette.uiAccent);
    root.setProperty("--panel", palette.uiPanel);
    root.setProperty("--text", palette.uiText);
    root.setProperty(
      "--muted",
      `color-mix(in srgb, ${palette.uiText} 65%, transparent)`
    );
  }

  function clearCustomUiColors() {
    const root = document.documentElement.style;
    root.removeProperty("--accent");
    root.removeProperty("--panel");
    root.removeProperty("--text");
    root.removeProperty("--muted");
  }

  function hasPaint(layer, key) {
    return Boolean(layer.paint && Object.prototype.hasOwnProperty.call(layer.paint, key));
  }

  function applyLanguageAfterStartup() {
    // OpenFreeMap/MapLibre może jeszcze dokończyć inicjalizację stylu po
    // zdarzeniu „load”. Ponawiamy ustawienie etykiet po pierwszej klatce,
    // po krótkim opóźnieniu oraz po pierwszym pełnym „idle”.
    applyLanguage(state.language);
    requestAnimationFrame(() => applyLanguage(state.language));
    window.setTimeout(() => applyLanguage(state.language), 250);
    map.once("idle", () => applyLanguage(state.language));
  }

  function applyLanguage(language) {
    if (!map.isStyleLoaded()) {
      map.once("styledata", () => applyLanguage(language));
      return;
    }

    const preferred = language === "pl" ? "name:pl" : "name:en";

    for (const layer of map.getStyle().layers || []) {
      if (layer.type !== "symbol" || layer.layout?.["text-field"] === undefined) {
        continue;
      }

      try {
        // Tarcze dróg krajowych, wojewódzkich i autostrad muszą zachować
        // oryginalne krótkie oznaczenia (np. A2, S7, 92), a nie nazwy ulic.
        if (isRoadReferenceLayer(layer)) {
          restoreOriginalTextField(layer.id);
          applyRoadReferenceColors(layer);
          continue;
        }

        map.setLayoutProperty(layer.id, "text-field", [
          "coalesce",
          ["get", preferred],
          ["get", "name:latin"],
          ["get", "name"]
        ]);
      } catch (_) {}
    }
  }

  function isRoadReferenceLayer(layer) {
    const id = layer.id.toLowerCase();
    const iconImage = layer.layout?.["icon-image"];
    const sourceLayer = String(layer["source-layer"] || "").toLowerCase();
    const originalText = state.originalTextFields.get(layer.id);
    const originalTextJson = JSON.stringify(originalText || "").toLowerCase();

    const idLooksLikeShield =
      /shield|road[_ -]?ref|route[_ -]?ref|highway[_ -]?ref|motorway[_ -]?ref|transportation[_ -]?name[_ -]?ref/.test(id);

    const sourceLooksLikeRoad =
      /transportation|road|highway|route/.test(sourceLayer);

    const textUsesReference =
      /"ref"|"network"|"route_ref"|"reflen"/.test(originalTextJson);

    // Warstwy z ikoną i krótkim polem ref są zwykle tarczami numerów dróg.
    return idLooksLikeShield || (Boolean(iconImage) && sourceLooksLikeRoad && textUsesReference);
  }

  function restoreOriginalTextField(layerId) {
    const original = state.originalTextFields.get(layerId);
    if (original !== undefined) {
      map.setLayoutProperty(layerId, "text-field", structuredClone(original));
    }
  }


  function applyRoadReferenceColors(layer) {
    if (!isRoadReferenceLayer(layer)) return;

    const reference = [
      "to-string",
      [
        "coalesce",
        ["get", "ref"],
        ["get", "route_ref"],
        ["get", "network"],
        ""
      ]
    ];

    const firstCharacter = ["slice", reference, 0, 1];
    const referenceLength = ["length", reference];
    const numericReference = [
      "!=",
      ["to-number", reference, -1],
      -1
    ];

    const shieldColor = [
      "case",
      ["==", firstCharacter, "A"], "#1677d2",
      ["==", firstCharacter, "a"], "#1677d2",
      ["==", firstCharacter, "E"], "#198754",
      ["==", firstCharacter, "e"], "#198754",
      ["==", firstCharacter, "S"], "#d62828",
      ["==", firstCharacter, "s"], "#d62828",
      ["all", numericReference, ["<=", referenceLength, 2]], "#d62828",
      ["all", numericReference, ["==", referenceLength, 3]], "#f2c300",
      ["all", numericReference, [">=", referenceLength, 4]], "#6b7280",
      "#ffffff"
    ];

    const labelColor = [
      "case",
      ["all", numericReference, ["==", referenceLength, 3]], "#111111",
      ["==", shieldColor, "#ffffff"], "#222222",
      "#ffffff"
    ];

    try {
      // Oryginalne sprite'y zasłaniałyby własne kolory, dlatego tarcza
      // jest tworzona z tekstu i szerokiej kolorowej obwódki.
      map.setPaintProperty(layer.id, "icon-opacity", 0);
      map.setPaintProperty(layer.id, "text-color", labelColor);
      map.setPaintProperty(layer.id, "text-halo-color", shieldColor);
      map.setPaintProperty(layer.id, "text-halo-width", 5);
      map.setPaintProperty(layer.id, "text-halo-blur", 0.35);
    } catch (error) {
      console.warn("Nie udało się pokolorować numerów dróg:", layer.id, error);
    }
  }

  function isRouteLayer(layerId) {
    return [
      CONFIG.routing.casingLayerId,
      CONFIG.routing.lineLayerId,
      CONFIG.routing.highlightLayerId
    ].includes(layerId);
  }

  function getSearchHistory() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.searchHistory) || "[]"
      );

      if (!Array.isArray(stored)) return [];

      return stored.filter(entry =>
        entry &&
        typeof entry.label === "string" &&
        Number.isFinite(Number(entry.lon)) &&
        Number.isFinite(Number(entry.lat))
      );
    } catch (_) {
      return [];
    }
  }

  function saveSearchHistoryEntry(entry) {
    if (!entry?.label) return;

    const normalized = normalizeSearchText(entry.label);
    const history = getSearchHistory().filter(
      item => normalizeSearchText(item.label) !== normalized
    );

    history.unshift({
      label: entry.label,
      displayName: entry.displayName || entry.label,
      lon: Number(entry.lon),
      lat: Number(entry.lat),
      osm_type: entry.osm_type || "",
      osm_id: entry.osm_id || "",
      namedPoiId: entry.namedPoiId || "",
      provider: entry.provider || "",
      providers: entry.providers || [],
      source: entry.source || "",
      exactLocalIdentity: Boolean(
        entry._exactLocalIdentity ||
        entry.exactLocalIdentity
      ),
      name: entry.name || entry.label,
      aliases: entry.aliases || [],
      keywords: entry.keywords || [],
      type: entry.type || "",
      category: entry.category || "",
      class: entry.class || "",
      address: entry.address || {},
      extratags: entry.extratags || {},
      savedAt: Date.now()
    });

    localStorage.setItem(
      CONFIG.storageKeys.searchHistory,
      JSON.stringify(history.slice(0, 8))
    );
  }

  function clearSearchHistory() {
    localStorage.removeItem(CONFIG.storageKeys.searchHistory);
  }

  function loadSharedPlaceFromUrl() {
    const url = new URL(window.location.href);
    const point = parseSharedPoint(
      url.searchParams.get("place")
    );

    if (!point) return;

    // Otwórz udostępniony punkt natychmiast. Nie zostawiaj
    // jednorazowego callbacku moveend, który mógłby uruchomić
    // się dopiero podczas pierwszego późniejszego wyszukiwania.
    showPlaceInformation({
      lngLat: new maplibregl.LngLat(
        point.lon,
        point.lat
      )
    });

    map.flyTo({
      center: [point.lon, point.lat],
      zoom: 17,
      bearing: 180
    });

    // Parametr jest jednorazowy. Usunięcie go zapobiega
    // ponownemu uzbrojeniu tego przepływu po odświeżeniu.
    url.searchParams.delete("place");
    window.history.replaceState(
      null,
      "",
      url.pathname + url.search + url.hash
    );
  }

  function initializeAutocomplete() {
    const floatingList = el.autocompleteFloating;
    let activeInput = null;
    let activeSelect = null;
    let debounceTimer = null;
    let abortController = null;
    let results = [];
    let activeIndex = -1;

    const controllers = [
      {
        input: el.searchInput,
        onSelect: result => {
          const label =
            getSearchResultTitle(result) ||
            getPreferredPlaceLabel(result);

          if (el.searchInput) el.searchInput.value = label;
          updateSearchClearButton();
          hideAllAutocomplete();

          const lon = Number(result.lon);
          const lat = Number(result.lat);

          saveSearchHistoryEntry({
            label,
            displayName:
              result.display_name ||
              getPreferredPlaceLabel(result),
            lon,
            lat,
            osm_type: result.osm_type,
            osm_id: result.osm_id,
            name: result.name,
            type: result.type,
            category: result.category,
            class: result.class,
            address: result.address,
            extratags: result.extratags,
            namedPoiId: result.namedPoiId,
            provider: result.provider,
            providers: result.providers,
            source: result.source,
            _exactLocalIdentity:
              result._exactLocalIdentity,
            aliases: result.aliases,
            keywords: result.keywords
          });

          window.OMAP_SEARCH_SESSION?.cancel?.();
          setPlacePanelReturnTarget("search", {
            query: el.searchInput?.value || label
          });
          prepareMobilePlacePanelAfterSearch();
          openSearchPlaceThroughService(
            result,
            {
              query:
                el.searchInput?.value ||
                label,
              origin: "autocomplete"
            }
          );

          map.flyTo({
            center: [lon, lat],
            zoom: getSearchResultZoom(result),
            bearing: 180
          });
        }
      },
      {
        input: el.routeFrom,
        onSelect: result => {
          const point = resultToRoutePoint(result);
          state.routePointA = point;
          if (el.routeFrom) el.routeFrom.value = point.label;
          setRouteMarker("a", point);
          state.routeClickStage = state.routePointB ? "move-b" : "b";
          updateRouteClickHint();

          if (state.routePointB) {
            calculateRouteFromStoredPoints();
          }
        }
      },
      {
        input: el.routeTo,
        onSelect: result => {
          const point = resultToRoutePoint(result);
          state.routePointB = point;
          if (el.routeTo) el.routeTo.value = point.label;
          setRouteMarker("b", point);
          state.routeClickStage = "move-b";
          updateRouteClickHint();

          if (state.routePointA) {
            calculateRouteFromStoredPoints();
          }
        }
      }
    ];

    const hide = () => {
      floatingList.hidden = true;
      floatingList.replaceChildren();
      activeInput = null;
      activeSelect = null;
      results = [];
      activeIndex = -1;
    };

    const positionList = () => {
      if (!activeInput || floatingList.hidden) return;

      const rect = activeInput.getBoundingClientRect();
      const viewportPadding = 8;
      const width = Math.max(rect.width, 240);
      const maxWidth = window.innerWidth - viewportPadding * 2;

      floatingList.style.width = `${Math.min(width, maxWidth)}px`;
      floatingList.style.left = `${Math.max(
        viewportPadding,
        Math.min(rect.left, window.innerWidth - Math.min(width, maxWidth) - viewportPadding)
      )}px`;
      floatingList.style.top = `${Math.min(
        rect.bottom + 5,
        window.innerHeight - 200
      )}px`;
    };

    const showMessage = message => {
      floatingList.replaceChildren();

      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "autocomplete-option";
      button.disabled = true;
      button.textContent = message;

      item.appendChild(button);
      floatingList.appendChild(item);
      floatingList.hidden = false;
      positionList();
    };

    const render = items => {
      floatingList.replaceChildren();

      const query = activeInput?.value?.trim() || "";
      const exact = selectExactNamedPlace(query, items);

      if (exact) {
        items = [
          exact,
          ...items.filter(item => item !== exact)
        ];
      }

      const isRouteInput =
        activeInput === el.routeFrom || activeInput === el.routeTo;

      if (isRouteInput) {
        items = [{ __myLocationOption: true }, ...items];
      }

      results = items;
      activeIndex = -1;

      if (!items.length) {
        showMessage(text[state.language].autocompleteNoResults);
        return;
      }

      const fragment = document.createDocumentFragment();

      items.forEach(result => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "autocomplete-option";

        const icon = document.createElement("span");
        icon.className = "autocomplete-place-icon";
        icon.setAttribute("aria-hidden", "true");

        const copy = document.createElement("span");
        copy.className = "autocomplete-place-copy";

        const title = document.createElement("strong");

        const details = document.createElement("span");

        if (result.__myLocationOption) {
          icon.textContent = "📍";
          title.textContent = text[state.language].menuLocation;
        } else {
          icon.textContent = getSearchResultEmoji(result);
          title.textContent =
            getSearchResultTitle(result) ||
            getPreferredPlaceLabel(result);
          details.textContent =
            getSearchResultSubtitle(result) ||
            result.display_name ||
            "";
        }

        copy.append(title, details);
        button.append(icon, copy);
        button.addEventListener("pointerdown", event => {
          event.preventDefault();
        });
        button.addEventListener("click", () => {
          if (result.__myLocationOption) {
            const select = activeSelect;
            hide();
            useMyLocationForRoute(point => select?.(point));
            return;
          }

          activeSelect?.(result);
          hide();
        });

        item.appendChild(button);
        fragment.appendChild(item);
      });

      floatingList.appendChild(fragment);
      floatingList.hidden = false;
      positionList();
    };

    const renderHistory = () => {
      const history = getSearchHistory();

      floatingList.replaceChildren();
      activeIndex = -1;

      if (!history.length) {
        hide();
        return;
      }

      const header = document.createElement("li");
      header.className = "autocomplete-history-header";

      const title = document.createElement("span");
      title.textContent = text[state.language].searchHistory;

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "autocomplete-history-clear";
      clearButton.textContent = text[state.language].clearSearchHistory;
      clearButton.addEventListener("click", event => {
        event.stopPropagation();
        clearSearchHistory();
        hide();
      });

      header.append(title, clearButton);
      floatingList.appendChild(header);

      const fragment = document.createDocumentFragment();

      history.forEach(entry => {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "autocomplete-option autocomplete-history-option";

        const icon = document.createElement("span");
        icon.className = "autocomplete-history-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "↺";

        const copy = document.createElement("span");
        copy.className = "autocomplete-history-copy";

        const label = document.createElement("strong");
        label.textContent = entry.label;

        const details = document.createElement("span");
        details.textContent = entry.displayName || entry.label;

        copy.append(label, details);
        button.append(icon, copy);

        button.addEventListener("pointerdown", event => {
          event.preventDefault();
        });

        button.addEventListener("click", () => {
          if (el.searchInput) el.searchInput.value = entry.label;
          updateSearchClearButton();
          hide();

          window.OMAP_SEARCH_SESSION?.cancel?.();

          const isExactPlace =
            entry.exactLocalIdentity ||
            entry.provider === "named-poi" ||
            Boolean(entry.namedPoiId) ||
            Boolean(entry.osm_type && entry.osm_id);

          setPlacePanelReturnTarget("search", {
            query: el.searchInput?.value || entry.label
          });
          prepareMobilePlacePanelAfterSearch();

          openSearchPlaceThroughService(
            {
              ...entry,
              _exactLocalIdentity:
                entry.exactLocalIdentity
            },
            {
              query:
                el.searchInput?.value ||
                entry.label,
              reverse: !isExactPlace,
              origin: "search-history"
            }
          );

          map.flyTo({
            center: [entry.lon, entry.lat],
            zoom: 16,
            bearing: 180
          });
        });

        item.appendChild(button);
        fragment.appendChild(item);
      });

      floatingList.appendChild(fragment);
      floatingList.hidden = false;
      positionList();
    };

    const fetchSuggestions = async query => {
      abortController?.abort();
      abortController = new AbortController();

      showMessage(text[state.language].autocompleteLoading);

      try {
        const items = await findPlacesWithFallback(
          query,
          6,
          abortController.signal
        );

        render(items);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error(error);
        showMessage(text[state.language].autocompleteError);
      }
    };

    const setActive = index => {
      const buttons = [...floatingList.querySelectorAll(
        ".autocomplete-option:not(:disabled)"
      )];
      if (!buttons.length) return;

      activeIndex = (index + buttons.length) % buttons.length;
      buttons.forEach((button, currentIndex) => {
        button.classList.toggle("is-active", currentIndex === activeIndex);
      });
      buttons[activeIndex].scrollIntoView({ block: "nearest" });
    };

    for (const controller of controllers) {
      const { input, onSelect } = controller;

      input.addEventListener("input", () => {
        const query = input.value.trim();
        clearTimeout(debounceTimer);

        activeInput = input;
        activeSelect = onSelect;

        if (query.length < 2) {
          if (input === el.searchInput && !query) {
            renderHistory();
          } else {
            hide();
          }
          return;
        }

        debounceTimer = setTimeout(() => {
          fetchSuggestions(query);
        }, 350);
      });

      input.addEventListener("focus", () => {
        activeInput = input;
        activeSelect = onSelect;

        if (input === el.searchInput && !input.value.trim()) {
          renderHistory();
          return;
        }

        if (
          (input === el.routeFrom || input === el.routeTo) &&
          !input.value.trim()
        ) {
          render([]);
          return;
        }

        if (results.length && !floatingList.hidden) {
          positionList();
        }
      });

      input.addEventListener("keydown", event => {
        if (floatingList.hidden) return;

        const buttons = [...floatingList.querySelectorAll(
          ".autocomplete-option:not(:disabled)"
        )];

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActive(activeIndex + 1);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          setActive(activeIndex - 1);
        } else if (event.key === "Enter" && activeIndex >= 0) {
          event.preventDefault();
          buttons[activeIndex]?.click();
        } else if (event.key === "Escape") {
          hide();
        }
      });
    }

    document.addEventListener("pointerdown", event => {
      if (
        event.target !== activeInput &&
        !floatingList.contains(event.target)
      ) {
        hide();
      }
    });

    window.addEventListener("resize", positionList);
    window.addEventListener("scroll", positionList, true);

    window.addEventListener("beforeunload", () => {
      clearTimeout(debounceTimer);
      abortController?.abort();
    });
  }

  function hideAllAutocomplete() {
    if (!el.autocompleteFloating) return;
    el.autocompleteFloating.hidden = true;
    el.autocompleteFloating.replaceChildren();
  }

  const POLISH_CITY_NAMES = [
    "Warszawa", "Kraków", "Łódź", "Wrocław", "Poznań", "Gdańsk",
    "Szczecin", "Bydgoszcz", "Lublin", "Białystok", "Katowice", "Gdynia",
    "Częstochowa", "Radom", "Toruń", "Sosnowiec", "Rzeszów", "Kielce",
    "Gliwice", "Olsztyn", "Bielsko-Biała", "Zabrze", "Bytom", "Zielona Góra",
    "Rybnik", "Ruda Śląska", "Opole", "Tychy", "Gorzów Wielkopolski",
    "Dąbrowa Górnicza", "Elbląg", "Płock", "Wałbrzych", "Włocławek",
    "Tarnów", "Chorzów", "Koszalin", "Kalisz", "Legnica", "Grudziądz",
    "Słupsk", "Jaworzno", "Jastrzębie-Zdrój", "Nowy Sącz", "Jelenia Góra",
    "Siedlce", "Konin", "Piotrków Trybunalski", "Inowrocław", "Lubin",
    "Ostrów Wielkopolski", "Suwałki", "Gniezno", "Przemyśl", "Stargard",
    "Zamość", "Chełm", "Leszno", "Łomża", "Ełk", "Tomaszów Mazowiecki",
    "Bełchatów", "Mielec", "Tczew", "Świdnica", "Biała Podlaska",
    "Będzin", "Zgierz", "Pabianice", "Racibórz", "Pruszków", "Kołobrzeg",
    "Wejherowo", "Sopot", "Zakopane"
  ];

  function correctPolishCityQuery(query) {
    const normalizedQuery = normalizeSearchText(query);

    if (
      normalizedQuery.length < 4 ||
      normalizedQuery.includes(" ") ||
      /\d/.test(normalizedQuery) ||
      isAddressLikeQuery(query)
    ) {
      return query;
    }

    let bestCity = null;
    let bestDistance = Infinity;

    for (const city of POLISH_CITY_NAMES) {
      const normalizedCity = normalizeSearchText(city);
      const distance = damerauLevenshtein(
        normalizedQuery,
        normalizedCity
      );

      if (distance < bestDistance) {
        bestDistance = distance;
        bestCity = city;
      }
    }

    if (!bestCity) return query;

    const cityLength = normalizeSearchText(bestCity).length;
    const maximumDistance =
      cityLength <= 5 ? 1 :
      cityLength <= 8 ? 2 :
      3;

    const firstLetterMatches =
      normalizedQuery[0] === normalizeSearchText(bestCity)[0];

    return (
      firstLetterMatches &&
      bestDistance > 0 &&
      bestDistance <= maximumDistance
    )
      ? bestCity
      : query;
  }

  
  function withSearchUiTimeout(promise, timeoutMs = 11000) {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("SEARCH_UI_TIMEOUT"));
      }, timeoutMs);
    });

    return Promise.race([
      promise.finally(() => {
        window.clearTimeout(timeoutId);
      }),
      timeoutPromise
    ]);
  }

  async function findPlacesWithFallback(query, limit = 6, signal) {
    const searchParameters =
      new URLSearchParams(window.location.search);
    const useSearchV2 =
      searchParameters.get("search") !== "legacy" &&
      searchParameters.get("searchv2") !== "0";

    if (useSearchV2 && window.OMAP_SEARCH_V2) {
      try {
        const isLocalFile =
          window.location.protocol === "file:";

        const response = await withSearchUiTimeout(
          window.OMAP_SEARCH_V2.search(
            query,
            {
              language: state.language,
              limit,
              signal,
              totalTimeoutMs: isLocalFile
                ? 9500
                : 8000,
              providerTimeoutMs: isLocalFile
                ? 8500
                : 4000
            }
          ),
          isLocalFile ? 10000 : 9000
        );

        console.info("OMapa Search RC", {
          query,
          parsed: response.parsed,
          variants: response.variants,
          diagnostics: response.diagnostics,
          results: response.results
        });

        return response.results;
      } catch (error) {
        if (error.name === "AbortError") throw error;

        console.warn(
          "OMapa Search RC failed.",
          error
        );

        // Nie uruchamiamy ponownie całego starego pipeline'u,
        // bo powodował drugie, długie oczekiwanie.
        return [];
      }
    }

    const originalQuery = query.trim();

    const searchExact = async value => {
      const normalized = value.trim();

      // Najpierw dokładne zapytanie do Nominatim.
      try {
        const nominatimResults = await fetchNominatimPlaces(
          normalized,
          limit,
          signal
        );

        const rankedNominatim = rankSearchResults(
          normalized,
          nominatimResults
        );

        if (rankedNominatim.length) {
          return rankedNominatim;
        }
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn("Nominatim search failed.", error);
      }

      // Photon jest dopiero drugim źródłem, nigdy korektą.
      try {
        const photonResults = await fetchPhotonPlaces(
          normalized,
          limit,
          signal
        );

        return rankSearchResults(
          normalized,
          photonResults
        );
      } catch (error) {
        if (error.name === "AbortError") throw error;
        console.warn("Photon search failed.", error);
        return [];
      }
    };

    // 1. Zawsze szukaj dokładnie tego, co wpisał użytkownik.
    const exactResults = await searchExact(originalQuery);

    // Każdy wynik dla oryginalnego zapytania ma pierwszeństwo.
    // Autokorekta uruchamia się wyłącznie przy całkowitym braku wyników.
    if (exactResults.length) {
      return exactResults;
    }

    if (state.language !== "pl") {
      return [];
    }

    const correctedQuery = correctPolishCityQuery(originalQuery);

    if (
      normalizeSearchText(correctedQuery) ===
      normalizeSearchText(originalQuery)
    ) {
      return exactResults;
    }

    const correctedResults = await searchExact(correctedQuery);

    return correctedResults;
  }

  function rankSearchResults(query, results) {
    return [...results]
      .map(result => ({
        result,
        score: getSearchResultMatchScore(query, result)
      }))
      .filter(item => item.score >= 0.35)
      .sort((a, b) => b.score - a.score)
      .map(item => item.result);
  }

  function getSearchResultMatchScore(query, result) {
    const normalizedQuery = normalizeSearchText(query);
    const title = normalizeSearchText(
      getSearchResultTitle(result) ||
      getPreferredPlaceLabel(result) ||
      ""
    );
    const display = normalizeSearchText(
      result.display_name || ""
    );

    if (!normalizedQuery) return 0;
    if (title === normalizedQuery) return 1;
    if (display.startsWith(normalizedQuery)) return 0.95;
    if (title.startsWith(normalizedQuery)) return 0.9;
    if (title.includes(normalizedQuery)) return 0.82;
    if (display.includes(normalizedQuery)) return 0.74;

    const similarity = stringSimilarity(
      normalizedQuery,
      title || display
    );

    return similarity * 0.7;
  }

  function stringSimilarity(left, right) {
    if (!left || !right) return 0;
    if (left === right) return 1;

    const distance = levenshteinDistance(left, right);
    const length = Math.max(left.length, right.length);

    return length
      ? 1 - distance / length
      : 0;
  }

  function levenshteinDistance(left, right) {
    const rows = left.length + 1;
    const columns = right.length + 1;
    const matrix = Array.from(
      { length: rows },
      () => new Array(columns).fill(0)
    );

    for (let row = 0; row < rows; row += 1) {
      matrix[row][0] = row;
    }

    for (let column = 0; column < columns; column += 1) {
      matrix[0][column] = column;
    }

    for (let row = 1; row < rows; row += 1) {
      for (let column = 1; column < columns; column += 1) {
        const cost =
          left[row - 1] === right[column - 1]
            ? 0
            : 1;

        matrix[row][column] = Math.min(
          matrix[row - 1][column] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column - 1] + cost
        );
      }
    }

    return matrix[left.length][right.length];
  }

  async function fetchPhotonPlaces(query, limit, signal) {
    const url = new URL(CONFIG.search.fuzzyEndpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("lang", state.language);

    const response = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Photon HTTP ${response.status}`);
    }

    const data = await response.json();
    return (data.features || [])
      .map(normalizePhotonFeature)
      .filter(Boolean);
  }

  async function fetchNominatimPlaces(query, limit, signal) {
    const url = new URL(CONFIG.search.endpoint);
    url.searchParams.set("q", query);
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", String(limit));
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("dedupe", "1");
    url.searchParams.set("accept-language", state.language);

    const response = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}`);
    }

    return response.json();
  }

  function normalizePhotonFeature(feature) {
    const properties = feature?.properties || {};
    const coordinates = feature?.geometry?.coordinates || [];
    const lon = Number(coordinates[0]);
    const lat = Number(coordinates[1]);

    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;

    const type = String(properties.type || "").toLowerCase();
    const name =
      properties.name ||
      properties.city ||
      properties.town ||
      properties.village ||
      properties.locality ||
      "";

    const address = {
      state: properties.state,
      county: properties.county,
      country: properties.country,
      postcode: properties.postcode,
      road:
        properties.street ||
        properties.road ||
        properties.name,
      house_number:
        properties.housenumber ||
        properties.house_number
    };

    if (type === "city") address.city = name;
    else if (type === "town") address.town = name;
    else if (type === "village") address.village = name;
    else if (type === "hamlet") address.hamlet = name;
    else if (type === "municipality") address.municipality = name;
    else if (type === "district" || type === "locality") address.suburb = name;
    else if (properties.city) address.city = properties.city;
    else if (properties.town) address.town = properties.town;
    else if (properties.village) address.village = properties.village;

    const displayParts = [
      name,
      properties.city && properties.city !== name
        ? properties.city
        : null,
      properties.state,
      properties.country
    ].filter(Boolean);

    return {
      lon,
      lat,
      name,
      display_name: [...new Set(displayParts)].join(", "),
      address,
      _provider: "photon",
      _placeType: type
    };
  }


  function isSettlementResult(result) {
    const type = String(result._placeType || "").toLowerCase();
    const address = result.address || {};

    return [
      "city",
      "town",
      "village",
      "hamlet",
      "municipality",
      "locality",
      "district"
    ].includes(type) || Boolean(
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.municipality
    );
  }

  function normalizeSearchText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function damerauLevenshtein(left, right) {
    const rows = left.length + 1;
    const columns = right.length + 1;
    const matrix = Array.from(
      { length: rows },
      () => Array(columns).fill(0)
    );

    for (let row = 0; row < rows; row++) matrix[row][0] = row;
    for (let column = 0; column < columns; column++) {
      matrix[0][column] = column;
    }

    for (let row = 1; row < rows; row++) {
      for (let column = 1; column < columns; column++) {
        const cost =
          left[row - 1] === right[column - 1] ? 0 : 1;

        matrix[row][column] = Math.min(
          matrix[row - 1][column] + 1,
          matrix[row][column - 1] + 1,
          matrix[row - 1][column - 1] + cost
        );

        if (
          row > 1 &&
          column > 1 &&
          left[row - 1] === right[column - 2] &&
          left[row - 2] === right[column - 1]
        ) {
          matrix[row][column] = Math.min(
            matrix[row][column],
            matrix[row - 2][column - 2] + cost
          );
        }
      }
    }

    return matrix[left.length][right.length];
  }

  function getSearchResultTitle(result) {
    const address = result.address || {};

    return (
      result.name ||
      address.amenity ||
      address.tourism ||
      address.shop ||
      address.leisure ||
      address.office ||
      address.building ||
      address.road ||
      address.city ||
      address.town ||
      address.village ||
      ""
    );
  }

  function getSearchResultSubtitle(result) {
    const address = result.address || {};

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      "";

    const number =
      address.house_number ||
      address.housenumber ||
      "";

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";

    const type = getSearchResultTypeLabel(result);
    const street = [road, number].filter(Boolean).join(" ");
    const location = [street, city].filter(Boolean).join(", ");

    const voivodeship =
      result.voivodeship ||
      result.teryt?.voivodeship ||
      address.state ||
      "";

    return [type, location, voivodeship]
      .filter(Boolean)
      .filter((value, index, values) => {
        const normalized = normalizeSearchText(value);
        return values.findIndex(
          candidate =>
            normalizeSearchText(candidate) === normalized
        ) === index;
      })
      .join(" · ");
  }

  function getSearchResultTypeLabel(result) {
    const category = getLocalizedCategory(result);
    return `${category.icon} ${category.label}`;
  }

  function getSearchResultEmoji(result) {
    const address = result.address || {};

    const raw = [
      result.type,
      result._placeType,
      result.category,
      result.name,
      address.amenity,
      address.tourism,
      address.shop,
      address.leisure,
      address.office,
      address.railway,
      address.highway
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const mapping = [
      [/restaurant|food|cuisine/, "🍽"],
      [/cafe|coffee/, "☕"],
      [/bar|pub|biergarten/, "🍺"],
      [/hotel|hostel|guest_house|motel/, "🏨"],
      [/fuel|petrol|gas_station/, "⛽"],
      [/museum|gallery/, "🏛"],
      [/theatre|theater/, "🎭"],
      [/cinema/, "🎬"],
      [/supermarket|mall|shop|convenience/, "🛒"],
      [/pharmacy/, "💊"],
      [/hospital|clinic|doctors/, "🏥"],
      [/school|college|university|kindergarten/, "🏫"],
      [/bank|atm/, "🏦"],
      [/park|garden|nature_reserve/, "🌳"],
      [/church|cathedral|chapel|place_of_worship/, "⛪"],
      [/bus_stop|bus_station|platform|stop_position/, "🚏"],
      [/station|railway|train/, "🚉"],
      [/airport|aerodrome/, "✈"],
      [/harbour|harbor|port|marina/, "⚓"],
      [/parking/, "🅿️"],
      [/library/, "📚"],
      [/stadium|sports_centre|sports_center/, "🏟"],
      [/monument|memorial|historic|castle/, "🏰"],
      [/beach/, "🏖"],
      [/house|building|address/, "🏠"],
      [/city|town|village|municipality/, "🏙"]
    ];

    for (const [pattern, emoji] of mapping) {
      if (pattern.test(raw)) return emoji;
    }

    return "📍";
  }

  function getSearchResultZoom(result) {
    const raw = [
      result.type,
      result._placeType,
      result.category
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (/country|state|region/.test(raw)) return 6;
    if (/county|district/.test(raw)) return 9;
    if (/city|town|village|municipality/.test(raw)) return 13;
    if (/street|road/.test(raw)) return 16;

    return 17;
  }

  function getPreferredPlaceLabel(result) {
    const address = result.address || {};

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      "";

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.cycleway ||
      address.path ||
      "";

    const houseNumber =
      address.house_number ||
      address.housenumber ||
      "";

    if (road) {
      const streetWithNumber = houseNumber
        ? `${road} ${houseNumber}`
        : road;

      return city
        ? `${city}, ${streetWithNumber}`
        : streetWithNumber;
    }

    const place =
      city ||
      result.name ||
      address.state ||
      address.county ||
      "";

    if (place) {
      const secondary =
        address.state ||
        address.county ||
        address.country;

      return secondary && secondary !== place
        ? `${place}, ${secondary}`
        : place;
    }

    return result.display_name || "";
  }

  function getPrimaryPlaceName(result) {
    const address = result.address || {};

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.cycleway ||
      address.path ||
      "";

    const houseNumber =
      address.house_number ||
      address.housenumber ||
      "";

    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      address.hamlet ||
      address.suburb ||
      "";

    if (road) {
      const streetWithNumber = houseNumber
        ? `${road} ${houseNumber}`
        : road;

      return city
        ? `${city}, ${streetWithNumber}`
        : streetWithNumber;
    }

    return (
      city ||
      result.name ||
      result.display_name ||
      ""
    );
  }

  function isAddressLikeQuery(query) {
    const normalized = normalizeSearchText(query);

    return (
      /\d/.test(normalized) ||
      normalized.split(" ").length >= 3 ||
      /\b(ul|ulica|aleja|al|plac|pl|rondo|osiedle|os)\b/.test(normalized)
    );
  }

  function resultToRoutePoint(result) {
    if (result.__resolvedPoint) {
      return {
        lon: Number(result.lon),
        lat: Number(result.lat),
        label: result.label
      };
    }

    return {
      lon: Number(result.lon),
      lat: Number(result.lat),
      label: getPreferredPlaceLabel(result)
    };
  }


  const MOBILE_PANEL_STANDARD = Object.freeze({
    collapsedHeight: 48,
    defaultHeightRatio: 0.42,
    viewportGap: 8
  });

  const mobilePanelMode = new Map();

  function isMobilePanelViewport() {
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function getMobilePanelViewportHeight() {
    return window.visualViewport?.height || window.innerHeight;
  }

  function getMobilePanelDefaultHeight() {
    return Math.max(
      MOBILE_PANEL_STANDARD.collapsedHeight,
      getMobilePanelViewportHeight() *
        MOBILE_PANEL_STANDARD.defaultHeightRatio
    );
  }

  function getMobilePanelMaximumHeight() {
    return Math.max(
      MOBILE_PANEL_STANDARD.collapsedHeight,
      getMobilePanelViewportHeight() -
        MOBILE_PANEL_STANDARD.viewportGap * 2
    );
  }

  function setMobilePanelHeight(
    panel,
    cssVariable,
    height,
    { animate = true, collapsed = null, mode = null } = {}
  ) {
    if (!panel || !isMobilePanelViewport()) return;

    const safeHeight = Math.min(
      getMobilePanelMaximumHeight(),
      Math.max(
        MOBILE_PANEL_STANDARD.collapsedHeight,
        Number(height)
      )
    );

    if (!animate) panel.classList.add("is-dragging");

    panel.style.setProperty(cssVariable, `${safeHeight}px`);
    document.documentElement.style.setProperty(
      cssVariable,
      `${safeHeight}px`
    );

    const shouldCollapse =
      collapsed ??
      safeHeight <= MOBILE_PANEL_STANDARD.collapsedHeight + 8;

    panel.classList.toggle("is-collapsed", shouldCollapse);

    // Tryb zapisujemy TYLKO wtedy, gdy wywołujący jawnie go poda -
    // żadnego zgadywania na podstawie wysokości, żeby stan zapisywał
    // się natychmiast i niezawodnie, a nie dopiero "za drugim razem".
    if (mode) {
      mobilePanelMode.set(cssVariable, mode);
    }

    if (animate) {
      requestAnimationFrame(() => {
        panel.classList.remove("is-dragging");
      });
    }
  }

  function openMobilePanelStandard(panel, cssVariable) {
    if (!panel) return;

    if (isMobilePanelViewport()) {
      setMobilePanelHeight(
        panel,
        cssVariable,
        getMobilePanelDefaultHeight(),
        { collapsed: false, mode: "default", animate: false }
      );
      panel.classList.remove("is-collapsed");
    }

    panel.hidden = false;
    panel.scrollTop = 0;

    requestAnimationFrame(() => {
      panel.classList.remove("is-dragging");
    });
  }

  function collapseMobilePanelStandard(panel, cssVariable) {
    setMobilePanelHeight(
      panel,
      cssVariable,
      MOBILE_PANEL_STANDARD.collapsedHeight,
      { collapsed: true, mode: "collapsed" }
    );
  }

  function stabilizeMobilePanelStandard(panel, cssVariable) {
    if (
      !panel ||
      panel.hidden ||
      !isMobilePanelViewport() ||
      panel.classList.contains("is-dragging") ||
      panel.classList.contains("is-collapsed")
    ) {
      return;
    }

    const refresh = () => {
      if (
        !panel.hidden &&
        !panel.classList.contains("is-dragging") &&
        !panel.classList.contains("is-collapsed")
      ) {
        setMobilePanelHeight(
          panel,
          cssVariable,
          getMobilePanelDefaultHeight(),
          { collapsed: false, mode: "default" }
        );
      }
    };

    [0, 80, 180, 320, 520, 700].forEach(delay => {
      setTimeout(refresh, delay);
    });
  }

  function initializeBottomSheet({
    panel,
    handle,
    close,
    cssVariable
  }) {
    if (!handle || !panel) return;

    let dragging = false;
    let startY = 0;
    let startHeight = 0;
    let activePointerId = null;
    let movedDuringGesture = false;

    const setDefaultHeight = () => {
      if (!isMobilePanelViewport()) {
        panel.style.removeProperty(cssVariable);
        panel.classList.remove("is-collapsed", "is-dragging");
        return;
      }

      if (
        panel.hidden ||
        panel.classList.contains("is-collapsed") ||
        panel.classList.contains("is-dragging")
      ) {
        return;
      }

      setMobilePanelHeight(
        panel,
        cssVariable,
        getMobilePanelDefaultHeight(),
        { collapsed: false, mode: "default" }
      );
    };

    handle.addEventListener("pointerdown", event => {
      if (!isMobilePanelViewport()) return;

      dragging = true;
      movedDuringGesture = false;
      activePointerId = event.pointerId;
      startY = event.clientY;
      startHeight = panel.getBoundingClientRect().height;
      panel.classList.add("is-dragging");
      handle.setPointerCapture(event.pointerId);
      event.preventDefault();
    });

    handle.addEventListener("pointermove", event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      const delta = startY - event.clientY;
      if (Math.abs(delta) > 4) movedDuringGesture = true;

      setMobilePanelHeight(
        panel,
        cssVariable,
        startHeight + delta,
        { animate: false }
      );
      event.preventDefault();
    });

    const finishDrag = event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      dragging = false;
      activePointerId = null;

      const height = panel.getBoundingClientRect().height;
      const collapsedHeight = MOBILE_PANEL_STANDARD.collapsedHeight;
      const defaultHeight = getMobilePanelDefaultHeight();
      const expandedHeight = getMobilePanelMaximumHeight();

      const lowerMidpoint = (collapsedHeight + defaultHeight) / 2;
      const upperMidpoint = (defaultHeight + expandedHeight) / 2;

      let targetHeight;
      let collapsed;
      let mode;

      if (height <= lowerMidpoint) {
        targetHeight = collapsedHeight;
        collapsed = true;
        mode = "collapsed";
      } else if (height <= upperMidpoint) {
        targetHeight = defaultHeight;
        collapsed = false;
        mode = "default";
      } else {
        targetHeight = expandedHeight;
        collapsed = false;
        mode = "expanded";
      }

      setMobilePanelHeight(
        panel,
        cssVariable,
        targetHeight,
        { collapsed, mode }
      );

      try {
        handle.releasePointerCapture(event.pointerId);
      } catch (_) {}
    };

    handle.addEventListener("pointerup", finishDrag);
    handle.addEventListener("pointercancel", finishDrag);

    handle.addEventListener("click", () => {
      if (!isMobilePanelViewport() || movedDuringGesture) return;

      const height = panel.getBoundingClientRect().height;
      const collapsedHeight = MOBILE_PANEL_STANDARD.collapsedHeight;
      const defaultHeight = getMobilePanelDefaultHeight();

      if (height <= collapsedHeight + 8) {
        openMobilePanelStandard(panel, cssVariable);
      } else if (height <= defaultHeight + 8) {
        setMobilePanelHeight(
          panel,
          cssVariable,
          getMobilePanelMaximumHeight(),
          { collapsed: false, mode: "expanded" }
        );
      } else {
        collapseMobilePanelStandard(panel, cssVariable);
      }
    });

    window.addEventListener("resize", setDefaultHeight);
    window.visualViewport?.addEventListener("resize", setDefaultHeight);
    setDefaultHeight();
  }

  function initializeRouteBottomSheet() {
    initializeBottomSheet({
      panel: el.routePanel,
      handle: el.routeSheetHandle,
      close: closeRoute,
      cssVariable: "--route-sheet-height"
    });
  }

  function initializeDiscoverBottomSheet() {
    initializeBottomSheet({
      panel: el.discoverPanel,
      handle: el.discoverSheetHandle,
      close: closeDiscover,
      cssVariable: "--discover-sheet-height"
    });
  }

  function initializeMenuBottomSheet() {
    initializeBottomSheet({
      panel: el.menuPanel,
      handle: el.menuSheetHandle,
      close: closeMenu,
      cssVariable: "--menu-sheet-height"
    });
  }

  function initializeFavoritesBottomSheet() {
    initializeBottomSheet({
      panel: el.favoritesPanel,
      handle: el.favoritesSheetHandle,
      close: closeFavoritesPanel,
      cssVariable: "--favorites-sheet-height"
    });
  }

  function initializeHistoryBottomSheet() {
    initializeBottomSheet({
      panel: el.historyPanel,
      handle: el.historySheetHandle,
      close: closeHistory,
      cssVariable: "--history-sheet-height"
    });
  }

  function initializePlaceBottomSheet() {
    initializeBottomSheet({
      panel: el.placePanel,
      handle: el.placeSheetHandle,
      close: closePlacePanel,
      cssVariable: "--place-sheet-height"
    });
  }

  function initializeLegendBottomSheet() {
    initializeBottomSheet({
      panel: el.legendPanel,
      handle: el.legendSheetHandle,
      close: closeLegend,
      cssVariable: "--legend-sheet-height"
    });
  }

  function initializeAboutBottomSheet() {
    initializeBottomSheet({
      panel: el.aboutPanel,
      handle: el.aboutSheetHandle,
      close: closeAbout,
      cssVariable: "--about-sheet-height"
    });
  }

  function initializeBackupBottomSheet() {
    initializeBottomSheet({
      panel: el.backupPanel,
      handle: el.backupSheetHandle,
      close: closeBackup,
      cssVariable: "--backup-sheet-height"
    });
  }


  function toggleDiscover() {
    closeMapContextMenu();
    closePlacePanel();
    closeFavoritesPanel();
    closeHistory();
    closeMenu();
    const shouldOpen = el.discoverPanel.hidden;

    closeLegend();
    closeAbout();
    closeBackup();
    closeDiscover();
    closeRoute();

    el.discoverPanel.hidden = !shouldOpen;
    if (shouldOpen) {
      openMobilePanelStandard(el.discoverPanel, "--discover-sheet-height");
    }
    
    el.discoverButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.discoverButton?.classList.toggle("is-active", shouldOpen);
    el.mobileDiscoverButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.mobileDiscoverButton?.classList.toggle("is-active", shouldOpen);
el.discoverButton?.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }

  function openDiscoverNearPlace(place, lngLat) {
    closePlacePanel();
    closeMapContextMenu();
    closeFavoritesPanel();
    closeHistory();
    closeMenu();
    closeLegend();
    closeAbout();
    closeBackup();
    closeRoute();

    map.flyTo({
      center: [lngLat.lng, lngLat.lat],
      zoom: Math.max(map.getZoom(), 15)
    });

    state.discoverBackContext = { place, lngLat };
    if (el.discoverBack) el.discoverBack.hidden = false;

    openMobilePanelStandard(el.discoverPanel, "--discover-sheet-height");
    el.discoverButton?.setAttribute("aria-expanded", "true");
    el.discoverButton?.classList.add("is-active");
    el.mobileDiscoverButton?.setAttribute("aria-expanded", "true");
    el.mobileDiscoverButton?.classList.add("is-active");
  }

  function returnFromDiscoverToPlace() {
    const context = state.discoverBackContext;
    if (!context) return;

    state.discoverBackContext = null;
    closeDiscover();

    window.OMAP_PLACE_SERVICE.open(
      {
        ...context.place,
        lat: Number(context.lngLat.lat),
        lon: Number(context.lngLat.lng)
      },
      { source: "discover-nearby" }
    );
  }

  function closeDiscover(clearResults = true) {
    if (el.discoverPanel.hidden) return;

    if (clearResults) {
      clearDiscoverResults();
    }

    state.discoverBackContext = null;
    if (el.discoverBack) el.discoverBack.hidden = true;

    el.discoverPanel.hidden = true;
    el.discoverButton?.setAttribute("aria-expanded", "false");
    el.discoverButton?.classList.remove("is-active");
    el.mobileDiscoverButton?.setAttribute("aria-expanded", "false");
    el.mobileDiscoverButton?.classList.remove("is-active");
  }

  function toggleRoute() {
    closeMapContextMenu();
    closePlacePanel();
    closeFavoritesPanel();
    closeHistory();
    closeMenu();
    const shouldOpen = el.routePanel.hidden;
    closeDiscover();
    closePlacePopup();
    closeLegend();
    closeAbout();
    closeBackup();
    if (!shouldOpen) {
      state.routeBackContext = null;
      if (el.routeBack) el.routeBack.hidden = true;
    }
    el.routePanel.hidden = !shouldOpen;
    if (shouldOpen) {
      openMobilePanelStandard(el.routePanel, "--route-sheet-height");
    }
    
    el.routeButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.routeButton?.classList.toggle("is-active", shouldOpen);
    el.mobileRouteButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.mobileRouteButton?.classList.toggle("is-active", shouldOpen);
el.routeButton?.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
      state.routeClickStage = state.routePointA
        ? (state.routePointB ? "move-b" : "b")
        : "a";
      document.body.classList.add("map-picking-route");
      updateRouteClickHint();
    } else {
      document.body.classList.remove("map-picking-route");
    }
  }

  function returnFromRouteToPlace() {
    const context = state.routeBackContext;
    if (!context) return;

    state.routeBackContext = null;
    closeRoute();

    window.OMAP_PLACE_SERVICE.open(
      {
        ...context.place,
        lat: Number(context.lngLat.lat),
        lon: Number(context.lngLat.lng)
      },
      { source: "route-nearby" }
    );
  }

  function closeRoutePanel() {
    if (el.routePanel.hidden) return;
    clearRoute();
    state.routeBackContext = null;
    if (el.routeBack) el.routeBack.hidden = true;
    el.routePanel.hidden = true;
    el.routeButton?.setAttribute("aria-expanded","false");
  }

function closeRoute() {
    if (el.routePanel.hidden) return;
    clearRoute();
    hideAllAutocomplete();
    state.routeBackContext = null;
    if (el.routeBack) el.routeBack.hidden = true;
    el.routePanel.hidden = true;
    el.routeButton?.setAttribute("aria-expanded", "false");
    el.routeButton?.classList.remove("is-active");
    el.mobileRouteButton?.setAttribute("aria-expanded", "false");
    el.mobileRouteButton?.classList.remove("is-active");
    document.body.classList.remove("map-picking-route");
  }

  function swapRoutePoints() {
    const value = el.routeFrom.value;
    if (el.routeFrom) el.routeFrom.value = el.routeTo.value;
    if (el.routeTo) el.routeTo.value = value;

    const point = state.routePointA;
    state.routePointA = state.routePointB;
    state.routePointB = point;

    refreshRouteMarkers();

    if (state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
    }

    state.routeClickStage = state.routePointA
      ? (state.routePointB ? "move-b" : "b")
      : "a";
    updateRouteClickHint();
  }


  function cancelMapLongPress() {
    if (state.mapLongPressTimer) {
      window.clearTimeout(state.mapLongPressTimer);
    }

    state.mapLongPressTimer = null;
    state.mapLongPressStartPoint = null;
  }

  function handleMapLongPressStart(event) {
    if (
      !window.matchMedia("(pointer: coarse)").matches ||
      !event.points?.length
    ) {
      return;
    }

    cancelMapLongPress();
    state.mapLongPressTriggered = false;
    state.mapLongPressStartPoint = event.points[0];

    const lngLat = new maplibregl.LngLat(
      event.lngLat.lng,
      event.lngLat.lat
    );

    state.mapLongPressTimer = window.setTimeout(() => {
      state.mapLongPressTimer = null;
      state.mapLongPressTriggered = true;

      openMapContextMenu({
        lngLat,
        point: state.mapLongPressStartPoint,
        originalEvent: event.originalEvent || {
          clientX: state.mapLongPressStartPoint.x,
          clientY: state.mapLongPressStartPoint.y,
          preventDefault() {}
        }
      });

      navigator.vibrate?.(35);
    }, 550);
  }

  function handleMapLongPressMove(event) {
    if (
      !state.mapLongPressTimer ||
      !state.mapLongPressStartPoint ||
      !event.points?.length
    ) {
      return;
    }

    const point = event.points[0];
    const distance = Math.hypot(
      point.x - state.mapLongPressStartPoint.x,
      point.y - state.mapLongPressStartPoint.y
    );

    if (distance > 12) {
      cancelMapLongPress();
    }
  }

  function handleMapLongPressEnd(event) {
    const triggered = state.mapLongPressTriggered;
    cancelMapLongPress();

    if (triggered) {
      event.preventDefault?.();
      event.originalEvent?.preventDefault?.();
      state.mapLongPressTriggered = false;
    }
  }

  function updateMapContextMenuLabels() {
    const t = text[state.language];
    const labels = {
      "route-a": t.contextRouteA,
      "route-b": t.contextRouteB,
      copy: t.contextCopyCoordinates,
      info: t.contextShowInformation,
      favorite: t.contextAddFavorite
    };

    for (const element of document.querySelectorAll(
      "[data-map-context-label]"
    )) {
      element.textContent =
        labels[element.dataset.mapContextLabel] ||
        element.textContent;
    }

    el.mapContextMenu?.setAttribute(
      "aria-label",
      state.language === "pl"
        ? "Opcje punktu na mapie"
        : "Map point options"
    );
  }

  function findNearestPoiFeature(point) {
    if (!point) return null;

    const tolerance = 14;
    const box = [
      [point.x - tolerance, point.y - tolerance],
      [point.x + tolerance, point.y + tolerance]
    ];

    let features;
    try {
      features = map.queryRenderedFeatures(box);
    } catch (error) {
      console.error(error);
      return null;
    }

    let closest = null;
    let closestDistance = Infinity;

    for (const feature of features) {
      if (feature.geometry?.type !== "Point") continue;
      if (!feature.properties?.name) continue;

      const [lon, lat] = feature.geometry.coordinates;
      const featurePoint = map.project([lon, lat]);
      const distance = Math.hypot(
        featurePoint.x - point.x,
        featurePoint.y - point.y
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closest = {
          lon,
          lat,
          name: feature.properties.name,
          sourceLayer: feature.sourceLayer || "",
          featureClass: feature.properties?.class || ""
        };
      }
    }

    return closest;
  }

  function findLocalCityByName(name) {
    const database = window.OMAP_SEARCH_V2_LOCATIONS_PL;
    if (!database || !name) return null;

    const normalizeCityName = value =>
      String(value || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ł/g, "l")
        .replace(/Ł/g, "L")
        .toLowerCase()
        .trim();

    const target = normalizeCityName(name);

    for (const city of database.cities || []) {
      if (
        typeof city.lat !== "number" ||
        typeof city.lon !== "number"
      ) {
        continue;
      }

      const names = [city.name, ...(city.aliases || [])].map(
        normalizeCityName
      );

      if (names.includes(target)) return city;
    }

    return null;
  }

  function openMapContextMenu(event) {
    event.originalEvent?.preventDefault();
    if (!el.mapContextMenu) return;

    closeMapContextMenu();
    closeMenu();

    state.contextMenuLngLat = new maplibregl.LngLat(
      event.lngLat.lng,
      event.lngLat.lat
    );
    state.contextMenuPoint = event.point || null;

    showContextPointMarker(state.contextMenuLngLat);
    updateMapContextMenuLabels();
    el.mapContextMenu.hidden = false;

    const originalEvent = event.originalEvent;
    const clientX = Number(
      originalEvent?.clientX ??
      event.point?.x ??
      0
    );
    const clientY = Number(
      originalEvent?.clientY ??
      event.point?.y ??
      0
    );

    const rect = el.mapContextMenu.getBoundingClientRect();
    const margin = 8;

    const left = Math.min(
      Math.max(margin, clientX),
      window.innerWidth - rect.width - margin
    );

    const top = Math.min(
      Math.max(margin, clientY),
      window.innerHeight - rect.height - margin
    );

    el.mapContextMenu.style.left = `${left}px`;
    el.mapContextMenu.style.top = `${top}px`;

    el.mapContextMenu
      .querySelector("button")
      ?.focus({ preventScroll: true });
  }

  function closeMapContextMenu() {
    state.contextMenuLngLat = null;

    if (!el.mapContextMenu) return;
    el.mapContextMenu.hidden = true;
  }

  async function setContextPointAsRoute(key, lngLat) {
    if (!lngLat) return;

    const point = {
      lon: lngLat.lng,
      lat: lngLat.lat,
      label: formatCoordinates(lngLat.lng, lngLat.lat)
    };

    try {
      point.label = await reverseGeocodeRoutePoint(point);
    } catch (error) {
      console.warn("Context route reverse geocoding failed.", error);
    }

    if (el.routePanel.hidden) {
      toggleRoute();
    }

    if (key === "a") {
      state.routePointA = point;
      if (el.routeFrom) el.routeFrom.value = point.label;
      setRouteMarker("a", point);
    } else {
      state.routePointB = point;
      if (el.routeTo) el.routeTo.value = point.label;
      setRouteMarker("b", point);
    }

    state.routeClickStage = state.routePointA
      ? (state.routePointB ? "move-b" : "b")
      : "a";

    updateRouteClickHint();

    if (state.routePointA && state.routePointB) {
      await calculateRouteFromStoredPoints();
    }
  }

  async function addContextPointToFavorites(lngLat) {
    if (!lngLat) return;

    show(text[state.language].placeLoading, 0);

    try {
      const place = await fetchPlaceInformation(
        lngLat.lng,
        lngLat.lat
      );

      const key = getFavoriteKey(place, lngLat);
      const nowFavorite = toggleFavorite(
        key,
        place,
        lngLat
      );

      show(
        nowFavorite
          ? text[state.language].contextFavoriteAdded
          : text[state.language].contextFavoriteRemoved
      );
    } catch (error) {
      console.error(error);
      show(text[state.language].placeError);
    }
  }

  async function handleMapContextAction(event) {
    const button = event.target.closest(
      "[data-map-context-action]"
    );
    if (!button || !state.contextMenuLngLat) return;

    const action = button.dataset.mapContextAction;
    const lngLat = new maplibregl.LngLat(
      state.contextMenuLngLat.lng,
      state.contextMenuLngLat.lat
    );

    closeMapContextMenu();

    if (action === "route-a") {
      await setContextPointAsRoute("a", lngLat);
      return;
    }

    if (action === "route-b") {
      await setContextPointAsRoute("b", lngLat);
      return;
    }

    if (action === "copy") {
      await copyValue(
        `${lngLat.lat.toFixed(6)}, ${lngLat.lng.toFixed(6)}`,
        text[state.language].placeCoordinatesCopied
      );
      return;
    }

    if (action === "info") {
      removeContextPointMarker();

      const poi = findNearestPoiFeature(state.contextMenuPoint);
      let localCity = null;

      try {
        const looksLikePlaceLabel =
          poi &&
          poi.sourceLayer === "place" &&
          !/rail|station|stop|dworzec|przystanek|airport|lotnisko/i.test(
            poi.featureClass || ""
          );

        localCity = looksLikePlaceLabel
          ? findLocalCityByName(poi.name)
          : null;
      } catch (error) {
        console.error(error);
        localCity = null;
      }

      if (localCity) {
        closeMapContextMenu();
        showSelectedPlaceInformation({
          place_id: `local:${localCity.id}`,
          name: localCity.name,
          display_name: [localCity.name, "Polska"]
            .filter(Boolean)
            .join(", "),
          lat: localCity.lat,
          lon: localCity.lon,
          class: "place",
          type: "city",
          importance: 0.8,
          address: { city: localCity.name },
          provider: "local"
        });
        return;
      }

      const targetLngLat = poi
        ? new maplibregl.LngLat(poi.lon, poi.lat)
        : lngLat;

      await openMapInformationThroughService(
        targetLngLat,
        {
          origin: "map-context-menu"
        }
      );

      return;
    }

    if (action === "favorite") {
      await addContextPointToFavorites(lngLat);
    }
  }


  function collapseMobilePanel(panel, cssVariable) {
    if (!panel || panel.hidden) return;
    collapseMobilePanelStandard(panel, cssVariable);
  }

  function collapseMobileRoutePanel() {
    collapseMobilePanel(
      el.routePanel,
      "--route-sheet-height"
    );
  }

  function expandMobileRoutePanel() {
    openMobilePanelStandard(
      el.routePanel,
      "--route-sheet-height"
    );
  }

  function collapseMobilePanels() {
    collapseMobilePanel(
      el.discoverPanel,
      "--discover-sheet-height"
    );
    collapseMobilePanel(
      el.menuPanel,
      "--menu-sheet-height"
    );
    collapseMobilePanel(
      el.favoritesPanel,
      "--favorites-sheet-height"
    );
    collapseMobilePanel(
      el.placePanel,
      "--place-sheet-height"
    );
  }

  async function handleMapClick(event) {
    if (state.mapLongPressTriggered) {
      state.mapLongPressTriggered = false;
      return;
    }

    if (!window.matchMedia("(max-width: 600px)").matches) {
      closePlacePanel();
    }

    closeMapContextMenu();
    removeContextPointMarker();
    collapseMobilePanels();

    if (!el.routePanel.hidden) {
      const routeStageBeforeClick =
        state.routeClickStage;

      await handleRouteMapClick(event);

      const routeStageAfterClick =
        state.routeClickStage;

      const isPointBInteraction =
        routeStageBeforeClick === "b" ||
        routeStageBeforeClick === "move-b" ||
        routeStageAfterClick === "b" ||
        routeStageAfterClick === "move-b";

      // Panel pozostaje otwarty przy pierwszym wyborze B
      // oraz przy każdym późniejszym przesuwaniu punktu B.
      if (isPointBInteraction) {
        expandMobileRoutePanel();
      } else {
        collapseMobileRoutePanel();
      }

      return;
    }

    // Zwykłe kliknięcie pustego obszaru mapy nie wykonuje
    // reverse geocodingu i nie otwiera panelu Informacje.
  }


  function getLocalizedCategoryLegacy(result) {
    return window.OMAP_CATEGORY_LABELS
      ? window.OMAP_CATEGORY_LABELS.resolve(result, state.language)
      : {
          label: String(
            result?.type || result?.category || result?.class || "miejsce"
          ).replaceAll("_", " "),
          icon: "📍"
        };
  }

  window.OMAP_CATEGORY_SERVICE?.configure({
    resolve(result, language) {
      if (window.OMAP_CATEGORY_LABELS) {
        return window.OMAP_CATEGORY_LABELS.resolve(
          result,
          language
        );
      }

      return getLocalizedCategoryLegacy(result);
    }
  });

  function getLocalizedCategory(result) {
    if (window.OMAP_CATEGORY_SERVICE) {
      return window.OMAP_CATEGORY_SERVICE.resolve(
        result,
        state.language
      );
    }

    return getLocalizedCategoryLegacy(result);
  }


  function getResultLngLat(result) {
    const lng = Number(result?.lon ?? result?.center?.lon ?? result?.center?.lng);
    const lat = Number(result?.lat ?? result?.center?.lat);
    return Number.isFinite(lng) && Number.isFinite(lat)
      ? new maplibregl.LngLat(lng, lat)
      : null;
  }


  function isExactNamedPoi(result) {
    return Boolean(
      result &&
      (
        result._exactLocalIdentity ||
        result.provider === "named-poi" ||
        result.namedPoiId
      )
    );
  }

  function activateNamedPoiGuard(result) {
    state.namedPoiGuardId += 1;
    state.activeNamedPoiId =
      result?.namedPoiId ||
      result?.place_id ||
      null;

    return state.namedPoiGuardId;
  }

  function invalidateNamedPoiGuard() {
    state.namedPoiGuardId += 1;
    state.activeNamedPoiId = null;
  }

  function canReverseGeocodeForGuard(guardId) {
    return (
      guardId === state.namedPoiGuardId &&
      !state.activeNamedPoiId
    );
  }

  async function showSelectedPlaceInformation(result) {
    if (isExactNamedPoi(result)) {
      activateNamedPoiGuard(result);
    } else {
      invalidateNamedPoiGuard();
    }

    const lngLat = getResultLngLat(result);
    if (!result || !lngLat) return;

    state.placeRequestController?.abort();
    state.placeRequestController = null;
    state.placePanelLngLat = lngLat;

    const details = {
      ...result,
      name:
        result.namedetails?.["name:pl"] ||
        result.namedetails?.name ||
        result.name ||
        String(result.display_name || "").split(",")[0],
      address: {
        ...(result.address || {})
      },
      extratags: {
        ...(result.extratags || {})
      },
      namedetails: {
        ...(result.namedetails || {})
      }
    };

    state.selectedPlace = details;

    showSelectedPlaceMarker(lngLat);
    openPlacePanel();
    renderPlaceInformation(details, lngLat);

    // Po zamknięciu listy wyników przeglądarka ponownie układa
    // mobilny interfejs, więc utrwalamy tę samą wysokość panelu.
    stabilizeMobilePlacePanelHeight();
  }

  function renderPlaceInformation(place, lngLat) {
    if (
      !el.placePanel ||
      el.placePanel.hidden ||
      !el.placePanelContent
    ) {
      return;
    }

    el.placePanelContent.replaceChildren(
      createPlaceCard(place, lngLat)
    );

    el.placePanel.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function createSelectedPlaceMarkerElement() {
    const element = document.createElement("div");
    element.className = "selected-place-marker";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML =
      '<span class="selected-place-marker-dot"></span>';
    return element;
  }

  function showSelectedPlaceMarker(lngLat) {
    if (!lngLat) return;

    if (!state.selectedPlaceMarker) {
      state.selectedPlaceMarker = new maplibregl.Marker({
        element: createSelectedPlaceMarkerElement(),
        anchor: "center"
      });
    }

    state.selectedPlaceMarker
      .setLngLat(lngLat)
      .addTo(map);
  }

  function removeSelectedPlaceMarker() {
    state.selectedPlaceMarker?.remove();
    state.selectedPlaceMarker = null;
  }

  function createContextPointMarkerElement() {
    const element = document.createElement("div");
    element.className = "context-point-marker";
    element.setAttribute("aria-hidden", "true");
    element.innerHTML =
      '<span class="context-point-marker-dot"></span>';
    return element;
  }

  function showContextPointMarker(lngLat) {
    if (!lngLat) return;

    if (!state.contextPointMarker) {
      state.contextPointMarker = new maplibregl.Marker({
        element: createContextPointMarkerElement(),
        anchor: "center"
      });
    }

    state.contextPointMarker
      .setLngLat(lngLat)
      .addTo(map);
  }

  function removeContextPointMarker() {
    state.contextPointMarker?.remove();
    state.contextPointMarker = null;
  }


  function createUserLocationMarkerElement() {
    const element = document.createElement("div");
    element.className = "user-location-marker";
    element.setAttribute(
      "aria-label",
      state.language === "pl"
        ? "Twoja lokalizacja"
        : "Your location"
    );
    element.innerHTML =
      '<span class="user-location-marker-pulse"></span>' +
      '<span class="user-location-marker-dot"></span>';
    return element;
  }

  function showUserLocationMarker(lngLat) {
    if (!lngLat) return;

    if (!state.userLocationMarker) {
      state.userLocationMarker = new maplibregl.Marker({
        element: createUserLocationMarkerElement(),
        anchor: "center"
      });
    }

    state.userLocationMarker
      .setLngLat(lngLat)
      .addTo(map);
  }

  function removeUserLocationMarker() {
    state.userLocationMarker?.remove();
    state.userLocationMarker = null;
  }


  function normalizeMobilePlacePanelHeight() {
    openMobilePanelStandard(
      el.placePanel,
      "--place-sheet-height"
    );
  }

  let placePanelViewportTimer = null;

  function stabilizeMobilePlacePanelHeight() {
    stabilizeMobilePanelStandard(
      el.placePanel,
      "--place-sheet-height"
    );
  }

  function prepareMobilePlacePanelAfterSearch() {
    if (!isMobilePanelViewport()) return;

    const active = document.activeElement;
    if (active instanceof HTMLElement) active.blur();

    hideAllAutocomplete();
    stabilizeMobilePlacePanelHeight();
  }


  function setPlacePanelReturnTarget(type, data = {}) {
    window.OMAP_BACK_NAVIGATION.set(
      type,
      data
    );
  }

  function clearPlacePanelReturnTarget() {
    window.OMAP_BACK_NAVIGATION.clear();
  }

  function reopenSearchResults(query) {
    if (!el.searchInput) return;

    if (query) {
      el.searchInput.value = query;
      updateSearchClearButton();
    }

    window.requestAnimationFrame(() => {
      el.searchInput.focus();
      el.searchInput.dispatchEvent(
        new Event("input", { bubbles: true })
      );
    });
  }

  function reopenDiscoverPanel(target) {
    if (!el.discoverPanel) return;

    openMobilePanelStandard(
      el.discoverPanel,
      "--discover-sheet-height"
    );
    el.discoverPanel.classList.remove("is-collapsed");

    const scrollTop = target?.scrollTop || 0;
    if (scrollTop) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.discoverPanel.scrollTop = scrollTop;
        });
      });
    }

    el.discoverButton?.setAttribute(
      "aria-expanded",
      "true"
    );
    el.discoverButton?.classList.add("is-active");
    el.mobileDiscoverButton?.setAttribute(
      "aria-expanded",
      "true"
    );
    el.mobileDiscoverButton?.classList.add("is-active");
  }


  window.OMAP_BACK_NAVIGATION?.configure({
    onChange(target) {
      state.placePanelReturnTarget =
        target;

      if (el.placePanelBack) {
        el.placePanelBack.hidden =
          !target;
      }
    }
  });

  window.OMAP_BACK_NAVIGATION?.register(
    "favorites",
    () => openFavoritesPanel()
  );

  window.OMAP_BACK_NAVIGATION?.register(
    "history",
    () => openHistoryPanel()
  );

  window.OMAP_BACK_NAVIGATION?.register(
    "discover",
    target => reopenDiscoverPanel(target)
  );

  window.OMAP_BACK_NAVIGATION?.register(
    "search",
    target => {
      reopenSearchResults(
        target.query || ""
      );
    }
  );

  function returnFromPlacePanel() {
    const target =
      window.OMAP_BACK_NAVIGATION.get();

    closePlacePanel();

    if (!target) return;

    window.OMAP_BACK_NAVIGATION.set(
      target.type,
      target
    );

    window.OMAP_BACK_NAVIGATION.goBack();
  }

  function openPlacePanel() {
    closeMenu();
    closeLegend();
    closeAbout();
    closeBackup();
    closeDiscover(
      state.placePanelReturnTarget?.type !== "discover"
    );
    closeFavoritesPanel();
    closeHistory();
    closeRoutePanel();

    if (!el.placePanel) return;

    openMobilePanelStandard(
      el.placePanel,
      "--place-sheet-height"
    );
  }

  function closePlacePanel() {
    invalidateNamedPoiGuard();
    window.OMAP_SEARCH_SESSION?.cancel?.();
    state.placeRequestController?.abort();
    state.placeRequestController = null;
    state.placePanelLngLat = null;
    state.selectedPlace = null;
    state.placePopup = null;
    clearPlacePanelReturnTarget();
    removeSelectedPlaceMarker();

    if (el.placePanel) {
      el.placePanel.hidden = true;
    }

    if (el.placePanelContent) {
      el.placePanelContent.replaceChildren();
    }
  }

  // Zachowujemy dawną nazwę funkcji, żeby istniejące wywołania
  // czyszczenia karty miejsca nadal działały.
  function closePlacePopup() {
    closePlacePanel();
  }

  // Wywoływana tylko dla świadomie wybranego miejsca.
  async function showPlaceInformation(event) {
    window.OMAP_SEARCH_SESSION?.cancel?.();
    clearPlacePanelReturnTarget();

    const guardId = state.namedPoiGuardId;

    if (
      state.activeNamedPoiId &&
      !event?.forceReverse
    ) {
      return;
    }
    state.selectedPlace = null;
    state.placeRequestController?.abort();
    state.placeRequestController = new AbortController();
    state.placePanelLngLat = event.lngLat;

    showSelectedPlaceMarker(event.lngLat);
    openPlacePanel();

    const t = text[state.language];
    const loading = document.createElement("div");
    loading.className = "place-card place-card-loading";
    loading.textContent = t.placeLoading;

    el.placePanelContent?.replaceChildren(loading);

    try {
      const place = await fetchPlaceInformation(
        event.lngLat.lng,
        event.lngLat.lat,
        state.placeRequestController.signal
      );

      if (
        !el.placePanel ||
        el.placePanel.hidden ||
        state.placePanelLngLat !== event.lngLat
      ) {
        return;
      }

      if (
        !canReverseGeocodeForGuard(guardId)
      ) {
        return;
      }

      el.placePanelContent.replaceChildren(
        createPlaceCard(place, event.lngLat)
      );

      stabilizeMobilePlacePanelHeight();

      el.placePanel.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);

      const failed = document.createElement("div");
      failed.className = "place-card place-card-loading";
      failed.textContent = t.placeError;

      el.placePanelContent?.replaceChildren(failed);
    }
  }

  async function fetchPlaceInformation(lon, lat, signal) {
    const url = new URL(CONFIG.search.reverseEndpoint);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("extratags", "1");
    url.searchParams.set("namedetails", "1");
    url.searchParams.set("accept-language", state.language);
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse HTTP ${response.status}`);
    }

    return response.json();
  }

  function createPlaceCardLegacy(place, lngLat) {
    const t = text[state.language];
    const card = document.createElement("article");
    card.className = "place-card";

    if (window.OMAP_PHOTO_GALLERY) {
      card.appendChild(
        window.OMAP_PHOTO_GALLERY.create(
          place,
          {
            getImageUrl: getPlaceImageUrl
          }
        )
      );
    } else {
      const imageUrl = getPlaceImageUrl(place);

      if (imageUrl) {
        const image = document.createElement("img");
        image.className = "place-card-image";
        image.src = imageUrl;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        image.referrerPolicy = "no-referrer";
        image.addEventListener(
          "error",
          () => image.remove()
        );
        card.appendChild(image);
      }
    }

    const headingRow = document.createElement("div");
    headingRow.className = "place-card-heading";

    const typeIcon = document.createElement("span");
    typeIcon.className = "place-card-type-icon";
    typeIcon.setAttribute("aria-hidden", "true");
    typeIcon.textContent = getPlaceEmoji(place);

    const headingCopy = document.createElement("div");
    headingCopy.className = "place-card-heading-copy";

    const heading = document.createElement("h3");
    heading.className = "place-card-title";
    heading.textContent = getPlaceTitle(place) || t.placeUnknown;

    const type = document.createElement("p");
    type.className = "place-card-type";
    type.textContent = getPlaceTypeLabel(place);

    headingCopy.appendChild(heading);
    if (type.textContent) headingCopy.appendChild(type);
    headingRow.append(typeIcon, headingCopy);
    card.appendChild(headingRow);

    const isNamedSettlement =
      ["city", "town", "village"].includes(
        String(place?.type || "").toLowerCase()
      ) && Boolean(place?.name);

    if (
      place?.extratags?.wikipedia ||
      place?.extratags?.wikidata ||
      isNamedSettlement
    ) {
      const wikipedia = createWikipediaSection();
      card.appendChild(wikipedia.section);
      loadWikipediaSummaryForPlace(place, wikipedia);
    }

    const details = document.createElement("div");
    details.className = "place-card-details";

    const addressText = getPlaceAddress(place);
    if (addressText) {
      details.appendChild(
        createInteractivePlaceRow(
          "📍",
          addressText,
          () => copyValue(addressText, t.placeAddressCopied)
        )
      );
    }

    const coordinatesText = formatCoordinates(lngLat.lng, lngLat.lat);
    details.appendChild(
      createInteractivePlaceRow(
        "🌍",
        coordinatesText,
        () => copyValue(coordinatesText, t.placeCoordinatesCopied)
      )
    );

    const extra = place.extratags || {};
    const phone = extra.phone || extra["contact:phone"] || "";
    const website =
      extra.website ||
      extra["contact:website"] ||
      extra.url ||
      "";
    const openingHours = extra.opening_hours || "";

    if (openingHours) {
      details.appendChild(
        createStaticPlaceRow(
          "🕒",
          state.language === "pl"
            ? formatOpeningHoursPolish(openingHours)
            : openingHours
        )
      );
    }

    if (phone) {
      details.appendChild(
        createPhonePlaceRow(phone)
      );
    }

    if (website) {
      details.appendChild(
        createWebsitePlaceRow(website)
      );
    }

    card.appendChild(details);

    if (isTransitStopPlace(place)) {
      const departures = createDeparturesSection();
      card.appendChild(departures.section);
      loadDeparturesForPlace(place, lngLat, departures);
    }

    const actions = document.createElement("div");
    actions.className = "place-card-actions";

    const favoriteKey = getFavoriteKey(place, lngLat);

    actions.append(
      createPlaceAction("↪️", t.placeSetRoute, () => {
        setPlaceAsRoutePoint("b", place, lngLat);
      }),
      createPlaceAction("🧭", t.placeNearby, () => {
        openDiscoverNearPlace(place, lngLat);
      }),
      createPlaceAction(
        isFavorite(favoriteKey) ? "★" : "☆",
        state.language === "pl"
          ? "Dodaj do ulubionych"
          : "Add to favorites",
        button => {
          const nowFavorite = toggleFavorite(
            favoriteKey,
            place,
            lngLat
          );
          button.textContent = nowFavorite ? "★" : "☆";
          button.classList.toggle("is-favorite", nowFavorite);
        },
        isFavorite(favoriteKey)
      ),
      createPlaceAction("🔗", t.placeShare, () => {
        sharePlace(place, lngLat);
      })
    );

    card.appendChild(actions);
    return card;
  }

  window.OMAP_PLACE_CARD?.configure({
    render: createPlaceCardLegacy
  });

  function createPlaceCard(place, lngLat) {
    recordPlaceHistory(place, lngLat);

    if (
      window.OMAP_PLACE_CARD?.isConfigured?.()
    ) {
      return window.OMAP_PLACE_CARD.create(
        place,
        lngLat
      );
    }

    return createPlaceCardLegacy(place, lngLat);
  }


  function createInteractivePlaceRow(iconText, valueText, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-card-row place-card-row-interactive";

    const icon = document.createElement("span");
    icon.className = "place-card-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconText;

    const value = document.createElement("span");
    value.className = "place-card-row-value";
    value.textContent = valueText;

    button.append(icon, value);
    button.addEventListener("click", async () => {
      await onClick();
      flashPlaceRow(button, icon);
    });

    return button;
  }

  function createStaticPlaceRow(iconText, valueText) {
    const row = document.createElement("div");
    row.className = "place-card-row";

    const icon = document.createElement("span");
    icon.className = "place-card-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = iconText;

    const value = document.createElement("span");
    value.className = "place-card-row-value";
    value.textContent = valueText;

    row.append(icon, value);
    return row;
  }

  function createPhonePlaceRow(phone) {
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

    if (isTouchDevice) {
      const link = document.createElement("a");
      link.className = "place-card-row place-card-row-interactive";
      link.href = `tel:${phone.replace(/[^\d+]/g, "")}`;

      const icon = document.createElement("span");
      icon.className = "place-card-row-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "☎";

      const value = document.createElement("span");
      value.className = "place-card-row-value";
      value.textContent = phone;

      link.append(icon, value);
      return link;
    }

    return createInteractivePlaceRow(
      "☎",
      phone,
      () => copyValue(phone, text[state.language].placePhoneCopied)
    );
  }

  function createWebsitePlaceRow(website) {
    const link = document.createElement("a");
    link.className = "place-card-row place-card-row-interactive";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.href = normalizeWebsiteUrl(website);

    const icon = document.createElement("span");
    icon.className = "place-card-row-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "🌐";

    const value = document.createElement("span");
    value.className = "place-card-row-value";
    value.textContent = website.replace(/^https?:\/\//, "").replace(/\/$/, "");

    link.append(icon, value);
    return link;
  }

  function normalizeWebsiteUrl(value) {
    return /^https?:\/\//i.test(value)
      ? value
      : `https://${value}`;
  }

  async function copyValue(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      show(successMessage);
    } catch (error) {
      console.error(error);
    }
  }

  function flashPlaceRow(row, icon) {
    const originalIcon = icon.textContent;
    row.classList.add("is-copied");
    icon.textContent = "✅";

    window.setTimeout(() => {
      row.classList.remove("is-copied");
      icon.textContent = originalIcon;
    }, 900);
  }

  function getPlaceTitle(place) {
    const names = place.namedetails || {};
    const address = place.address || {};

    return (
      names[`name:${state.language}`] ||
      names.name ||
      place.name ||
      address.amenity ||
      address.tourism ||
      address.shop ||
      address.leisure ||
      address.building ||
      address.road ||
      address.city ||
      address.town ||
      address.village ||
      ""
    );
  }


  function formatPlaceOpeningHours(place) {
    if (window.OMAP_OPENING_HOURS_SERVICE) {
      return window.OMAP_OPENING_HOURS_SERVICE.fromPlace(
        place,
        {
          language: state.language
        }
      );
    }

    return String(
      place?.opening_hours ||
      place?.extratags?.opening_hours ||
      ""
    );
  }

  function getPlaceAddressLegacy(place) {
    const address = place.address || {};
    const road = address.road || address.pedestrian || "";
    const number = address.house_number || "";
    const city =
      address.city ||
      address.town ||
      address.village ||
      address.municipality ||
      "";

    const street = [road, number].filter(Boolean).join(" ");
    const parts = [street, city, address.postcode, address.country]
      .filter(Boolean);

    return parts.length
      ? [...new Set(parts)].join(", ")
      : place.display_name || "";
  }

  window.OMAP_ADDRESS_SERVICE?.configure({
    format(place) {
      return getPlaceAddressLegacy(place);
    }
  });

  function getPlaceAddress(place) {
    if (window.OMAP_ADDRESS_SERVICE) {
      return window.OMAP_ADDRESS_SERVICE.format(
        place,
        {
          language: state.language
        }
      );
    }

    return getPlaceAddressLegacy(place);
  }


  function formatOpeningHoursPolish(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    if (/^24\/7$/i.test(raw)) return "całodobowo";

    const days = {
      Mo: "pon.",
      Tu: "wt.",
      We: "śr.",
      Th: "czw.",
      Fr: "pt.",
      Sa: "sob.",
      Su: "niedz.",
      PH: "święta"
    };

    return raw
      .split(";")
      .map(part => part.trim())
      .filter(Boolean)
      .map(part =>
        part
          .replace(
            /\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g,
            token => days[token] || token
          )
          .replace(/\boff\b/gi, "zamknięte")
          .replace(/\bclosed\b/gi, "zamknięte")
          .replace(/\bopen\b/gi, "otwarte")
      )
      .join("; ");
  }

  function getPlaceTypeLabel(place) {
    if (window.OMAP_CATEGORY_LABELS) {
      return window.OMAP_CATEGORY_LABELS.resolve(
        place,
        state.language
      ).label;
    }

    return state.language === "pl"
      ? "miejsce"
      : String(
          place?.type ||
          place?.category ||
          place?.class ||
          "place"
        ).replaceAll("_", " ");
  }

  function getPlaceEmoji(place) {
    const category = getLocalizedCategory(place);
    return category?.icon || "📍";
  }

  function getPlaceImageUrlLegacy(place) {
    const extra = place.extratags || {};
    const candidates = [
      extra.image,
      extra["image:0"],
      extra.wikimedia_commons,
      place.image
    ].filter(Boolean);

    for (const candidate of candidates) {
      const value = String(candidate).trim();

      if (/^https?:\/\//i.test(value)) {
        return value
          .replace(/^http:\/\//i, "https://");
      }

      const commonsFile = value
        .replace(/^File:/i, "")
        .replace(/^Category:/i, "")
        .trim();

      if (commonsFile) {
        return (
          "https://commons.wikimedia.org/wiki/" +
          "Special:Redirect/file/" +
          encodeURIComponent(commonsFile)
        );
      }
    }

    return "";
  }
  window.OMAP_PHOTO_SERVICE?.configure({
    resolveLegacy(place) {
      const url = getPlaceImageUrlLegacy(place);
      return url ? [{ url, source: "legacy" }] : [];
    }
  });

  function getPlaceImageUrl(place) {
    const photo = window.OMAP_PHOTO_SERVICE?.getSync(place);
    return photo?.url || getPlaceImageUrlLegacy(place);
  }


  function createPlaceAction(
    icon,
    accessibleLabel,
    onClick,
    active = false
  ) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "place-card-action";
    button.textContent = icon;
    button.title = accessibleLabel;
    button.setAttribute("aria-label", accessibleLabel);
    button.classList.toggle("is-favorite", active);
    button.addEventListener("click", () => onClick(button));
    return button;
  }

  const HISTORY_LIMIT = 50;

  function readHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.history) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveHistory() {
    safeSet(
      CONFIG.storageKeys.history,
      JSON.stringify(state.history)
    );
  }

  function recordPlaceHistory(place, lngLat) {
    if (!place || !lngLat) return;

    const key = getFavoriteKey(place, lngLat);

    const entry = {
      key,
      title: getPlaceTitle(place) || "",
      address: getPlaceAddress(place) || "",
      lat: Number(lngLat.lat),
      lon: Number(lngLat.lng),
      viewedAt: new Date().toISOString(),
      name: place.name || getPlaceTitle(place) || "",
      display_name: place.display_name || getPlaceAddress(place) || "",
      osm_type: place.osm_type || "",
      osm_id: place.osm_id || "",
      namedPoiId: place.namedPoiId || "",
      provider: place.provider || ""
    };

    state.history = [
      entry,
      ...state.history.filter(item => item.key !== key)
    ].slice(0, HISTORY_LIMIT);

    saveHistory();

    if (!el.historyPanel?.hidden) {
      renderHistoryList();
    }
  }

  function readFavorites() {
    try {
      const value = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.favorites) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function getFavoriteKey(place, lngLat) {
    const osmKey =
      place.osm_type && place.osm_id
        ? `${place.osm_type}:${place.osm_id}`
        : "";

    return osmKey ||
      `${Number(lngLat.lat).toFixed(6)},${Number(lngLat.lng).toFixed(6)}`;
  }

  function isFavorite(key) {
    return state.favorites.some(item => item.key === key);
  }

  function toggleFavorite(key, place, lngLat) {
    const index = state.favorites.findIndex(
      item => item.key === key
    );

    if (index >= 0) {
      state.favorites.splice(index, 1);
      saveFavorites();
      renderFavoritesList();
      return false;
    }

    state.favorites.unshift({
      key,
      title: getPlaceTitle(place),
      address: getPlaceAddress(place),
      lat: Number(lngLat.lat),
      lon: Number(lngLat.lng),
      name: place.name || getPlaceTitle(place),
      display_name:
        place.display_name ||
        getPlaceAddress(place),
      osm_type: place.osm_type || "",
      osm_id: place.osm_id || "",
      namedPoiId: place.namedPoiId || "",
      provider: place.provider || "",
      providers: place.providers || [],
      source: place.source || "",
      exactLocalIdentity: Boolean(
        place._exactLocalIdentity ||
        place.exactLocalIdentity
      ),
      aliases: place.aliases || [],
      keywords: place.keywords || [],
      type: place.type || "",
      category: place.category || "",
      class: place.class || "",
      addressDetails: {
        ...(place.address || {})
      },
      extratags: {
        ...(place.extratags || {})
      },
      namedetails: {
        ...(place.namedetails || {})
      }
    });

    state.favorites = state.favorites.slice(0, 100);
    saveFavorites();
    renderFavoritesList();
    return true;
  }

  async function resolveWikipediaTarget(place) {
    const preferredLang = state.language === "pl" ? "pl" : "en";
    const tag = place?.extratags?.wikipedia;
    const qid = place?.extratags?.wikidata;

    let tagTarget = null;
    if (tag) {
      const match = /^([a-z-]+):(.+)$/.exec(tag);
      tagTarget = match
        ? { lang: match[1], title: match[2] }
        : { lang: "en", title: tag };
    }

    if (tagTarget && tagTarget.lang === preferredLang) {
      return tagTarget;
    }

    if (qid) {
      try {
        const url = new URL("https://www.wikidata.org/w/api.php");
        url.searchParams.set("action", "wbgetentities");
        url.searchParams.set("ids", qid);
        url.searchParams.set("props", "sitelinks");
        url.searchParams.set("format", "json");
        url.searchParams.set("origin", "*");

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const sitelinks = data?.entities?.[qid]?.sitelinks || {};
          const site = sitelinks[`${preferredLang}wiki`];

          if (site?.title) {
            return { lang: preferredLang, title: site.title };
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (tagTarget) {
      return tagTarget;
    }

    const isNamedSettlement =
      ["city", "town", "village"].includes(
        String(place?.type || "").toLowerCase()
      ) && Boolean(place?.name);

    if (isNamedSettlement) {
      return { lang: preferredLang, title: place.name };
    }

    return null;
  }

  function createWikipediaSection() {
    const t = text[state.language];

    const section = document.createElement("section");
    section.className = "place-wikipedia";
    section.hidden = true;

    const header = document.createElement("div");
    header.className = "place-wikipedia-header";

    const title = document.createElement("h4");
    title.textContent = `📖 ${t.wikipediaTitle}`;
    header.appendChild(title);
    section.appendChild(header);

    const thumbnail = document.createElement("img");
    thumbnail.className = "place-wikipedia-thumbnail";
    thumbnail.alt = "";
    thumbnail.hidden = true;
    section.appendChild(thumbnail);

    const extract = document.createElement("p");
    extract.className = "place-wikipedia-extract";
    section.appendChild(extract);

    const link = document.createElement("a");
    link.className = "place-wikipedia-link";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = t.wikipediaReadMore;
    section.appendChild(link);

    return { section, thumbnail, extract, link };
  }

  async function loadWikipediaSummaryForPlace(place, ui) {
    try {
      const target = await resolveWikipediaTarget(place);
      if (!target) return;

      const url =
        `https://${target.lang}.wikipedia.org/api/rest_v1/page/summary/` +
        encodeURIComponent(target.title);

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) return;

      const data = await response.json();
      if (!data.extract || data.type === "disambiguation") return;

      ui.extract.textContent = data.extract;

      if (data.thumbnail?.source) {
        ui.thumbnail.src = data.thumbnail.source;
        ui.thumbnail.hidden = false;
      }

      ui.link.href =
        data.content_urls?.desktop?.page ||
        `https://${target.lang}.wikipedia.org/wiki/${encodeURIComponent(target.title)}`;

      ui.section.hidden = false;
    } catch (error) {
      console.error(error);
    }
  }

  function isTransitStopPlace(place) {
    const address = place.address || {};
    const extra = place.extratags || {};

    const values = [
      place.type,
      place.category,
      address.highway,
      address.public_transport,
      address.railway,
      address.amenity,
      extra.public_transport,
      extra.highway,
      extra.railway,
      extra.bus,
      extra.tram,
      extra.train,
      extra.subway
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    const joined = values.join(" ");

    return [
      "bus_stop",
      "platform",
      "stop_position",
      "station",
      "tram_stop",
      "halt",
      "subway_entrance",
      "railway"
    ].some(token => joined.includes(token));
  }

  function createDeparturesSection() {
    const t = text[state.language];

    const section = document.createElement("section");
    section.className = "place-departures";

    const header = document.createElement("div");
    header.className = "place-departures-header";

    const title = document.createElement("h4");
    title.textContent = `🚌 ${t.departuresTitle}`;

    header.appendChild(title);
    section.appendChild(header);

    const status = document.createElement("p");
    status.className = "place-departures-status";
    status.textContent = t.departuresLoading;
    section.appendChild(status);

    const list = document.createElement("ol");
    list.className = "place-departures-list";
    list.hidden = true;
    section.appendChild(list);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "place-departures-toggle";
    toggle.textContent = t.departuresShowMore;
    toggle.hidden = true;
    section.appendChild(toggle);

    const attribution = document.createElement("a");
    attribution.className = "place-departures-source";
    attribution.href = CONFIG.transit.sourcesUrl;
    attribution.target = "_blank";
    attribution.rel = "noopener noreferrer";
    attribution.textContent = t.departuresSources;
    attribution.hidden = true;
    section.appendChild(attribution);

    return { section, status, list, toggle, attribution };
  }

  async function loadDeparturesForPlace(place, lngLat, ui) {
    const t = text[state.language];

    try {
      const url = new URL(CONFIG.transit.departuresEndpoint);
      url.searchParams.set(
        "center",
        `${lngLat.lat},${lngLat.lng}`
      );
      url.searchParams.set("radius", String(CONFIG.transit.radius));
      url.searchParams.set("exactRadius", "true");
      url.searchParams.set("n", String(CONFIG.transit.limit));
      url.searchParams.set("direction", "LATER");
      url.searchParams.set("arriveBy", "false");
      url.searchParams.set("language", state.language);
      url.searchParams.set("withAlerts", "false");

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Transitous HTTP ${response.status}`);
      }

      const data = await response.json();
      const departures = Array.isArray(data.stopTimes)
        ? data.stopTimes
        : [];

      if (!departures.length) {
        ui.status.textContent = t.departuresEmpty;
        return;
      }

      renderDepartures(departures, ui);
    } catch (error) {
      console.error(error);
      ui.status.textContent = t.departuresError;
    }
  }

  function renderDepartures(departures, ui) {
    const t = text[state.language];
    const compactLimit = 2;
    const visibleDepartures = departures.slice(
      0,
      CONFIG.transit.limit
    );

    let expanded = false;

    const draw = () => {
      ui.list.replaceChildren();

      const fragment = document.createDocumentFragment();
      const items = expanded
        ? visibleDepartures
        : visibleDepartures.slice(0, compactLimit);

      items.forEach(departure => {
        const item = document.createElement("li");
        item.className = "place-departure";

        if (departure.cancelled || departure.tripCancelled) {
          item.classList.add("is-cancelled");
        }

        const badge = document.createElement("span");
        badge.className = "place-departure-line";

        const routeName =
          departure.routeShortName ||
          departure.displayName ||
          departure.tripShortName ||
          getTransitModeEmoji(departure.mode);

        badge.textContent = routeName;
        applyTransitRouteColors(
          badge,
          departure.routeColor,
          departure.routeTextColor
        );

        const copy = document.createElement("span");
        copy.className = "place-departure-copy";

        const direction = document.createElement("strong");
        direction.className = "place-departure-direction";
        direction.textContent =
          departure.headsign ||
          departure.tripTo?.name ||
          departure.routeLongName ||
          "—";

        const timing = document.createElement("span");
        timing.className = "place-departure-time";
        timing.textContent = formatDepartureTiming(departure);

        copy.append(direction, timing);
        item.append(badge, copy);
        fragment.appendChild(item);
      });

      ui.list.appendChild(fragment);
      ui.list.classList.toggle("is-expanded", expanded);

      if (visibleDepartures.length > compactLimit) {
        ui.toggle.hidden = false;
        ui.toggle.textContent = expanded
          ? t.departuresShowLess
          : t.departuresShowMore;
        ui.toggle.setAttribute("aria-expanded", String(expanded));
      } else {
        ui.toggle.hidden = true;
      }
    };

    ui.toggle.addEventListener("click", () => {
      expanded = !expanded;
      draw();

      if (!expanded) {
        ui.list.scrollTop = 0;
      }
    });

    draw();

    ui.status.hidden = true;
    ui.list.hidden = false;
    ui.attribution.hidden = false;
  }

  function formatDepartureTiming(departure) {
    const t = text[state.language];
    const place = departure.place || {};

    const actualValue =
      place.departure ||
      place.arrival ||
      place.scheduledDeparture ||
      place.scheduledArrival;

    const scheduledValue =
      place.scheduledDeparture ||
      place.scheduledArrival ||
      actualValue;

    const actual = new Date(actualValue);
    const scheduled = new Date(scheduledValue);

    if (Number.isNaN(actual.getTime())) {
      return departure.cancelled || departure.tripCancelled
        ? t.departuresCancelled
        : t.departuresScheduled;
    }

    const clock = actual.toLocaleTimeString(
      state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    const minutes = Math.max(
      0,
      Math.round((actual.getTime() - Date.now()) / 60000)
    );

    const relative =
      minutes <= 0
        ? t.departuresNow
        : t.departuresMinutes(minutes);

    if (departure.cancelled || departure.tripCancelled) {
      return `${clock} · ${t.departuresCancelled}`;
    }

    let suffix = departure.realTime
      ? ""
      : ` · ${t.departuresScheduled}`;

    if (
      departure.realTime &&
      !Number.isNaN(scheduled.getTime())
    ) {
      const delayMinutes = Math.round(
        (actual.getTime() - scheduled.getTime()) / 60000
      );

      if (delayMinutes > 0) {
        suffix = ` · +${delayMinutes} min`;
      } else if (delayMinutes < 0) {
        suffix = ` · ${delayMinutes} min`;
      }
    }

    return `${clock} · ${relative}${suffix}`;
  }

  function getTransitModeEmoji(mode) {
    const normalized = String(mode || "").toUpperCase();

    if (normalized.includes("TRAM")) return "🚋";
    if (
      normalized.includes("RAIL") ||
      normalized.includes("TRAIN") ||
      normalized.includes("SUBURBAN")
    ) return "🚆";
    if (
      normalized.includes("SUBWAY") ||
      normalized.includes("METRO")
    ) return "🚇";
    if (normalized.includes("FERRY")) return "⛴";
    if (normalized.includes("BUS")) return "🚌";
    return "🚌";
  }

  function applyTransitRouteColors(element, background, foreground) {
    const safeBackground = normalizeTransitColor(background);
    const safeForeground = normalizeTransitColor(foreground);

    if (safeBackground) {
      element.style.backgroundColor = safeBackground;
      element.style.borderColor = safeBackground;
    }

    if (safeForeground) {
      element.style.color = safeForeground;
    } else if (safeBackground) {
      element.style.color = getReadableTextColor(safeBackground);
    }
  }

  function normalizeTransitColor(value) {
    if (!value) return "";

    const color = String(value).trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`;

    return "";
  }

  function getReadableTextColor(hexColor) {
    const value = hexColor.replace("#", "");
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    const luminance =
      (red * 299 + green * 587 + blue * 114) / 1000;

    return luminance > 150 ? "#111827" : "#ffffff";
  }

  function pointFromPlace(place, lngLat) {
    return {
      lon: lngLat.lng,
      lat: lngLat.lat,
      label:
        getPlaceAddress(place) ||
        getPlaceTitle(place) ||
        formatCoordinates(lngLat.lng, lngLat.lat)
    };
  }

  function setPlaceAsRoutePoint(key, place, lngLat) {
    const point = pointFromPlace(place, lngLat);

    if (el.routePanel.hidden) {
      toggleRoute();
      state.routeBackContext = { place, lngLat };
      if (el.routeBack) el.routeBack.hidden = false;
    }

    if (key === "a") {
      state.routePointA = point;
      if (el.routeFrom) el.routeFrom.value = point.label;
      setRouteMarker("a", point);
    } else {
      state.routePointB = point;
      if (el.routeTo) el.routeTo.value = point.label;
      setRouteMarker("b", point);
    }

    state.routeClickStage = state.routePointA
      ? (state.routePointB ? "move-b" : "b")
      : "a";

    updateRouteClickHint();
    closePlacePopup();

    if (state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
    }
  }


  async function sharePlace(place, lngLat) {
    const url = new URL(window.location.href);
    url.searchParams.set("place", `${lngLat.lat},${lngLat.lng}`);

    const shareData = {
      title: getPlaceTitle(place) || document.title,
      text: getPlaceAddress(place),
      url: url.toString()
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url.toString());
        show(text[state.language].placeShared);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
      }
    }
  }

  async function handleRouteMapClick(event) {
    if (el.routePanel.hidden || state.routeClickBusy) return;

    if (state.routeCoordinates && isClickOnRoute(event.point)) {
      addRouteWaypoint(event.lngLat);
      return;
    }

    state.routeClickBusy = true;
    const point = {
      lon: event.lngLat.lng,
      lat: event.lngLat.lat,
      label: formatCoordinates(event.lngLat.lng, event.lngLat.lat)
    };

    try {
      point.label = await reverseGeocodeRoutePoint(point);
    } catch (error) {
      console.error(error);
      show(text[state.language].routeReverseError);
    }

    if (state.routeClickStage === "a") {
      state.routePointA = point;
      if (el.routeFrom) el.routeFrom.value = point.label;
      setRouteMarker("a", point);
      state.routeClickStage = state.routePointB ? "move-b" : "b";
      updateRouteClickHint();

      if (state.routePointA && state.routePointB) {
        await calculateRouteFromStoredPoints();
      }

      state.routeClickBusy = false;
      return;
    }

    state.routePointB = point;
    if (el.routeTo) el.routeTo.value = point.label;
    setRouteMarker("b", point);
    state.routeClickStage = "move-b";
    updateRouteClickHint();

    if (state.routePointA) {
      await calculateRouteFromStoredPoints();
    }

    state.routeClickBusy = false;
  }

  function dismissMobileKeyboard() {
    const active = document.activeElement;
    if (!active || typeof active.blur !== "function") return;

    const isTextField =
      active.tagName === "INPUT" || active.tagName === "TEXTAREA";

    if (!isTextField) {
      active.blur();
      return;
    }

    // iOS Safari often ignores blur() called after an async gap (like
    // waiting for a route to load) unless the field briefly becomes
    // non-editable first.
    const wasReadOnly = active.hasAttribute("readonly");
    active.setAttribute("readonly", "readonly");
    active.blur();

    if (!wasReadOnly) {
      window.setTimeout(() => {
        active.removeAttribute("readonly");
      }, 100);
    }
  }

  async function calculateRouteFromStoredPoints() {
    if (!state.routePointA || !state.routePointB) return;

    show(text[state.language].routeSearching, 0);
    if (el.routeSubmit) el.routeSubmit.disabled = true;

    try {
      const route = await fetchRoute(state.routePointA, state.routePointB);
      drawRoute(
        route.geometry,
        route.snappedFrom || state.routePointA,
        route.snappedTo || state.routePointB,
        getSelectedRouteMode()
      );
      updateRouteSummary(route.distance, route.duration);
      renderRouteDirections(route.maneuvers);
      hide();
      dismissMobileKeyboard();
    } catch (error) {
      console.error(error);
      show(text[state.language].routeError);
    } finally {
      if (el.routeSubmit) el.routeSubmit.disabled = false;
    }
  }

  async function reverseGeocodeRoutePoint(point) {
    const url = new URL(CONFIG.search.reverseEndpoint);
    url.searchParams.set("lat", String(point.lat));
    url.searchParams.set("lon", String(point.lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("accept-language", state.language);
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Nominatim reverse HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.display_name || formatCoordinates(point.lon, point.lat);
  }

  function formatCoordinates(lon, lat) {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }

  function updateRouteClickHint() {
    if (!el.routeClickHint) return;
    const t = text[state.language];

    if (state.routeClickStage === "a") {
      el.routeClickHint.textContent = t.routePickA;
      el.routeClickHint.classList.remove("is-complete");
    } else if (state.routeClickStage === "b") {
      el.routeClickHint.textContent = t.routePickB;
      el.routeClickHint.classList.remove("is-complete");
    } else {
      el.routeClickHint.textContent = t.routePickMoveB;
      el.routeClickHint.classList.add("is-complete");
    }
  }

  function createRouteMarkerElement(letter, markerClass) {
    const element = document.createElement("div");
    element.className = `route-letter-marker ${markerClass}`;

    const label = document.createElement("span");
    label.textContent = letter;
    element.appendChild(label);

    return element;
  }

  function setRouteMarker(key, point) {
    removeRouteMarker(key);

    const isA = key === "a";
    const markerElement = createRouteMarkerElement(
      isA ? "A" : "B",
      isA ? "route-a" : "route-b"
    );

    const marker = new maplibregl.Marker({
      element: markerElement,
      anchor: "center",
      offset: [0, 0],
      draggable: true
    })
      .setLngLat([point.lon, point.lat])
      .setPopup(new maplibregl.Popup().setText(point.label))
      .addTo(map);

    marker.on("dragend", async () => {
      const position = marker.getLngLat();
      const updatedPoint = {
        lon: position.lng,
        lat: position.lat,
        label: formatCoordinates(position.lng, position.lat)
      };

      try {
        updatedPoint.label = await reverseGeocodeRoutePoint(updatedPoint);
      } catch (error) {
        console.error(error);
      }

      if (isA) {
        state.routePointA = updatedPoint;
        if (el.routeFrom) el.routeFrom.value = updatedPoint.label;
      } else {
        state.routePointB = updatedPoint;
        if (el.routeTo) el.routeTo.value = updatedPoint.label;
      }

      marker.setPopup(
        new maplibregl.Popup().setText(updatedPoint.label)
      );

      if (state.routePointA && state.routePointB) {
        await calculateRouteFromStoredPoints();
      }
    });

    state.routeMarkers[key] = marker;
  }

  function removeRouteMarker(key) {
    if (state.routeMarkers[key]) {
      state.routeMarkers[key].remove();
      state.routeMarkers[key] = null;
    }
  }

  function refreshRouteMarkers() {
    if (state.routePointA) setRouteMarker("a", state.routePointA);
    else removeRouteMarker("a");

    if (state.routePointB) setRouteMarker("b", state.routePointB);
    else removeRouteMarker("b");
  }

  async function planRoute(event) {
    event.preventDefault();
    const fromQuery = el.routeFrom.value.trim();
    const toQuery = el.routeTo.value.trim();
    if (!fromQuery || !toQuery) return;

    show(text[state.language].routeSearching, 0);
    if (el.routeSubmit) el.routeSubmit.disabled = true;

    try {
      const [from, to] = await Promise.all([
        geocodeRoutePoint(fromQuery),
        geocodeRoutePoint(toQuery)
      ]);

      if (!from || !to) {
        show(text[state.language].routePointNotFound);
        return;
      }

      state.routePointA = from;
      state.routePointB = to;
      if (el.routeFrom) el.routeFrom.value = from.label;
      if (el.routeTo) el.routeTo.value = to.label;
      state.routeClickStage = "move-b";

      const route = await fetchRoute(from, to);
      drawRoute(
        route.geometry,
        route.snappedFrom || from,
        route.snappedTo || to,
        getSelectedRouteMode()
      );
      updateRouteClickHint();
      updateRouteSummary(route.distance, route.duration);
      renderRouteDirections(route.maneuvers);
      hide();
      dismissMobileKeyboard();
    } catch (error) {
      console.error(error);
      show(text[state.language].routeError);
    } finally {
      if (el.routeSubmit) el.routeSubmit.disabled = false;
    }
  }

  async function geocodeRoutePoint(query) {
    const results = await findPlacesWithFallback(query, 1);
    if (!results.length) return null;

    return {
      lon: Number(results[0].lon),
      lat: Number(results[0].lat),
      label: getPreferredPlaceLabel(results[0])
    };
  }

  async function fetchTransitRoute(from, to) {
    const url = new URL(CONFIG.transit.plannerEndpoint);
    url.searchParams.set("fromPlace", `${from.lat},${from.lon}`);
    url.searchParams.set("toPlace", `${to.lat},${to.lon}`);
    url.searchParams.set("numItineraries", "3");
    url.searchParams.set("language", state.language);
    url.searchParams.set("arriveBy", "false");
    url.searchParams.set("wheelchair", "false");

    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Transitous plan HTTP ${response.status}`);
    }

    const result = await response.json();
    const itineraries =
      result.itineraries ||
      result.plan?.itineraries ||
      [];

    const itinerary = itineraries[0];
    if (!itinerary?.legs?.length) {
      throw new Error(text[state.language].transitRouteError);
    }

    const coordinates = [];
    const maneuvers = [];

    itinerary.legs.forEach((leg, index) => {
      const legCoordinates = getTransitLegCoordinates(leg);

      if (coordinates.length && legCoordinates.length) {
        const [firstLon, firstLat] = legCoordinates[0];
        const [lastLon, lastLat] = coordinates[coordinates.length - 1];
        if (
          Math.abs(firstLon - lastLon) < 1e-7 &&
          Math.abs(firstLat - lastLat) < 1e-7
        ) {
          legCoordinates.shift();
        }
      }
      coordinates.push(...legCoordinates);

      const fromCoordinate = getTransitPlaceCoordinate(leg.from);
      const mode = String(leg.mode || "").toUpperCase();
      const routeName =
        leg.routeShortName ||
        leg.route?.shortName ||
        leg.tripShortName ||
        "";
      const destination =
        leg.headsign ||
        leg.to?.name ||
        leg.routeLongName ||
        "";

      maneuvers.push({
        instruction: getTransitLegInstruction(
          mode,
          routeName,
          destination
        ),
        streetNames: [
          leg.from?.name,
          leg.to?.name
        ].filter(Boolean),
        length: Number(leg.distance || 0),
        time: getTransitLegDurationSeconds(leg),
        type: getTransitManeuverType(mode),
        coordinate:
          fromCoordinate ||
          legCoordinates[0] ||
          null,
        segment: legCoordinates,
        transitMode: mode,
        routeName,
        destination
      });
    });

    if (coordinates.length < 2) {
      const fallback = [
        [from.lon, from.lat],
        [to.lon, to.lat]
      ];
      coordinates.push(...fallback);
    }

    const startTime = parseTransitTime(
      itinerary.startTime ||
      itinerary.start_time
    );
    const endTime = parseTransitTime(
      itinerary.endTime ||
      itinerary.end_time
    );

    const duration =
      Number(itinerary.duration || 0) ||
      (
        startTime && endTime
          ? Math.max(0, (endTime - startTime) / 1000)
          : maneuvers.reduce(
              (sum, maneuver) => sum + maneuver.time,
              0
            )
      );

    const distance =
      Number(itinerary.distance || 0) ||
      maneuvers.reduce(
        (sum, maneuver) => sum + maneuver.length,
        0
      );

    return {
      geometry: {
        type: "LineString",
        coordinates
      },
      distance,
      duration,
      maneuvers
    };
  }

  function getTransitLegCoordinates(leg) {
    const geometry =
      leg.legGeometry ||
      leg.geometry ||
      {};

    if (
      geometry.type === "LineString" &&
      Array.isArray(geometry.coordinates)
    ) {
      return geometry.coordinates.map(point => [
        Number(point[0]),
        Number(point[1])
      ]);
    }

    if (Array.isArray(geometry.coordinates)) {
      return geometry.coordinates.map(point => [
        Number(point[0]),
        Number(point[1])
      ]);
    }

    const encoded =
      geometry.points ||
      leg.polyline ||
      leg.encodedPolyline ||
      "";

    if (encoded) {
      const precision =
        Number(geometry.precision) === 6 ? 6 : 5;
      return decodeEncodedPolyline(encoded, precision);
    }

    const from = getTransitPlaceCoordinate(leg.from);
    const to = getTransitPlaceCoordinate(leg.to);
    return [from, to].filter(Boolean);
  }

  function getTransitPlaceCoordinate(place) {
    if (!place) return null;

    const lon = Number(
      place.lon ??
      place.lng ??
      place.longitude ??
      place.location?.lon ??
      place.location?.lng
    );
    const lat = Number(
      place.lat ??
      place.latitude ??
      place.location?.lat
    );

    return Number.isFinite(lon) && Number.isFinite(lat)
      ? [lon, lat]
      : null;
  }

  function getTransitLegDurationSeconds(leg) {
    const direct = Number(leg.duration || 0);
    if (direct > 0) return direct;

    const start = parseTransitTime(
      leg.startTime ||
      leg.start_time
    );
    const end = parseTransitTime(
      leg.endTime ||
      leg.end_time
    );

    return start && end
      ? Math.max(0, (end - start) / 1000)
      : 0;
  }

  function parseTransitTime(value) {
    if (!value) return null;
    if (typeof value === "number") {
      return new Date(value < 1e12 ? value * 1000 : value);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function getTransitLegInstruction(mode, routeName, destination) {
    const arrow = destination ? ` → ${destination}` : "";

    if (mode.includes("WALK")) {
      return state.language === "pl"
        ? "Przejdź pieszo"
        : "Walk";
    }

    if (mode.includes("BICYCLE")) {
      return state.language === "pl"
        ? "Przejedź rowerem"
        : "Cycle";
    }

    const prefix =
      mode.includes("TRAM") ? "🚋" :
      mode.includes("SUBWAY") || mode.includes("METRO") ? "🚇" :
      mode.includes("RAIL") || mode.includes("TRAIN") ? "🚆" :
      mode.includes("FERRY") ? "⛴" :
      "🚌";

    return `${prefix}${routeName ? ` ${routeName}` : ""}${arrow}`;
  }

  function getTransitManeuverType(mode) {
    if (mode.includes("WALK")) return 7;
    if (mode.includes("BICYCLE")) return 7;
    if (mode.includes("TRAM")) return 29;
    if (mode.includes("SUBWAY") || mode.includes("METRO")) return 29;
    if (mode.includes("RAIL") || mode.includes("TRAIN")) return 29;
    if (mode.includes("FERRY")) return 27;
    return 29;
  }

  function decodeEncodedPolyline(encoded, precision = 5) {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const factor = 10 ** precision;
    const coordinates = [];

    while (index < encoded.length) {
      const latitudeResult = decodePolylineValue(encoded, index);
      index = latitudeResult.index;
      latitude += latitudeResult.value;

      const longitudeResult = decodePolylineValue(encoded, index);
      index = longitudeResult.index;
      longitude += longitudeResult.value;

      coordinates.push([
        longitude / factor,
        latitude / factor
      ]);
    }

    return coordinates;
  }

  async function fetchRoute(from, to) {
    const mode = getSelectedRouteMode();

    if (mode === "transit") {
      return fetchTransitRoute(from, to);
    }

    const language = state.language === "pl" ? "pl-PL" : "en-US";

    const payload = {
      locations: [
        { lat: from.lat, lon: from.lon, type: "break" },
        ...state.routeWaypoints.map(point => ({
          lat: point.lat,
          lon: point.lon,
          type: "break"
        })),
        { lat: to.lat, lon: to.lon, type: "break" }
      ],
      costing: mode,
      units: "kilometers",
      language
    };

    const response = await fetch(CONFIG.routing.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Client-Id": CONFIG.routing.clientId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Valhalla HTTP ${response.status}`);
    }

    const result = await response.json();
    const trip = result.trip;
    if (!trip?.legs?.length) {
      throw new Error(result.error || "No route");
    }

    const coordinates = [];
    const maneuvers = [];

    for (const leg of trip.legs) {
      const decoded = decodePolyline6(leg.shape);

      for (const maneuver of leg.maneuvers || []) {
        const coordinate =
          decoded[maneuver.begin_shape_index] ||
          decoded[0] ||
          null;

        const beginIndex = Number(maneuver.begin_shape_index || 0);
        const endIndex = Number(
          maneuver.end_shape_index ?? maneuver.begin_shape_index ?? 0
        );
        const roundaboutExit = Number(
          maneuver.roundabout_exit_count ||
          maneuver.roundabout_exit_number ||
          0
        );

        maneuvers.push({
          instruction:
            maneuver.instruction ||
            maneuver.verbal_pre_transition_instruction ||
            "",
          streetNames: maneuver.street_names || [],
          length: Number(maneuver.length || 0) * 1000,
          time: Number(maneuver.time || 0),
          type: Number(maneuver.type),
          roundaboutExit,
          coordinate,
          segment: decoded.slice(
            Math.max(0, beginIndex),
            Math.max(beginIndex + 2, endIndex + 1)
          )
        });
      }

      if (coordinates.length && decoded.length) decoded.shift();
      coordinates.push(...decoded);
    }

    return {
      geometry: {
        type: "LineString",
        coordinates
      },
      distance: Number(trip.summary?.length || 0) * 1000,
      duration: Number(trip.summary?.time || 0),
      maneuvers,
      snappedFrom: extractGeometryEndpoint(coordinates, 0, from),
      snappedTo: extractGeometryEndpoint(
        coordinates,
        coordinates.length - 1,
        to
      )
    };
  }

  function extractGeometryEndpoint(coordinates, index, fallbackPoint) {
    const coordinate = coordinates?.[index];
    const lon = Number(coordinate?.[0]);
    const lat = Number(coordinate?.[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return fallbackPoint;
    }

    return {
      ...fallbackPoint,
      lat,
      lon
    };
  }

  function getSelectedRouteMode() {
    return document.querySelector(
      'input[name="route-mode"]:checked'
    )?.value || "auto";
  }

  function decodePolyline6(encoded) {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const coordinates = [];

    while (index < encoded.length) {
      const latitudeResult = decodePolylineValue(encoded, index);
      index = latitudeResult.index;
      latitude += latitudeResult.value;

      const longitudeResult = decodePolylineValue(encoded, index);
      index = longitudeResult.index;
      longitude += longitudeResult.value;

      coordinates.push([
        longitude / 1e6,
        latitude / 1e6
      ]);
    }

    return coordinates;
  }

  function decodePolylineValue(encoded, startIndex) {
    let result = 0;
    let shift = 0;
    let index = startIndex;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    return {
      index,
      value: (result & 1) ? ~(result >> 1) : (result >> 1)
    };
  }

  function ensureRouteLayers() {
    if (!map.getSource(CONFIG.routing.sourceId)) {
      map.addSource(CONFIG.routing.sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        }
      });
    }

    if (!map.getSource(CONFIG.routing.highlightSourceId)) {
      map.addSource(CONFIG.routing.highlightSourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        }
      });
    }

    if (!map.getLayer(CONFIG.routing.casingLayerId)) {
      map.addLayer({
        id: CONFIG.routing.casingLayerId,
        type: "line",
        source: CONFIG.routing.sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": 9,
          "line-opacity": 0.92
        }
      });
    }

    if (!map.getLayer(CONFIG.routing.lineLayerId)) {
      map.addLayer({
        id: CONFIG.routing.lineLayerId,
        type: "line",
        source: CONFIG.routing.sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#dc2626",
          "line-width": 5.5,
          "line-opacity": 0.96
        }
      });
    }

    if (!map.getLayer(CONFIG.routing.highlightLayerId)) {
      map.addLayer({
        id: CONFIG.routing.highlightLayerId,
        type: "line",
        source: CONFIG.routing.highlightSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#facc15",
          "line-width": 8,
          "line-opacity": 0.95
        }
      });
    }
  }

  function drawRoute(geometry, from, to, mode) {
    ensureRouteLayers();
    state.routeCoordinates = geometry.coordinates;
    clearManeuverHighlight();

    map.getSource(CONFIG.routing.sourceId).setData({
      type: "Feature",
      properties: {},
      geometry
    });

    map.setLayoutProperty(CONFIG.routing.casingLayerId, "visibility", "visible");
    map.setLayoutProperty(CONFIG.routing.lineLayerId, "visibility", "visible");

    const routeColors = {
      auto: "#dc2626",
      bicycle: "#16a34a",
      pedestrian: "#ea580c"
    };
    map.setPaintProperty(
      CONFIG.routing.lineLayerId,
      "line-color",
      routeColors[mode] || routeColors.auto
    );

    state.routePointA = from;
    state.routePointB = to;
    refreshRouteMarkers();
    refreshWaypointMarkers();

    const bounds = geometry.coordinates.reduce(
      (current, coordinate) => current.extend(coordinate),
      new maplibregl.LngLatBounds(
        geometry.coordinates[0],
        geometry.coordinates[0]
      )
    );

    map.fitBounds(bounds, {
      padding: { top: 105, right: 45, bottom: 55, left: 45 },
      bearing: 180,
      duration: 900
    });
  }

  function renderRouteDirections(maneuvers) {
    clearRouteDirections();

    if (!Array.isArray(maneuvers) || !maneuvers.length) return;

    const fragment = document.createDocumentFragment();

    maneuvers.forEach((maneuver, index) => {
      const item = document.createElement("li");
      item.className = "route-direction";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "route-direction-button";

      const icon = document.createElement("span");
      icon.className = "route-direction-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = getManeuverIcon(maneuver.type, index, maneuvers.length);

      const copy = document.createElement("span");
      copy.className = "route-direction-copy";

      const instruction = document.createElement("span");
      instruction.className = "route-direction-instruction";
      instruction.textContent =
        maneuver.roundaboutExit > 0
          ? text[state.language].routeRoundaboutExit(maneuver.roundaboutExit)
          : maneuver.instruction;

      copy.appendChild(instruction);

      if (maneuver.streetNames?.length) {
        const street = document.createElement("span");
        street.className = "route-direction-street";
        street.textContent = maneuver.streetNames.join(" → ");
        copy.appendChild(street);
      }

      const metaParts = [];
      if (Number(maneuver.time) > 0) {
        metaParts.push(formatRouteStepDuration(maneuver.time));
      }
      if (maneuver.routeName) {
        metaParts.push(
          state.language === "pl"
            ? `linia ${maneuver.routeName}`
            : `line ${maneuver.routeName}`
        );
      }
      if (Number(maneuver.numStops || maneuver.stops) > 0) {
        const stopCount = Number(
          maneuver.numStops || maneuver.stops
        );
        metaParts.push(
          state.language === "pl"
            ? `${stopCount} przyst.`
            : `${stopCount} stops`
        );
      }

      if (metaParts.length) {
        const meta = document.createElement("span");
        meta.className = "route-direction-meta";
        meta.textContent = metaParts.join(" · ");
        copy.appendChild(meta);
      }

      const distance = document.createElement("span");
      distance.className = "route-direction-distance";
      distance.textContent = formatDistance(maneuver.length);

      button.append(icon, copy, distance);

      if (maneuver.coordinate) {
        button.addEventListener("click", () => {
          selectManeuver(index, button);
          map.easeTo({
            center: maneuver.coordinate,
            zoom: Math.max(map.getZoom(), 15),
            bearing: 180,
            duration: 650
          });
        });
      } else {
        button.disabled = true;
      }

      item.appendChild(button);
      fragment.appendChild(item);
    });

    state.routeManeuvers = maneuvers;
    state.selectedManeuverIndex = null;
    el.routeDirectionsList.appendChild(fragment);
    el.routeDirectionsCount.textContent =
      `${maneuvers.length} ${text[state.language].routeSteps}`;
    el.routeDirections.hidden = false;
  }

  function scrollPanelToElement(panel, element) {
    if (!panel || !element) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const panelRect = panel.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const stickyOffset = 84;

        const targetTop =
          panel.scrollTop +
          elementRect.top -
          panelRect.top -
          stickyOffset;

        panel.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth"
        });
      });
    });
  }

  function formatRouteStepDuration(seconds) {
    const minutes = Math.max(1, Math.round(Number(seconds) / 60));
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function clearRouteDirections() {
    if (!el.routeDirectionsList) return;
    el.routeDirectionsList.replaceChildren();
    state.routeManeuvers = [];
    state.selectedManeuverIndex = null;
    el.routeDirectionsCount.textContent = "";
    el.routeDirections.hidden = true;
  }

  function getManeuverIcon(type, index, total) {
    if (index === 0) return "A";
    if (index === total - 1) return "B";

    const icons = {
      1: "↑",   // start
      2: "→",   // start right
      3: "←",   // start left
      4: "✓",   // destination
      5: "✓",   // destination right
      6: "✓",   // destination left
      7: "↑",   // continue
      8: "↗",   // slight right
      9: "→",   // right
      10: "↘",  // sharp right
      11: "↩",  // u-turn right
      12: "↪",  // u-turn left
      13: "↙",  // sharp left
      14: "←",  // left
      15: "↖",  // slight left
      16: "↑",  // ramp straight
      17: "↗",  // ramp right
      18: "↖",  // ramp left
      19: "→",  // exit right
      20: "←",  // exit left
      21: "↑",  // stay straight
      22: "↗",  // stay right
      23: "↖",  // stay left
      24: "⇄",  // merge
      25: "⟳",  // roundabout enter
      26: "⟳",  // roundabout exit
      27: "⛴",  // ferry enter
      28: "⛴",  // ferry exit
      29: "↑",  // transit
      30: "↗",
      31: "↖",
      32: "↗",
      33: "↖",
      34: "↗",
      35: "↖",
      36: "⟳",
      37: "⟳"
    };

    return icons[type] || "•";
  }

  function handleRouteModeChange() {
    if (state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
      return;
    }

    if (el.routeFrom.value.trim() && el.routeTo.value.trim()) {
      el.routeForm.requestSubmit();
    }
  }

  function selectManeuver(index, button) {
    for (const current of el.routeDirectionsList.querySelectorAll(
      ".route-direction-button"
    )) {
      current.classList.remove("is-selected");
    }

    button.classList.add("is-selected");
    state.selectedManeuverIndex = index;

    const maneuver = state.routeManeuvers[index];
    const segment = maneuver?.segment || [];

    if (segment.length < 2) {
      clearManeuverHighlight();
      return;
    }

    map.getSource(CONFIG.routing.highlightSourceId).setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: segment }
    });
    map.setLayoutProperty(
      CONFIG.routing.highlightLayerId,
      "visibility",
      "visible"
    );
  }

  function clearManeuverHighlight() {
    state.selectedManeuverIndex = null;

    if (map.getSource(CONFIG.routing.highlightSourceId)) {
      map.getSource(CONFIG.routing.highlightSourceId).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }
    if (map.getLayer(CONFIG.routing.highlightLayerId)) {
      map.setLayoutProperty(
        CONFIG.routing.highlightLayerId,
        "visibility",
        "none"
      );
    }
  }

  function isClickOnRoute(point) {
    if (!map.getLayer(CONFIG.routing.lineLayerId)) return false;

    const tolerance = 8;
    const box = [
      [point.x - tolerance, point.y - tolerance],
      [point.x + tolerance, point.y + tolerance]
    ];

    return map.queryRenderedFeatures(box, {
      layers: [
        CONFIG.routing.casingLayerId,
        CONFIG.routing.lineLayerId
      ]
    }).length > 0;
  }

  function addRouteWaypoint(lngLat) {
    const waypoint = {
      lon: lngLat.lng,
      lat: lngLat.lat,
      label: formatCoordinates(lngLat.lng, lngLat.lat)
    };

    state.routeWaypoints.push(waypoint);
    refreshWaypointMarkers();
    calculateRouteFromStoredPoints();
  }

  function refreshWaypointMarkers() {
    clearWaypointMarkers();

    state.routeWaypoints.forEach((point, index) => {
      const element = document.createElement("div");
      element.className = "route-waypoint-marker";
      element.textContent = String(index + 1);
      element.title = text[state.language].routeWaypoint(index + 1);

      const marker = new maplibregl.Marker({
        element,
        draggable: true,
        anchor: "center"
      })
        .setLngLat([point.lon, point.lat])
        .addTo(map);

      marker.on("dragend", () => {
        const position = marker.getLngLat();
        state.routeWaypoints[index] = {
          ...state.routeWaypoints[index],
          lon: position.lng,
          lat: position.lat,
          label: formatCoordinates(position.lng, position.lat)
        };
        calculateRouteFromStoredPoints();
      });

      state.routeWaypointMarkers.push(marker);
    });
  }

  function clearWaypointMarkers() {
    for (const marker of state.routeWaypointMarkers) {
      marker.remove();
    }
    state.routeWaypointMarkers = [];
  }

  async function shareRoute() {
    if (!state.routePointA || !state.routePointB) return;

    const url = new URL(window.location.href);
    url.searchParams.set(
      "a",
      `${state.routePointA.lat},${state.routePointA.lon}`
    );
    url.searchParams.set(
      "b",
      `${state.routePointB.lat},${state.routePointB.lon}`
    );
    url.searchParams.set("mode", getSelectedRouteMode());

    if (state.routeWaypoints.length) {
      url.searchParams.set(
        "via",
        state.routeWaypoints
          .map(point => `${point.lat},${point.lon}`)
          .join(";")
      );
    } else {
      url.searchParams.delete("via");
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: document.title,
          url: url.toString()
        });
      } else {
        await navigator.clipboard.writeText(url.toString());
        show(text[state.language].routeShared);
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        show(text[state.language].routeShareError);
      }
    }
  }

  async function loadSharedRouteFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const a = parseSharedPoint(params.get("a"));
    const b = parseSharedPoint(params.get("b"));
    if (!a || !b) return;

    const mode = params.get("mode");
    const modeInput = document.querySelector(
      `input[name="route-mode"][value="${mode}"]`
    );
    if (modeInput) modeInput.checked = true;

    state.routePointA = a;
    state.routePointB = b;
    state.routeClickStage = "move-b";
    if (el.routeFrom) el.routeFrom.value = a.label;
    if (el.routeTo) el.routeTo.value = b.label;

    const via = params.get("via");
    state.routeWaypoints = via
      ? via.split(";").map(parseSharedPoint).filter(Boolean)
      : [];

    refreshRouteMarkers();
    refreshWaypointMarkers();
    await calculateRouteFromStoredPoints();
  }

  function openGeoUri(rawUrl) {
    const match = /^geo:([^;?]+)/i.exec(String(rawUrl || ""));
    if (!match) return;

    const point = parseSharedPoint(decodeURIComponent(match[1]));
    if (!point) return;

    showPlaceInformation({
      lngLat: new maplibregl.LngLat(point.lon, point.lat)
    });

    map.flyTo({
      center: [point.lon, point.lat],
      zoom: 17,
      bearing: 180
    });
  }

  function initializeGeoUriHandling() {
    window.omapHandleGeoUri = openGeoUri;

    const capacitorApp = window.CapacitorApp;
    if (!capacitorApp) return;

    capacitorApp.addListener("appUrlOpen", event => {
      openGeoUri(event?.url);
    });

    capacitorApp.getLaunchUrl?.()
      .then(result => openGeoUri(result?.url))
      .catch(() => {});
  }

  function parseSharedPoint(value) {
    if (!value) return null;
    const [latText, lonText] = value.split(",");
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      lat,
      lon,
      label: formatCoordinates(lon, lat)
    };
  }

  function updateRouteSummary(distanceMeters, durationSeconds) {
    el.routeDistance.textContent = formatDistance(distanceMeters);
    el.routeDuration.textContent = formatDuration(durationSeconds);

    const arrival = new Date(Date.now() + durationSeconds * 1000);
    el.routeArrival.textContent = arrival.toLocaleTimeString(
      state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    el.routeSummary.hidden = false;
    scrollPanelToElement(
      el.routePanel,
      el.routeSummary
    );
    if (el.routeShare) el.routeShare.hidden = false;
    if (el.routeWaypointNote) el.routeWaypointNote.hidden = false;
  }

  function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toLocaleString(state.language, {
      maximumFractionDigits: 1
    })} km`;
  }

  function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function clearRoute() {
    state.routeCoordinates = null;
    state.routePointA = null;
    state.routePointB = null;
    state.routeClickStage = "a";
    if (el.routeFrom) el.routeFrom.value = "";
    if (el.routeTo) el.routeTo.value = "";
    hideAllAutocomplete();
    el.routeSummary.hidden = true;
    el.routeDistance.textContent = "—";
    el.routeDuration.textContent = "—";
    el.routeArrival.textContent = "—";
    if (el.routeShare) el.routeShare.hidden = true;
    if (el.routeWaypointNote) el.routeWaypointNote.hidden = true;
    state.routeWaypoints = [];
    clearWaypointMarkers();
    clearManeuverHighlight();
    clearRouteDirections();

    if (map.getSource(CONFIG.routing.sourceId)) {
      map.getSource(CONFIG.routing.sourceId).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }

    if (map.getLayer(CONFIG.routing.casingLayerId)) {
      map.setLayoutProperty(CONFIG.routing.casingLayerId, "visibility", "none");
    }
    if (map.getLayer(CONFIG.routing.lineLayerId)) {
      map.setLayoutProperty(CONFIG.routing.lineLayerId, "visibility", "none");
    }

    removeRouteMarker("a");
    removeRouteMarker("b");
    updateRouteClickHint();
  }

  function openHistoryPanel() {
    closeMapContextMenu();
    closePlacePanel();
    closeMenu();
    closeLegend();
    closeRoutePanel();
    closeDiscover();
    closeAbout();
    closeBackup();
    closeFavoritesPanel();
    closeHistory();

    openMobilePanelStandard(
      el.historyPanel,
      "--history-sheet-height"
    );
    if (el.historySearch) el.historySearch.value = "";
    renderHistoryList();
  }

  function closeHistory() {
    if (!el.historyPanel || el.historyPanel.hidden) return;
    el.historyPanel.hidden = true;
  }

  function returnFromHistoryToMenu() {
    closeHistory();
    openMenuHome();
  }

  function openHistoryPlace(entry) {
    return window.OMAP_PLACE_SERVICE.open(entry, {
      source: "history"
    });
  }

  function clearHistoryList() {
    state.history = [];
    saveHistory();
    renderHistoryList();
  }

  function renderHistoryList() {
    if (!el.historyList) return;

    const query = normalizeSearchText(
      el.historySearch?.value || ""
    );

    const fragment = document.createDocumentFragment();
    const matching = state.history.filter(entry => {
      if (!query) return true;
      const haystack = normalizeSearchText(
        [entry.title, entry.address, entry.lat, entry.lon]
          .filter(value => value !== undefined && value !== null)
          .join(" ")
      );
      return haystack.includes(query);
    });

    el.historyList
      .querySelectorAll(".favorite-place-item")
      .forEach(node => node.remove());

    if (el.historyEmpty) {
      el.historyEmpty.hidden = matching.length > 0;
      el.historyEmpty.textContent = state.history.length === 0
        ? text[state.language].historyEmpty
        : text[state.language].historyNoMatch;
    }

    matching.forEach(entry => {
      const item = document.createElement("div");
      item.className = "favorite-place-item";

      const row = document.createElement("div");
      row.className = "favorite-place-row";

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "favorite-place-open";

      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "🕘";

      const copy = document.createElement("span");

      const title = document.createElement("strong");
      title.textContent =
        entry.title ||
        (state.language === "pl" ? "Miejsce" : "Place");

      const address = document.createElement("small");
      address.textContent =
        entry.address ||
        `${Number(entry.lat).toFixed(5)}, ${Number(entry.lon).toFixed(5)}`;

      copy.append(title, address);
      openButton.append(icon, copy);

      openButton.addEventListener("click", () => {
        openHistoryPlace(entry);
      });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "favorite-place-remove";
      removeButton.textContent = "×";
      removeButton.title = text[state.language].historyRemove;
      removeButton.setAttribute(
        "aria-label",
        text[state.language].historyRemove
      );

      removeButton.addEventListener("click", () => {
        state.history = state.history.filter(
          item => item.key !== entry.key
        );
        saveHistory();
        renderHistoryList();
      });

      const actions = document.createElement("div");
      actions.className = "favorite-place-actions";
      actions.append(removeButton);

      row.append(openButton, actions);
      item.append(row);
      fragment.appendChild(item);
    });

    el.historyList.appendChild(fragment);
  }


  function openFavoritesPanel() {
    closeMapContextMenu();
    closePlacePanel();
    closeMenu();
    closeLegend();
    closeRoutePanel();
    closeDiscover();
    closeAbout();
    closeBackup();

    openMobilePanelStandard(
      el.favoritesPanel,
      "--favorites-sheet-height"
    );
    el.favoritesSearch.value = "";
    renderFavoritesList();
  }

  function closeFavoritesPanel() {
    if (!el.favoritesPanel || el.favoritesPanel.hidden) return;
    el.favoritesPanel.hidden = true;
  }


  window.OMAP_PLACE_SERVICE?.configure({
    async open(event) {
      if (
        event.source !== "favorite" &&
        event.source !== "favorites" &&
        event.source !== "discover" &&
        event.source !== "discover-nearby" &&
        event.source !== "route-nearby" &&
        event.source !== "history" &&
        event.source !== "search" &&
        event.source !== "search-history" &&
        event.source !== "map-info"
      ) {
        return;
      }

      const place = event.place;
      const lon = Number(place.lon);
      const lat = Number(place.lat);

      if (
        event.source === "search" ||
        event.source === "search-history"
      ) {
        if (event.metadata?.reverse) {
          invalidateNamedPoiGuard();

          await showPlaceInformation({
            lngLat: new maplibregl.LngLat(
              lon,
              lat
            ),
            forceReverse: Boolean(
              event.metadata.forceReverse
            )
          });
        } else {
          await showSelectedPlaceInformation(place);
        }

        return;
      }

      if (event.source === "map-info") {
        invalidateNamedPoiGuard();

        await showPlaceInformation({
          lngLat: new maplibregl.LngLat(
            lon,
            lat
          ),
          forceReverse: true
        });

        return;
      }

      if (event.source === "discover") {
        setPlacePanelReturnTarget("discover", {
          scrollTop: el.discoverPanel?.scrollTop || 0
        });
        showSelectedPlaceInformation(place);

        map.easeTo({
          center: [lon, lat],
          zoom: Math.max(map.getZoom(), 16),
          bearing: 180,
          duration: 600
        });

        return;
      }

      const hasExactIdentity = Boolean(
        place.exactLocalIdentity ||
        place.provider === "named-poi" ||
        place.namedPoiId ||
        (place.osm_type && place.osm_id)
      );

      if (event.source === "favorite" || event.source === "favorites") {
        setPlacePanelReturnTarget("favorites");
      }

      if (event.source === "history") {
        setPlacePanelReturnTarget("history");
      }

      if (hasExactIdentity) {
        showSelectedPlaceInformation({
          ...place,
          _exactLocalIdentity:
            place.exactLocalIdentity,
          providers:
            place.providers?.length
              ? place.providers
              : [place.provider].filter(Boolean)
        });
      } else {
        invalidateNamedPoiGuard();

        showPlaceInformation({
          lngLat: new maplibregl.LngLat(
            lon,
            lat
          ),
          forceReverse: true
        });
      }

      map.flyTo({
        center: [lon, lat],
        zoom: Math.max(map.getZoom(), 16),
        bearing: 180
      });
    }
  });

  async function openFavoritePlace(favorite) {
    const payload = favorite.customName
      ? { ...favorite, name: favorite.customName, title: favorite.customName }
      : favorite;

    return window.OMAP_PLACE_SERVICE.open(
      payload,
      {
        source: "favorite",
        metadata: {
          origin: "favorites-panel"
        }
      }
    );
  }


  async function openSearchPlaceThroughService(
    result,
    {
      query = "",
      reverse = false,
      forceReverse = false,
      origin = "search"
    } = {}
  ) {
    return window.OMAP_PLACE_SERVICE.open(
      result,
      {
        source:
          origin === "search-history"
            ? "search-history"
            : "search",
        metadata: {
          origin,
          query,
          reverse,
          forceReverse
        }
      }
    );
  }

  async function openMapInformationThroughService(
    lngLat,
    {
      origin = "map-context-menu"
    } = {}
  ) {
    return window.OMAP_PLACE_SERVICE.open(
      {
        name: "Wybrane miejsce",
        lat: Number(lngLat.lat),
        lon: Number(lngLat.lng),
        category: "place",
        source: "map-info",
        provider: "map"
      },
      {
        source: "map-info",
        metadata: {
          origin
        }
      }
    );
  }

  function renderFavoritesList() {
    if (
      !el.favoritesList ||
      !el.favoritesEmpty ||
      !el.favoritesCount
    ) {
      return;
    }

    el.favoritesList
      .querySelectorAll(".favorite-place-item")
      .forEach(item => item.remove());

    const query = normalizeSearchText(
      el.favoritesSearch?.value || ""
    );

    const favorites = (
      Array.isArray(state.favorites)
        ? state.favorites
        : []
    ).filter(favorite => {
      if (!query) return true;

      const haystack = normalizeSearchText(
        [
          favorite.title,
          favorite.address,
          favorite.customName,
          favorite.note,
          favorite.lat,
          favorite.lon
        ]
          .filter(value => value !== undefined && value !== null)
          .join(" ")
      );

      return haystack.includes(query);
    });

    el.favoritesCount.textContent =
      String(state.favorites.length);

    const hasAny = state.favorites.length > 0;
    const hasMatches = favorites.length > 0;

    el.favoritesEmpty.hidden = hasMatches;
    el.favoritesEmpty.textContent = hasAny
      ? text[state.language].favoritesNoMatch
      : text[state.language].favoritesEmpty;

    if (!hasMatches) return;

    const fragment = document.createDocumentFragment();

    favorites.forEach(favorite => {
      const item = document.createElement("div");
      item.className = "favorite-place-item";

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "favorite-place-open";

      const icon = document.createElement("span");
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = "⭐";

      const copy = document.createElement("span");

      const title = document.createElement("strong");
      title.textContent =
        favorite.customName ||
        favorite.title ||
        (state.language === "pl"
          ? "Ulubione miejsce"
          : "Favorite place");

      const address = document.createElement("small");
      address.textContent =
        favorite.address ||
        `${Number(favorite.lat).toFixed(5)}, ${Number(favorite.lon).toFixed(5)}`;

      copy.append(title, address);

      if (favorite.note) {
        const note = document.createElement("small");
        note.className = "favorite-place-note";
        note.textContent = favorite.note;
        copy.append(note);
      }

      openButton.append(icon, copy);

      openButton.addEventListener(
        "click",
        () => {
          openFavoritePlace(favorite);

          // Panel Ulubione celowo pozostaje otwarty.
        }
      );

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "favorite-place-edit-toggle";
      editButton.textContent = "✎";
      editButton.title = text[state.language].favoriteEdit;
      editButton.setAttribute("aria-label", text[state.language].favoriteEdit);

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "favorite-place-remove";
      removeButton.textContent = "×";
      removeButton.title =
        state.language === "pl"
          ? "Usuń z ulubionych"
          : "Remove from favorites";
      removeButton.setAttribute(
        "aria-label",
        removeButton.title
      );

      removeButton.addEventListener("click", () => {
        state.favorites = state.favorites.filter(
          entry => entry.key !== favorite.key
        );

        saveFavorites();
        renderFavoritesList();
      });

      const editForm = document.createElement("div");
      editForm.className = "favorite-place-edit-form";
      editForm.hidden = true;

      const nameLabel = document.createElement("label");
      nameLabel.textContent = text[state.language].favoriteCustomNameLabel;
      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.placeholder = text[state.language].favoriteCustomNamePlaceholder;
      nameInput.value = favorite.customName || "";
      nameLabel.append(nameInput);

      const noteLabel = document.createElement("label");
      noteLabel.textContent = text[state.language].favoriteNoteLabel;
      const noteInput = document.createElement("textarea");
      noteInput.rows = 2;
      noteInput.placeholder = text[state.language].favoriteNotePlaceholder;
      noteInput.value = favorite.note || "";
      noteLabel.append(noteInput);

      const editActions = document.createElement("div");
      editActions.className = "favorite-place-edit-actions";

      const saveButton = document.createElement("button");
      saveButton.type = "button";
      saveButton.className = "favorite-place-edit-save";
      saveButton.textContent = text[state.language].favoriteSave;
      saveButton.addEventListener("click", () => {
        updateFavoriteDetails(favorite.key, {
          customName: nameInput.value,
          note: noteInput.value
        });
      });

      const cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.className = "favorite-place-edit-cancel";
      cancelButton.textContent = text[state.language].favoriteCancelEdit;
      cancelButton.addEventListener("click", () => {
        editForm.hidden = true;
      });

      editActions.append(saveButton, cancelButton);
      editForm.append(nameLabel, noteLabel, editActions);

      editButton.addEventListener("click", () => {
        editForm.hidden = !editForm.hidden;
      });

      const actions = document.createElement("div");
      actions.className = "favorite-place-actions";
      actions.append(editButton, removeButton);

      const row = document.createElement("div");
      row.className = "favorite-place-row";
      row.append(openButton, actions);

      item.append(row, editForm);
      fragment.appendChild(item);
    });

    el.favoritesList.appendChild(fragment);
  }

  function updateFavoriteDetails(key, { customName, note }) {
    const favorite = state.favorites.find(item => item.key === key);
    if (!favorite) return;

    favorite.customName = (customName || "").trim();
    favorite.note = (note || "").trim();

    saveFavorites();
    renderFavoritesList();
  }

  function saveFavorites() {
    safeSet(
      CONFIG.storageKeys.favorites,
      JSON.stringify(state.favorites)
    );
  }

  async function exportAllSettingsJson() {
    const scopes = getCheckedBackupScopes();

    if (scopes.length === 0) {
      show(text[state.language].backupNothingSelected);
      return;
    }

    const payload = {
      version: 2,
      exportedAt: new Date().toISOString()
    };

    if (scopes.includes("favorites")) {
      payload.favorites = state.favorites.map(favorite => ({
        ...favorite,
        key: favorite.key,
        title: favorite.title || "",
        address: favorite.address || "",
        lat: Number(favorite.lat),
        lon: Number(favorite.lon)
      }));
    }

    if (scopes.includes("colors")) {
      payload.customPalette = { ...state.customPalette };
    }

    const json = JSON.stringify(payload, null, 2);
    const filename =
      `odwrotna-mapa-ustawienia-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;

    // Android WebView nie obsługuje niezawodnie pobierania plików przez
    // <a download> + blob: URL, więc tam zapisujemy plik natywnie i
    // otwieramy systemowe okno udostępniania/zapisu.
    if (window.CapacitorPlatform === "android" && window.CapacitorFilesystem) {
      try {
        const writeResult = await window.CapacitorFilesystem.writeFile({
          path: filename,
          data: json,
          directory: window.CapacitorDirectory.Cache,
          encoding: window.CapacitorEncoding.UTF8
        });

        await window.CapacitorShare.share({
          title: filename,
          files: [writeResult.uri]
        });
      } catch (error) {
        console.error(error);
        show(text[state.language].backupExportError);
      }
      return;
    }

    const blob = new Blob(
      [json],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function importAllSettingsJson(event) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    try {
      const scopes = getCheckedBackupScopes();

      if (scopes.length === 0) {
        show(text[state.language].backupNothingSelected);
        return;
      }

      const raw = JSON.parse(await file.text());
      const entries = Array.isArray(raw)
        ? raw
        : raw?.favorites;

      let importedCount = 0;
      let favoritesImportedFlag = false;
      let colorsImportedFlag = false;

      if (scopes.includes("favorites") && Array.isArray(entries)) {
        const imported = [];
        const known = new Set(
          state.favorites.map(item => item.key)
        );

        for (const entry of entries) {
          const lat = Number(entry.lat);
          const lon = Number(entry.lon);

          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lon)
          ) {
            continue;
          }

          const key =
            String(entry.key || "").trim() ||
            `${lat.toFixed(6)},${lon.toFixed(6)}`;

          if (known.has(key)) continue;
          known.add(key);

          imported.push({
            ...entry,
            key,
            title: String(entry.title || "").trim(),
            address: String(entry.address || "").trim(),
            lat,
            lon,
            exactLocalIdentity: Boolean(
              entry.exactLocalIdentity ||
              entry._exactLocalIdentity
            ),
            addressDetails: {
              ...(entry.addressDetails || entry.addressObject || {})
            },
            extratags: {
              ...(entry.extratags || {})
            },
            namedetails: {
              ...(entry.namedetails || {})
            }
          });
        }

        state.favorites = [
          ...state.favorites,
          ...imported
        ].slice(0, 1000);

        saveFavorites();
        renderFavoritesList();
        importedCount = imported.length;
        favoritesImportedFlag = true;
      }

      if (
        scopes.includes("colors") &&
        raw?.customPalette &&
        typeof raw.customPalette === "object"
      ) {
        state.customPalette = {
          ...DEFAULT_CUSTOM_PALETTE,
          ...raw.customPalette
        };
        saveCustomPalette(state.customPalette);
        syncCustomPaletteInputs();
        if (state.theme === "custom") applyTheme(state.theme);
        colorsImportedFlag = true;
      }

      const messages = [];
      if (favoritesImportedFlag) {
        messages.push(text[state.language].favoritesImported(importedCount));
      }
      if (colorsImportedFlag) {
        messages.push(text[state.language].colorsImported);
      }

      show(messages.join(" ") || text[state.language].favoritesImportError);
    } catch (error) {
      console.error(error);
      show(text[state.language].favoritesImportError);
    }
  }


  function openMenuHome() {
    closeMapContextMenu();
    closePlacePanel();
    closeFavoritesPanel();
    closeHistory();
    closeLegend();
    closeAbout();
    closeBackup();
    closeRoutePanel();
    closeDiscover();

    if (!el.menuPanel) return;

    openMobilePanelStandard(
      el.menuPanel,
      "--menu-sheet-height"
    );
    el.menuPanel.classList.remove("is-collapsed");

    el.menuButton?.setAttribute("aria-expanded", "true");
    el.menuButton?.classList.add("is-active");
    el.mobileMenuButton?.setAttribute("aria-expanded", "true");
    el.mobileMenuButton?.classList.add("is-active");
  }

  function openLegendFromMenu() {
    closeMenu();
    closeAbout();
    closeBackup();
    closeFavoritesPanel();
    closeHistory();
    closeRoutePanel();
    closeDiscover();

    openMobilePanelStandard(
      el.legendPanel,
      "--legend-sheet-height"
    );
    el.legendButton?.setAttribute("aria-expanded", "true");
  }

  function openAboutFromMenu() {
    closeMenu();
    closeLegend();
    closeFavoritesPanel();
    closeHistory();
    closeRoutePanel();
    closeDiscover();

    openMobilePanelStandard(
      el.aboutPanel,
      "--about-sheet-height"
    );
    el.aboutButton?.setAttribute("aria-expanded", "true");
  }

  function returnFromLegendToMenu() {
    closeLegend();
    openMenuHome();
  }

  function returnFromAboutToMenu() {
    closeAbout();
    closeBackup();
    openMenuHome();
  }

  function openBackupFromMenu() {
    closeMenu();
    closeLegend();
    closeAbout();
    closeFavoritesPanel();
    closeHistory();
    closeRoutePanel();
    closeDiscover();

    openMobilePanelStandard(
      el.backupPanel,
      "--backup-sheet-height"
    );
    el.menuBackupButton?.setAttribute("aria-expanded", "true");
  }

  function returnFromBackupToMenu() {
    closeBackup();
    openMenuHome();
  }

  function returnFromFavoritesToMenu() {
    closeFavoritesPanel();
    closeHistory();
    openMenuHome();
  }

  function toggleMenu() {
    closeMapContextMenu();
    closePlacePanel();
    closeFavoritesPanel();
    closeHistory();
    if (!el.menuPanel || !el.menuButton) return;

    const shouldOpen = el.menuPanel.hidden;

    if (shouldOpen) {
      closeLegend();
      closeRoutePanel();
      closeDiscover();
      closeAbout();
      closeBackup();
    }

    el.menuPanel.hidden = !shouldOpen;
    if (shouldOpen) {
      openMobilePanelStandard(el.menuPanel, "--menu-sheet-height");
    }
    
    el.menuButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.menuButton?.classList.toggle("is-active", shouldOpen);
    el.mobileMenuButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.mobileMenuButton?.classList.toggle("is-active", shouldOpen);
el.menuButton.setAttribute("aria-expanded", String(shouldOpen));
    el.mobileMenuButton?.classList.toggle("is-active", shouldOpen);
  }

  function closeMenu() {
    if (el.menuPanel.hidden) return;

    el.menuPanel.hidden = true;

    el.menuButton?.setAttribute("aria-expanded", "false");
    el.menuButton?.classList.remove("is-active");

    el.mobileMenuButton?.setAttribute("aria-expanded", "false");
    el.mobileMenuButton?.classList.remove("is-active");
  }

  function useMyLocationForRoute(onResolved) {
    if (!navigator.geolocation) {
      show(
        state.language === "pl"
          ? "Twoja przeglądarka nie obsługuje lokalizacji."
          : "Your browser does not support geolocation."
      );
      return;
    }

    show(text[state.language].locatingForRoute, 0);

    navigator.geolocation.getCurrentPosition(
      position => {
        hide();
        onResolved({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
          label: text[state.language].menuLocation,
          __resolvedPoint: true
        });
      },
      error => {
        console.error(error);
        show(text[state.language].locateError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  function locateFromMenu() {
    if (!navigator.geolocation) {
      show(
        state.language === "pl"
          ? "Twoja przeglądarka nie obsługuje lokalizacji."
          : "Your browser does not support geolocation."
      );
      return;
    }

    show(
      state.language === "pl"
        ? "Pobieranie lokalizacji…"
        : "Getting your location…",
      0
    );

    navigator.geolocation.getCurrentPosition(
      position => {
        const lon = position.coords.longitude;
        const lat = position.coords.latitude;

        showUserLocationMarker({ lng: lon, lat });

        map.flyTo({
          center: [lon, lat],
          zoom: Math.max(map.getZoom(), 15),
          bearing: 180
        });

        hide();
      },
      error => {
        console.error(error);
        show(
          state.language === "pl"
            ? "Nie udało się pobrać lokalizacji."
            : "Your location could not be retrieved."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }

  function clearMapView() {
    closeMapContextMenu();
    clearRoute();
    clearDiscoverResults();
    closePlacePanel();
    removeContextPointMarker();
    removeUserLocationMarker();
    hideAllAutocomplete();

    closeRoute();
    closeDiscover();
    closeMenu();
    closeLegend();
    closeAbout();
    closeBackup();
    closeFavoritesPanel();
    closeHistory();

    show(text[state.language].mapCleared);
  }

  function toggleAbout() {
    closeMapContextMenu();
    closePlacePanel();
    closeFavoritesPanel();
    closeHistory();
    closeMenu();

    const shouldOpen = el.aboutPanel.hidden;

    closeDiscover();
    closeLegend();
    closeRoutePanel();

    el.aboutPanel.hidden = !shouldOpen;

    if (shouldOpen) {
      openMobilePanelStandard(
        el.aboutPanel,
        "--about-sheet-height"
      );
    }

    el.aboutButton?.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }

  function closeAbout() {
    if (el.aboutPanel.hidden) return;
    el.aboutPanel.hidden = true;
    el.aboutButton?.setAttribute("aria-expanded", "false");
  }

  function closeBackup() {
    if (!el.backupPanel || el.backupPanel.hidden) return;
    el.backupPanel.hidden = true;
    el.menuBackupButton?.setAttribute("aria-expanded", "false");
  }

  function toggleLegend() {
    closeMapContextMenu();
    closePlacePanel();
    closeFavoritesPanel();
    closeHistory();
    closeMenu();

    const shouldOpen = el.legendPanel.hidden;

    closeDiscover();
    closeAbout();
    closeBackup();
    closeRoute();

    el.legendPanel.hidden = !shouldOpen;

    if (shouldOpen) {
      openMobilePanelStandard(
        el.legendPanel,
        "--legend-sheet-height"
      );
    }

    el.legendButton?.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }

  function closeLegend() {
    if (el.legendPanel.hidden) return;
    el.legendPanel.hidden = true;
    el.legendButton?.setAttribute("aria-expanded", "false");
  }

  function updateSearchClearButton() {
    if (!el.searchClear) return;
    el.searchClear.hidden = !el.searchInput.value.trim();
  }

  function clearMainSearch() {
    invalidateNamedPoiGuard();
    if (el.searchInput) el.searchInput.value = "";
    hideAllAutocomplete();
    updateSearchClearButton();
    el.searchInput.focus();
    el.searchInput.dispatchEvent(new Event("focus"));
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
        "ice_cream"
      ]
    },
    {
      id: "stay",
      categories: ["hotel", "campsite"]
    },
    {
      id: "shopping",
      categories: ["shop", "mall", "clothes", "bookstore", "kiosk"]
    },
    {
      id: "health",
      categories: ["pharmacy", "hospital", "dentist", "vet"]
    },
    {
      id: "services",
      categories: [
        "bank",
        "post_office",
        "hairdresser",
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
        "parking",
        "car_repair"
      ]
    },
    {
      id: "culture",
      categories: [
        "museum",
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
        "beach",
        "playground",
        "gym",
        "swimming_pool"
      ]
    },
    {
      id: "public",
      categories: ["school", "church", "police"]
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
    park: { emoji: "🌳", queries: ["park", "ogród"] },
    pharmacy: { emoji: "💊", queries: ["apteka", "pharmacy"] },
    hospital: { emoji: "🏥", queries: ["szpital", "hospital"] },
    dentist: { emoji: "🦷", queries: ["dentysta", "dentist"] },
    vet: {
      emoji: "🐾",
      queries: ["weterynarz", "lecznica dla zwierząt"]
    },
    bank: { emoji: "🏦", queries: ["bank", "bankomat"] },
    post_office: {
      emoji: "✉️",
      queries: ["poczta", "post office"]
    },
    hairdresser: {
      emoji: "💇",
      queries: ["fryzjer", "salon fryzjerski"]
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
    parking: { emoji: "🅿️", queries: ["parking", "parking strzeżony"] },
    car_repair: {
      emoji: "🔧",
      queries: ["warsztat samochodowy", "mechanik", "car repair"]
    },
    shop: { emoji: "🛒", queries: ["supermarket", "sklep spożywczy"] },
    mall: {
      emoji: "🏬",
      queries: ["centrum handlowe", "galeria handlowa"]
    },
    clothes: { emoji: "👕", queries: ["sklep odzieżowy", "odzież"] },
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
    church: { emoji: "⛪", queries: ["kościół", "church"] },
    police: {
      emoji: "👮",
      queries: ["komisariat policji", "police station"]
    }
  };

  function renderDiscoverCategoryButtons() {
    if (!el.discoverCategories) return;

    const t = text[state.language];
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

    el.discoverCategories.innerHTML = "";
    el.discoverCategories.appendChild(fragment);
  }

  renderDiscoverCategoryButtons();

  async function runDiscoverCategory(categoryId, sourceButton) {
    const category = DISCOVER_CATEGORIES[categoryId];
    if (!category) return;

    const t = text[state.language];

    for (const button of el.discoverCategories.querySelectorAll(
      "[data-discover-category]"
    )) {
      button.classList.toggle(
        "is-active",
        button === sourceButton
      );
    }

    // Zbyt duże oddalenie daje zbyt ogólne wyniki.
    if (map.getZoom() < 10) {
      el.discoverStatus.hidden = false;
      el.discoverStatus.textContent = t.discoverZooming;

      map.easeTo({
        center: map.getCenter(),
        zoom: 12,
        bearing: 180,
        duration: 650
      });

      map.once("moveend", () => {
        runDiscoverCategory(categoryId, sourceButton);
      });
      return;
    }

    clearDiscoverResults(false);

    el.discoverStatus.hidden = false;
    el.discoverStatus.textContent = t.discoverSearching;

    state.exploreRequestController?.abort();
    state.exploreRequestController = new AbortController();

    try {
      const places = await fetchDiscoverFromNominatim(
        category,
        state.exploreRequestController.signal
      );

      if (!places.length) {
        el.discoverStatus.textContent = t.discoverEmpty;
        return;
      }

      renderDiscoverResults(
        places,
        {
          ...category,
          id: categoryId
        }
      );
      el.discoverStatus.textContent =
        t.discoverFound(places.length);
      if (el.discoverClear) el.discoverClear.hidden = false;
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error(error);
      el.discoverStatus.textContent = t.exploreError;
      if (el.discoverClear) el.discoverClear.hidden = true;
    } finally {
      state.exploreRequestController = null;
    }
  }

  async function fetchDiscoverFromNominatim(category, signal) {
    const bounds = map.getBounds();

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
      const url = new URL(CONFIG.search.endpoint);
      url.searchParams.set("q", query);
      url.searchParams.set("format", "jsonv2");
      url.searchParams.set("addressdetails", "1");
      url.searchParams.set("extratags", "1");
      url.searchParams.set("namedetails", "1");
      url.searchParams.set("bounded", "1");
      url.searchParams.set("viewbox", viewbox);
      url.searchParams.set(
        "limit",
        String(Math.min(15, CONFIG.search.exploreLimit))
      );
      url.searchParams.set("accept-language", state.language);

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
              getSearchResultTitle(item) ||
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

        if (collected.length >= CONFIG.search.exploreLimit) {
          return collected;
        }
      }
    }

    return collected;
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

  function renderDiscoverResults(places, category) {
    window.OMAP_PHOTO_SERVICE?.preload(places);

    el.discoverResultsList?.replaceChildren();

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
        .addTo(map);

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
          display_name:
            place.tags.name ||
            place.tags.brand ||
            "",
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
            city:
              place.tags["addr:city"] ||
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

      state.exploreMarkers.push(marker);

      if (el.discoverResultsList) {
        const item = document.createElement("li");
        const button = document.createElement("button");
        button.type = "button";
        button.className = "discover-result-button";

        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = category.emoji;

        const copy = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent =
          place.tags.name ||
          place.tags.brand ||
          `${category.emoji} ${index + 1}`;

        const coordinates = document.createElement("small");
        coordinates.textContent =
          `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`;

        copy.append(name, coordinates);
        button.append(icon, copy);
        button.addEventListener("click", openPlace);
        item.appendChild(button);
        listFragment.appendChild(item);
      }
    });

    if (el.discoverResultsList) {
      el.discoverResultsList.appendChild(listFragment);
      el.discoverResultsList.hidden = false;
      scrollPanelToElement(
        el.discoverPanel,
        el.discoverResultsList
      );
    }
  }

  function clearDiscoverResults(resetInterface = true) {
    state.exploreRequestController?.abort();
    state.exploreRequestController = null;

    for (const marker of state.exploreMarkers) {
      marker.remove();
    }
    state.exploreMarkers = [];

    if (el.discoverResultsList) {
      el.discoverResultsList.replaceChildren();
      el.discoverResultsList.hidden = true;
    }

    if (!resetInterface) return;

    if (el.discoverStatus) {
      el.discoverStatus.hidden = true;
      el.discoverStatus.textContent = "";
    }

    if (el.discoverClear) {
      if (el.discoverClear) el.discoverClear.hidden = true;
    }

    if (el.discoverCategories) {
      for (const button of el.discoverCategories.querySelectorAll(
        "[data-discover-category]"
      )) {
        button.classList.remove("is-active");
      }
    }
  }


  function normalizeExactPlaceName(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function ownPlaceName(result) {
    return (
      result?.namedetails?.["name:pl"] ||
      result?.namedetails?.name ||
      result?.name ||
      ""
    );
  }

  function isShoppingCentreQuery(query) {
    const normalized = normalizeExactPlaceName(query);
    return /\b(galeria|centrum handlowe|shopping mall|shopping centre|shopping center)\b/.test(normalized);
  }

  function isShoppingCentreResult(result) {
    const normalized = normalizeExactPlaceName([
      result?.type,
      result?.category,
      result?.class,
      result?.extratags?.shop,
      result?.address?.shop
    ].filter(Boolean).join(" "));

    return (
      /\bmall\b/.test(normalized) ||
      /\bshopping centre\b/.test(normalized) ||
      /\bshopping center\b/.test(normalized)
    );
  }

  function isClearlyWrongNamedPlaceCandidate(result) {
    const type = normalizeExactPlaceName(result?.type);
    const category = normalizeExactPlaceName(result?.category);
    const klass = normalizeExactPlaceName(result?.class);

    return (
      klass === "highway" ||
      type === "road" ||
      type === "residential" ||
      type === "defibrillator" ||
      category === "defibrillator" ||
      type === "aed" ||
      category === "aed"
    );
  }

  function selectExactNamedPlace(query, results) {
    const normalizedQuery = normalizeExactPlaceName(query);
    const shoppingCentreIntent = isShoppingCentreQuery(query);

    const candidates = (results || [])
      .map(result => {
        const normalizedName = normalizeExactPlaceName(
          ownPlaceName(result)
        );

        let score = 0;

        if (!normalizedName) score -= 1000;
        if (normalizedName === normalizedQuery) score += 1000;
        else if (normalizedName.startsWith(normalizedQuery)) score += 700;
        else if (normalizedName.includes(normalizedQuery)) score += 500;

        const queryTokens = normalizedQuery.split(" ").filter(Boolean);
        const nameTokens = normalizedName.split(" ").filter(Boolean);
        const matchingTokens = queryTokens.filter(token =>
          nameTokens.includes(token)
        );

        if (
          queryTokens.length &&
          matchingTokens.length === queryTokens.length
        ) {
          score += 450;
        } else {
          score += matchingTokens.length * 60;
        }

        if (shoppingCentreIntent) {
          if (isShoppingCentreResult(result)) score += 900;
          else score -= 500;

          if (result?.class === "shop" && !isShoppingCentreResult(result)) {
            score -= 450;
          }
        }

        if (isClearlyWrongNamedPlaceCandidate(result)) {
          score -= 1200;
        }

        score += Number(result?._searchV2?.points || 0);

        return { result, score, normalizedName };
      })
      .sort((a, b) => b.score - a.score);

    const winner = candidates[0];

    if (!winner) return null;

    if (
      shoppingCentreIntent &&
      (
        winner.score < 500 ||
        !isShoppingCentreResult(winner.result)
      )
    ) {
      return null;
    }

    if (
      winner.normalizedName !== normalizedQuery &&
      winner.score < 650
    ) {
      return null;
    }

    return winner.result;
  }

  async function findExactNamedPlace(query, signal) {
    const largerLimit = Math.max(
      Number(CONFIG.search.limit || 8),
      20
    );

    const results = await findPlacesWithFallback(
      query,
      largerLimit,
      signal
    );

    return {
      results,
      selected: selectExactNamedPlace(query, results)
    };
  }


  function normalizedPoiIdentity(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function candidateOwnName(candidate) {
    return (
      candidate?.namedetails?.["name:pl"] ||
      candidate?.namedetails?.name ||
      candidate?.name ||
      ""
    );
  }

  function isCompatibleNamedPoiCandidate(
    selected,
    candidate
  ) {
    if (
      !selected ||
      !candidate ||
      candidate.provider === "named-poi"
    ) {
      return false;
    }

    const selectedNames = [
      candidateOwnName(selected),
      ...(selected.aliases || [])
    ]
      .map(normalizedPoiIdentity)
      .filter(Boolean);

    const candidateNames = [
      candidateOwnName(candidate),
      ...(candidate.aliases || [])
    ]
      .map(normalizedPoiIdentity)
      .filter(Boolean);

    const namesMatch = selectedNames.some(
      selectedName =>
        candidateNames.some(candidateName => {
          if (selectedName === candidateName) {
            return true;
          }

          const selectedTokens =
            selectedName.split(" ").filter(Boolean);
          const candidateTokens =
            candidateName.split(" ").filter(Boolean);

          const shared = selectedTokens.filter(
            token => candidateTokens.includes(token)
          );

          const shorterLength = Math.min(
            selectedTokens.length,
            candidateTokens.length
          );

          return (
            shorterLength >= 2 &&
            shared.length >= shorterLength &&
            (
              selectedName.includes(candidateName) ||
              candidateName.includes(selectedName) ||
              shared.length >= 2
            )
          );
        })
    );

    if (!namesMatch) {
      return false;
    }

    const selectedCity = normalizedPoiIdentity(
      selected.address?.city ||
      selected.city
    );

    const candidateCity = normalizedPoiIdentity(
      candidate.address?.city ||
      candidate.address?.town ||
      candidate.address?.municipality
    );

    if (
      selectedCity &&
      candidateCity &&
      selectedCity !== candidateCity
    ) {
      return false;
    }

    const selectedLat = Number(selected.lat);
    const selectedLon = Number(selected.lon);
    const candidateLat = Number(candidate.lat);
    const candidateLon = Number(candidate.lon);

    if (
      Number.isFinite(selectedLat) &&
      Number.isFinite(selectedLon) &&
      Number.isFinite(candidateLat) &&
      Number.isFinite(candidateLon)
    ) {
      const latitudeScale = 111320;
      const longitudeScale =
        111320 *
        Math.cos(
          selectedLat * Math.PI / 180
        );

      const distanceMeters = Math.hypot(
        (candidateLat - selectedLat) *
          latitudeScale,
        (candidateLon - selectedLon) *
          longitudeScale
      );

      if (distanceMeters > 3000) {
        return false;
      }
    }

    const selectedType = normalizedPoiIdentity(
      selected.type || selected.category
    );
    const candidateType = normalizedPoiIdentity(
      candidate.type || candidate.category
    );
    const candidateClass = normalizedPoiIdentity(
      candidate.class
    );

    if (
      candidateClass === "highway" ||
      candidateType === "road" ||
      candidateType === "defibrillator" ||
      candidateType === "aed"
    ) {
      return false;
    }

    if (
      selectedType === "mall" ||
      selected.category === "shopping_mall"
    ) {
      return (
        candidateType === "mall" ||
        candidateType === "shopping centre" ||
        candidateType === "shopping center" ||
        candidate.category === "shopping_mall"
      );
    }

    return true;
  }

  function coordinateCandidateQuality(candidate) {
    let score = 0;

    if (candidate.osm_type === "relation") score += 40;
    if (candidate.osm_type === "way") score += 35;
    if (candidate.boundingbox) score += 25;
    if (candidate.provider === "nominatim") score += 20;
    if (candidate.class !== "highway") score += 10;

    score += Number(
      candidate.importance || 0
    ) * 10;

    return score;
  }

  function refineNamedPoiCoordinates(
    selected,
    candidates
  ) {
    if (
      !selected?._exactLocalIdentity &&
      selected?.provider !== "named-poi"
    ) {
      return selected;
    }

    const matches = (candidates || [])
      .filter(candidate =>
        isCompatibleNamedPoiCandidate(
          selected,
          candidate
        )
      )
      .sort(
        (left, right) =>
          coordinateCandidateQuality(right) -
          coordinateCandidateQuality(left)
      );

    const best = matches[0];

    if (!best) return selected;

    const lat = Number(best.lat);
    const lon = Number(best.lon);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      return selected;
    }

    return {
      ...selected,

      // Zachowujemy lokalną nazwę, kategorię i aliasy.
      lat: String(lat),
      lon: String(lon),
      boundingbox:
        best.boundingbox ||
        selected.boundingbox,

      // Identyfikator geometrii może pomóc w trasach
      // i późniejszym wzbogacaniu, ale nie zmienia nazwy.
      geometry_osm_type: best.osm_type,
      geometry_osm_id: best.osm_id,
      coordinateSource:
        best.provider || "external",

      address: {
        ...(best.address || {}),
        ...(selected.address || {})
      },

      extratags: {
        ...(best.extratags || {}),
        ...(selected.extratags || {})
      }
    };
  }

  async function search(event) {
    event.preventDefault();

    const q = el.searchInput.value.trim();
    if (!q) return;

    if (window.location.protocol === "file:") {
      show(
        state.language === "pl"
          ? "Uruchom OMapę przez URUCHOM_OMAPE.bat lub URUCHOM_OMAPE.command."
          : "Start OMapa using URUCHOM_OMAPE.bat or URUCHOM_OMAPE.command.",
        7000
      );
      return;
    }

    const session = window.OMAP_SEARCH_SESSION.begin(q);

    show(text[state.language].searching, 0);

    try {
      const results = await findPlacesWithFallback(
        q,
        Math.max(Number(CONFIG.search.limit || 8), 20),
        session.signal
      );

      session.assertActive();
      session.setCandidates(results);

      if (!results.length) {
        show(text[state.language].noResults);
        return;
      }

      const selected =
        typeof selectExactNamedPlace === "function"
          ? (
              selectExactNamedPlace(q, results) ||
              (
                typeof isShoppingCentreQuery === "function" &&
                isShoppingCentreQuery(q)
                  ? null
                  : results[0]
              )
            )
          : results[0];

      if (!selected) {
        show(text[state.language].noResults);
        return;
      }

      const positionedResult =
        refineNamedPoiCoordinates(
          selected,
          results
        );

      const result = session.select(
        positionedResult
      );

      const correctedName = getPrimaryPlaceName(result);

      if (correctedName && el.searchInput) {
        el.searchInput.value = correctedName;
        updateSearchClearButton();
      }

      saveSearchHistoryEntry({
        label:
          correctedName ||
          getPreferredPlaceLabel(result),
        displayName:
          result.display_name ||
          getPreferredPlaceLabel(result),
        lon: Number(result.lon),
        lat: Number(result.lat),
        osm_type: result.osm_type,
        osm_id: result.osm_id,
        name: result.name,
        type: result.type,
        category: result.category,
        class: result.class,
        address: result.address,
        extratags: result.extratags,
        namedPoiId: result.namedPoiId,
        provider: result.provider,
        providers: result.providers,
        source: result.source,
        _exactLocalIdentity:
          result._exactLocalIdentity,
        aliases: result.aliases,
        keywords: result.keywords
      });

      const point = [
        Number(result.lon),
        Number(result.lat)
      ];

      hideAllAutocomplete();
      hide();

      session.assertActive();

      // Panel otrzymuje zamrożony wynik sesji.
      setPlacePanelReturnTarget("search", {
        query: q
      });
      prepareMobilePlacePanelAfterSearch();
      openSearchPlaceThroughService(
        result,
        {
          query: q,
          origin: "search-submit"
        }
      );

      map.flyTo({
        center: point,
        zoom: getSearchResultZoom(result),
        bearing: 180
      });

      session.finish();
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error(error);
      show(text[state.language].searchError);
    }
  }

  function locate() {
    show(text[state.language].locating, 0);
    navigator.geolocation?.getCurrentPosition(
      pos => {
        const point = [pos.coords.longitude, pos.coords.latitude];
        map.flyTo({ center: point, zoom: 14, bearing: 180 });
        new maplibregl.Marker().setLngLat(point).addTo(map);
        hide();
      },
      () => show(text[state.language].locationError),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function show(message, duration = 3500) {
    clearTimeout(state.timer);
    el.status.textContent = message;
    el.status.hidden = false;
    if (duration) state.timer = setTimeout(hide, duration);
  }

  function hide() {
    clearTimeout(state.timer);
    el.status.hidden = true;
  }

  function fatal(message) {
    el.fatalText.textContent = message;
    el.fatal.hidden = false;
  }

  function saveView() {
    const c = map.getCenter();
    safeSet(CONFIG.storageKeys.view, JSON.stringify({
      center: [c.lng, c.lat],
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch()
    }));
  }

  function readView() {
    try { return JSON.parse(localStorage.getItem(CONFIG.storageKeys.view)); }
    catch (_) { return null; }
  }

  function safeGet(key, fallback) {
    try { return localStorage.getItem(key) || fallback; }
    catch (_) { return fallback; }
  }

  function safeSet(key, value) {
    try { localStorage.setItem(key, value); }
    catch (_) {}
  }
})();
