#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Generuje sitemap.xml zawierajacy wpis dla KAZDEGO landmarku z
pl-named-poi.json, oprocz statycznych stron (strona glowna,
polityka prywatnosci). Bez tego Google nie ma zadnego sposobu, zeby
"odkryc" konkretne miejsca - linki do nich sa dynamiczne (?q=&p=),
wiec sitemap to jedyny sposob, zeby powiedziec wyszukiwarce "te
konkretne adresy istnieja, zaindeksuj je".

Format URL kazdego miejsca jest IDENTYCZNY z tym, ktorego appka
sama uzywa przy pushState (patrz src/services/url-state-service.js,
funkcja buildPlaceUrl) - ?q=<nazwa>&p=<lat>,<lon> - zeby wejscie z
wynikow wyszukiwania faktycznie otworzylo to miejsce w appce.

Uzycie:
    python3 tools/generate_sitemap.py

Nadpisuje sitemap.xml w katalogu glownym. Uruchom ponownie za kazdym
razem, gdy dodasz nowe landmarki do bazy.
"""

import json
import os
import urllib.parse
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
POI_JSON_PATH = os.path.join(ROOT, "search-v2/named-poi/pl-named-poi.json")
SITEMAP_PATH = os.path.join(ROOT, "sitemap.xml")
BASE_URL = "https://odwrotnamapa.pl/"

# Statyczne strony, ktore ZAWSZE musza byc w sitemapie - nie sa
# generowane z bazy landmarkow, wiec trzymamy je tutaj na stale.
STATIC_PAGES = [
    {"loc": BASE_URL, "changefreq": "weekly", "priority": "1.0"},
    {"loc": f"{BASE_URL}privacy.html", "changefreq": "yearly", "priority": "0.3"},
    {"loc": f"{BASE_URL}privacy-en.html", "changefreq": "yearly", "priority": "0.3"},
]


def build_place_url(name, lat, lon):
    """Identyczny format co buildPlaceUrl() w url-state-service.js."""
    params = {
        "q": name,
        "p": f"{lat:.6f},{lon:.6f}",
    }
    return f"{BASE_URL}?{urllib.parse.urlencode(params)}"


def escape_xml(value):
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&apos;")
    )


def main():
    with open(POI_JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)

    entries = list(STATIC_PAGES)
    skipped = 0

    for record in data["records"]:
        name = record.get("name")
        lat = record.get("lat")
        lon = record.get("lon")
        if not name or not isinstance(lat, (int, float)) or not isinstance(lon, (int, float)):
            skipped += 1
            continue

        entries.append({
            "loc": build_place_url(name, lat, lon),
            "changefreq": "monthly",
            "priority": "0.7",
        })

    lines = ['<?xml version="1.0" encoding="UTF-8"?>']
    lines.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    for entry in entries:
        lines.append("  <url>")
        lines.append(f"    <loc>{escape_xml(entry['loc'])}</loc>")
        lines.append(f"    <changefreq>{entry['changefreq']}</changefreq>")
        lines.append(f"    <priority>{entry['priority']}</priority>")
        lines.append("  </url>")
    lines.append("</urlset>")

    with open(SITEMAP_PATH, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    print(f"Wygenerowano sitemap.xml: {len(entries)} adresow ({len(STATIC_PAGES)} statycznych + {len(entries) - len(STATIC_PAGES)} landmarkow)")
    if skipped:
        print(f"Pominieto {skipped} rekordow bez nazwy/wspolrzednych")
    print(f"Zapisano do {SITEMAP_PATH}")
    print("\nPamietaj zgłosić zaktualizowany sitemap w Google Search Console")
    print("(albo poczekać, aż Google sam go ponownie odczyta - zwykle w ciągu kilku dni).")


if __name__ == "__main__":
    main()
