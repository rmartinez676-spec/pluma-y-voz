import { STAGES } from "./data";

export const TILE = 32;
export const LEVEL_ROWS = 14;

/**
 * Códigos de baldosa:
 * 0 = aire
 * 1 = piedra/suelo sólido
 * 2 = galería de madera (atravesable desde abajo; Abajo+Saltar para bajar)
 * 3 = bloque agrietado (rompible con Pluma o salto desde abajo)
 * 4 = bloque «?» (contiene poder o monedas; pasa a 6 al golpearse)
 * 5 = bloque de calavera/sello (trampa al estilo Alex Kidd: libera un sello fantasma y monedas)
 * 6 = bloque «?» ya usado
 * 7 = losa que se desmorona al pisarla
 * 8 = brasero/llamas (daña 1 corazón)
 * 9 = columna decorativa sólida
 */
export type TileId = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type LootType = "coins" | "heart" | "shield" | "goldQuill";

export type EnemyType = "alguacil" | "crow" | "censor" | "flame" | "piquero" | "mask";

export interface EnemySpawn {
  type: EnemyType;
  tx: number;
  ty: number;
  patrolMin?: number;
  patrolMax?: number;
}

export interface MovingPlatformDef {
  x1: number; // en baldosas
  y1: number;
  x2: number;
  y2: number;
  widthTiles: number;
  speed: number; // ciclos/s o px/s
}

export interface PortraitSpawn {
  womanId: string;
  tx: number;
  ty: number;
}

export interface RelicSpawn {
  relicId: string;
  tx: number;
  ty: number;
}

export type PropKind =
  | "arch"
  | "banner"
  | "lantern"
  | "stainedGlass"
  | "helm"
  | "cannon"
  | "burgundyFlag"
  | "theaterBanner"
  | "bustPedestal"
  | "bookshelf"
  | "cuzcoSun"
  | "telescope";

export interface PropSpawn {
  kind: PropKind;
  tx: number;
  ty: number;
}

export interface CoinSpawn {
  tx: number;
  ty: number;
}

export interface BossDef {
  stageIndex: number;
  arenaLeftTile: number;
  arenaRightTile: number;
  triggerTile: number;
  spawnTx: number;
  spawnTy: number;
  maxHp: number;
}

export interface LevelData {
  stageIndex: number;
  cols: number;
  rows: number;
  tiles: Uint8Array;
  loot: Map<number, LootType>;
  spawn: { tx: number; ty: number };
  checkpoint: { tx: number; ty: number };
  coins: CoinSpawn[];
  portraits: PortraitSpawn[];
  relics: RelicSpawn[];
  props: PropSpawn[];
  enemies: EnemySpawn[];
  platforms: MovingPlatformDef[];
  boss: BossDef;
  /** Si el fondo inferior es agua (Mar del Sur) o vacío */
  hasWater: boolean;
}

class Builder {
  cols: number;
  rows = LEVEL_ROWS;
  tiles: Uint8Array;
  loot = new Map<number, LootType>();
  coins: CoinSpawn[] = [];
  portraits: PortraitSpawn[] = [];
  relics: RelicSpawn[] = [];
  props: PropSpawn[] = [];
  enemies: EnemySpawn[] = [];
  platforms: MovingPlatformDef[] = [];

  constructor(cols: number) {
    this.cols = cols;
    this.tiles = new Uint8Array(cols * this.rows);
  }

  idx(tx: number, ty: number): number {
    return ty * this.cols + tx;
  }

  set(tx: number, ty: number, id: TileId): void {
    if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return;
    this.tiles[this.idx(tx, ty)] = id;
  }

