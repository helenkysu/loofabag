'use client';

import { useEffect, useRef, useState } from 'react';

const VIEW = 240; // crop viewport size (px)
const OUTPUT = 512; // exported image size (px)
const MAX_ZOOM = 4;

interface Props {
  file: File;
  onCancel: () => void;
  onCrop: (cropped: File) => void;
}

export default function LogoCropper({ file, onCancel, onCrop }: Props) {
  const [src, setSrc] = useState('');
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // image top-left relative to viewport
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    const image = new Image();
    image.onload = () => {
      const s = VIEW / Math.min(image.naturalWidth, image.naturalHeight);
      setImg(image);
      setZoom(1);
      setOffset({ x: (VIEW - image.naturalWidth * s) / 2, y: (VIEW - image.naturalHeight * s) / 2 });
    };
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Scale that makes the image "cover" the viewport, times the user's zoom
  const scaleFor = (z: number) => (img ? (VIEW / Math.min(img.naturalWidth, img.naturalHeight)) * z : 1);
  const scale = scaleFor(zoom);

  // Keep the image covering the whole viewport so the crop never includes empty space
  const clamp = (x: number, y: number, s: number) => {
    if (!img) return { x, y };
    const w = img.naturalWidth * s;
    const h = img.naturalHeight * s;
    return {
      x: Math.min(0, Math.max(VIEW - w, x)),
      y: Math.min(0, Math.max(VIEW - h, y)),
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: offset.x, oy: offset.y };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag.current) return;
    const d = drag.current;
    setOffset(clamp(d.ox + e.clientX - d.px, d.oy + e.clientY - d.py, scale));
  };

  const onPointerUp = () => { drag.current = null; };

  // Zoom around the viewport center
  const setZoomCentered = (z: number) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    const ratio = scaleFor(next) / scale;
    const c = VIEW / 2;
    setOffset(clamp(c - (c - offset.x) * ratio, c - (c - offset.y) * ratio, scaleFor(next)));
    setZoom(next);
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    setZoomCentered(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  };

  const handleCrop = () => {
    if (!img) return;
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT;
    canvas.height = OUTPUT;
    const ctx = canvas.getContext('2d')!;
    const size = VIEW / scale;
    ctx.drawImage(img, -offset.x / scale, -offset.y / scale, size, size, 0, 0, OUTPUT, OUTPUT);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const name = file.name.replace(/\.[^.]+$/, '') + '-cropped.png';
      onCrop(new File([blob], name, { type: 'image/png' }));
    }, 'image/png');
  };

  return (
    <div className="logo-crop-backdrop" onClick={onCancel}>
      <div className="logo-crop-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Crop your image</h3>
        <p className="logo-crop-hint">Drag to reposition, zoom to fit.</p>
        <div
          className="logo-crop-viewport"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
        >
          {img && (
            <img
              src={src}
              alt=""
              draggable={false}
              style={{
                width: img.naturalWidth * scale,
                height: img.naturalHeight * scale,
                transform: `translate(${offset.x}px, ${offset.y}px)`,
              }}
            />
          )}
        </div>
        <input
          type="range"
          className="logo-crop-zoom"
          min={1}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoomCentered(Number(e.target.value))}
          aria-label="Zoom"
        />
        <div className="logo-crop-actions">
          <button type="button" className="logo-crop-cancel" onClick={onCancel}>Cancel</button>
          <button type="button" className="logo-crop-confirm" onClick={handleCrop} disabled={!img}>Crop</button>
        </div>
      </div>
    </div>
  );
}
