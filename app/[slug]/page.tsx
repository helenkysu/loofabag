'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import DropZone from '@/app/components/DropZone';
import { Turnstile } from '@marsidev/react-turnstile';

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
  template: string;
  isActive?: boolean;
  fields?: FormField[];
  profileFields?: FormField[];
  profileData?: Record<string, string>;
  questions?: string[];
}


export default function LoofahPage() {
  const { slug: slugParam } = useParams<{ slug: string }>();
  const [activeTab, setActiveTab] = useState<'profile' | 'submissions'>('profile');
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File[]>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportDone, setReportDone] = useState(false);

  useEffect(() => {
    if (!slugParam) return;
    fetch(`/api/loofas/by-slug?slug=${encodeURIComponent(slugParam)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.loofa) {
          setLoofa(data.loofa);
          setIsActive(data.loofa.isActive ?? true);
        }
      })
      .catch(console.error);
  }, [slugParam]);

  // Profile tab: owner's filled-in info
  const profileFields: FormField[] =
    loofa?.profileFields ??
    loofa?.fields ??
    (loofa?.questions ?? []).map((q, i) => ({
      id: `q${i}`, type: 'paragraph' as const, label: q, optional: false,
    }));

  // Submissions tab: form visitors fill in.
  // If profileFields exists the loofa was created with the new wizard,
  // so fields is the submission form. Otherwise fields is old profile data — ignore it.
  const submissionFields: FormField[] = loofa?.profileFields
    ? (loofa.fields ?? [])
    : (loofa?.questions ?? []).map((q, i) => ({
        id: `q${i}`, type: 'paragraph' as const, label: q, optional: false,
      }));

  const handleInputChange = (fieldId: string, value: string) =>
    setFormData((prev) => ({ ...prev, [fieldId]: value }));

  const handlePhotoChange = (fieldId: string, files: File[]) =>
    setPhotoFiles((prev) => ({ ...prev, [fieldId]: files }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const uploadedPaths: string[] = [];

    if (loofa?.id) {
      await Promise.all(
        submissionFields
          .filter((f) => (f.type === 'photo' || f.type === 'file') && photoFiles[f.id]?.length)
          .map(async (f) => {
            const fd = new FormData();
            fd.append('loofa_id', loofa.id);
            fd.append('type', f.type === 'photo' ? 'photos' : 'files');
            photoFiles[f.id].forEach((file) => fd.append('files', file));
            const res = await fetch('/api/upload/files', { method: 'POST', body: fd });
            const data = await res.json();
            if (data.paths) uploadedPaths.push(...data.paths);
          }),
      ).catch(console.error);
    }

    const responses: Record<string, string> = {};
    submissionFields.forEach((f) => {
      if (formData[f.id] != null) responses[f.label] = formData[f.id];
    });

    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: slugParam, responses, file_paths: uploadedPaths, captchaToken }),
    }).catch(console.error);

    setSubmitting(false);
    setSubmitted(true);
  };

  const displayName = loofa?.name ?? slugParam;
  const displayEmoji = loofa?.emoji ?? '👜';

  // Find the owner's name from their profile data (first field labeled "name" or "nickname")
  const ownerNameField = loofa?.profileFields?.find((f) => /name/i.test(f.label));
  const ownerName = (ownerNameField ? loofa?.profileData?.[ownerNameField.id] : null) || displayName;

  return (
    <main>
      <NavBar />

      <section className="loofa-page-section">
        <div className="loofa-page-container">

          <div className="loofa-profile-header">
            <span className="loofa-profile-emoji">{displayEmoji}</span>
            <h1 className="loofa-profile-name">{displayName}</h1>
          </div>

          <div className="loofa-tabs">
            <button
              className={`loofa-tab${activeTab === 'profile' ? ' active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >Profile</button>
            <button
              className={`loofa-tab${activeTab === 'submissions' ? ' active' : ''}`}
              onClick={() => setActiveTab('submissions')}
            >Connect</button>
          </div>

          {activeTab === 'profile' && (
            <div className="loofa-tab-content">
              {!isActive && (
                <div className="inactive-banner">
                  This loofa is not currently accepting new submissions.
                </div>
              )}
              {profileFields.length === 0 ? (
                <p style={{ color: '#aaa', fontSize: 14 }}>No profile info yet.</p>
              ) : (
                <div className="profile-fields">
                  {profileFields.map((field) => {
                    const raw = loofa?.profileData?.[field.id];

                    if (field.type === 'photo') {
                      let paths: string[] = [];
                      try { paths = raw ? JSON.parse(raw) : []; } catch { paths = []; }
                      return (
                        <div key={field.id} className="profile-field-row profile-field-col">
                          <span className="profile-field-label">{field.label}</span>
                          {paths.length > 0 ? (
                            <div className="profile-photo-grid">
                              {paths.map((path) => (
                                <img
                                  key={path}
                                  src={`/api/files/proxy?path=${encodeURIComponent(path)}`}
                                  alt={field.label}
                                  className="profile-photo-thumb"
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="profile-field-value profile-field-blank">—</span>
                          )}
                        </div>
                      );
                    }

                    if (field.type === 'video') {
                      let paths: string[] = [];
                      try { paths = raw ? JSON.parse(raw) : []; } catch { paths = []; }
                      return (
                        <div key={field.id} className="profile-field-row profile-field-col">
                          <span className="profile-field-label">{field.label}</span>
                          {paths.length > 0 ? (
                            <div className="profile-video-grid">
                              {paths.map((path) => (
                                <video
                                  key={path}
                                  src={`/api/files/proxy?path=${encodeURIComponent(path)}`}
                                  controls
                                  className="profile-video-thumb"
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="profile-field-value profile-field-blank">—</span>
                          )}
                        </div>
                      );
                    }

                    if (field.type === 'file') {
                      let paths: string[] = [];
                      try { paths = raw ? JSON.parse(raw) : []; } catch { paths = []; }
                      return (
                        <div key={field.id} className="profile-field-row profile-field-col">
                          <span className="profile-field-label">{field.label}</span>
                          {paths.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {paths.map((path) => (
                                <a
                                  key={path}
                                  href={`/api/files/proxy?path=${encodeURIComponent(path)}`}
                                  className="profile-field-link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {path.split('/').pop()}
                                </a>
                              ))}
                            </div>
                          ) : (
                            <span className="profile-field-value profile-field-blank">—</span>
                          )}
                        </div>
                      );
                    }

                    return (
                      <div key={field.id} className="profile-field-row">
                        <span className="profile-field-label">{field.label}</span>
                        {field.type === 'url' && raw ? (
                          <a href={raw} className="profile-field-value profile-field-link" target="_blank" rel="noopener noreferrer">
                            {raw}
                          </a>
                        ) : (
                          <span className={`profile-field-value${!raw ? ' profile-field-blank' : ''}`}>
                            {raw || '—'}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="loofa-tab-content">
              {!isActive ? (
                <div className="inactive-banner">
                  This loofa is not currently accepting new submissions.
                </div>
              ) : submitted ? (
                <div className="success-message">
                  <div className="success-icon">✓</div>
                  <h2>Sent!</h2>
                  <p>Your info has been submitted to {ownerName}.</p>
                </div>
              ) : (
                <form className="loofa-inline-form" onSubmit={handleSubmit}>
                  <p className="loofa-form-intro">Connect with {displayName}</p>

                  {submissionFields.length === 0 && (
                    <p style={{ color: '#aaa', fontSize: 14 }}>No fields configured yet.</p>
                  )}

                  {submissionFields.map((field) => (
                    <div key={field.id} className="form-group">
                      <label>
                        {field.label}
                        {field.optional && <span className="form-optional">optional</span>}
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
                          placeholder="Your answer…"
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
                          accept="image/*,.heic,.HEIC,.heif,.HEIF"
                          multiple
                          maxFiles={5}
                          maxSizeMB={5}
                          onFiles={(files) => handlePhotoChange(field.id, files)}
                        />
                      )}
                      {field.type === 'file' && (
                        <DropZone
                          accept=".pdf,.docx"
                          maxFiles={1}
                          maxSizeMB={5}
                          onFiles={(files) => handlePhotoChange(field.id, files)}
                        />
                      )}
                    </div>
                  ))}

                  {submissionFields.length > 0 && (
                    <>
                      <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '1x00000000000000000000AA'}
                        onSuccess={(token) => setCaptchaToken(token)}
                        onExpire={() => setCaptchaToken(null)}
                        onError={() => setCaptchaToken(null)}
                        options={{ theme: 'light', size: 'normal' }}
                      />
                      <button type="submit" className="btn btn-primary loofa-submit-btn" disabled={submitting || !captchaToken}>
                        {submitting ? 'Submitting…' : 'Submit'}
                      </button>
                    </>
                  )}
                </form>
              )}

            </div>
          )}

          {/* Report link */}
          <div className="report-link-row">
            <button className="report-link" onClick={() => { setReportOpen(true); setReportDone(false); setReportReason(''); }}>
              Report this loofa
            </button>
          </div>

        </div>
      </section>

      {/* Report modal */}
      {reportOpen && (
        <div className="report-modal-backdrop" onClick={() => setReportOpen(false)}>
          <div className="report-modal" onClick={(e) => e.stopPropagation()}>
            {reportDone ? (
              <div className="report-modal-done">
                <div className="report-done-icon">✓</div>
                <h2 className="report-modal-title">Report Received</h2>
                <p className="report-modal-body">
                  We have received your report and will review this loofa for guideline violations. Thank you for helping us maintain a safe and respectful community.
                </p>
                <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={() => setReportOpen(false)}>Close</button>
              </div>
            ) : (
              <>
                <button className="report-modal-close" onClick={() => setReportOpen(false)} aria-label="Close">×</button>
                <h2 className="report-modal-title">Report This Loofa</h2>
                <p className="report-modal-body">
                  If this loofa contains inappropriate content or violates our community guidelines, please let us know. All reports are reviewed by our team.
                </p>
                <div className="report-form-group">
                  <label className="report-label">Reason for reporting</label>
                  <textarea
                    className="report-textarea"
                    placeholder="Please describe the issue in as much detail as possible…"
                    rows={4}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                  />
                </div>
                <p className="report-community-note">
                  Thank you for helping us keep the Loofabag community safe and welcoming for everyone.
                </p>
                <div className="report-modal-footer">
                  <button className="btn btn-secondary" onClick={() => setReportOpen(false)}>Cancel</button>
                  <button
                    className="btn report-submit-btn"
                    disabled={!reportReason.trim() || reportSubmitting}
                    onClick={async () => {
                      setReportSubmitting(true);
                      await fetch('/api/report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ slug: slugParam, reason: reportReason.trim() }),
                      }).catch(() => {});
                      setReportSubmitting(false);
                      setReportDone(true);
                    }}
                  >
                    {reportSubmitting ? 'Submitting…' : 'Submit Report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
