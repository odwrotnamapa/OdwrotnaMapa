(function () {
  "use strict";

  let sequence = 0;
  let activeSession = null;

  function clonePlace(place) {
    if (!place) return null;

    return {
      ...place,
      address: {
        ...(place.address || {})
      },
      extratags: {
        ...(place.extratags || {})
      },
      namedetails: {
        ...(place.namedetails || {})
      },
      providers: Array.isArray(place.providers)
        ? [...place.providers]
        : place.providers
    };
  }

  class SearchSession {
    constructor(query) {
      this.id = ++sequence;
      this.query = String(query || "").trim();
      this.controller = new AbortController();
      this.status = "created";
      this.candidates = [];
      this.selectedPlace = null;
      this.startedAt = performance.now();
    }

    get signal() {
      return this.controller.signal;
    }

    isActive() {
      return (
        activeSession === this &&
        !this.signal.aborted
      );
    }

    assertActive() {
      if (!this.isActive()) {
        throw new DOMException(
          "Stale search session",
          "AbortError"
        );
      }
    }

    setCandidates(candidates) {
      this.assertActive();
      this.candidates = Array.isArray(candidates)
        ? [...candidates]
        : [];
      this.status = "candidates";
      return this.candidates;
    }

    select(place) {
      this.assertActive();

      if (!this.selectedPlace) {
        this.selectedPlace = Object.freeze(
          clonePlace(place)
        );
      }

      this.status = "selected";
      return this.selectedPlace;
    }

    finish() {
      this.assertActive();
      this.status = "finished";
      return this.selectedPlace;
    }

    abort(reason = "Superseded search") {
      if (!this.signal.aborted) {
        this.controller.abort(reason);
      }
      this.status = "aborted";
    }
  }

  function begin(query) {
    activeSession?.abort();
    activeSession = new SearchSession(query);
    return activeSession;
  }

  function current() {
    return activeSession;
  }

  function cancel() {
    activeSession?.abort();
    activeSession = null;
  }

  window.OMAP_SEARCH_SESSION = Object.freeze({
    begin,
    current,
    cancel
  });
})();
