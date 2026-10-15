// Contenido del portfolio, en español e inglés (el idioma lo elige i18n.js). TODO: rellenar con datos reales (LinkedIn / CV de Javier).
// Todo lo marcado como "pendiente" / "pending" es de relleno y NO es información real.
import { LANG } from './i18n.js';

const CONTENIDO = {
  es: {
    ABOUT: {
      name: 'Javier Martínez Llinares',
      role: 'Ingeniero de IA',
      bio: '23 años · Valencia.',
      gustos: ['🏉 Rugby', '🎭 Teatro', '📚 Leer', 'Pendiente: más cosas sobre ti'],
      links: [
        { label: 'LinkedIn', href: '#', todo: true },
        { label: 'GitHub', href: '#', todo: true },
        { label: 'Email', href: '#', todo: true },
      ],
    },
    PROJECTS: [
      { title: 'Proyecto 1', blurb: 'Pendiente: descripción corta.', tags: ['IA'], href: '#' },
      { title: 'Proyecto 2', blurb: 'Pendiente: descripción corta.', tags: ['Datos'], href: '#' },
      { title: 'Este cuarto', blurb: 'Mi cuarto modelado por código en Blender con medidas reales, luz de atardecer horneada y three.js.', tags: ['Blender', 'three.js'], href: '#' },
    ],
    EXPERIENCE: [
      { when: 'Pendiente', what: 'Puesto · Empresa', detail: 'Pendiente: qué hiciste y qué lograste.' },
      { when: 'Pendiente', what: 'Puesto · Empresa', detail: 'Pendiente.' },
    ],
    EDUCATION: [
      { when: 'Pendiente', what: 'Titulación · Centro', detail: 'Pendiente.' },
      { when: 'Pendiente', what: 'Titulación · Centro', detail: 'Pendiente.' },
    ],
  },
  en: {
    ABOUT: {
      name: 'Javier Martínez Llinares',
      role: 'AI Engineer',
      bio: '23 years old · Valencia, Spain.',
      gustos: ['🏉 Rugby', '🎭 Theatre', '📚 Reading', 'Pending: more things about you'],
      links: [
        { label: 'LinkedIn', href: '#', todo: true },
        { label: 'GitHub', href: '#', todo: true },
        { label: 'Email', href: '#', todo: true },
      ],
    },
    PROJECTS: [
      { title: 'Project 1', blurb: 'Pending: short description.', tags: ['AI'], href: '#' },
      { title: 'Project 2', blurb: 'Pending: short description.', tags: ['Data'], href: '#' },
      { title: 'This room', blurb: 'My room, modelled in code in Blender with real measurements, baked sunset light and three.js.', tags: ['Blender', 'three.js'], href: '#' },
    ],
    EXPERIENCE: [
      { when: 'Pending', what: 'Role · Company', detail: 'Pending: what you did and what you achieved.' },
      { when: 'Pending', what: 'Role · Company', detail: 'Pending.' },
    ],
    EDUCATION: [
      { when: 'Pending', what: 'Degree · School', detail: 'Pending.' },
      { when: 'Pending', what: 'Degree · School', detail: 'Pending.' },
    ],
  },
};

export const { ABOUT, PROJECTS, EXPERIENCE, EDUCATION } = CONTENIDO[LANG];
