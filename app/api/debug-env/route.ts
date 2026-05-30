import { NextResponse } from 'next/server';

// Temporary diagnostic endpoint — delete after debugging
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';
  return NextResponse.json({
    url_set: !!url,
    url_prefix: url.slice(0, 30),
    key_set: !!key,
    key_prefix: key.slice(0, 20),
  });
}
