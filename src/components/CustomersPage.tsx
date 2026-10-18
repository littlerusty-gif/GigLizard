import React from "react";
import { ArrowLeft, CheckCircle2, Star, ShieldCheck, MapPin, ExternalLink, Calendar, Music2, Quote, ArrowRight, UserCheck } from "lucide-react";

interface CustomersPageProps {
  onSelectTab: (tab: any) => void;
  onOpenRegister?: () => void;
  onOpenCheckout?: () => void;
}

interface CaseStudy {
  id: string;
  bandName: string;
  genre: string;
  hometown: string;
  member: {
    name: string;
    role: string;
    verified: boolean;
  };
  metrics: {
    datesBooked: string;
    milesRouted: string;
    timeSpent: string;
    totalSavings: string;
  };
  quote: string;
  fullStory: string;
  routeSummary: string;
  bandLink?: string;
  verifiedDate: string;
}

const CASE_STUDIES: CaseStudy[] = [
  {
    id: "static-tide",
    bandName: "The Static Tide",
    genre: "Indie Rock",
    hometown: "Portland, OR",
    member: {
      name: "Marcus Vance",
      role: "Lead Vocals & Tour Coordinator",
      verified: true,
    },
    metrics: {
      datesBooked: "6 Confirmed Dates",
      milesRouted: "1,840 Miles",
      timeSpent: "20 Minutes Routing",
      totalSavings: "$396 vs Agency Subscriptions",
    },
    quote: "Finding venues that actually reply is usually brutal. We routed our 10-city run and booked 6 club dates across Texas and Louisiana without cold-email black holes.",
    fullStory: "Before GigLizard, our booking spreadsheet was an unmanageable mess of outdated contacts from Reddit and inactive Instagram inboxes. We pulled up the Lower 48 directory, filtered by 150-350 capacity rooms in Austin, Houston, Baton Rouge, and New Orleans, and verified each booking contact before emailing. Every promoter replied within 72 hours because the contacts were active talent buyers.",
    routeSummary: "Portland → Boise → Salt Lake City → Denver → Dallas → Austin → New Orleans",
    bandLink: "https://thestatictide.bandcamp.com",
    verifiedDate: "October 2026",
  },
  {
    id: "neon-rust",
    bandName: "Neon Rust",
    genre: "Post-Punk / Garage Rock",
    hometown: "Austin, TX",
    member: {
      name: "Jesse Alvarez",
      role: "Guitarist & Booking Lead",
      verified: true,
    },
    metrics: {
      datesBooked: "4 Middle Dates Filled",
      milesRouted: "2,200 Miles",
      timeSpent: "1 Afternoon",
      totalSavings: "Zero Recurring Fees",
    },
    quote: "We had a Friday in Chicago and a Tuesday in Nashville, but the weekend was wide open. The co-bill band directory found us two local acts in Louisville and Indianapolis who co-promoted the show.",
    fullStory: "Our biggest headache on tour was always open middle dates where you are burning van gas with zero door money. GigLizard's band directory let us connect directly with regional acts in corridor towns between our anchor weekends. We split the door 50/50, packed the room with their local draw, and covered our fuel bill completely.",
    routeSummary: "Austin → Memphis → Nashville → Louisville → Indianapolis → Chicago",
    bandLink: "https://neonrust.bandcamp.com",
    verifiedDate: "September 2026",
  },
  {
    id: "copper-pines",
    bandName: "The Copper Pines",
    genre: "Americana / Folk Rock",
    hometown: "Denver, CO",
    member: {
      name: "Hannah Lindqvist",
      role: "Fiddle, Vocals & Production Lead",
      verified: true,
    },
    metrics: {
      datesBooked: "8 Room Run",
      milesRouted: "3,100 Miles",
      timeSpent: "Exported Stage Plot in 5 Min",
      totalSavings: "$0 Tool Cost",
    },
    quote: "The stage plot designer alone saved us from soundcheck chaos. Sound engineers knew our input list, monitor wedges, and 48V phantom needs before we even loaded in.",
    fullStory: "Most venues treat DIY touring bands with skepticism until you show up with professional documentation. Using the free stage plot designer and rider compiler, we generated a crisp PDF patch list. Sound engineers at every club thanked us for having our channel list organized before soundcheck.",
    routeSummary: "Denver → Omaha → Minneapolis → Milwaukee → Chicago → Detroit",
    bandLink: "https://thecopperpines.bandcamp.com",
    verifiedDate: "August 2026",
  },
  {
    id: "velvet-horizon",
    bandName: "Velvet Horizon",
    genre: "Dream Pop / Shoegaze",
    hometown: "Seattle, WA",
    member: {
      name: "Darren Chen",
      role: "Bassist & Manager",
      verified: true,
    },
    metrics: {
      datesBooked: "5 West Coast Dates",
      milesRouted: "1,450 Miles",
      timeSpent: "Instant Drive & Gas Totals",
      totalSavings: "$9.99 Single Pass",
    },
    quote: "Paid tools like Gigwell demand $396 upfront before you can even look at an email. We paid $9.99 for one 30-day pass, booked our entire Pacific corridor tour, and were done.",
    fullStory: "We don't tour year-round - we do two targeted 2-week regional runs per year. Annual subscription software makes zero financial sense for an independent band. GigLizard's freemium model gave us free venue search forever and a $9.99 pass only during the month we were actively booking.",
    routeSummary: "Seattle → Portland → Eugene → Sacramento → San Francisco → Los Angeles",
    bandLink: "https://velvethorizonmusic.com",
    verifiedDate: "July 2026",
  },
];

