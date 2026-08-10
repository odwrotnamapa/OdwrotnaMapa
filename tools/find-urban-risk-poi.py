# -*- coding: utf-8 -*-
"""
Wypisuje wpisy z pl-named-poi.json nalezace do kategorii, gdzie
precyzja NA POZIOMIE POJEDYNCZEGO BUDYNKU ma znaczenie - galerie
handlowe, dworce, teatry, muzea w gestej miejskiej zabudowie.

W przeciwienstwie do zamkow/parkow narodowych/szczytow (duze,
odosobnione obiekty, gdzie kilkaset metrow nie zmienia w zasadzie
nic), blad kilkuset metrow w gestej zabudowie MIEJSKIEJ potrafi
pokazac zupelnie inny budynek (potwierdzone w praktyce: Galeria
Przymorze byla ~300m od prawdy i pokazywala sasiedni blok).

Automatyczny sanity-check (verify-named-poi-coords.py) NIE lapie
tego typu bledow - wykrywa tylko "zla miejscowosc", nie "dobra
miejscowosc, zly konkretny budynek". Do tego nie ma zadnego
zautomatyzowanego zrodla dostepnego w tym srodowisku (Overpass i
Nominatim niedostepne bezposrednio, OpenStreetMap.org blokuje
pobieranie przez robots.txt) - wymaga to recznej weryfikacji kazdego
wpisu z osobna przez wyszukiwarke.

Uzycie: python3 tools/find-urban-risk-poi.py
"""
import json
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

HIGH_RISK_TYPES = {'mall', 'station', 'theatre', 'events_venue', 'museum'}

def main():
    with open(os.path.join(ROOT, 'search-v2/named-poi/pl-named-poi.json'), encoding='utf-8') as f:
        data = json.load(f)

    high_risk = [r for r in data['records'] if r.get('type') in HIGH_RISK_TYPES]

    print(f"Wpisow wysokiego ryzyka (gesta zabudowa miejska): {len(high_risk)}")
    print("Sprawdz kazdy recznie przez wyszukiwarke - format zapytania ktory dziala najlepiej:")
    print('  "<nazwa>" <miasto> wikimapia wspolrzedne')
    print('  "<nazwa>" <adres jesli znany> wspolrzedne decimal')
    print()
    for r in sorted(high_risk, key=lambda x: x.get('city', '')):
        print(f"  [ ] {r['city']:20s} | {r['name']:45s} | obecnie: {r['lat']}, {r['lon']}")

if __name__ == '__main__':
    main()
