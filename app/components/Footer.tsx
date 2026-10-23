import Link from 'next/link';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand-col">
          <Link href="/" className="site-footer-logo">loofabag</Link>
          <p className="site-footer-tagline">Real-world connections, one scan away.</p>
          <Link href="/my-loofas/create" className="site-footer-cta">Get your bag →</Link>
        </div>

        <div className="site-footer-col">
          <h4>Explore</h4>
          <Link href="/#what">What is Loofa?</Link>
          <Link href="/#how">How it Works</Link>
          <Link href="/my-loofas">My Loofas</Link>
          <Link href="/contact">Contact</Link>
        </div>

        <div className="site-footer-col">
          <h4>Legal</h4>
          <Link href="/terms">Terms &amp; Conditions</Link>
          <Link href="/privacy">Privacy Policy</Link>
        </div>

        <div className="site-footer-col">
          <h4>Follow us</h4>
          <div className="site-footer-socials">
            <a href="https://www.instagram.com/loofabag" target="_blank" rel="noopener noreferrer" aria-label="Loofabag on Instagram">
              <InstagramIcon />
            </a>
            <a href="https://www.tiktok.com/@loofabag" target="_blank" rel="noopener noreferrer" aria-label="Loofabag on TikTok">
              <TikTokIcon />
            </a>
          </div>
          <span className="site-footer-handle">@loofabag</span>
        </div>
      </div>

      <div className="site-footer-bottom">
        <span>© {year} Loofabag</span>
        <span>Made with 💕 for people looking for their people</span>
      </div>
    </footer>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 0 1-2.59 2.5 2.6 2.6 0 0 1-2.6-2.6 2.6 2.6 0 0 1 3.35-2.49V9.66a5.73 5.73 0 0 0-.75-.05 5.7 5.7 0 0 0-5.7 5.7 5.7 5.7 0 0 0 5.7 5.69 5.7 5.7 0 0 0 5.7-5.7V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.26-1.48z" />
    </svg>
  );
}
