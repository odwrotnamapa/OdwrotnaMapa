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
                       adresy, stan URL, Odkrywaj, oceny miejsc,
                       odjazdy transportu publicznego, podsumowanie
                       z Wikipedii, pomiar odległości/powierzchni,
                       streetview/Mapillary, kontrolki widoku mapy,
                       niedziele handlowe, linki geo:, eksport/import
                       ustawień, silnik dolnych paneli, ulubione,
                       trwałość historii tras, własne nazwy miejsc,
                       przechowywanie tekstur/czcionki, słowa-klucz
                       konta, historia, historia wyszukiwań,
                       widoczność etykiet, edytor niestandardowego
                       motywu (paleta+czcionka+tekstury scalone w
                       jeden plik), konto i synchronizacja, trasy -
                       ostatnie dwadzieścia trzy wyniesione z app.js
                       2026-08-06
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

## Oceny (src/services/ratings-service.js)

Drugi moduł wyniesiony z `app.js` (2026-08-06, ~200 linii). Publiczne
oceny miejsc przez Nostr (kind 31555) - gwiazdki (pół-gwiazdki, 1-5
co 0.5), podgląd na hover, zapis/usuwanie. Ten sam wzorzec
`configure()` co `discover-service.js`. Zależności dużo mniejsze niż
przy Odkrywaj - tylko `state.language`, `text`, i dwie funkcje z
`app.js` (`getStoredSeedWords`, `openAccountFromMenu`). Zapis/odczyt
ocen idzie przez już globalne `window.OMAP_SYNC_CRYPTO`/
`window.OMAP_SYNC_TRANSPORT` - bez dodatkowego przekazywania.

Na zewnątrz wystawione tylko dwie funkcje faktycznie wołane z
`app.js` (`window.OMAP_RATINGS.createSection`/`.loadForPlace`) -
reszta (malowanie gwiazdek, zapis/usuwanie pojedynczej oceny) to
wewnętrzne szczegóły modułu, nigdy wołane z zewnątrz.

**Przy tej ekstrakcji dodatkowo zweryfikowano** (nauczka z Odkrywaj),
że obie zewnętrzne funkcje (`getStoredSeedWords`/`openAccountFromMenu`)
to zwykłe deklaracje `function nazwa() {}` (w pełni hoistowane) - nie
`const nazwa = () => {}` (nie hoistowane). Gdyby były tym drugim,
wołanie `configure()` w miejscu wcześniejszym w pliku niż ich
deklaracja skończyłoby się `ReferenceError` przez temporal dead zone
- dokładnie ten sam wzorzec błędu co w `DIAGNOSTYKA.txt` (pkt 1).
Przy każdej kolejnej ekstrakcji: sprawdzić to PRZED, nie PO wysyłce.

## Odjazdy transportu publicznego (src/services/departures-service.js)

Trzeci moduł wyniesiony z `app.js` (2026-08-06, ~350 linii).
Rozpoznawanie czy miejsce jest przystankiem, pobieranie rozkładu
odjazdów, formatowanie czasu/kolorów linii transportowych w karcie
miejsca. Ten sam wzorzec `configure()` co pozostałe dwa moduły.
Zależności: `state.language`, `text`, `CONFIG.transit.*`, i jedna
funkcja z `app.js` (`openTripDetails`, wywoływana przy kliknięciu
konkretnego odjazdu).

Wszystkie wywołania `configure()` (`OMAP_RATINGS`, `OMAP_MEASURE`,
`OMAP_WIKIPEDIA`, `OMAP_DEPARTURES`, `OMAP_DISCOVER`) są świadomie
skonsolidowane w jednym miejscu w `app.js` - **zaraz po utworzeniu
instancji mapy, PRZED pierwszym wywołaniem `updateUI()`** (nie na
końcu pliku, gdzie fizycznie leżał wycięty kod przy pierwszych
dwóch ekstrakcjach - to była poprawiona pomyłka, patrz
`DIAGNOSTYKA.txt` pkt 11). `updateUI()` wywołuje funkcje z tych
modułów już przy starcie appki, więc `configure()` musi wykonać się
wcześniej - to nie jest kwestia hoistingu (który dotyczy deklaracji,
nie wywołań), tylko zwykłej kolejności wykonania kodu.

## Podsumowanie z Wikipedii (src/services/wikipedia-service.js)

Czwarty moduł wyniesiony z `app.js` (2026-08-06, ~190 linii).
Rozpoznawanie właściwego artykułu Wikipedii po tagu wikipedia/
wikidata z OSM, pobieranie skrótu, renderowanie w karcie miejsca.
Zależności: `state.language`, `text`, i jedna funkcja z `app.js`
(`capitalizeFirstLetter` - ogólny helper, nie tylko dla Wikipedii,
stąd zostaje w `app.js` i jest wstrzykiwany, nie kopiowany).

