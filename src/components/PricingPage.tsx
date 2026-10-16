import React, { useState } from "react";
import { 
  Building, Users, Check, CreditCard, ShieldCheck, CheckCircle2, 
  RotateCcw, Sparkles, ChevronDown, ChevronUp, Lock, ArrowRight, HelpCircle, DollarSign 
} from "lucide-react";
import { UserAccount } from "../types";
import SatisfactionGuaranteeModal from "./SatisfactionGuaranteeModal";

interface PricingPageProps {
  currentAccount: UserAccount | null;
  onSelectTab: (tab: any) => void;
  onOpenCheckout: () => void;
  onOpenRegister: () => void;
}

const FAQS = [
  {
    q: "How often are venue booking emails and contacts verified?",
    a: "Every venue listing in our 4,800+ directory is curated and verified by human moderators who corroborate live booking addresses with official venue websites, talent buyer submission channels, and past touring itineraries. When a club changes management or emails bounce, our anti-bot audit flags it immediately for verification."
  },
  {
    q: "How are bands added to the co-bill directory?",
    a: "Active bands register directly or claim their profile with their official booking contact, hometown, genres, and EPK/music links. Each profile is scanned for spam to ensure genuine touring artists seeking co-bills and shared shows across the Lower 48."
  },
  {
    q: "What happens if a booking contact bounces or changes?",
    a: "We maintain an active moderation queue. If you ever encounter an invalid email, click 'Report Contact' on the listing or email giglizard.us@gmail.com. We investigate within 24 hours, update the verified booker address, and notify you directly."
  },
  {
    q: "Is the $9.99 pass a recurring subscription or a one-time purchase?",
    a: "The $9.99 pass is a flat 30-day access key with zero recurring auto-billing traps. You are never quietly billed next month. You only renew when actively preparing your next tour run."
  },
  {
    q: "What is the 100% Artist Satisfaction Guarantee?",
    a: "We offer a 7-day hassle-free money-back refund. If you purchase a 30-day pass and cannot find active bands or bookable venues along your route, simply email giglizard.us@gmail.com within 7 days for an immediate 100% refund."
  },
  {
    q: "Why are venue listings 100% free while band contacts have a pass fee?",
    a: "We believe independent artists should never pay a toll to discover live music rooms. Band booking emails, however, are shielded behind human authentication and an affordable 30-day pass to protect musician inboxes from commercial web scrapers and automated marketing bots."
  }
];

