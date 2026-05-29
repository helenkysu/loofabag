'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
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
    fetch('/api/loofas')
      .then((r) => r.json())
      .then((data) => { if (data.loofas) setLoofas(data.loofas); })
      .catch(console.error);
  }, []);

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
            <p className="loofas-greeting">Hi {preferredName}! 👋</p>
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
