import React from "react";
import { 
  X, Shield, Heart, MapPin, Music, Building, Users, 
  Sparkles, Award, CheckCircle2, Mail, ExternalLink, ShieldCheck 
} from "lucide-react";
import { FounderAvatar } from "./ProductPreviews";

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

        {/* Founder Header */}
        <div className="space-y-3 text-center md:text-left pr-8">
          <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-300 text-[11px] font-extrabold py-1 px-3 rounded-full border border-amber-500/30">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
            <span>Built by Little Rusty from Seattle</span>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <FounderAvatar size="lg" className="shrink-0" />
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                "I Built This Because Touring Shouldn't Be Gatekept"
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hi, I'm <strong>Little Rusty</strong> from Seattle, WA. I'm a working Pacific Northwest DIY musician and live audio engineer. I created GigLizard to solve the exact headaches I faced loading vans and booking club dates across the Northwest and nationwide.
              </p>
            </div>
          </div>
        </div>

        {/* Founder Letter Quote */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 md:p-5 space-y-2.5 text-xs text-slate-300 leading-relaxed italic">
          <p>
            "For years, indie bands have been forced to choose between stale, outdated venue spreadsheets or corporate middleman apps that charge $25 to $35 a month just to message a club promoter. That model bleeds touring bands dry."
          </p>
          <p>
            "My promise with GigLizard: <strong>Venue discovery is 100% free forever.</strong> Anyone can search 4,800+ music clubs, see sound specs, and book directly. The only small charge is a $9.99 30-day pass for band contacts — strictly to keep spam bots and scraper farms from harvesting our peers' inboxes."
          </p>
          <div className="pt-2 border-t border-slate-800 not-italic flex items-center justify-between text-[11px] text-slate-400 font-sans">
            <span className="font-bold text-amber-400">— Little Rusty, Creator & Musician</span>
            <span className="text-slate-400">Seattle, WA</span>
          </div>
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

        {/* Operator & Direct Contact Guarantee */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs">
          <h4 className="font-bold text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Direct Founder Contact Guarantee</span>
          </h4>
          <p className="text-slate-400 text-[11.5px] leading-relaxed">
            GigLizard is built and personally run by <strong>Little Rusty</strong> in Seattle, WA. No call centers, no outsourced support tickets. If you need a venue corrected, an account updated, or tour advice, reach out through our contact web form.
          </p>
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80 text-[11px]">
            <button
              type="button"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("open-contact-modal"));
              }}
              className="flex items-center gap-2 text-indigo-300 hover:text-white cursor-pointer transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Contact via Web Form</span>
            </button>
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