  fill(x0: number, y0: number, x1: number, y1: number, id: TileId): void {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) this.set(x, y, id);
    }
  }

  /** Suelo continuo desde fila `topRow` hasta el fondo */
  ground(x0: number, x1: number, topRow = 11): void {
    this.fill(x0, topRow, x1, this.rows - 1, 1);
  }

  /** Plataforma de madera atravesable */
  plat(x0: number, x1: number, y: number): void {
    this.fill(x0, y, x1, y, 2);
  }

  /** Losas que se desmoronan */
  crumble(x0: number, x1: number, y: number): void {
    this.fill(x0, y, x1, y, 7);
  }

  /** Bloque «?» con botín concreto */
  mystery(tx: number, ty: number, loot: LootType = "coins"): void {
    this.set(tx, ty, 4);
    this.loot.set(this.idx(tx, ty), loot);
  }

  /** Bloque agrietado rompible */
  brick(tx: number, ty: number): void {
    this.set(tx, ty, 3);
  }

  /** Bloque de calavera (trampa) */
  skull(tx: number, ty: number): void {
    this.set(tx, ty, 5);
  }

  /** Braseros/llamas sobre suelo */
  spikes(x0: number, x1: number, y: number): void {
    this.fill(x0, y, x1, y, 8);
  }

  /** Muro rompible vertical (estilo Alex Kidd) */
  brickWall(tx: number, yTop: number, yBot: number): void {
    this.fill(tx, yTop, tx, yBot, 3);
  }

  /** Hilera horizontal de monedas */
  coinRow(x0: number, x1: number, y: number): void {
    for (let x = x0; x <= x1; x++) this.coins.push({ tx: x, ty: y });
  }

  /** Arco de monedas que guía un salto */
  coinArc(xStart: number, peakY: number, span = 4): void {
    for (let i = 0; i <= span; i++) {
      const k = Math.abs(i - span / 2) / (span / 2);
      const y = peakY + Math.round(k * k * 1.4);
      this.coins.push({ tx: xStart + i, ty: y });
    }
  }

  portrait(womanId: string, tx: number, ty: number): void {
    this.portraits.push({ womanId, tx, ty });
  }

  relic(relicId: string, tx: number, ty: number): void {
    this.relics.push({ relicId, tx, ty });
  }

  prop(kind: PropKind, tx: number, ty: number): void {
    this.props.push({ kind, tx, ty });
  }

  enemy(type: EnemyType, tx: number, ty: number, patrolMin?: number, patrolMax?: number): void {
    this.enemies.push({ type, tx, ty, patrolMin, patrolMax });
  }

  moving(x1: number, y1: number, x2: number, y2: number, widthTiles = 3, speed = 64): void {
    this.platforms.push({ x1, y1, x2, y2, widthTiles, speed });
  }

  /** Arena de jefe estándar con suelo firme, paredes laterales y 2 balcones tácticos */
  arena(leftTile: number, rightTile: number): void {
    this.ground(leftTile - 1, rightTile + 1, 11);
    // Pared derecha cerrada
    this.fill(rightTile, 0, rightTile + 1, 10, 9);
    // Balcones tácticos para esquivar y contraatacar
    this.plat(leftTile + 3, leftTile + 6, 8);
    this.plat(rightTile - 7, rightTile - 4, 8);
  }
}

/* ================================================================== */
/* FASE 1: SALAMANCA (1515) — Los Claustros del Latín                 */
/* ================================================================== */

