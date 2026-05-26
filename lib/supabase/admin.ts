import { createClient } from '@supabase/supabase-js';

// Admin client uses the secret key — bypasses RLS, server-side only, never expose to the browser
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
  );
}
