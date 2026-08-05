# Odwrotna Mapa — Architektura

*Ostatnia aktualizacja: 2026-08-05. Ten plik ma być prawdziwym opisem
kodu, nie planem/aspiracją — aktualizuj go razem z każdą zmianą,
która dodaje nowy podsystem albo zmienia sposób działania istniejącego,
nie tylko przy drobnych poprawkach UI/CSS.*

## Ogólny kształt

Vanilla JS, bez frameworka i bez kroku budowania dla samego `app.js`
(jeden plik, jedno IIFE, ~500 KB, ładowany bezpośrednio przez
`<script>`). Style w jednym `style.css` (~7000 linii). Brak
transpilacji/bundlera — to, co jest w plikach, to dokładnie to, co
wykonuje przeglądarka.

`app.js` jest zorganizowany jako setki nazwanych funkcji na jednym
poziomie zagnieżdżenia wewnątrz jednego IIFE, plus dwa główne obiekty
stanu: `state` (dane) i `el` (referencje do elementów DOM, budowane
raz przez `$(id)` na starcie). Nie ma systemu modułów dla `app.js`
samego w sobie — pliki w `src/services/` i `src/components/` są
osobnymi, ładowanymi przez `<script>` skryptami komunikującymi się
przez `window.OMAP_*`, nie przez `import`/`export`.

**Pułapka, na którą już kilka razy trafiliśmy:** `app.js` wykonuje
się od góry do dołu synchronicznie przy starcie (m.in. woła
`updateUI()` bardzo wcześnie). Jeśli nowa stała (`const`/`let`)
zostanie zadeklarowana nisko w pliku, ale coś wywoływane przy starcie
się do niej odwołuje, JS rzuci `ReferenceError` i **wykonanie całego
skryptu się zatrzyma** — objaw: mapa się ładuje, ale żaden przycisk
nie reaguje. Nowe stałe używane przez coś, co mogłoby odpalić się
wcześnie, trzeba deklarować blisko góry pliku (patrz np.
`UNFILED_FOLDER`, `MEASURE_*`, `ROUTE_*` na samej górze).

## Struktura katalogów (rzeczywista)

```
index.html, app.js, style.css, config.js, sw.js   — deploy webowy (root),
                                                      serwowany bezpośrednio
www/                                                — kopia dla Capacitor
                                                      (Android/Electron),
                                                      generowana przez
                                                      tools/build-www.cjs
                                                      z plików w root
                                                      (NIE edytować ręcznie,
                                                      user ma własny skrypt)
src/services/       — logika bez UI: sync (Nostr), krypto, resolver
                       miejsc, kategorie, godziny otwarcia, zdjęcia,
                       adresy, stan URL
src/components/      — bottom-sheet, place-card, photo-gallery,
                       back-navigation, ui-foundation (patrz sekcja
                       "Place Engine" niżej - część z tego jest
                       nieużywana)
src/models/          — Place (model danych, część nieużywanej
                       architektury "2.0", patrz niżej)
search-v2/            — silnik wyszukiwania, wieloproviderowy
                       (patrz sekcja "Wyszukiwarka")
tools/                — ~40 skryptów .cjs: buildy, importy danych
                       (TERYT, named-poi, OSM), oraz testy
                       statyczno-analityczne sprawdzające obecność
                       określonych wzorców w kodzie (nie prawdziwe
                       testy jednostkowe/e2e - patrz zastrzeżenie
                       niżej)
android/, electron/  — natywne projekty (Capacitor)
```

## "Place Engine" / Architektura 2.0 — stan faktyczny (WAŻNE)

Istnieje udokumentowana (wcześniej przez inne AI) migracja do
jednego, scentralizowanego przepływu otwierania miejsca:

```
Wyszukiwarka / Historia / Ulubione / Odkrywaj / prawy przycisk
        ↓
PlaceResolver (src/services/place-resolver-service.js)
        ↓
PlaceService.open() (src/services/place-service.js)
        ↓
Panel informacji
```

**To rusztowanie istnieje w kodzie, ale nie jest aktywne.**
`window.OMAP_PLACE_SERVICE.open(...)` jest wołane z wielu miejsc
(`openFavoritePlace`, `openSearchPlaceThroughService`,
`openMapInformationThroughService` itd.) z poprawnymi etykietami
źródła (`source: "favorite"` itd.) — ale **nigdzie w całym projekcie
nie wywołuje się `OMAP_PLACE_SERVICE.configure()` ani `.on(...)`**.
Bez skonfigurowanego adaptera/listenera samo `.open()` tylko
rozwiązuje dane i emituje zdarzenie w próżnię — nic nie pokazuje się
w interfejsie.

