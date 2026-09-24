import React, { useState, useEffect, useMemo } from "react";
import { AvailableBand } from "../types";
import { 
  getMergedBandsList, 
  saveOwnerBandEdit, 
  deleteOwnerBandEntry, 
  getOwnerBandEdits, 
  getOwnerDeletedBandIds,
  getMergedVenuesList,
  AUTHORIZED_OWNER_EMAIL 
} from "../utils/directoryStore";
import { 
  Search, Edit3, Trash2, Plus, Music, MapPin, Mail, Phone, 
  Globe, Sparkles, Check, X, ShieldCheck, AlertCircle, RefreshCw,
  Award, Filter, ChevronLeft, ChevronRight, AlertTriangle,
  Headphones, FileText, ExternalLink, FileSpreadsheet, Download, Lock, Video, Users
} from "lucide-react";
import { sanitizeInputText } from "../utils/antiScrape";
import { resolveMostRelevantBandLink } from "../utils/musicLinks";
import ExportDirectoryModal from "./ExportDirectoryModal";

interface AdminBandManagerProps {
  userEmail?: string;
}

export default function AdminBandManager({ userEmail }: AdminBandManagerProps) {
  const isOwner = userEmail?.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase();

  const [bands, setBands] = useState<AvailableBand[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("All");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedLevel, setSelectedLevel] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Editing modal state
  const [editingBand, setEditingBand] = useState<AvailableBand | null>(null);
  const [isNewBand, setIsNewBand] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    genres: "",
    city: "",
    experienceLevel: "Local" as "Local" | "Regional Tour" | "National Act",
    bio: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    epkUrl: "",
    musicUrl: ""
  });

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmBand, setDeleteConfirmBand] = useState<AvailableBand | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  const venues = useMemo(() => getMergedVenuesList(), [refreshTrigger]);

  // Load all bands
  useEffect(() => {
    const list = getMergedBandsList();
    setBands(list);

    const handleUpdate = () => {
      setBands(getMergedBandsList());
    };
    window.addEventListener("giglizard_bands_updated", handleUpdate);
    return () => window.removeEventListener("giglizard_bands_updated", handleUpdate);
  }, [refreshTrigger]);

  const ownerEditsMap = useMemo(() => getOwnerBandEdits(), [bands, refreshTrigger]);

  // Extract unique genres & states
  const availableStates = useMemo(() => {
    const statesSet = new Set<string>();
    bands.forEach(b => {
      if (b.city) {
        const parts = b.city.split(",");
        if (parts.length > 1) {
          const stateCode = parts[parts.length - 1].trim().toUpperCase();
          if (stateCode.length >= 2) statesSet.add(stateCode);
        }
      }
    });
    return ["All", ...Array.from(statesSet).sort()];
  }, [bands]);

  const availableGenres = useMemo(() => {
    const genreSet = new Set<string>();
    bands.forEach(b => {
      if (Array.isArray(b.genres)) {
        b.genres.forEach(g => {
          if (g && g.trim()) genreSet.add(g.trim());
        });
      }
    });
    return ["All", ...Array.from(genreSet).sort().slice(0, 20)];
  }, [bands]);

  // Filter bands
  const filteredBands = useMemo(() => {
    return bands.filter(band => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = band.name.toLowerCase().includes(q);
        const matchesCity = band.city?.toLowerCase().includes(q);
        const matchesEmail = band.contactEmail?.toLowerCase().includes(q);
        const matchesBio = band.bio?.toLowerCase().includes(q);
        const matchesGenre = band.genres?.some(g => g.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesEmail && !matchesBio && !matchesGenre) {
          return false;
        }
      }

      // State
      if (selectedState !== "All") {
        if (!band.city?.toUpperCase().includes(selectedState)) {
          return false;
        }
      }

      // Genre
      if (selectedGenre !== "All") {
        if (!band.genres?.some(g => g.toLowerCase() === selectedGenre.toLowerCase())) {
          return false;
        }
      }

      // Level
      if (selectedLevel !== "All") {
        if (band.experienceLevel !== selectedLevel) {
          return false;
        }
      }

      return true;
    });
  }, [bands, searchTerm, selectedState, selectedGenre, selectedLevel]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredBands.length / itemsPerPage));
  const paginatedBands = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBands.slice(start, start + itemsPerPage);
  }, [filteredBands, currentPage]);

  const handleOpenEdit = (band: AvailableBand) => {
    setIsNewBand(false);
    setEditingBand(band);
    setEditFormData({
      id: band.id,
      name: band.name,
      genres: Array.isArray(band.genres) ? band.genres.join(", ") : "",
      city: band.city || "Seattle, WA",
      experienceLevel: band.experienceLevel || "Local",
      bio: band.bio || "",
      contactEmail: band.contactEmail || "",
      contactPhone: band.contactPhone || "",
      website: band.website || "",
      epkUrl: band.epkUrl || "",
      musicUrl: band.musicUrl || ""
    });
    setStatusMessage(null);
  };

  const handleOpenCreate = () => {
    setIsNewBand(true);
    setEditingBand({
      id: `band-owner-${Date.now()}`,
      name: "",
      genres: ["Alternative Rock"],
      city: "Seattle, WA",
      experienceLevel: "Local",
      bio: "Live performance act.",
      contactEmail: "",
      contactPhone: "(206) 555-0199",
      website: "",
      epkUrl: "",
      musicUrl: ""
    });
    setEditFormData({
      id: `band-owner-${Date.now()}`,
      name: "",
      genres: "Alternative Rock, Indie",
      city: "Seattle, WA",
      experienceLevel: "Local",
      bio: "Live performing act based in the Pacific Northwest.",
      contactEmail: "",
      contactPhone: "(206) 555-0199",
      website: "",
      epkUrl: "",
      musicUrl: ""
    });
    setStatusMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      setStatusMessage({ type: "error", text: "Unauthorized: Only littlerusty@gmail.com can save band edits." });
      return;
    }

    const cleanName = sanitizeInputText(editFormData.name, 100);
    const cleanCity = sanitizeInputText(editFormData.city, 100);
    const cleanBio = sanitizeInputText(editFormData.bio, 500);
    const cleanEmail = sanitizeInputText(editFormData.contactEmail, 100);
    const cleanPhone = sanitizeInputText(editFormData.contactPhone, 50);
    const cleanWebsite = sanitizeInputText(editFormData.website, 120);
    const cleanEpkUrl = sanitizeInputText(editFormData.epkUrl, 250);
    const cleanMusicUrl = sanitizeInputText(editFormData.musicUrl, 250);

    if (!cleanName.trim()) {
      setStatusMessage({ type: "error", text: "Band Name is required." });
      return;
    }

    const parsedGenres = editFormData.genres
      .split(",")
      .map(g => sanitizeInputText(g.trim(), 40))
      .filter(Boolean);

    const updatedBandObj: AvailableBand = {
      id: editFormData.id || `band-${Date.now()}`,
      name: cleanName,
      city: cleanCity || "Seattle, WA",
      genres: parsedGenres.length > 0 ? parsedGenres : ["Alternative Rock"],
      experienceLevel: editFormData.experienceLevel,
      bio: cleanBio || "Live touring act.",
      contactEmail: cleanEmail,
      contactPhone: cleanPhone || "(206) 555-0199",
      website: cleanWebsite || undefined,
      epkUrl: cleanEpkUrl || undefined,
      musicUrl: cleanMusicUrl || undefined
    };

    const res = saveOwnerBandEdit(updatedBandObj, userEmail);

    if (res.success) {
      setStatusMessage({ type: "success", text: `Successfully saved changes for "${updatedBandObj.name}".` });
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => {
        setEditingBand(null);
        setStatusMessage(null);
      }, 1200);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to save changes." });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmBand) return;

    if (!isOwner) {
      setStatusMessage({ type: "error", text: "Unauthorized: Only littlerusty@gmail.com can remove bands." });
      return;
    }

    const res = deleteOwnerBandEntry(deleteConfirmBand.id, deleteConfirmBand.name, userEmail);
    if (res.success) {
      setStatusMessage({ type: "success", text: `Band "${deleteConfirmBand.name}" removed from directory.` });
      setDeleteConfirmBand(null);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to delete band." });
    }
  };

  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white border border-rose-200 rounded-3xl shadow-xl text-center space-y-4">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Denied</h2>
        <p className="text-sm text-slate-600 leading-relaxed">
          The Band Directory Editor is strictly restricted to <strong className="text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">{AUTHORIZED_OWNER_EMAIL}</strong> only. No other users are permitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-band-manager-root">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Owner Band Directory Editor
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Live Total: <strong className="text-white">{bands.length.toLocaleString()} Bands</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Manage & Edit Band Directory</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Direct database modification engine for <strong className="text-amber-300">{AUTHORIZED_OWNER_EMAIL}</strong>. Edit contact info, tour level, genres, and bios for any band across all regions.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {userEmail?.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              id="owner-export-directory-btn"
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
              title="Download complete directory spreadsheet (.xlsx with Bands & Venues tabs, or PDF)"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>Export Directory (Excel / PDF)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setRefreshTrigger(r => r + 1)}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            id="owner-add-band-btn"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add New Band</span>
          </button>
        </div>
      </div>

      {/* Global Action Message */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2.5 ${
          statusMessage.type === "success" 
            ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
            : "bg-rose-50 text-rose-900 border-rose-200"
        }`}>
          {statusMessage.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Search & Filter Strip */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search band name, email, city..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* State Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">State:</label>
            <select
              value={selectedState}
              onChange={(e) => {
                setSelectedState(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableStates.map(st => (
                <option key={st} value={st}>{st === "All" ? "All States & Regions" : st}</option>
              ))}
            </select>
          </div>

          {/* Genre Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Genre:</label>
            <select
              value={selectedGenre}
              onChange={(e) => {
                setSelectedGenre(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableGenres.map(g => (
                <option key={g} value={g}>{g === "All" ? "All Genres" : g}</option>
              ))}
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Tour Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => {
                setSelectedLevel(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Experience Levels</option>
              <option value="Local">Local</option>
              <option value="Regional Tour">Regional Tour</option>
              <option value="National Act">National Act</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong className="text-slate-900 font-bold">{filteredBands.length}</strong> matching artists</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Bands Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Band Name & Status</th>
                <th className="py-3 px-4">Genres</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Experience Level</th>
                <th className="py-3 px-4">Direct Contact & Web</th>
                <th className="py-3 px-4 text-right">Owner Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedBands.map((band) => {
                const isModified = Boolean(ownerEditsMap[band.id] || ownerEditsMap[band.name.toLowerCase()]);

                return (
                  <tr key={band.id || band.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <Music className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{band.name}</span>
                        {isModified && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            Edited by Owner
                          </span>
                        )}
                      </div>
                      {band.bio && (
                        <p className="text-[11px] text-slate-500 truncate max-w-[240px] mt-0.5" title={band.bio}>
                          {band.bio}
                        </p>
                      )}
                      {(() => {
                        const primaryLink = resolveMostRelevantBandLink(band);
                        return (
                          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                            <a
                              href={primaryLink.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer border ${
                                primaryLink.type === "epk"
                                  ? "text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200"
                                  : primaryLink.type === "website"
                                  ? "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200"
                                  : primaryLink.type === "bandcamp"
                                  ? "text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border-cyan-200"
                                  : primaryLink.type === "youtube"
                                  ? "text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200"
                                  : primaryLink.type === "spotify"
                                  ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
                                  : primaryLink.type === "facebook"
                                  ? "text-sky-700 bg-sky-50 hover:bg-sky-100 border-sky-200"
                                  : "text-slate-700 bg-slate-50 hover:bg-slate-100 border-slate-200"
                              }`}
                              title={`Open ${band.name}'s ${primaryLink.badge} link`}
                            >
                              {primaryLink.type === "epk" && <FileText className="w-2.5 h-2.5" />}
                              {primaryLink.type === "website" && <Globe className="w-2.5 h-2.5" />}
                              {primaryLink.type === "bandcamp" && <Headphones className="w-2.5 h-2.5" />}
                              {primaryLink.type === "youtube" && <Video className="w-2.5 h-2.5" />}
                              {primaryLink.type === "spotify" && <Music className="w-2.5 h-2.5" />}
                              {primaryLink.type === "facebook" && <Users className="w-2.5 h-2.5" />}
                              {primaryLink.type === "other" && <ExternalLink className="w-2.5 h-2.5" />}
                              <span>{primaryLink.badge}</span>
                              <ExternalLink className="w-2 h-2 opacity-60" />
                            </a>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {Array.isArray(band.genres) && band.genres.slice(0, 3).map((g, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{band.city || "Seattle, WA"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        band.experienceLevel === "National Act"
                          ? "bg-purple-100 text-purple-800 border border-purple-300"
                          : band.experienceLevel === "Regional Tour"
                          ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}>
                        <Award className="w-3 h-3" />
                        {band.experienceLevel || "Local"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        {band.contactEmail ? (
                          <div className="flex items-center gap-1 text-indigo-600">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{band.contactEmail}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No email listed</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(band)}
                          id={`edit-band-btn-${band.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold rounded-lg text-xs transition-all border border-indigo-200 flex items-center gap-1 cursor-pointer"
                          title="Edit Band Information"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmBand(band)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 font-extrabold rounded-lg transition-all cursor-pointer"
                          title="Remove Band"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedBands.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm">No bands match the selected search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="font-extrabold text-slate-700">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Edit / Create Band Modal */}
      {editingBand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-600 border border-amber-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isNewBand ? "Add New Band (Owner)" : `Edit Band: ${editingBand.name}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifications are saved with Master Owner privileges (<strong className="text-amber-700">{AUTHORIZED_OWNER_EMAIL}</strong>).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingBand(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {statusMessage && (
              <div className={`p-3 rounded-xl border text-xs font-bold ${
                statusMessage.type === "success" 
                  ? "bg-emerald-50 text-emerald-900 border-emerald-200" 
                  : "bg-rose-50 text-rose-900 border-rose-200"
              }`}>
                {statusMessage.text}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Band / Artist Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g. Dr Hadit"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">City & State *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value })}
                    placeholder="e.g. Seattle, WA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Experience / Touring Level</label>
                  <select
                    value={editFormData.experienceLevel}
                    onChange={(e) => setEditFormData({ ...editFormData, experienceLevel: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="Local">Local Act</option>
                    <option value="Regional Tour">Regional Touring Artist</option>
                    <option value="National Act">National Act</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Genres (Comma separated)</label>
                  <input
                    type="text"
                    value={editFormData.genres}
                    onChange={(e) => setEditFormData({ ...editFormData, genres: e.target.value })}
                    placeholder="e.g. Indie Rock, Post-Punk, Shoegaze"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Direct Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.contactEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                    placeholder="booking@banddomain.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Direct Phone Number</label>
                  <input
                    type="text"
                    value={editFormData.contactPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, contactPhone: e.target.value })}
                    placeholder="(206) 555-0142"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Official Website</label>
                  <input
                    type="text"
                    value={editFormData.website}
                    onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                    placeholder="e.g. www.bandwebsite.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Electronic Press Kit (EPK) URL</span>
                    </label>
                    {editFormData.epkUrl && (
                      <a
                        href={editFormData.epkUrl.startsWith("http") ? editFormData.epkUrl : `https://${editFormData.epkUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5"
                      >
                        <span>Test EPK</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={editFormData.epkUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, epkUrl: e.target.value })}
                    placeholder="e.g. https://epk.bandzoogle.com/band or Sonicbids / Google Drive press kit"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10.5px] text-slate-500">
                    Links to the band's EPK. Displayed as a "View EPK" button on the band's profile.
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-700 flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Online Music Streaming URL ("Listen" Button)</span>
                    </label>
                    {editFormData.musicUrl && (
                      <a
                        href={editFormData.musicUrl.startsWith("http") ? editFormData.musicUrl : `https://${editFormData.musicUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
                      >
                        <span>Test Listen</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                  <input
                    type="url"
                    value={editFormData.musicUrl}
                    onChange={(e) => setEditFormData({ ...editFormData, musicUrl: e.target.value })}
                    placeholder="e.g. https://bandname.bandcamp.com or Spotify artist link"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                  <p className="text-[10.5px] text-slate-500">
                    Direct music streaming link. If left blank, the system automatically finds online music on Bandcamp/Spotify by artist name.
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Artist Bio & Description</label>
                  <textarea
                    rows={3}
                    value={editFormData.bio}
                    onChange={(e) => setEditFormData({ ...editFormData, bio: e.target.value })}
                    placeholder="Describe band sound, performance style, notable releases..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingBand(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-band-changes-btn"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Save Band Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmBand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Remove Band from Directory</h4>
                <p className="text-slate-500 font-medium">Are you sure you want to remove this band?</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <p className="font-extrabold text-slate-900">{deleteConfirmBand.name}</p>
              <p className="text-slate-500">{deleteConfirmBand.city} • {deleteConfirmBand.genres?.join(", ")}</p>
              <p className="text-[11px] font-mono text-slate-600">{deleteConfirmBand.contactEmail}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBand(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Removal</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Export Directory Modal (Excel .xlsx with Bands & Venues tabs, or PDF) */}
      <ExportDirectoryModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        bands={bands}
        venues={venues}
        userEmail={userEmail}
      />
    </div>
  );
}
