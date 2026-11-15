import { useEffect, useState } from "react";
import type { StageMeta } from "../game/data";
import { sfx } from "../game/audio";

interface Props {
  stage: StageMeta;
  touch: boolean;
  onFinish: (correct: boolean) => void;
}

export function BossDuelModal({ stage, touch, onFinish }: Props) {
  const duel = stage.bossDuel;
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const isCorrect = picked === duel.correctIndex;

  const choose = (idx: number) => {
    if (answered) return;
    setPicked(idx);
    if (idx === duel.correctIndex) sfx.portrait();
    else sfx.skullTrap();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (!answered) {
        if (e.key === "1") {
          e.preventDefault();
          choose(0);
        } else if (e.key === "2") {
          e.preventDefault();
          choose(1);
        } else if (e.key === "3") {
          e.preventDefault();
          choose(2);
        } else if (e.code === "Escape") {
          e.preventDefault();
          onFinish(false);
        }
      } else if (e.code === "Enter" || e.code === "NumpadEnter" || e.code === "Space") {
        e.preventDefault();
        onFinish(isCorrect);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answered, isCorrect, onFinish]);

  return (
    <div className="anim-overlay absolute inset-0 z-30 flex items-center justify-center bg-night/80 p-3 sm:p-5">
      <div className="parchment anim-card scroll-thin max-h-full w-full max-w-[540px] overflow-y-auto rounded-md px-5 py-4 text-center sm:px-7 sm:py-5">
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-wine">
          Duelo de Ingenio · Antes del combate
        </p>
        <h2 className="mt-0.5 font-display text-2xl leading-tight text-ink sm:text-3xl">
          {stage.bossName} <span className="text-wine">te desafía</span>
        </h2>
        <p className="mt-1 text-sm italic text-ink-soft">«{stage.bossTaunt}»</p>

        <div className="mt-3 rounded-md border border-[#a8843a] bg-[#fbf3dc]/90 px-4 py-3 text-left">
          <p className="font-display text-xs uppercase tracking-[0.14em] text-lapis">
            Responde bien para romper 2 corazones al jefe y ganar Tinta de Oro:
          </p>
          <p className="mt-1.5 font-display text-lg leading-snug text-ink sm:text-xl">{duel.question}</p>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {duel.options.map((opt, idx) => {
            const selected = picked === idx;
            const right = idx === duel.correctIndex;
            let cls =
              "btn-ghost flex items-center justify-center gap-2 px-3 py-3 text-base leading-tight sm:flex-col sm:py-3.5";
            if (answered) {
              if (right) {
                cls =
                  "flex items-center justify-center gap-2 rounded-[10px] border-2 border-[#2f6b56] bg-[#2f6b56] px-3 py-3 font-display text-base leading-tight text-[#fff8e6] shadow-md sm:flex-col sm:py-3.5";
              } else if (selected) {
                cls =
                  "flex items-center justify-center gap-2 rounded-[10px] border-2 border-[#a12a39] bg-[#a12a39]/85 px-3 py-3 font-display text-base leading-tight text-[#fff3d6] opacity-90 sm:flex-col sm:py-3.5";
              } else {
                cls =
                  "flex items-center justify-center gap-2 rounded-[10px] border border-[#a8843a]/50 bg-[#eadbb4]/60 px-3 py-3 font-display text-base leading-tight text-ink-soft opacity-65 sm:flex-col sm:py-3.5";
              }
            }
            return (
              <button key={opt} type="button" disabled={answered} className={cls} onClick={() => choose(idx)}>
                <span className="inline-grid h-6 w-6 shrink-0 place-items-center rounded-full border border-current text-xs font-display">
                  {idx + 1}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {answered ? (
          <div className="mt-3.5 rounded-md border border-[#a8843a] bg-[#fff8e6] px-4 py-3 text-left">
            <p className={`font-display text-base ${isCorrect ? "text-[#2f6b56]" : "text-wine"}`}>
              {isCorrect
                ? "¡Argumento irrefutable! −2 corazones al jefe, Tinta de Oro y +400 puntos."
                : "El sello resiste… pero ya conoces la historia:"}
            </p>
            <p className="mt-1 text-sm leading-snug text-ink">{duel.explanation}</p>
            <button
              type="button"
              className="btn-seal anim-cta mt-3 w-full px-5 py-2.5 text-xl"
              onClick={() => onFinish(isCorrect)}
            >
              ¡Al combate!
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center justify-between text-xs text-ink-soft">
            <span>{touch ? "Toca un sello para responder" : "Pulsa 1, 2 o 3 para responder"}</span>
            <button
              type="button"
              className="underline decoration-dotted underline-offset-4 hover:text-wine"
              onClick={() => onFinish(false)}
            >
              Saltar directo al combate
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
