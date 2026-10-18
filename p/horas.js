// Luz según la hora de Valencia: funde los horneados (día, atardecer, noche) y las tres vistas de la ventana.
// La mezcla no se hace en cada píxel de cada fotograma: se pinta una vez en una textura cuando cambia algo (la hora, el tiempo, el sol, una lámpara)
// y, si la luz es pura (de día o de noche, sin sol dinámico), se usa directamente el horneado de esa hora.
//
// Dos modos:
//  - clásico: los horneados llevan el sol de esa hora ya cocinado (día, atardecer, noche).
//  - sol dinámico (si están cuarto_luz_dia_nosol.webp, cuarto_luz_atardecer_nosol.webp y cuarto_albedo.webp): los horneados son solo la luz del cielo y el sol
//    directo se suma encima en directo (soldirecto.js: dónde está de verdad el sol, con sus sombras), atenuado por las nubes.
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { cargarTextura } from './texturas.js';

// pesos (día, atardecer, noche) a lo largo del día, principios de octubre en Valencia (amanece ~7:55, anochece ~19:35); solo si no llegan los del sol
const CLAVES = [
  [0.0, 0, 0, 1], [6.6, 0, 0, 1], [7.9, 0, 1, 0], [9.2, 1, 0, 0],
  [17.4, 1, 0, 0], [19.2, 0, 1, 0], [20.6, 0, 0, 1], [24.0, 0, 0, 1],
];
export function pesos(h) {
  for (let i = 0; i < CLAVES.length - 1; i++) {
    const [h0, ...a] = CLAVES[i], [h1, ...b] = CLAVES[i + 1];
    if (h >= h0 && h <= h1) { const t = (h - h0) / (h1 - h0 || 1), s = t * t * (3 - 2 * t); return a.map((v, k) => v + (b[k] - v) * s); }
  }
  return [0, 0, 1];
}
const reloj = new Intl.DateTimeFormat('es-ES', { timeZone: 'Europe/Madrid', hour: 'numeric', minute: 'numeric', hour12: false });
export function horaValencia() {
  const p = reloj.formatToParts(new Date());
  return +p.find(x => x.type === 'hour').value + +p.find(x => x.type === 'minute').value / 60;
}

export const W = { value: new THREE.Vector3(0, 1, 0) };          // pesos (día, atardecer, noche) de la hora actual
// lámparas del escritorio: cuánta luz ponen (1 = encendida del todo, 0 = apagada), a cualquier hora. x = barra de luz, y = flexo
export const LAMP = { value: new THREE.Vector2(0, 0) };
// el cielo del momento: color e intensidad del sol directo (rgb), cuánta luz de cielo queda con nubes (amb), cuánto color (sat), cuánto rebota el sol (reb) y la escala (k)
export const CIELO = { sol: { value: new THREE.Vector3(0, 0, 0) }, amb: { value: 1 }, sat: { value: 1 }, reb: { value: 0.3 }, k: { value: 1 } };

