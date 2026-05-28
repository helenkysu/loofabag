'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function NavBar({ children }: { children?: React.ReactNode }) {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsSignedIn(!!user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsSignedIn(!!session?.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  };

  return (
    <nav>
      <Link href="/" className="logo">👜 myloofabag</Link>
      <div className="nav-links">
        {children}
        <Link href="/contact">Contact</Link>
        {isSignedIn === true && (
          <Link href="/my-loofas">My Loofas</Link>
        )}
        {isSignedIn === true && (
          <button type="button" className="nav-sign-out" onClick={handleSignOut}>
            Sign Out
          </button>
        )}
        {isSignedIn === false && (
          <Link href="/auth/sign-in">Sign In</Link>
        )}
      </div>
    </nav>
  );
}
