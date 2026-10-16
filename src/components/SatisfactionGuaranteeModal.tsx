import React from "react";
import { 
  X, ShieldCheck, CheckCircle2, RotateCcw, HeartHandshake, 
  Mail, CreditCard, Lock, Sparkles, Check 
} from "lucide-react";

interface SatisfactionGuaranteeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCheckout?: () => void;
}

export default function SatisfactionGuaranteeModal({ 
  isOpen, 
  onClose,
  onOpenCheckout 
}: SatisfactionGuaranteeModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="bg-slate-900 border border-slate-700/80 text-slate-100 rounded-3xl max-w-lg w-full p-6 md:p-8 space-y-6 shadow-2xl relative animate-scale-up my-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
          title="Close Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Risk-Free Touring
            </span>
            <h3 className="text-xl font-black text-white tracking-tight mt-1.5">
              100% DIY Artist Satisfaction Guarantee
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
              We stand behind our musician directory. If GigLizard doesn't help your touring plans, we'll refund every penny.
            </p>
          </div>
        </div>

        {/* Guarantee Points */}
        <div className="space-y-3 text-xs">
          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200">7-Day Full Money-Back Refund</p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                If you purchase the 30-Day Band Directory Pass ($9.99) and are unable to find active co-bill acts or suitable booking contacts for your tour corridor, simply email us within 7 days for an immediate 100% refund.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Zero Recurring Auto-Billing Traps</p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                Unlike corporate music platforms, our 30-day pass is a flat, one-time purchase. We will NEVER quietly charge your credit card next month. You only renew when you are actively preparing another tour.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <HeartHandshake className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-slate-200">Human Musician Support (&lt;4h Reply)</p>
              <p className="text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                When you email <strong className="text-white">giglizard.us@gmail.com</strong>, you speak with actual working musicians who maintain the database, not an automated bot.
              </p>
            </div>
          </div>
        </div>

        {/* Security & Payment Badges */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Stripe & PayPal Verified Security
          </span>
          <span className="text-slate-400">256-Bit SSL Encrypted</span>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            Got It
          </button>
          {onOpenCheckout && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCheckout();
              }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-md"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Unlock 30-Day Pass ($9.99)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
