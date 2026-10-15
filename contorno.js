// Contorno de los objetos al pasar el ratón: el OutlinePass de three.js con el mismo aspecto, pero más barato:
//  - no vuelve a pintar toda la escena para saber qué tapa al objeto: usa la profundidad que ya dejó la pasada de la escena,
//  - no borra búferes que las pasadas a pantalla completa cubren enteros.
// La máscara marca en verde las partes del objeto tapadas por otros (se pintan con el color de "oculto"), como el original.
// El brillo no se suma a la imagen: va a su propia capa (`capa`, coma flotante: puede pasar del blanco) que el resplandor y el
// etalonaje añaden al leer la escena; así la escena puede guardarse en 8 bits sin recortar el brillo del contorno.
import * as THREE from 'three';
import { OutlinePass } from 'three/addons/postprocessing/OutlinePass.js';

export class Contorno extends OutlinePass {
  constructor(resolucion, escena, camara) {
    super(resolucion, escena, camara);
    this.mascara = new THREE.ShaderMaterial({
      uniforms: { tProf: { value: null }, cerca: { value: 0.1 }, lejos: { value: 100 }, inv: { value: new THREE.Vector2() } },
      vertexShader: 'void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
      fragmentShader: `#include <packing>
        uniform sampler2D tProf; uniform float cerca, lejos; uniform vec2 inv;
        void main(){
          float zEscena = perspectiveDepthToViewZ(texture2D(tProf, gl_FragCoord.xy * inv).x, cerca, lejos);
          float zAqui = perspectiveDepthToViewZ(gl_FragCoord.z, cerca, lejos);
          gl_FragColor = vec4(0., zAqui < zEscena - 0.005 ? 1. : 0., 1., 1.);     // más lejos que lo que se ve: tapado
        }`,
      side: THREE.DoubleSide,
    });
    // las pasadas a pantalla completa ya no encuentran el búfer borrado: que no dependan de la profundidad
    for (const m of [this.edgeDetectionMaterial, this.separableBlurMaterial1, this.separableBlurMaterial2]) m.depthTest = m.depthWrite = false;
    this.renderTargetDepthBuffer.dispose();
    this.capa = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: false }); this.capaLimpia = false;
  }

  setSize(w, h) { super.setSize(w, h); this.capa.setSize(w, h); this.capaLimpia = false; }

  limpiarCapa(renderer) {
    if (this.capaLimpia) return;
    renderer.setRenderTarget(this.capa); renderer.setClearColor(0x000000, 0); renderer.clear(); this.capaLimpia = true;
  }

  render(renderer, writeBuffer, readBuffer) {
    renderer.getClearColor(this._oldClearColor); this.oldClearAlpha = renderer.getClearAlpha();
    if (!this.selectedObjects.length) { this.limpiarCapa(renderer); renderer.setClearColor(this._oldClearColor, this.oldClearAlpha); return; }
    const autoClear = renderer.autoClear; renderer.autoClear = false;
    renderer.setClearColor(0xffffff, 1);
    // 1. máscara: solo lo seleccionado, comparado con la profundidad de la escena
    this.updateSelectionCache();
    this.changeVisibilityOfNonSelectedObjects(false);
    const fondo = this.renderScene.background; this.renderScene.background = null;
    const u = this.mascara.uniforms, mb = this.renderTargetMaskBuffer;
    u.tProf.value = readBuffer.depthTexture; u.cerca.value = this.renderCamera.near; u.lejos.value = this.renderCamera.far; u.inv.value.set(1 / mb.width, 1 / mb.height);
    this.renderScene.overrideMaterial = this.mascara;
    renderer.setRenderTarget(mb); renderer.clear(); renderer.render(this.renderScene, this.renderCamera);
    this.renderScene.overrideMaterial = null;
    this.changeVisibilityOfNonSelectedObjects(true);
    this._visibilityCache.clear(); this._selectionCache.clear();
    this.renderScene.background = fondo;
    const q = this.fsQuad, pinta = rt => { renderer.setRenderTarget(rt); q.render(renderer); };
    // 2. a media resolución
    q.material = this.materialCopy; this.copyUniforms.tDiffuse.value = mb.texture; pinta(this.renderTargetMaskDownSampleBuffer);
    this.tempPulseColor1.copy(this.visibleEdgeColor); this.tempPulseColor2.copy(this.hiddenEdgeColor);
    if (this.pulsePeriod > 0) {
      const k = (1 + 0.25) / 2 + Math.cos(performance.now() * 0.01 / this.pulsePeriod) * (1.0 - 0.25) / 2;
      this.tempPulseColor1.multiplyScalar(k); this.tempPulseColor2.multiplyScalar(k);
    }
    // 3. bordes
    const ed = this.edgeDetectionMaterial.uniforms, md = this.renderTargetMaskDownSampleBuffer;
    q.material = this.edgeDetectionMaterial; ed.maskTexture.value = md.texture; ed.texSize.value.set(md.width, md.height);
    ed.visibleEdgeColor.value = this.tempPulseColor1; ed.hiddenEdgeColor.value = this.tempPulseColor2;
    pinta(this.renderTargetEdgeBuffer1);
    // 4. desenfoque a media y a un cuarto de resolución
    const b1 = this.separableBlurMaterial1.uniforms, b2 = this.separableBlurMaterial2.uniforms;
    q.material = this.separableBlurMaterial1; b1.kernelRadius.value = this.edgeThickness;
    b1.colorTexture.value = this.renderTargetEdgeBuffer1.texture; b1.direction.value = OutlinePass.BlurDirectionX; pinta(this.renderTargetBlurBuffer1);
    b1.colorTexture.value = this.renderTargetBlurBuffer1.texture; b1.direction.value = OutlinePass.BlurDirectionY; pinta(this.renderTargetEdgeBuffer1);
    q.material = this.separableBlurMaterial2;
    b2.colorTexture.value = this.renderTargetEdgeBuffer1.texture; b2.direction.value = OutlinePass.BlurDirectionX; pinta(this.renderTargetBlurBuffer2);
    b2.colorTexture.value = this.renderTargetBlurBuffer2.texture; b2.direction.value = OutlinePass.BlurDirectionY; pinta(this.renderTargetEdgeBuffer2);
    // 5. sumarlo a la imagen
    const ov = this.overlayMaterial.uniforms;
    q.material = this.overlayMaterial;
    ov.maskTexture.value = mb.texture; ov.edgeTexture1.value = this.renderTargetEdgeBuffer1.texture; ov.edgeTexture2.value = this.renderTargetEdgeBuffer2.texture;
    ov.patternTexture.value = this.patternTexture; ov.edgeStrength.value = this.edgeStrength; ov.edgeGlow.value = this.edgeGlow; ov.usePatternTexture.value = this.usePatternTexture;
    this.capaLimpia = false; renderer.setRenderTarget(this.capa); renderer.setClearColor(0x000000, 0); renderer.clear(); q.render(renderer);   // aditivo sobre negro: el brillo tal cual
    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha); renderer.autoClear = autoClear;
  }
}
