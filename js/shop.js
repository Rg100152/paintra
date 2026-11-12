/* =========================================================
   PAINTRA — bag, checkout and order confirmation
   A small storefront layer shared by every page
   ========================================================= */

(function () {
  "use strict";

  var STORAGE_KEY = "paintra-bag-v1";
  var FREE_SHIPPING = 25000;
  var SHIPPING_FLAT = 950;

  var html = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var catalogue = window.PAINTRA || {};
  var lenis = window.__lenis || null;

  function formatPrice(value) {
    if (catalogue.formatPrice) return catalogue.formatPrice(value);
    return "₹" + Number(value).toLocaleString("en-IN");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- State ---------- */

  var items = [];

  try {
    var stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      var parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        items = parsed.filter(function (item) {
          return item && item.file && item.title && item.price && item.qty;
        });
      }
    }
  } catch (error) {
    items = [];
  }

  function save() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      /* storage is optional */
    }
  }

  function itemCount() {
    return items.reduce(function (total, item) {
      return total + item.qty;
    }, 0);
  }

  function subtotal() {
    return items.reduce(function (total, item) {
      return total + item.price * item.qty;
    }, 0);
  }

  function shipping() {
    var value = subtotal();
    if (!value) return 0;
    return value >= FREE_SHIPPING ? 0 : SHIPPING_FLAT;
  }

  function total() {
    return subtotal() + shipping();
  }

  /* ---------- Drawer markup ---------- */

  var shell = document.createElement("div");
  shell.className = "cart-shell";
  shell.setAttribute("aria-hidden", "true");
  shell.innerHTML =
    '<div class="cart-overlay" data-cart-close></div>' +
    '<aside class="cart" role="dialog" aria-modal="true" aria-labelledby="cart-title">' +
    '<header class="cart__head">' +
    '<div>' +
    '<p class="eyebrow">PAINTRA</p>' +
    '<h2 class="cart__title" id="cart-title" data-cart-title>Your bag</h2>' +
    "</div>" +
    '<button type="button" class="cart__close" data-cart-close aria-label="Close bag">' +
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19"/></svg>' +
    "</button>" +
    "</header>" +

    '<div class="cart__scroll">' +

    '<section class="cart__step" data-cart-step="bag">' +
    '<div class="cart-empty" data-cart-empty hidden>' +
    '<span class="cart-empty__icon" aria-hidden="true">' +
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1">' +
    '<rect x="9" y="12" width="46" height="40" />' +
    '<path d="M9 22h46M15 12v40M49 12v40" />' +
    '<path d="M24 34l7 7 12-15" />' +
    "</svg>" +
    "</span>" +
    "<h3>Your bag is quiet.</h3>" +
    "<p>Fill it with something worth living with — an original edition, printed for you.</p>" +
    '<button type="button" class="btn btn--primary" data-cart-shop>Browse the collection <span class="arrow">↗</span></button>' +
    "</div>" +

    '<div class="cart-full" data-cart-full hidden>' +
    '<div class="cart-items" data-cart-items></div>' +
    '<div class="cart-summary">' +
    '<div class="cart-line"><span>Subtotal</span><span data-cart-subtotal></span></div>' +
    '<div class="cart-line"><span>Shipping</span><span data-cart-shipping></span></div>' +
    '<div class="cart-line cart-line--total"><span>Total</span><span data-cart-total></span></div>' +
    '<p class="cart-summary__note">Taxes included. Each edition ships with a signed certificate of authenticity.</p>' +
    '<button type="button" class="btn btn--primary cart-summary__cta" data-cart-checkout>Proceed to checkout <span class="arrow">↗</span></button>' +
    '<button type="button" class="cart-continue" data-cart-close>Continue browsing</button>' +
    "</div>" +
    "</div>" +
    "</section>" +

    '<section class="cart__step" data-cart-step="checkout" hidden>' +
    '<button type="button" class="cart-back" data-cart-back>← Back to bag</button>' +
    '<form class="checkout-form" data-checkout-form novalidate>' +
    '<p class="eyebrow">Delivery details</p>' +
    '<h3 class="checkout-form__title">Where should it go?</h3>' +
    '<div class="cart-fields">' +
    '<label class="cart-field"><span>Email</span><input type="email" name="email" autocomplete="email" placeholder="you@example.com" required></label>' +
    '<label class="cart-field"><span>Full name</span><input type="text" name="name" autocomplete="name" placeholder="Jane Doe" required></label>' +
    '<label class="cart-field cart-field--full"><span>Address</span><input type="text" name="address" autocomplete="street-address" placeholder="Street and number" required></label>' +
    '<label class="cart-field"><span>City</span><input type="text" name="city" autocomplete="address-level2" placeholder="City" required></label>' +
    '<label class="cart-field"><span>Postal code</span><input type="text" name="postal" autocomplete="postal-code" placeholder="000 000" required></label>' +
    '<label class="cart-field cart-field--full"><span>Country</span><select name="country" autocomplete="country-name" required>' +
    '<option value="">Select a country</option>' +
    '<option value="India">India</option>' +
    '<option value="United Kingdom">United Kingdom</option>' +
    '<option value="United States">United States</option>' +
    '<option value="United Arab Emirates">United Arab Emirates</option>' +
    '<option value="Singapore">Singapore</option>' +
    '<option value="Australia">Australia</option>' +
    '<option value="Other">Other</option>' +
    "</select></label>" +
    "</div>" +
    '<p class="checkout-error" data-checkout-error hidden>Please complete the highlighted fields.</p>' +
    '<div class="cart-order">' +
    '<p class="cart-order__label">Order summary</p>' +
    '<div class="cart-order__items" data-cart-order-items></div>' +
    '<div class="cart-line"><span>Subtotal</span><span data-cart-subtotal></span></div>' +
    '<div class="cart-line"><span>Shipping</span><span data-cart-shipping></span></div>' +
    '<div class="cart-line cart-line--total"><span>Total</span><span data-cart-total></span></div>' +
    "</div>" +
    '<button type="submit" class="btn btn--primary cart-checkout__submit">Place order <span class="arrow">↗</span></button>' +
    '<p class="cart-checkout__fine">Payment is arranged after your edition has been proofed. No charge is made today.</p>' +
    "</form>" +
    "</section>" +

    '<section class="cart__step cart-done" data-cart-step="done" hidden>' +
    '<span class="cart-done__mark" aria-hidden="true">' +
    '<svg viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.1"><circle cx="32" cy="32" r="25"/><path d="M20 32l8 8 16-18"/></svg>' +
    "</span>" +
    '<p class="eyebrow">Order confirmed</p>' +
    '<h3 class="cart-done__title">Thank you. It’s in good hands.</h3>' +
    '<p class="cart-done__copy">We’ve saved your order <strong data-order-number>—</strong>. A confirmation is on its way, and our studio will be in touch within 48 hours to arrange proofing and delivery.</p>' +
    '<div class="cart-done__total"><span>Order total</span><strong data-order-total>—</strong></div>' +
    '<button type="button" class="btn btn--primary" data-cart-close>Continue browsing <span class="arrow">↗</span></button>' +
    "</section>" +

    "</div>" +
    "</aside>";

  document.body.appendChild(shell);

  var panel = shell.querySelector(".cart");
  var titleEl = shell.querySelector("[data-cart-title]");
  var itemsEl = shell.querySelector("[data-cart-items]");
  var orderItemsEl = shell.querySelector("[data-cart-order-items]");
  var emptyEl = shell.querySelector("[data-cart-empty]");
  var fullEl = shell.querySelector("[data-cart-full]");
  var steps = Array.prototype.slice.call(shell.querySelectorAll("[data-cart-step]"));
  var checkoutForm = shell.querySelector("[data-checkout-form]");
  var checkoutError = shell.querySelector("[data-checkout-error]");
  var currentStep = "bag";
  var lastTrigger = null;
  var isOpen = false;

  /* ---------- Rendering ---------- */

  function itemMarkup(item) {
    return (
      '<article class="cart-item" data-key="' +
      escapeHtml(item.key) +
      '">' +
      '<div class="cart-item__media"><img src="' +
      escapeHtml(item.file) +
      '" alt="' +
      escapeHtml(item.title) +
      " by " +
      escapeHtml(item.artist) +
      '" width="76" height="96" loading="lazy"></div>' +
      '<div class="cart-item__info">' +
      "<h3>" +
      escapeHtml(item.title) +
      "</h3>" +
      "<p>" +
      escapeHtml(item.artist) +
      " · " +
      escapeHtml(item.sizeLabel) +
      "</p>" +
      '<div class="cart-item__row">' +
      '<div class="qty" aria-label="Quantity">' +
      '<button type="button" data-cart-dec aria-label="Decrease quantity"' +
      (item.qty <= 1 ? " disabled" : "") +
      ">−</button>" +
      "<span>" +
      item.qty +
      "</span>" +
      '<button type="button" data-cart-inc aria-label="Increase quantity">+</button>' +
      "</div>" +
      '<span class="cart-item__price">' +
      formatPrice(item.price * item.qty) +
      "</span>" +
      "</div>" +
      '<button type="button" class="cart-item__remove" data-cart-remove>Remove</button>' +
      "</div>" +
      "</article>"
    );
  }

  function orderItemMarkup(item) {
    return (
      '<div class="cart-order__item">' +
      '<span class="cart-order__thumb"><img src="' +
      escapeHtml(item.file) +
      '" alt="" width="40" height="50" loading="lazy"></span>' +
      "<span class=\"cart-order__name\">" +
      escapeHtml(item.title) +
      " <em>×" +
      item.qty +
      "</em><small>" +
      escapeHtml(item.sizeLabel) +
      "</small></span>" +
      "<span class=\"cart-order__price\">" +
      formatPrice(item.price * item.qty) +
      "</span>" +
      "</div>"
    );
  }

  function updateTotals() {
    var sub = subtotal();
    var ship = shipping();
    var sum = sub + ship;

    shell.querySelectorAll("[data-cart-subtotal]").forEach(function (el) {
      el.textContent = formatPrice(sub);
    });
    shell.querySelectorAll("[data-cart-shipping]").forEach(function (el) {
      el.textContent = ship === 0 && sub > 0 ? "Complimentary" : formatPrice(ship);
    });
    shell.querySelectorAll("[data-cart-total]").forEach(function (el) {
      el.textContent = formatPrice(sum);
    });
  }

  function updateCount() {
    var count = itemCount();
    document.querySelectorAll("[data-cart-count]").forEach(function (el) {
      el.textContent = String(count);
    });
    document.querySelectorAll("[data-cart-open]").forEach(function (el) {
      el.setAttribute("aria-label", "Open bag, " + count + " item" + (count === 1 ? "" : "s"));
    });
  }

  function render() {
    itemsEl.innerHTML = items.map(itemMarkup).join("");
    orderItemsEl.innerHTML = items.map(orderItemMarkup).join("");

    var hasItems = items.length > 0;
    emptyEl.hidden = hasItems;
    fullEl.hidden = !hasItems;

    updateTotals();
    updateCount();
  }

  function showStep(step) {
    currentStep = step;
    steps.forEach(function (section) {
      section.hidden = section.getAttribute("data-cart-step") !== step;
    });
    if (titleEl) {
      titleEl.textContent =
        step === "bag" ? "Your bag" : step === "checkout" ? "Checkout" : "Order confirmed";
    }
    shell.querySelector(".cart__scroll").scrollTop = 0;
  }

  /* ---------- Open / close ---------- */

  function open(trigger) {
    if (isOpen) return;

    lastTrigger = trigger || null;
    isOpen = true;
    html.classList.remove("menu-open");
    html.classList.add("cart-open");
    shell.classList.add("is-open");
    shell.setAttribute("aria-hidden", "false");
    document.querySelectorAll(".nav-toggle").forEach(function (toggle) {
      toggle.setAttribute("aria-expanded", "false");
    });

    showStep("bag");

    if (lenis) lenis.stop();

    window.setTimeout(function () {
      var close = shell.querySelector(".cart__close");
      if (close) close.focus({ preventScroll: true });
    }, 50);
  }

  function close() {
    if (!isOpen) return;

    isOpen = false;
    html.classList.remove("cart-open");
    shell.classList.remove("is-open");
    shell.setAttribute("aria-hidden", "true");

    if (lenis) lenis.start();

    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  /* ---------- Bag actions ---------- */

  function add(item, trigger) {
    var key = item.file + "|" + item.sizeId;
    var existing = items.filter(function (entry) {
      return entry.key === key;
    })[0];

    if (existing) {
      existing.qty += item.qty || 1;
    } else {
      items.push({
        key: key,
        file: item.file,
        title: item.title,
        artist: item.artist,
        sizeId: item.sizeId,
        sizeLabel: item.sizeLabel,
        price: item.price,
        qty: item.qty || 1
      });
    }

    save();
    render();
    open(trigger);
  }

  function changeQty(key, delta) {
    var item = items.filter(function (entry) {
      return entry.key === key;
    })[0];
    if (!item) return;

    item.qty = Math.max(1, Math.min(10, item.qty + delta));
    save();
    render();
  }

  function remove(key) {
    items = items.filter(function (entry) {
      return entry.key !== key;
    });
    save();
    render();
  }

  /* ---------- Events ---------- */

  shell.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    if (target.closest("[data-cart-close]")) {
      close();
      return;
    }

    if (target.closest("[data-cart-back]")) {
      showStep("bag");
      return;
    }

    if (target.closest("[data-cart-checkout]")) {
      if (!items.length) return;
      showStep("checkout");
      return;
    }

    if (target.closest("[data-cart-shop]")) {
      var onGallery = document.getElementById("gallery-grid");
      close();
      if (!onGallery) window.location.href = "gallery.html";
      return;
    }

    var itemEl = target.closest(".cart-item");
    if (!itemEl) return;
    var key = itemEl.getAttribute("data-key");

    if (target.closest("[data-cart-inc]")) changeQty(key, 1);
    if (target.closest("[data-cart-dec]")) changeQty(key, -1);
    if (target.closest("[data-cart-remove]")) remove(key);
  });

  document.addEventListener("click", function (event) {
    var trigger = event.target instanceof Element && event.target.closest("[data-cart-open]");
    if (!trigger) return;

    event.preventDefault();
    if (currentStep === "done") showStep("bag");
    open(trigger);
  });

  document.addEventListener("keydown", function (event) {
    if (!isOpen) return;

    if (event.key === "Escape") {
      close();
      return;
    }

    if (event.key !== "Tab") return;

    var focusable = Array.prototype.slice
      .call(
        panel.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return el.offsetParent !== null;
      });

    if (!focusable.length) return;

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  /* ---------- Checkout ---------- */

  if (checkoutForm) {
    checkoutForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var fields = Array.prototype.slice.call(checkoutForm.querySelectorAll("input, select"));
      var firstInvalid = null;
      var valid = true;

      fields.forEach(function (field) {
        var value = field.value.trim();
        var fieldValid = Boolean(value);

        if (field.type === "email" && value) {
          fieldValid = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
        }

        field.closest(".cart-field").classList.toggle("is-invalid", !fieldValid);
        if (!fieldValid) {
          valid = false;
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (!valid) {
        if (checkoutError) checkoutError.hidden = false;
        if (firstInvalid) firstInvalid.focus({ preventScroll: false });
        return;
      }

      if (checkoutError) checkoutError.hidden = true;

      var orderTotal = total();
      var orderNumber = "PTR-" + String(Date.now()).slice(-6);
      var numberEl = shell.querySelector("[data-order-number]");
      var totalEl = shell.querySelector("[data-order-total]");
      if (numberEl) numberEl.textContent = orderNumber;
      if (totalEl) totalEl.textContent = formatPrice(orderTotal);

      items = [];
      save();
      render();
      checkoutForm.reset();
      showStep("done");
    });
  }

  /* ---------- Public API ---------- */

  window.PaintraShop = {
    add: add,
    open: open,
    close: close,
    count: itemCount,
    subtotal: subtotal
  };

  render();
})();
