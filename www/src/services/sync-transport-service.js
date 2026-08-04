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
    "wss://relay.primal.net"
  ];

  // Kind 30078 = NIP-78 "Application-specific data", zakres
  // "parameterized replaceable" (30000-39999): przekaźnik trzyma
  // tylko NAJNOWSZE zdarzenie dla danej pary (pubkey, kind, tag "d") -
  // dokładnie pasuje do "aktualny stan ustawień".
  const SYNC_KIND = 30078;
  const SYNC_D_TAG = "odwrotnamapa-sync-v1";

  function getRelays() {
    const configured = window.SOUTHMAPS_CONFIG?.sync?.relays;
    return Array.isArray(configured) && configured.length ? configured : DEFAULT_RELAYS;
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

  async function pushBlob(nostrPrivKeyBytes, blobContent, topic = "main") {
    const lib = await waitForNostrLib();
    const { finalizeEvent } = lib;
    const pool = new lib.SimplePool();
    const relays = getRelays();

    try {
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
    } finally {
      pool.close(relays);
    }
  }

  async function pullBlob(nostrPubKeyHex, topic = "main") {
    const lib = await waitForNostrLib();
    const { verifyEvent } = lib;
    const pool = new lib.SimplePool();
    const relays = getRelays();

    let events;
    try {
      events = await pool.querySync(relays, {
        kinds: [SYNC_KIND],
        authors: [nostrPubKeyHex],
        "#d": [`${SYNC_D_TAG}:${topic}`]
      });
    } finally {
      pool.close(relays);
    }

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

  window.OMAP_SYNC_TRANSPORT = {
    isConfigured,
    waitForNostrLib,
    pushBlob,
    pullBlob
  };
})();
