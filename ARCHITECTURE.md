# Odwrotna Mapa — Architektura

*Ostatnia aktualizacja: 2026-08-06. Ten plik ma być prawdziwym opisem
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
                       adresy, stan URL, Odkrywaj (kategorie +
                       pobieranie, wyniesione z app.js 2026-08-06)
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

## "Place Engine" / Architektura 2.0 — stan faktyczny (poprawiony 2026-08-05)

*Ta sekcja wcześniej twierdziła, że cała ta warstwa jest martwa/
nieskonfigurowana. **To było błędne** — wynikało z wyszukiwania
`.configure(` (z kropką) zamiast `?.configure(` (z opcjonalnym
łańcuchowaniem), które faktycznie jest tu używane. Dwa różne teksty
dla grepa, to samo wywołanie dla silnika JS. Poniżej poprawiony,
zweryfikowany stan.*

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

**To rusztowanie JEST aktywne i realnie renderuje panel.**
`window.OMAP_PLACE_SERVICE?.configure({ async open(event) {...} })`
jest wołane w `app.js` (obok `closeFavoritesPanel`) z pełnym,
działającym handlerem - sprawdza `event.source`
(`favorite`/`discover`/`search`/`map-info` itd.) i w zależności od
niego woła `showSelectedPlaceInformation(place)` albo
`showPlaceInformation({lngLat, forceReverse})`, które faktycznie
pokazują panel. Używane m.in. do nawigacji "wstecz" między panelami
Odkrywaj/Trasa a miejscem (`returnFromRouteToPlace`,
`returnFromDiscoverToPlace`).

`window.OMAP_PLACE_CARD?.configure({ render: createPlaceCardLegacy })`
też jest wołane (w `app.js`, tuż przed `createPlaceCard`) - ale
skonfigurowane jako **cienki, funkcjonalnie przezroczysty
przekaźnik** do `createPlaceCardLegacy()`. W praktyce więc nie ma
znaczenia, czy coś woła `createPlaceCard()` (które deleguje do
`OMAP_PLACE_CARD.create()`, bo IS skonfigurowany) czy
`createPlaceCardLegacy()` bezpośrednio - wynik jest identyczny, bo
to ta sama funkcja. Nazwa "Legacy" jest więc myląca (sugeruje
przestarzały fallback), skoro to jedyna faktyczna implementacja,
tylko owinięta abstrakcją.

**Dla `openKnownPlaceOnMap` (funkcja z sekcji ocen) to bez zmian:**
`OMAP_PLACE_SERVICE.open()`, gdy nie ma pewnej tożsamości miejsca
(`hasExactIdentity` = false - dokładnie przypadek miejsc bez OSM
id, jak te z lokalnego indeksu miast czy named-poi), i tak wpada w
gałąź reverse geocodingu (`forceReverse: true`) - czyli dokładnie tę
niepewność, przed którą `openKnownPlaceOnMap` celowo chroni. Więc
mimo że `OMAP_PLACE_SERVICE` faktycznie działa, `openKnownPlaceOnMap`
nadal jest właściwym wyborem dla "pokaż dokładnie to, co już wiem,
bez zgadywania" - to nie było zmarnowaną pracą, tylko rozwiązaniem
innego, węższego problemu niż to co PlaceService w ogóle próbuje
rozwiązać.

Test `tools/test-architecture-2-final.cjs` sprawdza tylko, czy w
kodzie źródłowym WYSTĘPUJĄ odpowiednie stringi (`source: "favorite"`
itd.) i czy stare funkcje nie zawierają pewnych wzorców tekstowych -
w tym akurat przypadku to się zgadza z rzeczywistością (architektura
faktycznie żyje), ale to przypadek, nie zasługa testu - wciąż nie
weryfikuje niczego end-to-end, więc nie ufaj mu jako dowodowi w
przyszłości. Jeden z jego checków (`dead open fallbacks removed`)
jest też kruchy - używa regexa bez dopasowania nawiasów funkcji,
więc może fałszywie wywalać się przy dodaniu gdziekolwiek dalej w
pliku niepowiązanego tekstu `showPlaceInformation(`.

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

