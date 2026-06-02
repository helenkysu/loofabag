import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'loofabag-private';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const loofaId = searchParams.get('loofa_id');
  const filename = searchParams.get('filename');
  const uploadType = searchParams.get('type') ?? 'photos';

  if (!loofaId || !filename) {
    return NextResponse.json({ error: 'Missing loofa_id or filename' }, { status: 400 });
  }

  const ts = Date.now();
  const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `loofas/${loofaId}/${uploadType}/${ts}_${safeName}`;

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Failed to create signed URL' }, { status: 500 });
  }

  return NextResponse.json({ signedUrl: data.signedUrl, path: data.path });
}
