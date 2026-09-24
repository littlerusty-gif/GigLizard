import React, { useState, useEffect } from "react";
import { Review, ReviewAuthorRole, UserAccount } from "../types";
import { 
  getReviewsForTarget, 
  getRatingStats, 
  addReview 
} from "../utils/reviewsManager";
import RatingStars from "./RatingStars";
import { 
  X, Star, MessageSquare, PlusCircle, CheckCircle2, ShieldCheck, 
  Sparkles, ThumbsUp, Tag, Filter, UserCheck, Calendar, Music, Building 
} from "lucide-react";

interface ReviewsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetType: "band" | "venue";
  targetSubtitle?: string;
  currentAccount?: UserAccount | null;
}

const VENUE_TAG_OPTIONS = [
  "Great House Sound",
  "Generous Hospitality",
  "Easy Stage Load-in",
  "Professional Booking Staff",
  "Engaged Crowd",
  "Pro Lighting Rig",
  "Clean Dressing Room",
  "Helpful Audio Tech",
  "Accurate Soundcheck"
];

const BAND_TAG_OPTIONS = [
  "Great Crowd Draw",
  "Tight Live Set",
  "Pro Touring Gear",
  "Easy Communication",
  "Punctual Line Check",
  "High Energy",
  "Heavy Show Promotion",
  "Accurate Tech Rider",
  "Great Co-Bill Partner"
];

