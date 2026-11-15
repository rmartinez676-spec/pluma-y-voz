import { useCallback, useEffect, useRef, useState } from "react";
import { Game, type GameStatus, type RunSummary, type StageClearInfo, type VirtualInput } from "./game/engine";
import { RELICS, STAGES, STORY_PROLOGUE, WOMEN, type Relic, type StageMeta, type Woman } from "./game/data";
import { sfx } from "./game/audio";
import {
  DEFAULT_NAME,
  addScore,
  clearScores,
  getGallery,
  getMuted,
  getPlayerName,
  getRelics,
  getScores,
  getUnlockedStage,
  renameScore,
  setMuted as storeMuted,
  setPlayerName,
  unlockRelic,
  unlockStage,
  unlockWoman,
  type ScoreEntry,
} from "./game/storage";
import { ChaptersPanel, GalleryPanel, HelpPanel, IconPause, IconSound, Medallion, ScoresTable, fmt } from "./components/Panels";
import { GameOver, type Outcome } from "./components/GameOver";
import { StoryMap } from "./components/StoryMap";
import { TouchControls } from "./components/TouchControls";
import { BossDuelModal } from "./components/BossDuelModal";

type MenuView = "main" | "chapters" | "gallery" | "scores" | "help";

type Toast =
  | { kind: "woman"; key: number; woman: Woman; isNew: boolean; leaving: boolean }
  | { kind: "relic"; key: number; relic: Relic; isNew: boolean; leaving: boolean };

