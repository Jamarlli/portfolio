// Versión 2 de las animaciones de Clawd. Se inspira en el GIF de «arreglar el bug»: el personaje tiene las proporciones del GIF (cuerpo de 16 celdas de ancho
// y 12 de alto, ojos de 2 x 2, patas de 2 x 4, brazos de 4 x 4; cada celda son 2 x 2 píxeles) y se mueve de verdad: se gira de frente a tres cuartos y de perfil,
// se agacha y se estira al saltar, se inclina, da volteretas, anda con las patas alternas y gesticula con los brazos y las manos.
// Las escenas (ANIM2) usan el mismo fondo de terminal y las mismas ayudas de dibujo que web/clawd.js.
import { R, P, alfa, rnd, mezcla, clamp, suave, linea, disco, texto, bocadillo, corazon, chispa, celdas, mixC, GY, NARANJA, SOMBRA, NEGRO, BLANCO } from './clawd.js';

const NARANJA2 = '#d07355', SOMBRA2 = '#b7664d', K2 = 2;

// ---------------------------------------------------------------- el esqueleto
// x: centro; y: el suelo (bajo las patas). Todo en celdas de 2 px; (0, 0) es el centro del suelo, hacia arriba es negativo.
//  giro: 0 de frente, 1 tres cuartos, 2 de perfil (mirando a la derecha; dir = -1 lo espeja)
//  ojos: 'a' abiertos, 'c' cerrados, 'f' felices (⌣), 'g' grandes, 'm' mirando abajo, 'w' guiño, 's' somnolientos, 'n' ninguno; mx, my: hacia dónde miran
//  bI, bD: brazos (de frente): 'abajo', 'medio', 'arriba', 'frente', 'cadera', 'largo'; mano: {x, y} mueve la mano en perfil
//  paso: fase del andar (0..1) o -1 quieto; sq: agachado (1..3) o estirado (-1..-2); lean: inclina la cabeza (celdas); rot: cuartos de vuelta (0..3)
//  ropa(top): pinta gorros y demás en celdas (el centro de la cabeza en x = 0, top = fila de arriba del cuerpo); ropaAntes: antes de los ojos
export function fino(x, y, o = {}) {
  const { giro = 0, dir = 1, ojos = 'a', mx = 0, my = 0, bI = 'abajo', bD = 'abajo', mano = null, paso = -1, sq = 0, lean = 0, rot = 0, ropa = null, ropaAntes = false, color = NARANJA2, sombra = SOMBRA2, negro = '#150201', escala = K2 } = o;
  const L = Math.max(1, 4 - sq), top = -(L + 12), ancho = sq >= 2 ? 1 : 0, shade = mixC(color, '#000000', 0.12);
  const nb = 12 - (sq >= 3 ? 1 : 0), tb = -(L + nb);                       // el cuerpo, un poco más bajo al agacharse mucho
  celdas(x, y, () => {
    g2().save();
    if (dir < 0) g2().scale(-1, 1);
    if (rot) { g2().translate(0, -8); g2().rotate(rot * Math.PI / 2); g2().translate(0, 8); }
    const lx = lean;                                                          // la parte de arriba se desplaza al inclinarse
    // patas (el andar: las del mismo lado suben a la vez)
    const patas = giro === 2 ? [-8, -4, 2, 6] : [-8, -4, 2, 6];
    patas.forEach((c, i) => {
      let alto = L;
      if (paso >= 0) alto = L - Math.round(Math.max(0, Math.sin((paso + (i % 2 ? 0.5 : 0)) * Math.PI * 2)) * 2);
      const lejos = giro === 2 && i < 2;
      R(c + (giro === 2 ? 0 : 0), -alto, 2, alto, lejos ? sombra : (giro === 2 ? color : sombra));
    });
    // cuerpo
    R(-8 - ancho + lx, tb, 16 + 2 * ancho, nb, color);
    if (giro === 1) R(-8 - ancho + lx, tb, 2, nb, shade);
    if (giro === 2) { R(-8 + lx, tb, 4, nb, shade); R(8 + lx, tb + 6, 3, 5, color); }
    // brazos
    const brazoFrente = (lado, p) => {
      const bx = lado < 0 ? -12 : 8 + ancho;
      if (p === 'abajo') R(bx - ancho + lx, tb + 4, 4, 4, color);
      else if (p === 'medio') R(bx - ancho + lx, tb + 2, 4, 4, color);
      else if (p === 'arriba') R((lado < 0 ? -11 : 8) + lx, tb - 5, 3, 10, color);
      else if (p === 'frente') R((lado < 0 ? -7 : 3) + lx, tb + 7, 4, 3, shade);
      else if (p === 'cadera') { R(bx - ancho + lx, tb + 4, 4, 2, color); R(bx - ancho + (lado < 0 ? 0 : 2) + lx, tb + 6, 2, 3, color); }
      else if (p === 'largo') R((lado < 0 ? -16 : 8) + lx, tb + 4, 8, 3, color);
      else if (p === 'largoBajo') R((lado < 0 ? -16 : 8) + lx, tb + 8, 8, 3, color);
    };
    if (giro === 0) { brazoFrente(-1, bI); brazoFrente(1, bD); }
    else if (giro === 1) { brazoFrente(-1, bI); R(8 + lx, tb + 8, 3, 4, color); }
    else { const m = mano || { x: 0, y: 0 }; R(7 + lx + m.x, tb + 9 + m.y, 3, 3, color); }
    if (ropa && ropaAntes) ropa(tb);
    // ojos
    const ex = giro === 0 ? [-6, 4] : giro === 1 ? [-3, 5] : [-1, 7], e = giro === 0 ? 2 : giro === 1 ? [1, 2] : [1, 1], ey = tb + 2 + my, dx = mx + lx;
    const ojo = (i, ax) => {
      const w = Array.isArray(e) ? e[i] : e, xx = ax + dx;
      if (ojos === 'a') R(xx, ey, w, 2, negro);
      else if (ojos === 'g') R(xx, ey - 1, w, 3, negro);
      else if (ojos === 'c') R(xx, ey + 1, w, 1, negro);
      else if (ojos === 's') R(xx, ey + 1, w, 1, negro);
      else if (ojos === 'm') R(xx, ey + 1, w, 2, negro);
      else if (ojos === 'w') { if (i === 0) R(xx, ey, w, 2, negro); else { R(xx, ey + 1, w + 1, 1, negro); } }
      else if (ojos === 'f') { const c0 = giro === 0 ? (i ? 3 : -7) : xx - dx - 1; const bx = giro === 0 ? c0 + dx : xx - 1; R(bx, ey, 1, 1, negro); R(bx + 1, ey + 1, 2, 1, negro); R(bx + 3, ey, 1, 1, negro); }
    };
    if (ojos !== 'n') { ojo(0, ex[0]); ojo(1, ex[1]); }
    if (ropa && !ropaAntes) ropa(tb);
    g2().restore();
  }, escala);
  return { top: y + tb * escala, ancho: 16 * escala };
}
// el contexto 2D actual (el de clawd.js) a través de una pequeña ayuda: celdas() ya lo ha preparado, así que tomamos la transformación actual de él
import { contexto2d } from './clawd.js';
const g2 = () => contexto2d();

