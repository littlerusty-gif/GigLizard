import React, { useState, useEffect, useRef } from "react";
import { 
  ShieldCheck, RefreshCw, Volume2, HelpCircle, 
  AlertTriangle, CheckCircle, Lock, ShieldAlert, Sparkles, Calculator
} from "lucide-react";
import { generateLocalCaptcha, CaptchaData } from "../utils/antiScrape";

interface CaptchaChallengeProps {
  onVerified: (isValid: boolean) => void;
  idPrefix?: string;
  theme?: "dark" | "light";
  compact?: boolean;
}

export default function CaptchaChallenge({
  onVerified,
  idPrefix = "auth",
  theme = "dark",
  compact = false
}: CaptchaChallengeProps) {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [userInput, setUserInput] = useState("");
  const [captchaMode, setCaptchaMode] = useState<"visual" | "math">("visual");
  const [isVerified, setIsVerified] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [honeypotValue, setHoneypotValue] = useState("");
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mountTimeRef = useRef<number>(Date.now());

  // Initialize or refresh Captcha
  const refreshCaptcha = () => {
    const newCap = generateLocalCaptcha();
    setCaptchaData(newCap);
    setUserInput("");
    setIsVerified(false);
    setErrorMessage("");
    mountTimeRef.current = Date.now();
    onVerified(false);
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Draw visual distorted canvas
  useEffect(() => {
    if (!canvasRef.current || !captchaData || captchaMode !== "visual") return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background gradient
    const isDark = theme === "dark";
    const bgGradient = ctx.createLinearGradient(0, 0, width, height);
    if (isDark) {
      bgGradient.addColorStop(0, "#0f172a"); // slate-900
      bgGradient.addColorStop(1, "#1e1b4b"); // indigo-950
    } else {
      bgGradient.addColorStop(0, "#f8fafc"); // slate-50
      bgGradient.addColorStop(1, "#e2e8f0"); // slate-200
    }
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add noise grid & dots
    for (let i = 0; i < 45; i++) {
      ctx.fillStyle = isDark 
        ? `rgba(${100 + Math.random() * 155}, ${100 + Math.random() * 155}, 255, ${0.15 + Math.random() * 0.25})`
        : `rgba(${50 + Math.random() * 100}, ${50 + Math.random() * 100}, 150, ${0.15 + Math.random() * 0.25})`;
      ctx.beginPath();
      ctx.arc(
        Math.random() * width,
        Math.random() * height,
        Math.random() * 2.5 + 0.5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Add interference lines
    for (let i = 0; i < 4; i++) {
      ctx.strokeStyle = isDark
        ? `rgba(168, 85, 247, ${0.3 + Math.random() * 0.3})`
        : `rgba(99, 102, 241, ${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(Math.random() * width, Math.random() * height);
      ctx.bezierCurveTo(
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height,
        Math.random() * width, Math.random() * height
      );
      ctx.stroke();
    }

    // Draw characters with distinct colors, rotation and vertical displacement
    const chars = captchaData.code.split("");
    const charSpacing = width / (chars.length + 1);

    chars.forEach((char, idx) => {
      ctx.save();
      const x = (idx + 0.8) * charSpacing;
      const y = height / 2 + (Math.random() * 6 - 3);
      const angle = (Math.random() * 36 - 18) * (Math.PI / 180);

      ctx.translate(x, y);
      ctx.rotate(angle);

      // Fonts
      const fonts = ["bold 22px monospace", "900 23px sans-serif", "bold 24px Courier New"];
      ctx.font = fonts[idx % fonts.length];

      // Colors
      const colors = isDark 
        ? ["#38bdf8", "#818cf8", "#c084fc", "#34d399", "#fbbf24"]
        : ["#0284c7", "#4f46e5", "#9333ea", "#059669", "#d97706"];
      ctx.fillStyle = colors[idx % colors.length];
      ctx.shadowColor = isDark ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.8)";
      ctx.shadowBlur = 4;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(char, 0, 0);
      ctx.restore();
    });

  }, [captchaData, captchaMode, theme]);

  // Audio Captcha voice enunciation
  const handlePlayAudio = () => {
    if (!captchaData || typeof window === "undefined" || !("speechSynthesis" in window)) {
      alert("Audio speech synthesis is not supported on this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    setIsSpeaking(true);

    const textToSpeak = captchaMode === "visual"
      ? `Verification code: ${captchaData.code.split("").join(". ")}. Enter these ${captchaData.code.length} characters.`
      : `Verification question: What is ${captchaData.mathQuestion}? Enter the numeric answer.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.85;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Verification submission handler
  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (lockoutTimer > 0) {
      setErrorMessage(`Too many failed attempts. Please wait ${lockoutTimer} seconds.`);
      return;
    }

    // Bot check 1: Honeypot field filled
    if (honeypotValue.trim().length > 0) {
      setErrorMessage("Automated bot scraping behavior detected.");
      onVerified(false);
      return;
    }

    // Bot check 2: Time-entropy (submission in under 300ms is automated bot execution)
    const elapsed = Date.now() - mountTimeRef.current;
    if (elapsed < 350) {
      setErrorMessage("Verification completed too fast. Please verify normally.");
      refreshCaptcha();
      return;
    }

    if (!userInput.trim()) {
      setErrorMessage("Please enter the verification code.");
      return;
    }

    let isValid = false;
    if (captchaMode === "visual" && captchaData) {
      isValid = userInput.trim().toUpperCase() === captchaData.code.toUpperCase();
    } else if (captchaMode === "math" && captchaData) {
      isValid = parseInt(userInput.trim(), 10) === captchaData.mathAnswer;
    }

    if (isValid) {
      setIsVerified(true);
      setErrorMessage("");
      onVerified(true);
    } else {
      const nextFailures = failedAttempts + 1;
      setFailedAttempts(nextFailures);
      setIsVerified(false);
      onVerified(false);

      if (nextFailures >= 5) {
        setLockoutTimer(25);
        setErrorMessage("5 incorrect attempts. Anti-bot lock active for 25s.");
      } else {
        setErrorMessage(`Incorrect code. (${5 - nextFailures} attempts remaining before cool-off)`);
      }
      refreshCaptcha();
    }
  };

  const isDark = theme === "dark";

  return (
    <div 
      className={`rounded-xl border p-3 space-y-2.5 transition-all select-none ${
        isDark 
          ? "bg-slate-900/90 border-slate-800 text-slate-200" 
          : "bg-slate-50 border-gray-200 text-slate-800"
      }`}
      id={`${idPrefix}-captcha-container`}
    >
      {/* Invisible Honeypot Trap Input to intercept scrapers and auto-filling bots */}
      <input
        type="text"
        name="security_honeypot_trap"
        value={honeypotValue}
        onChange={(e) => setHoneypotValue(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none", zIndex: -1 }}
      />

      {/* Header */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
        <div className="flex items-center gap-1.5 text-indigo-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Anti-Bot Captcha Security</span>
        </div>

        {/* Mode switcher (Visual distortion vs Math puzzle) */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setCaptchaMode(captchaMode === "visual" ? "math" : "visual");
              setIsVerified(false);
              setErrorMessage("");
              onVerified(false);
            }}
            className={`text-[8.5px] px-1.5 py-0.5 rounded cursor-pointer font-bold transition-all ${
              isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-gray-200 hover:bg-gray-300 text-slate-700"
            }`}
            title="Toggle between distorted visual code and math puzzle"
          >
            {captchaMode === "visual" ? "Switch to Math" : "Switch to Visual"}
          </button>
        </div>
      </div>

      {/* Verification Display Box */}
      <div className="flex items-center gap-2">
        {captchaMode === "visual" ? (
          <div className="relative rounded-lg overflow-hidden border border-slate-700/60 shadow-inner flex-shrink-0 bg-slate-950">
            <canvas
              ref={canvasRef}
              width={160}
              height={44}
              className="block cursor-pointer"
              onClick={refreshCaptcha}
              title="Click image to refresh captcha"
              id={`${idPrefix}-captcha-canvas`}
            />
          </div>
        ) : (
          <div className="flex-1 bg-indigo-950/60 border border-indigo-800/60 p-2 rounded-lg text-center font-mono font-black text-sm text-indigo-200 flex items-center justify-center gap-2">
            <Calculator className="w-4 h-4 text-indigo-400" />
            <span>Solve: {captchaData?.mathQuestion} = ?</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={refreshCaptcha}
            disabled={lockoutTimer > 0}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
            }`}
            title="Generate new Captcha code"
            id={`${idPrefix}-captcha-refresh-btn`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePlayAudio}
            disabled={isSpeaking || lockoutTimer > 0}
            className={`p-2 rounded-lg cursor-pointer transition-all ${
              isSpeaking 
                ? "bg-indigo-600 text-white animate-pulse" 
                : isDark ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-white hover:bg-gray-100 text-gray-700 border border-gray-200"
            }`}
            title="Listen to audio captcha"
            id={`${idPrefix}-captcha-audio-btn`}
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Input Row and Status */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              disabled={isVerified || lockoutTimer > 0}
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setErrorMessage("");
                // Auto verify on matching length
                if (captchaMode === "visual" && captchaData && e.target.value.trim().length === captchaData.code.length) {
                  if (e.target.value.trim().toUpperCase() === captchaData.code.toUpperCase()) {
                    setIsVerified(true);
                    onVerified(true);
                  }
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleVerify();
                }
              }}
              placeholder={
                lockoutTimer > 0
                  ? `Locked (${lockoutTimer}s)`
                  : captchaMode === "visual"
                  ? "Enter 5-char code"
                  : "Enter number"
              }
              className={`w-full p-2 text-xs font-mono font-bold rounded-lg border outline-none transition-all ${
                isVerified
                  ? "bg-emerald-950/40 border-emerald-500 text-emerald-300"
                  : isDark
                  ? "bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-indigo-500"
                  : "bg-white border-gray-300 text-slate-900 placeholder-gray-400 focus:border-indigo-500"
              }`}
              id={`${idPrefix}-captcha-input`}
              maxLength={captchaMode === "visual" ? 6 : 4}
            />
            
            {isVerified && (
              <CheckCircle className="w-4 h-4 text-emerald-400 absolute right-2.5 top-2.5" />
            )}
          </div>

          <button
            type="button"
            disabled={isVerified || lockoutTimer > 0 || !userInput.trim()}
            onClick={() => handleVerify()}
            className={`px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
              isVerified
                ? "bg-emerald-600 text-white cursor-default"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs"
            }`}
            id={`${idPrefix}-captcha-verify-btn`}
          >
            {isVerified ? "Verified ✓" : "Verify"}
          </button>
        </div>

        {/* Error or lock notification */}
        {errorMessage && (
          <div className="flex items-center gap-1.5 text-[9.5px] text-rose-400 font-semibold pt-0.5 animate-fade-in">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isVerified && (
          <div className="flex items-center gap-1 text-[9.5px] text-emerald-400 font-bold pt-0.5">
            <CheckCircle className="w-3 h-3" />
            <span>Human verification confirmed. Bot protection passed.</span>
          </div>
        )}
      </div>
    </div>
  );
}
