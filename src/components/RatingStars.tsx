import React, { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  rating: number; // 1 to 5
  maxStars?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  size?: "xs" | "sm" | "md" | "lg";
  showNumber?: boolean;
  reviewCount?: number;
  className?: string;
  onClickReviewBadge?: () => void;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  rating,
  maxStars = 5,
  interactive = false,
  onRatingChange,
  size = "sm",
  showNumber = false,
  reviewCount,
  className = "",
  onClickReviewBadge
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const starSizeClasses = {
    xs: "w-3 h-3",
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-6 h-6"
  };

  const currentVal = hoverRating !== null ? hoverRating : rating;

  const starDescriptions: { [key: number]: string } = {
    1: "1 Star - Needs Improvement",
    2: "2 Stars - Fair / Okay",
    3: "3 Stars - Good & Reliable",
    4: "4 Stars - Great Experience",
    5: "5 Stars - Outstanding & Highly Recommended!"
  };

  return (
    <div className={`inline-flex items-center gap-1.5 ${className}`}>
      <div 
        className="flex items-center gap-0.5" 
        onMouseLeave={() => interactive && setHoverRating(null)}
      >
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starNum = idx + 1;
          const isFilled = currentVal >= starNum;
          const isHalf = !isFilled && currentVal >= starNum - 0.5;

          return (
            <button
              key={idx}
              type="button"
              disabled={!interactive}
              onClick={() => interactive && onRatingChange && onRatingChange(starNum)}
              onMouseEnter={() => interactive && setHoverRating(starNum)}
              className={`${
                interactive 
                  ? "cursor-pointer transition-transform hover:scale-115 focus:outline-none p-0.5" 
                  : "cursor-default p-0"
              }`}
              title={interactive ? starDescriptions[starNum] : `${rating} out of 5 stars`}
              aria-label={`${starNum} stars`}
            >
              <Star
                className={`${starSizeClasses[size]} ${
                  isFilled
                    ? "text-amber-400 fill-amber-400"
                    : isHalf
                    ? "text-amber-400 fill-amber-400/50"
                    : "text-slate-300 fill-transparent"
                } transition-colors`}
              />
            </button>
          );
        })}
      </div>

      {showNumber && (
        <span 
          onClick={onClickReviewBadge}
          className={`text-xs font-black text-slate-800 flex items-center gap-1 ${
            onClickReviewBadge ? "cursor-pointer hover:text-indigo-600 transition-colors" : ""
          }`}
        >
          <span>{rating.toFixed(1)}</span>
          {typeof reviewCount === "number" && (
            <span className="text-slate-400 font-semibold text-[11px]">
              ({reviewCount})
            </span>
          )}
        </span>
      )}

      {interactive && hoverRating !== null && (
        <span className="text-[11px] font-bold text-amber-600 ml-1.5 animate-in fade-in duration-100">
          {starDescriptions[hoverRating]}
        </span>
      )}
    </div>
  );
};

export default RatingStars;
