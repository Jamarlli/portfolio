// Lo que se ve del tiempo desde dentro: la lluvia cayendo tras el cristal, las gotas resbalando por él, el cielo gris o con niebla y los relámpagos.
// Todo se anima en el sombreador (la CPU solo avisa de cuándo repintar) y solo existe si llueve y la ventana está a la vista.
import * as THREE from 'three';

const GOTAS = 7000;

// lluvia: cada gota es un rectángulo fino que se estira por pantalla siguiendo su caída (el ancho es en píxeles, no en metros)
function crearGotas() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.5, 0, 0, 0.5, 0, 0, -0.5, 1, 0, 0.5, 1, 0]), 3));
  g.setIndex([0, 1, 2, 2, 1, 3]);
  const pos = new Float32Array(GOTAS * 3), rnd = new Float32Array(GOTAS * 2);
  for (let i = 0; i < GOTAS; i++) {
    const r = Math.random(), z = -0.3 - 14 * r * r, h = 5 + 0.5 * -z;
    pos.set([1.06 + (Math.random() - 0.5) * (2.4 + 1.6 * -z), Math.random() * h, z], i * 3);     // dentro del cono de lo que se ve por la ventana; más gotas cerca que lejos
    rnd.set([Math.random(), (i + 0.5) / GOTAS], i * 2);                                       // el segundo número reparte las gotas por intensidad
  }
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(rnd, 2));
  g.instanceCount = GOTAS;
  const u = { uTime: { value: 0 }, uInt: { value: 0 }, uSpeed: { value: 13 }, uLen: { value: 1.0 }, uWind: { value: 0.1 }, uRes: { value: new THREE.Vector2(1, 1) }, uPx: { value: 1.4 }, uAlfa: { value: 0.4 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `attribute vec3 aPos; attribute vec2 aRnd; uniform float uTime, uInt, uSpeed, uLen, uWind, uPx; uniform vec2 uRes; varying float vA, vSide;
      void main() {
        if (aRnd.y > uInt) { gl_Position = vec4(2., 2., 2., 1.); return; }
        float H = 5. + 0.5 * -aPos.z, y = mod(aPos.y - uTime * uSpeed * (0.85 + 0.3 * aRnd.x), H) - 0.8;
        vec3 head = vec3(aPos.x + uWind * y, y, aPos.z), dir = normalize(vec3(uWind, -1., 0.)), tail = head - dir * uLen * (0.7 + 0.6 * aRnd.x);
        vec4 c0 = projectionMatrix * viewMatrix * vec4(head, 1.), c1 = projectionMatrix * viewMatrix * vec4(tail, 1.);
        vec4 c = mix(c0, c1, position.y);
        c.x += position.x * uPx * 2. / uRes.x * c.w;                    // la caída es casi vertical: basta ensanchar en horizontal
        vA = 1. - position.y * 0.85; vSide = position.x * 2.; gl_Position = c;
      }`,
    fragmentShader: `uniform float uAlfa; varying float vA, vSide;
      void main() { float e = 1. - abs(vSide); gl_FragColor = vec4(.80, .86, .95, uAlfa * vA * e); }`,
  });
  const malla = new THREE.Mesh(g, m); malla.frustumCulled = false; malla.renderOrder = 1; malla.visible = false; malla.raycast = () => {};
  return { malla, u };
}

