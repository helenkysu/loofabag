'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';
import PhotoGallery from '@/app/components/PhotoGallery';

interface Loofa {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  qrToken?: string;
}

interface Submission {
  id: string;
  submitted_at: string;
  responses: Record<string, string>;
  file_paths: string[];
}

interface RecentScan {
  scanned_at: string;
  user_agent: string | null;
  ip_address: string | null;
  country: string | null;
  city: string | null;
}

interface Analytics {
  total: number;
  today: number;
  week: number;
  month: number;
  year: number;
  dailyCounts: { date: string; count: number }[];
  hourly: number[];
  weekday: number[];
  recentScans: RecentScan[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function formatShortDate(iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Unknown', browser: 'Unknown' };
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(ua);
  const isTablet = /ipad|tablet/i.test(ua);
  const device = isTablet ? 'Tablet' : isMobile ? 'Mobile' : 'Desktop';

  let browser = 'Other';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome\/[0-9]/i.test(ua) && !/chromium/i.test(ua)) browser = 'Chrome';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opr\//i.test(ua)) browser = 'Opera';

  return { device, browser };
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_LABELS = ['12a','1a','2a','3a','4a','5a','6a','7a','8a','9a','10a','11a','12p','1p','2p','3p','4p','5p','6p','7p','8p','9p','10p','11p'];

type SortOrder = 'newest' | 'oldest';
type DateFilter = 'all' | '3days' | 'week' | 'month' | 'year';

const DATE_FILTER_DAYS: Record<DateFilter, number | null> = {
  all: null,
  '3days': 3,
  week: 7,
  month: 30,
  year: 365,
};

export default function SubmissionsPage() {
  const { id } = useParams<{ id: string }>();
  const [loofa, setLoofa] = useState<Loofa | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [flaggedCount, setFlaggedCount] = useState(0);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<'submissions' | 'analytics'>('submissions');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    fetch(`/api/loofas/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) { setNotFound(true); return; }
        setLoofa(data.loofa);
        return fetch(`/api/submissions?slug=${encodeURIComponent(data.loofa.slug)}`);
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) {
          setSubmissions(data.submissions ?? []);
          setFlaggedCount(data.flagged_count ?? 0);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (tab !== 'analytics' || !loofa?.qrToken || analytics) return;
    setAnalyticsLoading(true);
    fetch(`/api/analytics/qr-scans?token=${encodeURIComponent(loofa.qrToken)}`)
      .then((r) => r.json())
      .then((data) => setAnalytics(data))
      .catch(console.error)
      .finally(() => setAnalyticsLoading(false));
  }, [tab, loofa, analytics]);

  const confirmAndDelete = (ids: string[]) => setConfirmIds(ids);

  const handleDelete = async () => {
    if (!confirmIds?.length) return;
    setDeleting(true);
    await Promise.all(
      confirmIds.map((id) => fetch(`/api/submissions?id=${encodeURIComponent(id)}`, { method: 'DELETE' })),
    );
    setSubmissions((prev) => prev.filter((s) => !confirmIds.includes(s.id)));
    setSelected((prev) => { const n = new Set(prev); confirmIds.forEach((id) => n.delete(id)); return n; });
    setDeleting(false);
    setConfirmIds(null);
  };

  const toggleSelect = (subId: string) =>
    setSelected((prev) => { const n = new Set(prev); n.has(subId) ? n.delete(subId) : n.add(subId); return n; });

  const filteredSubmissions = submissions
    .filter((s) => {
      const days = DATE_FILTER_DAYS[dateFilter];
      if (days == null) return true;
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
      return new Date(s.submitted_at).getTime() >= cutoff;
    })
    .sort((a, b) => {
      const diff = new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });

  const allSelected = filteredSubmissions.length > 0 && filteredSubmissions.every((s) => selected.has(s.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(filteredSubmissions.map((s) => s.id)));

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

  const maxDaily = analytics ? Math.max(...analytics.dailyCounts.map((d) => d.count), 1) : 1;
  const maxHourly = analytics ? Math.max(...analytics.hourly, 1) : 1;

  return (
    <main>
      <NavBar />
      <section className="my-loofas-section">
        <div className="my-loofas-container">
          <Link href={`/my-loofas/${id}`} className="back-link">← Back</Link>

          {loofa && (
            <p className="step-subtitle" style={{ marginBottom: 8 }}>
              {loofa.emoji} {loofa.name} · loofabag.com/{loofa.slug}
            </p>
          )}

          <div className="analytics-tabs">
            <button
              type="button"
              className={`analytics-tab${tab === 'submissions' ? ' analytics-tab-active' : ''}`}
              onClick={() => setTab('submissions')}
            >
              Submissions
              {submissions.length > 0 && (
                <span className="analytics-tab-badge">{submissions.length}</span>
              )}
            </button>
            <button
              type="button"
              className={`analytics-tab${tab === 'analytics' ? ' analytics-tab-active' : ''}`}
              onClick={() => setTab('analytics')}
            >
              QR Analytics
            </button>
          </div>

          {/* Submissions tab */}
          {tab === 'submissions' && (
            <>
              {loading ? (
                <p className="submissions-empty">Loading…</p>
              ) : submissions.length === 0 && flaggedCount === 0 ? (
                <p className="submissions-empty">No submissions yet.</p>
              ) : submissions.length === 0 ? (
                <div>
                  <p className="submissions-empty">No submissions yet.</p>
                  {flaggedCount > 0 && (
                    <span className="flagged-count-badge" title="Submissions hidden due to policy violations">
                      {flaggedCount} flagged
                    </span>
                  )}
                </div>
              ) : (
                <div className="submissions-list">
                  <div className="submissions-filters">
                    <select
                      className="field-type-select"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value as DateFilter)}
                    >
                      <option value="all">All time</option>
                      <option value="3days">Last 3 days</option>
                      <option value="week">Last week</option>
                      <option value="month">Last month</option>
                      <option value="year">Last year</option>
                    </select>
                    <select
                      className="field-type-select"
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                    >
                      <option value="newest">Newest first</option>
                      <option value="oldest">Oldest first</option>
                    </select>
                  </div>
                  <div className="submissions-toolbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <label className="submission-select-all">
                        <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                        <span>Select all</span>
                      </label>
                      <p className="question-editor-label" style={{ margin: 0 }}>
                        {filteredSubmissions.length} response{filteredSubmissions.length !== 1 ? 's' : ''}
                      </p>
                      {flaggedCount > 0 && (
                        <span className="flagged-count-badge" title="Submissions hidden due to policy violations">
                          {flaggedCount} flagged
                        </span>
                      )}
                    </div>
                    {selected.size > 0 && (
                      <button
                        className="btn submission-bulk-delete-btn"
                        onClick={() => confirmAndDelete([...selected])}
                      >
                        Delete {selected.size} selected
                      </button>
                    )}
                  </div>
                  {filteredSubmissions.length === 0 ? (
                    <p className="submissions-empty">No submissions match this filter.</p>
                  ) : filteredSubmissions.map((sub) => (
                    <div key={sub.id} className={`submission-card${selected.has(sub.id) ? ' submission-card-selected' : ''}`}>
                      <div className="submission-card-header">
                        <label className="submission-checkbox">
                          <input
                            type="checkbox"
                            checked={selected.has(sub.id)}
                            onChange={() => toggleSelect(sub.id)}
                          />
                          <p className="submission-date">{formatDate(sub.submitted_at)}</p>
                        </label>
                        <button
                          className="submission-delete-btn"
                          onClick={() => confirmAndDelete([sub.id])}
                          aria-label="Delete submission"
                          title="Delete"
                        >
                          🗑
                        </button>
                      </div>
                      {Object.entries(sub.responses).map(([label, value]) => (
                        <div key={label} className="submission-field">
                          <span className="submission-label">{label}</span>
                          <span className="submission-value">{value}</span>
                        </div>
                      ))}
                      {sub.file_paths.length > 0 && (() => {
                        const imagePaths = sub.file_paths.filter((p) => /\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(p));
                        const filePaths = sub.file_paths.filter((p) => !/\.(jpg|jpeg|png|gif|webp|heic|heif|avif)$/i.test(p));
                        return (
                          <div className="submission-field">
                            <span className="submission-label">Attachments</span>
                            {imagePaths.length > 0 && <PhotoGallery paths={imagePaths} />}
                            {filePaths.map((path) => (
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
                        );
                      })()}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Analytics tab */}
          {tab === 'analytics' && (
            <div className="analytics-panel">
              {!loofa?.qrToken ? (
                <p className="submissions-empty">
                  No QR token found for this loofa. QR analytics are only available for loofas created with the token system.
                </p>
              ) : analyticsLoading ? (
                <p className="submissions-empty">Loading analytics…</p>
              ) : !analytics ? (
                <p className="submissions-empty">Failed to load analytics.</p>
              ) : (
                <>
                  {/* Stat cards */}
                  <div className="analytics-stats">
                    <div className="analytics-stat-card">
                      <div className="analytics-stat-value">{analytics.total}</div>
                      <div className="analytics-stat-label">Total Scans</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="analytics-stat-value">{analytics.today}</div>
                      <div className="analytics-stat-label">Today</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="analytics-stat-value">{analytics.week}</div>
                      <div className="analytics-stat-label">Last 7 Days</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="analytics-stat-value">{analytics.month}</div>
                      <div className="analytics-stat-label">Last 30 Days</div>
                    </div>
                    <div className="analytics-stat-card">
                      <div className="analytics-stat-value">{analytics.year}</div>
                      <div className="analytics-stat-label">Last Year</div>
                    </div>
                  </div>

                  {/* 30-day bar chart */}
                  <div className="analytics-chart-section">
                    <h3 className="analytics-section-title">Scans — Last 30 Days</h3>
                    <div className="analytics-bar-chart">
                      {analytics.dailyCounts.map((d, i) => (
                        <div key={d.date} className="analytics-bar-col" title={`${formatShortDate(d.date)}: ${d.count}`}>
                          <div
                            className="analytics-bar"
                            style={{ height: `${(d.count / maxDaily) * 100}%` }}
                          />
                          {(i === 0 || i === 14 || i === 29) && (
                            <div className="analytics-bar-label">{formatShortDate(d.date)}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Hour of day + day of week */}
                  <div className="analytics-two-col">
                    <div className="analytics-chart-section">
                      <h3 className="analytics-section-title">By Hour of Day</h3>
                      <div className="analytics-hour-chart">
                        {analytics.hourly.map((count, h) => (
                          <div key={h} className="analytics-hour-col" title={`${HOUR_LABELS[h]}: ${count}`}>
                            <div
                              className="analytics-bar analytics-bar-sm"
                              style={{ height: `${(count / maxHourly) * 100}%` }}
                            />
                            {(h % 6 === 0) && (
                              <div className="analytics-bar-label">{HOUR_LABELS[h]}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="analytics-chart-section">
                      <h3 className="analytics-section-title">By Day of Week</h3>
                      <div className="analytics-weekday-chart">
                        {analytics.weekday.map((count, d) => {
                          const maxWd = Math.max(...analytics.weekday, 1);
                          return (
                            <div key={d} className="analytics-weekday-col" title={`${WEEKDAY_LABELS[d]}: ${count}`}>
                              <div className="analytics-weekday-label-top">{count > 0 ? count : ''}</div>
                              <div
                                className="analytics-bar analytics-bar-weekday"
                                style={{ height: `${(count / maxWd) * 100}%` }}
                              />
                              <div className="analytics-weekday-label">{WEEKDAY_LABELS[d]}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recent scans */}
                  <div className="analytics-chart-section">
                    <h3 className="analytics-section-title">Recent Scans</h3>
                    {analytics.recentScans.length === 0 ? (
                      <p className="submissions-empty" style={{ marginTop: 12 }}>No scans yet.</p>
                    ) : (
                      <div className="analytics-scans-table">
                        <div className="analytics-scans-header">
                          <span>Time</span>
                          <span>Location</span>
                          <span>Device</span>
                          <span>Browser</span>
                        </div>
                        {analytics.recentScans.map((scan, i) => {
                          const { device, browser } = parseUserAgent(scan.user_agent);
                          const location = scan.city && scan.country
                            ? `${scan.city}, ${scan.country}`
                            : scan.country ?? '—';
                          return (
                            <div key={i} className="analytics-scans-row">
                              <span>{formatDate(scan.scanned_at)}</span>
                              <span>{location}</span>
                              <span>{device}</span>
                              <span>{browser}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </section>

      {confirmIds && (
        <div className="report-modal-backdrop" onClick={() => !deleting && setConfirmIds(null)}>
          <div className="report-modal" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h2 className="report-modal-title" style={{ fontSize: 18 }}>Delete submission{confirmIds.length > 1 ? 's' : ''}?</h2>
            <p className="report-modal-body">
              {confirmIds.length === 1
                ? 'This submission will be permanently deleted.'
                : `${confirmIds.length} submissions will be permanently deleted.`}
            </p>
            <div className="report-modal-footer" style={{ marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setConfirmIds(null)} disabled={deleting}>
                No, keep it
              </button>
              <button className="btn submission-confirm-delete-btn" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
