(function () {
  "use strict";

  // Warstwa kamer na żywo (widokowe/turystyczne: góry, rynki miast,
  // plaże) - wyłącznie Polska. Dane z Windy Webcams API v3, ale
  // NIGDY nie woła się do Windy bezpośrednio z przeglądarki - appka
  // to czysty klient bez backendu poza istniejącym
  // cloudflare-sync-worker, więc klucz API musiałby wtedy siedzieć w
  // kodzie JS, gdzie każdy mógłby go wyciągnąć. Zamiast tego appka
  // pyta `${CONFIG.proxy.baseUrl}/webcams`, a to ten Worker dokleja
  // sekret WINDY_API_KEY po swojej stronie (patrz
  // cloudflare-sync-worker/sync-worker.js, handleWebcamsProxy) - ten
  // sam wzorzec co sekcja "Wydarzenia" (Ticketmaster/PredictHQ).
  //
  // UWAGA dot. kształtu odpowiedzi: Windy Webcams API v3 nie ma tu
  // jeszcze przetestowanej na żywo odpowiedzi (brak środowiska do
  // tego) - parsowanie niżej opiera się na oficjalnej dokumentacji i
  // przykładach społeczności, sprawdzane defensywnie pod kilkoma
  // wariantami nazw pól. Jeśli kamery się nie pokazują mimo
  // skonfigurowanego WINDY_API_KEY, pierwszy krok to podejrzenie
  // prawdziwej odpowiedzi JSON w devtoolach (zakładka Network,
  // zapytanie do .../webcams) i porównanie z tym, co czyta
  // parseWebcamsResponse/parseWebcamLocation poniżej. Dotyczy to też
  // pola "player" (parseWebcamEmbedUrl) - to z niego bierze się link
  // do faktycznego okna z nagraniem/live pokazywanego w popupie,
  // zamiast samego statycznego obrazka podglądu.

  let ctx = null;
  let markers = [];
  let active = false;
  let fetchController = null;
  let moveEndHandler = null;
  let activePopup = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function clearMarkers() {
    for (const marker of markers) marker.remove();
    markers = [];
  }

  function closePopup() {
    activePopup?.remove();
    activePopup = null;
  }

  // Promień zapytania (km) z grubsza dopasowany do tego, ile widać
  // na ekranie przy danym zoomie - im bardziej oddalone, tym większy
  // promień, z sensownymi widełkami góra/dół.
  function radiusForZoom(zoom) {
    return Math.max(5, Math.min(300, Math.round(400 / Math.pow(1.5, zoom - 6))));
  }

  function parseWebcamLocation(webcam) {
    const location = webcam.location || {};
    const lat = location.latitude ?? location.lat;
    const lon = location.longitude ?? location.lng ?? location.lon;
    if (typeof lat !== "number" || typeof lon !== "number") return null;
    return { lat, lon };
  }

  function parseWebcamsResponse(data) {
    if (Array.isArray(data)) return data;
    return data?.webcams || data?.data || data?.result?.webcams || [];
  }

  function parseWebcamImageUrl(webcam) {
    const image = webcam.image?.current || webcam.images?.current || {};
    return image.preview || image.icon || image.thumbnail || null;
  }

  // Link do osadzenia kamery jako <iframe> (żywy podgląd zamiast
  // samego statycznego obrazka), z pola "player" odpowiedzi Windy
  // Webcams API v3. Wg dokumentacji każdy wpis (live/day/month/
  // year/lifetime) to bezpośrednio string z linkiem embed - sprawdzane
  // defensywnie też starsze/alternatywne kształty w stylu v2
  // ({ embed, available }), na wypadek gdyby API zwracało coś innego
  // niż dokumentacja (patrz uwaga na górze pliku). Preferowany jest
  // "live", z fallbackiem na kolejne dostępne timespany.
  function parseWebcamEmbedUrl(webcam) {
    const player = webcam.player;
    if (player && typeof player === "object") {
      for (const key of ["live", "day", "month", "year", "lifetime"]) {
        const entry = player[key];
        if (!entry) continue;
        if (typeof entry === "string") return entry;
        if (typeof entry === "object") {
          const embed = entry.embed || entry.url || entry.link;
          if (typeof embed === "string" && (entry.available ?? true)) {
            return embed;
          }
        }
      }
    }

    // Fallback, gdy pole "player" jest puste/nieobecne - patrz
    // komentarz przy identycznej funkcji w discover-service.js.
    const id = webcam.webcamId ?? webcam.id;
    if (id) return `https://webcams.windy.com/webcams/public/embed/player/${id}/day`;

    return null;
  }

  function parseWebcamLink(webcam) {
    return (
      webcam.url?.current?.desktop ||
      webcam.url?.current?.mobile ||
      webcam.urls?.detail ||
      (webcam.id ? `https://www.windy.com/webcams/${webcam.id}` : "https://www.windy.com/webcams")
    );
  }

  async function fetchAndRenderWebcams() {
    if (!active || !ctx?.map) return;

    const proxyBaseUrl = ctx.CONFIG.proxy?.baseUrl;
    if (!proxyBaseUrl) {
      console.warn("Kamery: brak skonfigurowanego CONFIG.proxy.baseUrl.");
      return;
    }

    fetchController?.abort();
    fetchController = new AbortController();

    const center = ctx.map.getCenter();
    const radius = radiusForZoom(ctx.map.getZoom());

    const url = new URL(`${proxyBaseUrl}/webcams`);
    url.searchParams.set("lat", center.lat.toFixed(4));
    url.searchParams.set("lon", center.lng.toFixed(4));
    url.searchParams.set("radius", String(radius));

    let data;
    try {
      const response = await fetch(url, { signal: fetchController.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Kamery: błąd pobierania listy kamer:", error);
      return;
    }

    if (!active) return; // wyłączone w trakcie oczekiwania na odpowiedź

    clearMarkers();

    for (const webcam of parseWebcamsResponse(data)) {
      const position = parseWebcamLocation(webcam);
      if (!position) continue;

      const element = document.createElement("button");
      element.type = "button";
      element.className = "webcam-marker";
      element.textContent = "📷";
      element.title = webcam.title || "Kamera";
      element.addEventListener("click", () => openWebcamPopup(webcam));

      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([position.lon, position.lat])
        .addTo(ctx.map);

      markers.push(marker);
    }
  }

  function openWebcamPopup(webcam) {
    closePopup();
    window.OMAP_WEBCAM_VIEWER?.open({
      title: webcam.title || "Kamera",
      embedUrl: parseWebcamEmbedUrl(webcam),
      imageUrl: parseWebcamImageUrl(webcam),
      link: parseWebcamLink(webcam)
    });
  }

  // Włącza/wyłącza warstwę, zwraca nowy stan (true = włączona) - do
  // ustawiania aria-pressed na przycisku w app.js.
  function toggle() {
    active = !active;
    if (active) {
      fetchAndRenderWebcams();
      moveEndHandler = () => fetchAndRenderWebcams();
      ctx.map.on("moveend", moveEndHandler);
    } else {
      if (moveEndHandler) ctx.map.off("moveend", moveEndHandler);
      moveEndHandler = null;
      fetchController?.abort();
      clearMarkers();
      closePopup();
    }
    return active;
  }

  function isActive() {
    return active;
  }

  window.OMAP_WEBCAMS = {
    configure,
    toggle,
    isActive
  };
})();
