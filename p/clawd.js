import { FRAMES_TRABAJO, COLS_TRABAJO, FILAS_TRABAJO, MS_TRABAJO, PALETA_TRABAJO } from './clawd_trabajo.js';
// Clawd, la mascota de Claude Code, dibujado a mano en píxeles sobre un lienzo de 128 x 78 que se pone encima de la segunda pantalla.
// Cada escena es una función dibujar(t) (t = segundos desde que empieza) que pinta el fotograma entero, sin imágenes: todo son rectángulos.
// El cuerpo es el del sprite del terminal (naranja #d77757): un bloque ancho, brazos como tacos laterales, cuatro patas finas y ojos cuadrados.
export const W = 128, H = 78;
const NARANJA = '#d77757', SOMBRA = '#b25a40', NEGRO = '#171210', BLANCO = '#f4f1ea';
let g = null;                                                   // contexto del lienzo en el que se está pintando
const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const P = (x, y, c) => R(x, y, 1, 1, c);
const alfa = a => { g.globalAlpha = a; };
const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const mezcla = (a, b, k) => a + (b - a) * k, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const suave = k => { k = clamp(k); return k * k * (3 - 2 * k); };
function linea(x0, y0, x1, y1, c) {                             // Bresenham
  x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
  for (;;) { P(x0, y0, c); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
}
function disco(cx, cy, r, c) {
  g.fillStyle = c; const r2 = r * r + r * 0.6;
  for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) { const q = r2 - y * y; if (q < 0) continue; const w = Math.floor(Math.sqrt(q)); g.fillRect(Math.round(cx) - w, Math.round(cy) + y, 2 * w + 1, 1); }
}
function bandas(y0, y1, cols) { const h = (y1 - y0) / cols.length; cols.forEach((c, i) => R(0, y0 + i * h, W, Math.ceil(h) + 1, c)); }
// letras de 3 x 5 (las que hacen falta)
const FUENTE = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '111101101101101', O: '111101101101111', P: '111101111100100', Q: '111101101111001', R: '111101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111',
  '!': '11101', '?': '111001011000010', '>': '100010001010100', '.': '00001', '*': '000101010101000', ':': '01010', '-': '000000111000000', '/': '001001010100100', ',': '00011', '\\': '100100010001001', '(': '010100100100010', ')': '010001001001010', '"': '101101000000000', '+': '000010111010000', '·': '00100', '=': '000111000111000', '_': '000000000000111' };
function texto(s, x, y, c, k = 1) {
  for (const ch of s) {
    const f = FUENTE[ch]; if (!f) { x += 2 * k; continue; }
    const w = f.length === 5 ? 1 : 3;
    for (let i = 0; i < f.length; i++) if (f[i] === '1') R(x + (i % w) * k, y + Math.floor(i / w) * k, k, k, c);
    x += (w + 1) * k;
  }
}
const anchoTexto = s => [...s].reduce((a, ch) => a + (FUENTE[ch] ? (FUENTE[ch].length === 5 ? 1 : 3) + 1 : 2), -1);
function bocadillo(cx, y, s, cola = 1) {                        // globo blanco con letras negras y una colita hacia abajo
  const w = anchoTexto(s) + 6;
  R(cx - w / 2 + 1, y, w - 2, 11, BLANCO); R(cx - w / 2, y + 1, w, 9, BLANCO);
  texto(s, cx - w / 2 + 3, y + 3, NEGRO);
  R(cx + cola * 3 - 1, y + 11, 3, 1, BLANCO); R(cx + cola * 3, y + 12, 1, 1, BLANCO);
}
const corazon = (x, y, c = '#e8505b') => { R(x, y, 2, 1, c); R(x + 3, y, 2, 1, c); R(x, y + 1, 5, 1, c); R(x + 1, y + 2, 3, 1, c); P(x + 2, y + 3, c); };
const chispa = (x, y, c = '#ffe58a') => { P(x, y, c); P(x - 1, y, c); P(x + 1, y, c); P(x, y - 1, c); P(x, y + 1, c); };

