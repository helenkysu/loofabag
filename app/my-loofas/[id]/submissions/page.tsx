'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import NavBar from '@/app/components/NavBar';

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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                    <p className="question-editor-label" style={{ margin: 0 }}>
                      {submissions.length} response{submissions.length !== 1 ? 's' : ''}
                    </p>
                    {flaggedCount > 0 && (
                      <span className="flagged-count-badge" title="Submissions hidden due to policy violations">
                        {flaggedCount} flagged
                      </span>
                    )}
                  </div>
                  {submissions.map((sub) => (
                    <div key={sub.id} className="submission-card">
                      <p className="submission-date">{formatDate(sub.submitted_at)}</p>
                      {Object.entries(sub.responses).map(([label, value]) => (
                        <div key={label} className="submission-field">
                          <span className="submission-label">{label}</span>
                          <span className="submission-value">{value}</span>
                        </div>
                      ))}
                      {sub.file_paths.length > 0 && (
                        <div className="submission-field">
                          <span className="submission-label">Attachments</span>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {sub.file_paths.map((path) => {
                              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(path);
                              return isImage ? (
                                <img
                                  key={path}
                                  src={`/api/files/proxy?path=${encodeURIComponent(path)}`}
                                  alt=""
                                  className="profile-photo-thumb"
                                  style={{ maxWidth: 120 }}
                                />
                              ) : (
                                <a
                                  key={path}
                                  href={`/api/files/proxy?path=${encodeURIComponent(path)}`}
                                  className="profile-field-link"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {path.split('/').pop()}
                                </a>
                              );
                            })}
                          </div>
                        </div>
                      )}
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
    </main>
  );
}
