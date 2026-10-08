import React, { useState, useEffect } from "react";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, KeyRound, ShieldCheck, ArrowRight, X } from "lucide-react";
import { supabase } from "../lib/supabase";
import { sanitizeInputText } from "../utils/antiScrape";

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLoginRedirect: () => void;
}

export default function ResetPasswordModal({
  isOpen,
  onClose,
  onSuccessLoginRedirect
}: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNewPassword("");
      setConfirmPassword("");
      setErrorMessage("");
      setSuccessMessage("");
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const cleanNewPassword = sanitizeInputText(newPassword, 100);
    const cleanConfirmPassword = sanitizeInputText(confirmPassword, 100);

    if (cleanNewPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    if (cleanNewPassword !== cleanConfirmPassword) {
      setErrorMessage("Passwords do not match. Please verify and try again.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: cleanNewPassword
      });

      if (error) {
        setErrorMessage(error.message || "Unable to update password. Your reset link may have expired.");
        setIsLoading(false);
        return;
      }

      // Sync local passwords fallback cache if user session contains email
      const userEmail = data?.user?.email;
      if (userEmail) {
        try {
          const passwordsMap = JSON.parse(localStorage.getItem("user_custom_passwords_v1") || "{}");
          passwordsMap[userEmail.toLowerCase()] = cleanNewPassword;
          localStorage.setItem("user_custom_passwords_v1", JSON.stringify(passwordsMap));
        } catch (_) {}
      }

      setIsSuccess(true);
      setSuccessMessage("Password successfully updated! You can now log in.");

      // Clear the reset URL hash
      if (
        window.location.hash.includes("reset-password") || 
        window.location.hash.includes("type=recovery") || 
        window.location.hash.includes("access_token")
      ) {
        window.location.hash = "";
        try {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        } catch (_) {}
      }

      // Auto redirect after 2.2 seconds or user can click button
      setTimeout(() => {
        onSuccessLoginRedirect();
      }, 2200);
    } catch (err: any) {
      setErrorMessage(err?.message || "An unexpected error occurred while resetting password.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      id="reset-password-modal-overlay"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-md w-full p-6 md:p-7 space-y-5 shadow-2xl relative animate-scale-up text-white"
        onClick={(e) => e.stopPropagation()}
        id="reset-password-modal-content"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center mx-auto shadow-inner">
            <KeyRound className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-white tracking-tight">
            Enter New Password
          </h3>
          <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
            Your identity was verified via your secure recovery link. Choose a new password of at least 8 characters.
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isSuccess ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-2xl space-y-3 text-center animate-fade-in">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <p className="text-xs text-emerald-200 font-bold leading-relaxed">
              {successMessage}
            </p>
            <p className="text-[11px] text-slate-400">
              Redirecting to login modal...
            </p>
            <button
              type="button"
              onClick={onSuccessLoginRedirect}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              <span>Proceed to Log In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  New Password *
                </label>
                <span className="text-[10px] text-indigo-400 font-semibold">Min 8 characters</span>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Enter at least 8 characters"
                  required
                  minLength={8}
                  className="w-full p-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setErrorMessage("");
                  }}
                  placeholder="Re-enter new password"
                  required
                  minLength={8}
                  className="w-full p-2.5 pr-10 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-slate-400" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save New Password</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
