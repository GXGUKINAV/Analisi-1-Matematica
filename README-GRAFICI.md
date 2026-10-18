# Guida ai grafici SVG e interattivi per gli appunti di Analisi 1

Questo file raccoglie **tutte le regole** per creare grafici (statici e interattivi) nel sito degli appunti.
Se lo incolli a Claude, può lavorare senza dover riscoprire ogni volta come funziona il sito.

---

## 0. Cosa è stato costruito

- I grafici statici sono **SVG** disegnati a codice (niente immagini, niente GeoGebra). Seguono tema chiaro/scuro e zoom del testo.
- Ogni SVG sta in un **file separato** in `appunti/fig/`, e il Day contiene solo un segnaposto leggero.
- `figure.js` carica gli SVG dentro la pagina e contiene anche il **grafico interattivo ε–δ**.
- `style.css` contiene le classi `.fig ...` che colorano e dimensionano tutto.

## 1. Struttura dei file

```
index.html                      (+ una riga: <script defer src="figure.js"></script> prima di </body>)
style.css                       (+ blocco "Grafici SVG nelle note" e "Grafico interattivo ε–δ")
script.js                       (NON si tocca: carica i Day con fetch + insertAdjacentHTML)
figure.js                       (loader degli SVG + widget interattivo)
appunti/day-09.html             (frammento HTML con i segnaposto)
appunti/fig/day-09-<chiave>.svg (un file per grafico)
```

Percorsi: nel Day si scrive `data-src="appunti/fig/day-09-<chiave>.svg"` (relativo a `index.html`, come i file dei Day nel catalogo di `script.js`).

## 2. Regole d'oro (da non violare)

1. **Limite di dimensione.** Un Day con tutti gli SVG inline arrivava a ~60.000 caratteri e la pagina veniva **troncata a ~43-45.000** (si vedeva un grafico a metà e la pagina finiva lì). Quindi: **mai SVG inline nei Day**, sempre file in `appunti/fig/`. Obiettivo: ogni Day sotto ~30.000 caratteri.
2. **Frammenti HTML dei Day:** niente `<script>`, niente `<style>`, niente CSS/JS inline (regola del template). Il JS vive solo in `figure.js`.
3. **Niente LaTeX dentro l'SVG.** KaTeX non renderizza dentro `<text>`. Per pedici/apici si usano `<tspan>` (vedi `tx()`). Il LaTeX va **solo nelle didascalie** (`<figcaption>`), che sono HTML normale.
4. **Non rigenerare `script.js` o `index.html` interi** partendo dalla copia nel progetto: può essere vecchia (il catalogo potrebbe non avere gli ultimi Day). Per `index.html` si dà solo la riga da aggiungere. Se serve davvero modificarli, chiedere prima la versione attuale.
5. **Font-size nei `<tspan>`: usare `em`** (es. `font-size="0.75em"`), non `%` (alcuni renderer, come cairosvg, lo interpretano male).
6. **Id univoci** per i `clipPath` (`cp1`, `cp2`, ...), altrimenti i grafici si rubano il clip a vicenda.
7. **Ordine di generazione:** se si usa lo script Python, ridefinire le funzioni/figure *prima* di inserirle nell'HTML. (Errore già avvenuto: un grafico veniva ridefinito dopo l'inserimento e nel Day restava la versione vecchia.)

## 2b. Assi, griglia e allineamento (REGOLA OBBLIGATORIA per ogni grafico nel piano)

Valida per successioni a punti, funzioni, piano ε–δ e qualsiasi grafico con assi cartesiani. Stile di riferimento: piano cartesiano classico.

1. **Assi che si incrociano nell'origine (0,0)**, mai assi "ad L" a sinistra/in basso. Anche se la successione parte da n=1 o i valori sono tutti negativi, l'origine resta visibile e gli assi passano da lì. Quindi si lascia un po' di spazio vuoto a sinistra dell'asse y e sotto/sopra l'asse x.
2. **Frecce a entrambe le estremità di ciascun asse** (quattro punte: destra, sinistra, su, giù), come poligoni con classe `arw`. La linea dell'asse si ferma alla base della freccia.
3. **Griglia leggera sullo sfondo** (classe `gr`, passo regolare `gx`, `gy`), disegnata *prima* di assi e punti. Non servono numeri su ogni quadratino: solo i **tick con numeri** sui valori utili (valori della scala, `L±ε`, soglie).
4. **Un solo "0" di origine**, in basso a destra dell'incrocio degli assi; niente tick "0" duplicati sugli assi.
5. **Allineamento esatto.** Punti, tick, numeri, griglia e linee di soglia (es. `N`) si calcolano **tutti con le stesse funzioni `px()` e `py()`**. Mai posizioni "a occhio" o a metà tra due indici. La linea `N=4` passa esattamente per l'ascissa 4: stessa x del tick `4` e del punto con n=4. (Errore già avvenuto: la linea cadeva a 3,5 invece di 4, e a 7,5 invece di 8.)
6. La soglia `N` è l'**indice del primo termine dentro la fascia**: il punto con n=N è arancione e sta sulla linea tratteggiata.
7. **Titolo del grafico (`a_n = ...`) sempre con `text-anchor="start"`**: con i `<tspan dy>` e `anchor="end"` alcuni renderer sovrappongono il testo. La x di partenza si sceglie a mano per stare in una zona vuota (alto a destra o alto a sinistra).
8. **Scala e spazio per le etichette:** tick dell'asse x con numeri sotto l'asse (17px), tick dell'asse y con numeri a sinistra (7px dall'asse). L'estremo sinistro dell'asse y deve avere almeno ~46px di margine (`ox=46`) per etichette come `−0,1`.
9. Valori negativi (es. `−1/2`, `−4`) con il segno meno tipografico `−`, decimali con la virgola (`0,1`).

