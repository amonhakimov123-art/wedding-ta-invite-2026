(function () {
  "use strict";

  /* ===== Invite link gate (closed site) ===== */
  var INVITE_KEY = "ta24-7k9xm2qp";
  var gateEl = document.getElementById("invite-gate");
  var params = new URLSearchParams(window.location.search);
  var keyFromUrl = params.get("k");
  var stored = null;
  try { stored = sessionStorage.getItem("wedding_invite_ok"); } catch (e) {}

  function unlockInvite() {
    try { sessionStorage.setItem("wedding_invite_ok", INVITE_KEY); } catch (e) {}
    if (gateEl) gateEl.setAttribute("hidden", "");
    document.documentElement.classList.remove("invite-locked");
  }

  function lockInvite() {
    document.documentElement.classList.add("invite-locked");
    if (gateEl) gateEl.removeAttribute("hidden");
    var main = document.getElementById("main");
    var header = document.querySelector(".site-header");
    if (main) main.setAttribute("hidden", "");
    if (header) header.setAttribute("hidden", "");
  }

  if (keyFromUrl === INVITE_KEY) {
    unlockInvite();
    // keep ?k= in URL so the shared link stays copyable
  } else if (stored === INVITE_KEY) {
    unlockInvite();
  } else {
    lockInvite();
    return; // stop rest of script
  }


  /* ===== Target: 24 Oct 2026, 13:50 Asia/Vladivostok (UTC+10) ===== */
  var WEDDING_ISO = "2026-10-24T13:50:00+10:00";
  var weddingDate = new Date(WEDDING_ISO);

  /* ===== Russian pluralization ===== */
  /**
   * @param {number} n
   * @param {[string, string, string]} forms — [1, 2-4, 5+] e.g. ["день","дня","дней"]
   */
  function pluralize(n, forms) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs > 10 && abs < 20) return forms[2];
    if (last > 1 && last < 5) return forms[1];
    if (last === 1) return forms[0];
    return forms[2];
  }

  var LABELS = {
    days: ["день", "дня", "дней"],
    hours: ["час", "часа", "часов"],
    minutes: ["минута", "минуты", "минут"],
    seconds: ["секунда", "секунды", "секунд"]
  };

  /* ===== Countdown ===== */
  function updateCountdown() {
    var now = new Date();
    var diff = weddingDate.getTime() - now.getTime();
    var countdownEl = document.getElementById("countdown-timer");
    var doneEl = document.getElementById("countdown-done");

    if (!countdownEl) return;

    if (diff <= 0) {
      countdownEl.setAttribute("hidden", "");
      if (doneEl) doneEl.removeAttribute("hidden");
      return;
    }

    var totalSec = Math.floor(diff / 1000);
    var days = Math.floor(totalSec / 86400);
    var hours = Math.floor((totalSec % 86400) / 3600);
    var minutes = Math.floor((totalSec % 3600) / 60);
    var seconds = totalSec % 60;

    var units = { days: days, hours: hours, minutes: minutes, seconds: seconds };

    Object.keys(units).forEach(function (key) {
      var valueEl = countdownEl.querySelector('[data-unit="' + key + '"]');
      var labelEl = countdownEl.querySelector('[data-label="' + key + '"]');
      if (valueEl) valueEl.textContent = String(units[key]);
      if (labelEl) labelEl.textContent = pluralize(units[key], LABELS[key]);
    });
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  /* ===== Mobile nav ===== */
  var toggle = document.querySelector(".nav-toggle");
  var menu = document.getElementById("nav-menu");
  var header = document.querySelector(".site-header");

  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("open", !open);
    });

    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("open");
      });
    });
  }

  /* Header shadow on scroll */
  function onScroll() {
    if (header) {
      header.classList.toggle("scrolled", window.scrollY > 20);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ===== Smooth scroll for in-page links (fallback) ===== */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var id = anchor.getAttribute("href");
      if (!id || id === "#") return;
      e.preventDefault();
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var behavior = reduce ? "auto" : "smooth";
      // Sticky header has id="top" — scrollIntoView on it does nothing useful
      if (id === "#top" || anchor.classList.contains("footer-top")) {
        window.scrollTo({ top: 0, left: 0, behavior: behavior });
      } else {
        var target = document.querySelector(id);
        if (!target) return;
        target.scrollIntoView({ behavior: behavior, block: "start" });
      }
      if (history.pushState) {
        history.pushState(null, "", id);
      }
    });
  });

  /* ===== Fade-in on scroll ===== */
  function initFadeIn() {
    var els = document.querySelectorAll(".fade-in");
    if (!els.length) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("visible"); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    els.forEach(function (el) { observer.observe(el); });
  }
  initFadeIn();

  /* ===== RSVP form ===== */
  var STORAGE_KEY = "wedding-rsvp-timur-arina";
  var form = document.getElementById("rsvp-form");
  var thanks = document.getElementById("rsvp-thanks");
  var againBtn = document.getElementById("rsvp-again");

  function updateGuestsHint() {
    var a = document.getElementById("guest-adults");
    var k = document.getElementById("guest-kids");
    var hint = document.getElementById("guests-total-hint");
    if (!hint) return;
    var adults = a ? parseInt(a.value, 10) || 0 : 0;
    var kids = k ? parseInt(k.value, 10) || 0 : 0;
    hint.textContent = "Всего гостей: " + (adults + kids);
  }
  ["guest-adults", "guest-kids"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.addEventListener("input", updateGuestsHint);
  });
  updateGuestsHint();

  function clearErrors() {
    ["name-error", "attendance-error", "adults-error", "kids-error"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.textContent = "";
    });
    if (form) {
      form.querySelectorAll(".invalid").forEach(function (el) {
        el.classList.remove("invalid");
      });
    }
  }

  function showForm() {
    if (form) form.removeAttribute("hidden");
    if (thanks) thanks.setAttribute("hidden", "");
  }

  function showThanks() {
    if (form) form.setAttribute("hidden", "");
    if (thanks) thanks.removeAttribute("hidden");
  }

  function loadSaved() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && data.name) {
        showThanks();
      }
    } catch (e) {
      /* ignore corrupt storage */
    }
  }

  function validate() {
    clearErrors();
    var valid = true;
    var nameInput = document.getElementById("guest-name");
    var adultsInput = document.getElementById("guest-adults");
    var kidsInput = document.getElementById("guest-kids");
    var attendance = form.querySelector('input[name="attendance"]:checked');

    var name = (nameInput && nameInput.value || "").trim();
    if (!name || name.length < 2) {
      valid = false;
      var nameErr = document.getElementById("name-error");
      if (nameErr) nameErr.textContent = "Пожалуйста, укажите ваше имя.";
      if (nameInput) nameInput.classList.add("invalid");
    }

    if (!attendance) {
      valid = false;
      var attErr = document.getElementById("attendance-error");
      if (attErr) attErr.textContent = "Выберите вариант присутствия.";
    }

    var adults = adultsInput ? parseInt(adultsInput.value, 10) : 0;
    var kids = kidsInput ? parseInt(kidsInput.value, 10) : 0;
    if (isNaN(adults) || adults < 0 || adults > 20) {
      valid = false;
      var aErr = document.getElementById("adults-error");
      if (aErr) aErr.textContent = "Укажите число от 0 до 20.";
      if (adultsInput) adultsInput.classList.add("invalid");
    }
    if (isNaN(kids) || kids < 0 || kids > 20) {
      valid = false;
      var kErr = document.getElementById("kids-error");
      if (kErr) kErr.textContent = "Укажите число от 0 до 20.";
      if (kidsInput) kidsInput.classList.add("invalid");
    }
    if (!isNaN(adults) && !isNaN(kids) && adults + kids < 1) {
      valid = false;
      var aErr2 = document.getElementById("adults-error");
      if (aErr2) aErr2.textContent = "Укажите хотя бы одного гостя.";
      if (adultsInput) adultsInput.classList.add("invalid");
    }

    return valid;
  }


  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;

      var nameInput = document.getElementById("guest-name");
      var adultsInput = document.getElementById("guest-adults");
      var kidsInput = document.getElementById("guest-kids");
      var wishesInput = document.getElementById("guest-wishes");
      var seatInput = document.getElementById("guest-seat");
      var arrivalInput = document.getElementById("guest-arrival");
      var outfitInput = document.getElementById("guest-outfit");
      var extraInput = document.getElementById("guest-extra");
      var attendance = form.querySelector('input[name="attendance"]:checked');
      var toast = form.querySelector('input[name="toast"]:checked');
      var drinkBoxes = form.querySelectorAll('input[name="drinks"]:checked');
      var drinks = [];
      drinkBoxes.forEach(function (el) { drinks.push(el.value); });
      var paletteBoxes = form.querySelectorAll('input[name="palette"]:checked');
      var palette = [];
      paletteBoxes.forEach(function (el) { palette.push(el.value); });

      var payload = {
        name: (nameInput.value || "").trim(),
        attendance: attendance ? attendance.value : "",
        adults: parseInt(adultsInput && adultsInput.value, 10) || 0,
        kids: parseInt(kidsInput && kidsInput.value, 10) || 0,
        guests: (parseInt(adultsInput && adultsInput.value, 10) || 0) + (parseInt(kidsInput && kidsInput.value, 10) || 0),
        drinks: drinks,
        palette: palette,
        seat: seatInput ? (seatInput.value || "").trim() : "",
        toast: toast ? toast.value : "",
        arrival: arrivalInput ? (arrivalInput.value || "").trim() : "",
        outfit: outfitInput ? (outfitInput.value || "").trim() : "",
        extra: extraInput ? (extraInput.value || "").trim() : "",
        wishes: wishesInput ? (wishesInput.value || "").trim() : "",
        submittedAt: new Date().toISOString()
      };

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      } catch (err) {}

      var submitBtn = form.querySelector(".btn-submit");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка…";
      }

      var attendanceLabels = {
        "да": "Да, буду ✓",
        "нет": "К сожалению, нет",
        "возможно": "Возможно"
      };
      var attendanceNice = attendanceLabels[payload.attendance] || payload.attendance;
      var whenNice = new Date(payload.submittedAt).toLocaleString("ru-RU", {
        timeZone: "Asia/Vladivostok",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      var dash = "—";
      var drinksNice = payload.drinks.length ? payload.drinks.join(", ") : dash;

      /* Отправка на почту через Google Apps Script (работает из РФ без VPN) */
      var GAS_URL = "https://script.google.com/macros/s/AKfycbyq7H5fY3thj5dAbOrSBbRtkGVeJswWHXG78LYF_r27rSuHUiqUJx6dRCIeD8xtDrFy/exec";

      fetch(GAS_URL, {
        method: "POST",
        /* no-cors + text/plain: Apps Script принимает запрос и шлёт письмо;
           ответ opaque из‑за редиректа Google — «Спасибо» показываем всегда */
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          _subject: "💍 Анкета гостя — " + payload.name + " · Тимур и Арина",
          "Имя гостя": payload.name,
          "Присутствие": attendanceNice,
          "Взрослых": String(payload.adults),
          "Детей": String(payload.kids),
          "Всего гостей": String(payload.guests),
          "Напитки": drinksNice,
          "Палитра дресс-кода": (payload.palette && payload.palette.length ? payload.palette.join(", ") : dash),
          "С кем комфортнее сидеть": payload.seat || dash,
          "Готов сказать тост": payload.toast || dash,
          "Когда приедет": payload.arrival || dash,
          "Дресс-код / во что оденется": payload.outfit || dash,
          "Что ещё важно знать": payload.extra || dash,
          "Пожелания молодожёнам": payload.wishes || dash,
          "Когда ответили": whenNice + " (Владивосток)"
        })
      }).catch(function () {
        /* сеть — данные уже в localStorage */
      }).finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Отправить анкету";
        }
        showThanks();
      });
    });
  }


  if (againBtn) {
    againBtn.addEventListener("click", function () {
      try {
        var raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          var data = JSON.parse(raw);
          var nameInput = document.getElementById("guest-name");
          var adultsInput = document.getElementById("guest-adults");
      var kidsInput = document.getElementById("guest-kids");
          var wishesInput = document.getElementById("guest-wishes");
          var seatInput = document.getElementById("guest-seat");
          var arrivalInput = document.getElementById("guest-arrival");
          var outfitInput = document.getElementById("guest-outfit");
          var extraInput = document.getElementById("guest-extra");
          if (nameInput && data.name) nameInput.value = data.name;
          if (adultsInput) adultsInput.value = (data.adults != null ? data.adults : data.guests || 1);
          if (kidsInput) kidsInput.value = (data.kids != null ? data.kids : 0);
          updateGuestsHint();
          if (wishesInput && data.wishes) wishesInput.value = data.wishes;
          if (seatInput && data.seat) seatInput.value = data.seat;
          if (arrivalInput && data.arrival) arrivalInput.value = data.arrival;
          if (outfitInput && data.outfit) outfitInput.value = data.outfit;
          if (extraInput && data.extra) extraInput.value = data.extra;
          if (data.attendance) {
            var att = form.querySelector('input[name="attendance"][value="' + data.attendance + '"]');
            if (att) att.checked = true;
          }
          if (data.toast) {
            var t = form.querySelector('input[name="toast"][value="' + data.toast + '"]');
            if (t) t.checked = true;
          }
          form.querySelectorAll('input[name="drinks"]').forEach(function (cb) {
            cb.checked = Array.isArray(data.drinks) && data.drinks.indexOf(cb.value) !== -1;
          });
        }
      } catch (e) {}
      if (thanks) thanks.hidden = true;
      if (form) form.hidden = false;
      window.location.hash = "#rsvp";
    });
  }


  loadSaved();


  /* ===== Active nav link by section ===== */
  (function () {
    var links = Array.prototype.slice.call(document.querySelectorAll(".nav-menu a[href^='#']"));
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute("href").slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = a;
    });
    var ids = Object.keys(map);
    if (!ids.length) return;

    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute("href") === "#" + id;
        a.classList.toggle("is-active", on);
        if (on) a.setAttribute("aria-current", "true");
        else a.removeAttribute("aria-current");
      });
    }

    links.forEach(function (a) {
      a.addEventListener("click", function () {
        var id = a.getAttribute("href").slice(1);
        setActive(id);
      });
    });

    if (!("IntersectionObserver" in window)) {
      setActive(ids[0]);
      return;
    }
    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (e) { return e.isIntersecting; })
          .sort(function (a, b) { return b.intersectionRatio - a.intersectionRatio; });
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: [0.1, 0.25, 0.5] }
    );
    ids.forEach(function (id) { observer.observe(document.getElementById(id)); });
  })();


  /* ===== Background music ===== */
  (function () {
    var audio = document.getElementById("bg-music");
    var btn = document.getElementById("music-toggle");
    var label = document.getElementById("music-toggle-label");
    if (!audio || !btn) return;

    audio.volume = 0.18; /* quietly */
    var KEY = "wedding-music-on";

    function setUI(on) {
      btn.classList.toggle("is-playing", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Выключить музыку" : "Включить музыку");
      if (label) label.textContent = on ? "Выкл" : "Музыка";
    }

    function play() {
      var p = audio.play();
      if (p && typeof p.then === "function") {
        p.then(function () {
          try { localStorage.setItem(KEY, "1"); } catch (e) {}
          setUI(true);
        }).catch(function () {
          setUI(false);
        });
      } else {
        setUI(!audio.paused);
      }
    }

    function pause() {
      audio.pause();
      try { localStorage.setItem(KEY, "0"); } catch (e) {}
      setUI(false);
    }

    btn.addEventListener("click", function () {
      if (audio.paused) play();
      else pause();
    });

    /* Do not autoplay — browsers block it; restore only if user already opted in this session/device */
    try {
      if (localStorage.getItem(KEY) === "1") {
        /* still need a gesture on many browsers; leave off until click */
      }
    } catch (e) {}
    setUI(false);
  })();

  
  
  
  /* ===== Program of the day: round HTML heart along curve; events reveal ===== */
  (function () {
    var root = document.getElementById("program");
    var path = document.getElementById("program-path");
    var svg = document.getElementById("program-svg");
    var heart = document.getElementById("program-heart");
    if (!root || !path || !svg || !heart) return;

    var events = Array.prototype.slice.call(root.querySelectorAll(".program-event"));
    var pathLen = 0;
    var raf = 0;

    function measure() {
      try { pathLen = path.getTotalLength(); } catch (e) { pathLen = 0; }
    }

    function progress() {
      var rect = root.getBoundingClientRect();
      var vh = window.innerHeight || 1;
      var start = vh * 0.85;
      var end = vh * 0.15 - rect.height;
      var t = (start - rect.top) / (start - end);
      if (!isFinite(t)) t = 0;
      return Math.max(0, Math.min(1, t));
    }

    function placeHeart(t) {
      if (!pathLen) measure();
      if (!pathLen) return;
      var pt = path.getPointAtLength(t * pathLen);
      var rootRect = root.getBoundingClientRect();
      var ctm = path.getScreenCTM();
      if (!ctm) return;
      // Map SVG point → pixels relative to .program (heart is not stretched)
      var x = ctm.a * pt.x + ctm.c * pt.y + ctm.e - rootRect.left;
      var y = ctm.b * pt.x + ctm.d * pt.y + ctm.f - rootRect.top;
      heart.style.transform = "translate(" + x + "px," + y + "px)";
    }

    function revealEvents(t) {
      events.forEach(function (el) {
        var at = parseFloat(el.getAttribute("data-at") || "0");
        if (t >= at) el.classList.add("is-visible");
        else el.classList.remove("is-visible");
      });
    }

    function paint() {
      raf = 0;
      var t = progress();
      placeHeart(t);
      revealEvents(t);
    }

    function requestPaint() {
      if (!raf) raf = window.requestAnimationFrame(paint);
    }

    measure();
    placeHeart(0);
    requestPaint();
    setTimeout(function () { measure(); requestPaint(); }, 100);

    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", function () {
      measure();
      requestPaint();
    }, { passive: true });
  })();
})();