**Warta odnotowania granica klastra**: `resolveWikipediaTarget` (część
tego modułu) leżała fizycznie PRZED `createWikipediaSection`, po
drugiej stronie niezwiązanej funkcji `cacheWikipediaForFavorite`
(ta ZOSTAJE w `app.js` - łączy Ulubione z Wikipedią, więc nie pasuje
czysto do żadnego z dwóch modułów). Trzeba było czytać kod PRZED
i PO domniemanej granicy, nie ufać samej fizycznej bliskości nazw
funkcji - fizyczne sąsiedztwo w pliku nie zawsze pokrywa się z
przynależnością do tej samej funkcji appki.

## Pomiar odległości/powierzchni (src/services/measure-service.js)

Piąty moduł wyniesiony z `app.js` (2026-08-06, ~350 linii).
Planimeter: dwa tryby (linia punktów / wielokąt), własne warstwy
MapLibre, formatowanie wyniku. Zależności: `state`, `el`, `map`,
`text`, dwie funkcje z `app.js` (`getAccentColor`,
`closeOtherMobilePanels`).

**Dwie funkcje (`toggle`, `switchMode`) są w `app.js` podpięte jako
REFERENCJE do `addEventListener`, nie wołane wprost przez nawiasy**
- trzeba było sprawdzić to osobno (samo szukanie `nazwaFunkcji(`
tego nie znajduje, bo przy przekazywaniu jako referencja nie ma
nawiasów wywołania). Przy każdej kolejnej ekstrakcji: sprawdzić
KAŻDĄ wyeksportowaną funkcję dwa razy - raz szukając wywołań z
nawiasami, raz szukając samej nazwy bez wymogu nawiasu zaraz po niej
(żeby złapać `addEventListener("click", nazwaFunkcji)` bez strzałki).

**`map` używane w tym klastrze bardzo intensywnie (24x) w dwóch
znaczeniach naraz** (`map.addSource(...)` - instancja MapLibre,
`points.map(p => ...)` - metoda tablicy) - każde wystąpienie
zweryfikowane osobno przed podmianą, zero pomyłek tym razem.

**Po wysyłce wyszły jeszcze dwa problemy** (oba udokumentowane
szczegółowo w `DIAGNOSTYKA.txt`, pkt 9-12): brak `?.` przy
wywołaniach modułu w `app.js` (wywalało to CAŁY skrypt, nie tylko tę
funkcję - naprawione we wszystkich pięciu modułach naraz), i siedem
stałych ID warstw MapLibre pominiętych przy skanowaniu zależności
(skaner szukał tylko wywołań funkcji i dostępu do obiektów, nie
gołych stałych używanych jako argumenty). Obie lekcje zastosowane
w checkliście poniżej i przy kolejnych ekstrakcjach.

## Streetview / pokrycie Mapillary (src/services/streetview-service.js)

Szósty moduł wyniesiony z `app.js` (2026-08-06, ~210 linii).
Warstwa pokrycia Mapillary na mapie, panel przeglądarki streetview,
tryb pełnoekranowy. Zależności: `state`, `el`, `map`, `CONFIG`,
`text`, cztery funkcje z `app.js` (`closeOtherMobilePanels`,
`getMobilePanelMaximumHeight`, `isMobilePanelViewport`,
`setMobilePanelHeight`).

Pierwsza ekstrakcja z pełnym zastosowaniem checklisty wypracowanej
przy Pomiarze: (1) sprawdzenie GOŁYCH użyć każdej współdzielonej
zmiennej, nie tylko z kropką/nawiasem, (2) sprawdzenie WSZYSTKICH
identyfikatorów WIELKIMI LITERAMI pod kątem brakujących stałych,
(3) sprawdzenie każdej eksportowanej funkcji DWA razy - wywołanie
z nawiasem i goła referencja (addEventListener), (4) `configure()`
umieszczone od razu we wczesnym, wspólnym miejscu (przed pierwszym
`updateUI()`), nie tam gdzie fizycznie leżał wycięty kod. Zero
problemów po wysyłce.

Znaleziono jeden listener na poziomie modułu
(`document.addEventListener("fullscreenchange", ...)`) - bezpieczny
(odpala się tylko przy realnej, użytkownikiem wywołanej zmianie
pełnego ekranu, nie automatycznie przy starcie), ale dodano mu
mimo to jawne sprawdzenie `if (!ctx) return;` na wszelki wypadek -
tania, dodatkowa warstwa bezpieczeństwa bez kosztu.

## Kontrolki widoku mapy (src/services/mapview-service.js)

