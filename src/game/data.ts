export interface Woman {
  id: string;
  name: string;
  alias?: string;
  years: string;
  place: string;
  role: string;
  fact: string;
  tint: string;
}

/**
 * 17 mujeres históricas de la Monarquía Hispánica (siglos XVI–XVIII),
 * repartidas a lo largo de las 5 fases de la campaña.
 */
export const WOMEN: Woman[] = [
  {
    id: "galindo",
    name: "Beatriz Galindo",
    alias: "La Latina",
    years: "c. 1465–1535",
    place: "Salamanca",
    role: "Humanista",
    fact: "Maestra de latín de Isabel la Católica y de sus hijas. Fundó en Madrid el hospital que dio nombre al barrio de La Latina.",
    tint: "#27456f",
  },
  {
    id: "pacheco",
    name: "María Pacheco",
    years: "c. 1496–1531",
    place: "Granada · Toledo",
    role: "Líder comunera",
    fact: "Tras la ejecución de su marido, Juan de Padilla, dirigió durante meses la resistencia comunera de Toledo. Murió exiliada en Oporto.",
    tint: "#7a1f2b",
  },
  {
    id: "sigea",
    name: "Luisa Sigea",
    years: "c. 1522–1560",
    place: "Tarancón",
    role: "Humanista políglota",
    fact: "Escribió al papa Paulo III una carta en cinco lenguas, entre ellas latín, griego y hebreo. Fue maestra en la corte de Portugal.",
    tint: "#2f6b56",
  },
  {
    id: "teresa",
    name: "Teresa de Jesús",
    years: "1515–1582",
    place: "Ávila",
    role: "Escritora y reformadora",
    fact: "Reformó el Carmelo, fundó diecisiete conventos y escribió el «Libro de la vida» bajo la mirada de la Inquisición. Primera doctora de la Iglesia (1970).",
    tint: "#6b4a2b",
  },
  {
    id: "anguissola",
    name: "Sofonisba Anguissola",
    years: "c. 1532–1625",
    place: "Cremona · Madrid",
    role: "Pintora de corte",
    fact: "Llegó en 1559 a la corte de Felipe II como dama de Isabel de Valois, a quien enseñó a pintar, y retrató a la familia real.",
    tint: "#8a3d6b",
  },
  {
    id: "sabuco",
    name: "Oliva Sabuco",
    years: "1562–s. XVII",
    place: "Alcaraz",
    role: "Filosofía y medicina",
    fact: "Con su nombre se publicó en 1587 la «Nueva filosofía de la naturaleza del hombre». Su padre reclamó después la autoría, que aún hoy se debate.",
    tint: "#27456f",
  },
  {
    id: "barreto",
    name: "Isabel Barreto",
    years: "c. 1567–1612",
    place: "Mar del Sur",
    role: "Navegante",
    fact: "Al morir Álvaro de Mendaña en 1595 quedó al mando de la expedición del Pacífico y la llevó hasta Manila. Se la recuerda como la primera almirante.",
    tint: "#1f5a70",
  },
  {
    id: "isabelclara",
    name: "Isabel Clara Eugenia",
    years: "1566–1633",
    place: "Segovia · Bruselas",
    role: "Gobernante",
    fact: "Hija de Felipe II. Fue soberana de los Países Bajos junto al archiduque Alberto y, tras enviudar en 1621, su gobernadora.",
    tint: "#7a1f2b",
  },
  {
    id: "erauso",
    name: "Catalina de Erauso",
    alias: "La Monja Alférez",
    years: "c. 1592–1650",
    place: "San Sebastián",
    role: "Soldado y viajera",
    fact: "Huyó del convento y vivió como soldado en Chile y Perú. Según la tradición, el papa Urbano VIII le permitió seguir vistiendo de hombre.",
    tint: "#3d4a2b",
  },
  {
    id: "zayas",
    name: "María de Zayas",
    years: "1590–d. 1647",
    place: "Madrid",
    role: "Novelista",
    fact: "En sus «Novelas amorosas y ejemplares» (1637) y «Desengaños amorosos» (1647) denunció que a las mujeres se les negaran los libros y el estudio.",
    tint: "#8a2b3d",
  },
  {
    id: "caro",
    name: "Ana Caro de Mallén",
    years: "¿1601?–1646",
    place: "Sevilla",
    role: "Dramaturga",
    fact: "Cobró por sus relaciones de fiestas y sus comedias: fue una de las primeras escritoras profesionales. Suya es «Valor, agravio y mujer».",
    tint: "#6b2b6b",
  },
  {
    id: "marcela",
    name: "Sor Marcela de San Félix",
    years: "1605–1687",
    place: "Toledo · Madrid",
    role: "Poeta y dramaturga",
    fact: "Hija de Lope de Vega y monja trinitaria. Escribió coloquios espirituales, loas y poemas que se representaban dentro de su convento.",
    tint: "#2b4a6b",
  },
  {
    id: "roldana",
    name: "Luisa Roldán",
    alias: "La Roldana",
    years: "1652–1706",
    place: "Sevilla",
    role: "Escultora",
    fact: "Primera escultora documentada en España. Fue nombrada escultora de cámara por Carlos II en 1692 y confirmada por Felipe V.",
    tint: "#8a5a1f",
  },
  {
    id: "sorjuana",
    name: "Sor Juana Inés de la Cruz",
    years: "1648/1651–1695",
    place: "Nueva España",
    role: "Poeta y pensadora",
    fact: "Autora de «Primero sueño». En la «Respuesta a sor Filotea» (1691) defendió el derecho de las mujeres a estudiar y a enseñar.",
    tint: "#1f3d6b",
  },
  {
    id: "bastidas",
    name: "Micaela Bastidas",
    years: "1744–1781",
    place: "Virreinato del Perú",
    role: "Líder rebelde",
    fact: "Estratega y organizadora de la gran rebelión de Túpac Amaru II (1780). Fue ejecutada en la plaza del Cuzco en 1781.",
    tint: "#7a3d1f",
  },
  {
    id: "amar",
    name: "Josefa Amar y Borbón",
    years: "1749–1833",
    place: "Zaragoza",
    role: "Ilustrada",
    fact: "Publicó el «Discurso en defensa del talento de las mujeres» (1786) y un tratado sobre su educación física y moral (1790).",
    tint: "#2f6b56",
  },
  {
    id: "guzman",
    name: "María Isidra de Guzmán",
    alias: "La doctora de Alcalá",
    years: "1767–1803",
    place: "Madrid",
    role: "Doctora en Filosofía",
    fact: "En 1785, con diecisiete años, se doctoró en la Universidad de Alcalá: fue la primera mujer con ese grado en una universidad española.",
    tint: "#27456f",
  },
];

