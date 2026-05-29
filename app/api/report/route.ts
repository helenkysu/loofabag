import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  const { slug, reason } = await req.json() as { slug: string; reason: string };

  if (!slug || !reason?.trim()) {
    return NextResponse.json({ error: 'Missing slug or reason' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Store the report
  await supabase.from('loofa_reports').insert({
    slug,
    reason: reason.trim(),
    ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null,
    reported_at: new Date().toISOString(),
  });

  // Notify admin via email
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Loofabag Reports <noreply@loofabag.com>',
      to: 'loofabag@gmail.com',
      subject: `Loofa reported: loofabag.com/${slug}`,
      html: `
<div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
  <div style="background:#1a1a1a;padding:24px 28px;border-radius:12px 12px 0 0;">
    <h2 style="margin:0;color:#fff;font-size:18px;">⚠️ Loofa Reported</h2>
    <p style="margin:6px 0 0;color:#aaa;font-size:13px;">loofabag.com/${slug}</p>
  </div>
  <div style="border:1px solid #eee;border-top:none;padding:24px 28px;border-radius:0 0 12px 12px;">
    <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#555;text-transform:uppercase;letter-spacing:0.5px;">Reason provided</p>
    <p style="margin:0;font-size:15px;color:#1a1a1a;white-space:pre-wrap;">${reason.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
    <p style="margin:24px 0 0;font-size:12px;color:#bbb;">Submitted via loofabag.com · IP: ${req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'}</p>
  </div>
</div>`,
    }),
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
