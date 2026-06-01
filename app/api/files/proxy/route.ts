import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'loofabag-private';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path');
  if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600);

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: error?.message ?? 'Not found' }, { status: 404 });
  }

  const fileRes = await fetch(data.signedUrl);
  if (!fileRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch file' }, { status: 404 });
  }

  const contentType = fileRes.headers.get('content-type') ?? 'application/octet-stream';
  return new NextResponse(fileRes.body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
