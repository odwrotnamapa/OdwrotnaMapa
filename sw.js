// Service Worker Odwrotnej Mapy - cache'uje samą powłokę apki
// (HTML/CSS/JS), żeby dało się ją otworzyć bez internetu.
// Świadomie NIE cache'uje kafelków mapy ani odpowiedzi z API
// wyszukiwania/trasowania - to wymagałoby dużo większego
// projektu (limity pamięci, dobór obszaru do zapisania itd.).

const CACHE_VERSION = "shell-v1-20260729";

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
              key !== "odwrotnamapa-favorites-media"
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
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
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
