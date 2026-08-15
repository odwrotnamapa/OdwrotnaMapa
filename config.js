window.SOUTHMAPS_CONFIG = Object.freeze({
  publicBaseUrl: "https://odwrotnamapa.pl/",
  map: {
    styleUrl: "https://tiles.openfreemap.org/styles/liberty",
    center: [19.1451, 51.9194],
    zoom: 4.8,
    bearing: 180,
    pitch: 0,
    minZoom: 0
  },
  satellite: {
    sourceId: "southmaps-satellite",
    layerId: "southmaps-satellite-layer",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    ],
    tileSize: 256,
    attribution: "Tiles © Esri"
  },
  mapillary: {
    // Warstwa pokrycia (kropki na mapie pokazujące, gdzie są
    // zdjęcia) NIE potrzebuje już tokenu tutaj - idzie przez proxy
    // Workera (patrz `proxy.baseUrl` niżej i
    // cloudflare-sync-worker/README-DEPLOY.md, krok 3a), który
    // dokleja sekret po swojej stronie. `coverageTiles` poniżej
    // wskazuje na ten proxy, nie bezpośrednio na Mapillary.
    //
    // accessToken poniżej to WYŁĄCZNIE token dla panelu zdjęć
    // poziomu ulicy (odtwarzacz mapillary-js) - ta biblioteka łączy
    // się z Mapillary bezpośrednio z przeglądarki i wymaga własnego,
    // publicznie widocznego tokenu (to normalne dla mapillary-js, nie
    // da się tego ukryć bez forkowania biblioteki). Zarejestruj dla
    // NIEGO osobną, darmową aplikację na
    // https://www.mapillary.com/dashboard/developers, żeby
    // ewentualny wyciek tego tokenu nie dotyczył kafelków pokrycia.
    // Zostaw puste (""), żeby wyłączyć panel zdjęć poziomu ulicy.
    accessToken: "",
    sourceId: "odwrotnamapa-mapillary",
    coverageLayerId: "odwrotnamapa-mapillary-coverage",
    minZoom: 14
  },
  transit: {
    departuresEndpoint: "https://api.transitous.org/api/v6/stoptimes",
    plannerEndpoint: "https://api.transitous.org/api/v6/plan",
    tripEndpoint: "https://api.transitous.org/api/v6/trip",
    sourcesUrl: "https://transitous.org/sources/",
    radius: 180,
    limit: 24
  },

  routing: {
    endpoint: "https://valhalla1.openstreetmap.de/route",
    sourceId: "odwrotnamapa-route",
    casingLayerId: "odwrotnamapa-route-casing",
    lineLayerId: "odwrotnamapa-route-line",
    highlightSourceId: "odwrotnamapa-route-highlight",
    highlightLayerId: "odwrotnamapa-route-highlight-line",
    clientId: "odwrotnamapa.pl"
  },

  // Ten sam publiczny serwer Valhalla co "routing" powyzej, ale endpoint
  // /isochrone zamiast /route - zwraca poligon obszaru osiagalnego w
  // zadanym czasie (isochrona / "mapa czasu podrozy").
  isochrone: {
    endpoint: "https://valhalla1.openstreetmap.de/isochrone",
    sourceId: "odwrotnamapa-isochrone",
    fillLayerId: "odwrotnamapa-isochrone-fill",
    lineLayerId: "odwrotnamapa-isochrone-line",
    clientId: "odwrotnamapa.pl"
  },

  search: {
    endpoint: "https://nominatim.openstreetmap.org/search",
    fuzzyEndpoint: "https://photon.komoot.io/api/",
    reverseEndpoint: "https://nominatim.openstreetmap.org/reverse",
    exploreLimit: 25,
    limit: 5
  },
  events: {
    // Sekcja "Wydarzenia" w panelu Odkrywaj korzysta z Ticketmaster
    // Discovery API (obsługuje Polskę - koncerty, sport, teatr itp.).
    // Klucz NIE jest już wpisywany tutaj - appka woła
    // `${proxy.baseUrl}/events`, a to Worker (patrz `proxy` niżej i
    // cloudflare-sync-worker/README-DEPLOY.md, krok 3a) dokleja
    // sekret TICKETMASTER_API_KEY po swojej stronie. Bez
    // skonfigurowanego proxy sekcja pokaże komunikat z instrukcją
    // zamiast wyników - tak jak wcześniej bez klucza.
    countryCode: "PL",
    radiusKm: 50,
    limit: 30
  },
  // Wspólny proxy dla kluczy API, których appka NIE powinna trzymać
  // po stronie klienta (Mapillary - kafelki pokrycia, Ticketmaster -
  // wydarzenia). To ten sam Worker Cloudflare co synchronizacja
  // ustawień (cloudflare-sync-worker/) - wdrażasz go raz (patrz
  // README-DEPLOY.md w tamtym folderze) i wklejasz tu jego adres.
  // Puste ("") = te dwie funkcje appki są wyłączone, tak jak przy
  // braku kluczy wcześniej.
  proxy: {
    baseUrl: "https://odwrotnamapa-sync.odwrotnamapa.workers.dev"
  },
  sync: {
    // Publiczne przekaźniki Nostr używane do synchronizacji ustawień -
    // w pełni zdecentralizowane, bez konieczności zakładania konta
    // gdziekolwiek (ani przez Ciebie, ani przez użytkowników appki).
    // Można dodać/zmienić listę bez zmiany kodu.
    relays: [
      "wss://relay.damus.io",
      "wss://nos.lol",
      "wss://relay.nostr.band",
      "wss://relay.primal.net",
      "wss://nostr.mom",
      "wss://offchain.pub",
      "wss://relay.snort.social",
      "wss://nostr.oxtr.dev"
    ],
    wordCount: 16
  },
  storageKeys: {
    language: "odwrotnamapa.language",
    theme: "odwrotnamapa.theme",
    view: "odwrotnamapa.view",
    searchHistory: "odwrotnamapa.searchHistory",
    favorites: "odwrotnamapa.favorites",
    favoriteFolders: "odwrotnamapa.favoriteFolders",
    customPalette: "odwrotnamapa.customPalette",
    customFont: "odwrotnamapa.customFont",
    customPlaceNames: "odwrotnamapa.customPlaceNames",
    history: "odwrotnamapa.history",
    routeHistory: "odwrotnamapa.routeHistory",
    routeFavorites: "odwrotnamapa.routeFavorites",
    syncSeed: "odwrotnamapa.sync.seed",
    syncLastSyncedAt: "odwrotnamapa.sync.lastSyncedAt",
    syncLocalSyncedAt: "odwrotnamapa.sync.localSyncedAt",
    syncLocalDirtyAt: "odwrotnamapa.sync.localDirtyAt",
    syncAutoEnabled: "odwrotnamapa.sync.autoEnabled",
    syncProfileName: "odwrotnamapa.sync.profileName",
    syncProfileAvatar: "odwrotnamapa.sync.profileAvatar",
    syncLastSkipped: "odwrotnamapa.sync.lastSkipped"
  }
});
