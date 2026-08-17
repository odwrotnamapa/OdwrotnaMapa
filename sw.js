// Service Worker Odwrotnej Mapy - cache'uje samą powłokę apki
// (HTML/CSS/JS), żeby dało się ją otworzyć bez internetu. Kafelki
// mapy TEŻ są cache'owane (patrz TILE_CACHE niżej) - oportunistycznie
// (co user oglądał) i, w apce natywnej, świadomie pobrane regiony
// (TILE_CACHE_DOWNLOADED, patrz src/services/offline-region-service.js).
// Odpowiedzi z API wyszukiwania/trasowania NADAL nie są cache'owane -
// to wymagałoby dużo większego projektu (własny silnik routingu/
// wyszukiwania offline).

const CACHE_VERSION = "czemu muszę to gówno robić ręcznie33353";

// Osobna, ograniczona pamięć podręczna na kafelki mapy (wektorowe
// z openfreemap.org i satelitarne z ArcGIS). W przeciwieństwie do
// powłoki apki, kafelków może być teoretycznie nieskończenie wiele,
// więc trzymamy tylko ostatnio używane (LRU wg kolejności zapisu)
// i przycinamy pamięć podręczną do rozsądnego rozmiaru.
const TILE_CACHE = "odwrotnamapa-tiles-v1";
const TILE_CACHE_MAX_ENTRIES = 300;
const TILE_HOSTS = [
  "tiles.openfreemap.org",
  "server.arcgisonline.com"
];

// Osobny bucket na kafelki świadomie pobrane przez usera do trybu
// offline (src/services/offline-region-service.js, apka natywna
// tylko). W przeciwieństwie do TILE_CACHE powyżej, ten NIGDY nie jest
// trymowany przez trimCache() - trymowanie skasowałoby ręcznie
// pobrany region tylko dlatego, że user pooglądał gdzie indziej.
// Nazwa musi być identyczna z TILE_CACHE_DOWNLOADED w
// offline-region-service.js - to jeden i ten sam Cache Storage,
// współdzielony między stroną a tym Service Workerem.
const TILE_CACHE_DOWNLOADED = "odwrotnamapa-tiles-downloaded-v1";

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // caches.keys() zwraca w kolejności zapisu, więc najstarsze są
  // na początku - usuwamy nadmiar od nich (proste LRU).
  const toDelete = keys.slice(0, keys.length - maxEntries);
  await Promise.all(toDelete.map(request => cache.delete(request)));
}

const APP_SHELL_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./config.js",
  "./app.js",
  "./search-v2/lexicon/data-pl.js",
  "./search-v2/lexicon/loader.js",
  "./search-v2/location/compiled/pl-locations.compiled.js",
  "./search-v2/location/resolver.js",
  "./search-v2/parser.js",
  "./search-v2/ranking/helpers.js",
  "./search-v2/ranking/name.js",
  "./search-v2/ranking/location.js",
  "./search-v2/ranking/category.js",
  "./search-v2/ranking/brand.js",
  "./search-v2/ranking/modifiers.js",
  "./search-v2/ranking/importance.js",
  "./search-v2/ranking/final-score.js",
  "./search-v2/ranker.js",
  "./search-v2/teryt/pl-teryt-index.js",
  "./search-v2/teryt/provider.js",
  "./search-v2/named-poi/pl-named-poi.js",
  "./search-v2/named-poi/provider.js",
  "./search-v2/providers/local.js",
  "./search-v2/providers/nominatim.js",
  "./search-v2/providers/photon.js",
  "./search-v2/providers/manager.js",
  "./search-v2/engine.js",
  "./search-v2/localization/pl-categories.js",
  "./search-v2/localization/categories.js",
  "./search-v2/session.js",
  "./src/models/place.js",
  "./src/components/bottom-sheet.js",
  "./src/components/photo-gallery.js",
  "./src/components/place-card.js",
  "./src/components/back-navigation.js",
  "./src/components/ui-foundation.js",
  "./src/services/category-service.js",
  "./src/services/opening-hours-service.js",
  "./src/services/address-service.js",
  "./src/services/photo-cache.js",
  "./src/services/photo-source-resolver.js",
  "./src/services/photo-service.js",
  "./src/services/place-resolver-service.js",
  "./src/services/place-service.js",
  "./src/services/url-state-service.js",
  "./src/services/sync-crypto-service.js",
  "./src/services/sync-transport-service.js",
  "./src/services/discover-service.js",
  "./src/services/ratings-service.js",
  "./src/services/comments-service.js",
  "./src/services/departures-service.js",
  "./src/services/movies-service.js",
  "./src/services/wikipedia-service.js",
  "./src/services/measure-service.js",
  "./src/services/streetview-service.js",
  "./src/services/mapview-service.js",
  "./src/services/trading-sunday-service.js",
  "./src/services/geouri-service.js",
  "./src/services/backup-service.js",
  "./src/services/bottom-sheet-service.js",
  "./src/services/favorites-service.js",
  "./src/services/route-history-service.js",
  "./src/services/custom-place-names-service.js",
  "./src/services/texture-storage-service.js",
  "./src/services/offline-region-service.js",
  "./src/services/seed-words-service.js",
  "./src/services/history-service.js",
  "./src/services/search-history-service.js",
  "./src/services/label-visibility-service.js",
  "./src/services/custom-theme-editor-service.js",
  "./src/services/account-service.js",
  "./src/services/route-service.js",
  "./src/services/isochrone-service.js",
  "./src/services/weather-service.js",
  "./src/services/external-libs-loader.js",
  "./assets/build-info.js",
  "./assets/capacitor-bridge.js",
  "./assets/logo.svg",
  "./assets/favicon.svg",
  "https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.css",
  "https://cdn.jsdelivr.net/npm/maplibre-gl@5.24.0/dist/maplibre-gl.js"
];

