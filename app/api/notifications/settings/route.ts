import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'loofa_notification_settings';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('email, enabled')
    .eq('slug', slug)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ email: data?.email ?? '', enabled: data?.enabled ?? false });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as { slug: string; email: string; enabled: boolean };
  if (!body.slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase
    .from(TABLE)
    .upsert({ slug: body.slug, email: body.email, enabled: body.enabled, updated_at: new Date().toISOString() }, { onConflict: 'slug' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
