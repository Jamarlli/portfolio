// Espejo en tiempo real, como el Reflector de three.js (misma cámara reflejada, mismo plano de recorte oblicuo,
// misma resolución y antialiasing) pero sin desperdicio:
//  - pinta el reflejo una sola vez por fotograma (el contorno y otras pasadas vuelven a dibujar la escena con la misma cámara),
//  - y solo el trozo que el espejo ocupa en pantalla: la textura es una ventana de la rejilla completa (textureWidth x
//    textureHeight) del tamaño de ese trozo, alineada píxel a píxel, así que el antialiasing no resuelve la textura entera,
//  - las texturas se reservan al cargar (`reservar`: 2 o 3 tamaños según lo que el espejo ocupará en vistas y vuelos) y cada
//    fotograma usa la menor que cabe: nunca se reserva memoria a mitad de un vuelo,
//  - se guarda en sRGB de 8 bits (la mitad de memoria que mover que en coma flotante; la precisión es la de la pantalla).
// `escala` (< 1) pinta el reflejo con una rejilla más gruesa mientras la cámara se mueve en equipos justos.
import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

const BLOQUE = 64;     // tamaños redondeados por bloques

export function crearEspejo(geometria, opciones, camaraPrincipal) {
  const ref = new Reflector(geometria, opciones);
  const WT = opciones.textureWidth, HT = opciones.textureHeight, cam = ref.camera;
  const textureMatrix = ref.material.uniforms.textureMatrix.value;
  ref.getRenderTarget().dispose();                // se usan las del juego de abajo
  const juego = [];                              // texturas preparadas, de mayor a menor
  const nueva = (w, h) => {
    const rt = new THREE.WebGLRenderTarget(w, h, { samples: opciones.multisample ?? 4, type: THREE.UnsignedByteType, colorSpace: THREE.SRGBColorSpace });
    rt.resolveDepthBuffer = false;               // la profundidad del reflejo no se vuelve a usar: no hace falta resolverla tras el antialiasing
    return rt;
  };
  const redondear = (w, h) => [Math.min(WT, Math.ceil(w / BLOQUE) * BLOQUE), Math.min(HT, Math.ceil(h / BLOQUE) * BLOQUE)];
  geometria.computeBoundingBox(); const bb = geometria.boundingBox;
  const plano = new THREE.Plane(), normal = new THREE.Vector3(), posEspejo = new THREE.Vector3(), posCam = new THREE.Vector3();
  const rot = new THREE.Matrix4(), mira = new THREE.Vector3(), vista = new THREE.Vector3(), objetivo = new THREE.Vector3();
  const clip = new THREE.Vector4(), q = new THREE.Vector4(), recorte = new THREE.Matrix4();
  const P = [0, 1, 2, 3].map(() => new THREE.Vector3()), Q = [];
  let hecho = false;
  ref.escala = 1; ref.reutilizar = false;
  ref.nuevoFotograma = () => { hecho = false; };

  // coloca la cámara reflejada (igual que Reflector.js) y devuelve el trozo [x, y, ancho, alto] de la rejilla W x H que ocupa el espejo
  function preparar(camera, W, H) {
    posEspejo.setFromMatrixPosition(ref.matrixWorld); posCam.setFromMatrixPosition(camera.matrixWorld);
    rot.extractRotation(ref.matrixWorld); normal.set(0, 0, 1).applyMatrix4(rot);
    vista.subVectors(posEspejo, posCam);
    if (vista.dot(normal) > 0) return null;                              // se ve por detrás
    vista.reflect(normal).negate().add(posEspejo);
    rot.extractRotation(camera.matrixWorld);
    mira.set(0, 0, -1).applyMatrix4(rot).add(posCam);
    objetivo.subVectors(posEspejo, mira).reflect(normal).negate().add(posEspejo);
    cam.position.copy(vista); cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(normal); cam.lookAt(objetivo);
    cam.far = camera.far;
    cam.updateMatrixWorld(); cam.projectionMatrix.copy(camera.projectionMatrix);
    // esquinas en coordenadas de la cámara reflejada, recortadas por el plano cercano
    const c = [[bb.min.x, bb.min.y], [bb.max.x, bb.min.y], [bb.max.x, bb.max.y], [bb.min.x, bb.max.y]];
    for (let i = 0; i < 4; i++) P[i].set(c[i][0], c[i][1], 0).applyMatrix4(ref.matrixWorld).applyMatrix4(cam.matrixWorldInverse);
    const zc = -camera.near * 1.001, dentro = p => p.z <= zc; Q.length = 0;
    for (let i = 0; i < 4; i++) {
      const a = P[i], b = P[(i + 1) % 4];
      if (dentro(a)) Q.push(a.clone());
      if (dentro(a) !== dentro(b)) Q.push(a.clone().lerp(b, (zc - a.z) / (b.z - a.z)));
    }
    if (!Q.length) return null;
    let x0 = 1, x1 = 0, y0 = 1, y1 = 0;
    for (const p of Q) {
      p.applyMatrix4(cam.projectionMatrix);
      x0 = Math.min(x0, (p.x + 1) / 2); x1 = Math.max(x1, (p.x + 1) / 2); y0 = Math.min(y0, (p.y + 1) / 2); y1 = Math.max(y1, (p.y + 1) / 2);
    }
    const px0 = Math.max(0, Math.floor(x0 * W) - 3), py0 = Math.max(0, Math.floor(y0 * H) - 3);
    const px1 = Math.min(W, Math.ceil(x1 * W) + 3), py1 = Math.min(H, Math.ceil(y1 * H) + 3);
    return px1 > px0 && py1 > py0 ? [px0, py0, px1 - px0, py1 - py0] : null;
  }

  // tamaño que necesita la textura con esta cámara (para reservarlas de antemano)
  ref.texturas = () => juego.map(rt => [rt.width, rt.height]);
  ref.medir = camera => { camera.updateMatrixWorld(); const r = preparar(camera, WT, HT); return r ? [r[2], r[3]] : [0, 0]; };
  // tamaños [ancho, alto, peso]: la mayor textura los cubre todos; se añaden hasta dos más pequeñas, las que menos
  // área media dejan por fotograma (cada fotograma usa la menor que le cabe; el peso es cuánto tiempo se ve esa pose)
  ref.reservar = (renderer, tamanos) => {
    for (const rt of juego.splice(0)) rt.dispose();
    const m = new Map();
    for (const [w, h, p = 1] of tamanos) if (w > 0 && h > 0) { const k = redondear(w, h).join(','); m.set(k, (m.get(k) || 0) + p); }
    const L = [...m].map(([k, p]) => [...k.split(',').map(Number), p]);
    if (!L.length) return;
    const grande = [Math.max(...L.map(t => t[0])), Math.max(...L.map(t => t[1]))];
    const anchos = [...new Set(L.map(t => t[0]))], altos = [...new Set(L.map(t => t[1]))];
    const cand = anchos.flatMap(w => altos.map(h => [w, h])).filter(([w, h]) => w * h < grande[0] * grande[1]);
    const coste = sel => { let c = 0; for (const [w, h, p] of L) { let a = Infinity; for (const [sw, sh] of sel) if (sw >= w && sh >= h && sw * sh < a) a = sw * sh; c += p * a; } return c; };
    let mejor = [grande], mc = coste(mejor);
    for (let i = 0; i < cand.length; i++) for (let j = i; j < cand.length; j++) {
      const sel = i === j ? [grande, cand[i]] : [grande, cand[i], cand[j]], c = coste(sel);
      if (c < mc) { mc = c; mejor = sel; }
    }
    for (const [w, h] of mejor.sort((a, b) => b[0] * b[1] - a[0] * a[1])) { const rt = nueva(w, h); renderer.initRenderTarget(rt); juego.push(rt); }
  };

  ref.onBeforeRender = (renderer, scene, camera) => {
    if (camera !== camaraPrincipal || hecho) return;
    hecho = true;
    if (ref.reutilizar) return;                    // en vuelo, uno de cada dos fotogramas: el reflejo anterior (con su matriz) vale
    const W = Math.round(WT * ref.escala), H = Math.round(HT * ref.escala);
    const r = preparar(camera, W, H); if (!r) return;
    const [px0, py0, w, h] = r;
    let rt = null;
    for (let i = juego.length - 1; i >= 0 && !rt; i--) if (juego[i].width >= w && juego[i].height >= h) rt = juego[i];
    if (!rt) {                                                           // no debería pasar: se reservaron al cargar
      const [nw, nh] = redondear(Math.max(w, juego[0]?.width ?? 0), Math.max(h, juego[0]?.height ?? 0));
      juego[0]?.dispose(); juego[0] = rt = nueva(nw, nh);
      console.warn('espejo: textura nueva a mitad de uso', nw, nh);
    }
    ref.material.uniforms.tDiffuse.value = rt.texture;
    const tw = rt.width, th = rt.height;
    // recorte: pasa las coordenadas de la rejilla completa (NDC) a las de la ventana [px0, px0 + tw] x [py0, py0 + th]
    const sx = W / tw, sy = H / th, tx = -(2 * px0 / W - 1) * sx - 1, ty = -(2 * py0 / H - 1) * sy - 1;
    recorte.set(sx, 0, 0, tx, 0, sy, 0, ty, 0, 0, 1, 0, 0, 0, 0, 1);
    // matriz de la textura: rejilla completa -> ventana (con la proyección sin recorte oblicuo, como el original)
    textureMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1)
      .multiply(recorte).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse).multiply(ref.matrixWorld);
    // plano de recorte oblicuo (http://www.terathon.com/lengyel/Lengyel-Oblique.pdf), igual que el original
    plano.setFromNormalAndCoplanarPoint(normal, posEspejo).applyMatrix4(cam.matrixWorldInverse);
    clip.set(plano.normal.x, plano.normal.y, plano.normal.z, plano.constant);
    const e = cam.projectionMatrix.elements;
    q.set((Math.sign(clip.x) + e[8]) / e[0], (Math.sign(clip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
    clip.multiplyScalar(2 / clip.dot(q));
    e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1; e[14] = clip.w;
    cam.projectionMatrix.premultiply(recorte);                          // solo cambia las filas x, y: la profundidad es la misma
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    // pintar
    ref.visible = false;
    const anterior = renderer.getRenderTarget(), sombras = renderer.shadowMap.autoUpdate;
    renderer.shadowMap.autoUpdate = false;
    renderer.setRenderTarget(rt);
    renderer.state.buffers.depth.setMask(true);
    if (renderer.autoClear === false) renderer.clear();
    renderer.render(scene, cam);
    renderer.shadowMap.autoUpdate = sombras;
    renderer.setRenderTarget(anterior);
    if (camera.viewport !== undefined) renderer.state.viewport(camera.viewport);
    ref.visible = true;
  };
  return ref;
}