export const WOMAN_BY_ID: Record<string, Woman> = Object.fromEntries(WOMEN.map((w) => [w.id, w]));

/* ================================================================== */
/* 10 Reliquias y Saberes Históricos (2 por fase)                     */
/* ================================================================== */

export type RelicKind =
  | "press"
  | "frog"
  | "turnstile"
  | "easel"
  | "astrolabe"
  | "compass"
  | "maskProp"
  | "chisel"
  | "armillary"
  | "cap";

export interface Relic {
  id: string;
  stageIndex: number;
  kind: RelicKind;
  name: string;
  era: string;
  note: string;
}

export const RELICS: Relic[] = [
  {
    id: "imprenta",
    stageIndex: 0,
    kind: "press",
    name: "Imprenta de viudas",
    era: "Siglo XVI · Castilla y Sevilla",
    note: "Muchas viudas heredaban y dirigían talleres tipográficos con su propio pie de imprenta, publicando gramáticas, medicina y literatura.",
  },
  {
    id: "rana",
    stageIndex: 0,
    kind: "frog",
    name: "La Rana de Salamanca",
    era: "c. 1529 · Fachada plateresca",
    note: "Aunque la Universidad cerraba sus aulas a las mujeres, humanistas como Beatriz Galindo y Luisa Sigea dominaban el latín y enseñaban en la corte.",
  },
  {
    id: "torno",
    stageIndex: 1,
    kind: "turnstile",
    name: "El torno y la biblioteca",
    era: "Siglos XVI–XVII · Conventos",
    note: "Para muchas mujeres, el convento fue el único espacio con acceso a bibliotecas, música, escritura y gestión propia fuera de la tutela marital.",
  },
  {
    id: "caballete",
    stageIndex: 1,
    kind: "easel",
    name: "Caballete de corte",
    era: "1559 · Corte de Felipe II",
    note: "Los gremios excluían a las pintoras de los talleres urbanos; artistas como Sofonisba Anguissola crearon su obra como damas en palacio.",
  },
  {
    id: "astrolabio",
    stageIndex: 2,
    kind: "astrolabe",
    name: "Astrolabio del Mar del Sur",
    era: "1595 · Ruta de Manila",
    note: "En el Galeón de Manila también navegaron colonas, mercaderes y gobernantas; Isabel Barreto asumió el mando de la expedición tras morir Mendaña.",
  },
  {
    id: "cartas_indias",
    stageIndex: 2,
    kind: "compass",
    name: "Cartas de Indias",
    era: "Siglos XVI–XVII · Carrera de Indias",
    note: "Miles de cartas privadas cruzaron el océano escritas por mujeres que administraban haciendas, comercios y familias entre España y América.",
  },
  {
    id: "cazuela",
    stageIndex: 3,
    kind: "maskProp",
    name: "La cazuela del corral",
    era: "Siglo XVII · Madrid y Sevilla",
    note: "En los corrales de comedias las mujeres tenían galería propia («la cazuela»), desde donde juzgaban estrenos, incluidos los de dramaturgas como Ana Caro.",
  },
  {
    id: "gubia",
    stageIndex: 3,
    kind: "chisel",
    name: "Gubia de Escultora Real",
    era: "1692 · Taller de La Roldana",
    note: "Luisa Roldán firmaba sus tallas y barros policromados y logró el cargo de Escultora de Cámara de Carlos II, un hito frente a los gremios cerrados.",
  },
  {
    id: "esfera",
    stageIndex: 4,
    kind: "armillary",
    name: "Esfera armilar de Sor Juana",
    era: "c. 1690 · Ciudad de México",
    note: "En su celda novohispana, Sor Juana reunió miles de libros e instrumentos musicales y astronómicos, defendiendo que las mujeres también pueden filosofar.",
  },
  {
    id: "birrete",
    stageIndex: 4,
    kind: "cap",
    name: "Birrete doctoral de Alcalá",
    era: "1785 · Ilustración hispana",
    note: "En pleno debate ilustrado sobre la educación femenina, María Isidra de Guzmán obtuvo por dispensa real el primer doctorado universitario de España.",
  },
];

