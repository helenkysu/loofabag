'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';

const designs = [
  { id: '1', name: 'Classic Red', color: '#FF6B6B', image: '🎨' },
  { id: '2', name: 'Sunny Yellow', color: '#FFD93D', image: '🌟' },
  { id: '3', name: 'Forest Green', color: '#6BCB77', image: '🌲' },
  { id: '4', name: 'Ocean Blue', color: '#4D96FF', image: '🌊' },
  { id: '5', name: 'Pink Blush', color: '#FF6B9D', image: '💗' },
  { id: '6', name: 'Purple Dreams', color: '#B19CD9', image: '✨' },
];

export interface FormField {
  id: string;
  type: 'text' | 'number' | 'paragraph' | 'photo' | 'url' | 'file';
  label: string;
  optional: boolean;
}

interface FieldDef {
  type: FormField['type'];
  label: string;
  optional: boolean;
}

function makeId() {
  return Math.random().toString(36).slice(2, 9);
}

function toFormFields(defs: FieldDef[]): FormField[] {
  return defs.map((f) => ({ ...f, id: makeId() }));
}

const templateDefs: Array<{ id: string; name: string; emoji: string; fields: FieldDef[] }> = [
  {
    id: 'dating',
    name: 'Dating',
    emoji: '💕',
    fields: [
      { type: 'text', label: 'Name / Nickname', optional: false },
      { type: 'number', label: 'Age', optional: true },
      { type: 'text', label: 'Gender', optional: true },
      { type: 'text', label: 'Ethnicity', optional: true },
      { type: 'text', label: 'MBTI', optional: true },
      { type: 'paragraph', label: 'Looking for', optional: true },
      { type: 'paragraph', label: 'Preferred contact method', optional: false },
      { type: 'photo', label: 'Photos (up to 5)', optional: true },
    ],
  },
  {
    id: 'friends',
    name: 'Friendship',
    emoji: '👯',
    fields: [
      { type: 'text', label: 'Name / Nickname', optional: false },
      { type: 'photo', label: 'Photos (up to 5)', optional: true },
      { type: 'text', label: 'Location', optional: true },
      { type: 'paragraph', label: 'Hobbies & interests', optional: true },
      { type: 'paragraph', label: 'Looking for', optional: true },
    ],
  },
  {
    id: 'networking',
    name: 'Networking',
    emoji: '🤝',
    fields: [
      { type: 'text', label: 'Name', optional: false },
      { type: 'text', label: 'Role / What you do', optional: false },
      { type: 'text', label: 'Position you\'re looking for', optional: true },
      { type: 'text', label: 'School', optional: true },
      { type: 'paragraph', label: 'About your experience', optional: true },
      { type: 'text', label: 'Key skills', optional: true },
      { type: 'url', label: 'LinkedIn', optional: true },
      { type: 'file', label: 'Resume', optional: true },
      { type: 'photo', label: 'Photo / Headshot', optional: true },
      { type: 'text', label: 'How should they contact you', optional: false },
      { type: 'paragraph', label: 'Looking for', optional: true },
    ],
  },
  {
    id: 'blank',
    name: 'Blank',
    emoji: '📝',
    fields: [],
  },
];

