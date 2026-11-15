import { RELIC_BY_ID, STAGES, WOMAN_BY_ID, type Relic, type StageMeta, type Woman } from "./data";
import { preloadStageBackgrounds } from "./backgrounds";
import { sfx, type MusicTrack } from "./audio";
import { buildLevel, TILE, type EnemyType, type LevelData, type LootType, type PropSpawn, type TileId } from "./levels";
import {
  VIEW_H,
  VIEW_W,
  drawBackdrop,
  drawBoss,
  drawCheckpoint,
  drawClara,
  drawCoin,
  drawEnemy,
  drawMovingPlatform,
  drawPortraitPickup,
  drawPowerup,
  drawProjectile,
  drawRelicPickup,
  drawTile,
  drawWater,
  drawWorldProp,
} from "./sprites";

export type GameStatus = "menu" | "map" | "playing" | "bossDuel" | "paused" | "stageClear" | "over" | "victory";

export interface StageClearInfo {
  stageIndex: number;
  stageScoreBonus: number;
  totalScore: number;
  portraitsInStage: number;
  portraitsTotalInStage: number;
  totalPortraits: number;
  isFinal: boolean;
}

export interface RunSummary {
  score: number;
  portraits: number;
  stageReached: number; // 1..5
  completed: boolean;
  enemiesDefeated: number;
}

export interface VirtualInput {
  left?: boolean;
  right?: boolean;
  down?: boolean;
  jump?: boolean;
  strike?: boolean;
}

export interface GameCallbacks {
  onStatus(status: GameStatus): void;
  onPortrait(woman: Woman, isNew: boolean): void;
  onRelic(relic: Relic, isNew: boolean): void;
  onBossDuel(meta: StageMeta): void;
  onStageClear(info: StageClearInfo): void;
  onGameOver(summary: RunSummary): void;
  onVictory(summary: RunSummary): void;
  getUnlocked(): string[];
  getUnlockedRelics(): string[];
}

interface MovingPlatform {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x: number;
  y: number;
  dx: number;
  dy: number;
  w: number;
  h: number;
  speed: number;
  t: number;
  dir: 1 | -1;
}

interface CoinEnt {
  x: number;
  y: number;
  taken: boolean;
}

interface PortraitEnt {
  womanId: string;
  x: number;
  y: number;
  taken: boolean;
}

interface RelicEnt {
  relicId: string;
  x: number;
  footY: number;
  discovered: boolean;
}

interface PowerupEnt {
  type: LootType;
  x: number;
  y: number;
  vy: number;
  life: number;
}

interface EnemyEnt {
  type: EnemyType;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  hp: number;
  hurtT: number;
  homeX: number;
  homeY: number;
  patrolMin: number;
  patrolMax: number;
  timer: number;
  phase: number;
  alive: boolean;
}

interface ProjectileEnt {
  x: number;
  y: number;
  vx: number;
  vy: number;
  friendly: boolean;
  life: number;
  gravity: number;
}

interface BossEnt {
  active: boolean;
  duelDone: boolean;
  defeated: boolean;
  stageIndex: number;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  dir: 1 | -1;
  hp: number;
  maxHp: number;
  hurtT: number;
  state: "idle" | "telegraph" | "charge" | "jump" | "cast" | "vanish" | "dying";
  timer: number;
  attackIndex: number;
  tauntT: number;
  arenaLeft: number;
  arenaRight: number;
  triggerX: number;
  grounded: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  grav: number;
  rot: number;
  vr: number;
  rect: boolean;
}

interface Floater {
  x: number;
  y: number;
  vy: number;
  life: number;
  max: number;
  text: string;
  color: string;
  size: number;
}

interface Ring {
  x: number;
  y: number;
  r: number;
  grow: number;
  life: number;
  max: number;
  color: string;
}

interface TileBump {
  tx: number;
  ty: number;
  t: number;
}

interface CrumbleState {
  idx: number;
  tx: number;
  ty: number;
  phase: "shaking" | "gone";
  t: number;
}

const GRAVITY = 1280;
const MAX_FALL = 560;
const RUN_SPEED = 215;
const JUMP_VEL = -528;
const COYOTE_TIME = 0.11;
const JUMP_BUFFER = 0.12;
const STRIKE_DUR = 0.16;
const STRIKE_CD = 0.27;
const MAX_HEARTS = 3;
const START_LIVES = 3;
const MAX_PARTICLES = 360;

