import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EFFECTIVE_DATE = 'November 4, 2026';
const COMPANY = 'Nibrava Labs';
const APP = 'SubPilot';
const WEBSITE = 'https://nibravalabs.com';
const CONTACT_EMAIL = 'support@nibravalabs.com';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Minimal header */}
      <header className="border-b border-white/6 py-4 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/40 text-primary-foreground group-hover:shadow-glow transition-all">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-display font-medium tracking-tight text-sm">{APP}</span>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
        <div className="mb-12">
          <p className="text-xs text-muted-foreground/60 uppercase tracking-widest mb-3">Legal</p>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground/70">
            Effective Date: <span className="text-foreground/80">{EFFECTIVE_DATE}</span>
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-muted-foreground/80 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              {COMPANY} ("we", "our", or "us") operates <strong className="text-foreground/90">{APP}</strong> (the "Service"),
              accessible at <a href={WEBSITE} className="text-primary hover:underline">{WEBSITE}</a>. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our Service.
              Please read it carefully. By using {APP}, you agree to the practices described in this policy.
            </p>
          </section>

          <Divider />

          {/* 1. Information We Collect */}
          <section>
            <SectionTitle number="1">Information We Collect</SectionTitle>

            <SubTitle>1.1 Information You Provide Directly</SubTitle>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><strong className="text-foreground/90">Account registration:</strong> your name, email address, and password when you create an account.</li>
              <li><strong className="text-foreground/90">Manual subscription entries:</strong> subscription names, prices, billing dates, and categories you enter yourself.</li>
            </ul>

            <SubTitle className="mt-6">1.2 Information Collected via Google Sign-In &amp; Gmail</SubTitle>
            <p className="mt-2">
              When you connect your Google account, we request the following OAuth scopes with your explicit consent:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li><code className="text-primary/90 bg-primary/10 px-1 py-0.5 rounded text-xs break-all">openid</code>, <code className="text-primary/90 bg-primary/10 px-1 py-0.5 rounded text-xs break-all">profile</code>, <code className="text-primary/90 bg-primary/10 px-1 py-0.5 rounded text-xs break-all">email</code> — to identify your account.</li>
              <li>
                <code className="text-primary/90 bg-primary/10 px-1 py-0.5 rounded text-xs break-all">https://www.googleapis.com/auth/gmail.readonly</code> — to read your email
                messages <strong className="text-foreground/90">solely</strong> to identify subscription-related receipts and billing notifications. We never read personal correspondence.
              </li>
            </ul>
            <p className="mt-3">
              We store an OAuth access token and refresh token to enable background synchronisation. We store
              your Google email address to display which account is connected. We do <strong className="text-foreground/90">not</strong> store
              raw email bodies — only extracted subscription metadata (name, price, billing date).
            </p>

            <SubTitle className="mt-6">1.3 Bank / Financial Account Data</SubTitle>
            <p className="mt-2">
              If you connect a bank account, we integrate with third-party financial data providers
              (<strong className="text-foreground/90">Quiltt</strong> and <strong className="text-foreground/90">Mono</strong>). These providers
              handle authentication and transaction fetching under their own security and privacy standards. We
              receive transaction summaries to detect recurring subscription charges. We do <strong className="text-foreground/90">not</strong> store
              your bank credentials.
            </p>

            <SubTitle className="mt-6">1.4 Usage &amp; Technical Data</SubTitle>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Log data: IP address, browser type, pages visited, timestamps.</li>
              <li>Device information: operating system, browser version.</li>
              <li>Session tokens stored as secure, HTTP-only cookies.</li>
            </ul>

            <SubTitle className="mt-6">1.5 AI Chat Data</SubTitle>
            <p className="mt-2">
              When you use the AI Insights feature, your questions and our responses are stored as chat sessions
              associated with your account. These are used to provide chat history and may be used to improve
              the quality of responses. They are never sold or shared with third parties.
            </p>
          </section>

          <Divider />

          {/* 2. How We Use Your Information */}
          <section>
            <SectionTitle number="2">How We Use Your Information</SectionTitle>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>To create and manage your account.</li>
              <li>To detect, track, and display your recurring subscriptions.</li>
              <li>To scan Gmail (with your permission) for subscription receipts and billing emails.</li>
              <li>To connect to your bank data (via Quiltt/Mono) to detect subscription transactions.</li>
              <li>To power AI-driven spending insights and recommendations.</li>
              <li>To send important service-related communications (e.g., security notices).</li>
              <li>To maintain the security and integrity of our platform.</li>
              <li>To comply with applicable laws and legal obligations.</li>
            </ul>
            <p className="mt-4">
              <strong className="text-foreground/90">We do not use your Gmail data to serve advertisements, build advertising profiles,
              or sell to third parties.</strong> Our use of information received from Google APIs complies with the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
          </section>

          <Divider />

          {/* 3. Google API Limited Use Disclosure */}
          <section>
            <SectionTitle number="3">Google API Limited Use Disclosure</SectionTitle>
            <p className="mt-3">
              {APP}'s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements. Specifically:
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>We only use Gmail data to provide the subscription-detection feature you explicitly requested.</li>
              <li>We do not transfer Gmail data to third parties except as necessary to operate the Service (e.g., cloud hosting).</li>
              <li>We do not use Gmail data for serving advertisements.</li>
              <li>We do not allow humans to read your Gmail data unless you have given explicit permission, it is necessary for security or legal obligations, or it is aggregated and anonymised.</li>
            </ul>
          </section>

          <Divider />

          {/* 4. Data Sharing */}
          <section>
            <SectionTitle number="4">How We Share Your Information</SectionTitle>
            <p className="mt-3">We do not sell your personal data. We may share it only in these limited circumstances:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong className="text-foreground/90">Service providers:</strong> cloud hosting (e.g., Vercel, Render), database providers (Supabase/PostgreSQL), and AI model providers — only as needed to operate the Service and under appropriate data processing agreements.</li>
              <li><strong className="text-foreground/90">Financial data providers:</strong> Quiltt and Mono, when you explicitly connect a bank account.</li>
              <li><strong className="text-foreground/90">Legal requirements:</strong> if required by law, court order, or to protect the rights and safety of {COMPANY} or our users.</li>
              <li><strong className="text-foreground/90">Business transfers:</strong> in the event of a merger, acquisition, or asset sale, your data may be transferred with appropriate notice.</li>
            </ul>
          </section>

          <Divider />

          {/* 5. Data Retention */}
          <section>
            <SectionTitle number="5">Data Retention</SectionTitle>
            <p className="mt-3">
              We retain your personal data for as long as your account is active or as needed to provide the Service.
              You may delete your account at any time from the Settings page, which permanently deletes all associated
              data (subscriptions, chat history, bank connections, and Google tokens) from our systems. We may retain
              de-identified, aggregated data for analytical purposes indefinitely.
            </p>
          </section>

          <Divider />

          {/* 6. Security */}
          <section>
            <SectionTitle number="6">Security</SectionTitle>
            <p className="mt-3">
              We implement industry-standard security measures, including:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>HTTPS/TLS encryption for all data in transit.</li>
              <li>Passwords hashed using bcrypt (never stored in plain text).</li>
              <li>HTTP-only, secure session cookies to prevent XSS token theft.</li>
              <li>OAuth 2.0 tokens stored encrypted in our database.</li>
              <li>Principle of least privilege for internal data access.</li>
            </ul>
            <p className="mt-3">
              No method of transmission over the Internet is 100% secure. While we strive to use commercially
              acceptable means to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          <Divider />

          {/* 7. Your Rights */}
          <section>
            <SectionTitle number="7">Your Rights &amp; Choices</SectionTitle>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li><strong className="text-foreground/90">Access:</strong> you may access your personal data via the dashboard or by contacting us.</li>
              <li><strong className="text-foreground/90">Correction:</strong> you may update your name, email, and password in Settings.</li>
              <li><strong className="text-foreground/90">Deletion:</strong> you may delete your account and all associated data from Settings &gt; Account.</li>
              <li><strong className="text-foreground/90">Disconnect Google:</strong> you may disconnect your Gmail integration at any time from the Connect Bank page. This revokes our access and deletes stored tokens.</li>
              <li><strong className="text-foreground/90">Disconnect Bank:</strong> you may disconnect Quiltt/Mono bank connections at any time from the dashboard.</li>
              <li><strong className="text-foreground/90">Data portability:</strong> contact us to request an export of your data.</li>
            </ul>
            <p className="mt-4">
              If you are located in the European Economic Area (EEA) or the UK, you have additional rights under
              GDPR/UK GDPR, including the right to object to processing and to lodge a complaint with your local
              supervisory authority.
            </p>
          </section>

          <Divider />

          {/* 8. Cookies */}
          <section>
            <SectionTitle number="8">Cookies</SectionTitle>
            <p className="mt-3">
              We use a single <strong className="text-foreground/90">session cookie</strong> (<code className="text-primary/90 bg-primary/10 px-1 py-0.5 rounded text-xs break-all">token</code>) to
              keep you logged in. This is a strictly necessary cookie — it is HTTP-only and secure. We do not use
              advertising cookies or third-party tracking cookies.
            </p>
          </section>

          <Divider />

          {/* 9. Children */}
          <section>
            <SectionTitle number="9">Children's Privacy</SectionTitle>
            <p className="mt-3">
              {APP} is not intended for children under the age of 13. We do not knowingly collect personal
              information from children under 13. If you believe a child has provided us with personal information,
              please contact us and we will delete it promptly.
            </p>
          </section>

          <Divider />

          {/* 10. Changes */}
          <section>
            <SectionTitle number="10">Changes to This Policy</SectionTitle>
            <p className="mt-3">
              We may update this Privacy Policy from time to time. When we do, we will update the effective date
              at the top and, for material changes, notify you via email or an in-app notification. Your continued
              use of {APP} after such changes constitutes your acceptance of the new policy.
            </p>
          </section>

          <Divider />

          {/* 11. Contact */}
          <section>
            <SectionTitle number="11">Contact Us</SectionTitle>
            <p className="mt-3">
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal data,
              please contact us at:
            </p>
            <div className="mt-4 p-4 rounded-lg border border-white/8 bg-white/[0.03] space-y-1">
              <p className="text-foreground/90 font-medium">{COMPANY}</p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a></p>
              <p>Website: <a href={WEBSITE} className="text-primary hover:underline">{WEBSITE}</a></p>
            </div>
          </section>
        </div>

        {/* Bottom nav */}
        <div className="mt-16 pt-8 border-t border-white/6 flex flex-col sm:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-muted-foreground/40">&copy; 2026 {COMPANY}. All rights reserved.</p>
          <div className="flex gap-4 text-xs text-muted-foreground/60">
            <Link to="/privacy" className="hover:text-foreground/80 transition-colors font-medium text-foreground/80">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground/80 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionTitle({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <h2 className="text-lg font-semibold text-foreground/95 flex items-baseline gap-2">
      <span className="text-primary/60 text-sm font-mono">{number}.</span>
      {children}
    </h2>
  );
}

function SubTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold text-foreground/85 mt-4 ${className}`}>{children}</h3>
  );
}

function Divider() {
  return <hr className="border-white/6" />;
}
