
// @ts-ignore
import fs from 'node:fs';
import path from 'node:path';
// @ts-ignore
import * as opentype from 'opentype.js';
import { Command } from 'commander';
import { mmToFontSize, transformPath, flattenSvgPath, roundMm } from './utils.js';
import DxfWriter, { Units, Colors } from '@tarikjabiri/dxf';
import { svgPathProperties } from 'svg-path-properties';

const program = new Command();
program
  .requiredOption('--font <file>', 'Path to TTF/OTF font file')
  .requiredOption('--text <string>', 'Text to convert')
  .option('--height-mm <mm>', 'Target text height in mm (default 10)', (v)=>parseFloat(v), 10)
  .option('--width-mm <mm>', 'Target overall width in mm (overrides height)', (v)=>parseFloat(v))
  .option('--kerning', 'Enable kerning', false)
  .option('--letter-spacing <mm>', 'Extra letter spacing in mm', (v)=>parseFloat(v), 0)
  .option('--line-spacing <mm>', 'Line spacing (multiline) in mm', (v)=>parseFloat(v), 0)
  .option('--separate', 'Export per-character layers', false)
  .option('--union', 'Union filled contours (approximate)', false)
  .option('--tolerance <mm>', 'Curve flattening tolerance (mm)', (v)=>parseFloat(v), 0.1)
  .option('--origin-left', 'Origin at left baseline', false)
  .option('--origin-center', 'Origin centered bounding box', false)
  .option('--dxf', 'Export DXF', true)
  .option('--svg', 'Export SVG', true)
  .option('--out <dir>', 'Output directory', 'out')
  .parse(process.argv);

const opts = program.opts();

await fs.promises.mkdir(opts.out, { recursive: true });

const font = await opentype.load(opts.font);
const unitsPerEm = font.unitsPerEm || 1000;

const lines = String(opts.text).split(/\r?\n/);
const fontSizePt = opts.width_mm ? mmToFontSize(opts.height_mm) : mmToFontSize(opts.height_mm);
const scale = fontSizePt / unitsPerEm; // glyph path units * scale -> mm (before y-flip)

// Build SVG paths for each glyph
type GlyphPath = { d: string, bbox: { x: number, y: number, w: number, h: number } };
const glyphs: GlyphPath[] = [];

let xCursor = 0;
let yCursor = 0;
const lineAdvance = opts.line_spacing;

for (let lineIndex=0; lineIndex<lines.length; lineIndex++) {
  const text = lines[lineIndex];
  xCursor = 0;
  for (let i=0; i<text.length; i++) {
    const ch = text[i];
    const glyph = font.charToGlyph(ch);
    const kern = opts.kerning && i>0 ? font.getKerningValue(font.charToGlyph(text[i-1]), glyph) : 0;
    const glyphPath = glyph.getPath(0, 0, mmToFontSize(opts.height_mm)); // path in pt coordinates
    const dRaw = glyphPath.toPathData(5); // keep bezier detail; will flatten later
    // compute advance width in mm
    const advMm = (glyph.advanceWidth + kern) * (mmToFontSize(opts.height_mm) / unitsPerEm) + opts.letter_spacing;
    // position transform
    const dTrans = transformPath(dRaw, (1/72)*25.4, xCursor, yCursor); // convert from pt to mm & place
    glyphs.push({ d: dTrans, bbox: { x: xCursor, y: yCursor, w: advMm, h: 0 } });
    xCursor += advMm;
  }
  yCursor -= lineAdvance;
}

// Compute overall bbox
const minX = Math.min(...glyphs.map(g=>DOMRectFromPath(g.d).minX), 0);
const maxX = Math.max(...glyphs.map(g=>DOMRectFromPath(g.d).maxX), 0);
const minY = Math.min(...glyphs.map(g=>DOMRectFromPath(g.d).minY), 0);
const maxY = Math.max(...glyphs.map(g=>DOMRectFromPath(g.d).maxY), 0);
const widthMm = maxX - minX;
const heightMm = maxY - minY;

// Optionally re-center origin
let originX = 0, originY = 0;
if (opts.origin_center) {
  originX = -minX - widthMm/2;
  originY = -minY - heightMm/2;
} else if (opts.origin_left) {
  originX = -minX;
  originY = -minY;
}

// SVG export
if (opts.svg) {
  const paths = glyphs.map(g => `<path d="${transformPath(g.d,1,originX,originY)}" fill="none" stroke="black" stroke-width="0.1"/>`).join('\n  ');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${roundMm(minX+originX)} ${roundMm(minY+originY)} ${roundMm(widthMm)} ${roundMm(heightMm)}">
  ${paths}
</svg>`;
  await fs.promises.writeFile(path.join(opts.out, 'text.svg'), svg, 'utf-8');
}

// DXF export
if (opts.dxf) {
  // @ts-ignore
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Millimeters);
  let idx = 1;
  for (const g of glyphs) {
    const layer = opts.separate ? `C${idx}` : 'TEXT';
    if (opts.separate) dxf.addLayer(layer, Colors.White, 'CONTINUOUS');
    const pts = flattenSvgPath(transformPath(g.d,1,originX,originY), opts.tolerance);
    if (pts.length >= 2) {
      dxf.addPolyline(pts.map(([x,y])=>({x, y})), false, layer);
    }
    idx++;
  }
  await fs.promises.writeFile(path.join(opts.out, 'text.dxf'), dxf.stringify(), 'utf-8');
}

/** Minimal path bbox via sampling; adequate for layout */
function DOMRectFromPath(d: string) {
  const props = new svgPathProperties(d);
  const L = props.getTotalLength();
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  const steps = 200;
  for (let s=0; s<=steps; s++) {
    const p = props.getPointAtLength(L*s/steps);
    if (p.x<minX) minX=p.x;
    if (p.y<minY) minY=p.y;
    if (p.x>maxX) maxX=p.x;
    if (p.y>maxY) maxY=p.y;
  }
  return {minX, minY, maxX, maxY};
}