// ---------------------------------------------------------------- escenas
export const ANIM2 = {};


const FRIO = '#eaf1fb';
const ojoParpadeo = (t, per = 3.2) => (t % per) > per - 0.15;
const salto = (u, alto) => -Math.sin(clamp(u) * Math.PI) * alto;               // arco de un salto (u de 0 a 1)
// gorros y complementos para el Clawd fino (cabeza de 16 celdas; top = fila de arriba del cuerpo)
const gorroFino = (top, a, b, c, t = 0, lado = 1) => {                           // gorro con borla (dormir, Papá Noel): se apoya en la cabeza y la punta cae a un lado
  R(-8, top - 2, 16, 2, c); R(-6, top - 4, 12, 2, a); R(-3, top - 6, 7, 2, b); R(lado * 3 - 1, top - 8, 4, 2, a);
  R(lado * (6 + Math.round(Math.sin(t * 3))), top - 6 + Math.round(Math.abs(Math.sin(t * 3))), 4, 4, c);
};

// ---------------------------------------------------------------- saludo (v2)
// Sale de debajo de la caja de entrada, mira a un lado y a otro, ve a quien mira, da un brinco de sorpresa, saluda con la mano, se agacha, da un salto mortal y se despide con un beso.
function saludo2(t, c) {
  const x = 64; let o = { giro: 0, ojos: 'a' }, dy = 0, dx = 0;
  if (t < 1.1) { const u = suave(t / 1.1); dy = (1 - u) * 36; o = { giro: 0, ojos: 'm', bI: 'medio', bD: 'medio' }; }                     // asoma desde abajo
  else if (t < 2.9) {                                                                                                                  // mira a un lado y a otro
    const u = t - 1.1; o = u < 0.5 ? { giro: 0, ojos: 'a', mx: -1 } : u < 1.0 ? { giro: 1, dir: -1, ojos: 'a' } : u < 1.5 ? { giro: 0, ojos: 'a', mx: 1 } : { giro: 1, ojos: 'a' };
    if (ojoParpadeo(t, 1.2)) o.ojos = 'c';
  }
  else if (t < 3.8) { const u = (t - 2.9) / 0.9; o = { giro: 0, ojos: 'g', bI: 'medio', bD: 'medio', sq: u < 0.25 ? 2 : (u < 0.7 ? -2 : 0) }; dy = salto(clamp((u - 0.2) / 0.5), 14); }   // ¡ahí estás!
  else if (t < 7.2) {                                                                                                                  // saluda con entusiasmo
    const u = t - 3.8; o = { giro: 0, ojos: 'f', bD: Math.floor(u * 5) % 2 ? 'arriba' : 'medio', bI: 'cadera', lean: Math.round(Math.sin(u * 3)) };
    dx = Math.round(Math.sin(u * 3)) * 2;
  }
  else if (t < 9.6) {                                                                                                                  // se agacha, salta y da una voltereta
    const u = t - 7.2;
    if (u < 0.5) o = { giro: 0, ojos: 'c', sq: 3, bI: 'abajo', bD: 'abajo' };
    else if (u < 1.5) { const k = (u - 0.5) / 1.0; dy = salto(k, 26); o = { giro: 0, ojos: 'f', sq: -2, bI: 'arriba', bD: 'arriba', rot: Math.floor(k * 4) % 4 }; }
    else if (u < 1.8) o = { giro: 0, ojos: 'f', sq: 3, bI: 'medio', bD: 'medio' };
    else o = { giro: 0, ojos: 'f', sq: 1, bI: 'abajo', bD: 'abajo' };
  }
  else { const u = t - 9.6; o = { giro: 1, ojos: u > 0.6 ? 'w' : 'f', bD: u < 0.8 ? 'frente' : 'arriba', bI: 'cadera' }; }                  // beso y guiño
  const c0 = fino(x + dx, GY + dy, o);
  if (t >= 2.9 && t < 3.9) { R(x - 1, c0.top - 12, 3, 7, '#ffd479'); R(x - 1, c0.top - 3, 3, 3, '#ffd479'); }
  if (t >= 4.2 && t < 7.2) bocadillo(x + 26, c0.top - 8, c.en ? 'HI!' : 'HOLA!', -1);
  if (t >= 9.6 && t < 11.5) for (let i = 0; i < 4; i++) { const f = ((t - 9.6) * 0.8 + i / 4) % 1; alfa(Math.sin(f * Math.PI)); corazon(x + 14 + i * 7 + Math.sin(t * 5 + i) * 2, GY - 18 - f * 28, '#e8505b'); } alfa(1);
  if (t >= 3.8 && t < 9) for (let i = 0; i < 6; i++) { const f = ((t - 3.8) * 0.7 + i / 6) % 1; alfa(Math.sin(f * Math.PI) * 0.8); chispa(x - 40 + i * 16, 24 + rnd(i) * 12 - f * 8, ['#ffd479', '#6fd0c0', '#f2a3b8'][i % 3]); } alfa(1);
}
ANIM2.saludo = [saludo2, 12];

// ---------------------------------------------------------------- dormir (v2)
// Llega andando de perfil con sueño, bosteza y se estira, sube de un salto a la cama, se gira, se pone el gorro, se tumba, se tapa con la manta y se duerme.
function dormir2(t, c) {
  const resp = Math.sin(t * 1.75) > 0.15 ? 1 : 0;
  // cama (a la derecha) y luna
  R(70, 36, 6, 20, '#5b3d2a'); R(72, 38, 2, 16, '#6e4a33'); R(70, 50, 54, 6, '#5b3d2a'); R(70, 50, 54, 1, '#7a5238'); R(120, 44, 6, 12, '#5b3d2a');
  R(76, 44, 44, 6, '#dcd6ee');
  disco(22, 22, 5, '#f3e9b8'); disco(24, 21, 4.4, FONDOCIELO);
  for (let i = 0; i < 7; i++) { const sx = 8 + rnd(i) * 50, sy = 14 + rnd(i + 3) * 24; if (Math.sin(t * 2 + i * 2) > -0.3) P(sx, sy, '#8f9ae0'); }
  if (t < 7.4) {
    let o = { giro: 2, paso: -1, ojos: 's' }, x = 18, dy = 0;
    if (t < 3.2) { const u = t / 3.2; x = 12 + u * 32; o = { giro: 2, paso: (t * 1.3) % 1, ojos: 's', lean: 0, my: 1 }; }                                                    // anda arrastrando los pies
    else if (t < 4.6) { const u = (t - 3.2); x = 44; o = u < 0.9 ? { giro: 0, ojos: 'c', sq: 0, bI: 'arriba', bD: 'arriba', lean: 0 } : { giro: 0, ojos: 'c', sq: -1, bI: 'arriba', bD: 'arriba' }; if (u > 0.5 && u < 1.2) o.ojos = 'g'; }   // bosteza y se estira
    else if (t < 5.2) { x = 44; o = { giro: 2, ojos: 's', sq: 2 }; }                                                                                                          // se prepara
    else if (t < 6.4) { const u = (t - 5.2) / 1.2; x = mezcla(44, 90, suave(u)); dy = salto(u, 18) - Math.max(0, u - 0.6) * 0; o = { giro: 2, ojos: 's', sq: u < 0.15 ? 2 : -1, bI: 'arriba' }; }       // salta a la cama
    else { x = 90; dy = -10; o = { giro: 0, ojos: 's', sq: t < 6.6 ? 2 : 0, ropa: top => gorroFino(top, '#4e6fd1', '#6f8de3', BLANCO, t, 1) }; }
    if (t < 6.4 && t > 4.9) o.ropa = null;
    if (t >= 6.4) o.ropa = top => gorroFino(top, '#4e6fd1', '#6f8de3', BLANCO, t, 1);
    fino(x, GY + dy, { ...o, bD: o.bD, ropaAntes: false });
  } else {
    // tumbado en la cama de lado y agazapado (como un gato), con la cabeza en la almohada, tapado hasta las orejas
    R(72, 38, 14, 7, BLANCO); R(72, 44, 14, 2, '#cfc8dc');
    fino(100, 46 - resp, { giro: 2, dir: -1, sq: 3, ojos: 'c', lean: 0, ropa: top => { g2().save(); g2().translate(-2, 0); gorroFino(top, '#4e6fd1', '#6f8de3', BLANCO, t, -1); g2().restore(); } });
    const mx0 = mezcla(124, 84, suave(clamp((t - 8.0) / 1.0)));
    R(mx0, 40 - resp, 124 - mx0 + 2, 16, '#3f5aa8'); R(mx0, 40 - resp, 124 - mx0 + 2, 3, '#e8e4f4'); for (let i = 0; i < 124 - mx0; i += 8) R(mx0 + 3 + i, 46 - resp, 4, 10, '#4a67bb');
    for (let i = 0; i < 3; i++) { const f = ((t - 9) / 3.4 + i / 3) % 1, zx = 76 + f * 12 + i * 3, zy = 34 - f * 20, k = f < 0.5 ? 1 : 2; if (t > 9) { alfa(Math.sin(f * Math.PI)); texto('Z', zx, zy, '#e8eeff', k); alfa(1); } }
  }
}
const FONDOCIELO = '#0c0c0c';
ANIM2.dormir = [dormir2, 14];

