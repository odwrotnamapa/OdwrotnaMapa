(function () {
  "use strict";

  // Kino w karcie miejsca - sekcja "Teraz na ekranach" z listą filmów
  // aktualnie granych w kinach w Polsce (TMDB "now playing" -
  // https://developer.themoviedb.org/reference/movie-now-playing-list).
  // WAŻNE: to lista OGÓLNOKRAJOWA, NIE repertuar KONKRETNEGO kina -
  // żadne darmowe/publiczne API nie udostępnia godzin seansów per
  // kino (sieci jak Multikino/Cinema City/Helios nie mają publicznych
  // API), więc appka świadomie tego nie udaje - pokazuje tylko "co
  // ogólnie idzie teraz w kinach", bez godzin ani sali.
  //
  // Ten sam wzorzec co departures-service.js (isTransitStop/
  // createSection/loadForPlace, wołane z createPlaceCardLegacy() w
  // app.js) - brak własnego stanu poza prostym cache'em listy filmów
  // (patrz niżej), wszystko wstrzykiwane przez configure().

  let ctx = null;

  // Lista "teraz na ekranach" jest ogólnokrajowa, nie zależy od
  // konkretnego kina/współrzędnych - więc w przeciwieństwie do
  // odjazdów (per-przystanek) wystarczy JEDEN cache na całą sesję,
  // nie per-miejsce. Ważny też między kolejnymi otwarciami różnych
  // kin w tej samej sesji, żeby nie odpytywać TMDB za każdym razem.
  let cache = null; // { language, timestamp, movies }

  function configure(newCtx) {
    ctx = newCtx;
  }

  function isCinemaPlace(place) {
    if (!place) return false;

    const values = [
      place.type,
      place.category,
      place.class,
      place.extratags?.amenity,
      place.tags?.amenity
    ]
      .filter(Boolean)
      .map(value => String(value).toLowerCase());

    return values.includes("cinema");
  }

  function createMoviesSection() {
    const t = ctx.text[ctx.state.language];

    const section = document.createElement("section");
    section.className = "place-movies";

    const header = document.createElement("div");
    header.className = "place-movies-header";

    const title = document.createElement("h4");
    title.textContent = `🎬 ${t.moviesTitle}`;

    header.appendChild(title);
    section.appendChild(header);

    const status = document.createElement("p");
    status.className = "place-movies-status";
    status.textContent = t.moviesLoading;
    section.appendChild(status);

    const list = document.createElement("ul");
    list.className = "place-movies-list";
    list.hidden = true;
    section.appendChild(list);

    const attribution = document.createElement("a");
    attribution.className = "place-movies-source";
    attribution.href = "https://www.themoviedb.org/";
    attribution.target = "_blank";
    attribution.rel = "noopener noreferrer";
    attribution.textContent = t.moviesSource;
    attribution.hidden = true;
    section.appendChild(attribution);

    return { section, status, list, attribution };
  }

  async function fetchNowPlaying() {
    const cfg = ctx.CONFIG.movies || {};
    const language = ctx.state.language === "pl" ? "pl-PL" : "en-US";
    const ttlMs = (cfg.cacheTtlMinutes || 360) * 60000;

    if (
      cache &&
      cache.language === language &&
      Date.now() - cache.timestamp < ttlMs
    ) {
      return cache.movies;
    }

    const url = new URL(cfg.nowPlayingEndpoint);
    url.searchParams.set("api_key", cfg.apiKey);
    url.searchParams.set("region", cfg.region || "PL");
    url.searchParams.set("language", language);
    url.searchParams.set("page", "1");

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`TMDB HTTP ${response.status}`);
    }

    const data = await response.json();
    const movies = (data.results || []).slice(0, cfg.limit || 10);

    cache = { language, timestamp: Date.now(), movies };
    return movies;
  }

  async function loadMoviesForPlace(place, lngLat, ui) {
    const t = ctx.text[ctx.state.language];
    const cfg = ctx.CONFIG.movies || {};

    // Klucz TMDB (darmowy, rejestrowany na
    // https://www.themoviedb.org/settings/api) trzeba wpisać samemu
    // w config.js `movies.apiKey` - bez tego sekcja pokaże komunikat
    // z instrukcją zamiast wyników, tak samo jak sekcja "Wydarzenia"
    // bez skonfigurowanego proxy Workera.
    if (!cfg.apiKey) {
      ui.status.textContent = t.moviesMissingKey;
      return;
    }

    try {
      const movies = await fetchNowPlaying();

      if (!movies.length) {
        ui.status.textContent = t.moviesEmpty;
        return;
      }

      renderMovies(movies, ui, cfg);
    } catch (error) {
      console.error(error);
      ui.status.textContent = t.moviesError;
    }
  }

  function renderMovies(movies, ui, cfg) {
    const posterBase = cfg.posterBaseUrl || "https://image.tmdb.org/t/p/w200";
    const fragment = document.createDocumentFragment();

    for (const movie of movies) {
      const item = document.createElement("li");
      item.className = "place-movie-card";
      item.title = movie.title || movie.original_title || "";

      const poster = document.createElement("span");
      poster.className = "place-movie-poster";
      if (movie.poster_path) {
        poster.style.backgroundImage =
          `url("${posterBase}${movie.poster_path}")`;
      } else {
        poster.classList.add("place-movie-poster--placeholder");
        poster.setAttribute("aria-hidden", "true");
        poster.textContent = "🎬";
      }

      const name = document.createElement("span");
      name.className = "place-movie-title";
      name.textContent = movie.title || movie.original_title || "";

      item.append(poster, name);
      fragment.appendChild(item);
    }

    ui.list.replaceChildren();
    ui.list.appendChild(fragment);

    ui.status.hidden = true;
    ui.list.hidden = false;
    ui.attribution.hidden = false;
  }

  window.OMAP_MOVIES = {
    configure,
    isCinema: isCinemaPlace,
    createSection: createMoviesSection,
    loadForPlace: loadMoviesForPlace
  };
})();