## Odkrywaj (src/services/discover-service.js)

Wyodrębnione z `app.js` (2026-08-06, ~1000 linii, pierwszy moduł
wyniesiony w ramach odbloatowania głównego pliku). Kategorie (87,
pogrupowane w 10 sekcji), pobieranie wyników, klasyfikacja i
renderowanie listy/przycisków panelu "Odkrywaj".

**Wzorzec ekstrakcji - ten sam co `OMAP_PLACE_SERVICE`:** moduł nie
ma własnego stanu. `app.js` woła
`window.OMAP_DISCOVER?.configure({ state, el, map, CONFIG, text,
getSearchResultTitle, scrollPanelToElement })` raz, przekazując
REFERENCJE do współdzielonych obiektów (nie kopie - mutacje w
`state`/`el` widoczne są więc od razu po obu stronach). Otwieranie
wybranego miejsca idzie przez `window.OMAP_PLACE_SERVICE.open(...)`,
które jest już globalne - nie wymagało żadnego dodatkowego
przekazywania.

Większość kategorii szuka po nazwie przez Nominatim (`queries: [...]`)
- działa dobrze dla nazwanych miejsc (restauracje, apteki), słabo
dla infrastruktury bez sensownej nazwy w OSM (butelkomaty, prysznice
publiczne, źródełka wody, paczkomaty, sklepy convenience jak Żabka -
w OSM `shop=convenience`, różne od `shop=supermarket`). Te kategorie
mają dodatkowo `overpassTags: [[["klucz","wartość"]]]` i przy
zapytaniu idą przez Overpass (dokładne dopasowanie po tagu OSM w
bieżącym widoku mapy), nie przez tekstowe wyszukiwanie Nominatim.

**Pułapka złapana przy ekstrakcji, warta zapamiętania:** oryginalny
kod miał `renderDiscoverCategoryButtons()` wołane na poziomie modułu
(od razu przy starcie skryptu). Po prostym przeniesieniu do nowego
pliku to wywołanie odpaliłoby się PRZED tym, jak `app.js` zdążyłby
w ogóle wywołać `configure()` - `ctx` byłby wtedy `null`, natychmiastowy
crash. Każda ekstrakcja modułu musi jawnie sprawdzić, czy przenoszony
kod ma podobne auto-wywołania na poziomie modułu, i przenieść je na
jawne wywołanie z `app.js` PO `configure()`, w tym samym miejscu w
kolejności inicjalizacji co oryginał.

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

- `style.css` miało ~623 użycia `!important` na początku sesji
  sprzątania (2026-08-05). Po przejściu przez wszystkie znalezione
  dokładne duplikaty selektorów (26 kandydatów, zweryfikowane ręcznie
  jeden po drugim) i kilka subtelnych "cichych" konfliktów (różne
  wartości tej samej właściwości bez `!important` po żadnej stronie,
  gdzie wygrywała czysta kolejność w pliku) zostało **551**.
  Przy okazji usunięto też dwa kawałki w pełni martwego kodu (stara
  pinezka typu "łezka", `.brand-mark`) - zero wystąpień w HTML/JS,
  nie tylko duplikat.

  **Świadomie zatrzymano się na tym poziomie** - metoda użyta do
  wykrywania (dokładne duplikaty tej samej grupy selektorów) łapie
  tylko jeden konkretny wzorzec błędu. Nie łapie konfliktów między
  RÓŻNYMI selektorami trafiającymi w ten sam element - to wymagałoby
  prawdziwego dopasowywania specyficzności CSS, nie porównywania
  tekstu, i próba heurystycznego wykrycia tego dała głównie fałszywe
  trafienia. Reszta `!important`
  prawdopodobnie w większości jest legalna/potrzebna (warianty w
  media queries, pokonywanie specyficzności), ale nie została
  zweryfikowana jedna po drugiej - to świadoma decyzja "działa, więc
  nie ruszać dalej bez konkretnego powodu", nie porzucone zadanie.
  Jeśli coś kiedyś znowu wygląda inaczej niż powinno po zmianie w
  CSS, to pierwsze miejsce do podejrzeń.
