#!/bin/bash

# Przejdź do katalogu, w którym znajduje się skrypt
cd "$(dirname "$0")"

PORT=8000
echo "Uruchamianie serwera pod adresem http://localhost:$PORT..."

# Otwórz przeglądarkę w tle
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:$PORT" &
elif command -v open > /dev/null; then
    open "http://localhost:$PORT" &
fi

# Uruchom prosty serwer w Pythonie
python3 -m http.server $PORT
