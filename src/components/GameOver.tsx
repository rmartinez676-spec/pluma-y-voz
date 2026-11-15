import { useEffect, useState } from "react";
import { STAGES, STORY_EPILOGUE } from "../game/data";
import type { RunSummary } from "../game/engine";
import { DEFAULT_NAME, type ScoreEntry } from "../game/storage";
import { ScoresTable, fmt } from "./Panels";

export interface Outcome extends RunSummary {
  rank: number;
  entryId: string | null;
}

function useCountUp(target: number, ms = 850): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

interface Props {
  outcome: Outcome;
  scores: ScoreEntry[];
  name: string;
  touch: boolean;
  onName: (v: string) => void;
  onRetryStage: () => void;
  onNewCampaign: () => void;
  onMenu: () => void;
}

export function GameOver({ outcome, scores, name, touch, onName, onRetryStage, onNewCampaign, onMenu }: Props) {
  const shown = useCountUp(outcome.score);
  const stageMeta = STAGES[Math.max(0, Math.min(STAGES.length - 1, outcome.stageReached - 1))];
  const record = outcome.rank === 0;
  const win = outcome.completed;

  return (
    <div className="anim-overlay absolute inset-0 z-20 flex items-center justify-center bg-night/75 px-3 py-3 sm:px-5">
      <div className="parchment anim-card scroll-thin max-h-full w-full max-w-[470px] overflow-y-auto rounded-md px-5 py-5 text-center sm:px-7">
        <p className="font-display text-[12px] uppercase tracking-[0.2em] text-wine">
          {win ? "Epílogo · La crónica llega a la imprenta" : `La censura detuvo tu pluma en ${stageMeta.place}`}
        </p>
        <h2 className="mt-0.5 font-display text-3xl leading-none text-ink sm:text-4xl">
          {win ? "¡Crónica completada!" : "Fin del pliego"}
        </h2>

        {win && <p className="mx-auto mt-2.5 max-w-[44ch] text-[15px] leading-snug text-ink">{STORY_EPILOGUE}</p>}

        {record && (
          <p className="anim-stamp mx-auto mb-1 mt-3 w-fit rounded border-2 border-lapis px-2 py-0.5 font-display text-xs uppercase tracking-[0.18em] text-lapis">
            ¡Nueva marca!
          </p>
        )}
        <p className="anim-pop mt-1 font-display text-5xl leading-none tabular-nums text-wine sm:text-6xl">{fmt(shown)}</p>
        <p className="mt-1 text-sm text-ink-soft">
          {outcome.rank > 0
            ? `Puesto n.º ${outcome.rank + 1} de la tabla local`
            : record
              ? "Lo más alto de la tabla local"
              : "Sigue escribiendo para entrar en la tabla"}
        </p>

        <dl className="mt-3.5 grid grid-cols-3 gap-2 text-center">
          {[
            ["Fase", win ? "V / V" : `${stageMeta.roman} / V`],
            ["Retratos", String(outcome.portraits)],
            ["Censores", String(outcome.enemiesDefeated)],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col justify-between rounded-md border border-[#a8843a]/80 bg-[#fbf3dc]/70 px-1 py-1.5">
              <dt className="font-display text-[11px] uppercase leading-tight tracking-[0.12em] text-wine">{k}</dt>
              <dd className="font-display text-xl leading-tight tabular-nums text-ink sm:text-2xl">{v}</dd>
            </div>
          ))}
        </dl>

        {outcome.entryId && (
          <label className="mt-3.5 block text-left">
            <span className="font-display text-sm text-wine">Firma tu crónica</span>
            <input
              type="text"
              value={name}
              maxLength={16}
              onChange={(e) => onName(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              placeholder={DEFAULT_NAME}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="done"
              className="mt-1 block w-full rounded-md border border-[#8a6a2a] bg-[#fffaf0] px-3 py-2 font-body text-lg text-ink outline-none focus:border-lapis focus:ring-2 focus:ring-lapis/40"
            />
          </label>
        )}

        <div className="mt-4 flex flex-col gap-2">
          {!win ? (
            <>
              <button type="button" className="btn-seal anim-cta px-5 py-3 text-xl" onClick={onRetryStage}>
                Reintentar Fase {stageMeta.roman}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button type="button" className="btn-ghost px-3 py-2 text-base" onClick={onNewCampaign}>
                  Nueva crónica
                </button>
                <button type="button" className="btn-ghost px-3 py-2 text-base" onClick={onMenu}>
                  Inicio
                </button>
              </div>
            </>
          ) : (
            <>
              <button type="button" className="btn-seal anim-cta px-5 py-3 text-xl" onClick={onNewCampaign}>
                Jugar otra vez
              </button>
              <button type="button" className="btn-ghost px-5 py-2 text-base" onClick={onMenu}>
                Volver al inicio
              </button>
            </>
          )}
        </div>
        {!touch && <p className="mt-2 text-xs text-ink-soft">Intro o R para continuar al instante</p>}

        <div className="mt-4 border-t border-[#a8843a]/70 pt-3">
          <h3 className="mb-1.5 font-display text-lg text-ink">Tabla de marcas</h3>
          <ScoresTable scores={scores} highlightId={outcome.entryId ?? undefined} limit={5} />
        </div>
      </div>
    </div>
  );
}
