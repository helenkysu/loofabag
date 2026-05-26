'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const templates = {
  dating: {
    name: 'Dating',
    emoji: '💕',
    questions: [
      'What are you looking for?',
      'Tell us about yourself',
      'What are your interests?',
      'How would you contact you?',
    ],
  },
  friends: {
    name: 'Friends',
    emoji: '👯',
    questions: [
      'What kind of friends are you looking for?',
      'Tell us about yourself',
      'What are your hobbies?',
      'Best way to reach you?',
    ],
  },
  job: {
    name: 'Job',
    emoji: '💼',
    questions: [
      'What position are you looking for?',
      'Tell us about your experience',
      'What are your skills?',
      'How should they contact you?',
    ],
  },
};

export default function LoofahPage({ params }: { params: { slug: string } }) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) return;
    const loofas = JSON.parse(stored);
    const found = loofas.find((l: { slug: string; isActive?: boolean }) => l.slug === params.slug);
    if (found) setIsActive(found.isActive ?? true);
  }, [params.slug]);

  const template = templates.dating as typeof templates.dating;

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setShowForm(false), 2000);
  };

  return (
    <main>
      <nav>
        <Link href="/" className="logo">👜 myloofabag</Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/my-loofas">My Loofas</Link>
        </div>
      </nav>

      <section className="loofa-page-section">
        <div className="loofa-page-container">
          <div className="qr-section">
            <h1>{params.slug}</h1>
            <div className="qr-code-display">
              <div className="qr-placeholder">█████████████<br/>█ {params.slug} █<br/>█████████████</div>
            </div>
            <p className="template-type">{template.emoji} {template.name}</p>
            {isActive ? (
              <button className="btn btn-primary" onClick={() => setShowForm(true)}>
                Fill Out Form
              </button>
            ) : (
              <div className="inactive-banner">
                This loofa is not currently accepting new submissions.
              </div>
            )}
          </div>

          {showForm && (
            <div className="form-modal-overlay" onClick={() => setShowForm(false)}>
              <div className="form-modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="form-modal-close" onClick={() => setShowForm(false)}>✕</button>

                {!submitted ? (
                  <form onSubmit={handleSubmit}>
                    <h2>Connect with {params.slug}</h2>
                    {template.questions.map((question, idx) => (
                      <div key={idx} className="form-group">
                        <label>{question}</label>
                        {idx === template.questions.length - 1 ? (
                          <input
                            type="email"
                            placeholder="your@email.com"
                            value={formData[`q${idx}`] || ''}
                            onChange={(e) => handleInputChange(`q${idx}`, e.target.value)}
                            required
                          />
                        ) : (
                          <textarea
                            placeholder="Your answer..."
                            value={formData[`q${idx}`] || ''}
                            onChange={(e) => handleInputChange(`q${idx}`, e.target.value)}
                            required
                          />
                        )}
                      </div>
                    ))}
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary">
                        Submit
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="success-message">
                    <div className="success-icon">✓</div>
                    <h2>Thank you!</h2>
                    <p>Your response has been submitted.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
