import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: qr } = await supabase
    .from('qr_redirects')
    .select('slug, is_active, redirect_url')
    .eq('token', token)
    .single();

  if (!qr || !qr.is_active) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null;

  await supabase.from('qr_scans').insert({
    token,
    user_agent: req.headers.get('user-agent'),
    referer: req.headers.get('referer'),
    ip_address: ip,
  });

  // Custom URL redirect takes precedence over the loofa profile page.
  // 302 so every scan is tracked (not cached by CDN)
  const destination = qr.redirect_url ?? `/${qr.slug}`;
  return NextResponse.redirect(
    destination.startsWith('http') ? destination : new URL(destination, req.url).href,
    { status: 302 },
  );
}