export default function CreateLoofaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templateDefs[0]);
  const [customFields, setCustomFields] = useState<FormField[]>(() => toFormFields(templateDefs[0].fields));
  const [finished, setFinished] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const didSave = useRef(false);

  const selectTemplate = (template: typeof templateDefs[0]) => {
    setSelectedTemplate(template);
    setCustomFields(toFormFields(template.fields));
  };

  const updateField = (idx: number, updates: Partial<FormField>) => {
    setCustomFields((prev) => prev.map((f, i) => (i === idx ? { ...f, ...updates } : f)));
  };

  const removeField = (idx: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== idx));
  };

  const addField = () => {
    setCustomFields((prev) => [...prev, { id: makeId(), type: 'text', label: '', optional: true }]);
  };

  const handleDragStart = (idx: number) => setDragIndex(idx);

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIndex(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === idx) { setDragIndex(null); setDragOverIndex(null); return; }
    setCustomFields((prev) => {
      const next = [...prev];
      const [removed] = next.splice(dragIndex, 1);
      next.splice(idx, 0, removed);
      return next;
    });
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => { setDragIndex(null); setDragOverIndex(null); };

  const handleSaveFields = () => {
    setFieldsSaved(true);
    setTimeout(() => setFieldsSaved(false), 2000);
  };

  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  useEffect(() => {
    if (!finished || didSave.current) return;
    didSave.current = true;

    const stored = localStorage.getItem('myLoofas');
    const current = stored ? JSON.parse(stored) : [];
    const loofaId = Date.now().toString();
    const newLoofa = {
      id: loofaId,
      name: name || `Loofa ${current.length + 1}`,
      slug,
      design: selectedDesign.id,
      template: selectedTemplate.id,
      emoji: selectedTemplate.emoji,
      fields: customFields.filter((f) => f.label.trim()),
    };
    localStorage.setItem('myLoofas', JSON.stringify([...current, newLoofa]));

    const qrUrl = `${window.location.origin}/loofa/${slug}`;
    fetch('/api/upload/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loofa_id: loofaId, url: qrUrl }),
    })
      .then((r) => r.json())
      .then((data) => { if (data.dataUrl) setQrDataUrl(data.dataUrl); })
      .catch(console.error);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }
    setFinished(true);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <main>
      <NavBar />

      <section className="my-loofas-section">
        <div className="my-loofas-container">
          <h1>Create a New Loofa</h1>

          {finished ? (
            <div className="success-message">
              <div className="success-icon">✓</div>
              <h2>Loofa Created!</h2>
              <p>Your new loofa is ready and saved.</p>
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="QR code" className="qr-generated-img" />
              ) : (
                <div className="qr-generating">Generating QR code…</div>
              )}
              <p className="url-preview" style={{ marginTop: 12 }}>
                URL: <strong>loofabag.com/{slug}</strong>
              </p>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={() => router.push('/my-loofas')}>
                  Back to My Loofas
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="step-content">
                  <h2>Pick Your Bag Design</h2>
                  <div className="design-grid">
                    {designs.map((design) => (
                      <button
                        key={design.id}
                        className={`design-card ${selectedDesign.id === design.id ? 'selected' : ''}`}
                        onClick={() => setSelectedDesign(design)}
                        style={{ borderColor: design.color }}
                      >
                        <div className="design-preview" style={{ backgroundColor: design.color }}>
                          {design.image}
                        </div>
                        <p>{design.name}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="step-content">
                  <h2>Name Your Loofa</h2>
                  <p className="step-subtitle">This will be the URL path - choose wisely.</p>
                  <input
                    type="text"
                    placeholder="e.g., peachie, my-bff-hunt, dream-job"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="name-input"
                    autoFocus
                  />
                  {name && (
                    <div className="url-preview">
                      <p>Your URL: <strong>loofabag.com/{slug}</strong></p>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="step-content">
                  <h2>Checkout</h2>
                  <div className="checkout-summary">
                    <div className="summary-item">
                      <span>Loofa Name:</span>
                      <strong>{name || 'Untitled'}</strong>
                    </div>
                    <div className="summary-item">
                      <span>URL:</span>
                      <strong>loofabag.com/{slug || 'your-name'}</strong>
                    </div>
                    <div className="summary-item">
                      <span>Design:</span>
                      <strong>{selectedDesign.name}</strong>
                    </div>
                    <div className="price-section">
                      <p>Price: <strong>$29.99</strong></p>
                      <button className="btn btn-primary checkout-btn" onClick={handleNext}>Complete Purchase</button>
                    </div>
                  </div>
                  <p className="checkout-note">💳 Placeholder checkout — no actual payment required.</p>
                </div>
              )}

              {step === 4 && (
                <div className="step-content">
                  <h2>Choose Your Starter Template</h2>
                  <p className="step-subtitle">All templates are fully customizable — add, edit, or remove any field.</p>
                  <div className="template-grid">
                    {templateDefs.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                        onClick={() => selectTemplate(template)}
                      >
                        <div className="template-icon">{template.emoji}</div>
                        <h3>{template.name}</h3>
                        {template.fields.length > 0 ? (
                          <ul className="template-questions">
                            {template.fields.map((f, i) => (
                              <li key={i}>{f.label}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="template-blank-hint">Pick your own fields</p>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="question-editor">
                    <p className="question-editor-label">Your Fields <span className="drag-hint">drag and drop to reorder</span></p>
                    {customFields.map((field, idx) => (
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
                          <button
                            type="button"
                            className="question-delete-btn"
                            onClick={() => removeField(idx)}
                            aria-label="Remove field"
                          >×</button>
                        </div>
                        <div className="field-preview">
                          {(field.type === 'text') && (
                            <input type="text" className="field-preview-input" placeholder={field.label || `Field ${idx + 1}`} />
                          )}
                          {field.type === 'number' && (
                            <input type="number" className="field-preview-input" placeholder="0" />
                          )}
                          {field.type === 'paragraph' && (
                            <textarea className="field-preview-textarea" placeholder={field.label || `Field ${idx + 1}`} rows={3} />
                          )}
                          {field.type === 'url' && (
                            <input type="url" className="field-preview-input" placeholder="https://" />
                          )}
                          {field.type === 'photo' && (
                            <DropZone accept="image/*,.heic,.HEIC,.heif,.HEIF" multiple maxFiles={5} />
                          )}
                          {field.type === 'file' && (
                            <DropZone accept=".pdf,.doc,.docx" />
                          )}
                        </div>
                      </div>
                    ))}
                    <div className="field-editor-actions">
                      <button type="button" className="add-question-btn" onClick={addField}>
                        + Add field
                      </button>
                      <button
                        type="button"
                        className={`save-fields-btn${fieldsSaved ? ' saved' : ''}`}
                        onClick={handleSaveFields}
                      >
                        {fieldsSaved ? 'Saved ✓' : 'Save fields'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="step-content">
                  <h2>QR Page Generated</h2>
                  <div className="qr-display">
                    <div className="qr-code-placeholder">
                      <p>█████████</p>
                      <p>█ {slug || 'your-slug'} █</p>
                      <p>█████████</p>
                    </div>
                    <p className="qr-text">Scan to access: <strong>loofabag.com/{slug || 'your-slug'}</strong></p>
                  </div>
                  <div className="template-preview">
                    <p className="template-label">Template: <strong>{selectedTemplate.name} {selectedTemplate.emoji}</strong></p>
                    <div className="preview-questions">
                      {customFields.filter((f) => f.label.trim()).length > 0 ? (
                        customFields.filter((f) => f.label.trim()).map((f, idx) => (
                          <div key={f.id} className="question-item">
                            <p>
                              {idx + 1}. {f.label}
                              <span className="field-type-badge">{f.type}</span>
                              {f.optional && <span className="field-optional-badge">optional</span>}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#aaa', fontSize: 14 }}>No fields added yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '30px' }}>
                <button className="btn btn-secondary" onClick={handlePrev} disabled={step === 1}>
                  Back
                </button>
                <div className="step-indicator">Step {step} of 5</div>
                <button className="btn btn-primary" onClick={handleNext} disabled={step === 2 && !name}>
                  {step === 5 ? 'Create Loofa' : 'Next'}
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
