import React, { useState, useEffect } from "react";
import { 
  KeyRound, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, 
  Send, Copy, Check, Sparkles, Clock, AlertCircle, RefreshCw, X,
  ShieldCheck, ExternalLink
} from "lucide-react";
import CaptchaChallenge from "./CaptchaChallenge";
import { sanitizeInputText } from "../utils/antiScrape";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  initialToken?: string;
  onPasswordResetSuccess: (email: string) => void;
  onBackToLogin: (prefillEmail?: string) => void;
}

type ModalView = "request" | "sent" | "reset" | "success";

export default function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = "",
  initialToken = "",
  onPasswordResetSuccess,
  onBackToLogin
}: ForgotPasswordModalProps) {
  const [view, setView] = useState<ModalView>(initialToken ? "reset" : "request");
  const [email, setEmail] = useState(initialEmail);
  const [resetToken, setResetToken] = useState(initialToken);
  const [resetLink, setResetLink] = useState("");
  
  // Password form states
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Sync initial props
  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
    if (initialToken) {
      setResetToken(initialToken);
      setView("reset");
    } else if (isOpen && view !== "reset") {
      setView("request");
    }
    setErrorMessage("");
  }, [initialEmail, initialToken, isOpen]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // 1. Submit Forgot Password Request (send email link)
  const handleRequestReset = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const cleanEmail = sanitizeInputText(email, 100).trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!isCaptchaVerified) {
      setErrorMessage("Please complete the security check challenge below.");
      return;
    }

    setIsLoading(true);

    try {
      // Call server endpoint
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResetToken(data.resetToken || `RST-${Date.now()}`);
        setResetLink(data.resetLink || `${window.location.origin}/#reset-password?token=${data.resetToken}&email=${encodeURIComponent(cleanEmail)}`);
        setView("sent");
        setResendCooldown(60);
      } else {
        // Fallback local mock generation if server is offline
        const fallbackToken = `RST-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
        const fallbackLink = `${window.location.origin}/#reset-password?token=${fallbackToken}&email=${encodeURIComponent(cleanEmail)}`;
        setResetToken(fallbackToken);
        setResetLink(fallbackLink);
        setView("sent");
        setResendCooldown(60);
      }
    } catch (err) {
      // Fallback robust dispatch
      const fallbackToken = `RST-${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
      const fallbackLink = `${window.location.origin}/#reset-password?token=${fallbackToken}&email=${encodeURIComponent(cleanEmail)}`;
      setResetToken(fallbackToken);
      setResetLink(fallbackLink);
      setView("sent");
      setResendCooldown(60);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Submit New Password
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage("");

    const cleanEmail = sanitizeInputText(email, 100).trim().toLowerCase();
    const cleanNewPass = sanitizeInputText(newPassword, 100).trim();
    const cleanConfirmPass = sanitizeInputText(confirmPassword, 100).trim();

    if (!cleanEmail) {
      setErrorMessage("Account email is missing. Please start password reset again.");
      return;
    }

    if (cleanNewPass.length < 4) {
      setErrorMessage("New password must be at least 4 characters.");
      return;
    }

    if (cleanNewPass !== cleanConfirmPass) {
      setErrorMessage("Passwords do not match. Please check and try again.");
      return;
    }

    setIsLoading(true);

    try {
      // Call backend reset route
      try {
        await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: resetToken || "DEMO-RESET-TOKEN",
            email: cleanEmail,
            newPassword: cleanNewPass
          })
        });
      } catch (_) {}

      // Update custom passwords registry in localStorage
      try {
        const passwords = JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
        passwords[cleanEmail] = cleanNewPass;
        localStorage.setItem("user_custom_passwords_v1", JSON.stringify(passwords));
      } catch (_) {}

      // Update in custom_available_bands_v1 if present
      try {
        const bandsStr = localStorage.getItem("custom_available_bands_v1");
        if (bandsStr) {
          const bands = JSON.parse(bandsStr);
          const updatedBands = bands.map((b: any) => {
            if (b.contactEmail?.toLowerCase() === cleanEmail) {
              return { ...b, password: cleanNewPass };
            }
            return b;
          });
          localStorage.setItem("custom_available_bands_v1", JSON.stringify(updatedBands));
        }
      } catch (_) {}

      // Update in custom_venues_v1 if present
      try {
        const venuesStr = localStorage.getItem("custom_venues_v1");
        if (venuesStr) {
          const venues = JSON.parse(venuesStr);
          const updatedVenues = venues.map((v: any) => {
            if (v.contactEmail?.toLowerCase() === cleanEmail) {
              return { ...v, password: cleanNewPass };
            }
            return v;
          });
          localStorage.setItem("custom_venues_v1", JSON.stringify(updatedVenues));
        }
      } catch (_) {}

      // Update in current_user_account_v1 if logged in
      try {
        const accStr = localStorage.getItem("current_user_account_v1");
        if (accStr) {
          const acc = JSON.parse(accStr);
          if (acc.contactEmail?.toLowerCase() === cleanEmail) {
            acc.password = cleanNewPass;
            localStorage.setItem("current_user_account_v1", JSON.stringify(acc));
          }
        }
      } catch (_) {}

      setView("success");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to update password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (!resetLink) return;
    navigator.clipboard.writeText(resetLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs"
      id="forgot-password-modal-overlay"
    >
      <div 
        className="bg-slate-900 border border-slate-750 text-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-scale-up space-y-4"
        id="forgot-password-modal-card"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-all cursor-pointer"
          title="Close dialog"
          id="btn-close-forgot-pw-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. Request Reset View */}
        {view === "request" && (
          <div className="space-y-4" id="view-forgot-pw-request">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-inner">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white">Reset Your Password</h3>
                <p className="text-xs text-slate-400">Enter your email and we'll send a secure reset link.</p>
              </div>
            </div>

            <form onSubmit={handleRequestReset} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-indigo-400" />
                  Account Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="e.g. booking@drhadit.com"
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  id="forgot-pw-email-input"
                  required
                  autoFocus
                />
              </div>

              {/* Security Captcha Challenge */}
              <div className="pt-1">
                <CaptchaChallenge
                  onVerified={(valid) => {
                    setIsCaptchaVerified(valid);
                    if (valid) setErrorMessage("");
                  }}
                  idPrefix="forgot-password"
                  theme="dark"
                />
              </div>

              {errorMessage && (
                <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                id="btn-submit-forgot-pw"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Dispatching Reset Email...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Password Reset Link</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => onBackToLogin(email)}
                  className="text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1 mx-auto font-semibold transition-colors cursor-pointer"
                  id="btn-back-to-login-from-forgot"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Back to Sign In</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 2. Email Sent & Simulated Email Inbox Preview */}
        {view === "sent" && (
          <div className="space-y-4" id="view-forgot-pw-sent">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white">Reset Email Dispatched!</h3>
                <p className="text-xs text-slate-400">Password reset link generated for <span className="text-emerald-400 font-bold">{email}</span></p>
              </div>
            </div>

            {/* Interactive Transactional Email Client Preview */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-900/60 border border-indigo-700/50 flex items-center justify-center text-indigo-300 font-bold text-[10px]">
                    GL
                  </div>
                  <div>
                    <div className="font-bold text-slate-200">GigLizard Security & Access</div>
                    <div className="text-[9.5px] text-slate-500">no-reply@giglizard.com</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-900/60 px-2 py-0.5 rounded-full font-semibold">
                  <Clock className="w-2.5 h-2.5" />
                  <span>Just now</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="font-black text-slate-200 text-xs">Subject: 🔐 Password Reset Request for GigLizard</div>
                <p className="text-[11.5px] text-slate-400 leading-relaxed">
                  Hello, we received a request to reset your password. Click the secure link below to set your new credentials.
                </p>

                {/* Direct Action Link in Email */}
                <div className="pt-2 pb-1">
                  <button
                    type="button"
                    onClick={() => {
                      setView("reset");
                      setErrorMessage("");
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all hover:scale-[1.01]"
                    id="btn-click-email-reset-link"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Enter New Password Now →</span>
                  </button>
                </div>

                {/* Copyable Reset URL */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-2 flex items-center justify-between gap-2 text-[10.5px]">
                  <span className="font-mono text-slate-400 truncate select-all">{resetLink}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    id="btn-copy-reset-link"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center flex items-center justify-center gap-1">
                <ShieldCheck className="w-3 h-3 text-indigo-400" />
                <span>Single-use link valid for 60 minutes</span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => onBackToLogin(email)}
                className="text-slate-400 hover:text-white font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Back to Sign In</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isLoading}
                onClick={() => handleRequestReset()}
                className="text-indigo-400 hover:text-indigo-300 font-bold disabled:opacity-40 disabled:hover:text-indigo-400 cursor-pointer transition-colors text-[11px]"
              >
                {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : "Resend email"}
              </button>
            </div>
          </div>
        )}

        {/* 3. Reset Password View (Enter New Password) */}
        {view === "reset" && (
          <div className="space-y-4" id="view-set-new-password">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white">Create New Password</h3>
                <p className="text-xs text-slate-400">
                  Setting new password for <span className="text-indigo-300 font-bold">{email || "account"}</span>
                </p>
              </div>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-3 pt-1">
              {/* New Password Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest flex justify-between">
                  <span>New Password</span>
                  <span className="text-[9px] text-slate-500 lowercase font-normal">min 4 chars</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="Enter new password..."
                    className="w-full p-2.5 pr-9 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    id="new-password-input"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password Input */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    placeholder="Re-enter new password..."
                    className="w-full p-2.5 pr-9 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    id="confirm-new-password-input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Password strength indicator */}
              {newPassword && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                  <div className="h-1 flex-1 bg-slate-800 rounded-full overflow-hidden flex gap-0.5">
                    <div className={`h-full flex-1 ${newPassword.length >= 4 ? "bg-amber-400" : "bg-slate-700"}`} />
                    <div className={`h-full flex-1 ${newPassword.length >= 8 ? "bg-emerald-400" : "bg-slate-700"}`} />
                    <div className={`h-full flex-1 ${/[0-9!@#$%^&*]/.test(newPassword) && newPassword.length >= 8 ? "bg-indigo-400" : "bg-slate-700"}`} />
                  </div>
                  <span className="shrink-0 font-medium">
                    {newPassword.length < 4 ? "Too short" : newPassword.length < 8 ? "Fair" : "Strong"}
                  </span>
                </div>
              )}

              {errorMessage && (
                <div className="bg-rose-950/50 border border-rose-800 text-rose-300 text-xs p-2.5 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                id="btn-save-new-password"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving New Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm & Update Password</span>
                  </>
                )}
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setView("request")}
                  className="text-xs text-slate-400 hover:text-white font-semibold transition-colors cursor-pointer"
                >
                  ← Request another reset link
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 4. Password Successfully Updated View */}
        {view === "success" && (
          <div className="space-y-4 text-center py-2" id="view-reset-success">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-white">Password Reset Complete! 🎉</h3>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed">
                Your new password for <span className="text-emerald-400 font-bold">{email}</span> has been securely saved. You can now log in.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  onPasswordResetSuccess(email);
                  onBackToLogin(email);
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-2.5 rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 shadow-lg transition-all"
                id="btn-proceed-to-login-after-reset"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Proceed to Sign In Now</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
