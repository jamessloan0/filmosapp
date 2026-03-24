import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Back to FilmOS
        </Link>

        <div className="mb-10">
          <img src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png" alt="FilmOS" className="h-7 w-auto mb-8" />
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Privacy Policy</h1>
          <p className="text-zinc-500 text-sm">Last updated: March 17, 2026</p>
        </div>

        <div className="prose prose-zinc max-w-none space-y-8 text-zinc-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Introduction</h2>
            <p>FilmOS ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform. Please read this policy carefully. If you disagree with its terms, please stop using the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">Information you provide directly:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Account information: name, email address, and password when you register</li>
              <li>Payment information: processed securely through Stripe (we do not store card details)</li>
              <li>Project content: files, messages, proposals, invoices, and feedback you create</li>
              <li>Client data: names and email addresses of clients you invite to projects</li>
            </ul>
            <h3 className="text-base font-semibold text-zinc-800 mt-4 mb-2">Information collected automatically:</h3>
            <ul className="list-disc pl-6 space-y-1 text-sm">
              <li>Usage data: pages visited, features used, and actions taken within the app</li>
              <li>Device information: IP address, browser type, operating system</li>
              <li>Cookies and similar tracking technologies for session management and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3 text-sm">
              <li>Provide, operate, and maintain the FilmOS platform</li>
              <li>Process payments and manage your subscription</li>
              <li>Send transactional emails such as notifications and invoices</li>
              <li>Respond to support inquiries and communicate with you</li>
              <li>Monitor and improve the security and performance of the Service</li>
              <li>Comply with legal obligations</li>
              <li>Send product updates and promotional communications (you can opt out at any time)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">4. How We Share Your Information</h2>
            <p>We do not sell your personal information. We may share your information with:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3 text-sm">
              <li><strong>Service providers:</strong> Third-party vendors who help us operate the Service, including cloud storage (AWS S3), payment processing (Stripe), media processing (Cloudinary), and email delivery (Resend). These providers are contractually bound to protect your data.</li>
              <li><strong>Your clients:</strong> Information you share within a project workspace is visible to clients you have invited via project links.</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority.</li>
              <li><strong>Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">5. File Storage and Security</h2>
            <p>Files you upload are stored securely in AWS S3 with access controlled via signed URLs. Video files may be processed by Cloudinary to generate optimized proxy versions for playback. We implement industry-standard security measures including encryption in transit (HTTPS/TLS) and at rest.</p>
            <p className="mt-3">While we take security seriously, no system is completely secure. We encourage you to use strong passwords and keep your account credentials confidential.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">6. Data Retention</h2>
            <p>We retain your account data for as long as your account is active or as necessary to provide the Service. Uploaded files are retained according to the limits of your plan (see our pricing page). You may request deletion of your account and associated data at any time by contacting us. Some data may be retained for legal, tax, or fraud prevention purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">7. Client Portal Users</h2>
            <p>Clients who access project workspaces via shared links are not required to create an account. Their name (self-provided upon entry) and any content they submit (messages, feedback) within the project is stored and visible to the project owner. Clients are not sent marketing communications by FilmOS.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">8. Cookies</h2>
            <p>We use essential cookies to maintain your session and authentication state. We may also use analytics cookies to understand how the Service is used. You can configure your browser to refuse cookies, though this may affect certain features of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">9. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3 text-sm">
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:support@filmos.co" className="text-sky-600 hover:underline">support@filmos.co</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">10. Children's Privacy</h2>
            <p>FilmOS is not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected information from a minor, please contact us immediately.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">11. Third-Party Services</h2>
            <p>FilmOS integrates with third-party services including Stripe (payments), AWS (storage), Cloudinary (media processing), and Resend (email). Your use of these integrations is also subject to those services' privacy policies. We are not responsible for the privacy practices of third-party services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">12. Changes to This Policy</h2>
            <p>We may update this Privacy Policy periodically. We will notify you of material changes via email or a prominent notice within the app. Your continued use of the Service after changes are posted constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">13. Contact Us</h2>
            <p>If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
            <p className="mt-2 text-sm">
              <strong>FilmOS</strong><br />
              Email: <a href="mailto:support@filmos.co" className="text-sky-600 hover:underline">support@filmos.co</a>
            </p>
          </section>
        </div>
      </div>

      <footer className="border-t border-zinc-100 py-8 px-6 mt-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4 text-xs text-zinc-400">
          <span>© {new Date().getFullYear()} FilmOS. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link to="/Terms" className="hover:text-zinc-700 transition-colors">Terms</Link>
            <Link to="/Privacy" className="hover:text-zinc-700 transition-colors">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}