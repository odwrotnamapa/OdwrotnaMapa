(function () {
  "use strict";

  // Transport danych synchronizacji przez Nostr - w pełni
  // zdecentralizowany, otwarty protokół. Zamiast jednego serwera
  // (Cloudflare, Firebase itp.) appka publikuje zaszyfrowany blob
  // na kilku publicznych przekaźnikach (relayach) jednocześnie;
  // odczyt też odpytuje kilka z nich. Nikt (żaden pojedynczy
  // operator przekaźnika) nie ma monopolu na Twoje dane, a Ty (ani
  // my) nie zakładacie u nikogo konta - to zwykłe, otwarte WebSockety.
  //
  // Zdarzenie jest podpisywane kluczem wyprowadzonym z Twojej frazy
  // (patrz sync-crypto-service.js) - podpis sprawdza kryptograficznie
  // zarówno biblioteka nostr-tools lokalnie, jak i każdy przekaźnik
  // z osobna, więc nikt bez Twojej frazy nie może podstawić ani
  // nadpisać Twoich danych.

  const DEFAULT_RELAYS = [
    "wss://relay.damus.io",
    "wss://nos.lol",
    "wss://relay.nostr.band",
    "wss://relay.primal.net",
    "wss://nostr.mom",
    "wss://offchain.pub",
    "wss://relay.snort.social",
    "wss://nostr.oxtr.dev"
  ];

  // Kind 30078 = NIP-78 "Application-specific data", zakres
  // "parameterized replaceable" (30000-39999): przekaźnik trzyma
  // tylko NAJNOWSZE zdarzenie dla danej pary (pubkey, kind, tag "d") -
  // dokładnie pasuje do "aktualny stan ustawień".
  const SYNC_KIND = 30078;
  const SYNC_D_TAG = "odwrotnamapa-sync-v1";

  // Osobny "kind" dla publicznych ocen miejsc (gwiazdki 1-5) - też
  // parameterized replaceable, ale w przeciwieństwie do SYNC_KIND
  // odczyt NIE filtruje po autorze: pytamy o wszystkie zdarzenia dla
  // danego miejsca (tag "d"), od kogokolwiek, żeby policzyć średnią.
  // Ponowna ocena tego samego miejsca przez tego samego użytkownika
  // automatycznie zastępuje jego poprzedni głos (semantyka "d" taga).
  const RATING_KIND = 31555;
  const RATING_D_PREFIX = "odwrotnamapa-rating-v1";

  function getRelays() {
    const configured = window.SOUTHMAPS_CONFIG?.sync?.relays;
    return Array.isArray(configured) && configured.length ? configured : DEFAULT_RELAYS;
  }

  // Odczyt ocen dzieje się często (przy każdym otwarciu panelu
  // miejsca) i jest mniej krytyczny niż zapis - lepiej nawiązać
  // mniej równoległych połączeń WebSocket i dostać odpowiedź szybciej
  // (istotne na sieciach komórkowych, gdzie 8 jednoczesnych połączeń
  // potrafi trwać dłużej niż limit czasu), niż czekać na komplet.
  // Publikowanie oceny (publishRating/deleteRating) nadal idzie do
  // WSZYSTKICH przekaźników, żeby maksymalizować szansę propagacji.
  function getReadRelays() {
    return getRelays().slice(0, 4);
  }

  function waitForNostrLib(timeoutMs = 8000) {
    if (window.OMAP_NOSTR_LIB) return Promise.resolve(window.OMAP_NOSTR_LIB);
    return new Promise((resolve, reject) => {
      const start = Date.now();
      (function check() {
        if (window.OMAP_NOSTR_LIB) return resolve(window.OMAP_NOSTR_LIB);
        if (Date.now() - start > timeoutMs) {
          return reject(new Error("nostr_lib_unavailable"));
        }
        setTimeout(check, 100);
      })();
    });
  }

  function isConfigured() {
    // Publiczne przekaźniki Nostr - zawsze "skonfigurowane", bez
    // konieczności zakładania czegokolwiek u kogokolwiek.
    return true;
  }

  // WAŻNE: SimplePool z nostr-tools jest zaprojektowany jako
  // długożyjąca, WSPÓŁDZIELONA pula połączeń WebSocket - nie coś, co
  // tworzy się i zamyka przy każdym pojedynczym wywołaniu. Wcześniej
  // każda funkcja (pushBlob/pullBlob) tworzyła WŁASNY nowy SimplePool
  // i zamykała go zaraz po użyciu (`pool.close(relays)`). Przy kilku
  // równoległych wywołaniach naraz (np. synchronizacja tekstur - 5
  // slotów + czcionka wysyłane jednocześnie) prowadziło to do
  // wyścigu: jedno zamknięcie potrafiło zerwać współdzielone pod
  // spodem połączenie do danego przekaźnika, na którego odpowiedź
  // ("OK") czekało akurat inne, równoległe wywołanie - stąd losowe,
  // niedeterministyczne niepowodzenia pojedynczych slotów. Rozwiązanie:
  // jedna, wspólna pula na całą sesję karty, nigdy nie zamykana
  // między wywołaniami.
  let sharedPool = null;
  // Cache ocen na czas życia karty (do odświeżenia strony) - otwarcie
  // panelu tego samego miejsca wielokrotnie (np. wracając wstecz, albo
  // po prostu ponownie klikając w to samo miejsce) nie powinno za
  // każdym razem odpytywać przekaźników od nowa. Świeżość mimo
  // długiego TTL zapewnia jawne unieważnianie cache'a przy każdym
  // publishRating/deleteRating (patrz niżej) - nowa/usunięta ocena
  // jest więc widoczna od razu, nie dopiero po wygaśnięciu.
  const ratingsCache = new Map();
  const RATINGS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

  async function getSharedPool() {
    const lib = await waitForNostrLib();
    if (!sharedPool) {
      sharedPool = new lib.SimplePool();
    }
    return sharedPool;
  }

  // Odczyty ocen dzieją się przy KAŻDYM otwarciu panelu miejsca, więc
  // w przeciwieństwie do synchronizacji (gdzie czekanie na wolny
  // przekaźnik jest akceptowalne) tu wolimy odpowiedź szybko, nawet
  // kosztem pominięcia najwolniejszego z 8 przekaźników - i tak
  // zwykle wystarczy odpowiedź z kilku, żeby policzyć sensowną
  // średnią.
  function querySyncWithTimeout(pool, relays, filter, timeoutMs = 8000) {
    // KRYTYCZNE: przy przekroczeniu czasu rzucamy błąd, NIE zwracamy
    // pustej tablicy. Cicha pusta tablica byłaby nie do odróżnienia
    // od "naprawdę zero ocen" - a to (przez cache) wyglądałoby jak
    // utrata danych, choć nic naprawdę nie zostało usunięte z
    // przekaźników. Rzucony błąd trafia do istniejącej obsługi
    // błędów (komunikat "nie udało się wczytać"), która niczego nie
    // cache'uje.
    return Promise.race([
      pool.querySync(relays, filter),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("query_timeout")), timeoutMs)
      )
    ]);
  }

  async function pushBlob(nostrPrivKeyBytes, blobContent, topic = "main") {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    const template = {
      kind: SYNC_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", `${SYNC_D_TAG}:${topic}`]],
      content: blobContent
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;

    if (okCount === 0) {
      throw new Error("push_failed_all_relays");
    }

    return {
      updatedAt: new Date(event.created_at * 1000).toISOString(),
      relaysOk: okCount,
      relaysTotal: relays.length
    };
  }

  async function pullBlob(nostrPubKeyHex, topic = "main") {
    const lib = await waitForNostrLib();
    const { verifyEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    const events = await pool.querySync(relays, {
      kinds: [SYNC_KIND],
      authors: [nostrPubKeyHex],
      "#d": [`${SYNC_D_TAG}:${topic}`]
    });

    if (!events || !events.length) return null;

    // Obronnie bierzemy najnowsze zdarzenie po created_at (na wypadek
    // gdyby który przekaźnik nie respektował semantyki "replaceable")
    // i weryfikujemy jego podpis kryptograficzny.
    const latest = events.reduce((a, b) => (b.created_at > a.created_at ? b : a));

    if (!verifyEvent(latest)) {
      throw new Error("invalid_signature");
    }

    return {
      blob: latest.content,
      updatedAt: new Date(latest.created_at * 1000).toISOString()
    };
  }

  async function publishRating(nostrPrivKeyBytes, placeKey, ratingValue, placeMeta) {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    // Zaokrąglamy do najbliższej połówki (1, 1.5, 2 ... 5), nie do
    // pełnej liczby - żeby dało się ocenić np. na 2,5.
    const value = Math.max(1, Math.min(5, Math.round(Number(ratingValue) * 2) / 2));

    const tags = [
      ["d", `${RATING_D_PREFIX}:${placeKey}`],
      ["rating", String(value)]
    ];
    if (placeMeta?.label) tags.push(["label", String(placeMeta.label).slice(0, 200)]);
    // Współrzędne zapisujemy zawsze osobno (nie tylko jako część
    // klucza "d") - klucz bywa samym OSM id bez lat/lon, a bez
    // współrzędnych nie dałoby się wrócić na mapę z listy "Aktywność".
    if (Number.isFinite(placeMeta?.lat) && Number.isFinite(placeMeta?.lon)) {
      tags.push(["lat", String(placeMeta.lat)]);
      tags.push(["lon", String(placeMeta.lon)]);
    }
    if (placeMeta?.osmType && placeMeta?.osmId) {
      tags.push(["osm_type", String(placeMeta.osmType)]);
      tags.push(["osm_id", String(placeMeta.osmId)]);
    }
    // Gdy nie ma OSM id (miasta z lokalnego indeksu, charakterystyczne
    // miejsca z indeksu "named POI" - żadne z tych dwóch źródeł nie
    // przypisuje identyfikatorów OSM), zapisujemy migawkę dokładnie
    // tych pól, których używa karta miejsca do renderowania. Dzięki
    // temu otwarcie z "Aktywności" pokazuje TO SAMO, co pokazała
    // wyszukiwarka przy ocenianiu - zero zgadywania, zero reverse
    // geocodingu, zero ryzyka trafienia w coś innego.
    if (!(placeMeta?.osmType && placeMeta?.osmId) && placeMeta?.placeSnapshot) {
      tags.push(["place_json", JSON.stringify(placeMeta.placeSnapshot).slice(0, 4000)]);
    }
    // Gdy nie ma OSM id (np. miasta z lokalnego indeksu TERYT albo
    // charakterystyczne miejsca z indeksu "named POI" - żadne z tych
    // dwóch źródeł w ogóle nie przypisuje identyfikatorów OSM), przy
    // dociąganiu pełnych danych trzeba wiedzieć, czy to miasto (reverse
    // geocoding na poziomie miasta) czy punktowy landmark (poziom POI) -
    // stąd zapisujemy też typ miejsca.
    if (placeMeta?.placeType) {
      tags.push(["place_type", String(placeMeta.placeType)]);
    }

    const template = {
      kind: RATING_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: String(value)
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;

    if (okCount === 0) {
      throw new Error("push_failed_all_relays");
    }

    // Unieważniamy cache dla tego miejsca - świeżo wysłana ocena ma
    // być widoczna od razu, nie dopiero po wygaśnięciu TTL.
    for (const key of [...ratingsCache.keys()]) {
      if (key.startsWith(`${placeKey}:`)) ratingsCache.delete(key);
    }

    return { value, relaysOk: okCount, relaysTotal: relays.length };
  }

  // "Usunięcie" oceny na Nostr to w praktyce publikacja nowego
  // zdarzenia, które zastępuje poprzednie (ta sama semantyka "d"
  // taga co przy zwykłej zmianie oceny) - tylko z wartością poza
  // zakresem 1-5, którą fetchRatings/fetchMyRatings i tak już
  // odrzucają. Nie polegamy na tym, czy przekaźnik "faktycznie"
  // skasuje stare zdarzenie (NIP-09 bywa różnie respektowany) -
  // wystarczy, że nowe je zastępuje. Nie wołamy tu publishRating,
  // bo ta funkcja przycina wartość do minimum 1 - "0" zostałoby
  // zamienione na prawdziwą ocenę 1 gwiazdki zamiast usunięcia.
  async function deleteRating(nostrPrivKeyBytes, placeKey) {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    const template = {
      kind: RATING_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", `${RATING_D_PREFIX}:${placeKey}`]],
      content: "0"
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;

    if (okCount === 0) {
      throw new Error("push_failed_all_relays");
    }

    for (const key of [...ratingsCache.keys()]) {
      if (key.startsWith(`${placeKey}:`)) ratingsCache.delete(key);
    }

    return { relaysOk: okCount, relaysTotal: relays.length };
  }

  async function fetchRatings(placeKey, myPubKeyHex) {
    const cacheKey = `${placeKey}:${myPubKeyHex || ""}`;
    const cached = ratingsCache.get(cacheKey);
    if (cached && Date.now() - cached.at < RATINGS_CACHE_TTL_MS) {
      return cached.value;
    }

    const lib = await waitForNostrLib();
    const { verifyEvent } = lib;
    const pool = await getSharedPool();
    const relays = getReadRelays();

    const events = await querySyncWithTimeout(pool, relays, {
      kinds: [RATING_KIND],
      "#d": [`${RATING_D_PREFIX}:${placeKey}`]
    });

    if (!events || !events.length) {
      const empty = { average: null, count: 0, myRating: null };
      ratingsCache.set(cacheKey, { at: Date.now(), value: empty });
      return empty;
    }

    // Kilka przekaźników może zwrócić starsze, już zastąpione
    // zdarzenie tego samego autora (nie każdy respektuje semantykę
    // "replaceable" tak samo szybko) - dla każdego pubkey liczy się
    // tylko jego NAJNOWSZY głos.
    const latestByAuthor = new Map();
    for (const event of events) {
      if (!verifyEvent(event)) continue;
      const existing = latestByAuthor.get(event.pubkey);
      if (!existing || event.created_at > existing.created_at) {
        latestByAuthor.set(event.pubkey, event);
      }
    }

    const values = [];
    let myRating = null;
    for (const event of latestByAuthor.values()) {
      const value = Number(event.content);
      if (Number.isFinite(value) && value >= 1 && value <= 5) {
        values.push(value);
        if (myPubKeyHex && event.pubkey === myPubKeyHex) myRating = value;
      }
    }

    if (!values.length) {
      const empty = { average: null, count: 0, myRating: null };
      ratingsCache.set(cacheKey, { at: Date.now(), value: empty });
      return empty;
    }

    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const result = { average, count: values.length, myRating };
    ratingsCache.set(cacheKey, { at: Date.now(), value: result });
    return result;
  }

  // Wszystkie oceny wystawione przez DANEGO użytkownika (dowolne
  // miejsce) - do ekranu "Aktywność" w panelu konta. W przeciwieństwie
  // do fetchRatings pytamy tu po autorze, bez konkretnego "d" taga.
  async function fetchMyRatings(myPubKeyHex) {
    const lib = await waitForNostrLib();
    const { verifyEvent } = lib;
    const pool = await getSharedPool();
    const relays = getReadRelays();

    const events = await querySyncWithTimeout(pool, relays, {
      kinds: [RATING_KIND],
      authors: [myPubKeyHex]
    });

    if (!events || !events.length) return [];

    // Ta sama para (kind, pubkey, d-tag) może przyjść z kilku
    // przekaźników - zostawiamy tylko najnowsze zdarzenie per miejsce.
    const latestByPlace = new Map();
    for (const event of events) {
      if (!verifyEvent(event)) continue;
      const dTag = event.tags.find(tag => tag[0] === "d")?.[1] || "";
      const placeKey = dTag.startsWith(`${RATING_D_PREFIX}:`)
        ? dTag.slice(RATING_D_PREFIX.length + 1)
        : dTag;
      if (!placeKey) continue;

      const existing = latestByPlace.get(placeKey);
      if (!existing || event.created_at > existing.created_at) {
        latestByPlace.set(placeKey, event);
      }
    }

    const results = [];
    for (const [placeKey, event] of latestByPlace.entries()) {
      const value = Number(event.content);
      if (!Number.isFinite(value) || value < 1 || value > 5) continue;
      const label = event.tags.find(tag => tag[0] === "label")?.[1] || "";
      const lat = Number(event.tags.find(tag => tag[0] === "lat")?.[1]);
      const lon = Number(event.tags.find(tag => tag[0] === "lon")?.[1]);
      const osmType = event.tags.find(tag => tag[0] === "osm_type")?.[1] || "";
      const osmId = event.tags.find(tag => tag[0] === "osm_id")?.[1] || "";
      const placeType = event.tags.find(tag => tag[0] === "place_type")?.[1] || "";
      const placeJsonRaw = event.tags.find(tag => tag[0] === "place_json")?.[1] || "";
      let placeSnapshot = null;
      if (placeJsonRaw) {
        try {
          placeSnapshot = JSON.parse(placeJsonRaw);
        } catch (_) {
          placeSnapshot = null;
        }
      }
      results.push({
        placeKey,
        label,
        rating: value,
        ratedAt: new Date(event.created_at * 1000).toISOString(),
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
        osmType,
        osmId,
        placeType,
        placeSnapshot
      });
    }

    results.sort((a, b) => new Date(b.ratedAt) - new Date(a.ratedAt));
    return results;
  }

  window.OMAP_SYNC_TRANSPORT = {
    isConfigured,
    waitForNostrLib,
    pushBlob,
    pullBlob,
    publishRating,
    fetchRatings,
    fetchMyRatings,
    deleteRating
  };
})();
