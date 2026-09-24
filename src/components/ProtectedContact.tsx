import React, { useState, useMemo } from "react";
import { Mail, Phone, Lock, Copy, Check, ShieldCheck, ShieldAlert } from "lucide-react";
import { 
  encodeProtectedString, 
  decodeProtectedString, 
  generateDeconstructedContactChunks,
  checkRapidHarvestingAttempt 
} from "../utils/antiScrape";

interface ProtectedContactProps {
  type: "email" | "phone";
  value: string;
  label?: string;
  isUnlocked?: boolean; // If user has active 30-day pass (or free venue access)
  onRequireUnlock?: () => void;
  className?: string;
  sourceContext?: "venue" | "band";
}

export default function ProtectedContact({
  type,
  value,
  label,
  isUnlocked = true,
  onRequireUnlock,
  className = "",
  sourceContext = "venue"
}: ProtectedContactProps) {
  const [copied, setCopied] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Pre-generate micro-chunked deconstructed segments with interleaved invisible honeypot noise
  const chunks = useMemo(() => {
    return generateDeconstructedContactChunks(value);
  }, [value]);

  if (!value || value === "Inquire" || value === "Unlisted") {
    return (
      <span className="text-gray-400 text-xs italic font-medium flex items-center gap-1">
        {type === "email" ? <Mail className="w-3 h-3" /> : <Phone className="w-3 h-3" />}
        {value || "--"}
      </span>
    );
  }

  // If locked or expired behind 30-day pass requirement:
  // Strictly hide contact details for non-subscribers and prompt for $9.99 30-day unlock (+ $0.84 fee at checkout)
  if (!isUnlocked) {
    return (
      <div 
        className={`inline-flex items-center gap-2 select-none ${className}`}
        onCopy={(e) => {
          e.preventDefault();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
        }}
      >
        <button
          type="button"
          onClick={onRequireUnlock}
          className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 hover:border-amber-400/50 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs select-none group"
          title="30-Day Access Expired or Required — Click to Unlock for $9.99 (+$0.84 fee at checkout)"
        >
          {type === "email" ? (
            <Mail className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400" />
          ) : (
            <Phone className="w-3.5 h-3.5 text-amber-400/80 group-hover:text-amber-400" />
          )}
          <span className="font-mono text-slate-300 tracking-tight text-[11px]">
            --****
          </span>
          <span className="text-[9px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ml-1">
            <Lock className="w-2.5 h-2.5" />
            Unlock ($9.99)
          </span>
        </button>

        {/* Copy button is strictly disabled for expired/locked contacts */}
        <button
          type="button"
          disabled
          className="p-1 text-slate-600 opacity-40 cursor-not-allowed rounded select-none"
          title="Copy disabled — 30-day pass required to view contact info"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  // Unlocked / Verified Access:
  // Protected with anti-scraping DOM deconstruction & honeytoken defenses
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Check for rapid mass-harvesting automated behavior
    if (checkRapidHarvestingAttempt()) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 4000);
      return;
    }

    // Copy true in-memory value directly to clipboard without scraping DOM
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (checkRapidHarvestingAttempt()) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 4000);
      return;
    }

    if (type === "email") {
      window.location.href = `mailto:${value}`;
    } else {
      window.location.href = `tel:${value}`;
    }
  };

  if (isRateLimited) {
    return (
      <div className="inline-flex items-center gap-1.5 bg-rose-950/80 border border-rose-800 text-rose-300 px-2.5 py-1 rounded-lg text-xs font-semibold">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        <span>Anti-Scraping Cooldown Active</span>
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 group relative ${className}`}>
      {/* 
        Honeypot Scraper Trap:
        Invisible decoy link with zero opacity/dimensions. Naive web scrapers / bot crawlers
        harvesting mailto links will scrape this canary token, flagging their session.
      */}
      <a
        href="mailto:bot-trap-canary@pacifictour-honeypot.internal"
        tabIndex={-1}
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden",
          opacity: 0,
          pointerEvents: "none"
        }}
      >
        booking-trap-canary@pacifictour-honeypot.internal
      </a>

      {/* Main Protected Display with Deconstructed Chunks */}
      <div 
        onClick={handleAction}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-slate-900 border-indigo-500/40 text-indigo-200 hover:bg-slate-800 transition-all cursor-pointer select-none"
        title={type === "email" ? "Click to open email client (Anti-Scrape Protected)" : "Click to call (Anti-Scrape Protected)"}
      >
        {type === "email" ? (
          <Mail className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
        ) : (
          <Phone className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
        )}

        {/* 
          Deconstructed DOM Text:
          Renders genuine text segments cleanly to human eyes while interleaving
          invisible decoy honey-tokens so any raw HTML scraper or parser receives contaminated data.
        */}
        <span className="font-mono text-[11.5px] font-semibold text-white tracking-tight select-none">
          {chunks.map((chunk, idx) => {
            if (chunk.isDecoy) {
              return (
                <span
                  key={`decoy-${idx}`}
                  aria-hidden="true"
                  style={{
                    display: "none",
                    opacity: 0,
                    width: 0,
                    height: 0,
                    fontSize: 0,
                    userSelect: "none",
                    position: "absolute",
                    left: "-9999px"
                  }}
                >
                  {chunk.text}
                </span>
              );
            }
            return <React.Fragment key={`chunk-${idx}`}>{chunk.text}</React.Fragment>;
          })}
        </span>

        <span className="text-[9px] text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
        </span>
      </div>

      {/* Copy button with in-memory direct clipboard injection */}
      <button
        type="button"
        onClick={handleCopy}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-all cursor-pointer"
        title="Copy verified contact to clipboard"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}

