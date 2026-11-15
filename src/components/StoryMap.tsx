import { useEffect, useState } from "react";
import { RELIC_BY_ID, STAGES, WOMAN_BY_ID } from "../game/data";
import { MAP_BG_URL } from "../game/backgrounds";
import { sfx } from "../game/audio";
import { Medallion } from "./Panels";

interface Props {
  stageIndex: number;
  unlockedWomen: string[];
  unlockedRelics: string[];
  onStartStage: () => void;
  onMenu: () => void;
}

/** Curva cuadrática suave entre dos puntos del portulano */
function routePath(ax: number, ay: number, bx: number, by: number, bend: number): string {
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 + bend;
  return `M ${ax} ${ay} Q ${mx} ${my} ${bx} ${by}`;
}

export function StoryMap({ stageIndex, unlockedWomen, unlockedRelics, onStartStage, onMenu }: Props) {
  const stage = STAGES[stageIndex] ?? STAGES[0];
  const prev = STAGES[Math.max(0, stageIndex - 1)];
  const [arrived, setArrived] = useState(stageIndex === 0);

  useEffect(() => {
    if (stageIndex === 0) {
      setArrived(true);
      return;
    }
    setArrived(false);
    const t1 = window.setTimeout(() => {
      sfx.mapStep();
      setArrived(true);
    }, 180);
    return () => window.clearTimeout(t1);
  }, [stageIndex]);

  // Coordenadas en el viewBox 150×100 (relación 3:2 exacta del portulano bg-map.jpg)
  const pt = (s: (typeof STAGES)[number]) => ({ x: s.mapX * 1.5, y: s.mapY });
  const curPt = pt(stage);
  const prevPt = pt(prev);
  const claraX = arrived ? curPt.x : prevPt.x;
  const claraY = arrived ? curPt.y : prevPt.y;

  const bends = [-8, -16, 15, 10]; // curvatura náutica de cada tramo

  return (
    <div className="anim-overlay absolute inset-0 z-20 flex items-center justify-center bg-night/80 p-2.5 sm:p-4">
      <div className="parchment anim-card scroll-thin flex max-h-full w-full max-w-[700px] flex-col overflow-y-auto rounded-md px-4 py-3.5 text-center sm:px-6 sm:py-5">
        <p className="font-display text-[11px] uppercase tracking-[0.22em] text-wine">
          Portulano de la Crónica · Capítulo {stage.roman} de {STAGES.length}
        </p>
        <h2 className="mt-0.5 font-display text-2xl leading-tight text-ink sm:text-3xl">
          {stage.place} ({stage.year}) — <span className="text-wine">{stage.title}</span>
        </h2>

        {/* Mapa portulano ilustrado con rutas geográficas reales */}
        <div className="relative mx-auto mt-2.5 w-full overflow-hidden rounded border-2 border-[#8a6a2a] bg-[#e8d4a4] shadow-md">
          <img
            src={MAP_BG_URL}
            alt="Mapa portulano del mundo hispánico en la Edad Moderna"
            className="block h-[155px] w-full object-cover sm:h-[210px]"
          />
          <svg
            viewBox="0 0 150 100"
            preserveAspectRatio="none"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {/* Rutas punteadas de toda la campaña */}
            {STAGES.slice(0, -1).map((s, idx) => {
              const a = pt(s);
              const b = pt(STAGES[idx + 1]);
              const d = routePath(a.x, a.y, b.x, b.y, bends[idx] ?? 0);
              const traveled = idx < stageIndex;
              return (
                <g key={s.roman}>
                  <path
                    d={d}
                    fill="none"
                    stroke={traveled ? "#c9982f" : "#5e1824"}
                    strokeWidth={traveled ? 1.5 : 1.05}
                    strokeDasharray={traveled ? undefined : "2.4 2"}
                    strokeLinecap="round"
                    opacity={traveled ? 0.95 : 0.72}
                  />
                </g>
              );
            })}

            {/* Marcadores históricos de las 5 fases */}
            {STAGES.map((s, idx) => {
              const { x, y } = pt(s);
              const done = idx < stageIndex;
              const cur = idx === stageIndex;
              const labelOffset =
                s.labelPos === "left"
                  ? { dx: -4.5, dy: 0.8, anchor: "end" as const }
                  : s.labelPos === "right"
                    ? { dx: 4.8, dy: 1.2, anchor: "start" as const }
                    : s.labelPos === "top"
                      ? { dx: 0, dy: -5.2, anchor: "middle" as const }
                      : { dx: 0, dy: 7.4, anchor: "middle" as const };
              return (
                <g key={s.roman}>
                  {cur && (
                    <circle cx={x} cy={y} r="5.5" fill="rgba(122,31,43,0.28)" stroke="#7a1f2b" strokeWidth="0.6" />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={cur ? 3.2 : 2.3}
                    fill={done ? "#c9982f" : cur ? "#7a1f2b" : "#fdf6e3"}
                    stroke="#1f1216"
                    strokeWidth="0.65"
                  />
                  <text
                    x={x + labelOffset.dx}
                    y={y + labelOffset.dy}
                    textAnchor={labelOffset.anchor}
                    fontSize={cur ? "4.1" : "3.4"}
                    fontFamily="var(--font-display)"
                    stroke="#f7ead0"
                    strokeWidth="1.2"
                    paintOrder="stroke"
                    fill={cur ? "#7a1f2b" : "#24141a"}
                  >
                    {s.roman} · {s.place} ({s.year})
                  </text>
                </g>
              );
            })}

            {/* Figura de Clara viajando sobre el mapa */}
            <g
              style={{
                transform: `translate(${claraX}px, ${claraY - 6.5}px)`,
                transition: "transform 0.85s cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              <ellipse cx="0" cy="5.6" rx="3" ry="1.1" fill="rgba(20,10,10,0.35)" />
              <polygon points="-2.7,5.2 2.7,5.2 1.8,0.5 -1.8,0.5" fill="#7a1f2b" stroke="#1f1216" strokeWidth="0.55" />
              <circle cx="0" cy="-1.2" r="2.0" fill="#ecc6a0" stroke="#1f1216" strokeWidth="0.55" />
              <circle cx="-1.5" cy="-2.1" r="1.1" fill="#3a2117" />
              <path d="M1.8 0.5 Q4.6 -3 2.6 -5.2" stroke="#fdf6e3" strokeWidth="1.0" fill="none" />
            </g>
          </svg>
        </div>

        {/* Historia del capítulo */}
        <p className="mx-auto mt-2.5 max-w-[58ch] text-[14px] leading-snug text-ink sm:text-[16px]">{stage.story}</p>

        {/* Voces y Reliquias de esta fase */}
        <div className="mt-2.5 flex flex-col gap-1.5 rounded border border-[#a8843a]/70 bg-[#fbf3dc]/75 px-3 py-2 text-left">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-display text-[11px] uppercase tracking-[0.14em] text-wine">Retratos:</span>
            {stage.womenIds.map((id) => {
              const w = WOMAN_BY_ID[id];
              if (!w) return null;
              const found = unlockedWomen.includes(id);
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded bg-[#f1e2bf] px-1.5 py-0.5 text-xs text-ink">
                  <Medallion tint={w.tint} locked={!found} size={16} />
                  <span className="font-display">{found ? w.name : "Por rescatar"}</span>
                </span>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-display text-[11px] uppercase tracking-[0.14em] text-lapis">Reliquias:</span>
            {stage.relicIds.map((id) => {
              const rl = RELIC_BY_ID[id];
              if (!rl) return null;
              const found = unlockedRelics.includes(id);
              return (
                <span key={id} className="inline-flex items-center gap-1 rounded bg-[#e8dcc0] px-2 py-0.5 text-xs text-ink">
                  <span className={found ? "text-lapis" : "text-ink-soft"}>✦</span>
                  <span className="font-display">{found ? rl.name : "Saber oculto"}</span>
                </span>
              );
            })}
          </div>
        </div>

        <p className="mt-1.5 text-xs italic text-ink-soft">Consejo: {stage.tip}</p>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
          <button type="button" className="btn-seal anim-cta flex-1 px-6 py-2.5 text-xl sm:flex-none sm:px-10" onClick={onStartStage}>
            Entrar en la fase {stage.roman}
          </button>
          <button type="button" className="btn-ghost px-4 py-2.5 text-base" onClick={onMenu}>
            Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
