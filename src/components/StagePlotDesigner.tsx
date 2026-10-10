import React, { useState, useRef, useEffect, useMemo } from "react";
import { StageElement, EquipmentType, InputChannel, BandProfile, UserAccount } from "../types";
import { 
  Plus, Trash2, RotateCw, Type, Save, FolderOpen, 
  HelpCircle, Trash, Sliders, Sparkles, AlertCircle, RefreshCw,
  Download, Share2, Check, ExternalLink, Printer, Link, FileText,
  Image as ImageIcon, Eye, Phone, Mail, MapPin, Calendar, Clock,
  Volume2, ShieldCheck, Zap, Radio, Layers
} from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { 
  saveBandStagePlotToDatabase, 
  fetchBandStagePlotFromDatabase, 
  uploadStagePlotToStorage, 
  updateBandStagePlotUrl 
} from "../lib/supabase";

interface StagePlotDesignerProps {
  elements: StageElement[];
  onUpdateElements: (elements: StageElement[]) => void;
  bandProfile?: BandProfile;
  currentAccount?: UserAccount | null;
  currentUser?: any;
  onTriggerLogin?: () => void;
  publicBandId?: string | null;
  onClearPublicView?: () => void;
}

const TOOLBOX_TEMPLATES: { type: EquipmentType; label: string; color: string; defaultMic: string }[] = [
  { type: "drum_kit", label: "Drum Kit", color: "bg-slate-800 text-white border-slate-700", defaultMic: "Beta 52 / SM57 Pack" },
  { type: "guitar_amp", label: "Guitar Amp", color: "bg-orange-500 text-white border-orange-600", defaultMic: "Shure SM57 / Sennheiser e906" },
  { type: "bass_amp", label: "Bass Rig", color: "bg-blue-600 text-white border-blue-700", defaultMic: "Active DI Box (XLR Direct)" },
  { type: "keyboard_rig", label: "Keyboard", color: "bg-purple-600 text-white border-purple-700", defaultMic: "Stereo Active DI Box" },
  { type: "vocal_mic", label: "Vocal Mic", color: "bg-rose-500 text-white border-rose-600", defaultMic: "Shure SM58 / Beta 58" },
  { type: "instrument_mic", label: "Inst. Mic", color: "bg-teal-600 text-white border-teal-700", defaultMic: "Shure SM57" },
  { type: "monitor_wedge", label: "Monitor Wedge", color: "bg-amber-500 text-neutral-900 border-amber-600", defaultMic: "Stage Monitor Line" },
  { type: "di_box", label: "DI Box", color: "bg-gray-400 text-slate-900 border-gray-500", defaultMic: "Direct Box (Radial / BSS)" },
  { type: "dj_turntables", label: "DJ Decks", color: "bg-violet-700 text-white border-violet-800", defaultMic: "Dual Stereo DI Box" },
];

const INITIAL_ROCKS: StageElement[] = [
  { id: "drum-1", type: "drum_kit", label: "Drums", x: 50, y: 22, rotation: 0 },
  { id: "monitor-drums", type: "monitor_wedge", label: "Drum Mix", x: 38, y: 30, rotation: 0 },
  { id: "lead-vocal-1", type: "vocal_mic", label: "Lead Vocal", x: 50, y: 66, rotation: 0 },
  { id: "monitor-center", type: "monitor_wedge", label: "Vocal Mix", x: 50, y: 82, rotation: 0 },
  { id: "guitar-amp-1", type: "guitar_amp", label: "Guitar Amp", x: 20, y: 34, rotation: 0 },
  { id: "monitor-guitar", type: "monitor_wedge", label: "Gtr Mix", x: 20, y: 72, rotation: 0 },
  { id: "bass-amp-1", type: "bass_amp", label: "Bass Rig", x: 80, y: 34, rotation: 0 },
  { id: "monitor-bass", type: "monitor_wedge", label: "Bass Mix", x: 80, y: 72, rotation: 0 }
];

const DEFAULT_INPUT_CHANNELS: InputChannel[] = [
  { channel: 1, instrument: "Kick Drum", micOrDi: "Shure Beta 52 / Audix D6", stand: "Short Boom", phantomPower: false, notes: "Gated, heavy punch" },
  { channel: 2, instrument: "Snare Top", micOrDi: "Shure SM57", stand: "Short Boom", phantomPower: false, notes: "Crisp top end, light reverb" },
  { channel: 3, instrument: "Hi-Hat", micOrDi: "Small Diaphragm Condenser", stand: "Short Boom", phantomPower: true, notes: "Gentle high-pass" },
  { channel: 4, instrument: "Bass Rig DI", micOrDi: "Active DI Box (Direct)", stand: "None", phantomPower: true, notes: "Pre-EQ balanced line" },
  { channel: 5, instrument: "Guitar Amp (Stage Left)", micOrDi: "Shure SM57 / Sennheiser e906", stand: "Short Boom", phantomPower: false, notes: "Centering cone, 30% pan left" },
  { channel: 6, instrument: "Lead Vocal (Center)", micOrDi: "Shure SM58 / Beta 58A", stand: "Tall Boom", phantomPower: false, notes: "Frontline wedge 1 priority foldback" },
  { channel: 7, instrument: "Backing Vocal (Bass/SL)", micOrDi: "Shure SM58", stand: "Tall Boom", phantomPower: false, notes: "Foldback to SL & Center wedges" },
  { channel: 8, instrument: "Backing Vocal (Drums)", micOrDi: "Shure SM58 / Headset", stand: "Tall Boom", phantomPower: false, notes: "Gated drum-vox foldback" }
];