function buildStage1(): LevelData {
  const cols = 134;
  const b = new Builder(cols);
  const women = STAGES[0].womenIds; // galindo, pacheco, sigea

  // Muro inicial a la izquierda
  b.fill(0, 0, 0, 13, 9);

  // --- Tramo 1 (0..28): Patio luminoso, acción en los primeros 5 segundos ---
  b.ground(0, 26, 11);
  b.coinRow(4, 7, 10);
  b.brick(8, 8);
  b.mystery(9, 8, "goldQuill"); // ¡Pluma de Oro temprana para que se sienta genial!
  b.brick(10, 8);
  // Muro de cajas agrietadas estilo Alex Kidd para romper a golpes
  b.brickWall(15, 8, 10);
  b.brick(16, 10);
  b.coinRow(16, 18, 9);
  b.enemy("alguacil", 20, 10, 17, 25);
  // Balcón superior con monedas
  b.plat(18, 24, 8);
  b.coinRow(19, 23, 7);

  // Primer hueco sencillo (3 baldosas) con arco de monedas
  b.coinArc(26, 8, 4);

  // --- Tramo 2 (30..58): Claustro a dos alturas + Retrato 1 (Beatriz Galindo) ---
  b.ground(30, 56, 11);
  // Galería alta
  b.plat(32, 42, 8);
  b.enemy("alguacil", 37, 7, 32, 42);
  b.mystery(35, 5, "coins");
  b.mystery(39, 5, "shield");
  // Alcoba inferior cerrada con ladrillos que esconde el retrato de Beatriz Galindo
  b.fill(43, 8, 49, 8, 1);
  b.brickWall(43, 9, 10);
  b.portrait(women[0], 46, 10); // Beatriz Galindo
  b.coinRow(45, 47, 9);
  b.enemy("alguacil", 35, 10, 31, 42);
  // Escalera de piedra + cuervo de tinta
  b.ground(51, 56, 9);
  b.enemy("crow", 54, 5);
  b.coinRow(52, 55, 8);

  // --- Tramo 3 (57..68): Arco y plataforma móvil sobre callejón ---
  b.moving(58, 9, 64, 9, 3, 55);
  b.coinRow(60, 63, 6);
  // Retrato 2 (María Pacheco) en un tejadillo alto accesible desde la plataforma móvil
  b.plat(59, 64, 6);
  b.portrait(women[1], 62, 5);

  // --- Farol de control (68..73) ---
  b.ground(67, 75, 11);
  b.mystery(71, 8, "heart");

  // --- Tramo 4 (76..111): Barrio de la Imprenta + Retrato 3 (Luisa Sigea) ---
  b.ground(76, 88, 11);
  b.enemy("censor", 84, 10, 79, 87);
  b.plat(78, 83, 8);
  b.brick(80, 5);
  b.mystery(81, 5, "coins");
  b.brick(82, 5);
  // Pequeño foso (3 baldosas) con monedas
  b.coinArc(88, 8, 4);
  b.ground(92, 109, 11);
  b.ground(96, 101, 9);
  b.enemy("alguacil", 98, 8, 96, 101);
  b.enemy("crow", 104, 5);
  // Galería alta con el tercer retrato (Luisa Sigea)
  b.plat(98, 106, 6);
  b.brickWall(102, 4, 5);
  b.portrait(women[2], 105, 5);
  b.coinRow(99, 101, 5);
  // Pequeño reto con bloque de calavera opcional
  b.skull(94, 8);
  b.mystery(107, 8, "goldQuill");

  // Reliquias históricas y escenografía de Salamanca
  b.relic("imprenta", 22, 10); // Imprenta de viudas en el patio inicial
  b.relic("rana", 93, 10); // La Rana de Salamanca en la fachada plateresca
  b.prop("arch", 5, 10);
  b.prop("banner", 12, 10);
  b.prop("lantern", 24, 10);
  b.prop("arch", 34, 10);
  b.prop("banner", 53, 8);
  b.prop("lantern", 73, 10);
  b.prop("arch", 80, 10);
  b.prop("banner", 112, 10);
  b.prop("arch", 123, 10);

  // Antesala y Arena del Jefe: El Alguacil Mayor
  b.ground(110, 114, 11);
  b.arena(115, 132);

  return {
    stageIndex: 0,
    cols,
    rows: LEVEL_ROWS,
    tiles: b.tiles,
    loot: b.loot,
    spawn: { tx: 2, ty: 10 },
    checkpoint: { tx: 69, ty: 10 },
    coins: b.coins,
    portraits: b.portraits,
    relics: b.relics,
    props: b.props,
    enemies: b.enemies,
    platforms: b.platforms,
    boss: {
      stageIndex: 0,
      arenaLeftTile: 115,
      arenaRightTile: 132,
      triggerTile: 117,
      spawnTx: 128,
      spawnTy: 10,
      maxHp: 5,
    },
    hasWater: false,
  };
}

