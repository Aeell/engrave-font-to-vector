
import * as opentype from 'opentype.js';
import { mmToFontSize, transformPath, flattenSvgPath, roundMm } from './src/utils.js';
import { DxfWriter, Units } from '@tarikjabiri/dxf';
import { svgPathProperties } from 'svg-path-properties';
import svgpath from 'svgpath';

const $ = (id) => document.getElementById(id);

let font = null;
let currentPath = '';
let currentStrokeMm = 0.5;
let debugLog = [];

// Theme toggle
const themeToggle = $('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'dark'; // Default to dark
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
  const heightMm = parseFloat($('size').value);
  const strokeMm = parseFloat($('stroke').value);
  currentStrokeMm = strokeMm;
  const kerning = $('kerning').checked;

  addDebug('Rendering text: "' + text + '" height: ' + heightMm + 'mm stroke: ' + strokeMm + 'mm kerning: ' + kerning);

  const svg = $('svg');
  svg.innerHTML = '';

  // Convert mm to font size (points)
  const fontSizePt = mmToFontSize(heightMm);
  const unitsPerEm = font.unitsPerEm || 1000;
  const scale = fontSizePt / unitsPerEm;

  let x = 0;
  let y = 0; // Baseline at 0 for proper font metrics
  let paths = [];

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const glyph = font.charToGlyph(char);
    addDebug('Char: ' + char + ' glyph: ' + (glyph ? 'found' : 'not found'));

    if (glyph) {
      const pathData = glyph.getPath(x, y, fontSizePt).toPathData();
      // Convert from pt to mm coordinates
      const transformedPath = transformPath(pathData, 1/72 * 25.4, 0, 0);
      // Flip Y for correct SVG display (fonts have Y upward, SVG has Y downward)
      const displayPath = svgpath(transformedPath).scale(1, -1).toString();
      addDebug('Path data length: ' + displayPath.length + ', original Y range check');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', displayPath);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', strokeMm.toString());
      svg.appendChild(path);
      paths.push(transformedPath); // Store original coordinates for export

      // Proportional spacing: 20% of height in mm for consistent separation
      const spacingMm = heightMm * 0.2;
      let spacingPt = spacingMm * (72 / 25.4);
      if (glyph.unicode === 32 || glyph.name === '.notdef') { // space or missing glyph
        spacingPt = glyph.advanceWidth;
      }

      let advance = spacingPt;
      if (kerning && i < text.length - 1) {
        const nextGlyph = font.charToGlyph(text[i + 1]);
        if (nextGlyph) {
          const kern = font.getKerningValue(glyph, nextGlyph);
          const kernPt = kern * (fontSizePt / unitsPerEm);
          advance += kernPt;
        }
      }
      x += advance;
    }
  }

  // Scale and center the preview for consistent visual size
  const bbox = svg.getBBox();
  const targetHeight = 40; // mm in viewBox
  const previewScale = targetHeight / bbox.height;
  const targetWidth = 200;
  const targetViewHeight = 50;
  const tx = (targetWidth - previewScale * bbox.width) / 2;
  const ty = (targetViewHeight - previewScale * bbox.height) / 2;

  // Scale and translate each path
  const previewPaths = svg.querySelectorAll('path');
  previewPaths.forEach(path => {
    const d = path.getAttribute('d');
    const newD = svgpath(d).scale(previewScale, previewScale).translate(tx, ty).toString();
    path.setAttribute('d', newD);
    const currentStroke = parseFloat(path.getAttribute('stroke-width'));
    path.setAttribute('stroke-width', (currentStroke * previewScale).toString());
  });

  svg.setAttribute('viewBox', `0 0 ${targetWidth} ${targetViewHeight}`);
  addDebug('ViewBox set to: ' + viewBox + ' (bbox: ' + bbox.x + ',' + bbox.y + ' ' + bbox.width + 'x' + bbox.height + ')');

  currentPath = paths.join(' ');
  addDebug('Generated path length: ' + currentPath.length + ', total characters: ' + text.length);
  $('pathOutput').value = currentPath;
}

function downloadSvg() {
  addDebug('Download SVG clicked, path length: ' + currentPath.length);
  if (!currentPath) {
    addDebug('No path to download');
    alert('No path to download. Please render some text first.');
    return;
  }

  const text = $('text').value.trim();
  const filename = text ? text.replace(/[^a-zA-Z0-9]/g, '_') + '.svg' : 'text.svg';

  // Calculate bounding box for proper viewBox
  const tempSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  tempPath.setAttribute('d', currentPath);
  tempSvg.appendChild(tempPath);
  document.body.appendChild(tempSvg);
  const bbox = tempPath.getBBox();
  document.body.removeChild(tempSvg);

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${bbox.x} ${bbox.y} ${bbox.width} ${bbox.height}">
 <path d="${currentPath}" fill="none" stroke="black" stroke-width="${currentStrokeMm}"/>
</svg>`;

  addDebug('SVG content generated, viewBox: ' + bbox.x + ',' + bbox.y + ' ' + bbox.width + 'x' + bbox.height);
  download(filename, svgContent, 'image/svg+xml');
  addDebug('SVG download initiated: ' + filename);
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

  const text = $('text').value.trim();
  const filename = text ? text.replace(/[^a-zA-Z0-9]/g, '_') + '.dxf' : 'text.dxf';

  const dxfContent = dxf.stringify();
  addDebug('DXF content generated, length: ' + dxfContent.length + ', points: ' + points.length);
  download(filename, dxfContent, 'application/dxf');
  addDebug('DXF download initiated: ' + filename);
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
  const newSize = $('size').value;
  $('sizeValue').textContent = newSize + 'mm';
  addDebug('Size changed to: ' + newSize + 'mm, triggering render');
  render();
});
$('stroke').addEventListener('input', () => {
  const newStroke = $('stroke').value;
  $('strokeValue').textContent = newStroke + 'mm';
  addDebug('Stroke changed to: ' + newStroke + 'mm, triggering render');
  render();
});
$('kerning').addEventListener('change', render);
$('separate').addEventListener('change', render);

$('downloadSvg').addEventListener('click', downloadSvg);
$('downloadDxf').addEventListener('click', downloadDxf);

// Load default font
loadFont('https://cdn.jsdelivr.net/npm/@fontsource/roboto@5.0.8/files/roboto-latin-400-normal.woff');
