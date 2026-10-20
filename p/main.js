// Portfolio "mi cuarto": cuarto modelado en Blender con la luz de atardecer horneada (Cycles) y mostrado con three.js.
// Interacciones: pantalla -> Proyectos, libro -> Educación, pizarra -> menú que señala ambos.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { computeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { PROJECTS, EDUCATION, EXPERIENCE, ABOUT, FOTOS } from './content.js';
import { T, PENDIENTE, LANG } from './i18n.js';
import { crearIntro } from './intro.js';
import * as Horas from './horas.js';
import * as Sol from './sol.js';
import * as Clima from './clima.js';
import { crearLluvia } from './lluvia.js';
import { crearSolDirecto } from './soldirecto.js';
import { esMovil, iniciarMovil, pasoGiro, reiniciarGiro, mirada, giro, zoomPara } from './movil.js';
import { hash, estado, objects, espejos, renderer, scene, camera } from './escena.js';
import { crearEspejo } from './espejo.js';
import { cargarTextura } from './texturas.js';
import { icono } from './iconos.js';
import { MAPA } from './mapa.js';
import { montarLibro } from './libro.js';
import { crearLibro3D } from './libro3d.js';
import { crearCadena, crearPresentador, crearReproyector } from './postpro.js';
import { crearClawd, sobreIcono, sobreVentana } from './clawd.js';
// el personaje está archivado en archivo/personaje (web/personaje.js + assets/javier.glb); se retomará más adelante

if (hash.get('noanim')) document.documentElement.classList.add('noanim');

// ---------------------------------------------------------------- vistas (coordenadas = web/blender: x mesa->estantería, y altura, z ventana->puerta)
const UP = new THREE.Vector3(0, 1, 0);
const V = (pos, look, fov) => ({ pos: new THREE.Vector3(...pos), look: new THREE.Vector3(...look), fov });
const VIEWS = {
  home: V([1.76, 1.85, 3.40], [0.92, 0.75, 1.00], 72),
  proyectos: V([0.86, 1.19, 1.83], [0.20, 1.17, 1.83], 40),
  educacion: V([0.86, 1.36, 2.50], [0.60, 0.86, 2.50], 42),
  pizarra: V([1.72, 1.52, 2.22], [2.00, 0.50, 1.33], 46),
  experiencia: V([1.06, 1.50, 2.30], [1.06, 1.25, -2.0], 52),
  espejoTercera: V([1.30, 1.70, 3.30], [1.90, 0.95, 2.30], 62),
};
const ESPEJO_INCL = +(hash.get('lean') ?? 0.14);   // rad que se separa de la pared por abajo (0,14 ≈ 8°; antes 0,22 ≈ 12,6°; #lean=0.22 para compararlo)
const SOBREMI = (hash.get('sm') ?? '0.7,1.45,1.25,52').split(',').map(Number);   // vista de "Sobre mí": distancia al espejo, altura de los ojos, altura a la que mira, campo de visión (#sm=… para probar)
const BALON_POS = (hash.get('balon') ?? '2.36,1.99').split(',').map(Number);   // x, z del balón sobre la cómoda (#balon=x,z)
const BALON_YAW = +(hash.get('byaw') ?? -Math.PI / 4), BALON_GIRO = Math.PI / 2;   // giro del balón sobre la cómoda (rad): -45° deja el escudo mirando en diagonal hacia la puerta (desde la cómoda, la puerta queda a 45°)
const PARED_X = 2.60;   // pared de la estantería y la cómoda (ancho del cuarto)
const MARCO_ESPEJO = '#dccdb6';   // madera clara del marco del espejo (medida del vídeo de referencia, f_016)
const lineasPizarra = {};   // línea del menú -> { malla resaltada, opacidad actual y objetivo }
const SECTIONS = T.secciones;
// zonas de la pizarra (altura relativa en la cara blanca, de abajo arriba) — igual que blender/tex.py BOARD_ITEMS
const BOARD_ITEMS = [['proyectos', 0.60], ['educacion', 0.47], ['experiencia', 0.34], ['sobremi', 0.21]];

// cadenas de posprocesado (postpro.js): la nítida (la imagen de siempre) y las de vuelo; se elige midiendo la GPU
const PR = renderer.getPixelRatio();
const MSAA = +(hash.get('msaa') ?? 4);                        // antialiasing 4x en la nítida: sin bordes dentados ni rayas que centellean (+2,6 ms)
const nitida = crearCadena(renderer, scene, camera, { msaa: MSAA });
// para volar en equipos justos, tres más ligeras: 85 %, 72 % y 60 % de resolución, con los bordes suavizados (FXAA, como
// el antialiasing de la nítida) y afiladas al ampliarlas (CAS) hasta la misma nitidez que la nítida (medido: 2,65-2,75)
const cadenas = [nitida, ...[[0.85, 0.75], [0.72, 1], [0.6, 1]].map(([escala, enfoque]) =>
  Object.assign(crearCadena(renderer, scene, camera, { escala, fxaa: true }), { enfoque }))];
const nitidaB = crearCadena(renderer, scene, camera, { msaa: MSAA });       // otra nítida: mientras una se pinta a trozos, la otra se muestra
const todas = [...cadenas, nitidaB];
const contorno = sel => { for (const c of todas) c.outline.selectedObjects = sel; };
const presentar = crearPresentador(renderer), reproyector = crearReproyector(renderer);
const nivelFijo = hash.get('nivel') != null ? +hash.get('nivel') : null;     // para pruebas: forzar una cadena en movimiento

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.zoom = zoomPara(camera.aspect); camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); for (const c of todas) c.tamano(innerWidth, innerHeight); estado.sucio = true;
  lista.cadena = obra.cadena = null; ultimaMovil = null; mezcla = 1;      // las imágenes guardadas ya no valen: la próxima, entera
  clearTimeout(reservarEspejo.t); reservarEspejo.t = setTimeout(reservarEspejo, 400);   // con otra forma de ventana, el espejo ocupa otro trozo
});

// ---------------------------------------------------------------- cargar el cuarto horneado

