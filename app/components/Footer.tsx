import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <span className="site-footer-brand">© {new Date().getFullYear()} Loofabag</span>
        {/* div, not nav: the global nav style (top bar) would box these links */}
        <div className="site-footer-links">
          <a href="https://www.instagram.com/loofabag" target="_blank" rel="noopener noreferrer">
            <InstagramIcon />
            Instagram
          </a>
          <a href="https://www.tiktok.com/@loofabag" target="_blank" rel="noopener noreferrer">
            <TikTokIcon />
            TikTok
          </a>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.35-2.49V9.66a5.73 5.73 0 0 0-.75-.05 5.7 5.7 0 0 0-5.7 5.7 5.7 5.7 0 0 0 5.7 5.69 5.7 5.7 0 0 0 5.7-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.26-1.48z" />
    </svg>
  );
}
