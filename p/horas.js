// Luz según la hora de Valencia: funde los tres horneados (día, atardecer, noche) y las tres vistas de la ventana.
// La mezcla no se hace en cada píxel de cada fotograma: se pinta una vez en una textura cuando cambia la hora
// (y si la hora es pura, de día o de noche, se usa directamente el horneado de esa hora).
import * as THREE from 'three';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { cargarTextura } from './texturas.js';

// pesos (día, atardecer, noche) a lo largo del día, principios de octubre en Valencia (amanece ~7:55, anochece ~19:35)
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

// cada juego: tres texturas (día, atardecer, noche), la textura donde se pinta la mezcla y los materiales que la usan
const juegos = [];
let renderer = null, aplicados = null;
const mezcla = new FullScreenQuad(new THREE.ShaderMaterial({
  uniforms: { tD: { value: null }, tA: { value: null }, tN: { value: null }, w: W },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
  fragmentShader: `uniform sampler2D tD, tA, tN; uniform vec3 w; varying vec2 vUv;
    void main(){ gl_FragColor = texture2D(tD, vUv) * w.x + texture2D(tA, vUv) * w.y + texture2D(tN, vUv) * w.z; }`,
  depthTest: false, depthWrite: false,
}));

function juego(dia, atar, noche) {
  const img = atar.image, rt = new THREE.WebGLRenderTarget(img.width, img.height, {
    colorSpace: THREE.SRGBColorSpace, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, anisotropy: 8,
  });
  rt.texture.flipY = false;
  const j = { tex: [dia, atar, noche], rt, mats: [] }; juegos.push(j); return j;
}

// empieza a descargar los horneados de cada hora (a la vez que el cuarto)
export const cargar = base => Promise.all(['cuarto_luz_dia.webp', 'cuarto_luz_noche.webp', 'vista_dia.webp', 'vista_noche.webp', 'vista_atardecer.webp']
  .map(f => cargarTextura(base + f, { flipY: false })));                    // orientación de glTF

export async function prepararHoras(meshes, cargando, rend) {
  renderer = rend;
  let dia, noche, vDia, vNoche, vAtar;
  try { [dia, noche, vDia, vNoche, vAtar] = await cargando; } catch { return false; }   // horneado de una sola hora: se queda en atardecer
  let cuarto = null, vista = null;
  for (const o of meshes) {
    const m = o.material; if (!m?.map) continue;
    if (o.userData.mat === 'horneado') (cuarto ??= juego(dia, m.map, noche)).mats.push(m);
    else if (o.name.startsWith('paisaje')) (vista ??= juego(vDia, vAtar, vNoche)).mats.push(m);   // el glTF trae la última hora horneada: se cambia por estas
  }
  return [dia, noche, vDia, vNoche, vAtar];                        // las texturas, para subirlas a la GPU antes de empezar
}

// pone en los materiales la luz de los pesos actuales; devuelve true si ha cambiado algo
function aplicar() {
  const w = W.value;
  if (aplicados && aplicados.equals(w)) return false;
  aplicados = w.clone();
  const pura = [w.x, w.y, w.z].indexOf(1), anterior = renderer.getRenderTarget(), u = mezcla.material.uniforms;
  for (const j of juegos) {
    let t = pura >= 0 ? j.tex[pura] : null;
    if (!t) {
      [u.tD.value, u.tA.value, u.tN.value] = j.tex;
      renderer.setRenderTarget(j.rt); mezcla.render(renderer);
      t = j.rt.texture;
    }
    for (const m of j.mats) m.map = t;
  }
  renderer.setRenderTarget(anterior);
  return true;
}

export function actualizar(horaForzada) {
  const h = horaForzada ?? horaValencia(); const [d, a, n] = pesos(h);
  W.value.set(d, a, n); const cambio = juegos.length > 0 && aplicar(); return { h, d, a, n, cambio };
}

// pinta las mezclas una vez al cargar, para que la primera transición de hora no tenga que reservar memoria en la GPU
export function calentar() {
  const anterior = renderer.getRenderTarget(), u = mezcla.material.uniforms;
  for (const j of juegos) { [u.tD.value, u.tA.value, u.tN.value] = j.tex; renderer.setRenderTarget(j.rt); mezcla.render(renderer); }
  renderer.setRenderTarget(anterior);
}