// ---------------------------------------------------------------- Clawd
// Clawd se dibuja en "celdas" de 2 x 2 píxeles (K): el cuerpo mide 11 x 7 celdas, como el sprite del terminal; el resto, en píxeles sueltos.
const K = 2;
function celdas(x, y, fn, k = K) { g.save(); g.translate(Math.round(x), Math.round(y)); g.scale(k, k); fn(); g.restore(); }
// x: centro; y: el suelo, justo debajo de las patas. `ropa(top)` pinta gorros y accesorios en celdas (x = 0 es el centro, top la fila de arriba del cuerpo).
// Devuelve { top } en píxeles del lienzo (la fila de arriba de la cabeza).
function clawd(x, y, o = {}) {
  const { ojos = 'a', mira = 0, bI = 'abajo', bD = 'abajo', agacha = 0, anda = -1, color = NARANJA, sombra = SOMBRA, alcance = 8, teclea = 0, ropa = null, ropaAntes = false, k = K } = o;
  const pata = 3 - agacha, top = -pata - 7;
  celdas(x, y, () => {
    [-4, -2, 2, 4].forEach((dx, i) => R(dx, -pata, 1, pata - (anda >= 0 && (i + anda) % 2 === 0 ? 1 : 0), sombra));
    R(-5, top, 11, 7, color); R(-5, top + 6, 11, 1, sombra);
    const brazo = (lado, pose) => {
      const bx = lado < 0 ? -7 : 6;
      if (pose === 'abajo') R(bx, top + 4, 2, 2, color);
      else if (pose === 'medio') R(bx, top + 3, 2, 2, color);
      else if (pose === 'arriba') R(bx, top - 2, 2, 5, color);
      else if (pose === 'frente') R(lado < 0 ? -4 : 3, top + 4, 2, 2, sombra);
      else if (pose === 'largo') R(lado < 0 ? -5 - alcance : 6, top + 4 + teclea, alcance, 2, color);
    };
    brazo(-1, bI); brazo(1, bD);
    if (ropa && ropaAntes) ropa(top);
    const m = mira, ey = top + 2;
    if (ojos === 'a') { R(-3 + m, ey, 1, 2, NEGRO); R(2 + m, ey, 1, 2, NEGRO); }
    else if (ojos === 'g') { R(-4 + m, ey - 1, 2, 3, NEGRO); R(2 + m, ey - 1, 2, 3, NEGRO); }
    else if (ojos === 'c') { R(-4 + m, ey + 1, 2, 1, NEGRO); R(2 + m, ey + 1, 2, 1, NEGRO); }
    else if (ojos === 'm') { R(-3 + m, ey + 1, 1, 2, NEGRO); R(2 + m, ey + 1, 1, 2, NEGRO); }
    else if (ojos === 'f' || ojos === 'w') {
      if (ojos === 'w') R(-3 + m, ey, 1, 2, NEGRO); else { P(-4 + m, ey + 1, NEGRO); P(-3 + m, ey, NEGRO); P(-2 + m, ey + 1, NEGRO); }
      P(1 + m, ey + 1, NEGRO); P(2 + m, ey, NEGRO); P(3 + m, ey + 1, NEGRO);
    }
    if (ropa && !ropaAntes) ropa(top);
  }, k);
  return { top: y + top * k };
}
// gorro con borla (de dormir, de Papá Noel): se apoya en la cabeza y la punta cae a un lado
const gorro = (top, a, b, t = 0, lado = 1) => {
  R(-5, top - 2, 11, 2, BLANCO); R(-4, top - 4, 9, 2, a); R(-3, top - 6, 7, 2, b); R(-2 + lado, top - 8, 5, 2, a); R(-1 + lado * 3, top - 9, 4, 2, b);
  R(lado * (6 + Math.round(Math.sin(t * 3))), top - 8 + Math.round(Math.abs(Math.sin(t * 3))), 3, 3, BLANCO);
};
const bufanda = (top, t = 0) => {
  const rojo = '#c93a3a', clar = '#f0e6d8';
  R(-5, top + 5, 11, 2, rojo); for (let i = 0; i < 11; i += 3) R(-5 + i, top + 5, 1, 2, clar);
  const v = Math.round(Math.sin(t * 5)); R(3, top + 7, 2, 2 + v, rojo); R(3, top + 8 + v, 2, 1, clar);
};
const gorroLana = (top, t = 0) => {
  R(-5, top - 1, 11, 2, '#5a82c8'); R(-4, top - 3, 9, 2, '#3f63ad'); R(-3, top - 4, 7, 1, '#3f63ad');
  for (let i = 0; i < 11; i += 2) P(-5 + i, top, '#7ea0e0');
  R(-1, top - 7 + Math.round(Math.sin(t * 4) * 0.5), 3, 3, BLANCO);
};
const orejasConejo = (top, t = 0, atento = 0) => {
  const m = Math.round(Math.sin(t * 6) * atento);
  for (const s of [-1, 1]) {
    const ex = s * 3 - 1;
    R(ex, top - 8, 3, 8, BLANCO); R(ex + 1, top - 7, 1, 6, '#f2a3b8');
    const q = s > 0 ? m : -m; R(ex + q, top - 11, 3, 3, BLANCO); P(ex + 1 + q, top - 10, '#f2a3b8');
  }
  R(-1, top + 4, 3, 1, '#e58aa0'); P(0, top + 5, '#e58aa0');
  for (const s of [-1, 1]) { R(s * 4, top + 4, s * 3, 1, '#e6d9c8'); R(s * 4, top + 6, s * 3, 1, '#e6d9c8'); }
};
const barbaNoel = top => { R(-4, top + 4, 9, 2, BLANCO); R(-3, top + 6, 7, 1, BLANCO); R(-5, top + 6, 1, 1, '#e8e0cf'); R(5, top + 6, 1, 1, '#e8e0cf'); };