// gotas en el cristal (el famoso sombreador «Heartfelt» de BigWings, simplificado): gotas grandes que resbalan dejando rastro y gotitas quietas.
// Se coordenan con la posición del mundo (el cristal no trae UV) y se pinta una capa de agua casi transparente con brillo en los bordes
const GLSL_GOTAS = `
  #define S(a, b, t) smoothstep(a, b, t)
  vec3 N13(float p) { vec3 p3 = fract(vec3(p) * vec3(.1031, .11369, .13787)); p3 += dot(p3, p3.yzx + 19.19); return fract(vec3((p3.x + p3.y) * p3.z, (p3.x + p3.z) * p3.y, (p3.y + p3.z) * p3.x)); }
  float N(float t) { return fract(sin(t * 12345.564) * 7658.76); }
  float Saw(float b, float t) { return S(0., b, t) * S(1., b, t); }
  vec2 CapaGotas(vec2 uv, float t) {
    vec2 UV = uv; uv.y += t * 0.75;
    vec2 a = vec2(6., 1.), grid = a * 2., id = floor(uv * grid);
    float colShift = N(id.x); uv.y += colShift; id = floor(uv * grid);
    vec3 n = N13(id.x * 35.2 + id.y * 2376.1);
    vec2 st = fract(uv * grid) - vec2(.5, 0.);
    float x = n.x - .5, y = UV.y * 20., wiggle = sin(y + sin(y));
    x += wiggle * (.5 - abs(x)) * (n.z - .5); x *= .7;
    float ti = fract(t + n.z); y = (Saw(.85, ti) - .5) * .9 + .5;
    vec2 p = vec2(x, y);
    float d = length((st - p) * a.yx), mainDrop = S(.4, .0, d);
    float r = sqrt(S(1., y, st.y)), cd = abs(st.x - x);
    float trail = S(.23 * r, .15 * r * r, cd), trailFront = S(-.02, .02, st.y - y);
    trail *= trailFront * r * r;
    y = UV.y; float trail2 = S(.2 * r, .0, cd);
    float droplets = max(0., sin(y * (1. - y) * 120. - st.y) * trail2 * trailFront * n.z);
    y = fract(y * 10.) + (st.y - .5); float dd = length(st - vec2(x, y)); droplets = S(.3, 0., dd);
    return vec2(mainDrop + droplets * r * trailFront, trail);
  }
  float GotasQuietas(vec2 uv, float t) {
    uv *= 16.; vec2 id = floor(uv); uv = fract(uv) - .5;
    vec3 n = N13(id.x * 107.45 + id.y * 3543.654);
    float d = length(uv - (n.xy - .5) * .7), fade = Saw(.025, fract(t + n.z));
    return S(.3, 0., d) * fract(n.z * 10.) * fade;
  }`;
function crearCristal() {
  const u = { uTime: { value: 0 }, uInt: { value: 0 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.); vW = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime, uInt; varying vec2 vW; ${GLSL_GOTAS}
      void main() {
        vec2 uv = vW * 1.7; float t = uTime * .25, lluvia = uInt;
        float c = 2. * S(0., 1., lluvia) * GotasQuietas(uv, t);
        vec2 l1 = CapaGotas(uv, t) * S(.25, .75, lluvia), l2 = CapaGotas(uv * 1.85 + 3.7, t) * S(.0, .5, lluvia);
        c += l1.x + l2.x * .8; float rastro = clamp(l1.y + l2.y * .8, 0., 1.);
        c = clamp(c, 0., 1.);
        vec2 g = vec2(dFdx(c), dFdy(c)); float brillo = clamp(length(g) * 40., 0., 1.) * clamp(dot(normalize(g + 1e-6), vec2(-.55, .83)) * .5 + .5, 0., 1.);
        float agua = clamp(c * .5 + rastro * .12, 0., 1.);
        gl_FragColor = vec4(mix(vec3(.45, .52, .64), vec3(1.), brillo), .07 + agua * .26 * smoothstep(0., .08, lluvia) + brillo * .30);
      }`,
  });
  return { m, u };
}

// el cielo de fuera: gris con nubes, velado con niebla, más oscuro con lluvia y con los relámpagos
function vestirPaisajes(mallas) {
  const u = { uNub: { value: 0 }, uNiebla: { value: 0 }, uLluvia: { value: 0 }, uFlash: { value: 0 } };
  for (const o of mallas) {
    const m = o.material;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.fragmentShader = 'uniform float uNub, uNiebla, uLluvia, uFlash;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', `
        float lum = dot(outgoingLight, vec3(.2126, .7152, .0722));
        vec3 gris = vec3(lum * (1. - .30 * uNub - .22 * uLluvia) + .05 * uNub) * vec3(.94, .97, 1.);
        outgoingLight = mix(outgoingLight, gris, clamp(uNub * .85 + uLluvia * .1, 0., 1.));
        outgoingLight = mix(outgoingLight, vec3(clamp(lum * 1.25 + .22, 0., 1.)) * vec3(.96, .98, 1.), uNiebla);
        outgoingLight += uFlash * vec3(.55, .6, .75);
        #include <opaque_fragment>`);
    };
    m.customProgramCacheKey = () => 'paisaje-tiempo'; m.needsUpdate = true;
  }
  return u;
}

