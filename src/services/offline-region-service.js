(function () {
  "use strict";

  // Silnik pobierania fragmentów mapy na offline - WYŁĄCZNIE dla apki
  // (Android/Electron przez Capacitor), nie dla wersji webowej: patrz
  // isNativeAppContext() niżej. W przeglądarce cache jest efemeryczny
  // (może zostać wyczyszczony przez system pod presją miejsca, bez
  // gwarancji trwałości), więc świadome "pobierz mi tę dzielnicę"
  // nie ma tam sensu - użytkownik dostałby fałszywe poczucie
  // bezpieczeństwa. W apce (dysk przez WebView, potencjalnie
  // navigator.storage.persist()) ma to już sens.
  //
  // W pełni samodzielny moduł - zero zależności od state/el/map/text.
  // Komunikacja z app.js przez window.OMAP_OFFLINE_REGIONS, zgodnie
  // z konwencją reszty src/services/.
  //
  // Celowo NIE zawiera jeszcze żadnego UI (przycisku w menu,
  // rysowania obszaru na mapie) - to osobny krok, wymaga decyzji o
  // UX. Ten plik to tylko silnik: matematyka kafelków + pobieranie +
  // manifest.

  const DB_NAME = "odwrotnamapa-offline-regions";
  const DB_VERSION = 1;
  const REGION_STORE = "regions";

  // Osobny, NIEtrymowany bucket cache - patrz też sw.js
  // (TILE_CACHE_DOWNLOADED). Musi być ta sama nazwa w obu miejscach,
  // bo to jeden i ten sam Cache Storage współdzielony między stroną
  // a Service Workerem.
  const TILE_CACHE_DOWNLOADED = "odwrotnamapa-tiles-downloaded-v1";

  const MAX_CONCURRENT_DOWNLOADS = 6;

  // ---- Wykrywanie kontekstu apki -------------------------------

  // Tylko Android i Electron - projekt nie ma builda na iOS
  // (patrz ARCHITEKTURA.md: android/, electron/, brak ios/), więc
  // sprawdzanie "ios" byłoby martwym kodem sugerującym platformę,
  // która nie istnieje.
  function isNativeAppContext() {
    return (
      window.CapacitorPlatform === "android" ||
      window.CapacitorPlatform === "electron" ||
      navigator.userAgent.includes("Electron")
    );
  }

  // ---- Matematyka kafelków XYZ -----------------------------------

  function lonLatToTileXY(lon, lat, zoom) {
    const latRad = (Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180;
    const n = 2 ** zoom;
    const x = Math.floor(((lon + 180) / 360) * n);
    const y = Math.floor(
      ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) *
        n
    );
    return {
      x: Math.max(0, Math.min(n - 1, x)),
      y: Math.max(0, Math.min(n - 1, y))
    };
  }

  // bbox = [west, south, east, north] (kolejność jak w MapLibre
  // getBounds().toArray().flat())
  function tilesForBboxAtZoom(bbox, zoom) {
    const [west, south, east, north] = bbox;
    const nw = lonLatToTileXY(west, north, zoom);
    const se = lonLatToTileXY(east, south, zoom);
    const tiles = [];
    for (let x = nw.x; x <= se.x; x++) {
      for (let y = nw.y; y <= se.y; y++) {
        tiles.push({ z: zoom, x, y });
      }
    }
    return tiles;
  }

  function tilesForBbox(bbox, minZoom, maxZoom) {
    const tiles = [];
    for (let z = minZoom; z <= maxZoom; z++) {
      tiles.push(...tilesForBboxAtZoom(bbox, z));
    }
    return tiles;
  }

  function estimateTileCount(bbox, minZoom, maxZoom) {
    let total = 0;
    for (let z = minZoom; z <= maxZoom; z++) {
      total += tilesForBboxAtZoom(bbox, z).length;
    }
    return total;
  }

  // ---- Wyciąganie prawdziwych URL-i ze style.json -----------------
  //
  // Świadomie NIE hardkodujemy URL-i kafelków/glyphów/sprite'a -
  // czytamy je za każdym razem z aktualnego style.json (ten sam,
  // który ładuje MapLibre pod CONFIG.map.styleUrl). Jeśli openfreemap
  // kiedyś zmieni układ, to i tak przestałaby działać sama mapa, więc
  // nie dokładamy tu nowego punktu awarii.

  let cachedStyleAssets = null;
  let cachedStyleAssetsUrl = null;

  async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Nie udało się pobrać ${url}: HTTP ${response.status}`);
    }
    return response.json();
  }

  // Zwraca: { vectorSources: [{ id, tileUrlTemplate, minzoom, maxzoom }],
  //           glyphsTemplate, spriteBaseUrl }
  async function resolveStyleAssets(styleUrl) {
    if (cachedStyleAssets && cachedStyleAssetsUrl === styleUrl) {
      return cachedStyleAssets;
    }

    const style = await fetchJson(styleUrl);
    const vectorSources = [];

    for (const [sourceId, source] of Object.entries(style.sources || {})) {
      if (source.type !== "vector") continue;

      if (Array.isArray(source.tiles) && source.tiles.length > 0) {
        vectorSources.push({
          id: sourceId,
          tileUrlTemplate: source.tiles[0],
          minzoom: source.minzoom ?? 0,
          maxzoom: source.maxzoom ?? 22
        });
      } else if (typeof source.url === "string") {
        // Źródło wskazuje na osobny dokument TileJSON zamiast
        // trzymać "tiles" bezpośrednio w stylu - trzeba go dociągnąć.
        try {
          const tileJson = await fetchJson(source.url);
          if (Array.isArray(tileJson.tiles) && tileJson.tiles.length > 0) {
            vectorSources.push({
              id: sourceId,
              tileUrlTemplate: tileJson.tiles[0],
              minzoom: tileJson.minzoom ?? source.minzoom ?? 0,
              maxzoom: tileJson.maxzoom ?? source.maxzoom ?? 22
            });
          }
        } catch (error) {
          console.warn(
            `Offline: nie udało się rozwiązać TileJSON dla źródła "${sourceId}":`,
            error
          );
        }
      }
    }

    const result = {
      vectorSources,
      glyphsTemplate: typeof style.glyphs === "string" ? style.glyphs : null,
      spriteBaseUrl: typeof style.sprite === "string" ? style.sprite : null,
      fontStacks: collectFontStacks(style)
    };

    cachedStyleAssets = result;
    cachedStyleAssetsUrl = styleUrl;
    return result;
  }

  function collectFontStacks(style) {
    const stacks = new Set();
    for (const layer of style.layers || []) {
      const fontStack = layer.layout?.["text-font"];
      if (Array.isArray(fontStack) && fontStack.length > 0) {
        stacks.add(fontStack.join(","));
      }
    }
    return [...stacks];
  }

  function tileUrlFor(template, z, x, y) {
    return template
      .replace("{z}", z)
      .replace("{x}", x)
      .replace("{y}", y);
  }

  // Glyphy MapLibre są cięte na stałe zakresy co 256 punktów kodowych
  // (0-255, 256-511, ..., 65280-65535) - to jest zamknięty,
  // przewidywalny zestaw z samej specyfikacji, nie trzeba go
  // wyliczać z treści etykiet.
  function glyphRangeUrls(glyphsTemplate, fontStacks) {
    if (!glyphsTemplate || fontStacks.length === 0) return [];
    const urls = [];
    for (const fontStack of fontStacks) {
      for (let start = 0; start < 65536; start += 256) {
        const range = `${start}-${start + 255}`;
        urls.push(
          glyphsTemplate
            .replace("{fontstack}", encodeURIComponent(fontStack))
            .replace("{range}", range)
        );
      }
    }
    return urls;
  }

  function spriteUrls(spriteBaseUrl) {
    if (!spriteBaseUrl) return [];
    return [
      `${spriteBaseUrl}.json`,
      `${spriteBaseUrl}.png`,
      `${spriteBaseUrl}@2x.json`,
      `${spriteBaseUrl}@2x.png`
    ];
  }

  // ---- Pobieranie z limitem równoległości -------------------------

  // Osobna, jawna klasa błędu na anulowanie - żeby wywołujący kod
  // (downloadRegion) mógł łatwo rozróżnić "user kliknął anuluj" od
  // prawdziwego błędu sieci, bez zgadywania po treści message.
  class DownloadCancelledError extends Error {
    constructor() {
      super("Pobieranie anulowane przez użytkownika.");
      this.name = "DownloadCancelledError";
    }
  }

  async function downloadWithConcurrency(urls, cache, concurrency, onEach, signal) {
    let index = 0;
    let done = 0;
    let failed = 0;
    let bytes = 0;

    async function worker() {
      while (index < urls.length) {
        if (signal?.aborted) throw new DownloadCancelledError();
        const url = urls[index++];
        try {
          const existing = await cache.match(url);
          if (existing) {
            bytes += await responseByteSize(existing);
          } else {
            const response = await fetch(url, { signal });
            if (response.ok) {
              bytes += await responseByteSize(response);
              await cache.put(url, response.clone());
            } else {
              failed++;
            }
          }
        } catch (error) {
          if (error?.name === "AbortError") throw new DownloadCancelledError();
          if (error instanceof DownloadCancelledError) throw error;
          failed++;
        }
        done++;
        onEach?.(done, urls.length, failed);
      }
    }

    const workers = Array.from(
      { length: Math.min(concurrency, urls.length) },
      () => worker()
    );
    await Promise.all(workers);
    return { total: urls.length, failed, bytes };
  }

  // content-length nie zawsze jest obecny (np. odpowiedzi
  // kompresowane w locie mogą go pomijać) - wtedy mierzymy realny
  // rozmiar przez sklonowanie odpowiedzi i odczyt blob.size. To
  // kosztuje dodatkowe sklonowanie, ale tylko raz na kafelek, nie
  // ma to większego znaczenia przy pobieraniu i tak trwającym sekundy.
  async function responseByteSize(response) {
    const header = response.headers?.get("content-length");
    if (header) return Number(header) || 0;
    try {
      const blob = await response.clone().blob();
      return blob.size;
    } catch (_) {
      return 0;
    }
  }

  // ---- Manifest regionów (IndexedDB) ------------------------------

  function openDb() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB niedostępne"));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(REGION_STORE)) {
          db.createObjectStore(REGION_STORE, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function saveRegionRecord(record) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(REGION_STORE, "readwrite");
      tx.objectStore(REGION_STORE).put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function deleteRegionRecord(id) {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(REGION_STORE, "readwrite");
      tx.objectStore(REGION_STORE).delete(id);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function listRegions() {
    try {
      const db = await openDb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(REGION_STORE, "readonly");
        const store = tx.objectStore(REGION_STORE);
        const result = [];
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    } catch (_) {
      return [];
    }
  }

  // ---- Publiczne API: pobieranie / usuwanie regionu ---------------

  // options: { id, name, bbox, minZoom, maxZoom, styleUrl, onProgress, signal }
  // onProgress(done, total, failed) - wywoływane w trakcie.
  // signal (opcjonalny AbortSignal) - pozwala anulować pobieranie w
  // trakcie; przy anulowaniu NIE zapisujemy regionu do manifestu
  // (kafelki, które zdążyły się pobrać, zostają w cache - to
  // nieszkodliwy, uboczny "zapas" na przyszłość, po prostu nie jest
  // opisany jako ukończony, nazwany region).
  async function downloadRegion(options) {
    const {
      id = `region-${Date.now()}`,
      name,
      bbox,
      minZoom,
      maxZoom,
      styleUrl,
      onProgress,
      signal
    } = options;

    if (!isNativeAppContext()) {
      throw new Error(
        "Pobieranie obszarów offline jest dostępne tylko w aplikacji."
      );
    }

    const assets = await resolveStyleAssets(styleUrl);
    const cache = await caches.open(TILE_CACHE_DOWNLOADED);

    // Kafelki wektorowe - jeden URL na każde źródło typu "vector" w
    // stylu (zwykle jedno, ale nie zakładamy tego na sztywno),
    // przycięte do zakresu zoomu, jaki dane źródło faktycznie ma.
    const tileUrls = [];
    for (const source of assets.vectorSources) {
      const clampedMin = Math.max(minZoom, source.minzoom);
      const clampedMax = Math.min(maxZoom, source.maxzoom);
      if (clampedMin > clampedMax) continue;
      for (const tile of tilesForBbox(bbox, clampedMin, clampedMax)) {
        tileUrls.push(
          tileUrlFor(source.tileUrlTemplate, tile.z, tile.x, tile.y)
        );
      }
    }

    // Glyphy i sprite - stały, mały zestaw niezależny od obszaru;
    // downloadWithConcurrency i tak pomija to, co już jest w cache,
    // więc przy drugim i kolejnym regionie te URL-e są praktycznie
    // darmowe (jeden request HEAD-jak-cache-match zamiast pobrania).
    const staticUrls = [
      ...glyphRangeUrls(assets.glyphsTemplate, assets.fontStacks),
      ...spriteUrls(assets.spriteBaseUrl)
    ];

    const allUrls = [...staticUrls, ...tileUrls];

    let result;
    try {
      result = await downloadWithConcurrency(
        allUrls,
        cache,
        MAX_CONCURRENT_DOWNLOADS,
        onProgress,
        signal
      );
    } catch (error) {
      if (error instanceof DownloadCancelledError) {
        return { id, cancelled: true };
      }
      throw error;
    }

    const { total, failed, bytes } = result;

    await saveRegionRecord({
      id,
      name,
      bbox,
      minZoom,
      maxZoom,
      styleUrl,
      tileCount: tileUrls.length,
      bytes,
      createdAt: Date.now()
    });

    return { id, total, failed, tileCount: tileUrls.length, bytes };
  }

  async function deleteRegion(id) {
    const regions = await listRegions();
    const region = regions.find(r => r.id === id);
    if (!region) return;

    const assets = await resolveStyleAssets(region.styleUrl);
    const cache = await caches.open(TILE_CACHE_DOWNLOADED);

    for (const source of assets.vectorSources) {
      const clampedMin = Math.max(region.minZoom, source.minzoom);
      const clampedMax = Math.min(region.maxZoom, source.maxzoom);
      if (clampedMin > clampedMax) continue;
      for (const tile of tilesForBbox(region.bbox, clampedMin, clampedMax)) {
        const url = tileUrlFor(source.tileUrlTemplate, tile.z, tile.x, tile.y);
        await cache.delete(url);
      }
    }
    // Glyphy/sprite celowo zostają - mogą być używane przez inne
    // zapisane regiony, to współdzielony, stały zasób.

    await deleteRegionRecord(id);
  }

  async function estimateStorageUsage() {
    if (!navigator.storage?.estimate) return null;
    try {
      const { usage, quota } = await navigator.storage.estimate();
      return { usage, quota };
    } catch (_) {
      return null;
    }
  }

  window.OMAP_OFFLINE_REGIONS = {
    isNativeAppContext,
    tilesForBbox,
    estimateTileCount,
    resolveStyleAssets,
    downloadRegion,
    deleteRegion,
    listRegions,
    estimateStorageUsage
  };
})();