Podobnie `window.OMAP_PLACE_CARD` (modularny renderer karty miejsca,
`src/components/place-card.js`) nigdy nie jest `configure()`owany —
`OMAP_PLACE_CARD.isConfigured()` zawsze zwraca `false`, więc appka
**zawsze** faktycznie renderuje przez `createPlaceCardLegacy()`
w `app.js` (funkcja jawnie nazwana "Legacy", czyli miała być
fallbackiem, a jest jedyną realnie działającą ścieżką).

**Praktyczny skutek:** jeśli trzeba pokazać panel miejsca z gotowych
danych (bez wyszukiwania w sieci, bez zgadywania reverse
geocodingiem — np. otwieranie miejsca z zapisanej wcześniej oceny),
**nie używaj `OMAP_PLACE_SERVICE.open()`** — nic nie zrobi. Użyj
`openKnownPlaceOnMap(place, lngLat)` (w `app.js`, przy okazji
funkcji ocen) — to jest potwierdzona, działająca ścieżka: ustawia
stan, marker, otwiera panel i woła `createPlaceCardLegacy()`
bezpośrednio.

Test `tools/test-architecture-2-final.cjs` sprawdza tylko, czy w
kodzie źródłowym WYSTĘPUJĄ odpowiednie stringi (`source: "favorite"`
itd.) i czy stare funkcje nie zawierają pewnych wzorców tekstowych —
**nie weryfikuje, że cokolwiek faktycznie działa end-to-end**. Jego
"PASS" nie jest dowodem, że ta architektura żyje. Jeden z jego
checków (`dead open fallbacks removed`) jest też kruchy — używa
regexa bez dopasowania nawiasów funkcji, więc może fałszywie
wywalać się przy dodaniu gdziekolwiek dalej w pliku niepowiązanego
tekstu `showPlaceInformation(`.

## Wyszukiwarka (search-v2/)

Wieloproviderowy silnik (`search-v2/providers/manager.js` orkiestruje):

- **nominatim.js** — publiczne API Nominatim (OSM), pełne dane
  (kategoria, adres, extratags z Wikipedią/stroną itd.)
- **photon.js** — alternatywne API (fallback/uzupełnienie)
- **local.js** (`search-v2/location/`) — wbudowana, lokalna baza
  polskich miast/dzielnic (`pl-locations.compiled.js`, ~21 700
  wpisów). **Nie przypisuje `osm_type`/`osm_id`** (poza dosłownie
  2 wpisami) — to źródło ma tylko nazwę/alias/współrzędne/typ, nic
  więcej. Jeśli trzeba dociągnąć pełne dane dla wyniku z tego
  źródła, jedyna opcja to reverse geocoding na sztywnym, dobranym
  poziomie zoom (patrz `fetchPlaceByReverseAtZoom` w `app.js`) albo
  zapisana wcześniej migawka danych (patrz sekcja "Oceny" niżej).
