#!/usr/bin/env python3
"""
Uzupełnia brakujące wspolrzedne (lat/lon) polskich miast w indeksie
wyszukiwarki, odpytujac Nominatim (OpenStreetMap).

Uzycie:
    python3 fill_missing_coords.py

Wymaga polaczenia z internetem. Respektuje limit Nominatim (max 1
zapytanie/sekunde, wlasny User-Agent - wymog ich polityki uzytkowania:
https://operations.osmfoundation.org/policies/nominatim/).

Mozna bezpiecznie przerwac (Ctrl+C) i uruchomic ponownie - zapisuje
postep na biezaco, wiec nie zaczyna od zera.
"""

import json
import time
import sys
import urllib.request
import urllib.parse

# --- Sciezki do plikow - dostosuj jesli Twoja struktura folderow jest inna ---
SOURCE_PATH = "search-v2/location/source/pl-cities.json"
COMPILED_PATH = "search-v2/location/compiled/pl-locations.compiled.json"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
USER_AGENT = "OdwrotnaMapa-CoordFiller/1.0 (kontakt: odwrotnamapa@protonmail.com)"
DELAY_SECONDS = 1.1  # troche zapasu ponad wymagane min. 1s miedzy zapytaniami


def geocode_city(name, voivodeship):
    """Zwraca (lat, lon) albo None, jesli nie znaleziono."""
    params = {
        "city": name,
        "state": voivodeship,
        "country": "Polska",
        "format": "jsonv2",
        "limit": 1,
    }
    url = NOMINATIM_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode("utf-8"))
    except Exception as error:
        print(f"  ! blad zapytania dla '{name}': {error}")
        return None

    if not data:
        return None

    lat = float(data[0]["lat"])
    lon = float(data[0]["lon"])
    return (lat, lon)


def main():
    print("Wczytuje pliki...")
    with open(SOURCE_PATH, encoding="utf-8") as f:
        source_data = json.load(f)
    with open(COMPILED_PATH, encoding="utf-8") as f:
        compiled_data = json.load(f)

    source_cities = source_data["cities"]
    compiled_by_id = {c["id"]: c for c in compiled_data["cities"]}

    missing = [c for c in source_cities if "lat" not in c or "lon" not in c]
    total = len(missing)
    print(f"Miast do uzupelnienia: {total}")

    found_count = 0
    not_found = []

    for index, city in enumerate(missing, start=1):
        name = city["name"]
        voivodeship = city.get("voivodeship", "")

        print(f"[{index}/{total}] {name} ({voivodeship})...", end=" ")
        result = geocode_city(name, voivodeship)

        if result:
            lat, lon = result
            city["lat"] = lat
            city["lon"] = lon

            compiled_entry = compiled_by_id.get(city["id"])
            if compiled_entry:
                compiled_entry["lat"] = lat
                compiled_entry["lon"] = lon

            found_count += 1
            print(f"OK ({lat}, {lon})")
        else:
            not_found.append(name)
            print("NIE ZNALEZIONO")

        # Zapisuj na biezaco co 20 miast, zeby nie stracic postepu
        # przy ewentualnym przerwaniu.
        if index % 20 == 0:
            save(source_data, compiled_data)

        time.sleep(DELAY_SECONDS)

    save(source_data, compiled_data)

    print()
    print(f"Gotowe. Uzupelniono {found_count} z {total}.")
    if not_found:
        print(f"Nie znaleziono ({len(not_found)}):")
        for name in not_found:
            print(f"  - {name}")


def save(source_data, compiled_data):
    with open(SOURCE_PATH, "w", encoding="utf-8") as f:
        json.dump(source_data, f, ensure_ascii=False, indent=2)
    with open(COMPILED_PATH, "w", encoding="utf-8") as f:
        json.dump(compiled_data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nPrzerwano. Uruchom skrypt ponownie, zeby kontynuowac.")
        sys.exit(1)