export default function PricingPage({
  currentAccount,
  onSelectTab,
  onOpenCheckout,
  onOpenRegister
}: PricingPageProps) {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [showGuaranteeModal, setShowGuaranteeModal] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-fade-in" id="pricing-page-root">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-emerald-300/40">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Simple, Honest, Musician-First Pricing</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Access to Venues - FREE<br />
          <span className="text-indigo-600">Access to Band Contacts - $9.99</span>
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
          Venue discovery and our complete stage-production tool suite are 100% free forever. Pay only for unmasked band booking contacts when you're actively routing a tour.
        </p>
      </div>

      {/* Two Tier Comparison Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* Tier 1: Free Forever */}
        <div className="bg-white rounded-3xl border border-gray-200/90 p-7 md:p-8 space-y-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <span className="font-black text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Building className="w-4 h-4 text-emerald-600" />
                  Free Core Tier
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1">$0 <span className="text-xs text-gray-500 font-normal">/ forever</span></p>
              </div>
              <span className="text-xs font-black text-emerald-700 bg-emerald-50 py-1 px-3 rounded-full border border-emerald-200">
                Free Account
              </span>
            </div>

            <ul className="space-y-3 text-xs text-gray-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>4,800+ Independent Venues:</strong> Browse all live stages across the Lower 48 with complete addresses and booking emails for free.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Smart Tour Planner:</strong> Google Maps route calculation, drive times, corridor cities, and gas estimators.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Stage Plot Designer:</strong> Drag-and-drop gear layout canvas with instant PNG/PDF export.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Tech Rider Builder:</strong> Formatted soundboard patch list, mic choices, and +48V toggles.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Concert Poster Designer:</strong> Halftone retro flyers and custom gig announcements.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Public Directory Listing:</strong> Register your band, venue, or sound engineer profile for free.</span>
              </li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onSelectTab("venues")}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Start Exploring Venues for Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tier 2: 30-Day Band Pass */}
        <div className="bg-white rounded-3xl border-2 border-amber-400 p-7 md:p-8 space-y-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[10px] font-black uppercase px-4 py-1 rounded-bl-xl tracking-wider shadow-xs">
            Most Popular
          </div>

          <div className="space-y-5">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <div>
                <span className="font-black text-slate-900 uppercase text-xs tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-500" />
                  Band Contacts Pass
                </span>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  $9.99 <span className="text-xs text-gray-500 font-normal">/ 30-day pass</span>
                </p>
                <p className="text-[10.5px] text-gray-400 font-mono mt-0.5">+$0.84 secure processor fee = $10.83 total</p>
              </div>
              <span className="text-xs font-black text-amber-900 bg-amber-50 py-1 px-3 rounded-full border border-amber-300">
                Single Pass
              </span>
            </div>

            <ul className="space-y-3 text-xs text-gray-700">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>1,300+ Verified Band Contacts:</strong> Unmask direct booking emails, manager contacts, EPKs, and listen links.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Co-Bill & Shared Show Outreach:</strong> Swap shows with established local acts in your tour cities to pack rooms.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Filtered City & Genre Matching:</strong> Instantly find compatible acts across all 48 lower states + DC.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Zero Recurring Traps:</strong> Flat 30-day pass that never quietly auto-renews unless you ask it to.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-500 font-bold shrink-0 mt-0.5" />
                <span><strong>Instant Pass Activation:</strong> Contacts unlock immediately upon checkout with no delay.</span>
              </li>
            </ul>
          </div>

          <div className="space-y-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                if (currentAccount) {
                  onOpenCheckout();
                } else {
                  onOpenRegister();
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-amber-400 via-amber-500 to-amber-400 hover:from-amber-500 hover:to-amber-500 text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>Unlock 30-Day Pass ($9.99)</span>
            </button>

            {/* Value Anchor Line */}
            <p className="text-[11px] text-gray-500 font-medium text-center leading-relaxed">
              One pass covers your whole tour run - every booking contact, every corridor city, no renewal unless you ask for one.
            </p>

            <div className="flex items-center justify-between text-[11px] text-gray-500 px-1 pt-1">
              <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> 7-Day Money-Back Guarantee
              </span>
              <button
                type="button"
                onClick={() => setShowGuaranteeModal(true)}
                className="text-indigo-600 hover:underline font-bold text-[10.5px] cursor-pointer"
              >
                Guarantee Details →
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Payment Trust Badges Strip */}
      <div className="max-w-4xl mx-auto bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-black text-sm text-white">Bank-Grade 256-Bit SSL Checkout</h4>
            <p className="text-xs text-slate-400 mt-0.5">Encrypted merchant pipeline processed via PayPal & Stripe. Zero credentials stored on server.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-bold text-slate-300">
          <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">Visa</span>
          <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">Mastercard</span>
          <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">Amex</span>
          <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">Discover</span>
          <span className="px-2.5 py-1 bg-indigo-900/60 text-indigo-300 rounded-lg border border-indigo-700/60">PayPal</span>
          <span className="px-2.5 py-1 bg-slate-800 rounded-lg border border-slate-700">Apple Pay</span>
        </div>
      </div>

      {/* FAQ Section: Answering Data Freshness & Renewal Objections */}
      <div className="max-w-3xl mx-auto space-y-6 pt-4" id="pricing-faq">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-indigo-200">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transparency & Verification FAQ</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-gray-500 max-w-lg mx-auto">
            Everything you need to know about directory verification, renewal terms, and our refund guarantee.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div 
                key={idx}
                className="bg-white rounded-2xl border border-gray-200/90 overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                  className="w-full p-4 md:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs md:text-sm text-slate-900 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 md:px-5 pb-5 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Satisfaction Guarantee Modal */}
      <SatisfactionGuaranteeModal
        isOpen={showGuaranteeModal}
        onClose={() => setShowGuaranteeModal(false)}
        onOpenCheckout={onOpenCheckout}
      />
    </div>
  );
}
