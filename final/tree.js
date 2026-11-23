/* Draws the family tree lines from the measured position of each portrait. No sideways scroll: the canvas is 100% wide. */
(function () {
  var box = document.getElementById("tree-canvas"), svg = document.getElementById("tree-svg");
  if (!box || !svg) return;
  var nodes = {};
  box.querySelectorAll(".tnode").forEach(function (n) { nodes[n.getAttribute("data-id")] = n; });
  function pt(id) {
    var f = nodes[id].querySelector(".face"), b = box.getBoundingClientRect(), r = f.getBoundingClientRect();
    return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2, r: r.width / 2, bottom: nodes[id].getBoundingClientRect().bottom - b.top };
  }
  var pairs = [["arthur", "ines"], ["daniel", "marta"], ["rosa", "sam"]];
  var kids = { "arthur+ines": ["daniel"], "daniel+marta": ["paul", "rosa"], "rosa+sam": ["theo", "mira"] };
  function draw() {
    var d = [], gap = 6;
    pairs.forEach(function (pr) {
      var a = pt(pr[0]), b = pt(pr[1]);
      d.push("M" + (a.x + a.r + 4) + " " + a.y + " H" + (b.x - b.r - 4));
      var mid = (a.x + b.x) / 2, kk = kids[pr.join("+")].map(pt);
      var top = Math.min.apply(null, kk.map(function (k) { return k.y - k.r; }));
      var bus = top - 16, from = Math.max(a.bottom, b.bottom) - 0;
      // drop from the couple line, down the gap between the two name labels
      d.push("M" + mid + " " + a.y + " V" + (kk.length > 1 || Math.abs(kk[0].x - mid) > 1 ? bus : top - gap));
      if (kk.length > 1 || Math.abs(kk[0].x - mid) > 1) {
        var xs = kk.map(function (k) { return k.x; }).concat([mid]);
        d.push("M" + Math.min.apply(null, xs) + " " + bus + " H" + Math.max.apply(null, xs));
        kk.forEach(function (k) { d.push("M" + k.x + " " + bus + " V" + (k.y - k.r - gap)); });
      }
    });
    var b = box.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + b.width + " " + b.height);
    svg.innerHTML = '<path d="' + d.join(" ") + '"/>';
  }
  draw();
  window.addEventListener("resize", draw);
  window.addEventListener("load", draw);
  if (window.ResizeObserver) new ResizeObserver(draw).observe(box);
})();
