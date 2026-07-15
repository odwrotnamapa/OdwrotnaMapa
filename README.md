# Odwrotna Mapa — poprawiona wersja

Ta wersja usuwa dwie najbardziej prawdopodobne przyczyny pustego ekranu:

1. nie wymusza fontu, którego styl mapy może nie udostępniać,
2. bezpiecznie obsługuje modyfikacje warstw i błędy ładowania.

## Uruchomienie

Najlepiej uruchomić przez lokalny serwer:

```bash
python -m http.server 8000
```

Potem wejść na:

```text
http://localhost:8000
```

Na Neocities prześlij wszystkie pliki z tego folderu do tego samego katalogu.
Mapa wymaga dostępu do internetu, ponieważ pobiera bibliotekę, styl i kafelki z zewnętrznych serwerów.

- poprawione etykiety ulic: nazwy nie są już wkładane w tarcze numerów dróg,

- własne logo SVG i favicon w folderze `assets/`,

- logo z dużą biało-czerwoną wskazówką wystającą poza okrąg,

- zwijana legenda mapy dostępna obok przycisku lokalizacji,