function calcViewport(): { w: number; h: number; portrait: boolean } {
  const vv = window.visualViewport;
  const vw = Math.floor(vv?.width ?? window.innerWidth);
  const vh = Math.floor(vv?.height ?? window.innerHeight);
  const portrait = vh > vw * 1.05;
  if (portrait) {
    // En móvil vertical reservamos espacio inferior para los controles táctiles
    const maxCanvasH = Math.max(200, vh - 165);
    const w = vw;
    const h = Math.min(maxCanvasH, Math.round((w * 9) / 16));
    return { w, h, portrait: true };
  }
  // En escritorio o móvil apaisado, marco panorámico 16:9 nítido
  const pad = vw >= 900 ? 24 : 0;
  const availW = Math.max(320, vw - pad);
  const availH = Math.max(200, vh - pad);
  let w = availW;
  let h = Math.round((w * 9) / 16);
  if (h > availH) {
    h = availH;
    w = Math.round((h * 16) / 9);
  }
  w = Math.min(w, 1120);
  h = Math.round((w * 9) / 16);
  return { w, h, portrait: false };
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const unlockedRef = useRef<string[]>(getGallery());
  const relicsRef = useRef<string[]>(getRelics());
  const nameRef = useRef<string>(getPlayerName());
  const stateAtRef = useRef(0);
  const toastTimers = useRef<number[]>([]);

  const [vp, setVp] = useState(calcViewport);
  const [status, setStatus] = useState<GameStatus>("menu");
  const [stageIndex, setStageIndex] = useState(0);
  const [unlockedStage, setUnlockedStage] = useState<number>(getUnlockedStage);
  const [view, setView] = useState<MenuView>("main");
  const [scores, setScores] = useState<ScoreEntry[]>(getScores);
  const [unlocked, setUnlocked] = useState<string[]>(unlockedRef.current);
  const [unlockedRelics, setUnlockedRelics] = useState<string[]>(relicsRef.current);
  const [muted, setMuted] = useState<boolean>(getMuted);
  const [name, setName] = useState<string>(nameRef.current);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [clearInfo, setClearInfo] = useState<StageClearInfo | null>(null);
  const [duelStage, setDuelStage] = useState<StageMeta | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [isTouch, setIsTouch] = useState(() => {
    try {
      return window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    } catch {
      return false;
    }
  });

  const clearToast = useCallback(() => {
    toastTimers.current.forEach((t) => window.clearTimeout(t));
    toastTimers.current = [];
    setToast(null);
  }, []);

  const recordRun = useCallback((summary: RunSummary) => {
    stateAtRef.current = performance.now();
    if (summary.score > 0) {
      const r = addScore({
        name: nameRef.current.trim() || DEFAULT_NAME,
        score: summary.score,
        portraits: summary.portraits,
        stageReached: summary.stageReached,
        completed: summary.completed,
      });
      setScores(r.scores);
      setOutcome({ ...summary, rank: r.rank, entryId: r.rank >= 0 ? r.id : null });
    } else {
      setOutcome({ ...summary, rank: -1, entryId: null });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    sfx.setMuted(getMuted());
    const game = new Game(canvas, {
      onStatus: (s) => {
        setStatus(s);
        setStageIndex(game.stageIndex);
        stateAtRef.current = performance.now();
      },
      getUnlocked: () => unlockedRef.current,
      getUnlockedRelics: () => relicsRef.current,
      onPortrait: (woman, isNew) => {
        unlockedRef.current = unlockWoman(woman.id);
        setUnlocked([...unlockedRef.current]);
        toastTimers.current.forEach((t) => window.clearTimeout(t));
        const key = Date.now();
        setToast({ kind: "woman", key, woman, isNew, leaving: false });
        toastTimers.current = [
          window.setTimeout(() => setToast((t) => (t && t.key === key ? { ...t, leaving: true } : t)), 5400),
          window.setTimeout(() => setToast((t) => (t && t.key === key ? null : t)), 5750),
        ];
      },
      onRelic: (relic, isNew) => {
        relicsRef.current = unlockRelic(relic.id);
        setUnlockedRelics([...relicsRef.current]);
        toastTimers.current.forEach((t) => window.clearTimeout(t));
        const key = Date.now();
        setToast({ kind: "relic", key, relic, isNew, leaving: false });
        toastTimers.current = [
          window.setTimeout(() => setToast((t) => (t && t.key === key ? { ...t, leaving: true } : t)), 5600),
          window.setTimeout(() => setToast((t) => (t && t.key === key ? null : t)), 5950),
        ];
      },
      onBossDuel: (meta) => {
        clearToast();
        setDuelStage(meta);
      },
      onStageClear: (info) => {
        setClearInfo(info);
        const nextIdx = Math.min(STAGES.length - 1, info.stageIndex + 1);
        setUnlockedStage(unlockStage(nextIdx));
      },
      onGameOver: (summary) => recordRun(summary),
      onVictory: (summary) => {
        setUnlockedStage(unlockStage(STAGES.length - 1));
        recordRun(summary);
      },
    });
    gameRef.current = game;
    if (import.meta.env.MODE === "test") (window as unknown as { __game?: Game }).__game = game;
    const z = calcViewport();
    game.resize(z.w, z.h, window.devicePixelRatio || 1);
    game.mount();
    return () => {
      game.destroy();
      gameRef.current = null;
    };
  }, [recordRun, clearToast]);

  useEffect(() => {
    let raf = 0;
    const onResize = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const next = calcViewport();
        setVp((prev) => (prev.w === next.w && prev.h === next.h && prev.portrait === next.portrait ? prev : next));
        gameRef.current?.resize(next.w, next.h, window.devicePixelRatio || 1);
      });
    };
    const onFirstTouch = () => setIsTouch(true);
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
    window.visualViewport?.addEventListener("resize", onResize);
    window.addEventListener("touchstart", onFirstTouch, { passive: true, once: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      window.removeEventListener("touchstart", onFirstTouch);
    };
  }, []);

  /* ---------------- Acciones ---------------- */

  const startStory = useCallback(
    (startIdx = 0) => {
      const g = gameRef.current;
      if (!g) return;
      sfx.unlock();
      sfx.ui();
      clearToast();
      setOutcome(null);
      setClearInfo(null);
      setView("main");
      setConfirmClear(false);
      (document.activeElement as HTMLElement | null)?.blur?.();
      g.startCampaign(startIdx, true);
    },
    [clearToast],
  );

  const enterStage = useCallback(() => {
    sfx.unlock();
    clearToast();
    setClearInfo(null);
    (document.activeElement as HTMLElement | null)?.blur?.();
    gameRef.current?.enterCurrentStage();
  }, [clearToast]);

  const advanceStage = useCallback(() => {
    sfx.unlock();
    sfx.ui();
    clearToast();
    setClearInfo(null);
    (document.activeElement as HTMLElement | null)?.blur?.();
    gameRef.current?.advanceToNextStage();
  }, [clearToast]);

  const retryStage = useCallback(() => {
    sfx.unlock();
    clearToast();
    setOutcome(null);
    setClearInfo(null);
    (document.activeElement as HTMLElement | null)?.blur?.();
    gameRef.current?.retryCurrentStage();
  }, [clearToast]);

  const resumeGame = useCallback(() => {
    sfx.unlock();
    (document.activeElement as HTMLElement | null)?.blur?.();
    gameRef.current?.resume();
  }, []);

  const goMenu = useCallback(() => {
    sfx.ui();
    clearToast();
    setOutcome(null);
    setClearInfo(null);
    setView("main");
    setScores(getScores());
    gameRef.current?.toMenu();
  }, [clearToast]);

  const toggleMute = useCallback(() => {
    sfx.unlock();
    setMuted((m) => {
      const next = !m;
      sfx.setMuted(next);
      storeMuted(next);
      if (!next) sfx.ui();
      return next;
    });
  }, []);

  const openView = useCallback((v: MenuView) => {
    sfx.unlock();
    sfx.ui();
    setConfirmClear(false);
    setView(v);
  }, []);

  const handleTouchInput = useCallback((partial: VirtualInput) => {
    sfx.unlock();
    gameRef.current?.setVirtualInput(partial);
  }, []);

  const finishBossDuel = useCallback((correct: boolean) => {
    sfx.unlock();
    setDuelStage(null);
    gameRef.current?.resolveBossDuel(correct);
  }, []);

  const onNameChange = (value: string) => {
    const clean = value.replace(/\s+/g, " ").slice(0, 16);
    setName(clean);
    const final = clean.trim() || DEFAULT_NAME;
    nameRef.current = final;
    setPlayerName(final);
    if (outcome?.entryId) setScores(renameScore(outcome.entryId, final));
  };

  /* ---------------- Atajos de teclado en pantallas ---------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "INPUT") {
        if (e.key === "Enter" || e.key === "Escape") (t as HTMLInputElement).blur();
        return;
      }
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      const c = e.code;
      const confirm = c === "Enter" || c === "NumpadEnter" || c === "Space";
      if (confirm && t && t.tagName === "BUTTON") return;

      if (c === "KeyM") {
        toggleMute();
        return;
      }

      const elapsed = performance.now() - stateAtRef.current;

      if (status === "menu") {
        if (view !== "main") {
          if (c === "Escape" || c === "Backspace") {
            e.preventDefault();
            openView("main");
          }
        } else if (confirm) {
          e.preventDefault();
          startStory(0);
        }
      } else if (status === "map") {
        if (confirm && elapsed > 220) {
          e.preventDefault();
          enterStage();
        } else if (c === "Escape") {
          goMenu();
        }
      } else if (status === "stageClear") {
        if (confirm && elapsed > 300) {
          e.preventDefault();
          advanceStage();
        }
      } else if (status === "paused") {
        if (confirm) {
          e.preventDefault();
          resumeGame();
        } else if (c === "KeyR") {
          e.preventDefault();
          retryStage();
        }
      } else if (status === "over" || status === "victory") {
        if ((confirm || c === "KeyR") && elapsed > 450) {
          e.preventDefault();
          if (status === "over") retryStage();
          else startStory(0);
        } else if (c === "Escape") {
          goMenu();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [status, view, startStory, enterStage, advanceStage, retryStage, resumeGame, goMenu, toggleMute, openView]);

  const best = scores[0];
  const unlockedCount = WOMEN.filter((w) => unlocked.includes(w.id)).length;
  const relicCount = RELICS.filter((r) => unlockedRelics.includes(r.id)).length;
  const clearedStageMeta = clearInfo ? STAGES[clearInfo.stageIndex] : null;
  const showDockedControls = vp.portrait && (isTouch || status === "playing");

  return (
    <div className="relative flex h-dvh w-full flex-col items-center justify-center overflow-hidden bg-night">
      {/* Encabezado compacto en móvil vertical durante la partida */}
      {vp.portrait && status === "playing" && (
        <div className="flex w-full max-w-[540px] items-center justify-between px-3 pb-2 text-[#f1e2bf]">
          <span className="font-display text-xs uppercase tracking-[0.16em] text-gold-bright">
            Pluma y Voz · Fase {STAGES[stageIndex]?.roman}
          </span>
          <span className="text-xs italic text-[#f1e2bf]/75">{STAGES[stageIndex]?.title}</span>
        </div>
      )}

      {/* Marco del escenario panorámico 16:9 */}
      <div
        className="relative shrink-0 overflow-hidden border border-[#6e4a1c] bg-[#1c0d12] shadow-[0_0_0_2px_#3d0c14,0_20px_70px_rgba(0,0,0,0.75)]"
        style={{ width: vp.w, height: vp.h }}
      >
        <canvas
          ref={canvasRef}
          className="block h-full w-full"
          style={{ touchAction: "none" }}
          aria-label="Pluma y Voz: juego de aventuras sobre mujeres en la Edad Moderna hispana"
          role="img"
        />

        {/* Botones de sonido y pausa en la esquina superior derecha durante la partida */}
        {status === "playing" && (
          <div className="absolute right-2 top-1.5 z-30 flex gap-1.5">
            <button
              type="button"
              className="icon-btn !h-9 !w-9"
              aria-label={muted ? "Activar sonido" : "Silenciar"}
              aria-pressed={muted}
              onClick={(e) => {
                e.currentTarget.blur();
                toggleMute();
              }}
            >
              <IconSound muted={muted} />
            </button>
            <button
              type="button"
              className="icon-btn !h-9 !w-9"
              aria-label="Pausa"
              onClick={(e) => {
                e.currentTarget.blur();
                gameRef.current?.pause();
              }}
            >
              <IconPause />
            </button>
          </div>
        )}

        {/* Notificación de Retrato Histórico o Reliquia descubierta */}
        {toast && status === "playing" && (
          <div className="pointer-events-none absolute inset-x-0 top-11 z-20 flex justify-center px-3" role="status" aria-live="polite">
            <div
              key={toast.key}
              className={`parchment flex w-full max-w-[440px] items-start gap-2.5 rounded-md px-3 py-2 opacity-95 ${
                toast.leaving ? "anim-toast-out" : "anim-toast-in"
              }`}
            >
              {toast.kind === "woman" ? (
                <>
                  <Medallion tint={toast.woman.tint} size={32} />
                  <div className="min-w-0 text-left">
                    <p className="font-display text-[10px] uppercase tracking-[0.16em] text-wine">
                      {toast.isNew ? "Nuevo retrato rescatado" : "Retrato rescatado"} · +500
                    </p>
                    <p className="font-display text-base leading-tight text-ink sm:text-lg">
                      {toast.woman.name} <span className="text-xs italic text-wine">({toast.woman.years})</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-ink sm:text-sm">{toast.woman.fact}</p>
                  </div>
                </>
              ) : (
                <>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#6b4708] bg-lapis font-display text-lg text-gold-bright">
                    ✦
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="font-display text-[10px] uppercase tracking-[0.16em] text-lapis">
                      {toast.isNew ? "Nueva reliquia histórica" : "Reliquia histórica"} · +300
                    </p>
                    <p className="font-display text-base leading-tight text-ink sm:text-lg">
                      {toast.relic.name} <span className="text-xs italic text-lapis">({toast.relic.era})</span>
                    </p>
                    <p className="mt-0.5 text-xs leading-snug text-ink sm:text-sm">{toast.relic.note}</p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Controles táctiles superpuestos en modo apaisado táctil */}
        {status === "playing" && isTouch && !vp.portrait && <TouchControls onInput={handleTouchInput} docked={false} />}
      </div>

      {/* Consola de controles táctiles acoplada debajo en móviles verticales (nunca tapa el lienzo) */}
      {showDockedControls && status === "playing" && (
        <div className="w-full max-w-[540px]">
          <TouchControls onInput={handleTouchInput} docked />
        </div>
      )}

      {/* Barra discreta de ayuda de controles bajo el lienzo en escritorio */}
      {!vp.portrait && status === "playing" && !isTouch && (
        <p className="mt-2 text-center font-display text-xs tracking-wider text-[#f1e2bf]/70">
          ← → Correr · Espacio / ↑ Saltar · X / Shift Golpe de Pluma · ↓+Espacio Bajar pasarela · P Pausa · M Sonido
        </p>
      )}

      {/* Botón de sonido siempre accesible en menús (esquina superior derecha del viewport) */}
      {status !== "playing" && (
        <div className="fixed right-3 top-3 z-40">
          <button
            type="button"
            className="icon-btn !h-10 !w-10"
            aria-label={muted ? "Activar sonido" : "Silenciar"}
            aria-pressed={muted}
            onClick={(e) => {
              e.currentTarget.blur();
              toggleMute();
            }}
          >
            <IconSound muted={muted} />
          </button>
        </div>
      )}

      {/* ---------- Pantalla de Inicio (pantalla completa para móviles y escritorio) ---------- */}
        {status === "menu" && (
          <div className="anim-overlay absolute inset-0 z-10 flex items-center justify-center bg-gradient-to-b from-night/75 via-night/45 to-night/60 p-3 sm:p-5">
            {view === "main" ? (
              <div className="parchment anim-card scroll-thin max-h-full w-full max-w-[540px] overflow-y-auto rounded-md px-5 py-4 text-center sm:px-7 sm:py-5">
                <p className="font-display text-[11px] uppercase tracking-[0.22em] text-wine">
                  Aventura histórica · 5 fases · Siglos XVI–XVIII
                </p>
                <h1 className="mt-0.5 font-display text-4xl leading-none text-ink sm:text-5xl">
                  Pluma <span className="text-wine">y</span> Voz
                </h1>
                <p className="font-display text-xs uppercase tracking-[0.16em] text-ink-soft sm:text-sm">
                  Sobre mujeres en la Edad Moderna hispana
                </p>
                <div className="mx-auto my-2.5 flex w-36 items-center gap-2" aria-hidden="true">
                  <span className="h-px flex-1 bg-gold" />
                  <span className="h-2 w-2 rotate-45 bg-wine" />
                  <span className="h-px flex-1 bg-gold" />
                </div>
                <p className="mx-auto max-w-[46ch] text-[14px] leading-snug text-ink sm:text-[16px]">{STORY_PROLOGUE}</p>

                <button type="button" className="btn-seal anim-cta mt-3.5 w-full px-6 py-2.5 text-xl sm:py-3 sm:text-2xl" onClick={() => startStory(0)}>
                  Comenzar historia
                </button>
                <p className="mt-1.5 text-xs text-ink-soft sm:text-sm">
                  {isTouch
                    ? "Cruceta para correr · SALTAR y PLUMA para romper bloques y vencer censores"
                    : "← → correr · Espacio saltar · X / Shift golpe de Pluma · Intro para empezar"}
                </p>

                <div className="mt-3 grid grid-cols-4 gap-1.5 sm:gap-2">
                  <button type="button" className="btn-ghost px-1 py-2 text-xs leading-tight sm:text-sm" onClick={() => openView("chapters")}>
                    Capítulos
                    <span className="block text-[11px] text-ink-soft">{unlockedStage + 1}/5</span>
                  </button>
                  <button type="button" className="btn-ghost px-1 py-2 text-xs leading-tight sm:text-sm" onClick={() => openView("gallery")}>
                    Códice
                    <span className="block text-[11px] text-ink-soft">
                      {unlockedCount + relicCount}/{WOMEN.length + RELICS.length}
                    </span>
                  </button>
                  <button type="button" className="btn-ghost px-1 py-2 text-xs leading-tight sm:text-sm" onClick={() => openView("scores")}>
                    Marcas
                    <span className="block text-[11px] tabular-nums text-ink-soft">{best ? fmt(best.score) : "—"}</span>
                  </button>
                  <button type="button" className="btn-ghost px-1 py-2 text-xs leading-tight sm:text-sm" onClick={() => openView("help")}>
                    Reglas
                    <span className="block text-[11px] text-ink-soft">controles</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="parchment anim-card flex max-h-full w-full max-w-[540px] flex-col rounded-md">
                <div className="flex items-center justify-between gap-3 border-b border-[#a8843a]/70 px-4 py-2.5">
                  <h2 className="font-display text-xl leading-none text-ink sm:text-2xl">
                    {view === "chapters"
                      ? "Capítulos de la Crónica"
                      : view === "gallery"
                        ? "Códice Histórico"
                        : view === "scores"
                          ? "Tabla de marcas"
                          : "Cómo se juega"}
                  </h2>
                  <button type="button" className="btn-ghost shrink-0 px-3 py-1.5 text-sm" onClick={() => openView("main")}>
                    Volver
                  </button>
                </div>
                <div className="scroll-thin min-h-0 flex-1 overflow-y-auto px-4 py-3">
                  {view === "chapters" && (
                    <ChaptersPanel
                      unlockedStage={unlockedStage}
                      unlockedWomen={unlocked}
                      unlockedRelics={unlockedRelics}
                      onSelectStage={(i) => startStory(i)}
                    />
                  )}
                  {view === "gallery" && <GalleryPanel unlocked={unlocked} unlockedRelics={unlockedRelics} />}
                  {view === "help" && <HelpPanel touch={isTouch} />}
                  {view === "scores" && (
                    <div>
                      <ScoresTable scores={scores} />
                      {scores.length > 0 && (
                        <div className="mt-4 text-center">
                          <button
                            type="button"
                            className="btn-ghost px-3 py-2 text-sm"
                            onClick={() => {
                              if (confirmClear) {
                                clearScores();
                                setScores([]);
                                setConfirmClear(false);
                              } else {
                                setConfirmClear(true);
                              }
                            }}
                          >
                            {confirmClear ? "¿Seguro? Pulsa otra vez para borrar" : "Borrar las marcas"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---------- Mapa de la Crónica (entre fases, estilo Alex Kidd) ---------- */}
        {status === "map" && (
          <StoryMap
            stageIndex={stageIndex}
            unlockedWomen={unlocked}
            unlockedRelics={unlockedRelics}
            onStartStage={enterStage}
            onMenu={goMenu}
          />
        )}

        {/* ---------- Duelo de Ingenio previo al Jefe (estilo Janken de Alex Kidd) ---------- */}
        {status === "bossDuel" && duelStage && (
          <BossDuelModal stage={duelStage} touch={isTouch} onFinish={finishBossDuel} />
        )}

        {/* ---------- Fase Completada (Diálogo histórico + Bonificación) ---------- */}
        {status === "stageClear" && clearInfo && clearedStageMeta && (
          <div className="anim-overlay absolute inset-0 z-20 flex items-center justify-center bg-night/75 p-3 sm:p-5">
            <div className="parchment anim-card scroll-thin max-h-full w-full max-w-[490px] overflow-y-auto rounded-md px-5 py-5 text-center sm:px-7">
              <p className="font-display text-[11px] uppercase tracking-[0.22em] text-wine">
                Fase {clearedStageMeta.roman} superada · {clearedStageMeta.place} ({clearedStageMeta.year})
              </p>
              <h2 className="mt-0.5 font-display text-3xl leading-tight text-ink">¡{clearedStageMeta.bossName} vencido!</h2>

              <blockquote className="mt-3 rounded-md border border-[#a8843a] bg-[#fbf3dc]/85 px-4 py-3 text-left">
                <p className="font-display text-sm text-wine">{clearedStageMeta.outroSpeaker} te dice:</p>
                <p className="mt-1 text-[15px] italic leading-snug text-ink sm:text-[16px]">{clearedStageMeta.outroQuote}</p>
              </blockquote>

              <dl className="mt-3 grid grid-cols-3 gap-2">
                {[
                  ["Bono de fase", `+${fmt(clearInfo.stageScoreBonus)}`],
                  ["Retratos", `${clearInfo.portraitsInStage}/${clearInfo.portraitsTotalInStage}`],
                  ["Total", fmt(clearInfo.totalScore)],
                ].map(([k, v]) => (
                  <div key={k} className="rounded border border-[#a8843a]/70 bg-[#fbf3dc]/70 px-1 py-1.5">
                    <dt className="font-display text-[10px] uppercase tracking-wider text-wine">{k}</dt>
                    <dd className="font-display text-lg tabular-nums text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <button type="button" className="btn-seal anim-cta mt-4 w-full px-6 py-3 text-xl" onClick={advanceStage}>
                {clearInfo.isFinal ? "Leer el epílogo final" : "Seguir el viaje en el mapa"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- Pausa ---------- */}
        {status === "paused" && (
          <div className="anim-overlay absolute inset-0 z-20 flex items-center justify-center bg-night/65 px-4">
            <div className="parchment anim-card w-full max-w-[330px] rounded-md px-6 py-5 text-center">
              <p className="font-display text-[11px] uppercase tracking-[0.22em] text-wine">
                Fase {STAGES[stageIndex]?.roman} · {STAGES[stageIndex]?.place}
              </p>
              <h2 className="font-display text-4xl leading-none text-ink">Pausa</h2>
              <div className="mt-4 flex flex-col gap-2">
                <button type="button" className="btn-seal px-5 py-2.5 text-xl" onClick={resumeGame}>
                  Continuar
                </button>
                <button type="button" className="btn-ghost px-5 py-2 text-base" onClick={retryStage}>
                  Reiniciar esta fase
                </button>
                <button type="button" className="btn-ghost px-5 py-2 text-base" onClick={goMenu}>
                  Salir al inicio
                </button>
              </div>
              {!isTouch && <p className="mt-3 text-xs text-ink-soft">P o Intro: continuar · R: reiniciar fase</p>}
            </div>
          </div>
        )}

        {/* ---------- Fin de partida o Epílogo de Victoria ---------- */}
        {(status === "over" || status === "victory") && outcome && (
          <GameOver
            outcome={outcome}
            scores={scores}
            name={name}
            touch={isTouch}
            onName={onNameChange}
            onRetryStage={retryStage}
            onNewCampaign={() => startStory(0)}
            onMenu={goMenu}
          />
        )}
    </div>
  );
}
