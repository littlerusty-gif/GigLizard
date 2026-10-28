import React, { useState, useRef, useEffect, useMemo } from "react";
import { StageElement, EquipmentType, InputChannel, BandProfile, UserAccount } from "../types";
import { 
  Plus, Trash2, RotateCw, Type, Save, FolderOpen, 
  HelpCircle, Trash, Sliders, Sparkles, AlertCircle, RefreshCw,
  Download, Share2, Check, ExternalLink, Printer, Link, FileText,
  Image as ImageIcon, Eye, Phone, Mail, MapPin, Calendar, Clock,
  Volume2, ShieldCheck, Zap, Radio, Layers, Copy, Compass, Grid,
  Maximize2, Cpu, Wrench, ChevronRight, LogIn
} from "lucide-react";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { 
  saveBandStagePlotToDatabase, 
  fetchBandStagePlotFromDatabase, 
  uploadStagePlotToStorage, 
  updateBandStagePlotUrl 
} from "../lib/supabase";
import StagePlotSeoGuide from "./StagePlotSeoGuide";
import { StageGearGraphic } from "./StagePlotIcons";

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

interface ToolboxItem {
  type: EquipmentType;
  label: string;
  category: "backline" | "mics" | "monitoring";
  defaultMic: string;
  iconName: string;
  defaultMix?: number;
  kickType?: "single" | "dual";
}

const TOOLBOX_TEMPLATES: ToolboxItem[] = [
  // Backline & Instruments
  { type: "drum_kit", label: "Drums (Single Kick)", category: "backline", defaultMic: "Beta 52 / SM57 / Overheads", iconName: "Drums", kickType: "single" },
  { type: "drum_kit", label: "Drums (Double Kick)", category: "backline", defaultMic: "Dual Beta 52 / 4 Toms / Booms", iconName: "Double Bass Drums", kickType: "dual" },
  { type: "drum_pad", label: "SPD Sample Pad", category: "backline", defaultMic: "Dual 1/4\" Stereo DI", iconName: "Sample Pad" },
  { type: "electric_guitar", label: "Electric Guitar", category: "backline", defaultMic: "Shure SM57 on Amp Cone", iconName: "Elec Gtr" },
  { type: "guitar_amp", label: "Guitar Amp (2x12)", category: "backline", defaultMic: "Shure SM57 / Sennheiser e906", iconName: "Gtr Amp" },
  { type: "bass_guitar", label: "Bass Guitar", category: "backline", defaultMic: "Radial Active DI Box", iconName: "Bass Gtr" },
  { type: "bass_amp", label: "Bass Rig (4x10)", category: "backline", defaultMic: "AKG D112 / Direct XLR", iconName: "Bass Rig" },
  { type: "keyboard_rig", label: "Stereo Keyboards", category: "backline", defaultMic: "Stereo Active DI Box (Ch 13-14)", iconName: "Keys" },
  { type: "saxophone", label: "Saxophone / Horns", category: "backline", defaultMic: "B91 Clamp Condenser", iconName: "Saxophone" },
  { type: "acoustic_guitar", label: "Acoustic Guitar", category: "backline", defaultMic: "Active Radial DI Box", iconName: "Acoustic" },
  { type: "laptop_rig", label: "Laptop / Ableton", category: "backline", defaultMic: "Stereo Interface DI (Ch 18-19)", iconName: "Laptop Rig" },
  { type: "dj_turntables", label: "DJ Decks / Mixer", category: "backline", defaultMic: "Dual Stereo DI Box", iconName: "DJ Decks" },

  // Microphones & Direct Inputs
  { type: "vocal_mic", label: "Vocal Mic (Boom)", category: "mics", defaultMic: "Shure Beta 58A / SM58", iconName: "Vox Mic" },
  { type: "instrument_mic", label: "Instrument Mic", category: "mics", defaultMic: "Shure SM57 / Beta 57A", iconName: "Inst Mic" },
  { type: "di_box", label: "Direct Box (D.I.)", category: "mics", defaultMic: "Radial J48 Active DI", iconName: "DI Box" },

  // Monitoring & Electrical Drops
  { type: "monitor_wedge", label: "Monitor Wedge (Floor)", category: "monitoring", defaultMic: "Aux Mix Foldback", iconName: "Wedge", defaultMix: 1 },
  { type: "dual_wedge", label: "Dual Center Wedges", category: "monitoring", defaultMic: "Lead Vocal Pair (Aux 2)", iconName: "Dual Wedges", defaultMix: 2 },
  { type: "iem_transmitter", label: "Wireless In-Ear (IEM)", category: "monitoring", defaultMic: "Stereo Wireless Beltpack", iconName: "Wireless IEM" },
  { type: "wired_iem", label: "Wired In-Ear (Drummer)", category: "monitoring", defaultMic: "Wired Headphone Amp Pack", iconName: "Wired IEM" },
  { type: "power_drop", label: "120V AC Quad-Box", category: "monitoring", defaultMic: "120V 20A AC Circuit", iconName: "AC Drop" },
];

/**
 * Standard Professional Live Band Stage Plot Preset
 * Recreates the exact clean, logical touring stage layout:
 * - Upstage Center: Drum kit on riser with SPD pad, drum wedge OUT 5, wired in-ear
 * - Upstage Right (House Left): Saxophone, Keyboards, 2 DI boxes, keyboard wedge OUT 4
 * - Downstage Right (House Left): Electric guitar, vocal boom mic, wedge OUT 1
 * - Downstage Center: Center vocal boom mic, wireless in-ear, dual floor wedges OUT 2
 * - Downstage Left (House Right): Bass guitar, bass DI box, wedge OUT 3
 * - Upstage Left (House Right): Laptop playback rig, bass amp
 */
export const PRESET_PROFESSIONAL_LIVE_BAND: StageElement[] = [
  // Upstage Center: Drums on Riser
  { id: "drums-kit", type: "drum_kit", label: "Drums & Riser", x: 50, y: 22, rotation: 0 },
  { id: "drum-pad", type: "drum_pad", label: "SPD Sample Pad", x: 39, y: 17, rotation: 0 },
  { id: "mon-drum", type: "monitor_wedge", label: "Drum Mix", x: 63, y: 18, rotation: 0, mixNumber: 5 },
  { id: "iem-drum", type: "wired_iem", label: "Wired In-Ear", x: 71, y: 19, rotation: 0 },

  // Upstage Stage Right (Audience Left): Keys, Sax, DI & Out 4
  { id: "sax-horns", type: "saxophone", label: "Saxophone", x: 31, y: 18, rotation: 0 },
  { id: "keys-rig", type: "keyboard_rig", label: "Keyboards", x: 18, y: 25, rotation: 0 },
  { id: "keys-di-1", type: "di_box", label: "Keys DI L", x: 28, y: 24, rotation: 0 },
  { id: "keys-di-2", type: "di_box", label: "Keys DI R", x: 28, y: 31, rotation: 0 },
  { id: "mon-keys", type: "monitor_wedge", label: "Keys Mix", x: 10, y: 18, rotation: 0, mixNumber: 4 },
  { id: "keys-amp", type: "guitar_amp", label: "Side Fill", x: 7, y: 29, rotation: 0 },

  // Downstage Stage Right (Audience Left): Electric Guitar, Vox SR & Out 1
  { id: "gtr-elec", type: "electric_guitar", label: "Electric Guitar", x: 16, y: 62, rotation: 0 },
  { id: "vox-sr", type: "vocal_mic", label: "Vocal SR", x: 24, y: 64, rotation: 0 },
  { id: "mon-gtr", type: "monitor_wedge", label: "Guitar Mix", x: 17, y: 79, rotation: 0, mixNumber: 1 },

  // Downstage Center: Lead Vox, Wireless IEM, Dual Center Wedges (Out 2)
  { id: "lead-vox", type: "vocal_mic", label: "Lead Vocal", x: 48, y: 63, rotation: 0 },
  { id: "iem-lead", type: "iem_transmitter", label: "Wireless In-Ear", x: 56, y: 60, rotation: 0 },
  { id: "mon-center", type: "dual_wedge", label: "Lead Mix Dual", x: 48, y: 79, rotation: 0, mixNumber: 2 },

  // Downstage Stage Left (Audience Right): Bass Guitar, Bass DI & Out 3
  { id: "bass-gtr", type: "bass_guitar", label: "Bass Guitar", x: 84, y: 62, rotation: 0 },
  { id: "bass-di", type: "di_box", label: "Bass DI", x: 76, y: 74, rotation: 0 },
  { id: "mon-bass", type: "monitor_wedge", label: "Bass Mix", x: 85, y: 79, rotation: 0, mixNumber: 3 },

  // Upstage Stage Left (Audience Right): Laptop Playback Rig & Bass Cab
  { id: "laptop-rig", type: "laptop_rig", label: "Laptop / Tracks", x: 91, y: 17, rotation: 0 },
  { id: "bass-cab", type: "bass_amp", label: "Bass Rig", x: 86, y: 29, rotation: 0 }
];

