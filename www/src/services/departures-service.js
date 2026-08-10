(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - sekcja odjazdów transportu
  // publicznego w karcie miejsca (rozpoznawanie przystanku, pobieranie
  // rozkładu, formatowanie czasu/kolorów linii). Ten sam wzorzec co
  // discover-service.js i ratings-service.js: brak własnego stanu,
  // wszystko wstrzykiwane przez configure().
  //
  // Na zewnątrz wystawione trzy funkcje faktycznie wołane z app.js
  // (isTransitStop, createSection, loadForPlace) - reszta (formatowanie
  // czasu, emoji trybu, kolory linii) to szczegóły wewnętrzne.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function isTransitStopPlace(place) {
    const address = place.address || {};
    const extra = place.extratags || {};

    const values = [
      place.type,
      place.category,
      address.highway,
      address.public_transport,
      address.railway,
      address.amenity,
      extra.public_transport,
      extra.highway,
      extra.railway,
      extra.bus,
      extra.tram,
      extra.train,
      extra.subway
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    const joined = values.join(" ");

    return [
      "bus_stop",
      "platform",
      "stop_position",
      "station",
      "tram_stop",
      "halt",
      "subway_entrance",
      "railway"
    ].some(token => joined.includes(token));
  }


  function createDeparturesSection() {
    const t = ctx.text[ctx.state.language];

    const section = document.createElement("section");
    section.className = "place-departures";

    const header = document.createElement("div");
    header.className = "place-departures-header";

    const title = document.createElement("h4");
    title.textContent = `🚌 ${t.departuresTitle}`;

    header.appendChild(title);
    section.appendChild(header);

    const status = document.createElement("p");
    status.className = "place-departures-status";
    status.textContent = t.departuresLoading;
    section.appendChild(status);

    const list = document.createElement("ol");
    list.className = "place-departures-list";
    list.hidden = true;
    section.appendChild(list);

    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "place-departures-toggle";
    toggle.textContent = t.departuresShowMore;
    toggle.hidden = true;
    section.appendChild(toggle);

    const attribution = document.createElement("a");
    attribution.className = "place-departures-source";
    attribution.href = ctx.CONFIG.transit.sourcesUrl;
    attribution.target = "_blank";
    attribution.rel = "noopener noreferrer";
    attribution.textContent = t.departuresSources;
    attribution.hidden = true;
    section.appendChild(attribution);

    return { section, status, list, toggle, attribution };
  }

  async function loadDeparturesForPlace(place, lngLat, ui) {
    const t = ctx.text[ctx.state.language];

    try {
      const url = new URL(ctx.CONFIG.transit.departuresEndpoint);
      url.searchParams.set(
        "center",
        `${lngLat.lat},${lngLat.lng}`
      );
      url.searchParams.set("radius", String(ctx.CONFIG.transit.radius));
      url.searchParams.set("exactRadius", "true");
      url.searchParams.set("n", String(ctx.CONFIG.transit.limit));
      url.searchParams.set("direction", "LATER");
      url.searchParams.set("arriveBy", "false");
      url.searchParams.set("language", ctx.state.language);
      url.searchParams.set("withAlerts", "false");

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });

      if (!response.ok) {
        throw new Error(`Transitous HTTP ${response.status}`);
      }

      const data = await response.json();
      const departures = Array.isArray(data.stopTimes)
        ? data.stopTimes
        : [];

      if (!departures.length) {
        ui.status.textContent = t.departuresEmpty;
        return;
      }

      renderDepartures(departures, ui);
    } catch (error) {
      console.error(error);
      ui.status.textContent = t.departuresError;
    }
  }

  function renderDepartures(departures, ui) {
    const t = ctx.text[ctx.state.language];
    const compactLimit = 2;
    const visibleDepartures = departures.slice(
      0,
      ctx.CONFIG.transit.limit
    );

    let expanded = false;

    const draw = () => {
      ui.list.replaceChildren();

      const fragment = document.createDocumentFragment();
      const items = expanded
        ? visibleDepartures
        : visibleDepartures.slice(0, compactLimit);

      items.forEach(departure => {
        const item = document.createElement("li");
        item.className = "place-departure";

        if (departure.cancelled || departure.tripCancelled) {
          item.classList.add("is-cancelled");
        }

        const badge = document.createElement("span");
        badge.className = "place-departure-line";

        const routeName =
          departure.routeShortName ||
          departure.displayName ||
          departure.tripShortName ||
          getTransitModeEmoji(departure.mode);

        badge.textContent = routeName;
        applyTransitRouteColors(
          badge,
          departure.routeColor,
          departure.routeTextColor
        );

        const copy = document.createElement("span");
        copy.className = "place-departure-copy";

        const direction = document.createElement("strong");
        direction.className = "place-departure-direction";
        direction.textContent =
          departure.headsign ||
          departure.tripTo?.name ||
          departure.routeLongName ||
          "—";

        const timing = document.createElement("span");
        timing.className = "place-departure-time";
        timing.textContent = formatDepartureTiming(departure);

        copy.append(direction, timing);
        item.append(badge, copy);

        const tripId = departure.tripId || departure.tripID;
        if (tripId) {
          item.classList.add("is-clickable");
          item.setAttribute("role", "button");
          item.setAttribute("tabindex", "0");
          const openHandler = () => ctx.openTripDetails(departure);
          item.addEventListener("click", openHandler);
          item.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openHandler();
            }
          });
        }

        fragment.appendChild(item);
      });

      ui.list.appendChild(fragment);
      ui.list.classList.toggle("is-expanded", expanded);

      if (visibleDepartures.length > compactLimit) {
        ui.toggle.hidden = false;
        ui.toggle.textContent = expanded
          ? t.departuresShowLess
          : t.departuresShowMore;
        ui.toggle.setAttribute("aria-expanded", String(expanded));
      } else {
        ui.toggle.hidden = true;
      }
    };

    ui.toggle.addEventListener("click", () => {
      expanded = !expanded;
      draw();

      if (!expanded) {
        ui.list.scrollTop = 0;
      }
    });

    draw();

    ui.status.hidden = true;
    ui.list.hidden = false;
    ui.attribution.hidden = false;
  }

  function formatDepartureTiming(departure) {
    const t = ctx.text[ctx.state.language];
    const place = departure.place || {};

    const actualValue =
      place.departure ||
      place.arrival ||
      place.scheduledDeparture ||
      place.scheduledArrival;

    const scheduledValue =
      place.scheduledDeparture ||
      place.scheduledArrival ||
      actualValue;

    const actual = new Date(actualValue);
    const scheduled = new Date(scheduledValue);

    if (Number.isNaN(actual.getTime())) {
      return departure.cancelled || departure.tripCancelled
        ? t.departuresCancelled
        : t.departuresScheduled;
    }

    const clock = actual.toLocaleTimeString(
      ctx.state.language === "pl" ? "pl-PL" : "en-US",
      { hour: "2-digit", minute: "2-digit" }
    );

    const minutes = Math.max(
      0,
      Math.round((actual.getTime() - Date.now()) / 60000)
    );

    const relative =
      minutes <= 0
        ? t.departuresNow
        : t.departuresMinutes(minutes);

    if (departure.cancelled || departure.tripCancelled) {
      return `${clock} · ${t.departuresCancelled}`;
    }

    let suffix = departure.realTime
      ? ""
      : ` · ${t.departuresScheduled}`;

    if (
      departure.realTime &&
      !Number.isNaN(scheduled.getTime())
    ) {
      const delayMinutes = Math.round(
        (actual.getTime() - scheduled.getTime()) / 60000
      );

      if (delayMinutes > 0) {
        suffix = ` · +${delayMinutes} min`;
      } else if (delayMinutes < 0) {
        suffix = ` · ${delayMinutes} min`;
      }
    }

    return `${clock} · ${relative}${suffix}`;
  }

  function getTransitModeEmoji(mode) {
    const normalized = String(mode || "").toUpperCase();

    if (normalized.includes("TRAM")) return "🚋";
    if (
      normalized.includes("RAIL") ||
      normalized.includes("TRAIN") ||
      normalized.includes("SUBURBAN")
    ) return "🚆";
    if (
      normalized.includes("SUBWAY") ||
      normalized.includes("METRO")
    ) return "🚇";
    if (normalized.includes("FERRY")) return "⛴";
    if (normalized.includes("BUS")) return "🚌";
    return "🚌";
  }

  function applyTransitRouteColors(element, background, foreground) {
    const safeBackground = normalizeTransitColor(background);
    const safeForeground = normalizeTransitColor(foreground);

    if (safeBackground) {
      element.style.backgroundColor = safeBackground;
      element.style.borderColor = safeBackground;
    }

    if (safeForeground) {
      element.style.color = safeForeground;
    } else if (safeBackground) {
      element.style.color = getReadableTextColor(safeBackground);
    }
  }

  function normalizeTransitColor(value) {
    if (!value) return "";

    const color = String(value).trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) return color;
    if (/^[0-9a-f]{6}$/i.test(color)) return `#${color}`;

    return "";
  }

  function getReadableTextColor(hexColor) {
    const value = hexColor.replace("#", "");
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    const luminance =
      (red * 299 + green * 587 + blue * 114) / 1000;

    return luminance > 150 ? "#111827" : "#ffffff";
  }


  window.OMAP_DEPARTURES = {
    configure,
    isTransitStop: isTransitStopPlace,
    createSection: createDeparturesSection,
    loadForPlace: loadDeparturesForPlace
  };
})();
