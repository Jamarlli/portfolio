// Libro paginado de «Educación». Reparte las entradas en páginas del tamaño real (nada se corta) y se pasa de página con la esquina de abajo:
// al acercar el ratón la esquina se dobla, y al pulsarla la página se vuelve. En el móvil (una sola columna) se ve todo seguido.
// `entradas`: lista de entradas; cada una es una lista de bloques HTML que se prefiere no separar (si no caben juntos en una página, se parten).
import { PAGINA } from './libro3d.js';

const CPS = 450, TMAX = 1.5;                                                // velocidad de escritura (letras por segundo) y lo máximo que tarda una hoja doble
const LLENA = 0.5;                                                          // una entrada no se pasa entera a la página siguiente si la actual está por debajo de esto

export function montarLibro(book, titulo, entradas, T) {
  if (book.dataset.montado) return; book.dataset.montado = '1';             // el panel se guarda en caché: solo se monta una vez
  const izq = book.querySelector('.page.left'), der = book.querySelector('.page.right');
  const es3d = book.classList.contains('book3d');                          // las hojas van sobre las del libro 3D: tamaño fijo de diseño, que se escala a pantalla
  let paginas = [], spread = 0, ocupado = false;

  const medidor = () => {
    const m = document.createElement('div'); m.className = 'page medidor'; book.appendChild(m);
    m.style.width = (es3d ? PAGINA.w : izq.offsetWidth) + 'px'; m.style.height = (es3d ? PAGINA.h : izq.offsetHeight) + 'px'; return m;
  };
  function paginar() {
    if (!es3d && getComputedStyle(book).display !== 'grid') { paginas = [titulo + entradas.map(e => e.join('')).join('')]; return; }   // móvil: todo seguido
    const m = medidor(), cabe = html => { m.innerHTML = html; return m.scrollHeight <= m.clientHeight + 1; };
    const llenado = html => { m.innerHTML = `<div>${html}</div>`; return m.firstChild.offsetHeight / m.clientHeight; };   // qué parte de la hoja ocupa el contenido
    paginas = []; let cur = titulo;
    const nueva = () => { paginas.push(cur); cur = ''; };
    const vacia = () => cur === '' || cur === titulo;
    for (const e of entradas) {
      const junto = e.join('');
      if (cabe(cur + junto)) { cur += junto; continue; }
      if (!vacia() && cabe(junto) && llenado(cur) >= LLENA) { nueva(); cur = junto; continue; }   // cabe entera en una página nueva (si la actual está casi llena; si no, se parte)
      for (const b of e) { if (cabe(cur + b) || vacia()) cur += b; else { nueva(); cur = b; } }   // ni solo cabe: se parte en bloques
    }
    if (!vacia()) nueva();
    m.remove();
  }
  const total = () => Math.max(1, Math.ceil(paginas.length / 2));
  const esquina = (tipo, texto) => `<button class="curl ${tipo}" type="button" aria-label="${texto}" title="${texto}"></button>`;
  // máquina de escribir: cada letra del texto va en su propio span (el reparto de líneas no cambia) y se van mostrando de la primera hoja a la segunda
  let escribiendo = 0;
  function escribir(hojas) {
    const id = ++escribiendo, letras = [], items = [];
    for (const li of book.querySelectorAll('li')) li.classList.add('nuevo');                  // la viñeta sale con la primera letra
    for (const h of hojas) {
      const w = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest('.num, .curl') || !n.data.trim() ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT });
      const nodos = []; while (w.nextNode()) nodos.push(w.currentNode);
      for (const n of nodos) {
        const f = document.createDocumentFragment();
        for (const c of n.data) { const sp = document.createElement('span'); sp.className = 'ch'; sp.textContent = c; f.appendChild(sp); letras.push(sp); items.push(n.parentElement.closest('li')); }
        n.replaceWith(f);
      }
    }
    const cps = Math.max(CPS, letras.length / TMAX), t0 = performance.now(); let hechas = 0;
    (function paso(t) {
      if (id !== escribiendo || !book.isConnected) return;
      const n = Math.min(letras.length, Math.floor((t - t0) * cps / 1000));
      for (; hechas < n; hechas++) { letras[hechas].classList.add('v'); items[hechas]?.classList.remove('nuevo'); }
      if (hechas < letras.length) requestAnimationFrame(paso);
    })(t0);
  }
  function pintar(animar = false) {
    const n = total(), a = paginas[spread * 2] ?? '', b = paginas[spread * 2 + 1] ?? '';
    const num = i => (i < paginas.length && paginas.length > 1 ? `<span class="num">${i + 1}</span>` : '');
    izq.innerHTML = a + num(spread * 2) + (spread > 0 ? esquina('ant', T.paginaAnt) : '');
    der.innerHTML = b + num(spread * 2 + 1) + (spread < n - 1 ? esquina('sig', T.paginaSig) : '');
    der.style.visibility = es3d || getComputedStyle(book).display === 'grid' ? '' : (paginas.length > 1 ? '' : 'hidden');
    escribiendo++;                                                         // si había una escritura a medias, se cancela
    if (animar && !book.closest('.noanim') && (es3d || getComputedStyle(book).display === 'grid')) escribir([izq, der]);
  }
  function pasar(d) {
    if (ocupado) return; const nuevo = spread + d; if (nuevo < 0 || nuevo >= total()) return;
    ocupado = true; book.classList.remove('opening');                       // la animación de apertura volvería a dispararse al quitar la del giro: se movería dos veces
    const sale = d > 0 ? der : izq, entra = d > 0 ? izq : der, clase = d > 0 ? 'der' : 'izq';
    const fin = () => {
      sale.classList.remove('sale-' + clase); spread = nuevo; pintar(true);
      entra.classList.add('entra-' + (d > 0 ? 'izq' : 'der'));
      entra.addEventListener('animationend', () => { entra.classList.remove('entra-izq', 'entra-der'); ocupado = false; }, { once: true });
    };
    sale.classList.add('sale-' + clase);
    if (getComputedStyle(sale).animationName === 'none') { sale.classList.remove('sale-' + clase); spread = nuevo; pintar(); ocupado = false; return; }   // sin animaciones: se cambia de golpe
    sale.addEventListener('animationend', fin, { once: true });
  }
  book.addEventListener('click', e => { const c = e.target.closest('.curl'); if (c) pasar(c.classList.contains('sig') ? 1 : -1); });
  const reiniciar = (animar = false) => { paginar(); spread = Math.min(spread, total() - 1); pintar(animar === true); };
  // con el libro 3D: pone cada hoja de texto sobre su hoja del modelo (rectángulos en píxeles del viewport)
  book.colocar = r => {
    for (const [pag, q] of [[izq, r.izq], [der, r.der]]) { const k = q.w / PAGINA.w; pag.parentElement.style.transform = `translate(${q.x}px, ${q.y}px) scale(${k})`; }
  };
  book.addEventListener('abrir', () => { spread = 0; ocupado = false; requestAnimationFrame(() => reiniciar(true)); });          // cada vez que se abre, desde la primera página
  let ancho = 0; new ResizeObserver(() => { if (book.offsetWidth && book.offsetWidth !== ancho) { ancho = book.offsetWidth; reiniciar(); } }).observe(book);
}