export const PRESET_ROCK_4PIECE: StageElement[] = [
  { id: "drums-1", type: "drum_kit", label: "Drums & Riser", x: 50, y: 22, rotation: 0, kickType: "single" },
  { id: "mon-drum", type: "monitor_wedge", label: "Drum Mix", x: 63, y: 19, rotation: 0, mixNumber: 4 },
  { id: "gtr-amp", type: "guitar_amp", label: "Guitar Amp", x: 17, y: 28, rotation: 0 },
  { id: "gtr-elec", type: "electric_guitar", label: "Guitar", x: 20, y: 62, rotation: 0 },
  { id: "mon-gtr", type: "monitor_wedge", label: "Guitar Mix", x: 20, y: 79, rotation: 0, mixNumber: 2 },
  { id: "lead-vox", type: "vocal_mic", label: "Lead Vox", x: 50, y: 63, rotation: 0 },
  { id: "mon-vox", type: "monitor_wedge", label: "Lead Mix", x: 50, y: 79, rotation: 0, mixNumber: 1 },
  { id: "bass-amp", type: "bass_amp", label: "Bass Amp", x: 83, y: 28, rotation: 0 },
  { id: "bass-gtr", type: "bass_guitar", label: "Bass", x: 80, y: 62, rotation: 0 },
  { id: "mon-bass", type: "monitor_wedge", label: "Bass Mix", x: 80, y: 79, rotation: 0, mixNumber: 3 }
];

