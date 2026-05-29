import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const admin = createAdminClient();

  const { data: slugRow } = await admin
    .from('loofabag_slugs')
    .select('loofa_id')
    .eq('slug', slug)
    .maybeSingle();

  if (!slugRow?.loofa_id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [loofaResult, pdResult] = await Promise.all([
    admin.from('loofabag_loofas').select('*').eq('id', slugRow.loofa_id).single(),
    admin.from('loofabag_profiles_data').select('data').eq('loofa_id', slugRow.loofa_id).maybeSingle(),
  ]);

  if (loofaResult.error || !loofaResult.data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const l = loofaResult.data;
  return NextResponse.json({
    loofa: {
      id: l.id,
      name: l.title ?? '',
      slug,
      emoji: l.emoji ?? '👜',
      template: l.template_type ?? 'custom',
      fields: l.submission_template ?? [],
      profileFields: l.profile_template ?? [],
      profileData: (pdResult.data?.data ?? {}) as Record<string, string>,
      isActive: l.status === 'active',
      profilePhotoUrl: l.profile_photo_url ?? null,
    },
  });
}