/* ================================================================== */
/* FASE 2: ÁVILA Y TOLEDO (1565) — Murallas y Claustros               */
/* ================================================================== */

function buildStage2(): LevelData {
  const cols = 138;
  const b = new Builder(cols);
  const women = STAGES[1].womenIds; // teresa, anguissola, sabuco

  b.fill(0, 0, 0, 13, 9);

  // --- Tramo 1 (0..26): Adarve al atardecer con braseros y losas frágiles ---
  b.ground(0, 14, 11);
  b.coinRow(4, 7, 10);
  b.mystery(8, 8, "shield");
  b.enemy("alguacil", 11, 10, 7, 13);
  // Puente de losas que se desmoronan sobre foso
  b.crumble(15, 19, 11);
  b.coinRow(16, 18, 9);
  b.ground(20, 29, 11);
  b.spikes(23, 24, 10);
  b.coinArc(22, 7, 4);
  b.enemy("censor", 27, 10, 25, 29);

  // --- Tramo 2 (30..54): La Torre del Carmelo (ascenso vertical estilo Alex Kidd) ---
  b.ground(30, 52, 11);
  b.fill(30, 4, 30, 8, 9); // Muro oeste de la torre (abierto abajo y arriba)
  b.fill(46, 4, 46, 8, 9); // Muro este (abierto abajo y arriba)
  b.plat(32, 37, 9);
  b.plat(39, 44, 7);
  b.enemy("alguacil", 41, 6, 39, 44);
  b.plat(32, 38, 5);
  b.skull(35, 3);
  b.plat(40, 46, 3); // Almena superior de la torre
  b.portrait(women[0], 43, 2); // Teresa de Jesús en la cumbre
  b.coinRow(33, 37, 4);
  b.enemy("crow", 37, 3);
  // Ruta baja alternativa con muros de ladrillo rompibles + Retrato 2 (Sofonisba Anguissola)
  b.brickWall(35, 9, 10);
  b.brickWall(41, 9, 10);
  b.mystery(38, 8, "goldQuill");
  b.portrait(women[1], 49, 10); // Sofonisba Anguissola tras la torre
  b.brickWall(48, 8, 10);
  b.fill(48, 7, 51, 7, 1);

  // Salto sobre braseros hacia el Farol
  b.crumble(53, 55, 10);
  b.coinArc(53, 7, 4);
  b.ground(57, 65, 11);
  b.enemy("flame", 60, 10);
  b.spikes(60, 60, 10);
  b.enemy("alguacil", 63, 10, 61, 65);

  // --- Farol de control (66..73) ---
  b.ground(66, 74, 11);
  b.mystery(70, 8, "heart");
  b.mystery(72, 8, "coins");

  // --- Tramo 3 (75..112): Puente de Toledo y Galerías de la Inquisición ---
  b.moving(76, 10, 83, 8, 3, 62);
  b.enemy("crow", 80, 5);
  b.coinRow(78, 81, 6);
  b.ground(85, 97, 11);
  b.spikes(88, 89, 10);
  b.plat(87, 94, 8);
  b.enemy("censor", 92, 7, 87, 94);
  b.brickWall(95, 9, 10);
  // Camino elevado con trampa de calavera y Retrato 3 (Oliva Sabuco)
  b.plat(96, 103, 6);
  b.skull(98, 4);
  b.portrait(women[2], 101, 5); // Oliva Sabuco
  b.crumble(98, 101, 11);
  b.ground(102, 117, 11);
  b.enemy("censor", 107, 10, 103, 110);
  b.enemy("crow", 111, 5);
  b.mystery(114, 8, "goldQuill");
  b.mystery(116, 8, "shield");

  // Reliquias históricas y escenografía de Ávila y Toledo
  b.relic("torno", 33, 10); // El torno y la biblioteca conventual en la torre
  b.relic("caballete", 104, 10); // Caballete de corte de Sofonisba Anguissola
  b.prop("lantern", 5, 10);
  b.prop("banner", 12, 10);
  b.prop("stainedGlass", 38, 10);
  b.prop("lantern", 51, 10);
  b.prop("arch", 63, 10);
  b.prop("stainedGlass", 91, 10);
  b.prop("banner", 112, 10);
  b.prop("stainedGlass", 127, 10);

  // Arena del Jefe: El Inquisidor de Lacre
  b.arena(119, 136);

  return {
    stageIndex: 1,
    cols,
    rows: LEVEL_ROWS,
    tiles: b.tiles,
    loot: b.loot,
    spawn: { tx: 2, ty: 10 },
    checkpoint: { tx: 68, ty: 10 },
    coins: b.coins,
    portraits: b.portraits,
    relics: b.relics,
    props: b.props,
    enemies: b.enemies,
    platforms: b.platforms,
    boss: {
      stageIndex: 1,
      arenaLeftTile: 119,
      arenaRightTile: 136,
      triggerTile: 121,
      spawnTx: 132,
      spawnTy: 10,
      maxHp: 6,
    },
    hasWater: false,
  };
}

