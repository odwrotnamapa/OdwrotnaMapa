(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - kontrolki widoku mapy: 3D,
  // lokalizacja, eksport do PNG, reset widoku. Ten sam wzorzec
  // configure() co pozostałe wyniesione moduły.
  //
  // Wszystkie cztery wyeksportowane funkcje są w app.js podpięte
  // jako REFERENCJE do addEventListener, nie wołane wprost.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function toggle3dView() {
    ctx.state.is3dView = !ctx.state.is3dView;

    ctx.map.easeTo({
      pitch: ctx.state.is3dView ? 60 : 0,
      duration: 500
    });

    ctx.el.toggle3dButton?.classList.toggle("is-active", ctx.state.is3dView);
    ctx.el.toggle3dButton?.setAttribute(
      "aria-pressed",
      String(ctx.state.is3dView)
    );
  }

  function locateFromMenu() {
    if (ctx.isElectronPlatform()) {
      ctx.show(
        ctx.state.language === "pl"
          ? "Pobieranie lokalizacji…"
          : "Getting your location…",
        0
      );

      ctx.fetchLocationByIp()
        .then(({ latitude, longitude }) => {
          ctx.showUserLocationMarker({ lng: longitude, lat: latitude });
          ctx.map.flyTo({
            center: [longitude, latitude],
            zoom: 11,
            bearing: 180
          });
          ctx.hide();
          if (ctx.map && typeof ctx.map.resize === "function") {
          ctx.map.resize();
}
        })
        .catch(error => {
          console.warn("Lokalizacja po IP nie powiodła się.", error);
          ctx.show(
            ctx.state.language === "pl"
              ? "Nie udało się pobrać lokalizacji."
              : "Your location could not be retrieved."
          );
        });
      return;
    }

    if (!navigator.geolocation) {
      ctx.show(
        ctx.state.language === "pl"
          ? "Twoja przeglądarka nie obsługuje lokalizacji."
          : "Your browser does not support geolocation."
      );
      return;
    }

    ctx.show(
      ctx.state.language === "pl"
        ? "Pobieranie lokalizacji…"
        : "Getting your location…",
      0
    );

let hasPannedToUser = false; // Zapobiega ciągłemu przeskakiwaniu mapy!

  if (window.userLocationWatchId) {
    navigator.geolocation.clearWatch(window.userLocationWatchId);
  }

  window.userLocationWatchId = navigator.geolocation.watchPosition(
    position => {
      const lon = position.coords.longitude;
      const lat = position.coords.latitude;
      const lngLat = new maplibregl.LngLat(lon, lat);

      // 1. Zawsze aktualizujemy tylko pozycję samej niebieskiej kropki
      ctx.showUserLocationMarker(lngLat);

      // 2. Mapę centrujemy TYLKO PIERWSZY RAZ!
      // Gdy GPS skoryguje pozycję po kilku sekundach, kropka się przesunie, ale mapa NIE PRZESKOCZY.
      if (!hasPannedToUser) {
        hasPannedToUser = true;

        ctx.map.flyTo({
          center: [lon, lat],
          zoom: Math.max(ctx.map.getZoom(), 15),
          bearing: ctx.map.getBearing() // Utrzymuje obecny obrót (np. 180°), zapobiegając "fikołkowi" mapy
        });

        ctx.hide();

        requestAnimationFrame(() => {
          if (ctx.map && typeof ctx.map.resize === "function") {
            ctx.map.resize();
          }
        });
      }
    },
    error => {
      console.error(error);
      ctx.show(
        ctx.state.language === "pl"
          ? "Nie udało się pobrać lokalizacji."
          : "Your location could not be retrieved."
      );
    },
    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0 // Zmusza do natychmiastowego pobrania świeżego punktu z czujnika
    }
  );
  }

  function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result || "";
        resolve(String(result).split(",")[1] || "");
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  function exportMapAsPng() {
    const t = ctx.text[ctx.state.language];

    ctx.show(t.exportPngWorking, 0);

    try {
      ctx.map.once("render", () => {
        const canvas = ctx.map.getCanvas();

        canvas.toBlob(async blob => {
          if (!blob) {
            ctx.show(t.exportPngError);
            return;
          }

          const fileName = `odwrotna-mapa-${Date.now()}.png`;

          // Android WebView nie obsługuje niezawodnie pobierania
          // plików przez <a download> ani udostępniania blobów -
          // tam zapisujemy plik natywnie i otwieramy systemowe
          // okno udostępniania/zapisu, tak jak przy kopii zapasowej.
          if (
            window.CapacitorPlatform === "android" &&
            window.CapacitorFilesystem
          ) {
            try {
              const base64 = await blobToBase64(blob);
              const writeResult = await window.CapacitorFilesystem.writeFile({
                path: fileName,
                data: base64,
                directory: window.CapacitorDirectory.Cache
              });

              await window.CapacitorShare.share({
                title: fileName,
                files: [writeResult.uri]
              });
              ctx.show(t.exportPngDone);
            } catch (error) {
              console.error(error);
              ctx.show(t.exportPngError);
            }
            return;
          }

          const file = new File([blob], fileName, {
            type: "image/png"
          });

          // Safari na iOS nie obsługuje poprawnie atrybutu
          // download - tam trzeba użyć natywnego arkusza
          // udostępniania, żeby dało się zapisać obrazek.
          if (
            navigator.canShare &&
            navigator.canShare({ files: [file] })
          ) {
            try {
              await navigator.share({ files: [file] });
              ctx.show(t.exportPngDone);
              return;
            } catch (error) {
              if (error?.name === "AbortError") {
                ctx.hide();
                return;
              }
              console.error(error);
            }
          }

          try {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            ctx.show(t.exportPngDone);
          } catch (error) {
            console.error(error);
            ctx.show(t.exportPngError);
          }
        }, "image/png");
      });
      ctx.map.triggerRepaint();
    } catch (error) {
      console.error(error);
      ctx.show(t.exportPngError);
    }
  }

  function clearMapView() {
    ctx.closeMapContextMenu();
    ctx.clearRoute();
    window.OMAP_DISCOVER?.clear();
    ctx.removeContextPointMarker();
    ctx.removeUserLocationMarker();
    ctx.hideAllAutocomplete();

    ctx.closeOtherMobilePanels([]);

    ctx.show(ctx.text[ctx.state.language].mapCleared);
  }

  window.OMAP_MAPVIEW = {
    configure,
    toggle3d: toggle3dView,
    locate: locateFromMenu,
    exportPng: exportMapAsPng,
    clear: clearMapView
  };
})();
