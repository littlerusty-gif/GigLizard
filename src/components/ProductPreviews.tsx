import React from "react";
import { 
  Building, MapPin, Music, Sliders, FileText, Image, 
  Compass, Navigation, Star, ShieldCheck, CheckCircle2, 
  Volume2, Mic, Eye, Zap, Fuel, Clock, DollarSign, Users
} from "lucide-react";

/**
 * High-fidelity, crisp product screenshot preview of the Venue Directory
 */
export function VenueDirectoryScreenshot({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`rounded-2xl border border-slate-700/80 bg-slate-950 p-4 font-sans text-xs text-slate-200 shadow-2xl overflow-hidden select-none ${className}`}
      role="img"
      aria-label="Venue directory interface showing searchable live music venues across Seattle, Portland, and Austin with capacity badges and booking emails"
    >
      {/* Mock Browser/App Chrome */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
          <span className="text-slate-400 font-mono ml-2 text-[10px]">giglizard.us/venues</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          4,800+ Verified Stages
        </div>
      </div>

      {/* Mock Search Filter Bar */}
      <div className="pt-3 pb-2 flex flex-wrap items-center gap-2">
        <div className="flex-1 min-w-[140px] bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          <span className="text-white font-medium">Seattle, WA • Portland, OR • Austin, TX</span>
        </div>
        <div className="flex items-center gap-1 text-[10px]">
          <span className="px-2 py-1 bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 rounded-md font-bold">Rock / Indie</span>
          <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded-md font-medium">100-350 Cap</span>
        </div>
      </div>

      {/* Mock Venue Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {/* Card 1 */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="font-black text-white text-xs flex items-center gap-1">
                The Subterranean Cellar
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/60 font-mono">120 Cap</span>
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400" />
                Seattle, WA • Belltown
              </p>
            </div>
            <span className="text-[9px] font-bold text-indigo-300 bg-indigo-950/80 px-1.5 py-0.5 rounded border border-indigo-800/60">
              PA + Sound Tech
            </span>
          </div>
          <p className="text-[10.5px] text-slate-300 line-clamp-1">
            Basement club with heavy brick acoustic dampening, pro active monitors.
          </p>
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="font-mono text-emerald-400 font-semibold">booking@subterranean...</span>
            <span className="text-slate-400">Direct Inbox ✓</span>
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-1.5 hover:border-slate-700 transition-all">
          <div className="flex items-start justify-between gap-1">
            <div>
              <p className="font-black text-white text-xs flex items-center gap-1">
                The Echo Chamber Lounge
                <span className="text-[9px] text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/60 font-mono">250 Cap</span>
              </p>
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 text-rose-400" />
                Austin, TX • Red River Cultural
              </p>
            </div>
            <span className="text-[9px] font-bold text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-800/60">
              Lighting Rig Included
            </span>
          </div>
          <p className="text-[10.5px] text-slate-300 line-clamp-1">
            Mid-sized room with customized delay lines and dedicated merch area.
          </p>
          <div className="pt-1 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
            <span className="font-mono text-emerald-400 font-semibold">shows@echolounge...</span>
            <span className="text-slate-400">Direct Inbox ✓</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * High-fidelity screenshot preview of the Stage Plot Designer
 */
export function StagePlotScreenshot({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`rounded-2xl border border-orange-500/30 bg-slate-950 p-3.5 font-sans text-xs text-slate-200 shadow-xl overflow-hidden select-none ${className}`}
      role="img"
      aria-label="Stage plot canvas showing a 5-piece band's drum kit, amps, monitor wedges, and vocal boom mics placed for a club stage"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span className="font-black text-orange-400 uppercase tracking-wider text-[9px]">Stage Plot Grid • 24ft x 16ft</span>
        </div>
        <span className="text-slate-400 font-mono text-[9px]">Audience / Front of House ↓</span>
      </div>

      {/* Visual Canvas Representation */}
      <div className="relative my-2.5 h-36 bg-slate-900/90 rounded-xl border border-slate-800 p-2 overflow-hidden flex flex-col justify-between">
        {/* Upstage / Backline */}
        <div className="flex justify-around items-center pt-1">
          <div className="px-2 py-1 bg-slate-800/90 rounded border border-slate-700 text-[9px] text-slate-300 text-center font-bold">
            Guitar Amp 1 (Left)
          </div>
          <div className="p-1.5 bg-orange-500/20 border border-orange-400/50 rounded-lg text-center">
            <span className="text-[9px] font-black text-orange-300 block">Drum Riser (5-Piece)</span>
            <span className="text-[8px] text-slate-400">Kick, Snare, 3 Toms, O/H</span>
          </div>
          <div className="px-2 py-1 bg-slate-800/90 rounded border border-slate-700 text-[9px] text-slate-300 text-center font-bold">
            Bass Rig + DI (Right)
          </div>
        </div>

        {/* Downstage / Frontline */}
        <div className="flex justify-around items-center pb-1">
          <div className="text-center">
            <span className="w-5 h-5 mx-auto rounded-full bg-indigo-600/40 border border-indigo-400 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
              🎤
            </span>
            <span className="text-[8px] text-slate-300 font-semibold block mt-0.5">Wedge 1 (Stage L)</span>
          </div>
          <div className="text-center">
            <span className="w-6 h-6 mx-auto rounded-full bg-orange-500/40 border border-orange-400 text-orange-300 flex items-center justify-center text-[10px] font-bold">
              🎤
            </span>
            <span className="text-[8.5px] text-orange-300 font-black block mt-0.5">Lead Vox (Center Wedge)</span>
          </div>
          <div className="text-center">
            <span className="w-5 h-5 mx-auto rounded-full bg-indigo-600/40 border border-indigo-400 text-indigo-300 flex items-center justify-center text-[9px] font-bold">
              🎤
            </span>
            <span className="text-[8px] text-slate-300 font-semibold block mt-0.5">Wedge 3 (Stage R)</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1 border-t border-slate-800">
        <span>5 Gear Items Placed</span>
        <span className="text-emerald-400 font-bold">Ready for Sound Tech Export ✓</span>
      </div>
    </div>
  );
}

/**
 * High-fidelity screenshot preview of the Tech Rider Builder
 */
export function TechRiderScreenshot({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`rounded-2xl border border-blue-500/30 bg-slate-950 p-3.5 font-sans text-xs text-slate-200 shadow-xl overflow-hidden select-none ${className}`}
      role="img"
      aria-label="Tech rider builder showing input patch list with SM58s, Beta 52 kick mic, +48V phantom power, and soundboard routing"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="font-black text-blue-400 uppercase tracking-wider text-[9px]">Input Channel Patch List</span>
        </div>
        <span className="text-slate-400 font-mono text-[9px]">ASCII & PDF Export</span>
      </div>

      {/* Structured Channels Table */}
      <div className="my-2 space-y-1 font-mono text-[10px]">
        <div className="grid grid-cols-6 text-[8.5px] text-slate-400 uppercase pb-1 border-b border-slate-800 font-bold">
          <span className="col-span-1">CH</span>
          <span className="col-span-2">Instrument</span>
          <span className="col-span-1">Mic/DI</span>
          <span className="col-span-1">Stand</span>
          <span className="col-span-1 text-right">+48V</span>
        </div>
        <div className="grid grid-cols-6 text-slate-300 py-0.5 items-center bg-slate-900/60 px-1 rounded">
          <span className="col-span-1 text-blue-400 font-bold">01</span>
          <span className="col-span-2 font-sans font-semibold text-white">Kick Drum</span>
          <span className="col-span-1">Beta 52</span>
          <span className="col-span-1 text-slate-400">Short</span>
          <span className="col-span-1 text-right text-slate-500">OFF</span>
        </div>
        <div className="grid grid-cols-6 text-slate-300 py-0.5 items-center px-1">
          <span className="col-span-1 text-blue-400 font-bold">02</span>
          <span className="col-span-2 font-sans font-semibold text-white">Snare Top</span>
          <span className="col-span-1">SM57</span>
          <span className="col-span-1 text-slate-400">Short</span>
          <span className="col-span-1 text-right text-slate-500">OFF</span>
        </div>
        <div className="grid grid-cols-6 text-slate-300 py-0.5 items-center bg-slate-900/60 px-1 rounded">
          <span className="col-span-1 text-blue-400 font-bold">03</span>
          <span className="col-span-2 font-sans font-semibold text-white">Bass Direct</span>
          <span className="col-span-1 text-amber-400">Active DI</span>
          <span className="col-span-1 text-slate-400">None</span>
          <span className="col-span-1 text-right text-amber-400 font-bold">ON</span>
        </div>
        <div className="grid grid-cols-6 text-slate-300 py-0.5 items-center px-1">
          <span className="col-span-1 text-blue-400 font-bold">04</span>
          <span className="col-span-2 font-sans font-semibold text-white">Lead Vocal</span>
          <span className="col-span-1">SM58</span>
          <span className="col-span-1 text-slate-400">Tall</span>
          <span className="col-span-1 text-right text-slate-500">OFF</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1 border-t border-slate-800">
        <span>Monitor Mixes: 3 Discrete Lines</span>
        <span className="text-blue-400 font-bold">Instant Engineer Handout ✓</span>
      </div>
    </div>
  );
}

/**
 * High-fidelity screenshot preview of the Concert Poster Designer
 */
export function PosterScreenshot({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`rounded-2xl border border-purple-500/30 bg-slate-950 p-3.5 font-sans text-xs text-slate-200 shadow-xl overflow-hidden select-none ${className}`}
      role="img"
      aria-label="Concert poster designer generating retro gig flyer with halftone texture, neon typography, and tour dates"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="font-black text-purple-400 uppercase tracking-wider text-[9px]">Gig Flyer Engine • Retro Halftone</span>
        </div>
        <span className="text-slate-400 font-mono text-[9px]">High-Res Print & Social</span>
      </div>

      {/* Styled Concert Flyer Visual Mini-Canvas */}
      <div className="my-2.5 h-36 bg-gradient-to-b from-purple-950 via-slate-900 to-slate-950 rounded-xl border border-purple-500/40 p-2.5 flex flex-col justify-between text-center relative overflow-hidden">
        <div className="absolute top-1 right-2 text-[8px] uppercase tracking-widest text-purple-400 font-mono">
          LIVE IN CONCERT
        </div>
        <div className="pt-2">
          <span className="text-[9px] uppercase font-bold tracking-widest text-amber-300">FRIDAY, NOV 14 • 8:00 PM</span>
          <h4 className="text-base font-black tracking-tight text-white uppercase mt-0.5 leading-none">
            THE STATIC TIDE
          </h4>
          <p className="text-[9px] text-purple-300 font-semibold tracking-wider mt-0.5">WITH SPECIAL GUESTS NEON RUST</p>
        </div>

        <div className="bg-slate-950/80 rounded-lg p-1.5 border border-purple-900/60 flex items-center justify-between text-[8.5px] px-2 text-slate-300">
          <span className="font-bold text-white">THE ECHO CHAMBER</span>
          <span className="text-amber-400 font-mono font-bold">$12 ADV / $15 DOOR</span>
          <span className="text-slate-400">21+ w/ ID</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1 border-t border-slate-800">
        <span>Neon & Halftone Palettes</span>
        <span className="text-purple-400 font-bold">1-Click PNG / PDF Export ✓</span>
      </div>
    </div>
  );
}

