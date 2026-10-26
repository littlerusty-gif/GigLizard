import React, { useEffect } from "react";
import { Sparkles, Palette, HelpCircle, CheckCircle, Image as ImageIcon, Printer, ShieldCheck, ArrowRight, Eye, Layers } from "lucide-react";

export default function PosterDesignerSeoGuide() {
  // Inject SoftwareApplication + FAQPage JSON-LD structured data into document.head
  useEffect(() => {
    const pageTitle = "Free Gig Poster Maker & Concert Flyer Generator | GigLizard";
    const pageDescription = "Design custom gig posters, tour tour-date flyers, and social banners for your live shows. Print-ready 300 DPI exports and Instagram story dimensions.";
    const canonicalUrl = "https://giglizard.us/tools/poster-designer";

    document.title = pageTitle;

    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", pageDescription);

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement("link");
      canonicalLink.setAttribute("rel", "canonical");
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute("href", canonicalUrl);

    // OpenGraph & Twitter tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", pageTitle);
    let ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", pageDescription);
    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute("content", canonicalUrl);

    let twTitle = document.querySelector('meta[name="twitter:title"]');
    if (twTitle) twTitle.setAttribute("content", pageTitle);
    let twDesc = document.querySelector('meta[name="twitter:description"]');
    if (twDesc) twDesc.setAttribute("content", pageDescription);

    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": ["WebApplication", "SoftwareApplication"],
          "@id": "https://giglizard.us/tools/poster-designer#software",
          "name": "GigLizard Gig Poster Maker",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web",
          "url": "https://giglizard.us/tools/poster-designer",
          "description": pageDescription,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "keywords": "free gig poster maker, band flyer generator, concert poster designer, tour flyer maker, printable band poster template"
        },
        {
          "@type": "FAQPage",
          "@id": "https://giglizard.us/tools/poster-designer#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What information must be included on a concert gig poster?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "An effective gig poster must clearly feature the headlining band name, direct supporting acts, day of the week, full date, venue name and city, door and show times, ticket price (or advance ticket QR code), age policy (21+, 18+, or All Ages), and presenting promoter or sponsor logo. Keeping this information legible from 5 feet away ensures club patrons and passersby instantly grasp show details."
              }
            },
            {
              "@type": "Question",
              "name": "What are the standard dimensions for band flyers and gig posters?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "The most common print format for music venues, telephone poles, and record store windows is 11x17 inches (Tabloid) printed at 300 DPI. For social media marketing, 9:16 vertical (1080x1920 px) is standard for Instagram Stories and TikTok, while 4:5 vertical (1080x1350 px) and 1:1 square (1080x1080 px) are ideal for Instagram and Facebook feed posts."
              }
            },
            {
              "@type": "Question",
              "name": "Can I export my flyer in both print (11x17) and social (9:16) aspect ratios?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "Yes. GigLizard's poster studio allows you to switch between 11x17 vertical print posters, 9:16 vertical social story flyers, and square social feed formats with instant vector typography rendering and 300 DPI export ready for commercial printers and digital screens."
              }
            }
          ]
        }
      ]
    };

    let scriptTag = document.getElementById("poster-designer-seo-jsonld") as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "poster-designer-seo-jsonld";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(structuredData, null, 2);

    return () => {
      const existing = document.getElementById("poster-designer-seo-jsonld");
      if (existing) existing.remove();
    };
  }, []);

  return (
    <section 
      id="gig-poster-comprehensive-guide" 
      aria-label="Musician Guide to Gig Posters and Concert Flyers"
      className="mt-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 md:p-10 shadow-sm space-y-10 text-slate-800"
    >
      {/* Header with High-Volume Search Keywords */}
      <div className="space-y-3 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Free Gig Poster Maker &amp; Concert Flyer Generator</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          The Musician&apos;s Blueprint for Eye-Catching Concert Posters &amp; Tour Flyers
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          In a world saturated with digital noise, a high-impact <strong>concert poster designer</strong> and printable <strong>band flyer generator</strong> are essential tools for filling rooms. Great gig posters bridge telephone poles, coffee shop bulletin boards, and Instagram Stories to convert casual listeners into ticket buyers.
        </p>
      </div>

      {/* Grid: Essential Information Architecture */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Essential Information Hierarchy for High-Converting Gig Flyers</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow the 5-second readability rule: passersby should absorb headline acts, date, and venue in a single glance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">1</span>
              <span>Headlining Band Dominance</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Allocate at least 40% of the visual typography weight to your headliner. Use bold, heavy condensed typefaces with sharp silhouettes that pop from across a crowded bar or street corner.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">2</span>
              <span>Supporting Acts &amp; Co-Bills</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              List touring support and local openers with clean secondary hierarchy (approx 50% headliner size). Never crowd names with illegible decorative scripts that frustrate fans.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">3</span>
              <span>Day of Week &amp; Date Callout</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Always include the day of the week (e.g., &ldquo;FRIDAY, NOVEMBER 14&rdquo;). People plan weekends around days, not just calendar numbers. Highlight special tour kickoff or album release dates.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">4</span>
              <span>Venue Name, City &amp; Neighborhood</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              State the exact venue name and city/neighborhood clearly. Fans in multi-market metro areas need to know immediately if the gig is in Seattle, Tacoma, or Bellingham without googling.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">5</span>
              <span>Doors, Show Times &amp; Ticket Price</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Specify &ldquo;Doors 8 PM / Show 9 PM&rdquo; and pricing (e.g., &ldquo;$12 ADV / $15 DOS&rdquo;). If advance tickets are available, embed a clean scannable QR code in the bottom corner.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-mono">6</span>
              <span>Age Restrictions (21+ vs All Ages)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Nothing burns fan goodwill faster than an underage fan being turned away at the door. Clearly mark &ldquo;21+ with Valid ID&rdquo; or &ldquo;All-Ages Welcome&rdquo; near the venue name.
            </p>
          </div>
        </div>
      </div>

      {/* High-Contrast Design Guidelines for Dim Venue Lighting */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Eye className="w-5 h-5 text-indigo-600" />
            <span>High-Contrast Design Guidelines for Dim Bar Lighting &amp; Dark Venue Walls</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Music clubs, green rooms, and venue entryways are notorious for dim amber or blue stage wash. Here is how to keep your poster legible.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">
              Rule 1: Strict WCAG AAA Contrast
            </div>
            <h4 className="font-extrabold text-sm text-white">Avoid Dark-on-Dark Muddy Tones</h4>
            <p className="text-slate-300 leading-relaxed">
              Never put dark red, deep purple, or navy text on a black or charcoal background. Under 15-watt club lighting, dark colors blur together into an illegible dark rectangle. Use high-key contrast: pure white, vibrant cadmium yellow, electric cyan, or hot neon magenta.
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="text-indigo-400 font-bold uppercase tracking-wider text-[11px]">
              Rule 2: Margin &amp; Staple Gun Safe Zone
            </div>
            <h4 className="font-extrabold text-sm text-white">Keep Critical Text 0.5&quot; In From Edges</h4>
            <p className="text-slate-300 leading-relaxed">
              When street-teaming telephone poles and venue entry boards, staple guns and heavy blue painter&apos;s tape always clip poster corners and edges. Keep band names and dates at least 0.5 inches (36 pt) inside the border so staples never punch out vital gig information.
            </p>
          </div>

          <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-3">
            <div className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">
              Rule 3: Halftone &amp; Screenprint Aesthetics
            </div>
            <h4 className="font-extrabold text-sm text-white">Heavy Ink Density &amp; Grain</h4>
            <p className="text-slate-300 leading-relaxed">
              Vintage halftone screen patterns, duotone distress, and bold vector linework print dramatically better on budget laser copiers than delicate photorealistic gradients. A high-contrast graphic cuts through visual clutter in any dive bar or record store window.
            </p>
          </div>
        </div>
      </div>

      {/* Print Dimensions (11x17) vs Social Feeds (9:16) */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            <span>Standard Print Dimensions vs Social Media Story Formats</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Quick reference guide for export resolutions and aspect ratios across physical venues and digital promo.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Format / Medium</th>
                <th className="py-3 px-4">Aspect Ratio</th>
                <th className="py-3 px-4">Pixel Resolution (300 DPI)</th>
                <th className="py-3 px-4">Best Used For</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">11 x 17 Tabloid (Standard Print)</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">11:17 Vertical</td>
                <td className="py-2.5 px-4 text-slate-600 font-mono">3300 x 5100 px</td>
                <td className="py-2.5 px-4 text-slate-500">Music club walls, venue windows, telephone poles, merch tables.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Instagram / TikTok Stories</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">9:16 Vertical</td>
                <td className="py-2.5 px-4 text-slate-600 font-mono">1080 x 1920 px</td>
                <td className="py-2.5 px-4 text-slate-500">Instagram Stories, TikTok show announcements, mobile link stickers.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Instagram Portrait Feed</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">4:5 Vertical</td>
                <td className="py-2.5 px-4 text-slate-600 font-mono">1080 x 1350 px</td>
                <td className="py-2.5 px-4 text-slate-500">Optimal feed display that occupies maximum mobile screen real estate.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Square Feed &amp; Vinyl Cover</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">1:1 Square</td>
                <td className="py-2.5 px-4 text-slate-600 font-mono">1080 x 1080 px</td>
                <td className="py-2.5 px-4 text-slate-500">Facebook posts, Bandcamp gig teasers, Spotify canvas banners.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequently Asked Questions Section (FAQPage Schema Parity) */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" />
            <span>Frequently Asked Questions About Gig Posters &amp; Tour Flyers</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Answers to common design, printing, and social marketing questions for touring bands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                What information must be included on a concert gig poster?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                An effective gig poster must clearly feature the headlining band name, direct supporting acts, day of the week, full date, venue name and city, door and show times, ticket price (or advance ticket QR code), age policy (21+, 18+, or All Ages), and presenting promoter or sponsor logo. Keeping this information legible from 5 feet away ensures club patrons and passersby instantly grasp show details.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Core Gig Poster Checklist</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                What are the standard dimensions for band flyers and gig posters?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                The most common print format for music venues, telephone poles, and record store windows is 11x17 inches (Tabloid) printed at 300 DPI. For social media marketing, 9:16 vertical (1080x1920 px) is standard for Instagram Stories and TikTok, while 4:5 vertical (1080x1350 px) and 1:1 square (1080x1080 px) are ideal for Instagram and Facebook feed posts.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Print &amp; Screen Specifications</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                Can I export my flyer in both print (11x17) and social (9:16) aspect ratios?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Yes. GigLizard&apos;s poster studio allows you to switch between 11x17 vertical print posters, 9:16 vertical social story flyers, and square social feed formats with instant vector typography rendering and 300 DPI export ready for commercial printers and digital screens.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Instant Multi-Format Export</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
