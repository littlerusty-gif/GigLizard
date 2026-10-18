import React from "react";
import { 
  Sparkles, Calendar, CheckCircle2, ShieldCheck, MapPin, 
  ArrowRight, Users, Sliders, FileText, Compass, DollarSign 
} from "lucide-react";

interface ChangelogPageProps {
  onSelectTab: (tab: any) => void;
  onOpenRegister: () => void;
}

export default function ChangelogPage({ onSelectTab, onOpenRegister }: ChangelogPageProps) {
  const changelogEntries = [
    {
      version: "v2.6.0",
      date: "October 17, 2026",
      title: "Venue Contact Freshness Audit, /vs Comparison Matrix & Pricing Transparency",
      tag: "Major Release",
      tagColor: "bg-emerald-50 text-emerald-800 border-emerald-200",
      highlights: [
        "Human re-verification of 4,800+ independent music venues across all 48 Lower States and DC.",
        "Launched comprehensive 5-platform comparison suite against Sonicbids, Prism.fm, Gigwell, and spreadsheets.",
        "Renamed paid tier to 'Band Contacts 30-Day Pass' with explicit value-anchoring ('Less than the door split on a single gig').",
        "Added instant 7-day money-back satisfaction guarantee under all primary action flows.",
        "Upgraded Stage Plot Designer with printable PDF export and drag-and-drop monitor wedge layout."
      ]
    },
    {
      version: "v2.5.2",
      date: "September 28, 2026",
      title: "Interactive Tour Router & Van Fuel Budget Calculator",
      tag: "Feature Update",
      tagColor: "bg-indigo-50 text-indigo-800 border-indigo-200",
      highlights: [
        "Smart Google Maps distance and driving hour estimation between tour corridor cities.",
        "Automatic van fuel expenditure estimates based on average MPG and regional gas prices.",
        "Band-friendly lodging suggestions along major interstate touring corridors (I-5, I-90, I-80, I-10, I-95).",
        "Direct export of tour itineraries to crew email dispatch."
      ]
    },
    {
      version: "v2.4.0",
      date: "August 14, 2026",
      title: "Soundboard Patch List & Tech Rider Builder",
      tag: "New Tool",
      tagColor: "bg-purple-50 text-purple-800 border-purple-200",
      highlights: [
        "Standardized channel-by-channel patch list generator with mic preferences and DI box requirements.",
        "+48V phantom power toggles for condenser mics and active acoustic preamps.",
        "Stage hospitality guidelines and emergency sound engineer notes compiler.",
        "Instant one-click shareable public link for club audio crews."
      ]
    },
    {
      version: "v2.2.0",
      date: "July 2, 2026",
      title: "1,300+ Band Co-Bill Directory & Anti-Scraping Protection",
      tag: "Directory Milestone",
      tagColor: "bg-amber-50 text-amber-800 border-amber-200",
      highlights: [
        "Reached 1,300+ verified touring and regional bands available for shared show bills and co-promotions.",
        "Activated DOM email obfuscation and anti-scraping shield to protect musician inboxes from marketing spam.",
        "Introduced flat $9.99 30-day access pass with zero recurring billing traps."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 space-y-10 animate-fade-in" id="changelog-page-root">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-indigo-200">
          <Calendar className="w-3.5 h-3.5 text-indigo-600" />
          <span>Product Updates & Release Log</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
          GigLizard Changelog
        </h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          Dated updates, newly verified venues, and touring tools shipped for working DIY bands. Built and maintained in Seattle, WA by Little Rusty.
        </p>
      </div>

      {/* Changelog Timeline */}
      <div className="space-y-6">
        {changelogEntries.map((entry, idx) => (
          <article 
            key={idx}
            className="bg-white rounded-3xl border border-gray-200/90 p-6 md:p-8 space-y-4 shadow-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="font-mono font-black text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                  {entry.version}
                </span>
                <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${entry.tagColor}`}>
                  {entry.tag}
                </span>
              </div>
              <time className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                {entry.date}
              </time>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {entry.title}
            </h2>

            <ul className="space-y-2 pt-1 text-xs text-gray-700">
              {entry.highlights.map((item, itemIdx) => (
                <li key={itemIdx} className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* Call to Action Box */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 border border-slate-900 text-center space-y-4 shadow-xl">
        <h3 className="text-xl md:text-2xl font-black">
          Have an Idea or Encountered a Venue Contact Change?
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
          Email Little Rusty directly at <a href="mailto:littlerusty@gmail.com" className="text-indigo-400 font-mono hover:underline">littlerusty@gmail.com</a>. Every listing report is investigated and resolved within 24 hours.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab("venues")}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Search 4,800+ Free Venues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("pricing")}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800 cursor-pointer transition-all"
          >
            <span>View 30-Day Pass Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
