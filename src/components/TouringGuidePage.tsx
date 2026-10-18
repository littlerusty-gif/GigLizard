import React, { useState } from "react";
import { 
  Compass, MapPin, Building, Users, Calendar, 
  ArrowRight, CheckCircle2, Sliders, FileText, DollarSign,
  Fuel, ShieldCheck, ChevronDown, ChevronUp, Sparkles, BookOpen
} from "lucide-react";

interface TouringGuidePageProps {
  onSelectTab: (tab: any) => void;
  onOpenRegister?: () => void;
}

export default function TouringGuidePage({ onSelectTab, onOpenRegister }: TouringGuidePageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const guideFaqs = [
    {
      q: "How far in advance should a DIY band reach out to clubs for middle dates?",
      a: "For 100–300 capacity rooms, the sweet spot is 8 to 12 weeks out. Anything past 16 weeks and small club calendars aren't locked; anything under 4 weeks and you're fighting for last-minute cancellations. If you already have your weekend bookends confirmed (e.g. Friday and Saturday), mention those dates in your pitch subject line to prove routing viability."
    },
    {
      q: "What is a 'co-bill show swap' and why is it essential for out-of-town bands?",
      a: "A show swap means you invite a local band from your corridor city to co-bill and bring their home draw; in exchange, you promise to open for them or headline a co-bill in your hometown when they tour your corridor. Talent buyers love this because it guarantees ticket sales without depending solely on an unknown touring act."
    },
    {
      q: "Why do sound engineers get angry about missing stage plots?",
      a: "Front of House (FOH) engineers often manage 3–4 bands per night with 15-minute changeovers. If they don't have an accurate input list (D.I. boxes, vocal boom mic counts, monitor mixes), line check turns into chaos. Handing the engineer a clean, printed GigLizard stage plot at 5:00 PM load-in immediately earns their respect."
    },
    {
      q: "How do we budget van gas and drive times realistically?",
      a: "Always cap van drives at 4.5 to 5 hours per day between gigs. Factor in 12–14 MPG for an Econoline or passenger van loaded with gear, and add a 20% margin for construction and rush hour traffic around metro corridors like I-95, I-5, or I-35."
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-12 animate-fade-in" id="touring-guide-page">
      
      {/* Category Hero */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-full border border-indigo-200">
          <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
          <span>Working Musician Category Guide • Lower 48</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          How to Book a DIY Tour Across the Lower 48 Without an Agent
        </h1>
        <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl mx-auto">
          The battle-tested playbook for 3–6 piece self-managed bands: how to lock anchor dates, fill open middle dates in corridor cities, coordinate local co-bills, and show up looking 100% professional.
        </p>
      </div>

      {/* Guide Step 1 */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">1</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Bookend Your Tour Calendar First</h2>
        </div>
        <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
          Most failed DIY tours start by emailing 50 random clubs with no anchors. Instead, lock down two solid weekend bookends first (e.g. Seattle on Friday the 15th and Boise or Salt Lake City on the 20th). Once your bookends are confirmed, you now have a tangible <em>routing corridor</em>. Club talent buyers in the middle cities take pitches 3x more seriously when they see a band is actively on the road between two confirmed anchors.
        </p>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
          <p className="font-bold text-slate-900 mb-1">💡 Pitch Subject Line Template:</p>
          <code className="text-indigo-600 font-mono text-[11px] block bg-white p-2 rounded border border-slate-200">
            Booking Request: [Band Name] ([Genre]) • Routing Through [City] between [Date A] & [Date B]
          </code>
        </div>
      </div>

      {/* Guide Step 2 */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">2</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Eliminate Wishy-Washy Middle Dates with Co-Bills</h2>
        </div>
        <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
          The single biggest anxiety in independent touring is open middle dates ("got some tenuous stuff, but the middle is wishy-washy"). Don't wait for cold-email replies from overloaded bookers. Open GigLizard's <strong>Active Band Directory</strong>, filter by your corridor cities (e.g., Spokane, Missoula, Eugene), and reach out directly to 2–3 active acts in your genre. Offer to split a bill or show-swap. Presenting a complete bill with a local draw turns a booker's hesitation into an instant confirmation.
        </p>
      </div>

      {/* Guide Step 3 */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">3</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Show Up Looking Professional (Stage Plots & Tech Riders)</h2>
        </div>
        <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
          The difference between an amateur band and a respected touring act happens at 5:00 PM load-in. Never make the venue's audio technician guess your channel count. Use GigLizard's free <strong>Stage Plot Designer</strong> and <strong>Tech Rider Builder</strong> to map your drum configuration, guitar amp D.I. preferences, and +48V phantom power lines. When you hand the FOH tech a crisp diagram, they will dial in your monitor mixes faster and make you sound amazing.
        </p>
      </div>

      {/* Guide Step 4 */}
      <div className="bg-white rounded-3xl border border-gray-200 p-6 md:p-8 space-y-4 shadow-xs">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">4</span>
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Calculate Drive Times & Van Fuel Before You Roll</h2>
        </div>
        <p className="text-xs md:text-sm text-gray-700 leading-relaxed">
          Tours fail financially when bands underestimate fuel costs or commit to 8-hour overnight drives after 2:00 AM load-outs. Use GigLizard's <strong>Smart Tour Planner</strong> to simulate your route with Google Maps, calculate exact highway fuel burn based on current regional gas averages, and find band-friendly lodging along the corridor.
        </p>
      </div>

      {/* FAQ Section */}
      <div className="space-y-4 pt-4">
        <h3 className="text-xl font-black text-slate-900">Frequently Asked Touring Questions</h3>
        <div className="space-y-2">
          {guideFaqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left flex items-center justify-between font-bold text-xs md:text-sm text-slate-900 hover:text-indigo-600 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp className="w-4 h-4 text-indigo-600 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Box */}
      <div className="bg-slate-950 text-white rounded-3xl p-8 text-center space-y-5 border border-slate-900 shadow-xl">
        <h3 className="text-2xl md:text-3xl font-black tracking-tight">Ready to Book Your Next Tour?</h3>
        <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto">
          Start searching 4,800+ independent clubs, map your tour route, and build stage plots for $0. No credit card required.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => onSelectTab("venues")}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2"
          >
            <span>Search 4,800+ Venues (Free)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onSelectTab("tour")}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl border border-slate-800 cursor-pointer transition-all"
          >
            Open Smart Tour Planner ($0)
          </button>
        </div>
      </div>

    </div>
  );
}