export function crearLluvia({ scene, camera, renderer, cristales, paisajes }) {
  const gotas = crearGotas(), cristal = crearCristal(), cielo = vestirPaisajes(paisajes);
  scene.add(gotas.malla);
  for (const c of cristales) { c.material = cristal.m; c.renderOrder = 2; }
  // el sol visto por la ventana: un resplandor en el sitio del cielo donde está de verdad (si cae dentro del paisaje); los muros lo tapan solos
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g2 = cv.getContext('2d'), gr = g2.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.08, 'rgba(255,248,230,.95)'); gr.addColorStop(0.25, 'rgba(255,225,170,.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)'); g2.fillStyle = gr; g2.fillRect(0, 0, 128, 128);
  const sol = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false, fog: false }));
  sol.visible = false; sol.raycast = () => {}; scene.add(sol);
  const frustum = new THREE.Frustum(), pv = new THREE.Matrix4(), esfera = new THREE.Sphere(new THREE.Vector3(1.06, 1.55, -0.05), 1.05);
  const e = { visible: false, flash: 0, proximoRayo: 0, ultimo: 0, int: 0 };
  // dir: hacia el sol (cuarto); color rgb; vis: 0..1 cuánto se ve (nubes lo apagan)
  e.ponerSol = (dir, color, vis) => {
    const t = 29 / Math.max(1e-3, -dir[2]), x = 1.06 + dir[0] * t, y = 1.55 + dir[1] * t;
    const ok = vis > 0.02 && dir[2] < -0.02 && y < 8 && y > -12 && Math.abs(x - 1.06) < 19;
    sol.visible = ok; if (!ok) return;
    sol.position.set(x, y, -29); sol.scale.setScalar(4.5 + 5 * (1 - Math.min(1, dir[1] * 3)));      // más grande y más rojo con el sol bajo
    sol.material.color.setRGB(color[0] * 1.6 * vis, color[1] * 1.45 * vis, color[2] * 1.2 * vis);
  };
  const dpr = renderer.getPixelRatio(), v2 = new THREE.Vector2();
  // devuelve true si hay que repintar la escena (algo se mueve)
  e.actualizar = (clima, intensidad, now) => {
    const lloviendo = intensidad > 0.01, nieve = false;
    pv.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse); frustum.setFromProjectionMatrix(pv);
    e.visible = frustum.intersectsSphere(esfera);
    e.int = intensidad;
    cielo.uNub.value = clima.nubes; cielo.uNiebla.value = clima.niebla; cielo.uLluvia.value = intensidad;
    // relámpagos: en tormenta, cada pocos segundos, un destello doble que se apaga rápido
    if (clima.tormenta) {
      if (now > e.proximoRayo) { e.flash = 1; e.proximoRayo = now + 3500 + Math.random() * 9000; e.rayo2 = now + 130 + Math.random() * 120; }
      if (e.rayo2 && now > e.rayo2) { e.flash = 0.8; e.rayo2 = 0; }
    }
    const f0 = e.flash; e.flash = Math.max(0, e.flash - (now - (e.t || now)) / 160); e.t = now;
    cielo.uFlash.value = e.flash * 0.9;
    const dibujar = lloviendo && e.visible;
    gotas.malla.visible = dibujar;
    for (const c of cristales) c.visible = true;
    if (dibujar) {
      renderer.getDrawingBufferSize(v2); gotas.u.uRes.value.copy(v2);
      gotas.u.uInt.value = Math.min(1, 0.03 + 0.7 * Math.pow(intensidad, 1.25));
      gotas.u.uSpeed.value = 11 + 7 * intensidad; gotas.u.uWind.value = Math.min(0.35, clima.viento * 0.009);
      gotas.u.uAlfa.value = 0.22 + 0.28 * intensidad; gotas.u.uPx.value = dpr * (1.1 + 0.7 * intensidad);
      gotas.u.uTime.value = cristal.u.uTime.value = now / 1000; cristal.u.uInt.value = intensidad;
    } else cristal.u.uInt.value = 0;
    // se anima a ~20 imágenes por segundo (las rayas largas disimulan) y solo con la ventana a la vista
    const repintar = (dibujar && now - e.ultimo > 48) || e.flash > 0 || f0 > 0;
    if (repintar) e.ultimo = now;
    return repintar;
  };
  return e;
}