/* ================================================================== */
/* FASE 3: MAR DEL SUR (1595) — Galeón hacia Manila                   */
/* ================================================================== */

function buildStage3(): LevelData {
  const cols = 142;
  const b = new Builder(cols);
  const women = STAGES[2].womenIds; // barreto, isabelclara, erauso

  b.fill(0, 0, 0, 13, 9);

  // --- Tramo 1 (0..30): Cubierta del galeón Santa Isabel y cofa del mástil ---
  b.ground(0, 27, 11);
  b.coinRow(4, 8, 10);
  b.mystery(9, 8, "goldQuill");
  b.brickWall(13, 9, 10);
  b.enemy("alguacil", 17, 10, 14, 22);
  // Escala de jarcias hacia la cofa (Retrato 1: Isabel Barreto)
  b.plat(16, 21, 8);
  b.plat(19, 25, 5);
  b.portrait(women[0], 22, 4); // Isabel Barreto
  b.coinRow(17, 20, 7);
  b.enemy("flame", 25, 10);

  // --- Tramo 2 (28..68): Travesía entre barcos y poleas sobre el Pacífico ---
  b.moving(29, 10, 36, 10, 3, 68);
  b.coinRow(31, 35, 7);
  b.enemy("flame", 33, 12);
  b.ground(38, 49, 11);
  b.enemy("piquero", 44, 10, 39, 48); // Primer piquero con escudo
  b.plat(40, 47, 8);
  b.mystery(43, 5, "shield");
  b.enemy("crow", 46, 4);

  // Segunda pasarela marina con polea diagonal y mástil alto (Retrato 2: Isabel Clara Eugenia)
  b.moving(51, 10, 57, 7, 3, 60);
  b.plat(57, 63, 5);
  b.portrait(women[1], 60, 4); // Isabel Clara Eugenia
  b.coinRow(58, 62, 4);
  b.crumble(59, 63, 10);
  b.enemy("flame", 55, 12);

  // --- Farol de control (65..74) ---
  b.ground(65, 75, 11);
  b.mystery(70, 8, "heart");
  b.mystery(72, 8, "coins");

  // --- Tramo 3 (76..118): Castillo de proa y galeón censor ---
  b.moving(77, 10, 82, 10, 3, 66);
  b.ground(84, 103, 11);
  b.brickWall(87, 8, 10);
  b.brick(88, 10);
  b.enemy("piquero", 93, 10, 89, 98);
  b.plat(89, 97, 8);
  b.enemy("censor", 95, 7, 89, 97);
  b.plat(95, 102, 5);
  b.skull(98, 3);
  b.portrait(women[2], 101, 4); // Catalina de Erauso ("La Monja Alférez")
  b.coinRow(96, 100, 4);

  // Último salto sobre olas hacia el alcázar
  b.crumble(105, 107, 10);
  b.enemy("crow", 107, 5);
  b.coinArc(105, 7, 4);
  b.moving(109, 10, 114, 9, 3, 64);
  b.ground(116, 122, 11);
  b.mystery(118, 8, "goldQuill");
  b.mystery(120, 8, "heart");

  // Reliquias históricas y escenografía del Galeón de Manila
  b.relic("astrolabio", 20, 10); // Astrolabio del Mar del Sur en cubierta
  b.relic("cartas_indias", 91, 10); // Cartas de Indias en el castillo de proa
  b.prop("burgundyFlag", 5, 10);
  b.prop("cannon", 11, 10);
  b.prop("helm", 23, 10);
  b.prop("cannon", 41, 10);
  b.prop("burgundyFlag", 47, 10);
  b.prop("helm", 73, 10);
  b.prop("cannon", 86, 10);
  b.prop("burgundyFlag", 101, 10);
  b.prop("helm", 131, 10);

  // Arena del Jefe: El Capitán del Veto
  b.arena(123, 140);

  return {
    stageIndex: 2,
    cols,
    rows: LEVEL_ROWS,
    tiles: b.tiles,
    loot: b.loot,
    spawn: { tx: 2, ty: 10 },
    checkpoint: { tx: 67, ty: 10 },
    coins: b.coins,
    portraits: b.portraits,
    relics: b.relics,
    props: b.props,
    enemies: b.enemies,
    platforms: b.platforms,
    boss: {
      stageIndex: 2,
      arenaLeftTile: 123,
      arenaRightTile: 140,
      triggerTile: 125,
      spawnTx: 136,
      spawnTy: 10,
      maxHp: 7,
    },
    hasWater: true,
  };
}

