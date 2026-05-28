import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(req: NextRequest) {
  const loofa_id = req.nextUrl.searchParams.get('loofa_id');
  if (!loofa_id) return NextResponse.json({ error: 'Missing loofa_id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('loofa_transfers')
    .select('status, recipient_email, claimed_at')
    .eq('loofa_id', loofa_id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ status: null });
  }

  return NextResponse.json({
    status: data.status,
    recipientEmail: data.recipient_email,
    claimedAt: data.claimed_at,
  });
}
