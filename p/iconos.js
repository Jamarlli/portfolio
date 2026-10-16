// Iconos pixelados (rejillas de píxeles, dibujadas como SVG sin suavizado) para los contactos de "Sobre mí".
// '#' = píxel pintado (color del texto: cambia al pasar el ratón), '.' = vacío.
const cuadricula = (w, h, pinta) => Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (pinta(x, y) ? '#' : '.')).join(''));

const linkedin = cuadricula(14, 14, (x, y) => {
  const esquina = (x === 0 || x === 13) && (y === 0 || y === 13);
  const hueco = (y >= 3 && y <= 4 && x >= 3 && x <= 4)                                   // punto de la i
    || (y >= 6 && y <= 10 && x >= 3 && x <= 4)                                           // palo de la i
    || (y === 6 && x >= 6 && x <= 11) || (y >= 7 && y <= 10 && (x === 6 || x === 7 || x === 10 || x === 11));   // la n
  return !esquina && !hueco;
});

const github = cuadricula(14, 14, (x, y) => {
  const dx = x - 6.5, dy = y - 6.5;
  if (dx * dx + dy * dy > 6.9 * 6.9) return false;                                       // círculo
  const gato = (y >= 3 && y <= 4 && (x === 4 || x === 9)) || (y >= 4 && y <= 7 && x >= 3 && x <= 10)   // orejas y cabeza
    || (y === 8 && x >= 4 && x <= 9) || (y === 9 && x >= 5 && x <= 8) || (y === 10 && x >= 4 && x <= 6);
  const ojos = y === 6 && (x === 5 || x === 8);
  return !gato || ojos;
});

const nodicus = (() => {                                                                  // tres nodos unidos (grafo)
  const nodos = [[2, 2], [11, 3], [6, 11]], g = Array.from({ length: 14 }, () => Array(14).fill('.'));
  for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
    const [x0, y0] = nodos[a], [x1, y1] = nodos[b], n = 20;
    for (let i = 0; i <= n; i++) g[Math.round(y0 + (y1 - y0) * i / n)][Math.round(x0 + (x1 - x0) * i / n)] = '#';
  }
  for (const [x, y] of nodos) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) g[y + j][x + i] = '#';
  return g.map(f => f.join(''));
})();

const email = cuadricula(14, 14, (x, y) => {
  if (y < 2 || y > 11) return false;
  const borde = y === 2 || y === 11 || x === 0 || x === 13;
  const solapa = y >= 3 && y <= 7 && (x === y - 2 || x === 15 - y);                      // la V del sobre
  return borde || solapa;
});

const ICONOS = { linkedin, github, nodicus, email };

export function icono(nombre) {
  const filas = ICONOS[nombre];
  if (!filas) return '';
  let rects = '';
  filas.forEach((f, y) => { for (const m of f.matchAll(/#+/g)) rects += `<rect x="${m.index}" y="${y}" width="${m[0].length}" height="1"/>`; });
  return `<svg class="ico-svg" viewBox="0 0 14 14" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects}</svg>`;
}
