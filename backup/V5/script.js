/* Applica subito tema e zoom salvati, per evitare lampi di colore al caricamento */
try {
  var t = localStorage.getItem('a1-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', t);
  var z = parseInt(localStorage.getItem('a1-zoom'), 10) || 100;
  document.documentElement.style.setProperty('--z', z / 100);
} catch (e) {}


/* =====================================================================
   CATALOGO DEI DAY
   Per aggiungere un nuovo giorno:
   1. duplica appunti/_template-day.html e rinominalo (es. day-04.html);
   2. aggiungi qui sotto una nuova voce con n, title e file.
   Pallini, menu e navigatore si aggiornano da soli.
   Il titolo (e l'etichetta "Day N") è generato da JavaScript: nei file
   degli appunti NON va ripetuto.
   ===================================================================== */
var days = [
  {
    n: 1,
    title: 'Principio di Induzione e Caratterizzazione dei Numeri Reali',
    file: 'appunti/day-01.html'
  },
  {
    n: 2,
    title: 'Completezza di R, Estremo Superiore e Inferiore, Introduzione ai Complessi',
    file: 'appunti/day-02.html'
  },
  {
    n: 3,
    title: 'Numeri complessi: operazioni, coniugato, modulo, inverso e forma goniometrica',
    file: 'appunti/day-03.html'
  },
  {
    n: 4,
    title: 'Forma esponenziale, radici ennesime, logaritmo complesso e polinomi',
    file: 'appunti/day-04.html'
  },
  {
    n: 5,
    title: 'Polinomi complessi, funzioni, estremi, simmetrie e monotonia',
    file: 'appunti/day-05.html'
  },
  {
    n: 6,
    title: 'Composizione, inversa, successioni e limite',
    file: 'appunti/day-06.html'
  },
  {
    n: 7,
    title: 'Successioni: limiti, confronto, monotonia e successioni geometriche',
    file: 'appunti/day-07.html'
  }

];
days.sort(function (a, b) { return a.n - b.n; });


/* =====================================================================
   CATALOGO DELLE ESERCITAZIONI
   Stessa cosa dei Day: per ogni nuova esercitazione aggiungi una voce,
   ad esempio:
     { n: 1, title: 'Titolo dell\'esercitazione 1', file: 'appunti/esercitazione-1.html' }
   ===================================================================== */
var esercitazioni = [
  {
    n: 1,
    title: 'Estremi degli insiemi',
    file: 'appunti/esercitazione-1.html'
  },
  {
    n: 2,
    title: 'Numeri complessi: forme, radici, equazioni e luoghi geometrici',
    file: 'appunti/esercitazione-2.html'
  }
];
esercitazioni.sort(function (a, b) { return a.n - b.n; });

/* =====================================================================
   CATALOGO DEL TUTORATO
   Per ogni nuova lezione di tutorato aggiungi una voce, ad esempio:
     { n: 2, title: 'Titolo del tutorato 2', file: 'appunti/t-02.html' }
   ===================================================================== */
var tutorato = [
  { 
    n: 1, 
    title: 'Goniometria e numeri complessi', 
    file: 'appunti/t-01.html' 
  }
];
tutorato.sort(function (a, b) { return a.n - b.n; });

/* Le tre "modalità" del sito */
var cats = {
  lezioni:       { name: 'Lezioni',       label: 'Day',           prefix: 'day', list: days,          key: 'a1-day' },
  esercitazioni: { name: 'Esercitazioni', label: 'Esercitazione', prefix: 'es',  list: esercitazioni, key: 'a1-es'  },
  tutorato:      { name: 'Tutorato',      label: 'Tutorato',      prefix: 't',   list: tutorato,      key: 'a1-t'   }
};