self.addEventListener("install", event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);

      // Dodajemy pliki pojedynczo, nie przez cache.addAll(), żeby
      // jeden niedostępny plik (np. zewnętrzny CDN akurat leżący)
      // nie wywalił całej instalacji.
      await Promise.all(
        APP_SHELL_URLS.map(async url => {
          try {
            await cache.add(url);
          } catch (error) {
            console.warn(
              "SW: nie udało się zapisać do cache:",
              url,
              error
            );
          }
        })
      );

      self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter(
            key =>
              key !== CACHE_VERSION &&
              key !== "odwrotnamapa-favorites-media" &&
              key !== TILE_CACHE &&
              key !== TILE_CACHE_DOWNLOADED
          )
          .map(key => caches.delete(key))
      );
      self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", event => {
  const { request } = event;

  // Cache'ujemy wyłącznie żądania GET dla powłoki apki. Zapytania
  // do API mapy/wyszukiwania/trasowania mają przechodzić normalnie
  // przez sieć i po prostu zawieść offline - to celowe.
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Miniatury z Wikipedii zapisane przy dodawaniu do ulubionych -
  // przy braku sieci sięgamy do tej osobnej pamięci podręcznej.
  const isWikipediaMedia =
    url.hostname.endsWith("wikimedia.org") ||
    url.hostname.endsWith("wikipedia.org");

  if (isWikipediaMedia) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch (error) {
          const cache = await caches.open(
            "odwrotnamapa-favorites-media"
          );
          const cached = await cache.match(request, {
            ignoreSearch: true
          });
          if (cached) return cached;
          throw error;
        }
      })()
    );
    return;
  }

  const isTileRequest = TILE_HOSTS.includes(url.hostname);

  if (isTileRequest) {
    event.respondWith(
      (async () => {
        // Świadomie pobrany region offline zawsze wygrywa i nigdy
        // nie idzie do sieci - to jest cały sens "pobierz na offline":
        // pewność, że zadziała bez internetu, bez czekania na
        // nieudany fetch.
        const downloadedCache = await caches.open(TILE_CACHE_DOWNLOADED);
        const downloaded = await downloadedCache.match(request);
        if (downloaded) return downloaded;

        // W przeciwnym razie zwykłe stale-while-revalidate: od razu
        // oddajemy to, co mamy w pamięci (jeśli offline - to jedyna
        // szansa na kafelek), a w tle i tak próbujemy dociągnąć
        // świeższą wersję na przyszłość.
        const cache = await caches.open(TILE_CACHE);
        const cached = await cache.match(request);
        const networkFetch = fetch(request)
          .then(response => {
            if (response && response.ok) {
              cache.put(request, response.clone());
              trimCache(TILE_CACHE, TILE_CACHE_MAX_ENTRIES);
            }
            return response;
          })
          .catch(() => null);

        return cached || (await networkFetch) || Response.error();
      })()
    );
    return;
  }

  const isAppShellRequest =
    APP_SHELL_URLS.some(shellUrl => {
      try {
        return (
          new URL(shellUrl, self.location.href).pathname ===
          url.pathname
        );
      } catch (_) {
        return false;
      }
    }) || url.origin === self.location.origin;

  if (!isAppShellRequest) return;

  // Najpierw sieć (żeby zawsze dostawać najświeższą wersję, gdy
  // jest internet), a dopiero gdy sieć zawiedzie - zapisana kopia.
  // "cache: no-store" jest tu kluczowe: bez tego zwykły fetch()
  // potrafi po cichu oddać odpowiedź z WŁASNEGO cache HTTP
  // przeglądarki (zgodnie z nagłówkami Cache-Control z hostingu),
  // więc "sieć" wcale nie musi oznaczać świeżych danych - trzeba to
  // jawnie wymusić.
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request, { cache: "no-store" });
        if (response && response.ok) {
          const cache = await caches.open(CACHE_VERSION);
          cache.put(request, response.clone());
        }
        return response;
      } catch (error) {
        const cached = await caches.match(request, {
          ignoreSearch: true
        });
        if (cached) return cached;
        throw error;
      }
    })()
  );
});
