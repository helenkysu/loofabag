'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';

interface FormField {
  id: string;
  type: 'text' | 'number' | 'paragraph' | 'photo' | 'video' | 'url' | 'file';
  label: string;
  optional: boolean;
}

interface Loofa {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  fields?: FormField[];
  profileFields?: FormField[];
  profileData?: Record<string, string>;
  isActive?: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function parsePaths(raw: string | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

export default function ProfileEditorPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [fields, setFields] = useState<FormField[]>([]);
  const [profileData, setProfileData] = useState<Record<string, string>>({});
  const [pendingFiles, setPendingFiles] = useState<Record<string, File[]>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) { setNotFound(true); return; }
    const loofas: Loofa[] = JSON.parse(stored);
    const found = loofas.find((l) => l.id === id);
    if (!found) { setNotFound(true); return; }
    setLoofa(found);
    const seed = found.profileFields ?? found.fields ?? [];
    setFields(seed.map((f) => ({ ...f })));
    setProfileData(found.profileData ?? {});
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

  const handleTextChange = (fieldId: string, value: string) =>
    setProfileData((prev) => ({ ...prev, [fieldId]: value }));

  const handleFiles = (fieldId: string, files: File[]) =>
    setPendingFiles((prev) => ({ ...prev, [fieldId]: files }));

  const handleSave = async () => {
    if (!loofa) return;
    setSaving(true);

    const updatedData = { ...profileData };

    await Promise.all(
      fields
        .filter((f) => (f.type === 'photo' || f.type === 'video' || f.type === 'file') && pendingFiles[f.id]?.length)
        .map(async (field) => {
          const fd = new FormData();
          fd.append('loofa_id', loofa.id);
          const uploadType = field.type === 'photo' ? 'photos' : field.type === 'video' ? 'videos' : 'files';
          fd.append('type', uploadType);
          pendingFiles[field.id].forEach((file) => fd.append('files', file));
          const res = await fetch('/api/upload/files', { method: 'POST', body: fd });
          const data = await res.json();
          if (data.paths?.length) {
            const existing = parsePaths(updatedData[field.id]);
            updatedData[field.id] = JSON.stringify([...existing, ...data.paths]);
          }
        }),
    );

    const profileFields = fields.filter((f) => f.label.trim());
    const stored = localStorage.getItem('myLoofas');
    if (stored) {
      const loofas: Loofa[] = JSON.parse(stored);
      localStorage.setItem(
        'myLoofas',
        JSON.stringify(loofas.map((l) => (l.id === id ? { ...l, profileFields, profileData: updatedData } : l))),
      );
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => router.push(`/my-loofas/${id}`), 800);
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
          <h1>QR Page Editor</h1>
          <p className="step-subtitle">Edit your profile fields and fill in your info.</p>

          <div className="question-editor">
            <p className="question-editor-label">
              Profile Fields <span className="drag-hint">drag and drop to reorder</span>
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
                    <option value="video">Video</option>
                    <option value="file">File upload</option>
                  </select>
                  <button type="button" className="question-delete-btn" onClick={() => removeField(idx)} aria-label="Remove field">×</button>
                </div>

                {/* Live editable value input */}
                <div className="field-preview">
                  {field.type === 'text' && (
                    <input
                      type="text"
                      className="field-preview-input"
                      placeholder={field.label || `Field ${idx + 1}`}
                      value={profileData[field.id] ?? ''}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                    />
                  )}
                  {field.type === 'number' && (
                    <input
                      type="number"
                      className="field-preview-input"
                      placeholder="0"
                      value={profileData[field.id] ?? ''}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                      min={0}
                    />
                  )}
                  {field.type === 'paragraph' && (
                    <textarea
                      className="field-preview-textarea"
                      placeholder={field.label || `Field ${idx + 1}`}
                      rows={3}
                      value={profileData[field.id] ?? ''}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                    />
                  )}
                  {field.type === 'url' && (
                    <input
                      type="url"
                      className="field-preview-input"
                      placeholder="https://"
                      value={profileData[field.id] ?? ''}
                      onChange={(e) => handleTextChange(field.id, e.target.value)}
                    />
                  )}
                  {(field.type === 'photo' || field.type === 'video' || field.type === 'file') && (
                    <div>
                      {parsePaths(profileData[field.id]).length > 0 && (
                        <div className="profile-existing-files">
                          {field.type === 'photo' ? (
                            <div className="profile-existing-photos">
                              {parsePaths(profileData[field.id]).map((path) => (
                                <img key={path} src={`/api/files/proxy?path=${encodeURIComponent(path)}`} alt="" className="profile-existing-photo" />
                              ))}
                            </div>
                          ) : field.type === 'video' ? (
                            <div className="profile-existing-photos">
                              {parsePaths(profileData[field.id]).map((path) => (
                                <video key={path} src={`/api/files/proxy?path=${encodeURIComponent(path)}`} controls className="profile-existing-photo" style={{ objectFit: 'cover' }} />
                              ))}
                            </div>
                          ) : (
                            <p className="profile-existing-file-note">
                              {parsePaths(profileData[field.id]).length} file{parsePaths(profileData[field.id]).length !== 1 ? 's' : ''} uploaded
                            </p>
                          )}
                          <p className="profile-existing-file-note">Upload below to add more</p>
                        </div>
                      )}
                      <DropZone
                        accept={
                          field.type === 'photo' ? 'image/*,.heic,.HEIC,.heif,.HEIF' :
                          field.type === 'video' ? 'video/*,.mp4,.mov,.avi,.webm' :
                          '.pdf,.doc,.docx'
                        }
                        multiple={field.type === 'photo' || field.type === 'video'}
                        maxFiles={field.type === 'photo' ? 10 : field.type === 'video' ? 2 : 1}
                        maxSizeMB={field.type === 'photo' ? 5 : field.type === 'video' ? 50 : 5}
                        maxDurationSeconds={field.type === 'video' ? 120 : undefined}
                        onFiles={(files) => handleFiles(field.id, files)}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            <div className="field-editor-actions">
              <button type="button" className="add-question-btn" onClick={addField}>+ Add field</button>
            </div>
          </div>

          <div className="modal-footer">
            <Link href={`/my-loofas/${id}`} className="btn btn-secondary">Cancel</Link>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || saved}>
              {saved ? 'Saved!' : saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
