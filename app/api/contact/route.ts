import { NextRequest, NextResponse } from 'next/server';

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token, ...(ip ? { remoteip: ip } : {}) }),
  });
  const data = await res.json() as { success: boolean };
  return data.success;
}

export async function POST(req: NextRequest) {
  const { email, message, captchaToken } = await req.json() as {
    email: string;
    message: string;
    captchaToken?: string;
  };

  if (!email || !message) {
    return NextResponse.json({ error: 'Missing email or message' }, { status: 400 });
  }

  if (process.env.TURNSTILE_SECRET_KEY) {
    if (!captchaToken) {
      return NextResponse.json({ error: 'CAPTCHA required' }, { status: 400 });
    }
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
    const valid = await verifyTurnstile(captchaToken, ip);
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 400 });
    }
  }

  const html = `
<p><strong>From:</strong> ${email}</p>
<p><strong>Message:</strong></p>
<p style="white-space:pre-wrap">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Loofabag Contact <noreply@loofabag.com>',
      to: 'loofabag@gmail.com',
      reply_to: email,
      subject: `Contact form message from ${email}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as { message?: string }).message ?? 'Failed to send' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
