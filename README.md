
# Engrave Font → Vector (SVG/DXF)

Precision text-to-vector tool tailored for CNC engraving workflows. 
Outputs **true millimeter** geometry with **0.001 mm** precision for easy import into Fusion 360, LightBurn, or any CAD/CAM.

> Based on the idea of [google-font-to-svg-path] but redesigned for CNC: consistent mm units, DXF R12 with `INSUNITS=4 (mm)`, kerning control, character separation, boolean union (approx.), and adaptive Bézier flattening.

## Why this exists
- The original tool targets web/SVG. This fork focuses on **manufacturing**: exact sizing in **mm**, kerning-on/off, per-character layers, and clean polylines for CAM.
- DXF export writes **POLYLINE/LWPOLYLINE** with mm units and configurable tolerance.

## Features
- ✅ Millimeter-first sizing (enter height/width in **mm**; 3 decimals allowed).
- ✅ Kerning toggle, letter-spacing, line-spacing.
- ✅ Separate characters → separate layers (C1, C2, ...), or merged.
- ✅ Union filled contours (approximate; uses Clipper after adaptive flattening).
- ✅ SVG and DXF exports.
- ✅ Non-scaling stroke output (for preview only).
- ✅ CLI **and** Web UI with dark mode support.
- ✅ Improved UI with better styling and user experience.
- ✅ Font caching for faster re-rendering.
- ✅ Input validation and helpful instructions.

## Install (CLI + Web UI)
```bash
# Node 18+ recommended
npm i
npm run build

# CLI usage
node dist/cli.js --font ./fonts/Roboto-Regular.ttf --text "ŠeryWood" --height-mm 12.5 --out out --dxf --svg --tolerance 0.05

# Web UI (dev)
npm run web  # opens Vite dev server
```

## CLI
```
engrave-text --font <ttf/otf> --text <string>
             [--height-mm <mm>] [--width-mm <mm>]
             [--kerning] [--letter-spacing <mm>] [--line-spacing <mm>]
             [--separate] [--union]
             [--tolerance <mm>] [--origin-left | --origin-center]
             [--dxf] [--svg] [--out <dir>]
```
- `--height-mm`: desired cap-height-esque text height in mm (approx. font em to visual height mapping via font metrics). Precise scaling uses OpenType `unitsPerEm`.  
- `--width-mm`: optionally scale to overall width (overrides height if provided).
- `--tolerance`: max segment length when flattening curves (mm). Typical 0.05–0.2 mm for engraving.
- `--separate`: export per-glyph layers for DXF (`C1`, `C2`, …).
- `--union`: boolean union on filled shapes (closed contours) after discretization.

## Fusion 360 Tips
- DXF import is **unit-aware** here ($INSUNITS=4 → mm). If your design is in inches, scale ×25.4.
- For V-carving / single-line engraving, prefer **single-stroke fonts**. This tool outputs outline contours from any TTF/OTF. If you need true centerlines, use stick fonts (Hershey, simplex) or a centerline-trace in CAM.

## Notes on Centerline Engraving
This tool does **not** "skeletonize" arbitrary filled fonts. That’s a hard problem and usually worse than selecting a proper **single-line font**. You can still export outlines and let your CAM do inside/centerline strategies if supported.

## License
MIT