/* ================================================================== */
/* FASE 4: MADRID Y SEVILLA (1650) — Corral de Comedias               */
/* ================================================================== */

function buildStage4(): LevelData {
  const cols = 146;
  const b = new Builder(cols);
  const women = STAGES[3].womenIds; // zayas, caro, marcela, roldana

  b.fill(0, 0, 0, 13, 9);

  // --- Tramo 1 (0..32): Patio de butacas y palcos de terciopelo ---
  b.ground(0, 24, 11);
  b.coinRow(4, 7, 10);
  b.mystery(8, 8, "shield");
  b.enemy("mask", 14, 7);
  b.plat(11, 18, 8);
  b.plat(16, 23, 5);
  b.portrait(women[0], 20, 4); // María de Zayas en el palco alto
  b.coinRow(12, 16, 7);
  b.enemy("alguacil", 19, 10, 13, 23);

  // Tramoya vertical (ascensor teatral)
  b.moving(26, 10, 26, 5, 3, 56);
  b.ground(30, 46, 11);
  b.plat(31, 41, 6);
  b.enemy("censor", 38, 5, 31, 41);
  b.coinRow(32, 36, 5);
  // Retrato 2 (Ana Caro) en el camarín oculto tras cajas de atrezzo
  b.brickWall(35, 9, 10);
  b.brickWall(36, 9, 10);
  b.portrait(women[1], 39, 10); // Ana Caro de Mallén
  b.enemy("mask", 44, 6);

  // --- Tramo 2 (47..68): Tramoyas colgantes sobre candilejas ---
  b.spikes(47, 63, 12);
  b.ground(47, 63, 13);
  b.moving(48, 9, 54, 9, 3, 70);
  b.plat(55, 59, 6);
  b.portrait(women[2], 57, 5); // Sor Marcela de San Félix
  b.coinRow(50, 53, 7);
  b.moving(58, 9, 63, 7, 3, 66);
  b.enemy("mask", 56, 4);

  // --- Farol de control (65..74) ---
  b.ground(65, 74, 11);
  b.mystery(69, 8, "heart");
  b.mystery(71, 8, "goldQuill");

  // --- Tramo 3 (75..121): Taller de escultura y claustro barroco ---
  b.ground(75, 92, 11);
  b.enemy("piquero", 82, 10, 77, 87);
  b.plat(79, 86, 8);
  b.skull(83, 5);
  b.mystery(85, 5, "coins");
  b.crumble(93, 96, 10);
  b.coinArc(93, 7, 4);
  b.ground(97, 115, 11);
  b.enemy("censor", 104, 10, 99, 108);
  b.enemy("mask", 109, 6);
  // Nicho de mármol con el Retrato 4 (La Roldana)
  b.fill(107, 7, 113, 7, 1);
  b.plat(101, 106, 8);
  b.brickWall(107, 4, 6);
  b.portrait(women[3], 110, 6); // Luisa Roldán ("La Roldana")
  b.coinRow(108, 112, 5);

  // Pasarela hacia el Gran Escenario
  b.moving(117, 10, 121, 9, 3, 65);
  b.ground(122, 126, 11);
  b.mystery(124, 8, "shield");
  b.mystery(125, 8, "heart");

  // Reliquias históricas y escenografía del Corral de Comedias
  b.relic("cazuela", 22, 10); // La cazuela del corral
  b.relic("gubia", 101, 10); // Gubia de Escultora Real (La Roldana)
  b.prop("theaterBanner", 6, 10);
  b.prop("lantern", 15, 10);
  b.prop("theaterBanner", 32, 10);
  b.prop("bustPedestal", 42, 10);
  b.prop("theaterBanner", 72, 10);
  b.prop("bustPedestal", 85, 10);
  b.prop("lantern", 99, 10);
  b.prop("theaterBanner", 135, 10);

  // Arena del Jefe: El Crítico Enmascarado
  b.arena(127, 144);

  return {
    stageIndex: 3,
    cols,
    rows: LEVEL_ROWS,
    tiles: b.tiles,
    loot: b.loot,
    spawn: { tx: 2, ty: 10 },
    checkpoint: { tx: 67, ty: 10 },
    coins: b.coins,
    portraits: b.portraits,
    relics: b.relics,
    props: b.props,
    enemies: b.enemies,
    platforms: b.platforms,
    boss: {
      stageIndex: 3,
      arenaLeftTile: 127,
      arenaRightTile: 144,
      triggerTile: 129,
      spawnTx: 140,
      spawnTy: 10,
      maxHp: 8,
    },
    hasWater: false,
  };
}