// ---------------------------------------------------------------- mesa regulable (manivela)
// La mesa horneada es una sola malla (tablero, patas, travesaño, manivela y cajonera). Se parte por triángulos: el tablero y el travesaño suben
// con todo lo que llevan encima; las patas se rehacen telescópicas (tubo inferior más estrecho que fijo, manguito superior más ancho que sube)
// y la manivela se modela de nuevo (eje, brazo y puño) para que gire al subir o bajar la mesa. Las texturas horneadas se reaprovechan (mismas UV).
const MESA_ALZ = 0.36, MESA_VUELTAS = 9;           // IKEA Trotten 160x80: regula de 72 a 122 cm; aquí sube 36 cm (de 0,84 a 1,20 m, de pie) y la manivela da 9 vueltas
const mesa = { grupo: null, manivela: [], pivote: null, vueltas: 0, u: 0, anim: null, arriba: false };
function construirMesaRegulable(room) {
  const base = room.getObjectByName('mesa');
  if (!base?.isMesh) return;
  const g = base.geometry.index ? base.geometry.toNonIndexed() : base.geometry;
  const P = g.attributes.position, U = g.attributes.uv, tris = { tablero: [], pata: [], manivela: [], resto: [] };
  for (let t = 0; t < P.count / 3; t++) {
    let cx = 0, cy = 0, cz = 0;
    for (let k = 0; k < 3; k++) { cx += P.getX(t * 3 + k) / 3; cy += P.getY(t * 3 + k) / 3; cz += P.getZ(t * 3 + k) / 3; }
    const az = Math.abs(cz);
    tris[cy > -0.0135 ? 'tablero'
      : cx > -0.321 && cx < -0.259 && cy > -0.06 ? 'tablero'                                            // travesaño
      : cx > 0.299 && cx < 0.331 && cz > 0.739 && cz < 0.771 && cy > -0.1 ? 'manivela'
      : Math.abs(cx) < 0.041 && az > 0.688 && az < 0.752 && cy > -0.80 ? 'pata' : 'resto'].push(t);
  }
  const construir = (lista, f) => {
    const pos = new Float32Array(lista.length * 9), uv = new Float32Array(lista.length * 6);
    lista.forEach((t, i) => { for (let k = 0; k < 3; k++) {
      const v = t * 3 + k, p = [P.getX(v), P.getY(v), P.getZ(v)], q = f ? f(p) : p;
      pos.set(q, i * 9 + k * 3); uv.set([U.getX(v), U.getY(v)], i * 6 + k * 2);
    } });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.computeVertexNormals(); geo.computeBoundingBox(); geo.computeBoundingSphere(); return geo;
  };
  const nueva = (geo, nombre, padre, enLaMesa = true) => {
    const m = new THREE.Mesh(geo, base.material.clone()); m.name = nombre; m.userData.mat = base.userData.mat;
    if (enLaMesa) { m.position.copy(base.position); m.quaternion.copy(base.quaternion); m.scale.copy(base.scale); }
    padre.add(m); return m;
  };
  const caja = (lista) => {                                          // plantilla: la cajita de la manivela original, para estirarla a otras medidas
    const bb = construir(lista).boundingBox, c = bb.getCenter(new THREE.Vector3()), s = bb.getSize(new THREE.Vector3());
    return (cx, cy, cz, sx, sy, sz) => construir(lista, p => [cx + (p[0] - c.x) / s.x * sx, cy + (p[1] - c.y) / s.y * sy, cz + (p[2] - c.z) / s.z * sz]);
  };
  const grupo = mesa.grupo = new THREE.Group(); grupo.name = 'mesa_regulable'; room.add(grupo);
  // tablero + travesaño: suben
  grupo.add(nueva(construir(tris.tablero), 'mesa_tablero', grupo));
  // patas telescópicas
  const ys = tris.pata.flatMap(t => [0, 1, 2].map(k => P.getY(t * 3 + k))), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const LOC_Y = base.position.y;                                     // la malla está centrada en y = 0,8275: y local = y del cuarto - LOC_Y
  const mangoB = 0.84 - 0.025 - 0.50 - LOC_Y, mangoA = 0.84 - 0.025 - LOC_Y, tuboA = 0.70 - LOC_Y;
  nueva(construir(tris.pata, p => { const cz = p[2] > 0 ? 0.72 : -0.72; return [p[0] * 0.78, mangoB + (p[1] - y0) / (y1 - y0) * (mangoA - mangoB), cz + (p[2] - cz) * 0.78]; }), 'mesa_manguito', grupo);
  nueva(construir(tris.pata, p => { const cz = p[2] > 0 ? 0.72 : -0.72; return [p[0] * 0.66, y0 + (p[1] - y0) / (y1 - y0) * (tuboA - y0), cz + (p[2] - cz) * 0.66]; }), 'mesa_tubo', base.parent);
  // manivela: eje bajo el canto del tablero, brazo y puño; el pivote gira sobre z
  const bisagra = mesa.bisagra = new THREE.Group(); bisagra.name = 'manivela_bisagra'; grupo.add(bisagra);
  const pivote = mesa.pivote = new THREE.Group(); pivote.name = 'manivela_pivote'; bisagra.add(pivote);
  bisagra.position.copy(base.localToWorld(new THREE.Vector3(0.375, -0.032, -0.51)));   // canto largo de delante, a la derecha según se sienta uno (hacia la ventana): a la altura del final de la alfombrilla (z = 1,38)
  const molde = caja(tris.pata);   // misma pintura blanca que las patas (la manivela del Trotten es blanca)
  for (const [nombre, medidas] of [['manivela_eje', [0.01, 0, 0, 0.12, 0.008, 0.008]], ['manivela_brazo', [0.066, -0.0375, 0, 0.008, 0.085, 0.010]], ['manivela_puno', [0.1, -0.0775, 0, 0.07, 0.014, 0.014]]]) {
    const m = nueva(molde(...medidas), nombre, pivote, false); mesa.manivela.push(m); mesa[nombre.slice(9)] = m;
  }
  // zona de clic invisible, más generosa que la varilla (el Trotten tiene una manivela de alambre muy fina); no gira
  const zona = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.15, 0.09), new THREE.MeshBasicMaterial({ visible: false }));
  zona.position.copy(bisagra.position); zona.name = 'manivela_zona'; grupo.add(zona); mesa.zona = zona;
  mesa.zonaBase = zona.position.clone(); ponerManivela(0, 0);   // en reposo: metida bajo la mesa, brazo de lado
  // la mesa que queda fija: cajonera y pies
  base.geometry = construir(tris.resto);
  // lo que lleva encima sube con ella
  for (const n of ['alfombrilla', 'barra_luz', 'mando_luz', 'libro', 'mesita_portatil', 'monitor', 'monitor2', 'portatil', 'raton', 'teclado_k295', 'vaso', 'vaso001']) {
    const o = room.getObjectByName(n); if (o) grupo.attach(o);
  }
  room.updateMatrixWorld(true);
}
// manivela, como la del Trotten real: en reposo está metida del todo bajo el tablero (deslizada hacia la pared) y con el brazo girado un cuarto
// de vuelta a la derecha, horizontal, porque topa con el tablero. Para usarla: s = 1 sale deslizando hacia fuera, r = 1 baja el brazo (cuelga y puede dar vueltas)
function ponerManivela(s, r) {
  mesa.s = s; mesa.r = r; mesa.giro = (1 - r) * Math.PI / 2;
  mesa.pivote.position.x = -0.125 * (1 - s); mesa.pivote.rotation.x = mesa.vueltas + mesa.giro;
  const z = mesa.zona, a = (v, w) => v + (w - v) * s;
  z.position.copy(mesa.zonaBase).add(new THREE.Vector3(a(-0.11, 0.07), a(-0.02, -0.04), a(-0.04, 0)));
  z.scale.set(a(1.1, 1.2), a(0.65, 1.15), a(1.9, 1.3));
  mesa.pivote.updateMatrixWorld(true); z.updateMatrixWorld(true); estado.sucio = true;
}
function ponerMesa(u) {
  mesa.u = u; mesa.grupo.position.y = u * MESA_ALZ; mesa.vueltas = u * MESA_VUELTAS * 2 * Math.PI; mesa.pivote.rotation.x = mesa.vueltas + (mesa.giro ?? Math.PI / 2);
  mesa.grupo.updateMatrixWorld(true); estado.sucio = estado.solSucio = true;
}
if (hash.get('debug')) window.__alternarMesa = () => alternarMesa();
if (hash.get('debug')) window.__dbg = { camera, scene, objects, renderer, huevoClic: k => huevoClic(k) };   // para las pruebas automáticas
function alternarMesa() {
  if (mesa.anim || !mesa.grupo) return;
  mesa.arriba = !mesa.arriba; mesa.anim = { t0: null, dur: 3800, de: mesa.u, a: mesa.arriba ? 1 : 0 };
}
async function loadRoom() {
  const paso = t => { const l = document.getElementById('loading'); if (l) l.textContent = t; };
  paso(T.cargando);
  // todo se descarga a la vez; las imágenes se descomprimen fuera del hilo principal
  const base = './assets/cuarto/', horas = Horas.cargar(base), climaListo = Clima.cargar();
  const alfombrilla = cargarTextura(base + 'alfombrilla.webp'), pizarraTexto = cargarTextura(base + T.pizarraImagen);
  horas.catch(() => {}); alfombrilla.catch(() => {}); pizarraTexto.catch(() => {});
  const gltf = await new GLTFLoader().loadAsync(base + 'cuarto.gltf');
  paso('Encendiendo las luces…');
  const room = gltf.scene; scene.add(room);
  const mirrors = [];
  room.traverse(o => {
    if (!o.isMesh) return;
    const src = o.material, n = o.name;
    o.userData.mat = src.name;                    // 'horneado' = atlas de luz; lo usa horas.js
    const map = src.map || src.emissiveMap;
    if (map) { map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 8; }
    if (n.startsWith('espejo_cristal')) { mirrors.push(o); return; }
    // los cristales no se pueden tocar (el clic los atraviesa): ni se prueban en el raycast
    if (n.startsWith('cristal')) { o.material = new THREE.MeshBasicMaterial({ color: '#dfe9f2', transparent: true, opacity: 0.08, depthWrite: false }); o.raycast = () => {}; objects.cristales.push(o); return; }
    if (n.startsWith('vaso')) { o.visible = false; o.raycast = () => {}; return; }   // el vaso de leche ya no está en el cuarto
    o.material = new THREE.MeshBasicMaterial({ map, color: map ? 0xffffff : src.color, side: THREE.FrontSide });
    if (/^monitor(\d|_)/.test(n) && !n.startsWith('monitor2')) objects.monitor.push(o);   // cuerpo (monitor001) y pantalla
    if (n.startsWith('monitor2')) objects.monitor2.push(o);                                // la segunda pantalla: Clawd
    if (n === 'monitor2_pantalla') objects.pantalla2 = o;
    if (n.startsWith('libro')) objects.libro.push(o);
    if (n.startsWith('ventana') || n.startsWith('estor') || n.startsWith('paisaje')) objects.ventana.push(o);
    if (n.startsWith('pizarra')) objects.pizarra = o;
    if (n.startsWith('espejo')) objects.espejo.push(o);
    if (n.startsWith('armario')) objects.armario = o;
    if (n === 'puerta') objects.puerta = o;
    if (n === 'flexo') objects.flexo = o;
    if (n === 'flexo_pantalla') objects.flexoPantalla = o;
    if (n === 'barra_luz') objects.barraLuz = o;
    if (n === 'mando_luz') objects.mandoLuz = o;
    if (n === 'monitor_pantalla') objects.screen = o;
  });
  // la mesa corrida 3 cm, el flexo en su hueco, la pizarra y el libro torcidos ya vienen así del horneado (blender/cuarto.py)
  room.updateMatrixWorld(true);
  construirMesaRegulable(room);
  // las piezas fijas que no se tocan (paredes, cama, mesa, teclado…) van en una sola malla: muchas menos llamadas de dibujo,
  // que en un portátil cuestan CPU en la página y en el proceso de GPU del navegador (cada una se traduce a Direct3D)
  {
    const bajoMesa = o => { for (let p = o; p; p = p.parent) if (p === mesa.grupo) return true; return false; };
    const tocables = new Set([...objects.monitor, ...objects.monitor2, ...objects.libro, ...objects.ventana, ...objects.espejo, objects.pizarra, objects.armario, objects.puerta, objects.flexo]);
    const fijas = [];
    room.updateMatrixWorld(true);
    room.traverse(o => { if (o.isMesh && o.userData.mat === 'horneado' && !tocables.has(o) && !bajoMesa(o) &&!o.name.startsWith('espejo') && !o.material.transparent && o.material.map && o.geometry.index && o.geometry.attributes.uv) fijas.push(o); });
    if (fijas.length > 1 && !hash.get('sinfusion')) {
      const geo = mergeGeometries(fijas.map(o => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', o.geometry.attributes.position); g.setAttribute('uv', o.geometry.attributes.uv); g.setAttribute('normal', o.geometry.attributes.normal); g.setIndex(o.geometry.index);
        return g.applyMatrix4(o.matrixWorld);
      }));
      const malla = new THREE.Mesh(geo, fijas[0].material); malla.name = 'fijas'; malla.userData.mat = 'horneado';
      for (const o of fijas) o.removeFromParent();
      geo.applyMatrix4(room.matrixWorld.clone().invert()); room.add(malla);          // dentro del cuarto: la luz por horas la encuentra
    }
  }
  // el armario empotrado está detrás de la vista principal (la cámara queda dentro de él): al salir de su volumen en un vuelo
  // aparece con un fundido por tramado (como los objetos que tapan la cámara en los juegos), no de golpe
  if (objects.armario) {
    const m = objects.armario.material, u = { value: 1 };
    m.userData.aparicion = u;
    m.onBeforeCompile = sh => {
      sh.uniforms.aparicion = u;
      // tramado de Bayer 4x4: según sube `aparicion`, cada vez se descartan menos píxeles
      sh.fragmentShader = 'uniform float aparicion;\n' + sh.fragmentShader.replace('void main() {', `void main() {
        if (aparicion < 1.) {
          const float B[16] = float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.);
          ivec2 q = ivec2(mod(gl_FragCoord.xy, 4.));
          if ((B[q.x + q.y * 4] + .5) / 16. > aparicion) discard;
        }`);
    };
    m.customProgramCacheKey = () => 'armario-tramado';
  }
  // alfombrilla (réplica dibujada): capa propia nítida sobre la horneada, teñida según la hora
  {
    const t = await alfombrilla;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.90, 0.35), new THREE.MeshBasicMaterial({ map: t, color: '#ffffff' }));
    m.rotation.set(-Math.PI / 2, 0, Math.PI / 2); m.position.set(0.605, 0.8445, 1.86); scene.add(m); objects.alfombrilla = m; mesa.grupo?.attach(m);
    if (mesa.grupo && hash.get('mesa') != null) { mesa.arriba = +hash.get('mesa') > 0.5; ponerMesa(+hash.get('mesa')); }   // solo para revisar
  }
  construirPersiana(room);
  // libro (Educación): algo torcido sobre la mesa y con la portada del que estoy leyendo (Crónica del rey pasmado)
  try {
    const lb = room.getObjectByName('libro'), portada = await cargarTextura(base + 'libro_portada.webp');
    lb.geometry.computeBoundingBox(); const bb = lb.geometry.boundingBox, c = bb.getCenter(new THREE.Vector3());
    const mapa = new THREE.Mesh(new THREE.PlaneGeometry(bb.max.x - bb.min.x, bb.max.z - bb.min.z), new THREE.MeshBasicMaterial({ map: portada, color: '#ffffff' }));
    mapa.rotation.x = -Math.PI / 2;   // la portada se lee desde la puerta (el lado largo del libro va a lo largo de z, y su parte de arriba mira hacia la ventana)
    // la tapa y el lomo son del color de fondo de la portada (la mediana de los píxeles del borde que no son blancos): al cambiar la imagen se recalcula sola
    lb.material = new THREE.MeshBasicMaterial({ color: colorDeFondo(portada.image) }); lb.material.userData.base = lb.material.color.clone(); objects.tomo = lb;
    mapa.position.set(c.x, bb.max.y + 0.0007, c.z); lb.add(mapa); objects.libro.push(mapa); objects.portada = mapa;
    // el canto del libro: las páginas se ven blancas (con sus hojas) por tres lados; el lomo, a la izquierda de la portada, sigue siendo de la tapa
    const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64; const cx = cv.getContext('2d');
    cx.fillStyle = '#e2ddd0'; cx.fillRect(0, 0, 4, 64); cx.fillStyle = '#c4beaf'; for (let y = 3; y < 64; y += 4) cx.fillRect(0, y, 4, 1);
    const tp = new THREE.CanvasTexture(cv); tp.colorSpace = THREE.SRGBColorSpace; tp.magFilter = THREE.NearestFilter; tp.minFilter = THREE.NearestFilter;
    const eps = 0.0006, tapa = 0.0045, lomo = 0.012;
    const paginas = new THREE.Mesh(new THREE.BoxGeometry(bb.max.x - bb.min.x - lomo + eps, bb.max.y - bb.min.y - 2 * tapa, bb.max.z - bb.min.z + 2 * eps), new THREE.MeshBasicMaterial({ map: tp, color: '#ffffff' }));
    paginas.position.set((bb.min.x + lomo + bb.max.x + eps) / 2, (bb.min.y + bb.max.y) / 2, c.z); lb.add(paginas); objects.libro.push(paginas); objects.paginas = paginas;
    lb.updateMatrixWorld(true);
    objects.libro3d = crearLibro3D(THREE, lb, { portada, canto: tp, colorTapa: lb.material.color.clone() });
  } catch (e) { console.warn('sin portada', e); }
  // luz según la hora de Valencia (si existen los horneados de día y noche)
  const mallas = []; room.traverse(o => o.isMesh && mallas.push(o));
  objects.horas = await Horas.prepararHoras(mallas, horas, renderer);
  await Promise.race([climaListo, new Promise(r => setTimeout(r, 1800))]);      // el tiempo, si llega pronto; si no, entra cuando llegue
  if (Horas.haySolDinamico()) objects.solDirecto = crearSolDirecto(renderer, scene, mallas.filter(o => o.userData.mat === 'horneado' && o.visible));
  objects.lluvia = crearLluvia({ scene, camera, renderer, cristales: objects.cristales, paisajes: mallas.filter(o => o.name.startsWith('paisaje')) });
  if (Horas.hayLamparas()) { lamparas.listas = true; construirResplandor(); }
  // Clawd en la segunda pantalla: al hacer clic sale una escena en píxeles según la fecha, la hora y el tiempo (#clawd=nombre fuerza una; #fecha=AAAA-MM-DD la fecha)
  if (objects.pantalla2) {
    objects.clawd = crearClawd(THREE, objects.pantalla2, { forzada: hash.get('clawd'), contexto: () => {
      const f = hash.get('fecha') ? new Date(hash.get('fecha') + 'T12:00:00') : new Date(), t = Clima.clima.temp;
      return { fecha: f, hora: horaManual ?? Horas.horaValencia(), temp: t == null ? null : t, llueve: Clima.clima.lluvia > 0.3, nieva: !!Clima.clima.nieva || hash.get('nieva') === '1', en: LANG === 'en' };
    } });
    objects.clawd.malla.updateMatrixWorld(true); if (hash.get('debug')) window.__clawd = objects.clawd;
  }
  paso(T.colocando);
  // texto de la pizarra: capa nítida sobre la cara horneada (y su UV dice en qué línea se hace clic)
  if (objects.pizarra) {
    const b = objects.pizarra; b.geometry.computeBoundingBox(); const bb = b.geometry.boundingBox;
    const tex = await pizarraTexto;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.91), new THREE.MeshBasicMaterial({ map: tex, color: '#d8c9c4' }));
    face.rotation.y = -Math.PI / 2; face.position.set(bb.min.x - 0.0008, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2);
    b.add(face); objects.boardFace = face;
    // resaltador: al pasar por una línea del menú se ilumina solo ese texto (marcador amarillo + el texto encima), no toda la pizarra
    const img = await new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = base + T.pizarraImagen; });
    if (img) {
      const W = img.width, H = img.height, c0 = document.createElement('canvas'); c0.width = W; c0.height = H;
      const x0 = c0.getContext('2d', { willReadFrequently: true }); x0.drawImage(img, 0, 0); const px = x0.getImageData(0, 0, W, H).data;
      for (const [key, v] of BOARD_ITEMS) {
        const ya = Math.round((1 - v) * H + 25 - 90), yb = ya + 130; let x1 = W, x2 = 0, y1 = H, y2 = 0;       // caja de la tinta de esa línea
        for (let y = ya; y < yb; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (px[i] + px[i + 1] + px[i + 2] < 500) { x1 = Math.min(x1, x); x2 = Math.max(x2, x); y1 = Math.min(y1, y); y2 = Math.max(y2, y); } }
        if (x2 <= x1) continue;
        x1 -= 18; x2 += 18; y1 -= 10; y2 += 10; const w = x2 - x1, h = y2 - y1;
        const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
        g.fillStyle = '#ffd84a'; g.beginPath(); g.roundRect(0, 0, w, h, 14); g.fill();
        g.globalCompositeOperation = 'multiply'; g.drawImage(img, x1, y1, w, h, 0, 0, w, h);               // la tinta sobre el marcador
        const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
        const mat = new THREE.MeshBasicMaterial({ map: t, color: '#d8c9c4', transparent: true, opacity: 0, depthWrite: false });
        const m = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.62 / W, h * 0.91 / H), mat);
        m.position.set(((x1 + x2) / 2 / W - 0.5) * 0.62, (0.5 - (y1 + y2) / 2 / H) * 0.91, 0.0007);
        m.visible = false; m.raycast = () => {}; face.add(m); lineasPizarra[key] = { m, mat, op: 0, obj: 0 };
      }
    }
  }
  // espejo real: refleja el cuarto en tiempo real
  for (const m of mirrors) {
    // la cara del espejo en coordenadas del mundo: sus 4 esquinas reales (vale aunque el espejo esté inclinado)
    m.updateWorldMatrix(true, false);
    const pos = m.geometry.attributes.position, P = [];
    for (let i = 0; i < pos.count; i++) P.push(new THREE.Vector3().fromBufferAttribute(pos, i).applyMatrix4(m.matrixWorld));
    const c = P.reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / P.length);
    const arriba = P.reduce((a, p) => (p.y > a.y ? p : a)), abajo = P.reduce((a, p) => (p.y < a.y ? p : a));
    const yMax = Math.max(...P.map(p => p.y)), yMin = Math.min(...P.map(p => p.y));
    const top = P.filter(p => p.y > yMax - 0.02).reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / P.filter(p => p.y > yMax - 0.02).length);
    const bot = P.filter(p => p.y < yMin + 0.02).reduce((a, p) => a.add(p), new THREE.Vector3()).multiplyScalar(1 / P.filter(p => p.y < yMin + 0.02).length);
    const ejeV = top.clone().sub(bot), alto = ejeV.length(); ejeV.normalize();
    const zs = P.map(p => p.z), ancho = Math.max(...zs) - Math.min(...zs);
    const ref = crearEspejo(new THREE.PlaneGeometry(ancho, alto), { textureWidth: 1024, textureHeight: 2048, color: 0xb9c6cf }, camera);
    const ejeH = new THREE.Vector3(0, 0, -1), normal = new THREE.Vector3().crossVectors(ejeH, ejeV).normalize();
    if (normal.x > 0) normal.negate();                                  // mira hacia la habitación (-x)
    ref.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3().crossVectors(ejeV, normal), ejeV, normal));
    ref.position.copy(top.clone().add(bot).multiplyScalar(0.5)).addScaledVector(normal, 0.003);
    // como el de verdad: apoyado en la pared con el pie separado, así te ves de cuerpo entero.
    // gira (cristal y marco) alrededor del borde de arriba: la base sale hacia la habitación
    const giroEje = new THREE.Vector3().crossVectors(ejeV, normal).normalize(), lean = -ESPEJO_INCL;
    const T = new THREE.Matrix4().makeTranslation(top.x, top.y, top.z).multiply(new THREE.Matrix4().makeRotationAxis(giroEje, lean))
      .multiply(new THREE.Matrix4().makeTranslation(-top.x, -top.y, -top.z));
    ref.updateMatrix(); ref.applyMatrix4(T);
    room.traverse(o => { if (o.isMesh && o !== m && o.name.startsWith('espejo')) { o.updateMatrixWorld(); const pinv = new THREE.Matrix4().copy(o.parent.matrixWorld).invert();
      o.applyMatrix4(new THREE.Matrix4().multiplyMatrices(pinv, T).multiply(o.parent.matrixWorld)); } });
    // marco propio, estable y bien definido (el horneado salía negro en unos lados, marrón en otros y sin borde de arriba): cuatro listones de madera
    // clara (haya/abedul, como el de verdad: fino, ~3 cm, color medido del vídeo) alrededor del cristal, hijos del espejo para que se muevan con él
    {
      const G = 0.03, F = 0.026, mk = (k) => new THREE.MeshBasicMaterial({ color: MARCO_ESPEJO });     // G ancho del listón, F fondo
      const mats = [mk(), mk(), mk(), mk(), mk(), mk()];                                               // +x -x +y -y +z(frente) -z
      mats.forEach((m, i) => m.userData.k = i === 4 ? 1 : 0.8);                                         // cantos algo más oscuros que el frente
      objects.marcoEspejo = mats;
      const barra = (w, h, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, F), mats); b.position.set(x, y, 0.002 - F / 2 + 0.006); b.name = 'espejo_marco'; ref.add(b); objects.espejo.push(b); b.raycast = acceleratedRaycast; };
      barra(ancho + 2 * G, G, 0, alto / 2 + G / 2);  barra(ancho + 2 * G, G, 0, -alto / 2 - G / 2);      // arriba y abajo (a todo el ancho)
      barra(G, alto, -ancho / 2 - G / 2, 0);         barra(G, alto, ancho / 2 + G / 2, 0);                  // lados
    }
    // apoyado en la pared, no dentro de ella: la inclinación giraba sobre el borde de arriba, que quedaba pasada la pared (x = 2,60) y la tapaba;
    // se adelanta el espejo entero lo justo para que el listón de arriba la toque por detrás sin atravesarla
    ref.updateMatrixWorld(true);
    { const top = ref.children.find(b => b.name === 'espejo_marco'), bb = new THREE.Box3().setFromObject(top); ref.position.x += (PARED_X - 0.002) - bb.max.x; ref.updateMatrixWorld(true); }
    // fotos de Javier pegadas al cristal (copias en papel con cinta): como no hay personaje, que el espejo tenga algo de él.
    // x, y respecto al centro del espejo (m) y giro (º); quedan en los lados para dejar libre el centro del reflejo
    {
      objects.espejoFotos = []; objects.matFotos = [];
      const sitios = [[-0.085, 0.565, 5], [0.085, 0.405, -6], [-0.07, 0.2, -3]];
      await Promise.all(sitios.map(async ([x, y, giro], i) => {
        try {
          const t = await cargarTextura(base + `foto_espejo_${i + 1}.webp`), w = 0.14, h = w * t.image.height / t.image.width;
          const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), f = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
          f.position.set(x, y, 0.0045 + i * 0.0004); f.rotation.z = THREE.MathUtils.degToRad(giro); f.name = 'espejo_foto'; f.renderOrder = 2; f.userData.idx = i;
          ref.add(f); objects.espejoFotos.push(f); objects.matFotos.push(mat);
        } catch (e) { console.warn('foto del espejo', i + 1, e); }
      }));
    }
    const old = room.getObjectByName('espejo001'); if (old) { old.visible = false; old.raycast = () => {}; objects.espejo = objects.espejo.filter(o => o !== old); }    // el marco horneado ya no se ve
    // la base adelantada no puede atravesar el suelo (el marco de abajo, 3 cm, se apoya en él): subir lo justo
    ref.updateMatrixWorld(); const baseY = new THREE.Vector3(0, -alto / 2 - 0.03, 0).applyMatrix4(ref.matrixWorld).y;
    if (baseY < 0.002) { ref.position.y += 0.002 - baseY; }
    objects.espejoCentro = ref.position.clone();
    { const c = ref.position, [d, ey, ly, fov] = SOBREMI; VIEWS.sobremi = V([c.x - d, ey, c.z], [c.x + 0.02, ly, c.z], fov); }   // de frente al espejo, a la altura de los ojos
    scene.add(ref); m.visible = false; objects.espejo.push(ref); espejos.push(ref);
    // los listones salen del espejo y cuelgan directamente de la escena: el contorno (al pasar el ratón) oculta todo lo no seleccionado, y si fueran
    // hijos del cristal este se ocultaría y se llevaría los listones con él
    ref.updateMatrixWorld(true); for (const b of ref.children.filter(c => c.name === 'espejo_marco' || c.name === 'espejo_foto')) scene.attach(b);
  }
  // balón de San Roque (balón 2026 del club) sobre la cómoda, con el escudo hacia la puerta: modelo de revolución a tamaño real (balón del 5: 29 x 19 cm)
  try {
    const tex = await cargarTextura(base + 'balon.webp'), grano = await cargarTextura(base + 'balon_grano.webp', { flipY: false });
    const L = 0.29, R = 0.095, N = 64, pts = [];
    for (let i = 0; i <= N; i++) { const t = -1 + 2 * i / N; pts.push(new THREE.Vector2(Math.max(0.0005, R * Math.pow(Math.max(0, 1 - t * t), 0.5)), t * L / 2)); }   // elipsoide: las puntas del balón real (fotos) son romas, no afiladas
    grano.wrapS = grano.wrapT = THREE.RepeatWrapping; grano.repeat.set(34, 22);
    const mat = new THREE.MeshStandardMaterial({ map: tex, bumpMap: grano, bumpScale: 0.9, roughness: 0.55, metalness: 0 });
    const bola = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), mat); bola.name = 'balon';
    bola.rotation.y = -BALON_GIRO;                                  // el escudo (centro del gajo 0, u = 1/8 de vuelta) queda mirando a +z
    const grupo = new THREE.Group(); grupo.name = 'balon_grupo'; grupo.add(bola);
    grupo.rotation.set(0, 0, -Math.PI / 2); const pivote = new THREE.Group(); pivote.add(grupo); pivote.rotation.y = BALON_YAW;   // eje largo en x, algo girado
    // altura de la cómoda en ese punto (rayo hacia abajo contra el cuarto)
    scene.updateMatrixWorld(true); const rc = new THREE.Raycaster(new THREE.Vector3(BALON_POS[0], 1.6, BALON_POS[1]), new THREE.Vector3(0, -1, 0));
    const golpe = rc.intersectObjects(scene.children, true).find(h => h.object.visible && h.object.isMesh && !h.object.name.startsWith('espejo'));
    const sobre = golpe ? golpe.point.y : 1.04;
    pivote.position.set(BALON_POS[0], sobre + R, BALON_POS[1]);
    // sombra de contacto y luz solo para él (el resto del cuarto es de luz horneada)
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.22), new THREE.MeshBasicMaterial({ map: (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(22,9,2,0.7)'); gr.addColorStop(0.5, 'rgba(22,9,2,0.32)'); gr.addColorStop(1, 'rgba(22,9,2,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })(), transparent: true, depthWrite: false }));
    sombra.rotation.x = -Math.PI / 2; sombra.rotation.z = BALON_YAW; sombra.position.set(BALON_POS[0], sobre + 0.002, BALON_POS[1]); sombra.raycast = () => {};
    const hemi = new THREE.HemisphereLight(0xfff1e0, 0x8a6a5a, 1.55), sol = new THREE.DirectionalLight(0xffe2c0, 1.25); sol.position.set(-1.5, 2.2, 3.0); sol.target.position.copy(pivote.position);
    scene.add(pivote, sombra, hemi, sol, sol.target); pivote.updateMatrixWorld(true);
    objects.balon = { grupo: pivote, bola, mat, hemi, sol, sombra };
  } catch (e) { console.warn('sin balón', e); }
  // raycast acelerado (árbol de cajas por malla): pasar el ratón por el cuarto no recorre los 72.000 triángulos
  scene.traverse(o => { if (o.isMesh && o !== persiana.malla && o.geometry.index && o.geometry.attributes.position.count > 200) { o.geometry.computeBoundsTree = computeBoundsTree; o.geometry.computeBoundsTree({ indirect: true }); o.raycast = acceleratedRaycast; } });
}

