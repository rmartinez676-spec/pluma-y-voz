export interface ScoreEntry {
  id: string;
  name: string;
  score: number;
  portraits: number;
  stageReached: number; // 1..5
  completed: boolean;
  date: number;
}

const K_SCORES = "plumayvoz.adventure.scores.v1";
const K_GALLERY = "plumayvoz.gallery.v1";
const K_RELICS = "plumayvoz.relics.v1";
const K_UNLOCKED_STAGE = "plumayvoz.stage.v1";
const K_NAME = "plumayvoz.name.v1";
const K_MUTED = "plumayvoz.muted.v1";

export const MAX_SCORES = 8;
export const DEFAULT_NAME = "Clara";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getScores(): ScoreEntry[] {
  const list = read<ScoreEntry[]>(K_SCORES, []);
  if (!Array.isArray(list)) return [];
  return list
    .filter((e) => e && typeof e.score === "number" && typeof e.name === "string")
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SCORES);
}

export function addScore(entry: Omit<ScoreEntry, "id" | "date">): {
  scores: ScoreEntry[];
  rank: number;
  id: string;
} {
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const full: ScoreEntry = { ...entry, id, date: Date.now() };
  const list = [...getScores(), full].sort((a, b) => b.score - a.score).slice(0, MAX_SCORES);
  write(K_SCORES, list);
  return { scores: list, rank: list.findIndex((e) => e.id === id), id };
}

export function renameScore(id: string, name: string): ScoreEntry[] {
  const list = getScores().map((e) => (e.id === id ? { ...e, name } : e));
  write(K_SCORES, list);
  return list;
}

export function clearScores(): void {
  write(K_SCORES, []);
}

export function getGallery(): string[] {
  const list = read<string[]>(K_GALLERY, []);
  return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
}

export function unlockWoman(id: string): string[] {
  const list = getGallery();
  if (!list.includes(id)) {
    list.push(id);
    write(K_GALLERY, list);
  }
  return list;
}

export function getRelics(): string[] {
  const list = read<string[]>(K_RELICS, []);
  return Array.isArray(list) ? list.filter((x) => typeof x === "string") : [];
}

export function unlockRelic(id: string): string[] {
  const list = getRelics();
  if (!list.includes(id)) {
    list.push(id);
    write(K_RELICS, list);
  }
  return list;
}

/** Índice máximo de fase desbloqueado (0..4) */
export function getUnlockedStage(): number {
  const n = read<number>(K_UNLOCKED_STAGE, 0);
  if (typeof n !== "number" || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(4, Math.floor(n)));
}

export function unlockStage(index: number): number {
  const next = Math.max(getUnlockedStage(), Math.min(4, Math.floor(index)));
  write(K_UNLOCKED_STAGE, next);
  return next;
}

export function getPlayerName(): string {
  const n = read<string>(K_NAME, DEFAULT_NAME);
  return typeof n === "string" && n.trim() ? n : DEFAULT_NAME;
}

export function setPlayerName(name: string): void {
  write(K_NAME, name);
}

export function getMuted(): boolean {
  return read<boolean>(K_MUTED, false) === true;
}

export function setMuted(m: boolean): void {
  write(K_MUTED, m);
}