// cada juego: las texturas (día, atardecer, noche), la textura donde se pinta la mezcla y los materiales que la usan
const juegos = [];
let renderer = null, aplicados = null, sunTex = null;
const mezcla = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tD: { value: null }, tA: { value: null }, tN: { value: null }, tAo: { value: null }, tNo: { value: null }, tSh: { value: null }, tAlb: { value: null }, tSun: { value: null },
    w: W, lamp: LAMP, usarLamp: { value: 0 }, usarSol: { value: 0 }, solRGB: CIELO.sol, amb: CIELO.amb, sat: CIELO.sat, reb: CIELO.reb, kSol: CIELO.k },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  // la luz = el horneado sin lámparas (tAo, tNo) + lo que añaden las lámparas (el horneado con ellas menos sin ellas), en la cantidad que se les pida (lamp)
  // (tSh: parte que pone la barra de luz de noche; al atardecer solo hay barra)
  fragmentShader: `uniform sampler2D tD, tA, tN, tAo, tNo, tSh, tAlb, tSun; uniform vec3 w, solRGB; uniform vec2 lamp; uniform float usarLamp, usarSol, amb, sat, reb, kSol; varying vec2 vUv;
    void main(){
      vec4 d = texture2D(tD, vUv), on = d * w.x + texture2D(tA, vUv) * w.y + texture2D(tN, vUv) * w.z, c = on;
      if (usarLamp > .5) {
        vec4 ao = texture2D(tAo, vUv), no = texture2D(tNo, vUv), na = texture2D(tA, vUv), nn = texture2D(tN, vUv);
        float ww = w.y + w.z + .02, sh = texture2D(tSh, vUv).r, s = (w.y + (w.z + .02) * sh) / ww;
        vec4 luz = max((max(na - ao, 0.) * w.y + max(nn - no, 0.) * (w.z + .02)) / ww, 0.);      // la luz de las lámparas a esa hora (de día, la de noche)
        c = d * w.x + ao * w.y + no * w.z + luz * clamp(lamp.x * s + lamp.y * (1. - s), 0., 1.);
      }
      if (usarSol > .5) {                                  // luz de cielo (con nubes) + sol directo y su rebote, por el color propio de cada material
        float directa = texture2D(tSun, vUv).r, rebote = textureLod(tSun, vUv, 4.).r;
        c.rgb = c.rgb * amb + texture2D(tAlb, vUv).rgb * solRGB * (directa + reb * rebote) * kSol;
      }
      float l = dot(c.rgb, vec3(.2126, .7152, .0722));
      gl_FragColor = vec4(mix(vec3(l), c.rgb, sat), c.a);
    }`,
  depthTest: false, depthWrite: false,
}));

function juego(dia, atar, noche, sol) {
  const img = atar.image, rt = new THREE.WebGLRenderTarget(img.width, img.height, {
    colorSpace: THREE.SRGBColorSpace, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, anisotropy: 8,
  });
  rt.texture.flipY = false;
  const j = { tex: [dia, atar, noche], rt, mats: [], ext: null, sol }; juegos.push(j); return j;
}

// empieza a descargar los horneados de cada hora (a la vez que el cuarto). Las últimas son opcionales (null si faltan)
const OBLIGATORIAS = ['cuarto_luz_noche.webp', 'vista_dia.webp', 'vista_noche.webp', 'vista_atardecer.webp'];
const OPCIONALES = ['cuarto_luz_atardecer_off.png', 'cuarto_luz_noche_off.webp', 'cuarto_luz_noche_share.webp',      // lámparas apagadas
  'cuarto_luz_dia_nosol.webp', 'cuarto_luz_atardecer_nosol.webp', 'cuarto_luz_atardecer_nosol_off.webp', 'cuarto_albedo.webp'];       // sol dinámico
export const cargar = base => Promise.all([...OBLIGATORIAS, ...OPCIONALES]
  .map((f, i) => cargarTextura(base + f, { flipY: false }).catch(e => { if (i < OBLIGATORIAS.length) throw e; return null; })));   // orientación de glTF

export async function prepararHoras(meshes, cargando, rend) {
  renderer = rend;
  let noche, vDia, vNoche, vAtar, aOff, nOff, share, diaN, atarN, atarNOff, albedo;
  try { [noche, vDia, vNoche, vAtar, aOff, nOff, share, diaN, atarN, atarNOff, albedo] = await cargando; } catch { return false; }   // horneado de una sola hora: se queda en atardecer
  const solDin = !!(diaN && atarN && albedo), dia = diaN;
  let cuarto = null, vista = null;
  for (const o of meshes) {
    const m = o.material; if (!m?.map) continue;
    if (o.userData.mat === 'horneado') {
      cuarto ??= solDin ? juego(diaN, atarN, noche, true) : juego(dia, m.map, noche, false); cuarto.mats.push(m);
      if (nOff && share) cuarto.ext = [solDin ? (atarNOff || atarN) : aOff, nOff, share];
      if (!cuarto.ext?.[0]) cuarto.ext = null;
    } else if (o.name.startsWith('paisaje')) (vista ??= juego(vDia, vAtar, vNoche, false)).mats.push(m);   // el glTF trae la última hora horneada: se cambia por estas
  }
  if (cuarto && solDin) mezcla.material.uniforms.tAlb.value = albedo;
  return [noche, vDia, vNoche, vAtar, ...[aOff, nOff, share, diaN, atarN, atarNOff, albedo].filter(Boolean)];   // las texturas, para subirlas a la GPU antes de empezar
}

