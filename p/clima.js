// El tiempo que hace fuera de mi ventana: lluvia, nubes, niebla y tormenta.
// Fuente: Open-Meteo (gratis y sin clave; mezcla los modelos de AEMET/Météo-France con las estaciones y satélites más cercanos a las coordenadas).
// Si no responde (sin red, bloqueado), el cuarto se queda soleado. Con #clima=sol|nublado|llovizna|lluvia|fuerte|tormenta|niebla se fuerza uno para probar.
import { LAT, LON } from './sol.js';

const hash = new URLSearchParams(location.hash.slice(1));
export const PRESETS = {
  sol:      { lluvia: 0,   nubes: 0.04, niebla: 0,   tormenta: false, viento: 6,  dir: 225, temp: 22 },
  nubes:    { lluvia: 0,   nubes: 0.45, niebla: 0,   tormenta: false, viento: 10, dir: 225, temp: 19 },
  nublado:  { lluvia: 0,   nubes: 0.95, niebla: 0.1, tormenta: false, viento: 12, dir: 225, temp: 17 },
  llovizna: { lluvia: 0.4, nubes: 0.95, niebla: 0.2, tormenta: false, viento: 10, dir: 225, temp: 16 },
  lluvia:   { lluvia: 3,   nubes: 1,    niebla: 0.2, tormenta: false, viento: 16, dir: 225, temp: 15 },
  fuerte:   { lluvia: 12,  nubes: 1,    niebla: 0.3, tormenta: false, viento: 28, dir: 225, temp: 14 },
  tormenta: { lluvia: 18,  nubes: 1,    niebla: 0.3, tormenta: true,  viento: 36, dir: 225, temp: 14 },
  niebla:   { lluvia: 0,   nubes: 0.9,  niebla: 0.85, tormenta: false, viento: 3, dir: 225, temp: 12 },
};
// qué se ve por la ventana en cada momento; lo lee quien pinta (lluvia.js) y quien mezcla la luz (horas.js)
export const clima = { nieva: false, lluvia: 0, nubes: 0.04, niebla: 0, tormenta: false, viento: 6, dir: 225, racha: 10, temp: null, fuente: 'ninguna', forzado: null, origen: { lluvia: 'modelo', viento: 'modelo' } };

