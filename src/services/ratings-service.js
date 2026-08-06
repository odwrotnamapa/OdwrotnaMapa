(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - system publicznych ocen
  // miejsc (Nostr, kind 31555). Gwiazdki (pół-gwiazdki, 1-5 co 0.5),
  // podgląd na hover, zapis/usuwanie oceny. Ten sam wzorzec co
  // discover-service.js i OMAP_PLACE_SERVICE: brak własnego stanu,
  // wszystko wstrzykiwane przez configure(). Zapis/odczyt ocen idzie
  // przez już globalne window.OMAP_SYNC_CRYPTO/window.OMAP_SYNC_TRANSPORT
  // - nie wymaga żadnego dodatkowego przekazywania.
  //
  // Na zewnątrz wystawione tylko dwie funkcje faktycznie wołane z
  // app.js (createSection, loadForPlace) - reszta (malowanie gwiazdek,
  // zapis/usuwanie) to szczegóły wewnętrzne, używane tylko wewnątrz
  // tego modułu.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function createRatingSection(placeKey, placeMeta) {
    const t = ctx.text[ctx.state.language];

    const section = document.createElement("section");
    section.className = "place-rating";

    const starsRow = document.createElement("div");
    starsRow.className = "place-rating-stars";
    starsRow.setAttribute("role", "group");
    starsRow.setAttribute("aria-label", t.ratingStars);

    // Każda gwiazdka to dwie nałożone kopie glifu (szare tło +
    // kolorowe wypełnienie przycinane szerokością 0/50/100%) plus
    // dwie niewidoczne strefy kliknięcia (lewa/prawa połówka) - to
    // pozwala ocenić na pełne i połówkowe wartości (np. 2,5).
    const stars = [];
    for (let value = 1; value <= 5; value++) {
      const star = document.createElement("span");
      star.className = "place-rating-star";

      const track = document.createElement("span");
      track.className = "place-rating-star-track";
      track.textContent = "★";
      track.setAttribute("aria-hidden", "true");

      const fill = document.createElement("span");
      fill.className = "place-rating-star-fill";
      fill.textContent = "★";
      fill.style.width = "0%";
      fill.setAttribute("aria-hidden", "true");

      const hitHalf = document.createElement("button");
      hitHalf.type = "button";
      hitHalf.className = "place-rating-star-hit place-rating-star-hit-half";
      hitHalf.setAttribute("aria-label", `${value - 0.5} ${t.ratingStars}`);

      const hitFull = document.createElement("button");
      hitFull.type = "button";
      hitFull.className = "place-rating-star-hit place-rating-star-hit-full";
      hitFull.setAttribute("aria-label", `${value} ${t.ratingStars}`);

      star.append(track, fill, hitHalf, hitFull);
      starsRow.appendChild(star);
      stars.push({ fill });

      hitHalf.addEventListener("mouseenter", () => previewRatingStars(stars, value - 0.5));
      hitFull.addEventListener("mouseenter", () => previewRatingStars(stars, value));

      hitHalf.addEventListener("click", () => {
        submitPlaceRating(placeKey, placeMeta, value - 0.5, { stars, summary });
      });
      hitFull.addEventListener("click", () => {
        submitPlaceRating(placeKey, placeMeta, value, { stars, summary });
      });
    }

    starsRow.addEventListener("mouseleave", () => restoreRatingStars(stars));

    const summary = document.createElement("span");
    summary.className = "place-rating-summary";
    summary.textContent = t.ratingLoading;

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "place-rating-delete";
    deleteButton.textContent = "🗑";
    deleteButton.title = t.ratingDelete;
    deleteButton.setAttribute("aria-label", t.ratingDelete);
    deleteButton.hidden = true;

    section.append(starsRow, summary, deleteButton);

    deleteButton.addEventListener("click", () => {
      deletePlaceRating(placeKey, { stars, summary, deleteButton });
    });

    return { section, stars, summary, deleteButton };
  }

  function paintRatingStars(stars, value, isMine) {
    stars.forEach((star, index) => {
      const starPosition = index + 1;
      let fillPercent = 0;
      if (value >= starPosition) fillPercent = 100;
      else if (value >= starPosition - 0.5) fillPercent = 50;

      star.fill.style.width = `${fillPercent}%`;
      star.fill.classList.toggle("is-mine", isMine && fillPercent > 0);
    });
    // Zapamiętujemy "prawdziwy" stan bezpośrednio na tablicy gwiazdek,
    // żeby po zjechaniu myszką (mouseleave) było do czego wrócić -
    // podgląd na hover nie może nadpisać tego na stałe.
    stars.committedValue = value;
    stars.committedIsMine = isMine;
  }

  function previewRatingStars(stars, value) {
    stars.forEach((star, index) => {
      const starPosition = index + 1;
      let fillPercent = 0;
      if (value >= starPosition) fillPercent = 100;
      else if (value >= starPosition - 0.5) fillPercent = 50;

      star.fill.style.width = `${fillPercent}%`;
      star.fill.classList.toggle("is-mine", fillPercent > 0);
    });
  }

  function restoreRatingStars(stars) {
    paintRatingStars(stars, stars.committedValue || 0, Boolean(stars.committedIsMine));
  }

  async function loadPlaceRatingsForPlace(placeKey, ui) {
    const t = ctx.text[ctx.state.language];
    const transport = window.OMAP_SYNC_TRANSPORT;
    if (!transport) {
      ui.summary.textContent = "";
      return;
    }

    try {
      const seedWords = ctx.getStoredSeedWords();
      let myPubKeyHex = null;
      if (seedWords) {
        const cryptoApi = window.OMAP_SYNC_CRYPTO;
        const nostrLib = await transport.waitForNostrLib();
        const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);
        myPubKeyHex = nostrLib.getPublicKey(nostrPrivKeyBytes);
      }

      const result = await transport.fetchRatings(placeKey, myPubKeyHex);

      if (result.count > 0) {
        ui.summary.textContent = `${result.average.toFixed(1)} ★ (${result.count})`;
        paintRatingStars(ui.stars, result.average, false);
      } else {
        ui.summary.textContent = t.ratingNone;
      }

      if (result.myRating) {
        paintRatingStars(ui.stars, result.myRating, true);
      }
      if (ui.deleteButton) ui.deleteButton.hidden = !result.myRating;

      ui.summary.title = seedWords ? "" : t.ratingLoginHint;
    } catch (error) {
      console.error("Nie udało się pobrać ocen miejsca:", error);
      ui.summary.textContent = t.ratingError;
    }
  }

  async function submitPlaceRating(placeKey, placeMeta, value, ui) {
    const t = ctx.text[ctx.state.language];
    const seedWords = ctx.getStoredSeedWords();

    if (!seedWords) {
      ctx.openAccountFromMenu();
      return;
    }

    ui.summary.textContent = t.ratingSaving;

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);

      await transport.publishRating(nostrPrivKeyBytes, placeKey, value, placeMeta);
      paintRatingStars(ui.stars, value, true);
      await loadPlaceRatingsForPlace(placeKey, ui);
    } catch (error) {
      console.error("Nie udało się wysłać oceny:", error);
      ui.summary.textContent = t.ratingError;
    }
  }

  async function deletePlaceRating(placeKey, ui) {
    const t = ctx.text[ctx.state.language];
    const seedWords = ctx.getStoredSeedWords();
    if (!seedWords) return;

    ui.summary.textContent = t.ratingSaving;
    if (ui.deleteButton) ui.deleteButton.hidden = true;

    try {
      const cryptoApi = window.OMAP_SYNC_CRYPTO;
      const transport = window.OMAP_SYNC_TRANSPORT;
      const { nostrPrivKeyBytes } = await cryptoApi.deriveKeys(seedWords);

      await transport.deleteRating(nostrPrivKeyBytes, placeKey);
      paintRatingStars(ui.stars, 0, false);
      await loadPlaceRatingsForPlace(placeKey, ui);
    } catch (error) {
      console.error("Nie udało się usunąć oceny:", error);
      ui.summary.textContent = t.ratingError;
      if (ui.deleteButton) ui.deleteButton.hidden = false;
    }
  }

  window.OMAP_RATINGS = {
    configure,
    createSection: createRatingSection,
    loadForPlace: loadPlaceRatingsForPlace
  };
})();
