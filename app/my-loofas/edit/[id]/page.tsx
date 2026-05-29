'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'paragraph' | 'photo' | 'url' | 'file';
  label: string;
  optional: boolean;
}

interface Loofa {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  template: string;
  fields?: FormField[];
  questions?: string[];
  isActive?: boolean;
}

interface NotificationSettings {
  email: string;
  enabled: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

const submissionTemplateDefs: Record<string, Array<{ type: FormField['type']; label: string; optional: boolean }>> = {
  dating: [
    { type: 'text', label: 'Name', optional: false },
    { type: 'number', label: 'Age', optional: false },
    { type: 'paragraph', label: 'Message', optional: false },
    { type: 'text', label: 'Preferred contact', optional: false },
  ],
  friends: [
    { type: 'text', label: 'Name', optional: false },
    { type: 'paragraph', label: 'Message', optional: false },
    { type: 'text', label: 'Preferred contact', optional: false },
  ],
  networking: [
    { type: 'text', label: 'Name', optional: false },
    { type: 'paragraph', label: 'Message', optional: false },
    { type: 'text', label: 'Preferred contact', optional: false },
  ],
};

export default function EditLoofaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [notFound, setNotFound] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [slug, setSlug] = useState('');
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifEmail, setNotifEmail] = useState('');
  const [savingNotif, setSavingNotif] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) { setNotFound(true); return; }
    const loofas: Loofa[] = JSON.parse(stored);
    const loofa = loofas.find((l) => l.id === id);
    if (!loofa) { setNotFound(true); return; }

    setSlug(loofa.slug);

    if (Array.isArray(loofa.fields) && loofa.fields.length > 0) {
      setFields(loofa.fields.map((f) => ({ ...f })));
    } else if (Array.isArray(loofa.questions) && loofa.questions.length > 0) {
      setFields(loofa.questions.map((q) => ({
        id: makeId(), type: 'paragraph' as const, label: q, optional: true,
      })));
    } else {
      const defaults = submissionTemplateDefs[loofa.template] ?? [];
      setFields(defaults.map((f) => ({ ...f, id: makeId() })));
    }

    // Load notification settings from server, fall back to session email if none saved
    fetch(`/api/notifications/settings?slug=${encodeURIComponent(loofa.slug)}`)
      .then((r) => r.json())
      .then((s: NotificationSettings) => {
        setNotifEnabled(s.email ? s.enabled : true);
        if (s.email) {
          setNotifEmail(s.email);
        } else {
          // No saved setting yet — pre-fill with signed-in email
          createClient().auth.getUser().then(({ data }) => {
            if (data.user?.email) setNotifEmail(data.user.email);
          });
        }
      })
      .catch(() => {});
  }, [id]);

  const updateField = (idx: number, updates: Partial<FormField>) =>
    setFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));

  const removeField = (idx: number) =>
    setFields((prev) => prev.filter((_, i) => i !== idx));

  const addField = () =>
    setFields((prev) => [...prev, { id: makeId(), type: 'text', label: '', optional: true }]);

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIndex(idx); };
  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    setFields((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) return;
    const loofas: Loofa[] = JSON.parse(stored);
    localStorage.setItem(
      'myLoofas',
      JSON.stringify(
        loofas.map((l) =>
          l.id === id ? { ...l, fields: fields.filter((f) => f.label.trim()) } : l,
        ),
      ),
    );

    if (slug) {
      setSavingNotif(true);
      await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, email: notifEmail.trim(), enabled: notifEnabled }),
      }).catch(() => {});
      setSavingNotif(false);
    }

    router.push(`/my-loofas/${id}`);
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
        <div className="my-loofas-container">
          <Link href={`/my-loofas/${id}`} className="back-link">← Back</Link>
          <h1>Submission Editor</h1>
          <p className="step-subtitle">Edit the fields visitors fill in when they connect with you.</p>

          <div className="question-editor">
            <p className="question-editor-label">
              Submission Fields <span className="drag-hint">drag and drop to reorder</span>
            </p>

            {fields.map((field, idx) => (
              <div
                key={field.id}
                className={`field-edit-row${dragIndex === idx ? ' dragging' : ''}${dragOverIndex === idx && dragIndex !== idx ? ' drag-over' : ''}`}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
              >
                <div className="field-config-row">
                  <span className="field-drag-handle" aria-label="Drag to reorder">⠿</span>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(idx, { label: e.target.value })}
                    className="question-edit-input"
                    placeholder={`Field ${idx + 1} label`}
                  />
                  <select
                    value={field.type}
                    onChange={(e) => updateField(idx, { type: e.target.value as FormField['type'] })}
                    className="field-type-select"
                  >
                    <option value="text">Short text</option>
                    <option value="number">Number</option>
                    <option value="paragraph">Paragraph</option>
                    <option value="url">URL / Link</option>
                    <option value="photo">Photo</option>
                    <option value="file">File upload</option>
                  </select>
                  <button type="button" className="question-delete-btn" onClick={() => removeField(idx)} aria-label="Remove field">×</button>
                </div>
                <div className="field-preview">
                  {field.type === 'text' && <input type="text" className="field-preview-input" placeholder={field.label || `Field ${idx + 1}`} />}
                  {field.type === 'number' && <input type="number" className="field-preview-input" placeholder="0" />}
                  {field.type === 'paragraph' && <textarea className="field-preview-textarea" placeholder={field.label || `Field ${idx + 1}`} rows={3} />}
                  {field.type === 'url' && <input type="url" className="field-preview-input" placeholder="https://" />}
                  {field.type === 'photo' && <DropZone accept="image/*,.heic,.HEIC,.heif,.HEIF" multiple maxFiles={5} maxSizeMB={5} />}
                  {field.type === 'file' && <DropZone accept=".pdf,.docx" maxFiles={1} maxSizeMB={5} />}
                </div>
              </div>
            ))}

            <div className="field-editor-actions">
              <button type="button" className="add-question-btn" onClick={addField}>+ Add field</button>
            </div>
          </div>

          <div className="notif-settings-section">
            <label className="notif-toggle-row">
              <span className="notif-toggle-label">
                <span className="notif-toggle-title">Email notifications for new submissions</span>
                <span className="notif-toggle-desc">Get an email every time someone submits a response</span>
              </span>
              <input
                type="checkbox"
                className="notif-checkbox"
                checked={notifEnabled}
                onChange={(e) => setNotifEnabled(e.target.checked)}
              />
            </label>
            {notifEnabled && (
              <div className="notif-email-row">
                <label className="notif-email-label">Notification email</label>
                <input
                  type="email"
                  className="notif-email-input"
                  placeholder="you@example.com"
                  value={notifEmail}
                  onChange={(e) => setNotifEmail(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="modal-footer">
            <Link href={`/my-loofas/${id}`} className="btn btn-secondary">Cancel</Link>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={savingNotif}>
              {savingNotif ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