// ---------------------------------------------------------------- café (v2)
// Llega andando de perfil hasta la mesa, mira la taza, la coge con la mano, se la lleva al hocico, sopla y da un sorbo, la deja, y mira por la ventana.
function cafe2(t, c) {
  R(8, 14, 30, 26, '#2e1f17'); R(10, 16, 26, 22, c.llueve ? '#5d6f86' : '#e7a96f'); if (!c.llueve) { R(10, 28, 26, 10, '#f2c98a'); disco(22, 31, 5, '#ffe9a8'); }
  R(22, 16, 2, 22, '#2e1f17'); R(10, 26, 26, 2, '#2e1f17'); R(6, 38, 34, 3, '#7a5a3a');
  if (c.llueve) for (let i = 0; i < 12; i++) { const f = (t * 1.6 + rnd(i)) % 1; P(11 + Math.floor(rnd(i + 3) * 24), 16 + f * 22, '#cfe0f4'); }
  // la mesa, un cruasán y la taza
  R(86, 46, 36, 3, '#8a5c3c'); R(100, 49, 5, 7, '#6b452c'); R(94, 55, 18, 1, '#6b452c'); R(112, 42, 8, 4, '#f1d9a6'); R(114, 41, 4, 1, '#e0b872');
  // pájaro que aterriza en el alféizar (a partir de 7,5 s)
  if (t > 7.2) { const u = clamp((t - 7.2) / 0.8), bx = mezcla(2, 18, u), by = mezcla(18, 36, suave(u)) - (u < 1 ? Math.abs(Math.sin(t * 20)) * 2 : 0); R(bx, by, 6, 4, '#5a82c8'); R(bx + 5, by - 1, 3, 3, '#5a82c8'); P(bx + 7, by, NEGRO); R(bx + 8, by + 1, 2, 1, '#e8b020'); R(bx - 2, by + 1, 3, 1, '#3f63ad'); R(bx + 1, by + 4, 1, 2, '#e8b020'); R(bx + 4, by + 4, 1, 2, '#e8b020'); }
  let x = 8, o = { giro: 2, ojos: 'a' }, mugX = 98, mugY = 40, vapor = true, mano = { x: 0, y: 0 };
  const sorbo = t >= 4.2 && t < 7.0;
  if (t < 3.0) { const u = t / 3.0; x = mezcla(8, 56, suave(u)); o = { giro: 2, ojos: 'a', paso: u < 1 ? (t * 1.6) % 1 : -1, bD: 'abajo' }; }
  else if (t < 3.6) { x = 56; o = { giro: 2, ojos: 'a', my: 1, mano: { x: 0, y: 0 } }; }
  else if (t < 4.2) { const u = (t - 3.6) / 0.6; x = 56; mano = { x: Math.round(u * 5), y: 0 }; o = { giro: 2, ojos: 'm', mano, lean: Math.round(u) }; mugX = 98; }
  else if (t < 7.0) {                                                                                  // coge la taza y la sube al hocico, sopla, sorbe
    const u = t - 4.2, subida = suave(clamp(u / 0.7)), bajada = suave(clamp((u - 2.2) / 0.6));
    const k = subida * (1 - bajada); mano = { x: Math.round(5 - 3 * k), y: Math.round(-5 * k) }; x = 56;
    o = { giro: 2, ojos: u > 0.9 && u < 2.0 ? 'c' : 'a', mano, lean: 1, my: 0 };
    mugX = 86 + (1 - k) * 12 + 5 * (1 - k) + 0; mugY = mezcla(40, 36, k);
    if (u > 1.6 && u < 2.0) o.lean = 0;
  }
  else if (t < 8.4) { x = 56; mano = { x: 5, y: 0 }; o = { giro: 2, ojos: 'f', mano, lean: 0 }; }
  else { x = 56; const u = t - 8.4; o = { giro: u < 0.7 ? 1 : 2, dir: u < 0.7 ? -1 : -1, ojos: u > 1.0 ? 'f' : 'a', mano: { x: 5, y: 0 } }; }
  // la taza
  const tz = (px, py) => { R(px, py, 7, 6, '#4a78c8'); R(px, py, 7, 1, '#f4f1ea'); R(px + 1, py + 1, 5, 1, '#5a3418'); R(px, py + 5, 7, 1, '#365ea3'); R(px + 7, py + 1, 1, 4, '#4a78c8'); R(px + 8, py + 2, 1, 2, '#4a78c8'); };
  const en = t >= 3.6 && t < 8.4;
  const c0 = fino(x, GY, o);
  if (t < 3.6) tz(95, 40); else if (en) tz(mugX - 3, mugY - (t >= 4.2 && t < 7.0 ? 0 : 0)); else tz(95, 40);
  if (!(t >= 4.8 && t < 6.6)) for (let i = 0; i < 3; i++) { const f = (t * 0.55 + i / 3) % 1; alfa(Math.sin(f * Math.PI) * 0.9); R((t >= 3.6 && t < 8.4 ? mugX : 98) + i * 2 + Math.round(Math.sin(t * 2.5 + i * 2) * 1.5), mugY - 3 - f * 14, 1, 3, '#e6e8f0'); } alfa(1);
  if (t >= 6.6 && t < 8.4) corazon(mugX + 4, 28 - (t - 6.6) * 6, '#f2a3b8');
}
ANIM2.cafe = [cafe2, 12];

