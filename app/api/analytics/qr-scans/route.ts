import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

interface RawScan {
  scanned_at: string;
  user_agent: string | null;
  ip_address: string | null;
}

interface GeoResult {
  status: string;
  country?: string;
  regionName?: string;
  city?: string;
  query: string;
}

async function geoLookupBatch(ips: string[]): Promise<Map<string, { country: string; city: string }>> {
  const map = new Map<string, { country: string; city: string }>();
  if (!ips.length) return map;
  try {
    const res = await fetch('http://ip-api.com/batch?fields=status,country,city,query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ips.map((ip) => ({ query: ip }))),
      signal: AbortSignal.timeout(3000),
    });
    const results: GeoResult[] = await res.json();
    for (const r of results) {
      if (r.status === 'success' && r.country) {
        map.set(r.query, { country: r.country, city: r.city ?? '' });
      }
    }
  } catch {
    // geo lookup is best-effort
  }
  return map;
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: scans, error } = await supabase
    .from('qr_scans')
    .select('scanned_at, user_agent, ip_address')
    .eq('token', token)
    .order('scanned_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows: RawScan[] = scans ?? [];

  const now = new Date();
  const startOf = (offsetDays: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offsetDays);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const total = rows.length;
  const today = rows.filter((r) => new Date(r.scanned_at) >= startOf(0)).length;
  const week = rows.filter((r) => new Date(r.scanned_at) >= startOf(6)).length;
  const month = rows.filter((r) => new Date(r.scanned_at) >= startOf(29)).length;
  const year = rows.filter((r) => new Date(r.scanned_at) >= startOf(364)).length;

  // Daily counts — last 30 days
  const dailyMap = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = startOf(i);
    dailyMap.set(d.toISOString().slice(0, 10), 0);
  }
  for (const r of rows) {
    const day = r.scanned_at.slice(0, 10);
    if (dailyMap.has(day)) dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
  }
  const dailyCounts = Array.from(dailyMap.entries()).map(([date, count]) => ({ date, count }));

  // Hour-of-day distribution (0–23, UTC)
  const hourly = new Array(24).fill(0);
  for (const r of rows) {
    const h = new Date(r.scanned_at).getUTCHours();
    hourly[h]++;
  }

  // Day-of-week distribution (0=Sun … 6=Sat)
  const weekday = new Array(7).fill(0);
  for (const r of rows) {
    const d = new Date(r.scanned_at).getUTCDay();
    weekday[d]++;
  }

  // Geo-lookup for the 10 most recent unique IPs
  const recentRaw = rows.slice(0, 50);
  const uniqueIps = [...new Set(recentRaw.map((r) => r.ip_address).filter(Boolean) as string[])].slice(0, 10);
  const geoMap = await geoLookupBatch(uniqueIps);

  const recentScans = recentRaw.slice(0, 20).map((r) => {
    const geo = r.ip_address ? geoMap.get(r.ip_address) : undefined;
    return {
      scanned_at: r.scanned_at,
      user_agent: r.user_agent,
      ip_address: r.ip_address,
      country: geo?.country ?? null,
      city: geo?.city ?? null,
    };
  });

  return NextResponse.json({
    total,
    today,
    week,
    month,
    year,
    dailyCounts,
    hourly,
    weekday,
    recentScans,
  });
}
