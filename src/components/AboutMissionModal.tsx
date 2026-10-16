import React from "react";
import { 
  X, Shield, Heart, MapPin, Music, Building, Users, 
  Sparkles, Award, CheckCircle2, Mail, ExternalLink, ShieldCheck 
} from "lucide-react";

interface AboutMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab?: (tab: "home" | "venues" | "plot" | "rider" | "poster" | "advisor" | "bands" | "tour" | "admin") => void;
}

export default function AboutMissionModal({ isOpen, onClose, onSelectTab }: AboutMissionModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-3xl max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 text-center md:text-left pr-8">
          <div className="inline-flex items-center gap-1.5 bg-indigo-500/15 text-indigo-300 text-[11px] font-extrabold py-1 px-3 rounded-full border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>The GigLizard Mission & Origin</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Built by Touring Musicians, for Independent Artists
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            GigLizard was founded in Seattle, WA by working DIY artists who experienced firsthand how broken, gatekept, and exhausting independent touring has become.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Building className="w-4 h-4" />
              <span>100% Free Venue Discovery</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              We believe independent bands should never have to pay a toll just to find out where to play. All 4,800+ music venue listings, direct booking addresses, and stage specs across all 48 lower states remain 100% free to search and explore.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Anti-Scraping Protection</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Band booking emails are sacred. To prevent commercial scrapers and bot farms from harvesting band inboxes, band contacts are protected behind human verification and an affordable 30-day access pass ($9.99).
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-bold">
              <Music className="w-4 h-4" />
              <span>Full Stage Production Suite</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Every touring act deserves professional representation. Our interactive Stage Plot Designer, Tech Rider Builder, and Gig Flyer Designer are fully free to generate, export, and deliver to venue sound technicians.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-rose-400 font-bold">
              <Users className="w-4 h-4" />
              <span>Grassroots Co-Bill Network</span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              The secret to successful DIY touring is teaming up with local acts who can pack their home room. GigLizard connects over 1,300+ bands eager to swap shows, share bills, and build lasting touring corridors.
            </p>
          </div>
        </div>

        {/* Operator & Transparency Disclosure */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Platform Operator & Contact Guarantee</span>
          </h4>
          <p className="text-slate-400 text-[11.5px] leading-relaxed">
            GigLizard is operated by the <strong>GigLizard Independent Touring Network</strong> based in Seattle, Washington (Pacific Northwest). We operate with a grassroots DIY ethos aligned with independent music community values.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Support: <strong className="text-white">giglizard.us@gmail.com</strong></span>
            </div>
            <span className="text-emerald-400 font-medium">Guaranteed response within 4 hours</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            Close Overview
          </button>
          {onSelectTab && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSelectTab("venues");
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
            >
              <span>Explore Free Venues</span>
              <Building className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
