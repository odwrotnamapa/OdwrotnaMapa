(function () {
  "use strict";

  // Wyodrębnione z app.js (2026-08-06) - "Niedziele handlowe w
  // Polsce": obliczenia dat (Wielkanoc, ostatnie niedziele miesięcy,
  // niedziele przed Wigilią) oraz panel UI pokazujący odpowiedź na
  // dziś. Ten sam wzorzec configure() co pozostałe wyniesione
  // moduły - ale część logiki dat (calculateEasterSunday,
  // lastSundayOfMonth, getTradingSundaysForYear,
  // isTodayTradingSundayPL) jest czystą funkcją matematyczną, zero
  // zależności od stanu appki - używa `ctx` tylko część UI.

  let ctx = null;

  function configure(newCtx) {
    ctx = newCtx;
  }

  function calculateEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  }

  // Ostatnia niedziela danego miesiąca (0-indeksowany miesiąc).
  function lastSundayOfMonth(year, monthIndex) {
    const lastDay = new Date(year, monthIndex + 1, 0);
    const offset = lastDay.getDay();
    lastDay.setDate(lastDay.getDate() - offset);
    return lastDay;
  }

  // Zwraca zbiór dat (jako stringi YYYY-MM-DD) niedziel handlowych w
  // Polsce dla danego roku, zgodnie z ustawą z 10 stycznia 2018 r. o
  // ograniczeniu handlu w niedziele i święta.
  function getTradingSundaysForYear(year) {
    const dates = [];
    const toKey = date =>
      `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

    // Ostatnia niedziela stycznia, kwietnia, czerwca i sierpnia.
    for (const monthIndex of [0, 3, 5, 7]) {
      dates.push(lastSundayOfMonth(year, monthIndex));
    }

    // Niedziela bezpośrednio poprzedzająca pierwszy dzień Wielkanocy.
    const easter = calculateEasterSunday(year);
    const beforeEaster = new Date(easter);
    beforeEaster.setDate(beforeEaster.getDate() - 7);
    dates.push(beforeEaster);

    // Trzy kolejne niedziele poprzedzające Wigilię (24 grudnia).
    const christmasEve = new Date(year, 11, 24);
    let cursor = new Date(christmasEve);
    cursor.setDate(cursor.getDate() - 1);
    while (cursor.getDay() !== 0) {
      cursor.setDate(cursor.getDate() - 1);
    }
    for (let i = 0; i < 3; i++) {
      dates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() - 7);
    }

    return new Set(dates.map(toKey));
  }

  function isTodayTradingSundayPL() {
    const today = new Date();
    const isSunday = today.getDay() === 0;
    const tradingSundays = getTradingSundaysForYear(today.getFullYear());
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    return { isSunday, isTrading: isSunday && tradingSundays.has(todayKey) };
  }

  function updateTradingSundayAnswer() {
    const { isSunday, isTrading } = isTodayTradingSundayPL();
    const t = ctx.text[ctx.state.language];

    if (ctx.el.tradingSundayAnswer) {
      ctx.el.tradingSundayAnswer.textContent = isTrading ? t.yes : t.no;
      ctx.el.tradingSundayAnswer.classList.toggle("is-yes", isTrading);
      ctx.el.tradingSundayAnswer.classList.toggle("is-no", !isTrading);
    }

    if (ctx.el.tradingSundayNote) {
      ctx.el.tradingSundayNote.textContent = isSunday
        ? ""
        : t.tradingSundayNotSunday;
    }
  }

  function openTradingSundayFromMenu() {
    ctx.closeOtherMobilePanels("tradingSunday");

    updateTradingSundayAnswer();

    ctx.openMobilePanelStandard(
      ctx.el.tradingSundayPanel,
      "--sheet-height"
    );
    ctx.el.menuTradingSundayButton?.setAttribute("aria-expanded", "true");
  }

  function closeTradingSunday() {
    if (!ctx.el.tradingSundayPanel || ctx.el.tradingSundayPanel.hidden) return;
    ctx.el.tradingSundayPanel.hidden = true;
    ctx.el.menuTradingSundayButton?.setAttribute("aria-expanded", "false");
  }

  function returnFromTradingSundayToMenu() {
    closeTradingSunday();
    ctx.openMenuHome();
  }

  window.OMAP_TRADING_SUNDAY = {
    configure,
    updateAnswer: updateTradingSundayAnswer,
    open: openTradingSundayFromMenu,
    close: closeTradingSunday,
    returnToMenu: returnFromTradingSundayToMenu
  };
})();
