import { TourStop } from "../types";

export type AuditSeverity = "critical" | "warning" | "info";

export interface AuditIssue {
  id: string;
  stopIndex: number;
  stopCity: string;
  stopDate?: string;
  category: "venue" | "fatigue" | "lodging" | "contact" | "terms";
  severity: AuditSeverity;
  title: string;
  message: string;
  actionStep: 3 | 4 | 5;
  actionLabel: string;
}

export interface TourReadinessReport {
  score: number; // 0 - 100
  rating: "Flawless" | "Tour-Ready" | "Action Required" | "Critical Roadblocks";
  criticalIssuesCount: number;
  warningIssuesCount: number;
  totalStops: number;
  confirmedVenuesCount: number;
  penciledVenuesCount: number;
  unconfirmedVenuesCount: number;
  bookedLodgingCount: number;
  issues: AuditIssue[];
  summaryText: string;
}

/**
 * Parses drive time string like "3 hrs 45 mins", "5.2 hours", or "270 mins" into numeric minutes.
 */
function parseDriveTimeToMinutes(driveTime?: string): number {
  if (!driveTime) return 0;
  const str = driveTime.toLowerCase();

  let minutes = 0;
  const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:hr|hour)/);
  if (hoursMatch) {
    minutes += parseFloat(hoursMatch[1]) * 60;
  }

  const minsMatch = str.match(/(\d+)\s*(?:min|m)/);
  if (minsMatch && !hoursMatch) {
    minutes += parseInt(minsMatch[1], 10);
  } else if (minsMatch && hoursMatch) {
    minutes += parseInt(minsMatch[1], 10);
  }

  return minutes;
}

/**
 * Runs a pre-flight Tour Readiness Audit across all tour stops.
 */
