
# Engrave Font → Vector (SVG/DXF)

Precision text-to-vector tool tailored for CNC engraving workflows. 
Outputs **true millimeter** geometry with **0.001 mm** precision for easy import into Fusion 360, LightBurn, or any CAD/CAM.

> Based on the idea of [google-font-to-svg-path] but redesigned for CNC: consistent mm units, DXF R12 with `INSUNITS=4 (mm)`, kerning control, character separation, boolean union (approx.), and adaptive Bézier flattening.

## Why this exists
- The original tool targets web/SVG. This fork focuses on **manufacturing**: exact sizing in **mm**, kerning-on/off, per-character layers, and clean polylines for CAM.
- DXF export writes **POLYLINE/LWPOLYLINE** with mm units and configurable tolerance.

## Features

### Core Functionality
- ✅ **Millimeter-precise sizing**: Input text height in millimeters with 0.001mm precision for CNC accuracy.
- ✅ **Google Fonts integration**: 60+ professional fonts loaded directly from Google Fonts static CDN.
- ✅ **Real-time preview**: Live SVG rendering as you type, adjust size, or change settings.
- ✅ **Typography controls**:
  - Kerning toggle for automatic character spacing.
  - Letter spacing adjustment (-5mm to +10mm).
  - Line spacing for multi-line text.
  - Separate characters option for individual DXF layers.
- ✅ **Export formats**:
  - **SVG**: Clean vector paths for web/SVG editors.
  - **DXF**: Polylines optimized for Fusion 360, LightBurn, and other CAM software.
- ✅ **Adaptive Bézier flattening**: Configurable tolerance (0.01-1mm) for curve approximation.

### User Interface
- ✅ **Dark/Light mode**: Automatic theme switching with local storage persistence.
- ✅ **Responsive design**: Works on desktop, tablet, and mobile devices.
- ✅ **Input validation**: Real-time feedback with helpful error messages.
- ✅ **Font caching**: Loaded fonts persist across sessions for faster re-rendering.
- ✅ **Debug panel**: Built-in debugging tools for troubleshooting (development mode).

### Technical Features
- ✅ **Cross-platform CLI**: Node.js command-line tool for batch processing.
- ✅ **Web UI**: Browser-based interface with no installation required.
- ✅ **TypeScript**: Fully typed codebase for reliability and maintainability.
- ✅ **Vite build system**: Fast development and optimized production builds.
- ✅ **GitHub Pages deployment**: Automatic deployment with GitHub Actions.

### CNC-Specific Optimizations
- ✅ **Units handling**: All outputs in millimeters ($INSUNITS=4 for DXF).
- ✅ **Path optimization**: Minimal polylines with configurable chord tolerance.
- ✅ **Layer separation**: Individual character layers for complex engraving.
- ✅ **Fusion 360 compatibility**: DXF R12 format with proper scaling.

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

## CLI Usage

The command-line interface provides batch processing capabilities for automated workflows.

### Basic Syntax
```bash
node dist/cli.js --font <font-file> --text <text> [options]
```

### Required Options
- `--font <file>`: Path to TTF/OTF font file
- `--text <string>`: Text to convert

### Geometry Options
- `--height-mm <mm>`: Text height in millimeters (default: 10)
- `--width-mm <mm>`: Target width (overrides height if specified)
- `--letter-spacing <mm>`: Additional space between characters (default: 0)
- `--line-spacing <mm>`: Space between lines for multi-line text (default: 0)

### Typography Options
- `--kerning`: Enable automatic character spacing adjustments

### Output Options
- `--separate`: Create individual layers for each character (DXF only)
- `--tolerance <mm>`: Curve flattening precision (default: 0.1mm)
- `--origin-left`: Position at left baseline (default)
- `--origin-center`: Center the text bounding box

### Export Options
- `--svg`: Generate SVG output
- `--dxf`: Generate DXF output
- `--out <dir>`: Output directory (default: 'out')

### Examples
```bash
# Basic usage
node dist/cli.js --font ./fonts/Roboto-Regular.ttf --text "Hello World" --height-mm 12.5 --svg --dxf

# Advanced engraving setup
node dist/cli.js --font ./fonts/Oswald-Regular.ttf --text "ENGRAVE" --height-mm 25 --kerning --separate --tolerance 0.05 --dxf --out ./output

# Multi-line text
node dist/cli.js --font ./fonts/Merriweather-Regular.ttf --text "Line 1\nLine 2" --height-mm 15 --line-spacing 5 --svg
```

### CLI Output
- Creates `text.svg` and/or `text.dxf` in the output directory
- SVG: Clean vector paths with proper viewBox
- DXF: R12 format polylines with millimeter units

## Fusion 360 Tips
- DXF import is **unit-aware** here ($INSUNITS=4 → mm). If your design is in inches, scale ×25.4.
- For V-carving / single-line engraving, prefer **single-stroke fonts**. This tool outputs outline contours from any TTF/OTF. If you need true centerlines, use stick fonts (Hershey, simplex) or a centerline-trace in CAM.

