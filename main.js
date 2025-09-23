
import * as opentype from 'opentype.js';
import { mmToFontSize, transformPath, flattenSvgPath, roundMm } from './src/utils.js';
import { DxfWriter, Units } from '@tarikjabiri/dxf';
import { svgPathProperties } from 'svg-path-properties';

const $ = (id) => document.getElementById(id);

let font = null;
let currentPath = '';
let debugLog = [];

// Theme toggle
const themeToggle = $('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
themeToggle.textContent = currentTheme === 'dark' ? '☀️' : '🌙';

themeToggle.addEventListener('click', () => {
  const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('theme', newTheme);
  themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  addDebug('Theme changed to: ' + newTheme);
});

function addDebug(message) {
  debugLog.push(new Date().toLocaleTimeString() + ': ' + message);
  if (debugLog.length > 20) debugLog.shift();
  $('debugOutput').innerHTML = debugLog.join('<br>');
}

async function loadFont(url) {
  addDebug('Loading font from: ' + url);
  try {
    font = await opentype.load(url);
    addDebug('Font loaded successfully: ' + font.familyName + ' ' + font.styleName);
    render();
  } catch (e) {
    addDebug('Failed to load font: ' + e.message);
    $('svg').innerHTML = `<text x="400" y="100" text-anchor="middle" font-size="16" fill="red">Failed to load font: ${e.message}</text>`;
  }
}

function render() {
  addDebug('Render called, font loaded: ' + !!font);
  if (!font) {
    addDebug('No font loaded, skipping render');
    return;
  }

  const text = $('text').value;
  const size = parseInt($('size').value);
  const kerning = $('kerning').checked;

  addDebug('Rendering text: "' + text + '" size: ' + size + ' kerning: ' + kerning);

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
    addDebug('Char: ' + char + ' glyph: ' + (glyph ? 'found' : 'not found'));

    if (glyph) {
      const pathData = glyph.getPath(x, y, size).toPathData();
      addDebug('Path data length: ' + pathData.length);
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
  addDebug('Generated path length: ' + currentPath.length);
  $('pathOutput').value = currentPath;
}

function downloadSvg() {
  addDebug('Download SVG clicked, path length: ' + currentPath.length);
  if (!currentPath) {
    addDebug('No path to download');
    alert('No path to download. Please render some text first.');
    return;
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 200">
  <path d="${currentPath}" fill="black"/>
</svg>`;

  addDebug('SVG content generated, length: ' + svgContent.length);
  download('font-path.svg', svgContent, 'image/svg+xml');
  addDebug('SVG download initiated');
}

function downloadDxf() {
  addDebug('Download DXF clicked, path length: ' + currentPath.length);
  if (!currentPath) {
    addDebug('No path to download');
    alert('No path to download. Please render some text first.');
    return;
  }

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

  const dxfContent = dxf.stringify();
  addDebug('DXF content generated, length: ' + dxfContent.length + ', points: ' + points.length);
  download('font-path.dxf', dxfContent, 'application/dxf');
  addDebug('DXF download initiated');
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
loadFont('https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff');
