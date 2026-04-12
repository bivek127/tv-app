import { useState, useEffect, useRef } from 'react';
import './ColorWheelPicker.css';

// ─── Color math ───────────────────────────────────────────────────

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60)       { r = c; g = x; b = 0; }
    else if (h < 120) { r = x; g = c; b = 0; }
    else if (h < 180) { r = 0; g = c; b = x; }
    else if (h < 240) { r = 0; g = x; b = c; }
    else if (h < 300) { r = x; g = 0; b = c; }
    else              { r = c; g = 0; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d !== 0) {
        if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        else if (max === g) h = ((b - r) / d + 2) * 60;
        else                h = ((r - g) / d + 4) * 60;
    }
    return [h, max === 0 ? 0 : d / max, max];
}

function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [
        parseInt(h.slice(0, 2), 16) || 0,
        parseInt(h.slice(2, 4), 16) || 0,
        parseInt(h.slice(4, 6), 16) || 0,
    ];
}

// ─── Constants ────────────────────────────────────────────────────

const SIZE = 192;   // wheel canvas diameter in px
const SLIDER_H = 14; // hue slider canvas height in px

// ─── Component ────────────────────────────────────────────────────

export default function ColorWheelPicker({ color, onColorChange }) {
    const [hsv, setHsv] = useState(() => {
        const [r, g, b] = hexToRgb(color);
        return rgbToHsv(r, g, b);
    });
    const [rgb, setRgb] = useState(() => hexToRgb(color));

    const wheelRef   = useRef(null);
    const sliderRef  = useRef(null);
    const baseImgRef = useRef(null); // stored wheel ImageData so we can restore before redrawing the indicator
    const hsvRef     = useRef(hsv);  // always-current HSV, safe to read in stable event handlers
    const commitRef  = useRef(null); // always-current commit fn, safe to call in stable event handlers
    const dragWheel  = useRef(false);
    const dragSlider = useRef(false);

    // Keep hsvRef in sync with state
    useEffect(() => { hsvRef.current = hsv; }, [hsv]);

    // Sync internal state when parent passes a new color (e.g. preset clicked)
    useEffect(() => {
        const newRgb = hexToRgb(color);
        const currentHex = rgbToHex(...rgb);
        if (color === currentHex) return; // already in sync — avoid loop
        const newHsv = rgbToHsv(...newRgb);
        setHsv(newHsv);
        hsvRef.current = newHsv;
        setRgb(newRgb);
    }, [color]); // eslint-disable-line react-hooks/exhaustive-deps

    // Always-fresh commit (stored in ref so the stable mouse-listener closure can call it)
    commitRef.current = (newHsv) => {
        const h = ((newHsv[0] % 360) + 360) % 360;
        const s = Math.max(0, Math.min(1, newHsv[1]));
        const v = Math.max(0, Math.min(1, newHsv[2]));
        const clipped = [h, s, v];
        const [r, g, b] = hsvToRgb(h, s, v);
        setHsv(clipped);
        hsvRef.current = clipped;
        setRgb([r, g, b]);
        onColorChange(rgbToHex(r, g, b));
    };

    // ── Draw wheel base (once on mount) ──────────────────────────
    useEffect(() => {
        const canvas = wheelRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const cx = SIZE / 2, cy = SIZE / 2, radius = SIZE / 2 - 1;
        const img = ctx.createImageData(SIZE, SIZE);

        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                const dx = x - cx, dy = y - cy;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const i = (y * SIZE + x) * 4;
                if (dist <= radius) {
                    const hue = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
                    const sat = dist / radius;
                    const [r, g, b] = hsvToRgb(hue, sat, 1);
                    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
                } else {
                    img.data[i + 3] = 0; // transparent outside circle
                }
            }
        }
        ctx.putImageData(img, 0, 0);
        baseImgRef.current = img;
    }, []);

    // ── Redraw indicator dot whenever HSV changes ─────────────────
    useEffect(() => {
        const canvas = wheelRef.current;
        if (!canvas || !baseImgRef.current) return;
        const ctx = canvas.getContext('2d');

        // Restore clean base
        ctx.putImageData(baseImgRef.current, 0, 0);

        // Compute indicator position
        const [h, s] = hsv;
        const cx = SIZE / 2, cy = SIZE / 2, radius = SIZE / 2 - 1;
        const angle = (h * Math.PI) / 180;
        const ix = cx + Math.cos(angle) * s * radius;
        const iy = cy + Math.sin(angle) * s * radius;

        // Draw: shadow ring → white ring
        ctx.beginPath();
        ctx.arc(ix, iy, 9, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(ix, iy, 7.5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
    }, [hsv]);

    // ── Redraw hue slider whenever H changes ──────────────────────
    useEffect(() => {
        const canvas = sliderRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;

        // Rainbow fill
        ctx.clearRect(0, 0, w, h);
        const grad = ctx.createLinearGradient(0, 0, w, 0);
        for (let i = 0; i <= 12; i++) {
            const [r, g, b] = hsvToRgb((i / 12) * 360, 1, 1);
            grad.addColorStop(i / 12, `rgb(${r},${g},${b})`);
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Thumb circle
        const tx = Math.max(8, Math.min(w - 8, (hsv[0] / 360) * w));
        const ty = h / 2;
        ctx.beginPath();
        ctx.arc(tx, ty, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }, [hsv]);

    // ── Mouse listeners (registered once, use refs to avoid stale closures) ──
    useEffect(() => {
        const getWheelHS = (clientX, clientY) => {
            const rect = wheelRef.current.getBoundingClientRect();
            const dx = clientX - rect.left - SIZE / 2;
            const dy = clientY - rect.top - SIZE / 2;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
            const s = Math.min(dist / (SIZE / 2 - 1), 1);
            return [h, s];
        };

        const getSliderH = (clientX) => {
            const canvas = sliderRef.current;
            const rect = canvas.getBoundingClientRect();
            const x = Math.max(0, Math.min(clientX - rect.left, canvas.width));
            return (x / canvas.width) * 360;
        };

        const onMove = (e) => {
            if (dragWheel.current) {
                const [h, s] = getWheelHS(e.clientX, e.clientY);
                commitRef.current([h, s, hsvRef.current[2]]);
            }
            if (dragSlider.current) {
                const h = getSliderH(e.clientX);
                commitRef.current([h, hsvRef.current[1], hsvRef.current[2]]);
            }
        };

        const onUp = () => { dragWheel.current = false; dragSlider.current = false; };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, []); // stable — all live values accessed through refs

    // ── RGB input handler ─────────────────────────────────────────
    const handleRgbInput = (idx, val) => {
        const n = Math.max(0, Math.min(255, parseInt(val) || 0));
        const newRgb = [...rgb];
        newRgb[idx] = n;
        const newHsv = rgbToHsv(...newRgb);
        setRgb(newRgb);
        setHsv(newHsv);
        hsvRef.current = newHsv;
        onColorChange(rgbToHex(...newRgb));
    };

    const hex = rgbToHex(...rgb);

    return (
        <div className="cwp">
            {/* Color wheel canvas */}
            <canvas
                ref={wheelRef}
                width={SIZE}
                height={SIZE}
                className="cwp-wheel"
                onMouseDown={(e) => {
                    dragWheel.current = true;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const dx = e.clientX - rect.left - SIZE / 2;
                    const dy = e.clientY - rect.top - SIZE / 2;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const h = ((Math.atan2(dy, dx) * 180 / Math.PI) + 360) % 360;
                    const s = Math.min(dist / (SIZE / 2 - 1), 1);
                    commitRef.current([h, s, hsvRef.current[2]]);
                }}
            />

            {/* Hue slider canvas */}
            <canvas
                ref={sliderRef}
                width={SIZE}
                height={SLIDER_H}
                className="cwp-slider"
                onMouseDown={(e) => {
                    dragSlider.current = true;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.max(0, Math.min(e.clientX - rect.left, SIZE));
                    const h = (x / SIZE) * 360;
                    commitRef.current([h, hsvRef.current[1], hsvRef.current[2]]);
                }}
            />

            {/* Preview + RGB inputs */}
            <div className="cwp-bottom">
                <div className="cwp-preview" style={{ background: hex }} />
                <div className="cwp-rgb">
                    {['R', 'G', 'B'].map((label, i) => (
                        <div key={label} className="cwp-rgb-field">
                            <input
                                type="number"
                                min={0}
                                max={255}
                                value={rgb[i]}
                                onChange={(e) => handleRgbInput(i, e.target.value)}
                                className="cwp-rgb-input"
                            />
                            <span className="cwp-rgb-label">{label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
