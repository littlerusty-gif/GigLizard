import React, { useState, useEffect } from "react";
import { PosterConfig, SloganProposal, UserAccount } from "../types";
import { 
  Sparkles, Image, RefreshCw, Layers, CheckSquare, Wine, UtensilsCrossed, 
  Calendar, DollarSign, MapPin, Eye, Wand2, Check, Download, Printer, 
  ArrowLeft, Users, Save, Type, Palette, FileText, ExternalLink, Flame, CheckCircle2, AlertCircle
} from "lucide-react";
import html2canvas from "html2canvas-pro";
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

// Standard Safe HEX Fallback Palettes:
// Backgrounds: '#0a0a0a', '#18181b', '#27272a', '#ffffff'
// Accents: Emerald '#10b981', Amber '#f59e0b', Crimson '#ef4444', Cyan '#06b6d4', Violet '#8b5cf6'
// Typography: '#ffffff', '#e4e4e7', '#a1a1aa', '#111827'

export interface ThemeStylesResult {
  frameStyle: React.CSSProperties;
  taglineStyle: React.CSSProperties;
  bandNameStyle: React.CSSProperties;
  venueNameStyle: React.CSSProperties;
  dateBadgeStyle: React.CSSProperties;
  timeBadgeStyle: React.CSSProperties;
  graphicStyle: React.CSSProperties;
  sloganStyle: React.CSSProperties;
  supportingActsStyle: React.CSSProperties;

  frameClasses: string;
  taglineClasses: string;
  bandNameClasses: string;
  venueNameClasses: string;
  dateBadgeClasses: string;
  timeBadgeClasses: string;
  graphicClasses: string;
  sloganClasses: string;
  supportingActsClasses: string;

  // Legacy string properties for seamless compatibility
  frame: string;
  tagline: string;
  bandName: string;
  venueName: string;
  dateBadge: string;
  timeBadge: string;
  graphicColor: string;
  sloganColor: string;
}

const buildThemeStyle = (
  palette: {
    bg: string;
    border: string;
    text: string;
    accent: string;
    sub: string;
    badgeBg: string;
    badgeBorder?: string;
    badgeText?: string;
  },
  classes: {
    frameClasses?: string;
    taglineClasses?: string;
    bandNameClasses?: string;
    venueNameClasses?: string;
    dateBadgeClasses?: string;
    timeBadgeClasses?: string;
    supportingActsClasses?: string;
  } = {}
): ThemeStylesResult => {
  const frameClasses = classes.frameClasses || "font-sans tracking-tight";
  const taglineClasses = classes.taglineClasses || "tracking-widest";
  const bandNameClasses = classes.bandNameClasses || "text-4xl uppercase font-black";
  const venueNameClasses = classes.venueNameClasses || "font-sans uppercase font-bold tracking-wide";
  const dateBadgeClasses = classes.dateBadgeClasses || "font-bold font-mono";
  const timeBadgeClasses = classes.timeBadgeClasses || "font-semibold";
  const supportingActsClasses = classes.supportingActsClasses || "font-mono font-bold";

  return {
    frameStyle: {
      backgroundColor: palette.bg,
      borderColor: palette.border,
      color: palette.text
    },
    taglineStyle: {
      color: palette.accent
    },
    bandNameStyle: {
      color: palette.text
    },
    venueNameStyle: {
      color: palette.sub
    },
    dateBadgeStyle: {
      backgroundColor: palette.badgeBg,
      borderColor: palette.badgeBorder || palette.border,
      color: palette.badgeText || palette.text
    },
    timeBadgeStyle: {
      backgroundColor: palette.badgeBg,
      borderColor: palette.badgeBorder || palette.border,
      color: palette.sub
    },
    graphicStyle: {
      color: palette.accent
    },
    sloganStyle: {
      color: palette.accent
    },
    supportingActsStyle: {
      backgroundColor: palette.badgeBg,
      borderColor: palette.border,
      color: palette.accent
    },

    frameClasses,
    taglineClasses,
    bandNameClasses,
    venueNameClasses,
    dateBadgeClasses,
    timeBadgeClasses,
    graphicClasses: "",
    sloganClasses: "",
    supportingActsClasses,

    // Legacy fallbacks
    frame: frameClasses,
    tagline: taglineClasses,
    bandName: bandNameClasses,
    venueName: venueNameClasses,
    dateBadge: dateBadgeClasses,
    timeBadge: timeBadgeClasses,
    graphicColor: "",
    sloganColor: ""
  };
};

