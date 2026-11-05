import React, { useState, useEffect } from "react";
import { TourArticle, TOUR_ARTICLES } from "../data/tourArticles";
import { FounderAvatar } from "./ProductPreviews";
import AdSenseBanner from "./AdSenseBanner";
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  User, 
  Share2, 
  CheckCircle2, 
  Lightbulb, 
  ChevronRight, 
  ChevronDown, 
  Sparkles, 
  ArrowRight,
  BookOpen,
  Compass,
  FileText,
  Palette,
  MapPin,
  Check
} from "lucide-react";

interface TourArticlePageProps {
  article: TourArticle;
  onSelectTab: (tab: any, pushToHistory?: boolean) => void;
  onSelectArticle: (slug: string) => void;
}

export default function TourArticlePage({
  article,
  onSelectTab,
  onSelectArticle
}: TourArticlePageProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [article.slug]);

  const handleShare = () => {
    try {
      const url = `https://www.giglizard.us/articles/${article.slug}`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (_) {}
  };

  const currentIndex = TOUR_ARTICLES.findIndex(a => a.id === article.id);
  const prevArticle = currentIndex > 0 ? TOUR_ARTICLES[currentIndex - 1] : null;
  const nextArticle = currentIndex < TOUR_ARTICLES.length - 1 ? TOUR_ARTICLES[currentIndex + 1] : null;

  // 3-5 Related articles by shared category / topic cluster (t_orphan_pages)
  const relatedArticles = TOUR_ARTICLES
    .filter(a => a.slug !== article.slug)
    .sort((a, b) => (a.category === article.category ? -1 : 1) - (b.category === article.category ? -1 : 1))
    .slice(0, 3);

  const getToolIcon = (tab: string) => {
    switch (tab) {
      case "tour":
        return <Compass className="w-5 h-5 text-indigo-400" />;
      case "plot":
        return <Sparkles className="w-5 h-5 text-amber-400" />;
      case "rider":
        return <FileText className="w-5 h-5 text-cyan-400" />;
      case "poster":
        return <Palette className="w-5 h-5 text-emerald-400" />;
      case "venues":
        return <MapPin className="w-5 h-5 text-rose-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <article className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Top Header / Breadcrumb Bar */}
      <div className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 overflow-hidden text-ellipsis whitespace-nowrap">
            <button
              onClick={() => onSelectTab("home")}
              className="hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
            >
              Home
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => onSelectTab("articles")}
              className="hover:text-emerald-400 transition-colors cursor-pointer shrink-0"
            >
              Tour Advice
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <span className="text-slate-200 truncate">{article.title}</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer border border-slate-700"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied Link!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Share</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16 space-y-8">
        {/* Back Link */}
        <button
          onClick={() => onSelectTab("articles")}
          className="inline-flex items-center gap-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>All Tour Advice Playbooks</span>
        </button>

        {/* Semantic Breadcrumbs (t_orphan_pages, c_internal_links) */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-400">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <a 
                href="/" 
                onClick={(e) => { e.preventDefault(); onSelectTab("home"); }} 
                className="hover:text-emerald-400 transition-colors"
              >
                Home
              </a>
            </li>
            <li className="text-slate-600">/</li>
            <li>
              <a 
                href="/articles" 
                onClick={(e) => { e.preventDefault(); onSelectTab("articles"); }} 
                className="hover:text-emerald-400 transition-colors"
              >
                Tour Advice
              </a>
            </li>
            <li className="text-slate-600">/</li>
            <li className="text-slate-200 font-semibold truncate max-w-xs sm:max-w-md" aria-current="page">
              {article.title}
            </li>
          </ol>
        </nav>

        {/* Hero Header */}
        <header className="space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {article.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{article.readTimeMinutes} min read</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Updated {new Date(article.updatedDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            {article.title}
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-medium">
            {article.excerpt}
          </p>

          {/* Author Badge */}
          <div className="flex items-center gap-3 pt-3 border-t border-slate-800/80">
            <div className="w-11 h-11 rounded-full bg-linear-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-black text-sm shadow-md ring-2 ring-emerald-500/30">
              LR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">{article.author.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  GigLizard Founder
                </span>
              </div>
              <p className="text-xs text-slate-400">{article.author.role}</p>
            </div>
          </div>
        </header>

        {/* Top Google AdSense Placement */}
        <AdSenseBanner slotId="article-top-leaderboard" format="auto" label="Sponsored Partner" />

        {/* Key Takeaways Callout Box */}
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 sm:p-6 backdrop-blur-xs space-y-3 shadow-lg shadow-emerald-950/20">
          <div className="flex items-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-wider">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Key Executive Takeaways</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-slate-200">
            {article.keyTakeaways.map((takeaway, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                <span className="leading-relaxed">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Callout: Related GigLizard Tool */}
        <div className="rounded-2xl border border-indigo-500/30 bg-linear-to-r from-indigo-950/40 via-purple-950/30 to-slate-900 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              {getToolIcon(article.relatedTool.tab)}
              <span>Put This into Practice for Free</span>
            </div>
            <h4 className="text-base sm:text-lg font-black text-white">
              {article.relatedTool.name}
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              GigLizard provides 100% free production and touring tools for independent artists—no subscriptions or credit cards required.
            </p>
          </div>
          <button
            onClick={() => onSelectTab(article.relatedTool.tab)}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer group"
          >
            <span>Launch Tool</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>

        {/* Article Body Sections */}
        <div className="space-y-10 pt-4 text-slate-200 leading-relaxed font-normal">
          {article.sections.map((section, sIdx) => (
            <section key={section.id} id={section.id} className="space-y-4">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-2 border-b border-slate-800/80 pb-2">
                {section.heading}
              </h2>

              <div className="space-y-3.5 text-sm sm:text-base text-slate-300 leading-relaxed">
                {section.content.map((paragraph, pIdx) => (
                  <p key={pIdx}>{paragraph}</p>
                ))}
              </div>

              {section.bulletList && section.bulletList.length > 0 && (
                <div className="my-3 rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
                  {section.bulletList.map((bullet, bIdx) => (
                    <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-2 shrink-0" />
                      <span>{bullet}</span>
                    </div>
                  ))}
                </div>
              )}

              {section.proTip && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 flex items-start gap-3 my-4">
                  <Lightbulb className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs sm:text-sm">
                    <span className="font-black text-amber-400 uppercase tracking-wider text-[11px] block">
                      Pro Tour Tip from Little Rusty
                    </span>
                    <p className="text-amber-100/90 leading-relaxed font-medium">
                      {section.proTip}
                    </p>
                  </div>
                </div>
              )}

              {/* In-article AdSense Banner halfway through */}
              {sIdx === 1 && (
                <AdSenseBanner slotId="article-mid-content" format="rectangle" label="Advertisement" />
              )}
            </section>
          ))}
        </div>

        {/* Bottom Google AdSense Placement */}
        <AdSenseBanner slotId="article-bottom-leaderboard" format="horizontal" label="Recommended Resources" />

        {/* Frequently Asked Questions Accordion */}
        {article.faq && article.faq.length > 0 && (
          <div className="pt-6 border-t border-slate-800 space-y-4">
            <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              <span>Touring Q&A: Practical Realities</span>
            </h3>

            <div className="space-y-3">
              {article.faq.map((item, qIdx) => {
                const isOpen = openFaqIndex === qIdx;
                return (
                  <div
                    key={qIdx}
                    className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : qIdx)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 font-bold text-sm text-white hover:text-emerald-400 transition-colors cursor-pointer"
                    >
                      <span>{item.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180 text-emerald-400" : ""}`} />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/60">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Author Bio Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-3">
          <div className="flex items-center gap-3">
            <FounderAvatar size="md" className="shrink-0" />
            <div>
              <h4 className="font-black text-white text-base">Written by {article.author.name}</h4>
              <p className="text-xs text-slate-400">{article.author.role}</p>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {article.author.bio} Little Rusty built GigLizard to end the paywalling and predatory subscription pricing that independent touring bands face every day. All production tools, stage plots, and venue directories remain 100% free forever.
          </p>
        </div>

        {/* Semantic Related Articles Block (t_orphan_pages, c_internal_links) */}
        <aside aria-label="Related" className="pt-8 border-t border-slate-800 space-y-4">
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <span>Related Tour &amp; Production Playbooks</span>
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((rel) => (
              <li key={rel.slug} className="bg-slate-900/60 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all flex flex-col justify-between">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 block font-mono">
                    {rel.category}
                  </span>
                  <a
                    href={`/articles/${rel.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onSelectArticle(rel.slug);
                    }}
                    className="text-sm font-bold text-white hover:text-emerald-400 transition-colors line-clamp-2"
                  >
                    {rel.title}
                  </a>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {rel.excerpt}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{rel.readTimeMinutes} min read</span>
                  <span className="text-emerald-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5">
                    Read Playbook &rarr;
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* Previous & Next Article Navigation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          {prevArticle ? (
            <button
              onClick={() => onSelectArticle(prevArticle.slug)}
              className="p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-left transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-emerald-400">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Playbook</span>
              </div>
              <h5 className="text-sm font-bold text-white mt-1 line-clamp-2">
                {prevArticle.title}
              </h5>
            </button>
          ) : <div />}

          {nextArticle ? (
            <button
              onClick={() => onSelectArticle(nextArticle.slug)}
              className="p-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-900 text-right transition-all cursor-pointer group flex flex-col justify-between items-end"
            >
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 group-hover:text-emerald-400">
                <span>Next Playbook</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
              <h5 className="text-sm font-bold text-white mt-1 line-clamp-2">
                {nextArticle.title}
              </h5>
            </button>
          ) : <div />}
        </div>
      </div>
    </article>
  );
}
