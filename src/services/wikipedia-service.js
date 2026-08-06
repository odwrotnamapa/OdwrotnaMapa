(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - sekcja podsumowania z
  // Wikipedii w karcie miejsca (rozpoznawanie właściwego artykułu po
  // tagu wikipedia/wikidata z OSM, pobieranie skrótu, renderowanie).
  // Ten sam wzorzec configure() co pozostałe wyniesione moduły.
  //
  // Na zewnątrz wystawione trzy funkcje: createSection/loadForPlace
  // (wołane z karty miejsca) i fetchSummary (wołane osobno z app.js
  // przy zapisywaniu ulubionego miejsca, żeby zcache'ować skrót Wiki
  // razem z nim - to jedyna funkcja stąd używana poza kartą miejsca).

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  async function resolveWikipediaTarget(place) {
    const preferredLang = ctx.state.language === "pl" ? "pl" : "en";
    const tag = place?.extratags?.wikipedia;
    const qid = place?.extratags?.wikidata;

    let tagTarget = null;
    if (tag) {
      const match = /^([a-z-]+):(.+)$/.exec(tag);
      tagTarget = match
        ? { lang: match[1], title: match[2] }
        : { lang: "en", title: tag };
    }

    if (tagTarget && tagTarget.lang === preferredLang) {
      return tagTarget;
    }

    if (qid) {
      try {
        const url = new URL("https://www.wikidata.org/w/api.php");
        url.searchParams.set("action", "wbgetentities");
        url.searchParams.set("ids", qid);
        url.searchParams.set("props", "sitelinks");
        url.searchParams.set("format", "json");
        url.searchParams.set("origin", "*");

        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const sitelinks = data?.entities?.[qid]?.sitelinks || {};
          const site = sitelinks[`${preferredLang}wiki`];

          if (site?.title) {
            return { lang: preferredLang, title: site.title };
          }
        }
      } catch (error) {
        console.error(error);
      }
    }

    if (tagTarget) {
      return tagTarget;
    }

    const isNamedSettlement =
      ["city", "town", "village"].includes(
        String(place?.type || "").toLowerCase()
      ) && Boolean(place?.name);

    if (isNamedSettlement) {
      return { lang: preferredLang, title: place.name };
    }

    return null;
  }

  function createWikipediaSection() {
    const t = ctx.text[ctx.state.language];

    const section = document.createElement("section");
    section.className = "place-wikipedia";
    section.hidden = true;

    const header = document.createElement("div");
    header.className = "place-wikipedia-header";

    const title = document.createElement("h4");
    title.textContent = `📖 ${t.wikipediaTitle}`;
    header.appendChild(title);
    section.appendChild(header);

    const thumbnail = document.createElement("img");
    thumbnail.className = "place-wikipedia-thumbnail";
    thumbnail.alt = "";
    thumbnail.hidden = true;
    section.appendChild(thumbnail);

    const extract = document.createElement("p");
    extract.className = "place-wikipedia-extract";
    section.appendChild(extract);

    const link = document.createElement("a");
    link.className = "place-wikipedia-link";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = t.wikipediaReadMore;
    section.appendChild(link);

    return { section, thumbnail, extract, link };
  }

  async function fetchWikipediaSummaryData(place) {
    try {
      const target = await resolveWikipediaTarget(place);
      if (!target) return null;

      const url =
        `https://${target.lang}.wikipedia.org/api/rest_v1/page/summary/` +
        encodeURIComponent(target.title);

      const response = await fetch(url, {
        headers: { "Accept": "application/json" }
      });
      if (!response.ok) return null;

      const data = await response.json();
      if (!data.extract || data.type === "disambiguation") {
        return null;
      }

      return {
        lang: target.lang,
        title: target.title,
        extract: data.extract,
        thumbnail: data.thumbnail?.source || "",
        url:
          data.content_urls?.desktop?.page ||
          `https://${target.lang}.wikipedia.org/wiki/${encodeURIComponent(target.title)}`
      };
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async function loadWikipediaSummaryForPlace(place, ui, headingElement) {
    // Ulubione miejsca mogą już mieć zapisane dane z Wikipedii
    // (pobrane w momencie dodania do ulubionych) - używamy ich od
    // razu, żeby działało też offline, zamiast dociągać na nowo.
    if (place.wikipediaExtract) {
      ui.extract.textContent = place.wikipediaExtract;

      if (place.wikipediaThumbnail) {
        ui.thumbnail.src = place.wikipediaThumbnail;
        ui.thumbnail.hidden = false;
      }

      ui.link.href = place.wikipediaUrl || "#";
      ui.section.hidden = false;
      return;
    }

    const data = await fetchWikipediaSummaryData(place);
    if (!data) return;

    ui.extract.textContent = data.extract;

    if (data.thumbnail) {
      ui.thumbnail.src = data.thumbnail;
      ui.thumbnail.hidden = false;
    }

    ui.link.href = data.url;
    ui.section.hidden = false;

    // Wikipedia często trafia dokładniej niż nasze zgadywanie po
    // polach adresu (np. gdy dane administracyjne dla danego kraju
    // są niekompletne) - jeśli znalazła konkretniejszą nazwę,
    // podmieniamy widoczny tytuł, żeby panel i Wikipedia zawsze
    // pokazywały to samo miejsce.
    // ALE: nie resetujemy, jeśli użytkownik ustawił custom name
    if (data.title && headingElement) {
      const lat = Number(place?.lat);
      const lon = Number(place?.lon);
      let placeNameKey = null;
      
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        placeNameKey = `${lat.toFixed(5)},${lon.toFixed(5)}`;
      }
      
      // Nie nadpisuj jeśli istnieje custom name
      const hasCustomName = placeNameKey && ctx.state.customPlaceNames[placeNameKey];
      if (!hasCustomName) {
        const displayTitle = ctx.capitalizeFirstLetter(data.title);
        // Zmień TYLKO titleButton, nie cały headingElement
        const titleButton = headingElement.querySelector(".place-card-title-button");
        if (titleButton) {
          titleButton.textContent = displayTitle;
        } else {
          // Fallback jeśli struktura się zmieniła
          headingElement.textContent = displayTitle;
        }
        document.title = `${displayTitle} - Odwrotna Mapa`;
      }
    }
  }

  window.OMAP_WIKIPEDIA = {
    configure,
    createSection: createWikipediaSection,
    loadForPlace: loadWikipediaSummaryForPlace,
    fetchSummary: fetchWikipediaSummaryData
  };
})();
