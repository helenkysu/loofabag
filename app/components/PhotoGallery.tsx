'use client';

import { useState } from 'react';

interface PhotoGalleryProps {
  paths: string[];
}

export default function PhotoGallery({ paths }: PhotoGalleryProps) {
  const [current, setCurrent] = useState(0);

  if (paths.length === 0) return null;

  const src = (path: string) => `/api/files/proxy?path=${encodeURIComponent(path)}`;
  const prev = () => setCurrent((c) => (c - 1 + paths.length) % paths.length);
  const next = () => setCurrent((c) => (c + 1) % paths.length);

  return (
    <>
      {/* Desktop: scrollable row */}
      <div className="photo-gallery-row">
        {paths.map((path) => (
          <img key={path} src={src(path)} alt="" className="photo-gallery-thumb" />
        ))}
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
