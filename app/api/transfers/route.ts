import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

function generateToken() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendTransferEmail(to: string, claimUrl: string, loofaName: string, senderEmail: string | null) {
  const from = senderEmail ? `${senderEmail} via Loofabag` : 'Loofabag';
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B6B 0%,#FFD93D 50%,#FF6B9D 100%);padding:32px 40px;text-align:center">
            <div style="font-size:40px">👜</div>
            <h1 style="margin:12px 0 0;color:#fff;font-size:26px;font-weight:900">You got a Loofabag!</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:36px 40px">
            <p style="margin:0 0 12px;font-size:16px;color:#444;line-height:1.6">
              <strong>${from}</strong> is sending you their loofabag <strong>"${loofaName}"</strong>.
            </p>
            <p style="margin:0 0 28px;font-size:15px;color:#666;line-height:1.6">
              A loofabag is a QR code you put on your tote bag so people can connect with you. Click below to claim it and add it to your account.
            </p>
            <div style="text-align:center;margin-bottom:28px">
              <a href="${claimUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#FF6B6B,#FF6B9D);color:#fff;font-size:17px;font-weight:700;text-decoration:none;padding:16px 40px;border-radius:999px">
                Claim Your Loofa →
              </a>
            </div>
            <p style="margin:0;font-size:12px;color:#aaa;text-align:center;line-height:1.5">
              Or copy this link into your browser:<br>
              <span style="color:#888">${claimUrl}</span>
            </p>
          </td>
        </tr>
        <tr>
          <td style="background:#fafafa;padding:16px 40px;text-align:center;border-top:1px solid #eee">
            <p style="margin:0;font-size:12px;color:#aaa">Loofabag · loofabag.com</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Loofabag <noreply@loofabag.com>',
      to,
      subject: `${from} is sending you a loofabag 👜`,
      html,
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    const { loofaId, loofaData, senderEmail, recipientEmail } = await req.json() as {
      loofaId: string;
      loofaData: object;
      senderEmail?: string;
      recipientEmail: string;
    };

    if (!loofaId || !loofaData || !recipientEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const claimToken = generateToken();
    const supabase = createAdminClient();

    const { error } = await supabase.from('loofa_transfers').insert({
      claim_token: claimToken,
      loofa_id: loofaId,
      loofa_data: loofaData,
      sender_email: senderEmail ?? null,
      recipient_email: recipientEmail,
      status: 'pending',
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const origin = req.headers.get('origin') ?? 'https://loofabag.com';
    const claimUrl = `${origin}/claim-loofa?token=${claimToken}`;

    await sendTransferEmail(recipientEmail, claimUrl, (loofaData as { name?: string }).name ?? 'Loofa', senderEmail ?? null);

    return NextResponse.json({ ok: true, claimToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
