// Idiomas: español (por defecto) e inglés. El idioma lo fija la página que carga la web (window.IDIOMA = 'es' | 'en', ver herramientas/desplegar_javiermartinez.py)
// o, para probar, #lang=en en la dirección.
const hash = new URLSearchParams(location.hash.slice(1));
export const LANG = hash.get('lang') === 'en' || hash.get('lang') === 'es' ? hash.get('lang') : (window.IDIOMA === 'en' ? 'en' : 'es');

const TEXTOS = {
  es: {
    title: 'Javier Martínez Llinares',
    description: 'Portfolio de Javier Martínez Llinares, ingeniero de IA. Pasa a mi cuarto.',
    volver: '← Volver', cargando: 'Cargando el cuarto…', abriendo: 'Abriendo la puerta…', colocando: 'Colocando la pizarra…',
    relojTitulo: 'Cambiar la hora', relojReal: 'hora real',
    hintCuarto: 'Pasa el ratón por el cuarto · haz clic para curiosear', hintPizarra: 'Pasa el ratón por la pizarra · clic en un tema', hintPuerta: 'Toc, toc… haz clic para entrar',
    secciones: { proyectos: 'Proyectos', educacion: 'Educación', experiencia: 'Experiencia', sobremi: 'Sobre mí' }, pizarraTip: 'Pizarra: elige un tema',
    contacto: 'Contacto', pendiente: '(pendiente)', pizarraImagen: 'pizarra_texto.webp',
  },
  en: {
    title: 'Javier Martínez Llinares',
    description: 'Portfolio of Javier Martínez Llinares, AI engineer. Come into my room.',
    volver: '← Back', cargando: 'Loading the room…', abriendo: 'Opening the door…', colocando: 'Setting up the board…',
    relojTitulo: 'Change the time of day', relojReal: 'real time',
    hintCuarto: 'Move the mouse around the room · click to explore', hintPizarra: 'Move the mouse over the board · click a topic', hintPuerta: 'Knock, knock… click to come in',
    secciones: { proyectos: 'Projects', educacion: 'Education', experiencia: 'Experience', sobremi: 'About me' }, pizarraTip: 'Board: pick a topic',
    contacto: 'Contact', pendiente: '(pending)', pizarraImagen: 'pizarra_texto_en.webp',
  },
};
export const T = TEXTOS[LANG];
export const PENDIENTE = /pendiente|pending/i;

// los textos fijos del HTML (en español en la plantilla) pasan al idioma elegido
if (LANG === 'en') {
  const por = (sel, f) => { const e = document.querySelector(sel); if (e) f(e); };
  document.documentElement.lang = 'en'; document.title = T.title;
  por('meta[name=description]', e => e.setAttribute('content', T.description));
  por('#back', e => { e.textContent = T.volver; });
  por('#hint', e => { e.textContent = T.hintCuarto; });
  por('#relojBtn', e => { e.title = T.relojTitulo; });
  por('#relojReal', e => { e.textContent = T.relojReal; });
  por('#loading', e => { e.textContent = T.abriendo; });
}