// ---------------------------------------------------------------- halloween (v2)
// Tiembla, mira con miedo a los lados, se envuelve en humo morado, y al disiparse es una calabaza que se enciende por dentro y se lanza hacia ti con un «¡Bu!».
function halloween2(t, c) {
  const x = 64; disco(106, 20, 7, '#f6c15a'); disco(109, 18, 6, '#0c0c0c');
  for (let i = 0; i < 12; i++) { const sx = rnd(i) * 128, sy = rnd(i + 5) * 40 + 10; if (Math.sin(t * 2 + i) > -0.3) P(sx, sy, '#6a5a8a'); }
  const murci = (px, py, tt) => { const a = Math.floor(tt * 8) % 2, cc = '#2a1f3a'; R(px - 1, py, 3, 2, cc); R(px - 4, py - a, 3, 1, cc); R(px + 2, py - a, 3, 1, cc); };
  murci(mezcla(-10, 140, (t * 0.1) % 1), 22 + Math.sin(t * 2) * 6, t); murci(mezcla(140, -10, ((t + 4) * 0.09) % 1), 34 + Math.cos(t * 2) * 5, t + 1);
  const P1 = 4.2, calabaza = t >= P1;
  if (!calabaza) {
    let o = { giro: 0, ojos: 'a' }, dx = 0;
    if (t < 1.4) { dx = Math.round(Math.sin(t * 40)); o = { giro: 0, ojos: 'g', sq: 1, bI: 'frente', bD: 'frente' }; }                         // tiembla
    else if (t < 2.4) o = t < 1.9 ? { giro: 1, ojos: 'a', dir: -1, sq: 1 } : { giro: 1, ojos: 'a', sq: 1 };                                     // mira a los lados
    else if (t < P1) { const u = (t - 2.4) / 1.8; dx = Math.round(Math.sin(t * 50) * u * 2); o = { giro: 0, ojos: 'g', sq: Math.round(u * 2), bI: 'arriba', bD: 'arriba' }; }
    fino(x + dx, GY, o);
    if (t > 2.2 && t < P1 + 0.8) for (let i = 0; i < 18; i++) { const f = ((t - 2.2) * 0.8 + rnd(i)) % 1, k = clamp((t - 2.2) / 2.0); alfa(Math.min(1, k) * (1 - f * 0.6) * (t > P1 ? 1 - (t - P1) / 0.8 : 1)); disco(x - 16 + rnd(i + 3) * 32 + Math.sin(f * 6 + i) * 4, GY - 4 - f * 34, 3 + f * 6, i % 2 ? '#7a4aa8' : '#a06ad0'); } alfa(1);
  } else {
    const u = t - P1, luz = clamp(u / 0.8) * (0.8 + 0.2 * Math.sin(t * 9));
    let dy = 0, sq = 0, dx = 0, bu = false;
    if (u < 0.4) { sq = 2; }
    else if (u < 1.2) { const k = (u - 0.4) / 0.8; dy = salto(k, 16); sq = -2; }
    else { const k = (u - 1.2) % 3.0; if (k < 0.5) sq = 3; else if (k < 1.1) { dy = salto((k - 0.5) / 0.6, 20); sq = -2; bu = true; } else { dy = Math.sin(t * 3) * 1.5; } if (u > 7.4) bu = false; }
    const col = '#f08a1c', oscuro = '#c46410', cav = mixC('#2a1405', '#ffd34a', luz);
    alfa(0.10 * luz); disco(x, GY - 14, 28, '#ffa21f'); alfa(1);
    fino(x + dx, GY + dy, { giro: 0, ojos: 'n', sq, color: col, sombra: oscuro, bI: 'frente', bD: 'frente', ropaAntes: false, ropa: top => {
      R(-10, top + 2, 2, 8, col); R(8, top + 2, 2, 8, col); R(-10, top + 5, 1, 3, oscuro); R(9, top + 5, 1, 3, oscuro);
      for (const rx of [-6, -2, 2, 6]) R(rx, top, 1, 12, oscuro); R(-1, top - 5, 3, 5, '#3f7a2c'); R(2, top - 5, 4, 2, '#3f7a2c'); R(-5, top - 3, 4, 2, '#5aa83a');
      R(-6, top + 2, 4, 1, cav); R(-5, top + 3, 2, 1, cav); R(-6, top + 3, 1, 0, cav);                                         // ojos triangulares
      R(2, top + 2, 4, 1, cav); R(3, top + 3, 2, 1, cav);
      R(-5, top + 6, 10, 2, cav); for (const dxx of [-4, -1, 2]) R(dxx, top + 6, 1, 1, '#2a1405'); R(-4, top + 8, 8, 1, cav);   // la boca con dientes
    } });
    if (bu || (u > 1.8 && u < 2.8)) bocadillo(x + 26, GY - 52, c.en ? 'BOO!' : 'BU!', -1);
    for (let i = 0; i < 3; i++) murci(x + Math.cos(t * 2 + i * 2.1) * 36, 24 + Math.sin(t * 2.6 + i * 2.1) * 8, t + i);
  }
}
ANIM2.halloween = [halloween2, 13];

