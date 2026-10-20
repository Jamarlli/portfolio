// Clawd «fino»: el mismo personaje con las proporciones del GIF de «arreglar el bug» (cuerpo de 16 celdas de ancho y 12 de alto, ojos de 2 x 2, patas de 2 x 4, brazos de 4 x 4; cada
// celda son 2 x 2 píxeles) y con tres poses (de frente, tres cuartos y de perfil), de modo que puede girarse. Lo usa la escena del 12 de octubre (web/clawd.js la importa).
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


const salto = (u, alto) => -Math.sin(clamp(u) * Math.PI) * alto;               // arco de un salto (u de 0 a 1)
const ojoParpadeo = (t, per = 3.2) => (t % per) > per - 0.15;
export const ANIM2 = {};                                                        // (aquí solo está la Hispanidad)

// ---------------------------------------------------------------- 12 de octubre
// Una bandera de España ondea en su asta. Clawd llega andando de perfil, se emociona al verla, se acerca y le da un beso largo. Al retirarse se gira hacia quien mira
// (de perfil a tres cuartos y de frente) y se ve que lleva la cara pintada con los colores de la bandera: rojo, amarillo (el doble de alto) y rojo. Salta con voltereta y lo celebra.
function hispanidad2(t, c) {
  const ROJO = '#c60b1e', AMAR = '#ffc400', X0 = 62, X1 = 96, Y0 = 24;
  const contacto = t >= 3.4 && t < 5.6;
  const amp = contacto ? 2.2 + Math.sin(t * 14) * 0.6 : 1;
  // la bandera, con el borde libre ondeando más que el lado del asta
  for (let i = 0; i < X1 - X0; i++) {
    const k = i / (X1 - X0), off = Math.round(Math.sin(t * 5 + i * 0.35) * (0.5 + amp * (1 - k) * 2.2));
    R(X0 + i, Y0 + off, 1, 5, ROJO); R(X0 + i, Y0 + off + 5, 1, 10, AMAR); R(X0 + i, Y0 + off + 15, 1, 5, ROJO);
    if (i >= 10 && i <= 16) { R(X0 + i, Y0 + off + 7, 1, 7, '#a06a2a'); if (i >= 12 && i <= 14) { R(X0 + i, Y0 + off + 8, 1, 2, ROJO); R(X0 + i, Y0 + off + 11, 1, 2, '#2a5aa8'); } }   // el escudo
  }
  R(96, 20, 2, 36, '#b8bcc4'); R(95, 17, 4, 4, '#e0b020');
  // Clawd: llega, se emociona, se acerca, besa, se retira, se gira y se enseña
  let x = 4, o = { giro: 2, ojos: 'a' }, dy = 0, pintado = t >= 5.0;
  if (t < 2.4) { x = mezcla(4, 34, suave(t / 2.4)); o = { giro: 2, ojos: 'a', paso: t < 2.4 ? (t * 1.5) % 1 : -1 }; }
  else if (t < 3.4) { const u = t - 2.4; x = mezcla(34, 38, suave(u)); o = { giro: 2, ojos: u < 0.5 ? 'g' : 'f', lean: Math.round(u * 2), sq: u > 0.6 ? 1 : 0, mano: { x: 0, y: -1 } }; dy = u < 0.5 ? salto(u / 0.5, 5) : 0; }
  else if (t < 5.6) { const u = t - 3.4; x = 40 + (Math.sin(u * 9) > 0.4 ? 1 : 0); o = { giro: 2, ojos: 'c', lean: 3, sq: 1, mano: { x: 0, y: -1 } }; }
  else if (t < 6.6) { const u = (t - 5.6) / 1.0; x = mezcla(40, 34, suave(u)); o = { giro: 2, ojos: 'g', lean: Math.round(2 * (1 - u)), mano: { x: 0, y: 0 } }; }
  else if (t < 7.4) { const u = t - 6.6; x = 34; o = { giro: u < 0.4 ? 1 : 0, ojos: 'g' }; }
  else if (t < 9.4) { const u = t - 7.4; x = 34; o = { giro: 0, ojos: u > 0.7 ? 'f' : 'g', bI: 'arriba', bD: 'arriba', sq: u < 0.15 ? 2 : 0, lean: Math.round(Math.sin(u * 5)) }; }
  else if (t < 12.2) {
    const u = t - 9.4; x = 34;
    if (u < 0.5) o = { giro: 0, ojos: 'c', sq: 3, bI: 'abajo', bD: 'abajo' };
    else if (u < 1.6) { const k = (u - 0.5) / 1.1; dy = salto(k, 26); o = { giro: 0, ojos: 'f', sq: -2, bI: 'arriba', bD: 'arriba', rot: Math.floor(k * 4) % 4 }; }
    else if (u < 1.9) o = { giro: 0, ojos: 'f', sq: 3, bI: 'medio', bD: 'medio' };
    else o = { giro: 0, ojos: 'f', bI: 'cadera', bD: 'cadera', lean: Math.round(Math.sin((u - 1.9) * 4)) };
  }
  else { x = 34; o = { giro: 0, ojos: ojoParpadeo(t, 2.4) ? 'c' : 'f', bI: 'cadera', bD: 'cadera', lean: Math.round(Math.sin(t * 3)) }; }
  const c0 = fino(x, GY + dy, { ...o, ropaAntes: true, ropa: top => {
    if (pintado && o.giro !== 2) {                                                                // la cara pintada: 3 franjas, 3 : 6 : 3
      const x0 = o.giro === 1 ? -6 : -8, w = o.giro === 1 ? 14 : 16;
      R(x0, top, w, 3, ROJO); R(x0, top + 3, w, 6, AMAR); R(x0, top + 9, w, 3, ROJO);
    }
  } });
  // besos: corazones que suben, el «¡muac!» y un destello al quedar pintado
  if (contacto) { for (let i = 0; i < 4; i++) { const f = ((t - 3.4) * 0.9 + i / 4) % 1; alfa(Math.sin(f * Math.PI)); corazon(40 + Math.sin(f * 6 + i) * 5 + i * 3, 18 - f * 6 + (i % 2) * 6, '#e8505b'); } alfa(1); }
  if (t >= 3.8 && t < 5.4) bocadillo(24, 8, c.en ? 'MWAH!' : 'MUAH!', 1);
  if (t >= 6.6 && t < 7.6) for (let i = 0; i < 8; i++) chispa(x - 14 + i * 4, GY - 26 + Math.sin(i * 2) * 6, ['#ffd479', '#ffffff', ROJO][i % 3]);
  if (t >= 9.4) for (let i = 0; i < 26; i++) { const f = ((t - 9.4) * 0.7 + rnd(i)) % 1; P(10 + rnd(i + 3) * 70 + Math.sin(t * 4 + i) * 3, 12 + f * 44, i % 2 ? ROJO : AMAR); }
  if (t >= 10.4 && t < 14.5) bocadillo(x + 30, c0.top - 8, 'OLE!', -1);
}
ANIM2.hispanidad = [hispanidad2, 14];