// ---------------------------------------------------------------- la terminal de Claude Code (la pantalla y el fondo de todas las escenas)
// En reposo es una ventana de terminal con la bienvenida de Claude Code. Al pulsar el iconito de Clawd salta fuera de la cabecera, se limpia la
// pantalla, se teclea un mensaje y se pulsa Enter; entonces hace su animación sobre la caja de entrada (el suelo, o el tejado en Navidad).
const INTRO = 3.6, GY = 56;                                            // GY: el suelo de Clawd, justo encima de la línea de arriba de la caja
const FONDO = '#0c0c0c', BARRA = '#2b2b2b', GRIS = '#9a9a9a', TENUE = '#5a5a5a', BLANQ = '#ececec', AMARILLO = '#e0b020';
// La pantalla del monitor es un escritorio (SW x SH) con la ventana de la terminal (W x H) en el centro, un pelín inclinada (INCLINACION, en radianes).
export const SW = 192, SH = 117, INCLINACION = -0.05, CENTRO = [96, 54];
export function componer(sctx, ventana) {
  g = sctx; g.globalAlpha = 1;
  const cols = ['#0b1f4a', '#0e2a5e', '#123674', '#174289', '#1c4e9c', '#2159ad']; cols.forEach((c, i) => R(0, i * (SH - 7) / 6, SW, Math.ceil((SH - 7) / 6) + 1, c));
  for (let i = 0; i < 40; i++) { const x = rnd(i) * SW, y = rnd(i + 3) * (SH - 8); alfa(0.25); P(x, y, '#9fc4ff'); } alfa(1);
  R(0, SH - 7, SW, 7, '#12131a'); for (let i = 0; i < 5; i++) R(SW / 2 - 18 + i * 8, SH - 5, 5, 4, i === 2 ? '#2fd06a' : '#5a5f78');
  R(SW - 30, SH - 5, 12, 1, '#7d829c'); R(SW - 30, SH - 3, 8, 1, '#7d829c');
  g.save(); g.translate(CENTRO[0], CENTRO[1]); g.rotate(INCLINACION);
  alfa(0.35); R(-W / 2 + 3, -H / 2 + 4, W, H, '#000'); alfa(1);                  // sombra de la ventana
  g.imageSmoothingEnabled = false; g.drawImage(ventana, -W / 2, -H / 2);
  g.restore();
}
// ¿el punto (u, v) de la textura de la pantalla cae sobre el iconito de Clawd de la ventana?
export function sobreIcono(u, v) {
  const dx = u * SW - CENTRO[0], dy = v * SH - CENTRO[1], c = Math.cos(INCLINACION), sn = Math.sin(INCLINACION);
  const x = dx * c + dy * sn + W / 2, y = -dx * sn + dy * c + H / 2;
  return x > 1 && x < 27 && y > 10 && y < 36;
}
function marco() {
  R(0, 0, W, H, FONDO); R(0, 0, W, 7, BARRA); R(1, 1, 62, 6, FONDO);
  R(4, 2, 3, 3, '#2fd06a'); texto('CLAUDE CODE', 10, 1, BLANQ); texto('X', 54, 1, GRIS); texto('+', 68, 1, GRIS);
  R(104, 3, 4, 1, GRIS); R(112, 1, 4, 4, GRIS); R(113, 2, 2, 2, BARRA); texto('X', 120, 1, GRIS);
}
function cabecera(y, conIcono) {
  if (conIcono) clawd(12, y + 22, { k: 1, mira: 0 });
  texto('CLAUDE CODE', 28, y + 9, BLANQ); texto('V2.1.304', 74, y + 9, GRIS);
  texto('SONNET 5.5 · CLAUDE MAX', 28, y + 15, GRIS); texto('C:\\USERS\\JAVIER', 28, y + 21, GRIS);
  R(2, y + 28, 1, 5, GRIS); texto('USING SONNET 5.5 · /MODEL', 7, y + 28, GRIS);
}
function caja(texto1, colorTexto) {
  R(0, GY + 2, W, 1, TENUE); R(0, GY + 12, W, 1, TENUE);
  texto('>', 2, GY + 5, BLANQ); if (texto1) texto(texto1, 9, GY + 5, colorTexto);
}
export function pintarReposo(ctx2d, c = {}) {
  g = ctx2d; g.globalAlpha = 1; marco(); cabecera(8, true);
  disco(66, GY - 3, 2.4, GRIS); R(63, GY - 6, 3, 7, FONDO); texto('MEDIUM · /EFFORT', 72, GY - 5, GRIS);
  caja('TRY "HOW DO I LOG AN ERROR?"', TENUE);
  texto('>>', 2, GY + 14, AMARILLO); texto('AUTO MODE ON (SHIFT+TAB)', 12, GY + 14, AMARILLO);
}
// la sesión: Clawd sale de la cabecera de un salto, se limpia la pantalla, se teclea el mensaje y Enter
function terminal(t, prompt, nevado, c, inicio) {
  marco();
  const salto = 0.9, limpia = 1.5, entra = 3.0;
  g.save(); g.beginPath(); g.rect(0, 7, W, H); g.clip();
  if (t < salto) cabecera(8, false);
  else if (t < limpia) cabecera(8 - Math.round((t - salto) / (limpia - salto) * 40), false);
  g.restore();
  if (t >= entra + 0.4) { texto('>', 2, 10, GRIS); texto(prompt, 8, 10, BLANQ); }
  if (nevado && t >= INTRO) R(0, GY + 1, W, 2, '#eaf1fb');
  const typed = t < entra ? clamp(Math.floor((t - limpia) * 12), 0, prompt.length) : 0;
  caja(t < entra && t >= limpia ? prompt.slice(0, typed) : '', BLANQ);
  if (t >= limpia && t < entra && (Math.floor(t * 2) % 2 === 0 || typed < prompt.length)) R(9 + (typed ? anchoTexto(prompt.slice(0, typed)) + 2 : 0), GY + 4, 2, 7, '#d77757');
  else if (t >= entra && Math.floor(t * 2) % 2 === 0) R(9, GY + 4, 2, 7, '#d77757');
  const sy = GY + 14;
  if (t < entra + 0.4) { texto('>>', 2, sy, AMARILLO); texto('AUTO MODE ON (SHIFT+TAB)', 12, sy, AMARILLO); }
  else {
    const f = Math.floor(t * 6) % 2, ro = '#d77757';
    if (f) { R(2, sy + 2, 5, 1, ro); R(4, sy, 1, 5, ro); } else { P(2, sy, ro); P(6, sy, ro); P(4, sy + 2, ro); P(2, sy + 4, ro); P(6, sy + 4, ro); }
    texto(c.en ? 'THINKING...' : 'PENSANDO...', 10, sy, ro);
  }
  // Clawd salta a su sitio y espera ahí hasta que empieza la animación (entonces la escena toma el relevo)
  if (t < INTRO - 0.15) {
    if (t < salto) { const u = t / salto; clawd(mezcla(12, inicio, suave(u)), mezcla(30, GY, suave(u)) - Math.sin(u * Math.PI) * 22, { k: 1, ojos: 'g', bI: 'arriba', bD: 'arriba' }); }
    else { const u = (t - salto) / (INTRO - salto); clawd(inicio, GY, { ojos: u > 0.5 ? 'a' : 'f', mira: 1, agacha: t < salto + 0.15 ? 1 : 0 }); }
  } else if (t < INTRO) for (let i = 0; i < 6; i++) chispa(inicio - 14 + i * 6, GY - 14 - (i % 2) * 6, ['#ffd479', '#ffffff', '#f2a3b8'][i % 3]);
}

// ---------------------------------------------------------------- escenas (Clawd sobre la caja: el suelo es GY)
function saludo(t, c) {
  let dy = 0, agacha = 0, ojos = 'a', mira = 0, bI = 'abajo', bD = 'abajo';
  if (t < 1.6) { mira = t < 0.8 ? -1 : 1; ojos = (t % 1.4) > 1.3 ? 'c' : 'a'; }
  else if (t < 2.2) { ojos = 'g'; dy = -Math.abs(Math.sin((t - 1.6) / 0.6 * Math.PI)) * 5; bI = bD = 'medio'; }
  else if (t < 5.4) { const u = (t - 2.2) % 1.0, salto = Math.sin(u * Math.PI); dy = -salto * 22; agacha = u < 0.12 || u > 0.9 ? 1 : 0; ojos = 'f'; bI = bD = salto > 0.1 ? 'arriba' : 'medio'; }
  else if (t < 8.2) { ojos = 'f'; bD = Math.floor(t * 4) % 2 ? 'arriba' : 'medio'; }
  else ojos = 'f';
  const x = 64, c0 = clawd(x, GY + dy, { ojos, mira, bI, bD, agacha });
  if (t >= 1.6 && t < 2.8) { R(x - 1, c0.top - 12, 3, 7, '#ffd479'); R(x - 1, c0.top - 3, 3, 3, '#ffd479'); }
  if (t >= 5.4 && t < 8.4) bocadillo(x + 16, c0.top - 15, c.en ? 'HI!' : 'HOLA!', -1);
  if (t >= 2.4 && t < 8.6) for (let i = 0; i < 4; i++) { const f = (t * 0.6 + i / 4) % 1; alfa(Math.sin(f * Math.PI)); corazon(x - 44 + i * 29 + Math.sin(t * 3 + i) * 3, 52 - f * 34); }
  alfa(1);
  if (t >= 2.2 && t < 5.4) for (let i = 0; i < 6; i++) { const f = (t * 1.5 + i / 6) % 1; alfa(1 - f); chispa(x - 40 + i * 16, 26 + rnd(i) * 10 - f * 8, ['#ffd479', '#6fd0c0', '#f2a3b8'][i % 3]); } alfa(1);
}

