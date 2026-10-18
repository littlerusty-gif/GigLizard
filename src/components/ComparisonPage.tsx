import React, { useState } from "react";
import { 
  Check, X, Sparkles, Building, Users, ShieldCheck, 
  ArrowRight, Scale, DollarSign, Clock, HelpCircle, Heart,
  FileSpreadsheet, Zap, AlertTriangle, Layers, Award,
  ChevronDown, ChevronUp, ExternalLink, ShieldAlert, BarChart3,
  CheckCircle2, Compass, Sliders, FileText, Image
} from "lucide-react";

interface ComparisonPageProps {
  onSelectTab: (tab: any) => void;
  onOpenCheckout: () => void;
  onOpenRegister: () => void;
}

export default function ComparisonPage({ 
  onSelectTab, 
  onOpenCheckout, 
  onOpenRegister 
}: ComparisonPageProps) {
  const [activeCompetitorFilter, setActiveCompetitorFilter] = useState<"all" | "diy" | "enterprise">("all");
  const [showStatusQuoSpreadsheet, setShowStatusQuoSpreadsheet] = useState(true);
  const [annualToursPlanned, setAnnualToursPlanned] = useState<number>(2);

  // Cost calculation based on tours planned per year (each tour requires a 30-day pass = $9.99)
  const gigLizardAnnualCost = annualToursPlanned * 9.99;
  const sonicbidsAnnualCost = 240; // ~$20/mo recurring
  const gigwellAnnualCost = 396; // $33/mo billed annually
  const prismEstimatedCost = 1200; // Enterprise demo quote baseline

  const getInitialCompetitor = (): "all" | "sonicbids" | "prism" | "gigwell" => {
    try {
      const path = typeof window !== "undefined" ? window.location.pathname.toLowerCase() : "";
      if (path.includes("sonicbids")) return "sonicbids";
      if (path.includes("prism")) return "prism";
      if (path.includes("gigwell")) return "gigwell";
    } catch (_) {}
    return "all";
  };
  const [activeVsSlug, setActiveVsSlug] = useState<"all" | "sonicbids" | "prism" | "gigwell">(getInitialCompetitor);

  const handleSelectSlug = (slug: "all" | "sonicbids" | "prism" | "gigwell") => {
    setActiveVsSlug(slug);
    try {
      const targetPath = slug === "all" ? "/compare" : `/vs/${slug === "prism" ? "prism-fm" : slug}`;
      window.history.pushState(null, "", targetPath);
    } catch (_) {}
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-fade-in" id="comparison-page-root">
      
      {/* Competitor /vs Subroute Navigation Pills (D5.3, D1.4) */}
      <div className="flex flex-wrap items-center justify-center gap-2 pb-2 border-b border-gray-200">
        <button
          type="button"
          onClick={() => handleSelectSlug("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeVsSlug === "all"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
          }`}
        >
          All Competitors Overview
        </button>
        <button
          type="button"
          onClick={() => handleSelectSlug("sonicbids")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVsSlug === "sonicbids"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          <span>vs Sonicbids</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">Pay-to-Apply Rival</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectSlug("prism")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVsSlug === "prism"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          <span>vs Prism.fm</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">Enterprise Venue Leader</span>
        </button>
        <button
          type="button"
          onClick={() => handleSelectSlug("gigwell")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeVsSlug === "gigwell"
              ? "bg-indigo-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600"
          }`}
        >
          <span>vs Gigwell</span>
          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded-full font-mono">$33/mo Agency Software</span>
        </button>
      </div>

      {/* Dedicated 1-on-1 Sonicbids Comparison Hero & Deep Dive */}
      {activeVsSlug === "sonicbids" && (
        <section className="bg-white rounded-3xl border-2 border-indigo-200 p-6 md:p-10 space-y-8 shadow-md" id="vs-sonicbids-panel">
          <div className="space-y-3">
            <span className="text-xs uppercase font-black tracking-widest text-indigo-600 font-mono">
              Direct ICP Comparison • Self-Serve Booking
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              GigLizard vs Sonicbids: Stop Paying to Apply for Gigs
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Sonicbids charges independent musicians $20 to $35/month recurring just to maintain an EPK and apply to shows. <strong>GigLizard gives you direct booking emails and technical specs for 4,800+ independent venues 100% free forever.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-emerald-200">
                <span className="font-black text-emerald-950 text-base">GigLizard Advantage</span>
                <span className="bg-emerald-600 text-white font-black px-2.5 py-0.5 rounded-full text-[11px]">$0 Free Core / $9.99 Pass</span>
              </div>
              <ul className="space-y-2 text-emerald-950">
                <li className="flex items-start gap-2">✓ <strong>Free Venue Discovery:</strong> 4,800+ clubs & theaters with verified talent buyer emails for $0 forever.</li>
                <li className="flex items-start gap-2">✓ <strong>No Application Fees:</strong> Message club bookers directly without middleman tolls or pay-to-play barriers.</li>
                <li className="flex items-start gap-2">✓ <strong>Full Stage Toolkit:</strong> Interactive drag-and-drop stage plots, dynamic patch lists, and van route gas estimators included for $0.</li>
                <li className="flex items-start gap-2">✓ <strong>Zero Recurring Auto-Renewals:</strong> Flat $9.99 30-day pass only for unmasked co-bill band contacts. Automatically expires after 30 days.</li>
              </ul>
            </div>

            <div className="bg-rose-50/70 border border-rose-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                <span className="font-black text-rose-950 text-base">Sonicbids Drawbacks</span>
                <span className="bg-rose-600 text-white font-black px-2.5 py-0.5 rounded-full text-[11px]">$240 - $420 / year</span>
              </div>
              <ul className="space-y-2 text-rose-950">
                <li className="flex items-start gap-2">✕ <strong>Paywalled Discovery:</strong> Forces bands into recurring subscriptions before they can even view submission details.</li>
                <li className="flex items-start gap-2">✕ <strong>Pay-to-Apply Friction:</strong> Submitting to festivals and clubs often requires extra application fees with no reply guarantee.</li>
                <li className="flex items-start gap-2">✕ <strong>No Tour Production Tools:</strong> Zero stage plot designers, no soundboard channel sheets, and no driving route calculators.</li>
                <li className="flex items-start gap-2">✕ <strong>Quiet Subscription Traps:</strong> Billed monthly or annually even during off-tour rehearsal months.</li>
              </ul>
            </div>
          </div>

          {/* Sonicbids FAQ Block (D1.4, D5.3) */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-black text-slate-900">Frequently Asked Questions: GigLizard vs Sonicbids</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Why are GigLizard venue listings free while Sonicbids charges monthly?</h4>
                <p className="text-slate-600">We believe independent artists should never pay a toll to discover live music venues. We provide 4,800+ music clubs, dive bars, theaters, and listening rooms 100% free.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Does GigLizard charge submission fees to pitch a room?</h4>
                <p className="text-slate-600">Never. You contact the venue talent buyer directly at their official booking address. There are zero submission fees, cut percentages, or portal lock-ins.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Can I export professional stage plots with Sonicbids?</h4>
                <p className="text-slate-600">No. Sonicbids only hosts an EPK. GigLizard includes drag-and-drop gear canvas, monitor wedge mapping, and tech rider patch list PDF exports for $0.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Is the $9.99 GigLizard pass a recurring monthly charge?</h4>
                <p className="text-slate-600">No. The $9.99 pass is a single 30-day access key with zero recurring auto-billing traps. You are never quietly billed next month.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dedicated 1-on-1 Prism.fm Comparison Hero & Deep Dive */}
      {activeVsSlug === "prism" && (
        <section className="bg-white rounded-3xl border-2 border-slate-300 p-6 md:p-10 space-y-8 shadow-md" id="vs-prism-panel">
          <div className="space-y-3">
            <span className="text-xs uppercase font-black tracking-widest text-slate-600 font-mono">
              Enterprise vs DIY Comparison
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              GigLizard vs Prism.fm: Built for DIY Bands, Not Arenas
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Prism.fm is the category leader for multi-seat venue operators, arena promoters, and box offices. <strong>GigLizard is built for the self-booked touring band on the other side of the booking desk with transparent sub-$10 pricing and pro stage tools for $0.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <span className="font-black text-emerald-950 text-base block pb-3 border-b border-emerald-200">GigLizard: Built for Touring Bands</span>
              <ul className="space-y-2 text-emerald-950">
                <li className="flex items-start gap-2">✓ <strong>Instant Self-Serve Access:</strong> No sales demos, no multi-week onboarding, no annual enterprise contracts.</li>
                <li className="flex items-start gap-2">✓ <strong>$0 DIY Touring Suite:</strong> Stage plots, channel patch lists, van fuel routing, and gig posters included for $0.</li>
                <li className="flex items-start gap-2">✓ <strong>Flat $9.99 Pass:</strong> Flat 30-day access to 1,300+ co-bill band contacts.</li>
              </ul>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-6 space-y-4">
              <span className="font-black text-slate-900 text-base block pb-3 border-b border-slate-300">Prism.fm: Built for Venue Promoters</span>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">✕ <strong>Sales-Gated Pricing:</strong> Requires scheduling an enterprise sales demo. Multi-thousand dollar annual contracts.</li>
                <li className="flex items-start gap-2">✕ <strong>Promoter Focused:</strong> Built to settle ticket revenue and box office spreadsheets, not help DIY bands route a van.</li>
                <li className="flex items-start gap-2">✕ <strong>No Artist Tooling:</strong> No stage plot builder, no van route fuel calculator, and no co-bill band directory.</li>
              </ul>
            </div>
          </div>

          {/* Prism FAQ Block */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-black text-slate-900">Frequently Asked Questions: GigLizard vs Prism.fm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Can an independent touring band sign up for Prism.fm directly?</h4>
                <p className="text-slate-600">No. Prism requires an enterprise sales demo and quotes contracts geared towards multi-room venue promoters and festivals.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Do sound engineers prefer GigLizard stage plots?</h4>
                <p className="text-slate-600">Yes. Prism treats riders as static file uploads. GigLizard generates standardized channel-by-channel patch lists with mic choices and +48V phantom power switches.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Dedicated 1-on-1 Gigwell Comparison Hero & Deep Dive */}
      {activeVsSlug === "gigwell" && (
        <section className="bg-white rounded-3xl border-2 border-slate-300 p-6 md:p-10 space-y-8 shadow-md" id="vs-gigwell-panel">
          <div className="space-y-3">
            <span className="text-xs uppercase font-black tracking-widest text-slate-600 font-mono">
              Agency Software vs DIY Workspace
            </span>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight">
              GigLizard vs Gigwell: Free DIY Tooling vs $33/mo Contracts
            </h1>
            <p className="text-xs md:text-sm text-slate-600 max-w-3xl leading-relaxed">
              Gigwell targets talent agencies and booking agents with $33/month contracts billed strictly annually ($396 upfront). <strong>GigLizard gives self-booked bands free venue discovery and a flat $9.99 30-day pass with zero annual lock-in.</strong>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-6 space-y-4">
              <span className="font-black text-emerald-950 text-base block pb-3 border-b border-emerald-200">GigLizard: $0 Core & $9.99 Pass</span>
              <ul className="space-y-2 text-emerald-950">
                <li className="flex items-start gap-2">✓ <strong>No Annual Lock-In:</strong> Buy a single 30-day pass ($9.99) only when actively booking a tour run.</li>
                <li className="flex items-start gap-2">✓ <strong>100% Free Stage Tools:</strong> Drag-and-drop stage plot designer, tech rider compiler, and flyer maker bundled for $0.</li>
                <li className="flex items-start gap-2">✓ <strong>4,800+ Venue Directory:</strong> Search clubs across all 48 continental states with verified booking contacts.</li>
              </ul>
            </div>

            <div className="bg-slate-100 border border-slate-300 rounded-2xl p-6 space-y-4">
              <span className="font-black text-slate-900 text-base block pb-3 border-b border-slate-300">Gigwell: $33/mo ($396/year upfront)</span>
              <ul className="space-y-2 text-slate-700">
                <li className="flex items-start gap-2">✕ <strong>Annual Commitment:</strong> Entry tier requires $396 paid upfront; no low-cost single-tour pass.</li>
                <li className="flex items-start gap-2">✕ <strong>Agency Roster Focused:</strong> Built to manage agency contracts and artist rosters, not DIY van routing.</li>
                <li className="flex items-start gap-2">✕ <strong>No Free Public Directory:</strong> Does not offer a free public directory of independent live music venues.</li>
              </ul>
            </div>
          </div>

          {/* Gigwell FAQ Block */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="text-lg font-black text-slate-900">Frequently Asked Questions: GigLizard vs Gigwell</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Can I pay month-to-month on Gigwell?</h4>
                <p className="text-slate-600">No. Gigwell's published pricing is billed annually upfront. GigLizard only charges $9.99 for 30 days when you are booking a tour run.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl space-y-1">
                <h4 className="font-bold text-slate-900">Does Gigwell build stage plots or tech riders?</h4>
                <p className="text-slate-600">Gigwell focuses on agency contracts and invoicing. GigLizard includes drag-and-drop stage plots and soundboard patch lists for $0.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero / Market Landscape Header (Shown when viewing all alternatives) */}
      {activeVsSlug === "all" && (
      <div className="text-center max-w-4xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-800 text-xs font-black uppercase tracking-wider px-4 py-1.5 rounded-full border border-indigo-200">
          <Scale className="w-4 h-4 text-indigo-600" />
          <span>2026 Live Music Operations & Booking Landscape</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          How GigLizard Compares to Every Alternative
        </h1>
        <p className="text-xs md:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
          Prism.fm leads the live-music operations category at scale (10,000+ venues claimed); Gigwell and Muzeek serve agents and mid-size operators; Sonicbids is the closest self-serve rival for DIY bands; TYFRA is an emerging all-in-one; spreadsheets remain the default. <strong>GigLizard undercuts all of them on price and gives DIY bands stage-production tools for $0.</strong>
        </p>

        {/* Quick Jump Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 text-xs">
          <a 
            href="#comparison-matrix" 
            className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
            <span>5-Platform Matrix</span>
          </a>
          <a 
            href="#spotlight-pair" 
            className="px-3.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl font-bold hover:bg-indigo-100 transition-all flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>Spotlight: Sonicbids vs Prism.fm</span>
          </a>
          <a 
            href="#cost-calculator" 
            className="px-3.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5"
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Cost Savings Calculator</span>
          </a>
        </div>
      </div>
      )}

      {/* 4 Strategic Positions We Own */}
      <section className="space-y-4">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">The GigLizard Advantage</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Four Positions No Competitor Can Touch
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Pillar 1 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 space-y-3 shadow-xs hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center font-black text-base">
              $9.99
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Only Sub-$10 Touring Toolkit</h3>
              <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">
                Leveraged against Prism's enterprise demo barrier and Gigwell's $33/mo ($396/yr) annual-only contracts. Built for real working acts, not agency budgets.
              </p>
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 space-y-3 shadow-xs hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center font-black text-base">
              $0
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Free-Forever Venue Discovery</h3>
              <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">
                Leveraged against Sonicbids' subscription paywall. Browse 4,800+ verified clubs with direct booking inboxes without spending a cent.
              </p>
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 space-y-3 shadow-xs hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-black text-base">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Integrated Stage & Rider Suite</h3>
              <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">
                Muzeek and TYFRA treat riders as static attachments. GigLizard bundles an interactive drag-and-drop stage canvas, patch list, and flyer maker for $0.
              </p>
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-white rounded-2xl border border-gray-200/90 p-5 space-y-3 shadow-xs hover:border-indigo-300 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-black text-base">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-sm">Zero Recurring Auto-Renew Traps</h3>
              <p className="text-[11.5px] text-gray-500 mt-1 leading-relaxed">
                A single 30-day pass that automatically expires. You only purchase when you're actively routing dates. No zombie subscriptions draining your bank account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Complete 5-Column Comparison Matrix */}
      <section className="space-y-5 scroll-mt-20" id="comparison-matrix">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-700 text-[10.5px] font-black uppercase tracking-wider">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Full Category Benchmark</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Live Music Operations Comparison Matrix
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Across 10 core dimensions: positioning, pricing, entry cost, trust spine, and stage tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowStatusQuoSpreadsheet(!showStatusQuoSpreadsheet)}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 ${
                showStatusQuoSpreadsheet 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>{showStatusQuoSpreadsheet ? "Hide Spreadsheets" : "Include Spreadsheets"}</span>
            </button>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="bg-white rounded-3xl border border-gray-200/90 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                  <th className="py-4 px-5 w-44">Dimension</th>
                  <th className="py-4 px-5 bg-indigo-600 text-white font-black w-56 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span>GigLizard</span>
                      <span className="text-[9px] uppercase bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-mono">You Are Here</span>
                    </div>
                  </th>
                  <th className="py-4 px-5 text-slate-900 font-extrabold w-48">
                    Prism.fm <span className="block text-[10px] text-gray-500 font-normal">Competitor B (Scale Leader)</span>
                  </th>
                  <th className="py-4 px-5 text-slate-900 font-extrabold w-48">
                    Gigwell <span className="block text-[10px] text-gray-500 font-normal">Agency Workflow</span>
                  </th>
                  <th className="py-4 px-5 text-slate-900 font-extrabold w-48">
                    Muzeek <span className="block text-[10px] text-gray-500 font-normal">Paperwork & Settlements</span>
                  </th>
                  <th className="py-4 px-5 text-slate-900 font-extrabold w-48">
                    Sonicbids <span className="block text-[10px] text-indigo-600 font-semibold">Competitor A (Closest ICP)</span>
                  </th>
                  {showStatusQuoSpreadsheet && (
                    <th className="py-4 px-5 text-slate-700 font-extrabold w-44 bg-slate-100/70">
                      Spreadsheets <span className="block text-[10px] text-gray-500 font-normal">Status Quo</span>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150">
                {/* 1. Category Positioning */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Category Positioning
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 font-bold text-indigo-900">
                    DIY band booking + full stage touring toolkit
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Venue & promoter live operations platform
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    End-to-end booking management for agents
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Booking confirmations, paperwork & settlements
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Gig-finding marketplace & pay-to-submit EPK
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-500 italic bg-slate-50/30">
                      Manual DIY tour tabs & email copy-pasting
                    </td>
                  )}
                </tr>

                {/* 2. Hero Headline */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Hero Headline (h1)
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 font-bold text-indigo-950">
                    “Connecting Rising Performers & Music Venues”
                  </td>
                  <td className="py-3.5 px-5 text-gray-650 italic">
                    “Run a More Powerful, Profitable Live Events Business”
                  </td>
                  <td className="py-3.5 px-5 text-gray-650 italic">
                    “The First End-to-End Booking Management Platform for Artists”
                  </td>
                  <td className="py-3.5 px-5 text-gray-650 italic">
                    “Where the modern live music industry works”
                  </td>
                  <td className="py-3.5 px-5 text-gray-400 italic">
                    (Paid EPK / Gig submission hero)
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-400 italic bg-slate-50/30">
                      “Untitled spreadsheet.xlsx”
                    </td>
                  )}
                </tr>

                {/* 3. Hero Subhead */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Hero Subhead
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 text-indigo-950">
                    Free-forever venue discovery & direct booking emails. AI tour routes, drive times & pro stage plots.
                  </td>
                  <td className="py-3.5 px-5 text-gray-650 text-[11px]">
                    “Smarter Operations. More Profitable Events.”
                  </td>
                  <td className="py-3.5 px-5 text-gray-650 text-[11px]">
                    “Centralized booking solutions for artists, agents and venues...”
                  </td>
                  <td className="py-3.5 px-5 text-gray-650 text-[11px]">
                    Product-mock led (Wynn Nightlife demo showcase)
                  </td>
                  <td className="py-3.5 px-5 text-gray-400 text-[11px]">
                    Pay-to-apply gig submissions
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-400 text-[11px] bg-slate-50/30">
                      Row 1: City • Row 2: Date • Row 3: ???
                    </td>
                  )}
                </tr>

                {/* 4. Pricing Model */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Pricing Model
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 font-black text-emerald-700">
                    Flat 30-Day Pass ($9.99) • No Auto-Renew
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Sales-led demo / Enterprise contract
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Per-seat tiers, annual billing only
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Freemium + paid tier monthly/annual
                  </td>
                  <td className="py-3.5 px-5 text-rose-650 font-semibold">
                    Recurring monthly subscription
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-650 bg-slate-50/30">
                      $0 in software, dozens of hours wasted
                    </td>
                  )}
                </tr>

                {/* 5. Entry Price */}
                <tr className="bg-amber-50/30">
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-amber-50/50">
                    Entry Price
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/60 font-black text-indigo-900 text-sm">
                    $9.99 <span className="text-[10.5px] font-normal text-gray-500">(+$0.84 fee) single pass</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Demo only <span className="text-[10px] text-gray-400">(no public price)</span>
                  </td>
                  <td className="py-3.5 px-5 text-rose-700 font-bold">
                    From $33/mo <span className="text-[10px] text-gray-500">($396/yr billed annually)</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Lite tier free <span className="text-[10px] text-gray-400">(paid price gated)</span>
                  </td>
                  <td className="py-3.5 px-5 text-rose-700 font-bold">
                    $19.99 – $34.99/mo <span className="text-[10px] text-gray-500">($240+/year)</span>
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-650 bg-slate-50/30">
                      $0
                    </td>
                  )}
                </tr>

                {/* 6. Free Option */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Free Option
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                    <span>Venue search, routing, plots, riders & posters 100% free</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    None (Demo gated)
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    None stated (Paid trial only)
                  </td>
                  <td className="py-3.5 px-5 text-emerald-600">
                    Lite freemium tier
                  </td>
                  <td className="py-3.5 px-5 text-gray-500">
                    Free basic EPK profile (search paywalled)
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-emerald-600 bg-slate-50/30">
                      Free (Google Sheets)
                    </td>
                  )}
                </tr>

                {/* 7. Top 3 Features */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Top 3 Features
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 text-indigo-950 font-semibold">
                    1. 4,800+ Venue Directory<br />
                    2. AI Tour Router & Drive Times<br />
                    3. Live Stage Plot / Rider / Poster Suite
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    1. Unified Venue Calendar<br />
                    2. Deals & Settlements<br />
                    3. Prism Insights Box-Office Data
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    1. Tour IQ Database<br />
                    2. Contracts & Payments<br />
                    3. Ticket Analytics
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    1. Confirmations<br />
                    2. Settlements<br />
                    3. Ticketing Integrations
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    1. EPK Builder<br />
                    2. Gig & Festival Listings<br />
                    3. One-Click Submissions
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-500 bg-slate-50/30">
                      1. Rows & Columns<br />
                      2. Broken VLOOKUPs<br />
                      3. Unsent Drafts
                    </td>
                  )}
                </tr>

                {/* 8. Stage Plot & Tech Rider Builder */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Stage Plot & Rider Canvas
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 font-black text-emerald-700 flex items-center gap-1.5 mt-0.5">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0 font-black" />
                    <span>Built-in drag-and-drop canvas + patch list ($0)</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    Not included (Document upload only)
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    Not included
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    Not included (PDF attachment only)
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    Not included
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-400 bg-slate-50/30">
                      ASCII text drawings in cell A1
                    </td>
                  )}
                </tr>

                {/* 9. Trust Spine */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Trust Spine
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 text-indigo-950 font-semibold">
                    4,800+ venues, 1,300+ bands, 4.9/5 stars, Founder Little Rusty (Seattle DIY musician)
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Named theaters (Pabst, Spokane Arena), 10,000+ venues claimed
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Named booking agencies (Surefire, Cadenza, Marshall LIVE)
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Wynn Nightlife mock, ticketing partners
                  </td>
                  <td className="py-3.5 px-5 text-gray-400">
                    Legacy musician marketplace reputation
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-400 bg-slate-50/30">
                      "I hope the promoter checks their spam"
                    </td>
                  )}
                </tr>

                {/* 10. Growth Trajectory & Distribution */}
                <tr>
                  <td className="py-3.5 px-5 font-bold text-slate-900 bg-slate-50/50">
                    Target Buyer & Trajectory
                  </td>
                  <td className="py-3.5 px-5 bg-indigo-50/40 text-indigo-950 font-bold">
                    DIY touring acts & self-managed artists • Fast growth via free tools & SEO
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Major venues & arenas • Webinars, enterprise sales
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Mid-tier booking agencies • LA & Barcelona offices
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Nightclubs & festival operators • Ticketing embeds
                  </td>
                  <td className="py-3.5 px-5 text-gray-650">
                    Indie artists • Legacy marketplace
                  </td>
                  {showStatusQuoSpreadsheet && (
                    <td className="py-3.5 px-5 text-gray-400 bg-slate-50/30">
                      Stuck in 2005
                    </td>
                  )}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Spotlight Pair Deep Dive (Competitor A & Competitor B) */}
      <section className="space-y-6 scroll-mt-20" id="spotlight-pair">
        <div className="text-center space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">In-Depth Analysis</span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Spotlight Pair: Closest Match vs Category Leader
          </h2>
          <p className="text-xs text-gray-500 max-w-xl mx-auto">
            Detailed 3-axis overlap test evaluating the two primary competitors in our market landscape.
          </p>
        </div>

        {/* 3-Axis Overlap Test Table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
            <h3 className="font-black text-xs uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>3-Axis Candidate Overlap Test</span>
            </h3>
            <span className="text-[11px] text-slate-400">Evaluated on Buyer, Desired Outcome & Operational Mode</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3 px-4">Candidate</th>
                  <th className="py-3 px-4">Same Buyer?</th>
                  <th className="py-3 px-4">Same Outcome?</th>
                  <th className="py-3 px-4">Same Mode?</th>
                  <th className="py-3 px-4">Grade & Designation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-indigo-50/30">
                  <td className="py-3.5 px-4 font-black text-indigo-900">
                    Sonicbids
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (DIY indie bands)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (Get gigs booked)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (Self-serve software)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-indigo-600 text-white font-black px-2.5 py-0.5 rounded-full text-[10px]">
                      3/3 Grade • Competitor A (Closest Match)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    Prism.fm
                  </td>
                  <td className="py-3.5 px-4 text-rose-600 font-bold">
                    No (Venues & Promoters)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (Live bookings profitable)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (Software platform)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-800 text-slate-200 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      2/3 Grade • Competitor B (Scale Benchmark)
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-black text-slate-900">
                    Gigwell
                  </td>
                  <td className="py-3.5 px-4 text-rose-600 font-bold">
                    No (Booking agents & agencies)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (Fill tour dates & contracts)
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">
                    Yes (Software platform)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="bg-slate-200 text-slate-700 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      2/3 Grade • Fallback B (Agency Process)
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Competitor Breakdown Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Competitor A: Sonicbids */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200 p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-indigo-600 font-mono">
                    Competitor A • Closest ICP Match
                  </span>
                  <h3 className="text-xl font-black text-slate-900">Sonicbids</h3>
                </div>
                <span className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                  $240 - $420 / year
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                Sells gig-finding and submission opportunities to DIY independent bands. However, artists are forced behind a recurring paywall simply to search and apply to venues.
              </p>

              {/* What they do better vs worse */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-black text-emerald-800 text-[11px] uppercase tracking-wider block">
                    What Sonicbids Does Better
                  </span>
                  <ul className="text-gray-700 space-y-1 text-[11.5px]">
                    <li>• Long-established marketplace brand recognition among indie bands.</li>
                    <li>• Inbound festival & showcase listings that actively solicit paid applications.</li>
                  </ul>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-black text-rose-800 text-[11px] uppercase tracking-wider block">
                    What Sonicbids Does Worse (Why Bands Switch)
                  </span>
                  <ul className="text-gray-700 space-y-1 text-[11.5px]">
                    <li>• <strong>Paywalled core:</strong> Artists pay for the discovery layer itself, even if venues never reply.</li>
                    <li>• <strong>Zero stage tools:</strong> No tour routing with drive times/gas, no stage plot canvas, no tech rider builder, and no poster designer.</li>
                    <li>• <strong>Recurring trap:</strong> Recurring monthly charges that continue billing when you aren't on tour.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-xs">
              <span className="font-black text-indigo-900 block">GigLizard's Winning Wedge:</span>
              <p className="text-gray-500 text-[11px] mt-0.5">
                We make venue discovery 100% free forever and charge a flat $9.99 pass only for unmasked co-bill band contacts.
              </p>
            </div>
          </div>

          {/* Competitor B: Prism.fm */}
          <div className="bg-white rounded-3xl border-2 border-slate-300 p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 font-mono">
                    Competitor B • Category Leader
                  </span>
                  <h3 className="text-xl font-black text-slate-900">Prism.fm</h3>
                </div>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full">
                  Enterprise / Sales-Led
                </span>
              </div>

              <p className="text-xs text-gray-600 leading-relaxed">
                The undisputed category leader for venue, theater, and promoter operations. Powers calendars, offers, settlements, and shared box-office data across 10,000+ venues.
              </p>

              {/* What they do better vs worse */}
              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <span className="font-black text-emerald-800 text-[11px] uppercase tracking-wider block">
                    What Prism.fm Does Better
                  </span>
                  <ul className="text-gray-700 space-y-1 text-[11.5px]">
                    <li>• <strong>Massive scale:</strong> 10,000+ venues claimed and named theater/arena testimonials (Pabst, Spokane Arena).</li>
                    <li>• <strong>Box office data moat:</strong> Prism Insights shares real gross/ticket data across venues.</li>
                  </ul>
                </div>

                <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl space-y-1">
                  <span className="font-black text-rose-800 text-[11px] uppercase tracking-wider block">
                    What Prism.fm Does Worse (Why DIY Bands Can't Use It)
                  </span>
                  <ul className="text-gray-700 space-y-1 text-[11.5px]">
                    <li>• <strong>Invisible enterprise pricing:</strong> Sales-led demo gate; thousands of dollars per year.</li>
                    <li>• <strong>Wrong buyer:</strong> Engineered exclusively for venue promoters and box office managers, not touring musicians.</li>
                    <li>• <strong>No DIY band tools:</strong> No stage plot generator, no van budget calculator, and no co-bill band directory.</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 text-xs">
              <span className="font-black text-slate-900 block">GigLizard's Winning Wedge:</span>
              <p className="text-gray-500 text-[11px] mt-0.5">
                We empower the artist on the other side of the booking desk with transparent sub-$10 pricing and pro stage plots sound engineers love.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* The Status Quo: Spreadsheets & Cold Email Black Holes */}
      <section className="bg-slate-900 text-white rounded-3xl p-7 md:p-10 border border-slate-800 space-y-6">
        <div className="max-w-3xl space-y-2">
          <div className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>The Default Competitor: Google Sheets & Cold Email</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            “Too Big for Spreadsheets. Too Small for Enterprise Software.”
          </h2>
          <p className="text-xs md:text-sm text-slate-350 leading-relaxed">
            Most touring bands don't use software at all - they live in a messy combination of Google Sheets, 20 open Google Maps tabs, group chats, and cold-email black holes. Here is why routing a tour in GigLizard beats a spreadsheet every single time:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2 text-xs">
          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2.5">
            <div className="text-rose-400 font-black text-xs uppercase flex items-center gap-1.5">
              <X className="w-4 h-4" />
              <span>Spreadsheet Pain</span>
            </div>
            <h4 className="font-bold text-white text-sm">Routing by Gut Feeling</h4>
            <p className="text-slate-350 text-[11.5px] leading-relaxed">
              Manually typing cities into Google Maps leads to 900 km overnight drives, backtracking, and open middle dates nobody fills.
            </p>
            <div className="pt-2 text-emerald-400 font-semibold border-t border-slate-700 text-[11px]">
              → GigLizard calculates optimal driving corridors, miles, and fuel budgets automatically.
            </div>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2.5">
            <div className="text-rose-400 font-black text-xs uppercase flex items-center gap-1.5">
              <X className="w-4 h-4" />
              <span>Spreadsheet Pain</span>
            </div>
            <h4 className="font-bold text-white text-sm">Cold-Email Black Holes</h4>
            <p className="text-slate-350 text-[11.5px] leading-relaxed">
              Scraping generic info@club.com emails off Instagram yields zero replies and hours wasted staring at wishy-washy calendars.
            </p>
            <div className="pt-2 text-emerald-400 font-semibold border-t border-slate-700 text-[11px]">
              → GigLizard connects directly with verified talent buyers and local co-bill partners.
            </div>
          </div>

          <div className="bg-slate-800/80 p-5 rounded-2xl border border-slate-700/80 space-y-2.5">
            <div className="text-rose-400 font-black text-xs uppercase flex items-center gap-1.5">
              <X className="w-4 h-4" />
              <span>Spreadsheet Pain</span>
            </div>
            <h4 className="font-bold text-white text-sm">Unprofessional Tech Delivery</h4>
            <p className="text-slate-350 text-[11.5px] leading-relaxed">
              Sending club sound engineers disorganized email paragraphs causes soundcheck chaos, missing DIs, and hostile venue crews.
            </p>
            <div className="pt-2 text-emerald-400 font-semibold border-t border-slate-700 text-[11px]">
              → GigLizard exports crystal-clear PDF stage plots, mic inputs, and +48V phantom patch lists.
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Cost Savings Calculator */}
      <section className="bg-gradient-to-br from-indigo-900/10 via-white to-emerald-50/30 rounded-3xl border border-indigo-200/80 p-7 md:p-10 space-y-6 shadow-xs scroll-mt-20" id="cost-calculator">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-4 border-b border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-black uppercase tracking-wider">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>Annual Tool Budget Comparison</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-1">
              How Much Does Touring Software Cost You Per Year?
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select how many regional or national tour runs your band books each year:
            </p>
          </div>

          {/* Interactive Tours Selector */}
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-gray-300 shadow-2xs">
            <span className="text-xs font-bold text-slate-700 px-2">Tours / Year:</span>
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                type="button"
                onClick={() => setAnnualToursPlanned(num)}
                className={`w-9 h-9 rounded-xl font-black text-xs transition-all cursor-pointer ${
                  annualToursPlanned === num
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Cost Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          
          {/* GigLizard */}
          <div className="bg-white rounded-2xl border-2 border-emerald-500 p-5 space-y-2 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg font-mono">
              Lowest Price
            </div>
            <span className="text-xs font-bold text-slate-500">GigLizard ({annualToursPlanned} Passes)</span>
            <p className="text-3xl font-black text-emerald-600">${gigLizardAnnualCost.toFixed(2)}</p>
            <p className="text-[10.5px] text-gray-500">Only buy a $9.99 pass when on tour. $0 when off the road.</p>
          </div>

          {/* Sonicbids */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Sonicbids (12 Mo. Sub)</span>
            <p className="text-3xl font-black text-rose-600">${sonicbidsAnnualCost}</p>
            <p className="text-[10.5px] text-gray-500">
              You save <strong className="text-emerald-600">${(sonicbidsAnnualCost - gigLizardAnnualCost).toFixed(0)}/yr</strong> with GigLizard
            </p>
          </div>

          {/* Gigwell */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Gigwell (Tour IQ Annual)</span>
            <p className="text-3xl font-black text-rose-600">${gigwellAnnualCost}</p>
            <p className="text-[10.5px] text-gray-500">
              You save <strong className="text-emerald-600">${(gigwellAnnualCost - gigLizardAnnualCost).toFixed(0)}/yr</strong> with GigLizard
            </p>
          </div>

          {/* Prism.fm */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-2xs">
            <span className="text-xs font-bold text-slate-500">Prism.fm (Venue Enterprise)</span>
            <p className="text-3xl font-black text-slate-800">$1,000+</p>
            <p className="text-[10.5px] text-gray-500">Sales-gated demo for multi-seat venue staff only.</p>
          </div>

        </div>
      </section>

      {/* Decision Summary CTA Box */}
      <div className="bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white rounded-3xl p-8 md:p-12 border border-slate-800 text-center space-y-5 shadow-2xl">
        <h3 className="text-2xl md:text-3xl font-black tracking-tight">
          Ready to Book Live Shows Without Paying Middleman Tolls?
        </h3>
        <p className="text-xs md:text-sm text-slate-350 max-w-2xl mx-auto leading-relaxed">
          Search 4,800+ independent music venues across the Lower 48 for $0. Build professional stage plots, dynamic patch lists, and vintage flyers. When you're ready to fill the middle dates, unlock 1,300+ direct band contacts for just $9.99.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab("venues")}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer transition-all flex items-center gap-2"
          >
            <span>Search 4,800+ Venues for Free</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("pricing")}
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 cursor-pointer transition-all"
          >
            <span>View $9.99 30-Day Pass Details</span>
          </button>
        </div>
      </div>

    </div>
  );
}