// pone en los materiales la luz del estado actual; devuelve true si ha cambiado algo
let lampAplicada = new THREE.Vector2(0, 0), cieloAplicado = '';
function aplicar(forzar = false) {
  const w = W.value, cielo = `${CIELO.sol.value.toArray()}|${CIELO.amb.value}|${CIELO.sat.value}|${CIELO.reb.value}|${CIELO.k.value}`;
  if (!forzar && aplicados && aplicados.equals(w) && lampAplicada.equals(LAMP.value) && cielo === cieloAplicado) return false;
  aplicados = w.clone(); lampAplicada.copy(LAMP.value); cieloAplicado = cielo;
  const pura = [w.x, w.y, w.z].indexOf(1), anterior = renderer.getRenderTarget(), u = mezcla.material.uniforms;
  for (const j of juegos) {
    const lamp = j.ext, sol = j.sol && sunTex;
    let t = pura >= 0 && !lamp && !j.sol ? j.tex[pura] : null;
    if (!t) {
      [u.tD.value, u.tA.value, u.tN.value] = j.tex; [u.tAo.value, u.tNo.value, u.tSh.value] = lamp ? j.ext : [j.tex[1], j.tex[2], j.tex[2]]; u.usarLamp.value = lamp ? 1 : 0;
      u.usarSol.value = sol ? 1 : 0; u.tSun.value = sunTex;
      renderer.setRenderTarget(j.rt); mezcla.render(renderer);
      t = j.rt.texture;
    }
    for (const m of j.mats) m.map = t;
  }
  renderer.setRenderTarget(anterior);
  return true;
}

// pesosFuera: (día, atardecer, noche) según la altura del sol (sol.js); si no llegan, los de la tabla de horas
export function actualizar(horaForzada, pesosFuera) {
  const h = horaForzada ?? horaValencia(); const [d, a, n] = pesosFuera || pesos(h);
  W.value.set(d, a, n); const cambio = juegos.length > 0 && aplicar(); return { h, d, a, n, cambio };
}
// el cielo del momento (ver CIELO) y la textura de luz solar de soldirecto.js; true si ha cambiado algo
export function fijarCielo({ sol, amb, sat, reb, k = 1 }, texturaSol) {
  CIELO.sol.value.set(...sol); CIELO.amb.value = amb; CIELO.sat.value = sat; CIELO.reb.value = reb; CIELO.k.value = k; sunTex = texturaSol ?? sunTex;
  return juegos.length > 0 && aplicar();
}
export const forzar = () => juegos.length > 0 && aplicar(true);     // el sol (la textura) cambió aunque sus valores no
export const haySolDinamico = () => juegos.some(j => j.sol);

// pinta las mezclas una vez al cargar, para que la primera transición de hora no tenga que reservar memoria en la GPU
export function calentar() {
  const anterior = renderer.getRenderTarget(), u = mezcla.material.uniforms;
  for (const j of juegos) { [u.tD.value, u.tA.value, u.tN.value] = j.tex; [u.tAo.value, u.tNo.value, u.tSh.value] = j.ext || [j.tex[1], j.tex[2], j.tex[2]]; u.usarLamp.value = 0; u.usarSol.value = 0; renderer.setRenderTarget(j.rt); mezcla.render(renderer); }
  renderer.setRenderTarget(anterior);
}

// interruptores: devuelve true si cambia algo (la mezcla se rehace al momento)
export function fijarLamparas(barra, flexo) {
  LAMP.value.set(barra, flexo); return juegos.length > 0 && aplicar();
}

// ¿están horneadas las variantes sin lámparas? (si no, los interruptores no hacen nada y no se ofrecen)
export const hayLamparas = () => juegos.some(j => j.ext);
