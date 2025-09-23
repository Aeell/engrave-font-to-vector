
# JKT Font Engraver

**Proprietary CNC Text Engraving Software for Aluminum Labels**

Developed exclusively for JKT Group s.r.o. CNC machining operations in Prague, Czech Republic.

> **Proprietary Software** - JKT Group s.r.o. Internal Use Only

## User Guide

### Getting Started
1. **Open the tool** in your web browser at the deployed URL
2. **Select a font** from the dropdown (60+ professional fonts available)
3. **Enter your text** in the input field
4. **Set dimensions**:
   - **Height**: Character height in millimeters (0.1-500mm, 0.001mm precision)
   - **Stroke Width**: Engraving tool width in millimeters (0.001-10mm, 0.001mm precision)
5. **Adjust options**:
   - **Kerning**: Enable/disable automatic character spacing
   - **Separate Characters**: Create individual layers for each character (DXF only)
6. **Preview** your text in real-time
7. **Download** SVG or DXF files for your CNC software

### Font Selection
- Choose from 60+ high-quality fonts optimized for engraving
- Fonts load automatically from Google Fonts CDN
- Alatsi is selected by default for industrial applications

### Dimension Settings
- **Height**: Controls the vertical size of characters in millimeters
- **Stroke Width**: Controls the thickness of engraved lines in millimeters
- All measurements with 0.001mm precision for CNC accuracy
- Exported files maintain exact dimensions

### Export Formats
- **SVG**: Vector format for Inkscape, Adobe Illustrator, LightBurn
- **DXF**: CAD format for Fusion 360, AutoCAD, CAM software
- Both formats include proper millimeter units and scaling

### Theme
- Toggle between dark and light modes using the moon/sun button
- Dark mode optimized for CNC workshop environments
- Theme preference saved automatically

## CNC Workflow Integration

### For Autodesk Fusion 360
1. Download DXF file from the tool
2. Import DXF into Fusion 360 (ensure units are set to millimeters)
3. Create engraving toolpath
4. Set tool diameter to match stroke width setting
5. Generate G-code for your CNC machine

### For LightBurn
1. Download SVG file from the tool
2. Import SVG into LightBurn
3. Verify scale is 1:1 (should be correct in mm)
4. Create engraving layer
5. Set power/speed appropriate for aluminum

### For Other CAM Software
- Import SVG/DXF files
- Verify units are set to millimeters
- Use stroke width as reference for tool diameter
- Adjust toolpaths for aluminum material properties

## Troubleshooting

### Text Overlap Issues
- Ensure kerning is disabled if characters appear too close
- Try different fonts if spacing issues persist
- Check debug panel for positioning information

### Font Loading Problems
- Wait for font to load completely before rendering
- Check internet connection for font downloads
- Try refreshing the page if fonts fail to load

### Export Issues
- Verify dimensions in exported files match input settings
- Check that CNC software units are set to millimeters
- For Fusion 360, ensure DXF import settings are correct

### Performance
- Large text may take time to render
- Complex fonts load slower than simple ones
- Browser memory limits apply for very large exports

## Support

For technical support or questions about the JKT Font Engraver:

**Contact**: JKT Group s.r.o., Prague, Czech Republic
**Purpose**: Internal CNC engraving operations for aluminum label manufacturing

This tool is proprietary to JKT Group s.r.o. and not available for external use.

## Troubleshooting

### Text Overlap Issues
- Ensure kerning is disabled if characters appear too close
- Try different fonts if spacing issues persist
- Check debug panel for positioning information

### Font Loading Problems
- Wait for font to load completely before rendering
- Check internet connection for font downloads
- Try refreshing the page if fonts fail to load

### Export Issues
- Verify dimensions in exported files match input settings
- Check that CNC software units are set to millimeters
- For Fusion 360, ensure DXF import settings are correct

### Performance
- Large text may take time to render
- Complex fonts load slower than simple ones
- Browser memory limits apply for very large exports

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

## Development

**Developed by JKT Group s.r.o.**
- CNC machining specialists
- Custom aluminum engraving solutions
- Prague, Czech Republic

**Technical Implementation:**
- Font parsing with OpenType.js
- Path processing with SVG manipulation
- DXF generation for CAD compatibility
- Web-based interface for ease of use

This proprietary tool is exclusively for JKT Group s.r.o. internal CNC engraving operations.

## License

**Proprietary Software License - JKT Group s.r.o.**

This software is proprietary to JKT Group s.r.o. and is provided under strict license terms for internal company use only.

- **Permitted Use**: JKT Group s.r.o. employees and authorized contractors for CNC engraving operations
- **Restrictions**: No redistribution, public sharing, or external use without written permission
- **Ownership**: All rights reserved by JKT Group s.r.o.

See the [LICENSE](LICENSE) file for complete terms.
