// El escenario de three.js que comparten todos los módulos: lienzo, escena y cámara; los objetos del cuarto con los que se interactúa y las banderas de repintado.
import * as THREE from 'three';
import { zoomPara } from './movil.js';

export const hash = new URLSearchParams(location.hash.slice(1));
// estado.sucio: la escena cambió y hay que repintarla; estado.solSucio: un estor o la mesa se movieron y las sombras del sol hay que rehacerlas
// lluviaSola: lo único que cambió es la lluvia (cámara quieta): el reflejo del espejo y el resplandor se reutilizan
export const estado = { _s: true, solSucio: false, lluviaSola: false, get sucio() { return this._s; }, set sucio(v) { this._s = v; if (v) this.lluviaSola = false; } };   // cualquier otro cambio anula lluviaSola
export const objects = { monitor: [], monitor2: [], pantalla2: null, clawd: null, libro: [], ventana: [], espejo: [], cristales: [], pizarra: null, armario: null };
export const espejos = [];

// sin MSAA ni profundidad en el lienzo: la escena se pinta en los búferes del compositor y al lienzo solo llega la pasada final
export const renderer = new THREE.WebGLRenderer({ antialias: false, depth: false, stencil: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.getElementById('stage').appendChild(renderer.domElement);
// si el sistema pierde el contexto gráfico (suspensión, reinicio del driver), la escena quedaría negra: al recuperarlo, se recarga
renderer.domElement.addEventListener('webglcontextlost', e => e.preventDefault());
renderer.domElement.addEventListener('webglcontextrestored', () => location.reload());
export const scene = new THREE.Scene();
scene.background = new THREE.Color('#1c1322');
export const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.02, 200);
camera.zoom = zoomPara(camera.aspect); camera.updateProjectionMatrix();     // en vertical (móvil) se abre la vista para que quepa más cuarto

