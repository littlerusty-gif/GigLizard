import React from "react";
import { 
  Building, ShieldCheck, Music, Users, Award, 
  Mail, MapPin, Sparkles, CheckCircle2, ArrowRight, Heart 
} from "lucide-react";
import { FounderAvatar } from "./ProductPreviews";

interface AboutPageProps {
  onSelectTab: (tab: any) => void;
  onOpenRegister: () => void;
}

export default function AboutPage({ onSelectTab, onOpenRegister }: AboutPageProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-fade-in" id="about-page-root">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-indigo-200">
          <Heart className="w-3.5 h-3.5 text-rose-500" />
          <span>The GigLizard Origin Story</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Built in the Pacific Northwest by Working DIY Musicians
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
          Independent live music touring shouldn't be gatekept behind $30/month corporate agency tools or dead-end scrapers.
        </p>
      </div>

      {/* Founder Spotlight Card */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 md:p-10 border border-slate-900 shadow-2xl relative overflow-hidden space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <FounderAvatar className="shrink-0" />
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                Rusty "Dr Hadit"
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/40 font-mono">Founder & Lead Engineer</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                Seattle, WA • Touring Musician & Sound Engineer
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 text-slate-300">
            <Mail className="w-4 h-4 text-indigo-400" />
            <span>Direct Line: <strong className="text-white font-mono">giglizard.us@gmail.com</strong></span>
          </div>
        </div>

        {/* First Person Founder Letter */}
        <div className="space-y-4 text-xs md:text-sm text-slate-300 leading-relaxed max-w-3xl">
          <p>
            <em>"I spent over twelve years loading tube amps and drum gear into vans across the Pacific Northwest and the country. Every tour started the same way: messy spreadsheets, dead venue websites, bouncing email addresses, and subscription platforms that charged $25 to $35 a month just to message a club booker who hadn't checked that portal in three years."</em>
          </p>
          <p>
            <em>"I built GigLizard with a very clear, stubborn philosophy: <strong>Musicians should never have to pay a toll just to discover live music venues.</strong> That's why our 4,800+ venue directory, stage plot builder, tech rider generator, and Google Maps van router are 100% free forever."</em>
          </p>
          <p>
            <em>"The only element with a small fee is our 30-day band contacts pass ($9.99). Why? Because band booking emails are sacred. If we made all band inboxes publicly scrapeable, marketing bot farms and spam agencies would flood our peers with junk. A flat 30-day pass defends musicians against scrapers, keeps inboxes clean, and funds human moderators who verify every room."</em>
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" />
            <span>Guaranteed support response within 4 hours</span>
          </div>
          <span className="text-slate-400 text-[11px]">GigLizard Independent Touring Network • Lower 48 + DC</span>
        </div>
      </div>

      {/* Core Principles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">100% Free Venue Discovery</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            All 4,800+ music clubs, dive bars, theaters, and listening rooms across all 48 lower states remain 100% free to search. No paywalls to view capacity, sound system specs, or direct booking emails.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">Anti-Scraping Bot Defense</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Band inboxes are protected with cryptographic proof-of-work and authenticated 30-day access passes to ensure only real touring musicians and genuine venue buyers reach your inbox.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center font-bold">
            <Music className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">Professional Stage Standards</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            House audio engineers love GigLizard bands because our standardized Stage Plot and Tech Rider generators ensure clear line checks, proper monitor mixes, and zero guesswork at soundcheck.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200/90 p-6 space-y-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-base font-black text-slate-900">Grassroots Co-Bill Community</h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            Over 1,300+ bands swap shows and trade dates. When touring bands pair up with local draws in every corridor city, both acts make more money and pack the room.
          </p>
        </div>
      </div>

      {/* CTA Footer */}
      <div className="text-center p-8 bg-indigo-50 rounded-3xl border border-indigo-100 space-y-4">
        <h3 className="text-xl font-black text-indigo-950">Join the Independent Touring Network</h3>
        <p className="text-xs text-indigo-800 max-w-md mx-auto">
          Create your free band, venue, or sound engineer profile today and get listed across all 48 lower states.
        </p>
        <button
          type="button"
          onClick={onOpenRegister}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
        >
          <span>Register Free Profile</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
