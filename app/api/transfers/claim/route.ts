import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET — fetch transfer info so claim page can display it before claiming
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('loofa_transfers')
    .select('loofa_data, sender_email, recipient_email, status')
    .eq('claim_token', token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  }

  return NextResponse.json({
    loofa: data.loofa_data,
    senderEmail: data.sender_email,
    recipientEmail: data.recipient_email,
    status: data.status,
  });
}

// POST — mark as claimed
export async function POST(req: NextRequest) {
  const { claimToken } = await req.json() as { claimToken: string };
  if (!claimToken) return NextResponse.json({ error: 'Missing claimToken' }, { status: 400 });

  const supabase = createAdminClient();

  // Read first to check status
  const { data: existing } = await supabase
    .from('loofa_transfers')
    .select('status, loofa_data, recipient_email')
    .eq('claim_token', claimToken)
    .single();

  if (!existing) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  if (existing.status === 'claimed') {
    return NextResponse.json({ error: 'This loofa has already been claimed' }, { status: 409 });
  }

  const { error } = await supabase
    .from('loofa_transfers')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('claim_token', claimToken);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, loofa: existing.loofa_data, recipientEmail: existing.recipient_email });
}