function dormir(t) {
  R(2, 34, 6, 22, '#5b3d2a'); R(4, 36, 2, 18, '#6e4a33'); R(120, 46, 6, 10, '#5b3d2a'); R(8, 52, 112, 4, '#5b3d2a'); R(8, 52, 112, 1, '#7a5238');
  R(10, 42, 36, 10, BLANCO); R(12, 40, 32, 2, BLANCO); R(14, 39, 24, 1, '#e9e4f2'); R(10, 50, 36, 2, '#cfc8dc'); P(10, 42, FONDO); P(45, 42, FONDO);
  const resp = Math.sin(t * 1.75) > 0.15 ? 1 : 0;
  clawd(28, 52 - resp, { ojos: 'c', ropa: top => gorro(top, '#4e6fd1', '#6f8de3', t, 1) });
  R(10, 47 - resp, 108, 9, '#3f5aa8'); for (let i = 0; i < 108; i += 12) R(16 + i, 50 - resp, 6, 6, '#4a67bb');
  R(10, 47 - resp, 108, 3, '#e8e4f4'); R(10, 49 - resp, 108, 1, '#bdb6d6');
  for (let i = 0; i < 3; i++) {
    const f = (t / 3.4 + i / 3) % 1, zx = 48 + f * 16 + i * 3, zy = 36 - f * 24, k = f < 0.5 ? 1 : 2;
    alfa(Math.sin(f * Math.PI)); texto('Z', zx, zy, '#e8eeff', k); alfa(1);
  }
}

// Clawd «trabajando»: el GIF de Tenor (claude-claude-code) reproducido celda a celda a 10 fotogramas por segundo, como el original:
// de frente, gira a tres cuartos, aparece el portátil en perfil, teclea y vuelve a ponerse de frente. Cada celda del GIF son 2 x 2 píxeles.
function trabajar(t) {
  const f = FRAMES_TRABAJO[Math.floor(t * 1000 / MS_TRABAJO) % FRAMES_TRABAJO.length].split('/'), x0 = 64 - COLS_TRABAJO, y0 = GY - FILAS_TRABAJO * 2;
  for (let r = 0; r < f.length; r++) for (let c = 0; c < f[r].length; c++) { const k = +f[r][c]; if (k) R(x0 + c * 2, y0 + r * 2, 2, 2, PALETA_TRABAJO[k]); }
}

function cafe(t) {
  const ciclo = t % 5, sorbo = ciclo > 2.2 && ciclo < 4.0, u = sorbo ? Math.sin((ciclo - 2.2) / 1.8 * Math.PI) : 0, sube = u > 0.5 ? 1 : 0;
  const ropa = top => {
    const ty = top + 4 - sube;
    R(1, ty, 6, 6, '#4a78c8'); R(1, ty, 6, 1, '#f4f1ea'); R(2, ty + 1, 4, 1, '#5a3418'); R(1, ty + 5, 6, 1, '#365ea3'); R(2, ty + 3, 4, 1, '#7aa0e0');
    R(7, ty + 1, 1, 4, '#4a78c8'); R(8, ty + 2, 1, 2, '#4a78c8');
    R(6, ty + 2, 2, 2, NARANJA); R(-1, ty + 3, 2, 2, NARANJA);
  };
  const c0 = clawd(60, GY, { ojos: u > 0.5 ? 'f' : (t % 4 > 3.85 ? 'c' : 'a'), ropa });
  if (!sube) for (let i = 0; i < 3; i++) { const f = (t * 0.55 + i / 3) % 1; alfa(Math.sin(f * Math.PI) * 0.9); R(64 + i * 4 + Math.round(Math.sin(t * 2.5 + i * 2) * 1.5), c0.top + 6 - f * 22, 1, 3, '#e6e8f0'); }
  alfa(1);
  if (sube) corazon(76, c0.top - 6 - (u - 0.5) * 8, '#f2a3b8');
}

