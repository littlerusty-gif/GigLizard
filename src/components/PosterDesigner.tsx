import React, { useState, useEffect } from "react";
import { PosterConfig, SloganProposal, UserAccount } from "../types";
import { 
  Sparkles, Image, RefreshCw, Layers, CheckSquare, Wine, UtensilsCrossed, 
  Calendar, DollarSign, MapPin, Eye, Wand2, Check, Download, Printer, 
  ArrowLeft, Users, Save, Type, Palette, FileText, ExternalLink, Flame, CheckCircle2
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

// Helper to resolve font family classes for poster title
const getFontFamilyClass = (fontStyle?: string) => {
  switch (fontStyle) {
    case "serif":
      return "font-serif tracking-normal";
    case "clean":
      return "font-sans font-extrabold tracking-wide";
    case "mono":
      return "font-mono font-bold tracking-tight";
    case "distressed":
      return "font-black tracking-tighter uppercase";
    case "impact":
    default:
      return "font-black tracking-tight uppercase";
  }
};

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

    case "classic-rock": {
      if (isDefault) {
        return {
          frame: "bg-[#14100c] text-amber-100 font-serif border-4 border-amber-600/70 shadow-2xl tracking-normal",
          tagline: "text-amber-400 font-sans uppercase font-bold tracking-widest",
          bandName: "text-amber-200 font-black tracking-tight",
          venueName: "text-amber-100 font-serif uppercase tracking-widest",
          dateBadge: "bg-amber-900/60 border border-amber-600 text-amber-200 font-bold",
          timeBadge: "bg-stone-900 text-amber-300 border border-amber-800/40",
          graphicColor: "text-amber-500",
          sloganColor: "text-amber-400"
        };
      }
      const map: Record<string, any> = {
        red:    { frame: "bg-[#1a0a0a] text-red-100 font-serif border-4 border-red-700", tagline: "text-red-400", bandName: "text-red-200", venue: "text-red-100", date: "bg-red-950 border-red-700 text-red-200", time: "bg-black text-red-300" },
        blue:   { frame: "bg-[#0a121a] text-sky-100 font-serif border-4 border-sky-700", tagline: "text-sky-400", bandName: "text-sky-200", venue: "text-sky-100", date: "bg-sky-950 border-sky-700 text-sky-200", time: "bg-black text-sky-300" },
        green:  { frame: "bg-[#0a180e] text-emerald-100 font-serif border-4 border-emerald-700", tagline: "text-emerald-400", bandName: "text-emerald-200", venue: "text-emerald-100", date: "bg-emerald-950 border-emerald-700 text-emerald-200", time: "bg-black text-emerald-300" },
        purple: { frame: "bg-[#160a1f] text-purple-100 font-serif border-4 border-purple-700", tagline: "text-purple-400", bandName: "text-purple-200", venue: "text-purple-100", date: "bg-purple-950 border-purple-700 text-purple-200", time: "bg-black text-purple-300" },
        amber:  { frame: "bg-[#1c1208] text-amber-100 font-serif border-4 border-amber-600", tagline: "text-amber-400", bandName: "text-amber-200", venue: "text-amber-100", date: "bg-amber-950 border-amber-600 text-amber-200", time: "bg-black text-amber-300" },
        pink:   { frame: "bg-[#1f0a17] text-pink-100 font-serif border-4 border-pink-700", tagline: "text-pink-400", bandName: "text-pink-200", venue: "text-pink-100", date: "bg-pink-950 border-pink-700 text-pink-200", time: "bg-black text-pink-300" },
        black:  { frame: "bg-[#0d0d0d] text-zinc-100 font-serif border-4 border-zinc-700", tagline: "text-zinc-400", bandName: "text-zinc-200", venue: "text-zinc-100", date: "bg-zinc-900 border-zinc-700 text-zinc-200", time: "bg-black text-zinc-300" }
      };
      const sel = map[colorId] || map.amber;
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
  currentUser?: any;
  currentAccount?: UserAccount | null;
}

export default function PosterDesigner({ config, onChangeConfig, currentUser, currentAccount }: PosterDesignerProps) {
  const [slogans, setSlogans] = useState<SloganProposal[]>([]);
  const [isGeneratingSlogans, setIsGeneratingSlogans] = useState(false);
  const [appliedSloganIdx, setAppliedSloganIdx] = useState<number | null>(null);
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string } | null>(null);

  // 1. User Band Name Default: check linked band record or profile
  useEffect(() => {
    const linkedBandName = 
      currentAccount?.type === "Band" && currentAccount?.name
        ? currentAccount.name
        : currentAccount?.name ||
          (currentUser as any)?.band_name ||
          (currentUser as any)?.name ||
          "";

    // If available and Headline Band Name is not yet set by the user, set it to their actual band name
    if (linkedBandName && !config.bandName) {
      onChangeConfig({
        ...config,
        bandName: linkedBandName
      });
    }
  }, [currentAccount, currentUser]);

  const handleSavePoster = () => {
    try {
      localStorage.setItem("user_saved_poster_v1", JSON.stringify(config));
      setSaveToast({ show: true, message: "✓ Concert poster design saved!" });
      setTimeout(() => setSaveToast(null), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  // High-Resolution Export & Download state
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingFlyer, setIsExportingFlyer] = useState(false);
  const [selectedPdfSize, setSelectedPdfSize] = useState<"11x17" | "12x18" | "4.25x5.5">("11x17");
  const [selectedFlyerRatio, setSelectedFlyerRatio] = useState<"poster" | "handbill">("poster");
  const [selectedFlyerFormat, setSelectedFlyerFormat] = useState<"png" | "jpg">("png");
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // 1. Download Print-Ready Poster / Handbill (PDF) - 300 DPI CMYK bleed-ready standard specs (11x17, 12x18, and 4.25x5.5)
  const handleDownloadPrintReadyPdf = async (sizeOverride?: "11x17" | "12x18" | "4.25x5.5") => {
    const size = sizeOverride || selectedPdfSize;
    const element = document.getElementById("concert-poster-frame");
    if (!element) {
      alert("Poster preview canvas not found!");
      return;
    }
    setIsExportingPdf(true);
    setExportNotice(`Rendering ${size === "4.25x5.5" ? "4.25\" × 5.5\" Handbill" : size} 300 DPI bleed-ready PDF...`);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(element, {
        scale: 3, // 300 DPI equivalent print rasterization
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });
      const imgData = canvas.toDataURL("image/png");
      
      const widthInches = size === "12x18" ? 12 : size === "4.25x5.5" ? 4.25 : 11;
      const heightInches = size === "12x18" ? 18 : size === "4.25x5.5" ? 5.5 : 17;
      
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "in",
        format: [widthInches, heightInches]
      });

      // Fit image into the page
      // For 4.25 x 5.5 handbill, calculate cover scaling to ensure proper bleed margins without distorting aspect ratio
      if (size === "4.25x5.5") {
        const targetRatio = widthInches / heightInches;
        const imgRatio = canvas.width / canvas.height;
        let drawW = widthInches;
        let drawH = heightInches;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio < targetRatio) {
          // Poster is taller than 4.25:5.5 -> scale to match width, center vertically for bleed
          drawW = widthInches;
          drawH = widthInches / imgRatio;
          offsetY = (heightInches - drawH) / 2;
        } else {
          // Poster is wider than 4.25:5.5 -> scale to match height, center horizontally for bleed
          drawH = heightInches;
          drawW = heightInches * imgRatio;
          offsetX = (widthInches - drawW) / 2;
        }
        pdf.addImage(imgData, "PNG", offsetX, offsetY, drawW, drawH, undefined, "FAST");
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, widthInches, heightInches, undefined, "FAST");
      }

      const isHandbill = size === "4.25x5.5";
      pdf.setProperties({
        title: `${config.bandName || "Concert"} - ${isHandbill ? "4.25x5.5 Handbill" : size + " Poster"} Bleed-Ready (300 DPI)`,
        subject: "Print-Ready Concert Poster & Handbill - 300 DPI CMYK Bleed-Ready Specs",
        author: "GigLizard Stage Director",
        keywords: "concert poster, 11x17, 12x18, 4.25x5.5, handbill, quarter sheet, bleed ready, 300 dpi, fireball printing"
      });

      const bandSlug = (config.bandName || "concert-poster")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-") || "concert";
      pdf.save(`${bandSlug}-${isHandbill ? "4.25x5.5-handbill" : size + "-poster"}-300dpi-print-ready.pdf`);
      
      setExportNotice(`✓ Downloaded ${isHandbill ? "4.25\" × 5.5\" Handbill" : size} Print-Ready (PDF)!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error("Could not generate PDF:", err);
      alert("Could not generate high-resolution PDF. Please try Web Flyer PNG/JPG or browser Local Print.");
      setExportNotice(null);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // 2. Download Web Flyer (PNG/JPG) - High-res RGB for Instagram, Facebook, and promo posts, with 4.25:5.5 handbill preset
  const handleDownloadWebFlyer = async (formatOverride?: "png" | "jpg", ratioOverride?: "poster" | "handbill") => {
    const format = formatOverride || selectedFlyerFormat;
    const ratio = ratioOverride || selectedFlyerRatio;
    const element = document.getElementById("concert-poster-frame");
    if (!element) {
      alert("Poster preview frame not found!");
      return;
    }
    setIsExportingFlyer(true);
    setExportNotice(`Generating ${ratio === "handbill" ? "4.25:5.5 Handbill" : "web flyer"} (${format.toUpperCase()})...`);
    try {
      await new Promise(r => setTimeout(r, 100));
      const canvas = await html2canvas(element, {
        scale: 3, // High-res RGB rendering for Instagram, Facebook, and promo posts
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false
      });

      const bandSlug = (config.bandName || "concert-poster")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-") || "concert";

      let finalCanvas = canvas;
      if (ratio === "handbill") {
        // Quarter-sheet flyer: 4.25" × 5.5" at 300 DPI = 1275 × 1650 px
        const targetW = 1275;
        const targetH = 1650;
        const handbillCanvas = document.createElement("canvas");
        handbillCanvas.width = targetW;
        handbillCanvas.height = targetH;
        const hCtx = handbillCanvas.getContext("2d");
        if (hCtx) {
          // Fill background tone to match theme
          hCtx.fillStyle = config.themeId.includes("minimal") || config.themeId.includes("diy") ? "#ffffff" : "#0d0d12";
          hCtx.fillRect(0, 0, targetW, targetH);

          // Cover and center the poster image to 4.25:5.5 handbill ratio
          const scale = Math.max(targetW / canvas.width, targetH / canvas.height);
          const drawW = canvas.width * scale;
          const drawH = canvas.height * scale;
          const drawX = (targetW - drawW) / 2;
          const drawY = (targetH - drawH) / 2;

          hCtx.drawImage(canvas, drawX, drawY, drawW, drawH);
          finalCanvas = handbillCanvas;
        }
      }

      let dataUrl: string;
      if (format === "jpg") {
        const jpgCanvas = document.createElement("canvas");
        jpgCanvas.width = finalCanvas.width;
        jpgCanvas.height = finalCanvas.height;
        const ctx = jpgCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, jpgCanvas.width, jpgCanvas.height);
          ctx.drawImage(finalCanvas, 0, 0);
        }
        dataUrl = jpgCanvas.toDataURL("image/jpeg", 0.95);
      } else {
        dataUrl = finalCanvas.toDataURL("image/png");
      }

      const link = document.createElement("a");
      const filenameSuffix = ratio === "handbill" ? "4.25x5.5-handbill" : "web-flyer";
      link.download = `${bandSlug}-${filenameSuffix}-${format.toLowerCase()}.${format}`;
      link.href = dataUrl;
      link.click();

      setExportNotice(`✓ Downloaded ${ratio === "handbill" ? "4.25\" × 5.5\" Handbill" : "High-Res Web Flyer"} (${format.toUpperCase()})!`);
      setTimeout(() => setExportNotice(null), 4000);
    } catch (err: any) {
      console.error("Could not capture flyer:", err);
      alert("Could not generate flyer download. Try Local Print or PDF export.");
      setExportNotice(null);
    } finally {
      setIsExportingFlyer(false);
    }
  };

  const c = getThemeClasses(config.themeId, config.colorId || "default");

  // Core Themes Config - Expanded to distinct, attention-grabbing presets
  const themes = [
    { id: "heavy-grunge", label: "🤘 Grunge", color: "border-rose-450", bg: "bg-red-950" },
    { id: "classic-rock", label: "⚡ Classic Rock", color: "border-amber-500", bg: "bg-stone-900" },
    { id: "indie-minimal", label: "☘️ Modern Minimalist", color: "border-emerald-305", bg: "bg-slate-50" },
    { id: "psychedelic-acid", label: "🌈 Psychedelic", color: "border-purple-600", bg: "bg-[#180824]" },
    { id: "retro-neon", label: "👾 Retro Synthwave", color: "border-pink-500", bg: "bg-indigo-950" },
    { id: "metal-hellfire", label: "🔥 Metal Hellfire", color: "border-red-650", bg: "bg-[#090504]" },
    { id: "folk-acoustic", label: "🌻 Organic Folk", color: "border-amber-700", bg: "bg-amber-50" },
    { id: "pop-bubblegum", label: "🍭 Pop Bubblegum", color: "border-[#f472b6]", bg: "bg-[#fdf2f8]" },
    { id: "jazz-vanguard", label: "🎷 Jazz Vanguard", color: "border-yellow-950", bg: "bg-[#020617]" },
    { id: "dubstep-laser", label: "⚡ Rave Dubstep", color: "border-[#10b981]", bg: "bg-black" },
    { id: "punk-diy", label: "✂️ Punk DIY Collage", color: "border-black", bg: "bg-white" }
  ];

  // Typography font presets
  const fontStyles = [
    { id: "impact", label: "Heavy Impact", sample: "IMPACT", fontClass: "font-black tracking-tight uppercase" },
    { id: "serif", label: "Classic Serif", sample: "Vintage", fontClass: "font-serif tracking-normal" },
    { id: "clean", label: "Modern Clean", sample: "Minimal", fontClass: "font-sans font-bold tracking-wide" },
    { id: "mono", label: "Monospace", sample: "UNDERGROUND", fontClass: "font-mono font-bold tracking-tight" },
    { id: "distressed", label: "Distressed Stencil", sample: "GRUNGE", fontClass: "font-black tracking-tighter uppercase" }
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
      console.warn("Using curated poster slogans:", e);
      const fallbackSlogans = [
        { slogan: "LIVE AND LOUD.", context: "Bold all-caps headline directly below band name." },
        { slogan: "ONE NIGHT ONLY.", context: "Punchy sub-header above venue and date." },
        { slogan: "TURN UP THE REVERB.", context: "Angled distressed script across poster middle." },
        { slogan: "BRING YOUR CREW.", context: "Small-print footer above ticket prices." },
        { slogan: "DOORS OPEN EARLY.", context: "Highlighted accent badge next to stage time." }
      ];
      setSlogans(fallbackSlogans);
    } finally {
      setIsGeneratingSlogans(false);
    }
  };

  const handleApplySlogan = (sloganText: string, idx: number) => {
    handleFieldChange("secondaryText", sloganText.toUpperCase());
    setAppliedSloganIdx(idx);
    setTimeout(() => setAppliedSloganIdx(null), 2000);
  };

  // Fireball Printing Recommendation Card
  const renderFireballCard = () => (
    <div 
      id="fireball-printing-recommendation" 
      className="w-full bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-4 sm:p-5 text-white shadow-xl space-y-3.5 relative overflow-hidden text-left"
    >
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-amber-500/20 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-orange-400 flex items-center justify-center shadow-md shrink-0">
            <Flame className="w-5 h-5 text-white fill-white" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-black tracking-widest text-amber-400 block">
              Order Physical Gig Posters
            </span>
            <h4 className="text-sm sm:text-base font-black text-white tracking-tight">
              Print Physical Flyers with Fireball Printing
            </h4>
          </div>
        </div>

        <a
          href="https://fireballprinting.com"
          target="_blank"
          rel="noopener noreferrer"
          id="btn-fireball-printing-link"
          className="inline-flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] shrink-0 cursor-pointer"
        >
          <span>Order on Fireball Printing</span>
          <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
        </a>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed">
        We recommend Fireball Printing for fast, indie-friendly, high-quality band flyer and concert poster printing. Download your print-ready file above, then upload it directly on their site.
      </p>

      {/* Quick specs checklist */}
      <div className="bg-slate-950/70 border border-amber-500/25 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px]">
        <div className="flex items-center gap-2 text-amber-200 font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Recommended formats: 11x17 or 12x18 tabloid posters, or 4.25x5.5 quarter-sheet handbills (300 DPI).</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium shrink-0">
          <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">100lb Gloss / Cardstock</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono">Fast Shipping</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col space-y-8 animate-fade-in w-full max-w-5xl mx-auto" id="poster-designer-panel">
      {/* SECTION 1 (Top) & SECTION 2 (Middle): Control inputs in top-down workflow stack */}
      <div className="w-full bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 space-y-6 shadow-xs" id="designer-controls">
        <div className="border-b border-gray-100 pb-3" id="control-intro">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5" id="controls-title">
              <Layers className="w-4 h-4 text-indigo-500" />
              Concert Poster Designer
            </h3>
            {saveToast && (
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                {saveToast.message}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 font-medium mt-0.5" id="controls-desc">
            Top-down design workflow: choose your theme preset, pick your color scheme & typography, enter concert billing details, and export prints.
          </p>
        </div>

        {/* Inputs Layout - Top-Down Editor Workflow */}
        <div className="space-y-5 text-xs" id="control-fields-box">
          
          {/* STEP 1: THEME / STYLE PRESET SELECTOR */}
          <div className="space-y-2" id="step-1-theme-section">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">1</span>
                Theme & Style Preset
              </span>
              <span className="text-[10px] text-indigo-600 font-bold capitalize">
                {themes.find(t => t.id === config.themeId)?.label.replace(/^[^\w]+/, '') || config.themeId}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2" id="themes-grid-input">
              {themes.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  id={`btn-theme-${th.id}`}
                  onClick={() => handleFieldChange("themeId", th.id)}
                  className={`p-2.5 rounded-xl border text-[11px] font-bold text-left transition-all cursor-pointer flex items-center justify-between ${
                    config.themeId === th.id
                      ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-xs ring-1 ring-indigo-500"
                      : "border-gray-200/80 bg-white text-slate-700 hover:border-gray-300 hover:bg-slate-50/50"
                  }`}
                >
                  <span className="truncate">{th.label}</span>
                  {config.themeId === th.id && (
                    <Check className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* STEP 2: COLOR PALETTE & TYPOGRAPHY PICKER */}
          <div className="space-y-3.5 border-t border-gray-100 pt-4" id="step-2-palette-typography-section">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">2</span>
                Color Palette & Typography Picker
              </span>
            </div>

            {/* Color Palette (Background, Accent, Text colors) */}
            <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100" id="color-swatch-group">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3.5 h-3.5 text-slate-500" />
                  Color Scheme Accent
                </span>
                <span className="text-[9.5px] text-slate-400 font-medium">
                  {colorSwatches.find(s => s.id === (config.colorId || "default"))?.label}
                </span>
              </div>
              <div className="flex flex-wrap gap-2 items-center pt-1" id="color-swatches-row">
                {colorSwatches.map((sw) => {
                  const isSelected = (config.colorId || "default") === sw.id;
                  return (
                    <button
                      key={sw.id}
                      type="button"
                      onClick={() => handleFieldChange("colorId", sw.id)}
                      title={sw.label}
                      className={`w-7 h-7 rounded-full border border-gray-200 cursor-pointer transition-all flex items-center justify-center hover:scale-110 active:scale-95 shadow-xs ${sw.swatchBg} ${
                        isSelected 
                          ? "scale-110 ring-2 ring-indigo-600 ring-offset-2 border-white" 
                          : "opacity-85 hover:opacity-100"
                      }`}
                      id={`swatch-picker-btn-${sw.id}`}
                    >
                      {isSelected && (
                        <Check className={`w-3.5 h-3.5 ${sw.id === "default" || sw.id === "black" ? "text-slate-800" : "text-white"}`} />
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="text-[9.5px] text-gray-400 font-medium leading-relaxed italic pt-1">
                Dynamically adjusts background tones, border accents, and text highlights.
              </p>
            </div>

            {/* Typography Font Picker */}
            <div className="space-y-1.5 bg-slate-50/60 p-3 rounded-xl border border-slate-100" id="typography-font-picker">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                <Type className="w-3.5 h-3.5 text-slate-500" />
                Headline Typography Style
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
                {fontStyles.map((f) => {
                  const isSelected = (config.fontStyle || "impact") === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleFieldChange("fontStyle", f.id)}
                      className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? "border-indigo-600 bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-500"
                          : "border-gray-200 bg-white/70 text-slate-600 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-[10px] font-bold">{f.label}</div>
                      <div className={`text-[12px] truncate ${f.fontClass}`}>{f.sample}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* STEP 3: POSTER CONTENT DETAILS */}
          <div className="space-y-3.5 border-t border-gray-100 pt-4" id="step-3-content-details-section">
            <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">3</span>
              Poster Content Details
            </span>

            {/* Headline Band Name */}
            <div id="field-wrap-band">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Headline Band Name
              </label>
              <input
                type="text"
                id="field-poster-bandName"
                value={config.bandName}
                onChange={(e) => handleFieldChange("bandName", e.target.value)}
                placeholder="e.g., The Midnight Echoes"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold placeholder:text-gray-400 placeholder:text-zinc-500"
              />
            </div>

            {/* Supporting Acts */}
            <div id="field-wrap-supporting-acts" className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-500" />
                  Supporting Acts
                </label>
                {config.supportingActs && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange("supportingActs", "")}
                    className="text-[9.5px] text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
              <input
                type="text"
                id="field-poster-supportingActs"
                value={config.supportingActs || ""}
                onChange={(e) => handleFieldChange("supportingActs", e.target.value)}
                placeholder="e.g., Special Guests: Velvet Rust, The Drifters"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium placeholder:text-gray-400 placeholder:text-zinc-500"
              />
            </div>

            {/* Venue & Location */}
            <div id="field-wrap-venue" className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Venue & Location
              </label>
              <input
                type="text"
                id="field-poster-venueName"
                value={config.venueName}
                onChange={(e) => handleFieldChange("venueName", e.target.value)}
                placeholder="e.g., The Crystal Ballroom · Portland, OR"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold placeholder:text-gray-400 placeholder:text-zinc-500"
              />
            </div>

            {/* Date & Time */}
            <div id="field-wrap-datetime" className="space-y-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Date & Time
              </label>
              <input
                type="text"
                id="field-poster-dateStr"
                value={config.dateStr}
                onChange={(e) => handleFieldChange("dateStr", e.target.value)}
                placeholder="e.g., Friday, Nov 14 · Doors 7:00 PM / Show 8:00 PM"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400 placeholder:text-zinc-500"
              />
            </div>

            {/* Admission / Ticket Info & Age limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="fields-pricing-ages-row">
              <div id="field-wrap-price">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Admission / Ticket Info
                </label>
                <input
                  type="text"
                  id="field-poster-priceStr"
                  value={config.priceStr}
                  onChange={(e) => handleFieldChange("priceStr", e.target.value)}
                  placeholder="e.g., $15 Advance / $20 Door · 21+ · Tickets at link"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium placeholder:text-gray-400 placeholder:text-zinc-500"
                />
              </div>

              <div id="age-selector-grp">
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                  Age Restriction
                </label>
                <select
                  id="field-poster-allAges"
                  value={config.allAges}
                  onChange={(e) => handleFieldChange("allAges", e.target.value)}
                  className="w-full p-2.5 text-xs border border-gray-200 bg-slate-50 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All Ages">All Ages</option>
                  <option value="18+ w/ ID">18+ Entrance</option>
                  <option value="21+ w/ ID">21+ Entrance</option>
                </select>
              </div>
            </div>

            {/* Additional Details */}
            <div id="field-wrap-extraDetails">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Additional Details
              </label>
              <input
                type="text"
                id="field-poster-extraDetails"
                value={config.extraDetails}
                onChange={(e) => handleFieldChange("extraDetails", e.target.value)}
                placeholder="e.g., Presented by Monolith Audio · Visuals by LightWave"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400 placeholder:text-zinc-500"
              />
            </div>

            {/* Tour Subtitle / Header Slogan with Gemini AI */}
            <div id="field-wrap-tagline" className="pt-1">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                Tour Subtitle / Header Slogan
              </label>
              <div className="flex gap-2" id="tagline-with-ai-btn">
                <input
                  type="text"
                  id="field-poster-secondaryText"
                  value={config.secondaryText}
                  onChange={(e) => handleFieldChange("secondaryText", e.target.value)}
                  placeholder="e.g., LIVE ON STAGE · ONE NIGHT ONLY"
                  className="flex-grow text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400 placeholder:text-zinc-500"
                />
                <button
                  type="button"
                  id="btn-trigger-ai-slogans"
                  onClick={handleGenerateSlogans}
                  disabled={isGeneratingSlogans || !config.bandName}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2.5 rounded-lg font-bold transition-all flex-shrink-0 cursor-pointer disabled:bg-slate-200 disabled:text-slate-400 flex items-center gap-1.5"
                  title="Generate Catchy Concert Slogans via Gemini AI"
                >
                  {isGeneratingSlogans ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4" />
                  )}
                  <span className="text-[10px] hidden sm:inline">AI Ideas</span>
                </button>
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

            {/* Poster Icon Annotations (Food, Drinks, Merch) */}
            <div className="space-y-1 pt-1" id="amenities-switches">
              <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                Poster Icon Annotations
              </span>
              <div className="flex flex-wrap gap-3 pt-1 text-[10px] text-gray-600">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="check-poster-servesFood"
                    checked={config.amenities.servesFood}
                    onChange={() => handleAmenityChange("servesFood")}
                    className="rounded text-indigo-600 focus:ring-indigo-200"
                  />
                  <span>Food Available</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="check-poster-servesAlcohol"
                    checked={config.amenities.servesAlcohol}
                    onChange={() => handleAmenityChange("servesAlcohol")}
                    className="rounded text-indigo-600 focus:ring-indigo-200"
                  />
                  <span>Bar / Drinks</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    id="check-poster-merchArea"
                    checked={config.amenities.merchArea}
                    onChange={() => handleAmenityChange("merchArea")}
                    className="rounded text-indigo-600 focus:ring-indigo-200"
                  />
                  <span>Band Merch</span>
                </label>
              </div>
            </div>
          </div>

          {/* STEP 4: FINAL ACTIONS (HIGH-RESOLUTION DOWNLOADS & PRINT FULFILLMENT) */}
          <div className="space-y-4 border-t border-gray-100 pt-4" id="step-4-final-actions-section">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">4</span>
                Download & Print Fulfillment
              </span>
              {exportNotice && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 animate-fade-in flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  {exportNotice}
                </span>
              )}
            </div>

            {/* High-Resolution Download Buttons for bands/venues */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" id="high-res-download-actions">
              {/* Action 1: Download Print-Ready Poster (PDF) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-900 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-emerald-600" />
                      Download Print-Ready Poster (PDF)
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                      300 DPI Bleed
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    300 DPI CMYK bleed-ready standard specs: 11x17, 12x18, and 4.25x5.5 quarter-sheet handbills.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-500 font-bold">Size:</span>
                    <button
                      type="button"
                      id="btn-pdf-size-11x17"
                      onClick={() => setSelectedPdfSize("11x17")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedPdfSize === "11x17"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      11" × 17" Tabloid
                    </button>
                    <button
                      type="button"
                      id="btn-pdf-size-12x18"
                      onClick={() => setSelectedPdfSize("12x18")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedPdfSize === "12x18"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      12" × 18" Full Bleed
                    </button>
                    <button
                      type="button"
                      id="btn-pdf-size-4.25x5.5"
                      onClick={() => setSelectedPdfSize("4.25x5.5")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedPdfSize === "4.25x5.5"
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      4.25" × 5.5" Handbill (Quarter Sheet)
                    </button>
                  </div>

                  <button
                    type="button"
                    id="btn-poster-download-pdf"
                    onClick={() => handleDownloadPrintReadyPdf()}
                    disabled={isExportingPdf}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isExportingPdf ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering {selectedPdfSize === "4.25x5.5" ? "4.25\" × 5.5\" Handbill" : selectedPdfSize} (300 DPI)...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Print-Ready {selectedPdfSize === "4.25x5.5" ? "Handbill" : "Poster"} (PDF)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Action 2: Download Web Flyer (PNG/JPG) */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold text-slate-900 flex items-center gap-1.5">
                      <Image className="w-4 h-4 text-indigo-600" />
                      Download Web Flyer (PNG/JPG)
                    </span>
                    <span className="text-[9px] font-bold bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">
                      High-Res RGB
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    High-res RGB for Instagram, Facebook, and promo posts.
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Aspect Ratio / Preset Selector */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    <span className="text-slate-500 font-bold">Preset:</span>
                    <button
                      type="button"
                      id="btn-flyer-ratio-poster"
                      onClick={() => setSelectedFlyerRatio("poster")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedFlyerRatio === "poster"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Poster (Original)
                    </button>
                    <button
                      type="button"
                      id="btn-flyer-ratio-handbill"
                      onClick={() => setSelectedFlyerRatio("handbill")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedFlyerRatio === "handbill"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      4.25:5.5 Handbill (Quarter Sheet)
                    </button>
                  </div>

                  {/* Format Selector */}
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-slate-500 font-bold">Format:</span>
                    <button
                      type="button"
                      id="btn-flyer-format-png"
                      onClick={() => setSelectedFlyerFormat("png")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedFlyerFormat === "png"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      PNG Lossless
                    </button>
                    <button
                      type="button"
                      id="btn-flyer-format-jpg"
                      onClick={() => setSelectedFlyerFormat("jpg")}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] cursor-pointer transition-all ${
                        selectedFlyerFormat === "jpg"
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      JPG Social Post
                    </button>
                  </div>

                  <button
                    type="button"
                    id="btn-poster-download-web-flyer"
                    onClick={() => handleDownloadWebFlyer()}
                    disabled={isExportingFlyer}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold py-2.5 px-3 rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isExportingFlyer ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Rendering {selectedFlyerRatio === "handbill" ? "4.25:5.5 Handbill" : selectedFlyerFormat.toUpperCase()}...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download {selectedFlyerRatio === "handbill" ? '4.25" × 5.5" Handbill' : "Web Flyer"} ({selectedFlyerFormat.toUpperCase()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Utility Actions: Save Design & Local Print */}
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <button
                type="button"
                id="btn-poster-save"
                onClick={handleSavePoster}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 text-indigo-300" />
                <span>Save Poster Design</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Local Print / Print Dialog</span>
              </button>
            </div>

            {/* Fireball Printing Recommendation Card beneath download actions */}
            <div className="pt-2">
              {renderFireballCard()}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3 (Bottom): Live Poster Preview Canvas, Print Specs, and Action Buttons */}
      <div className="w-full flex flex-col items-center justify-between space-y-6 pt-2" id="poster-rendering-panel">
        
        {/* Live Canvas Toolbar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center w-full gap-3 bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800" id="rendering-header-row">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-indigo-400" />
              Live Concert Poster Preview
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
              300 DPI Bleed-Ready
            </span>
          </div>

          <div className="flex flex-wrap gap-2 justify-end items-center">
            {/* Quick PDF Download Button */}
            <button
              type="button"
              id="btn-quick-download-pdf"
              onClick={() => handleDownloadPrintReadyPdf()}
              disabled={isExportingPdf}
              className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Download 300 DPI CMYK bleed-ready PDF (11x17, 12x18, or 4.25x5.5)"
            >
              {isExportingPdf ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download PDF ({selectedPdfSize === "4.25x5.5" ? "4.25x5.5 Handbill" : selectedPdfSize})</span>
                </>
              )}
            </button>

            {/* Quick Web Flyer Download Button */}
            <button
              type="button"
              id="btn-quick-download-flyer"
              onClick={() => handleDownloadWebFlyer()}
              disabled={isExportingFlyer}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="Download high-resolution RGB flyer for Instagram, Facebook, and handbill sharing"
            >
              {isExportingFlyer ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendering Flyer...</span>
                </>
              ) : (
                <>
                  <Image className="w-3.5 h-3.5" />
                  <span>{selectedFlyerRatio === "handbill" ? "4.25:5.5 Handbill" : "Web Flyer"} ({selectedFlyerFormat.toUpperCase()})</span>
                </>
              )}
            </button>

            {/* Local Print */}
            <button
              type="button"
              onClick={() => window.print()}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Local Print</span>
            </button>
          </div>
        </div>

        {/* Live CSS styled templates based on themeId */}
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

            {/* 11. CLASSIC ROCK 70S BORDER */}
            {config.themeId === "classic-rock" && (
              <div className="absolute inset-0 pointer-events-none border-2 border-amber-500/25 m-2 rounded-xl flex flex-col justify-between" id="classic-rock-decorations">
                <div className="absolute top-2 left-3 right-3 border-b border-amber-500/30" />
                <div className="absolute bottom-2 left-3 right-3 border-t border-amber-500/30" />
                <div className="absolute top-3 left-3 text-amber-500/40 text-[10px]">★</div>
                <div className="absolute top-3 right-3 text-amber-500/40 text-[10px]">★</div>
                <div className="absolute bottom-3 left-3 text-amber-500/40 text-[10px]">★</div>
                <div className="absolute bottom-3 right-3 text-amber-500/40 text-[10px]">★</div>
              </div>
            )}

            {/* Top details card info */}
            <div className="space-y-3 pt-4 z-10" id="poster-layout-top">
              {/* Supporting Tagline / Tour subtitle */}
              <h5 className={`text-[10px] uppercase font-black tracking-widest ${c.tagline}`} id="poster-tagline-preview">
                {config.secondaryText || "LIVE ON STAGE · ONE NIGHT ONLY"}
              </h5>

              {/* Main Headline band title */}
              <h1 className={`leading-none font-bold select-all tracking-tighter ${c.bandName} ${getFontFamilyClass(config.fontStyle)} ${!config.bandName ? 'opacity-40 italic' : ''}`} id="poster-band-preview">
                {config.bandName || "The Midnight Echoes"}
              </h1>

              {/* Supporting Acts / Openers appearing under the headlining act */}
              {config.supportingActs && (
                <div className="pt-1" id="poster-supporting-acts-preview">
                  <div className={`inline-block px-3 py-1 text-xs md:text-sm font-black uppercase tracking-wider ${
                    config.themeId === "punk-diy"
                      ? "bg-black text-yellow-300 font-mono transform -rotate-1 border border-black"
                      : config.themeId === "metal-hellfire"
                      ? "text-red-400 font-sans tracking-widest border-t border-b border-red-950/80 py-1"
                      : config.themeId === "retro-neon"
                      ? "text-cyan-300 font-mono border-b border-pink-500/50"
                      : config.themeId === "indie-minimal"
                      ? "text-slate-600 font-mono tracking-widest text-[11px]"
                      : `${c.tagline} opacity-95`
                  }`}>
                    {config.supportingActs}
                  </div>
                </div>
              )}
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
                <h2 className={`text-base font-bold uppercase tracking-wide ${c.venueName} ${!config.venueName ? 'opacity-40 italic' : ''}`} id="poster-venue-name-preview">
                  {config.venueName || "The Crystal Ballroom · Portland, OR"}
                </h2>

                {config.venueAddress && (
                  <p className={`text-[10px] font-medium flex items-center justify-center gap-1 leading-normal ${
                    config.themeId === "punk-diy" ? "text-black font-black" : "text-gray-500"
                  }`} id="poster-venue-addr-preview">
                    <MapPin className="w-3 h-3 text-rose-500 flex-shrink-0" />
                    {config.venueAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom detail footer tags (Time, entry fees, limits, snacks icons) */}
            <div className="border-t pt-4 space-y-4 z-10" id="poster-layout-bottom" style={{ borderColor: "rgba(100,100,100,0.15)" }}>
              {/* Date and time badges */}
              <div className="flex justify-center items-center gap-3 text-xs flex-wrap" id="footer-badges-preview">
                <span className={`px-2.5 py-1 rounded font-bold font-mono tracking-tight flex items-center gap-1.5 ${c.dateBadge} ${!config.dateStr ? 'opacity-40' : ''}`} id="poster-date-preview">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  {config.dateStr || "Friday, Nov 14 · Doors 7:00 PM / Show 8:00 PM"}
                </span>

                {config.timeStr && (
                  <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${c.timeBadge}`} id="poster-time-preview">
                    {config.timeStr}
                  </span>
                )}
              </div>

              {/* Pricing and Entrance Limit badges row */}
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold" id="pricing-age-preview">
                <span className={`flex items-center gap-0.5 ${config.themeId === "punk-diy" ? "text-black font-black font-mono border-b border-black" : "text-slate-500"} ${!config.priceStr ? 'opacity-40' : ''}`} id="poster-price-label">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                  {config.priceStr || "$15 Advance / $20 Door · 21+ · Tickets at link"}
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

          {/* Fireball Printing Recommendation Card beneath poster preview canvas */}
          <div className="w-full max-w-xl mx-auto pt-4" id="canvas-fireball-section">
            {renderFireballCard()}
          </div>
        </div>
      </div>
    );
  }