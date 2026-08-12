(function () {
  "use strict";

  // Maly, zawsze widoczny widget pogody w lewym gornym rogu (pod
  // paskiem narzedzi). Lokalizacja: najpierw krotka proba GPS (zeby
  // nie trzymac appki w oczekiwaniu na decyzje uzytkownika w oknie
  // przegladarki zbyt dlugo), a jak sie nie uda / user odmowi -
  // spada na srodek aktualnego widoku mapy. Dane pogodowe z
  // Open-Meteo (https://open-meteo.com) - publiczne API bez klucza,
  // ten sam wzorzec "zero nowych zaleznosci" co reszta appki
  // (Valhalla, Nominatim, Overpass, ipwho.is).
  //
  // Element tworzony jest w calosci z JS (appendChild do body), zeby
  // wlaczenie tego widgetu nie wymagalo zadnych zmian w HTML.
  //
  // Pozycja jest w calosci z CSS (.weather-widget w style.css) -
  // zawsze przy lewej krawedzi, bez wyliczania jej w JS. Wczesniej
  // widget byl na desktopie centrowany pod #brand-button, co po
  // zgloszeniu wygladalo jak "lewitowanie po srodku" zamiast trzymania
  // sie krawedzi - stad usuniete.

  let ctx = null;
  let widgetEl = null;
  let iconEl = null;
  let tempEl = null;
  let refreshTimer = null;

  let lastCoords = null; // { lat, lon } wg ktorych ostatnio pobrano pogode
  let lastFetchedAt = 0;
  let usingGps = false;

  const GEOLOCATION_TIMEOUT_MS = 6000;
  const REFRESH_INTERVAL_MS = 20 * 60 * 1000; // odswiez dane co 20 min
  const MOVE_REFRESH_MIN_INTERVAL_MS = 5 * 60 * 1000; // ...ale nie czesciej niz co 5 min z powodu ruchu mapy
  const MOVE_REFRESH_MIN_DISTANCE_KM = 15; // ...i tylko jesli mapa przesunela sie odczuwalnie

  // Kody pogodowe WMO (jak zwraca je Open-Meteo) -> emoji.
  const WEATHER_ICONS = {
    0: "☀️",
    1: "🌤️",
    2: "⛅",
    3: "☁️",
    45: "🌫️",
    48: "🌫️",
    51: "🌦️",
    53: "🌦️",
    55: "🌦️",
    56: "🌧️",
    57: "🌧️",
    61: "🌧️",
    63: "🌧️",
    65: "🌧️",
    66: "🌧️",
    67: "🌧️",
    71: "🌨️",
    73: "🌨️",
    75: "🌨️",
    77: "🌨️",
    80: "🌦️",
    81: "🌧️",
    82: "⛈️",
    85: "🌨️",
    86: "🌨️",
    95: "⛈️",
    96: "⛈️",
    99: "⛈️"
  };

  function configure(newCtx) {
    ctx = newCtx;
  }

  function haversineKm(a, b) {
    const R = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLon = ((b.lon - a.lon) * Math.PI) / 180;
    const lat1 = (a.lat * Math.PI) / 180;
    const lat2 = (b.lat * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(h));
  }

  function buildWidget() {
    if (widgetEl) return;

    widgetEl = document.createElement("button");
    widgetEl.type = "button";
    widgetEl.id = "weather-widget";
    widgetEl.className = "weather-widget";
    // Chowamy do pierwszego udanego odczytu - lepiej nic niz puste/
    // mylace "--" przez chwile po starcie appki.
    widgetEl.hidden = true;

    iconEl = document.createElement("span");
    iconEl.className = "weather-widget-icon";
    iconEl.setAttribute("aria-hidden", "true");
    iconEl.textContent = "🌡️";

    tempEl = document.createElement("span");
    tempEl.className = "weather-widget-temp";

    widgetEl.append(iconEl, tempEl);
    document.body.appendChild(widgetEl);

    // Klik = reczne odswiezenie z nowa proba GPS - przydatne np. gdy
    // uzytkownik dopiero co zezwolil na lokalizacje w przegladarce,
    // a widget zdazyl juz wystartowac na centrum mapy.
    widgetEl.addEventListener("click", () => {
      resolveLocationAndFetch(true);
    });
  }

  function render(data) {
    if (!widgetEl) return;
    const emoji = WEATHER_ICONS[data.weatherCode] ?? "🌡️";
    const isEnglish = ctx?.state?.language === "en";

    iconEl.textContent = emoji;
    tempEl.textContent = `${Math.round(data.temperature)}°C`;
    widgetEl.title = usingGps
      ? isEnglish
        ? "Weather at your location (tap to refresh)"
        : "Pogoda w Twojej lokalizacji (kliknij, aby odświeżyć)"
      : isEnglish
        ? "Weather at map center (tap to refresh)"
        : "Pogoda w środku widoku mapy (kliknij, aby odświeżyć)";
    widgetEl.hidden = false;
  }

  async function fetchWeather(coords) {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", coords.lat.toFixed(4));
    url.searchParams.set("longitude", coords.lon.toFixed(4));
    url.searchParams.set("current", "temperature_2m,weather_code");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo HTTP ${response.status}`);
    }

    const payload = await response.json();
    const current = payload.current;
    if (!current || typeof current.temperature_2m !== "number") {
      throw new Error("Open-Meteo: brak danych 'current' w odpowiedzi.");
    }

    return {
      temperature: current.temperature_2m,
      weatherCode: current.weather_code
    };
  }

  // Jednorazowa, krotka proba GPS - null jesli niedostepne, odrzucone
  // przez uzytkownika, albo nie zdazylo odpowiedziec w porę (wtedy i
  // tak spadamy na srodek mapy zamiast trzymac widget pusty).
  function getGpsPosition() {
    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      let settled = false;
      const timeoutId = setTimeout(() => {
        if (settled) return;
        settled = true;
        resolve(null);
      }, GEOLOCATION_TIMEOUT_MS);

      navigator.geolocation.getCurrentPosition(
        position => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: GEOLOCATION_TIMEOUT_MS,
          maximumAge: 10 * 60 * 1000
        }
      );
    });
  }

  async function resolveLocationAndFetch(forceGpsRetry = false) {
    if (!ctx?.map) return;

    let coords = null;

    // Nie pytamy o GPS przy kazdym automatycznym odswiezeniu, jesli
    // juz raz sie nie udalo - tylko przy starcie i na reczny klik
    // (forceGpsRetry), zeby nie meczyc przegladarki/uzytkownika
    // powtarzanymi promptami co 20 minut.
    if (forceGpsRetry || !usingGps) {
      coords = await getGpsPosition();
    }

    if (coords) {
      usingGps = true;
    } else {
      usingGps = false;
      const center = ctx.map.getCenter();
      coords = { lat: center.lat, lon: center.lng };
    }

    lastCoords = coords;
    lastFetchedAt = Date.now();

    try {
      const data = await fetchWeather(coords);
      render(data);
    } catch (err) {
      console.warn("Pogoda: nie udało się pobrać danych.", err);
      // Nie chowamy widgetu, jesli mial juz wczesniej poprawne dane -
      // lepsza chwilowo nieaktualna temperatura niz nagle znikniecie.
    }
  }

  // Gdy dzialamy na centrum mapy (brak GPS), warto odswiezyc pogode
  // przy wiekszym przesunieciu widoku - ale z ograniczeniem
  // czestotliwosci, zeby przewijanie mapy nie odpalalo zapytan na
  // kazdy "moveend".
  function maybeRefreshOnMapMove() {
    if (usingGps || !lastCoords || !ctx?.map) return;

    const center = ctx.map.getCenter();
    const now = Date.now();
    const distanceKm = haversineKm(lastCoords, {
      lat: center.lat,
      lon: center.lng
    });

    if (
      now - lastFetchedAt >= MOVE_REFRESH_MIN_INTERVAL_MS &&
      distanceKm >= MOVE_REFRESH_MIN_DISTANCE_KM
    ) {
      resolveLocationAndFetch();
    }
  }

  function init() {
    if (!ctx?.map) return;

    buildWidget();
    resolveLocationAndFetch();

    ctx.map.on("moveend", maybeRefreshOnMapMove);

    if (refreshTimer) clearInterval(refreshTimer);
    refreshTimer = setInterval(
      () => resolveLocationAndFetch(),
      REFRESH_INTERVAL_MS
    );
  }

  window.OMAP_WEATHER = {
    configure,
    init
  };
})();
