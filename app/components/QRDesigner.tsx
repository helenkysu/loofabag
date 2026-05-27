'use client';

import { useEffect, useRef, useState } from 'react';

export interface QRDesignOptions {
  fgColor: string;
  bgColor: string;
  gradient: { from: string; to: string; label: string } | null;
  shape: 'square' | 'heart' | 'square-logo';
  logoFile: File | null;
}

const GRADIENT_PRESETS = [
  { label: 'None', value: null },
  { label: 'Sunset', value: { from: '#FF6B6B', to: '#FFD93D', label: 'Sunset' } },
  { label: 'Ocean', value: { from: '#4D96FF', to: '#00D2FF', label: 'Ocean' } },
  { label: 'Rose', value: { from: '#FF6B9D', to: '#B19CD9', label: 'Rose' } },
  { label: 'Forest', value: { from: '#6BCB77', to: '#4D96FF', label: 'Forest' } },
  { label: 'Midnight', value: { from: '#232526', to: '#6B46C1', label: 'Midnight' } },
];

function hexToRgb(hex: string): [number, number, number] {
  const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r ? [parseInt(r[1], 16), parseInt(r[2], 16), parseInt(r[3], 16)] : [0, 0, 0];
}

const SIZE = 280;

// Returns true if canvas-space point (cx, cy) is inside the heart shape.
// Heart equation: (x²+y²−1)³ − x²y³ ≤ 0  (y up)
// Scale=0.44 + cy=0.543 ensures both top finder patterns land inside the bumps.
function insideHeart(cx: number, cy: number): boolean {
  const nx =  (cx - SIZE * 0.5)  / (SIZE * 0.44);
  const ny = -(cy - SIZE * 0.543) / (SIZE * 0.44);
  const a = nx * nx + ny * ny - 1;
  return a * a * a - nx * nx * ny * ny * ny <= 0;
}

export async function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  url: string,
  design: QRDesignOptions,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = SIZE;
  canvas.height = SIZE;
  ctx.clearRect(0, 0, SIZE, SIZE);
  if (!url) return;

  const QRCode = (await import('qrcode')).default;

  // ── Get raw module matrix ──────────────────────────────────────────────────
  let numModules = 0;
  let isDark: (row: number, col: number) => boolean;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qr = (QRCode as any).create(url, { errorCorrectionLevel: 'H' });
    const { size, data } = qr.modules as { size: number; data: Uint8Array };
    numModules = size;
    isDark = (row, col) => data[row * size + col] !== 0;
  } catch {
    // Fallback: render at high res and sample pixel centres.
    // Detect module size by scanning col 0: rows 0-6 are all dark (finder border),
    // row 7 is the separator (first light) → firstLightY = 7 * modulePixelSize.
    const OS = 560;
    const off = document.createElement('canvas');
    off.width = off.height = OS;
    await QRCode.toCanvas(off, url, {
      width: OS, margin: 0, errorCorrectionLevel: 'H',
      color: { dark: '#000000', light: '#ffffff' },
    });
    const px = off.getContext('2d')!.getImageData(0, 0, OS, OS).data;
    let firstLightY = 0;
    for (let y = 1; y < OS / 2; y++) {
      if (px[y * OS * 4] > 200) { firstLightY = y; break; }
    }
    const mpx = firstLightY > 0 ? firstLightY / 7 : OS / 33;
    numModules = Math.round(OS / mpx);
    isDark = (row, col) => {
      const sx = Math.floor(col * mpx + mpx / 2);
      const sy = Math.floor(row * mpx + mpx / 2);
      return px[(sy * OS + sx) * 4] < 128;
    };
  }

  // ── Background ─────────────────────────────────────────────────────────────
  // Heart: leave canvas transparent outside the heart; fill per-module below.
  if (design.shape !== 'heart') {
    ctx.fillStyle = design.bgColor;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }

  // ── Gradient pixel map ─────────────────────────────────────────────────────
  let gradPixels: Uint8ClampedArray | null = null;
  if (design.gradient) {
    const gc = document.createElement('canvas');
    gc.width = gc.height = SIZE;
    const gx = gc.getContext('2d')!;
    const g = gx.createLinearGradient(0, 0, SIZE, SIZE);
    g.addColorStop(0, design.gradient.from);
    g.addColorStop(1, design.gradient.to);
    gx.fillStyle = g;
    gx.fillRect(0, 0, SIZE, SIZE);
    gradPixels = gx.getImageData(0, 0, SIZE, SIZE).data;
  }
  const [fr, fg, fb] = hexToRgb(design.fgColor);

  // ── Module rendering ───────────────────────────────────────────────────────
  const pad = design.shape === 'heart' ? SIZE * 0.02 : SIZE * 0.05;
  const modSize = (SIZE - 2 * pad) / numModules;

  for (let row = 0; row < numModules; row++) {
    for (let col = 0; col < numModules; col++) {
      const mx = pad + col * modSize;        // top-left x
      const my = pad + row * modSize;        // top-left y
      const cx = mx + modSize / 2;           // centre x
      const cy = my + modSize / 2;           // centre y

      if (design.shape === 'heart' && !insideHeart(cx, cy)) continue;

      if (!isDark(row, col)) {
        // Light module: fill with bgColor only for heart (outside is transparent)
        if (design.shape === 'heart') {
          ctx.fillStyle = design.bgColor;
          ctx.fillRect(mx, my, modSize, modSize);
        }
        continue;
      }

      let r = fr, g = fg, b = fb;
      if (gradPixels) {
        const pi = (Math.round(cy) * SIZE + Math.round(cx)) * 4;
        r = gradPixels[pi]; g = gradPixels[pi + 1]; b = gradPixels[pi + 2];
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(mx, my, modSize - 0.5, modSize - 0.5);
    }
  }

  // ── Center logo (square-logo only) ─────────────────────────────────────────
  if (design.shape === 'square-logo' && design.logoFile) {
    const logoUrl = URL.createObjectURL(design.logoFile);
    const logo = new Image();
    logo.src = logoUrl;
    await new Promise<void>((res) => { logo.onload = () => res(); logo.onerror = () => res(); });
    const ls = Math.round(SIZE * 0.22);
    const lx = Math.round((SIZE - ls) / 2);
    const ly = Math.round((SIZE - ls) / 2);
    ctx.fillStyle = design.bgColor;
    ctx.fillRect(lx - 6, ly - 6, ls + 12, ls + 12);
    ctx.drawImage(logo, lx, ly, ls, ls);
    URL.revokeObjectURL(logoUrl);
  }
}

