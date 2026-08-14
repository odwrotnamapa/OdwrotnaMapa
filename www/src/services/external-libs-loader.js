// Wydzielone z index.html (2026-08-11) - byl to inline <script type="module">,
// a CSP w Electronie nie ma 'unsafe-inline' w script-src (celowo - to
// osłabiłoby ochronę dla całej reszty aplikacji). Same zewnętrzne pliki
// (nawet type="module") SĄ objęte przez 'self' bez potrzeby
// 'unsafe-inline', więc przeniesienie do osobnego pliku naprawia
// ładowanie tych bibliotek w Electronie bez osłabiania CSP.
//
// Ładujemy nostr-tools jako moduł ES z CDN (esm.sh) - tak samo jak
// MapLibre GL JS jest już ładowany z unpkg. Nie wymaga to żadnej
// rejestracji ani konta - to zwykła, publicznie dostępna biblioteka.
// Wystawiamy potrzebne funkcje jako zwykły obiekt globalny, żeby
// klasyczny (nie-modułowy) sync-transport-service.js mógł z nich
// skorzystać.
//
// NAPRAWA (2026-08-14): pojedyncza nieudana próba (chwilowy problem z
// CDN/siecią przy starcie strony) wcześniej blokowała oceny i
// komentarze NA STAŁE, do ręcznego przeładowania strony - kod nigdy
// więcej nie próbował załadować biblioteki. Do tego każde kolejne
// otwarcie panelu miejsca i tak czekało pełne 8s (patrz
// waitForNostrLib w sync-transport-service.js), zanim pokazało błąd.
// Teraz: (1) próby są ponawiane w tle z rosnącym odstępem, więc
// chwilowy problem sam się naprawia bez przeładowania strony, i
// (2) wystawiamy window.OMAP_NOSTR_LIB_READY - obietnicę z PIERWSZEJ
// próby, którą waitForNostrLib może wykorzystać, żeby nie czekać
// bezczynnie, gdy już wiadomo, że się nie udało.
let resolveNostrLibReady;
let rejectNostrLibReady;
window.OMAP_NOSTR_LIB_READY = new Promise((resolve, reject) => {
  resolveNostrLibReady = resolve;
  rejectNostrLibReady = reject;
});

async function loadNostrLibAttempt() {
  const [{ finalizeEvent, verifyEvent, getPublicKey }, { SimplePool }, { npubEncode }] = await Promise.all([
    import("https://esm.sh/nostr-tools@2/pure"),
    import("https://esm.sh/nostr-tools@2/pool"),
    import("https://esm.sh/nostr-tools@2/nip19")
  ]);
  return { finalizeEvent, verifyEvent, getPublicKey, SimplePool, npubEncode };
}

(async function loadNostrLibWithRetry(attempt) {
  try {
    const lib = await loadNostrLibAttempt();
    window.OMAP_NOSTR_LIB = lib;
    if (resolveNostrLibReady) {
      resolveNostrLibReady(lib);
      resolveNostrLibReady = null;
      rejectNostrLibReady = null;
    }
  } catch (error) {
    console.warn("Nie udało się załadować biblioteki nostr-tools (brak internetu?):", error);
    if (rejectNostrLibReady) {
      // Odrzucamy tylko RAZ, po pierwszej próbie - kod czekający na
      // OMAP_NOSTR_LIB_READY (waitForNostrLib) dostaje szybką
      // odpowiedź zamiast wisieć, ale my w tle próbujemy dalej.
      rejectNostrLibReady(error);
      resolveNostrLibReady = null;
      rejectNostrLibReady = null;
    }
    const delayMs = Math.min(60000, 3000 * 2 ** attempt);
    setTimeout(() => loadNostrLibWithRetry(attempt + 1), delayMs);
  }
})(0);

try {
  // Prawdziwa kompresja czcionek (TTF/OTF -> WOFF2) przed
  // synchronizacją, tym samym mechanizmem co reszta bibliotek:
  // https://github.com/itskyedo/woff2-encoder
  const { compress } = await import("https://esm.sh/woff2-encoder");
  window.OMAP_FONT_LIB = { compress };
} catch (error) {
  console.warn("Nie udało się załadować biblioteki do kompresji czcionek (brak internetu?):", error);
}