function bolaNieve(cx, cy, r) { disco(cx, cy, r, '#eaf1fb'); disco(cx + r * 0.2, cy + r * 0.25, r * 0.78, '#cfdcf0'); disco(cx - r * 0.18, cy - r * 0.2, r * 0.6, '#f8fbff'); if (r > 4) P(cx - r * 0.45, cy - r * 0.5, '#fff'); }
function nieve(t) {
  const SX = 100, rb = 9, rm = 6, rh = 4.5, cyb = GY - rb, cym = GY - 2 * rb - rm + 3, cyh = GY - 2 * rb - 2 * rm - rh + 5;
  let cx = 30, ojos = 'a', mira = 1, bI = 'abajo', bD = 'abajo', agacha = 0, anda = Math.floor(t * 6) % 2, dy = 0;
  const bola = (x0, x1, r0, r1, u) => ({ x: mezcla(x0, x1, u), r: mezcla(r0, r1, u) });
  const rueda = b => { bolaNieve(b.x, GY - b.r, b.r); cx = Math.max(13, b.x - b.r - 14); bI = bD = 'frente'; };
  const sube = (x0, y0, x1, y1, r, u) => { const v = suave(u); bolaNieve(mezcla(x0, x1, v), mezcla(y0, y1, v) - Math.sin(v * Math.PI) * 10, r); dy = -Math.sin(v * Math.PI) * 6; bI = bD = 'arriba'; anda = -1; cx = x0 - r - 8 + v * 6; };
  if (t < 3.5) rueda(bola(22, SX, 3, rb, t / 3.5));
  else if (t < 6.5) { bolaNieve(SX, cyb, rb); rueda(bola(22, SX - 22, 3, rm, (t - 3.5) / 3)); }
  else if (t < 7.5) { bolaNieve(SX, cyb, rb); sube(SX - 22, GY - rm, SX, cym, rm, t - 6.5); }
  else if (t < 9.5) { bolaNieve(SX, cyb, rb); bolaNieve(SX, cym, rm); rueda(bola(22, SX - 20, 3, rh, (t - 7.5) / 2)); }
  else if (t < 10.4) { bolaNieve(SX, cyb, rb); bolaNieve(SX, cym, rm); sube(SX - 20, GY - rh, SX, cyh, rh, (t - 9.5) / 0.9); }
  else {
    bolaNieve(SX, cyb, rb); bolaNieve(SX, cym, rm); bolaNieve(SX, cyh, rh);
    const u = t - 10.4;
    if (u > 0.3) { R(SX - 2, cyh - 2, 2, 2, '#222'); R(SX + 1, cyh - 2, 2, 2, '#222'); }
    if (u > 0.8) { R(SX, cyh + 1, 5, 2, '#f08a2a'); R(SX + 5, cyh + 1, 1, 1, '#d86a10'); chispa(SX + 8, cyh - 4, '#ffffff'); }
    if (u > 1.3) { R(SX - 1, cym - 2, 2, 2, '#222'); R(SX - 1, cym + 1, 2, 2, '#222'); R(SX - 1, cym + 4, 2, 2, '#222'); }
    if (u > 1.8) { linea(SX - 6, cym, SX - 14, cym - 5, '#8a6a4a'); linea(SX + 6, cym, SX + 14, cym - 5, '#8a6a4a'); linea(SX - 11, cym - 3, SX - 12, cym - 7, '#8a6a4a'); linea(SX + 11, cym - 3, SX + 12, cym - 7, '#8a6a4a'); }
    if (u > 2.3) { R(SX - 4, cyh + 4, 9, 2, '#c93a3a'); R(SX + 2, cyh + 6, 3, 4, '#c93a3a'); }
    cx = SX - 30; anda = -1; mira = 1;
    if (u > 2.4) { const k = (u - 2.4) % 1.0, s = Math.sin(k * Math.PI); dy = -s * 12; agacha = k < 0.1 || k > 0.92 ? 1 : 0; ojos = 'f'; bI = bD = s > 0.1 ? 'arriba' : 'medio'; }
    if (u > 3.0) for (let i = 0; i < 3; i++) { const f = (t * 0.6 + i / 3) % 1; alfa(Math.sin(f * Math.PI)); corazon(SX - 40 + i * 14, cyh - 6 - f * 12, '#e8505b'); } alfa(1);
  }
  if (t < 10.4) ojos = (t % 3 > 2.9) ? 'c' : 'a';
  clawd(cx, GY + dy, { ojos, mira, bI, bD, agacha, anda, ropa: top => { bufanda(top, t); gorroLana(top, t); } });
  for (let i = 0; i < 34; i++) { const x = (rnd(i) * W + t * (3 + rnd(i + 5) * 4) + Math.sin(t + i) * 3) % W, y = (rnd(i + 2) * 58 + t * (9 + rnd(i + 7) * 9)) % 58; P(x, y, '#ffffff'); if (i % 5 === 0) P(x + 1, y, '#dfe9ff'); }
}

function pascua(t) {
  const BX = [46, 86, 118], PARADAS = [20, 60, 92];
  const arbusto = (cx, sacude) => { const s = sacude ? (Math.floor(t * 14) % 2 ? 1 : -1) : 0; R(cx - 13 + s, 40, 26, 16, '#2f7a3c'); R(cx - 9 + s, 35, 18, 6, '#388a46'); R(cx - 13 + s, 48, 26, 8, '#276a33'); for (let k = 0; k < 6; k++) P(cx - 10 + k * 4 + s, 37 + (k % 2) * 8, '#52a85c'); };
  const huevo = (x, y, c1, c2) => { R(x - 1, y, 5, 5, c1); R(x, y - 1, 3, 1, c1); R(x, y + 5, 3, 1, c1); R(x - 1, y + 2, 5, 1, c2); P(x, y + 1, c2); P(x + 2, y + 3, c2); };
  let x = 12, ojos = 'a', mira = 1, bI = 'abajo', bD = 'abajo', agacha = 0, dy = 0, mov = 0, eggs = 0, sacude = [0, 0, 0], q = null, huevo1 = 0, huevo2 = 0, conf = false;
  const salta = (u, x0, x1) => { x = mezcla(x0, x1, suave(u)); const h = Math.sin(((u * 3) % 1) * Math.PI); dy = -h * 7; agacha = h < 0.1 ? 1 : 0; mov = 1; };
  if (t < 2) salta(t / 2, 12, PARADAS[0]);
  else if (t < 3.5) { x = PARADAS[0]; ojos = 'm'; mov = 1; sacude[0] = (t % 0.5) < 0.25 ? 1 : 0; q = '?'; }
  else if (t < 5.5) salta((t - 3.5) / 2, PARADAS[0], PARADAS[1]);
  else if (t < 7) { x = PARADAS[1]; ojos = 'm'; mov = 1; sacude[1] = 1; if (t > 6.2) { huevo1 = (t - 6.2) / 0.8; q = '!'; ojos = 'g'; } }
  else if (t < 8.5) { x = PARADAS[1]; huevo1 = 1; const u = (t - 7) / 1.5; ojos = 'f'; bI = bD = 'arriba'; dy = -Math.abs(Math.sin(u * Math.PI * 2)) * 8; if (u > 0.5) { eggs = 1; huevo1 = 0; } }
  else if (t < 10.5) { eggs = 1; salta((t - 8.5) / 2, PARADAS[1], PARADAS[2]); }
  else if (t < 12) { eggs = 1; x = PARADAS[2]; ojos = 'm'; mov = 1; sacude[2] = 1; if (t > 11.1) { huevo2 = (t - 11.1) / 0.8; q = '!'; ojos = 'g'; } }
  else { eggs = t > 13 ? 2 : 1; x = PARADAS[2]; ojos = 'f'; conf = true; const u = (t - 12) % 1; dy = -Math.sin(u * Math.PI) * 11; bI = bD = dy < -1 ? 'arriba' : 'medio'; if (t < 13) huevo2 = 1; }
  arbusto(BX[0], sacude[0]); arbusto(BX[1], sacude[1]); arbusto(BX[2], sacude[2]);
  if (huevo1) { huevo(BX[1] - 1, 29 - Math.round(Math.sin(clamp(huevo1) * Math.PI) * 6), '#f2a3b8', '#ffffff'); if (huevo1 > 0.5) chispa(BX[1] + 8, 28, '#fff7c2'); }
  if (huevo2) { huevo(BX[2] - 1, 29 - Math.round(Math.sin(clamp(huevo2) * Math.PI) * 6), '#ffd479', '#fff3b0'); if (huevo2 > 0.5) chispa(BX[2] + 8, 28, '#fff7c2'); }
  const t2 = t;
  clawd(x, GY + dy, { ojos, mira, bI, bD, agacha, ropa: top => {
    orejasConejo(top, t2, mov || conf ? 1 : 0.4);
    R(7, top + 5, 7, 5, '#a87a3e'); for (let k = 0; k < 7; k += 2) R(7 + k, top + 6, 1, 3, '#7a5428'); R(8, top + 2, 1, 4, '#a87a3e'); R(12, top + 2, 1, 4, '#a87a3e'); R(8, top + 2, 5, 1, '#a87a3e');
    if (eggs >= 1) { R(8, top + 3, 2, 3, '#f2a3b8'); P(8, top + 4, '#fff'); } if (eggs >= 2) { R(11, top + 3, 2, 3, '#ffd479'); P(11, top + 4, '#fff7c2'); }
  } });
  if (q) bocadillo(x + 26, 14, q, -1);
  if (conf) for (let i = 0; i < 26; i++) { const f = ((t - 12) * 0.7 + rnd(i)) % 1; P(x - 30 + rnd(i + 3) * 60 + Math.sin(t * 4 + i) * 3, 12 + f * 44, ['#f2a3b8', '#ffd479', '#6fd0c0', '#b79bff', '#fff'][i % 5]); }
}