// ---------------------------------------------------------------- interacción
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
const tooltip = document.getElementById('tooltip'), hint = document.getElementById('hint');
const backBtn = document.getElementById('back'), panel = document.getElementById('panel');
let state = 'home', flight = null, hoverKey = null;
const currentLook = VIEWS.home.look.clone(), mouseN = new THREE.Vector2(), miradaV = new THREE.Vector3();
iniciarMovil({ lienzo: renderer.domElement, camera, puedeGirar: () => !flight && state !== 'intro' && state !== 'entrando' && (state === 'home' || state === 'pizarra' || plegado), alMover: () => { estado.sucio = true; } });

function hitTest(ev) {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(scene.children, true).find(h => h.object.visible && !(h.object.material && h.object.material.transparent));
  if (!hit) return null;
  const o = hit.object;
  if (objects.monitor.includes(o)) return { key: 'proyectos' };
  if (objects.clawd && o === objects.clawd.malla && hash.get('debug')) window.__uv = hit.uv ? [hit.uv.x, hit.uv.y] : null;
  if (objects.clawd && o === objects.clawd.malla) return hit.uv && !objects.clawd.activa && sobreIcono(hit.uv.x, hit.uv.y) ? { key: 'clawd' } : hit.uv && sobreVentana(hit.uv.x, hit.uv.y, state !== 'terminal') ? { key: 'terminal' } : state === 'terminal' ? { key: 'escritorio' } : null;   // el iconito de Clawd lo despierta; la zona donde se escriben los comandos hace zoom; el resto no hace nada
  if (objects.monitor2.includes(o)) return null;                    // el cuerpo del monitor no es la terminal
  if (objects.libro.includes(o)) return { key: 'educacion' };
  if (objects.ventana.includes(o)) return { key: 'experiencia' };
  if (objects.espejo.includes(o) || objects.espejoFotos?.includes(o)) return { key: 'sobremi' };
  if (mesa.manivela.includes(o) || o === mesa.zona) return { key: 'mesa' };
  if (objects.balon && o === objects.balon.bola) return { key: 'balon' };
  const pz = persiana.estores.findIndex(e => e.zona === o); if (pz >= 0) return { key: 'persiana' + pz };
  if (lamparas.listas && (o === objects.flexo || o === objects.flexoPantalla || o.parent === objects.flexoPantalla)) return { key: 'flexo' };
  if (lamparas.listas && (o === objects.barraLuz || o.parent === objects.barraLuz || o === objects.mandoLuz)) return { key: 'barra' };
  if (o === objects.boardFace || o === objects.pizarra) {
    // qué línea de la pizarra: la coordenada v de la textura en el punto tocado
    const v = o === objects.boardFace && hit.uv ? hit.uv.y : -1;
    const item = BOARD_ITEMS.find(([, y]) => Math.abs(v - y) < 0.06);
    return item ? { key: item[0], viaBoard: true } : { key: 'pizarra' };
  }
  return null;
}
// easter eggs: interacciones sin panel (no se iluminan ni llevan cartel; el cursor sí pasa a la manita)
const HUEVOS = new Set(['mesa', 'balon', 'persiana0', 'persiana1', 'barra', 'flexo', 'clawd', 'terminal']);
const grito = new Audio('./assets/cuarto/grito.mp3'); grito.preload = 'none';
let gritoAnim = null;
function huevoClic(k) {
  if (k === 'clawd') return objects.clawd?.clic(performance.now());
  if (k === 'terminal') return abrirTerminal();
  if (k === 'mesa') return alternarMesa();
  if (k.startsWith('persiana')) return alternarPersiana(+k.slice(8));
  if (k === 'barra' || k === 'flexo') return alternarLampara(k);
  if (k === 'balon' && !gritoAnim && objects.balon) {
    grito.currentTime = 0; grito.play().catch(() => {});
    gritoAnim = { t0: null, y0: objects.balon.grupo.position.y };
  }
}
function animarGrito(now) {                                        // el balón da botecitos y se menea mientras suena el grito
  const g = gritoAnim, b = objects.balon.grupo; if (g.t0 == null) g.t0 = now;
  const t = (now - g.t0) / 1700, fin = t >= 1, e = fin ? 0 : (1 - t);
  b.position.y = g.y0 + Math.abs(Math.sin(t * Math.PI * 3)) * 0.035 * e; b.rotation.z = Math.sin(t * Math.PI * 9) * 0.06 * e;
  b.updateMatrixWorld(true); estado.sucio = true; if (fin) gritoAnim = null;
}
// lámparas (barra de luz del monitor y flexo): un clic las enciende o las apaga. 'auto' sigue la hora (encendidas al atardecer y de noche, como están
// horneadas); al hacer clic pasan a 'on' u 'off'. La luz del cuarto se mezcla en horas.js con el horneado sin lámparas; aquí solo el resplandor propio
const lamparas = { listas: false, barra: { modo: 'auto', luz: 1, brillo: 0, glow: null }, flexo: { modo: 'auto', luz: 1, brillo: 0, glow: null } };
function brilloLampara(k) {
  const l = lamparas[k]; if (l.modo !== 'auto') return l.modo === 'on' ? 1 : 0;
  const w = Horas.W.value; return k === 'barra' ? Math.min(1, w.y + w.z) : w.z;
}
function alternarLampara(k) { lamparas[k].modo = brilloLampara(k) > 0.5 ? 'off' : 'on'; }
function animarLamparas(dt) {
  let cambia = false;
  if (!lamparas.listas) return;
  for (const k of ['barra', 'flexo']) {
    const l = lamparas[k], b = brilloLampara(k);
    const nb = l.brillo + Math.sign(b - l.brillo) * Math.min(Math.abs(b - l.brillo), dt / 300);
    if (nb !== l.brillo) {
      l.luz = l.brillo = nb; cambia = true;
      if (l.glow) { l.glow.visible = nb > 0.01; l.glow.material.color.setRGB(2.6 * nb, 2.1 * nb, 1.5 * nb); }
    }
  }
  if (cambia) { Horas.fijarLamparas(lamparas.barra.luz, lamparas.flexo.luz); estado.sucio = true; }
}
function construirResplandor() {
  for (const k of ['barra', 'flexo']) lamparas[k].luz = lamparas[k].brillo = brilloLampara(k);
  Horas.fijarLamparas(lamparas.barra.luz, lamparas.flexo.luz);
  const glow = (r, geo, padre, pos) => {
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI / 2; m.position.copy(pos); m.visible = false; m.raycast = () => {}; padre.add(m); lamparas[r].glow = m;
  };
  const b = objects.barraLuz;                                        // la barra: una tira cálida en su cara de abajo, hacia la mesa
  if (b) { b.geometry.computeBoundingBox(); const bb = b.geometry.boundingBox, c = bb.getCenter(new THREE.Vector3()); glow('barra', new THREE.PlaneGeometry(0.02, 0.40), b, new THREE.Vector3(bb.max.x - 0.012, bb.min.y - 0.0006, c.z)); }
  const f = objects.flexoPantalla;                                   // el flexo: el hueco de la pantalla (el lado ancho del cono, que mira a la cama)
  if (f) {
    const P = f.geometry.attributes.position; let sA = 0, nA = 0, sB = 0, nB = 0;
    for (let i = 0; i < P.count; i++) { const r = Math.hypot(P.getX(i), P.getZ(i)); if (P.getY(i) < 0) { sA += r; nA++; } else { sB += r; nB++; } }
    const lado = sA / nA > sB / nB ? -1 : 1; f.geometry.computeBoundingBox(); const bb = f.geometry.boundingBox;
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.066, 28), new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false, side: THREE.DoubleSide }));
    m.rotation.x = Math.PI / 2; m.position.set((bb.min.x + bb.max.x) / 2, lado < 0 ? bb.min.y - 0.0006 : bb.max.y + 0.0006, (bb.min.z + bb.max.z) / 2); m.visible = false; m.raycast = () => {};
    f.add(m); lamparas.flexo.glow = m;
  }
}
// estores enrollables (como el IKEA Tåndlundfly de día y noche): son dos, uno por hoja de la ventana. Cada uno tiene su rollo arriba, la tela a bandas
// (opaca y translúcida, que se enrollan con ella) y la barra de abajo. Al tocar la barra de uno sube y baja entre tres alturas: toda abajo, la de siempre y toda arriba
const PERSIANA_Y = { abajo: 1.02, arriba: 2.075 };   // y (m, mundo) del centro de la barra con el estor todo abajo / todo arriba
const BANDA = 0.022;                                  // alto de cada banda de la tela con el estor estirado (encogen hasta un 25 % al recogerlo)
const persiana = { malla: null, estores: [] };
// color de fondo de una portada: mediana (por canal) de los píxeles del marco exterior de la imagen que no son blancos (el blanco es del fondo de la foto o del rótulo)
function colorDeFondo(img) {
  const N = 32, c = document.createElement('canvas'); c.width = c.height = N;
  const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, N, N);
  const d = x.getImageData(0, 0, N, N).data, canal = [[], [], []];
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    if (i >= 5 && i < N - 5 && j >= 5 && j < N - 5) continue;
    const k = (j * N + i) * 4; if (d[k] > 225 && d[k + 1] > 225 && d[k + 2] > 225) continue;
    for (let q = 0; q < 3; q++) canal[q].push(d[k + q]);
  }
  const med = a => a.length ? a.sort((p, q) => p - q)[a.length >> 1] : 128;
  return new THREE.Color().setRGB(...canal.map(a => med(a) / 255), THREE.SRGBColorSpace);
}
function construirPersiana(room) {
  const o = room.getObjectByName('estor'); if (!o) return;
  const g = o.geometry, P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, I = g.index, n = P.count;
  const par = Array.from({ length: n }, (_, i) => i), raiz = x => { while (par[x] !== x) { par[x] = par[par[x]]; x = par[x]; } return x; };
  const ids = new Map();
  for (let i = 0; i < n; i++) { const k = `${Math.round(P.getX(i) * 1e4)},${Math.round(P.getY(i) * 1e4)},${Math.round(P.getZ(i) * 1e4)}`; if (ids.has(k)) par[raiz(i)] = raiz(ids.get(k)); else ids.set(k, i); }
  for (let f = 0; f < I.count; f += 3) { par[raiz(I.getX(f))] = raiz(I.getX(f + 1)); par[raiz(I.getX(f + 1))] = raiz(I.getX(f + 2)); }
  const piezas = new Map();
  for (let i = 0; i < n; i++) { const r = raiz(i); if (!piezas.has(r)) piezas.set(r, { v: [], f: [], y0: 1e9, y1: -1e9 }); const c = piezas.get(r); c.v.push(i); c.y0 = Math.min(c.y0, P.getY(i)); c.y1 = Math.max(c.y1, P.getY(i)); }
  for (let f = 0; f < I.count; f += 3) piezas.get(raiz(I.getX(f))).f.push(I.getX(f), I.getX(f + 1), I.getX(f + 2));
  const ps = [...piezas.values()].sort((a, b) => b.y1 - a.y1);      // riel, lamas de arriba abajo y la barra
  if (ps.length !== 28) { console.warn('persiana: piezas inesperadas', ps.length); return; }
  const riel = ps[0], barra = ps[27];
  const caja = c => { const b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9, z0: 1e9, z1: -1e9 }; for (const v of c.v) { b.x0 = Math.min(b.x0, P.getX(v)); b.x1 = Math.max(b.x1, P.getX(v)); b.y0 = Math.min(b.y0, P.getY(v)); b.y1 = Math.max(b.y1, P.getY(v)); b.z0 = Math.min(b.z0, P.getZ(v)); b.z1 = Math.max(b.z1, P.getZ(v)); } return b; };
  const bb = caja(barra), br = caja(riel), cb0 = (bb.y0 + bb.y1) / 2, bh = bb.y1 - bb.y0, zf = (bb.z0 + bb.z1) / 2, bd = Math.max(0.014, bb.z1 - bb.z0);
  // la luz horneada se toma de un solo punto del estor (el centro del mayor triángulo de una lama que mira al cuarto): la tela queda uniforme y sigue la hora del día
  let u = 0, w = 0, mejor = -1;
  for (let f = 0; f < ps[9].f.length; f += 3) {
    const [a, b, c] = [ps[9].f[f], ps[9].f[f + 1], ps[9].f[f + 2]], ux = P.getX(b) - P.getX(a), uy = P.getY(b) - P.getY(a), uz = P.getZ(b) - P.getZ(a), vx = P.getX(c) - P.getX(a), vy = P.getY(c) - P.getY(a), vz = P.getZ(c) - P.getZ(a);
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx, area = Math.hypot(nx, ny, nz), q = area * (nz > 0 ? 1 : 0.2);
    if (q > mejor) { mejor = q; u = (U.getX(a) + U.getX(b) + U.getX(c)) / 3; w = (U.getY(a) + U.getY(b) + U.getY(c)) / 3; }
  }
  const oy = o.position.y, yc = br.y1 - 0.026;                       // la malla está en coordenadas locales: y mundo = y local + oy; yc: eje del rollo
  const TELA = yc - (PERSIANA_Y.abajo - oy + bh / 2) + 0.06, K = Math.ceil(TELA / (BANDA * 0.75)) + 1, S = 18;
  const mid = (bb.x0 + bb.x1) / 2, hojas = [[bb.x0, mid - 0.006], [mid + 0.006, bb.x1]];
  const nR = riel.v.length, nF = K * 4, nB = 24, nC = (S + 1) * 2, porEstor = nF + nB + nC, total = nR + 2 * porEstor;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2), col = new Float32Array(total * 4), idx = [];
  for (let i = 0; i < total; i++) { uv[i * 2] = u; uv[i * 2 + 1] = w; col.set([1, 1, 1, 1], i * 4); nor.set([0, 0, 1], i * 3); }
  const loc = new Map(); riel.v.forEach((vi, k) => { loc.set(vi, k); pos.set([P.getX(vi), P.getY(vi), P.getZ(vi)], k * 3); nor.set([N.getX(vi), N.getY(vi), N.getZ(vi)], k * 3); uv.set([U.getX(vi), U.getY(vi)], k * 2); });
  for (const vi of riel.f) idx.push(loc.get(vi));
  const cubo = [[0, 1, 2, 3], [5, 4, 7, 6], [4, 0, 3, 7], [1, 5, 6, 2], [3, 2, 6, 7], [4, 5, 1, 0]];       // las 6 caras de la barra (cada una con sus 4 vértices)
  const estores = hojas.map(([x0, x1], e) => {
    const ini = nR + e * porEstor, iB = ini + nF, iC = iB + nB;
    for (let k = 0; k < K; k++) { const a = ini + k * 4; for (let j = 0; j < 4; j++) col[(a + j) * 4 + 3] = k % 2 ? 0.8 : 1; idx.push(a, a + 1, a + 2, a, a + 2, a + 3); }   // bandas impares: algo translúcidas (se notan sobre todo con luz)
    cubo.forEach((c, f) => { const a = iB + f * 4; idx.push(a, a + 1, a + 2, a, a + 2, a + 3); });
    for (let j = 0; j < S; j++) { const a = iC + j * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    const zona = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.09, 0.12), new THREE.MeshBasicMaterial({ visible: false }));
    zona.position.set(o.position.x + (x0 + x1) / 2, oy + cb0, o.position.z + 0.04); scene.add(zona); zona.updateMatrixWorld(true);
    return { x0, x1, ini, iB, iC, zona, nivel: 1, dir: -1, anim: null, y: 0 };
  });
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); geo.setAttribute('color', new THREE.BufferAttribute(col, 4)); geo.setIndex(idx);
  o.geometry = geo; o.frustumCulled = false; persiana.malla = o; persiana.estores = estores;
  const m = o.material; m.vertexColors = true; m.transparent = true; m.side = THREE.DoubleSide; m.needsUpdate = true;
  // de noche el horneado trae el relleno azul del cielo y el estor sale azulado: se desatura y se aclara hacia el blanco (es blanco; solo le falta luz)
  const pesos = Horas.W;
  m.onBeforeCompile = sh => {
    sh.uniforms.pesos = pesos;
    sh.fragmentShader = 'uniform vec3 pesos;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `float lum = dot(outgoingLight, vec3(.2126, .7152, .0722));
      outgoingLight = mix(outgoingLight, vec3(clamp(.16 + lum * 1.25, .2, .5)) * vec3(.97, .98, 1.), pesos.z);
      #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'estor-noche';
  const poner = (e, yb) => {                                         // yb: y (mundo) del centro de la barra de ese estor
    const cb = yb - oy, bTop = cb + bh / 2, Lh = Math.max(0.001, yc - bTop), rolled = Math.max(0, TELA - Lh), banda = BANDA * (0.75 + 0.25 * Math.min(1, Lh / (TELA - 0.06))), r = Math.sqrt(0.018 * 0.018 + rolled * 0.0016 / Math.PI);
    for (let k = 0; k < K; k++) {
      const yA = yc - Math.min(k * banda, Lh), yB = yc - Math.min((k + 1) * banda, Lh);
      pos.set([e.x0, yA, zf, e.x1, yA, zf, e.x1, yB, zf, e.x0, yB, zf], (e.ini + k * 4) * 3);
    }
    const lx = e.x0, hx = e.x1, y0 = cb - bh / 2, y1 = cb + bh / 2, z0 = zf - bd / 2, z1 = zf + bd / 2;
    const v = [[lx, y1, z1], [hx, y1, z1], [hx, y0, z1], [lx, y0, z1], [lx, y1, z0], [hx, y1, z0], [hx, y0, z0], [lx, y0, z0]];
    cubo.forEach((c, f) => { for (let j = 0; j < 4; j++) pos.set(v[c[j]], (e.iB + f * 4 + j) * 3); });
    for (let j = 0; j <= S; j++) {
      const ang = j / S * Math.PI * 2, yy = yc + r * Math.cos(ang), zz = zf - r + r * Math.sin(ang);
      pos.set([e.x0, yy, zz, e.x1, yy, zz], (e.iC + j * 2) * 3);
    }
    geo.attributes.position.needsUpdate = true; geo.computeBoundingSphere(); geo.computeBoundingBox();
    e.y = yb; e.zona.position.y = yb; e.zona.updateMatrixWorld(true); o.updateMatrixWorld(true); estado.sucio = estado.solSucio = true;
  };
  persiana.poner = poner; persiana.niveles = [PERSIANA_Y.abajo, oy + cb0, PERSIANA_Y.arriba];
  estores.forEach(e => poner(e, persiana.niveles[1]));
  const prueba = (hash.get('persiana') || '').split(',');            // solo para revisar (0 abajo, 1 actual, 2 arriba); "0,2" = uno de cada
  if (prueba[0] !== '') estores.forEach((e, i) => poner(e, persiana.niveles[+(prueba[i] ?? prueba[0])]));
}
function alternarPersiana(i) {
  const e = persiana.estores[i]; if (!e || e.anim) return;
  const nuevo = e.nivel + e.dir; e.anim = { t0: null, de: e.y, a: persiana.niveles[nuevo], dur: 1500 };
  e.nivel = nuevo; if (nuevo === 0) e.dir = 1; else if (nuevo === 2) e.dir = -1;
}
function animarPersiana(now) {
  for (const e of persiana.estores) {
    const a = e.anim; if (!a) continue; if (a.t0 == null) a.t0 = now;
    const t = Math.min(1, (now - a.t0) / a.dur), ease = t * t * (3 - 2 * t);
    persiana.poner(e, a.de + (a.a - a.de) * ease); if (t >= 1) e.anim = null;
  }
}
function setHover(h, ev) {
  hoverKey = h ? h.key : null;
  const sel = !h ? [] : { proyectos: objects.monitor, terminal: objects.monitor2, educacion: objects.libro, experiencia: objects.ventana.filter(o => !o.name.startsWith('paisaje')), sobremi: objects.espejo.filter(o => o.isMesh && o.name), pizarra: [objects.pizarra] }[h.key] || [];
  // desde la pizarra: se ilumina el objeto real al que apunta cada línea, y también la pizarra
  const clave = h ? h.key + (h.viaBoard ? '+pizarra' : '') : '';
  if (clave !== setHover.clave) {                                     // solo si cambia; al quitarlo se apaga con un fundido
    setHover.clave = clave;
    for (const k in lineasPizarra) lineasPizarra[k].obj = h && h.viaBoard && h.key === k ? 1 : 0;
    if (sel.length) contorno(sel);
    contornoAnim.objetivo = sel.length ? 1 : 0; contornoSucio = true;   // la escena no cambia: basta rehacer el contorno
  }
  if (h && ev) {
    const txt = SECTIONS[h.key] || T.pizarraTip;
    if (tooltip.textContent !== txt) tooltip.textContent = txt;
    tooltip.style.transform = `translate(${ev.clientX + 14}px, ${ev.clientY + 14}px)`; tooltip.classList.add('on');   // transform: sin recalcular el diseño
  } else tooltip.classList.remove('on');
  renderer.domElement.style.cursor = h ? 'pointer' : 'default';
}
let movPendiente = null;          // el raycast se hace una vez por fotograma, no en cada evento del ratón (pueden llegar 500-1000 por segundo)
renderer.domElement.addEventListener('mousemove', ev => {
  // mouseN se queda en 0: la cámara ya no «respira» con el ratón (menos repintados y nada se mueve al apuntar); basta volver a rellenarlo aquí para recuperar el balanceo
  if (state === 'intro') { renderer.domElement.style.cursor = 'pointer'; movPendiente = ev; return; }
  if (state === 'sobremi') { renderer.domElement.style.cursor = FOTOS[fotoBajo(ev)] ? 'pointer' : 'default'; return; }
  movPendiente = ev;
});
// en el pasillo: la puerta (o la pegatina, si se apunta a ella) se ilumina con el mismo contorno que los muebles
function hoverPuerta(ev) {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(intro.puerta, false)[0];
  const sel = !hit ? [] : hit.object === intro.pegatina ? [intro.pegatina] : zoomPegatina ? [] : intro.puerta.filter(o => o !== intro.pegatina);
  const clave = sel.length ? (sel[0] === intro.pegatina ? 'peg' : 'puerta') : '';
  if (clave === hoverPuerta.clave) return;
  hoverPuerta.clave = clave;
  if (sel.length) contorno(sel);
  contornoAnim.objetivo = sel.length ? 1 : 0; contornoSucio = true;
}
// pegatina de la puerta: clic en ella = zoom muy cercano; con el zoom puesto, un clic fuera la suelta (y otro clic entra, como siempre)
let zoomPegatina = false;
function alPegatina(ev) {
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  return !!intro?.pegatina && ray.intersectObject(intro.pegatina, false).length > 0;
}
function ponerZoomPegatina(on) {
  zoomPegatina = on; hint.textContent = on ? T.hintPegatina : T.hintPuerta;
  flyTo(on ? intro.vistaPegatina : intro.vista, null, 1.1);
}
renderer.domElement.addEventListener('click', ev => {
  if (giro.arrastro) return;                                         // el clic que acompaña a un arrastre del dedo no cuenta
  if (state === 'intro') {
    if (flight) return;
    if (zoomPegatina) { if (!alPegatina(ev)) ponerZoomPegatina(false); return; }
    if (alPegatina(ev)) return ponerZoomPegatina(true);
    return entrar();
  }
  if (flight) return;
  if (state === 'home' || state === 'pizarra') {
    const h = hitTest(ev);
    if (!h) { if (state === 'pizarra') goHome(); return; }
    if (h.key === 'pizarra') { if (state !== 'pizarra') goBoard(); return; }
    if (HUEVOS.has(h.key)) { huevoClic(h.key); return; }
    openSection(h.key);
  } else if (state === 'terminal') {
    const h = hitTest(ev);
    if (h && h.key === 'clawd') { objects.clawd.clic(performance.now()); entradaTerminal.focus({ preventScroll: true }); }
    else if (h && (h.key === 'terminal' || h.key === 'escritorio')) entradaTerminal.focus({ preventScroll: true });
    else goHome();                                                  // un clic fuera de la pantalla vuelve al cuarto
  } else if (state === 'sobremi' && fotoBajo(ev) >= 0 && !panel.contains(ev.target)) { mostrarFoto(fotoBajo(ev)); }
  else if (!panel.contains(ev.target) && !esMovil) goHome();          // en el móvil se sale con «Volver»: un toque en la escena con el panel minimizado no debe sacarte
});
addEventListener('keydown', e => { if (state === 'intro') return zoomPegatina ? (!flight && ponerZoomPegatina(false)) : entrar();
  if (e.key === 'Escape' && state !== 'home' && !flight) goHome(); });
