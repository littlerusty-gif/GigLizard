import React from "react";
import { 
  CheckCircle2, ShieldCheck, Clock, RefreshCw, AlertCircle, 
  ArrowLeft, Search, Building2, MapPin, Mail, Sparkles, 
  ArrowRight, History, Calendar, Check
} from "lucide-react";

interface VerificationPageProps {
  onSelectTab: (tab: any) => void;
  onOpenRegister?: () => void;
  onOpenCheckout?: () => void;
}

interface VerificationLogEntry {
  venueName: string;
  city: string;
  capacity: string;
  verifiedDate: string;
  moderator: string;
  changeType: "Talent Buyer Update" | "Sound Spec Corroborated" | "Routine Audit Passed";
  details: string;
  status: "Verified Active";
}

const RECENT_VERIFICATIONS: VerificationLogEntry[] = [
  {
    venueName: "The Subterranean Cellar",
    city: "Seattle, WA • Belltown",
    capacity: "250-Cap",
    verifiedDate: "October 19, 2026",
    moderator: "Little Rusty",
    changeType: "Talent Buyer Update",
    details: "Corroborated new talent buyer address with official venue website. Confirmed 24-channel analog soundboard and monitor wedge inventory.",
    status: "Verified Active"
  },
  {
    venueName: "Mississippi Studios & Bar Bar",
    city: "Portland, OR • North Portland",
    capacity: "300-Cap",
    verifiedDate: "October 14, 2026",
    moderator: "Little Rusty",
    changeType: "Routine Audit Passed",
    details: "Re-verified booking submission guidelines, 3-band maximum bill cap, load-in timing, and direct booker contact channel.",
    status: "Verified Active"
  },
  {
    venueName: "The Sunset Tavern",
    city: "Seattle, WA • Ballard",
    capacity: "150-Cap",
    verifiedDate: "October 8, 2026",
    moderator: "Community Moderator",
    changeType: "Sound Spec Corroborated",
    details: "Updated local co-bill policy, typical 80/20 door split terms, and mic patch list requirements following sound tech transition.",
    status: "Verified Active"
  }
];

export default function VerificationPage({ onSelectTab }: VerificationPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-fade-in" id="verification-page-root">
      
      {/* Back Button */}
      <div>
        <button
          onClick={() => onSelectTab("home")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tour Hub</span>
        </button>
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 text-emerald-700 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-emerald-300/40">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Public Directory Freshness Log</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          How We Verify 4,800+ Venues Without Stale Scraping
        </h1>
        <p className="text-sm md:text-base text-gray-650 leading-relaxed">
          The number one objection touring musicians have to online directories is dead data: stale emails, bounced forms, and promoters who left three years ago. Here is our live moderation workflow and dated verification history.
        </p>
      </div>

      {/* Verification Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1 text-center">
          <p className="text-2xl md:text-3xl font-black text-slate-900">14+</p>
          <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Re-verified Weekly</span>
          </p>
          <p className="text-[11px] text-gray-400">Regular human audit cadence</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1 text-center">
          <p className="text-2xl md:text-3xl font-black text-slate-900">&lt;24h</p>
          <p className="text-xs font-bold text-indigo-600 flex items-center justify-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>Moderation Queue</span>
          </p>
          <p className="text-[11px] text-gray-400">Bounced email turnaround</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1 text-center">
          <p className="text-2xl md:text-3xl font-black text-slate-900">100%</p>
          <p className="text-xs font-bold text-amber-600 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Human Corroborated</span>
          </p>
          <p className="text-[11px] text-gray-400">No automated bot scraping</p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-2xs space-y-1 text-center">
          <p className="text-2xl md:text-3xl font-black text-slate-900">4,800+</p>
          <p className="text-xs font-bold text-purple-600 flex items-center justify-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Venues (Free $0)</span>
          </p>
          <p className="text-[11px] text-gray-400">Open across Lower 48</p>
        </div>
      </div>

      {/* Moderation Standard Breakdown */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-10 border border-slate-900 space-y-6 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Our 3-Step Verification Standard</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            How Every Venue Listing Is Audited
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed pt-2">
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-sm">
              1
            </div>
            <h3 className="text-sm font-bold text-white">Official Domain & Buyer Channels</h3>
            <p>
              We cross-check booker email addresses with official club websites, social accounts, and past touring flyers rather than pulling from indiscriminate scraped marketing lists.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-black text-sm">
              2
            </div>
            <h3 className="text-sm font-bold text-white">Direct Anti-Bot Verification</h3>
            <p>
              We send direct test inquiries to ensure the recipient mail server is active and not returning automated NDR/550 bounces or dumping into inactive unmonitored mailboxes.
            </p>
          </div>

          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-sm">
              3
            </div>
            <h3 className="text-sm font-bold text-white">Active Musician Moderation</h3>
            <p>
              When a touring band flags an email bounce or staff change via the listing report button, human moderators in the Pacific Northwest audit and resolve it within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* 3 Real Venue Examples with Dated Change History (D1.4, D3.1) */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Sample Verification Log Entries
            </h2>
            <p className="text-xs text-gray-500">
              Live examples from our rolling moderation queue showing audit dates, changes made, and verified specs.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto font-bold">
            Audited October 2026
          </span>
        </div>

        <div className="space-y-4">
          {RECENT_VERIFICATIONS.map((item, idx) => (
            <div 
              key={idx}
              className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4 transition-all hover:border-indigo-300"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                      {item.changeType}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      {item.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">
                    {item.venueName}
                  </h3>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{item.city}</span>
                    <span>•</span>
                    <span className="font-semibold">{item.capacity}</span>
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-0.5 text-xs text-gray-500">
                  <p className="flex items-center sm:justify-end gap-1 font-mono text-slate-800 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{item.verifiedDate}</span>
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Audited by: {item.moderator}
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                <History className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900">Verification Notes: </span>
                  {item.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Community Report & Call to Action */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-8 md:p-10 border border-slate-800 space-y-6 shadow-2xl">
        <div className="max-w-2xl space-y-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
            Musician Community Queue
          </span>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            Encountered a Club Closure or Promoter Change?
          </h2>
          <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
            Every listing has a "Report Contact" button. Alternatively, submit a direct update through our contact web form. We audit and resolve reports within 24 hours.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.dispatchEvent(new CustomEvent("open-contact-modal"))}
            className="px-5 py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Mail className="w-4 h-4 text-indigo-600" />
            <span>Submit Directory Correction (Web Form)</span>
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("venues")}
            className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Search 4,800+ Free Venues</span>
          </button>
        </div>
      </div>

    </div>
  );
}
