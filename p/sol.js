// Dónde está el sol sobre Valencia y cuánta luz entra por mi ventana, que mira al sudoeste.
// La posición sale del algoritmo astronómico de SunCalc/NOAA (fecha, hora y coordenadas); aquí no hay nada horneado.
export const LAT = 39.48, LON = -0.39;                  // la zona de la ventana (redondeada a ~1 km: basta para el sol y para el tiempo)
export const FACHADA = 225 * Math.PI / 180;             // la ventana mira al sudoeste (225° desde el norte, hacia el este)
const RAD = Math.PI / 180, DIA = 86400000;

// fechaMs: milisegundos Unix. Devuelve { az, el } en radianes: az desde el norte hacia el este, el sobre el horizonte
export function posicionSol(fechaMs) {
  const d = fechaMs / DIA - 0.5 + 2440588 - 2451545;
  const M = RAD * (357.5291 + 0.98560028 * d), C = RAD * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const L = M + C + RAD * 102.9372 + Math.PI, E = RAD * 23.4397;
  const dec = Math.asin(Math.sin(E) * Math.sin(L)), ra = Math.atan2(Math.sin(L) * Math.cos(E), Math.cos(L));
  const phi = RAD * LAT, H = RAD * (280.16 + 360.9856235 * d) + RAD * LON - ra;
  const el = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi)) + Math.PI;   // SunCalc la mide desde el sur
  return { az: (az + 2 * Math.PI) % (2 * Math.PI), el };
}

// dirección HACIA el sol en las coordenadas del cuarto (x: a la derecha mirando por la ventana, y: arriba, z: de la ventana a la puerta).
// La ventana está en la pared z = 0 y mira hacia -z: ese es el sudoeste; el sol entra cuando su azimut cae a menos de 90° del sudoeste
export function direccionSol(az, el) {
  const d = az - FACHADA, c = Math.cos(el);
  return [c * Math.sin(d), Math.sin(el), -c * Math.cos(d)];
}

// pesos (día, atardecer, noche) de la luz ambiente según la altura del sol (grados): noche con el sol a más de 6° bajo el horizonte (fin del crepúsculo civil)
const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function pesosSol(elGrados) {
  const n = 1 - suave(-6, 1, elGrados), d = suave(3, 14, elGrados);
  return [d, 1 - d - n, n];
}

// el sol directo: color (naranja con el sol bajo, blanco cálido arriba) e intensidad (se apaga al llegar al horizonte)
export function colorSol(elGrados) {
  const t = suave(2, 38, elGrados), r = 1, g = 0.58 + 0.37 * t, b = 0.22 + 0.66 * t;
  return [r, g, b];
}
export const intensidadSol = elGrados => suave(-0.5, 5, elGrados) * (0.45 + 0.55 * suave(0, 30, elGrados));

// milisegundos Unix de «hoy a las h (hora de Valencia)»: la hora se elige a mano con el deslizador
const franja = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
export function fechaValencia(h, ahora = Date.now()) {
  const p = Object.fromEntries(franja.formatToParts(new Date(ahora)).map(x => [x.type, +x.value]));
  const localComoUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second), desfase = localComoUTC - Math.floor(ahora / 1000) * 1000;   // Madrid - UTC
  return Date.UTC(p.year, p.month - 1, p.day) + h * 3600000 - desfase;
}
