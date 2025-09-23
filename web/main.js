
import * as opentype from 'opentype.js';
import { mmToFontSize, transformPath } from './src/utils.js';

const $ = (id)=>document.getElementById(id);

function download(name, content, type='application/octet-stream') {
  const a=document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], {type}));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

let lastPaths = [];

$('render').onclick = async () => {
  const file = /** @type {HTMLInputElement} */($('font')).files[0];
  if (!file) { alert('Choose a font file'); return; }
  const arrayBuffer = await file.arrayBuffer();
  const font = opentype.parse(arrayBuffer);
  const text = /** @type {HTMLTextAreaElement} */($('text')).value;
  const heightMm = parseFloat((/** @type {HTMLInputElement} */($('height')).value));
  const tol = parseFloat((/** @type {HTMLInputElement} */($('tol')).value));
  const kerning = (/** @type {HTMLInputElement} */($('kerning'))).checked;
  const letterSpacing = parseFloat((/** @type {HTMLInputElement} */($('ls')).value));
  const lineSpacing = parseFloat((/** @type {HTMLInputElement} */($('line')).value));
  const lines = text.split(/\r?\n/);

  const svg = /** @type {SVGSVGElement} */($('svg'));
  svg.innerHTML='';
  lastPaths = [];

  const unitsPerEm = font.unitsPerEm || 1000;
  const sizePt = mmToFontSize(heightMm);

  let x=0, y=0;
  let minX=1e9, minY=1e9, maxX=-1e9, maxY=-1e9;

  for (let li=0; li<lines.length; li++) {
    const line = lines[li];
    x = 0;
    for (let i=0; i<line.length; i++) {
      const ch = line[i];
      const g = font.charToGlyph(ch);
      const prev = i>0 ? font.charToGlyph(line[i-1]) : null;
      const kern = kerning && prev ? font.getKerningValue(prev, g) : 0;

      const p = g.getPath(0, 0, sizePt);
      const d = p.toPathData(5);
      const d2 = transformPath(d, (1/72)*25.4, x, y);

      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', d2);
      path.setAttribute('fill','none');
      path.setAttribute('stroke','black');
      path.setAttribute('stroke-width','0.1');
      svg.appendChild(path);

      lastPaths.push(d2);

      // bbox estimate via SVG path element
      const bb = path.getBBox();
      minX = Math.min(minX, bb.x);
      minY = Math.min(minY, bb.y);
      maxX = Math.max(maxX, bb.x + bb.width);
      maxY = Math.max(maxY, bb.y + bb.height);

      const advMm = (g.advanceWidth + kern) * (sizePt / unitsPerEm) * (25.4/72) + letterSpacing;
      x += advMm;
    }
    y -= lineSpacing;
  }

  const w = maxX - minX;
  const h = maxY - minY;
  svg.setAttribute('viewBox', `${minX} ${-maxY} ${w} ${h}`);
};

$('saveSvg').onclick = () => {
  if (!lastPaths.length) return;
  const paths = lastPaths.map(d=>`<path d="${d}" fill="none" stroke="black" stroke-width="0.1"/>`).join('\n  ');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg">
  ${paths}
</svg>`;
  download('text.svg', svg, 'image/svg+xml');
};

$('saveDxf').onclick = async () => {
  if (!lastPaths.length) return;
  const { default: DxfWriter, Units } = await import('@tarikjabiri/dxf');
  const dxf = new DxfWriter();
  dxf.setUnits(Units.Millimeters);

  for (const d of lastPaths) {
    // naive flatten by sampling along length
    const { SVGPathProperties } = await import('svg-path-properties');
    const props = new SVGPathProperties(d);
    const L = props.getTotalLength();
    const step = Math.max(0.1, parseFloat((/** @type {HTMLInputElement} */($('tol')).value)));
    const pts = [];
    for (let s=0; s<=L; s+=step) {
      const p = props.getPointAtLength(s);
      pts.push({x:p.x, y:p.y});
    }
    if (pts.length>=2) dxf.addPolyline(pts, false, 'TEXT');
  }
  download('text.dxf', dxf.stringify(), 'application/dxf');
};