Siódmy moduł wyniesiony z `app.js` (2026-08-06, ~250 linii). Tryb
3D, lokalizacja użytkownika (GPS + fallback po IP), eksport widoku
do PNG, reset widoku mapy. Zależności: `state`, `el`, `map`, `text`,
jedenaście funkcji z `app.js`.

**Złapano tu wzorzec błędu, którego wcześniejsze ekstrakcje nie
miały**: `map` używane nie tylko z kropką (`map.resize()`), ale też
jako GOŁE sprawdzenie prawdziwości (`if (map && typeof map.resize
=== "function")`). Standardowy wzorzec podmiany `\bmap\.` →
`ctx.map.` by to przeoczył (nie ma kropki zaraz po "map" w tym
konkretnym miejscu). Naprawiono przez szerszy wzorzec
`(?<!\.)\bmap\b` → `ctx.map` (każde "map" NIE poprzedzone kropką,
żeby nie ruszać `.map()` na tablicach), zamiast wąskiego
`\bmap\.` - to bezpieczniejszy domyślny wzorzec na przyszłość,
warty stosowania od razu przy każdej kolejnej ekstrakcji zamiast
tylko dla `map`.

## Niedziele handlowe w Polsce (src/services/trading-sunday-service.js)

Ósmy moduł wyniesiony z `app.js` (2026-08-06, ~130 linii). Pierwsza
ekstrakcja łącząca DWA nieprzylegające fragmenty pliku w jeden
moduł: czysta logika dat (`calculateEasterSunday`,
`lastSundayOfMonth`, `getTradingSundaysForYear`,
`isTodayTradingSundayPL` - zero zależności od stanu appki, same
obliczenia na `Date`) leżała ~2000 linii dalej niż panel UI
(`updateTradingSundayAnswer`, `openTradingSundayFromMenu`,
`closeTradingSunday`, `returnFromTradingSundayToMenu`). Oba
fragmenty wycięte osobno, sklejone w jednym pliku.

**Ten moduł jest jednym z tych, których faktycznie woła
`updateUI()`** (`window.OMAP_TRADING_SUNDAY?.updateAnswer()`) - czyli
dokładnie ten scenariusz, który wcześniej (przy Pomiarze) wywalił
całą appkę, bo `configure()` siedziało za późno w pliku. Tym razem
`configure()` był od razu we właściwym, wczesnym miejscu - zero
problemów po wysyłce, potwierdzenie że wypracowany wzorzec faktycznie
działa.

## Linki geo: (src/services/geouri-service.js)

Dziewiąty moduł wyniesiony z `app.js` (2026-08-06, ~50 linii) -
najmniejszy dotąd. Obsługa linków `geo:` (RFC 5870) z zewnątrz
appki - Capacitor `appUrlOpen` na mobile, plus `window.omapHandleGeoUri`
wystawione dla mostu natywnego. Zależności: `map`, dwie funkcje z
`app.js` (`parseSharedPoint`, `showPlaceInformation`).

Wołane z asynchronicznego `map.on("load", ...)` - jak Niedziele
handlowe, ale tym razem samo WYWOŁANIE (nie tylko rejestracja
listenera) siedzi wewnątrz callbacku, więc odpala się dopiero gdy
mapa faktycznie się załaduje, długo po tym jak `configure()` już
dawno się wykonał. Bezpieczne z tego samego powodu co zawsze:
JavaScript gwarantuje że cały synchroniczny kod (łącznie z blokiem
`configure()`) kończy się PRZED jakimkolwiek zdarzeniem
asynchronicznym, niezależnie jak szybko sieć by odpowiedziała.

## Eksport/import ustawień (src/services/backup-service.js)

Dziesiąty moduł wyniesiony z `app.js` (2026-08-06, ~330 linii).
Zapis/odczyt wszystkich ustawień appki jako jeden plik JSON
(ulubione, trasy, foldery, niestandardowe nazwy miejsc, paleta
kolorów, czcionka, tekstury motywu "custom"). Dotąd **najwięcej
zależności** ze wszystkich wyniesionych modułów: 15 funkcji + 3
stałe (`DEFAULT_CUSTOM_PALETTE`, `MAP_TEXTURE_KEYS`,
`TEXTURE_FIELDS`) - naturalna konsekwencja tego, że eksport/import
z definicji dotyka niemal każdego podsystemu appki naraz.

Te trzy stałe są przekazywane przez `configure()` jako WARTOŚCI
(nie zduplikowane jak identyfikatory warstw w Pomiarze) - bo są
używane też gdzie indziej w systemie motywów, więc duplikacja
tworzyłaby ryzyko rozjazdu przy przyszłych zmianach kolorów
domyślnych czy pól tekstur. Zasada wyboru: proste, w pełni statyczne
wartości bez ryzyka zmiany (jak ID warstw MapLibre) - duplikować;
wartości używane w wielu miejscach, które mogłyby się kiedyś zmienić
- przekazywać przez `configure()`.

