/* =========================================================
   PAINTRA — commissions
   URL prefill, custom validation and the success state
   ========================================================= */

(function () {
  "use strict";

  var form = document.getElementById("booking-form");
  if (!form) return;

  var panel = document.querySelector(".booking-panel");
  var success = document.querySelector("[data-form-success]");
  var submitButton = form.querySelector("[data-submit]");
  var submitLabel = form.querySelector("[data-submit-label]");
  var resetButton = document.querySelector("[data-form-reset]");
  var selectedWork = document.querySelector("[data-selected-work]");
  var selectedImage = document.querySelector("[data-selected-img]");
  var selectedTitle = document.querySelector("[data-selected-title]");
  var selectedArtist = document.querySelector("[data-selected-artist]");
  var selectedChange = document.querySelector(".selected-work__change");

  var hasGSAP = typeof window.gsap !== "undefined";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var lenis = window.__lenis || null;
  var defaultLabel = "Send the brief";

  var fields = {
    name: form.querySelector("#name"),
    email: form.querySelector("#email"),
    artist: form.querySelector("#artist"),
    style: form.querySelector("#style"),
    budget: form.querySelector("#budget"),
    message: form.querySelector("#message")
  };

  var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /* ---------- Prefill from the collection ---------- */

  var params = new URLSearchParams(window.location.search);

  function setSelectIfValid(select, value) {
    if (!select || !value) return false;
    var valid = Array.prototype.some.call(select.options, function (option) {
      return option.value === value;
    });
    if (valid) select.value = value;
    return valid;
  }

  var artistParam = params.get("artist") || "";
  var styleParam = params.get("style") || "";

  setSelectIfValid(fields.artist, artistParam);
  setSelectIfValid(fields.style, styleParam);

  if (selectedChange && artistParam) {
    selectedChange.href = "gallery.html?artist=" + encodeURIComponent(artistParam);
  }

  var workParam = params.get("work") || "";
  var titleParam = (params.get("title") || "").slice(0, 80);
  var artistNames = {
    aiartman: "Aiartman",
    celistima: "Celistima",
    fantasy_ai_author: "Fantasy AI",
    lofipromt: "Lofipromt",
    maxvoao: "Maxvoao"
  };

  if (selectedWork && selectedImage && /^[a-z0-9_.-]+\.jpg$/i.test(workParam)) {
    selectedImage.src = workParam;
    selectedImage.alt = (titleParam || "Selected artwork") + " — limited edition artwork";
    if (selectedTitle) selectedTitle.textContent = titleParam || "Selected artwork";
    if (selectedArtist) {
      selectedArtist.textContent = artistNames[artistParam] || "From the archive";
    }
    selectedWork.hidden = false;
  }

  /* ---------- Validation ---------- */

  function getError(key) {
    var value = fields[key].value.trim();

    if (key === "name") {
      if (!value) return "Please tell us your name.";
      if (value.length < 2) return "That name looks a little short.";
    }

    if (key === "email") {
      if (!value) return "We need an email to reply to you.";
      if (!emailPattern.test(value)) return "Enter a valid email address.";
    }

    if (key === "artist" && !value) return "Choose an artist, or pick “No preference”.";
    if (key === "style" && !value) return "Choose the style you have in mind.";
    if (key === "budget" && !value) return "Choose a budget range.";

    if (key === "message") {
      if (!value) return "Tell us a little about the piece.";
      if (value.length < 10) return "A few more words — at least 10 characters.";
    }

    return "";
  }

  function setFieldState(key, message) {
    var field = fields[key];
    var wrapper = field.closest(".field");
    var error = wrapper ? wrapper.querySelector("[data-error]") : null;

    if (wrapper) wrapper.classList.toggle("is-invalid", Boolean(message));
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
  }

  function validateField(key) {
    var message = getError(key);
    setFieldState(key, message);
    return !message;
  }

  Object.keys(fields).forEach(function (key) {
    var field = fields[key];
    var eventName = field.tagName === "SELECT" ? "change" : "input";

    field.addEventListener(eventName, function () {
      if (field.closest(".field").classList.contains("is-invalid")) {
        validateField(key);
      }
    });

    field.addEventListener("blur", function () {
      if (field.value.trim() || field.closest(".field").classList.contains("is-invalid")) {
        validateField(key);
      }
    });
  });

  function clearErrors() {
    Object.keys(fields).forEach(function (key) {
      setFieldState(key, "");
    });
  }

  /* ---------- Submit ---------- */

  function selectedText(select) {
    if (!select || select.selectedIndex < 0) return "—";
    return select.options[select.selectedIndex].text.replace(/\s*—.*$/, "").trim();
  }

  function scrollToPanel() {
    if (!panel) return;
    var top = panel.getBoundingClientRect().top + window.scrollY - 110;

    if (lenis) {
      lenis.scrollTo(top);
    } else {
      window.scrollTo({ top: top, behavior: reduceMotion ? "auto" : "smooth" });
    }
  }

  function showSuccess() {
    if (!success) return;

    var firstName = fields.name.value.trim().split(/\s+/)[0] || "friend";

    var successName = success.querySelector("[data-success-name]");
    var successEmail = success.querySelector("[data-success-email]");
    var successArtist = success.querySelector("[data-success-artist]");
    var successStyle = success.querySelector("[data-success-style]");
    var successBudget = success.querySelector("[data-success-budget]");

    if (successName) successName.textContent = firstName;
    if (successEmail) successEmail.textContent = fields.email.value.trim();
    if (successArtist) successArtist.textContent = selectedText(fields.artist);
    if (successStyle) successStyle.textContent = selectedText(fields.style);
    if (successBudget) successBudget.textContent = fields.budget.value
      ? fields.budget.options[fields.budget.selectedIndex].text.trim()
      : "—";

    form.hidden = true;
    success.hidden = false;

    if (submitButton) {
      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");
    }
    if (submitLabel) submitLabel.textContent = defaultLabel;

    success.setAttribute("tabindex", "-1");
    success.focus({ preventScroll: true });

    if (hasGSAP && !reduceMotion) {
      gsap.fromTo(
        success,
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", clearProps: "opacity,transform" }
      );
    }

    window.setTimeout(scrollToPanel, 80);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();

    var honeypot = form.querySelector('[name="_company"]');
    if (honeypot && honeypot.value) return;

    var firstInvalid = null;

    Object.keys(fields).forEach(function (key) {
      var valid = validateField(key);
      if (!valid && !firstInvalid) firstInvalid = fields[key];
    });

    if (firstInvalid) {
      firstInvalid.focus({ preventScroll: false });

      form.classList.remove("is-shaking");
      void form.offsetWidth;
      form.classList.add("is-shaking");
      window.setTimeout(function () {
        form.classList.remove("is-shaking");
      }, 500);
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.classList.add("is-loading");
    }
    if (submitLabel) submitLabel.textContent = "Sending…";

    window.setTimeout(showSuccess, 900);
  });

  /* ---------- Reset ---------- */

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      form.reset();
      clearErrors();

      if (selectedWork) selectedWork.hidden = true;
      if (selectedImage) selectedImage.removeAttribute("src");

      if (success) success.hidden = true;
      form.hidden = false;

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.classList.remove("is-loading");
      }
      if (submitLabel) submitLabel.textContent = defaultLabel;

      try {
        window.history.replaceState(null, "", window.location.pathname);
      } catch (error) {
        /* history is optional */
      }

      fields.name.focus({ preventScroll: true });
      scrollToPanel();
    });
  }
})();
