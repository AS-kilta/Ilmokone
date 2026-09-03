import { Resvg } from "@resvg/resvg-js";
import fs from "fs";
import opentype from "opentype.js";
import path from "path";

const FONTS_DIR = path.join(__dirname, "../../emails/fonts");

let antaFont: opentype.Font | null = null;
let jacquardFont: opentype.Font | null = null;

function loadFont(filename: string): opentype.Font {
  const fontPath = path.join(FONTS_DIR, filename);
  const buf = fs.readFileSync(fontPath);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

function getFont(fontName: "anta" | "jacquard" | "jacquard12"): opentype.Font {
  if (fontName === "jacquard" || fontName === "jacquard12") {
    if (!jacquardFont) {
      jacquardFont = loadFont("Jacquard12-Regular.ttf");
    }
    return jacquardFont;
  }
  if (!antaFont) {
    antaFont = loadFont("Anta-Regular.ttf");
  }
  return antaFont;
}

export interface PngTextOptions {
  font?: "anta" | "jacquard" | "jacquard12";
  fontSize?: number;
  color?: string;
  padding?: number;
  className?: string;
  style?: string;
}

export interface RenderedPng {
  buffer: Buffer;
  width: number;
  height: number;
  base64: string;
  dataUri: string;
}

const pngCache = new Map<string, RenderedPng>();

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function commandsToPathData(commands: opentype.PathCommand[], decimals = 2): string {
  let d = "";
  for (let i = 0; i < commands.length; i += 1) {
    const cmd = commands[i];
    if (cmd.type === "M") {
      d += `M${Number(cmd.x.toFixed(decimals))} ${Number(cmd.y.toFixed(decimals))}`;
    } else if (cmd.type === "L") {
      d += `L${Number(cmd.x.toFixed(decimals))} ${Number(cmd.y.toFixed(decimals))}`;
    } else if (cmd.type === "C") {
      const x1 = Number(cmd.x1.toFixed(decimals));
      const y1 = Number(cmd.y1.toFixed(decimals));
      const x2 = Number(cmd.x2.toFixed(decimals));
      const y2 = Number(cmd.y2.toFixed(decimals));
      const x = Number(cmd.x.toFixed(decimals));
      const y = Number(cmd.y.toFixed(decimals));
      d += `C${x1} ${y1} ${x2} ${y2} ${x} ${y}`;
    } else if (cmd.type === "Q") {
      const x1 = Number(cmd.x1.toFixed(decimals));
      const y1 = Number(cmd.y1.toFixed(decimals));
      const x = Number(cmd.x.toFixed(decimals));
      const y = Number(cmd.y.toFixed(decimals));
      d += `Q${x1} ${y1} ${x} ${y}`;
    } else if (cmd.type === "Z") {
      d += "Z";
    }
  }
  return d;
}

/**
 * Generates an SVG string containing vector paths for the given text.
 */
function renderSvgForPng(text: string, options: PngTextOptions = {}): { svg: string; width: number; height: number } {
  const fontType = options.font ?? "anta";
  const fontSize = options.fontSize ?? 40;
  const color = options.color ?? "#ffffff";
  const padding = options.padding ?? 4;

  const font = getFont(fontType);

  // Measure path bounding box
  const initialPath = font.getPath(text, 0, 0, fontSize);
  const bbox = initialPath.getBoundingBox();

  const width = Math.ceil(bbox.x2 - bbox.x1 + padding * 2);
  const height = Math.ceil(bbox.y2 - bbox.y1 + padding * 2);

  const x = padding - bbox.x1;
  const y = padding - bbox.y1;

  const pathObj = font.getPath(text, x, y, fontSize);
  const pathData = commandsToPathData(pathObj.commands, 2);

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}">` +
    `<path d="${pathData}" fill="${color}" />` +
    "</svg>";

  return { svg, width, height };
}

/**
 * Renders text into a high-DPI (2x retina) PNG buffer and caches it in memory.
 */
export function getOrRenderPng(text: string, options: PngTextOptions = {}): RenderedPng {
  const fontType = options.font ?? "anta";
  const fontSize = options.fontSize ?? 40;
  const color = options.color ?? "#ffffff";
  const padding = options.padding ?? 4;

  const cacheKey = `${fontType}_${fontSize}_${color}_${padding}_${text}`;
  const cached = pngCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { svg, width, height } = renderSvgForPng(text, options);

  // Render at 2x zoom for high-density crispness on mobile and retina screens
  const resvg = new Resvg(svg, { fitTo: { mode: "zoom", value: 2 } });
  const pngData = resvg.render();
  const buffer = Buffer.from(pngData.asPng());
  const base64 = buffer.toString("base64");
  const dataUri = `data:image/png;base64,${base64}`;

  const result: RenderedPng = {
    buffer,
    width,
    height,
    base64,
    dataUri,
  };

  pngCache.set(cacheKey, result);
  return result;
}

/**
 * Generates an <img> tag with data:image/png;base64,... (for browser preview).
 */
export function renderPngDataUriImg(text: string, options: PngTextOptions = {}): string {
  const { dataUri, width, height } = getOrRenderPng(text, options);
  const escapedText = escapeHtml(text);
  const classAttr = options.className ? ` class="${escapeHtml(options.className)}"` : "";
  const extraStyle = options.style ? `;${options.style}` : "";

  return (
    `<img src="${dataUri}" alt="${escapedText}" width="${width}" height="${height}"${classAttr} ` +
    `style="display:inline-block;vertical-align:middle;max-width:100%;height:auto;border:0${extraStyle}" />`
  );
}

/**
 * Generates an <img> tag referencing a CID attachment (for universal email delivery).
 */
export function renderPngCidImg(text: string, cid: string, options: PngTextOptions = {}): string {
  const { width, height } = getOrRenderPng(text, options);
  const escapedText = escapeHtml(text);
  const classAttr = options.className ? ` class="${escapeHtml(options.className)}"` : "";
  const extraStyle = options.style ? `;${options.style}` : "";

  return (
    `<img src="cid:${cid}" alt="${escapedText}" width="${width}" height="${height}"${classAttr} ` +
    `style="display:inline-block;vertical-align:middle;max-width:100%;height:auto;border:0${extraStyle}" />`
  );
}