export function runTourReadinessAudit(stops: TourStop[]): TourReadinessReport {
  const issues: AuditIssue[] = [];

  if (stops.length === 0) {
    return {
      score: 0,
      rating: "Critical Roadblocks",
      criticalIssuesCount: 1,
      warningIssuesCount: 0,
      totalStops: 0,
      confirmedVenuesCount: 0,
      penciledVenuesCount: 0,
      unconfirmedVenuesCount: 0,
      bookedLodgingCount: 0,
      issues: [
        {
          id: "no-stops",
          stopIndex: 0,
          stopCity: "Tour Route",
          category: "venue",
          severity: "critical",
          title: "No tour stops generated",
          message: "Generate a corridor route with at least one performance stop.",
          actionStep: 3,
          actionLabel: "Add Stops"
        }
      ],
      summaryText: "0% Tour-Ready: No corridor stops added."
    };
  }

  let confirmedVenuesCount = 0;
  let penciledVenuesCount = 0;
  let unconfirmedVenuesCount = 0;
  let bookedLodgingCount = 0;

  stops.forEach((stop, index) => {
    const venue = stop.selectedVenue;
    const vStatus = venue?.bookingStatus || (venue?.name ? "unconfirmed" : "unconfirmed");

    // 1. Check Venue Booking Status
    if (!venue?.name) {
      issues.push({
        id: `stop-${index}-no-venue`,
        stopIndex: index,
        stopCity: stop.city,
        stopDate: stop.date,
        category: "venue",
        severity: "critical",
        title: `Stop ${index + 1} (${stop.city}): Missing Venue Selection`,
        message: `No performance venue is locked in for ${stop.city}. Tour cannot proceed without a stage.`,
        actionStep: 3,
        actionLabel: "Select Venue"
      });
      unconfirmedVenuesCount++;
    } else if (vStatus === "unconfirmed") {
      issues.push({
        id: `stop-${index}-venue-unconfirmed`,
        stopIndex: index,
        stopCity: stop.city,
        stopDate: stop.date,
        category: "venue",
        severity: "critical",
        title: `Stop ${index + 1} (${stop.city}): Venue is Unconfirmed Lead`,
        message: `${venue.name} is saved as an unconfirmed lead. Confirm deal or mark as booked.`,
        actionStep: 3,
        actionLabel: "Confirm Venue"
      });
      unconfirmedVenuesCount++;
    } else if (vStatus === "penciled") {
      issues.push({
        id: `stop-${index}-venue-penciled`,
        stopIndex: index,
        stopCity: stop.city,
        stopDate: stop.date,
        category: "venue",
        severity: "warning",
        title: `Stop ${index + 1} (${stop.city}): Venue Penciled In (Hold Only)`,
        message: `${venue.name} is on hold / penciled in. Obtain final contract or deposit confirmation.`,
        actionStep: 3,
        actionLabel: "Review Venue"
      });
      penciledVenuesCount++;
    } else {
      confirmedVenuesCount++;
    }

    // 2. Check Driver Fatigue (> 4.5 hours drive time = 270 minutes)
    const driveMinutes = parseDriveTimeToMinutes(stop.driveTimeFromPrev);
    if (driveMinutes > 270) {
      const driveHours = (driveMinutes / 60).toFixed(1);
      issues.push({
        id: `stop-${index}-fatigue`,
        stopIndex: index,
        stopCity: stop.city,
        stopDate: stop.date,
        category: "fatigue",
        severity: "warning",
        title: `Stop ${index + 1} (${stop.city}): Fatigue Alert (${driveHours}h Drive)`,
        message: `Leg into ${stop.city} exceeds 4.5 hours continuous transit (${stop.driveTimeFromPrev}). Mandate a mid-route driver swap or rest break.`,
        actionStep: 3,
        actionLabel: "Check Route"
      });
    }

    // 3. Check Lodging Status
    const lodging = stop.selectedLodging;
    const isLodgingBooked = Boolean(lodging?.isBooked || lodging?.confirmationNumber);
    if (isLodgingBooked) {
      bookedLodgingCount++;
    } else {
      // Long distance or major stop without confirmed room
      issues.push({
        id: `stop-${index}-lodging-unbooked`,
        stopIndex: index,
        stopCity: stop.city,
        stopDate: stop.date,
        category: "lodging",
        severity: "warning",
        title: `Stop ${index + 1} (${stop.city}): Lodging Not Booked`,
        message: `Overnight accommodations for ${stop.city} are pending. Secure trailer-friendly hotel or campsite before departure.`,
        actionStep: 4,
        actionLabel: "Book Lodging"
      });
    }

    // 4. Check Venue Contact Dossier
    if (venue?.name) {
      const isHouseShow = Boolean(venue.isPrivate || venue.venueType === "house_show");
      const hasPhone = Boolean(venue.contactPhone?.trim() || venue.hostPhone?.trim());
      const hasEmail = Boolean(venue.contactEmail?.trim());

      if (!hasPhone && !hasEmail) {
        issues.push({
          id: `stop-${index}-missing-contact`,
          stopIndex: index,
          stopCity: stop.city,
          stopDate: stop.date,
          category: "contact",
          severity: "warning",
          title: `Stop ${index + 1} (${stop.city}): Missing ${isHouseShow ? "Host Cell Phone" : "Venue Contact Phone/Email"}`,
          message: isHouseShow
            ? `${venue.name} has no host phone on file for arrival and load-in.`
            : `${venue.name} has no direct talent buyer or production contact on file for advance communications.`,
          actionStep: 3,
          actionLabel: isHouseShow ? "Add Host Cell" : "Add Contact"
        });
      }
    }

    // 5. Check Performance & Payout Terms
    if (venue?.name && (!venue.loadInTime || !venue.setTime)) {
      issues.push({
        id: `stop-${index}-missing-times`,
        stopIndex: index,
        stopCity: stop.city,
        stopDate: stop.date,
        category: "terms",
        severity: "info",
        title: `Stop ${index + 1} (${stop.city}): Day-of-Show Run Times Incomplete`,
        message: `Confirm load-in and set times with ${venue.name} for master itinerary dispatch.`,
        actionStep: 3,
        actionLabel: "Set Run Times"
      });
    }
  });

  const criticalIssuesCount = issues.filter(i => i.severity === "critical").length;
  const warningIssuesCount = issues.filter(i => i.severity === "warning").length;

  // Calculate score (100 base, -25 per critical, -8 per warning)
  let rawScore = 100 - (criticalIssuesCount * 25) - (warningIssuesCount * 8);
  if (rawScore < 10) rawScore = 10;
  if (stops.length > 0 && confirmedVenuesCount === stops.length && bookedLodgingCount === stops.length && criticalIssuesCount === 0 && warningIssuesCount === 0) {
    rawScore = 100;
  }
  const score = Math.min(100, Math.max(0, Math.round(rawScore)));

  let rating: TourReadinessReport["rating"] = "Tour-Ready";
  if (criticalIssuesCount > 0) {
    rating = "Critical Roadblocks";
  } else if (warningIssuesCount > 2) {
    rating = "Action Required";
  } else if (score >= 90) {
    rating = "Flawless";
  }

  const summaryText = `${score}% Tour-Ready: ${
    criticalIssuesCount > 0 ? `${criticalIssuesCount} Critical Blocker${criticalIssuesCount > 1 ? "s" : ""}, ` : ""
  }${warningIssuesCount > 0 ? `${warningIssuesCount} Advisory Warning${warningIssuesCount > 1 ? "s" : ""}` : "All Major Systems Go"}`;

  return {
    score,
    rating,
    criticalIssuesCount,
    warningIssuesCount,
    totalStops: stops.length,
    confirmedVenuesCount,
    penciledVenuesCount,
    unconfirmedVenuesCount,
    bookedLodgingCount,
    issues,
    summaryText
  };
}
