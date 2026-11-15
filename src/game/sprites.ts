import type { RelicKind, StageMeta } from "./data";
import { getStageBackground } from "./backgrounds";
import { TILE, type EnemyType, type LootType, type PropKind, type TileId } from "./levels";

export const VIEW_W = 640;
export const VIEW_H = 360;

const INK = "#1f1216";
const CREAM = "#fdf6e3";
const GOLD = "#d6a02e";
const GOLD_HI = "#f7dc84";
const WINE = "#7a1f2b";
const WINE_DK = "#4a1019";
const LAPIS = "#27456f";
const SKIN = "#ecc6a0";

/* ================================================================== */
/* Fondos con paralaje (5 escenarios distintos)                        */
/* ================================================================== */

export function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  meta: StageMeta,
  camX: number,
  clock: number,
  maxCamX = 3600,
  camY = 0,
  maxCamY = 88,
): void {
  const { palette: pal, theme } = meta;
  const img = getStageBackground(theme);

  if (img) {
    // Panorámica ilustrada 3:1 con paralaje horizontal y vertical fluido (sin cortes)
    const drawH = VIEW_H + 34;
    const aspect = img.naturalWidth / Math.max(1, img.naturalHeight);
    const drawW = Math.max(VIEW_W + 160, Math.round(drawH * aspect));
    const px = maxCamX > 0 ? Math.max(0, Math.min(1, camX / maxCamX)) : 0;
    const py = maxCamY > 0 ? Math.max(0, Math.min(1, camY / maxCamY)) : 0;
    const ox = -px * (drawW - VIEW_W);
    const oy = -py * (drawH - VIEW_H);
    ctx.drawImage(img, ox, oy, drawW, drawH);

    // Veladura atmosférica muy sutil para que plataformas, bloques y sprites destaquen con nitidez
    const veil = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    if (theme === "salamanca" || theme === "mar") {
      veil.addColorStop(0, "rgba(20,30,52,0.10)");
      veil.addColorStop(0.55, "rgba(255,248,228,0.06)");
      veil.addColorStop(1, "rgba(20,14,12,0.22)");
    } else {
      veil.addColorStop(0, "rgba(18,10,16,0.16)");
      veil.addColorStop(0.55, "rgba(24,14,22,0.10)");
      veil.addColorStop(1, "rgba(14,8,12,0.26)");
    }
    ctx.fillStyle = veil;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);

    drawStageAtmosphere(ctx, theme, camX, clock);
    return;
  }

  // Respaldo procedimental si la imagen aún está cargando
  // Cielo en degradado
  const sky = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  sky.addColorStop(0, pal.skyTop);
  sky.addColorStop(0.58, pal.skyMid);
  sky.addColorStop(1, pal.skyBot);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sol, luna o candilejas según la fase
  if (theme === "salamanca" || theme === "mar") {
    const sx = theme === "mar" ? 510 : 480;
    const sy = 76;
    const rg = ctx.createRadialGradient(sx, sy, 8, sx, sy, 92);
    rg.addColorStop(0, "rgba(255,248,210,0.92)");
    rg.addColorStop(0.35, "rgba(255,232,165,0.38)");
    rg.addColorStop(1, "rgba(255,232,165,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(sx - 92, sy - 92, 184, 184);
    ctx.fillStyle = "#fff8dc";
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, 6.2832);
    ctx.fill();
  } else if (theme === "avila") {
    const sx = 320;
    const sy = 155;
    const rg = ctx.createRadialGradient(sx, sy, 14, sx, sy, 140);
    rg.addColorStop(0, "rgba(255,214,135,0.85)");
    rg.addColorStop(0.5, "rgba(235,130,85,0.28)");
    rg.addColorStop(1, "rgba(235,130,85,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(sx - 140, sy - 140, 280, 280);
  } else if (theme === "indice") {
    // Estrellas titilantes en la bóveda
    ctx.fillStyle = GOLD_HI;
    for (let i = 0; i < 36; i++) {
      const sx = ((i * 97 + 23) % VIEW_W);
      const sy = ((i * 53 + 11) % 165);
      ctx.globalAlpha = 0.35 + 0.55 * Math.abs(Math.sin(clock * 1.4 + i * 1.7));
      ctx.fillRect(sx, sy, i % 3 === 0 ? 2 : 1.5, i % 3 === 0 ? 2 : 1.5);
    }
    ctx.globalAlpha = 1;
  }

  // Nubes suaves (fases exteriores)
  if (theme === "salamanca" || theme === "avila" || theme === "mar") {
    ctx.fillStyle = theme === "avila" ? "rgba(255,190,150,0.22)" : "rgba(255,252,240,0.45)";
    const off = (camX * 0.08 + clock * 7) % 320;
    for (let i = -1; i < 4; i++) {
      const cx = i * 240 - off;
      const cy = 54 + (i % 2) * 30;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 52, 16, 0, 0, 6.2832);
      ctx.ellipse(cx - 28, cy + 4, 28, 12, 0, 0, 6.2832);
      ctx.ellipse(cx + 30, cy + 5, 32, 11, 0, 0, 6.2832);
      ctx.fill();
    }
  }

  // Capa lejana (paralaje 0.16)
  const pFar = -(camX * 0.16) % 240;
  ctx.fillStyle = pal.far;
  if (theme === "salamanca") {
    for (let x = pFar - 240; x < VIEW_W + 240; x += 240) {
      // Cúpulas y torres de Salamanca
      ctx.fillRect(x + 20, 210, 60, 160);
      ctx.beginPath();
      ctx.arc(x + 50, 210, 28, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(x + 48, 170, 4, 16);
      ctx.fillRect(x + 110, 185, 42, 185);
      ctx.beginPath();
      ctx.moveTo(x + 106, 185);
      ctx.lineTo(x + 131, 148);
      ctx.lineTo(x + 156, 185);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x + 165, 224, 65, 146);
    }
  } else if (theme === "avila") {
    for (let x = pFar - 240; x < VIEW_W + 240; x += 240) {
      // Muralla almenada y torres
      ctx.fillRect(x, 210, 240, 160);
      for (let m = 0; m < 240; m += 24) ctx.fillRect(x + m, 198, 14, 14);
      ctx.fillRect(x + 60, 148, 52, 210);
      for (let m = 0; m < 52; m += 16) ctx.fillRect(x + 60 + m, 138, 10, 12);
    }
  } else if (theme === "mar") {
    // Siluetas de galeones lejanos y horizonte marino
    ctx.fillStyle = pal.far;
    ctx.fillRect(0, 232, VIEW_W, 130);
    for (let x = pFar - 240; x < VIEW_W + 240; x += 240) {
      const bob = Math.sin(clock * 1.8 + x * 0.02) * 3;
      ctx.fillStyle = "rgba(248,236,210,0.5)";
      ctx.beginPath();
      ctx.moveTo(x + 92, 226 + bob);
      ctx.quadraticCurveTo(x + 114, 195 + bob, x + 94, 168 + bob);
      ctx.lineTo(x + 88, 226 + bob);
      ctx.fill();
      ctx.fillStyle = pal.mid;
      ctx.beginPath();
      ctx.moveTo(x + 70, 228 + bob);
      ctx.lineTo(x + 118, 228 + bob);
      ctx.lineTo(x + 110, 238 + bob);
      ctx.lineTo(x + 78, 238 + bob);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme === "corral") {
    // Telones de terciopelo y palcos lejanos
    for (let x = pFar - 240; x < VIEW_W + 240; x += 120) {
      ctx.fillStyle = pal.far;
      ctx.fillRect(x, 0, 118, VIEW_H);
      ctx.fillStyle = pal.mid;
      ctx.beginPath();
      ctx.arc(x + 60, 120, 44, Math.PI, 0);
      ctx.lineTo(x + 104, 360);
      ctx.lineTo(x + 16, 360);
      ctx.closePath();
      ctx.fill();
      // Araña de velas
      ctx.fillStyle = GOLD;
      ctx.fillRect(x + 59, 0, 2, 46);
      ctx.beginPath();
      ctx.arc(x + 60, 50, 14, 0, Math.PI);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#ffe599";
      const fl = Math.sin(clock * 9 + x) * 1.2;
      ctx.beginPath();
      ctx.arc(x + 48, 46 + fl, 3, 0, 6.2832);
      ctx.arc(x + 60, 44 - fl, 3.5, 0, 6.2832);
      ctx.arc(x + 72, 46 + fl, 3, 0, 6.2832);
      ctx.fill();
    }
  } else {
    // Biblioteca del Gran Índice: arcos monumentales y anaqueles infinitos
    for (let x = pFar - 240; x < VIEW_W + 240; x += 160) {
      ctx.fillStyle = pal.far;
      ctx.fillRect(x + 10, 60, 140, 300);
      // Estantes iluminados
      ctx.fillStyle = "rgba(240,207,115,0.16)";
      for (let sy = 85; sy < 310; sy += 26) {
        ctx.fillRect(x + 22, sy, 116, 4);
      }
      // Rosetón estrellado
      ctx.strokeStyle = "rgba(240,207,115,0.28)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + 80, 48, 22, 0, 6.2832);
      ctx.stroke();
    }
  }

  // Capa intermedia (paralaje 0.34): arcadas / velas / balcones
  const pMid = -(camX * 0.34) % 160;
  ctx.fillStyle = pal.mid;
  if (theme === "salamanca" || theme === "avila") {
    for (let x = pMid - 160; x < VIEW_W + 160; x += 160) {
      ctx.fillRect(x, 250, 160, 120);
      // Arcos recortados de luz cálida
      ctx.fillStyle = theme === "avila" ? "rgba(245,175,90,0.3)" : "rgba(250,235,195,0.42)";
      ctx.beginPath();
      ctx.arc(x + 40, 290, 22, Math.PI, 0);
      ctx.lineTo(x + 62, 360);
      ctx.lineTo(x + 18, 360);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 120, 290, 22, Math.PI, 0);
      ctx.lineTo(x + 142, 360);
      ctx.lineTo(x + 98, 360);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = pal.mid;
    }
  } else if (theme === "mar") {
    // Mástiles y velas hinchadas al fondo
    for (let x = pMid - 160; x < VIEW_W + 160; x += 220) {
      ctx.fillStyle = "#5c391d";
      ctx.fillRect(x + 76, 30, 8, 260);
      ctx.fillRect(x + 24, 92, 112, 5);
      ctx.fillStyle = "rgba(250,240,214,0.34)";
      ctx.beginPath();
      ctx.moveTo(x + 28, 97);
      ctx.quadraticCurveTo(x + 96, 148, x + 36, 200);
      ctx.lineTo(x + 128, 200);
      ctx.quadraticCurveTo(x + 150, 148, x + 132, 97);
      ctx.closePath();
      ctx.fill();
    }
  } else if (theme === "corral") {
    // Cortinaje superior rojo grana
    ctx.fillStyle = WINE;
    for (let x = pMid - 160; x < VIEW_W + 160; x += 80) {
      ctx.beginPath();
      ctx.arc(x + 40, 0, 44, 0, Math.PI);
      ctx.fill();
    }
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = pMid - 160; x < VIEW_W + 160; x += 80) {
      ctx.moveTo(x, 0);
      ctx.arc(x + 40, 0, 44, Math.PI, 0, true);
    }
    ctx.stroke();
  } else {
    // Grandes columnas gótico-neoclásicas del archivo
    for (let x = pMid - 160; x < VIEW_W + 160; x += 160) {
      ctx.fillStyle = pal.mid;
      ctx.fillRect(x + 12, 120, 26, 240);
      ctx.fillStyle = "rgba(240,207,115,0.22)";
      ctx.fillRect(x + 18, 130, 4, 220);
    }
  }
  drawStageAtmosphere(ctx, theme, camX, clock);
}

