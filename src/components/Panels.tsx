import { useState, type ReactNode } from "react";
import { RELICS, STAGES, WOMEN, type Relic, type Woman } from "../game/data";
import type { ScoreEntry } from "../game/storage";

export const fmt = (n: number) => Math.round(n).toLocaleString("es-ES");

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

export function IconPause() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <rect x="3" y="2" width="4.5" height="14" rx="1" fill="currentColor" />
      <rect x="10.5" y="2" width="4.5" height="14" rx="1" fill="currentColor" />
    </svg>
  );
}

export function IconSound({ muted }: { muted: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7.5h3l4-3.5v12l-4-3.5H3z" fill="currentColor" />
      {muted ? (
        <path d="M13.5 7.5l4 5M17.5 7.5l-4 5" />
      ) : (
        <>
          <path d="M13 7.2c1 .8 1 4.8 0 5.6" />
          <path d="M15.3 5c2.2 2 2.2 8 0 10" />
        </>
      )}
    </svg>
  );
}

export function Medallion({ tint, locked = false, size = 44 }: { tint: string; locked?: boolean; size?: number }) {
  const clipId = `clip-${tint.slice(1)}-${size}`;
  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 44 52" aria-hidden="true" className="shrink-0">
      <ellipse cx="22" cy="27" rx="19" ry="23" fill={locked ? "#b9a67a" : "#c9982f"} stroke={locked ? "#8a7a55" : "#6b4708"} strokeWidth="1.6" />
      <ellipse cx="22" cy="27" rx="14" ry="18" fill={locked ? "#d9c9a0" : tint} stroke={locked ? "#8a7a55" : "#6b4708"} strokeWidth="1.4" />
      {locked ? (
        <text x="22" y="34" textAnchor="middle" fontSize="20" fontFamily="var(--font-display)" fill="#6f603f">
          ?
        </text>
      ) : (
        <g>
          <clipPath id={clipId}>
            <ellipse cx="22" cy="27" rx="13.3" ry="17.3" />
          </clipPath>
          <g clipPath={`url(#${clipId})`}>
            <ellipse cx="22" cy="46" rx="12" ry="10" fill="#7a1f2b" />
            <ellipse cx="22" cy="35" rx="7.5" ry="2.8" fill="#fdf6e3" />
            <circle cx="22" cy="23.5" r="7.2" fill="#3a2218" />
            <circle cx="22" cy="26" r="5.6" fill="#e9c4a0" />
          </g>
        </g>
      )}
      <circle cx="22" cy="3.5" r="2.6" fill="none" stroke={locked ? "#8a7a55" : "#6b4708"} strokeWidth="1.4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Capítulos / Selector de Fases                                       */
/* ------------------------------------------------------------------ */

export function ChaptersPanel({
  unlockedStage,
  unlockedWomen,
  unlockedRelics,
  onSelectStage,
}: {
  unlockedStage: number;
  unlockedWomen: string[];
  unlockedRelics: string[];
  onSelectStage: (stageIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-center text-[15px] leading-snug text-ink-soft">
        Cinco escenarios históricos a lo largo de tres siglos. Completa cada fase para abrir la siguiente o repite cualquier capítulo desbloqueado.
      </p>
      <ul className="flex flex-col gap-2">
        {STAGES.map((s) => {
          const open = s.index <= unlockedStage;
          const found = s.womenIds.filter((id) => unlockedWomen.includes(id)).length;
          const foundRelics = s.relicIds.filter((id) => unlockedRelics.includes(id)).length;
          return (
            <li
              key={s.roman}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2.5 text-left ${
                open ? "border-[#a8843a] bg-[#fbf3dc]/85" : "border-dashed border-[#a8935f] bg-[#eadbb4]/60 opacity-80"
              }`}
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-xs uppercase tracking-[0.14em] text-wine">
                  Fase {s.roman} · {s.place} ({s.year})
                </p>
                <p className="font-display text-lg leading-tight text-ink">{s.title}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  Retratos: {found}/{s.womenIds.length} · Reliquias: {foundRelics}/{s.relicIds.length} · Jefe: {open ? s.bossName : "???"}
                </p>
              </div>
              {open ? (
                <button
                  type="button"
                  className="btn-seal shrink-0 px-3.5 py-2 text-sm"
                  onClick={() => onSelectStage(s.index)}
                >
                  Jugar
                </button>
              ) : (
                <span className="shrink-0 rounded border border-[#a8935f] px-2.5 py-1 font-display text-xs text-ink-soft">
                  Sellada
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Galería                                                             */
/* ------------------------------------------------------------------ */

function stageLabelForWoman(id: string): string {
  const st = STAGES.find((s) => s.womenIds.includes(id));
  return st ? `Fase ${st.roman} · ${st.place}` : "";
}

function WomanCard({ w, open }: { w: Woman; open: boolean }) {
  const where = stageLabelForWoman(w.id);
  if (!open) {
    return (
      <li className="flex items-center gap-3 rounded-md border border-dashed border-[#a8935f] bg-[#eadbb4]/60 px-3 py-2.5 text-left">
        <Medallion tint={w.tint} locked size={34} />
        <div className="min-w-0">
          <p className="font-display text-base leading-tight text-ink-soft">Retrato por descubrir</p>
          <p className="text-sm leading-snug text-ink-soft">
            {w.role} · {w.years} ({where})
          </p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-3 rounded-md border border-[#a8843a] bg-[#fbf3dc]/85 px-3 py-2.5 text-left shadow-[0_1px_0_rgba(138,106,42,0.5)]">
      <Medallion tint={w.tint} size={34} />
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight text-ink">
          {w.name}
          {w.alias ? <span className="text-wine"> · «{w.alias}»</span> : null}
        </p>
        <p className="text-sm italic leading-snug text-wine">
          {w.role} · {w.place} · {w.years}
        </p>
        <p className="mt-1 text-[15px] leading-snug text-ink">{w.fact}</p>
      </div>
    </li>
  );
}

function RelicCard({ r, open }: { r: Relic; open: boolean }) {
  const st = STAGES[r.stageIndex];
  if (!open) {
    return (
      <li className="flex items-center gap-3 rounded-md border border-dashed border-[#a8935f] bg-[#eadbb4]/60 px-3 py-2.5 text-left">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#8a7a55] bg-[#d9c9a0] font-display text-lg text-[#6f603f]">
          ✦
        </span>
        <div className="min-w-0">
          <p className="font-display text-base leading-tight text-ink-soft">Reliquia por descubrir</p>
          <p className="text-sm leading-snug text-ink-soft">
            Fase {st?.roman} · {st?.place} ({st?.year})
          </p>
        </div>
      </li>
    );
  }
  return (
    <li className="flex items-start gap-3 rounded-md border border-[#27456f]/60 bg-[#fbf3dc]/90 px-3 py-2.5 text-left shadow-[0_1px_0_rgba(39,69,111,0.35)]">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#6b4708] bg-lapis font-display text-lg text-gold-bright">
        ✦
      </span>
      <div className="min-w-0">
        <p className="font-display text-lg leading-tight text-ink">{r.name}</p>
        <p className="text-xs italic leading-snug text-lapis">
          {r.era} · Fase {st?.roman}
        </p>
        <p className="mt-1 text-[14px] leading-snug text-ink">{r.note}</p>
      </div>
    </li>
  );
}

export function GalleryPanel({ unlocked, unlockedRelics }: { unlocked: string[]; unlockedRelics: string[] }) {
  const [tab, setTab] = useState<"women" | "relics">("women");
  const wCount = WOMEN.filter((w) => unlocked.includes(w.id)).length;
  const rCount = RELICS.filter((r) => unlockedRelics.includes(r.id)).length;

  return (
    <div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          className={tab === "women" ? "btn-seal py-2 text-sm" : "btn-ghost py-2 text-sm"}
          onClick={() => setTab("women")}
        >
          Retratos ({wCount}/{WOMEN.length})
        </button>
        <button
          type="button"
          className={tab === "relics" ? "btn-seal py-2 text-sm" : "btn-ghost py-2 text-sm"}
          onClick={() => setTab("relics")}
        >
          Reliquias y Saberes ({rCount}/{RELICS.length})
        </button>
      </div>

      {tab === "women" ? (
        <>
          <p className="mb-2.5 text-center text-[14px] leading-snug text-ink-soft">
            {wCount === WOMEN.length
              ? "Has rescatado los diecisiete retratos de la crónica. Sus nombres ya no se borran."
              : `Has rescatado ${wCount} de ${WOMEN.length} retratos. Explora tejados, torres y muros rompibles en cada fase.`}
          </p>
          <ul className="flex flex-col gap-2">
            {WOMEN.map((w) => (
              <WomanCard key={w.id} w={w} open={unlocked.includes(w.id)} />
            ))}
          </ul>
        </>
      ) : (
        <>
          <p className="mb-2.5 text-center text-[14px] leading-snug text-ink-soft">
            {rCount === RELICS.length
              ? "¡Códice completo! Has descubierto todas las reliquias y saberes de la Edad Moderna hispana."
              : `Has descubierto ${rCount} de ${RELICS.length} reliquias. Acércate a los atriles iluminados («SABER») en cada escenario.`}
          </p>
          <ul className="flex flex-col gap-2">
            {RELICS.map((r) => (
              <RelicCard key={r.id} r={r} open={unlockedRelics.includes(r.id)} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabla de marcas                                                     */
/* ------------------------------------------------------------------ */

export function ScoresTable({ scores, highlightId, limit }: { scores: ScoreEntry[]; highlightId?: string; limit?: number }) {
  const rows = limit ? scores.slice(0, limit) : scores;
  if (rows.length === 0) {
    return <p className="py-3 text-center text-[15px] italic text-ink-soft">Aún no hay marcas. La primera página está en blanco: escríbela tú.</p>;
  }
  return (
    <ol className="flex flex-col gap-1">
      {rows.map((s, i) => {
        const me = s.id === highlightId;
        const st = STAGES[Math.max(0, Math.min(STAGES.length - 1, (s.stageReached || 1) - 1))];
        return (
          <li
            key={s.id}
            className={`flex items-baseline gap-2 rounded px-2.5 py-1.5 text-left ${
              me ? "bg-wine text-[#fff3d6] shadow-[0_2px_0_#3d0c14]" : i % 2 === 0 ? "bg-[#fbf3dc]/70 text-ink" : "text-ink"
            }`}
          >
            <span className={`w-6 shrink-0 font-display text-base tabular-nums ${me ? "text-gold-bright" : "text-wine"}`}>{i + 1}.</span>
            <span className="min-w-0 flex-1 truncate text-[16px]">{s.name}</span>
            <span className={`shrink-0 font-display text-xs ${me ? "text-gold-bright" : "text-wine"}`}>
              {s.completed ? "★ Final" : `F.${st.roman}`}
            </span>
            <span className={`shrink-0 text-xs tabular-nums ${me ? "text-[#f6dfb0]" : "text-ink-soft"}`} title="Retratos rescatados">
              ◈ {s.portraits}
            </span>
            <span className="w-[4.5rem] shrink-0 text-right font-display text-lg tabular-nums">{fmt(s.score)}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Ayuda                                                               */
/* ------------------------------------------------------------------ */

function Rule({ color, title, children }: { color: string; title: string; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-left">
      <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rotate-45 border border-ink/60" style={{ background: color }} />
      <p className="text-[15px] leading-snug text-ink">
        <span className="font-display text-base text-wine">{title}. </span>
        {children}
      </p>
    </li>
  );
}

function Key({ children }: { children: ReactNode }) {
  return (
    <kbd className="mx-0.5 inline-block min-w-[1.7em] rounded border border-[#8a6a2a] bg-[#fbf3dc] px-1.5 py-0.5 text-center font-display text-sm text-ink shadow-[0_2px_0_rgba(138,106,42,0.7)]">
      {children}
    </kbd>
  );
}

export function HelpPanel({ touch }: { touch: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-2.5">
        <Rule color="#b5693c" title="Golpe de Pluma y bloques">
          Lanza tu golpe de Pluma para romper bloques agrietados, abrir pasadizos ocultos, activar bloques «?» y vencer a los alguaciles y censores. ¡Cuidado con los bloques de calavera!
        </Rule>
        <Rule color="#f0cf73" title="Poderes ocultos">
          Los bloques «?» guardan la <strong>Tinta de Oro</strong> (dispara ondas doradas a distancia), la <strong>Capa de Seda</strong> (absorbe un golpe) y corazones de vida.
        </Rule>
        <Rule color="#27456f" title="Retratos, Reliquias y Faroles">
          Cada fase esconde 3 o 4 retratos y 2 reliquias históricas («SABER») que se guardan en tu Códice Histórico. Enciende el Farol a mitad de fase para guardar tu avance.
        </Rule>
        <Rule color="#c2262f" title="Duelo de Ingenio y Jefes">
          Al final de cada fase, el guardián de la censura te reta antes de luchar: acierta su pregunta histórica para quitarle 2 corazones de golpe y ganar Tinta de Oro.
        </Rule>
      </ul>

      <div className="rounded-md border border-[#a8843a] bg-[#fbf3dc]/70 px-3 py-3 text-left text-[15px] leading-relaxed text-ink">
        <p className="mb-1 font-display text-base text-wine">{touch ? "En pantalla táctil" : "Con teclado"}</p>
        {touch ? (
          <p>
            Usa la cruceta izquierda para correr (desliza el pulgar entre ◀ y ▶) y <strong>▼ Agachar</strong> para bajar por pasarelas de madera. Pulsa <strong>SALTAR</strong> y <strong>PLUMA</strong> a la derecha.
          </p>
        ) : (
          <p>
            <Key>←</Key>
            <Key>→</Key> o <Key>A</Key>
            <Key>D</Key> correr · <Key>Espacio</Key> / <Key>↑</Key> / <Key>Z</Key> saltar · <Key>X</Key> / <Key>Shift</Key> / <Key>J</Key> golpe de Pluma · <Key>↓</Key>+<Key>Espacio</Key> bajar pasarela · <Key>P</Key> pausa · <Key>M</Key> sonido
          </p>
        )}
      </div>
    </div>
  );
}