La funzione `seqplot()` dell'appendice A applica già tutte queste regole: per le successioni a punti si usa quella.

## 3. Convenzioni di notazione e linguaggio

- Il punto limite si scrive **`x̂`** (nell'HTML `\widehat x`), **mai `x₀`**. Nell'SVG si usa `x` + carattere combinante `x̂`.
- **Fascia orizzontale** = striscia di valori tra `L−ε` e `L+ε` (asse y).
  **Fascia verticale** = intervallo `(x̂−δ, x̂+δ)` sull'asse x. Non confonderle nei testi.
- Un `δ` funziona se il tratto di grafico sopra `(x̂−δ, x̂+δ)` resta nella fascia orizzontale. Se funziona un `δ`, funziona ogni `δ` più piccolo; il massimo è la distanza tra `x̂` e il più vicino dei punti dove il grafico tocca `L±ε`.
- Teoria = grafici **simbolici** (`L`, `ε`, `x̂`, `δ`). Esempi = grafici **numerici** (`4, 5, 6` e `5/3, 2, 7/3`, ecc.).
- Pallino **pieno** = estremo incluso; pallino **vuoto** = escluso (o punto di funzione non definito).

## 4. Stile grafico (valori già approvati)

| Elemento | Valore |
|---|---|
| Larghezza figura | `22rem` (segue lo zoom del testo), mai oltre la colonna |
| Curva principale | `stroke-width: 1.7` |
| Assi | `1`, **incrociati in (0,0) con frecce ai due estremi** (classe `arw`, punta 9×7,2); griglia `.8` regolare; tratteggi `.9` (`4 3.5`) |
| Font nell'SVG | `12px`; etichette secondarie `11px` |
| Fasce evidenziate | colore `--accent-soft`, **devono fermarsi alla curva** |
| I 4 punti di contorno (`L±ε`, `x̂±δ`) | tratteggio **leggero** (`dash faint`), puntino grigio piccolo, etichette sbiadite |
| Punti "veri" (`L`, `x̂`) | tratteggio normale, etichette in colore pieno (`main`) |
| Arancione | solo per cose "secondarie ma da seguire" (sottosuccessioni, `x̂` negli insiemi) |

### Regola sulle fasce evidenziate
- Fascia **orizzontale**: poligono dall'asse y fino alla curva, tra i due punti in cui la curva incontra `L+ε` e `L−ε`.
- Fascia **verticale**: poligono dall'asse x fino alla curva, tra `x̂−δ` e `x̂+δ`.
- Mai rettangoli che proseguono oltre la curva (a destra o in alto). Se i punti di incrocio non esistono, ripiego sul rettangolo.

### CSS (blocco da avere in `style.css`)
```css
/* ---------- Grafici SVG nelle note ---------- */
/* La larghezza è in rem: segue lo zoom del testo (--z) e non supera mai la colonna. */
.fig { margin: 1.4rem 0; text-align: center; }
.fig svg { display: inline-block; width: 22rem; max-width: 100%; height: auto; overflow: visible; }
.fig .ax { stroke: var(--muted); stroke-width: 1; fill: none; }
.fig .gr { stroke: var(--line); stroke-width: .8; }
.fig .dash { stroke: var(--muted); stroke-width: .9; stroke-dasharray: 4 3.5; fill: none; }
.fig .cv { stroke: var(--accent); stroke-width: 1.7; fill: none; stroke-linecap: round; }
.fig .cv.thin { stroke-width: 1; opacity: .5; }
.fig .pt { fill: var(--accent); }
.fig .pt2 { fill: #d9822b; }
.fig .hole { fill: var(--surface); stroke: var(--accent); stroke-width: 1.6; }
.fig .band { fill: var(--accent-soft); stroke: none; }
.fig text { fill: var(--ink); font: 12px var(--ui); }
.fig text.sm { font-size: 11px; fill: var(--muted); }
.fig figcaption { margin-top: .4rem; font: .85rem/1.4 var(--ui); color: var(--muted); }
.fig .lgA { fill: var(--accent); }
.fig .lgB { fill: #d9822b; }
.fig .arw { fill: var(--muted); stroke: none; }   /* punte delle frecce degli assi */

/* ---------- Grafico interattivo ε–δ ---------- */
.fig-ctl { display: flex; flex-wrap: wrap; gap: .5rem 1.1rem; justify-content: center; align-items: center; margin-bottom: .7rem; font: 13px var(--ui); color: var(--ink); }
.fig-ctl label { display: inline-flex; align-items: center; gap: .45rem; }
.fig-ctl input[type="range"] { width: 7.5rem; accent-color: var(--accent); }
.fig-ctl output { min-width: 2.8em; text-align: left; font-variant-numeric: tabular-nums; color: var(--muted); }
.fig-ctl select { font: inherit; color: inherit; background: var(--surface); border: 1px solid var(--line); border-radius: 8px; padding: .25rem .5rem; }
.fig .cvh { stroke: var(--accent); stroke-width: 3.4; fill: none; stroke-linecap: round; }
.fig .cvh.bad { stroke: #d9822b; }
.fig .clipb { fill: none; }
.fig-st { margin-top: .5rem; font: .9rem/1.45 var(--ui); color: var(--muted); }
.fig-st b { font-weight: 600; }
.fig-st .ok { color: #2f9e8f; }
.fig-st .no { color: #d9822b; }
.fig .dash.faint { stroke-width: .7; opacity: .45; }
.fig .ptf { fill: var(--muted); opacity: .7; }
.fig text.faint { opacity: .55; }
.fig text.main { fill: var(--ink); }
.fig text.lgB { fill: #d9822b; }
.fig .lgG { fill: var(--muted); }
.fig .bar { fill: var(--accent-soft); stroke: var(--accent); stroke-width: 1; }
.fig .svg-src { text-align: center; }
.fig .svg-src:empty { min-height: 12rem; }
```

## 5. Procedura: grafico statico

1. **Scegli la chiave** del grafico (es. `lt`, `ed`, `sn`) e il Day (es. `day-09`).
2. **Scegli il tipo** (sezione 7) e se è **teoria** (simboli) o **esempio** (numeri).
3. **Genera l'SVG** con il generatore Python (appendice A) o a mano. Salvalo come `appunti/fig/day-09-<chiave>.svg` partendo da:
   ```xml
   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 270"> ... </svg>
   ```
   (senza `width`/`height`: la larghezza la dà il CSS).
4. **Inserisci nel Day** (nel punto esatto in cui serve, vicino al testo che lo spiega):
   ```html
   <figure class="fig">
   <div class="svg-src" data-src="appunti/fig/day-09-lt.svg" role="img" aria-label="Descrizione breve"></div>
   <figcaption>Didascalia con LaTeX: $\lim_{x\to2}(3x-1)=5$ con $\varepsilon=1$ e $\delta=1/3$.</figcaption>
   </figure>
   ```
5. **Consegna**: `day-XX.html` aggiornato + `figure-svg.zip` (cartella `fig/` con **tutti** gli SVG del Day) + `figure.js` / `style.css` solo se cambiati. Dire all'utente dove mettere la cartella (`appunti/fig/`).
6. **Verifica prima di consegnare:**
   - ogni SVG è XML valido (`xml.dom.minidom.parseString`);
   - dimensione del Day (< ~30.000 caratteri);
   - anteprima offline con `cairosvg` (installa con `pip install cairosvg --break-system-packages`; inietta uno `<style>` con colori fissi, perché il CSS del sito non c'è). Serve a controllare sovrapposizioni e posizioni, non i colori finali.

## 6. Dove mettere i grafici in un Day

- **Teoria**, subito dopo la definizione/teorema che illustrano: versione **simbolica**.
- **Esempi**, subito dopo l'esempio: versione **numerica** con i valori dell'esercizio.
- Evitare di accumulare tutti i grafici in fondo.
- Titoli `<h3>` extra solo per il grafico interattivo (finiscono nell'indice).

## 7. Ricette per tipo di grafico

| Tipo | Quando | Note |
|---|---|---|
| **Retta con intervalli** (`numline`) | intorni, domini, chiusura, parte interna | righe distanziate di 40, etichetta riga 15 sopra; pallino pieno/vuoto; frecce se illimitato |
| **Piano ε–δ** (`epsdelta`) | definizione di limite, verifiche | fasce a poligono, 4 punti di contorno leggeri, `L`/`x̂` in evidenza |
| **Salto (unilaterali)** | limite sinistro ≠ destro | due rami con pallini vuoti, etichette `L^−`, `L^+` |
| **Successioni a punti** (`seqplot`) | sottosuccessioni, convergenza, limiti, monotonia | assi in (0,0) con frecce, griglia, tick con numeri; blu = termini, arancione = sottosuccessione / termini da `N` in poi / massimo-minimo; fascia `band`, livello `hline`, soglia `N` esatta sul tick |
| **Barre** | Fibonacci | classe `.bar`, valori sopra le barre |
| **Classificazione punti** | esterno/interno/isolato/accumulazione | 4 righe distanziate 78, striscia tratteggiata = `B_δ(x̂)`, `x̂` arancione |

Regole per i punti di contorno nel piano ε–δ: per ogni livello `L±ε` si cerca il punto della curva più vicino a `x̂` (funzione `cross`) e si traccia un tratteggio leggero fino all'asse y; per `x̂±δ` un tratteggio leggero fino all'asse x.

## 8. Etichette con pedici e apici: `tx()`

Sintassi accettata dentro `tx("...")`:

- `a_n` → pedice di un carattere; `a_{n_k}` → pedici **annidati** (secondo livello più piccolo);
- `B^+_δ(x̂)` → apice + pedice; `D^°` → apice;
- `~D~` → testo con sopralineatura (chiusura).

Il codice usa `<tspan dy="..." font-size="0.75em">` e **resetta** lo spostamento verticale per il testo successivo. Nel codice sorgente dell'SVG compaiono quindi tspan: è normale.
Non scrivere mai `$...$` dentro l'SVG.

## 9. Grafico interattivo ε–δ

### Come funziona
- Nel Day basta il segnaposto:
  ```html
  <h3>Grafico interattivo: scegli $\varepsilon$ e $\delta$</h3>
  <p>Spiegazione di cosa muovere e cosa osservare…</p>
  <div class="eps-delta"></div>
  ```
- `figure.js` osserva la pagina (`MutationObserver`) e, quando compare un `.eps-delta` non ancora attivato, costruisce: menu funzione, slider ε e δ, SVG, messaggio di verifica. Funziona anche se il Day viene caricato dopo (è caricato con `fetch`).
- Mostra: fasce evidenziate (che si fermano alla curva), tratto con `0<|x−x̂|<δ` evidenziato (azzurro se va bene, arancione se esce dalla fascia), i 4 punti di contorno leggeri, messaggio "✓ questo δ va bene / ✗ δ troppo grande" e il **δ massimo** calcolato per bisezione.

### Aggiungere una funzione al menu
In `figure.js`, nell'oggetto `FNS`, aggiungi una voce e un'`<option>` nel menu:
```js
quad: { name: 'f(x) = x² + 1,  x → 0', f: function (x) { return x * x + 1; },
        x0: 0, L: 1, xr: [-2, 2], yr: [0, 5], eps: 0.5, del: 0.3 }
// campo facoltativo: hole: true  → pallino vuoto in (x̂, L)  (per funzioni non definite in x̂)
// e nel menu:  <option value="quad">x² + 1</option>
```
Regole: `xr`/`yr` = finestra visibile; `f` deve essere definita nei punti vicini a `x̂`; `L` è il limite vero (non `f(x̂)` se la funzione ha un buco).

### Creare un nuovo widget interattivo (altro argomento)
1. Scegli una **classe segnaposto** nuova, es. `<div class="succ-eps"></div>` (successioni: slider ε, mostra l'indice `N` oltre il quale i termini stanno nella fascia).
2. In `figure.js` scrivi una funzione `buildNome(host)` che: segna `host.setAttribute('data-ready','1')`, crea un `<figure class="fig fig-i">`, i controlli in `<div class="fig-ctl">` (label + `input[type=range]` + `<output>`), l'SVG con `viewBox`, e un `<div class="fig-st">` per il messaggio; poi `host.parentNode.replaceChild(fig, host)`.
3. Agganciala in `scan()`: `document.querySelectorAll('.succ-eps:not([data-ready])')` → `buildNome(...)`.
4. Riusa le classi `.band`, `.cv`, `.cvh`, `.dash`, `.dash.faint`, `.pt`, `.pt2`, `.ptf`, `.hole` e `text.sm/main/faint`: così tema e zoom funzionano da soli.
5. Calcoli numerici (massimo, soglie): usa campionamento + bisezione; mostra a parole cosa succede nel messaggio, non solo il disegno.
6. Controllo sintassi: `node -e "new Function(require('fs').readFileSync('figure.js','utf8'))"`.

Idee già individuate per i prossimi widget: slider su `N` e `ε` per i limiti di successioni; trasformazioni di `f(x)` (traslazioni, riflessioni, dilatazioni); confronto di crescita (`log n`, `n^α`, `b^n`, `n!`).

## 10. Errori già incontrati (checklist anti-ripetizione)

- Pagina troncata → SVG sempre in file esterni.
- `a_{n_k}` mostrato come testo → servono pedici annidati (`tx()` ricorsivo).
- Righe/etichette sovrapposte nelle figure a più righe → distanze: 40 (retta), 78 (classificazione).
- Fasce che andavano oltre la curva → poligoni, non rettangoli.
- Figura ridefinita ma non aggiornata nel Day → generare le figure *prima* di inserirle.
- Linee troppo spesse e grafico troppo grande → larghezza `22rem`, tratti sottili (sezione 4).
- Legenda con pallini troppo piccoli → pallini veri (`<circle>`), non il carattere `●`.
- `x₀` al posto di `x̂` → usare sempre la notazione degli appunti.
- Cambiare `script.js`/`index.html` interi → solo righe da aggiungere.
- Linea `N=4` non allineata al 4 sull'asse x (cadeva a 3,5) → usare `px(N)`, la stessa funzione di punti e tick (sezione 2b).
- Assi "ad L" a sinistra/in basso, senza frecce e senza origine → assi incrociati in (0,0), frecce ai due estremi, griglia leggera (sezione 2b).
- Titolo `a_n = ...` sovrapposto a se stesso → sempre `text-anchor="start"`.
- Dimenticare `.fig .arw` in `style.css` → senza quella regola le frecce risultano nere e invisibili nel tema scuro.
- **Grafici già esistenti** (Day 9: `epsdelta`, `numline2`, e il widget ε–δ in `figure.js`) usano ancora il vecchio stile con assi a sinistra/in basso: quando si rigenerano vanno portati allo stile della sezione 2b.

## 11. Prompt-tipo da dare a Claude

> Leggi `README-GRAFICI.md`. Nel file `appunti/day-XX.html` aggiungi i grafici seguendo le regole: nella **teoria** versione simbolica, negli **esempi** versione numerica; SVG in file separati in `appunti/fig/day-XX-<chiave>.svg`, nel Day solo i segnaposto `svg-src`. Restituiscimi `day-XX.html`, lo zip con la cartella `fig/`, e solo i file (`figure.js`, `style.css`) che hai davvero cambiato. Non rigenerare `script.js` e `index.html`. Se c'è un'idea di grafico interattivo, proponila a parte senza implementarla.

Per un grafico singolo:

> Aggiungi un grafico di tipo [retta / piano ε–δ / successione a punti / barre] per [argomento], versione [teoria / esempio con questi numeri: …], nel punto [dopo la definizione di …].

---

## Appendice A — Generatore Python (copia di lavoro)

Servono `import re, math` e un dizionario `figs`. Il flusso: costruire ogni figura con `fig(...)`, poi **esternalizzare** gli SVG (vedi sotto) e solo dopo inserire i segnaposto nel Day.

```python
import re, math
figs = {}
def f(v): return '%.1f' % v

def fig(svg, cap, label):          # svg = (viewBox, corpo)
    return '<figure class="fig">\n<svg viewBox="%s" role="img" aria-label="%s">\n%s\n</svg>\n<figcaption>%s</figcaption>\n</figure>\n' % (svg[0], label, svg[1], cap)

# --- etichette con pedici/apici annidati (SVG, NON LaTeX) ---
def tx(s):
    segs=[]
    def parse(s,shift,size):
        i=0;buf=''
        while i<len(s):
            ch=s[i]
            if ch in '_^' and i+1<len(s):
                if buf: segs.append((buf,shift,size,''));buf=''
                if s[i+1]=='{':
                    d=0
                    for j in range(i+1,len(s)):
                        if s[j]=='{': d+=1
                        elif s[j]=='}':
                            d-=1
                            if d==0: break
                    content=s[i+2:j]; i=j+1
                else:
                    content=s[i+1]; i+=2
                parse(content,shift+(3 if ch=='_' else -4)*size/0.75*0.75,size*0.75)
            elif ch=='~':
                if buf: segs.append((buf,shift,size,''));buf=''
                j=s.index('~',i+1); segs.append((s[i+1:j],shift,size,' style="text-decoration:overline"')); i=j+1
            else:
                buf+=ch; i+=1
        if buf: segs.append((buf,shift,size,''))
    parse(s,0,1.0)
    cur=0;out=[]
    for txt,sh,sz,ex in segs:
        a=''
        if abs(sh-cur)>1e-6: a+=' dy="%.1f"'%(sh-cur)
        cur=sh
        if sz!=1.0: a+=' font-size="%.2fem"'%sz
        out.append('<tspan%s%s>%s</tspan>'%(a,ex,txt.replace('&','&amp;').replace('<','&lt;').replace('>','&gt;')))
    return ''.join(out)

# --- helper di base ---
_cid=[0]
def plane(l,r,t,b,xr,yr):
    return (lambda x:l+(x-xr[0])/(xr[1]-xr[0])*(r-l)),(lambda y:b-(y-yr[0])/(yr[1]-yr[0])*(b-t))
def cross(fn,x0,level,xr,steps=800):
    h=(xr[1]-xr[0])/steps
    for i in range(steps):
        for sg in (1,-1):
            xa=x0+sg*i*h; xb=xa+sg*h
            if xb<xr[0] or xb>xr[1]: continue
            fa=fn(xa)-level; fb=fn(xb)-level
            if fa==0: return xa
            if fa*fb<0: return xa+(xb-xa)*fa/(fa-fb)
    return None
def lab(x,y,txt,anchor='start',cls='sm',raw=False):
    return '<text x="%s" y="%s" text-anchor="%s" class="%s">%s</text>'%(f(x),f(y),anchor,cls,txt if raw else tx(txt))
def segs_svg(segs,px,y,W=340):
    o=[]
    for (a,b_,ca,cb) in segs:
        if a==b_:
            o.append('<circle class="pt" cx="%s" cy="%s" r="6"/>'%(f(px(a)),f(y))); continue
        o.append('<line class="cv" x1="%s" y1="%s" x2="%s" y2="%s"/>'%(f(px(a)),f(y),f(px(b_)),f(y)))
        o.append('<circle class="%s" cx="%s" cy="%s" r="5"/>'%('pt' if ca else 'hole',f(px(a)),f(y)))
        o.append('<circle class="%s" cx="%s" cy="%s" r="5"/>'%('pt' if cb else 'hole',f(px(b_)),f(y)))
    return o

# --- retta con intervalli (ticks = [(valore, etichetta)]; righe = [(etichetta, [(a,b,inclusoA,inclusoB)])]) ---
def numline2(lo,hi,ticks,rows,W=320,pad=24):
    H=34+len(rows)*40+34
    px=lambda x:pad+(x-lo)/(hi-lo)*(W-2*pad)
    ay=H-26
    o=['<line class="ax" x1="8" y1="%d" x2="%d" y2="%d"/>'%(ay,W-8,ay)]
    for tv,tl in ticks:
        o.append('<line class="ax" x1="%s" y1="%d" x2="%s" y2="%d"/>'%(f(px(tv)),ay-4,f(px(tv)),ay+4))
        o.append(lab(px(tv),ay+18,tl,'middle','sm main'))
    for i,(lb,sg) in enumerate(rows):
        y=36+i*40
        o.append(lab(8,y-15,lb))
        o+=segs_svg(sg,px,y)
    return ('0 0 %d %d'%(W,H),'\n'.join(o))

# --- piano ε–δ con fasce che si fermano alla curva + legenda + poligono ---
def legend(x,y,items):
    o=[]
    for cls,txt in items:
        plain=re.sub(r'[_^{}~]','',txt)
        o.append('<circle class="%s" cx="%s" cy="%s" r="4"/>'%(cls,f(x+4),f(y-4)))
        o.append(lab(x+13,y,txt))
        x+=13+len(plain)*6.2+18
    return o

def poly(pts,cls='band'):
    return '<polygon class="%s" points="%s"/>'%(cls,' '.join('%s,%s'%(f(a),f(b)) for a,b in pts))

def epsdelta(fn,x0,L,eps,dl,xr,yr,yl,xl,hole,name):
    W,H,l,r,t,b=340,270,44,326,14,236
    px,py=plane(l,r,t,b,xr,yr)
    _cid[0]+=1; cid='cp%d'%_cid[0]
    o=['<clipPath id="%s"><rect x="%d" y="%d" width="%d" height="%d"/></clipPath>'%(cid,l,t,r-l,b-t),'<g clip-path="url(#%s)">'%cid]
    # fascia orizzontale: dall'asse y fino alla curva
    xt=cross(fn,x0,L+eps,xr); xb_=cross(fn,x0,L-eps,xr)
    if xt is not None and xb_ is not None:
        p=[(l,py(L+eps)),(px(xt),py(L+eps))]
        for i in range(41):
            x=xt+(xb_-xt)*i/40; p.append((px(x),py(fn(x))))
        p+=[(px(xb_),py(L-eps)),(l,py(L-eps))]
        o.append(poly(p))
    else:
        o.append('<rect class="band" x="%d" y="%s" width="%d" height="%s"/>'%(l,f(py(L+eps)),r-l,f(py(L-eps)-py(L+eps))))
    # fascia verticale: dall'asse x fino alla curva
    p=[(px(x0-dl),b)]
    for i in range(41):
        x=x0-dl+2*dl*i/40; p.append((px(x),py(fn(x))))
    p.append((px(x0+dl),b))
    o.append(poly(p))
    pts=[]
    for i in range(241):
        x=xr[0]+(xr[1]-xr[0])*i/240
        pts.append('%s,%s'%(f(px(x)),f(py(fn(x)))))
    o.append('<polyline class="cv" points="%s"/>'%' '.join(pts))
    for lv in (L+eps,L-eps):
        xc=cross(fn,x0,lv,xr)
        if xc is None: continue
        o.append('<line class="dash faint" x1="%d" y1="%s" x2="%s" y2="%s"/>'%(l,f(py(lv)),f(px(xc)),f(py(lv))))
        o.append('<circle class="ptf" cx="%s" cy="%s" r="2.6"/>'%(f(px(xc)),f(py(lv))))
    for xv in (x0-dl,x0+dl):
        yv=fn(xv)
        o.append('<line class="dash faint" x1="%s" y1="%s" x2="%s" y2="%d"/>'%(f(px(xv)),f(py(yv)),f(px(xv)),b))
        o.append('<circle class="ptf" cx="%s" cy="%s" r="2.6"/>'%(f(px(xv)),f(py(yv))))
    o.append('<line class="dash" x1="%d" y1="%s" x2="%s" y2="%s"/><line class="dash" x1="%s" y1="%s" x2="%s" y2="%d"/>'%(l,f(py(L)),f(px(x0)),f(py(L)),f(px(x0)),f(py(L)),f(px(x0)),b))
    o.append('<circle class="%s" cx="%s" cy="%s" r="4.5"/>'%('hole' if hole else 'pt',f(px(x0)),f(py(L))))
    o.append('</g>')
    o.append('<line class="ax" x1="%d" y1="%d" x2="%d" y2="%d"/><line class="ax" x1="%d" y1="%d" x2="%d" y2="%d"/>'%(l,t,l,b,l,b,r,b))
    for k,(yv,txt) in enumerate(zip((L+eps,L,L-eps),yl)):
        o.append(lab(l-6,py(yv)+4,txt,'end','sm main' if k==1 else 'sm faint'))
    for k,(xv,txt) in enumerate(zip((x0-dl,x0,x0+dl),xl)):
        o.append(lab(px(xv),b+16,txt,'middle','sm main' if k==1 else 'sm faint'))
    o.append(lab(l+4,t+10,name))
    return ('0 0 %d %d'%(W,H+4),'\n'.join(o))
```

### Successioni a punti con assi in (0,0), frecce e griglia (`seqplot`)

Stile obbligatorio (sezione 2b). Restituisce `(svg, px, py)`; `px`/`py` sono le stesse funzioni usate per punti, tick e linea `N`, così l'allineamento è esatto.

```python
X_TIP, X_LEFT, Y_TOP, Y_BOT = 330, 8, 10, 272     # estremi (punte) degli assi nel viewBox 340x282
AH, AW = 9, 3.6                                    # lunghezza e semi-larghezza della punta
def fmt(v): return ('%g' % v).replace('.', ',').replace('-', '−')

def seqplot(pts, xticks, yticks, xtip, ymax_tip, ymin_tip, gx=1, gy=1,
            band=None, hline=None, N=None, orange=lambda n: False,
            title='', title_x=None, ox=46):
    # pts = [(n, valore)]; xticks = [n]; yticks = [(valore, 'etichetta')]
    # xtip / ymax_tip / ymin_tip = valori dei dati alle punte degli assi (decidono la scala e dove cade l'origine)
    sx = (X_TIP - ox) / xtip
    sy = (Y_BOT - Y_TOP) / (ymax_tip - ymin_tip)
    oy = Y_TOP + ymax_tip * sy                      # l'origine (0,0) sta in (ox, oy)
    px = lambda x: ox + x * sx
    py = lambda y: oy - y * sy
    o = []
    gt, gb, gl, gr = Y_TOP + 12, Y_BOT - 12, X_LEFT + 8, X_TIP - 10
    if band:                                        # fascia ε (da asse y a destra)
        o.append('<rect class="band" x="%s" y="%s" width="%s" height="%s"/>' % (
            f(ox), f(py(band[1])), f(gr - ox), f(py(band[0]) - py(band[1]))))
    for k in range(-20, 400):                       # griglia verticale (multipli di gx)
        x = k * gx
        if k == 0 or px(x) < gl or px(x) > gr: continue
        o.append('<line class="gr" x1="%s" y1="%d" x2="%s" y2="%d"/>' % (f(px(x)), gt, f(px(x)), gb))
    for k in range(-400, 400):                      # griglia orizzontale (multipli di gy)
        y = k * gy
        if k == 0 or py(y) < gt or py(y) > gb: continue
        o.append('<line class="gr" x1="%d" y1="%s" x2="%d" y2="%s"/>' % (gl, f(py(y)), gr, f(py(y))))
    if hline is not None:                           # livello del limite
        o.append('<line class="dash" x1="%s" y1="%s" x2="%d" y2="%s"/>' % (f(ox), f(py(hline)), gr, f(py(hline))))
    if N is not None:                               # soglia N: ESATTAMENTE su px(N)
        o.append('<line class="dash" x1="%s" y1="22" x2="%s" y2="%s"/>' % (f(px(N)), f(px(N)), f(oy)))
        o.append('<text x="%s" y="16" text-anchor="middle" class="sm main">N=%d</text>' % (f(px(N)), N))
    o.append('<line class="ax" x1="%d" y1="%s" x2="%d" y2="%s"/>' % (X_LEFT + AH, f(oy), X_TIP - AH, f(oy)))
    o.append('<line class="ax" x1="%s" y1="%d" x2="%s" y2="%d"/>' % (f(ox), Y_TOP + AH, f(ox), Y_BOT - AH))
    tri = lambda a, b, c: '<polygon class="arw" points="%s"/>' % ' '.join('%s,%s' % (f(p), f(q)) for p, q in (a, b, c))
    o.append(tri((X_TIP, oy), (X_TIP - AH, oy - AW), (X_TIP - AH, oy + AW)))      # destra
    o.append(tri((X_LEFT, oy), (X_LEFT + AH, oy - AW), (X_LEFT + AH, oy + AW)))   # sinistra
    o.append(tri((ox, Y_TOP), (ox - AW, Y_TOP + AH), (ox + AW, Y_TOP + AH)))      # su
    o.append(tri((ox, Y_BOT), (ox - AW, Y_BOT - AH), (ox + AW, Y_BOT - AH)))      # giù
    for n, v in pts:
        o.append('<circle class="%s" cx="%s" cy="%s" r="3.6"/>' % ('pt2' if orange(n) else 'pt', f(px(n)), f(py(v))))
    for x in xticks:
        o.append('<line class="ax" x1="%s" y1="%s" x2="%s" y2="%s"/>' % (f(px(x)), f(oy - 3), f(px(x)), f(oy + 3)))
        o.append('<text x="%s" y="%s" text-anchor="middle" class="sm main">%s</text>' % (f(px(x)), f(oy + 17), fmt(x)))
    for y, lb in yticks:
        o.append('<line class="ax" x1="%s" y1="%s" x2="%s" y2="%s"/>' % (f(ox - 3), f(py(y)), f(ox + 3), f(py(y))))
        o.append('<text x="%s" y="%s" text-anchor="end" class="sm main">%s</text>' % (f(ox - 7), f(py(y) + 4), lb))
    o.append('<text x="%s" y="%s" text-anchor="start" class="sm main">0</text>' % (f(ox + 7), f(oy + 15)))   # origine
    o.append('<text x="%d" y="%s" text-anchor="end" class="sm">n</text>' % (X_TIP - 4, f(oy - 9)))
    tx = title_x if title_x is not None else ox + 10
    o.append('<text x="%d" y="36" text-anchor="start" class="sm">%s</text>' % (tx, title))
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 340 282">\n%s\n</svg>\n' % '\n'.join(o), px, py

def ttl(letter, rest):   # titolo con pedice: ttl('a', '= (−1/2)ⁿ')  ->  a_n = (−1/2)ⁿ
    return '%s<tspan dy="3" font-size="0.75em">n</tspan><tspan dy="-3"> %s</tspan>' % (letter, rest)

# esempio: (−1/2)^n con ε=0,1 e N=4 (da n=4 in poi i termini stanno nella fascia)
svg, px, py = seqplot([(n, (-0.5) ** n) for n in range(0, 11)], [2, 4, 6, 8, 10],
    [(1, '1'), (0.1, '0,1'), (-0.1, '−0,1')], 11.3, 1.25, -0.75, gx=1, gy=0.5,
    band=(-0.1, 0.1), N=4, orange=lambda n: n >= 4, title=ttl('a', '= (−1/2)ⁿ'), title_x=240)
open('fig/es-04-geo.svg', 'w', encoding='utf-8').write(svg)
```

Come scegliere i parametri: `xtip` = ultimo n + ~1; `ymax_tip`/`ymin_tip` = estremi dei valori + margine (per lasciare spazio ai numeri sotto l'asse x serve almeno ~35px sotto l'origine); `title_x` in una zona vuota del grafico (~215–240 alto a destra, oppure il default alto a sinistra). Controllo obbligatorio prima di consegnare: la `x` della linea `N`, del tick `N` e del punto `n=N` devono coincidere (stesso `px(N)`).

Esempi d'uso:

```python
# teoria (simbolico)
g1 = lambda x: 3 + 0.9*(x-2) + 0.45*math.sin(1.4*(x-2))
figs['lt'] = fig(epsdelta(g1, 2, 3, 1.0, 0.6, (0, 4), (0, 6),
                          ('L+ε','L','L−ε'), ('x̂−δ','x̂','x̂+δ'), True, 'y = f(x)'),
                 'Didascalia con $\\varepsilon$ e $\\delta$.', 'Definizione di limite')
# esempio (numerico)
figs['ed'] = fig(epsdelta(lambda x: 3*x-1, 2, 5, 1, 1/3, (1,3), (2,8),
                          ('6','5','4'), ('5/3','2','7/3'), False, 'y = 3x − 1'),
                 'Per $\\lim_{x\\to2}(3x-1)=5$ …', 'Fasce epsilon e delta')
```

### Esternalizzare gli SVG (obbligatorio)
```python
import os
os.makedirs('fig', exist_ok=True)
for k, v in list(figs.items()):
    m = re.search(r'<svg (viewBox="[^"]*") role="img" aria-label="([^"]*)">(.*?)</svg>', v, re.S)
    if not m: continue
    open('fig/day-09-%s.svg' % k, 'w', encoding='utf-8').write(
        '<svg xmlns="http://www.w3.org/2000/svg" %s>%s</svg>' % (m.group(1), m.group(3)))
    figs[k] = v.replace(m.group(0),
        '<div class="svg-src" data-src="appunti/fig/day-09-%s.svg" role="img" aria-label="%s"></div>' % (k, m.group(2)))
# poi inserire figs[k] nel Day con str.replace su un'ancora univoca (assert s.count(ancora)==1)
# zip finale: zip -r figure-svg.zip fig
```

Inserimento nel Day (ancora univoca, prima o dopo):
```python
def before(s, anchor, key):
    assert s.count(anchor) == 1, anchor
    return s.replace(anchor, figs[key] + '\n' + anchor)
```

## Appendice B — `figure.js` (struttura)

`figure.js` è il file di riferimento: **tienilo nel progetto e modificalo, non riscriverlo da zero**. Contiene:

1. `FNS`: funzioni disponibili nel grafico interattivo.
2. `build(host)`: costruisce il widget ε–δ (controlli, SVG, messaggio, `maxDev`, `bestDelta`, `cross`).
3. `loadSvgs()`: per ogni `.svg-src` fa `fetch(data-src)` e inserisce l'SVG inline (se fallisce scrive "Grafico non disponibile").
4. `scan()` + `MutationObserver`: attiva widget e loader su ogni nuovo contenuto.

Per una nuova versione basta chiedere: "modifica `figure.js` allegato aggiungendo …" e allegarlo, così non si perdono le funzioni già presenti.