// Maps theme presets and dynamic color swatch selections into strictly web-safe HEX and sRGB elements
const getThemeClasses = (themeId: string, colorId: string = "default"): ThemeStylesResult => {
  switch (themeId) {
    case "heavy-grunge": {
      const map: Record<string, any> = {
        default: { bg: "#1a0505", border: "#7f1d1d", text: "#fee2e2", accent: "#f97316", sub: "#fca5a5", badgeBg: "#2d0a0a" },
        red:     { bg: "#1a0505", border: "#7f1d1d", text: "#fee2e2", accent: "#ef4444", sub: "#fca5a5", badgeBg: "#2d0a0a" },
        blue:    { bg: "#030f24", border: "#0369a1", text: "#e0f2fe", accent: "#38bdf8", sub: "#7dd3fc", badgeBg: "#072147" },
        green:   { bg: "#021a0d", border: "#047857", text: "#d1fae5", accent: "#10b981", sub: "#6ee7b7", badgeBg: "#04361c" },
        purple:  { bg: "#180824", border: "#6b21a8", text: "#f3e8ff", accent: "#a855f7", sub: "#d8b4fe", badgeBg: "#2c0f42" },
        amber:   { bg: "#1c1103", border: "#b45309", text: "#fef3c7", accent: "#f59e0b", sub: "#fcd34d", badgeBg: "#382206" },
        pink:    { bg: "#210414", border: "#be185d", text: "#fce7f3", accent: "#ec4899", sub: "#f472b6", badgeBg: "#420928" },
        black:   { bg: "#0a0a0a", border: "#27272a", text: "#ffffff", accent: "#a1a1aa", sub: "#e4e4e7", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-sans tracking-tighter border-2",
        taglineClasses: "uppercase font-bold tracking-widest",
        bandNameClasses: "text-4xl uppercase font-black tracking-tight",
        venueNameClasses: "font-sans uppercase font-bold tracking-wide",
        dateBadgeClasses: "font-mono font-bold border",
        timeBadgeClasses: "border"
      });
    }

    case "classic-rock": {
      const map: Record<string, any> = {
        default: { bg: "#14100c", border: "#d97706", text: "#fef3c7", accent: "#f59e0b", sub: "#fde68a", badgeBg: "#291807" },
        red:     { bg: "#1a0a0a", border: "#b91c1c", text: "#fee2e2", accent: "#ef4444", sub: "#fca5a5", badgeBg: "#2d0f0f" },
        blue:    { bg: "#0a121a", border: "#0369a1", text: "#e0f2fe", accent: "#0ea5e9", sub: "#7dd3fc", badgeBg: "#0f1f2d" },
        green:   { bg: "#0a180e", border: "#047857", text: "#d1fae5", accent: "#10b981", sub: "#6ee7b7", badgeBg: "#0e2a18" },
        purple:  { bg: "#160a1f", border: "#6b21a8", text: "#f3e8ff", accent: "#a855f7", sub: "#d8b4fe", badgeBg: "#271237" },
        amber:   { bg: "#1c1208", border: "#d97706", text: "#fef3c7", accent: "#f59e0b", sub: "#fde68a", badgeBg: "#331e0b" },
        pink:    { bg: "#1f0a17", border: "#be185d", text: "#fce7f3", accent: "#ec4899", sub: "#f472b6", badgeBg: "#381229" },
        black:   { bg: "#0d0d0d", border: "#3f3f46", text: "#f4f4f5", accent: "#a1a1aa", sub: "#e4e4e7", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-serif border-4 shadow-2xl tracking-normal",
        taglineClasses: "font-sans uppercase font-bold tracking-widest",
        bandNameClasses: "text-4xl uppercase font-black tracking-tight",
        venueNameClasses: "font-serif uppercase tracking-widest font-bold",
        dateBadgeClasses: "font-serif font-bold border",
        timeBadgeClasses: "border"
      });
    }

    case "retro-neon": {
      const map: Record<string, any> = {
        default: { bg: "#090414", border: "#ec4899", text: "#ffffff", accent: "#38bdf8", sub: "#f43f5e", badgeBg: "#15072e" },
        red:     { bg: "#0d0408", border: "#ef4444", text: "#ffffff", accent: "#f97316", sub: "#ef4444", badgeBg: "#210812" },
        blue:    { bg: "#030c1c", border: "#06b6d4", text: "#ffffff", accent: "#38bdf8", sub: "#06b6d4", badgeBg: "#071936" },
        green:   { bg: "#02140d", border: "#10b981", text: "#ffffff", accent: "#34d399", sub: "#10b981", badgeBg: "#052618" },
        purple:  { bg: "#180824", border: "#a855f7", text: "#ffffff", accent: "#e879f9", sub: "#c084fc", badgeBg: "#280e3d" },
        amber:   { bg: "#140c03", border: "#f59e0b", text: "#ffffff", accent: "#fde047", sub: "#f59e0b", badgeBg: "#2a1705" },
        pink:    { bg: "#170312", border: "#ec4899", text: "#ffffff", accent: "#f472b6", sub: "#ec4899", badgeBg: "#300726" },
        black:   { bg: "#09090b", border: "#71717a", text: "#ffffff", accent: "#d4d4d8", sub: "#a1a1aa", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-mono border-2",
        taglineClasses: "animate-pulse tracking-widest font-bold",
        bandNameClasses: "text-4xl font-black tracking-tight",
        venueNameClasses: "font-extrabold tracking-wide uppercase",
        dateBadgeClasses: "border font-mono",
        timeBadgeClasses: "border font-mono"
      });
    }

    case "indie-minimal": {
      const map: Record<string, any> = {
        default: { bg: "#ffffff", border: "#e4e4e7", text: "#111827", accent: "#10b981", sub: "#71717a", badgeBg: "#f4f4f5" },
        red:     { bg: "#fef2f2", border: "#fecaca", text: "#7f1d1d", accent: "#b91c1c", sub: "#991b1b", badgeBg: "#fee2e2" },
        blue:    { bg: "#f0f9ff", border: "#bae6fd", text: "#0c4a6e", accent: "#0284c7", sub: "#0369a1", badgeBg: "#e0f2fe" },
        green:   { bg: "#f0fdf4", border: "#bbf7d0", text: "#064e3b", accent: "#059669", sub: "#047857", badgeBg: "#dcfce7" },
        purple:  { bg: "#faf5ff", border: "#e9d5ff", text: "#581c87", accent: "#7c3aed", sub: "#6b21a8", badgeBg: "#f3e8ff" },
        amber:   { bg: "#fffbeb", border: "#fde68a", text: "#78350f", accent: "#d97706", sub: "#b45309", badgeBg: "#fef3c7" },
        pink:    { bg: "#fdf2f8", border: "#fbcfe8", text: "#831843", accent: "#db2777", sub: "#be185d", badgeBg: "#fce7f3" },
        black:   { bg: "#fafafa", border: "#e4e4e7", text: "#18181b", accent: "#3f3f46", sub: "#52525b", badgeBg: "#f4f4f5" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "border-2",
        taglineClasses: "font-mono text-xs uppercase",
        bandNameClasses: "font-bold text-4xl",
        venueNameClasses: "font-semibold tracking-wide",
        dateBadgeClasses: "rounded font-mono",
        timeBadgeClasses: "rounded-full font-mono"
      });
    }

    case "folk-acoustic": {
      const map: Record<string, any> = {
        default: { bg: "#fdfaf2", border: "#78350f", text: "#451a03", accent: "#92400e", sub: "#78350f", badgeBg: "#fef3c7" },
        red:     { bg: "#fff5f5", border: "#991b1b", text: "#450a0a", accent: "#b91c1c", sub: "#991b1b", badgeBg: "#fee2e2" },
        blue:    { bg: "#f0f9ff", border: "#075985", text: "#082f49", accent: "#0369a1", sub: "#0284c7", badgeBg: "#e0f2fe" },
        green:   { bg: "#f0fdf4", border: "#065f46", text: "#022c22", accent: "#047857", sub: "#059669", badgeBg: "#dcfce7" },
        purple:  { bg: "#faf5ff", border: "#6b21a8", text: "#3b0764", accent: "#7e22ce", sub: "#6b21a8", badgeBg: "#f3e8ff" },
        amber:   { bg: "#fffaf0", border: "#92400e", text: "#451a03", accent: "#b45309", sub: "#78350f", badgeBg: "#fef3c7" },
        pink:    { bg: "#fff5f7", border: "#9d174d", text: "#500724", accent: "#be185d", sub: "#831843", badgeBg: "#fce7f3" },
        black:   { bg: "#f4f4f5", border: "#27272a", text: "#09090b", accent: "#3f3f46", sub: "#52525b", badgeBg: "#e4e4e7" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-serif border-4 border-double",
        taglineClasses: "font-semibold italic",
        bandNameClasses: "font-serif font-bold text-4xl",
        venueNameClasses: "font-serif font-bold block",
        dateBadgeClasses: "border font-serif",
        timeBadgeClasses: "rounded font-serif"
      });
    }

    case "psychedelic-acid": {
      const map: Record<string, any> = {
        default: { bg: "#180824", border: "#86198f", text: "#ca8a04", accent: "#facc15", sub: "#c084fc", badgeBg: "#2c0f42" },
        red:     { bg: "#250808", border: "#991b1b", text: "#ef4444", accent: "#f87171", sub: "#fca5a5", badgeBg: "#381010" },
        blue:    { bg: "#02182c", border: "#0369a1", text: "#38bdf8", accent: "#06b6d4", sub: "#7dd3fc", badgeBg: "#05284a" },
        green:   { bg: "#042416", border: "#047857", text: "#34d399", accent: "#10b981", sub: "#6ee7b7", badgeBg: "#093823" },
        purple:  { bg: "#180824", border: "#7e22ce", text: "#e879f9", accent: "#c084fc", sub: "#f0abfc", badgeBg: "#2c0f42" },
        amber:   { bg: "#221002", border: "#b45309", text: "#fbbf24", accent: "#f59e0b", sub: "#fde047", badgeBg: "#3b1c04" },
        pink:    { bg: "#250012", border: "#be185d", text: "#f472b6", accent: "#ec4899", sub: "#fbcfe8", badgeBg: "#420422" },
        black:   { bg: "#0a0a0a", border: "#3f3f46", text: "#e4e4e7", accent: "#a1a1aa", sub: "#d4d4d8", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-serif border-2",
        taglineClasses: "italic font-black",
        bandNameClasses: "font-black text-4xl tracking-tight",
        venueNameClasses: "font-sans font-bold",
        dateBadgeClasses: "border",
        timeBadgeClasses: "border"
      });
    }

    case "metal-hellfire": {
      const map: Record<string, any> = {
        default: { bg: "#090504", border: "#7f1d1d", text: "#ffffff", accent: "#ef4444", sub: "#f87171", badgeBg: "#1f0a0a" },
        red:     { bg: "#090504", border: "#7f1d1d", text: "#ffffff", accent: "#ef4444", sub: "#f87171", badgeBg: "#1f0a0a" },
        blue:    { bg: "#030914", border: "#0c4a6e", text: "#ffffff", accent: "#0284c7", sub: "#38bdf8", badgeBg: "#061a33" },
        green:   { bg: "#021208", border: "#064e3b", text: "#ffffff", accent: "#059669", sub: "#34d399", badgeBg: "#042610" },
        purple:  { bg: "#0d0317", border: "#581c87", text: "#ffffff", accent: "#7e22ce", sub: "#c084fc", badgeBg: "#1e0833" },
        amber:   { bg: "#120902", border: "#78350f", text: "#ffffff", accent: "#d97706", sub: "#fbbf24", badgeBg: "#291506" },
        pink:    { bg: "#14020d", border: "#831843", text: "#ffffff", accent: "#db2777", sub: "#f472b6", badgeBg: "#2d061f" },
        black:   { bg: "#050505", border: "#27272a", text: "#ffffff", accent: "#71717a", sub: "#a1a1aa", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-sans tracking-widest uppercase border-2",
        taglineClasses: "tracking-widest font-bold",
        bandNameClasses: "font-black text-4xl",
        venueNameClasses: "font-sans tracking-wide font-black",
        dateBadgeClasses: "border",
        timeBadgeClasses: "border"
      });
    }

    case "pop-bubblegum": {
      const map: Record<string, any> = {
        default: { bg: "#fdf2f8", border: "#f472b6", text: "#db2777", accent: "#ec4899", sub: "#f472b6", badgeBg: "#fbcfe8" },
        red:     { bg: "#fef2f2", border: "#fca5a5", text: "#b91c1c", accent: "#ef4444", sub: "#f87171", badgeBg: "#fee2e2" },
        blue:    { bg: "#f0f9ff", border: "#7dd3fc", text: "#0369a1", accent: "#0284c7", sub: "#38bdf8", badgeBg: "#e0f2fe" },
        green:   { bg: "#f0fdf4", border: "#86efac", text: "#047857", accent: "#10b981", sub: "#34d399", badgeBg: "#dcfce7" },
        purple:  { bg: "#faf5ff", border: "#d8b4fe", text: "#6b21a8", accent: "#8b5cf6", sub: "#c084fc", badgeBg: "#f3e8ff" },
        amber:   { bg: "#fffbeb", border: "#fcd34d", text: "#b45309", accent: "#f59e0b", sub: "#fbbf24", badgeBg: "#fef3c7" },
        pink:    { bg: "#fdf2f8", border: "#f472b6", text: "#db2777", accent: "#ec4899", sub: "#f472b6", badgeBg: "#fbcfe8" },
        black:   { bg: "#fafafa", border: "#d4d4d8", text: "#18181b", accent: "#3f3f46", sub: "#71717a", badgeBg: "#f4f4f5" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-sans border-2 border-dashed",
        taglineClasses: "font-bold",
        bandNameClasses: "font-black text-4xl",
        venueNameClasses: "font-extrabold uppercase",
        dateBadgeClasses: "rounded",
        timeBadgeClasses: "rounded-full"
      });
    }

    case "jazz-vanguard": {
      const map: Record<string, any> = {
        default: { bg: "#020617", border: "#78350f", text: "#fef3c7", accent: "#f59e0b", sub: "#fbbf24", badgeBg: "#1c1208" },
        red:     { bg: "#0b0202", border: "#7f1d1d", text: "#fee2e2", accent: "#ef4444", sub: "#f87171", badgeBg: "#1e0808" },
        blue:    { bg: "#010b14", border: "#0c4a6e", text: "#e0f2fe", accent: "#0284c7", sub: "#38bdf8", badgeBg: "#061b2e" },
        green:   { bg: "#020c08", border: "#064e3b", text: "#d1fae5", accent: "#10b981", sub: "#34d399", badgeBg: "#041f12" },
        purple:  { bg: "#0a020f", border: "#581c87", text: "#f3e8ff", accent: "#a855f7", sub: "#c084fc", badgeBg: "#1a0526" },
        amber:   { bg: "#0e0701", border: "#78350f", text: "#fef3c7", accent: "#f59e0b", sub: "#fbbf24", badgeBg: "#241103" },
        pink:    { bg: "#0e0108", border: "#831843", text: "#fce7f3", accent: "#ec4899", sub: "#f472b6", badgeBg: "#240416" },
        black:   { bg: "#030303", border: "#27272a", text: "#f4f4f5", accent: "#a1a1aa", sub: "#d4d4d8", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-serif border",
        taglineClasses: "tracking-widest italic",
        bandNameClasses: "font-serif font-black text-4xl",
        venueNameClasses: "tracking-widest font-serif font-black",
        dateBadgeClasses: "border font-serif",
        timeBadgeClasses: "border font-serif"
      });
    }

    case "dubstep-laser": {
      const map: Record<string, any> = {
        default: { bg: "#000000", border: "#10b981", text: "#10b981", accent: "#34d399", sub: "#10b981", badgeBg: "#052618" },
        red:     { bg: "#000000", border: "#ef4444", text: "#ef4444", accent: "#f87171", sub: "#ef4444", badgeBg: "#2d0a0a" },
        blue:    { bg: "#000000", border: "#06b6d4", text: "#06b6d4", accent: "#38bdf8", sub: "#06b6d4", badgeBg: "#072147" },
        green:   { bg: "#000000", border: "#10b981", text: "#10b981", accent: "#34d399", sub: "#10b981", badgeBg: "#052618" },
        purple:  { bg: "#000000", border: "#a855f7", text: "#a855f7", accent: "#c084fc", sub: "#a855f7", badgeBg: "#280e3d" },
        amber:   { bg: "#000000", border: "#f59e0b", text: "#f59e0b", accent: "#fbbf24", sub: "#f59e0b", badgeBg: "#2a1705" },
        pink:    { bg: "#000000", border: "#ec4899", text: "#ec4899", accent: "#f472b6", sub: "#ec4899", badgeBg: "#300726" },
        black:   { bg: "#000000", border: "#52525b", text: "#d4d4d8", accent: "#a1a1aa", sub: "#71717a", badgeBg: "#18181b" }
      };
      const p = map[colorId] || map.default;
      return buildThemeStyle(p, {
        frameClasses: "font-mono border-2",
        taglineClasses: "tracking-widest font-mono font-bold",
        bandNameClasses: "font-mono font-bold text-4xl",
        venueNameClasses: "font-mono font-bold tracking-wider",
        dateBadgeClasses: "border font-mono",
        timeBadgeClasses: "border font-mono"
      });
    }

    case "punk-diy": {
      const map: Record<string, any> = {
        default: { bg: "#ffffff", border: "#000000", text: "#000000", accent: "#facc15", sub: "#000000", badgeBg: "#facc15" },
        red:     { bg: "#fee2e2", border: "#000000", text: "#000000", accent: "#ef4444", sub: "#000000", badgeBg: "#f87171" },
        blue:    { bg: "#e0f2fe", border: "#000000", text: "#000000", accent: "#0284c7", sub: "#000000", badgeBg: "#38bdf8" },
        green:   { bg: "#dcfce7", border: "#000000", text: "#000000", accent: "#10b981", sub: "#000000", badgeBg: "#34d399" },
        purple:  { bg: "#f3e8ff", border: "#000000", text: "#000000", accent: "#7e22ce", sub: "#000000", badgeBg: "#c084fc" },
        amber:   { bg: "#fef3c7", border: "#000000", text: "#000000", accent: "#f59e0b", sub: "#000000", badgeBg: "#fbbf24" },
        pink:    { bg: "#fce7f3", border: "#000000", text: "#000000", accent: "#db2777", sub: "#000000", badgeBg: "#f472b6" },
        black:   { bg: "#e4e4e7", border: "#000000", text: "#000000", accent: "#18181b", sub: "#000000", badgeBg: "#ffffff" }
      };
      const p = map[colorId] || map.default;
      return {
        frameStyle: { backgroundColor: p.bg, borderColor: "#000000", color: "#000000" },
        taglineStyle: { backgroundColor: p.accent, color: "#000000" },
        bandNameStyle: { backgroundColor: "#000000", color: "#ffffff" },
        venueNameStyle: { backgroundColor: "#ffffff", color: "#000000", borderColor: "#000000" },
        dateBadgeStyle: { backgroundColor: p.badgeBg, borderColor: "#000000", color: "#000000" },
        timeBadgeStyle: { backgroundColor: "#000000", color: "#ffffff" },
        graphicStyle: { color: "#000000" },
        sloganStyle: { color: "#000000" },
        supportingActsStyle: { backgroundColor: "#000000", color: p.accent, borderColor: "#000000" },

        frameClasses: "font-mono border-4",
        taglineClasses: "font-black p-0.5 tracking-tighter uppercase self-center w-fit mx-auto",
        bandNameClasses: "px-1 font-black text-4xl",
        venueNameClasses: "border-2 inline-block px-2 py-0.5 font-bold uppercase transform rotate-1",
        dateBadgeClasses: "border-2 font-black",
        timeBadgeClasses: "px-2 py-0.5 rounded-none font-black",
        graphicClasses: "",
        sloganClasses: "",
        supportingActsClasses: "font-mono font-black transform -rotate-1 border-2 border-black",

        frame: "font-mono border-4",
        tagline: "font-black p-0.5 tracking-tighter uppercase self-center w-fit mx-auto",
        bandName: "px-1 font-black text-4xl",
        venueName: "border-2 inline-block px-2 py-0.5 font-bold uppercase transform rotate-1",
        dateBadge: "border-2 font-black",
        timeBadge: "px-2 py-0.5 rounded-none font-black",
        graphicColor: "",
        sloganColor: ""
      };
    }

    default: {
      const defaultPalette = {
        bg: "#0a0a0a",
        border: "#27272a",
        text: "#ffffff",
        accent: "#10b981",
        sub: "#a1a1aa",
        badgeBg: "#18181b"
      };
      return buildThemeStyle(defaultPalette);
    }
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
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string; isError?: boolean } | null>(null);

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
      setSaveToast({ show: true, message: "✓ Concert poster design saved!", isError: false });
      setTimeout(() => setSaveToast(null), 3000);
    } catch (e: any) {
      console.error(e);
      setSaveToast({ show: true, message: `Save error: ${e?.message || e}`, isError: true });
    }
  };

  // Dedicated High-Resolution Export State (Single Consolidated Export Bar)
  const [selectedFormat, setSelectedFormat] = useState<"11x17" | "12x18" | "4.25x5.5" | "png">("11x17");
  const [isExporting, setIsExporting] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Helper to safely capture concert poster canvas with font safety, asset fallback, and strict try/catch/finally
  const captureConcertPosterCanvas = async (element: HTMLElement): Promise<HTMLCanvasElement> => {
    // Wait for fonts to finish loading with a short safety race so it never hangs
    try {
      if (document.fonts && document.fonts.ready) {
        await Promise.race([
          document.fonts.ready,
          new Promise((resolve) => setTimeout(resolve, 500))
        ]);
      }
    } catch (fontErr) {
      console.warn("Font readiness check warning:", fontErr);
    }

    // Temporarily strip any mix-blend-mode, backdrop-filter, or filter: drop-shadow() styles on the real DOM
    // These trigger iframe canvas security crashes or taint errors in sandboxed environments
    const sanitizedNodes: { el: HTMLElement; mixBlend: string; backdrop: string; filter: string }[] = [];
    try {
      const allDomElements = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[];
      allDomElements.forEach((el) => {
        if (!el || !el.style) return;
        const comp = window.getComputedStyle(el);
        const hasMix = comp.mixBlendMode && comp.mixBlendMode !== "normal";
        const hasBackdrop = (comp as any).backdropFilter && (comp as any).backdropFilter !== "none";
        const hasDropShadow = comp.filter && comp.filter.includes("drop-shadow");

        if (hasMix || hasBackdrop || hasDropShadow || el.style.mixBlendMode || (el.style as any).backdropFilter) {
          sanitizedNodes.push({
            el,
            mixBlend: el.style.mixBlendMode,
            backdrop: (el.style as any).backdropFilter || "",
            filter: el.style.filter
          });
          el.style.mixBlendMode = "normal";
          (el.style as any).backdropFilter = "none";
          (el.style as any).webkitBackdropFilter = "none";
          if (el.style.filter) {
            el.style.filter = el.style.filter.replace(/drop-shadow\([^)]*\)/gi, "").trim();
          }
        }
      });

      const html2canvasOptions = {
        useCORS: true,
        allowTaint: false,
        scale: 2, // crisp 300 DPI equivalent
        logging: false,
        foreignObjectRendering: false,
        backgroundColor: null,
        ignoreElements: (el: Element) => el.classList?.contains("no-export") || false,
        onclone: (clonedDoc: Document) => {
          const clonedPoster = (clonedDoc.getElementById("poster-canvas-preview") || clonedDoc.getElementById("concert-poster-frame")) as HTMLElement | null;
          if (!clonedPoster) return;

          // 1. Copy computed layout styles to cloned elements before removing stylesheets
          try {
            const srcEls = [element, ...Array.from(element.querySelectorAll("*"))] as HTMLElement[];
            const dstEls = [clonedPoster, ...Array.from(clonedPoster.querySelectorAll("*"))] as HTMLElement[];
            for (let i = 0; i < srcEls.length && i < dstEls.length; i++) {
              const src = srcEls[i];
              const dst = dstEls[i];
              if (src && dst) {
                const srcStyle = window.getComputedStyle(src);
                dst.style.display = srcStyle.display;
                dst.style.flexDirection = srcStyle.flexDirection;
                dst.style.justifyContent = srcStyle.justifyContent;
                dst.style.alignItems = srcStyle.alignItems;
                dst.style.flexWrap = srcStyle.flexWrap;
                dst.style.width = `${src.offsetWidth}px`;
                if (src.offsetHeight && !dst.style.height) {
                  dst.style.minHeight = `${src.offsetHeight}px`;
                }
                dst.style.padding = srcStyle.padding;
                dst.style.margin = srcStyle.margin;
                dst.style.textAlign = srcStyle.textAlign;
                dst.style.borderRadius = srcStyle.borderRadius;
                dst.style.fontSize = srcStyle.fontSize;
                dst.style.fontWeight = srcStyle.fontWeight;
                dst.style.fontFamily = srcStyle.fontFamily;
                dst.style.letterSpacing = srcStyle.letterSpacing;
                dst.style.lineHeight = srcStyle.lineHeight;
                dst.style.textTransform = srcStyle.textTransform;
                dst.style.position = srcStyle.position;
                dst.style.overflow = srcStyle.overflow;
                if (srcStyle.position === 'absolute') {
                  dst.style.top = srcStyle.top;
                  dst.style.left = srcStyle.left;
                  dst.style.right = srcStyle.right;
                  dst.style.bottom = srcStyle.bottom;
                }
              }
            }
          } catch (layoutErr) {
            console.warn("Layout copy notice:", layoutErr);
          }

          // 2. Strip all <style> blocks and stylesheet links from the cloned document to eliminate external oklch rules
          try {
            clonedDoc.querySelectorAll('style, link[rel="stylesheet"]').forEach((s) => s.remove());
          } catch (sheetErr) {
            console.warn("Style stripping notice:", sheetErr);
          }

          // 3. Pre-Rasterization Sanitizer: Recursively traverse the cloned poster node
          const convertToHexOrRgb = (el: HTMLElement) => {
            if (!el) return;
            try {
              const computed = window.getComputedStyle(el);
              // If backgroundColor or color contains 'oklch' or 'lab', override with standard HEX
              if (el.style) {
                if (!el.style.backgroundColor || el.style.backgroundColor.includes("oklch") || (computed && computed.backgroundColor && computed.backgroundColor.includes("oklch"))) {
                  el.style.backgroundColor = el.style.backgroundColor && !el.style.backgroundColor.includes("oklch") ? el.style.backgroundColor : "#121212";
                }
                if (!el.style.color || el.style.color.includes("oklch") || (computed && computed.color && computed.color.includes("oklch"))) {
                  el.style.color = el.style.color && !el.style.color.includes("oklch") ? el.style.color : "#ffffff";
                }
                if (!el.style.borderColor || el.style.borderColor.includes("oklch") || (computed && computed.borderColor && computed.borderColor.includes("oklch"))) {
                  el.style.borderColor = el.style.borderColor && !el.style.borderColor.includes("oklch") ? el.style.borderColor : "#27272a";
                }
                el.style.mixBlendMode = "normal";
                (el.style as any).backdropFilter = "none";
                (el.style as any).webkitBackdropFilter = "none";
                if (el.style.filter && el.style.filter.includes("drop-shadow")) {
                  el.style.filter = "none";
                }
              }
            } catch {
              // ignore
            }
            Array.from(el.children).forEach((child) => convertToHexOrRgb(child as HTMLElement));
          };

          convertToHexOrRgb(clonedPoster);

          // 4. Hide uncompleted images
          const imgs = clonedPoster.querySelectorAll("img");
          imgs.forEach((img) => {
            if (!img.complete || img.naturalWidth === 0) {
              img.classList.add("no-export");
              img.style.display = "none";
            }
          });
        }
      };

      try {
        return await html2canvas(element, html2canvasOptions);
      } catch (primaryErr) {
        console.warn("Primary html2canvas capture failed, attempting safe offscreen retry:", primaryErr);
        return await html2canvas(element, {
          ...html2canvasOptions,
          imageTimeout: 1500
        });
      }
    } finally {
      // Restore original styles on real DOM
      sanitizedNodes.forEach(({ el, mixBlend, backdrop, filter }) => {
        el.style.mixBlendMode = mixBlend;
        (el.style as any).backdropFilter = backdrop;
        (el.style as any).webkitBackdropFilter = backdrop;
        el.style.filter = filter;
      });
    }
  };

  // Primary Action Handler: Consolidated Download for Poster PDF & Web Flyer PNG
  const handleDownloadPosterOrFlyer = async () => {
    const element = document.getElementById("poster-canvas-preview") || document.getElementById("concert-poster-frame");
    if (!element) {
      setSaveToast({
        show: true,
        message: "Download failed: Poster canvas element (#poster-canvas-preview) not found",
        isError: true
      });
      return;
    }

    setIsExporting(true);
    setExportNotice(
      selectedFormat === "png"
        ? "Rendering Web Flyer PNG..."
        : `Rendering ${selectedFormat === "4.25x5.5" ? "4.25\" × 5.5\" Handbill" : selectedFormat} PDF (300 DPI)...`
    );

    try {
      await new Promise((r) => setTimeout(r, 100));
      const canvas = await captureConcertPosterCanvas(element);

      const headlineBandName = (config.bandName || "gig").trim();
      const sanitizedName = headlineBandName.replace(/\s+/g, "_");

      if (selectedFormat === "png") {
        // Direct browser delivery for Web Flyer PNG via canvas.toBlob + URL.createObjectURL
        await new Promise<void>((resolve, reject) => {
          if (!canvas.toBlob) {
            try {
              const dataUrl = canvas.toDataURL("image/png");
              const link = document.createElement("a");
              link.download = `${sanitizedName}_flyer.png`;
              link.href = dataUrl;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              resolve();
            } catch (fallbackErr) {
              reject(fallbackErr);
            }
            return;
          }

          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("Unable to generate image blob from poster canvas"));
              return;
            }
            try {
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.download = `${sanitizedName}_flyer.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              setTimeout(() => URL.revokeObjectURL(url), 2000);
              resolve();
            } catch (clickErr) {
              reject(clickErr);
            }
          }, "image/png");
        });
      } else {
        // Direct browser delivery for PDF downloads (11x17, 12x18, 4.25x5.5)
        let width = 11;
        let height = 17;
        if (selectedFormat === "12x18") {
          width = 12;
          height = 18;
        } else if (selectedFormat === "4.25x5.5") {
          width = 4.25;
          height = 5.5;
        }

        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "in",
          format: [width, height]
        });

        const imgData = canvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(imgData, "JPEG", 0, 0, width, height, undefined, "FAST");

        const pdfFileName = `${sanitizedName}_poster.pdf`;
        pdf.save(pdfFileName);
      }

      // Visual Feedback: Green toast confirmation once file stream begins
      setExportNotice("✓ Poster downloaded successfully");
      setSaveToast({
        show: true,
        message: "✓ Poster downloaded successfully",
        isError: false
      });
      setTimeout(() => {
        setExportNotice(null);
        setSaveToast(null);
      }, 4000);
    } catch (err: any) {
      console.error("Could not generate poster export:", err);
      const technicalReason = err?.message || err?.toString?.() || "Rasterization or export error";
      setSaveToast({
        show: true,
        message: `Download failed: ${technicalReason}`,
        isError: true
      });
      setExportNotice(null);
      setTimeout(() => {
        setSaveToast(null);
      }, 6000);
    } finally {
      setIsExporting(false);
    }
  };

  // Aliases for compatibility
  const handleDownloadPrintReadyPdf = async (size?: "11x17" | "12x18" | "4.25x5.5") => {
    if (size) setSelectedFormat(size);
    return handleDownloadPosterOrFlyer();
  };

  const handleDownloadWebFlyer = async () => {
    setSelectedFormat("png");
    return handleDownloadPosterOrFlyer();
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
            {saveToast && !saveToast.isError && (
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

          {/* STEP 4: PHYSICAL PRINT FULFILLMENT & DESIGN BACKUP */}
          <div className="space-y-4 border-t border-gray-100 pt-4" id="step-4-final-actions-section">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">4</span>
                Physical Print Fulfillment & Save
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-snug">
              To download digital files (11x17, 12x18, handbill PDF, or web flyer PNG), use the dedicated <strong className="text-slate-800 font-semibold">Export & Download Action Bar</strong> directly above the Live Poster Preview below.
            </p>

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

            {/* Fireball Printing Recommendation Card beneath utility actions */}
            <div className="pt-2">
              {renderFireballCard()}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 3 (Bottom): Dedicated Download Action Bar & Live Poster Preview Canvas */}
      <div className="w-full flex flex-col items-center justify-between space-y-6 pt-2" id="poster-rendering-panel">
        
        {/* Single Dedicated Download Action Bar directly above Live Poster Preview */}
        <div 
          id="poster-download-control-bar" 
          className="w-full bg-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-xl space-y-3.5"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-white flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-indigo-400" />
                Live Concert Poster Preview
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded border border-slate-700">
                300 DPI Bleed-Ready
              </span>
            </div>

            <div className="flex items-center gap-2">
              {exportNotice && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-700/50 flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  {exportNotice}
                </span>
              )}
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer"
                title="Open browser print dialog"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Local Print</span>
              </button>
            </div>
          </div>

          {/* Format Selector & Primary Action Button */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 pt-1">
            {/* Format Selector: [11x17 Tabloid PDF] | [12x18 Full Bleed PDF] | [4.25x5.5 Handbill PDF] | [Web Flyer PNG] */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2" id="export-format-selector">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
                Format:
              </span>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  id="btn-format-11x17"
                  onClick={() => setSelectedFormat("11x17")}
                  className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    selectedFormat === "11x17"
                      ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>11x17 Tabloid PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-format-12x18"
                  onClick={() => setSelectedFormat("12x18")}
                  className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    selectedFormat === "12x18"
                      ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>12x18 Full Bleed PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-format-4.25x5.5"
                  onClick={() => setSelectedFormat("4.25x5.5")}
                  className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    selectedFormat === "4.25x5.5"
                      ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span>4.25x5.5 Handbill PDF</span>
                </button>

                <button
                  type="button"
                  id="btn-format-png"
                  onClick={() => setSelectedFormat("png")}
                  className={`px-3 py-2 rounded-xl font-bold text-xs cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    selectedFormat === "png"
                      ? "bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/40"
                      : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80"
                  }`}
                >
                  <Image className="w-3.5 h-3.5 shrink-0" />
                  <span>Web Flyer PNG</span>
                </button>
              </div>
            </div>

            {/* Primary Action Button: "Download Poster / Flyer" */}
            <button
              type="button"
              id="btn-download-poster-primary"
              onClick={handleDownloadPosterOrFlyer}
              disabled={isExporting}
              className="w-full lg:w-auto min-w-[220px] bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-50 text-slate-950 font-black text-sm py-2.5 px-6 rounded-xl shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Generating {selectedFormat === "png" ? "Web Flyer PNG" : "Print PDF"}...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-slate-950 stroke-[2.5]" />
                  <span>Download Poster / Flyer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live CSS styled templates based on themeId */}
        <div 
          id="poster-canvas-preview"
          data-testid="concert-poster-frame"
          className={`w-[320px] sm:w-[350px] min-h-[490px] border rounded-2xl shadow-2xl overflow-hidden p-6 flex flex-col justify-between text-center relative transition-all ${c.frameClasses}`}
          style={{
            ...c.frameStyle,
            transformStyle: "preserve-3d"
          }}
        >
            {/* Theme overlay designs */}
            {/* 1. GRUNGE OVERLAY */}
            {config.themeId === "heavy-grunge" && (
              <div 
                className="absolute inset-0 pointer-events-none border-4 m-2 rounded-xl" 
                id="grunge-borders"
                style={{ borderColor: "#7f1d1d" }}
              >
                <div 
                  className="absolute inset-0 opacity-15" 
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, #000000, #000000 10px, #ef4444 10px, #ef4444 20px)" }} 
                />
              </div>
            )}

            {/* 2. SYNTHWAVE LINES */}
            {config.themeId === "retro-neon" && (
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-end" id="synth-decorations">
                <div 
                  className="absolute top-6 right-6 w-12 h-12 rounded-full opacity-60" 
                  style={{ backgroundImage: "linear-gradient(to bottom, #ec4899, #f59e0b)" }}
                />
                <div 
                  className="h-28 flex flex-col justify-between py-1 opacity-60"
                  style={{ backgroundImage: "linear-gradient(to top, rgba(236,72,153,0.2), transparent)" }}
                >
                  <div className="w-full" style={{ borderBottom: "1px solid rgba(236,72,153,0.3)" }} />
                  <div className="w-full" style={{ borderBottom: "1px solid rgba(236,72,153,0.25)" }} />
                  <div className="w-full" style={{ borderBottom: "1px solid rgba(236,72,153,0.2)" }} />
                  <div className="w-full" style={{ borderBottom: "1px solid rgba(236,72,153,0.1)" }} />
                </div>
              </div>
            )}

            {/* 3. MINIMAL CIRCLES */}
            {config.themeId === "indie-minimal" && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 animate-pulse" id="indie-decorations">
                <div className="w-56 h-56 rounded-full border flex items-center justify-center" style={{ borderColor: "#e4e4e7" }}>
                  <div className="w-40 h-40 rounded-full border" style={{ borderColor: "#d4d4d8" }} />
                </div>
              </div>
            )}

            {/* 4. COZY FOLK LEAF ACCENTS */}
            {config.themeId === "folk-acoustic" && (
              <div 
                className="absolute inset-0 border-double border-4 m-3 rounded-lg flex items-center justify-between pointer-events-none p-4" 
                id="folk-decorations"
                style={{ borderColor: "#78350f" }}
              >
                <div className="text-xl font-serif select-none" style={{ color: "rgba(120,53,15,0.2)" }}>🎕</div>
                <div className="text-xl font-serif select-none mt-auto ml-auto" style={{ color: "rgba(120,53,15,0.2)" }}>🎕</div>
              </div>
            )}

            {/* 5. PSYCHEDELIC ACID SPIN */}
            {config.themeId === "psychedelic-acid" && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden" id="psychedelic-decorations">
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full opacity-30" style={{ backgroundColor: "#7e22ce" }} />
                <div className="absolute -bottom-10 -right-10 w-36 h-36 rounded-full opacity-30" style={{ backgroundColor: "#ec4899" }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, #f59e0b 2px, transparent 1px)", backgroundSize: "16px 16px" }} />
              </div>
            )}

            {/* 6. HELLFIRE SLASH */}
            {config.themeId === "metal-hellfire" && (
              <div className="absolute inset-0 pointer-events-none border m-1.5" id="metal-decorations" style={{ borderColor: "rgba(185,28,28,0.2)" }}>
                <div className="absolute top-0 bottom-0 left-4 w-[1px]" style={{ backgroundColor: "rgba(185,28,28,0.2)" }} />
                <div className="absolute top-0 bottom-0 right-4 w-[1px]" style={{ backgroundColor: "rgba(185,28,28,0.2)" }} />
                <div className="absolute top-4 left-0 right-0 h-[1px]" style={{ backgroundColor: "rgba(185,28,28,0.2)" }} />
                <div className="absolute bottom-4 left-0 right-0 h-[1px]" style={{ backgroundColor: "rgba(185,28,28,0.2)" }} />
              </div>
            )}

            {/* 7. POP GRID */}
            {config.themeId === "pop-bubblegum" && (
              <div className="absolute inset-0 pointer-events-none" id="pop-decorations">
                <div className="absolute inset-0 opacity-5" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 15px, #ec4899 15px, #ec4899 30px)" }} />
                <div className="absolute top-4 right-4 text-xs select-none" style={{ color: "#f472b6" }}>☁️</div>
                <div className="absolute bottom-4 left-4 text-xs select-none" style={{ color: "#f472b6" }}>🍭</div>
              </div>
            )}

            {/* 8. JAZZ VANGUARD GOLD FLOURISH */}
            {config.themeId === "jazz-vanguard" && (
              <div className="absolute inset-0 pointer-events-none border m-3" id="jazz-decorations" style={{ borderColor: "rgba(217,119,6,0.3)" }}>
                <div className="absolute top-2 left-2 text-[8px] select-none font-sans font-bold" style={{ color: "rgba(217,119,6,0.5)" }}>MIDNIGHT SESSION</div>
                <div className="absolute bottom-2 right-2 text-[8px] select-none font-serif" style={{ color: "rgba(217,119,6,0.5)" }}>VANGUARD CLUB</div>
              </div>
            )}

            {/* 9. RAVE MATRIX GRID */}
            {config.themeId === "dubstep-laser" && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden" id="laser-decorations">
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ backgroundColor: "#10b981" }} />
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: "#10b981" }} />
                <div className="absolute inset-0 opacity-10" style={{
                  backgroundImage: "linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)",
                  backgroundSize: "20px 20px"
                }} />
              </div>
            )}

            {/* 10. PUNK DIY PHOTOCOPY */}
            {config.themeId === "punk-diy" && (
              <div className="absolute inset-0 pointer-events-none border-t-[12px] border-b-[12px] flex flex-col justify-between" id="punk-decorations" style={{ borderColor: "#000000" }}>
                <div className="absolute inset-x-2 top-4 h-[2px] translate-y-1 rotate-1" style={{ backgroundColor: "#000000" }} />
                <div className="absolute inset-x-2 bottom-4 h-[2px] -translate-y-1 -rotate-2" style={{ backgroundColor: "#000000" }} />
              </div>
            )}

            {/* 11. CLASSIC ROCK 70S BORDER */}
            {config.themeId === "classic-rock" && (
              <div className="absolute inset-0 pointer-events-none border-2 m-2 rounded-xl flex flex-col justify-between" id="classic-rock-decorations" style={{ borderColor: "rgba(245,158,11,0.25)" }}>
                <div className="absolute top-2 left-3 right-3 border-b" style={{ borderColor: "rgba(245,158,11,0.3)" }} />
                <div className="absolute bottom-2 left-3 right-3 border-t" style={{ borderColor: "rgba(245,158,11,0.3)" }} />
                <div className="absolute top-3 left-3 text-[10px]" style={{ color: "rgba(245,158,11,0.4)" }}>★</div>
                <div className="absolute top-3 right-3 text-[10px]" style={{ color: "rgba(245,158,11,0.4)" }}>★</div>
                <div className="absolute bottom-3 left-3 text-[10px]" style={{ color: "rgba(245,158,11,0.4)" }}>★</div>
                <div className="absolute bottom-3 right-3 text-[10px]" style={{ color: "rgba(245,158,11,0.4)" }}>★</div>
              </div>
            )}

            {/* Top details card info */}
            <div className="space-y-3 pt-4 z-10" id="poster-layout-top">
              {/* Supporting Tagline / Tour subtitle */}
              <h5 
                className={`text-[10px] uppercase font-black tracking-widest ${c.taglineClasses}`} 
                style={c.taglineStyle}
                id="poster-tagline-preview"
              >
                {config.secondaryText || "LIVE ON STAGE · ONE NIGHT ONLY"}
              </h5>

              {/* Main Headline band title */}
              <h1 
                className={`leading-none font-bold select-all tracking-tighter ${c.bandNameClasses} ${getFontFamilyClass(config.fontStyle)} ${!config.bandName ? 'opacity-40 italic' : ''}`} 
                style={c.bandNameStyle}
                id="poster-band-preview"
              >
                {config.bandName || "The Midnight Echoes"}
              </h1>

              {/* Supporting Acts / Openers appearing under the headlining act */}
              {config.supportingActs && (
                <div className="pt-1" id="poster-supporting-acts-preview">
                  <div 
                    className={`inline-block px-3 py-1 text-xs md:text-sm uppercase tracking-wider ${c.supportingActsClasses}`}
                    style={c.supportingActsStyle}
                  >
                    {config.supportingActs}
                  </div>
                </div>
              )}
            </div>

            {/* Mid details (Main Venue details and graphic representations) */}
            <div className="space-y-3 py-4 z-10" id="poster-layout-mid">
              {/* Custom stylized circle graphic representation if Indie */}
              {config.themeId === "indie-minimal" && (
                <div className="w-10 h-10 rounded-full mx-auto flex items-center justify-center text-xs font-mono mb-4" style={{ backgroundColor: "#18181b", color: "#ffffff" }} id="indie-mid-graphic">
                  L-S
                </div>
              )}

              {/* Custom vector icons if Folk */}
              {config.themeId === "folk-acoustic" && (
                <div className="text-lg my-1 select-none" style={{ color: "#78350f" }} id="folk-mid-graphic">
                  ❀ ─── ❀ ─── ❀
                </div>
              )}

              {/* Psychedelic */}
              {config.themeId === "psychedelic-acid" && (
                <div className="text-xl my-1 select-none animate-bounce" style={{ color: "#c084fc" }} id="psych-mid-graphic">
                  ☯ 🌀 ☯
                </div>
              )}

              {/* Metal */}
              {config.themeId === "metal-hellfire" && (
                <div className="text-xl my-1 select-none font-bold tracking-widest" style={{ color: "#b91c1c" }} id="metal-mid-graphic">
                  ☠ 🜏 ☠
                </div>
              )}

              {/* Pop */}
              {config.themeId === "pop-bubblegum" && (
                <div className="text-base my-1 select-none" style={{ color: "#ec4899" }} id="pop-mid-graphic">
                  ★ ★ ★ ★ ★
                </div>
              )}

              {/* Jazz */}
              {config.themeId === "jazz-vanguard" && (
                <div className="text-base my-1 select-none tracking-widest font-serif font-light" style={{ color: "#f59e0b" }} id="jazz-mid-graphic">
                  ◆ ─── ♫ ─── ◆
                </div>
              )}

              {/* Dubstep */}
              {config.themeId === "dubstep-laser" && (
                <div className="text-xs font-mono my-1 select-none" style={{ color: "#10b981" }} id="synth-mid-graphic">
                  [ SIGNAL DETECTED_ ]
                </div>
              )}

              {/* Punk */}
              {config.themeId === "punk-diy" && (
                <div className="text-xl font-mono my-2 select-none font-black" style={{ color: "#000000" }} id="punk-mid-graphic">
                  ⚡ ☠ ⚡
                </div>
              )}

              <div className="space-y-1" id="venue-text-previews">
                <h2 
                  className={`text-base font-bold uppercase tracking-wide ${c.venueNameClasses} ${!config.venueName ? 'opacity-40 italic' : ''}`} 
                  style={c.venueNameStyle}
                  id="poster-venue-name-preview"
                >
                  {config.venueName || "The Crystal Ballroom · Portland, OR"}
                </h2>

                {config.venueAddress && (
                  <p 
                    className="text-[10px] font-medium flex items-center justify-center gap-1 leading-normal" 
                    style={{ color: config.themeId === "punk-diy" ? "#000000" : "#a1a1aa" }}
                    id="poster-venue-addr-preview"
                  >
                    <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "#ef4444" }} />
                    {config.venueAddress}
                  </p>
                )}
              </div>
            </div>

            {/* Bottom detail footer tags (Time, entry fees, limits, snacks icons) */}
            <div className="border-t pt-4 space-y-4 z-10" id="poster-layout-bottom" style={{ borderColor: config.themeId === "punk-diy" ? "#000000" : "#27272a" }}>
              {/* Date and time badges */}
              <div className="flex justify-center items-center gap-3 text-xs flex-wrap" id="footer-badges-preview">
                <span 
                  className={`px-2.5 py-1 rounded font-bold font-mono tracking-tight flex items-center gap-1.5 border ${c.dateBadgeClasses} ${!config.dateStr ? 'opacity-40' : ''}`} 
                  style={c.dateBadgeStyle}
                  id="poster-date-preview"
                >
                  <Calendar className="w-3.5 h-3.5" style={{ color: "#a1a1aa" }} />
                  {config.dateStr || "Friday, Nov 14 · Doors 7:00 PM / Show 8:00 PM"}
                </span>

                {config.timeStr && (
                  <span 
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${c.timeBadgeClasses}`} 
                    style={c.timeBadgeStyle}
                    id="poster-time-preview"
                  >
                    {config.timeStr}
                  </span>
                )}
              </div>

              {/* Pricing and Entrance Limit badges row */}
              <div className="flex items-center justify-center gap-3 text-[10px] font-bold" id="pricing-age-preview">
                <span 
                  className={`flex items-center gap-0.5 ${!config.priceStr ? 'opacity-40' : ''}`} 
                  style={{ color: config.themeId === "punk-diy" ? "#000000" : "#a1a1aa" }}
                  id="poster-price-label"
                >
                  <DollarSign className="w-3.5 h-3.5" style={{ color: "#10b981" }} />
                  {config.priceStr || "$15 Advance / $20 Door · 21+ · Tickets at link"}
                </span>

                <span 
                  className="px-2 py-0.5 text-[9px] uppercase font-black rounded-sm tracking-wider" 
                  style={{
                    backgroundColor: config.themeId === "punk-diy" ? "#000000" : "#18181b",
                    color: "#ffffff"
                  }}
                  id="poster-age-badge"
                >
                  {config.allAges}
                </span>
              </div>

              {/* Custom food / beverages ICON indications if toggled */}
              {(config.amenities.servesFood || config.amenities.servesAlcohol || config.amenities.merchArea) && (
                <div 
                  className="rounded-lg p-2 flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-wider mx-auto max-w-[240px] border" 
                  style={{
                    backgroundColor: config.themeId === "punk-diy" ? "#f4f4f5" : "#18181b",
                    borderColor: config.themeId === "punk-diy" ? "#000000" : "#27272a",
                    color: config.themeId === "punk-diy" ? "#000000" : "#e4e4e7"
                  }}
                  id="poster-amenities-pills"
                >
                  {config.amenities.servesFood && (
                    <span className="flex items-center gap-1" id="pill-preview-food">
                      <UtensilsCrossed className="w-3.5 h-3.5" style={{ color: "#06b6d4" }} />
                      Food
                    </span>
                  )}
                  {config.amenities.servesAlcohol && (
                    <span className="flex items-center gap-1" id="pill-preview-alcohol">
                      <Wine className="w-3.5 h-3.5 animate-pulse" style={{ color: "#ef4444" }} />
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
                <p className="text-[9px] font-medium tracking-tight italic" style={{ color: "#71717a" }} id="poster-notes-preview">
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

        {/* Floating Download / Save Confirmation Toast */}
        {saveToast?.show && (
          <div className={`fixed bottom-6 right-6 z-50 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2 animate-fade-in pointer-events-none ${
            saveToast.isError
              ? "bg-red-700 border-red-600 text-red-50"
              : "bg-emerald-700 border-emerald-600 text-emerald-50"
          }`}>
            {saveToast.isError ? (
              <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            )}
            <span>{saveToast.message}</span>
          </div>
        )}
      </div>
    );
  }