'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

interface Loofa {
  id: string;
  name: string;
  slug: string;
  design: string;
  template: string;
  emoji: string;
  isActive?: boolean;
  transferStatus?: 'pending' | 'claimed';
  transferRecipientEmail?: string;
  transferToken?: string;
  transferredAt?: string;
}

interface Submission {
  id: string;
  submitted_at: string;
  responses: Record<string, string>;
  file_paths: string[];
}

export default function LoofaManagementPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submissionCount, setSubmissionCount] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/loofas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        const withDefaults = { isActive: true, ...data.loofa };
        setLoofa(withDefaults);
        // fetch submission count
        fetch(`/api/submissions?slug=${encodeURIComponent(data.loofa.slug)}`)
          .then((r) => r.json())
          .then((d) => setSubmissionCount(d.submissions?.length ?? 0))
          .catch(() => setSubmissionCount(0));
        // poll transfer status if pending
        if (data.loofa.transferStatus === 'pending') {
          fetch(`/api/transfers/status?loofa_id=${encodeURIComponent(data.loofa.id)}`)
            .then((r) => r.json())
            .then((s) => {
              if (s.status === 'claimed') {
                const updated = { ...withDefaults, transferStatus: 'claimed' as const };
                setLoofa(updated);
                fetch(`/api/loofas/${id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ transferStatus: 'claimed' }),
                }).catch(console.error);
              }
            })
            .catch(() => {});
        }
      })
      .catch(() => setNotFound(true));
  }, [id]);

  const isTransferred = loofa?.transferStatus === 'claimed';
  const isTransferPending = loofa?.transferStatus === 'pending';
  const isActive = !isTransferred && (loofa?.isActive ?? true);

  const toggleActive = async () => {
    if (!loofa || isTransferred) return;
    const updated = { ...loofa, isActive: !isActive };
    setLoofa(updated);
    await fetch(`/api/loofas/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    }).catch(console.error);
  };

  const deleteLoofa = async () => {
    await fetch(`/api/loofas/${id}`, { method: 'DELETE' }).catch(console.error);
    router.push('/my-loofas');
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

  if (!loofa) return null;

  // Transferred state — fully greyed out
  if (isTransferred) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container">
            <Link href="/my-loofas" className="back-link">← My Loofas</Link>

            <div className="mgmt-header transferred-header">
              <div className="mgmt-header-left">
                <span className="mgmt-emoji" style={{ opacity: 0.4 }}>{loofa.emoji}</span>
                <div>
                  <h1 className="mgmt-name" style={{ color: '#aaa' }}>{loofa.name}</h1>
                  <p className="loofa-slug" style={{ color: '#ccc' }}>loofabag.com/{loofa.slug}</p>
                </div>
              </div>
              <span className="status-badge status-transferred">Transferred</span>
            </div>

            <div className="transferred-banner">
              <div className="transferred-banner-icon">📦</div>
              <div>
                <p className="transferred-banner-title">Transferred to {loofa.transferRecipientEmail}</p>
                <p className="transferred-banner-sub">This loofa has been claimed by the recipient and is no longer yours to manage.</p>
              </div>
            </div>

            <div className="danger-zone" style={{ marginTop: 40 }}>
              {!confirmDelete ? (
                <button type="button" className="delete-loofa-btn" onClick={() => setConfirmDelete(true)}>
                  Remove from my loofas
                </button>
              ) : (
                <div className="confirm-delete">
                  <p>Remove this loofa from your view?</p>
                  <div className="confirm-actions">
                    <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </button>
                    <button type="button" className="delete-loofa-btn" onClick={deleteLoofa}>
                      Yes, Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <NavBar />
      <section className="my-loofas-section">
        <div className="my-loofas-container">
          <Link href="/my-loofas" className="back-link">← My Loofas</Link>

          <div className="mgmt-header">
            <div className="mgmt-header-left">
              <span className="mgmt-emoji">{loofa.emoji}</span>
              <div>
                <h1 className="mgmt-name">{loofa.name}</h1>
                <p className="loofa-slug">loofabag.com/{loofa.slug}</p>
              </div>
            </div>
            <div className="mgmt-toggle-area">
              <span className={`status-badge ${isActive ? 'status-active' : 'status-off'}`}>
                {isActive ? '● Active' : '○ Off'}
              </span>
              <button
                type="button"
                className={`toggle-btn ${isActive ? 'toggle-on' : 'toggle-off'}`}
                onClick={toggleActive}
              >
                {isActive ? 'Turn Off' : 'Turn On'}
              </button>
            </div>
          </div>

          {!isActive && (
            <div className="inactive-banner">
              This loofa is turned off — visitors will see a &quot;not accepting submissions&quot; message.
            </div>
          )}

          {isTransferPending && (
            <div className="pending-transfer-banner">
              <span className="pending-transfer-icon">⏳</span>
              <div>
                <strong>Pending transfer</strong> to {loofa.transferRecipientEmail}
                <span className="pending-transfer-sub"> — waiting for them to claim it.</span>
              </div>
            </div>
          )}

          <div className={`mgmt-grid${isTransferPending ? ' mgmt-grid-dimmed' : ''}`}>
            <Link href={`/${loofa.slug}`} className="mgmt-tile mgmt-tile-blue">
              <div className="mgmt-tile-icon">👁</div>
              <h3>View QR Page</h3>
              <p>See your public display page</p>
            </Link>

            <Link href={`/my-loofas/${id}/profile`} className="mgmt-tile mgmt-tile-purple">
              <div className="mgmt-tile-icon">🎨</div>
              <h3>QR Page Editor</h3>
              <p>Fill in your profile info</p>
            </Link>

            <Link href={`/my-loofas/${id}/submissions`} className="mgmt-tile mgmt-tile-green">
              <div className="mgmt-tile-icon">📋</div>
              <h3>Submissions & Analytics</h3>
              <p>Responses and QR scan stats</p>
              {submissionCount !== null && (
                <span className="tile-badge">{submissionCount} response{submissionCount !== 1 ? 's' : ''}</span>
              )}
            </Link>

            <Link href={`/my-loofas/edit/${id}`} className="mgmt-tile mgmt-tile-orange">
              <div className="mgmt-tile-icon">✏️</div>
              <h3>Submission Editor</h3>
              <p>Edit the fields visitors fill in</p>
            </Link>

            {!isTransferPending ? (
              <Link href={`/my-loofas/transfer/${id}`} className="mgmt-tile">
                <div className="mgmt-tile-icon">📨</div>
                <h3>Transfer Loofa</h3>
                <p>Send this loofa to someone else</p>
              </Link>
            ) : (
              <div className="mgmt-tile mgmt-tile-disabled">
                <div className="mgmt-tile-icon">📨</div>
                <h3>Transfer Pending</h3>
                <p>Transfer to {loofa.transferRecipientEmail}</p>
                <span className="tile-badge">Pending</span>
              </div>
            )}

            <button type="button" className="mgmt-tile">
              <div className="mgmt-tile-icon">📦</div>
              <h3>Order Tracking</h3>
              <p>Track your physical loofa orders</p>
              <span className="tile-badge tile-badge-soon">Coming soon</span>
            </button>
          </div>

          <div className="danger-zone">
            {!confirmDelete ? (
              <button type="button" className="delete-loofa-btn" onClick={() => setConfirmDelete(true)}>
                Delete Loofa
              </button>
            ) : (
              <div className="confirm-delete">
                <p>Are you sure? This cannot be undone.</p>
                <div className="confirm-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>
                    Cancel
                  </button>
                  <button type="button" className="delete-loofa-btn" onClick={deleteLoofa}>
                    Yes, Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
