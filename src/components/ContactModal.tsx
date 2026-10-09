import React, { useState, useEffect } from "react";
import { 
  Mail, Send, X, CheckCircle2, Copy, Check, 
  ExternalLink, MessageSquare, AlertCircle
} from "lucide-react";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
}

const SUPPORT_EMAIL = "giglizard.us@gmail.com";

const TOPIC_PRESETS = [
  "General Inquiry",
  "Venue Directory Update",
  "Band Profile & EPK",
  "Tour Scheduler Support",
  "Bug Report & Feedback",
  "Partnership & Sponsorship"
];

export default function ContactModal({
  isOpen,
  onClose,
  defaultEmail = "",
  defaultName = ""
}: ContactModalProps) {
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [topic, setTopic] = useState(TOPIC_PRESETS[0]);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedBody, setCopiedBody] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync defaults when opened
  useEffect(() => {
    if (isOpen) {
      if (defaultEmail && !email) setEmail(defaultEmail);
      if (defaultName && !name) setName(defaultName);
      setError(null);
    }
  }, [isOpen, defaultEmail, defaultName]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopySupportEmail = () => {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const getFullSubject = () => {
    const custom = subject.trim();
    if (custom) return `[${topic}] ${custom}`;
    return `[${topic}] Message from ${name.trim() || "GigLizard User"}`;
  };

  const getFullBody = () => {
    return [
      `Name: ${name.trim() || "Not provided"}`,
      `Sender Email: ${email.trim() || "Not provided"}`,
      `Category: ${topic}`,
      "",
      "--- Message ---",
      message.trim(),
      "",
      `Sent via GigLizard Web Application (${window.location.origin})`
    ].join("\n");
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(getFullBody());
    setCopiedBody(true);
    setTimeout(() => setCopiedBody(false), 2000);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please write a message before sending.");
      return;
    }

    setError(null);
    const finalSubject = getFullSubject();
    const finalBody = getFullBody();

    // Trigger standard mailto protocol
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    
    try {
      const link = document.createElement("a");
      link.href = mailtoUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.location.href = mailtoUrl;
    }

    setSubmitted(true);
  };

  const handleOpenGmailWeb = () => {
    const finalSubject = getFullSubject();
    const finalBody = getFullBody();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SUPPORT_EMAIL)}&su=${encodeURIComponent(finalSubject)}&body=${encodeURIComponent(finalBody)}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const handleReset = () => {
    setSubmitted(false);
    setMessage("");
    setSubject("");
    setError(null);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-scale-up max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <Mail className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 id="contact-modal-title" className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Contact GigLizard</span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct communication with the team
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close contact dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Recipient Banner */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-slate-400 font-medium shrink-0">Send to:</span>
            <span className="font-mono text-indigo-300 font-semibold truncate select-all">{SUPPORT_EMAIL}</span>
          </div>
          <button
            type="button"
            onClick={handleCopySupportEmail}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-medium transition-colors"
            title="Copy email address to clipboard"
          >
            {copiedEmail ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {submitted ? (
          /* Submission State */
          <div className="space-y-4 py-2">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <h4 className="text-sm font-bold text-emerald-300">Message Prepared!</h4>
              <p className="text-xs text-slate-300 leading-relaxed max-w-sm mx-auto">
                We triggered your system email app to deliver this message directly to <strong className="text-white">{SUPPORT_EMAIL}</strong>.
              </p>
            </div>

            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-3.5 space-y-2.5 text-xs text-slate-300">
              <p className="font-semibold text-slate-200">Didn't see your email client open?</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenGmailWeb}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Gmail Web</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
                >
                  {copiedBody ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Message Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Full Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
              >
                Send another message
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* Contact Form */
          <form onSubmit={handleSend} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Topic Chips */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Category
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TOPIC_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                      topic === t
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr Hadit"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-300">
                  Your Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-300">
                Subject <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            {/* Message Body */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  Message <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {message.length} chars
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                required
                placeholder="How can we help? Detail your venue booking, band profile update, or question..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none transition-colors resize-none leading-relaxed"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Response time usually within 24-48 hrs</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
                  id="btn-send-contact-message"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