backBtn.addEventListener('click', () => !flight && goHome());

// smootherstep: arranca y frena sin tirón (aceleración nula en los extremos), como una grúa o un dron de cine
const ease = t => t * t * t * (t * (t * 6 - 15) + 10);
function flyTo(to, done, dur = 1.6, via = null) {
  if (hash.get('instant')) dur = 0.05;      // solo para pruebas automáticas
  // el destino ya incluye el balanceo del ratón de esa vista: al llegar no hay que corregir nada
  const amp = to === VIEWS.home ? 1 : to === VIEWS.pizarra ? 0.25 : 0;
  if (amp) to = { ...to, pos: to.pos.clone().add({ x: mouseN.x * 0.06 * amp, y: -mouseN.y * 0.04 * amp, z: 0 }), q: null };
  reiniciarGiro();
  flight = { from: { pos: camera.position.clone(), look: currentLook.clone(), fov: camera.fov, q: camera.quaternion.clone(), dist: camera.position.distanceTo(currentLook) }, to, done, via, t0: null, dur: dur * 1000 };   // t0: el primer fotograma; via: punto de paso (curva)
}
// ---------------------------------------------------------------- terminal (la segunda pantalla): zoom y escritura
// Al hacer clic en la pantalla de la izquierda la cámara se acerca de frente; lo que se teclea va a un campo invisible (también sirve para el teclado del móvil)
// y se dibuja en la terminal. Solo se obedece a los comandos que se conocen (/help los lista); lo demás saca al Clawd dubitativo del «404».
const entradaTerminal = Object.assign(document.createElement('input'), { id: 'termInput', type: 'text', autocomplete: 'off', spellcheck: false, maxLength: 26 });
entradaTerminal.setAttribute('autocapitalize', 'off'); entradaTerminal.setAttribute('aria-label', 'terminal');
entradaTerminal.style.cssText = 'position:fixed;left:0;bottom:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;pointer-events:none';
document.body.append(entradaTerminal);
entradaTerminal.addEventListener('input', () => objects.clawd?.escribir(entradaTerminal.value));
entradaTerminal.addEventListener('keydown', e => {
  const cl = objects.clawd;
  if (e.key === 'Enter') { e.preventDefault(); cl?.ejecutar(entradaTerminal.value); entradaTerminal.value = ''; cl?.escribir(''); }
  else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { if (cl?.mover(e.key === 'ArrowDown' ? 1 : -1)) e.preventDefault(); }       // el menú de comandos
  else if (e.key === 'Tab') { e.preventDefault(); const r = cl?.completar(); if (r) entradaTerminal.value = r; }                      // autocompleta
  else if (e.key === 'Escape') { e.preventDefault(); if (cl?.sug.length) { entradaTerminal.value = ''; cl.escribir(''); } else if (!flight) goHome(); }   // Esc cierra el menú; con el menú cerrado, sale
  e.stopPropagation();
});
function vistaTerminal() {                                          // de frente a la pantalla, a 60 cm, para que quepa entera
  const p = objects.pantalla2; p.updateWorldMatrix(true, false);
  const c = new THREE.Vector3(), q = new THREE.Quaternion(); p.getWorldPosition(c); p.getWorldQuaternion(q);
  const n = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
  return V(c.clone().addScaledVector(n, 0.62).toArray(), c.toArray(), 34);
}
function abrirTerminal() {
  if (!objects.clawd || !objects.pantalla2) return;
  const from = state; state = 'terminal'; setHover(null); hint.style.opacity = 0; panel.hidden = true; backBtn.hidden = false;
  VIEWS.terminal = vistaTerminal();
  objects.clawd.alSalir = () => { if (state === 'terminal' && !flight) goHome(); };
  flyTo(VIEWS.terminal, () => {
    objects.clawd.entrarTerminal(); entradaTerminal.value = ''; entradaTerminal.focus({ preventScroll: true });
    hint.textContent = LANG === 'en' ? 'Type a command (try /help) · Esc to go back' : 'Escribe un comando (prueba /help) · Esc para volver'; hint.style.opacity = 1;
  }, from === 'pizarra' ? 1.8 : 1.5);
}
function cerrarTerminal() { objects.clawd?.salirTerminal(); entradaTerminal.blur(); entradaTerminal.value = ''; }
function goBoard() {
  state = 'pizarra'; setHover(null); hint.style.opacity = 0; panel.hidden = true; backBtn.hidden = false;
  flyTo(VIEWS.pizarra, () => { hint.textContent = T.hintPizarra; hint.style.opacity = 1; }, 1.4);
}
function irAlEspejo() {
  // sin personaje (archivado): la cámara se acerca de frente al espejo, a la altura de los ojos, y aparece "Sobre mí"
  state = 'sobremi'; setHover(null); hint.style.opacity = 0; panel.hidden = true; backBtn.hidden = true;
  flyTo(VIEWS.sobremi, () => showPanel('sobremi'), 1.8);
}
let libro3dActivo = false, libroPanel = null;                           // libroPanel: el .book 3D mientras se ve (sus hojas siguen al libro del modelo)
const EDU_PLANO = VIEWS.educacion;
function openSection(key) {
  if (key === 'sobremi') return irAlEspejo();
  if (key === 'terminal') return abrirTerminal();
  const from = state; state = key; setHover(null); hint.style.opacity = 0; panel.hidden = true;
  if (key === 'educacion') {                                          // el libro se abre de verdad (en pantallas apaisadas); en el móvil, el panel de siempre
    libro3dActivo = !esMovil && innerWidth / innerHeight >= 1.25 && !!objects.libro3d;
    VIEWS.educacion = libro3dActivo ? objects.libro3d.vista(innerWidth / innerHeight) : EDU_PLANO;
    if (libro3dActivo) return flyTo(VIEWS.educacion, () => { const l = objects.libro3d; l.mostrar(true); l.mover(1, 1700, () => showPanel('educacion')); }, from === 'pizarra' ? 1.8 : 1.6);
  }
  flyTo(VIEWS[key], () => requestAnimationFrame(() => showPanel(key)), from === 'pizarra' ? 1.8 : 1.6);   // el panel, un fotograma después del último del vuelo
}
function goHome() {
  if (state === 'sobremi' && objects.javier) objects.javier.volverSilla();
  if (state === 'terminal') cerrarTerminal();
  if (state === 'educacion' && objects.libro3d?.visible) { libroPanel = null; const l = objects.libro3d; l.mover(0, 1000, () => l.mostrar(false)); }   // el libro se cierra mientras la cámara se aleja
  panel.hidden = true; backBtn.hidden = true; state = 'home'; setHover(null);
  flyTo(VIEWS.home, () => { hint.textContent = T.hintCuarto; hint.style.opacity = 1; }, 1.5);
}

