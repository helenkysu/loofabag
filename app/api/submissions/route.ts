import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'loofabag_submissions';

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface ModerationResult {
  flagged: boolean;
  categories: Record<string, boolean>;
}

const HARASSMENT_SCORE_THRESHOLD = 0.4;

async function moderateText(text: string): Promise<ModerationResult> {
  if (!openai || !text.trim()) return { flagged: false, categories: {} };
  try {
    const res = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    });
    const result = res.results[0];
    const scores = result.category_scores as Record<string, number>;

    // Flag if OpenAI flags it, OR if any score exceeds our lower threshold
    const highScoreCategories = Object.entries(scores)
      .filter(([, score]) => score >= HARASSMENT_SCORE_THRESHOLD)
      .map(([cat]) => cat);

    const flagged = result.flagged || highScoreCategories.length > 0;
    const activeCategories = Object.fromEntries(
      Object.entries(result.categories as Record<string, boolean>).filter(([, v]) => v),
    );
    highScoreCategories.forEach((cat) => { activeCategories[cat] = true; });

    return { flagged, categories: activeCategories };
  } catch {
    return { flagged: false, categories: {} };
  }
}

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, data, created_at, flagged')
    .contains('data', { slug })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const all = data ?? [];
  const flaggedCount = all.filter((r) => r.flagged).length;
  const submissions = all
    .filter((r) => !r.flagged)
    .map((row) => ({
      id: row.id,
      submitted_at: row.created_at,
      responses: row.data?.responses ?? {},
      file_paths: row.data?.file_paths ?? [],
    }));

  return NextResponse.json({ submissions, flagged_count: flaggedCount });
}

async function sendNotificationEmail(
  slug: string,
  responses: Record<string, string>,
  filePaths: string[],
) {
  const supabase = createAdminClient();
  const { data: settings } = await supabase
    .from('loofa_notification_settings')
    .select('email, enabled')
    .eq('slug', slug)
    .maybeSingle();

  if (!settings?.enabled || !settings.email) return;

  const responseRows = Object.entries(responses)
    .map(([label, value]) => `
      <tr>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#666;width:35%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 16px;border-bottom:1px solid #f0f0f0;font-size:14px;color:#1a1a1a;vertical-align:top;">${escapeHtml(String(value))}</td>
      </tr>`)
    .join('');

  const fileNote = filePaths.length > 0
    ? `<p style="margin:16px 0 0;font-size:13px;color:#888;">📎 ${filePaths.length} file attachment${filePaths.length !== 1 ? 's' : ''} included</p>`
    : '';

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

    <div style="background:linear-gradient(135deg,#c8a97e 0%,#e8c99a 100%);padding:28px 32px;">
      <p style="margin:0 0 6px;font-size:13px;color:rgba(255,255,255,0.8);letter-spacing:0.5px;text-transform:uppercase;">loofabag.com/${escapeHtml(slug)}</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#fff;">You've received a new loofa response! 🎉</h1>
    </div>

    <div style="padding:24px 32px;">
      <table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #f0f0f0;">
        ${responseRows || '<tr><td style="padding:16px;color:#aaa;font-size:13px;">No fields submitted</td></tr>'}
      </table>
      ${fileNote}
    </div>

    <div style="padding:0 32px 28px;">
      <a href="https://loofabag.com/${escapeHtml(slug)}"
         style="display:inline-block;background:#c8a97e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        View on Loofabag →
      </a>
    </div>

    <div style="padding:16px 32px;border-top:1px solid #f0f0f0;background:#fafafa;">
      <p style="margin:0;font-size:12px;color:#bbb;">You're getting this because you turned on email notifications for this loofa. You can turn them off in your submission form settings.</p>
    </div>

  </div>
</body>
</html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Loofabag <noreply@loofabag.com>',
      to: settings.email,
      subject: `You've received a new loofa response! — loofabag.com/${slug}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[submissions] Resend error:', err);
  }
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // skip verification if not configured
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      secret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    }),
  });
  const data = await res.json() as { success: boolean };
  return data.success;
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    slug: string;
    responses: Record<string, string>;
    file_paths?: string[];
    captchaToken?: string;
  };

  if (!body.slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  // Verify Turnstile token if secret key is configured
  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!body.captchaToken) {
      return NextResponse.json({ error: 'CAPTCHA required' }, { status: 400 });
    }
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const valid = await verifyTurnstile(body.captchaToken, ip);
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }
  }

  // Moderate all text responses
  const allText = Object.values(body.responses ?? {}).filter(Boolean).join('\n');
  const moderation = await moderateText(allText);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      data: {
        slug: body.slug,
        responses: body.responses ?? {},
        file_paths: body.file_paths ?? [],
      },
      flagged: moderation.flagged,
      flag_categories: moderation.flagged ? moderation.categories : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Only notify owner for clean submissions
  if (!moderation.flagged) {
    await sendNotificationEmail(body.slug, body.responses ?? {}, body.file_paths ?? []);
  }

  return NextResponse.json({ submission: data });
}
