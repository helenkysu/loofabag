'use client';

import { useEffect, useState } from 'react';

type Category = 'dating' | 'friends' | 'networking';

interface Phrase {
  id: string;
  line1: string;
  line2?: string;
  sub?: 'parents';
}

const PHRASES: Record<Category, Phrase[]> = {
  dating: [
    { id: 'd1',  line1: 'LOOKING FOR MY FUTURE BOYFRIEND/GIRLFRIEND' },
    { id: 'd2',  line1: 'LOOKING FOR MY FUTURE HUSBAND/WIFE' },
    { id: 'd3',  line1: 'LOOKING FOR MY REASON TO DELETE HINGE' },
    { id: 'd4',  line1: 'LOOKING FOR MY PLAYER 2' },
    { id: 'd5',  line1: 'LOOKING FOR MY BUTTER HALF' },
    { id: 'd6',  line1: 'LOOKING FOR MY NEXT SITUATIONSHIP' },
    { id: 'd7',  line1: 'LOOKING TO SPLIT RENT' },
    { id: 'd8',  line1: 'LOOKING FOR MY PASSENGER PRINCESS' },
    { id: 'd9',  line1: 'LOOKING FOR MY RAVE BAE' },
    { id: 'd10', line1: "SCAN THIS IF I'M YOUR TYPE :)" },
    { id: 'd11', line1: 'Looking for my lobster' },
    { id: 'd12', line1: 'Looking for someone to send memes to' },
    { id: 'd13', line1: 'Looking for my emergency contact' },
    { id: 'd14', line1: 'Looking for someone to steal my fries' },
    { id: 'd15', line1: 'Looking for someone to match my freak' },
    { id: 'd16', line1: 'Looking for my co-star' },
    { id: 'd17', line1: 'Looking for someone to survive Costco with' },
    { id: 'd18', line1: 'Looking for my plus one' },
    { id: 'd19', line1: 'Looking for someone to yap with' },
    // Parents subcategory
    { id: 'dp1', line1: 'LOOKING FOR MY SONS',    line2: 'FUTURE WIFE/HUSBAND',          sub: 'parents' },
    { id: 'dp2', line1: 'LOOKING FOR MY DAUGHTERS', line2: 'FUTURE HUSBAND/WIFE',         sub: 'parents' },
    { id: 'dp3', line1: 'LOOKING FOR MY FUTURE',  line2: 'DAUGHTER-IN-LAW/SON-IN-LAW',   sub: 'parents' },
    { id: 'dp4', line1: 'MY DAUGHTER/SON/KID IS STILL SINGLE',                             sub: 'parents' },
  ],
  friends: [
    { id: 'f1', line1: 'LOOKING FOR EXTROVERTS', line2: 'TO ADOPT ME' },
    { id: 'f2', line1: 'LOOKING FOR NEW BESTEAS' },
    { id: 'f3', line1: 'Looking for concert buddies' },
    { id: 'f4', line1: 'Looking for yap sessions' },
    { id: 'f5', line1: 'Looking for gym friends' },
    { id: 'f6', line1: 'Looking for travel buddies' },
  ],
  networking: [
    { id: 'n1', line1: 'LOOKING FOR A NEW JOB' },
    { id: 'n2', line1: 'LOOKING FOR AN INTERNSHIP' },
    { id: 'n3', line1: 'Looking for my next corporate adventure' },
    { id: 'n4', line1: 'Looking for someone to explain crypto to me' },
    { id: 'n5', line1: 'Looking for a tech job' },
    { id: 'n6', line1: 'Looking for a career plot twist' },
    { id: 'n7', line1: 'Looking for investors' },
    { id: 'n8', line1: 'Looking for my cofounder' },
  ],
};

// Match UPPERCASED-WORD/WORD/... (2 or more slash-separated uppercase words, hyphenated ok)
const CHOICE_RE = /([A-Z][A-Z\-]+(?:\/[A-Z][A-Z\-]+)+)/;

type Segment =
  | { type: 'literal'; text: string }
  | { type: 'choice'; options: string[]; defaultValue: string };

function parseSegments(text: string): Segment[] {
  return text.split(CHOICE_RE).map((part) => {
    if (CHOICE_RE.test(part)) {
      const halves = part.split('/');
      // options: each half, then combined — preserve original casing so resolved phrase stays consistent
      const opts = [...halves, part];
      return { type: 'choice', options: opts, defaultValue: part };
    }
    return { type: 'literal', text: part };
  });
}

function collectSlotKeys(phrase: Phrase): { key: string; options: string[]; defaultValue: string }[] {
  const slots: { key: string; options: string[]; defaultValue: string }[] = [];
  let idx = 0;
  for (const line of [phrase.line1, phrase.line2].filter(Boolean) as string[]) {
    for (const seg of parseSegments(line)) {
      if (seg.type === 'choice') {
        slots.push({ key: `${phrase.id}_${idx++}`, options: seg.options, defaultValue: seg.defaultValue });
      }
    }
  }
  return slots;
}

