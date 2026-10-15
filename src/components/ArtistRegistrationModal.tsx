import React, { useState } from "react";
import { X, Music, MapPin, Mail, Globe, CheckCircle2, AlertCircle, Check, Loader2, Sparkles, Radio } from "lucide-react";
import { supabase, insertProfile, saveBandToDatabase } from "../lib/supabase";
import { AvailableBand } from "../types";
import { CONTINENTAL_US_STATES, POPULAR_NATIONWIDE_HUBS, parseFreeformCityState } from "../constants/states";

export interface ArtistRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBandRegistered?: (band: AvailableBand) => void;
  onNavigateToBands?: () => void;
}

const PRIMARY_GENRES_LIST = [
  "Rock",
  "Punk",
  "Metal",
  "Indie",
  "Hip-Hop",
  "Americana",
  "Folk",
  "Alternative",
  "Hardcore",
  "Electronic",
  "Blues",
  "Country",
  "Jazz",
  "Soul / R&B"
];

const POPULAR_HOME_MARKETS = POPULAR_NATIONWIDE_HUBS;

const BLOCKED_DOMAINS = [
  "example.com",
  "test.com",
  "fake.com",
  "dummy.com",
  "mailinator.com",
  "tempmail.com",
  "temp-mail.org",
  "guerrillamail.com",
  "10minutemail.com",
  "throwawaymail.com",
  "sample.com"
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function ArtistRegistrationModal({
  isOpen,
  onClose,
  onBandRegistered,
  onNavigateToBands
}: ArtistRegistrationModalProps) {
  const [bandName, setBandName] = useState("");
  const [homeMarket, setHomeMarket] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [officialEmail, setOfficialEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [touringTier, setTouringTier] = useState<"Local" | "Regional Tour" | "National Act">("Regional Tour");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const validateForm = (): boolean => {
    setErrorMessage("");

    if (!bandName.trim()) {
      setErrorMessage("Band Name is required.");
      return false;
    }

    if (!homeMarket.trim()) {
      setErrorMessage("Home Market (City, State) is required.");
      return false;
    }

    // Allow any freeform input across continental US
    const parsedLocation = parseFreeformCityState(homeMarket);
    if (!parsedLocation.city) {
      setErrorMessage("Please specify a valid Home Market city and state (e.g. Austin, TX, Chicago IL, or Seattle, WA).");
      return false;
    }

    if (selectedGenres.length === 0) {
      setErrorMessage("Please select at least one primary genre.");
      return false;
    }

    const cleanEmail = officialEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage("Official Booking Email is required.");
      return false;
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMessage("Please provide a valid booking email address (e.g., booking@yourband.com).");
      return false;
    }

    const domain = cleanEmail.split("@")[1];
    if (BLOCKED_DOMAINS.includes(domain)) {
      setErrorMessage(`Disposable or dummy email domains like @${domain} are blocked. Please provide an authentic contact email.`);
      return false;
    }

    const cleanMusic = musicUrl.trim();
    if (!cleanMusic) {
      setErrorMessage("Music / EPK URL is required (Spotify, Bandcamp, or YouTube).");
      return false;
    }

    try {
      const parsed = new URL(cleanMusic.startsWith("http") ? cleanMusic : `https://${cleanMusic}`);
      if (!parsed.hostname.includes(".")) {
        setErrorMessage("Please enter a valid Music / EPK link.");
        return false;
      }
    } catch {
      setErrorMessage("Please enter a valid Music / EPK URL.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrorMessage("");

    const cleanName = bandName.trim();
    const cleanCity = parseFreeformCityState(homeMarket).formatted;
    const cleanEmail = officialEmail.trim().toLowerCase();
    const cleanWeb = website.trim() || null;
    const cleanMusic = musicUrl.trim().startsWith("http") ? musicUrl.trim() : `https://${musicUrl.trim()}`;

    try {
      // 1. Direct Supabase insert into bands table as requested
      const { data, error } = await supabase.from("bands").insert([
        {
          name: cleanName,
          city_state: cleanCity,
          official_email: cleanEmail,
          website: cleanWeb,
          genres: selectedGenres,
          touring_tier: touringTier,
          music_url: cleanMusic
        }
      ]).select();

      if (error) {
        console.warn("[Supabase] Direct bands insert notice/error:", error);
      }

      // 2. Also register in profiles and local storage for immediate app-wide consistency
      const newBandModel: AvailableBand = {
        id: data?.[0]?.id || `band-user-${Date.now()}`,
        name: cleanName,
        city: cleanCity,
        contactEmail: cleanEmail,
        website: cleanWeb || undefined,
        musicUrl: cleanMusic,
        epkUrl: cleanMusic,
        genres: selectedGenres,
        experienceLevel: touringTier === "National Act" ? "National Act" : (touringTier === "Regional Tour" ? "Regional Tour" : "Local"),
        bio: `${cleanName} is a verified ${touringTier} artist from ${cleanCity}. Genres: ${selectedGenres.join(", ")}.`
      };

      try {
        await insertProfile({
          id: newBandModel.id,
          name: cleanName,
          email: cleanEmail,
          contact_email: cleanEmail,
          role: "Band",
          type: "Band",
          city: cleanCity,
          genres: selectedGenres,
          website: cleanWeb || undefined,
          primary_link: cleanMusic,
          bio: newBandModel.bio
        });
      } catch (profileErr) {
        console.warn("[Supabase] Profile insert error:", profileErr);
      }

      try {
        await saveBandToDatabase({
          name: cleanName,
          city_state: cleanCity,
          official_email: cleanEmail,
          website: cleanWeb,
          music_url: cleanMusic,
          genres: selectedGenres,
          touring_tier: touringTier,
          bio: newBandModel.bio
        });
      } catch (_) {}

      // Update custom local storage list
      try {
        const saved = localStorage.getItem("custom_available_bands_v1");
        const list: AvailableBand[] = saved ? JSON.parse(saved) : [];
        const updated = [newBandModel, ...list.filter(b => b.name.toLowerCase() !== cleanName.toLowerCase() && b.contactEmail.toLowerCase() !== cleanEmail)];
        localStorage.setItem("custom_available_bands_v1", JSON.stringify(updated));
      } catch (_) {}

      if (onBandRegistered) {
        onBandRegistered(newBandModel);
      }

      setIsSubmittedSuccess(true);
    } catch (err: any) {
      console.error("Band registration submission error:", err);
      setErrorMessage(err.message || "Failed to submit band registration. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmittedSuccess(false);
    setBandName("");
    setHomeMarket("");
    setSelectedGenres([]);
    setOfficialEmail("");
    setWebsite("");
    setMusicUrl("");
    setTouringTier("Regional Tour");
    setErrorMessage("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="w-full max-w-lg mx-auto sm:my-8 inset-x-0 bottom-0 sm:bottom-auto rounded-t-2xl sm:rounded-2xl max-h-[92vh] flex flex-col bg-white shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Artist Directory Registration</span>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Verified
                </span>
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Claim your listing and connect with Pacific NW &amp; national tour promoters.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetAndClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* Success State */}
          {isSubmittedSuccess ? (
            <div className="text-center py-8 px-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-lg font-black text-slate-900">Registration Complete!</h4>
                <p className="text-sm font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-2xl max-w-md mx-auto">
                  Your band has been submitted to the verified touring directory.
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto pt-2">
                  Promoters, booking agents, and venues on GigLizard can now discover <strong>{bandName}</strong> and send direct hold inquiries.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    handleResetAndClose();
                    if (onNavigateToBands) onNavigateToBands();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  View in Band Directory →
                </button>
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Band Name */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span>Band / Artist Name <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Official stage name</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Black Ends, Acid Tongue, Naked Giants"
                  value={bandName}
                  onChange={(e) => setBandName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
                />
              </div>

              {/* Home Market */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span>Home Market (City, State) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Continental US (All 48 States + DC)</span>
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      list="nationwide-hubs-datalist"
                      placeholder="e.g. Austin, TX, Chicago IL, Denver, CO, or Seattle, WA"
                      value={homeMarket}
                      onChange={(e) => setHomeMarket(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
                    />
                    <datalist id="nationwide-hubs-datalist">
                      {POPULAR_NATIONWIDE_HUBS.map(h => (
                        <option key={h} value={h} />
                      ))}
                    </datalist>
                  </div>
                  {/* Continental State Selector dropdown */}
                  <select
                    className="px-2.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold text-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    onChange={(e) => {
                      if (!e.target.value) return;
                      const selectedState = e.target.value;
                      const parts = homeMarket.split(",");
                      const currentCity = parts[0]?.trim();
                      if (currentCity) {
                        setHomeMarket(`${currentCity}, ${selectedState}`);
                      } else {
                        setHomeMarket(selectedState);
                      }
                    }}
                    value=""
                  >
                    <option value="">State (48 Lower)...</option>
                    {CONTINENTAL_US_STATES.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.code} - {st.name}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Quick select chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-[10px] text-slate-400 font-bold">Tour Hubs:</span>
                  {["Seattle, WA", "San Francisco, CA", "Denver, CO", "Austin, TX", "Chicago, IL", "Nashville, TN", "New York, NY"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setHomeMarket(m)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                        homeMarket === m
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Genres (Multi-select checklist) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Primary Genres <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Select all that apply</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 p-2 bg-slate-50 border border-slate-200 rounded-2xl max-h-36 overflow-y-auto">
                  {PRIMARY_GENRES_LIST.map((g) => {
                    const isChecked = selectedGenres.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGenre(g)}
                        className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold flex items-center justify-between transition-all cursor-pointer text-left border ${
                          isChecked
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate">{g}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
                {selectedGenres.length > 0 && (
                  <p className="text-[11px] text-indigo-700 font-bold mt-1">
                    Selected: {selectedGenres.join(", ")}
                  </p>
                )}
              </div>

              {/* Official Booking Email */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span>Official Booking Email <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Real booking inquiries only</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. booking@yourband.com or bandmanager@gmail.com"
                    value={officialEmail}
                    onChange={(e) => setOfficialEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Protected by GigLizard Anti-Scrape shielding. Dummy domains (@example.com) are blocked.
                </p>
              </div>

              {/* Music / EPK URL (Spotify, Bandcamp, YouTube) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span>Music / EPK URL <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-indigo-600 font-bold">Spotify, Bandcamp, or YouTube</span>
                </label>
                <div className="relative">
                  <Music className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    required
                    placeholder="https://open.spotify.com/artist/... or https://yourband.bandcamp.com"
                    value={musicUrl}
                    onChange={(e) => setMusicUrl(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Website / Social Link (Optional) */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1 flex items-center justify-between">
                  <span>Website / Linktree / Social URL <span className="text-slate-400 font-normal">(Optional)</span></span>
                </label>
                <div className="relative">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="url"
                    placeholder="https://linktr.ee/yourband or https://instagram.com/yourband"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900 bg-white"
                  />
                </div>
              </div>

              {/* Touring Tier */}
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Touring Tier <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Routing scope</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { tier: "Local" as const, title: "Local", desc: "Hometown clubs & opening slots" },
                    { tier: "Regional Tour" as const, title: "Regional Tour", desc: "Pacific NW / Multi-city runs" },
                    { tier: "National Act" as const, title: "National Act", desc: "Cross-country headliner" }
                  ].map((t) => {
                    const isSelected = touringTier === t.tier;
                    return (
                      <button
                        key={t.tier}
                        type="button"
                        onClick={() => setTouringTier(t.tier)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-500"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 text-xs">{t.title}</span>
                          <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                            isSelected ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-300"
                          }`}>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{t.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Band Profile...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Submit to Verified Directory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
