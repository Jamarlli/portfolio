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
const FUENTE = { H: '101101111101101', O: '111101101101111', L: '100100100100111', A: '010101111101101', Z: '111001010100111', I: '111010010010111', '!': '11101', '?': '111001011000010' };
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
  const { ojos = 'a', mira = 0, bI = 'abajo', bD = 'abajo', agacha = 0, anda = -1, color = NARANJA, sombra = SOMBRA, alcance = 8, teclea = 0, ropa = null, ropaAntes = false } = o;
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
  });
  return { top: y + top * K };
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

// ---------------------------------------------------------------- escenas
function dormir(t) {
  bandas(0, 64, ['#1a1e3c', '#1c2142', '#1f2447', '#22284c']); R(0, 64, W, 14, '#2c2230');
  // ventana con luna y estrellas
  R(84, 6, 36, 30, '#6a5a4c'); R(86, 8, 32, 26, '#0e1736'); R(101, 8, 2, 26, '#6a5a4c'); R(86, 20, 32, 2, '#6a5a4c');
  disco(111, 15, 5, '#f3e9b8'); disco(113, 14, 4.4, '#0e1736');
  for (let i = 0; i < 7; i++) { const x = 88 + Math.floor(rnd(i) * 28), y = 10 + Math.floor(rnd(i + 9) * 22); if ((x > 100 && x < 104) || (y > 19 && y < 23)) continue; if (Math.sin(t * 2 + i * 2) > -0.4) P(x, y, '#cfd8ff'); }
  // cama: cabecero, pies, colchón con su canto y patas
  R(2, 28, 6, 42, '#5b3d2a'); R(4, 30, 2, 38, '#6e4a33'); R(120, 46, 6, 24, '#5b3d2a'); R(8, 62, 112, 8, '#5b3d2a'); R(8, 62, 112, 1, '#7a5238'); R(8, 70, 4, 6, '#4a301f'); R(116, 70, 4, 6, '#4a301f');
  R(10, 40, 36, 14, BLANCO); R(12, 38, 32, 2, BLANCO); R(14, 37, 24, 1, '#e9e4f2'); R(10, 52, 36, 2, '#cfc8dc'); R(10, 40, 2, 1, '#22284c'); R(44, 40, 2, 1, '#22284c');
  const resp = Math.sin(t * 1.75) > 0.15 ? 1 : 0;
  clawd(28, 56 - resp, { ojos: 'c', ropa: top => gorro(top, '#4e6fd1', '#6f8de3', t, 1) });
  // manta con el embozo
  R(10, 46 - resp, 108, 18, '#3f5aa8'); for (let i = 0; i < 108; i += 12) R(16 + i, 50 - resp, 6, 14, '#4a67bb');
  R(10, 46 - resp, 108, 4, '#e8e4f4'); R(10, 49 - resp, 108, 1, '#bdb6d6');
  // zzz: cada una crece un poco al subir
  for (let i = 0; i < 3; i++) {
    const f = (t / 3.4 + i / 3) % 1, zx = 46 + f * 16 + i * 3, zy = 34 - f * 24, k = f < 0.5 ? 1 : 2;
    alfa(Math.sin(f * Math.PI)); texto('Z', zx, zy, '#e8eeff', k); alfa(1);
  }
}

