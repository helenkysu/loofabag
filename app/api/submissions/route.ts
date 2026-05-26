import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const TABLE = 'loofabag_submissions';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, data, created_at')
    .contains('data', { slug })
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const submissions = (data ?? []).map((row) => ({
    id: row.id,
    submitted_at: row.created_at,
    responses: row.data?.responses ?? {},
    file_paths: row.data?.file_paths ?? [],
  }));

  return NextResponse.json({ submissions });
}

export async function POST(request: NextRequest) {
  const body = await request.json() as {
    slug: string;
    responses: Record<string, string>;
    file_paths?: string[];
  };

  if (!body.slug) return NextResponse.json({ error: 'Missing slug' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      data: {
        slug: body.slug,
        responses: body.responses ?? {},
        file_paths: body.file_paths ?? [],
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ submission: data });
}
