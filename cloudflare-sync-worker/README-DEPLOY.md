# Wdrożenie Workera synchronizacji + proxy kluczy API (za darmo, bez własnego serwera)

Ten folder to osobna, mała usługa backendowa - **nie jest częścią**
statycznej strony w `www/`/katalogu głównym. Wdrażasz ją raz, osobno,
na darmowym koncie Cloudflare.

Worker robi teraz dwie niezależne rzeczy:

1. `/sync/...` - zero-knowledge sync ustawień (opisane niżej).
2. `/mapillary/tiles/{z}/{x}/{y}` i `/events` - proxy do Mapillary
   (warstwa pokrycia zdjęć poziomu ulicy) i Ticketmaster Discovery
   API (sekcja "Wydarzenia"). Dzięki temu klucze do tych dwóch usług
   nie muszą już siedzieć w `config.js` (a więc i w publicznym repo)
   - Worker trzyma je jako sekrety i dokleja do żądania po swojej
     stronie. Krok 3a poniżej pokazuje, jak je ustawić; jeśli nie
     korzystasz z Mapillary/Ticketmastera, możesz ten krok pominąć -
     odpowiednie sekcje appki po prostu pokażą komunikat "brak
     klucza", tak jak dotychczas.

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
3a. (Opcjonalnie, jeśli chcesz sekcji "Wydarzenia" - Ticketmaster
    i/lub PredictHQ, patrz `events` w `config.js`) Ustaw sekrety
    Workera - CLI zapyta o wartość interaktywnie, więc klucz nigdy
    nie trafia do pliku ani do historii poleceń:
    ```
    wrangler secret put TICKETMASTER_API_KEY
    wrangler secret put PREDICTHQ_TOKEN
    ```
    Ticketmaster: klucz ("Consumer Key") weź z
    https://developer.ticketmaster.com/. PredictHQ: zarejestruj
    darmowe konto na https://control.predicthq.com/signup i
    wygeneruj token w zakładce "Access Tokens". Możesz ustawić tylko
    jeden z dwóch sekretów - appka po prostu pokaże wyniki z tego
    jednego źródła. Uwaga: Mapillary (warstwa pokrycia i widok zdjęć
    poziomu ulicy) NIE idzie przez tego Workera - łączy się z
    Mapillary bezpośrednio z przeglądarki tokenem klienckim wpisanym
    wprost w `config.js` pod `mapillary.accessToken` (patrz komentarz
    przy tym polu), więc nie ma dla niego osobnego sekretu Workera.
3b. (Opcjonalnie, warstwa kamer na żywo) Ustaw sekret Windy:
    ```
    wrangler secret put WINDY_API_KEY
    ```
    Zarejestruj darmowe konto na https://api.windy.com/webcams i
    wygeneruj klucz w zakładce kluczy API. Bez tego sekretu przycisk
    kamer w appce po prostu nic nie pokaże (endpoint /webcams zwróci
    501) - reszta appki działa normalnie.
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
   `proxy.baseUrl`, np.:
   ```js
   proxy: {
     baseUrl: "https://odwrotnamapa-sync.twoja-nazwa.workers.dev"
   }
   ```
   Ten sam adres obsługuje zarówno sync, jak i (jeśli ustawiłeś
   sekrety w kroku 3a) proxy Ticketmastera/PredictHQ - nic więcej nie
   trzeba dopisywać, `config.js` już wie, jak z niego korzystać.
6. Uzupełnij `mapillary.accessToken` w `config.js` (token kliencki z
   https://www.mapillary.com/dashboard/developers), jeśli chcesz
   warstwy pokrycia i widoku zdjęć poziomu ulicy - to pole zawsze
   zostaje publiczne, proxy go nie dotyczy (patrz komentarz przy tym
   polu w `config.js`).
7. Wgraj zaktualizowany `config.js` na swój hosting - i gotowe,
   przycisk "Konto" (sync) oraz sekcja Wydarzenia w appce zaczną
   korzystać z Workera zamiast kluczy w kodzie.

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
- `/mapillary/tiles` i `/events` mają osobny rate-limit (60
  zapytań/minutę na adres IP) i CORS ograniczony do
  `odwrotnamapa.pl` - to ogranicza, ale NIE eliminuje ryzyka, że
  ktoś skryptem odpyta Twojego Workera bezpośrednio (z pominięciem
  przeglądarki, więc bez CORS) i zużyje część darmowego limitu
  Mapillary/Ticketmastera. Sam klucz jednak nigdy nie wycieka - w
  najgorszym razie ktoś zużyje limit zapytań, nie przejmie konta.
- Token wklejony w `config.js` pod `mapillary.accessToken` (dla
  panelu zdjęć poziomu ulicy) POZOSTAJE widoczny w przeglądarce -
  to nie jest błąd tej konfiguracji, tylko właściwość biblioteki
  mapillary-js, która sama łączy się z Mapillary z poziomu klienta.
  Zarejestruj dla niego osobną aplikację w panelu Mapillary, żeby
  jego ewentualny wyciek nie dotyczył pozostałych kluczy.