function trabajar(t) {
  bandas(0, 58, ['#1b1e30', '#1d2134', '#202437', '#23283c']); R(0, 58, W, 20, '#6a4a34'); R(0, 58, W, 2, '#85604a'); R(0, 66, W, 12, '#4f3626');
  for (let i = 0; i < 12; i++) P(6 + i * 11 + (i * 7) % 5, 6 + (i * 5) % 22, Math.sin(t * 2 + i) > -0.3 ? '#3c4468' : '#2c3252');
  // taza con vaho
  celdas(8, 58, () => { R(0, -5, 5, 5, '#f1ece0'); R(5, -4, 1, 3, '#f1ece0'); R(0, -5, 5, 1, '#6b4426'); R(0, -2, 5, 1, '#d77757'); });
  for (let i = 0; i < 2; i++) { const f = (t * 0.6 + i * 0.5) % 1; alfa(1 - f); R(11 + i * 3 + Math.round(Math.sin(t * 3 + i)), 44 - f * 10, 1, 2, '#c8d0e8'); alfa(1); }
  // portátil de perfil (la pantalla mira a Clawd): base gruesa y tapa inclinada hacia atrás
  R(66, 54, 44, 4, '#8f939d'); R(66, 54, 44, 1, '#c0c4cc'); R(66, 57, 44, 1, '#5d616b'); R(70, 52, 30, 2, '#6a6e78');
  for (let k = 0; k < 4; k++) linea(104 + k, 54, 114 + k, 12, k < 2 ? '#a9adb6' : '#7d818b');
  for (let k = 0; k < 2; k++) linea(102 - k, 54, 112 - k, 13, '#9cc8ff');
  for (let k = 0; k < 4; k++) { alfa(0.10 - k * 0.02); linea(98 - k * 3, 54, 108 - k * 3, 13, '#9cc8ff'); linea(97 - k * 3, 54, 107 - k * 3, 13, '#9cc8ff'); } alfa(1);
  const cols = ['#d77757', '#6fd0c0', '#b79bff', '#ffd479'];
  for (let i = 0; i < 7; i++) { const f = (t * 0.45 + i / 7) % 1; alfa(Math.sin(f * Math.PI)); R(100 - f * 44, 46 - f * 26 + Math.sin(i * 3) * 4, 3 + (i % 2) * 3, 1, cols[i % 4]); }
  alfa(1);
  const pulsa = Math.floor(t * 6) % 2, parpadeo = (t % 3.2) > 3.05;
  const c = clawd(46, 58, { ojos: parpadeo ? 'c' : 'a', mira: 1, bD: 'largo', alcance: 4, teclea: pulsa ? 0 : 1 });
  for (let i = 0; i < 3; i++) R(32 + i * 6, c.top - 10, 3, 3, Math.floor(t * 3) % 3 === i ? '#ffd479' : '#5a5f7e');
  // la chispa de Claude Code, que gira como el spinner
  const sx = 70, sy = c.top - 7, ro = '#d77757';
  if (Math.floor(t * 6) % 2) { R(sx - 3, sy, 7, 1, ro); R(sx, sy - 3, 1, 7, ro); } else { for (let k = -2; k <= 2; k++) { P(sx + k, sy + k, ro); P(sx + k, sy - k, ro); } }
}

function saludo(t, c) {
  bandas(0, 66, ['#2a2d52', '#32355c', '#3b3d66', '#454570']); R(0, 66, W, 12, '#241f3a'); R(0, 66, W, 1, '#38325a');
  for (let i = 0; i < 14; i++) { const x = rnd(i) * W, y = rnd(i + 4) * 60; if (Math.sin(t * 2 + i) > 0) P(x, y, '#7f86c6'); }
  const y0 = 68; let dy = 0, agacha = 0, ojos = 'a', mira = 0, bI = 'abajo', bD = 'abajo';
  if (t < 1.6) { mira = t < 0.8 ? -1 : 1; ojos = (t % 1.4) > 1.3 ? 'c' : 'a'; }
  else if (t < 2.2) { ojos = 'g'; dy = -Math.abs(Math.sin((t - 1.6) / 0.6 * Math.PI)) * 6; bI = bD = 'medio'; }
  else if (t < 5.4) { const u = (t - 2.2) % 1.0, salto = Math.sin(u * Math.PI); dy = -salto * 22; agacha = u < 0.12 || u > 0.9 ? 1 : 0; ojos = 'f'; bI = bD = salto > 0.1 ? 'arriba' : 'medio'; }
  else if (t < 8.2) { ojos = 'f'; bD = Math.floor(t * 4) % 2 ? 'arriba' : 'medio'; }
  else ojos = 'f';
  const x = 64;
  alfa(0.35); R(x - 12 + (dy < -4 ? 2 : 0), y0 + 1, 24 - (dy < -4 ? 4 : 0), 2, '#000'); alfa(1);
  const c0 = clawd(x, y0 + dy, { ojos, mira, bI, bD, agacha });
  if (t >= 1.6 && t < 2.8) { R(x - 1, c0.top - 12, 3, 7, '#ffd479'); R(x - 1, c0.top - 3, 3, 3, '#ffd479'); }
  if (t >= 5.4 && t < 8.4) bocadillo(x + 14, c0.top - 15, c.en ? 'HI!' : 'HOLA!', -1);
  if (t >= 2.4 && t < 8.6) for (let i = 0; i < 4; i++) { const f = (t * 0.6 + i / 4) % 1; alfa(Math.sin(f * Math.PI)); corazon(x - 44 + i * 29 + Math.sin(t * 3 + i) * 3, 58 - f * 40); }
  alfa(1);
  if (t >= 2.2 && t < 5.4) for (let i = 0; i < 6; i++) { const f = (t * 1.5 + i / 6) % 1; alfa(1 - f); chispa(x - 40 + i * 16, 30 + rnd(i) * 12 - f * 8, ['#ffd479', '#6fd0c0', '#f2a3b8'][i % 3]); } alfa(1);
}

