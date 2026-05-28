'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

interface LoofaData {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  product?: string;
  template?: string;
  [key: string]: unknown;
}

interface TransferInfo {
  loofa: LoofaData;
  senderEmail: string | null;
  recipientEmail: string;
  status: 'pending' | 'claimed';
}

function ClaimContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [info, setInfo] = useState<TransferInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [slugConflict, setSlugConflict] = useState(false);

  useEffect(() => {
    if (!token) { setError('Invalid link — no transfer token found.'); setLoading(false); return; }
    fetch(`/api/transfers/claim?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setError(data.error); return; }
        setInfo(data);
        // Check if slug already exists in recipient's localStorage
        const stored = localStorage.getItem('myLoofas');
        if (stored) {
          const loofas: LoofaData[] = JSON.parse(stored);
          if (loofas.some((l) => l.slug === data.loofa.slug)) setSlugConflict(true);
        }
      })
      .catch(() => setError('Failed to load transfer. Please try again.'))
      .finally(() => setLoading(false));
  }, [token]);

  const handleClaim = async () => {
    if (!info) return;
    setClaiming(true);
    try {
      const res = await fetch('/api/transfers/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken: token }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Claim failed. Please try again.');
        setClaiming(false);
        return;
      }

      // Add to recipient's localStorage — resolve slug conflict if needed
      const newLoofa = { ...data.loofa } as LoofaData;
      // Give it a fresh local ID so it doesn't collide with sender's copy
      newLoofa.id = `claimed-${Date.now()}`;
      // Strip transfer-state fields from the transferred loofa
      delete newLoofa.transferStatus;
      delete newLoofa.transferRecipientEmail;
      delete newLoofa.transferToken;
      delete newLoofa.transferredAt;

      if (slugConflict) {
        newLoofa.slug = `${newLoofa.slug}-2`;
      }

      const stored = localStorage.getItem('myLoofas');
      const existing: LoofaData[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('myLoofas', JSON.stringify([...existing, newLoofa]));

      setClaimed(true);
    } catch {
      setError('Claim failed. Check your connection and try again.');
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container claim-container">
            <p className="submissions-empty">Loading…</p>
          </div>
        </section>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container claim-container">
            <div className="claim-error-icon">✗</div>
            <h2>Transfer not found</h2>
            <p className="step-subtitle">{error}</p>
            <Link href="/" className="btn btn-secondary" style={{ marginTop: 20, display: 'inline-block' }}>
              Go to Loofabag
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (!info) return null;

  if (info.status === 'claimed') {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container claim-container">
            <div className="claim-already-icon">🔒</div>
            <h2>Already claimed</h2>
            <p className="step-subtitle">This loofa has already been claimed by someone.</p>
            <Link href="/my-loofas" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>
              Go to My Loofas
            </Link>
          </div>
        </section>
      </main>
    );
  }

  if (claimed) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container claim-container">
            <div className="claim-success-icon">🎉</div>
            <h2>Loofa claimed!</h2>
            <p className="step-subtitle">
              <strong>{info.loofa.emoji} {info.loofa.name}</strong> has been added to your loofas.
            </p>
            {slugConflict && (
              <p className="step-subtitle" style={{ marginTop: 8, color: '#888' }}>
                A slug conflict was detected — your loofa URL was renamed to <strong>loofabag.com/{info.loofa.slug}-2</strong>.
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ marginTop: 24 }}
              onClick={() => router.push('/my-loofas')}
            >
              View My Loofas
            </button>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <NavBar />
      <section className="my-loofas-section">
        <div className="my-loofas-container claim-container">
          <div className="claim-gift-icon">👜</div>
          <h2>You&apos;re receiving a Loofa!</h2>
          {info.senderEmail && (
            <p className="step-subtitle">
              <strong>{info.senderEmail}</strong> is sending you their loofabag.
            </p>
          )}

          <div className="claim-loofa-card">
            <div className="claim-loofa-emoji">{info.loofa.emoji}</div>
            <div className="claim-loofa-info">
              <div className="claim-loofa-name">{info.loofa.name}</div>
              <div className="claim-loofa-slug">loofabag.com/{info.loofa.slug}</div>
            </div>
          </div>

          <p className="claim-description">
            Claiming this loofa will add it to your loofabag account on this device.
            You can then view and manage it from <strong>My Loofas</strong>.
          </p>

          {error && <p className="rates-error">{error}</p>}

          <button
            type="button"
            className="btn btn-primary claim-btn"
            onClick={handleClaim}
            disabled={claiming}
          >
            {claiming ? 'Claiming…' : 'Claim This Loofa →'}
          </button>

          <p className="claim-hint">
            Don&apos;t have an account? No problem — the loofa will be saved to this browser and you can create an account later.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function ClaimLoofaPage() {
  return (
    <Suspense>
      <ClaimContent />
    </Suspense>
  );
}
