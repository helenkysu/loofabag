'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';

const designs = [
  { id: '1', name: 'Classic Red', color: '#FF6B6B', image: '🎨' },
  { id: '2', name: 'Sunny Yellow', color: '#FFD93D', image: '🌟' },
  { id: '3', name: 'Forest Green', color: '#6BCB77', image: '🌲' },
  { id: '4', name: 'Ocean Blue', color: '#4D96FF', image: '🌊' },
  { id: '5', name: 'Pink Blush', color: '#FF6B9D', image: '💗' },
  { id: '6', name: 'Purple Dreams', color: '#B19CD9', image: '✨' },
];

const templates = [
  {
    id: 'dating',
    name: 'Dating',
    emoji: '💕',
    questions: [
      'What are you looking for?',
      'Tell us about yourself',
      'What are your interests?',
      'How would you contact you?',
    ],
  },
  {
    id: 'friends',
    name: 'Friends',
    emoji: '👯',
    questions: [
      'What kind of friends are you looking for?',
      'Tell us about yourself',
      'What are your hobbies?',
      'Best way to reach you?',
    ],
  },
  {
    id: 'job',
    name: 'Job',
    emoji: '💼',
    questions: [
      'What position are you looking for?',
      'Tell us about your experience',
      'What are your skills?',
      'How should they contact you?',
    ],
  },
];

export default function EditLoofaPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  const [name, setName] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('myLoofas');
    if (!stored) { setNotFound(true); return; }
    const loofas = JSON.parse(stored);
    const loofa = loofas.find((l: { id: string }) => l.id === id);
    if (!loofa) { setNotFound(true); return; }
    setName(loofa.name);
    setSelectedDesign(designs.find((d) => d.id === loofa.design) ?? designs[0]);
    setSelectedTemplate(templates.find((t) => t.id === loofa.template) ?? templates[0]);
  }, [id]);

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
        ? { ...l, name, slug, design: selectedDesign.id, template: selectedTemplate.id, emoji: selectedTemplate.emoji }
        : l
    );
    localStorage.setItem('myLoofas', JSON.stringify(updated));
    router.push('/my-loofas');
  };

  if (notFound) {
    return (
      <main>
        <nav>
          <Link href="/" className="logo">👜 myloofabag</Link>
          <div className="nav-links">
            <Link href="/">Home</Link>
            <Link href="/my-loofas">My Loofas</Link>
          </div>
        </nav>
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
      <nav>
        <Link href="/" className="logo">👜 myloofabag</Link>
        <div className="nav-links">
          <Link href="/">Home</Link>
          <Link href="/my-loofas">My Loofas</Link>
        </div>
      </nav>

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
            <h2>Template</h2>
            <div className="template-grid">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <div className="template-icon">{template.emoji}</div>
                  <h3>{template.name}</h3>
                  <ul className="template-questions">
                    {template.questions.map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </button>
              ))}
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
