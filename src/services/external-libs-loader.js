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
try {
  const [{ finalizeEvent, verifyEvent, getPublicKey }, { SimplePool }, { npubEncode }] = await Promise.all([
    import("https://esm.sh/nostr-tools@2/pure"),
    import("https://esm.sh/nostr-tools@2/pool"),
    import("https://esm.sh/nostr-tools@2/nip19")
  ]);
  window.OMAP_NOSTR_LIB = { finalizeEvent, verifyEvent, getPublicKey, SimplePool, npubEncode };
} catch (error) {
  console.warn("Nie udało się załadować biblioteki nostr-tools (brak internetu?):", error);
}

try {
  // Prawdziwa kompresja czcionek (TTF/OTF -> WOFF2) przed
  // synchronizacją, tym samym mechanizmem co reszta bibliotek:
  // https://github.com/itskyedo/woff2-encoder
  const { compress } = await import("https://esm.sh/woff2-encoder");
  window.OMAP_FONT_LIB = { compress };
} catch (error) {
  console.warn("Nie udało się załadować biblioteki do kompresji czcionek (brak internetu?):", error);
}
