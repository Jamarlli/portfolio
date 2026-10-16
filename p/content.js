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
    // bocadillos de las fotos del espejo (en el orden de foto_espejo_1, 2, 3); null = aún sin texto (la foto no responde al clic)
    FOTOS: [
      { title: 'Rugby', paras: [
        'Juego al rugby desde 3º de la ESO (2017), en el Club Rugby San Roque. Soy flanker: el 6 o el 7.',
        'Es un deporte que te enseña respeto: por el árbitro, por el entrenador, por tu equipo y por el rival. Solo el capitán habla con el árbitro; el resto le traslada lo que quiera decir.',
        'Aquí cada persona tiene su cometido, seas como seas: los más grandes dan potencia en la melé y apoyo en las touches, los rápidos corren por las bandas, los ágiles se cuelan entre los huecos de la defensa…',
        'Y es un deporte DE EQUIPO: una persona sola no hace nada. Los egos se quedan atrás. Nadie lleva su nombre en la camiseta: se reparte por el número de tu posición, y si sales de titular como 6, juegas con el 6.',
        'En la universidad, dos años en la selección de rugby 7 de la UV: dos oros en el campeonato universitario de la Comunitat Valenciana (el CADU) y dos veces al Campeonato de España Universitario, con un bronce el primer año. Y en mi Erasmus jugué con el equipo de 7 de La Sapienza, en Roma, y fuimos a un torneo, el WIUC.',
      ] },
      null,
      null,
    ],
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
    FOTOS: [
      { title: 'Rugby', paras: [
        'I have played rugby since the third year of ESO (2017), at Club Rugby San Roque. I am a flanker: number 6 or 7.',
        'It is a sport that teaches you respect: for the referee, for the coach, for your team and for the opponent. Only the captain talks to the referee; everyone else passes their comments through the captain.',
        'Everyone has a role, whatever you are like: the bigger players give power in the scrum and support in the lineouts, the fast ones run down the wings, the agile ones slip through gaps in the defence…',
        'And it is a TEAM sport: one person alone achieves nothing. Egos stay behind. Nobody has their name on the shirt: it is given by your position number, and if you start as a 6, you play in the 6.',
        'At university I spent two years in the UV rugby sevens team: two golds at the Valencian university championship (the CADU) and twice at the Spanish University Championship, with a bronze the first year. And during my Erasmus I played for the Sapienza sevens team in Rome and we went to a tournament, the WIUC.',
      ] },
      null,
      null,
    ],
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

export const { ABOUT, PROJECTS, EXPERIENCE, EDUCATION, FOTOS } = CONTENIDO[LANG];