export const ReviewsModal: React.FC<ReviewsModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetType,
  targetSubtitle,
  currentAccount
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [successToast, setSuccessToast] = useState("");
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | "all">("all");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  // Form State
  const [formRating, setFormRating] = useState<number>(5);
  const [formAuthorName, setFormAuthorName] = useState(currentAccount?.name || "");
  const [formAuthorRole, setFormAuthorRole] = useState<ReviewAuthorRole>(
    currentAccount?.type === "Venue" ? "Venue Owner / Bookkeeper" : "Touring Musician"
  );
  const [formComment, setFormComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [formRecommended, setFormRecommended] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    const list = getReviewsForTarget(targetId, targetName, targetType);
    setReviews(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      setShowAddForm(false);
      setSuccessToast("");
      if (currentAccount?.name && !formAuthorName) {
        setFormAuthorName(currentAccount.name);
      }
    }
  }, [isOpen, targetId, targetName, targetType, currentAccount]);

  // Listen for background updates
  useEffect(() => {
    const handleUpdate = () => {
      loadData();
    };
    window.addEventListener("giglizard_reviews_updated", handleUpdate);
    return () => window.removeEventListener("giglizard_reviews_updated", handleUpdate);
  }, [targetId, targetName, targetType]);

  if (!isOpen) return null;

  const stats = getRatingStats(targetId, targetName, targetType);
  const availableTags = targetType === "venue" ? VENUE_TAG_OPTIONS : BAND_TAG_OPTIONS;

  // Filter & sort
  const filteredReviews = reviews
    .filter(r => {
      if (selectedStarFilter === "all") return true;
      return Math.round(r.rating) === selectedStarFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "highest") {
        return b.rating - a.rating;
      }
      return a.rating - b.rating;
    });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAuthorName.trim()) {
      alert("Please enter your name or artist / venue alias.");
      return;
    }
    if (!formComment.trim()) {
      alert("Please share a brief note or review of your experience.");
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      const created = addReview({
        targetId,
        targetName,
        targetType,
        rating: formRating,
        authorName: formAuthorName.trim(),
        authorRole: formAuthorRole,
        comment: formComment.trim(),
        tags: selectedTags,
        recommended: formRecommended
      });

      setIsSubmitting(false);
      setShowAddForm(false);
      setSuccessToast(`Thank you! Your ${formRating}-star rating for "${targetName}" has been published.`);
      setFormComment("");
      setSelectedTags([]);
      loadData();

      setTimeout(() => setSuccessToast(""), 5000);
    }, 250);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      id="reviews-modal-overlay"
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-150"
        id="reviews-modal-container"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl text-white ${targetType === "venue" ? "bg-indigo-600" : "bg-emerald-600"}`}>
              {targetType === "venue" ? <Building className="w-5 h-5" /> : <Music className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  {targetName}
                </h2>
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                  targetType === "venue" ? "bg-indigo-900 text-indigo-200 border border-indigo-700" : "bg-emerald-900 text-emerald-200 border border-emerald-700"
                }`}>
                  {targetType === "venue" ? "Venue Rating & Reviews" : "Band Rating & Reviews"}
                </span>
              </div>
              {targetSubtitle && (
                <p className="text-xs text-slate-300 mt-0.5">
                  {targetSubtitle}
                </p>
              )}
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            id="btn-close-reviews-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">

          {/* Success Banner */}
          {successToast && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Rating Summary Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-6" id="rating-summary-card">
            
            {/* Left: Big Score */}
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="flex flex-col items-center md:items-start">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900 font-mono tracking-tight">
                    {stats.average.toFixed(1)}
                  </span>
                  <span className="text-sm font-bold text-slate-400">/ 5.0</span>
                </div>
                <RatingStars rating={stats.average} size="md" className="mt-1" />
                <span className="text-xs font-semibold text-slate-500 mt-1">
                  Based on <strong>{stats.count}</strong> community {stats.count === 1 ? "review" : "reviews"}
                </span>
              </div>
            </div>

            {/* Middle: Star breakdown bars */}
            <div className="w-full md:w-56 space-y-1.5 text-xs">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars] || 0;
                const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center gap-2 text-slate-600">
                    <span className="font-bold w-6 text-right font-mono">{stars}★</span>
                    <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 w-5 text-left font-mono">{count}</span>
                  </div>
                );
              })}
            </div>

            {/* Right: CTA to Rate */}
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(!showAddForm)}
                className="py-2.5 px-5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 active:scale-98"
                id="btn-toggle-add-review"
              >
                <Star className="w-4 h-4 fill-slate-950" />
                {showAddForm ? "Cancel Review" : `Rate ${targetType === "venue" ? "This Venue" : "This Band"}`}
              </button>
              <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Verified gig feedback
              </span>
            </div>
          </div>

          {/* Form: Add Rating & Review */}
          {showAddForm && (
            <div className="bg-white border-2 border-indigo-500/30 rounded-2xl p-5 shadow-lg space-y-4 animate-in slide-in-from-top-4 duration-200" id="add-review-form-container">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Write a 5-Star Rating & Review
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Share your gig experience, acoustics, crowd response, or booking communication with fellow artists.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
                
                {/* 1-5 Star Picker */}
                <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200/80 space-y-1.5">
                  <label className="block text-slate-800 font-bold">
                    Select Your Rating <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <RatingStars 
                      rating={formRating} 
                      interactive={true} 
                      onRatingChange={(newVal) => setFormRating(newVal)} 
                      size="lg"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Your Name */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Your Name / Band / Stage Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="E.g., Maya Lin / The Lunar Reverberator"
                      value={formAuthorName}
                      onChange={(e) => setFormAuthorName(e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  {/* Your Role */}
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">
                      Your Role in the Scene <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={formAuthorRole}
                      onChange={(e) => setFormAuthorRole(e.target.value as ReviewAuthorRole)}
                      className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="Touring Musician">Touring Musician</option>
                      <option value="Local Artist">Local Artist</option>
                      <option value="Venue Owner / Bookkeeper">Venue Owner / Bookkeeper</option>
                      <option value="Sound Engineer">Sound Engineer / Audio Tech</option>
                      <option value="Concertgoer / Fan">Concertgoer / Fan</option>
                      <option value="Tour Manager">Tour Manager / Booking Agent</option>
                    </select>
                  </div>
                </div>

                {/* Quick Feedback Tags */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5 flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    Quick Highlight Tags <span className="text-slate-400 font-normal">(Click to select)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                              : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Review comment */}
                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Review & Feedback <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder={
                      targetType === "venue"
                        ? "Describe the stage, monitors, load-in access, staff communication, hospitality, and crowd energy..."
                        : "Describe the band's live performance, crowd draw, stage etiquette, gear professionalism, and co-bill communication..."
                    }
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>

                {/* Recommendation checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={formRecommended}
                      onChange={(e) => setFormRecommended(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                    />
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-600" />
                    <span>I recommend {targetName} to other bands and venues</span>
                  </label>
                </div>

                {/* Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2 px-4 text-slate-600 hover:text-slate-900 font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="py-2 px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? "Publishing Review..." : "Publish Review"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-600 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" /> Filter:
              </span>
              <div className="flex gap-1">
                {(["all", 5, 4, 3, 2, 1] as const).map((filterVal) => (
                  <button
                    key={String(filterVal)}
                    type="button"
                    onClick={() => setSelectedStarFilter(filterVal)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      selectedStarFilter === filterVal
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    {filterVal === "all" ? "All Stars" : `${filterVal}★`}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="p-1 border border-slate-200 rounded-md bg-white text-[11px] font-semibold text-slate-700"
              >
                <option value="newest">Newest First</option>
                <option value="highest">Highest Rating</option>
                <option value="lowest">Lowest Rating</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-3 pt-1" id="reviews-list-container">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rev) => (
                <div 
                  key={rev.id} 
                  className="bg-white border border-slate-100 rounded-xl p-4 shadow-2xs space-y-2.5 transition-all hover:border-slate-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-black text-xs flex items-center justify-center flex-shrink-0">
                        {rev.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-slate-900 text-xs">
                            {rev.authorName}
                          </h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                            <UserCheck className="w-2.5 h-2.5 text-indigo-600" />
                            {rev.authorRole}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <RatingStars rating={rev.rating} size="xs" />
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(rev.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {rev.recommended && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 flex-shrink-0">
                        <ThumbsUp className="w-2.5 h-2.5 text-emerald-600" /> Recommends
                      </span>
                    )}
                  </div>

                  {/* Comment */}
                  <p className="text-xs text-slate-700 leading-relaxed pl-1">
                    "{rev.comment}"
                  </p>

                  {/* Tags */}
                  {rev.tags && rev.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-slate-50">
                      {rev.tags.map(tag => (
                        <span 
                          key={tag} 
                          className="bg-indigo-50 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 text-center text-slate-400 text-xs space-y-2">
                <MessageSquare className="w-6 h-6 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-600">
                  {selectedStarFilter !== "all" 
                    ? `No ${selectedStarFilter}-star reviews yet for this filter.` 
                    : `No reviews found for ${targetName}.`}
                </p>
                <p className="text-[11px] text-slate-400">
                  Be the first musician or promoter to share a rating and review!
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="mt-2 py-1.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Leave First 5-Star Rating
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px] flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Protected Community Reviews & Ratings Engine
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReviewsModal;
