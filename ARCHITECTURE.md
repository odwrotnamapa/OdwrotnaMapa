# Odwrotna Mapa — Architektura 2.0

## Architektura 2.0 — stan końcowy

## Zakończenie migracji Place Engine

Wszystkie główne ścieżki otwierania miejsca korzystają z jednego przepływu:

```text
Wyszukiwarka
Historia wyszukiwania
Ulubione
Odkrywaj
Prawy przycisk / Pokaż informacje
        ↓
PlaceResolver
        ↓
Place
        ↓
PlaceService.open()
        ↓
Panel informacji
```

## Zasady

- Mapa jest centrum aplikacji.
- Każda odpowiedzialność ma jedną implementację.
- Nie tworzymy równoległych ścieżek otwierania miejsc.
- UI nie zna źródeł danych.
- Serwisy nie znają szczegółów UI.
- Refaktor nie zmienia zachowania użytkowego.

## Moduły

### Domain
- `Place`

### Services
- `PlaceResolver`
- `PlaceService`
- `CategoryService`
- `OpeningHoursService`
- `AddressService`
- `PhotoService`
- `PhotoSourceResolver`
- `PhotoCache`

### UI
- `BottomSheet`
- `PlaceCard`
- `PhotoGallery`
- `BackNavigation`

`showSelectedPlaceInformation()` i `showPlaceInformation()` pozostają wewnętrznymi rendererami używanymi przez `PlaceService`.

## Dalszy rozwój

Nowe funkcje mają korzystać z istniejących komponentów i serwisów. Nie należy tworzyć osobnych systemów dla wyszukiwarki, Ulubionych, Odkrywaj ani kliknięć mapy.


## Poprawka nawigacji wstecz

Przed zamknięciem panelu Informacje zapisywany jest cel powrotu. Zwykłe zamknięcie nadal czyści stan panelu i zabezpieczenia Named POI, po czym cel zostaje przywrócony wyłącznie na czas wykonania `BackNavigation.goBack()`.

Dzięki temu cofanie ponownie otwiera:

- Ulubione,
- Odkrywaj,
- wyniki wyszukiwania,

zamiast całkowicie zamykać interfejs.


## Uniwersalny wygląd paneli — wersja bezpieczna

Panele zachowują swoje sprawdzone mechanizmy działania i dotychczasowe inicjalizatory. Ujednolicona została wyłącznie warstwa wizualna:

- wspólna klasa `.app-sheet`,
- wspólny nagłówek `.app-sheet__header`,
- wspólny uchwyt `.app-sheet__handle`,
- wspólny obrys, tło i cień,
- ostre rogi o promieniu 4 px.

Nie usunięto ani nie zastąpiono działającej logiki paneli.
