// Libro paginado de «Educación». Reparte las entradas en páginas del tamaño real (nada se corta) y se pasa de página con la esquina de abajo:
// al acercar el ratón la esquina se dobla, y al pulsarla la página se vuelve. En el móvil (una sola columna) se ve todo seguido.
// `entradas`: lista de entradas; cada una es una lista de bloques HTML que se prefiere no separar (si no caben juntos en una página, se parten).
import { PAGINA } from './libro3d.js';

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
  const num = i => (i < paginas.length && paginas.length > 1 ? `<span class="num">${i + 1}</span>` : '');
  const pagina = i => (paginas[i] ?? '') + num(i);
  function pintar() {
    const n = total();
    izq.innerHTML = pagina(spread * 2) + (spread > 0 ? esquina('ant', T.paginaAnt) : '');
    der.innerHTML = pagina(spread * 2 + 1) + (spread < n - 1 ? esquina('sig', T.paginaSig) : '');
    der.style.visibility = es3d || getComputedStyle(book).display === 'grid' ? '' : (paginas.length > 1 ? '' : 'hidden');
  }
  // pasar página como en un libro de verdad: la hoja que se vuelve lleva su texto por las dos caras (delante, la página que se deja; detrás, la que viene)
  // y debajo ya está escrita la página siguiente, así que en ningún momento se ve una hoja en blanco
  function pasar(d) {
    if (ocupado) return; const nuevo = spread + d; if (nuevo < 0 || nuevo >= total()) return;
    book.classList.remove('opening');                                       // la animación de apertura volvería a dispararse
    if (book.closest('.noanim')) { spread = nuevo; pintar(); return; }       // sin animaciones: se cambia de golpe
    ocupado = true;
    const adelante = d > 0, sale = adelante ? der : izq;
    const hoja = document.createElement('div'); hoja.className = 'hojagiro ' + (adelante ? 'der' : 'izq');
    hoja.innerHTML = `<div class="page ${adelante ? 'right' : 'left'}">${pagina(spread * 2 + (adelante ? 1 : 0))}</div>`
                   + `<div class="page dorso ${adelante ? 'left' : 'right'}">${pagina(nuevo * 2 + (adelante ? 0 : 1))}</div>`;
    sale.innerHTML = pagina(nuevo * 2 + (adelante ? 1 : 0));               // lo que queda debajo de la hoja que se levanta
    const caja = es3d ? sale.parentElement : book;                          // en 3D, cada hoja de texto tiene su propio marco (y la de la izquierda va antes: se sube encima)
    if (!es3d) Object.assign(hoja.style, { left: sale.offsetLeft + 'px', top: sale.offsetTop + 'px', width: sale.offsetWidth + 'px', height: sale.offsetHeight + 'px' });
    caja.style.zIndex = '2'; caja.appendChild(hoja);
    hoja.addEventListener('animationend', () => { hoja.remove(); caja.style.zIndex = ''; spread = nuevo; pintar(); ocupado = false; }, { once: true });
  }
  book.addEventListener('click', e => { const c = e.target.closest('.curl'); if (c) pasar(c.classList.contains('sig') ? 1 : -1); });
  const reiniciar = () => { paginar(); spread = Math.min(spread, total() - 1); pintar(); };
  // con el libro 3D: pone cada hoja de texto sobre su hoja del modelo (rectángulos en píxeles del viewport)
  book.colocar = r => {
    for (const [pag, q] of [[izq, r.izq], [der, r.der]]) { const k = q.w / PAGINA.w; pag.parentElement.style.transform = `translate(${q.x}px, ${q.y}px) scale(${k})`; }
  };
  book.addEventListener('abrir', () => { spread = 0; ocupado = false; requestAnimationFrame(reiniciar); });          // cada vez que se abre, desde la primera página
  let ancho = 0; new ResizeObserver(() => { if (book.offsetWidth && book.offsetWidth !== ancho) { ancho = book.offsetWidth; reiniciar(); } }).observe(book);
}
