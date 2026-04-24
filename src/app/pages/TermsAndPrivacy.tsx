import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Shield, FileText, ArrowLeft } from 'lucide-react';

type Tab = 'terms' | 'privacy';

export function TermsAndPrivacy() {
  const [tab, setTab] = useState<Tab>('terms');

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Legal
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Last updated: April 2026</p>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-muted rounded-lg p-1 mb-6">
        <button
          onClick={() => setTab('terms')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'terms' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <FileText className="w-4 h-4" /> Terms of Service
        </button>
        <button
          onClick={() => setTab('privacy')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${tab === 'privacy' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Shield className="w-4 h-4" /> Privacy Policy
        </button>
      </div>

      {tab === 'terms' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Terms of Service</CardTitle></CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground space-y-4">
              <section>
                <h3 className="font-bold text-foreground text-base mb-2">1. Agreement to Terms</h3>
                <p>By accessing or using STOIX ("the App", "we", "our"), you agree to be bound by these Terms of Service. If you do not agree, do not use the App. These terms apply to all users, including traders, group administrators, and premium subscribers.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">2. Description of Service</h3>
                <p>STOIX is a trading discipline and journaling platform designed to help traders track performance, build discipline, and improve consistency. The App provides tools including a trade journal, daily discipline check-ins, mental preparation, AI analytics, group communities, and social features.</p>
                <p className="mt-2 font-medium text-foreground">STOIX does not provide financial advice. Nothing in this App constitutes investment advice, trading recommendations, or financial guidance. All trading involves risk. Past performance shown in the App does not guarantee future results.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">3. Eligibility</h3>
                <p>You must be at least 18 years old to use STOIX. By using the App, you confirm you are of legal age in your jurisdiction and have the legal capacity to enter into these Terms.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">4. User Accounts</h3>
                <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate information and to update it as necessary. You are solely responsible for all activity that occurs under your account. Report any unauthorized access immediately.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">5. Premium Subscriptions & Payments</h3>
                <p>STOIX offers premium features through paid subscriptions. By subscribing, you authorize us to charge the applicable fees. Subscriptions auto-renew unless cancelled. Refunds are handled on a case-by-case basis at our discretion. Group creators who monetize their communities receive 95% of subscription revenue; STOIX retains 5% as a platform fee.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">6. Acceptable Use</h3>
                <p>You agree not to: (a) use the App for any unlawful purpose; (b) post misleading, harassing, or harmful content; (c) impersonate other users; (d) attempt to gain unauthorized access to any part of the App; (e) use the App to manipulate markets or share trading signals in violation of applicable law; (f) scrape, copy, or redistribute App content without permission.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">7. User Content</h3>
                <p>You retain ownership of content you create on STOIX (journal entries, posts, group content). By posting publicly, you grant STOIX a non-exclusive, royalty-free license to display that content within the App. You are solely responsible for your content and confirm it does not violate any third-party rights.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">8. No Financial Advice Disclaimer</h3>
                <p className="font-medium text-foreground">STOIX is a journaling and self-improvement tool, not a licensed financial advisor, broker, or investment service. The AI analytics feature provides pattern recognition from your own data only — it does not constitute trading advice. Any trading decisions you make are entirely your own responsibility. STOIX is not liable for any financial losses incurred as a result of using this App.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">9. Intellectual Property</h3>
                <p>All App design, code, branding, features, and content created by STOIX are owned by STOIX and protected by applicable intellectual property laws. You may not copy, modify, or distribute any STOIX-owned content without written permission.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">10. Termination</h3>
                <p>We reserve the right to suspend or terminate your account at any time for violations of these Terms or for any conduct we deem harmful to the platform or its users. You may delete your account at any time through the App settings.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">11. Limitation of Liability</h3>
                <p>To the fullest extent permitted by law, STOIX and its team shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits or trading losses, arising from your use of the App. Our total liability shall not exceed the amount you paid us in the 12 months prior to the claim.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">12. Changes to Terms</h3>
                <p>We may update these Terms from time to time. We will notify users of significant changes via the App. Continued use after changes constitutes acceptance of the updated Terms.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">13. Contact</h3>
                <p>For questions about these Terms, contact us through the App's support channel or at the email address provided in your account settings.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      )}

      {tab === 'privacy' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Privacy Policy</CardTitle></CardHeader>
            <CardContent className="prose prose-sm max-w-none text-muted-foreground space-y-4">
              <section>
                <h3 className="font-bold text-foreground text-base mb-2">1. Introduction</h3>
                <p>STOIX is committed to protecting your privacy. This Privacy Policy explains what data we collect, how we use it, and your rights regarding your personal information. By using STOIX, you agree to the practices described here.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">2. Data We Collect</h3>
                <p><span className="font-medium text-foreground">Account data:</span> name, username, email address, profile picture, trading style, and preferences you provide during registration.</p>
                <p className="mt-2"><span className="font-medium text-foreground">Journal data:</span> trade entries, P&L records, custom fields, screenshots, and notes you log in the App. This data is stored locally on your device and optionally synced to our servers if cloud sync is enabled.</p>
                <p className="mt-2"><span className="font-medium text-foreground">Usage data:</span> app interactions, feature usage, session duration, and performance analytics to improve the platform.</p>
                <p className="mt-2"><span className="font-medium text-foreground">Social data:</span> posts, comments, group memberships, direct messages, and follower relationships you create within the App.</p>
                <p className="mt-2"><span className="font-medium text-foreground">Payment data:</span> subscription and payment information is processed by our payment provider. We do not store full card details on our servers.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">3. How We Use Your Data</h3>
                <p>We use your data to: (a) provide and improve App features; (b) personalize your experience; (c) process payments and manage subscriptions; (d) send important account and service notifications; (e) analyze aggregate usage patterns to improve the platform; (f) enforce our Terms of Service and protect platform integrity.</p>
                <p className="mt-2 font-medium text-foreground">We do not sell your personal data to third parties. We do not use your trading journal data for advertising purposes.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">4. AI Analytics & Your Data</h3>
                <p>The AI Analytics feature processes your journal entries locally to generate insights. Your trade data used for AI analysis is not shared with external AI providers. Pattern analysis is performed on your own dataset only and results are shown exclusively to you.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">5. Data Storage & Security</h3>
                <p>Your journal entries and personal data are stored locally on your device using browser storage (localStorage). If you use cloud features, data is encrypted in transit. We implement industry-standard security measures to protect your information. However, no method of transmission or storage is 100% secure — use the App at your own risk.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">6. Data Sharing</h3>
                <p>We share data only: (a) with service providers who help operate the platform (payment processors, hosting), under strict confidentiality agreements; (b) when required by law or valid legal process; (c) to protect the rights, safety, or property of STOIX, its users, or the public; (d) with your consent.</p>
                <p className="mt-2">Public posts, group content, and profile information you choose to make public are visible to other STOIX users. Direct messages are private between participants.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">7. Your Rights</h3>
                <p>Depending on your location, you may have the right to: access the personal data we hold about you; correct inaccurate data; request deletion of your account and data; export your journal data; opt out of non-essential communications. To exercise these rights, contact us through the App.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">8. Cookies & Local Storage</h3>
                <p>STOIX uses browser localStorage to store your account data, journal entries, and preferences locally on your device. This is essential for the App to function. We do not use third-party advertising cookies.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">9. Children's Privacy</h3>
                <p>STOIX is not intended for users under 18 years of age. We do not knowingly collect personal data from minors. If you believe a minor has created an account, contact us immediately for removal.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">10. Changes to This Policy</h3>
                <p>We may update this Privacy Policy periodically. We will notify you of significant changes via the App. The "Last updated" date at the top reflects the most recent revision.</p>
              </section>

              <section>
                <h3 className="font-bold text-foreground text-base mb-2">11. Contact</h3>
                <p>For privacy-related questions or data requests, contact us through the App's support channel. We will respond within a reasonable timeframe.</p>
              </section>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
