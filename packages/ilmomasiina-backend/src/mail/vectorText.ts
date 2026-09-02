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

export interface VectorTextOptions {
  font?: "anta" | "jacquard" | "jacquard12";
  fontSize?: number;
  color?: string;
  padding?: number;
  className?: string;
  style?: string;
  asImg?: boolean;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generates an SVG string containing vector paths for the given text.
 */
export function renderVectorSvg(text: string, options: VectorTextOptions = {}): string {
  const fontType = options.font ?? "anta";
  const fontSize = options.fontSize ?? 40;
  const color = options.color ?? "#ffffff";
  const padding = options.padding ?? 4;

  const font = getFont(fontType);

  // Measure initial path at origin (0, 0)
  const initialPath = font.getPath(text, 0, 0, fontSize);
  const bbox = initialPath.getBoundingBox();

  const width = Math.ceil(bbox.x2 - bbox.x1 + padding * 2);
  const height = Math.ceil(bbox.y2 - bbox.y1 + padding * 2);

  // Position glyphs properly inside viewBox
  const x = padding - bbox.x1;
  const y = padding - bbox.y1;

  const pathObj = font.getPath(text, x, y, fontSize);
  const pathData = pathObj.toPathData(2);

  const escapedText = escapeHtml(text);
  const extraStyle = options.style ? `;${options.style}` : "";
  const classAttr = options.className ? ` class="${escapeHtml(options.className)}"` : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" ` +
    `width="${width}" height="${height}"${classAttr} ` +
    `style="display:inline-block;vertical-align:middle;max-width:100%;height:auto${extraStyle}" ` +
    `role="img" aria-label="${escapedText}">` +
    `<path d="${pathData}" fill="${color}" />` +
    "</svg>"
  );
}

/**
 * Generates an accessible <img> tag with data:image/svg+xml containing vector text paths.
 * Highly compatible across email clients including Gmail, Outlook, Apple Mail, and mobile apps.
 */
export function vectorText(text: string, options: VectorTextOptions = {}): string {
  const svg = renderVectorSvg(text, options);
  const base64 = Buffer.from(svg).toString("base64");
  const dataUri = `data:image/svg+xml;base64,${base64}`;

  const escapedText = escapeHtml(text);
  const classAttr = options.className ? ` class="${escapeHtml(options.className)}"` : "";
  const extraStyle = options.style ? `;${options.style}` : "";

  return (
    `<img src="${dataUri}" alt="${escapedText}"${classAttr} ` +
    `style="display:inline-block;vertical-align:middle;max-width:100%;height:auto;border:0${extraStyle}" />`
  );
}
