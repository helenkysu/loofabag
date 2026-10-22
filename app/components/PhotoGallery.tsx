'use client';

import { useEffect, useRef, useState } from 'react';

interface PhotoGalleryProps {
  paths: string[];
}

export default function PhotoGallery({ paths }: PhotoGalleryProps) {
  const [current, setCurrent] = useState(0);
  const rowRef = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  // Show desktop slider arrows only when the row actually overflows
  const updateArrows = () => {
    const el = rowRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 1);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  };

  useEffect(() => {
    updateArrows();
    window.addEventListener('resize', updateArrows);
    return () => window.removeEventListener('resize', updateArrows);
  }, [paths]);

  if (paths.length === 0) return null;

  const src = (path: string) => `/api/files/proxy?path=${encodeURIComponent(path)}`;
  const prev = () => setCurrent((c) => (c - 1 + paths.length) % paths.length);
  const next = () => setCurrent((c) => (c + 1) % paths.length);
  const slide = (dir: 1 | -1) => {
    const el = rowRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' });
  };

  return (
    <>
      {/* Desktop: horizontal slider */}
      <div className="photo-gallery-slider">
        <div className="photo-gallery-row" ref={rowRef} onScroll={updateArrows}>
          {paths.map((path) => (
            <img key={path} src={src(path)} alt="" className="photo-gallery-thumb" onLoad={updateArrows} />
          ))}
        </div>
        {canPrev && (
          <button type="button" className="gallery-arrow gallery-arrow-prev" onClick={() => slide(-1)} aria-label="Previous photos">‹</button>
        )}
        {canNext && (
          <button type="button" className="gallery-arrow gallery-arrow-next" onClick={() => slide(1)} aria-label="Next photos">›</button>
        )}
      </div>

      {/* Mobile: carousel */}
      <div className="photo-gallery-carousel">
        <div className="photo-gallery-carousel-track">
          <img src={src(paths[current])} alt="" className="photo-gallery-carousel-img" />
          {paths.length > 1 && (
            <>
              <button className="gallery-arrow gallery-arrow-prev" onClick={prev} aria-label="Previous">‹</button>
              <button className="gallery-arrow gallery-arrow-next" onClick={next} aria-label="Next">›</button>
            </>
          )}
        </div>
        {paths.length > 1 && (
          <div className="gallery-dots">
            {paths.map((_, i) => (
              <button
                key={i}
                className={`gallery-dot${i === current ? ' gallery-dot-active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