/* ================================================================== */
/* FASE 5: CUZCO Y ALCALÁ (1785) — El Gran Índice (Final)             */
/* ================================================================== */

function buildStage5(): LevelData {
  const cols = 152;
  const b = new Builder(cols);
  const women = STAGES[4].womenIds; // sorjuana, bastidas, amar, guzman

  b.fill(0, 0, 0, 13, 9);

  // --- Tramo 1 (0..32): Galería nocturna de estanterías y cúpula de Sor Juana ---
  b.ground(0, 22, 11);
  b.coinRow(4, 7, 10);
  b.mystery(8, 8, "goldQuill");
  b.enemy("piquero", 15, 10, 10, 20);
  b.plat(12, 19, 8);
  b.plat(16, 23, 5);
  b.enemy("mask", 21, 4);
  b.portrait(women[0], 20, 4); // Sor Juana Inés de la Cruz
  b.coinRow(13, 17, 7);

  // Libros flotantes sobre el abismo estrellado
  b.moving(24, 10, 30, 8, 3, 72);
  b.enemy("crow", 28, 4);
  b.ground(32, 50, 11);
  b.spikes(36, 37, 10);
  b.coinArc(35, 7, 4);
  b.enemy("censor", 43, 10, 39, 48);
  // Muro de decretos rompible que oculta a Micaela Bastidas
  b.fill(44, 7, 49, 7, 1);
  b.brickWall(44, 8, 10);
  b.brickWall(45, 8, 10);
  b.portrait(women[1], 48, 10); // Micaela Bastidas

  // --- Tramo 2 (51..72): Puente Andino-Imperial y Bóveda Ilustrada ---
  b.crumble(52, 55, 10);
  b.enemy("flame", 54, 11);
  b.moving(57, 9, 63, 6, 3, 68);
  b.plat(62, 68, 5);
  b.portrait(women[2], 65, 4); // Josefa Amar y Borbón
  b.coinRow(63, 67, 4);
  b.crumble(64, 67, 10);

  // --- Farol de control (69..77) ---
  b.ground(69, 78, 11);
  b.mystery(73, 8, "heart");
  b.mystery(75, 8, "shield");

  // --- Tramo 3 (79..122): Salón del Índice Prohibido ---
  b.ground(79, 95, 11);
  b.brickWall(82, 8, 10);
  b.enemy("piquero", 88, 10, 84, 93);
  b.plat(84, 92, 8);
  b.enemy("censor", 90, 7, 84, 92);
  b.skull(87, 5);

  b.moving(97, 10, 103, 8, 3, 74);
  b.enemy("mask", 101, 5);
  b.ground(105, 121, 11);
  b.spikes(109, 110, 10);
  b.plat(107, 116, 8);
  b.enemy("censor", 114, 7, 107, 116);
  // Arco de Alcalá con María Isidra de Guzmán
  b.plat(112, 118, 5);
  b.portrait(women[3], 115, 4); // María Isidra de Guzmán ("La doctora de Alcalá")
  b.coinRow(113, 117, 4);
  b.enemy("piquero", 116, 10, 112, 120);

  // --- Antesala de la Ilustración (122..131): preparación completa antes del Jefe Final ---
  b.ground(122, 131, 11);
  b.mystery(124, 8, "heart");
  b.mystery(126, 8, "shield");
  b.mystery(128, 8, "goldQuill");
  b.coinRow(124, 128, 6);

  // Reliquias históricas y escenografía del Gran Índice (Cuzco, México y Alcalá)
  b.relic("esfera", 19, 10); // Esfera armilar de Sor Juana
  b.relic("birrete", 107, 10); // Birrete doctoral de Alcalá (1785)
  b.prop("bookshelf", 5, 10);
  b.prop("telescope", 13, 10);
  b.prop("cuzcoSun", 34, 10);
  b.prop("bookshelf", 40, 10);
  b.prop("cuzcoSun", 76, 10);
  b.prop("bookshelf", 86, 10);
  b.prop("telescope", 118, 10);
  b.prop("bookshelf", 126, 10);
  b.prop("cuzcoSun", 141, 10);

  // --- Salón del Gran Censor del Índice (Jefe Final, 10 HP, 3 fases) ---
  b.arena(132, 150);
  // Plataforma central adicional para el duelo final aéreo
  b.plat(139, 142, 6);

  return {
    stageIndex: 4,
    cols,
    rows: LEVEL_ROWS,
    tiles: b.tiles,
    loot: b.loot,
    spawn: { tx: 2, ty: 10 },
    checkpoint: { tx: 71, ty: 10 },
    coins: b.coins,
    portraits: b.portraits,
    relics: b.relics,
    props: b.props,
    enemies: b.enemies,
    platforms: b.platforms,
    boss: {
      stageIndex: 4,
      arenaLeftTile: 132,
      arenaRightTile: 150,
      triggerTile: 134,
      spawnTx: 145,
      spawnTy: 10,
      maxHp: 10,
    },
    hasWater: false,
  };
}

export function buildLevel(stageIndex: number): LevelData {
  switch (stageIndex) {
    case 0:
      return buildStage1();
    case 1:
      return buildStage2();
    case 2:
      return buildStage3();
    case 3:
      return buildStage4();
    default:
      return buildStage5();
  }
}
