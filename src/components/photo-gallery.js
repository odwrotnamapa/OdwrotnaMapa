(function () {
  "use strict";

  function create(
    place,
    {
      getImageUrl,
      imageClass = "place-card-image"
    } = {}
  ) {
    const fragment =
      document.createDocumentFragment();

    if (typeof getImageUrl !== "function") {
      return fragment;
    }

    const imageUrl = getImageUrl(place);

    if (!imageUrl) {
      return fragment;
    }

    const image = document.createElement("img");
    image.className = imageClass;
    image.src = imageUrl;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.addEventListener(
      "error",
      () => {
        window.OMAP_PHOTO_SERVICE?.markFailure(place, imageUrl);
        image.remove();
      }
    );

    fragment.appendChild(image);
    return fragment;
  }

  window.OMAP_PHOTO_GALLERY = {
    create
  };
})();
