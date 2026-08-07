import { app, session } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

import config from './capacitor.electron.config';

// Electron domyślnie blokuje WSZYSTKIE prośby o uprawnienia, chyba że
// jawnie się to zezwoli. Wymaga to DWÓCH osobnych mechanizmów naraz:
// - setPermissionCheckHandler: synchroniczna "bramka" sprawdzana
//   PRZED próbą - bez niej niektóre wywołania są cicho blokowane.
// - setPermissionRequestHandler: obsługuje samo okno z pytaniem.
app.whenReady().then(() => {
  // "clipboard-sanitized-write" to dokladna nazwa uprawnienia, ktore
  // Electron sprawdza przy kazdym navigator.clipboard.writeText() -
  // uzywanym w appce do kopiowania slow seed, wspolrzednych, npub i
  // linkow do udostepnionych tras. Bez tego wpisu wszystkie przyciski
  // "Kopiuj" byly ciszej blokowane w Electronie.
  const allowedPermissions = ['geolocation', 'clipboard-sanitized-write'];

  session.defaultSession.setPermissionCheckHandler(
    (webContents, permission) => allowedPermissions.includes(permission)
  );

  session.defaultSession.setPermissionRequestHandler(
    (webContents, permission, callback) => {
      callback(allowedPermissions.includes(permission));
    }
  );
});

createCapacitorElectronApp(config);
