import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Create or update a QR token mapping
export async function POST(req: NextRequest) {
  const { token, loofa_id, slug } = await req.json() as {
    token: string;
    loofa_id: string;
    slug: string;
  };

  if (!token || !loofa_id || !slug) {
    return NextResponse.json({ error: 'Missing token, loofa_id, or slug' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from('qr_redirects').upsert(
    { token, loofa_id, slug, is_active: true, updated_at: new Date().toISOString() },
    { onConflict: 'token' },
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token });
}

// Update slug when a user renames their profile
export async function PATCH(req: NextRequest) {
  const { token, slug } = await req.json() as { token: string; slug: string };

  if (!token || !slug) {
    return NextResponse.json({ error: 'Missing token or slug' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from('qr_redirects')
    .update({ slug, updated_at: new Date().toISOString() })
    .eq('token', token);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
