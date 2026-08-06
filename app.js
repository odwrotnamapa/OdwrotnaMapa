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
      customFontHeading: "Czcionka",
      customFontHint: "Dotyczy tekstu interfejsu (menu, panele, karty) - nie zmienia czcionki etykiet na samej mapie.",
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
      aboutIntroAlt: "Niektórzy nazywają to też odwróconą mapą — niezależnie od nazwy, chodzi o to samo: świat pokazany z południem u góry zamiast tradycyjnej północy.",
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
      routeSaveFavorite: "Zapisz trasę",
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
      accountScopeFavorites: "Ulubione miejsca",
      accountScopeColors: "Motyw, kolory i język",
      accountScopePlaceNames: "Własne nazwy miejsc",
      accountScopeHistory: "Historia przeglądanych miejsc",
      accountPush: "⬆ Wyślij zaznaczone",
      accountPull: "⬇ Pobierz zaznaczone",
      accountLogout: "Wyloguj",
      accountActivity: "Aktywność",
      activityRefresh: "Odśwież",
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
      customFontHeading: "Font",
      customFontHint: "Applies to the interface text (menus, panels, cards) - it does not change the font of labels on the map itself.",
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
      aboutIntroAlt: "Some people call this an inverted map or upside-down map — whatever you call it, it's the same idea: the world shown with south at the top instead of the usual north.",
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
      routeSaveFavorite: "Save route",
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
      accountScopeFavorites: "Favorite places",
      accountScopeColors: "Theme, colors and language",
      accountScopePlaceNames: "Custom place names",
      accountScopeHistory: "Browsing history",
      accountPush: "⬆ Send selected",
      accountPull: "⬇ Pull selected",
      accountLogout: "Log out",
      accountActivity: "Activity",
      activityRefresh: "Refresh",
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
  const TEXTURE_IMAGE_PREFIX = "custom-texture-";
  const TEXTURE_DB_NAME = "odwrotnamapa-textures";
  const TEXTURE_STORE = "textures";
  const FONT_STORE = "fonts";
  const TEXTURE_DB_VERSION = 2;
  const TEXTURE_MAX_DIMENSION = 1024;

  function textureImageId(key) {
    return TEXTURE_IMAGE_PREFIX + key;
  }

  function openTextureDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB niedostępne"));
        return;
      }
      const request = indexedDB.open(TEXTURE_DB_NAME, TEXTURE_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TEXTURE_STORE)) {
          db.createObjectStore(TEXTURE_STORE);
        }
        if (!db.objectStoreNames.contains(FONT_STORE)) {
          db.createObjectStore(FONT_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function idbGetAllTextures() {
    try {
      const db = await openTextureDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(TEXTURE_STORE, "readonly");
        const store = tx.objectStore(TEXTURE_STORE);
        const result = {};
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            result[cursor.key] = cursor.value;
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    } catch (_) {
      return {};
    }
  }

  async function idbSetTexture(key, dataUrl) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(TEXTURE_STORE, "readwrite");
        tx.objectStore(TEXTURE_STORE).put(dataUrl, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się zapisać tekstury:", error);
    }
  }

  async function idbDeleteTexture(key) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(TEXTURE_STORE, "readwrite");
        tx.objectStore(TEXTURE_STORE).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się usunąć tekstury:", error);
    }
  }

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

  async function idbGetCustomFont() {
    try {
      const db = await openTextureDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(FONT_STORE, "readonly");
        const req = tx.objectStore(FONT_STORE).get("customFont");
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return null;
    }
  }

  async function idbSetCustomFont(dataUrl) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(FONT_STORE, "readwrite");
        tx.objectStore(FONT_STORE).put(dataUrl, "customFont");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się zapisać czcionki:", error);
    }
  }

  async function idbDeleteCustomFont() {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(FONT_STORE, "readwrite");
        tx.objectStore(FONT_STORE).delete("customFont");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się usunąć czcionki:", error);
    }
  }

  // Wczytuje wybór czcionki po starcie (plik czcionki z IndexedDB, jeśli
  // trzeba) i go stosuje. Wołane raz, obok initCustomTextures().
  async function initCustomFont() {
    if (state.customFont.type === "custom") {
      state.customFontDataUrl = await idbGetCustomFont();
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
    const imageId = textureImageId(key);
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
    const imageId = textureImageId(key);
    try {
      if (map.hasImage(imageId)) map.removeImage(imageId);
    } catch (_) {}
  }

  // Wczytuje wszystkie zapisane tekstury z IndexedDB i rejestruje w mapie
  // te, które dotyczą warstw mapy (nie UI). Wołane raz, po starcie mapy.
  async function initCustomTextures() {
    state.customTextures = await idbGetAllTextures();
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

    const imageId = textureImageId(paletteKey);
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

  // Warstwy etykiet ze stylu OpenFreeMap Liberty, pogrupowane pod
  // przełączniki widoczności w menu. Jeśli styl mapy się kiedyś
  // zmieni, te ID trzeba będzie zweryfikować względem nowego style.json.
  const LABEL_LAYER_GROUPS = {
    poi: ["poi_r20", "poi_r7", "poi_r1", "poi_transit"],
    roads: [
      "highway-name-path",
      "highway-name-minor",
      "highway-name-major",
      "highway-shield-non-us",
      "highway-shield-us-interstate",
      "road_shield_us"
    ],
    places: [
      "label_other",
      "label_village",
      "label_town",
      "label_city",
      "label_city_capital"
    ],
    water: [
      "waterway_line_label",
      "water_name_point_label",
      "water_name_line_label"
    ],
    regions: ["label_state"],
    countries: ["label_country_3", "label_country_2", "label_country_1"],
    airports: ["airport"],
    boundaries: ["boundary_3", "boundary_2", "boundary_disputed"]
  };

  const DEFAULT_LABEL_VISIBILITY = {
    poi: true,
    roads: true,
    places: true,
    water: true,
    regions: true,
    countries: true,
    airports: true,
    boundaries: true
  };
  const LABEL_VISIBILITY_STORAGE_KEY = "omapa-label-visibility";

  function readLabelVisibility() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(LABEL_VISIBILITY_STORAGE_KEY) || "{}"
      );
      return { ...DEFAULT_LABEL_VISIBILITY, ...stored };
    } catch (_) {
      return { ...DEFAULT_LABEL_VISIBILITY };
    }
  }

  function saveLabelVisibility(visibility) {
    safeSet(LABEL_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  }

  function applyLabelVisibility() {
    for (const [group, layerIds] of Object.entries(LABEL_LAYER_GROUPS)) {
      const visible = state.labelVisibility[group];
      for (const layerId of layerIds) {
        if (!map.getLayer(layerId)) continue;
        map.setLayoutProperty(
          layerId,
          "visibility",
          visible ? "visible" : "none"
        );
      }
    }
  }

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

  // Własne nazwy miejsc wpisane w panelu informacji - przechowywane lokalnie,
  // niezależnie od ulubionych (favorite.customName), bo dotyczą DOWOLNEGO
  // miejsca pokazanego na mapie, nie tylko zapisanych do ulubionych.
  function readCustomPlaceNames() {
    try {
      const stored = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.customPlaceNames) || "{}"
      );
      return stored && typeof stored === "object" ? stored : {};
    } catch (_) {
      return {};
    }
  }

  function saveCustomPlaceNames() {
    safeSet(
      CONFIG.storageKeys.customPlaceNames,
      JSON.stringify(state.customPlaceNames)
    );
  }

  function setCustomPlaceName(key, rawName, fallbackTitle, headingEl, place, lngLat) {
    const trimmed = (rawName || "").trim();

    if (!trimmed || trimmed === fallbackTitle) {
      delete state.customPlaceNames[key];
    } else {
      state.customPlaceNames[key] = trimmed;
    }

    saveCustomPlaceNames();

    // Synchronizuj z Ulubionymi: jeśli miejsce jest w Ulubionych, zaktualizuj jego customName
    if (place && lngLat) {
      const favoriteKey = getFavoriteKey(place, lngLat);
      const favorite = state.favorites.find(item => item.key === favoriteKey);
      if (favorite) {
        favorite.customName = state.customPlaceNames[key] || "";
        saveFavorites();
        renderFavoritesList();
      }
    }

    const displayTitle = state.customPlaceNames[key] || fallbackTitle;
    if (headingEl) headingEl.textContent = displayTitle;
    document.title = `${displayTitle} - Odwrotna Mapa`;
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
    customPalette: readCustomPalette(),
    customFont: readCustomFont(),
    // Sam plik czcionki (jeśli type === "custom") wczytywany asynchronicznie
    // z IndexedDB przez initCustomFont() po starcie.
    customFontDataUrl: null,
    customPlaceNames: readCustomPlaceNames(),
    // Wypełniane asynchronicznie przez initCustomTextures() po starcie mapy
    // (dane obrazów trzymamy w IndexedDB, nie w localStorage - mogą być
    // zbyt duże). Klucze pokrywają się z CUSTOM_PALETTE_FIELDS, które mają
    // sens jako tekstura: mapBackground, mapWater, mapParks, mapBuildings,
    // uiPanel.
    customTextures: {},
    labelVisibility: readLabelVisibility(),
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
    favorites: readFavorites(),
    favoriteFolders: readFavoriteFolders(),
    activeFavoriteFolder: "",
    activeRouteFolder: "",
    favoritesSortOrder: "newest",
    routeFavoritesSortOrder: "newest",
    tripOriginStack: [],
    tripContextStack: [],
    history: readHistory(),
    routeHistory: readRouteHistory(),
    routeFavorites: readRouteFavorites(),
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
    customFontHeading: $("menu-custom-font-heading"),
    customFontHint: $("menu-custom-font-hint"),
    customFontSelect: $("custom-font-select"),
    customFontUploadRow: $("custom-font-upload-row"),
    customFontFile: $("custom-font-file"),
    customFontFileClear: $("custom-font-file-clear"),
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
    accountSyncScopeFavorites: $("account-sync-scope-favorites"),
    accountScopeFavoritesLabel: $("account-scope-favorites-label"),
    accountSyncScopeColors: $("account-sync-scope-colors"),
    accountScopeColorsLabel: $("account-scope-colors-label"),
    accountSyncScopePlaceNames: $("account-sync-scope-place-names"),
    accountScopePlaceNamesLabel: $("account-scope-placenames-label"),
    accountSyncScopeHistory: $("account-sync-scope-history"),
    accountScopeHistoryLabel: $("account-scope-history-label"),
    accountPushButton: $("account-push-button"),
    accountPullButton: $("account-pull-button"),
    accountLogoutButton: $("account-logout-button"),
    accountActivityButton: $("account-activity-button"),
    accountScreenActivity: $("account-screen-activity"),
    accountActivityBackButton: $("account-activity-back-button"),
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
    ensureRouteLayers();
    cacheOriginalPaint();
    await initCustomTextures();
    await initCustomFont();
    applyTheme(state.theme);
    applyLanguageAfterStartup();
    loadSharedRouteFromUrl();
    loadSharedPlaceFromUrl();
    initializeGeoUriHandling();
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
  window.OMAP_RATINGS?.configure({
    state,
    text,
    getStoredSeedWords,
    openAccountFromMenu
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
    scrollPanelToElement
  });
  window.OMAP_DISCOVER?.renderCategoryButtons();

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

    el.customPaletteReset?.addEventListener("click", async () => {
      state.customPalette = { ...DEFAULT_CUSTOM_PALETTE };
      saveCustomPalette(state.customPalette);
      syncCustomPaletteInputs();

      for (const key of TEXTURE_FIELDS) {
        state.customTextures[key] = null;
        await idbDeleteTexture(key);
        if (MAP_TEXTURE_KEYS.includes(key)) unregisterTextureImage(key);
      }

      state.customFont = { type: "default" };
      state.customFontDataUrl = null;
      saveCustomFont();
      await idbDeleteCustomFont();
      syncCustomFontSelect();

      if (state.theme === "custom") applyTheme(state.theme);
    });
  }

  initializeTextureEditor();
  initializeFontEditor();

  function syncCustomFontSelect() {
    if (!el.customFontSelect) return;
    const font = state.customFont;
    el.customFontSelect.value =
      font.type === "google" ? `google:${font.googleFont}` : font.type;
    if (el.customFontUploadRow) {
      el.customFontUploadRow.hidden = font.type !== "custom";
    }
  }

  function initializeFontEditor() {
    syncCustomFontSelect();

    el.customFontSelect?.addEventListener("change", async () => {
      const value = el.customFontSelect.value;

      if (value === "custom") {
        state.customFont = { type: "custom" };
        saveCustomFont();
        if (el.customFontUploadRow) el.customFontUploadRow.hidden = false;

        if (!state.customFontDataUrl) {
          state.customFontDataUrl = await idbGetCustomFont();
        }

        if (state.theme === "custom") applyCustomFont();
        return;
      }

      if (el.customFontUploadRow) el.customFontUploadRow.hidden = true;

      state.customFont = value.startsWith("google:")
        ? { type: "google", googleFont: value.slice("google:".length) }
        : { type: "default" };

      saveCustomFont();
      if (state.theme === "custom") applyCustomFont();
    });

    el.customFontFile?.addEventListener("change", async () => {
      const file = el.customFontFile.files?.[0];
      if (!file) return;

      if (!/\.(woff2?|ttf|otf)$/i.test(file.name)) {
        alert("Wybierz plik czcionki w formacie WOFF, WOFF2, TTF lub OTF.");
        el.customFontFile.value = "";
        return;
      }

      if (file.size > CUSTOM_FONT_MAX_BYTES) {
        alert("Plik czcionki jest za duży (limit 5 MB).");
        el.customFontFile.value = "";
        return;
      }

      try {
        const dataUrl = await readFileAsDataUrl(file);
        state.customFontDataUrl = dataUrl;
        await idbSetCustomFont(dataUrl);
        state.customFont = { type: "custom" };
        saveCustomFont();
        if (state.theme === "custom") applyCustomFont();
      } catch (error) {
        console.error("Nie udało się wczytać czcionki:", error);
        alert("Nie udało się wczytać tego pliku.");
      } finally {
        el.customFontFile.value = "";
      }
    });

    el.customFontFileClear?.addEventListener("click", async () => {
      state.customFontDataUrl = null;
      await idbDeleteCustomFont();
      state.customFont = { type: "default" };
      saveCustomFont();
      syncCustomFontSelect();
      if (state.theme === "custom") applyCustomFont();
    });
  }

  function initializeTextureEditor() {
    for (const key of TEXTURE_FIELDS) {
      const input = $(`custom-texture-${key}`);
      const clearBtn = $(`custom-texture-${key}-clear`);

      input?.addEventListener("change", async () => {
        const file = input.files?.[0];
        if (!file) return;

        if (!/^image\/(png|jpeg)$/.test(file.type)) {
          alert("Wybierz plik w formacie JPG lub PNG.");
          input.value = "";
          return;
        }

        try {
          const dataUrl = await resizeImageToDataUrl(file);
          state.customTextures[key] = dataUrl;
          await idbSetTexture(key, dataUrl);

          if (MAP_TEXTURE_KEYS.includes(key)) {
            await registerTextureImage(key, dataUrl);
          }

          if (state.theme === "custom") applyTheme(state.theme);
        } catch (error) {
          console.error("Nie udało się wczytać tekstury:", error);
          alert("Nie udało się wczytać tego obrazu.");
        } finally {
          input.value = "";
        }
      });

      clearBtn?.addEventListener("click", async () => {
        state.customTextures[key] = null;
        await idbDeleteTexture(key);

        if (MAP_TEXTURE_KEYS.includes(key)) {
          unregisterTextureImage(key);
        }

        if (state.theme === "custom") applyTheme(state.theme);
      });
    }
  }

  initializeLabelVisibilityToggles();

  const LABEL_VISIBILITY_CHECKBOXES = () => ({
    poi: el.labelsPoiToggle,
    roads: el.labelsRoadsToggle,
    places: el.labelsPlacesToggle,
    water: el.labelsWaterToggle,
    regions: el.labelsRegionsToggle,
    countries: el.labelsCountriesToggle,
    airports: el.labelsAirportsToggle,
    boundaries: el.labelsBoundariesToggle
  });

  function syncLabelVisibilityCheckboxes() {
    const checkboxByGroup = LABEL_VISIBILITY_CHECKBOXES();
    for (const [group, checkbox] of Object.entries(checkboxByGroup)) {
      if (checkbox) checkbox.checked = state.labelVisibility[group];
    }
    updateLabelsToggleAllButton();
  }

  function updateLabelsToggleAllButton() {
    if (!el.labelsToggleAllLabel) return;
    const t = text[state.language];
    const allVisible = Object.values(state.labelVisibility).every(Boolean);
    el.labelsToggleAllLabel.textContent = allVisible
      ? t.deselectAllLabels
      : t.selectAllLabels;
  }

  function initializeLabelVisibilityToggles() {
    const checkboxByGroup = {
      poi: el.labelsPoiToggle,
      roads: el.labelsRoadsToggle,
      places: el.labelsPlacesToggle,
      water: el.labelsWaterToggle,
      regions: el.labelsRegionsToggle,
      countries: el.labelsCountriesToggle,
      airports: el.labelsAirportsToggle,
      boundaries: el.labelsBoundariesToggle
    };

    for (const [group, checkbox] of Object.entries(checkboxByGroup)) {
      if (!checkbox) continue;

      checkbox.checked = state.labelVisibility[group];

      checkbox.addEventListener("change", () => {
        state.labelVisibility[group] = checkbox.checked;
        saveLabelVisibility(state.labelVisibility);
        applyLabelVisibility();
        updateLabelsToggleAllButton();
      });
    }

    updateLabelsToggleAllButton();

    el.labelsToggleAll?.addEventListener("click", () => {
      const allVisible = Object.values(state.labelVisibility).every(Boolean);
      const nextValue = !allVisible;

      for (const group of Object.keys(state.labelVisibility)) {
        state.labelVisibility[group] = nextValue;
      }

      saveLabelVisibility(state.labelVisibility);
      applyLabelVisibility();
      syncLabelVisibilityCheckboxes();
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
  el.favoritesSortSelect?.addEventListener("change", () => {
    state.favoritesSortOrder = el.favoritesSortSelect.value;
    renderFavoritesList();
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

  function createFavoriteFolder() {
    const name = (el.favoritesNewFolderInput?.value || "").trim();
    if (!name) return;
    const exists = state.favoriteFolders.some(
      f => f.toLowerCase() === name.toLowerCase()
    );
    if (!exists) {
      state.favoriteFolders.push(name);
      saveFavoriteFolders();
    }
    state.activeFavoriteFolder = name;
    if (el.favoritesNewFolderForm) el.favoritesNewFolderForm.hidden = true;
    renderFolderChips();
    renderFavoritesList();
  }

  el.favoritesNewFolderSave?.addEventListener("click", createFavoriteFolder);
  el.favoritesNewFolderInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      createFavoriteFolder();
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
  el.historySearch?.addEventListener("input", renderHistoryList);
  el.historyClear?.addEventListener("click", clearHistoryList);
  el.menuExportAll?.addEventListener("click", exportAllSettingsJson);
  el.menuImportAllButton?.addEventListener("click", () => {
    el.menuImportAllInput?.click();
  });
  el.menuImportAllInput?.addEventListener("change", importAllSettingsJson);
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

  el.locateToggleButton?.addEventListener("click", locateFromMenu);
  el.toggle3dButton?.addEventListener("click", toggle3dView);
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
  el.clearMapButton?.addEventListener("click", clearMapView);
  el.exportPngButton?.addEventListener("click", exportMapAsPng);
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
    openAccountFromMenu
  );
  el.accountClose?.addEventListener("click", closeAccount);
  el.accountBack?.addEventListener(
    "click",
    returnFromAccountToMenu
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
    returnFromTradingSundayToMenu
  );
  el.tradingSundayClose?.addEventListener("click", closeTradingSunday);
  el.menuTradingSundayButton?.addEventListener("click", openTradingSundayFromMenu);
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
    window.OMAP_DISCOVER?.clear();
  });

  el.routeClose?.addEventListener("click", closeRoute);
  el.routeSwap?.addEventListener("click", swapRoutePoints);
  el.routeAddWaypoint?.addEventListener("click", () => {
    addRouteWaypointField();
  });
  el.routeClear?.addEventListener("click", () => {
    clearRoute();
  });
  el.routeForm?.addEventListener("submit", planRoute);
  el.routeShare?.addEventListener("click", shareRoute);

// Eksport GPX
    el.routeExportGpx?.addEventListener("click", exportRouteAsGpx);
    document.getElementById("export-gpx-button")?.addEventListener("click", exportRouteAsGPX);

// Import GPX – kliknięcie w przycisk otwiera okno wyboru pliku
    el.routeImportGpx?.addEventListener("click", () => {
    el.routeImportGpxInput?.click();
});

// Obsługa wybrania pliku
el.routeImportGpxInput?.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (file) {
        importRouteFromGpx(file);
    }
});
  for (const modeInput of document.querySelectorAll('input[name="route-mode"]')) {
    modeInput.addEventListener("change", handleRouteModeChange);
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
    updateRouteClearButton(el.routeFrom, el.routeFromClear)
  );
  el.routeTo?.addEventListener("input", () =>
    updateRouteClearButton(el.routeTo, el.routeToClear)
  );
  el.routeFromClear?.addEventListener("click", () => clearRoutePoint("a"));
  el.routeToClear?.addEventListener("click", () => clearRoutePoint("b"));
  watchRouteInputValue(el.routeFrom, el.routeFromClear);
  watchRouteInputValue(el.routeTo, el.routeToClear);
  updateRouteClearButtons();

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
    if (el.accountScopeFavoritesLabel) el.accountScopeFavoritesLabel.textContent = t.accountScopeFavorites;
    if (el.accountScopeColorsLabel) el.accountScopeColorsLabel.textContent = t.accountScopeColors;
    if (el.accountScopePlaceNamesLabel) el.accountScopePlaceNamesLabel.textContent = t.accountScopePlaceNames;
    if (el.accountScopeHistoryLabel) el.accountScopeHistoryLabel.textContent = t.accountScopeHistory;
    if (el.accountPushButton) el.accountPushButton.textContent = t.accountPush;
    if (el.accountPullButton) el.accountPullButton.textContent = t.accountPull;
    if (el.accountLogoutButton) el.accountLogoutButton.textContent = t.accountLogout;
    if (el.accountActivityButton) el.accountActivityButton.textContent = `📋 ${t.accountActivity}`;
    el.accountActivityRefreshButton?.setAttribute("aria-label", t.activityRefresh);
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
    updateRouteSaveFavoriteButton();
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
    updateLabelsToggleAllButton();
    if (el.tradingSundayTitle) el.tradingSundayTitle.textContent = t.menuTradingSunday;
    if (el.menuTradingSundayLabel) el.menuTradingSundayLabel.textContent = t.menuTradingSunday;
    if (el.tradingSundayQuestion) el.tradingSundayQuestion.textContent = t.tradingSundayQuestion;
    el.tradingSundayClose?.setAttribute("aria-label", t.closeTradingSunday);
    updateTradingSundayAnswer();
    el.legendBack?.setAttribute("aria-label", t.backToMenu);
    el.labelsBack?.setAttribute("aria-label", t.backToMenu);
    el.tradingSundayBack?.setAttribute("aria-label", t.backToMenu);
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
    renderRouteWaypoints();
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
    if (el.customFontHeading) el.customFontHeading.textContent = t.customFontHeading;
    if (el.customFontHint) el.customFontHint.textContent = t.customFontHint;
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
    renderFolderChips();
    renderFavoritesList();
    renderHistoryList();

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

    applyLabelVisibility();
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
    if (map.getLayer(CONFIG.routing.lineLayerId) && getSelectedRouteMode() === "auto") {
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
    const shared = window.OMAP_URL_STATE?.readPlaceFromUrl();
    if (!shared || !Number.isFinite(shared.lat) || !Number.isFinite(shared.lon)) return;

    // Otwórz udostępniony punkt natychmiast. Nie zostawiaj
    // jednorazowego callbacku moveend, który mógłby uruchomić
    // się dopiero podczas pierwszego późniejszego wyszukiwania.
    showPlaceInformation({
      lngLat: new maplibregl.LngLat(
        shared.lon,
        shared.lat
      )
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
        ? getMatchingFavoritePlaces(query)
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

    // Pozwala renderRouteWaypoints() podpiąć podpowiedzi wyszukiwania do
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
          refreshWaypointMarkers();

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

  // Ulubione miejsca mają praktycznie ten sam kształt co wynik
  // wyszukiwania (lat/lon/title/osm_type/address itd. - bo z takiego
  // wyniku pierwotnie powstały), więc można je wstawić bezpośrednio
  // do tej samej listy podpowiedzi bez osobnej ścieżki wyboru.
  function getMatchingFavoritePlaces(query, limit = 5) {
    const q = normalizeSearchText(query);
    if (!q) return [];

    return state.favorites
      .filter(favorite => {
        const haystack = normalizeSearchText(
          [favorite.customName, favorite.title, favorite.address]
            .filter(Boolean)
            .join(" ")
        );
        return haystack.includes(q);
      })
      .slice(0, limit)
      .map(favorite => ({
        ...favorite,
        name: favorite.customName || favorite.name || favorite.title,
        __isFavorite: true
      }));
  }

  // Współdzielona logika sortowania dla ulubionych miejsc i tras.
  // "newest"/"oldest" opiera się na kolejności w tablicy - nowe
  // wpisy są zawsze dokładane na początek (unshift), więc naturalna
  // kolejność tablicy JUŻ jest "od najnowszych" bez potrzeby
  // osobnego pola z datą.
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


  const MOBILE_PANEL_STANDARD = Object.freeze({
    collapsedHeight: 48,
    defaultHeightRatio: 0.42,
    viewportGap: 8
  });

  const mobilePanelMode = new Map();

  // Centralny rejestr wszystkich paneli mobilnych typu "arkusz z
  // dołu ekranu". Każdy nowy panel dodajemy TYLKO tutaj - reszta
  // kodu (zamykanie pozostałych przy otwieraniu jednego) działa
  // automatycznie, bez potrzeby ręcznego dopisywania go w wielu
  // miejscach w pliku.
  const MOBILE_PANELS = [
    { id: "route", close: () => closeRoute(), panel: el.routePanel, cssVariable: "--sheet-height" },
    { id: "discover", close: () => closeDiscover(), panel: el.discoverPanel, cssVariable: "--sheet-height" },
    { id: "menu", close: () => closeMenu(), panel: el.menuPanel, cssVariable: "--sheet-height" },
    { id: "favorites", close: () => closeFavoritesPanel(), panel: el.favoritesPanel, cssVariable: "--sheet-height" },
    { id: "history", close: () => closeHistory(), panel: el.historyPanel, cssVariable: "--sheet-height" },
    { id: "place", close: () => closePlacePanel(), panel: el.placePanel, cssVariable: "--sheet-height" },
    { id: "trip", close: () => closeTrip(), panel: el.tripPanel, cssVariable: "--sheet-height" },
    // Widok uliczny celowo nie zwija się przy kliknięciu na mapę -
    // tam kliknięcie w mapę służy do zmiany lokalizacji widoku, nie
    // do odrzucenia panelu.
    { id: "streetview", close: () => window.OMAP_STREETVIEW?.close(), collapsible: false },
    { id: "legend", close: () => closeLegend(), panel: el.legendPanel, cssVariable: "--sheet-height" },
    { id: "labels", close: () => closeLabels(), panel: el.labelsPanel, cssVariable: "--sheet-height" },
    { id: "tradingSunday", close: () => closeTradingSunday(), panel: el.tradingSundayPanel, cssVariable: "--sheet-height" },
    { id: "about", close: () => closeAbout(), panel: el.aboutPanel, cssVariable: "--sheet-height" },
    { id: "backup", close: () => closeBackup(), panel: el.backupPanel, cssVariable: "--sheet-height" },
    { id: "account", close: () => closeAccount(), panel: el.accountPanel, cssVariable: "--sheet-height" }
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

  function initializeBottomSheet({
    panel,
    handle,
    close,
    cssVariable
  }) {
    if (!handle || !panel) return;

    const header = panel.querySelector(
      ".app-sheet__header, .panel-shell__header"
    );

    let dragging = false;
    let startY = 0;
    let startHeight = 0;
    let activePointerId = null;
    let movedDuringGesture = false;
    let dragSource = null;

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

    const beginDrag = (event, source) => {
      if (!isMobilePanelViewport()) return;

      dragging = true;
      dragSource = source;
      movedDuringGesture = false;
      activePointerId = event.pointerId;
      startY = event.clientY;
      startHeight = panel.getBoundingClientRect().height;
      panel.classList.add("is-dragging");

      try {
        source.setPointerCapture(event.pointerId);
      } catch (_) {}
    };

    handle.addEventListener("pointerdown", event => {
      beginDrag(event, handle);
      event.preventDefault();
    });

    if (header) {
      header.addEventListener("pointerdown", event => {
        if (
          event.target.closest(
            "button, a, input, select, textarea"
          )
        ) {
          return;
        }
        beginDrag(event, header);
        event.preventDefault();
      });
    }

    // Przeciąganie treści jak w mainstreamowych apkach mapowych:
    // ciągnięcie w górę najpierw rozciąga panel do pełnej wysokości,
    // dopiero potem zaczyna przewijać treść normalnie. Ciągnięcie
    // w dół, gdy treść jest na samej górze, zwija panel z powrotem.
    // Tryb ustalamy raz na gest, na podstawie kierunku i aktualnego
    // stanu w momencie, gdy ruch staje się jednoznaczny.
    const content = panel.querySelector(
      ".app-sheet__body, .panel-shell__body"
    ) || panel;

    let contentGestureActive = false;
    let contentGestureMode = null;
    let contentGestureStartY = 0;
    let contentGesturePointerId = null;

    content.addEventListener("pointerdown", event => {
      if (!isMobilePanelViewport()) return;
      if (event.target.closest("button, a, input, select, textarea")) {
        return;
      }

      contentGestureActive = true;
      contentGestureMode = null;
      contentGestureStartY = event.clientY;
      contentGesturePointerId = event.pointerId;
    });

    content.addEventListener("pointermove", event => {
      if (
        !contentGestureActive ||
        dragging ||
        event.pointerId !== contentGesturePointerId
      ) {
        return;
      }

      if (contentGestureMode !== null) return;

      const deltaUp = contentGestureStartY - event.clientY;
      if (Math.abs(deltaUp) < 2) return;

      const maxHeight = getMobilePanelMaximumHeight();
      const currentHeight = panel.getBoundingClientRect().height;
      const atMax = currentHeight >= maxHeight - 2;
      const atTop = content.scrollTop <= 0;

      contentGestureMode = deltaUp > 0
        ? (atMax ? "content" : "panel")
        : (atTop ? "panel" : "content");

      if (contentGestureMode === "panel") {
        contentGestureActive = false;
        beginDrag(
          {
            pointerId: event.pointerId,
            clientY: contentGestureStartY
          },
          content
        );
        event.preventDefault();
      }
    });

    content.addEventListener("pointerup", () => {
      contentGestureActive = false;
      contentGestureMode = null;
    });
    content.addEventListener("pointercancel", () => {
      contentGestureActive = false;
      contentGestureMode = null;
    });

    document.addEventListener("pointermove", event => {
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
        dragSource?.releasePointerCapture(event.pointerId);
      } catch (_) {}

      dragSource = null;
    };

    document.addEventListener("pointerup", finishDrag);
    document.addEventListener("pointercancel", finishDrag);

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
      cssVariable: "--sheet-height"
    });
  }

  function initializeDiscoverBottomSheet() {
    initializeBottomSheet({
      panel: el.discoverPanel,
      handle: el.discoverSheetHandle,
      close: closeDiscover,
      cssVariable: "--sheet-height"
    });
  }

  function initializeMenuBottomSheet() {
    initializeBottomSheet({
      panel: el.menuPanel,
      handle: el.menuSheetHandle,
      close: closeMenu,
      cssVariable: "--sheet-height"
    });
  }

  function initializeFavoritesBottomSheet() {
    initializeBottomSheet({
      panel: el.favoritesPanel,
      handle: el.favoritesSheetHandle,
      close: closeFavoritesPanel,
      cssVariable: "--sheet-height"
    });
  }

  function initializeHistoryBottomSheet() {
    initializeBottomSheet({
      panel: el.historyPanel,
      handle: el.historySheetHandle,
      close: closeHistory,
      cssVariable: "--sheet-height"
    });
  }

  function initializePlaceBottomSheet() {
    initializeBottomSheet({
      panel: el.placePanel,
      handle: el.placeSheetHandle,
      close: closePlacePanel,
      cssVariable: "--sheet-height"
    });
  }

  function initializeTripBottomSheet() {
    initializeBottomSheet({
      panel: el.tripPanel,
      handle: el.tripSheetHandle,
      close: closeTrip,
      cssVariable: "--sheet-height"
    });
  }

  function initializeStreetviewBottomSheet() {
    initializeBottomSheet({
      panel: el.streetviewPanel,
      handle: el.streetviewSheetHandle,
      close: window.OMAP_STREETVIEW?.close,
      cssVariable: "--sheet-height"
    });
  }

  function initializeLegendBottomSheet() {
    initializeBottomSheet({
      panel: el.legendPanel,
      handle: el.legendSheetHandle,
      close: closeLegend,
      cssVariable: "--sheet-height"
    });
  }

  function initializeLabelsBottomSheet() {
    initializeBottomSheet({
      panel: el.labelsPanel,
      handle: el.labelsSheetHandle,
      close: closeLabels,
      cssVariable: "--sheet-height"
    });
  }

  function initializeTradingSundayBottomSheet() {
    initializeBottomSheet({
      panel: el.tradingSundayPanel,
      handle: el.tradingSundaySheetHandle,
      close: closeTradingSunday,
      cssVariable: "--sheet-height"
    });
  }

  function initializeAboutBottomSheet() {
    initializeBottomSheet({
      panel: el.aboutPanel,
      handle: el.aboutSheetHandle,
      close: closeAbout,
      cssVariable: "--sheet-height"
    });
  }

  function initializeBackupBottomSheet() {
    initializeBottomSheet({
      panel: el.backupPanel,
      handle: el.backupSheetHandle,
      close: closeBackup,
      cssVariable: "--sheet-height"
    });
  }

  function initializeAccountBottomSheet() {
    initializeBottomSheet({
      panel: el.accountPanel,
      handle: el.accountSheetHandle,
      close: closeAccount,
      cssVariable: "--sheet-height"
    });
  }


  function toggleDiscover() {
    closeMapContextMenu();
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
    if (el.discoverPanel.hidden) return;

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

  function toggleRoute() {
    closeMapContextMenu();
    const shouldOpen = el.routePanel.hidden;
    closeOtherMobilePanels("route");
    closePlacePopup();
    if (!shouldOpen) {
      state.routeBackContext = null;
      if (el.routeBack) el.routeBack.hidden = true;
    }
    el.routePanel.hidden = !shouldOpen;
    if (shouldOpen) {
      openMobilePanelStandard(el.routePanel, "--sheet-height");
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
    el.routeFrom.value = el.routeTo.value;
    el.routeTo.value = value;

    const point = state.routePointA;
    state.routePointA = state.routePointB;
    state.routePointB = point;

    // ODWRACA KOLEJNOŚĆ PRZYSTANKÓW
    state.routeWaypoints.reverse();

    refreshRouteMarkers();
    refreshWaypointMarkers();
    renderRouteWaypoints();

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
      "--sheet-height"
    );
  }

  function expandMobileRoutePanel() {
    openMobilePanelStandard(
      el.routePanel,
      "--sheet-height"
    );
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
      await handleRouteMapClick(event);

      // 2. Niezależnie od tego, czy to pierwsze, czy kolejne kliknięcie:
      // ZWIJAMY PANEL, aby odsłonić mapę
      collapseMobileRoutePanel();

      return;
    }
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
      const place = await fetchPlaceInformation(
        event.lngLat.lng,
        event.lngLat.lat,
        state.placeRequestController.signal
      );

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
    document.title = `${state.customPlaceNames[placeNameKey] || originalPlaceTitle} - Odwrotna Mapa`;
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
      setCustomPlaceName(placeNameKey, renameInput.value, originalPlaceTitle, titleButton, place, lngLat);
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
      getFavoriteKey(place, lngLat),
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
      window.OMAP_RATINGS?.loadForPlace(getFavoriteKey(place, lngLat), ratingUi);
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

  function readRouteHistory() {
    try {
      const value = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.routeHistory) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveRouteHistory() {
    safeSet(
      CONFIG.storageKeys.routeHistory,
      JSON.stringify(state.routeHistory)
    );
  }

  function readRouteFavorites() {
    try {
      const value = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.routeFavorites) || "[]"
      );
      return Array.isArray(value) ? value : [];
    } catch (_) {
      return [];
    }
  }

  function saveRouteFavorites() {
    safeSet(
      CONFIG.storageKeys.routeFavorites,
      JSON.stringify(state.routeFavorites)
    );
  }

  function buildRouteKey(pointA, pointB, mode) {
    return `${Number(pointA.lat).toFixed(5)},${Number(pointA.lon).toFixed(5)}` +
      `->${Number(pointB.lat).toFixed(5)},${Number(pointB.lon).toFixed(5)}:${mode}`;
  }

  function recordRouteHistory(pointA, pointB, mode, distance, duration) {
    if (!pointA || !pointB) return;

    const key = buildRouteKey(pointA, pointB, mode);
    const entry = {
      key,
      fromLabel: pointA.label || "",
      toLabel: pointB.label || "",
      fromLat: Number(pointA.lat),
      fromLon: Number(pointA.lon),
      toLat: Number(pointB.lat),
      toLon: Number(pointB.lon),
      mode,
      distance: Number(distance) || 0,
      duration: Number(duration) || 0,
      viewedAt: new Date().toISOString()
    };

    state.routeHistory = [
      entry,
      ...state.routeHistory.filter(item => item.key !== key)
    ].slice(0, ROUTE_HISTORY_LIMIT);

    saveRouteHistory();

    if (!el.historyPanel?.hidden) {
      renderHistoryList();
    }
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

    closeFavoritesPanel();
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

  function currentRouteFavoriteKey() {
    if (!state.routePointA || !state.routePointB) return null;
    return buildRouteKey(state.routePointA, state.routePointB, getSelectedRouteMode());
  }

  function updateRouteSaveFavoriteButton() {
    if (!el.routeSaveFavoriteButton) return;
    const key = currentRouteFavoriteKey();
    const isSaved = key && state.routeFavorites.some(item => item.key === key);
    const t = text[state.language];
    el.routeSaveFavoriteButton.textContent = isSaved
      ? `★ ${t.routeSavedFavorite}`
      : `☆ ${t.routeSaveFavorite}`;
    el.routeSaveFavoriteButton.classList.toggle("is-active", Boolean(isSaved));
  }

  function toggleCurrentRouteFavorite() {
    const key = currentRouteFavoriteKey();
    if (!key) return;

    const existingIndex = state.routeFavorites.findIndex(item => item.key === key);
    if (existingIndex !== -1) {
      state.routeFavorites.splice(existingIndex, 1);
    } else {
      state.routeFavorites = [
        {
          key,
          fromLabel: state.routePointA.label || "",
          toLabel: state.routePointB.label || "",
          fromLat: Number(state.routePointA.lat),
          fromLon: Number(state.routePointA.lon),
          toLat: Number(state.routePointB.lat),
          toLon: Number(state.routePointB.lon),
          mode: getSelectedRouteMode(),
          distance: state.lastRouteDistance || 0,
          duration: state.lastRouteDuration || 0,
          customName: "",
          folder: "",
          savedAt: new Date().toISOString()
        },
        ...state.routeFavorites
      ];
    }

    saveRouteFavorites();
    renderFolderChips();
    renderFavoritesList();
    updateRouteSaveFavoriteButton();
  }

  el.routeSaveFavoriteButton?.addEventListener("click", toggleCurrentRouteFavorite);
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

  function readFavoriteFolders() {
    try {
      const value = JSON.parse(
        localStorage.getItem(CONFIG.storageKeys.favoriteFolders) || "[]"
      );
      return Array.isArray(value) ? value.filter(v => typeof v === "string" && v.trim()) : [];
    } catch (_) {
      return [];
    }
  }

  function saveFavoriteFolders() {
    safeSet(
      CONFIG.storageKeys.favoriteFolders,
      JSON.stringify(state.favoriteFolders)
    );
  }

  function getFavoriteKey(place, lngLat) {
    const osmKey =
      place.osm_type && place.osm_id
        ? `${place.osm_type}:${place.osm_id}`
        : "";

    return osmKey ||
      `${Number(lngLat.lat).toFixed(6)},${Number(lngLat.lng).toFixed(6)}`;
  }

  function getPlaceNameKey(place, lngLat) {
    // Zawsze użyj współrzędnych jako głównego klucza
    // (są najstabilniejsze i zawsze dostępne)
    const lat = Number(place?.lat ?? lngLat?.lat);
    const lon = Number(place?.lon ?? lngLat?.lng);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return `${lat.toFixed(5)},${lon.toFixed(5)}`;
    }

    // Fallback na OSM ID tylko jeśli nie ma współrzędnych
    if (place?.osm_type && place?.osm_id) {
      return `${place.osm_type}:${place.osm_id}`;
    }

    // Ostateczny fallback
    return getFavoriteKey(place, lngLat);
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

    const placeNameKey = getPlaceNameKey(place, lngLat);
    const customName = state.customPlaceNames[placeNameKey] || "";

    state.favorites.unshift({
      key,
      savedAt: new Date().toISOString(),
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
      },
      customName: customName
    });

    state.favorites = state.favorites.slice(0, 100);
    saveFavorites();
    renderFavoritesList();

    cacheWikipediaForFavorite(key, place);

    return true;
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

    saveFavorites();
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
      await navigator.share(shareData);
    } else if (navigator.clipboard) {
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

// ===== ZMODYFIKOWANA FUNKCJA handleRouteMapClick =====
async function handleRouteMapClick(event) {
    if (el.routePanel.hidden || state.routeClickBusy) return;

    // Jeśli oba punkty są ustawione – dodaj przystanek w klikniętym miejscu
    if (state.routePointA && state.routePointB) {
        addRouteWaypoint(event.lngLat);
        return;
    }

    // Jeśli kliknięto na linię trasy (gdy trasa już istnieje) – też dodaj przystanek
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
// ===== KONIEC ZMODYFIKOWANEJ FUNKCJI =====

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
      recordRouteHistory(
        state.routePointA,
        state.routePointB,
        getSelectedRouteMode(),
        route.distance,
        route.duration
      );
      renderRouteDirections(route.maneuvers);
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
      recordRouteHistory(
        from,
        to,
        getSelectedRouteMode(),
        route.distance,
        route.duration
      );
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
        ...state.routeWaypoints
          .filter(point => point.lat != null && point.lon != null)
          .map(point => ({
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
          "line-color": getAccentColor(),
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
      auto: getAccentColor(),
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

    // ZAWSZE otwieraj/rozwijaj panel mobilny po narysowaniu trasy
    // (używamy requestAnimationFrame/setTimeout, by nie kłóciło się z początkiem fitBounds)
    requestAnimationFrame(() => {
      if (el.routePanel) {
        if (typeof expandMobileRoutePanel === "function") {
          expandMobileRoutePanel();
        } else if (typeof openMobilePanelStandard === "function") {
          openMobilePanelStandard(el.routePanel, "--sheet-height");
        }
      }
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

  function nextWaypointId() {
    state.routeWaypointSeq += 1;
    return `wp-${state.routeWaypointSeq}`;
  }

  function addRouteWaypoint(lngLat) {
    const waypoint = {
      id: nextWaypointId(),
      lon: lngLat.lng,
      lat: lngLat.lat,
      label: formatCoordinates(lngLat.lng, lngLat.lat)
    };

    state.routeWaypoints.push(waypoint);
    refreshWaypointMarkers();
    renderRouteWaypoints();
    calculateRouteFromStoredPoints();
  }

  function addRouteWaypointField() {
    state.routeWaypoints.push({
      id: nextWaypointId(),
      lon: null,
      lat: null,
      label: ""
    });
    renderRouteWaypoints();

    const list = el.routeWaypointsList;
    const lastInput = list?.querySelector(
      ".route-waypoint-row:last-child .route-waypoint-input"
    );
    lastInput?.focus();
  }

  function removeRouteWaypointById(waypointId) {
    const index = state.routeWaypoints.findIndex(
      point => point.id === waypointId
    );
    if (index === -1) return;

    const [removed] = state.routeWaypoints.splice(index, 1);
    refreshWaypointMarkers();
    renderRouteWaypoints();

    const wasResolved = removed && removed.lon != null && removed.lat != null;
    if (wasResolved && state.routePointA && state.routePointB) {
      calculateRouteFromStoredPoints();
    }
  }

  function renderRouteWaypoints() {
    const list = el.routeWaypointsList;
    if (!list) return;

    list.replaceChildren();
    const t = text[state.language];

    state.routeWaypoints.forEach((point, index) => {
      const item = document.createElement("li");
      item.className = "route-waypoint-row";

      const indexBadge = document.createElement("span");
      indexBadge.className = "route-waypoint-index";
      indexBadge.setAttribute("aria-hidden", "true");
      indexBadge.textContent = String(index + 1);

      const input = document.createElement("input");
      input.type = "search";
      input.autocomplete = "off";
      input.className = "route-waypoint-input";
      input.placeholder = t.routeWaypointStopPlaceholder(index + 1);
      input.setAttribute("aria-label", t.routeWaypointStopPlaceholder(index + 1));
      input.value = point.label || "";
      input.dataset.waypointId = point.id;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "route-waypoint-remove";
      removeButton.textContent = "×";
      removeButton.setAttribute(
        "aria-label",
        t.routeRemoveWaypoint(index + 1)
      );
      removeButton.addEventListener("click", () => {
        removeRouteWaypointById(point.id);
      });

      item.append(indexBadge, input, removeButton);
      list.appendChild(item);

      registerRouteWaypointAutocomplete?.(input, point.id);
    });
  }

  function refreshWaypointMarkers() {
    clearWaypointMarkers();

    state.routeWaypoints.forEach((point, index) => {
      if (point.lon == null || point.lat == null) return;

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
        renderRouteWaypoints();
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

    const url = isLocalOrNativeOrigin() && CONFIG.publicBaseUrl
      ? new URL(CONFIG.publicBaseUrl)
      : new URL(window.location.href);
    url.searchParams.set(
      "a",
      `${state.routePointA.lat},${state.routePointA.lon}`
    );
    url.searchParams.set(
      "b",
      `${state.routePointB.lat},${state.routePointB.lon}`
    );
    url.searchParams.set("mode", getSelectedRouteMode());

    const resolvedWaypoints = state.routeWaypoints.filter(
      point => point.lat != null && point.lon != null
    );

    if (resolvedWaypoints.length) {
      url.searchParams.set(
        "via",
        resolvedWaypoints
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
      ? via
          .split(";")
          .map(parseSharedPoint)
          .filter(Boolean)
          .map(point => ({ ...point, id: nextWaypointId() }))
      : [];

    refreshRouteMarkers();
    refreshWaypointMarkers();
    renderRouteWaypoints();
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

    state.lastRouteDistance = distanceMeters;
    state.lastRouteDuration = durationSeconds;

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
    if (el.routeExportGpx) el.routeExportGpx.hidden = false;
    if (el.routeImportGpx) el.routeImportGpx.hidden = false;
    if (el.routeClear) el.routeClear.hidden = false;
    if (el.routeSaveFavoriteButton) el.routeSaveFavoriteButton.hidden = false;
    updateRouteSaveFavoriteButton();
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
    if (el.routeExportGpx) el.routeExportGpx.hidden = true;
    if (el.routeImportGpx) el.routeImportGpx.hidden = true;
    if (el.routeClear) el.routeClear.hidden = true;
    if (el.routeSaveFavoriteButton) el.routeSaveFavoriteButton.hidden = true;
    if (el.routeWaypointNote) el.routeWaypointNote.hidden = true;
    state.routeWaypoints = [];
    clearWaypointMarkers();
    renderRouteWaypoints();
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
    closeOtherMobilePanels("history");

    openMobilePanelStandard(
      el.historyPanel,
      "--sheet-height"
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
    const lat = Number(entry?.lat);
    const lon = Number(entry?.lon);
    let payload = entry;
    
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      const customName = state.customPlaceNames[placeNameKey];
      if (customName) {
        payload = { ...entry, customName, name: customName };
      }
    }
    
    return window.OMAP_PLACE_SERVICE.open(payload, {
      source: "history"
    });
  }

  function clearHistoryList() {
    state.history = [];
    saveHistory();
    state.routeHistory = [];
    saveRouteHistory();
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

    const matchingRoutes = filterRouteEntries(state.routeHistory, el.historySearch?.value || "");

    el.historyList
      .querySelectorAll(".favorite-place-item, .route-item")
      .forEach(node => node.remove());

    const hasContent = matching.length > 0 || matchingRoutes.length > 0;
    if (el.historyEmpty) {
      el.historyEmpty.hidden = hasContent;
      el.historyEmpty.textContent = (state.history.length === 0 && state.routeHistory.length === 0)
        ? text[state.language].historyEmpty
        : text[state.language].historyNoMatch;
    }
    if (!hasContent) return;

    const combined = [
      ...matching.map(entry => ({ type: "place", entry })),
      ...matchingRoutes.map(entry => ({ type: "route", entry }))
    ].sort((a, b) => new Date(b.entry.viewedAt || 0) - new Date(a.entry.viewedAt || 0));

    combined.forEach(({ type, entry }) => {
      if (type === "place") {
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
        // Pobierz custom name jeśli istnieje
        const lat = Number(entry.lat);
        const lon = Number(entry.lon);
        let displayTitle = entry.title || (state.language === "pl" ? "Miejsce" : "Place");
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
          displayTitle = state.customPlaceNames[placeNameKey] || displayTitle;
        }
        title.textContent = displayTitle;

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
      } else {
        const item = document.createElement("div");
        item.className = "route-item";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "route-item-open";

        const icon = document.createElement("span");
        icon.className = "route-item-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = ROUTE_MODE_ICONS[entry.mode] || "🧭";

        const copy = document.createElement("span");
        copy.className = "route-item-copy";

        const title = document.createElement("strong");
        title.textContent = entry.customName ||
          `${entry.fromLabel || "?"} → ${entry.toLabel || "?"}`;

        const summary = document.createElement("small");
        summary.textContent = formatRouteSummaryShort(entry.distance, entry.duration);

        copy.append(title, summary);
        openButton.append(icon, copy);
        openButton.addEventListener("click", () => loadRouteFromEntry(entry));

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "favorite-place-remove";
        removeButton.textContent = "×";
        removeButton.title = text[state.language].historyRemove;
        removeButton.setAttribute("aria-label", text[state.language].historyRemove);
        removeButton.addEventListener("click", () => {
          state.routeHistory = state.routeHistory.filter(r => r.key !== entry.key);
          saveRouteHistory();
          renderHistoryList();
        });

        const routeRow = document.createElement("div");
        routeRow.className = "route-item-row";
        routeRow.append(openButton, removeButton);

        item.append(routeRow);
        fragment.appendChild(item);
      }
    });

    el.historyList.appendChild(fragment);
  }


  function openFavoritesPanel() {
    closeMapContextMenu();
    closeOtherMobilePanels("favorites");

    openMobilePanelStandard(
      el.favoritesPanel,
      "--sheet-height"
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
    // Dołącz custom name jeśli istnieje
    const lat = Number(result?.lat);
    const lon = Number(result?.lon);
    let payload = result;
    
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
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
    const placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
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

  function moveFavoriteToFolder(key, folderValue) {
    const favorite = state.favorites.find(item => item.key === key);
    if (favorite) {
      updateFavoriteDetails(key, {
        customName: favorite.customName || "",
        note: favorite.note || "",
        folder: folderValue
      });
      return;
    }

    const route = state.routeFavorites.find(item => item.key === key);
    if (route) {
      route.folder = folderValue;
      saveRouteFavorites();
      renderFolderChips();
      renderFavoritesList();
    }
  }

  function attachFolderDropTarget(node, folderValue) {
    node.addEventListener("dragover", event => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
      node.classList.add("is-drag-over");
    });
    node.addEventListener("dragleave", () => {
      node.classList.remove("is-drag-over");
    });
    node.addEventListener("drop", event => {
      event.preventDefault();
      node.classList.remove("is-drag-over");
      const key = event.dataTransfer.getData("text/plain");
      if (key) moveFavoriteToFolder(key, folderValue);
    });
  }

  function renderFolderChips() {
    if (!el.favoritesFolderChips) return;
    const t = text[state.language];
    el.favoritesFolderChips.innerHTML = "";

    const makeChip = (value, label, isDropTarget) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "favorites-folder-chip";
      chip.classList.toggle("is-active", state.activeFavoriteFolder === value);
      chip.textContent = label;
      chip.addEventListener("click", () => {
        state.activeFavoriteFolder = value;
        renderFolderChips();
        renderFavoritesList();
      });
      if (isDropTarget) {
        attachFolderDropTarget(chip, value === UNFILED_FOLDER ? "" : value);
      }
      el.favoritesFolderChips.appendChild(chip);
    };

    makeChip("", t.favoriteFolderAll);
    makeChip(UNFILED_FOLDER, t.favoriteFolderUnfiled, true);
    state.favoriteFolders.forEach(folder => makeChip(folder, folder, true));
  }

  function deleteFavoriteFolder(folder) {
    state.favoriteFolders = state.favoriteFolders.filter(f => f !== folder);
    saveFavoriteFolders();

    let changed = false;
    state.favorites.forEach(favorite => {
      if (favorite.folder === folder) {
        favorite.folder = "";
        changed = true;
      }
    });
    if (changed) saveFavorites();

    let routesChanged = false;
    state.routeFavorites.forEach(route => {
      if (route.folder === folder) {
        route.folder = "";
        routesChanged = true;
      }
    });
    if (routesChanged) saveRouteFavorites();

    if (state.activeFavoriteFolder === folder) state.activeFavoriteFolder = "";
    if (state.activeRouteFolder === folder) state.activeRouteFolder = "";
    renderFolderChips();
    renderFavoritesList();
  }

  function renameFavoriteFolder(oldName, newName) {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) return;

    const collision = state.favoriteFolders.some(
      f => f !== oldName && f.toLowerCase() === trimmed.toLowerCase()
    );
    if (collision) return;

    state.favoriteFolders = state.favoriteFolders.map(f => (f === oldName ? trimmed : f));
    saveFavoriteFolders();

    let changed = false;
    state.favorites.forEach(favorite => {
      if (favorite.folder === oldName) {
        favorite.folder = trimmed;
        changed = true;
      }
    });
    if (changed) saveFavorites();

    let routesChanged = false;
    state.routeFavorites.forEach(route => {
      if (route.folder === oldName) {
        route.folder = trimmed;
        routesChanged = true;
      }
    });
    if (routesChanged) saveRouteFavorites();

    if (state.activeFavoriteFolder === oldName) state.activeFavoriteFolder = trimmed;
    if (state.activeRouteFolder === oldName) state.activeRouteFolder = trimmed;
    renderFolderChips();
    renderFavoritesList();
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
      .querySelectorAll(".favorite-place-item, .route-item, .favorite-folder-row, .favorite-folder-back-row")
      .forEach(item => item.remove());

    const query = normalizeSearchText(
      el.favoritesSearch?.value || ""
    );

    const activeFolder = state.activeFavoriteFolder || "";
    const t = text[state.language];

    const filteredFavorites = (
      Array.isArray(state.favorites)
        ? state.favorites
        : []
    ).filter(favorite => {
      if (activeFolder === UNFILED_FOLDER && favorite.folder) return false;
      if (activeFolder && activeFolder !== UNFILED_FOLDER && favorite.folder !== activeFolder) return false;

      if (!query) return true;

      const haystack = normalizeSearchText(
        [
          favorite.title,
          favorite.address,
          favorite.customName,
          favorite.note,
          favorite.folder,
          favorite.lat,
          favorite.lon
        ]
          .filter(value => value !== undefined && value !== null)
          .join(" ")
      );

      return haystack.includes(query);
    });

    const favorites = sortByOrder(
      filteredFavorites,
      state.favoritesSortOrder,
      f => (f.customName || f.title || "").toLowerCase()
    );

    let filteredRoutes = filterRouteEntries(state.routeFavorites, el.favoritesSearch?.value || "");
    if (activeFolder === UNFILED_FOLDER) {
      filteredRoutes = filteredRoutes.filter(r => !r.folder);
    } else if (activeFolder) {
      filteredRoutes = filteredRoutes.filter(r => r.folder === activeFolder);
    }
    const routes = sortByOrder(
      filteredRoutes,
      state.favoritesSortOrder,
      r => (r.customName || `${r.fromLabel || ""} ${r.toLabel || ""}`).toLowerCase()
    );

    el.favoritesCount.textContent =
      String(state.favorites.length + state.routeFavorites.length);

    // Widoczne foldery (jako klikalne wiersze) liczymy niezależnie od
    // wyszukiwania tekstowego - pusty, dopiero co utworzony folder ma
    // się dać zobaczyć i "wejść w niego", zanim cokolwiek do niego
    // trafi, zamiast znikać z listy aż coś w nim wyląduje.
    const showFolderRows = !query && !activeFolder;
    const hasAny = state.favorites.length > 0 || state.routeFavorites.length > 0 ||
      (showFolderRows && state.favoriteFolders.length > 0);
    const hasMatches = favorites.length > 0 || routes.length > 0 || showFolderRows;

    el.favoritesEmpty.hidden = hasMatches;
    el.favoritesEmpty.textContent = hasAny
      ? text[state.language].favoritesNoMatch
      : text[state.language].favoritesEmpty;

    if (!hasMatches) return;

    const fragment = document.createDocumentFragment();

    if (showFolderRows) {
      state.favoriteFolders.forEach(folder => {
        const count = state.favorites.filter(f => f.folder === folder).length +
          state.routeFavorites.filter(r => r.folder === folder).length;
        const row = document.createElement("div");
        row.className = "favorite-folder-row";

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "favorite-folder-row-open";

        const icon = document.createElement("span");
        icon.className = "favorite-folder-row-icon";
        icon.setAttribute("aria-hidden", "true");
        icon.textContent = "📁";

        const name = document.createElement("span");
        name.className = "favorite-folder-row-name";
        name.textContent = folder;

        const countEl = document.createElement("span");
        countEl.className = "favorite-folder-row-count";
        countEl.textContent = String(count);

        openButton.append(icon, name, countEl);
        openButton.addEventListener("click", () => {
          state.activeFavoriteFolder = folder;
          renderFolderChips();
          renderFavoritesList();
        });

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
        removeButton.title = t.favoriteFolderDelete;
        removeButton.setAttribute("aria-label", t.favoriteFolderDelete);
        removeButton.addEventListener("click", () => deleteFavoriteFolder(folder));

        const actions = document.createElement("div");
        actions.className = "favorite-place-actions";
        actions.append(editButton, removeButton);

        const topRow = document.createElement("div");
        topRow.className = "favorite-place-row";
        topRow.append(openButton, actions);

        const renameForm = document.createElement("div");
        renameForm.className = "account-name-edit-form";
        renameForm.hidden = true;

        const renameInput = document.createElement("input");
        renameInput.type = "text";
        renameInput.className = "account-name-edit-input";
        renameInput.maxLength = 30;
        renameInput.value = folder;

        const renameActions = document.createElement("div");
        renameActions.className = "account-name-edit-actions";

        const renameSave = document.createElement("button");
        renameSave.type = "button";
        renameSave.className = "account-name-edit-save";
        renameSave.textContent = text[state.language].favoriteSave;
        renameSave.addEventListener("click", () => {
          renameFavoriteFolder(folder, renameInput.value);
        });

        const renameCancel = document.createElement("button");
        renameCancel.type = "button";
        renameCancel.className = "account-name-edit-cancel";
        renameCancel.textContent = text[state.language].favoriteCancelEdit;
        renameCancel.addEventListener("click", () => {
          renameForm.hidden = true;
        });

        renameActions.append(renameSave, renameCancel);
        renameForm.append(renameInput, renameActions);

        editButton.addEventListener("click", () => {
          renameForm.hidden = !renameForm.hidden;
          if (!renameForm.hidden) {
            renameInput.value = folder;
            renameInput.focus();
            renameInput.select();
          }
        });

        row.append(topRow, renameForm);
        attachFolderDropTarget(row, folder);

        fragment.appendChild(row);
      });
    } else if (activeFolder) {
      const backRow = document.createElement("button");
      backRow.type = "button";
      backRow.className = "favorite-folder-back-row";
      backRow.textContent = `← ${t.favoriteFolderAll}`;
      backRow.addEventListener("click", () => {
        state.activeFavoriteFolder = "";
        renderFolderChips();
        renderFavoritesList();
      });
      attachFolderDropTarget(backRow, "");
      fragment.appendChild(backRow);
    }

    // Miejsca bez folderu pokazujemy bezpośrednio na liście głównej
    // (nie jako osobny folder do "wejścia") - żeby nie trzeba było
    // klikać nigdzie, aby zobaczyć zwykłe, nieposegregowane ulubione.
    const visibleFavorites = showFolderRows
      ? favorites.filter(favorite => !favorite.folder)
      : favorites;

    visibleFavorites.forEach(favorite => {
        const item = document.createElement("div");
        item.className = "favorite-place-item";
        item.draggable = true;

        item.addEventListener("dragstart", event => {
          event.dataTransfer.setData("text/plain", favorite.key);
          event.dataTransfer.effectAllowed = "move";
          item.classList.add("is-dragging");
        });
        item.addEventListener("dragend", () => {
          item.classList.remove("is-dragging");
        });

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
          renderFolderChips();
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

        const folderLabel = document.createElement("label");
        folderLabel.textContent = t.favoriteFolderLabel;
        const folderSelect = document.createElement("select");
        folderSelect.className = "favorite-folder-select";
        const unfiledOption = document.createElement("option");
        unfiledOption.value = "";
        unfiledOption.textContent = t.favoriteFolderUnfiled;
        folderSelect.appendChild(unfiledOption);
        state.favoriteFolders.forEach(folderName => {
          const option = document.createElement("option");
          option.value = folderName;
          option.textContent = folderName;
          folderSelect.appendChild(option);
        });
        folderSelect.value = favorite.folder || "";
        folderLabel.append(folderSelect);

        const editActions = document.createElement("div");
        editActions.className = "favorite-place-edit-actions";

        const saveButton = document.createElement("button");
        saveButton.type = "button";
        saveButton.className = "favorite-place-edit-save";
        saveButton.textContent = text[state.language].favoriteSave;
        saveButton.addEventListener("click", () => {
          updateFavoriteDetails(favorite.key, {
            customName: nameInput.value,
            note: noteInput.value,
            folder: folderSelect.value
          });
          renderFolderChips();
        });

        const cancelButton = document.createElement("button");
        cancelButton.type = "button";
        cancelButton.className = "favorite-place-edit-cancel";
        cancelButton.textContent = text[state.language].favoriteCancelEdit;
        cancelButton.addEventListener("click", () => {
          editForm.hidden = true;
        });

        editActions.append(saveButton, cancelButton);
        editForm.append(nameLabel, noteLabel, folderLabel, editActions);

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

    const visibleRoutes = showFolderRows
      ? routes.filter(r => !r.folder)
      : routes;

    visibleRoutes.forEach(entry => {
      const item = document.createElement("div");
      item.className = "route-item";
      item.draggable = true;
      item.addEventListener("dragstart", event => {
        event.dataTransfer.setData("text/plain", entry.key);
        event.dataTransfer.effectAllowed = "move";
        item.classList.add("is-dragging");
      });
      item.addEventListener("dragend", () => item.classList.remove("is-dragging"));

      const openButton = document.createElement("button");
      openButton.type = "button";
      openButton.className = "route-item-open";

      const icon = document.createElement("span");
      icon.className = "route-item-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = ROUTE_MODE_ICONS[entry.mode] || "🧭";

      const copy = document.createElement("span");
      copy.className = "route-item-copy";

      const title = document.createElement("strong");
      title.textContent = entry.customName ||
        `${entry.fromLabel || "?"} → ${entry.toLabel || "?"}`;

      const summary = document.createElement("small");
      summary.textContent = formatRouteSummaryShort(entry.distance, entry.duration);

      copy.append(title, summary);
      openButton.append(icon, copy);
      openButton.addEventListener("click", () => loadRouteFromEntry(entry));

      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "favorite-place-edit-toggle";
      editButton.textContent = "✎";
      editButton.title = t.favoriteEdit;
      editButton.setAttribute("aria-label", t.favoriteEdit);

      const routeEditForm = document.createElement("div");
      routeEditForm.className = "favorite-place-edit-form";
      routeEditForm.hidden = true;

      const routeNameLabel = document.createElement("label");
      routeNameLabel.textContent = t.favoriteCustomNameLabel;
      const routeNameInput = document.createElement("input");
      routeNameInput.type = "text";
      routeNameInput.placeholder = t.favoriteCustomNamePlaceholder;
      routeNameInput.value = entry.customName || "";
      routeNameLabel.append(routeNameInput);

      const routeFolderLabel = document.createElement("label");
      routeFolderLabel.textContent = t.favoriteFolderLabel;
      const routeFolderSelect = document.createElement("select");
      routeFolderSelect.className = "favorite-folder-select";
      const routeUnfiledOption = document.createElement("option");
      routeUnfiledOption.value = "";
      routeUnfiledOption.textContent = t.favoriteFolderUnfiled;
      routeFolderSelect.appendChild(routeUnfiledOption);
      state.favoriteFolders.forEach(folderName => {
        const option = document.createElement("option");
        option.value = folderName;
        option.textContent = folderName;
        routeFolderSelect.appendChild(option);
      });
      routeFolderSelect.value = entry.folder || "";
      routeFolderLabel.append(routeFolderSelect);

      const routeEditActions = document.createElement("div");
      routeEditActions.className = "favorite-place-edit-actions";
      const routeSaveButton = document.createElement("button");
      routeSaveButton.type = "button";
      routeSaveButton.className = "favorite-place-edit-save";
      routeSaveButton.textContent = t.favoriteSave;
      routeSaveButton.addEventListener("click", () => {
        entry.customName = (routeNameInput.value || "").trim();
        entry.folder = routeFolderSelect.value || "";
        saveRouteFavorites();
        renderFolderChips();
        renderFavoritesList();
      });
      const routeCancelButton = document.createElement("button");
      routeCancelButton.type = "button";
      routeCancelButton.className = "favorite-place-edit-cancel";
      routeCancelButton.textContent = t.favoriteCancelEdit;
      routeCancelButton.addEventListener("click", () => { routeEditForm.hidden = true; });
      routeEditActions.append(routeSaveButton, routeCancelButton);
      routeEditForm.append(routeNameLabel, routeFolderLabel, routeEditActions);
      editButton.addEventListener("click", () => { routeEditForm.hidden = !routeEditForm.hidden; });

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "favorite-place-remove";
      removeButton.textContent = "×";
      removeButton.title = t.favoriteRemove || "×";
      removeButton.setAttribute("aria-label", removeButton.title);
      removeButton.addEventListener("click", () => {
        state.routeFavorites = state.routeFavorites.filter(r => r.key !== entry.key);
        saveRouteFavorites();
        renderFolderChips();
        renderFavoritesList();
        updateRouteSaveFavoriteButton();
      });

      const actions = document.createElement("div");
      actions.className = "favorite-place-actions";
      actions.append(editButton, removeButton);

      const routeRow = document.createElement("div");
      routeRow.className = "route-item-row";
      routeRow.append(openButton, actions);

      item.append(routeRow, routeEditForm);
      fragment.appendChild(item);
    });

    el.favoritesList.appendChild(fragment);
  }

  function updateFavoriteDetails(key, { customName, note, folder }) {
    const favorite = state.favorites.find(item => item.key === key);
    if (!favorite) return;

    favorite.customName = (customName || "").trim();
    favorite.note = (note || "").trim();
    if (folder !== undefined) favorite.folder = folder || "";

    saveFavorites();
    renderFolderChips();
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
      payload.favoriteFolders = [...state.favoriteFolders];
      payload.routeFavorites = [...state.routeFavorites];
    }

    if (scopes.includes("colors")) {
      payload.customPalette = { ...state.customPalette };

      const textureEntries = Object.entries(state.customTextures || {}).filter(
        ([, dataUrl]) => Boolean(dataUrl)
      );
      if (textureEntries.length > 0) {
        payload.customTextures = Object.fromEntries(textureEntries);
      }

      if (state.customFont && state.customFont.type !== "default") {
        payload.customFont = { ...state.customFont };
        if (state.customFont.type === "custom" && state.customFontDataUrl) {
          payload.customFontData = state.customFontDataUrl;
        }
      }
    }

    if (scopes.includes("placeNames")) {
      const nameEntries = Object.entries(state.customPlaceNames || {}).filter(
        ([, name]) => Boolean(name)
      );
      if (nameEntries.length > 0) {
        payload.customPlaceNames = Object.fromEntries(nameEntries);
      }
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

        if (Array.isArray(raw?.favoriteFolders)) {
          const existingLower = new Set(state.favoriteFolders.map(f => f.toLowerCase()));
          for (const folder of raw.favoriteFolders) {
            if (typeof folder === "string" && folder.trim() && !existingLower.has(folder.trim().toLowerCase())) {
              state.favoriteFolders.push(folder.trim());
              existingLower.add(folder.trim().toLowerCase());
            }
          }
          saveFavoriteFolders();
        }

        if (Array.isArray(raw?.routeFavorites)) {
          const existingKeys = new Set(state.routeFavorites.map(r => r.key));
          const importedRoutes = raw.routeFavorites.filter(
            r => r && r.key && !existingKeys.has(r.key)
          );
          if (importedRoutes.length) {
            state.routeFavorites = [...state.routeFavorites, ...importedRoutes];
            saveRouteFavorites();
          }
        }

        renderFolderChips();
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
        colorsImportedFlag = true;
      }

      if (
        scopes.includes("colors") &&
        raw?.customTextures &&
        typeof raw.customTextures === "object"
      ) {
        for (const key of TEXTURE_FIELDS) {
          const dataUrl = raw.customTextures[key];
          if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) {
            continue;
          }

          state.customTextures[key] = dataUrl;
          await idbSetTexture(key, dataUrl);

          if (MAP_TEXTURE_KEYS.includes(key)) {
            await registerTextureImage(key, dataUrl);
          }
        }
        colorsImportedFlag = true;
      }

      if (
        scopes.includes("colors") &&
        raw?.customFont &&
        typeof raw.customFont === "object" &&
        typeof raw.customFont.type === "string"
      ) {
        if (raw.customFont.type === "google" && raw.customFont.googleFont) {
          state.customFont = { type: "google", googleFont: raw.customFont.googleFont };
          state.customFontDataUrl = null;
          saveCustomFont();
          colorsImportedFlag = true;
        } else if (
          raw.customFont.type === "custom" &&
          typeof raw.customFontData === "string" &&
          raw.customFontData.startsWith("data:")
        ) {
          state.customFont = { type: "custom" };
          state.customFontDataUrl = raw.customFontData;
          await idbSetCustomFont(raw.customFontData);
          saveCustomFont();
          colorsImportedFlag = true;
        }
        syncCustomFontSelect();
      }

      if (colorsImportedFlag && state.theme === "custom") {
        applyTheme(state.theme);
      }

      let placeNamesImportedFlag = false;

      if (
        scopes.includes("placeNames") &&
        raw?.customPlaceNames &&
        typeof raw.customPlaceNames === "object"
      ) {
        for (const [key, name] of Object.entries(raw.customPlaceNames)) {
          const trimmed = String(name || "").trim();
          if (typeof key === "string" && key && trimmed) {
            state.customPlaceNames[key] = trimmed;
          }
        }
        saveCustomPlaceNames();
        placeNamesImportedFlag = true;
      }

      const messages = [];
      if (favoritesImportedFlag) {
        messages.push(text[state.language].favoritesImported(importedCount));
      }
      if (colorsImportedFlag) {
        messages.push(text[state.language].colorsImported);
      }
      if (placeNamesImportedFlag) {
        messages.push(text[state.language].placeNamesImported);
      }

      show(messages.join(" ") || text[state.language].favoritesImportError);
    } catch (error) {
      console.error(error);
      show(text[state.language].favoritesImportError);
    }
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

  function updateTradingSundayAnswer() {
    const { isSunday, isTrading } = isTodayTradingSundayPL();
    const t = text[state.language];

    if (el.tradingSundayAnswer) {
      el.tradingSundayAnswer.textContent = isTrading ? t.yes : t.no;
      el.tradingSundayAnswer.classList.toggle("is-yes", isTrading);
      el.tradingSundayAnswer.classList.toggle("is-no", !isTrading);
    }

    if (el.tradingSundayNote) {
      el.tradingSundayNote.textContent = isSunday
        ? ""
        : t.tradingSundayNotSunday;
    }
  }

  function openTradingSundayFromMenu() {
    closeOtherMobilePanels("tradingSunday");

    updateTradingSundayAnswer();

    openMobilePanelStandard(
      el.tradingSundayPanel,
      "--sheet-height"
    );
    el.menuTradingSundayButton?.setAttribute("aria-expanded", "true");
  }

  function closeTradingSunday() {
    if (!el.tradingSundayPanel || el.tradingSundayPanel.hidden) return;
    el.tradingSundayPanel.hidden = true;
    el.menuTradingSundayButton?.setAttribute("aria-expanded", "false");
  }

  function returnFromTradingSundayToMenu() {
    closeTradingSunday();
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
    closeFavoritesPanel();
    closeHistory();
    openMenuHome();
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
    if (isElectronPlatform()) {
      show(text[state.language].locatingForRoute, 0);

      fetchLocationByIp()
        .then(({ latitude, longitude }) => {
          hide();
          onResolved({
            lon: longitude,
            lat: latitude,
            label: text[state.language].menuLocation,
            __resolvedPoint: true
          });
        })
        .catch(error => {
          console.warn("Lokalizacja po IP nie powiodła się.", error);
          show(text[state.language].locateError);
        });
      return;
    }

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


  function toggle3dView() {
    state.is3dView = !state.is3dView;

    map.easeTo({
      pitch: state.is3dView ? 60 : 0,
      duration: 500
    });

    el.toggle3dButton?.classList.toggle("is-active", state.is3dView);
    el.toggle3dButton?.setAttribute(
      "aria-pressed",
      String(state.is3dView)
    );
  }

  function locateFromMenu() {
    if (isElectronPlatform()) {
      show(
        state.language === "pl"
          ? "Pobieranie lokalizacji…"
          : "Getting your location…",
        0
      );

      fetchLocationByIp()
        .then(({ latitude, longitude }) => {
          showUserLocationMarker({ lng: longitude, lat: latitude });
          map.flyTo({
            center: [longitude, latitude],
            zoom: 11,
            bearing: 180
          });
          hide();
          if (map && typeof map.resize === "function") {
          map.resize();
}
        })
        .catch(error => {
          console.warn("Lokalizacja po IP nie powiodła się.", error);
          show(
            state.language === "pl"
              ? "Nie udało się pobrać lokalizacji."
              : "Your location could not be retrieved."
          );
        });
      return;
    }

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

let hasPannedToUser = false; // Zapobiega ciągłemu przeskakiwaniu mapy!

  if (window.userLocationWatchId) {
    navigator.geolocation.clearWatch(window.userLocationWatchId);
  }

  window.userLocationWatchId = navigator.geolocation.watchPosition(
    position => {
      const lon = position.coords.longitude;
      const lat = position.coords.latitude;
      const lngLat = new maplibregl.LngLat(lon, lat);

      // 1. Zawsze aktualizujemy tylko pozycję samej niebieskiej kropki
      showUserLocationMarker(lngLat);

      // 2. Mapę centrujemy TYLKO PIERWSZY RAZ!
      // Gdy GPS skoryguje pozycję po kilku sekundach, kropka się przesunie, ale mapa NIE PRZESKOCZY.
      if (!hasPannedToUser) {
        hasPannedToUser = true;

        map.flyTo({
          center: [lon, lat],
          zoom: Math.max(map.getZoom(), 15),
          bearing: map.getBearing() // Utrzymuje obecny obrót (np. 180°), zapobiegając "fikołkowi" mapy
        });

        hide();

        requestAnimationFrame(() => {
          if (map && typeof map.resize === "function") {
            map.resize();
          }
        });
      }
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
      timeout: 15000,
      maximumAge: 0 // Zmusza do natychmiastowego pobrania świeżego punktu z czujnika
    }
  );
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result || "";
        resolve(String(result).split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function exportMapAsPng() {
    const t = text[state.language];

    show(t.exportPngWorking, 0);

    try {
      map.once("render", () => {
        const canvas = map.getCanvas();

        canvas.toBlob(async blob => {
          if (!blob) {
            show(t.exportPngError);
            return;
          }

          const fileName = `odwrotna-mapa-${Date.now()}.png`;

          // Android WebView nie obsługuje niezawodnie pobierania
          // plików przez <a download> ani udostępniania blobów -
          // tam zapisujemy plik natywnie i otwieramy systemowe
          // okno udostępniania/zapisu, tak jak przy kopii zapasowej.
          if (
            window.CapacitorPlatform === "android" &&
            window.CapacitorFilesystem
          ) {
            try {
              const base64 = await blobToBase64(blob);
              const writeResult = await window.CapacitorFilesystem.writeFile({
                path: fileName,
                data: base64,
                directory: window.CapacitorDirectory.Cache
              });

              await window.CapacitorShare.share({
                title: fileName,
                files: [writeResult.uri]
              });
              show(t.exportPngDone);
            } catch (error) {
              console.error(error);
              show(t.exportPngError);
            }
            return;
          }

          const file = new File([blob], fileName, {
            type: "image/png"
          });

          // Safari na iOS nie obsługuje poprawnie atrybutu
          // download - tam trzeba użyć natywnego arkusza
          // udostępniania, żeby dało się zapisać obrazek.
          if (
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            try {
              await navigator.share({ files: [file] });
              show(t.exportPngDone);
              return;
            } catch (error) {
              if (error?.name === "AbortError") {
                hide();
                return;
              }
              console.error(error);
            }
          }

          try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            show(t.exportPngDone);
          } catch (error) {
            console.error(error);
            show(t.exportPngError);
          }
        }, "image/png");
      });
      map.triggerRepaint();
    } catch (error) {
      console.error(error);
      show(t.exportPngError);
    }
  }

  function clearMapView() {
    closeMapContextMenu();
    clearRoute();
    window.OMAP_DISCOVER?.clear();
    removeContextPointMarker();
    removeUserLocationMarker();
    hideAllAutocomplete();

    closeOtherMobilePanels([]);

    show(text[state.language].mapCleared);
  }

  function toggleAbout() {
    closeMapContextMenu();

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
    if (el.aboutPanel.hidden) return;
    el.aboutPanel.hidden = true;
    el.aboutButton?.setAttribute("aria-expanded", "false");
  }

  function closeBackup() {
    if (!el.backupPanel || el.backupPanel.hidden) return;
    el.backupPanel.hidden = true;
    el.menuBackupButton?.setAttribute("aria-expanded", "false");
  }

  function openAccountFromMenu() {
    closeOtherMobilePanels("account");

    openMobilePanelStandard(
      el.accountPanel,
      "--sheet-height"
    );
    el.menuAccountButton?.setAttribute("aria-expanded", "true");
    refreshAccountUI();
  }

  function returnFromAccountToMenu() {
    closeAccount();
    openMenuHome();
  }

  function closeAccount() {
    if (!el.accountPanel || el.accountPanel.hidden) return;
    el.accountPanel.hidden = true;
    el.menuAccountButton?.setAttribute("aria-expanded", "false");
  }

  // ===== Konto i synchronizacja (seed-fraza + Web Crypto, bez blockchaina) =====

  function getStoredSeedWords() {
    try {
      const raw = localStorage.getItem(CONFIG.storageKeys.syncSeed);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function storeSeedWords(words) {
    safeSet(CONFIG.storageKeys.syncSeed, JSON.stringify(words));
  }

  function clearStoredSeedWords() {
    localStorage.removeItem(CONFIG.storageKeys.syncSeed);
    localStorage.removeItem(CONFIG.storageKeys.syncLastSyncedAt);
  }

  function showAccountMessage(message, kind) {
    if (!el.accountMessage) return;
    el.accountMessage.textContent = message;
    el.accountMessage.hidden = false;
    el.accountMessage.classList.remove(
      "account-message--error",
      "account-message--success"
    );
    if (kind) el.accountMessage.classList.add(`account-message--${kind}`);
  }

  function clearAccountMessage() {
    if (!el.accountMessage) return;
    el.accountMessage.hidden = true;
    el.accountMessage.textContent = "";
  }

  function renderSeedWordsGrid(container, words) {
    if (!container) return;
    container.innerHTML = "";
    words.forEach(word => {
      const chip = document.createElement("span");
      chip.className = "account-seed-word";
      chip.textContent = word;
      container.appendChild(chip);
    });
  }

  async function copyWordsToClipboard(words) {
    const t = text[state.language];
    const phrase = words.join(" ");
    try {
      await navigator.clipboard.writeText(phrase);
      showAccountMessage(t.accountCopiedPhrase, "success");
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountCopyPhraseFailed, "error");
    }
  }

  function formatSyncTimestamp(iso) {
    if (!iso) return null;
    try {
      const date = new Date(iso);
      return date.toLocaleString(state.language === "pl" ? "pl-PL" : "en-US");
    } catch (_) {
      return null;
    }
  }

  const ACCOUNT_SCREENS = ["home", "login", "register", "loggedin", "activity"];

  function showAccountScreen(name) {
    const map = {
      home: el.accountScreenHome,
      login: el.accountScreenLogin,
      register: el.accountScreenRegister,
      loggedin: el.accountScreenLoggedIn,
      activity: el.accountScreenActivity
    };
    for (const key of ACCOUNT_SCREENS) {
      if (map[key]) map[key].hidden = key !== name;
    }
    clearAccountMessage();
  }

  function isAutoSyncEnabled() {
    const stored = safeGet(CONFIG.storageKeys.syncAutoEnabled, "");
    return stored === "" ? true : stored === "1";
  }

  function updateManualSyncButtonsVisibility() {
    // Skoro synchronizacja w tle sama pobiera i wysyła dane, ręczne
    // przyciski są zbędne w typowym przypadku - pokazujemy je tylko
    // wtedy, gdy auto-sync jest wyłączony (żeby nie zostać bez żadnej
    // możliwości ręcznej synchronizacji).
    const auto = isAutoSyncEnabled();
    if (el.accountPullButton) el.accountPullButton.hidden = auto;
    if (el.accountPushButton) el.accountPushButton.hidden = auto;
  }

  // Jednorazowo wyprowadza komplet materiału potrzebnego do rozmowy
  // z przekaźnikami (klucze + identyfikator publiczny), żeby nie
  // powtarzać tego samego, dość kosztownego (PBKDF2) wyprowadzania
  // kluczy w kilku miejscach osobno.
  async function deriveAccountContext(words) {
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    const transport = window.OMAP_SYNC_TRANSPORT;
    if (!cryptoApi || !transport || !words) return null;
    const nostrLib = await transport.waitForNostrLib();
    const { encKey, nostrPrivKeyBytes } = await cryptoApi.deriveKeys(words);
    const nostrPubKeyHex = nostrLib.getPublicKey(nostrPrivKeyBytes);
    return { cryptoApi, transport, nostrLib, encKey, nostrPrivKeyBytes, nostrPubKeyHex };
  }

  async function computeAndShowIdentity() {
    const words = getStoredSeedWords();
    if (!words) return;
    try {
      const ctx = await deriveAccountContext(words);
      if (!ctx) return;
      const npub = ctx.nostrLib.npubEncode
        ? ctx.nostrLib.npubEncode(ctx.nostrPubKeyHex)
        : ctx.nostrPubKeyHex;
      if (el.accountPublicId) {
        // Pełny npub bywa długi (63 znaki) - do samego rozpoznania "czy
        // to na pewno to samo konto" wystarczy garść znaków, długości
        // zbliżonej do identyfikatora filmu na YouTube. Pełny
        // identyfikator nadal kopiuje przycisk "Kopiuj".
        el.accountPublicId.textContent = npub.slice(0, 11);
        el.accountPublicId.dataset.fullId = npub;
      }
    } catch (error) {
      console.error("Nie udało się wyznaczyć identyfikatora konta:", error);
    }
  }

  function getStoredProfile() {
    return {
      name: safeGet(CONFIG.storageKeys.syncProfileName, ""),
      avatar: safeGet(CONFIG.storageKeys.syncProfileAvatar, "")
    };
  }

  function storeProfileLocally(profile) {
    safeSet(CONFIG.storageKeys.syncProfileName, profile.name || "");
    safeSet(CONFIG.storageKeys.syncProfileAvatar, profile.avatar || "");
  }

  function renderProfileUI() {
    const profile = getStoredProfile();
    const t = text[state.language];
    if (el.accountProfileNameInput) el.accountProfileNameInput.value = profile.name || "";
    if (el.accountDisplayName) {
      el.accountDisplayName.textContent = profile.name || t.accountNoName;
      if (profile.name) {
        el.accountDisplayName.dataset.hasCustomName = "1";
      } else {
        delete el.accountDisplayName.dataset.hasCustomName;
      }
    }
    if (el.accountAvatarPreview && el.accountAvatarPlaceholder) {
      if (profile.avatar) {
        el.accountAvatarPreview.src = profile.avatar;
        el.accountAvatarPreview.hidden = false;
        el.accountAvatarPlaceholder.hidden = true;
      } else {
        el.accountAvatarPreview.hidden = true;
        el.accountAvatarPreview.removeAttribute("src");
        el.accountAvatarPlaceholder.hidden = false;
      }
    }
  }

  async function pullProfile(ctx) {
    if (!ctx) return;
    try {
      const remote = await ctx.transport.pullBlob(ctx.nostrPubKeyHex, "profile");
      if (!remote) return;
      const profile = await ctx.cryptoApi.decryptPayload(remote.blob, ctx.encKey);
      storeProfileLocally({ name: profile.name || "", avatar: profile.avatar || "" });
      renderProfileUI();
    } catch (error) {
      console.error("Nie udało się pobrać profilu:", error);
    }
  }

  function refreshAccountUI() {
    const words = getStoredSeedWords();

    if (!words) {
      stopAutoSyncTimer();
      showAccountScreen("home");
      return;
    }

    const t = text[state.language];
    const lastSyncedAt = safeGet(CONFIG.storageKeys.syncLastSyncedAt, "");
    const formatted = formatSyncTimestamp(lastSyncedAt);
    if (el.accountStatusText) {
      let statusText = formatted
        ? t.accountStatusActive.replace("{time}", formatted)
        : t.accountStatusActiveNever;

      try {
        const lastSkipped = JSON.parse(safeGet(CONFIG.storageKeys.syncLastSkipped, "[]"));
        if (Array.isArray(lastSkipped) && lastSkipped.length) {
          statusText += t.accountStatusSkippedWarning.replace("{items}", lastSkipped.join(", "));
        }
      } catch (_) {
        // ignoruj uszkodzone dane
      }

      el.accountStatusText.textContent = statusText;
    }

    if (el.accountAutoSyncCheckbox) el.accountAutoSyncCheckbox.checked = isAutoSyncEnabled();
    updateManualSyncButtonsVisibility();
    renderProfileUI();
    computeAndShowIdentity();

    if (el.accountSeedRevealWords) {
      renderSeedWordsGrid(el.accountSeedRevealWords, words);
    }
    if (el.accountRevealDetails) el.accountRevealDetails.open = false;
    if (el.accountNameEditForm) el.accountNameEditForm.hidden = true;

    // Nie wyrzucamy z ekranu "Aktywność", jeśli użytkownik akurat go
    // przegląda - w przeciwnym razie cicha synchronizacja w tle (co
    // kilka minut) resetowałaby widok bez żadnego powodu.
    const isBrowsingActivity = el.accountScreenActivity && !el.accountScreenActivity.hidden;
    if (!isBrowsingActivity) {
      showAccountScreen("loggedin");
    }
    scheduleAutoSyncCheck();
  }

  function handleCreateAccount() {
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    if (!cryptoApi) return;

    const words = cryptoApi.generateSeedWords(CONFIG.sync?.wordCount || 16);
    renderSeedWordsGrid(el.accountSeedWords, words);
    el.accountScreenRegister.dataset.pendingWords = JSON.stringify(words);

    if (el.accountSeedConfirmCheckbox) el.accountSeedConfirmCheckbox.checked = false;
    if (el.accountSeedConfirmButton) el.accountSeedConfirmButton.disabled = true;

    showAccountScreen("register");
  }

  function handleConfirmSeed() {
    const t = text[state.language];
    try {
      const words = JSON.parse(
        el.accountScreenRegister.dataset.pendingWords || "[]"
      );
      if (!Array.isArray(words) || !words.length) return;
      storeSeedWords(words);
      delete el.accountScreenRegister.dataset.pendingWords;
      refreshAccountUI();
      showAccountMessage(t.accountActivated, "success");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLoginWithSeed() {
    const t = text[state.language];
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    if (!cryptoApi) return;

    const words = cryptoApi.normalizeSeedInput(el.accountSeedInput?.value || "");
    const validation = cryptoApi.validateSeedWords(words);

    if (!validation.valid) {
      if (validation.error === "toKrotko") {
        showAccountMessage(t.accountSeedTooShort, "error");
      } else {
        showAccountMessage(t.accountSeedUnknownWord.replace("{word}", validation.word), "error");
      }
      return;
    }

    storeSeedWords(words);
    if (el.accountSeedInput) el.accountSeedInput.value = "";

    if (el.accountLoginButton) el.accountLoginButton.disabled = true;
    showAccountMessage(t.accountLoggedInPulling, null);

    try {
      // Celowo NIE wołamy tu jeszcze refreshAccountUI()/auto-sync - to
      // pierwsze pobranie musi się zakończyć jako pierwsze, zanim
      // cokolwiek (łącznie z auto-synchronizacją w tle) miałoby szansę
      // wysłać stan tego (nowego dla tego konta) urządzenia do chmury
      // i przypadkiem nadpisać to, co tam już jest.
      const scopes = getCheckedSyncScopes();
      const result = await performPull(scopes, { silent: true });

      const ctx = await deriveAccountContext(words);
      await pullProfile(ctx);

      refreshAccountUI();
      if (result?.applied) {
        showAccountMessage(t.accountLoggedInApplied, "success");
      } else {
        showAccountMessage(t.accountLoggedInNothingFound, "success");
      }
    } catch (error) {
      console.error(error);
      refreshAccountUI();
      showAccountMessage(t.accountLoggedInPullFailed, "error");
    } finally {
      if (el.accountLoginButton) el.accountLoginButton.disabled = false;
    }
  }

  function handleLogoutAccount() {
    stopAutoSyncTimer();
    clearStoredSeedWords();
    if (el.accountSeedInput) el.accountSeedInput.value = "";
    refreshAccountUI();
  }

  function getCheckedSyncScopes() {
    const scopes = [];
    if (el.accountSyncScopeFavorites?.checked) scopes.push("favorites");
    if (el.accountSyncScopeColors?.checked) scopes.push("colors");
    if (el.accountSyncScopePlaceNames?.checked) scopes.push("placeNames");
    if (el.accountSyncScopeHistory?.checked) scopes.push("history");
    return scopes;
  }

  function buildSyncPayload(scopes) {
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
      payload.favoriteFolders = [...state.favoriteFolders];
      payload.routeFavorites = [...state.routeFavorites];
    }

    if (scopes.includes("colors")) {
      payload.theme = state.theme;
      payload.language = state.language;
      payload.customPalette = { ...state.customPalette };
      if (state.customFont?.type === "google") {
        payload.customFont = { type: "google", googleFont: state.customFont.googleFont };
      } else if (state.customFont?.type === "custom") {
        // Same bajty czcionki jadą osobnym, małym zdarzeniem (patrz
        // pushColorMedia) - tu zostawiamy tylko znacznik typu.
        payload.customFont = { type: "custom" };
      }
    }

    if (scopes.includes("placeNames")) {
      payload.customPlaceNames = { ...(state.customPlaceNames || {}) };
    }

    if (scopes.includes("history")) {
      payload.history = state.history.map(entry => ({ ...entry }));
      payload.routeHistory = state.routeHistory.map(entry => ({ ...entry }));
    }

    return payload;
  }

  // Tekstury (zdjęcia) i wgrany plik czcionki to duże dane binarne, więc
  // zamiast wrzucać je do jednego dużego zdarzenia (ryzyko przekroczenia
  // limitów rozmiaru wielu publicznych przekaźników), publikujemy je
  // jako osobne, małe zdarzenia - jedno na slot. Puste sloty też
  // publikujemy (jako pusty ciąg) - to sygnał "wyczyszczone", inaczej
  // usunięta lokalnie tekstura "wróciłaby" przy kolejnym pobraniu.
  // Wiele publicznych przekaźników Nostr odrzuca zbyt duże zdarzenia
  // (typowo limit rzędu 64-256 KB) - zdjęcie jako base64 łatwo to
  // przekracza i przekaźnik po prostu je odrzuca. Dlatego przed
  // wysyłką przeskalowujemy/kompresujemy teksturę do rozsądnego
  // rozmiaru (jakość lokalnej kopii się nie zmienia - to dotyczy
  // tylko wersji wysyłanej do synchronizacji).
  const MEDIA_SIZE_LIMIT = 180000; // ~180 KB zakodowanego tekstu (base64) - bezpieczny margines
  // Czcionek (w przeciwieństwie do zdjęć) nie da się dalej "dokręcić"
  // po konwersji do WOFF2 - to już najlepsza możliwa kompresja. Dajemy
  // im więc więcej luzu niż teksturom, tym bardziej że mamy 8
  // przekaźników naraz i wystarczy, że przyjmie choć jeden.
  const FONT_SIZE_LIMIT = 350000; // ~350 KB zakodowanego tekstu (base64)

  function downscaleImageDataUrl(dataUrl, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Nie udało się wczytać obrazu do przeskalowania."));
      img.src = dataUrl;
    });
  }

  async function prepareTextureForSync(dataUrl) {
    if (!dataUrl) return "";
    // Coraz mocniejsza kompresja, aż zmieści się w limicie - albo się poddajemy.
    const attempts = [
      [1024, 0.72],
      [768, 0.6],
      [512, 0.5],
      [384, 0.4],
      [320, 0.32]
    ];
    for (const [maxDim, quality] of attempts) {
      try {
        const resized = await downscaleImageDataUrl(dataUrl, maxDim, quality);
        if (resized.length <= MEDIA_SIZE_LIMIT) return resized;
      } catch (error) {
        console.error("Przeskalowanie tekstury nie powiodło się:", error);
        break;
      }
    }
    return null; // za duże nawet po maksymalnej kompresji
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function bytesToDataUrl(bytes, mime) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${mime};base64,${btoa(binary)}`;
  }

  // Czcionek nie da się "zmniejszyć" wizualnie jak zdjęć, ale TTF/OTF
  // można realnie skompresować do formatu WOFF2 (specjalnie do tego
  // zaprojektowany, kompresja Brotli) - to zwykle 30-50% mniej danych
  // za darmo, bez utraty ani jednego glifu. Jeśli plik jest już WOFF2
  // (rozpoznajemy po sygnaturze "wOF2" na początku pliku) albo
  // biblioteka nie zdążyła się załadować, wysyłamy oryginał bez zmian.
  async function prepareFontForSync(dataUrl) {
    if (!dataUrl) return "";

    let finalDataUrl = dataUrl;
    let compressedOk = false;
    const originalKB = Math.round(dataUrl.length / 1024);

    try {
      const bytes = dataUrlToBytes(dataUrl);
      const isAlreadyWoff2 =
        bytes.length >= 4 &&
        bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x32; // "wOF2"

      if (isAlreadyWoff2) {
        console.log("Synchronizacja: czcionka jest już w formacie WOFF2, bez dalszej kompresji.");
      } else if (!window.OMAP_FONT_LIB?.compress) {
        console.warn("Synchronizacja: biblioteka do kompresji czcionek (woff2-encoder) nie jest załadowana - wysyłam oryginał bez kompresji.");
      } else {
        try {
          const compressed = await window.OMAP_FONT_LIB.compress(bytes);
          finalDataUrl = bytesToDataUrl(compressed, "font/woff2");
          compressedOk = true;
        } catch (error) {
          console.error("Kompresja czcionki do WOFF2 nie powiodła się, wysyłam oryginał:", error);
        }
      }
    } catch (error) {
      console.error("Nie udało się przeanalizować pliku czcionki:", error);
    }

    const finalKB = Math.round(finalDataUrl.length / 1024);
    console.log(
      `Synchronizacja czcionki: oryginał ${originalKB} KB${compressedOk ? `, po kompresji WOFF2 ${finalKB} KB` : ""}, limit ${Math.round(FONT_SIZE_LIMIT / 1024)} KB.`
    );

    return finalDataUrl.length <= FONT_SIZE_LIMIT ? finalDataUrl : null;
  }

  async function pushColorMedia(cryptoApi, encKey, transport, nostrPrivKeyBytes) {
    const skipped = [];

    const textureJobs = TEXTURE_FIELDS.map(async key => {
      const original = state.customTextures?.[key] || "";
      if (!original) {
        await pushOneMediaSlot(`texture:${key}`, "");
        return;
      }
      const prepared = await prepareTextureForSync(original);
      if (prepared === null) {
        skipped.push(`tekstura „${key}”`);
        return;
      }
      await pushOneMediaSlot(`texture:${key}`, prepared);
    });

    const fontOriginal =
      state.customFont?.type === "custom" && state.customFontDataUrl
        ? state.customFontDataUrl
        : "";

    if (fontOriginal) {
      textureJobs.push(
        (async () => {
          const prepared = await prepareFontForSync(fontOriginal);
          if (prepared === null) {
            const sizeKB = Math.round(fontOriginal.length / 1024);
            skipped.push(`własna czcionka (oryginał ~${sizeKB} KB - zobacz konsolę przeglądarki po szczegóły kompresji)`);
            return;
          }
          await pushOneMediaSlot("font:custom", prepared);
        })()
      );
    } else {
      textureJobs.push(pushOneMediaSlot("font:custom", ""));
    }

    await Promise.allSettled(textureJobs);
    return skipped;

    async function pushOneMediaSlot(topic, value) {
      try {
        const blob = await cryptoApi.encryptPayload({ value }, encKey);
        await transport.pushBlob(nostrPrivKeyBytes, blob, topic);
      } catch (error) {
        // Pojedynczy nieudany slot (np. przekaźnik i tak odrzucił
        // dane) nie powinien przerywać reszty wysyłki, ale ma trafić
        // do listy "skipped", żeby user zobaczył, że coś nie doszło.
        console.error(`Synchronizacja: nie udało się wysłać "${topic}"`, error);
        skipped.push(topic);
      }
    }
  }

  async function pullColorMedia(cryptoApi, encKey, transport, nostrPubKeyHex) {
    for (const key of TEXTURE_FIELDS) {
      await pullOneMediaSlot(`texture:${key}`, async value => {
        if (value) {
          state.customTextures[key] = value;
          await idbSetTexture(key, value);
          if (MAP_TEXTURE_KEYS.includes(key)) await registerTextureImage(key, value);
        } else {
          state.customTextures[key] = null;
          await idbDeleteTexture(key);
          if (MAP_TEXTURE_KEYS.includes(key)) unregisterTextureImage(key);
        }
      });
    }

    await pullOneMediaSlot("font:custom", async value => {
      if (value) {
        state.customFont = { type: "custom" };
        state.customFontDataUrl = value;
        await idbSetCustomFont(value);
        saveCustomFont();
        syncCustomFontSelect();
      } else if (state.customFont?.type === "custom") {
        state.customFont = { type: "default" };
        state.customFontDataUrl = null;
        await idbDeleteCustomFont();
        saveCustomFont();
        syncCustomFontSelect();
      }
    });

    async function pullOneMediaSlot(topic, apply) {
      try {
        const remote = await transport.pullBlob(nostrPubKeyHex, topic);
        if (!remote) return;
        const { value } = await cryptoApi.decryptPayload(remote.blob, encKey);
        await apply(value || "");
      } catch (error) {
        console.error(`Synchronizacja: nie udało się pobrać "${topic}"`, error);
      }
    }
  }

  async function applySyncPayload(payload, scopes) {
    if (!payload || typeof payload !== "object") return;

    if (scopes.includes("favorites") && Array.isArray(payload.favorites)) {
      state.favorites = payload.favorites
        .map(entry => {
          const lat = Number(entry.lat);
          const lon = Number(entry.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return {
            ...entry,
            key: String(entry.key || "").trim() || `${lat.toFixed(6)},${lon.toFixed(6)}`,
            title: String(entry.title || "").trim(),
            address: String(entry.address || "").trim(),
            lat,
            lon
          };
        })
        .filter(Boolean)
        .slice(0, 1000);
      saveFavorites();

      if (Array.isArray(payload.favoriteFolders)) {
        state.favoriteFolders = payload.favoriteFolders.filter(
          f => typeof f === "string" && f.trim()
        );
        saveFavoriteFolders();
      }

      if (Array.isArray(payload.routeFavorites)) {
        state.routeFavorites = payload.routeFavorites.filter(entry => entry && entry.key);
        saveRouteFavorites();
      }

      renderFolderChips();
      renderFavoritesList();
    }

    if (scopes.includes("colors")) {
      if (payload.customPalette && typeof payload.customPalette === "object") {
        state.customPalette = { ...DEFAULT_CUSTOM_PALETTE, ...payload.customPalette };
        saveCustomPalette(state.customPalette);
        syncCustomPaletteInputs();
      }

      if (payload.customFont?.type === "google" && payload.customFont.googleFont) {
        state.customFont = { type: "google", googleFont: payload.customFont.googleFont };
        state.customFontDataUrl = null;
        await idbDeleteCustomFont();
        saveCustomFont();
        syncCustomFontSelect();
      }
      // Typ "custom" (wgrany plik czcionki) jest dociągany i stosowany
      // osobno przez pullColorMedia (bajty czcionki jadą jako osobne,
      // małe zdarzenie Nostr) - patrz wywołanie w performPull.

      if (payload.theme) {
        state.theme = payload.theme;
        safeSet(CONFIG.storageKeys.theme, state.theme);
        if (el.themeSelect) el.themeSelect.value = state.theme;
        if (el.menuThemeSelect) el.menuThemeSelect.value = state.theme;
        applyTheme(state.theme);
      }

      if (payload.language && payload.language !== state.language) {
        state.language = payload.language;
        safeSet(CONFIG.storageKeys.language, state.language);
        if (el.languageSelect) el.languageSelect.value = state.language;
        updateUI();
        applyLanguage(state.language);
      }
    }

    if (scopes.includes("placeNames") && payload.customPlaceNames && typeof payload.customPlaceNames === "object") {
      state.customPlaceNames = { ...payload.customPlaceNames };
      saveCustomPlaceNames();
    }

    if (scopes.includes("history") && Array.isArray(payload.history)) {
      state.history = payload.history
        .map(entry => {
          const lat = Number(entry.lat);
          const lon = Number(entry.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return { ...entry, lat, lon };
        })
        .filter(Boolean)
        .slice(0, HISTORY_LIMIT);
      saveHistory();
      renderHistoryList();
    }

    if (scopes.includes("history") && Array.isArray(payload.routeHistory)) {
      state.routeHistory = payload.routeHistory
        .filter(entry => entry && entry.key)
        .slice(0, ROUTE_HISTORY_LIMIT);
      saveRouteHistory();
      renderHistoryList();
    }
  }

  async function performPush(scopes, options) {
    const silent = options?.silent;
    const t = text[state.language];
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    const transport = window.OMAP_SYNC_TRANSPORT;
    const words = getStoredSeedWords();
    if (!cryptoApi || !transport || !words || !scopes.length) return null;

    if (!silent) showAccountMessage(t.accountSending, null);

    const { encKey, nostrPrivKeyBytes } = await cryptoApi.deriveKeys(words);
    const payload = buildSyncPayload(scopes);
    const blob = await cryptoApi.encryptPayload(payload, encKey);
    const result = await transport.pushBlob(nostrPrivKeyBytes, blob, "main");

    let skippedMedia = [];
    if (scopes.includes("colors")) {
      skippedMedia = await pushColorMedia(cryptoApi, encKey, transport, nostrPrivKeyBytes);
    }

    // Zapisujemy to trwale (nie tylko w komunikacie na ekranie), żeby
    // było widać nawet po cichej, automatycznej wysyłce w tle -
    // wcześniej informacja o pominiętych elementach ginęła bezpowrotnie,
    // jeśli wysyłka nie była ręczna.
    if (skippedMedia.length) {
      safeSet(CONFIG.storageKeys.syncLastSkipped, JSON.stringify(skippedMedia));
    } else {
      localStorage.removeItem(CONFIG.storageKeys.syncLastSkipped);
    }

    safeSet(CONFIG.storageKeys.syncLastSyncedAt, result.updatedAt || new Date().toISOString());
    return { ...result, skippedMedia };
  }

  async function performPull(scopes, options) {
    const silent = options?.silent;
    const onlyIfNewer = options?.onlyIfNewer;
    const t = text[state.language];
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    const transport = window.OMAP_SYNC_TRANSPORT;
    const words = getStoredSeedWords();
    if (!cryptoApi || !transport || !words || !scopes.length) return null;

    if (!silent) showAccountMessage(t.accountReceiving, null);

    const nostrLib = await transport.waitForNostrLib();
    const { encKey, nostrPrivKeyBytes } = await cryptoApi.deriveKeys(words);
    const nostrPubKeyHex = nostrLib.getPublicKey(nostrPrivKeyBytes);
    const remote = await transport.pullBlob(nostrPubKeyHex, "main");

    if (!remote) {
      if (!silent) showAccountMessage(t.accountNothingFoundOnRelays, "error");
      return null;
    }

    if (onlyIfNewer) {
      const lastKnown = safeGet(CONFIG.storageKeys.syncLastSyncedAt, "");
      if (lastKnown && new Date(remote.updatedAt) <= new Date(lastKnown)) {
        return { applied: false };
      }
    }

    const payload = await cryptoApi.decryptPayload(remote.blob, encKey);

    // Ważna kolejność: tekstury/czcionkę ustawiamy PRZED zastosowaniem
    // metadanych (motyw/paleta), bo to applySyncPayload wykonuje
    // ostateczne przemalowanie (applyTheme) - jeśli tekstury nie są
    // jeszcze zarejestrowane w tym momencie, przemalowanie użyje
    // samego koloru zamiast tekstury dla danej warstwy.
    if (scopes.includes("colors")) {
      await pullColorMedia(cryptoApi, encKey, transport, nostrPubKeyHex);
    }

    await applySyncPayload(payload, scopes);

    if (scopes.includes("colors")) {
      // Ostateczny krok: ponownie rejestrujemy obrazy tekstur (na
      // wypadek gdyby wcześniejsze przemalowanie/reset stylu mapy
      // "zgubiło" wcześniej dodane obrazy) i dopiero na końcu
      // przemalowujemy motyw - tak, żeby tekstura, jeśli jest
      // ustawiona, zawsze miała ostatnie słowo nad samym kolorem.
      for (const key of TEXTURE_FIELDS) {
        const value = state.customTextures?.[key];
        if (value && MAP_TEXTURE_KEYS.includes(key)) {
          await registerTextureImage(key, value);
        }
      }
      applyTheme(state.theme);
    }

    safeSet(CONFIG.storageKeys.syncLastSyncedAt, remote.updatedAt || new Date().toISOString());
    return { applied: true, updatedAt: remote.updatedAt };
  }

  async function handlePushToCloud() {
    const t = text[state.language];
    const scopes = getCheckedSyncScopes();
    if (scopes.length === 0) {
      showAccountMessage(t.accountNoScopesPush, "error");
      return;
    }

    if (el.accountPushButton) el.accountPushButton.disabled = true;
    try {
      const result = await performPush(scopes, { silent: false });
      refreshAccountUI();

      let message = t.accountSentResult
        .replace("{ok}", result.relaysOk)
        .replace("{total}", result.relaysTotal);
      if (result.skippedMedia?.length) {
        message += t.accountSentWithSkips.replace("{items}", result.skippedMedia.join(", "));
      }
      showAccountMessage(message, result.skippedMedia?.length ? "error" : "success");
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountSendFailed, "error");
    } finally {
      if (el.accountPushButton) el.accountPushButton.disabled = false;
    }
  }

  async function handlePullFromCloud() {
    const t = text[state.language];
    const scopes = getCheckedSyncScopes();
    if (scopes.length === 0) {
      showAccountMessage(t.accountNoScopesPull, "error");
      return;
    }

    if (el.accountPullButton) el.accountPullButton.disabled = true;
    try {
      const result = await performPull(scopes, { silent: false });
      if (result) {
        refreshAccountUI();
        showAccountMessage(t.accountReceived, "success");
      }
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountReceiveFailed, "error");
    } finally {
      if (el.accountPullButton) el.accountPullButton.disabled = false;
    }
  }

  // ===== Automatyczna synchronizacja w tle =====
  // Co kilka minut, o ile jest włączona: najpierw sprawdzamy, czy w
  // chmurze jest coś NOWSZEGO niż nasza ostatnia znana synchronizacja
  // (i jeśli tak - stosujemy to lokalnie); jeśli nie ma nic nowszego,
  // wysyłamy bieżący stan tego urządzenia. Dzięki sprawdzaniu znacznika
  // czasu nie nadpisujemy świeższych lokalnych zmian starszymi danymi
  // z chmury.
  let autoSyncTimer = null;
  let autoSyncInitialTimeout = null;
  let autoSyncScheduled = false;

  function stopAutoSyncTimer() {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
      autoSyncTimer = null;
    }
    if (autoSyncInitialTimeout) {
      clearTimeout(autoSyncInitialTimeout);
      autoSyncInitialTimeout = null;
    }
    autoSyncScheduled = false;
  }

  function scheduleAutoSyncCheck() {
    if (autoSyncScheduled) return;
    autoSyncScheduled = true;
    autoSyncInitialTimeout = window.setTimeout(() => {
      autoSyncScheduled = false;
      autoSyncInitialTimeout = null;
      autoSyncTick();
    }, 1500);

    if (!autoSyncTimer) {
      autoSyncTimer = window.setInterval(autoSyncTick, 5 * 60 * 1000);
    }
  }

  async function autoSyncTick() {
    if (document.hidden) return;
    const words = getStoredSeedWords();
    if (!words) return;
    if (!isAutoSyncEnabled()) return;

    try {
      const ctx = await deriveAccountContext(words);
      await pullProfile(ctx);
    } catch (error) {
      console.error("Automatyczne pobranie profilu nie powiodło się:", error);
    }

    const scopes = getCheckedSyncScopes();
    if (!scopes.length) return;

    try {
      // Celowo bez żadnego widocznego komunikatu/powiadomienia - to ma
      // działać niewidocznie w tle. Jedyny ślad to zaktualizowany
      // status ("Ostatnia synchronizacja: ...") widoczny po otwarciu
      // panelu Konto.
      const pullResult = await performPull(scopes, { silent: true, onlyIfNewer: true });
      if (pullResult?.applied) {
        refreshAccountUI();
        return;
      }
      await performPush(scopes, { silent: true });
      refreshAccountUI();
    } catch (error) {
      console.error("Automatyczna synchronizacja nie powiodła się:", error);
    }
  }

  el.accountGotoLoginButton?.addEventListener("click", () => showAccountScreen("login"));
  el.accountGotoRegisterButton?.addEventListener("click", handleCreateAccount);
  el.accountLoginBackButton?.addEventListener("click", () => showAccountScreen("home"));
  el.accountRegisterBackButton?.addEventListener("click", () => showAccountScreen("home"));
  el.accountSeedCopyButton?.addEventListener("click", () => {
    try {
      const words = JSON.parse(el.accountScreenRegister.dataset.pendingWords || "[]");
      if (words.length) copyWordsToClipboard(words);
    } catch (_) {}
  });
  el.accountSeedRevealCopyButton?.addEventListener("click", () => {
    const words = getStoredSeedWords();
    if (words) copyWordsToClipboard(words);
  });
  el.accountSeedConfirmCheckbox?.addEventListener("change", () => {
    if (el.accountSeedConfirmButton) {
      el.accountSeedConfirmButton.disabled = !el.accountSeedConfirmCheckbox.checked;
    }
  });
  el.accountSeedConfirmButton?.addEventListener("click", handleConfirmSeed);
  el.accountLoginButton?.addEventListener("click", handleLoginWithSeed);
  el.accountPushButton?.addEventListener("click", handlePushToCloud);
  el.accountPullButton?.addEventListener("click", handlePullFromCloud);
  el.accountAutoSyncCheckbox?.addEventListener("change", () => {
    const enabled = el.accountAutoSyncCheckbox.checked;
    safeSet(CONFIG.storageKeys.syncAutoEnabled, enabled ? "1" : "0");
    updateManualSyncButtonsVisibility();

    if (enabled) {
      // Odpal od razu, zamiast czekać do 5 minut na kolejny cykl
      // interwału (który wcześniej mógł już zostać zatrzymany).
      scheduleAutoSyncCheck();
    } else {
      // Realnie zatrzymaj timer, zamiast pozwolić mu dalej tykać co
      // 5 minut w tle i za każdym razem cichaczem nic nie robić.
      stopAutoSyncTimer();
    }
  });

  async function saveProfile(name, avatar) {
    const t = text[state.language];
    const words = getStoredSeedWords();
    if (!words) return;

    storeProfileLocally({ name, avatar });
    renderProfileUI();

    showAccountMessage(t.accountProfileSaving, null);
    try {
      const ctx = await deriveAccountContext(words);
      if (!ctx) return;
      const blob = await ctx.cryptoApi.encryptPayload({ name, avatar }, ctx.encKey);
      await ctx.transport.pushBlob(ctx.nostrPrivKeyBytes, blob, "profile");
      showAccountMessage(t.accountProfileSaved, "success");
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountProfileSaveFailed, "error");
    }
  }

  el.accountAvatarButton?.addEventListener("click", () => {
    el.accountProfileAvatarInput?.click();
  });

  el.accountProfileAvatarInput?.addEventListener("change", async () => {
    const file = el.accountProfileAvatarInput.files?.[0];
    if (!file) return;
    try {
      const rawDataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Nie udało się wczytać pliku."));
        reader.readAsDataURL(file);
      });
      // Ten sam mechanizm zmniejszania co przy teksturach, tylko do
      // mniejszego rozmiaru - to nadal tylko mały awatar, ale trochę
      // większy niż poprzednio.
      const resized = await downscaleImageDataUrl(rawDataUrl, 192, 0.7);
      el.accountProfileAvatarInput.value = "";
      await saveProfile(getStoredProfile().name, resized);
    } catch (error) {
      console.error(error);
      showAccountMessage(text[state.language].accountAvatarLoadFailed, "error");
    }
  });

  el.accountDisplayNameButton?.addEventListener("click", () => {
    if (!el.accountNameEditForm) return;
    const willOpen = el.accountNameEditForm.hidden;
    el.accountNameEditForm.hidden = !willOpen;
    if (willOpen) {
      el.accountProfileNameInput.value = getStoredProfile().name || "";
      el.accountProfileNameInput.focus();
      el.accountProfileNameInput.select();
    }
  });

  el.accountNameCancelButton?.addEventListener("click", () => {
    if (el.accountNameEditForm) el.accountNameEditForm.hidden = true;
  });

  el.accountNameSaveButton?.addEventListener("click", async () => {
    const name = (el.accountProfileNameInput?.value || "").trim().slice(0, 40);
    if (el.accountNameEditForm) el.accountNameEditForm.hidden = true;
    await saveProfile(name, getStoredProfile().avatar);
  });

  el.accountPublicId?.addEventListener("click", async () => {
    const fullId = el.accountPublicId?.dataset.fullId;
    if (!fullId) return;
    const t = text[state.language];
    try {
      await navigator.clipboard.writeText(fullId);
      showAccountMessage(t.accountCopiedId, "success");
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountCopyIdFailed, "error");
    }
  });

  el.accountLogoutButton?.addEventListener("click", handleLogoutAccount);
  el.accountActivityBackButton?.addEventListener("click", () => showAccountScreen("loggedin"));
  el.accountActivityButton?.addEventListener("click", () => {
    showAccountScreen("activity");
    loadMyRatingsActivity();
  });
  el.accountActivityRefreshButton?.addEventListener("click", () => {
    loadMyRatingsActivity();
  });

  async function loadMyRatingsActivity() {
    const t = text[state.language];
    if (!el.accountActivityStatus || !el.accountActivityList) return;

    el.accountActivityRefreshButton?.classList.add("is-spinning");
    el.accountActivityList.replaceChildren();
    el.accountActivityStatus.hidden = false;
    el.accountActivityStatus.textContent = t.activityLoading;

    const seedWords = getStoredSeedWords();
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
          const seedWordsForDelete = getStoredSeedWords();
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
            closeAccount();

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

  function updateRouteClearButton(input, btn) {
    if (!btn || !input) return;
    btn.hidden = !input.value.trim();
  }

  function updateRouteClearButtons() {
    updateRouteClearButton(el.routeFrom, el.routeFromClear);
    updateRouteClearButton(el.routeTo, el.routeToClear);
  }

  // Śledzi zarówno wpisywanie przez użytkownika, jak i programowe
  // ustawianie .value (np. po wyborze podpowiedzi albo przeciągnięciu
  // znacznika), żeby przycisk (x) zawsze odzwierciedlał zawartość pola.
  function watchRouteInputValue(input, btn) {
    if (!input || !btn) return;
    const proto = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (!descriptor || !descriptor.configurable) return;
    Object.defineProperty(input, "value", {
      get() {
        return descriptor.get.call(this);
      },
      set(v) {
        descriptor.set.call(this, v);
        btn.hidden = !this.value.trim();
      },
      configurable: true
    });
  }

  function clearRoutePoint(key) {
    const isA = key === "a";
    const input = isA ? el.routeFrom : el.routeTo;
    const clearBtn = isA ? el.routeFromClear : el.routeToClear;

    if (isA) state.routePointA = null;
    else state.routePointB = null;

    if (input) input.value = "";
    removeRouteMarker(key);
    hideAllAutocomplete();
    updateRouteClearButton(input, clearBtn);

    state.routeClickStage = !state.routePointA
      ? "a"
      : !state.routePointB
      ? "b"
      : "move-b";
    updateRouteClickHint();

    if (state.routeCoordinates) {
      state.routeCoordinates = null;
      if (el.routeSummary) el.routeSummary.hidden = true;
      if (el.routeShare) el.routeShare.hidden = true;
      if (el.routeExportGpx) el.routeExportGpx.hidden = true;
      if (el.routeImportGpx) el.routeImportGpx.hidden = true;
      if (el.routeClear) el.routeClear.hidden = true;
      if (el.routeWaypointNote) el.routeWaypointNote.hidden = true;
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
    }

    input?.focus();
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

  // Oblicza datę pierwszego dnia Wielkanocy (algorytm Meeusa/Jonesa/
  // Butchera, kalendarz gregoriański) dla danego roku.
  function calculateEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  // Ostatnia niedziela danego miesiąca (0-indeksowany miesiąc).
  function lastSundayOfMonth(year, monthIndex) {
    const lastDay = new Date(year, monthIndex + 1, 0);
    const offset = lastDay.getDay();
    lastDay.setDate(lastDay.getDate() - offset);
    return lastDay;
  }

  // Zwraca zbiór dat (jako stringi YYYY-MM-DD) niedziel handlowych w
  // Polsce dla danego roku, zgodnie z ustawą z 10 stycznia 2018 r. o
  // ograniczeniu handlu w niedziele i święta.
  function getTradingSundaysForYear(year) {
    const dates = [];
    const toKey = date =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // Ostatnia niedziela stycznia, kwietnia, czerwca i sierpnia.
    for (const monthIndex of [0, 3, 5, 7]) {
      dates.push(lastSundayOfMonth(year, monthIndex));
    }

    // Niedziela bezpośrednio poprzedzająca pierwszy dzień Wielkanocy.
    const easter = calculateEasterSunday(year);
    const beforeEaster = new Date(easter);
    beforeEaster.setDate(beforeEaster.getDate() - 7);
    dates.push(beforeEaster);

    // Trzy kolejne niedziele poprzedzające Wigilię (24 grudnia).
    const christmasEve = new Date(year, 11, 24);
    let cursor = new Date(christmasEve);
    cursor.setDate(cursor.getDate() - 1);
    while (cursor.getDay() !== 0) {
      cursor.setDate(cursor.getDate() - 1);
    }
    for (let i = 0; i < 3; i++) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() - 7);
    }

    return new Set(dates.map(toKey));
  }

  function isTodayTradingSundayPL() {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const tradingSundays = getTradingSundaysForYear(today.getFullYear());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return { isSunday, isTrading: isSunday && tradingSundays.has(todayKey) };
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

    show(
      state.language === "pl" ? "Pobieranie lokalizacji…" : "Getting your location…",
      0
    );

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
        showPlaceInformation({ lngLat: { lat: shared.lat, lng: shared.lon } }).catch(err => {
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

async function exportRouteAsGpx() {
    if (!state.routePointA || !state.routePointB) {
        show("Najpierw wyznacz trasę.");
        return;
    }

    const language = state.language || state.ui?.language || "pl";
    const t = text[language];

    const allPoints = [];
    
    allPoints.push({
        lat: state.routePointA.lat,
        lon: state.routePointA.lon,
        name: "Punkt A"
    });

    if (state.routeWaypoints && state.routeWaypoints.length > 0) {
        state.routeWaypoints.forEach((wp, i) => {
            allPoints.push({
                lat: wp.lat,
                lon: wp.lon,
                name: `Przystanek ${i+1}`
            });
        });
    }

    allPoints.push({
        lat: state.routePointB.lat,
        lon: state.routePointB.lon,
        name: "Punkt B"
    });

    const waypointsXml = allPoints.map((p, i) => {
        const name = p.name || `Punkt ${i+1}`;
        return `    <wpt lat="${p.lat}" lon="${p.lon}">
        <name>${name}</name>
        <sym>Waypoint</sym>
      </wpt>`;
    }).join("\n");

    const routePointsXml = allPoints.map((p) => {
        return `      <rtept lat="${p.lat}" lon="${p.lon}"/>`;
    }).join("\n");

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Odwrotna Mapa" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Trasa z Odwrotnej Mapy</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypointsXml}
  <rte>
    <name>Trasa</name>
    ${routePointsXml}
  </rte>
</gpx>`;

    const blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // NAZWA PLIKU Z DATĄ I GODZINĄ
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10);
    const timeStr = now.toTimeString().slice(0,8).replace(/:/g, '');
    link.download = `trasa-${dateStr}_${timeStr}.gpx`;
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    show(t.routeGpxExported || "Trasa została wyeksportowana jako GPX.");
}

async function importRouteFromGpx(file) {
    const language = state.language || state.ui?.language || "pl";
    const t = text[language];

    try {
        const textContent = await file.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(textContent, "application/xml");

        // Szukamy punktów – najpierw w <wpt>, potem w <rtept>, potem <trkpt>
        let points = [];
        
        const wpts = xml.querySelectorAll("wpt");
        if (wpts.length > 0) {
            wpts.forEach(pt => {
                const lat = parseFloat(pt.getAttribute("lat"));
                const lon = parseFloat(pt.getAttribute("lon"));
                if (!isNaN(lat) && !isNaN(lon)) {
                    points.push({ lat, lon });
                }
            });
        }

        if (points.length === 0) {
            const rtepts = xml.querySelectorAll("rtept");
            if (rtepts.length > 0) {
                rtepts.forEach(pt => {
                    const lat = parseFloat(pt.getAttribute("lat"));
                    const lon = parseFloat(pt.getAttribute("lon"));
                    if (!isNaN(lat) && !isNaN(lon)) {
                        points.push({ lat, lon });
                    }
                });
            }
        }

        if (points.length === 0) {
            const trkpts = xml.querySelectorAll("trkpt");
            if (trkpts.length > 0) {
                trkpts.forEach(pt => {
                    const lat = parseFloat(pt.getAttribute("lat"));
                    const lon = parseFloat(pt.getAttribute("lon"));
                    if (!isNaN(lat) && !isNaN(lon)) {
                        points.push({ lat, lon });
                    }
                });
            }
        }

        if (points.length < 2) {
            show(t.routeGpxNoPoints || "Plik GPX musi zawierać co najmniej dwa punkty.");
            return;
        }

        // Pierwszy punkt = A, ostatni = B, reszta = waypointy
        const first = points[0];
        const last = points[points.length - 1];
        const waypoints = points.slice(1, -1);

        state.routePointA = {
            lon: first.lon,
            lat: first.lat,
            label: formatCoordinates(first.lon, first.lat)
        };
        state.routePointB = {
            lon: last.lon,
            lat: last.lat,
            label: formatCoordinates(last.lon, last.lat)
        };
        
        state.routeWaypoints = waypoints.map((p, i) => ({
            lon: p.lon,
            lat: p.lat,
            label: `Przystanek ${i+1}`
        }));

        // Odśwież UI
        if (el.routeFrom) el.routeFrom.value = state.routePointA.label;
        if (el.routeTo) el.routeTo.value = state.routePointB.label;
        
        refreshRouteMarkers();
        refreshWaypointMarkers();
        
        if (typeof renderRouteWaypoints === "function") {
            renderRouteWaypoints();
        } else {
            const list = document.getElementById("route-waypoints-list");
            if (list) {
                list.innerHTML = "";
                state.routeWaypoints.forEach((wp, i) => {
                    const li = document.createElement("li");
                    li.textContent = wp.label;
                    list.appendChild(li);
                });
            }
        }
        
        state.routeClickStage = "move-b";
        updateRouteClickHint();

        // Zamiast rysować geometrię z pliku, przelicz trasę przez silnik routingu
        await calculateRouteFromStoredPoints();

        // Dopiero po udanym przeliczeniu pokaż komunikat sukcesu
        show(t.routeGpxImported || "Trasa została zaimportowana z pliku GPX.");
    } catch (error) {
        console.error("Błąd importu GPX:", error);
        show(t.routeGpxImportError || "Nie udało się zaimportować pliku GPX.");
    }
}

})();