// ---------------------------------------------------------------- muñeco de nieve (v2)
// Empuja cada bola de perfil, inclinado y con pasos cortos, vuelve andando hacia atrás, se agacha a recoger un puñado de nieve, la levanta de un salto,
// decora el muñeco con las manos, da un paso atrás, se pone las manos en la cintura, le sale un pulgar arriba y le ríen los ojos.
function bolaN(cx, cy, r) { disco(cx, cy, r, '#eaf1fb'); disco(cx + r * 0.2, cy + r * 0.25, r * 0.78, '#cfdcf0'); disco(cx - r * 0.18, cy - r * 0.2, r * 0.6, '#f8fbff'); if (r > 4) P(cx - r * 0.45, cy - r * 0.5, '#fff'); }
const bufandaFina = (top, t = 0) => { const rojo = '#c93a3a', clar = '#f0e6d8'; R(-8, top + 8, 16, 3, rojo); for (let i = 0; i < 16; i += 3) R(-8 + i, top + 8, 1, 3, clar); const v = Math.round(Math.sin(t * 5)); R(4, top + 11, 3, 5 + v, rojo); R(4, top + 14 + v, 3, 2, clar); };
const gorroLanaFino = (top, t = 0) => { R(-8, top - 2, 16, 3, '#5a82c8'); R(-6, top - 4, 12, 2, '#3f63ad'); R(-4, top - 5, 8, 1, '#3f63ad'); for (let i = 0; i < 16; i += 2) P(-8 + i, top - 1, '#7ea0e0'); R(-2, top - 8 + Math.round(Math.sin(t * 4) * 0.5), 4, 3, BLANCO); };
function nieve2(t, c) {
  const SX = 100, rb = 9, rm = 6.5, rh = 5, cyb = GY - rb, cym = GY - 2 * rb - rm + 3, cyh = GY - 2 * rb - 2 * rm - rh + 5, X0 = 46, CX0 = 18;
  let cx = CX0, o = { giro: 2, ojos: 'a' }, dy = 0;
  const bola = (x0, x1, r0, r1, u) => ({ x: mezcla(x0, x1, u), r: mezcla(r0, r1, u) });
  const rueda = (b, tt) => { bolaN(b.x, GY - b.r, b.r); cx = Math.max(CX0, b.x - b.r - 25); o = { giro: 2, ojos: 'a', paso: (tt * 1.6) % 1, lean: 1, mano: { x: 1, y: -1 } }; };      // empuja, inclinado
  const vuelve = (cx0, u, tt) => { cx = mezcla(cx0, CX0, suave(u)); o = { giro: 2, dir: -1, ojos: 'a', paso: (tt * 1.8) % 1 }; };
  const recoge = (u) => { cx = CX0 + 6; const ag = u < 0.6; o = { giro: 0, ojos: 'a', sq: ag ? 3 : 0, bI: 'frente', bD: 'frente', lean: ag ? 0 : Math.round(Math.sin(u * 40)) }; const r = Math.max(0.5, 3 * Math.min(1, u * 1.5)); bolaN(X0, GY - r - (ag ? 0 : 4 * Math.sin(u * 20) * 0), r); };
  const sube = (x0, y0, x1, y1, r, u) => { const v = suave(u); bolaN(mezcla(x0, x1, v), mezcla(y0, y1, v) - Math.sin(v * Math.PI) * 12, r); cx = x0 - r - 26 + v * 8; dy = salto(v, 8); o = { giro: 2, ojos: 'g', sq: u < 0.25 ? 3 : -2, bI: 'arriba', bD: 'arriba', mano: { x: 1, y: -3 }, lean: 1 }; };
  const SEG = [4.0, 1.6, 0.8, 3.2, 1.0, 1.6, 0.8, 2.4, 1.0];
  const T = SEG.reduce((a, d) => (a.push(a[a.length - 1] + d), a), [0]);
  if (t < T[1]) rueda(bola(X0, SX, 3, rb, t / SEG[0]), t);
  else if (t < T[2]) { bolaN(SX, cyb, rb); vuelve(SX - rb - 25, (t - T[1]) / SEG[1], t); }
  else if (t < T[3]) { bolaN(SX, cyb, rb); recoge((t - T[2]) / SEG[2]); }
  else if (t < T[4]) { bolaN(SX, cyb, rb); rueda(bola(X0, SX - 24, 3, rm, (t - T[3]) / SEG[3]), t); }
  else if (t < T[5]) { bolaN(SX, cyb, rb); sube(SX - 24, GY - rm, SX, cym, rm, (t - T[4]) / SEG[4]); }
  else if (t < T[6]) { bolaN(SX, cyb, rb); bolaN(SX, cym, rm); vuelve(SX - 24 - rm - 18, (t - T[5]) / SEG[5], t); }
  else if (t < T[7]) { bolaN(SX, cyb, rb); bolaN(SX, cym, rm); recoge((t - T[6]) / SEG[6]); }
  else if (t < T[8]) { bolaN(SX, cyb, rb); bolaN(SX, cym, rm); rueda(bola(X0, SX - 22, 3, rh, (t - T[7]) / SEG[7]), t); }
  else if (t < T[9]) { bolaN(SX, cyb, rb); bolaN(SX, cym, rm); sube(SX - 22, GY - rh, SX, cyh, rh, (t - T[8]) / SEG[8]); }
  else {
    bolaN(SX, cyb, rb); bolaN(SX, cym, rm); bolaN(SX, cyh, rh);
    const u = t - T[9];
    cx = u < 3.2 ? mezcla(SX - 22 - rh - 18, SX - 34, suave(u / 1.0)) : SX - 34;
    o = { giro: 1, ojos: 'a', bD: u < 2.6 ? 'arriba' : 'cadera', bI: 'cadera' };
    if (u > 0.3) { R(SX - 2, cyh - 2, 2, 2, '#222'); R(SX + 1, cyh - 2, 2, 2, '#222'); }
    if (u > 0.9) { R(SX, cyh + 1, 6, 2, '#f08a2a'); R(SX + 6, cyh + 1, 1, 1, '#d86a10'); chispa(SX + 9, cyh - 4, '#ffffff'); }
    if (u > 1.5) { R(SX - 1, cym - 2, 2, 2, '#222'); R(SX - 1, cym + 1, 2, 2, '#222'); R(SX - 1, cym + 4, 2, 2, '#222'); }
    if (u > 2.0) { linea(SX - 6, cym, SX - 14, cym - 5, '#8a6a4a'); linea(SX + 6, cym, SX + 14, cym - 5, '#8a6a4a'); linea(SX - 11, cym - 3, SX - 12, cym - 7, '#8a6a4a'); linea(SX + 11, cym - 3, SX + 12, cym - 7, '#8a6a4a'); }
    if (u > 2.6) { R(SX - 4, cyh + 4, 9, 2, '#c93a3a'); R(SX + 2, cyh + 6, 3, 4, '#c93a3a'); o.ojos = 'f'; }
    if (u > 3.4) { const k = (u - 3.4) % 1.4, sn = Math.sin(clamp(k / 0.7) * Math.PI); dy = -sn * 12; o = { giro: 0, ojos: 'f', sq: k < 0.12 ? 2 : sn > 0.1 ? -2 : 0, bI: 'arriba', bD: 'arriba' }; for (let i = 0; i < 3; i++) { const f = (t * 0.6 + i / 3) % 1; alfa(Math.sin(f * Math.PI)); corazon(SX - 46 + i * 14, cyh - 6 - f * 12, '#e8505b'); } alfa(1); }
  }
  if (t < T[9] && o.ojos === 'a' && ojoParpadeo(t, 2.8)) o.ojos = 'c';
  fino(cx, GY + dy, { ...o, ropa: top => { bufandaFina(top, t); gorroLanaFino(top, t); } });
  for (let i = 0; i < 34; i++) { const x = (rnd(i) * 128 + t * (3 + rnd(i + 5) * 4) + Math.sin(t + i) * 3) % 128, y = (rnd(i + 2) * 58 + t * (9 + rnd(i + 7) * 9)) % 58; P(x, y, '#ffffff'); if (i % 5 === 0) P(x + 1, y, '#dfe9ff'); }
}
ANIM2.nieve = [nieve2, 22];

