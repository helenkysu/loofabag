'use client';

import { useEffect, useState } from 'react';

// Hero rotation picks, one list per category. The hero rotates dating → friends →
// networking, picking a random phrase from each, starting at a random category.
// Each phrase completes "Wear your personal tagline & QR code to find: …", so it
// must name the thing being found (not a slogan like "send help").
const PHRASES_BY_CATEGORY = [
  // 🩷 Dating & Romance
  [
    'my Player 2',
    'someone to survive Costco with',
    'my reason to delete Hinge',
    'someone to steal my fries',
    "my cat's future mom",
    'someone to split rent with',
    'my lobster',
    'my plus one',
  ],
  // 👯 Friendship & Social
  [
    'friends who say yes to spontaneous sushi',
    'extroverts to adopt me',
    'someone to rot in cafés with',
    'a concert buddy',
    'someone to save me from third wheeling',
    'my gym buddy',
    'a tour guide (and a bestie)',
  ],
  // 💼 Career & Networking
  [
    'a career plot twist',
    'my future co-founder',
    'someone to explain crypto to me',
    'my next corporate adventure',
    'a SWE internship before I lose my mind',
    'my next big break',
  ],
];

const INTERVAL_MS = 2800;
const FADE_MS = 400;

function shuffled<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CyclingText() {
  // null until mounted: the random pick happens client-side only, so the server
  // and first client render match (no hydration mismatch)
  const [phrase, setPhrase] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Each category draws from its own shuffled deck so phrases don't repeat until all are shown
    const decks = PHRASES_BY_CATEGORY.map(() => [] as string[]);
    let category = Math.floor(Math.random() * PHRASES_BY_CATEGORY.length);
    const nextPhrase = () => {
      if (decks[category].length === 0) decks[category] = shuffled(PHRASES_BY_CATEGORY[category]);
      const p = decks[category].pop()!;
      category = (category + 1) % PHRASES_BY_CATEGORY.length;
      return p;
    };

    setPhrase(nextPhrase());
    setVisible(true);

    let fadeTimer: ReturnType<typeof setTimeout>;
    const id = setInterval(() => {
      setVisible(false);
      fadeTimer = setTimeout(() => {
        setPhrase(nextPhrase());
        setVisible(true);
      }, FADE_MS);
    }, INTERVAL_MS);
    return () => { clearInterval(id); clearTimeout(fadeTimer); };
  }, []);

  return (
    <div className="cycling-block">
      <p
        className="cycling-phrase"
        style={{ opacity: visible ? 1 : 0, transition: `opacity ${FADE_MS}ms ease` }}
      >
        {phrase ? <>&ldquo;{phrase}&rdquo;</> : ' '}
      </p>
    </div>
  );
}
