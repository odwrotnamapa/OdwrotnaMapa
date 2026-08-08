#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Laczy dwa podejscia z poprzednich prob:

1. Automatyzacja (jak poi-fixer.py / Mapbox) - odpytuje geokoder
   zamiast recznego wyszukiwania kazdego miejsca z osobna.
2. Kontrola sensownosci (jak recznaweryfikacja Claude) - kazdy wynik
   jest sprawdzany wzgledem ZNANEJ, poprawnej lokalizacji miasta
   (z Twojej wlasnej bazy 1026 miast) PRZED zaakceptowaniem. Jesli
   wynik jest nierealistycznie daleko, skrypt go ODRZUCA zamiast
   wpisac blednie (to byl glowny problem czystego Mapbox-podejscia -
   przy braku dokladnego trafienia wpisywal cokolwiek, nawet ulice
   o podobnej nazwie 500km dalej).

Dodatkowo: jesli podasz token Mapboxa, skrypt odpytuje ROWNIEZ
Mapbox i porownuje z Nominatim - jesli oba sie zgadzaja (w granicach
paru km), przyjmuje wynik z wysoka pewnoscia. Jesli sie NIE zgadzaja,
FLAGUJE do recznego sprawdzenia zamiast zgadywac ktory ma racje.

Bez tokenu Mapboxa dziala tylko na Nominatim (wolniej ze wzgledu na
limit 1 zapytanie/sekunde, ale w zupelnosci wystarczajaco dla tego
zbioru danych).

WYNIK: NIC nie jest nadpisywane bez kontroli. Kazdy rekord trafia do
jednej z trzech kategorii:
  - ZAAKCEPTOWANE: wynik geokodera jest w rozsadnej odleglosci od
    znanego miasta (i, jesli sprawdzany dwoma zrodlami, oba sie
    zgadzaja) - wspolrzedne zostaja zaktualizowane.
  - BEZ ZMIAN: geokoder nie zwrocil nic sensownego lub wynik jest
    zbyt daleko od znanego miasta - stara wartosc zostaje NIETKNIETA,
    wpis trafia do raportu "do recznego sprawdzenia".
  - POMINIETE: miasto nie znalezione w bazie 1026 miast (za mala
    miejscowosc) - bez punktu odniesienia nie da sie automatycznie
    zweryfikowac, wiec pomijane calkowicie (stara wartosc zostaje).

Uzycie:
    python3 tools/fix_poi_coords.py
    python3 tools/fix_poi_coords.py --mapbox-token pk.xxx
    python3 tools/fix_poi_coords.py --only "Nazwa miejsca"

