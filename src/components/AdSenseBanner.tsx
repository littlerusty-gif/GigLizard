import React, { useEffect } from "react";

interface AdSenseBannerProps {
  slotId?: string;
  format?: "auto" | "rectangle" | "horizontal";
  className?: string;
  label?: string;
}

declare global {
  interface Window {
    adsbygoogle?: any[];
  }
}

export default function AdSenseBanner({
  slotId = "default-banner",
  format = "auto",
  className = "",
  label = "Sponsor Advertisement"
}: AdSenseBannerProps) {
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // Ignore adsbygoogle errors when blocked by adblockers or during pre-warming
    }
  }, []);

  return (
    <div className={`my-8 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center backdrop-blur-xs ${className}`}>
      <div className="flex items-center justify-between pb-2 text-[10px] font-bold tracking-wider text-slate-300 uppercase">
        <span>{label}</span>
        <span className="text-slate-400">Google AdSense</span>
      </div>
      <div className="min-h-[100px] w-full flex items-center justify-center overflow-hidden rounded-xl bg-slate-950/60 p-2">
        <ins
          className="adsbygoogle"
          style={{ display: "block", minHeight: "90px", width: "100%" }}
          data-ad-client="ca-pub-9512474787890878"
          data-ad-slot={slotId}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}
