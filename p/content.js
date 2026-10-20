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
        { icon: 'x', label: 'X', href: 'https://x.com/javiermtinez_' },
        { icon: 'nodicus', label: 'nódicus', href: 'https://www.nodicus.com' },
        { icon: 'email', label: 'Email', href: 'mailto:javier.mtinez.llinares@gmail.com' },
      ],
    },
    // bocadillos de las fotos del espejo (en el orden de foto_espejo_1 rugby, 2 hackathon, 3 museo); null = aún sin texto (la foto no responde al clic)
    FOTOS: [
      { title: 'Rugby', paras: [
        'Una de mis pasiones es el rugby. Empecé a jugar en 3º de la ESO (en 2017) y desde entonces no he parado. Juego en el Club de Rugby San Roque, en la posición de flanker (6/7).',
        { h: 'Respeto', t: 'Una de las cosas que más me ha inculcado el rugby es el respeto: el respeto por el árbitro, el entrenador, mis compañeros y mis rivales. Por ejemplo, en el rugby los jugadores no pueden hablar con el árbitro, solo el capitán, y debe hacerlo con mucha educación porque gritar o insultar al árbitro es tarjeta directa.' },
        { h: 'Equipo', t: 'Por otro lado, algo que considero fundamental del rugby es que es un deporte de equipo por excelencia. En el campo, los egos se dejan atrás y pasamos a ser una unidad. De hecho, es de los pocos deportes en los que no hay nombres ni dorsales personales. Los 15 jugadores iniciales llevan los dorsales del 1 al 15 en función de la posición que ocupan. No hay estrellas, solo piezas de un engranaje común.' },
        'Además, el rugby es un deporte para cualquier persona. Da igual que seas alto o bajo, gordo o flaco, rápido y ágil o fuerte y decidido. Siempre habrá un rol para ti. Los delanteros (o «gordos», apodo cariñoso para los jugadores del 1 al 8) son la potencia del equipo. Placan y chocan contra los delanteros del otro equipo y generan espacios. Y luego están los 3/4 (jugadores del 9 al 15), que corren aprovechando esos espacios para superar la línea defensiva y ensayar un tanto.',
        { h: 'Sevens Universitario', t: 'El rugby también me ha acompañado en la universidad. Estuve dos años en la selección de rugby 7 de la Universitat de València y los dos años ganamos el campeonato universitario de la Comunitat Valenciana (el CADU), dos oros. En ambos años fuimos al Campeonato de España Universitario (CEU), y el primer año quedamos terceros, con el bronce. Y cuando me fui de Erasmus a Roma también jugué con el equipo de 7 de La Sapienza, con el que fuimos a un torneo, el WIUC.' },
      ] },
      { title: 'Hackathones', paras: [
        'De entre mis muchos hobbies, uno que me encanta es asistir a hackathones.',
        'Para los que no los conozcáis, los hackathones son eventos en los que, por equipos, se intenta resolver un problema en unas horas y se expone la solución a un jurado al final del evento.',
        { h: 'Lo que más me gusta', t: 'Lo que más me gusta de los hackathones es que conoces a mucha gente maja y buena. Me he encontrado con gente muy ambiciosa, con ganas de hacer y de experimentar, y eso a mí me da la vida. Además, me encanta enfrentarme a retos nuevos y desconocidos, pensar y retarme a mí mismo a la innovación cognitiva.' },
        { h: 'Lo profesional', t: 'En cuanto a lo profesional, está muy bien porque haces networking y conoces a muchas empresas que plantean problemáticas que tienen, lo que te permite ver mucho más allá de lo que conoces y entender qué es lo que pasa en otros sectores o nichos.' },
        { h: 'Mi papel en el equipo', t: 'Se me da muy bien liderar equipos, y también adaptarme y cumplir el rol que el equipo necesita de mí, ya sea llevar las riendas, delegar o impulsar las ideas de mis compañeros. Además soy muy buen orador, y suelo hacer los pitchs finales. Por mi experiencia en teatro, disfruto mucho hablando ante un público y buscando transmitir todo lo que hemos desarrollado en equipo durante las horas del hackathon.' },
        { h: 'Mis hackathones', list: [
          { t: 'LLMthon Legal - Grant Thornton', href: 'https://idal.uv.es/llmthon/jornada/', res: 'ganador' },
          { t: 'Mobility Summit Hackathon 2026', href: 'https://valenciaplaza.com/valenciaplaza/comarca-y-empresa/de-pseudoautopista-a-supermanzanas-el-plan-que-transformaria-el-cami-nou-entre-benetusser-y-silla', res: 'ganador' },
          { t: 'Hackathon ESG (Innova&acción)', href: 'https://innovayaccion.com/esg-hackathon-valencia/', res: 'ganador' },
          { t: 'DataHub 2025 (Baleària)', href: 'https://marinadeempresas.es/reto-balearia-y-sngular-2/', res: 'premio a la innovación' },
          { t: 'Hackathon Schneider Electric', href: 'https://lideratupv.com/event/hackathon-en-schneider-electric-99/', res: '' },
          { t: 'Dream Big UPV 2025', href: 'https://www.upv.es/entidades/ideas/2025/02/20/hackathon-dream-big-upv-2025/', res: '' },
          { t: 'MissionZero 2026 - Jeanologia', href: 'https://casadelalumno.blogs.upv.es/hackathon-missionzero/', res: '' },
          { t: 'BioLynx Open Innovation Competition 2026', href: 'https://www.biolynx.es/open-innovation-competition-valencia/', res: '' },
          { t: 'Quédate 2025 (UPV)', href: 'https://www.upv.es/noticias-upv/noticia-15542-quedate-2025-en.html', res: '' },
        ] },
      ] },
      { title: 'Viajar', paras: [
        'Me encanta viajar. Conocer otras culturas, otros lugares y otras gastronomías me ha impulsado a moverme y lanzarme a ver mundo. Hasta ahora he visitado 15 países ... ¡y los que me quedan!',
        { mapa: true },
        { h: 'Historia', t: 'Cuando visito una ciudad, un monumento o un museo, lo que más me gusta es que me cuenten la historia que hay detrás. Ya no los datos informativos, sino la narrativa que los envuelve. Entre free tours, audioguías y lo que dice Wikipedia, me atiborro de información hasta que me sale por las orejas.' },
        { h: 'Naturaleza', t: 'Pero no solo me gusta viajar a la ciudad. Otra cosa que me encanta es conocer la naturaleza de las zonas a las que viajo. Ya sea playa o montaña, ver paisajes tan distintos a los que acostumbro en España me llena de un asombro y una paz inmensas. Y cuando viajo intento informarme sobre las riquezas naturales del país para hacer alguna ruta o excursión y poder disfrutarlas.' },
        { h: 'Gastronomía', t: 'Y por supuesto, como español de buen comer, una de las cosas que más me gusta de viajar es probar otras gastronomías. Intento probar siempre el core de la gastronomía del país que visito, tocando todos los niveles, desde la comida callejera hasta sus mejores platos de restaurante (aunque intentando que no me sablen, que no soy de oro).' },
        'PD: La foto de esta sección es en el museo Belvedere de Viena, junto con el cuadro de «El beso» de Gustav Klimt, cuya copia ha estado toda mi vida encima del sofá de mi salón.',
      ] },
    ],
    PROJECTS: [
      { title: 'Fibrosis auricular con IA', blurb: 'Redes convolucionales que estiman el grado de fibrosis del tejido auricular a partir de electrogramas, como alternativa a la imagen médica. 225 simulaciones y más de 200.000 electrogramas: la exactitud sube del 71 % al 91 %. Artículo en CASEIB 2025.', tags: ['Deep learning', 'Señales', 'CASEIB 2025'], href: 'https://dialnet.unirioja.es/servlet/articulo?codigo=10695530', link: 'Ver el artículo (Dialnet) →' },
      { title: 'R-HDBSCAN', blurb: 'Variante recursiva de HDBSCAN para obtener clusters locales de grano fino en datos de movilidad de sensores de València y la Comunitat Valenciana (Diputació de València).', tags: ['Clustering', 'Movilidad'], href: '#' },
      { title: 'nódicus', blurb: 'IA, datos y automatización a medida: clasificación automática de averías de camiones (menos de 0,10 € por avería y un 500 % más rápido), informes de visitas comerciales (30 h al mes ahorradas) y visión por computador en farmacia hospitalaria.', tags: ['IA', 'Visión', 'Automatización'], href: 'https://www.nodicus.com', link: 'nodicus.com →' },
      { title: 'Tesla Runner', blurb: 'El juego del dinosaurio de Chrome, pero con un Tesla Roadster propulsado por gas frío. Un solo archivo HTML sin dependencias: rampas gigantes, flips, barrel rolls, leaderboard y controles táctiles.', tags: ['JavaScript', 'Juego', 'Pixel art'], href: 'https://jamarlli.github.io/tesla-runner/', link: 'Jugar →' },
      { title: 'Gaviota 3D', blurb: 'Videojuego en three.js para Gráficos por Computador (máster IARFID, UPV). Una gaviota sobrevuela una ciudad con el único objetivo de hacerle la vida imposible a los peatones.', tags: ['three.js', 'Juego', 'UPV'], href: 'https://proyecto-gpc.vercel.app', link: 'Jugar →' },
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
      { when: '2021 – 2025', what: 'Grado en Ciencia de Datos · Universitat de València', detail: 'Nota media: 9,01 con 6 matrículas de honor. Delegado de la promoción.', honores: { label: 'Matrículas de honor en', items: [{ t: 'Álgebra', href: 'https://www.uv.es/recursos/fatwirepub/guias/36408-CAS-2025-26.pdf' }, { t: 'Fundamentos de la programación', href: 'https://www.uv.es/recursos/fatwirepub/guias/36411-CAS-2025-26.pdf' }, { t: 'Estructuras de datos y algoritmos', href: 'https://www.uv.es/recursos/fatwirepub/guias/36413-CAS-2025-26.pdf' }, { t: 'Programación paralela', href: 'https://www.uv.es/recursos/fatwirepub/guias/36438-CAS-2025-26.pdf' }, { t: 'Internet de las cosas', href: 'https://www.uv.es/recursos/fatwirepub/guias/36422-CAS-2025-26.pdf' }, { t: 'Análisis y procesamiento de audio y voz', href: 'https://www.uv.es/recursos/fatwirepub/guias/36439-CAS-2025-26.pdf' }] } },
      { when: '2023 – 2024', what: 'Erasmus · Sapienza Università di Roma', detail: 'Ciencia de datos. 11 asignaturas con la misma carga en créditos y nota media de 8,95 (7,5 · 7,5 · 8,5 · 9 · 10 · 9,5 · 9,5 · 10 · 7 · 10 · 10).', honores: { label: '3 matrículas de honor en', items: [{ t: 'Bayesian Modelling', href: 'https://elearning.uniroma1.it/theme/continuum/infocourse.php?course=20123&popup=1' }, { t: 'Multilingual Natural Language Processing', href: 'https://sapienzanlp.github.io/' }, { t: 'Big Data Computing', href: 'https://www.diag.uniroma1.it/~becchett/big_data.html' }] } },
      { what: 'Idiomas', items: ['Inglés: Cambridge English First (B2)', 'Valenciano: C1', 'Francés: A2', 'Italiano: nivel medio'] },
    ],
  },
  en: {
    ABOUT: {
      name: 'Javier Martínez Llinares',
      role: 'AI engineer and data scientist · co-founder of nódicus',
      bio: '23 years old · Valencia, Spain. I love learning new things and going deeper into the ones I already know. I look for problems and find solutions with every tool within reach.',
      gustos: ['🏉 Competitive rugby, UV elite athlete', '🎭 Theatre', '⛰️ Mountains', '📚 Reading', '🏕️ Youth leisure monitor (MAT) and first aid'],
      links: [
        { icon: 'linkedin', label: 'LinkedIn', href: 'https://www.linkedin.com/in/javier-martinez-llinares/' },
        { icon: 'github', label: 'GitHub', href: 'https://github.com/Jamarlli' },
        { icon: 'x', label: 'X', href: 'https://x.com/javiermtinez_' },
        { icon: 'nodicus', label: 'nódicus', href: 'https://www.nodicus.com' },
        { icon: 'email', label: 'Email', href: 'mailto:javier.mtinez.llinares@gmail.com' },
      ],
    },
    FOTOS: [
      { title: 'Rugby', paras: [
        'One of my passions is rugby. I started playing in the third year of ESO (in 2017) and I have not stopped since. I play for Club de Rugby San Roque, as a flanker (6/7).',
        { h: 'Respect', t: 'One of the things rugby has instilled in me the most is respect: respect for the referee, the coach, my teammates and my opponents. For example, in rugby players cannot talk to the referee, only the captain can, and he has to do it very politely, because shouting at or insulting the referee means a direct card.' },
        { h: 'Team', t: 'On the other hand, something I consider fundamental about rugby is that it is the team sport par excellence. On the pitch, egos are left behind and we become one unit. In fact, it is one of the few sports with no personal names or shirt numbers. The 15 starting players wear numbers 1 to 15 depending on the position they take. There are no stars, only pieces of a common gear.' },
        'Besides, rugby is a sport for anyone. It does not matter whether you are tall or short, heavy or thin, quick and agile or strong and determined. There will always be a role for you. The forwards (or "fatties", an affectionate nickname for the players from 1 to 8) are the power of the team. They tackle and crash into the other team\'s forwards and create space. And then come the backs (players 9 to 15), who run through that space to break the defensive line and score a try.',
        { h: 'University Sevens', t: 'Rugby has also been with me at university. I spent two years in the University of Valencia rugby sevens team and we won the Valencian university championship (the CADU) both years, two golds. Both years we went to the Spanish University Championship (CEU), and the first year we finished third, with the bronze. And when I went on Erasmus to Rome I also played for the Sapienza sevens team, with which we went to a tournament, the WIUC.' },
      ] },
      { title: 'Hackathons', paras: [
        'Among my many hobbies, one I love is going to hackathons.',
        'For those who do not know them, hackathons are events where teams try to solve a problem in a few hours and present the solution to a jury at the end of the event.',
        { h: 'What I like most', t: 'What I like most about hackathons is that you meet a lot of nice, good people. I have come across very ambitious people, eager to build and to experiment, and that makes my day. I also love facing new and unknown challenges, thinking and challenging myself towards cognitive innovation.' },
        { h: 'The professional side', t: 'On the professional side, it is great because you do networking and meet many companies that bring the problems they have, which lets you see far beyond what you know and understand what is going on in other sectors or niches.' },
        { h: 'My role in the team', t: 'I am very good at leading teams, and also at adapting and playing the role the team needs from me, whether that is taking the reins, delegating or pushing my teammates\' ideas. I am also a very good speaker, and I usually do the final pitches. Thanks to my theatre experience, I really enjoy speaking in front of an audience and trying to convey everything we have built as a team during the hours of the hackathon.' },
        { h: 'My hackathons', list: [
          { t: 'LLMthon Legal - Grant Thornton', href: 'https://idal.uv.es/llmthon/jornada/', res: 'winner' },
          { t: 'Mobility Summit Hackathon 2026', href: 'https://valenciaplaza.com/valenciaplaza/comarca-y-empresa/de-pseudoautopista-a-supermanzanas-el-plan-que-transformaria-el-cami-nou-entre-benetusser-y-silla', res: 'winner' },
          { t: 'ESG Hackathon (Innova&acción)', href: 'https://innovayaccion.com/esg-hackathon-valencia/', res: 'winner' },
          { t: 'DataHub 2025 (Baleària)', href: 'https://marinadeempresas.es/reto-balearia-y-sngular-2/', res: 'innovation award' },
          { t: 'Schneider Electric Hackathon', href: 'https://lideratupv.com/event/hackathon-en-schneider-electric-99/', res: '' },
          { t: 'Dream Big UPV 2025', href: 'https://www.upv.es/entidades/ideas/2025/02/20/hackathon-dream-big-upv-2025/', res: '' },
          { t: 'MissionZero 2026 - Jeanologia', href: 'https://casadelalumno.blogs.upv.es/hackathon-missionzero/', res: '' },
          { t: 'BioLynx Open Innovation Competition 2026', href: 'https://www.biolynx.es/open-innovation-competition-valencia/', res: '' },
          { t: 'Quédate 2025 (UPV)', href: 'https://www.upv.es/noticias-upv/noticia-15542-quedate-2025-en.html', res: '' },
        ] },
      ] },
      { title: 'Travel', paras: [
        'I love travelling. Getting to know other cultures, other places and other cuisines has pushed me to move and go out to see the world. So far I have visited 15 countries ... and counting!',
        { mapa: true },
        { h: 'History', t: 'When I visit a city, a monument or a museum, what I like most is hearing the story behind it. Not the factual data, but the narrative that surrounds it. Between free tours, audio guides and what Wikipedia says, I stuff myself with information until it comes out of my ears.' },
        { h: 'Nature', t: 'But I do not only like travelling to cities. Another thing I love is getting to know the nature of the places I travel to. Whether it is beach or mountains, seeing landscapes so different from what I am used to in Spain fills me with immense wonder and peace. And when I travel I try to find out about the natural treasures of the country so I can do a route or an excursion and enjoy them.' },
        { h: 'Food', t: 'And of course, as a Spaniard who loves good food, one of the things I like most about travelling is trying other cuisines. I always try to taste the core of the cuisine of the country I visit, at every level, from street food to the best restaurant dishes (while trying not to get ripped off, because I am not made of gold).' },
        'PS: The photo in this section was taken at the Belvedere museum in Vienna, next to Gustav Klimt\'s painting "The Kiss", a copy of which has hung above the sofa in my living room all my life.',
      ] },
    ],
    PROJECTS: [
      { title: 'Atrial fibrosis with AI', blurb: 'Convolutional networks that estimate the degree of atrial fibrosis from electrograms, as an alternative to medical imaging. 225 simulations and over 200,000 electrograms: accuracy rises from 71% to 91%. Paper at CASEIB 2025.', tags: ['Deep learning', 'Signals', 'CASEIB 2025'], href: 'https://dialnet.unirioja.es/servlet/articulo?codigo=10695530', link: 'Read the paper (Dialnet) →' },
      { title: 'R-HDBSCAN', blurb: 'A recursive variant of HDBSCAN to get fine-grained local clusters from sensor mobility data across Valencia and the Valencian Community (Diputació de València).', tags: ['Clustering', 'Mobility'], href: '#' },
      { title: 'nódicus', blurb: 'Custom AI, data and automation: automatic classification of truck faults (under €0.10 per fault and 500% faster), sales visit reports (30 hours a month saved) and computer vision in hospital pharmacy.', tags: ['AI', 'Vision', 'Automation'], href: 'https://www.nodicus.com', link: 'nodicus.com →' },
      { title: 'Tesla Runner', blurb: 'The Chrome dinosaur game, but with a Tesla Roadster running on cold-gas thrusters. A single dependency-free HTML file: giant ramps, flips, barrel rolls, a leaderboard and touch controls.', tags: ['JavaScript', 'Game', 'Pixel art'], href: 'https://jamarlli.github.io/tesla-runner/', link: 'Play →' },
      { title: 'Seagull 3D', blurb: 'A three.js game for Computer Graphics (IARFID master, UPV). A seagull flies over a city with one goal: making life impossible for the pedestrians.', tags: ['three.js', 'Game', 'UPV'], href: 'https://proyecto-gpc.vercel.app', link: 'Play →' },
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
      { when: '2021 – 2025', what: 'BSc in Data Science · Universitat de València', detail: 'GPA: 9.01 with 6 honours distinctions. Class representative.', honores: { label: 'Honours distinctions in', items: [{ t: 'Algebra', href: 'https://www.uv.es/recursos/fatwirepub/guias/36408-CAS-2025-26.pdf' }, { t: 'Fundamentals of programming', href: 'https://www.uv.es/recursos/fatwirepub/guias/36411-CAS-2025-26.pdf' }, { t: 'Data structures and algorithms', href: 'https://www.uv.es/recursos/fatwirepub/guias/36413-CAS-2025-26.pdf' }, { t: 'Parallel programming', href: 'https://www.uv.es/recursos/fatwirepub/guias/36438-CAS-2025-26.pdf' }, { t: 'Internet of things', href: 'https://www.uv.es/recursos/fatwirepub/guias/36422-CAS-2025-26.pdf' }, { t: 'Audio and speech analysis and processing', href: 'https://www.uv.es/recursos/fatwirepub/guias/36439-CAS-2025-26.pdf' }] } },
      { when: '2023 – 2024', what: 'Erasmus · Sapienza Università di Roma', detail: 'Data science. 11 courses with equal credit weight and an average grade of 8.95 (7.5 · 7.5 · 8.5 · 9 · 10 · 9.5 · 9.5 · 10 · 7 · 10 · 10).', honores: { label: '3 honours distinctions in', items: [{ t: 'Bayesian Modelling', href: 'https://elearning.uniroma1.it/theme/continuum/infocourse.php?course=20123&popup=1' }, { t: 'Multilingual Natural Language Processing', href: 'https://sapienzanlp.github.io/' }, { t: 'Big Data Computing', href: 'https://www.diag.uniroma1.it/~becchett/big_data.html' }] } },
      { what: 'Languages', items: ['English: Cambridge English First (B2)', 'Valencian: C1', 'French: A2', 'Italian: intermediate'] },
    ],
  },
};

export const { ABOUT, PROJECTS, EXPERIENCE, EDUCATION, FOTOS } = CONTENIDO[LANG];
