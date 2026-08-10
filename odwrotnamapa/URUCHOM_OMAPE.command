#!/bin/sh
cd "$(dirname "$0")"
if ! command -v node >/dev/null 2>&1; then
  echo ""
  echo "Nie znaleziono Node.js."
  echo "Zainstaluj Node.js 18 lub nowszy i uruchom plik ponownie."
  echo ""
  read -r _
  exit 1
fi
node tools/start-local-server.cjs
