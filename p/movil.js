// Versión móvil: en pantallas táctiles (o con #movil=1) se mira alrededor deslizando el dedo. Las vistas son las mismas que en el ordenador (mismo encuadre y mismo zoom); lo que no cabe en el ancho de la pantalla se ve girando.
//  - deslizar gira la cámara, pero solo hasta cubrir lo que se ve en un ordenador (16:9) con esa misma vista: más allá están los lados sin modelar del cuarto; al soltar, sigue con inercia y se queda donde la dejes
//  - tocar sin arrastrar es un clic de siempre (se ignora el clic que sigue a un arrastre)
import * as THREE from 'three';

const hash = new URLSearchParams(location.hash.slice(1));
export const esMovil = hash.get('movil') === '1' || (matchMedia('(pointer: coarse)').matches && !hash.get('movil'));
if (esMovil) document.documentElement.classList.add('movil');

const DEG = Math.PI / 180;
let camaraMovil = null;
// cuánto se puede girar: la diferencia entre lo que abarca una pantalla de ordenador (16:9, zoom 1) y lo que abarca esta, en horizontal y en vertical
export function limites() {
  const c = camaraMovil, t = Math.tan(c.fov * DEG / 2);
  return { yaw: Math.max(0, Math.atan(t * 16 / 9) - Math.atan(t * c.aspect / c.zoom)), pitch: Math.max(0, c.fov * DEG / 2 - Math.atan(t / c.zoom)) };
}
export const giro = { yaw: 0, pitch: 0, vyaw: 0, vpitch: 0, arrastrando: false, arrastro: false, activo: false };

// zoom de la cámara: siempre 1, el de un ordenador (el encuadre de cada vista no cambia con la forma de la pantalla)
export function zoomPara() { return 1; }

export function iniciarMovil({ lienzo, camera, puedeGirar, alMover }) {
  if (!esMovil) return;
  camaraMovil = camera;
  let ultimo = null, inicio = null, t0 = 0, vx = 0, vy = 0;
  const pxARad = () => (2 * Math.atan(Math.tan(camera.fov * DEG / 2) * camera.aspect / camera.zoom)) / innerWidth;     // lo que gira la cámara por píxel: el dedo arrastra la escena
  lienzo.style.touchAction = 'none';
  lienzo.addEventListener('pointerdown', e => {
    if (!puedeGirar()) return;
    lienzo.setPointerCapture?.(e.pointerId);
    ultimo = { x: e.clientX, y: e.clientY }; inicio = { ...ultimo }; t0 = performance.now(); vx = vy = 0;
    giro.arrastrando = true; giro.arrastro = false; giro.vyaw = giro.vpitch = 0;
  });
  lienzo.addEventListener('pointermove', e => {
    if (!giro.arrastrando || !ultimo) return;
    const dx = e.clientX - ultimo.x, dy = e.clientY - ultimo.y, k = pxARad();
    if (!giro.arrastro && Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y) > 9) giro.arrastro = true;
    if (!giro.arrastro) return;
    const ahora = performance.now(), dt = Math.max(1, ahora - t0); t0 = ahora;
    const L = limites(); giro.yaw = THREE.MathUtils.clamp(giro.yaw + dx * k, -L.yaw, L.yaw); giro.pitch = THREE.MathUtils.clamp(giro.pitch + dy * k * 0.7, -L.pitch, L.pitch);
    vx = 0.8 * vx + 0.2 * (dx * k / dt); vy = 0.8 * vy + 0.2 * (dy * k * 0.7 / dt);
    ultimo = { x: e.clientX, y: e.clientY }; giro.activo = true; alMover();
  });
  const soltar = () => { if (!giro.arrastrando) return; giro.arrastrando = false; ultimo = null; giro.vyaw = vx * 1000; giro.vpitch = vy * 1000; setTimeout(() => { giro.arrastro = false; }, 60); };
  lienzo.addEventListener('pointerup', soltar); lienzo.addEventListener('pointercancel', soltar);
}

// un paso por fotograma: la inercia frena sola. Devuelve true si la cámara sigue moviéndose
export function pasoGiro(dt) {
  if (!giro.activo || giro.arrastrando) return giro.arrastrando;
  const f = Math.exp(-dt / 280), L = limites();
  giro.yaw = THREE.MathUtils.clamp(giro.yaw + giro.vyaw * dt / 1000, -L.yaw, L.yaw); giro.pitch = THREE.MathUtils.clamp(giro.pitch + giro.vpitch * dt / 1000, -L.pitch, L.pitch);
  giro.vyaw *= f; giro.vpitch *= f;
  if (Math.abs(giro.yaw) >= L.yaw) giro.vyaw = 0;
  if (Math.abs(giro.pitch) >= L.pitch) giro.vpitch = 0;
  if (Math.abs(giro.vyaw) < 0.01 && Math.abs(giro.vpitch) < 0.01) { giro.vyaw = giro.vpitch = 0; return false; }
  return true;
}
export const reiniciarGiro = () => { giro.yaw = giro.pitch = giro.vyaw = giro.vpitch = 0; giro.activo = false; };

// el punto al que mira la cámara con el giro puesto: la dirección de la vista, girada
const eje = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), lado = new THREE.Vector3();
export function mirada(base, look, desde, destino) {
  dir.subVectors(look, base); const L = dir.length(); dir.normalize();
  dir.applyAxisAngle(eje, giro.yaw);
  lado.crossVectors(dir, eje).normalize();                                  // eje horizontal a la derecha de la vista
  dir.applyAxisAngle(lado, giro.pitch);
  return destino.copy(desde).addScaledVector(dir, L);
}
