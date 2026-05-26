'use client';

import { useEffect, useState } from 'react';

const phrases = [
  'someone to rot in cafés with ☕',
  'my future husband 🤨',
  'friends who say yes to spontaneous sushi',
  'a SWE internship before I lose my mind',
];

export default function CyclingText() {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % phrases.length);
        setVisible(true);
      }, 400);
    }, 2800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="cycling-block">
      <p className="cycling-label">peachie is looking for...</p>
      <p
        className="cycling-phrase"
        style={{ opacity: visible ? 1 : 0, transition: 'opacity 0.4s ease' }}
      >
        &ldquo;{phrases[index]}&rdquo;
      </p>
    </div>
  );
}
