import React from "react";
import { Shield, Lock, Eye, Cookie, ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import AdSenseBanner from "./AdSenseBanner";

interface PrivacyPolicyPageProps {
  onSelectTab: (tab: any, pushToHistory?: boolean) => void;
}

export default function PrivacyPolicyPage({ onSelectTab }: PrivacyPolicyPageProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4 sm:px-6" id="privacy-policy-view">
      {/* Back button and breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
        <button
          type="button"
          onClick={() => onSelectTab("home")}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Home</span>
        </button>
        <span>/</span>
        <span className="text-slate-800">Privacy Policy</span>
      </div>

      {/* Header Banner */}
      <header className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-sm space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5 text-emerald-600" />
          <span>Legal &amp; Privacy Disclosures</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
          GigLizard Privacy Policy
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
          GigLizard is built by touring musicians for independent artists and venue operators. We are committed to transparency, data protection, and clear cookie disclosures.
        </p>
        <p className="text-xs text-slate-400 font-mono">
          Last updated: November 3, 2026 · Effective Date: January 1, 2026
        </p>
      </header>

      {/* Top AdSense Slot */}
      <AdSenseBanner slotId="privacy-top-banner" format="horizontal" />

      {/* Main Policy Content */}
      <article className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
        
        {/* Dedicated Section: Google AdSense & Third-Party Advertising */}
        <section className="bg-amber-50/90 border-2 border-amber-300 rounded-2xl p-6 sm:p-7 space-y-4 shadow-xs" id="google-adsense-advertising">
          <div className="flex items-center gap-2.5 text-amber-950 font-black text-lg">
            <Cookie className="w-5 h-5 text-amber-600 shrink-0" />
            <h2>Google AdSense &amp; Third-Party Advertising</h2>
          </div>
          
          <div className="space-y-3 text-amber-950">
            <p className="font-bold text-sm sm:text-base leading-relaxed">
              Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites.
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-900/95 font-medium">
              Third-party vendors (including Google) use cookies to serve ads based on a user's prior visits to your website. Google's use of advertising cookies enables it and its partners to serve ads to users based on their visit to GigLizard and/or other sites on the Internet.
            </p>
          </div>

          <div className="p-4 bg-white/80 rounded-xl border border-amber-200/90 space-y-2 text-xs text-amber-950">
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>How to Opt Out of Personalized Advertising:</span>
            </p>
            <ul className="list-disc pl-5 space-y-1.5 leading-relaxed text-slate-700">
              <li>
                Users may opt out of personalized advertising by visiting{" "}
                <a 
                  href="https://www.google.com/settings/ads" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold underline text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-0.5"
                >
                  Google Ads Settings (https://www.google.com/settings/ads) <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
              <li>
                Alternatively, users can opt out of a third-party vendor's use of cookies for personalized advertising by visiting{" "}
                <a 
                  href="https://www.aboutads.info/choices/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="font-bold underline text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-0.5"
                >
                  www.aboutads.info <ExternalLink className="w-3 h-3" />
                </a>.
              </li>
            </ul>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <p className="font-bold flex items-center gap-1.5 text-emerald-900">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Strict Protection of Personal &amp; Mobile SMS Data</span>
            </p>
            <p className="text-emerald-800 leading-relaxed">
              We strictly reaffirm that no sensitive personal data, mobile phone numbers, or mobile SMS consent records are ever shared with third parties or advertisers for marketing or promotional purposes. All contact details and artist communications remain private and secure within GigLizard.
            </p>
          </div>
        </section>

        {/* 1. Information We Collect */}
        <section className="space-y-3" id="information-collected">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">1</span>
            Information We Collect
          </h2>
          <p>
            When you register an account, claim a band listing, or submit a venue to GigLizard, we collect information you voluntarily provide:
          </p>
          <ul className="list-disc pl-6 space-y-1.5 text-xs sm:text-sm">
            <li><strong>Account &amp; Contact Details:</strong> Name, band/act name, official contact email, city, state, and optional telephone numbers.</li>
            <li><strong>Performance &amp; Production Specs:</strong> Stage plots, channel lists, instrumentation, input patch choices, and equipment rider configurations.</li>
            <li><strong>Public Directory Information:</strong> Genres, social media handles, EPK links, and Bandcamp/music streaming links provided for show-swap discovery.</li>
            <li><strong>Technical Log Data:</strong> IP addresses, browser user agent strings, and request timestamps used strictly for rate-limiting, bot mitigation, and anti-scraping defense.</li>
          </ul>
        </section>

        {/* 2. How We Protect Artist Data */}
        <section className="space-y-3" id="data-protection">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">2</span>
            Data Privacy Commitment &amp; Anti-Scraping Defense
          </h2>
          <p>
            GigLizard strictly defends independent musician and venue data. We never sell, rent, or lease contact listings, booking emails, or private phone records to third-party data brokers or bulk marketing services.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>No Data Brokering</span>
              </div>
              <p className="text-xs text-slate-500">
                We never monetize your personal contact information by selling leads to third parties.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                <Lock className="w-4 h-4 text-emerald-600" />
                <span>Anti-Harvesting Shield</span>
              </div>
              <p className="text-xs text-slate-500">
                Touring band inboxes are protected behind authenticated subscriber sessions to block automated scraper bots.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Payment Processing & Security */}
        <section className="space-y-3" id="payment-security">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">3</span>
            Payment Processing &amp; Financial Security
          </h2>
          <p>
            All paid subscription passes ($9.99 for 30-day band directory access) are processed securely via standard 256-bit encrypted PayPal checkout pipelines.
          </p>
          <p className="text-xs text-slate-500">
            GigLizard never handles, transmits, or stores credit card numbers, CVV codes, or bank account credentials on our servers. All transactions are covered by our 7-day 100% money-back satisfaction guarantee.
          </p>
        </section>

        {/* 4. Analytics & HeyCatch Tracking */}
        <section className="space-y-3" id="analytics-cookies">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">4</span>
            Analytics &amp; Usage Measurement
          </h2>
          <p>
            We use privacy-friendly analytics services (including HeyCatch SDK and aggregated Google conversion tracking) to monitor platform health, active users, tool performance, and error diagnostics. This aggregated telemetry helps us optimize stage plot PDF export rendering and directory search speeds without tracking user activity across external websites.
          </p>
        </section>

        {/* 5. Contact Information & Privacy Officer */}
        <section className="pt-4 border-t border-slate-100 space-y-2" id="contact-privacy">
          <h2 className="text-base font-bold text-slate-900">Questions or Data Removal Requests</h2>
          <p className="text-xs text-slate-600">
            If you wish to update, modify, or remove your band or venue listing from GigLizard, or if you have any questions regarding this Privacy Policy, please contact our team directly:
          </p>
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-900">GigLizard Data Privacy Team</p>
            <p className="text-slate-600">Email: <a href="mailto:giglizard.us@gmail.com" className="text-indigo-600 hover:underline font-semibold">giglizard.us@gmail.com</a></p>
            <p className="text-slate-500">Portland, Oregon · Built by Little Rusty</p>
          </div>
        </section>
      </article>

      {/* Bottom AdSense Slot */}
      <AdSenseBanner slotId="privacy-bottom-banner" format="auto" />
    </div>
  );
}