- **named-poi/** — kuratorowana baza charakterystycznych miejsc w
  Polsce (lotniska, muzea, zoo, stadiony itd., ~270 wpisów,
  `pl-named-poi.json`). **Też nie ma `osm_type`/`osm_id`** - ten sam
  problem co wyżej.
- **teryt/** — polski rejestr terytorialny (gminy/powiaty), osobny
  provider od `local.js`.

Ranking wyników: `search-v2/ranker.js` + `search-v2/ranking/*.js`
(waga marki, kategorii, nazwy, lokalizacji, "importance" z
Nominatim).

## Ulubione i Trasy

Scalone w **jedną, wspólną listę** (miejsca i trasy wymieszane,
rozróżnialne ikoną) w panelach Ulubione i Historia — to była
świadoma decyzja projektowa (wcześniej były osobne zakładki, okazały
się niewystarczająco spójne). Wspólne dla obu typów:
- wyszukiwanie, sortowanie (najnowsze/najstarsze/A-Z/Z-A - "najnowsze"
  opiera się na naturalnej kolejności tablicy, bo nowe wpisy zawsze
  idą przez `unshift`, nie na osobnym polu z datą)
- foldery (jedna pula folderów dla obu typów, drag & drop, edycja
  nazwy, przenoszenie)

Dane trzymane pod spodem nadal jako **dwie osobne tablice**
(`state.favorites` i `state.routeFavorites`) — scaliło się tylko
renderowanie/UI, nie model danych. To był świadomy wybór: mniejsze
ryzyko niż migracja formatu danych.

## Synchronizacja i konto (Nostr)

W pełni zdecentralizowana, bez własnego serwera/backendu. Fraza seed
(16 polskich słów) → klucz Web Crypto (szyfrowanie danych) + klucz
sekp256k1 (podpis Nostr), oba wyprowadzone lokalnie
(`src/services/sync-crypto-service.js`). Transport
(`src/services/sync-transport-service.js`) publikuje/pobiera dane
jako zdarzenia Nostr kind 30078 (NIP-78, "parameterized replaceable")
na 8 publicznych przekaźnikach naraz (`DEFAULT_RELAYS`).

Zakresy synchronizacji: ulubione (+foldery, +trasy), kolory/motyw,
własne nazwy miejsc, historia (+trasy). Auto-sync w tle co 5 minut.

## Publiczne oceny (gwiazdki)

Osobny mechanizm od prywatnej synchronizacji, ale też Nostr — osobny
`kind` (31555), też "parameterized replaceable" po kluczu miejsca
(`d` tag), ale odczyt **nie filtruje po autorze** (każdy widzi
średnią od wszystkich). Ocena 1-5 z połówkami. "Usunięcie" oceny to
publikacja nowego zdarzenia z wartością poza zakresem 1-5 (odrzucaną
przez filtrowanie), nie poleganie na tym, czy przekaźnik faktycznie
skasuje stare dane (NIP-09 bywa różnie respektowany).

**Ważne ograniczenie:** identyfikacja miejsca do agregacji ocen
używa `osm_type:osm_id` gdy dostępne, inaczej `lat,lon`. Miejsca z
`local.js`/`named-poi` (patrz wyżej) nie mają OSM id, więc przy
otwieraniu ocenionego miejsca z listy "Aktywność" appka **nie może**
dociągnąć pełnych danych precyzyjnym zapytaniem po ID — zamiast tego
przy ocenianiu zapisuje migawkę JSON dokładnie tych pól, których
używa `createPlaceCardLegacy` do renderowania (`place_json` tag),
żeby otwarcie z historii ocen nie wymagało żadnego zgadywania
reverse geocodingiem.

Cache odczytu ocen: 60s TTL, przy timeout (8s) **rzuca błąd, nie
zwraca cicho pustej listy** — kluczowe, bo cicha pusta lista przy
złym połączeniu wyglądałaby jak utrata danych (już się to zdarzyło).
Odczyt używa mniejszej puli przekaźników (4) niż zapis (8) - szybciej
na słabszym łączu, kosztem odrobiny redundancji przy samym czytaniu.

## Service Worker (sw.js)

Strategia "najpierw sieć" dla powłoki appki (`APP_SHELL_URLS`), z
`{ cache: "no-store" }` na `fetch()` — to jest konieczne, bo zwykły
`fetch()` bez tej opcji potrafi cicho oddać odpowiedź z własnego
cache HTTP przeglądarki (wg nagłówków `Cache-Control` hostingu),
więc "najpierw sieć" bez tego wcale nie gwarantuje świeżych danych.

**Cache-busting appki ma DWA niezależne mechanizmy, oba trzeba
pilnować przy każdej zmianie:**
1. `CACHE_VERSION` w `sw.js` (`shell-vNN-YYYYMMDD`)
2. `?v=...` w `<script src="app.js?v=...">` i
   `<link href="style.css?v=...">` w `index.html` — **to jest
   osobny, niezależny numer**, łatwo o nim zapomnieć przy edycji
   samego `app.js`/`style.css`. Pliki bez własnego `?v=` (np.
   `src/services/*.js`) polegają wyłącznie na (1).

## Znany dług techniczny (uczciwie, na bieżąco)

- Cała warstwa `OMAP_PLACE_SERVICE`/`OMAP_PLACE_CARD` — patrz wyżej,
  nieaktywna, ale wciąż w kodzie i wołana z wielu miejsc (nieszkodliwie,
  ale to martwy kod czekający na posprzątanie albo dokończenie)
- `style.css` ma ~600+ użyć `!important` — sporo z tego to warstwy
  nakładanych łatek ("UI Cleanup" itp.), część duplikuje wcześniejsze
  reguły tego samego selektora. Znalezione i naprawione:
  `.route-letter-marker` (potrójna definicja), `.menu-action`
  (podwójna) - reszta nieprzejrzana
- Brak prawdziwych testów jednostkowych/e2e dla `app.js` — cała
  weryfikacja w praktyce to `node --check` (sama składnia) + ręczne
  testowanie. Pliki w `tools/test-*.cjs` to głównie sprawdzanie
  obecności wzorców tekstowych w plikach, nie uruchamianie kodu
