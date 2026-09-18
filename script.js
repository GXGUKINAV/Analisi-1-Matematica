
/* Applica subito tema e zoom salvati, per evitare lampi di colore al caricamento */
try {
  var t = localStorage.getItem('a1-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
  var z = parseInt(localStorage.getItem('a1-zoom'), 10) || 100;
  document.documentElement.style.setProperty('--z', z / 100);
} catch (e) {}


document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;

  /* ---------- Dati: un Day per ogni <template class="day"> ---------- */
  var days = Array.prototype.slice.call(document.querySelectorAll('template.day'))
    .map(function (t) { return { n: parseInt(t.dataset.n, 10), title: t.dataset.title, tpl: t }; })
    .sort(function (a, b) { return a.n - b.n; });

  var main = $('content'), menu = $('dayMenu'), dotsBtn = $('dotsBtn');
  var prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
  var aaBtn = $('aaBtn'), settings = $('settings');
  var cur = 0;

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  /* ---------- Formule ---------- */
  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(main, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
      return true;
    }
    return false;
  }

  /* ---------- Mostra un Day ---------- */
  function show(i, animate) {
    if (!days.length) { main.innerHTML = '<p>Nessun appunto ancora.</p>'; return; }
    cur = Math.max(0, Math.min(days.length - 1, i));
    var d = days[cur];
    main.innerHTML = '<p class="eyebrow">Day ' + d.n + '</p><h1></h1>' + d.tpl.innerHTML;
    main.querySelector('h1').textContent = d.title;
    renderMath();
    if (animate) { main.classList.remove('fade'); void main.offsetWidth; main.classList.add('fade'); }
    window.scrollTo(0, 0);
    store('a1-day', d.n);
    try { history.replaceState(null, '', '#day-' + d.n); } catch (e) {}
    updateNav();
  }

  /* ---------- Navigatore ---------- */
  function updateNav() {
    var N = days.length, W = 9, s = 0, e = N;
    if (N > W) { s = Math.min(Math.max(cur - Math.floor(W / 2), 0), N - W); e = s + W; }
    dotsBtn.innerHTML = '';
    for (var k = s; k < e; k++) {
      var sp = document.createElement('span');
      var edge = (k === s && s > 0) || (k === e - 1 && e < N);
      sp.className = 'dot' + (k === cur ? ' on' : '') + (edge && k !== cur ? ' edge' : '');
      dotsBtn.appendChild(sp);
    }
    dotsBtn.setAttribute('aria-label', 'Scegli il Day (ora: Day ' + days[cur].n + ')');
    prevBtn.disabled = cur === 0;
    nextBtn.disabled = cur === N - 1;
    Array.prototype.forEach.call(menu.children, function (btn, k) {
      var on = k === cur;
      btn.classList.toggle('cur', on);
      btn.querySelector('.mk').textContent = on ? '\u25CF' : '\u25CB';
      if (on) btn.setAttribute('aria-current', 'true'); else btn.removeAttribute('aria-current');
    });
  }

  function buildMenu() {
    menu.innerHTML = '';
    days.forEach(function (d, k) {
      var b = document.createElement('button');
      b.className = 'day-item'; b.setAttribute('role', 'menuitem');
      var mk = document.createElement('span'); mk.className = 'mk'; mk.textContent = '\u25CB';
      var tx = document.createElement('span'); tx.textContent = d.n + '. ' + d.title;
      b.appendChild(mk); b.appendChild(tx);
      b.addEventListener('click', function () { closeAll(); show(k, true); });
      menu.appendChild(b);
    });
  }

  /* ---------- Finestrelle (non modali) ---------- */
  function setOpen(panel, btn, open) {
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }
  function closeAll() { setOpen(menu, dotsBtn, false); setOpen(settings, aaBtn, false); }

  dotsBtn.addEventListener('click', function () {
    var open = menu.hidden;
    closeAll();
    setOpen(menu, dotsBtn, open);
    if (open) { var c = menu.querySelector('.cur'); if (c) c.scrollIntoView({ block: 'nearest' }); }
  });
  aaBtn.addEventListener('click', function () {
    var open = settings.hidden;
    closeAll();
    setOpen(settings, aaBtn, open);
  });
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.day-menu, .dots, .settings, .aa')) closeAll();
  });
  prevBtn.addEventListener('click', function () { show(cur - 1, true); });
  nextBtn.addEventListener('click', function () { show(cur + 1, true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
    else if (e.key === 'ArrowLeft' && !e.metaKey && !e.altKey) show(cur - 1, true);
    else if (e.key === 'ArrowRight' && !e.metaKey && !e.altKey) show(cur + 1, true);
  });

  /* ---------- Dimensione testo ---------- */
  var ZMIN = 60, ZMAX = 220, ZSTEP = 10;
  var zoom = parseInt(load('a1-zoom'), 10) || 100;
  function applyZoom() {
    zoom = Math.max(ZMIN, Math.min(ZMAX, zoom));
    root.style.setProperty('--z', zoom / 100);
    $('zVal').textContent = zoom + '%';
    $('zMinus').disabled = zoom <= ZMIN;
    $('zPlus').disabled = zoom >= ZMAX;
    store('a1-zoom', zoom);
  }
  $('zMinus').addEventListener('click', function () { zoom -= ZSTEP; applyZoom(); });
  $('zPlus').addEventListener('click', function () { zoom += ZSTEP; applyZoom(); });

  /* ---------- Tema ---------- */
  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    Array.prototype.forEach.call(document.querySelectorAll('[data-theme-btn]'), function (b) {
      b.setAttribute('aria-pressed', b.dataset.themeBtn === t ? 'true' : 'false');
    });
    store('a1-theme', t);
  }
  Array.prototype.forEach.call(document.querySelectorAll('[data-theme-btn]'), function (b) {
    b.addEventListener('click', function () { applyTheme(b.dataset.themeBtn); });
  });

  /* ---------- Avvio ---------- */
  applyZoom();
  applyTheme(root.getAttribute('data-theme') || 'light');
  buildMenu();

  var start = 0, m = /^#day-(\d+)$/.exec(location.hash), want = m ? parseInt(m[1], 10) : parseInt(load('a1-day'), 10);
  days.forEach(function (d, k) { if (d.n === want) start = k; });
  show(start, false);

  /* Se KaTeX non era ancora pronto, riprova a caricamento completato */
  if (!window.renderMathInElement) window.addEventListener('load', renderMath);
});