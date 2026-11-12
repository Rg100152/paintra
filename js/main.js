/* =========================================================
   PAINTRA — shared interactions
   Smooth scroll, preloader, navigation, reveals, catalogue
   ========================================================= */

(function () {
  "use strict";

  var html = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var hasGSAP = typeof window.gsap !== "undefined";
  var hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";
  var catalogue = window.PAINTRA || {};

  if (hasGSAP && hasScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
  }

  var storage = {
    get: function (key) {
      try {
        return window.sessionStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    set: function (key, value) {
      try {
        window.sessionStorage.setItem(key, value);
      } catch (error) {
        /* storage is optional */
      }
    }
  };

  function formatPrice(value) {
    if (catalogue.formatPrice) return catalogue.formatPrice(value);
    return "₹" + Number(value).toLocaleString("en-IN");
  }

  /* ---------- Footer year ---------- */

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Hydrate catalogue cards ---------- */

  function workFrom(el) {
    var file = el.getAttribute("data-work");
    if (!file || !catalogue.workByFile) return null;
    return catalogue.workByFile(file);
  }

  document.querySelectorAll("[data-work]").forEach(function (el) {
    var work = workFrom(el);
    if (!work) return;

    el.querySelectorAll("[data-work-title]").forEach(function (node) {
      node.textContent = work.title;
    });
    el.querySelectorAll("[data-work-artist]").forEach(function (node) {
      node.textContent = work.artist;
    });
    el.querySelectorAll("[data-work-index]").forEach(function (node) {
      node.textContent = "No. " + work.number + " / 61";
    });
    el.querySelectorAll("[data-work-price]").forEach(function (node) {
      node.textContent = "From " + formatPrice(work.basePrice);
    });

    if (el.tagName === "A" && el.classList.contains("product-card")) {
      el.href = "gallery.html?work=" + encodeURIComponent(work.file);
      el.setAttribute(
        "aria-label",
        work.title + " by " + work.artist + " — view edition"
      );
    }
  });

  document.querySelectorAll("[data-price-min]").forEach(function (el) {
    var sizeId = el.getAttribute("data-price-min");
    if (!catalogue.works || !catalogue.sizes || !catalogue.priceForBase) return;

    var size = catalogue.sizes.filter(function (item) {
      return item.id === sizeId;
    })[0];

    var lowest = catalogue.works.reduce(function (min, work) {
      var price = catalogue.priceForBase(work.basePrice, size);
      return min === null || price < min ? price : min;
    }, null);

    if (lowest !== null) el.textContent = "From " + formatPrice(lowest);
  });

  /* ---------- Lenis smooth scroll ---------- */

  var lenis = null;

  if (!reduceMotion && typeof window.Lenis !== "undefined") {
    lenis = new Lenis({
      duration: 1.1,
      easing: function (t) {
        return Math.min(1, 1.001 - Math.pow(2, -10 * t));
      },
      smoothWheel: true,
      touchMultiplier: 1.3
    });

    if (hasGSAP) {
      lenis.on("scroll", function () {
        if (hasScrollTrigger) ScrollTrigger.update();
      });
      gsap.ticker.add(function (time) {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    } else {
      var lenisFrame = function (time) {
        lenis.raf(time);
        window.requestAnimationFrame(lenisFrame);
      };
      window.requestAnimationFrame(lenisFrame);
    }

    window.__lenis = lenis;
  }

  /* ---------- Scroll UI (progress + nav state) ---------- */

  var nav = document.querySelector(".site-nav");
  var progress = document.querySelector(".scroll-progress");
  var lastScroll = -1;

  function updateScrollUI(scroll) {
    if (Math.abs(scroll - lastScroll) < 0.5) return;
    lastScroll = scroll;

    if (nav) nav.classList.toggle("is-scrolled", scroll > 24);

    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(1, Math.max(0, scroll / max)) : 0;
      progress.style.transform = "scaleX(" + ratio + ")";
    }
  }

  updateScrollUI(window.scrollY || 0);

  if (lenis) {
    lenis.on("scroll", function (event) {
      updateScrollUI(event.scroll);
    });
  } else {
    var scrollTick = false;
    window.addEventListener(
      "scroll",
      function () {
        if (scrollTick) return;
        scrollTick = true;
        window.requestAnimationFrame(function () {
          updateScrollUI(window.scrollY || 0);
          scrollTick = false;
        });
      },
      { passive: true }
    );
  }

  window.addEventListener("resize", function () {
    lastScroll = -1;
    updateScrollUI(window.scrollY || 0);
  });

  /* ---------- Scroll reveals + page intros ---------- */

  var introStarted = false;

  function initReveals() {
    if (!hasGSAP || !hasScrollTrigger || reduceMotion) return;

    gsap.utils.toArray("[data-reveal]").forEach(function (el) {
      gsap.from(el, {
        y: 30,
        opacity: 0,
        duration: 0.95,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 91%",
          once: true
        }
      });
    });

    gsap.utils.toArray("[data-reveal-group]").forEach(function (group) {
      gsap.from(group.children, {
        y: 38,
        opacity: 0,
        duration: 1,
        stagger: 0.07,
        ease: "power3.out",
        scrollTrigger: {
          trigger: group,
          start: "top 90%",
          once: true
        }
      });
    });

    gsap.utils.toArray("[data-parallax]").forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-parallax")) || 8;
      gsap.fromTo(
        el,
        { yPercent: -speed / 2 },
        {
          yPercent: speed / 2,
          ease: "none",
          scrollTrigger: {
            trigger: el.closest("figure") || el,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  }

  function playPageIntro() {
    if (!hasGSAP || reduceMotion) return;

    var heroCopy = document.querySelectorAll(".hero__copy > *");
    var heroVisual = document.querySelector(".hero__visual");
    var pageHead = document.querySelectorAll(
      ".collection-head__top, .collection-title, .collection-head__row, .booking-head > *, .booking-aside, .booking-panel"
    );

    if (heroCopy.length) {
      gsap.from(heroCopy, {
        y: 26,
        opacity: 0,
        duration: 1,
        stagger: 0.09,
        ease: "power3.out"
      });

      if (heroVisual) {
        gsap.from(heroVisual, {
          y: 40,
          opacity: 0,
          duration: 1.15,
          delay: 0.18,
          ease: "power3.out"
        });
      }

      if (hasScrollTrigger) {
        gsap.to(".hero__art--main img", {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero",
            start: "top top",
            end: "bottom top",
            scrub: true
          }
        });
      }
      return;
    }

    if (pageHead.length) {
      gsap.from(pageHead, {
        y: 26,
        opacity: 0,
        duration: 0.95,
        stagger: 0.07,
        ease: "power3.out"
      });
    }
  }

  function startIntro() {
    if (introStarted) return;
    introStarted = true;
    initReveals();
    playPageIntro();
    if (hasScrollTrigger) {
      window.setTimeout(function () {
        ScrollTrigger.refresh();
      }, 350);
    }
  }

  /* ---------- Preloader ---------- */

  var preloader = document.querySelector(".preloader");
  var alreadyVisited = storage.get("paintra-visited") === "1";

  function removePreloader(delay) {
    if (!preloader) return;
    window.setTimeout(function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, delay || 0);
  }

  function finishPreloader(withAnimation) {
    html.classList.remove("is-locked");
    startIntro();

    if (!preloader) return;

    if (withAnimation) {
      preloader.classList.add("is-done");
      removePreloader(900);
    } else {
      preloader.style.display = "none";
      removePreloader(50);
    }
  }

  if (!preloader || alreadyVisited || reduceMotion) {
    html.classList.remove("is-locked");
    if (preloader) {
      preloader.style.display = "none";
      removePreloader(50);
    }
    startIntro();
  } else {
    html.classList.add("is-locked");
    storage.set("paintra-visited", "1");

    var bar = preloader.querySelector(".preloader__bar span");
    var duration = 850;
    var startedAt = window.performance.now();

    var tick = function (now) {
      var progressValue = Math.min(1, (now - startedAt) / duration);
      var eased = 1 - Math.pow(1 - progressValue, 3);
      var value = Math.round(eased * 100);

      if (bar) bar.style.width = value + "%";

      if (progressValue < 1) {
        window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(function () {
          finishPreloader(true);
        }, 160);
      }
    };

    window.requestAnimationFrame(tick);

    window.setTimeout(function () {
      if (preloader && !preloader.classList.contains("is-done")) {
        finishPreloader(true);
      }
    }, 3200);
  }

  /* ---------- Mobile menu ---------- */

  var navToggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");

  function closeMenu() {
    if (!html.classList.contains("menu-open")) return;
    html.classList.remove("menu-open");
    if (navToggle) navToggle.setAttribute("aria-expanded", "false");
    if (lenis) lenis.start();
  }

  if (navToggle && mobileMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = html.classList.toggle("menu-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));

      if (isOpen) {
        if (lenis) lenis.stop();
        if (hasGSAP && !reduceMotion) {
          gsap.fromTo(
            ".mobile-menu__link",
            { y: 22, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.06, delay: 0.18, ease: "power3.out" }
          );
        }
      } else if (lenis) {
        lenis.start();
      }
    });

    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 900) closeMenu();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && html.classList.contains("menu-open")) {
        closeMenu();
        navToggle.focus();
      }
    });
  }

  /* ---------- Active nav link ---------- */

  var path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a[href]").forEach(function (link) {
    var href = link.getAttribute("href").split("#")[0];
    if (href === path) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  /* ---------- Newsletter ---------- */

  document.querySelectorAll("[data-newsletter]").forEach(function (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();

      var input = form.querySelector('input[type="email"]');
      var note = form.querySelector("[data-newsletter-note]");
      if (!input) return;

      var value = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        if (note) note.textContent = "Please enter a valid email address.";
        form.classList.add("is-error");
        input.focus();
        return;
      }

      form.classList.remove("is-error");
      form.classList.add("is-done");
      if (note) note.textContent = "You’re on the list. Welcome to the studio.";
      input.value = "";
      input.blur();
    });
  });

  /* ---------- Smooth in-page anchors ---------- */

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener("click", function (event) {
      var hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      closeMenu();

      if (lenis) {
        lenis.scrollTo(target, { offset: -96 });
      } else {
        target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      }
    });
  });

  /* ---------- Refresh triggers once assets settle ---------- */

  window.addEventListener("load", function () {
    if (hasScrollTrigger) ScrollTrigger.refresh();
  });
})();
