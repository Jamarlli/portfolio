// Resplandor (bloom): el mismo UnrealBloomPass de three.js, con ahorros que no cambian la imagen:
//  - no borra los búferes antes de pintarlos (cada pasada los cubre enteros),
//  - no suma el resplandor sobre la imagen en una pasada aparte a resolución completa: lo suma la pasada de etalonaje
//    leyendo `textura` (imagen + resplandor.rgb * resplandor.a, igual que la mezcla aditiva original),
//  - las zonas brillantes incluyen la capa del contorno (contorno.js), que no está en la escena,
//  - `reutilizar`: en vuelo, uno de cada dos fotogramas deja el anterior (el brillo es difuso),
//  - `parte` 1 / 2: se puede pintar en dos mitades (para repartir la nítida en trozos durante el balanceo).
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class Resplandor extends UnrealBloomPass {
  constructor(...a) {
    super(...a);
    // zonas brillantes de la escena + la capa del contorno (el mismo filtro que LuminosityHighPassShader)
    this.highPassUniforms.tCapa = { value: null }; this.highPassUniforms.conCapa = { value: 0 };
    this.materialHighPassFilter.fragmentShader = `uniform sampler2D tDiffuse, tCapa; uniform vec3 defaultColor; uniform float defaultOpacity, luminosityThreshold, smoothWidth, conCapa;
      varying vec2 vUv;
      void main() {
        vec4 texel = texture2D(tDiffuse, vUv); if (conCapa > .5) texel.rgb += texture2D(tCapa, vUv).rgb;
        float v = dot(texel.xyz, vec3(0.299, 0.587, 0.114));
        float alpha = smoothstep(luminosityThreshold, luminosityThreshold + smoothWidth, v);
        gl_FragColor = mix(vec4(defaultColor.rgb, defaultOpacity), texel, alpha);
      }`;
    for (const m of [this.materialHighPassFilter, ...this.separableBlurMaterials, this.compositeMaterial]) m.depthTest = m.depthWrite = false;
  }
  get textura() { return this.renderTargetsHorizontal[0].texture; }
  render(renderer, writeBuffer, readBuffer) {
    if (this.reutilizar) return;
    this.antes?.();
    const q = this.fsQuad, pinta = rt => { renderer.setRenderTarget(rt); q.render(renderer); }, parte = this.parte || 0;
    // 1. zonas brillantes
    if (parte !== 2) {
      this.highPassUniforms.tDiffuse.value = readBuffer.texture;
      this.highPassUniforms.luminosityThreshold.value = this.threshold;
      q.material = this.materialHighPassFilter; pinta(this.renderTargetBright);
    }
    // 2. desenfoque de cada nivel (la primera mitad: el nivel más grande, que es el que más cuesta)
    let entrada = parte === 2 ? this.renderTargetsVertical[0] : this.renderTargetBright;
    for (let i = parte === 2 ? 1 : 0; i < (parte === 1 ? 1 : this.nMips); i++) {
      const m = this.separableBlurMaterials[i]; q.material = m;
      m.uniforms.colorTexture.value = entrada.texture; m.uniforms.direction.value = UnrealBloomPass.BlurDirectionX; pinta(this.renderTargetsHorizontal[i]);
      m.uniforms.colorTexture.value = this.renderTargetsHorizontal[i].texture; m.uniforms.direction.value = UnrealBloomPass.BlurDirectionY; pinta(this.renderTargetsVertical[i]);
      entrada = this.renderTargetsVertical[i];
    }
    if (parte === 1) return;
    // 3. juntar los niveles (queda en `textura`)
    const u = this.compositeMaterial.uniforms;
    u.bloomStrength.value = this.strength; u.bloomRadius.value = this.radius; u.bloomTintColors.value = this.bloomTintColors;
    q.material = this.compositeMaterial; pinta(this.renderTargetsHorizontal[0]);
  }
}
