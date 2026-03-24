import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function Terms() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors mb-10">
          <ArrowLeft className="w-4 h-4" />
          Back to FilmOS
        </Link>

        <div className="mb-10">
          <img src="https://media.base44.com/images/public/69b490115c68bd1fe6d609a8/19ed2b1d5_filmOSlogomain-removebg-preview.png" alt="FilmOS" className="h-7 w-auto mb-8" />
          <h1 className="text-4xl font-bold text-zinc-900 mb-3">Terms of Service</h1>
          <p className="text-zinc-500 text-sm">Last updated: March 17, 2026</p>
        </div>

        <div className="prose prose-zinc max-w-none space-y-8 text-zinc-700 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using FilmOS ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service. FilmOS is operated by FilmOS and these terms govern your use of our platform, including all features, content, and services.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">2. Description of Service</h2>
            <p>FilmOS is a client collaboration platform designed for filmmakers and video professionals. The Service allows you to create project workspaces, upload and share video files, send proposals and invoices, collect client feedback, and deliver final work to clients. FilmOS is provided on a subscription basis with a free tier and paid Pro plan.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">3. Account Registration</h2>
            <p>To use FilmOS, you must create an account. You agree to provide accurate and complete information during registration and to keep your account credentials secure. You are responsible for all activity that occurs under your account. You must be at least 18 years of age to create an account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to use FilmOS for any unlawful purpose or in violation of these terms. Prohibited activities include:</p>
            <ul className="list-disc pl-6 space-y-1 mt-3 text-sm">
              <li>Uploading content that infringes on any copyright, trademark, or other intellectual property rights</li>
              <li>Uploading illegal, harmful, defamatory, or obscene content</li>
              <li>Attempting to gain unauthorized access to other users' accounts or data</li>
              <li>Using the Service to transmit spam or malicious code</li>
              <li>Interfering with or disrupting the integrity or performance of the Service</li>
              <li>Reverse engineering, decompiling, or otherwise attempting to derive the source code of the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">5. Content and Intellectual Property</h2>
            <p>You retain full ownership of all content you upload to FilmOS, including video files, proposals, and other materials. By uploading content, you grant FilmOS a limited, non-exclusive license to store, process, and display your content solely as necessary to provide the Service.</p>
            <p className="mt-3">FilmOS and its logos, design, and underlying software are the intellectual property of FilmOS. You may not copy, modify, distribute, or create derivative works without our express written consent.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">6. Subscription and Payments</h2>
            <p>FilmOS offers a free plan and a Pro subscription at $20/month. Pro subscriptions are billed monthly and will automatically renew unless cancelled. Payments are processed securely through Stripe. You can cancel your subscription at any time from your account settings. Refunds are not provided for partial billing periods.</p>
            <p className="mt-3">FilmOS reserves the right to change pricing with at least 30 days' notice. Continued use of the Service after a price change constitutes acceptance of the new pricing.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">7. File Storage and Retention</h2>
            <p>Files uploaded to FilmOS are stored on secure cloud infrastructure. Free plan files may be subject to storage limits and retention policies as outlined in the plan description. Pro plan files benefit from extended storage periods. FilmOS is not responsible for data loss and recommends you maintain your own backup copies of important files.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">8. Client Access</h2>
            <p>When you share a project link with a client, that client gains access to the project workspace without requiring an account. You are responsible for the security and appropriate sharing of client links. Do not share project links with unauthorized individuals.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">9. Privacy</h2>
            <p>Your use of FilmOS is also governed by our <Link to="/Privacy" className="text-sky-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our practices.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">10. Disclaimers and Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties of any kind, either express or implied. FilmOS does not warrant that the Service will be uninterrupted, error-free, or completely secure. To the maximum extent permitted by law, FilmOS shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">11. Termination</h2>
            <p>FilmOS reserves the right to suspend or terminate your account at any time for violations of these Terms or for any other reason at our sole discretion. You may terminate your account at any time by contacting us. Upon termination, your access to the Service will cease and your content may be deleted.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">12. Changes to Terms</h2>
            <p>FilmOS may update these Terms from time to time. We will notify you of significant changes via email or within the app. Continued use of the Service after changes are posted constitutes your acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">13. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the United States. Any disputes arising from these Terms or your use of the Service shall be subject to the exclusive jurisdiction of the courts located in the United States.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900 mb-3">14. Contact</h2>
            <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@filmos.co" className="text-sky-600 hover:underline">support@filmos.co</a>.</p>
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
    </div>);

}