// ---------------------------------------------------------------- Papá Noel (v2)
// Llega volando en el trineo con los renos, aterriza con un rebote, salta al tejado con el saco, anda de puntillas de perfil, se gira a mirar a quien le mira
// («¡chist!»), salta a la chimenea, se asoma, se lanza de cabeza y se cuela dejando las patas al aire, hasta que lo succionan. Suelta un «Ho ho ho».
const barbaFina = top => { R(-7, top + 6, 14, 3, BLANCO); R(-5, top + 9, 10, 3, BLANCO); R(-3, top + 12, 6, 2, BLANCO); };
function noel2(t, c) {
  for (let i = 0; i < 18; i++) { const sx0 = rnd(i) * 128, sy0 = rnd(i + 8) * 40; if (Math.sin(t * 1.7 + i * 2.3) > -0.5) P(sx0, sy0, i % 4 ? '#6f78b8' : '#ffffff'); }
  const CHX = 94, TOPE = 44, RIM = TOPE - 4, ROJO = '#c9373a', ROJO2 = '#8f2024';
  const chimenea = () => { R(CHX, TOPE, 30, GY - TOPE + 1, '#8a4a3a'); for (let k = 0; k < GY - TOPE; k += 4) R(CHX, TOPE + k, 30, 1, '#6a3528'); for (let k = 0; k < 30; k += 7) R(CHX + k + 3, TOPE + 2, 1, 4, '#6a3528'); R(CHX - 3, RIM, 36, 4, '#9a5a48'); R(CHX - 3, RIM - 1, 36, 1, '#f4f8ff'); R(CHX + 1, RIM, 28, 1, '#1a1014'); };
  const reno = (rx, ry, nariz, f) => { R(rx, ry - 7, 10, 4, '#8a5a3a'); R(rx + 10, ry - 9, 3, 3, '#8a5a3a'); P(rx + 12, ry - 8, NEGRO); R(rx + 11, ry - 12, 1, 3, '#d9c9a0'); R(rx + 13, ry - 11, 1, 2, '#d9c9a0'); R(rx + 13, ry - 8, 1, 1, nariz); R(rx + 1, ry - 3, 1, 3 - f, '#5e3c26'); R(rx + 8, ry - 3, 1, 2 + f, '#5e3c26'); R(rx + 5, ry - 3, 1, 3, '#5e3c26'); R(rx + 3, ry - 3, 1, 2 + f, '#5e3c26'); R(rx - 2, ry - 6, 2, 1, '#8a5a3a'); };
  const traje = { color: ROJO, sombra: ROJO2 };
  const santa = top => { barbaFina(top); gorroFino(top, ROJO, '#e04a4e', BLANCO, t, 1); };
  const saco = (px, py, k = 2) => celdas(px, py, () => { R(0, 2, 6, 5, '#b32a2e'); R(1, 0, 4, 3, '#b32a2e'); R(0, 2, 6, 1, '#e8e0cf'); R(1, -1, 3, 1, '#c9a64a'); R(0, 3, 1, 4, '#8a1c20'); R(5, 3, 1, 4, '#8a1c20'); P(3, 4, '#e0b84a'); }, k);
  const vuelo = clamp(t / 4.2), aterr = suave(clamp((t - 3.4) / 1.4)), rebote = t > 4.8 && t < 5.4 ? Math.sin((t - 4.8) / 0.6 * Math.PI) * 4 : 0;
  const sx = mezcla(-84, 6, suave(vuelo)), sy = mezcla(14, GY, aterr) + Math.sin(t * 2.2) * (1 - aterr) * 2 - rebote;
  const gal = aterr < 1 ? Math.floor(t * 5) % 2 : 0;
  if (t < 12) {
    linea(sx + 32, sy - 4, sx + 48, sy - 5, '#c9a64a'); linea(sx + 46, sy - 5, sx + 58, sy - 5, '#c9a64a');
    reno(sx + 48, sy, '#ff3b3b', gal); reno(sx + 62, sy, '#ff3b3b', 1 - gal);
    if (vuelo < 1) for (let i = 0; i < 9; i++) { const f = (t * 2 + i / 9) % 1; alfa(1 - f); chispa(sx - 4 - f * 16 + rnd(i) * 4, sy - 6 + Math.sin(i * 2 + t * 6) * 4, ['#ffe58a', '#fff', '#9fd0ff'][i % 3]); } alfa(1);
  }
  // fases de Clawd: en el trineo; salta; anda de puntillas; chist; salta a la chimenea; se asoma; se lanza de cabeza
  let x = sx + 22, y = sy - 6, o = { giro: 1, ojos: 'a', sq: 1, bD: 'arriba', bI: 'medio' }, conSaco = false, clip = false, inv = false;
  if (t >= 5.6 && t < 6.6) { const u = (t - 5.6) / 1.0; x = mezcla(sx + 22, 38, suave(u)); y = mezcla(sy - 6, GY, suave(u)) + salto(u, 22); o = { giro: 2, ojos: 'a', sq: u < 0.15 ? 2 : -1, bI: 'arriba', mano: { x: 1, y: -2 } }; conSaco = true; }
  else if (t >= 6.6 && t < 12) {
    conSaco = true; y = GY;
    if (t < 8.4) { const u = (t - 6.6) / 1.8; x = mezcla(38, 66, u); o = { giro: 2, ojos: 'a', paso: (t * 1.1) % 1, lean: 1, sq: 1, mano: { x: 1, y: 0 } }; }
    else if (t < 10.0) { x = 66; const u = t - 8.4; o = { giro: u < 0.3 ? 1 : 0, ojos: u > 0.3 ? 'g' : 'a', bD: u > 0.8 ? 'frente' : 'abajo', bI: 'abajo' }; }
    else if (t < 11.2) { const u = (t - 10) / 1.2; x = mezcla(66, 80, suave(Math.min(1, u * 1.4))); o = { giro: 2, ojos: 'a', paso: (t * 1.2) % 1, lean: 1, sq: 1, mano: { x: 1, y: 0 } }; }
    else { const u = (t - 11.2) / 0.8; x = mezcla(80, 108, suave(u)); y = mezcla(GY, RIM, suave(u)) + salto(u, 14); o = { giro: 2, ojos: 'a', sq: u < 0.2 ? 3 : -2, bI: 'arriba', mano: { x: 1, y: -3 } }; }
  }
  else if (t >= 12 && t < 17.5) {
    x = 108; conSaco = t < 15.2;
    const u = t - 12;
    if (u < 1.2) { y = RIM; o = { giro: 2, ojos: 'm', sq: 2, lean: 2, mano: { x: 1, y: 1 } }; }
    else if (u < 1.8) { y = RIM; o = { giro: 2, ojos: 'g', sq: 3, lean: 2 }; }
    else { inv = true; clip = true; const k = (u - 1.8) / 2.8; y = RIM + 4 + suave(clamp(k)) * 30; o = { giro: 2, ojos: 'g', rot: 2, paso: (t * (k > 0.85 ? 6 : 3)) % 1 }; }
  }
  if (t < 17.5) {
    if (clip) { g2().save(); g2().beginPath(); g2().rect(0, 0, 128, RIM); g2().clip(); }
    const c0 = fino(x, y, { ...traje, ...o, ropa: inv ? null : santa });
    if (conSaco && !inv) saco(x + 14, c0.top + 8, 2);
    if (clip) g2().restore();
  }
  // el trineo (delante de Clawd cuando va dentro)
  celdas(sx, sy, () => {
    R(0, -1, 18, 1, '#d8b24c'); R(17, -2, 2, 1, '#d8b24c'); R(18, -3, 1, 1, '#d8b24c');
    R(2, -5, 15, 4, '#b82a2e'); R(2, -2, 15, 1, '#8a1c20'); R(2, -5, 15, 1, '#e0b84a'); R(0, -7, 3, 6, '#b82a2e'); R(15, -6, 3, 2, '#b82a2e'); R(0, -7, 3, 1, '#e0b84a');
  });
  if (t < 5.6) saco(sx + 2, sy - 22, 2);
  chimenea();
  if (t >= 8.9 && t < 10.0) bocadillo(60, 14, c.en ? 'SHH!' : 'CHIST!', 1);
  if (t >= 15.2 && t < 17.8) { const f = clamp((t - 15.2) / 2); alfa(1 - f); disco(CHX + 15, RIM - 6 - f * 14, 4 + f * 5, '#8a8f9c'); disco(CHX + 9, RIM - 10 - f * 18, 3 + f * 4, '#aeb3c0'); alfa(1); }
  if (t >= 16) bocadillo(CHX - 8, 6, 'HO HO HO', 2);
  if (t >= 17.5) { alfa(0.5 + 0.4 * Math.sin(t * 4)); chispa(CHX + 15, RIM - 8, '#ffe58a'); alfa(1); }
  for (let i = 0; i < 22; i++) { const px = (rnd(i) * 128 + t * (2 + rnd(i + 5) * 3)) % 128, py = (rnd(i + 2) * 58 + t * (7 + rnd(i + 7) * 8)) % 58; P(px, py, '#ffffff'); }
}
ANIM2.noel = [noel2, 21];

