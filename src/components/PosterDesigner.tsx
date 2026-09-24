import React, { useState } from "react";
import { PosterConfig, SloganProposal } from "../types";
import { 
  Sparkles, Image, RefreshCw, Layers, CheckSquare, Wine, UtensilsCrossed, 
  Calendar, DollarSign, MapPin, Eye, Wand2, Check, Download, Truck, Printer, 
  CreditCard, ShoppingBag, ArrowLeft 
} from "lucide-react";
import html2canvas from "html2canvas";


// Maps theme presets and dynamic color swatch selections into cohesive visual elements
const getThemeClasses = (themeId: string, colorId: string = "default") => {
  const isDefault = colorId === "default";
  
  switch (themeId) {
    case "heavy-grunge": {
      if (isDefault) {
        return {
          frame: "bg-red-950 text-orange-200 border-2 border-red-900 font-sans tracking-tighter",
          tagline: "text-orange-500",
          bandName: "text-red-100",
          venueName: "text-orange-300",
          dateBadge: "bg-red-900/40 text-rose-100",
          timeBadge: "bg-orange-950/40 text-orange-400",
          graphicColor: "text-orange-500",
          sloganColor: "text-orange-500"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-red-950 text-red-200 border-2 border-red-900 font-sans tracking-tighter", tagline: "text-red-500", bandName: "text-red-100", venue: "text-red-300", date: "bg-red-900/40 text-red-100", time: "bg-red-950/40 text-red-400" },
        blue:   { frame: "bg-slate-950 text-sky-200 border-2 border-sky-900 font-sans tracking-tighter", tagline: "text-sky-550", bandName: "text-sky-100", venue: "text-sky-300", date: "bg-sky-900/40 text-sky-100", time: "bg-sky-950/40 text-sky-400" },
        green:  { frame: "bg-stone-950 text-emerald-250 border-2 border-emerald-900 font-sans tracking-tighter", tagline: "text-emerald-500", bandName: "text-emerald-100", venue: "text-emerald-300", date: "bg-emerald-900/40 text-emerald-100", time: "bg-stone-950/40 text-emerald-400" },
        purple: { frame: "bg-[#180824] text-purple-205 border-2 border-purple-900 font-sans tracking-tighter", tagline: "text-purple-500", bandName: "text-purple-100", venue: "text-purple-305", date: "bg-purple-900/40 text-purple-100", time: "bg-[#250836]/40 text-purple-400" },
        amber:  { frame: "bg-stone-950 text-amber-205 border-2 border-amber-900 font-sans tracking-tighter", tagline: "text-amber-500", bandName: "text-amber-100", venue: "text-amber-305", date: "bg-amber-900/40 text-amber-100", time: "bg-stone-950/40 text-amber-400" },
        pink:   { frame: "bg-pink-950 text-pink-205 border-2 border-pink-900 font-sans tracking-tighter", tagline: "text-pink-500", bandName: "text-pink-100", venue: "text-pink-305", date: "bg-pink-900/40 text-pink-100", time: "bg-pink-950/40 text-pink-400" },
        black:  { frame: "bg-neutral-950 text-zinc-300 border-2 border-zinc-800 font-sans tracking-tighter", tagline: "text-zinc-500", bandName: "text-zinc-100", venue: "text-zinc-400", date: "bg-zinc-900/40 text-zinc-100", time: "bg-neutral-950/40 text-zinc-450" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: sel.frame,
        tagline: sel.tagline,
        bandName: `text-4xl uppercase font-black ${sel.bandName}`,
        venueName: sel.venue,
        dateBadge: sel.date,
        timeBadge: sel.time,
        graphicColor: sel.tagline,
        sloganColor: sel.tagline
      };
    }

    case "retro-neon": {
      if (isDefault) {
        return {
          frame: "bg-slate-950 text-pink-400 font-mono border-2 border-pink-500",
          tagline: "text-cyan-400 animate-pulse",
          bandName: "text-4xl text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-indigo-400 font-black",
          venueName: "text-pink-400 font-extrabold",
          dateBadge: "bg-slate-900 border border-indigo-500 text-cyan-305",
          timeBadge: "bg-slate-905 text-pink-300 border border-slate-800",
          graphicColor: "text-pink-400",
          sloganColor: "text-cyan-400"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-neutral-950 text-red-400 font-mono border-2 border-red-500", tagline: "text-orange-400", grad: "from-red-500 to-orange-450", venue: "text-red-405", date: "border-red-500 text-orange-300", time: "text-red-300 border-slate-800" },
        blue:   { frame: "bg-slate-950 text-sky-455 font-mono border-2 border-sky-505", tagline: "text-teal-300", grad: "from-sky-500 to-teal-400", venue: "text-sky-450", date: "border-sky-500 text-teal-300", time: "text-sky-300 border-slate-800" },
        green:  { frame: "bg-black text-emerald-400 font-mono border-2 border-emerald-500", tagline: "text-yellow-405", grad: "from-emerald-500 to-yellow-400", venue: "text-emerald-400", date: "border-emerald-500 text-yellow-300", time: "text-emerald-300 border-slate-800" },
        purple: { frame: "bg-[#180824] text-purple-400 font-mono border-2 border-purple-500", tagline: "text-pink-400", grad: "from-purple-505 to-pink-400", venue: "text-purple-400", date: "border-purple-505 text-pink-300", time: "text-purple-300 border-slate-800" },
        amber:  { frame: "bg-stone-950 text-amber-500 font-mono border-2 border-amber-500", tagline: "text-yellow-300", grad: "from-amber-505 to-yellow-300", venue: "text-amber-500", date: "border-amber-500 text-yellow-101", time: "text-amber-300 border-slate-800" },
        pink:   { frame: "bg-[#0c0514] text-pink-500 font-mono border-2 border-pink-500", tagline: "text-purple-305", grad: "from-pink-500 to-indigo-400", venue: "text-pink-505", date: "border-pink-505 text-pink-310", time: "text-pink-303 border-slate-800" },
        black:  { frame: "bg-neutral-950 text-zinc-400 font-mono border-2 border-zinc-650", tagline: "text-neutral-300", grad: "from-zinc-405 to-neutral-200", venue: "text-zinc-400", date: "border-zinc-500 text-zinc-300", time: "text-zinc-300 border-slate-800" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: sel.frame,
        tagline: `${sel.tagline} animate-pulse`,
        bandName: `text-transparent bg-clip-text bg-gradient-to-r ${sel.grad} font-black`,
        venueName: sel.venue,
        dateBadge: `bg-slate-900 border ${sel.date}`,
        timeBadge: `bg-slate-950/55 ${sel.time}`,
        graphicColor: sel.venue,
        sloganColor: sel.tagline
      };
    }

    case "indie-minimal": {
      if (isDefault) {
        return {
          frame: "bg-slate-50 text-slate-900 border-2 border-slate-205",
          tagline: "text-slate-400 font-mono",
          bandName: "text-slate-800",
          venueName: "text-slate-900",
          dateBadge: "bg-slate-100 text-slate-800",
          timeBadge: "bg-slate-200/50 text-slate-755",
          graphicColor: "bg-slate-900 text-white",
          sloganColor: "text-slate-400"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-red-50 text-red-950 border-2 border-red-200", tagline: "text-red-400", band: "text-red-900", badge: "bg-red-100 text-red-900" },
        blue:   { frame: "bg-sky-50 text-sky-950 border-2 border-sky-200", tagline: "text-sky-500", band: "text-sky-900", badge: "bg-sky-100 text-sky-900" },
        green:  { frame: "bg-emerald-50 text-emerald-950 border-2 border-emerald-200", tagline: "text-emerald-500", band: "text-emerald-900", badge: "bg-emerald-100 text-emerald-900" },
        purple: { frame: "bg-purple-50 text-purple-950 border-2 border-purple-200", tagline: "text-purple-400", band: "text-purple-900", badge: "bg-purple-100 text-purple-950" },
        amber:  { frame: "bg-amber-50 text-amber-955 border-2 border-amber-200", tagline: "text-amber-600", band: "text-amber-900", badge: "bg-amber-100 text-amber-955" },
        pink:   { frame: "bg-pink-50 text-pink-955 border-2 border-pink-200", tagline: "text-pink-500", band: "text-pink-900", badge: "bg-pink-100 text-pink-955" },
        black:  { frame: "bg-zinc-50 text-zinc-950 border-2 border-zinc-200", tagline: "text-zinc-500", band: "text-zinc-900", badge: "bg-zinc-150 text-zinc-805" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: sel.frame,
        tagline: `${sel.tagline} font-mono`,
        bandName: `${sel.band}`,
        venueName: sel.band,
        dateBadge: `${sel.badge}`,
        timeBadge: "bg-slate-200/50 text-slate-700",
        graphicColor: `bg-slate-900 text-white`,
        sloganColor: sel.tagline
      };
    }

    case "folk-acoustic": {
      if (isDefault) {
        return {
          frame: "bg-[#fdfaf2] text-amber-955 font-serif border-4 border-double border-amber-800",
          tagline: "text-amber-800 font-semibold italic",
          bandName: "text-amber-955",
          venueName: "text-amber-900 block font-bold",
          dateBadge: "border border-amber-800 text-amber-900",
          timeBadge: "bg-amber-100 text-amber-850",
          graphicColor: "text-amber-800",
          sloganColor: "text-amber-800"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-[#fff5f5] text-red-955 font-serif border-4 border-double border-red-800", tagline: "text-red-800", band: "text-red-955", venue: "text-red-900", date: "border-red-800 text-red-900", time: "bg-red-100 text-red-850" },
        blue:   { frame: "bg-[#f0f9ff] text-sky-955 font-serif border-4 border-double border-sky-800", tagline: "text-sky-800", band: "text-sky-955", venue: "text-sky-900", date: "border-sky-800 text-sky-900", time: "bg-sky-100 text-sky-850" },
        green:  { frame: "bg-[#f0fdf4] text-emerald-955 font-serif border-4 border-double border-emerald-800", tagline: "text-emerald-800", band: "text-emerald-955", venue: "text-emerald-900", date: "border-emerald-800 text-emerald-900", time: "bg-emerald-100 text-emerald-850" },
        purple: { frame: "bg-[#faf5ff] text-purple-955 font-serif border-4 border-double border-purple-800", tagline: "text-purple-800", band: "text-purple-955", venue: "text-purple-900", date: "border-purple-800 text-purple-900", time: "bg-purple-100 text-purple-850" },
        amber:  { frame: "bg-[#fffaf0] text-amber-955 font-serif border-4 border-double border-amber-800", tagline: "text-amber-800", band: "text-amber-955", venue: "text-amber-900", date: "border-amber-800 text-amber-900", time: "bg-amber-100 text-amber-850" },
        pink:   { frame: "bg-[#fff5f7] text-pink-955 font-serif border-4 border-double border-pink-800", tagline: "text-pink-800", band: "text-pink-955", venue: "text-pink-900", date: "border-pink-800 text-pink-900", time: "bg-pink-100 text-pink-850" },
        black:  { frame: "bg-[#fafafa] text-zinc-950 font-serif border-4 border-double border-zinc-800", tagline: "text-zinc-650", band: "text-zinc-950", venue: "text-zinc-900", date: "border-zinc-800 text-zinc-800", time: "bg-zinc-200 text-zinc-800" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: sel.frame,
        tagline: `${sel.tagline} font-semibold italic`,
        bandName: `${sel.band}`,
        venueName: `${sel.venue} block font-bold`,
        dateBadge: sel.date,
        timeBadge: sel.time,
        graphicColor: sel.tagline,
        sloganColor: sel.tagline
      };
    }

    case "psychedelic-acid": {
      if (isDefault) {
        return {
          frame: "bg-[#180824] text-[#facc15] font-serif border-2 border-[#86198f]",
          tagline: "text-[#f59e0b] italic font-black",
          bandName: "text-[#ca8a04]",
          venueName: "text-purple-305 font-sans font-bold",
          dateBadge: "bg-slate-900/40 text-[#facc15]",
          timeBadge: "bg-[#31024e] text-purple-200",
          graphicColor: "text-[#facc15]",
          sloganColor: "text-[#f59e0b]"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-[#250808] text-red-400 font-serif border-2 border-red-800", tagline: "text-[#ff6b6b] italic font-black", band: "text-red-500", venue: "text-red-200" },
        blue:   { frame: "bg-[#02182c] text-sky-450 font-serif border-2 border-sky-800", tagline: "text-cyan-300 italic font-black", band: "text-sky-500", venue: "text-sky-200" },
        green:  { frame: "bg-[#042416] text-emerald-400 font-serif border-2 border-emerald-800", tagline: "text-emerald-305 italic font-black", band: "text-emerald-500", venue: "text-emerald-200" },
        purple: { frame: "bg-[#180824] text-purple-355 font-serif border-2 border-purple-800", tagline: "text-pink-400 italic font-black", band: "text-purple-505", venue: "text-purple-200" },
        amber:  { frame: "bg-[#221002] text-amber-400 font-serif border-2 border-amber-800", tagline: "text-yellow-400 italic font-black", band: "text-[#d97706]", venue: "text-amber-250" },
        pink:   { frame: "bg-[#250012] text-pink-400 font-serif border-2 border-pink-800", tagline: "text-yellow-300 italic font-black", band: "text-pink-500", venue: "text-pink-200" },
        black:  { frame: "bg-black text-zinc-300 font-serif border-2 border-zinc-800", tagline: "text-zinc-400 italic font-black", band: "text-zinc-100", venue: "text-zinc-300" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: sel.frame,
        tagline: sel.tagline,
        bandName: `${sel.band}`,
        venueName: sel.venue,
        dateBadge: `bg-slate-900/40 ${sel.band}`,
        timeBadge: `bg-black/50 ${sel.venue}`,
        graphicColor: sel.band,
        sloganColor: sel.tagline
      };
    }

    case "metal-hellfire": {
      if (isDefault) {
        return {
          frame: "bg-[#090504] text-red-500 font-sans tracking-widest uppercase border-2 border-red-950",
          tagline: "text-orange-500 tracking-widest",
          bandName: "text-white",
          venueName: "text-red-500 font-sans tracking-wide font-black",
          dateBadge: "bg-red-950/40 text-red-500 border border-red-900/50",
          timeBadge: "bg-stone-900 text-gray-400",
          graphicColor: "text-red-800",
          sloganColor: "text-orange-500"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-black text-red-600 border-2 border-red-950", tagline: "text-red-500", venue: "text-red-800" },
        blue:   { frame: "bg-black text-sky-600 border-2 border-sky-950", tagline: "text-sky-500", venue: "text-sky-800" },
        green:  { frame: "bg-black text-emerald-600 border-2 border-[#15803d]", tagline: "text-emerald-500", venue: "text-emerald-805" },
        purple: { frame: "bg-black text-purple-600 border-2 border-[#7e22ce]", tagline: "text-purple-500", venue: "text-purple-800" },
        amber:  { frame: "bg-black text-amber-600 border-2 border-[#b45309]", tagline: "text-amber-500", venue: "text-amber-800" },
        pink:   { frame: "bg-black text-pink-600 border-2 border-[#be185d]", tagline: "text-pink-500", venue: "text-pink-800" },
        black:  { frame: "bg-black text-zinc-500 border-2 border-[#3f3f46]", tagline: "text-zinc-400", venue: "text-zinc-650" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: `${sel.frame} font-sans tracking-widest uppercase`,
        tagline: `${sel.tagline} tracking-widest`,
        bandName: "text-white",
        venueName: `${sel.tagline} font-sans tracking-wide font-black`,
        dateBadge: "bg-[#0a0a0a] text-white border border-stone-800",
        timeBadge: "bg-stone-900 text-gray-400",
        graphicColor: sel.venue,
        sloganColor: sel.tagline
      };
    }

    case "pop-bubblegum": {
      if (isDefault) {
        return {
          frame: "bg-[#fdf2f8] text-[#db2777] font-sans border-2 border-dashed border-[#f472b6]",
          tagline: "text-[#ec4899] font-bold",
          bandName: "text-[#db2777]",
          venueName: "text-[#f472b6] font-extrabold",
          dateBadge: "bg-[#fbcfe8] text-[#db2777]",
          timeBadge: "bg-pink-100 text-[#ec4899]",
          graphicColor: "text-pink-400",
          sloganColor: "text-[#ec4899]"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-red-50 text-red-650 border-2 border-dashed border-red-300", tagline: "text-red-500", band: "text-red-700", venue: "text-red-400", badge: "bg-red-100 text-red-800", time: "bg-red-50 text-red-600" },
        blue:   { frame: "bg-sky-50 text-sky-655 border-2 border-dashed border-sky-300", tagline: "text-sky-500", band: "text-sky-700", venue: "text-sky-400", badge: "bg-sky-100 text-sky-800", time: "bg-sky-55 text-sky-600" },
        green:  { frame: "bg-[#f0fdf4] text-emerald-650 border-2 border-dashed border-emerald-300", tagline: "text-emerald-500", band: "text-emerald-700", venue: "text-emerald-420", badge: "bg-emerald-100 text-emerald-800", time: "bg-emerald-50 text-emerald-600" },
        purple: { frame: "bg-[#faf5ff] text-purple-650 border-2 border-dashed border-purple-300", tagline: "text-purple-500", band: "text-purple-700", venue: "text-purple-420", badge: "bg-purple-100 text-purple-800", time: "bg-purple-50 text-purple-600" },
        amber:  { frame: "bg-amber-50 text-amber-655 border-2 border-dashed border-amber-300", tagline: "text-amber-500", band: "text-amber-700", venue: "text-amber-400", badge: "bg-amber-100 text-amber-800", time: "bg-amber-55 text-amber-600" },
        pink:   { frame: "bg-pink-50 text-pink-655 border-2 border-dashed border-pink-300", tagline: "text-pink-500", band: "text-pink-700", venue: "text-pink-400", badge: "bg-pink-101 text-pink-850", time: "bg-pink-50 text-pink-600" },
        black:  { frame: "bg-zinc-50 text-zinc-655 border-2 border-dashed border-zinc-300", tagline: "text-zinc-550", band: "text-zinc-700", venue: "text-zinc-400", badge: "bg-zinc-150 text-zinc-800", time: "bg-zinc-100 text-zinc-600" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: `${sel.frame} font-sans`,
        tagline: `${sel.tagline} font-bold`,
        bandName: `${sel.band}`,
        venueName: `${sel.venue} font-extrabold`,
        dateBadge: sel.badge,
        timeBadge: sel.time,
        graphicColor: sel.venue,
        sloganColor: sel.tagline
      };
    }

    case "jazz-vanguard": {
      if (isDefault) {
        return {
          frame: "bg-[#020617] text-amber-300 font-serif border border-yellow-950",
          tagline: "text-[#facc15]/80 tracking-widest italic",
          bandName: "text-white",
          venueName: "text-amber-250 tracking-widest font-serif font-black",
          dateBadge: "bg-amber-955/50 text-amber-300 border border-amber-900/30",
          timeBadge: "bg-[#111827] text-amber-205",
          graphicColor: "text-amber-500",
          sloganColor: "text-[#facc15]/80"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-[#0b0202] text-red-300 border border-red-955", tagline: "text-red-400/80", venue: "text-red-250", badge: "bg-red-950/50 text-red-300 border border-red-900/30", time: "bg-stone-900 text-red-200" },
        blue:   { frame: "bg-[#010b14] text-sky-300 border border-sky-955", tagline: "text-sky-400/80", venue: "text-sky-250", badge: "bg-sky-950/50 text-sky-300 border-sky-900/30", time: "bg-stone-900 text-sky-200" },
        green:  { frame: "bg-[#020c08] text-[#10b981] border border-emerald-955", tagline: "text-emerald-400/80", venue: "text-emerald-250", badge: "bg-emerald-950/50 text-emerald-300 border border-emerald-900/30", time: "bg-stone-900 text-emerald-200" },
        purple: { frame: "bg-[#0a020f] text-purple-305 border border-purple-955", tagline: "text-purple-400/80", venue: "text-purple-250", badge: "bg-purple-955/50 text-purple-305 border border-purple-900/30", time: "bg-stone-900 text-purple-200" },
        amber:  { frame: "bg-[#0e0701] text-amber-305 border border-amber-955", tagline: "text-amber-400/80", venue: "text-amber-250", badge: "bg-amber-955/50 text-amber-305 border border-amber-900/30", time: "bg-stone-900 text-amber-200" },
        pink:   { frame: "bg-[#0e0108] text-pink-305 border border-pink-955", tagline: "text-pink-404/80", venue: "text-pink-250", badge: "bg-pink-955/50 text-pink-305 border border-pink-900/30", time: "bg-[#111827] text-pink-200" },
        black:  { frame: "bg-black text-zinc-350 border border-zinc-900", tagline: "text-zinc-400/80", venue: "text-zinc-305", badge: "bg-zinc-900/50 text-zinc-300 border border-zinc-800/30", time: "bg-[#111827] text-zinc-200" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: `${sel.frame} font-serif`,
        tagline: `${sel.tagline} tracking-widest italic`,
        bandName: "text-white",
        venueName: `${sel.venue} tracking-widest font-serif font-black`,
        dateBadge: sel.badge,
        timeBadge: sel.time,
        graphicColor: sel.venue,
        sloganColor: sel.tagline
      };
    }

    case "dubstep-laser": {
      if (isDefault) {
        return {
          frame: "bg-black text-[#10b981] font-mono border-2 border-[#10b981] shadow-[0_0_15px_rgba(16,185,129,0.35)]",
          tagline: "text-[#34d399] tracking-widest font-mono font-bold",
          bandName: "text-[#10b981]",
          venueName: "text-[#10b981] font-bold tracking-wider",
          dateBadge: "bg-black border border-[#10b981] text-[#10b981]",
          timeBadge: "bg-black text-[#5dfbc5] border border-[#10b981]/50",
          graphicColor: "text-[#10b981]",
          sloganColor: "text-[#34d399]"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-black text-red-500 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.35)]", tagline: "text-red-400", date: "border-red-500 text-red-500", time: "text-red-300 border-red-500/50" },
        blue:   { frame: "bg-black text-sky-500 border-sky-505 shadow-[0_0_15px_rgba(56,189,248,0.35)]", tagline: "text-sky-400", date: "border-sky-500 text-sky-500", time: "text-sky-300 border-sky-500/50" },
        green:  { frame: "bg-black text-emerald-500 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.35)]", tagline: "text-emerald-400", date: "border-emerald-500 text-emerald-500", time: "text-emerald-300 border-emerald-500/50" },
        purple: { frame: "bg-black text-purple-500 border-purple-550 shadow-[0_0_15px_rgba(168,85,247,0.35)]", tagline: "text-purple-400", date: "border-purple-500 text-purple-500", time: "text-purple-300 border-purple-500/50" },
        amber:  { frame: "bg-black text-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.35)]", tagline: "text-amber-400", date: "border-amber-500 text-amber-500", time: "text-amber-300 border-amber-500/50" },
        pink:   { frame: "bg-black text-pink-500 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)]", tagline: "text-pink-400", date: "border-pink-500 text-pink-500", time: "text-pink-300 border-pink-500/50" },
        black:  { frame: "bg-black text-zinc-400 border-zinc-600 shadow-[0_0_15px_rgba(160,160,160,0.15)]", tagline: "text-zinc-300", date: "border-zinc-500 text-zinc-400", time: "text-zinc-300 border-zinc-500/50" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: `${sel.frame} font-mono border-2`,
        tagline: `${sel.tagline} tracking-widest font-mono font-bold`,
        bandName: `${sel.tagline}`,
        venueName: `${sel.tagline} font-bold tracking-wider`,
        dateBadge: `bg-black border ${sel.date}`,
        timeBadge: `bg-black ${sel.time}`,
        graphicColor: sel.tagline,
        sloganColor: sel.tagline
      };
    }

    case "punk-diy": {
      if (isDefault) {
        return {
          frame: "bg-white text-black font-mono border-4 border-black",
          tagline: "text-black bg-yellow-300 font-black p-0.5 tracking-tighter uppercase self-center w-fit mx-auto",
          bandName: "bg-black text-white px-1",
          venueName: "text-black bg-white border-2 border-black inline-block px-2 py-0.5 font-bold uppercase transform rotate-1",
          dateBadge: "bg-yellow-300 text-black border-2 border-black font-black",
          timeBadge: "bg-black text-white px-2 py-0.5 rounded-none font-black",
          graphicColor: "text-black",
          sloganColor: "text-black"
        };
      }
      const map: Record<string, any> = {
        red:    { bg: "bg-red-400", tagline: "text-white bg-red-800", date: "bg-red-800 text-white" },
        blue:   { bg: "bg-sky-305", tagline: "text-white bg-sky-800", date: "bg-sky-800 text-white" },
        green:  { bg: "bg-emerald-300", tagline: "text-white bg-emerald-800", date: "bg-emerald-800 text-white" },
        purple: { bg: "bg-purple-305", tagline: "text-white bg-purple-800", date: "bg-purple-800 text-white" },
        amber:  { bg: "bg-amber-300", tagline: "text-white bg-amber-800", date: "bg-amber-800 text-white" },
        pink:   { bg: "bg-pink-300", tagline: "text-white bg-pink-805", date: "bg-pink-800 text-white" },
        black:  { bg: "bg-zinc-200", tagline: "text-white bg-black", date: "bg-black text-white" }
      };
      const sel = map[colorId] || map.red;
      return {
        frame: `${sel.bg} text-black font-mono border-4 border-black`,
        tagline: `${sel.tagline} font-black p-0.5 tracking-tighter uppercase self-center w-fit mx-auto`,
        bandName: "bg-black text-white px-1",
        venueName: "text-black bg-white border-2 border-black inline-block px-2 py-0.5 font-bold uppercase transform rotate-1",
        dateBadge: `${sel.date} border-2 border-black font-black`,
        timeBadge: "bg-black text-white px-2 py-0.5 rounded-none font-black",
        graphicColor: "text-black",
        sloganColor: "text-black"
      };
    }

    default:
      return {
        frame: "bg-slate-50 text-slate-900 border-2 border-slate-205",
        tagline: "text-slate-400 font-mono",
        bandName: "text-slate-800",
        venueName: "text-slate-900",
        dateBadge: "bg-slate-100 text-slate-800",
        timeBadge: "bg-slate-200/50 text-slate-705",
        graphicColor: "text-slate-500",
        sloganColor: "text-slate-500"
      };
  }
};

interface PosterDesignerProps {
  config: PosterConfig;
  onChangeConfig: (config: PosterConfig) => void;
}

export default function PosterDesigner({ config, onChangeConfig }: PosterDesignerProps) {
  const [slogans, setSlogans] = useState<SloganProposal[]>([]);
  const [isGeneratingSlogans, setIsGeneratingSlogans] = useState(false);
  const [appliedSloganIdx, setAppliedSloganIdx] = useState<number | null>(null);

  // Download & Print Order state managers
  const [panelTab, setPanelTab] = useState<"preview" | "order">("preview");
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Supported print items config (all 3 options with 1/8" bleed spec details)
  const [printItems, setPrintItems] = useState<{ [key in "4.25x5.5" | "8.5x11" | "11x17"]: { selected: boolean; qty: number } }>({
    "4.25x5.5": { selected: false, qty: 100 },
    "8.5x11": { selected: false, qty: 100 },
    "11x17": { selected: true, qty: 100 },
  });
  const [checkoutStep, setCheckoutStep] = useState<"select" | "checkout">("select");
  const [shippingOption, setShippingOption] = useState<"ground" | "express2day" | "overnight">("ground");
  
  const [shippingAddress, setShippingAddress] = useState({
    name: "",
    street: "",
    city: "Seattle",
    state: "WA",
    zip: "98121",
    phone: "206-555-0199"
  });
  
  const [paymentCard, setPaymentCard] = useState({
    number: "4111 2222 3333 4444",
    expiry: "12/28",
    cvv: "123"
  });

  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "card">("paypal");
  const [paypalUserEmail, setPaypalUserEmail] = useState("");

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderResult, setOrderResult] = useState<any>(null);
  const [orderError, setOrderError] = useState("");

  const getRateForSize = (sz: "4.25x5.5" | "8.5x11" | "11x17") => {
    return sz === "4.25x5.5" ? 0.15 : sz === "8.5x11" ? 0.25 : 0.40;
  };

  // derived calculations for actively selected items
  const activeItemsList = (Object.entries(printItems) as Array<["4.25x5.5" | "8.5x11" | "11x17", { selected: boolean; qty: number }]>)
    .filter(([_, data]) => data.selected)
    .map(([sz, data]) => ({
      size: sz,
      quantity: data.qty,
      rate: getRateForSize(sz),
      total: data.qty * getRateForSize(sz)
    }));

  const rawPrintBaseCost = activeItemsList.reduce((acc, item) => acc + item.total, 0);
  const currentShippingCost = shippingOption === "ground" ? 9.50 : shippingOption === "express2day" ? 18.00 : 32.00;
  const currentSubtotal = rawPrintBaseCost + currentShippingCost;
  const currentHandlingFee = rawPrintBaseCost > 0 ? Math.max(4.95, currentSubtotal * 0.10) : 0;
  const currentTotalRetailValue = rawPrintBaseCost > 0 ? currentSubtotal + currentHandlingFee : 0;

  const downloadPosterAsImage = async () => {
    const element = document.getElementById("concert-poster-frame");
    if (!element) {
      alert("Poster preview frame not found!");
      return;
    }
    setIsDownloading(true);
    try {
      await new Promise(r => setTimeout(r, 150));
      const canvas = await html2canvas(element, {
        scale: 2, // 2x high resolution rendering representation
        useCORS: true,
        allowTaint: true,
        backgroundColor: null
      });
      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `${config.bandName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") || "concert"}-poster.png`;
      link.href = dataUrl;
      link.click();
    } catch (err: any) {
      console.error("Could not capture poster canvas:", err);
      alert("Could not generate PNG image download. Use 'Local Print' or standard print features instead.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePlacePrintOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError("");
    setOrderResult(null);

    if (activeItemsList.length === 0) {
      setOrderError("Please select at least one size option for printing.");
      return;
    }

    if (!shippingAddress.name.trim() || !shippingAddress.street.trim() || !shippingAddress.city.trim() || !shippingAddress.state.trim() || !shippingAddress.zip.trim()) {
      setOrderError("Please fully complete your shipping details.");
      return;
    }

    setIsPlacingOrder(true);
    try {
      const response = await fetch("/api/print/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          posterData: {
            bandName: config.bandName,
            venueName: config.venueName,
            dateStr: config.dateStr,
            themeId: config.themeId
          },
          items: activeItemsList.map(item => ({
            size: item.size,
            quantity: item.quantity
          })),
          shippingAddress: shippingAddress,
          shippingOption: shippingOption,
          paymentMethod: paymentMethod,
          paypalUserEmail: paymentMethod === "paypal" ? paypalUserEmail : undefined
        })
      });

      if (!response.ok) {
        throw new Error("Print server returned error status " + response.status);
      }

      const result = await response.json();
      setOrderResult(result);
    } catch (err: any) {
      console.error("Failed to place printing order:", err);
      setOrderError(err.message || "Print queue connection timed out.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const c = getThemeClasses(config.themeId, config.colorId || "default");

  // Core Themes Config - Expanded to 10 distinct, attention-grabbing presets
  const themes = [
    { id: "heavy-grunge", label: "🤘 Grunge Stencil", color: "border-rose-450", bg: "bg-red-950" },
    { id: "retro-neon", label: "👾 Retro Synthwave", color: "border-pink-500", bg: "bg-indigo-950" },
    { id: "indie-minimal", label: "☘️ Modern Indie", color: "border-emerald-305", bg: "bg-slate-50" },
    { id: "folk-acoustic", label: "🌻 Organic Folk", color: "border-amber-700", bg: "bg-amber-50" },
    { id: "psychedelic-acid", label: "🌈 Psychedelic Acid", color: "border-purple-600", bg: "bg-[#180824]" },
    { id: "metal-hellfire", label: "🔥 Metal Hellfire", color: "border-red-650", bg: "bg-[#090504]" },
    { id: "pop-bubblegum", label: "🍭 Pop Bubblegum", color: "border-[#f472b6]", bg: "bg-[#fdf2f8]" },
    { id: "jazz-vanguard", label: "🎷 Jazz Vanguard", color: "border-yellow-950", bg: "bg-[#020617]" },
    { id: "dubstep-laser", label: "⚡ Rave Dubstep", color: "border-[#10b981]", bg: "bg-black" },
    { id: "punk-diy", label: "✂️ Punk DIY Collage", color: "border-black", bg: "bg-white" }
  ];

  // Additional color presets requested by user
  const colorSwatches = [
    { id: "default", label: "Default Preset Color", swatchBg: "bg-slate-300 border-slate-400" },
    { id: "red", label: "Crimson Red Accent", swatchBg: "bg-red-600 border-red-800" },
    { id: "blue", label: "Electric Blue Accent", swatchBg: "bg-sky-400 border-sky-600" },
    { id: "green", label: "Acid Green Accent", swatchBg: "bg-emerald-500 border-emerald-750" },
    { id: "purple", label: "Cosmic Purple Accent", swatchBg: "bg-purple-600 border-purple-800" },
    { id: "amber", label: "Solar Amber Accent", swatchBg: "bg-amber-500 border-amber-650" },
    { id: "pink", label: "Vibrant Pink Accent", swatchBg: "bg-pink-500 border-pink-700" },
    { id: "black", label: "Classic Charcoal Accent", swatchBg: "bg-zinc-850 border-black" }
  ];

  const handleFieldChange = (field: keyof PosterConfig, value: any) => {
    onChangeConfig({
      ...config,
      [field]: value
    });
  };

  const handleAmenityChange = (key: "servesFood" | "servesAlcohol" | "merchArea") => {
    onChangeConfig({
      ...config,
      amenities: {
        ...config.amenities,
        [key]: !config.amenities[key]
      }
    });
  };

  // AI Suggestion caller using /api/suggest-slogans
  const handleGenerateSlogans = async () => {
    if (!config.bandName) {
      alert("Please specify a Band Name in the input fields first so the AI can craft custom slogans!");
      return;
    }

    setIsGeneratingSlogans(true);
    try {
      const res = await fetch("/api/suggest-slogans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bandName: config.bandName,
          genre: "Live performance",
          venueName: config.venueName
        })
      });

      if (!res.ok) {
        throw new Error("Slogan api returned status " + res.status);
      }

      const data = await res.json();
      setSlogans(data);
    } catch (e: any) {
      console.error(e);
      alert("Failed to prompt slogans. Confirm GEMINI_API_KEY environment config.");
    } finally {
      setIsGeneratingSlogans(false);
    }
  };

  const handleApplySlogan = (sloganText: string, idx: number) => {
    handleFieldChange("secondaryText", sloganText.toUpperCase());
    setAppliedSloganIdx(idx);
    setTimeout(() => setAppliedSloganIdx(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in" id="poster-designer-panel">
      {/* 5-Columns: Control inputs */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-gray-100 p-5 space-y-6" id="designer-controls">
        <div className="border-b border-gray-50 pb-3" id="control-intro">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5" id="controls-title">
            <Layers className="w-4 h-4 text-indigo-500" />
            Concert Poster Designer & Text Layouts
          </h3>
          <p className="text-[10px] text-gray-400 font-medium" id="controls-desc">
            Directly customize what represents your band, venue dates, refreshments, and age limits. Keep your materials accurate.
          </p>
        </div>

        {/* Inputs Layout */}
        <div className="space-y-4 text-xs" id="control-fields-box">
          {/* Theme select buttons */}
          <div className="space-y-1.5" id="theme-selector-group">
            <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Concert Poster Theme Preset
            </span>
            <div className="grid grid-cols-2 gap-2" id="themes-grid-input">
              {themes.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  id={`btn-theme-${th.id}`}
                  onClick={() => handleFieldChange("themeId", th.id)}
                  className={`p-2 rounded-lg border text-[11px] font-bold text-left transition-all cursor-pointer ${
                    config.themeId === th.id
                      ? "border-indigo-600 bg-indigo-50/50 text-indigo-950"
                      : "border-gray-100 bg-white text-gray-505 hover:border-gray-300"
                  }`}
                >
                  {th.label}
                </button>
              ))}
            </div>
          </div>

          {/* User-customizable dynamic Color Accent Swatch */}
          <div className="space-y-2 border-t border-gray-100/60 pt-3" id="color-swatch-group">
            <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>🎨 Poster Color Swatch Scheme</span>
            </span>
            <div className="flex flex-wrap gap-2 items-center" id="color-swatches-row">
              {colorSwatches.map((sw) => {
                const isSelected = (config.colorId || "default") === sw.id;
                return (
                  <button
                    key={sw.id}
                    type="button"
                    onClick={() => handleFieldChange("colorId", sw.id)}
                    title={sw.label}
                    className={`w-6 h-6 rounded-full border border-gray-200 cursor-pointer transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-sm ${sw.swatchBg} ${
                      isSelected 
                        ? "scale-110 ring-2 ring-indigo-550 border-white" 
                        : "opacity-85 hover:opacity-100"
                    }`}
                    id={`swatch-picker-btn-${sw.id}`}
                  >
                    {isSelected && (
                      <Check className={`w-3 h-3 ${sw.id === "default" || sw.id === "black" ? "text-slate-800" : "text-white"}`} />
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-[9.5px] text-gray-400 font-medium leading-relaxed italic">
              *Tapping a swatch dynamically adjusts background elements, borders, and text highlights within the poster template!
            </p>
          </div>

          {/* Band details */}
          <div className="grid grid-cols-1 gap-3" id="fields-band-section">
            <div id="field-wrap-band">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Headline Band Name
              </label>
              <input
                type="text"
                id="field-poster-bandName"
                value={config.bandName}
                onChange={(e) => handleFieldChange("bandName", e.target.value)}
                placeholder="E.g., THE NOISE ENGINE"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold"
              />
            </div>

            <div id="field-wrap-tagline">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Slogan / Supporting Acts Tagline
              </label>
              <div className="flex gap-2" id="tagline-with-ai-btn">
                <input
                  type="text"
                  id="field-poster-secondaryText"
                  value={config.secondaryText}
                  onChange={(e) => handleFieldChange("secondaryText", e.target.value)}
                  placeholder="E.g., ON TOUR NOW / PLUS SPECIAL GUESTS"
                  className="flex-grow text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  id="btn-trigger-ai-slogans"
                  onClick={handleGenerateSlogans}
                  disabled={isGeneratingSlogans || !config.bandName}
                  className="bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-lg font-bold transition-all flex-shrink-0 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400"
                  title="Generate Catchy Concert Slogans via Gemini AI"
                >
                  {isGeneratingSlogans ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 animate-bounce" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* AI Suggested Slogan list if ready */}
          {slogans.length > 0 && (
            <div className="bg-slate-50 rounded-lg p-3 space-y-2 border border-slate-100" id="ai-slogans-results">
              <span className="text-[10px] uppercase font-black tracking-wider text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Gemini AI Slogan Proposals (Tap to Apply):
              </span>
              <div className="space-y-1.5" id="slogans-list">
                {slogans.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    id={`btn-apply-slogan-${i}`}
                    onClick={() => handleApplySlogan(s.slogan, i)}
                    className="w-full text-left bg-white border border-gray-100 hover:border-purple-300 rounded p-1.5 text-[10px] transition-all flex justify-between items-center group cursor-pointer"
                  >
                    <span className="font-bold text-gray-800 italic">" {s.slogan} "</span>
                    <span className="text-[9px] text-gray-400 group-hover:text-purple-600">{s.context}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Venue specifics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="fields-venue-section">
            <div id="field-wrap-venue">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Venue Room Name
              </label>
              <input
                type="text"
                id="field-poster-venueName"
                value={config.venueName}
                onChange={(e) => handleFieldChange("venueName", e.target.value)}
                placeholder="E.g., The Underbelly Hall"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>

            <div id="field-wrap-address">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Venue Street Address
              </label>
              <input
                type="text"
                id="field-poster-venueAddress"
                value={config.venueAddress}
                onChange={(e) => handleFieldChange("venueAddress", e.target.value)}
                placeholder="E.g., 204 Pine St, Seattle"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Date, Time and Prices */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3" id="fields-details-section">
            <div id="field-wrap-date">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Show Date Str
              </label>
              <input
                type="text"
                id="field-poster-dateStr"
                value={config.dateStr}
                onChange={(e) => handleFieldChange("dateStr", e.target.value)}
                placeholder="E.g., Friday, Oct 24th"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="field-wrap-time">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Gate & Show Time
              </label>
              <input
                type="text"
                id="field-poster-timeStr"
                value={config.timeStr}
                onChange={(e) => handleFieldChange("timeStr", e.target.value)}
                placeholder="E.g., Doors 8 / Live 9"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="field-wrap-price">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Entry Tickets Fee
              </label>
              <input
                type="text"
                id="field-poster-priceStr"
                value={config.priceStr}
                onChange={(e) => handleFieldChange("priceStr", e.target.value)}
                placeholder="E.g., $10 Adv / $15 Door"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
              />
            </div>
          </div>

          {/* Age restricts and Amenities checkboxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-50" id="amenities-options-row">
            {/* Age dropdown representation */}
            <div id="age-selector-grp">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                Age Restriction Limit
              </label>
              <select
                id="field-poster-allAges"
                value={config.allAges}
                onChange={(e) => handleFieldChange("allAges", e.target.value)}
                className="w-full p-2.5 text-xs border border-gray-250 bg-white rounded-lg focus:outline-none"
              >
                <option value="All Ages">All Ages (No restrictions)</option>
                <option value="18+ w/ ID">18+ Entrance (ID Checked)</option>
                <option value="21+ w/ ID">21+ Entrance (Alcohol Served)</option>
              </select>
            </div>

            {/* Micro checks for services */}
            <div className="space-y-2 mt-2 md:mt-0" id="amenity-switches">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Poster Icon Annotations
              </span>
              <div className="space-y-1" id="amenities-checks font-medium">
                <label className="flex items-center gap-2 cursor-pointer text-[10px] text-gray-650" id="lbl-check-food">
                  <input
                    type="checkbox"
                    id="check-poster-servesFood"
                    checked={config.amenities.servesFood}
                    onChange={() => handleAmenityChange("servesFood")}
                    className="rounded text-indigo-600 focus:ring-indigo-200"
                  />
                  <span>Food served at venue</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[10px] text-gray-650" id="lbl-check-alcohol">
                  <input
                    type="checkbox"
                    id="check-poster-servesAlcohol"
                    checked={config.amenities.servesAlcohol}
                    onChange={() => handleAmenityChange("servesAlcohol")}
                    className="rounded text-indigo-600 focus:ring-indigo-200"
                  />
                  <span>Alcohol beverages served (Beer/Cocktails)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-[10px] text-gray-650" id="lbl-check-merch">
                  <input
                    type="checkbox"
                    id="check-poster-merchArea"
                    checked={config.amenities.merchArea}
                    onChange={() => handleAmenityChange("merchArea")}
                    className="rounded text-indigo-600 focus:ring-indigo-200"
                  />
                  <span>Band merch stand inside</span>
                </label>
              </div>
            </div>
          </div>

          {/* Extra Notes details */}
          <div id="field-wrap-extraDetails">
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
              Safety / Extra Venue Information
            </label>
            <input
              type="text"
              id="field-poster-extraDetails"
              value={config.extraDetails}
              onChange={(e) => handleFieldChange("extraDetails", e.target.value)}
              placeholder="E.g., Cash only bar. No professional cameras. Nearby parking available."
              className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* 7-Columns: Digital Canvas Layout Rendering representing the physical output */}
      <div className="lg:col-span-7 flex flex-col items-center justify-between space-y-6" id="poster-rendering-panel">
        
        {/* Unified Tab selector for direct downloading and print ordering */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center w-full gap-3 bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800" id="rendering-header-row">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPanelTab("preview")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                panelTab === "preview" 
                  ? "bg-indigo-600 text-white" 
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              🎨 Layout Preview
            </button>
            <button
              type="button"
              onClick={() => {
                setPanelTab("order");
                // Autofill recipient and street details from poster states
                setShippingAddress(prev => ({
                  ...prev,
                  name: prev.name || config.bandName || "",
                  street: prev.street || config.venueAddress || ""
                }));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                panelTab === "order" 
                  ? "bg-emerald-600 text-white font-extrabold shadow-sm" 
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              <Truck className="w-3.5 h-3.5 text-emerald-400" />
              Order Prints
            </button>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={downloadPosterAsImage}
              disabled={isDownloading}
              className="bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 text-xs font-bold py-1.5 px-3.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Generating PNG...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  Download PNG
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Local Print
            </button>
          </div>
        </div>

        {panelTab === "order" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full items-start" id="printing-grid-split">
            {/* Left side: Mini view of their poster */}
            <div className="md:col-span-5 flex flex-col items-center p-2 bg-slate-950/20 rounded-2xl border border-slate-100 max-h-[500px] overflow-hidden" id="mini-preview-wrap">
              <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 mb-2">Live print-preview</span>
              <div className="scale-65 sm:scale-75 origin-top -mb-32">
                {/* Embedded copy of the poster element for visual validation during ordering */}
                <div 
                  id="concert-poster-frame-mini"
                  className={`w-[320px] min-h-[490px] border border-gray-950 rounded-2xl shadow-xl p-6 flex flex-col justify-between text-center relative ${c.frame}`}
                >
                  <div className="space-y-4 pt-4 z-10">
                    <h5 className={`text-[10px] uppercase font-black tracking-widest ${c.tagline}`}>
                      {config.secondaryText || "ON TOUR NOW / SPECIAL GUESTS"}
                    </h5>
                    <h1 className={`leading-none font-bold select-all tracking-tighter ${c.bandName}`}>
                      {config.bandName || "GENERIC HEADLINER BAND"}
                    </h1>
                  </div>

                  <div className="space-y-3 py-4 z-10">
                    <h2 className={`text-sm font-bold uppercase tracking-wide ${c.venueName}`}>
                      {config.venueName || "LOCAL MUSIC HALL"}
                    </h2>
                    <p className="text-[9px] text-gray-500 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      {config.venueAddress || "412 Pike St, Seattle, WA"}
                    </p>
                  </div>

                  <div className="border-t pt-4 space-y-4 z-10" style={{ borderColor: "rgba(100,100,100,0.15)" }}>
                    <div className="flex justify-center items-center gap-3 text-xs">
                      <span className={`px-2.5 py-1 rounded font-bold font-mono tracking-tight flex items-center gap-1 ${c.dateBadge}`}>
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {config.dateStr || "Friday, Oct 24th"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Print Order Details & Checkout */}
            <div className="md:col-span-7 w-full bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-4 text-left shadow-xl" id="printing-order-wizard">
              <div className="border-b border-slate-800 pb-2 flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-indigo-400" />
                    {checkoutStep === "select" ? "Add Sizes to Order" : "Checkout"}
                  </h4>
                  <p className="text-[10px] text-gray-400">
                    {checkoutStep === "select" 
                      ? "Choose from 3 flyer/poster dimensions. 1/8\" print bleed is included." 
                      : "Confirm quantities, adjust print sizes, and set delivery address."}
                  </p>
                </div>
                {checkoutStep === "checkout" && (
                  <button 
                    type="button" 
                    onClick={() => { setCheckoutStep("select"); setOrderResult(null); }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-705 font-bold px-2.5 py-1 rounded-lg text-indigo-300 transition-all cursor-pointer"
                  >
                    ← Back to Sizes
                  </button>
                )}
              </div>

              {checkoutStep === "select" ? (
                <div className="space-y-4">
                  <span className="block text-[10px] uppercase font-black tracking-wider text-slate-400 font-mono">
                    Step 1: Select Print Sizes & Quantities
                  </span>
                  
                  <div className="space-y-3">
                    {/* Item 1: 4.25x5.5 */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={printItems["4.25x5.5"].selected}
                          onChange={(e) => setPrintItems({
                            ...printItems,
                            "4.25x5.5": { ...printItems["4.25x5.5"], selected: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 border-slate-800 rounded focus:ring-indigo-500 bg-slate-900 focus:ring-2 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">4.25" x 5.5" Handbill Flyer</p>
                          <p className="text-[10px] text-slate-400">Needs 1/8" bleed (4.5" x 5.75" template)</p>
                          <p className="text-[10px] font-mono text-emerald-400">$0.15 per flyer copy</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-slate-550">Qty:</span>
                        <select
                          value={printItems["4.25x5.5"].qty}
                          onChange={(e) => setPrintItems({
                            ...printItems,
                            "4.25x5.5": { ...printItems["4.25x5.5"], qty: Number(e.target.value) }
                          })}
                          disabled={!printItems["4.25x5.5"].selected}
                          className="text-xs p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white disabled:opacity-40"
                        >
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="250">250</option>
                          <option value="500">500</option>
                          <option value="1000">1000</option>
                        </select>
                      </div>
                    </div>

                    {/* Item 2: 8.5x11 */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={printItems["8.5x11"].selected}
                          onChange={(e) => setPrintItems({
                            ...printItems,
                            "8.5x11": { ...printItems["8.5x11"], selected: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 border-slate-800 rounded focus:ring-indigo-500 bg-slate-900 focus:ring-2 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">8.5" x 11" Letter Poster</p>
                          <p className="text-[10px] text-slate-400">Needs 1/8" bleed (8.75" x 11.25" template)</p>
                          <p className="text-[10px] font-mono text-emerald-400">$0.25 per poster copy</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-slate-550">Qty:</span>
                        <select
                          value={printItems["8.5x11"].qty}
                          onChange={(e) => setPrintItems({
                            ...printItems,
                            "8.5x11": { ...printItems["8.5x11"], qty: Number(e.target.value) }
                          })}
                          disabled={!printItems["8.5x11"].selected}
                          className="text-xs p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white disabled:opacity-40"
                        >
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="250">250</option>
                          <option value="500">500</option>
                          <option value="1000">1000</option>
                        </select>
                      </div>
                    </div>

                    {/* Item 3: 11x17 */}
                    <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={printItems["11x17"].selected}
                          onChange={(e) => setPrintItems({
                            ...printItems,
                            "11x17": { ...printItems["11x17"], selected: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 border-slate-800 rounded focus:ring-indigo-500 bg-slate-900 focus:ring-2 cursor-pointer"
                        />
                        <div>
                          <p className="text-xs font-bold text-white">11" x 17" Concert Flyer</p>
                          <p className="text-[10px] text-slate-400">Needs 1/8" bleed (11.25" x 17.25" template)</p>
                          <p className="text-[10px] font-mono text-emerald-400">$0.40 per flyer copy</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] uppercase font-bold text-slate-550">Qty:</span>
                        <select
                          value={printItems["11x17"].qty}
                          onChange={(e) => setPrintItems({
                            ...printItems,
                            "11x17": { ...printItems["11x17"], qty: Number(e.target.value) }
                          })}
                          disabled={!printItems["11x17"].selected}
                          className="text-xs p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-white disabled:opacity-40"
                        >
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="250">250</option>
                          <option value="500">500</option>
                          <option value="1000">1000</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={activeItemsList.length === 0}
                    onClick={() => { setCheckoutStep("checkout"); setOrderError(""); }}
                    className="w-full bg-indigo-600 hover:bg-indigo-550 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-colors mt-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Proceed to Checkout ({activeItemsList.length} Selected)
                  </button>
                  
                  {activeItemsList.length === 0 && (
                    <p className="text-[10px] text-rose-400 text-center font-bold">
                      Select at least one print format checkbox above to checkout.
                    </p>
                  )}
                </div>
              ) : (
                <form onSubmit={handlePlacePrintOrder} className="space-y-3.5">
                  {/* Step 2: Checkout with adjustable quantities */}
                  <div>
                    <label className="block text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1.5">
                      Selected quantities (Adjust below)
                    </label>
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {activeItemsList.map((item) => (
                        <div key={item.size} className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-white">
                              {item.size === "4.25x5.5" 
                                ? '4.25" x 5.5" Flyer' 
                                : item.size === "8.5x11" 
                                ? '8.5" x 11" Letter Poster' 
                                : '11" x 17" Concert Flyer'}
                            </span>
                            <span className="block text-[9px] text-slate-500">Needs 1/8" print bleed specs</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-emerald-400">Total: ${(item.quantity * item.rate).toFixed(2)}</span>
                            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [25, 50, 100, 250, 500, 1000];
                                  const idx = list.indexOf(item.quantity);
                                  const nextVal = idx > 0 ? list[idx - 1] : 25;
                                  setPrintItems({
                                    ...printItems,
                                    [item.size]: { ...printItems[item.size], qty: nextVal }
                                  });
                                }}
                                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-2 font-mono text-white text-[10px] min-w-8 text-center">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [25, 50, 100, 250, 500, 1000];
                                  const idx = list.indexOf(item.quantity);
                                  const nextVal = idx < list.length - 1 ? list[idx + 1] : 1000;
                                  setPrintItems({
                                    ...printItems,
                                    [item.size]: { ...printItems[item.size], qty: nextVal }
                                  });
                                }}
                                className="px-2 py-1 text-slate-400 hover:text-white hover:bg-slate-800 text-[10px] font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Row: Shipping carrier speeds */}
                  <div>
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Shipping Speed
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setShippingOption("ground")}
                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                          shippingOption === "ground"
                            ? "bg-indigo-600/35 border-indigo-550 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Standard ($9.50)
                        <span className="block text-[8px] font-normal text-slate-500">5-7 days</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingOption("express2day")}
                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                          shippingOption === "express2day"
                            ? "bg-indigo-600/35 border-indigo-550 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Express ($18.00)
                        <span className="block text-[8px] font-normal text-slate-500">3 days</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShippingOption("overnight")}
                        className={`p-2 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                          shippingOption === "overnight"
                            ? "bg-indigo-600/35 border-indigo-550 text-indigo-300"
                            : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        Overnight ($32.00)
                        <span className="block text-[8px] font-normal text-slate-500">1-2 days</span>
                      </button>
                    </div>
                  </div>

                  {/* Delivery destination address */}
                  <div className="space-y-1.5 p-3 px-3.5 bg-slate-950/50 rounded-xl border border-slate-800/80">
                    <span className="block text-[9px] font-extrabold uppercase text-indigo-300 tracking-wider">
                      📍 Delivery Address Details:
                    </span>
                    
                    <input
                      type="text"
                      placeholder="Recipient Full Name / Organization"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                      className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:border-indigo-550 focus:outline-none"
                      required
                    />

                    <input
                      type="text"
                      placeholder="Street Address"
                      value={shippingAddress.street}
                      onChange={(e) => setShippingAddress({...shippingAddress, street: e.target.value})}
                      className="w-full text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:border-indigo-550 focus:outline-none"
                      required
                    />

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:border-indigo-550 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:border-indigo-550 focus:outline-none"
                        required
                      />
                      <input
                        type="text"
                        placeholder="ZIP"
                        value={shippingAddress.zip}
                        onChange={(e) => setShippingAddress({...shippingAddress, zip: e.target.value})}
                        className="text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-600 focus:border-indigo-550 focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Print Pricing breakdown including Handling Fee */}
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1 text-xs" id="pricing-summary">
                    <div className="space-y-1 pb-1.5 border-b border-slate-800/80">
                      {activeItemsList.map(item => (
                        <div key={item.size} className="flex justify-between text-slate-400 text-[11px]">
                          <span>
                            {item.size === "4.25x5.5" 
                              ? '4.25"x5.5" Flyer' 
                              : item.size === "8.5x11" 
                              ? '8.5"x11" Letter Poster' 
                              : '11"x17" Concert Flyer'} ({item.quantity}x @ ${item.rate.toFixed(2)}):
                          </span>
                          <span className="font-mono">${item.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Shipping charge:</span>
                      <span className="font-mono">${currentShippingCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 pb-1.5 border-b border-slate-800/80">
                      <span>Handling Fee:</span>
                      <span className="font-mono">${currentHandlingFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-white font-black text-sm pt-1.5">
                      <span>Total Price:</span>
                      <span className="font-mono text-emerald-400">
                        ${currentTotalRetailValue.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-black uppercase text-slate-500 tracking-wider">
                      Select Payment Method (Fees route directly to Developer):
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("paypal")}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === "paypal"
                            ? "bg-amber-500/10 border-amber-500 text-amber-200"
                            : "bg-slate-955 border-slate-800 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <span className="text-[9px] bg-amber-400 text-slate-950 px-1 rounded-sm font-black italic">PayPal</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("card")}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          paymentMethod === "card"
                            ? "bg-indigo-600/30 border-indigo-550 text-indigo-200"
                            : "bg-slate-955 border-slate-800 text-slate-400 hover:bg-slate-900"
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Credit Card</span>
                      </button>
                    </div>
                  </div>

                  {/* PayPal Interactive Block */}
                  {paymentMethod === "paypal" && (
                    <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
                      <div className="space-y-1">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Your PayPal Email Address:</label>
                        <input
                          type="email"
                          required
                          placeholder="e.g. buyer@example.com"
                          value={paypalUserEmail}
                          onChange={(e) => setPaypalUserEmail(e.target.value)}
                          className="w-full text-xs p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-medium placeholder-slate-705 focus:border-amber-500 focus:outline-none"
                        />
                        {paypalUserEmail && !paypalUserEmail.includes("@") && (
                          <span className="text-[9px] text-amber-500 font-bold block">Enter a valid email address to enable PayPal checkout.</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Simulated credit card checkout entry */}
                  {paymentMethod === "card" && (
                    <div className="space-y-1.5 p-3 px-3.5 bg-slate-950/40 rounded-xl border border-slate-800/60">
                      <span className="block text-[9px] font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-indigo-450 animate-pulse" />
                        Mock credit card details (Simulated)
                      </span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Card Number"
                          value={paymentCard.number}
                          onChange={(e) => setPaymentCard({...paymentCard, number: e.target.value})}
                          className="flex-1 text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-605 focus:border-indigo-550 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={paymentCard.expiry}
                          onChange={(e) => setPaymentCard({...paymentCard, expiry: e.target.value})}
                          className="w-16 text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-605 focus:border-indigo-550 focus:outline-none text-center"
                        />
                        <input
                          type="password"
                          placeholder="CVV"
                          value={paymentCard.cvv}
                          onChange={(e) => setPaymentCard({...paymentCard, cvv: e.target.value})}
                          className="w-12 text-xs p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono placeholder-slate-605 focus:border-indigo-550 focus:outline-none text-center"
                        />
                      </div>
                    </div>
                  )}

                  {orderError && (
                    <div className="p-2.5 bg-rose-950/40 border border-rose-900 text-rose-300 rounded-lg text-[10px] font-bold">
                      ⚠️ {orderError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isPlacingOrder || (paymentMethod === "paypal" && !paypalUserEmail.includes("@"))}
                    className={`w-full font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-lg transition-colors ${
                      paymentMethod === "paypal"
                        ? "bg-amber-500 hover:bg-amber-600 focus:ring-amber-400 text-slate-950 font-black font-sans"
                        : "bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
                    }`}
                  >
                    {isPlacingOrder ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Queuing order in printing system...
                      </>
                    ) : paymentMethod === "paypal" ? (
                      <>
                        <span>PayPal Checkout (${currentTotalRetailValue.toFixed(2)})</span>
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Place Print Order (${currentTotalRetailValue.toFixed(2)})
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Order invoice result details */}
              {orderResult && (
                <div className="p-4 bg-emerald-950/20 border-2 border-emerald-500 rounded-xl space-y-2 mt-4 text-emerald-100" id="printing-success-invoice">
                  <div className="flex items-center gap-2 pb-1 border-b border-emerald-900/60">
                    <span className="p-1 bg-emerald-500 text-slate-950 rounded-full font-bold">✓</span>
                    <div>
                      <h5 className="text-xs font-black uppercase text-emerald-300">Print Order Placed successfully!</h5>
                      <p className="text-[9px] text-emerald-400">Order registered in the custom printing queue</p>
                    </div>
                  </div>

                  <div className="text-[10px] space-y-1">
                    <div className="flex justify-between">
                      <span>Order Reference ID:</span>
                      <strong className="font-mono text-white">{orderResult.orderId}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Carrier Tracking Number:</span>
                      <strong className="font-mono text-indigo-300">{orderResult.trackingNumber}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Print Status:</span>
                      <strong className="text-yellow-400 font-extrabold">{orderResult.status}</strong>
                    </div>
                    <div className="flex justify-between pb-1 border-b border-emerald-900/40">
                      <span>Estimated Standard Arrival:</span>
                      <strong className="text-white">{orderResult.estimatedDelivery}</strong>
                    </div>
                    
                    {/* Itemized list of orders in success coupon */}
                    {orderResult.itemsOrdered && (
                      <div className="space-y-1 py-1 pb-1.5 border-b border-emerald-900/40">
                        <span className="block text-[8px] uppercase tracking-wide text-emerald-400">Items Ordered:</span>
                        {orderResult.itemsOrdered.map((it: any, i: number) => (
                          <div key={i} className="flex justify-between text-emerald-100">
                            <span>{it.size} ({it.quantity}x):</span>
                            <span>${it.total?.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {orderResult.billingBreakdown?.handlingFee !== undefined && (
                      <div className="flex justify-between">
                        <span>Handling Fee:</span>
                        <strong className="text-white">${orderResult.billingBreakdown.handlingFee.toFixed(2)}</strong>
                      </div>
                    )}
                    <div className="flex justify-between pt-1 font-bold border-t border-emerald-900/30">
                      <span>Total Charge:</span>
                      <strong className="text-white">${orderResult.billingBreakdown?.totalRetail?.toFixed(2)}</strong>
                    </div>

                    {orderResult.billingBreakdown?.handlingFee !== undefined && (
                      <div className="p-2.5 bg-indigo-500/10 border border-indigo-550/20 rounded-lg text-[9px] text-indigo-200 mt-2 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>Handling Fee Routing:</span>
                          <span className="text-amber-400">PayPal Route Active</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recipient Address:</span>
                          <strong className="text-white font-mono">littlerusty@gmail.com</strong>
                        </div>
                        {orderResult.billingBreakdown?.paymentMethod === "paypal" && orderResult.billingBreakdown?.paypalUserEmail && (
                          <div className="flex justify-between text-[8px] text-indigo-300">
                            <span>Authorizer PayPal:</span>
                            <span className="font-mono">{orderResult.billingBreakdown.paypalUserEmail}</span>
                          </div>
                        )}
                        <p className="text-[8.5px] italic text-indigo-300 leading-normal pt-1 border-t border-indigo-500/20">
                          {orderResult.billingBreakdown?.paymentMethod === "paypal"
                            ? "Handling fees and printing costs have been successfully transferred to the master developer PayPal recipient."
                            : `The standard order handling fee ($${orderResult.billingBreakdown.handlingFee.toFixed(2)}) has been securely routed to the developer's registered PayPal (littlerusty@gmail.com).`}
                        </p>
                      </div>
                    )}
                  </div>

                  <p className="text-[8.5px] italic text-emerald-405 leading-relaxed pt-1 select-all">
                    💡 Simulated purchase complete. Your order and PayPal routing details have been recorded on the local service ledger!
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Live CSS styled templates based on themeId */
          <div 
            id="concert-poster-frame"
            className={`w-[320px] sm:w-[350px] min-h-[490px] border border-gray-950 rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col justify-between text-center relative transition-all ${c.frame}`}
            style={{
              transformStyle: "preserve-3d"
            }}
          >
            {/* Theme overlay designs */}
            {/* 1. GRUNGE OVERLAY */}
            {config.themeId === "heavy-grunge" && (
              <div className="absolute inset-0 bg-radial-gradient from-red-900/10 to-black/80 pointer-events-none border-4 border-red-900 m-2 rounded-xl" id="grunge-borders">
                <div className="absolute inset-0 opacity-15 mix-blend-overlay" style={{ backgroundImage: "repeating-linear-gradient(45deg, #000, #000 10px, #ff4c4c 10px, #ff4c4c 20px)" }} />
              </div>
            )}

            {/* 2. SYNTHWAVE LINES */}
            {config.themeId === "retro-neon" && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-end" id="synth-decorations">
                <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-gradient-to-b from-pink-500 to-yellow-400 opacity-60 filter blur-xs" />
                {/* Retro sun line background representation */}
                <div className="h-28 bg-gradient-to-t from-pink-500/20 to-transparent flex flex-col justify-between py-1 opacity-60">
                  <div className="border-b border-pink-500/30 w-full" />
                  <div className="border-b border-pink-500/25 w-full" />
                  <div className="border-b border-pink-500/20 w-full" />
                  <div className="border-b border-pink-500/10 w-full" />
                  <div className="border-b border-pink-500/5 w-full" />
                </div>
              </div>
            )}

            {/* 3. MINIMAL CIRCLES */}
            {config.themeId === "indie-minimal" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 animate-pulse" id="indie-decorations">
                <div className="w-56 h-56 rounded-full border border-slate-205 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border border-slate-200/40" />
                </div>
              </div>
            )}

            {/* 4. COZY FOLK LEAF ACCENTS */}
            {config.themeId === "folk-acoustic" && (
              <div className="absolute inset-0 border-double border-4 border-amber-800/15 m-3 rounded-lg flex items-center justify-between pointer-events-none p-4" id="folk-decorations">
                <div className="text-xl text-amber-900/15 font-serif select-none">🎕</div>
                <div className="text-xl text-amber-900/15 font-serif select-none mt-auto ml-auto">🎕</div>
              </div>
            )}

            {/* 5. PSYCHEDELIC ACID SPIN */}
            {config.themeId === "psychedelic-acid" && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden" id="psychedelic-decorations">
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-purple-700/35 filter blur-xl animate-pulse" />
                <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full bg-pink-700/30 filter blur-xl animate-pulse" />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #f59e0b 2px, transparent 1px)", backgroundSize: "16px 16px" }} />
              </div>
            )}

            {/* 6. HELLFIRE SLASH */}
            {config.themeId === "metal-hellfire" && (
              <div className="absolute inset-0 pointer-events-none border border-red-500/20 m-1.5" id="metal-decorations">
                <div className="absolute top-0 bottom-0 left-4 w-[1px] bg-red-800/20" />
                <div className="absolute top-0 bottom-0 right-4 w-[1px] bg-red-800/20" />
                <div className="absolute top-4 left-0 right-0 h-[1px] bg-red-800/20" />
                <div className="absolute bottom-4 left-0 right-0 h-[1px] bg-red-800/20" />
              </div>
            )}

            {/* 7. POP GRID */}
            {config.themeId === "pop-bubblegum" && (
              <div className="absolute inset-0 pointer-events-none" id="pop-decorations">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 15px, #ec4899 15px, #ec4899 30px)" }} />
                <div className="absolute top-4 right-4 text-xs text-pink-305/40 select-none">☁️</div>
                <div className="absolute bottom-4 left-4 text-xs text-pink-305/40 select-none">🍭</div>
              </div>
            )}

            {/* 8. JAZZ VANGUARD GOLD FLOURISH */}
            {config.themeId === "jazz-vanguard" && (
              <div className="absolute inset-0 pointer-events-none border border-amber-600/30 m-3" id="jazz-decorations">
                <div className="absolute top-2 left-2 text-[8px] text-amber-600/40 select-none font-sans font-bold">MIDNIGHT SESSION</div>
                <div className="absolute bottom-2 right-2 text-[8px] text-amber-600/40 select-none font-serif">VANGUARD CLUB</div>
              </div>
            )}

            {/* 9. RAVE MATRIX GRID */}
            {config.themeId === "dubstep-laser" && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden" id="laser-decorations">
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#10b981] opacity-75 shadow-[0_0_8px_#10b981]" />
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#10b981] opacity-75 shadow-[0_0_8px_#10b981]" />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }} />
              </div>
            )}

            {/* 10. PUNK DIY PHOTOCOPY */}
            {config.themeId === "punk-diy" && (
              <div className="absolute inset-0 pointer-events-none border-t-[12px] border-b-[12px] border-black flex flex-col justify-between" id="punk-decorations">
                <div className="absolute inset-x-2 top-4 h-[2px] bg-black translate-y-1 rotate-1" />
                <div className="absolute inset-x-2 bottom-4 h-[2px] bg-black -translate-y-1 -rotate-2" />
              </div>
            )}

            {/* Top details card info */}
            <div className="space-y-4 pt-4 z-10" id="poster-layout-top">
              {/* Supporting Tagline / Tour subtitle */}
              <h5 className={`text-[10px] uppercase font-black tracking-widest ${c.tagline}`} id="poster-tagline-preview">
                {config.secondaryText || "ON TOUR NOW / SPECIAL GUESTS"}
              </h5>

              {/* Main Headline band title */}
              <h1 className={`leading-none font-bold select-all tracking-tighter ${c.bandName}`} id="poster-band-preview">
                {config.bandName || "GENERIC HEADLINER BAND"}
              </h1>
            </div>

            {/* Mid details (Main Venue details and graphic representations) */}
            <div className="space-y-3 py-4 z-10" id="poster-layout-mid">
              {/* Custom stylized circle graphic representation if Indie */}
              {config.themeId === "indie-minimal" && (
                <div className="w-10 h-10 rounded-full bg-slate-900 text-white mx-auto flex items-center justify-center text-xs font-mono mb-4" id="indie-mid-graphic">
                  L-S
                </div>
              )}

              {/* Custom vector icons if Folk */}
              {config.themeId === "folk-acoustic" && (
                <div className="text-amber-800 text-lg my-1 select-none" id="folk-mid-graphic">
                  ❀ ─── ❀ ─── ❀
                </div>
              )}

              {/* Psychedelic */}
              {config.themeId === "psychedelic-acid" && (
                <div className="text-purple-400 text-xl my-1 select-none animate-bounce" id="psych-mid-graphic">
                  ☯ 🌀 ☯
                </div>
              )}

              {/* Metal */}
              {config.themeId === "metal-hellfire" && (
                <div className="text-red-700 text-xl my-1 select-none font-bold tracking-widest" id="metal-mid-graphic">
                  ☠ 🜏 ☠
                </div>
              )}

              {/* Pop */}
              {config.themeId === "pop-bubblegum" && (
                <div className="text-pink-400 text-base my-1 select-none" id="pop-mid-graphic">
                  ★ ★ ★ ★ ★
                </div>
              )}

              {/* Jazz */}
              {config.themeId === "jazz-vanguard" && (
                <div className="text-amber-500 text-base my-1 select-none tracking-widest font-serif font-light" id="jazz-mid-graphic">
                  ◆ ─── ♫ ─── ◆
                </div>
              )}

              {/* Dubstep */}
              {config.themeId === "dubstep-laser" && (
                <div className="text-[#10b981] text-xs font-mono my-1 select-none" id="synth-mid-graphic">
                  [ SIGNAL DETECTED_ ]
                </div>
              )}

              {/* Punk */}
              {config.themeId === "punk-diy" && (
                <div className="text-black text-xl font-mono my-2 select-none font-black" id="punk-mid-graphic">
                  ⚡ ☠ ⚡
                </div>
              )}

              <div className="space-y-1" id="venue-text-previews">
                <h2 className={`text-base font-bold uppercase tracking-wide ${c.venueName}`} id="poster-venue-name-preview">
                  {config.venueName || "LOCAL MUSIC HALL"}
                </h2>

                <p className={`text-[10px] font-medium flex items-center justify-center gap-1 leading-normal ${
                  config.themeId === "punk-diy" ? "text-black font-black" : "text-gray-500"
                }`} id="poster-venue-addr-preview">
                  <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                  {config.venueAddress || "412 Pike St, Seattle, WA"}
                </p>
              </div>
            </div>

            {/* Bottom detail footer tags (Time, entry fees, limits, snacks icons) */}
            <div className="border-t pt-4 space-y-4 z-10" id="poster-layout-bottom" style={{ borderColor: "rgba(100,100,100,0.15)" }}>
              {/* Date and time badges */}
              <div className="flex justify-center items-center gap-3 text-xs" id="footer-badges-preview">
                <span className={`px-2.5 py-1 rounded font-bold font-mono tracking-tight flex items-center gap-1.5 ${c.dateBadge}`} id="poster-date-preview">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {config.dateStr || "Friday, Oct 24th"}
                </span>

                <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${c.timeBadge}`} id="poster-time-preview">
                  {config.timeStr || "Music at 9 PM"}
                </span>
              </div>

              {/* Pricing and Entrance Limit badges row */}
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold" id="pricing-age-preview">
                <span className={`flex items-center gap-0.5 ${config.themeId === "punk-diy" ? "text-black font-black font-mono border-b border-blackL" : "text-slate-500"}`} id="poster-price-label">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  {config.priceStr || "$10 Adv / $15 Door"}
                </span>

                <span className={`px-2 py-0.5 text-[9px] uppercase font-black rounded-sm tracking-wider ${
                  config.themeId === "heavy-grunge" ? "bg-stone-800 text-orange-200" : ""
                } ${
                  config.themeId === "punk-diy" ? "bg-black text-white font-black" : "bg-slate-900 text-white"
                }`} id="poster-age-badge">
                  {config.allAges}
                </span>
              </div>

              {/* Custom food / beverages ICON indications if toggled */}
              {(config.amenities.servesFood || config.amenities.servesAlcohol || config.amenities.merchArea) && (
                <div className={`rounded-lg p-2 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider mx-auto max-w-[240px] ${
                  config.themeId === "punk-diy" ? "bg-slate-100 border-2 border-black text-black" : "bg-slate-900/10 text-slate-700"
                }`} id="poster-amenities-pills">
                  {config.amenities.servesFood && (
                    <span className="flex items-center gap-1" id="pill-preview-food">
                      <UtensilsCrossed className="w-3.5 h-3.5 text-indigo-600" />
                      Food
                    </span>
                  )}
                  {config.amenities.servesAlcohol && (
                    <span className="flex items-center gap-1" id="pill-preview-alcohol">
                      <Wine className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      Drinks
                    </span>
                  )}
                  {config.amenities.merchArea && (
                    <span className="flex items-center gap-1" id="pill-preview-merch">
                      👕 Merch
                    </span>
                  )}
                </div>
              )}

              {/* Extra safety info labels at the very bottom */}
              {config.extraDetails && (
                <p className="text-[9px] text-gray-400 font-medium tracking-tight italic" id="poster-notes-preview">
                  *{config.extraDetails}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
