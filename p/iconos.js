// Iconos de contacto. El de nódicus es su logo real; el resto, pixelados (rejillas de píxeles, dibujadas como SVG sin suavizado) para los contactos de "Sobre mí".
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

const email = cuadricula(14, 14, (x, y) => {
  if (y < 2 || y > 11) return false;
  const borde = y === 2 || y === 11 || x === 0 || x === 13;
  const solapa = y >= 3 && y <= 7 && (x === y - 2 || x === 15 - y);                      // la V del sobre
  return borde || solapa;
});

const ICONOS = { linkedin, github, email };

export function icono(nombre) {
  if (nombre === 'nodicus') return '<img class="ico-svg" src="./assets/cuarto/nodicus_logo.webp" alt="" aria-hidden="true">';   // el logo real (favicon de nodicus.com)
  const filas = ICONOS[nombre];
  if (!filas) return '';
  let rects = '';
  filas.forEach((f, y) => { for (const m of f.matchAll(/#+/g)) rects += `<rect x="${m.index}" y="${y}" width="${m[0].length}" height="1"/>`; });
  return `<svg class="ico-svg" viewBox="0 0 14 14" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">${rects}</svg>`;
}
