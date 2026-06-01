'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
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

export default function MyLoofas() {
  const [loofas, setLoofas] = useState<Loofa[]>([]);
  const [preferredName, setPreferredName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);
      supabase
        .from('loofabag_profiles')
        .select('preferred_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data?.preferred_name) setPreferredName(data.preferred_name);
        });
    });
  }, []);

  useEffect(() => {
    if (editingName) inputRef.current?.focus();
  }, [editingName]);

  useEffect(() => {
    fetch('/api/loofas')
      .then((r) => r.json())
      .then((data) => { if (data.loofas) setLoofas(data.loofas); })
      .catch(console.error);
  }, []);

  const startEditing = () => {
    setNameInput(preferredName);
    setEditingName(true);
  };

  const saveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed || !userId) { setEditingName(false); return; }
    const supabase = createClient();
    await supabase.from('loofabag_profiles').update({ preferred_name: trimmed }).eq('id', userId);
    setPreferredName(trimmed);
    setEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') saveName();
    if (e.key === 'Escape') setEditingName(false);
  };

  const deleteLoofa = async (id: string) => {
    await fetch(`/api/loofas/${id}`, { method: 'DELETE' }).catch(console.error);
    setLoofas((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <main>
      <NavBar />

      <section className="my-loofas-section">
        <div className="my-loofas-container">
          {preferredName && (
            <p className="loofas-greeting">
              {editingName ? (
                <>
                  Hi{' '}
                  <input
                    ref={inputRef}
                    className="greeting-name-input"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    onBlur={saveName}
                    onKeyDown={handleKeyDown}
                    maxLength={50}
                  />
                  ! 👋
                </>
              ) : (
                <>
                  Hi {preferredName}!{' '}
                  <button className="greeting-edit-btn" onClick={startEditing} aria-label="Edit name">
                    ✏️
                  </button>
                  {' '}👋
                </>
              )}
            </p>
          )}
          <h1>My Loofas</h1>

          <Link href="/my-loofas/create" className="add-loofa-btn">
            <span className="plus-icon">+</span>
          </Link>

          {loofas.length === 0 ? (
            <div className="empty-state">
              <p>You currently have no loofas created</p>
            </div>
          ) : (
            <div className="loofa-grid">
              {loofas.map((loofa) => (
                <article key={loofa.id} className="loofa-card">
                  <Link href={`/my-loofas/${loofa.id}`} className="loofa-card-body">
                    <div className="loofa-emoji">{loofa.emoji}</div>
                    <h3>{loofa.name}</h3>
                    <p className="loofa-slug">loofabag.com/{loofa.slug}</p>
                    <span className={`loofa-status-dot ${(loofa.isActive ?? true) ? 'status-active' : 'status-off'}`}>
                      {(loofa.isActive ?? true) ? '● Active' : '○ Off'}
                    </span>
                  </Link>
                  <div className="loofa-actions">
                    <Link href={`/my-loofas/edit/${loofa.id}`} className="edit-btn">
                      Edit
                    </Link>
                    <Link href={`/${loofa.slug}`} className="view-btn">
                      View
                    </Link>
                    <button
                      className="delete-btn"
                      onClick={() => deleteLoofa(loofa.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  );
}
