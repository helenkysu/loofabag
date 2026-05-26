'use client';

import { useState } from 'react';

interface CreateLoofalProps {
  onClose: () => void;
  onCreate: (loofa: { id: string; name: string; slug: string; design: string; template: string; emoji: string }) => void;
}

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

export default function CreateLoofa({ onClose, onCreate }: CreateLoofalProps) {
  const [step, setStep] = useState(1);
  const [selectedDesign, setSelectedDesign] = useState(designs[0]);
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);

  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Create the loofa
      onCreate({
        id: Date.now().toString(),
        name,
        slug,
        design: selectedDesign.id,
        template: selectedTemplate.id,
        emoji: selectedTemplate.emoji,
      });
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>

        {/* Step 1: Pick Bag Design */}
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

        {/* Step 2: Enter Name */}
        {step === 2 && (
          <div className="step-content">
            <h2>Name Your Loofa</h2>
            <p className="step-subtitle">This will be the URL path - choose wisely!</p>
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

        {/* Step 3: Checkout */}
        {step === 3 && (
          <div className="step-content">
            <h2>Checkout</h2>
            <div className="checkout-summary">
              <div className="summary-item">
                <span>Loofa Name:</span>
                <strong>{name}</strong>
              </div>
              <div className="summary-item">
                <span>URL:</span>
                <strong>loofabag.com/{slug}</strong>
              </div>
              <div className="summary-item">
                <span>Design:</span>
                <strong>{selectedDesign.name}</strong>
              </div>
              <div className="price-section">
                <p>Price: <strong>$29.99</strong></p>
                <button className="btn btn-primary checkout-btn">Complete Purchase</button>
              </div>
            </div>
            <p className="checkout-note">💳 Placeholder checkout - no actual payment required</p>
          </div>
        )}

        {/* Step 4: QR Template Selection */}
        {step === 4 && (
          <div className="step-content">
            <h2>Choose Your Template</h2>
            <p className="step-subtitle">Select what people will see when they scan your QR code</p>
            <div className="template-grid">
              {templates.map((template) => (
                <button
                  key={template.id}
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
        )}

        {/* Step 5: QR Generated */}
        {step === 5 && (
          <div className="step-content">
            <h2>Your QR Code is Ready!</h2>
            <div className="qr-display">
              <div className="qr-code-placeholder">
                <p>█████████</p>
                <p>█ {slug} █</p>
                <p>█████████</p>
              </div>
              <p className="qr-text">Scan to access: <strong>loofabag.com/{slug}</strong></p>
            </div>
            <div className="template-preview">
              <p className="template-label">Form Template: <strong>{selectedTemplate.name} ({selectedTemplate.emoji})</strong></p>
              <div className="preview-questions">
                {selectedTemplate.questions.map((q, idx) => (
                  <div key={idx} className="question-item">
                    <p>{idx + 1}. {q}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="modal-footer">
          <button
            className="btn btn-secondary"
            onClick={handlePrev}
            disabled={step === 1}
          >
            Back
          </button>
          <div className="step-indicator">
            Step {step} of 5
          </div>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            disabled={step === 2 && !name}
          >
            {step === 5 ? 'Create Loofa' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