function cafe(t, c) {
  bandas(0, 56, ['#4d3428', '#4a3226', '#472f24', '#442c22']);
  R(8, 8, 36, 32, '#2e1f17'); R(10, 10, 32, 28, c.llueve ? '#5d6f86' : '#e7a96f'); if (!c.llueve) { R(10, 26, 32, 12, '#f2c98a'); disco(26, 30, 6, '#ffe9a8'); }
  R(25, 10, 2, 28, '#2e1f17'); R(10, 23, 32, 2, '#2e1f17');
  if (c.llueve) for (let i = 0; i < 14; i++) { const f = (t * 1.6 + rnd(i)) % 1; P(11 + Math.floor(rnd(i + 3) * 30), 10 + f * 26, '#cfe0f4'); }
  R(100, 0, 1, 12, '#2e1f17'); R(94, 12, 13, 4, '#e0a64d'); R(95, 16, 11, 1, '#fff1b8');
  alfa(0.10); disco(100, 26, 24, '#ffd479'); alfa(0.12); disco(100, 26, 14, '#ffd479'); alfa(1);
  R(62, 28, 24, 2, '#2e1f17'); R(65, 20, 5, 8, '#d77757'); R(72, 22, 5, 6, '#6fb08f'); R(79, 18, 5, 10, '#e8c372');
  R(0, 68, W, 10, '#3a261d'); R(0, 68, W, 1, '#58392b');
  R(92, 56, 32, 3, '#8a5c3c'); R(104, 59, 4, 10, '#6b452c'); R(98, 68, 16, 2, '#6b452c'); R(100, 52, 8, 4, '#f1d9a6'); R(102, 51, 4, 1, '#e0b872');    // mesita con un cruasán
  const ciclo = t % 5, sorbo = ciclo > 2.2 && ciclo < 4.0, u = sorbo ? Math.sin((ciclo - 2.2) / 1.8 * Math.PI) : 0, sube = u > 0.5 ? 1 : 0;
  const ropa = top => {
    const ty = top + 4 - sube;
    R(1, ty, 6, 6, '#4a78c8'); R(1, ty, 6, 1, '#f4f1ea'); R(2, ty + 1, 4, 1, '#5a3418'); R(1, ty + 5, 6, 1, '#365ea3'); R(2, ty + 3, 4, 1, '#7aa0e0');
    R(7, ty + 1, 1, 4, '#4a78c8'); R(8, ty + 2, 1, 2, '#4a78c8');                                           // asa
    R(6, ty - 1 + 3, 2, 2, NARANJA); R(-1, ty + 3, 2, 2, NARANJA);                                          // los brazos sujetan la taza
  };
  const c0 = clawd(54, 70, { ojos: u > 0.5 ? 'f' : (t % 4 > 3.85 ? 'c' : 'a'), bI: 'abajo', bD: 'abajo', ropa, ropaAntes: false });
  if (!sube) for (let i = 0; i < 3; i++) { const f = (t * 0.55 + i / 3) % 1; alfa(Math.sin(f * Math.PI) * 0.9); R(58 + i * 4 + Math.round(Math.sin(t * 2.5 + i * 2) * 1.5), c0.top + 6 - f * 22, 1, 3, '#e6e8f0'); }
  alfa(1);
  if (sube) corazon(70, c0.top - 6 - (u - 0.5) * 8, '#f2a3b8');
}