// el tiempo a medida: lo que se ajusta con los deslizadores del reloj (empieza como un preset y se toca a gusto)
export const personalizado = { ...PRESETS.sol, temp: 20 };
// lo medido de verdad: estaciones (est, de /api/tiempo) y radar de lluvia (radar), cada uno con la hora a la que se leyó
const datos = { hora: null, ahora: null, cargado: 0, est: null, radar: null };
const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&timezone=Europe%2FMadrid&past_days=1&forecast_days=3&wind_speed_unit=kmh`
  + '&current=temperature_2m,precipitation,cloud_cover,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m'
  + '&hourly=temperature_2m,precipitation,cloud_cover,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m';

// intensidad de la lluvia (0..1) para pintarla: llovizna ~0,1, lluvia ~0,5, aguacero ~0,95 (mm/h)
export const intensidadLluvia = mm => (mm < 0.05 ? 0 : 1 - Math.exp(-mm / 3.2));

// códigos WMO: 45-48 niebla, 51-57 llovizna, 61-67 lluvia, 80-82 chubascos, 95-99 tormenta
function desdeCodigo(c) {
  return { niebla: c === 45 || c === 48 ? 0.8 : 0, tormenta: c >= 95 };
}

export async function cargar() {
  if (hash.get('clima')) return;
  await Promise.all([cargarModelo(), cargarObservado()]);
}
async function cargarModelo() {
  try {
    const guardado = JSON.parse(sessionStorage.getItem('clima') || 'null');
    if (guardado && Date.now() - guardado.t < 10 * 60000) { Object.assign(datos, guardado.d, { cargado: guardado.t }); return; }
  } catch { /* sin almacenamiento */ }
  try {
    const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 5000);
    const j = await (await fetch(url, { signal: ctl.signal })).json(); clearTimeout(t);
    datos.hora = j.hourly; datos.ahora = j.current; datos.cargado = Date.now();
    try { sessionStorage.setItem('clima', JSON.stringify({ t: datos.cargado, d: { hora: datos.hora, ahora: datos.ahora } })); } catch { /* da igual */ }
  } catch (e) { console.info('sin datos del tiempo:', e.message); }
}
// vuelve a pedirlo cada 15 minutos mientras la página está abierta
setInterval(() => { if (!hash.get('clima')) { datos.cargado = 0; try { sessionStorage.removeItem('clima'); } catch { /* da igual */ } cargarModelo(); } }, 15 * 60000);
setInterval(() => { if (!hash.get('clima')) cargarObservado(); }, 5 * 60000);          // las estaciones y el radar se renuevan cada pocos minutos

// ---- radar de lluvia (RainViewer: composición de radares, imagen nueva cada 10 min, gratis, permite CORS). Se mira el píxel (~1 km) de mi ventana y sus vecinos
const ZOOM = 7, mercator = (() => { const n = 2 ** ZOOM, x = (LON + 180) / 360 * n, y = (1 - Math.asinh(Math.tan(LAT * Math.PI / 180)) / Math.PI) / 2 * n; return { tx: Math.floor(x), ty: Math.floor(y), px: Math.floor((x % 1) * 256), py: Math.floor((y % 1) * 256) }; })();
// la paleta del radar no trae mm: de translúcido (eco flojo, se ignora) a azul claro (llovizna), azul oscuro (lluvia), amarillo (aguacero)
function mmDeColor(r, g, b, a) {
  if (a === 0) return 0;
  if (a < 255) return 0;                                                                      // los ecos translúcidos son lluvia muy débil o ruido (suelo, mar): no cuentan
  if (r > 200) return 20 + 40 * Math.min(1, Math.max(0, (238 - g) / 89));                     // amarillo/naranja
  return 0.5 + 9.5 * Math.pow(Math.min(1, Math.max(0, (221 - g) / 150)), 1.5);               // azules
}
async function cargarRadar() {
  const mapas = await (await fetch('https://api.rainviewer.com/public/weather-maps.json')).json();
  const f = mapas.radar.past.at(-1), url = `${mapas.host}${f.path}/256/${ZOOM}/${mercator.tx}/${mercator.ty}/0/0_0.png`;
  const bmp = await createImageBitmap(await (await fetch(url)).blob()), cv = new OffscreenCanvas(256, 256), cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(bmp, 0, 0);
  const d = cx.getImageData(Math.max(0, mercator.px - 1), Math.max(0, mercator.py - 1), 3, 3).data, pesos = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  let mm = 0; for (let i = 0; i < 9; i++) mm += mmDeColor(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], d[i * 4 + 3]) * pesos[i] / 16;
  datos.radar = { mm, hora: f.time * 1000, leido: Date.now() };
}
async function cargarEstaciones() {
  const r = await fetch('/api/tiempo'); if (!r.ok || !(r.headers.get('content-type') || '').includes('json')) throw new Error('sin estaciones');
  datos.est = { ...(await r.json()), leido: Date.now() };
}
export async function cargarObservado() {
  const con = p => Promise.race([p, new Promise((_, no) => setTimeout(() => no(new Error('tarda')), 6000))]);
  await Promise.all([con(cargarRadar()).catch(e => console.info('sin radar:', e.message)), con(cargarEstaciones()).catch(e => console.info('sin estaciones:', e.message))]);
}
// lo observado ahora mismo (si hay y es reciente): lluvia fusionada de radar y pluviómetros, y viento de las estaciones
function observado() {
  const ahora = Date.now(), rad = datos.radar && ahora - datos.radar.hora < 30 * 60000 ? datos.radar : null, est = datos.est && ahora - datos.est.leido < 20 * 60000 ? datos.est : null;
  const lluviaEst = est?.lluvia ?? null;
  let mm = null, origen = null;
  if (rad || lluviaEst) {
    let r = rad ? rad.mm : null; const e = lluviaEst ? lluviaEst.mmh : null;
    if (r != null && r < 0.3 && e != null && e < 0.05) r = 0;                      // un eco débil del radar con los pluviómetros secos no es lluvia
    mm = Math.max(r ?? 0, e ?? 0); origen = rad && lluviaEst ? 'radar+estaciones' : rad ? 'radar' : 'estaciones';
  }
  return { mm, origen, viento: est?.viento ?? null, rad, est };
}
// qué se sabe y de dónde viene, para mostrarlo en el panel del reloj
export function fuentes() { const o = observado(); return { rad: o.rad, est: o.est, mm: o.mm, modelo: !!datos.hora, cargado: datos.cargado }; }

const lerp = (a, b, t) => a + (b - a) * t;
// el tiempo en el instante `ms` (Unix): de los datos por hora (interpolando) o, si es ahora mismo, de la medida actual
export function ponerClima(ms, preset = null) {
  const forzado = preset || hash.get('clima');
  if (forzado && (PRESETS[forzado] || forzado === 'a-medida')) { const p = forzado === 'a-medida' ? personalizado : PRESETS[forzado]; Object.assign(clima, p, { nieva: false, racha: p.viento * 1.5, fuente: 'simulado', forzado, origen: { lluvia: 'simulado', viento: 'simulado' } }); }
  else if (datos.hora) {
    const h = datos.hora, tiempo = h.time.map(s => Date.parse(s + ':00' + offsetMadrid(s)));
    let i = tiempo.findIndex(t => t > ms) - 1; if (i < 0) i = ms < tiempo[0] ? 0 : tiempo.length - 2;
    const f = Math.min(1, Math.max(0, (ms - tiempo[i]) / (tiempo[i + 1] - tiempo[i]))), v = k => lerp(h[k][i], h[k][i + 1], f), c = h.weather_code[f < 0.5 ? i : i + 1];
    const { niebla, tormenta } = desdeCodigo(c);
    let mm = v('precipitation');
    if (datos.ahora && Math.abs(ms - Date.now()) < 20 * 60000) mm = Math.max(mm, datos.ahora.precipitation * 3600 / (datos.ahora.interval || 900));   // ahora mismo: lo medido en el último cuarto de hora
    const angulo = k => { const a = h[k][f < 0.5 ? i : i + 1]; return a == null ? 225 : a; };      // la dirección no se interpola (359° y 1°): la de la hora más cercana
    Object.assign(clima, { nieva: [71, 73, 75, 77, 85, 86].includes(c), lluvia: mm > 0 ? mm : 0, nubes: Math.min(1, Math.max(0, v('cloud_cover') / 100)), niebla, tormenta, viento: v('wind_speed_10m'), dir: angulo('wind_direction_10m'), racha: v('wind_gusts_10m'), temp: v('temperature_2m'), fuente: 'open-meteo', forzado: null, origen: { lluvia: 'modelo', viento: 'modelo' } });
    // ahora mismo se manda lo medido: el modelo dice «llovizna» con códigos y acumulados por hora que no son lo que cae en este minuto
    if (Math.abs(ms - Date.now()) < 20 * 60000) {
      const o = observado();
      if (o.mm != null) { clima.lluvia = o.mm; clima.origen.lluvia = o.origen; }
      if (o.viento) { clima.viento = o.viento.kmh; clima.dir = o.viento.azimut; clima.racha = Math.max(o.viento.racha, o.viento.kmh); clima.origen.viento = 'estaciones'; }
    }
  } else Object.assign(clima, PRESETS.sol, { nieva: false, fuente: 'ninguna', forzado: null, temp: null });
  if (hash.get('lluvia') != null) clima.lluvia = +hash.get('lluvia');
  if (hash.get('nubes') != null) clima.nubes = +hash.get('nubes');
  return clima;
}
// los datos de Open-Meteo vienen en hora de Valencia sin desfase: se le pone el de esa fecha
const desfases = new Map();
function offsetMadrid(s) {
  const dia = s.slice(0, 10); let o = desfases.get(dia);
  if (!o) { const p = new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Madrid', timeZoneName: 'longOffset' }).formatToParts(new Date(dia + 'T12:00:00Z')).find(x => x.type === 'timeZoneName').value; o = p === 'GMT' ? '+00:00' : p.replace('GMT', ''); desfases.set(dia, o); }
  return o;
}
export const hayDatos = () => !!datos.hora;
// una frase corta para el botón del reloj
export function resumen() {
  const i = intensidadLluvia(clima.lluvia);
  const icono = clima.tormenta ? '⛈' : i > 0.45 ? '🌧' : i > 0 ? '🌦' : clima.niebla > 0.5 ? '🌫' : clima.nubes > 0.7 ? '☁' : clima.nubes > 0.3 ? '⛅' : '';
  return { icono, temp: clima.temp == null ? '' : `${Math.round(clima.temp)}°` };
}
