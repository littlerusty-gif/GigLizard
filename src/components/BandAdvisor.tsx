import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, MessageSquare, BookOpen, RefreshCw, AlertCircle, Trash2, Mic2 } from "lucide-react";

interface BandAdvisorProps {
  bandProfile: {
    name: string;
    genre: string;
    city: string;
    vibe: string;
  };
}

interface Message {
  role: "user" | "model" | "assistant";
  content: string;
}

const PRESET_PROMPTS = [
  "Draft a booking pitch email to an indie venue booker",
  "How do I explain my monitor mixes to tough sound engineers?",
  "What are some creative ways to market our first DIY show?",
  "How do we structure a 45-minute energetic tour setlist?"
];

export default function BandAdvisor({ bandProfile }: BandAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi there! I'm Elvis, your expert booking and tech planner consultant. Feel free to ask me to draft pitch emails, social media posts, build promotion schedules, write setlists, or explain technical stages setups. How can I help your band today?"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = { role: "user", content: textToSend };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputVal("");
    setLoading(true);

    try {
      const response = await fetch("/api/band-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role === "assistant" ? "model" : m.role,
            content: m.content
          })),
          bandProfile
        }),
      });

      if (!response.ok) {
        throw new Error("Advisor backend responded with status " + response.status);
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ **System Communication Issue:** Unable to communicate with the backseat agent. Please ensure you have configured your **GEMINI_API_KEY** secret inside the application dashboard."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        role: "assistant",
        content: `Hey! I've loaded your updated profile settings for the band **${bandProfile.name || "Unnamed Band"}** (${bandProfile.genre || "Genre unlisted"}). Ask me for email flyers, publicity drafts, or tour marketing plans!`
      }
    ]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" id="band-advisor-panel">
      {/* Sidebar Profile Settings */}
      <div className="lg:col-span-1 bg-white border border-gray-100 rounded-xl p-5 space-y-4 flex flex-col justify-between" id="advisor-band-profile">
        <div className="space-y-4" id="adv-settings-top">
          <div id="adv-sidebar-label">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Mic2 className="w-4 h-4 text-indigo-500" />
              Band Planner Profile
            </h4>
            <p className="text-[10px] text-gray-500 mt-1" id="adv-sidebar-desc">
              Your profile values are synced directly with the BackstageAdvisor's brainstorm responses.
            </p>
          </div>

          <div className="space-y-3" id="advisor-profile-inputs">
            <div id="adv-profile-name">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Band Title</span>
              <div className="font-bold text-xs text-slate-800 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {bandProfile.name || "Dr Hadit"}
              </div>
            </div>

            <div id="adv-profile-genre">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Genre Vibe</span>
              <div className="font-medium text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200 uppercase tracking-tight">
                {bandProfile.genre || "Shoegaze Punk / Rock"}
              </div>
            </div>

            <div id="adv-profile-location">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Hometown City</span>
              <div className="font-medium text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                {bandProfile.city || "Seattle, WA"}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          id="btn-advisor-clear-chat"
          onClick={handleClearChat}
          className="w-full text-slate-500 hover:text-slate-800 hover:bg-slate-50 text-xs py-2 px-3 rounded-lg border border-slate-200 font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-4"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset Chat History
        </button>
      </div>

      {/* Main advisor chat area */}
      <div className="lg:col-span-3 flex flex-col h-[520px] bg-white border border-gray-100 rounded-xl shadow-xs overflow-hidden" id="advisor-chat-window">
        {/* Chat headers */}
        <div className="bg-slate-50/70 py-3.5 px-5 border-b border-gray-100 flex items-center justify-between" id="chat-header">
          <div className="flex items-center gap-2" id="chat-header-title">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" id="dot-online" />
            <span className="text-xs font-bold text-slate-800">BackstageAdvisor AI Agent</span>
          </div>

          <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded tracking-wide uppercase" id="ai-powered-label">
            Powered by Gemini
          </span>
        </div>

        {/* Quick Helper Presets Bar */}
        <div className="bg-white border-b border-slate-50 p-3 flex flex-wrap gap-1.5 overflow-x-auto select-none" id="advisor-prep-bar">
          {PRESET_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              id={`btn-adv-preset-${prompt.replace(/\s+/g, "-")}`}
              onClick={() => handleSendMessage(prompt)}
              className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap"
            >
              💬 {prompt}
            </button>
          ))}
        </div>

        {/* Messaging Logs container */}
        <div className="flex-grow p-5 overflow-y-auto space-y-4" id="chat-logs-area">
          {messages.map((m, i) => {
            const isUser = m.role === "user";
            return (
              <div
                key={i}
                id={`chat-bubble-${m.role}-${i}`}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    isUser
                      ? "bg-slate-900 text-white rounded-br-none font-medium ml-10 shadow-xs"
                      : "bg-slate-100 text-slate-800 rounded-bl-none mr-10 border border-slate-200/50"
                  }`}
                  style={{ whiteSpace: "pre-wrap" }}
                  id={`bubble-text-${m.role}-${i}`}
                >
                  {!isUser && i === 0 ? (
                    <span id="welcome-ad">{m.content}</span>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start" id="advisor-typing-state">
              <div className="bg-slate-100 border border-slate-200/50 rounded-2xl px-4 py-2 text-xs text-slate-505 flex items-center gap-1.5" id="typing-indicator">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Elvis is planning options...
              </div>
            </div>
          )}
          <div ref={scrollRef} id="chat-scroll-anchor" />
        </div>

        {/* Chat input block */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputVal);
          }}
          className="p-3 border-t border-gray-100 bg-slate-50/50 flex gap-2"
          id="advisor-chat-form"
        >
          <input
            type="text"
            id="chat-advisor-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="E.g., How do we draft a hospitality checklist? Or show flyer marketing captions..."
            className="flex-grow text-xs p-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            type="submit"
            id="btn-submit-advisor-chat"
            disabled={!inputVal.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-750 text-white p-3 rounded-xl transition-all font-bold flex-shrink-0 cursor-pointer disabled:bg-slate-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