function bolaNieve(cx, cy, r) { disco(cx, cy, r, '#eaf1fb'); disco(cx + r * 0.2, cy + r * 0.25, r * 0.78, '#cfdcf0'); disco(cx - r * 0.18, cy - r * 0.2, r * 0.6, '#f8fbff'); if (r > 4) P(cx - r * 0.45, cy - r * 0.5, '#fff'); }
function nieve(t) {
  bandas(0, 50, ['#2c3a63', '#36456e', '#42537c', '#52628a', '#6577a0']);
  R(0, 52, W, 26, '#dde7f5'); R(0, 52, W, 1, '#f5f9ff'); R(0, 72, W, 6, '#c5d3ea'); for (let i = 0; i < 8; i++) R(i * 17 + (i % 3) * 4, 74 + (i % 2) * 2, 9, 1, '#e9f0fb');
  for (const [px, ph] of [[8, 24], [26, 16], [112, 26], [123, 15]]) { R(px, 52 - ph, 2, ph, '#4a3a2c'); for (let k = 0; k < ph - 2; k += 3) { const w = 3 + Math.floor((k / ph) * 10); R(px - w / 2 + 1, 52 - ph + k, w, 3, '#2d5a45'); R(px - w / 2 + 1, 52 - ph + k, w, 1, '#eaf1fb'); } }
  const GY = 72, SX = 98, rb = 12, rm = 8, rh = 6, cyb = GY - rb, cym = GY - 2 * rb - rm + 4, cyh = GY - 2 * rb - 2 * rm - rh + 8;
  let cx = 30, ojos = 'a', mira = 1, bI = 'abajo', bD = 'abajo', agacha = 0, anda = Math.floor(t * 6) % 2, dy = 0;
  const bola = (x0, x1, r0, r1, u) => ({ x: mezcla(x0, x1, u), r: mezcla(r0, r1, u) });
  const rueda = (b) => { bolaNieve(b.x, GY - b.r, b.r); cx = Math.max(13, b.x - b.r - 14); bI = bD = 'frente'; };
  const sube = (x0, y0, x1, y1, r, u) => { const v = suave(u); bolaNieve(mezcla(x0, x1, v), mezcla(y0, y1, v) - Math.sin(v * Math.PI) * 10, r); dy = -Math.sin(v * Math.PI) * 6; bI = bD = 'arriba'; anda = -1; cx = x0 - r - 8 + v * 6; };
  if (t < 3.5) rueda(bola(22, SX, 3, rb, t / 3.5));
  else if (t < 6.5) { bolaNieve(SX, cyb, rb); rueda(bola(22, SX - 26, 3, rm, (t - 3.5) / 3)); }
  else if (t < 7.5) { bolaNieve(SX, cyb, rb); sube(SX - 26, GY - rm, SX, cym, rm, t - 6.5); }
  else if (t < 9.5) { bolaNieve(SX, cyb, rb); bolaNieve(SX, cym, rm); rueda(bola(22, SX - 22, 3, rh, (t - 7.5) / 2)); }
  else if (t < 10.4) { bolaNieve(SX, cyb, rb); bolaNieve(SX, cym, rm); sube(SX - 22, GY - rh, SX, cyh, rh, (t - 9.5) / 0.9); }
  else {
    bolaNieve(SX, cyb, rb); bolaNieve(SX, cym, rm); bolaNieve(SX, cyh, rh);
    const u = t - 10.4;                                                         // ojos de carbón, nariz de zanahoria, botones, brazos de rama y bufanda
    if (u > 0.3) { R(SX - 3, cyh - 2, 2, 2, '#222'); R(SX + 2, cyh - 2, 2, 2, '#222'); }
    if (u > 0.8) { R(SX, cyh + 1, 6, 2, '#f08a2a'); R(SX + 6, cyh + 1, 1, 1, '#d86a10'); chispa(SX + 9, cyh - 4, '#ffffff'); }
    if (u > 1.3) { R(SX - 1, cym - 3, 2, 2, '#222'); R(SX - 1, cym + 1, 2, 2, '#222'); R(SX - 1, cym + 5, 2, 2, '#222'); }
    if (u > 1.8) { linea(SX - 8, cym, SX - 18, cym - 6, '#5b3d2a'); linea(SX + 8, cym, SX + 18, cym - 6, '#5b3d2a'); linea(SX - 14, cym - 4, SX - 15, cym - 9, '#5b3d2a'); linea(SX + 14, cym - 4, SX + 15, cym - 9, '#5b3d2a'); }
    if (u > 2.3) { R(SX - 5, cyh + 6, 11, 2, '#c93a3a'); R(SX + 2, cyh + 8, 3, 5, '#c93a3a'); }
    cx = SX - 34; anda = -1; mira = 1;
    if (u > 2.4) { const k = (u - 2.4) % 1.0, s = Math.sin(k * Math.PI); dy = -s * 12; agacha = k < 0.1 || k > 0.92 ? 1 : 0; ojos = 'f'; bI = bD = s > 0.1 ? 'arriba' : 'medio'; }
    if (u > 3.0) for (let i = 0; i < 3; i++) { const f = (t * 0.6 + i / 3) % 1; alfa(Math.sin(f * Math.PI)); corazon(SX - 40 + i * 14, cyh - 10 - f * 14, '#e8505b'); } alfa(1);
  }
  if (t < 10.4) ojos = (t % 3 > 2.9) ? 'c' : 'a';
  alfa(0.25); R(cx - 12, GY + 1, 24, 2, '#5a6f96'); alfa(1);
  clawd(cx, GY + dy, { ojos, mira, bI, bD, agacha, anda, ropa: top => { bufanda(top, t); gorroLana(top, t); } });
  for (let i = 0; i < 38; i++) { const x = (rnd(i) * W + t * (3 + rnd(i + 5) * 4) + Math.sin(t + i) * 3) % W, y = (rnd(i + 2) * H + t * (9 + rnd(i + 7) * 9)) % H; P(x, y, '#ffffff'); if (i % 5 === 0) P(x + 1, y, '#dfe9ff'); }
}

