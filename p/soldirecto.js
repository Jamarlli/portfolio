// El sol directo, en directo: los horneados traen la luz del cielo sin sol; el sol entra por la ventana según dónde esté de verdad (sol.js)
// y aquí se calcula su luz y sus sombras reales (las de la ventana, los muebles, los estores…) cada vez que cambia algo:
//  1. se pinta la profundidad del cuarto vista desde el sol (mapa de sombras);
//  2. con ella se pinta, sobre la MISMA textura plana (atlas) del horneado, cuánta luz del sol recibe cada punto de cada superficie;
//  3. horas.js multiplica eso por el color propio de cada material (otro atlas horneado) y lo suma a la luz del cielo.
// Son tres pasadas pequeñas que solo se repiten si el sol, un estor o la mesa se mueven: en reposo no cuesta nada.
import * as THREE from 'three';

const CAPA = 3;                                    // los objetos que proyectan sombra del sol (los horneados y los estores)
const DESPLAZ = [[0, 0], [-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1], [-2, 0], [2, 0], [0, -2], [0, 2]];   // la luz se extiende 2 píxeles más allá de cada trozo del atlas, para que no haya bordes oscuros

export function crearSolDirecto(renderer, scene, mallas, { atlas = 2048, mapa = 2048, centro = new THREE.Vector3(1.3, 1.3, 1.8), radio = 3.3 } = {}) {
  const sunRT = new THREE.WebGLRenderTarget(atlas, atlas, { type: THREE.HalfFloatType, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
  const sombraRT = new THREE.WebGLRenderTarget(mapa, mapa, { depthBuffer: true, colorSpace: THREE.NoColorSpace });
  sombraRT.depthTexture = new THREE.DepthTexture(mapa, mapa, THREE.UnsignedIntType); sombraRT.depthTexture.minFilter = sombraRT.depthTexture.magFilter = THREE.NearestFilter;
  const cam = new THREE.OrthographicCamera(-radio, radio, radio, -radio, 0.1, 2 * radio + 2); cam.layers.set(CAPA);
  const quien = mallas.filter(m => m.geometry?.attributes.uv && m.geometry.attributes.position);
  for (const m of quien) if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
  const marcar = o => o.layers.enable(CAPA);
  quien.forEach(marcar);
  const sombraMat = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, colorWrite: false });
  // proxies: la misma geometría dibujada con las UV como posición (en el atlas), con la matriz del mundo del objeto
  const u = { tSombra: { value: sombraRT.depthTexture }, uSombraM: { value: new THREE.Matrix4() }, uL: { value: new THREE.Vector3(0, 1, 0) }, uDesp: { value: new THREE.Vector2() }, uTexel: { value: 1 / atlas }, uMapa: { value: 1 / mapa } };
  const mat = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.DoubleSide, depthTest: false, depthWrite: false,
    vertexShader: `uniform vec2 uDesp; uniform float uTexel; varying vec3 vP, vN;
      void main() {
        vP = (modelMatrix * vec4(position, 1.)).xyz; vN = normalize(mat3(modelMatrix) * normal);
        gl_Position = vec4(uv * 2. - 1. + uDesp * uTexel * 2., 0., 1.);
      }`,
    fragmentShader: `uniform sampler2D tSombra; uniform mat4 uSombraM; uniform vec3 uL; uniform float uMapa; varying vec3 vP, vN;
      void main() {
        vec3 N = normalize(vN);
        vec4 s = uSombraM * vec4(vP + N * 0.01, 1.); vec3 c = s.xyz / s.w * .5 + .5;
        float luz = 0.;
        for (int j = -2; j <= 2; j++) for (int i = -2; i <= 2; i++) luz += step(c.z - 0.0008, texture2D(tSombra, c.xy + vec2(i, j) * uMapa * 1.5).r);
        luz /= 25.; if (c.x < 0. || c.x > 1. || c.y < 0. || c.y > 1.) luz = 1.;
        float irr = max(dot(N, uL), 0.) * luz;
        gl_FragColor = vec4(irr, irr, irr, 1.);
      }`,
  });
  const pasada = new THREE.Scene();
  const proxies = quien.map(m => { const p = new THREE.Mesh(m.geometry, mat); p.frustumCulled = false; p.matrixAutoUpdate = false; p.userData.origen = m; pasada.add(p); return p; });
  const camAtlas = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const e = { rt: sunRT, ultima: new THREE.Vector3(9, 9, 9), listo: false };
  const aux = new THREE.Color();
  // dir: dirección HACIA el sol (vector unitario). Repinta el mapa de sombras y la luz del atlas
  e.actualizar = dir => {
    const l = dir.clone().normalize();
    cam.position.copy(centro).addScaledVector(l, radio + 1); cam.up.set(0, 1, 0); if (Math.abs(l.y) > 0.99) cam.up.set(0, 0, 1);
    cam.lookAt(centro); cam.updateMatrixWorld(true);
    u.uL.value.copy(l); u.uSombraM.value.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    const ant = renderer.getRenderTarget(), fondo = scene.background, autoClear = renderer.autoClear, over = scene.overrideMaterial;
    // 1. profundidad desde el sol
    scene.background = null; scene.overrideMaterial = sombraMat; renderer.setRenderTarget(sombraRT); renderer.autoClear = true; renderer.render(scene, cam);
    scene.overrideMaterial = over; scene.background = fondo;
    // 2. luz sobre el atlas (con el relleno de 2 píxeles)
    for (const p of proxies) p.matrix.copy(p.userData.origen.matrixWorld);
    const cc = renderer.getClearColor(aux).clone(), ca = renderer.getClearAlpha();
    renderer.setRenderTarget(sunRT); renderer.setClearColor(0x000000, 0); renderer.clear(); renderer.autoClear = false;
    for (let i = 0; i < DESPLAZ.length; i++) { u.uDesp.value.set(...DESPLAZ[DESPLAZ.length - 1 - i]); renderer.render(pasada, camAtlas); }   // el último, el de verdad (0, 0), encima
    renderer.autoClear = autoClear; renderer.setClearColor(cc, ca); renderer.setRenderTarget(ant);
    e.ultima.copy(l); e.listo = true;
  };
  e.necesita = dir => !e.listo || e.ultima.distanceToSquared(dir) > 4e-6;
  return e;
}
