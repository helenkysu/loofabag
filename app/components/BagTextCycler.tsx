'use client';

import { useEffect, useRef, useState } from 'react';
import { sampleBagTexts, type Category } from './BagTextSelector';

const INTERVAL_MS = 2600;
const FADE_MS = 350;

interface Props {
  category: Category;
  // Where the QR sits in the bag photo, as fractions of the photo's width/height
  qrCenterX: number;
  qrWidth: number;
  qrTop: number;
  photoAspect: number; // photo width / height
}

// Overlays cycling bag text above the QR on a sample bag photo. Uses the same
// ratios as the print renderer in my-loofas/create: the design block is
// QR / 0.62 wide, text is 8% of it in black Arial Black, lines 1.2× apart,
// squeezed to at most 92% wide, with a 2% gap above the QR.
export default function BagTextCycler({ category, qrCenterX, qrWidth, qrTop, photoAspect }: Props) {
  const [texts] = useState(() => sampleBagTexts(category));
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => { clearInterval(timer); clearTimeout(fadeTimer); };
  }, [texts.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const fontSize = Math.round(W * 0.08);
      const lineH = Math.round(fontSize * 1.2);
      const lines = (texts[index] ?? '').split('\n');
      ctx.clearRect(0, 0, W, canvas.height);
      ctx.font = `900 ${fontSize}px "Arial Black", Arial, sans-serif`;
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      let y = canvas.height - lines.length * lineH;
      for (const line of lines) {
        ctx.fillText(line, W / 2, y, Math.round(W * 0.92));
        y += lineH;
      }
    };
    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [index, texts]);

  const designWidth = qrWidth / 0.62;
  const gapAbove = 0.02 * designWidth * photoAspect; // 2% of design width, as a fraction of photo height

  return (
    <canvas
      ref={canvasRef}
      className="bag-text-cycler"
      aria-label={texts[index]?.replace('\n', ' ')}
      role="img"
      style={{
        left: `${(qrCenterX - designWidth / 2) * 100}%`,
        width: `${designWidth * 100}%`,
        bottom: `${(1 - qrTop + gapAbove) * 100}%`,
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    />
  );
}
