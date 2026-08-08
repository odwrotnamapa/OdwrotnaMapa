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
USER_AGENT = "OdwrotnaMapa-CoordFixer/1.0 (kontakt: odwrotnamapa@protonmail.com)"

NOMINATIM_DELAY = 1.1  # nominatim wymaga max 1 zapytanie/sekunde
MAPBOX_DELAY = 0.15

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


def pick_best_candidate(candidates, near_lat, near_lon):
    """Sposrod kandydatow wybiera najblizszego znanemu centrum miasta."""
    if not candidates:
        return None
    return min(candidates, key=lambda c: haversine_km(c[0], c[1], near_lat, near_lon))


def process_record(record, city_coords, mapbox_token):
    name = record.get("name") or ""
    city = record.get("city") or ""

    if city not in city_coords:
        return "SKIPPED", None, None, "miasto spoza bazy 1026 - brak punktu odniesienia"

    near_lat, near_lon = city_coords[city]
    query = f"{name}, {city}, Polska"

    nominatim_candidates = geocode_nominatim(query)
    time.sleep(NOMINATIM_DELAY)
    best_nom = pick_best_candidate(nominatim_candidates, near_lat, near_lon)

    best_mb = None
    if mapbox_token:
        mb_candidates = geocode_mapbox(query, mapbox_token, near_lat, near_lon)
        time.sleep(MAPBOX_DELAY)
        best_mb = pick_best_candidate(mb_candidates, near_lat, near_lon)

    sources_valid = []
    if best_nom and haversine_km(best_nom[0], best_nom[1], near_lat, near_lon) <= MAX_DISTANCE_KM:
        sources_valid.append(("nominatim", best_nom))
    if best_mb and haversine_km(best_mb[0], best_mb[1], near_lat, near_lon) <= MAX_DISTANCE_KM:
        sources_valid.append(("mapbox", best_mb))

    if not sources_valid:
        return "UNCHANGED", None, None, "zaden geokoder nie zwrocil sensownego wyniku (w promieniu miasta)"

    if len(sources_valid) == 2:
        (_, a), (_, b) = sources_valid
        d = haversine_km(a[0], a[1], b[0], b[1])
        if d > CROSS_CHECK_TOLERANCE_KM:
            return "UNCHANGED", None, None, (
                f"Nominatim i Mapbox NIE zgadzaja sie ({d:.1f}km roznicy) - "
                f"nominatim=({a[0]:.4f},{a[1]:.4f}) mapbox=({b[0]:.4f},{b[1]:.4f})"
            )
        # zgadzaja sie - bierzemy wspolrzedne i adres z Nominatim (nie
        # wymaga tokenu, ma ustrukturyzowany address_details - Mapbox
        # tu tylko potwierdza, ze wynik jest wiarygodny)
        road = a[3]
        return "ACCEPTED", (a[0], a[1]), road, f"potwierdzone przez oba zrodla (roznica {d:.2f}km)"

    src, (lat, lon, label, road) = sources_valid[0]
    return "ACCEPTED", (lat, lon), road, f"tylko {src} ({label[:60]})"



def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mapbox-token", default=None, help="Token Mapbox do krzyzowej weryfikacji (opcjonalny, nadpisuje stala MAPBOX_TOKEN w pliku)")
    parser.add_argument("--only", default=None, help="Przetworz tylko wpis o tej dokladnej nazwie (do testow)")
    args = parser.parse_args()

    mapbox_token = args.mapbox_token or (MAPBOX_TOKEN.strip() or None)
    if mapbox_token:
        print("Token Mapbox wykryty - krzyzowa weryfikacja WLACZONA")
    else:
        print("Brak tokena Mapbox - dziala tylko na Nominatim")

    print("\nWczytuje baze miast (punkt odniesienia)...")
    city_coords = load_city_coords()
    print(f"  {len(city_coords)} nazw miast/aliasow zaladowanych\n")

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
        status, coords, road, reason = process_record(record, city_coords, mapbox_token)

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
