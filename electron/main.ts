import { app, session } from 'electron';
import { createCapacitorElectronApp } from '@capawesome/capacitor-electron';

import config from './capacitor.electron.config';

// Electron domyślnie blokuje WSZYSTKIE prośby o uprawnienia, chyba że
// jawnie się to zezwoli. Wymaga to DWÓCH osobnych mechanizmów naraz:
// - setPermissionCheckHandler: synchroniczna "bramka" sprawdzana
//   PRZED próbą - bez niej niektóre wywołania są cicho blokowane.
// - setPermissionRequestHandler: obsługuje samo okno z pytaniem.
app.whenReady().then(() => {
  const allowedPermissions = ['geolocation'];

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
