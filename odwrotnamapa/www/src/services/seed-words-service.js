(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-06) - przechowywanie i obsluga
  // slow-klucza (seed) konta: zapis/odczyt/usuwanie z localStorage,
  // renderowanie siatki slow, kopiowanie do schowka. NIE zawiera
  // reszty systemu konta/synchronizacji (79 funkcji lacznie w
  // app.js - dopisywanie/logowanie, Nostr, kryptografia, sync -
  // zbyt duzy i spleciony zeby wyciac w calosci).
  //
  // showAccountMessage zostaje w app.js (27 wywolan w calym pliku -
  // ogolne narzedzie komunikatow konta, uzywane wszedzie w systemie
  // sync, nie tylko tutaj), wstrzykiwane przez configure().

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function getStoredSeedWords() {
    try {
      const raw = localStorage.getItem(ctx.CONFIG.storageKeys.syncSeed);
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function storeSeedWords(words) {
    ctx.safeSet(ctx.CONFIG.storageKeys.syncSeed, JSON.stringify(words));
  }

  function clearStoredSeedWords() {
    localStorage.removeItem(ctx.CONFIG.storageKeys.syncSeed);
    localStorage.removeItem(ctx.CONFIG.storageKeys.syncLastSyncedAt);
  }
  function renderSeedWordsGrid(container, words) {
    if (!container) return;
    container.innerHTML = "";
    words.forEach(word => {
      const chip = document.createElement("span");
      chip.className = "account-seed-word";
      chip.textContent = word;
      container.appendChild(chip);
    });
  }

  async function copyWordsToClipboard(words) {
    const t = ctx.text[ctx.state.language];
    const phrase = words.join(" ");
    try {
      await navigator.clipboard.writeText(phrase);
      ctx.showAccountMessage(t.accountCopiedPhrase, "success");
    } catch (error) {
      console.error(error);
      ctx.showAccountMessage(t.accountCopyPhraseFailed, "error");
    }
  }


  window.OMAP_SEED_WORDS = {
    configure,
    getStoredSeedWords,
    storeSeedWords,
    clearStoredSeedWords,
    renderSeedWordsGrid,
    copyWordsToClipboard
  };
})();
