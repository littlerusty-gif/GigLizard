import React, { useState, useEffect } from "react";
import { UserAccount, AvailableBand, Venue } from "../types";
import { 
  getAccessStatusDetails, 
  isAccessActive, 
  isPerpetualPassEmail 
} from "../utils/accessControl";
import { sanitizeInputText } from "../utils/antiScrape";
import { categorizeUserMusicLink } from "../utils/musicLinks";
import { 
  X, Lock, Key, Eye, EyeOff, Save, CheckCircle2, 
  AlertCircle, Building, Users, FileText, Headphones, 
  MapPin, Sparkles, Clock, CreditCard, ExternalLink, 
  Globe, Mail, UserCheck
} from "lucide-react";

interface EditAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: UserAccount | null;
  onUpdateAccount: (updatedAccount: UserAccount) => void;
  onOpenCheckout?: () => void;
}

type ModalTab = "page" | "status" | "password";

export default function EditAccountModal({
  isOpen,
  onClose,
  currentAccount,
  onUpdateAccount,
  onOpenCheckout
}: EditAccountModalProps) {
  if (!isOpen || !currentAccount) return null;

  const [activeTab, setActiveTab] = useState<ModalTab>("page");

  // Page Information Form State
  const [formData, setFormData] = useState({
    name: currentAccount.name || "",
    city: currentAccount.city || "Seattle, WA",
    contactEmail: currentAccount.contactEmail || "",
    genre: currentAccount.genre || "",
    bio: currentAccount.bio || "",
    website: currentAccount.website || "",
    experienceLevel: currentAccount.experienceLevel || "Local",
    epkUrl: currentAccount.epkUrl || "",
    musicUrl: currentAccount.musicUrl || "",
    // Venue specific
    address: currentAccount.address || "",
    capacity: currentAccount.capacity || 150,
    hasPA: currentAccount.hasPA ?? true,
    hasLighting: currentAccount.hasLighting ?? true
  });

  // Password Form State
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Status & Notification Messages
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync form data when account prop changes or modal opens
  useEffect(() => {
    if (currentAccount) {
      setFormData({
        name: currentAccount.name || "",
        city: currentAccount.city || "Seattle, WA",
        contactEmail: currentAccount.contactEmail || "",
        genre: currentAccount.genre || "",
        bio: currentAccount.bio || "",
        website: currentAccount.website || "",
        experienceLevel: currentAccount.experienceLevel || "Local",
        epkUrl: currentAccount.epkUrl || "",
        musicUrl: currentAccount.musicUrl || "",
        address: currentAccount.address || "",
        capacity: currentAccount.capacity || 150,
        hasPA: currentAccount.hasPA ?? true,
        hasLighting: currentAccount.hasLighting ?? true
      });
      setCurrentPasswordInput("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccessMsg("");
      setErrorMsg("");
    }
  }, [currentAccount, isOpen]);

  const accessDetails = getAccessStatusDetails(currentAccount);
  const activeAccess = isAccessActive(currentAccount);
  const isOwner = isPerpetualPassEmail(currentAccount.contactEmail);

  // Handle Save Page Information
  const handleSavePageInfo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanName = sanitizeInputText(formData.name, 80).trim();
    const cleanCity = sanitizeInputText(formData.city, 80).trim();
    const cleanEmail = sanitizeInputText(formData.contactEmail, 100).trim().toLowerCase();
    const cleanBio = sanitizeInputText(formData.bio, 1000).trim();
    const cleanGenre = sanitizeInputText(formData.genre, 150).trim();

    // Required fields validation
    if (!cleanName) {
      setErrorMsg(currentAccount.type === "Band" ? "Please provide your Band Name." : "Please provide your Venue Name.");
      return;
    }
    if (!cleanCity) {
      setErrorMsg("Please provide City & State.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please provide a valid Official Booking Email.");
      return;
    }

    if (currentAccount.type === "Band") {
      if (!cleanGenre) {
        setErrorMsg("Please provide Musical Genres for your band.");
        return;
      }
      if (!formData.experienceLevel) {
        setErrorMsg("Please select a Touring Experience Level.");
        return;
      }
      if (!cleanBio) {
        setErrorMsg("Please provide a Band Bio & Sound Description.");
        return;
      }
    }

    // Helper to sanitize optional URL fields (Website, Music Link, EPK Link)
    // If left empty or whitespace, returns null
    const sanitizeOptionalUrl = (rawUrl?: string | null): string | null => {
      if (!rawUrl) return null;
      const trimmed = sanitizeInputText(rawUrl.trim(), 250);
      if (!trimmed || trimmed === "null" || trimmed === "undefined") {
        return null;
      }
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return trimmed;
      }
      return `https://${trimmed}`;
    };

    const cleanWebsite = sanitizeOptionalUrl(formData.website);
    const cleanEpkUrl = currentAccount.type === "Band" ? sanitizeOptionalUrl(formData.epkUrl) : null;
    const cleanMusicUrl = currentAccount.type === "Band" ? sanitizeOptionalUrl(formData.musicUrl) : null;

    const updatedAccount: UserAccount = {
      ...currentAccount,
      name: cleanName,
      city: cleanCity,
      contactEmail: cleanEmail,
      genre: cleanGenre,
      bio: cleanBio,
      website: cleanWebsite ?? null,
      ...(currentAccount.type === "Band" ? {
        experienceLevel: (formData.experienceLevel || "Local") as any,
        epkUrl: cleanEpkUrl ?? null,
        musicUrl: cleanMusicUrl ?? null
      } : {
        address: sanitizeInputText(formData.address, 120).trim(),
        capacity: Math.max(1, Number(formData.capacity) || 150),
        hasPA: Boolean(formData.hasPA),
        hasLighting: Boolean(formData.hasLighting)
      })
    };

    // 1. Update active account in localStorage
    try {
      localStorage.setItem("current_user_account_v1", JSON.stringify(updatedAccount));
      if (updatedAccount.type === "Venue") {
        localStorage.setItem("venue_user_profile_v1", JSON.stringify(updatedAccount));
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Sync to custom_available_bands_v1 or custom_venues_v1
    if (updatedAccount.type === "Band") {
      try {
        const savedBands = localStorage.getItem("custom_available_bands_v1");
        let bandsList: AvailableBand[] = [];
        if (savedBands) {
          try { bandsList = JSON.parse(savedBands); } catch (_) {}
        }
        if (!Array.isArray(bandsList)) bandsList = [];

        const normalizedEmail = updatedAccount.contactEmail.toLowerCase();
        const existingIdx = bandsList.findIndex(b => 
          b.contactEmail?.toLowerCase() === normalizedEmail || 
          b.id === `band-user-${updatedAccount.name.toLowerCase().replace(/\s+/g, "-")}`
        );

        const updatedBandEntry: AvailableBand = {
          id: existingIdx >= 0 ? bandsList[existingIdx].id : `band-user-${updatedAccount.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: updatedAccount.name,
          city: updatedAccount.city,
          genres: updatedAccount.genre ? updatedAccount.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Alternative Rock"],
          bio: updatedAccount.bio || "Live music artist registered on BandGig.",
          contactEmail: updatedAccount.contactEmail,
          website: cleanWebsite ?? null,
          experienceLevel: (updatedAccount.experienceLevel || "Local") as any,
          epkUrl: cleanEpkUrl ?? null,
          musicUrl: cleanMusicUrl ?? null,
          password: updatedAccount.password
        };

        if (existingIdx >= 0) {
          bandsList[existingIdx] = updatedBandEntry;
        } else {
          bandsList.unshift(updatedBandEntry);
        }

        localStorage.setItem("custom_available_bands_v1", JSON.stringify(bandsList));
        window.dispatchEvent(new CustomEvent("giglizard_bands_updated"));

        // Sync to backend register endpoint
        try {
          fetch("/api/bands/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ band: updatedBandEntry })
          }).catch(() => {});
        } catch (_) {}
      } catch (err) {
        console.error("Error syncing band directory:", err);
      }
    } else {
      // Sync to custom_venues_v1
      try {
        const savedVenues = localStorage.getItem("custom_venues_v1");
        let venuesList: Venue[] = [];
        if (savedVenues) {
          try { venuesList = JSON.parse(savedVenues); } catch (_) {}
        }
        if (!Array.isArray(venuesList)) venuesList = [];

        const normalizedEmail = updatedAccount.contactEmail.toLowerCase();
        const existingIdx = venuesList.findIndex(v => 
          v.contactEmail?.toLowerCase() === normalizedEmail || 
          v.id === `venue-user-${updatedAccount.name.toLowerCase().replace(/\s+/g, "-")}`
        );

        const updatedVenueEntry: Venue = {
          id: existingIdx >= 0 ? venuesList[existingIdx].id : `venue-user-${updatedAccount.name.toLowerCase().replace(/\s+/g, "-")}`,
          name: updatedAccount.name,
          city: updatedAccount.city,
          address: updatedAccount.address || "123 Music Ave",
          capacity: updatedAccount.capacity || 150,
          description: updatedAccount.bio || "Live music performance space.",
          contactEmail: updatedAccount.contactEmail,
          contactPhone: updatedAccount.contactPhone || "Inquire",
          website: updatedAccount.website || "www.inquire-booking.com",
          genres: updatedAccount.genre ? updatedAccount.genre.split(",").map(g => g.trim()).filter(Boolean) : ["Live Music"],
          hasPA: updatedAccount.hasPA ?? true,
          hasLighting: updatedAccount.hasLighting ?? true
        };

        if (existingIdx >= 0) {
          venuesList[existingIdx] = updatedVenueEntry;
        } else {
          venuesList.unshift(updatedVenueEntry);
        }

        localStorage.setItem("custom_venues_v1", JSON.stringify(venuesList));
        window.dispatchEvent(new CustomEvent("giglizard_venues_updated"));
      } catch (err) {
        console.error("Error syncing venue directory:", err);
      }
    }

    onUpdateAccount(updatedAccount);
    setSuccessMsg(`✅ ${updatedAccount.type} page information saved successfully! Directory updated.`);
    setTimeout(() => setSuccessMsg(""), 4000);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setErrorMsg("Please enter a new password.");
      return;
    }
    if (cleanPass.length < 4) {
      setErrorMsg("New password must be at least 4 characters long.");
      return;
    }
    if (cleanPass !== cleanConfirm) {
      setErrorMsg("Passwords do not match. Please re-type your new password.");
      return;
    }

    const emailKey = currentAccount.contactEmail.trim().toLowerCase();

    // 1. Update user_custom_passwords_v1 map
    try {
      const passMap: Record<string, string> = JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
      passMap[emailKey] = cleanPass;
      localStorage.setItem("user_custom_passwords_v1", JSON.stringify(passMap));
    } catch (err) {
      console.error(err);
    }

    // 2. Update currentAccount password
    const updatedAccount: UserAccount = {
      ...currentAccount,
      password: cleanPass
    };

    try {
      localStorage.setItem("current_user_account_v1", JSON.stringify(updatedAccount));
    } catch (err) {
      console.error(err);
    }

    // 3. Update password in custom band or venue lists
    if (updatedAccount.type === "Band") {
      try {
        const savedBands = localStorage.getItem("custom_available_bands_v1");
        if (savedBands) {
          const bandsList: AvailableBand[] = JSON.parse(savedBands);
          const idx = bandsList.findIndex(b => b.contactEmail?.toLowerCase() === emailKey);
          if (idx >= 0) {
            bandsList[idx].password = cleanPass;
            localStorage.setItem("custom_available_bands_v1", JSON.stringify(bandsList));
          }
        }
      } catch (_) {}
    } else {
      try {
        const savedVenues = localStorage.getItem("custom_venues_v1");
        if (savedVenues) {
          const venuesList: any[] = JSON.parse(savedVenues);
          const idx = venuesList.findIndex(v => v.contactEmail?.toLowerCase() === emailKey);
          if (idx >= 0) {
            venuesList[idx].password = cleanPass;
            localStorage.setItem("custom_venues_v1", JSON.stringify(venuesList));
          }
        }
      } catch (_) {}
    }

    onUpdateAccount(updatedAccount);
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordInput("");
    setSuccessMsg("✅ Password successfully updated! Your new password will be required for next login.");
    setTimeout(() => setSuccessMsg(""), 5000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
      id="edit-account-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border-2 border-indigo-500/40 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-white my-8 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="edit-account-modal-content"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
              currentAccount.type === "Band" ? "bg-indigo-600" : "bg-emerald-600"
            }`}>
              {currentAccount.type === "Band" ? <Users className="w-5 h-5" /> : <Building className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white">Edit Your Account & Page</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  currentAccount.type === "Band" 
                    ? "bg-indigo-950 text-indigo-300 border border-indigo-700/60" 
                    : "bg-emerald-950 text-emerald-300 border border-emerald-700/60"
                }`}>
                  {currentAccount.type}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Logged in as <span className="font-mono text-indigo-300">{currentAccount.contactEmail}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            id="btn-close-edit-account-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold flex-shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab("page"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 px-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "page" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
            id="tab-edit-page-info"
          >
            {currentAccount.type === "Band" ? <Users className="w-3.5 h-3.5" /> : <Building className="w-3.5 h-3.5" />}
            <span>{currentAccount.type === "Band" ? "Band Page Info" : "Venue Page Info"}</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("status"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 px-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "status" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
            id="tab-view-account-status"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Account Status</span>
            <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-extrabold ${
              activeAccess ? "bg-emerald-500 text-slate-950" : "bg-amber-500 text-slate-950"
            }`}>
              {activeAccess ? "Active" : "Free"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("password"); setErrorMsg(""); setSuccessMsg(""); }}
            className={`flex-1 py-2 px-3 rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "password" 
                ? "bg-indigo-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
            id="tab-change-password"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
        </div>

        {/* Global Feedback Notifications */}
        {errorMsg && (
          <div className="p-3 bg-rose-950/70 border border-rose-600/60 rounded-xl text-xs text-rose-200 flex items-center gap-2 flex-shrink-0 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 bg-emerald-950/70 border border-emerald-600/60 rounded-xl text-xs text-emerald-200 flex items-center gap-2 flex-shrink-0 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Scrollable Tab Content Body */}
        <div className="overflow-y-auto pr-1 flex-grow space-y-4">
          
          {/* TAB 1: EDIT BAND / VENUE PAGE INFO */}
          {activeTab === "page" && (
            <form onSubmit={handleSavePageInfo} className="space-y-4" id="form-edit-page-info">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    Public Directory Listing Details
                  </span>
                  <span className="text-[10px] text-slate-500">Updates live in directory</span>
                </div>

                {/* Name & City */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      {currentAccount.type === "Band" ? "Band Name *" : "Venue Name *"}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder={currentAccount.type === "Band" ? "e.g. The Midnight Echoes" : "e.g. The Crocodile"}
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      City & State *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Seattle, WA or Portland, OR"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Email & Website */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      <span>Official Booking Email *</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="booking@band.com"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      <span>Official Website <span className="text-slate-400 font-normal font-sans">(Optional)</span></span>
                    </label>
                    <input
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://www.yourband.com"
                      className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>

                {/* Genres */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {currentAccount.type === "Band" ? "Musical Genres (comma separated) *" : "Hosted Genres"}
                  </label>
                  <input
                    type="text"
                    required={currentAccount.type === "Band"}
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    placeholder="e.g. Alternative Rock, Post-Punk, Indie Pop"
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                {/* BAND SPECIFIC: Experience Level, Music Link, EPK */}
                {currentAccount.type === "Band" ? (
                  <>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Touring Experience Level *
                      </label>
                      <select
                        required
                        value={formData.experienceLevel}
                        onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value as any })}
                        className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none cursor-pointer"
                      >
                        <option value="Local">Local Support (Opening & Regional support)</option>
                        <option value="Regional Tour">Regional Headliner (West Coast regional touring)</option>
                        <option value="National Act">National Act (Full touring agency / established draw)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                          <Headphones className="w-3 h-3 text-emerald-400" />
                          <span>Online Music Link ("Listen" button) <span className="text-slate-400 font-normal font-sans">(Optional)</span></span>
                        </label>
                        <input
                          type="text"
                          value={formData.musicUrl}
                          onChange={(e) => setFormData({ ...formData, musicUrl: e.target.value })}
                          placeholder="e.g. Bandcamp, Spotify, YouTube URL"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-emerald-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Powers the green "Listen" button in the directory (optional).
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-indigo-400" />
                          <span>EPK Link (Electronic Press Kit) <span className="text-slate-400 font-normal font-sans">(Optional)</span></span>
                        </label>
                        <input
                          type="text"
                          value={formData.epkUrl}
                          onChange={(e) => setFormData({ ...formData, epkUrl: e.target.value })}
                          placeholder="e.g. https://www.yourband.com/press"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Press kit link shown to verified active subscribers (optional).
                        </p>
                      </div>
                    </div>
                  </>
                ) : (
                  /* VENUE SPECIFIC: Address, Capacity, Sound specs */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Street Address
                        </label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="e.g. 2208 2nd Ave"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Audience Capacity
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="100000"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                          placeholder="e.g. 250"
                          className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-bold">
                        <input
                          type="checkbox"
                          checked={formData.hasPA}
                          onChange={(e) => setFormData({ ...formData, hasPA: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 border-slate-700"
                        />
                        <span>Has In-House PA System</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 font-bold">
                        <input
                          type="checkbox"
                          checked={formData.hasLighting}
                          onChange={(e) => setFormData({ ...formData, hasLighting: e.target.checked })}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 bg-slate-900 border-slate-700"
                        />
                        <span>Has Stage Lighting System</span>
                      </label>
                    </div>
                  </>
                )}

                {/* Bio / Description */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    {currentAccount.type === "Band" ? "Band Bio & Sound Description *" : "Venue Room Description & Vibe"}
                  </label>
                  <textarea
                    rows={3}
                    required={currentAccount.type === "Band"}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder={currentAccount.type === "Band" ? "Tell venues and booking agents about your sound and stage show..." : "Describe your venue room, stage dimensions, and booking policy..."}
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none resize-y"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2 text-xs"
                  id="btn-save-page-info"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Page Information</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: VIEW ACCOUNT STATUS */}
          {activeTab === "status" && (
            <div className="space-y-4" id="view-account-status-content">
              {/* Primary Status Banner */}
              <div className={`p-4 rounded-2xl border ${
                isOwner 
                  ? "bg-amber-950/40 border-amber-500/50" 
                  : activeAccess 
                  ? "bg-emerald-950/40 border-emerald-500/50" 
                  : "bg-slate-950 border-slate-800"
              } space-y-3`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {isOwner ? "👑" : activeAccess ? "🟢" : "🔒"}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {isOwner 
                          ? "Lifetime VIP Owner Account" 
                          : activeAccess 
                          ? `30-Day Pass Active (${accessDetails.remainingDays} ${accessDetails.remainingDays === 1 ? "day" : "days"} remaining)` 
                          : accessDetails.isExpired 
                          ? "30-Day Pass Expired" 
                          : "Free Tier Account"}
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Account email: <span className="font-mono text-slate-200">{currentAccount.contactEmail}</span>
                      </p>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-lg ${
                    isOwner 
                      ? "bg-amber-400 text-slate-950" 
                      : activeAccess 
                      ? "bg-emerald-500 text-slate-950" 
                      : "bg-slate-800 text-amber-300"
                  }`}>
                    {isOwner ? "VIP Lifetime" : activeAccess ? "Active Pass" : "Masked"}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-2.5">
                  {isOwner 
                    ? "Perpetual lifetime owner access active with unmasked band contacts, unlimited booking access, EPKs, and private admin analytics."
                    : activeAccess 
                    ? `Full booking emails and verified contacts across all 1600+ live bands are currently unmasked. ${currentAccount.autoRenew ? "Automatic 30-day renewal is enabled." : "Pass expires in " + accessDetails.remainingDays + " days."}`
                    : "Band contact emails, EPKs, and streaming Listen links are currently masked. Upgrade to an active 30-day pass to unlock full unmasked contact data across all 1600+ live bands."}
                </p>
              </div>

              {/* Status Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Band Contact Emails:</span>
                    <span className={`font-black text-[10px] px-2 py-0.5 rounded ${
                      activeAccess ? "bg-emerald-900/60 text-emerald-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {activeAccess ? "✓ Unmasked" : "🔒 Masked (--****)"}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    {activeAccess ? "Direct mailto: links unlocked." : "Requires active paid pass."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">EPK & Listen Links:</span>
                    <span className={`font-black text-[10px] px-2 py-0.5 rounded ${
                      activeAccess ? "bg-emerald-900/60 text-emerald-300" : "bg-slate-800 text-slate-400"
                    }`}>
                      {activeAccess ? "✓ Unlocked" : "🔒 Protected"}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    {activeAccess ? "Band audio & press kits accessible." : "Protected for active subscribers."}
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Directory Listing:</span>
                    <span className="font-black text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                      ✓ Active & Searchable
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    Your {currentAccount.type} page is published and live.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-400">Venue Directory:</span>
                    <span className="font-black text-[10px] px-2 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                      ✓ 100% Free
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500">
                    Free access to 600+ West Coast music venues.
                  </p>
                </div>
              </div>

              {/* Renewal / Upgrade CTA */}
              {!isOwner && (
                <div className="p-4 bg-gradient-to-r from-slate-950 to-indigo-950/40 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                      <span>{activeAccess ? "Extend 30-Day Subscription" : "Upgrade to 30-Day All-Access ($9.99)"}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Secure checkout with PayPal or card. Instant contact unmasking.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onOpenCheckout) onOpenCheckout();
                    }}
                    className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black py-2.5 px-4 rounded-xl cursor-pointer transition-all shadow-md text-xs flex items-center justify-center gap-1.5 flex-shrink-0"
                    id="btn-status-upgrade-pass"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>{activeAccess ? "Extend Pass ($9.99)" : "Get 30-Day Pass ($9.99)"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CHANGE PASSWORD */}
          {activeTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4" id="form-change-password">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-400" />
                    Account Security & Password
                  </span>
                  <span className="text-[10px] text-slate-500">Min. 4 characters</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter your new password"
                        className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm your new password"
                        className="w-full p-2.5 pr-10 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400">
                  Updating your password will sync across your saved account profile and allow you to log back in anytime from any browser.
                </p>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-black py-2.5 px-5 rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2 text-xs"
                  id="btn-submit-change-password"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
}
