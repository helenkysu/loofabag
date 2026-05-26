import NavBar from './components/NavBar';
import CyclingText from './components/CyclingText';

export default function Home() {
  return (
    <main>
      <NavBar>
        <a href="#what">What is Loofa?</a>
        <a href="#usecases">Use Cases</a>
        <a href="#how">How it Works</a>
      </NavBar>

      <section className="hero">
        <div className="hero-content">
          <CyclingText />
          <h1 className="bubble-text">
            my loofah bag 👜
          </h1>
          <p className="tagline">Real-world connections, one scan away.</p>
          <p className="hero-note">
            ✨ Your personal wingman you can wear wherever you go!
          </p>

          <div className="loofa-definition" id="what">
            <p>🤔 What's a LOOFA?</p>
            <span>LOOFA = Looking For A...</span>
            <p className="loofa-description">
              Looking for a husband? A girlfriend? Your new bestie? A dream job?
              Whatever your loofa is, wear it proudly on your bag and let interested people reach out to you!
            </p>
          </div>

          <div className="cta-buttons">
            <button className="btn btn-primary">Get Your Bag Now</button>
            <button className="btn btn-secondary">Learn More</button>
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

      <section className="features">
        <h2 className="section-title">Your Loofa, Your Way</h2>
        <div className="features-grid">
          <article className="feature-card">
            <div className="feature-icon">💕</div>
            <h3>Dating & Romance</h3>
            <p>Looking for a boyfriend, girlfriend, husband, wife, or partner? Let your loofa bag do the talking.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">👯</div>
            <h3>Find Your Tribe</h3>
            <p>Want new bestfriends? Tired of being lonely? Carry your loofa and attract people who are looking for the same connection.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">💼</div>
            <h3>Land Your Dream Job</h3>
            <p>Looking for a new job? Share your loofa with the world and let opportunities find you naturally.</p>
          </article>
          <article className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>You Control It</h3>
            <p>People scan your code and fill out a form. You review responses and decide who you want to connect with.</p>
          </article>
        </div>
      </section>

      <section className="features alternate" id="usecases">
        <h2 className="section-title">Your Loofa Examples</h2>
        <div className="usecases-grid">
          <article className="usecase-card">💕<p>Looking for a husband</p></article>
          <article className="usecase-card">💕<p>Looking for a wife</p></article>
          <article className="usecase-card">💕<p>Looking for a bf/gf</p></article>
          <article className="usecase-card">👯<p>Looking for new bestfriends</p></article>
          <article className="usecase-card">👯<p>Looking for a community</p></article>
          <article className="usecase-card">💼<p>Looking for a new job</p></article>
        </div>
      </section>

      <section className="motto-section">
        <h2>Let what is meant for you<br />find you faster 🚀</h2>
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
            <p>Your myloofabag comes with a unique QR code that tells the world exactly what you're looking for.</p>
            <ul className="feature-list">
              <li>Carry your bag everywhere you go</li>
              <li>People scan your QR code</li>
              <li>They fill out a quick form with their info</li>
              <li>You get notified and review all responses</li>
              <li>Decide who you want to connect with</li>
            </ul>
            <p><strong>It's that simple:</strong> No awkward conversations. No wasted time. Just a fun, organic way to meet your people.</p>
          </div>
        </div>
      </section>

      <footer>
        <p><strong>Ready to find your loofa?</strong></p>
        <p>Whether you're looking for love, friendship, or your next adventure—wear your loofa and let it find you! 🎉</p>
        <p className="footer-note">© 2026 myloofabag. Find your loofa, today.</p>
      </footer>
    </main>
  );
}