document.addEventListener('DOMContentLoaded', function () {
  var $ = function (id) { return document.getElementById(id); };
  var root = document.documentElement;
  var main = $('content'), menu = $('dayMenu'), dotsBtn = $('dotsBtn');
  var prevBtn = $('prevBtn'), nextBtn = $('nextBtn');
  var aaBtn = $('aaBtn'), settings = $('settings');
  var modeBtn = $('modeBtn'), modeMenu = $('modeMenu');
  var mode = 'lezioni';
  function items() { return cats[mode].list; }
  var nav = $('navBar');
  var cur = 0;
  var requestId = 0;   /* per ignorare risposte fetch "vecchie" se cambio Day velocemente */
  var cache = {};      /* file già scaricati: evita di riscaricarli */

  function store(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function load(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

  function renderMath() {
    if (window.renderMathInElement) {
      renderMathInElement(main, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false
      });
    }
  }

  /* ---------- Hash URL: #day-1, #day-2, ... ---------- */
  function parseHash() {
    var m = /^#(day|es|t)-(\d+)$/.exec(location.hash);
    if (!m) return null;
    var md = m[1] === 'es' ? 'esercitazioni' : (m[1] === 't' ? 'tutorato' : 'lezioni');
    var n = parseInt(m[2], 10), idx = -1;
    cats[md].list.forEach(function (d, k) { if (d.n === n) idx = k; });
    return idx === -1 ? null : { mode: md, idx: idx };
  }
  function syncHash(d, push) {
    var h = '#' + cats[mode].prefix + '-' + d.n;
    if (location.hash === h) return;
    try {
      if (push) history.pushState(null, '', h); else history.replaceState(null, '', h);
    } catch (e) {
      location.hash = h;
    }
  }

  /* ---------- Caricamento del file di una giornata ---------- */
  function fetchDay(d) {
    if (cache[d.file] !== undefined) return Promise.resolve(cache[d.file]);
    return fetch(d.file).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    }).then(function (html) {
      cache[d.file] = html;
      return html;
    });
  }

  function showLoading() {
    var p = document.createElement('p');
    p.className = 'eyebrow';
    p.setAttribute('role', 'status');
    p.textContent = 'Caricamento degli appunti…';
    main.appendChild(p);
  }

  function showError(d) {
    var box = document.createElement('div');
    box.className = 'box warn';
    var bt = document.createElement('div');
    bt.className = 'bt';
    bt.textContent = 'Impossibile caricare gli appunti';
    var p1 = document.createElement('p');
    p1.appendChild(document.createTextNode('Non sono riuscito a caricare il file '));
    var f = document.createElement('strong');
    f.textContent = d.file;
    p1.appendChild(f);
    p1.appendChild(document.createTextNode('. Controlla che esista e che il percorso nel catalogo dei Day sia corretto, poi riprova.'));
    var p2 = document.createElement('p');
    p2.textContent = 'Se hai aperto index.html con doppio click (file://), il browser blocca il caricamento: usa GitHub Pages oppure un server locale come Live Server.';
    box.appendChild(bt); box.appendChild(p1); box.appendChild(p2);
    main.appendChild(box);
  }

  function showEmpty() {
    requestId++;
    cur = 0;
    main.removeAttribute('aria-busy');
    main.innerHTML = '<p class="eyebrow"></p><h1></h1><p></p>';
    main.querySelector('.eyebrow').textContent = cats[mode].name;
    main.querySelector('h1').textContent = 'Nessun appunto per ora';
    main.querySelector('h1 + p').textContent = 'Qui compariranno gli appunti di questa sezione non appena li aggiungerai al catalogo in script.js.';
    window.scrollTo(0, 0);
    updateNav();
  }

  function show(i, animate, pushHash) {
    var days = items();
    if (!days.length) { showEmpty(); return; }
    cur = Math.max(0, Math.min(days.length - 1, i));
    var d = days[cur];
    var myRequest = ++requestId;

    /* titolo subito visibile, poi stato di caricamento */
    main.innerHTML = '<p class="eyebrow">' + cats[mode].label + ' ' + d.n + '</p><h1></h1>';
    main.querySelector('h1').textContent = d.title;
    main.setAttribute('aria-busy', 'true');
    showLoading();

    if (animate) { main.classList.remove('fade'); void main.offsetWidth; main.classList.add('fade'); }
    window.scrollTo(0, 0);
    store(cats[mode].key, d.n);
    syncHash(d, pushHash);
    updateNav();

    fetchDay(d).then(function (html) {
      if (myRequest !== requestId) return;   /* nel frattempo ho cambiato Day */
      var status = main.querySelector('[role="status"]');
      if (status) status.remove();
      main.insertAdjacentHTML('beforeend', html);
      main.removeAttribute('aria-busy');
      renderMath();
    }).catch(function (err) {
      if (myRequest !== requestId) return;
      var status = main.querySelector('[role="status"]');
      if (status) status.remove();
      main.removeAttribute('aria-busy');
      showError(d);
      if (window.console) console.error('Errore nel caricamento di ' + d.file + ':', err);
    });
  }

  function updateNav() {
    var days = items();
    dotsBtn.innerHTML = '';
    dotsBtn.disabled = !days.length;
    days.forEach(function (d, k) {
      var sp = document.createElement('span');
      sp.className = 'dot' + (k === cur ? ' on' : '');
      dotsBtn.appendChild(sp);
    });
    dotsBtn.setAttribute('aria-label', days.length ? 'Scegli il Day, ora ' + cats[mode].label + ' ' + days[cur].n : 'Nessun appunto in questa sezione');
    prevBtn.disabled = !days.length || cur === 0;
    nextBtn.disabled = !days.length || cur === days.length - 1;
    Array.prototype.forEach.call(menu.children, function (btn, k) {
      btn.classList.toggle('cur', k === cur);
      btn.querySelector('.mk').textContent = k === cur ? '●' : '○';
      if (k === cur) btn.setAttribute('aria-current', 'true'); else btn.removeAttribute('aria-current');
    });
  }

  function buildMenu() {
    menu.innerHTML = '';
    items().forEach(function (d, k) {
      var b = document.createElement('button');
      b.className = 'day-item';
      b.setAttribute('role', 'menuitem');
      b.innerHTML = '<span class="mk">○</span><span>' + d.n + '. ' + d.title + '</span>';
      b.addEventListener('click', function () { closeAll(); show(k, true, true); });
      menu.appendChild(b);
    });
  }

  function setOpen(panel, btn, open) { panel.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
  function closeAll() { setOpen(menu, dotsBtn, false); setOpen(settings, aaBtn, false); setOpen(modeMenu, modeBtn, false); }

  /* ---------- Menu Lezioni / Esercitazioni ---------- */
  function buildModeMenu() {
    modeMenu.innerHTML = '';
    Object.keys(cats).forEach(function (k) {
      var b = document.createElement('button');
      b.className = 'day-item' + (k === mode ? ' cur' : '');
      b.setAttribute('role', 'menuitem');
      if (k === mode) b.setAttribute('aria-current', 'true');
      b.innerHTML = '<span class="mk">' + (k === mode ? '●' : '○') + '</span><span></span>';
      b.lastChild.textContent = cats[k].name;
      b.addEventListener('click', function () { closeAll(); switchMode(k, true); });
      modeMenu.appendChild(b);
    });
  }
  function startIndex(md) {
    var list = cats[md].list, want = parseInt(load(cats[md].key), 10), idx = 0;
    list.forEach(function (d, k) { if (d.n === want) idx = k; });
    return idx;
  }
  function switchMode(md, push, idx) {
    if (md === mode && idx === undefined) return;
    mode = md;
    store('a1-mode', md);
    buildModeMenu();
    buildMenu();
    show(idx === undefined ? startIndex(md) : idx, true, push);
  }

  dotsBtn.addEventListener('click', function () { var open = menu.hidden; closeAll(); setOpen(menu, dotsBtn, open); });
  modeBtn.addEventListener('click', function () { var open = modeMenu.hidden; closeAll(); setOpen(modeMenu, modeBtn, open); });
  aaBtn.addEventListener('click', function () { var open = settings.hidden; closeAll(); setOpen(settings, aaBtn, open); });
  document.addEventListener('click', function (e) { if (!e.target.closest('.day-menu, .dots, .settings, .aa, .mode-menu, .brand-btn')) closeAll(); });
  prevBtn.addEventListener('click', function () { show(cur - 1, true, true); });
  nextBtn.addEventListener('click', function () { show(cur + 1, true, true); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
    else if (e.key === 'ArrowLeft' && !e.metaKey && !e.altKey) show(cur - 1, true, true);
    else if (e.key === 'ArrowRight' && !e.metaKey && !e.altKey) show(cur + 1, true, true);
  });

  /* Back/forward del browser o modifica manuale dell'hash */
  window.addEventListener('hashchange', function () {
    var h = parseHash();
    if (!h) return;
    if (h.mode !== mode) switchMode(h.mode, false, h.idx);
    else if (h.idx !== cur) show(h.idx, true, false);
  });

  /* ---------- Navigatore che si rimpicciolisce scorrendo ---------- */
  var lastScrollY = window.scrollY, navShrinkTicking = false;
  function updateNavShrink() {
    var y = window.scrollY;
    var goingDown = y > lastScrollY;
    var pastThreshold = y > 40;
    if (goingDown && pastThreshold) nav.classList.add('shrink'); else nav.classList.remove('shrink');
    lastScrollY = y;
    navShrinkTicking = false;
  }
  window.addEventListener('scroll', function () {
    if (!navShrinkTicking) { navShrinkTicking = true; requestAnimationFrame(updateNavShrink); }
  }, { passive: true });

  /* ---------- Dimensione del testo ---------- */
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

  /* ---------- Avvio: hash URL > ultimo Day salvato > primo Day ---------- */
  applyZoom();
  applyTheme(root.getAttribute('data-theme') || 'light');
  var h0 = parseHash();
  var saved = load('a1-mode');
  mode = h0 ? h0.mode : (saved && cats[saved] ? saved : 'lezioni');
  buildModeMenu();
  buildMenu();
  show(h0 ? h0.idx : startIndex(mode), false, false);
  if (!window.renderMathInElement) window.addEventListener('load', renderMath);
});
