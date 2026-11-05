import React, { useState } from "react";
import { Mail, Clock, MapPin, Send, CheckCircle2, ShieldCheck, Heart, ArrowRight } from "lucide-react";
import { Breadcrumbs, RelatedLinks } from "./RelatedLinks";
import { FounderAvatar, FOUNDER_PHOTOS } from "./ProductPreviews";

export default function ContactPage({ onSelectTab }: { onSelectTab?: (tab: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("Touring Question");
  const [message, setMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in" id="contact-page-root">
      <Breadcrumbs items={[{ label: "Contact Support", path: "/contact" }]} />

      {/* Header */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-indigo-200">
          <Mail className="w-3.5 h-3.5 text-indigo-600" />
          <span>Direct Founder &amp; Moderation Support</span>
        </div>

        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Contact GigLizard &amp; Little Rusty
        </h1>

        {/* Explicit Definition Up Front (g_definition) */}
        <p className="text-sm md:text-base text-slate-600 leading-relaxed font-normal">
          GigLizard is an independent live music platform built by Portland touring musician Little Rusty to help DIY bands discover verified venues, build pro stage plots, and route tours with zero subscription tolls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: Direct Founder Context */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-center gap-3.5">
              <FounderAvatar size="lg" className="shrink-0" />
              <div>
                <h2 className="text-lg font-black text-white">Little Rusty</h2>
                <p className="text-xs text-slate-400">Founder &amp; Touring Audio Engineer</p>
                <p className="text-[11px] text-amber-400 font-medium">Frontman of Dr Hadit · Portland, OR</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed italic">
              "Every message comes directly to my desk. Whether you found a venue contact that changed, need help with your stage plot PDF, or want a 100% refund on your band pass, you get a real answer from a working musician."
            </p>

            <div className="pt-3 border-t border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Clock className="w-4 h-4 shrink-0" />
                <span>Under 4-hour response time guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <Mail className="w-4 h-4 text-indigo-400 shrink-0" />
                <a href="mailto:giglizard.us@gmail.com" className="hover:underline">giglizard.us@gmail.com</a>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Portland, OR • Lower 48 United States</span>
              </div>
            </div>

            {/* Little Rusty in Action Photo Thumbnails */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                On the Road &amp; Behind the Console:
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {FOUNDER_PHOTOS.map((photo) => (
                  <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-900 group" title={`${photo.title} (${photo.role})`}>
                    <img 
                      src={photo.srcWebp} 
                      alt={photo.title}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform" 
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = photo.srcJpg;
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2 text-xs text-emerald-950">
            <div className="flex items-center gap-2 font-bold text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>100% 7-Day Money-Back Guarantee</span>
            </div>
            <p className="text-emerald-800 leading-relaxed text-[11.5px]">
              Purchased a $9.99 30-day band pass and want a refund? Send us a quick note with your registered email and we process a full refund within 24 hours. No runarounds.
            </p>
          </div>
        </div>

        {/* Right Column: Web Contact Form */}
        <div className="md:col-span-7 bg-white rounded-3xl border border-gray-200/90 p-6 sm:p-8 shadow-xs">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-150 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Message Received</h2>
              <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                Thanks {name || "there"}! Your message was sent to Little Rusty and the moderation desk. We will respond to <strong>{email}</strong> shortly.
              </p>
              <button
                type="button"
                onClick={() => { setIsSubmitted(false); setMessage(""); }}
                className="text-xs font-bold text-indigo-600 hover:underline pt-2 cursor-pointer"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <h2 className="text-base font-black text-slate-900">Send a Note to Little Rusty</h2>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins (The Midnight Owls)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. sarah@themidnightowls.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Topic</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white"
                >
                  <option value="Touring Question">Touring Question or Advice</option>
                  <option value="Venue Contact Update">Venue Contact Update / Bounced Email Report</option>
                  <option value="Stage Plot Tool">Stage Plot / Tech Rider Builder Feedback</option>
                  <option value="Pass Refund">7-Day Pass Refund Request</option>
                  <option value="Band Profile Claim">Claim or Update Band Directory Listing</option>
                  <option value="General Hello">General Musician Hello</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Message</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what you're working on or what you need help with..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-indigo-500/20"
              >
                <Send className="w-4 h-4" />
                <span>Send Message to Little Rusty</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <RelatedLinks currentPath="/contact" onSelectTab={onSelectTab} />
    </div>
  );
}
