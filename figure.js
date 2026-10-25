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
      /* i quattro punti "di contorno": dove il grafico tocca L±ε e x̂±δ (tratteggio leggero) */
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
      [['x̂−δ', c.x0 - del], ['x̂', c.x0], ['x̂+δ', c.x0 + del]].forEach(function (p, k) {
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

  /* Grafici SVG salvati in file a parte: <div class="svg-src" data-src="appunti/fig/..."></div>
     vengono caricati e inseriti "inline", così prendono i colori del tema. */
  function loadSvgs() {
    var hs = document.querySelectorAll('.svg-src:not([data-ready])');
    Array.prototype.forEach.call(hs, function (h) {
      h.setAttribute('data-ready', '1');
      fetch(h.getAttribute('data-src')).then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      }).then(function (t) { h.innerHTML = t; })
        .catch(function () { h.textContent = 'Grafico non disponibile'; });
    });
  }
  /* ===== Widget interattivi dell'Esercitazione 5 ===== */
  var uid2 = 0;
  function shell(host, ctlHTML, label) {
    host.setAttribute('data-ready', '1');
    var fig = document.createElement('figure');
    fig.className = 'fig fig-i';
    var ctl = document.createElement('div');
    ctl.className = 'fig-ctl';
    ctl.innerHTML = ctlHTML;
    fig.appendChild(ctl);
    var svg = el('svg', { viewBox: '0 0 340 270', role: 'img', 'aria-label': label });
    fig.appendChild(svg);
    var st = document.createElement('div');
    st.className = 'fig-st';
    fig.appendChild(st);
    host.parentNode.replaceChild(fig, host);
    return { ctl: ctl, svg: svg, st: st };
  }
  function stxt(svg, x, y, s, anchor, cls) {
    var tt = el('text', { x: x, y: y, 'text-anchor': anchor, class: cls || 'sm' }, svg);
    tt.textContent = s;
    return tt;
  }
  /* assi a sinistra e in basso (x logaritmico o a partire da 1: l'origine non è nel grafico) */
  function plot(svg, o) {
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var id = 'wp' + (++uid2), l = 46, r = 326, t = 14, b = 232;
    var px = function (x) { return l + (x - o.x0) / (o.x1 - o.x0) * (r - l); };
    var py = function (y) { return b - (y - o.y0) / (o.y1 - o.y0) * (b - t); };
    (o.xt || []).forEach(function (k) { el('line', { class: 'gr', x1: px(k[0]), y1: t, x2: px(k[0]), y2: b }, svg); });
    (o.yt || []).forEach(function (k) { el('line', { class: 'gr', x1: l, y1: py(k[0]), x2: r, y2: py(k[0]) }, svg); });
    var cp = el('clipPath', { id: id }, svg);
    el('rect', { x: l, y: t, width: r - l, height: b - t }, cp);
    var g = el('g', { 'clip-path': 'url(#' + id + ')' }, svg);
    el('line', { class: 'ax', x1: l, y1: t, x2: l, y2: b }, svg);
    el('line', { class: 'ax', x1: l, y1: b, x2: r, y2: b }, svg);
    (o.xt || []).forEach(function (k) {
      el('line', { class: 'ax', x1: px(k[0]), y1: b, x2: px(k[0]), y2: b + 3 }, svg);
      stxt(svg, px(k[0]), b + 17, k[1], 'middle', 'sm main');
    });
    (o.yt || []).forEach(function (k) {
      el('line', { class: 'ax', x1: l - 3, y1: py(k[0]), x2: l, y2: py(k[0]) }, svg);
      stxt(svg, l - 7, py(k[0]) + 4, k[1], 'end', 'sm main');
    });
    return { px: px, py: py, g: g, l: l, r: r, t: t, b: b };
  }
  function poly(g, px, py, xs, ys, cls, style) {
    var p = [], i;
    for (i = 0; i < xs.length; i++) if (isFinite(ys[i])) p.push(px(xs[i]).toFixed(1) + ',' + py(ys[i]).toFixed(1));
    var e = el('polyline', { class: cls, points: p.join(' ') }, g);
    if (style) e.setAttribute('style', style);
  }
  function nice(v) {
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), m = v / p;
    return (m < 1.5 ? 1 : m < 3.5 ? 2 : m < 7.5 ? 5 : 10) * p;
  }

  /* 1) Rapporto f/g al tendere di x al punto limite */
  var RP = {
    s1: { n: 'sin x e x, x → 0', f: Math.sin, g: function (x) { return x; }, dir: -1, L: 1 },
    s2: { n: '1 − cos x e x², x → 0', f: function (x) { return 1 - Math.cos(x); }, g: function (x) { return x * x; }, dir: -1, L: 0.5 },
    s3: { n: 'x² e x, x → 0', f: function (x) { return x * x; }, g: function (x) { return x; }, dir: -1, L: 0 },
    s4: { n: 'x² + x e x², x → +∞', f: function (x) { return x * x + x; }, g: function (x) { return x * x; }, dir: 1, L: 1 },
    s5: { n: 'x + sin x e x, x → +∞', f: function (x) { return x + Math.sin(x); }, g: function (x) { return x; }, dir: 1, L: 1 },
    s6: { n: '2x² + 1 e x², x → +∞', f: function (x) { return 2 * x * x + 1; }, g: function (x) { return x * x; }, dir: 1, L: 2 }
  };
  function buildRatio(host) {
    var opts = '', k;
    for (k in RP) opts += '<option value="' + k + '">' + RP[k].n + '</option>';
    var s = shell(host,
      '<label>Coppia <select class="s-pair">' + opts + '</select></label>' +
      '<label>x <input class="s-k" type="range" min="0" max="1" step="0.005" value="0.3"><output class="o-x"></output></label>',
      'Rapporto f su g al tendere di x al punto limite');
    var sel = s.ctl.querySelector('.s-pair'), sk = s.ctl.querySelector('.s-k'), ox = s.ctl.querySelector('.o-x');
    function draw() {
      var c = RP[sel.value], kk = +sk.value, n = 240, xs = [], ys = [], i, ymax = Math.max(1.2, c.L * 1.25);
      for (i = 0; i <= n; i++) {
        var u = i / n, x = Math.pow(10, c.dir * 4 * u);
        xs.push(u); ys.push(c.f(x) / c.g(x));
        if (isFinite(ys[i])) ymax = Math.max(ymax, ys[i] * 1.08);
      }
      var yt = [[0, '0'], [1, '1']];
      if (c.L !== 0 && c.L !== 1) yt.push([c.L, fmt(c.L)]);
      var P = plot(s.svg, { x0: 0, x1: 1, y0: 0, y1: ymax, yt: yt,
        xt: [[0, 'x = 1'], [1, c.dir < 0 ? 'x = 10⁻⁴' : 'x = 10⁴']] });
      el('line', { class: 'dash', x1: P.l, y1: P.py(1), x2: P.r, y2: P.py(1) }, P.g);
      if (c.L !== 1) el('line', { class: 'dash faint', x1: P.l, y1: P.py(c.L), x2: P.r, y2: P.py(c.L) }, P.g);
      poly(P.g, P.px, P.py, xs, ys, 'cv');
      var xv = Math.pow(10, c.dir * 4 * kk), rv = c.f(xv) / c.g(xv);
      el('circle', { class: 'pt2', cx: P.px(kk), cy: P.py(rv), r: 4.6 }, P.g);
      stxt(s.svg, P.l + 6, P.t + 12, 'f/g', 'start', 'sm');
      ox.textContent = (c.dir < 0 ? 'x = ' : 'x = ') + (xv >= 100 || xv < 0.01 ? xv.toExponential(1).replace('.', ',') : fmt(xv));
      var verdict = c.L === 1 ? '<b class="ok">f ∼ g</b>: il rapporto tende a 1.'
        : c.L === 0 ? '<b class="no">f = o(g)</b>: f è trascurabile rispetto a g (rapporto → 0).'
        : '<b class="no">stesso ordine, ma non equivalenti</b>: il rapporto tende a ' + fmt(c.L) + ', non a 1.';
      s.st.innerHTML = 'Con x scelto, f/g ≈ <b>' + fmt(rv) + '</b>. Limite del rapporto: <b>' + fmt(c.L) + '</b>.<br>' + verdict;
    }
    sel.addEventListener('change', draw);
    sk.addEventListener('input', draw);
    draw();
  }

  /* 2) Confronto di crescita: (log x)^β / x^α  e  x^α / a^x */
  function buildGer(host) {
    var s = shell(host,
      '<label>α <input class="s-al" type="range" min="0.2" max="3" step="0.1" value="1"><output class="o-al"></output></label>' +
      '<label>β <input class="s-be" type="range" min="0.2" max="3" step="0.1" value="1"><output class="o-be"></output></label>' +
      '<label>a <input class="s-a" type="range" min="1.05" max="3" step="0.05" value="1.5"><output class="o-a"></output></label>',
      'Rapporti della gerarchia degli infiniti');
    var sa = s.ctl.querySelector('.s-al'), sb = s.ctl.querySelector('.s-be'), sc = s.ctl.querySelector('.s-a');
    var oa = s.ctl.querySelector('.o-al'), ob = s.ctl.querySelector('.o-be'), oc = s.ctl.querySelector('.o-a');
    function draw() {
      var al = +sa.value, be = +sb.value, a = +sc.value, X = 200, n = 400, xs = [], y1 = [], y2 = [], i, m1 = 0, m2 = 0, x1 = 0, x2 = 0;
      oa.textContent = fmt(al); ob.textContent = fmt(be); oc.textContent = fmt(a);
      for (i = 0; i <= n; i++) {
        var x = 1.01 + (X - 1.01) * i / n;
        xs.push(x);
        y1.push(Math.pow(Math.log(x), be) / Math.pow(x, al));
        y2.push(Math.pow(x, al) / Math.pow(a, x));
        if (y1[i] > m1) { m1 = y1[i]; x1 = x; }
        if (y2[i] > m2) { m2 = y2[i]; x2 = x; }
      }
      var ymax = Math.max(m1, m2) * 1.1, step = nice(ymax / 4), yt = [], v;
      for (v = step; v < ymax; v += step) yt.push([v, fmt(Math.round(v / step * 100) / 100 * step)]);
      var P = plot(s.svg, { x0: 0, x1: X, y0: 0, y1: ymax, yt: yt,
        xt: [[0, '0'], [50, '50'], [100, '100'], [150, '150'], [200, '200']] });
      poly(P.g, P.px, P.py, xs, y1, 'cv');
      poly(P.g, P.px, P.py, xs, y2, 'cv', 'stroke:#d9822b');
      stxt(s.svg, P.l + 8, P.t + 12, '(log x)^β / x^α', 'start', 'sm lgA');
      stxt(s.svg, P.l + 8, P.t + 26, 'x^α / a^x', 'start', 'sm lgB');
      s.st.innerHTML = '<b class="ok">Entrambi tendono a 0</b> per x → +∞, ma possono prima salire: ' +
        '(log x)^β/x^α ha massimo ≈ ' + fmt(m1) + ' in x ≈ ' + fmt(x1) + '; x^α/a^x ha massimo ≈ ' + fmt(m2) +
        ' in x ≈ ' + fmt(x2) + '.<br>Un limite a 0 dice cosa accade «da un certo punto in poi», non quando comincia.';
    }
    sa.addEventListener('input', draw); sb.addEventListener('input', draw); sc.addEventListener('input', draw);
    draw();
  }

  /* 3) Esercizio con parametro: f_α(x) = x^7 / (x^8/16 + x^α), x → 0+ */
  function buildAlpha(host) {
    var s = shell(host,
      '<label>α <input class="s-al" type="range" min="3" max="11" step="0.1" value="5"><output class="o-al"></output></label>',
      'Limite al variare del parametro alfa');
    var sa = s.ctl.querySelector('.s-al'), oa = s.ctl.querySelector('.o-al');
    function draw() {
      var al = Math.round(+sa.value * 10) / 10, n = 300, xs = [], ys = [], i, ex = [-6, -5, -4, -3, -2, -1], xt = [];
      oa.textContent = fmt(al);
      for (i = 0; i <= n; i++) {
        var e = -6 + 5.7 * i / n, x = Math.pow(10, e);
        xs.push(e); ys.push(Math.pow(x, 7) / (Math.pow(x, 8) / 16 + Math.pow(x, al)));
      }
      var sup = ['⁻⁶', '⁻⁵', '⁻⁴', '⁻³', '⁻²', '⁻¹'];
      for (i = 0; i < 6; i++) xt.push([ex[i], '10' + sup[i]]);
      var P = plot(s.svg, { x0: -6, x1: -0.3, y0: 0, y1: 4, xt: xt, yt: [[0, '0'], [1, '1'], [2, '2'], [3, '3'], [4, '4']] });
      var L = al < 7 ? 0 : al === 7 ? 1 : null;
      if (L !== null) el('line', { class: 'dash', x1: P.l, y1: P.py(L), x2: P.r, y2: P.py(L) }, P.g);
      poly(P.g, P.px, P.py, xs, ys, 'cv');
      stxt(s.svg, P.r - 4, P.t + 12, 'f(x) ≈ x⁷ / (x⁸/16 + x^α)', 'end', 'sm');
      stxt(s.svg, P.r - 4, P.b - 6, 'x → 0⁺ (scala log)', 'end', 'sm');
      var msg;
      if (al < 7) msg = '<b class="no">α &lt; 7</b>: domina x^α, f ∼ x^(7−α) → 0, quindi L = 0.';
      else if (al === 7) msg = '<b class="ok">α = 7</b>: f ∼ x⁷/x⁷ = 1, quindi L = 1.';
      else if (al < 8) msg = '<b class="no">7 &lt; α &lt; 8</b>: domina x^α, f ∼ x^(7−α) con esponente negativo, quindi L = +∞.';
      else if (al === 8) msg = '<b class="no">α = 8</b>: il denominatore è ∼ (17/16)x⁸, f ∼ 16/(17x) → +∞.';
      else msg = '<b class="no">α &gt; 8</b>: domina x⁸/16, f ∼ 16/x → +∞, quindi L = +∞.';
      s.st.innerHTML = msg + '<br>Il valore 8 cambia la parte principale del denominatore; il valore 7 cambia il limite.';
    }
    sa.addEventListener('input', draw);
    draw();
  }

  function scan() {
    var hs = document.querySelectorAll('.eps-delta:not([data-ready])'), i;
    for (i = 0; i < hs.length; i++) build(hs[i]);
    hs = document.querySelectorAll('.w-ratio:not([data-ready])');
    for (i = 0; i < hs.length; i++) buildRatio(hs[i]);
    hs = document.querySelectorAll('.w-ger:not([data-ready])');
    for (i = 0; i < hs.length; i++) buildGer(hs[i]);
    hs = document.querySelectorAll('.w-alpha:not([data-ready])');
    for (i = 0; i < hs.length; i++) buildAlpha(hs[i]);
    loadSvgs();
  }
  function start() {
    scan();
    new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
