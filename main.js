
import * as opentype from 'opentype.js';
import { mmToFontSize, transformPath, flattenSvgPath, roundMm } from './src/utils.js';
import { DxfWriter, Units } from '@tarikjabiri/dxf';
import { svgPathProperties } from 'svg-path-properties';

const $ = (id) => document.getElementById(id);

let font = null;
let currentPath = '';

async function loadFont(url) {
  try {
    font = await opentype.load(url);
    render();
  } catch (e) {
    console.error('Failed to load font:', e);
    $('svg').innerHTML = '<text x="400" y="100" text-anchor="middle" font-size="20" fill="red">Failed to load font</text>';
  }
}

function render() {
  if (!font) return;

  const text = $('text').value;
  const size = parseInt($('size').value);
  const kerning = $('kerning').checked;

  const svg = $('svg');
  svg.innerHTML = '';

  const unitsPerEm = font.unitsPerEm || 1000;
  const scale = size / unitsPerEm;

  let x = 50;
  let y = 120;
  let paths = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);

    if (glyph) {
      const pathData = glyph.getPath(x, y, size).toPathData();
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathData);
      path.setAttribute('fill', 'black');
      svg.appendChild(path);
      paths.push(pathData);

      const advance = glyph.advanceWidth * scale;
      if (kerning && i < text.length - 1) {
        const nextGlyph = font.charToGlyph(text[i + 1]);
        if (nextGlyph) {
          const kern = font.getKerningValue(glyph, nextGlyph) * scale;
          x += advance + kern;
        } else {
          x += advance;
        }
      } else {
        x += advance;
      }
    }
  }

  currentPath = paths.join(' ');
  $('pathOutput').value = currentPath;
}

function downloadSvg() {
  if (!currentPath) return;

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200">
  <path d="${currentPath}" fill="black"/>
</svg>`;

  download('font-path.svg', svgContent, 'image/svg+xml');
}

function downloadDxf() {
  if (!currentPath) return;

  const dxf = new DxfWriter();
  dxf.setUnits(Units.Millimeters);

  const props = new svgPathProperties(currentPath);
  const length = props.getTotalLength();
  const step = 0.5; // 0.5mm steps
  const points = [];

  for (let s = 0; s <= length; s += step) {
    const point = props.getPointAtLength(s);
    points.push({ x: point.x, y: point.y });
  }

  if (points.length >= 2) {
    dxf.addPolyline(points, false, 'FONT_PATH');
  }

  download('font-path.dxf', dxf.stringify(), 'application/dxf');
}

function download(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Event listeners
$('font').addEventListener('change', (e) => {
  const url = e.target.value;
  loadFont(url);
});

$('text').addEventListener('input', render);
$('size').addEventListener('input', () => {
  $('sizeValue').textContent = $('size').value + 'px';
  render();
});
$('kerning').addEventListener('change', render);
$('separate').addEventListener('change', render);

$('downloadSvg').addEventListener('click', downloadSvg);
$('downloadDxf').addEventListener('click', downloadDxf);

// Load default font
loadFont('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff');
