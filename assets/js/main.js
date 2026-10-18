/* NeuroAI Research Group — site behaviour (no dependencies) */
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- header: scrolled state + mobile menu ---------------- */
  var head = document.querySelector("[data-head]");
  var toggle = document.querySelector("[data-menu-toggle]");
  function onScroll() {
    if (head) head.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (toggle && head) {
    toggle.addEventListener("click", function () {
      setMenu(!head.classList.contains("is-open"));
    });
    function setMenu(open) {
      head.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.documentElement.style.overflow = open ? "hidden" : "";
    }
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && head.classList.contains("is-open")) {
        setMenu(false);
        toggle.focus();
      }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 880 && head.classList.contains("is-open")) setMenu(false);
    });
  }

  /* ---------------- background starfield ---------------- */
  var sky = document.querySelector(".starfield");
  if (sky && sky.getContext) {
    var ctx = sky.getContext("2d");
    var stars = [];
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function seed(n) {
      // deterministic so the sky doesn't jump between pages
      var s = 1234567;
      function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
      stars = [];
      for (var i = 0; i < n; i++) {
        var r = rnd();
        stars.push({
          x: rnd(), y: rnd(),
          m: r < 0.92 ? rnd() * 0.7 + 0.25 : rnd() * 1.1 + 0.9,
          a: rnd() * 0.6 + 0.25,
          warm: rnd() < 0.18,
          tw: rnd() < 0.12 ? rnd() * 6.28 : -1
        });
      }
    }
    function draw(t) {
      var w = sky.width, h = sky.height;
      ctx.clearRect(0, 0, w, h);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var a = st.a;
        if (st.tw >= 0 && t) a *= 0.65 + 0.35 * Math.sin(t / 900 + st.tw);
        ctx.fillStyle = st.warm ? "rgba(255,226,180," + a + ")" : "rgba(214,226,255," + a + ")";
        ctx.beginPath();
        ctx.arc(st.x * w, st.y * h, st.m * dpr, 0, 6.2832);
        ctx.fill();
      }
    }
    function size() {
      sky.width = Math.round(window.innerWidth * dpr);
      sky.height = Math.round(window.innerHeight * dpr);
      seed(Math.round((window.innerWidth * window.innerHeight) / 5200));
      draw(0);
    }
    size();
    var resizeT;
    window.addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(size, 150); });
    if (!reduceMotion) {
      var last = 0;
      (function loop(t) {
        if (t - last > 80) { draw(t); last = t; }
        if (!document.hidden) requestAnimationFrame(loop); else setTimeout(function () { requestAnimationFrame(loop); }, 500);
      })(0);
    }
  }

  /* ---------------- lightbox ---------------- */
  var lb = document.querySelector("[data-lightbox-root]");
  if (lb) {
    var lbImg = lb.querySelector("[data-lightbox-img]");
    var lbCap = lb.querySelector("[data-lightbox-cap]");
    var lbCount = lb.querySelector("[data-lightbox-count]");
    var group = [], idx = 0, opener = null;

    function show(i) {
      idx = (i + group.length) % group.length;
      var a = group[idx];
      var src = a.getAttribute("href");
      var thumb = a.querySelector("img");
      lbImg.classList.toggle("on-dark", !!(thumb && thumb.classList.contains("on-dark")));
      lbImg.src = src;
      lbImg.alt = thumb ? thumb.alt : "";
      lbCap.textContent = a.getAttribute("data-caption") || "";
      lbCount.textContent = group.length > 1 ? (idx + 1) + " / " + group.length : "";
      lb.querySelector("[data-lightbox-prev]").hidden = group.length < 2;
      lb.querySelector("[data-lightbox-next]").hidden = group.length < 2;
      // preload neighbours
      [idx + 1, idx - 1].forEach(function (k) {
        var n = group[(k + group.length) % group.length];
        if (n) { var im = new Image(); im.src = n.getAttribute("href"); }
      });
    }
    function open(a) {
      var name = a.getAttribute("data-lightbox");
      group = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox="' + name + '"]'));
      opener = a;
      lb.hidden = false;
      document.documentElement.style.overflow = "hidden";
      show(group.indexOf(a));
      lb.querySelector("[data-lightbox-close]").focus();
    }
    function close() {
      lb.hidden = true;
      lbImg.removeAttribute("src");
      document.documentElement.style.overflow = "";
      if (opener) opener.focus();
    }
    document.addEventListener("click", function (e) {
      var a = e.target.closest && e.target.closest("a[data-lightbox]");
      if (a) { e.preventDefault(); open(a); }
    });
    lb.querySelector("[data-lightbox-close]").addEventListener("click", close);
    lb.querySelector("[data-lightbox-prev]").addEventListener("click", function () { show(idx - 1); });
    lb.querySelector("[data-lightbox-next]").addEventListener("click", function () { show(idx + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) close(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") show(idx + 1);
      else if (e.key === "ArrowLeft") show(idx - 1);
      else if (e.key === "Tab") {
        var f = Array.prototype.filter.call(lb.querySelectorAll("button"), function (b) { return !b.hidden; });
        var first = f[0], lastB = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastB.focus(); }
        else if (!e.shiftKey && document.activeElement === lastB) { e.preventDefault(); first.focus(); }
      }
    });
    var x0 = null;
    lb.addEventListener("touchstart", function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    });
  }

  /* ---------------- films: swap the poster for the player on click ---------------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-film]"), function (btn) {
    btn.addEventListener("click", function () {
      var v = document.createElement("video");
      v.src = btn.getAttribute("data-film");
      v.poster = btn.querySelector("img").getAttribute("src");
      v.controls = true; v.autoplay = true; v.playsInline = true; v.preload = "auto";
      v.setAttribute("aria-label", btn.getAttribute("aria-label"));
      btn.replaceWith(v);
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      v.focus();
    });
  });

  /* ---------------- publications: search ---------------- */
  var pubs = document.querySelector("[data-pubs]");
  if (pubs) {
    var q = pubs.querySelector("[data-pubs-q]");
    var empty = pubs.querySelector("[data-pubs-empty]");
    var blocks = pubs.querySelectorAll("[data-year-block]");
    var items = Array.prototype.map.call(pubs.querySelectorAll(".pub"), function (li) {
      return { el: li, text: li.textContent.toLowerCase() };
    });
    q.addEventListener("input", function () {
      var terms = (q.value || "").toLowerCase().trim().split(/\s+/).filter(Boolean);
      var n = 0;
      items.forEach(function (it) {
        var ok = terms.every(function (t) { return it.text.indexOf(t) !== -1; });
        it.el.hidden = !ok;
        if (ok) n++;
      });
      Array.prototype.forEach.call(blocks, function (b) {
        b.hidden = !b.querySelector(".pub:not([hidden])");
      });
      empty.hidden = n !== 0;
    });
  }
})();
