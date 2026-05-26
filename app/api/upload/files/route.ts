import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const BUCKET = 'loofabag-private';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const loofaId = formData.get('loofa_id') as string | null;
  const uploadType = formData.get('type') as 'photos' | 'files' | null;
  const files = formData.getAll('files') as File[];

  if (!loofaId || !uploadType || files.length === 0) {
    return NextResponse.json({ error: 'Missing loofa_id, type, or files' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ts = Date.now();
  const paths: string[] = [];
  const errors: string[] = [];

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `loofas/${loofaId}/${uploadType}/${ts}_${safeName}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });

    if (error) {
      errors.push(`${file.name}: ${error.message}`);
    } else {
      paths.push(path);
    }
  }

  return NextResponse.json({ paths, ...(errors.length ? { errors } : {}) });
}
