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
  // Kind 1956 = zwykle (NIE zastepowalne, zakres ponizej 10000)
  // zdarzenie - w przeciwienstwie do ocen (jedna wartosc na
  // uzytkownika na miejsce, kazda nowa publikacja podmienia
  // poprzednia), komentarzy chcemy WIELE na miejsce, wspolistniejacych
  // - kazdy to osobne, trwale zdarzenie. Tag "d" sluzy tu WYLACZNIE do
  // filtrowania po miejscu przy odczycie, nie oznacza "zastepowalne"
  // dla tego zakresu kind.
  const COMMENT_KIND = 1956;
  const COMMENT_D_PREFIX = "odwrotnamapa-comment-v1";
  const COMMENT_MAX_LENGTH = 500;
  // Reakcje (lubię/nie lubię) pod komentarzami - zastepowalne
  // zdarzenie (jedna reakcja na komentarz na uzytkownika), ten sam
  // wzorzec co oceny miejsc, tylko celem jest komentarz, nie miejsce.
  const COMMENT_REACTION_KIND = 31557;
  const COMMENT_REACTION_D_PREFIX = "odwrotnamapa-comment-reaction-v1";

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

  // NAPRAWA (2026-08-14): wcześniej ta funkcja zawsze odpytywała
  // window.OMAP_NOSTR_LIB co 100ms przez pełne 8s, nawet jeśli
  // external-libs-loader.js już wiedział (natychmiast, przy starcie
  // strony), że pierwsza próba załadowania biblioteki się nie udała.
  // Efekt: każde otwarcie panelu miejsca po takiej (choćby chwilowej)
  // usterce sieci wisiało 8 sekund, zanim pokazało błąd "nie udało
  // się wczytać". Teraz korzystamy z window.OMAP_NOSTR_LIB_READY -
  // jeśli pierwsza próba już się nie powiodła, dostajemy to od razu
  // i kończymy szybciej; jeśli w tle (patrz external-libs-loader.js)
  // uda się kolejna próba, window.OMAP_NOSTR_LIB pojawi się i
  // KOLEJNE wywołanie tej funkcji (np. po kliknięciu "spróbuj
  // ponownie") zwróci bibliotekę natychmiast, bez czekania.
  function waitForNostrLib(timeoutMs = 8000) {
    if (window.OMAP_NOSTR_LIB) return Promise.resolve(window.OMAP_NOSTR_LIB);

    const readyPromise = window.OMAP_NOSTR_LIB_READY;

    return new Promise((resolve, reject) => {
      const start = Date.now();
      let settled = false;
      const finish = (fn, value) => {
        if (settled) return;
        settled = true;
        fn(value);
      };

      if (readyPromise && typeof readyPromise.then === "function") {
        readyPromise.then(
          lib => finish(resolve, lib),
          error => finish(reject, error)
        );
      }

      (function check() {
        if (settled) return;
        if (window.OMAP_NOSTR_LIB) return finish(resolve, window.OMAP_NOSTR_LIB);
        if (Date.now() - start > timeoutMs) {
          return finish(reject, new Error("nostr_lib_unavailable"));
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
  const commentsCache = new Map();
  // Krotszy TTL niz oceny - komentarze to lista, ktora czesciej
  // przybywa nowymi wpisami (nie tylko podmienia sie jedna wartosc),
  // wiec swiezosc ma tu wieksze znaczenie.
  const COMMENTS_CACHE_TTL_MS = 5 * 60 * 1000;
  const reactionsCache = new Map();
  const REACTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

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

    // Zaokrąglamy do najbliższej połówki (0.5, 1, 1.5 ... 5), nie do
    // pełnej liczby - żeby dało się ocenić np. na 0,5 albo 2,5.
    const value = Math.max(0.5, Math.min(5, Math.round(Number(ratingValue) * 2) / 2));

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
      const empty = { average: null, count: 0, myRating: null, byAuthor: {} };
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
    const byAuthor = {};
    let myRating = null;
    for (const event of latestByAuthor.values()) {
      const value = Number(event.content);
      if (Number.isFinite(value) && value >= 0.5 && value <= 5) {
        values.push(value);
        byAuthor[event.pubkey] = value;
        if (myPubKeyHex && event.pubkey === myPubKeyHex) myRating = value;
      }
    }

    if (!values.length) {
      const empty = { average: null, count: 0, myRating: null, byAuthor: {} };
      ratingsCache.set(cacheKey, { at: Date.now(), value: empty });
      return empty;
    }

    const average = values.reduce((sum, v) => sum + v, 0) / values.length;
    const result = { average, count: values.length, myRating, byAuthor };
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
      if (!Number.isFinite(value) || value < 0.5 || value > 5) continue;
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

  // Komentarze - zwykle (nie zastepowalne) zdarzenia, wiele na
  // miejsce. W przeciwienstwie do ocen, kazdy komentarz to osobny,
  // trwaly wpis - nowy nie kasuje ani nie zastepuje poprzednich.
  async function publishComment(nostrPrivKeyBytes, placeKey, commentText, placeMeta, parentCommentId) {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    const text = String(commentText || "").trim().slice(0, COMMENT_MAX_LENGTH);
    if (!text) throw new Error("empty_comment");

    const tags = [
      ["d", `${COMMENT_D_PREFIX}:${placeKey}`]
    ];
    // Odpowiedz na komentarz - standardowy sposob Nostr (NIP-10) na
    // oznaczenie, do czego to nawiazuje. Tag "d" zostaje ten sam
    // (grupowanie po miejscu) - "e" wskazuje konkretnie na
    // komentarz-rodzica.
    if (parentCommentId) {
      tags.push(["e", parentCommentId, "", "reply"]);
    }
    if (placeMeta?.label) tags.push(["label", String(placeMeta.label).slice(0, 200)]);
    if (Number.isFinite(placeMeta?.lat) && Number.isFinite(placeMeta?.lon)) {
      tags.push(["lat", String(placeMeta.lat)]);
      tags.push(["lon", String(placeMeta.lon)]);
    }
    if (placeMeta?.osmType && placeMeta?.osmId) {
      tags.push(["osm_type", String(placeMeta.osmType)]);
      tags.push(["osm_id", String(placeMeta.osmId)]);
    }
    if (!(placeMeta?.osmType && placeMeta?.osmId) && placeMeta?.placeSnapshot) {
      tags.push(["place_json", JSON.stringify(placeMeta.placeSnapshot).slice(0, 4000)]);
    }
    if (placeMeta?.placeType) {
      tags.push(["place_type", String(placeMeta.placeType)]);
    }

    const template = {
      kind: COMMENT_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: text
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;

    if (okCount === 0) {
      throw new Error("push_failed_all_relays");
    }

    for (const key of [...commentsCache.keys()]) {
      if (key.startsWith(`${placeKey}`)) commentsCache.delete(key);
    }

    return { relaysOk: okCount, relaysTotal: relays.length, eventId: event.id };
  }

  // Kasowanie POJEDYNCZEGO komentarza (nie calego miejsca, jak przy
  // ocenach) - prawdziwe zdarzenie kasowania NIP-09 (kind 5),
  // odwolujace sie do id kasowanego komentarza. Przy odczycie
  // (fetchComments) sprawdzamy, czy dla danego komentarza istnieje
  // takie zdarzenie OD TEGO SAMEGO AUTORA - jesli tak, pomijamy go.
  async function deleteComment(nostrPrivKeyBytes, commentEventId) {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    const template = {
      kind: 5,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["e", commentEventId]],
      content: ""
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;

    if (okCount === 0) {
      throw new Error("push_failed_all_relays");
    }

    commentsCache.clear();

    return { relaysOk: okCount, relaysTotal: relays.length };
  }

  async function fetchComments(placeKey) {
    const cached = commentsCache.get(placeKey);
    if (cached && Date.now() - cached.at < COMMENTS_CACHE_TTL_MS) {
      return cached.value;
    }

    const lib = await waitForNostrLib();
    const { verifyEvent } = lib;
    const pool = await getSharedPool();
    const relays = getReadRelays();

    const events = await querySyncWithTimeout(pool, relays, {
      kinds: [COMMENT_KIND],
      "#d": [`${COMMENT_D_PREFIX}:${placeKey}`]
    });

    if (!events || !events.length) {
      const empty = [];
      commentsCache.set(placeKey, { at: Date.now(), value: empty });
      return empty;
    }

    const validEvents = events.filter(event => verifyEvent(event));

    // Sprawdzamy zdarzenia kasowania (NIP-09) tylko dla znalezionych
    // komentarzy - nie ma sensu pytac o wiecej niz trzeba.
    const eventIds = validEvents.map(e => e.id);
    const deletionEvents = eventIds.length
      ? await querySyncWithTimeout(pool, relays, {
          kinds: [5],
          "#e": eventIds
        }).catch(() => [])
      : [];

    const deletedIds = new Set();
    for (const delEvent of (deletionEvents || [])) {
      if (!verifyEvent(delEvent)) continue;
      for (const tag of delEvent.tags) {
        if (tag[0] !== "e") continue;
        const targetComment = validEvents.find(e => e.id === tag[1]);
        // Kasowanie liczy sie tylko, jesli pochodzi od TEGO SAMEGO
        // autora co komentarz - inaczej ktokolwiek mogliby kasowac
        // cudze wpisy.
        if (targetComment && targetComment.pubkey === delEvent.pubkey) {
          deletedIds.add(tag[1]);
        }
      }
    }

    const seenIds = new Set();
    const validComments = [];
    for (const event of validEvents) {
      if (deletedIds.has(event.id)) continue;
      if (seenIds.has(event.id)) continue;
      seenIds.add(event.id);
      const text = String(event.content || "").trim();
      if (!text) continue;
      const parentId = event.tags.find(tag => tag[0] === "e" && tag[3] === "reply")?.[1] || null;
      validComments.push({
        id: event.id,
        pubkey: event.pubkey,
        text,
        createdAt: event.created_at,
        parentId
      });
    }

    validComments.sort((a, b) => b.createdAt - a.createdAt);

    commentsCache.set(placeKey, { at: Date.now(), value: validComments });
    return validComments;
  }

  const profileMetaCache = new Map();
  // Nazwy zmieniaja sie rzadko - dluzszy TTL niz komentarze/oceny.
  const PROFILE_META_CACHE_TTL_MS = 60 * 60 * 1000;
  // ALE: pusty wynik (nic nie znaleziono) dostaje DUZO krotszy TTL -
  // czesty scenariusz to swiezo opublikowane metadane (np. przy
  // starcie appki), ktore przekazniki jeszcze nie zdazyly
  // rozpropagowac/zaindeksowac w momencie pierwszego odczytu. Bez
  // tego jeden nieudany "wyscig" cache'owalby brak nazwy na cala
  // godzine, mimo ze publikacja i tak sie udala chwile pozniej.
  const PROFILE_META_EMPTY_CACHE_TTL_MS = 15 * 1000;

  // Standardowe, PUBLICZNE metadane Nostr (NIP-01, kind 0) - w
  // odroznieniu od wlasnego, szyfrowanego blobu profilu appki
  // (pushBlob/pullBlob, czytelny TYLKO dla wlasciciela), to jest
  // jedyny sposob, zeby ktokolwiek inny (np. czytajacy komentarze)
  // mogl w ogole zobaczyc czyjas wybrana nazwe.
  async function publishProfileMetadata(nostrPrivKeyBytes, profile) {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    // Awatar z lokalnego przesylania pliku to zakodowany obrazek
    // (data:image/...;base64,...), nie URL. Standardowe pole "picture"
    // w metadanych Nostr (kind 0) "powinno" byc URL-em, ale appka nie
    // ma wlasnego hostingu obrazkow - to jedyny sposob, zeby inni
    // uzytkownicy w ogole zobaczyli czyjs awatar przy komentarzach.
    // Publikujemy wiec data URL wprost, BEZ obcinania (obciecie
    // stringu base64 w dowolnym miejscu uszkadza go calkowicie -
    // dajac zepsuty obrazek zamiast go nie pokazac wcale). Jedyna
    // ochrona to twardy limit dlugosci: awatar jest juz pomniejszony
    // po stronie klienta (downscaleImageDataUrl, max 192px) wiec
    // typowo miesci sie w kilkunastu KB - jesli mimo to wyjdzie
    // powyzej limitu, wolimy nie publikowac go wcale niz ryzykowac
    // odrzucenie calego zdarzenia przez przekazniki majace limity
    // rozmiaru tresci.
    const avatarValue = String(profile?.avatar || "").trim();
    const isRealUrl = /^https?:\/\//i.test(avatarValue);
    const isDataUrl = /^data:image\/[a-z0-9.+-]+;base64,/i.test(avatarValue);
    const MAX_AVATAR_DATA_URL_LENGTH = 60000;

    let picture = "";
    if (isRealUrl) {
      picture = avatarValue.slice(0, 2000);
    } else if (isDataUrl && avatarValue.length <= MAX_AVATAR_DATA_URL_LENGTH) {
      picture = avatarValue;
    }

    const content = JSON.stringify({
      name: String(profile?.name || "").slice(0, 100),
      picture
    });

    const template = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;
    if (okCount === 0) throw new Error("push_failed_all_relays");

    profileMetaCache.delete(event.pubkey);
    return { relaysOk: okCount, relaysTotal: relays.length };
  }

  // Pobiera nazwy dla LISTY pubkeyow naraz (np. wszyscy autorzy
  // komentarzy pod jednym miejscem) - jedno zapytanie zamiast osobnego
  // na kazdego autora.
  async function fetchProfileMetadata(pubkeys) {
    const uniquePubkeys = [...new Set(pubkeys)];
    const uncached = uniquePubkeys.filter(pk => {
      const cached = profileMetaCache.get(pk);
      if (!cached) return true;
      const isEmpty = !cached.value?.name && !cached.value?.avatar;
      const ttl = isEmpty ? PROFILE_META_EMPTY_CACHE_TTL_MS : PROFILE_META_CACHE_TTL_MS;
      return Date.now() - cached.at > ttl;
    });

    if (uncached.length) {
      const lib = await waitForNostrLib();
      const { verifyEvent } = lib;
      const pool = await getSharedPool();
      const relays = getReadRelays();

      const events = await querySyncWithTimeout(pool, relays, {
        kinds: [0],
        authors: uncached
      }).catch(() => []);

      const latestByAuthor = new Map();
      for (const event of (events || [])) {
        if (!verifyEvent(event)) continue;
        const existing = latestByAuthor.get(event.pubkey);
        if (!existing || event.created_at > existing.created_at) {
          latestByAuthor.set(event.pubkey, event);
        }
      }

      for (const pubkey of uncached) {
        const event = latestByAuthor.get(pubkey);
        let name = "";
        let avatar = "";
        if (event) {
          try {
            const parsed = JSON.parse(event.content);
            name = String(parsed.name || parsed.display_name || "").trim().slice(0, 100);
            // Bez obcinania - patrz komentarz w publishProfileMetadata:
            // awatar to zwykle data URL (base64), a obciecie stringu
            // base64 w dowolnym miejscu go uszkadza. Sam limit dlugosci
            // pilnowany jest juz przy publikacji (MAX_AVATAR_DATA_URL_LENGTH),
            // tu tylko odrzucamy ewentualny nietypowo dlugi wpis z
            // innego klienta.
            const rawPicture = String(parsed.picture || "").trim();
            avatar = rawPicture.length <= 60000 ? rawPicture : "";
          } catch (_) {
            name = "";
            avatar = "";
          }
        }
        profileMetaCache.set(pubkey, { at: Date.now(), value: { name, avatar } });
      }
    }

    const result = {};
    for (const pk of uniquePubkeys) {
      result[pk] = profileMetaCache.get(pk)?.value || { name: "", avatar: "" };
    }
    return result;
  }

  // Reakcje (lubie/nie lubie) pod komentarzami - jedna reakcja na
  // komentarz na uzytkownika, nowa publikacja zastepuje poprzednia
  // (ten sam mechanizm co oceny miejsc).
  async function publishCommentReaction(nostrPrivKeyBytes, commentEventId, reaction) {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = await getSharedPool();
    const relays = getRelays();

    // reaction: "like" | "dislike" | "" (pusta = usuniecie reakcji)
    const value = reaction === "like" || reaction === "dislike" ? reaction : "";

    const template = {
      kind: COMMENT_REACTION_KIND,
      created_at: Math.floor(Date.now() / 1000),
      tags: [["d", `${COMMENT_REACTION_D_PREFIX}:${commentEventId}`]],
      content: value
    };
    const event = finalizeEvent(template, nostrPrivKeyBytes);

    const results = await Promise.allSettled(pool.publish(relays, event));
    const okCount = results.filter(r => r.status === "fulfilled").length;
    if (okCount === 0) throw new Error("push_failed_all_relays");

    reactionsCache.delete(commentEventId);
    return { relaysOk: okCount, relaysTotal: relays.length };
  }

  // Pobiera zliczone reakcje dla LISTY komentarzy naraz (np. wszystkie
  // komentarze pod jednym miejscem) - jedno zapytanie zamiast osobnego
  // na kazdy komentarz.
  async function fetchCommentReactions(commentEventIds, myPubKeyHex) {
    const uniqueIds = [...new Set(commentEventIds)];
    const uncached = uniqueIds.filter(id => {
      const cached = reactionsCache.get(id);
      return !cached || Date.now() - cached.at > REACTIONS_CACHE_TTL_MS;
    });

    if (uncached.length) {
      const lib = await waitForNostrLib();
      const { verifyEvent } = lib;
      const pool = await getSharedPool();
      const relays = getReadRelays();

      const dTags = uncached.map(id => `${COMMENT_REACTION_D_PREFIX}:${id}`);
      const events = await querySyncWithTimeout(pool, relays, {
        kinds: [COMMENT_REACTION_KIND],
        "#d": dTags
      }).catch(() => []);

      // Tylko najnowsza reakcja per (komentarz, autor) - kilka
      // przekaznikow moze zwrocic juz zastapione, starsze zdarzenie.
      const latestByCommentAndAuthor = new Map();
      for (const event of (events || [])) {
        if (!verifyEvent(event)) continue;
        const dTag = event.tags.find(tag => tag[0] === "d")?.[1] || "";
        const commentId = dTag.startsWith(`${COMMENT_REACTION_D_PREFIX}:`)
          ? dTag.slice(COMMENT_REACTION_D_PREFIX.length + 1)
          : "";
        if (!commentId) continue;
        const key = `${commentId}:${event.pubkey}`;
        const existing = latestByCommentAndAuthor.get(key);
        if (!existing || event.created_at > existing.created_at) {
          latestByCommentAndAuthor.set(key, { ...event, commentId });
        }
      }

      const tally = new Map();
      for (const id of uncached) tally.set(id, { likes: 0, dislikes: 0, reactions: [] });
      for (const event of latestByCommentAndAuthor.values()) {
        const bucket = tally.get(event.commentId);
        if (!bucket) continue;
        if (event.content === "like") bucket.likes++;
        else if (event.content === "dislike") bucket.dislikes++;
        if (event.content === "like" || event.content === "dislike") {
          bucket.reactions.push({ pubkey: event.pubkey, value: event.content });
        }
      }

      for (const id of uncached) {
        reactionsCache.set(id, { at: Date.now(), value: tally.get(id) });
      }
    }

    const result = {};
    for (const id of uniqueIds) {
      const bucket = reactionsCache.get(id)?.value || { likes: 0, dislikes: 0, reactions: [] };
      const mine = myPubKeyHex
        ? bucket.reactions.find(r => r.pubkey === myPubKeyHex)?.value || ""
        : "";
      result[id] = { likes: bucket.likes, dislikes: bucket.dislikes, myReaction: mine };
    }
    return result;
  }

  // Wszystkie komentarze wystawione przez DANEGO uzytkownika (dowolne
  // miejsce) - do ekranu "Aktywnosc", ten sam wzorzec co
  // fetchMyRatings.
  async function fetchMyComments(myPubKeyHex) {
    const lib = await waitForNostrLib();
    const { verifyEvent } = lib;
    const pool = await getSharedPool();
    const relays = getReadRelays();

    const events = await querySyncWithTimeout(pool, relays, {
      kinds: [COMMENT_KIND],
      authors: [myPubKeyHex]
    });

    if (!events || !events.length) return [];

    const eventIds = events.map(e => e.id);
    const deletionEvents = await querySyncWithTimeout(pool, relays, {
      kinds: [5],
      "#e": eventIds
    }).catch(() => []);

    const deletedIds = new Set();
    for (const delEvent of (deletionEvents || [])) {
      if (!verifyEvent(delEvent)) continue;
      for (const tag of delEvent.tags) {
        if (tag[0] === "e" && delEvent.pubkey === myPubKeyHex) deletedIds.add(tag[1]);
      }
    }

    const seenIds = new Set();
    const results = [];
    for (const event of events) {
      if (!verifyEvent(event)) continue;
      if (deletedIds.has(event.id)) continue;
      if (seenIds.has(event.id)) continue;
      seenIds.add(event.id);

      const text = String(event.content || "").trim();
      if (!text) continue;

      const dTag = event.tags.find(tag => tag[0] === "d")?.[1] || "";
      const placeKey = dTag.startsWith(`${COMMENT_D_PREFIX}:`)
        ? dTag.slice(COMMENT_D_PREFIX.length + 1)
        : dTag;
      if (!placeKey) continue;

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
        id: event.id,
        placeKey,
        label,
        text,
        commentedAt: new Date(event.created_at * 1000).toISOString(),
        lat: Number.isFinite(lat) ? lat : null,
        lon: Number.isFinite(lon) ? lon : null,
        osmType,
        osmId,
        placeType,
        placeSnapshot
      });
    }

    results.sort((a, b) => new Date(b.commentedAt) - new Date(a.commentedAt));
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
    deleteRating,
    publishComment,
    fetchComments,
    deleteComment,
    publishProfileMetadata,
    fetchProfileMetadata,
    publishCommentReaction,
    fetchCommentReactions,
    fetchMyComments
  };
})();
