import React, { useState, useEffect } from "react";
import { Shield, Scale, Lock, Heart, CheckCircle2, X, Mail } from "lucide-react";
import ContactModal from "./ContactModal";

interface FooterProps {
  onOpenTerms: () => void;
  onOpenSecurity?: () => void;
  onOpenContact?: () => void;
  onOpenAbout?: () => void;
  onOpenGuarantee?: () => void;
  onOpenPricing?: () => void;
  onOpenCompare?: () => void;
  onOpenFeatures?: () => void;
  onOpenGuide?: () => void;
  onOpenChangelog?: () => void;
  userEmail?: string;
  userName?: string;
}

export default function Footer({ 
  onOpenTerms, 
  onOpenSecurity,
  onOpenContact,
  onOpenAbout,
  onOpenGuarantee,
  onOpenPricing,
  onOpenCompare,
  onOpenFeatures,
  onOpenGuide,
  onOpenChangelog,
  userEmail,
  userName
}: FooterProps) {
  const [showPrivacyNotice, setShowPrivacyNotice] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShowContactModal(true);
    window.addEventListener("open-contact-modal", handleOpen);
    return () => window.removeEventListener("open-contact-modal", handleOpen);
  }, []);

  const handleOpenContact = () => {
    if (onOpenContact) {
      onOpenContact();
    } else {
      setShowContactModal(true);
    }
  };

  return (
    <>
      <footer 
        className="border-t border-slate-800 bg-slate-950 text-slate-400 py-8 px-4 md:px-8 text-xs select-none" 
        id="main-footer"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          {/* Copyright & Core Identity */}
          <div className="space-y-1">
            <p className="font-bold text-slate-200 tracking-tight flex items-center justify-center md:justify-start gap-1.5" id="footer-copyright">
              <span>© 2026 GigLizard. All rights reserved.</span>
            </p>
            <p className="text-[11px] text-slate-400">
              Nationwide Independent Touring & Stage Directory (Lower 48). Stage plotting, routing, and booking workspace.
            </p>
            <p className="text-[11px] text-slate-400">
              Built & operated by <strong>Little Rusty</strong> • Portland, OR • <button type="button" onClick={handleOpenContact} className="text-indigo-400 hover:underline cursor-pointer">Contact Support via Web Form</button>
            </p>
            {/* Verification & Trust Signals (D3.5, D3.1) */}
            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-[11px]">
              <a
                href="https://www.trustpilot.com/review/giglizard.us"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
                title="Trustpilot Review Profile for GigLizard"
              >
                <span>Trustpilot Profile</span>
              </a>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-400 font-mono">
                <span>Directory Freshness Verified • Oct 2026</span>
              </span>
            </div>
          </div>

          {/* Legal Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-semibold" id="footer-legal-links">
            {onOpenPricing && (
              <>
                <a
                  href="/pricing"
                  onClick={(e) => { e.preventDefault(); onOpenPricing(); }}
                  className="text-slate-300 hover:text-emerald-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900 font-bold"
                  id="footer-btn-pricing"
                >
                  <span className="text-emerald-400 font-mono font-black">$</span>
                  <span>Pricing & Tiers</span>
                </a>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            {onOpenCompare && (
              <>
                <a
                  href="/compare"
                  onClick={(e) => { e.preventDefault(); onOpenCompare(); }}
                  className="text-slate-300 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900 font-bold"
                  id="footer-btn-compare"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Platform Comparison</span>
                </a>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            {onOpenFeatures && (
              <>
                <a
                  href="/features"
                  onClick={(e) => { e.preventDefault(); onOpenFeatures(); }}
                  className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
                  id="footer-btn-features"
                >
                  <span>Features</span>
                </a>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            {onOpenGuide && (
              <>
                <a
                  href="/touring-guide"
                  onClick={(e) => { e.preventDefault(); onOpenGuide(); }}
                  className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
                  id="footer-btn-guide"
                >
                  <span>DIY Tour Guide</span>
                </a>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            {onOpenAbout && (
              <>
                <a
                  href="/about"
                  onClick={(e) => { e.preventDefault(); onOpenAbout(); }}
                  className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
                  id="footer-btn-about-mission"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-400" />
                  <span>About & Mission</span>
                </a>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            {onOpenChangelog && (
              <>
                <a
                  href="/changelog"
                  onClick={(e) => { e.preventDefault(); onOpenChangelog(); }}
                  className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
                  id="footer-btn-changelog"
                >
                  <span>Changelog</span>
                </a>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            <a
              href="/customers"
              onClick={(e) => { e.preventDefault(); if (onOpenAbout) onOpenAbout(); }}
              className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
              id="footer-btn-case-studies"
            >
              <span>Case Studies</span>
            </a>
            <span className="text-slate-700 hidden sm:inline">•</span>

            <a
              href="/vs/sonicbids"
              onClick={(e) => { e.preventDefault(); if (onOpenCompare) onOpenCompare(); }}
              className="text-slate-500 hover:text-indigo-300 hover:underline transition-colors cursor-pointer py-1 px-1.5 text-[11px]"
            >
              vs Sonicbids
            </a>
            <span className="text-slate-800 hidden sm:inline">•</span>
            <a
              href="/vs/prism-fm"
              onClick={(e) => { e.preventDefault(); if (onOpenCompare) onOpenCompare(); }}
              className="text-slate-500 hover:text-indigo-300 hover:underline transition-colors cursor-pointer py-1 px-1.5 text-[11px]"
            >
              vs Prism.fm
            </a>
            <span className="text-slate-800 hidden sm:inline">•</span>
            <a
              href="/vs/gigwell"
              onClick={(e) => { e.preventDefault(); if (onOpenCompare) onOpenCompare(); }}
              className="text-slate-500 hover:text-indigo-300 hover:underline transition-colors cursor-pointer py-1 px-1.5 text-[11px]"
            >
              vs Gigwell
            </a>
            <span className="text-slate-700 hidden sm:inline">•</span>

            {onOpenGuarantee && (
              <>
                <button
                  type="button"
                  onClick={onOpenGuarantee}
                  className="text-slate-400 hover:text-emerald-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
                  id="footer-btn-satisfaction-guarantee"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>7-Day Guarantee</span>
                </button>
                <span className="text-slate-700 hidden sm:inline">•</span>
              </>
            )}

            <button
              type="button"
              onClick={onOpenTerms}
              className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
              id="footer-btn-terms-of-service"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-400" />
              <span>Terms of Service</span>
            </button>

            <span className="text-slate-700 hidden sm:inline">•</span>

            <button
              type="button"
              onClick={() => setShowPrivacyNotice(true)}
              className="text-slate-400 hover:text-emerald-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
              id="footer-btn-privacy-policy"
              title="View GigLizard Privacy Policy"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Privacy Policy</span>
            </button>

            {onOpenSecurity && (
              <>
                <span className="text-slate-700 hidden sm:inline">•</span>
                <button
                  type="button"
                  onClick={onOpenSecurity}
                  className="text-slate-400 hover:text-amber-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
                  id="footer-btn-security-shield"
                >
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Security & Anti-Scraping</span>
                </button>
              </>
            )}

            <span className="text-slate-700 hidden sm:inline">•</span>

            <button
              type="button"
              onClick={handleOpenContact}
              className="text-slate-400 hover:text-indigo-400 hover:underline transition-colors cursor-pointer flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-slate-900"
              id="footer-btn-contact-us"
              title="Send messages to giglizard.us@gmail.com"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>[Contact Us]</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Contact Us Support Modal */}
      <ContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        defaultEmail={userEmail}
        defaultName={userName}
      />

      {/* Lightweight Privacy Policy Modal Placeholder */}
      {showPrivacyNotice && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowPrivacyNotice(false)}
        >
          <div 
            className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">GigLizard Privacy Policy</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowPrivacyNotice(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-350 space-y-2.5 leading-relaxed">
              <p>
                <strong>Data Privacy Commitment:</strong> GigLizard strictly protects artist and venue data. We never sell, rent, or lease contact listings, booking emails, or private phone records to third-party data brokers or marketing services.
              </p>
              <p>
                <strong>Contact Information:</strong> Booking emails provided by artists are strictly used for verified show routing, talent inquiry, and venue co-billing within the GigLizard exchange. Contact info is protected behind 30-day authenticated subscriber access to defend against unsolicited bot harvesting.
              </p>
              <p>
                <strong>Payment Security:</strong> All subscription transactions are securely processed via standard 256-bit encrypted PayPal checkout pipelines. GigLizard never stores credit card or raw banking credentials on its servers.
              </p>
            </div>

            <div className="pt-2 flex justify-end border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowPrivacyNotice(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
              >
                Close Privacy Policy
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
