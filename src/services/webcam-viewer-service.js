(function () {
  "use strict";

  // Dedykowany panel podglądu kamery na żywo (sekcja "Odkrywaj" i
  // ewentualna warstwa kamer na mapie) - ten sam wzorzec co panel
  // widoku ulicznego w streetview-service.js: wysuwany "arkusz" z
  // przyciskiem pełnego ekranu, zamiast małej dymkowej popupki na
  // mapie. Różnica względem streetview: tu nie ma odtwarzacza WebGL
  // do inicjalizowania/przenoszenia - zawartością jest zwykły
  // <iframe> z linkiem embed z Windy Webcams API (player.live/day/...)
  // albo, gdy embed nie jest dostępny, statyczny obrazek podglądu.
  // Panel dziedziczy większość CSS po klasie .streetview-panel (patrz
  // index.html), więc zachowanie mobilne/pełnoekranowe jest identyczne
  // bez duplikowania tych reguł.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function isWebcamFullscreen() {
    return document.fullscreenElement === ctx.el.webcamPanel;
  }

  async function toggleWebcamFullscreen() {
    if (!ctx.el.webcamPanel) return;

    try {
      if (isWebcamFullscreen()) {
        await document.exitFullscreen();
      } else {
        await ctx.el.webcamPanel.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener("fullscreenchange", () => {
    if (!ctx) return;
    const active = isWebcamFullscreen();
    ctx.el.webcamFullscreenButton?.classList.toggle("is-active", active);
    ctx.el.webcamFullscreenButton?.setAttribute(
      "aria-pressed",
      String(active)
    );
    ctx.el.webcamPanel?.classList.toggle("is-fullscreen", active);
  });

  // Zatrzymuje ewentualne odtwarzanie/pobieranie w iframe przez
  // wyczyszczenie src (samo ukrycie elementu tego nie robi) - ten sam
  // powód, dla którego się to zawsze czyści przy zamykaniu/zmianie
  // kamery, a nie tylko przy odmontowaniu panelu.
  function clearWebcamContainer() {
    if (ctx.el.webcamContainer) ctx.el.webcamContainer.replaceChildren();
  }

  function openWebcam(webcam) {
    if (!ctx?.el.webcamPanel) return;

    ctx.closeOtherMobilePanels?.(["webcam"]);

    if (ctx.isMobilePanelViewport?.()) {
      ctx.setMobilePanelHeight?.(
        ctx.el.webcamPanel,
        "--sheet-height",
        ctx.getMobilePanelMaximumHeight?.(),
        { collapsed: false, mode: "expanded", animate: false }
      );
      ctx.el.webcamPanel.classList.remove("is-collapsed");
    }
    ctx.el.webcamPanel.hidden = false;
    ctx.el.webcamPanel.scrollTop = 0;

    const t = ctx.text?.[ctx.state?.language];
    if (ctx.el.webcamPanelTitle) {
      ctx.el.webcamPanelTitle.textContent =
        webcam.title || t?.webcamPanelTitle || "Kamera";
    }

    clearWebcamContainer();

    if (webcam.embedUrl) {
      const iframe = document.createElement("iframe");
      iframe.src = webcam.embedUrl;
      iframe.title = webcam.title || t?.webcamPanelTitle || "Kamera";
      iframe.className = "webcam-container-iframe";
      iframe.setAttribute("allow", "autoplay; fullscreen");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute(
        "sandbox",
        "allow-scripts allow-same-origin allow-popups"
      );
      ctx.el.webcamContainer?.appendChild(iframe);
    } else if (webcam.imageUrl) {
      const img = document.createElement("img");
      img.src = webcam.imageUrl;
      img.alt = webcam.title || t?.webcamPanelTitle || "Kamera";
      img.className = "webcam-container-image";
      ctx.el.webcamContainer?.appendChild(img);

      // Ta konkretna kamera nie ma dostępnego embeda (player.live/
      // day/...) w odpowiedzi Windy - część kamer w ich bazie to
      // tylko pojedyncze, okresowo odświeżane zdjęcia, bez
      // transmisji/timelapse'u. Pokazujemy to wprost zamiast udawać
      // "widok na żywo", żeby statyczny obrazek nie wyglądał jak
      // błąd.
      const note = document.createElement("span");
      note.className = "webcam-container-note";
      note.textContent =
        t?.webcamStaticPreview || "Statyczny podgląd (bez transmisji live)";
      ctx.el.webcamContainer?.appendChild(note);
    }

    // Wymagane przez warunki korzystania z darmowego API Windy - link
    // do windy.com/webcams musi być widoczny przy każdej pokazanej
    // kamerze.
    if (ctx.el.webcamPanelLink) {
      ctx.el.webcamPanelLink.href =
        webcam.link || "https://www.windy.com/webcams";
    }
  }

  function closeWebcam() {
    if (!ctx?.el.webcamPanel || ctx.el.webcamPanel.hidden) return;
    if (isWebcamFullscreen()) {
      document.exitFullscreen().catch(error => console.error(error));
    }
    ctx.el.webcamPanel.hidden = true;
    clearWebcamContainer();
  }

  function isWebcamOpen() {
    return Boolean(ctx?.el.webcamPanel && !ctx.el.webcamPanel.hidden);
  }

  window.OMAP_WEBCAM_VIEWER = {
    configure,
    open: openWebcam,
    close: closeWebcam,
    toggleFullscreen: toggleWebcamFullscreen,
    isOpen: isWebcamOpen
  };
})();
