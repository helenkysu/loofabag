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

async function getSlugAndProfileData(admin: ReturnType<typeof createAdminClient>, id: string) {
  const [slugResult, pdResult] = await Promise.all([
    admin.from('loofabag_slugs').select('slug').eq('loofa_id', id).maybeSingle(),
    admin.from('loofabag_profiles_data').select('data').eq('loofa_id', id).maybeSingle(),
  ]);
  return {
    slug: slugResult.data?.slug ?? null,
    profileData: (pdResult.data?.data ?? null) as Record<string, string> | null,
  };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: loofa, error } = await admin
    .from('loofabag_loofas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !loofa) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { slug, profileData } = await getSlugAndProfileData(admin, id);
  return NextResponse.json({ loofa: dbToClient(loofa, slug, profileData) });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};
  if ('name' in body) updates.title = body.name;
  if ('emoji' in body) updates.emoji = body.emoji;
  if ('fields' in body) updates.submission_template = body.fields;
  if ('profileFields' in body) updates.profile_template = body.profileFields;
  if ('isActive' in body) updates.status = body.isActive ? 'active' : 'inactive';
  if ('transferStatus' in body) updates.transfer_status = body.transferStatus;
  if ('transferRecipientEmail' in body) updates.transfer_recipient_email = body.transferRecipientEmail;
  if ('transferToken' in body) updates.transfer_token = body.transferToken;
  if ('transferredAt' in body) updates.transferred_at = body.transferredAt;
  if ('profilePhotoUrl' in body) updates.profile_photo_url = body.profilePhotoUrl;

  const { data: loofa, error } = Object.keys(updates).length
    ? await admin
        .from('loofabag_loofas')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()
    : await admin
        .from('loofabag_loofas')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

  if (error || !loofa) return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: error ? 500 : 404 });

  if ('profileData' in body) {
    await admin.from('loofabag_profiles_data').upsert(
      { loofa_id: id, data: body.profileData, updated_at: new Date().toISOString() },
      { onConflict: 'loofa_id' },
    );
  }

  const { slug, profileData } = await getSlugAndProfileData(admin, id);
  return NextResponse.json({ loofa: dbToClient(loofa, slug, profileData) });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { error } = await admin
    .from('loofabag_loofas')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Clean up related records
  await Promise.all([
    admin.from('loofabag_slugs').delete().eq('loofa_id', id),
    admin.from('loofabag_profiles_data').delete().eq('loofa_id', id),
  ]);

  return NextResponse.json({ ok: true });
}