interface Props {
  url: string;
  onDataUrl: (dataUrl: string) => void;
  hidePreview?: boolean;
  onDesignChange?: (design: QRDesignOptions) => void;
}

export default function QRDesigner({ url, onDataUrl, hidePreview, onDesignChange }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [design, setDesign] = useState<QRDesignOptions>({
    fgColor: '#000000',
    bgColor: '#ffffff',
    gradient: null,
    shape: 'square',
    logoFile: null,
  });
  const [logoPreview, setLogoPreview] = useState('');
  const [rendering, setRendering] = useState(false);

  const update = (patch: Partial<QRDesignOptions>) =>
    setDesign((prev) => ({ ...prev, ...patch }));

  useEffect(() => { onDesignChange?.(design); }, [design, onDesignChange]);

  useEffect(() => {
    if (!canvasRef.current) return;
    setRendering(true);
    renderQRToCanvas(canvasRef.current, url, design)
      .then(() => {
        const dataUrl = canvasRef.current?.toDataURL('image/png') ?? '';
        onDataUrl(dataUrl);
      })
      .finally(() => setRendering(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, design]);

  const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(file ? URL.createObjectURL(file) : '');
    update({ logoFile: file });
  };

  return (
    <div className="qr-designer">
      <div className="qr-design-controls">
        {/* Shape */}
        <div className="qr-control-group">
          <label className="qr-control-label">Shape</label>
          <div className="qr-shape-row">
            {(['square', 'heart', 'square-logo'] as const).map((s) => (
              <button
                key={s}
                type="button"
                className={`qr-shape-btn${design.shape === s ? ' selected' : ''}`}
                onClick={() => update({ shape: s })}
              >
                {s === 'square' && <span className="qr-shape-icon">⬛</span>}
                {s === 'heart' && <span className="qr-shape-icon">❤️</span>}
                {s === 'square-logo' && <span className="qr-shape-icon">🖼️</span>}
                <span className="qr-shape-label">
                  {s === 'square' ? 'Square' : s === 'heart' ? 'Heart' : 'Logo'}
                </span>
              </button>
            ))}
          </div>
          {design.shape === 'square-logo' && (
            <div className="qr-logo-upload">
              <button type="button" className="qr-logo-btn" onClick={() => logoInputRef.current?.click()}>
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="qr-logo-thumb" />
                  : '+ Upload center image'}
              </button>
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoFile} />
            </div>
          )}
        </div>

        {/* QR color */}
        <div className="qr-control-group">
          <label className="qr-control-label">
            QR Color
            {design.gradient && <span className="qr-gradient-override-note"> (overridden by gradient)</span>}
          </label>
          <div className="qr-color-row">
            <input
              type="color"
              value={design.fgColor}
              onChange={(e) => update({ fgColor: e.target.value, gradient: null })}
              className="qr-color-input"
              disabled={!!design.gradient}
            />
            <span className="qr-color-hex">{design.fgColor}</span>
          </div>
        </div>

        {/* Background color */}
        <div className="qr-control-group">
          <label className="qr-control-label">Background</label>
          <div className="qr-color-row">
            <input
              type="color"
              value={design.bgColor}
              onChange={(e) => update({ bgColor: e.target.value })}
              className="qr-color-input"
            />
            <span className="qr-color-hex">{design.bgColor}</span>
          </div>
        </div>

        {/* Gradient presets */}
        <div className="qr-control-group">
          <label className="qr-control-label">Gradient</label>
          <div className="qr-gradient-row">
            {GRADIENT_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                title={preset.label}
                className={`qr-gradient-swatch${
                  (preset.value === null && design.gradient === null) ||
                  (preset.value !== null && design.gradient?.label === preset.value.label)
                    ? ' selected' : ''
                }`}
                onClick={() => update({ gradient: preset.value })}
                style={
                  preset.value
                    ? { background: `linear-gradient(135deg, ${preset.value.from}, ${preset.value.to})` }
                    : { background: '#fff', border: '2px solid #ddd', color: '#999', fontSize: 11 }
                }
              >
                {!preset.value && 'None'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {hidePreview ? (
        <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ display: 'none' }} />
      ) : (
        <div className="qr-designer-preview">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            className={`qr-canvas${design.shape === 'heart' ? ' qr-canvas-heart' : ''}`}
          />
          {rendering && <div className="qr-canvas-loading">…</div>}
        </div>
      )}
    </div>
  );
}
