'use client';

import { useEffect, useState } from 'react';

export type Category = 'dating' | 'friends' | 'networking';

interface Phrase {
  id: string;
  line1: string;
  line2?: string;
  sub?: 'bestie' | 'parents' | 'pets' | 'grads';
}

const PHRASES: Record<Category, Phrase[]> = {
  dating: [
    { id: 'd1',  line1: 'LOOKING FOR MY',        line2: 'FUTURE BOYFRIEND/GIRLFRIEND' },
    { id: 'd2',  line1: 'LOOKING FOR MY',        line2: 'FUTURE HUSBAND/WIFE' },
    { id: 'd3',  line1: 'LOOKING FOR MY',        line2: 'REASON TO DELETE HINGE' },
    { id: 'd4',  line1: 'LOOKING FOR MY',        line2: 'PLAYER 2' },
    { id: 'd5',  line1: 'LOOKING FOR MY',        line2: 'BUTTER HALF' },
    { id: 'd6',  line1: 'LOOKING FOR MY',        line2: 'NEXT SITUATIONSHIP' },
    { id: 'd7',  line1: 'LOOKING TO',            line2: 'SPLIT RENT' },
    { id: 'd8',  line1: 'LOOKING FOR MY',        line2: 'PASSENGER PRINCESS' },
    { id: 'd9',  line1: 'LOOKING FOR MY',        line2: 'RAVE BAE' },
    { id: 'd10', line1: "SCAN THIS IF",          line2: "I'M YOUR TYPE :)" },
    { id: 'd11', line1: 'LOOKING FOR MY', line2: 'LOBSTER' },
    { id: 'd12', line1: 'LOOKING FOR', line2: 'SOMEONE TO SEND MEMES TO' },
    { id: 'd13', line1: 'LOOKING FOR MY', line2: 'EMERGENCY CONTACT' },
    { id: 'd14', line1: 'LOOKING FOR', line2: 'SOMEONE TO STEAL MY FRIES' },
    { id: 'd15', line1: 'LOOKING FOR', line2: 'SOMEONE TO MATCH MY FREAK' },
    { id: 'd16', line1: 'LOOKING FOR MY', line2: 'CO-STAR' },
    { id: 'd17', line1: 'LOOKING FOR', line2: 'SOMEONE TO SURVIVE COSTCO WITH' },
    { id: 'd18', line1: 'LOOKING FOR MY', line2: 'PLUS ONE' },
    { id: 'd19', line1: 'LOOKING FOR', line2: 'SOMEONE TO YAP WITH' },
    { id: 'd20', line1: 'SAVE ME FROM',              line2: 'THIRD WHEELING' },
    { id: 'd21', line1: 'SAVE ME FROM',              line2: 'MY SITUATIONSHIP' },
    { id: 'd22', line1: 'ACCEPTING APPLICATIONS',    line2: 'TO BE MY NEW CRUSH' },
    { id: 'd23', line1: 'LOOKING FOR MY',            line2: 'PRINCE CHARMING' },
    { id: 'd24', line1: 'LOOKING FOR MY',            line2: 'HAPPILY EVER AFTER' },
    // Bestie subcategory
    { id: 'db1',  line1: 'MY BESTIE/HOMIE/BFF/FRIEND IS STILL SINGLE',                              sub: 'bestie' },
    { id: 'db2',  line1: 'MY BESTIE/HOMIE/BFF/FRIEND', line2: 'IS HOT AND SINGLE',                  sub: 'bestie' },
    { id: 'db3',  line1: 'MY BEST FRIEND', line2: 'IS STILL SINGLE',                                         sub: 'bestie' },
    { id: 'db4',  line1: 'GET MY BESTIE/HOMIE/BFF/FRIEND OFF HINGE',                                 sub: 'bestie' },
    { id: 'db5',  line1: 'SOMEONE DATE MY BESTIE/HOMIE/BFF/FRIEND',                                  sub: 'bestie' },
    { id: 'db6',  line1: 'MY BESTIE/HOMIE/BFF/FRIEND',  line2: 'IS ACCEPTING APPLICATIONS',          sub: 'bestie' },
    { id: 'db7',  line1: "HIRING: MY BESTIE/HOMIE/BFF/FRIEND'S PARTNER",                             sub: 'bestie' },
    { id: 'db8',  line1: 'MY BESTIE/HOMIE/BFF/FRIEND',  line2: 'HAS BEEN ON HINGE TOO LONG',         sub: 'bestie' },
    { id: 'db9',  line1: 'SWIPE RIGHT ON MY', line2: 'BESTIE/HOMIE/BFF/FRIEND',                              sub: 'bestie' },
    { id: 'db10', line1: "I'M HER/HIS/THEIR IRL HINGE PROFILE",                                      sub: 'bestie' },
    { id: 'db11', line1: 'MATCH WITH MY BESTIE/HOMIE/BFF/FRIEND',                                    sub: 'bestie' },
    { id: 'db12', line1: 'HELP MY BESTIE/HOMIE/BFF/FRIEND', line2: 'FIND HER/HIS/THEIR PERSON',      sub: 'bestie' },
    { id: 'db13', line1: 'TAKE MY BESTIE/HOMIE/BFF/FRIEND', line2: 'OFF THE MARKET',                         sub: 'bestie' },
    { id: 'db14', line1: 'ASK ME ABOUT MY SINGLE BESTIE/HOMIE/BFF/FRIEND',                           sub: 'bestie' },
    // Parents subcategory
    { id: 'dp1', line1: 'LOOKING FOR MY SONS',    line2: 'FUTURE WIFE/HUSBAND',          sub: 'parents' },
    { id: 'dp2', line1: 'LOOKING FOR MY DAUGHTERS', line2: 'FUTURE HUSBAND/WIFE',         sub: 'parents' },
    { id: 'dp3', line1: 'LOOKING FOR MY FUTURE',  line2: 'DAUGHTER-IN-LAW/SON-IN-LAW',   sub: 'parents' },
    { id: 'dp4', line1: 'MY DAUGHTER/SON/KID', line2: 'IS STILL SINGLE',                           sub: 'parents' },
    // Pet owners subcategory
    { id: 'dpet1', line1: "LOOKING FOR MY CAT'S", line2: 'FUTURE MOM/DAD/CO-PARENT', sub: 'pets' },
    { id: 'dpet2', line1: "LOOKING FOR MY DOG'S", line2: 'FUTURE MOM/DAD/CO-PARENT', sub: 'pets' },
    { id: 'dpet3', line1: "LOOKING FOR MY PET'S", line2: 'FUTURE MOM/DAD/CO-PARENT', sub: 'pets' },
  ],
  friends: [
    { id: 'f1', line1: 'LOOKING FOR EXTROVERTS', line2: 'TO ADOPT ME' },
    { id: 'f2', line1: 'LOOKING FOR',            line2: 'NEW BESTIES/BESTEAS' },
    { id: 'f3', line1: 'LOOKING FOR', line2: 'CONCERT BUDDIES' },
    { id: 'f4', line1: 'LOOKING FOR', line2: 'YAP SESSIONS' },
    { id: 'f5', line1: 'LOOKING FOR', line2: 'GYM FRIENDS' },
    { id: 'f6', line1: 'LOOKING FOR', line2: 'TRAVEL BUDDIES' },
    { id: 'f7',  line1: 'YOUR FUTURE BESTIE?' },
    { id: 'f8',  line1: 'FRIENDS WANTED ♡' },
    { id: 'f9',  line1: 'OPEN TO NEW FRIENDSHIPS' },
    { id: 'f10', line1: "LET'S BE FRIENDS!" },
    { id: 'f11', line1: 'STRANGERS TODAY, BESTIES TOMORROW' },
    { id: 'f12', line1: 'HERE FOR THE FRIENDSHIP' },
    { id: 'f13', line1: 'MANIFESTING MY', line2: 'FRIEND GROUP ✨' },
    { id: 'f14', line1: 'IN MY FRIENDSHIP ERA' },
    { id: 'f15', line1: 'NEW IN TOWN. SEND HELP' },
    { id: 'f16', line1: 'ACCEPTING BESTIE', line2: 'APPLICATIONS' },
    { id: 'f17', line1: 'LOCAL FRIENDS WANTED' },
    { id: 'f18', line1: 'LOOKING FOR', line2: 'A TOUR GUIDE (AND A BESTIE)' },
    { id: 'f19', line1: 'NEW TO TOWN, OPEN TO PLANS' },
    { id: 'f20', line1: 'LOOKING FOR', line2: 'NEW FRIENDS' },
    { id: 'f21', line1: 'ACCEPTING BEST FRIEND', line2: 'APPLICATIONS' },
    { id: 'f22', line1: 'LOOKING FOR SOMEONE TO', line2: 'ROT IN CAFÉS WITH' },
    { id: 'f23', line1: 'LOOKING FOR FRIENDS WHO SAY YES', line2: 'TO SPONTANEOUS SUSHI' },
  ],
  networking: [
    { id: 'n1', line1: 'LOOKING FOR',   line2: 'A NEW JOB' },
    { id: 'n2', line1: 'LOOKING FOR',   line2: 'AN INTERNSHIP' },
    { id: 'n3', line1: 'LOOKING FOR MY', line2: 'NEXT CORPORATE ADVENTURE' },
    { id: 'n4', line1: 'LOOKING FOR SOMEONE', line2: 'TO EXPLAIN CRYPTO TO ME' },
    { id: 'n5', line1: 'LOOKING FOR', line2: 'A TECH JOB' },
    { id: 'n6', line1: 'LOOKING FOR', line2: 'A CAREER PLOT TWIST' },
    { id: 'n7', line1: 'LOOKING FOR', line2: 'INVESTORS' },
    { id: 'n8', line1: 'LOOKING FOR MY', line2: 'CO-FOUNDER' },
    { id: 'n9',  line1: 'HIRE ME, MAYBE?' },
    { id: 'n10', line1: 'LOOKING FOR MY', line2: 'NEXT JOB' },
    { id: 'n11', line1: 'LOOKING FOR MY', line2: 'NEXT INTERNSHIP' },
    { id: 'n12', line1: 'LOOKING FOR', line2: 'NEW CORPORATE OPPORTUNITIES' },
    { id: 'n13', line1: 'OPEN TO NETWORKING' },
    { id: 'n14', line1: 'OPEN TO NEW', line2: 'PROFESSIONAL OPPORTUNITIES' },
    { id: 'n15', line1: 'YOUR NEXT POTENTIAL HIRE' },
    { id: 'n16', line1: 'FUTURE COLLEAGUE?' },
    { id: 'n17', line1: 'MY LINKEDIN IS UP TO DATE' },
    { id: 'n18', line1: 'CORPORATE BADDIE FOR HIRE' },
    { id: 'n19', line1: 'LOOKING FOR A SWE INTERNSHIP', line2: 'BEFORE I LOSE MY MIND' },
    // New grads subcategory
    { id: 'ng1', line1: 'DEGREE IN HAND,', line2: 'READY TO MAKE WAVES', sub: 'grads' },
    { id: 'ng2', line1: 'A DEGREE AND A DREAM', sub: 'grads' },
    { id: 'ng3', line1: 'FRESHLY GRADUATED,', line2: 'READY TO DOMINATE', sub: 'grads' },
    { id: 'ng4', line1: 'HIRE ME BEFORE', line2: 'I FORGET EVERYTHING', sub: 'grads' },
    { id: 'ng5', line1: 'EDUCATED & EMPLOYABLE', sub: 'grads' },
    { id: 'ng6', line1: 'MY DEGREE NEEDS A PLUS-ONE', line2: '(A JOB)', sub: 'grads' },
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

// Defaults for the homepage sample bags: male partner, her (the bestie), daughter (so son-in-law), bestie
const SAMPLE_PREFERRED = ['BOYFRIEND', 'HUSBAND', 'HER', 'SON-IN-LAW', 'DAUGHTER', 'DAD', 'BESTIE', 'BESTIES'];
// Phrases left out of the homepage sample rotation (still selectable when ordering)
const SAMPLE_SKIP = ['d8'];

// Every phrase in a category, with each X/Y choice resolved to a single sample value
export function sampleBagTexts(category: Category): string[] {
  return PHRASES[category].filter((phrase) => !SAMPLE_SKIP.includes(phrase.id)).map((phrase) =>
    ([phrase.line1, phrase.line2].filter(Boolean) as string[])
      .map((line) => parseSegments(line).map((seg) => {
        if (seg.type === 'literal') return seg.text;
        const halves = seg.options.slice(0, -1);
        return halves.find((o) => SAMPLE_PREFERRED.includes(o)) ?? halves[0];
      }).join(''))
      .join('\n'),
  );
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
  const bestie  = phrases.filter((p) => p.sub === 'bestie');
  const parents = phrases.filter((p) => p.sub === 'parents');
  const pets    = phrases.filter((p) => p.sub === 'pets');
  const grads   = phrases.filter((p) => p.sub === 'grads');
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

        {bestie.length > 0 && (
          <>
            <div className="bag-text-sub-divider">🫂 For your bestie</div>
            {bestie.map((phrase) => (
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

        {pets.length > 0 && (
          <>
            <div className="bag-text-sub-divider">🐾 For pet owners</div>
            {pets.map((phrase) => (
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

        {grads.length > 0 && (
          <>
            <div className="bag-text-sub-divider">🎓 For new grads</div>
            {grads.map((phrase) => (
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