- **`npm run release:check` (35 skryptów w `tools/test-*.cjs`) w
  obecnym stanie NIE jest wiarygodnym miernikiem** (sprawdzone
  2026-08-05, uruchomione pojedynczo z pominięciem `&&`, żeby
  zobaczyć wszystkie wyniki naraz, nie tylko pierwszy fail):
  - `test-search.cjs` ma sztywny próg 10ms na średni czas
    parsowania - w praktyce wynik skacze 7,9-11ms między
    uruchomieniami na tym samym kodzie (potwierdzone: 4 uruchomienia
    pod rząd, różne wyniki). To test wydajności zależny od
    obciążenia maszyny, nie test poprawności - fałszywie
    czerwony/zielony losowo.
  - `test-architecture-2-final.cjs` i
    `test-place-engine-complete-migration.cjs` sprawdzają dosłownie
    obecność frazy "Zakończenie migracji Place Engine" / "stan
    końcowy" w tym pliku. Odkąd ten opis jest uczciwy (patrz sekcja
    "Place Engine" wyżej), pierwszy z nich celowo pokazuje FAIL - to
    potwierdzenie, że dokumentacja już nie kłamie, nie regresja.
    Drugi (`test-place-engine-complete-migration.cjs`) akurat
    przechodzi, ale z niewłaściwego powodu: ten akapit, który właśnie
    czytasz, opisuje szukaną przez niego frazę wprost, więc
    przypadkiem zawiera dokładnie to, czego szuka - nieświadomy
    dowód, jak zawodne jest to podejście do testowania w obie strony.
  - **Pozostałe 9 testów (~20 pojedynczych sprawdzeń) zweryfikowane
    JEDNO PO DRUGIM (2026-08-05) - wszystkie potwierdzone jako
    fałszywe alarmy, żaden nie łapie realnej regresji:**
    `test-search-session` (regex wycinający blok w ogóle się nie
    dopasowuje - nowa funkcja wstawiona między starymi granicami),
    `test-stale-moveend-callbacks` (jedno sprawdzenie szuka
    świadomie zastąpionego starego schematu URL `?place=`, drugie to
    regex bez granic łapiący dwa niepowiązane fragmenty pliku razem),
    `test-global-named-poi-guard` + `test-place-panel-back-fix`
    (`invalidateNamedPoiGuard()` nadal wołane w `closePlacePanel()`,
    tylko jako 4. linijka nie 1., odkąd doszło czyszczenie URL),
    `test-unified-mobile-panel-standard` +
    `test-legend-about-mobile-standard` (świadoma konsolidacja -
    WSZYSTKIE panele dolnych arkuszy współdzielą jedną zmienną CSS
    `--sheet-height` zamiast osobnej per panel), `test-route-b-panel-open`
    + `test-mobile-panel-replacement` + `test-route-b-persistent-menu-height`
    (mechanizm różnicujący rozwijanie panelu trasy wg stage'u A/B
    kliknięcia został zastąpiony prostszym, potwierdzonym z
    użytkownikiem jako zamierzone: panel ZAWSZE rozwija się i
    przewija do statystyk po wyznaczeniu trasy, niezależnie który
    punkt był klikany).

    **Wniosek: w obecnej formie ten zestaw testów nie wykrył ani
    jednej prawdziwej regresji na 12 failach - same fałszywe alarmy
    z powodu sprawdzania dokładnego kształtu starego kodu zamiast
    zachowania. Nie jest wart utrzymywania w obecnej formie; albo
    przepisać na sprawdzanie zachowania (uruchamianie kodu, nie
    dopasowywanie tekstu), albo świadomie zarchiwizować/oznaczyć
    jako nieaktualne, żeby nie mylić przyszłych sesji fałszywymi
    czerwonymi wynikami.**
- Brak prawdziwych testów jednostkowych/e2e dla `app.js` — cała
  weryfikacja w praktyce to `node --check` (sama składnia) + ręczne
  testowanie. Pliki w `tools/test-*.cjs` to głównie sprawdzanie
  obecności wzorców tekstowych w plikach, nie uruchamianie kodu