// ---------------------------------------------------------------- paneles
// en pantallas estrechas el panel ocupa todo: un botón lo minimiza para tocar y mover la escena (el espejo y sus fotos, el monitor, el libro) y lo vuelve a abrir
const plegarBtn = document.getElementById('plegar');
let plegado = false;
function ponerPlegado(v) { plegado = v; panel.classList.toggle('plegado', v); plegarBtn.textContent = v ? T.abrir : T.plegar; estado.sucio = true; }
plegarBtn.addEventListener('click', () => ponerPlegado(!plegado));
new MutationObserver(() => { plegarBtn.hidden = panel.hidden; if (panel.hidden) ponerPlegado(false); }).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
const todo = s => PENDIENTE.test(s) ? `<span class="todo">${s}</span>` : s;
function screenRect(mesh) {
  camera.updateMatrixWorld(); mesh.updateWorldMatrix(true, false);
  mesh.geometry.computeBoundingBox(); const bb = mesh.geometry.boundingBox;
  const pts = [];
  for (const x of [bb.min.x, bb.max.x]) for (const y of [bb.min.y, bb.max.y]) for (const z of [bb.min.z, bb.max.z])
    pts.push(new THREE.Vector3(x, y, z).applyMatrix4(mesh.matrixWorld).project(camera));
  const xs = pts.map(p => (p.x * .5 + .5) * innerWidth), ys = pts.map(p => (-p.y * .5 + .5) * innerHeight);
  return { left: Math.min(...xs), top: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
}
// el contenido de cada panel se crea una vez y se reutiliza (abrir un panel no vuelve a interpretar HTML)
const panelNodos = {};
function poner(key, html) {
  const n = panelNodos[key] ??= Object.assign(document.createElement('div'), { innerHTML: html() });
  n.style.display = 'contents'; panel.replaceChildren(n);
  for (const b of n.querySelectorAll('.book')) { b.classList.remove('opening'); requestAnimationFrame(() => { if (!b.classList.contains('book3d')) b.classList.add('opening'); b.dispatchEvent(new Event('abrir')); }); }   // que el libro se vuelva a abrir
}
// bocadillo de una foto del espejo: sustituye al panel de "Sobre mí" (con un botón para volver)
function fotoBajo(ev) {                                           // índice de la foto bajo el ratón (-1: ninguna); las fotos son transparentes y no entran en hitTest
  if (!objects.espejoFotos?.length) return -1;
  ndc.set((ev.clientX / innerWidth) * 2 - 1, -(ev.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hit = ray.intersectObjects(objects.espejoFotos, false)[0];
  return hit ? hit.object.userData.idx : -1;
}
function mostrarFoto(i) {
  const f = FOTOS[i]; if (!f) return;
  panel.hidden = false; panel.className = ''; ponerPlegado(false);
  panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = '';
  Object.assign(panel.style, { left: '', right: '4vw', top: '50%', transform: 'translateY(-50%)', width: 'min(470px, 36vw)', height: '' });
  panel.replaceChildren(Object.assign(document.createElement('div'), { className: 'card bocadillo',
    innerHTML: `<button class="px-btn volver-sm" type="button">← ${SECTIONS.sobremi}</button><h2>${f.title}</h2>${f.paras.map(p => typeof p === 'string' ? `<p>${p}</p>` : p.mapa ? `<figure class="mapa" tabindex="0" role="button" aria-label="${T.ampliarMapa}">${MAPA}<figcaption>${T.ampliarMapa}</figcaption></figure>` : `<h3>${p.h}</h3>${p.t ? `<p>${p.t}</p>` : ''}${p.list ? `<ul>${p.list.map(x => typeof x === 'string' ? `<li>${x}</li>` : `<li><a href="${x.href}" target="_blank" rel="noopener">${x.t}</a>${x.res ? ', ' + x.res : ''}</li>`).join('')}</ul>` : ''}`).join('')}` }));
  panel.querySelector('.volver-sm').addEventListener('click', () => showPanel('sobremi'));
  const mapa = panel.querySelector('.mapa');
  if (mapa) { mapa.addEventListener('click', abrirMapa); mapa.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirMapa(); } }); }
}
// el nombre de un país visitado al pasar el ratón por encima, solo con el mapa ampliado (solo los visitados llevan nombre)
const mapaTip = Object.assign(document.createElement('div'), { className: 'mapa-tip', hidden: true }); document.body.appendChild(mapaTip);
document.addEventListener('mousemove', e => {
  const p = e.target.closest?.('.mapa-grande .mapa-svg .v, .mapa-grande .mapa-svg .h'), n = p?.dataset[LANG === 'en' ? 'en' : 'es'];
  mapaTip.hidden = !n; if (n) { mapaTip.textContent = n; mapaTip.style.left = e.clientX + 14 + 'px'; mapaTip.style.top = e.clientY + 14 + 'px'; }
});
// el mapa del mundo ampliado; se cierra con un clic o con Esc
function abrirMapa() {
  const velo = Object.assign(document.createElement('div'), { className: 'mapa-grande', innerHTML: `<div class="mapa-caja">${MAPA}</div>` });
  const cerrar = () => { velo.remove(); removeEventListener('keydown', alTeclear, true); };
  const alTeclear = e => { if (e.key === 'Escape') { e.stopImmediatePropagation(); cerrar(); } };
  velo.addEventListener('click', cerrar); addEventListener('keydown', alTeclear, true);
  document.body.appendChild(velo);
}
function showPanel(key) {
  libroPanel = null;
  // la animación de entrada arranca sola al dejar de estar oculto; solo si ya se veía hay que reiniciarla
  if (!panel.hidden) { panel.style.animation = 'none'; void panel.offsetWidth; panel.style.animation = ''; }
  backBtn.hidden = false; panel.hidden = false; panel.className = ''; ponerPlegado(false);
  if (key === 'proyectos') {
    const r = screenRect(objects.screen);
    Object.assign(panel.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', transform: '', right: '' });
    poner(key, () => `<div class="desktop">${PROJECTS.map(p => `
      <div class="win"><div class="bar">${p.title}</div><div class="body">${todo(p.blurb)}<br>${p.tags.map(t => `<span class="tag">${t}</span>`).join('')}${p.link ? `<br><a class="plink" href="${p.href}" target="_blank" rel="noopener">${p.link}</a>` : ''}</div></div>`).join('')}</div>`);
  } else if (key === 'experiencia') {
    Object.assign(panel.style, { left: '', right: '6vw', top: '50%', transform: 'translateY(-50%)', width: 'min(460px, 40vw)', height: '' });
    poner(key, () => `<div class="card"><h2>${SECTIONS.experiencia}</h2>${EXPERIENCE.map(e => `<h3>${todo(e.what)}</h3><p>${todo(e.when)}</p><p>${todo(e.detail)}</p>`).join('')}</div>`);
  } else if (key === 'sobremi') {
    Object.assign(panel.style, { left: '', right: '5vw', top: '50%', transform: 'translateY(-50%)', width: 'min(380px, 32vw)', height: '' });
    poner(key, () => `<div class="card"><h2>${ABOUT.name}</h2><p><b>${ABOUT.role}</b></p><p>${todo(ABOUT.bio)}</p>
      <ul>${(ABOUT.gustos || []).map(g => `<li>${g}</li>`).join('')}</ul>
      <h3>${T.contacto}</h3><div class="contactos">${ABOUT.links.map(l => `<a class="ico ico-${l.icon}" href="${l.href}" target="_blank" rel="noopener" aria-label="${l.label}">${icono(l.icon)}<span>${l.label}</span></a>`).join('')}</div></div>`);
  } else if (key === 'educacion') {
    const bloques = e => e.items ? [`<h3>${todo(e.what)}</h3><ul>${e.items.map(i => `<li>${todo(i)}</li>`).join('')}</ul>`]
      : [`<h3>${todo(e.what)}</h3><p>${todo(e.when)}</p><p>${todo(e.detail)}</p>`, ...(e.honores ? [`<p>${e.honores.label}:</p><ul>${e.honores.items.map(i => `<li><a href="${i.href}" target="_blank" rel="noopener">${i.t}</a></li>`).join('')}</ul>`] : [])];
    if (libro3dActivo) {                                              // las hojas de texto van encima de las del libro 3D, a pantalla completa y sin marco
      Object.assign(panel.style, { left: '0', top: '0', width: '100%', height: '100%', transform: 'none', right: '' }); panel.classList.add('libro3d');
      poner('educacion3d', () => `<div class="book book3d"><div class="hoja"><div class="page left"></div></div><div class="hoja"><div class="page right"></div></div></div>`);
      libroPanel = panel.querySelector('.book'); montarLibro(libroPanel, `<h2>${SECTIONS.educacion}</h2>`, EDUCATION.map(bloques), T);
    } else {
      libroPanel = null;
      Object.assign(panel.style, { left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 'min(94vw, 124vh)', height: '', right: '' });   // el libro abierto son dos A4 (420 x 297): ancho = 1,414 x alto
      poner(key, () => `<div class="book"><div class="page left"></div><div class="page right"></div></div>`);
      montarLibro(panel.querySelector('.book'), `<h2>${SECTIONS.educacion}</h2>`, EDUCATION.map(bloques), T);
    }
  }
}

// ---------------------------------------------------------------- bucle
// Se pinta solo cuando algo cambia (cámara, contorno, hora, puerta, tamaño): con el ratón quieto la GPU descansa.
//  - En reposo: la imagen nítida, entera.
//  - Balanceo del ratón: la nítida entera cada fotograma si cabe en el tiempo; si no, como el renderizado asíncrono de los
//    juegos: se pinta a trozos (2 o 4 fotogramas) alternando dos juegos de búferes, y lo que se ve es la última terminada,
//    reproyectada a la cámara actual con su profundidad (bicúbico + enfocado: la misma nitidez que la real).
//  - Vuelos y puerta: la nítida si cabe; si no, resolución dinámica medida en la GPU (cadenas de 85, 72 y 60 %, afiladas
//    con CAS); al llegar, la nítida con un fundido corto. Todo se decide midiendo cada fotograma en la GPU.
let contornoSucio = false, mezcla = 1, ultimaMovil = null;        // mezcla: cuánto se ve la nítida (1) frente a la de movimiento (0)
const contornoAnim = { brillo: 0, objetivo: 0 };            // el contorno aparece y se va con un fundido, no de golpe
const camUlt = new THREE.Matrix4(), tmp = new THREE.Vector3();
// coste de cada cadena respecto a la nítida
const factor = [1, 0.6, 0.45, 0.36];                            // medido en la Iris Xe (la nítida lleva antialiasing 4x; en vuelo, ahorros alternos)
// nivel: cadena para volar; equiv: lo que tardaría ahora la nítida en la GPU (ms), deducido de cualquier fotograma medido
const calidad = { nivel: 0, equiv: null, cpu: 0, margen: 1 };   // margen: baja si se pierden fotogramas, sube despacio si no
if (hash.get('debug')) { window.__calidad = calidad; calidad.usos = { entera: 0, trozo: 0, reproy: 0, ligera: 0, contorno: 0 }; }
const carga = +(hash.get('carga') || 1);                   // solo para pruebas: simula una GPU N veces más lenta
const estimar = i => (calidad.equiv ?? 0) * factor[i] * carga;
const presupuesto = () => ritmo.refresco * 0.75 * calidad.margen;   // el resto, para el navegador y la composición de la pantalla
function elegirNivel() {
  let n = cadenas.length - 1;
  for (let i = 0; i < cadenas.length; i++) if (estimar(i) < presupuesto() * (i < calidad.nivel ? 0.8 : 1)) { n = i; break; }   // subir de calidad, con margen
  calidad.nivel = n;
}
const usar = k => { if (calidad.usos) calidad.usos[k]++; };
// la última nítida terminada (con la cámara con la que se pintó) y la que se está pintando a trozos
const lista = { cadena: null, inv: new THREE.Matrix4(), cam: new THREE.Matrix4(), pos: new THREE.Vector3(), q: new THREE.Quaternion() };
const obra = { cadena: null, etapa: 0, inv: new THREE.Matrix4(), cam: new THREE.Matrix4(), pos: new THREE.Vector3(), q: new THREE.Quaternion() };
const vpActual = new THREE.Matrix4();
function anotarCamara(o) {
  o.inv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert(); o.cam.copy(camera.matrixWorld);
  o.pos.copy(camera.position); o.q.copy(camera.quaternion);
}
function prepararEspejos(escala) { for (const e of espejos) { e.nuevoFotograma(); e.escala = escala; } }
// solo para pruebas (#lastre=N): una pasada inútil de GPU proporcional a los píxeles pintados, para simular un equipo lento de verdad
const lastre = (() => {
  const n = +(hash.get('lastre') || 0); if (!n) return null;
  const rt = new THREE.WebGLRenderTarget(256, 256), q = new FullScreenQuad(new THREE.ShaderMaterial({
    uniforms: { n: { value: n } }, vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: 'uniform float n; void main(){ float a = gl_FragCoord.x; for (int i = 0; i < 4000; i++) { if (float(i) > n * 200.) break; a = fract(sin(a) * 43758.5453); } gl_FragColor = vec4(a); }' }));
  return px => { const v = Math.max(16, Math.round(256 * Math.sqrt(px))); rt.setSize(v, v); renderer.setRenderTarget(rt); q.render(renderer); renderer.setRenderTarget(null); };
})();
// pinta (fn(arg)) cronometrando en la GPU con la etiqueta i: 0..3 cadenas enteras; -1..-4 / -5..-6 trozos de una nítida
// (en 4 o en 2); -9 reproyección
function medida(i, fn, arg) {
  if (lastre && i !== -9) { const f = fn; fn = a => { f(a); lastre(i >= 0 ? cadenas[i].escala ** 2 : 1 / (obra.trozos || 4)); }; }   // pruebas
  if (cronometro) cronometro.medir(i, fn, arg); else fn(arg);
}
// lo que dice el cronómetro: el coste de la nítida (directo o sumando sus trozos), el del último fotograma y el de cada trozo
function anotarTiempo(i, ms) {
  const aprender = v => { calidad.equiv = calidad.equiv == null ? v : calidad.equiv * 0.85 + v * 0.15; };
  if (i >= 0) { calidad.gpuUlt = ms; aprender(ms / factor[i]); return; }
  if (i >= -8) {
    if (i === -1 || i === -5) calidad.acum = 0;
    calidad.acum = (calidad.acum ?? 0) + ms;
    if (i === -4 || i === -6) { calidad.gpuUlt = ms; aprender(calidad.acum); }
  }
  calidad[`ms${i}`] = (calidad[`ms${i}`] ?? ms) * 0.9 + ms * 0.1;
}
// la nítida entera, en este fotograma
function pintarEntera() {
  // solo la lluvia se anima y la cámara no se ha movido: el espejo y el resplandor (difuso) de la última imagen siguen valiendo, y se ahorran ~2 ms de GPU
  const reusar = estado.lluviaSola && lista.cadena === nitida && lista.cam.equals(camera.matrixWorld);
  nitida.bloom.reutilizar = reusar; for (const e of espejos) e.reutilizar = reusar;
  prepararEspejos(1); medida(0, componer, nitida); usar('entera');
  nitida.bloom.reutilizar = false; for (const e of espejos) e.reutilizar = false;
  lista.cadena = nitida; anotarCamara(lista); obra.cadena = null; estado.sucio = false; estado.lluviaSola = false;
}
// un trozo de la nítida en obras (la otra cadena nítida, para no tocar la que se está mostrando), todos con la cámara de
// cuando empezó (aunque el ratón siga). En 2 trozos (espejo y escena; contorno, resplandor y etalonaje) o, si la GPU va
// muy justa, en 4 parecidos (espejo y escena; contorno y medio resplandor; el otro medio; etalonaje).
const camGuardada = { pos: new THREE.Vector3(), q: new THREE.Quaternion() };
function conCamaraDeObra(fn) {
  camGuardada.pos.copy(camera.position); camGuardada.q.copy(camera.quaternion);
  camera.position.copy(obra.pos); camera.quaternion.copy(obra.q); camera.updateMatrixWorld();
  fn();
  camera.position.copy(camGuardada.pos); camera.quaternion.copy(camGuardada.q); camera.updateMatrixWorld();
}
const componer = c => c.composer.render();
// pasadas de la nítida en obras: [de, a) (0 escena, 1 contorno, 2 resplandor, 3 etalonaje)
function pasar(de, a = 4) { const cp = obra.cadena.composer, ps = cp.passes; for (let k = de; k < Math.min(a, ps.length); k++) ps[k].render(renderer, cp.writeBuffer, cp.readBuffer, 0, false); }
function espejoYEscena() { prepararEspejos(1); for (const m of espejos) m.onBeforeRender(renderer, scene, camera); pasar(0, 1); }   // el reflejo, y la escena lo reutiliza
function mitadResplandor(n) { const cp = obra.cadena.composer, b = cp.passes[2]; b.parte = n; b.render(renderer, cp.writeBuffer, cp.readBuffer); b.parte = 0; }
const ETAPAS = {
  2: [espejoYEscena, () => pasar(1)],
  4: [espejoYEscena, () => { pasar(1, 2); mitadResplandor(1); }, () => mitadResplandor(2), () => pasar(3)],   // trozos parecidos
};
function avanzarObra(trozos) {
  if (!obra.cadena) { obra.cadena = lista.cadena === nitida ? nitidaB : nitida; obra.etapa = 0; obra.trozos = trozos; anotarCamara(obra); estado.sucio = false; }
  const etapas = ETAPAS[obra.trozos], e = obra.etapa;
  medida(-1 - e - (obra.trozos === 2 ? 4 : 0), conCamaraDeObra, etapas[e]);
  if (++obra.etapa === etapas.length) {
    lista.cadena = obra.cadena; lista.inv.copy(obra.inv); lista.cam.copy(obra.cam); lista.pos.copy(obra.pos); lista.q.copy(obra.q); obra.cadena = null;
  }
  usar('trozo');
}
// en cuántos trozos pintar la nítida durante el balanceo: 1 (entera cada fotograma) si cabe; si no, 2; si no, 4
function trozosBalanceo() {
  const n = estimar(0), r = calidad['ms-9'] ?? 1.5, p = presupuesto(), antes = calidad.trozos ?? 1;
  const t = n < p * (antes > 1 ? 0.85 : 1) ? 1 : n / 2 + r < p * (antes > 2 ? 0.85 : 1) ? 2 : 4;     // volver a menos trozos, con margen
  return calidad.trozos = t;
}
const cerca = () => lista.cadena && lista.pos.distanceTo(camera.position) < 0.06 && lista.q.angleTo(camera.quaternion) < 0.03;
function pintar(dt = 1000 / 60) {
  camera.updateMatrixWorld();
  const cambio = !camUlt.equals(camera.matrixWorld); camUlt.copy(camera.matrixWorld);     // respecto al fotograma anterior
  const enVuelo = !!flight || !!puertaAnim;
  // contorno: fundido de entrada y salida; mientras se ve, late (si la nítida va justa, a 30 fps: es un brillo lento)
  const ca = contornoAnim, antes = ca.brillo;
  ca.brillo = ca.objetivo === 1 ? Math.min(1, ca.brillo + dt / 110) : Math.max(0, ca.brillo - dt / 160);   // (al máximo se queda quieto)
  if (ca.brillo === 0 && antes > 0) contorno([]);
  const fuerza = 4 * ca.brillo * ca.brillo * (3 - 2 * ca.brillo);
  for (const c of todas) c.outline.edgeStrength = fuerza;
  // el contorno late (un brillo lento): basta a 30 fps; si aparece o se va (fundido) o cambia de objeto, cada fotograma
  const late = contornoSucio || (nitida.outline.selectedObjects.length > 0 && (ca.brillo !== antes || (pintar.salto = !pintar.salto)));
  const t0 = performance.now();
  let movil = null, reproyectar = false, entera = false, soloContorno = false;
  for (const c of todas) c.bloom.reutilizar = false;
  for (const e of espejos) e.reutilizar = false;
  if (enVuelo && (cambio || estado.sucio)) {
    if (calidad.nivel === 0) entera = true; else movil = cadenas[calidad.nivel];
    // si el equipo va justo (ya volando por debajo de la nítida, o recortando), lo difuso o pequeño se rehace un fotograma
    // sí y otro no, alternando: el resplandor en uno, el espejo en otro. Con margen, todo en cada fotograma.
    const c = movil || nitida, seguido = c === pintar.ultimaVuelo && !estado.sucio && (calidad.nivel > 0 || calidad.margen < 1);
    pintar.par = !pintar.par; c.bloom.reutilizar = seguido && pintar.par; for (const e of espejos) e.reutilizar = seguido && !pintar.par;
    pintar.ultimaVuelo = c;
  } else if (cambio && !enVuelo && cerca() && !pintar.entera && (obra.cadena || trozosBalanceo() > 1)) {   // (pintar.entera: pruebas)
    avanzarObra(calidad.trozos); reproyectar = true;                        // balanceo: nítida a trozos + reproyección
  } else if (cambio || estado.sucio || (lista.cadena && !lista.cam.equals(camera.matrixWorld)) || !lista.cadena) entera = true;
  else if (late) soloContorno = true;                                       // cámara quieta y escena igual: solo contorno + resplandor + etalonaje
  if (entera) pintarEntera();
  if (soloContorno) { medida(-10, rehacerContorno); usar('contorno'); }
  if (entera || soloContorno) contornoSucio = false;
  if (movil) {
    prepararEspejos(movil.escala); medida(calidad.nivel, componer, movil); usar('ligera');
    ultimaMovil = movil; obra.cadena = null; estado.sucio = false;
  }
  if (reproyectar) {
    usar('reproy');
    vpActual.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    if (ultimaMovil) { mezcla = Math.min(1, mezcla + dt / 260); if (mezcla === 1) ultimaMovil = null; }   // recién llegado de un vuelo
    medida(-9, reproyectarLista);
  } else {
    const m0 = mezcla;
    if (movil) mezcla = Math.max(0, mezcla - dt / 120);
    else if (entera && enVuelo) { mezcla = 1; ultimaMovil = null; }          // nítida volando (equipo potente): nada que fundir
    else if (ultimaMovil) { mezcla = Math.min(1, mezcla + dt / 260); if (mezcla === 1) ultimaMovil = null; }
    if (movil || entera || soloContorno || mezcla !== m0) presentar((ultimaMovil || lista.cadena || nitida).textura, (lista.cadena || nitida).textura, mezcla * mezcla * (3 - 2 * mezcla), ultimaMovil?.enfoque ?? 0);   // la ampliada, enfocada (CAS)
  }
  if (movil || entera) calidad.cpu = calidad.cpu * 0.9 + (performance.now() - t0) * 0.1;
  if (cronometro) cronometro.recoger(anotarTiempo);
  return cambio;
}
function rehacerContorno() {                                   // sobre la escena ya pintada de la nítida que se ve (su color y profundidad siguen ahí)
  const cp = lista.cadena.composer, ps = cp.passes;
  for (let k = 1; k < ps.length; k++) ps[k].render(renderer, cp.writeBuffer, cp.readBuffer, 0, false);
}
function reproyectarLista() {
  reproyector(lista.cadena.textura, lista.cadena.profundidad, lista.inv, vpActual, ultimaMovil?.textura, mezcla * mezcla * (3 - 2 * mezcla));
}
// cronómetro de GPU (EXT_disjoint_timer_query_webgl2): cuánto tarda de verdad cada fotograma, sin esperar a la GPU
function crearCronometro(gl) {
  const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext || hash.get('bench') || hash.get('sincronometro')) return null;   // sincronometro: probar como en Firefox o Safari
  const pend = [];
  return {
    medir(etiqueta, fn, arg) { const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); fn(arg); gl.endQuery(ext.TIME_ELAPSED_EXT); pend.push([etiqueta, q]); },
    recoger(cb) {
      while (pend.length && gl.getQueryParameter(pend[0][1], gl.QUERY_RESULT_AVAILABLE)) {
        const [e, q] = pend.shift(), ms = gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6; gl.deleteQuery(q);
        if (!gl.getParameter(ext.GPU_DISJOINT_EXT)) cb(e, ms);
      }
    },
  };
}
const cronometro = crearCronometro(renderer.getContext());

