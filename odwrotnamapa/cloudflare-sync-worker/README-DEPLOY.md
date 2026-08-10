# Wdrożenie Workera synchronizacji (za darmo, bez własnego serwera)

Ten folder to osobna, mała usługa backendowa - **nie jest częścią**
statycznej strony w `www/`/katalogu głównym. Wdrażasz ją raz, osobno,
na darmowym koncie Cloudflare.

## Dlaczego Cloudflare Workers?

- Darmowy plan: 100 000 requestów/dzień, więcej niż wystarczy.
- Zero utrzymania serwera - nie musisz nic administrować.
- KV (magazyn klucz-wartość) idealnie pasuje do tego, czego
  potrzebujemy: `accountId -> zaszyfrowany blob`.

## Kroki

1. Załóż darmowe konto na https://dash.cloudflare.com/sign-up (jeśli
   jeszcze nie masz).
2. Zainstaluj CLI Wranglera (wymaga Node.js):
   ```
   npm install -g wrangler
   wrangler login
   ```
3. W tym folderze utwórz magazyn KV:
   ```
   wrangler kv namespace create SYNC_KV
   ```
   Polecenie wypisze coś w stylu:
   ```
   { binding = "SYNC_KV", id = "abcd1234..." }
   ```
   Skopiuj `id` i wklej je w `wrangler.toml` w miejsce
   `WKLEJ_TU_ID_NAMESPACE`.
4. Wdróż Workera:
   ```
   wrangler deploy
   ```
   Po chwili dostaniesz adres w stylu:
   ```
   https://odwrotnamapa-sync.<twoja-nazwa>.workers.dev
   ```
   (Możesz też podpiąć własną subdomenę, np.
   `sync.odwrotnamapa.pl`, w panelu Cloudflare - Workers Routes -
   ale to opcjonalne, adres `workers.dev` działa od razu.)
5. Wklej ten adres do `config.js` (i w `www/config.js`) w polu
   `sync.apiBaseUrl`, np.:
   ```js
   sync: {
     apiBaseUrl: "https://odwrotnamapa-sync.twoja-nazwa.workers.dev",
     wordCount: 16
   }
   ```
6. Wgraj zaktualizowany `config.js` na swój hosting - i gotowe,
   przycisk "Konto" w appce zacznie faktycznie synchronizować.

## Co warto wiedzieć o bezpieczeństwie tego rozwiązania

- Worker przechowuje **wyłącznie zaszyfrowany ciąg znaków**.
  Nawet gdyby ktoś się włamał na Twoje konto Cloudflare i podejrzał
  zawartość KV, zobaczyłby tylko nieczytelny, zaszyfrowany tekst
  dla każdego użytkownika - nie dane, nie seed.
- `accountId` to hash SHA-256 seeda użytkownika - nie da się z
  niego odtworzyć seeda, ale zna go tylko ten, kto ma seed
  (praktycznie niemożliwe do zgadnięcia losowo).
- Prosty rate-limit (20 zapisów/minutę na konto) ogranicza
  najprostsze próby nadpisywania cudzych danych, gdyby ktoś
  jednak trafił/poznał czyjeś `accountId`.
- To NIE jest ochrona przed atakiem typu "podmiana na starszą,
  ale poprawnie zaszyfrowaną wersję danych" (replay) - to
  świadomy kompromis dla prostoty. Jeśli kiedyś będzie to
  problemem, można dodać po stronie klienta sprawdzanie, czy
  pobrany `updatedAt` nie jest starszy niż ostatnio znany.
