import { svgPathProperties } from 'svg-path-properties';
import svgpath from 'svgpath';
/** Convert mm to OpenType "fontSize" units (points at 72 DPI). 1 pt = 1/72 inch = 25.4/72 mm */
export function mmToFontSize(mm) {
    return mm * 72 / 25.4;
}
/** Round to 0.001 mm by default */
export function roundMm(x, decimals = 3) {
    const f = Math.pow(10, decimals);
    return Math.round(x * f) / f;
}
/** Flatten an SVG path into polylines with given chord tolerance (mm). */
export function flattenSvgPath(d, toleranceMm) {
    // Reparameterize to arc-length and sample every <= tolerance segment
    const props = new svgPathProperties(d);
    const length = props.getTotalLength();
    const step = Math.max(toleranceMm, 0.01); // safety floor
    const pts = [];
    for (let s = 0; s <= length; s += step) {
        const { x, y } = props.getPointAtLength(s);
        pts.push([x, y]);
    }
    // Ensure closure if path is closed by checking first/last distance
    if (pts.length > 2) {
        const [x0, y0] = pts[0];
        const [x1, y1] = pts[pts.length - 1];
        const dx = x1 - x0, dy = y1 - y0;
        if (Math.hypot(dx, dy) < step * 0.75) {
            pts[pts.length - 1] = [x0, y0];
        }
    }
    return pts;
}
/** Apply transform to path string (translate + scale) */
export function transformPath(d, scale, tx, ty) {
    return svgpath(d).scale(scale, scale).translate(tx, ty).toString(); // normal orientation
}