// muelle críticamente amortiguado (SmoothDamp): la cámara sigue al ratón como la llevaría un operador, sin arranques secos
const velSuave = new THREE.Vector3(), dif = new THREE.Vector3(), paso = new THREE.Vector3();
function seguir(actual, objetivo, dt, t = 0.2) {
  const w = 2 / t, x = w * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  dif.subVectors(actual, objetivo);
  paso.copy(velSuave).addScaledVector(dif, w).multiplyScalar(dt);
  velSuave.addScaledVector(paso, -w).multiplyScalar(e);
  actual.copy(objetivo).addScaledVector(dif.add(paso), e);
  if (actual.distanceToSquared(objetivo) < 1e-9 && velSuave.lengthSq() < 1e-8) { actual.copy(objetivo); velSuave.set(0, 0, 0); }
}
const suave = new THREE.Vector3();
function ponerCamara(pos, look, fov, up) {
  camera.up.copy(up || UP);
  camera.position.copy(pos);
  if (camera.fov !== fov) { camera.fov = fov; camera.updateProjectionMatrix(); }
  camera.lookAt(look);
}
// orientación de una vista (para girar la cámara con slerp: velocidad de giro uniforme, sincronizada con el avance)
const auxCam = new THREE.PerspectiveCamera();
function orientacion(v) {
  if (!v.q) { auxCam.position.copy(v.pos); auxCam.up.copy(v.up || UP); auxCam.lookAt(v.look); v.q = auxCam.quaternion.clone(); v.dist = v.pos.distanceTo(v.look); }
  return v.q;
}
// pose a mitad de un vuelo (s = 0..1 ya suavizado): línea recta (o curva por `via`) con un arco de dron, giro esférico
function poseVuelo(from, to, s, via = null) {
  if (via) camera.position.copy(from.pos).multiplyScalar((1 - s) * (1 - s)).addScaledVector(via, 2 * (1 - s) * s).addScaledVector(to.pos, s * s);   // Bézier cuadrática
  else camera.position.lerpVectors(from.pos, to.pos, s);
  camera.position.y += Math.sin(Math.PI * s) * 0.10;
  camera.quaternion.slerpQuaternions(from.q || orientacion(from), orientacion(to), s);
  camera.fov = from.fov + (to.fov - from.fov) * s; camera.updateProjectionMatrix();
  const d = (from.dist ?? from.pos.distanceTo(from.look)) * (1 - s) + to.dist * s;
  currentLook.set(0, 0, -d).applyQuaternion(camera.quaternion).add(camera.position);
}
// control de calidad en movimiento: con el cronómetro de GPU se estima qué cadena cabe; además, si aun así se pierden
// fotogramas (CPU ocupada, GPU que baja de frecuencia por temperatura…), se recorta el presupuesto enseguida y se
// recupera poco a poco cuando todo va bien (como la resolución dinámica de los videojuegos)
const ritmo = { refresco: 1000 / 60 };
function vigilar(dt, enMovimiento) {
  if (dt > 4 && dt < 40) ritmo.refresco = Math.min(ritmo.refresco * 1.002, dt);       // intervalo de la pantalla (60, 120, 144 Hz…)
  if (nivelFijo != null) { calidad.nivel = Math.min(nivelFijo, cadenas.length - 1); return; }
  if (enMovimiento) {
    // solo si la GPU iba justa: si el fotograma se perdió por la CPU (otro programa, el recolector…), bajar resolución no ayuda
    const gpuJusta = !cronometro || calidad.gpuUlt == null || calidad.gpuUlt > ritmo.refresco * 0.4;
    if (dt > ritmo.refresco * 1.5 && gpuJusta) calidad.margen = Math.max(0.15, calidad.margen * 0.8);
    else calidad.margen = Math.min(1, calidad.margen * 1.004);
  } else calidad.margen = Math.min(1, calidad.margen * 1.001);          // en reposo también se recupera, despacio
  elegirNivel();
}
// diagnóstico (tecla F o #fps=1): qué GPU usa el navegador, a cuántos fotogramas va y qué nivel de calidad ha elegido. Sirve para ver en cada equipo por qué va como va
const diag = (() => {
  const el = document.getElementById('diag'), gl = renderer.getContext(), dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'desconocida', software = /swiftshader|basic render|llvmpipe|software|softpipe/i.test(gpu);
  const e = { fotogramas: 0, desde: 0, dts: [] };
  const mostrar = v => { el.hidden = !v; };
  addEventListener('keydown', ev => { if (ev.key === 'f' || ev.key === 'F') { if (!/^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) mostrar(el.hidden); } });
  if (hash.get('fps')) mostrar(true);
  e.paso = (now, dt) => {
    if (el.hidden) return;
    e.dts.push(dt); if (e.dts.length > 120) e.dts.shift();
    if (now - e.desde < 500) return; e.desde = now;
    const s = [...e.dts].sort((a, b) => a - b), media = e.dts.reduce((a, b) => a + b, 0) / e.dts.length, p95 = s[Math.floor(s.length * 0.95)];
    const b = renderer.getDrawingBufferSize(new THREE.Vector2());
    el.classList.toggle('mal', software || media > 24);
    el.textContent = [`GPU: ${gpu}${software ? '  ← SIN ACELERACIÓN (va por software)' : ''}`,
      `pantalla ${innerWidth}×${innerHeight} · píxeles ${b.x}×${b.y} (×${renderer.getPixelRatio()})`,
      `${(1000 / media).toFixed(0)} fps · fotograma ${media.toFixed(1)} ms (p95 ${p95.toFixed(1)})`,
      `GPU ${calidad.gpuUlt != null ? calidad.gpuUlt.toFixed(1) + ' ms' : '–'} · CPU ${calidad.cpu.toFixed(1)} ms · calidad nivel ${calidad.nivel} · margen ${calidad.margen.toFixed(2)}`,
      `lluvia ${Clima.clima.lluvia.toFixed(1)} mm/h (${Clima.clima.origen.lluvia}) · viento ${Math.round(Clima.clima.viento)} km/h`].join('\n');
  };
  return e;
})();
let prevNow = null, seMovio = false;
function frame(now) {
  requestAnimationFrame(frame);
  const dt = prevNow == null ? 1000 / 60 : Math.min(100, now - prevNow); prevNow = now;
  const girando = esMovil && pasoGiro(dt);
  diag.paso(now, dt);
  vigilar(dt, seMovio || !!flight || girando);
  if (gritoAnim) animarGrito(now);
  if (persiana.estores.some(e => e.anim)) animarPersiana(now);
  animarLamparas(dt);
  if (movPendiente) {
    const ev = movPendiente; movPendiente = null;
    if (!flight && (state === 'home' || state === 'pizarra')) { const h = hitTest(ev), huevo = HUEVOS.has(h?.key); setHover(huevo ? null : h, ev); if (huevo) renderer.domElement.style.cursor = 'pointer'; }   // los easter eggs (sin panel) no se iluminan ni llevan cartel, pero el cursor sí pasa a la manita
    else if (!flight && state === 'intro' && intro && !puertaAnim) hoverPuerta(ev);
  }
  if (flight) {
    flight.t0 ??= now;
    const x = THREE.MathUtils.clamp((now - flight.t0) / flight.dur, 0, 1);
    poseVuelo(flight.from, flight.to, ease(x), flight.via); suave.copy(camera.position); velSuave.set(0, 0, 0);
    // al entrar, la puerta se cierra en cuanto la cámara sale del barrido de la hoja (antes se cruzaban)
    if (cerrarAlPasar && camera.position.z < intro.bisagra.y && Math.hypot(camera.position.x - intro.bisagra.x, camera.position.z - intro.bisagra.y) > intro.radioPuerta + 0.12) {
      cerrarAlPasar = false; puertaAnim = { t0: null, dur: 1800, de: 1, a: 0 };
    }
    if (x >= 1) { const d = flight.done; flight = null; d && d(); }
  } else {
    // la cámara sigue al ratón con un muelle: sin saltos al acabar un vuelo ni tirones si el ratón va a trompicones
    const enIntro = state === 'intro' || state === 'entrando', v = enIntro ? (zoomPegatina && state === 'intro' ? intro.vistaPegatina : intro.vista) : VIEWS[state] || VIEWS.home;   // entrando: aún en el pasillo
    // el cuarto "respira" con el ratón; con un panel abierto, quieto (el panel de Proyectos va encajado en el monitor)
    const amp = enIntro ? (zoomPegatina ? 0.05 : 1) : state === 'home' ? 1 : state === 'pizarra' ? 0.25 : 0;
    tmp.set(mouseN.x * (enIntro ? 0.05 : 0.06) * amp, -mouseN.y * (enIntro ? 0.03 : 0.04) * amp, 0).add(v.pos);
    seguir(suave, tmp, dt / 1000);
    const mira = esMovil && giro.activo && !enIntro ? mirada(v.pos, v.look, suave, miradaV) : v.look;
    ponerCamara(suave, mira, v.fov, v.up); currentLook.copy(v.look);
  }
  if (mesa.anim) {                                          // mesa regulable: sube o baja girando la manivela
    const a = mesa.anim; a.t0 ??= now;
    const t = THREE.MathUtils.clamp((now - a.t0) / a.dur, 0, 1), C = THREE.MathUtils.clamp;
    // el brazo baja un cuarto de vuelta (8 %), la manivela sale deslizando (10 %), da las vueltas con la mesa (64 %) y se mete y se pliega al revés
    ponerManivela(Math.min(C((t - 0.08) / 0.10, 0, 1), 1 - C((t - 0.82) / 0.10, 0, 1)), Math.min(C(t / 0.08, 0, 1), 1 - C((t - 0.92) / 0.08, 0, 1)));
    ponerMesa(a.de + (a.a - a.de) * ease(C((t - 0.18) / 0.64, 0, 1)));
    if (t >= 1) mesa.anim = null;
  }
  if (puertaAnim && intro) {
    puertaAnim.t0 ??= now;
    const t = THREE.MathUtils.clamp((now - puertaAnim.t0) / puertaAnim.dur, 0, 1), e = ease(t);
    intro.abrir(puertaAnim.de + (puertaAnim.a - puertaAnim.de) * e); estado.sucio = true;
    if (t >= 1) puertaAnim = null;
  }
  for (const k in lineasPizarra) {                          // resaltador de la pizarra: fundido de 0,12 s
    const L = lineasPizarra[k], v = L.obj ? Math.min(1, L.op + dt / 120) : Math.max(0, L.op - dt / 160);
    if (v !== L.op) { L.op = v; L.mat.opacity = v; L.m.visible = v > 0; estado.sucio = true; }
  }
  if (objects.armario) {                                    // dentro de su volumen, oculto al momento; al salir, aparece en 0,2 s
    const u = objects.armario.material.userData.aparicion, fuera = camera.position.z < 3.03 || camera.position.z > 3.62;
    const v = fuera ? Math.min(1, u.value + dt / 200) : 0;
    if (v !== u.value) { u.value = v; estado.sucio = true; }
    objects.armario.visible = v > 0;
  }
  if (objects.horas && (horaManual !== frame.horaPuesta || climaManual !== frame.climaPuesto || estado.solSucio || !frame.ultimaHora || now - frame.ultimaHora > 5000)) {   // la elegida a mano, solo si cambia
    frame.ultimaHora = now; frame.horaPuesta = horaManual; frame.climaPuesto = climaManual;
    const ms = horaManual != null ? Sol.fechaValencia(horaManual) : Date.now(), sol = Sol.posicionSol(ms), elg = sol.el * 180 / Math.PI;
    const tiempo = Clima.ponerClima(ms, climaManual);
    if (!relojPanel.hidden) infoClima();
    const r = Horas.actualizar(horaManual ?? undefined, Sol.pesosSol(elg)), li = Clima.intensidadLluvia(tiempo.lluvia);
    // el sol directo (si hay horneados sin sol): entra por la ventana solo con el sol a más de 0,5° y dentro de ±90° del sudoeste, y las nubes y la lluvia lo apagan
    const dirSol = new THREE.Vector3(...(hash.get('sundir') ? hash.get('sundir').split(',').map(Number) : Sol.direccionSol(sol.az, sol.el))).normalize(), solI = Sol.intensidadSol(elg) * Math.pow(1 - tiempo.nubes, 1.7) * (1 - 0.8 * li), entra = dirSol.z < -0.02 && solI > 0.004;
    let cambioCielo = false;
    frame.ambiente = 1;
    if (objects.solDirecto) {
      const sd = objects.solDirecto, rehacer = entra && (sd.necesita(dirSol) || estado.solSucio);
      if (rehacer) sd.actualizar(dirSol);
      estado.solSucio = false;
      const amb = 1 - 0.30 * tiempo.nubes - 0.14 * li, sat = 1 - 0.35 * tiempo.nubes - 0.1 * li;
      cambioCielo = Horas.fijarCielo({ sol: entra ? Sol.colorSol(elg).map(v => v * solI) : [0, 0, 0], amb: amb * +(hash.get('samb') ?? 1), sat, reb: 0.35, k: +(hash.get('sk') ?? 1.4) }, sd.rt.texture);
      if (rehacer && !cambioCielo) cambioCielo = Horas.forzar();
      frame.ambiente = amb + 0.3 * (entra ? solI : 0);
    }
    frame.solI = entra ? solI : 0; frame.dirSol = dirSol;
    const colorSol = Sol.colorSol(elg), visSol = Sol.intensidadSol(elg) * Math.pow(1 - tiempo.nubes, 1.2) * (1 - 0.9 * li);
    objects.lluvia?.ponerSol(dirSol.toArray(), colorSol, visSol);
    if (persiana.malla) persiana.malla.material.color.setRGB(1 + 0.7 * colorSol[0] * frame.solI, 1 + 0.7 * colorSol[1] * frame.solI, 1 + 0.7 * colorSol[2] * frame.solI);   // las telas, con el sol encima, brillan
    if (r.cambio || cambioCielo || !frame.reloj) {
      estado.sucio = true;
      if (objects.balon) { const f = Math.min(1, 0.35 + 0.65 * (r.d + 0.9 * r.a + 0.3 * r.n)) * frame.ambiente; objects.balon.hemi.intensity = 1.55 * f; objects.balon.sol.intensity = 1.25 * f * (1 - 0.7 * r.n); objects.balon.sombra.material.opacity = 0.5 + 0.4 * f; }
      if (objects.matFotos) { const f = Math.min(1, 1.0 * r.d + 0.9 * r.a + 0.36 * r.n) * frame.ambiente; for (const m of objects.matFotos) m.color.setScalar(f); }
      if (objects.marcoEspejo) { const f = (1.0 * r.d + 0.9 * r.a + 0.36 * r.n) * frame.ambiente, c = new THREE.Color(MARCO_ESPEJO); for (const m of objects.marcoEspejo) m.color.copy(c).multiplyScalar(f * m.userData.k); }
      const q = frame.ambiente;
      if (objects.tomo) { const b = objects.tomo.material.userData.base; objects.tomo.material.color.setRGB(q * b.r * (0.95 * r.d + 0.85 * r.a + 0.32 * r.n), q * b.g * (0.93 * r.d + 0.72 * r.a + 0.30 * r.n), q * b.b * (0.90 * r.d + 0.68 * r.a + 0.42 * r.n)); }
      for (const m of [objects.alfombrilla, objects.portada, objects.paginas]) if (m) m.material.color.setRGB(q * (0.95 * r.d + 0.85 * r.a + 0.32 * r.n), q * (0.93 * r.d + 0.72 * r.a + 0.30 * r.n), q * (0.90 * r.d + 0.68 * r.a + 0.42 * r.n));
      if (objects.libro3d) { const m = objects.libro3d.mats; m.tapa.color.copy(objects.tomo.material.color); m.canto.color.copy(objects.paginas.material.color); m.portada.color.copy(objects.portada.material.color); }   // el libro abierto, con la misma luz
    }
    const hh = Math.floor(r.h) % 24, mm = Math.round((r.h % 1) * 60) % 60, resumen = Clima.resumen();
    const txt = `${r.n > 0.5 ? '☾' : r.a > 0.5 ? '◐' : '☀'} ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}${horaManual != null ? ' *' : ''}${resumen.icono || resumen.temp ? ' · ' + resumen.icono + resumen.temp : ''}`;
    if (frame.reloj !== txt) relojBtn.textContent = frame.reloj = txt;
  }
  if (objects.lluvia && objects.lluvia.actualizar(Clima.clima, Clima.intensidadLluvia(Clima.clima.lluvia), now)) { const limpio = !estado.sucio; estado.sucio = true; estado.lluviaSola = limpio; }
  if (hash.get('debug')) hint.style.opacity = 1, hint.textContent = `${state} ${flight ? 'volando' : ''} cam ${camera.position.toArray().map(v => v.toFixed(2))} fov:${camera.fov.toFixed(0)} nivel ${calidad.nivel} gpu≈${calidad.equiv?.toFixed(1)} cpu ${calidad.cpu.toFixed(1)}`;
  if (objects.clawd && objects.clawd.actualizar(now)) estado.sucio = true;
  if (objects.libro3d) { if (objects.libro3d.actualizar(now)) estado.sucio = true; if (state === 'educacion' && libroPanel) libroPanel.colocar(objects.libro3d.hojas(camera)); }
  seMovio = pintar(dt);
}

