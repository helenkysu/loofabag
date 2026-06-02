import NavBar from '@/app/components/NavBar';
import Link from 'next/link';

export const metadata = { title: 'Terms & Conditions — Loofabag' };

export default function TermsPage() {
  return (
    <main>
      <NavBar />
      <section className="legal-section">
        <div className="legal-container">
          <h1 className="legal-title">Terms &amp; Conditions</h1>
          <p className="legal-effective">Effective Date: June 2, 2025</p>

          <p className="legal-intro">
            By using Loofa Bag ("Service"), you agree to these Terms &amp; Conditions. If you do not agree, you may not use the Service.
          </p>

          <h2>1. Description of Service</h2>
          <p>Loofa Bag allows users to create public digital profile pages ("Loofas") that may be accessed via QR codes or links.</p>
          <p>Users may also send private submissions (such as messages, images, or feedback) to Loofa owners. These submissions are not publicly visible.</p>
          <p>We may modify, suspend, or discontinue features at any time.</p>

          <h2>2. Eligibility</h2>
          <p>You must be at least 13 years old (or the minimum legal age in your jurisdiction) to use the Service.</p>

          <h2>3. Accounts</h2>
          <p>Users are responsible for maintaining account security and all activity under their account.</p>
          <p>Guest users may submit content without an account but are still bound by these Terms.</p>

          <h2>4. User Content &amp; License</h2>
          <p>You retain ownership of content you submit or upload.</p>
          <p>By using the Service, you grant Loofa Bag a worldwide, non-exclusive, royalty-free license to host, store, display, process, and transmit your content solely for operating the Service.</p>

          <h2>5. Public Loofas</h2>
          <p>Loofa pages are public by default. You acknowledge that:</p>
          <ul>
            <li>Anyone with access to your QR code or link may view your Loofa</li>
            <li>Content may be viewed, shared, or accessed outside the platform</li>
            <li>You are fully responsible for what you choose to display publicly</li>
          </ul>

          <h2>6. Private Submissions</h2>
          <p>Submissions sent to Loofa pages are private and only visible to the Loofa owner. By submitting content, you acknowledge that:</p>
          <ul>
            <li>Your submission will be delivered to the intended recipient</li>
            <li>You are responsible for the content you submit</li>
            <li>You must not send abusive, illegal, or prohibited content</li>
          </ul>
          <p>We are not responsible for how Loofa owners use or respond to submissions.</p>

          <h2>7. User Responsibility</h2>
          <p>You are solely responsible for content you upload to your Loofa, content you submit to others, and any personal or identifying information you choose to share.</p>

          <h2>8. Content Control</h2>
          <p>Users may update or delete their Loofa content at any time. However, cached or previously accessed content may remain visible to others who have already viewed it.</p>

          <h2>9. Prohibited Content</h2>
          <p>You may not upload or submit content that is illegal or harmful, harassing, threatening, or defamatory, spam or malicious, or infringing intellectual property rights.</p>

          <h2>10. NSFW &amp; Media Policy</h2>
          <p>You agree not to upload or submit content containing:</p>
          <ul>
            <li>Nudity or sexually explicit material</li>
            <li>Non-consensual intimate imagery (NCII)</li>
            <li>Any sexual content involving minors (zero tolerance)</li>
            <li>Graphic violence, gore, or abuse</li>
            <li>Hate symbols or extremist content</li>
          </ul>
          <p>We may remove content and suspend accounts at our discretion.</p>

          <h2>11. Content Moderation &amp; Automated Systems</h2>
          <p>We may use automated systems and human review to detect and enforce safety rules. By using the Service, you agree that we may process, analyze, and review content using automated systems. We do not guarantee all violations will be detected before content is viewed.</p>

          <h2>12. Enforcement Rights</h2>
          <p>We reserve the right to remove violating content, restrict or suspend accounts, and remove or disable Loofa pages. This may occur with or without notice depending on severity.</p>

          <h2>13. No Refund Policy</h2>
          <p>If your account, content, or Loofa is removed due to a violation of these Terms, no refunds will be issued. Enforcement actions do not entitle you to compensation.</p>

          <h2>14. No Responsibility for User Interactions</h2>
          <p>Loofa Bag is not responsible for interactions between users, messages or responses from Loofa owners, or relationships, disputes, or outcomes resulting from use of the Service. All interactions are at users' own discretion and risk.</p>

          <h2>15. Disclaimer</h2>
          <p>The Service is provided "as is" without warranties of any kind.</p>

          <h2>16. Limitation of Liability</h2>
          <p>Loofa Bag is not liable for user-generated content, data loss, user interactions, or third-party actions.</p>

          <h2>17. Changes to Terms</h2>
          <p>We may update these Terms at any time. Continued use of the Service constitutes acceptance of changes.</p>

          <p className="legal-back">
            <Link href="/privacy">View Privacy Policy →</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
