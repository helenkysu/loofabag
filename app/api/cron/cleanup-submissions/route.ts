import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const RETENTION_DAYS = 60;
const BUCKET = 'loofabag-private';
const CHUNK_SIZE = 100;

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// Deletes submissions (and their attached files) older than RETENTION_DAYS.
// Scan/analytics data (qr_scans) is untouched — only loofabag_submissions rows are pruned.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const admin = createAdminClient();

  const { data: rows, error } = await admin
    .from('loofabag_submissions')
    .select('id, data')
    .lt('created_at', cutoff);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!rows?.length) return NextResponse.json({ deleted: 0, filesDeleted: 0 });

  const filePaths = rows.flatMap((r) => (r.data?.file_paths ?? []) as string[]);
  for (const batch of chunk(filePaths, CHUNK_SIZE)) {
    await admin.storage.from(BUCKET).remove(batch);
  }

  const ids = rows.map((r) => r.id);
  const { error: deleteError } = await admin.from('loofabag_submissions').delete().in('id', ids);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  return NextResponse.json({ deleted: ids.length, filesDeleted: filePaths.length });
}