export const DEFAULT_ROCK_INPUT_CHANNELS: InputChannel[] = [
  { channel: 1, instrument: "KICK", micOrDi: "SHURE B52", stand: "Short Boom", phantomPower: false, notes: "Punchy, fast gate" },
  { channel: 2, instrument: "SNARE UP", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Top snare head" },
  { channel: 3, instrument: "HIHAT", micOrDi: "BETA 81", stand: "Short Boom", phantomPower: true, notes: "Tight cardioid condenser" },
  { channel: 4, instrument: "TOM 1", micOrDi: "E604 / B56A", stand: "None", phantomPower: false, notes: "Rack tom rim clip" },
  { channel: 5, instrument: "TOM 2", micOrDi: "BETA 52", stand: "Short Boom", phantomPower: false, notes: "Floor tom resonance" },
  { channel: 6, instrument: "OH L", micOrDi: "KM184 / KSM32", stand: "Tall Boom", phantomPower: true, notes: "Stereo overhead left" },
  { channel: 7, instrument: "OH R", micOrDi: "KM184 / KSM32", stand: "Tall Boom", phantomPower: true, notes: "Stereo overhead right" },
  { channel: 8, instrument: "BASS (DI)", micOrDi: "RADIAL J48", stand: "None", phantomPower: true, notes: "Active direct box pre-EQ" },
  { channel: 9, instrument: "BASS MIC", micOrDi: "AKG D112", stand: "Short Boom", phantomPower: false, notes: "Cab speaker cone mic" },
  { channel: 10, instrument: "E.GUITAR", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Combo guitar amp cone" },
  { channel: 11, instrument: "LEAD VOX", micOrDi: "BETA 58A", stand: "Tall Boom", phantomPower: false, notes: "Center frontline" },
  { channel: 12, instrument: "GUITAR VOX", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Stage right backing vocal" }
];

const PRESET_ACOUSTIC_TRIO: StageElement[] = [
  { id: "cajon-drums", type: "drum_kit", label: "Percussion", x: 50, y: 24, rotation: 0 },
  { id: "mon-cajon", type: "monitor_wedge", label: "Perc Mix", x: 50, y: 38, rotation: 0, mixNumber: 3 },
  { id: "acoustic-gtr", type: "acoustic_guitar", label: "Acoustic Gtr", x: 24, y: 62, rotation: 0 },
  { id: "vox-sr", type: "vocal_mic", label: "Vox SR", x: 24, y: 55, rotation: 0 },
  { id: "mon-sr", type: "monitor_wedge", label: "Gtr Mix", x: 24, y: 79, rotation: 0, mixNumber: 1 },
  { id: "di-acoustic", type: "di_box", label: "Acoustic DI", x: 15, y: 62, rotation: 0 },
  { id: "bass-rig", type: "bass_amp", label: "Upright Bass", x: 76, y: 62, rotation: 0 },
  { id: "vox-sl", type: "vocal_mic", label: "Vox SL", x: 76, y: 55, rotation: 0 },
  { id: "mon-sl", type: "monitor_wedge", label: "Bass Mix", x: 76, y: 79, rotation: 0, mixNumber: 2 },
  { id: "di-bass", type: "di_box", label: "Bass DI", x: 85, y: 62, rotation: 0 }
];

/**
 * Standard 19-Channel Input Patch List matching professional concert rider conventions
 */
const DEFAULT_INPUT_CHANNELS: InputChannel[] = [
  { channel: 1, instrument: "KICK", micOrDi: "SHURE B52", stand: "Short Boom", phantomPower: false, notes: "Punchy, fast gate" },
  { channel: 2, instrument: "SNARE UP", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Top snare head" },
  { channel: 3, instrument: "SNARE DOWN", micOrDi: "B57", stand: "Short Boom", phantomPower: false, notes: "Bottom snare wire" },
  { channel: 4, instrument: "HIHAT", micOrDi: "BETA 81", stand: "Short Boom", phantomPower: true, notes: "Tight cardioid condenser" },
  { channel: 5, instrument: "TOM 1", micOrDi: "E604 / B56A", stand: "None", phantomPower: false, notes: "High rack tom rim clip" },
  { channel: 6, instrument: "TOM 2", micOrDi: "E604 / B56A", stand: "None", phantomPower: false, notes: "Mid rack tom rim clip" },
  { channel: 7, instrument: "TOM 3", micOrDi: "BETA 52", stand: "Short Boom", phantomPower: false, notes: "Deep floor tom resonance" },
  { channel: 8, instrument: "OH L", micOrDi: "KM184 / KSM32", stand: "Tall Boom", phantomPower: true, notes: "Stereo overhead left" },
  { channel: 9, instrument: "OH R", micOrDi: "KM184 / KSM32", stand: "Tall Boom", phantomPower: true, notes: "Stereo overhead right" },
  { channel: 10, instrument: "BASS (DI)", micOrDi: "RADIAL J48", stand: "None", phantomPower: true, notes: "Active direct box pre-EQ" },
  { channel: 11, instrument: "BASS MIC", micOrDi: "AKG D112", stand: "Short Boom", phantomPower: false, notes: "Cab speaker cone mic" },
  { channel: 12, instrument: "E.GUITAR", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Combo guitar amp cone" },
  { channel: 13, instrument: "KEYS L", micOrDi: "ACTIVE DI", stand: "None", phantomPower: true, notes: "Stereo synth line left" },
  { channel: 14, instrument: "KEYS R", micOrDi: "ACTIVE DI", stand: "None", phantomPower: true, notes: "Stereo synth line right" },
  { channel: 15, instrument: "SAX", micOrDi: "B91 CLAMP", stand: "None", phantomPower: true, notes: "Clip-on condenser clamp" },
  { channel: 16, instrument: "VOX L", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Stage Right guitar vocal" },
  { channel: 17, instrument: "VOX C", micOrDi: "BETA 58A", stand: "Tall Boom", phantomPower: false, notes: "Center lead vocal" },
  { channel: 18, instrument: "PC L", micOrDi: "STEREO DI", stand: "None", phantomPower: true, notes: "Laptop audio playback left" },
  { channel: 19, instrument: "PC R", micOrDi: "STEREO DI", stand: "None", phantomPower: true, notes: "Laptop audio playback right" }
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
  const dragOffset = useRef({ x: 0, y: 0 });
  
  // Selection & drag state
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [activeTabSection, setActiveTabSection] = useState<"patch" | "table" | "specs">("patch");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [stagePlotUrl, setStagePlotUrl] = useState<string | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveToast, setSaveToast] = useState<{ show: boolean; message: string; type: "success" | "error" | "info" }>({
    show: false,
    message: "",
    type: "success"
  });

  // Default to print theme (Studio White) for crystal-clear readability
  const [stageTheme, setStageTheme] = useState<"blueprint" | "stage" | "print">("print");
  const [activeToolboxTab, setActiveToolboxTab] = useState<"all" | "backline" | "mics" | "monitoring">("all");
  
  // Channel Input List state - defaults to 4-piece rock band
  const [inputChannels, setInputChannels] = useState<InputChannel[]>(DEFAULT_ROCK_INPUT_CHANNELS);

  // Monitor unit count calculated directly from placed stage elements (dual_wedge counts as 2 units)
  const monitorUnitCount = useMemo(() => {
    return elements.reduce((acc, el) => {
      if (el.type === "monitor_wedge") return acc + 1;
      if (el.type === "dual_wedge") return acc + 2;
      return acc;
    }, 0);
  }, [elements]);

  const placedMonitors = useMemo(() => {
    return elements
      .filter(e => e.type === "monitor_wedge" || e.type === "dual_wedge")
      .sort((a, b) => (a.mixNumber || 99) - (b.mixNumber || 99));
  }, [elements]);

  const [userCustomizedMonitors, setUserCustomizedMonitors] = useState(false);
  const [monitorNotes, setMonitorNotes] = useState<string>(() => {
    const initialCount = elements.reduce((acc, el) => {
      if (el.type === "monitor_wedge") return acc + 1;
      if (el.type === "dual_wedge") return acc + 2;
      return acc;
    }, 0);
    return `${initialCount || 4} units 12" monitors. They must all be the same model and with independent sends.`;
  });

  // Keep written monitor specification automatically in sync with the stage plot layout unless user customized
  useEffect(() => {
    if (!userCustomizedMonitors) {
      setMonitorNotes(
        `${monitorUnitCount} units 12" monitors. They must all be the same model and with independent sends.`
      );
    }
  }, [monitorUnitCount, userCustomizedMonitors]);

  const [paNotes, setPaNotes] = useState<string>(
    "PA equipment adjusted and sufficient to cover the entire audience area with a response that is as uniform as possible on all frequencies and a minimum pressure of 90 dB."
  );

  // User Authentication & Band Contact Status
  const isLoggedIn = Boolean(currentUser || currentAccount);
  const effectiveUserId = currentUser?.id || currentAccount?.id || null;
  const effectiveBandName = currentAccount?.name || bandProfile?.name || "My band";
  const effectiveBandCity = currentAccount?.city || bandProfile?.city || "Seattle, WA";
  const effectiveBandId = publicBandId || currentAccount?.id || `band-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

  // Contact info - default to blank field if user is not signed in
  const [techContactPhone, setTechContactPhone] = useState<string>(() => {
    if (!currentUser && !currentAccount) return "";
    return currentAccount?.contactPhone || "";
  });
  const [prodContactPhone, setProdContactPhone] = useState<string>(() => {
    if (!currentUser && !currentAccount) return "";
    return currentAccount?.contactPhone || "";
  });
  const [contactEmail, setContactEmail] = useState<string>(() => {
    if (!currentUser && !currentAccount) return "";
    return currentAccount?.contactEmail || currentUser?.email || "";
  });

  const effectiveBandContactPhone = techContactPhone;
  const effectiveEmail = contactEmail;

  // When user signs in, auto-fill with band contact info if fields are blank
  useEffect(() => {
    if (isLoggedIn) {
      if (!techContactPhone && currentAccount?.contactPhone) {
        setTechContactPhone(currentAccount.contactPhone);
      }
      if (!prodContactPhone && currentAccount?.contactPhone) {
        setProdContactPhone(currentAccount.contactPhone);
      }
      if (!contactEmail && (currentAccount?.contactEmail || currentUser?.email)) {
        setContactEmail(currentAccount?.contactEmail || currentUser?.email || "");
      }
    }
  }, [isLoggedIn, currentAccount?.contactPhone, currentAccount?.contactEmail, currentUser?.email]);

  const isPublicSoundEngineerReview = Boolean(publicBandId && publicBandId !== currentAccount?.id);

  // Close modals on Android back-button
  useEffect(() => {
    const handleBackButton = (e: Event) => {
      if (showExportModal) {
        setShowExportModal(false);
        e.preventDefault();
        return;
      }
      if (selectedId) {
        setSelectedId(null);
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
  }, [showExportModal, selectedId, publicBandId, onClearPublicView]);

  const triggerToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setSaveToast({ show: true, message, type });
    setTimeout(() => {
      setSaveToast({ show: false, message: "", type: "success" });
    }, 4500);
  };

  // Default to 4 piece rock band template when first opened
  useEffect(() => {
    if (elements.length === 0) {
      onUpdateElements(PRESET_ROCK_4PIECE);
      setInputChannels(DEFAULT_ROCK_INPUT_CHANNELS);
    }
  }, []);

  // Click & Delete: Listen for Delete/Backspace keys to remove selected item
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedId) return;
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === "input" || targetTag === "textarea") return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        handleRemoveItem(selectedId);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, elements]);

  // Toggle drum kit between single kick and dual kick
  const handleToggleKickType = (id: string, kickType: "single" | "dual") => {
    const updated = elements.map(el => {
      if (el.id === id) {
        return {
          ...el,
          kickType,
          label: kickType === "dual" ? "Drums (Double Kick)" : "Drums (Single Kick)"
        };
      }
      return el;
    });
    onUpdateElements(updated);

    if (kickType === "dual") {
      setInputChannels(prev => {
        const hasKick2 = prev.some(c => c.instrument.toUpperCase().includes("KICK 2"));
        if (!hasKick2) {
          const kickIndex = prev.findIndex(c => c.instrument.toUpperCase().includes("KICK"));
          if (kickIndex !== -1) {
            const next = [...prev];
            next[kickIndex] = { ...next[kickIndex], instrument: "KICK 1 (SHURE B52)" };
            const newKick2: InputChannel = {
              channel: next.length + 1,
              instrument: "KICK 2 (SHURE B52)",
              micOrDi: "SHURE B52",
              stand: "Short Boom",
              phantomPower: false,
              notes: "Second bass drum"
            };
            next.splice(kickIndex + 1, 0, newKick2);
            return next.map((c, idx) => ({ ...c, channel: idx + 1 }));
          }
        }
        return prev;
      });
      triggerToast("Switched Drum Kit to Double Kick (Dual Bass) with Kick 1 & 2 channels.", "success");
    } else {
      setInputChannels(prev => {
        const hasKick2 = prev.some(c => c.instrument.toUpperCase().includes("KICK 2"));
        if (hasKick2) {
          const filtered = prev.filter(c => !c.instrument.toUpperCase().includes("KICK 2"));
          const kickIndex = filtered.findIndex(c => c.instrument.toUpperCase().includes("KICK"));
          if (kickIndex !== -1) {
            filtered[kickIndex] = { ...filtered[kickIndex], instrument: "KICK (SHURE B52)" };
          }
          return filtered.map((c, idx) => ({ ...c, channel: idx + 1 }));
        }
        return prev;
      });
      triggerToast("Switched Drum Kit to Single Kick.", "info");
    }
  };

  // Automatic loading on mount / reopen
  useEffect(() => {
    let isCancelled = false;

    async function loadSavedPlot() {
      try {
        const result = await fetchBandStagePlotFromDatabase({
          userId: effectiveUserId,
          officialEmail: contactEmail || (bandProfile?.name ? `${bandProfile.name.toLowerCase().replace(/\s+/g, "")}@giglizard.com` : "booking@giglizard.us"),
          bandId: effectiveBandId
        });

        if (isCancelled) return;

        if (result && result.plotData) {
          const data = result.plotData;
          if (Array.isArray(data.elements) && data.elements.length > 0) {
            onUpdateElements(data.elements);
          } else if (elements.length === 0) {
            onUpdateElements(PRESET_ROCK_4PIECE);
          }
          if (Array.isArray(data.inputChannels) && data.inputChannels.length > 0) {
            setInputChannels(data.inputChannels);
          }
          if (data.theme && (data.theme === "blueprint" || data.theme === "stage" || data.theme === "print")) {
            setStageTheme(data.theme);
          }
          if (data.notes) {
            setMonitorNotes(data.notes);
          }
          if (data.paNotes) {
            setPaNotes(data.paNotes);
          }
          if (data.techContactPhone !== undefined) {
            setTechContactPhone(data.techContactPhone);
          }
          if (data.prodContactPhone !== undefined) {
            setProdContactPhone(data.prodContactPhone);
          }
          if (data.contactEmail !== undefined) {
            setContactEmail(data.contactEmail);
          }
          if (data.stagePlotUrl || result.stagePlotUrl) {
            setStagePlotUrl(data.stagePlotUrl || result.stagePlotUrl);
          }
          if (data.updatedAt) {
            setLastSavedTime(new Date(data.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' }));
          }
        } else if (elements.length === 0) {
          onUpdateElements(PRESET_ROCK_4PIECE);
        }
      } catch (err) {
        console.warn("Could not auto-load saved stage plot:", err);
        if (elements.length === 0) {
          onUpdateElements(PRESET_ROCK_4PIECE);
        }
      }
    }

    loadSavedPlot();

    return () => {
      isCancelled = true;
    };
  }, [effectiveUserId, effectiveBandId]);

  // Add new element to stage setup
  const handleAddTemplateToStage = (template: ToolboxItem) => {
    const spawnOffset = (elements.length % 5) * 4;
    const newEl: StageElement = {
      id: `${template.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: template.type,
      label: template.label,
      x: Math.min(80, Math.max(20, 50 + spawnOffset - 8)),
      y: Math.min(80, Math.max(20, 50 + spawnOffset - 8)),
      rotation: 0,
      mixNumber: template.defaultMix,
      kickType: template.kickType || (template.type === "drum_kit" ? "single" : undefined)
    };
    onUpdateElements([...elements, newEl]);
    setSelectedId(newEl.id);

    if (template.type === "drum_kit" && template.kickType === "dual") {
      setInputChannels(prev => {
        const hasKick2 = prev.some(c => c.instrument.toUpperCase().includes("KICK 2"));
        if (!hasKick2) {
          const kickIndex = prev.findIndex(c => c.instrument.toUpperCase().includes("KICK"));
          if (kickIndex !== -1) {
            const next = [...prev];
            next[kickIndex] = { ...next[kickIndex], instrument: "KICK 1 (SHURE B52)" };
            const newKick2: InputChannel = {
              channel: next.length + 1,
              instrument: "KICK 2 (SHURE B52)",
              micOrDi: "SHURE B52",
              stand: "Short Boom",
              phantomPower: false,
              notes: "Second bass drum"
            };
            next.splice(kickIndex + 1, 0, newKick2);
            return next.map((c, idx) => ({ ...c, channel: idx + 1 }));
          }
        }
        return prev;
      });
    }

    triggerToast(`Added ${template.label} to stage. Drag to place.`, "info");
  };

  // Remove element
  const handleRemoveItem = (id: string) => {
    onUpdateElements(elements.filter(el => el.id !== id));
    if (editingId === id) setEditingId(null);
    if (selectedId === id) setSelectedId(null);
  };

  // Rotate element (90-degree increments)
  const handleRotateItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, rotation: (el.rotation + 90) % 360 };
      }
      return el;
    });
    onUpdateElements(updated);
  };

  // Duplicate element (+1)
  const handleDuplicateItem = (el: StageElement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const copy: StageElement = {
      ...el,
      id: `${el.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      x: Math.min(88, el.x + 5),
      y: Math.min(88, el.y + 5)
    };
    onUpdateElements([...elements, copy]);
    setSelectedId(copy.id);
    triggerToast(`Duplicated ${el.label}`, "info");
  };

  // Set Monitor Mix Number (for wedges)
  const handleSetMixNumber = (id: string, mix: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = elements.map(el => {
      if (el.id === id) {
        return { ...el, mixNumber: mix };
      }
      return el;
    });
    onUpdateElements(updated);
  };

  // Label editing
  const handleStartEditingLabel = (el: StageElement, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    setSelectedId(id);
    const rect = containerRef.current.getBoundingClientRect();
    const pointerPercentX = ((clientX - rect.left) / rect.width) * 100;
    const pointerPercentY = ((clientY - rect.top) / rect.height) * 100;
    dragOffset.current = {
      x: pointerPercentX - elX,
      y: pointerPercentY - elY
    };
    setActiveDragId(id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!activeDragId || !containerRef.current) return;
    updateDragPosition(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!activeDragId || !containerRef.current || e.touches.length === 0) return;
    updateDragPosition(e.touches[0].clientX, e.touches[0].clientY);
  };

  const updateDragPosition = (clientX: number, clientY: number) => {
    if (!containerRef.current || !activeDragId) return;
    const rect = containerRef.current.getBoundingClientRect();
    let newX = ((clientX - rect.left) / rect.width) * 100 - dragOffset.current.x;
    let newY = ((clientY - rect.top) / rect.height) * 100 - dragOffset.current.y;

    if (snapToGrid) {
      newX = Math.round(newX / 2.5) * 2.5;
      newY = Math.round(newY / 2.5) * 2.5;
    }

    newX = Math.max(6, Math.min(94, newX));
    newY = Math.max(12, Math.min(92, newY));

    const updated = elements.map(el => {
      if (el.id === activeDragId) {
        return { ...el, x: Math.round(newX * 10) / 10, y: Math.round(newY * 10) / 10 };
      }
      return el;
    });
    onUpdateElements(updated);
  };

  const handleStopDrag = () => {
    setActiveDragId(null);
  };

  // Load Presets
  const handleLoadPreset = (preset: "standard" | "rock" | "acoustic" | "clear") => {
    if (preset === "standard") {
      onUpdateElements(PRESET_PROFESSIONAL_LIVE_BAND);
      setInputChannels(DEFAULT_INPUT_CHANNELS);
      triggerToast("Loaded Standard Live Band rider layout.", "success");
    } else if (preset === "rock") {
      onUpdateElements(PRESET_ROCK_4PIECE);
      triggerToast("Loaded 4-Piece Rock Band preset.", "success");
    } else if (preset === "acoustic") {
      onUpdateElements(PRESET_ACOUSTIC_TRIO);
      triggerToast("Loaded Acoustic Trio preset.", "success");
    } else if (preset === "clear") {
      onUpdateElements([]);
      setSelectedId(null);
      triggerToast("Cleared stage canvas.", "info");
    }
  };

  const handleAddChannelRow = () => {
    const nextCh = inputChannels.length > 0 ? Math.max(...inputChannels.map(c => c.channel)) + 1 : 1;
    const newRow: InputChannel = {
      channel: nextCh,
      instrument: "GUEST / AUX",
      micOrDi: "SM58 / ACTIVE DI",
      stand: "Tall Boom",
      phantomPower: false,
      notes: "Aux input foldback"
    };
    setInputChannels([...inputChannels, newRow]);
  };

  const handleUpdateChannelField = (chNum: number, field: keyof InputChannel, value: any) => {
    setInputChannels(prev => prev.map(c => c.channel === chNum ? { ...c, [field]: value } : c));
  };

  const handleRemoveChannel = (chNum: number) => {
    setInputChannels(prev => prev.filter(c => c.channel !== chNum));
  };

  // Technical Summary Calculations
  const monitorWedges = useMemo(() => elements.filter(e => e.type === "monitor_wedge" || e.type === "dual_wedge"), [elements]);
  const powerDrops = useMemo(() => elements.filter(e => e.type === "power_drop"), [elements]);

  // Database Persistence
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
        notes: monitorNotes,
        paNotes,
        techContactPhone,
        prodContactPhone,
        contactEmail,
        stagePlotUrl,
        updatedAt: now
      };

      await saveBandStagePlotToDatabase({
        userId: effectiveUserId,
        officialEmail: effectiveEmail,
        bandId: effectiveBandId,
        bandName: effectiveBandName,
        stagePlotData: plotData
      });

      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      triggerToast("✓ Stage plot & tech rider saved live to Supabase!", "success");
    } catch (err: any) {
      console.error("Save stage plot error:", err);
      triggerToast(`Could not persist to database: ${err?.message || err}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Export PDF or PNG Sheet
  const handleExportVenueSheet = async (format: "pdf" | "png") => {
    if (!exportCardRef.current) return;
    setIsExporting(true);
    triggerToast(`Rendering high-res ${format.toUpperCase()} tech sheet...`, "info");

    try {
      const exportElem = exportCardRef.current;
      const canvas = await html2canvas(exportElem, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff"
      });

      const fileName = `${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-stage-plot-${new Date().toISOString().split("T")[0]}`;

      if (format === "png") {
        const imageUri = canvas.toDataURL("image/png");
        const link = document.createElement("a");
        link.download = `${fileName}.png`;
        link.href = imageUri;
        link.click();
      } else {
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "pt",
          format: "letter"
        });
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * pageWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
        pdf.save(`${fileName}.pdf`);
      }

      // Upload to Supabase Storage in 'band-assets' bucket
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          const uploadRes = await uploadStagePlotToStorage({
            bandIdOrSlug: effectiveBandName,
            blob,
            fileExt: "png",
            contentType: "image/png"
          });

          if (uploadRes.publicUrl) {
            setStagePlotUrl(uploadRes.publicUrl);
            await updateBandStagePlotUrl({
              userId: effectiveUserId,
              officialEmail: effectiveEmail,
              bandId: effectiveBandId,
              stagePlotUrl: uploadRes.publicUrl
            });
            triggerToast(`✓ Tech sheet uploaded to cloud backup & saved!`, "success");
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

  // Copy shareable public link
  const handleCopyPublicLink = async () => {
    try {
      const origin = window.location.origin;
      const cleanSlug = (effectiveBandName || "artist").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
      const publicUrl = `${origin}/stage-plot/${cleanSlug}`;
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      triggerToast("✓ Public stage plot link copied! Send to venue sound engineers.", "success");
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (_) {
      triggerToast("Could not copy link automatically. Please copy the URL from your browser.", "error");
    }
  };

  const selectedElement = useMemo(() => elements.find(el => el.id === selectedId), [elements, selectedId]);

  // Sizing helper for instruments and monitors on canvas
  const getElementSizeClasses = (type: EquipmentType) => {
    switch (type) {
      case "drum_kit":
        return "w-32 h-32 sm:w-44 sm:h-44 -ml-16 -mt-16 sm:-ml-22 sm:-mt-22";
      case "dual_wedge":
        return "w-28 h-20 sm:w-36 sm:h-24 -ml-14 -mt-10 sm:-ml-18 sm:-mt-12";
      case "keyboard_rig":
        return "w-24 h-20 sm:w-28 sm:h-22 -ml-12 -mt-10 sm:-ml-14 sm:-mt-11";
      case "dj_turntables":
        return "w-26 h-20 sm:w-30 sm:h-22 -ml-13 -mt-10 sm:-ml-15 sm:-mt-11";
      case "guitar_amp":
      case "bass_amp":
        return "w-20 h-20 sm:w-24 sm:h-24 -ml-10 -mt-10 sm:-ml-12 sm:-mt-12";
      case "electric_guitar":
      case "bass_guitar":
      case "acoustic_guitar":
        return "w-18 h-24 sm:w-22 sm:h-28 -ml-9 -mt-12 sm:-ml-11 sm:-mt-14";
      case "laptop_rig":
        return "w-20 h-20 sm:w-24 sm:h-24 -ml-10 -mt-10 sm:-ml-12 sm:-mt-12";
      case "saxophone":
        return "w-18 h-18 sm:w-20 sm:h-20 -ml-9 -mt-9 sm:-ml-10 sm:-mt-10";
      case "drum_pad":
        return "w-16 h-16 sm:w-18 sm:h-18 -ml-8 -mt-8 sm:-ml-9 sm:-mt-9";
      case "monitor_wedge":
        return "w-18 h-16 sm:w-22 sm:h-20 -ml-9 -mt-8 sm:-ml-11 sm:-mt-10";
      case "di_box":
        return "w-14 h-14 sm:w-16 sm:h-16 -ml-7 -mt-7 sm:-ml-8 sm:-mt-8";
      case "vocal_mic":
      case "instrument_mic":
        return "w-18 h-22 sm:w-20 sm:h-24 -ml-9 -mt-11 sm:-ml-10 sm:-mt-12";
      default:
        return "w-18 h-18 sm:w-20 sm:h-20 -ml-9 -mt-9 sm:-ml-10 sm:-mt-10";
    }
  };

  // Group input channels into 3 clean columns matching the reference document
  const column1 = inputChannels.slice(0, 7);
  const column2 = inputChannels.slice(7, 14);
  const column3 = inputChannels.slice(14);

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="stage-designer-main-wrapper">
      {/* Toast notifications */}
      {saveToast.show && (
        <div 
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold border transition-all animate-in fade-in slide-in-from-top-4 ${
            saveToast.type === "success" 
              ? "bg-slate-900 text-emerald-300 border-emerald-500/50 shadow-emerald-950/50" 
              : saveToast.type === "error"
              ? "bg-slate-900 text-rose-300 border-rose-500/50 shadow-rose-950/50"
              : "bg-slate-900 text-indigo-300 border-indigo-500/50 shadow-indigo-950/50"
          }`}
          id="toast-stage-feedback"
        >
          {saveToast.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : saveToast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
          )}
          <span>{saveToast.message}</span>
        </div>
      )}

      {/* Main Designer Controls Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400 bg-indigo-500/20 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Concert Rider &amp; Stage Plot
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {lastSavedTime ? `Synced: ${lastSavedTime}` : "Ready to export"}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>{effectiveBandName}</span>
            <span className="text-slate-500 font-normal text-sm hidden sm:inline">• Stage Layout &amp; Channel Patch</span>
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Clear, clean graphics with monitor mix sends (OUT 1-5), instruments, and patch list for venue sound engineers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="flex-1 md:flex-initial bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
          >
            <Download className="w-4 h-4" />
            <span>Export Sheet (PDF / PNG)</span>
          </button>

          <button
            type="button"
            onClick={handleSaveStagePlot}
            disabled={isSaving}
            className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3.5 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" /> : <Save className="w-3.5 h-3.5" />}
            <span>{isSaving ? "Saving..." : "Save to Cloud"}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPublicLink}
            className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2.5 px-3 rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
            title="Copy shareable link for venue talent buyers and sound engineers"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Copied" : "Share"}</span>
          </button>
        </div>
      </div>

      {/* Main Designer Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="stage-designer-panel">
        
        {/* Left Column: Gear Toolbox & Presets */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-xs" id="plot-toolbox">
          <div>
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center justify-between">
              <span>Stage Gear Library</span>
              <span className="text-[10px] font-normal text-slate-400">Click to place</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Add instruments, vocal mics, and floor wedges to your stage setup.
            </p>
          </div>

          {/* Categorized Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setActiveToolboxTab("all")}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                activeToolboxTab === "all" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setActiveToolboxTab("backline")}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                activeToolboxTab === "backline" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Instruments
            </button>
            <button
              type="button"
              onClick={() => setActiveToolboxTab("monitoring")}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                activeToolboxTab === "monitoring" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Monitors
            </button>
            <button
              type="button"
              onClick={() => setActiveToolboxTab("mics")}
              className={`flex-1 py-1 rounded-lg transition-colors cursor-pointer text-center ${
                activeToolboxTab === "mics" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Mics/DI
            </button>
          </div>

          {/* Gear Palette Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2 max-h-[440px] overflow-y-auto pr-1" id="toolbox-items-list">
            {TOOLBOX_TEMPLATES.filter(tmpl => activeToolboxTab === "all" || tmpl.category === activeToolboxTab).map((tmpl) => (
              <button
                key={`${tmpl.type}-${tmpl.label}`}
                type="button"
                id={`btn-toolbox-${tmpl.type}-${tmpl.kickType || "default"}`}
                onClick={() => handleAddTemplateToStage(tmpl)}
                className="w-full flex items-center justify-between text-left p-2 rounded-xl border border-slate-200/90 hover:border-indigo-400 hover:bg-indigo-50/30 text-xs font-bold text-slate-800 group transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center p-0.5 shrink-0 border border-slate-200 group-hover:border-indigo-300">
                    <StageGearGraphic type={tmpl.type} label="" theme="print" mixNumber={tmpl.defaultMix || 1} kickType={tmpl.kickType} />
                  </div>
                  <div className="truncate">
                    <div className="truncate text-xs text-slate-900">{tmpl.label}</div>
                    <div className="text-[10px] font-normal text-slate-400 truncate">{tmpl.defaultMic}</div>
                  </div>
                </div>
                <Plus className="w-3.5 h-3.5 shrink-0 text-slate-400 group-hover:text-indigo-600 group-hover:scale-110 transition-transform" />
              </button>
            ))}
          </div>

          <hr className="border-slate-100" />

          {/* Band Layout Presets */}
          <div className="space-y-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Stage Layout Presets
            </div>
            <div className="grid grid-cols-1 gap-1.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleLoadPreset("standard")}
                className="p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100/70 text-indigo-900 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <span>⭐ Clean Rider Standard (Reference)</span>
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("rock")}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700 text-left transition-all cursor-pointer"
              >
                🎸 4-Piece Rock Band
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("acoustic")}
                className="p-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 text-slate-700 text-left transition-all cursor-pointer"
              >
                🪕 Acoustic Trio / Folk
              </button>
              <button
                type="button"
                onClick={() => handleLoadPreset("clear")}
                className="p-2 rounded-xl border border-rose-100 hover:border-rose-300 hover:bg-rose-50 text-rose-600 text-left transition-all cursor-pointer"
              >
                🗑️ Clear Stage
              </button>
            </div>
          </div>
        </div>

        {/* Center / Right Column: Canvas + Patch + Notes */}
        <div 
          className="lg:col-span-3 space-y-5" 
          id="stage-workspace"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onMouseUp={handleStopDrag}
          onTouchEnd={handleStopDrag}
        >
          {/* Canvas Sub-Header & Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-indigo-600" />
                Stage Canvas ({elements.length} placed items)
              </span>
              <button
                type="button"
                onClick={() => setSnapToGrid(!snapToGrid)}
                className={`text-[11px] font-bold px-2 py-1 rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                  snapToGrid ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
                title="Toggle Snap to Grid alignment"
              >
                <Grid className="w-3 h-3" />
                <span>Snap Grid</span>
              </button>
            </div>
            
            {/* Display Aesthetic Mode */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400 font-bold hidden sm:inline">Theme:</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200" id="theme-pills-frame">
                <button 
                  type="button"
                  id="btn-theme-print"
                  onClick={() => setStageTheme("print")}
                  className={`text-[11px] px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    stageTheme === 'print' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📄 Studio White (Clean)
                </button>
                <button 
                  type="button"
                  id="btn-theme-blueprint"
                  onClick={() => setStageTheme("blueprint")}
                  className={`text-[11px] px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    stageTheme === 'blueprint' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  📐 CAD Blueprint
                </button>
                <button 
                  type="button"
                  id="btn-theme-stage"
                  onClick={() => setStageTheme("stage")}
                  className={`text-[11px] px-2.5 py-1 font-bold rounded-lg transition-all cursor-pointer ${
                    stageTheme === 'stage' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  🏟️ Concert Stage
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Stage Canvas */}
          <div 
            ref={containerRef}
            id="live-stage-canvas"
            onClick={() => setSelectedId(null)}
            className={`relative rounded-3xl w-full aspect-[4/3] sm:aspect-[16/10] min-h-[380px] max-h-[640px] overflow-hidden shadow-xl selection:bg-transparent touch-none select-none transition-colors duration-200 border-2 ${
              stageTheme === "print"
                ? "bg-white border-slate-300"
                : stageTheme === "blueprint" 
                ? "bg-[#030c1e] border-[#0a2540]" 
                : "bg-slate-950 border-slate-900"
            }`}
          >
            {/* Top Pleated Stage Backdrop Curtain */}
            <div className="absolute top-0 left-0 right-0 h-10 sm:h-12 pointer-events-none z-10 overflow-hidden">
              <svg className="w-full h-full select-none" viewBox="0 0 1000 48" preserveAspectRatio="none" fill="none">
                <defs>
                  <linearGradient id="curtain-base" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="35%" stopColor="#1e293b" />
                    <stop offset="70%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                  <linearGradient id="curtain-pleat" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="50%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="1000" height="42" fill="url(#curtain-base)" />
                {Array.from({ length: 40 }).map((_, i) => (
                  <path
                    key={i}
                    d={`M ${i * 25} 0 Q ${i * 25 + 12.5} 46 ${(i + 1) * 25} 0`}
                    fill="url(#curtain-pleat)"
                    opacity="0.85"
                  />
                ))}
                <line x1="0" y1="42" x2="1000" y2="42" stroke="#475569" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>

            {/* Clean Center Band Title Header */}
            <div className="absolute top-2.5 left-0 right-0 text-center pointer-events-none z-20">
              <span className={`text-base sm:text-lg font-black tracking-tight drop-shadow-xs ${
                stageTheme === "print" ? "text-slate-900" : "text-white"
              }`}>
                {effectiveBandName}
              </span>
            </div>

            {/* Background Grid Pattern (Blueprint or Subtle Print) */}
            <div className="absolute inset-0 pointer-events-none select-none z-0">
              {stageTheme === "blueprint" && (
                <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="cad-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                      <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#0e3a6c" strokeWidth="0.8" opacity="0.6" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#cad-grid)" />
                  <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 4" opacity="0.3" />
                  <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="6 4" opacity="0.3" />
                </svg>
              )}
            </div>

            {/* Placed Elements on Canvas */}
            {elements.map((el) => {
              const isEditingThis = editingId === el.id;
              const isDraggingThis = activeDragId === el.id;
              const isSelectedThis = selectedId === el.id;
              const sizeClasses = getElementSizeClasses(el.type);

              return (
                <div
                  key={el.id}
                  id={`placed-gear-${el.id}`}
                  className={`absolute ${sizeClasses} flex flex-col group touch-none cursor-grab active:cursor-grabbing select-none`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    zIndex: isDraggingThis ? 60 : isSelectedThis ? 40 : 20
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(el.id);
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
                      if (e.cancelable) e.preventDefault();
                      handleStartDrag(el.id, e.touches[0].clientX, e.touches[0].clientY, el.x, el.y);
                    }}
                  >
                    {/* Render High-Fidelity SVG Gear Graphic */}
                    <StageGearGraphic 
                      type={el.type} 
                      label={el.label} 
                      rotation={el.rotation} 
                      isDragging={isDraggingThis}
                      isSelected={isSelectedThis}
                      mixNumber={el.mixNumber}
                      theme={stageTheme}
                      kickType={el.kickType}
                    />

                    {/* Floating Click-and-Delete Button on Selected Element */}
                    {isSelectedThis && (
                      <button
                        type="button"
                        title="Delete item (Delete / Backspace)"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(el.id);
                          triggerToast(`Removed ${el.label} from stage plot`, "info");
                        }}
                        className="absolute -top-3 -right-3 z-[80] w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg border-2 border-white cursor-pointer transition-transform hover:scale-110 active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Quick Kick Setup Pill above Drum Kit when selected */}
                    {isSelectedThis && el.type === "drum_kit" && (
                      <div 
                        className="absolute -top-8 left-1/2 -translate-x-1/2 z-[80] bg-slate-900/95 backdrop-blur-xs text-white rounded-lg p-1 shadow-xl flex items-center gap-1 border border-slate-700 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleKickType(el.id, "single")}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            (el.kickType || "single") === "single" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          Single Kick
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleKickType(el.id, "dual")}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            el.kickType === "dual" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800"
                          }`}
                        >
                          Double Kick
                        </button>
                      </div>
                    )}

                    {/* Inline Label Editing Popover */}
                    {isEditingThis && (
                      <div 
                        className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl p-1.5 shadow-2xl flex gap-1 z-[70] w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          value={editText}
                          autoFocus
                          onChange={(e) => setEditText(e.target.value)}
                          className="text-[11px] w-full p-1 border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 font-bold"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveLabel(el.id);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveLabel(el.id)}
                          className="bg-indigo-600 text-white text-[10px] font-bold py-1 px-2 rounded-md cursor-pointer"
                        >
                          OK
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Downstage Edge Marker: "To Crowd" */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none flex flex-col items-center pb-2 select-none">
              <div className={`w-full border-t border-dashed mb-1.5 transition-colors ${
                stageTheme === "print"
                  ? "border-slate-300"
                  : stageTheme === "blueprint"
                  ? "border-sky-500/30"
                  : "border-slate-800"
              }`} />
              <div className={`flex items-center gap-2 px-4 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest border transition-colors shadow-xs ${
                stageTheme === "print"
                  ? "bg-slate-100/95 text-slate-800 border-slate-300"
                  : stageTheme === "blueprint"
                  ? "bg-[#061833]/90 text-sky-300 border-sky-600/50"
                  : "bg-slate-900/95 text-slate-200 border-slate-700"
              }`}>
                <span className="text-[9px] text-red-500 font-bold">▼</span>
                <span>To Crowd</span>
                <span className="text-[9px] text-red-500 font-bold">▼</span>
              </div>
            </div>

            {/* Subtle Stage Left / Stage Right Orientations */}
            <div className="absolute bottom-2 left-4 pointer-events-none z-10 hidden sm:block select-none">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                stageTheme === "print" ? "text-slate-400" : "text-slate-600"
              }`}>
                Stage Right
              </span>
            </div>
            <div className="absolute bottom-2 right-4 pointer-events-none z-10 hidden sm:block select-none">
              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                stageTheme === "print" ? "text-slate-400" : "text-slate-600"
              }`}>
                Stage Left
              </span>
            </div>
          </div>

          {/* Quick Context Action Bar for Selected Item */}
          {selectedElement && (
            <div className="bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-3 animate-in fade-in" id="gear-context-menu">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-indigo-300">Selected Item:</span>
                <span className="text-xs font-black text-white bg-slate-800 px-2 py-0.5 rounded-md border border-slate-700">
                  {selectedElement.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  X: {Math.round(selectedElement.x)}% • Y: {Math.round(selectedElement.y)}%
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Kick Setup Selector for Drum Kit */}
                {selectedElement.type === "drum_kit" && (
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-indigo-300 px-1">Kick Setup:</span>
                    <button
                      type="button"
                      onClick={() => handleToggleKickType(selectedElement.id, "single")}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        (selectedElement.kickType || "single") === "single" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Single Kick
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleKickType(selectedElement.id, "dual")}
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded cursor-pointer transition-colors ${
                        selectedElement.kickType === "dual" ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-700"
                      }`}
                    >
                      Double Kick
                    </button>
                  </div>
                )}

                {/* Mix Number Selector for Monitor Wedges */}
                {(selectedElement.type === "monitor_wedge" || selectedElement.type === "dual_wedge") && (
                  <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <span className="text-[10px] font-bold text-red-400 px-1">OUT Send:</span>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={(e) => handleSetMixNumber(selectedElement.id, num, e)}
                        className={`text-[10px] font-extrabold w-6 h-6 rounded flex items-center justify-center cursor-pointer transition-colors ${
                          selectedElement.mixNumber === num ? "bg-red-600 text-white" : "text-slate-300 hover:bg-slate-700"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => handleRotateItem(selectedElement.id, e)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Rotate 90 degrees"
                >
                  <RotateCw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Rotate</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDuplicateItem(selectedElement, e)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Duplicate gear"
                >
                  <Copy className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleStartEditingLabel(selectedElement, e)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                  title="Rename label"
                >
                  <Type className="w-3.5 h-3.5 text-amber-400" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRemoveItem(selectedElement.id)}
                  className="bg-rose-950/80 hover:bg-rose-900 text-rose-200 text-xs font-bold py-1.5 px-3 rounded-lg border border-rose-800/80 flex items-center gap-1 cursor-pointer"
                  title="Delete element"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Clean Channel Patch List & Monitor Specs Section */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5 shadow-xs" id="patch-list-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTabSection("patch")}
                  className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTabSection === "patch" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  📋 Clean Patch Sheet (3 Columns)
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabSection("table")}
                  className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTabSection === "table" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  📊 Full Table Editor
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTabSection("specs")}
                  className={`text-xs font-black uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
                    activeTabSection === "specs" 
                      ? "bg-slate-900 text-white shadow-xs" 
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  🔊 Monitors &amp; PA Specs
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleAddChannelRow}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold py-1.5 px-3 rounded-lg border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Channel
                </button>
              </div>
            </div>

            {/* TAB 1: Clean 3-Column Patch List matching the user's reference diagram */}
            {activeTabSection === "patch" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs" id="clean-patch-columns-view">
                  {/* Column 1 (Ch 1 - 7) */}
                  <div className="space-y-2.5">
                    {column1.map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                            {ch.channel}
                          </span>
                          <span className="font-extrabold text-slate-900 tracking-tight">
                            {ch.instrument}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          ({ch.micOrDi})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Column 2 (Ch 8 - 14) */}
                  <div className="space-y-2.5">
                    {column2.map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                            {ch.channel}
                          </span>
                          <span className="font-extrabold text-slate-900 tracking-tight">
                            {ch.instrument}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          ({ch.micOrDi})
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Column 3 (Ch 15 - 19) */}
                  <div className="space-y-2.5">
                    {column3.map((ch) => (
                      <div key={ch.channel} className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-[11px] flex items-center justify-center shrink-0">
                            {ch.channel}
                          </span>
                          <span className="font-extrabold text-slate-900 tracking-tight">
                            {ch.instrument}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 uppercase">
                          ({ch.micOrDi})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <hr className="border-slate-100 my-4" />

                {/* Monitors, PA & Day-of-Show Contact Blocks */}
                <div className="space-y-3 text-xs leading-relaxed">
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                      MONITORS:
                    </h4>
                    <p className="text-slate-700 mt-0.5">
                      {monitorNotes}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {placedMonitors.length > 0 ? (
                        placedMonitors.map((mon, idx) => (
                          <span key={mon.id} className="bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1.5">
                            <span className="bg-red-600 text-white px-1.5 py-0.2 rounded font-black text-[9px]">
                              OUT {mon.mixNumber || idx + 1}
                            </span>
                            <span>{mon.label} {mon.type === "dual_wedge" ? "(Dual Wedges - 2 units)" : "(1 unit)"}</span>
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">No monitor wedges placed on stage yet. Add wedges from the toolbox.</span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                      PA:
                    </h4>
                    <p className="text-slate-700 mt-0.5">
                      {paNotes}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="font-black text-slate-900 uppercase tracking-wider text-[11px]">
                        Band &amp; Technical Contacts:
                      </div>
                      {!isLoggedIn && onTriggerLogin && (
                        <button
                          type="button"
                          onClick={onTriggerLogin}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors cursor-pointer w-fit"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign in to auto-fill with band contact info</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Sound technical contact
                        </label>
                        <input
                          type="text"
                          value={techContactPhone}
                          onChange={(e) => setTechContactPhone(e.target.value)}
                          placeholder={isLoggedIn ? "Phone number..." : "e.g. (555) 234-5678"}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Production contact
                        </label>
                        <input
                          type="text"
                          value={prodContactPhone}
                          onChange={(e) => setProdContactPhone(e.target.value)}
                          placeholder={isLoggedIn ? "Phone number..." : "e.g. (555) 345-6789"}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={contactEmail}
                          onChange={(e) => setContactEmail(e.target.value)}
                          placeholder={isLoggedIn ? "band@contact.com" : "contact@yourband.com"}
                          className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Full Detailed Table Editor */}
            {activeTabSection === "table" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <th className="py-2.5 px-3 w-12 text-center">Ch</th>
                      <th className="py-2.5 px-3">Instrument / Source</th>
                      <th className="py-2.5 px-3">Mic / Transducer Spec</th>
                      <th className="py-2.5 px-3">Stand Type</th>
                      <th className="py-2.5 px-3 text-center">+48V</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inputChannels.map((ch) => (
                      <tr key={ch.channel} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-2 px-3 text-center font-bold text-slate-900 font-mono">
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

            {/* TAB 3: Audio & Monitoring Specs Editor */}
            {activeTabSection === "specs" && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-800">
                      Monitor Specification
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Stage Layout: {monitorUnitCount} units
                      </span>
                      {userCustomizedMonitors && (
                        <button
                          type="button"
                          onClick={() => {
                            setUserCustomizedMonitors(false);
                            setMonitorNotes(`${monitorUnitCount} units 12" monitors. They must all be the same model and with independent sends.`);
                            triggerToast("Reset monitor specs to current stage layout.", "info");
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                        >
                          Sync with Stage ({monitorUnitCount} units)
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={monitorNotes}
                    onChange={(e) => {
                      setUserCustomizedMonitors(true);
                      setMonitorNotes(e.target.value);
                    }}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    FOH PA Specification
                  </label>
                  <textarea
                    rows={3}
                    value={paNotes}
                    onChange={(e) => setPaNotes(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Sound Technical Contact Phone
                    </label>
                    <input
                      type="text"
                      value={techContactPhone}
                      placeholder={isLoggedIn ? "" : "e.g. (555) 234-5678"}
                      onChange={(e) => setTechContactPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Production Contact Phone
                    </label>
                    <input
                      type="text"
                      value={prodContactPhone}
                      placeholder={isLoggedIn ? "" : "e.g. (555) 345-6789"}
                      onChange={(e) => setProdContactPhone(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Official Contact Email
                    </label>
                    <input
                      type="email"
                      value={contactEmail}
                      placeholder={isLoggedIn ? "" : "contact@yourband.com"}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Export Venue Tech Sheet</h3>
                  <p className="text-xs text-slate-500">Print-ready 300 DPI stage plot &amp; channel patch</p>
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
                      Standard letter format matching live touring rider specs.
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
              </button>

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
                      High-resolution PNG with stage canvas, gear, and patch list.
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-300 group-hover:text-slate-800 group-hover:scale-110 transition-all" />
              </button>
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

      {/* Semantic Musician Guide & SEO Content */}
      <StagePlotSeoGuide />

      {/* High-Resolution Printable Tech Sheet Template (Captured by html2canvas)
          Rendered on pristine white background exactly matching the user's reference rider! */}
      <div className="overflow-hidden h-0 opacity-0 pointer-events-none select-none">
        <div 
          ref={exportCardRef}
          style={{ width: "950px", backgroundColor: "#ffffff" }}
          className="bg-white text-slate-900 p-8 font-sans space-y-6"
        >
          {/* Header */}
          <div className="text-center pb-2">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">
              {effectiveBandName}
            </h1>
          </div>

          {/* Visual Stage Diagram Section */}
          <div className="relative border-2 border-slate-900 rounded-lg h-[500px] w-full overflow-hidden bg-white">
            {/* Top Pleated Stage Backdrop Curtain */}
            <div className="absolute top-0 left-0 right-0 h-12 pointer-events-none z-10 overflow-hidden">
              <svg className="w-full h-full select-none" viewBox="0 0 1000 48" preserveAspectRatio="none" fill="none">
                <defs>
                  <linearGradient id="exp-curtain-base" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="35%" stopColor="#1e293b" />
                    <stop offset="70%" stopColor="#0f172a" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                  <linearGradient id="exp-curtain-pleat" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000000" />
                    <stop offset="50%" stopColor="#334155" />
                    <stop offset="100%" stopColor="#000000" />
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="1000" height="42" fill="url(#exp-curtain-base)" />
                {Array.from({ length: 40 }).map((_, i) => (
                  <path
                    key={i}
                    d={`M ${i * 25} 0 Q ${i * 25 + 12.5} 46 ${(i + 1) * 25} 0`}
                    fill="url(#exp-curtain-pleat)"
                    opacity="0.85"
                  />
                ))}
                <line x1="0" y1="42" x2="1000" y2="42" stroke="#475569" strokeWidth="1" opacity="0.5" />
              </svg>
            </div>

            {/* Placed Elements Graphic */}
            {elements.map((el) => {
              const sizeClasses = getElementSizeClasses(el.type);
              return (
                <div
                  key={el.id}
                  className={`absolute ${sizeClasses} flex flex-col`}
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`
                  }}
                >
                  <StageGearGraphic 
                    type={el.type} 
                    label={el.label} 
                    rotation={el.rotation} 
                    mixNumber={el.mixNumber}
                    theme="print" 
                    kickType={el.kickType}
                  />
                </div>
              );
            })}

            {/* Downstage Edge Marker: "To Crowd" */}
            <div className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none flex flex-col items-center pb-2 select-none">
              <div className="w-full border-t border-dashed border-slate-300 mb-1.5" />
              <div className="flex items-center gap-2 px-5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-slate-100 text-slate-900 border border-slate-300 shadow-xs">
                <span className="text-[10px] text-red-600 font-bold">▼</span>
                <span>To Crowd</span>
                <span className="text-[10px] text-red-600 font-bold">▼</span>
              </div>
            </div>

            {/* Subtle Stage Left / Stage Right Orientations */}
            <div className="absolute bottom-2 left-4 pointer-events-none z-10 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Stage Right
              </span>
            </div>
            <div className="absolute bottom-2 right-4 pointer-events-none z-10 select-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Stage Left
              </span>
            </div>
          </div>

          {/* 3-Column Channel Input List matching reference document */}
          <div className="pt-2">
            <div className="grid grid-cols-3 gap-6 text-xs">
              {/* Column 1 */}
              <div className="space-y-2">
                {column1.map((ch) => (
                  <div key={ch.channel} className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {ch.channel}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {ch.instrument}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 uppercase">
                      ({ch.micOrDi})
                    </span>
                  </div>
                ))}
              </div>

              {/* Column 2 */}
              <div className="space-y-2">
                {column2.map((ch) => (
                  <div key={ch.channel} className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {ch.channel}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {ch.instrument}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 uppercase">
                      ({ch.micOrDi})
                    </span>
                  </div>
                ))}
              </div>

              {/* Column 3 */}
              <div className="space-y-2">
                {column3.map((ch) => (
                  <div key={ch.channel} className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                        {ch.channel}
                      </span>
                      <span className="font-extrabold text-slate-900">
                        {ch.instrument}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-slate-600 uppercase">
                      ({ch.micOrDi})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monitors & PA Text Blocks */}
          <div className="space-y-3 text-xs leading-relaxed border-t border-slate-200 pt-3">
            <div>
              <div className="font-black text-slate-900 uppercase">MONITORS:</div>
              <p className="text-slate-800">{monitorNotes}</p>
              {placedMonitors.length > 0 && (
                <p className="text-slate-600 text-[11px] mt-1 font-medium">
                  <span className="font-bold text-slate-700">Mix Sends: </span>
                  {placedMonitors.map((m, idx) => `OUT ${m.mixNumber ?? idx + 1}: ${m.label} (${m.type === "dual_wedge" ? 'Dual 12" Wedge' : '12" Wedge'})`).join(" • ")}
                </p>
              )}
            </div>

            <div>
              <div className="font-black text-slate-900 uppercase">PA:</div>
              <p className="text-slate-800">{paNotes}</p>
            </div>

            <div className="text-[11px] text-slate-800 space-y-0.5 pt-1">
              <div>Sound technical contact: {techContactPhone || "________________________"}</div>
              <div>Production contact: {prodContactPhone || "________________________"}</div>
              <div>Email: {contactEmail || "________________________"}</div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-600">
            <span>Generated with <strong className="text-indigo-600">GigLizard</strong></span>
            <span>1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
