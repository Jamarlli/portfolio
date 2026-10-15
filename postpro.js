// Posprocesado: escena -> contorno -> resplandor -> etalonaje lofi -> (FXAA) -> textura de salida.
// Hay dos cadenas iguales: la nítida (resolución completa, la imagen de siempre) y la ligera (resolución CSS y bordes
// suavizados con FXAA) para los vuelos en equipos justos. Cada una deja su imagen en `textura` y el presentador las lleva
// a la pantalla, fundiendo de una a otra para que no se note el cambio (como una cámara que termina de enfocar).
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { FXAAShader as FXAA_ORIGINAL } from 'three/addons/shaders/FXAAShader.js';

// FXAA de three.js con dos retoques para Direct3D (sin avisos ni comportamiento indefinido): lectura con nivel de detalle
// fijo (no hay derivadas dentro de los bucles) y estructuras inicializadas
const FXAA_APLICAR = `vec4 ApplyFXAA( sampler2D tex2D, vec2 texSize, vec2 uv ) {
      LuminanceData luminance = SampleLuminanceNeighborhood( tex2D, texSize, uv );
      vec2 suv = uv;
      if ( !ShouldSkipPixel( luminance ) ) {
        float pixelBlend = DeterminePixelBlendFactor( luminance );
        EdgeData edge = DetermineEdge( texSize, luminance );
        float finalBlend = max( pixelBlend, DetermineEdgeBlendFactor( tex2D, texSize, luminance, edge, uv ) );
        if ( edge.isHorizontal ) suv.y += edge.pixelStep * finalBlend; else suv.x += edge.pixelStep * finalBlend;
      }
      return Sample( tex2D, suv );
    }
    `;
const fxaaFs = FXAA_ORIGINAL.fragmentShader;
const FXAAShader = { ...FXAA_ORIGINAL, fragmentShader: (fxaaFs.slice(0, fxaaFs.indexOf('vec4 ApplyFXAA(')) + FXAA_APLICAR + fxaaFs.slice(fxaaFs.indexOf('void main()')))
  .replace('return texture( tex2D, uv );', 'return textureLod( tex2D, uv, 0.0 );')
  .replace('LuminanceData l;', 'LuminanceData l = LuminanceData( 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0., 0. );')
  .replace('EdgeData e;', 'EdgeData e = EdgeData( false, 0., 0., 0. );') };
import { Resplandor } from './resplandor.js';
import { Contorno } from './contorno.js';

