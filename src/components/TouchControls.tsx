import { useRef, useState } from "react";
import type { VirtualInput } from "../game/engine";

interface Props {
  onInput: (input: VirtualInput) => void;
  /** Cuando el teléfono está en vertical, los controles se colocan debajo del lienzo para no tapar el juego */
  docked?: boolean;
}

export function TouchControls({ onInput, docked = false }: Props) {
  const padRef = useRef<HTMLDivElement>(null);
  const padPointer = useRef<number>(-1);
  const [active, setActive] = useState({ left: false, right: false, down: false, jump: false, strike: false });

  const updateDirFromClient = (clientX: number, clientY: number) => {
    const el = padRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const rx = (clientX - r.left) / (r.width || 1);
    const ry = (clientY - r.top) / (r.height || 1);
    const left = rx < 0.44;
    const right = rx > 0.56;
    const down = ry > 0.72 && !left && !right;
    setActive((a) => ({ ...a, left, right, down }));
    onInput({ left, right, down });
  };

  const releasePad = () => {
    padPointer.current = -1;
    setActive((a) => ({ ...a, left: false, right: false, down: false }));
    onInput({ left: false, right: false, down: false });
  };

  const setBtn = (key: "jump" | "strike" | "down", pressed: boolean) => {
    setActive((a) => ({ ...a, [key]: pressed }));
    onInput({ [key]: pressed });
  };

  return (
    <div
      className={
        docked
          ? "flex w-full shrink-0 items-center justify-between gap-3 border-t border-[#8a6a2a]/60 bg-[#231016] px-4 py-3 select-none"
          : "pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between px-3 pb-[max(12px,env(safe-area-inset-bottom))] select-none"
      }
      style={{ touchAction: "none" }}
    >
      {/* Cruceta izquierda deslizante (← / → y ↓) */}
      <div className="pointer-events-auto flex flex-col items-center gap-1.5">
        <div
          ref={padRef}
          onPointerDown={(e) => {
            e.preventDefault();
            padPointer.current = e.pointerId;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              /* ignore */
            }
            updateDirFromClient(e.clientX, e.clientY);
          }}
          onPointerMove={(e) => {
            if (e.pointerId !== padPointer.current) return;
            e.preventDefault();
            updateDirFromClient(e.clientX, e.clientY);
          }}
          onPointerUp={(e) => {
            if (e.pointerId === padPointer.current) releasePad();
          }}
          onPointerCancel={(e) => {
            if (e.pointerId === padPointer.current) releasePad();
          }}
          className="grid h-[64px] w-[144px] grid-cols-2 gap-2"
          aria-label="Dirección izquierda y derecha"
        >
          <div
            className={`flex items-center justify-center rounded-xl border-2 font-display text-2xl transition-transform ${
              active.left
                ? "scale-95 border-[#f0cf73] bg-[#7a1f2b] text-[#fff3d6]"
                : "border-[#c9982f]/80 bg-[#f1e2bf]/80 text-[#24141a]"
            }`}
          >
            ◀
          </div>
          <div
            className={`flex items-center justify-center rounded-xl border-2 font-display text-2xl transition-transform ${
              active.right
                ? "scale-95 border-[#f0cf73] bg-[#7a1f2b] text-[#fff3d6]"
                : "border-[#c9982f]/80 bg-[#f1e2bf]/80 text-[#24141a]"
            }`}
          >
            ▶
          </div>
        </div>
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            setBtn("down", true);
          }}
          onPointerUp={() => setBtn("down", false)}
          onPointerCancel={() => setBtn("down", false)}
          onPointerLeave={() => setBtn("down", false)}
          className={`h-[34px] w-[96px] rounded-lg border font-display text-xs uppercase tracking-wider ${
            active.down
              ? "border-[#f0cf73] bg-[#7a1f2b] text-[#fff3d6]"
              : "border-[#c9982f]/70 bg-[#f1e2bf]/70 text-[#24141a]"
          }`}
        >
          ▼ Agachar
        </button>
      </div>

      {/* Botones de acción derecha: PLUMA (golpe) + SALTAR */}
      <div className="pointer-events-auto flex items-center gap-3">
        <button
          type="button"
          aria-label="Golpe de Pluma"
          onPointerDown={(e) => {
            e.preventDefault();
            setBtn("strike", true);
          }}
          onPointerUp={() => setBtn("strike", false)}
          onPointerCancel={() => setBtn("strike", false)}
          onPointerLeave={() => setBtn("strike", false)}
          className={`flex h-[68px] w-[68px] flex-col items-center justify-center rounded-full border-2 font-display shadow-lg transition-transform ${
            active.strike
              ? "scale-90 border-[#f7dc84] bg-[#a12a39] text-[#fff3d6]"
              : "border-[#f0cf73] bg-[#7a1f2b]/90 text-[#fff3d6]"
          }`}
        >
          <span className="text-base leading-none">PLUMA</span>
          <span className="mt-0.5 text-[10px] opacity-80">golpe</span>
        </button>

        <button
          type="button"
          aria-label="Saltar"
          onPointerDown={(e) => {
            e.preventDefault();
            setBtn("jump", true);
          }}
          onPointerUp={() => setBtn("jump", false)}
          onPointerCancel={() => setBtn("jump", false)}
          onPointerLeave={() => setBtn("jump", false)}
          className={`flex h-[74px] w-[74px] flex-col items-center justify-center rounded-full border-2 font-display shadow-lg transition-transform ${
            active.jump
              ? "scale-90 border-[#f7dc84] bg-[#345d96] text-[#fff3d6]"
              : "border-[#f0cf73] bg-[#27456f]/90 text-[#fff3d6]"
          }`}
        >
          <span className="text-base leading-none">SALTAR</span>
          <span className="mt-0.5 text-[10px] opacity-80">▲</span>
        </button>
      </div>
    </div>
  );
}