## Architecture

### Core Components
- **Font Engine**: OpenType.js for font parsing and glyph extraction
- **Path Processing**: SVG path manipulation with Bézier curve flattening
- **DXF Generation**: @tarikjabiri/dxf for CAD-compatible output
- **Build System**: Vite for development and production bundling
- **UI Framework**: Vanilla JavaScript with CSS custom properties

### Data Flow
1. **Font Loading**: OpenType.js parses WOFF files from CDN
2. **Text Processing**: Unicode text → glyph mapping → path data
3. **Geometry**: Font units → millimeters with scaling
4. **Path Optimization**: Bézier curves → polylines with tolerance
5. **Export**: SVG paths or DXF polylines with proper metadata

### Dependencies
- **opentype.js**: Font parsing and glyph extraction
- **svg-path-properties**: Path length and point calculations
- **@tarikjabiri/dxf**: DXF file generation
- **vite**: Build tooling and development server

## API Reference

### Web UI Methods
```javascript
// Font loading
loadFont(url) // Load font from URL

// Rendering
render() // Update SVG preview

// Export
downloadSvg() // Download SVG file
downloadDxf() // Download DXF file
```

### CLI API
```javascript
import { mmToFontSize, transformPath, flattenSvgPath } from './src/utils.js';

// Convert mm to font units
const fontSize = mmToFontSize(12.5);

// Transform path coordinates
const transformedPath = transformPath(pathData, scale, tx, ty);

// Flatten curves to polylines
const polylines = flattenSvgPath(pathData, tolerance);
```

## Troubleshooting

### Font Loading Issues
- **Error**: "Failed to load font"
  - **Cause**: Network issues or invalid font URL
  - **Solution**: Check internet connection, try different font

- **Error**: Font appears corrupted
  - **Cause**: WOFF parsing failure
  - **Solution**: Try different font or check browser compatibility

### Preview Issues
- **Text not showing**: Check debug panel for font loading status
- **Wrong size**: Verify units (mm) and font metrics
- **Poor quality**: Increase curve tolerance for smoother curves

### Export Issues
- **Empty files**: Ensure text is rendered before downloading
- **DXF import fails**: Check Fusion 360 DXF settings, ensure R12 format
- **SVG scaling**: Verify viewBox attributes in output

### Performance
- Large fonts may load slowly on slow connections
- Complex text with many curves increases processing time
- Browser memory limits for very large SVG outputs

## Contributing

### Development Setup
```bash
git clone https://github.com/Aeell/engrave-font-to-vector.git
cd engrave-font-to-vector
npm install
npm run web  # Development server
```

### Build Process
```bash
npm run build    # TypeScript compilation
npx vite build   # Production bundle
```

### Code Style
- TypeScript with strict mode
- ESLint configuration
- Prettier formatting
- Semantic commit messages

### Testing
- Manual testing with various fonts and settings
- Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
- CLI testing with different input parameters
- DXF/SVG validation in target applications

## Changelog

### v1.0.0 (Current)
- Initial release with Google Fonts integration
- Web UI with 60+ fonts
- CLI tool for batch processing
- DXF and SVG export
- Dark mode support
- GitHub Pages deployment

## Roadmap

### Planned Features
- Custom font upload support
- Advanced typography controls (ligatures, alternates)
- Multi-language support
- Batch processing queue
- Cloud font storage integration
- CAM software plugins

### Technical Improvements
- WebAssembly font processing
- Progressive Web App (PWA)
- Offline font caching
- Real-time collaboration
- API endpoints for integrations

## Support

### Issues and Bugs
- GitHub Issues: https://github.com/Aeell/engrave-font-to-vector/issues
- Include debug panel output when reporting problems
- Specify browser, OS, and font used

### Feature Requests
- Use GitHub Discussions for feature suggestions
- Include use case and expected workflow

## Authors

**Stanimir Stankov** - Lead Developer
- CNC Programming Specialist
- JKT Group s.r.o.

**JKT Group s.r.o.** - Company
- CNC machining and engraving solutions
- Custom aluminum label production
- Prague, Czech Republic

This project was developed for JKT Group s.r.o. to streamline CNC text engraving workflows for aluminum signage and industrial labeling applications.

## License

This project is licensed under the Creative Commons Attribution 4.0 International License.

You are free to:
- **Share** — copy and redistribute the material in any medium or format
- **Adapt** — remix, transform, and build upon the material for any purpose, even commercially

Under the following terms:
- **Attribution** — You must give appropriate credit, provide a link to the license, and indicate if changes were made
- **No additional restrictions** — You may not apply legal terms or technological measures that legally restrict others from doing anything the license permits

See the [LICENSE](LICENSE) file for full license text.
