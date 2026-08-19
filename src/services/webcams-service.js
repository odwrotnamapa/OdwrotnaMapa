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
  // parseWebcamsResponse/parseWebcamLocation poniżej.

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
    const image = webcam.image?.current || {};
    return image.preview || image.icon || image.thumbnail || null;
  }

  function parseWebcamLink(webcam) {
    return (
      webcam.url?.current?.desktop ||
      webcam.url?.current?.mobile ||
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
      element.addEventListener("click", () =>
        openWebcamPopup(webcam, position)
      );

      const marker = new maplibregl.Marker({ element, anchor: "center" })
        .setLngLat([position.lon, position.lat])
        .addTo(ctx.map);

      markers.push(marker);
    }
  }

  function openWebcamPopup(webcam, position) {
    closePopup();

    const container = document.createElement("div");
    container.className = "webcam-popup";

    const title = document.createElement("div");
    title.className = "webcam-popup-title";
    title.textContent = webcam.title || "Kamera";
    container.appendChild(title);

    const imageUrl = parseWebcamImageUrl(webcam);
    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = webcam.title || "Kamera";
      img.className = "webcam-popup-image";
      container.appendChild(img);
    }

    // Wymagane przez warunki korzystania z darmowego API Windy -
    // link do windy.com/webcams musi być widoczny przy każdej
    // pokazanej kamerze.
    const link = document.createElement("a");
    link.href = parseWebcamLink(webcam);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "webcam-popup-link";
    link.textContent = "windy.com/webcams";
    container.appendChild(link);

    activePopup = new maplibregl.Popup({ closeButton: true, offset: 18 })
      .setLngLat([position.lon, position.lat])
      .setDOMContent(container)
      .addTo(ctx.map);
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