function pascua(t) {
  bandas(0, 40, ['#8ec5ea', '#a2d1ee', '#b8dcf2', '#cde8f6']);
  disco(112, 12, 7, '#fff3b0'); for (const [cx, cy, w] of [[14, 10, 16], [56, 18, 20]]) { R(cx, cy, w, 4, '#ffffff'); R(cx + 3, cy - 2, w - 6, 3, '#ffffff'); }
  R(0, 38, W, 6, '#79b45e'); R(0, 42, W, 8, '#69a752'); R(0, 48, W, 30, '#5ca045'); for (let i = 0; i < 16; i++) R(i * 9 + (i % 2) * 4, 56 + (i * 7) % 20, 6, 1, '#6fb355');
  const flores = ['#fff', '#f2a3b8', '#ffd479', '#b79bff'];
  for (let i = 0; i < 20; i++) { const x = 3 + Math.floor(rnd(i + 20) * 122), y = 52 + Math.floor(rnd(i + 40) * 24); P(x, y, flores[i % 4]); P(x, y + 1, '#3f7a30'); }
  const BX = [46, 86, 118], PARADAS = [20, 60, 92];
  const arbusto = (cx, sacude) => { const s = sacude ? (Math.floor(t * 14) % 2 ? 1 : -1) : 0; R(cx - 13 + s, 50, 26, 16, '#2f7a3c'); R(cx - 9 + s, 45, 18, 7, '#388a46'); R(cx - 13 + s, 58, 26, 8, '#276a33'); for (let k = 0; k < 6; k++) P(cx - 10 + k * 4 + s, 47 + (k % 2) * 8, '#52a85c'); };
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
  if (huevo1) { huevo(BX[1] - 1, 40 - Math.round(Math.sin(clamp(huevo1) * Math.PI) * 6), '#f2a3b8', '#ffffff'); if (huevo1 > 0.5) chispa(BX[1] + 8, 38, '#fff7c2'); }
  if (huevo2) { huevo(BX[2] - 1, 40 - Math.round(Math.sin(clamp(huevo2) * Math.PI) * 6), '#ffd479', '#fff3b0'); if (huevo2 > 0.5) chispa(BX[2] + 8, 38, '#fff7c2'); }
  alfa(0.25); R(x - 12, 74, 24, 2, '#1d4d20'); alfa(1);
  const t2 = t;
  const c0 = clawd(x, 74 + dy, { ojos, mira, bI, bD, agacha, ropa: top => {
    orejasConejo(top, t2, mov || conf ? 1 : 0.4);
    R(7, top + 5, 7, 5, '#a87a3e'); for (let k = 0; k < 7; k += 2) R(7 + k, top + 6, 1, 3, '#7a5428'); R(8, top + 2, 1, 4, '#a87a3e'); R(12, top + 2, 1, 4, '#a87a3e'); R(8, top + 2, 5, 1, '#a87a3e');
    if (eggs >= 1) { R(8, top + 3, 2, 3, '#f2a3b8'); P(8, top + 4, '#fff'); } if (eggs >= 2) { R(11, top + 3, 2, 3, '#ffd479'); P(11, top + 4, '#fff7c2'); }
  } });
  if (q) bocadillo(x + 4, Math.max(2, c0.top - 36), q, 0);
  if (conf) for (let i = 0; i < 26; i++) { const f = ((t - 12) * 0.7 + rnd(i)) % 1; P(x - 30 + rnd(i + 3) * 60 + Math.sin(t * 4 + i) * 3, 6 + f * 60, ['#f2a3b8', '#ffd479', '#6fd0c0', '#b79bff', '#fff'][i % 5]); }
}

