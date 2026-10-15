// Intro: pasillo frente a la puerta de Javier (cerrada, con la pegatina "PARKING PRIVADO").
// Clic (o tecla) -> la puerta se abre hacia dentro y la cámara entra hasta la vista principal.
import * as THREE from 'three';
import { LANG } from './i18n.js';

const DOOR = { hingeX: 0.10, x1: 0.83, z: 3.66, h: 2.02, wall: 3.78 };

function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// madera de sapelli rojiza, con vetas verticales (cara exterior de la puerta)
const texMadera = () => canvasTex(512, 1024, (g, w, h) => {
  const grd = g.createLinearGradient(0, 0, w, 0);
  grd.addColorStop(0, '#7a3a1f'); grd.addColorStop(.5, '#934a26'); grd.addColorStop(1, '#7c3c20');
  g.fillStyle = grd; g.fillRect(0, 0, w, h);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 160; i++) {
    const x = r() * w, a = 0.04 + r() * 0.08; g.strokeStyle = r() < .5 ? `rgba(60,22,10,${a})` : `rgba(190,110,70,${a})`;
    g.lineWidth = 1 + r() * 5; g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 64) g.lineTo(x + Math.sin(y / 180 + i) * 6 * r(), y);
    g.stroke();
  }
});

// pegatina: borde azul, pictograma de la cama, "PARKING PRIVADO"
const texPegatina = () => canvasTex(250, 350, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.beginPath(); g.roundRect(0, 0, w, h, 18); g.fill();
  g.fillStyle = '#1f5bd6'; g.beginPath(); g.roundRect(10, 10, w - 20, h - 20, 12); g.fill();
  g.fillStyle = '#ffffff'; g.fillRect(26, 26, w - 52, 196);
  g.fillStyle = '#1f5bd6';                                  // cama: cabecero, colchón, almohada, patas
  g.fillRect(50, 90, 10, 90); g.fillRect(50, 140, 150, 26); g.fillRect(190, 130, 10, 50);
  g.beginPath(); g.ellipse(84, 128, 16, 12, 0, 0, 7); g.fill(); g.fillRect(104, 118, 86, 22);
  g.fillStyle = '#ffffff'; g.font = 'bold 34px Arial, sans-serif'; g.textAlign = 'center';
  const [l1, l2] = LANG === 'en' ? ['PRIVATE', 'PARKING'] : ['PARKING', 'PRIVADO'];   // en inglés: "PRIVATE PARKING"
  g.fillText(l1, w / 2, 270); g.fillText(l2, w / 2, 306);
});

export function crearIntro(scene, doorMesh) {
  // --- bisagra: la puerta gira sobre su canto izquierdo (visto desde el pasillo), hacia dentro
  const pivot = new THREE.Group(); pivot.position.set(DOOR.hingeX, 0, DOOR.z); scene.add(pivot);
  pivot.attach(doorMesh);
  const ancho = DOOR.x1 - DOOR.hingeX;
  const exterior = new THREE.Mesh(new THREE.PlaneGeometry(ancho, DOOR.h), new THREE.MeshBasicMaterial({ map: texMadera(), color: '#d9c2b4' }));
  exterior.position.set(ancho / 2 - 0.035, DOOR.h / 2, 0.052); exterior.scale.x = (ancho + 0.07) / ancho;   // tapa también la rendija pivot.add(exterior);
  const peg = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.07), new THREE.MeshBasicMaterial({ map: texPegatina(), color: '#e8e2dc', transparent: true, alphaTest: 0.5 }));
  peg.position.set(ancho / 2, 1.52, 0.054); pivot.add(peg);   // centrada en la hoja de la puerta (eje vertical)
  const pomoMat = new THREE.MeshBasicMaterial({ color: '#b9bcc2' });
  for (const z of [0.075, -0.025]) {                       // pomo por los dos lados
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.027, 20, 14), pomoMat); p.position.set(ancho - 0.065, 1.0, z); pivot.add(p);
  }
  // --- pasillo: suelo, paredes y techo sencillos con luz de entrada (ya "pintada" en el color)
  const pas = new THREE.Group(); scene.add(pas);
  const plano = (w, h, color, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.set(...pos); m.rotation.set(...rot); pas.add(m); return m;
  };
  plano(2.4, 2.6, '#6d5c4c', [0.47, 0.0, 5.08], [-Math.PI / 2, 0, 0]);                        // suelo de terrazo en sombra
  plano(2.4, 2.6, '#8e8580', [0.47, 2.54, 5.08], [Math.PI / 2, 0, 0]);                        // techo
  plano(2.6, 2.54, '#a49b95', [-0.33, 1.27, 5.08], [0, Math.PI / 2, 0]);                     // pared izquierda
  plano(2.6, 2.54, '#9c938d', [1.6, 1.27, 5.08], [0, -Math.PI / 2, 0]);                      // pared derecha
  // pared del cuarto vista desde el pasillo (con el hueco de la puerta) + marco de madera
  const pared = '#b3aaa3', marco = '#6a3018';
  plano(0.36, 2.54, pared, [-0.15, 1.27, DOOR.wall + 0.001], [0, 0, 0]);
  plano(0.75, 2.54, pared, [1.27, 1.27, DOOR.wall + 0.001], [0, 0, 0]);
  plano(0.94, 0.45, pared, [0.465, 2.315, DOOR.wall + 0.001], [0, 0, 0]);
  plano(0.07, 2.09, marco, [0.065, 1.045, DOOR.wall + 0.002], [0, 0, 0]);
  plano(0.07, 2.09, marco, [0.865, 1.045, DOOR.wall + 0.002], [0, 0, 0]);
  plano(0.87, 0.07, marco, [0.465, 2.055, DOOR.wall + 0.002], [0, 0, 0]);
  pas.add(new THREE.Mesh(new THREE.BoxGeometry(0.87, 0.012, 0.12), new THREE.MeshBasicMaterial({ color: '#8a7b6c' })).translateX(0.465).translateZ(3.72));

  return {
    vista: { pos: new THREE.Vector3(0.52, 1.62, 5.55), look: new THREE.Vector3(0.47, 1.30, 3.60), fov: 58 },
    // la pegatina de la puerta, muy de cerca (clic en ella; clic fuera la suelta). La pegatina mide 5 x 7 cm y está en (0,465 · 1,52 · 3,714)
    vistaPegatina: { pos: new THREE.Vector3(0.465, 1.52, 4.0), look: new THREE.Vector3(0.465, 1.52, 3.7), fov: 24 },
    pegatina: peg,
    vistaDentro: { pos: new THREE.Vector3(0.50, 1.62, 3.95), look: new THREE.Vector3(0.70, 1.20, 2.40), fov: 62 },
    // de la puerta a la vista principal, en curva por el centro del hueco (en línea recta atravesaba la pared)
    paso: new THREE.Vector3(0.45, 1.70, 3.10),
    bisagra: new THREE.Vector2(DOOR.hingeX, DOOR.z), radioPuerta: DOOR.x1 - DOOR.hingeX,
    abrir(t) { pivot.rotation.y = 1.5 * t; pivot.updateMatrixWorld(true); },   // 0 cerrada -> 1 abierta (~86º)
    ocultarPasillo() { pas.visible = false; },
    puerta: [doorMesh, exterior, peg],
  };
}