// la misma receta que blender/grade.py: sombras violáceas, luces cálidas, saturación y viñeta.
// Suma el resplandor y escribe ya en sRGB (lo que antes hacía OutputPass)
const ETALONAJE = {
  uniforms: { tDiffuse: { value: null }, tBloom: { value: null }, tCapa: { value: null }, conCapa: { value: 0 }, k: { value: 1.0 } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse, tBloom, tCapa; uniform float k, conCapa; varying vec2 vUv;
    vec3 toS(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1./2.4)) - .055, step(.0031308, c)); }
    void main(){
      vec4 b = texture2D(tBloom, vUv);                                  // + resplandor (como la mezcla aditiva de UnrealBloomPass)
      vec3 e = texture2D(tDiffuse, vUv).rgb; if (conCapa > .5) e += texture2D(tCapa, vUv).rgb;   // + contorno (si lo hay)
      vec3 a = toS(max(e + b.rgb * b.a, 0.));
      float L = dot(a, vec3(.299,.587,.114));
      vec3 tint = mix(vec3(.60,.56,1.18), vec3(1.16,.95,.66), clamp(L*1.4, 0., 1.));
      a = a*(1.-.75*k) + a*tint*.75*k;
      vec2 p = (vUv-.5)*2.; float r = length(vec2(p.x, p.y));
      a *= 1. - .22*k*pow(clamp(r-.55, 0., 1.), 1.5)/.55;
      float g = dot(a, vec3(.299,.587,.114)); a = g + (a-g)*(1.+.32*k);
      gl_FragColor = vec4(clamp(a, 0., 1.), 1.);
    }`,
};

// pasada a pantalla completa que lee la imagen del compositor (o una textura fija) y escribe en `destino`
class Pasada extends Pass {
  constructor(shader, destino, entrada = null) {
    super();
    this.material = new THREE.ShaderMaterial({ ...shader, uniforms: THREE.UniformsUtils.clone(shader.uniforms), depthTest: false, depthWrite: false });
    this.quad = new FullScreenQuad(this.material); this.destino = destino; this.entrada = entrada; this.needsSwap = false;
  }
  render(renderer, writeBuffer, readBuffer) {
    this.antes?.();
    this.material.uniforms.tDiffuse.value = this.entrada ? this.entrada.texture : readBuffer.texture;
    renderer.setRenderTarget(this.destino); this.quad.render(renderer);
  }
}

const salida = () => new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, depthBuffer: false });

export function crearCadena(renderer, scene, camera, { escala = 1, fxaa = false, msaa = 0 } = {}) {
  // la escena en 8 bits sRGB (la mitad de memoria que mover que en coma flotante; la precisión es la de la pantalla).
  // Lo único que pasa del blanco, el brillo del contorno, va en su propia capa (contorno.js)
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.UnsignedByteType, colorSpace: THREE.SRGBColorSpace, samples: msaa }));
  composer.renderToScreen = false;
  // la escena deja su profundidad en una textura: el contorno la usa para saber qué tapa a cada objeto
  for (const rt of [composer.renderTarget1, composer.renderTarget2]) rt.depthTexture = new THREE.DepthTexture(1, 1);
  composer.addPass(new RenderPass(scene, camera));
  const outline = new Contorno(new THREE.Vector2(innerWidth, innerHeight), scene, camera);
  Object.assign(outline, { edgeStrength: 4, edgeGlow: 0.6, edgeThickness: 1.5, pulsePeriod: 2.2 });
  outline.visibleEdgeColor.set('#fff1c9'); outline.hiddenEdgeColor.set('#ffcf8f');
  composer.addPass(outline);
  const bloom = new Resplandor(new THREE.Vector2(innerWidth, innerHeight), 0.35, 0.6, 0.82);
  composer.addPass(bloom);
  const graduada = salida(), suavizada = fxaa ? salida() : null;
  const grade = new Pasada(ETALONAJE, graduada);
  grade.material.uniforms.tBloom.value = bloom.textura;
  grade.material.uniforms.tCapa.value = bloom.highPassUniforms.tCapa.value = outline.capa.texture;   // el brillo del contorno
  grade.antes = bloom.antes = () => { grade.material.uniforms.conCapa.value = bloom.highPassUniforms.conCapa.value = outline.capaLimpia ? 0 : 1; };
  composer.addPass(grade);
  const aa = fxaa ? new Pasada(FXAAShader, suavizada, graduada) : null;
  if (aa) composer.addPass(aa);
  const cadena = {
    composer, outline, bloom, escala,
    textura: (suavizada || graduada).texture,
    get profundidad() { return composer.readBuffer.depthTexture; },        // la de la escena del último fotograma
    tamano(w, h) {
      const pr = renderer.getPixelRatio() * escala;
      composer.setPixelRatio(pr); composer.setSize(w, h);
      const W = Math.round(w * pr), H = Math.round(h * pr);
      graduada.setSize(W, H); suavizada?.setSize(W, H);
      if (aa) aa.material.uniforms.resolution.value.set(1 / W, 1 / H);
    },
  };
  cadena.tamano(innerWidth, innerHeight);
  return cadena;
}

// lleva a la pantalla la imagen de una cadena, o una mezcla de las dos: mix(a, b, t) (con t = 1 es exactamente b).
// `enfoque` (0..1) afila la imagen a de menor resolución al ampliarla (CAS, el enfocado adaptativo de AMD FidelityFX):
// devuelve el detalle que se pierde al bajar resolución sin crear halos.
export function crearPresentador(renderer) {
  const material = new THREE.ShaderMaterial({
    uniforms: { tA: { value: null }, tB: { value: null }, t: { value: 1 }, enfoque: { value: 0 }, texelA: { value: new THREE.Vector2() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tA, tB; uniform float t, enfoque; uniform vec2 texelA; varying vec2 vUv;
      vec3 m(vec2 d){ return texture2D(tA, vUv + d * texelA).rgb; }
      vec3 cas(){
        vec3 a = m(vec2(-1., -1.)), b = m(vec2(0., -1.)), c = m(vec2(1., -1.)), d = m(vec2(-1., 0.)), e = m(vec2(0.)),
             f = m(vec2(1., 0.)), g = m(vec2(-1., 1.)), h = m(vec2(0., 1.)), i = m(vec2(1., 1.));
        vec3 mn = min(min(min(d, e), min(f, b)), h); mn += min(mn, min(min(a, c), min(g, i)));
        vec3 mx = max(max(max(d, e), max(f, b)), h); mx += max(mx, max(max(a, c), max(g, i)));
        vec3 amp = sqrt(clamp(min(mn, 2. - mx) / max(mx, vec3(1e-4)), 0., 1.));
        vec3 w = amp * (-1. / mix(8., 5., enfoque));
        return clamp((b * w + d * w + f * w + h * w + e) / (1. + 4. * w), 0., 1.);
      }
      void main(){
        vec4 b = texture2D(tB, vUv);
        if (t >= 1.) { gl_FragColor = b; return; }
        vec3 a = enfoque > 0. ? cas() : texture2D(tA, vUv).rgb;
        gl_FragColor = vec4(mix(a, b.rgb, t), 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new FullScreenQuad(material);
  return (a, b, t, enfoque = 0) => {
    const u = material.uniforms; u.tA.value = a; u.tB.value = b; u.t.value = t; u.enfoque.value = enfoque;
    if (a.image) u.texelA.value.set(1 / a.image.width, 1 / a.image.height);
    renderer.setRenderTarget(null); quad.render(renderer);
  };
}

// reproyección (como el "timewarp" de las gafas de realidad virtual): la última imagen nítida, con su profundidad,
// se recoloca para la cámara actual. Para cada píxel se busca de dónde viene en la imagen base (3 iteraciones de punto
// fijo, de sobra para los pocos centímetros del balanceo) y se lee con un filtro bicúbico (Catmull-Rom) más un enfocado según
// cuánto cae entre píxeles: medido, la misma nitidez que la imagen pintada de verdad (100-102 %).
// Opcionalmente se mezcla con otra imagen (`movil`, t: cuánto se ve la reproyectada), para fundir al llegar de un vuelo.
export function crearReproyector(renderer) {
  const material = new THREE.ShaderMaterial({
    uniforms: { tColor: { value: null }, tProf: { value: null }, tMovil: { value: null }, t: { value: 1 }, tam: { value: new THREE.Vector2(1, 1) }, afilar: { value: 0.3 },
      invBase: { value: new THREE.Matrix4() }, actual: { value: new THREE.Matrix4() } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: `uniform sampler2D tColor, tProf, tMovil; uniform float t, afilar; uniform vec2 tam; uniform mat4 invBase, actual; varying vec2 vUv;
      vec2 aActual(vec2 uv){
        float z = texture2D(tProf, uv).x;
        vec4 w = invBase * vec4(uv * 2. - 1., z * 2. - 1., 1.); w /= w.w;
        vec4 q = actual * w; return q.xy / q.w * .5 + .5;
      }
      vec3 bicubica(vec2 uv){                                     // Catmull-Rom con 5 lecturas bilineales
        vec2 p = uv * tam, c = floor(p - .5) + .5, f = p - c;
        vec2 w0 = f * (-.5 + f * (1. - .5 * f)), w1 = 1. + f * f * (-2.5 + 1.5 * f), w2 = f * (.5 + f * (2. - 1.5 * f)), w3 = f * f * (-.5 + .5 * f);
        vec2 w12 = w1 + w2, t0 = (c - 1.) / tam, t3 = (c + 2.) / tam, t12 = (c + w2 / w12) / tam;
        vec3 r = texture2D(tColor, vec2(t12.x, t0.y)).rgb * w12.x * w0.y + texture2D(tColor, vec2(t0.x, t12.y)).rgb * w0.x * w12.y
               + texture2D(tColor, t12).rgb * w12.x * w12.y + texture2D(tColor, vec2(t3.x, t12.y)).rgb * w3.x * w12.y
               + texture2D(tColor, vec2(t12.x, t3.y)).rgb * w12.x * w3.y;
        return r / (w12.x * w0.y + w0.x * w12.y + w12.x * w12.y + w3.x * w12.y + w12.x * w3.y);
      }
      void main(){
        vec2 uv = vUv;
        for (int k = 0; k < 3; k++) uv += vUv - aActual(uv);
        uv = clamp(uv, vec2(0.), vec2(1.));
        vec3 c = bicubica(uv);
        if (afilar > 0.) {                                          // devuelve el detalle que se pierde al re-muestrear a medio píxel
          vec2 d = 1. / tam;
          vec3 m = (texture2D(tColor, uv + vec2(d.x, 0.)).rgb + texture2D(tColor, uv - vec2(d.x, 0.)).rgb + texture2D(tColor, uv + vec2(0., d.y)).rgb + texture2D(tColor, uv - vec2(0., d.y)).rgb) * .25;
          vec2 f = fract(uv * tam - .5), w = f * (1. - f) * 4.;          // 0 si cae en un píxel, 1 a medio píxel
          c += (c - m) * afilar * (w.x + w.y) * .5;
        }
        c = clamp(c, 0., 1.);
        if (t < 1.) c = mix(texture2D(tMovil, vUv).rgb, c, t);
        gl_FragColor = vec4(c, 1.);
      }`,
    depthTest: false, depthWrite: false,
  });
  const quad = new FullScreenQuad(material);
  return (color, prof, invBase, actual, movil = null, t = 1) => {
    const u = material.uniforms; u.tColor.value = color; u.tProf.value = prof; u.invBase.value.copy(invBase); u.actual.value.copy(actual);
    u.tMovil.value = movil || color; u.t.value = movil ? t : 1;
    if (color.image) u.tam.value.set(color.image.width, color.image.height);
    renderer.setRenderTarget(null); quad.render(renderer);
  };
}