**Po wysyłce wyszła jedna brakująca zależność**: `show` (funkcja
komunikatów na dole ekranu) była na wygenerowanej liście kandydatów,
ale umknęła przy RĘCZNYM przechodzeniu przez ~45-pozycyjną listę -
szczegóły w `DIAGNOSTYKA.txt` pkt 13. Naprawione, ale to pokazało że
przy długich listach zależności trzeba systematycznego, dwuetapowego
sprawdzenia, nie jednorazowego przejrzenia wzrokiem.

## Silnik dolnych paneli (src/services/bottom-sheet-service.js)

Jedenasty moduł wyniesiony z `app.js` (2026-08-06, ~270 linii).
Generyczny mechanizm przeciągania/zwijania dolnego panelu (bottom
sheet) na telefonie - wspólny silnik używany przez WSZYSTKIE 14
paneli appki (trasa, odkrywaj, menu, ulubione, historia, miejsce,
trasa-info, streetview, legenda, etykiety, niedziele handlowe,
o appce, backup, konto).

**Same 14 cienkich wrapperów (`initializeRouteBottomSheet` itd.)
ZOSTAŁY w `app.js`** - są zbyt małe (6-7 linii każdy) i zbyt mocno
powiązane z konkretnymi panelami (funkcja "close" każdego z nich),
żeby opłacało się je przenosić. Wyniesiony jest tylko sam, generyczny
silnik (`initializeBottomSheet`), przyjmujący panel/uchwyt/funkcję
zamknięcia jako parametry - stąd zero zależności od `state`/`el`/
`map`/`CONFIG`/`text` bezpośrednio, tylko od sześciu współdzielonych
funkcji pomocniczych (`openMobilePanelStandard` i pokrewne), które
też ZOSTAJĄ w `app.js` (`openMobilePanelStandard` samo w sobie ma
30+ wywołań w całym pliku, daleko poza tym modułem).

**Złapano tu kolejny przypadek stałej TDZ** (jak `lastResolvedTheme`/
`darkModeProbe` przy Pomiarze): `MOBILE_PANEL_STANDARD` (`const`)
była zadeklarowana w oryginalnym miejscu w środku pliku - dużo
później niż wczesny, skonsolidowany blok `configure()`. Przeniesiona
do tej samej, wczesnej sekcji co pozostałe podobne stałe, PRZED
dodaniem jej do `configure()` - złapane i naprawione przed wysyłką,
nie po.

## Ulubione (src/services/favorites-service.js)

Dwunasty moduł wyniesiony z `app.js` (2026-08-06, ~920 linii) -
**dotąd największy i najbardziej złożony**. Lista ulubionych (miejsca
+ trasy scalone w jedną, wspólną listę - patrz sekcja "Ulubione i
Trasy" niżej), foldery, przeciąganie między folderami, panel UI.
20 wyeksportowanych funkcji, 17 zależności funkcyjnych + 2 stałe.

**Fragmenty leżały rozrzucone w SIEDMIU różnych miejscach pliku**
(nie dwóch jak przy Niedzielach handlowych) - trzeba było wyciąć
i skleić siedem osobnych kawałków, każdy zweryfikowany osobno pod
kątem równowagi nawiasów przed połączeniem.

**Krytyczne znalezisko przy analizie granic**: centralny mechanizm
otwierania miejsc w całej appce (`window.OMAP_PLACE_SERVICE.configure`,
opisany wcześniej w sekcji Architektura 2.0) leżał FIZYCZNIE wewnątrz
tego samego obszaru pliku co Ulubione - między `closeFavoritesPanel`
a `openFavoritePlace`. To NIE jest funkcja Ulubionych - obsługuje
otwieranie miejsc z Odkrywaj, Historii, Wyszukiwarki i informacji o
mapie, nie tylko z ulubionych. Świadomie WYCIĘTY z zakresu tej
ekstrakcji (linie 10180-10296 w oryginalnym pliku) i zostawiony w
`app.js` nietknięty - przeniesienie złamałoby otwieranie miejsc z
WSZYSTKICH innych źródeł, nie tylko z ulubionych.

**`getFavoriteKey` wyeksportowane, `getPlaceNameKey` NIE** - obie
funkcje są blisko związane (druga ma pierwszą jako fallback), ale
`getPlaceNameKey` (niestandardowe nazywanie miejsc) jest osobną
funkcją używaną też poza kontekstem ulubionych, więc zostaje w
`app.js` - jej wewnętrzny fallback teraz woła
`window.OMAP_FAVORITES?.getFavoriteKey(...)`.

**Dwuetapowy `configure()` - nowy wzorzec, pierwszy raz potrzebny**:
`readFavorites`/`readFavoriteFolders` są wołane WEWNĄTRZ konstrukcji
samego obiektu `state` (`favorites: window.OMAP_FAVORITES.readFavorites()`
jako wartość pola przy tworzeniu `state`) - czyli zanim `state` w
ogóle istnieje, więc zanim mógłby posłużyć jako zależność w
standardowym, pełnym `configure()`. Rozwiązanie: MINIMALNY,
bardzo wczesny `configure({ CONFIG })` tuż przed `const state = {`
(te dwie funkcje potrzebują tylko `CONFIG.storageKeys`, nie
`state`/`el`/`text`), a PEŁNY `configure()` ze wszystkimi 17
zależnościami dalej w pliku, w tym samym miejscu co pozostałe
moduły, przed pierwszym `updateUI()` (`updateUI()` też woła
`renderFolderChips`/`renderFavoritesList` z tego modułu).

**Dwa już wysłane moduły zaktualizowane w tej samej turze**:
`backup-service.js`'s `configure()` w `app.js` (właściwości
`saveFavorites`/`renderFavoritesList`/`renderFolderChips`/
`saveFavoriteFolders`) teraz wskazują na `window.OMAP_FAVORITES?.X`
zamiast bezpośrednio na funkcje w `app.js`, bo te funkcje się
przeniosły. To pierwsza ekstrakcja w tej sesji wymagająca dotknięcia
konfiguracji innego, już wysłanego modułu.

