/* Album: hero stage (prints resolve into a tree), face crops, rewatch player. Vanilla JS, no deps. */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var q = new URLSearchParams(location.search);
  var freeze = q.has("t") ? parseFloat(q.get("t")) : null;

  /* face centre (fx, fy) and head width (ff) as fractions of each 4:5 print */
  var FACES = {
    p1952: { src: "assets/p1952.jpg", fx: 0.39, fy: 0.28, ff: 0.2 },
    p1975: { src: "assets/p1975.jpg", fx: 0.29, fy: 0.26, ff: 0.21 },
    p1994: { src: "assets/p1994.jpg", fx: 0.41, fy: 0.32, ff: 0.27 },
    p2008: { src: "assets/p2008.jpg", fx: 0.32, fy: 0.48, ff: 0.2 },
    p2025: { src: "assets/p2025.jpg", fx: 0.7, fy: 0.33, ff: 0.3 },
    grandpa: { src: "assets/grandpa.jpg", fx: 0.62, fy: 0.3, ff: 0.62, ar: 1168 / 880 }
  };
  window.ALBUM_FACES = FACES;
  window.__faceCrop = function (el, key, d) { faceCrop(el, key, d); };

  function faceCrop(el, key, d) {
    var f = FACES[key], ar = f.ar || 1.25;
    var w = d / f.ff * 0.82; // head fills about 80 percent of the circle
    var img = el.querySelector("img");
    if (!img) { img = document.createElement("img"); img.alt = ""; img.src = f.src; el.appendChild(img); }
    img.style.width = w + "px";
    img.style.height = w * ar + "px";
    img.style.left = d / 2 - f.fx * w + "px";
    img.style.top = d / 2 - f.fy * w * ar + "px";
    el.style.width = el.style.height = d + "px";
  }
  document.querySelectorAll("[data-face]").forEach(function (el) {
    faceCrop(el, el.getAttribute("data-face"), parseFloat(el.getAttribute("data-d") || "64"));
  });

  /* ---------- hero stage ---------- */
  var stage = document.getElementById("stage");
  if (stage) {
    var ASPECT = 1.12;
    var people = [
      { k: "p1952", name: "Arthur", yr: "1952", sx: 0.32, sy: 0.4, sr: -9, tx: 0.3, ty: 0.13, fl: 0.0 },
      { k: "p1975", name: "Daniel", yr: "1975", sx: 0.64, sy: 0.33, sr: 6, tx: 0.3, ty: 0.39, fl: 1.3 },
      { k: "p1994", name: "Rosa", yr: "1994", sx: 0.4, sy: 0.6, sr: -3, tx: 0.7, ty: 0.39, fl: 2.4 },
      { k: "p2008", name: "Theo", yr: "2008", sx: 0.68, sy: 0.64, sr: 8, tx: 0.34, ty: 0.7, fl: 3.2 },
      { k: "p2025", name: "Nina", yr: "2025", sx: 0.5, sy: 0.5, sr: 2, tx: 0.66, ty: 0.7, fl: 4.1 }
    ];
    var svgNS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("class", "tree-lines");
    svg.setAttribute("aria-hidden", "true");
    stage.appendChild(svg);
    var paths = [0, 1, 2, 3, 4].map(function () {
      var p = document.createElementNS(svgNS, "path");
      p.setAttribute("pathLength", "1");
      p.style.strokeDasharray = "1";
      svg.appendChild(p);
      return p;
    });
    people.forEach(function (p, i) {
      var f = FACES[p.k];
      var el = document.createElement("div");
      el.className = "print";
      el.setAttribute("role", "img");
      el.setAttribute("aria-label", "Photograph from " + p.yr + ", " + p.name);
      el.innerHTML = '<div class="pic"><img alt="" src="' + f.src + '"><span class="ring"></span></div>';
      el.style.zIndex = 2 + i;
      stage.appendChild(el);
      p.el = el; p.pic = el.firstChild; p.img = p.pic.querySelector("img"); p.ring = p.pic.querySelector(".ring");
      var tag = document.createElement("div");
      tag.className = "tag"; tag.style.zIndex = 20;
      tag.textContent = p.name;
      stage.appendChild(tag);
      p.tag = tag;
    });
    var cap = document.createElement("div");
    cap.className = "stagecap"; cap.style.zIndex = 30;
    cap.setAttribute("aria-hidden", "true");
    stage.appendChild(cap);

    var S = 0;
    function sstep(a, b, x) { x = Math.min(1, Math.max(0, (x - a) / (b - a))); return x * x * (3 - 2 * x); }
    function lerp(a, b, t) { return a + (b - a) * t; }
    var LOOP = 28;
    function phase(t) { // 0 = stack, 1 = tree
      t = t % LOOP;
      if (t < 7) return 0;
      if (t < 12) return sstep(0, 1, (t - 7) / 5);
      if (t < 22) return 1;
      if (t < 26) return 1 - sstep(0, 1, (t - 22) / 4);
      return 0;
    }
    function render(t) {
      var P = reduce ? 1 : phase(t);
      S = stage.clientWidth;
      var H = S * ASPECT;
      var sw = S * 0.5, sh = sw * 1.25;               // stack print size
      var d = S * (S < 400 ? 0.2 : 0.215);            // tree circle diameter
      var pad = 8;                          // white mat
      people.forEach(function (p, i) {
        var f = FACES[p.k];
        var fl = reduce ? 0 : 1 - P;
        var fx = Math.sin(t * 0.35 + p.fl) * S * 0.012 * fl;
        var fy = Math.cos(t * 0.29 + p.fl * 1.7) * S * 0.012 * fl;
        var fr = Math.sin(t * 0.22 + p.fl) * 1.4 * fl;
        var cx = lerp(p.sx * S, p.tx * S, P) + fx;
        var cy = lerp(p.sy * H, p.ty * H, P) + fy;
        var rot = lerp(p.sr, 0, P) + fr;
        var w = lerp(sw, d, P), h = lerp(sh, d, P);
        // pic inside the mat
        var el = p.el;
        el.style.width = w + "px"; el.style.height = h + "px";
        el.style.borderRadius = lerp(3, 50, P) + "%";
        el.style.transform = "translate(" + (cx - w / 2) + "px," + (cy - h / 2) + "px) rotate(" + rot + "deg)";
        el.style.border = lerp(pad, 4, P) + "px solid #fff";
        // geometry inside border box: content box is w - 2*border
        var bw = lerp(pad, 4, P);
        var cw = w - 2 * bw, ch = h - 2 * bw;
        el.style.boxSizing = "border-box";
        var scale = lerp(1, (d / f.ff * 0.82) / (sw - 2 * pad), P);
        var picw = (sw - 2 * pad) * scale;
        p.pic.style.width = picw + "px"; p.pic.style.height = picw * 1.25 + "px";
        var cdia = d - 8;
        p.pic.style.left = lerp(0, cdia / 2 - f.fx * picw, P) + "px";
        p.pic.style.top = lerp(0, cdia / 2 - f.fy * picw * 1.25, P) + "px";
        // ring: visible once the stack has settled, until the print becomes a circle
        var rIn = reduce ? 0 : sstep(5.2 + i * 0.2, 5.9 + i * 0.2, t % LOOP) * (1 - sstep(0.05, 0.45, P));
        var rOut = (t % LOOP) >= 22 ? 0 : 1;
        p.ring.style.opacity = (t % LOOP) < 26 ? rIn * rOut : 0;
        var rd = f.ff * picw;
        p.ring.style.left = f.fx * 100 + "%"; p.ring.style.top = f.fy * 100 + "%";
        p.ring.style.width = p.ring.style.height = rd + "px";
        // tag: year over a print, name under a circle
        p.tag.style.transform = "translate(" + (cx - p.tag.offsetWidth / 2) + "px," + (cy + h / 2 + 8) + "px)";
        p.tag.style.opacity = sstep(0.6, 0.9, P);
        el.style.opacity = 1;
      });
      // branches: parent bottom, elbow, child top, centred on circle positions
      function C(i) { return [people[i].tx * S, people[i].ty * H]; }
      var r = d / 2;
      var a = C(0), dn = C(1), ro = C(2), th = C(3), ni = C(4);
      var mid = (dn[0] + ro[0]) / 2;
      var ym = (th[1] + dn[1]) / 2 + 6;
      var defs = [
        "M" + a[0] + " " + (a[1] + r + 34) + " V" + (dn[1] - r - 6),
        "M" + (dn[0] + r + 4) + " " + dn[1] + " H" + (ro[0] - r - 4),
        "M" + mid + " " + dn[1] + " V" + ym + " H" + th[0] + " V" + (th[1] - r - 6),
        "M" + mid + " " + ym + " H" + ni[0] + " V" + (ni[1] - r - 6),
        "M" + mid + " " + dn[1] + " V" + ym
      ];
      var o = 1 - sstep(0.55, 1, P);
      paths.forEach(function (pa, i) {
        pa.setAttribute("d", defs[i]);
        pa.style.strokeDashoffset = o;
        pa.style.opacity = P > 0.5 ? 1 : 0;
      });
      var T = t % LOOP;
      cap.textContent = reduce ? "People, placed on the tree as you talk" :
        T < 5.2 ? "Photographs from 1952 to 2025" :
        T < 8 ? "Faces you point out" :
        T < 12 ? "Each face becomes a person" :
        T < 22 ? "Placed on the tree as you talk" : "Back to the photographs";
      cap.style.opacity = 1;
      svg.setAttribute("viewBox", "0 0 " + S + " " + H);
    }

    var t0 = performance.now();
    function frame(now) {
      render(freeze !== null ? freeze : (now - t0) / 1000);
      if (!reduce && freeze === null) requestAnimationFrame(frame);
    }
    function boot() {
      render(freeze !== null ? freeze : 0);
      if (!reduce && freeze === null) requestAnimationFrame(frame);
    }
    window.addEventListener("resize", function () { render(freeze !== null ? freeze : (performance.now() - t0) / 1000); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(boot); else boot();
    if (freeze !== null) {
      document.querySelectorAll(".hero .bg img").forEach(function (i) { i.style.animation = "none"; });
    }
  }

  /* ---------- rewatch ---------- */
  var player = document.getElementById("player");
  if (player) {
    var slides = player.querySelectorAll(".slide");
    var lines = document.querySelectorAll(".script li");
    var capP = player.querySelector(".cap p"), capY = player.querySelector(".cap .yr");
    var fill = document.getElementById("fill"), knob = document.getElementById("knob");
    var tcur = document.getElementById("tcur"), btn = document.getElementById("playbtn"), btnLabel = document.getElementById("playlabel");
    var thumbs = document.querySelectorAll(".strip button");
    var TOTAL = 238, pos = 36, playing = false, speed = 1;
    var N = lines.length;
    function fmt(s) { s = Math.floor(s); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
    function show(i) {
      slides.forEach(function (s, j) { s.classList.toggle("on", j === i); });
      lines.forEach(function (l, j) { l.classList.toggle("now", j === i); });
      thumbs.forEach(function (b, j) { b.setAttribute("aria-current", j === i ? "true" : "false"); });
      capP.textContent = lines[i].textContent;
      capY.textContent = slides[i].getAttribute("data-year");
    }
    function update() {
      var i = Math.min(N - 1, Math.floor(pos / (TOTAL / N)));
      show(i);
      var pct = pos / TOTAL * 100;
      fill.style.width = pct + "%"; knob.style.left = pct + "%";
      tcur.textContent = fmt(pos);
      document.getElementById("scrub").setAttribute("aria-valuenow", Math.round(pos));
      document.getElementById("scrub").setAttribute("aria-valuetext", fmt(pos) + " of " + fmt(TOTAL));
    }
    var last = performance.now();
    function tick(now) {
      var dt = (now - last) / 1000; last = now;
      if (playing) { pos += dt * speed * 4; if (pos >= TOTAL) { pos = 0; } update(); }
      requestAnimationFrame(tick);
    }
    function setPlaying(v) {
      playing = v;
      btn.setAttribute("aria-pressed", v ? "true" : "false");
      btn.querySelector(".ic-play").style.display = v ? "none" : "block";
      btn.querySelector(".ic-pause").style.display = v ? "block" : "none";
      btnLabel.textContent = v ? "Pause" : "Play";
    }
    btn.addEventListener("click", function () { setPlaying(!playing); });
    thumbs.forEach(function (b, j) { b.addEventListener("click", function () { pos = j * TOTAL / N + 1; update(); }); });
    var sc = document.getElementById("scrub");
    function seek(e) { var r = sc.getBoundingClientRect(); pos = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * TOTAL; update(); }
    sc.addEventListener("click", seek);
    sc.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { pos = Math.min(TOTAL, pos + 5); update(); }
      if (e.key === "ArrowLeft") { pos = Math.max(0, pos - 5); update(); }
    });
    document.getElementById("speedbtn").addEventListener("click", function (e) {
      speed = speed === 1 ? 0.75 : speed === 0.75 ? 1.25 : 1;
      e.currentTarget.textContent = "Speed " + speed + "x";
    });
    document.getElementById("nextbtn").addEventListener("click", function () {
      var i = Math.floor(pos / (TOTAL / N)); pos = ((i + 1) % N) * TOTAL / N + 1; update();
    });
    document.getElementById("tall").textContent = fmt(TOTAL);
    update();
    if (!reduce) { setPlaying(true); }
    requestAnimationFrame(tick);
  }
})();
