import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Accepts a loofa transfer for an authenticated user.
// Marks the transfer as claimed, re-assigns user_id on loofabag_loofas,
// and updates the slug ownership — no new DB record needed.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { claimToken } = await request.json() as { claimToken: string };
  if (!claimToken) return NextResponse.json({ error: 'Missing claimToken' }, { status: 400 });

  const admin = createAdminClient();

  const { data: transfer } = await admin
    .from('loofa_transfers')
    .select('status, loofa_data, loofa_id')
    .eq('claim_token', claimToken)
    .single();

  if (!transfer) return NextResponse.json({ error: 'Transfer not found' }, { status: 404 });
  if (transfer.status === 'claimed') return NextResponse.json({ error: 'Already claimed' }, { status: 409 });

  // The loofa_data.id is the loofabag_loofas UUID (for loofas created post-migration)
  const loofaData = transfer.loofa_data as Record<string, unknown>;
  const loofaDbId = loofaData?.id as string | undefined;

  // Mark transfer as claimed
  await admin
    .from('loofa_transfers')
    .update({ status: 'claimed', claimed_at: new Date().toISOString() })
    .eq('claim_token', claimToken);

  if (!loofaDbId) {
    // Pre-migration loofa — no DB record to transfer, caller falls back to localStorage
    return NextResponse.json({ ok: true, loofa: loofaData, legacy: true });
  }

  // Transfer ownership
  const { error: updateError } = await admin
    .from('loofabag_loofas')
    .update({
      user_id: user.id,
      transfer_status: null,
      transfer_recipient_email: null,
      transfer_token: null,
      transferred_at: null,
      status: 'active',
    })
    .eq('id', loofaDbId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  // Update slug claimed_by
  await admin
    .from('loofabag_slugs')
    .update({ claimed_by: user.id })
    .eq('loofa_id', loofaDbId);

  return NextResponse.json({
    ok: true,
    loofa: { ...loofaData, isActive: true, transferStatus: null },
  });
}
