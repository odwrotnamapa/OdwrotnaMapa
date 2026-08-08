(() => {
  "use strict";

  // Architektura 2.0: komponenty i serwisy są ładowane przed app.js.

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("sw.js")
        .catch(error => {
          console.warn("Rejestracja Service Workera nie powiodła się:", error);
        });
    });
  }

  const CONFIG = window.SOUTHMAPS_CONFIG;
  const $ = id => document.getElementById(id);

  // Musi być zadeklarowane wcześnie (przed updateUI/renderFolderChips,
  // które są wołane już przy starcie) - const ma "temporal dead zone",
  // więc odwołanie się do niej przed wykonaniem tej linii rzuca
  // ReferenceError i wywala całą inicjalizację skryptu.
  const UNFILED_FOLDER = "__unfiled__";

  // Ta sama zasada co wyżej: musi być zadeklarowane wcześnie, bo
  // updateUI() (wołane już przy starcie) renderuje też listy tras,
  // które się do tego odwołują.
  const ROUTE_HISTORY_LIMIT = 50;

  // Ta sama zasada - configure() dla OMAP_ACCOUNT (wcześnie w pliku)
  // przekazuje HISTORY_LIMIT jako wartość, więc musi być gotowe
  // zanim ten configure() się wykona, nie dopiero przy starej
  // pozycji dużo dalej w pliku.
  const HISTORY_LIMIT = 50;

  // Ta sama zasada co wyżej: map.on("load", ...) rejestruje się dużo
  // wcześniej w pliku niż stara deklaracja tej zmiennej, a zdarzenie
  // "load" mapy jest asynchroniczne - jeśli odpali się (wywołując
  // applyTheme) zanim skrypt dojdzie do miejsca starej deklaracji,
  // dostajemy dokładnie ten sam ReferenceError co wyżej.
  let lastResolvedTheme = null;

  // Ta sama zasada co wyżej: w łańcuchu wywołań applyTheme ->
  // resolveTheme -> detectBrowserForcedDarkMode -> getDarkModeProbe,
  // a applyTheme jest wołane z asynchronicznego map.on("load", ...)
  // dużo wcześniej w pliku niż stara deklaracja tej zmiennej.
  let darkModeProbe = null;

  // Musi być zadeklarowane wcześnie z tego samego powodu -
  // initializeBottomSheet (wyniesione do bottom-sheet-service.js)
  // jest konfigurowane w bloku configure() dużo wcześniej niż stara
  // pozycja tej stałej, a inne funkcje z app.js (getMobilePanel*,
  // setMobilePanelHeight itd.) używają jej z zamknięcia od razu.
  const MOBILE_PANEL_STANDARD = Object.freeze({
    collapsedHeight: 48,
    defaultHeightRatio: 0.42,
    viewportGap: 8
  });

  const ROUTE_MODE_ICONS = {
    auto: "🚗",
    bicycle: "🚲",
    pedestrian: "🚶",
    transit: "🚌"
  };
  const MEASURE_SOURCE_ID = "odwrotnamapa-measure";
  const MEASURE_LINE_LAYER_ID = "odwrotnamapa-measure-line";
  const MEASURE_POINTS_LAYER_ID = "odwrotnamapa-measure-points";
  const MEASURE_AREA_SOURCE_ID = "odwrotnamapa-measure-area";
  const MEASURE_AREA_FILL_LAYER_ID = "odwrotnamapa-measure-area-fill";
  const MEASURE_AREA_LINE_LAYER_ID = "odwrotnamapa-measure-area-line";
  const MEASURE_AREA_POINTS_LAYER_ID = "odwrotnamapa-measure-area-points";

  const text = {
    pl: {
      title: "Odwrotna Mapa",
      search: "Szukaj miejsca…", button: "Szukaj",
      styles: { default: "Domyślna", satellite: "Satelitarna", inverted: "Odwrotna", custom: "Własna" },
      customMapColorsHeading: "Kolory mapy",
      customUiColorsHeading: "Kolory interfejsu",
      customColorReset: "Resetuj kolory, tekstury i czcionkę",
      customLabelsHeading: "Etykiety na mapie",
      labelsPoi: "Punkty (sklepy, usługi)",
      labelsRoads: "Nazwy ulic",
      labelsPlaces: "Miejscowości i dzielnice",
      labelsWater: "Rzeki i morza",
      labelsRegions: "Województwa / obwody",
      labelsCountries: "Kraje",
      labelsAirports: "Lotniska",
      labelsBoundaries: "Granice administracyjne",
      menuTradingSunday: "Niedziela handlowa",
      tradingSundayQuestion: "Czy dzisiaj jest niedziela handlowa?",
      closeTradingSunday: "Zamknij",
      yes: "TAK",
      no: "NIE",
      tradingSundayNotSunday: "Dziś nie jest niedziela.",
      labelsPanelTitle: "Etykiety",
      closeLabels: "Zamknij etykiety",
      menuLabelsMenuLabel: "Etykiety",
      selectAllLabels: "Zaznacz wszystko",
      deselectAllLabels: "Odznacz wszystko",
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
      customTexturesHeading: "Tekstury (zdjęcie zamiast koloru)",
      customTexturesHint: "JPG lub PNG. Woda, zieleń i budynki będą powielone jako wzór; tło mapy i tło paneli zostaną dopasowane do całej powierzchni.",
      backupFavoritesHint: "Dodawanie do ulubionych wymaga zalogowania się na konto.",
      customFontHeading: "Czcionka",
      customFontHint: "Dotyczy tekstu interfejsu (menu, panele, karty) - nie zmienia czcionki etykiet na samej mapie.",
      customThemePresetsHeading: "Zapisane motywy",
      customThemePresetsHint: "Zapisz obecne kolory, czcionkę i tekstury pod nazwą, żeby móc się później do nich wrócić.",
      customThemePresetNamePlaceholder: "Nazwa motywu",
      customThemePresetSave: "Zapisz obecny",
      customThemePresetsEmpty: "Nie masz jeszcze żadnych zapisanych motywów.",
      customThemePresetApply: "Wczytaj",
      customThemePresetDelete: "Usuń",
      customFontDefault: "Domyślna",
      customFontCustomOption: "Własna (wgraj plik)",
      customTextureLabels: {
        mapBackground: "Tło mapy",
        mapWater: "Woda",
        mapParks: "Zieleń",
        mapBuildings: "Budynki",
        uiPanel: "Tło paneli"
      },
      locate: "Moja lokalizacja", legend: "Legenda", closeLegend: "Zamknij legendę",
      toggle3d: "Widok 3D",
      measureDistance: "Zmierz odległość",
      measureArea: "Zmierz powierzchnię",
      measureAreaClear: "Wyczyść pomiar powierzchni",
      measureSwitchToArea: "Przełącz na pomiar powierzchni",
      measureSwitchToDistance: "Przełącz na pomiar odległości",
      measureClear: "Wyczyść pomiar",
      zoomIn: "Przybliż",
      zoomOut: "Oddal",
      backToMenu: "Wróć do menu",
      backToAccount: "Wróć do konta",
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
      aboutIntro: "Odwrotna Mapa to niezależna, prywatna aplikacja mapowa oparta na OpenStreetMap. Odwrócenie orientacji mapy to dopiero początek – platforma oferuje pełną swobodę widoku w 3D, zaawansowane wyszukiwanie, planowanie tras, integrację ze zdjęciami ulicznymi Mapillary oraz łatwy eksport widoków do plików PNG.",
      aboutIntroAlt: "Bez śledzenia, bez reklam i w 100% Open Source.",
      aboutData: "Dane mapowe",
      aboutStyle: "Styl mapy",
      aboutEngine: "Silnik",
      aboutContact: "Kontakt:",
      aboutDonateHeading: "Wesprzyj projekt",
      aboutGithubLabel: "Kod źródłowy na GitHubie",
      aboutDonateCoffee: "Buy Me a Coffee",
      aboutDonateBtc: "Bitcoin",
      aboutDonateBtcCopied: "Skopiowano adres Bitcoin.",
      searching: "Wyszukiwanie…", noResults: "Nie znaleziono miejsca.",
      searchError: "Nie udało się wyszukać miejsca.",
      locating: "Ustalanie lokalizacji…",
      locationError: "Nie udało się odczytać lokalizacji.",
      gettingLocation: "Pobieranie lokalizacji…",
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
      routeExportGpx: "Eksportuj",
      routeImportGpx: "Importuj",
      routeGpxExported: "Trasa została wyeksportowana jako GPX.",
      routeGpxImported: "Trasa została zaimportowana z pliku GPX.",
      routeGpxImportError: "Nie udało się zaimportować pliku GPX.",
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
      routeSaveFavorite: "Zapisz",
      routeSavedFavorite: "Zapisano",
      favoriteRemove: "Usuń",
      sortAriaLabel: "Sortuj",
      sortNewest: "Od najnowszych",
      sortOldest: "Od najstarszych",
      sortAZ: "Od A do Z",
      sortZA: "Od Z do A",
      routePickA: "Kliknij na mapie, aby wybrać punkt początkowy.",
      routePickB: "Kliknij na mapie, aby wybrać punkt docelowy.",
      routePickMoveB: "Kliknij na mapie, aby zmienić punkt docelowy.",
      routeReverseError: "Nie udało się odczytać nazwy wybranego miejsca.",
      locatingForRoute: "Pobieranie lokalizacji…",
      locateError: "Nie udało się pobrać lokalizacji.",
      routeDirections: "Wskazówki",
      routeSteps: "kroków",
      routeArrival: "Przyjazd",
      routeShare: "Udostępnij",
      routeShared: "Link do trasy został skopiowany.",
      placeShared: "Link do miejsca został skopiowany.",
      shareUnavailable: "Udostępnianie wymaga połączenia HTTPS.",
      routeShareError: "Nie udało się udostępnić trasy.",
      routeWaypointNote: "Kliknij linię trasy, aby dodać punkt pośredni. Punkt można przeciągać.",
      routeRoundaboutExit: exit => `Na rondzie wybierz ${exit}. zjazd.`,
      routeWaypoint: number => `Punkt ${number}`,
      routeAddWaypoint: "Dodaj przystanek",
      routeWaypointStopPlaceholder: number => `Przystanek ${number}`,
      routeRemoveWaypoint: number => `Usuń przystanek ${number}`,
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
        public: "Instytucje",
        support: "Pomoc"
      },
      discoverCategories: {
        pizza: "Pizza",
        cafe: "Kawiarnie",
        restaurant: "Restauracje",
        bar: "Bary",
        fast_food: "Fast food",
        bakery: "Piekarnie",
        confectionery: "Cukiernie",
        ice_cream: "Lodziarnie",
        hotel: "Hotele",
        campsite: "Kempingi",
        fuel: "Paliwo",
        museum: "Muzea",
        art_gallery: "Galerie sztuki",
        viewpoint: "Punkty widokowe",
        monument: "Pomniki",
        bowling: "Kręgielnie",
        aquarium: "Akwaria",
        park: "Parki",
        spa: "Spa",
        tennis: "Korty tenisowe",
        amusement_park: "Parki rozrywki",
        pharmacy: "Apteki",
        drugstore: "Drogerie",
        hospital: "Szpitale",
        dentist: "Dentyści",
        optician: "Optycy",
        massage: "Masaże",
        vet: "Weterynarze",
        bank: "Banki",
        post_office: "Poczty",
        parcel_locker: "Paczkomaty",
        hairdresser: "Fryzjerzy",
        currency_exchange: "Kantory",
        pawnbroker: "Lombardy",
        notary: "Notariusze",
        real_estate: "Biura nieruchomości",
        tailor: "Krawcy",
        locksmith: "Ślusarze",
        car_wash: "Myjnie",
        bottle_return: "Skup butelek",
        laundry: "Pralnie",
        toilets: "Toalety",
        bus_stop: "Przystanki",
        railway_station: "Dworce",
        ev_charging: "Ładowarki EV",
        taxi: "Taksówki",
        airport: "Lotniska",
        car_rental: "Wypożyczalnie aut",
        bicycle_rental: "Wypożyczalnie rowerów",
        parking: "Parkingi",
        car_repair: "Warsztaty",
        shop: "Sklepy",
        mall: "Centra handlowe",
        clothes: "Odzież",
        shoe_shop: "Obuwie",
        electronics: "Elektronika",
        furniture: "Meble",
        pet_shop: "Sklepy zoologiczne",
        florist: "Kwiaciarnie",
        jewelry: "Jubilerzy",
        sporting_goods: "Sklepy sportowe",
        hardware_store: "Sklepy budowlane",
        bicycle_shop: "Sklepy rowerowe",
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
        kindergarten: "Przedszkola",
        university: "Uczelnie",
        church: "Kościoły",
        police: "Policja",
        fire_station: "Straż pożarna",
        town_hall: "Urzędy",
        courthouse: "Sądy",
        homeless_shelter: "Schroniska dla bezdomnych",
        soup_kitchen: "Jadłodajnie",
        public_shower: "Prysznice publiczne",
        drinking_water: "Źródełka wody pitnej",
        social_services: "Ośrodki pomocy społecznej"
      },
      clearSearchHistory: "Wyczyść historię",
      menuTitle: "Menu",
      favoritesTitle: "Ulubione",
      ratingStars: "gwiazdek",
      ratingLoading: "Wczytywanie ocen…",
      ratingNone: "Brak ocen - bądź pierwszy/a",
      ratingError: "Nie udało się wczytać ocen.",
      ratingSaving: "Zapisywanie oceny…",
      ratingDelete: "Usuń ocenę",
      ratingLoginHint: "Zaloguj się (Konto), żeby ocenić to miejsce",
      activityLoading: "Wczytywanie…",
      activityLoginNeeded: "Zaloguj się, żeby zobaczyć swoją aktywność.",
      activityEmpty: "Nie oceniłeś/aś jeszcze żadnego miejsca.",
      activityError: "Nie udało się wczytać aktywności.",
      favoritesEmpty: "Brak ulubionych.",
      favoriteEdit: "Edytuj",
      favoriteEditTitle: "Edytuj miejsce",
      placeRename: "Zmień nazwę miejsca",
      favoriteCustomNameLabel: "Własna nazwa",
      favoriteCustomNamePlaceholder: "np. Ulubiona kawiarnia",
      favoriteNoteLabel: "Notatka",
      favoriteNotePlaceholder: "np. otwarte do 22, wejście od podwórka",
      favoriteSave: "Zapisz",
      favoriteCancelEdit: "Anuluj",
      favoriteFolderLabel: "Folder",
      favoriteFolderAll: "Wszystkie",
      favoriteFolderUnfiled: "Bez folderu",
      favoriteFolderDelete: "Usuń folder",
      favoriteFolderAddButton: "+ Folder",
      favoriteFolderNamePlaceholder: "Nazwa folderu",
      favoritesSearch: "Szukaj ulubionych…",
      favoritesCountLabel: "zapisanych",
      menuExportAll: "Eksportuj JSON",
      menuImportAll: "Importuj JSON",
      backupSelectAll: "Zaznacz wszystko",
      backupDeselectAll: "Odznacz wszystko",
      backupScopeFavorites: "Ulubione miejsca",
      backupScopeColors: "Kolory, tekstury i czcionki",
      backupScopePlaceNames: "Własne nazwy miejsc",
      colorsImported: "Zaimportowano kolory.",
      placeNamesImported: "Zaimportowano nazwy miejsc.",
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
      menuStreetview: "Widok uliczny",
      streetviewTitle: "Widok uliczny",
      streetviewUnavailable: "Widok uliczny nie jest jeszcze skonfigurowany.",
      menuBackup: "Kopia zapasowa",
      accountMenuLabel: "Konto i synchronizacja",
      accountTitle: "Konto i synchronizacja",
      accountBackAria: "Wróć do menu",
      accountCloseAria: "Zamknij Konto",
      accountSheetHandleAria: "Zmień wysokość panelu konta",
      accountIntro: "Zsynchronizuj ulubione miejsca, motyw i inne ustawienia między urządzeniami za pomocą frazy-hasła (16 słów) - bez ręcznego eksportu/importu pliku JSON.",
      accountGotoLogin: "Zaloguj",
      accountGotoRegister: "Załóż nowe konto",
      accountBack: "← Wstecz",
      accountLoginHeading: "Zaloguj się frazą",
      accountSeedInputPlaceholder: "wpisz lub wklej 16 słów oddzielonych spacją",
      accountLoginButton: "Zaloguj",
      accountRegisterWarning: "Zapisz te 16 słów w bezpiecznym miejscu (np. na kartce), w tej dokładnie kolejności. To jedyne hasło do tego konta - bez niego nikt, łącznie z nami, nie odzyska Twoich ustawień.",
      accountSeedCopy: "Kopiuj frazę",
      accountSeedConfirmLabel: "Zapisałem/-am frazę w bezpiecznym miejscu",
      accountSeedConfirmButton: "Zapisz i aktywuj konto",
      accountAvatarAria: "Zmień zdjęcie profilowe",
      accountNoName: "Bez nazwy",
      accountNameInputPlaceholder: "Twoja nazwa",
      accountNameSave: "Zapisz",
      accountNameCancel: "Anuluj",
      accountPublicIdTitle: "Kliknij, aby skopiować",
      accountAutoSyncLabel: "Synchronizuj automatycznie w tle",
      accountScopeColors: "Motyw, kolory i język",
      accountScopePlaceNames: "Własne nazwy miejsc",
      accountScopeHistory: "Historia przeglądanych miejsc",
      accountPush: "⬆ Wyślij zaznaczone",
      accountPull: "⬇ Pobierz zaznaczone",
      accountLogout: "Wyloguj",
      accountActivity: "Aktywność",
      activityRefresh: "Odśwież",
      syncRefresh: "Odśwież synchronizację",
      accountRevealSummary: "Pokaż frazę seed",
      accountActivated: "Konto aktywowane na tym urządzeniu.",
      accountLoggedInPulling: "Zalogowano - pobieranie zapisanych ustawień z chmury…",
      accountLoggedInApplied: "Zalogowano i pobrano zapisane ustawienia z chmury.",
      accountLoggedInNothingFound: "Zalogowano. Nie znaleziono jeszcze zapisanych ustawień w chmurze dla tej frazy - to normalne przy pierwszej synchronizacji.",
      accountLoggedInPullFailed: "Zalogowano, ale automatyczne pobranie się nie powiodło. Spróbuj ręcznie „Pobierz zaznaczone”.",
      accountSeedTooShort: "Fraza jest za krótka - potrzeba przynajmniej 12 słów.",
      accountSeedUnknownWord: "Nierozpoznane słowo we frazie: „{word}”. Sprawdź pisownię.",
      accountNoScopesPush: "Zaznacz przynajmniej jedną kategorię do wysłania.",
      accountNoScopesPull: "Zaznacz przynajmniej jedną kategorię do pobrania.",
      accountSending: "Wysyłanie do publicznych przekaźników…",
      accountSentResult: "Wysłano (potwierdziło {ok}/{total} przekaźników).",
      accountSentWithSkips: " Uwaga: nie udało się wysłać: {items} - prawdopodobnie za duże jak na limity publicznych przekaźników.",
      accountSendFailed: "Nie udało się wysłać danych. Sprawdź połączenie i spróbuj ponownie.",
      accountReceiving: "Pobieranie z publicznych przekaźników…",
      accountNothingFoundOnRelays: "Nie znaleziono jeszcze żadnych danych dla tej frazy na przekaźnikach.",
      accountReceived: "Pobrano i zastosowano zaznaczone ustawienia.",
      accountReceiveFailed: "Nie udało się pobrać lub odszyfrować danych. Sprawdź frazę i połączenie.",
      accountCopiedPhrase: "Fraza skopiowana do schowka.",
      accountCopyPhraseFailed: "Nie udało się skopiować - zaznacz i skopiuj słowa ręcznie.",
      accountCopiedId: "Identyfikator skopiowany.",
      accountCopyIdFailed: "Nie udało się skopiować identyfikatora.",
      accountAvatarLoadFailed: "Nie udało się wczytać zdjęcia.",
      accountProfileSaving: "Zapisywanie profilu…",
      accountProfileSaved: "Profil zapisany.",
      accountProfileSaveFailed: "Zapisano lokalnie, ale nie udało się wysłać profilu do przekaźników.",
      accountStatusActive: "Konto aktywne. Ostatnia synchronizacja: {time}.",
      accountStatusActiveNever: "Konto aktywne. Jeszcze nie synchronizowano na tym urządzeniu.",
      accountStatusSkippedWarning: " ⚠️ Nie udało się wysłać: {items} (prawdopodobnie za duże jak na limity przekaźników - dotyczy to również automatycznej synchronizacji w tle).",
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
      exportPng: "Zapisz jako PNG",
      exportPngWorking: "Przygotowuję obraz mapy…",
      exportPngDone: "Obraz mapy zapisany.",
      exportPngError: "Nie udało się zapisać obrazu mapy.",
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
      tripTitle: "Kurs",
      tripLoading: "Wczytywanie przystanków…",
      tripEmpty: "Brak informacji o przystankach dla tego kursu.",
      tripError: "Nie udało się pobrać szczegółów kursu.",
      tripCurrentStop: "Jesteś tutaj",
      departuresScheduled: "rozkładowo",
      departuresCancelled: "odwołany",
      departuresNow: "teraz",
      departuresMinutes: minutes => `za ${minutes} min`,
      departuresSources: "Źródła danych",
      departuresShowMore: "Pokaż więcej",
      departuresShowLess: "Pokaż mniej"
    },
    en: {
      title: "Odwrotna Mapa",
      search: "Search for a place…", button: "Search",
      styles: { default: "Default", satellite: "Satellite", inverted: "Inverted", custom: "Custom" },
      customMapColorsHeading: "Map colors",
      customUiColorsHeading: "Interface colors",
      customColorReset: "Reset colors, textures & font",
      customLabelsHeading: "Map labels",
      labelsPoi: "Points (shops, services)",
      labelsRoads: "Street names",
      labelsPlaces: "Places and districts",
      labelsWater: "Rivers and seas",
      labelsRegions: "Regions / provinces",
      labelsCountries: "Countries",
      labelsAirports: "Airports",
      labelsBoundaries: "Administrative boundaries",
      menuTradingSunday: "Trading Sunday (PL)",
      tradingSundayQuestion: "Is today a trading Sunday in Poland?",
      closeTradingSunday: "Close",
      yes: "YES",
      no: "NO",
      tradingSundayNotSunday: "Today isn't a Sunday.",
      labelsPanelTitle: "Labels",
      closeLabels: "Close labels",
      menuLabelsMenuLabel: "Labels",
      selectAllLabels: "Select all",
      deselectAllLabels: "Deselect all",
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
      customTexturesHeading: "Textures (image instead of color)",
      customTexturesHint: "JPG or PNG. Water, greenery and buildings will be tiled as a repeating pattern; map background and panel background will be scaled to fill the whole area.",
      backupFavoritesHint: "Adding to favorites requires being logged in to an account.",
      customFontHeading: "Font",
      customFontHint: "Applies to the interface text (menus, panels, cards) - it does not change the font of labels on the map itself.",
      customThemePresetsHeading: "Saved themes",
      customThemePresetsHint: "Save the current colors, font and textures under a name, so you can come back to them later.",
      customThemePresetNamePlaceholder: "Theme name",
      customThemePresetSave: "Save current",
      customThemePresetsEmpty: "You don't have any saved themes yet.",
      customThemePresetApply: "Load",
      customThemePresetDelete: "Delete",
      customFontDefault: "Default",
      customFontCustomOption: "Custom (upload a file)",
      customTextureLabels: {
        mapBackground: "Map background",
        mapWater: "Water",
        mapParks: "Greenery",
        mapBuildings: "Buildings",
        uiPanel: "Panel background"
      },
      locate: "My location", legend: "Legend", closeLegend: "Close legend",
      toggle3d: "3D view",
      measureDistance: "Measure distance",
      measureArea: "Measure area",
      measureAreaClear: "Clear area measurement",
      measureSwitchToArea: "Switch to area measurement",
      measureSwitchToDistance: "Switch to distance measurement",
      measureClear: "Clear measurement",
      zoomIn: "Zoom in",
      zoomOut: "Zoom out",
      backToMenu: "Back to menu",
      backToAccount: "Back to account",
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
      aboutIntro: "Odwrotna Mapa is an independent, privacy-focused map app built on OpenStreetMap. Flipping the map's orientation is just the start – the platform offers full freedom in 3D view, advanced search, route planning, integration with Mapillary street-level photos, and easy export of views to PNG files.",
      aboutIntroAlt: "No tracking, no ads, and 100% open source.",
      aboutData: "Map data",
      aboutStyle: "Map style",
      aboutEngine: "Engine",
      aboutContact: "Contact:",
      aboutDonateHeading: "Support the project",
      aboutGithubLabel: "Source code on GitHub",
      aboutDonateCoffee: "Buy Me a Coffee",
      aboutDonateBtc: "Bitcoin",
      aboutDonateBtcCopied: "Bitcoin address copied.",
      searching: "Searching…", noResults: "No place found.",
      searchError: "The place search failed.",
      locating: "Finding your location…",
      locationError: "Could not read your location.",
      gettingLocation: "Getting your location…",
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
      routeExportGpx: "Export",
      routeImportGpx: "Import",
      routeGpxExported: "Route exported as GPX.",
      routeGpxImported: "Route imported from GPX file.",
      routeGpxImportError: "Could not import GPX file.",
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
      routeSaveFavorite: "Save",
      routeSavedFavorite: "Saved",
      favoriteRemove: "Remove",
      sortAriaLabel: "Sort",
      sortNewest: "Newest first",
      sortOldest: "Oldest first",
      sortAZ: "A to Z",
      sortZA: "Z to A",
      routePickA: "Click the map to choose the starting point.",
      routePickB: "Click the map to choose the destination.",
      routePickMoveB: "Click the map to move the destination.",
      routeReverseError: "The selected place name could not be read.",
      locatingForRoute: "Getting your location…",
      locateError: "Your location could not be retrieved.",
      routeDirections: "Directions",
      routeSteps: "steps",
      routeArrival: "Arrival",
      routeShare: "Share",
      routeShared: "The route link was copied.",
      placeShared: "The place link was copied.",
      shareUnavailable: "Sharing requires an HTTPS connection.",
      routeShareError: "The route could not be shared.",
      routeWaypointNote: "Click the route line to add a waypoint. You can drag the point.",
      routeRoundaboutExit: exit => `At the roundabout, take exit ${exit}.`,
      routeWaypoint: number => `Waypoint ${number}`,
      routeAddWaypoint: "Add stop",
      routeWaypointStopPlaceholder: number => `Stop ${number}`,
      routeRemoveWaypoint: number => `Remove stop ${number}`,
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
        public: "Public",
        support: "Support"
      },
      discoverCategories: {
        pizza: "Pizza",
        cafe: "Cafés",
        restaurant: "Restaurants",
        bar: "Bars",
        fast_food: "Fast food",
        bakery: "Bakeries",
        confectionery: "Confectioneries",
        ice_cream: "Ice cream",
        hotel: "Hotels",
        campsite: "Campsites",
        fuel: "Fuel",
        museum: "Museums",
        art_gallery: "Art galleries",
        viewpoint: "Viewpoints",
        monument: "Monuments",
        bowling: "Bowling alleys",
        aquarium: "Aquariums",
        park: "Parks",
        spa: "Spas",
        tennis: "Tennis courts",
        amusement_park: "Amusement parks",
        pharmacy: "Pharmacies",
        drugstore: "Drugstores",
        hospital: "Hospitals",
        dentist: "Dentists",
        optician: "Opticians",
        massage: "Massage",
        vet: "Vets",
        bank: "Banks",
        post_office: "Post offices",
        parcel_locker: "Parcel lockers",
        hairdresser: "Hairdressers",
        currency_exchange: "Currency exchange",
        pawnbroker: "Pawnshops",
        notary: "Notaries",
        real_estate: "Real estate agencies",
        tailor: "Tailors",
        locksmith: "Locksmiths",
        car_wash: "Car washes",
        bottle_return: "Bottle return points",
        laundry: "Laundries",
        toilets: "Toilets",
        bus_stop: "Bus stops",
        railway_station: "Train stations",
        ev_charging: "EV charging",
        taxi: "Taxi ranks",
        airport: "Airports",
        car_rental: "Car rental",
        bicycle_rental: "Bike rental",
        parking: "Parking",
        car_repair: "Car repair",
        shop: "Shops",
        mall: "Shopping malls",
        clothes: "Clothing",
        shoe_shop: "Shoe shops",
        electronics: "Electronics",
        furniture: "Furniture",
        pet_shop: "Pet shops",
        florist: "Florists",
        jewelry: "Jewelry",
        sporting_goods: "Sporting goods",
        hardware_store: "Hardware stores",
        bicycle_shop: "Bike shops",
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
        kindergarten: "Kindergartens",
        university: "Universities",
        church: "Churches",
        police: "Police",
        fire_station: "Fire stations",
        town_hall: "Town halls",
        courthouse: "Courthouses",
        homeless_shelter: "Homeless shelters",
        soup_kitchen: "Soup kitchens",
        public_shower: "Public showers",
        drinking_water: "Drinking water",
        social_services: "Social services"
      },
      clearSearchHistory: "Clear history",
      menuTitle: "Menu",
      favoritesTitle: "Favorites",
      ratingStars: "stars",
      ratingLoading: "Loading ratings…",
      ratingNone: "No ratings yet - be the first",
      ratingError: "Couldn't load ratings.",
      ratingSaving: "Saving rating…",
      ratingDelete: "Delete rating",
      ratingLoginHint: "Log in (Account) to rate this place",
      activityLoading: "Loading…",
      activityLoginNeeded: "Log in to see your activity.",
      activityEmpty: "You haven't rated any places yet.",
      activityError: "Couldn't load your activity.",
      favoritesEmpty: "No favorites yet.",
      favoriteEdit: "Edit",
      favoriteEditTitle: "Edit place",
      placeRename: "Rename place",
      favoriteCustomNameLabel: "Custom name",
      favoriteCustomNamePlaceholder: "e.g. Favorite cafe",
      favoriteNoteLabel: "Note",
      favoriteNotePlaceholder: "e.g. open until 10pm, entrance from the yard",
      favoriteSave: "Save",
      favoriteCancelEdit: "Cancel",
      favoriteFolderLabel: "Folder",
      favoriteFolderAll: "All",
      favoriteFolderUnfiled: "No folder",
      favoriteFolderDelete: "Delete folder",
      favoriteFolderAddButton: "+ Folder",
      favoriteFolderNamePlaceholder: "Folder name",
      favoritesSearch: "Search favorites…",
      favoritesCountLabel: "saved",
      menuExportAll: "Export JSON",
      menuImportAll: "Import JSON",
      backupSelectAll: "Select all",
      backupDeselectAll: "Deselect all",
      backupScopeFavorites: "Favorite places",
      backupScopeColors: "Colors, textures & fonts",
      backupScopePlaceNames: "Custom place names",
      colorsImported: "Colors imported.",
      placeNamesImported: "Place names imported.",
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
      menuStreetview: "Street view",
      streetviewTitle: "Street view",
      streetviewUnavailable: "Street view is not configured yet.",
      menuBackup: "Backup",
      accountMenuLabel: "Account & sync",
      accountTitle: "Account & sync",
      accountBackAria: "Back to menu",
      accountCloseAria: "Close Account",
      accountSheetHandleAria: "Resize the account panel",
      accountIntro: "Sync your favorites, theme and other settings between devices using a passphrase (16 words) - no manual JSON export/import needed.",
      accountGotoLogin: "Log in",
      accountGotoRegister: "Create new account",
      accountBack: "← Back",
      accountLoginHeading: "Log in with your phrase",
      accountSeedInputPlaceholder: "type or paste your 16 words separated by spaces",
      accountLoginButton: "Log in",
      accountRegisterWarning: "Save these 16 words somewhere safe (e.g. on paper), in this exact order. This is the only password for this account - without it, no one, including us, can recover your settings.",
      accountSeedCopy: "Copy phrase",
      accountSeedConfirmLabel: "I've saved the phrase somewhere safe",
      accountSeedConfirmButton: "Save and activate account",
      accountAvatarAria: "Change profile picture",
      accountNoName: "No name",
      accountNameInputPlaceholder: "Your name",
      accountNameSave: "Save",
      accountNameCancel: "Cancel",
      accountPublicIdTitle: "Click to copy",
      accountAutoSyncLabel: "Sync automatically in the background",
      accountScopeColors: "Theme, colors and language",
      accountScopePlaceNames: "Custom place names",
      accountScopeHistory: "Browsing history",
      accountPush: "⬆ Send selected",
      accountPull: "⬇ Pull selected",
      accountLogout: "Log out",
      accountActivity: "Activity",
      activityRefresh: "Refresh",
      syncRefresh: "Refresh sync",
      accountRevealSummary: "Show seed phrase",
      accountActivated: "Account activated on this device.",
      accountLoggedInPulling: "Logged in - fetching your saved settings from the cloud…",
      accountLoggedInApplied: "Logged in and fetched your saved settings from the cloud.",
      accountLoggedInNothingFound: "Logged in. No saved settings found in the cloud for this phrase yet - that's normal on the first sync.",
      accountLoggedInPullFailed: "Logged in, but the automatic fetch failed. Try \"Pull selected\" manually.",
      accountSeedTooShort: "The phrase is too short - you need at least 12 words.",
      accountSeedUnknownWord: "Unrecognized word in the phrase: “{word}”. Check the spelling.",
      accountNoScopesPush: "Select at least one category to send.",
      accountNoScopesPull: "Select at least one category to pull.",
      accountSending: "Sending to public relays…",
      accountSentResult: "Sent (confirmed by {ok}/{total} relays).",
      accountSentWithSkips: " Note: failed to send: {items} - probably too large for the public relay limits.",
      accountSendFailed: "Couldn't send the data. Check your connection and try again.",
      accountReceiving: "Fetching from public relays…",
      accountNothingFoundOnRelays: "No data found on the relays for this phrase yet.",
      accountReceived: "Fetched and applied the selected settings.",
      accountReceiveFailed: "Couldn't fetch or decrypt the data. Check the phrase and your connection.",
      accountCopiedPhrase: "Phrase copied to clipboard.",
      accountCopyPhraseFailed: "Couldn't copy - select and copy the words manually.",
      accountCopiedId: "Identifier copied.",
      accountCopyIdFailed: "Couldn't copy the identifier.",
      accountAvatarLoadFailed: "Couldn't load the picture.",
      accountProfileSaving: "Saving profile…",
      accountProfileSaved: "Profile saved.",
      accountProfileSaveFailed: "Saved locally, but couldn't send the profile to the relays.",
      accountStatusActive: "Account active. Last synced: {time}.",
      accountStatusActiveNever: "Account active. Not synced yet on this device.",
      accountStatusSkippedWarning: " ⚠️ Failed to send: {items} (probably too large for relay limits - this also applies to automatic background sync).",
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
      exportPng: "Save as PNG",
      exportPngWorking: "Preparing the map image…",
      exportPngDone: "Map image saved.",
      exportPngError: "Could not save the map image.",
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
      tripTitle: "Trip",
      tripLoading: "Loading stops…",
      tripEmpty: "No stop information available for this trip.",
      tripError: "Could not load trip details.",
      tripCurrentStop: "You are here",
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

  // ---------------------------------------------------------------------
  // Tekstury (zdjęcia zamiast koloru) dla motywu "custom".
  //
  // Warstwy mapy (MapLibre GL, wektorowe kafelki) nie pozwalają po prostu
  // "wkleić zdjęcia" jako wypełnienia - trzeba zarejestrować obraz przez
  // map.addImage() i użyć fill-pattern/background-pattern zamiast
  // fill-color/background-color. Taki wzór jest kafelkowany (powtarzany),
  // więc nadaje się do tekstur wody/zieleni/budynków/tła mapy, ale nie do
  // wklejenia jednego dużego, nie powtarzalnego zdjęcia na całą mapę.
  //
  // Tło paneli UI to zwykły CSS, więc tam obraz jest dopasowywany przez
  // background-size: cover (patrz applyUiPanelTexture / style.css).
  // ---------------------------------------------------------------------

  const MAP_TEXTURE_KEYS = ["mapBackground", "mapWater", "mapParks", "mapBuildings"];
  const TEXTURE_FIELDS = [...MAP_TEXTURE_KEYS, "uiPanel"];
  const TEXTURE_MAX_DIMENSION = 1024;


  // ---------------------------------------------------------------------
  // Czcionka interfejsu (motyw "custom"). Dwie ścieżki:
  //  - "google": jedna z kilkunastu wybranych czcionek z Google Fonts,
  //    doczytywana leniwie przez wstrzyknięty <link> (tak jak domyślna
  //    "Plus Jakarta Sans" jest już wczytywana w index.html).
  //  - "custom": własny plik WOFF/WOFF2/TTF/OTF wgrany przez użytkownika,
  //    zarejestrowany jako @font-face. Sam plik (może być spory) trzymamy
  //    w IndexedDB, a w localStorage tylko informację "jaki typ czcionki
  //    jest aktywny" - tak samo jak przy teksturach.
  //
  // Dotyczy WYŁĄCZNIE tekstu interfejsu (--font). Etykiety na samej mapie
  // renderuje MapLibre z glifów wbudowanych w kafelki wektorowe stylu
  // OpenFreeMap Liberty i nie da się ich podmienić z poziomu przeglądarki.
  // ---------------------------------------------------------------------

  const CUSTOM_FONT_FAMILY = "OdwrotnaMapaCustomFont";
  const SYSTEM_FONT_FALLBACK =
    '"Plus Jakarta Sans", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const CUSTOM_FONT_MAX_BYTES = 5 * 1024 * 1024;

  const GOOGLE_FONT_OPTIONS = [
    "Inter",
    "IBM Plex Sans",
    "Space Grotesk",
    "Poppins",
    "Comfortaa",
    "Fraunces",
    "Playfair Display",
    "Merriweather",
    "JetBrains Mono",
    "Bebas Neue"
  ];

  let customFontStyleEl = null;

  function registerCustomFontFace(dataUrl) {
    if (!customFontStyleEl) {
      customFontStyleEl = document.createElement("style");
      customFontStyleEl.id = "odwrotnamapa-custom-font-face";
      document.head.appendChild(customFontStyleEl);
    }
    customFontStyleEl.textContent =
      `@font-face { font-family: "${CUSTOM_FONT_FAMILY}"; src: url(${dataUrl}); font-display: swap; }`;
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error || new Error("Błąd odczytu pliku"));
      reader.readAsDataURL(file);
    });
  }

  function readCustomFont() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.customFont) || "null"
      );
      if (stored && typeof stored === "object" && stored.type) return stored;
    } catch (_) {}
    return { type: "default" };
  }

  function saveCustomFont() {
    safeSet(CONFIG.storageKeys.customFont, JSON.stringify(state.customFont));
  }


  // Wczytuje wybór czcionki po starcie (plik czcionki z IndexedDB, jeśli
  // trzeba) i go stosuje. Wołane raz, obok initCustomTextures().
  async function initCustomFont() {
    if (state.customFont.type === "custom") {
      state.customFontDataUrl = await window.OMAP_TEXTURE_STORAGE?.idbGetCustomFont();
      if (!state.customFontDataUrl) {
        // Brak pliku w tej przeglądarce (np. inne urządzenie) - wróć do domyślnej.
        state.customFont = { type: "default" };
        saveCustomFont();
      }
    }
    applyCustomFont();
  }

  function applyCustomFont() {
    const root = document.documentElement.style;
    const font = state.customFont;

    if (state.theme !== "custom" || !font || font.type === "default") {
      root.removeProperty("--font");
      return;
    }

    if (font.type === "google" && font.googleFont) {
      // Google Fonts support removed
      root.removeProperty("--font");
      return;
    }

    if (font.type === "custom" && state.customFontDataUrl) {
      registerCustomFontFace(state.customFontDataUrl);
      root.setProperty("--font", `"${CUSTOM_FONT_FAMILY}", ${SYSTEM_FONT_FALLBACK}`);
      return;
    }

    root.removeProperty("--font");
  }

  // Zmniejsza wgrany JPG/PNG do rozsądnego rozmiaru (wzory kafelkowane na
  // mapie i tak są powtarzane, więc olbrzymie zdjęcie tylko spowalniałoby
  // renderowanie i zajmowało miejsce w IndexedDB).
  function resizeImageToDataUrl(file, maxDimension = TEXTURE_MAX_DIMENSION, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error("Błąd odczytu pliku"));
      reader.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error("Nieprawidłowy plik graficzny"));
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDimension || height > maxDimension) {
            const scale = maxDimension / Math.max(width, height);
            width = Math.max(1, Math.round(width * scale));
            height = Math.max(1, Math.round(height * scale));
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
          try {
            resolve(canvas.toDataURL(mime, quality));
          } catch (error) {
            reject(error);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function loadHtmlImage(dataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Nie udało się wczytać obrazu tekstury"));
      img.src = dataUrl;
    });
  }

  // Rejestruje obraz w MapLibre pod stałym id, żeby warstwy mogły się do
  // niego odwoływać przez fill-pattern / background-pattern.
  async function registerTextureImage(key, dataUrl) {
    if (!map || !dataUrl) return;
    const imageId = window.OMAP_TEXTURE_STORAGE?.textureImageId(key);
    try {
      const img = await loadHtmlImage(dataUrl);
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      // WebGL i canvas mają odwrócone układy współrzędnych w pionie
      // (WebGL czyta teksturę od dołu, canvas rysuje od góry), przez co
      // obrazy dodane do MapLibre jako fill-pattern/background-pattern
      // renderują się "do góry nogami". Odwracamy obraz przed
      // zarejestrowaniem, żeby na mapie wyglądał tak jak w oryginalnym
      // pliku.
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      // MapLibre nie tylko odwraca teksturę w pionie, ale w praktyce
      // renderuje ją obróconą o 180 stopni (pion + poziom), dlatego
      // kompensujemy oba kierunki naraz zamiast samego pionu.
      ctx.translate(width, height);
      ctx.scale(-1, -1);
      ctx.drawImage(img, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);

      if (map.hasImage(imageId)) map.removeImage(imageId);
      map.addImage(imageId, imageData);
    } catch (error) {
      console.error("Nie udało się zarejestrować tekstury mapy:", error);
    }
  }

  function unregisterTextureImage(key) {
    if (!map) return;
    const imageId = window.OMAP_TEXTURE_STORAGE?.textureImageId(key);
    try {
      if (map.hasImage(imageId)) map.removeImage(imageId);
    } catch (_) {}
  }

  // Wczytuje wszystkie zapisane tekstury z IndexedDB i rejestruje w mapie
  // te, które dotyczą warstw mapy (nie UI). Wołane raz, po starcie mapy.
  async function initCustomTextures() {
    state.customTextures = await window.OMAP_TEXTURE_STORAGE?.idbGetAllTextures();
    for (const key of MAP_TEXTURE_KEYS) {
      if (state.customTextures[key]) {
        await registerTextureImage(key, state.customTextures[key]);
      }
    }
  }

  // Jeśli dla danego klucza palety istnieje tekstura, podpina ją pod
  // warstwę zamiast koloru. Zwraca true, jeśli tekstura została użyta.
  function applyTextureIfPresent(layer, paletteKey, paintProperty) {
    if (!MAP_TEXTURE_KEYS.includes(paletteKey)) return false;
    const dataUrl = state.customTextures?.[paletteKey];
    if (!dataUrl) return false;

    const imageId = window.OMAP_TEXTURE_STORAGE?.textureImageId(paletteKey);
    if (!map.hasImage(imageId)) return false;

    try {
      map.setPaintProperty(layer.id, paintProperty, imageId);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Tło paneli UI to zwykły CSS (--panel-image, patrz style.css), a nie
  // warstwa MapLibre, więc obsługujemy je osobno od tekstur mapy.
  function applyUiPanelTexture() {
    const root = document.documentElement.style;
    const dataUrl = state.customTextures?.uiPanel;
    if (state.theme === "custom" && dataUrl) {
      root.setProperty("--panel-image", `url(${dataUrl})`);
    } else {
      root.removeProperty("--panel-image");
    }
  }



  function detectPreferredLanguage() {
    const browserLanguages = [
      navigator.language,
      ...(navigator.languages || [])
    ].filter(Boolean);

    const isPolish = browserLanguages.some(lang =>
      String(lang).toLowerCase().startsWith("pl")
    );

    return isPolish ? "pl" : "en";
  }

  // Wypełniane przez initializeAutocomplete(); pozwala podpiąć podpowiedzi
  // wyszukiwania do dynamicznie tworzonych pól przystanków trasy.
  let registerRouteWaypointAutocomplete = null;

  // Minimalny, bardzo wczesny configure() - readFavorites/
  // readFavoriteFolders są wołane TUTAJ, wewnątrz konstrukcji
  // samego obiektu state (linia niżej), więc jeszcze przed
  // pełnym configure() w skonsolidowanym bloku (state/el/text
  // nie istnieją jeszcze w tym momencie - tylko CONFIG jest już
  // gotowe). Pełny configure() z resztą zależności następuje
  // normalnie, dalej w pliku, przed pierwszym updateUI().
  window.OMAP_FAVORITES?.configure({ CONFIG });
  window.OMAP_ROUTE_HISTORY?.configure({ CONFIG });
  window.OMAP_CUSTOM_PLACE_NAMES?.configure({ CONFIG });
  window.OMAP_HISTORY?.configure({ CONFIG });
  window.OMAP_CUSTOM_THEME_EDITOR?.configure({ CONFIG, DEFAULT_CUSTOM_PALETTE });

  const state = {
    language: ["pl", "en"].includes(safeGet(CONFIG.storageKeys.language, ""))
      ? safeGet(CONFIG.storageKeys.language, "")
      : detectPreferredLanguage(),
    theme: (() => {
      const stored = safeGet(CONFIG.storageKeys.theme, "default");
      if (stored === "light" || stored === "dark") return "default";
      return ["default", "satellite", "inverted", "custom"].includes(stored)
        ? stored
        : "default";
    })(),
    customPalette: window.OMAP_CUSTOM_THEME_EDITOR?.readCustomPalette(),
    customFont: readCustomFont(),
    // Sam plik czcionki (jeśli type === "custom") wczytywany asynchronicznie
    // z IndexedDB przez initCustomFont() po starcie.
    customFontDataUrl: null,
    customPlaceNames: window.OMAP_CUSTOM_PLACE_NAMES?.readCustomPlaceNames(),
    // Wypełniane asynchronicznie przez initCustomTextures() po starcie mapy
    // (dane obrazów trzymamy w IndexedDB, nie w localStorage - mogą być
    // zbyt duże). Klucze pokrywają się z CUSTOM_PALETTE_FIELDS, które mają
    // sens jako tekstura: mapBackground, mapWater, mapParks, mapBuildings,
    // uiPanel.
    customTextures: {},
    labelVisibility: window.OMAP_LABEL_VISIBILITY?.readLabelVisibility(),
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
    routeWaypointSeq: 0,
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
    favorites: window.OMAP_FAVORITES?.readFavorites(),
    favoriteFolders: window.OMAP_FAVORITES?.readFavoriteFolders(),
    activeFavoriteFolder: "",
    activeRouteFolder: "",
    favoritesSortOrder: "newest",
    routeFavoritesSortOrder: "newest",
    tripOriginStack: [],
    tripContextStack: [],
    history: window.OMAP_HISTORY?.readHistory(),
    routeHistory: window.OMAP_ROUTE_HISTORY?.readRouteHistory(),
    routeFavorites: window.OMAP_ROUTE_HISTORY?.readRouteFavorites(),
    activeFavoritesTab: "places",
    activeHistoryTab: "places"
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
    labelsPanel: $("labels-panel"),
    labelsSheetHandle: $("labels-sheet-handle"),
    labelsClose: $("labels-close"),
    labelsBack: $("labels-back"),
    labelsTitle: $("labels-title"),
    menuLabelsButton: $("menu-labels-button"),
    menuLabelsMenuLabel: $("menu-labels-menu-label"),
    labelsToggleAll: $("labels-toggle-all"),
    labelsToggleAllLabel: $("labels-toggle-all-label"),
    tradingSundayPanel: $("trading-sunday-panel"),
    tradingSundaySheetHandle: $("trading-sunday-sheet-handle"),
    tradingSundayClose: $("trading-sunday-close"),
    tradingSundayBack: $("trading-sunday-back"),
    tradingSundayTitle: $("trading-sunday-title"),
    menuTradingSundayButton: $("menu-trading-sunday-button"),
    menuTradingSundayLabel: $("menu-trading-sunday-label"),
    tradingSundayQuestion: $("trading-sunday-question"),
    tradingSundayAnswer: $("trading-sunday-answer"),
    tradingSundayNote: $("trading-sunday-note"),
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
    tripPanel: $("trip-panel"),
    tripSheetHandle: $("trip-sheet-handle"),
    tripPanelTitle: $("trip-panel-title"),
    tripPanelBack: $("trip-panel-back"),
    tripPanelClose: $("trip-panel-close"),
    tripStatus: $("trip-status"),
    tripStopsList: $("trip-stops-list"),
    streetviewPanel: $("streetview-panel"),
    streetviewPanelTitle: $("streetview-panel-title"),
    streetviewSheetHandle: $("streetview-sheet-handle"),
    streetviewPanelClose: $("streetview-panel-close"),
    streetviewFullscreenButton: $("streetview-fullscreen-button"),
    streetviewContainer: $("streetview-container"),
    menuStreetviewButton: $("streetview-toggle-button"),
    favoritesCount: $("favorites-count"),
    favoritesOpenButton: $("favorites-open-button"),
    favoritesMenuLabel: $("favorites-menu-label"),
    favoritesPanel: $("favorites-panel"),
    favoritesSheetHandle: $("favorites-sheet-handle"),
    favoritesClose: $("favorites-close"),
    favoritesBack: $("favorites-back"),
    favoritesTitle: $("favorites-title"),
    favoritesSearch: $("favorites-search"),
    favoritesSortSelect: $("favorites-sort-select"),
    favoritesCountLabel: $("favorites-count-label"),
    favoritesFolderChips: $("favorites-folder-chips"),
    favoritesAddFolderButton: $("favorites-add-folder-button"),
    favoritesNewFolderForm: $("favorites-new-folder-form"),
    favoritesNewFolderInput: $("favorites-new-folder-input"),
    favoritesNewFolderSave: $("favorites-new-folder-save"),
    favoritesNewFolderCancel: $("favorites-new-folder-cancel"),
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
    routeSaveFavoriteButton: $("route-save-favorite"),
    locateToggleButton: $("locate-toggle-button"),
    toggle3dButton: $("toggle-3d-button"),
    zoomInButton: $("zoom-in-button"),
    zoomOutButton: $("zoom-out-button"),
    measureToggleButton: $("measure-toggle-button"),
    measureDistanceBadge: $("measure-distance-badge"),
    measureDistanceValue: $("measure-distance-value"),
    measureClearButton: $("measure-clear-button"),
    measureModeSwitchButton: $("measure-mode-switch-button"),
    menuThemeSelect: $("menu-theme-select"),
    menuCustomPalette: $("menu-custom-palette"),
    customMapHeading: $("menu-custom-map-heading"),
    customUiHeading: $("menu-custom-ui-heading"),
    customTexturesHeading: $("menu-custom-textures-heading"),
    customTexturesHint: $("menu-custom-textures-hint"),
    backupFavoritesHint: $("menu-backup-scope-favorites-hint"),
    customFontHeading: $("menu-custom-font-heading"),
    customFontHint: $("menu-custom-font-hint"),
    customThemePresetsHeading: $("menu-custom-presets-heading"),
    customThemePresetsHint: $("menu-custom-presets-hint"),
    customFontSelect: $("custom-font-select"),
    customFontUploadRow: $("custom-font-upload-row"),
    customFontFile: $("custom-font-file"),
    customFontFileClear: $("custom-font-file-clear"),
    customThemePresetNameInput: $("custom-theme-preset-name-input"),
    customThemePresetSaveButton: $("custom-theme-preset-save-button"),
    customThemePresetList: $("custom-theme-preset-list"),
    customPaletteReset: $("custom-palette-reset"),
    labelsPoiToggle: $("menu-labels-poi"),
    labelsPoiToggleLabel: $("menu-labels-poi-label"),
    labelsRoadsToggle: $("menu-labels-roads"),
    labelsRoadsToggleLabel: $("menu-labels-roads-label"),
    labelsPlacesToggle: $("menu-labels-places"),
    labelsPlacesToggleLabel: $("menu-labels-places-label"),
    labelsWaterToggle: $("menu-labels-water"),
    labelsWaterToggleLabel: $("menu-labels-water-label"),
    labelsRegionsToggle: $("menu-labels-regions"),
    labelsRegionsToggleLabel: $("menu-labels-regions-label"),
    labelsCountriesToggle: $("menu-labels-countries"),
    labelsCountriesToggleLabel: $("menu-labels-countries-label"),
    labelsAirportsToggle: $("menu-labels-airports"),
    labelsAirportsToggleLabel: $("menu-labels-airports-label"),
    labelsBoundariesToggle: $("menu-labels-boundaries"),
    labelsBoundariesToggleLabel: $("menu-labels-boundaries-label"),
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
    backupScopePlaceNames: $("menu-backup-scope-place-names"),
    backupScopePlaceNamesLabel: $("menu-backup-scope-place-names-label"),
    menuThemeLabel: $("menu-theme-label"),
    menuLanguageSelect: $("menu-language-select"),
    menuLegendButton: $("menu-legend-button"),
    menuLegendLabel: $("menu-legend-label"),
    brandButton: $("brand-button"),
    mapContextMenu: $("map-context-menu"),
    clearMapButton: $("clear-map-button"),
    exportPngButton: $("export-png-button"),
    menuAboutButton: $("menu-about-button"),
    menuLanguageLabel: $("menu-language-label"),
    clearMapLabel: $("clear-map-label"),
    exportPngLabel: $("export-png-label"),
    menuAboutLabel: $("menu-about-label"),
    aboutButton: $("about-button"),
    aboutPanel: $("about-panel"),
    aboutSheetHandle: $("about-sheet-handle"),
    aboutClose: $("about-close"),
    aboutBack: $("about-back"),
    menuBackupButton: $("menu-backup-button"),
    menuBackupLabel: $("menu-backup-label"),
    menuAccountButton: $("menu-account-button"),
    menuAccountLabel: $("menu-account-label"),
    accountPanel: $("account-panel"),
    accountTitle: $("account-title"),
    accountBack: $("account-back"),
    accountClose: $("account-close"),
    accountMessage: $("account-message"),
    accountScreenHome: $("account-screen-home"),
    accountIntroText: $("account-intro-text"),
    accountGotoLoginButton: $("account-goto-login-button"),
    accountGotoRegisterButton: $("account-goto-register-button"),
    accountScreenLogin: $("account-screen-login"),
    accountLoginBackButton: $("account-login-back-button"),
    accountLoginHeading: $("account-login-heading"),
    accountSeedInput: $("account-seed-input"),
    accountLoginButton: $("account-login-button"),
    accountScreenRegister: $("account-screen-register"),
    accountRegisterBackButton: $("account-register-back-button"),
    accountRegisterWarning: $("account-register-warning"),
    accountSeedWords: $("account-seed-words"),
    accountSeedCopyButton: $("account-seed-copy-button"),
    accountSeedConfirmCheckbox: $("account-seed-confirm-checkbox"),
    accountSeedConfirmLabel: $("account-seed-confirm-label"),
    accountSeedConfirmButton: $("account-seed-confirm-button"),
    accountScreenLoggedIn: $("account-screen-loggedin"),
    accountAvatarButton: $("account-avatar-button"),
    accountAvatarPreview: $("account-avatar-preview"),
    accountAvatarPlaceholder: $("account-avatar-placeholder"),
    accountDisplayNameButton: $("account-display-name-button"),
    accountDisplayName: $("account-display-name"),
    accountPublicId: $("account-public-id"),
    accountNameEditForm: $("account-name-edit-form"),
    accountProfileNameInput: $("account-profile-name-input"),
    accountProfileAvatarInput: $("account-profile-avatar-input"),
    accountNameSaveButton: $("account-name-save-button"),
    accountNameCancelButton: $("account-name-cancel-button"),
    accountStatusText: $("account-status-text"),
    accountAutoSyncCheckbox: $("account-auto-sync-checkbox"),
    accountAutoSyncLabel: $("account-auto-sync-label"),
    accountSyncScopeColors: $("account-sync-scope-colors"),
    accountScopeColorsLabel: $("account-scope-colors-label"),
    accountSyncScopePlaceNames: $("account-sync-scope-place-names"),
    accountScopePlaceNamesLabel: $("account-scope-placenames-label"),
    accountSyncScopeHistory: $("account-sync-scope-history"),
    accountScopeHistoryLabel: $("account-scope-history-label"),
    accountPushButton: $("account-push-button"),
    accountPullButton: $("account-pull-button"),
    accountSyncRefreshButton: $("account-sync-refresh-button"),
    accountLogoutButton: $("account-logout-button"),
    accountActivityButton: $("account-activity-button"),
    accountScreenActivity: $("account-screen-activity"),
    accountActivityRefreshButton: $("account-activity-refresh-button"),
    accountActivityStatus: $("account-activity-status"),
    accountActivityList: $("account-activity-list"),
    accountRevealDetails: $("account-reveal-details"),
    accountRevealSummary: $("account-reveal-summary"),
    accountSeedRevealWords: $("account-seed-reveal-words"),
    accountSeedRevealCopyButton: $("account-seed-reveal-copy-button"),
    backupPanel: $("backup-panel"),
    backupSheetHandle: $("backup-sheet-handle"),
    accountSheetHandle: $("account-sheet-handle"),
    backupClose: $("backup-close"),
    backupBack: $("backup-back"),
    aboutTitle: $("about-title"),
    backupTitle: $("backup-title"),
    aboutIntro: $("about-intro"),
    aboutIntroAlt: $("about-intro-alt"),
    aboutDataLabel: $("about-data-label"),
    aboutStyleLabel: $("about-style-label"),
    aboutEngineLabel: $("about-engine-label"),
    aboutContactLabel: $("about-contact-label"),
    aboutGithubLabel: $("about-github-label"),
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
    routeFromClear: $("route-from-clear"),
    routeToClear: $("route-to-clear"),
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
    routeExportGpx: $("route-export-gpx"),
    routeImportGpx: $("route-import-gpx"),
    routeImportGpxInput: $("route-import-gpx-input"),
    routeWaypointNote: $("route-waypoint-note"),
    routeWaypointsList: $("route-waypoints-list"),
    routeAddWaypoint: $("route-add-waypoint"),
    routeAddWaypointLabel: $("route-add-waypoint-label"),
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
      minZoom: CONFIG.map.minZoom,
      preserveDrawingBuffer: true
    });

    const logoIcon = document.querySelector('.brand-logo');

    function updateLogoRotation() {
    if (!logoIcon) return;
    const currentBearing = map.getBearing(); 
    logoIcon.style.transform = `rotate(${-currentBearing + 180}deg)`;
}

map.on('rotate', updateLogoRotation);

    window.__omapMap = map;
  } catch (error) {
    fatal(error.message);
    return;
  }

  map.addControl(new maplibregl.NavigationControl({
    showCompass: false,
    showZoom: true
  }), "bottom-right");

  map.dragRotate.enable();
  map.touchZoomRotate.enableRotation();
  map.addControl(new maplibregl.ScaleControl({ unit: "metric" }), "bottom-left");

  map.on("error", event => {
    console.error("MapLibre:", event.error || event);
  });

  map.on("load", async () => {
    ensureSatellite();
    window.OMAP_ROUTE?.ensureRouteLayers();
    cacheOriginalPaint();
    await initCustomTextures();
    await initCustomFont();
    applyTheme(state.theme);
    applyLanguageAfterStartup();
    window.OMAP_ROUTE?.loadSharedRouteFromUrl();
    loadSharedPlaceFromUrl();
    window.OMAP_GEOURI?.initialize();
    hideDefibrillatorPois();
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

  // Musi być wywołane PRZED pierwszym updateUI() poniżej (i przed
  // czymkolwiek innym co mogłoby wołać w te moduły) - inaczej
  // funkcje modułów widzą ctx === null i wywalają się przy pierwszym
  // użyciu. Wcześniej te wywołania siedziały dużo dalej w pliku,
  // już PO pierwszym updateUI() - stąd crash "Cannot read properties
  // of null (reading 'el')" w środku measure-service.js.
  window.OMAP_ACCOUNT?.configure({
    state,
    el,
    CONFIG,
    text,
    DEFAULT_CUSTOM_PALETTE,
    MAP_TEXTURE_KEYS,
    TEXTURE_FIELDS,
    HISTORY_LIMIT,
    ROUTE_HISTORY_LIMIT,
    applyLanguage,
    applyTheme,
    closeOtherMobilePanels,
    openMenuHome,
    openMobilePanelStandard,
    registerTextureImage,
    unregisterTextureImage,
    safeGet,
    safeSet,
    updateUI,
    loadMyRatingsActivity
  });
  window.OMAP_CUSTOM_THEME_EDITOR?.configure({
    state,
    el,
    CONFIG,
    text,
    DEFAULT_CUSTOM_PALETTE,
    CUSTOM_FONT_MAX_BYTES,
    MAP_TEXTURE_KEYS,
    TEXTURE_FIELDS,
    $,
    applyCustomFont,
    applyTheme,
    readFileAsDataUrl,
    registerTextureImage,
    resizeImageToDataUrl,
    saveCustomFont,
    unregisterTextureImage,
    safeSet
  });
  window.OMAP_ROUTE?.configure({
    state,
    el,
    map,
    CONFIG,
    text,
    show,
    hide,
    // registerRouteWaypointAutocomplete jest zmienną `let`, którą
    // initializeAutocomplete() ustawia dopiero PÓŹNIEJ (dużo dalej
    // w pliku) - przekazanie samej WARTOŚCI teraz przekazałoby
    // wciąż `null`. Owinięcie w funkcję sprawia, że każde wywołanie
    // ctx.registerRouteWaypointAutocomplete(...) odczytuje AKTUALNĄ
    // wartość zmiennej w momencie wywołania, nie w momencie configure().
    registerRouteWaypointAutocomplete: (...args) => registerRouteWaypointAutocomplete?.(...args),
    calculateRouteFromStoredPoints,
    closeMapContextMenu,
    closeOtherMobilePanels,
    closePlacePopup,
    collapseMobilePanel,
    dismissMobileKeyboard,
    fetchLocationByIp,
    findPlacesWithFallback,
    formatCoordinates,
    getAccentColor,
    getPreferredPlaceLabel,
    hideAllAutocomplete,
    isElectronPlatform,
    isLocalOrNativeOrigin,
    openMobilePanelStandard,
    pointFromPlace,
    updateRouteClickHint
  });
  window.OMAP_LABEL_VISIBILITY?.configure({
    state,
    el,
    map,
    text,
    safeSet
  });
  window.OMAP_SEARCH_HISTORY?.configure({
    CONFIG,
    normalizeSearchText
  });
  window.OMAP_HISTORY?.configure({
    state,
    el,
    CONFIG,
    text,
    ROUTE_MODE_ICONS,
    filterRouteEntries,
    formatRouteSummaryShort,
    loadRouteFromEntry,
    normalizeSearchText,
    safeSet
  });
  window.OMAP_SEED_WORDS?.configure({
    CONFIG,
    safeSet,
    showAccountMessage: window.OMAP_ACCOUNT?.showAccountMessage
  });
  window.OMAP_RATINGS?.configure({
    state,
    text,
    getStoredSeedWords: window.OMAP_SEED_WORDS?.getStoredSeedWords,
    openAccountFromMenu: window.OMAP_ACCOUNT?.openAccountFromMenu
  });
  window.OMAP_CUSTOM_PLACE_NAMES?.configure({
    state,
    CONFIG,
    safeSet
  });
  window.OMAP_ROUTE_HISTORY?.configure({
    state,
    el,
    CONFIG,
    ROUTE_HISTORY_LIMIT,
    renderHistoryList: window.OMAP_HISTORY?.renderHistoryList,
    safeSet
  });
  window.OMAP_FAVORITES?.configure({
    state,
    el,
    CONFIG,
    text,
    UNFILED_FOLDER,
    ROUTE_MODE_ICONS,
    cacheWikipediaForFavorite,
    closeMapContextMenu,
    closeOtherMobilePanels,
    fetchPlaceInformation,
    filterRouteEntries,
    formatRouteSummaryShort,
    getPlaceAddress,
    getPlaceNameKey,
    getPlaceTitle,
    loadRouteFromEntry,
    normalizeSearchText,
    openMobilePanelStandard,
    safeSet,
    saveRouteFavorites: window.OMAP_ROUTE_HISTORY?.saveRouteFavorites,
    show,
    sortByOrder,
    updateRouteSaveFavoriteButton: window.OMAP_ROUTE?.updateRouteSaveFavoriteButton
  });
  window.OMAP_BOTTOM_SHEET?.configure({
    MOBILE_PANEL_STANDARD,
    openMobilePanelStandard,
    collapseMobilePanelStandard,
    getMobilePanelDefaultHeight,
    getMobilePanelMaximumHeight,
    isMobilePanelViewport,
    setMobilePanelHeight
  });
  window.OMAP_BACKUP?.configure({
    state,
    text,
    show,
    DEFAULT_CUSTOM_PALETTE,
    MAP_TEXTURE_KEYS,
    TEXTURE_FIELDS,
    getCheckedBackupScopes,
    idbSetCustomFont: window.OMAP_TEXTURE_STORAGE?.idbSetCustomFont,
    idbSetTexture: window.OMAP_TEXTURE_STORAGE?.idbSetTexture,
    registerTextureImage,
    renderFavoritesList: window.OMAP_FAVORITES?.renderFavoritesList,
    renderFolderChips: window.OMAP_FAVORITES?.renderFolderChips,
    saveCustomFont,
    saveCustomPalette: window.OMAP_CUSTOM_THEME_EDITOR?.saveCustomPalette,
    saveCustomPlaceNames: window.OMAP_CUSTOM_PLACE_NAMES?.saveCustomPlaceNames,
    saveFavoriteFolders: window.OMAP_FAVORITES?.saveFavoriteFolders,
    saveFavorites: window.OMAP_FAVORITES?.saveFavorites,
    saveRouteFavorites: window.OMAP_ROUTE_HISTORY?.saveRouteFavorites,
    syncCustomFontSelect: window.OMAP_CUSTOM_THEME_EDITOR?.syncCustomFontSelect,
    syncCustomPaletteInputs: window.OMAP_CUSTOM_THEME_EDITOR?.syncCustomPaletteInputs,
    applyTheme
  });
  window.OMAP_GEOURI?.configure({
    map,
    parseSharedPoint: window.OMAP_ROUTE?.parseSharedPoint,
    showPlaceInformation
  });
  window.OMAP_TRADING_SUNDAY?.configure({
    state,
    el,
    text,
    closeOtherMobilePanels,
    openMobilePanelStandard,
    openMenuHome
  });
  window.OMAP_MAPVIEW?.configure({
    state,
    el,
    map,
    text,
    closeMapContextMenu,
    closeOtherMobilePanels,
    clearRoute: window.OMAP_ROUTE?.clearRoute,
    fetchLocationByIp,
    hideAllAutocomplete,
    isElectronPlatform,
    removeContextPointMarker,
    removeUserLocationMarker,
    showUserLocationMarker,
    hide,
    show
  });
  window.OMAP_STREETVIEW?.configure({
    state,
    el,
    map,
    CONFIG,
    text,
    closeOtherMobilePanels,
    getMobilePanelMaximumHeight,
    isMobilePanelViewport,
    setMobilePanelHeight
  });
  window.OMAP_MEASURE?.configure({
    state,
    el,
    map,
    text,
    getAccentColor,
    closeOtherMobilePanels
  });
  window.OMAP_WIKIPEDIA?.configure({
    state,
    text,
    capitalizeFirstLetter
  });
  window.OMAP_DEPARTURES?.configure({
    state,
    text,
    CONFIG,
    openTripDetails
  });
  window.OMAP_DISCOVER?.configure({
    state,
    el,
    map,
    CONFIG,
    text,
    getSearchResultTitle,
    scrollPanelToElement: window.OMAP_ROUTE?.scrollPanelToElement
  });
  window.OMAP_DISCOVER?.renderCategoryButtons();

  updateUI();

  el.themeSelect?.addEventListener("change", e => {
    state.theme = e.target.value;
    safeSet(CONFIG.storageKeys.theme, state.theme);
    applyTheme(state.theme);
    window.OMAP_CUSTOM_THEME_EDITOR?.updateCustomPaletteVisibility();
    updateUI();
  });

  window.OMAP_CUSTOM_THEME_EDITOR?.updateCustomPaletteVisibility();
  window.OMAP_CUSTOM_THEME_EDITOR?.initializePaletteEditor();

  window.OMAP_CUSTOM_THEME_EDITOR?.initializeTextureEditor();
  window.OMAP_CUSTOM_THEME_EDITOR?.initializeFontEditor();
  window.OMAP_CUSTOM_THEME_EDITOR?.initializePresetsEditor();


  window.OMAP_LABEL_VISIBILITY?.initializeToggles();


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
  el.legendButton?.addEventListener("click", toggleLegend);
  el.legendClose?.addEventListener("click", closeLegend);
  el.placePanelBack?.addEventListener(
    "click",
    returnFromPlacePanel
  );
  el.placePanelClose?.addEventListener("click", () => {
    state.tripOriginStack = [];
    state.tripContextStack = [];
    closePlacePanel();
  });
  el.tripPanelBack?.addEventListener(
    "click",
    returnFromTripToPlace
  );
  el.tripPanelClose?.addEventListener("click", () => {
    state.tripOriginStack = [];
    state.tripContextStack = [];
    closeTrip();
    closePlacePanel();
  });

  el.streetviewPanelClose?.addEventListener("click", window.OMAP_STREETVIEW?.close);
  el.streetviewFullscreenButton?.addEventListener(
    "click",
    window.OMAP_STREETVIEW?.toggleFullscreen
  );
  el.menuStreetviewButton?.addEventListener(
    "click",
    window.OMAP_STREETVIEW?.toggleCoverage
  );

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
    window.OMAP_FAVORITES?.openFavoritesPanel
  );
  el.favoritesClose?.addEventListener(
    "click",
    window.OMAP_FAVORITES?.closeFavoritesPanel
  );
  el.favoritesBack?.addEventListener(
    "click",
    returnFromFavoritesToMenu
  );
  el.favoritesSearch?.addEventListener("input", window.OMAP_FAVORITES?.renderFavoritesList);
  el.favoritesSortSelect?.addEventListener("change", () => {
    state.favoritesSortOrder = el.favoritesSortSelect.value;
    window.OMAP_FAVORITES?.renderFavoritesList();
  });

  el.favoritesAddFolderButton?.addEventListener("click", () => {
    if (!el.favoritesNewFolderForm) return;
    el.favoritesNewFolderForm.hidden = false;
    el.favoritesNewFolderInput.value = "";
    el.favoritesNewFolderInput.focus();
  });

  el.favoritesNewFolderCancel?.addEventListener("click", () => {
    if (el.favoritesNewFolderForm) el.favoritesNewFolderForm.hidden = true;
  });


  el.favoritesNewFolderSave?.addEventListener("click", window.OMAP_FAVORITES?.createFavoriteFolder);
  el.favoritesNewFolderInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      window.OMAP_FAVORITES?.createFavoriteFolder();
    }
  });

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
  el.historySearch?.addEventListener("input", window.OMAP_HISTORY?.renderHistoryList);
  el.historyClear?.addEventListener("click", window.OMAP_HISTORY?.clearHistoryList);
  el.menuExportAll?.addEventListener("click", window.OMAP_BACKUP?.exportAll);
  el.menuImportAllButton?.addEventListener("click", () => {
    el.menuImportAllInput?.click();
  });
  el.menuImportAllInput?.addEventListener("change", window.OMAP_BACKUP?.importAll);
  el.backupSelectAll?.addEventListener("click", () => {
    const checkboxes = [el.backupScopeFavorites, el.backupScopeColors, el.backupScopePlaceNames].filter(Boolean);
    const allChecked = checkboxes.every(box => box.checked);
    for (const box of checkboxes) box.checked = !allChecked;
    updateBackupSelectAllLabel();
  });
  el.backupScopeFavorites?.addEventListener("change", updateBackupSelectAllLabel);
  el.backupScopeColors?.addEventListener("change", updateBackupSelectAllLabel);
  el.backupScopePlaceNames?.addEventListener("change", updateBackupSelectAllLabel);

  function updateBackupSelectAllLabel() {
    if (!el.backupSelectAll) return;
    const checkboxes = [el.backupScopeFavorites, el.backupScopeColors, el.backupScopePlaceNames].filter(Boolean);
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
    if (el.backupScopePlaceNames?.checked) scopes.push("placeNames");
    return scopes;
  }

  el.locateToggleButton?.addEventListener("click", window.OMAP_MAPVIEW?.locate);
  el.toggle3dButton?.addEventListener("click", window.OMAP_MAPVIEW?.toggle3d);
  el.brandButton?.addEventListener("click", event => {
    event.preventDefault();
    map.easeTo({ bearing: 180, duration: 400 });
  });
  el.zoomInButton?.addEventListener("click", () => map.zoomIn());
  el.zoomOutButton?.addEventListener("click", () => map.zoomOut());
  el.measureToggleButton?.addEventListener("click", window.OMAP_MEASURE?.toggle);
  el.measureClearButton?.addEventListener("click", () => {
    if (state.measureIsArea) {
      window.OMAP_MEASURE?.clearArea();
      window.OMAP_MEASURE?.updateAreaDisplay();
    } else {
      window.OMAP_MEASURE?.clearDistance();
    }
  });
  el.measureModeSwitchButton?.addEventListener("click", window.OMAP_MEASURE?.switchMode);
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
  el.clearMapButton?.addEventListener("click", window.OMAP_MAPVIEW?.clear);
  el.exportPngButton?.addEventListener("click", window.OMAP_MAPVIEW?.exportPng);
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

  el.menuAccountButton?.addEventListener(
    "click",
    window.OMAP_ACCOUNT?.openAccountFromMenu
  );
  el.accountClose?.addEventListener("click", window.OMAP_ACCOUNT?.closeAccount);
  el.accountBack?.addEventListener(
    "click",
    window.OMAP_ACCOUNT?.returnFromAccountToMenu
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
  el.labelsBack?.addEventListener(
    "click",
    returnFromLabelsToMenu
  );
  el.labelsClose?.addEventListener("click", closeLabels);
  el.menuLabelsButton?.addEventListener("click", openLabelsFromMenu);
  el.tradingSundayBack?.addEventListener(
    "click",
    window.OMAP_TRADING_SUNDAY?.returnToMenu
  );
  el.tradingSundayClose?.addEventListener("click", window.OMAP_TRADING_SUNDAY?.close);
  el.menuTradingSundayButton?.addEventListener("click", window.OMAP_TRADING_SUNDAY?.open);
  el.routeButton?.addEventListener("click", window.OMAP_ROUTE?.toggleRoute);
  el.mobileRouteButton?.addEventListener("click", window.OMAP_ROUTE?.toggleRoute);
  el.mobileDiscoverButton?.addEventListener("click", toggleDiscover);
  el.discoverBack?.addEventListener(
    "click",
    returnFromDiscoverToPlace
  );
  el.routeBack?.addEventListener(
    "click",
    window.OMAP_ROUTE?.returnFromRouteToPlace
  );
  el.mobileMenuButton?.addEventListener("click", toggleMenu);
  el.discoverButton?.addEventListener("click", toggleDiscover);
  el.discoverClose?.addEventListener("click", closeDiscover);
  el.discoverClear?.addEventListener("click", () => {
    window.OMAP_DISCOVER?.clear();
  });

  el.routeClose?.addEventListener("click", window.OMAP_ROUTE?.closeRoute);
  el.routeSwap?.addEventListener("click", window.OMAP_ROUTE?.swapRoutePoints);
  el.routeAddWaypoint?.addEventListener("click", () => {
    window.OMAP_ROUTE?.addRouteWaypointField();
  });
  el.routeClear?.addEventListener("click", () => {
    window.OMAP_ROUTE?.clearRoute();
  });
  el.routeForm?.addEventListener("submit", window.OMAP_ROUTE?.planRoute);
  el.routeShare?.addEventListener("click", window.OMAP_ROUTE?.shareRoute);

// Eksport GPX
    el.routeExportGpx?.addEventListener("click", window.OMAP_ROUTE?.exportRouteAsGpx);
    document.getElementById("export-gpx-button")?.addEventListener("click", exportRouteAsGPX);

// Import GPX – kliknięcie w przycisk otwiera okno wyboru pliku
    el.routeImportGpx?.addEventListener("click", () => {
    el.routeImportGpxInput?.click();
});

// Obsługa wybrania pliku
el.routeImportGpxInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
        window.OMAP_ROUTE?.importRouteFromGpx(file);
    }
});
  for (const modeInput of document.querySelectorAll('input[name="route-mode"]')) {
    modeInput.addEventListener("change", window.OMAP_ROUTE?.handleRouteModeChange);
  }
  initializeRouteBottomSheet();
  initializeDiscoverBottomSheet();
  initializeMenuBottomSheet();
  initializeFavoritesBottomSheet();
  initializeHistoryBottomSheet();
  initializePlaceBottomSheet();
  initializeTripBottomSheet();
  initializeStreetviewBottomSheet();
  initializeLegendBottomSheet();
  initializeLabelsBottomSheet();
  initializeTradingSundayBottomSheet();
  initializeAboutBottomSheet();
  initializeBackupBottomSheet();
  initializeAccountBottomSheet();
  window.OMAP_ACCOUNT?.initializeEventListeners();
  initializeAutocomplete();
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMapContextMenu();
      closeOtherMobilePanels([]);
    }
  });
  el.searchForm?.addEventListener("submit", search);
  el.searchInput?.addEventListener("input", updateSearchClearButton);
  el.searchClear?.addEventListener("click", clearMainSearch);

  el.routeFrom?.addEventListener("input", () =>
    window.OMAP_ROUTE?.updateRouteClearButton(el.routeFrom, el.routeFromClear)
  );
  el.routeTo?.addEventListener("input", () =>
    window.OMAP_ROUTE?.updateRouteClearButton(el.routeTo, el.routeToClear)
  );
  el.routeFromClear?.addEventListener("click", () => window.OMAP_ROUTE?.clearRoutePoint("a"));
  el.routeToClear?.addEventListener("click", () => window.OMAP_ROUTE?.clearRoutePoint("b"));
  window.OMAP_ROUTE?.watchRouteInputValue(el.routeFrom, el.routeFromClear);
  window.OMAP_ROUTE?.watchRouteInputValue(el.routeTo, el.routeToClear);
  window.OMAP_ROUTE?.updateRouteClearButtons();

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
    if (el.locateToggleButton) {
      el.locateToggleButton.title = t.locate;
      el.locateToggleButton.setAttribute("aria-label", t.locate);
    }
    if (el.toggle3dButton) {
      el.toggle3dButton.title = t.toggle3d;
      el.toggle3dButton.setAttribute("aria-label", t.toggle3d);
    }
    if (el.measureToggleButton) {
      el.measureToggleButton.title = t.measureDistance;
      el.measureToggleButton.setAttribute(
        "aria-label",
        t.measureDistance
      );
    }
    window.OMAP_MEASURE?.updateModeSwitchUi();
    if (el.zoomInButton) {
      el.zoomInButton.title = t.zoomIn;
      el.zoomInButton.setAttribute("aria-label", t.zoomIn);
    }
    if (el.zoomOutButton) {
      el.zoomOutButton.title = t.zoomOut;
      el.zoomOutButton.setAttribute("aria-label", t.zoomOut);
    }
    if (el.measureClearButton) {
      el.measureClearButton.setAttribute(
        "aria-label",
        t.measureClear
      );
    }
    if (el.menuLanguageLabel) el.menuLanguageLabel.textContent = t.menuLanguage;
    if (el.clearMapLabel) el.clearMapLabel.textContent = t.clearMap;
    if (el.exportPngButton) {
      el.exportPngButton.title = t.exportPng;
      el.exportPngButton.setAttribute("aria-label", t.exportPng);
    }
    if (el.exportPngLabel) el.exportPngLabel.textContent = t.exportPng;
    if (el.menuAboutLabel) el.menuAboutLabel.textContent = t.menuAbout;
    if (el.menuBackupLabel) el.menuBackupLabel.textContent = t.menuBackup;

    if (el.menuAccountLabel) el.menuAccountLabel.textContent = t.accountMenuLabel;
    if (el.accountTitle) el.accountTitle.textContent = t.accountTitle;
    if (el.accountBack) el.accountBack.setAttribute("aria-label", t.accountBackAria);
    if (el.accountClose) el.accountClose.setAttribute("aria-label", t.accountCloseAria);
    if (el.accountSheetHandle) el.accountSheetHandle.setAttribute("aria-label", t.accountSheetHandleAria);
    if (el.accountIntroText) el.accountIntroText.textContent = t.accountIntro;
    if (el.accountGotoLoginButton) el.accountGotoLoginButton.textContent = t.accountGotoLogin;
    if (el.accountGotoRegisterButton) el.accountGotoRegisterButton.textContent = t.accountGotoRegister;
    if (el.accountLoginBackButton) el.accountLoginBackButton.textContent = t.accountBack;
    if (el.accountRegisterBackButton) el.accountRegisterBackButton.textContent = t.accountBack;
    if (el.accountLoginHeading) el.accountLoginHeading.textContent = t.accountLoginHeading;
    if (el.accountSeedInput) el.accountSeedInput.placeholder = t.accountSeedInputPlaceholder;
    if (el.accountLoginButton) el.accountLoginButton.textContent = t.accountLoginButton;
    if (el.accountRegisterWarning) el.accountRegisterWarning.textContent = t.accountRegisterWarning;
    if (el.accountSeedCopyButton) el.accountSeedCopyButton.textContent = t.accountSeedCopy;
    if (el.accountSeedConfirmLabel) el.accountSeedConfirmLabel.textContent = t.accountSeedConfirmLabel;
    if (el.accountSeedConfirmButton) el.accountSeedConfirmButton.textContent = t.accountSeedConfirmButton;
    if (el.accountAvatarButton) el.accountAvatarButton.setAttribute("aria-label", t.accountAvatarAria);
    if (el.accountProfileNameInput) el.accountProfileNameInput.placeholder = t.accountNameInputPlaceholder;
    if (el.accountNameSaveButton) el.accountNameSaveButton.textContent = t.accountNameSave;
    if (el.accountNameCancelButton) el.accountNameCancelButton.textContent = t.accountNameCancel;
    if (el.accountPublicId) el.accountPublicId.title = t.accountPublicIdTitle;
    if (el.accountAutoSyncLabel) el.accountAutoSyncLabel.textContent = t.accountAutoSyncLabel;
    if (el.accountScopeColorsLabel) el.accountScopeColorsLabel.textContent = t.accountScopeColors;
    if (el.accountScopePlaceNamesLabel) el.accountScopePlaceNamesLabel.textContent = t.accountScopePlaceNames;
    if (el.accountScopeHistoryLabel) el.accountScopeHistoryLabel.textContent = t.accountScopeHistory;
    if (el.accountPushButton) el.accountPushButton.textContent = t.accountPush;
    if (el.accountPullButton) el.accountPullButton.textContent = t.accountPull;
    if (el.accountLogoutButton) el.accountLogoutButton.textContent = t.accountLogout;
    if (el.accountActivityButton) el.accountActivityButton.textContent = `📋 ${t.accountActivity}`;
    el.accountActivityRefreshButton?.setAttribute("aria-label", t.activityRefresh);
    el.accountSyncRefreshButton?.setAttribute("aria-label", t.syncRefresh);
    if (el.accountRevealSummary) el.accountRevealSummary.textContent = t.accountRevealSummary;
    if (el.accountSeedRevealCopyButton) el.accountSeedRevealCopyButton.textContent = t.accountSeedCopy;
    if (el.accountDisplayName && !el.accountDisplayName.dataset.hasCustomName) {
      el.accountDisplayName.textContent = t.accountNoName;
    }
    if (el.favoritesMenuLabel) el.favoritesMenuLabel.textContent = t.favoritesTitle;
    if (el.favoritesTitle) el.favoritesTitle.textContent = t.favoritesTitle;
    if (el.historyMenuLabel) el.historyMenuLabel.textContent = t.menuHistory;
    if (el.historyTitle) el.historyTitle.textContent = t.historyTitle;
    el.historyClose?.setAttribute("aria-label", t.historyClose);
    el.historyBack?.setAttribute("aria-label", t.backToMenu);
    if (el.historySearch) el.historySearch.placeholder = t.historySearch;
    el.historySearch?.setAttribute("aria-label", t.historySearch);
    if (el.historyClear) el.historyClear.textContent = t.historyClear;
    window.OMAP_ROUTE?.updateRouteSaveFavoriteButton();
    if (el.menuExportAllLabel) el.menuExportAllLabel.textContent = t.menuExportAll;
    if (el.menuImportAllLabel) el.menuImportAllLabel.textContent = t.menuImportAll;
    if (el.backupScopeFavoritesLabel) el.backupScopeFavoritesLabel.textContent = t.backupScopeFavorites;
    if (el.backupScopeColorsLabel) el.backupScopeColorsLabel.textContent = t.backupScopeColors;
    if (el.backupScopePlaceNamesLabel) el.backupScopePlaceNamesLabel.textContent = t.backupScopePlaceNames;
    updateBackupSelectAllLabel();
    if (el.favoritesCountLabel) el.favoritesCountLabel.textContent = t.favoritesCountLabel;
    document.documentElement.lang = state.language;
    document.title = t.title;
    if (el.searchInput) el.searchInput.placeholder = t.search;
    el.searchInput?.setAttribute("aria-label", t.search);
    el.searchButton?.setAttribute("aria-label", t.search);
    if (el.locateButton) el.locateButton.title = t.locate;
    el.locateButton?.setAttribute("aria-label", t.locate);
    if (el.legendButton) el.legendButton.title = t.legend;
    el.legendButton?.setAttribute("aria-label", t.legend);
    if (el.menuLegendLabel) {
      el.menuLegendLabel.textContent = t.menuLegend;
    }
    if (el.menuStreetviewButton) {
      el.menuStreetviewButton.title = t.menuStreetview;
      el.menuStreetviewButton.setAttribute(
        "aria-label",
        t.menuStreetview
      );
    }
    if (el.streetviewPanelTitle) {
      el.streetviewPanelTitle.textContent = t.streetviewTitle;
    }
    updateMapContextMenuLabels();
    if (el.legendTitle) el.legendTitle.textContent = t.legend;
    el.legendClose?.setAttribute("aria-label", t.closeLegend);
    if (el.labelsTitle) el.labelsTitle.textContent = t.labelsPanelTitle;
    el.labelsClose?.setAttribute("aria-label", t.closeLabels);
    if (el.menuLabelsMenuLabel) el.menuLabelsMenuLabel.textContent = t.menuLabelsMenuLabel;
    window.OMAP_LABEL_VISIBILITY?.updateLabelsToggleAllButton();
    if (el.tradingSundayTitle) el.tradingSundayTitle.textContent = t.menuTradingSunday;
    if (el.menuTradingSundayLabel) el.menuTradingSundayLabel.textContent = t.menuTradingSunday;
    if (el.tradingSundayQuestion) el.tradingSundayQuestion.textContent = t.tradingSundayQuestion;
    el.tradingSundayClose?.setAttribute("aria-label", t.closeTradingSunday);
    window.OMAP_TRADING_SUNDAY?.updateAnswer();
    el.legendBack?.setAttribute("aria-label", t.backToMenu);
    el.labelsBack?.setAttribute("aria-label", t.backToMenu);
    el.tradingSundayBack?.setAttribute("aria-label", t.backToMenu);
    el.aboutBack?.setAttribute("aria-label", t.backToMenu);
    el.discoverBack?.setAttribute("aria-label", t.backToPlace);
    el.routeBack?.setAttribute("aria-label", t.backToPlace);
    el.backupBack?.setAttribute("aria-label", t.backToMenu);
    el.favoritesBack?.setAttribute("aria-label", t.backToAccount);
    if (el.legendNote) el.legendNote.textContent = t.legendNote;
    if (el.aboutButton) el.aboutButton.title = t.about;
    el.aboutButton?.setAttribute("aria-label", t.about);
    if (el.aboutTitle) el.aboutTitle.textContent = t.about;
    el.aboutClose?.setAttribute("aria-label", t.closeAbout);
    if (el.backupTitle) el.backupTitle.textContent = t.backupTitle;
    el.backupClose?.setAttribute("aria-label", t.closeBackup);
    if (el.aboutIntro) el.aboutIntro.textContent = t.aboutIntro;
    if (el.aboutIntroAlt) el.aboutIntroAlt.textContent = t.aboutIntroAlt;
    if (el.aboutDataLabel) el.aboutDataLabel.textContent = t.aboutData;
    if (el.aboutStyleLabel) el.aboutStyleLabel.textContent = t.aboutStyle;
    if (el.aboutEngineLabel) el.aboutEngineLabel.textContent = t.aboutEngine;
    if (el.aboutContactLabel) el.aboutContactLabel.textContent = t.aboutContact;
    if (el.aboutGithubLabel) el.aboutGithubLabel.textContent = t.aboutGithubLabel;
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
      (window.OMAP_DISCOVER?.CATEGORY_GROUPS || []).forEach((group, index) => {
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
    if (el.routeExportGpx) el.routeExportGpx.textContent = t.routeExportGpx;
    if (el.routeImportGpx) el.routeImportGpx.textContent = t.routeImportGpx;
    if (el.routeWaypointNote) el.routeWaypointNote.textContent = t.routeWaypointNote;
    if (el.routeAddWaypointLabel) el.routeAddWaypointLabel.textContent = t.routeAddWaypoint;
    el.routeAddWaypoint?.setAttribute("aria-label", t.routeAddWaypoint);
    window.OMAP_ROUTE?.renderRouteWaypoints();
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
    if (el.customTexturesHeading) el.customTexturesHeading.textContent = t.customTexturesHeading;
    if (el.customTexturesHint) el.customTexturesHint.textContent = t.customTexturesHint;
    if (el.backupFavoritesHint) el.backupFavoritesHint.textContent = t.backupFavoritesHint;
    if (el.customFontHeading) el.customFontHeading.textContent = t.customFontHeading;
    if (el.customFontHint) el.customFontHint.textContent = t.customFontHint;
    if (el.customThemePresetsHeading) el.customThemePresetsHeading.textContent = t.customThemePresetsHeading;
    if (el.customThemePresetsHint) el.customThemePresetsHint.textContent = t.customThemePresetsHint;
    if (el.customThemePresetNameInput) el.customThemePresetNameInput.placeholder = t.customThemePresetNamePlaceholder;
    if (el.customThemePresetSaveButton) el.customThemePresetSaveButton.textContent = t.customThemePresetSave;
    if (el.customFontSelect) {
      const defaultOption = el.customFontSelect.querySelector('option[value="default"]');
      if (defaultOption) defaultOption.textContent = t.customFontDefault;
      const customOption = el.customFontSelect.querySelector('option[value="custom"]');
      if (customOption) customOption.textContent = t.customFontCustomOption;
    }
    if (el.customPaletteReset) el.customPaletteReset.textContent = t.customColorReset;
    if (el.labelsPoiToggleLabel) el.labelsPoiToggleLabel.textContent = t.labelsPoi;
    if (el.labelsRoadsToggleLabel) el.labelsRoadsToggleLabel.textContent = t.labelsRoads;
    if (el.labelsPlacesToggleLabel) el.labelsPlacesToggleLabel.textContent = t.labelsPlaces;
    if (el.labelsWaterToggleLabel) el.labelsWaterToggleLabel.textContent = t.labelsWater;
    if (el.labelsRegionsToggleLabel) el.labelsRegionsToggleLabel.textContent = t.labelsRegions;
    if (el.labelsCountriesToggleLabel) el.labelsCountriesToggleLabel.textContent = t.labelsCountries;
    if (el.labelsAirportsToggleLabel) el.labelsAirportsToggleLabel.textContent = t.labelsAirports;
    if (el.labelsBoundariesToggleLabel) el.labelsBoundariesToggleLabel.textContent = t.labelsBoundaries;
    for (const [key, label] of Object.entries(t.customColorLabels)) {
      const labelEl = $(`custom-color-${key}-label`);
      if (labelEl) labelEl.textContent = label;
    }
    for (const [key, label] of Object.entries(t.customTextureLabels)) {
      const labelEl = $(`custom-texture-${key}-label`);
      if (labelEl) labelEl.textContent = label;
    }
    document.body.classList.toggle(
      "ui-dark",
      resolveTheme(state.theme) === "dark" ||
      (state.theme === "satellite" && prefersDarkColorScheme())
    );
    window.OMAP_FAVORITES?.renderFolderChips();
    window.OMAP_FAVORITES?.renderFavoritesList();
    window.OMAP_HISTORY?.renderHistoryList();

    if (el.favoritesAddFolderButton) el.favoritesAddFolderButton.textContent = t.favoriteFolderAddButton;
    if (el.favoritesNewFolderInput) el.favoritesNewFolderInput.placeholder = t.favoriteFolderNamePlaceholder;
    if (el.favoritesNewFolderSave) el.favoritesNewFolderSave.textContent = t.favoriteSave;
    if (el.favoritesNewFolderCancel) el.favoritesNewFolderCancel.textContent = t.favoriteCancelEdit;

    if (el.favoritesSortSelect) {
      el.favoritesSortSelect.setAttribute("aria-label", t.sortAriaLabel);
      const setOption = (value, label) => {
        const option = el.favoritesSortSelect.querySelector(`option[value="${value}"]`);
        if (option) option.textContent = label;
      };
      setOption("newest", t.sortNewest);
      setOption("oldest", t.sortOldest);
      setOption("az", t.sortAZ);
      setOption("za", t.sortZA);
    }
  }

  // Defibrylatory uznaliśmy za zbyt mało istotne, żeby zaśmiecać
  // mapę własną ikoną - dopisujemy warunek wykluczający je z
  // istniejących filtrów warstw POI, nie ruszając niczego innego.
  function hideDefibrillatorPois() {
    const poiLayerIds = ["poi_r20", "poi_r7", "poi_r1"];
    const exclusion = ["!=", ["get", "class"], "defibrillator"];

    for (const layerId of poiLayerIds) {
      if (!map.getLayer(layerId)) continue;

      const existingFilter = map.getFilter(layerId);
      const combinedFilter = existingFilter
        ? ["all", existingFilter, exclusion]
        : exclusion;

      try {
        map.setFilter(layerId, combinedFilter);
      } catch (error) {
        console.warn(`Nie udało się ukryć defibrylatorów w warstwie ${layerId}.`, error);
      }
    }
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

    map.getContainer().classList.toggle("theme-inverted", theme === "inverted");

    if (effectiveTheme === "custom") {
      applyCustomUiColors(state.customPalette);
    } else {
      clearCustomUiColors();
    }

    applyCustomFont();

    applyLanguage(state.language);

    for (const layer of map.getStyle().layers || []) {
      applyRoadReferenceColors(layer);
    }

    window.OMAP_LABEL_VISIBILITY?.applyLabelVisibility();
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
        if (applyTextureIfPresent(layer, "mapBackground", "background-pattern")) return;
        map.setPaintProperty(layer.id, "background-color", palette.mapBackground);
        return;
      }

      if (layer.type === "fill") {
        const key = CUSTOM_FILL_LAYER_MAP[id] || "mapBackground";

        if (applyTextureIfPresent(layer, key, "fill-pattern")) {
          map.setPaintProperty(layer.id, "fill-opacity", key === "mapBackground" ? 1 : 0.92);
          return;
        }

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

  function getAccentColor() {
    return state.theme === "custom" && state.customPalette?.uiAccent
      ? state.customPalette.uiAccent
      : "#dc2626";
  }

  // Elementy rysowane bezpośrednio na płótnie mapy (linia trasy,
  // linia pomiaru odległości) NIE reagują na zmienne CSS (--accent) -
  // MapLibre wymaga jawnego ustawienia koloru przez JS. Dlatego przy
  // każdej zmianie koloru akcentu trzeba je też ręcznie odświeżyć,
  // inaczej zostają przy starym, domyślnym czerwonym bez względu na
  // wybraną paletę.
  function updateAccentDependentMapLayers() {
    const accent = getAccentColor();

    if (map.getLayer(MEASURE_LINE_LAYER_ID)) {
      map.setPaintProperty(MEASURE_LINE_LAYER_ID, "line-color", accent);
    }
    if (map.getLayer(MEASURE_POINTS_LAYER_ID)) {
      map.setPaintProperty(MEASURE_POINTS_LAYER_ID, "circle-stroke-color", accent);
    }

    if (map.getLayer(MEASURE_AREA_FILL_LAYER_ID)) {
      map.setPaintProperty(MEASURE_AREA_FILL_LAYER_ID, "fill-color", accent);
    }
    if (map.getLayer(MEASURE_AREA_LINE_LAYER_ID)) {
      map.setPaintProperty(MEASURE_AREA_LINE_LAYER_ID, "line-color", accent);
    }
    if (map.getLayer(MEASURE_AREA_POINTS_LAYER_ID)) {
      map.setPaintProperty(MEASURE_AREA_POINTS_LAYER_ID, "circle-stroke-color", accent);
    }

    // Kolor trasy koduje też tryb podróży (rower/pieszo mają swoje
    // własne, stałe kolory) - akcent dotyczy tylko trybu domyślnego
    // ("auto"), żeby nie zaburzać tego rozróżnienia.
    if (map.getLayer(CONFIG.routing.lineLayerId) && window.OMAP_ROUTE?.getSelectedRouteMode() === "auto") {
      map.setPaintProperty(CONFIG.routing.lineLayerId, "line-color", accent);
    }
  }

  function applyCustomUiColors(palette) {
    const root = document.documentElement.style;
    root.setProperty("--accent", palette.uiAccent);
    root.setProperty("--panel", palette.uiPanel);
    root.setProperty(
      "--panel-muted",
      `color-mix(in srgb, ${palette.uiPanel} 94%, black 6%)`
    );
    root.setProperty("--text", palette.uiText);
    root.setProperty(
      "--muted",
      `color-mix(in srgb, ${palette.uiText} 65%, transparent)`
    );
    applyUiPanelTexture();
    updateAccentDependentMapLayers();
  }

  function clearCustomUiColors() {
    const root = document.documentElement.style;
    root.removeProperty("--panel-image");
    root.removeProperty("--accent");
    root.removeProperty("--panel");
    root.removeProperty("--panel-muted");
    root.removeProperty("--text");
    root.removeProperty("--muted");
    updateAccentDependentMapLayers();
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
  // 1. Sztywne zagwarantowanie języka (jeśli language jest undefined, bierze 'pl')
  const targetLang = language || state?.language || 'pl';
  if (state) state.language = targetLang;

  // 2. Jeśli mapa jeszcze się ładuje, czekamy na "idle" (stan spoczynku), a NIE na "styledata"
  // 'idle' odpala się dopiero gdy mapa całkowicie skończy rysować klatkę
  if (!map || !map.isStyleLoaded()) {
    map?.once("idle", () => applyLanguage(targetLang));
    return;
  }

  // 3. Wymuszana właściwość
  const preferredField = targetLang === "pl" ? "name:pl" : "name:en";

  const layers = map.getStyle()?.layers || [];

  for (const layer of layers) {
    if (layer.type !== "symbol" || !layer.layout || layer.layout["text-field"] === undefined) {
      continue;
    }

    try {
      // Ignorujemy tarcze dróg
      if (typeof isRoadReferenceLayer === "function" && isRoadReferenceLayer(layer)) {
        continue;
      }

      // Wymuszamy język bez sprawdzania 'styledata'
      map.setLayoutProperty(layer.id, "text-field", [
        "coalesce",
        ["get", preferredField],
        ["get", "name:latin"],
        ["get", "name"]
      ]);
    } catch (e) {
      // Ignoruj warstwy bez możliwości edycji layoutu
    }
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

  // Uwaga: dawne encodePlace()/decodePlace() (kodowały punkt do base64
  // dla parametru ?p=) zostały zastąpione przez ujednolicony
  // window.OMAP_URL_STATE (src/services/url-state-service.js), który
  // używa czytelnego formatu "lat,lon" zamiast base64 i jest jedynym
  // miejscem odpowiedzialnym za odczyt/zapis stanu miejsca w URL-u.


  function loadSharedPlaceFromUrl() {
    const shared = window.OMAP_URL_STATE?.readPlaceFromUrl();
    console.log("[loadSharedPlaceFromUrl] readPlaceFromUrl() zwrocil:", shared, "| window.location.search:", window.location.search);
    if (!shared || !Number.isFinite(shared.lat) || !Number.isFinite(shared.lon)) return;

    // Otwórz udostępniony punkt natychmiast. Nie zostawiaj
    // jednorazowego callbacku moveend, który mógłby uruchomić
    // się dopiero podczas pierwszego późniejszego wyszukiwania.
    showPlaceInformation({
      lngLat: new maplibregl.LngLat(
        shared.lon,
        shared.lat
      ),
      knownName: shared.label || null
    });

    map.flyTo({
      center: [shared.lon, shared.lat],
      zoom: 17,
      bearing: 180
    });

    // Normalizujemy URL do jednego, kanonicznego formatu (?q=&p=)
    // przez replaceState (bez dokładania nowego wpisu do historii),
    // żeby link/zakładka nadal wskazywały na ten sam punkt zamiast
    // znikać po odświeżeniu jak w poprzedniej, jednorazowej wersji.
    window.OMAP_URL_STATE?.setPlaceUrl({
      label: shared.label || formatCoordinates(shared.lon, shared.lat),
      lat: shared.lat,
      lon: shared.lon,
      replace: true
    });
  }

  function initializeAutocomplete() {
    const floatingList = el.autocompleteFloating;
    let activeInput = null;
    let activeSelect = null;
    let debounceTimer = null;
    let abortController = null;
    let results = [];
    let activeIndex = -1;

    const isRoutePointInput = input =>
      input === el.routeFrom ||
      input === el.routeTo ||
      Boolean(input?.classList?.contains("route-waypoint-input"));

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

          window.OMAP_SEARCH_HISTORY?.saveSearchHistoryEntry({
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
          window.OMAP_ROUTE?.setRouteMarker("a", point);
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
          window.OMAP_ROUTE?.setRouteMarker("b", point);
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

      const isRouteInput = isRoutePointInput(activeInput);

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
          icon.textContent = result.__isFavorite ? "⭐" : getSearchResultEmoji(result);
          // Pobierz custom name jeśli istnieje
          const lat = Number(result?.lat);
          const lon = Number(result?.lon);
          let displayTitle = getSearchResultTitle(result) ||
            getPreferredPlaceLabel(result);
          if (Number.isFinite(lat) && Number.isFinite(lon)) {
            const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
            displayTitle = state.customPlaceNames[placeNameKey] || displayTitle;
          }
          title.textContent = displayTitle;
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
            window.OMAP_ROUTE?.useMyLocationForRoute(point => select?.(point));
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
      const history = window.OMAP_SEARCH_HISTORY?.getSearchHistory();
      const pinnedFavorites = state.favorites.slice(0, 5);

      floatingList.replaceChildren();
      activeIndex = -1;

      if (!history.length && !pinnedFavorites.length) {
        hide();
        return;
      }

      if (pinnedFavorites.length) {
        const favHeader = document.createElement("li");
        favHeader.className = "autocomplete-history-header";
        const favTitle = document.createElement("span");
        favTitle.textContent = text[state.language].favoritesTitle;
        favHeader.append(favTitle);
        floatingList.appendChild(favHeader);

        const favFragment = document.createDocumentFragment();
        pinnedFavorites.forEach(favorite => {
          const item = document.createElement("li");
          const button = document.createElement("button");
          button.type = "button";
          button.className = "autocomplete-option autocomplete-history-option";

          const icon = document.createElement("span");
          icon.className = "autocomplete-history-icon";
          icon.setAttribute("aria-hidden", "true");
          icon.textContent = "⭐";

          const copy = document.createElement("span");
          copy.className = "autocomplete-history-copy";

          const label = document.createElement("strong");
          label.textContent = favorite.customName || favorite.title || "";

          const details = document.createElement("span");
          details.textContent = favorite.address || "";

          copy.append(label, details);
          button.append(icon, copy);

          button.addEventListener("pointerdown", event => {
            event.preventDefault();
          });

          button.addEventListener("click", () => {
            const displayLabel = favorite.customName || favorite.title || "";
            if (el.searchInput) el.searchInput.value = displayLabel;
            updateSearchClearButton();
            hide();

            window.OMAP_SEARCH_SESSION?.cancel?.();
            setPlacePanelReturnTarget("search", { query: displayLabel });
            prepareMobilePlacePanelAfterSearch();

            openSearchPlaceThroughService(
              { ...favorite, name: displayLabel },
              {
                query: displayLabel,
                reverse: !(favorite.exactLocalIdentity || Boolean(favorite.osm_type && favorite.osm_id)),
                origin: "favorites"
              }
            );

            map.flyTo({
              center: [favorite.lon, favorite.lat],
              zoom: 16,
              bearing: 180
            });

            if (!state.isRestoringFromPopstate) {
              window.OMAP_URL_STATE?.setPlaceUrl({
                label: displayLabel,
                lat: favorite.lat,
                lon: favorite.lon,
                osmType: favorite.osm_type,
                osmId: favorite.osm_id
              });
            }
          });

          item.appendChild(button);
          favFragment.appendChild(item);
        });
        floatingList.appendChild(favFragment);
      }

      if (!history.length) {
        floatingList.hidden = false;
        positionList();
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
        window.OMAP_SEARCH_HISTORY?.clearSearchHistory();
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
        // Pobierz custom name jeśli istnieje
        const lat = Number(entry.lat);
        const lon = Number(entry.lon);
        let displayLabel = entry.label;
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
          displayLabel = state.customPlaceNames[placeNameKey] || displayLabel;
        }
        label.textContent = displayLabel;

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
          
          // Update URL to show the search (skip if we're restoring from popstate)
          if (!state.isRestoringFromPopstate) {
            window.OMAP_URL_STATE?.setPlaceUrl({
              label: entry.label,
              lat: entry.lat,
              lon: entry.lon,
              osmType: entry.osm_type,
              osmId: entry.osm_id
            });
          }
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

      const isMainSearch = activeInput === el.searchInput;
      const favoriteMatches = isMainSearch
        ? window.OMAP_FAVORITES?.getMatchingFavoritePlaces(query)
        : [];

      // Ulubione są lokalne (bez sieci) - pokazujemy je od razu,
      // zanim jeszcze dotrze odpowiedź z wyszukiwarki geograficznej.
      if (favoriteMatches.length) {
        render(favoriteMatches);
      } else {
        showMessage(text[state.language].autocompleteLoading);
      }

      try {
        const items = await findPlacesWithFallback(
          query,
          6,
          abortController.signal
        );

        render([...favoriteMatches, ...items]);
      } catch (error) {
        if (error.name === "AbortError") return;
        console.error(error);
        if (!favoriteMatches.length) {
          showMessage(text[state.language].autocompleteError);
        }
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

    const wireController = controller => {
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

        if (isRoutePointInput(input) && !input.value.trim()) {
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
    };

    for (const controller of controllers) {
      wireController(controller);
    }

    // Pozwala window.OMAP_ROUTE?.renderRouteWaypoints() podpiąć podpowiedzi wyszukiwania do
    // pól przystanków tworzonych dynamicznie, już po inicjalizacji.
    registerRouteWaypointAutocomplete = (input, waypointId) => {
      wireController({
        input,
        onSelect: result => {
          const point = resultToRoutePoint(result);
          const index = state.routeWaypoints.findIndex(
            item => item.id === waypointId
          );
          if (index === -1) return;

          state.routeWaypoints[index] = { ...point, id: waypointId };
          input.value = point.label;
          hide();
          window.OMAP_ROUTE?.refreshWaypointMarkers();

          if (state.routePointA && state.routePointB) {
            calculateRouteFromStoredPoints();
          }
        }
      });
    };

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
      // Cleanup listeners to prevent memory leak
      window.removeEventListener("resize", positionList);
      window.removeEventListener("scroll", positionList, true);
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
    // Publiczna instancja Photon wspiera TYLKO: default, de, en, fr.
    // state.language bywa "pl", ktore Photon odrzuca bledem 400 -
    // ten sam blad co w search-v2/providers/photon.js.
    const SUPPORTED_PHOTON_LANGS = ["de", "en", "fr"];
    url.searchParams.set(
      "lang",
      SUPPORTED_PHOTON_LANGS.includes(state.language)
        ? state.language
        : "default"
    );

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

  function sortByOrder(list, order, getLabel) {
    const arr = [...list];
    const locale = state.language === "pl" ? "pl" : "en";
    switch (order) {
      case "oldest":
        return arr.reverse();
      case "az":
        return arr.sort((a, b) => getLabel(a).localeCompare(getLabel(b), locale));
      case "za":
        return arr.sort((a, b) => getLabel(b).localeCompare(getLabel(a), locale));
      case "newest":
      default:
        return arr;
    }
  }

  // Nominatim zwraca nazwę województwa małą literą (np. "pomorskie"),
  // co jest poprawne gramatycznie w zdaniu, ale wygląda niespójnie
  // jako samodzielna etykieta w interfejsie. Kapitalizujemy tylko
  // pierwszą literę, nic więcej.
  function capitalizeFirstLetter(value) {
    const text = String(value || "");
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
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

    const voivodeship = capitalizeFirstLetter(
      result.voivodeship ||
      result.teryt?.voivodeship ||
      address.state ||
      ""
    );

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

    const place = capitalizeFirstLetter(
      city ||
      result.name ||
      address.state ||
      address.county ||
      ""
    );

    if (place) {
      const secondary = capitalizeFirstLetter(
        address.state ||
        address.county ||
        address.country
      );

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


  const mobilePanelMode = new Map();

  // Centralny rejestr wszystkich paneli mobilnych typu "arkusz z
  // dołu ekranu". Każdy nowy panel dodajemy TYLKO tutaj - reszta
  // kodu (zamykanie pozostałych przy otwieraniu jednego) działa
  // automatycznie, bez potrzeby ręcznego dopisywania go w wielu
  // miejscach w pliku.
  const MOBILE_PANELS = [
    { id: "route", close: () => window.OMAP_ROUTE?.closeRoute(), panel: el.routePanel, cssVariable: "--sheet-height" },
    { id: "discover", close: () => closeDiscover(), panel: el.discoverPanel, cssVariable: "--sheet-height" },
    { id: "menu", close: () => closeMenu(), panel: el.menuPanel, cssVariable: "--sheet-height" },
    { id: "favorites", close: () => window.OMAP_FAVORITES?.closeFavoritesPanel(), panel: el.favoritesPanel, cssVariable: "--sheet-height" },
    { id: "history", close: () => closeHistory(), panel: el.historyPanel, cssVariable: "--sheet-height" },
    { id: "place", close: () => closePlacePanel(), panel: el.placePanel, cssVariable: "--sheet-height" },
    { id: "trip", close: () => closeTrip(), panel: el.tripPanel, cssVariable: "--sheet-height" },
    // Widok uliczny celowo nie zwija się przy kliknięciu na mapę -
    // tam kliknięcie w mapę służy do zmiany lokalizacji widoku, nie
    // do odrzucenia panelu.
    { id: "streetview", close: () => window.OMAP_STREETVIEW?.close(), collapsible: false },
    { id: "legend", close: () => closeLegend(), panel: el.legendPanel, cssVariable: "--sheet-height" },
    { id: "labels", close: () => closeLabels(), panel: el.labelsPanel, cssVariable: "--sheet-height" },
    { id: "tradingSunday", close: () => window.OMAP_TRADING_SUNDAY?.close(), panel: el.tradingSundayPanel, cssVariable: "--sheet-height" },
    { id: "about", close: () => closeAbout(), panel: el.aboutPanel, cssVariable: "--sheet-height" },
    { id: "backup", close: () => closeBackup(), panel: el.backupPanel, cssVariable: "--sheet-height" },
    { id: "account", close: () => window.OMAP_ACCOUNT?.closeAccount(), panel: el.accountPanel, cssVariable: "--sheet-height" }
  ];

  function closeOtherMobilePanels(exceptIds) {
    const keep = new Set(
      Array.isArray(exceptIds) ? exceptIds : [exceptIds]
    );

    for (const entry of MOBILE_PANELS) {
      if (keep.has(entry.id)) continue;
      try {
        entry.close();
      } catch (error) {
        console.error(error);
      }
    }
  }

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

  function initializeRouteBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.routePanel,
      handle: el.routeSheetHandle,
      close: window.OMAP_ROUTE?.closeRoute,
      cssVariable: "--sheet-height"
    });
  }

  function initializeDiscoverBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.discoverPanel,
      handle: el.discoverSheetHandle,
      close: closeDiscover,
      cssVariable: "--sheet-height"
    });
  }

  function initializeMenuBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.menuPanel,
      handle: el.menuSheetHandle,
      close: closeMenu,
      cssVariable: "--sheet-height"
    });
  }

  function initializeFavoritesBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.favoritesPanel,
      handle: el.favoritesSheetHandle,
      close: window.OMAP_FAVORITES?.closeFavoritesPanel,
      cssVariable: "--sheet-height"
    });
  }

  function initializeHistoryBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.historyPanel,
      handle: el.historySheetHandle,
      close: closeHistory,
      cssVariable: "--sheet-height"
    });
  }

  function initializePlaceBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.placePanel,
      handle: el.placeSheetHandle,
      close: closePlacePanel,
      cssVariable: "--sheet-height"
    });
  }

  function initializeTripBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.tripPanel,
      handle: el.tripSheetHandle,
      close: closeTrip,
      cssVariable: "--sheet-height"
    });
  }

  function initializeStreetviewBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.streetviewPanel,
      handle: el.streetviewSheetHandle,
      close: window.OMAP_STREETVIEW?.close,
      cssVariable: "--sheet-height"
    });
  }

  function initializeLegendBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.legendPanel,
      handle: el.legendSheetHandle,
      close: closeLegend,
      cssVariable: "--sheet-height"
    });
  }

  function initializeLabelsBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.labelsPanel,
      handle: el.labelsSheetHandle,
      close: closeLabels,
      cssVariable: "--sheet-height"
    });
  }

  function initializeTradingSundayBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.tradingSundayPanel,
      handle: el.tradingSundaySheetHandle,
      close: window.OMAP_TRADING_SUNDAY?.close,
      cssVariable: "--sheet-height"
    });
  }

  function initializeAboutBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.aboutPanel,
      handle: el.aboutSheetHandle,
      close: closeAbout,
      cssVariable: "--sheet-height"
    });
  }

  function initializeBackupBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.backupPanel,
      handle: el.backupSheetHandle,
      close: closeBackup,
      cssVariable: "--sheet-height"
    });
  }

  function initializeAccountBottomSheet() {
    window.OMAP_BOTTOM_SHEET?.initialize({
      panel: el.accountPanel,
      handle: el.accountSheetHandle,
      close: window.OMAP_ACCOUNT?.closeAccount,
      cssVariable: "--sheet-height"
    });
  }


  function toggleDiscover() {
    closeMapContextMenu();
    if (!el.discoverPanel) return;
    const shouldOpen = el.discoverPanel.hidden;

    closeOtherMobilePanels("discover");
    closeDiscover();

    el.discoverPanel.hidden = !shouldOpen;
    if (shouldOpen) {
      openMobilePanelStandard(el.discoverPanel, "--sheet-height");
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
    closeMapContextMenu();
    closeOtherMobilePanels("discover");

    map.flyTo({
      center: [lngLat.lng, lngLat.lat],
      zoom: Math.max(map.getZoom(), 15)
    });

    state.discoverBackContext = { place, lngLat };
    if (el.discoverBack) el.discoverBack.hidden = false;

    openMobilePanelStandard(el.discoverPanel, "--sheet-height");
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
    if (!el.discoverPanel || el.discoverPanel.hidden) return;

    if (clearResults) {
      window.OMAP_DISCOVER?.clear();
    }

    state.discoverBackContext = null;
    if (el.discoverBack) el.discoverBack.hidden = true;

    el.discoverPanel.hidden = true;
    el.discoverButton?.setAttribute("aria-expanded", "false");
    el.discoverButton?.classList.remove("is-active");
    el.mobileDiscoverButton?.setAttribute("aria-expanded", "false");
    el.mobileDiscoverButton?.classList.remove("is-active");
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

    // Schemat OpenMapTiles (styl "liberty") oznacza kazdy POI polem
    // "rank" - rosnaco wedlug WAZNOSCI w danej okolicy (rank=1 to
    // najwazniejszy obiekt w pobliskiej siatce, wyzsze numery to
    // drobiazgi typu pojedynczy sklep czy toaleta). Sama odleglosc w
    // pikselach myli sie w duzych obszarowo miejscach (centrum
    // handlowe, stadion) - konkretny sklep czy toaleta W SRODKU
    // takiego miejsca czesto wypada pikselowo blizej kliknieccia niz
    // etykieta samego centrum/stadionu. Dlatego liczymy polaczony
    // wynik: odleglosc + kara za wysoki (mniej wazny) rank, zeby
    // bliski-ale-nieistotny szczegol nie wygrywal z nieco dalszym, ale
    // znacznie wazniejszym duzym obiektem.
    const RANK_PENALTY_PER_STEP = 2; // px "kary" na kazdy stopien rankingu
    const DEFAULT_RANK = 10; // neutralna wartosc dla obiektow bez pola rank

    let closest = null;
    let closestScore = Infinity;

    for (const feature of features) {
      if (feature.geometry?.type !== "Point") continue;
      if (!feature.properties?.name) continue;

      const [lon, lat] = feature.geometry.coordinates;
      const featurePoint = map.project([lon, lat]);
      const distance = Math.hypot(
        featurePoint.x - point.x,
        featurePoint.y - point.y
      );

      const rank = Number.isFinite(Number(feature.properties?.rank))
        ? Number(feature.properties.rank)
        : DEFAULT_RANK;
      const score = distance + rank * RANK_PENALTY_PER_STEP;

      if (score < closestScore) {
        closestScore = score;
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

  // Wspoldzielona logika miedzy menu kontekstowym ("Informacje o tym
  // miejscu") a bezposrednim kliknieciem lewym przyciskiem w POI na
  // mapie (jak w komercyjnych mapach - klik w ikone/etykiete miejsca
  // od razu otwiera informacje, bez potrzeby menu kontekstowego).
  //
  // fallbackLngLat: gdy nic nie znaleziono w danym punkcie ekranu -
  // menu kontekstowe i tak pokazuje info o surowym kliknietym punkcie
  // (uzytkownik jawnie o to poprosil), ale zwykle kliknięcie w PUSTE
  // miejsce na mapie ma NIC nie pokazywac (tak jak w Google Maps) -
  // stad brak fallbacku przy wywolaniu z handleMapClick.
  async function showPoiInfoAtScreenPoint(screenPoint, options = {}) {
    const { fallbackLngLat = null, origin = "map-click" } = options;

    const poi = findNearestPoiFeature(screenPoint);
    if (!poi && !fallbackLngLat) {
      return false;
    }

    let localCity = null;
    try {
      const looksLikePlaceLabel =
        poi &&
        poi.sourceLayer === "place" &&
        !/rail|station|stop|dworzec|przystanek|airport|lotnisko/i.test(
          poi.featureClass || ""
        );

      localCity = looksLikePlaceLabel
        ? findLocalCityByName(poi.name, {
            lat: poi.lat,
            lng: poi.lon
          })
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
      return true;
    }

    // POPRAWKA: gdy znaleziono nazwany obiekt w warstwie wektorowej
    // (centrum handlowe, stadion, itp.) ktory NIE jest etykieta
    // miasta - pokazujemy JEGO WLASNA nazwe bezposrednio. Wczesniej
    // ten przypadek spadal do openMapInformationThroughService, ktora
    // CALKOWICIE ODRZUCA nazwe poi i robi wlasne, niezalezne
    // odwrotne geokodowanie po samych wspolrzednych - a to potrafilo
    // trafic w zupelnie inny, mniejszy obiekt (np. konkretny sklep czy
    // wejscie zamiast calego centrum handlowego), mimo ze
    // findNearestPoiFeature juz poprawnie znalazlo wlasciwa nazwe.
    if (poi) {
      closeMapContextMenu();

      // WAZNE: jeden, ten sam obiekt lngLat (zwykly {lat,lng}, NIE
      // maplibregl.LngLat) przekazywany do OBU wywolan ponizej - tak
      // samo jak w sprawdzonym kodzie ponownego otwierania
      // ocenionych/ulubionych miejsc. state.placePanelLngLat === lngLat
      // to porownanie REFERENCJI obiektu - gdyby kazde wywolanie
      // tworzylo wlasny nowy obiekt (jak robi to showSelectedPlaceInformation
      // przez getResultLngLat), to porownanie nigdy nie byloby prawdziwe
      // i wzbogacenie w tle nigdy by sie nie zastosowalo.
      const lngLat = { lat: poi.lat, lng: poi.lon };
      const minimalPlace = {
        place_id: `map-vector:${poi.lon.toFixed(6)},${poi.lat.toFixed(6)}`,
        name: poi.name,
        display_name: poi.name,
        lat: poi.lat,
        lon: poi.lon,
        class: poi.featureClass || "place",
        type: poi.featureClass || "place",
        category: poi.featureClass || "place",
        address: {},
        extratags: {}
      };

      // Pokazujemy od razu (bez czekania na siec) - nazwa jest juz
      // poprawna, bo pochodzi z wektorowej warstwy mapy. W tle
      // dociagamy bogate dane (kategoria, Wikipedia, strona) przez
      // WYSZUKANIE PO NAZWIE w poblizu (fetchPlaceByNameNear) -
      // proba przez odwrotne geokodowanie WSPOLRZEDNYCH
      // (fetchPlaceByReverseAtZoom) regularnie lapala przypadkowy
      // maly obiekt obok (przystanek, wejscie) zamiast duzego,
      // obszarowego miejsca - wyszukanie po NAZWIE eliminuje to, bo
      // przypadkowy inny obiekt musialby miec (prawie) taka sama
      // nazwe. Bezpiecznik na wypadek gdyby jednak trafilo w cos
      // innego jest nizej (sprawdzenie podobienstwa nazw).
      openKnownPlaceOnMap(minimalPlace, lngLat);

      fetchPlaceByNameNear(poi.name, poi.lat, poi.lon)
        .then(fullPlace => {
          if (
            !fullPlace ||
            state.placePanelLngLat !== lngLat ||
            el.placePanel?.hidden
          ) {
            return;
          }

          // BEZPIECZNIK: fetchPlaceByReverseAtZoom robi odwrotne
          // geokodowanie po WSPOLRZEDNYCH - dokladnie ten sam rodzaj
          // zapytania, ktory wczesniej (przez openMapInformationThroughService)
          // potrafil trafic w inny, mniejszy obiekt (sklep, wejscie)
          // zamiast duzego, obszarowego miejsca (centrum handlowe,
          // stadion). Zanim NADPISZEMY juz poprawnie pokazana nazwe
          // tym wzbogaconym wynikiem, sprawdzamy czy nazwy w ogole
          // sa do siebie podobne - jesli reverse-geocoding zlapal
          // cos zupelnie innego, zostawiamy minimalny (ale poprawny)
          // widok bez dodatkowych danych, zamiast pokazac zly obiekt.
          const fullPlaceName =
            fullPlace.namedetails?.["name:pl"] ||
            fullPlace.namedetails?.name ||
            fullPlace.name ||
            String(fullPlace.display_name || "").split(",")[0];

          const similarity = stringSimilarity(
            normalizeSearchText(poi.name),
            normalizeSearchText(fullPlaceName)
          );

          if (similarity < 0.5) {
            console.warn(
              `Wzbogacenie odrzucone - reverse geocoding zwrocil "${fullPlaceName}" zamiast oczekiwanego "${poi.name}" (podobienstwo ${similarity.toFixed(2)})`
            );
            return;
          }

          openKnownPlaceOnMap(fullPlace, lngLat);
        })
        .catch(error => {
          console.error("Nie udało się dociągnąć pełnych danych miejsca:", error);
        });

      return true;
    }

    const targetLngLat = fallbackLngLat;

    if (!targetLngLat) return false;

    await openMapInformationThroughService(targetLngLat, { origin });
    return true;
  }

  function findLocalCityByName(name, clickedPoint) {
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

    // Dopasowanie samej nazwy nie wystarcza - ta sama nazwa może
    // należeć zarówno do dzielnicy jednego miasta, jak i zupełnie
    // innej, niepowiązanej miejscowości setki km dalej (np. Chełm
    // w Gdańsku vs miasto Chełm). Odrzucamy dopasowanie, jeśli jest
    // zbyt daleko od miejsca, w które faktycznie kliknięto.
    const maxDistanceDegrees = 0.3; // ok. 30 km

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

      if (!names.includes(target)) continue;

      if (clickedPoint) {
        const distance = Math.hypot(
          city.lat - clickedPoint.lat,
          city.lon - clickedPoint.lng
        );
        if (distance > maxDistanceDegrees) continue;
      }

      return city;
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
      await window.OMAP_ROUTE?.setContextPointAsRoute("a", lngLat);
      return;
    }

    if (action === "route-b") {
      await window.OMAP_ROUTE?.setContextPointAsRoute("b", lngLat);
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

      await showPoiInfoAtScreenPoint(state.contextMenuPoint, {
        fallbackLngLat: lngLat,
        origin: "map-context-menu"
      });

      return;
    }

    if (action === "favorite") {
      await window.OMAP_FAVORITES?.addContextPointToFavorites(lngLat);
    }
  }


  function collapseMobilePanel(panel, cssVariable) {
    if (!panel || panel.hidden) return;
    collapseMobilePanelStandard(panel, cssVariable);
  }


  function collapseMobilePanels() {
    for (const entry of MOBILE_PANELS) {
      if (entry.collapsible === false) continue;
      if (!entry.panel || !entry.cssVariable) continue;
      collapseMobilePanel(entry.panel, entry.cssVariable);
    }
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
    
    // Zwijamy panele i natychmiast odświeżamy wymiary mapy,
    // aby kliknięcie nie miało przesunięcia w pikselach
    collapseMobilePanels();
    if (map && typeof map.resize === "function") {
      map.resize();
    }

    if (state.measureModeActive) {
      if (state.measureIsArea) {
        window.OMAP_MEASURE?.addAreaPoint(event.lngLat);
      } else {
        window.OMAP_MEASURE?.addPoint(event.lngLat);
      }
      return;
    }

if (!el.routePanel.hidden) {
      // 1. Obsługujemy kliknięcie na mapie (stawianie punktu A, punktu B lub przesuwanie)
      await window.OMAP_ROUTE?.handleRouteMapClick(event);

      // 2. Niezależnie od tego, czy to pierwsze, czy kolejne kliknięcie:
      // ZWIJAMY PANEL, aby odsłonić mapę
      window.OMAP_ROUTE?.collapseMobileRoutePanel();

      return;
    }

    // Zwykłe kliknięcie (bez trybu pomiaru/tras) w konkretny punkt/
    // etykietę na mapie - tak jak w komercyjnych mapach, klik w
    // widoczny POI od razu otwiera informacje o nim, bez potrzeby
    // menu kontekstowego. Kliknięcie w puste miejsce mapy (poi=null,
    // brak fallbackLngLat) świadomie NIC nie pokazuje.
    await showPoiInfoAtScreenPoint(event.point, {
      origin: "map-click"
    });
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
const placeTitle = details.name || (typeof getPrimaryPlaceName === "function" ? getPrimaryPlaceName(details) : "") || String(details.display_name || "").split(",")[0];
  if (placeTitle && !state.isRestoringFromPopstate) {
    window.OMAP_URL_STATE?.setPlaceUrl({
      label: placeTitle,
      lat: lngLat.lat,
      lon: lngLat.lng,
      osmType: details.osm_type,
      osmId: details.osm_id
    });
  }

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

    // Resize map canvas to account for any DOM layout shifts (e.g., geolocation UI)
    if (typeof map.resize === "function") {
      map.resize();
    }

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

    // Przeliczenie dowolnego formatu na czystą tablicę [lon, lat]
    let coords;
    if (Array.isArray(lngLat)) {
      coords = [Number(lngLat[0]), Number(lngLat[1])];
    } else if (typeof lngLat === "object") {
      const lng = lngLat.lng ?? lngLat.lon;
      const lat = lngLat.lat;
      coords = [Number(lng), Number(lat)];
    }

    if (!coords || isNaN(coords[0]) || isNaN(coords[1])) return;

    if (!state.userLocationMarker) {
      state.userLocationMarker = new maplibregl.Marker({
        element: createUserLocationMarkerElement(),
        anchor: "center"
      });
    }

    // Ustawiamy pozycję bezpośrednio z tablicy
    state.userLocationMarker
      .setLngLat(coords)
      .addTo(map);
  }

  function removeUserLocationMarker() {
    state.userLocationMarker?.remove();
    state.userLocationMarker = null;
  }


  function normalizeMobilePlacePanelHeight() {
    openMobilePanelStandard(
      el.placePanel,
      "--sheet-height"
    );
  }

  let placePanelViewportTimer = null;

  function stabilizeMobilePlacePanelHeight() {
    stabilizeMobilePanelStandard(
      el.placePanel,
      "--sheet-height"
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
      "--sheet-height"
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
    () => window.OMAP_FAVORITES?.openFavoritesPanel()
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
    closeOtherMobilePanels(["place", "discover"]);
    closeDiscover(
      state.placePanelReturnTarget?.type !== "discover"
    );

    if (!el.placePanel) return;

    openMobilePanelStandard(
      el.placePanel,
      "--sheet-height"
    );
  }

  function closePlacePanel() {
    closeTrip();
    document.title = "Odwrotna Mapa";
    updateMetaDescription(DEFAULT_META_DESCRIPTION);
    window.OMAP_URL_STATE?.clearPlaceUrl();
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
  // Otwiera panel miejsca Z GOTOWYMI danymi (bez żadnego wyszukiwania
  // w sieci) - dokładnie ta sama sekwencja co przy kliknięciu na
  // mapę (showPlaceInformation), tylko pomijamy fetchPlaceInformation
  // (odwrotne geokodowanie), które i tak zwróciłoby cokolwiek innego
  // najbliższego tym współrzędnym, a nie dokładnie to miejsce.
  function openKnownPlaceOnMap(place, lngLat) {
    window.OMAP_SEARCH_SESSION?.cancel?.();
    state.tripOriginStack = [];
    state.tripContextStack = [];
    state.selectedPlace = null;
    state.placeRequestController?.abort();
    state.placeRequestController = null;
    state.placePanelLngLat = lngLat;

    showSelectedPlaceMarker(lngLat);
    openPlacePanel();

    if (el.placePanelContent) {
      el.placePanelContent.replaceChildren(
        createPlaceCard(place, lngLat)
      );
    }

    state.selectedPlace = place;
    stabilizeMobilePlacePanelHeight();

    if (!state.isRestoringFromPopstate) {
      const title = place.name || place.display_name?.split(",")[0] || "";
      if (title) {
        window.OMAP_URL_STATE?.setPlaceUrl({
          label: title,
          lat: lngLat.lat,
          lon: lngLat.lng,
          osmType: place.osm_type,
          osmId: place.osm_id
        });
      }
    }

    el.placePanel?.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function showPlaceInformation(event) {
    window.OMAP_SEARCH_SESSION?.cancel?.();
    clearPlacePanelReturnTarget();
    state.tripOriginStack = [];
    state.tripContextStack = [];

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
      let place = null;

      // Gdy wywolujacy zna juz nazwe miejsca (np. wejscie z linku
      // udostepnionego/sitemap, gdzie ?q= niesie nazwe) - probujemy
      // NAJPIERW znalezc je po nazwie (fetchPlaceByNameNear), tym
      // samym mechanizmem co przy kliknieciu w mape. Czyste odwrotne
      // geokodowanie po samych wspolrzednych (fetchPlaceInformation)
      // regularnie lapalo przypadkowy maly obiekt obok zamiast
      // wlasciwego miejsca dla duzych, obszarowych lokalizacji.
      if (event.knownName) {
        const nameMatch = await fetchPlaceByNameNear(
          event.knownName,
          event.lngLat.lat,
          event.lngLat.lng,
          state.placeRequestController.signal
        ).catch(error => {
          console.error(`fetchPlaceByNameNear blad dla "${event.knownName}":`, error);
          return null;
        });

        if (nameMatch) {
          const matchName =
            nameMatch.namedetails?.["name:pl"] ||
            nameMatch.namedetails?.name ||
            nameMatch.name ||
            String(nameMatch.display_name || "").split(",")[0];
          const similarity = stringSimilarity(
            normalizeSearchText(event.knownName),
            normalizeSearchText(matchName)
          );
          console.log(
            `[showPlaceInformation] knownName="${event.knownName}" -> nameMatch="${matchName}" (podobienstwo ${similarity.toFixed(2)})`
          );
          if (similarity >= 0.5) {
            place = nameMatch;
          } else {
            console.warn(
              `[showPlaceInformation] odrzucono nameMatch - podobienstwo za niskie, spada do reverse geocode`
            );
          }
        } else {
          console.warn(
            `[showPlaceInformation] fetchPlaceByNameNear nie zwrocil zadnego wyniku dla "${event.knownName}", spada do reverse geocode`
          );
        }
      }

      if (!place) {
        console.log("[showPlaceInformation] uzywam fetchPlaceInformation (reverse geocode po wspolrzednych)");
        place = await fetchPlaceInformation(
          event.lngLat.lng,
          event.lngLat.lat,
          state.placeRequestController.signal
        );
      }

      // Dopisanie nazwy miejsca i współrzędnych do adresu URL (?q=&p=)
      if (place && !state.isRestoringFromPopstate) {
        const title = place.name || place.display_name?.split(',')[0] || (typeof getPrimaryPlaceName === "function" ? getPrimaryPlaceName(place) : null);
        if (title) {
          window.OMAP_URL_STATE?.setPlaceUrl({
            label: title,
            lat: event.lngLat.lat,
            lon: event.lngLat.lng,
            osmType: place.osm_type,
            osmId: place.osm_id
          });
        }
      }

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

      // Zapisujemy pobrane miejsce w stanie - bez tego funkcje takie jak
      // powrót z panelu rozkładu (returnFromTripToPlace) nie mają skąd
      // odtworzyć tego panelu i pokazują pusty widok.
      state.selectedPlace = place;

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

  // Nominatim (odwrotne geokodowanie) zwraca tylko JEDEN, najbliższy
  // obiekt w danym punkcie - jeśli to coś drobnego (np. defibrylator
  // zamontowany na ścianie sklepu), nie ma sposobu żeby poprosić je
  // o "następny najbliższy". Overpass API zapytane wprost o nazwane
  // punkty w małym promieniu potrafi znaleźć faktyczny sklep/budynek
  // pod spodem.
  async function fetchNearbyNamedPoiViaOverpass(lat, lon, signal) {
    const radiusMeters = 25;
    const query = `[out:json][timeout:10];(nwr["shop"]["name"](around:${radiusMeters},${lat},${lon});nwr["amenity"]["name"](around:${radiusMeters},${lat},${lon});nwr["office"]["name"](around:${radiusMeters},${lat},${lon});nwr["tourism"]["name"](around:${radiusMeters},${lat},${lon}););out center tags;`;

    // Darmowe, publiczne serwery Overpass mają limity zapytań na IP -
    // przy odrzuceniu (np. 429) próbujemy kolejnego niezależnego
    // lustra, zanim się poddamy.
    const endpoints = [
      "https://overpass-api.de/api/interpreter",
      "https://overpass.kumi.systems/api/interpreter",
      "https://overpass.private.coffee/api/interpreter"
    ];

    let lastError = null;
    let data = null;

    for (const endpoint of endpoints) {
      const attemptController = new AbortController();
      const timeoutId = setTimeout(
        () => attemptController.abort(),
        5000
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
        lastError = error;
        console.warn(`Overpass endpoint failed, trying next.`, error);
      } finally {
        clearTimeout(timeoutId);
        signal?.removeEventListener("abort", onOuterAbort);
      }
    }

    if (!data) {
      throw lastError || new Error("Wszystkie serwery Overpass zawiodły.");
    }

    const elements = (data.elements || []).filter(
      element => element.tags?.name && !element.tags?.emergency
    );

    if (!elements.length) return null;

    const distanceMeters = (elementLat, elementLon) => {
      const dLat = ((elementLat - lat) * Math.PI) / 180;
      const dLon = ((elementLon - lon) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat * Math.PI) / 180) *
          Math.cos((elementLat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    elements.sort((a, b) => {
      const aLat = a.center?.lat ?? a.lat;
      const aLon = a.center?.lon ?? a.lon;
      const bLat = b.center?.lat ?? b.lat;
      const bLon = b.center?.lon ?? b.lon;
      return (
        distanceMeters(aLat, aLon) - distanceMeters(bLat, bLon)
      );
    });

    const nearest = elements[0];
    return {
      name: nearest.tags.name,
      shop: nearest.tags.shop,
      amenity: nearest.tags.amenity,
      office: nearest.tags.office,
      tourism: nearest.tags.tourism
    };
  }

  // Fallback dla wpisów bez osm_type/osm_id (np. miasta z lokalnego
  // indeksu miast, albo charakterystyczne miejsca z indeksu "named
  // POI" - żadne z tych dwóch źródeł w ogóle nie przypisuje
  // identyfikatorów OSM) - reverse geocoding, ale ze SZTYWNYM,
  // dobranym poziomem przybliżenia (zoom w skali Nominatim), zamiast
  // domyślnego maksimum, które łapało przypadkowy sklep/restaurację
  // obok zamiast właściwego miejsca.
  async function fetchPlaceByReverseAtZoom(lat, lon, zoom, signal) {
    const requestUrl = new URL(CONFIG.search.reverseEndpoint);
    requestUrl.searchParams.set("lat", String(lat));
    requestUrl.searchParams.set("lon", String(lon));
    requestUrl.searchParams.set("format", "jsonv2");
    requestUrl.searchParams.set("addressdetails", "1");
    requestUrl.searchParams.set("extratags", "1");
    requestUrl.searchParams.set("namedetails", "1");
    requestUrl.searchParams.set("accept-language", state.language);
    requestUrl.searchParams.set("zoom", String(zoom));

    const response = await fetch(requestUrl, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Nominatim reverse (zoom ${zoom}) HTTP ${response.status}`);
    return response.json();
  }

  // W przeciwieństwie do fetchPlaceInformation (reverse - "co jest
  // najbliżej tych współrzędnych") to pyta o KONKRETNY, znany obiekt
  // OSM po jego typie+id - zero niejednoznaczności, a mimo to daje
  // te same bogate dane (kategoria, Wikipedia, strona itd.).
  async function fetchPlaceByOsmId(osmType, osmId, signal) {
    const prefix = { node: "N", way: "W", relation: "R" }[osmType];
    if (!prefix || !osmId) return null;

    const requestUrl = new URL(
      CONFIG.search.reverseEndpoint.replace(/\/reverse$/, "/lookup")
    );
    requestUrl.searchParams.set("osm_ids", `${prefix}${osmId}`);
    requestUrl.searchParams.set("format", "jsonv2");
    requestUrl.searchParams.set("addressdetails", "1");
    requestUrl.searchParams.set("extratags", "1");
    requestUrl.searchParams.set("namedetails", "1");
    requestUrl.searchParams.set("accept-language", state.language);

    const response = await fetch(requestUrl, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Nominatim lookup HTTP ${response.status}`);

    const results = await response.json();
    return Array.isArray(results) && results.length ? results[0] : null;
  }

  // Alternatywa dla fetchPlaceByReverseAtZoom - zamiast pytac "co jest
  // DOKLADNIE w tym punkcie" (co dla duzych obszarowo miejsc typu
  // centrum handlowe/stadion regularnie trafia w mniejszy obiekt obok,
  // np. przystanek czy wejscie), pytamy "znajdz mi COS O TEJ NAZWIE w
  // poblizu tego punktu" - poszukiwanie po nazwie samo w sobie
  // eliminuje przypadkowe trafienia w zupelnie inny obiekt, bo ten
  // inny obiekt musialby miec (prawie) taka sama nazwe.
  async function fetchPlaceByNameNear(name, lat, lon, signal) {
    if (!name) return null;

    const delta = 0.01; // ok. 1km w kazda strone
    const requestUrl = new URL(
      CONFIG.search.reverseEndpoint.replace(/\/reverse$/, "/search")
    );
    requestUrl.searchParams.set("q", name);
    requestUrl.searchParams.set("format", "jsonv2");
    requestUrl.searchParams.set("addressdetails", "1");
    requestUrl.searchParams.set("extratags", "1");
    requestUrl.searchParams.set("namedetails", "1");
    requestUrl.searchParams.set("accept-language", state.language);
    requestUrl.searchParams.set("limit", "5");
    requestUrl.searchParams.set(
      "viewbox",
      `${lon - delta},${lat + delta},${lon + delta},${lat - delta}`
    );
    requestUrl.searchParams.set("bounded", "1");

    const response = await fetch(requestUrl, {
      signal,
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) throw new Error(`Nominatim search HTTP ${response.status}`);

    const results = await response.json();
    if (!Array.isArray(results) || !results.length) return null;

    let closest = results[0];
    let closestDistance = Infinity;
    for (const result of results) {
      const distance = Math.hypot(
        Number(result.lat) - lat,
        Number(result.lon) - lon
      );
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = result;
      }
    }
    return closest;
  }

  async function fetchPlaceInformation(lon, lat, signal) {
    const buildUrl = (zoomValue) => {
      const requestUrl = new URL(CONFIG.search.reverseEndpoint);
      requestUrl.searchParams.set("lat", String(lat));
      requestUrl.searchParams.set("lon", String(lon));
      requestUrl.searchParams.set("format", "jsonv2");
      requestUrl.searchParams.set("addressdetails", "1");
      requestUrl.searchParams.set("extratags", "1");
      requestUrl.searchParams.set("namedetails", "1");
      requestUrl.searchParams.set("accept-language", state.language);
      requestUrl.searchParams.set("zoom", String(zoomValue));
      return requestUrl;
    };

    const runQuery = async (zoomValue) => {
      const response = await fetch(buildUrl(zoomValue), {
        signal,
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Nominatim reverse HTTP ${response.status}`);
      }

      return response.json();
    };

    // Poziom szczegółowości odpowiedzi Nominatim dopasowany do
    // aktualnego przybliżenia mapy - przy dużym oddaleniu chcemy
    // nazwy województwa/kraju, nie najbliższego drobnego obiektu
    // (np. parkingu). Celowo pomijamy pośrednie poziomy powiatu i
    // gminy - przy średnim oddaleniu wolimy od razu przeskoczyć do
    // miasta, zamiast zatrzymywać się na tych szczeblach.
    const mapZoom = Math.round(map.getZoom());
    let reverseZoom;
    if (mapZoom <= 5) {
      reverseZoom = 3; // kraj
    } else if (mapZoom <= 7) {
      reverseZoom = 5; // województwo
    } else if (mapZoom <= 14) {
      reverseZoom = 14; // miasto / dzielnica - pozwala Nominatim naturalnie wybrać dzielnicę jako główny wynik
    } else {
      reverseZoom = 18; // blisko - maksymalna szczegółowość, żeby złapać konkretny sklep/paczkomat
    }

    const place = await runQuery(reverseZoom);

    // Niektóre kraje (np. Ukraina, Rosja, Szwecja, Dania) nie
    // wypełniają w odpowiedzi żadnego pola adresu na poziomie
    // miasta/miejscowości - zamiast tego mają tylko szerszą
    // jednostkę (gmina/hromada/rejon). W takim wypadku dopiero
    // wtedy robimy drugie zapytanie, sztywno na poziomie miasta wg
    // Nominatim. Dla krajów, gdzie pierwsze zapytanie już zwraca
    // prawdziwe miasto, ten dodatkowy koszt w ogóle nie występuje.
    const hasSettlementField =
      reverseZoom >= 10 &&
      (place.address?.city ||
        place.address?.town ||
        place.address?.village ||
        place.address?.hamlet);

    if (reverseZoom >= 10 && !hasSettlementField) {
      try {
        const fallbackPlace = await runQuery(10);
        const fallbackCity =
          fallbackPlace.address?.city ||
          fallbackPlace.address?.town ||
          fallbackPlace.address?.village ||
          fallbackPlace.address?.hamlet;

        if (fallbackCity) {
          place.address = place.address || {};
          place.address.city = fallbackCity;
        }
      } catch (error) {
        console.warn("Fallback reverse geocoding failed.", error);
      }
    }

    const isDefibrillatorPrimary =
      place.type === "defibrillator" ||
      place.category === "defibrillator" ||
      (place.class === "emergency" && place.type === "defibrillator");

    if (reverseZoom >= 15 && isDefibrillatorPrimary) {
      try {
        const nearby = await fetchNearbyNamedPoiViaOverpass(lat, lon, signal);

        if (nearby) {
          place.name = nearby.name;
          place.type = nearby.shop
            ? "shop"
            : nearby.amenity || nearby.office || nearby.tourism || place.type;
          place.category = undefined;
          place.class = nearby.shop
            ? "shop"
            : nearby.amenity
              ? "amenity"
              : nearby.office
                ? "office"
                : "tourism";
          place.address = place.address || {};
          if (nearby.shop) place.address.shop = nearby.name;
          if (nearby.amenity) place.address.amenity = nearby.name;
        }
      } catch (error) {
        console.warn("Overpass fallback for defibrillator failed.", error);
      }
    }

    return place;
  }

  function createPlaceCardLegacy(place, lngLat) {
    const t = text[state.language];
    const placeNameKey = getPlaceNameKey(place, lngLat);
    const originalPlaceTitle = getPlaceTitle(place) || t.placeUnknown;
    const customName = state.customPlaceNames[placeNameKey];
    const effectivePlace = customName ? { ...place, name: customName } : place;
    document.title = buildPageTitle(effectivePlace);
    updateMetaDescription(buildPageDescription(effectivePlace));
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

    const titleButton = document.createElement("button");
    titleButton.type = "button";
    titleButton.className = "place-card-title-button";
    titleButton.textContent = state.customPlaceNames[placeNameKey] || originalPlaceTitle;
    titleButton.title = t.placeRename;
    titleButton.setAttribute("aria-label", t.placeRename);

    heading.appendChild(titleButton);

    const renameForm = document.createElement("div");
    renameForm.className = "place-card-rename-form";
    renameForm.hidden = true;
    renameForm.addEventListener("click", (e) => e.stopPropagation());
    renameForm.addEventListener("mousedown", (e) => e.stopPropagation());

    const renameInput = document.createElement("input");
    renameInput.type = "text";
    renameInput.className = "place-card-rename-input";
    renameInput.placeholder = originalPlaceTitle;
    renameInput.value = state.customPlaceNames[placeNameKey] || "";
    renameInput.addEventListener("click", (e) => e.stopPropagation());
    renameInput.addEventListener("mousedown", (e) => e.stopPropagation());

    const renameActions = document.createElement("div");
    renameActions.className = "place-card-rename-actions";

    const renameSave = document.createElement("button");
    renameSave.type = "button";
    renameSave.className = "place-card-rename-save";
    renameSave.textContent = t.favoriteSave;
    renameSave.addEventListener("click", (e) => e.stopPropagation());

    const renameCancel = document.createElement("button");
    renameCancel.type = "button";
    renameCancel.className = "place-card-rename-cancel";
    renameCancel.textContent = t.favoriteCancelEdit;
    renameCancel.addEventListener("click", (e) => e.stopPropagation());

    renameActions.append(renameSave, renameCancel);
    renameForm.append(renameInput, renameActions);

    titleButton.addEventListener("click", () => {
      renameForm.hidden = !renameForm.hidden;
      if (!renameForm.hidden) {
        // Wstaw albo custom name, albo obecną nazwę
        renameInput.value = state.customPlaceNames[placeNameKey] || titleButton.textContent || "";
        renameInput.focus();
        renameInput.select();
      }
    });

    renameCancel.addEventListener("click", () => {
      renameForm.hidden = true;
    });

    renameSave.addEventListener("click", () => {
      window.OMAP_CUSTOM_PLACE_NAMES?.setCustomPlaceName(placeNameKey, renameInput.value, originalPlaceTitle, titleButton, place, lngLat);
      renameForm.hidden = true;
    });

    renameInput.addEventListener("keydown", event => {
      if (event.key === "Enter") {
        event.preventDefault();
        renameSave.click();
      } else if (event.key === "Escape") {
        renameCancel.click();
      }
    });

    const type = document.createElement("p");
    type.className = "place-card-type";
    type.textContent = getPlaceTypeLabel(place);

    headingCopy.append(heading, renameForm);
    if (type.textContent) headingCopy.appendChild(type);
    headingRow.append(typeIcon, headingCopy);
    card.appendChild(headingRow);

    const ratingUi = window.OMAP_RATINGS?.createSection(
      window.OMAP_FAVORITES?.getFavoriteKey(place, lngLat),
      {
        label: state.customPlaceNames[placeNameKey] || originalPlaceTitle,
        lat: Number(lngLat.lat),
        lon: Number(lngLat.lng),
        osmType: place.osm_type || "",
        osmId: place.osm_id || "",
        placeType: place.type || "",
        placeSnapshot: {
          name: place.name,
          display_name: place.display_name,
          type: place.type,
          category: place.category,
          class: place.class,
          address: place.address,
          extratags: place.extratags,
          namedetails: place.namedetails
        }
      }
    );
    if (ratingUi) {
      card.appendChild(ratingUi.section);
      window.OMAP_RATINGS?.loadForPlace(window.OMAP_FAVORITES?.getFavoriteKey(place, lngLat), ratingUi);
    }

    const isNamedSettlement =
      ["city", "town", "village"].includes(
        String(place?.type || "").toLowerCase()
      ) && Boolean(place?.name);

    if (
      place?.extratags?.wikipedia ||
      place?.extratags?.wikidata ||
      isNamedSettlement
    ) {
      const wikipedia = window.OMAP_WIKIPEDIA?.createSection();
      if (wikipedia) {
        card.appendChild(wikipedia.section);
        window.OMAP_WIKIPEDIA?.loadForPlace(place, wikipedia, heading);
      }
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

    if (window.OMAP_DEPARTURES?.isTransitStop(place)) {
      const departures = window.OMAP_DEPARTURES?.createSection();
      card.appendChild(departures.section);
      window.OMAP_DEPARTURES?.loadForPlace(place, lngLat, departures);
    }

    const actions = document.createElement("div");
    actions.className = "place-card-actions";

    const favoriteKey = window.OMAP_FAVORITES?.getFavoriteKey(place, lngLat);

    actions.append(
      createPlaceAction("↪️", t.placeSetRoute, () => {
        window.OMAP_ROUTE?.setPlaceAsRoutePoint("b", place, lngLat);
      }),
      createPlaceAction("🧭", t.placeNearby, () => {
        openDiscoverNearPlace(place, lngLat);
      }),
      createPlaceAction(
        window.OMAP_FAVORITES?.isFavorite(favoriteKey) ? "★" : "☆",
        state.language === "pl"
          ? "Dodaj do ulubionych"
          : "Add to favorites",
        button => {
          if (!window.OMAP_SEED_WORDS?.getStoredSeedWords()) {
            window.OMAP_ACCOUNT?.openAccountFromMenu();
            return;
          }
          const nowFavorite = window.OMAP_FAVORITES?.toggleFavorite(
            favoriteKey,
            place,
            lngLat
          );
          button.textContent = nowFavorite ? "★" : "☆";
          button.classList.toggle("is-favorite", nowFavorite);
        },
        window.OMAP_FAVORITES?.isFavorite(favoriteKey)
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

  // Tytul strony pod SEO: "Nazwa - Adres - Miasto - Odwrotna Mapa",
  // a dla samych miast/miejscowosci (gdzie adres i miasto bylyby tym
  // samym, wiec zbedne) po prostu "Miasto - Odwrotna Mapa". Uzywa
  // tego samego rozpoznawania "to jest miasto" co reszta kodu
  // (isNamedSettlement), zeby zachowac spojnosc.
  function buildPageTitle(place) {
    const address = place?.address || {};
    const name = place?.name || "";
    const isNamedSettlement =
      ["city", "town", "village"].includes(
        String(place?.type || "").toLowerCase()
      ) && Boolean(name);

    if (isNamedSettlement) {
      return name ? `${name} - Odwrotna Mapa` : "Odwrotna Mapa";
    }

    const cityPart = address.city || address.town || address.village || "";
    const streetPart = [address.road, address.house_number]
      .filter(Boolean)
      .join(" ");

    const parts = [name, streetPart, cityPart].filter(Boolean);

    return parts.length
      ? `${parts.join(" - ")} - Odwrotna Mapa`
      : "Odwrotna Mapa";
  }

  // Domyslny opis strony (ten sam co statycznie w index.html) - do
  // przywracania po zamknieciu panelu miejsca.
  const DEFAULT_META_DESCRIPTION =
    "Odwrotna Mapa to niezależna, prywatna aplikacja mapowa oparta na OpenStreetMap. " +
    "Odwrócenie orientacji mapy to dopiero początek – platforma oferuje pełną swobodę " +
    "widoku w 3D, zaawansowane wyszukiwanie, planowanie tras, integrację ze zdjęciami " +
    "ulicznymi Mapillary oraz łatwy eksport widoków do plików PNG. Bez śledzenia, bez " +
    "reklam i w 100% Open Source.";

  // Tlumaczenie najczestszych kategorii OSM (class/type z Nominatim)
  // na czytelny polski opis do meta description. Nieznane kategorie
  // dostaja neutralny fallback "miejsce".
  const PLACE_CATEGORY_LABELS = {
    mall: "centrum handlowe",
    museum: "muzeum",
    castle: "zamek",
    attraction: "atrakcja turystyczna",
    place_of_worship: "miejsce kultu religijnego",
    airport: "lotnisko",
    stadium: "stadion",
    peak: "szczyt górski",
    monument: "pomnik",
    park: "park",
    square: "plac",
    national_park: "park narodowy",
    station: "stację",
    lake: "jezioro",
    aquarium: "akwarium",
    theatre: "teatr",
    events_venue: "obiekt widowiskowy",
    zoo: "ogród zoologiczny",
    pier: "molo",
    restaurant: "restaurację",
    cafe: "kawiarnię",
    hotel: "hotel",
    fast_food: "punkt gastronomiczny",
    supermarket: "sklep",
    shop: "sklep",
    hospital: "szpital",
    pharmacy: "aptekę",
    school: "szkołę",
    university: "uczelnię",
    bank: "bank",
    fuel: "stację paliw",
    parking: "parking",
    bar: "bar",
    pub: "pub",
    bakery: "piekarnię"
  };

  function buildPageDescription(place) {
    const name = place?.name || "";
    if (!name) return DEFAULT_META_DESCRIPTION;

    const address = place?.address || {};
    const type = String(place?.type || place?.class || "").toLowerCase();
    const isNamedSettlement =
      ["city", "town", "village"].includes(type) && Boolean(name);

    if (isNamedSettlement) {
      return (
        `${name} na mapie – sprawdź lokalizację, plan trasy i zdjęcia ` +
        `uliczne na Odwrotna Mapa, niezależnej, prywatnej mapie opartej ` +
        `na OpenStreetMap.`
      );
    }

    const categoryLabel = PLACE_CATEGORY_LABELS[type] || "miejsce";
    const cityPart = address.city || address.town || address.village || "";
    // Uzywamy przecinka zamiast "w <miasto>", bo to wymagaloby
    // poprawnej odmiany nazwy miasta przez przypadki (np. "Gdansk"
    // -> "w Gdansku") - bez ogolnego mechanizmu odmiany polskich
    // nazw miast latwo o bledy gramatyczne, ktore juz raz zlapalismy
    // przy dodawaniu landmarkow.
    const locationPhrase = cityPart ? `, ${cityPart}` : "";

    return (
      `${name} – ${categoryLabel}${locationPhrase}. Zobacz lokalizację, ` +
      `zaplanuj trasę i sprawdź szczegóły na Odwrotna Mapa – prywatnej ` +
      `mapie bez śledzenia i reklam.`
    );
  }

  function updateMetaDescription(description) {
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute("content", description || DEFAULT_META_DESCRIPTION);
    }
  }

  function getPlaceTitle(place) {
    const names = place.namedetails || {};
    const address = place.address || {};

    // Przy dużym oddaleniu wybieramy nazwę bezpośrednio z pełnej
    // hierarchii adresu (którą Nominatim zawsze zwraca w całości),
    // zamiast ufać temu, co Nominatim uznał za "główny" obiekt dla
    // danego zoomu - to jedyny pewny sposób, żeby powiat i gmina
    // nigdy się tu nie pojawiły, niezależnie od tego, co akurat
    // najbliżej klikniętego punktu.
    const currentMapZoom = Math.round(map.getZoom());

    if (currentMapZoom <= 5) {
      return capitalizeFirstLetter(
        address.country ||
        place.name ||
        ""
      );
    }

    if (currentMapZoom <= 7) {
      return capitalizeFirstLetter(
        address.state ||
        address.country ||
        place.name ||
        ""
      );
    }

    // Konkretny obiekt (sklep, paczkomat, usługa) ma pierwszeństwo -
    // jego własna nazwa z Nominatim jest zwykle dokładniejsza niż
    // cokolwiek dałoby się złożyć z pól adresu. Pomijamy ją tylko
    // wtedy, gdy "głównym" trafieniem jest sama granica
    // administracyjna (np. ukraińska "громада" łącząca miasto z
    // okolicą) - wtedy wolimy sięgnąć po konkretne miasto/miejscowość
    // z adresu zamiast nazwy tej szerszej jednostki. Defibrylatory
    // spychamy na sam koniec priorytetów (nie usuwamy całkiem) -
    // wygrywają tylko wtedy, gdy naprawdę nic innego nie ma.
    const isAdminBoundary =
      place.class === "boundary" && place.type === "administrative";
    const isDefibrillator =
      place.type === "defibrillator" ||
      place.category === "defibrillator" ||
      (place.class === "emergency" && place.type === "defibrillator");

    const rawPrimaryName =
      names[`name:${state.language}`] || names.name || place.name || "";
    const primaryName = isDefibrillator ? "" : rawPrimaryName;

    const rawAmenity = address.amenity || "";
    const isAmenityDefibrillator =
      rawAmenity.toLowerCase() === "defibrillator";
    const amenity = isAmenityDefibrillator ? "" : rawAmenity;

    return capitalizeFirstLetter(
      (!isAdminBoundary && primaryName) ||
      amenity ||
      address.tourism ||
      address.shop ||
      address.leisure ||
      address.building ||
      address.road ||
      address.neighbourhood ||
      address.quarter ||
      address.suburb ||
      address.city_district ||
      address.borough ||
      address.city ||
      address.town ||
      address.village ||
      address.hamlet ||
      address.municipality ||
      address.county ||
      address.state_district ||
      address.country ||
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


  function formatRouteSummaryShort(distance, duration) {
    const km = distance ? (distance / 1000).toFixed(distance >= 10000 ? 0 : 1) : "0";
    const minutes = duration ? Math.round(duration / 60) : 0;
    return `${km} km · ${minutes} min`;
  }

  function loadRouteFromEntry(entry) {
    const pointA = { lat: entry.fromLat, lon: entry.fromLon, label: entry.fromLabel };
    const pointB = { lat: entry.toLat, lon: entry.toLon, label: entry.toLabel };

    state.routePointA = pointA;
    state.routePointB = pointB;
    if (el.routeFrom) el.routeFrom.value = pointA.label;
    if (el.routeTo) el.routeTo.value = pointB.label;

    const modeInput = document.querySelector(
      `input[name="route-mode"][value="${entry.mode}"]`
    );
    if (modeInput) modeInput.checked = true;

    window.OMAP_FAVORITES?.closeFavoritesPanel();
    closeHistory();
    calculateRouteFromStoredPoints();
  }

  function filterRouteEntries(entries, query) {
    if (!query) return entries;
    const q = normalizeSearchText(query);
    return entries.filter(entry => {
      const haystack = normalizeSearchText(
        [entry.fromLabel, entry.toLabel, entry.customName]
          .filter(Boolean)
          .join(" ")
      );
      return haystack.includes(q);
    });
  }


  el.routeSaveFavoriteButton?.addEventListener("click", window.OMAP_ROUTE?.toggleCurrentRouteFavorite);
  function recordPlaceHistory(place, lngLat) {
    if (!place || !lngLat) return;

    const key = window.OMAP_FAVORITES?.getFavoriteKey(place, lngLat);

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
    };

    state.history = [
      entry,
      ...state.history.filter(item => item.key !== key)
    ].slice(0, HISTORY_LIMIT);

    window.OMAP_HISTORY?.saveHistory();

    if (!el.historyPanel?.hidden) {
      window.OMAP_HISTORY?.renderHistoryList();
    }
  }

  function getPlaceNameKey(place, lngLat) {
    // Zawsze użyj współrzędnych jako głównego klucza
    // (są najstabilniejsze i zawsze dostępne)
    const lat = Number(place?.lat ?? lngLat?.lat);
    const lon = Number(place?.lon ?? lngLat?.lng);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      // Użyj większej precyzji (7 miejsc dziesiętnych ~11cm)
      // zamiast 5 (1.1m), żeby zmniejszyć ryzyko kolizji
      return `${lat.toFixed(7)},${lon.toFixed(7)}`;
    }

    // Fallback na OSM ID tylko jeśli nie ma współrzędnych
    if (place?.osm_type && place?.osm_id) {
      return `${place.osm_type}:${place.osm_id}`;
    }

    // Ostateczny fallback
    return window.OMAP_FAVORITES?.getFavoriteKey(place, lngLat);
  }

  async function cacheWikipediaForFavorite(key, place) {
    const data = await window.OMAP_WIKIPEDIA?.fetchSummary(place);
    if (!data) return;

    // Zapisujemy też sam obrazek miniatury do pamięci podręcznej
    // przeglądarki (Cache API), żeby faktycznie wyświetlał się
    // offline, nie tylko sam adres URL, pod którym już nic nie
    // odpowie bez internetu.
    if (data.thumbnail && "caches" in window) {
      try {
        const cache = await caches.open("odwrotnamapa-favorites-media");
        await cache.add(data.thumbnail);
      } catch (error) {
        console.warn(
          "Nie udało się zapisać miniatury offline:",
          error
        );
      }
    }

    const favorite = state.favorites.find(
      item => item.key === key
    );
    if (!favorite) return;

    favorite.wikipediaExtract = data.extract;
    favorite.wikipediaThumbnail = data.thumbnail;
    favorite.wikipediaUrl = data.url;

    window.OMAP_FAVORITES?.saveFavorites();
  }


  function reopenTripFromContext() {
    if (!el.tripPanel) return;
    const context = state.tripContextStack?.pop();
    if (!context) return;

    closeOtherMobilePanels(["trip"]);

    el.tripPanelTitle.textContent = context.title;
    el.tripStopsList.replaceChildren();
    el.tripStatus.hidden = true;

    openMobilePanelStandard(el.tripPanel, "--sheet-height");

    renderTripStops(
      context.stops,
      context.currentStopPoint
    );
  }

  window.OMAP_BACK_NAVIGATION?.register(
    "trip",
    () => reopenTripFromContext()
  );

  function showStopOnMap(stop) {
    const lat = Number(stop.lat);
    const lon = Number(stop.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

    closeOtherMobilePanels(["place"]);

// Pobiegnijmy wysokość dolnego panelu mobilnego (jeśli jest widoczny)
        const mobilePanelHeight = window.matchMedia("(max-width: 600px)").matches
          ? (document.querySelector(".mobile-panel:not(.collapsed)")?.offsetHeight || 0)
          : 0;

        map.flyTo({
          center: [lon, lat],
          zoom: Math.max(map.getZoom(), 15),
          // Skopiowane rozwiązanie z logiki widoku miejsc: przesuwa środek mapy nad dolny panel
          padding: {
            top: 20,
            bottom: mobilePanelHeight + 20,
            left: 20,
            right: 20
          }
        });

        // Wymuszenie aktualizacji siatki po wycentrowaniu
        requestAnimationFrame(() => {
          if (map && typeof map.resize === "function") {
            map.resize();
          }
        });
    setPlacePanelReturnTarget("trip", {});

    showSelectedPlaceInformation({
      place_id: `stop:${stop.stopId || stop.name || `${lat},${lon}`}`,
      name: stop.name || stop.stopName || "—",
      display_name: [stop.name || stop.stopName, "Polska"]
        .filter(Boolean)
        .join(", "),
      lat,
      lon,
      class: "public_transport",
      type: "platform",
      importance: 0.6,
      address: {},
      provider: "transitous"
    });
  }

  function closeTrip() {
    if (!el.tripPanel || el.tripPanel.hidden) return;
    el.tripPanel.hidden = true;
    el.tripStopsList.replaceChildren();
  }

  function returnFromTripToPlace() {
    closeTrip();
    if (!el.placePanel) return;

    const origin = state.tripOriginStack?.pop();

    // Panel miejsca mógł zostać w międzyczasie wyczyszczony (np. gdy
    // wcześniej weszliśmy w inny przystanek z listy rozkładu i raz
    // się cofnęliśmy) — w takim wypadku odtwarzamy go z zapamiętanego
    // stanu zamiast otwierać pusty panel.
    if (origin && origin.details && origin.lngLat) {
      state.selectedPlace = origin.details;
      state.placePanelLngLat = origin.lngLat;
      showSelectedPlaceMarker(origin.lngLat);
      openPlacePanel();
      renderPlaceInformation(origin.details, origin.lngLat);
      stabilizeMobilePlacePanelHeight();

      // Panel i marker same w sobie nie przesuwają kamery mapy -
      // bez tego po cofnięciu widać poprawne informacje, ale mapa
      // zostaje tam, gdzie akurat była (np. przy innym przystanku).
      const mobilePanelHeight = window.matchMedia("(max-width: 600px)").matches
        ? (document.querySelector(".mobile-panel:not(.collapsed)")?.offsetHeight || 0)
        : 0;

      map.flyTo({
        center: [origin.lngLat.lng, origin.lngLat.lat],
        zoom: Math.max(map.getZoom(), 15),
        padding: {
          top: 20,
          bottom: mobilePanelHeight + 20,
          left: 20,
          right: 20
        }
      });

      // Bez tego przycisk "wstecz" na przywróconym właśnie miejscu
      // milczałby (nie prowadziłby nigdzie) - a przecież to miejsce
      // mogło samo zostać otwarte z wcześniejszego rozkładu.
      if (origin.returnTarget?.type) {
        setPlacePanelReturnTarget(origin.returnTarget.type, origin.returnTarget);
      } else {
        clearPlacePanelReturnTarget();
      }

      return;
    }

    openMobilePanelStandard(el.placePanel, "--sheet-height");
  }

  function formatStopClock(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleTimeString(
      state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );
  }

  async function openTripDetails(departure) {
    const t = text[state.language];
    const tripId = departure.tripId || departure.tripID;
    if (!tripId || !el.tripPanel) return;

    const currentStopPoint = state.placePanelLngLat
      ? {
          lat: state.placePanelLngLat.lat,
          lon: state.placePanelLngLat.lng
        }
      : null;

    // Zapamiętujemy pełny stan panelu miejsca, z którego otworzono
    // rozkład, żeby móc go odtworzyć po powrocie z rozkładu - na
    // stosie, a nie w jednym nadpisywanym polu, żeby cofanie
    // pamiętało cały łańcuch (przystanek → rozkład → przystanek →
    // rozkład → ...), a nie tylko ostatni krok. Zapamiętujemy też,
    // dokąd prowadził przycisk "wstecz" NA TYM miejscu (np. do
    // wcześniejszego rozkładu) - inaczej po przywróceniu miejsca
    // jego "wstecz" nie prowadziłoby już nigdzie.
    if (state.selectedPlace && state.placePanelLngLat) {
      if (!Array.isArray(state.tripOriginStack)) state.tripOriginStack = [];
      state.tripOriginStack.push({
        details: state.selectedPlace,
        lngLat: state.placePanelLngLat,
        returnTarget: window.OMAP_BACK_NAVIGATION?.get() || null
      });
    }

    closeOtherMobilePanels(["trip", "place"]);
    if (el.placePanel) el.placePanel.hidden = true;

    el.tripPanelTitle.textContent =
      departure.routeShortName ||
      departure.displayName ||
      departure.tripShortName ||
      t.tripTitle;

    el.tripStopsList.replaceChildren();
    el.tripStatus.hidden = false;
    el.tripStatus.textContent = t.tripLoading;

    openMobilePanelStandard(el.tripPanel, "--sheet-height");

    try {
      const url = new URL(CONFIG.transit.tripEndpoint);
      url.searchParams.set("tripId", tripId);
      url.searchParams.set("language", state.language);

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Transitous HTTP ${response.status}`);
      }

      const itinerary = await response.json();
      const leg = (itinerary.legs || [])[0] || itinerary;

      const stops = [
        leg.from,
        ...(leg.intermediateStops || []),
        leg.to
      ].filter(Boolean);

      if (!stops.length) {
        el.tripStatus.textContent = t.tripEmpty;
        return;
      }

      renderTripStops(stops, currentStopPoint);
      el.tripStatus.hidden = true;

      if (!Array.isArray(state.tripContextStack)) state.tripContextStack = [];
      state.tripContextStack.push({
        title: el.tripPanelTitle.textContent,
        stops,
        currentStopPoint
      });
    } catch (error) {
      console.error(error);
      el.tripStatus.hidden = false;
      el.tripStatus.textContent = t.tripError;
    }
  }

  function findClosestStopIndex(stops, point) {
    if (!point) return -1;

    let closestIndex = -1;
    let closestDistance = Infinity;

    stops.forEach((stop, index) => {
      const lat = Number(stop.lat);
      const lon = Number(stop.lon);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const distance = Math.hypot(
        lat - point.lat,
        lon - point.lon
      );

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    // Odrzuć dopasowanie, jeśli najbliższy przystanek jest zbyt
    // daleko (ok. 1 km), żeby nie oznaczać przypadkowego przystanku
    // jako "obecny".
    return closestDistance <= 0.01 ? closestIndex : -1;
  }

  function renderTripStops(stops, currentStopPoint) {
    const t = text[state.language];
    const fragment = document.createDocumentFragment();
    const currentIndex = findClosestStopIndex(
      stops,
      currentStopPoint
    );

    stops.forEach((stop, index) => {
      const item = document.createElement("li");
      item.className = "trip-stop";

      const isCurrent = index === currentIndex;
      if (isCurrent) {
        item.className += " is-current-stop";
      }

      const time = document.createElement("span");
      time.className = "trip-stop-time";
      time.textContent = formatStopClock(
        stop.departure ||
          stop.arrival ||
          stop.scheduledDeparture ||
          stop.scheduledArrival
      );

      const name = document.createElement("span");
      name.className = "trip-stop-name";
      name.textContent = stop.name || stop.stopName || "—";

      item.append(time, name);

      if (isCurrent) {
        const badge = document.createElement("span");
        badge.className = "trip-stop-badge";
        badge.textContent = t.tripCurrentStop;
        item.appendChild(badge);
      }

      const lat = Number(stop.lat);
      const lon = Number(stop.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        item.classList.add("is-clickable");
        item.setAttribute("role", "button");
        item.setAttribute("tabindex", "0");
        const openHandler = () => showStopOnMap(stop);
        item.addEventListener("click", openHandler);
        item.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openHandler();
          }
        });
      }

      fragment.appendChild(item);
    });

    el.tripStopsList.appendChild(fragment);

    const currentEl = el.tripStopsList.querySelector(
      ".is-current-stop"
    );
    if (currentEl) {
      setTimeout(() => {
        currentEl.scrollIntoView({
          block: "center",
          behavior: "smooth"
        });
      }, 120);
    }
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

  function isLocalOrNativeOrigin() {
    const { hostname, protocol } = window.location;
    return (
      protocol === "capacitor:" ||
      protocol === "file:" ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    );
  }

async function sharePlace(place, lngLat) {
  const baseUrl = isLocalOrNativeOrigin() && CONFIG.publicBaseUrl ? CONFIG.publicBaseUrl : window.location.href;

  const placeTitle = getSearchResultTitle(place) || place?.name || place?.display_name?.split(',')[0];

  const url = window.OMAP_URL_STATE?.buildPlaceUrl({
    label: placeTitle,
    lat: lngLat?.lat,
    lon: lngLat?.lng,
    osmType: place?.osm_type,
    osmId: place?.osm_id,
    baseUrl
  }) || new URL(baseUrl);

  const shareData = {
    title: placeTitle || document.title,
    text: getSearchResultSubtitle(place) || "",
    url: url.toString()
  };
  const t = text[state.language];
  try {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (shareError) {
        if (shareError?.name === "AbortError") return;
        // navigator.share() istnieje jako funkcja, ale na niektorych
        // platformach desktopowych (np. Linux bez integracji z
        // powloka systemowa) samo wywolanie potrafi rzucic bledem -
        // wtedy proba schowka ponizej to jedyna realna alternatywa,
        // zamiast od razu pokazywac blad.
        console.error(shareError);
      }
    }
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(url.toString());
      show(t.placeShared);
    } else {
      show(t.shareUnavailable);
    }
  } catch (error) {
    if (error?.name !== "AbortError") {
      console.error(error);
      show(t.shareUnavailable);
    }
  }
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
      const route = await window.OMAP_ROUTE?.fetchRoute(state.routePointA, state.routePointB);
      window.OMAP_ROUTE?.drawRoute(
        route.geometry,
        route.snappedFrom || state.routePointA,
        route.snappedTo || state.routePointB,
        window.OMAP_ROUTE?.getSelectedRouteMode()
      );
      window.OMAP_ROUTE?.updateRouteSummary(route.distance, route.duration);
      window.OMAP_ROUTE_HISTORY?.recordRouteHistory(
        state.routePointA,
        state.routePointB,
        window.OMAP_ROUTE?.getSelectedRouteMode(),
        route.distance,
        route.duration
      );
      window.OMAP_ROUTE?.renderRouteDirections(route.maneuvers);
      hide();
      dismissMobileKeyboard();

      // Po wyznaczeniu nowej trasy ponownie otwieramy/rozwijamy panel mobilny
      if (el.routePanel) {
        openMobilePanelStandard(el.routePanel, "--sheet-height");
      }
    } catch (error) {
      console.error(error);
      show(text[state.language].routeError);
    } finally {
      if (el.routeSubmit) el.routeSubmit.disabled = false;
    }
  }

  function formatCoordinates(lon, lat) {
    return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
  }

// ===== ZMODYFIKOWANA FUNKCJA updateRouteClickHint =====
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
        // Gdy oba punkty są ustawione – komunikat o dodawaniu przystanków
        el.routeClickHint.textContent = state.language === "pl"
            ? "Kliknij na mapie, aby dodać przystanek pośredni."
            : "Click the map to add a waypoint.";
        el.routeClickHint.classList.add("is-complete");
    }
}
// ===== KONIEC ZMODYFIKOWANEJ FUNKCJI =====


  function openHistoryPanel() {
    closeMapContextMenu();
    closeOtherMobilePanels("history");

    openMobilePanelStandard(
      el.historyPanel,
      "--sheet-height"
    );
    if (el.historySearch) el.historySearch.value = "";
    window.OMAP_HISTORY?.renderHistoryList();
  }

  function closeHistory() {
    if (!el.historyPanel || el.historyPanel.hidden) return;
    el.historyPanel.hidden = true;
  }

  function returnFromHistoryToMenu() {
    closeHistory();
    openMenuHome();
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

  async function openSearchPlaceThroughService(
    result,
    {
      query = "",
      reverse = false,
      forceReverse = false,
      origin = "search"
    } = {}
  ) {
    // Dołącz custom name jeśli istnieje
    const lat = Number(result?.lat);
    const lon = Number(result?.lon);
    let payload = result;
    
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const placeNameKey = `${lat.toFixed(7)},${lon.toFixed(7)}`;
      const customName = state.customPlaceNames[placeNameKey];
      if (customName) {
        payload = { ...result, customName, name: customName };
      }
    }
    
    return window.OMAP_PLACE_SERVICE.open(
      payload,
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
    // Pobierz custom name jeśli istnieje
    const lat = Number(lngLat.lat);
    const lon = Number(lngLat.lng);
    const placeNameKey = `${lat.toFixed(7)},${lon.toFixed(7)}`;
    const customName = state.customPlaceNames[placeNameKey];
    const displayName = customName || "Wybrane miejsce";
    
    return window.OMAP_PLACE_SERVICE.open(
      {
        name: displayName,
        lat,
        lon,
        category: "place",
        source: "map-info",
        provider: "map",
        customName: customName
      },
      {
        source: "map-info",
        metadata: {
          origin
        }
      }
    );
  }

  function openMenuHome() {
    closeMapContextMenu();
    closeOtherMobilePanels("menu");

    if (!el.menuPanel) return;

    openMobilePanelStandard(
      el.menuPanel,
      "--sheet-height"
    );
    el.menuPanel.classList.remove("is-collapsed");

    el.menuButton?.setAttribute("aria-expanded", "true");
    el.menuButton?.classList.add("is-active");
    el.mobileMenuButton?.setAttribute("aria-expanded", "true");
    el.mobileMenuButton?.classList.add("is-active");
  }

  function openLegendFromMenu() {
    closeOtherMobilePanels("legend");

    openMobilePanelStandard(
      el.legendPanel,
      "--sheet-height"
    );
    el.legendButton?.setAttribute("aria-expanded", "true");
  }

  function openLabelsFromMenu() {
    closeOtherMobilePanels("labels");

    openMobilePanelStandard(
      el.labelsPanel,
      "--sheet-height"
    );
    el.menuLabelsButton?.setAttribute("aria-expanded", "true");
  }

  function closeLabels() {
    if (!el.labelsPanel || el.labelsPanel.hidden) return;
    el.labelsPanel.hidden = true;
    el.menuLabelsButton?.setAttribute("aria-expanded", "false");
  }

  function returnFromLabelsToMenu() {
    closeLabels();
    openMenuHome();
  }


  function openAboutFromMenu() {
    closeOtherMobilePanels("about");

    openMobilePanelStandard(
      el.aboutPanel,
      "--sheet-height"
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
    closeOtherMobilePanels("backup");

    openMobilePanelStandard(
      el.backupPanel,
      "--sheet-height"
    );
    el.menuBackupButton?.setAttribute("aria-expanded", "true");
  }

  function returnFromBackupToMenu() {
    closeBackup();
    openMenuHome();
  }

  function returnFromFavoritesToMenu() {
    window.OMAP_FAVORITES?.closeFavoritesPanel();
    closeHistory();
    window.OMAP_ACCOUNT?.openAccountFromMenu();
  }

  function toggleMenu() {
    closeMapContextMenu();
    if (!el.menuPanel || !el.menuButton) return;

    const shouldOpen = el.menuPanel.hidden;

    if (shouldOpen) {
      closeOtherMobilePanels("menu");
    }

    el.menuPanel.hidden = !shouldOpen;
    if (shouldOpen) {
      openMobilePanelStandard(el.menuPanel, "--sheet-height");
    }
    
    el.menuButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.menuButton?.classList.toggle("is-active", shouldOpen);
    el.mobileMenuButton?.setAttribute("aria-expanded", String(shouldOpen));
    el.mobileMenuButton?.classList.toggle("is-active", shouldOpen);
  }

  function closeMenu() {
    if (!el.menuPanel || el.menuPanel.hidden) return;

    el.menuPanel.hidden = true;

    el.menuButton?.setAttribute("aria-expanded", "false");
    el.menuButton?.classList.remove("is-active");

    el.mobileMenuButton?.setAttribute("aria-expanded", "false");
    el.mobileMenuButton?.classList.remove("is-active");
  }

  function toggleAbout() {
    closeMapContextMenu();

    if (!el.aboutPanel) return;
    const shouldOpen = el.aboutPanel.hidden;

    closeOtherMobilePanels("about");

    el.aboutPanel.hidden = !shouldOpen;

    if (shouldOpen) {
      openMobilePanelStandard(
        el.aboutPanel,
        "--sheet-height"
      );
    }

    el.aboutButton?.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }

  function closeAbout() {
    if (!el.aboutPanel || el.aboutPanel.hidden) return;
    el.aboutPanel.hidden = true;
    el.aboutButton?.setAttribute("aria-expanded", "false");
  }

  function closeBackup() {
    if (!el.backupPanel || el.backupPanel.hidden) return;
    el.backupPanel.hidden = true;
    el.menuBackupButton?.setAttribute("aria-expanded", "false");
  }

  async function loadMyRatingsActivity() {
    const t = text[state.language];
    if (!el.accountActivityStatus || !el.accountActivityList) return;

    el.accountActivityRefreshButton?.classList.add("is-spinning");
    el.accountActivityList.replaceChildren();
    el.accountActivityStatus.hidden = false;
    el.accountActivityStatus.textContent = t.activityLoading;

    const seedWords = window.OMAP_SEED_WORDS?.getStoredSeedWords();
    if (!seedWords) {
      el.accountActivityStatus.textContent = t.activityLoginNeeded;
      el.accountActivityRefreshButton?.classList.remove("is-spinning");
      return;
    }

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const nostrLib = await transport.waitForNostrLib();
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);
      const myPubKeyHex = nostrLib.getPublicKey(nostrPrivKeyBytes);

      const ratings = await transport.fetchMyRatings(myPubKeyHex);

      if (!ratings.length) {
        el.accountActivityStatus.textContent = t.activityEmpty;
        return;
      }

      el.accountActivityStatus.hidden = true;
      const fragment = document.createDocumentFragment();

      ratings.forEach(entry => {
        const item = document.createElement("li");
        item.className = "account-activity-item";

        const hasCoords = Number.isFinite(entry.lat) && Number.isFinite(entry.lon);

        const button = document.createElement(hasCoords ? "button" : "div");
        button.className = "account-activity-item-open";
        if (hasCoords) button.type = "button";

        const label = document.createElement("span");
        label.className = "account-activity-item-label";
        label.textContent = entry.label || entry.placeKey;

        const stars = document.createElement("span");
        stars.className = "account-activity-item-stars";
        const fullStars = Math.floor(entry.rating);
        const hasHalf = entry.rating - fullStars === 0.5;
        stars.textContent =
          "★".repeat(fullStars) +
          (hasHalf ? "⯨" : "") +
          "☆".repeat(5 - fullStars - (hasHalf ? 1 : 0)) +
          ` ${entry.rating}`;

        button.append(label, stars);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-place-remove";
        removeButton.textContent = "×";
        removeButton.title = t.ratingDelete;
        removeButton.setAttribute("aria-label", t.ratingDelete);
        removeButton.addEventListener("click", async () => {
          const seedWordsForDelete = window.OMAP_SEED_WORDS?.getStoredSeedWords();
          if (!seedWordsForDelete) return;

          removeButton.disabled = true;
          try {
            const cryptoApi = window.OMAP_SYNC_CRYPTO;
            const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWordsForDelete);
            await transport.deleteRating(nostrPrivKeyBytes, entry.placeKey);
            item.remove();
            if (!el.accountActivityList.children.length) {
              el.accountActivityStatus.hidden = false;
              el.accountActivityStatus.textContent = t.activityEmpty;
            }
          } catch (error) {
            console.error("Nie udało się usunąć oceny:", error);
            removeButton.disabled = false;
          }
        });

        const row = document.createElement("div");
        row.className = "account-activity-item-row";
        row.append(button, removeButton);
        item.append(row);

        if (hasCoords) {
          button.addEventListener("click", async () => {
            const displayLabel = entry.label || entry.placeKey;
            window.OMAP_ACCOUNT?.closeAccount();

            const lngLat = { lat: entry.lat, lng: entry.lon };
            const minimalPlace = {
              name: displayLabel,
              display_name: displayLabel,
              lat: entry.lat,
              lon: entry.lon,
              osm_type: entry.osmType || undefined,
              osm_id: entry.osmId || undefined,
              address: {},
              extratags: {}
            };

            // Pokazujemy od razu (bez czekania na sieć), a jeśli mamy
            // OSM id - dociągamy w tle pełne dane (kategoria, Wikipedia,
            // strona) precyzyjnym zapytaniem PO ID, nie po współrzędnych,
            // więc nie ma ryzyka trafienia w inny obiekt.
            openKnownPlaceOnMap(minimalPlace, lngLat);

            map.flyTo({
              center: [entry.lon, entry.lat],
              zoom: 16,
              bearing: 180
            });

            if (entry.placeSnapshot && entry.placeSnapshot.name) {
              // Migawka zapisana w momencie oceniania - dokładnie te
              // same dane, które wtedy pokazała karta miejsca. Zero
              // zapytań do sieci, zero zgadywania.
              openKnownPlaceOnMap(entry.placeSnapshot, lngLat);
              return;
            }

            try {
              const isCityLike = ["city", "town", "village"].includes(
                String(entry.placeType || "").toLowerCase()
              );
              const fullPlace = entry.osmType && entry.osmId
                ? await fetchPlaceByOsmId(entry.osmType, entry.osmId)
                : await fetchPlaceByReverseAtZoom(
                    entry.lat,
                    entry.lon,
                    isCityLike ? 10 : 18
                  );

              if (
                fullPlace &&
                state.placePanelLngLat === lngLat &&
                !el.placePanel?.hidden
              ) {
                openKnownPlaceOnMap(fullPlace, lngLat);
              }
            } catch (error) {
              console.error("Nie udało się dociągnąć pełnych danych miejsca:", error);
            }
          });
        }

        fragment.appendChild(item);
      });

      el.accountActivityList.appendChild(fragment);
    } catch (error) {
      console.error("Nie udało się wczytać aktywności:", error);
      el.accountActivityStatus.hidden = false;
      el.accountActivityStatus.textContent = t.activityError;
    } finally {
      el.accountActivityRefreshButton?.classList.remove("is-spinning");
    }
  }


  function toggleLegend() {
    closeMapContextMenu();

    if (!el.legendPanel) return;
    const shouldOpen = el.legendPanel.hidden;

    closeOtherMobilePanels("legend");

    el.legendPanel.hidden = !shouldOpen;

    if (shouldOpen) {
      openMobilePanelStandard(
        el.legendPanel,
        "--sheet-height"
      );
    }

    el.legendButton?.setAttribute(
      "aria-expanded",
      String(shouldOpen)
    );
  }

  function closeLegend() {
    if (!el.legendPanel || el.legendPanel.hidden) return;
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

      window.OMAP_SEARCH_HISTORY?.saveSearchHistoryEntry({
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
        zoom: Math.max(map.getZoom(), 15),
        bearing: 180
      });

      session.finish();
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error(error);
      show(text[state.language].searchError);
    }
  }


  function isElectronPlatform() {
    return (
      window.CapacitorPlatform === "electron" ||
      navigator.userAgent.includes("Electron")
    );
  }

  // Electron (Chromium bez wbudowanego klucza Google API) nie potrafi
  // ustalić lokalizacji przez WiFi/IP tak jak zwykła przeglądarka -
  // to znany, wieloletni problem samego Electrona, nie naszej apki.
  // Jedyna realistyczna alternatywa na komputerze stacjonarnym to
  // przybliżona lokalizacja po adresie IP, przez niezależną usługę.
  async function fetchLocationByIp() {
    const response = await fetch("https://ipwho.is/");
    if (!response.ok) {
      throw new Error(`Zapytanie o lokalizację po IP nie powiodło się (HTTP ${response.status}).`);
    }

    const data = await response.json();
    if (!data.success || typeof data.latitude !== "number" || typeof data.longitude !== "number") {
      throw new Error("Usługa lokalizacji po IP nie zwróciła poprawnych współrzędnych.");
    }

    return { latitude: data.latitude, longitude: data.longitude };
  }

function locate() {
    if (!navigator.geolocation) {
      show(text[state.language].locationError);
      return;
    }

    show(text[state.language].gettingLocation, 0);

    // Wyłączamy ewentualne aktywne śledzenie
    if (window.userLocationWatchId) {
      navigator.geolocation.clearWatch(window.userLocationWatchId);
      window.userLocationWatchId = null;
    }

    // Jednorazowe pobranie pozycji bez watchPosition (brak drugiego przeskoku po 3s)
    navigator.geolocation.getCurrentPosition(
      position => {
        const lon = position.coords.longitude;
        const lat = position.coords.latitude;
        const point = [lon, lat];

        // 1. Stawiamy znacznik
        showUserLocationMarker(point);

        // 2. Centrujemy mapę z zachowaniem aktualnego obrotu
        map.flyTo({
          center: point,
          zoom: Math.max(map.getZoom(), 15),
          bearing: map.getBearing()
        });

        hide();
      },
      error => {
        console.error("Błąd lokalizacji GPS:", error);
        show(text[state.language].locationError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0 // Zmusza urządzenie do podania aktualnej pozycji
      }
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

// When user clicks browser back/forward, restore and search
window.addEventListener("popstate", function(event) {
  const shared = window.OMAP_URL_STATE?.readPlaceFromUrl();

  // If we have coordinates, navigate directly to the exact location
  if (shared && Number.isFinite(shared.lat) && Number.isFinite(shared.lon)) {
    map.flyTo({
      center: [shared.lon, shared.lat],
      zoom: 17,
      bearing: 180
    });
    if (el.searchInput) {
      el.searchInput.value = shared.label;
      if (typeof updateSearchClearButton === "function") {
        updateSearchClearButton();
      }
    }
    if (typeof showContextPointMarker === "function") {
      showContextPointMarker({ lat: shared.lat, lng: shared.lon });
    }
    if (el.placePanel) {
      el.placePanel.hidden = true;
    }
    setTimeout(() => {
      if (typeof showPlaceInformation === "function") {
        showPlaceInformation({
          lngLat: { lat: shared.lat, lng: shared.lon },
          knownName: shared.label || null
        }).catch(err => {
          console.error("Error:", err);
        });
      }
    }, 100);
    return;
  }

  // Fallback: only a search phrase, no coordinates - re-search
  const q = shared?.label;
  if (q && el.searchInput && typeof search === "function") {
    el.searchInput.value = q;
    if (typeof updateSearchClearButton === "function") {
      updateSearchClearButton();
    }
    state.isRestoringFromPopstate = true;
    const event = new Event("submit");
    event.preventDefault = () => {};
    search(event).catch(err => console.error("Search error:", err));
    setTimeout(() => { state.isRestoringFromPopstate = false; }, 10);
  }
});


// Check if page loaded with a place/search URL (?q=, ?p=, or legacy ?place=/?lat=/?lng=)
(function checkUrlAndSearch() {
  const shared = window.OMAP_URL_STATE?.readPlaceFromUrl();
  const q = shared?.label;

  // Wpisz frazę w pole wyszukiwania
  if (q && el.searchInput) {
    el.searchInput.value = q;
    if (typeof updateSearchClearButton === "function") {
      updateSearchClearButton();
    }
  }

  // 1. Jeśli w URL są współrzędne - użyjemy dedykowanej funkcji wycentrowania
  if (shared && Number.isFinite(shared.lat) && Number.isFinite(shared.lon)) {
    setTimeout(() => {
      try {
        if (typeof loadSharedPlaceFromUrl === "function") {
          loadSharedPlaceFromUrl();
        }
      } catch (err) {
        console.error("Błąd podczas wczytywania miejsca z URL:", err);
      }
    }, 400);
    return;
  }

  // 2. Jeśli podano tylko frazę wyszukiwania (?q=)
  if (q && typeof search === "function") {
    setTimeout(async function() {
      state.isRestoringFromPopstate = true;
      const event = new Event("submit");
      event.preventDefault = () => {};

      try {
        await search(event);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        state.isRestoringFromPopstate = false;
      }
    }, 500);
  }
})();


})();
