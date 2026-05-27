import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'loofabag-private';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const sessionId = formData.get('sessionId') as string | null;

    if (!file || !sessionId) {
      return NextResponse.json({ error: 'Missing file or sessionId' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const path = `temp-designs/${sessionId}/design.png`;

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: 'image/png', upsert: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // 1-hour signed URL — enough time for Printful to fetch the file
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(path, 3600);

    if (!data?.signedUrl) {
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.json({ signedUrl: data.signedUrl, path });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[upload/print-file]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