function noel(t) {
  for (let i = 0; i < 18; i++) { const x = rnd(i) * W, y = rnd(i + 8) * 50; if (Math.sin(t * 1.7 + i * 2.3) > -0.5) P(x, y, i % 4 ? '#6f78b8' : '#ffffff'); }
  const SUELO = GY, CHX = 96, LANE = GY + 2, TOPE = 44;
  const chimenea = () => {
    R(CHX, TOPE, 28, GY - TOPE + 1, '#8a4a3a'); for (let k = 0; k < GY - TOPE; k += 4) R(CHX, TOPE + k, 28, 1, '#6a3528'); for (let k = 0; k < 28; k += 7) R(CHX + k + 3, TOPE + 2, 1, 4, '#6a3528');
    R(CHX - 3, TOPE - 4, 34, 4, '#9a5a48'); R(CHX - 3, TOPE - 5, 34, 1, '#f4f8ff'); R(CHX + 1, TOPE - 4, 26, 1, '#1a1014');
  };
  const vuelo = clamp(t / 4.2), aterr = suave(clamp((t - 3.4) / 1.6));
  const sx = mezcla(-84, 6, suave(vuelo)), sy = mezcla(12, SUELO, aterr) + Math.sin(t * 2.2) * (1 - aterr) * 2;
  const reno = (x, y, nariz, f) => { R(x, y - 7, 10, 4, '#8a5a3a'); R(x + 10, y - 9, 3, 3, '#8a5a3a'); P(x + 12, y - 8, NEGRO); R(x + 11, y - 12, 1, 3, '#d9c9a0'); R(x + 13, y - 11, 1, 2, '#d9c9a0'); R(x + 13, y - 8, 1, 1, nariz); R(x + 1, y - 3, 1, 3 - f, '#5e3c26'); R(x + 8, y - 3, 1, 2 + f, '#5e3c26'); R(x + 5, y - 3, 1, 3, '#5e3c26'); R(x + 3, y - 3, 1, 2 + f, '#5e3c26'); R(x - 2, y - 6, 2, 1, '#8a5a3a'); };
  const gal = aterr < 1 ? Math.floor(t * 5) % 2 : 0;
  linea(sx + 30, sy - 4, sx + 46, sy - 5, '#c9a64a'); linea(sx + 44, sy - 5, sx + 56, sy - 5, '#c9a64a');
  reno(sx + 46, sy, '#ff3b3b', gal); reno(sx + 60, sy, '#ff3b3b', 1 - gal); if (Math.sin(t * 5) > 0) P(sx + 73, sy - 8, '#ff9a9a');
  if (vuelo < 1) for (let i = 0; i < 9; i++) { const f = (t * 2 + i / 9) % 1; alfa(1 - f); chispa(sx - 4 - f * 16 + rnd(i) * 4, sy - 6 + Math.sin(i * 2 + t * 6) * 4, ['#ffe58a', '#fff', '#9fd0ff'][i % 3]); } alfa(1);
  const dibujaSaco = (x, y, k = 2) => celdas(x, y, () => { R(0, 2, 6, 5, '#b32a2e'); R(1, 0, 4, 3, '#b32a2e'); R(0, 2, 6, 1, '#e8e0cf'); R(1, -1, 3, 1, '#c9a64a'); R(0, 3, 1, 4, '#8a1c20'); R(5, 3, 1, 4, '#8a1c20'); P(3, 4, '#e0b84a'); }, k);
  const aBajo = t > 5.4;
  if (!aBajo) dibujaSaco(sx + 2, sy - 22 + Math.round(Math.sin(t * 2) * (1 - aterr)));
  let cx = sx + 24, cy = sy - 4, ojos = 'a', mira = 1, bI = 'abajo', bD = 'abajo', anda = -1, dy = 0, hundido = 0;
  if (t > 5.4) {
    const u = clamp((t - 5.4) / 1.2); cx = mezcla(sx + 24, 40, suave(u)); cy = mezcla(sy - 4, LANE, suave(u)); dy = -Math.sin(u * Math.PI) * 10; bI = bD = u < 1 ? 'arriba' : 'abajo';
    if (t > 6.6) { const w = clamp((t - 6.6) / 3.4); cx = mezcla(40, CHX - 12, w); cy = LANE; dy = 0; anda = Math.floor(t * 7) % 2; bI = 'abajo'; bD = 'frente'; }
    if (t > 10) { const j = clamp((t - 10) / 1.1); cx = mezcla(CHX - 12, CHX + 14, suave(j)); cy = mezcla(LANE, TOPE - 4, suave(j)); dy = -Math.sin(j * Math.PI) * 14; bI = bD = 'arriba'; anda = -1; }
    if (t > 11.2) { cx = CHX + 14; cy = TOPE - 4; dy = 0; ojos = t > 12 ? 'm' : 'a'; bI = bD = 'abajo'; mira = 0; }
    if (t > 12.6) { hundido = clamp((t - 12.6) / 1.2) * 30; bI = bD = 'arriba'; }
  }
  const dibujarClawd = () => {
    const ropa = top => { barbaNoel(top); gorro(top, '#c9373a', '#e04a4e', t, 1); };
    const c0 = clawd(cx, cy + dy + hundido, { ojos, mira, bI, bD, anda, color: '#c9373a', sombra: '#8f2024', ropa });
    if (aBajo) dibujaSaco(cx + 10, c0.top - 2 + (anda >= 0 ? Math.round(Math.sin(t * 14)) : 0));
  };
  if (hundido > 0) { g.save(); g.beginPath(); g.rect(0, 0, W, TOPE - 4); g.clip(); dibujarClawd(); g.restore(); } else if (t < 14) dibujarClawd();
  if (!aBajo) clawd(sx + 24, sy - 4, { ojos, mira: 1, bI: 'abajo', bD: 'arriba', color: '#c9373a', sombra: '#8f2024', ropa: top => { barbaNoel(top); gorro(top, '#c9373a', '#e04a4e', t, 1); } });
  celdas(sx, sy, () => {
    R(0, -1, 18, 1, '#d8b24c'); R(17, -2, 2, 1, '#d8b24c'); R(18, -3, 1, 1, '#d8b24c');
    R(2, -5, 15, 4, '#b82a2e'); R(2, -2, 15, 1, '#8a1c20'); R(2, -5, 15, 1, '#e0b84a'); R(0, -7, 3, 6, '#b82a2e'); R(15, -6, 3, 2, '#b82a2e'); R(0, -7, 3, 1, '#e0b84a');
  });
  chimenea();
  if (t > 13.2) { const f = clamp((t - 13.2) / 2); alfa(1 - f); disco(CHX + 14, TOPE - 6 - f * 14, 4 + f * 5, '#8a8f9c'); disco(CHX + 8, TOPE - 10 - f * 18, 3 + f * 4, '#aeb3c0'); alfa(1); }
  if (t > 13.4) bocadillo(CHX - 8, 4, 'HO HO HO', 2);
  if (t > 16) { alfa(0.5 + 0.4 * Math.sin(t * 4)); chispa(CHX + 14, TOPE - 8, '#ffe58a'); alfa(1); }
  for (let i = 0; i < 22; i++) { const x = (rnd(i) * W + t * (2 + rnd(i + 5) * 3)) % W, y = (rnd(i + 2) * 58 + t * (7 + rnd(i + 7) * 8)) % 58; P(x, y, '#ffffff'); }
}