## Trwałość historii/ulubionych tras (src/services/route-history-service.js)

Trzynasty moduł wyniesiony z `app.js` (2026-08-06, ~100 linii) -
mały, celowo zawężony wycinek dużo większego systemu Tras (59
funkcji łącznie w `app.js`, od obliczania po rysowanie na mapie -
zbyt duży i zbyt spleciony, żeby wyciąć w całości). Tu tylko
trwałość: zapis/odczyt historii i ulubionych tras w `localStorage`,
budowanie klucza trasy, dopisywanie wpisu do historii.

Ten sam dwuetapowy `configure()` co przy Ulubionych -
`readRouteHistory`/`readRouteFavorites` też są wołane wewnątrz
konstrukcji `state`. Dodatkowo: `saveRouteFavorites` jest już
zależnością DWÓCH innych modułów (`favorites-service.js` i
`backup-service.js`) - obie ich konfiguracje w `app.js`
zaktualizowane, żeby wskazywały na `window.OMAP_ROUTE_HISTORY?.saveRouteFavorites`.

## Własne nazwy miejsc (src/services/custom-place-names-service.js)

Czternasty moduł wyniesiony z `app.js` (2026-08-06, ~75 linii) - mały,
odizolowany. Ręcznie wpisane własne nazwy dla dowolnego miejsca na
mapie (osobne od `favorite.customName`, które dotyczy tylko
zapisanych ulubionych). Ten sam dwuetapowy `configure()` co przy
Ulubionych/Historii Tras (`readCustomPlaceNames` wołane wewnątrz
konstrukcji `state`). Jedyna zależność funkcyjna: `safeSet`.

## Przechowywanie tekstur/czcionki - IndexedDB (src/services/texture-storage-service.js)

Piętnasty moduł wyniesiony z `app.js` (2026-08-06, ~150 linii) -
**pierwszy w pełni samodzielny, bez `configure()`/`ctx` w ogóle**.
Czysta warstwa przechowywania IndexedDB dla tekstur motywu "custom"
i własnej czcionki (`idbGetAllTextures`, `idbSetTexture`,
`idbDeleteTexture`, `idbGetCustomFont`, `idbSetCustomFont`,
`idbDeleteCustomFont`, `textureImageId`) - zero zależności od
`state`/`el`/`map`/`CONFIG`/`text`, tylko wbudowane API IndexedDB.

Stałe (nazwa/wersja bazy, nazwy magazynów) są proste, statyczne
wartości bez ryzyka zmiany - zduplikowane w module (jak identyfikatory
warstw MapLibre w Pomiarze), NIE przekazywane przez `configure()`.
Po przeniesieniu ich jedynych użytkowników okazały się w `app.js`
całkowicie martwe (żadne inne miejsce ich nie używało) - usunięte.

Świadomie NIE zawiera logiki aplikacyjnej (rejestrowanie `@font-face`,
stosowanie tekstur na warstwach mapy, odczyt/zapis wyboru z
`localStorage`) - to zostaje w `app.js`, bo dotyka `state`/warstw
mapy i jest dużo ściślej spleciony z resztą appki.

## Słowa-klucz konta (src/services/seed-words-service.js)

Szesnasty moduł wyniesiony z `app.js` (2026-08-06, ~70 linii) - mały,
celowo zawężony wycinek systemu konta/synchronizacji (79 funkcji
łącznie - zdecydowanie zbyt duży, żeby wyciąć w całości). Zapis/
odczyt/usuwanie seed-frazy z `localStorage`, renderowanie siatki
słów, kopiowanie do schowka.

