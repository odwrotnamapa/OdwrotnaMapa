(function () {
  "use strict";

  // Wyodrebnione z app.js (2026-08-09) - caly system Tras: planowanie,
  // obliczanie (auto/transit), waypointy, kierunki/manewry, znaczniki
  // na mapie, udostepnianie, eksport/import GPX, integracja z
  // ulubionymi trasami. Najwiekszy dotad wyniesiony modul, w JEDENASTU
  // nieciaglych fragmentach oryginalnego app.js (bardziej rozproszony
  // niz Ulubione czy Konto).
  //
  // WAZNE ZNALEZISKO: poczatkowy przeglad funkcji lapal tylko kod z
  // DOKLADNIE dwuspacjowym wcieciem - kilka funkcji w oryginalnym
  // pliku ma zerowe wciecie (closeRoute, swapRoutePoints,
  // handleRouteMapClick, updateRouteClickHint, calculateRouteFromStoredPoints,
  // drawRoute, exportRouteAsGpx, importRouteFromGpx) i zostaly pominiete
  // w pierwszym mapowaniu - znalezione dopiero przy drugim, szerszym
  // przeszukaniu (`^function \|^async function `, bez wymogu wciecia).
  //
  // isRouteLayer i resultToRoutePoint MIMO nazwy z "Route" zostaly
  // swiadomie WYKLUCZONE z zakresu - pierwsza jest uzywana wylacznie
  // przez kolorowanie warstw motywu, druga wylacznie przez
  // autocomplete/podpowiedzi wyszukiwania - zadna z nich nie jest
  // faktycznie wolana przez logike tras.
  //
  // calculateRouteFromStoredPoints ZOSTAJE w app.js (uzywana szeroko
  // poza trasami - autocomplete, przeciaganie znacznikow, sync) ale
  // sama W SOBIE woli WIELE funkcji z tego modulu (fetchRoute,
  // drawRoute, getSelectedRouteMode, updateRouteSummary,
  // renderRouteDirections) - stad wstrzykiwana przez configure() jak
  // kazda inna zewnetrzna zaleznosc.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function toggleRoute() {
    ctx.closeMapContextMenu();
    const shouldOpen = ctx.el.routePanel.hidden;
    ctx.closeOtherMobilePanels("route");
    ctx.closePlacePopup();
    if (!shouldOpen) {
      ctx.state.routeBackContext = null;
      if (ctx.el.routeBack) ctx.el.routeBack.hidden = true;
    }
    ctx.el.routePanel.hidden = !shouldOpen;
    if (shouldOpen) {
      ctx.openMobilePanelStandard(ctx.el.routePanel, "--sheet-height");
    }
    
    ctx.el.routeButton?.setAttribute("aria-expanded", String(shouldOpen));
    ctx.el.routeButton?.classList.toggle("is-active", shouldOpen);
    ctx.el.mobileRouteButton?.setAttribute("aria-expanded", String(shouldOpen));
    ctx.el.mobileRouteButton?.classList.toggle("is-active", shouldOpen);
ctx.el.routeButton?.setAttribute("aria-expanded", String(shouldOpen));

    if (shouldOpen) {
      ctx.state.routeClickStage = ctx.state.routePointA
        ? (ctx.state.routePointB ? "move-b" : "b")
        : "a";
      document.body.classList.add("map-picking-route");
      ctx.updateRouteClickHint();
    } else {
      document.body.classList.remove("map-picking-route");
    }
  }

  function returnFromRouteToPlace() {
    const context = ctx.state.routeBackContext;
    if (!context) return;

    ctx.state.routeBackContext = null;
    closeRoute();

    window.OMAP_PLACE_SERVICE.open(
      {
        ...context.place,
        lat: Number(context.lngLat.lat),
        lon: Number(context.lngLat.lng)
      },
      { source: "route-nearby" }
    );
  }

  function closeRoutePanel() {
    if (ctx.el.routePanel.hidden) return;
    clearRoute();
    ctx.state.routeBackContext = null;
    if (ctx.el.routeBack) ctx.el.routeBack.hidden = true;
    ctx.el.routePanel.hidden = true;
    ctx.el.routeButton?.setAttribute("aria-expanded","false");
  }

function closeRoute() {
    if (ctx.el.routePanel.hidden) return;
    clearRoute();
    ctx.hideAllAutocomplete();
    ctx.state.routeBackContext = null;
    if (ctx.el.routeBack) ctx.el.routeBack.hidden = true;
    ctx.el.routePanel.hidden = true;
    ctx.el.routeButton?.setAttribute("aria-expanded", "false");
    ctx.el.routeButton?.classList.remove("is-active");
    ctx.el.mobileRouteButton?.setAttribute("aria-expanded", "false");
    ctx.el.mobileRouteButton?.classList.remove("is-active");
    document.body.classList.remove("map-picking-route");
  }

function swapRoutePoints() {
    const value = ctx.el.routeFrom.value;
    ctx.el.routeFrom.value = ctx.el.routeTo.value;
    ctx.el.routeTo.value = value;

    const point = ctx.state.routePointA;
    ctx.state.routePointA = ctx.state.routePointB;
    ctx.state.routePointB = point;

    // ODWRACA KOLEJNOŚĆ PRZYSTANKÓW
    ctx.state.routeWaypoints.reverse();

    refreshRouteMarkers();
    refreshWaypointMarkers();
    renderRouteWaypoints();

    if (ctx.state.routePointA && ctx.state.routePointB) {
        ctx.calculateRouteFromStoredPoints();
    }

    ctx.state.routeClickStage = ctx.state.routePointA
        ? (ctx.state.routePointB ? "move-b" : "b")
        : "a";
    ctx.updateRouteClickHint();
}

  async function setContextPointAsRoute(key, lngLat) {
    if (!lngLat) return;

    const point = {
      lon: lngLat.lng,
      lat: lngLat.lat,
      label: ctx.formatCoordinates(lngLat.lng, lngLat.lat)
    };

    try {
      point.label = await reverseGeocodeRoutePoint(point);
    } catch (error) {
      console.warn("Context route reverse geocoding failed.", error);
    }

    if (ctx.el.routePanel.hidden) {
      toggleRoute();
    }

    if (key === "a") {
      ctx.state.routePointA = point;
      if (ctx.el.routeFrom) ctx.el.routeFrom.value = point.label;
      setRouteMarker("a", point);
    } else {
      ctx.state.routePointB = point;
      if (ctx.el.routeTo) ctx.el.routeTo.value = point.label;
      setRouteMarker("b", point);
    }

    ctx.state.routeClickStage = ctx.state.routePointA
      ? (ctx.state.routePointB ? "move-b" : "b")
      : "a";

    ctx.updateRouteClickHint();

    if (ctx.state.routePointA && ctx.state.routePointB) {
      await ctx.calculateRouteFromStoredPoints();
    }
  }
  function collapseMobileRoutePanel() {
    ctx.collapseMobilePanel(
      ctx.el.routePanel,
      "--sheet-height"
    );
  }

  function expandMobileRoutePanel() {
    ctx.openMobilePanelStandard(
      ctx.el.routePanel,
      "--sheet-height"
    );
  }
  function currentRouteFavoriteKey() {
    if (!ctx.state.routePointA || !ctx.state.routePointB) return null;
    return window.OMAP_ROUTE_HISTORY?.buildRouteKey(ctx.state.routePointA, ctx.state.routePointB, getSelectedRouteMode());
  }

  function updateRouteSaveFavoriteButton() {
    if (!ctx.el.routeSaveFavoriteButton) return;
    const key = currentRouteFavoriteKey();
    const isSaved = key && ctx.state.routeFavorites.some(item => item.key === key);
    const t = ctx.text[ctx.state.language];
    ctx.el.routeSaveFavoriteButton.textContent = isSaved
      ? `★ ${t.routeSavedFavorite}`
      : `☆ ${t.routeSaveFavorite}`;
    ctx.el.routeSaveFavoriteButton.classList.toggle("is-active", Boolean(isSaved));
  }

  function toggleCurrentRouteFavorite() {
    if (!window.OMAP_SEED_WORDS?.getStoredSeedWords()) {
      window.OMAP_ACCOUNT?.openAccountFromMenu();
      return;
    }
    const key = currentRouteFavoriteKey();
    if (!key) return;

    const existingIndex = ctx.state.routeFavorites.findIndex(item => item.key === key);
    if (existingIndex !== -1) {
      ctx.state.routeFavorites.splice(existingIndex, 1);
    } else {
      ctx.state.routeFavorites = [
        {
          key,
          fromLabel: ctx.state.routePointA.label || "",
          toLabel: ctx.state.routePointB.label || "",
          fromLat: Number(ctx.state.routePointA.lat),
          fromLon: Number(ctx.state.routePointA.lon),
          toLat: Number(ctx.state.routePointB.lat),
          toLon: Number(ctx.state.routePointB.lon),
          mode: getSelectedRouteMode(),
          distance: ctx.state.lastRouteDistance || 0,
          duration: ctx.state.lastRouteDuration || 0,
          customName: "",
          folder: "",
          savedAt: new Date().toISOString()
        },
        ...ctx.state.routeFavorites
      ];
    }

    window.OMAP_ROUTE_HISTORY?.saveRouteFavorites();
    window.OMAP_FAVORITES?.renderFolderChips();
    window.OMAP_FAVORITES?.renderFavoritesList();
    updateRouteSaveFavoriteButton();
  }
  function setPlaceAsRoutePoint(key, place, lngLat) {
    const point = ctx.pointFromPlace(place, lngLat);

    if (ctx.el.routePanel.hidden) {
      toggleRoute();
      ctx.state.routeBackContext = { place, lngLat };
      if (ctx.el.routeBack) ctx.el.routeBack.hidden = false;
    }

    if (key === "a") {
      ctx.state.routePointA = point;
      if (ctx.el.routeFrom) ctx.el.routeFrom.value = point.label;
      setRouteMarker("a", point);
    } else {
      ctx.state.routePointB = point;
      if (ctx.el.routeTo) ctx.el.routeTo.value = point.label;
      setRouteMarker("b", point);
    }

    ctx.state.routeClickStage = ctx.state.routePointA
      ? (ctx.state.routePointB ? "move-b" : "b")
      : "a";

    ctx.updateRouteClickHint();
    ctx.closePlacePopup();

    if (ctx.state.routePointA && ctx.state.routePointB) {
      ctx.calculateRouteFromStoredPoints();
    }
  }


// ===== ZMODYFIKOWANA FUNKCJA handleRouteMapClick =====
async function handleRouteMapClick(event) {
    if (ctx.el.routePanel.hidden || ctx.state.routeClickBusy) return;

    // Jeśli oba punkty są ustawione – dodaj przystanek w klikniętym miejscu
    if (ctx.state.routePointA && ctx.state.routePointB) {
        addRouteWaypoint(event.lngLat);
        return;
    }

    // Jeśli kliknięto na linię trasy (gdy trasa już istnieje) – też dodaj przystanek
    if (ctx.state.routeCoordinates && isClickOnRoute(event.point)) {
        addRouteWaypoint(event.lngLat);
        return;
    }

    ctx.state.routeClickBusy = true;
    const point = {
        lon: event.lngLat.lng,
        lat: event.lngLat.lat,
        label: ctx.formatCoordinates(event.lngLat.lng, event.lngLat.lat)
    };

    try {
        point.label = await reverseGeocodeRoutePoint(point);
    } catch (error) {
        console.error(error);
        ctx.show(ctx.text[ctx.state.language].routeReverseError);
    }

    if (ctx.state.routeClickStage === "a") {
        ctx.state.routePointA = point;
        if (ctx.el.routeFrom) ctx.el.routeFrom.value = point.label;
        setRouteMarker("a", point);
        ctx.state.routeClickStage = ctx.state.routePointB ? "move-b" : "b";
        ctx.updateRouteClickHint();

        if (ctx.state.routePointA && ctx.state.routePointB) {
            await ctx.calculateRouteFromStoredPoints();
        }

        ctx.state.routeClickBusy = false;
        return;
    }

    ctx.state.routePointB = point;
    if (ctx.el.routeTo) ctx.el.routeTo.value = point.label;
    setRouteMarker("b", point);
    ctx.state.routeClickStage = "move-b";
    ctx.updateRouteClickHint();

    if (ctx.state.routePointA) {
        await ctx.calculateRouteFromStoredPoints();
    }

    ctx.state.routeClickBusy = false;
}
// ===== KONIEC ZMODYFIKOWANEJ FUNKCJI =====
  async function reverseGeocodeRoutePoint(point) {
    const url = new URL(ctx.CONFIG.search.reverseEndpoint);
    url.searchParams.set("lat", String(point.lat));
    url.searchParams.set("lon", String(point.lon));
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("accept-language", ctx.state.language);
    url.searchParams.set("zoom", "18");

    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      throw new Error(`Nominatim reverse HTTP ${response.status}`);
    }

    const result = await response.json();
    return result.display_name || ctx.formatCoordinates(point.lon, point.lat);
  }

  function createRouteMarkerElement(letter, markerClass) {
    const element = document.createElement("div");
    element.className = `route-letter-marker ${markerClass}`;

    const label = document.createElement("span");
    label.textContent = letter;
    element.appendChild(label);

    return element;
  }

  function setRouteMarker(key, point) {
    removeRouteMarker(key);

    const isA = key === "a";
    const markerElement = createRouteMarkerElement(
      isA ? "A" : "B",
      isA ? "route-a" : "route-b"
    );

    const marker = new maplibregl.Marker({
      element: markerElement,
      anchor: "center",
      offset: [0, 0],
      draggable: true
    })
      .setLngLat([point.lon, point.lat])
      .setPopup(new maplibregl.Popup().setText(point.label))
      .addTo(ctx.map);

    marker.on("dragend", async () => {
      const position = marker.getLngLat();
      const updatedPoint = {
        lon: position.lng,
        lat: position.lat,
        label: ctx.formatCoordinates(position.lng, position.lat)
      };

      try {
        updatedPoint.label = await reverseGeocodeRoutePoint(updatedPoint);
      } catch (error) {
        console.error(error);
      }

      if (isA) {
        ctx.state.routePointA = updatedPoint;
        if (ctx.el.routeFrom) ctx.el.routeFrom.value = updatedPoint.label;
      } else {
        ctx.state.routePointB = updatedPoint;
        if (ctx.el.routeTo) ctx.el.routeTo.value = updatedPoint.label;
      }

      marker.setPopup(
        new maplibregl.Popup().setText(updatedPoint.label)
      );

      if (ctx.state.routePointA && ctx.state.routePointB) {
        await ctx.calculateRouteFromStoredPoints();
      }
    });

    ctx.state.routeMarkers[key] = marker;
  }

  function removeRouteMarker(key) {
    if (ctx.state.routeMarkers[key]) {
      ctx.state.routeMarkers[key].remove();
      ctx.state.routeMarkers[key] = null;
    }
  }

  function refreshRouteMarkers() {
    if (ctx.state.routePointA) setRouteMarker("a", ctx.state.routePointA);
    else removeRouteMarker("a");

    if (ctx.state.routePointB) setRouteMarker("b", ctx.state.routePointB);
    else removeRouteMarker("b");
  }

  async function planRoute(event) {
    event.preventDefault();
    const fromQuery = ctx.el.routeFrom.value.trim();
    const toQuery = ctx.el.routeTo.value.trim();
    if (!fromQuery || !toQuery) return;

    ctx.show(ctx.text[ctx.state.language].routeSearching, 0);
    if (ctx.el.routeSubmit) ctx.el.routeSubmit.disabled = true;

    try {
      const [from, to] = await Promise.all([
        geocodeRoutePoint(fromQuery),
        geocodeRoutePoint(toQuery)
      ]);

      if (!from || !to) {
        ctx.show(ctx.text[ctx.state.language].routePointNotFound);
        return;
      }

      ctx.state.routePointA = from;
      ctx.state.routePointB = to;
      if (ctx.el.routeFrom) ctx.el.routeFrom.value = from.label;
      if (ctx.el.routeTo) ctx.el.routeTo.value = to.label;
      ctx.state.routeClickStage = "move-b";

      const route = await fetchRoute(from, to);
      drawRoute(
        route.geometry,
        route.snappedFrom || from,
        route.snappedTo || to,
        getSelectedRouteMode()
      );
      ctx.updateRouteClickHint();
      updateRouteSummary(route.distance, route.duration);
      window.OMAP_ROUTE_HISTORY?.recordRouteHistory(
        from,
        to,
        getSelectedRouteMode(),
        route.distance,
        route.duration
      );
      renderRouteDirections(route.maneuvers);
      ctx.hide();
      ctx.dismissMobileKeyboard();
    } catch (error) {
      console.error(error);
      ctx.show(ctx.text[ctx.state.language].routeError);
    } finally {
      if (ctx.el.routeSubmit) ctx.el.routeSubmit.disabled = false;
    }
  }

  async function geocodeRoutePoint(query) {
    const results = await ctx.findPlacesWithFallback(query, 1);
    if (!results.length) return null;

    return {
      lon: Number(results[0].lon),
      lat: Number(results[0].lat),
      label: ctx.getPreferredPlaceLabel(results[0])
    };
  }

  async function fetchTransitRoute(from, to) {
    const url = new URL(ctx.CONFIG.transit.plannerEndpoint);
    url.searchParams.set("fromPlace", `${from.lat},${from.lon}`);
    url.searchParams.set("toPlace", `${to.lat},${to.lon}`);
    url.searchParams.set("numItineraries", "3");
    url.searchParams.set("language", ctx.state.language);
    url.searchParams.set("arriveBy", "false");
    url.searchParams.set("wheelchair", "false");

    const response = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error(`Transitous plan HTTP ${response.status}`);
    }

    const result = await response.json();
    const itineraries =
      result.itineraries ||
      result.plan?.itineraries ||
      [];

    const itinerary = itineraries[0];
    if (!itinerary?.legs?.length) {
      throw new Error(ctx.text[ctx.state.language].transitRouteError);
    }

    const coordinates = [];
    const maneuvers = [];

    itinerary.legs.forEach((leg, index) => {
      const legCoordinates = getTransitLegCoordinates(leg);

      if (coordinates.length && legCoordinates.length) {
        const [firstLon, firstLat] = legCoordinates[0];
        const [lastLon, lastLat] = coordinates[coordinates.length - 1];
        if (
          Math.abs(firstLon - lastLon) < 1e-7 &&
          Math.abs(firstLat - lastLat) < 1e-7
        ) {
          legCoordinates.shift();
        }
      }
      coordinates.push(...legCoordinates);

      const fromCoordinate = getTransitPlaceCoordinate(leg.from);
      const mode = String(leg.mode || "").toUpperCase();
      const routeName =
        leg.routeShortName ||
        leg.route?.shortName ||
        leg.tripShortName ||
        "";
      const destination =
        leg.headsign ||
        leg.to?.name ||
        leg.routeLongName ||
        "";

      maneuvers.push({
        instruction: getTransitLegInstruction(
          mode,
          routeName,
          destination
        ),
        streetNames: [
          leg.from?.name,
          leg.to?.name
        ].filter(Boolean),
        length: Number(leg.distance || 0),
        time: getTransitLegDurationSeconds(leg),
        type: getTransitManeuverType(mode),
        coordinate:
          fromCoordinate ||
          legCoordinates[0] ||
          null,
        segment: legCoordinates,
        transitMode: mode,
        routeName,
        destination
      });
    });

    if (coordinates.length < 2) {
      const fallback = [
        [from.lon, from.lat],
        [to.lon, to.lat]
      ];
      coordinates.push(...fallback);
    }

    const startTime = parseTransitTime(
      itinerary.startTime ||
      itinerary.start_time
    );
    const endTime = parseTransitTime(
      itinerary.endTime ||
      itinerary.end_time
    );

    const duration =
      Number(itinerary.duration || 0) ||
      (
        startTime && endTime
          ? Math.max(0, (endTime - startTime) / 1000)
          : maneuvers.reduce(
              (sum, maneuver) => sum + maneuver.time,
              0
            )
      );

    const distance =
      Number(itinerary.distance || 0) ||
      maneuvers.reduce(
        (sum, maneuver) => sum + maneuver.length,
        0
      );

    return {
      geometry: {
        type: "LineString",
        coordinates
      },
      distance,
      duration,
      maneuvers
    };
  }

  function getTransitLegCoordinates(leg) {
    const geometry =
      leg.legGeometry ||
      leg.geometry ||
      {};

    if (
      geometry.type === "LineString" &&
      Array.isArray(geometry.coordinates)
    ) {
      return geometry.coordinates.map(point => [
        Number(point[0]),
        Number(point[1])
      ]);
    }

    if (Array.isArray(geometry.coordinates)) {
      return geometry.coordinates.map(point => [
        Number(point[0]),
        Number(point[1])
      ]);
    }

    const encoded =
      geometry.points ||
      leg.polyline ||
      leg.encodedPolyline ||
      "";

    if (encoded) {
      const precision =
        Number(geometry.precision) === 6 ? 6 : 5;
      return decodeEncodedPolyline(encoded, precision);
    }

    const from = getTransitPlaceCoordinate(leg.from);
    const to = getTransitPlaceCoordinate(leg.to);
    return [from, to].filter(Boolean);
  }

  function getTransitPlaceCoordinate(place) {
    if (!place) return null;

    const lon = Number(
      place.lon ??
      place.lng ??
      place.longitude ??
      place.location?.lon ??
      place.location?.lng
    );
    const lat = Number(
      place.lat ??
      place.latitude ??
      place.location?.lat
    );

    return Number.isFinite(lon) && Number.isFinite(lat)
      ? [lon, lat]
      : null;
  }

  function getTransitLegDurationSeconds(leg) {
    const direct = Number(leg.duration || 0);
    if (direct > 0) return direct;

    const start = parseTransitTime(
      leg.startTime ||
      leg.start_time
    );
    const end = parseTransitTime(
      leg.endTime ||
      leg.end_time
    );

    return start && end
      ? Math.max(0, (end - start) / 1000)
      : 0;
  }

  function parseTransitTime(value) {
    if (!value) return null;
    if (typeof value === "number") {
      return new Date(value < 1e12 ? value * 1000 : value);
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function getTransitLegInstruction(mode, routeName, destination) {
    const arrow = destination ? ` → ${destination}` : "";

    if (mode.includes("WALK")) {
      return ctx.state.language === "pl"
        ? "Przejdź pieszo"
        : "Walk";
    }

    if (mode.includes("BICYCLE")) {
      return ctx.state.language === "pl"
        ? "Przejedź rowerem"
        : "Cycle";
    }

    const prefix =
      mode.includes("TRAM") ? "🚋" :
      mode.includes("SUBWAY") || mode.includes("METRO") ? "🚇" :
      mode.includes("RAIL") || mode.includes("TRAIN") ? "🚆" :
      mode.includes("FERRY") ? "⛴" :
      "🚌";

    return `${prefix}${routeName ? ` ${routeName}` : ""}${arrow}`;
  }

  function getTransitManeuverType(mode) {
    if (mode.includes("WALK")) return 7;
    if (mode.includes("BICYCLE")) return 7;
    if (mode.includes("TRAM")) return 29;
    if (mode.includes("SUBWAY") || mode.includes("METRO")) return 29;
    if (mode.includes("RAIL") || mode.includes("TRAIN")) return 29;
    if (mode.includes("FERRY")) return 27;
    return 29;
  }

  function decodeEncodedPolyline(encoded, precision = 5) {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const factor = 10 ** precision;
    const coordinates = [];

    while (index < encoded.length) {
      const latitudeResult = decodePolylineValue(encoded, index);
      index = latitudeResult.index;
      latitude += latitudeResult.value;

      const longitudeResult = decodePolylineValue(encoded, index);
      index = longitudeResult.index;
      longitude += longitudeResult.value;

      coordinates.push([
        longitude / factor,
        latitude / factor
      ]);
    }

    return coordinates;
  }

  async function fetchRoute(from, to) {
    const mode = getSelectedRouteMode();

    if (mode === "transit") {
      return fetchTransitRoute(from, to);
    }

    const language = ctx.state.language === "pl" ? "pl-PL" : "en-US";

    const payload = {
      locations: [
        { lat: from.lat, lon: from.lon, type: "break" },
        ...ctx.state.routeWaypoints
          .filter(point => point.lat != null && point.lon != null)
          .map(point => ({
            lat: point.lat,
            lon: point.lon,
            type: "break"
          })),
        { lat: to.lat, lon: to.lon, type: "break" }
      ],
      costing: mode,
      units: "kilometers",
      language
    };

    const response = await fetch(ctx.CONFIG.routing.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "X-Client-Id": ctx.CONFIG.routing.clientId
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Valhalla HTTP ${response.status}`);
    }

    const result = await response.json();
    const trip = result.trip;
    if (!trip?.legs?.length) {
      throw new Error(result.error || "No route");
    }

    const coordinates = [];
    const maneuvers = [];

    for (const leg of trip.legs) {
      const decoded = decodePolyline6(leg.shape);

      for (const maneuver of leg.maneuvers || []) {
        const coordinate =
          decoded[maneuver.begin_shape_index] ||
          decoded[0] ||
          null;

        const beginIndex = Number(maneuver.begin_shape_index || 0);
        const endIndex = Number(
          maneuver.end_shape_index ?? maneuver.begin_shape_index ?? 0
        );
        const roundaboutExit = Number(
          maneuver.roundabout_exit_count ||
          maneuver.roundabout_exit_number ||
          0
        );

        maneuvers.push({
          instruction:
            maneuver.instruction ||
            maneuver.verbal_pre_transition_instruction ||
            "",
          streetNames: maneuver.street_names || [],
          length: Number(maneuver.length || 0) * 1000,
          time: Number(maneuver.time || 0),
          type: Number(maneuver.type),
          roundaboutExit,
          coordinate,
          segment: decoded.slice(
            Math.max(0, beginIndex),
            Math.max(beginIndex + 2, endIndex + 1)
          )
        });
      }

      if (coordinates.length && decoded.length) decoded.shift();
      coordinates.push(...decoded);
    }

    return {
      geometry: {
        type: "LineString",
        coordinates
      },
      distance: Number(trip.summary?.length || 0) * 1000,
      duration: Number(trip.summary?.time || 0),
      maneuvers,
      snappedFrom: extractGeometryEndpoint(coordinates, 0, from),
      snappedTo: extractGeometryEndpoint(
        coordinates,
        coordinates.length - 1,
        to
      )
    };
  }

  function extractGeometryEndpoint(coordinates, index, fallbackPoint) {
    const coordinate = coordinates?.[index];
    const lon = Number(coordinate?.[0]);
    const lat = Number(coordinate?.[1]);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return fallbackPoint;
    }

    return {
      ...fallbackPoint,
      lat,
      lon
    };
  }

  function getSelectedRouteMode() {
    return document.querySelector(
      'input[name="route-mode"]:checked'
    )?.value || "auto";
  }

  function decodePolyline6(encoded) {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const coordinates = [];

    while (index < encoded.length) {
      const latitudeResult = decodePolylineValue(encoded, index);
      index = latitudeResult.index;
      latitude += latitudeResult.value;

      const longitudeResult = decodePolylineValue(encoded, index);
      index = longitudeResult.index;
      longitude += longitudeResult.value;

      coordinates.push([
        longitude / 1e6,
        latitude / 1e6
      ]);
    }

    return coordinates;
  }

  function decodePolylineValue(encoded, startIndex) {
    let result = 0;
    let shift = 0;
    let index = startIndex;
    let byte;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length);

    return {
      index,
      value: (result & 1) ? ~(result >> 1) : (result >> 1)
    };
  }

  function ensureRouteLayers() {
    if (!ctx.map.getSource(ctx.CONFIG.routing.sourceId)) {
      ctx.map.addSource(ctx.CONFIG.routing.sourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        }
      });
    }

    if (!ctx.map.getSource(ctx.CONFIG.routing.highlightSourceId)) {
      ctx.map.addSource(ctx.CONFIG.routing.highlightSourceId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        }
      });
    }

    if (!ctx.map.getLayer(ctx.CONFIG.routing.casingLayerId)) {
      ctx.map.addLayer({
        id: ctx.CONFIG.routing.casingLayerId,
        type: "line",
        source: ctx.CONFIG.routing.sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#ffffff",
          "line-width": 9,
          "line-opacity": 0.92
        }
      });
    }

    if (!ctx.map.getLayer(ctx.CONFIG.routing.lineLayerId)) {
      ctx.map.addLayer({
        id: ctx.CONFIG.routing.lineLayerId,
        type: "line",
        source: ctx.CONFIG.routing.sourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": ctx.getAccentColor(),
          "line-width": 5.5,
          "line-opacity": 0.96
        }
      });
    }

    if (!ctx.map.getLayer(ctx.CONFIG.routing.highlightLayerId)) {
      ctx.map.addLayer({
        id: ctx.CONFIG.routing.highlightLayerId,
        type: "line",
        source: ctx.CONFIG.routing.highlightSourceId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none"
        },
        paint: {
          "line-color": "#facc15",
          "line-width": 8,
          "line-opacity": 0.95
        }
      });
    }
  }

function drawRoute(geometry, from, to, mode) {
    ensureRouteLayers();
    ctx.state.routeCoordinates = geometry.coordinates;
    clearManeuverHighlight();

    ctx.map.getSource(ctx.CONFIG.routing.sourceId).setData({
      type: "Feature",
      properties: {},
      geometry
    });

    ctx.map.setLayoutProperty(ctx.CONFIG.routing.casingLayerId, "visibility", "visible");
    ctx.map.setLayoutProperty(ctx.CONFIG.routing.lineLayerId, "visibility", "visible");

    const routeColors = {
      auto: ctx.getAccentColor(),
      bicycle: "#16a34a",
      pedestrian: "#ea580c"
    };
    ctx.map.setPaintProperty(
      ctx.CONFIG.routing.lineLayerId,
      "line-color",
      routeColors[mode] || routeColors.auto
    );

    ctx.state.routePointA = from;
    ctx.state.routePointB = to;
    refreshRouteMarkers();
    refreshWaypointMarkers();

    const bounds = geometry.coordinates.reduce(
      (current, coordinate) => current.extend(coordinate),
      new maplibregl.LngLatBounds(
        geometry.coordinates[0],
        geometry.coordinates[0]
      )
    );

    ctx.map.fitBounds(bounds, {
      padding: { top: 105, right: 45, bottom: 55, left: 45 },
      bearing: 180,
      duration: 900
    });

    // ZAWSZE otwieraj/rozwijaj panel mobilny po narysowaniu trasy
    // (używamy requestAnimationFrame/setTimeout, by nie kłóciło się z początkiem fitBounds)
    requestAnimationFrame(() => {
      if (ctx.el.routePanel) {
        if (typeof expandMobileRoutePanel === "function") {
          expandMobileRoutePanel();
        } else if (typeof ctx.openMobilePanelStandard === "function") {
          ctx.openMobilePanelStandard(ctx.el.routePanel, "--sheet-height");
        }
      }
    });
  }

  function renderRouteDirections(maneuvers) {
    clearRouteDirections();

    if (!Array.isArray(maneuvers) || !maneuvers.length) return;

    const fragment = document.createDocumentFragment();

    maneuvers.forEach((maneuver, index) => {
      const item = document.createElement("li");
      item.className = "route-direction";

      const button = document.createElement("button");
      button.type = "button";
      button.className = "route-direction-button";

      const icon = document.createElement("span");
      icon.className = "route-direction-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = getManeuverIcon(maneuver.type, index, maneuvers.length);

      const copy = document.createElement("span");
      copy.className = "route-direction-copy";

      const instruction = document.createElement("span");
      instruction.className = "route-direction-instruction";
      instruction.textContent =
        maneuver.roundaboutExit > 0
          ? ctx.text[ctx.state.language].routeRoundaboutExit(maneuver.roundaboutExit)
          : maneuver.instruction;

      copy.appendChild(instruction);

      if (maneuver.streetNames?.length) {
        const street = document.createElement("span");
        street.className = "route-direction-street";
        street.textContent = maneuver.streetNames.join(" → ");
        copy.appendChild(street);
      }

      const metaParts = [];
      if (Number(maneuver.time) > 0) {
        metaParts.push(formatRouteStepDuration(maneuver.time));
      }
      if (maneuver.routeName) {
        metaParts.push(
          ctx.state.language === "pl"
            ? `linia ${maneuver.routeName}`
            : `line ${maneuver.routeName}`
        );
      }
      if (Number(maneuver.numStops || maneuver.stops) > 0) {
        const stopCount = Number(
          maneuver.numStops || maneuver.stops
        );
        metaParts.push(
          ctx.state.language === "pl"
            ? `${stopCount} przyst.`
            : `${stopCount} stops`
        );
      }

      if (metaParts.length) {
        const meta = document.createElement("span");
        meta.className = "route-direction-meta";
        meta.textContent = metaParts.join(" · ");
        copy.appendChild(meta);
      }

      const distance = document.createElement("span");
      distance.className = "route-direction-distance";
      distance.textContent = formatDistance(maneuver.length);

      button.append(icon, copy, distance);

      if (maneuver.coordinate) {
        button.addEventListener("click", () => {
          selectManeuver(index, button);
          ctx.map.easeTo({
            center: maneuver.coordinate,
            zoom: Math.max(ctx.map.getZoom(), 15),
            bearing: 180,
            duration: 650
          });
        });
      } else {
        button.disabled = true;
      }

      item.appendChild(button);
      fragment.appendChild(item);
    });

    ctx.state.routeManeuvers = maneuvers;
    ctx.state.selectedManeuverIndex = null;
    ctx.el.routeDirectionsList.appendChild(fragment);
    ctx.el.routeDirectionsCount.textContent =
      `${maneuvers.length} ${ctx.text[ctx.state.language].routeSteps}`;
    ctx.el.routeDirections.hidden = false;
  }

  function scrollPanelToElement(panel, element) {
    if (!panel || !element) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const panelRect = panel.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        const stickyOffset = 84;

        const targetTop =
          panel.scrollTop +
          elementRect.top -
          panelRect.top -
          stickyOffset;

        panel.scrollTo({
          top: Math.max(0, targetTop),
          behavior: "smooth"
        });
      });
    });
  }

  function formatRouteStepDuration(seconds) {
    const minutes = Math.max(1, Math.round(Number(seconds) / 60));
    if (minutes < 60) {
      return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function clearRouteDirections() {
    if (!ctx.el.routeDirectionsList) return;
    ctx.el.routeDirectionsList.replaceChildren();
    ctx.state.routeManeuvers = [];
    ctx.state.selectedManeuverIndex = null;
    ctx.el.routeDirectionsCount.textContent = "";
    ctx.el.routeDirections.hidden = true;
  }

  function getManeuverIcon(type, index, total) {
    if (index === 0) return "A";
    if (index === total - 1) return "B";

    const icons = {
      1: "↑",   // start
      2: "→",   // start right
      3: "←",   // start left
      4: "✓",   // destination
      5: "✓",   // destination right
      6: "✓",   // destination left
      7: "↑",   // continue
      8: "↗",   // slight right
      9: "→",   // right
      10: "↘",  // sharp right
      11: "↩",  // u-turn right
      12: "↪",  // u-turn left
      13: "↙",  // sharp left
      14: "←",  // left
      15: "↖",  // slight left
      16: "↑",  // ramp straight
      17: "↗",  // ramp right
      18: "↖",  // ramp left
      19: "→",  // exit right
      20: "←",  // exit left
      21: "↑",  // stay straight
      22: "↗",  // stay right
      23: "↖",  // stay left
      24: "⇄",  // merge
      25: "⟳",  // roundabout enter
      26: "⟳",  // roundabout exit
      27: "⛴",  // ferry enter
      28: "⛴",  // ferry exit
      29: "↑",  // transit
      30: "↗",
      31: "↖",
      32: "↗",
      33: "↖",
      34: "↗",
      35: "↖",
      36: "⟳",
      37: "⟳"
    };

    return icons[type] || "•";
  }

  function handleRouteModeChange() {
    if (ctx.state.routePointA && ctx.state.routePointB) {
      ctx.calculateRouteFromStoredPoints();
      return;
    }

    if (ctx.el.routeFrom.value.trim() && ctx.el.routeTo.value.trim()) {
      ctx.el.routeForm.requestSubmit();
    }
  }

  function selectManeuver(index, button) {
    for (const current of ctx.el.routeDirectionsList.querySelectorAll(
      ".route-direction-button"
    )) {
      current.classList.remove("is-selected");
    }

    button.classList.add("is-selected");
    ctx.state.selectedManeuverIndex = index;

    const maneuver = ctx.state.routeManeuvers[index];
    const segment = maneuver?.segment || [];

    if (segment.length < 2) {
      clearManeuverHighlight();
      return;
    }

    ctx.map.getSource(ctx.CONFIG.routing.highlightSourceId).setData({
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: segment }
    });
    ctx.map.setLayoutProperty(
      ctx.CONFIG.routing.highlightLayerId,
      "visibility",
      "visible"
    );
  }

  function clearManeuverHighlight() {
    ctx.state.selectedManeuverIndex = null;

    if (ctx.map.getSource(ctx.CONFIG.routing.highlightSourceId)) {
      ctx.map.getSource(ctx.CONFIG.routing.highlightSourceId).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }
    if (ctx.map.getLayer(ctx.CONFIG.routing.highlightLayerId)) {
      ctx.map.setLayoutProperty(
        ctx.CONFIG.routing.highlightLayerId,
        "visibility",
        "none"
      );
    }
  }

  function isClickOnRoute(point) {
    if (!ctx.map.getLayer(ctx.CONFIG.routing.lineLayerId)) return false;

    const tolerance = 8;
    const box = [
      [point.x - tolerance, point.y - tolerance],
      [point.x + tolerance, point.y + tolerance]
    ];

    return ctx.map.queryRenderedFeatures(box, {
      layers: [
        ctx.CONFIG.routing.casingLayerId,
        ctx.CONFIG.routing.lineLayerId
      ]
    }).length > 0;
  }

  function nextWaypointId() {
    ctx.state.routeWaypointSeq += 1;
    return `wp-${ctx.state.routeWaypointSeq}`;
  }

  function addRouteWaypoint(lngLat) {
    const waypoint = {
      id: nextWaypointId(),
      lon: lngLat.lng,
      lat: lngLat.lat,
      label: ctx.formatCoordinates(lngLat.lng, lngLat.lat)
    };

    ctx.state.routeWaypoints.push(waypoint);
    refreshWaypointMarkers();
    renderRouteWaypoints();
    ctx.calculateRouteFromStoredPoints();
  }

  function addRouteWaypointField() {
    ctx.state.routeWaypoints.push({
      id: nextWaypointId(),
      lon: null,
      lat: null,
      label: ""
    });
    renderRouteWaypoints();

    const list = ctx.el.routeWaypointsList;
    const lastInput = list?.querySelector(
      ".route-waypoint-row:last-child .route-waypoint-input"
    );
    lastInput?.focus();
  }

  function removeRouteWaypointById(waypointId) {
    const index = ctx.state.routeWaypoints.findIndex(
      point => point.id === waypointId
    );
    if (index === -1) return;

    const [removed] = ctx.state.routeWaypoints.splice(index, 1);
    refreshWaypointMarkers();
    renderRouteWaypoints();

    const wasResolved = removed && removed.lon != null && removed.lat != null;
    if (wasResolved && ctx.state.routePointA && ctx.state.routePointB) {
      ctx.calculateRouteFromStoredPoints();
    }
  }

  function renderRouteWaypoints() {
    const list = ctx.el.routeWaypointsList;
    if (!list) return;

    list.replaceChildren();
    const t = ctx.text[ctx.state.language];

    ctx.state.routeWaypoints.forEach((point, index) => {
      const item = document.createElement("li");
      item.className = "route-waypoint-row";

      const indexBadge = document.createElement("span");
      indexBadge.className = "route-waypoint-index";
      indexBadge.setAttribute("aria-hidden", "true");
      indexBadge.textContent = String(index + 1);

      const input = document.createElement("input");
      input.type = "search";
      input.autocomplete = "off";
      input.className = "route-waypoint-input";
      input.placeholder = t.routeWaypointStopPlaceholder(index + 1);
      input.setAttribute("aria-label", t.routeWaypointStopPlaceholder(index + 1));
      input.value = point.label || "";
      input.dataset.waypointId = point.id;

      const removeButton = document.createElement("button");
      removeButton.type = "button";
      removeButton.className = "route-waypoint-remove";
      removeButton.textContent = "×";
      removeButton.setAttribute(
        "aria-label",
        t.routeRemoveWaypoint(index + 1)
      );
      removeButton.addEventListener("click", () => {
        removeRouteWaypointById(point.id);
      });

      item.append(indexBadge, input, removeButton);
      list.appendChild(item);

      ctx.registerRouteWaypointAutocomplete?.(input, point.id);
    });
  }

  function refreshWaypointMarkers() {
    clearWaypointMarkers();

    ctx.state.routeWaypoints.forEach((point, index) => {
      if (point.lon == null || point.lat == null) return;

      const element = document.createElement("div");
      element.className = "route-waypoint-marker";
      element.textContent = String(index + 1);
      element.title = ctx.text[ctx.state.language].routeWaypoint(index + 1);

      const marker = new maplibregl.Marker({
        element,
        draggable: true,
        anchor: "center"
      })
        .setLngLat([point.lon, point.lat])
        .addTo(ctx.map);

      marker.on("dragend", () => {
        const position = marker.getLngLat();
        ctx.state.routeWaypoints[index] = {
          ...ctx.state.routeWaypoints[index],
          lon: position.lng,
          lat: position.lat,
          label: ctx.formatCoordinates(position.lng, position.lat)
        };
        renderRouteWaypoints();
        ctx.calculateRouteFromStoredPoints();
      });

      ctx.state.routeWaypointMarkers.push(marker);
    });
  }

  function clearWaypointMarkers() {
    for (const marker of ctx.state.routeWaypointMarkers) {
      marker.remove();
    }
    ctx.state.routeWaypointMarkers = [];
  }

  async function shareRoute() {
    if (!ctx.state.routePointA || !ctx.state.routePointB) return;

    const url = ctx.isLocalOrNativeOrigin() && ctx.CONFIG.publicBaseUrl
      ? new URL(ctx.CONFIG.publicBaseUrl)
      : new URL(window.location.href);
    url.searchParams.set(
      "a",
      `${ctx.state.routePointA.lat},${ctx.state.routePointA.lon}`
    );
    url.searchParams.set(
      "b",
      `${ctx.state.routePointB.lat},${ctx.state.routePointB.lon}`
    );
    url.searchParams.set("mode", getSelectedRouteMode());

    const resolvedWaypoints = ctx.state.routeWaypoints.filter(
      point => point.lat != null && point.lon != null
    );

    if (resolvedWaypoints.length) {
      url.searchParams.set(
        "via",
        resolvedWaypoints
          .map(point => `${point.lat},${point.lon}`)
          .join(";")
      );
    } else {
      url.searchParams.delete("via");
    }

    try {
      if (navigator.share) {
        try {
          await navigator.share({
            title: document.title,
            url: url.toString()
          });
          return;
        } catch (shareError) {
          if (shareError?.name === "AbortError") return;
          // Ten sam mechanizm co przy udostepnianiu miejsca (patrz
          // sharePlace w app.js) - navigator.share() moze istniec,
          // ale zawiesc przy samym wywolaniu na niektorych platformach
          // desktopowych.
          console.error(shareError);
        }
      }
      await navigator.clipboard.writeText(url.toString());
      ctx.show(ctx.text[ctx.state.language].routeShared);
    } catch (error) {
      if (error?.name !== "AbortError") {
        console.error(error);
        ctx.show(ctx.text[ctx.state.language].routeShareError);
      }
    }
  }

  async function loadSharedRouteFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const a = parseSharedPoint(params.get("a"));
    const b = parseSharedPoint(params.get("b"));
    if (!a || !b) return;

    const mode = params.get("mode");
    const modeInput = document.querySelector(
      `input[name="route-mode"][value="${mode}"]`
    );
    if (modeInput) modeInput.checked = true;

    ctx.state.routePointA = a;
    ctx.state.routePointB = b;
    ctx.state.routeClickStage = "move-b";
    if (ctx.el.routeFrom) ctx.el.routeFrom.value = a.label;
    if (ctx.el.routeTo) ctx.el.routeTo.value = b.label;

    const via = params.get("via");
    ctx.state.routeWaypoints = via
      ? via
          .split(";")
          .map(parseSharedPoint)
          .filter(Boolean)
          .map(point => ({ ...point, id: nextWaypointId() }))
      : [];

    refreshRouteMarkers();
    refreshWaypointMarkers();
    renderRouteWaypoints();
    await ctx.calculateRouteFromStoredPoints();
  }

  function parseSharedPoint(value) {
    if (!value) return null;
    const [latText, lonText] = value.split(",");
    const lat = Number(latText);
    const lon = Number(lonText);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

    return {
      lat,
      lon,
      label: ctx.formatCoordinates(lon, lat)
    };
  }

  function updateRouteSummary(distanceMeters, durationSeconds) {
    ctx.el.routeDistance.textContent = formatDistance(distanceMeters);
    ctx.el.routeDuration.textContent = formatDuration(durationSeconds);

    ctx.state.lastRouteDistance = distanceMeters;
    ctx.state.lastRouteDuration = durationSeconds;

    const arrival = new Date(Date.now() + durationSeconds * 1000);
    ctx.el.routeArrival.textContent = arrival.toLocaleTimeString(
      ctx.state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    ctx.el.routeSummary.hidden = false;
    scrollPanelToElement(
      ctx.el.routePanel,
      ctx.el.routeSummary
    );
    if (ctx.el.routeShare) ctx.el.routeShare.hidden = false;
    if (ctx.el.routeExportGpx) ctx.el.routeExportGpx.hidden = false;
    if (ctx.el.routeClear) ctx.el.routeClear.hidden = false;
    if (ctx.el.routeSaveFavoriteButton) ctx.el.routeSaveFavoriteButton.hidden = false;
    updateRouteSaveFavoriteButton();
    if (ctx.el.routeWaypointNote) ctx.el.routeWaypointNote.hidden = false;
  }

  function formatDistance(meters) {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toLocaleString(ctx.state.language, {
      maximumFractionDigits: 1
    })} km`;
  }

  function formatDuration(seconds) {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;

    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} h ${rest} min` : `${hours} h`;
  }

  function clearRoute() {
    ctx.state.routeCoordinates = null;
    ctx.state.routePointA = null;
    ctx.state.routePointB = null;
    ctx.state.routeClickStage = "a";
    if (ctx.el.routeFrom) ctx.el.routeFrom.value = "";
    if (ctx.el.routeTo) ctx.el.routeTo.value = "";
    ctx.hideAllAutocomplete();
    ctx.el.routeSummary.hidden = true;
    ctx.el.routeDistance.textContent = "—";
    ctx.el.routeDuration.textContent = "—";
    ctx.el.routeArrival.textContent = "—";
    if (ctx.el.routeShare) ctx.el.routeShare.hidden = true;
    if (ctx.el.routeExportGpx) ctx.el.routeExportGpx.hidden = true;
    if (ctx.el.routeClear) ctx.el.routeClear.hidden = true;
    if (ctx.el.routeSaveFavoriteButton) ctx.el.routeSaveFavoriteButton.hidden = true;
    if (ctx.el.routeWaypointNote) ctx.el.routeWaypointNote.hidden = true;
    ctx.state.routeWaypoints = [];
    clearWaypointMarkers();
    renderRouteWaypoints();
    clearManeuverHighlight();
    clearRouteDirections();

    if (ctx.map.getSource(ctx.CONFIG.routing.sourceId)) {
      ctx.map.getSource(ctx.CONFIG.routing.sourceId).setData({
        type: "Feature",
        properties: {},
        geometry: { type: "LineString", coordinates: [] }
      });
    }

    if (ctx.map.getLayer(ctx.CONFIG.routing.casingLayerId)) {
      ctx.map.setLayoutProperty(ctx.CONFIG.routing.casingLayerId, "visibility", "none");
    }
    if (ctx.map.getLayer(ctx.CONFIG.routing.lineLayerId)) {
      ctx.map.setLayoutProperty(ctx.CONFIG.routing.lineLayerId, "visibility", "none");
    }

    removeRouteMarker("a");
    removeRouteMarker("b");
    ctx.updateRouteClickHint();
  }
  function useMyLocationForRoute(onResolved) {
    if (ctx.isElectronPlatform()) {
      ctx.show(ctx.text[ctx.state.language].locatingForRoute, 0);

      ctx.fetchLocationByIp()
        .then(({ latitude, longitude }) => {
          ctx.hide();
          onResolved({
            lon: longitude,
            lat: latitude,
            label: ctx.text[ctx.state.language].menuLocation,
            __resolvedPoint: true
          });
        })
        .catch(error => {
          console.warn("Lokalizacja po IP nie powiodła się.", error);
          ctx.show(ctx.text[ctx.state.language].locateError);
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

    ctx.show(ctx.text[ctx.state.language].locatingForRoute, 0);

    navigator.geolocation.getCurrentPosition(
      position => {
        ctx.hide();
        onResolved({
          lon: position.coords.longitude,
          lat: position.coords.latitude,
          label: ctx.text[ctx.state.language].menuLocation,
          __resolvedPoint: true
        });
      },
      error => {
        console.error(error);
        ctx.show(ctx.text[ctx.state.language].locateError);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }



  function updateRouteClearButton(input, btn) {
    if (!btn || !input) return;
    btn.hidden = !input.value.trim();
  }

  function updateRouteClearButtons() {
    updateRouteClearButton(ctx.el.routeFrom, ctx.el.routeFromClear);
    updateRouteClearButton(ctx.el.routeTo, ctx.el.routeToClear);
  }

  // Śledzi zarówno wpisywanie przez użytkownika, jak i programowe
  // ustawianie .value (np. po wyborze podpowiedzi albo przeciągnięciu
  // znacznika), żeby przycisk (x) zawsze odzwierciedlał zawartość pola.
  function watchRouteInputValue(input, btn) {
    if (!input || !btn) return;
    const proto = Object.getPrototypeOf(input);
    const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
    if (!descriptor || !descriptor.configurable) return;
    Object.defineProperty(input, "value", {
      get() {
        return descriptor.get.call(this);
      },
      set(v) {
        descriptor.set.call(this, v);
        btn.hidden = !this.value.trim();
      },
      configurable: true
    });
  }

  function clearRoutePoint(key) {
    const isA = key === "a";
    const input = isA ? ctx.el.routeFrom : ctx.el.routeTo;
    const clearBtn = isA ? ctx.el.routeFromClear : ctx.el.routeToClear;

    if (isA) ctx.state.routePointA = null;
    else ctx.state.routePointB = null;

    if (input) input.value = "";
    removeRouteMarker(key);
    ctx.hideAllAutocomplete();
    updateRouteClearButton(input, clearBtn);

    ctx.state.routeClickStage = !ctx.state.routePointA
      ? "a"
      : !ctx.state.routePointB
      ? "b"
      : "move-b";
    ctx.updateRouteClickHint();

    if (ctx.state.routeCoordinates) {
      ctx.state.routeCoordinates = null;
      if (ctx.el.routeSummary) ctx.el.routeSummary.hidden = true;
      if (ctx.el.routeShare) ctx.el.routeShare.hidden = true;
      if (ctx.el.routeExportGpx) ctx.el.routeExportGpx.hidden = true;
      if (ctx.el.routeClear) ctx.el.routeClear.hidden = true;
      if (ctx.el.routeWaypointNote) ctx.el.routeWaypointNote.hidden = true;
      clearManeuverHighlight();
      clearRouteDirections();

      if (ctx.map.getSource(ctx.CONFIG.routing.sourceId)) {
        ctx.map.getSource(ctx.CONFIG.routing.sourceId).setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: [] }
        });
      }
      if (ctx.map.getLayer(ctx.CONFIG.routing.casingLayerId)) {
        ctx.map.setLayoutProperty(ctx.CONFIG.routing.casingLayerId, "visibility", "none");
      }
      if (ctx.map.getLayer(ctx.CONFIG.routing.lineLayerId)) {
        ctx.map.setLayoutProperty(ctx.CONFIG.routing.lineLayerId, "visibility", "none");
      }
    }

    input?.focus();
  }


async function exportRouteAsGpx() {
    if (!ctx.state.routePointA || !ctx.state.routePointB) {
        ctx.show("Najpierw wyznacz trasę.");
        return;
    }

    const language = ctx.state.language || ctx.state.ui?.language || "pl";
    const t = ctx.text[language];

    const allPoints = [];
    
    allPoints.push({
        lat: ctx.state.routePointA.lat,
        lon: ctx.state.routePointA.lon,
        name: "Punkt A"
    });

    if (ctx.state.routeWaypoints && ctx.state.routeWaypoints.length > 0) {
        ctx.state.routeWaypoints.forEach((wp, i) => {
            allPoints.push({
                lat: wp.lat,
                lon: wp.lon,
                name: `Przystanek ${i+1}`
            });
        });
    }

    allPoints.push({
        lat: ctx.state.routePointB.lat,
        lon: ctx.state.routePointB.lon,
        name: "Punkt B"
    });

    const waypointsXml = allPoints.map((p, i) => {
        const name = p.name || `Punkt ${i+1}`;
        return `    <wpt lat="${p.lat}" lon="${p.lon}">
        <name>${name}</name>
        <sym>Waypoint</sym>
      </wpt>`;
    }).join("\n");

    const routePointsXml = allPoints.map((p) => {
        return `      <rtept lat="${p.lat}" lon="${p.lon}"/>`;
    }).join("\n");

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Odwrotna Mapa" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Trasa z Odwrotnej Mapy</name>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypointsXml}
  <rte>
    <name>Trasa</name>
    ${routePointsXml}
  </rte>
</gpx>`;

    const blob = new Blob([gpx], { type: "application/gpx+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // NAZWA PLIKU Z DATĄ I GODZINĄ
    const now = new Date();
    const dateStr = now.toISOString().slice(0,10);
    const timeStr = now.toTimeString().slice(0,8).replace(/:/g, '');
    link.download = `trasa-${dateStr}_${timeStr}.gpx`;
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    ctx.show(t.routeGpxExported || "Trasa została wyeksportowana jako GPX.");
}

async function importRouteFromGpx(file) {
    const language = ctx.state.language || ctx.state.ui?.language || "pl";
    const t = ctx.text[language];

    try {
        const textContent = await file.text();
        const parser = new DOMParser();
        const xml = parser.parseFromString(textContent, "application/xml");

        // Szukamy punktów – najpierw w <wpt>, potem w <rtept>, potem <trkpt>
        let points = [];
        
        const wpts = xml.querySelectorAll("wpt");
        if (wpts.length > 0) {
            wpts.forEach(pt => {
                const lat = parseFloat(pt.getAttribute("lat"));
                const lon = parseFloat(pt.getAttribute("lon"));
                if (!isNaN(lat) && !isNaN(lon)) {
                    points.push({ lat, lon });
                }
            });
        }

        if (points.length === 0) {
            const rtepts = xml.querySelectorAll("rtept");
            if (rtepts.length > 0) {
                rtepts.forEach(pt => {
                    const lat = parseFloat(pt.getAttribute("lat"));
                    const lon = parseFloat(pt.getAttribute("lon"));
                    if (!isNaN(lat) && !isNaN(lon)) {
                        points.push({ lat, lon });
                    }
                });
            }
        }

        if (points.length === 0) {
            const trkpts = xml.querySelectorAll("trkpt");
            if (trkpts.length > 0) {
                trkpts.forEach(pt => {
                    const lat = parseFloat(pt.getAttribute("lat"));
                    const lon = parseFloat(pt.getAttribute("lon"));
                    if (!isNaN(lat) && !isNaN(lon)) {
                        points.push({ lat, lon });
                    }
                });
            }
        }

        if (points.length < 2) {
            ctx.show(t.routeGpxNoPoints || "Plik GPX musi zawierać co najmniej dwa punkty.");
            return;
        }

        // Pierwszy punkt = A, ostatni = B, reszta = waypointy
        const first = points[0];
        const last = points[points.length - 1];
        const waypoints = points.slice(1, -1);

        ctx.state.routePointA = {
            lon: first.lon,
            lat: first.lat,
            label: ctx.formatCoordinates(first.lon, first.lat)
        };
        ctx.state.routePointB = {
            lon: last.lon,
            lat: last.lat,
            label: ctx.formatCoordinates(last.lon, last.lat)
        };
        
        ctx.state.routeWaypoints = waypoints.map((p, i) => ({
            lon: p.lon,
            lat: p.lat,
            label: `Przystanek ${i+1}`
        }));

        // Odśwież UI
        if (ctx.el.routeFrom) ctx.el.routeFrom.value = ctx.state.routePointA.label;
        if (ctx.el.routeTo) ctx.el.routeTo.value = ctx.state.routePointB.label;
        
        refreshRouteMarkers();
        refreshWaypointMarkers();
        
        if (typeof renderRouteWaypoints === "function") {
            renderRouteWaypoints();
        } else {
            const list = document.getElementById("route-waypoints-list");
            if (list) {
                list.innerHTML = "";
                ctx.state.routeWaypoints.forEach((wp, i) => {
                    const li = document.createElement("li");
                    li.textContent = wp.label;
                    list.appendChild(li);
                });
            }
        }
        
        ctx.state.routeClickStage = "move-b";
        ctx.updateRouteClickHint();

        // Zamiast rysować geometrię z pliku, przelicz trasę przez silnik routingu
        await ctx.calculateRouteFromStoredPoints();

        // Dopiero po udanym przeliczeniu pokaż komunikat sukcesu
        ctx.show(t.routeGpxImported || "Trasa została zaimportowana z pliku GPX.");
    } catch (error) {
        console.error("Błąd importu GPX:", error);
        ctx.show(t.routeGpxImportError || "Nie udało się zaimportować pliku GPX.");
    }
}

  window.OMAP_ROUTE = {
    configure,
    toggleRoute,
    returnFromRouteToPlace,
    scrollPanelToElement,
    closeRoutePanel,
    closeRoute,
    swapRoutePoints,
    setContextPointAsRoute,
    collapseMobileRoutePanel,
    expandMobileRoutePanel,
    currentRouteFavoriteKey,
    updateRouteSaveFavoriteButton,
    toggleCurrentRouteFavorite,
    setPlaceAsRoutePoint,
    handleRouteMapClick,
    reverseGeocodeRoutePoint,
    createRouteMarkerElement,
    setRouteMarker,
    removeRouteMarker,
    refreshRouteMarkers,
    planRoute,
    geocodeRoutePoint,
    fetchTransitRoute,
    getTransitLegCoordinates,
    getTransitPlaceCoordinate,
    getTransitLegDurationSeconds,
    parseTransitTime,
    getTransitLegInstruction,
    getTransitManeuverType,
    decodeEncodedPolyline,
    fetchRoute,
    extractGeometryEndpoint,
    getSelectedRouteMode,
    decodePolyline6,
    decodePolylineValue,
    ensureRouteLayers,
    drawRoute,
    renderRouteDirections,
    formatRouteStepDuration,
    clearRouteDirections,
    getManeuverIcon,
    handleRouteModeChange,
    selectManeuver,
    clearManeuverHighlight,
    isClickOnRoute,
    nextWaypointId,
    addRouteWaypoint,
    addRouteWaypointField,
    removeRouteWaypointById,
    renderRouteWaypoints,
    refreshWaypointMarkers,
    clearWaypointMarkers,
    shareRoute,
    loadSharedRouteFromUrl,
    parseSharedPoint,
    updateRouteSummary,
    formatDistance,
    formatDuration,
    clearRoute,
    useMyLocationForRoute,
    updateRouteClearButton,
    updateRouteClearButtons,
    watchRouteInputValue,
    clearRoutePoint,
    exportRouteAsGpx,
    importRouteFromGpx
  };
})();
