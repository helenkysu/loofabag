'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

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
      { type: 'text', label: "Position you're looking for", optional: true },
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

export default function EditLoofaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(templateDefs[0]);
  const [customFields, setCustomFields] = useState<FormField[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [fieldsSaved, setFieldsSaved] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) { setNotFound(true); return; }
    const loofas = JSON.parse(stored);
    const loofa = loofas.find((l: { id: string }) => l.id === id);
    if (!loofa) { setNotFound(true); return; }

    setName(loofa.name);
    setSelectedDesign(designs.find((d) => d.id === loofa.design) ?? designs[0]);
    const tmpl = templateDefs.find((t) => t.id === loofa.template) ?? templateDefs[0];
    setSelectedTemplate(tmpl);

    if (Array.isArray(loofa.fields) && loofa.fields.length > 0) {
      setCustomFields(loofa.fields.map((f: FieldDef) => ({ ...f, id: makeId() })));
    } else if (Array.isArray(loofa.questions)) {
      setCustomFields(loofa.questions.map((q: string) => ({
        id: makeId(),
        type: 'paragraph' as const,
        label: q,
        optional: true,
      })));
    } else {
      setCustomFields(toFormFields(tmpl.fields));
    }
  }, [id]);

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

  const handleSave = () => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) return;
    const loofas = JSON.parse(stored);
    const updated = loofas.map((l: { id: string }) =>
      l.id === id
        ? {
            ...l,
            name,
            slug,
            design: selectedDesign.id,
            template: selectedTemplate.id,
            emoji: selectedTemplate.emoji,
            fields: customFields.filter((f) => f.label.trim()),
          }
        : l
    );
    localStorage.setItem('myLoofas', JSON.stringify(updated));
    router.push('/my-loofas');
  };

  if (notFound) {
    return (
      <main>
        <NavBar />
        <section className="my-loofas-section">
          <div className="my-loofas-container">
            <p>Loofa not found.</p>
            <Link href="/my-loofas" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
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
          <h1>Edit Loofa</h1>

          <div className="step-content">
            <h2>Name</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="name-input"
              placeholder="Loofa name"
            />
            {name && (
              <div className="url-preview">
                <p>Your URL: <strong>loofabag.com/{slug}</strong></p>
              </div>
            )}
          </div>

          <div className="step-content">
            <h2>Bag Design</h2>
            <div className="design-grid">
              {designs.map((design) => (
                <button
                  key={design.id}
                  type="button"
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

          <div className="step-content">
            <h2>Template & Fields</h2>
            <p className="step-subtitle">Switch template to reset fields, or customize below.</p>
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
                  <label className="field-optional-label">
                    <input
                      type="checkbox"
                      checked={field.optional}
                      onChange={(e) => updateField(idx, { optional: e.target.checked })}
                    />
                    Optional
                  </label>
                  <button
                    type="button"
                    className="question-delete-btn"
                    onClick={() => removeField(idx)}
                    aria-label="Remove field"
                  >×</button>
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

          <div className="modal-footer">
            <Link href="/my-loofas" className="btn btn-secondary">
              Cancel
            </Link>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={!name}
            >
              Save Changes
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
