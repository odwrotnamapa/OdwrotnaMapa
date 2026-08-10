(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - generyczny mechanizm
  // przeciągania/zwijania dolnego panelu (bottom sheet) na telefonie:
  // wspólny dla WSZYSTKICH 14 paneli appki (trasa, odkrywaj, menu,
  // ulubione, historia, miejsce, trasa-info, streetview, legenda,
  // etykiety, niedziele handlowe, o appce, backup, konto). Każdy
  // panel woła tę samą funkcję z własnymi referencjami DOM - logika
  // przeciągania jest w pełni generyczna, nie wie nic o KONKRETNYM
  // panelu.
  //
  // Same 14 cienkich wrapperów (initializeRouteBottomSheet itd.)
  // ZOSTAJĄ w app.js - są zbyt małe i zbyt mocno powiązane z
  // poszczególnymi panelami (funkcje "close" każdego z nich), żeby
  // warto było je przenosić. Tu wyniesiony jest tylko sam,
  // generyczny silnik.
  //
  // openMobilePanelStandard/setMobilePanelHeight/itd. ZOSTAJĄ w
  // app.js jako współdzielone narzędzia (openMobilePanelStandard
  // samo w sobie ma 30+ wywołań w całym pliku, daleko poza tym
  // modułem) - są tu tylko wstrzykiwane przez configure().

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function initializeBottomSheet({
    panel,
    handle,
    close,
    cssVariable
  }) {
    if (!handle || !panel) return;

    const header = panel.querySelector(
      ".app-sheet__header, .panel-shell__header"
    );

    let dragging = false;
    let startY = 0;
    let startHeight = 0;
    let activePointerId = null;
    let movedDuringGesture = false;
    let dragSource = null;

    const setDefaultHeight = () => {
      if (!ctx.isMobilePanelViewport()) {
        panel.style.removeProperty(cssVariable);
        panel.classList.remove("is-collapsed", "is-dragging");
        return;
      }

      if (
        panel.hidden ||
        panel.classList.contains("is-collapsed") ||
        panel.classList.contains("is-dragging")
      ) {
        return;
      }

      ctx.setMobilePanelHeight(
        panel,
        cssVariable,
        ctx.getMobilePanelDefaultHeight(),
        { collapsed: false, mode: "default" }
      );
    };

    const beginDrag = (event, source) => {
      if (!ctx.isMobilePanelViewport()) return;

      dragging = true;
      dragSource = source;
      movedDuringGesture = false;
      activePointerId = event.pointerId;
      startY = event.clientY;
      startHeight = panel.getBoundingClientRect().height;
      panel.classList.add("is-dragging");

      try {
        source.setPointerCapture(event.pointerId);
      } catch (_) {}
    };

    handle.addEventListener("pointerdown", event => {
      beginDrag(event, handle);
      event.preventDefault();
    });

    if (header) {
      header.addEventListener("pointerdown", event => {
        if (
          event.target.closest(
            "button, a, input, select, textarea"
          )
        ) {
          return;
        }
        beginDrag(event, header);
        event.preventDefault();
      });
    }

    // Przeciąganie treści jak w mainstreamowych apkach mapowych:
    // ciągnięcie w górę najpierw rozciąga panel do pełnej wysokości,
    // dopiero potem zaczyna przewijać treść normalnie. Ciągnięcie
    // w dół, gdy treść jest na samej górze, zwija panel z powrotem.
    // Tryb ustalamy raz na gest, na podstawie kierunku i aktualnego
    // stanu w momencie, gdy ruch staje się jednoznaczny.
    const content = panel.querySelector(
      ".app-sheet__body, .panel-shell__body"
    ) || panel;

    let contentGestureActive = false;
    let contentGestureMode = null;
    let contentGestureStartY = 0;
    let contentGesturePointerId = null;

    content.addEventListener("pointerdown", event => {
      if (!ctx.isMobilePanelViewport()) return;
      if (event.target.closest("button, a, input, select, textarea")) {
        return;
      }

      contentGestureActive = true;
      contentGestureMode = null;
      contentGestureStartY = event.clientY;
      contentGesturePointerId = event.pointerId;
    });

    content.addEventListener("pointermove", event => {
      if (
        !contentGestureActive ||
        dragging ||
        event.pointerId !== contentGesturePointerId
      ) {
        return;
      }

      if (contentGestureMode !== null) return;

      const deltaUp = contentGestureStartY - event.clientY;
      if (Math.abs(deltaUp) < 2) return;

      const maxHeight = ctx.getMobilePanelMaximumHeight();
      const currentHeight = panel.getBoundingClientRect().height;
      const atMax = currentHeight >= maxHeight - 2;
      const atTop = content.scrollTop <= 0;

      contentGestureMode = deltaUp > 0
        ? (atMax ? "content" : "panel")
        : (atTop ? "panel" : "content");

      if (contentGestureMode === "panel") {
        contentGestureActive = false;
        beginDrag(
          {
            pointerId: event.pointerId,
            clientY: contentGestureStartY
          },
          content
        );
        event.preventDefault();
      }
    });

    content.addEventListener("pointerup", () => {
      contentGestureActive = false;
      contentGestureMode = null;
    });
    content.addEventListener("pointercancel", () => {
      contentGestureActive = false;
      contentGestureMode = null;
    });

    document.addEventListener("pointermove", event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      const delta = startY - event.clientY;
      if (Math.abs(delta) > 4) movedDuringGesture = true;

      ctx.setMobilePanelHeight(
        panel,
        cssVariable,
        startHeight + delta,
        { animate: false }
      );
      event.preventDefault();
    });

    const finishDrag = event => {
      if (!dragging || event.pointerId !== activePointerId) return;

      dragging = false;
      activePointerId = null;

      const height = panel.getBoundingClientRect().height;
      const collapsedHeight = ctx.MOBILE_PANEL_STANDARD.collapsedHeight;
      const defaultHeight = ctx.getMobilePanelDefaultHeight();
      const expandedHeight = ctx.getMobilePanelMaximumHeight();

      const lowerMidpoint = (collapsedHeight + defaultHeight) / 2;
      const upperMidpoint = (defaultHeight + expandedHeight) / 2;

      let targetHeight;
      let collapsed;
      let mode;

      if (height <= lowerMidpoint) {
        targetHeight = collapsedHeight;
        collapsed = true;
        mode = "collapsed";
      } else if (height <= upperMidpoint) {
        targetHeight = defaultHeight;
        collapsed = false;
        mode = "default";
      } else {
        targetHeight = expandedHeight;
        collapsed = false;
        mode = "expanded";
      }

      ctx.setMobilePanelHeight(
        panel,
        cssVariable,
        targetHeight,
        { collapsed, mode }
      );

      try {
        dragSource?.releasePointerCapture(event.pointerId);
      } catch (_) {}

      dragSource = null;
    };

    document.addEventListener("pointerup", finishDrag);
    document.addEventListener("pointercancel", finishDrag);

    handle.addEventListener("click", () => {
      if (!ctx.isMobilePanelViewport() || movedDuringGesture) return;

      const height = panel.getBoundingClientRect().height;
      const collapsedHeight = ctx.MOBILE_PANEL_STANDARD.collapsedHeight;
      const defaultHeight = ctx.getMobilePanelDefaultHeight();

      if (height <= collapsedHeight + 8) {
        ctx.openMobilePanelStandard(panel, cssVariable);
      } else if (height <= defaultHeight + 8) {
        ctx.setMobilePanelHeight(
          panel,
          cssVariable,
          ctx.getMobilePanelMaximumHeight(),
          { collapsed: false, mode: "expanded" }
        );
      } else {
        ctx.collapseMobilePanelStandard(panel, cssVariable);
      }
    });

    window.addEventListener("resize", setDefaultHeight);
    window.visualViewport?.addEventListener("resize", setDefaultHeight);
    setDefaultHeight();
  }


  window.OMAP_BOTTOM_SHEET = {
    configure,
    initialize: initializeBottomSheet
  };
})();
