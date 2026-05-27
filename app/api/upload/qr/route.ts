import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'loofabag-private';

export async function POST(request: NextRequest) {
  const body = await request.json() as { loofa_id: string; url?: string; imageData?: string };
  const { loofa_id, url, imageData } = body;

  if (!loofa_id || (!url && !imageData)) {
    return NextResponse.json({ error: 'Missing loofa_id and url or imageData' }, { status: 400 });
  }

  let buffer: Buffer;
  let dataUrl: string;

  if (imageData) {
    // Pre-rendered by client — strip data URL prefix if present
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    buffer = Buffer.from(base64, 'base64');
    dataUrl = imageData.startsWith('data:') ? imageData : `data:image/png;base64,${base64}`;
  } else {
    dataUrl = await QRCode.toDataURL(url!, { width: 512, margin: 2 });
    const base64 = dataUrl.replace('data:image/png;base64,', '');
    buffer = Buffer.from(base64, 'base64');
  }

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