`showAccountMessage`/`clearAccountMessage` (27 wywołań w całym pliku
- ogólne narzędzie komunikatów konta) świadomie ZOSTAŁY w `app.js`,
mimo że fizycznie leżały pośrodku tego samego obszaru - zbyt szeroko
używane, żeby przenosić razem z węższą funkcją słów-klucza.

`getStoredSeedWords` była już zależnością `ratings-service.js` -
jego `configure()` w `app.js` zaktualizowany, żeby wskazywał na
`window.OMAP_SEED_WORDS?.getStoredSeedWords`.

## Historia (src/services/history-service.js)

Siedemnasty moduł wyniesiony z `app.js` (2026-08-06, ~230 linii) -
lista ostatnio oglądanych miejsc i tras (scalona w jedną listę, jak
przy Ulubionych), zapis/odczyt `localStorage`, otwieranie wpisu z
historii.

**Ten sam wbudowany `OMAP_PLACE_SERVICE.configure()` co przy
Ulubionych** - fizycznie leżał tuż za `renderHistoryList`, ponownie
świadomie wycięty z zakresu i zostawiony nietknięty w `app.js`.
Dwuetapowy `configure()` - `readHistory` wołane wewnątrz konstrukcji
`state`. `renderHistoryList` była już zależnością
`route-history-service.js` - jego `configure()` w `app.js`
zaktualizowany, żeby wskazywał na `window.OMAP_HISTORY?.renderHistoryList`.

## Historia wyszukiwań (src/services/search-history-service.js)

Osiemnasty moduł wyniesiony z `app.js` (2026-08-06, ~80 linii) - mały,
odizolowany. Osobna od Historii oglądanych miejsc/tras (opisanej
wyżej) - ostatnie 8 zapytań wpisanych w wyszukiwarkę, zapis/odczyt/
usuwanie z `localStorage`. Jedyna zależność funkcyjna:
`normalizeSearchText` (zostaje w `app.js`, szeroko używana też przez
inne moduły).

## Widoczność etykiet (src/services/label-visibility-service.js)

Dziewiętnasty moduł wyniesiony z `app.js` (2026-08-06, ~170 linii) -
widoczność grup etykiet na mapie (POI, drogi, miejsca, woda, regiony,
kraje, lotniska, granice): zapis/odczyt `localStorage`, stosowanie
widoczności warstw MapLibre, checkboxy w panelu Etykiety.

Trzy stałe (klucz `localStorage`, domyślna widoczność, mapa grup na
konkretne ID warstw MapLibre) zduplikowane w module - proste,
statyczne, używane tylko wewnątrz tego obszaru.

**Własny błąd złapany PRZED wysyłką**: przy pierwszym składaniu pliku
zawartość `LABEL_LAYER_GROUPS` (lista ID warstw MapLibre per grupa)
została przypadkiem ODTWORZONA Z PAMIĘCI zamiast skopiowana z
oryginału - różniła się od prawdziwej zawartości w `app.js`. Złapane
przy rutynowej weryfikacji (nawyk z tej sesji: nigdy nie ufać
"powinno wyglądać podobnie" dla danych kopiowanych między plikami),
poprawione przez wzięcie dokładnego fragmentu źródłowego i
potwierdzone `diff`-em jako bajt-w-bajt identyczne z `app.js` przed
wysyłką. Lekcja: przy KAŻDYM duplikowaniu stałych (nie tylko prostych
jak w Pomiarze/Eksporcie, ale też większych obiektów/tablic), brać
fragment BEZPOŚREDNIO z `sed`/`view` źródła, nigdy nie pisać
zawartości "z pamięci" nawet jeśli wygląda znajomo.

`initializeLabelVisibilityToggles()` była wołana jako pojedyncze,
samodzielne wywołanie na poziomie pliku (nie wewnątrz innej funkcji)
- zaktualizowane w miejscu na
`window.OMAP_LABEL_VISIBILITY?.initializeToggles()`, bezpieczne bo
skonsolidowany `configure()` siedzi wcześniej w pliku.

## Edytor niestandardowego motywu (src/services/custom-theme-editor-service.js)

Dwudziesty pierwszy moduł wyniesiony z `app.js` (2026-08-06, ~245
linii) - edytor niestandardowego motywu "custom": paleta kolorów,
czcionka, tekstury. Trzy sekcje formularza w JEDNYM module - zapis/
odczyt `localStorage`, pola formularza, obsługa uploadu plików,
przycisk resetu (który dotyka wszystkich trzech naraz). Świadomie
NIE zawiera stosowania palety/czcionki/tekstur NA MAPIE
(`applyCustomPalette`, `applyDarkPalette`, `applyCustomUiColors`,
`applyCustomFont`, `applyTheme`, `registerTextureImage`) - to
zostaje w `app.js`, znacznie bardziej splecione z systemem motywu i
renderowaniem warstw MapLibre.

