// Carga una textura descomprimiendo la imagen fuera del hilo principal (createImageBitmap): subirla a la GPU no congela la página.
// Da los mismos píxeles que TextureLoader (sin premultiplicar, conversión de color por defecto). El volteo vertical de las
// imágenes normales se hace en las coordenadas de textura (repeat/offset), no al decodificar: la opción `imageOrientation`
// de createImageBitmap no la respetan todos los navegadores (algunos Safari), y la textura saldría boca abajo.
// Si el navegador no tiene createImageBitmap, se usa el cargador de siempre.
import * as THREE from 'three';

async function decodificar(blob) {
  try { return await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'default' }); }
  catch { return await createImageBitmap(blob); }                       // navegadores sin esas opciones
}

export async function cargarTextura(url, { flipY = true } = {}) {
  let t;
  if (typeof createImageBitmap === 'function') {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    t = new THREE.Texture(await decodificar(await r.blob()));
    t.flipY = false;
    if (flipY) { t.repeat.set(1, -1); t.offset.set(0, 1); }              // v -> 1 - v
  } else {
    t = await new THREE.TextureLoader().loadAsync(url); t.flipY = flipY;
  }
  Object.assign(t, { colorSpace: THREE.SRGBColorSpace, anisotropy: 8, needsUpdate: true });
  return t;
}
