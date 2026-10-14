/* Grafico interattivo ε–δ.
   Si attiva da solo su ogni <div class="eps-delta"></div> presente negli appunti,
   anche se inserito dopo (gli appunti sono caricati con fetch). */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var FNS = {
    lin:  { name: 'f(x) = 3x − 1,  x → 2', f: function (x) { return 3 * x - 1; }, x0: 2, L: 5, xr: [0, 4], yr: [-1, 11], eps: 1, del: 0.33 },
    sq:   { name: 'f(x) = x²,  x → 1', f: function (x) { return x * x; }, x0: 1, L: 1, xr: [-0.5, 2.5], yr: [-0.5, 5], eps: 0.5, del: 0.2 },
    hole: { name: 'f(x) = (2x² − 2x)/(x − 1),  x → 1', f: function (x) { return 2 * x; }, x0: 1, L: 2, hole: true, xr: [-0.5, 2.5], yr: [-1, 5], eps: 0.6, del: 0.25 }
  };
  var uid = 0;

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmt(v) { return (Math.round(v * 100) / 100).toString().replace('.', ','); }

  function build(host) {
    host.setAttribute('data-ready', '1');
    var id = ++uid, cur = FNS.lin;
    var fig = document.createElement('figure');
    fig.className = 'fig fig-i';

    var ctl = document.createElement('div');
    ctl.className = 'fig-ctl';
    ctl.innerHTML =
      '<label>Funzione <select class="s-fn"><option value="lin">3x − 1</option><option value="sq">x²</option><option value="hole">(2x² − 2x)/(x − 1)</option></select></label>' +
      '<label>ε <input class="s-eps" type="range" min="0.1" max="3" step="0.05"><output class="o-eps"></output></label>' +
      '<label>δ <input class="s-del" type="range" min="0.02" max="2" step="0.01"><output class="o-del"></output></label>';
    fig.appendChild(ctl);

    var W = 340, H = 270, l = 40, r = 326, t = 14, b = 236;
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Grafico interattivo del limite con epsilon e delta' });
    fig.appendChild(svg);
    var st = document.createElement('div');
    st.className = 'fig-st';
    fig.appendChild(st);
    host.parentNode.replaceChild(fig, host);

    var sFn = ctl.querySelector('.s-fn'), sE = ctl.querySelector('.s-eps'), sD = ctl.querySelector('.s-del');
    var oE = ctl.querySelector('.o-eps'), oD = ctl.querySelector('.o-del');

    function maxDev(c, d) {   /* massimo di |f(x) − L| per 0 < |x − x0| < d */
      var m = 0, n = 300, i, x;
      for (i = 1; i <= n; i++) {
        x = c.x0 + d * i / (n + 1);
        m = Math.max(m, Math.abs(c.f(x) - c.L), Math.abs(c.f(2 * c.x0 - x) - c.L));
      }
      return m;
    }
    function bestDelta(c, eps) {   /* il più grande δ ≤ 3 che funziona (bisezione) */
      var lo = 0, hi = 3, k;
      if (maxDev(c, hi) < eps) return hi;
      for (k = 0; k < 40; k++) {
        var mid = (lo + hi) / 2;
        if (maxDev(c, mid) < eps) lo = mid; else hi = mid;
      }
      return lo;
    }

    function draw() {
      var c = cur, eps = +sE.value, del = +sD.value;
      oE.textContent = fmt(eps); oD.textContent = fmt(del);
      var px = function (x) { return l + (x - c.xr[0]) / (c.xr[1] - c.xr[0]) * (r - l); };
      var py = function (y) { return b - (y - c.yr[0]) / (c.yr[1] - c.yr[0]) * (b - t); };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      var cid = 'fc' + id;
      var cp = el('clipPath', { id: cid }, svg);
      el('rect', { x: l, y: t, width: r - l, height: b - t }, cp);

      var g = el('g', { 'clip-path': 'url(#' + cid + ')' }, svg);
      /* fasce evidenziate: si fermano al grafico */
      function curvePts(xa, xb2, n) {
        var p = [], k, x;
        for (k = 0; k <= n; k++) { x = xa + (xb2 - xa) * k / n; p.push(px(x).toFixed(1) + ',' + py(c.f(x)).toFixed(1)); }
        return p;
      }
      var xTop = cross(c.L + eps), xBot = cross(c.L - eps);
      if (xTop !== null && xBot !== null) {
        el('polygon', { class: 'band', points: [l + ',' + py(c.L + eps).toFixed(1), px(xTop).toFixed(1) + ',' + py(c.L + eps).toFixed(1)]
          .concat(curvePts(xTop, xBot, 40), [px(xBot).toFixed(1) + ',' + py(c.L - eps).toFixed(1), l + ',' + py(c.L - eps).toFixed(1)]).join(' ') }, g);
      } else {
        el('rect', { class: 'band', x: l, y: py(c.L + eps), width: r - l, height: Math.max(0, py(c.L - eps) - py(c.L + eps)) }, g);
      }
      el('polygon', { class: 'band', points: [px(c.x0 - del).toFixed(1) + ',' + b].concat(curvePts(c.x0 - del, c.x0 + del, 40), [px(c.x0 + del).toFixed(1) + ',' + b]).join(' ') }, g);

      /* assi (a sinistra e in basso) */
      el('line', { class: 'ax', x1: l, y1: t, x2: l, y2: b }, svg);
      el('line', { class: 'ax', x1: l, y1: b, x2: r, y2: b }, svg);
      /* asse delle x e delle y vere, se visibili */
      if (c.yr[0] < 0 && c.yr[1] > 0) el('line', { class: 'gr', x1: l, y1: py(0), x2: r, y2: py(0) }, g);
      if (c.xr[0] < 0 && c.xr[1] > 0) el('line', { class: 'gr', x1: px(0), y1: t, x2: px(0), y2: b }, g);

      /* curva e tratto evidenziato */
      var n = 240, pts = [], hp = [], i, x;
      for (i = 0; i <= n; i++) {
        x = c.xr[0] + (c.xr[1] - c.xr[0]) * i / n;
        pts.push(px(x).toFixed(1) + ',' + py(c.f(x)).toFixed(1));
        if (Math.abs(x - c.x0) < del) hp.push(px(x).toFixed(1) + ',' + py(c.f(x)).toFixed(1));
      }
      el('polyline', { class: 'cv', points: pts.join(' ') }, g);
      var ok = maxDev(c, del) < eps;
      if (hp.length > 1) el('polyline', { class: 'cvh' + (ok ? '' : ' bad'), points: hp.join(' ') }, g);

      /* guide tratteggiate e punto limite */
      function cross(level) {
        var steps = 800, h = (c.xr[1] - c.xr[0]) / steps, k, s, xa, xb, fa, fb;
        for (k = 0; k < steps; k++) for (s = 1; s >= -1; s -= 2) {
          xa = c.x0 + s * k * h; xb = xa + s * h;
          if (xb < c.xr[0] || xb > c.xr[1]) continue;
          fa = c.f(xa) - level; fb = c.f(xb) - level;
          if (fa === 0) return xa;
          if (fa * fb < 0) return xa + (xb - xa) * fa / (fa - fb);
        }
        return null;
      }
      /* i quattro punti "di contorno": dove il grafico tocca L±ε e x₀±δ (tratteggio leggero) */
      [c.L + eps, c.L - eps].forEach(function (lv) {
        var xc = cross(lv);
        if (xc === null || lv < c.yr[0] || lv > c.yr[1]) return;
        el('line', { class: 'dash faint', x1: l, y1: py(lv), x2: px(xc), y2: py(lv) }, g);
        el('circle', { class: 'ptf', cx: px(xc), cy: py(lv), r: 2.6 }, g);
      });
      [c.x0 - del, c.x0 + del].forEach(function (xv) {
        var yv = c.f(xv);
        if (yv < c.yr[0] || yv > c.yr[1] || xv < c.xr[0] || xv > c.xr[1]) return;
        el('line', { class: 'dash faint', x1: px(xv), y1: py(yv), x2: px(xv), y2: b }, g);
        el('circle', { class: 'ptf', cx: px(xv), cy: py(yv), r: 2.6 }, g);
      });
      el('line', { class: 'dash', x1: l, y1: py(c.L), x2: px(c.x0), y2: py(c.L) }, g);
      el('line', { class: 'dash', x1: px(c.x0), y1: py(c.L), x2: px(c.x0), y2: b }, g);
      el('circle', { class: c.hole ? 'hole' : 'pt', cx: px(c.x0), cy: py(c.L), r: 4.5 }, g);

      /* etichette */
      function lab(txt, x, y, anchor, cls) {
        var tt = el('text', { x: x, y: y, 'text-anchor': anchor, class: cls || 'sm' }, svg);
        tt.textContent = txt;
      }
      var yl = [['L+ε', c.L + eps], ['L', c.L], ['L−ε', c.L - eps]];
      yl.forEach(function (p, k) {
        var y = py(p[1]);
        if (y < t || y > b) return;
        if (k === 1 && (py(c.L - eps) - py(c.L + eps)) / 2 < 13) return;
        lab(p[0], l - 6, y + 4, 'end', k === 1 ? 'sm main' : 'sm faint');
      });
      var half = px(c.x0 + del) - px(c.x0);
      [['x₀−δ', c.x0 - del], ['x₀', c.x0], ['x₀+δ', c.x0 + del]].forEach(function (p, k) {
        var x = px(p[1]);
        if (x < l - 4 || x > r + 4) return;
        if (k === 1 && half < 30) return;
        lab(p[0], x, b + 16, 'middle', k === 1 ? 'sm main' : 'sm faint');
      });
      lab(c.name, l + 4, t + 10, 'start');

      /* messaggio */
      var best = bestDelta(c, eps);
      st.innerHTML = (ok
        ? '<b class="ok">✓ Questo δ va bene:</b> con ε = ' + fmt(eps) + ' e δ = ' + fmt(del) + ' tutti i valori del tratto evidenziato distano da L meno di ε.'
        : '<b class="no">✗ δ troppo grande:</b> nel tratto evidenziato ci sono valori che escono dalla fascia di ampiezza ε.') +
        '<br>Per questo ε il δ massimo che funziona è circa <b>' + (best >= 3 ? '≥ 3' : fmt(best)) + '</b>.';
    }

    function load(key) {
      cur = FNS[key];
      sE.value = cur.eps; sD.value = cur.del;
      draw();
    }
    sFn.addEventListener('change', function () { load(sFn.value); });
    sE.addEventListener('input', draw);
    sD.addEventListener('input', draw);
    load('lin');
  }

  function scan() {
    var hs = document.querySelectorAll('.eps-delta:not([data-ready])');
    for (var i = 0; i < hs.length; i++) build(hs[i]);
  }
  function start() {
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
