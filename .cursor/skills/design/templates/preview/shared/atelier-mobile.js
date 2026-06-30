/**
 * Atelier — mobile burger controller
 * Explicit, minimal behavior for three shared surfaces:
 * - `.tpl-nav` (homepage)
 * - `.doc-nav .doc-wrap` (pitch)
 * - `.m3-top-bar` (material homepage)
 */
(function () {
  "use strict";

  var BP = 900;
  var mq = window.matchMedia("(max-width: " + BP + "px)");
  var root = document.documentElement;
  var overlay = document.createElement("div");
  overlay.className = "atelier-mobile-overlay";
  overlay.hidden = true;
  document.body.appendChild(overlay);

  var controllers = [];

  function makeBurger(label) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "atelier-burger";
    btn.setAttribute("aria-label", label);
    btn.setAttribute("aria-expanded", "false");
    btn.innerHTML = '<span class="atelier-burger-lines" aria-hidden="true"><i></i><i></i><i></i></span>';
    return btn;
  }

  function closeAll() {
    controllers.forEach(function (c) {
      c.close();
    });
  }

  function syncLockState() {
    var openExists = controllers.some(function (c) {
      return c.isOpen();
    });
    overlay.hidden = !openExists;
    overlay.classList.toggle("is-open", openExists);
    document.body.classList.toggle("atelier-mobile-lock", openExists);
    root.classList.toggle("atelier-mobile-lock", openExists);
  }

  function setupSurface(cfg) {
    var host = document.querySelector(cfg.hostSelector);
    if (!host) return;

    var menu = host.querySelector(cfg.menuSelector);
    if (!menu || host.querySelector(".atelier-burger")) return;

    var burger = makeBurger(cfg.label);
    var anchor = cfg.anchorSelector ? host.querySelector(cfg.anchorSelector) : null;
    if (anchor && anchor.parentNode === host) {
      host.insertBefore(burger, anchor);
    } else {
      host.appendChild(burger);
    }

    var openClass = cfg.openClass;
    var menuClass = cfg.menuClass;
    menu.classList.add(menuClass);

    function open() {
      if (!mq.matches) return;
      closeAll();
      host.classList.add(openClass);
      burger.setAttribute("aria-expanded", "true");
      syncLockState();
    }

    function close() {
      host.classList.remove(openClass);
      burger.setAttribute("aria-expanded", "false");
      syncLockState();
    }

    burger.addEventListener("click", function () {
      if (host.classList.contains(openClass)) close();
      else open();
    });

    menu.querySelectorAll("a[href]").forEach(function (a) {
      a.addEventListener("click", close);
    });

    controllers.push({
      close: close,
      isOpen: function () {
        return host.classList.contains(openClass);
      },
    });
  }

  setupSurface({
    hostSelector: ".tpl-nav",
    menuSelector: ".links",
    anchorSelector: ".tpl-btn-primary",
    openClass: "tpl-nav-mobile-open",
    menuClass: "tpl-mobile-drawer",
    label: "Abrir menu principal",
  });

  setupSurface({
    hostSelector: ".doc-nav .doc-wrap",
    menuSelector: ".doc-nav-links",
    anchorSelector: ".doc-nav-cta",
    openClass: "doc-nav-mobile-open",
    menuClass: "doc-mobile-drawer",
    label: "Abrir secciones",
  });

  setupSurface({
    hostSelector: ".m3-top-bar",
    menuSelector: "nav",
    anchorSelector: ".m3-filled-button",
    openClass: "m3-top-bar-mobile-open",
    menuClass: "m3-mobile-drawer",
    label: "Abrir menu",
  });

  overlay.addEventListener("click", closeAll);

  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") closeAll();
  });

  mq.addEventListener("change", function () {
    if (!mq.matches) closeAll();
  });
})();