// Clawd con cascos (la imagen de referencia): el cuerpo fino del GIF (16 celdas de ancho, ojos de 2 x 2, patas de 2) con ojos felices en forma de ⌣
// y auriculares azules (arco de 9 celdas y ventosas con escalones). Se los pone, asiente al ritmo (120 pulsos por minuto) y suelta notas.
function musica(t) {
  const AZUL = '#14407a', LUZ = '#2a62b0', K2 = 2;
  const pulso = (t * 2) % 1, compas = Math.floor(t * 2) % 4;
  const baja = t < 1.0 ? Math.round((1 - suave(t / 1.0)) * 9) : 0;          // los cascos bajan desde arriba hasta ponerse
  const dy = t < 1.2 ? 0 : (pulso < 0.22 ? (compas === 0 ? -2 : -1) : 0);
  const sacude = t > 1.2 ? (Math.floor(t * 4) % 2) : 0;
  const nota = (x, y, c) => { R(x, y + 3, 2, 2, c); R(x + 1, y, 1, 4, c); R(x + 2, y, 2, 1, c); };
  for (const lado of [-1, 1]) for (let b = 0; b < 3; b++) {                 // ecualizador a los lados, al compás
    const h = 4 + Math.round((Math.sin(t * 7 + b * 2 + lado) * 0.5 + 0.5) * 12) * (t > 1.2 ? 1 : 0);
    R(lado < 0 ? 8 + b * 5 : 105 + b * 5, GY - h, 4, h, ['#6fd0c0', '#ffd479', '#f2a3b8'][b]);
  }
  celdas(64, GY, () => {
    const piernas = 4 - dy;
    for (const c of [-8, -4, 2, 6]) R(c, -piernas, 2, piernas, NARANJA);
    const b = dy - 4;                                                       // la fila de arriba del cuerpo = b - 12 + ... (el suelo es 0)
    const top = -4 - 12 + dy;
    R(-8, top, 16, 12, NARANJA);
    R(-12, top + 7 + (sacude ? 0 : -1), 4, 4, NARANJA); R(8, top + 7 + (sacude ? -1 : 0), 4, 4, NARANJA);
    for (const x0 of [-8, 4]) { R(x0, top + 2, 1, 1, NEGRO); R(x0 + 3, top + 2, 1, 1, NEGRO); R(x0 + 1, top + 3, 2, 1, NEGRO); }   // ojos ⌣
    const q = baja;                                                         // cascos: arco y ventosas (columnas relativas al cuerpo)
    R(-4, top - 6 - q, 9, 1, AZUL); R(-6, top - 5 - q, 2, 1, AZUL); R(5, top - 5 - q, 2, 1, AZUL); R(-8, top - 4 - q, 1, 1, AZUL); R(7, top - 4 - q, 1, 1, AZUL);
    for (const [c0, dir] of [[-9, -1], [8, 1]]) {
      R(c0, top - 3 - q, 1, 10, AZUL); R(c0 + dir, top - q, 1, 7, AZUL); R(c0 + 2 * dir, top + 1 - q, 1, 5, AZUL);
      R(c0 + (dir > 0 ? 0 : 0), top - 3 - q, 1, 1, LUZ);
    }
  });
  if (t > 1.2) for (let i = 0; i < 5; i++) {                                // notas que suben de los cascos
    const f = (t * 0.45 + i / 5) % 1, lado = i % 2 ? 1 : -1;
    alfa(Math.sin(f * Math.PI)); nota(64 + lado * (24 + Math.sin(f * 6 + i) * 4) - 1, 36 - f * 24, ['#ffd479', '#6fd0c0', '#f2a3b8', '#b79bff', '#ffffff'][i]);
  }
  alfa(1);
}

