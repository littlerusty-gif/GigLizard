import React, { useState, useMemo } from "react";
import { TOUR_ARTICLES, TourArticle } from "../data/tourArticles";
import AdSenseBanner from "./AdSenseBanner";
import { 
  BookOpen, 
  Search, 
  Clock, 
  ArrowRight, 
  Compass, 
  Sparkles, 
  FileText, 
  Palette, 
  MapPin, 
  CheckCircle2, 
  Calendar,
  Layers,
  HelpCircle
} from "lucide-react";

interface TourAdviceHubProps {
  onSelectTab: (tab: any, pushToHistory?: boolean) => void;
  onSelectArticle: (slug: string) => void;
}

export default function TourAdviceHub({
  onSelectTab,
  onSelectArticle
}: TourAdviceHubProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = useMemo(() => {
    return ["All", "Routing & Logistics", "Venue Booking", "Live Sound & Tech", "Studio & Recording", "Promotion & Merch", "Tour Finances"];
  }, []);

  const filteredArticles = useMemo(() => {
    return TOUR_ARTICLES.filter(art => {
      const matchCat = selectedCategory === "All" || art.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchSearch = 
        art.title.toLowerCase().includes(q) ||
        art.excerpt.toLowerCase().includes(q) ||
        art.keywords.some(k => k.toLowerCase().includes(q)) ||
        art.keyTakeaways.some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [searchQuery, selectedCategory]);

  const featuredArticle = TOUR_ARTICLES[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-slate-800 bg-linear-to-b from-slate-900 via-slate-950 to-slate-950 px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Independent Band &amp; Tour Advice Library</span>
            </span>
            <span className="text-xs text-slate-400 font-bold">{TOUR_ARTICLES.length} Master Playbooks</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight max-w-3xl">
            Real Wisdom for Gigging, Studio Recording, Merch &amp; Tour Life.
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-medium leading-relaxed">
            Written and copyrighted by Pacific Northwest touring artist and sound engineer Little Rusty. Actionable blueprints on studio tracking discipline, merch sizing ratios, DIY in-ear monitor racks, van fuel corridors, and booking real tours.
          </p>

          {/* Quick Tool Navigation Pills */}
          <div className="pt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1">Direct Tools:</span>
            <button
              onClick={() => onSelectTab("tour")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Tour Planner (/tour)</span>
            </button>
            <button
              onClick={() => onSelectTab("plot")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-amber-300 border border-amber-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Stage Plot Maker (/plot)</span>
            </button>
            <button
              onClick={() => onSelectTab("rider")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300 border border-cyan-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Tech Rider Builder (/rider)</span>
            </button>
            <button
              onClick={() => onSelectTab("poster")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-emerald-300 border border-emerald-500/20 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Palette className="w-3.5 h-3.5" />
              <span>Poster Studio (/poster)</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Top AdSense Banner */}
        <AdSenseBanner slotId="advice-hub-top" format="auto" label="Sponsored Partner" />

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search playbooks by topic, keyword, or instrument..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-emerald-500 text-slate-950 shadow-md font-black"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Master Article Hero */}
        {selectedCategory === "All" && !searchQuery && featuredArticle && (
          <div 
            onClick={() => onSelectArticle(featuredArticle.slug)}
            className="group relative overflow-hidden rounded-3xl border border-emerald-500/30 bg-linear-to-br from-slate-900 via-emerald-950/20 to-slate-900 p-6 sm:p-8 hover:border-emerald-500/60 transition-all cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-emerald-950/30"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500 text-slate-950">
                    Featured Masterclass
                  </span>
                  <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{featuredArticle.readTimeMinutes} min read</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-3xl font-black text-white group-hover:text-emerald-300 transition-colors">
                  {featuredArticle.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3">
                  {featuredArticle.excerpt}
                </p>
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
                  <span>By {featuredArticle.author.name}</span>
                  <span>·</span>
                  <span>{featuredArticle.category}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2 text-emerald-400 font-black text-xs sm:text-sm group-hover:translate-x-1 transition-transform">
                <span>Read Full Playbook</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredArticles.map((article, idx) => (
            <div
              key={article.id}
              onClick={() => onSelectArticle(article.slug)}
              className="group rounded-2xl border border-slate-800 hover:border-emerald-500/50 bg-slate-900/60 hover:bg-slate-900/90 p-5 sm:p-6 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-lg hover:shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
                    {article.category}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{article.readTimeMinutes} min</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-black text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {article.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 leading-relaxed">
                  {article.excerpt}
                </p>

                {/* Key Takeaways Preview */}
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Core Rule:
                  </span>
                  <p className="text-xs text-slate-200 font-medium italic line-clamp-1">
                    "{article.keyTakeaways[0]}"
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800/80 text-slate-400 group-hover:text-slate-200">
                <span className="text-[11px]">By {article.author.name}</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Read Guide</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12 rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-500 mx-auto" />
            <h3 className="text-base font-bold text-white">No articles found matching "{searchQuery}"</h3>
            <p className="text-xs text-slate-400">Try adjusting your search terms or selecting 'All' categories.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedCategory("All"); }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Mid-Page AdSense Banner */}
        <AdSenseBanner slotId="advice-hub-mid" format="horizontal" label="Advertisement" />

        {/* Bottom Production Tools Callout Banner */}
        <div className="rounded-3xl border border-indigo-500/30 bg-linear-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 p-6 sm:p-8 space-y-4">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400">
              100% Free Production Tools
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Every Tool Mentioned in These Playbooks is Free on GigLizard
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              We never charge monthly subscriptions for stage plot makers, technical rider generators, tour distance calculators, or venue directories. Build your production spec sheets for $0 and hit the road ready.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <button
              onClick={() => onSelectTab("tour")}
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-indigo-400/50 text-left transition-all cursor-pointer"
            >
              <Compass className="w-4 h-4 text-indigo-400 mb-1" />
              <div className="text-xs font-bold text-white">Tour Planner</div>
              <div className="text-[10px] text-slate-400">Route & van gas</div>
            </button>

            <button
              onClick={() => onSelectTab("plot")}
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-400/50 text-left transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400 mb-1" />
              <div className="text-xs font-bold text-white">Stage Plot</div>
              <div className="text-[10px] text-slate-400">Vector gear map</div>
            </button>

            <button
              onClick={() => onSelectTab("rider")}
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-left transition-all cursor-pointer"
            >
              <FileText className="w-4 h-4 text-cyan-400 mb-1" />
              <div className="text-xs font-bold text-white">Tech Rider</div>
              <div className="text-[10px] text-slate-400">24-ch patch list</div>
            </button>

            <button
              onClick={() => onSelectTab("poster")}
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-400/50 text-left transition-all cursor-pointer"
            >
              <Palette className="w-4 h-4 text-emerald-400 mb-1" />
              <div className="text-xs font-bold text-white">Poster Studio</div>
              <div className="text-[10px] text-slate-400">300 DPI print flyers</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
