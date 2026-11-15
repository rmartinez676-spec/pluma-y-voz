import type { StageTheme } from "./data";

function publicUrl(relPath: string): string {
  const base = (import.meta.env?.BASE_URL ?? "/").replace(/\/?$/, "/");
  return `${base}${relPath.replace(/^\/+/, "")}`;
}

export const MAP_BG_URL = publicUrl("images/bg-map.jpg");

export const STAGE_BG_URLS: Record<StageTheme, string> = {
  salamanca: publicUrl("images/bg-salamanca.jpg"),
  avila: publicUrl("images/bg-avila.jpg"),
  mar: publicUrl("images/bg-mar.jpg"),
  corral: publicUrl("images/bg-corral.jpg"),
  indice: publicUrl("images/bg-indice.jpg"),
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
