import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function dbToClient(loofa: any, slug: string | null, profileData: Record<string, string> | null) {
  return {
    id: loofa.id as string,
    name: (loofa.title ?? '') as string,
    slug: slug ?? '',
    emoji: (loofa.emoji ?? '👜') as string,
    template: (loofa.template_type ?? 'custom') as string,
    fields: loofa.submission_template ?? [],
    profileFields: loofa.profile_template ?? [],
    profileData: profileData ?? {},
    isActive: loofa.status === 'active',
    profilePhotoUrl: (loofa.profile_photo_url ?? null) as string | null,
    qrToken: (loofa.qr_token ?? null) as string | null,
    storageId: (loofa.storage_id ?? null) as string | null,
    transferStatus: (loofa.transfer_status ?? null) as string | null,
    transferRecipientEmail: (loofa.transfer_recipient_email ?? null) as string | null,
    transferToken: (loofa.transfer_token ?? null) as string | null,
    transferredAt: (loofa.transferred_at ?? null) as string | null,
  };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: loofas, error } = await admin
    .from('loofabag_loofas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!loofas?.length) return NextResponse.json({ loofas: [] });

  const ids = loofas.map((l) => l.id as string);
  const { data: slugRows } = await admin
    .from('loofabag_slugs')
    .select('slug, loofa_id')
    .in('loofa_id', ids);

  const slugMap: Record<string, string> = {};
  for (const s of (slugRows ?? [])) slugMap[s.loofa_id] = s.slug;

  return NextResponse.json({
    loofas: loofas.map((l) => dbToClient(l, slugMap[l.id] ?? null, null)),
  });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json() as {
    name: string;
    slug: string;
    emoji?: string;
    template?: string;
    fields?: unknown[];
    profileFields?: unknown[];
    profileData?: Record<string, string>;
    qrToken?: string;
    storageId?: string;
    isActive?: boolean;
  };

  const admin = createAdminClient();

  // Check slug uniqueness
  const { data: existing } = await admin
    .from('loofabag_slugs')
    .select('slug')
    .eq('slug', body.slug)
    .maybeSingle();
  if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });

  const { data: loofa, error: loofaError } = await admin
    .from('loofabag_loofas')
    .insert({
      user_id: user.id,
      title: body.name,
      status: (body.isActive ?? true) ? 'active' : 'inactive',
      profile_template: body.profileFields ?? [],
      submission_template: body.fields ?? [],
      emoji: body.emoji ?? '👜',
      template_type: body.template ?? 'custom',
      qr_token: body.qrToken ?? null,
      storage_id: body.storageId ?? null,
    })
    .select()
    .single();

  if (loofaError) return NextResponse.json({ error: loofaError.message }, { status: 500 });

  await admin.from('loofabag_slugs').insert({
    slug: body.slug,
    loofa_id: loofa.id,
    claimed_by: user.id,
    status: 'active',
  });

  if (body.profileData && Object.keys(body.profileData).length > 0) {
    await admin.from('loofabag_profiles_data').insert({
      loofa_id: loofa.id,
      data: body.profileData,
    });
  }

  return NextResponse.json({ loofa: dbToClient(loofa, body.slug, body.profileData ?? null) });
}