function noel(t) {
  bandas(0, 78, ['#0c1030', '#10153a', '#151b44', '#1a214c', '#212857', '#262e60']);
  for (let i = 0; i < 26; i++) { const x = rnd(i) * W, y = rnd(i + 8) * 40; if (Math.sin(t * 1.7 + i * 2.3) > -0.5) P(x, y, i % 4 ? '#8f9ae0' : '#ffffff'); }
  disco(110, 12, 8, '#f6edc0'); disco(113, 10, 7, '#0e1236');
  // casa nevada: el borde del tejado es SUELO (ahí aterrizan el trineo y los renos); Clawd anda por delante, en LANE
  const SUELO = 62, CHX = 96, LANE = 68, TOPE = 46;
  R(22, 73, 106, 5, '#4b3a52'); R(30, 62, 98, 11, '#3a2c44'); R(24, 64, 4, 9, '#3a2c44'); R(24, 62, 104, 3, '#dfe8f6'); R(30, 61, 98, 1, '#f4f8ff');
  for (let i = 0; i < 98; i += 6) R(30 + i, 68, 5, 1, '#2d2238');
  R(36, 73, 22, 5, '#f2c66a'); R(36, 73, 22, 1, '#8a6a3a'); R(46, 73, 1, 5, '#8a6a3a');
  const chimenea = () => {
    R(CHX, TOPE, 28, LANE - TOPE, '#8a4a3a'); for (let k = 0; k < LANE - TOPE; k += 4) R(CHX, TOPE + k, 28, 1, '#6a3528'); for (let k = 0; k < 28; k += 7) for (let r = 0; r < 16; r += 8) R(CHX + k + (r / 8 % 2) * 3, TOPE + 2 + r, 1, 4, '#6a3528');
    R(CHX - 3, TOPE - 4, 34, 4, '#9a5a48'); R(CHX - 3, TOPE - 5, 34, 1, '#f4f8ff'); R(CHX + 1, TOPE - 4, 26, 1, '#1a1014');
  };
  const vuelo = clamp(t / 4.2), aterr = suave(clamp((t - 3.4) / 1.6));
  const sx = mezcla(-84, 6, suave(vuelo)), sy = mezcla(10, SUELO, aterr) + Math.sin(t * 2.2) * (1 - aterr) * 2;
  const reno = (x, y, nariz, f) => { R(x, y - 7, 10, 4, '#8a5a3a'); R(x + 10, y - 9, 3, 3, '#8a5a3a'); P(x + 12, y - 8, NEGRO); R(x + 11, y - 12, 1, 3, '#d9c9a0'); R(x + 13, y - 11, 1, 2, '#d9c9a0'); R(x + 13, y - 8, 1, 1, nariz); R(x + 1, y - 3, 1, 3 - f, '#5e3c26'); R(x + 8, y - 3, 1, 2 + f, '#5e3c26'); R(x + 5, y - 3, 1, 3, '#5e3c26'); R(x + 3, y - 3, 1, 2 + f, '#5e3c26'); R(x - 2, y - 6, 2, 1, '#8a5a3a'); };
  const gal = aterr < 1 ? Math.floor(t * 5) % 2 : 0;
  linea(sx + 30, sy - 4, sx + 46, sy - 5, '#c9a64a'); linea(sx + 44, sy - 5, sx + 56, sy - 5, '#c9a64a');
  reno(sx + 46, sy, '#ff3b3b', gal); reno(sx + 60, sy, '#ff3b3b', 1 - gal); if (Math.sin(t * 5) > 0) P(sx + 73, sy - 8, '#ff9a9a');
  if (vuelo < 1) for (let i = 0; i < 9; i++) { const f = (t * 2 + i / 9) % 1; alfa(1 - f); chispa(sx - 4 - f * 16 + rnd(i) * 4, sy - 6 + Math.sin(i * 2 + t * 6) * 4, ['#ffe58a', '#fff', '#9fd0ff'][i % 3]); } alfa(1);
  const dibujaSaco = (x, y, k = 2) => celdas(x, y, () => { R(0, 2, 6, 5, '#b32a2e'); R(1, 0, 4, 3, '#b32a2e'); R(0, 2, 6, 1, '#e8e0cf'); R(1, -1, 3, 1, '#c9a64a'); R(0, 3, 1, 4, '#8a1c20'); R(5, 3, 1, 4, '#8a1c20'); P(3, 4, '#e0b84a'); }, k);
  const aBajo = t > 5.4;
  if (!aBajo) dibujaSaco(sx + 2, sy - 22 + Math.round(Math.sin(t * 2) * (1 - aterr)));
  let cx = sx + 24, cy = sy - 4, ojos = 'a', mira = 1, bI = 'abajo', bD = 'abajo', anda = -1, dy = 0, hundido = 0, enMano = aBajo;
  if (t > 5.4) {
    const u = clamp((t - 5.4) / 1.2); cx = mezcla(sx + 24, 40, suave(u)); cy = mezcla(sy - 4, LANE, suave(u)); dy = -Math.sin(u * Math.PI) * 10; bI = bD = u < 1 ? 'arriba' : 'abajo';
    if (t > 6.6) { const w = clamp((t - 6.6) / 3.4); cx = mezcla(40, CHX - 12, w); cy = LANE; dy = 0; anda = Math.floor(t * 7) % 2; bI = 'abajo'; bD = 'frente'; }
    if (t > 10) { const j = clamp((t - 10) / 1.1); cx = mezcla(CHX - 12, CHX + 14, suave(j)); cy = mezcla(LANE, TOPE - 5, suave(j)); dy = -Math.sin(j * Math.PI) * 14; bI = bD = 'arriba'; anda = -1; }
    if (t > 11.2) { cx = CHX + 14; cy = TOPE - 5; dy = 0; ojos = t > 12 ? 'm' : 'a'; bI = bD = 'abajo'; mira = 0; }
    if (t > 12.6) { hundido = clamp((t - 12.6) / 1.2) * 30; bI = bD = 'arriba'; }
  }
  alfa(0.25); if (t < 10) R(cx - 12, cy + 1, 24, 2, '#000'); alfa(1);
  const dibujarClawd = () => {
    const ropa = top => { barbaNoel(top); gorro(top, '#c9373a', '#e04a4e', t, 1); };
    const c0 = clawd(cx, cy + dy + hundido, { ojos, mira, bI, bD, anda, color: '#c9373a', sombra: '#8f2024', ropa });
    if (enMano) dibujaSaco(cx + 10, c0.top - 2 + (anda >= 0 ? Math.round(Math.sin(t * 14)) : 0));
  };
  if (hundido > 0) { g.save(); g.beginPath(); g.rect(0, 0, W, TOPE - 4); g.clip(); dibujarClawd(); g.restore(); } else if (t < 14) dibujarClawd();
  if (!aBajo) {                                                                       // el trineo, con Clawd al mando
    const c0 = clawd(sx + 24, sy - 4, { ojos, mira: 1, bI: 'abajo', bD: 'arriba', color: '#c9373a', sombra: '#8f2024', ropa: top => { barbaNoel(top); gorro(top, '#c9373a', '#e04a4e', t, 1); } });
  }
  celdas(sx, sy, () => {
    R(0, -1, 18, 1, '#d8b24c'); R(17, -2, 2, 1, '#d8b24c'); R(18, -3, 1, 1, '#d8b24c');
    R(2, -5, 15, 4, '#b82a2e'); R(2, -2, 15, 1, '#8a1c20'); R(2, -5, 15, 1, '#e0b84a'); R(0, -7, 3, 6, '#b82a2e'); R(15, -6, 3, 2, '#b82a2e'); R(0, -7, 3, 1, '#e0b84a');
  });
  chimenea();
  if (t > 13.2) { const f = clamp((t - 13.2) / 2); alfa(1 - f); disco(CHX + 14, TOPE - 6 - f * 14, 4 + f * 5, '#8a8f9c'); disco(CHX + 8, TOPE - 10 - f * 18, 3 + f * 4, '#aeb3c0'); alfa(1); }
  if (t > 13.4) bocadillo(CHX - 8, 6, 'HO HO HO', 2);
  if (t > 16) { alfa(0.5 + 0.4 * Math.sin(t * 4)); chispa(CHX + 14, TOPE - 8, '#ffe58a'); alfa(1); }
  for (let i = 0; i < 26; i++) { const x = (rnd(i) * W + t * (2 + rnd(i + 5) * 3)) % W, y = (rnd(i + 2) * H + t * (7 + rnd(i + 7) * 8)) % H; P(x, y, '#ffffff'); }
}

