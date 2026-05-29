'use client';

import { useState } from 'react';
import { Turnstile } from '@marsidev/react-turnstile';
import NavBar from '@/app/components/NavBar';

export default function ContactPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message, captchaToken }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? 'Something went wrong. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Failed to send. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <NavBar />
      <section className="my-loofas-section">
        <div className="my-loofas-container" style={{ maxWidth: 560 }}>
          <h1 style={{ marginBottom: 8 }}>Contact</h1>
          <p className="step-subtitle" style={{ marginBottom: 32 }}>
            You can reach us at{' '}
            <a href="mailto:loofabag@gmail.com" className="profile-field-link">
              loofabag@gmail.com
            </a>
            , or use this form to send us a message.
          </p>

          {sent ? (
            <div className="contact-success">
              <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
              <h2>Message sent!</h2>
              <p>Thanks for reaching out — we&apos;ll get back to you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="transfer-field">
                <label className="transfer-label">Your email</label>
                <input
                  type="email"
                  className="shipping-input"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="transfer-field">
                <label className="transfer-label">Your message</label>
                <textarea
                  className="shipping-input contact-textarea"
                  placeholder="What's on your mind?"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={6}
                />
              </div>
              <Turnstile
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'}
                onSuccess={(token) => setCaptchaToken(token)}
                onExpire={() => setCaptchaToken(null)}
                onError={() => setCaptchaToken(null)}
                options={{ theme: 'light', size: 'normal' }}
              />
              {error && <p className="rates-error">{error}</p>}
              <button
                type="submit"
                className="btn btn-primary"
                disabled={sending || !email || !message || !captchaToken}
              >
                {sending ? 'Sending…' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
