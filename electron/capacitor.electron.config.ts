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
      "script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://unpkg.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https://tiles.openfreemap.org https://server.arcgisonline.com https://upload.wikimedia.org https://*.mapillary.com https://*.fbcdn.net",
      "connect-src 'self' https://tiles.openfreemap.org https://server.arcgisonline.com https://nominatim.openstreetmap.org https://photon.komoot.io https://valhalla1.openstreetmap.de https://api.transitous.org https://*.wikipedia.org https://www.wikidata.org https://*.mapillary.com https://*.fbcdn.net",
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
