import { Link } from 'react-router-dom';
import { Sparkles, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const EFFECTIVE_DATE = 'November 4, 2026';
const COMPANY = 'Nibrava Labs';
const APP = 'SubPilot';
const WEBSITE = 'https://nibravalabs.com';
const CONTACT_EMAIL = 'support@nibravalabs.com';

export default function TermsOfService() {
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
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-4">Terms of Service</h1>
          <p className="text-sm text-muted-foreground/70">
            Effective Date: <span className="text-foreground/80">{EFFECTIVE_DATE}</span>
          </p>
        </div>

        <div className="prose prose-invert prose-sm max-w-none space-y-10 text-muted-foreground/80 leading-relaxed">

          {/* Intro */}
          <section>
            <p>
              Welcome to <strong className="text-foreground/90">{APP}</strong>, a service provided by{' '}
              <strong className="text-foreground/90">{COMPANY}</strong> ("we", "our", "us").
              These Terms of Service ("Terms") govern your access to and use of{' '}
              <a href={WEBSITE} className="text-primary hover:underline">{WEBSITE}</a> and all related
              services (collectively, the "Service"). By creating an account or using the Service, you agree
              to be bound by these Terms. If you do not agree, do not use the Service.
            </p>
          </section>

          <Divider />

          {/* 1. Eligibility */}
          <section>
            <SectionTitle number="1">Eligibility</SectionTitle>
            <p className="mt-3">
              You must be at least <strong className="text-foreground/90">13 years of age</strong> (or the minimum
              legal age in your jurisdiction) to use {APP}. By using the Service, you represent and warrant
              that you meet this requirement and that you have the legal capacity to agree to these Terms.
            </p>
          </section>

          <Divider />

          {/* 2. Account */}
          <section>
            <SectionTitle number="2">Your Account</SectionTitle>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account.</li>
              <li>You must provide accurate and complete information when registering.</li>
              <li>You must notify us immediately at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">{CONTACT_EMAIL}</a> if you suspect any unauthorised access to your account.</li>
              <li>You may not share your account with others or create multiple accounts.</li>
            </ul>
          </section>

          <Divider />

          {/* 3. The Service */}
          <section>
            <SectionTitle number="3">Description of the Service</SectionTitle>
            <p className="mt-3">
              {APP} is an AI-powered subscription tracking and management tool that allows you to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Manually add and track recurring subscriptions.</li>
              <li>Connect your Gmail account (read-only) to automatically detect subscription billing emails.</li>
              <li>Connect bank accounts via third-party providers (Quiltt, Mono) to detect subscription transactions.</li>
              <li>Receive AI-powered insights and spending recommendations through our chat assistant.</li>
            </ul>
            <p className="mt-4">
              <strong className="text-foreground/90">The Service is provided for informational and organisational purposes only.</strong>{' '}
              It does not constitute financial advice. Always consult a qualified financial professional before
              making financial decisions.
            </p>
          </section>

          <Divider />

          {/* 4. Google Integration */}
          <section>
            <SectionTitle number="4">Google Integration</SectionTitle>
            <p className="mt-3">
              When you connect your Google account, you authorise {APP} to access your Gmail messages in
              read-only mode solely to detect subscription-related emails. By connecting Google, you also agree
              to{' '}
              <a
                href="https://policies.google.com/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google's Terms of Service
              </a>{' '}
              and{' '}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Privacy Policy
              </a>
              . You may disconnect your Google account at any time from the app settings.
            </p>
          </section>

          <Divider />

          {/* 5. Third-Party Services */}
          <section>
            <SectionTitle number="5">Third-Party Services</SectionTitle>
            <p className="mt-3">
              {APP} integrates with third-party services including Quiltt, Mono, and AI model providers.
              Your use of these integrations is also subject to their respective terms and privacy policies.
              We are not responsible for the practices of these third-party services.
            </p>
          </section>

          <Divider />

          {/* 6. Acceptable Use */}
          <section>
            <SectionTitle number="6">Acceptable Use</SectionTitle>
            <p className="mt-3">You agree <strong className="text-foreground/90">not</strong> to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-3">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws or regulations.</li>
              <li>Attempt to gain unauthorised access to our systems, other users' accounts, or related infrastructure.</li>
              <li>Interfere with or disrupt the integrity or performance of the Service.</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service.</li>
              <li>Scrape, crawl, or otherwise extract data from the Service through automated means.</li>
              <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity.</li>
              <li>Upload or transmit any malware, viruses, or other harmful code.</li>
            </ul>
          </section>

          <Divider />

          {/* 7. Intellectual Property */}
          <section>
            <SectionTitle number="7">Intellectual Property</SectionTitle>
            <p className="mt-3">
              All content, features, trademarks, and functionality of {APP} — including but not limited to
              the UI design, logos, software, and text — are the exclusive property of {COMPANY} and are
              protected by applicable intellectual property laws. You are granted a limited, non-exclusive,
              non-transferable licence to use the Service for personal, non-commercial purposes only.
            </p>
            <p className="mt-3">
              You retain ownership of any content you submit (e.g., manually entered subscription data).
              By submitting content, you grant us a limited licence to use it solely to operate and
              improve the Service.
            </p>
          </section>

          <Divider />

          {/* 8. Privacy */}
          <section>
            <SectionTitle number="8">Privacy</SectionTitle>
            <p className="mt-3">
              Your use of the Service is also governed by our{' '}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>, which is
              incorporated into these Terms by reference. Please review it to understand our data practices.
            </p>
          </section>

          <Divider />

          {/* 9. Disclaimers */}
          <section>
            <SectionTitle number="9">Disclaimers</SectionTitle>
            <p className="mt-3">
              THE SERVICE IS PROVIDED ON AN <strong className="text-foreground/90">"AS IS" AND "AS AVAILABLE"</strong> BASIS
              WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              We do not warrant that the Service will be uninterrupted, error-free, or that detected
              subscriptions will be complete or accurate. Subscription detection via Gmail or bank data
              is an automated process and may miss some charges or produce incorrect results. Always verify
              your financial information with your bank or service providers directly.
            </p>
          </section>

          <Divider />

          {/* 10. Limitation of Liability */}
          <section>
            <SectionTitle number="10">Limitation of Liability</SectionTitle>
            <p className="mt-3">
              TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, {COMPANY.toUpperCase()} SHALL NOT BE LIABLE
              FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE —
              EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
            </p>
            <p className="mt-3">
              IN NO EVENT WILL OUR AGGREGATE LIABILITY TO YOU EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID
              TO US IN THE 12 MONTHS PRECEDING THE CLAIM, OR (B) USD \$100.
            </p>
          </section>

          <Divider />

          {/* 11. Indemnification */}
          <section>
            <SectionTitle number="11">Indemnification</SectionTitle>
            <p className="mt-3">
              You agree to indemnify, defend, and hold harmless {COMPANY} and its officers, directors,
              employees, and agents from any claims, liabilities, damages, losses, and expenses (including
              reasonable legal fees) arising from your use of the Service, your violation of these Terms,
              or your violation of any third-party rights.
            </p>
          </section>

          <Divider />

          {/* 12. Termination */}
          <section>
            <SectionTitle number="12">Termination</SectionTitle>
            <p className="mt-3">
              You may delete your account at any time from the Settings page. We may suspend or terminate
              your access to the Service at any time, without notice, if we believe you have violated these
              Terms or for any other reason at our sole discretion.
            </p>
            <p className="mt-3">
              Upon termination, your right to use the Service ceases immediately. Sections that by their
              nature should survive termination (Intellectual Property, Disclaimers, Limitation of Liability,
              Indemnification, Governing Law) shall survive.
            </p>
          </section>

          <Divider />

          {/* 13. Governing Law */}
          <section>
            <SectionTitle number="13">Governing Law &amp; Dispute Resolution</SectionTitle>
            <p className="mt-3">
              These Terms shall be governed by and construed in accordance with applicable law. Any disputes
              arising from these Terms or the Service shall first be attempted to be resolved through good-faith
              negotiation. If unresolved, disputes shall be submitted to binding arbitration or the courts of
              competent jurisdiction.
            </p>
          </section>

          <Divider />

          {/* 14. Changes */}
          <section>
            <SectionTitle number="14">Changes to These Terms</SectionTitle>
            <p className="mt-3">
              We reserve the right to modify these Terms at any time. When we do, we will update the effective
              date and, for material changes, notify you via email or in-app notification. Your continued use
              of the Service after any changes constitutes your acceptance of the new Terms.
            </p>
          </section>

          <Divider />

          {/* 15. Contact */}
          <section>
            <SectionTitle number="15">Contact Us</SectionTitle>
            <p className="mt-3">
              If you have any questions about these Terms, please contact us at:
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
            <Link to="/privacy" className="hover:text-foreground/80 transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground/80 transition-colors font-medium text-foreground/80">Terms of Service</Link>
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

function Divider() {
  return <hr className="border-white/6" />;
}
