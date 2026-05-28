import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { email, message } = await req.json() as { email: string; message: string };

  if (!email || !message) {
    return NextResponse.json({ error: 'Missing email or message' }, { status: 400 });
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
