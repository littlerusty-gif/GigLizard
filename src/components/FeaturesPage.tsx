import React from "react";
import { 
  Sliders, FileText, Image, Compass, ArrowRight, 
  Sparkles, CheckCircle2, ShieldCheck, MapPin, Building, Users 
} from "lucide-react";
import { 
  StagePlotScreenshot, 
  TechRiderScreenshot, 
  PosterScreenshot, 
  TourPlannerScreenshot,
  VenueDirectoryScreenshot
} from "./ProductPreviews";

interface FeaturesPageProps {
  onSelectTab: (tab: any) => void;
}

export default function FeaturesPage({ onSelectTab }: FeaturesPageProps) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 md:py-12 space-y-16 animate-fade-in" id="features-page-root">
      
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Everything you need for the gig</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Book the gig. Route the van.<br />
          <span className="text-indigo-600">Show up looking pro.</span>
        </h1>
        <p className="text-sm text-gray-600 leading-relaxed max-w-xl mx-auto">
          From finding the club and calculating van gas, to handing the house sound engineer an exact patch list before soundcheck.
        </p>
      </div>

      {/* Feature 1: Stage Plot Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-200/90 p-6 md:p-10 shadow-xs">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-orange-200">
            <Sliders className="w-3.5 h-3.5 text-orange-600" />
            <span>Stage Plot Canvas</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Interactive Drag-and-Drop Stage Plot Designer
          </h2>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            Never show up with a messy hand-drawn napkin again. Map your band's complete stage arrangement—drum kit pieces, guitar amp stacks, bass direct boxes, keyboard modules, monitor wedges, and vocal boom mics.
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Full mobile & touch-optimized drag positioning</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Label stage left/right monitor mixes for house engineers</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>1-Click instant PNG, PDF, or shareable link export</span>
            </li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectTab("plot")}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Launch Stage Plot Designer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div>
          <StagePlotScreenshot className="shadow-2xl hover:scale-101 transition-transform" />
        </div>
      </div>

      {/* Feature 2: Tech Rider Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-200/90 p-6 md:p-10 shadow-xs">
        <div className="order-2 lg:order-1">
          <TechRiderScreenshot className="shadow-2xl hover:scale-101 transition-transform" />
        </div>
        <div className="space-y-4 order-1 lg:order-2">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-blue-200">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Audio Engineering Specs</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Beginner-Friendly Tech Rider & Channel Patch List
          </h2>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            Give the venue's front-of-house engineer exactly what they need before line check. Formatted input channels, mic choices (SM58, Beta 52, SM57), +48V phantom power switches, DI needs, and custom reverb/gate notes.
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Standardized ASCII tables and printable PDF layouts</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Pre-populated channel templates for rock, punk, acoustic, synth</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Hospitality rider, power needs, and green room requests</span>
            </li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectTab("rider")}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Build Your Tech Rider</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Feature 3: Smart Tour Planner & Route Optimizer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-200/90 p-6 md:p-10 shadow-xs">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-rose-200">
            <Compass className="w-3.5 h-3.5 text-rose-600" />
            <span>AI Tour Routing & Logistics</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Smart Tour Planner with Google Maps & Gas Budget
          </h2>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            Stop guessing if a drive between stops is realistic. Input your tour stops to calculate exact driving miles, highway hours, van fuel costs, corridor sleeping lodging, and discover open clubs along your driving route.
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Leaflet & Google Maps corridor navigation</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Hold / Pencil / Confirm booking tracking statuses</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Band-friendly lodging and trailer parking recommendations</span>
            </li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectTab("tour")}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Plan Tour Route</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div>
          <TourPlannerScreenshot className="shadow-2xl hover:scale-101 transition-transform" />
        </div>
      </div>

      {/* Feature 4: Concert Poster Designer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-white rounded-3xl border border-gray-200/90 p-6 md:p-10 shadow-xs">
        <div className="order-2 lg:order-1">
          <PosterScreenshot className="shadow-2xl hover:scale-101 transition-transform" />
        </div>
        <div className="space-y-4 order-1 lg:order-2">
          <div className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-purple-200">
            <Image className="w-3.5 h-3.5 text-purple-600" />
            <span>Flyer & Social Asset Maker</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Retro Gig Flyer & Concert Poster Designer
          </h2>
          <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
            Create vintage screen-print, halftone, grunge, and neon cyber concert flyers in minutes. Automatically fills in your tour dates, door times, ticket stamps, 21+ warnings, and venue addresses.
          </p>
          <ul className="space-y-2 text-xs text-gray-700">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>High-resolution print export (11x17 and standard flyers)</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Optimized Instagram Stories & square feed dimensions</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>AI-assisted concert tagline and sub-head generators</span>
            </li>
          </ul>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => onSelectTab("poster")}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all inline-flex items-center gap-2"
            >
              <span>Design Concert Flyer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