/** Efectos atmosféricos vivos sobre el fondo panorámico de cada época */
function drawStageAtmosphere(ctx: CanvasRenderingContext2D, theme: StageMeta["theme"], camX: number, clock: number): void {
  ctx.save();
  if (theme === "salamanca") {
    // Rayos de sol diagonales y hojitas de pergamino al viento
    ctx.fillStyle = "rgba(255,244,195,0.075)";
    for (let i = 0; i < 3; i++) {
      const rx = ((i * 250 - camX * 0.12) % (VIEW_W + 160) + VIEW_W + 160) % (VIEW_W + 160) - 80;
      ctx.beginPath();
      ctx.moveTo(rx, 0);
      ctx.lineTo(rx + 64, 0);
      ctx.lineTo(rx - 44, VIEW_H);
      ctx.lineTo(rx - 108, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
    for (let i = 0; i < 8; i++) {
      const lx = ((i * 93 + clock * (14 + (i % 3) * 5) - camX * 0.25) % VIEW_W + VIEW_W) % VIEW_W;
      const ly = ((i * 47 + Math.sin(clock * 2.1 + i) * 16 + clock * 9) % (VIEW_H - 70)) + 36;
      ctx.save();
      ctx.translate(lx, ly);
      ctx.rotate(Math.sin(clock * 2.6 + i) * 0.6);
      ctx.fillStyle = i % 2 === 0 ? "rgba(253,246,227,0.72)" : "rgba(247,220,132,0.58)";
      ctx.fillRect(-3.5, -2, 7, 4.5);
      ctx.restore();
    }
  } else if (theme === "avila") {
    // Pavesas doradas y carmesíes ascendiendo al atardecer
    for (let i = 0; i < 18; i++) {
      const ex = ((i * 41 + Math.sin(clock * 1.6 + i) * 18 - camX * 0.22) % VIEW_W + VIEW_W) % VIEW_W;
      const ey = VIEW_H - (((clock * (20 + (i % 4) * 7) + i * 31) % VIEW_H));
      ctx.fillStyle = i % 3 === 0 ? "rgba(255,222,120,0.8)" : "rgba(245,120,56,0.7)";
      ctx.beginPath();
      ctx.arc(ex, ey, 1.2 + (i % 2) * 0.9, 0, 6.2832);
      ctx.fill();
    }
  } else if (theme === "mar") {
    // Gaviotas planeando sobre el Pacífico y destellos de sol en el mar
    ctx.strokeStyle = "rgba(255,252,245,0.85)";
    ctx.lineWidth = 1.4;
    for (let i = 0; i < 5; i++) {
      const bx = ((i * 145 + clock * (22 + i * 3) - camX * 0.18) % (VIEW_W + 40) + VIEW_W + 40) % (VIEW_W + 40) - 20;
      const by = 52 + (i % 3) * 24 + Math.sin(clock * 2.4 + i) * 6;
      const flap = Math.sin(clock * 7 + i * 1.9) * 3.5;
      ctx.beginPath();
      ctx.moveTo(bx - 6, by + flap);
      ctx.quadraticCurveTo(bx - 3, by - 3, bx, by);
      ctx.quadraticCurveTo(bx + 3, by - 3, bx + 6, by + flap);
      ctx.stroke();
    }
    // Destellos de sol en el horizonte marino
    ctx.fillStyle = "rgba(255,252,230,0.55)";
    for (let i = 0; i < 14; i++) {
      const sx = ((i * 53 - camX * 0.28) % VIEW_W + VIEW_W) % VIEW_W;
      const sy = 195 + (i % 5) * 20;
      const w = 6 + Math.sin(clock * 5 + i * 2) * 5;
      if (w > 2) ctx.fillRect(sx, sy, w, 1.5);
    }
  } else if (theme === "corral") {
    // Halos parpadeantes de candilejas y motas de polvo dorado
    for (let i = 0; i < 4; i++) {
      const lx = 80 + i * 160;
      const fl = 0.1 + 0.04 * Math.sin(clock * 8.5 + i * 2.1);
      const rg = ctx.createRadialGradient(lx, 75, 4, lx, 75, 76);
      rg.addColorStop(0, `rgba(255,220,130,${fl})`);
      rg.addColorStop(1, "rgba(255,190,90,0)");
      ctx.fillStyle = rg;
      ctx.fillRect(lx - 76, 0, 152, 152);
    }
    ctx.fillStyle = "rgba(247,220,132,0.5)";
    for (let i = 0; i < 16; i++) {
      const dx = ((i * 47 + Math.sin(clock + i) * 14 - camX * 0.2) % VIEW_W + VIEW_W) % VIEW_W;
      const dy = ((i * 29 + clock * 6) % (VIEW_H - 80)) + 44;
      ctx.fillRect(dx, dy, 1.8, 1.8);
    }
  } else {
    // El Gran Índice: destellos estelares y páginas doradas flotando suavemente
    for (let i = 0; i < 16; i++) {
      const sx = ((i * 59 - camX * 0.15) % VIEW_W + VIEW_W) % VIEW_W;
      const sy = 44 + ((i * 37) % 150);
      ctx.globalAlpha = 0.25 + 0.65 * Math.abs(Math.sin(clock * 2.2 + i * 1.7));
      ctx.fillStyle = GOLD_HI;
      ctx.fillRect(sx - 1, sy - 1, 2, 2);
    }
    ctx.globalAlpha = 0.72;
    for (let i = 0; i < 6; i++) {
      const px = ((i * 118 + Math.sin(clock * 0.9 + i) * 20 - camX * 0.24) % VIEW_W + VIEW_W) % VIEW_W;
      const py = 95 + (i % 3) * 58 + Math.cos(clock * 1.4 + i) * 12;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(Math.sin(clock * 1.8 + i) * 0.35);
      ctx.fillStyle = CREAM;
      ctx.fillRect(-4, -3, 8, 6);
      ctx.fillStyle = GOLD;
      ctx.fillRect(-3, -1, 6, 1);
      ctx.restore();
    }
  }
  ctx.restore();
}

/* ================================================================== */
/* Escenografía Histórica en el Mundo (detrás de Clara)               */
/* ================================================================== */

export function drawWorldProp(
  ctx: CanvasRenderingContext2D,
  kind: PropKind,
  x: number,
  footY: number,
  meta: StageMeta,
  clock: number,
): void {
  ctx.save();
  ctx.translate(x, footY);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;

  if (kind === "arch") {
    // Arco plateresco con medallón universitario
    ctx.fillStyle = "rgba(216,180,124,0.85)";
    ctx.fillRect(-24, -64, 9, 64);
    ctx.fillRect(15, -64, 9, 64);
    ctx.beginPath();
    ctx.arc(0, -56, 24, Math.PI, 0);
    ctx.lineTo(24, -46);
    ctx.arc(0, -56, 15, 0, Math.PI, true);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(0, -76, 4.5, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
  } else if (kind === "banner" || kind === "theaterBanner") {
    // Pendón universitario / colgadura barroca ondeando
    const wave = Math.sin(clock * 3.2 + x * 0.05) * 2.5;
    ctx.fillStyle = "#523522";
    ctx.fillRect(-2, -62, 4, 62);
    ctx.fillRect(-2, -60, 26, 3);
    ctx.fillStyle = kind === "theaterBanner" ? "#8c1b29" : meta.palette.accent;
    ctx.beginPath();
    ctx.moveTo(4, -57);
    ctx.lineTo(22, -57);
    ctx.lineTo(22 + wave, -26);
    ctx.lineTo(13 + wave * 0.7, -33);
    ctx.lineTo(4 + wave * 0.4, -26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = GOLD_HI;
    ctx.beginPath();
    ctx.moveTo(13, -49);
    ctx.lineTo(17, -43);
    ctx.lineTo(13, -37);
    ctx.lineTo(9, -43);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "lantern") {
    // Farol de forja histórico encendido
    ctx.fillStyle = "#2b1d1b";
    ctx.fillRect(-2, -50, 4, 50);
    ctx.fillRect(-2, -50, 14, 3);
    const fl = 14 + Math.sin(clock * 9 + x) * 2.5;
    const rg = ctx.createRadialGradient(10, -40, 2, 10, -40, fl);
    rg.addColorStop(0, "rgba(255,232,140,0.75)");
    rg.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(10 - fl, -40 - fl, fl * 2, fl * 2);
    ctx.fillStyle = "#ffe58a";
    ctx.fillRect(6, -46, 8, 10);
    ctx.strokeRect(6, -46, 8, 10);
  } else if (kind === "stainedGlass") {
    // Ventanal con vidriera conventual iluminada
    ctx.fillStyle = "#473530";
    ctx.beginPath();
    ctx.moveTo(-18, 0);
    ctx.lineTo(-18, -48);
    ctx.arc(0, -48, 18, Math.PI, 0);
    ctx.lineTo(18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "rgba(235,176,82,0.52)";
    ctx.beginPath();
    ctx.moveTo(-13, -4);
    ctx.lineTo(-13, -46);
    ctx.arc(0, -46, 13, Math.PI, 0);
    ctx.lineTo(13, -4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#3c2320";
    ctx.beginPath();
    ctx.moveTo(0, -59);
    ctx.lineTo(0, -4);
    ctx.moveTo(-13, -32);
    ctx.lineTo(13, -32);
    ctx.stroke();
  } else if (kind === "helm") {
    // Timón del galeón Santa Isabel
    ctx.fillStyle = "#5c3519";
    ctx.fillRect(-4, -28, 8, 28);
    ctx.strokeRect(-4, -28, 8, 28);
    ctx.save();
    ctx.translate(0, -34);
    ctx.rotate(Math.sin(clock * 1.4) * 0.25);
    ctx.strokeStyle = "#8a5226";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, 6.2832);
    ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(a) * 18, Math.sin(a) * 18);
      ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  } else if (kind === "cannon") {
    // Cañón naval de bronce sobre cureña
    ctx.fillStyle = "#6e4220";
    ctx.fillRect(-14, -12, 26, 9);
    ctx.strokeRect(-14, -12, 26, 9);
    ctx.fillStyle = "#363840";
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.lineTo(18, -20);
    ctx.lineTo(18, -11);
    ctx.lineTo(-12, -9);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#3b2210";
    ctx.beginPath();
    ctx.arc(-8, -4, 4.5, 0, 6.2832);
    ctx.arc(7, -4, 4.5, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
  } else if (kind === "burgundyFlag") {
    // Bandera histórica con la Cruz de Borgoña ondeando
    const w = Math.sin(clock * 4.5 + x * 0.05) * 3;
    ctx.fillStyle = "#5c3519";
    ctx.fillRect(-2, -62, 4, 62);
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.moveTo(2, -60);
    ctx.lineTo(34, -56 + w);
    ctx.lineTo(34, -36 + w);
    ctx.lineTo(2, -38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#b8202c";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(4, -58);
    ctx.lineTo(32, -38 + w);
    ctx.moveTo(32, -54 + w);
    ctx.lineTo(4, -40);
    ctx.stroke();
  } else if (kind === "bustPedestal") {
    // Pedestal de taller de escultura barroca (La Roldana)
    ctx.fillStyle = "#cfc2aa";
    ctx.fillRect(-11, -30, 22, 30);
    ctx.strokeRect(-11, -30, 22, 30);
    ctx.fillStyle = "#e6dcc8";
    ctx.fillRect(-14, -33, 28, 4);
    ctx.beginPath();
    ctx.arc(0, -45, 7, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-9, -33);
    ctx.quadraticCurveTo(0, -40, 9, -33);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (kind === "bookshelf") {
    // Estantería barroca de libros antiguos
    ctx.fillStyle = "#4d2f1e";
    ctx.fillRect(-22, -66, 44, 66);
    ctx.strokeRect(-22, -66, 44, 66);
    const cols = ["#8c2332", "#27456f", "#c9982f", "#2f6b56", "#6b4a2b"];
    for (let row = 0; row < 3; row++) {
      const sy = -14 - row * 19;
      ctx.fillStyle = "#2d1a10";
      ctx.fillRect(-19, sy - 13, 38, 13);
      for (let b = 0; b < 7; b++) {
        ctx.fillStyle = cols[(row * 3 + b) % cols.length];
        ctx.fillRect(-17 + b * 5, sy - 11 - (b % 2), 4, 11 + (b % 2));
      }
    }
  } else if (kind === "cuzcoSun") {
    // Estandarte andino dorado en homenaje al Cuzco y Micaela Bastidas
    ctx.fillStyle = "#523522";
    ctx.fillRect(-2, -64, 4, 64);
    ctx.fillRect(-14, -62, 28, 3);
    ctx.fillStyle = "#7a1f2b";
    ctx.fillRect(-11, -59, 22, 34);
    ctx.strokeRect(-11, -59, 22, 34);
    ctx.fillStyle = GOLD_HI;
    ctx.beginPath();
    ctx.arc(0, -42, 6, 0, 6.2832);
    ctx.fill();
    ctx.strokeStyle = GOLD_HI;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + clock * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 7, -42 + Math.sin(a) * 7);
      ctx.lineTo(Math.cos(a) * 10, -42 + Math.sin(a) * 10);
      ctx.stroke();
    }
  } else if (kind === "telescope") {
    // Telescopio ilustrado de latón
    ctx.strokeStyle = "#5c3b20";
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.lineTo(-10, 0);
    ctx.moveTo(0, -24);
    ctx.lineTo(10, 0);
    ctx.moveTo(0, -24);
    ctx.lineTo(0, 0);
    ctx.stroke();
    ctx.save();
    ctx.translate(0, -26);
    ctx.rotate(-0.48);
    ctx.fillStyle = GOLD;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.fillRect(-14, -4, 30, 8);
    ctx.strokeRect(-14, -4, 30, 8);
    ctx.fillStyle = "#8fd4ff";
    ctx.fillRect(15, -3.5, 3, 7);
    ctx.restore();
  }

  ctx.restore();
}

/* ================================================================== */
/* Reliquias Históricas Interactivas (Atriles en el escenario)        */
/* ================================================================== */

export function drawRelicPickup(
  ctx: CanvasRenderingContext2D,
  kind: RelicKind,
  x: number,
  footY: number,
  clock: number,
  discovered: boolean,
): void {
  ctx.save();
  ctx.translate(x, footY);

  // Haz de luz cálida cuando aún no se ha descubierto
  if (!discovered) {
    const pulse = 0.24 + 0.12 * Math.sin(clock * 4.5 + x * 0.05);
    const rg = ctx.createRadialGradient(0, -24, 3, 0, -24, 28);
    rg.addColorStop(0, `rgba(247,220,132,${pulse + 0.25})`);
    rg.addColorStop(1, "rgba(247,220,132,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(-28, -52, 56, 56);
  }

  // Pedestal / atril de madera labrada y latón
  ctx.fillStyle = discovered ? "#6b5542" : "#5e331c";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.fillRect(-10, -14, 20, 14);
  ctx.strokeRect(-10, -14, 20, 14);
  ctx.fillStyle = discovered ? "#b59b6d" : GOLD;
  ctx.fillRect(-12, -16, 24, 3.5);
  ctx.strokeRect(-12, -16, 24, 3.5);

  // Objeto histórico flotando suavemente sobre el pedestal
  const bob = discovered ? 0 : Math.sin(clock * 4 + x * 0.06) * 2.5;
  ctx.translate(0, -27 + bob);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;

  if (kind === "press") {
    // Prensa de imprenta de madera con pliego
    ctx.fillStyle = "#7a4420";
    ctx.fillRect(-10, -8, 4, 16);
    ctx.fillRect(6, -8, 4, 16);
    ctx.fillRect(-10, -10, 20, 4);
    ctx.fillStyle = GOLD;
    ctx.fillRect(-2, -13, 4, 10);
    ctx.fillStyle = CREAM;
    ctx.fillRect(-5, 1, 10, 6);
    ctx.strokeRect(-5, 1, 10, 6);
  } else if (kind === "frog") {
    // La Rana de Salamanca sobre calavera de piedra
    ctx.fillStyle = "#e3d1a8";
    ctx.beginPath();
    ctx.arc(0, 3, 7, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#5a8f49";
    ctx.beginPath();
    ctx.ellipse(0, -5, 6.5, 4.2, 0, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = GOLD_HI;
    ctx.fillRect(-3.5, -9, 2.5, 2.5);
    ctx.fillRect(1.5, -9, 2.5, 2.5);
  } else if (kind === "turnstile") {
    // Torno conventual con libro abierto
    ctx.fillStyle = "#8a5a32";
    ctx.fillRect(-9, -8, 18, 16);
    ctx.strokeRect(-9, -8, 18, 16);
    ctx.fillStyle = CREAM;
    ctx.fillRect(-6, -4, 12, 8);
    ctx.strokeRect(-6, -4, 12, 8);
    ctx.beginPath();
    ctx.moveTo(0, -4);
    ctx.lineTo(0, 4);
    ctx.stroke();
  } else if (kind === "easel") {
    // Caballete de pintora con retrato
    ctx.strokeStyle = "#6e3e1c";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(-8, 9);
    ctx.moveTo(0, -11);
    ctx.lineTo(8, 9);
    ctx.stroke();
    ctx.fillStyle = "#27456f";
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.6;
    ctx.fillRect(-7, -8, 14, 12);
    ctx.strokeRect(-7, -8, 14, 12);
    ctx.fillStyle = SKIN;
    ctx.beginPath();
    ctx.arc(0, -3, 3, 0, 6.2832);
    ctx.fill();
  } else if (kind === "astrolabe") {
    // Astrolabio de bronce
    ctx.strokeStyle = GOLD_HI;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, 6.2832);
    ctx.stroke();
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.moveTo(0, -8);
    ctx.lineTo(0, 8);
    ctx.moveTo(-6, -6);
    ctx.lineTo(6, 6);
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(0, -11, 2.5, 0, 6.2832);
    ctx.fill();
  } else if (kind === "compass") {
    // Cartas selladas con lacre y brújula
    ctx.fillStyle = CREAM;
    ctx.fillRect(-10, -7, 20, 14);
    ctx.strokeRect(-10, -7, 20, 14);
    ctx.beginPath();
    ctx.moveTo(-10, -7);
    ctx.lineTo(0, 1);
    ctx.lineTo(10, -7);
    ctx.stroke();
    ctx.fillStyle = WINE;
    ctx.beginPath();
    ctx.arc(0, 1, 3.8, 0, 6.2832);
    ctx.fill();
  } else if (kind === "maskProp") {
    // Máscara de comedia del Siglo de Oro
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.ellipse(0, 0, 8.5, 10, 0, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = WINE;
    ctx.fillRect(-4, -3, 2.5, 2.5);
    ctx.fillRect(1.5, -3, 2.5, 2.5);
    ctx.beginPath();
    ctx.arc(0, 2, 4, 0, Math.PI);
    ctx.stroke();
  } else if (kind === "chisel") {
    // Gubia y mazo de escultora (La Roldana)
    ctx.rotate(-0.45);
    ctx.fillStyle = "#8a5226";
    ctx.fillRect(-10, -2.5, 11, 5);
    ctx.strokeRect(-10, -2.5, 11, 5);
    ctx.fillStyle = "#cfd8e6";
    ctx.fillRect(1, -2, 10, 4);
    ctx.strokeRect(1, -2, 10, 4);
  } else if (kind === "armillary") {
    // Esfera armilar de Sor Juana
    ctx.strokeStyle = GOLD_HI;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(0, 0, 9.5, 0, 6.2832);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 9.5, 4, 0.4, 0, 6.2832);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 4, 9.5, 0.4, 0, 6.2832);
    ctx.stroke();
    ctx.fillStyle = LAPIS;
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, 6.2832);
    ctx.fill();
  } else {
    // Birrete doctoral de Alcalá con borla dorada
    ctx.fillStyle = LAPIS;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(12, -3);
    ctx.lineTo(0, 3);
    ctx.lineTo(-12, -3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillRect(-6, 1, 12, 6);
    ctx.strokeRect(-6, 1, 12, 6);
    ctx.strokeStyle = GOLD_HI;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(10, 5);
    ctx.stroke();
  }

  // Etiqueta flotante discreta «HISTORIA» cuando está sin descubrir
  if (!discovered) {
    ctx.translate(0, -16);
    ctx.fillStyle = "rgba(28,13,18,0.78)";
    ctx.fillRect(-16, -6, 32, 11);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 0.8;
    ctx.strokeRect(-16, -6, 32, 11);
    ctx.fillStyle = GOLD_HI;
    ctx.font = "bold 7.5px 'IM Fell English SC', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SABER", 0, 0);
  }

  ctx.restore();
}

/* ================================================================== */
/* Baldosas del escenario                                             */
/* ================================================================== */

export function drawTile(
  ctx: CanvasRenderingContext2D,
  id: TileId,
  x: number,
  y: number,
  meta: StageMeta,
  clock: number,
  bumpY = 0,
  crumbleShake = 0,
): void {
  const pal = meta.palette;
  const dx = crumbleShake > 0 ? Math.sin(clock * 65) * 2.2 : 0;
  const px = x + dx;
  const py = y + bumpY;

  if (id === 1 || id === 9) {
    // Piedra labrada / cubierta de madera en fase 3
    ctx.fillStyle = pal.stone;
    ctx.fillRect(px, py, TILE, TILE);
    ctx.fillStyle = pal.stoneLight;
    ctx.fillRect(px, py, TILE, 4);
    ctx.fillStyle = pal.stoneDark;
    ctx.fillRect(px, py + TILE - 4, TILE, 4);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px + 0.6, py + 0.6, TILE - 1.2, TILE - 1.2);
    // Junta de sillares o tablones
    ctx.strokeStyle = pal.stoneDark;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px + 2, py + TILE / 2);
    ctx.lineTo(px + TILE - 2, py + TILE / 2);
    if (id === 9) {
      ctx.moveTo(px + 8, py + 2);
      ctx.lineTo(px + 8, py + TILE - 2);
      ctx.moveTo(px + TILE - 8, py + 2);
      ctx.lineTo(px + TILE - 8, py + TILE - 2);
    } else {
      ctx.moveTo(px + TILE / 2, py + 2);
      ctx.lineTo(px + TILE / 2, py + TILE / 2);
      ctx.moveTo(px + TILE / 4, py + TILE / 2);
      ctx.lineTo(px + TILE / 4, py + TILE - 2);
    }
    ctx.stroke();
    return;
  }

  if (id === 2) {
    // Galería de madera (atravesable desde abajo)
    ctx.fillStyle = "#8a5329";
    ctx.fillRect(px, py, TILE, 10);
    ctx.fillStyle = "#c98b51";
    ctx.fillRect(px, py, TILE, 3);
    ctx.fillStyle = "#4d2a12";
    ctx.fillRect(px + 3, py + 10, 4, 6);
    ctx.fillRect(px + TILE - 7, py + 10, 4, 6);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(px + 0.6, py + 0.6, TILE - 1.2, 9);
    return;
  }

  if (id === 3) {
    // Bloque agrietado rompible (estilo ladrillo Alex Kidd con sello de cera)
    ctx.fillStyle = "#b5693c";
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = "#df9a64";
    ctx.fillRect(px + 2, py + 2, TILE - 4, 4);
    ctx.fillStyle = "#723a1d";
    ctx.fillRect(px + 2, py + TILE - 5, TILE - 4, 3);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // Grietas en estrella (indica visualmente que se puede romper)
    ctx.beginPath();
    ctx.moveTo(px + 7, py + 7);
    ctx.lineTo(px + 15, py + 14);
    ctx.lineTo(px + 11, py + 24);
    ctx.moveTo(px + 15, py + 14);
    ctx.lineTo(px + 25, py + 11);
    ctx.moveTo(px + 15, py + 14);
    ctx.lineTo(px + 23, py + 23);
    ctx.stroke();
    return;
  }

  if (id === 4) {
    // Bloque «?» dorado brillante
    const glow = 0.8 + 0.2 * Math.sin(clock * 6 + x * 0.1);
    ctx.fillStyle = GOLD;
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = GOLD_HI;
    ctx.globalAlpha = glow;
    ctx.fillRect(px + 3, py + 3, TILE - 6, 5);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // Remaches
    ctx.fillStyle = "#6e470c";
    ctx.fillRect(px + 4, py + 4, 2, 2);
    ctx.fillRect(px + TILE - 6, py + 4, 2, 2);
    ctx.fillRect(px + 4, py + TILE - 6, 2, 2);
    ctx.fillRect(px + TILE - 6, py + TILE - 6, 2, 2);
    // Signo «?»
    ctx.fillStyle = WINE_DK;
    ctx.font = "bold 20px 'IM Fell English SC', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", px + TILE / 2 + 1, py + TILE / 2 + 2);
    ctx.fillStyle = CREAM;
    ctx.fillText("?", px + TILE / 2, py + TILE / 2 + 1);
    return;
  }

  if (id === 5) {
    // Bloque de calavera / sello trampa (guiño clásico a Alex Kidd)
    ctx.fillStyle = "#45232b";
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.8;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    // Calavera estilizada
    ctx.fillStyle = "#f2dfc0";
    ctx.beginPath();
    ctx.arc(px + 16, py + 13, 7, 0, 6.2832);
    ctx.fill();
    ctx.fillRect(px + 12, py + 18, 8, 5);
    ctx.fillStyle = "#b8202c";
    ctx.fillRect(px + 12, py + 11, 3, 3);
    ctx.fillRect(px + 17, py + 11, 3, 3);
    ctx.fillStyle = INK;
    ctx.fillRect(px + 14, py + 20, 1, 3);
    ctx.fillRect(px + 17, py + 20, 1, 3);
    return;
  }

  if (id === 6) {
    // Bloque usado
    ctx.fillStyle = "#7a6650";
    ctx.fillRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
    ctx.fillStyle = "#4d3e30";
    ctx.fillRect(px + 5, py + 5, 2, 2);
    ctx.fillRect(px + TILE - 7, py + 5, 2, 2);
    ctx.fillRect(px + 5, py + TILE - 7, 2, 2);
    ctx.fillRect(px + TILE - 7, py + TILE - 7, 2, 2);
    return;
  }

  if (id === 7) {
    // Losa frágil que se desmorona
    ctx.fillStyle = "#c9a87a";
    ctx.fillRect(px + 1, py + 2, TILE - 2, 13);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(px + 1, py + 2, TILE - 2, 13);
    ctx.beginPath();
    ctx.moveTo(px + 9, py + 2);
    ctx.lineTo(px + 12, py + 14);
    ctx.moveTo(px + 22, py + 2);
    ctx.lineTo(px + 19, py + 14);
    ctx.stroke();
    return;
  }

  if (id === 8) {
    // Brasero ardiente (peligro)
    ctx.fillStyle = "#3a2520";
    ctx.fillRect(px + 3, py + TILE - 8, TILE - 6, 8);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.strokeRect(px + 3, py + TILE - 8, TILE - 6, 8);
    for (let i = 0; i < 3; i++) {
      const fx = px + 8 + i * 8;
      const fh = 12 + Math.sin(clock * 14 + i * 2.1 + x) * 4;
      ctx.fillStyle = "#c92b24";
      ctx.beginPath();
      ctx.moveTo(fx - 5, py + TILE - 8);
      ctx.quadraticCurveTo(fx, py + TILE - 10 - fh, fx + 5, py + TILE - 8);
      ctx.fill();
      ctx.fillStyle = "#f7b538";
      ctx.beginPath();
      ctx.moveTo(fx - 2.6, py + TILE - 8);
      ctx.quadraticCurveTo(fx, py + TILE - 8 - fh * 0.68, fx + 2.6, py + TILE - 8);
      ctx.fill();
    }
  }
}

export function drawMovingPlatform(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, meta: StageMeta): void {
  const h = 13;
  ctx.fillStyle = meta.theme === "indice" ? "#4b386b" : "#7c4723";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = GOLD_HI;
  ctx.fillRect(x + 2, y + 1, w - 4, 3);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  // Enganches dorados laterales
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.arc(x + 6, y + h / 2, 3, 0, 6.2832);
  ctx.arc(x + w - 6, y + h / 2, 3, 0, 6.2832);
  ctx.fill();
}

export function drawWater(ctx: CanvasRenderingContext2D, camX: number, y: number, clock: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y + 70);
  g.addColorStop(0, "rgba(32,118,162,0.88)");
  g.addColorStop(1, "rgba(15,52,88,0.96)");
  ctx.fillStyle = g;
  ctx.fillRect(0, y, VIEW_W, 80);
  ctx.strokeStyle = "rgba(235,248,255,0.75)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -16; x <= VIEW_W + 16; x += 16) {
    const wy = y + Math.sin((x + camX) * 0.05 + clock * 4.2) * 3.5;
    if (x === -16) ctx.moveTo(x, wy);
    else ctx.lineTo(x, wy);
  }
  ctx.stroke();
}