addEventListener('error', e => { hint.style.opacity = 1; hint.textContent = 'ERROR: ' + e.message; });
let intro = null, puertaAnim = null, cerrarAlPasar = false;
// ---------------------------------------------------------------- reloj (hora real de Valencia o elegida a mano)
let horaManual = hash.get('hora') != null ? +hash.get('hora') : null, climaManual = null;   // climaManual: null = el real; si no, uno de Clima.PRESETS
const relojBtn = document.getElementById('relojBtn'), relojPanel = document.getElementById('relojPanel'), relojSlider = document.getElementById('relojSlider');
relojBtn.addEventListener('click', () => { relojPanel.hidden = !relojPanel.hidden; relojSlider.value = horaManual ?? Horas.horaValencia(); sincronizarAjuste(); infoClima(); });
relojSlider.addEventListener('input', () => { horaManual = +relojSlider.value; });
document.getElementById('relojReal').addEventListener('click', () => { horaManual = null; climaManual = null; frame.ultimaHora = 0; relojPanel.hidden = true; marcarClima(); });
const marcarClima = () => document.querySelectorAll('#climaSel button').forEach(b => b.classList.toggle('on', (b.dataset.clima || null) === climaManual));
// ajuste fino: los deslizadores muestran el tiempo de ahora (el real o un preset) y al tocarlos pasa a ser uno a medida
const ajustes = [...document.querySelectorAll('#climaAjuste input')], bTormenta = document.getElementById('ajTormenta');
const lineal = k => k === 'viento' || k === 'dir';
const aValor = (k, v) => k === 'lluvia' ? 20 * (v / 100) ** 2 : lineal(k) ? v : v / 100, deValor = (k, x) => k === 'lluvia' ? 100 * Math.sqrt(x / 20) : lineal(k) ? x : x * 100;
function sincronizarAjuste() {
  const c = Clima.clima;
  for (const i of ajustes) i.value = Math.round(deValor(i.dataset.aj, c[i.dataset.aj] ?? 0));
  bTormenta.classList.toggle('on', !!c.tormenta);
}
// de dónde sale lo que se ve por la ventana y cuándo se renueva
const PUNTOS = LANG === 'en' ? ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] : ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'], climaInfo = document.getElementById('climaInfo');
function infoClima() {
  const c = Clima.clima, en = LANG === 'en', f = Clima.fuentes(), min = t => Math.max(0, Math.round((Date.now() - t) / 60000));
  const ori = s => en ? { modelo: 'forecast model', simulado: 'simulated', estaciones: 'stations', radar: 'radar', 'radar+estaciones': 'radar + stations' }[s] ?? s : s.replace('+', ' + ');
  const viento = `${en ? 'Wind' : 'Viento'}: ${PUNTOS[Math.round(((c.dir ?? 0) % 360) / 45) % 8]} ${Math.round(c.viento)} km/h (${ori(c.origen.viento)})`;
  if (c.fuente === 'simulado') { climaInfo.textContent = (en ? 'Simulated weather. ' : 'Tiempo simulado. ') + viento; return; }
  const l = [`${en ? 'Rain' : 'Lluvia'}: ${c.lluvia < 0.05 ? (en ? 'none' : 'no llueve') : c.lluvia.toFixed(1) + ' mm/h'} (${ori(c.origen.lluvia)})`, viento];
  if (f.rad) l.push(`${en ? 'Radar' : 'Radar'}: ${f.rad.mm.toFixed(1)} mm/h, ${en ? 'image from' : 'imagen de hace'} ${min(f.rad.hora)} min`);
  if (f.est) { const m = f.est.estaciones?.[0]; l.push(`${en ? 'Stations' : 'Estaciones'}: ${f.est.estaciones?.length ?? 0}${m ? `, ${en ? 'nearest' : 'la más cercana'} ${m.km} km (${m.nombre.replace(/ \(.*/, '')})` : ''}`); }
  l.push(en ? 'Updates every 5 min (radar, stations) and 15 min (forecast)' : 'Se renueva cada 5 min (radar, estaciones) y 15 min (previsión)');
  climaInfo.textContent = l.join('\n');
}
function aMedida() { if (climaManual !== 'a-medida') { Object.assign(Clima.personalizado, Clima.clima); climaManual = 'a-medida'; marcarClima(); } }
for (const i of ajustes) i.addEventListener('input', () => { aMedida(); Clima.personalizado[i.dataset.aj] = aValor(i.dataset.aj, +i.value); frame.ultimaHora = 0; });
bTormenta.addEventListener('click', () => { aMedida(); Clima.personalizado.tormenta = !Clima.personalizado.tormenta; bTormenta.classList.toggle('on', Clima.personalizado.tormenta); frame.ultimaHora = 0; });
document.getElementById('climaSel').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; climaManual = b.dataset.clima || null; frame.ultimaHora = 0; marcarClima(); setTimeout(() => { sincronizarAjuste(); infoClima(); }, 50); });
marcarClima();
function entrar() {
  if (state !== 'intro' || flight) return;
  zoomPegatina = false; hoverPuerta.clave = ''; contornoAnim.objetivo = 0; contornoSucio = true;
  state = 'entrando'; hint.style.opacity = 0; renderer.domElement.style.cursor = 'default';
  puertaAnim = { t0: null, dur: 1500, de: 0, a: 1 };
  setTimeout(() => flyTo(intro.vistaDentro, () => {
    cerrarAlPasar = true;                                       // se cierra al pasar (en cuanto la cámara deja libre la hoja)
    flyTo(VIEWS.home, () => {
      if (cerrarAlPasar) { cerrarAlPasar = false; puertaAnim = { t0: null, dur: 1800, de: 1, a: 0 }; }
      intro.ocultarPasillo(); estado.sucio = true; state = 'home'; hint.textContent = T.hintCuarto; hint.style.opacity = 1;
    }, 2.0, intro.paso);
  }, 1.6), 450);
}
// texturas del espejo: se miden todas las vistas, los vuelos posibles y el balanceo con el ratón, y se reservan de antemano
function reservarEspejo() {
  if (!espejos.length) return;
  const H = VIEWS.home, P = VIEWS.pizarra, secciones = [VIEWS.proyectos, VIEWS.educacion, VIEWS.experiencia];
  const vuelos = [[H, P], [P, H], ...secciones.flatMap(v => [[H, v], [v, H], [P, v]])];
  if (intro) vuelos.push([intro.vista, intro.vistaDentro], [intro.vistaDentro, H, intro.paso]);
  const tamanos = espejos.map(() => []);
  const medir = (peso = 1) => espejos.forEach((e, i) => tamanos[i].push([...e.medir(camera), peso]));
  for (const [a, b, via] of vuelos) for (let k = 0; k <= 60; k++) { poseVuelo(a, b, k / 60, via); medir(); }
  for (const v of [H, P, ...secciones, ...(intro ? [intro.vista, intro.vistaPegatina] : [])])
    for (const [mx, my] of [[-.5, -.5], [.5, -.5], [-.5, .5], [.5, .5], [0, 0]]) {
      camera.position.copy(v.pos).add({ x: mx * 0.06, y: -my * 0.04, z: 0 }); camera.fov = v.fov; camera.updateProjectionMatrix(); camera.lookAt(v.look); medir(30);   // en reposo: pesa más
    }
  espejos.forEach((e, i) => e.reservar(renderer, tamanos[i]));
}
// compila los sombreadores y sube las texturas a la GPU con la pantalla de carga aún puesta: así no hay tirones
// la primera vez que se ve algo (el cuarto al entrar, el espejo, el contorno al pasar el ratón, las cadenas de movimiento)
async function calentar() {
  scene.traverse(o => { if (o.material?.map) renderer.initTexture(o.material.map); });
  if (objects.horas) { for (const t of objects.horas) renderer.initTexture(t); Horas.calentar(); }
  await Promise.all([renderer.compileAsync(scene, camera), document.fonts.load('22px VT323'), document.fonts.load('600 22px "Pixelify Sans"'), document.fonts.load('22px "Pixelify Sans"')]).catch(() => {});
  reservarEspejo();
  // todo a la vista a la vez (sin recortar por la cámara): en Windows cada sombreador se traduce a Direct3D para cada tipo de
  // búfer en el que se dibuja (escena, espejo, contorno…), y si no se hace aquí, se hace a mitad de un vuelo (tirón)
  const recortados = []; scene.traverse(o => { if (o.frustumCulled) { o.frustumCulled = false; recortados.push(o); } });
  contorno([...objects.monitor, ...objects.libro, ...objects.ventana, objects.pizarra, objects.boardFace].filter(o => o && !o.name?.startsWith('paisaje')));
  for (const c of todas) for (const v of [VIEWS.home, VIEWS.pizarra, VIEWS.espejoTercera, VIEWS.sobremi].filter(Boolean)) {
    setCam(v); for (const e of espejos) { e.nuevoFotograma(); e.escala = c.escala; } c.composer.render(); presentar(c.textura, nitida.textura, 0.5);
  }
  camera.updateMatrixWorld(); reproyector(nitida.textura, nitida.profundidad, camera.projectionMatrixInverse, camera.projectionMatrix);   // compilar la reproyección
  for (const o of recortados) o.frustumCulled = true;
  contorno([]);
  // las letras de los paneles, ya maquetadas una vez (fuera de la vista): abrir un panel no tiene que darles forma por primera vez
  const muestra = document.createElement('div');
  muestra.style.cssText = 'position:fixed;left:-99999px;top:0;width:900px;contain:strict;height:10px';
  muestra.innerHTML = [PROJECTS, EDUCATION, EXPERIENCE].map(l => JSON.stringify(l)).map(t => `<div class="card"><h2>${t}</h2><h3>${t}</h3><p>${t}</p><span class="tag">${t}</span></div>
    <div class="desktop"><div class="win"><div class="bar">${t}</div><div class="body">${t}</div></div></div>`).join('');
  document.body.appendChild(muestra); void muestra.offsetHeight; muestra.remove();
  // primera estimación de lo que tarda la nítida (luego la va afinando el cronómetro de GPU con los fotogramas reales)
  const gl = renderer.getContext(), px = new Uint8Array(4), t = [];
  setCam(VIEWS.home);
  for (let i = 0; i < 9; i++) {
    const t0 = performance.now(); for (const e of espejos) { e.nuevoFotograma(); e.escala = 1; }
    nitida.composer.render(); presentar(nitida.textura, nitida.textura, 1); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); if (i > 1) t.push(performance.now() - t0);
  }
  t.sort((a, b) => a - b); calidad.equiv = t[t.length >> 1] * 0.8;    // la espera síncrona exagera un poco
  elegirNivel();
  console.info(`fotograma nítido ≈ ${calidad.equiv.toFixed(1)} ms -> en movimiento, nivel ${calidad.nivel}`);
  estado.sucio = true;
}
loadRoom().then(async () => {
  if (objects.puerta) intro = crearIntro(scene, objects.puerta);
  // el cuarto no se mueve: three.js no tiene que recalcular las matrices de todo en cada pasada (la puerta se actualiza sola)
  scene.updateMatrixWorld(true); scene.matrixWorldAutoUpdate = false;
  await calentar();
  if (!objects.horas) document.getElementById('reloj').hidden = true;   // sin horneados de día/noche no hay nada que cambiar
  setCam(VIEWS.home);
  if (intro && !hash.get('go') && !hash.get('nointro')) {
    state = 'intro'; setCam(intro.vista); currentLook.copy(intro.vista.look);
    hint.textContent = T.hintPuerta; hint.style.opacity = 1;
    if (hash.get('autoentrar')) setTimeout(entrar, 400);
  } else if (intro) intro.ocultarPasillo();
  suave.copy(camera.position); velSuave.set(0, 0, 0);                  // el muelle de la cámara empieza donde está (no en el origen)
  // la pantalla de carga se va cuando ya se ha pintado el primer fotograma de verdad (no los de preparación)
  const ld = document.getElementById('loading'); requestAnimationFrame(() => requestAnimationFrame(() => { ld.style.opacity = 0; setTimeout(() => ld.remove(), 700); }));
  if (hash.get('go')) setTimeout(() => hash.get('go') === 'pizarra' ? goBoard() : openSection(hash.get('go')), 300);
  if (hash.get('vista')) { const [px, py, pz, lx, ly, lz, f] = hash.get('vista').split(',').map(Number); VIEWS.prueba = V([px, py, pz], [lx, ly, lz], f || 50); state = 'prueba'; }   // solo para revisar
  if (hash.get('bench')) {   // banco de pruebas de rendimiento (web/bench.js, herramientas/bench_web.py)
    if (intro) intro.ocultarPasillo();
    if (objects.horas) Horas.actualizar(horaManual ?? undefined);
    calidad.nivel = nivelFijo ?? 0;                                       // las medidas, con la nítida salvo que se pida
    if (calidad.nivel) flight = { banco: true };                          // pintar() usa las de movimiento solo moviéndose
    const gl = renderer.getContext(), app = window.__app = { camera, gl, render: () => { estado.sucio = true; pintar.entera = true; pintar(); pintar.entera = false; }, passes: { bloom: cadenas[calidad.nivel].bloom, outline: cadenas[calidad.nivel].outline, espejos, composer: cadenas[calidad.nivel].composer, renderer, scene }, hitTest, setHover: k => setHover(k && { key: k }),
      pose: (k, i) => { if (k.includes('>')) { const [x, y, f] = k.split(/[>@]/); poseVuelo(VIEWS[x], VIEWS[y], ease(+f));   // a mitad de un vuelo: 'pizarra>home@0.5'
          if (objects.armario) objects.armario.visible = camera.position.z < 3.03 || camera.position.z > 3.62; return; }
        const v = VIEWS[k === 'espejo' ? 'espejoTercera' : k]; camera.position.copy(v.pos).add(new THREE.Vector3(Math.sin(i * 0.3) * 0.03, Math.cos(i * 0.2) * 0.02, 0)); camera.fov = v.fov; camera.updateProjectionMatrix(); camera.lookAt(v.look); if (objects.armario) objects.armario.visible = camera.position.z < 3.03 || camera.position.z > 3.62; },
      armario: (k, v) => { app.pose(k, 0); objects.armario.visible = v; estado.sucio = true; pintar.entera = true; pintar(); pintar.entera = false; return [camera.position.z, renderer.domElement.toDataURL('image/png')]; },
      shot: k => { app.pose(k, 0); app.render(); return renderer.domElement.toDataURL('image/png'); },
      // la nítida a trozos (empezada en la pose d=0.5, con la cámara moviéndose) y reproyectada a d=1 -> [mostrada, pintada de verdad]
      obra: (dx, dy) => { const v = VIEWS.home, en = d => { camera.position.copy(v.pos).add({ x: d * dx, y: d * dy, z: 0 }); camera.lookAt(v.look); camera.updateMatrixWorld(); };
        en(0); app.render(); en(0.5); avanzarObra(4); for (const d of [0.6, 0.7, 0.8]) { en(d); avanzarObra(4); }
        en(1); reproyector(lista.cadena.textura, lista.cadena.profundidad, lista.inv, new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        const a = renderer.domElement.toDataURL('image/png'); app.render(); return [a, renderer.domElement.toDataURL('image/png'), lista.cadena === nitida]; },
      // reproyección en vuelo: imagen de la pose s0 llevada a s1 (vuelo 'a>b') -> [reproyectada, verdad]
      warpVuelo: (k, s0, s1) => { const [x, y] = k.split('>'), pon = s => { poseVuelo(VIEWS[x], VIEWS[y], ease(s)); camera.updateMatrixWorld(); };
        pon(s0); app.render(); const inv = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();
        pon(s1); reproyector(nitida.textura, nitida.profundidad, inv, new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        const a = renderer.domElement.toDataURL('image/png'); app.render(); return [a, renderer.domElement.toDataURL('image/png')]; },
      depurarObra: (dx, dy) => { const v = VIEWS.home, en = d => { camera.position.copy(v.pos).add({ x: d * dx, y: d * dy, z: 0 }); camera.lookAt(v.look); camera.updateMatrixWorld(); };
        const foto = () => renderer.domElement.toDataURL('image/png'), r = {};
        en(0.5); app.render(); r.verdad05 = foto(); en(1); app.render(); r.verdad1 = foto();
        en(0); app.render(); en(0.5); avanzarObra(4); for (const d of [0.6, 0.7, 0.8]) { en(d); avanzarObra(4); }
        r.obraB = lista.cadena === nitidaB; r.etapa = obra.etapa; presentar(lista.cadena.textura, lista.cadena.textura, 1); r.obraCruda = foto(); return r; },
      // reproyección: la imagen de home se recoloca para la cámara desplazada (dx, dy) -> [reproyectada, pintada de verdad]
      warp: (dx, dy) => { const v = VIEWS.home, en = d => { camera.position.copy(v.pos).add({ x: d * dx, y: d * dy, z: 0 }); camera.lookAt(v.look); camera.updateMatrixWorld(); };
        en(0); app.render(); const inv = new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse).invert();
        en(1); reproyector(nitida.textura, nitida.profundidad, inv, new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
        const a = renderer.domElement.toDataURL('image/png'); app.render(); return [a, renderer.domElement.toDataURL('image/png')]; },
      info: () => { renderer.info.autoReset = false; renderer.info.reset(); app.render(); const r = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; renderer.info.autoReset = true; return r; } };
    document.body.dataset.listo = 1; return;
  }
  requestAnimationFrame(frame);
}).catch(e => { document.getElementById('loading').textContent = 'No se pudo cargar el cuarto: ' + e.message; console.error(e); });
function setCam(v) { camera.position.copy(v.pos); camera.fov = v.fov; camera.updateProjectionMatrix(); camera.lookAt(v.look); }