export default function StagePlotDesigner({ 
  elements, 
  onUpdateElements,
  bandProfile,
  currentAccount,
  currentUser,
  onTriggerLogin,
  publicBandId,
  onClearPublicView
}: StagePlotDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const exportCardRef = useRef<HTMLDivElement>(null);
  
  // Dragging and editing state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [stageTheme, setStageTheme] = useState<"wood" | "cyber" | "starlight">("wood");
  
  // Channel Input List state
  const [inputChannels, setInputChannels] = useState<InputChannel[]>(DEFAULT_INPUT_CHANNELS);
  const [audioNotes, setAudioNotes] = useState<string>(
    "Band provides all instrument cables and specific vocal mics. Venue to provide 4 dedicated monitor mixes, drum riser if available, and two 120V quad-boxes at frontline and backline."
  );

  // Persistence, Export & Sharing state
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [stagePlotUrl, setStagePlotUrl] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTabSection, setActiveTabSection] = useState<"plot" | "patch" | "notes">("plot");
  
  // Toast notifications
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "success"
  });

  const dragOffset = useRef({ x: 0, y: 0 });

  // Effective Band identification
  const effectiveUserId = currentUser?.id || currentAccount?.id || null;
  const effectiveEmail = currentAccount?.contactEmail || currentUser?.email || bandProfile?.name ? `${(bandProfile?.name || "band").toLowerCase().replace(/\s+/g, "")}@giglizard.com` : null;
  const effectiveBandName = bandProfile?.name || currentAccount?.name || "Dr Hadit";
  const effectiveBandCity = bandProfile?.city || currentAccount?.city || "Seattle, WA";
  const effectiveBandContactPhone = currentAccount?.contactPhone || "(206) 555-0199";
  const effectiveBandId = publicBandId || currentAccount?.id || `band-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  const isPublicSoundEngineerReview = Boolean(publicBandId && publicBandId !== currentAccount?.id);

  // Close export modal or review mode on Android back-button / back-swipe
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (showExportModal) {
        setShowExportModal(false);
        e.preventDefault();
        return;
      }
      if (publicBandId && onClearPublicView) {
        onClearPublicView();
        e.preventDefault();
      }
    };
    window.addEventListener("giglizard_back_press", handleBackButton);
    return () => {
      window.removeEventListener("giglizard_back_press", handleBackButton);
    };
  }, [showExportModal, publicBandId, onClearPublicView]);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setSaveToast({ show: true, message, type });
    setTimeout(() => {
      setSaveToast({ show: false, message: "", type: "success" });
    }, 4500);
  };

  // 1. Automatic loading on mount / reopen:
  // Automatically loads saved stage_plot_data from public.bands or local storage so the user can continue editing where they left off
  useEffect(() => {
    let isCancelled = false;

    async function loadSavedPlot() {
      try {
        const result = await fetchBandStagePlotFromDatabase({
          userId: effectiveUserId,
          officialEmail: effectiveEmail,
          bandId: effectiveBandId
        });

        if (isCancelled) return;

        if (result && result.plotData) {
          const data = result.plotData;
          if (Array.isArray(data.elements) && data.elements.length > 0) {
            onUpdateElements(data.elements);
          }
          if (Array.isArray(data.inputChannels) && data.inputChannels.length > 0) {
            setInputChannels(data.inputChannels);
          }
          if (data.theme && (data.theme === "wood" || data.theme === "cyber" || data.theme === "starlight")) {
            setStageTheme(data.theme);
          }
          if (data.notes) {
            setAudioNotes(data.notes);
          }
          if (data.stagePlotUrl || result.stagePlotUrl) {
            setStagePlotUrl(data.stagePlotUrl || result.stagePlotUrl);
          }
          if (data.updatedAt) {
            setLastSavedTime(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }));
          }
        } else if (elements.length === 0) {
          onUpdateElements(INITIAL_ROCKS);
        }
      } catch (err) {
        console.warn("Could not auto-load saved stage plot:", err);
        if (elements.length === 0) {
          onUpdateElements(INITIAL_ROCKS);
        }
      }
    }

    loadSavedPlot();

    return () => {
      isCancelled = true;
    };
  }, [effectiveUserId, effectiveEmail, effectiveBandId]);

  // Handle adding new element to stage setup
  const handleAddTemplateToStage = (type: EquipmentType, label: string) => {
    const newEl: StageElement = {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type,
      label,
      x: 50,
      y: 50,
      rotation: 0
    };
    onUpdateElements([...elements, newEl]);
    triggerToast(`Added ${label} to stage. Drag to place.`, "info");
  };

  // Helper to remove item
  const handleRemoveItem = (id: string) => {
    onUpdateElements(elements.filter(el => el.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Rotation triggers - updates rotation in 90 degree increments
  const handleRotateItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, rotation: (el.rotation + 90) % 360 };
      }
      return el;
    });
    onUpdateElements(updated);
  };

  // Label editors
  const handleStartEditingLabel = (el: StageElement, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(el.id);
    setEditText(el.label);
  };

  const handleSaveLabel = (id: string) => {
    if (!editText.trim()) return;
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, label: editText.trim() };
      }
      return el;
    });
    onUpdateElements(updated);
    setEditingId(null);
  };

  // Drag handlers
  const handleStartDrag = (id: string, clientX: number, clientY: number, elX: number, elY: number) => {
    if (!containerRef.current) return;
    setActiveDragId(id);
    
    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = (elX / 100) * rect.width;
    const pixelY = (elY / 100) * rect.height;
    
    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;
    
    dragOffset.current = {
      x: clickX - pixelX,
      y: clickY - pixelY
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDragId || !containerRef.current) return;
    updateCoordinate(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeDragId || !containerRef.current || e.touches.length === 0) return;
    updateCoordinate(e.touches[0].clientX, e.touches[0].clientY);
  };

  const updateCoordinate = (clientX: number, clientY: number) => {
    if (!containerRef.current || !activeDragId) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const relativeX = clientX - rect.left - dragOffset.current.x;
    const relativeY = clientY - rect.top - dragOffset.current.y;
    
    const pctX = Math.min(Math.max(0, (relativeX / rect.width) * 100), 96);
    const pctY = Math.min(Math.max(0, (relativeY / rect.height) * 100), 96);
    
    const updated = elements.map(el => {
      if (el.id === activeDragId) {
        return { ...el, x: parseFloat(pctX.toFixed(1)), y: parseFloat(pctY.toFixed(1)) };
      }
      return el;
    });
    onUpdateElements(updated);
  };

  const handleStopDrag = () => {
    setActiveDragId(null);
  };

  // Reset stage helper
  const handleResetStage = () => {
    if (window.confirm("Do you want to reset the stage plot grid to a standard 4-Piece Band setup?")) {
      onUpdateElements(INITIAL_ROCKS);
      triggerToast("Reset stage plot to standard 4-piece rock setup", "info");
    }
  };

  const handleClearStage = () => {
    if (window.confirm("Do you want to clear all gear off the stage canvas?")) {
      onUpdateElements([]);
      triggerToast("Cleared all gear from stage canvas", "info");
    }
  };

  // Auto-generate Channel Input List from current stage elements
  const handleAutoGenerateChannelsFromStage = () => {
    const newChannels: InputChannel[] = [];
    let chNum = 1;

    // 1. Drums
    const drums = elements.filter(e => e.type === "drum_kit");
    if (drums.length > 0) {
      newChannels.push({ channel: chNum++, instrument: "Kick Drum", micOrDi: "Shure Beta 52 / Audix D6", stand: "Short Boom", phantomPower: false, notes: "Gated, heavy punch" });
      newChannels.push({ channel: chNum++, instrument: "Snare Top", micOrDi: "Shure SM57", stand: "Short Boom", phantomPower: false, notes: "Crisp top end, light reverb" });
      newChannels.push({ channel: chNum++, instrument: "Rack Tom", micOrDi: "Sennheiser e604 Clip", stand: "None", phantomPower: false, notes: "Tuned to G" });
      newChannels.push({ channel: chNum++, instrument: "Floor Tom", micOrDi: "Sennheiser e604 Clip", stand: "None", phantomPower: false, notes: "Deep sustain" });
      newChannels.push({ channel: chNum++, instrument: "Overhead (Stereo L)", micOrDi: "Condenser Pencil (KM184)", stand: "Tall Boom", phantomPower: true, notes: "Cymbal wash" });
      newChannels.push({ channel: chNum++, instrument: "Overhead (Stereo R)", micOrDi: "Condenser Pencil (KM184)", stand: "Tall Boom", phantomPower: true, notes: "Cymbal wash" });
    }

    // 2. Bass Rig
    const basses = elements.filter(e => e.type === "bass_amp");
    basses.forEach((b, idx) => {
      newChannels.push({ channel: chNum++, instrument: basses.length > 1 ? `Bass Rig ${idx + 1}` : "Bass Guitar (Direct)", micOrDi: "Active DI Box (Radial J48)", stand: "None", phantomPower: true, notes: "Pre-EQ balanced output" });
    });

    // 3. Guitar Amps
    const guitars = elements.filter(e => e.type === "guitar_amp");
    guitars.forEach((g, idx) => {
      newChannels.push({ channel: chNum++, instrument: g.label || (guitars.length > 1 ? `Guitar Amp ${idx + 1}` : "Guitar Amp"), micOrDi: "Shure SM57 / Sennheiser e906", stand: "Short Boom", phantomPower: false, notes: "Pan slightly in FOH" });
    });

    // 4. Keyboards
    const keys = elements.filter(e => e.type === "keyboard_rig");
    keys.forEach((k) => {
      newChannels.push({ channel: chNum++, instrument: "Keyboard (Stereo L)", micOrDi: "Passive Stereo DI", stand: "None", phantomPower: false, notes: "Analog synth feed" });
      newChannels.push({ channel: chNum++, instrument: "Keyboard (Stereo R)", micOrDi: "Passive Stereo DI", stand: "None", phantomPower: false, notes: "Analog synth feed" });
    });

    // 5. DI boxes
    const dis = elements.filter(e => e.type === "di_box");
    dis.forEach((d, idx) => {
      newChannels.push({ channel: chNum++, instrument: d.label || `Acoustic / Sample DI ${idx + 1}`, micOrDi: "Active DI Box", stand: "None", phantomPower: true, notes: "High headroom required" });
    });

    // 6. Turntables / DJ
    const djs = elements.filter(e => e.type === "dj_turntables");
    djs.forEach(() => {
      newChannels.push({ channel: chNum++, instrument: "DJ Decks (Stereo L)", micOrDi: "Radial ProDI", stand: "None", phantomPower: false, notes: "Line level feed" });
      newChannels.push({ channel: chNum++, instrument: "DJ Decks (Stereo R)", micOrDi: "Radial ProDI", stand: "None", phantomPower: false, notes: "Line level feed" });
    });

    // 7. Vocal Mics
    const vocals = elements.filter(e => e.type === "vocal_mic");
    vocals.forEach((v, idx) => {
      newChannels.push({ channel: chNum++, instrument: v.label || (idx === 0 ? "Lead Vocal (Center)" : `Backing Vocal ${idx + 1}`), micOrDi: "Shure SM58 / Beta 58A", stand: "Tall Boom", phantomPower: false, notes: "High monitor volume foldback" });
    });

    // 8. Instrument Mics
    const instMics = elements.filter(e => e.type === "instrument_mic");
    instMics.forEach((im, idx) => {
      newChannels.push({ channel: chNum++, instrument: im.label || `Acoustic Instrument ${idx + 1}`, micOrDi: "Shure SM57 / Beta 57A", stand: "Short Boom", phantomPower: false, notes: "Clear mids" });
    });

    if (newChannels.length === 0) {
      newChannels.push({ channel: 1, instrument: "Main Input 1", micOrDi: "Shure SM58", stand: "Tall Boom", phantomPower: false, notes: "Standard mix" });
    }

    setInputChannels(newChannels);
    triggerToast(`Auto-generated ${newChannels.length} channel patch list from on-stage gear!`, "success");
  };

  // Add channel to patch
  const handleAddChannelRow = () => {
    const nextCh = inputChannels.length > 0 ? Math.max(...inputChannels.map(c => c.channel)) + 1 : 1;
    const newRow: InputChannel = {
      channel: nextCh,
      instrument: "Aux / Guest Input",
      micOrDi: "Shure SM58 / DI",
      stand: "Tall Boom",
      phantomPower: false,
      notes: "Standard FOH foldback"
    };
    setInputChannels([...inputChannels, newRow]);
  };

  // Edit channel in patch
  const handleUpdateChannelField = (chNum: number, field: keyof InputChannel, value: any) => {
    setInputChannels(prev => prev.map(c => c.channel === chNum ? { ...c, [field]: value } : c));
  };

  // Remove channel
  const handleRemoveChannel = (chNum: number) => {
    setInputChannels(prev => prev.filter(c => c.channel !== chNum));
  };

  // =========================================================================
  // REQUIREMENT 1: DATABASE PERSISTENCE (public.bands.stage_plot_data JSONB)
  // =========================================================================
  const handleSaveStagePlot = async () => {
    if (!currentUser && !currentAccount && !effectiveUserId) {
      if (onTriggerLogin) {
        onTriggerLogin();
        triggerToast("Please log in to permanently save this stage plot to your band profile.", "info");
        return;
      }
    }

    setIsSaving(true);
    try {
      const now = new Date().toISOString();
      const plotData = {
        elements,
        inputChannels,
        theme: stageTheme,
        notes: audioNotes,
        stagePlotUrl,
        updatedAt: now
      };

      const result = await saveBandStagePlotToDatabase({
        userId: effectiveUserId,
        officialEmail: effectiveEmail,
        bandId: effectiveBandId,
        bandName: effectiveBandName,
        stagePlotData: plotData
      });

      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      triggerToast("✓ Stage plot & input list saved live to your band profile in Supabase!", "success");
    } catch (err: any) {
      console.error("Save stage plot error:", err);
      triggerToast(`Could not persist to database: ${err?.message || err}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // =========================================================================
  // REQUIREMENT 2: VENUE-READY EXPORT & DIRECT SHARING
  // =========================================================================
  const handleExportVenueSheet = async (format: "pdf" | "png") => {
    if (!exportCardRef.current) return;
    setIsExporting(true);
    triggerToast(`Rendering high-res ${format.toUpperCase()} tech sheet...`, "info");

    try {
      // 1. Render export element to high-res canvas (scale: 2 for 300 DPI sharpness)
      const exportElem = exportCardRef.current;
      const canvas = await html2canvas(exportElem, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#090d16"
      });

      const fileName = `${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-stage-plot-${new Date().toISOString().split("T")[0]}`;

      if (format === "png") {
        // Direct PNG download
        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = imageUri;
        link.click();
      } else {
        // High-quality PDF compilation using jsPDF
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "letter"
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Calculate aspect-ratio fit
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const ratio = canvasWidth / canvasHeight;
        
        const renderWidth = pageWidth - 40; // 20pt margins
        const renderHeight = renderWidth / ratio;

        pdf.setFillColor(9, 13, 22);
        pdf.rect(0, 0, pageWidth, pageHeight, "F");
        pdf.addImage(imgData, "PNG", 20, 20, renderWidth, Math.min(renderHeight, pageHeight - 40));
        pdf.save(`${fileName}.pdf`);
      }

      // 2. Automatically upload generated image to Supabase Storage in 'band-assets' bucket
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const uploadRes = await uploadStagePlotToStorage({
            bandIdOrSlug: effectiveBandName,
            blob,
            fileExt: "png",
            contentType: "image/png"
          });

          if (uploadRes && uploadRes.publicUrl) {
            setStagePlotUrl(uploadRes.publicUrl);
            // Update public.bands.stage_plot_url
            await updateBandStagePlotUrl({
              userId: effectiveUserId,
              officialEmail: effectiveEmail,
              bandId: effectiveBandId,
              stagePlotUrl: uploadRes.publicUrl
            });
            triggerToast(`✓ Exported & uploaded to Supabase Storage (band-assets)!`, "success");
          } else {
            triggerToast(`✓ ${format.toUpperCase()} downloaded to your device!`, "success");
          }
        } catch (storageErr) {
          console.warn("Supabase Storage upload notice:", storageErr);
          triggerToast(`✓ ${format.toUpperCase()} downloaded successfully!`, "success");
        }
      }, "image/png", 0.95);

      setShowExportModal(false);
    } catch (err: any) {
      console.error("Export failed:", err);
      triggerToast(`Export error: ${err?.message || err}`, "error");
    } finally {
      setIsExporting(false);
    }
  };

  // Copy shareable public link for venue sound engineers
  const handleCopyPublicLink = async () => {
    try {
      const origin = window.location.origin;
      const cleanSlug = (effectiveBandName || "artist").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      // Direct shareable link format: /stage-plot/:bandId with fallback hash support
      const publicUrl = `${origin}/stage-plot/${cleanSlug}`;
      
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      triggerToast("✓ Public stage plot link copied! Send to venue sound engineers.", "success");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (_) {
      triggerToast("Could not copy link automatically. Please copy the URL from your browser.", "error");
    }
  };

  // Render SVG icons or badges representing the specific device
  const renderEquipmentGraphic = (type: EquipmentType, label: string, isDragging: boolean, rot: number) => {
    const baseStyle = "w-full h-full rounded-xl flex flex-col items-center justify-center p-1 text-center select-none shadow-md border-2";
    
    let colorClasses = "bg-slate-850 text-white border-slate-700";
    let iconLabel = "🥁";

    if (type === "drum_kit") {
      colorClasses = "bg-slate-800 text-yellow-300 border-slate-600";
      iconLabel = "🥁";
    } else if (type === "guitar_amp") {
      colorClasses = "bg-orange-600 text-white border-orange-500";
      iconLabel = "🎸 🎛️";
    } else if (type === "bass_amp") {
      colorClasses = "bg-blue-900 text-blue-200 border-blue-800";
      iconLabel = "⛓️ 🔊";
    } else if (type === "keyboard_rig") {
      colorClasses = "bg-purple-900 text-purple-200 border-purple-800";
      iconLabel = "🎹";
    } else if (type === "vocal_mic") {
      colorClasses = "bg-rose-600 text-white border-rose-500";
      iconLabel = "🎙️";
    } else if (type === "instrument_mic") {
      colorClasses = "bg-emerald-900 text-emerald-200 border-emerald-800";
      iconLabel = "🎤";
    } else if (type === "monitor_wedge") {
      colorClasses = "bg-amber-950 text-amber-200 border-amber-800";
      iconLabel = "📢";
    } else if (type === "di_box") {
      colorClasses = "bg-slate-400 text-slate-900 border-slate-500";
      iconLabel = "🔌";
    } else if (type === "dj_turntables") {
      colorClasses = "bg-indigo-900 text-indigo-300 border-indigo-800";
      iconLabel = "🎚️ 💿";
    }

    return (
      <div 
        className={`${baseStyle} ${colorClasses} ${isDragging ? "opacity-75 cursor-grabbing scale-102" : "cursor-grab"}`}
        style={{ transform: `rotate(${rot}deg)` }}
        id={`graphic-wrap-${type}`}
      >
        <span className="text-[13px] leading-none mb-0.5" id={`graphic-icon-${type}`}>{iconLabel}</span>
        <span className="text-[9px] font-bold uppercase truncate max-w-full tracking-wider px-1" id={`graphic-label-${type}`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in" id="stage-designer-main-wrapper">
      {/* Save / Feedback Toast */}
      {saveToast.show && (
        <div 
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold border transition-all animate-in fade-in slide-in-from-top-4 ${
            saveToast.type === "success" 
              ? "bg-emerald-950/95 text-emerald-100 border-emerald-500/50 shadow-emerald-950/50" 
              : saveToast.type === "error"
              ? "bg-rose-950/95 text-rose-100 border-rose-500/50 shadow-rose-950/50"
              : "bg-indigo-950/95 text-indigo-100 border-indigo-500/50 shadow-indigo-950/50"
          }`}
          id="toast-stage-feedback"
        >
          {saveToast.type === "success" ? (
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : saveToast.type === "error" ? (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Sound Engineer Public View Banner (when viewing via /stage-plot/:bandId) */}
      {isPublicSoundEngineerReview && (
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-2 border-indigo-500/40 rounded-2xl p-4 sm:p-5 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Radio className="w-5 h-5 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-black uppercase tracking-wider mb-0.5">
                <ShieldCheck className="w-3 h-3" />
                Venue Sound Engineer View
              </div>
              <h2 className="text-lg font-black text-white">
                {effectiveBandName} — Official Stage Plot &amp; Technical Rider
              </h2>
              <p className="text-xs text-slate-300">
                Direct public technical sheet for venue front-of-house (FOH), monitor engineers, and stage managers.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              type="button"
              onClick={() => handleExportVenueSheet("pdf")}
              disabled={isExporting}
              className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              Download PDF
            </button>
            <button
              type="button"
              onClick={handleCopyPublicLink}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link className="w-3.5 h-3.5 text-slate-400" />}
              {copiedLink ? "Copied" : "Copy Link"}
            </button>
            {onClearPublicView && (
              <button
                type="button"
                onClick={onClearPublicView}
                className="text-xs text-slate-400 hover:text-white px-2 py-1.5 cursor-pointer"
              >
                Exit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider border border-indigo-200/50">
              <Sliders className="w-3 h-3 text-indigo-600" />
              Stage Plot &amp; Technical Patch Builder
            </div>
            {lastSavedTime && (
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" /> Saved {lastSavedTime}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span>{effectiveBandName}</span>
            <span className="text-slate-400 font-normal text-sm">Stage Layout &amp; Audio Input Patch</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Design visual backline placement, compile your venue input list, persist live to Supabase, and export ready-to-print venue tech sheets.
          </p>
        </div>

        {/* Primary Action Buttons: Save, Export PDF/Image, Copy Public Link */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Action 1: Save Stage Plot (Persists to public.bands.stage_plot_data) */}
          <button
            type="button"
            id="btn-save-stage-plot"
            onClick={handleSaveStagePlot}
            disabled={isSaving}
            className="flex-1 sm:flex-initial bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving to Cloud..." : "Save Stage Plot"}</span>
          </button>

          {/* Action 2: Export PDF / Image (Downloads + Uploads to Supabase Storage in 'band-assets') */}
          <button
            type="button"
            id="btn-export-stage-sheet"
            onClick={() => setShowExportModal(true)}
            disabled={isExporting}
            className="flex-1 sm:flex-initial bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            <Download className="w-4 h-4 text-indigo-300" />
            <span>{isExporting ? "Rendering..." : "Export PDF / Image"}</span>
          </button>

          {/* Action 3: Copy Public Link (e.g. /stage-plot/:bandId) */}
          <button
            type="button"
            id="btn-copy-public-stage-link"
            onClick={handleCopyPublicLink}
            className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-2.5 px-3.5 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            title="Copy direct shareable link for venue sound engineers"
          >
            {copiedLink ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <Link className="w-4 h-4 text-slate-600" />
            )}
            <span>{copiedLink ? "Link Copied!" : "Copy Public Link"}</span>
          </button>
        </div>
      </div>

      {/* Main Designer Grid: Sidebar Toolbox + Canvas + Patch List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="stage-designer-panel">
        
        {/* Left Column: Toolbox sidebar */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 space-y-5 shadow-xs" id="plot-toolbox">
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest" id="toolbox-title">
              Gear Toolbox
            </h3>
            <p className="text-[11px] text-slate-500 mt-1" id="toolbox-desc">
              Click an item to spawn it on-stage. Drag items around the stage to build your layout.
            </p>
          </div>

          <div className="flex flex-col gap-2" id="toolbox-items-list">
            {TOOLBOX_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.type}
                type="button"
                id={`btn-toolbox-${tmpl.type}`}
                onClick={() => handleAddTemplateToStage(tmpl.type, tmpl.label)}
                className="w-full flex items-center justify-between text-left p-2.5 rounded-xl border border-slate-200/80 hover:border-indigo-400 hover:bg-indigo-50/30 text-xs font-bold text-slate-800 group transition-all cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-3.5 h-3.5 rounded-full ${tmpl.color.split(" ")[0]} border border-white shadow-xs`} />
                  <span>{tmpl.label}</span>
                </div>
                <Plus className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>

          <hr className="border-slate-100 my-2" />

          {/* Quick preset utilities */}
          <div className="space-y-2" id="toolbox-utils">
            <button
              type="button"
              id="btn-plot-auto-patch"
              onClick={handleAutoGenerateChannelsFromStage}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs py-2 px-3 rounded-xl font-bold border border-indigo-200/60 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              Auto-Patch from Stage Gear
            </button>
            <button
              type="button"
              id="btn-plot-rock-preset"
              onClick={handleResetStage}
              className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-xl font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
              Reload 4-Piece Setup
            </button>
            <button
              type="button"
              id="btn-plot-clear-all"
              onClick={handleClearStage}
              className="w-full text-rose-600 hover:bg-rose-50 text-xs py-2 px-3 rounded-xl font-bold border border-transparent transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Trash className="w-3.5 h-3.5" />
              Clear Stage Gear
            </button>
          </div>
        </div>

        {/* Center / Right Column: Interactive Plot Canvas & Input List */}
        <div 
          className="lg:col-span-3 space-y-5" 
          id="stage-workspace"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onMouseUp={handleStopDrag}
          onTouchEnd={handleStopDrag}
        >
          {/* Canvas Sub-Header & Backdrop Theme Selector */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Stage Canvas ({elements.length} items placed)
              </span>
            </div>
            
            {/* Stage theme pills */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">Vibe:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200" id="theme-pills-frame">
                <button 
                  type="button"
                  id="btn-theme-wood"
                  onClick={() => setStageTheme("wood")}
                  className={`text-[11px] px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${stageTheme === 'wood' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  🌳 Wood Deck
                </button>
                <button 
                  type="button"
                  id="btn-theme-cyber"
                  onClick={() => setStageTheme("cyber")}
                  className={`text-[11px] px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${stageTheme === 'cyber' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  👾 Neon Cyber
                </button>
                <button 
                  type="button"
                  id="btn-theme-starlight"
                  onClick={() => setStageTheme("starlight")}
                  className={`text-[11px] px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${stageTheme === 'starlight' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  ✨ Arena Star
                </button>
              </div>
            </div>
          </div>

          {/* Physical Stage Canvas */}
          <div 
            ref={containerRef}
            id="live-stage-canvas"
            className="relative bg-slate-950 border-4 border-slate-900 rounded-3xl h-[500px] w-full overflow-hidden shadow-2xl selection:bg-transparent"
          >
            {/* SVG stage backgrounds */}
            <div className="absolute inset-0 pointer-events-none select-none z-0" id="stage-visual-base">
              {stageTheme === "wood" && (
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="backstage-wall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0a0505" />
                      <stop offset="100%" stopColor="#1a0f0d" />
                    </linearGradient>
                    <linearGradient id="wood-floor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2c1a13" />
                      <stop offset="50%" stopColor="#1e100a" />
                      <stop offset="100%" stopColor="#0f0704" />
                    </linearGradient>
                    <radialGradient id="spotlight-warm-l" cx="15%" cy="0%" r="85%">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                      <stop offset="40%" stopColor="#ca8a04" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="spotlight-warm-r" cx="85%" cy="0%" r="85%">
                      <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                      <stop offset="40%" stopColor="#ca8a04" stopOpacity="0.12" />
                      <stop offset="100%" stopColor="#ca8a04" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  
                  <rect width="100%" height="22%" fill="url(#backstage-wall)" />
                  <line x1="0" y1="22%" x2="100%" y2="22%" stroke="#451a03" strokeWidth="3" opacity="0.9" />
                  <rect y="22%" width="100%" height="78%" fill="url(#wood-floor)" />
                  
                  <polygon points="15%,0 0,500 280,500" fill="url(#spotlight-warm-l)" />
                  <polygon points="85%,0 100%,500 620,500" fill="url(#spotlight-warm-r)" />
                </svg>
              )}

              {stageTheme === "cyber" && (
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="cyber-base" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#040108" />
                      <stop offset="50%" stopColor="#0a0316" />
                      <stop offset="100%" stopColor="#020005" />
                    </linearGradient>
                    <radialGradient id="cyber-l" cx="5%" cy="5%" r="85%">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#c084fc" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                    <radialGradient id="cyber-r" cx="95%" cy="5%" r="85%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cyber-base)" />
                  <polygon points="5%,0 0,500 320,500" fill="url(#cyber-l)" />
                  <polygon points="95%,0 100%,500 580,500" fill="url(#cyber-r)" />
                </svg>
              )}

              {stageTheme === "starlight" && (
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="star-base" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#020617" />
                      <stop offset="50%" stopColor="#0b1329" />
                      <stop offset="100%" stopColor="#020617" />
                    </linearGradient>
                    <radialGradient id="star-center" cx="50%" cy="10%" r="70%">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                      <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#star-base)" />
                  <circle cx="50%" cy="15%" r="320" fill="url(#star-center)" />
                </svg>
              )}
            </div>

            {/* Edge Label Indicators */}
            {/* Backline indicator */}
            <div className="absolute top-2.5 left-0 right-0 text-center pointer-events-none z-10" id="label-rear">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-950/90 px-4 py-1.5 rounded-full border border-slate-800 shadow-sm">
                ▲ Backline / Drums &amp; Amplifier Line ▲
              </span>
            </div>

            {/* Frontline / Crowd indicator */}
            <div className="absolute bottom-3 left-0 right-0 text-center pointer-events-none z-10" id="label-front">
              <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest bg-slate-950/90 px-4 py-1.5 rounded-full border border-teal-900 shadow-sm">
                ▼ Frontline Monitors • Audience / Crowd Edge ▼
              </span>
            </div>

            {/* Stage Left Wing */}
            <div className="absolute top-1/2 left-2 -translate-y-1/2 select-none pointer-events-none origin-left -rotate-90 z-10" id="label-left-wing">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                Stage Left (SL)
              </span>
            </div>

            {/* Stage Right Wing */}
            <div className="absolute top-1/2 right-2 -translate-y-1/2 select-none pointer-events-none origin-right rotate-90 z-10" id="label-right-wing">
              <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">
                Stage Right (SR)
              </span>
            </div>

            {/* Placed Elements on Canvas */}
            {elements.map((el) => {
              const isEditingThis = editingId === el.id;
              const isDraggingThis = activeDragId === el.id;

              return (
                <div
                  key={el.id}
                  id={`placed-gear-${el.id}`}
                  className="absolute w-20 h-20 flex flex-col group touch-none"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    zIndex: isDraggingThis ? 50 : 20
                  }}
                >
                  <div 
                    className="w-full h-full relative"
                    id={`item-wrap-${el.id}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleStartDrag(el.id, e.clientX, e.clientY, el.x, el.y);
                    }}
                    onTouchStart={(e) => {
                      handleStartDrag(el.id, e.touches[0].clientX, e.touches[0].clientY, el.x, el.y);
                    }}
                  >
                    {renderEquipmentGraphic(el.type, el.label, isDraggingThis, el.rotation)}

                    {/* Inline Label Editing Popover */}
                    {isEditingThis && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-lg flex gap-1 z-[60] w-[130px]">
                        <input
                          type="text"
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-[10px] w-16 p-1 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveLabel(el.id);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveLabel(el.id)}
                          className="bg-indigo-600 text-white text-[9px] font-bold py-0.5 px-1.5 rounded cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}

                    {/* Mini gear tools: rotate, rename, delete */}
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 bg-slate-950/95 border border-slate-700/80 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                      <button
                        type="button"
                        aria-label="Rotate gear item"
                        onClick={(e) => handleRotateItem(el.id, e)}
                        className="text-slate-400 hover:text-indigo-400 cursor-pointer p-0.5 transition-colors"
                        title="Rotate 90°"
                      >
                        <RotateCw className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Rename gear item label"
                        onClick={(e) => handleStartEditingLabel(el, e)}
                        className="text-slate-300 hover:text-emerald-400 cursor-pointer p-0.5 transition-colors"
                        title="Edit Label"
                      >
                        <Type className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        aria-label="Delete gear item"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(el.id);
                        }}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer p-0.5 transition-colors"
                        title="Remove"
                      >
                        <Trash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {elements.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-3 pointer-events-none bg-slate-950/40">
                <AlertCircle className="w-10 h-10 text-slate-600" />
                <div>
                  <h4 className="text-sm font-bold text-slate-400">Stage Canvas is Empty</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Click items in the Gear Toolbox to place instruments and monitors on stage.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Tab Navigation: Input Patch vs Audio & Stage Notes */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTabSection("patch")}
                  className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTabSection === "patch" 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Channel Input List ({inputChannels.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTabSection("notes")}
                  className={`text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    activeTabSection === "notes" 
                      ? "bg-indigo-600 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Technical Audio &amp; Stage Notes
                </button>
              </div>

              {activeTabSection === "patch" && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleAddChannelRow}
                    className="flex-1 sm:flex-initial bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Channel
                  </button>
                  <button
                    type="button"
                    onClick={handleAutoGenerateChannelsFromStage}
                    className="flex-1 sm:flex-initial bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold py-1.5 px-3 rounded-lg border border-indigo-200/50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-indigo-600" /> Auto-Patch
                  </button>
                </div>
              )}
            </div>

            {/* TAB 1: Channel Input Patch List */}
            {activeTabSection === "patch" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3 w-12 text-center">Ch</th>
                      <th className="py-2.5 px-3">Instrument / Source</th>
                      <th className="py-2.5 px-3">Transducer / Mic / DI</th>
                      <th className="py-2.5 px-3">Stand Type</th>
                      <th className="py-2.5 px-3 text-center">+48V</th>
                      <th className="py-2.5 px-3">Monitoring &amp; FOH Notes</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inputChannels.map((ch) => (
                      <tr key={ch.channel} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-700 font-mono">
                          {ch.channel}
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={ch.instrument}
                            onChange={(e) => handleUpdateChannelField(ch.channel, "instrument", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs font-bold text-slate-900 px-1 py-0.5 rounded-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={ch.micOrDi}
                            onChange={(e) => handleUpdateChannelField(ch.channel, "micOrDi", e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs text-slate-700 px-1 py-0.5 rounded-sm"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <select
                            value={ch.stand}
                            onChange={(e) => handleUpdateChannelField(ch.channel, "stand", e.target.value)}
                            className="bg-transparent border border-slate-200 rounded-md text-[11px] text-slate-700 px-2 py-1 focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="None">None (Clamped / DI)</option>
                            <option value="Short Boom">Short Boom</option>
                            <option value="Tall Boom">Tall Boom</option>
                            <option value="Straight">Straight</option>
                          </select>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={ch.phantomPower}
                            onChange={(e) => handleUpdateChannelField(ch.channel, "phantomPower", e.target.checked)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={ch.notes}
                            onChange={(e) => handleUpdateChannelField(ch.channel, "notes", e.target.value)}
                            placeholder="Foldback / mix notes..."
                            className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:ring-0 text-xs text-slate-600 px-1 py-0.5 rounded-sm placeholder:text-slate-300"
                          />
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveChannel(ch.channel)}
                            className="text-slate-300 hover:text-rose-500 p-1 cursor-pointer transition-colors"
                            title="Remove channel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 2: Technical Audio & Stage Notes */}
            {activeTabSection === "notes" && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Venue Stage Requirements, AC Power Drops &amp; Monitoring Notes
                </label>
                <textarea
                  rows={4}
                  value={audioNotes}
                  onChange={(e) => setAudioNotes(e.target.value)}
                  placeholder="Specify monitoring mixes, electrical quad-box power drops, drum riser requests, and load-in contact instructions..."
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Venue Sound Tip:</strong> Professional tech riders clearly state monitor mix assignments (e.g., Mix 1: Center Vocals, Mix 2: Drummer, Mix 3: Guitar) and whether instruments require 48V phantom power.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EXPORT MODAL: SELECT PDF OR IMAGE                                        */}
      {/* ========================================================================= */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Export Venue Tech Sheet</h3>
                  <p className="text-xs text-slate-500">Includes visual stage plot, input patch, &amp; contact info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Option 1: PDF */}
              <button
                type="button"
                onClick={() => handleExportVenueSheet("pdf")}
                disabled={isExporting}
                className="w-full p-4 rounded-2xl border-2 border-indigo-500/20 hover:border-indigo-600 hover:bg-indigo-50/20 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      Venue Tech Sheet (PDF)
                    </h4>
                    <p className="text-xs text-slate-500">
                      Standard letter size, high-contrast print-ready document.
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
              </button>

              {/* Option 2: PNG */}
              <button
                type="button"
                onClick={() => handleExportVenueSheet("png")}
                disabled={isExporting}
                className="w-full p-4 rounded-2xl border border-slate-200 hover:border-slate-400 hover:bg-slate-50/50 transition-all flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
                    <ImageIcon className="w-5 h-5 text-indigo-300" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-slate-800 transition-colors">
                      Stage Graphic Image (PNG)
                    </h4>
                    <p className="text-xs text-slate-500">
                      High-resolution PNG file with full stage canvas &amp; channel patch.
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-slate-800 group-hover:scale-110 transition-all" />
              </button>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                Cloud Backup Included
              </div>
              <p>
                When exported, this sheet is automatically uploaded to your Supabase Storage (<strong>band-assets</strong>) bucket and linked to your band profile.
              </p>
            </div>

            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 px-4 py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DEDICATED HIGH-RESOLUTION EXPORT TEMPLATE (Captured by html2canvas)        */}
      {/* Rendered off-screen or hidden to ensure pixel-perfect 300DPI export        */}
      {/* ========================================================================= */}
      <div className="overflow-hidden h-0 opacity-0 pointer-events-none select-none">
        <div 
          ref={exportCardRef}
          style={{ width: "1000px" }}
          className="bg-slate-950 text-white p-10 font-sans space-y-6"
        >
          {/* Header */}
          <div className="border-b-2 border-indigo-500/40 pb-6 flex items-start justify-between gap-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase tracking-widest border border-indigo-500/30">
                <Zap className="w-3.5 h-3.5 text-indigo-400" />
                Official Technical Rider &amp; Stage Plot
              </div>
              <h1 className="text-4xl font-black text-white tracking-tight">
                {effectiveBandName}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-indigo-400" /> {effectiveBandCity}</span>
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 text-indigo-400" /> {effectiveEmail || "booking@band.com"}</span>
                <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 text-indigo-400" /> {effectiveBandContactPhone}</span>
              </div>
            </div>

            <div className="text-right space-y-1">
              <div className="text-2xl font-black text-indigo-400">GIGLIZARD</div>
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Date Generated</div>
              <div className="text-xs font-mono font-bold text-white">
                {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>
          </div>

          {/* Visual Stage Diagram Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-300">
              <span>Stage Layout Diagram (Audience Perspective)</span>
              <span className="text-slate-400">{elements.length} Gear Items</span>
            </div>

            <div className="relative bg-slate-900 border-2 border-indigo-900/60 rounded-2xl h-[420px] w-full overflow-hidden">
              {/* Backline indicator */}
              <div className="absolute top-2 left-0 right-0 text-center">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-950/90 px-3 py-1 rounded-full border border-slate-800">
                  ▲ Backline / Backstage (Amps &amp; Drums) ▲
                </span>
              </div>

              {/* Frontline indicator */}
              <div className="absolute bottom-2 left-0 right-0 text-center">
                <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest bg-slate-950/90 px-3 py-1 rounded-full border border-teal-900">
                  ▼ Frontline Monitors • Audience / Crowd Edge ▼
                </span>
              </div>

              {/* Stage Left / Right */}
              <div className="absolute top-1/2 left-2 -translate-y-1/2 origin-left -rotate-90 text-[8px] text-slate-500 font-black uppercase">
                Stage Left (SL)
              </div>
              <div className="absolute top-1/2 right-2 -translate-y-1/2 origin-right rotate-90 text-[8px] text-slate-500 font-black uppercase">
                Stage Right (SR)
              </div>

              {/* Placed Elements Graphic */}
              {elements.map((el) => (
                <div
                  key={el.id}
                  className="absolute w-20 h-20 flex flex-col"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`
                  }}
                >
                  {renderEquipmentGraphic(el.type, el.label, false, el.rotation)}
                </div>
              ))}
            </div>
          </div>

          {/* Channel Input Patch List */}
          <div className="space-y-2">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Channel Input List &amp; Transducer Patch ({inputChannels.length} Channels)
            </div>

            <table className="w-full text-left text-xs border border-slate-800 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-slate-900 text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-800">
                  <th className="py-2 px-3 w-10 text-center">Ch</th>
                  <th className="py-2 px-3">Instrument / Source</th>
                  <th className="py-2 px-3">Mic / DI Specification</th>
                  <th className="py-2 px-3">Stand Type</th>
                  <th className="py-2 px-3 text-center">+48V</th>
                  <th className="py-2 px-3">Monitoring &amp; FOH Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950/80">
                {inputChannels.map((ch) => (
                  <tr key={ch.channel}>
                    <td className="py-1.5 px-3 text-center font-bold text-indigo-400 font-mono">
                      {ch.channel}
                    </td>
                    <td className="py-1.5 px-3 font-bold text-white">
                      {ch.instrument}
                    </td>
                    <td className="py-1.5 px-3 text-slate-300">
                      {ch.micOrDi}
                    </td>
                    <td className="py-1.5 px-3 text-slate-400">
                      {ch.stand}
                    </td>
                    <td className="py-1.5 px-3 text-center font-bold text-amber-400">
                      {ch.phantomPower ? "YES" : "—"}
                    </td>
                    <td className="py-1.5 px-3 text-slate-300">
                      {ch.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Technical Audio & Power Notes */}
          <div className="border border-slate-800 rounded-xl p-4 bg-slate-900/60 space-y-1">
            <div className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Audio, Power &amp; Hospitality Requirements
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {audioNotes}
            </p>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>Prepared via GigLizard Tour Suite • Contact: {effectiveEmail || "booking@band.com"}</span>
            <span>All rights reserved • Confidential Venue Tech Sheet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