/* ================================================================== */
/* Protagonista: Clara                                                */
/* ================================================================== */

export interface PlayerVisual {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facing: 1 | -1;
  grounded: boolean;
  crouching: boolean;
  strikeT: number;
  strikeMax: number;
  inv: number;
  sx: number;
  sy: number;
  shield: boolean;
  goldQuill: boolean;
  runCycle: number;
}

export function drawClara(ctx: CanvasRenderingContext2D, p: PlayerVisual, clock: number): void {
  if (p.inv > 0 && Math.floor(clock * 24) % 2 === 0) return;

  const cx = p.x + p.w / 2;
  const footY = p.y + p.h;
  const f = p.facing;

  ctx.save();
  ctx.translate(cx, footY);

  // Sombra de contacto en el suelo (sin blur costoso, 60fps en móvil)
  if (p.grounded) {
    ctx.fillStyle = "rgba(18,8,10,0.34)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 2.6, 0, 0, 6.2832);
    ctx.fill();
  }

  // Aura del Escudo de Seda
  if (p.shield) {
    ctx.save();
    ctx.strokeStyle = "rgba(120,210,255,0.85)";
    ctx.fillStyle = "rgba(120,210,255,0.16)";
    ctx.lineWidth = 1.8;
    const rr = 22 + Math.sin(clock * 8) * 1.5;
    ctx.beginPath();
    ctx.arc(0, -16, rr, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  // Aura suave si lleva Tinta de Oro
  if (p.goldQuill) {
    ctx.save();
    ctx.fillStyle = "rgba(247,220,132,0.18)";
    ctx.beginPath();
    ctx.arc(0, -16, 19 + Math.sin(clock * 10) * 1.5, 0, 6.2832);
    ctx.fill();
    ctx.restore();
  }

  ctx.scale(f * p.sx, p.sy);
  if (p.crouching) ctx.scale(1.08, 0.72);

  const running = p.grounded && Math.abs(p.vx) > 20;
  const stride = running ? Math.sin(p.runCycle) : 0;
  const bob = running ? Math.abs(Math.cos(p.runCycle)) * -2 : 0;
  ctx.translate(0, bob);

  // Capa corta azul añil que ondea al correr/saltar
  const flutter = Math.sin(clock * 12) * 2 + (running || !p.grounded ? 5 : 0);
  ctx.fillStyle = LAPIS;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -20);
  ctx.quadraticCurveTo(-13 - flutter * 0.5, -14, -14 - flutter, -6);
  ctx.lineTo(-4, -8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Botas animadas
  ctx.fillStyle = "#3a1e18";
  const lFoot = !p.grounded ? -3 : stride * 5;
  const rFoot = !p.grounded ? 4 : -stride * 5;
  ctx.fillRect(-5 + lFoot, -4, 6, 4);
  ctx.fillRect(0 + rFoot, -4, 6, 4);

  // Vestido / casaca granate de aprendiz con ribete dorado
  ctx.fillStyle = WINE;
  ctx.beginPath();
  ctx.moveTo(-6, -21);
  ctx.lineTo(6, -21);
  ctx.lineTo(9, -4);
  ctx.lineTo(-9, -4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD_HI;
  ctx.fillRect(-8, -7, 16, 2);

  // Cuello blanco (gorguera)
  ctx.fillStyle = CREAM;
  ctx.beginPath();
  ctx.ellipse(0, -21, 7, 2.5, 0, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  // Cabeza y moño
  ctx.fillStyle = "#3a2117";
  ctx.beginPath();
  ctx.arc(-6, -29, 4.2, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0, -28, 6.8, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  // Cabello frontal
  ctx.fillStyle = "#3a2117";
  ctx.beginPath();
  ctx.arc(0, -28, 7, Math.PI * 0.95, Math.PI * 1.92);
  ctx.closePath();
  ctx.fill();

  // Ojo expresivo
  ctx.fillStyle = INK;
  ctx.fillRect(2.2, -29.5, 2, 2.5);
  ctx.fillStyle = "rgba(210,85,85,0.4)";
  ctx.fillRect(3.2, -26.5, 2.2, 1.5);

  // Brazo y Pluma (en reposo o lanzando el Golpe de Pluma estilo Alex Kidd)
  const striking = p.strikeT > 0;
  if (striking) {
    const k = 1 - p.strikeT / p.strikeMax;
    const reach = 14 + Math.sin(k * Math.PI) * 20;

    // Arco de tinta luminoso
    ctx.save();
    ctx.strokeStyle = p.goldQuill ? GOLD_HI : "#5ba3e8";
    ctx.lineWidth = 4.5 * (1 - k * 0.4);
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(10, -16, reach * 0.78, -0.85, 0.72);
    ctx.stroke();
    ctx.strokeStyle = CREAM;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(12, -16, reach * 0.72, -0.65, 0.52);
    ctx.stroke();
    ctx.restore();

    // Pluma extendida al frente
    ctx.save();
    ctx.translate(reach * 0.78, -16);
    ctx.fillStyle = p.goldQuill ? GOLD_HI : CREAM;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.quadraticCurveTo(6, -7, 16, 0);
    ctx.quadraticCurveTo(6, 7, -6, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = p.goldQuill ? GOLD : LAPIS;
    ctx.beginPath();
    ctx.moveTo(8, -3);
    ctx.lineTo(17, 0);
    ctx.lineTo(8, 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else {
    // Pluma llevada en la mano
    ctx.save();
    ctx.translate(6, -14);
    ctx.rotate(-0.45 + stride * 0.2);
    ctx.fillStyle = p.goldQuill ? GOLD_HI : CREAM;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.quadraticCurveTo(5, -3, 1, -11);
    ctx.quadraticCurveTo(-4, -3, 0, 4);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/* ================================================================== */
/* Coleccionables, Retratos y Farol                                   */
/* ================================================================== */

export function drawCoin(ctx: CanvasRenderingContext2D, x: number, y: number, clock: number): void {
  const bob = Math.sin(clock * 5 + x * 0.08) * 2.5;
  const spin = Math.max(0.28, Math.abs(Math.cos(clock * 4 + x * 0.05)));
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.scale(spin, 1);
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 0, 7.5, 0, 6.2832);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = GOLD_HI;
  ctx.beginPath();
  ctx.arc(-1.5, -1.5, 3, 0, 6.2832);
  ctx.fill();
  ctx.restore();
}

export function drawPowerup(ctx: CanvasRenderingContext2D, type: LootType, x: number, y: number, clock: number): void {
  const bob = Math.sin(clock * 5) * 3;
  ctx.save();
  ctx.translate(x, y + bob);
  // Halo dorado
  ctx.fillStyle = "rgba(247,220,132,0.32)";
  ctx.beginPath();
  ctx.arc(0, 0, 14 + Math.sin(clock * 7) * 2, 0, 6.2832);
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  if (type === "heart") {
    ctx.fillStyle = "#cf2b36";
    ctx.beginPath();
    ctx.moveTo(0, 8);
    ctx.bezierCurveTo(-12, 0, -6, -10, 0, -3);
    ctx.bezierCurveTo(6, -10, 12, 0, 0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (type === "shield") {
    ctx.fillStyle = "#52a8e8";
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(9, -6);
    ctx.lineTo(7, 4);
    ctx.lineTo(0, 10);
    ctx.lineTo(-7, 4);
    ctx.lineTo(-9, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.fillRect(-2, -5, 4, 9);
  } else {
    // Pluma de Oro (dispara ondas de tinta)
    ctx.rotate(0.45);
    ctx.fillStyle = GOLD_HI;
    ctx.beginPath();
    ctx.moveTo(0, 10);
    ctx.quadraticCurveTo(8, 0, 1, -12);
    ctx.quadraticCurveTo(-7, 0, 0, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.fillRect(-1, -10, 2, 22);
  }
  ctx.restore();
}

export function drawPortraitPickup(ctx: CanvasRenderingContext2D, x: number, y: number, tint: string, clock: number): void {
  const bob = Math.sin(clock * 3.8 + x * 0.04) * 3.5;
  ctx.save();
  ctx.translate(x, y + bob);
  // Resplandor celestial
  const rg = ctx.createRadialGradient(0, 0, 4, 0, 0, 24);
  rg.addColorStop(0, "rgba(255,232,140,0.8)");
  rg.addColorStop(1, "rgba(255,232,140,0)");
  ctx.fillStyle = rg;
  ctx.fillRect(-24, -24, 48, 48);

  // Marco ovalado dorado
  ctx.fillStyle = GOLD;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 13.5, 0, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = tint;
  ctx.beginPath();
  ctx.ellipse(0, 0, 8, 10.2, 0, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  // Busto miniatura
  ctx.fillStyle = WINE;
  ctx.beginPath();
  ctx.arc(0, 8, 5, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = CREAM;
  ctx.fillRect(-4, 2, 8, 2);
  ctx.fillStyle = SKIN;
  ctx.beginPath();
  ctx.arc(0, -2, 3.6, 0, 6.2832);
  ctx.fill();
  ctx.restore();
}

export function drawCheckpoint(ctx: CanvasRenderingContext2D, x: number, y: number, lit: boolean, clock: number): void {
  // Poste de farol dorado
  ctx.fillStyle = "#4d3524";
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.fillRect(x - 3, y - 42, 6, 42);
  ctx.strokeRect(x - 3, y - 42, 6, 42);
  // Farol
  if (lit) {
    const r = 24 + Math.sin(clock * 8) * 3;
    const rg = ctx.createRadialGradient(x, y - 46, 2, x, y - 46, r);
    rg.addColorStop(0, "rgba(255,236,150,0.9)");
    rg.addColorStop(1, "rgba(255,200,80,0)");
    ctx.fillStyle = rg;
    ctx.fillRect(x - r, y - 46 - r, r * 2, r * 2);
  }
  ctx.fillStyle = lit ? "#ffe78a" : "#70625c";
  ctx.fillRect(x - 7, y - 54, 14, 14);
  ctx.strokeRect(x - 7, y - 54, 14, 14);
  // Capitel
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(x - 10, y - 54);
  ctx.lineTo(x, y - 62);
  ctx.lineTo(x + 10, y - 54);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

/* ================================================================== */
/* Enemigos                                                           */
/* ================================================================== */

export function drawEnemy(
  ctx: CanvasRenderingContext2D,
  type: EnemyType,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: number,
  clock: number,
  hurtT: number,
): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.save();
  ctx.translate(cx, y + h);
  ctx.scale(dir >= 0 ? 1 : -1, 1);
  if (hurtT > 0 && Math.floor(clock * 30) % 2 === 0) ctx.filter = "brightness(2.2)";

  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;

  if (type === "alguacil") {
    const step = Math.sin(clock * 11) * 3;
    // Alguacil rechoncho con capa oscura y sello rojo
    ctx.fillStyle = "#2b1c24";
    ctx.fillRect(-5 + step, -4, 4, 4);
    ctx.fillRect(2 - step, -4, 4, 4);
    ctx.fillStyle = "#3b232c";
    ctx.beginPath();
    ctx.roundRect(-10, -22, 20, 19, 4);
    ctx.fill();
    ctx.stroke();
    // Sello rojo en el pecho
    ctx.fillStyle = "#c9262e";
    ctx.beginPath();
    ctx.arc(2, -13, 4.5, 0, 6.2832);
    ctx.fill();
    // Sombrero de ala ancha
    ctx.fillStyle = "#1d1016";
    ctx.fillRect(-13, -25, 26, 3.5);
    ctx.fillRect(-8, -31, 16, 7);
    ctx.strokeRect(-8, -31, 16, 7);
    // Ojos fruncidos
    ctx.fillStyle = "#ffe58f";
    ctx.fillRect(2, -21, 3, 2);
  } else if (type === "crow") {
    // Cuervo de Tinta volador
    ctx.translate(0, -h / 2);
    const flap = Math.sin(clock * 16) * 8;
    ctx.fillStyle = "#1c1726";
    ctx.beginPath();
    ctx.ellipse(0, 0, 11, 7, 0, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    // Alas
    ctx.beginPath();
    ctx.moveTo(-2, -2);
    ctx.lineTo(-14, -10 + flap);
    ctx.lineTo(-4, 3);
    ctx.fill();
    ctx.stroke();
    // Pico dorado y ojo rojo
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(10, -2);
    ctx.lineTo(17, 1);
    ctx.lineTo(10, 3);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ff4d4d";
    ctx.fillRect(5, -3, 2.5, 2.5);
  } else if (type === "censor") {
    // Escribano Censor con toga y lacre en la mano
    ctx.fillStyle = "#4d1724";
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-8, -24);
    ctx.lineTo(8, -24);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Capucha / birrete
    ctx.fillStyle = "#2b0d15";
    ctx.beginPath();
    ctx.arc(0, -26, 7.5, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffcb6b";
    ctx.fillRect(2, -28, 3, 2.5);
    // Sello de lacre en la mano
    ctx.fillStyle = "#d92b32";
    ctx.beginPath();
    ctx.arc(10, -14, 5, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
  } else if (type === "flame") {
    // Llama de Pólvora saltarina
    ctx.translate(0, -h / 2);
    const wob = Math.sin(clock * 18) * 2;
    ctx.fillStyle = "#c92720";
    ctx.beginPath();
    ctx.moveTo(0, -13);
    ctx.bezierCurveTo(11 + wob, -2, 10, 10, 0, 11);
    ctx.bezierCurveTo(-10, 10, -11 - wob, -2, 0, -13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffd15c";
    ctx.beginPath();
    ctx.arc(0, 2, 5, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillRect(-3, 0, 2, 2);
    ctx.fillRect(2, 0, 2, 2);
  } else if (type === "piquero") {
    // Piquero con coraza y escudo frontal
    const step = Math.sin(clock * 9) * 3;
    ctx.fillStyle = "#4c5468";
    ctx.fillRect(-5 + step, -4, 4, 4);
    ctx.fillRect(2 - step, -4, 4, 4);
    ctx.fillStyle = "#69748c";
    ctx.fillRect(-9, -22, 18, 18);
    ctx.strokeRect(-9, -22, 18, 18);
    // Casco morrión
    ctx.fillStyle = "#8d99b3";
    ctx.beginPath();
    ctx.arc(0, -24, 7.5, Math.PI, 0);
    ctx.lineTo(11, -22);
    ctx.lineTo(-11, -22);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Escudo dorado frontal (bloquea golpes frontales simples)
    ctx.fillStyle = GOLD;
    ctx.fillRect(7, -23, 6, 20);
    ctx.strokeRect(7, -23, 6, 20);
    ctx.fillStyle = WINE;
    ctx.fillRect(9, -17, 2.5, 8);
  } else {
    // Máscara de Sombra teatral
    ctx.translate(0, -h / 2);
    ctx.fillStyle = "#f2e7d0";
    ctx.beginPath();
    ctx.ellipse(0, 0, 10, 12, 0, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = WINE_DK;
    ctx.beginPath();
    ctx.arc(-4, -3, 2.2, 0, 6.2832);
    ctx.arc(4, -3, 2.2, 0, 6.2832);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 4, 4.5, 0, Math.PI);
    ctx.stroke();
    // Halo violáceo
    ctx.strokeStyle = "rgba(180,80,140,0.65)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 15, 0, 0, 6.2832);
    ctx.stroke();
  }

  ctx.restore();
  void cy;
}

/* ================================================================== */
/* Jefes de Fase (5 jefes con silueta propia)                         */
/* ================================================================== */

export function drawBoss(
  ctx: CanvasRenderingContext2D,
  stageIndex: number,
  x: number,
  y: number,
  w: number,
  h: number,
  dir: number,
  clock: number,
  hurtT: number,
  telegraphT: number,
): void {
  const cx = x + w / 2;
  const footY = y + h;
  ctx.save();
  ctx.translate(cx, footY);
  ctx.scale(dir >= 0 ? 1 : -1, 1);

  if (hurtT > 0 && Math.floor(clock * 28) % 2 === 0) ctx.filter = "brightness(2.3)";

  // Halo rojo de aviso antes de embestir o atacar
  if (telegraphT > 0) {
    ctx.fillStyle = "rgba(255,70,70,0.28)";
    ctx.beginPath();
    ctx.arc(0, -h / 2, 34 + Math.sin(clock * 30) * 4, 0, 6.2832);
    ctx.fill();
  }

  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;

  const cloakColors = ["#381c24", "#5c161e", "#1d3d57", "#401440", "#171730"];
  const trimColors = [GOLD, "#f07c2e", GOLD_HI, "#f5d678", "#ff4d5a"];
  const bodyC = cloakColors[stageIndex] ?? "#381c24";
  const trimC = trimColors[stageIndex] ?? GOLD;

  const hover = stageIndex === 4 ? Math.sin(clock * 4.5) * 4 : 0;
  ctx.translate(0, hover);

  // Gran capa imperial / manto del jefe
  ctx.fillStyle = bodyC;
  ctx.beginPath();
  ctx.moveTo(-18, -42);
  ctx.lineTo(18, -42);
  ctx.lineTo(24, 0);
  ctx.lineTo(-24, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Ribete dorado y gran sello de censura en el torso
  ctx.fillStyle = trimC;
  ctx.fillRect(-20, -6, 40, 4);
  ctx.fillStyle = "#c9262e";
  ctx.beginPath();
  ctx.arc(2, -24, 9, 0, 6.2832);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = CREAM;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-2, -28);
  ctx.lineTo(6, -20);
  ctx.moveTo(6, -28);
  ctx.lineTo(-2, -20);
  ctx.stroke();

  // Cabeza y tocado característico de cada jefe
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillStyle = stageIndex === 3 ? CREAM : "#2b161c";
  ctx.beginPath();
  ctx.arc(0, -48, 12, 0, 6.2832);
  ctx.fill();
  ctx.stroke();

  // Sombrero / corona / tricornio según la fase
  ctx.fillStyle = bodyC;
  if (stageIndex === 0) {
    // Sombrero de alguacil mayor con pluma roja
    ctx.fillRect(-20, -56, 40, 5);
    ctx.fillRect(-11, -67, 22, 12);
    ctx.strokeRect(-11, -67, 22, 12);
  } else if (stageIndex === 1) {
    // Mitra de lacre alta
    ctx.beginPath();
    ctx.moveTo(-13, -55);
    ctx.lineTo(0, -76);
    ctx.lineTo(13, -55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (stageIndex === 2) {
    // Bicornio de corsario
    ctx.beginPath();
    ctx.moveTo(-22, -53);
    ctx.quadraticCurveTo(0, -74, 22, -53);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else if (stageIndex === 3) {
    // Máscara barroca con corona teatral
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-12, -56);
    ctx.lineTo(-8, -68);
    ctx.lineTo(0, -60);
    ctx.lineTo(8, -68);
    ctx.lineTo(12, -56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // El Gran Censor del Índice: corona de hierro y aura de páginas selladas
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.moveTo(-16, -56);
    ctx.lineTo(-14, -72);
    ctx.lineTo(-5, -62);
    ctx.lineTo(0, -76);
    ctx.lineTo(5, -62);
    ctx.lineTo(14, -72);
    ctx.lineTo(16, -56);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Ojos brillantes amenazadores
  ctx.fillStyle = stageIndex === 4 ? "#ff5252" : "#ffdf78";
  ctx.fillRect(2, -50, 4, 3);
  ctx.fillRect(-6, -50, 3.5, 3);

  ctx.restore();
}

export function drawProjectile(ctx: CanvasRenderingContext2D, x: number, y: number, friendly: boolean, clock: number): void {
  ctx.save();
  ctx.translate(x, y);
  if (friendly) {
    // Onda dorada de la Pluma de Oro
    ctx.rotate(clock * 14);
    ctx.fillStyle = GOLD_HI;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, 6.2832);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = CREAM;
    ctx.beginPath();
    ctx.arc(-1.5, -1.5, 2.8, 0, 6.2832);
    ctx.fill();
  } else {
    // Sello de lacre enemigo giratorio
    ctx.rotate(clock * 10);
    ctx.fillStyle = "#360d12";
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const r = i % 2 === 0 ? 9 : 6.2;
      if (i === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#d92b32";
    ctx.beginPath();
    ctx.arc(0, 0, 5.2, 0, 6.2832);
    ctx.fill();
    ctx.fillStyle = CREAM;
    ctx.fillRect(-1.2, -3.5, 2.4, 7);
    ctx.fillRect(-3.5, -1.2, 7, 2.4);
  }
  ctx.restore();
}