**Historia tej ekstrakcji - warta zapisania jako lekcja o granicach
modułów**: pierwsza wersja była DWOMA osobnymi plikami
(`palette-editor-service.js` osobno, `font-texture-editor-service.js`
łączący Czcionkę+Teksturę). Użytkownik słusznie zauważył, że ten
podział był niespójny - albo wszystkie trzy sekcje są "niezależne"
(więc powinny być trzema osobnymi plikami), albo są wystarczająco
powiązane żeby połączyć (więc powinny być jednym). Fakt że fizycznie
sąsiadowały w `app.js` i przycisk resetu Palety dotyka wszystkich
trzech na raz przeważył na korzyść JEDNEGO modułu - scalone na
wyraźną prośbę.

Przy scalaniu: dwa osobne wywołania `configure()` połączone w
jedno (usunięty zduplikowany/cykliczny wpis
`syncCustomFontSelect: window.OMAP_X?.syncCustomFontSelect` - ta
funkcja jest teraz WEWNĄTRZ tego samego modułu, więc przestała być
zależnością do wstrzykiwania, stała się zwykłym lokalnym wywołaniem
bez `ctx.`).

Lekcja ogólna: fizyczne sąsiedztwo w oryginalnym pliku i faktyczne
współdzielenie stanu (jak przycisk resetu tutaj) to silniejszy
sygnał co powinno być jednym modułem niż z pozoru odrębne nazwy
sekcji UI - łatwo pomylić "wygląda jak osobna funkcja" z "jest
niezależnym modułem".


## Konto i synchronizacja (src/services/account-service.js)

Dwudziesty drugi moduł wyniesiony z `app.js` (2026-08-06, ~1090
linii) - **dotąd największy**, prawie dwa razy większy niż Ulubione.
Wyodrębniony na wyraźną prośbę użytkownika po dyskusji o tym, co
jeszcze zostało w `app.js` - Konto/Sync uznane za sensowniejszy
kandydat niż stosowanie kolorów na mapie (które zostaje jako zbyt
splecione z `applyTheme`). Warstwa orkiestracji UI/stanu dla
logowania/rejestracji przez seed-frazę, profilu, push/pull danych
przez Nostr, autosync w tle.

**Niskopoziomowa kryptografia i transport Nostr już były osobnymi
serwisami** z wcześniejszych sesji (`sync-crypto-service.js`,
`sync-transport-service.js`, `window.OMAP_SYNC_CRYPTO`/
`window.OMAP_SYNC_TRANSPORT`) - ten moduł woła je BEZPOŚREDNIO jako
już-globalne obiekty (`const cryptoApi = window.OMAP_SYNC_CRYPTO`
wewnątrz poszczególnych funkcji), bez potrzeby wstrzykiwania przez
`configure()`. To znacząco obniżyło ryzyko tej ekstrakcji względem
tego, czego można by się spodziewać po rozmiarze.

**Dwa poważne znaleziska w tej ekstrakcji:**

1. **Kolizja nazw zmiennych** - lokalna `const map = {...}` (mapa
   nazwa-ekranu na element DOM) wewnątrz `showAccountScreen`
   kolidowała z nazwą zewnętrznej instancji MapLibre `map`.
   Standardowa podmiana `map` → `ctx.map` by ją zepsuła (próbowałaby
   zamienić lokalną zmienną w odwołanie do mapy). Przemianowana na
   `screenMap` PRZED wykonaniem podmiany, żeby uniknąć kolizji.

2. **Duży blok niebezpiecznych wywołań na poziomie modułu** - ~20
   rejestracji `addEventListener` (~130 linii) siedziało
   bezpośrednio na poziomie pliku w oryginalnym `app.js`, odwołując
   się wprost do `el.X` - ten sam mechanizm co przy Pomiarze, tylko
   na dużo większą skalę (jeden duży blok zamiast pojedynczych
   wywołań). Owinięty w `initializeAccountEventListeners()`, wołany
   jawnie z `app.js` po pełnym `configure()`.

**Trzy zaktualizowane punkty w `app.js`**: `ratings-service.js` i
`seed-words-service.js` (obie potrzebowały `openAccountFromMenu`/
`showAccountMessage`, teraz zdefiniowanych tutaj), plus bezpośrednie
wywołania w inicjalizatorze dolnego panelu konta i przyciskach menu.

Wynik: `app.js` spadł poniżej 11000 linii pierwszy raz w tej sesji
(z ~16586 na starcie do 10892).


## Trasy (src/services/route-service.js)

