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
        'Una de mis pasiones es el rugby. Empecé a jugar en 3º de la ESO (en 2017) y desde entonces no he parado. Juego en el Club de Rugby San Roque, en la posición de flanker (6/7).',
        'Una de las cosas que más me ha inculcado el rugby es el respeto: el respeto por el árbitro, el entrenador, mis compañeros y mis rivales. Por ejemplo, en el rugby los jugadores no pueden hablar con el árbitro, solo el capitán, y debe hacerlo con mucha educación porque gritar o insultar al árbitro es tarjeta directa.',
        'Por otro lado, algo que considero fundamental del rugby es que es un deporte de equipo por excelencia. En el campo, los egos se dejan atrás y pasamos a ser una unidad. De hecho, es de los pocos deportes en los que no hay nombres ni dorsales personales: los 15 jugadores iniciales llevan los dorsales del 1 al 15 en función de la posición que ocupan. No hay estrellas, solo piezas de un engranaje común.',
        'Además, el rugby es un deporte para cualquier persona. Da igual que seas alto o bajo, gordo o flaco, rápido y ágil o fuerte y decidido: siempre habrá un rol para ti. Los delanteros (o «gordos», apodo cariñoso para los jugadores del 1 al 8) son la potencia del equipo: placan y chocan contra los delanteros del otro equipo y generan espacios. Y luego están los 3/4 (jugadores del 9 al 15), que corren aprovechando esos espacios para superar la línea defensiva y ensayar un tanto.',
        'El rugby también me ha acompañado en la universidad. Estuve dos años en la selección de rugby 7 de la Universitat de València y los dos años ganamos el campeonato universitario de la Comunitat Valenciana (el CADU): dos oros. En ambos años fuimos al Campeonato de España Universitario (CEU), y el primer año quedamos terceros, con el bronce. Y cuando me fui de Erasmus a Roma también jugué con el equipo de 7 de La Sapienza, con el que fuimos a un torneo, el WIUC.',
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
        'One of my passions is rugby. I started playing in the third year of ESO (in 2017) and I have not stopped since. I play for Club de Rugby San Roque, as a flanker (6/7).',
        'One of the things rugby has instilled in me the most is respect: respect for the referee, the coach, my teammates and my opponents. For example, in rugby players cannot talk to the referee, only the captain can, and he has to do it very politely, because shouting at or insulting the referee means a direct card.',
        'On the other hand, something I consider fundamental about rugby is that it is the team sport par excellence. On the pitch, egos are left behind and we become one unit. In fact, it is one of the few sports with no personal names or shirt numbers: the 15 starting players wear numbers 1 to 15 depending on the position they take. There are no stars, only pieces of a common gear.',
        'Besides, rugby is a sport for anyone. It does not matter whether you are tall or short, heavy or thin, quick and agile or strong and determined: there will always be a role for you. The forwards (or "fatties", an affectionate nickname for the players from 1 to 8) are the power of the team: they tackle and crash into the other team\'s forwards and create space. And then come the backs (players 9 to 15), who run through that space to break the defensive line and score a try.',
        'Rugby has also been with me at university. I spent two years in the University of Valencia rugby sevens team and we won the Valencian university championship (the CADU) both years: two golds. Both years we went to the Spanish University Championship (CEU), and the first year we finished third, with the bronze. And when I went on Erasmus to Rome I also played for the Sapienza sevens team, with which we went to a tournament, the WIUC.',
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