Mozna bezpiecznie przerwac (Ctrl+C) - zapisuje wynik na biezaco po
kazdym rekordzie, nie tylko na koncu.
"""

import argparse
import json
import math
import os
import sys
import time
import urllib.request
import urllib.parse
import urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POI_JSON_PATH = os.path.join(ROOT, "search-v2/named-poi/pl-named-poi.json")
POI_JS_PATH = os.path.join(ROOT, "search-v2/named-poi/pl-named-poi.js")
CITIES_PATH = os.path.join(ROOT, "search-v2/location/compiled/pl-locations.compiled.json")

# Opcjonalnie: wklej tutaj swój token z Mapboxa, zeby nie podawac go
# za kazdym razem w linii polecen przez --mapbox-token. Jesli zostawisz
# pusty string, skrypt dziala na samym Nominatim (w zupelnosci
# wystarczajace - Mapbox to tylko dodatkowa krzyzowa weryfikacja).
# Argument --mapbox-token w linii polecen, jesli podany, ma
# pierwszenstwo przed ta stala.
MAPBOX_TOKEN = ""

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
MAPBOX_URL_TMPL = "https://api.mapbox.com/geocoding/v5/mapbox.places/{query}.json"
# Ta sama publiczna instancja Photon, ktorej appka juz uzywa do
# wyszukiwania na zywo (config.js: search.fuzzyEndpoint) - bez tokena,
# oparta na OSM jak Nominatim, ale inny silnik (Elasticsearch), wiec
# moze zlapac inne bledy niz Nominatim.
PHOTON_URL = "https://photon.komoot.io/api/"
USER_AGENT = "OdwrotnaMapa-CoordFixer/1.0 (kontakt: odwrotnamapa@protonmail.com)"

NOMINATIM_DELAY = 1.1  # nominatim wymaga max 1 zapytanie/sekunde
MAPBOX_DELAY = 0.15
PHOTON_DELAY = 0.3  # "extensive usage will be throttled" - zapas ostroznosci

# Powyzej tego dystansu (km) od znanego centrum miasta wynik jest
# odrzucany jako nierealistyczny. 40km jest celowo hojne - pozwala na
# lotniska i duze obiekty na obrzezach, ale odcina bledy typu "zla
# ulica w innym wojewodztwie" (te ktore widzielismy: 200-500km).
MAX_DISTANCE_KM = 40

# Jesli mamy wyniki z DWoch zrodel (Nominatim + Mapbox), musza byc
# zgodne w tej odlegtosci, zeby uznac je za pewne.
CROSS_CHECK_TOLERANCE_KM = 3


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def load_city_coords():
    with open(CITIES_PATH, encoding="utf-8") as f:
        data = json.load(f)
    coords = {}
    for c in data["cities"]:
        coords[c["name"]] = (c["lat"], c["lon"])
        for alias in c.get("aliases", []):
            coords.setdefault(alias, (c["lat"], c["lon"]))
    return coords


def geocode_nominatim(query):
    """Zwraca liste (lat, lon, display_name, road) kandydatow, najlepszy
    pierwszy. 'road' to nazwa ulicy wyciagnieta ze strukturalnego
    address_details Nominatim (albo None, jesli nie zwrocil ulicy -
    np. dla duzych, samodzielnych obiektow jak zamki czy parki).

    Wyniki z class="highway" sa CALKOWICIE odrzucane - to oznacza,
    ze Nominatim nie znalazl samego miejsca i dopasowal zamiast tego
    ULICE o podobnej nazwie (np. "Katedra Oliwska" -> ulica "Oliwska"
    w zupelnie innej dzielnicy). Taki wynik jest gorszy niz brak
    wyniku, bo wyglada wiarygodnie (ta sama miejscowosc), ale wskazuje
    zupelnie inne miejsce.
    """
    params = {
        "q": query,
        "format": "jsonv2",
        "limit": 5,
        "countrycodes": "pl",
        "addressdetails": 1,
    }
    url = NOMINATIM_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept-Language": "pl"})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        print(f"    ! Nominatim blad: {e}")
        return []
    out = []
    for d in data:
        if d.get("class") == "highway":
            continue
        addr = d.get("address", {})
        # Nominatim zwraca ulice pod rozna nazwa pola w zaleznosci od
        # typu miejsca - probujemy po kolei najbardziej prawdopodobne
        road = addr.get("road") or addr.get("pedestrian") or addr.get("suburb")
        out.append((float(d["lat"]), float(d["lon"]), d.get("display_name", ""), road))
    return out


def geocode_mapbox(query, token, near_lat=None, near_lon=None):
    """Zwraca liste (lat, lon, place_name) kandydatow. Uzywa proximity,
    zeby biasowac wyniki w strone znanego miasta zamiast pozwalac
    geokoderowi trafic gdziekolwiek w Polsce."""
    encoded = urllib.parse.quote(query)
    url = MAPBOX_URL_TMPL.format(query=encoded)
    params = {
        "access_token": token.strip(),
        "country": "pl",
        "limit": 3,
        "language": "pl",
        # ograniczamy do konkretnych typow - bez tego geokoder czasem
        # dopasowuje sama ULICE o podobnej nazwie zamiast POI
        "types": "poi,address",
    }
    if near_lat is not None and near_lon is not None:
        params["proximity"] = f"{near_lon},{near_lat}"
    full_url = url + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(full_url)
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        # HTTPError nie pokazuje tresci odpowiedzi domyslnie - a to
        # wlasnie tam Mapbox wpisuje KONKRETNY powod bledu (np. zly
        # token, token bez uprawnien, wygasly token) zamiast samego
        # ogolnikowego "HTTP Error 401: Unauthorized".
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = "(brak tresci odpowiedzi)"
        print(f"    ! Mapbox HTTP {e.code}: {body}")
        return []
    except Exception as e:
        print(f"    ! Mapbox blad: {e}")
        return []
    out = []
    for f in data.get("features", []):
        lon, lat = f["center"]
        out.append((lat, lon, f.get("place_name", ""), None))
    return out


def geocode_photon(query, near_lat=None, near_lon=None):
    """Zwraca liste (lat, lon, display_name, road) kandydatow z Photon.
    Ten sam mechanizm co Nominatim: wyniki oznaczone jako ulica
    (osm_key == 'highway') sa CALKOWICIE odrzucane, zeby nie powtorzyc
    bledu typu 'Katedra Oliwska -> ulica Oliwska w innej dzielnicy'."""
    # UWAGA: publiczna instancja Photon NIE wspiera "pl" jako lang -
    # tylko "default", "de", "en", "fr" (potwierdzone bledem 400).
    # "default" zwraca nazwy w oryginalnym tagowaniu OSM, co dla
    # miejsc w Polsce i tak w praktyce oznacza polskie nazwy.
    params = {"q": query, "lang": "default", "limit": 5}
    if near_lat is not None and near_lon is not None:
        params["lat"] = near_lat
        params["lon"] = near_lon
    url = PHOTON_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8")
        except Exception:
            body = "(brak tresci odpowiedzi)"
        print(f"    ! Photon HTTP {e.code} dla zapytania '{query}': {body}")
        return []
    except Exception as e:
        print(f"    ! Photon blad: {e}")
        return []
    out = []
    for feat in data.get("features", []):
        props = feat.get("properties", {})
        if props.get("osm_key") == "highway":
            continue
        coords = feat.get("geometry", {}).get("coordinates", [])
        if len(coords) != 2:
            continue
        lon, lat = coords
        name = props.get("name", "")
        city = props.get("city") or props.get("town") or props.get("village") or ""
        display = f"{name}, {city}".strip(", ")
        road = props.get("street")
        out.append((float(lat), float(lon), display, road))
    return out


def pick_best_candidate(candidates, near_lat, near_lon):
    """Sposrod kandydatow wybiera najblizszego znanemu centrum miasta."""
    if not candidates:
        return None
    return min(candidates, key=lambda c: haversine_km(c[0], c[1], near_lat, near_lon))


def process_record_no_city_reference(name, city, mapbox_token, use_photon):
    """Fallback dla malych miejscowosci spoza bazy 1026 miast - bez
    znanego punktu odniesienia nie mozna zrobic kontroli odleglosci,
    wiec jedynym zabezpieczeniem jest wymaganie, zeby CO NAJMNIEJ DWA
    NIEZALEZNE zrodla zgodzily sie ze soba (w przeciwienstwie do
    glownej sciezki, tu wynik z JEDNEGO zrodla NIE jest akceptowany -
    za malo pewnosci bez zadnego punktu odniesienia)."""
    query = f"{name}, {city}, Polska"
    candidates = []

    nom = geocode_nominatim(query)
    time.sleep(NOMINATIM_DELAY)
    if nom:
        candidates.append(("nominatim", nom[0]))

    if mapbox_token:
        mb = geocode_mapbox(query, mapbox_token)
        time.sleep(MAPBOX_DELAY)
        if mb:
            candidates.append(("mapbox", mb[0]))

    if use_photon:
        ph = geocode_photon(query)
        time.sleep(PHOTON_DELAY)
        if ph:
            candidates.append(("photon", ph[0]))

    if len(candidates) < 2:
        return "UNCHANGED", None, None, (
            f"miasto '{city}' spoza bazy 1026 - brak punktu odniesienia, "
            f"a dostepne jest tylko {len(candidates)} zrodlo/zrodel (potrzeba "
            f"min. 2 zgadzajacych sie, bez punktu odniesienia jedno zrodlo to za malo)"
        )

    best_pair = None
    for i in range(len(candidates)):
        for j in range(i + 1, len(candidates)):
            src_a, a = candidates[i]
            src_b, b = candidates[j]
            d = haversine_km(a[0], a[1], b[0], b[1])
            if d <= CROSS_CHECK_TOLERANCE_KM:
                if best_pair is None or d < best_pair[0]:
                    best_pair = (d, src_a, a, src_b, b)

    if best_pair is None:
        summary = ", ".join(f"{s}=({c[0]:.4f},{c[1]:.4f})" for s, c in candidates)
        return "UNCHANGED", None, None, f"zrodla NIE zgadzaja sie ze soba: {summary}"

    d, src_a, a, src_b, b = best_pair
    if src_a == "nominatim" and a[3]:
        chosen = a
    elif src_b == "nominatim" and b[3]:
        chosen = b
    elif a[3]:
        chosen = a
    elif b[3]:
        chosen = b
    elif src_a == "nominatim":
        chosen = a
    elif src_b == "nominatim":
        chosen = b
    else:
        chosen = a
    return "ACCEPTED", (chosen[0], chosen[1]), chosen[3], (
        f"{src_a}+{src_b} zgodne bez punktu odniesienia (roznica {d:.2f}km)"
    )


def process_record(record, city_coords, mapbox_token, use_photon=True):
    name = record.get("name") or ""
    city = record.get("city") or ""

    if city not in city_coords:
        return process_record_no_city_reference(name, city, mapbox_token, use_photon)

    near_lat, near_lon = city_coords[city]
    query = f"{name}, {city}, Polska"

    sources_valid = []  # [(nazwa_zrodla, (lat, lon, display, road)), ...]

    nominatim_candidates = geocode_nominatim(query)
    time.sleep(NOMINATIM_DELAY)
    best_nom = pick_best_candidate(nominatim_candidates, near_lat, near_lon)
    if best_nom and haversine_km(best_nom[0], best_nom[1], near_lat, near_lon) <= MAX_DISTANCE_KM:
        sources_valid.append(("nominatim", best_nom))

    if mapbox_token:
        mb_candidates = geocode_mapbox(query, mapbox_token, near_lat, near_lon)
        time.sleep(MAPBOX_DELAY)
        best_mb = pick_best_candidate(mb_candidates, near_lat, near_lon)
        if best_mb and haversine_km(best_mb[0], best_mb[1], near_lat, near_lon) <= MAX_DISTANCE_KM:
            sources_valid.append(("mapbox", best_mb))

    if use_photon:
        ph_candidates = geocode_photon(query, near_lat, near_lon)
        time.sleep(PHOTON_DELAY)
        best_ph = pick_best_candidate(ph_candidates, near_lat, near_lon)
        if best_ph and haversine_km(best_ph[0], best_ph[1], near_lat, near_lon) <= MAX_DISTANCE_KM:
            sources_valid.append(("photon", best_ph))

    if not sources_valid:
        return "UNCHANGED", None, None, "zaden geokoder nie zwrocil sensownego wyniku (w promieniu miasta)"

    if len(sources_valid) == 1:
        src, (lat, lon, label, road) = sources_valid[0]
        return "ACCEPTED", (lat, lon), road, f"tylko {src} ({label[:60]})"

    # Dwa lub wiecej zrodel - szukamy KTOREJKOLWIEK pary, ktora sie
    # zgadza (nie wymagamy zgody WSZYSTKICH - np. przy 3 zrodlach
    # wystarczy, ze dwa z nich potwierdzaja ten sam wynik). Wybieramy
    # najlepiej zgadzajaca sie pare (najmniejsza roznica).
    best_pair = None
    for i in range(len(sources_valid)):
        for j in range(i + 1, len(sources_valid)):
            src_a, a = sources_valid[i]
            src_b, b = sources_valid[j]
            d = haversine_km(a[0], a[1], b[0], b[1])
            if d <= CROSS_CHECK_TOLERANCE_KM:
                if best_pair is None or d < best_pair[0]:
                    best_pair = (d, src_a, a, src_b, b)

    if best_pair is None:
        summary = ", ".join(
            f"{src}=({c[0]:.4f},{c[1]:.4f})" for src, c in sources_valid
        )
        return "UNCHANGED", None, None, f"zrodla NIE zgadzaja sie ze soba: {summary}"

    d, src_a, a, src_b, b = best_pair
    # Wolimy dane (wspolrzedne + adres) z Nominatim, jesli jest w
    # zgadzajacej sie parze - ma najbardziej ustrukturyzowany adres.
    # Jesli Nominatim nie bierze udzialu w tej parze - LUB bierze, ale
    # akurat nie zwrocil ulicy - bierzemy tego z dwojga, kto faktycznie
    # zwrocil ulice (a nie po prostu pierwszego z brzegu).
    if src_a == "nominatim" and a[3]:
        chosen = a
    elif src_b == "nominatim" and b[3]:
        chosen = b
    elif a[3]:
        chosen = a
    elif b[3]:
        chosen = b
    elif src_a == "nominatim":
        chosen = a
    elif src_b == "nominatim":
        chosen = b
    else:
        chosen = a
    return "ACCEPTED", (chosen[0], chosen[1]), chosen[3], (
        f"{src_a}+{src_b} zgodne (roznica {d:.2f}km)"
    )


def slugify(name):
    s = name.lower().replace(" ", "-")
    for a, b in [("ł", "l"), ("ą", "a"), ("ę", "e"), ("ó", "o"), ("ż", "z"),
                 ("ź", "z"), ("ć", "c"), ("ń", "n"), ("ś", "s"), (".", ""),
                 ("'", "")]:
        s = s.replace(a, b)
    return s


def add_new_entries(seed_path, city_coords, mapbox_token, use_photon):
    """Dodaje NOWE landmarki z pliku seed (lista obiektow bez lat/lon)
    do pl-named-poi.json, geokodujac kazdy przez ten sam zweryfikowany
    potok co process_record (Nominatim+Photon+opcjonalnie Mapbox,
    filtr ulic, kontrola sensownosci wzgledem znanego miasta).

    Format pliku seed (JSON), przyklad jednego wpisu:
    {
      "name": "Nazwa miejsca",
      "aliases": ["opcjonalne warianty nazwy"],
      "keywords": ["slowa kluczowe"],
      "type": "museum", "category": "museum", "class": "tourism",
      "city": "Miasto", "voivodeship": "wojewodztwo"
    }
    Wspolrzedne NIE sa podawane - skrypt je znajdzie i zweryfikuje sam.
    """
    with open(seed_path, encoding="utf-8") as f:
        seeds = json.load(f)

    with open(POI_JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    existing_names = {r["name"] for r in data["records"]}
    added, failed = [], []

    for i, seed in enumerate(seeds):
        name = seed.get("name", "")
        print(f"[{i+1}/{len(seeds)}] DODAWANIE: {name}...")

        if name in existing_names:
            print(f"    -- POMINIETE - wpis o tej nazwie juz istnieje")
            continue

        fake_record = {"name": name, "city": seed.get("city", "")}
        status, coords, road, reason = process_record(
            fake_record, city_coords, mapbox_token, use_photon
        )

        if status != "ACCEPTED":
            print(f"    XX NIE DODANO - {reason}")
            failed.append((name, reason))
            continue

        lat, lon = coords
        address = {
            "city": seed.get("city", ""),
            "state": seed.get("voivodeship", ""),
            "country": "Polska",
        }
        if road:
            address["road"] = road

        full_record = {
            "id": f"omap:poi:{slugify(name)}",
            "name": name,
            "aliases": seed.get("aliases", []),
            "keywords": seed.get("keywords", []),
            "type": seed.get("type", "attraction"),
            "category": seed.get("category", "attraction"),
            "class": seed.get("class", "tourism"),
            "lat": lat,
            "lon": lon,
            "address": address,
            "extratags": {},
            "city": seed.get("city", ""),
            "voivodeship": seed.get("voivodeship", ""),
            "priority": 1000,
            "source": "OMapa Named POI seed",
        }
        data["records"].append(full_record)
        existing_names.add(name)
        added.append((name, reason))
        print(f"    OK DODANO ({reason})")

        with open(POI_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    with open(POI_JSON_PATH, encoding="utf-8") as f:
        fresh = json.load(f)
    fresh["recordCount"] = len(fresh["records"])
    with open(POI_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(fresh, f, ensure_ascii=False, indent=2)
    compact = json.dumps(fresh, ensure_ascii=False, separators=(",", ":"))
    with open(POI_JS_PATH, "w", encoding="utf-8") as f:
        f.write(f"window.OMAP_NAMED_POI_INDEX = {compact};\n")

    print(f"\n=== PODSUMOWANIE DODAWANIA ===")
    print(f"Dodane: {len(added)}")
    print(f"Nie dodane (brak pewnego trafienia): {len(failed)}")
    if failed:
        print("\n--- NIE DODANE - sprawdz recznie ---")
        for name, reason in failed:
            print(f"  {name}: {reason}")
    print(f"\nLacznie rekordow w bazie: {fresh['recordCount']}")



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mapbox-token", default=None, help="Token Mapbox do krzyzowej weryfikacji (opcjonalny, nadpisuje stala MAPBOX_TOKEN w pliku)")
    parser.add_argument("--no-photon", action="store_true", help="Wylacz Photon (wlaczony domyslnie - bez tokena, ta sama instancja co w appce)")
    parser.add_argument("--only", default=None, help="Przetworz tylko wpis o tej dokladnej nazwie (do testow)")
    parser.add_argument("--add-from-file", default=None, help="Zamiast weryfikowac istniejace wpisy, dodaj NOWE z pliku JSON (lista obiektow bez lat/lon - patrz docstring add_new_entries)")
    args = parser.parse_args()

    mapbox_token = args.mapbox_token or (MAPBOX_TOKEN.strip() or None)
    use_photon = not args.no_photon

    active_sources = ["Nominatim (zawsze)"]
    active_sources.append("Mapbox (krzyzowa weryfikacja)" if mapbox_token else "Mapbox: WYLACZONY (brak tokena)")
    active_sources.append("Photon" if use_photon else "Photon: WYLACZONY (--no-photon)")
    print("Aktywne zrodla: " + ", ".join(active_sources))

    print("\nWczytuje baze miast (punkt odniesienia)...")
    city_coords = load_city_coords()
    print(f"  {len(city_coords)} nazw miast/aliasow zaladowanych\n")

    if args.add_from_file:
        add_new_entries(args.add_from_file, city_coords, mapbox_token, use_photon)
        print("\nPamietaj skopiowac oba pliki takze do www/search-v2/named-poi/")
        return

    with open(POI_JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    records = data["records"]
    if args.only:
        records = [r for r in records if r["name"] == args.only]
        if not records:
            print(f"Nie znaleziono wpisu o nazwie '{args.only}'")
            sys.exit(1)

    accepted, unchanged, skipped = 0, 0, 0
    flagged_report = []

    for i, record in enumerate(records):
        name = record.get("name", "?")
        print(f"[{i+1}/{len(records)}] {name}...")
        status, coords, road, reason = process_record(record, city_coords, mapbox_token, use_photon)

        if status == "ACCEPTED":
            old = (record["lat"], record["lon"])
            record["lat"], record["lon"] = coords
            dist_moved = haversine_km(old[0], old[1], coords[0], coords[1])

            if not isinstance(record.get("address"), dict):
                record["address"] = {}
            if road:
                record["address"]["road"] = road
                road_note = f", ulica: {road}"
            else:
                # brak ulicy z geokodera (typowe dla duzych, samodzielnych
                # obiektow jak zamki/parki) - zostawiamy to co juz bylo w
                # address.road, nic nie kasujemy
                road_note = " (bez zmiany ulicy - geokoder jej nie zwrocil)"

            print(f"    OK ZAAKCEPTOWANO ({reason}) - przesuniecie {dist_moved:.2f}km{road_note}")
            accepted += 1
        elif status == "UNCHANGED":
            print(f"    XX BEZ ZMIAN - {reason}")
            flagged_report.append((name, record.get("city", ""), reason))
            unchanged += 1
        else:
            print(f"    -- POMINIETE - {reason}")
            skipped += 1

        # zapis na biezaco - bezpieczne przerwanie w kazdej chwili
        with open(POI_JSON_PATH, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    # regeneruj wrapper .js
    with open(POI_JSON_PATH, encoding="utf-8") as f:
        fresh = json.load(f)
    compact = json.dumps(fresh, ensure_ascii=False, separators=(",", ":"))
    with open(POI_JS_PATH, "w", encoding="utf-8") as f:
        f.write(f"window.OMAP_NAMED_POI_INDEX = {compact};\n")

    print(f"\n=== PODSUMOWANIE ===")
    print(f"Zaakceptowane (wspolrzedne zaktualizowane): {accepted}")
    print(f"Bez zmian (do recznego sprawdzenia):        {unchanged}")
    print(f"Pominiete (male miejscowosci):               {skipped}")

    if flagged_report:
        print(f"\n--- DO RECZNEGO SPRAWDZENIA ({len(flagged_report)}) ---")
        for name, city, reason in flagged_report:
            print(f"  {name} ({city}): {reason}")

    print(f"\nZapisano do {POI_JSON_PATH} i {POI_JS_PATH}")
    print("Pamietaj skopiowac oba pliki takze do www/search-v2/named-poi/")


if __name__ == "__main__":
    main()
