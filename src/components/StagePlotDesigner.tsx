import React, { useState, useRef, useEffect } from "react";
import { StageElement, EquipmentType } from "../types";
import { 
  Plus, Trash2, RotateCw, Type, EyeOff, Save, FolderOpen, 
  HelpCircle, Trash, Sliders, Sparkles, AlertCircle, RefreshCw 
} from "lucide-react";

interface StagePlotDesignerProps {
  elements: StageElement[];
  onUpdateElements: (elements: StageElement[]) => void;
}

const TOOLBOX_TEMPLATES: { type: EquipmentType; label: string; color: string }[] = [
  { type: "drum_kit", label: "Drum Kit", color: "bg-slate-800 text-white border-slate-700" },
  { type: "guitar_amp", label: "Guitar Amp", color: "bg-orange-500 text-white border-orange-600" },
  { type: "bass_amp", label: "Bass Rig", color: "bg-blue-600 text-white border-blue-700" },
  { type: "keyboard_rig", label: "Keyboard", color: "bg-purple-600 text-white border-purple-700" },
  { type: "vocal_mic", label: "Vocal Mic", color: "bg-rose-500 text-white border-rose-600" },
  { type: "instrument_mic", label: "Inst. Mic", color: "bg-teal-600 text-white border-teal-700" },
  { type: "monitor_wedge", label: "Monitor Wedge", color: "bg-amber-500 text-neutral-900 border-amber-600" },
  { type: "di_box", label: "DI Box", color: "bg-gray-400 text-slate-900 border-gray-500" },
  { type: "dj_turntables", label: "DJ Decks", color: "bg-violet-700 text-white border-violet-800" },
];

const INITIAL_ROCKS: StageElement[] = [
  { id: "drum-1", type: "drum_kit", label: "Drums", x: 50, y: 24, rotation: 0 },
  { id: "monitor-drums", type: "monitor_wedge", label: "Drum Mix", x: 38, y: 32, rotation: 0 },
  { id: "lead-vocal-1", type: "vocal_mic", label: "Lead Vocal", x: 50, y: 66, rotation: 0 },
  { id: "monitor-center", type: "monitor_wedge", label: "Vocal Mix", x: 50, y: 82, rotation: 0 },
  { id: "guitar-amp-1", type: "guitar_amp", label: "Guitar Amp", x: 20, y: 36, rotation: 0 },
  { id: "monitor-guitar", type: "monitor_wedge", label: "Gtr Mix", x: 20, y: 72, rotation: 0 },
  { id: "bass-amp-1", type: "bass_amp", label: "Bass Rig", x: 80, y: 36, rotation: 0 },
  { id: "monitor-bass", type: "monitor_wedge", label: "Bass Mix", x: 80, y: 72, rotation: 0 }
];

