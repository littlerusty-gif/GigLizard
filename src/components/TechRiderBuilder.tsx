import React, { useState } from "react";
import { TechRider, InputChannel } from "../types";
import { Plus, Trash2, Download, Copy, Save, Sparkles, Sliders, CheckSquare, PlusCircle, Check, Info } from "lucide-react";
import { jsPDF } from "jspdf";

interface TechRiderBuilderProps {
  rider: TechRider;
  onUpdateRider: (updated: TechRider) => void;
}

const DEFAULT_CHANNELS: InputChannel[] = [
  { channel: 1, instrument: "Kick Drum", micOrDi: "Beta 52 or equivalent", stand: "Short Boom", phantomPower: false, notes: "No gating if possible" },
  { channel: 2, instrument: "Snare Top", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Reverb send requested" },
  { channel: 3, instrument: "Bass Guitar", micOrDi: "Active DI", stand: "None", phantomPower: true, notes: "Direct balanced output" },
  { channel: 4, instrument: "Stage Left Guitar", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Slightly pan left in FOH" },
  { channel: 5, instrument: "Main Vocal (Center)", micOrDi: "SM58 / Wireless Preferred", stand: "Tall Boom", phantomPower: false, notes: "High monitors foldback" },
  { channel: 6, instrument: "Backing Vocal (Drums)", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Heavy gating on voice mic" }
];

export default function TechRiderBuilder({ rider, onUpdateRider }: TechRiderBuilderProps) {
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Apply template presets
  const applyPreset = (presetType: "rock" | "acoustic" | "electronic") => {
    let presetInputs: InputChannel[] = [];
    if (presetType === "rock") {
      presetInputs = [
        { channel: 1, instrument: "Kick Drum", micOrDi: "Beta 52", stand: "Short Boom", phantomPower: false, notes: "Gated" },
        { channel: 2, instrument: "Snare", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Crisp and dry" },
        { channel: 3, instrument: "Guitar Amp Left", micOrDi: "SM57", stand: "Short Boom", phantomPower: false, notes: "Heavy pan" },
        { channel: 4, instrument: "Guitar Amp Right", micOrDi: "e906", stand: "Short Boom", phantomPower: false, notes: "Pan rig" },
        { channel: 5, instrument: "Bass Cabin DI", micOrDi: "Active DI Box", stand: "None", phantomPower: true, notes: "Clean low-end" },
        { channel: 6, instrument: "Keyboard Left", micOrDi: "Headrush Key DI", stand: "None", phantomPower: true, notes: "Stereo L" },
        { channel: 7, instrument: "Keyboard Right", micOrDi: "Headrush Key DI", stand: "None", phantomPower: true, notes: "Stereo R" },
        { channel: 8, instrument: "Lead Vocal", micOrDi: "SM58 / Beta 58", stand: "Tall Boom", phantomPower: false, notes: "Heavy compression" },
        { channel: 9, instrument: "Guitar Vocal", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Pan slightly" }
      ];
    } else if (presetType === "acoustic") {
      presetInputs = [
        { channel: 1, instrument: "Acoustic Guitar DI", micOrDi: "Active DI Box", stand: "None", phantomPower: true, notes: "Warm, natural EQ" },
        { channel: 2, instrument: "Violin/Mandolin", micOrDi: "Violin Clip Mic / DI", stand: "None", phantomPower: true, notes: "High headroom required" },
        { channel: 3, instrument: "Cajon / Percussion", micOrDi: "Beta 91A inside", stand: "None", phantomPower: true, notes: "Punchy low-mid sweep" },
        { channel: 4, instrument: "Lead Vocal (Acoustic)", micOrDi: "KSM9 / Condenser Vocal", stand: "Tall Boom", phantomPower: true, notes: "High monitor volume" },
        { channel: 5, instrument: "Harmonies Vocal", micOrDi: "SM58", stand: "Tall Boom", phantomPower: false, notes: "Gentle reverb requested" }
      ];
    } else if (presetType === "electronic") {
      presetInputs = [
        { channel: 1, instrument: "Stereo Deck Main L", micOrDi: "Radial Stereo DI", stand: "None", phantomPower: true, notes: "Subbass intensive" },
        { channel: 2, instrument: "Stereo Deck Main R", micOrDi: "Radial Stereo DI", stand: "None", phantomPower: true, notes: "High frequency stereo" },
        { channel: 3, instrument: "Live Synth L", micOrDi: "Active DI", stand: "None", phantomPower: true, notes: "Analog lead" },
        { channel: 4, instrument: "Live Synth R", micOrDi: "Active DI", stand: "None", phantomPower: true, notes: "Analog lead R" },
        { channel: 5, instrument: "Live Electronic Pads", micOrDi: "DI Box", stand: "None", phantomPower: true, notes: "Sub-mixed on stage" },
        { channel: 6, instrument: "MC/Vocal Front", micOrDi: "Wireless Shure SM58", stand: "Straight", phantomPower: false, notes: "No delays on monitors" }
      ];
    }

    onUpdateRider({
      ...rider,
      inputs: presetInputs
    });
  };

  const handleFieldChange = (field: keyof TechRider, value: string) => {
    onUpdateRider({
      ...rider,
      [field]: value
    });
  };

  const handleChannelValueChange = (channelId: number, field: keyof InputChannel, value: any) => {
    const updatedInputs = rider.inputs.map((ch) => {
      if (ch.channel === channelId) {
        return { ...ch, [field]: value };
      }
      return ch;
    });
    onUpdateRider({
      ...rider,
      inputs: updatedInputs
    });
  };

  const handleAddChannel = () => {
    const nextNum = rider.inputs.length > 0 ? Math.max(...rider.inputs.map(c => c.channel)) + 1 : 1;
    const newCh: InputChannel = {
      channel: nextNum,
      instrument: "New Input Instrument",
      micOrDi: "SM57",
      stand: "Short Boom",
      phantomPower: false,
      notes: "Default monitoring level"
    };
    onUpdateRider({
      ...rider,
      inputs: [...rider.inputs, newCh]
    });
  };

  const handleDeleteChannel = (num: number) => {
    const updated = rider.inputs.filter((c) => c.channel !== num)
      // Recalculate channels to be sequential for cleaner view
      .map((c, idx) => ({ ...c, channel: idx + 1 }));
    onUpdateRider({
      ...rider,
      inputs: updated
    });
  };

  // Compile highly structured plain text document for technical and hospitality requirements
  const compilePlainTextRider = () => {
    const band = (rider.bandName || "The Band").toUpperCase();
    const genre = (rider.genre || "Not Specified").toUpperCase();
    const contact = rider.contactName || "Tour Manager / Representative";
    const email = rider.contactEmail || "tour-contact@example.com";
    const phone = rider.contactPhone || "Inquire";

    let output = `================================================================================
                      TECHNICAL & HOSPITALITY PERFORMANCE RIDER
                                         FOR
                                    ${band}
================================================================================
SOUND STYLE / GENRE: ${genre}

PRIMARY CONTACTS:
  * Tour Representative / Contact:  ${contact}
  * Email Address:                  ${email}
  * Telephone Direct Line:          ${phone}

--------------------------------------------------------------------------------
SECTION I: GENERAL AUDIO & SYSTEM EXPECTATIONS
--------------------------------------------------------------------------------
1. PA SYSTEM: Purchaser shall supply a high-fidelity stereo sound system fully 
   tuned and capable of clean, distortion-free, full-frequency distribution.
2. CONSOLE & FOH: Clean 24 or 32-channel mixing setup with active parametric 
   EQ, compression, dynamic noise gating, and high-quality foldback delay/reverb.
3. MONITOR WEDGES: Independent stage wedges as detailed in stage arrangements.

--------------------------------------------------------------------------------
SECTION II: INPUT PATCH LIST & CHANNEL ASSIGNMENT
--------------------------------------------------------------------------------
`;

    output += " " + String("CH").padEnd(4) + " | " + 
              String("SOURCE INSTRUMENT").padEnd(25) + " | " + 
              String("MICROPHONE / DI SPECIFICATION").padEnd(30) + " | " + 
              String("STAND TYPE").padEnd(12) + " | " + 
              String("+48V").padEnd(5) + " | " + 
              "STATION DIRECTIVES & SYSTEM NOTES\n";
              
    output += "--------------------------------------------------------------------------------\n";

    rider.inputs.forEach((ch) => {
      output += " " + String(ch.channel).padEnd(4) + " | " +
                String(ch.instrument.toUpperCase()).padEnd(25) + " | " +
                String(ch.micOrDi.toUpperCase()).padEnd(30) + " | " +
                String(ch.stand).padEnd(12) + " | " +
                (ch.phantomPower ? "YES" : "NO ").padEnd(5) + " | " +
                ch.notes + "\n";
    });

    output += `--------------------------------------------------------------------------------
* All mic cabling, stage drops, and AC power lines must be securely taped and 
  routed to ensure performer and crew safety.

--------------------------------------------------------------------------------
SECTION III: SPECIFIC SYSTEM NOTES & MIX DIRECTIVES
--------------------------------------------------------------------------------
${rider.audioNotes.trim() || "No custom mix guidelines spec'd. Standard balanced stereo panning and active floor monitors foldback."}

--------------------------------------------------------------------------------
SECTION IV: BACKSTAGE PROVISIONS & DRESSING ROOM HOSPITALITY
--------------------------------------------------------------------------------
Purchaser will provide a clean, secure dressing room space equipped with comfortable 
seating. Adequate hospitality refreshments of water, hot coffee/tea, healthy 
meal options or light snacks, and clean fresh stage towels are highly appreciated 
to support artists prior to the performance.

SPECIALTY HOSPITALITY & DIETARY DETAILS:
--------------------------------------------------------------------------------
${rider.hospitalityNotes.trim() || "No specialty dietary guidelines or additional details specified."}

--------------------------------------------------------------------------------
SECTION V: CONTRACTUAL DECREE & LEGAL COVENANTS
--------------------------------------------------------------------------------
1. PARTY ROLE DESIGNATIONS: This document functions as an enforceable rider and
   agreement strictly distinguishing the performing artist, group, or band, 
   hereinafter designated the "ARTIST" (representing the resident state of 
   ${(rider.bandState || "NOT SPECIFIED").toUpperCase()}), and the venue sound host, booking promoter, 
   or event purchaser, hereinafter designated the "BUYER".

2. CONFLICT JURISDICTION: Both the ARTIST and the BUYER agree that in the event de facto 
   conflicts, legal disputes, claims, or contract breaches arise under this technical schedule, 
   they shall be interpreted, construed, and adjudicated strictly under the governing laws of 
   the State of ${(rider.governingState || "NOT SPECIFIED").toUpperCase()}, without giving effect to any choice of law rules.

--------------------------------------------------------------------------------
SECTION VI: AGREEMENT SIGN-OFFS & CONFIRMATIONS
--------------------------------------------------------------------------------
Both parties confirm adherence to the practical technical guidelines, legal covenants, 
and safety specifications outlined in this technical stage documentation.

BUYER REPRESENTATIVE:                 ARTIST REPRESENTATIVE (TM/Rep):
__________________________________        __________________________________
Date:                                     Date:`;

    return output;
  };

  const downloadPDFRider = () => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      const bandName = rider.bandName || "Artist";
      const fileName = `${bandName.replace(/\s+/g, "_")}_Tech_Rider.pdf`;
      
      // Page setup
      doc.setFont("courier", "bold");
      doc.setFontSize(12);
      doc.text(`TECHNICAL & HOSPITALITY PERFORMANCE RIDER`, 15, 15);
      doc.text(`FOR: ${bandName.toUpperCase()}`, 15, 21);
      doc.line(15, 23, 195, 23);
      
      doc.setFont("courier", "normal");
      doc.setFontSize(8.5);
      
      const content = compilePlainTextRider();
      const lines = doc.splitTextToSize(content, 180);
      
      let y = 30;
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          y = 15;
        }
        doc.text(line, 15, y);
        y += 4.5;
      });
      
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(compilePlainTextRider());
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="rider-builder-panel">
      {/* 2-Columns Settings Area */}
      <div className="lg:col-span-2 space-y-6" id="rider-form-section">
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 space-y-4" id="rider-meta-block">
          <div className="flex items-center justify-between border-b border-gray-50 pb-3" id="rider-header-row">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-500" />
              Band Contacts & General Information
            </h3>

            {/* Presets Loaders */}
            <div className="flex gap-1 items-center" id="preset-controls-row">
              <span className="text-[10px] font-bold text-gray-400 uppercase mr-1">Load Presets:</span>
              <button
                type="button"
                id="btn-preset-rock"
                onClick={() => applyPreset("rock")}
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
              >
                Rock Band
              </button>
              <button
                type="button"
                id="btn-preset-acoustic"
                onClick={() => applyPreset("acoustic")}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
              >
                Acoustic Duo
              </button>
              <button
                type="button"
                id="btn-preset-electronic"
                onClick={() => applyPreset("electronic")}
                className="bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded cursor-pointer"
              >
                Live DJ/Electro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="meta-inputs-grid">
            <div id="band-name-input-group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1" id="lbl-meta-band">
                Band Name
              </label>
              <input
                type="text"
                id="field-rider-bandName"
                value={rider.bandName}
                onChange={(e) => handleFieldChange("bandName", e.target.value)}
                placeholder="E.g., Dr Hadit"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="band-genre-input-group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1" id="lbl-meta-genre">
                Live Genre
              </label>
              <input
                type="text"
                id="field-rider-genre"
                value={rider.genre}
                onChange={(e) => handleFieldChange("genre", e.target.value)}
                placeholder="E.g., Alternative Rock / Pacific NW"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="band-contactName-input-group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1" id="lbl-meta-contact">
                Contact Person Name
              </label>
              <input
                type="text"
                id="field-rider-contactName"
                value={rider.contactName}
                onChange={(e) => handleFieldChange("contactName", e.target.value)}
                placeholder="E.g., Dr Hadit (Tour Rep)"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="band-contactEmail-input-group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1" id="lbl-meta-email">
                Contact Email
              </label>
              <input
                type="email"
                id="field-rider-contactEmail"
                value={rider.contactEmail}
                onChange={(e) => handleFieldChange("contactEmail", e.target.value)}
                placeholder="E.g., booking@drhadit.com"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="band-contactPhone-input-group">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1" id="lbl-meta-phone">
                Contact Phone 24/7
              </label>
              <input
                type="text"
                id="field-rider-contactPhone"
                value={rider.contactPhone}
                onChange={(e) => handleFieldChange("contactPhone", e.target.value)}
                placeholder="E.g., +1 (206) 555-0144"
                className="w-full text-xs p-2.5 bg-slate-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div id="band-bandState-input-group">
              <label className="block text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1" id="lbl-meta-bandstate">
                Band State of Origin / Residence
              </label>
              <input
                type="text"
                id="field-rider-bandState"
                value={rider.bandState || ""}
                onChange={(e) => handleFieldChange("bandState", e.target.value)}
                placeholder="E.g., Washington"
                className="w-full text-xs p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
              />
            </div>

            <div id="band-governingState-input-group" className="md:col-span-3">
              <label className="block text-[11px] font-bold text-indigo-500 uppercase tracking-wider mb-1" id="lbl-meta-governingstate">
                Contract Governing State Laws (Conflict Dispute Venue)
              </label>
              <input
                type="text"
                id="field-rider-governingState"
                value={rider.governingState || ""}
                onChange={(e) => handleFieldChange("governingState", e.target.value)}
                placeholder="E.g., California"
                className="w-full text-xs p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 font-bold"
              />
            </div>
          </div>
        </div>

        {/* Input List Table Block */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs p-6 space-y-4" id="rider-input-list-block">
          <div className="flex justify-between items-center border-b border-gray-50 pb-3" id="input-list-header-row">
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight" id="input-list-title">
                Patch Map & Input List (FOH Patch Panel)
              </h3>
              <p className="text-[10px] text-gray-400 font-medium" id="input-list-desc">
                Customize what equipment goes into each mixing board channel for the stage engineer.
              </p>
            </div>
            <button
              type="button"
              id="btn-add-patch-row"
              onClick={handleAddChannel}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg cursor-pointer flex items-center gap-1.5 transition-all shadow-xs"
            >
              <PlusCircle className="font-extrabold w-4 h-4" />
              Add Input Channel
            </button>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto" id="channels-table-wrapper">
            <table className="w-full text-left border-collapse text-xs" id="channels-patch-table">
              <thead>
                <tr className="bg-slate-50 text-slate-500 border-b border-gray-100 font-extrabold" id="th-row">
                  <th className="py-2.5 px-2 text-center w-12" id="th-ch">Ch</th>
                  <th className="py-2.5 px-3 w-1/4" id="th-instrument">Instrument Source</th>
                  <th className="py-2.5 px-3 w-1/4" id="th-mic">Mic/DI Device Spec</th>
                  <th className="py-2.5 px-3 w-32" id="th-stand">Stand</th>
                  <th className="py-2.5 px-2 text-center w-14 lg:w-16" id="th-phantom">+48v</th>
                  <th className="py-2.5 px-3" id="th-notes">Engineer Mix Notes</th>
                  <th className="py-2.5 px-2 text-center w-10" id="th-action"></th>
                </tr>
              </thead>
              <tbody>
                {rider.inputs.map((ch, idx) => (
                  <tr
                    key={ch.channel}
                    id={`row-channel-${ch.channel}`}
                    className="border-b border-gray-50 hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="py-2.5 px-2 font-mono text-center font-bold text-gray-400" id={`cell-ch-${ch.channel}`}>
                      {ch.channel}
                    </td>

                    <td className="py-2.5 px-3" id={`cell-instrument-${ch.channel}`}>
                      <input
                        type="text"
                        id={`input-instrument-${ch.channel}`}
                        value={ch.instrument}
                        onChange={(e) => handleChannelValueChange(ch.channel, "instrument", e.target.value)}
                        className="w-full p-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 font-bold text-gray-800 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-3" id={`cell-mic-${ch.channel}`}>
                      <input
                        type="text"
                        id={`input-mic-${ch.channel}`}
                        value={ch.micOrDi}
                        onChange={(e) => handleChannelValueChange(ch.channel, "micOrDi", e.target.value)}
                        className="w-full p-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 text-gray-600 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-3" id={`cell-stand-${ch.channel}`}>
                      <select
                        id={`select-stand-${ch.channel}`}
                        value={ch.stand}
                        onChange={(e) => handleChannelValueChange(ch.channel, "stand", e.target.value)}
                        className="w-full p-1 bg-transparent border border-transparent rounded hover:border-gray-200 focus:border-indigo-500 focus:outline-none text-gray-600 bg-white"
                      >
                        <option value="None">None</option>
                        <option value="Short Boom">Short Boom</option>
                        <option value="Tall Boom">Tall Boom</option>
                        <option value="Straight">Straight</option>
                      </select>
                    </td>

                    <td className="py-2.5 px-2 text-center" id={`cell-phantom-${ch.channel}`}>
                      <input
                        type="checkbox"
                        id={`check-phantom-${ch.channel}`}
                        checked={ch.phantomPower}
                        onChange={(e) => handleChannelValueChange(ch.channel, "phantomPower", e.target.checked)}
                        className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500 rounded border-gray-300 cursor-pointer"
                      />
                    </td>

                    <td className="py-2.5 px-3" id={`cell-notes-${ch.channel}`}>
                      <input
                        type="text"
                        id={`input-notes-${ch.channel}`}
                        value={ch.notes}
                        onChange={(e) => handleChannelValueChange(ch.channel, "notes", e.target.value)}
                        className="w-full p-1 bg-transparent border-b border-transparent hover:border-gray-200 focus:border-indigo-500 text-gray-600 focus:outline-none"
                      />
                    </td>

                    <td className="py-2.5 px-2 text-center" id={`cell-action-${ch.channel}`}>
                      <button
                        type="button"
                        id={`btn-del-channel-${ch.channel}`}
                        aria-label={`Delete input channel ${ch.channel}`}
                        onClick={() => handleDeleteChannel(ch.channel)}
                        className="text-gray-300 hover:text-rose-600 transition-colors cursor-pointer p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg text-[11px] text-slate-500 flex items-start gap-1.5 border border-slate-100" id="tech-fact">
            <Info className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span><strong>Technical Tip:</strong> Dynamic mics like Shure SM58/57 do not request +48V Phantom power, but electrostatic acoustic DI instruments and high-impedance keyboard direct line-boxes do request active juice!</span>
          </div>
        </div>

        {/* Detailed Monitor/Sound Notes & Hospitality requests */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="rider-texts-row">
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3" id="audio-spec-block">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              Audio EQ & Monitoring Directives
            </h4>
            <textarea
              id="field-rider-audioNotes"
              value={rider.audioNotes}
              onChange={(e) => handleFieldChange("audioNotes", e.target.value)}
              placeholder="E.g., We require 3 independent monitor mixes. Mix 1 (Vocals) must be exceptionally loud with rich high ends. Drummer prefers a wired headphone tap. Reverberation on lead vocals is highly appreciated..."
              className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[140px] placeholder:text-gray-400"
            />
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3" id="hospitality-spec-block">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
              Dressing Room & Hospitality Rider
            </h4>
            <textarea
              id="field-rider-hospitalityNotes"
              value={rider.hospitalityNotes}
              onChange={(e) => handleFieldChange("hospitalityNotes", e.target.value)}
              placeholder="E.g., Clean hydration required! Please provide solid drinking water (bottles or filter). Small vegan/vegetarian meals or light snack trays for 4 touring members. 4 clean towels available for stage use."
              className="w-full text-xs p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 min-h-[140px] placeholder:text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Export & Review sidebar panel */}
      <div className="space-y-6" id="export-rider-sidebar">
        <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm border border-slate-950 space-y-5" id="spec-review-card">
          <div className="space-y-1.5" id="sidebar-label">
            <span className="text-[10px] uppercase font-black tracking-widest text-indigo-300">Rider Compiler</span>
            <h4 className="text-base font-bold text-white tracking-tight" id="sidebar-sec-title">
              Tech Sheet Preview
            </h4>
            <p className="text-xs text-slate-400" id="sidebar-sec-desc">
              Review and copy your completed stage and patch list sheets to send directly to venue sound engineering teams.
            </p>
          </div>

          {/* Plain Text Preview Container */}
          <div className="bg-[#FAF9F5] border-2 border-dashed border-amber-800/30 rounded-lg p-4 max-h-[350px] overflow-y-auto font-mono text-[9.5px] text-stone-800 whitespace-pre scrollbar-thin shadow-inner" id="rider-live-pre" style={{ fontFamily: "Courier New, Courier, monospace" }}>
            {compilePlainTextRider()}
          </div>

          <div className="grid grid-cols-1 gap-2" id="export-btns-top">
            <button
              type="button"
              id="btn-copy-rider-raw"
              onClick={handleCopy}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied Text Rider!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-300" />
                  Copy Plain Text Rider
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2" id="export-btns">
            <button
              type="button"
              id="btn-export-rider-pdf"
              onClick={downloadPDFRider}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .PDF
            </button>

            <button
              type="button"
              id="btn-export-rider-txt"
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([compilePlainTextRider()], { type: "text/plain" });
                element.href = URL.createObjectURL(file);
                element.download = `${rider.bandName.replace(/\s+/g, "_")}_Tech_Rider.txt`;
                document.body.appendChild(element);
                element.click();
                document.body.removeChild(element);
              }}
              className="bg-slate-700 hover:bg-slate-605 text-white text-xs font-extrabold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download .TXT
            </button>
          </div>
        </div>

        {/* Action Prompt help panel about embedding */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4" id="rider-soundcheck-tip">
          <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
            <CheckSquare className="w-4 h-4 text-emerald-500" />
            Soundcheck Preparedness Check
          </h4>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Sending this simple text documentation to local sound technicians exactly **2 weeks** prior to show date improves your evening immensely. Sound techs can match your patches, pre-patch lines on-stage, check DI systems, and reduce your live latency load significantly!
          </p>
        </div>
      </div>
    </div>
  );
}
