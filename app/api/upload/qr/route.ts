import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'loofabag-private';

export async function POST(request: NextRequest) {
  const { loofa_id, url } = await request.json() as { loofa_id: string; url: string };

  if (!loofa_id || !url) {
    return NextResponse.json({ error: 'Missing loofa_id or url' }, { status: 400 });
  }

  const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
  const base64 = dataUrl.replace('data:image/png;base64,', '');
  const buffer = Buffer.from(base64, 'base64');

  const path = `loofas/${loofa_id}/qr/qr.png`;
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: 'image/png', upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path, dataUrl });
}
