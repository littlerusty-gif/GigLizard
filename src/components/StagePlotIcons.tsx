import React from "react";
import { EquipmentType } from "../types";

interface IconProps {
  type: EquipmentType;
  label: string;
  rotation?: number;
  isDragging?: boolean;
  isSelected?: boolean;
  mixNumber?: number;
  theme?: "blueprint" | "stage" | "print";
}

/**
 * Professional CAD & Rider-grade vector illustrations for live music stage plots and tech riders.
 * Designed to match front-of-house (FOH) concert rider standards:
 * - High visual clarity, crisp vector geometry & authentic instrument proportions
 * - Realistic drum kit with riser, cymbals, SPD percussion pad
 * - Stratocaster electric guitar, Precision bass, synth keyboard on stand, saxophone
 * - Stage monitors with prominent high-contrast red OUT badges (OUT 1, OUT 2, etc.)
 * - Professional D.I. boxes, wireless/wired in-ear packs, and laptop audio workstations
 */
export const StageGearGraphic: React.FC<IconProps> = ({
  type,
  label,
  rotation = 0,
  isDragging = false,
  isSelected = false,
  mixNumber = 1,
  theme = "print"
}) => {
  const isPrint = theme === "print";

  const renderSvg = () => {
    switch (type) {
      case "drum_kit":
        return (
          <svg viewBox="0 0 140 140" className="w-full h-full select-none" fill="none">
            <defs>
              <filter id="gear-shadow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.25" />
              </filter>
              <linearGradient id="drum-riser-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPrint ? "#f8fafc" : "#1e293b"} />
                <stop offset="100%" stopColor={isPrint ? "#e2e8f0" : "#0f172a"} />
              </linearGradient>
              <radialGradient id="cymbal-gold-1" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="60%" stopColor="#eab308" />
                <stop offset="90%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#a16207" />
              </radialGradient>
              <radialGradient id="cymbal-gold-2" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fef9c3" />
                <stop offset="50%" stopColor="#facc15" />
                <stop offset="85%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#92400e" />
              </radialGradient>
              <linearGradient id="chrome-rim" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="50%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>

            {/* Heavy-Duty Drum Riser Platform */}
            <rect x="8" y="8" width="124" height="124" rx="10" fill="url(#drum-riser-grad)" stroke={isPrint ? "#94a3b8" : "#475569"} strokeWidth="2" filter="url(#gear-shadow)" />
            {/* Riser Carpet Texture & Edging */}
            <rect x="12" y="12" width="116" height="116" rx="7" fill="none" stroke={isPrint ? "#cbd5e1" : "#334155"} strokeWidth="1" strokeDasharray="3 3" />
            <line x1="8" y1="8" x2="16" y2="16" stroke={isPrint ? "#94a3b8" : "#475569"} strokeWidth="1.5" />
            <line x1="132" y1="8" x2="124" y2="16" stroke={isPrint ? "#94a3b8" : "#475569"} strokeWidth="1.5" />
            <line x1="8" y1="132" x2="16" y2="124" stroke={isPrint ? "#94a3b8" : "#475569"} strokeWidth="1.5" />
            <line x1="132" y1="132" x2="124" y2="124" stroke={isPrint ? "#94a3b8" : "#475569"} strokeWidth="1.5" />

            {/* Drum Throne Stool (Center Back) */}
            <circle cx="70" cy="108" r="11" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="70" cy="108" r="9" fill="#334155" />
            <circle cx="70" cy="108" r="2.5" fill="#94a3b8" />

            {/* Kick / Bass Drum (Facing Downstage) */}
            <rect x="52" y="44" width="36" height="38" rx="6" fill="#0f172a" stroke="#020617" strokeWidth="2.5" />
            <circle cx="70" cy="63" r="14" fill="#1e293b" stroke="url(#chrome-rim)" strokeWidth="2" />
            {/* Resonance Hole */}
            <circle cx="78" cy="67" r="4" fill="#000000" stroke="#475569" strokeWidth="1" />
            <text x="70" y="62" fontSize="5" fontWeight="900" fill="#94a3b8" textAnchor="middle" letterSpacing="0.1em">KICK</text>

            {/* Snare Drum (Player's Left / Stage Right) */}
            <circle cx="44" cy="86" r="13" fill="#ffffff" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="44" cy="86" r="11.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
            <circle cx="44" cy="86" r="4" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.8" />
            <line x1="33" y1="86" x2="55" y2="86" stroke="#94a3b8" strokeWidth="1" strokeDasharray="1 1" />
            <text x="44" y="87" fontSize="4.5" fontWeight="bold" fill="#64748b" textAnchor="middle">SNARE</text>

            {/* Rack Tom 1 (High Tom) */}
            <circle cx="54" cy="38" r="9.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
            <circle cx="54" cy="38" r="7.5" fill="#e2e8f0" />

            {/* Rack Tom 2 (Mid Tom) */}
            <circle cx="86" cy="38" r="10.5" fill="#f8fafc" stroke="#0f172a" strokeWidth="2" />
            <circle cx="86" cy="38" r="8.5" fill="#e2e8f0" />

            {/* Floor Tom (Low Tom - Player's Right / Stage Left) */}
            <circle cx="98" cy="84" r="14" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5" />
            <circle cx="98" cy="84" r="12" fill="#e2e8f0" />
            <text x="98" y="85.5" fontSize="4.5" fontWeight="bold" fill="#64748b" textAnchor="middle">FLOOR</text>

            {/* Hi-Hat Cymbals (Stage Right) */}
            <circle cx="26" cy="72" r="11" fill="url(#cymbal-gold-1)" stroke="#854d0e" strokeWidth="2" filter="url(#gear-shadow)" />
            <circle cx="26" cy="72" r="3" fill="#ca8a04" stroke="#fef08a" strokeWidth="1" />
            <circle cx="26" cy="72" r="0.8" fill="#451a03" />

            {/* Crash Cymbal L (Overhead Left) */}
            <circle cx="28" cy="34" r="14" fill="url(#cymbal-gold-2)" stroke="#92400e" strokeWidth="2" filter="url(#gear-shadow)" />
            <circle cx="28" cy="34" r="3.5" fill="#b45309" stroke="#fef08a" strokeWidth="1" />

            {/* Ride Cymbal R (Stage Left) */}
            <circle cx="112" cy="50" r="16" fill="url(#cymbal-gold-1)" stroke="#854d0e" strokeWidth="2" filter="url(#gear-shadow)" />
            <circle cx="112" cy="50" r="4.5" fill="#ca8a04" stroke="#fef08a" strokeWidth="1" />
            <circle cx="112" cy="50" r="1" fill="#451a03" />

            {/* Electronic Sample Pad (Roland SPD-SX style on Left) */}
            <rect x="18" y="94" width="18" height="15" rx="2" fill="#18181b" stroke="#3f3f46" strokeWidth="1.5" />
            {/* 6 sample trigger pads */}
            <rect x="20" y="96" width="4" height="5" rx="0.5" fill="#3f3f46" />
            <rect x="25" y="96" width="4" height="5" rx="0.5" fill="#3f3f46" />
            <rect x="30" y="96" width="4" height="5" rx="0.5" fill="#3f3f46" />
            <rect x="20" y="102" width="4" height="5" rx="0.5" fill="#3f3f46" />
            <rect x="25" y="102" width="4" height="5" rx="0.5" fill="#3f3f46" />
            <rect x="30" y="102" width="4" height="5" rx="0.5" fill="#3f3f46" />
          </svg>
        );

      case "monitor_wedge":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 100 80" className="w-full h-full select-none" fill="none">
              <defs>
                <linearGradient id="wedge-body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <linearGradient id="grille-mesh" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Angled Stage Wedge Cabinet (Trapezoid facing upstage toward artist) */}
              <polygon points="12,18 88,18 96,66 4,66" fill="url(#wedge-body)" stroke="#020617" strokeWidth="3" />
              {/* Outer Edge Bevel */}
              <polygon points="15,22 85,22 92,62 8,62" fill="url(#grille-mesh)" stroke="#475569" strokeWidth="1.5" />

              {/* High-Frequency Horn (Dispersion flare) */}
              <rect x="32" y="26" width="36" height="10" rx="2" fill="#020617" stroke="#64748b" strokeWidth="1" />
              <polygon points="34,28 66,28 62,34 38,34" fill="#38bdf8" opacity="0.7" />

              {/* 12" / 15" Low-Mid Woofer Driver */}
              <circle cx="50" cy="48" r="11" fill="#020617" stroke="#64748b" strokeWidth="1.5" />
              <circle cx="50" cy="48" r="4.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="1" />
              <circle cx="50" cy="48" r="1.5" fill="#38bdf8" />

              {/* Side Handles */}
              <rect x="6" y="34" width="3" height="16" rx="1.5" fill="#64748b" />
              <rect x="91" y="34" width="3" height="16" rx="1.5" fill="#64748b" />
            </svg>

            {/* High-Visibility Red Monitor Output Badge (e.g. OUT 1, OUT 2) */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black px-2 py-0.5 rounded-md text-[10px] tracking-wider uppercase shadow-md border border-red-400 whitespace-nowrap z-20 flex items-center gap-0.5">
              <span>OUT {mixNumber || 1}</span>
            </div>
          </div>
        );

      case "dual_wedge":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <div className="flex items-center gap-1 w-full justify-center">
              {/* Wedge 1 */}
              <div className="relative w-1/2">
                <svg viewBox="0 0 100 80" className="w-full h-full select-none" fill="none">
                  <polygon points="10,18 90,18 96,66 4,66" fill="#0f172a" stroke="#020617" strokeWidth="3" />
                  <polygon points="14,22 86,22 91,62 9,62" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <rect x="32" y="26" width="36" height="9" rx="2" fill="#020617" />
                  <circle cx="50" cy="48" r="10" fill="#020617" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="50" cy="48" r="4" fill="#38bdf8" />
                </svg>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black px-1.5 py-0.2 rounded text-[9px] uppercase shadow-md border border-red-400 whitespace-nowrap">
                  OUT {mixNumber || 2}
                </div>
              </div>
              {/* Wedge 2 */}
              <div className="relative w-1/2">
                <svg viewBox="0 0 100 80" className="w-full h-full select-none" fill="none">
                  <polygon points="10,18 90,18 96,66 4,66" fill="#0f172a" stroke="#020617" strokeWidth="3" />
                  <polygon points="14,22 86,22 91,62 9,62" fill="#1e293b" stroke="#475569" strokeWidth="1" />
                  <rect x="32" y="26" width="36" height="9" rx="2" fill="#020617" />
                  <circle cx="50" cy="48" r="10" fill="#020617" stroke="#64748b" strokeWidth="1.5" />
                  <circle cx="50" cy="48" r="4" fill="#38bdf8" />
                </svg>
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-red-600 text-white font-black px-1.5 py-0.2 rounded text-[9px] uppercase shadow-md border border-red-400 whitespace-nowrap">
                  OUT {mixNumber || 2}
                </div>
              </div>
            </div>
          </div>
        );

      case "electric_guitar":
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full select-none" fill="none">
            <defs>
              <linearGradient id="strat-burst" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#18181b" />
                <stop offset="35%" stopColor="#7c2d12" />
                <stop offset="70%" stopColor="#ea580c" />
                <stop offset="100%" stopColor="#fde047" />
              </linearGradient>
            </defs>
            {/* Guitar Stand Tripod */}
            <line x1="50" y1="20" x2="50" y2="95" stroke="#64748b" strokeWidth="2.5" />
            <line x1="28" y1="105" x2="50" y2="95" stroke="#64748b" strokeWidth="2.5" />
            <line x1="72" y1="105" x2="50" y2="95" stroke="#64748b" strokeWidth="2.5" />

            {/* Electric Guitar Body (Stratocaster Double Cutaway) */}
            {/* Lower Bout & Waist */}
            <path
              d="M 32 75 C 28 65 30 52 42 50 C 44 44 42 36 38 32 C 44 32 50 36 52 42 C 54 36 60 32 66 32 C 62 36 60 44 62 50 C 74 52 76 65 72 75 C 68 88 36 88 32 75 Z"
              fill="url(#strat-burst)"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* White Pickguard */}
            <path
              d="M 38 72 C 36 62 38 54 45 52 C 47 48 46 42 44 38 C 48 40 52 44 54 48 C 58 48 64 52 64 60 C 64 70 54 75 48 75 Z"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            {/* Pickups (3 Single Coils) */}
            <rect x="46" y="52" width="12" height="3" rx="1" fill="#0f172a" />
            <rect x="46" y="58" width="12" height="3" rx="1" fill="#0f172a" />
            <rect x="46" y="64" width="12" height="3" rx="1" fill="#0f172a" />
            {/* Chrome Tremolo Bridge */}
            <rect x="47" y="70" width="10" height="5" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="0.8" />
            {/* Volume / Tone Knobs */}
            <circle cx="58" cy="67" r="1.5" fill="#f8fafc" stroke="#64748b" strokeWidth="0.5" />
            <circle cx="60" cy="71" r="1.5" fill="#f8fafc" stroke="#64748b" strokeWidth="0.5" />

            {/* Guitar Neck & Frets */}
            <rect x="48" y="16" width="6" height="28" fill="#fde047" stroke="#713f12" strokeWidth="0.8" />
            {Array.from({ length: 7 }).map((_, i) => (
              <line key={i} x1="48" y1={18 + i * 3.6} x2="54" y2={18 + i * 3.6} stroke="#a16207" strokeWidth="0.8" />
            ))}
            {/* Headstock with 6 Inline Tuners */}
            <path d="M 48 16 L 46 8 L 52 6 L 54 16 Z" fill="#fde047" stroke="#713f12" strokeWidth="1" />
            <circle cx="45" cy="8" r="1" fill="#cbd5e1" />
            <circle cx="45" cy="10" r="1" fill="#cbd5e1" />
            <circle cx="45" cy="12" r="1" fill="#cbd5e1" />
          </svg>
        );

      case "bass_guitar":
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full select-none" fill="none">
            <defs>
              <linearGradient id="bass-red" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#450a0a" />
                <stop offset="40%" stopColor="#991b1b" />
                <stop offset="80%" stopColor="#dc2626" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            {/* Stand */}
            <line x1="50" y1="16" x2="50" y2="98" stroke="#64748b" strokeWidth="2.5" />
            <line x1="26" y1="108" x2="50" y2="98" stroke="#64748b" strokeWidth="2.5" />
            <line x1="74" y1="108" x2="50" y2="98" stroke="#64748b" strokeWidth="2.5" />

            {/* Precision Bass Solid Body */}
            <path
              d="M 30 76 C 26 64 28 50 40 48 C 42 40 40 30 36 26 C 42 26 48 32 50 40 C 53 34 58 30 64 30 C 60 36 58 42 60 48 C 74 50 76 64 72 76 C 68 90 34 90 30 76 Z"
              fill="url(#bass-red)"
              stroke="#0f172a"
              strokeWidth="2.5"
            />
            {/* White/Tortoise Shell Pickguard */}
            <path
              d="M 36 72 C 34 60 36 52 44 50 C 46 44 44 38 42 34 C 47 36 50 42 52 46 C 58 46 64 50 64 60 C 64 72 52 76 46 76 Z"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1"
            />
            {/* Split P-Bass Pickups */}
            <rect x="46" y="54" width="7" height="4" rx="1" fill="#0f172a" stroke="#ffffff" strokeWidth="0.5" />
            <rect x="51" y="59" width="7" height="4" rx="1" fill="#0f172a" stroke="#ffffff" strokeWidth="0.5" />
            {/* Heavy Chrome Bass Bridge */}
            <rect x="46" y="70" width="12" height="6" rx="1" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

            {/* Long Scale 4-String Bass Neck */}
            <rect x="47" y="14" width="7" height="34" fill="#78350f" stroke="#451a03" strokeWidth="0.8" />
            {Array.from({ length: 8 }).map((_, i) => (
              <line key={i} x1="47" y1={16 + i * 4} x2="54" y2={16 + i * 4} stroke="#fde68a" strokeWidth="0.8" />
            ))}
            {/* 4 In-Line Large Clover Leaf Tuners */}
            <path d="M 47 14 L 45 4 L 52 2 L 54 14 Z" fill="#78350f" stroke="#451a03" strokeWidth="1" />
            <circle cx="43" cy="4" r="1.5" fill="#cbd5e1" />
            <circle cx="43" cy="7" r="1.5" fill="#cbd5e1" />
            <circle cx="43" cy="10" r="1.5" fill="#cbd5e1" />
            <circle cx="43" cy="13" r="1.5" fill="#cbd5e1" />
          </svg>
        );

      case "acoustic_guitar":
        return (
          <svg viewBox="0 0 100 120" className="w-full h-full select-none" fill="none">
            {/* Stand */}
            <line x1="50" y1="18" x2="50" y2="92" stroke="#64748b" strokeWidth="2.5" />
            <line x1="28" y1="102" x2="50" y2="92" stroke="#64748b" strokeWidth="2.5" />
            <line x1="72" y1="102" x2="50" y2="92" stroke="#64748b" strokeWidth="2.5" />

            {/* Dreadnought Acoustic Body */}
            <path
              d="M 32 74 C 28 62 30 52 38 48 C 34 38 40 32 50 32 C 60 32 66 38 62 48 C 70 52 72 62 68 74 C 64 88 36 88 32 74 Z"
              fill="#fed7aa"
              stroke="#7c2d12"
              strokeWidth="2.5"
            />
            {/* Soundhole with Rosette */}
            <circle cx="50" cy="52" r="6" fill="#451a03" stroke="#b45309" strokeWidth="1.5" />
            <circle cx="50" cy="52" r="7.5" fill="none" stroke="#fdba74" strokeWidth="0.8" />
            {/* Tortoise Pickguard */}
            <path d="M 54 52 C 58 52 61 55 61 62 C 58 64 54 60 54 52 Z" fill="#78350f" />
            {/* Rosewood Bridge */}
            <rect x="44" y="68" width="12" height="4" rx="1" fill="#451a03" />

            {/* Mahogany Neck */}
            <rect x="47.5" y="14" width="5" height="28" fill="#9a3412" stroke="#451a03" strokeWidth="0.8" />
            {/* Headstock 3x3 */}
            <rect x="46" y="8" width="8" height="8" rx="1" fill="#7c2d12" stroke="#451a03" strokeWidth="1" />
          </svg>
        );

      case "keyboard_rig":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 110 80" className="w-full h-full select-none" fill="none">
              {/* Heavy Double-X Keyboard Stand */}
              <line x1="20" y1="26" x2="80" y2="70" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="80" y1="26" x2="20" y2="70" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="16" y1="70" x2="84" y2="70" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

              {/* Synth Body Chassis */}
              <rect x="8" y="20" width="94" height="26" rx="4" fill="#0f172a" stroke="#020617" strokeWidth="2.5" />
              {/* Display & Control Strip */}
              <rect x="12" y="23" width="9" height="18" rx="1" fill="#1e293b" />
              {/* Pitch/Mod Wheels */}
              <line x1="14" y1="26" x2="14" y2="35" stroke="#38bdf8" strokeWidth="1.5" />
              <line x1="18" y1="28" x2="18" y2="33" stroke="#38bdf8" strokeWidth="1.5" />
              {/* LCD Display */}
              <rect x="25" y="22" width="14" height="4" rx="1" fill="#0284c7" />

              {/* 88 Piano Keybed */}
              <rect x="24" y="27" width="74" height="16" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
              {/* White key separators */}
              {Array.from({ length: 15 }).map((_, i) => (
                <line key={i} x1={24 + (i + 1) * 4.6} y1="27" x2={24 + (i + 1) * 4.6} y2="43" stroke="#cbd5e1" strokeWidth="0.8" />
              ))}
              {/* Black keys */}
              {[27, 31, 39, 43, 47, 55, 59, 67, 71, 75, 83, 87].map((pos, idx) => (
                <rect key={idx} x={pos} y="27" width="2.6" height="9.5" fill="#0f172a" rx="0.5" />
              ))}
            </svg>
          </div>
        );

      case "saxophone":
        return (
          <svg viewBox="0 0 90 90" className="w-full h-full select-none" fill="none">
            <defs>
              <linearGradient id="brass-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="40%" stopColor="#eab308" />
                <stop offset="80%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
            </defs>
            {/* Curved Sax Body */}
            <path
              d="M 35 15 C 38 15 42 18 42 22 L 40 55 C 39 68 55 72 60 58 L 62 44 C 62 40 70 40 72 45 C 74 54 68 76 46 76 C 28 76 26 56 28 40 L 30 18 C 30 15 33 15 35 15 Z"
              fill="url(#brass-gold)"
              stroke="#713f12"
              strokeWidth="2"
            />
            {/* Saxophone Bell Flare Opening */}
            <ellipse cx="64" cy="44" rx="7" ry="5" fill="#713f12" stroke="#facc15" strokeWidth="1.5" />
            <ellipse cx="64" cy="44" rx="5" ry="3" fill="#451a03" />

            {/* Key Cups & Rods */}
            {[26, 32, 38, 44, 50].map((y, idx) => (
              <g key={idx}>
                <circle cx="34" cy={y} r="2" fill="#fef9c3" stroke="#854d0e" strokeWidth="0.8" />
                <line x1="31" y1={y} x2="28" y2={y} stroke="#ca8a04" strokeWidth="1" />
              </g>
            ))}

            {/* Neck & Mouthpiece */}
            <path d="M 33 16 C 33 10 38 8 44 8" stroke="#ca8a04" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <rect x="43" y="6" width="5" height="3" rx="1" fill="#0f172a" />
          </svg>
        );

      case "laptop_rig":
        return (
          <svg viewBox="0 0 100 90" className="w-full h-full select-none" fill="none">
            {/* Stand Base */}
            <path d="M 24 76 L 76 76 L 68 54 L 32 54 Z" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
            {/* Laptop Base (Keyboard & Trackpad) */}
            <polygon points="16,52 84,52 88,68 12,68" fill="#e2e8f0" stroke="#0f172a" strokeWidth="2" />
            <rect x="24" y="54" width="52" height="9" rx="1" fill="#1e293b" />
            <rect x="42" y="64" width="16" height="3" rx="0.5" fill="#cbd5e1" />

            {/* Laptop Screen (Angled Upwards) */}
            <polygon points="16,52 84,52 82,18 18,18" fill="#0f172a" stroke="#020617" strokeWidth="2.5" />
            {/* Display Area with DAW / Track Waveform */}
            <polygon points="20,49 80,49 79,22 21,22" fill="#0284c7" />
            <path d="M 24 35 Q 32 26 40 38 T 56 34 T 72 38" stroke="#38bdf8" strokeWidth="1.5" fill="none" />
            <path d="M 24 40 Q 34 32 44 42 T 60 36 T 74 42" stroke="#22c55e" strokeWidth="1.5" fill="none" opacity="0.8" />

            {/* Red USB Audio Interface below Laptop */}
            <rect x="22" y="74" width="56" height="12" rx="2" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
            {/* Knobs & XLR inputs */}
            <circle cx="30" cy="80" r="2.5" fill="#18181b" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="38" cy="80" r="2.5" fill="#18181b" stroke="#ffffff" strokeWidth="0.5" />
            <circle cx="50" cy="80" r="2" fill="#cbd5e1" />
            <circle cx="58" cy="80" r="2" fill="#cbd5e1" />
            <circle cx="68" cy="80" r="1.5" fill="#22c55e" />
          </svg>
        );

      case "vocal_mic":
        return (
          <svg viewBox="0 0 90 90" className="w-full h-full select-none" fill="none">
            {/* Tripod Base Legs (Black heavy stage base) */}
            <line x1="45" y1="56" x2="16" y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="56" x2="74" y2="82" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <line x1="45" y1="56" x2="45" y2="86" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            <circle cx="45" cy="56" r="5" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />

            {/* Upright Stand & Boom Arm */}
            <line x1="45" y1="56" x2="45" y2="28" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
            
            {/* Shure SM58 / Beta 58 Style Capsule */}
            <rect x="40" y="16" width="10" height="15" rx="5" fill="#1e293b" stroke="#020617" strokeWidth="1.5" />
            <circle cx="45" cy="18" r="5" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
            {/* Silver ball mesh */}
            <circle cx="45" cy="18" r="4" fill="#f8fafc" opacity="0.8" />

            {/* Cardioid Pickup Pattern Waveguide */}
            <path d="M 28 14 A 18 18 0 0 1 62 14" stroke="#dc2626" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
          </svg>
        );

      case "instrument_mic":
        return (
          <svg viewBox="0 0 90 90" className="w-full h-full select-none" fill="none">
            {/* Heavy Cast Iron Round Base */}
            <ellipse cx="45" cy="72" rx="16" ry="7" fill="#1e293b" stroke="#0f172a" strokeWidth="2.5" />
            <ellipse cx="45" cy="72" rx="12" ry="4.5" fill="#334155" />

            {/* Short Boom Stand */}
            <line x1="45" y1="72" x2="45" y2="34" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />

            {/* SM57 Dynamic Capsule (Pointed at amp / instrument) */}
            <rect x="40" y="20" width="10" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
            <rect x="40" y="18" width="10" height="4" rx="1" fill="#cbd5e1" />
            <line x1="40" y1="24" x2="50" y2="24" stroke="#38bdf8" strokeWidth="1" />
          </svg>
        );

      case "di_box":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 80 80" className="w-full h-full select-none" fill="none">
              {/* Rugged Direct Box Steel Case */}
              <rect x="14" y="16" width="52" height="48" rx="6" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" />
              {/* Protective Bookend Edges */}
              <rect x="10" y="20" width="4" height="40" rx="1" fill="#0f172a" />
              <rect x="66" y="20" width="4" height="40" rx="1" fill="#0f172a" />

              {/* XLR Port (Male Output) */}
              <circle cx="40" cy="32" r="7" fill="#0f172a" stroke="#cbd5e1" strokeWidth="1.5" />
              <circle cx="37" cy="30" r="1.2" fill="#ffffff" />
              <circle cx="43" cy="30" r="1.2" fill="#ffffff" />
              <circle cx="40" cy="35" r="1.2" fill="#ffffff" />

              {/* Bold High-Contrast D.I. Label */}
              <rect x="24" y="44" width="32" height="14" rx="2" fill="#0f172a" />
              <text x="40" y="54" fontSize="9" fontWeight="900" fill="#38bdf8" textAnchor="middle" letterSpacing="0.08em">
                D.I.
              </text>
            </svg>
          </div>
        );

      case "iem_transmitter":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 90 90" className="w-full h-full select-none" fill="none">
              {/* Bodypack Unit */}
              <rect x="28" y="30" width="34" height="46" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
              {/* Belt Clip */}
              <rect x="36" y="24" width="18" height="6" rx="1" fill="#64748b" />
              {/* Flexible Antenna */}
              <line x1="34" y1="30" x2="34" y2="8" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <circle cx="34" cy="7" r="1.5" fill="#38bdf8" />
              {/* Volume Dial */}
              <circle cx="54" cy="27" r="3" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

              {/* LCD Display */}
              <rect x="34" y="38" width="22" height="10" rx="1" fill="#0369a1" />
              <text x="45" y="45" fontSize="5" fontWeight="bold" fill="#38bdf8" textAnchor="middle">RF 518</text>

              {/* Dual Earbuds Cable */}
              <path d="M 52 30 C 58 24 70 20 72 28 C 74 36 68 40 70 46" stroke="#0f172a" strokeWidth="1.5" fill="none" />
              <circle cx="70" cy="46" r="3" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
              <circle cx="74" cy="26" r="3" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
            </svg>
            <div className="bg-slate-900 text-teal-300 font-bold px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase border border-teal-500/40 whitespace-nowrap shadow-xs">
              WIRELESS IN-EAR
            </div>
          </div>
        );

      case "wired_iem":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 90 90" className="w-full h-full select-none" fill="none">
              {/* Bodypack / Headphone Amp */}
              <rect x="30" y="32" width="30" height="42" rx="3" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
              <circle cx="45" cy="44" r="5" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
              {/* Volume Knob */}
              <circle cx="45" cy="28" r="4" fill="#cbd5e1" stroke="#64748b" strokeWidth="1" />

              {/* Coiled XLR Audio In Cable */}
              <path d="M 45 74 L 45 88 L 60 88" stroke="#18181b" strokeWidth="2.5" strokeLinecap="round" />

              {/* Earbuds with Clear Molded Tips */}
              <path d="M 40 32 C 34 22 22 24 24 36" stroke="#0f172a" strokeWidth="1.5" fill="none" />
              <circle cx="24" cy="36" r="3.5" fill="#38bdf8" stroke="#0f172a" strokeWidth="1" />
            </svg>
            <div className="bg-slate-900 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[8px] tracking-wide uppercase border border-amber-500/40 whitespace-nowrap shadow-xs">
              WIRED IN-EAR
            </div>
          </div>
        );

      case "guitar_amp":
        return (
          <svg viewBox="0 0 100 90" className="w-full h-full select-none" fill="none">
            {/* Combo Amp Outer Cabinet */}
            <rect x="12" y="16" width="76" height="60" rx="6" fill="#18181b" stroke="#09090b" strokeWidth="3" />
            {/* Chrome Corner Protectors */}
            <rect x="12" y="16" width="7" height="7" fill="#cbd5e1" />
            <rect x="81" y="16" width="7" height="7" fill="#cbd5e1" />
            <rect x="12" y="69" width="7" height="7" fill="#cbd5e1" />
            <rect x="81" y="69" width="7" height="7" fill="#cbd5e1" />

            {/* Vintage Silver Sparkle Grille Cloth (2x12) */}
            <rect x="18" y="24" width="64" height="46" rx="3" fill="#334155" stroke="#cbd5e1" strokeWidth="1" />
            {/* Speaker Cone 1 */}
            <circle cx="35" cy="48" r="13" fill="#18181b" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="35" cy="48" r="4.5" fill="#475569" />
            {/* Speaker Cone 2 */}
            <circle cx="65" cy="48" r="13" fill="#18181b" stroke="#64748b" strokeWidth="1.5" />
            <circle cx="65" cy="48" r="4.5" fill="#475569" />

            {/* Top Control Panel with Chickenhead Knobs */}
            <rect x="22" y="18" width="56" height="5" rx="1" fill="#e2e8f0" />
            <circle cx="30" cy="20.5" r="1.5" fill="#ef4444" />
            <circle cx="38" cy="20.5" r="1.5" fill="#0f172a" />
            <circle cx="46" cy="20.5" r="1.5" fill="#0f172a" />
            <circle cx="54" cy="20.5" r="1.5" fill="#0f172a" />
            <circle cx="62" cy="20.5" r="1.5" fill="#0f172a" />
            <circle cx="70" cy="20.5" r="1.5" fill="#0f172a" />

            {/* SM57 Mic Clamped on Speaker Cone Indicator */}
            <circle cx="65" cy="48" r="3" fill="#ef4444" stroke="#ffffff" strokeWidth="1" />
            <line x1="65" y1="48" x2="65" y2="78" stroke="#ef4444" strokeWidth="2" strokeDasharray="2 2" />
          </svg>
        );

      case "bass_amp":
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full select-none" fill="none">
            {/* 4x10 or 8x10 Bass Cab Cabinet */}
            <rect x="16" y="12" width="68" height="76" rx="5" fill="#0f172a" stroke="#020617" strokeWidth="3" />
            {/* Heavy-Duty Top Bass Head with Graphic EQ */}
            <rect x="20" y="16" width="60" height="16" rx="2" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            {/* EQ Sliders */}
            <line x1="28" y1="20" x2="28" y2="28" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="34" y1="19" x2="34" y2="29" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="40" y1="21" x2="40" y2="27" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="46" y1="18" x2="46" y2="30" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="52" y1="20" x2="52" y2="28" stroke="#38bdf8" strokeWidth="1.5" />
            {/* XLR Direct Out */}
            <rect x="62" y="20" width="10" height="7" rx="1" fill="#0284c7" />
            <text x="67" y="25" fontSize="4" fontWeight="900" fill="#ffffff" textAnchor="middle">DI</text>

            {/* 4 High-Excursion Bass Drivers */}
            <circle cx="34" cy="46" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="34" cy="46" r="3.5" fill="#38bdf8" />
            <circle cx="66" cy="46" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="66" cy="46" r="3.5" fill="#38bdf8" />
            <circle cx="34" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="34" cy="72" r="3.5" fill="#38bdf8" />
            <circle cx="66" cy="72" r="10" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="66" cy="72" r="3.5" fill="#38bdf8" />
          </svg>
        );

      case "power_drop":
        return (
          <svg viewBox="0 0 90 90" className="w-full h-full select-none" fill="none">
            {/* Industrial Yellow 120V 20A Quad-Box */}
            <rect x="18" y="18" width="54" height="54" rx="7" fill="#eab308" stroke="#a16207" strokeWidth="3" />
            {/* 4 Receptacles */}
            <rect x="24" y="24" width="18" height="18" rx="2" fill="#18181b" />
            <line x1="29" y1="28" x2="29" y2="34" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="37" y1="28" x2="37" y2="34" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="33" cy="37" r="1.5" fill="#fef08a" />

            <rect x="48" y="24" width="18" height="18" rx="2" fill="#18181b" />
            <line x1="53" y1="28" x2="53" y2="34" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="61" y1="28" x2="61" y2="34" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="57" cy="37" r="1.5" fill="#fef08a" />

            <rect x="24" y="48" width="18" height="18" rx="2" fill="#18181b" />
            <line x1="29" y1="52" x2="29" y2="58" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="37" y1="52" x2="37" y2="58" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="33" cy="61" r="1.5" fill="#fef08a" />

            <rect x="48" y="48" width="18" height="18" rx="2" fill="#18181b" />
            <line x1="53" y1="52" x2="53" y2="58" stroke="#fef08a" strokeWidth="1.5" />
            <line x1="61" y1="52" x2="61" y2="58" stroke="#fef08a" strokeWidth="1.5" />
            <circle cx="57" cy="61" r="1.5" fill="#fef08a" />

            {/* Heavy Rubber AC Cable Out */}
            <path d="M 45 72 L 45 84 L 62 84" stroke="#000000" strokeWidth="4" strokeLinecap="round" />
          </svg>
        );

      case "drum_pad":
        return (
          <div className="w-full h-full flex flex-col items-center justify-center relative">
            <svg viewBox="0 0 90 80" className="w-full h-full select-none" fill="none">
              {/* Roland SPD-SX / Octapad Chassis */}
              <rect x="12" y="14" width="66" height="52" rx="4" fill="#18181b" stroke="#3f3f46" strokeWidth="2.5" />
              {/* Red side accents */}
              <line x1="12" y1="20" x2="12" y2="60" stroke="#dc2626" strokeWidth="2" />
              <line x1="78" y1="20" x2="78" y2="60" stroke="#dc2626" strokeWidth="2" />

              {/* 9 Rubber Strike Pads */}
              <rect x="18" y="20" width="15" height="12" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <rect x="37" y="20" width="16" height="12" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <rect x="57" y="20" width="15" height="12" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />

              <rect x="18" y="36" width="15" height="12" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <rect x="37" y="36" width="16" height="12" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <rect x="57" y="36" width="15" height="12" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />

              <rect x="18" y="52" width="15" height="10" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <rect x="37" y="52" width="16" height="10" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
              <rect x="57" y="52" width="15" height="10" rx="1.5" fill="#3f3f46" stroke="#52525b" strokeWidth="1" />
            </svg>
            <div className="bg-slate-900 text-red-400 font-bold px-1.5 py-0.2 rounded text-[8px] uppercase tracking-wider border border-red-500/40 whitespace-nowrap">
              SAMPLE PAD
            </div>
          </div>
        );

      case "dj_turntables":
        return (
          <svg viewBox="0 0 110 75" className="w-full h-full select-none" fill="none">
            {/* Coffin Flight Case */}
            <rect x="6" y="14" width="98" height="48" rx="4" fill="#0f172a" stroke="#020617" strokeWidth="2.5" />
            {/* Deck 1 Platter */}
            <circle cx="30" cy="38" r="17" fill="#18181b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="30" cy="38" r="11" fill="#334155" />
            <circle cx="30" cy="38" r="3" fill="#ef4444" />
            <line x1="44" y1="24" x2="36" y2="38" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

            {/* Deck 2 Platter */}
            <circle cx="80" cy="38" r="17" fill="#18181b" stroke="#475569" strokeWidth="1.5" />
            <circle cx="80" cy="38" r="11" fill="#334155" />
            <circle cx="80" cy="38" r="3" fill="#ef4444" />
            <line x1="94" y1="24" x2="86" y2="38" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />

            {/* Center DJ Mixer */}
            <rect x="50" y="18" width="10" height="40" rx="1" fill="#1e293b" />
            <line x1="52" y1="50" x2="58" y2="50" stroke="#ffffff" strokeWidth="1.5" />
          </svg>
        );

      default:
        return (
          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-slate-800">
            {label}
          </div>
        );
    }
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col items-center justify-center select-none transition-all duration-100 ${
        isDragging ? "scale-105 opacity-85 z-50" : "scale-100"
      }`}
      style={{ transform: `rotate(${rotation}deg)` }}
    >
      {/* Selection Glow Indicator */}
      {isSelected && (
        <div className="absolute inset-0 -m-2 rounded-2xl border-2 border-indigo-500 bg-indigo-500/15 pointer-events-none animate-pulse" />
      )}

      {/* Actual SVG Artwork */}
      <div className="w-full h-full flex items-center justify-center pointer-events-none p-1">
        {renderSvg()}
      </div>

      {/* Semantic Text Label (Only for items that don't have built-in badges like monitor wedges) */}
      {type !== "monitor_wedge" && type !== "dual_wedge" && type !== "di_box" && (
        <div 
          className="mt-0.5 px-1.5 py-0.5 rounded bg-slate-900/95 text-white border border-slate-700 text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate max-w-[120px] shadow-sm pointer-events-none"
          style={{ transform: `rotate(${-rotation}deg)` }}
        >
          {label}
        </div>
      )}
    </div>
  );
};
