import React, { useState, useEffect } from "react";
import { UserAccount } from "../types";
import { sanitizeInputText } from "../utils/antiScrape";
import { isBandBanned, isPerpetualPassEmail } from "../utils/accessControl";
import { 
  X, Lock, LogIn, Eye, EyeOff, CheckCircle2, 
  AlertCircle, KeyRound, ShieldCheck, UserCheck 
} from "lucide-react";

interface UserLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (account: UserAccount) => void;
  onOpenCheckout?: () => void;
}

export default function UserLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onOpenCheckout
}: UserLoginModalProps) {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginRole, setLoginRole] = useState<"Band" | "Venue">("Venue");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Anti-bot captcha challenge
  const [captchaNumA, setCaptchaNumA] = useState(3);
  const [captchaNumB, setCaptchaNumB] = useState(4);
  const [captchaInput, setCaptchaInput] = useState("");
  const [captchaVerified, setCaptchaVerified] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage("");
      setSuccessMessage("");
      const a = Math.floor(Math.random() * 8) + 2;
      const b = Math.floor(Math.random() * 8) + 2;
      setCaptchaNumA(a);
      setCaptchaNumB(b);
      setCaptchaInput("");
      setCaptchaVerified(false);
    }
  }, [isOpen]);

  const handleVerifyCaptcha = () => {
    if (parseInt(captchaInput.trim(), 10) === captchaNumA + captchaNumB) {
      setCaptchaVerified(true);
      setErrorMessage("");
    } else {
      setErrorMessage("Anti-bot verification failed. Please check the math answer.");
    }
  };

  if (!isOpen) return null;

  const handleSubmitLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!captchaVerified) {
      if (parseInt(captchaInput.trim(), 10) === captchaNumA + captchaNumB) {
        setCaptchaVerified(true);
      } else {
        setErrorMessage("Anti-bot check required: Please solve the quick math verification below.");
        return;
      }
    }

    const cleanEmail = sanitizeInputText(loginEmail, 100).trim().toLowerCase();
    const cleanPassword = sanitizeInputText(loginPassword, 100);

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!cleanPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    if (isBandBanned(cleanEmail)) {
      setErrorMessage("Access denied: This account has been banned from the directory.");
      return;
    }

    // Check custom passwords map
    const customPasswordsMap: Record<string, string> = (() => {
      try {
        return JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
      } catch {
        return {};
      }
    })();
    const expectedCustomPass = customPasswordsMap[cleanEmail];

    // 1. Platform Owner (littlerusty@gmail.com)
    if (cleanEmail === "littlerusty@gmail.com") {
      const validAdminPass = expectedCustomPass || "L,eilani1228";
      if (cleanPassword === validAdminPass) {
        const ownerAccount: UserAccount = {
          type: "Band",
          name: "Dr Hadit",
          city: "Seattle, WA",
          isPremium: true,
          hasPaidAccess: true,
          autoRenew: true,
          accessExpiresAt: new Date(Date.now() + 36500 * 24 * 60 * 60 * 1000).toISOString(),
          contactEmail: "littlerusty@gmail.com",
          genre: "Alternative Rock / Synthwave",
          bio: "Platform Owner & Artist (Dr Hadit) • Lifetime VIP Owner with full unmasked access for life.",
          experienceLevel: "National Act"
        };
        setSuccessMessage("✅ Logged in successfully as Platform Owner! Lifetime Full Access Enabled.");
        setTimeout(() => {
          onLoginSuccess(ownerAccount);
          onClose();
        }, 600);
        return;
      } else {
        setErrorMessage("Invalid password for Platform Owner account.");
        return;
      }
    }

    if (cleanPassword.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    // 2. Check registered custom bands & venues in localStorage
    const savedBandsStr = localStorage.getItem("custom_available_bands_v1");
    let customBands: any[] = [];
    if (savedBandsStr) {
      try { customBands = JSON.parse(savedBandsStr); } catch (_) {}
    }

    const savedVenuesStr = localStorage.getItem("custom_venues_v1");
    let customVenues: any[] = [];
    if (savedVenuesStr) {
      try { customVenues = JSON.parse(savedVenuesStr); } catch (_) {}
    }

    const foundCustomBand = customBands.find(b => 
      b.contactEmail?.trim().toLowerCase() === cleanEmail ||
      b.name?.trim().toLowerCase() === cleanEmail
    );
    if (foundCustomBand) {
      const requiredPass = expectedCustomPass || foundCustomBand.password || "password";
      if (cleanPassword !== requiredPass) {
        setErrorMessage("Access denied: Incorrect password for registered band account.");
        return;
      }
      const payload: UserAccount = {
        type: "Band",
        name: foundCustomBand.name,
        city: foundCustomBand.city,
        isPremium: Boolean(foundCustomBand.isPremium),
        hasPaidAccess: Boolean(foundCustomBand.hasPaidAccess),
        accessExpiresAt: foundCustomBand.accessExpiresAt,
        contactEmail: foundCustomBand.contactEmail,
        genre: Array.isArray(foundCustomBand.genres) ? foundCustomBand.genres.join(", ") : (foundCustomBand.genre || "Alternative Rock"),
        bio: foundCustomBand.bio,
        experienceLevel: foundCustomBand.experienceLevel,
        website: foundCustomBand.website,
        contactPhone: foundCustomBand.contactPhone,
        password: requiredPass
      };
      setSuccessMessage(`✅ Welcome back! Logged in as Band: ${foundCustomBand.name}.`);
      setTimeout(() => {
        onLoginSuccess(payload);
        onClose();
      }, 600);
      return;
    }

    const foundCustomVenue = customVenues.find(v => 
      v.contactEmail?.trim().toLowerCase() === cleanEmail ||
      v.name?.trim().toLowerCase() === cleanEmail
    );
    if (foundCustomVenue) {
      const requiredPass = expectedCustomPass || foundCustomVenue.password || "password";
      if (cleanPassword !== requiredPass) {
        setErrorMessage("Access denied: Incorrect password for registered venue account.");
        return;
      }
      const payload: UserAccount = {
        type: "Venue",
        name: foundCustomVenue.name,
        city: foundCustomVenue.city,
        isPremium: Boolean(foundCustomVenue.isPremium),
        hasPaidAccess: Boolean(foundCustomVenue.hasPaidAccess),
        accessExpiresAt: foundCustomVenue.accessExpiresAt,
        contactEmail: foundCustomVenue.contactEmail,
        genre: Array.isArray(foundCustomVenue.genres) ? foundCustomVenue.genres.join(", ") : "Live Music",
        bio: foundCustomVenue.description,
        capacity: foundCustomVenue.capacity,
        address: foundCustomVenue.address,
        hasPA: foundCustomVenue.hasPA,
        hasLighting: foundCustomVenue.hasLighting,
        contactPhone: foundCustomVenue.contactPhone,
        website: foundCustomVenue.website,
        password: requiredPass
      };
      setSuccessMessage(`✅ Welcome back! Logged in as Venue: ${foundCustomVenue.name}.`);
      setTimeout(() => {
        onLoginSuccess(payload);
        onClose();
      }, 600);
      return;
    }

    // 3. Check previously active profile in venue_user_profile_v1
    const storedVenueProfileStr = localStorage.getItem("venue_user_profile_v1");
    if (storedVenueProfileStr) {
      try {
        const storedProfile: UserAccount = JSON.parse(storedVenueProfileStr);
        if (storedProfile.contactEmail?.trim().toLowerCase() === cleanEmail) {
          const requiredPass = expectedCustomPass || "password";
          if (cleanPassword !== requiredPass && cleanPassword.length >= 4) {
            // Accept as valid user session
          }
          setSuccessMessage(`✅ Logged in successfully as: ${storedProfile.name || cleanEmail}`);
          setTimeout(() => {
            onLoginSuccess(storedProfile);
            onClose();
          }, 600);
          return;
        }
      } catch (_) {}
    }

    // 4. Default user login for custom user account
    let displayName = cleanEmail.split("@")[0];
    displayName = displayName.split(/[\s._-]+/).map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()).join(" ");

    const defaultAccount: UserAccount = {
      type: loginRole,
      name: loginRole === "Venue" ? `${displayName} Room` : displayName,
      city: "Seattle, WA",
      isPremium: false,
      hasPaidAccess: false,
      contactEmail: cleanEmail,
      genre: loginRole === "Venue" ? "Live Music" : "Alternative Rock",
      bio: `${loginRole} account registered on GigLizard.`,
      password: cleanPassword
    };

    setSuccessMessage(`✅ Logged in as: ${defaultAccount.name}`);
    setTimeout(() => {
      onLoginSuccess(defaultAccount);
      onClose();
    }, 600);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      id="user-login-modal-overlay"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 md:p-7 space-y-5 shadow-2xl relative animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
        id="user-login-modal-content"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Account Sign In Required
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Band contact information is reserved for logged-in users with an active, up-to-date paid subscription.
          </p>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmitLogin} className="space-y-3.5">
          {/* Email */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Email Address
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => {
                setLoginEmail(e.target.value);
                setErrorMessage("");
              }}
              placeholder="e.g. littlerusty@gmail.com"
              required
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all font-mono"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Password
              </label>
              <span className="text-[10px] text-slate-500">Min 4 characters</span>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={loginPassword}
                onChange={(e) => {
                  setLoginPassword(e.target.value);
                  setErrorMessage("");
                }}
                placeholder="••••••••"
                required
                className="w-full p-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>

          {/* Role selector */}
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Account Role:
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setLoginRole("Band")}
                className={`text-[11px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  loginRole === "Band" 
                    ? "bg-indigo-600 text-white shadow-xs" 
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Band Rep
              </button>
              <button
                type="button"
                onClick={() => setLoginRole("Venue")}
                className={`text-[11px] font-black px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  loginRole === "Venue" 
                    ? "bg-emerald-600 text-white shadow-xs" 
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                Venue Booker
              </button>
            </div>
          </div>

          {/* Anti-bot Math Challenge */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-slate-300 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                Security Verification:
              </span>
              <span className="font-mono text-amber-400 font-black">
                {captchaNumA} + {captchaNumB} = ?
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                placeholder="Enter answer"
                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={handleVerifyCaptcha}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  captchaVerified 
                    ? "bg-emerald-600 text-white" 
                    : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                }`}
              >
                {captchaVerified ? "✓ Verified" : "Verify"}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In to Your Account</span>
          </button>
        </form>

        {/* Upgrade / Subscribe Option */}
        <div className="pt-3 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-[11px] text-slate-400">
            Need an active subscription to unmask contact info?
          </p>
          {onOpenCheckout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Get 30-Day Pass ($9.99)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
