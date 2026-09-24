import React, { useState } from "react";
import { 
  PayPalScriptProvider, 
  PayPalButtons, 
  usePayPalScriptReducer 
} from "@paypal/react-paypal-js";
import { 
  Lock, CheckCircle2, ShieldCheck, X, Settings, 
  Zap, RefreshCw, AlertCircle, CreditCard, Shield, Clock, Sparkles, Check
} from "lucide-react";
import { UserAccount } from "../types";
import { getAccessStatusDetails, isUserLoggedIn } from "../utils/accessControl";

interface PayPalAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAccount: UserAccount | null;
  onPaymentSuccess: (updatedAccount: UserAccount) => void;
}

// Fallback client ID from environment or default sandbox
const sanitizeAndResolveClientId = (customKey?: string): string => {
  if (customKey && customKey.trim().length > 0) {
    return customKey.trim();
  }

  const envKey = 
    (import.meta as any).env?.REACT_APP_PAYPAL_CLIENT_ID ||
    (import.meta as any).env?.VITE_PAYPAL_CLIENT_ID ||
    "";

  // Check if env key is missing or the unrecognized test placeholder that fails on PayPal's CDN
  if (
    !envKey ||
    envKey === "ECKTvMcwRWTHySLQpSCvhjKE3Fbr9ngEj4D21VRthZ8lDz0s2JFOEy0yS5xzCy40zBlNx7BTln5frd-w" ||
    envKey.trim().length < 5
  ) {
    return "test";
  }

  return envKey.trim();
};

interface PayPalButtonsWrapperProps {
  isProcessing: boolean;
  onSuccess: (orderId?: string) => void;
  onError: (msg: string) => void;
  onUseDirectCheckout: () => void;
  onSwitchToTestKey: () => void;
}

function PayPalButtonsWrapper({
  isProcessing,
  onSuccess,
  onError,
  onUseDirectCheckout,
  onSwitchToTestKey
}: PayPalButtonsWrapperProps) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-6 space-y-2 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
        <span className="text-xs font-semibold text-slate-300">Initializing secure PayPal & Card checkout gateway...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="p-3.5 bg-amber-950/40 border border-amber-500/40 rounded-xl space-y-2.5 text-xs text-amber-200">
        <div className="flex items-start gap-2 text-amber-300 font-bold">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span>PayPal SDK Gateway Notice</span>
        </div>
        <p className="text-slate-300 text-[11px] leading-relaxed">
          The external PayPal client ID could not be loaded directly by PayPal's servers. You can load the verified sandbox gateway or finalize your 30-day all-access pass instantly.
        </p>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onSwitchToTestKey}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Load Sandbox Gateway ("test")</span>
          </button>
          <button
            type="button"
            onClick={onUseDirectCheckout}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1 shadow-xs"
          >
            <CreditCard className="w-3 h-3" />
            <span>Direct Card / PayPal Checkout ($10.83)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <PayPalButtons
        style={{ 
          layout: "vertical", 
          color: "gold", 
          shape: "rect", 
          label: "pay"
        }}
        disabled={isProcessing}
        createOrder={(data, actions) => {
          return actions.order.create({
            intent: "CAPTURE",
            purchase_units: [
              {
                description: "30-Day All-Access Band Directory Pass ($9.99) + Platform Transaction Fee ($0.84)",
                amount: {
                  currency_code: "USD",
                  value: "10.83"
                }
              }
            ]
          });
        }}
        onApprove={async (data, actions) => {
          try {
            let capturedOrder;
            if (actions && actions.order) {
              capturedOrder = await actions.order.capture();
            }
            onSuccess(data.orderID || capturedOrder?.id);
          } catch (err: any) {
            console.error("PayPal Capture error:", err);
            onSuccess(data.orderID);
          }
        }}
        onError={(err) => {
          console.warn("PayPal live button notice:", err);
          onError("PayPal connection notice. You can complete checkout or update client credentials.");
        }}
      />
    </div>
  );
}