Dwudziesty trzeci moduł wyniesiony z `app.js` (2026-08-09, ~2050
linii, 66 wyeksportowanych funkcji) - **dotąd największy i
najbardziej rozproszony**, prawie dwa razy większy niż Konto.
Cały system planowania i wyznaczania tras: obliczanie (auto i
transit), waypointy, kierunki/manewry, znaczniki na mapie,
udostępnianie, eksport/import GPX, integracja z ulubionymi trasami.
Wyodrębniony na wyraźną prośbę użytkownika, który słusznie zauważył
że pozostawienie akurat Tras jako jedynego dużego wyjątku wyglądałoby
niespójnie po dwudziestu dwóch innych modułach.

**Rozproszony w DWUNASTU nieciągłych fragmentach** oryginalnego
`app.js` (dla porównania: Ulubione miały siedem) - największy,
prawie w pełni zwarty fragment (`createRouteMarkerElement` przez
`clearRoute`, ~1300 linii) plus jedenaście mniejszych, rozrzuconych
kawałków.

**Krytyczna luka metodologiczna znaleziona i naprawiona w trakcie**:
początkowy przegląd funkcji (`grep "^  function "`) łapał tylko kod
z DOKŁADNIE dwuspacjowym wcięciem. Część funkcji w oryginalnym pliku
ma zerowe wcięcie (`closeRoute`, `swapRoutePoints`,
`handleRouteMapClick`, `updateRouteClickHint`,
`calculateRouteFromStoredPoints`, `drawRoute`, `exportRouteAsGpx`,
`importRouteFromGpx`) - ten sam nietypowy styl widziany już wcześniej
przy `applyLanguage`/`showUserLocationMarker`, ale tym razem
dotyczący CAŁEGO nieodkrytego obszaru (eksport/import GPX na końcu
pliku), nie pojedynczej funkcji. Naprawa: drugi, szerszy przegląd
(`^function \|^async function `, bez wymogu wcięcia) na CAŁYM pliku,
nie tylko w obszarze Tras - potwierdzone że to były wszystkie
pozostałe przypadki w całym `app.js`.

**Dwie fałszywe nazwy świadomie wykluczone z zakresu**:
`isRouteLayer` (używana wyłącznie przez kolorowanie warstw motywu)
i `resultToRoutePoint` (używana wyłącznie przez autocomplete/
podpowiedzi wyszukiwania) - mimo nazwy z "Route" żadna nie jest
faktycznie wołana przez logikę tras. Zweryfikowane przez sprawdzenie
WSZYSTKICH usages każdej funkcji przed decyzją o włączeniu.

**Przeoczona zależność krzyżowa złapana w ostatniej chwili**:
`scrollPanelToElement` (fizycznie leżała wewnątrz dużego bloku Tras)
jest już zależnością `discover-service.js` - prawie pominięta przy
budowaniu listy eksportu, dodana po dodatkowym sprawdzeniu.

**`calculateRouteFromStoredPoints` ZOSTAJE w `app.js`** (używana
szeroko poza trasami - autocomplete, przeciąganie znaczników, sync)
ale sama w sobie woła WIELE funkcji z tego modułu (`fetchRoute`,
`drawRoute`, `getSelectedRouteMode`, `updateRouteSummary`,
`renderRouteDirections`) - te odwołania zostały już poprawnie
naprawione tym samym, masowym przebiegiem podmiany co reszta pliku
(woła `window.OMAP_ROUTE?.X` bezpośrednio, nie przez `configure()`).

**Znaleziony, ale świadomie NIE naprawiony istniejący błąd**: w
bloku inicjalizacji przycisków znajduje się odwołanie do
NIEISTNIEJĄCEJ funkcji `exportRouteAsGPX` (wielkie GPX, literówka
względem prawdziwej `exportRouteAsGpx`), podłączone do elementu HTML
o ID `export-gpx-button`, który też nie istnieje. Dzięki `?.` cała
linia jest cichym no-opem (optional chaining pomija ewaluację
argumentu gdy `getElementById` zwraca `null`) - nieszkodliwy,
martwy kod sprzed tej sesji, pozostawiony nietknięty zgodnie z
zasadą nieinterweniowania poza zakresem zgłoszonego zadania.

**Cztery inne już wysłane moduły zaktualizowane w tej samej turze**:
`favorites-service.js` (`clearRoute`), `mapview-service.js`
(`updateRouteSaveFavoriteButton`), `geouri-service.js`
(`parseSharedPoint`), `discover-service.js`
(`scrollPanelToElement`) - ich `configure()` w `app.js` teraz
wskazują na `window.OMAP_ROUTE?.X` zamiast bezpośrednio na funkcje,
które się przeniosły.

Wynik: `app.js` z ~10892 do 8981 linii w jednej turze - spadek o
prawie 2000 linii.


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
