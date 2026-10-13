/**
 * Lodging OTA Deep-Link Builder Utility
 * Generates live affiliate/deep links for Expedia, Booking.com, and KOA Campgrounds
 * with pre-filled gig dates (night of show -> following morning).
 */

export interface LodgingLinkParams {
  city: string;
  state?: string;
  checkInDate?: string;  // YYYY-MM-DD
  checkOutDate?: string; // YYYY-MM-DD
  guests?: number;       // default: 4 (typical touring band)
  lodgingName?: string;  // specific hotel/motel name if known
  lodgingType?: string;  // e.g. "Van / RV Secure Parking", "Campground", "Hotel"
}

export interface LodgingLinksResult {
  expediaUrl: string;
  bookingUrl: string;
  koaUrl: string;
  googleHotelsUrl: string;
  checkInDate: string;
  checkOutDate: string;
  destinationDisplay: string;
}

/**
 * Computes check-in (gig night) and check-out (next morning) in YYYY-MM-DD format.
 */
export function getTourStopLodgingDates(dateStr?: string): { checkIn: string; checkOut: string } {
  if (!dateStr) {
    // Default to tomorrow and day after if no date provided
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    return {
      checkIn: tomorrow.toISOString().split("T")[0],
      checkOut: dayAfter.toISOString().split("T")[0]
    };
  }

  // Parse YYYY-MM-DD safely
  try {
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const inDate = new Date(year, month, day);
      
      const outDate = new Date(inDate);
      outDate.setDate(outDate.getDate() + 1);

      const pad = (n: number) => n.toString().padStart(2, "0");
      const checkInFormatted = `${inDate.getFullYear()}-${pad(inDate.getMonth() + 1)}-${pad(inDate.getDate())}`;
      const checkOutFormatted = `${outDate.getFullYear()}-${pad(outDate.getMonth() + 1)}-${pad(outDate.getDate())}`;

      return { checkIn: checkInFormatted, checkOut: checkOutFormatted };
    }
  } catch {
    // ignore
  }

  return {
    checkIn: dateStr,
    checkOut: dateStr
  };
}

/**
 * Builds live OTA deep-links for Expedia, Booking.com, and KOA Campgrounds.
 */
export function generateLodgingDeepLinks(params: LodgingLinkParams): LodgingLinksResult {
  const {
    city,
    state,
    checkInDate,
    checkOutDate,
    guests = 4,
    lodgingName
  } = params;

  const dates = getTourStopLodgingDates(checkInDate);
  const checkIn = checkInDate || dates.checkIn;
  const checkOut = checkOutDate || dates.checkOut;

  const destinationCityState = state ? `${city}, ${state}` : city;
  const destinationQuery = lodgingName ? `${lodgingName}, ${destinationCityState}` : destinationCityState;

  // 1. Expedia Deep Link:
  // Format: https://www.expedia.com/Hotel-Search?destination=[City, State]&startDate=[YYYY-MM-DD]&endDate=[YYYY-MM-DD]&adults=[guests]&d1=[YYYY-MM-DD]&d2=[YYYY-MM-DD]
  const expediaParams = new URLSearchParams({
    destination: destinationQuery,
    startDate: checkIn,
    endDate: checkOut,
    adults: guests.toString(),
    d1: checkIn,
    d2: checkOut
  });
  const expediaUrl = `https://www.expedia.com/Hotel-Search?${expediaParams.toString()}`;

  // 2. Booking.com Deep Link:
  // Format: https://www.booking.com/searchresults.html?ss=[Destination]&checkin=[YYYY-MM-DD]&checkout=[YYYY-MM-DD]&group_adults=[guests]&no_rooms=1
  const bookingParams = new URLSearchParams({
    ss: destinationQuery,
    checkin: checkIn,
    checkout: checkOut,
    group_adults: guests.toString(),
    no_rooms: "1"
  });
  const bookingUrl = `https://www.booking.com/searchresults.html?${bookingParams.toString()}`;

  // 3. KOA Campgrounds Deep Link:
  // Format: https://koa.com/find-a-koa/?location=[City, State]
  const koaParams = new URLSearchParams({
    location: destinationCityState
  });
  const koaUrl = `https://koa.com/find-a-koa/?${koaParams.toString()}`;

  // 4. Google Hotels Fallback:
  const googleHotelsUrl = `https://www.google.com/travel/hotels/${encodeURIComponent(destinationCityState)}?q=${encodeURIComponent(destinationQuery)}&dates=${checkIn},${checkOut}`;

  return {
    expediaUrl,
    bookingUrl,
    koaUrl,
    googleHotelsUrl,
    checkInDate: checkIn,
    checkOutDate: checkOut,
    destinationDisplay: destinationQuery
  };
}