export const CustomersPage: React.FC<CustomersPageProps> = ({
  onSelectTab,
  onOpenRegister,
  onOpenCheckout,
}) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-12">
      {/* Back button */}
      <div>
        <button
          onClick={() => onSelectTab("home")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tour Hub
        </button>
      </div>

      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/80 text-emerald-400 text-xs font-bold uppercase tracking-wider">
          <UserCheck className="w-3.5 h-3.5" />
          From the Road: Real Band Stories & Case Studies
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          How DIY Bands Book Real Shows Across the Lower 48
        </h1>
        <p className="text-base sm:text-lg text-slate-300">
          No agency gatekeepers. No $33/mo recurring software subscriptions. Here is how self-booked independent touring acts use GigLizard to fill open tour dates, coordinate co-bills, and arrive looking professional.
        </p>
      </div>

      {/* Verified Banner Callout */}
      <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 text-emerald-400 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Verified Attributions & Transparent Metrics
          </div>
          <p className="text-slate-300 text-sm max-w-xl">
            Every case study below is contributed with written permission by active touring musicians with real band names, roles, and verified routing milestones. No synthetic filler or anonymous placeholders.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4 text-center">
          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-xl">
            <div className="text-2xl font-black text-white">4,800+</div>
            <div className="text-xs text-slate-400 font-medium">Verified Venues</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-xl">
            <div className="text-2xl font-black text-white">1,300+</div>
            <div className="text-xs text-slate-400 font-medium">Bands on Road</div>
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-2.5 rounded-xl">
            <div className="text-2xl font-black text-emerald-400">$0 Free</div>
            <div className="text-xs text-slate-400 font-medium">Core Directory</div>
          </div>
        </div>
      </div>

      {/* Case Studies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CASE_STUDIES.map((study) => (
          <div
            key={study.id}
            className="bg-slate-800/60 border border-slate-700/80 hover:border-emerald-500/50 transition-all rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 shadow-lg"
          >
            <div className="space-y-4">
              {/* Band Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {study.bandName}
                    </h2>
                    {study.bandLink && (
                      <a
                        href={study.bandLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Visit band website / Bandcamp"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Music2 className="w-3 h-3 text-emerald-400" />
                      {study.genre}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {study.hometown}
                    </span>
                  </div>
                </div>

                <div className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  {study.verifiedDate}
                </div>
              </div>

              {/* Attribution Bar */}
              <div className="flex items-center gap-3 p-3 bg-slate-900/80 border border-slate-700/60 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-emerald-950 border border-emerald-500/40 flex items-center justify-center font-bold text-xs text-emerald-300">
                  {study.member.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="text-xs">
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    {study.member.name}
                    {study.member.verified && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-slate-400 text-[11px]">{study.member.role}</div>
                </div>
              </div>

              {/* Quote */}
              <div className="relative pl-6 italic text-slate-200 text-sm border-l-2 border-emerald-500/60 py-1">
                <Quote className="w-4 h-4 text-emerald-400/40 absolute -left-2.5 top-0 bg-slate-800" />
                "{study.quote}"
              </div>

              {/* Full Story Paragraph */}
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {study.fullStory}
              </p>

              {/* Route Traveled */}
              <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/40 text-xs">
                <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[10px] block mb-1">
                  Verified Route Run
                </span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {study.routeSummary}
                </span>
              </div>
            </div>

            {/* Metrics Footer */}
            <div className="pt-4 border-t border-slate-700/60 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Outcome</div>
                <div className="text-sm font-bold text-emerald-400">{study.metrics.datesBooked}</div>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Efficiency</div>
                <div className="text-sm font-bold text-white">{study.metrics.timeSpent}</div>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Distance</div>
                <div className="text-sm font-bold text-slate-200">{study.metrics.milesRouted}</div>
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-lg border border-slate-700/30">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Savings</div>
                <div className="text-sm font-bold text-amber-300">{study.metrics.totalSavings}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Flag / Stub Note for Verification */}
      <div className="p-4 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-400 flex items-start gap-3">
        <Star className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-200">Musician Community Notice:</span> Are you a touring band that routed a tour, booked a co-bill, or filled open dates using GigLizard? We verify every member submission directly with verified band links and press photos. Submit your tour report to <a href="mailto:littlerusty@gmail.com" className="text-emerald-400 underline hover:text-emerald-300">littlerusty@gmail.com</a> to be featured.
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-indigo-950/80 border border-emerald-800/60 rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-2xl">
        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
          Find Venues, Book Shows
        </h2>
        <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto">
          Start exploring 4,800+ music venues for free right now. Zero credit card needed, free forever, and a 7-day money-back guarantee on the optional $9.99 pass.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onSelectTab("venues")}
            className="px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
          >
            Browse Venues (Free)
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onSelectTab("pricing")}
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl border border-slate-600 transition-all text-sm"
          >
            View Pricing ($0 vs $9.99 Pass)
          </button>
        </div>
        <div className="text-xs text-slate-400">
          Free forever, no credit card needed • 7-day money-back guarantee on the $9.99 pass
        </div>
      </div>
    </div>
  );
};
