import React, { useEffect } from "react";
import { Sliders, Volume2, ShieldCheck, HelpCircle, CheckCircle, Radio, Sparkles, Layers, FileText, ArrowRight } from "lucide-react";

export default function StagePlotSeoGuide() {
  // Inject SoftwareApplication + FAQPage JSON-LD structured data into document.head
  useEffect(() => {
    const pageTitle = "Free Stage Plot Maker & Band Input List Template | GigLizard";
    const pageDescription = "Build professional stage plots, patch lists, and tech riders online for free. Drag-and-drop gear layout, printable PDF export for sound engineers and venues.";
    const canonicalUrl = "https://giglizard.us/tools/stage-plot";

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
          "@id": "https://giglizard.us/tools/stage-plot#software",
          "name": "GigLizard Stage Plot & Input List Maker",
          "applicationCategory": "MultimediaApplication",
          "operatingSystem": "Web",
          "url": "https://giglizard.us/tools/stage-plot",
          "description": pageDescription,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          },
          "keywords": "free stage plot maker, stage plot creator, band input list template, tech rider builder, drum and amp stage diagram"
        },
        {
          "@type": "FAQPage",
          "@id": "https://giglizard.us/tools/stage-plot#faq",
          "mainEntity": [
            {
              "@type": "Question",
              "name": "What is a stage plot and why does my band need one?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A stage plot is a visual top-down graphic diagram illustrating where each band member stands on stage, where drum kits, guitar amplifiers, bass rigs, and keyboards are located, and where vocal microphones and monitor wedges need to be positioned. Sending a clear stage plot 2 to 4 weeks prior to a show allows the venue's front-of-house (FOH) and monitor sound technicians to patch lines, set mic stands, and route monitors before your band arrives, drastically shortening line check times and preventing audio feedback during your set."
              }
            },
            {
              "@type": "Question",
              "name": "What should be included on a band input list?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "A professional band input list (or patch list) should include the channel number, instrument name, microphone or DI preference (e.g. Shure Beta 52 for kick, SM57 for guitar amp, active DI box for bass), microphone stand type (tall boom, short boom, straight stand), +48V phantom power requirement, and monitor mix notes. Following standard channel order—drums first, followed by bass, guitars, keyboards, acoustic instruments, and lead/backing vocals—ensures any venue sound engineer can patch your band quickly without confusion."
              }
            },
            {
              "@type": "Question",
              "name": "How do I export and send my stage plot to a sound engineer?",
              "acceptedAnswer": {
                "@type": "Answer",
                "text": "With GigLizard, you can export your completed stage plot and input list as a high-resolution, print-ready PDF or high-DPI PNG directly from your browser with a single click. You can also generate a shareable web link to include in your booking email or electronic press kit (EPK) when confirming advance show details with talent buyers and production managers."
              }
            }
          ]
        }
      ]
    };

    let scriptTag = document.getElementById("stage-plot-seo-jsonld") as HTMLScriptElement | null;
    if (!scriptTag) {
      scriptTag = document.createElement("script");
      scriptTag.id = "stage-plot-seo-jsonld";
      scriptTag.type = "application/ld+json";
      document.head.appendChild(scriptTag);
    }
    scriptTag.text = JSON.stringify(structuredData, null, 2);

    return () => {
      const existing = document.getElementById("stage-plot-seo-jsonld");
      if (existing) existing.remove();
    };
  }, []);

  return (
    <section 
      id="stage-plot-comprehensive-guide" 
      aria-label="Musician Guide to Stage Plots and Band Input Lists"
      className="mt-12 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 md:p-10 shadow-sm space-y-10 text-slate-800"
    >
      {/* Header with High-Volume Search Keywords */}
      <div className="space-y-3 max-w-4xl">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-black px-3.5 py-1.5 rounded-full uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Free Stage Plot Maker &amp; Band Input List Template</span>
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
          The Musician&apos;s Complete Guide to Professional Stage Plots &amp; Audio Input Lists
        </h2>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
          Whether you&apos;re touring regional music clubs or preparing for festival showcases, an accurate <strong>stage plot creator</strong> and organized <strong>tech rider builder</strong> are your band&apos;s secret weapon. Sound engineers handle dozens of acts every weekend; having your gear layout and input patch ready guarantees a stress-free soundcheck and pristine front-of-house mix.
        </p>
      </div>

      {/* Grid: Stage Plot Symbols & Equipment Layout */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" />
            <span>Essential Stage Plot Symbols &amp; Physical Gear Diagrams</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear visual symbols allow stagehands and monitor engineers to drop cables and mic stands before your gear leaves the van.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs font-mono">🥁</span>
              <span>Drum Kit &amp; Risers</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Positioned <strong>Upstage Center</strong>. Indicate kick, snare, toms, hi-hat, and overheads. Specify if your drummer uses a click track, electronic sampling pads, or requires an on-stage 120V AC quad-box drop.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-mono">🔊</span>
              <span>Bass Amp &amp; Direct Box (DI)</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Standard placement is <strong>Stage Left</strong> (audience right) or Stage Right next to the hi-hat. Mark whether your bass rig provides an XLR direct out or if an active 48V phantom-powered DI box is required.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-mono">🎸</span>
              <span>Guitar Cabinets &amp; Combos</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Clearly designate <strong>Stage Right</strong> and Stage Left amplifiers. Indicate preferred microphones (e.g. Shure SM57 or Sennheiser e906) and note whether amps can be tilted back to reduce stage bleed.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-mono">📐</span>
              <span>Monitor Wedges &amp; In-Ear Monitors</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Draw triangular wedge symbols along the <strong>downstage frontline</strong> and beside the drum throne. Number each monitor mix (Mix 1 = Lead Vox, Mix 2 = Guitar, Mix 3 = Bass, Mix 4 = Drummer).
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center text-xs font-mono">🎤</span>
              <span>Vocal Mics &amp; Boom Stands</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Indicate each vocal position across the frontline. Specify tall telescoping boom stands for singing guitarists/bassists and straight round-base stands for dynamic lead frontmen.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-black text-slate-900 text-sm">
              <span className="w-6 h-6 rounded-lg bg-purple-600 text-white flex items-center justify-center text-xs font-mono">🎹</span>
              <span>Keyboards, Synthesizers &amp; DIs</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Note mono or stereo line requirements (Channels L/R). Indicate power outlet drops for keyboard power supplies, pedalboards, and laptop audio interfaces.
            </p>
          </div>
        </div>
      </div>

      {/* Standard Channel List Numbering Architecture */}
      <div className="space-y-4">
        <div className="border-b border-slate-200 pb-3">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <span>Universal Front-of-House (FOH) Channel List Numbering Standard</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Every professional soundboard across the globe follows this sequential order. Organizing your <strong>band input list template</strong> this way guarantees sound engineers can patch instantly without repatching snake boxes.
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Channel Group</th>
                <th className="py-3 px-4">Standard Instrument Order</th>
                <th className="py-3 px-4">Typical Microphone / Transducer</th>
                <th className="py-3 px-4">Audio Engineering Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Channels 1–6</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Drums (Kick, Snare, Toms, Overheads)</td>
                <td className="py-2.5 px-4 text-slate-600">Beta 52, SM57, e604, Small Condensers</td>
                <td className="py-2.5 px-4 text-slate-500">Drives rhythmic low-end and high-pass gain staging first.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Channel 7</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Bass Guitar (Direct Box)</td>
                <td className="py-2.5 px-4 text-slate-600">Active DI Box (Radial J48, BSS AR-133)</td>
                <td className="py-2.5 px-4 text-slate-500">Locks with Kick Drum fundamental frequency (40–100 Hz).</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Channels 8–9</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Electric Guitars (Stage Right / Left)</td>
                <td className="py-2.5 px-4 text-slate-600">Shure SM57, Sennheiser e906 / e609</td>
                <td className="py-2.5 px-4 text-slate-500">Mirrors physical stage positions for stereo FOH panning.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Channels 10–11</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Keyboards &amp; Synths (Stereo L/R)</td>
                <td className="py-2.5 px-4 text-slate-600">Stereo Passive/Active Direct Box</td>
                <td className="py-2.5 px-4 text-slate-500">Eliminates ground hum and matches line-level outputs.</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-indigo-600">Channels 12–15</td>
                <td className="py-2.5 px-4 font-semibold text-slate-900">Lead &amp; Backing Vocals</td>
                <td className="py-2.5 px-4 text-slate-600">Shure SM58, Beta 58A, sE V7</td>
                <td className="py-2.5 px-4 text-slate-500">Highest priority foldback channels; isolated from instrument bleed.</td>
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
            <span>Frequently Asked Questions About Band Stage Plots &amp; Input Lists</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Common questions answered by touring sound engineers and venue production managers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                What is a stage plot and why does my band need one?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                A stage plot is a visual top-down graphic diagram illustrating where each band member stands on stage, where drum kits, guitar amplifiers, bass rigs, and keyboards are located, and where vocal microphones and monitor wedges need to be positioned. Sending a clear stage plot 2 to 4 weeks prior to a show allows the venue&apos;s front-of-house (FOH) and monitor sound technicians to patch lines, set mic stands, and route monitors before your band arrives, drastically shortening line check times and preventing audio feedback during your set.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Standard Touring Requirement</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                What should be included on a band input list?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                A professional band input list (or patch list) should include the channel number, instrument name, microphone or DI preference (e.g. Shure Beta 52 for kick, SM57 for guitar amp, active DI box for bass), microphone stand type (tall boom, short boom, straight stand), +48V phantom power requirement, and monitor mix notes. Following standard channel order—drums first, followed by bass, guitars, keyboards, acoustic instruments, and lead/backing vocals—ensures any venue sound engineer can patch your band quickly without confusion.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audio Engineer Patch Protocol</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-2 flex flex-col justify-between">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm leading-snug">
                How do I export and send my stage plot to a sound engineer?
              </h4>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                With GigLizard, you can export your completed stage plot and input list as a high-resolution, print-ready PDF or high-DPI PNG directly from your browser with a single click. You can also generate a shareable web link to include in your booking email or electronic press kit (EPK) when confirming advance show details with talent buyers and production managers.
              </p>
            </div>
            <div className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 pt-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click PDF / PNG Export</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
