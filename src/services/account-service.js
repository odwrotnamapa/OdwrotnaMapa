(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - Konto i synchronizacja
  // (seed-fraza + Web Crypto, przez Nostr, bez blockchaina). Najwiekszy
  // dotad wyniesiony modul (~1030 linii). Warstwa orkiestracji UI/stanu -
  // logowanie/rejestracja, profil, push/pull danych, autosync.
  //
  // Niskopoziomowa kryptografia (window.OMAP_SYNC_CRYPTO) i transport
  // Nostr (window.OMAP_SYNC_TRANSPORT) juz byly osobnymi serwisami z
  // wczesniejszych sesji - ten modul woLa je BEZPOSREDNIO jako juz-
  // globalne obiekty (const cryptoApi = window.OMAP_SYNC_CRYPTO wewnatrz
  // poszczegolnych funkcji), bez potrzeby wstrzykiwania przez configure().
  //
  // KRYTYCZNE ZNALEZISKO: lokalna zmienna `const map = {...}` (mapa
  // nazwa-ekranu -> element DOM) wewnatrz showAccountScreen kolidowala
  // z nazwa zewnetrznej instancji MapLibre `map` - przemianowana na
  // `screenMap` PRZED wykonaniem standardowej podmiany, zeby uniknac
  // zepsucia tej funkcji.
  //
  // KRYTYCZNE ZNALEZISKO: caly blok rejestracji addEventListener
  // (~20 listenerow, ~130 linii) siedzial na poziomie pliku w
  // oryginalnym app.js, odwolujac sie bezposrednio do el.X - po prostym
  // skopiowaniu do modulu uruchomilby sie NATYCHMIAST przy ladowaniu,
  // zanim configure() moglby ustawic ctx (dokladnie ten sam blad co przy
  // Measure). Owiniety w initializeAccountEventListeners(), wolany
  // jawnie z app.js PO configure().
  //
  // Aktualizuje TRZY juz wyslane moduly: ratings-service.js i
  // seed-words-service.js (obie potrzebowaly openAccountFromMenu/
  // showAccountMessage, ktore sa TUTAJ zdefiniowane), plus wlasny
  // wewnetrzny wywolujacy w app.js (bottom-sheet init, addEventListener
  // dla przyciskow menu).

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function openAccountFromMenu() {
    ctx.closeOtherMobilePanels("account");

    ctx.openMobilePanelStandard(
      ctx.el.accountPanel,
      "--sheet-height"
    );
    ctx.el.menuAccountButton?.setAttribute("aria-expanded", "true");
    refreshAccountUI();
  }

  function returnFromAccountToMenu() {
    if (ctx.el.accountScreenActivity && !ctx.el.accountScreenActivity.hidden) {
      showAccountScreen("loggedin");
      return;
    }
    closeAccount();
    ctx.openMenuHome();
  }

  function closeAccount() {
    if (!ctx.el.accountPanel || ctx.el.accountPanel.hidden) return;
    ctx.el.accountPanel.hidden = true;
    ctx.el.menuAccountButton?.setAttribute("aria-expanded", "false");
  }

  // ===== Konto i synchronizacja (seed-fraza + Web Crypto, bez blockchaina) =====


  function showAccountMessage(message, kind) {
    if (!ctx.el.accountMessage) return;
    ctx.el.accountMessage.textContent = message;
    ctx.el.accountMessage.hidden = false;
    ctx.el.accountMessage.classList.remove(
      "account-message--error",
      "account-message--success"
    );
    if (kind) ctx.el.accountMessage.classList.add(`account-message--${kind}`);
  }

  function clearAccountMessage() {
    if (!ctx.el.accountMessage) return;
    ctx.el.accountMessage.hidden = true;
    ctx.el.accountMessage.textContent = "";
  }

  function formatSyncTimestamp(iso) {
    if (!iso) return null;
    try {
      const date = new Date(iso);
      return date.toLocaleString(ctx.state.language === "pl" ? "pl-PL" : "en-US");
    } catch (_) {
      return null;
    }
  }

  const ACCOUNT_SCREENS = ["home", "login", "register", "loggedin", "activity"];

  function showAccountScreen(name) {
    const screenMap = {
      home: ctx.el.accountScreenHome,
      login: ctx.el.accountScreenLogin,
      register: ctx.el.accountScreenRegister,
      loggedin: ctx.el.accountScreenLoggedIn,
      activity: ctx.el.accountScreenActivity
    };
    for (const key of ACCOUNT_SCREENS) {
      if (screenMap[key]) screenMap[key].hidden = key !== name;
    }
    clearAccountMessage();
  }

  function isAutoSyncEnabled() {
    const stored = ctx.safeGet(ctx.CONFIG.storageKeys.syncAutoEnabled, "");
    return stored === "" ? true : stored === "1";
  }

  function updateManualSyncButtonsVisibility() {
    // Skoro synchronizacja w tle sama pobiera i wysyła dane, ręczne
    // przyciski są zbędne w typowym przypadku - pokazujemy je tylko
    // wtedy, gdy auto-sync jest wyłączony (żeby nie zostać bez żadnej
    // możliwości ręcznej synchronizacji).
    const auto = isAutoSyncEnabled();
    if (ctx.el.accountPullButton) ctx.el.accountPullButton.hidden = auto;
    if (ctx.el.accountPushButton) ctx.el.accountPushButton.hidden = auto;
  }

  // Jednorazowo wyprowadza komplet materiału potrzebnego do rozmowy
  // z przekaźnikami (klucze + identyfikator publiczny), żeby nie
  // powtarzać tego samego, dość kosztownego (PBKDF2) wyprowadzania
  // kluczy w kilku miejscach osobno.
  async function deriveAccountContext(words) {
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    const transport = window.OMAP_SYNC_TRANSPORT;
    if (!cryptoApi || !transport || !words) return null;
    const nostrLib = await transport.waitForNostrLib();
    const { encKey, nostrPrivKeyBytes } = await cryptoApi.deriveKeys(words);
    const nostrPubKeyHex = nostrLib.getPublicKey(nostrPrivKeyBytes);
    return { cryptoApi, transport, nostrLib, encKey, nostrPrivKeyBytes, nostrPubKeyHex };
  }

  async function computeAndShowIdentity() {
    const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();
    if (!words) return;
    try {
      const accountCtx = await deriveAccountContext(words);
      if (!accountCtx) return;
      const npub = accountCtx.nostrLib.npubEncode
        ? accountCtx.nostrLib.npubEncode(accountCtx.nostrPubKeyHex)
        : accountCtx.nostrPubKeyHex;
      if (ctx.el.accountPublicId) {
        // Pełny npub bywa długi (63 znaki) - do samego rozpoznania "czy
        // to na pewno to samo konto" wystarczy garść znaków, długości
        // zbliżonej do identyfikatora filmu na YouTube. Pełny
        // identyfikator nadal kopiuje przycisk "Kopiuj".
        ctx.el.accountPublicId.textContent = npub.slice(0, 11);
        ctx.el.accountPublicId.dataset.fullId = npub;
      }
    } catch (error) {
      console.error("Nie udało się wyznaczyć identyfikatora konta:", error);
    }
  }

  function getStoredProfile() {
    return {
      name: ctx.safeGet(ctx.CONFIG.storageKeys.syncProfileName, ""),
      avatar: ctx.safeGet(ctx.CONFIG.storageKeys.syncProfileAvatar, "")
    };
  }

  function storeProfileLocally(profile) {
    ctx.safeSet(ctx.CONFIG.storageKeys.syncProfileName, profile.name || "");
    ctx.safeSet(ctx.CONFIG.storageKeys.syncProfileAvatar, profile.avatar || "");
  }

  function renderProfileUI() {
    const profile = getStoredProfile();
    const t = ctx.text[ctx.state.language];
    if (ctx.el.accountProfileNameInput) ctx.el.accountProfileNameInput.value = profile.name || "";
    if (ctx.el.accountDisplayName) {
      ctx.el.accountDisplayName.textContent = profile.name || t.accountNoName;
      if (profile.name) {
        ctx.el.accountDisplayName.dataset.hasCustomName = "1";
      } else {
        delete ctx.el.accountDisplayName.dataset.hasCustomName;
      }
    }
    if (ctx.el.accountAvatarPreview && ctx.el.accountAvatarPlaceholder) {
      if (profile.avatar) {
        ctx.el.accountAvatarPreview.src = profile.avatar;
        ctx.el.accountAvatarPreview.hidden = false;
        ctx.el.accountAvatarPlaceholder.hidden = true;
      } else {
        ctx.el.accountAvatarPreview.hidden = true;
        ctx.el.accountAvatarPreview.removeAttribute("src");
        ctx.el.accountAvatarPlaceholder.hidden = false;
      }
    }
  }

  async function pullProfile(ctx) {
    if (!ctx) return;
    try {
      const remote = await ctx.transport.pullBlob(ctx.nostrPubKeyHex, "profile");
      if (!remote) return;
      const profile = await ctx.cryptoApi.decryptPayload(remote.blob, ctx.encKey);
      storeProfileLocally({ name: profile.name || "", avatar: profile.avatar || "" });
      renderProfileUI();
    } catch (error) {
      console.error("Nie udało się pobrać profilu:", error);
    }
  }

  function refreshAccountUI() {
    const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();

    if (!words) {
      stopAutoSyncTimer();
      showAccountScreen("home");
      return;
    }

    const t = ctx.text[ctx.state.language];
    const lastSyncedAt = ctx.safeGet(ctx.CONFIG.storageKeys.syncLastSyncedAt, "");
    const formatted = formatSyncTimestamp(lastSyncedAt);
    if (ctx.el.accountStatusText) {
      let statusText = formatted
        ? t.accountStatusActive.replace("{time}", formatted)
        : t.accountStatusActiveNever;

      try {
        const lastSkipped = JSON.parse(ctx.safeGet(ctx.CONFIG.storageKeys.syncLastSkipped, "[]"));
        if (Array.isArray(lastSkipped) && lastSkipped.length) {
          statusText += t.accountStatusSkippedWarning.replace("{items}", lastSkipped.join(", "));
        }
      } catch (_) {
        // ignoruj uszkodzone dane
      }

      ctx.el.accountStatusText.textContent = statusText;
    }

    if (ctx.el.accountAutoSyncCheckbox) ctx.el.accountAutoSyncCheckbox.checked = isAutoSyncEnabled();
    updateManualSyncButtonsVisibility();
    renderProfileUI();
    computeAndShowIdentity();

    if (ctx.el.accountSeedRevealWords) {
      window.OMAP_SEED_WORDS?.renderSeedWordsGrid(ctx.el.accountSeedRevealWords, words);
    }
    if (ctx.el.accountRevealDetails) ctx.el.accountRevealDetails.open = false;
    if (ctx.el.accountNameEditForm) ctx.el.accountNameEditForm.hidden = true;

    // Nie wyrzucamy z ekranu "Aktywność", jeśli użytkownik akurat go
    // przegląda - w przeciwnym razie cicha synchronizacja w tle (co
    // kilka minut) resetowałaby widok bez żadnego powodu.
    const isBrowsingActivity = ctx.el.accountScreenActivity && !ctx.el.accountScreenActivity.hidden;
    if (!isBrowsingActivity) {
      showAccountScreen("loggedin");
    }
    scheduleAutoSyncCheck();
  }

  function handleCreateAccount() {
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    if (!cryptoApi) return;

    const words = cryptoApi.generateSeedWords(ctx.CONFIG.sync?.wordCount || 16);
    window.OMAP_SEED_WORDS?.renderSeedWordsGrid(ctx.el.accountSeedWords, words);
    ctx.el.accountScreenRegister.dataset.pendingWords = JSON.stringify(words);

    if (ctx.el.accountSeedConfirmCheckbox) ctx.el.accountSeedConfirmCheckbox.checked = false;
    if (ctx.el.accountSeedConfirmButton) ctx.el.accountSeedConfirmButton.disabled = true;

    showAccountScreen("register");
  }

  function handleConfirmSeed() {
    const t = ctx.text[ctx.state.language];
    try {
      const words = JSON.parse(
        ctx.el.accountScreenRegister.dataset.pendingWords || "[]"
      );
      if (!Array.isArray(words) || !words.length) return;
      window.OMAP_SEED_WORDS?.storeSeedWords(words);
      delete ctx.el.accountScreenRegister.dataset.pendingWords;
      refreshAccountUI();
      showAccountMessage(t.accountActivated, "success");
    } catch (error) {
      console.error(error);
    }
  }

  async function handleLoginWithSeed() {
    const t = ctx.text[ctx.state.language];
    const cryptoApi = window.OMAP_SYNC_CRYPTO;
    if (!cryptoApi) return;

    const words = cryptoApi.normalizeSeedInput(ctx.el.accountSeedInput?.value || "");
    const validation = cryptoApi.validateSeedWords(words);

    if (!validation.valid) {
      if (validation.error === "toKrotko") {
        showAccountMessage(t.accountSeedTooShort, "error");
      } else {
        showAccountMessage(t.accountSeedUnknownWord.replace("{word}", validation.word), "error");
      }
      return;
    }

    window.OMAP_SEED_WORDS?.storeSeedWords(words);
    if (ctx.el.accountSeedInput) ctx.el.accountSeedInput.value = "";

    if (ctx.el.accountLoginButton) ctx.el.accountLoginButton.disabled = true;
    showAccountMessage(t.accountLoggedInPulling, null);

    try {
      // Celowo NIE wołamy tu jeszcze refreshAccountUI()/auto-sync - to
      // pierwsze pobranie musi się zakończyć jako pierwsze, zanim
      // cokolwiek (łącznie z auto-synchronizacją w tle) miałoby szansę
      // wysłać stan tego (nowego dla tego konta) urządzenia do chmury
      // i przypadkiem nadpisać to, co tam już jest.
      const scopes = getCheckedSyncScopes();
      const result = await performPull(scopes, { silent: true });

      const accountCtx = await deriveAccountContext(words);
      await pullProfile(accountCtx);

      refreshAccountUI();
      if (result?.applied) {
        showAccountMessage(t.accountLoggedInApplied, "success");
      } else {
        showAccountMessage(t.accountLoggedInNothingFound, "success");
      }
    } catch (error) {
      console.error(error);
      refreshAccountUI();
      showAccountMessage(t.accountLoggedInPullFailed, "error");
    } finally {
      if (ctx.el.accountLoginButton) ctx.el.accountLoginButton.disabled = false;
    }
  }

  function handleLogoutAccount() {
    stopAutoSyncTimer();
    window.OMAP_SEED_WORDS?.clearStoredSeedWords();
    if (ctx.el.accountSeedInput) ctx.el.accountSeedInput.value = "";
    refreshAccountUI();
  }

  function getCheckedSyncScopes() {
    const scopes = [];
    if (ctx.el.accountSyncScopeFavorites?.checked) scopes.push("favorites");
    if (ctx.el.accountSyncScopeColors?.checked) scopes.push("colors");
    if (ctx.el.accountSyncScopePlaceNames?.checked) scopes.push("placeNames");
    if (ctx.el.accountSyncScopeHistory?.checked) scopes.push("history");
    return scopes;
  }

  function buildSyncPayload(scopes) {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString()
    };

    if (scopes.includes("favorites")) {
      payload.favorites = ctx.state.favorites.map(favorite => ({
        ...favorite,
        key: favorite.key,
        title: favorite.title || "",
        address: favorite.address || "",
        lat: Number(favorite.lat),
        lon: Number(favorite.lon)
      }));
      payload.favoriteFolders = [...ctx.state.favoriteFolders];
      payload.routeFavorites = [...ctx.state.routeFavorites];
    }

    if (scopes.includes("colors")) {
      payload.theme = ctx.state.theme;
      payload.language = ctx.state.language;
      payload.customPalette = { ...ctx.state.customPalette };
      if (ctx.state.customFont?.type === "google") {
        payload.customFont = { type: "google", googleFont: ctx.state.customFont.googleFont };
      } else if (ctx.state.customFont?.type === "custom") {
        // Same bajty czcionki jadą osobnym, małym zdarzeniem (patrz
        // pushColorMedia) - tu zostawiamy tylko znacznik typu.
        payload.customFont = { type: "custom" };
      }
    }

    if (scopes.includes("placeNames")) {
      payload.customPlaceNames = { ...(ctx.state.customPlaceNames || {}) };
    }

    if (scopes.includes("history")) {
      payload.history = ctx.state.history.map(entry => ({ ...entry }));
      payload.routeHistory = ctx.state.routeHistory.map(entry => ({ ...entry }));
    }

    return payload;
  }

  // Tekstury (zdjęcia) i wgrany plik czcionki to duże dane binarne, więc
  // zamiast wrzucać je do jednego dużego zdarzenia (ryzyko przekroczenia
  // limitów rozmiaru wielu publicznych przekaźników), publikujemy je
  // jako osobne, małe zdarzenia - jedno na slot. Puste sloty też
  // publikujemy (jako pusty ciąg) - to sygnał "wyczyszczone", inaczej
  // usunięta lokalnie tekstura "wróciłaby" przy kolejnym pobraniu.
  // Wiele publicznych przekaźników Nostr odrzuca zbyt duże zdarzenia
  // (typowo limit rzędu 64-256 KB) - zdjęcie jako base64 łatwo to
  // przekracza i przekaźnik po prostu je odrzuca. Dlatego przed
  // wysyłką przeskalowujemy/kompresujemy teksturę do rozsądnego
  // rozmiaru (jakość lokalnej kopii się nie zmienia - to dotyczy
  // tylko wersji wysyłanej do synchronizacji).
  const MEDIA_SIZE_LIMIT = 180000; // ~180 KB zakodowanego tekstu (base64) - bezpieczny margines
  // Czcionek (w przeciwieństwie do zdjęć) nie da się dalej "dokręcić"
  // po konwersji do WOFF2 - to już najlepsza możliwa kompresja. Dajemy
  // im więc więcej luzu niż teksturom, tym bardziej że mamy 8
  // przekaźników naraz i wystarczy, że przyjmie choć jeden.
  const FONT_SIZE_LIMIT = 350000; // ~350 KB zakodowanego tekstu (base64)

  function downscaleImageDataUrl(dataUrl, maxDim, quality) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Nie udało się wczytać obrazu do przeskalowania."));
      img.src = dataUrl;
    });
  }

  async function prepareTextureForSync(dataUrl) {
    if (!dataUrl) return "";
    // Coraz mocniejsza kompresja, aż zmieści się w limicie - albo się poddajemy.
    const attempts = [
      [1024, 0.72],
      [768, 0.6],
      [512, 0.5],
      [384, 0.4],
      [320, 0.32]
    ];
    for (const [maxDim, quality] of attempts) {
      try {
        const resized = await downscaleImageDataUrl(dataUrl, maxDim, quality);
        if (resized.length <= MEDIA_SIZE_LIMIT) return resized;
      } catch (error) {
        console.error("Przeskalowanie tekstury nie powiodło się:", error);
        break;
      }
    }
    return null; // za duże nawet po maksymalnej kompresji
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function bytesToDataUrl(bytes, mime) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${mime};base64,${btoa(binary)}`;
  }

  // Czcionek nie da się "zmniejszyć" wizualnie jak zdjęć, ale TTF/OTF
  // można realnie skompresować do formatu WOFF2 (specjalnie do tego
  // zaprojektowany, kompresja Brotli) - to zwykle 30-50% mniej danych
  // za darmo, bez utraty ani jednego glifu. Jeśli plik jest już WOFF2
  // (rozpoznajemy po sygnaturze "wOF2" na początku pliku) albo
  // biblioteka nie zdążyła się załadować, wysyłamy oryginał bez zmian.
  async function prepareFontForSync(dataUrl) {
    if (!dataUrl) return "";

    let finalDataUrl = dataUrl;
    let compressedOk = false;
    const originalKB = Math.round(dataUrl.length / 1024);

    try {
      const bytes = dataUrlToBytes(dataUrl);
      const isAlreadyWoff2 =
        bytes.length >= 4 &&
        bytes[0] === 0x77 && bytes[1] === 0x4f && bytes[2] === 0x46 && bytes[3] === 0x32; // "wOF2"

      if (isAlreadyWoff2) {
        console.log("Synchronizacja: czcionka jest już w formacie WOFF2, bez dalszej kompresji.");
      } else if (!window.OMAP_FONT_LIB?.compress) {
        console.warn("Synchronizacja: biblioteka do kompresji czcionek (woff2-encoder) nie jest załadowana - wysyłam oryginał bez kompresji.");
      } else {
        try {
          const compressed = await window.OMAP_FONT_LIB.compress(bytes);
          finalDataUrl = bytesToDataUrl(compressed, "font/woff2");
          compressedOk = true;
        } catch (error) {
          console.error("Kompresja czcionki do WOFF2 nie powiodła się, wysyłam oryginał:", error);
        }
      }
    } catch (error) {
      console.error("Nie udało się przeanalizować pliku czcionki:", error);
    }

    const finalKB = Math.round(finalDataUrl.length / 1024);
    console.log(
      `Synchronizacja czcionki: oryginał ${originalKB} KB${compressedOk ? `, po kompresji WOFF2 ${finalKB} KB` : ""}, limit ${Math.round(FONT_SIZE_LIMIT / 1024)} KB.`
    );

    return finalDataUrl.length <= FONT_SIZE_LIMIT ? finalDataUrl : null;
  }

  async function pushColorMedia(cryptoApi, encKey, transport, nostrPrivKeyBytes) {
    const skipped = [];

    const textureJobs = ctx.TEXTURE_FIELDS.map(async key => {
      const original = ctx.state.customTextures?.[key] || "";
      if (!original) {
        await pushOneMediaSlot(`texture:${key}`, "");
        return;
      }
      const prepared = await prepareTextureForSync(original);
      if (prepared === null) {
        skipped.push(`tekstura „${key}”`);
        return;
      }
      await pushOneMediaSlot(`texture:${key}`, prepared);
    });

    const fontOriginal =
      ctx.state.customFont?.type === "custom" && ctx.state.customFontDataUrl
        ? ctx.state.customFontDataUrl
        : "";

    if (fontOriginal) {
      textureJobs.push(
        (async () => {
          const prepared = await prepareFontForSync(fontOriginal);
          if (prepared === null) {
            const sizeKB = Math.round(fontOriginal.length / 1024);
            skipped.push(`własna czcionka (oryginał ~${sizeKB} KB - zobacz konsolę przeglądarki po szczegóły kompresji)`);
            return;
          }
          await pushOneMediaSlot("font:custom", prepared);
        })()
      );
    } else {
      textureJobs.push(pushOneMediaSlot("font:custom", ""));
    }

    await Promise.allSettled(textureJobs);
    return skipped;

    async function pushOneMediaSlot(topic, value) {
      try {
        const blob = await cryptoApi.encryptPayload({ value }, encKey);
        await transport.pushBlob(nostrPrivKeyBytes, blob, topic);
      } catch (error) {
        // Pojedynczy nieudany slot (np. przekaźnik i tak odrzucił
        // dane) nie powinien przerywać reszty wysyłki, ale ma trafić
        // do listy "skipped", żeby user zobaczył, że coś nie doszło.
        console.error(`Synchronizacja: nie udało się wysłać "${topic}"`, error);
        skipped.push(topic);
      }
    }
  }

  async function pullColorMedia(cryptoApi, encKey, transport, nostrPubKeyHex) {
    for (const key of ctx.TEXTURE_FIELDS) {
      await pullOneMediaSlot(`texture:${key}`, async value => {
        if (value) {
          ctx.state.customTextures[key] = value;
          await window.OMAP_TEXTURE_STORAGE?.idbSetTexture(key, value);
          if (ctx.MAP_TEXTURE_KEYS.includes(key)) await ctx.registerTextureImage(key, value);
        } else {
          ctx.state.customTextures[key] = null;
          await window.OMAP_TEXTURE_STORAGE?.idbDeleteTexture(key);
          if (ctx.MAP_TEXTURE_KEYS.includes(key)) ctx.unregisterTextureImage(key);
        }
      });
    }

    await pullOneMediaSlot("font:custom", async value => {
      if (value) {
        ctx.state.customFont = { type: "custom" };
        ctx.state.customFontDataUrl = value;
        await window.OMAP_TEXTURE_STORAGE?.idbSetCustomFont(value);
        saveCustomFont();
        window.OMAP_CUSTOM_THEME_EDITOR?.syncCustomFontSelect();
      } else if (ctx.state.customFont?.type === "custom") {
        ctx.state.customFont = { type: "default" };
        ctx.state.customFontDataUrl = null;
        await window.OMAP_TEXTURE_STORAGE?.idbDeleteCustomFont();
        saveCustomFont();
        window.OMAP_CUSTOM_THEME_EDITOR?.syncCustomFontSelect();
      }
    });

    async function pullOneMediaSlot(topic, apply) {
      try {
        const remote = await transport.pullBlob(nostrPubKeyHex, topic);
        if (!remote) return;
        const { value } = await cryptoApi.decryptPayload(remote.blob, encKey);
        await apply(value || "");
      } catch (error) {
        console.error(`Synchronizacja: nie udało się pobrać "${topic}"`, error);
      }
    }
  }

  async function applySyncPayload(payload, scopes) {
    if (!payload || typeof payload !== "object") return;

    if (scopes.includes("favorites") && Array.isArray(payload.favorites)) {
      ctx.state.favorites = payload.favorites
        .map(entry => {
          const lat = Number(entry.lat);
          const lon = Number(entry.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return {
            ...entry,
            key: String(entry.key || "").trim() || `${lat.toFixed(6)},${lon.toFixed(6)}`,
            title: String(entry.title || "").trim(),
            address: String(entry.address || "").trim(),
            lat,
            lon
          };
        })
        .filter(Boolean)
        .slice(0, 1000);
      window.OMAP_FAVORITES?.saveFavorites();

      if (Array.isArray(payload.favoriteFolders)) {
        ctx.state.favoriteFolders = payload.favoriteFolders.filter(
          f => typeof f === "string" && f.trim()
        );
        window.OMAP_FAVORITES?.saveFavoriteFolders();
      }

      if (Array.isArray(payload.routeFavorites)) {
        ctx.state.routeFavorites = payload.routeFavorites.filter(entry => entry && entry.key);
        window.OMAP_ROUTE_HISTORY?.saveRouteFavorites();
      }

      window.OMAP_FAVORITES?.renderFolderChips();
      window.OMAP_FAVORITES?.renderFavoritesList();
    }

    if (scopes.includes("colors")) {
      if (payload.customPalette && typeof payload.customPalette === "object") {
        ctx.state.customPalette = { ...ctx.DEFAULT_CUSTOM_PALETTE, ...payload.customPalette };
        window.OMAP_CUSTOM_THEME_EDITOR?.saveCustomPalette(ctx.state.customPalette);
        window.OMAP_CUSTOM_THEME_EDITOR?.syncCustomPaletteInputs();
      }

      if (payload.customFont?.type === "google" && payload.customFont.googleFont) {
        ctx.state.customFont = { type: "google", googleFont: payload.customFont.googleFont };
        ctx.state.customFontDataUrl = null;
        await window.OMAP_TEXTURE_STORAGE?.idbDeleteCustomFont();
        saveCustomFont();
        window.OMAP_CUSTOM_THEME_EDITOR?.syncCustomFontSelect();
      }
      // Typ "custom" (wgrany plik czcionki) jest dociągany i stosowany
      // osobno przez pullColorMedia (bajty czcionki jadą jako osobne,
      // małe zdarzenie Nostr) - patrz wywołanie w performPull.

      if (payload.theme) {
        ctx.state.theme = payload.theme;
        ctx.safeSet(ctx.CONFIG.storageKeys.theme, ctx.state.theme);
        if (ctx.el.themeSelect) ctx.el.themeSelect.value = ctx.state.theme;
        if (ctx.el.menuThemeSelect) ctx.el.menuThemeSelect.value = ctx.state.theme;
        ctx.applyTheme(ctx.state.theme);
      }

      if (payload.language && payload.language !== ctx.state.language) {
        ctx.state.language = payload.language;
        ctx.safeSet(ctx.CONFIG.storageKeys.language, ctx.state.language);
        if (ctx.el.languageSelect) ctx.el.languageSelect.value = ctx.state.language;
        ctx.updateUI();
        ctx.applyLanguage(ctx.state.language);
      }
    }

    if (scopes.includes("placeNames") && payload.customPlaceNames && typeof payload.customPlaceNames === "object") {
      ctx.state.customPlaceNames = { ...payload.customPlaceNames };
      window.OMAP_CUSTOM_PLACE_NAMES?.saveCustomPlaceNames();
    }

    if (scopes.includes("history") && Array.isArray(payload.history)) {
      ctx.state.history = payload.history
        .map(entry => {
          const lat = Number(entry.lat);
          const lon = Number(entry.lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          return { ...entry, lat, lon };
        })
        .filter(Boolean)
        .slice(0, ctx.HISTORY_LIMIT);
      window.OMAP_HISTORY?.saveHistory();
      window.OMAP_HISTORY?.renderHistoryList();
    }

    if (scopes.includes("history") && Array.isArray(payload.routeHistory)) {
      ctx.state.routeHistory = payload.routeHistory
        .filter(entry => entry && entry.key)
        .slice(0, ctx.ROUTE_HISTORY_LIMIT);
      window.OMAP_ROUTE_HISTORY?.saveRouteHistory();
      window.OMAP_HISTORY?.renderHistoryList();
    }
  }

  async function performPush(scopes, options) {
    ctx.el.accountSyncRefreshButton?.classList.add("is-spinning");
    try {
      const silent = options?.silent;
      const t = ctx.text[ctx.state.language];
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();
      if (!cryptoApi || !transport || !words || !scopes.length) return null;

      if (!silent) showAccountMessage(t.accountSending, null);

      const { encKey, nostrPrivKeyBytes } = await cryptoApi.deriveKeys(words);
      const payload = buildSyncPayload(scopes);
      const blob = await cryptoApi.encryptPayload(payload, encKey);
      const result = await transport.pushBlob(nostrPrivKeyBytes, blob, "main");

      let skippedMedia = [];
      if (scopes.includes("colors")) {
        skippedMedia = await pushColorMedia(cryptoApi, encKey, transport, nostrPrivKeyBytes);
      }

      // Zapisujemy to trwale (nie tylko w komunikacie na ekranie), żeby
      // było widać nawet po cichej, automatycznej wysyłce w tle -
      // wcześniej informacja o pominiętych elementach ginęła bezpowrotnie,
      // jeśli wysyłka nie była ręczna.
      if (skippedMedia.length) {
        ctx.safeSet(ctx.CONFIG.storageKeys.syncLastSkipped, JSON.stringify(skippedMedia));
      } else {
        localStorage.removeItem(ctx.CONFIG.storageKeys.syncLastSkipped);
      }

      ctx.safeSet(ctx.CONFIG.storageKeys.syncLastSyncedAt, result.updatedAt || new Date().toISOString());
      return { ...result, skippedMedia };
    } finally {
      ctx.el.accountSyncRefreshButton?.classList.remove("is-spinning");
    }
  }

  async function performPull(scopes, options) {
    ctx.el.accountSyncRefreshButton?.classList.add("is-spinning");
    try {
      const silent = options?.silent;
      const onlyIfNewer = options?.onlyIfNewer;
      const t = ctx.text[ctx.state.language];
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();
      if (!cryptoApi || !transport || !words || !scopes.length) return null;

      if (!silent) showAccountMessage(t.accountReceiving, null);

      const nostrLib = await transport.waitForNostrLib();
      const { encKey, nostrPrivKeyBytes } = await cryptoApi.deriveKeys(words);
      const nostrPubKeyHex = nostrLib.getPublicKey(nostrPrivKeyBytes);
      const remote = await transport.pullBlob(nostrPubKeyHex, "main");

      if (!remote) {
        if (!silent) showAccountMessage(t.accountNothingFoundOnRelays, "error");
        return null;
      }

      if (onlyIfNewer) {
        const lastKnown = ctx.safeGet(ctx.CONFIG.storageKeys.syncLastSyncedAt, "");
        if (lastKnown && new Date(remote.updatedAt) <= new Date(lastKnown)) {
          return { applied: false };
        }
      }

      const payload = await cryptoApi.decryptPayload(remote.blob, encKey);

      // Ważna kolejność: tekstury/czcionkę ustawiamy PRZED zastosowaniem
      // metadanych (motyw/paleta), bo to applySyncPayload wykonuje
      // ostateczne przemalowanie (applyTheme) - jeśli tekstury nie są
      // jeszcze zarejestrowane w tym momencie, przemalowanie użyje
      // samego koloru zamiast tekstury dla danej warstwy.
      if (scopes.includes("colors")) {
        await pullColorMedia(cryptoApi, encKey, transport, nostrPubKeyHex);
      }

      await applySyncPayload(payload, scopes);

      if (scopes.includes("colors")) {
        // Ostateczny krok: ponownie rejestrujemy obrazy tekstur (na
        // wypadek gdyby wcześniejsze przemalowanie/reset stylu mapy
        // "zgubiło" wcześniej dodane obrazy) i dopiero na końcu
        // przemalowujemy motyw - tak, żeby tekstura, jeśli jest
        // ustawiona, zawsze miała ostatnie słowo nad samym kolorem.
        for (const key of ctx.TEXTURE_FIELDS) {
          const value = ctx.state.customTextures?.[key];
          if (value && ctx.MAP_TEXTURE_KEYS.includes(key)) {
            await ctx.registerTextureImage(key, value);
          }
        }
        ctx.applyTheme(ctx.state.theme);
      }

      ctx.safeSet(ctx.CONFIG.storageKeys.syncLastSyncedAt, remote.updatedAt || new Date().toISOString());
      return { applied: true, updatedAt: remote.updatedAt };
    } finally {
      ctx.el.accountSyncRefreshButton?.classList.remove("is-spinning");
    }
  }

  async function handlePushToCloud() {
    const t = ctx.text[ctx.state.language];
    const scopes = getCheckedSyncScopes();
    if (scopes.length === 0) {
      showAccountMessage(t.accountNoScopesPush, "error");
      return;
    }

    if (ctx.el.accountPushButton) ctx.el.accountPushButton.disabled = true;
    try {
      const result = await performPush(scopes, { silent: false });
      refreshAccountUI();

      let message = t.accountSentResult
        .replace("{ok}", result.relaysOk)
        .replace("{total}", result.relaysTotal);
      if (result.skippedMedia?.length) {
        message += t.accountSentWithSkips.replace("{items}", result.skippedMedia.join(", "));
      }
      showAccountMessage(message, result.skippedMedia?.length ? "error" : "success");
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountSendFailed, "error");
    } finally {
      if (ctx.el.accountPushButton) ctx.el.accountPushButton.disabled = false;
    }
  }

  async function handlePullFromCloud() {
    const t = ctx.text[ctx.state.language];
    const scopes = getCheckedSyncScopes();
    if (scopes.length === 0) {
      showAccountMessage(t.accountNoScopesPull, "error");
      return;
    }

    if (ctx.el.accountPullButton) ctx.el.accountPullButton.disabled = true;
    try {
      const result = await performPull(scopes, { silent: false });
      if (result) {
        refreshAccountUI();
        showAccountMessage(t.accountReceived, "success");
      }
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountReceiveFailed, "error");
    } finally {
      if (ctx.el.accountPullButton) ctx.el.accountPullButton.disabled = false;
    }
  }

  // ===== Automatyczna synchronizacja w tle =====
  // Co kilka minut, o ile jest włączona: najpierw sprawdzamy, czy w
  // chmurze jest coś NOWSZEGO niż nasza ostatnia znana synchronizacja
  // (i jeśli tak - stosujemy to lokalnie); jeśli nie ma nic nowszego,
  // wysyłamy bieżący stan tego urządzenia. Dzięki sprawdzaniu znacznika
  // czasu nie nadpisujemy świeższych lokalnych zmian starszymi danymi
  // z chmury.
  let autoSyncTimer = null;
  let autoSyncInitialTimeout = null;
  let autoSyncScheduled = false;

  function stopAutoSyncTimer() {
    if (autoSyncTimer) {
      clearInterval(autoSyncTimer);
      autoSyncTimer = null;
    }
    if (autoSyncInitialTimeout) {
      clearTimeout(autoSyncInitialTimeout);
      autoSyncInitialTimeout = null;
    }
    autoSyncScheduled = false;
  }

  function scheduleAutoSyncCheck() {
    if (autoSyncScheduled) return;
    autoSyncScheduled = true;
    autoSyncInitialTimeout = window.setTimeout(() => {
      autoSyncScheduled = false;
      autoSyncInitialTimeout = null;
      autoSyncTick();
    }, 1500);

    if (!autoSyncTimer) {
      autoSyncTimer = window.setInterval(autoSyncTick, 5 * 60 * 1000);
    }
  }

  async function autoSyncTick() {
    if (document.hidden) return;
    const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();
    if (!words) return;
    if (!isAutoSyncEnabled()) return;

    try {
      const accountCtx = await deriveAccountContext(words);
      await pullProfile(accountCtx);
    } catch (error) {
      console.error("Automatyczne pobranie profilu nie powiodło się:", error);
    }

    const scopes = getCheckedSyncScopes();
    if (!scopes.length) return;

    try {
      // Celowo bez żadnego widocznego komunikatu/powiadomienia - to ma
      // działać niewidocznie w tle. Jedyny ślad to zaktualizowany
      // status ("Ostatnia synchronizacja: ...") widoczny po otwarciu
      // panelu Konto.
      const pullResult = await performPull(scopes, { silent: true, onlyIfNewer: true });
      if (pullResult?.applied) {
        refreshAccountUI();
        return;
      }
      await performPush(scopes, { silent: true });
      refreshAccountUI();
    } catch (error) {
      console.error("Automatyczna synchronizacja nie powiodła się:", error);
    }
  }

  async function saveProfile(name, avatar) {
    const t = ctx.text[ctx.state.language];
    const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();
    if (!words) return;

    storeProfileLocally({ name, avatar });
    renderProfileUI();

    showAccountMessage(t.accountProfileSaving, null);
    try {
      const accountCtx = await deriveAccountContext(words);
      if (!accountCtx) return;
      const blob = await accountCtx.cryptoApi.encryptPayload({ name, avatar }, accountCtx.encKey);
      await accountCtx.transport.pushBlob(accountCtx.nostrPrivKeyBytes, blob, "profile");
      showAccountMessage(t.accountProfileSaved, "success");
    } catch (error) {
      console.error(error);
      showAccountMessage(t.accountProfileSaveFailed, "error");
    }
  }

  function initializeAccountEventListeners() {
    ctx.el.accountGotoLoginButton?.addEventListener("click", () => showAccountScreen("login"));
    ctx.el.accountGotoRegisterButton?.addEventListener("click", handleCreateAccount);
    ctx.el.accountLoginBackButton?.addEventListener("click", () => showAccountScreen("home"));
    ctx.el.accountRegisterBackButton?.addEventListener("click", () => showAccountScreen("home"));
    ctx.el.accountSeedCopyButton?.addEventListener("click", () => {
      try {
        const words = JSON.parse(ctx.el.accountScreenRegister.dataset.pendingWords || "[]");
        if (words.length) window.OMAP_SEED_WORDS?.copyWordsToClipboard(words);
      } catch (_) {}
    });
    ctx.el.accountSeedRevealCopyButton?.addEventListener("click", () => {
      const words = window.OMAP_SEED_WORDS?.getStoredSeedWords();
      if (words) window.OMAP_SEED_WORDS?.copyWordsToClipboard(words);
    });
    ctx.el.accountSeedConfirmCheckbox?.addEventListener("change", () => {
      if (ctx.el.accountSeedConfirmButton) {
        ctx.el.accountSeedConfirmButton.disabled = !ctx.el.accountSeedConfirmCheckbox.checked;
      }
    });
    ctx.el.accountSeedConfirmButton?.addEventListener("click", handleConfirmSeed);
    ctx.el.accountLoginButton?.addEventListener("click", handleLoginWithSeed);
    ctx.el.accountPushButton?.addEventListener("click", handlePushToCloud);
    ctx.el.accountPullButton?.addEventListener("click", handlePullFromCloud);
    ctx.el.accountSyncRefreshButton?.addEventListener("click", handlePullFromCloud);
    ctx.el.accountAutoSyncCheckbox?.addEventListener("change", () => {
      const enabled = ctx.el.accountAutoSyncCheckbox.checked;
      ctx.safeSet(ctx.CONFIG.storageKeys.syncAutoEnabled, enabled ? "1" : "0");
      updateManualSyncButtonsVisibility();

      if (enabled) {
        // Odpal od razu, zamiast czekać do 5 minut na kolejny cykl
        // interwału (który wcześniej mógł już zostać zatrzymany).
        scheduleAutoSyncCheck();
      } else {
        // Realnie zatrzymaj timer, zamiast pozwolić mu dalej tykać co
        // 5 minut w tle i za każdym razem cichaczem nic nie robić.
        stopAutoSyncTimer();
      }
    });


    ctx.el.accountAvatarButton?.addEventListener("click", () => {
      ctx.el.accountProfileAvatarInput?.click();
    });

    ctx.el.accountProfileAvatarInput?.addEventListener("change", async () => {
      const file = ctx.el.accountProfileAvatarInput.files?.[0];
      if (!file) return;
      try {
        const rawDataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Nie udało się wczytać pliku."));
          reader.readAsDataURL(file);
        });
        // Ten sam mechanizm zmniejszania co przy teksturach, tylko do
        // mniejszego rozmiaru - to nadal tylko mały awatar, ale trochę
        // większy niż poprzednio.
        const resized = await downscaleImageDataUrl(rawDataUrl, 192, 0.7);
        ctx.el.accountProfileAvatarInput.value = "";
        await saveProfile(getStoredProfile().name, resized);
      } catch (error) {
        console.error(error);
        showAccountMessage(ctx.text[ctx.state.language].accountAvatarLoadFailed, "error");
      }
    });

    ctx.el.accountDisplayNameButton?.addEventListener("click", () => {
      if (!ctx.el.accountNameEditForm) return;
      const willOpen = ctx.el.accountNameEditForm.hidden;
      ctx.el.accountNameEditForm.hidden = !willOpen;
      if (willOpen) {
        ctx.el.accountProfileNameInput.value = getStoredProfile().name || "";
        ctx.el.accountProfileNameInput.focus();
        ctx.el.accountProfileNameInput.select();
      }
    });

    ctx.el.accountNameCancelButton?.addEventListener("click", () => {
      if (ctx.el.accountNameEditForm) ctx.el.accountNameEditForm.hidden = true;
    });

    ctx.el.accountNameSaveButton?.addEventListener("click", async () => {
      const name = (ctx.el.accountProfileNameInput?.value || "").trim().slice(0, 40);
      if (ctx.el.accountNameEditForm) ctx.el.accountNameEditForm.hidden = true;
      await saveProfile(name, getStoredProfile().avatar);
    });

    ctx.el.accountPublicId?.addEventListener("click", async () => {
      const fullId = ctx.el.accountPublicId?.dataset.fullId;
      if (!fullId) return;
      const t = ctx.text[ctx.state.language];
      try {
        await navigator.clipboard.writeText(fullId);
        showAccountMessage(t.accountCopiedId, "success");
      } catch (error) {
        console.error(error);
        showAccountMessage(t.accountCopyIdFailed, "error");
      }
    });

    ctx.el.accountLogoutButton?.addEventListener("click", handleLogoutAccount);

    ctx.el.accountActivityButton?.addEventListener("click", () => {
      showAccountScreen("activity");
      ctx.loadMyRatingsActivity();
    });
    ctx.el.accountActivityRefreshButton?.addEventListener("click", () => {
      ctx.loadMyRatingsActivity();
    });
  }


  window.OMAP_ACCOUNT = {
    configure,
    initializeEventListeners: initializeAccountEventListeners,
    openAccountFromMenu,
    returnFromAccountToMenu,
    closeAccount,
    showAccountMessage,
    clearAccountMessage,
    formatSyncTimestamp,
    showAccountScreen,
    isAutoSyncEnabled,
    updateManualSyncButtonsVisibility,
    getStoredProfile,
    storeProfileLocally,
    renderProfileUI,
    refreshAccountUI,
    getCheckedSyncScopes,
    buildSyncPayload,
    applySyncPayload,
    performPush,
    performPull,
    handlePushToCloud,
    handlePullFromCloud,
    stopAutoSyncTimer,
    scheduleAutoSyncCheck,
    autoSyncTick,
    saveProfile
  };
})();