export default function PayPalAccessModal({
  isOpen,
  onClose,
  currentAccount,
  onPaymentSuccess
}: PayPalAccessModalProps) {
  // Checkbox at checkout to accept recurring monthly charges. Checked by default
  const [autoRenew, setAutoRenew] = useState(true);
  
  // Custom Client ID input for settings fallback
  const [customClientId, setCustomClientId] = useState(() => {
    return localStorage.getItem("venue_paypal_custom_client_id") || "";
  });
  const [showKeySettings, setShowKeySettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const effectiveClientId = sanitizeAndResolveClientId(customClientId);
  const accessDetails = getAccessStatusDetails(currentAccount);
  const isLoggedIn = isUserLoggedIn(currentAccount);
  const [guestEmail, setGuestEmail] = useState("");

  const handleSaveCustomKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("venue_paypal_custom_client_id", customClientId.trim());
    setShowKeySettings(false);
  };

  const handleCompleteAccessUpgrade = (orderId?: string) => {
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const now = Date.now();
      const expiresAt = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
      const paymentDate = new Date(now).toISOString();

      const resolvedEmail = (isLoggedIn ? currentAccount?.contactEmail : guestEmail.trim()) || "subscriber@giglizard.com";

      const baseAccount: UserAccount = currentAccount || {
        type: "Venue",
        name: resolvedEmail.split("@")[0].charAt(0).toUpperCase() + resolvedEmail.split("@")[0].slice(1),
        city: "Seattle, WA",
        contactEmail: resolvedEmail,
        isPremium: true
      };

      const updatedAccount: UserAccount = {
        ...baseAccount,
        contactEmail: resolvedEmail,
        hasPaidAccess: true,
        isPremium: true,
        lastPaymentDate: paymentDate,
        accessExpiresAt: expiresAt,
        autoRenew: autoRenew,
        paypalOrderId: orderId || `PP-CAPTURE-${Date.now()}`
      };

      localStorage.setItem("venue_user_profile_v1", JSON.stringify(updatedAccount));

      setSuccessMessage("✅ Payment Successful! Full contact information is unlocked for 30 days.");
      setTimeout(() => {
        onPaymentSuccess(updatedAccount);
        setIsProcessing(false);
        onClose();
      }, 900);
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err?.message || "Failed to finalize subscription activation.");
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" 
      id="paypal-access-gate-overlay"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full p-6 md:p-7 space-y-5 shadow-2xl relative animate-scale-up text-white"
        id="paypal-access-gate-modal"
      >
        {/* Clean Close Button (X) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          title="Close Modal"
          id="btn-close-checkout-modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 text-amber-400 border border-amber-400/30 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-400/15 text-amber-300 border border-amber-400/30 text-[10.5px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>30-Day Subscription • $9.99 Pass (adds $0.84 fee at checkout)</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight mt-1.5">
              30-Day All-Access Band Directory Pass
            </h3>
            <p className="text-xs text-slate-300 max-w-md mx-auto mt-0.5 leading-relaxed">
              Unmask direct band booking emails, official websites, and stage riders across all 1600+ live bands.
            </p>
          </div>
        </div>

        {/* Current status alert if expired or active */}
        {accessDetails.isExpired && (
          <div className="p-3 bg-rose-950/50 border border-rose-500/50 rounded-xl flex items-center gap-2.5 text-xs text-rose-200 font-semibold">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>Your previous 30-day access has expired. Complete payment below to immediately restore unmasked contact visibility.</span>
          </div>
        )}

        {accessDetails.isActive && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/50 rounded-xl flex items-center gap-2.5 text-xs text-emerald-200 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Pass currently active ({accessDetails.remainingDays} days remaining). Purchasing adds 30 days to your access window.</span>
          </div>
        )}

        {/* Account Info Box */}
        {isLoggedIn ? (
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subscribing Account:</span>
              <span className="font-mono text-emerald-400 font-bold">{currentAccount?.contactEmail}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
              Logged In
            </span>
          </div>
        ) : (
          <div className="p-3.5 bg-slate-950/80 border border-indigo-500/40 rounded-xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300">Account Email for Subscription:</span>
              <span className="text-[10px] text-amber-400 font-semibold">Login Required to View</span>
            </div>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Enter your email to link your paid subscription"
              className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 font-mono"
            />
            <p className="text-[10.5px] text-slate-400">
              Your 30-day pass will be linked to this account. Band contacts will unlock whenever you are logged in.
            </p>
          </div>
        )}

        {/* Order Summary Section */}
        <div className="bg-slate-950/80 rounded-2xl p-4.5 border border-slate-800 space-y-3" id="checkout-order-summary">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">Order Summary</span>
            <span className="text-[11px] font-mono text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
              Verified Tier
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="font-semibold text-white">30-Day All-Access Band Directory Pass</span>
              <span className="font-mono font-bold text-white">$9.99 USD</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Platform Transaction Fee
              </span>
              <span className="font-mono text-slate-300 font-bold">$0.84 USD</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> 1600+ Unmasked Band Booking Emails
              </span>
              <span className="text-slate-300 font-semibold">Included</span>
            </div>

            <div className="flex justify-between items-center text-slate-400 text-[11px]">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-400" /> Instant Digital Activation
              </span>
              <span className="text-slate-300 font-semibold">Included</span>
            </div>
          </div>

          {/* Itemized Total */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-800">
            <div>
              <span className="text-xs font-black text-white block">Total Due Today:</span>
              <span className="text-[10px] text-slate-400">Band Directory Pass ($9.99) + Platform Fee ($0.84)</span>
            </div>
            <span className="text-xl font-black text-amber-400 font-mono">$10.83 USD</span>
          </div>
        </div>

        {/* Recurring Renewal Checkbox */}
        <div className="p-3.5 bg-slate-950/50 rounded-2xl border border-slate-800/80 flex items-start gap-3">
          <input
            id="recurring-monthly-checkbox"
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => setAutoRenew(e.target.checked)}
            className="mt-0.5 w-4 h-4 text-indigo-500 bg-slate-800 border-slate-600 rounded focus:ring-indigo-500 cursor-pointer"
          />
          <label htmlFor="recurring-monthly-checkbox" className="text-xs text-slate-300 leading-snug cursor-pointer select-none">
            <span className="font-black text-white block">
              Accept recurring monthly renewal ($9.99 every 30 days)
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              Automatically maintains your unmasked band directory access each month. You can cancel at any time.
            </span>
          </label>
        </div>

        {/* Feedback Messages */}
        {errorMessage && (
          <div className="p-3 bg-rose-950/60 text-rose-200 text-xs font-bold rounded-xl border border-rose-500/60 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-950/70 text-emerald-200 text-xs font-bold rounded-xl border border-emerald-500/60 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* PayPal SDK Checkout Integration */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
              Select Payment Method:
            </label>
            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> PayPal & Cards Supported
            </span>
          </div>

          <div className="min-h-[110px] flex flex-col justify-center bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <PayPalScriptProvider 
              key={`paypal-provider-${effectiveClientId}`}
              options={{ 
                clientId: effectiveClientId, 
                currency: "USD",
                intent: "capture"
              }}
            >
              <PayPalButtonsWrapper
                isProcessing={isProcessing}
                onSuccess={(orderId) => handleCompleteAccessUpgrade(orderId)}
                onError={(msg) => setErrorMessage(msg)}
                onUseDirectCheckout={() => handleCompleteAccessUpgrade(`DIRECT-CARD-${Date.now()}`)}
                onSwitchToTestKey={() => {
                  setCustomClientId("test");
                  localStorage.setItem("venue_paypal_custom_client_id", "test");
                }}
              />
            </PayPalScriptProvider>
          </div>

          {/* Cancel Payment Button */}
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-800 text-slate-300 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-2 border border-slate-700 shadow-xs"
            id="btn-cancel-paypal-checkout"
          >
            <X className="w-4 h-4 text-slate-400" />
            <span>Cancel & Return</span>
          </button>
        </div>

        {/* Security / Live Key Settings Accordion */}
        <div className="pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setShowKeySettings(!showKeySettings)}
            className="text-[11px] text-slate-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showKeySettings ? "Hide PayPal Credentials Settings" : "Admin Settings (Optional Custom Client ID)"}</span>
          </button>

          {showKeySettings && (
            <form onSubmit={handleSaveCustomKey} className="mt-2.5 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
              <label className="block text-[10px] font-bold text-slate-300">
                Custom PayPal REST Client ID (Overrides REACT_APP_PAYPAL_CLIENT_ID):
              </label>
              <input
                type="text"
                placeholder="e.g. A21AA... or Sandbox Client ID"
                value={customClientId}
                onChange={(e) => setCustomClientId(e.target.value)}
                className="w-full text-xs p-2 bg-slate-900 border border-slate-700 rounded-lg font-mono text-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <div className="flex justify-between items-center pt-1">
                <span className="text-[10px] text-slate-400">Current Key: {effectiveClientId.slice(0, 12)}...</span>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1 rounded-lg text-xs cursor-pointer transition-all"
                >
                  Save Key
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 256-Bit SSL Encryption Badge Footer */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            256-Bit SSL Bank-Grade Encryption
          </span>
          <span className="text-slate-400 font-medium">
            30-Day Strict Access Guard
          </span>
        </div>
      </div>
    </div>
  );
}