export default function StagePlotDesigner({ elements, onUpdateElements }: StagePlotDesignerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [stageTheme, setStageTheme] = useState<"wood" | "cyber" | "starlight">("wood");
  
  // Track offset of cursor relative to element center when drag started
  const dragOffset = useRef({ x: 0, y: 0 });

  // Load initial preset if state is empty
  useEffect(() => {
    if (elements.length === 0) {
      onUpdateElements(INITIAL_ROCKS);
    }
  }, []);

  // Handle adding new element to stage setup
  const handleAddTemplateToStage = (type: EquipmentType, label: string) => {
    const newEl: StageElement = {
      id: `${type}-${Date.now()}`,
      type,
      label,
      x: 50, // center default coordinate
      y: 50,
      rotation: 0
    };
    onUpdateElements([...elements, newEl]);
  };

  // Helper to remove item
  const handleRemoveItem = (id: string) => {
    onUpdateElements(elements.filter(el => el.id !== id));
    if (editingId === id) setEditingId(null);
  };

  // Rotation triggers - updates rotation in 90 degree increments
  const handleRotateItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // don't trigger select or drags
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

  // Unified Mouse & Touch movement drag handler
  const handleStartDrag = (id: string, clientX: number, clientY: number, elX: number, elY: number) => {
    if (!containerRef.current) return;
    setActiveDragId(id);
    
    const rect = containerRef.current.getBoundingClientRect();
    const pixelX = (elX / 100) * rect.width;
    const pixelY = (elY / 100) * rect.height;
    
    // Calculate cursor offset relative to item position
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
    
    // Calculate new position inside container
    const relativeX = clientX - rect.left - dragOffset.current.x;
    const relativeY = clientY - rect.top - dragOffset.current.y;
    
    // Convert back to percentages (capped to boundary edges)
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
    }
  };

  const handleClearStage = () => {
    if (window.confirm("Do you want to clear all gear off the stage canvas?")) {
      onUpdateElements([]);
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
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in" id="stage-designer-panel">
      {/* Toolbox sidebar - gear assets */}
      <div className="lg:col-span-1 bg-white rounded-xl border border-gray-100 p-5 space-y-5" id="plot-toolbox">
        <div>
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest" id="toolbox-title">
            Gear Toolbox
          </h3>
          <p className="text-[11px] text-gray-500 mt-1" id="toolbox-desc">
            Single-click an element below to generate it on-stage. Drag items around the stage grid to arrange your map.
          </p>
        </div>

        <div className="flex flex-col gap-2" id="toolbox-items-list">
          {TOOLBOX_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.type}
              type="button"
              id={`btn-toolbox-${tmpl.type}`}
              onClick={() => handleAddTemplateToStage(tmpl.type, tmpl.label)}
              className="w-full flex items-center justify-between text-left p-2.5 rounded-lg border border-gray-100 hover:border-indigo-400 hover:bg-indigo-50/20 text-xs font-bold text-gray-705 group transition-all transition-transform duration-100 hover:scale-[1.01] cursor-pointer"
            >
              <div className="flex items-center gap-2" id={`toolbox-wrap-${tmpl.type}`}>
                <span className={`w-3 h-3 rounded-full ${tmpl.color.split(" ")[0]}`} id={`toolbox-dot-${tmpl.type}`} />
                {tmpl.label}
              </div>
              <Plus className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 group-hover:scale-110" id={`toolbox-plus-${tmpl.type}`} />
            </button>
          ))}
        </div>

        <hr className="border-gray-50 my-2" id="toolbox-sep" />

        <div className="space-y-2" id="toolbox-utils">
          <button
            type="button"
            id="btn-plot-rock-preset"
            onClick={handleResetStage}
            className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs py-2 px-3 rounded-lg font-bold border border-slate-200 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reload 4-Piece Setup
          </button>
          <button
            type="button"
            id="btn-plot-clear-all"
            onClick={handleClearStage}
            className="w-full text-rose-600 hover:bg-rose-50 hover:text-rose-700 text-xs py-2 px-3 rounded-lg font-bold border border-transparent transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash className="w-3.5 h-3.5" />
            Clear Stage Gear
          </button>
        </div>
      </div>

      {/* Center Interactive Plot Canvas */}
      <div 
        className="lg:col-span-3 space-y-4" 
        id="stage-workspace"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onMouseUp={handleStopDrag}
        onTouchEnd={handleStopDrag}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-stretch justify-between gap-3 bg-white p-3 rounded-xl border border-gray-100" id="workspace-header-row">
          <div className="flex-1">
            <h3 className="text-sm font-extrabold text-slate-850 flex items-center gap-2" id="stage-plot-title">
              <Sliders className="w-4 h-4 text-indigo-600" />
              Custom Interactive Stage Plot Map
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5" id="stage-plot-desc">
              Arrange amps, mics, monitors, and drums relative to speakers, backline, and frontline.
            </p>
          </div>
          
          {/* Vibe / Stage Backdrops Selectors */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap" id="stage-theme-control-pack">
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200" id="theme-pills-frame">
              <button 
                type="button"
                id="btn-theme-wood"
                onClick={() => setStageTheme("wood")}
                className={`text-[10px] px-2.5 py-1 font-bold rounded-md transition-all cursor-pointer ${stageTheme === 'wood' ? 'bg-white text-amber-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                🌳 Classic Wood
              </button>
              <button 
                type="button"
                id="btn-theme-cyber"
                onClick={() => setStageTheme("cyber")}
                className={`text-[10px] px-2.5 py-1 font-bold rounded-md transition-all cursor-pointer ${stageTheme === 'cyber' ? 'bg-white text-indigo-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                👾 Neon Cyber
              </button>
              <button 
                type="button"
                id="btn-theme-starlight"
                onClick={() => setStageTheme("starlight")}
                className={`text-[10px] px-2.5 py-1 font-bold rounded-md transition-all cursor-pointer ${stageTheme === 'starlight' ? 'bg-white text-blue-950 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                ✨ Starlight
              </button>
            </div>
            
            <div className="hidden xl:block text-[9px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1.5 rounded-lg" id="coord-tip">
              Hover items to rotate / delete
            </div>
          </div>
        </div>

        {/* Physical Canvas Representation */}
        <div 
          ref={containerRef}
          id="live-stage-canvas"
          className="relative bg-slate-950 border-4 border-slate-950 rounded-2xl h-[490px] w-full overflow-hidden shadow-2xl selection:bg-transparent"
        >
          {/* Dynamic SVG theme representations absolute lay-under */}
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
                  
                  {/* Spotlights radiating down */}
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
                  
                  {/* Subtle plank repetition */}
                  <pattern id="wood-plank-grid" width="120" height="18" patternUnits="userSpaceOnUse">
                    <rect width="120" height="18" fill="none" stroke="#050201" strokeWidth="1" />
                    <line x1="60" y1="0" x2="60" y2="18" stroke="#050201" strokeWidth="1" />
                  </pattern>
                </defs>
                
                {/* Upper backstage brick wall zone */}
                <rect width="100%" height="22%" fill="url(#backstage-wall)" />
                {/* Horizontal stage platform divider line */}
                <line x1="0" y1="22%" x2="100%" y2="22%" stroke="#451a03" strokeWidth="3" opacity="0.9" />
                
                {/* Stage floor deck */}
                <rect y="22%" width="100%" height="78%" fill="url(#wood-floor)" />
                <rect y="22%" width="100%" height="78%" fill="url(#wood-plank-grid)" opacity="0.25" />
                
                {/* Wooden perspective guidelines matching physical vanishing points */}
                <g stroke="#000000" strokeWidth="1.2" opacity="0.4">
                  <line x1="10%" y1="22%" x2="-5%" y2="100%" />
                  <line x1="25%" y1="22%" x2="15%" y2="100%" />
                  <line x1="40%" y1="22%" x2="35%" y2="100%" />
                  <line x1="50%" y1="22%" x2="50%" y2="100%" />
                  <line x1="60%" y1="22%" x2="65%" y2="100%" />
                  <line x1="75%" y1="22%" x2="85%" y2="100%" />
                  <line x1="90%" y1="22%" x2="105%" y2="100%" />
                </g>

                {/* Spotlights geometry */}
                <polygon points="15%,0 0,490 280,490" fill="url(#spotlight-warm-l)" />
                <polygon points="85%,0 100%,490 620,490" fill="url(#spotlight-warm-r)" />

                {/* Decorative stage curtains border */}
                <path d="M 0 0 C 40 40, 20 180, 40 280 C 10 380, 30 450, 0 490 L 0 0 Z" fill="#881337" opacity="0.85" />
                <path d="M 100% 0 C calc(100% - 40) 40, calc(100% - 20) 180, calc(100% - 40) 280 C calc(100% - 10) 380, calc(100% - 30) 450, 100% 490 L 100% 0 Z" fill="#881337" opacity="0.85" />
              </svg>
            )}

            {stageTheme === "cyber" && (
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="cyber-base-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#040108" />
                    <stop offset="40%" stopColor="#080211" />
                    <stop offset="100%" stopColor="#020005" />
                  </linearGradient>
                  
                  <radialGradient id="cyber-left-cone" cx="5%" cy="5%" r="85%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                    <stop offset="45%" stopColor="#c084fc" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>
                  
                  <radialGradient id="cyber-right-cone" cx="95%" cy="5%" r="85%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.12" />
                    <stop offset="100%" stopColor="#000000" stopOpacity="0" />
                  </radialGradient>

                  <linearGradient id="cyber-neon-laser" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#ec4899" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#06b6d4" />
                  </linearGradient>
                </defs>

                <rect width="100%" height="100%" fill="url(#cyber-base-gradient)" />
                
                {/* Horizontal digital line and glows */}
                <line x1="0" y1="20%" x2="100%" y2="20%" stroke="url(#cyber-neon-laser)" strokeWidth="2" opacity="0.7" />
                
                {/* Modern digital perspective grid nodes */}
                <g stroke="#ffffff" opacity="0.08" strokeWidth="1">
                  <line x1="0" y1="24%" x2="100%" y2="24%" />
                  <line x1="0" y1="29%" x2="100%" y2="29%" />
                  <line x1="0" y1="36%" x2="100%" y2="36%" />
                  <line x1="0" y1="45%" x2="100%" y2="45%" />
                  <line x1="0" y1="56%" x2="100%" y2="56%" />
                  <line x1="0" y1="70%" x2="100%" y2="70%" />
                  <line x1="0" y1="86%" x2="100%" y2="86%" />
                  <line x1="0" y1="100%" x2="100%" y2="100%" stroke="url(#cyber-neon-laser)" strokeWidth="1.5" opacity="0.3" />

                  {/* Radiating lines in vector perspective */}
                  <line x1="50%" y1="20%" x2="-40%" y2="100%" />
                  <line x1="50%" y1="20%" x2="-15%" y2="100%" />
                  <line x1="50%" y1="20%" x2="10%" y2="100%" />
                  <line x1="50%" y1="20%" x2="32%" y2="100%" />
                  <line x1="50%" y1="20%" x2="50%" y2="100%" stroke="url(#cyber-neon-laser)" strokeWidth="1.2" opacity="0.4" />
                  <line x1="50%" y1="20%" x2="68%" y2="100%" />
                  <line x1="50%" y1="20%" x2="90%" y2="100%" />
                  <line x1="50%" y1="20%" x2="115%" y2="100%" />
                  <line x1="50%" y1="20%" x2="140%" y2="100%" />
                </g>

                {/* Laser spotlights overlay cones */}
                <polygon points="5%,0 0,490 320,490" fill="url(#cyber-left-cone)" />
                <polygon points="95%,0 100%,490 580,490" fill="url(#cyber-right-cone)" />

                {/* Ambient horizontal matrix backdrop nodes */}
                <g fill="rgba(6, 182, 212, 0.25)">
                  <circle cx="10%" cy="10%" r="2" />
                  <circle cx="30%" cy="8%" r="1.5" />
                  <circle cx="70%" cy="12%" r="2" />
                  <circle cx="90%" cy="6%" r="1.5" />
                </g>
              </svg>
            )}

            {stageTheme === "starlight" && (
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="starlight-deck" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#020617" />
                    <stop offset="40%" stopColor="#0b1329" />
                    <stop offset="100%" stopColor="#020617" />
                  </linearGradient>
                  
                  <radialGradient id="center-beam" cx="50%" cy="10%" r="70%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                    <stop offset="40%" stopColor="#3b82f6" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                  </radialGradient>
                  
                  <radialGradient id="star-left" cx="25%" cy="0%" r="80%">
                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                  </radialGradient>

                  <radialGradient id="star-right" cx="75%" cy="0%" r="80%">
                    <stop offset="0%" stopColor="#c084fc" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <rect width="100%" height="100%" fill="url(#starlight-deck)" />

                {/* Outer Space Dust Stars */}
                <g fill="#abc4ff" opacity="0.5">
                  <circle cx="5%" cy="8%" r="1.2" />
                  <circle cx="12%" cy="25%" r="1.5" />
                  <circle cx="28%" cy="14%" r="1" />
                  <circle cx="35%" cy="5%" r="2" />
                  <circle cx="45%" cy="28%" r="1" />
                  <circle cx="58%" cy="18%" r="1.5" />
                  <circle cx="72%" cy="9%" r="1.2" />
                  <circle cx="88%" cy="24%" r="1.8" />
                  <circle cx="95%" cy="12%" r="1" />
                </g>

                {/* Deep geometric arena tile framework */}
                <g stroke="#1e293b" strokeWidth="1" opacity="0.7">
                  <line x1="0" y1="28%" x2="100%" y2="28%" stroke="#334155" strokeWidth="1" />
                  
                  <line x1="16.6%" y1="28%" x2="16.6%" y2="100%" />
                  <line x1="33.3%" y1="28%" x2="33.3%" y2="100%" />
                  <line x1="50%" y1="28%" x2="50%" y2="100%" />
                  <line x1="66.6%" y1="28%" x2="66.6%" y2="100%" />
                  <line x1="83.3%" y1="28%" x2="83.3%" y2="100%" />
                  
                  <line x1="0" y1="42%" x2="100%" y2="42%" />
                  <line x1="0" y1="56%" x2="100%" y2="56%" />
                  <line x1="0" y1="70%" x2="100%" y2="70%" />
                  <line x1="0" y1="85%" x2="100%" y2="85%" />
                </g>

                {/* Dual lasers */}
                <polygon points="25%,0 20,490 320,490" fill="url(#star-left)" />
                <polygon points="75%,0 480,490 780,490" fill="url(#star-right)" />

                {/* Centered big beam light */}
                <circle cx="50%" cy="15%" r="300" fill="url(#center-beam)" />
              </svg>
            )}
          </div>

          {/* Glowing spotlights bulbs on hanging overhead rigging */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-slate-950 to-transparent flex items-center justify-around px-12 z-10 pointer-events-none select-none" id="lighting-rack">
            <span className="w-2 h-1.5 bg-yellow-400 rounded-sm shadow-[0_0_8px_#facc15] opacity-90 animate-pulse" />
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-sm shadow-[0_0_6px_#38bdf8] opacity-80" />
            <span className="w-2 h-1.5 bg-pink-500 rounded-sm shadow-[0_0_8px_#ec4899] opacity-90" />
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-sm shadow-[0_0_6px_#34d399] opacity-80" />
            <span className="w-2 h-1.5 bg-yellow-400 rounded-sm shadow-[0_0_8px_#facc15] opacity-90 animate-pulse" />
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-sm shadow-[0_0_6px_#38bdf8] opacity-80" />
            <span className="w-2 h-1.5 bg-pink-500 rounded-sm shadow-[0_0_8px_#ec4899] opacity-90" />
          </div>

          {/* Left and Right Visual P.A. Sound Tower Blocks */}
          <div className="absolute top-[28%] left-2.5 w-6 h-[150px] bg-slate-950/85 border border-slate-800 rounded-md flex flex-col items-center justify-around py-2.5 shadow-2xl opacity-50 hover:opacity-90 transition-all duration-200 z-10 pointer-events-none select-none" id="sl-speaker-tower">
            <span className="w-3 h-3 rounded-full border border-slate-705 bg-slate-900 flex items-center justify-center text-[6px] text-slate-500 font-mono scale-90">H</span>
            <span className="w-4 h-4 rounded-full border border-slate-705 bg-slate-900 flex items-center justify-center text-[6px] text-slate-500 font-mono">M</span>
            <span className="w-4 h-4 rounded-full border border-slate-705 bg-slate-900 flex items-center justify-center text-[6px] text-slate-500 font-mono font-black scale-102">L</span>
            <span className="text-[5px] text-slate-500 font-black tracking-widest uppercase font-mono mt-1">L</span>
          </div>
          
          <div className="absolute top-[28%] right-2.5 w-6 h-[150px] bg-slate-950/85 border border-slate-800 rounded-md flex flex-col items-center justify-around py-2.5 shadow-2xl opacity-50 hover:opacity-90 transition-all duration-200 z-10 pointer-events-none select-none" id="sr-speaker-tower">
            <span className="w-3 h-3 rounded-full border border-slate-705 bg-slate-900 flex items-center justify-center text-[6px] text-slate-500 font-mono scale-90">H</span>
            <span className="w-4 h-4 rounded-full border border-slate-705 bg-slate-900 flex items-center justify-center text-[6px] text-slate-500 font-mono">M</span>
            <span className="w-4 h-4 rounded-full border border-slate-705 bg-slate-900 flex items-center justify-center text-[6px] text-slate-500 font-mono font-black scale-102">L</span>
            <span className="text-[5px] text-slate-500 font-black tracking-widest uppercase font-mono mt-1">R</span>
          </div>

          {/* Edge Label Indicators */}
          {/* Backline / Back of stage */}
          <div className="absolute top-2 left-0 right-0 text-center pointer-events-none z-10" id="label-rear">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest bg-slate-950/85 px-4 py-1.5 rounded-full border border-slate-800 shadow-sm">
              ▲ Backline / Backstage Area (Amps, Drums)
            </span>
          </div>

          {/* Frontline / Crowd Line */}
          <div className="absolute bottom-3.5 left-0 right-0 text-center pointer-events-none z-10" id="label-front">
            <span className="text-[9px] text-teal-400 font-black uppercase tracking-widest bg-slate-950/85 px-4 py-1.5 rounded-full border border-teal-900 shadow-sm">
              🠗 Frontline Monitors • Audience Border Line 🠗
            </span>
          </div>

          {/* Left Wing */}
          <div className="absolute top-1/2 left-2 -translate-y-1/2 select-none pointer-events-none origin-left -rotate-90" id="label-left-wing">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-wider">
              Stage Left (SL)
            </span>
          </div>

          {/* Right Wing */}
          <div className="absolute top-1/2 right-2 -translate-y-1/2 select-none pointer-events-none origin-right rotate-90" id="label-right-wing">
            <span className="text-[8px] text-slate-600 font-black uppercase tracking-wider">
              Stage Right (SR)
            </span>
          </div>

          {/* Placed Elements Loop */}
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
                {/* Visual Graphic Representation */}
                <div 
                  className="w-full h-full relative"
                  id={`item-wrap-${el.id}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    // trigger drag only if clicking visual graphic box
                    handleStartDrag(el.id, e.clientX, e.clientY, el.x, el.y);
                  }}
                  onTouchStart={(e) => {
                    handleStartDrag(el.id, e.touches[0].clientX, e.touches[0].clientY, el.x, el.y);
                  }}
                >
                  {renderEquipmentGraphic(el.type, el.label, isDraggingThis, el.rotation)}

                  {/* Editing Text Popup Overlay */}
                  {isEditingThis && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg p-1.5 shadow-lg flex gap-1 z-[60] w-[130px]" id={`edit-input-pop-${el.id}`}>
                      <input
                        type="text"
                        id={`text-field-edit-${el.id}`}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="text-[10px] w-16 p-1 border border-gray-100 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveLabel(el.id);
                        }}
                      />
                      <button
                        type="button"
                        id={`btn-label-save-${el.id}`}
                        onClick={() => handleSaveLabel(el.id)}
                        className="bg-indigo-600 text-white text-[9px] font-bold py-0.5 px-1 rounded cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  )}

                  {/* Mini-handles - visible on hover */}
                  <div 
                    className="absolute -top-5 left-1/2 -translate-x-1/2 flex items-center justify-center gap-1.5 bg-slate-950/95 border border-slate-700/80 rounded-md px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-30"
                    id={`handles-panel-${el.id}`}
                  >
                    <button
                      type="button"
                      id={`handle-btn-rotate-${el.id}`}
                      aria-label="Rotate gear item"
                      onClick={(e) => handleRotateItem(el.id, e)}
                      className="text-gray-400 hover:text-indigo-400 cursor-pointer p-0.5 transition-colors"
                    >
                      <RotateCw className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      id={`handle-btn-rename-${el.id}`}
                      aria-label="Rename gear item label"
                      onClick={(e) => handleStartEditingLabel(el, e)}
                      className="text-gray-300 hover:text-emerald-400 cursor-pointer p-0.5 transition-colors"
                    >
                      <Type className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      id={`handle-btn-delete-${el.id}`}
                      aria-label="Delete gear item"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveItem(el.id);
                      }}
                      className="text-gray-400 hover:text-rose-500 cursor-pointer p-0.5 transition-colors"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {elements.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4 pointer-events-none bg-slate-950/20" id="stage-empty-view">
              <AlertCircle className="w-10 h-10 text-slate-700" />
              <div>
                <h4 className="text-sm font-bold text-slate-500">The Stage is Empty</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Click on icons in the left Gear Toolbox to spawn instruments on stage.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Informational Guidelines beneath */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-xs text-blue-950 flex gap-2" id="plot-audio-guide">
          <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" id="plot-guide-icon" />
          <div id="plot-guide-text">
            <strong>How to map effectively:</strong> Keep high volume sources like **Drums** and high-gain **Guitar Amps** spaced toward the rear backline, keeping lead vocalists and their **Monitor wedge cabinets** at the frontline so voice signals replicate smoothly without triggering feedback loops.
          </div>
        </div>
      </div>
    </div>
  );
}
