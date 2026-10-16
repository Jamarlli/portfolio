// Contenido del portfolio, en español e inglés (el idioma lo elige i18n.js).
// Fuentes: CV en español e inglés (cc/cv), exportación de LinkedIn (Profile.pdf), artículo de CASEIB 2025 (183.pdf) y la web de nódicus.
// Lo que contenga "pendiente" / "pending" se marca en rojo en la web: es de relleno y NO es información real.
import { LANG } from './i18n.js';

const CONTENIDO = {
  es: {
    ABOUT: {
      name: 'Javier Martínez Llinares',
      role: 'Ingeniero de IA y científico de datos · cofundador de nódicus',
      bio: '23 años · Valencia. Me encanta aprender cosas nuevas y profundizar en las que ya sé. Busco problemas y encontrar soluciones con todas las herramientas a mi alcance.',
      gustos: ['🏉 Rugby federado y deportista de élite de la UV', '🎭 Teatro', '⛰️ Montaña', '📚 Leer', '🏕️ Monitor de tiempo libre (MAT) y primeros auxilios'],
      links: [
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/javier-martinez-llinares/' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Jamarlli' },
        { icon: 'nodicus', label: 'nódicus', href: 'https://www.nodicus.com' },
        { icon: 'email', label: 'Email', href: 'mailto:javier.mtinez.llinares@gmail.com' },
      ],
    },
    PROJECTS: [
      { title: 'Fibrosis auricular con IA', blurb: 'Redes convolucionales que estiman el grado de fibrosis del tejido auricular a partir de electrogramas, como alternativa a la imagen médica. 225 simulaciones y más de 200.000 electrogramas: la exactitud sube del 71 % al 91 %. Artículo en CASEIB 2025.', tags: ['Deep learning', 'Señales', 'CASEIB 2025'], href: 'https://dialnet.unirioja.es/servlet/articulo?codigo=10695530', link: 'Ver el artículo (Dialnet) →' },
      { title: 'R-HDBSCAN', blurb: 'Variante recursiva de HDBSCAN para obtener clusters locales de grano fino en datos de movilidad de sensores de València y la Comunitat Valenciana (Diputació de València).', tags: ['Clustering', 'Movilidad'], href: '#' },
      { title: 'nódicus', blurb: 'IA, datos y automatización a medida: clasificación automática de averías de camiones (menos de 0,10 € por avería y un 500 % más rápido), informes de visitas comerciales (30 h al mes ahorradas) y visión por computador en farmacia hospitalaria.', tags: ['IA', 'Visión', 'Automatización'], href: 'https://www.nodicus.com', link: 'nodicus.com →' },
      { title: 'Este cuarto', blurb: 'Mi cuarto modelado por código en Blender con medidas reales, luz de atardecer horneada y three.js.', tags: ['Blender', 'three.js'], href: 'https://github.com/Jamarlli/portfolio', link: 'Código en GitHub →' },
    ],
    EXPERIENCE: [
      { when: 'Desde oct 2025', what: 'Cofundador · nódicus', detail: 'IA, datos y automatización para empresas: visión por computador en farmacia hospitalaria, clasificación de averías con IA e informes de visitas automáticos.' },
      { when: 'Ene – jun 2025', what: 'Investigador · CoMMLab, Universitat de València', detail: 'TFG: redes convolucionales para estimar la fibrosis auricular. Primer autor y ponente en CASEIB 2025.' },
      { when: 'Oct – dic 2024', what: 'Científico de datos (prácticas) · Diputació de València', detail: 'Líder técnico de un equipo de tres en un análisis de movilidad; diseñó R-HDBSCAN.' },
      { when: 'Sep 2022 – jul 2023', what: 'Desarrollador junior · Pksiam', detail: 'Soluciones web para farmacia hospitalaria: frontend (HTML, CSS, JavaScript) y backend (C#, SQL).' },
    ],
    EDUCATION: [
      { when: '2025 – 2026', what: 'Máster en IA, Reconocimiento de Formas e Imagen Digital · UPV', detail: 'Universitat Politècnica de València. Nota media: 9,21.' },
      { when: '2021 – 2025', what: 'Grado en Ciencia de Datos · Universitat de València', detail: 'Nota media: 9,01 con 6 matrículas de honor. Delegado de la promoción y deportista de élite de la UV (rugby).' },
      { when: '2023 – 2024', what: 'Erasmus · Sapienza Università di Roma', detail: 'Ciencia de datos.' },
      { when: 'Cambridge English First (B2) · Valencià C1', what: 'Idiomas y certificados', detail: 'Francés A2 e italiano de nivel medio. Hackathon Dream Big UPV 2025 y Hackathon Movilidad (Mobility Summit).' },
    ],
  },
  en: {
    ABOUT: {
      name: 'Javier Martínez Llinares',
      role: 'AI engineer and data scientist · co-founder of nódicus',
      bio: '23 years old · Valencia, Spain. I love learning new things and going deeper into the ones I already know. I look for problems and find solutions with every tool within reach.',
      gustos: ['🏉 Competitive rugby, elite athlete of the UV', '🎭 Theatre', '⛰️ Mountains', '📚 Reading', '🏕️ Youth leisure instructor (MAT) and first aid'],
      links: [
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/javier-martinez-llinares/' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Jamarlli' },
        { icon: 'nodicus', label: 'nódicus', href: 'https://www.nodicus.com' },
        { icon: 'email', label: 'Email', href: 'mailto:javier.mtinez.llinares@gmail.com' },
      ],
    },
    PROJECTS: [
      { title: 'Atrial fibrosis with AI', blurb: 'Convolutional networks that estimate the degree of atrial fibrosis from electrograms, as an alternative to medical imaging. 225 simulations and over 200,000 electrograms: accuracy rises from 71% to 91%. Paper at CASEIB 2025.', tags: ['Deep learning', 'Signals', 'CASEIB 2025'], href: 'https://dialnet.unirioja.es/servlet/articulo?codigo=10695530', link: 'Read the paper (Dialnet) →' },
      { title: 'R-HDBSCAN', blurb: 'A recursive variant of HDBSCAN to get fine-grained local clusters from sensor mobility data across Valencia and the Valencian Community (Diputació de València).', tags: ['Clustering', 'Mobility'], href: '#' },
      { title: 'nódicus', blurb: 'Custom AI, data and automation: automatic classification of truck faults (under €0.10 per fault and 500% faster), sales visit reports (30 hours a month saved) and computer vision in hospital pharmacy.', tags: ['AI', 'Vision', 'Automation'], href: 'https://www.nodicus.com', link: 'nodicus.com →' },
      { title: 'This room', blurb: 'My room, modelled in code in Blender with real measurements, baked sunset light and three.js.', tags: ['Blender', 'three.js'], href: 'https://github.com/Jamarlli/portfolio', link: 'Code on GitHub →' },
    ],
    EXPERIENCE: [
      { when: 'Since Oct 2025', what: 'Co-founder · nódicus', detail: 'AI, data and automation for companies: computer vision in hospital pharmacy, AI fault classification and automated sales visit reports.' },
      { when: 'Jan – Jun 2025', what: 'Researcher · CoMMLab, Universitat de València', detail: "Bachelor's thesis: convolutional networks to estimate atrial fibrosis. First author and speaker at CASEIB 2025." },
      { when: 'Oct – Dec 2024', what: 'Data scientist (internship) · Diputació de València', detail: 'Technical lead of a team of three on a mobility analysis; designed R-HDBSCAN.' },
      { when: 'Sep 2022 – Jul 2023', what: 'Junior developer · Pksiam', detail: 'Custom web solutions for hospital pharmacy: frontend (HTML, CSS, JavaScript) and backend (C#, SQL).' },
    ],
    EDUCATION: [
      { when: '2025 – 2026', what: 'MSc in AI, Pattern Recognition and Digital Imaging · UPV', detail: 'Universitat Politècnica de València. GPA: 9.21.' },
      { when: '2021 – 2025', what: 'BSc in Data Science · Universitat de València', detail: 'GPA: 9.01 with 6 honours distinctions. Class representative and elite athlete of the UV (rugby).' },
      { when: '2023 – 2024', what: 'Erasmus · Sapienza Università di Roma', detail: 'Data science.' },
      { when: 'Cambridge English First (B2) · Valencian C1', what: 'Languages and certificates', detail: 'French A2 and intermediate Italian. Hackathon Dream Big UPV 2025 and Mobility Summit Hackathon.' },
    ],
  },
};

export const { ABOUT, PROJECTS, EXPERIENCE, EDUCATION } = CONTENIDO[LANG];
