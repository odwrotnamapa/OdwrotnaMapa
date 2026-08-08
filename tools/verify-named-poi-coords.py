# -*- coding: utf-8 -*-
"""
Sanity-check wspolrzednych w search-v2/named-poi/pl-named-poi.json
wzgledem oficjalnych wspolrzednych miast z profesjonalnie zbudowanej
bazy search-v2/location/compiled/pl-locations.compiled.json (1026 miast).

WAZNE - CO TEN SKRYPT ROBI I CZEGO NIE ROBI:
- Lapie DUZE bledy: gdy landmark jest zapisany jako "w miescie X", ale
  jego wspolrzedne wskazuja miejsce dziesiatki km od centrum X.
- NIE lapie malych przesuniec (1-5 km) w obrebie tego samego miasta -
  do tego nadal potrzeba recznej weryfikacji przez wyszukiwarke.
- Automatycznie pomija kategorie, dla ktorych duza odleglosc od miasta
  jest NORMALNA (lotniska, parki narodowe, jeziora, szczyty gorskie).
- Miejscowosci ktorych NIE MA w bazie 1026 oficjalnych miast (male wsie,
  np. Nieborow, Kozlowka) NIE MOGA byc automatycznie sprawdzone tym
  sposobem - te wypisuje osobno jako "do recznej weryfikacji", bo to
  wlasnie tam koncentruja sie najwieksze bledy (potwierdzone w praktyce:
  Nieborow byl ~28km od prawdy, Kozlowka ~12km, Rogalin ~13km).

Uzycie: python3 tools/verify-named-poi-coords.py
"""
import json
import math
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return 2*R*math.asin(math.sqrt(a))

DISTANT_OK_TYPES = {'airport', 'national_park', 'lake', 'peak'}
THRESHOLD_KM = 15
THRESHOLD_KM_DISTANT_OK = 60

def main():
    with open(os.path.join(ROOT, 'search-v2/location/compiled/pl-locations.compiled.json'), encoding='utf-8') as f:
        cities_data = json.load(f)

    city_coords = {}
    for c in cities_data['cities']:
        city_coords[c['name']] = (c['lat'], c['lon'])
        for alias in c.get('aliases', []):
            city_coords.setdefault(alias, (c['lat'], c['lon']))

    with open(os.path.join(ROOT, 'search-v2/named-poi/pl-named-poi.json'), encoding='utf-8') as f:
        poi_data = json.load(f)

    suspicious = []
    no_city_match = []
    ok_count = 0

    for r in poi_data['records']:
        if r.get('type') == 'city':
            continue
        city = r.get('city', '')
        if city not in city_coords:
            no_city_match.append((r['name'], city, r.get('type')))
            continue
        city_lat, city_lon = city_coords[city]
        dist = haversine_km(r['lat'], r['lon'], city_lat, city_lon)
        threshold = THRESHOLD_KM_DISTANT_OK if r.get('type') in DISTANT_OK_TYPES else THRESHOLD_KM
        if dist > threshold:
            suspicious.append((r['name'], city, round(dist, 1), r.get('type')))
        else:
            ok_count += 1

    print(f"=== Weryfikacja wspolrzednych named-poi ({len(poi_data['records'])} rekordow) ===")
    print(f"OK (w rozsadnej odleglosci od centrum swojego miasta): {ok_count}")
    print(f"PODEJRZANE (duzo dalej niz powinno): {len(suspicious)}")
    print(f"Male miejscowosci spoza bazy 1026 miast (WYMAGAJA RECZNEJ WERYFIKACJI): {len(no_city_match)}")
    print()
    if suspicious:
        print("--- PODEJRZANE (sprawdz recznie w pierwszej kolejnosci) ---")
        for name, city, dist, typ in sorted(suspicious, key=lambda x: -x[2]):
            print(f"  {dist:>6.1f}km  {name}  (miasto: {city}, typ: {typ})")
        print()
    if no_city_match:
        print("--- MALE MIEJSCOWOSCI - najwyzsze ryzyko bledu, sprawdz recznie kazde ---")
        for name, city, typ in no_city_match:
            print(f"  {name}  (miejscowosc: {city}, typ: {typ})")

if __name__ == '__main__':
    main()