const PROMPTS = { saludo: ['HOLA CLAUDE', 'HI CLAUDE'], dormir: ['BUENAS NOCHES', 'GOOD NIGHT'], trabajar: ['ARREGLA EL BUG', 'FIX THE BUG'], cafe: ['HORA DEL CAFE', 'COFFEE TIME'],
  nieve: ['HAZ UN MUNECO DE NIEVE', 'BUILD A SNOWMAN'], musica: ['PON MUSICA', 'PLAY SOME MUSIC'], pascua: ['BUSCA LOS HUEVOS', 'FIND THE EGGS'], noel: ['FELIZ NAVIDAD', 'MERRY CHRISTMAS'] };
const ANIM = { saludo: [saludo, 9], musica: [musica, 12], dormir: [dormir, 12], trabajar: [trabajar, 10], cafe: [cafe, 10], nieve: [nieve, 16], pascua: [pascua, 16], noel: [noel, 19] };
const INICIO = { musica: 64, saludo: 64, dormir: 28, trabajar: 46, cafe: 60, nieve: 22, pascua: 12, noel: 40 };
export const ESCENAS = Object.fromEntries(Object.entries(ANIM).map(([k, [fn, d]]) => [k, { dur: INTRO + d, dibujar: (t, c) => {
  terminal(t, PROMPTS[k][c.en ? 1 : 0], k === 'nieve' || k === 'noel', c, INICIO[k]);
  if (t >= INTRO) { g.save(); g.beginPath(); g.rect(0, 0, W, GY + 4); g.clip(); fn(t - INTRO, c); g.restore(); }
} }]));
export function pintar(ctx2d, nombre, t, c = {}) { g = ctx2d; g.globalAlpha = 1; ESCENAS[nombre].dibujar(t, c); g.globalAlpha = 1; }

// ---------------------------------------------------------------- qué escena sale
const pascuaDe = a => { const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4, h = Math.floor((c + 8) / 25), i = Math.floor((c - h + 1) / 3), k = (19 * b + c - e - i + 15) % 30, l = (32 + 2 * f + 2 * Math.floor(d / 4) - k - d % 4) % 7, m = Math.floor((b + 11 * k + 22 * l) / 451), mes = Math.floor((k + l - 7 * m + 114) / 31), dia = ((k + l - 7 * m + 114) % 31) + 1; return new Date(a, mes - 1, dia); };
// Qué escena sale (horario fijo): si nieva, el muñeco de nieve; el 24 de diciembre desde las 20:00, Papá Noel; el Domingo de Pascua, el conejito
// (todo el día); en un día normal, de 0 a 8 h durmiendo, de 8 a 9 el café y de 9 a 17 trabajando; el resto del tiempo, el saludo.
export function elegir({ fecha = new Date(), hora = 12, nieva = false } = {}) {
  if (nieva) return 'nieve';
  const mes = fecha.getMonth() + 1, dia = fecha.getDate();
  if (mes === 12 && dia === 24 && hora >= 20) return 'noel';
  const p = pascuaDe(fecha.getFullYear()); if (fecha.getMonth() === p.getMonth() && dia === p.getDate()) return 'pascua';
  if (hora < 8) return 'dormir';
  if (hora < 9) return 'cafe';
  if (hora < 17) return 'trabajar';
  return 'saludo';
}

// ---------------------------------------------------------------- sobre la pantalla 3D
// Pone un lienzo con textura de píxeles (sin suavizar) justo delante de la pantalla horneada y lo anima mientras dura la escena.
export function crearClawd(THREE, pantalla, { contexto, forzada = null } = {}) {
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const vent = document.createElement('canvas'); vent.width = W; vent.height = H;
  const sctx = cv.getContext('2d'), ctx2d = vent.getContext('2d'), tex = new THREE.CanvasTexture(cv);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const malla = new THREE.Mesh(pantalla.geometry, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  malla.position.copy(pantalla.position); malla.position.x += 0.0004; malla.quaternion.copy(pantalla.quaternion); malla.scale.copy(pantalla.scale);
  pantalla.parent.add(malla);
  const e = { malla, forzada, activa: null, ultima: null, veces: 0, ultimoDibujo: -1e9 };
  e.reposo = () => { pintarReposo(ctx2d, contexto()); componer(sctx, vent); tex.needsUpdate = true; };
  e.reposo();
  e.clic = now => {
    if (e.activa) return;
    const c = contexto(), nombre = e.forzada && ESCENAS[e.forzada] ? e.forzada : elegir(c);
    e.veces++; e.ultima = nombre; e.activa = { nombre, t0: now, c }; e.ultimoDibujo = -1e9;
  };
  e.actualizar = now => {                                            // devuelve true si hay que repintar la escena
    const a = e.activa; if (!a) return false;
    const t = (now - a.t0) / 1000;
    if (t >= ESCENAS[a.nombre].dur) { e.activa = null; e.reposo(); return true; }
    if (now - e.ultimoDibujo < 80) return false;                       // 12 imágenes por segundo, como los GIF
    e.ultimoDibujo = now; pintar(ctx2d, a.nombre, t, a.c); componer(sctx, vent); tex.needsUpdate = true; return true;
  };
  return e;
}