export const ESCENAS = {
  dormir: { dur: 12, dibujar: dormir }, trabajar: { dur: 10, dibujar: trabajar }, saludo: { dur: 9, dibujar: saludo }, cafe: { dur: 10, dibujar: cafe },
  nieve: { dur: 16, dibujar: nieve }, pascua: { dur: 16, dibujar: pascua }, noel: { dur: 19, dibujar: noel },
};
export function pintar(ctx2d, nombre, t, c = {}) { g = ctx2d; g.globalAlpha = 1; ESCENAS[nombre].dibujar(t, c); g.globalAlpha = 1; }

// ---------------------------------------------------------------- qué escena sale
const pascuaDe = a => { const b = a % 19, c = Math.floor(a / 100), d = a % 100, e = Math.floor(c / 4), f = c % 4, h = Math.floor((c + 8) / 25), i = Math.floor((c - h + 1) / 3), k = (19 * b + c - e - i + 15) % 30, l = (32 + 2 * f + 2 * Math.floor(d / 4) - k - d % 4) % 7, m = Math.floor((b + 11 * k + 22 * l) / 451), mes = Math.floor((k + l - 7 * m + 114) / 31), dia = ((k + l - 7 * m + 114) % 31) + 1; return new Date(a, mes - 1, dia); };
// pesos según la fecha (Navidad, Semana Santa), la hora, el tiempo y si es la primera vez que se pulsa
export function pesos({ fecha = new Date(), hora = 12, temp = null, llueve = false, primera = false } = {}) {
  const mes = fecha.getMonth() + 1, dia = fecha.getDate(), dow = fecha.getDay(), frio = temp != null ? temp <= 10 : (mes === 12 || mes <= 2);
  const navidad = (mes === 12 && dia >= 20) || (mes === 1 && dia <= 6), p = pascuaDe(fecha.getFullYear()), dias = Math.round((fecha - p) / 864e5), semanaSanta = dias >= -7 && dias <= 1;
  const noche = hora >= 23 || hora < 7;
  return {
    saludo: primera ? 8 : 1,
    dormir: noche ? 6 : hora >= 22 ? 2 : 0.2,
    cafe: (hora >= 6 && hora < 11 ? 4 : hora >= 15 && hora < 18 ? 3 : 0.6) + (llueve || frio ? 1.5 : 0),
    trabajar: hora >= 9 && hora < 19 && dow > 0 && dow < 6 ? 4 : 1,
    nieve: frio ? 3 : mes === 12 || mes <= 2 ? 1.5 : 0.25,
    pascua: semanaSanta ? 14 : 0,
    noel: navidad ? 14 : 0,
  };
}
export function elegir(ctx, ultima = null, azar = Math.random) {
  const p = pesos(ctx); if (ultima) p[ultima] = 0;
  const total = Object.values(p).reduce((a, b) => a + b, 0); let r = azar() * total;
  for (const k in p) { r -= p[k]; if (r <= 0) return k; }
  return 'saludo';
}

