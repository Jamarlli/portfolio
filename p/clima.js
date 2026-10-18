// El tiempo que hace fuera de mi ventana: lluvia, nubes, niebla y tormenta.
// Fuente: Open-Meteo (gratis y sin clave; mezcla los modelos de AEMET/Météo-France con las estaciones y satélites más cercanos a las coordenadas).
// Si no responde (sin red, bloqueado), el cuarto se queda soleado. Con #clima=sol|nublado|llovizna|lluvia|fuerte|tormenta|niebla se fuerza uno para probar.
import { LAT, LON } from './sol.js';

const hash = new URLSearchParams(location.hash.slice(1));
export const PRESETS = {
  sol:      { lluvia: 0,   nubes: 0.04, niebla: 0,   tormenta: false, viento: 6,  temp: 22 },
  nubes:    { lluvia: 0,   nubes: 0.45, niebla: 0,   tormenta: false, viento: 10, temp: 19 },
  nublado:  { lluvia: 0,   nubes: 0.95, niebla: 0.1, tormenta: false, viento: 12, temp: 17 },
  llovizna: { lluvia: 0.4, nubes: 0.95, niebla: 0.2, tormenta: false, viento: 10, temp: 16 },
  lluvia:   { lluvia: 3,   nubes: 1,    niebla: 0.2, tormenta: false, viento: 16, temp: 15 },
  fuerte:   { lluvia: 12,  nubes: 1,    niebla: 0.3, tormenta: false, viento: 28, temp: 14 },
  tormenta: { lluvia: 18,  nubes: 1,    niebla: 0.3, tormenta: true,  viento: 36, temp: 14 },
  niebla:   { lluvia: 0,   nubes: 0.9,  niebla: 0.85, tormenta: false, viento: 3, temp: 12 },
};
// qué se ve por la ventana en cada momento; lo lee quien pinta (lluvia.js) y quien mezcla la luz (horas.js)
export const clima = { lluvia: 0, nubes: 0.04, niebla: 0, tormenta: false, viento: 6, temp: null, fuente: 'ninguna', forzado: null };

const datos = { hora: null, ahora: null, cargado: 0 };
const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&timezone=Europe%2FMadrid&past_days=1&forecast_days=3&wind_speed_unit=kmh`
  + '&current=temperature_2m,precipitation,cloud_cover,weather_code,wind_speed_10m'
  + '&hourly=temperature_2m,precipitation,cloud_cover,weather_code,wind_speed_10m';

// intensidad de la lluvia (0..1) para pintarla: llovizna ~0,1, lluvia ~0,5, aguacero ~0,95 (mm/h)
export const intensidadLluvia = mm => (mm < 0.05 ? 0 : 1 - Math.exp(-mm / 3.2));

// códigos WMO: 45-48 niebla, 51-57 llovizna, 61-67 lluvia, 80-82 chubascos, 95-99 tormenta
function desdeCodigo(c) {
  return { niebla: c === 45 || c === 48 ? 0.8 : 0, tormenta: c >= 95, lluviaCodigo: [51, 53, 55, 56, 57].includes(c) ? 0.3 : [61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(c) ? 1.5 : 0 };
}

export async function cargar() {
  if (hash.get('clima')) return;
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
setInterval(() => { if (!hash.get('clima')) { datos.cargado = 0; try { sessionStorage.removeItem('clima'); } catch { /* da igual */ } cargar(); } }, 15 * 60000);

const lerp = (a, b, t) => a + (b - a) * t;
// el tiempo en el instante `ms` (Unix): de los datos por hora (interpolando) o, si es ahora mismo, de la medida actual
export function ponerClima(ms, preset = null) {
  const forzado = preset || hash.get('clima');
  if (forzado && PRESETS[forzado]) { Object.assign(clima, PRESETS[forzado], { fuente: 'simulado', forzado }); }
  else if (datos.hora) {
    const h = datos.hora, tiempo = h.time.map(s => Date.parse(s + ':00' + offsetMadrid(s)));
    let i = tiempo.findIndex(t => t > ms) - 1; if (i < 0) i = ms < tiempo[0] ? 0 : tiempo.length - 2;
    const f = Math.min(1, Math.max(0, (ms - tiempo[i]) / (tiempo[i + 1] - tiempo[i]))), v = k => lerp(h[k][i], h[k][i + 1], f), c = h.weather_code[f < 0.5 ? i : i + 1];
    const { niebla, tormenta, lluviaCodigo } = desdeCodigo(c);
    let mm = v('precipitation');
    if (datos.ahora && Math.abs(ms - Date.now()) < 20 * 60000) mm = Math.max(mm, datos.ahora.precipitation * 3600 / (datos.ahora.interval || 900));   // ahora mismo: lo medido en el último cuarto de hora
    Object.assign(clima, { lluvia: mm > 0 ? mm : lluviaCodigo * 0.3, nubes: Math.min(1, Math.max(0, v('cloud_cover') / 100)), niebla, tormenta, viento: v('wind_speed_10m'), temp: v('temperature_2m'), fuente: 'open-meteo', forzado: null });
  } else Object.assign(clima, PRESETS.sol, { fuente: 'ninguna', forzado: null, temp: null });
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
