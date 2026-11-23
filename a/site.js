/* Direction A behaviours. Everything is visible without this file; script only adds motion. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var root = document.documentElement;
  root.classList.add("js");

  /* waveform bars (deterministic shape, no randomness so shots are stable) */
  function shape(i, n) { return 18 + Math.round(70 * Math.abs(Math.sin(i * 0.9) * Math.cos(i * 0.37 + 1))); }
  document.querySelectorAll("[data-wave]").forEach(function (el) {
    var n = parseInt(el.getAttribute("data-wave"), 10) || 28, h = "";
    for (var i = 0; i < n; i++) h += '<i style="--h:' + shape(i, n) + "%;--d:" + ((i % 9) * -0.12).toFixed(2) + 's"></i>';
    el.innerHTML = h;
  });

  /* ---- the living tree ---- */
  var box = document.querySelector("[data-tree]");
  if (box) {
    var nodes = {}, links = {};
    box.querySelectorAll("[data-n]").forEach(function (n) { nodes[n.dataset.n] = n; });
    box.querySelectorAll("[data-l]").forEach(function (l) { links[l.dataset.l] = l; });
    var cap = document.querySelector("[data-caption]");
    var stage = document.querySelector("[data-speaking]");
    var pauseBtn = document.querySelector("[data-pause]");
    var timers = [], paused = false, runId = 0;

    var counter = document.querySelector("[data-count]");
    function tally() { if (counter) counter.textContent = Object.keys(nodes).filter(function (k) { return !nodes[k].classList.contains("pending"); }).length; }
    function show(id) { var n = nodes[id]; if (n) n.classList.remove("pending"); tally(); }
    function draw(id) { var l = links[id]; if (l) l.classList.remove("pending"); }
    function reset() {
      Object.keys(nodes).forEach(function (k) { nodes[k].classList.add("pending"); });
      Object.keys(links).forEach(function (k) { links[k].classList.add("pending"); });
      tally();
    }
    function say(text, on) {
      if (cap) cap.textContent = text;
      if (stage) stage.classList.toggle("speaking", !!on);
    }
    var script = [
      [0, function () { say("I'm Marisol. My father is Samuel.", true); }],
      [700, function () { show("marisol"); }],
      [2000, function () { draw("samuel"); }],
      [2600, function () { show("samuel"); }],
      [4300, function () { say("I married Daniel. His mother is Leela.", true); }],
      [5000, function () { show("daniel"); draw("couple"); }],
      [6300, function () { draw("leela"); }],
      [6900, function () { show("leela"); }],
      [8700, function () { say("We have a daughter, Mina.", true); }],
      [9400, function () { draw("mina"); }],
      [10100, function () { show("mina"); }],
      [11600, function () { say("Five people, in about a minute.", false); }],
      [16200, function () { reset(); say("", false); }],
      [17000, "loop"]
    ];
    function clear() { timers.forEach(clearTimeout); timers = []; }
    function run() {
      clear(); var id = ++runId; reset();
      script.forEach(function (s) {
        timers.push(setTimeout(function () {
          if (id !== runId || paused) return;
          if (s[1] === "loop") run(); else s[1]();
        }, s[0]));
      });
    }
    function stillState() {
      clear(); runId++;
      Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove("pending"); });
      Object.keys(links).forEach(function (k) { links[k].classList.remove("pending"); });
      tally();
      say("We have a daughter, Mina.", false);
    }
    if (reduce) { stillState(); }
    else {
      run();
      if (pauseBtn) pauseBtn.addEventListener("click", function () {
        paused = !paused;
        pauseBtn.setAttribute("aria-pressed", paused ? "true" : "false");
        pauseBtn.setAttribute("aria-label", paused ? "Play the tree animation" : "Pause the tree animation");
        pauseBtn.innerHTML = paused ? PLAY : PAUSE;
        if (paused) { stillState(); } else { run(); }
      });
    }
    window.__treeSettle = stillState;
    window.__treeRun = run;
  }
  var PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';

  /* ---- flow connector: drawn through the real positions of the four steps ---- */
  var track = document.querySelector("[data-flow]");
  function drawFlow() {
    if (!track) return;
    var svg = track.querySelector("svg");
    var orbs = track.querySelectorAll(".orb");
    var tb = track.getBoundingClientRect();
    if (getComputedStyle(svg).display === "none") return;
    var pts = [];
    orbs.forEach(function (o) { var r = o.getBoundingClientRect(); pts.push([r.left - tb.left + r.width / 2, r.top - tb.top + r.height / 2]); });
    var d = "M" + pts[0][0] + " " + pts[0][1];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2;
      d += " C" + mx + " " + a[1] + " " + mx + " " + b[1] + " " + b[0] + " " + b[1];
    }
    svg.querySelectorAll("path").forEach(function (p) { p.setAttribute("d", d); });
  }
  window.addEventListener("resize", drawFlow);
  window.addEventListener("load", drawFlow);
  drawFlow();

  /* ---- reveal on scroll (content is visible by default; this only eases it in) ---- */
  if (!reduce && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".rv").forEach(function (el) { io.observe(el); });
    window.__revealAll = function () { document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); }); };
  } else {
    document.querySelectorAll(".rv").forEach(function (el) { el.classList.add("in"); });
    window.__revealAll = function () {};
  }

  /* ---- marquee hold button ---- */
  document.querySelectorAll("[data-hold]").forEach(function (b) {
    b.addEventListener("click", function () {
      var m = document.querySelector(b.getAttribute("data-hold"));
      var held = m.classList.toggle("held");
      b.setAttribute("aria-pressed", held ? "true" : "false");
      b.textContent = held ? "Let the questions move" : "Hold the questions still";
    });
  });
})();
