'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/my-loofas';
  const callbackError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState<string | null>(null);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState(callbackError ? 'Something went wrong. Please try again.' : '');

  const supabase = createClient();

  // Redirect if already signed in
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) window.location.href = next;
    });
  }, [next, supabase.auth]);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading('magic');
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
    setLoading(null);
    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setLoading(provider);
    setError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${next}`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(null);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <Link href="/" className="logo auth-logo">👜 myloofabag</Link>

        {magicLinkSent ? (
          <div className="magic-link-sent">
            <div className="auth-big-icon">✉️</div>
            <h2>Check your email</h2>
            <p>We sent a magic link to <strong>{email}</strong></p>
            <p className="auth-hint">Click the link to sign in — no password needed.</p>
            <button type="button" className="btn btn-secondary" onClick={() => setMagicLinkSent(false)}>
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <h1 className="auth-heading">Sign in</h1>
              <p className="auth-subheading">to your loofabag account</p>
            </div>

            <form onSubmit={handleMagicLink} className="auth-form">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="name-input"
                required
                autoFocus
              />
              {error && <p className="auth-error">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!!loading || !email}
              >
                {loading === 'magic' ? 'Sending…' : 'Send Magic Link'}
              </button>
            </form>

            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            <div className="oauth-buttons">
              <button
                type="button"
                className="oauth-btn oauth-btn-google"
                onClick={() => handleOAuth('google')}
                disabled={!!loading}
              >
                <GoogleIcon />
                {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
              </button>
              <button
                type="button"
                className="oauth-btn oauth-btn-facebook"
                onClick={() => handleOAuth('facebook')}
                disabled={!!loading}
              >
                <FacebookIcon />
                {loading === 'facebook' ? 'Redirecting…' : 'Continue with Facebook'}
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.083 17.64 11.775 17.64 9.2z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff" aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
