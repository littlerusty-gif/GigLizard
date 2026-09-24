import React, { useState } from "react";
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Building2, 
  Mail, 
  Phone, 
  ExternalLink,
  Layers,
  Lock,
  ShieldAlert,
  ShieldCheck
} from "lucide-react";
import { AvailableBand, Venue } from "../types";
import { downloadDirectoryExcel, downloadVenuesPDF, downloadBandsPDF } from "../utils/exportSpreadsheet";

const AUTHORIZED_OWNER_EMAIL = "littlerusty@gmail.com";

interface ExportDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  bands: AvailableBand[];
  venues: Venue[];
  userEmail?: string;
}

export default function ExportDirectoryModal({
  isOpen,
  onClose,
  bands,
  venues,
  userEmail
}: ExportDirectoryModalProps) {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const isAuthorized = userEmail?.trim().toLowerCase() === AUTHORIZED_OWNER_EMAIL;

  if (!isOpen) return null;

  if (!isAuthorized) {
    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
        onClick={onClose}
        id="unauthorized-export-modal"
      >
        <div 
          className="bg-white rounded-3xl max-w-md w-full p-7 text-center shadow-2xl border border-red-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">Owner-Restricted Files</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            These files and contact spreadsheets are strictly confidential and only available to <strong className="text-slate-900">{AUTHORIZED_OWNER_EMAIL}</strong> in the Owner Dashboard. Other users are not permitted to view or download these records.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    );
  }

  const handleDownloadExcel = async () => {
    if (!isAuthorized) return;
    try {
      setDownloading("excel");
      setDownloadSuccess(null);
      // Small timeout to allow UI spinner
      setTimeout(() => {
        downloadDirectoryExcel(bands, venues, "GigLizard_Directory_Bands_and_Venues.xlsx", userEmail);
        setDownloading(null);
        setDownloadSuccess("Excel spreadsheet (.xlsx) downloaded successfully!");
      }, 150);
    } catch (err) {
      console.error(err);
      setDownloading(null);
    }
  };

  const handleDownloadVenuesPDF = async () => {
    if (!isAuthorized) return;
    try {
      setDownloading("venues-pdf");
      setDownloadSuccess(null);
      setTimeout(() => {
        downloadVenuesPDF(venues, "GigLizard_Venues_Directory.pdf", userEmail);
        setDownloading(null);
        setDownloadSuccess("Venues Directory PDF downloaded successfully!");
      }, 150);
    } catch (err) {
      console.error(err);
      setDownloading(null);
    }
  };

  const handleDownloadBandsPDF = async () => {
    if (!isAuthorized) return;
    try {
      setDownloading("bands-pdf");
      setDownloadSuccess(null);
      setTimeout(() => {
        downloadBandsPDF(bands, "GigLizard_Bands_Directory.pdf", userEmail);
        setDownloading(null);
        setDownloadSuccess("Bands Directory PDF downloaded successfully!");
      }, 150);
    } catch (err) {
      console.error(err);
      setDownloading(null);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
      id="export-modal-backdrop"
    >
      <div 
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 transform transition-all"
        onClick={(e) => e.stopPropagation()}
        id="export-modal-content"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-7 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
            title="Close"
            id="close-export-modal-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="text-emerald-400 font-bold text-xs uppercase tracking-wider">Directory Export Center</span>
              <h2 className="text-xl sm:text-2xl font-black text-white">Download Contacts & Roster</h2>
            </div>
          </div>
          <p className="text-slate-300 text-sm mt-2 max-w-xl">
            Export the complete GigLizard database. Includes all bands and venues with unmasked booking contact emails, phone numbers, and technical specifications.
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-7 space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-emerald-950">{bands.length.toLocaleString()}</div>
                <div className="text-xs font-semibold text-emerald-700">Bands & Artists</div>
              </div>
            </div>

            <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center gap-3">
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black text-indigo-950">{venues.length.toLocaleString()}</div>
                <div className="text-xs font-semibold text-indigo-700">Live Music Venues</div>
              </div>
            </div>
          </div>

          {/* Success Banner */}
          {downloadSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2.5 text-emerald-800 text-xs font-semibold animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{downloadSuccess}</span>
            </div>
          )}

          {/* Option 1: Multi-Tab Excel Spreadsheet (Primary requested format) */}
          <div className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50 p-5 rounded-2xl relative overflow-hidden shadow-xs hover:border-emerald-500 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Recommended & Official</span>
                </div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  <span>Master Excel Spreadsheet (.xlsx)</span>
                </h3>
                <p className="text-xs text-slate-600 max-w-md">
                  Single workbook with <strong>Tab 1: Bands</strong> (with contact emails & genres) and <strong>Tab 2: Venues</strong> (with contact emails & capacity specs).
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <Layers className="w-3 h-3 text-emerald-600" />
                    <span>2 Organized Tabs</span>
                  </span>
                  <span>•</span>
                  <span>Microsoft Excel / Google Sheets</span>
                </div>
              </div>

              <button
                onClick={handleDownloadExcel}
                disabled={downloading === "excel"}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black text-white bg-emerald-600 hover:bg-emerald-500 active:scale-98 shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                id="download-master-excel-btn"
              >
                {downloading === "excel" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-white" />
                    <span>Download Excel</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option 2: PDF Downloads (Secondary request if user prefers separate files) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>Separate PDF Files (Ready to Print & View)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* PDF 1: Venues */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      Venues Only
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{venues.length} records</span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Venues Directory (PDF)</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Lists all Pacific Northwest & national venues with contact email, address, capacity, and house PA specs.
                  </p>
                </div>

                <button
                  onClick={handleDownloadVenuesPDF}
                  disabled={downloading === "venues-pdf"}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                  id="download-venues-pdf-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Venues PDF</span>
                </button>
              </div>

              {/* PDF 2: Bands */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/80 transition-all flex flex-col justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                      Bands Only
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">{bands.length} records</span>
                  </div>
                  <h5 className="font-bold text-slate-900 text-sm">Bands Directory (PDF)</h5>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Complete artist contact roster with emails, genres, touring levels, and hometowns.
                  </p>
                </div>

                <button
                  onClick={handleDownloadBandsPDF}
                  disabled={downloading === "bands-pdf"}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer disabled:opacity-50"
                  id="download-bands-pdf-btn"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Bands PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Direct Link fallback */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Direct Server Download:</span>
            <a 
              href={`/api/export/directory.xlsx?email=${encodeURIComponent(userEmail || "")}`} 
              download="GigLizard_Directory_Bands_and_Venues.xlsx"
              className="inline-flex items-center gap-1 font-bold text-indigo-600 hover:text-indigo-800 hover:underline"
              id="direct-server-excel-link"
            >
              <span>/api/export/directory.xlsx</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
