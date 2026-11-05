import React from "react";
import { ChevronRight, ArrowRight, MapPin, Sliders, FileText, Compass, DollarSign, Scale, BookOpen, Heart, Mail } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  path: string;
}

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-xs text-slate-500">
      <ol className="flex flex-wrap items-center gap-1.5 list-none p-0 m-0">
        <li>
          <a href="/" className="hover:text-indigo-600 transition-colors font-medium">Home</a>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={item.path}>
              <li aria-hidden="true" className="text-slate-400">
                <ChevronRight className="w-3.5 h-3.5 inline" />
              </li>
              <li>
                {isLast ? (
                  <span className="font-semibold text-slate-800" aria-current="page">{item.label}</span>
                ) : (
                  <a href={item.path} className="hover:text-indigo-600 transition-colors font-medium">{item.label}</a>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

export interface RelatedLinkItem {
  title: string;
  description: string;
  path: string;
  icon?: "venue" | "plot" | "rider" | "tour" | "pricing" | "compare" | "guide" | "about" | "contact";
}

const DEFAULT_RELATED_LINKS: RelatedLinkItem[] = [
  {
    title: "Free Music Venue Directory",
    description: "Search 4,800+ independent clubs with direct talent buyer emails across all 48 lower states.",
    path: "/venues",
    icon: "venue"
  },
  {
    title: "Drag-and-Drop Stage Plot Maker",
    description: "Design drum risers, amp stacks, and monitor sends with instant 300 DPI PDF export.",
    path: "/plot",
    icon: "plot"
  },
  {
    title: "Live Sound Tech Rider Builder",
    description: "Generate 24-channel soundboard input lists, mic preferences, and +48V phantom power notes.",
    path: "/rider",
    icon: "rider"
  },
  {
    title: "AI Tour Route Planner & Gas Calculator",
    description: "Calculate driving routes, fuel costs, lodging, and corridor stop suggestions between gigs.",
    path: "/tour",
    icon: "tour"
  },
  {
    title: "Transparent DIY Tour Pricing",
    description: "Free venue discovery forever and an optional $9.99 flat 30-day band contacts pass.",
    path: "/pricing",
    icon: "pricing"
  },
  {
    title: "GigLizard vs Sonicbids & Rivals",
    description: "Compare GigLizard against Sonicbids, Prism.fm, and Gigwell with zero recurring subscription traps.",
    path: "/compare",
    icon: "compare"
  },
  {
    title: "Practical DIY Tour Playbook",
    description: "Read expert strategies for booking club dates, pitching bookers, and budgeting van fuel.",
    path: "/touring-guide",
    icon: "guide"
  },
  {
    title: "About Little Rusty from Portland",
    description: "Learn the origin story behind GigLizard, built by a touring musician and live sound engineer.",
    path: "/about",
    icon: "about"
  }
];

export function RelatedLinks({ 
  currentPath, 
  customLinks, 
  heading = "Related Touring Tools & Resources",
  onSelectTab
}: { 
  currentPath?: string;
  customLinks?: RelatedLinkItem[];
  heading?: string;
  onSelectTab?: (tab: string) => void;
}) {
  const allLinks = customLinks || DEFAULT_RELATED_LINKS;
  const filtered = allLinks.filter(l => l.path !== currentPath).slice(0, 4);

  const getIcon = (type?: string) => {
    switch (type) {
      case "venue": return <MapPin className="w-4 h-4 text-rose-500" />;
      case "plot": return <Sliders className="w-4 h-4 text-orange-500" />;
      case "rider": return <FileText className="w-4 h-4 text-blue-500" />;
      case "tour": return <Compass className="w-4 h-4 text-indigo-500" />;
      case "pricing": return <DollarSign className="w-4 h-4 text-emerald-500" />;
      case "compare": return <Scale className="w-4 h-4 text-amber-500" />;
      case "guide": return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case "about": return <Heart className="w-4 h-4 text-rose-500" />;
      default: return <ArrowRight className="w-4 h-4 text-indigo-500" />;
    }
  };

  const handleClick = (e: React.MouseEvent, path: string) => {
    if (onSelectTab) {
      e.preventDefault();
      const tab = path.replace(/^\//, "");
      onSelectTab(tab || "home");
      window.history.pushState(null, "", path);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <aside aria-label="Related" className="mt-12 pt-8 border-t border-slate-200/80 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          <span>{heading}</span>
        </h2>
        <span className="text-xs text-slate-400">Independent live music workspace</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {filtered.map((item) => (
          <a
            key={item.path}
            href={item.path}
            onClick={(e) => handleClick(e, item.path)}
            className="group block p-4 bg-white rounded-2xl border border-gray-200/90 hover:border-indigo-300 hover:shadow-md transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-indigo-50 transition-colors">
                {getIcon(item.icon)}
              </div>
              <span className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {item.title}
              </span>
            </div>
            <p className="text-[11.5px] text-slate-500 leading-snug line-clamp-2">
              {item.description}
            </p>
            <div className="mt-2 text-[10.5px] font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
              Explore →
            </div>
          </a>
        ))}
      </div>
    </aside>
  );
}
