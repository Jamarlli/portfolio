// Libro paginado de «Educación». Reparte las entradas en páginas del tamaño real (nada se corta) y se pasa de página con la esquina de abajo:
// al acercar el ratón la esquina se dobla, y al pulsarla la página se vuelve. En el móvil (una sola columna) se ve todo seguido.
// `entradas`: lista de entradas; cada una es una lista de bloques HTML que se prefiere no separar (si no caben juntos en una página, se parten).
export function montarLibro(book, titulo, entradas, T) {
  if (book.dataset.montado) return; book.dataset.montado = '1';             // el panel se guarda en caché: solo se monta una vez
  const izq = book.querySelector('.page.left'), der = book.querySelector('.page.right');
  let paginas = [], spread = 0, ocupado = false;

  const medidor = () => {
    const m = izq.cloneNode(false); m.removeAttribute('id'); m.classList.add('medidor'); m.className = 'page medidor';
    book.appendChild(m); m.style.width = izq.offsetWidth + 'px'; m.style.height = izq.offsetHeight + 'px'; return m;
  };
  function paginar() {
    if (getComputedStyle(book).display !== 'grid') { paginas = [titulo + entradas.map(e => e.join('')).join('')]; return; }   // móvil: todo seguido
    const m = medidor(), cabe = html => { m.innerHTML = html; return m.scrollHeight <= m.clientHeight + 1; };
    paginas = []; let cur = titulo;
    const nueva = () => { paginas.push(cur); cur = ''; };
    const vacia = () => cur === '' || cur === titulo;
    for (const e of entradas) {
      const junto = e.join('');
      if (cabe(cur + junto)) { cur += junto; continue; }
      if (!vacia() && cabe(junto)) { nueva(); cur = junto; continue; }                  // cabe entera en una página nueva
      for (const b of e) { if (cabe(cur + b) || vacia()) cur += b; else { nueva(); cur = b; } }   // ni solo cabe: se parte en bloques
    }
    if (!vacia()) nueva();
    m.remove();
  }
  const total = () => Math.max(1, Math.ceil(paginas.length / 2));
  const esquina = (tipo, texto) => `<button class="curl ${tipo}" type="button" aria-label="${texto}" title="${texto}"></button>`;
  function pintar() {
    const n = total(), a = paginas[spread * 2] ?? '', b = paginas[spread * 2 + 1] ?? '';
    const num = i => (i < paginas.length && paginas.length > 1 ? `<span class="num">${i + 1}</span>` : '');
    izq.innerHTML = a + num(spread * 2) + (spread > 0 ? esquina('ant', T.paginaAnt) : '');
    der.innerHTML = b + num(spread * 2 + 1) + (spread < n - 1 ? esquina('sig', T.paginaSig) : '');
    der.style.visibility = getComputedStyle(book).display === 'grid' ? '' : (paginas.length > 1 ? '' : 'hidden');
  }
  function pasar(d) {
    if (ocupado) return; const nuevo = spread + d; if (nuevo < 0 || nuevo >= total()) return;
    ocupado = true;
    const sale = d > 0 ? der : izq, entra = d > 0 ? izq : der, clase = d > 0 ? 'der' : 'izq';
    const fin = () => {
      sale.classList.remove('sale-' + clase); spread = nuevo; pintar();
      entra.classList.add('entra-' + (d > 0 ? 'izq' : 'der'));
      entra.addEventListener('animationend', () => { entra.classList.remove('entra-izq', 'entra-der'); ocupado = false; }, { once: true });
    };
    sale.classList.add('sale-' + clase);
    if (getComputedStyle(sale).animationName === 'none') { sale.classList.remove('sale-' + clase); spread = nuevo; pintar(); ocupado = false; return; }   // sin animaciones: se cambia de golpe
    sale.addEventListener('animationend', fin, { once: true });
  }
  book.addEventListener('click', e => { const c = e.target.closest('.curl'); if (c) pasar(c.classList.contains('sig') ? 1 : -1); });
  const reiniciar = () => { paginar(); spread = Math.min(spread, total() - 1); pintar(); };
  book.addEventListener('abrir', () => { spread = 0; ocupado = false; requestAnimationFrame(reiniciar); });          // cada vez que se abre, desde la primera página
  let ancho = 0; new ResizeObserver(() => { if (book.offsetWidth && book.offsetWidth !== ancho) { ancho = book.offsetWidth; reiniciar(); } }).observe(book);
}