export const RELIC_BY_ID: Record<string, Relic> = Object.fromEntries(RELICS.map((r) => [r.id, r]));

/* ================================================================== */
/* Fases de la Campaña y Duelos de Ingenio (estilo Alex Kidd)         */
/* ================================================================== */

export type StageTheme = "salamanca" | "avila" | "mar" | "corral" | "indice";

export interface BossDuel {
  question: string;
  options: [string, string, string];
  correctIndex: number;
  explanation: string;
}

export interface StageMeta {
  index: number;
  roman: string;
  year: string;
  place: string;
  title: string;
  theme: StageTheme;
  /** Coordenadas geográficas reales (0..100) sobre bg-map.jpg */
  mapX: number;
  mapY: number;
  /** Orientación de la etiqueta en el mapa para que nunca se solapen */
  labelPos: "top" | "right" | "bottom" | "left";
  story: string;
  tip: string;
  womenIds: string[];
  relicIds: string[];
  bossName: string;
  bossTitle: string;
  bossTaunt: string;
  bossDuel: BossDuel;
  outroSpeaker: string;
  outroQuote: string;
  palette: {
    skyTop: string;
    skyMid: string;
    skyBot: string;
    far: string;
    mid: string;
    stone: string;
    stoneDark: string;
    stoneLight: string;
    accent: string;
    hazard: string;
  };
}