// ---------------------------------------------------------------- Pascua (v2)
// Conejito que viene a saltos (se agacha, se estira y cae), olisquea el arbusto de perfil, se encoge de hombros, encuentra el huevo, se da la vuelta con los ojos como platos,
// lo abraza y lo mete en la cesta, y repite con otro dorado.
const orejasFinas = (top, t, vivo = 1, caida = 0) => {
  for (const s of [-1, 1]) {
    const ex = s < 0 ? -7 : 4, m = Math.round(Math.sin(t * 7 + s) * vivo);
    R(ex, top - 8 + caida, 3, 8 - caida, BLANCO); R(ex + 1, top - 6 + caida, 1, 6 - caida, '#f2a3b8'); R(ex + m, top - 11 + caida, 3, 3, BLANCO); P(ex + 1 + m, top - 10 + caida, '#f2a3b8');
  }
  R(-1, top + 7, 3, 2, '#e58aa0'); for (const s of [-1, 1]) { R(s < 0 ? -11 : 8, top + 7, 3, 1, '#e6d9c8'); R(s < 0 ? -11 : 8, top + 9, 3, 1, '#e6d9c8'); }
};
function pascua2(t, c) {
  const BX = [46, 86, 118], PAR = [22, 62, 94];
  const arbusto = (cx, sac) => { const s = sac ? (Math.floor(t * 14) % 2 ? 1 : -1) : 0; R(cx - 13 + s, 40, 26, 16, '#2f7a3c'); R(cx - 9 + s, 35, 18, 6, '#388a46'); R(cx - 13 + s, 48, 26, 8, '#276a33'); for (let k = 0; k < 6; k++) P(cx - 10 + k * 4 + s, 37 + (k % 2) * 8, '#52a85c'); };
  const huevo = (hx, hy, c1, c2) => { R(hx - 1, hy, 5, 5, c1); R(hx, hy - 1, 3, 1, c1); R(hx, hy + 5, 3, 1, c1); R(hx - 1, hy + 2, 5, 1, c2); P(hx, hy + 1, c2); P(hx + 2, hy + 3, c2); };
  let x = 14, dy = 0, o = { giro: 2, ojos: 'a' }, sac = [0, 0, 0], egg1 = 0, egg2 = 0, q = null, cestas = 0, conf = false, caida = 0;
  const brinco = (u, x0, x1, hops) => { const k = (u * hops) % 1; x = mezcla(x0, x1, u); dy = salto(k, 10); o = { giro: 2, ojos: 'a', sq: k < 0.12 || k > 0.9 ? 3 : (k > 0.2 && k < 0.8 ? -2 : 0), lean: k < 0.5 ? 1 : 0, mano: { x: 0, y: 0 } }; caida = k > 0.5 ? 2 : 0; };
  if (t < 2.4) brinco(t / 2.4, 14, PAR[0], 3);
  else if (t < 4.2) { const u = t - 2.4; x = PAR[0]; sac[0] = u > 0.4 && u < 1.2 ? 1 : 0; o = u < 1.3 ? { giro: 2, ojos: 'm', lean: 2, my: 1, sq: 2, mano: { x: 1, y: 1 } } : { giro: 0, ojos: 'a', bI: 'arriba', bD: 'arriba', sq: 0 }; q = u > 1.3 ? '?' : null; if (u > 1.3 && u < 1.6) o.sq = -1; }
  else if (t < 6.2) brinco((t - 4.2) / 2.0, PAR[0], PAR[1], 3);
  else if (t < 7.6) { const u = t - 6.2; x = PAR[1]; sac[1] = 1; o = { giro: 2, ojos: 'm', lean: 2, my: 1, sq: 2, mano: { x: 1, y: 1 } }; if (u > 0.8) egg1 = clamp((u - 0.8) / 0.6); }
  else if (t < 9.4) {
    const u = t - 7.6; x = PAR[1]; egg1 = u < 1.2 ? 1 : 0; cestas = u > 1.2 ? 1 : 0;
    o = u < 0.3 ? { giro: 1, ojos: 'g' } : u < 1.0 ? { giro: 0, ojos: 'g', bI: 'arriba', bD: 'arriba', sq: -2 } : { giro: 0, ojos: 'f', bI: 'frente', bD: 'frente' };
    if (u > 0.3 && u < 0.7) dy = salto((u - 0.3) / 0.4, 12);
    q = u > 0.3 && u < 1.0 ? '!' : null;
  }
  else if (t < 11.4) { cestas = 1; brinco((t - 9.4) / 2.0, PAR[1], PAR[2], 3); }
  else if (t < 12.8) { const u = t - 11.4; cestas = 1; x = PAR[2]; sac[2] = 1; o = { giro: 2, ojos: 'm', lean: 2, my: 1, sq: 2, mano: { x: 1, y: 1 } }; if (u > 0.8) egg2 = clamp((u - 0.8) / 0.6); }
  else { cestas = t > 14 ? 2 : 1; x = PAR[2]; egg2 = t < 14 ? 1 : 0; conf = true; const u = (t - 12.8) % 1.2, k = clamp(u / 0.8), s = Math.sin(k * Math.PI); dy = -s * 12; o = { giro: u < 0.8 ? 0 : 1, ojos: 'f', sq: u < 0.15 ? 3 : (s > 0.1 ? -2 : 0), bI: s > 0.1 ? 'arriba' : 'medio', bD: s > 0.1 ? 'arriba' : 'medio', rot: t > 15.2 && t < 15.9 ? Math.floor((t - 15.2) / 0.7 * 4) % 4 : 0 }; }
  arbusto(BX[0], sac[0]); arbusto(BX[1], sac[1]); arbusto(BX[2], sac[2]);
  if (egg1 > 0) huevo(BX[1] - 1, 29 - Math.round(Math.sin(clamp(egg1) * Math.PI) * 6), '#f2a3b8', '#ffffff');
  if (egg2 > 0) huevo(BX[2] - 1, 29 - Math.round(Math.sin(clamp(egg2) * Math.PI) * 6), '#ffd479', '#fff3b0');
  fino(x, GY + dy, { ...o, ropa: top => {
    orejasFinas(top, t, o.giro === 2 ? 0.6 : 1, caida);
    if (o.giro === 0 || cestas > 0) { R(9, top + 9, 9, 7, '#a87a3e'); for (let k = 0; k < 9; k += 2) R(9 + k, top + 11, 1, 4, '#7a5428'); R(10, top + 5, 1, 5, '#a87a3e'); R(16, top + 5, 1, 5, '#a87a3e'); R(10, top + 5, 7, 1, '#a87a3e'); if (cestas >= 1) { R(10, top + 6, 3, 4, '#f2a3b8'); P(10, top + 7, '#fff'); } if (cestas >= 2) { R(13, top + 6, 3, 4, '#ffd479'); P(13, top + 7, '#fff7c2'); } }
  } });
  if (q) bocadillo(x + 30, 16, q, -1);
  if (conf) for (let i = 0; i < 26; i++) { const f = ((t - 12.8) * 0.7 + rnd(i)) % 1; P(x - 30 + rnd(i + 3) * 60 + Math.sin(t * 4 + i) * 3, 12 + f * 44, ['#f2a3b8', '#ffd479', '#6fd0c0', '#b79bff', '#fff'][i % 5]); }
}
ANIM2.pascua = [pascua2, 18];

