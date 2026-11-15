import type { StageTheme } from "./data";
import bgSalamanca from "../assets/bg-salamanca.jpg";
import bgAvila from "../assets/bg-avila.jpg";
import bgMar from "../assets/bg-mar.jpg";
import bgCorral from "../assets/bg-corral.jpg";
import bgIndice from "../assets/bg-indice.jpg";
import bgMap from "../assets/bg-map.jpg";

export const MAP_BG_URL = bgMap;

export const STAGE_BG_URLS: Record<StageTheme, string> = {
  salamanca: bgSalamanca,
  avila: bgAvila,
  mar: bgMar,
  corral: bgCorral,
  indice: bgIndice,
};

const cache = new Map<StageTheme, HTMLImageElement>();

export function preloadStageBackgrounds(): void {
  if (typeof Image === "undefined") return;
  (Object.keys(STAGE_BG_URLS) as StageTheme[]).forEach((theme) => {
    if (cache.has(theme)) return;
    const img = new Image();
    img.decoding = "async";
    img.src = STAGE_BG_URLS[theme];
    cache.set(theme, img);
  });
}

export function getStageBackground(theme: StageTheme): HTMLImageElement | null {
  if (typeof Image === "undefined") return null;
  let img = cache.get(theme);
  if (!img) {
    img = new Image();
    img.decoding = "async";
    img.src = STAGE_BG_URLS[theme];
    cache.set(theme, img);
  }
  return img.complete && img.naturalWidth > 0 ? img : null;
}
