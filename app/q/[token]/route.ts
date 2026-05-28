import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const { token } = params;
  const supabase = createAdminClient();

  const { data: qr } = await supabase
    .from('qr_redirects')
    .select('slug, is_active')
    .eq('token', token)
    .single();

  if (!qr || !qr.is_active) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  // Log the scan — fire and forget, don't block the redirect
  void supabase.from('qr_scans').insert({
    token,
    user_agent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    ip_address: ip,
  });

  // 302 so every scan is tracked (not cached by CDN)
  return NextResponse.redirect(new URL(`/${qr.slug}`, req.url), { status: 302 });
}
