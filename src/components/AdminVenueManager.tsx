import React, { useState, useEffect, useMemo } from "react";
import { Venue } from "../types";
import { 
  getMergedVenuesList, 
  saveOwnerVenueEdit, 
  deleteOwnerVenueEntry, 
  getOwnerVenueEdits, 
  getOwnerDeletedVenueIds,
  getMergedBandsList,
  AUTHORIZED_OWNER_EMAIL 
} from "../utils/directoryStore";
import { 
  Search, Edit3, Trash2, Plus, Building, MapPin, Mail, Phone, 
  Globe, Sparkles, Check, X, ShieldCheck, AlertCircle, RefreshCw,
  Users, Sliders, Volume2, Sun, ChevronLeft, ChevronRight, AlertTriangle,
  FileSpreadsheet, Lock
} from "lucide-react";
import { sanitizeInputText } from "../utils/antiScrape";
import ExportDirectoryModal from "./ExportDirectoryModal";

interface AdminVenueManagerProps {
  userEmail?: string;
}

export default function AdminVenueManager({ userEmail }: AdminVenueManagerProps) {
  const isOwner = userEmail?.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase();

  const [venues, setVenues] = useState<Venue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedCapFilter, setSelectedCapFilter] = useState("All");
  const [selectedProduction, setSelectedProduction] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Editing modal state
  const [editingVenue, setEditingVenue] = useState<Venue | null>(null);
  const [isNewVenue, setIsNewVenue] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: "",
    name: "",
    capacity: 200,
    address: "",
    city: "Seattle, WA",
    genres: "Live Music",
    contactEmail: "",
    contactPhone: "",
    description: "",
    website: "",
    hasPA: true,
    hasLighting: true
  });

  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmVenue, setDeleteConfirmVenue] = useState<Venue | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showExportModal, setShowExportModal] = useState(false);

  const bands = useMemo(() => getMergedBandsList(), [refreshTrigger]);

  // Load all venues
  useEffect(() => {
    const list = getMergedVenuesList();
    setVenues(list);

    const handleUpdate = () => {
      setVenues(getMergedVenuesList());
    };
    window.addEventListener("giglizard_venues_updated", handleUpdate);
    return () => window.removeEventListener("giglizard_venues_updated", handleUpdate);
  }, [refreshTrigger]);

  const ownerEditsMap = useMemo(() => getOwnerVenueEdits(), [venues, refreshTrigger]);

  // Extract cities
  const availableCities = useMemo(() => {
    const citySet = new Set<string>();
    venues.forEach(v => {
      if (v.city && v.city.trim()) {
        citySet.add(v.city.trim());
      }
    });
    return ["All", ...Array.from(citySet).sort()];
  }, [venues]);

  // Filter venues
  const filteredVenues = useMemo(() => {
    return venues.filter(venue => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = venue.name.toLowerCase().includes(q);
        const matchesCity = venue.city?.toLowerCase().includes(q);
        const matchesAddress = venue.address?.toLowerCase().includes(q);
        const matchesEmail = venue.contactEmail?.toLowerCase().includes(q);
        const matchesDesc = venue.description?.toLowerCase().includes(q);
        const matchesGenre = venue.genres?.some(g => g.toLowerCase().includes(q));
        if (!matchesName && !matchesCity && !matchesAddress && !matchesEmail && !matchesDesc && !matchesGenre) {
          return false;
        }
      }

      // City
      if (selectedCity !== "All") {
        if (venue.city?.trim() !== selectedCity.trim()) {
          return false;
        }
      }

      // Capacity
      if (selectedCapFilter === "small" && (venue.capacity || 0) >= 200) return false;
      if (selectedCapFilter === "medium" && ((venue.capacity || 0) < 200 || (venue.capacity || 0) > 500)) return false;
      if (selectedCapFilter === "large" && (venue.capacity || 0) <= 500) return false;

      // Production
      if (selectedProduction === "pa" && !venue.hasPA) return false;
      if (selectedProduction === "lighting" && !venue.hasLighting) return false;
      if (selectedProduction === "both" && (!venue.hasPA || !venue.hasLighting)) return false;

      return true;
    });
  }, [venues, searchTerm, selectedCity, selectedCapFilter, selectedProduction]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredVenues.length / itemsPerPage));
  const paginatedVenues = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredVenues.slice(start, start + itemsPerPage);
  }, [filteredVenues, currentPage]);

  const handleOpenEdit = (venue: Venue) => {
    setIsNewVenue(false);
    setEditingVenue(venue);
    setEditFormData({
      id: venue.id,
      name: venue.name,
      capacity: venue.capacity || 200,
      address: venue.address || "",
      city: venue.city || "Seattle, WA",
      genres: Array.isArray(venue.genres) ? venue.genres.join(", ") : "Live Music",
      contactEmail: venue.contactEmail || "",
      contactPhone: venue.contactPhone || "",
      description: venue.description || "",
      website: venue.website || "",
      hasPA: venue.hasPA ?? true,
      hasLighting: venue.hasLighting ?? true
    });
    setStatusMessage(null);
  };

  const handleOpenCreate = () => {
    setIsNewVenue(true);
    setEditingVenue({
      id: `venue-owner-${Date.now()}`,
      name: "",
      capacity: 250,
      address: "100 Pike St",
      city: "Seattle, WA",
      genres: ["Indie Rock", "Alternative Rock"],
      contactEmail: "",
      contactPhone: "(206) 555-0142",
      description: "[Capacity: 250 guests] Live performance concert hall.",
      website: "www.venuebooking.com",
      hasPA: true,
      hasLighting: true
    });
    setEditFormData({
      id: `venue-owner-${Date.now()}`,
      name: "",
      capacity: 250,
      address: "100 Pike St",
      city: "Seattle, WA",
      genres: "Indie Rock, Alternative Rock, Punk",
      contactEmail: "",
      contactPhone: "(206) 555-0142",
      description: "[Capacity: 250 guests] Live music stage and club with full PA and lighting rig.",
      website: "www.venuebooking.com",
      hasPA: true,
      hasLighting: true
    });
    setStatusMessage(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isOwner) {
      setStatusMessage({ type: "error", text: "Unauthorized: Only littlerusty@gmail.com can save venue edits." });
      return;
    }

    const cleanName = sanitizeInputText(editFormData.name, 100);
    const cleanAddress = sanitizeInputText(editFormData.address, 150);
    const cleanCity = sanitizeInputText(editFormData.city, 100);
    const cleanDesc = sanitizeInputText(editFormData.description, 500);
    const cleanEmail = sanitizeInputText(editFormData.contactEmail, 100);
    const cleanPhone = sanitizeInputText(editFormData.contactPhone, 50);
    const cleanWebsite = sanitizeInputText(editFormData.website, 120);

    if (!cleanName.trim()) {
      setStatusMessage({ type: "error", text: "Venue Name is required." });
      return;
    }

    const parsedGenres = editFormData.genres
      .split(",")
      .map(g => sanitizeInputText(g.trim(), 40))
      .filter(Boolean);

    const updatedVenueObj: Venue = {
      id: editFormData.id || `venue-${Date.now()}`,
      name: cleanName,
      capacity: Number(editFormData.capacity) || 150,
      address: cleanAddress || "123 Music Ave",
      city: cleanCity || "Seattle, WA",
      genres: parsedGenres.length > 0 ? parsedGenres : ["Live Music"],
      contactEmail: cleanEmail,
      contactPhone: cleanPhone || "(206) 555-0142",
      description: cleanDesc || `[Capacity: ${editFormData.capacity} guests] Live performance space.`,
      website: cleanWebsite || "www.inquire-booking.com",
      hasPA: Boolean(editFormData.hasPA),
      hasLighting: Boolean(editFormData.hasLighting)
    };

    const res = saveOwnerVenueEdit(updatedVenueObj, userEmail);

    if (res.success) {
      setStatusMessage({ type: "success", text: `Successfully saved changes for "${updatedVenueObj.name}".` });
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => {
        setEditingVenue(null);
        setStatusMessage(null);
      }, 1200);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to save changes." });
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmVenue) return;

    if (!isOwner) {
      setStatusMessage({ type: "error", text: "Unauthorized: Only littlerusty@gmail.com can remove venues." });
      return;
    }

    const res = deleteOwnerVenueEntry(deleteConfirmVenue.id, deleteConfirmVenue.name, userEmail);
    if (res.success) {
      setStatusMessage({ type: "success", text: `Venue "${deleteConfirmVenue.name}" removed from directory.` });
      setDeleteConfirmVenue(null);
      setRefreshTrigger(prev => prev + 1);
      setTimeout(() => setStatusMessage(null), 3000);
    } else {
      setStatusMessage({ type: "error", text: res.error || "Failed to delete venue." });
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
          The Venue Directory Editor is strictly restricted to <strong className="text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">{AUTHORIZED_OWNER_EMAIL}</strong> only. No other users are permitted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="admin-venue-manager-root">
      {/* Top Banner & Quick Controls */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-7 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[11px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Owner Venue Directory Editor
            </span>
            <span className="text-xs text-slate-400 font-semibold">
              Live Total: <strong className="text-white">{venues.length.toLocaleString()} Venues</strong>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <span>Manage & Edit Venue Directory</span>
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Direct database modification engine for <strong className="text-amber-300">{AUTHORIZED_OWNER_EMAIL}</strong>. Edit capacities, booking contacts, addresses, production specs, and stage info for all venues.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {userEmail?.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL && (
            <button
              type="button"
              onClick={() => setShowExportModal(true)}
              id="owner-export-venues-btn"
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
            id="owner-add-venue-btn"
            className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Add New Venue</span>
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
              placeholder="Search venue name, address, email..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>

          {/* City Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">City:</label>
            <select
              value={selectedCity}
              onChange={(e) => {
                setSelectedCity(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {availableCities.map(c => (
                <option key={c} value={c}>{c === "All" ? "All Cities & Regions" : c}</option>
              ))}
            </select>
          </div>

          {/* Capacity Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Capacity:</label>
            <select
              value={selectedCapFilter}
              onChange={(e) => {
                setSelectedCapFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Sizes</option>
              <option value="small">Under 200 (Intimate / DIY)</option>
              <option value="medium">200 - 500 (Mid-Sized Club)</option>
              <option value="large">500+ (Concert Hall / Theater)</option>
            </select>
          </div>

          {/* Production Rig Filter */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0">Rig:</label>
            <select
              value={selectedProduction}
              onChange={(e) => {
                setSelectedProduction(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="All">All Production Types</option>
              <option value="pa">Has PA System</option>
              <option value="lighting">Has Stage Lighting</option>
              <option value="both">Full PA & Lighting</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>Showing <strong className="text-slate-900 font-bold">{filteredVenues.length}</strong> matching music venues</span>
          <span>Page {currentPage} of {totalPages}</span>
        </div>
      </div>

      {/* Venues Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[580px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
              <tr className="text-[11px] font-black uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">Venue & Capacity</th>
                <th className="py-3 px-4">Location & Address</th>
                <th className="py-3 px-4">Genres / Style</th>
                <th className="py-3 px-4">Production Specs</th>
                <th className="py-3 px-4">Direct Contact & Web</th>
                <th className="py-3 px-4 text-right">Owner Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedVenues.map((venue) => {
                const isModified = Boolean(ownerEditsMap[venue.id] || ownerEditsMap[venue.name.toLowerCase()]);

                return (
                  <tr key={venue.id || venue.name} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 flex items-center gap-2">
                        <Building className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>{venue.name}</span>
                        {isModified && (
                          <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-black px-1.5 py-0.2 rounded-md">
                            Edited by Owner
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-md text-[10px] font-black">
                          <Users className="w-3 h-3" />
                          {venue.capacity} cap
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-slate-900 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{venue.city}</span>
                        </div>
                        {venue.address && (
                          <p className="text-[11px] text-slate-500 truncate max-w-[200px]" title={venue.address}>
                            {venue.address}
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {Array.isArray(venue.genres) && venue.genres.slice(0, 3).map((g, idx) => (
                          <span key={idx} className="bg-slate-100 text-slate-700 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                            {g}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          venue.hasPA 
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          <Volume2 className="w-3 h-3" />
                          {venue.hasPA ? "PA Ready" : "No House PA"}
                        </span>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          venue.hasLighting 
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-200" 
                            : "bg-slate-100 text-slate-400"
                        }`}>
                          <Sun className="w-3 h-3" />
                          {venue.hasLighting ? "Stage Lights" : "No Lights"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5 font-mono text-[11px]">
                        {venue.contactEmail && (
                          <div className="flex items-center gap-1 text-indigo-600">
                            <Mail className="w-3 h-3 shrink-0" />
                            <span className="truncate max-w-[180px]">{venue.contactEmail}</span>
                          </div>
                        )}
                        {venue.contactPhone && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 shrink-0 text-slate-400" />
                            <span>{venue.contactPhone}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(venue)}
                          id={`edit-venue-btn-${venue.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold rounded-lg text-xs transition-all border border-amber-300 flex items-center gap-1 cursor-pointer"
                          title="Edit Venue Information"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                          <span>Edit</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleteConfirmVenue(venue)}
                          className="p-1.5 hover:bg-rose-50 text-rose-500 hover:text-rose-700 font-extrabold rounded-lg transition-all cursor-pointer"
                          title="Remove Venue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {paginatedVenues.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Building className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-bold text-sm">No venues match the selected search criteria.</p>
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

      {/* Edit / Create Venue Modal */}
      {editingVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl text-amber-700 border border-amber-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isNewVenue ? "Add New Venue (Owner)" : `Edit Venue: ${editingVenue.name}`}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Modifications are saved with Master Owner privileges (<strong className="text-amber-700">{AUTHORIZED_OWNER_EMAIL}</strong>).
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingVenue(null)}
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
                  <label className="font-extrabold text-slate-700">Venue Name *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="e.g. The Showbox"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Audience Capacity *</label>
                  <input
                    type="number"
                    required
                    min={10}
                    max={20000}
                    value={editFormData.capacity}
                    onChange={(e) => setEditFormData({ ...editFormData, capacity: parseInt(e.target.value) || 0 })}
                    placeholder="250"
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
                    placeholder="Seattle, WA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Street Address *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    placeholder="1426 1st Ave, Seattle, WA 98101"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Genres / Music Styles (Comma separated)</label>
                  <input
                    type="text"
                    value={editFormData.genres}
                    onChange={(e) => setEditFormData({ ...editFormData, genres: e.target.value })}
                    placeholder="Indie Rock, Alternative, Punk, Folk"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Booking Contact Email</label>
                  <input
                    type="email"
                    value={editFormData.contactEmail}
                    onChange={(e) => setEditFormData({ ...editFormData, contactEmail: e.target.value })}
                    placeholder="booking@venue.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-extrabold text-slate-700">Booking Phone Number</label>
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
                    placeholder="www.venuename.com"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                {/* Production Toggles */}
                <div className="sm:col-span-2 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.hasPA}
                      onChange={(e) => setEditFormData({ ...editFormData, hasPA: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
                      In-House PA Sound System
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={editFormData.hasLighting}
                      onChange={(e) => setEditFormData({ ...editFormData, hasLighting: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                      Stage Lighting Rig
                    </span>
                  </label>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-extrabold text-slate-700">Venue Overview & Technical Specs</label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Stage dimensions, monitor setup, load-in directions, sound engineer details..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVenue(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="save-venue-changes-btn"
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 text-amber-400" />
                  <span>Save Venue Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmVenue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 bg-rose-50 rounded-2xl border border-rose-200">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900">Remove Venue from Directory</h4>
                <p className="text-slate-500 font-medium">Are you sure you want to remove this venue?</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
              <p className="font-extrabold text-slate-900">{deleteConfirmVenue.name}</p>
              <p className="text-slate-500">{deleteConfirmVenue.city} • Capacity: {deleteConfirmVenue.capacity}</p>
              <p className="text-[11px] font-mono text-slate-600">{deleteConfirmVenue.contactEmail}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmVenue(null)}
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
