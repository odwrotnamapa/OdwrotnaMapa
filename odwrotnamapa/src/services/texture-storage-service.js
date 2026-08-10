(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - warstwa przechowywania
  // IndexedDB dla tekstur (motyw "custom") i wlasnej czcionki. W
  // pelni samodzielny modul - zero zaleznosci od state/el/map/
  // CONFIG/text, tylko wbudowane API IndexedDB. Stale (nazwa/wersja
  // bazy, nazwy magazynow) sa proste, statyczne stringi/liczby bez
  // ryzyka zmiany - zduplikowane tutaj zamiast przekazywane przez
  // configure(), jak identyfikatory warstw MapLibre w Pomiarze.
  //
  // NIE zawiera logiki APLIKACYJNEJ (rejestrowanie @font-face,
  // stosowanie tekstur na warstwach mapy, odczyt/zapis wyboru z
  // localStorage) - to zostaje w app.js, osobny, dużo bardziej
  // spleciony ze stanem appki obszar.

  const TEXTURE_IMAGE_PREFIX = "custom-texture-";
  const TEXTURE_DB_NAME = "odwrotnamapa-textures";
  const TEXTURE_STORE = "textures";
  const FONT_STORE = "fonts";
  const PRESET_STORE = "presets";
  const TEXTURE_DB_VERSION = 3;

  function textureImageId(key) {
    return TEXTURE_IMAGE_PREFIX + key;
  }

  function openTextureDB() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject(new Error("IndexedDB niedostępne"));
        return;
      }
      const request = indexedDB.open(TEXTURE_DB_NAME, TEXTURE_DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(TEXTURE_STORE)) {
          db.createObjectStore(TEXTURE_STORE);
        }
        if (!db.objectStoreNames.contains(FONT_STORE)) {
          db.createObjectStore(FONT_STORE);
        }
        if (!db.objectStoreNames.contains(PRESET_STORE)) {
          db.createObjectStore(PRESET_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function idbGetAllTextures() {
    try {
      const db = await openTextureDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(TEXTURE_STORE, "readonly");
        const store = tx.objectStore(TEXTURE_STORE);
        const result = {};
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            result[cursor.key] = cursor.value;
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    } catch (_) {
      return {};
    }
  }

  async function idbSetTexture(key, dataUrl) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(TEXTURE_STORE, "readwrite");
        tx.objectStore(TEXTURE_STORE).put(dataUrl, key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się zapisać tekstury:", error);
    }
  }

  async function idbDeleteTexture(key) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(TEXTURE_STORE, "readwrite");
        tx.objectStore(TEXTURE_STORE).delete(key);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się usunąć tekstury:", error);
    }
  }
  async function idbGetCustomFont() {
    try {
      const db = await openTextureDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(FONT_STORE, "readonly");
        const req = tx.objectStore(FONT_STORE).get("customFont");
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      return null;
    }
  }

  async function idbSetCustomFont(dataUrl) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(FONT_STORE, "readwrite");
        tx.objectStore(FONT_STORE).put(dataUrl, "customFont");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się zapisać czcionki:", error);
    }
  }

  async function idbDeleteCustomFont() {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(FONT_STORE, "readwrite");
        tx.objectStore(FONT_STORE).delete("customFont");
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się usunąć czcionki:", error);
    }
  }

  async function idbGetAllPresets() {
    try {
      const db = await openTextureDB();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction(PRESET_STORE, "readonly");
        const store = tx.objectStore(PRESET_STORE);
        const result = [];
        const cursorRequest = store.openCursor();
        cursorRequest.onsuccess = event => {
          const cursor = event.target.result;
          if (cursor) {
            result.push(cursor.value);
            cursor.continue();
          } else {
            resolve(result);
          }
        };
        cursorRequest.onerror = () => reject(cursorRequest.error);
      });
    } catch (_) {
      return [];
    }
  }

  async function idbSavePreset(preset) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PRESET_STORE, "readwrite");
        tx.objectStore(PRESET_STORE).put(preset, preset.id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się zapisać motywu:", error);
    }
  }

  async function idbDeletePreset(id) {
    try {
      const db = await openTextureDB();
      await new Promise((resolve, reject) => {
        const tx = db.transaction(PRESET_STORE, "readwrite");
        tx.objectStore(PRESET_STORE).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    } catch (error) {
      console.error("Nie udało się usunąć motywu:", error);
    }
  }

  window.OMAP_TEXTURE_STORAGE = {
    textureImageId,
    idbGetAllTextures,
    idbSetTexture,
    idbDeleteTexture,
    idbGetCustomFont,
    idbSetCustomFont,
    idbDeleteCustomFont,
    idbGetAllPresets,
    idbSavePreset,
    idbDeletePreset
  };
})();
