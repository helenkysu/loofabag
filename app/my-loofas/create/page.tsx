'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

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
  {
    id: 'blank',
    name: 'Blank',
    emoji: '📝',
    questions: [],
  },
];

export default function CreateLoofaPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [customQuestions, setCustomQuestions] = useState<string[]>(templates[0].questions);
  const [finished, setFinished] = useState(false);

  const selectTemplate = (template: typeof templates[0]) => {
    setSelectedTemplate(template);
    setCustomQuestions([...template.questions]);
  };

  const updateQuestion = (idx: number, value: string) => {
    const updated = [...customQuestions];
    updated[idx] = value;
    setCustomQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
  };

  const addQuestion = () => {
    setCustomQuestions([...customQuestions, '']);
  };

  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  useEffect(() => {
    if (finished) {
      const stored = localStorage.getItem('myLoofas');
      const current = stored ? JSON.parse(stored) : [];
      const newLoofa = {
        id: Date.now().toString(),
        name: name || `Loofa ${current.length + 1}`,
        slug,
        design: selectedDesign.id,
        template: selectedTemplate.id,
        emoji: selectedTemplate.emoji,
        questions: customQuestions.filter((q) => q.trim()),
      };
      localStorage.setItem('myLoofas', JSON.stringify([...current, newLoofa]));
    }
  }, [finished, name, selectedDesign.id, selectedTemplate.id, selectedTemplate.emoji, slug, customQuestions]);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
      return;
    }

    setFinished(true);
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
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
              <p className="url-preview">
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
                  <p className="step-subtitle">All templates are fully customizable — add, edit, or remove any question.</p>
                  <div className="template-grid">
                    {templates.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        className={`template-card ${selectedTemplate.id === template.id ? 'selected' : ''}`}
                        onClick={() => selectTemplate(template)}
                      >
                        <div className="template-icon">{template.emoji}</div>
                        <h3>{template.name}</h3>
                        {template.questions.length > 0 ? (
                          <ul className="template-questions">
                            {template.questions.map((q, idx) => (
                              <li key={idx}>{q}</li>
                            ))}
                          </ul>
                        ) : (
                          <p className="template-blank-hint">Pick your own questions</p>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="question-editor">
                    <p className="question-editor-label">Your Questions</p>
                    {customQuestions.map((q, idx) => (
                      <div key={idx} className="question-edit-row">
                        <input
                          type="text"
                          value={q}
                          onChange={(e) => updateQuestion(idx, e.target.value)}
                          className="question-edit-input"
                          placeholder={`Question ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="question-delete-btn"
                          onClick={() => removeQuestion(idx)}
                          aria-label="Remove question"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button type="button" className="add-question-btn" onClick={addQuestion}>
                      + Add question
                    </button>
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
                      {customQuestions.filter((q) => q.trim()).length > 0 ? (
                        customQuestions.filter((q) => q.trim()).map((q, idx) => (
                          <div key={idx} className="question-item">
                            <p>{idx + 1}. {q}</p>
                          </div>
                        ))
                      ) : (
                        <p style={{ color: '#aaa', fontSize: 14 }}>No questions added yet.</p>
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
