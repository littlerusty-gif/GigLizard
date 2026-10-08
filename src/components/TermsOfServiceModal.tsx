import React, { useEffect } from "react";
import { 
  X, Shield, Scale, FileText, Lock, AlertTriangle, 
  CheckCircle2, Sparkles, Database, Ban, Music, Building2 
} from "lucide-react";

interface TermsOfServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      id="terms-of-service-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl md:rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-up"
        id="terms-of-service-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 md:p-6 border-b border-slate-800 bg-slate-900/90 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0">
              <Scale className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-black text-white tracking-tight" id="terms-modal-title">
                GigLizard Terms of Service
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Effective 2026 • Legal Agreement & Platform Usage Guidelines
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
            aria-label="Close Terms of Service"
            id="btn-close-terms-modal-top"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Terms Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed custom-scrollbar">
          
          {/* Welcome note */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4 text-slate-300">
            <p className="font-semibold text-white mb-1">
              Welcome to GigLizard.
            </p>
            <p>
              By accessing or using the GigLizard platform, mobile web services, or booking exchange utilities, you agree to be bound by the following Terms of Service. If you do not agree to these terms, please do not use the platform.
            </p>
          </div>

          {/* Section 1: Proprietary Platform & Features */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-black text-indigo-400 uppercase tracking-wide">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <h3>1. Proprietary Platform & Intellectual Property</h3>
            </div>
            <p>
              All software, source algorithms, design interfaces, stage plotting mechanics, export templates, and digital toolsets accessible through GigLizard—including, without limitation, the <strong>Interactive Stage Plot Designer</strong>, the <strong>Dynamic Tech Rider Builder</strong>, the <strong>High-Resolution Concert Poster Designer</strong>, and the <strong>Smart Tour Planner & Routing Engine</strong>—are the exclusive intellectual property of GigLizard and protected under international copyright, trademark, and intellectual property statutes.
            </p>
            <p>
              Our compiled database structures, curated venue specifications, technical specifications, and proprietary rating algorithms are strictly trade dress and assets of GigLizard. Users are granted a revocable, non-exclusive, non-transferable license to generate and export stage documents solely for their own legitimate touring and performance coordination. Reverse engineering, decompiling, framing, white-labeling, or distributing the software architecture is expressly prohibited.
            </p>
          </section>

          {/* Section 2: Anti-Scraping & Data Protection */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-black text-rose-400 uppercase tracking-wide">
              <Ban className="w-4 h-4 flex-shrink-0" />
              <h3>2. Anti-Scraping & Data Protection Safeguards</h3>
            </div>
            <p>
              GigLizard maintains active anti-scraping defenses and strict data protection barriers to protect independent bands, booking agents, sound engineers, and live music venues from mass solicitation, spam bots, and malicious automated harvesting.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-350">
              <li>
                <strong>Automated Scraping Prohibition:</strong> The use of automated scripts, crawlers, web scrapers, headless browsers, cURL bots, AI model scrapers, or third-party extraction tools to systematically harvest band profiles, email addresses, phone numbers, venue contacts, or technical riders is strictly forbidden.
              </li>
              <li>
                <strong>Commercial Resale & Bulk Mining:</strong> You may not harvest, aggregate, sell, license, or publish any contact directories, booking addresses, or proprietary listings obtained from GigLizard.
              </li>
              <li>
                <strong>Violation & Termination:</strong> Any detected automated harvesting or unauthorized scraping attempts will trigger immediate IP bans, instant revocation of any subscription access without refund, and potential legal remedies under the Computer Fraud and Abuse Act (CFAA) and applicable civil laws.
              </li>
            </ul>
          </section>

          {/* Section 3: User Accounts, Passwords & 30-Day Pass Subscriptions */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-black text-amber-400 uppercase tracking-wide">
              <Lock className="w-4 h-4 flex-shrink-0" />
              <h3>3. User Accounts, Security & 30-Day Access Pass</h3>
            </div>
            <p>
              When creating an account on GigLizard as an Artist, Venue Operator, or Sound Engineer, you are responsible for maintaining the confidentiality of your login credentials and password. You agree to notify us immediately of any unauthorized use of your account.
            </p>
            <p>
              <strong>30-Day Contact Pass:</strong> Access to unmasked booking emails, electronic press kits, and direct venue talent buyer contacts requires an active, paid 30-Day All-Access Pass ($9.99 / 30 days). This pass is personal to the registered subscriber. Sharing account credentials, distributing unmasked databases, or reselling contact access to third parties is grounds for immediate, permanent account termination.
            </p>
            <p>
              <strong>Verification & Community Standards:</strong> GigLizard reserves the right to review, sanitize, or suspend accounts that provide fraudulent booking information, misrepresent band affiliations, or engage in unsolicited email marketing or abusive communications.
            </p>
          </section>

          {/* Section 4: Limitation of Liability & Booking Disclaimers */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-black text-emerald-400 uppercase tracking-wide">
              <Shield className="w-4 h-4 flex-shrink-0" />
              <h3>4. Limitation of Liability & Independent Booking Disclaimer</h3>
            </div>
            <p>
              GigLizard provides an independent planning workspace and communications directory designed to facilitate DIY show booking, technical communication, and tour routing. GigLizard is <strong>not</strong> a talent agency, booking promoter, venue owner, or employer:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-350">
              <li>
                <strong>Independent Transactions:</strong> All gig bookings, door splits, guarantees, contract agreements, hospitality arrangements, and performance agreements are entered into solely and independently between performers and venues.
              </li>
              <li>
                <strong>No Guarantee of Gigs or Revenue:</strong> We make no representations or guarantees that using the directory or software tools will result in confirmed gigs, ticket sales, or performance compensation.
              </li>
              <li>
                <strong>Disputes & Damages:</strong> GigLizard disclaims all liability for gig cancellations, weather interruptions, payment disputes, non-payment by venues or performers, equipment loss or damage, personal injury, or breach of performance contracts occurring at any venue.
              </li>
              <li>
                <strong>Venue Specifications:</strong> While we strive for accuracy, venue capacities, sound system specs (PAs, lighting), and age restrictions are subject to change by venue management. Artists must confirm critical technical rider needs directly with venue sound engineers.
              </li>
            </ul>
          </section>

          {/* Section 5: Termination & Modifications */}
          <section className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-black text-slate-350 uppercase tracking-wide">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <h3>5. Amendments & Governing Law</h3>
            </div>
            <p>
              GigLizard reserves the right to update or modify these Terms of Service at any time. Material changes will be noted with an updated effective date. Continued use of the platform after modifications constitutes binding acceptance of the updated terms. These terms are governed by the laws of the United States and the State of Washington.
            </p>
          </section>

          {/* Contact Support */}
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-slate-400 text-[11px]">
            For legal inquiries, copyright concerns, or permissions, contact our administration team at: <span className="font-mono text-indigo-300">littlerusty@gmail.com</span>.
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>© 2026 GigLizard. All rights reserved.</span>
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
              id="btn-agree-terms-modal"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Understand & Agree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
