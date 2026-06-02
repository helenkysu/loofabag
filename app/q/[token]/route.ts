import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  console.log('[qr-scan] token:', token);

  const { data: qr, error: qrError } = await supabase
    .from('qr_redirects')
    .select('slug, is_active')
    .eq('token', token)
    .single();

  console.log('[qr-scan] redirect lookup:', { found: !!qr, is_active: qr?.is_active, slug: qr?.slug, error: qrError?.message });

  if (!qr || !qr.is_active) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  const { error: insertError } = await supabase.from('qr_scans').insert({
    token,
    user_agent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    ip_address: ip,
  });

  console.log('[qr-scan] insert result:', { error: insertError?.message ?? null });

  // 302 so every scan is tracked (not cached by CDN)
  return NextResponse.redirect(new URL(`/${qr.slug}`, req.url), { status: 302 });
}