// ---------------------------------------------------------------- sobre la pantalla 3D
// Pone un lienzo con textura de píxeles (sin suavizar) justo delante de la pantalla horneada y lo anima mientras dura la escena.
export function crearClawd(THREE, pantalla, { contexto, forzada = null } = {}) {
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx2d = cv.getContext('2d'), tex = new THREE.CanvasTexture(cv);
  tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
  const malla = new THREE.Mesh(pantalla.geometry, new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  malla.position.copy(pantalla.position); malla.position.x += 0.0004; malla.quaternion.copy(pantalla.quaternion); malla.scale.copy(pantalla.scale); malla.visible = false;
  pantalla.parent.add(malla);
  const e = { malla, forzada, activa: null, ultima: null, veces: 0, ultimoDibujo: -1e9 };
  e.clic = now => {
    const c = contexto(), nombre = e.forzada && ESCENAS[e.forzada] ? e.forzada : elegir({ ...c, primera: e.veces === 0 }, e.ultima);
    e.veces++; e.ultima = nombre; e.activa = { nombre, t0: now, c }; e.ultimoDibujo = -1e9; malla.visible = true;
  };
  e.actualizar = now => {                                            // devuelve true si hay que repintar la escena
    const a = e.activa; if (!a) return false;
    const t = (now - a.t0) / 1000;
    if (t >= ESCENAS[a.nombre].dur) { e.activa = null; malla.visible = false; return true; }
    if (now - e.ultimoDibujo < 80) return false;                       // 12 imágenes por segundo, como los GIF
    e.ultimoDibujo = now; pintar(ctx2d, a.nombre, t, a.c); tex.needsUpdate = true; return true;
  };
  return e;
}
