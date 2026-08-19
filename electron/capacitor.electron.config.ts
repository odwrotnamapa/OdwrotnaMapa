import { defineConfig } from '@capawesome/capacitor-electron/config';
import { app, dialog, Menu, BrowserWindow } from 'electron';

function findGeoArg(argv: string[]): string | null {
  return argv.find(arg => arg.startsWith('geo:')) || null;
}

let pendingGeoUri: string | null = findGeoArg(process.argv);
let mainWindowRef: BrowserWindow | null = null;

function deliverGeoUri(uri: string | null): void {
  if (!uri || !mainWindowRef) return;
  mainWindowRef.webContents
    .executeJavaScript(
      `window.omapHandleGeoUri && window.omapHandleGeoUri(${JSON.stringify(uri)});`
    )
    .catch(() => {});
}

app.on('second-instance', (_event, argv: string[]) => {
  const uri = findGeoArg(argv);
  if (uri) deliverGeoUri(uri);
});

export default defineConfig({
  window: {
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
  },
  csp: {
    policy: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com https://esm.sh",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
      // "data:" potrzebne, bo wlasna czcionka (wgrana przez
      // uzytkownika lub przywrocona z synchronizacji/kopii zapasowej)
      // jest rejestrowana jako @font-face przez bezposredni data:
      // URI (patrz registerCustomFontFace w app.js), nie plik na
      // dysku - bez tego CSP cicho blokowal kazde jej zaladowanie.
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://tiles.openfreemap.org https://server.arcgisonline.com https://upload.wikimedia.org https://*.mapillary.com https://*.fbcdn.net",
      // Osiem publicznych przekaźników Nostr używanych przez
      // synchronizację (patrz DEFAULT_RELAYS w
      // sync-transport-service.js) - bez tego CSP cicho blokował
      // WebSockety do synchronizacji w Electronie (przeglądarka nie
      // ma tego ograniczenia, więc problem był widoczny tylko tutaj).
      "connect-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://tiles.openfreemap.org https://server.arcgisonline.com https://nominatim.openstreetmap.org https://photon.komoot.io https://valhalla1.openstreetmap.de https://api.transitous.org https://*.wikipedia.org https://www.wikidata.org https://*.mapillary.com https://*.fbcdn.net https://ipwho.is https://overpass-api.de https://overpass.kumi.systems https://overpass.private.coffee https://odwrotnamapa-sync.odwrotnamapa.workers.dev wss://relay.damus.io wss://nos.lol wss://relay.nostr.band wss://relay.primal.net wss://nostr.mom wss://offchain.pub wss://relay.snort.social wss://nostr.oxtr.dev",
      "worker-src 'self' blob:",
      "child-src blob:",
    ].join('; '),
  },
  deepLinks: {
    scheme: 'geo',
  },
  hooks: {
    beforeReady: () => {
      Menu.setApplicationMenu(null);
    },
    onWindowCreated: window => {
      mainWindowRef = window;

      // Menu.setApplicationMenu(null) (patrz beforeReady nizej) usuwa
      // caly pasek menu - a domyslny skrot Ctrl+Shift+I/F12 do DevTools
      // w Electronie jest normalnie powiazany z akceleratorem pozycji
      // menu "Toggle Developer Tools". Bez menu ten skrot tez przestaje
      // dzialac, wiec rejestrujemy go tutaj niezaleznie, zeby DevTools
      // zawsze dalo sie otworzyc do diagnostyki.
      //
      // Ten sam brak menu psuje TAKZE standardowe skroty edycji
      // (Cut/Copy/Paste/Select All/Undo/Redo) - to dobrze udokumentowane,
      // dlugoletnie zachowanie Electrona: bez menu z rola "Edit" te
      // skroty nie dzialaja w POLACH TEKSTOWYCH (np. wklejenie frazy
      // seed przy logowaniu przez Ctrl+V), szczegolnie dotkliwe na
      // macOS. Zamiast dodawac widoczny pasek menu (czego jawnie
      // unikamy), wolamy odpowiednie polecenia edycji bezposrednio.
      window.webContents.on('before-input-event', (_event, input) => {
        const isDevToolsShortcut =
          (input.control && input.shift && input.key.toLowerCase() === 'i') ||
          input.key === 'F12';
        if (isDevToolsShortcut) {
          window.webContents.toggleDevTools();
          return;
        }

        const hasModifier = process.platform === 'darwin' ? input.meta : input.control;
        if (!hasModifier) return;
        const key = input.key.toLowerCase();
        if (input.shift && key === 'z') {
          window.webContents.redo();
        } else if (key === 'z') {
          window.webContents.undo();
        } else if (key === 'x') {
          window.webContents.cut();
        } else if (key === 'c') {
          window.webContents.copy();
        } else if (key === 'v') {
          window.webContents.paste();
        } else if (key === 'a') {
          window.webContents.selectAll();
        }
      });

      // Pobieranie plikow (blob: + <a download>) nie zawsze trafia do
      // natywnego okna "Zapisz jako" w tym srodowisku (scisle CSP +
      // sandboxowany renderer), wiec obslugujemy to bezposrednio w
      // procesie glownym Electrona, gdzie mamy pelny dostep do systemu
      // plikow.
      window.webContents.session.on('will-download', (_event, item) => {
        const suggested = item.getFilename() || 'odwrotna-mapa-eksport.json';

        const result = dialog.showSaveDialogSync(window, {
          title: suggested,
          defaultPath: suggested,
        });

        if (!result) {
          item.cancel();
          return;
        }

        item.setSavePath(result);
      });

      window.webContents.on('did-finish-load', () => {
        if (pendingGeoUri) {
          deliverGeoUri(pendingGeoUri);
          pendingGeoUri = null;
        }
      });
    },
  },
});