const FONT_SC = "'IM Fell English SC', Georgia, serif";
const FONT = "'IM Fell English', Georgia, serif";

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const overlap = (ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

export class Game {
  status: GameStatus = "menu";
  stageIndex = 0;

  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: GameCallbacks;

  private dpr = 1;
  private level!: LevelData;
  private meta: StageMeta = STAGES[0];
  private tiles!: Uint8Array;

  // Entidades del nivel activo
  private platforms: MovingPlatform[] = [];
  private coins: CoinEnt[] = [];
  private portraits: PortraitEnt[] = [];
  private relics: RelicEnt[] = [];
  private props: PropSpawn[] = [];
  private powerups: PowerupEnt[] = [];
  private enemies: EnemyEnt[] = [];
  private projectiles: ProjectileEnt[] = [];
  private boss!: BossEnt;
  private bumps: TileBump[] = [];
  private crumbles = new Map<number, CrumbleState>();
  private checkpointLit = false;

  // Jugadora (Clara)
  private p = {
    x: 64,
    y: 280,
    w: 18,
    h: 28,
    vx: 0,
    vy: 0,
    facing: 1 as 1 | -1,
    grounded: false,
    crouching: false,
    coyote: 0,
    jumpBuf: 0,
    dropT: 0,
    strikeT: 0,
    strikeCd: 0,
    strikeDidHit: new Set<number>(),
    inv: 0,
    sx: 1,
    sy: 1,
    runCycle: 0,
    hearts: MAX_HEARTS,
    shield: false,
    goldQuill: false,
    safeX: 64,
    safeY: 280,
  };

  // Estado global de la campaña
  private score = 0;
  private shownScore = 0;
  private lives = START_LIVES;
  private totalPortraitsRun = 0;
  private stagePortraitsFound = 0;
  private enemiesDefeated = 0;
  private combo = 0;
  private comboT = 0;
  private stageTime = 0;
  private highestStageReached = 1;

  // Cámara y efectos
  private camX = 0;
  private camY = 0;
  private clock = 0;
  private trauma = 0;
  private freeze = 0;
  private redFlash = 0;
  private goldFlash = 0;
  private stageBannerT = 0;
  private clearDelayT = 0;
  private parts: Particle[] = [];
  private floaters: Floater[] = [];
  private rings: Ring[] = [];

  // Entrada teclado + táctil virtual
  private kb = { left: false, right: false, down: false, jump: false, strike: false };
  private touch: VirtualInput = { left: false, right: false, down: false, jump: false, strike: false };
  private prevJump = false;
  private prevStrike = false;

  // Bucle
  private raf = 0;
  private last = 0;
  private running = false;
  private calm = false;

  constructor(canvas: HTMLCanvasElement, cb: GameCallbacks) {
    this.canvas = canvas;
    this.cb = cb;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D no disponible");
    this.ctx = ctx;
    try {
      this.calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      this.calm = false;
    }
    preloadStageBackgrounds();
    this.loadStage(0, false);
  }

  /* ================================================================ */
  /* Ciclo de vida y control externo                                  */
  /* ================================================================ */

  mount(): void {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.loop);
  }

  destroy(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
    sfx.stopMusic();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onVisibility);
  }

  resize(cssW: number, cssH: number, dpr: number): void {
    this.dpr = clamp(dpr || 1, 1, 2);
    // Mantenemos una resolución interna nítida basada en 640×360 escalada por DPR
    const scale = Math.max(1, Math.min(2, Math.max(cssW / VIEW_W, cssH / VIEW_H) * this.dpr));
    this.canvas.width = Math.round(VIEW_W * scale);
    this.canvas.height = Math.round(VIEW_H * scale);
  }

  /** Inicia una campaña nueva desde la fase indicada (por defecto Fase 1, muestra el mapa) */
  startCampaign(startStageIndex = 0, showMapFirst = true): void {
    this.score = 0;
    this.shownScore = 0;
    this.lives = START_LIVES;
    this.totalPortraitsRun = 0;
    this.enemiesDefeated = 0;
    this.combo = 0;
    this.comboT = 0;
    this.stageIndex = clamp(startStageIndex, 0, STAGES.length - 1);
    this.highestStageReached = this.stageIndex + 1;
    this.p.shield = false;
    this.p.goldQuill = false;
    this.loadStage(this.stageIndex, false);
    if (showMapFirst) {
      sfx.stopMusic();
      this.setStatus("map");
    } else {
      this.enterCurrentStage();
    }
  }

  /** Entra a jugar la fase actual tras el Mapa de la Crónica */
  enterCurrentStage(): void {
    this.loadStage(this.stageIndex, false);
    this.stageBannerT = 2.6;
    this.clearInput();
    this.setStatus("playing");
    sfx.playMusic(this.meta.theme as MusicTrack);
  }

  /** Avanza a la siguiente fase (llamado tras cerrar el diálogo de victoria de fase) */
  advanceToNextStage(): void {
    if (this.stageIndex + 1 >= STAGES.length) {
      this.finishVictory();
      return;
    }
    this.stageIndex++;
    this.highestStageReached = Math.max(this.highestStageReached, this.stageIndex + 1);
    this.loadStage(this.stageIndex, false);
    sfx.stopMusic();
    this.setStatus("map");
  }

  /** Reintenta la fase actual desde el inicio con 3 vidas (para seguir disfrutando la historia) */
  retryCurrentStage(): void {
    this.lives = START_LIVES;
    this.p.shield = false;
    this.p.goldQuill = false;
    this.score = Math.floor(this.score * 0.5);
    this.shownScore = this.score;
    this.loadStage(this.stageIndex, false);
    this.stageBannerT = 2.2;
    this.clearInput();
    this.setStatus("playing");
    sfx.playMusic(this.meta.theme as MusicTrack);
  }

  /** Resuelve el Duelo de Ingenio previo al jefe (guiño al Janken de Alex Kidd) */
  resolveBossDuel(correct: boolean): void {
    if (this.status !== "bossDuel") return;
    const b = this.boss;
    b.duelDone = true;
    b.active = true;
    this.clearInput();
    this.last = performance.now();
    this.setStatus("playing");
    sfx.playMusic("boss");

    if (correct) {
      // ¡Argumento irrefutable! Rompe 2 corazones del Jefe y entrega Tinta de Oro
      b.hp = Math.max(1, b.hp - 2);
      b.hurtT = 0.65;
      b.tauntT = 1.6;
      this.p.goldQuill = true;
      this.addScore(400);
      this.goldFlash = 0.75;
      this.trauma = 0.65;
      sfx.bossHit();
      sfx.powerup();
      this.ring(b.x + b.w / 2, b.y + b.h / 2, "#f7dc84");
      this.burst(b.x + b.w / 2, b.y + b.h / 2, 32, ["#f7dc84", "#d92b32", "#fdf6e3"], 290);
      this.floater(b.x + b.w / 2, b.y - 12, "¡-2 HP · Voz Propia!", "#9c6b12", 16);
    } else {
      b.tauntT = 2.6;
      this.trauma = 0.35;
    }
  }

  pause(): void {
    if (this.status !== "playing") return;
    this.clearInput();
    sfx.pauseMusic(true);
    this.setStatus("paused");
  }

  resume(): void {
    if (this.status !== "paused") return;
    this.last = performance.now();
    sfx.pauseMusic(false);
    this.setStatus("playing");
  }

  toMenu(): void {
    sfx.stopMusic();
    this.clearInput();
    this.stageIndex = 0;
    this.loadStage(0, false);
    this.setStatus("menu");
  }

  setVirtualInput(partial: VirtualInput): void {
    Object.assign(this.touch, partial);
  }

  private clearInput(): void {
    this.kb.left = this.kb.right = this.kb.down = this.kb.jump = this.kb.strike = false;
    this.touch.left = this.touch.right = this.touch.down = this.touch.jump = this.touch.strike = false;
    this.prevJump = this.prevStrike = false;
  }

  private setStatus(s: GameStatus): void {
    this.status = s;
    this.cb.onStatus(s);
  }

  /* ================================================================ */
  /* Carga de nivel y reaparición                                     */
  /* ================================================================ */

  private loadStage(index: number, fromCheckpoint: boolean): void {
    this.stageIndex = clamp(index, 0, STAGES.length - 1);
    this.meta = STAGES[this.stageIndex];
    this.level = buildLevel(this.stageIndex);
    this.tiles = new Uint8Array(this.level.tiles);

    this.platforms = this.level.platforms.map((d) => ({
      x1: d.x1 * TILE,
      y1: d.y1 * TILE,
      x2: d.x2 * TILE,
      y2: d.y2 * TILE,
      x: d.x1 * TILE,
      y: d.y1 * TILE,
      dx: 0,
      dy: 0,
      w: d.widthTiles * TILE,
      h: 13,
      speed: d.speed,
      t: 0,
      dir: 1,
    }));

    if (!fromCheckpoint) {
      this.coins = this.level.coins.map((c) => ({ x: c.tx * TILE + TILE / 2, y: c.ty * TILE + TILE / 2, taken: false }));
      this.portraits = this.level.portraits.map((pt) => ({
        womanId: pt.womanId,
        x: pt.tx * TILE + TILE / 2,
        y: pt.ty * TILE + TILE / 2,
        taken: false,
      }));
      this.relics = this.level.relics.map((rl) => ({
        relicId: rl.relicId,
        x: rl.tx * TILE + TILE / 2,
        footY: (rl.ty + 1) * TILE,
        discovered: false,
      }));
      this.checkpointLit = false;
      this.stagePortraitsFound = 0;
      this.stageTime = 0;
    }

    this.props = this.level.props;
    this.powerups = [];
    this.projectiles = [];
    this.bumps = [];
    this.crumbles.clear();
    this.parts = [];
    this.floaters = [];
    this.rings = [];
    this.clearDelayT = 0;
    this.trauma = 0;
    this.freeze = 0;
    this.redFlash = 0;
    this.goldFlash = 0;

    this.enemies = this.level.enemies.map((e) => this.makeEnemy(e.type, e.tx * TILE, e.ty * TILE, e.patrolMin, e.patrolMax));

    const bd = this.level.boss;
    this.boss = {
      active: false,
      duelDone: false,
      defeated: false,
      stageIndex: bd.stageIndex,
      x: bd.spawnTx * TILE,
      y: bd.spawnTy * TILE - 28,
      w: 36,
      h: 56,
      vx: 0,
      vy: 0,
      dir: -1,
      hp: bd.maxHp,
      maxHp: bd.maxHp,
      hurtT: 0,
      state: "idle",
      timer: 0.9,
      attackIndex: 0,
      tauntT: 0,
      arenaLeft: bd.arenaLeftTile * TILE,
      arenaRight: bd.arenaRightTile * TILE,
      triggerX: bd.triggerTile * TILE,
      grounded: false,
    };

    const sp = fromCheckpoint && this.checkpointLit ? this.level.checkpoint : this.level.spawn;
    const p = this.p;
    p.x = sp.tx * TILE + 6;
    p.y = sp.ty * TILE + (TILE - p.h);
    p.safeX = p.x;
    p.safeY = p.y;
    p.vx = 0;
    p.vy = 0;
    p.facing = 1;
    p.grounded = false;
    p.crouching = false;
    p.coyote = 0;
    p.jumpBuf = 0;
    p.dropT = 0;
    p.strikeT = 0;
    p.strikeCd = 0;
    p.inv = 1.0;
    p.sx = p.sy = 1;
    p.hearts = MAX_HEARTS;

    this.camX = clamp(p.x - VIEW_W * 0.3, 0, Math.max(0, this.level.cols * TILE - VIEW_W));
    this.camY = clamp(p.y - VIEW_H * 0.62, 0, Math.max(0, this.level.rows * TILE - VIEW_H));
  }

  private makeEnemy(type: EnemyType, x: number, y: number, pMin?: number, pMax?: number): EnemyEnt {
    const w = type === "flame" ? 18 : 22;
    const h = type === "crow" || type === "flame" ? 20 : 26;
    const hp = type === "censor" || type === "piquero" ? 2 : 1;
    return {
      type,
      x,
      y: y + (TILE - h),
      w,
      h,
      vx: type === "alguacil" ? -56 : type === "piquero" ? -44 : 0,
      vy: 0,
      dir: -1,
      hp,
      hurtT: 0,
      homeX: x,
      homeY: y + (TILE - h),
      patrolMin: (pMin ?? Math.floor(x / TILE) - 3) * TILE,
      patrolMax: (pMax ?? Math.floor(x / TILE) + 3) * TILE,
      timer: rand(0.4, 1.4),
      phase: rand(0, 6.28),
      alive: true,
    };
  }

  /* ================================================================ */
  /* Bucle principal                                                  */
  /* ================================================================ */

  private loop = (now: number): void => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.034, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    if (this.status === "paused") return;
    this.step(dt);
    this.render();
  };

  step(rawDt: number): void {
    this.clock += rawDt;
    this.trauma = Math.max(0, this.trauma - rawDt * 2.2);
    this.redFlash = Math.max(0, this.redFlash - rawDt * 2.5);
    this.goldFlash = Math.max(0, this.goldFlash - rawDt * 2.2);
    this.stageBannerT = Math.max(0, this.stageBannerT - rawDt);
    this.shownScore += (this.score - this.shownScore) * Math.min(1, rawDt * 14);
    if (Math.abs(this.score - this.shownScore) < 1) this.shownScore = this.score;

    if (this.freeze > 0) {
      this.freeze -= rawDt;
      return;
    }

    if (this.status === "menu") {
      this.stepAttract(rawDt);
      this.updateFx(rawDt);
      return;
    }

    if (this.status === "map" || this.status === "bossDuel" || this.status === "over" || this.status === "victory") {
      this.updateFx(rawDt);
      return;
    }

    if (this.status === "stageClear") {
      this.updateFx(rawDt);
      return;
    }

    // status === "playing"
    this.stageTime += rawDt;
    if (this.comboT > 0) {
      this.comboT -= rawDt;
      if (this.comboT <= 0) this.combo = 0;
    }

    this.updatePlatforms(rawDt);
    this.updateCrumbleTiles(rawDt);
    this.updatePlayer(rawDt);
    this.updatePickups(rawDt);
    this.updateEnemies(rawDt);
    this.updateBoss(rawDt);
    this.updateProjectiles(rawDt);
    this.updateCamera(rawDt);
    this.updateFx(rawDt);

    if (this.clearDelayT > 0) {
      this.clearDelayT -= rawDt;
      if (this.clearDelayT <= 0) this.triggerStageClear();
    }
  }

  /* ---------------- Demo animada en el menú ---------------- */

  private stepAttract(dt: number): void {
    const p = this.p;
    p.vx = 92;
    p.facing = 1;
    p.runCycle += dt * 11;
    p.x += p.vx * dt;
    // Pequeños saltos rítmicos y golpes de pluma en Salamanca
    if (p.grounded && Math.sin(this.clock * 2.2) > 0.88) {
      p.vy = -380;
      p.grounded = false;
    }
    if (Math.sin(this.clock * 3.1) > 0.94 && p.strikeT <= 0) {
      p.strikeT = STRIKE_DUR;
    }
    if (p.strikeT > 0) p.strikeT -= dt;
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);
    p.y += p.vy * dt;
    const floorY = 11 * TILE - p.h;
    if (p.y >= floorY) {
      p.y = floorY;
      p.vy = 0;
      p.grounded = true;
    }
    if (p.x > 24 * TILE) p.x = 2 * TILE;
    this.camX = clamp(p.x - VIEW_W * 0.32, 0, Math.max(0, this.level.cols * TILE - VIEW_W));
    this.camY = clamp(p.y - VIEW_H * 0.65, 0, Math.max(0, this.level.rows * TILE - VIEW_H));
  }

  /* ---------------- Teclado ---------------- */

  private onKeyDown = (e: KeyboardEvent): void => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
    const c = e.code;
    if (this.status === "playing") {
      if (c === "ArrowLeft" || c === "KeyA") {
        this.kb.left = true;
        e.preventDefault();
      } else if (c === "ArrowRight" || c === "KeyD") {
        this.kb.right = true;
        e.preventDefault();
      } else if (c === "ArrowDown" || c === "KeyS") {
        this.kb.down = true;
        e.preventDefault();
      } else if (c === "ArrowUp" || c === "KeyW" || c === "Space" || c === "KeyZ") {
        this.kb.jump = true;
        e.preventDefault();
      } else if (c === "KeyX" || c === "KeyJ" || c === "KeyK" || c === "KeyF" || c === "ShiftLeft" || c === "ShiftRight") {
        this.kb.strike = true;
        e.preventDefault();
      } else if ((c === "KeyP" || c === "Escape") && !e.repeat) {
        this.pause();
        e.preventDefault();
      }
    } else if (this.status === "paused" && (c === "KeyP" || c === "Escape") && !e.repeat) {
      this.resume();
      e.preventDefault();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    const c = e.code;
    if (c === "ArrowLeft" || c === "KeyA") this.kb.left = false;
    else if (c === "ArrowRight" || c === "KeyD") this.kb.right = false;
    else if (c === "ArrowDown" || c === "KeyS") this.kb.down = false;
    else if (c === "ArrowUp" || c === "KeyW" || c === "Space" || c === "KeyZ") this.kb.jump = false;
    else if (c === "KeyX" || c === "KeyJ" || c === "KeyK" || c === "KeyF" || c === "ShiftLeft" || c === "ShiftRight") this.kb.strike = false;
  };

  private onBlur = (): void => {
    this.clearInput();
    this.pause();
  };

  private onVisibility = (): void => {
    if (document.hidden) this.pause();
  };

  /* ---------------- Plataformas y baldosas ---------------- */

  private getTile(tx: number, ty: number): TileId {
    if (tx < 0 || tx >= this.level.cols) return 1;
    if (ty < 0) return 0;
    if (ty >= this.level.rows) return 0;
    return this.tiles[ty * this.level.cols + tx] as TileId;
  }

  private setTile(tx: number, ty: number, id: TileId): void {
    if (tx < 0 || tx >= this.level.cols || ty < 0 || ty >= this.level.rows) return;
    this.tiles[ty * this.level.cols + tx] = id;
  }

  private isSolid(id: TileId): boolean {
    return id === 1 || id === 3 || id === 4 || id === 5 || id === 6 || id === 9;
  }

  private updatePlatforms(dt: number): void {
    for (const pl of this.platforms) {
      const dist = Math.hypot(pl.x2 - pl.x1, pl.y2 - pl.y1);
      if (dist < 1) continue;
      const oldX = pl.x;
      const oldY = pl.y;
      pl.t += (pl.speed / dist) * dt * pl.dir;
      if (pl.t >= 1) {
        pl.t = 1;
        pl.dir = -1;
      } else if (pl.t <= 0) {
        pl.t = 0;
        pl.dir = 1;
      }
      // Suavizado seno-coseno en extremos para que subirse sea facilísimo
      const smooth = 0.5 - 0.5 * Math.cos(pl.t * Math.PI);
      pl.x = pl.x1 + (pl.x2 - pl.x1) * smooth;
      pl.y = pl.y1 + (pl.y2 - pl.y1) * smooth;
      pl.dx = pl.x - oldX;
      pl.dy = pl.y - oldY;
    }
  }

  private updateCrumbleTiles(dt: number): void {
    for (const [idx, st] of this.crumbles) {
      st.t -= dt;
      if (st.phase === "shaking" && st.t <= 0) {
        st.phase = "gone";
        st.t = 3.2;
        this.setTile(st.tx, st.ty, 0);
        this.burst(st.tx * TILE + 16, st.ty * TILE + 10, 10, ["#c9a87a", "#8f6534", "#f2dfc0"], 150, true);
        sfx.blockBreak();
      } else if (st.phase === "gone" && st.t <= 0) {
        this.setTile(st.tx, st.ty, 7);
        this.crumbles.delete(idx);
      }
    }
    for (let i = this.bumps.length - 1; i >= 0; i--) {
      this.bumps[i].t -= dt * 6;
      if (this.bumps[i].t <= 0) this.bumps.splice(i, 1);
    }
  }

  /* ---------------- Física y combate de Clara ---------------- */

  private updatePlayer(dt: number): void {
    const p = this.p;
    const left = this.kb.left || !!this.touch.left;
    const right = this.kb.right || !!this.touch.right;
    const down = this.kb.down || !!this.touch.down;
    const jumpNow = this.kb.jump || !!this.touch.jump;
    const strikeNow = this.kb.strike || !!this.touch.strike;

    const jumpPressed = jumpNow && !this.prevJump;
    const jumpReleased = !jumpNow && this.prevJump;
    const strikePressed = strikeNow && !this.prevStrike;
    this.prevJump = jumpNow;
    this.prevStrike = strikeNow;

    p.inv = Math.max(0, p.inv - dt);
    p.dropT = Math.max(0, p.dropT - dt);
    p.strikeCd = Math.max(0, p.strikeCd - dt);
    p.sx += (1 - p.sx) * Math.min(1, dt * 14);
    p.sy += (1 - p.sy) * Math.min(1, dt * 14);

    if (jumpPressed) {
      if (down && p.grounded) {
        // Bajar por plataforma atravesable
        p.dropT = 0.22;
        p.grounded = false;
        p.y += 3;
      } else {
        p.jumpBuf = JUMP_BUFFER;
      }
    } else {
      p.jumpBuf = Math.max(0, p.jumpBuf - dt);
    }

    // Movimiento horizontal con aceleración y giro ágiles
    const dir = (right ? 1 : 0) - (left ? 1 : 0);
    p.crouching = down && p.grounded && dir === 0;
    if (dir !== 0) {
      p.facing = dir > 0 ? 1 : -1;
      const acc = p.grounded ? 1850 : 1250;
      if (p.vx !== 0 && Math.sign(p.vx) !== dir && p.grounded) {
        p.vx *= 0.45;
        this.dust(p.x + p.w / 2, p.y + p.h, -dir * 40);
      }
      p.vx = clamp(p.vx + dir * acc * dt, -RUN_SPEED, RUN_SPEED);
    } else {
      const dec = p.grounded ? 1950 : 520;
      if (Math.abs(p.vx) <= dec * dt) p.vx = 0;
      else p.vx -= Math.sign(p.vx) * dec * dt;
    }

    // Coyote time y salto
    if (p.grounded) p.coyote = COYOTE_TIME;
    else p.coyote = Math.max(0, p.coyote - dt);

    if (p.jumpBuf > 0 && p.coyote > 0) {
      p.vy = JUMP_VEL;
      p.grounded = false;
      p.coyote = 0;
      p.jumpBuf = 0;
      p.sx = 0.78;
      p.sy = 1.24;
      sfx.jump();
      this.dust(p.x + p.w / 2, p.y + p.h, 0, 5);
    }
    if (jumpReleased && p.vy < -160) {
      p.vy *= 0.48;
    }

    // Golpe de Pluma (estilo puño de Alex Kidd)
    if (strikePressed && p.strikeCd <= 0) {
      p.strikeT = STRIKE_DUR;
      p.strikeCd = STRIKE_CD;
      p.strikeDidHit.clear();
      p.sx = 1.15;
      p.sy = 0.9;
      sfx.strike();
      if (p.goldQuill && this.projectiles.filter((pr) => pr.friendly).length < 2) {
        this.projectiles.push({
          x: p.x + p.w / 2 + p.facing * 16,
          y: p.y + p.h * 0.45,
          vx: p.facing * 370,
          vy: 0,
          friendly: true,
          life: 0.75,
          gravity: 0,
        });
        sfx.wave();
      }
    }

    // Gravedad
    p.vy = Math.min(MAX_FALL, p.vy + GRAVITY * dt);

    // Transporte por plataforma móvil si estamos encima
    if (p.grounded) {
      for (const pl of this.platforms) {
        if (
          p.x + p.w > pl.x + 2 &&
          p.x < pl.x + pl.w - 2 &&
          Math.abs(p.y + p.h - pl.y) <= 5
        ) {
          p.x += pl.dx;
          p.y += pl.dy;
          break;
        }
      }
    }

    // Resolver colisión X
    p.x += p.vx * dt;
    // Limitar a la arena cuando el jefe está activo
    if (this.boss.active && !this.boss.defeated) {
      p.x = clamp(p.x, this.boss.arenaLeft + 4, this.boss.arenaRight - p.w - 4);
    } else {
      p.x = clamp(p.x, TILE, (this.level.cols - 1) * TILE - p.w);
    }
    this.resolveX();

    // Resolver colisión Y
    const wasGrounded = p.grounded;
    const prevBottom = p.y + p.h;
    p.y += p.vy * dt;
    p.grounded = false;
    this.resolveY(prevBottom);

    if (!wasGrounded && p.grounded) {
      p.sx = 1.2;
      p.sy = 0.82;
      this.dust(p.x + p.w / 2, p.y + p.h, 0, 4);
      sfx.land();
    }

    if (p.grounded && Math.abs(p.vx) > 25) {
      p.runCycle += dt * (Math.abs(p.vx) / 14);
      if (Math.random() < dt * 7) this.dust(p.x + p.w / 2, p.y + p.h, -p.vx * 0.15, 1);
    }

    // Guardar última posición segura sobre tierra firme (no sobre losa frágil)
    if (p.grounded) {
      const belowTx = Math.floor((p.x + p.w / 2) / TILE);
      const belowTy = Math.floor((p.y + p.h + 2) / TILE);
      const tid = this.getTile(belowTx, belowTy);
      if (tid === 1 || tid === 2 || tid === 6 || tid === 9) {
        p.safeX = p.x;
        p.safeY = p.y;
      }
    }

    // Golpe activo de la Pluma: rompe ladrillos, activa bloques y golpea enemigos/proyectiles
    if (p.strikeT > 0) {
      p.strikeT -= dt;
      this.checkStrikeHits();
    }

    // Comprobar braseros/espinas (tile 8)
    const cx = Math.floor((p.x + p.w / 2) / TILE);
    const cy = Math.floor((p.y + p.h - 4) / TILE);
    if (this.getTile(cx, cy) === 8) {
      this.hurtPlayer(p.x < cx * TILE + 16 ? -1 : 1);
    }

    // Comprobar caída al abismo / mar
    if (p.y > this.level.rows * TILE + 18) {
      if (this.level.hasWater) {
        this.burst(p.x + p.w / 2, this.level.rows * TILE - 18, 18, ["#9adbf2", "#ffffff", "#2f7da3"], 240, true);
      }
      this.hurtPlayer(0, true);
    }

    // Comprobar Farol de Control (Checkpoint)
    if (!this.checkpointLit) {
      const cpx = this.level.checkpoint.tx * TILE + TILE / 2;
      const cpy = this.level.checkpoint.ty * TILE;
      if (Math.abs(p.x + p.w / 2 - cpx) < 28 && Math.abs(p.y - cpy) < 48) {
        this.checkpointLit = true;
        sfx.checkpoint();
        this.goldFlash = 0.5;
        this.ring(cpx, cpy - 14, "#f7dc84");
        this.burst(cpx, cpy - 14, 24, ["#f7dc84", "#fdf6e3", "#d6a02e"], 240);
        this.floater(cpx, cpy - 32, "¡Farol encendido!", "#9c6b12", 15);
        this.addScore(200);
      }
    }
  }

  private resolveX(): void {
    const p = this.p;
    const top = Math.floor((p.y + 3) / TILE);
    const bot = Math.floor((p.y + p.h - 3) / TILE);
    if (p.vx > 0) {
      const tx = Math.floor((p.x + p.w) / TILE);
      for (let ty = top; ty <= bot; ty++) {
        if (this.isSolid(this.getTile(tx, ty))) {
          p.x = tx * TILE - p.w - 0.01;
          p.vx = 0;
          break;
        }
      }
    } else if (p.vx < 0) {
      const tx = Math.floor(p.x / TILE);
      for (let ty = top; ty <= bot; ty++) {
        if (this.isSolid(this.getTile(tx, ty))) {
          p.x = (tx + 1) * TILE + 0.01;
          p.vx = 0;
          break;
        }
      }
    }
  }

  private resolveY(prevBottom: number): void {
    const p = this.p;
    const leftTx = Math.floor((p.x + 2) / TILE);
    const rightTx = Math.floor((p.x + p.w - 2) / TILE);

    if (p.vy >= 0) {
      const botTy = Math.floor((p.y + p.h) / TILE);
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const id = this.getTile(tx, botTy);
        const tileTop = botTy * TILE;
        const solidGround = this.isSolid(id);
        const oneWay = (id === 2 || id === 7) && p.dropT <= 0 && prevBottom <= tileTop + 7;
        if (solidGround || oneWay) {
          p.y = tileTop - p.h;
          p.vy = 0;
          p.grounded = true;
          if (id === 7) this.triggerCrumble(tx, botTy);
          break;
        }
      }
      // Plataformas móviles
      if (!p.grounded && p.dropT <= 0) {
        for (const pl of this.platforms) {
          if (
            p.x + p.w > pl.x + 2 &&
            p.x < pl.x + pl.w - 2 &&
            prevBottom <= pl.y + 8 &&
            p.y + p.h >= pl.y
          ) {
            p.y = pl.y - p.h;
            p.vy = 0;
            p.grounded = true;
            break;
          }
        }
      }
    } else {
      // Colisión con el techo + activar bloques desde abajo
      const topTy = Math.floor(p.y / TILE);
      let hit = false;
      for (let tx = leftTx; tx <= rightTx; tx++) {
        const id = this.getTile(tx, topTy);
        if (this.isSolid(id)) {
          hit = true;
          this.hitBlock(tx, topTy);
        }
      }
      if (hit) {
        // Suave corrección de esquinas si solo rozamos 5px del borde
        const centerTx = Math.floor((p.x + p.w / 2) / TILE);
        const centerSolid = this.isSolid(this.getTile(centerTx, topTy));
        if (!centerSolid) {
          if (this.isSolid(this.getTile(leftTx, topTy)) && !this.isSolid(this.getTile(rightTx, topTy))) {
            p.x = (leftTx + 1) * TILE + 0.5;
            return;
          }
          if (this.isSolid(this.getTile(rightTx, topTy)) && !this.isSolid(this.getTile(leftTx, topTy))) {
            p.x = rightTx * TILE - p.w - 0.5;
            return;
          }
        }
        p.y = (topTy + 1) * TILE + 0.01;
        p.vy = 20;
      }
    }
  }

  private triggerCrumble(tx: number, ty: number): void {
    const idx = ty * this.level.cols + tx;
    if (this.crumbles.has(idx)) return;
    this.crumbles.set(idx, { idx, tx, ty, phase: "shaking", t: 0.48 });
  }

  private checkStrikeHits(): void {
    const p = this.p;
    const reach = 38;
    const sx = p.facing > 0 ? p.x + p.w - 2 : p.x - reach + 2;
    const sy = p.y - 12;
    const sw = reach;
    const sh = p.h + 14;

    // 1. Bloques rompibles o «?» o calavera frente a Clara
    const tx0 = Math.floor(sx / TILE);
    const tx1 = Math.floor((sx + sw) / TILE);
    const ty0 = Math.floor(sy / TILE);
    const ty1 = Math.floor((sy + sh - 4) / TILE);
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const key = ty * this.level.cols + tx;
        if (p.strikeDidHit.has(key)) continue;
        const id = this.getTile(tx, ty);
        if (id === 3 || id === 4 || id === 5) {
          p.strikeDidHit.add(key);
          this.hitBlock(tx, ty);
        }
      }
    }

    // 2. Desviar proyectiles enemigos
    for (const pr of this.projectiles) {
      if (!pr.friendly && overlap(sx, sy, sw, sh, pr.x - 8, pr.y - 8, 16, 16)) {
        pr.friendly = true;
        pr.vx = p.facing * 320;
        pr.vy = -40;
        pr.life = 0.7;
        this.addScore(50);
        this.burst(pr.x, pr.y, 10, ["#f7dc84", "#fdf6e3"], 180);
        this.floater(pr.x, pr.y - 12, "¡Devuelto!", "#27456f", 13);
        sfx.coin();
      }
    }

    // 3. Golpear enemigos
    for (const en of this.enemies) {
      if (!en.alive || en.hurtT > 0) continue;
      if (overlap(sx, sy, sw, sh, en.x, en.y, en.w, en.h)) {
        // El Piquero bloquea un golpe frontal simple si mira hacia Clara
        if (en.type === "piquero" && Math.sign(p.x - en.x) === en.dir && !p.goldQuill) {
          en.hurtT = 0.2;
          en.vx = p.facing * 90;
          this.burst(en.x + en.w / 2, en.y + 12, 8, ["#f7dc84", "#ffffff"], 140);
          this.floater(en.x + en.w / 2, en.y - 8, "¡Escudo!", "#7a1f2b", 12);
          sfx.blockBump();
        } else {
          this.damageEnemy(en, 1, p.facing);
        }
      }
    }

    // 4. Golpear Jefe
    const b = this.boss;
    if (b.active && !b.defeated && b.state !== "vanish" && b.state !== "dying" && b.hurtT <= 0) {
      if (overlap(sx, sy, sw, sh, b.x, b.y, b.w, b.h)) {
        this.damageBoss(1);
      }
    }
  }

  private hitBlock(tx: number, ty: number): void {
    const id = this.getTile(tx, ty);
    const cx = tx * TILE + TILE / 2;
    const cy = ty * TILE + TILE / 2;

    if (id === 3) {
      // Rompe bloque agrietado
      this.setTile(tx, ty, 0);
      sfx.blockBreak();
      this.trauma = Math.min(1, this.trauma + 0.25);
      this.burst(cx, cy, 14, ["#b5693c", "#df9a64", "#723a1d", "#fdf6e3"], 230, true);
      this.addScore(25);
      if (Math.random() < 0.28) {
        this.coins.push({ x: cx, y: cy - 6, taken: false });
      }
    } else if (id === 4) {
      // Bloque «?»
      this.setTile(tx, ty, 6);
      this.bumps.push({ tx, ty, t: 1 });
      const idx = ty * this.level.cols + tx;
      const loot = this.level.loot.get(idx) ?? "coins";
      if (loot === "coins") {
        sfx.coin();
        this.addScore(150);
        this.burst(cx, cy - 12, 14, ["#f7dc84", "#d6a02e", "#fdf6e3"], 200, true);
        this.floater(cx, cy - 22, "+150", "#b87a14", 15);
      } else {
        sfx.blockBump();
        this.powerups.push({ type: loot, x: cx, y: ty * TILE - 12, vy: -190, life: 16 });
        this.burst(cx, cy - 10, 10, ["#f7dc84", "#fdf6e3"], 150, true);
      }
    } else if (id === 5) {
      // Bloque de calavera estilo Alex Kidd: se rompe, suelta 2 monedas ¡y despierta un sello fantasma!
      this.setTile(tx, ty, 0);
      sfx.skullTrap();
      this.trauma = Math.min(1, this.trauma + 0.35);
      this.burst(cx, cy, 16, ["#45232b", "#d92b32", "#f2dfc0"], 240);
      this.floater(cx, cy - 18, "¡Sello suelto!", "#c2262f", 13);
      this.coins.push({ x: cx - 12, y: cy, taken: false }, { x: cx + 12, y: cy, taken: false });
      this.enemies.push(this.makeEnemy("mask", tx * TILE, (ty - 1) * TILE));
    }
  }

  private hurtPlayer(pushDir: number, fellInPit = false): void {
    const p = this.p;
    if (p.inv > 0 && !fellInPit) return;

    if (!fellInPit && p.shield) {
      // El Escudo de Seda absorbe el golpe
      p.shield = false;
      p.inv = 1.4;
      p.vy = -240;
      p.vx = pushDir * 140;
      this.trauma = Math.min(1, this.trauma + 0.4);
      this.ring(p.x + p.w / 2, p.y + p.h / 2, "#52a8e8");
      this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, ["#52a8e8", "#fdf6e3"], 220);
      this.floater(p.x + p.w / 2, p.y - 10, "¡Capa rota!", "#27456f", 13);
      sfx.blockBreak();
      return;
    }

    p.hearts--;
    p.goldQuill = false; // Pierde la Tinta de Oro al recibir daño (como en los clásicos)
    p.inv = 1.6;
    this.combo = 0;
    this.trauma = 0.85;
    this.freeze = 0.07;
    this.redFlash = 0.85;
    sfx.hurt();
    this.burst(p.x + p.w / 2, p.y + p.h / 2, 18, ["#c2262f", "#fdf6e3", "#7a1f2b"], 240);

    if (p.hearts <= 0) {
      this.lives--;
      if (this.lives <= 0) {
        sfx.stopMusic();
        sfx.gameOver();
        this.setStatus("over");
        this.cb.onGameOver({
          score: Math.round(this.score),
          portraits: this.totalPortraitsRun,
          stageReached: this.highestStageReached,
          completed: false,
          enemiesDefeated: this.enemiesDefeated,
        });
      } else {
        // Reaparece en el Farol encendido (o inicio de la fase)
        this.loadStage(this.stageIndex, true);
        sfx.playMusic(this.meta.theme as MusicTrack);
        this.floater(p.x + p.w / 2, p.y - 14, this.checkpointLit ? "Desde el Farol" : "Intento nuevo", "#7a1f2b", 14);
      }
      return;
    }

    if (fellInPit) {
      p.x = p.safeX;
      p.y = p.safeY - 12;
      p.vx = 0;
      p.vy = -160;
    } else {
      p.vx = pushDir * 170;
      p.vy = -260;
      p.grounded = false;
    }
  }

  /* ---------------- Coleccionables y Retratos ---------------- */

  private updatePickups(dt: number): void {
    const p = this.p;

    for (const c of this.coins) {
      if (c.taken) continue;
      if (overlap(p.x - 4, p.y - 4, p.w + 8, p.h + 8, c.x - 8, c.y - 8, 16, 16)) {
        c.taken = true;
        sfx.coin();
        this.addScore(50);
        this.burst(c.x, c.y, 8, ["#f7dc84", "#d6a02e", "#fdf6e3"], 140);
        this.floater(c.x, c.y - 10, "+50", "#9c6b12", 12);
      }
    }

    for (const pt of this.portraits) {
      if (pt.taken) continue;
      if (overlap(p.x - 6, p.y - 6, p.w + 12, p.h + 12, pt.x - 13, pt.y - 15, 26, 30)) {
        pt.taken = true;
        this.stagePortraitsFound++;
        this.totalPortraitsRun++;
        const woman = WOMAN_BY_ID[pt.womanId];
        if (woman) {
          const isNew = !this.cb.getUnlocked().includes(woman.id);
          this.cb.onPortrait(woman, isNew);
        }
        if (p.hearts < MAX_HEARTS) p.hearts++;
        this.addScore(500);
        this.goldFlash = 0.7;
        this.freeze = 0.06;
        this.ring(pt.x, pt.y, "#f7dc84");
        this.burst(pt.x, pt.y, 28, ["#f7dc84", "#d6a02e", "#fdf6e3", "#27456f"], 270);
        this.floater(pt.x, pt.y - 18, "+500 ¡Retrato!", "#9c6b12", 15);
        sfx.portrait();
      }
    }

    // Reliquias históricas interactivas (atriles)
    for (const rl of this.relics) {
      if (rl.discovered) continue;
      if (overlap(p.x - 6, p.y - 4, p.w + 12, p.h + 6, rl.x - 15, rl.footY - 38, 30, 38)) {
        rl.discovered = true;
        const relic = RELIC_BY_ID[rl.relicId];
        if (relic) {
          const isNew = !this.cb.getUnlockedRelics().includes(relic.id);
          this.cb.onRelic(relic, isNew);
        }
        this.addScore(300);
        this.goldFlash = 0.45;
        this.ring(rl.x, rl.footY - 24, "#f7dc84");
        this.burst(rl.x, rl.footY - 24, 22, ["#f7dc84", "#fdf6e3", "#27456f", "#c9982f"], 230);
        this.floater(rl.x, rl.footY - 40, "+300 ¡Saber!", "#27456f", 14);
        sfx.checkpoint();
      }
    }

    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const pu = this.powerups[i];
      pu.life -= dt;
      if (pu.life <= 0) {
        this.powerups.splice(i, 1);
        continue;
      }
      pu.vy = Math.min(320, pu.vy + 700 * dt);
      pu.y += pu.vy * dt;
      const ty = Math.floor((pu.y + 10) / TILE);
      const tx = Math.floor(pu.x / TILE);
      if (pu.vy > 0 && (this.isSolid(this.getTile(tx, ty)) || this.getTile(tx, ty) === 2)) {
        pu.y = ty * TILE - 10;
        pu.vy = 0;
      }
      if (overlap(p.x - 4, p.y - 4, p.w + 8, p.h + 8, pu.x - 11, pu.y - 11, 22, 22)) {
        this.powerups.splice(i, 1);
        sfx.powerup();
        this.goldFlash = 0.4;
        this.burst(pu.x, pu.y, 18, ["#f7dc84", "#52a8e8", "#fdf6e3"], 200);
        if (pu.type === "heart") {
          p.hearts = Math.min(MAX_HEARTS, p.hearts + 1);
          this.floater(pu.x, pu.y - 14, "+1 Corazón", "#c2262f", 14);
        } else if (pu.type === "shield") {
          p.shield = true;
          this.floater(pu.x, pu.y - 14, "¡Capa de Seda!", "#27456f", 14);
        } else if (pu.type === "goldQuill") {
          p.goldQuill = true;
          this.floater(pu.x, pu.y - 14, "¡Tinta de Oro!", "#9c6b12", 14);
        }
        this.addScore(200);
      }
    }
  }

  /* ---------------- Enemigos ---------------- */

  private updateEnemies(dt: number): void {
    const p = this.p;
    for (const en of this.enemies) {
      if (!en.alive) continue;
      // Solo simular enemigos cercanos a la cámara
      if (Math.abs(en.x - this.camX - VIEW_W / 2) > VIEW_W * 0.95) continue;

      en.hurtT = Math.max(0, en.hurtT - dt);

      if (en.type === "alguacil" || en.type === "piquero") {
        const spd = en.type === "piquero" ? 44 : 58;
        en.vx = en.dir * spd;
        en.x += en.vx * dt;
        // Girar en límites de patrulla o paredes
        const frontTx = Math.floor((en.dir > 0 ? en.x + en.w + 2 : en.x - 2) / TILE);
        const midTy = Math.floor((en.y + en.h / 2) / TILE);
        const footTy = Math.floor((en.y + en.h + 3) / TILE);
        const wallAhead = this.isSolid(this.getTile(frontTx, midTy));
        const floorAhead = this.isSolid(this.getTile(frontTx, footTy)) || this.getTile(frontTx, footTy) === 2;
        if (en.x < en.patrolMin || en.x > en.patrolMax || wallAhead || !floorAhead) {
          en.dir = en.dir > 0 ? -1 : 1;
        }
      } else if (en.type === "crow") {
        en.phase += dt * 3;
        const dist = p.x - en.x;
        if (Math.abs(dist) < 230) {
          en.dir = dist >= 0 ? 1 : -1;
          en.x += en.dir * 86 * dt;
          en.y = en.homeY + Math.sin(en.phase * 1.4) * 26;
        } else {
          en.y = en.homeY + Math.sin(en.phase) * 12;
        }
      } else if (en.type === "mask") {
        en.phase += dt * 2.4;
        en.x = en.homeX + Math.sin(en.phase * 0.7) * 58;
        en.y = en.homeY + Math.cos(en.phase * 1.4) * 24;
        en.dir = p.x >= en.x ? 1 : -1;
      } else if (en.type === "censor") {
        en.dir = p.x >= en.x ? 1 : -1;
        en.timer -= dt;
        if (en.timer <= 0 && Math.abs(p.x - en.x) < 280) {
          en.timer = 2.1;
          this.projectiles.push({
            x: en.x + en.w / 2 + en.dir * 10,
            y: en.y + 12,
            vx: en.dir * 165,
            vy: -35,
            friendly: false,
            life: 2.2,
            gravity: 90,
          });
        }
      } else if (en.type === "flame") {
        en.timer -= dt;
        en.vy += 640 * dt;
        en.y += en.vy * dt;
        if (en.y > en.homeY + 18) {
          en.y = en.homeY + 18;
          en.vy = 0;
          if (en.timer <= 0) {
            en.vy = -370;
            en.timer = 1.9;
          }
        }
      }

      // Colisión con Clara
      if (overlap(p.x + 2, p.y + 2, p.w - 4, p.h - 4, en.x + 2, en.y + 2, en.w - 4, en.h - 4)) {
        // Pisotón desde arriba (excepto sobre llamas)
        const stomping = p.vy > 40 && p.y + p.h - p.vy * dt <= en.y + 11 && en.type !== "flame";
        if (stomping) {
          p.vy = -355;
          p.sx = 1.18;
          p.sy = 0.84;
          this.damageEnemy(en, 1, p.facing);
        } else {
          this.hurtPlayer(p.x + p.w / 2 < en.x + en.w / 2 ? -1 : 1);
        }
      }
    }
  }

  private damageEnemy(en: EnemyEnt, dmg: number, pushDir: number): void {
    en.hp -= dmg;
    en.hurtT = 0.25;
    en.x += pushDir * 10;
    if (en.hp <= 0) {
      en.alive = false;
      this.enemiesDefeated++;
      this.combo++;
      this.comboT = 3.0;
      const mult = Math.min(4, 1 + Math.floor(this.combo / 2));
      const base = en.type === "piquero" ? 300 : en.type === "censor" ? 250 : 150;
      const pts = base * mult;
      this.addScore(pts);
      this.trauma = Math.min(1, this.trauma + 0.25);
      this.freeze = 0.04;
      sfx.enemyDefeat();
      this.burst(en.x + en.w / 2, en.y + en.h / 2, 18, ["#3b232c", "#d92b32", "#f7dc84", "#fdf6e3"], 230);
      this.floater(en.x + en.w / 2, en.y - 6, mult > 1 ? `+${pts} ×${mult}` : `+${pts}`, "#7a1f2b", 14);
    } else {
      sfx.enemyHit();
      this.trauma = Math.min(1, this.trauma + 0.14);
      this.burst(en.x + en.w / 2, en.y + en.h / 2, 8, ["#f7dc84", "#d92b32"], 160);
    }
  }

  /* ---------------- Jefes de Fase (5 patrones únicos) ---------------- */

  private updateBoss(dt: number): void {
    const b = this.boss;
    const p = this.p;
    if (b.defeated) return;

    // Activar Duelo de Ingenio / Jefe al entrar en su arena
    if (!b.active) {
      if (p.x >= b.triggerX) {
        if (!b.duelDone) {
          this.clearInput();
          p.vx = 0;
          this.camX = clamp((b.arenaLeft + b.arenaRight - VIEW_W) / 2, 0, Math.max(0, this.level.cols * TILE - VIEW_W));
          sfx.pauseMusic(true);
          this.setStatus("bossDuel");
          this.cb.onBossDuel(this.meta);
          return;
        }
        b.active = true;
        b.tauntT = 2.6;
        sfx.playMusic("boss");
        this.trauma = 0.45;
      }
      return;
    }

    b.hurtT = Math.max(0, b.hurtT - dt);
    b.tauntT = Math.max(0, b.tauntT - dt);

    if (b.state === "dying") {
      b.timer -= dt;
      if (Math.random() < dt * 24) {
        this.burst(b.x + rand(0, b.w), b.y + rand(0, b.h), 10, ["#f7dc84", "#fdf6e3", "#d92b32", "#27456f"], 280);
      }
      if (b.timer <= 0) {
        b.defeated = true;
        this.goldFlash = 1;
        this.trauma = 0.9;
        this.ring(b.x + b.w / 2, b.y + b.h / 2, "#f7dc84");
        this.burst(b.x + b.w / 2, b.y + b.h / 2, 55, ["#f7dc84", "#d6a02e", "#fdf6e3", "#7a1f2b"], 360);
        const bossPts = 1000 + b.stageIndex * 350;
        this.addScore(bossPts);
        this.floater(b.x + b.w / 2, b.y, `+${bossPts} ¡Vencido!`, "#9c6b12", 18);
        sfx.stopMusic();
        sfx.stageClear();
        this.clearDelayT = 1.65;
      }
      return;
    }

    const phase = b.stageIndex === 4 ? (b.hp <= 3 ? 3 : b.hp <= 6 ? 2 : 1) : b.hp <= Math.ceil(b.maxHp / 2) ? 2 : 1;
    const floorY = 11 * TILE - b.h;
    const speedBoost = 1 + (phase - 1) * 0.22;

    b.timer -= dt;
    const facePlayer = () => {
      b.dir = p.x + p.w / 2 >= b.x + b.w / 2 ? 1 : -1;
    };

    if (b.state === "idle") {
      facePlayer();
      b.vx *= 0.85;
      if (b.stageIndex === 4 && phase === 3) {
        // Fase 3 del Gran Censor: levita sobre los balcones
        b.y += (5.2 * TILE - b.y) * Math.min(1, dt * 4);
        b.vy = 0;
      }
      if (b.timer <= 0) {
        b.state = "telegraph";
        b.timer = Math.max(0.38, 0.62 - (phase - 1) * 0.1);
        b.attackIndex = (b.attackIndex + 1) % 3;
      }
    } else if (b.state === "telegraph") {
      facePlayer();
      b.vx = 0;
      if (b.timer <= 0) {
        if (b.stageIndex === 3 && b.attackIndex === 2) {
          // Crítico Enmascarado: desaparece y reaparece en el lado opuesto
          b.state = "vanish";
          b.timer = 0.55;
          this.burst(b.x + b.w / 2, b.y + b.h / 2, 18, ["#401440", "#f7dc84"], 200);
        } else if (b.attackIndex === 0) {
          // Embestida veloz
          b.state = "charge";
          b.vx = b.dir * (200 + b.stageIndex * 18) * speedBoost;
          b.timer = 0.72;
        } else if (b.attackIndex === 1) {
          // Salto con choque de sellos
          b.state = "jump";
          b.vy = -440;
          b.vx = b.dir * 135 * speedBoost;
          b.grounded = false;
          b.timer = 1.1;
        } else {
          // Descarga de sellos de censura
          b.state = "cast";
          b.timer = 0.65;
          this.fireBossVolley(phase);
        }
      }
    } else if (b.state === "charge") {
      if (b.timer <= 0) {
        b.state = "idle";
        b.timer = 0.75 / speedBoost;
      }
    } else if (b.state === "jump") {
      if (b.grounded && b.timer < 0.85) {
        this.trauma = Math.min(1, this.trauma + 0.35);
        sfx.blockBreak();
        // Onda de sellos a ras de suelo
        for (const sd of [-1, 1]) {
          this.projectiles.push({
            x: b.x + b.w / 2,
            y: floorY + b.h - 14,
            vx: sd * (155 + b.stageIndex * 16),
            vy: 0,
            friendly: false,
            life: 2.0,
            gravity: 0,
          });
        }
        b.state = "idle";
        b.timer = 0.75 / speedBoost;
      }
    } else if (b.state === "cast") {
      b.vx *= 0.85;
      if (b.timer <= 0) {
        b.state = "idle";
        b.timer = 0.8 / speedBoost;
      }
    } else if (b.state === "vanish") {
      if (b.timer <= 0) {
        const leftSpot = b.arenaLeft + 2.5 * TILE;
        const rightSpot = b.arenaRight - 3.5 * TILE;
        b.x = p.x > (leftSpot + rightSpot) / 2 ? leftSpot : rightSpot;
        b.y = b.attackIndex % 2 === 0 ? 6 * TILE : floorY;
        this.burst(b.x + b.w / 2, b.y + b.h / 2, 18, ["#f7dc84", "#401440"], 200);
        this.fireBossVolley(phase);
        b.state = "idle";
        b.timer = 1.05; // Reverencia vulnerable
      }
    }

    // Física del jefe
    if (b.state !== "vanish") {
      b.x += b.vx * dt;
      if (b.x < b.arenaLeft + 14) {
        b.x = b.arenaLeft + 14;
        b.vx = Math.abs(b.vx) * 0.6;
        b.dir = 1;
      } else if (b.x > b.arenaRight - b.w - 14) {
        b.x = b.arenaRight - b.w - 14;
        b.vx = -Math.abs(b.vx) * 0.6;
        b.dir = -1;
      }

      if (!(b.stageIndex === 4 && phase === 3)) {
        b.vy = Math.min(MAX_FALL, b.vy + GRAVITY * dt);
        b.y += b.vy * dt;
        if (b.y >= floorY) {
          b.y = floorY;
          b.vy = 0;
          b.grounded = true;
        } else {
          b.grounded = false;
        }
      }

      // Colisión Jefe ↔ Clara
      if (overlap(p.x + 2, p.y + 2, p.w - 4, p.h - 4, b.x + 4, b.y + 4, b.w - 8, b.h - 4)) {
        const stomping = p.vy > 40 && p.y + p.h - p.vy * dt <= b.y + 14;
        if (stomping && b.hurtT <= 0) {
          p.vy = -380;
          this.damageBoss(1);
        } else {
          this.hurtPlayer(p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1);
        }
      }
    }
  }

  private fireBossVolley(phase: number): void {
    const b = this.boss;
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h * 0.45;
    const count = Math.min(4, 1 + Math.floor(b.stageIndex / 2) + (phase >= 2 ? 1 : 0));
    const dx = this.p.x + this.p.w / 2 - cx;
    const dy = this.p.y + this.p.h / 2 - cy;
    const baseAngle = Math.atan2(dy, dx);
    const spd = 175 + b.stageIndex * 14;
    for (let i = 0; i < count; i++) {
      const spread = (i - (count - 1) / 2) * 0.28;
      const a = baseAngle + spread;
      this.projectiles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * spd,
        vy: Math.sin(a) * spd - (b.stageIndex === 2 ? 90 : 0),
        friendly: false,
        life: 2.6,
        gravity: b.stageIndex === 2 ? 220 : 0,
      });
    }
    sfx.strike();
  }

  private damageBoss(dmg: number): void {
    const b = this.boss;
    if (b.hurtT > 0 || b.state === "dying") return;
    b.hp -= dmg;
    b.hurtT = 0.42;
    this.trauma = Math.min(1, this.trauma + 0.42);
    this.freeze = 0.055;
    this.burst(b.x + b.w / 2, b.y + b.h * 0.45, 22, ["#f7dc84", "#d92b32", "#fdf6e3"], 260);
    this.ring(b.x + b.w / 2, b.y + b.h * 0.45, "#f7dc84");

    if (b.hp <= 0) {
      b.hp = 0;
      b.state = "dying";
      b.timer = 1.0;
      b.vx = 0;
      b.vy = 0;
      this.projectiles = [];
      sfx.bossDefeat();
    } else {
      sfx.bossHit();
      this.floater(b.x + b.w / 2, b.y - 8, "¡Golpe!", "#9c6b12", 15);
    }
  }

  private triggerStageClear(): void {
    const bonus = this.p.hearts * 150 + this.stagePortraitsFound * 250;
    this.addScore(bonus);
    this.setStatus("stageClear");
    this.cb.onStageClear({
      stageIndex: this.stageIndex,
      stageScoreBonus: bonus,
      totalScore: Math.round(this.score),
      portraitsInStage: this.stagePortraitsFound,
      portraitsTotalInStage: this.meta.womenIds.length,
      totalPortraits: this.totalPortraitsRun,
      isFinal: this.stageIndex >= STAGES.length - 1,
    });
  }

  private finishVictory(): void {
    sfx.stopMusic();
    sfx.stageClear();
    this.setStatus("victory");
    this.cb.onVictory({
      score: Math.round(this.score),
      portraits: this.totalPortraitsRun,
      stageReached: STAGES.length,
      completed: true,
      enemiesDefeated: this.enemiesDefeated,
    });
  }

  /* ---------------- Proyectiles ---------------- */

  private updateProjectiles(dt: number): void {
    const p = this.p;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const pr = this.projectiles[i];
      pr.life -= dt;
      pr.vy += pr.gravity * dt;
      pr.x += pr.vx * dt;
      pr.y += pr.vy * dt;

      if (pr.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Colisión con baldosas sólidas
      const tx = Math.floor(pr.x / TILE);
      const ty = Math.floor(pr.y / TILE);
      const tid = this.getTile(tx, ty);
      if (this.isSolid(tid)) {
        if (pr.friendly && (tid === 3 || tid === 4 || tid === 5)) {
          this.hitBlock(tx, ty);
        }
        this.burst(pr.x, pr.y, 6, pr.friendly ? ["#f7dc84", "#fdf6e3"] : ["#d92b32", "#360d12"], 120);
        this.projectiles.splice(i, 1);
        continue;
      }

      if (pr.friendly) {
        let consumed = false;
        for (const en of this.enemies) {
          if (!en.alive) continue;
          if (overlap(pr.x - 7, pr.y - 7, 14, 14, en.x, en.y, en.w, en.h)) {
            this.damageEnemy(en, 1, pr.vx >= 0 ? 1 : -1);
            consumed = true;
            break;
          }
        }
        const b = this.boss;
        if (!consumed && b.active && !b.defeated && b.state !== "vanish" && b.state !== "dying") {
          if (overlap(pr.x - 7, pr.y - 7, 14, 14, b.x, b.y, b.w, b.h)) {
            this.damageBoss(1);
            consumed = true;
          }
        }
        if (consumed) this.projectiles.splice(i, 1);
      } else {
        if (overlap(pr.x - 6, pr.y - 6, 12, 12, p.x + 2, p.y + 2, p.w - 4, p.h - 4)) {
          this.hurtPlayer(pr.vx >= 0 ? 1 : -1);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  /* ---------------- Cámara y Efectos ---------------- */

  private updateCamera(dt: number): void {
    const maxX = Math.max(0, this.level.cols * TILE - VIEW_W);
    const maxY = Math.max(0, this.level.rows * TILE - VIEW_H);

    let targetX = this.p.x - VIEW_W * 0.36 + this.p.facing * 26;
    if (this.boss.active && !this.boss.defeated) {
      targetX = (this.boss.arenaLeft + this.boss.arenaRight - VIEW_W) / 2;
    }
    targetX = clamp(targetX, 0, maxX);
    const targetY = clamp(this.p.y - VIEW_H * 0.62, 0, maxY);

    this.camX += (targetX - this.camX) * Math.min(1, dt * 7.5);
    this.camY += (targetY - this.camY) * Math.min(1, dt * 6.5);
  }

  private addScore(pts: number): void {
    this.score += pts;
  }

  private dust(x: number, y: number, vxBase: number, count = 3): void {
    for (let i = 0; i < count; i++) {
      this.spawnPart(x + rand(-5, 5), y - 2, vxBase + rand(-28, 28), rand(-45, -10), rand(0.2, 0.38), rand(2, 4), "#e9d9b4", 60, false);
    }
  }

  private spawnPart(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string, grav: number, rect: boolean): void {
    if (this.parts.length >= MAX_PARTICLES) return;
    this.parts.push({ x, y, vx, vy, life, max: life, size, color, grav, rot: rand(0, 6.28), vr: rand(-8, 8), rect });
  }

  private burst(x: number, y: number, n: number, colors: string[], speed: number, rect = false): void {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(0.25, 1) * speed;
      this.spawnPart(
        x,
        y,
        Math.cos(a) * s,
        Math.sin(a) * s - 55,
        rand(0.32, 0.72),
        rand(2.5, 5.5),
        colors[(Math.random() * colors.length) | 0],
        560,
        rect || i % 2 === 0,
      );
    }
  }

  private ring(x: number, y: number, color: string): void {
    this.rings.push({ x, y, r: 6, grow: 260, life: 0.38, max: 0.38, color });
  }

  private floater(x: number, y: number, text: string, color: string, size: number): void {
    if (this.floaters.length > 20) this.floaters.shift();
    this.floaters.push({ x, y, vy: -52, life: 0.95, max: 0.95, text, color, size });
  }

  private updateFx(dt: number): void {
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const q = this.parts[i];
      q.life -= dt;
      if (q.life <= 0) {
        this.parts[i] = this.parts[this.parts.length - 1];
        this.parts.pop();
        continue;
      }
      q.vy += q.grav * dt;
      q.x += q.vx * dt;
      q.y += q.vy * dt;
      q.rot += q.vr * dt;
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.y += f.vy * dt;
      f.vy *= 0.94;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    for (let i = this.rings.length - 1; i >= 0; i--) {
      const r = this.rings[i];
      r.life -= dt;
      r.r += r.grow * dt;
      r.grow *= 0.92;
      if (r.life <= 0) this.rings.splice(i, 1);
    }
  }

  /* ================================================================ */
  /* Renderizado (640×360 escalado limpiamente)                       */
  /* ================================================================ */

  render(): void {
    const ctx = this.ctx;
    const sx = this.canvas.width / VIEW_W;
    const sy = this.canvas.height / VIEW_H;
    ctx.setTransform(sx, 0, 0, sy, 0, 0);

    // Temblor de pantalla
    const sh = this.trauma * this.trauma * (this.calm ? 0.25 : 1);
    const ox = sh * 9 * Math.sin(this.clock * 78);
    const oy = sh * 7 * Math.cos(this.clock * 91);

    // 1. Fondo panorámico ilustrado con paralaje suave y atmósfera viva
    const maxCamX = Math.max(1, this.level.cols * TILE - VIEW_W);
    const maxCamY = Math.max(1, this.level.rows * TILE - VIEW_H);
    drawBackdrop(ctx, this.meta, this.camX, this.clock, maxCamX, this.camY, maxCamY);

    // 2. Mundo en coordenadas de cámara
    ctx.save();
    ctx.translate(Math.round(-this.camX + ox), Math.round(-this.camY + oy));

    // Escenografía histórica en el mundo (detrás de las baldosas y de Clara)
    for (const pr of this.props) {
      const px = pr.tx * TILE + TILE / 2;
      if (px < this.camX - 50 || px > this.camX + VIEW_W + 50) continue;
      drawWorldProp(ctx, pr.kind, px, (pr.ty + 1) * TILE, this.meta, this.clock);
    }

    // Baldosas visibles
    const c0 = Math.max(0, Math.floor(this.camX / TILE) - 1);
    const c1 = Math.min(this.level.cols - 1, Math.ceil((this.camX + VIEW_W) / TILE) + 1);
    for (let ty = 0; ty < this.level.rows; ty++) {
      for (let tx = c0; tx <= c1; tx++) {
        const id = this.getTile(tx, ty);
        if (id === 0) continue;
        let bumpY = 0;
        for (const bp of this.bumps) {
          if (bp.tx === tx && bp.ty === ty) bumpY = -Math.sin(bp.t * Math.PI) * 7;
        }
        const cr = this.crumbles.get(ty * this.level.cols + tx);
        drawTile(ctx, id, tx * TILE, ty * TILE, this.meta, this.clock, bumpY, cr?.phase === "shaking" ? 1 : 0);
      }
    }

    // Barrera mágica del jefe cuando la arena está cerrada
    if (this.boss.active && !this.boss.defeated) {
      ctx.fillStyle = "rgba(194,38,47,0.32)";
      ctx.fillRect(this.boss.arenaLeft - 4, 0, 8, 11 * TILE);
      ctx.strokeStyle = "#f7dc84";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(this.boss.arenaLeft, 0);
      ctx.lineTo(this.boss.arenaLeft, 11 * TILE);
      ctx.stroke();
    }

    // Plataformas móviles
    for (const pl of this.platforms) {
      if (pl.x + pl.w < this.camX - 32 || pl.x > this.camX + VIEW_W + 32) continue;
      drawMovingPlatform(ctx, pl.x, pl.y, pl.w, this.meta);
    }

    // Farol de control
    drawCheckpoint(
      ctx,
      this.level.checkpoint.tx * TILE + TILE / 2,
      (this.level.checkpoint.ty + 1) * TILE,
      this.checkpointLit,
      this.clock,
    );

    // Monedas
    for (const c of this.coins) {
      if (c.taken || c.x < this.camX - 24 || c.x > this.camX + VIEW_W + 24) continue;
      drawCoin(ctx, c.x, c.y, this.clock);
    }

    // Reliquias históricas interactivas
    for (const rl of this.relics) {
      if (rl.x < this.camX - 40 || rl.x > this.camX + VIEW_W + 40) continue;
      const relic = RELIC_BY_ID[rl.relicId];
      if (relic) drawRelicPickup(ctx, relic.kind, rl.x, rl.footY, this.clock, rl.discovered);
    }

    // Retratos históricos
    for (const pt of this.portraits) {
      if (pt.taken || pt.x < this.camX - 32 || pt.x > this.camX + VIEW_W + 32) continue;
      const w = WOMAN_BY_ID[pt.womanId];
      drawPortraitPickup(ctx, pt.x, pt.y, w?.tint ?? "#27456f", this.clock);
    }

    // Poderes
    for (const pu of this.powerups) {
      drawPowerup(ctx, pu.type, pu.x, pu.y, this.clock);
    }

    // Enemigos
    for (const en of this.enemies) {
      if (!en.alive || en.x + en.w < this.camX - 40 || en.x > this.camX + VIEW_W + 40) continue;
      drawEnemy(ctx, en.type, en.x, en.y, en.w, en.h, en.dir, this.clock, en.hurtT);
    }

    // Jefe (visible también durante el Duelo de Ingenio previo al combate)
    if ((this.boss.active || this.status === "bossDuel") && !this.boss.defeated && this.boss.state !== "vanish") {
      drawBoss(
        ctx,
        this.boss.stageIndex,
        this.boss.x,
        this.boss.y,
        this.boss.w,
        this.boss.h,
        this.boss.dir,
        this.clock,
        this.boss.hurtT,
        this.boss.state === "telegraph" ? 1 : 0,
      );
    }

    // Proyectiles
    for (const pr of this.projectiles) {
      drawProjectile(ctx, pr.x, pr.y, pr.friendly, this.clock);
    }

    // Clara
    drawClara(ctx, { ...this.p, strikeMax: STRIKE_DUR }, this.clock);

    // Anillos de choque
    for (const r of this.rings) {
      const a = clamp(r.life / r.max, 0, 1);
      ctx.globalAlpha = a;
      ctx.strokeStyle = r.color;
      ctx.lineWidth = 2.5 * a;
      ctx.beginPath();
      ctx.arc(r.x, r.y, r.r, 0, 6.2832);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Partículas
    for (const q of this.parts) {
      const a = clamp(q.life / q.max, 0, 1);
      ctx.globalAlpha = a < 0.4 ? a / 0.4 : 1;
      ctx.fillStyle = q.color;
      if (q.rect) {
        ctx.save();
        ctx.translate(q.x, q.y);
        ctx.rotate(q.rot);
        ctx.fillRect(-q.size / 2, -q.size / 2, q.size, q.size);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.size * 0.55, 0, 6.2832);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // Textos flotantes
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const f of this.floaters) {
      const a = clamp(f.life / f.max, 0, 1);
      ctx.globalAlpha = a < 0.35 ? a / 0.35 : 1;
      ctx.font = `bold ${f.size}px ${FONT_SC}`;
      ctx.lineWidth = 3;
      ctx.strokeStyle = "rgba(253,246,227,0.95)";
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    ctx.restore();

    // Agua del Mar del Sur en primer plano (Fase 3): lamiendo la línea de flotación del galeón
    if (this.level.hasWater) {
      drawWater(ctx, this.camX, 11.82 * TILE - this.camY, this.clock);
    }

    // 3. HUD en partida
    if (this.status === "playing" || this.status === "bossDuel" || this.status === "stageClear") {
      this.drawHud(ctx);
    }

    // Destellos de impacto / rescate
    if (this.goldFlash > 0) {
      ctx.fillStyle = `rgba(255,236,160,${this.goldFlash * 0.25})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
    if (this.redFlash > 0) {
      ctx.fillStyle = `rgba(190,26,36,${this.redFlash * 0.28})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    // Barra superior translúcida de pergamino oscuro
    ctx.fillStyle = "rgba(28,13,18,0.72)";
    ctx.fillRect(0, 0, VIEW_W, 34);
    ctx.fillStyle = "#c9982f";
    ctx.fillRect(0, 33, VIEW_W, 1.5);

    // Corazones
    for (let i = 0; i < MAX_HEARTS; i++) {
      const on = i < this.p.hearts;
      const hx = 18 + i * 21;
      const hy = 17;
      ctx.fillStyle = on ? "#e0313a" : "rgba(255,255,255,0.16)";
      ctx.strokeStyle = "#1f1216";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(hx, hy + 6);
      ctx.bezierCurveTo(hx - 10, hy - 1, hx - 5, hy - 8, hx, hy - 2);
      ctx.bezierCurveTo(hx + 5, hy - 8, hx + 10, hy - 1, hx, hy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    // Indicadores de Escudo / Pluma de Oro + Vidas
    let ix = 86;
    if (this.p.shield) {
      ctx.fillStyle = "#52a8e8";
      ctx.fillRect(ix, 10, 10, 13);
      ctx.strokeStyle = "#fdf6e3";
      ctx.strokeRect(ix, 10, 10, 13);
      ix += 15;
    }
    if (this.p.goldQuill) {
      ctx.fillStyle = "#f7dc84";
      ctx.beginPath();
      ctx.arc(ix + 5, 16, 5.5, 0, 6.2832);
      ctx.fill();
      ix += 15;
    }

    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = `13px ${FONT_SC}`;
    ctx.fillStyle = "#f1e2bf";
    ctx.fillText(`×${this.lives}`, ix + 3, 17);

    // Centro: Fase actual y retratos hallados (con margen amplio respecto a vidas y puntos)
    ctx.textAlign = "center";
    ctx.font = `12px ${FONT_SC}`;
    ctx.fillStyle = "#f7dc84";
    ctx.fillText(
      `FASE ${this.meta.roman} · ${this.meta.place.toUpperCase()} (${this.meta.year})  ◈ ${this.stagePortraitsFound}/${this.meta.womenIds.length}`,
      VIEW_W * 0.52,
      17,
    );

    // Derecha (dejando hueco a los botones DOM de sonido y pausa)
    ctx.textAlign = "right";
    ctx.font = `15px ${FONT_SC}`;
    ctx.fillStyle = "#fdf6e3";
    ctx.fillText(String(Math.round(this.shownScore)).padStart(6, "0"), VIEW_W - 86, 17);

    // Barra de progreso de la fase (fina línea dorada bajo el HUD)
    const prog = clamp(this.p.x / (this.boss.triggerX || 1), 0, 1);
    ctx.fillStyle = "rgba(247,220,132,0.22)";
    ctx.fillRect(0, 34.5, VIEW_W, 2.5);
    ctx.fillStyle = "#f7dc84";
    ctx.fillRect(0, 34.5, VIEW_W * prog, 2.5);

    // Cartel de entrada de fase
    if (this.stageBannerT > 0) {
      const a = clamp(Math.min(this.stageBannerT / 0.45, (2.6 - this.stageBannerT) / 0.35), 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = "rgba(28,13,18,0.82)";
      ctx.fillRect(VIEW_W / 2 - 190, 62, 380, 58);
      ctx.strokeStyle = "#c9982f";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(VIEW_W / 2 - 188, 64, 376, 54);
      ctx.textAlign = "center";
      ctx.fillStyle = "#f7dc84";
      ctx.font = `12px ${FONT_SC}`;
      ctx.fillText(`CAPÍTULO ${this.meta.roman} · ${this.meta.place} (${this.meta.year})`, VIEW_W / 2, 79);
      ctx.fillStyle = "#fdf6e3";
      ctx.font = `22px ${FONT_SC}`;
      ctx.fillText(this.meta.title, VIEW_W / 2, 102);
      ctx.restore();
    }

    // Barra de vida y provocación del Jefe (cajas dimensionadas al texto)
    const b = this.boss;
    if (b.active && !b.defeated) {
      const label = `${this.meta.bossName} · ${this.meta.bossTitle}`;
      ctx.textAlign = "center";
      ctx.font = `12px ${FONT_SC}`;
      const labelW = ctx.measureText(label).width;
      const boxW = Math.min(VIEW_W - 24, Math.max(268, labelW + 28));
      const bw = Math.min(280, boxW - 28);
      const bx = (VIEW_W - bw) / 2;
      const by = VIEW_H - 34;
      ctx.fillStyle = "rgba(28,13,18,0.88)";
      ctx.fillRect((VIEW_W - boxW) / 2, by - 16, boxW, 36);
      ctx.strokeStyle = "#c9982f";
      ctx.lineWidth = 1.2;
      ctx.strokeRect((VIEW_W - boxW) / 2 + 1, by - 15, boxW - 2, 34);
      ctx.fillStyle = "#f7dc84";
      ctx.fillText(label, VIEW_W / 2, by - 5);
      ctx.fillStyle = "#3b141c";
      ctx.fillRect(bx, by + 4, bw, 9);
      ctx.fillStyle = "#d92b32";
      ctx.fillRect(bx, by + 4, bw * (b.hp / b.maxHp), 9);
      ctx.fillStyle = "#ff857a";
      ctx.fillRect(bx, by + 4, bw * (b.hp / b.maxHp), 3);

      if (b.tauntT > 0) {
        const quote = `«${this.meta.bossTaunt}»`;
        let fs = 14;
        ctx.font = `italic ${fs}px ${FONT}`;
        let tw = ctx.measureText(quote).width;
        if (tw > VIEW_W - 56) {
          fs = Math.max(11, Math.floor((fs * (VIEW_W - 56)) / tw));
          ctx.font = `italic ${fs}px ${FONT}`;
          tw = ctx.measureText(quote).width;
        }
        const qw = Math.min(VIEW_W - 24, tw + 28);
        ctx.fillStyle = "rgba(241,226,191,0.95)";
        ctx.fillRect((VIEW_W - qw) / 2, 50, qw, 30);
        ctx.strokeStyle = "#7a1f2b";
        ctx.lineWidth = 1.5;
        ctx.strokeRect((VIEW_W - qw) / 2, 50, qw, 30);
        ctx.fillStyle = "#24141a";
        ctx.fillText(quote, VIEW_W / 2, 65);
      }
    }
  }
}
