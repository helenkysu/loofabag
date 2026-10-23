'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sampleBagTexts, type Category } from './BagTextSelector';
import { bagTextFont, ensureBagFonts } from '@/lib/bag-fonts';

const INTERVAL_MS = 3200;
const FADE_MS = 600;

interface Props {
  category: Category;
  // Where the QR sits in the bag photo, as fractions of the photo's width/height
  qrCenterX: number;
  qrWidth: number;
  qrTop: number;
  photoAspect: number; // photo width / height
  delayMs?: number; // offset so bags side by side don't change in sync
}

// Overlays cycling bag text above the QR on a sample bag photo. Uses the same
// layout as the print renderer in my-loofas/create: the design block is
// QR / 0.62 wide, black Space Grotesk, lines 1.2× apart, squeezed to at most
// 92% wide, with a 2% gap above the QR.
export default function BagTextCycler({ category, qrCenterX, qrWidth, qrTop, photoAspect, delayMs = 0 }: Props) {
  const [texts] = useState(() => sampleBagTexts(category));
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fade out, swap text while invisible, fade back in
  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout>;
    let interval: ReturnType<typeof setInterval>;
    const step = () => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setIndex((i) => (i + 1) % texts.length);
        setVisible(true);
      }, FADE_MS);
    };
    const start = setTimeout(() => {
      step();
      interval = setInterval(step, INTERVAL_MS);
    }, INTERVAL_MS + delayMs);
    return () => { clearTimeout(start); clearInterval(interval); clearTimeout(fadeTimer); };
  }, [texts.length, delayMs]);

  // Layout effect so the new text is drawn before the fade-in starts painting
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width;
      const fontSize = Math.round(W * 0.095); // a bit larger than print (8%) so it reads at thumbnail size
      const lineH = Math.round(fontSize * 1.2);
      const lines = (texts[index] ?? '').split('\n');
      ctx.clearRect(0, 0, W, canvas.height);
      ctx.font = bagTextFont(fontSize);
      ctx.fillStyle = '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      // Top-align in a two-line slot so one-line text sits higher on the bag
      let y = canvas.height - Math.max(2, lines.length) * lineH;
      for (const line of lines) {
        ctx.fillText(line, W / 2, y, Math.round(W * 0.92));
        y += lineH;
      }
    };
    draw();
    ensureBagFonts().then(draw); // redraw once the bag font has loaded
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
        transition: `opacity ${FADE_MS}ms ease-in-out`,
      }}
    />
  );
}