/**
 * High-fidelity screenshot preview of the Smart Tour Planner
 */
export function TourPlannerScreenshot({ className = "" }: { className?: string }) {
  return (
    <div 
      className={`rounded-2xl border border-rose-500/30 bg-slate-950 p-3.5 font-sans text-xs text-slate-200 shadow-xl overflow-hidden select-none ${className}`}
      role="img"
      aria-label="Smart tour planner showing Pacific Northwest driving corridor with Google Maps routing, lodging stops, and gas calculations"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-[10px]">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="font-black text-rose-400 uppercase tracking-wider text-[9px]">AI Tour Router & Google Maps</span>
        </div>
        <span className="text-slate-400 font-mono text-[9px]">4-Stop PNW Corridor</span>
      </div>

      {/* Tour Vitals Metrics Strip */}
      <div className="grid grid-cols-4 gap-1.5 my-2 text-center">
        <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[8px] uppercase text-slate-400 block font-bold">Miles</span>
          <span className="text-xs font-mono font-black text-white">418 mi</span>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[8px] uppercase text-slate-400 block font-bold">Drive Time</span>
          <span className="text-xs font-mono font-black text-emerald-400">7.2 hrs</span>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[8px] uppercase text-slate-400 block font-bold">Van Gas</span>
          <span className="text-xs font-mono font-black text-amber-400">$108</span>
        </div>
        <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800">
          <span className="text-[8px] uppercase text-slate-400 block font-bold">Status</span>
          <span className="text-[9px] font-black text-indigo-400">3/4 Held</span>
        </div>
      </div>

      {/* Route Stops Ribbon */}
      <div className="space-y-1 text-[10px] bg-slate-900/60 p-2 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <strong>Stop 1:</strong> Seattle, WA → The Subterranean Cellar
          </span>
          <span className="text-emerald-400 text-[9px] font-bold">CONFIRMED</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <strong>Stop 2:</strong> Portland, OR → Star Theater (174 mi)
          </span>
          <span className="text-amber-400 text-[9px] font-bold">ON HOLD</span>
        </div>
        <div className="flex items-center justify-between text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
            <strong>Stop 3:</strong> Eugene, OR → WOW Hall (110 mi)
          </span>
          <span className="text-indigo-400 text-[9px] font-bold">PENCILED</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[9.5px] text-slate-400 pt-1 border-t border-slate-800">
        <span>Lodging & Van Parking Mapped</span>
        <span className="text-rose-400 font-bold">Google Maps Synchronized ✓</span>
      </div>
    </div>
  );
}

/**
 * Authentic Musician & Founder Avatar Components
 */
export function FounderAvatar({ className = "" }: { className?: string }) {
  return (
    <div className={`relative inline-block ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-700 via-purple-600 to-amber-500 p-0.5 shadow-lg flex items-center justify-center">
        <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-white overflow-hidden relative">
          {/* Musician silhouette icon representation */}
          <span className="text-xl">🎸</span>
        </div>
      </div>
      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-slate-900 rounded-full" title="Active Touring Musician" />
    </div>
  );
}

export function BandVisualBadge({ 
  code, 
  gradient,
  symbol = "🎵"
}: { 
  code: string; 
  gradient: string;
  symbol?: string;
}) {
  return (
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} p-0.5 shadow-md flex items-center justify-center shrink-0`}>
      <div className="w-full h-full bg-slate-950/90 rounded-[10px] flex items-center justify-center text-white font-black text-xs">
        <span className="mr-0.5 text-xs">{symbol}</span>
        <span>{code}</span>
      </div>
    </div>
  );
}