// ---------------------------------------------------------------- 12 de octubre (v2)
// Mira los botes frotándose las manos, mete una mano en el de rojo y se barre la barriga con ella, luego el de amarillo con la otra y el rojo de arriba, retrocede a admirarse con las
// manos en la cintura, saca músculo, salta con voltereta y lo celebra. Las franjas son las de la bandera: rojo, amarillo (el doble de alto) y rojo.
function hispanidad2(t, c) {
  const ROJO = '#c60b1e', AMAR = '#ffc400', ROJO2 = '#8a0a16', AMAR2 = '#b08800', x = 64;
  const F = [{ d0: 1.0, p0: 2.2, p1: 4.2, mano: -1, col: ROJO, fila: 9, h: 3 }, { d0: 4.2, p0: 5.2, p1: 7.6, mano: 1, col: AMAR, fila: 3, h: 6 }, { d0: 7.6, p0: 8.5, p1: 9.8, mano: -1, col: ROJO, fila: 0, h: 3 }];
  const prog = F.map(f => clamp((t - f.p0) / (f.p1 - f.p0)));
  let o = { giro: 0, ojos: 'a' }, dy = 0, dx = 0;
  const act = F.find(f => t >= f.d0 && t < f.p1);
  if (t < 1.0) { o = { giro: 0, ojos: 'a', mx: Math.round(Math.sin(t * 5)), bI: 'frente', bD: 'frente', lean: Math.round(Math.sin(t * 8) * 0.6) }; }                      // se frota las manos
  else if (act) {
    const dip = t < act.p0, lado = act.mano;
    if (dip) { const k = (t - act.d0) / (act.p0 - act.d0); o = { giro: 0, ojos: 'm', mx: lado, [lado < 0 ? 'bI' : 'bD']: 'largoBajo', [lado < 0 ? 'bD' : 'bI']: 'cadera', lean: Math.round(Math.sin(k * 9) * lado * -1), sq: k > 0.4 && k < 0.8 ? 1 : 0 }; }
    else { o = { giro: 0, ojos: 'a', mx: -lado, [lado < 0 ? 'bI' : 'bD']: 'abajo', [lado < 0 ? 'bD' : 'bI']: 'cadera', lean: Math.round(Math.sin(t * 6)) }; dx = Math.round(Math.sin(t * 6) * 0.5) * 2; }
  }
  else if (t < 11.2) { const u = t - 9.8; o = { giro: u < 0.5 ? 1 : 0, ojos: 'f', bI: 'cadera', bD: 'cadera', lean: Math.round(Math.sin(u * 4)) }; if (u > 0.7) { o.bI = o.bD = 'arriba'; o.ojos = 'f'; } }       // se admira y saca músculo
  else if (t < 14.4) {
    const u = t - 11.2;
    if (u < 0.5) o = { giro: 0, ojos: 'c', sq: 3, bI: 'abajo', bD: 'abajo' };
    else if (u < 1.6) { const k = (u - 0.5) / 1.1; dy = salto(k, 28); o = { giro: 0, ojos: 'f', sq: -2, bI: 'arriba', bD: 'arriba', rot: Math.floor(k * 4) % 4 }; }
    else if (u < 1.9) o = { giro: 0, ojos: 'f', sq: 3, bI: 'medio', bD: 'medio' };
    else o = { giro: 0, ojos: 'f', sq: 0, bI: 'arriba', bD: Math.floor(u * 4) % 2 ? 'arriba' : 'medio' };
  }
  else o = { giro: 0, ojos: 'f', bI: 'arriba', bD: Math.floor(t * 4) % 2 ? 'arriba' : 'medio' };
  const c0 = fino(x + dx, GY + dy, { ...o, ropaAntes: true, ropa: top => {
    F.forEach((f, i) => {
      const w = Math.round(16 * prog[i]); if (!w) return;
      if (f.mano < 0) { R(-8, top + f.fila, w, f.h, f.col); } else { R(8 - w, top + f.fila, w, f.h, f.col); }
    });
    if (act && t >= act.p0) {                                                                    // el brazo que pinta, del color de la pintura, llega hasta donde va la franja
      const i = F.indexOf(act), w = Math.round(16 * prog[i]), fila = act.fila + Math.round((Math.sin(t * 9) * 0.5 + 0.5) * (act.h - 1)), oscuro = act.col === ROJO ? ROJO2 : AMAR2;
      if (act.mano < 0) { R(-12, top + fila, 4 + w, 2, act.col); R(-8 + w - 1, top + fila, 3, 3, oscuro); R(-12, top + 4, 4, 4, act.col); }
      else { R(8 - w, top + fila, 4 + w, 2, act.col); R(8 - w - 2, top + fila, 3, 3, oscuro); R(8, top + 4, 4, 4, act.col); }
    }
    if (!(act && t >= act.p0 && act.mano < 0) && t >= F[0].p1) R(-12, top + 4, 4, 4, ROJO);                         // las manos ya llevan el color de la última pintura
    if (!(act && t >= act.p0 && act.mano > 0) && t >= F[1].p1) R(8, top + 4, 4, 4, AMAR);
  } });
  // los dos botes, con una salpicadura al meter la mano
  const bote = (bx, col, osc) => { R(bx, 42, 14, 14, col); R(bx, 42, 14, 2, osc); R(bx, 48, 14, 2, osc); R(bx + 14, 44, 1, 4, '#d9d9d9'); R(bx - 1, 41, 16, 1, '#d9d9d9'); };
  bote(18, ROJO, ROJO2); bote(98, AMAR, AMAR2);
  if (act && t < act.p0) { const k = (t - act.d0) / (act.p0 - act.d0); for (let i = 0; i < 4; i++) P((act.mano < 0 ? 24 : 104) + (i - 1.5) * 3, 38 - ((k * 3 + i / 4) % 1) * 8, act.col); }
  if (t >= 11.2) for (let i = 0; i < 26; i++) { const f = ((t - 11.2) * 0.7 + rnd(i)) % 1; P(x - 40 + rnd(i + 3) * 80 + Math.sin(t * 4 + i) * 3, 12 + f * 44, i % 2 ? ROJO : AMAR); }
  if (t >= 12.2) bocadillo(x + 26, c0.top - 6, 'OLE!', -1);
}
ANIM2.hispanidad = [hispanidad2, 15];