function resolveLine(phraseId: string, line: string, startIdx: number, choices: Record<string, string>): { text: string; nextIdx: number } {
  let idx = startIdx;
  const text = parseSegments(line).map((seg) => {
    if (seg.type === 'choice') {
      const key = `${phraseId}_${idx++}`;
      return choices[key] ?? seg.defaultValue;
    }
    return seg.text;
  }).join('');
  return { text, nextIdx: idx };
}

function resolvePhrase(phrase: Phrase, choices: Record<string, string>): string {
  const { text: line1, nextIdx } = resolveLine(phrase.id, phrase.line1, 0, choices);
  if (phrase.line2) {
    const { text: line2 } = resolveLine(phrase.id, phrase.line2, nextIdx, choices);
    return `${line1}\n${line2}`;
  }
  return line1;
}

// Render a phrase card label (choice parts shown as X/Y without dropdowns)
function PhraseCardLabel({ phrase }: { phrase: Phrase }) {
  return (
    <span>
      {phrase.line1}
      {phrase.line2 && <><br /><span style={{ opacity: 0.85 }}>{phrase.line2}</span></>}
    </span>
  );
}

interface Props {
  templateId: string;
  onChange: (text: string) => void;
}

export default function BagTextSelector({ templateId, onChange }: Props) {
  const defaultCat: Category =
    templateId === 'friends' ? 'friends'
    : templateId === 'networking' ? 'networking'
    : 'dating';

  const [category, setCategory] = useState<Category>(defaultCat);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, string>>({});

  // Reset when template changes
  useEffect(() => {
    setCategory(defaultCat);
    setSelectedId(null);
    setChoices({});
    onChange('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  const selectPhrase = (phrase: Phrase) => {
    if (selectedId === phrase.id) {
      // Deselect
      setSelectedId(null);
      setChoices({});
      onChange('');
      return;
    }
    setSelectedId(phrase.id);
    // Initialise choices to defaults
    const initChoices: Record<string, string> = {};
    collectSlotKeys(phrase).forEach(({ key, defaultValue }) => {
      initChoices[key] = defaultValue;
    });
    setChoices(initChoices);
    onChange(resolvePhrase(phrase, initChoices));
  };

  const handleChoiceChange = (key: string, value: string, phrase: Phrase) => {
    const next = { ...choices, [key]: value };
    setChoices(next);
    onChange(resolvePhrase(phrase, next));
  };

  const phrases = PHRASES[category];
  const general = phrases.filter((p) => !p.sub);
  const parents = phrases.filter((p) => p.sub === 'parents');
  const selectedPhrase = phrases.find((p) => p.id === selectedId) ?? null;

  return (
    <div className="bag-text-selector">
      {/* Category tabs */}
      <div className="bag-text-tabs">
        {(['dating', 'friends', 'networking'] as Category[]).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`bag-text-tab${category === cat ? ' active' : ''}`}
            onClick={() => { setCategory(cat); setSelectedId(null); setChoices({}); onChange(''); }}
          >
            {cat === 'dating' ? '💕 Dating' : cat === 'friends' ? '👯 Friends' : '🤝 Networking'}
          </button>
        ))}
      </div>

      {/* Phrase list */}
      <div className="bag-text-phrase-list">
        {general.map((phrase) => (
          <PhraseButton
            key={phrase.id}
            phrase={phrase}
            selected={selectedId === phrase.id}
            choices={choices}
            onSelect={() => selectPhrase(phrase)}
            onChoiceChange={(key, val) => handleChoiceChange(key, val, phrase)}
          />
        ))}

        {parents.length > 0 && (
          <>
            <div className="bag-text-sub-divider">👨‍👩‍👧 For parents</div>
            {parents.map((phrase) => (
              <PhraseButton
                key={phrase.id}
                phrase={phrase}
                selected={selectedId === phrase.id}
                choices={choices}
                onSelect={() => selectPhrase(phrase)}
                onChoiceChange={(key, val) => handleChoiceChange(key, val, phrase)}
              />
            ))}
          </>
        )}
      </div>

      {/* Resolved preview */}
      {selectedPhrase && (
        <div className="bag-text-preview">
          <span className="bag-text-preview-label">Preview</span>
          <div className="bag-text-preview-text">
            {resolvePhrase(selectedPhrase, choices).split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PhraseButton({
  phrase,
  selected,
  choices,
  onSelect,
  onChoiceChange,
}: {
  phrase: Phrase;
  selected: boolean;
  choices: Record<string, string>;
  onSelect: () => void;
  onChoiceChange: (key: string, value: string) => void;
}) {
  const slots = collectSlotKeys(phrase);

  return (
    <div className={`bag-text-phrase${selected ? ' selected' : ''}`}>
      <button type="button" className="bag-text-phrase-btn" onClick={onSelect}>
        <PhraseCardLabel phrase={phrase} />
        {selected && <span className="bag-text-check">✓</span>}
      </button>

      {selected && slots.length > 0 && (
        <div className="bag-text-choices">
          {slots.map(({ key, options }) => (
            <div key={key} className="bag-text-choice-row">
              <select
                className="bag-text-choice-select"
                value={choices[key] ?? options[options.length - 1]}
                onChange={(e) => onChoiceChange(key, e.target.value)}
              >
                {options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
