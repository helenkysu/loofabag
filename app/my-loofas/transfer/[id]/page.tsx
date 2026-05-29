'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import { createClient } from '@/lib/supabase/client';

interface Loofa {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  [key: string]: unknown;
}

export default function TransferLoofaPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [senderEmail, setSenderEmail] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const confirmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/loofas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        setLoofa(data.loofa);
      })
      .catch(() => setNotFound(true));

    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setSenderEmail(user.email);
    });
  }, [id]);

  useEffect(() => {
    if (showConfirm) {
      setTimeout(() => confirmInputRef.current?.focus(), 50);
    }
  }, [showConfirm]);

  const handleTransfer = async () => {
    if (!loofa) return;
    setTransferring(true);
    setError('');
    try {
      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loofaId: loofa.id,
          loofaData: loofa,
          senderEmail: senderEmail || undefined,
          recipientEmail,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Transfer failed. Please try again.');
        setTransferring(false);
        return;
      }

      // Mark loofa as pending transfer in DB
      await fetch(`/api/loofas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transferStatus: 'pending',
          transferRecipientEmail: recipientEmail,
          transferToken: data.claimToken,
          transferredAt: new Date().toISOString(),
        }),
      }).catch(console.error);
      setDone(true);
    } catch {
      setError('Transfer failed. Check your connection and try again.');
      setTransferring(false);
    }
  };

  if (notFound) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container">
            <p>Loofa not found.</p>
            <Link href="/my-loofas" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-block' }}>
              Back to My Loofas
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <NavBar />
      <section className="my-loofas-section">
        <div className="my-loofas-container" style={{ maxWidth: 520 }}>
          <Link href={`/my-loofas/${id}`} className="back-link">← Back</Link>

          {done ? (
            <div className="transfer-success">
              <div className="transfer-success-icon">✉️</div>
              <h2>Transfer sent!</h2>
              <p>
                An email has been sent to <strong>{recipientEmail}</strong> with a link to claim the loofa.
                Once they claim it, the loofa will be marked as transferred on your end.
              </p>
              <button className="btn btn-secondary" onClick={() => router.push(`/my-loofas/${id}`)}>
                Back to Loofa
              </button>
            </div>
          ) : (
            <>
              <h1 style={{ marginBottom: 8 }}>Transfer Loofa</h1>
              {loofa && (
                <p className="step-subtitle">
                  {loofa.emoji} {loofa.name} · loofabag.com/{loofa.slug}
                </p>
              )}

              <div className="transfer-form">
                <div className="transfer-field">
                  <label className="transfer-label">Your email <span className="shipping-optional">(optional — shown to recipient)</span></label>
                  <input
                    type="email"
                    className="shipping-input"
                    placeholder="your@email.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
                <div className="transfer-field">
                  <label className="transfer-label">Recipient email</label>
                  <input
                    type="email"
                    className="shipping-input"
                    placeholder="recipient@email.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    autoFocus
                  />
                </div>

                {error && <p className="rates-error">{error}</p>}

                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ marginTop: 8 }}
                  onClick={() => setShowConfirm(true)}
                  disabled={!recipientEmail || transferring}
                >
                  Transfer Loofa
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Confirmation modal */}
      {showConfirm && (
        <div className="transfer-modal-backdrop" onClick={() => { if (!transferring) { setShowConfirm(false); setConfirmText(''); } }}>
          <div className="transfer-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Are you sure?</h3>
            <p className="transfer-modal-body">
              You are about to transfer <strong>{loofa?.name}</strong> to <strong>{recipientEmail}</strong>.
              Once they claim it, this loofa cannot be unsent.
            </p>
            <p className="transfer-modal-prompt">Type <strong>confirm</strong> to proceed:</p>
            <input
              ref={confirmInputRef}
              type="text"
              className="shipping-input transfer-confirm-input"
              placeholder="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && confirmText === 'confirm' && !transferring) handleTransfer(); }}
            />
            <div className="transfer-modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { setShowConfirm(false); setConfirmText(''); }}
                disabled={transferring}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: '#FF6B6B' }}
                onClick={handleTransfer}
                disabled={confirmText !== 'confirm' || transferring}
              >
                {transferring ? 'Sending…' : 'Send Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
