'use client';

import { useEffect, useState } from 'react';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';

interface FormField {
  id: string;
  type: 'text' | 'number' | 'paragraph' | 'photo' | 'url' | 'file';
  label: string;
  optional: boolean;
}

interface StoredLoofa {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  template: string;
  isActive?: boolean;
  fields?: FormField[];
  questions?: string[];
}

export default function LoofahPage({ params }: { params: { slug: string } }) {
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File[]>>({});
  const [isActive, setIsActive] = useState(true);
  const [loofa, setLoofa] = useState<StoredLoofa | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) return;
    const loofas: StoredLoofa[] = JSON.parse(stored);
    const found = loofas.find((l) => l.slug === params.slug);
    if (found) {
      setLoofa(found);
      setIsActive(found.isActive ?? true);
    }
  }, [params.slug]);

  const fields: FormField[] = loofa?.fields ?? (loofa?.questions ?? []).map((q, i) => ({
    id: `q${i}`,
    type: 'paragraph' as const,
    label: q,
    optional: false,
  }));

  const handleInputChange = (fieldId: string, value: string) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handlePhotoChange = (fieldId: string, files: File[]) => {
    setPhotoFiles((prev) => ({ ...prev, [fieldId]: files }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (loofa?.id) {
      const uploadPromises = fields
        .filter((f) => (f.type === 'photo' || f.type === 'file') && photoFiles[f.id]?.length)
        .map((f) => {
          const fd = new FormData();
          fd.append('loofa_id', loofa.id);
          fd.append('type', f.type === 'photo' ? 'photos' : 'files');
          photoFiles[f.id].forEach((file) => fd.append('files', file));
          return fetch('/api/upload/files', { method: 'POST', body: fd });
        });
      await Promise.all(uploadPromises).catch(console.error);
    }

    setSubmitting(false);
    setSubmitted(true);
    setTimeout(() => setShowForm(false), 2000);
  };

  const displayName = loofa?.name ?? params.slug;
  const displayEmoji = loofa?.emoji ?? '👜';

  return (
    <main>
      <NavBar />

      <section className="loofa-page-section">
        <div className="loofa-page-container">
          <div className="qr-section">
            <h1>{displayEmoji} {displayName}</h1>
            <div className="qr-code-display">
              <div className="qr-placeholder">█████████████<br />█ {params.slug} █<br />█████████████</div>
            </div>
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
                    <h2>Connect with {displayName}</h2>

                    {fields.length === 0 && (
                      <p style={{ color: '#aaa', fontSize: 14, marginBottom: 16 }}>
                        No fields configured for this loofa yet.
                      </p>
                    )}

                    {fields.map((field) => (
                      <div key={field.id} className="form-group">
                        <label>
                          {field.label}
                          {field.optional && (
                            <span style={{ color: '#aaa', fontWeight: 400, marginLeft: 6 }}>(optional)</span>
                          )}
                        </label>

                        {field.type === 'text' && (
                          <input
                            type="text"
                            placeholder="Your answer"
                            value={formData[field.id] ?? ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            required={!field.optional}
                          />
                        )}

                        {field.type === 'number' && (
                          <input
                            type="number"
                            placeholder="0"
                            value={formData[field.id] ?? ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            required={!field.optional}
                            min={0}
                          />
                        )}

                        {field.type === 'paragraph' && (
                          <textarea
                            placeholder="Your answer..."
                            value={formData[field.id] ?? ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            required={!field.optional}
                          />
                        )}

                        {field.type === 'url' && (
                          <input
                            type="url"
                            placeholder="https://"
                            value={formData[field.id] ?? ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            required={!field.optional}
                          />
                        )}

                        {field.type === 'photo' && (
                          <DropZone
                            accept="image/*"
                            multiple
                            maxFiles={5}
                            onFiles={(files) => handlePhotoChange(field.id, files)}
                          />
                        )}

                        {field.type === 'file' && (
                          <DropZone
                            accept=".pdf,.doc,.docx"
                            onFiles={(files) => handlePhotoChange(field.id, files)}
                          />
                        )}
                      </div>
                    ))}

                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? 'Uploading…' : 'Submit'}
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
