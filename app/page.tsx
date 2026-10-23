import Link from 'next/link';
import NavBar from './components/NavBar';
import CyclingText from './components/CyclingText';
import BagTextCycler from './components/BagTextCycler';

export default function Home() {
  return (
    <main>
      <NavBar>
        <a href="#what">What is Loofa?</a>
        <a href="#usecases">Use Cases</a>
        <a href="#how">How it Works</a>
      </NavBar>

      <section className="hero">
        <p className="hero-banner">✨ Real-world connections, one scan away</p>

        <div className="hero-content">
          <h1 className="bubble-text">Meet your Loofabag</h1>
          <p className="hero-find">Wear your personal tagline &amp; QR code to find:</p>
          <CyclingText />
          <p className="hero-note">
            Turn heads, start conversations, and let people connect with you on your terms.
          </p>

          <div className="loofa-definition" id="what">
            <p>🤔 What&rsquo;s a LOOFA?</p>
            <span>
              LOOFA is a short abbreviation for{' '}
              <strong className="loofa-letter">LOO</strong>king{' '}
              <strong className="loofa-letter">F</strong>or{' '}
              <strong className="loofa-letter">A</strong>...
            </span>
            <p className="loofa-description">
              Are you looking for a partner? A girlfriend? Your new bestie? A dream job?
              Whatever you're looking for, wear it proudly on your bag and let interested people reach out to you!
            </p>
          </div>

          <div className="cta-buttons">
            <Link href="/my-loofas/create" className="btn btn-primary">Get Your Bag Now</Link>
            <a href="#how" className="btn btn-secondary">Learn More</a>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-circle circle-1" />
          <div className="floating-circle circle-2" />
          <div className="floating-circle circle-3" />
          <div className="floating-circle circle-4" />
          <div className="floating-circle circle-5" />
          <div className="bag-mockup">👜</div>
        </div>
      </section>

      <section className="features" id="usecases">
        <h2 className="section-title display-heading">Your Loofa, Your Way</h2>
        <div className="features-grid">
          <article className="feature-card">
            <h3>Dating & Romance 💕</h3>
            <p>Looking for a boyfriend, girlfriend, husband, wife, or partner? Let your loofa bag do the talking.</p>
            <div className="feature-bag">
              <img src="/bagimages/qrsamples/redbag.jpg" alt="Loofa tote with red handles and a QR code" className="feature-bag-img" loading="lazy" />
              <BagTextCycler category="dating" qrCenterX={0.5085} qrWidth={0.333} qrTop={0.574} photoAspect={1088 / 1344} />
            </div>
          </article>
          <article className="feature-card">
            <h3>Find Your Tribe 👯</h3>
            <p>Want new bestfriends? Tired of being lonely? Carry your loofa and attract people who are looking for the same connection.</p>
            <div className="feature-bag">
              <img src="/bagimages/qrsamples/yellowbag.jpg" alt="Loofa tote with yellow handles and a QR code" className="feature-bag-img" loading="lazy" />
              <BagTextCycler category="friends" qrCenterX={0.4985} qrWidth={0.327} qrTop={0.587} photoAspect={1088 / 1344} delayMs={1070} />
            </div>
          </article>
          <article className="feature-card">
            <h3>Land Your Dream Job 💼</h3>
            <p>Looking for a new job? Share your loofa with the world and let opportunities find you naturally.</p>
            <div className="feature-bag">
              <img src="/bagimages/qrsamples/blackbag.jpg" alt="Loofa tote with black handles and a QR code" className="feature-bag-img" loading="lazy" />
              <BagTextCycler category="networking" qrCenterX={0.493} qrWidth={0.32} qrTop={0.569} photoAspect={1088 / 1344} delayMs={2130} />
            </div>
          </article>
          <article className="feature-card feature-banner">
            <div>
              <h3>Your Loofabag, Your Rules ⚡</h3>
              <p><strong>Customizable Landing Page:</strong> Control what visitors see and what info they submit.</p>
              <p><strong>Private Responses:</strong> Review incoming messages privately and decide who gets a reply.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="product" id="how">
        <div className="product-container">
          <div className="product-visual">
            <div className="product-bag">
              <div className="qr-code">█</div>
              <div className="product-bag-text">Scan Me! →</div>
            </div>
          </div>
          <div className="product-content">
            <h2>How It Works</h2>
            <ol className="how-steps">
              <li>
                <span className="how-step-label">Step 1</span>
                <h3>Design Your Bag &amp; Page</h3>
                <p>Pick your tagline, strap color, and set up your custom QR landing page with your own bio and questions.</p>
              </li>
              <li>
                <span className="how-step-label">Step 2</span>
                <h3>Wear It Out in the World</h3>
                <p>Carry your Loofabag to coffee shops, events, parks, or campus, wherever you go!</p>
              </li>
              <li>
                <span className="how-step-label">Step 3</span>
                <h3>Get Scanned &amp; Receive Forms</h3>
                <p>New connections scan your QR code and fill out a quick form to introduce themselves.</p>
              </li>
              <li>
                <span className="how-step-label">Step 4</span>
                <h3>Review &amp; Choose Who to Reply To</h3>
                <p>Review responses privately, and connect on your terms.</p>
              </li>
            </ol>
            <p><strong>It's that simple:</strong> No awkward conversations. No endless social shyness loop. Just a fun, organic way to meet your people.</p>
          </div>
        </div>
      </section>

      <section className="connection-section">
        <div className="connection-row">
          <div className="connection-visual">📷</div>
          <div>
            <h2>Real-world connection,<br />made easier</h2>
            <p>No more awkward first conversations. Your loofa bag breaks the ice for you, naturally introducing what you're looking for to the world around you.</p>
          </div>
        </div>

        <div className="connection-row reverse">
          <div>
            <h2>Meet people who<br />noticed you first</h2>
            <p>People come to you because they're intentionally interested in what you're looking for. That's the magic—genuine connections from people who already get it.</p>
          </div>
          <div className="connection-visual">📷</div>
        </div>

        <div className="connection-row">
          <div className="connection-visual accent">📷</div>
          <div>
            <h2>Turn chance encounters<br />into real connections</h2>
            <p>Every person who scans your QR code could be "the one"—your dream friend, your soulmate, your next colleague. Wear your loofa and let serendipity take the wheel.</p>
          </div>
        </div>
      </section>

      <section className="motto-section">
        <h2 className="display-heading">Let what is meant for you<br />find you faster 🚀</h2>
      </section>

    </main>
  );
}
