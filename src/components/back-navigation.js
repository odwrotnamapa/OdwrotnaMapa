(function () {
  "use strict";

  let current = null;
  let onChange = null;
  const handlers = new Map();

  function configure(options = {}) {
    onChange =
      typeof options.onChange === "function"
        ? options.onChange
        : null;
  }

  function notify() {
    onChange?.(current);
  }

  function set(type, data = {}) {
    current = type
      ? { type, ...data }
      : null;

    notify();
    return current;
  }

  function clear() {
    current = null;
    notify();
  }

  function get() {
    return current;
  }

  function register(type, handler) {
    if (
      !type ||
      typeof handler !== "function"
    ) {
      return;
    }

    handlers.set(type, handler);
  }

  function goBack() {
    const target = current;

    if (!target) {
      return false;
    }

    current = null;
    notify();

    const handler = handlers.get(target.type);

    if (typeof handler !== "function") {
      return false;
    }

    handler(target);
    return true;
  }

  window.OMAP_BACK_NAVIGATION = {
    configure,
    set,
    clear,
    get,
    register,
    goBack
  };
})();
