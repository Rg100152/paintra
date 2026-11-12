/* =========================================================
   PAINTRA — the collection
   Filtering, sorting, search and the artwork detail viewer
   ========================================================= */

(function () {
  "use strict";

  var grid = document.getElementById("gallery-grid");
  if (!grid) return;

  var catalogue = window.PAINTRA || {};
  var works = catalogue.works || [];
  var artists = catalogue.artists || {};
  var sizes = catalogue.sizes || [];
  var formatPrice = catalogue.formatPrice || function (value) {
    return "₹" + Number(value).toLocaleString("en-IN");
  };

  var hasGSAP = typeof window.gsap !== "undefined";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenis = window.__lenis || null;

  function pad(number) {
    return String(number).padStart(2, "0");
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /* ---------- Render cards ---------- */

  function cardMarkup(work) {
    return (
      '<article class="product" data-file="' +
      escapeHtml(work.file) +
      '" data-artist="' +
      escapeHtml(work.key) +
      '">' +
      '<div class="product__media">' +
      '<img src="' +
      escapeHtml(work.file) +
      '" alt="' +
      escapeHtml(work.title) +
      " — " +
      escapeHtml(work.artist) +
      ' limited edition artwork" width="1080" height="1440" loading="lazy" decoding="async">' +
      '<span class="product__tag">Edition of 25</span>' +
      '<span class="product__hover" aria-hidden="true"><span>View piece</span><span class="product__plus">+</span></span>' +
      '<button type="button" class="product__open" data-open aria-label="View ' +
      escapeHtml(work.title) +
      " by " +
      escapeHtml(work.artist) +
      '"></button>' +
      "</div>" +
      '<div class="product__meta">' +
      "<div>" +
      '<h3 class="product__title">' +
      escapeHtml(work.title) +
      "</h3>" +
      '<p class="product__artist">' +
      escapeHtml(work.artist) +
      " · " +
      escapeHtml(work.collection) +
      "</p>" +
      "</div>" +
      '<span class="product__price"><em>From</em> ' +
      formatPrice(work.basePrice) +
      "</span>" +
      "</div>" +
      "</article>"
    );
  }

  grid.innerHTML = works.map(cardMarkup).join("");

  var cards = Array.prototype.slice.call(grid.querySelectorAll(".product"));
  var cardByFile = {};
  cards.forEach(function (card) {
    cardByFile[card.getAttribute("data-file")] = card;
  });

  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var searchInput = document.getElementById("gallery-search");
  var sortSelect = document.getElementById("gallery-sort");
  var visibleCountEl = document.querySelector(".js-visible-count");
  var emptyEl = document.querySelector(".collection-empty");
  var clearButton = document.querySelector("[data-clear-filters]");

  document.querySelectorAll("[data-filter-count]").forEach(function (el) {
    var key = el.getAttribute("data-filter-count");
    el.textContent =
      key === "all"
        ? String(works.length)
        : pad(catalogue.countByArtist ? catalogue.countByArtist[key] || 0 : 0);
  });

  document.querySelectorAll("[data-total-works]").forEach(function (el) {
    el.textContent = String(works.length);
  });

  /* ---------- State ---------- */

  var params = new URLSearchParams(window.location.search);
  var requestedArtist = params.get("artist");
  var state = {
    artist: artists[requestedArtist] ? requestedArtist : "all",
    query: "",
    sort: "featured"
  };

  function matchesState(work) {
    if (state.artist !== "all" && work.key !== state.artist) return false;
    if (!state.query) return true;

    var needle = state.query.toLowerCase();
    return (
      work.title.toLowerCase().indexOf(needle) !== -1 ||
      work.artist.toLowerCase().indexOf(needle) !== -1 ||
      work.collection.toLowerCase().indexOf(needle) !== -1
    );
  }

  function sortedWorks() {
    var list = works.filter(matchesState);

    if (state.sort === "price-asc") {
      list = list.slice().sort(function (a, b) {
        return a.basePrice - b.basePrice;
      });
    } else if (state.sort === "price-desc") {
      list = list.slice().sort(function (a, b) {
        return b.basePrice - a.basePrice;
      });
    } else if (state.sort === "title") {
      list = list.slice().sort(function (a, b) {
        return a.title.localeCompare(b.title);
      });
    }

    return list;
  }

  function syncUrl() {
    try {
      var url = new URL(window.location.href);
      if (state.artist === "all") {
        url.searchParams.delete("artist");
      } else {
        url.searchParams.set("artist", state.artist);
      }
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (error) {
      /* history is optional */
    }
  }

  function updateFilterUI() {
    filterButtons.forEach(function (button) {
      var isActive = button.getAttribute("data-filter") === state.artist;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function animateVisible(nodes, initial) {
    if (!hasGSAP || reduceMotion || !nodes.length) return;

    gsap.fromTo(
      nodes,
      { opacity: 0, y: initial ? 24 : 14 },
      {
        opacity: 1,
        y: 0,
        duration: initial ? 0.8 : 0.5,
        stagger: initial ? 0.014 : 0.008,
        ease: "power2.out",
        clearProps: "opacity,transform"
      }
    );
  }

  function applyState(initial) {
    var list = sortedWorks();
    var visibleFiles = {};
    list.forEach(function (work) {
      visibleFiles[work.file] = true;
    });

    cards.forEach(function (card) {
      var visible = Boolean(visibleFiles[card.getAttribute("data-file")]);
      card.hidden = !visible;
    });

    list.forEach(function (work) {
      grid.appendChild(cardByFile[work.file]);
    });

    updateFilterUI();
    syncUrl();

    if (visibleCountEl) visibleCountEl.textContent = String(list.length);
    if (emptyEl) emptyEl.hidden = list.length !== 0;

    animateVisible(
      list.map(function (work) {
        return cardByFile[work.file];
      }),
      Boolean(initial)
    );
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var filter = button.getAttribute("data-filter");
      if (filter === state.artist) return;
      state.artist = filter;
      applyState(false);
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      state.query = searchInput.value.trim();
      applyState(false);
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener("change", function () {
      state.sort = sortSelect.value;
      applyState(false);
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", function () {
      state.artist = "all";
      state.query = "";
      if (searchInput) searchInput.value = "";
      applyState(false);
    });
  }

  applyState(true);

  /* ---------- Detail viewer ---------- */

  var modal = document.getElementById("art-modal");
  if (!modal) return;

  var modalImage = modal.querySelector(".art-modal__image");
  var modalTitle = modal.querySelector(".art-modal__title");
  var modalArtist = modal.querySelector(".art-modal__artist");
  var modalDesc = modal.querySelector(".art-modal__desc");
  var modalNumber = modal.querySelector("[data-lb-number]");
  var modalPrice = modal.querySelector("[data-lb-price]");
  var modalSizes = modal.querySelector("[data-lb-sizes]");
  var modalQty = modal.querySelector("[data-lb-qty]");
  var modalAdd = modal.querySelector("[data-lb-add]");
  var modalAddLabel = modal.querySelector("[data-lb-add-label]");
  var modalBook = modal.querySelector("[data-lb-book]");
  var modalCurrent = modal.querySelector("[data-lb-current]");
  var modalTotal = modal.querySelector("[data-lb-total]");
  var closeBtn = modal.querySelector("[data-lb-close]");
  var prevBtn = modal.querySelector("[data-lb-prev]");
  var nextBtn = modal.querySelector("[data-lb-next]");
  var visual = modal.querySelector(".art-modal__visual");

  var activeList = [];
  var currentIndex = -1;
  var currentWork = null;
  var selectedSize = null;
  var quantity = 1;
  var lastTrigger = null;
  var touchStartX = 0;
  var touchStartY = 0;

  function sizeMarkup(work, size) {
    var price = catalogue.priceForBase
      ? catalogue.priceForBase(work.basePrice, size)
      : work.basePrice;

    return (
      '<label class="size-option' +
      (selectedSize && selectedSize.id === size.id ? " is-selected" : "") +
      '">' +
      '<input type="radio" name="edition-size" value="' +
      size.id +
      '"' +
      (selectedSize && selectedSize.id === size.id ? " checked" : "") +
      ">" +
      '<span class="size-option__top"><strong>' +
      size.label +
      "</strong><span>" +
      size.dims +
      "</span></span>" +
      '<span class="size-option__note">' +
      size.note +
      "</span>" +
      '<span class="size-option__price">' +
      formatPrice(price) +
      "</span>" +
      "</label>"
    );
  }

  function sizePrice(work, size) {
    return catalogue.priceForBase
      ? catalogue.priceForBase(work.basePrice, size)
      : work.basePrice;
  }

  function selectedTotal() {
    if (!currentWork || !selectedSize) return 0;
    return sizePrice(currentWork, selectedSize) * quantity;
  }

  function updateBuyUI() {
    if (!currentWork || !selectedSize) return;

    if (modalPrice) modalPrice.textContent = formatPrice(sizePrice(currentWork, selectedSize));
    if (modalQty) modalQty.textContent = String(quantity);

    if (modalAddLabel) {
      modalAddLabel.textContent = "Add to bag — " + formatPrice(selectedTotal());
    }

    if (modalSizes) {
      modalSizes.querySelectorAll(".size-option").forEach(function (label) {
        var input = label.querySelector("input");
        label.classList.toggle("is-selected", Boolean(input && input.checked));
      });
    }
  }

  function renderModal(work) {
    if (!work) return;

    currentWork = work;
    quantity = 1;
    selectedSize = sizes[0] || null;

    if (modalTitle) modalTitle.textContent = work.title;
    if (modalArtist) {
      modalArtist.textContent =
        work.artist + " · " + work.collection + " · 2026";
    }
    if (modalDesc) modalDesc.textContent = work.description;
    if (modalNumber) modalNumber.textContent = "No. " + work.number + " / 61";

    if (modalCurrent) modalCurrent.textContent = pad(currentIndex + 1);
    if (modalTotal) modalTotal.textContent = pad(activeList.length);

    if (modalSizes) {
      modalSizes.innerHTML = sizes.map(function (size) {
        return sizeMarkup(work, size);
      }).join("");
    }

    updateBuyUI();

    if (modalBook) {
      modalBook.href =
        "booking.html?artist=" +
        encodeURIComponent(work.key) +
        "&work=" +
        encodeURIComponent(work.file) +
        "&title=" +
        encodeURIComponent(work.title);
    }

    if (modalImage) {
      modalImage.classList.remove("is-in");

      var preload = new Image();
      preload.onload = function () {
        modalImage.src = work.file;
        modalImage.alt = work.title + " — " + work.artist + " limited edition";
        window.requestAnimationFrame(function () {
          modalImage.classList.add("is-in");
        });
      };
      preload.onerror = function () {
        modalImage.classList.add("is-in");
      };
      preload.src = work.file;
    }

    try {
      var url = new URL(window.location.href);
      url.searchParams.set("work", work.file);
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (error) {
      /* history is optional */
    }
  }

  function openModal(file, trigger) {
    var work = catalogue.workByFile ? catalogue.workByFile(file) : null;
    if (!work) return;

    if (!matchesState(work)) {
      state.artist = "all";
      state.query = "";
      if (searchInput) searchInput.value = "";
      applyState(false);
    }

    activeList = sortedWorks();
    trigger = trigger || grid.querySelector('.product[data-file="' + file + '"] [data-open]');
    currentIndex = activeList.indexOf(work);
    if (currentIndex < 0) currentIndex = 0;

    lastTrigger = trigger || null;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.classList.add("modal-open");

    if (lenis) lenis.stop();

    renderModal(work);

    window.setTimeout(function () {
      if (closeBtn) closeBtn.focus({ preventScroll: true });
    }, 50);
  }

  function closeModal() {
    if (!modal.classList.contains("is-open")) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.classList.remove("modal-open");

    if (lenis && !document.documentElement.classList.contains("cart-open")) {
      lenis.start();
    }

    try {
      var url = new URL(window.location.href);
      url.searchParams.delete("work");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (error) {
      /* history is optional */
    }

    if (lastTrigger) lastTrigger.focus({ preventScroll: true });
  }

  function step(direction) {
    if (!activeList.length) return;
    currentIndex = (currentIndex + direction + activeList.length) % activeList.length;
    renderModal(activeList[currentIndex]);
  }

  grid.addEventListener("click", function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;

    var card = target.closest(".product");
    if (!card) return;

    var file = card.getAttribute("data-file");
    openModal(file, card.querySelector("[data-open]"));
  });

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (prevBtn) prevBtn.addEventListener("click", function () { step(-1); });
  if (nextBtn) nextBtn.addEventListener("click", function () { step(1); });

  modal.querySelectorAll("[data-lb-dismiss]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  if (modalSizes) {
    modalSizes.addEventListener("change", function (event) {
      var input = event.target;
      if (!(input instanceof HTMLInputElement)) return;

      selectedSize = sizes.filter(function (size) {
        return size.id === input.value;
      })[0] || sizes[0];

      updateBuyUI();
    });
  }

  var decBtn = modal.querySelector("[data-lb-dec]");
  var incBtn = modal.querySelector("[data-lb-inc]");

  if (decBtn) {
    decBtn.addEventListener("click", function () {
      quantity = Math.max(1, quantity - 1);
      updateBuyUI();
    });
  }

  if (incBtn) {
    incBtn.addEventListener("click", function () {
      quantity = Math.min(5, quantity + 1);
      updateBuyUI();
    });
  }

  if (modalAdd) {
    modalAdd.addEventListener("click", function () {
      if (!currentWork || !selectedSize || !window.PaintraShop) return;

      var work = currentWork;
      var size = selectedSize;
      var price = sizePrice(work, size);
      var qty = quantity;

      closeModal();
      window.PaintraShop.add(
        {
          file: work.file,
          title: work.title,
          artist: work.artist,
          sizeId: size.id,
          sizeLabel: size.label,
          price: price,
          qty: qty
        },
        modalAdd
      );
    });
  }

  if (visual) {
    visual.addEventListener(
      "touchstart",
      function (event) {
        if (!event.touches.length) return;
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      },
      { passive: true }
    );

    visual.addEventListener(
      "touchend",
      function (event) {
        if (!event.changedTouches.length) return;
        var deltaX = event.changedTouches[0].clientX - touchStartX;
        var deltaY = event.changedTouches[0].clientY - touchStartY;

        if (Math.abs(deltaX) > 55 && Math.abs(deltaX) > Math.abs(deltaY)) {
          step(deltaX > 0 ? -1 : 1);
        }
      },
      { passive: true }
    );
  }

  document.addEventListener("keydown", function (event) {
    if (!modal.classList.contains("is-open")) return;

    if (event.key === "Escape") {
      closeModal();
      return;
    }
    if (event.key === "ArrowLeft") step(-1);
    if (event.key === "ArrowRight") step(1);

    if (event.key !== "Tab") return;

    var focusable = Array.prototype.slice
      .call(
        modal.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(function (el) {
        return el.offsetParent !== null || el === closeBtn;
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

  /* ---------- Deep link into a work ---------- */

  var workParam = new URLSearchParams(window.location.search).get("work");
  if (workParam && cardByFile[workParam]) {
    window.setTimeout(function () {
      openModal(workParam, cardByFile[workParam].querySelector("[data-open]"));
    }, 120);
  }

  if (hasGSAP && typeof window.ScrollTrigger !== "undefined") {
    window.setTimeout(function () {
      window.ScrollTrigger.refresh();
    }, 250);
  }
})();
