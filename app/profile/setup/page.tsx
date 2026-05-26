'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ProfileSetupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push('/auth/sign-in');
      return;
    }

    const { error } = await supabase
      .from('loofabag_profiles')
      .update({ preferred_name: name.trim() })
      .eq('id', user.id);

    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      router.push('/my-loofas');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="logo auth-logo">👜 myloofabag</Link>
        <div className="auth-header">
          <h1 className="auth-heading">What should we call you?</h1>
          <p className="auth-subheading">You can always change this later</p>
        </div>
        <form onSubmit={handleSubmit} className="auth-form">
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="name-input"
            autoFocus
            maxLength={50}
          />
          {error && <p className="auth-error">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!name.trim() || loading}
          >
            {loading ? 'Saving…' : "Let's go 👜"}
          </button>
        </form>
      </div>
    </main>
  );
}
