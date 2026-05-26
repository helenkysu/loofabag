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
}

export default function LoofaManagementPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) { setNotFound(true); return; }
    const loofas: Loofa[] = JSON.parse(stored);
    const found = loofas.find((l) => l.id === id);
    if (!found) { setNotFound(true); return; }
    setLoofa({ isActive: true, ...found });
  }, [id]);

  const isActive = loofa?.isActive ?? true;

  const persist = (updated: Loofa) => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) return;
    const loofas: Loofa[] = JSON.parse(stored);
    localStorage.setItem('myLoofas', JSON.stringify(loofas.map((l) => l.id === id ? updated : l)));
  };

  const toggleActive = () => {
    if (!loofa) return;
    const updated = { ...loofa, isActive: !isActive };
    setLoofa(updated);
    persist(updated);
  };

  const deleteLoofa = () => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) return;
    const loofas: Loofa[] = JSON.parse(stored);
    localStorage.setItem('myLoofas', JSON.stringify(loofas.filter((l) => l.id !== id)));
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

          <div className="mgmt-grid">
            <Link href={`/loofa/${loofa.slug}`} className="mgmt-tile mgmt-tile-blue">
              <div className="mgmt-tile-icon">👁</div>
              <h3>View QR Page</h3>
              <p>See your public display page</p>
            </Link>

            <button type="button" className="mgmt-tile mgmt-tile-green">
              <div className="mgmt-tile-icon">📋</div>
              <h3>View Submissions</h3>
              <p>See who filled out your form</p>
              <span className="tile-badge">0 responses</span>
            </button>

            <button type="button" className="mgmt-tile">
              <div className="mgmt-tile-icon">🎨</div>
              <h3>QR Page Editor</h3>
              <p>Customize your display page</p>
              <span className="tile-badge tile-badge-soon">Coming soon</span>
            </button>

            <button type="button" className="mgmt-tile">
              <div className="mgmt-tile-icon">✏️</div>
              <h3>Submission Editor</h3>
              <p>Edit the questions people see</p>
              <span className="tile-badge tile-badge-soon">Coming soon</span>
            </button>

            <button type="button" className="mgmt-tile">
              <div className="mgmt-tile-icon">📦</div>
              <h3>Order Tracking</h3>
              <p>Track your physical loofa orders</p>
              <span className="tile-badge tile-badge-soon">Coming soon</span>
            </button>

            <button type="button" className="mgmt-tile">
              <div className="mgmt-tile-icon">🛍️</div>
              <h3>Order More</h3>
              <p>Get more loofas for your bag</p>
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
