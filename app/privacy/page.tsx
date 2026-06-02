import NavBar from '@/app/components/NavBar';
import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — Loofabag' };

export default function PrivacyPage() {
  return (
    <main>
      <NavBar />
      <section className="legal-section">
        <div className="legal-container">
          <h1 className="legal-title">Privacy Policy</h1>
          <p className="legal-effective">Effective Date: June 2, 2025</p>

          <h2>1. Information We Collect</h2>
          <p>We may collect:</p>
          <ul>
            <li>Account information (email, username, password hash)</li>
            <li>User-generated content (Loofa content, submissions, images, text)</li>
            <li>Usage data (interactions, timestamps, behavior)</li>
            <li>Device and log data (IP address, browser type)</li>
          </ul>

          <h2>2. How We Use Data</h2>
          <p>We use data to:</p>
          <ul>
            <li>Operate and improve the Service</li>
            <li>Deliver Loofa pages and submissions</li>
            <li>Detect spam, abuse, and violations</li>
            <li>Enforce Terms and safety policies</li>
          </ul>

          <h2>3. Public Content</h2>
          <p>Loofa pages are public and accessible via QR code or link. Users should avoid sharing sensitive information they do not want publicly visible.</p>

          <h2>4. Private Submissions</h2>
          <p>Submissions are delivered privately to Loofa owners and are not publicly visible.</p>

          <h2>5. Image &amp; Media Processing</h2>
          <p>When you upload or submit media, we may process it using automated systems and third-party tools for safety purposes, including:</p>
          <ul>
            <li>Detecting NSFW or prohibited content</li>
            <li>Detecting harmful or illegal material</li>
            <li>Using automated systems that may flag or review sensitive content</li>
          </ul>

          <h2>6. Data Sharing</h2>
          <p>We do not sell personal data. We may share data with:</p>
          <ul>
            <li>Cloud hosting providers</li>
            <li>Analytics providers</li>
            <li>Safety and moderation services</li>
            <li>Legal authorities when required by law</li>
          </ul>

          <h2>7. Data Retention</h2>
          <p>We retain data as long as necessary to provide the Service, while your account is active, or as required by legal or safety obligations. You may request deletion of your data.</p>

          <h2>8. Security</h2>
          <p>We use reasonable safeguards, but no system is fully secure.</p>

          <h2>9. Children's Privacy</h2>
          <p>Loofa Bag is not intended for users under 13 (or applicable minimum age). We will remove such accounts if detected.</p>

          <h2>10. International Users</h2>
          <p>Your data may be processed outside your country (e.g., Canada, US).</p>

          <h2>11. Your Rights</h2>
          <p>Depending on your location, you may have rights to access your data, correct or delete data, or withdraw consent.</p>

          <h2>12. Changes to Policy</h2>
          <p>We may update this Privacy Policy. Continued use means acceptance of changes.</p>

          <p className="legal-back">
            <Link href="/terms">View Terms &amp; Conditions →</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
