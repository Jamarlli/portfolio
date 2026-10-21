// El libro de «Educación», de verdad: la tapa gira sobre el lomo y el libro se abre sobre la mesa. Las páginas del texto (HTML) se colocan encima de las hojas del
// modelo, así que lo que se lee está dentro del libro y no en una ventana con forma de libro. Todo va en coordenadas locales del tomo (`lb`), que está algo torcido
// sobre la mesa regulable: sigue a la mesa cuando sube o baja.
//
// Cerrado: tapa trasera, bloque de páginas, lomo y tapa delantera con la portada. Abierto (u = 1): la tapa delantera cae a la izquierda sobre la mesa (su cara de dentro
// es la página izquierda) y el bloque de páginas queda a la derecha. El libro crece un poco al abrirse para que cada hoja tenga el tamaño de un A4 más o menos.
export const PAGINA = { w: 420, h: 606 };                    // tamaño de diseño (px) de cada hoja de texto; se escala a lo que ocupa en pantalla

export function crearLibro3D(THREE, lb, { portada, canto, colorTapa }) {
  lb.geometry.computeBoundingBox();
  const bb = lb.geometry.boundingBox, X0 = bb.min.x, Y0 = bb.min.y, WC = bb.max.x - bb.min.x, H = bb.max.y - bb.min.y, D = bb.max.z - bb.min.z;
  const T = 0.0045, LOMO = 0.004, BORDE = 0.004, S = 0.17 / WC;     // grosor de la tapa, ancho del lomo, borde de tapa que sobresale de las hojas y cuánto crece al abrirse
  const basico = o => new THREE.MeshBasicMaterial(o);
  const mats = { tapa: basico({ color: colorTapa }), canto: basico({ map: canto }), portada: basico({ map: portada }), papel: basico({ color: new THREE.Color().setRGB(0.6, 0.75, 1) }) };
  // el papel lleva ese color azulado porque el filtro cálido de la imagen final (postpro.js) lo vuelve crema (medido: 231,217,181), parecido al de las hojas de texto; con un beige normal salía naranja al girar la hoja
  const caja = (w, h, d, m, x, y) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, 0); return o; };
  // el montaje cuelga del mismo grupo que el tomo (la mesa regulable), con su misma posición y giro; no del tomo, porque al ocultarlo se ocultaría también
  const pivote = new THREE.Group(); pivote.position.copy(lb.position); pivote.quaternion.copy(lb.quaternion); pivote.scale.copy(lb.scale); pivote.visible = false; lb.parent.add(pivote);
  const g = new THREE.Group(); g.position.set(X0, Y0, 0); pivote.add(g);
  g.add(caja(WC, T, D, mats.tapa, WC / 2, T / 2));                                                        // tapa trasera
  const bloque = caja(WC - LOMO - BORDE, H - 2 * T, D - 2 * BORDE, [mats.canto, mats.canto, mats.papel, mats.papel, mats.canto, mats.canto], LOMO + (WC - LOMO - BORDE) / 2, T + (H - 2 * T) / 2);
  // las hojas, en un grupo que se encoge un poco en horizontal al abrir: la hoja de la derecha está más alta que la de la izquierda y la cámara la vería mayor (perspectiva)
  const hojas = new THREE.Group(); hojas.add(bloque); g.add(hojas);                                       // las hojas (arriba, el papel de la primera página)
  const lomo = caja(LOMO, H, D, mats.tapa, LOMO / 2, H / 2); g.add(lomo);                                  // se aplasta al abrir
  const bisagra = new THREE.Group(); bisagra.position.set(0, H - T / 2, 0); g.add(bisagra);              // la tapa delantera gira aquí
  bisagra.add(caja(WC, T, D, mats.tapa, WC / 2, 0));
  const pt = new THREE.Mesh(new THREE.PlaneGeometry(WC, D), mats.portada); pt.rotation.x = -Math.PI / 2; pt.position.set(WC / 2, T / 2 + 0.0007, 0); bisagra.add(pt);
  const dentro = new THREE.Mesh(new THREE.PlaneGeometry(WC - LOMO - BORDE, D - 2 * BORDE), mats.papel); dentro.rotation.x = Math.PI / 2; dentro.position.set((WC - LOMO - BORDE) / 2, -T / 2 - 0.0007, 0); bisagra.add(dentro);

  const e = { grupo: g, mats, u: 0, anim: null, visible: false, compensa: 1 };   // compensa: lo que se encogen las hojas de la derecha (lo fija `vista`)
  const suave = x => x * x * (3 - 2 * x);
  e.pose = u => {
    e.u = u;
    const a = suave(u), th = Math.PI * a, w = suave(Math.min(1, Math.max(0, (th / Math.PI - 0.5) / 0.5)));   // w: la tapa se va posando sobre la mesa
    bisagra.rotation.z = th; bisagra.position.y = H - T / 2 + (T / 2 - (H - T / 2)) * w;
    lomo.scale.y = 1 + (T / H - 1) * w; lomo.position.y = lomo.scale.y * H / 2;
    g.scale.x = 1 + (S - 1) * a; hojas.scale.set(1 + (e.compensa - 1) * a, 1, 1 + (e.compensa - 1) * a);
    pivote.updateMatrixWorld(true);                              // la escena no actualiza las matrices sola
  };
  // cierra el libro de verdad (el original, visible) o lo abre (el montaje, visible)
  e.mostrar = on => { e.visible = on; pivote.visible = on; lb.visible = !on; if (on) pivote.updateMatrixWorld(true); };
  e.mover = (hacia, dur, fin) => { e.anim = { t0: null, de: e.u, a: hacia, dur, fin }; };
  e.actualizar = now => {
    const a = e.anim; if (!a) return false;
    a.t0 ??= now; const t = Math.min(1, (now - a.t0) / a.dur);
    e.pose(a.de + (a.a - a.de) * t);
    if (t >= 1) { e.anim = null; a.fin && a.fin(); }
    return true;
  };

  // la vista de la cámara: desde arriba, con el lomo en el centro y la parte de arriba del libro (hacia la ventana) arriba en la pantalla
  e.vista = (aspecto, fov = 42) => {
    lb.updateMatrixWorld(true);
    const centro = lb.localToWorld(new THREE.Vector3(X0, Y0 + H - T, 0));
    const arriba = new THREE.Vector3(0, 0, -1).transformDirection(lb.matrixWorld);
    const alto = Math.max(0.24 / 0.80, (2 * 0.17) / 0.92 / aspecto), d = alto / (2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)));
    e.compensa = d / (d + (H - 2 * T) * lb.scale.y);                       // la hoja de la derecha (arriba del bloque) queda más cerca de la cámara que la de la izquierda (sobre la mesa)
    return { pos: centro.clone().add(new THREE.Vector3(0, d, 0)), look: centro, fov, up: arriba };
  };
  // dónde caen en pantalla las dos hojas en la pose de ahora (también mientras se abre o se cierra), para poner encima las hojas de texto:
  // `q`: las cuatro esquinas en píxeles del viewport (arriba izquierda, arriba derecha, abajo izquierda, abajo derecha, tal como se lee la hoja);
  // `ver`: si la hoja mira a la cámara; `corte` (la derecha): hasta dónde la tapa todavía la tapa, en píxeles de la hoja de texto (arriba y abajo)
  const v = new THREE.Vector3(), cam = new THREE.Vector3();
  const pantalla = (obj, x, y, z) => { v.set(x, y, z); obj.localToWorld(v).project(e.camara); return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight }; };
  const cruz = q => (q[1].x - q[0].x) * (q[2].y - q[0].y) - (q[1].y - q[0].y) * (q[2].x - q[0].x);   // > 0: la hoja se ve por delante
  e.hojas = camera => {
    e.camara = camera; pivote.updateMatrixWorld(true); camera.updateMatrixWorld();
    const zz = D / 2 - BORDE, xd = WC - BORDE, yd = H - T + 0.0005, wl = WC - LOMO - BORDE, yl = -T / 2 - 0.0007;
    const der = [[LOMO, -zz], [xd, -zz], [LOMO, zz], [xd, zz]].map(([x, z]) => pantalla(hojas, x, yd, z));
    const izq = [[wl, -zz], [0, -zz], [wl, zz], [0, zz]].map(([x, z]) => pantalla(bisagra, x, yl, z));
    // la tapa, mientras está encima de la hoja derecha: el rayo de la cámara a su canto suelto corta el plano de la hoja (en coordenadas de las hojas, un espacio afín: las rectas siguen siendo rectas)
    hojas.worldToLocal(camera.getWorldPosition(cam));
    const corte = [-D / 2, D / 2].map(z => {
      let mejor = null;
      for (const y of [T / 2, -T / 2]) {
        const p = hojas.worldToLocal(bisagra.localToWorld(v.set(WC, y, z))), t = (yd - cam.y) / (p.y - cam.y);
        if (!(t > 0)) continue;
        const X = (cam.x + t * (p.x - cam.x) - LOMO) / (xd - LOMO) * PAGINA.w, Y = (cam.z + t * (p.z - cam.z) + zz) / (2 * zz) * PAGINA.h;
        if (!mejor || X > mejor.X) mejor = { X, Y };
      }
      return mejor;
    });
    let clip = null;
    if (corte[0] && corte[1] && Math.abs(corte[1].Y - corte[0].Y) > 1e-3) {
      const xEn = Y => corte[0].X + (corte[1].X - corte[0].X) * (Y - corte[0].Y) / (corte[1].Y - corte[0].Y);
      const xa = xEn(0), xb = xEn(PAGINA.h);
      if (Math.max(xa, xb) > 0) clip = [xa, xb];
    }
    const area = Math.abs(cruz(der));
    return {
      izq: { q: izq, ver: cruz(izq) > 0.03 * area },
      der: { q: der, ver: !clip || Math.min(clip[0], clip[1]) < PAGINA.w, clip },
      quieto: !e.anim && e.u === 1,                                         // abierto del todo: basta un rectángulo (el texto se ve más nítido que con perspectiva)
    };
  };
  return e;
}