export const STAGES: StageMeta[] = [
  {
    index: 0,
    roman: "I",
    year: "1515",
    place: "Salamanca",
    title: "Los Claustros del Latín",
    theme: "salamanca",
    mapX: 80,
    mapY: 16,
    labelPos: "left",
    story:
      "El Gran Censor ha mandado tapiar las imprentas para borrar de la historia a las mujeres sabias. Con su pluma viva, la joven aprendiz Clara cruza el puente romano y los claustros dorados de Salamanca para rescatar los primeros pliegos.",
    tip: "Rompe bloques agrietados con tu Pluma, golpea los «?» y descubre las Reliquias Históricas iluminadas.",
    womenIds: ["galindo", "pacheco", "sigea"],
    relicIds: ["imprenta", "rana"],
    bossName: "El Alguacil Mayor",
    bossTitle: "Guardián del Claustro",
    bossTaunt: "¡Ninguna mujer pasará este arco con libros en la mano!",
    bossDuel: {
      question: "¿Con qué apodo fue conocida la humanista Beatriz Galindo, maestra de latín en la corte?",
      options: ["La Latina", "La Roldana", "La Almirante"],
      correctIndex: 0,
      explanation: "Beatriz Galindo fue llamada «La Latina» por su dominio del latín; su hospital dio nombre al famoso barrio madrileño.",
    },
    outroSpeaker: "Beatriz Galindo",
    outroQuote:
      "«Bien golpeado, Clara. El latín y el saber no tienen dueño: sigue hacia las murallas de Ávila y Toledo antes de que cierren los caminos.»",
    palette: {
      skyTop: "#4d78a6",
      skyMid: "#99bed9",
      skyBot: "#f2dfb9",
      far: "#c6a574",
      mid: "#b18952",
      stone: "#d8b47c",
      stoneDark: "#8f6534",
      stoneLight: "#f4dfba",
      accent: "#7a1f2b",
      hazard: "#c2262f",
    },
  },
  {
    index: 1,
    roman: "II",
    year: "1565",
    place: "Ávila y Toledo",
    title: "Murallas y Claustros",
    theme: "avila",
    mapX: 86,
    mapY: 20,
    labelPos: "top",
    story:
      "Al caer el crepúsculo sobre las murallas de Ávila y el alcázar de Toledo, las campanas anuncian una redada. Clara escala la torre del Carmelo entre braseros y losas frágiles para salvar los cuadernos de escritoras y pintoras.",
    tip: "Cuidado con los bloques de calavera y las losas que se desmoronan al pisarlas.",
    womenIds: ["teresa", "anguissola", "sabuco"],
    relicIds: ["torno", "caballete"],
    bossName: "El Inquisidor de Lacre",
    bossTitle: "Señor de los Sellos",
    bossTaunt: "¡Vuestros cuadernos arderán en los braseros de la torre!",
    bossDuel: {
      question: "¿Qué espacio ofreció a muchas mujeres de los siglos XVI y XVII acceso a bibliotecas y escritura?",
      options: ["Los gremios de armas", "Los conventos", "Las lonjas de puerto"],
      correctIndex: 1,
      explanation: "Los conventos fueron espacios decisivos donde muchas mujeres pudieron leer, escribir, componer música y gestionar sus propios asuntos.",
    },
    outroSpeaker: "Teresa de Jesús",
    outroQuote:
      "«La pluma libre vence al miedo. Un galeón zarpa rumbo al Mar del Sur: cruza el océano y protege allí nuestra memoria.»",
    palette: {
      skyTop: "#361e3e",
      skyMid: "#8d3c47",
      skyBot: "#eba365",
      far: "#693647",
      mid: "#4e2835",
      stone: "#9b8075",
      stoneDark: "#533d38",
      stoneLight: "#d1baad",
      accent: "#d68d2a",
      hazard: "#f06a1c",
    },
  },
  {
    index: 2,
    roman: "III",
    year: "1595",
    place: "Mar del Sur",
    title: "Galeón hacia Manila",
    theme: "mar",
    mapX: 11,
    mapY: 48,
    labelPos: "right",
    story:
      "En mitad del Pacífico, el viento alisio hincha las velas del galeón Santa Isabel. Clara salta entre cubiertas, mástiles y poleas sobre el mar turquesa para defender las cartas náuticas y a las viajeras que cruzaron los océanos.",
    tip: "Aprovecha las poleas móviles sobre el mar y trepa a las cofas para encontrar los retratos.",
    womenIds: ["barreto", "isabelclara", "erauso"],
    relicIds: ["astrolabio", "cartas_indias"],
    bossName: "El Capitán del Veto",
    bossTitle: "Corsario de la Censura",
    bossTaunt: "¡Por la borda irán tus astrolabios y tus retratos!",
    bossDuel: {
      question: "¿Hasta qué puerto llevó Isabel Barreto la expedición del Pacífico en 1595 al mando de la flota?",
      options: ["Venecia", "Manila", "Lisboa"],
      correctIndex: 1,
      explanation: "Tras fallecer Álvaro de Mendaña, Isabel Barreto tomó el mando de la expedición y consiguió conducir la nave hasta Manila.",
    },
    outroSpeaker: "Isabel Barreto",
    outroQuote:
      "«Quien gobierna un navío en la tormenta no teme a un sello de cera. Pon rumbo de vuelta a los corrales de Madrid y Sevilla.»",
    palette: {
      skyTop: "#1f5382",
      skyMid: "#4d93bd",
      skyBot: "#cbe4ea",
      far: "#276487",
      mid: "#1b4666",
      stone: "#966137",
      stoneDark: "#563218",
      stoneLight: "#c99262",
      accent: "#e2b243",
      hazard: "#e04826",
    },
  },
  {
    index: 3,
    roman: "IV",
    year: "1650",
    place: "Madrid y Sevilla",
    title: "Corral de Comedias",
    theme: "corral",
    mapX: 81,
    mapY: 26,
    labelPos: "bottom",
    story:
      "Bajo las arañas de velas y los telones carmesíes del Corral de Comedias, las novelas, comedias y tallas de las creadoras del Siglo de Oro corren peligro. Clara salta por galerías y tramoyas antes de que caiga el telón.",
    tip: "Sube a las tramoyas móviles y desciende por las tablas pulsando Abajo + Saltar.",
    womenIds: ["zayas", "caro", "marcela", "roldana"],
    relicIds: ["cazuela", "gubia"],
    bossName: "El Crítico Enmascarado",
    bossTitle: "Sombra del Escenario",
    bossTaunt: "¡Silencio en la sala! ¡Esta función se clausura esta noche!",
    bossDuel: {
      question: "¿Cómo se llamaba la galería desde la que las mujeres veían y juzgaban las obras en los corrales de comedias?",
      options: ["La cazuela", "El adarve", "El púlpito"],
      correctIndex: 0,
      explanation: "En los corrales de comedias, las espectadoras ocupaban «la cazuela», famosa por su criterio exigente ante cada estreno.",
    },
    outroSpeaker: "María de Zayas",
    outroQuote:
      "«Si nos negaron las aulas, tomamos el escenario y el cincel. Ya solo queda el gran archivo entre Cuzco, México y Alcalá: ábrelo de par en par.»",
    palette: {
      skyTop: "#240d19",
      skyMid: "#5b1929",
      skyBot: "#a64538",
      far: "#3e1320",
      mid: "#591d2b",
      stone: "#8a5a3c",
      stoneDark: "#4a2b1c",
      stoneLight: "#c99869",
      accent: "#f0cf73",
      hazard: "#d9323a",
    },
  },
  {
    index: 4,
    roman: "V",
    year: "1785",
    place: "Cuzco y Alcalá",
    title: "El Gran Índice",
    theme: "indice",
    mapX: 31,
    mapY: 57,
    labelPos: "right",
    story:
      "La cámara definitiva: el archivo astronómico y monumental donde el Gran Censor encierra siglos de talento de América y España. Desde la rebeldía del Cuzco y los libros de Nueva España hasta la cátedra de Alcalá, toca escribir el capítulo final.",
    tip: "Recoge la Tinta de Oro en la antesala y responde con agudeza en el duelo contra el Gran Censor.",
    womenIds: ["sorjuana", "bastidas", "amar", "guzman"],
    relicIds: ["esfera", "birrete"],
    bossName: "El Gran Censor del Índice",
    bossTitle: "Archivero del Silencio",
    bossTaunt: "¡Tres siglos bajo llave y una aprendiz pretende abrir mis puertas! ¡Jamás!",
    bossDuel: {
      question: "¿Qué escritora defendió el derecho de las mujeres a estudiar en la célebre «Respuesta a sor Filotea» (1691)?",
      options: ["María Pacheco", "Sor Juana Inés de la Cruz", "Isabel Clara Eugenia"],
      correctIndex: 1,
      explanation: "En 1691, Sor Juana Inés de la Cruz escribió en Nueva España la «Respuesta a sor Filotea», uno de los alegatos intelectuales más brillantes del Barroco.",
    },
    outroSpeaker: "Sor Juana Inés de la Cruz",
    outroQuote:
      "«Rompiste el sello, Clara. Ahora cada página respira y nuestros nombres vuelven a escucharse con voz propia a ambos lados del océano.»",
    palette: {
      skyTop: "#12152b",
      skyMid: "#24305c",
      skyBot: "#4c5280",
      far: "#1d2447",
      mid: "#2d3561",
      stone: "#68627a",
      stoneDark: "#363247",
      stoneLight: "#aba2bf",
      accent: "#f0cf73",
      hazard: "#e03a3a",
    },
  },
];

export const STORY_PROLOGUE =
  "Siglos XVI al XVIII. Cuando el Gran Censor ordena sellar los libros y borrar los nombres de escritoras, artistas, navegantes y sabias, la aprendiz Clara toma su pluma y recorre cinco escenarios históricos para rescatar sus voces y reliquias.";

export const STORY_EPILOGUE =
  "El sello del Gran Índice se ha hecho añicos. Las páginas vuelan sobre Salamanca, Ávila, el Mar del Sur, Madrid, Nueva España, el Cuzco y Alcalá. Gracias a tu viaje, la crónica de las mujeres de la Edad Moderna hispana llega por fin a la imprenta.";
